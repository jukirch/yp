// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The UI integration's SAPUI5 control which supports application embedding.
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/security/encodeXML",
    "sap/base/util/deepEqual",
    "sap/base/util/uid",
    "sap/base/util/UriParameters",
    "sap/m/MessagePopover",
    "sap/m/Text",
    "sap/ui/core/Component",
    "sap/ui/core/ComponentContainer",
    "sap/ui/core/Control",
    "sap/ui/core/Icon",
    "sap/ui/core/mvc/View",
    "sap/ui/core/routing/History",
    "sap/ui/Device",
    "sap/ui/thirdparty/jquery",
    "sap/ui/thirdparty/URI",
    "sap/ushell/ApplicationType",
    "sap/ushell/Config",
    "sap/ushell/EventHub",
    "sap/ushell/library", // css style dependency
    "sap/ushell/resources",
    "sap/ushell/System",
    "sap/ushell/User",
    "sap/ushell/utils",
    "sap/ushell/utils/UrlParsing",
    "sap/ui/core/Core",
    "sap/ui/thirdparty/hasher",
    "sap/ui/core/Configuration",
    "sap/ushell/components/container/IframePOSTUtils"
], function (
    Log,
    encodeXML,
    deepEqual,
    fnGetUid,
    UriParameters,
    MessagePopover,
    Text,
    Component,
    ComponentContainer,
    Control,
    Icon,
    View,
    History,
    Device,
    jQuery,
    URI,
    ApplicationType,
    Config,
    EventHub,
    ushellLibrary,
    resources,
    System,
    User,
    ushellUtils,
    oUrlParsing,
    Core,
    hasher,
    Configuration,
    IframePOSTUtils
) {
    "use strict";

    var sPREFIX = "sap.ushell.components.container.";
    var sCOMPONENT = sPREFIX + "ApplicationContainer";
    var sDIRTY_STATE_PREFIX = "sap.ushell.Container.dirtyState.";
    var mLogouts,
        oShellCommunicationHandlersObj,
        fnHandleMessageEvent,
        oMessageBrokerServicePromise;
    var bPluginsStatusChecked = false;
    var bKeepMessagesForPlugins = false;
    var arrMessagesForPlugins = [];
    var arrMessagesIdx = 0;
    var iIframeIdx = 0;

    // we have to cache the UI5 version first to have it available sync for the renderer
    let sUI5Version = null;
    let oUI5VersionPromise = ushellUtils.getUi5Version().then((sVersion) => {
        Log.debug(`Using ui5-version: ${sVersion}`, null, sCOMPONENT);
        sUI5Version = sVersion;
    });

    /**
     * Method to adapt the CrossApplicationNavigation service method
     * isUrlSupported to the request as issued by the SAP UI5 MessagePopover control
     *
     * @param {object} an object defined by the MessagePopover control containing the URL
     *  which should be validated and an ES6 promise object which has to be used to receive the validation results.
     *  This promise always needs to be resolved expecting { allowed: true|false } as a an argument to the resolve function.
     *
     * @since 1.30.0
     * @private
     */
    function adaptIsUrlSupportedResultForMessagePopover (oToBeValidated) {
        sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCAService) {
            oCAService.isUrlSupported(oToBeValidated.url).done(function () {
                oToBeValidated.promise.resolve({ allowed: true, id: oToBeValidated.id });
            }).fail(function () {
                oToBeValidated.promise.resolve({ allowed: false, id: oToBeValidated.id });
            });
        });
    }

    function initializeMessagePopover (eventData) {
        //Hook CrossApplicationNavigation URL validation logic into the sap.m.MessagePopover control
        var oMessageConceptDefaultHandlers = {
            asyncURLHandler: ApplicationContainer.prototype._adaptIsUrlSupportedResultForMessagePopover
        };
        if (MessagePopover && MessagePopover.setDefaultHandlers) {
            MessagePopover.setDefaultHandlers(oMessageConceptDefaultHandlers);
        }
        EventHub.emit("StepDone", eventData.stepName);
    }

    /*
    MessagePopover and its dependent controls resources are ~200K. In order to minimize core-min file it is bundled in core-ext file.
    Therefore we need to wait until all resorces are loaded, before we initialize the MessagePopover.
    */
    EventHub.once("initMessagePopover").do(initializeMessagePopover);

    mLogouts = new ushellUtils.Map();

    /**
     * Returns the logout handler function for the given container object.
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container object for which the logout handler is of interest
     * @returns {function}
     *   the logout handler function for the given container. If no handler is registered
     *   <code>undefined</code> is returned.
     * @private
     */
    function getLogoutHandler (oContainer) {
        return mLogouts.get(oContainer.getId());
    }

    function getCommunicationHandlers () {
        return oShellCommunicationHandlersObj;
    }

    /**
     * Returns a map of all search parameters present in the search string of the given URL.
     *
     * @param {string} sUrl
     *   the URL
     * @returns {object}
     *   in member <code>startupParameters</code> <code>map&lt;string, string[]}></code> from key to array of values,
     *   in members <code>sap-xapp-state</code> an array of Cross application Navigation state keys, if present
     *   Note that this key is removed from startupParameters!
     * @private
     */
    function getParameterMap (sUrl) {
        var mParams = UriParameters.fromURL(sUrl).mParams,
            xAppState = mParams["sap-xapp-state"],
            xAppStateData = mParams["sap-xapp-state-data"],
            oResult;
        delete mParams["sap-xapp-state"];
        delete mParams["sap-xapp-state-data"];
        oResult = {
            startupParameters: mParams
        };
        if (xAppStateData) {
            oResult["sap-xapp-state"] = xAppStateData;
        }
        if (xAppState) { // sap-xapp-state has priority over sap-xapp-state-data
            oResult["sap-xapp-state"] = xAppState;
        }
        return oResult;
    }

    /**
     * Returns a translated text from the resource bundle.
     *
     * @param {string} sKey
     *   the key in the resource bundle
     * @param {string[]} [aArgs]
     *   arguments to replace {0}..{9}
     * @returns {string}
     *   the translated text
     */
    function getTranslatedText (sKey, aArgs) {
        return resources.i18n.getText(sKey, aArgs);
    }

    /**
     * Creates some SAPUI5 control telling the user that an error has occured.
     *
     * @returns {sap.ui.core.Control}
     */
    function createErrorControl () {
        return new Icon({
            size: "2rem",
            src: "sap-icon://error",
            tooltip: ApplicationContainer.prototype._getTranslatedText("an_error_has_occured")
        });
    }

    /**
     * Destroys the child aggregation.
     */
    function destroyChild (oContainer) {
        var oChild = oContainer.getAggregation("child"),
            sComponentName;

        if (oChild instanceof ComponentContainer) {
            // name contains .Component - must be trimmed
            sComponentName = oChild.getComponentInstance().getMetadata().getName()
                .replace(/\.Component$/, "");
            Log.debug("unloading component " + sComponentName, null, sCOMPONENT);
        }
        oContainer.destroyAggregation("child");
    }

    /**
     * Creates a new SAPUI5 view or component for the given container and makes it a child. A view
     * is created if the name ends with ".view.(viewType)".
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information in the form "SAPUI5=<view_or_component_name>"
     * @returns {Promise}
     *   when resolved, the view, or some "error" control
     */
    function createUi5View (oContainer, sUrl, sAdditionalInformation) {
        return new Promise(function (fnResolve) {
            var iIndex,
                iLast,
                aMatches,
                oUrlData,
                sNamespace,
                oViewData = {},
                sViewName,
                sViewType;

            function setControlProps (oControl) {
                oControl.setWidth(oContainer.getWidth());
                oControl.setHeight(oContainer.getHeight());
                oControl.addStyleClass("sapUShellApplicationContainer");
                // Note: As a composite control, we need to aggregate our children (at least internally)!
                oContainer.setAggregation("child", oControl, true);
            }

            iIndex = sUrl.indexOf("?");
            if (iIndex >= 0) {
                // pass GET parameters of URL via view data
                oUrlData = ApplicationContainer.prototype._getParameterMap(sUrl);
                oViewData = oUrlData.startupParameters;
                sUrl = sUrl.slice(0, iIndex);
            }

            if (sUrl.slice(-1) !== "/") {
                sUrl += "/"; // ensure URL ends with a slash
            }

            if (/\.view\.(\w+)$/i.test(sAdditionalInformation)) {
                // ends with ".view.(viewType)": a view description
                // /SAPUI5=(namespace)/(viewName).view.(viewType)/
                aMatches = /^SAPUI5=(?:([^/]+)\/)?([^/]+)\.view\.(\w+)$/i.exec(sAdditionalInformation);
                if (!aMatches) {
                    Log.error("Invalid SAPUI5 URL", sAdditionalInformation, sCOMPONENT);
                    fnResolve(ApplicationContainer.prototype._createErrorControl());
                    return;
                }
                // determine namespace, view name, and view type
                sNamespace = aMatches[1];
                sViewName = aMatches[2];
                sViewType = aMatches[3].toUpperCase(); // @see sap.ui.core.mvc.ViewType

                if (sNamespace) {
                    // prefix view name with namespace
                    sViewName = sNamespace + "." + sViewName;
                } else {
                    // derive namespace from view name's "package"
                    iLast = sViewName.lastIndexOf(".");
                    if (iLast < 1) {
                        Log.error("Missing namespace", sAdditionalInformation, sCOMPONENT);
                        return ApplicationContainer.prototype._createErrorControl();
                    }
                    sNamespace = sViewName.slice(0, iLast);
                }
            } else {
                // a component
                sNamespace = sAdditionalInformation.replace(/^SAPUI5=/, "");
            }

            var paths = {};
            var sAmdNamespace = sNamespace.replace(/\./g, "/");
            paths[sNamespace] = sUrl + sAmdNamespace;
            sap.ui.loader.config({
                paths: paths
            });

            // destroy the child control before creating a new control with the same ID
            ApplicationContainer.prototype._destroyChild(oContainer);
            if (sViewName) {
                if (oContainer.getApplicationConfiguration()) {
                    oViewData.config = oContainer.getApplicationConfiguration();
                }
                View.create({
                    id: oContainer.getId() + "-content",
                    type: sViewType,
                    viewData: oViewData || {},
                    viewName: sViewName
                })
                    .then(function (oControl) {
                        oContainer.fireEvent("applicationConfiguration");
                        setControlProps(oControl);
                        fnResolve(oControl);
                    });
            } else {
                Log.debug("loading component " + sNamespace, null, sCOMPONENT);
                // presence of startupParameters member indicates root component, thus
                // we assure it's always filled with at least empty object
                var componentData = oUrlData ? {
                    startupParameters: oUrlData.startupParameters
                } : { startupParameters: {} };
                if (oUrlData && oUrlData["sap-xapp-state-data"]) {
                    componentData["sap-xapp-state"] = oUrlData["sap-xapp-state-data"];
                }
                if (oUrlData && oUrlData["sap-xapp-state"]) { // sap-xapp-state has priority over sap-xapp-state-data
                    componentData["sap-xapp-state"] = oUrlData["sap-xapp-state"];
                }
                if (oContainer.getApplicationConfiguration()) {
                    componentData.config = oContainer.getApplicationConfiguration();
                }

                Component.create({
                    id: oContainer.getId() + "-component",
                    componentData: componentData,
                    name: sNamespace
                })
                    .then(function (oComponent) {
                        //TODO ensure event is fired even in error case (try/catch)
                        oContainer.fireEvent("applicationConfiguration",
                            { configuration: oComponent.getManifestEntry("/sap.ui5/config") });
                        var oNewControl = new ComponentContainer({
                            id: oContainer.getId() + "-content",
                            component: oComponent
                        });
                        setControlProps(oNewControl);
                        fnResolve(oNewControl);
                    });
            }
        });
    }

    /**
     * publish an external event asynchronously via the event bus
     * The channel id is hard coded to sap.ushell
     * @param {string} sEventName event name
     * @param {object} oData event parameters
     */
    function publishExternalEvent (sEventName, oData) {
        setTimeout(function () {
            Core.getEventBus().publish("sap.ushell", sEventName, oData);
        }, 0);
    }

    /**
     * Creates a new SAPUI5 component for the given container and makes it a child.
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   the container
     * @param {string} sUrl
     *   the base URL
     * @param {string} sComponentName the component name
     * @returns {{oControl: object, oPromise: Promise}}
     *   the control already created or the promise to the control to be created
     */
    function createUi5Component (oContainer, sUrl, sComponentName) {
        var that = this,
            oDeferred,
            oResult = {
                oControl: undefined,
                oPromise: undefined
            },
            iIndex,
            oComponentContainer,
            oUrlData,
            oComponentData = { startupParameters: {} },
            oComponentConfig,
            oComponentHandle = oContainer.getComponentHandle(),
            oPluginLoadingPromise,
            sPluginLoadingPromiseState;

        function setControlProps (oComponent) {
            // TODO ensure event is fired even in error case (try/catch)
            oContainer.fireEvent("applicationConfiguration", { configuration: oComponent.getManifestEntry("/sap.ui5/config") });
            oComponentContainer = new ComponentContainer({
                id: oContainer.getId() + "-content",
                component: oComponent
            });

            oComponentContainer.setHeight(oContainer.getHeight());
            oComponentContainer.setWidth(oContainer.getWidth());
            oComponentContainer.addStyleClass("sapUShellApplicationContainer");
            oContainer._disableRouterEventHandler = ApplicationContainer.prototype._disableRouter.bind(that, oComponent);
            Core.getEventBus().subscribe("sap.ushell.components.container.ApplicationContainer", "_prior.newUI5ComponentInstantion", oContainer._disableRouterEventHandler);

            // Note: As a composite control, we need to aggregate our children (at least internally)!
            oContainer.setAggregation("child", oComponentContainer, true);

            sap.ushell.Container.getServiceAsync("PluginManager").then(function (oPluginManager) {
                oPluginLoadingPromise = oPluginManager.getPluginLoadingPromise("RendererExtensions");
                sPluginLoadingPromiseState = oPluginLoadingPromise && oPluginLoadingPromise.state();
                if (sPluginLoadingPromiseState === "pending") {
                    oPluginLoadingPromise
                        .done(function () {
                            ApplicationContainer.prototype._publishExternalEvent("appComponentLoaded", { component: oComponent });
                        })
                        .fail(function () {
                            ApplicationContainer.prototype._publishExternalEvent("appComponentLoaded", { component: oComponent });
                        });
                }
                if (sPluginLoadingPromiseState === "resolved" || sPluginLoadingPromiseState === "rejected") {
                    ApplicationContainer.prototype._publishExternalEvent("appComponentLoaded", { component: oComponent });
                }
            });

            return oComponentContainer;
        }

        iIndex = sUrl.indexOf("?");
        if (iIndex >= 0) {
            // pass GET parameters of URL via component data as member startupParameters and as xAppState
            // (to allow blending with other oComponentData usage, e.g. extensibility use case)
            oUrlData = ApplicationContainer.prototype._getParameterMap(sUrl);
            oComponentData = {
                startupParameters: oUrlData.startupParameters
            };
            if (oUrlData["sap-xapp-state-data"]) {
                oComponentData["sap-xapp-state"] = oUrlData["sap-xapp-state-data"];
            }
            if (oUrlData["sap-xapp-state"]) { // sap-xapp-state has priority over sap-xapp-state-data
                oComponentData["sap-xapp-state"] = oUrlData["sap-xapp-state"];
            }
            sUrl = sUrl.slice(0, iIndex);
        }

        if (oContainer.getApplicationConfiguration()) {
            oComponentData.config = oContainer.getApplicationConfiguration();
        }

        if (sUrl.slice(-1) !== "/") {
            sUrl += "/"; // ensure URL ends with a slash
        }

        // destroy the child control before creating a new control with the same ID
        ApplicationContainer.prototype._destroyChild(oContainer);

        oComponentConfig = {
            id: oContainer.getId() + "-component",
            name: sComponentName,
            componentData: oComponentData
        };

        Log.debug("Creating component instance for " + sComponentName, JSON.stringify(oComponentConfig), sCOMPONENT);

        Core.getEventBus().publish("sap.ushell.components.container.ApplicationContainer", "_prior.newUI5ComponentInstantion", {
            name: sComponentName
        });

        if (oComponentHandle) {
            var oComponent = oComponentHandle.getInstance(oComponentConfig);
            oResult.oControl = setControlProps(oComponent);
        } else {
            oDeferred = new jQuery.Deferred();

            var paths = {};
            var sAmdComponentName = sComponentName.replace(/\./g, "/");
            paths[sAmdComponentName] = sUrl;
            sap.ui.loader.config({
                paths: paths
            });

            Log.error("No component handle available for '" + sComponentName + "'; fallback to component.load()", null, sCOMPONENT);

            Component.create({
                id: oContainer.getId() + "-component",
                name: sComponentName,
                manifest: false,
                componentData: oComponentData
            })
                .then(function (oComponent) {
                    oDeferred.resolve(setControlProps(oComponent));
                });
            oResult.oPromise = oDeferred.promise();
        }
        return oResult;
    }

    /**
     * Invoke <code>getRouter.stop()<code> on the oComponentAn event handler for the onNewAppInstantiated event
     * @param {object} oComponent
     *   a SAPUI5 Component instance
     */
    function disableRouter (oComponent) {
        var rt;
        if ((oComponent instanceof Component) && (typeof oComponent.getRouter === "function")) {
            rt = oComponent.getRouter();
            if (rt && (typeof rt.stop === "function")) {
                Log.info("router stopped for instance " + oComponent.getId());
                rt.stop();
            }
        }
    }

    /**
     * Creates a system object that describes the URL's server.
     * @param {string} sUrl
     *   the URL
     * @param {object}
     *   the system object with <code>alias</code>, <code>baseUrl</code> describing the URL's
     *   server and <code>client</code> the client from the request property
     *   <code>sap-client</code>.
     */
    function createSystemForUrl (sUrl) {
        var oAnchor = document.createElement("a"),
            sClient = UriParameters.fromURL(sUrl).get("sap-client"),
            sBase;

        oAnchor.href = sUrl;
        sBase = oAnchor.protocol + "//" + oAnchor.host;
        return new System({
            alias: sClient ? sBase + "?sap-client=" + sClient : sBase,
            baseUrl: sBase,
            client: sClient || undefined,
            platform: "abap"
        });
    }

    /**
     * Determine if the source of a received postMessage can be considered as trusted. We consider
     * the content window of the application container's iframe as trusted
     *
     * @param {object} oContainer
     *   the application container instance
     * @param {object} oMessage
     *   the postMessage event object
     * @returns {boolean}
     *   true if source is considered to be trustworthy
     * @private
     * @since 1.24
     */
    function isTrustedPostMessageSource (oContainer, oMessage) {
        var bTrusted = false,
            oDomRef = oContainer.getDomRef(),
            oUri,
            sOrigin;

        // In case the app runs in iFrame, we need to change the position of the oDomRef from the (parent) div element to the IFrame element
        if (oContainer.getIframeWithPost() === true && oDomRef && oDomRef.getAttribute && oDomRef.getAttribute("sap-iframe-app") == "true") {
            oDomRef = jQuery("#" + oDomRef.getAttribute("id") + "-iframe")[0];
        }

        if (oDomRef) {
            // In case the app runs in iFrame we trust the iframe itself and all the URLs from the same origin
            // as configured in iFrame.
            oUri = URI(oContainer._getIFrameUrl(oDomRef) || window.location && window.location.href || "");
            sOrigin = oUri.protocol() + "://" + oUri.host();

            bTrusted = (oMessage.source === oDomRef.contentWindow) || (oMessage.origin === sOrigin);
        }

        return bTrusted;
    }

    /**
     * Returns the IFrame rendered by this application container.
     *
     * @returns {object}
     *    The iFrame DOM element or null if this cannot be retrieved.
     */
    function getIFrame () {
        var oIFrame = this.getDomRef();
        if (!oIFrame || oIFrame.tagName !== "IFRAME") {
            if (this.getIframeWithPost() === true && oIFrame && oIFrame.getAttribute && oIFrame.getAttribute("sap-iframe-app") == "true") {
                return jQuery("#" + oIFrame.getAttribute("id") + "-iframe")[0];
            }
            return null;
        }
        return oIFrame;
    }

    /**
     * Returns the IFrame URL (both in a simple iframe or in iframe with form+post)
     *
     * @param {object} oIFrame
     *   optional. the iframe DOM element.
     * @returns {string}
     *    The iFrame URL.
     */
    function getIFrameUrl (oIFrame) {
        var sUrl;

        if (oIFrame === undefined) {
            oIFrame = this._getIFrame();
        }

        if (this.getIframeWithPost() === true) {
            sUrl = jQuery("#" + oIFrame.getAttribute("id").replace("-iframe", "-form"))[0].action;
            if (sUrl === undefined && (new URI()).query(true).hasOwnProperty("sap-isolation-enabled")) {
                sUrl = oIFrame.src;
            }
        } else {
            sUrl = oIFrame.src;
        }

        return sUrl;
    }

    /**
     * Event handler receiving post message events
     *
     * @param {object} oContainer
     *   the current application container.
     * @param {Event} oMessage
     *   the received postMessage event
     *
     * @private
     * @since 1.21.2
     *
     */
    function handleMessageEvent (oContainer, oMessage) {
        //first, check that the messages arrived from the iframe this listener was created for
        // if (oContainer && oContainer._getIFrame && oContainer._getIFrame() && oContainer._getIFrame().contentWindow !== oMessage.source) {
        //     return;
        // }

        var sUi5ComponentName = oContainer && oContainer.getUi5ComponentName && oContainer.getUi5ComponentName(),
            oMessageData = oMessage.data,
            bIframeIsValidMsg = typeof oMessageData === "string" && oMessageData.indexOf("sap.ushell.appRuntime.iframeIsValid") > 0;

        if (oContainer && !oContainer.getActive() && bIframeIsValidMsg !== true) {
            Log.debug(
                "Skipping handling of postMessage 'message' event with data '" + JSON.stringify(oMessageData) + "' on inactive container '" + oContainer.getId() + "'",
                "Only active containers can handle 'message' postMessage event",
                "sap.ushell.components.container.ApplicationContainer"
            );
            return;
        }

        if (typeof sUi5ComponentName === "string") {
            Log.debug(
                "Skipping handling of postMessage 'message' event with data '" + JSON.stringify(oMessageData) + "' on container of UI5 application '" + sUi5ComponentName + "'",
                "Only non UI5 application containers can handle 'message' postMessage event",
                "sap.ushell.components.container.ApplicationContainer"
            );
            return;
        }

        var oMessageStatus = {
            bPluginsStatusChecked: bPluginsStatusChecked,
            bKeepMessagesForPlugins: bKeepMessagesForPlugins,
            bApiRegistered: true
        };

        fnHandleMessageEvent(oContainer, oMessage, oMessageStatus);
        ApplicationContainer.prototype._handlePostMessagesForPluginsPostLoading(oContainer, oMessage, oMessageStatus);
    }

    /**
     * Handle post message requests that could not be processed before the
     * 'RendererExtensions' plugins finished loading.
     * The function collects that unprocessed messages while the plugins
     * are still loaded. After the plugins finished loading, we run
     * on the queue and process the post messages again, and after
     * that we disable the mechanism and empty the queue.
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   application container received the post message
     * @param {object} oMessage
     *   the post message received
     * @param {object} oMessageStatus
     *   processing result status of the message
     *
     * @private
     */
    function handlePostMessagesForPluginsPostLoading (oContainer, oMessage, oMessageStatus) {
        var oPluginPromise,
            sPluginPromiseState;

        if (oMessageStatus.bApiRegistered !== false) {
            return;
        }

        sap.ushell.Container.getServiceAsync("PluginManager").then(function (oPluginManager) {
            if (bPluginsStatusChecked === false) {
                bPluginsStatusChecked = true;
                oPluginPromise = oPluginManager.getPluginLoadingPromise("RendererExtensions");
                sPluginPromiseState = oPluginPromise && oPluginPromise.state();
                if (sPluginPromiseState === "pending") {
                    bKeepMessagesForPlugins = true;
                    oPluginPromise.always(function () {
                        var oMsgObj;
                        bKeepMessagesForPlugins = false;
                        Log.debug("Processing post messages queue after 'RendererExtensions' plugins loaded, queue size is: "
                            + arrMessagesForPlugins.length,
                            null,
                            "sap.ushell.components.container.ApplicationContainer");
                        for (var i = 0; i < arrMessagesForPlugins.length; i++) {
                            oMsgObj = arrMessagesForPlugins[i];
                            try {
                                ApplicationContainer.prototype._handleMessageEvent.call(oMsgObj.that, oMsgObj.oContainer, oMsgObj.oMessage);
                            } catch (ex) {
                                Log.error(ex.message || ex, null, "sap.ushell.components.container.ApplicationContainer");
                            }
                        }
                        arrMessagesForPlugins = [];
                    });
                }
            }

            if (bKeepMessagesForPlugins === true) {
                arrMessagesForPlugins.push({
                    index: arrMessagesIdx++,
                    that: this,
                    oContainer: oContainer,
                    oMessage: oMessage
                });
            }
        });
    }

    /**
     * Reset all global variables related to the messages processing when
     * plugins are not loaded yet.
     * This function is called from the qunit only.
     *
     * @private
     */
    function resetPluginsLoadIndications () {
        bPluginsStatusChecked = false;
        bKeepMessagesForPlugins = false;
        arrMessagesForPlugins = [];
        arrMessagesIdx = 0;
    }

    /**
     * Logout Event Handler.
     * Calls the logout URL when the NWBC is used in the canvas.
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *   application container having the NWBC iframe
     * @param {sap.ui.base.Event} oEvent
     *   oEvent.preventDefault() is called to let the caller know that the
     *   following redirect has to be deferred in order get the NWBC logout done.
     *
     * @private
     */
    function logout (oContainer, oEvent) {
        var oIframe = oContainer._getIFrame(),
            sApplicationType = oContainer.getApplicationType();

        if (ushellUtils.isApplicationTypeEmbeddedInIframe(oContainer.getApplicationType(sApplicationType)) && oIframe) {
            var oUri = new URI(oContainer._getIFrameUrl(oIframe));
            var targetDomain = oUri.protocol() + "://" + oUri.host();

            oIframe.contentWindow.postMessage(JSON.stringify(
                { action: "pro54_disableDirtyHandler" }
            ), targetDomain);
            // tell caller that at least one NWBC needs some time to receive a message
            oEvent.preventDefault();
        }
    }

    /**
     * Renders the given child control inside a DIV representing the given container.
     *
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     *     the application container which is "replaced" by the error control
     * @param {sap.ui.core.Control} [oChild]
     */
    function renderControlInDiv (oRenderManager, oContainer, oChild) {
        oRenderManager
            .openStart("div", oContainer)
            .accessibilityState(oContainer)
            .class("sapUShellApplicationContainer")
            .style("height", oContainer.getHeight())
            .style("width", oContainer.getWidth())
            .openEnd();

        if (oChild) {
            oRenderManager.renderControl(oChild);
        }
        oRenderManager.close("div");
    }

    /**
     * Check if adjustNwbcUrl needs to be called, and if needed - call it
     *
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     * @param {string} sUrl
     *   the base URL
     * @private
     */
    function checkNwbcUrlAdjustment (oContainer, sApplicationType, sUrl, bForFramelessWindow) {
        if (bForFramelessWindow === undefined) {
            bForFramelessWindow = false;
        }
        if (ushellUtils.isApplicationTypeEmbeddedInIframe(sApplicationType, true) || (oContainer && ushellUtils.isApplicationTypeEmbeddedInIframe(oContainer.getFrameworkId()))) {
            var sTargetNavigationMode = oContainer && oContainer.getTargetNavigationMode();

            // amend already resolved url with additional parameters
            sUrl = ApplicationContainer.prototype._adjustNwbcUrl(sUrl, sApplicationType, sTargetNavigationMode, oContainer && oContainer.getStatefulType() > 0, bForFramelessWindow);

            // add this container to list of NWBC-containing containers
            if (oContainer && bForFramelessWindow === false) {
                ushellUtils.localStorageSetItem(oContainer.globalDirtyStorageKey,
                    sap.ushell.Container.DirtyState.INITIAL);
            }
        }

        return sUrl;
    }

    /**
     * Amends the NavTargetResolution response with theme, sap-ushell-version, accessibility and post parameters if present.
     * Theme and accessibility information is only added for the NWBC application type.
     *
     * @param {string} sUrl
     *   Already resolved url (NavTargetResolution response)
     * @param {string} sUrlApplicationType
     *   The application type of <code>sUrl</code>
     * @param {string} sTargetNavigationMode
     *   The (external) navigation mode to add in the sap-target-navmode parameter
     * @returns {string}
     *   Modified url having additional parameters
     * @private
     */
    function adjustNwbcUrl (sUrl, sUrlApplicationType, sTargetNavigationMode, bReuseSession, bForFramelessWindow) {
        if (bForFramelessWindow === undefined) {
            bForFramelessWindow = false;
        }
        var sTheme;
        function getAccessibility () {
            var vUrl = ushellUtils.getParameterValueBoolean("sap-accessibility");
            if (vUrl !== undefined) {
                return vUrl;
            }
            return sap.ushell.Container.getUser().getAccessibilityMode();
        }
        function getTheme () {
            var oResolvedUrlParameters = UriParameters.fromURL(sUrl) || { mParams: {} };

            // To take care of the precedence of the intent over UI5 configuration
            if (oResolvedUrlParameters.mParams["sap-theme"] === undefined) {
                return sap.ushell.Container.getUser()
                    .getTheme(User.prototype.constants.themeFormat.NWBC);
            }
            return undefined;
        }
        function getStatistics () {
            var bAddStatistics = false,
                oResolvedUrlParameters = UriParameters.fromURL(sUrl) || { mParams: {} };

            // To take care of the precedence of the intent over UI5 configuration
            bAddStatistics = Configuration.getStatisticsEnabled()
                && oResolvedUrlParameters.mParams["sap-statistics"] === undefined;
            return bAddStatistics;
        }
        function getInAppState () {
            var sHash = hasher && hasher.getHash(),
                sKey = "",
                aParams;

            if (sHash && sHash.length > 0 && sHash.indexOf("sap-iapp-state=") > 0) {
                aParams = /(?:sap-iapp-state=)([^&/]+)/.exec(sHash);
                if (aParams && aParams.length === 2) {
                    sKey = aParams[1];
                }
            }

            return sKey;
        }
        function getDensity () {
            var sVal = "";
            var bIsCompact = (!!jQuery("body.sapUiSizeCompact").length);
            var bIsCozy = (!!jQuery("body.sapUiSizeCozy").length);

            if (bIsCompact === true) {
                sVal = "0";
            } else if (bIsCozy) {
                sVal = "1";
            }

            return sVal;
        }

        // force IE to edge mode
        sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
        sUrl += "sap-ie=edge";

        sTheme = getTheme();
        if (sTheme) {
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-theme=" + encodeURIComponent(sTheme);
            // note, we do not replace existing parameters
        }

        if (getAccessibility()) {
            // propagate accessibility mode
            // Note: This is handled by the WebGUI/WDA framework which expects a value of "X"!
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-accessibility=X";
            // note, we do not replace existing parameters
        }
        if (getStatistics()) {
            // propagate statistics = true
            // Note: This is handled by the IFC handler on ABAP, which expects a value of "true" (not "X")
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-statistics=true";
            // note, we do not replace existing parameters
        }

        var sDensity = getDensity();
        if (sDensity && sDensity.length > 0) {
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-touch=" + sDensity;
        }

        if (bForFramelessWindow === false) {
            if (sTargetNavigationMode) {
                sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
                sUrl += "sap-target-navmode=" + encodeURIComponent(sTargetNavigationMode);
                // note, we do not replace existing parameters
            }

            if (sUrlApplicationType === "TR" || sUrlApplicationType === "GUI") {
                sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
                sUrl += "sap-keepclientsession=2";
            } else if (bReuseSession) {
                sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
                sUrl += "sap-keepclientsession=1";
            }

            var sKey = getInAppState();
            if (sKey && sKey.length > 0) {
                sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
                sUrl += "sap-iapp-state=" + sKey;
            }

            var sessionTimeout = 0;
            if (Config.last("/core/shell/sessionTimeoutIntervalInMinutes") > 0) {
                sessionTimeout = Config.last("/core/shell/sessionTimeoutIntervalInMinutes");
            }
            sUrl += sUrl.indexOf("?") >= 0 ? "&" : "?";
            sUrl += "sap-ushell-timeout=" + sessionTimeout;

            // The renderer "waits" for the ui5 version to be available
            return ushellUtils.appendSapShellParamSync(sUrl, sUrlApplicationType, sUI5Version);
        }
        return sUrl;
    }

    /**
     * Renders the SAPUI5 component with the given name and URL. If the child aggregation is already set and no properties have changed,
     * the component is not recreated.
     */
    function renderUi5Component (oRenderManager, oContainer, sUrl, sComponentName) {
        var oChild = oContainer.getAggregation("child"),
            oNewRenderManager,
            oResult;

        if (!oChild || oContainer._bRecreateChild) {
            oResult = ApplicationContainer.prototype._createUi5Component(oContainer, sUrl, sComponentName);
            if (oResult.oControl !== undefined) {
                //the control was already created, not need to wait for async result
                oContainer._bRecreateChild = false;
                ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oResult.oControl);
            } else {
                oContainer.oDeferredControlCreation = new jQuery.Deferred();
                ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer);
                oResult.oPromise.then(function (oControl) {
                    oContainer._bRecreateChild = false;
                    oNewRenderManager = Core.createRenderManager();
                    oNewRenderManager.renderControl(oControl);
                    oNewRenderManager.flush(jQuery("#" + oContainer.getId())[0]);
                    oNewRenderManager.destroy();
                    oContainer.oDeferredControlCreation.resolve();
                });
            }
        } else {
            ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oChild);
        }
    }

    /**
     * Sets the property with the specified key and value and sets the flag _bPropertyChanged to true
     */
    function setProperty (oContainer, sKey, vValue) {
        var vOldValue = oContainer.getProperty(sKey);

        if (deepEqual(vOldValue, vValue)) {
            return;
        }

        oContainer.setProperty(sKey, vValue);
        oContainer._bRecreateChild = true;
    }

    /**
     * Renders the given container control with the help of the given render manager using the given
     * attributes.
     *
     * @param {sap.ui.core.RenderManager} oRenderManager
     * @param {sap.ushell.components.container.ApplicationContainer} oContainer
     * @param {ApplicationType.enum} sApplicationType
     *   the application type
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information in the form "SAPUI5=&lt;view name&gt;"
     */
    function render (oRenderManager, oContainer, sApplicationType, sUrl, sAdditionalInformation) {
        var fnLogout,
            bPostMechanismEnabled;
        var bForceOpenWithPost = false;

        // remove container from list of NWBC-containing containers
        // (if this container was an NWBC container before)
        localStorage.removeItem(oContainer.globalDirtyStorageKey);

        oContainer.oDeferredControlCreation = undefined;

        // render as SAPUI5 component if specified in additionalInformation
        if (sAdditionalInformation &&
            sAdditionalInformation.indexOf("SAPUI5.Component=") === 0 &&
            sApplicationType === ApplicationType.URL.type) {

            renderUi5Component(oRenderManager, oContainer, sUrl, sAdditionalInformation.replace(/^SAPUI5\.Component=/, ""));
            return;
        }

        // render as SAPUI5 view if specified in additionalInformation
        if (sAdditionalInformation
            && sAdditionalInformation.indexOf("SAPUI5=") === 0
            && sApplicationType === ApplicationType.URL.type) {
            ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, undefined, "open");
            oContainer.oDeferredControlCreation = new jQuery.Deferred();
            ApplicationContainer.prototype._createUi5View(oContainer, sUrl, sAdditionalInformation).then(function (oControl) {
                var oNewRenderManager,
                    oDivElement = jQuery("#" + oContainer.getId());
                if (oDivElement && oDivElement.length > 0) {
                    oNewRenderManager = Core.createRenderManager();
                    oNewRenderManager.renderControl(oControl);
                    oNewRenderManager.flush(jQuery("#" + oContainer.getId())[0]);
                    oNewRenderManager.destroy();
                } else {
                    oRenderManager.renderControl(oControl);
                }
                oContainer.oDeferredControlCreation.resolve();
            });
            ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, undefined, "close");
            return;
        }
        Log.debug("Not resolved as \"SAPUI5.Component=\" or \"SAPUI5=\" , " +
            "will attempt to load into iframe " + sAdditionalInformation);

        if (!oContainer.getActive()) {
            Log.debug("Skipping rendering container iframe", "Container '" + oContainer.getId() + "' is inactive");
            return;
        }

        try {
            sUrl = oContainer.getFrameSource(sApplicationType, sUrl);
        } catch (ex) {
            Log.error(ex.message || ex, null, sCOMPONENT);
            oContainer.fireEvent("applicationConfiguration");
            oRenderManager.renderControl(ApplicationContainer.prototype._createErrorControl());
            return;
        }

        if (sap.ushell.Container) {
            fnLogout = ApplicationContainer.prototype._getLogoutHandler(oContainer);
            if (!fnLogout) {
                if (ushellUtils.isApplicationTypeEmbeddedInIframe(sApplicationType)) {
                    // create only for NWBC if not already existing
                    fnLogout = ApplicationContainer.prototype._logout.bind(null, oContainer);
                    mLogouts.put(oContainer.getId(), fnLogout);
                    sap.ushell.Container.attachLogoutEvent(fnLogout);
                    sap.ushell.Container.addRemoteSystem(ApplicationContainer.prototype._createSystemForUrl(sUrl));
                }
            } else if (!ushellUtils.isApplicationTypeEmbeddedInIframe(sApplicationType)) {
                // detach if not used *anymore*
                sap.ushell.Container.detachLogoutEvent(fnLogout);
                mLogouts.remove(oContainer.getId());
            }
        }

        sUrl = oContainer._checkNwbcUrlAdjustment(oContainer, sApplicationType, sUrl);

        /*
        generic mechanism for allowing to pass parameters to the iframe URL
         */
        var urlParams = UriParameters.fromURL(document.URL);
        if (urlParams.has("sap-iframe-params")) {
            var sIframeParams = urlParams.get("sap-iframe-params") || "",
                aParams = sIframeParams.split(",");

            if (aParams.length > 0) {
                var tmpURI = new URI(sUrl);
                aParams.forEach(function (sParam) {
                    if (sParam && sParam.length > 0) {
                        if (urlParams.has(sParam)) {
                            tmpURI.addQuery(sParam, urlParams.get(sParam));
                        }
                    }
                });
                sUrl = tmpURI.toString();
            }
        }

        //add the url origin to the allowed origins list of the message broker
        if (oMessageBrokerServicePromise) {
            oMessageBrokerServicePromise.then(function (oMessageBrokerService) {
                oMessageBrokerService.addAcceptedOrigin(new URI(sUrl).origin());
            });
        }

        //preperations to open the iframe with POST (vs the default GET)
        if (sApplicationType === "TR") {
            oContainer.setProperty("iframePostAllParams", true, true);
        }

        bPostMechanismEnabled = Config.last("/core/shell/enableOpenIframeWithPost");
        if (bPostMechanismEnabled === undefined) {
            bPostMechanismEnabled = true;
        }

        if (urlParams.get("sap-post") === "false") {
            bPostMechanismEnabled = false;
        } else if (window.QUnit !== undefined) {
            bPostMechanismEnabled = oContainer.getIframeWithPost();
        }
        if (bPostMechanismEnabled === true && oContainer.getOpenWithPostByAppParam() === false) {
            bPostMechanismEnabled = false;
        }
        if (urlParams.get("sap-post") === "true") {
            bForceOpenWithPost = true;
        }

        //This block is relevant for "Starting WebGUI/WebDynpro apps with a POST" BLI since 1.68
        if (bPostMechanismEnabled === true &&
            (sApplicationType === "NWBC" || sApplicationType === "TR" || sApplicationType === "WDA" || sApplicationType === "WCF") || bForceOpenWithPost === true) {
            IframePOSTUtils.renderIframeWithPOST(oRenderManager, oContainer, sUrl, ++iIframeIdx);
            return;
        }

        // embed URL via <IFRAME>
        oContainer.fireEvent("applicationConfiguration");
        oRenderManager
            .openStart("iframe", oContainer)
            .accessibilityState(oContainer)
            .attr("src", sUrl)
            .attr("title", resources.i18n.getText("AppilcationContainer.IframeTitle"))
            .attr("sap-iframe-idx", ++iIframeIdx)
            .class("sapUShellApplicationContainer")
            .style("height", oContainer.getHeight())
            .style("width", oContainer.getWidth());

        if (Config.last("/core/shell/enableFeaturePolicyInIframes") === true) {
            oRenderManager.attr("allow", ushellUtils.getIframeFeaturePolicies());
        }
        oRenderManager
            .openEnd()
            .close("iframe");
    }

    /**
     * Creates a new container control embedding the application with the given URL. The default
     * application type is "URL" and allows to embed web applications into an <code>IFRAME</code>.
     * By default, the container is visible and occupies the whole width and height of its parent.
     *
     * @class A container control capable of embedding a variety of application types.
     * <p>
     * <strong>Experimental API: This container is still under construction, so some
     * implementation details can be changed in future.</strong>
     * </p><p>
     * <b>Note:</b> The browser does not allow to move an <code>IFRAME</code> around in the DOM
     * while keeping its state. Thus every rerendering of this control necessarily resets the
     * embedded web application to its initial state!
     * </p><p>
     * <b>Note:</b> You <b>must</b> <code>exit</code> the control when you no longer need it.
     *
     * </p><p>
     * <b>Embedding SAPUI5 Components:</b>
     * </p><p>
     * The container is able to embed an SAPUI5 component. It is embedded directly into the page,
     * no <code>IFRAME</code> is used.
     * </p><p>
     * SAPUI5 components are described with <code>applicationType</code> "URL", a base URL and the
     * component name in <code>additionalInformation</code>. The format is
     * <code>SAPUI5=<i>componentNamespace</i></code>. The application container will register a
     * module path for the URL with the component's namespace.
     * </p><p>
     * The query parameters from the URL will be passed into the component. They can be retrieved
     * using the method <code>getComponentData()</code>. Query parameters are always passed as
     * arrays (see example 2 below).
     * </p><p>
     * <b>Example 1:</b> Let <code>url</code> be "http://anyhost:1234/path/to/app" and
     * <code>additionalInformation</code> be "SAPUI5=some.random.package". Then the
     * container registers the path "http://anyhost:1234/path/to/app/some/random/package" for the
     * namespace "some.random.package", loads and creates "some.random.package.Component".
     * </p><p>
     * <b>Example 2:</b> Let <code>url</code> be "http://anyhost:1234/?foo=bar&foo=baz&bar=baz".
     * Then the <code>componentData</code> object will be
     * <code>{foo: ["bar", "baz"], bar: ["baz"]}</code>.
     * </p><p>
     * <b>Warning:</b> The container control embeds a <i>component</i> only. This can only work if
     * this component is fully encapsulated and properly declares all dependencies in its metadata
     * object. If you want to support that your component can be embedded into a shell using this
     * container, you have to prepare it accordingly:
     * <ul>
     * <li>The container control can only embed components that originate on the same server as the
     * shell due to the browser's same origin policy. Consider using an SAP Web Dispatcher if this
     * is not the case.
     * <li>If your component relies on some additional Javascript, declare the dependencies to
     * libraries or other components in the component's metadata object.
     * <li>Do <i>not</i> use <code>jQuery.sap.registerModulePath()</code> with a relative URL. The
     * base for this relative URL is the web page. And this page is the shell when embedding the
     * component via the container, not the page you used when developing the component.
     * <li>If your component needs additional styles, declare them using the <code>includes</code>
     * property of the component metadata object.
     * <li> Consider calling <code>jQuery.sap.getModulePath(&lt;componentName&gt;)</code> to
     * determine the root path of your component.
     * <li>If any of these requirements is not met, it is still possible to embed this view with
     * its own page using <code>applicationType="URL"</code>, no <code>additionalInformation</code>
     * and the URL of the web page in <code>url</code>. Then of course it is embedded using an
     * <code>IFRAME</code>. This has many restrictions, especially the resource-based navigation
     * using hash changes will not be supported.
     * </ul>
     *
     * </p><p>
     * <b>Embedding SAPUI5 Views</b>
     * <p>
     * Embedding views is <strong>deprecated</strong> and might not be supported in future versions.
     * </p>
     * <p>
     * It is also possible to embed a SAPUI5 view. It is embedded directly into the page, no
     * <code>IFRAME</code> is used.
     * </p><p>
     * SAPUI5 views are described with <code>applicationType</code> "URL", a base URL and the view
     * description in <code>additionalInformation</code>. The format is
     * <code>SAPUI5=<i>namespace</i>.<i>viewName</i>.view.<i>viewType</i></code>. From
     * this information the module path and the view URL is determined. Request parameters present
     * in the URL will be passed to the created view and can be accessed via
     * <code>sap.ui.core.mvc.View#getViewData()</code>. The object passed to the view data is the
     * same as describe for the component data above.
     * </p><p>
     * <b>Warning:</b> The container control embeds a <i>view</i> only. So similar restrictions
     * as for components apply. Since the view has no metadata object to describe dependencies you
     * will have to use <code>sap.ui.require()</code> to load needed modules.
     *
     * @extends sap.ui.core.Control
     * @name sap.ushell.components.container.ApplicationContainer
     * @since 1.15.0
     *
     * @property {string} [additionalInformation=""]
     *   Additional information about the application. Currently this is used to describe a SAPUI5
     *   component or a view in a SAPUI5 application.
     * @property {object} [application]
     *   The application descriptor as received from the start-up service. If an application is
     *   given the properties <code>url</code>, <code>applicationType</code> and
     *   <code>additionalInformation</code> are taken from the application and <i>not</i> from the
     *   control properties.
     * @property {object} [applicationConfiguration]
     *   The configuration data of this application as defined in the application descriptor
     *    or in the flexible configuration object.
     * @property {object} [componentHandle]
     *   The component handle - for SAPUI5 components, this contains a handle to the
     *   component metadata and constructor which might already be loaded
     * @property {ApplicationType.enum} [applicationType="URL"]
     *   The type of the embedded application.
     * @property {sap.ui.core.CSSSize} [height="100%"]
     *   The container's height as a CSS size. This attribute is provided to the browser "as is"!
     *   <b>Note:</b> The HTML 4.01 specification allows pixels and percentages,
     *   but the HTML 5 specification allows pixels only!
     * @property {string} url
     *   The URL to the embedded application.
     * @property {boolean} [visible="true"]
     *   Whether the container control is visible at all. <b>Note:</b> An invisible container does
     *   not render any DOM content. Changing the visibility leads to rerendering!
     * @property {sap.ui.core.CSSSize} [width="100%"]
     *   The container's width as a CSS size. This attribute is provided to the browser "as is"!
     *   <b>Note:</b> The HTML 4.01 specification allows pixels and percentages,
     *   but the HTML 5 specification allows pixels only!
     */
    /**
     * Event which is fired when the <code>ApplicationContainer</code> control is rendered. The
     * event holds a technology specific configuration object for the embedded application.
     * As of now, only configuration for an embedded <em>SAPUI5 component</em> is supported.
     *
     * @event
     * @name sap.ushell.components.container.ApplicationContainer.applicationConfiguration
     * @param {object} configuration
     *     The technology specific configuration object of the embedded application.
     *     <code>undefined</code>, if the <code>ApplicationContainer</code> control does not
     *     provide a configuration for the technology of the embedded application or if there is a
     *     rendering issue with the application.<br/>
     *     For SAPUI5 components, the <code>config</code> property of the component metadata is
     *     provided.
     *
     * @public
     */
    var ApplicationContainer = Control.extend(sCOMPONENT, {
        metadata: {
            properties: {
                additionalInformation: { defaultValue: "", type: "string" },
                application: { type: "object" },
                applicationConfiguration: { type: "object" },
                applicationType: { defaultValue: "URL", type: sPREFIX + "ApplicationType" },
                height: { defaultValue: "100%", type: "sap.ui.core.CSSSize" },
                navigationMode: { defaultValue: "", type: "string" },
                targetNavigationMode: { defaultValue: "", type: "string" },
                text: { defaultValue: "", type: "string" },
                url: { defaultValue: "", type: "string" },
                currentAppUrl: { defaultValue: "", type: "string" },
                currentAppId: { defaultValue: "", type: "string" },
                currentAppTargetResolution: { type: "object" },
                visible: { defaultValue: true, type: "boolean" },
                active: { defaultValue: true, type: "boolean" },
                "sap-system": { type: "string" },
                applicationDependencies: { type: "object" },
                componentHandle: { type: "object" },
                ui5ComponentName: { type: "string" },
                width: { defaultValue: "100%", type: "sap.ui.core.CSSSize" },
                shellUIService: { type: "object" },
                reservedParameters: { type: "object" },
                coreResourcesFullyLoaded: { type: "boolean" },
                statefulType: { defaultValue: 0, type: "int" },
                iframeHandlers: { defaultValue: "", type: "string" },
                openWithPostByAppParam: { defaultValue: true, type: "boolean" },
                iframeWithPost: { defaultValue: false, type: "boolean" },
                beforeAppCloseEvent: { type: "object" },
                extendedInfo: { type: "object" },
                systemAlias: { defaultValue: "", type: "string" },
                iframePostAllParams: { defaultValue: false, type: "boolean" },
                isKeepAlive: { defaultValue: false, type: "boolean" },
                frameworkId: { defaultValue: "", type: "string" },
                iframeReusedForApp: { defaultValue: false, type: "boolean" },
                isIframeValidTime: { defaultValue: {time: 0}, type: "object" },
                isInvalidIframe: { defaultValue: false, type: "boolean" },
                isFetchedFromCache: { defaultValue: false, type: "boolean" },
                blueBoxCapabilities: { defaultValue: {}, type: "object" }
            },
            events: {
                applicationConfiguration: {}
            },
            aggregations: {
                child: { multiple: false, type: "sap.ui.core.Control", visibility: "hidden" }
            },
            library: "sap.ushell",
            designtime: "sap/ushell/designtime/ApplicationContainer.designtime"
        },

        exit: function () {
            var fnLogout;
            var that = this;
            if (sap.ushell.Container) {
                fnLogout = ApplicationContainer.prototype._getLogoutHandler(that);
                if (fnLogout) {
                    sap.ushell.Container.detachLogoutEvent(fnLogout);
                    mLogouts.remove(that.getId());
                }
            }
            // remove container from list of NWBC-containing containers
            // (if this container was an NWBC container before)
            localStorage.removeItem(that.globalDirtyStorageKey);

            // remove all event listeners
            if (that._unloadEventListener) {
                removeEventListener("pagehide", that._unloadEventListener);
            }

            if (that._disableRouterEventHandler) {
                Core.getEventBus().unsubscribe(
                    "sap.ushell.components.container.ApplicationContainer",
                    "_prior.newUI5ComponentInstantion", that._disableRouterEventHandler);//{ sValue : sServiceUrl }
            }

            if (that._storageEventListener) {
                removeEventListener("storage", that._storageEventListener);
            }

            if (that._messageEventListener) {
                removeEventListener("message", that._messageEventListener);
            }

            ApplicationContainer.prototype._destroyChild(that);

            // just to be sure in case it will be added some time
            if (Control.exit) {
                Control.exit.apply(that);
            }
        },

        setHandleMessageEvent: function (inFnHandleMessageEvent) {
            fnHandleMessageEvent = inFnHandleMessageEvent;
        },

        /**
         * Initialization of <code>ApplicationContainer</code> instance.
         */
        init: function () {
            var that = this;
            that.globalDirtyStorageKey = sDIRTY_STATE_PREFIX + fnGetUid();

            // be sure to remove entry from list of NWBC-containing containers
            // when the window is closed
            that._unloadEventListener = that.exit.bind(that);
            // As of chrome 117 the unload event is deprecated and therefore was changed
            addEventListener("pagehide", that._unloadEventListener); //TODO doesn't work in IE9 when F5 is pressed?!

            that._storageEventListener = function (oStorageEvent) {
                var sApplicationType = that.getApplicationType();
                if (oStorageEvent.key === that.globalDirtyStorageKey
                    && oStorageEvent.newValue === sap.ushell.Container.DirtyState.PENDING
                    && ushellUtils.isApplicationTypeEmbeddedInIframe(sApplicationType)) {

                    var oIframe = that._getIFrame();
                    if (oIframe) {
                        Log.debug(
                            "getGlobalDirty() send pro54_getGlobalDirty ",
                            null,
                            "sap.ushell.components.container.ApplicationContainer"
                        );

                        var oUri = new URI(that._getIFrameUrl(oIframe));
                        var targetDomain = oUri.protocol() + "://" + oUri.host();
                        oIframe.contentWindow.postMessage(
                            JSON.stringify({ action: "pro54_getGlobalDirty" }),
                            targetDomain
                        );
                    }
                }
            };
            addEventListener("storage", that._storageEventListener);

            that._messageEventListener = ApplicationContainer.prototype._handleMessageEvent.bind(null, that);
            addEventListener("message", that._messageEventListener);
            if (!oMessageBrokerServicePromise && sap.ushell.Container && sap.ushell.Container.getServiceAsync) {
                oMessageBrokerServicePromise = sap.ushell.Container.getServiceAsync("MessageBroker");
            }
        },

        onAfterRendering: function (/*oEvent*/) {
            var that = this;

            //always prevent re-rendering of application container
            this.rerender = function () { /* avoid re-rendering of this control */ };

            // iOS Safari ignores CSS width and height of the iframe. The iframe is as big as its contents.
            // Scrolling inside of a such an iframe is not possible. Scroll the parent container instead.
            if (Device.os.ios && this.$().prop("tagName") === "IFRAME") {
                this.$().parent().css("overflow", "auto");
            }

            if (this.oDeferredRenderer) {
                this.oDeferredRenderer.done(function () {
                    var oForm = document.getElementById(that.getId() + "-form");
                    if (oForm) {
                        oForm.submit();
                    }
                });
            }
        },

        /**
         * Renders the given container control with the help of the given render manager.
         *
         * @param {sap.ui.core.RenderManager} oRenderManager
         * @param {sap.ushell.components.container.ApplicationContainer} oContainer
         *
         * @private
         */
        renderer: {
            apiVersion: 2,
            render: function (oRenderManager, oContainer) {
                // we have to cache the UI5 version first
                if (sUI5Version === null) {
                    oUI5VersionPromise.then(() => {
                        oContainer.invalidate();
                    });
                    return;
                }
                // Note: "this" refers to the renderer instance, which does not matter here!
                var oApplication = oContainer.getApplication();
                var oLaunchpadData = oContainer.launchpadData;
                var oLoadingIndicator;

                if (!oContainer.getVisible()) {
                    // Note: even invisible controls need to render their ID for later re-rendering
                    ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer);
                    return;
                }

                if (oContainer.bTestControl) {
                    ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oContainer.oTestControl);
                } else if (oContainer.error) {
                    delete oContainer.error;
                    ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, ApplicationContainer.prototype._createErrorControl());
                } else if (!oApplication) {
                    // the standard properties
                    ApplicationContainer.prototype._render(oRenderManager, oContainer, oContainer.getApplicationType(),
                        oContainer.getUrl(), oContainer.getAdditionalInformation());
                } else if (!oApplication.isResolvable()) {
                    // the standard application data
                    ApplicationContainer.prototype._render(oRenderManager, oContainer, oApplication.getType(),
                        oApplication.getUrl(), "");
                } else if (oLaunchpadData) {
                    // the application, already resolved
                    // Note that ResolveLink appends a "?" to the URL if additionalData (aka
                    // additionalInformation) is supplied.
                    ApplicationContainer.prototype._render(oRenderManager, oContainer, oLaunchpadData.applicationType,
                        oLaunchpadData.Absolute.url.replace(/\?$/, ""),
                        oLaunchpadData.applicationData);
                } else {
                    Log.debug("Resolving " + oApplication.getUrl(), null,
                        sCOMPONENT);

                    oApplication.resolve(function (oResolved) {
                        Log.debug("Resolved " + oApplication.getUrl(),
                            JSON.stringify(oResolved),
                            sCOMPONENT);
                        // TODO: where to keep the internal property launchpadData? At the Application!
                        oContainer.launchpadData = oResolved;
                        ApplicationContainer.prototype._destroyChild(oContainer);
                    }, function (sError) {
                        var fnApplicationErrorHandler = oApplication.getMenu().getDefaultErrorHandler();
                        if (fnApplicationErrorHandler) {
                            fnApplicationErrorHandler(sError);
                        }
                        ApplicationContainer.prototype._destroyChild(oContainer);
                        oContainer.error = sError;
                    });
                    oLoadingIndicator = new Text({
                        text: ApplicationContainer.prototype._getTranslatedText("loading", [oApplication.getText()])
                    });
                    ApplicationContainer.prototype._destroyChild(oContainer);
                    oContainer.setAggregation("child", oLoadingIndicator);
                    ApplicationContainer.prototype._renderControlInDiv(oRenderManager, oContainer, oLoadingIndicator);
                }
            }
        }
    });

    /**
     * Returns the resulting source URL for the (internal) frame used to embed the given application.
     * This hook method may be overridden; we recommend to replace it per object, not at the
     * prototype.
     * <p>
     * The default implementation returns the URL "as is", but checks that the given application
     * type is one of <code>ApplicationType.enum</code> and throws
     * an error in case it is not. It ignores the additional information.
     * <p>
     * You may want to end your implementation with
     * <code>return
     * sap.ushell.components.container.ApplicationContainer.prototype.getFrameSource.call(this,
     * sApplicationType, sUrl, sAdditionalInformation);</code> in order to reuse the default
     * behavior. To override the error checks, simply replace any additional application types you
     * wish to support with <code>ApplicationType.enum.URL</code>.
     *
     * @param {ApplicationType.enum} sApplicationType
     *   the application type
     * @param {string} sUrl
     *   the base URL
     * @param {string} sAdditionalInformation
     *   the additional information
     * @returns {string}
     * @since 1.15.0
     */
    ApplicationContainer.prototype.getFrameSource = function (sApplicationType, sUrl/*, sAdditionalInformation*/) {
        if (!Object.prototype.hasOwnProperty.call(
            ApplicationType.enum,
            sApplicationType
        )) {
            // Note: do not use sap.ushell.utils.Error here as the exception is already caught
            // and logged in render()
            throw new Error("Illegal application type: " + sApplicationType);
        }
        return sUrl;
    };

    // overwrite setters to trigger component recreation only if relevant properties have changed
    ApplicationContainer.prototype.setUrl = function (sValue) {
        setProperty(this, "url", sValue);
    };

    ApplicationContainer.prototype.setAdditionalInformation = function (sValue) {
        setProperty(this, "additionalInformation", sValue);
    };

    ApplicationContainer.prototype.setApplicationType = function (sValue) {
        setProperty(this, "applicationType", sValue);
    };

    /**
     * Method called by the appLifeCycle to post a "before close" message to the app
     * running in the iframe before the iframe its destroyed.
     * The message is sent only if the iframe registered to be informed with this message.
     * This mechanism was added to solve the change made in Chrome to disallow Sync XHR on
     * browser close.
     *
     * @returns {Promise}
     *  A promise object in case a post message is sent, and "undefined" in case no message needs
     *  to be sent. In case of real promise, it will be resolved when the iframe response back that
     *  it processed the message.
     *
     * @private
     */
    ApplicationContainer.prototype.sendBeforeAppCloseEvent = function () {
        var that = this,
            oEventData = this.getBeforeAppCloseEvent && this.getBeforeAppCloseEvent();
        if (oEventData && oEventData.enabled && oEventData.enabled === true) {
            return new Promise(function (fnResolve, fnReject) {
                sap.ui.require(["sap/ushell/components/applicationIntegration/application/PostMessageUtils"], function (PostMessageUtils) {
                    PostMessageUtils.postMessageToIframeApp(
                        that, "sap.ushell.services.CrossApplicationNavigation", "beforeAppCloseEvent", oEventData.params, true).then(fnResolve, fnReject);
                });
            });
        }

        return undefined;
    };

    ApplicationContainer.prototype.getDeffedControlCreation = function (sUrl) {
        return this.oDeferredControlCreation ? this.oDeferredControlCreation.promise() : jQuery.Deferred().resolve().promise();
    };

    //Attach private functions which should be testable via unit tests to the prototype of the ApplicationContainer
    //to make them available outside for testing.
    ApplicationContainer.prototype._getCommunicationHandlers = getCommunicationHandlers;
    ApplicationContainer.prototype._adaptIsUrlSupportedResultForMessagePopover = adaptIsUrlSupportedResultForMessagePopover;
    ApplicationContainer.prototype._getLogoutHandler = getLogoutHandler;
    ApplicationContainer.prototype._getParameterMap = getParameterMap;
    ApplicationContainer.prototype._getTranslatedText = getTranslatedText;
    ApplicationContainer.prototype._createErrorControl = createErrorControl;
    ApplicationContainer.prototype._destroyChild = destroyChild;
    ApplicationContainer.prototype._createUi5View = createUi5View;
    ApplicationContainer.prototype._publishExternalEvent = publishExternalEvent;
    ApplicationContainer.prototype._createUi5Component = createUi5Component;
    ApplicationContainer.prototype._disableRouter = disableRouter;
    ApplicationContainer.prototype._createSystemForUrl = createSystemForUrl;
    ApplicationContainer.prototype._isTrustedPostMessageSource = isTrustedPostMessageSource;
    ApplicationContainer.prototype._handleMessageEvent = handleMessageEvent;
    ApplicationContainer.prototype._logout = logout;
    ApplicationContainer.prototype._renderControlInDiv = renderControlInDiv;
    ApplicationContainer.prototype._checkNwbcUrlAdjustment = checkNwbcUrlAdjustment;
    ApplicationContainer.prototype._adjustNwbcUrl = adjustNwbcUrl;
    ApplicationContainer.prototype._render = render;
    ApplicationContainer.prototype._getIFrame = getIFrame;
    ApplicationContainer.prototype._getIFrameUrl = getIFrameUrl;
    ApplicationContainer.prototype._resetPluginsLoadIndications = resetPluginsLoadIndications;
    ApplicationContainer.prototype._handlePostMessagesForPluginsPostLoading = handlePostMessagesForPluginsPostLoading;
    // helper for tests
    ApplicationContainer.prototype._setCachedUI5Version = function (sNewVersion) {
        sUI5Version = sNewVersion;
        oUI5VersionPromise = oUI5VersionPromise.then(() => {
            sUI5Version = sNewVersion;
        });
    };
    return ApplicationContainer;
}, true);
