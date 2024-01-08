// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Navigation.
 * This file exposes an API to perform (invoke) Navigation for applications.
 * It exposes interfaces to perform a hash change and trigger a navigation.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepClone",
    "sap/base/util/deepExtend",
    "sap/base/util/isPlainObject",
    "sap/base/util/ObjectPath",
    "sap/ui/base/Object",
    "sap/ui/thirdparty/hasher",
    "sap/ushell/ApplicationType",
    "sap/ushell/components/applicationIntegration/AppLifeCycle",
    "sap/ushell/Container",
    "sap/ushell/services/Navigation/utils",
    "sap/ushell/services/AppConfiguration",
    "sap/ushell/TechnicalParameters",
    "sap/ushell/UI5ComponentType",
    "sap/ushell/utils",
    "sap/ushell/utils/type",
    "sap/ushell/utils/UrlParsing"
], function (
    Log,
    deepClone,
    deepExtend,
    isPlainObject,
    ObjectPath,
    BaseObject,
    hasher,
    ApplicationType,
    AppLifeCycleAi,
    Container,
    navigationUtils,
    AppConfiguration,
    TechnicalParameters,
    UI5ComponentType,
    ushellUtils,
    ushellType,
    UrlParsing
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Navigation
     * @class
     * @classdesc The Unified Shell's Navigation service.
     * Allows navigating to "external" targets outside of the currently running app (but still in scope of the current Fiori launchpad)
     * or to create links to such external targets.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("Navigation")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * The Navigation service currently provides platform independent functionality.
     *
     * The service is meant to be used by applications, plugins and shell components.
     *
     * Usage:
     * <pre>
     *   sap.ui.require(["sap/ushell/Container"], async (Container) => {
     *     const oNavigationService = await Container.getServiceAsync("Navigation");
     *     const sHref = await oNavigationService.getHref({
     *       target : {
     *         semanticObject: "Product",
     *         action: "display"
     *       },
     *       params: {
     *         "ProductID": "102343333"
     *       }
     *     }, oComponent);
     *     // do something with the resolved sHref.
     *   });
     * </pre>
     *
     * Parameter names and values are case sensitive.
     *
     * Note that the usage of multi-valued parameters (specifying an array with more than one member as parameter value,
     * e.g. <code>params : { A : ["a1", "a2"] }</code>) is possible with this API but <b>strongly discouraged</b>.
     * Depending on the used platform / back-end implementation the target matching might not support multi-value parameters.
     * Furthermore, it is not guaranteed that additional parameter values specified in the back-end configuration are merged with
     * parameter values passed via the Navigation service.
     *
     * Note that the application parameter length (including SemanticObject/Action) shall not exceed 512 bytes when serialized as UTF-8.
     *
     * Note that when receiving the values as startup parameters (as part of the component data object)
     * single values are represented as an array of size 1.
     * Above example is returned as <code> deepEqual(getComponentData().startupParameters ,  { "ProductID" : [ "102343333" ] } ) </code>
     *
     * Make sure not to store sensitive data within an URL.
     * URLs may appear in a server log, be persisted inside and outside the system.
     *
     * Note: When constructing large URLs, the URLs may be shortened and persisted on a database server for prolonged time,
     * the actual data is persisted under a key accessible to any User (guessing the key).
     *
     * The same restrictions apply for the Application state.
     *
     * @param {object} oContainerInterface The Container Interface.
     * @param {string} sParameters The parameters.
     * @param {object} oServiceConf Service Configuration.
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @public
     */
    function Navigation (oContainerInterface, sParameters, oServiceConf) {
        let oServiceConfiguration;
        if (oServiceConf && oServiceConf.config) {
            oServiceConfiguration = oServiceConf.config;
        }

        /**
         * @typedef {object} sap.ushell.services.Navigation.LinkFilter
         * @property {string} [semanticObject] Matches the semantic object of a link.
         * @property {string} [action] Matches the action object of a link.
         * @property {object} [params] Matches the parameters of a link.
         * <ul>
         * <li><b>Simple format:</b>
         *
         * <pre>
         * {
         *    P1: "B",
         *    P2: ["e", "j"]
         * }
         * </pre>
         *
         * </li>
         * <li><b>Extended format:</b>
         *
         * <pre>
         *    {
         *       P1: { value: "v1" },
         *       P2: { value: ["v2", "v3"] },
         *       P3: { value: "v4", required: true }
         *    }
         * </pre>
         *
         *       <code>required</code>: Whether the parameter is be required (<code>true</code>) or not (<code>false</code>) in the signature of
         *       the matching target.
         *       Note that this option is only effective on platforms using the <code>sap.ushell.services.ClientSideTargetResolution</code>
         * </li>
         * </ul>
         * @property {boolean} [withAtLeastOneUsedParam=false] If <code>true</code>, matches only links that use at least one (non sap-) parameter from 'params'.
         * @property {string} [sortResultsBy="intent"] How the matching links should be sorted. Possible Values:
         * <ul>
         *    <li> <code>"intent"</code> lexicographical sort on returned 'intent' field</li>
         *    <li> <code>"text"</code> lexicographical sort on returned 'text' field</li>
         *    <li> <code>"priority"</code> experimental - top intents are returned first</li>
         * </ul>
         * @property {boolean} [treatTechHintAsFilter=false] If true, only apps that match exactly the supplied technology (for example sap-ui-tech-hint=WDA) will be considered.
         * @property {sap.ui.core.Component} ui5Component The UI5 component invoking the service, shall be a root component.
         * @property {string} [appStateKey] <b>SAP internal usage only</b> Application state key to add to the generated links.
         * @property {boolean} [compactIntents=false] Whether intents should be returned in compact format.
         * @property {string[]} [tags] Matches only links which match an inbound with certain tags.
         * @public
         */

        /**
         * @typedef {object} sap.ushell.services.Navigation.Link
         * Optional properties may not be present in the link.
         * @property {string} intent The intent: for example "#AnObject-Action?A=B&C=e&C=j"
         * <br><b>Note:</b> The intent is in a <b>internal</b> format and cannot be directly put into a link tag.
         * @property {string} text The title of the link.
         * @property {sap.ui.core.URI} [icon] A URI to the icon: for example "sap-icon://Fiori2/F0018".
         * @property {string} [subTitle] The short title of the link.
         * @property {string} [shortTitle] The short title of the link.
         * @property {string[]} [tags] The list of tags.
         * @public
         */

        /**
         * @typedef {object} sap.ushell.services.Navigation.Target
         * A target describing the intent: #<semanticObject>-<action>~<contextRaw>?<params>&/<appSpecificRoute>
         * <b>Note:</b> The intent shall not exceed 512 bytes when serialized as UTF-8.
         * @property {object} [target] Defaults to current hash. Note that the only the <code>appSpecificRoute</code> will be considered when target is omitted.
         * @property {string} [target.semanticObject] The semanticObject part of the intent.
         * @property {string} [target.action] The action part of the intent.
         * @property {string} [target.contextRaw] The contextRaw part of the intent without the '~' prefix.
         * @property {string} [target.shellHash] The entire intent including parameters and appSpecificRoute.
         * <br><b>Note:</b> If set all other parameters are ignored.
         * <br><b>Note:</b> While parameters need to be url-encoded once when used in the <code>shellHash</code> the app specific route must not be encoded.
         * @property {object} [params] The parameters of the target
         * <ul>
         * <li><b>Simple format:</b>
         *
         * <pre>
         * {
         *    P1: "B",
         *    P2: ["e", "j"]
         * }
         * </pre>
         *
         * </li>
         * <li><b>Extended format:</b>
         *
         * <pre>
         * {
         *    P1: { value: "v1" },
         *    P2: { value: ["v2", "v3"] }
         * }
         * </pre>
         *
         * </li>
         * </ul>
         *
         * <br><b>Note:</b> Parameter values can contain special characters and must be provided
         * unencoded. The APIs takes care of the necessary encodings.
         * @property {string} [appSpecificRoute] The appSpecificRoute without the '&/' prefix.
         * @property {boolean} [processParams=false] Wether the parameter provided in <code>params</code> should be applied or ignored.
         *                                           Parameters already set by the shellHash are ignored.
         * @public
         */

        /**
         * @typedef {object} SimpleTarget
         * The same structure as {@link sap.ushell.services.Navigation.Target} but without the appSpecificRoute
         * @property {object} [target]
         * @property {string} [target.semanticObject]
         * @property {string} [target.action]
         * @property {string} [target.contextRaw]
         * @property {string} [target.shellHash]
         * @property {object} [params]
         *
         * @private
         */

        /**
         * Adds the system of the current application specified as <code>sap-system</code> parameter in its URL to the
         * parameter object <code>vTarget</code> used in the methods {@link sap.ushell.services.Navigation#getHref}
         * and {@link sap.ushell.services.Navigation#navigate}.
         * The system is only added if the current application specifies it and <code>vTarget</code> does not already contain
         * this parameter.
         *
         * @param {string|SimpleTarget} vTarget The navigation target object or string.
         * <br><b>Important</b> The target expressed in this parameter should not contain an inner-app route.
         * @param {sap.ui.core.Component} [oComponent] the root component of the application
         * @returns {string|SimpleTarget} The provided target with the sap-system parameter appended.
         *
         * @since 1.120.0
         * @private
         */
        this._getTargetWithCurrentSystem = function (vTarget, oComponent) {
            if (typeof vTarget !== "string" && !isPlainObject(vTarget) && vTarget !== undefined) {
                Log.error("Unexpected input type", null, "sap.ushell.services.Navigation");
                return undefined;
            }

            if (vTarget === undefined) {
                return undefined;
            }

            let sSystem;
            let sNextNavMode;

            const oResolution = AppConfiguration.getCurrentApplication();
            if (oComponent) {
                // Take sap-system, sap-ushell-next-navmode and sap-app-origin-hint parameters from the component
                let oStartupParameters;
                try {
                    oStartupParameters = oComponent.getComponentData().startupParameters; // assume always present on root component
                } catch (oError) {
                    // startupParameters not available
                }

                if (!isPlainObject(oStartupParameters)) {
                    Log.error("Cannot call getComponentData on component", "the component should be an application root component", "sap.ushell.services.Navigation");
                } else {
                    if (oStartupParameters.hasOwnProperty("sap-system")) {
                        sSystem = oStartupParameters["sap-system"][0];
                    }
                    if (oStartupParameters.hasOwnProperty("sap-ushell-next-navmode")) {
                        sNextNavMode = oStartupParameters["sap-ushell-next-navmode"][0];
                    }
                }
            } else {
                // Take sap-system, sap-ushell-next-navmode and sap-app-origin-hint parameters from the current application
                if (oResolution && oResolution["sap-system"]) {
                    sSystem = oResolution["sap-system"];
                } else if (oResolution && oResolution.url) {
                    sSystem = new URL(oResolution.url, window.location.href).searchParams.get("sap-system");
                }
                if (oResolution && oResolution["sap-ushell-next-navmode"]) {
                    sNextNavMode = oResolution["sap-ushell-next-navmode"];
                } else if (oResolution && oResolution.url) {
                    sNextNavMode = new URL(oResolution.url, window.location.href).searchParams.get("sap-ushell-next-navmode");
                }
            }

            let sAppOrigin;
            if (oResolution) {
                sAppOrigin = oResolution.contentProviderId;
            }

            const vInjectedTarget = navigationUtils.injectParameters({
                type: ushellType,
                inject: {
                    "sap-system": sSystem,
                    "sap-ushell-navmode": sNextNavMode,
                    "sap-app-origin-hint": sAppOrigin
                },
                injectEmptyString: {
                    "sap-app-origin-hint": true
                },
                args: vTarget
            });

            return vInjectedTarget;
        };

        /**
         * Adds the system of the current application specified as <code>sap-ushell-test-enc</code> parameter in its URL to the parameter
         * object <code>vTarget</code> used in the methods {@link sap.ushell.services.Navigation#getHref} and {@link sap.ushell.services.Navigation#navigate}.
         * The parameter is always added. It will be overwritten or duplicated if present.
         *
         * @param {string|sap.ushell.services.Navigation.Target} vTarget The navigation target as string or object.
         * @returns {string|sap.ushell.services.Navigation.Target} The provided target with the sap-system parameter appended.
         *
         * @since 1.120.0
         * @private
         */
        this._amendTargetWithSapUshellEncTestParameter = function (vTarget) {
            if (localStorage && localStorage["sap-ushell-enc-test"] === "false") {
                return vTarget;
            }
            if (!oServiceConfiguration || !oServiceConfiguration["sap-ushell-enc-test"]) {
                if (localStorage && localStorage["sap-ushell-enc-test"] !== "true") {
                    return vTarget;
                }
            }
            if (typeof vTarget !== "string" && !isPlainObject(vTarget) && vTarget !== undefined) {
                Log.error("Unexpected input type", null, "sap.ushell.services.Navigation");
                return undefined;
            }

            if (vTarget === undefined) {
                return undefined;
            }

            if (isPlainObject(vTarget)) {
                // needs deep copy
                const oClonedTarget = deepExtend({}, vTarget);
                if (oClonedTarget.target && oClonedTarget.target.shellHash) {
                    if (typeof oClonedTarget.target.shellHash === "string") {
                        // process shell hash as a string
                        if (oClonedTarget.target.shellHash !== "#" && oClonedTarget.target.shellHash !== "") {
                            oClonedTarget.target.shellHash = this._amendTargetWithSapUshellEncTestParameter(
                                oClonedTarget.target.shellHash);
                        }
                    }
                    return oClonedTarget;
                }

                oClonedTarget.params = oClonedTarget.params || {};
                oClonedTarget.params["sap-ushell-enc-test"] = ["A B%20C"];

                return oClonedTarget;
            }
            let sShellHash = vTarget;

            if (!/[?&]sap-system=/.test(sShellHash)) {
                const sSeparator = (sShellHash.indexOf("?") > -1) ? "&" : "?";
                sShellHash += sSeparator + "sap-ushell-enc-test=" + encodeURIComponent("A B%20C");
            }
            return sShellHash;
        };

        /**
         * Extracts the inner app route from a given intent.
         * This method actually amends the input parameter if it is not provided as a string.
         *
         * @param {string|sap.ushell.services.Navigation.Target} vIntent The input intent.
         * @returns {
         *            { innerAppRoute: string, intent: string }|
         *            { innerAppRoute: string, intent: SimpleTarget }
         * } Object containing the innerAppRoute and the intent without innerAppRoute.
         * <br><b>Note:</b> the returned <code>intent</code> field will be a string if the input <code>vIntent</code> was a string.
         *
         * @since 1.120.0
         * @private
         */
        this._extractInnerAppRoute = function (vIntent) {
            if (typeof vIntent === "string") {
                const aParts = vIntent.split("&/"); // ["Object-action", "inner-app/route", ... ]
                const sIntent = aParts.shift(); // aParts now contains parts of inner-app route

                return {
                    intent: sIntent,
                    innerAppRoute: aParts.length > 0 ? "&/" + aParts.join("&/") : ""
                };
            }

            if (isPlainObject(vIntent)) {
                const sShellHash = ObjectPath.get("target.shellHash", vIntent);
                if (typeof sShellHash === "string") {
                    const { intent, innerAppRoute } = this._extractInnerAppRoute(sShellHash);

                    // modify the source object
                    vIntent.target.shellHash = intent;

                    return {
                        intent: vIntent,
                        innerAppRoute: innerAppRoute
                    };
                }

                if (vIntent.hasOwnProperty("appSpecificRoute")) {
                    const vAppSpecificRoute = vIntent.appSpecificRoute;

                    delete vIntent.appSpecificRoute;

                    const bIsStringWithoutSeparator = typeof vAppSpecificRoute === "string" && vAppSpecificRoute.indexOf("&/") !== 0 && vAppSpecificRoute.length > 0;

                    return {
                        innerAppRoute: bIsStringWithoutSeparator ? "&/" + vAppSpecificRoute : vAppSpecificRoute,
                        intent: vIntent
                    };
                }

                return {
                    intent: vIntent,
                    innerAppRoute: ""
                };
            }

            Log.error("Invalid input parameter", "expected string or object", "sap.ushell.services.Navigation");

            return { intent: vIntent };
        };

        /**
         * Adds an inner app route to the given intent.
         * This method assumes that the innerAppRoute (if provided) always starts wih "&/".
         *
         * @param {string|SimpleTarget|sap.ushell.services.Navigation.Target} vIntent The same input object or string that {@link #_extractInnerAppRoute} takes.
         * @param {string} [sInnerAppRoute] The inner app route.
         * @returns {string|sap.ushell.services.Navigation.Target} The intent with the given <code>sInnerAppRoute</code> parameter.
         *
         * @since 1.120.0
         * @private
         */
        this._injectInnerAppRoute = function (vIntent, sInnerAppRoute) {
            if (!sInnerAppRoute) {
                return vIntent;
            }

            if (typeof vIntent === "string") {
                return vIntent + sInnerAppRoute;
            }

            if (isPlainObject(vIntent)) {
                const sShellHash = ObjectPath.get("target.shellHash", vIntent);

                if (typeof sShellHash === "string") {
                    vIntent.target.shellHash = this._injectInnerAppRoute(sShellHash, sInnerAppRoute);
                    return vIntent;
                }

                vIntent.appSpecificRoute = sInnerAppRoute;
            }

            return vIntent;
        };

        /**
         * Returns a promise resolving to a URL that launches an app with certain parameters.
         * This API can be used to convert the internal shell hash format into the URL format for use in link tags.
         * The resulting href is fully encoded and cannot be used in other APIs expecting the internal decoded hash.
         *
         * <pre>
         *   sap.ui.require(["sap/ushell/Container"], async (Container) => {
         *     const oNavigationService = await Container.getServiceAsync("Navigation");
         *     const sHref = await oNavigationService.getHref({
         *       target: { shellHash: oLink.intent }
         *     }, oComponent);
         *     // do something with the resolved sHref.
         *   });
         * </pre>
         *
         * This API accepts a sap-xapp-state-data parameter that can be used generate a url that can be used to launch
         * an app with certain data, for example:
         * <pre>
         *   {
         *     target : { semanticObject : "AnObject", action: "action" },
         *     params : { "sap-xapp-state-data" : JSON.stringify({ a: "b", c: "d" }) }
         *   }
         * </pre>
         * Using the arguments as in the example above, a link with a sap-xapp-state parameter that encodes the provided data is returned.
         * The sap-xapp-state-data parameter does not appear in the generated link.
         *
         * Do <b>not</b> use "#Shell-home" to navigate to a specific homepage!<br>
         * A proper way for an application to generate a link to return to the home page of the Fiori launchpad is:<br>
         * <code>getHref( { target : { shellHash : "#" }})</code>
         *
         * @param {sap.ushell.services.Navigation.Target} [oTarget] The navigation target to transform. When omitted the current hash is used as basis for the calculation.
         * @param {sap.ui.core.Component} [oComponent] A UI5 component, used to logically attach any related app state.
         * @returns {Promise<string>} A Promise resolving the encoded href.
         *
         * @since 1.120.0
         * @public
         */
        this.getHref = async function (oTarget = {}, oComponent) {
            try {
                /**@type {sap.ushell.services.Navigation.Target} */
                let oArgsClone = deepClone(oTarget); // clone to keep input unchanged and to avoid side effects
                if (!oArgsClone.target) {
                    Log.debug("Navigation.getHref: No target provided using current hash as fallback", "sap.ushell.services.Navigation");
                    const oParsedShellHash = UrlParsing.parseShellHash(hasher.getHash());
                    oArgsClone.target = {
                        semanticObject: oParsedShellHash.semanticObject,
                        action: oParsedShellHash.action,
                        contextRaw: oParsedShellHash.contextRaw
                    };
                    oArgsClone.params = oParsedShellHash.params;

                    if (oParsedShellHash.appSpecificRoute && !oArgsClone.appSpecificRoute) {
                        oArgsClone.appSpecificRoute = oParsedShellHash.appSpecificRoute;
                    }
                }

                const { intent, innerAppRoute } = this._extractInnerAppRoute(oArgsClone);

                await navigationUtils.addXAppStateFromParameter(intent, "sap-xapp-state-data" /* parameter containing data */);

                oArgsClone = this._getTargetWithCurrentSystem(intent, oComponent);
                oArgsClone = await navigationUtils.injectStickyParameters({
                    args: oArgsClone,
                    appLifeCycle: AppLifeCycleAi,
                    technicalParameters: TechnicalParameters,
                    type: ushellType
                });
                oArgsClone = this._amendTargetWithSapUshellEncTestParameter(oArgsClone);
                oArgsClone = this._injectInnerAppRoute(oArgsClone, innerAppRoute);

                const ShellNavigation = await Container.getServiceAsync("ShellNavigation");

                return ShellNavigation.hrefForExternal(oArgsClone, undefined, oComponent);
            } catch (oError) {
                Log.error("href could not be calculated", oError, "sap.ushell.services.Navigation");
            }
        };

        /**
         * Attempts to use the browser history to navigate to the previous app.
         *
         * A navigation to the Fiori launchpad Home is performed when this method is called on a first navigation.
         * In all other cases, this function simply performs a browser back navigation.
         *
         * Note that the behavior of this method is subject to change and therefore it may not yield to the expected results
         * especially on mobile devices where "back" is the previous inner-app state if these are put into the history!
         *
         * @returns {Promise} A promise which resolves once the back navigation was triggered
         *
         * @since 1.120.0
         * @public
         */
        this.backToPreviousApp = async function () {
            const bIsInitial = await this.isInitialNavigation();

            if (bIsInitial) {
                // go back home
                return this.navigate({ target: { shellHash: "#" }, writeHistory: false });
            }

            this.historyBack();
            return undefined;
        };

        /**
         * Navigates back in history the number of given steps if this is supported by the underlying platform.
         * If no argument is provided it will navigate back 1 step.
         *
         * @param {int} iSteps positive integer representing the steps to go back in the history
         *
         * @since 1.120.0
         * @public
         */
        this.historyBack = function (iSteps) {
            let iActualStepsBack = -1;
            if (iSteps && typeof iSteps === "number") {
                if (iSteps <= 0) {
                    Log.warning(
                        "historyBack called with an argument <= 0 and will result in a forward navigation or refresh",
                        "expected was an argument > 0",
                        "sap.ushell.services.Navigation#historyBack"
                    );
                }
                iActualStepsBack = iSteps * -1;
            }
            window.history.go(iActualStepsBack);
        };

        /**
         * Checks whether the FLP has performed the first navigation.
         * This method can be used to detect whether the current app was started directly, that is,
         * without a previous navigation to another app, to the FLP home, or another target that adds an entry in the browser history.
         *
         * @returns {Promise<boolean>} This promise resolves with a boolean indicating if the current navigation is considered initial
         *
         * @since 1.120.0
         * @public
         */
        this.isInitialNavigation = async function () {
            try {
                const ShellNavigation = await Container.getServiceAsync("ShellNavigation");
                const bIsInitialNavigation = ShellNavigation.isInitialNavigation();

                // An undefined value indicates that the ShellNavigation service did not initialize the ShellNavigationHashChanger yet.
                // Hence this is the first navigation in case asked at this point in time.
                if (typeof bIsInitialNavigation === "undefined") {
                    return true;
                }

                return bIsInitialNavigation;
            } catch (oError) {
                Log.debug("ShellNavigation service not available", "This will be treated as the initial navigation", "sap.ushell.services.Navigation");
                return true;
            }
        };

        /**
         * Triggers a navigation to a specified target outside of the currently running application (e.g. different launchpad application).
         * Invocation will trigger a hash change and subsequent invocation of the target.
         *
         * If the navigation target opens in a new window the running application may be retained.
         *
         * This API accepts a sap-xapp-state-data parameter that can be used generate a url that can be used to launch
         * an app with certain data, for example:
         * <pre>
         *   {
         *     target : { semanticObject : "AnObject", action: "action" },
         *     params : { "sap-xapp-state-data" : JSON.stringify({ a: "b", c: "d" }) }
         *   }
         * </pre>
         * Using the arguments as in the example above, a link with a sap-xapp-state parameter that encodes the provided data is returned.
         * The sap-xapp-state-data parameter does not appear in the generated link.
         *
         * Do <b>not</b> use "#Shell-home" to navigate to a specific homepage!<br>
         * A proper way for an application to generate a link to return to the home page of the Fiori launchpad is:<br>
         * <code>navigate( { target : { shellHash : "#" }})</code>
         *
         * @param {sap.ushell.services.Navigation.Target} oTarget The navigation target.
         * @param {sap.ui.core.Component} [oComponent] A UI5 component, used to logically attach any related app state.
         * @returns {Promise} A Promise resolving once the navigation was triggered. The Promise might never reject or resolve
         *                    when an error occurs during the navigation.
         *
         * @since 1.120.0
         * @public
         */
        this.navigate = async function (oTarget, oComponent) {
            try {
                /**@type {sap.ushell.services.Navigation.Target} */
                let oArgsClone = deepClone(oTarget); // clone to keep input unchanged and to avoid side effects
                const bWriteHistory = oTarget.writeHistory;

                this._processShellHashWithParams(oArgsClone);
                const { intent, innerAppRoute } = this._extractInnerAppRoute(oArgsClone);

                const AppLifeCycle = await Container.getServiceAsync("AppLifeCycle");
                const ShellNavigation = await Container.getServiceAsync("ShellNavigation");

                const oCurrentApplication = AppLifeCycle.getCurrentApplication();
                const oIntent = await (oCurrentApplication && oCurrentApplication.getIntent());

                // clone again because _extractInnerAppRoute might already changed the original structure
                /**@type {sap.ushell.services.Navigation.Target} */
                const oNavTarget = deepClone(oTarget);
                this._checkIfAppNeedsToBeReloaded(oNavTarget, oCurrentApplication, oIntent, ShellNavigation.hashChanger);
                await navigationUtils.addXAppStateFromParameter(intent, "sap-xapp-state-data" /* parameter containing data */);

                oArgsClone = this._getTargetWithCurrentSystem(intent, oComponent);
                oArgsClone = await navigationUtils.injectStickyParameters({
                    args: oArgsClone,
                    appLifeCycle: AppLifeCycleAi,
                    technicalParameters: TechnicalParameters,
                    type: ushellType
                });
                oArgsClone = this._amendTargetWithSapUshellEncTestParameter(oArgsClone);

                delete oArgsClone.writeHistory;

                oArgsClone = this._injectInnerAppRoute(oArgsClone, innerAppRoute);

                await ShellNavigation.toExternal(oArgsClone, oComponent, bWriteHistory);
            } catch (oError) {
                Log.error("Navigation.navigate failed", oError, "sap.ushell.services.Navigation");
            }
        };

        /**
         * Check if an external navigation without an inner-app route is triggered to the currently running app.
         * This should cause the app to reload.
         *
         * @param {sap.ushell.services.Navigation.Target} oTarget A configuration object describing the navigation target.
         * @param {object} [oApp] The application that is currently active. {@link sap.ushell.services.AppLifeCycle#getCurrentApplication}
         * @param {object} [oAppIntent] The intent of the currently active application.
         * @param {sap.ushell.services.ShellNavigationHashChanger} oHashChanger The shell navigation hash changer.
         *
         * @since 1.120.0
         * @private
         */
        this._checkIfAppNeedsToBeReloaded = function (oTarget, oApp, oAppIntent, oHashChanger) {
            if (!oApp || !oAppIntent || !oTarget || !oTarget.target) {
                return; // current application intent needs to be known and there needs to be a target
            }

            if (oTarget.target.shellHash) {
                // convert shell hash in to semantic object and action form
                const oHash = UrlParsing.parseShellHash(oTarget.target.shellHash) || {};

                oTarget.target = {
                    semanticObject: oHash.semanticObject,
                    action: oHash.action,
                    contextRaw: oHash.contextRaw
                };
                oTarget.appSpecificRoute = oHash.appSpecificRoute;
                oTarget.params = Object.assign({}, oTarget.params, oHash.params);
            }

            if (oTarget.appSpecificRoute) {
                return; // appSpecificRoute must be empty
            }

            if (oApp.applicationType !== "UI5") {
                return; // must be a fiori application
            }

            if (oTarget.target.semanticObject !== oAppIntent.semanticObject) {
                return; // semanticObject must match
            }

            if (oTarget.target.action !== oAppIntent.action) {
                return; // action must match
            }

            // Navigation parameter may not be inside an array and might not be strings
            // So they have to be adjusted in order to be matched against the current parameters
            const oTargetParameters = {};
            if (oTarget.params) {
                Object.keys(oTarget.params).forEach((sKey) => {
                    const vValue = oTarget.params[sKey];
                    const aValue = Array.isArray(vValue) ? vValue : [vValue];
                    oTargetParameters[sKey] = aValue.map((vInnerValue) => {
                        return vInnerValue.toString();
                    });
                });
            }

            if (!oHashChanger.haveSameIntentParameters(oTargetParameters, oAppIntent.params)) {
                return; // intent parameters must match
            }

            oHashChanger.setReloadApplication(true);
        };

        /**
         * For a given semantic object, this method considers all actions associated with the semantic object and
         * returns the one tagged as a "primaryAction".
         * <br>If no inbound tagged as "primaryAction" exists, then the intent of the first inbound
         * (after sorting has been applied) matching the action "displayFactSheet".
         *
         * The primary intent is determined by querying {@link sap.ushell.services.Navigation#getLinks}
         * with the given semantic object and optional parameter.
         * <br>Then the resulting list is filtered to the outcome that a single item remains.
         *
         * @param {string} sSemanticObject The semantic object.
         * @param {sap.ushell.services.Navigation.LinkFilter} [oLinkFilter] A target filter.
         * @returns {Promise<sap.ushell.services.Navigation.Link>} A promise resolving a link matching the 'primaryAction' tag.
         *
         * @since 1.120.0
         * @public
         */
        this.getPrimaryIntent = async function (sSemanticObject, oLinkFilter) {
            const oQuery = {};

            oQuery.tags = ["primaryAction"];
            oQuery.semanticObject = sSemanticObject;
            if (oLinkFilter) {
                oQuery.params = oLinkFilter;
            }

            const aLinks = await this.getLinks([oQuery]);
            if (aLinks.length === 0) {
                delete oQuery.tags;
                oQuery.action = "displayFactSheet";

                const aFactSheetLinks = await this.getLinks([oQuery]);

                // Priority given to intents with the action "displayFactSheet"
                return aFactSheetLinks.length === 0 ? null : aFactSheetLinks.sort((oLink, oOtherLink) => {
                    const rgxDisplayFactSheetAction = /^#\w+-displayFactSheet(?:$|\?.)/;

                    if (oLink.intent === oOtherLink.intent) {
                        return 0;
                    }

                    const bEitherIsFactSheetAction = rgxDisplayFactSheetAction.test(oLink.intent) ^ rgxDisplayFactSheetAction.test(oOtherLink.intent);

                    if (bEitherIsFactSheetAction) {
                        return rgxDisplayFactSheetAction.test(oLink.intent) ? -1 : 1;
                    }

                    return oLink.intent < oOtherLink.intent ? -1 : 1;
                })[0];
            }

            // simple left-right-lexicographic order, based on intent
            return aLinks.length === 0 ? null : aLinks.sort((oLink, oOtherLink) => {
                if (oLink.intent === oOtherLink.intent) {
                    return 0;
                }

                return oLink.intent < oOtherLink.intent ? -1 : 1;
            })[0];
        };

        /**
         * Resolves the given filters to a list of links available to the user.
         *
         * @param {sap.ushell.services.Navigation.LinkFilter[]} [aLinkFilter=[]] A list of target filters.
         * @returns {Promise<Array<sap.ushell.services.Navigation.Link[]>>} A promise that resolves an array with a list for each filter containing the matched links.
         *   <br><b>Note:</b> The intent is in a <b>internal</b> format and cannot be directly put into a link tag. If you want to use it directly you have to
         *   transform it first into a href.
         *   <pre>
         *      const sHref = await NavigationService.getHref({ target: { shellHash:  oLink.intent} }, oComponent);
         *   </pre>
         *
         * @since 1.120.0
         * @public
         */
        this.getLinks = async function (aLinkFilter = []) {
            // Validation
            if (!Array.isArray(aLinkFilter)) {
                throw new Error("Unexpected Input: aLinkFilter has to be an array with plain objects!");
            }
            const bAllEntriesArePlainObjects = aLinkFilter.every((vEntry) => {
                if (Array.isArray(vEntry)) {
                    return false;
                }
                if (isPlainObject(vEntry)) {
                    return true;
                }
                return false;
            });
            if (!bAllEntriesArePlainObjects) {
                throw new Error("Unexpected Input: aLinkFilter has to be an array with plain objects!");
            }

            if (aLinkFilter.length === 0) {
                aLinkFilter.push({});
            }
            return Promise.all(aLinkFilter.map(async (oArgs) => {
                // ensure certain parameters are specified
                let oArgsClone = deepExtend({}, oArgs);
                oArgsClone.compactIntents = !!oArgsClone.compactIntents;
                oArgsClone.action = oArgsClone.action || undefined;
                oArgsClone.paramsOptions = navigationUtils.extractGetLinksParameterOptions(oArgsClone.params);

                oArgsClone = await navigationUtils.injectStickyParameters({
                    args: oArgsClone,
                    appLifeCycle: AppLifeCycleAi,
                    technicalParameters: TechnicalParameters,
                    type: ushellType
                });

                let oParameterDefinition;
                if (oArgsClone.params) {
                    oParameterDefinition = navigationUtils.extractGetLinksParameterDefinition(oArgsClone.params);
                } else {
                    oParameterDefinition = oArgsClone.params;
                }

                // propagate sap-system into parameters
                let oParametersPlusSapSystem = this._getTargetWithCurrentSystem(
                    { params: oParameterDefinition }, oArgsClone.ui5Component
                ).params;

                oParametersPlusSapSystem = this._amendTargetWithSapUshellEncTestParameter({
                    params: oParametersPlusSapSystem
                }).params;
                if (oArgsClone.appStateKey) {
                    oParametersPlusSapSystem["sap-xapp-state"] = [oArgsClone.appStateKey];
                    delete oArgsClone.appStateKey;
                }

                oArgsClone.params = oParametersPlusSapSystem;

                const NavTargetResolution = await Container.getServiceAsync("NavTargetResolution");

                return ushellUtils.promisify(NavTargetResolution.getLinks(oArgsClone));
            }));
        };

        /**
         * Returns a list of semantic objects of the intents the current user can navigate to.
         *
         * @returns {Promise<string[]>} A promise that resolves with an array of strings representing the semantic objects
         *   of the intents the current user can navigate to, or rejects with an error message.
         *   The returned array will not contain duplicates.
         *   <br><b>Note:</b> the caller should not rely on the specific order the semantic objects appear in the returned array.
         *
         * @since 1.120.0
         * @public
         */
        this.getSemanticObjects = async function () {
            const NavTargetResolution = await Container.getServiceAsync("NavTargetResolution");

            return ushellUtils.promisify(NavTargetResolution.getDistinctSemanticObjects());
        };

        /**
         * Calculates whether the given navigation targets are supported for the given parameters, form factor etc. .
         * "Supported" means that a valid navigation target is configured for the user and for the given device.
         *
         * <code>isNavigationSupported</code> is a test function for  {@link sap.ushell.services.Navigation#navigate}
         * and {@link sap.ushell.services.Navigation#getHref}.
         *
         * Example usage:
         * <pre>
         *   const aResult = await oNavigationService.isNavigationSupported([{
         *     target: { shellHash: "SalesOrder-approve?SOId=1234" }
         *   }])
         *   if (aResult[0].supported===true){
         *       // enable link
         *     }
         *     else {
         *       // disable link
         *   }
         * </pre>
         *
         * @param {sap.ushell.services.Navigation.Target[]} aTargets A list of navigation targets to be checked.
         * @param {sap.ui.core.Component} [oComponent] The root component of the application.
         * @returns {Promise<{ supported: boolean }[]>} A promise that resolves to an array of objects indicating
         *                                              whether the intent is supported or not. Each object has a
         *                                              property <code>supported</code> of type <code>boolean</code>.
         *
         * @since 1.120.0
         * @public
         */
        this.isNavigationSupported = async function (aTargets, oComponent) {
            const aClonedIntents = deepClone(aTargets)
                .map((oIntent) => {
                    const { intent } = this._extractInnerAppRoute(oIntent);
                    return this._getTargetWithCurrentSystem(intent, oComponent); // returns only shallow clone
                });

            const NavTargetResolution = await Container.getServiceAsync("NavTargetResolution");

            return ushellUtils.promisify(NavTargetResolution.isNavigationSupported(aClonedIntents));
        };

        /**
         * Tells whether the given URL is supported for the current User.
         *
         * A URL is either supported if it is an intent and a target for the user exists or
         * if it not recognized as a Fiori intent of the same launchpad:
         * Examples for URLs qualified as "supported", e.g.:
         *   * a non-fiori url, e.g. <code>www.sap.com</code> <code>http://mycorp.com/sap/its/webgui</code>
         *   * a hash not recognized as an intent  <code>#someotherhash</code>
         *   * a Fiori URL pointing to a different launchpad
         *
         * <pre>
         * "https://www.sap.com" -> true, not rejected
         * "#NotAFioriHash" -> true, not rejected
         * "#PurchaseOrder-approve?POId=1899" -> true (if application is assigned to user)
         * "#SystemSettings-change?par=critical_par" -> false (assuming application is not assigned to user)
         * "https://some.other.system/Fiori#PurchaseOrder-approve?POId=1899" -> true, not rejected
         * </pre>
         *
         * Note that this only disqualifies intents for the same Launchpad.
         * It does not validate whether a URL is valid in general.
         *
         * @param {string} sUrl URL to test
         * @returns {Promise} A promise which is resolved if the URL
         *                   is supported and rejected if not. The promise does not return parameters.
         *
         * @since 1.120.0
         * @private
         */
        this.isUrlSupported = async function (sUrl) {
            if (typeof sUrl !== "string") {
                return Promise.reject();
            }

            if (UrlParsing.isIntentUrl(sUrl)) {
                const sHash = UrlParsing.getHash(sUrl);
                const oTarget = {
                    target: {
                        shellHash: sHash
                    }
                };
                const oResult = await this.isNavigationSupported([oTarget]);
                if (!oResult[0].supported) {
                    return Promise.reject();
                }
            }
        };

        /**
         * Resolves a given navigation intent (if valid) and returns the respective component instance for further processing.
         *
         * @param {string} sIntent Semantic object and action as a string with a "#" as prefix
         * @param {object} [oComponentData={}] The componentData relevant for this component.
         *                                  <b>Note:</b> Please don't pass <code>startupParameters</code>, <code>config</code>
         *                                  and <code>["sap-xapp-state"]</code>
         * @param {sap.ui.core.Component} [oOwnerComponent] If specified, the created component will be called within the context of the oOwnerComponent
         *   (via oOwnerComponent.runAsOwner(fn))
         * @returns {Promise<sap.ui.core.Component>} A promise resolving the component instance.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted unified inbox
         */
        this.createComponentInstance = async function (sIntent, oComponentData, oOwnerComponent) {
            const Ui5ComponentLoader = await Container.getServiceAsync("Ui5ComponentLoader");

            let oModifiedComponentData = await this.createComponentInstantiationData(sIntent, oComponentData);
            oModifiedComponentData = await Ui5ComponentLoader.modifyComponentProperties(oModifiedComponentData, UI5ComponentType.Application);

            async function createComponent (oAppProperties) {
                try {
                    oAppProperties.loadDefaultDependencies = false;
                    const oAppPropertiesWithComponentHandle = await Ui5ComponentLoader.instantiateComponent(oAppProperties);
                    return oAppPropertiesWithComponentHandle.componentHandle.getInstance();
                } catch (oError) {
                    Log.error(`Cannot create UI5 component: ${oError.toString()}`, oError.stack, "sap.ushell.services.Navigation");
                    return Promise.reject(oError);
                }
            }

            if (oOwnerComponent) {
                return new Promise((resolve, reject) => {
                    oOwnerComponent.runAsOwner(function () {
                        createComponent(oModifiedComponentData)
                            .then(resolve)
                            .catch(reject);
                    });
                });
            }

            return createComponent(oModifiedComponentData);
        };

        /**
         * Resolves a given navigation intent (if valid) and returns the respective component data only for further processing.
         *
         * @param {string} sIntent Semantic object and action as a string with a "#" as prefix
         * @param {object} [oComponentData] The componentData relevant for this component.
         *                                  <b>Note:</b> Please don't pass <code>startupParameters</code>, <code>config</code>
         *                                  and <code>["sap-xapp-state"]</code>
         * @returns {Promise<object>} A promise resolving the instantiation data for the component.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted unified inbox
         */
        this.createComponentInstantiationData = async function (sIntent, oComponentData) {
            const oConfig = {
                componentData: oComponentData
            };

            if (oConfig.componentData) {
                // cleanup componentData
                delete oConfig.componentData.startupParameters;
                delete oConfig.componentData.config;
                delete oConfig.componentData["sap-xapp-state"];
            }

            const sCanonicalIntent = UrlParsing.constructShellHash(UrlParsing.parseShellHash(sIntent));
            if (!sCanonicalIntent) {
                return Promise.reject("Navigation intent invalid!");
            }

            const NavTargetResolution = await Container.getServiceAsync("NavTargetResolution");

            const oResolvedHashFragment = await NavTargetResolution.resolveHashFragment("#" + sCanonicalIntent);

            function finalizeResult (oResultNew) {
                oResultNew = deepExtend({}, oResultNew, oConfig);

                if (!oResultNew.ui5ComponentName) {
                    if (oResultNew.additionalInformation) {
                        oResultNew.ui5ComponentName = oResultNew.additionalInformation.replace(/^SAPUI5\.Component=/, "");
                    } else if (oResultNew.name) {
                        oResultNew.ui5ComponentName = oResultNew.name;
                    }
                }

                return oResultNew;
            }

            async function createComponentData (oResolvedHashFragment) {
                try {
                    const Ui5ComponentLoader = await Container.getServiceAsync("Ui5ComponentLoader");

                    oResolvedHashFragment = finalizeResult(oResolvedHashFragment);
                    oResolvedHashFragment.loadDefaultDependencies = false;
                    return Ui5ComponentLoader.createComponentData(oResolvedHashFragment);
                } catch (oError) {
                    Log.error("Cannot get UI5 component data: " + oError, oError.stack, "sap.ushell.services.Navigation");
                    return Promise.reject(oError);
                }
            }

            // if my-inbox is running in cFLP inside an iframe, we need to
            //  call app index to get the app info so it can be created embedded inside my-inbox.
            if (oResolvedHashFragment.applicationType === ApplicationType.URL.type &&
                oResolvedHashFragment.appCapabilities &&
                oResolvedHashFragment.appCapabilities.appFrameworkId === "UI5" &&
                Container.inAppRuntime()) {
                // do not change the ["require"] to .require. This is to avoid
                //  adding dependencies for non cFLP scenario.
                const [AppLifeCycleAgent] = await ushellUtils.requireAsync(["sap/ushell/appRuntime/ui5/services/AppLifeCycleAgent"]);
                let oAppInfo = await AppLifeCycleAgent.getAppInfo(oResolvedHashFragment.appCapabilities.technicalAppComponentId);
                if (oAppInfo.hasOwnProperty("oResolvedHashFragment")) {
                    oAppInfo = oAppInfo.oResolvedHashFragment;
                }
                oAppInfo = finalizeResult(oAppInfo);
                if (oAppInfo.url && sIntent.indexOf("?") > 0) {
                    oAppInfo.url += "?" + sIntent.split("?")[1];
                }
                // Create the component data and resolve the promise
                return createComponentData({
                    ui5ComponentName: oResolvedHashFragment.appCapabilities.technicalAppComponentId,
                    applicationDependencies: oAppInfo,
                    url: oAppInfo.url
                });
            } else if (oResolvedHashFragment.applicationType !== ApplicationType.URL.type && !(/^SAPUI5\.Component=/.test(oResolvedHashFragment.additionalInformation))) {
                // If the application type equals "URL" and additionalInformation is undefined,
                // the promise will be rejected if additionalInformation is not checked for existence.
                return Promise.reject("The resolved target mapping is not of type UI5 component.");
            }

            // Create the component data and resolve the promise
            return createComponentData(oResolvedHashFragment);
        };

        /**
         * Creates an empty app state object which acts as a parameter container for navigation.
         *
         * @param {sap.ui.core.Component} oAppComponent A UI5 component used as context for the app state.
         * @param {boolean} bTransientEnforced If set to <code>true</code> the appstate is not persisted on the backend. If set to
         *        <code>false</code> or <code>undefined</code> the persistency location is determined by the global ushell configuration.
         * @param {string} sPersistencyMethod See sap/ushell/services/appstate/AppStatePersistencyMethod for possible values.
         *        Support depends on the used platform.
         * @param {object} oPersistencySettings Persistency settings.
         * @returns {Promise<object>} A Promise resolving the app state container.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted SAP-internally public, must not be changed. Not part of public documentation.
         */
        this.createEmptyAppState = async function (oAppComponent, bTransientEnforced, sPersistencyMethod, oPersistencySettings) {
            if (!BaseObject.isA(oAppComponent, "sap.ui.core.UIComponent")) {
                return Promise.reject("The passed oAppComponent must be a UI5 Component.");
            }

            const AppState = await Container.getServiceAsync("AppState");

            return AppState.createEmptyAppState(oAppComponent, bTransientEnforced, sPersistencyMethod, oPersistencySettings);
        };

        /**
         * Get the app state object that was used for the current navigation
         *
         * @param {sap.ui.core.Component} oAppComponent - UI5 component, key will be extracted from component data.
         * @returns {Promise<object>} promise resolving the app state object.
         *                            Note that this is an unmodifiable container and its data must be copied into a writable container!
         * @since 1.120.0
         * @private
         * @ui5-restricted SAP-internally public, must not be changed. Not part of public documentation.
         */
        this.getStartupAppState = function (oAppComponent) {
            this._checkComponent(oAppComponent);
            const sContainerKey = oAppComponent.getComponentData() && oAppComponent.getComponentData()["sap-xapp-state"] && oAppComponent.getComponentData()["sap-xapp-state"][0];
            return this.getAppState(oAppComponent, sContainerKey);
        };

        /**
         * Check that oAppComponent is of proper type.
         * Throws if not correct, returns undefined.
         *
         * @param {sap.ui.core.Component} oAppComponent application component
         *
         * @since 1.120.0
         * @private
         */
        this._checkComponent = function (oAppComponent) {
            if (!BaseObject.isA(oAppComponent, "sap.ui.core.UIComponent")) {
                throw new Error("oComponent passed must be a UI5 Component");
            }
        };

        /**
         * Get an app state object given a key.
         * A lookup for a cross user app state will be performed.
         *
         * @param {sap.ui.core.Component} oAppComponent UI5 component, key will be extracted from component data
         * @param {object} sAppStateKey the application state key.
         * @returns {Promise<object>} promise resolving the app state object.
         *                    <b>Note:</b> that this is an unmodifiable container and its data must be copied into a writable container!
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted SAP-internally public, must not be changed. Not part of public documentation.
         */
        this.getAppState = async function (oAppComponent, sAppStateKey) {
            // see stakeholders in SFIN etc.
            this._checkComponent(oAppComponent);

            const AppState = await Container.getServiceAsync("AppState");

            if (typeof sAppStateKey !== "string") {
                if (sAppStateKey !== undefined) {
                    Log.error("Illegal Argument sAppStateKey ");
                }

                return AppState.createEmptyUnmodifiableAppState(oAppComponent);
            }
            return ushellUtils.promisify(AppState.getAppState(sAppStateKey));
        };

        /**
         * Get data of an AppStates data given a key.
         * A lookup for a cross user app state will be performed.
         * @param {string[]} aAppStateKeys An array of AppState keys.
         * @returns {Promise<object[]>} A promise resolving the list of AppState data.
         *                              Defaults empty object when the AppState could not be retrieved.
         *
         * This is interface exposed to platforms who need a serializable form of the application state data
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted SAP-internally public, must not be changed. Not part of public documentation. (exposure to WebDynpro ABAP)
         */
        this.getAppStateData = async function (aAppStateKeys) {
            if (!Array.isArray(aAppStateKeys)) {
                throw new Error("Unexpected Input: aAppStateKeys has to be an array with app state keys!");
            }
            const AppState = await Container.getServiceAsync("AppState");

            return Promise.all(aAppStateKeys.map((sAppStateKey) => {
                if (typeof sAppStateKey !== "string") {
                    if (sAppStateKey !== undefined) {
                        Log.error("Illegal Argument sAppStateKey ");
                    }
                    return Promise.resolve({}); // default to empty object
                }
                return ushellUtils.promisify(AppState.getAppState(sAppStateKey))
                    .then((oAppState) => {
                        return oAppState.getData();
                    })
                    .catch(() => {
                        return {}; // default to empty object
                    });
            }));
        };

        /**
         * persist multiple app states (in future potentially batched in a single roundtrip)
         *
         * @param {object[]} aAppStates Array of application States
         * @returns {Promise} A Promise,
         *   in case of success an array of individual save promise objects is returned as argument
         *   in case of a reject, individual responses are not available
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted SAP-internally public, must not be changed. Not part of public documentation. (exposure to WebDynpro ABAP)
         */
        this.saveAppStates = function (aAppStates) {
            const aPromises = aAppStates.map((oAppState) => {
                return ushellUtils.promisify(oAppState.save());
            });

            return Promise.all(aPromises);
        };

        /**
         * Apply <code>params</code> to onto <code>shellHash</code> when feature flag <code>processParams</code> is set to true.
         * Parameters already set by the shellHash are ignored.
         * The processing happens in place.
         *
         * @param {sap.ushell.services.Navigation.Target} [oTarget] The navigation target to process
         *
         * @since 1.120.0
         * @private
         */
        this._processShellHashWithParams = function (oTarget) {
            if (isPlainObject(oTarget)) {
                const bEnabled = !!oTarget.processParams;
                const sShellHash = ObjectPath.get("target.shellHash", oTarget);
                const oParams = oTarget.params;
                if (bEnabled && sShellHash && isPlainObject(oParams)) {
                    const oHash = UrlParsing.parseShellHash(sShellHash);

                    oTarget.target = {
                        semanticObject: oHash.semanticObject,
                        action: oHash.action,
                        contextRaw: oHash.contextRaw
                    };
                    oTarget.appSpecificRoute = oHash.appSpecificRoute;
                    oTarget.params = Object.assign({}, oParams, oHash.params);
                }
            }
        };

        /**
         * Method to get an array of sap.ushell.services.AppStatePersistencyMethod.
         *
         * @returns {Promise<sap.ushell.services.AppStatePersistencyMethod[]>} Returns an array of sap.ushell.services.AppStatePersistencyMethod.
         *   An empty array indicates that the platform does not support persistent states
         *
         * @since 1.120.0
         * @private
         */
        this.getSupportedAppStatePersistencyMethods = async function () {
            const AppState = await Container.getServiceAsync("AppState");

            return AppState.getSupportedPersistencyMethods();
        };

        /**
         * Method to set or modify the AppState's persistency method of a state identified by key
         *
         * @param {string} sKey the AppState key
         * @param {int} iPersistencyMethod The chosen persistency method
         * @param {object} oPersistencySettings The additional settings PersistencySettings
         *
         * @returns {Promise<string>} A promise resolving a new key
         *
         * @since 1.120.0
         * @private
         */
        this.updateAppStatePersistencyMethodAndSave = async function (sKey, iPersistencyMethod, oPersistencySettings) {
            const AppState = await Container.getServiceAsync("AppState");

            return ushellUtils.promisify(AppState.makeStatePersistent(sKey, iPersistencyMethod, oPersistencySettings));
        };

        /**
         * Resolves the URL hash fragment.
         * This function gets the hash part of the URL and returns the URL of the target application.
         *
         * @param {string} sHashFragment The formatted URL hash fragment in internal format (as obtained by the SAPUI5 hasher service) not as given in <code>location.hash</code>)!
         *   Example: <code>#SemanticObject-action?P1=V1&P2=A%20B%20C</code>
         * @returns {Promise<{ url: string }>} A Promise resolving the intent.
         *
         * @since 1.120.0
         * @protected
         */
        this.resolveIntent = async function (sHashFragment) {
            const NavTargetResolution = await Container.getServiceAsync("NavTargetResolution");

            return ushellUtils.promisify(NavTargetResolution.resolveHashFragment(sHashFragment))
                .then((oResolvedHashFragment) => {
                    return { url: oResolvedHashFragment.url };
                });
        };
    }

    Navigation.hasNoAdapter = true;
    return Navigation;
});
