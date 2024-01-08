// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/appRuntime/ui5/AppCommunicationMgr",
    "sap/ushell/appRuntime/ui5/AppRuntimeService",
    "sap/base/util/extend",
    "sap/base/util/UriParameters",
    "sap/ui/thirdparty/URI",
    "sap/ui/Device",
    "sap/ui/core/BusyIndicator",
    "sap/ushell/appRuntime/ui5/performance/FesrEnhancer",
    "sap/ushell/EventHub",
    "sap/base/Log",
    "sap/ui/thirdparty/hasher",
    "sap/ui/core/Core",
    "sap/ushell/utils/UrlParsing",
    "sap/ushell/appRuntime/ui5/AppRuntimeContext",
    "sap/base/assert",
    "sap/ushell/resources"
], function (
    AppCommunicationMgr,
    AppRuntimeService,
    extend,
    UriParameters,
    URI,
    Device,
    BusyIndicator,
    FesrEnhancer,
    EventHub,
    Log,
    hasher,
    Core,
    oUrlParsing,
    AppRuntimeContext,
    assert,
    resources
) {

    "use strict";

    function AppLifeCycleAgent () {
        var that = this,
            sAppResolutionModule,
            oAppResolution,
            bEnableAppResolutionCache = true,
            oAppResolutionCache = {},
            fnCreateApplication,
            oCachedApplications = {},
            oRouterDisableRetriggerApplications = {},
            oAppDirtyStateProviders = {},
            oAppBackNavigationFunc = {},
            oRunningApp,
            fnRenderApp,
            oShellUIService,
            sDatalossMessage,
            oShellNavigationService;

        /**
         * @private
         */
        this.init = function (sModule, ofnCreateApplication, ofnRenderApp, bEnableCache, sAppId, oAppInfo) {
            this.resetCurrentApp();
            sAppResolutionModule = sModule;
            fnCreateApplication = ofnCreateApplication;
            fnRenderApp = ofnRenderApp;
            if (bEnableCache !== undefined) {
                bEnableAppResolutionCache = bEnableCache;
            }
            this.addAppInfoToCache(sAppId, oAppInfo);

            // register this create & destroy as a appLifeCycleCommunication handler
            AppCommunicationMgr.registerCommHandlers({
                "sap.ushell.services.appLifeCycle": {
                    oServiceCalls: {
                        create: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                return that.create(oMsg);
                            }
                        },
                        destroy: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                return that.destroy(oMsg);
                            }
                        },
                        store: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                return that.store(oMsg);
                            }
                        },
                        restore: {
                            executeServiceCallFn: function (oMessageData) {
                                var oMsg = JSON.parse(oMessageData.oMessage.data);
                                return that.restore(oMsg);
                            }
                        }
                    }
                }
            });
            EventHub.on("disableKeepAliveRestoreRouterRetrigger").do(function (oData) {
                if (oData.componentId && oRouterDisableRetriggerApplications[oData.componentId]) {
                    oRouterDisableRetriggerApplications[oData.componentId] = oData.disable;
                }
            });

            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.appLifeCycle.setup", {
                    isStateful: true,
                    isKeepAlive: true,
                    isIframeValid: true,
                    session: {
                        bLogoutSupport: true
                    }
                });

            //handle dirty state confirmation dialog within the iframe and not
            //in the outer shell
            if (!resources.browserI18n) {
                resources.browserI18n = resources.getTranslationModel(window.navigator.language).getResourceBundle();
            }
            sDatalossMessage = resources.browserI18n.getText("dataLossExternalMessage");
            window.onbeforeunload = function () {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getDirtyFlag()) {
                    return sDatalossMessage;
                }
                return undefined;
            };
        };

        /**
         * @private
         */
        this.create = function (oMsg) {
            return new Promise(function (fnResolve, fnReject) {
                var sUrl,
                    sAppId,
                    sAppIntent,
                    oParsedShellIntent,
                    sScubeAppIntent = "",
                    sKeepAliveAppKey;

                FesrEnhancer.startInteraction();

                sUrl = oMsg.body.sUrl;
                if (AppRuntimeContext.getIsScube()) {
                    sAppIntent = UriParameters.fromURL(sUrl).get("sap-remote-intent");
                    assert(typeof sAppIntent === "string", "AppLifeCycleAgent::create - sAppIntent must be string");
                    if (oMsg.body.sHash.indexOf("Shell-startIntent") === 0) {
                        oParsedShellIntent = oUrlParsing.parseShellHash(oMsg.body.sHash);
                        sScubeAppIntent = oParsedShellIntent.params["sap-shell-so"] + "-" + oParsedShellIntent.params["sap-shell-action"];
                    }
                } else {
                    sAppId = UriParameters.fromURL(sUrl).get("sap-ui-app-id");
                    assert(typeof sAppId === "string", "AppLifeCycleAgent::create - sAppId must be string");
                }

                hasher.disableCFLPUpdate = true;
                hasher.replaceHash("");
                hasher.replaceHash(oMsg.body.sHash);
                hasher.disableCFLPUpdate = false;

                //BusyIndicator work in hidden iframe only in chrome
                if (Device.browser.chrome) {
                    BusyIndicator.show(0);
                }
                if (oShellUIService) {
                    oShellUIService._resetBackNavigationCallback();
                }
                Core.getEventBus().publish("launchpad", "appOpening", {});
                that.getAppInfo(sAppId, sUrl, sAppIntent).then(function (values) {
                    if (AppRuntimeContext.getIsScube() && sScubeAppIntent.length > 0) {
                        sKeepAliveAppKey = Object.keys(oCachedApplications).find(function (sCachedKey) {
                            return oCachedApplications[sCachedKey].sAppIntent === sScubeAppIntent && oCachedApplications[sCachedKey].ui5ComponentName === values.oResolvedHashFragment.ui5ComponentName;
                        });
                        if (sKeepAliveAppKey) {
                            that.destroy({
                                body: {
                                    sCacheId: sKeepAliveAppKey
                                }
                            }, true);
                        }
                    }
                    that.expandSapIntentParams(new URI(sUrl).query(true)).then(function (oURLParameters) {
                        fnCreateApplication(sAppId, oURLParameters, values.oResolvedHashFragment, sAppIntent, values.oParsedHash)
                            .then(function (oCreateApplicationResult) {
                                fnRenderApp(oCreateApplicationResult);
                                Core.getEventBus().publish("sap.ushell", "appOpened", {});
                                fnResolve({
                                    deletedKeepAliveId: sKeepAliveAppKey
                                });
                            });
                    });
                });
            });
        };

        /**
         * @private
         */
        this.destroy = function (oMsg, bDestroyKeepAlive) {
            function appDestroy (oApplication) {
                var sAppId = oApplication.sId || "<unkown>";
                try {
                    oApplication.destroy();
                } catch (e) {
                    Log.error("exception when trying to close sapui5 application with id '" + sAppId +
                        "' when running inside the appruntim iframe '" + document.URL +
                            "'. This error must be fixed in order for the iframe to operate properly.\n",
                        e.stack,
                        "sap.ushell.appRuntime.ui5.services.AppLifeCycleAgent::destroy");
                }
            }

            if (oRunningApp.oApp === undefined && bDestroyKeepAlive !== true) {
                AppRuntimeService.sendMessageToOuterShell("sap.ushell.appRuntime.isInvalidIframe", {bValue: true});
                return Promise.resolve();
            }

            var sStorageKey = oMsg.body.sCacheId;

            if (sStorageKey && oCachedApplications[sStorageKey]) {
                if (oCachedApplications[sStorageKey].oApp === oRunningApp.oApp) {
                    this.resetCurrentApp();
                }
                delete oRouterDisableRetriggerApplications[oCachedApplications[sStorageKey].oApp.sId];
                appDestroy(oCachedApplications[sStorageKey].oApp);
                delete oCachedApplications[sStorageKey];
            } else if (oRunningApp.oApp) {
                delete oRouterDisableRetriggerApplications[oRunningApp.oApp.sId];
                appDestroy(oRunningApp.oApp);
                this.resetCurrentApp();
            }
            sap.ushell.Container.cleanDirtyStateProviderArray();
            if (oShellUIService) {
                oShellUIService._resetBackNavigationCallback();
            }
            FesrEnhancer.setAppShortId();
            Core.getEventBus().publish("sap.ushell", "appClosed", {});

            return Promise.resolve();
        };

        /**
         * @private
         */
        this.store = function (oMsg) {
            var sStorageKey = oMsg.body.sCacheId,
                oCachedEntry = this.cloneCurrentAppEntry(oRunningApp),
                oApp;

            if (oRunningApp.oApp === undefined) {
                AppRuntimeService.sendMessageToOuterShell("sap.ushell.appRuntime.isInvalidIframe", {bValue: true});
                return Promise.resolve();
            }

            oCachedApplications[sStorageKey] = oCachedEntry;
            if (oShellUIService) {
                oAppBackNavigationFunc[sStorageKey] = oShellUIService._getBackNavigationCallback();
            }

            oApp = oCachedEntry.oApp.getComponentInstance();
            oCachedEntry.oApp.setVisible(false);

            // keep application's dirty state providers when stored
            if (sap.ushell.Container) {
                oAppDirtyStateProviders[sStorageKey] = sap.ushell.Container.getAsyncDirtyStateProviders();
                sap.ushell.Container.cleanDirtyStateProviderArray();
            }

            if (oApp) {
                if (oApp.isKeepAliveSupported && oApp.isKeepAliveSupported() === true) {
                    oApp.deactivate();
                } else {
                    if (oApp.suspend) {
                        oApp.suspend();
                    }
                    if (oApp.getRouter && oApp.getRouter()) {
                        oApp.getRouter().stop();
                    }
                }
            }
            Core.getEventBus().publish("sap.ushell", "appClosed", {});

            return Promise.resolve();
        };

        /**
         * @private
         */
        this.restore = function (oMsg) {
            var sStorageKey = oMsg.body.sCacheId,
                oCachedEntry = oCachedApplications[sStorageKey],
                oApp = oCachedEntry.oApp.getComponentInstance(),
                bRouterDisableRetrigger = oRouterDisableRetriggerApplications[oCachedEntry.oApp.sId];

            hasher.disableCFLPUpdate = true;
            hasher.replaceHash("");
            hasher.replaceHash(oMsg.body.sHash);
            hasher.disableCFLPUpdate = false;

            Core.getEventBus().publish("launchpad", "appOpening", {});
            oCachedEntry.oApp.setVisible(true);

            // re-register application's dirty state providers when restored
            if (oAppDirtyStateProviders[sStorageKey] && sap.ushell.Container) {
                sap.ushell.Container.setAsyncDirtyStateProviders(oAppDirtyStateProviders[sStorageKey]);
            }
            if (oShellUIService) {
                oShellUIService.setBackNavigation(oAppBackNavigationFunc[sStorageKey]);
            }

            if (oApp) {
                if (oApp.isKeepAliveSupported && oApp.isKeepAliveSupported() === true) {
                    oApp.activate();
                } else {
                    if (oApp.restore) {
                        oApp.restore();
                    }
                    if (oApp.getRouter && oApp.getRouter() && oApp.getRouter().initialize) {
                        if (bRouterDisableRetrigger === false) {
                            oApp.getRouter().initialize();
                        } else {
                            oApp.getRouter().initialize(true);
                        }
                    }
                }

                oRunningApp = this.cloneCurrentAppEntry(oCachedEntry);
            }
            Core.getEventBus().publish("sap.ushell", "appOpened", {});

            setTimeout(function () {
                AppRuntimeService.sendMessageToOuterShell("sap.ushell.services.AppLifeCycle.setNewAppInfo", {info: oCachedEntry.oAppAttributes});
            }, 500);

            return Promise.resolve();
        };

        /**
         * @private
         */
        this.expandSapIntentParams = function (oUrlParameters) {
            return new Promise(function (fnResolve, fnReject) {
                if (oUrlParameters.hasOwnProperty("sap-intent-param")) {
                    var sAppStateKey = oUrlParameters["sap-intent-param"];
                    AppRuntimeService.sendMessageToOuterShell("sap.ushell.services.CrossApplicationNavigation.getAppStateData", { sAppStateKey: sAppStateKey })
                        .then(function (sParameters) {
                            delete oUrlParameters["sap-intent-param"];
                            var oUrlParametersExpanded = extend({}, oUrlParameters, (new URI("?" + sParameters)).query(true), true);
                            fnResolve(oUrlParametersExpanded);
                        }, function (sError) {
                            fnResolve(oUrlParameters);
                        });
                } else {
                    fnResolve(oUrlParameters);
                }
            });
        };

        /**
         * @private
         */
        this.addAppParamsToIntent = function (sUrl, sAppIntent) {
            return that.expandSapIntentParams(new URI(sUrl).query(true)).then(function (oURLParameters) {
                return that.getApplicationParameters(oURLParameters);
            });
        };

        /**
         * @private
         */
        this.getApplicationParameters = function (oURLParameters) {
            return new Promise(function (fnResolve) {
                var oStartupParameters,
                    sSapIntentParam,
                    sStartupParametersWithoutSapIntentParam;

                function buildFinalParamsString (sSimpleParams, sIntentParams) {
                    var sParams = "";
                    if (sSimpleParams && sSimpleParams.length > 0) {
                        sParams = (sSimpleParams.startsWith("?") ? "" : "?") + sSimpleParams;
                    }
                    if (sIntentParams && sIntentParams.length > 0) {
                        sParams += (sParams.length > 0 ? "&" : "?") + sIntentParams;
                    }
                    return sParams;
                }

                if (oURLParameters.hasOwnProperty("sap-startup-params")) {
                    oStartupParameters = (new URI("?" + oURLParameters["sap-startup-params"])).query(true);
                    if (oStartupParameters.hasOwnProperty("sap-intent-param")) {
                        sSapIntentParam = oStartupParameters["sap-intent-param"];
                        delete oStartupParameters["sap-intent-param"];
                    }
                    sStartupParametersWithoutSapIntentParam = (new URI("?")).query(oStartupParameters).toString();

                    //Handle the case when the parameters that were sent to the application were more than 1000 characters and in
                    //the URL we see a shorten value of the parameters
                    if (sSapIntentParam) {
                        AppRuntimeService.sendMessageToOuterShell("sap.ushell.services.CrossApplicationNavigation.getAppStateData", { sAppStateKey: sSapIntentParam })
                            .then(function (sMoreParams) {
                                fnResolve(buildFinalParamsString(sStartupParametersWithoutSapIntentParam, sMoreParams));
                            }, function (sError) {
                                fnResolve(buildFinalParamsString(sStartupParametersWithoutSapIntentParam));
                            });
                    } else {
                        fnResolve(buildFinalParamsString(sStartupParametersWithoutSapIntentParam));
                    }
                } else {
                    fnResolve("");
                }
            });
        };

        /**
         * @private
         */
        this.getAppInfo = function (appId, sUrl, sAppIntent) {
            return new Promise(function (fnResolve) {
                if (sAppIntent) {
                    that.addAppParamsToIntent(sUrl, sAppIntent).then(function (sParams) {
                        if (sParams.length > 0) {
                            //remove un-needed parameters from the parameters list before the target resolution
                            sParams = new URI(sParams)
                                .removeSearch("sap-remote-system")
                                .removeSearch("sap-ushell-defaultedParameterNames")
                                .toString();
                        }
                        sap.ushell.Container.getServiceAsync("NavTargetResolution").then(function (oNavTargetResolution) {
                            oNavTargetResolution.resolveHashFragmentLocal("#" + sAppIntent + sParams)
                                .done(function (oResolvedHashFragment) {
                                    var oParsedHash = oUrlParsing.parseShellHash("#" + sAppIntent + sParams);
                                    fnResolve({
                                        oResolvedHashFragment: oResolvedHashFragment,
                                        oParsedHash: oParsedHash
                                    });
                                })
                                .fail(function (sMsg) {
                                    //oDeferred.reject(sMsg);
                                });
                        });
                    });
                } else {
                    var fnGetAppInfo = function () {
                        oAppResolution.getAppInfo(appId, sUrl).then(function (oAppInfo) {
                            that.addAppInfoToCache(appId, oAppInfo);
                            fnResolve({
                                oResolvedHashFragment: oAppInfo
                            });
                        });
                    };

                    if (bEnableAppResolutionCache === true && oAppResolutionCache[appId]) {
                        fnResolve({
                            oResolvedHashFragment: JSON.parse(JSON.stringify(oAppResolutionCache[appId]))
                        });
                    } else if (oAppResolution) {
                        fnGetAppInfo();
                    } else {
                        sap.ui.require([sAppResolutionModule.replace(/\./g, "/")], function (oObj) {
                            oAppResolution = oObj;
                            fnGetAppInfo();
                        });
                    }
                }
            });
        };

        /**
         * @private
         */
        this.addAppInfoToCache = function (sAppId, oAppInfo) {
            if (sAppId && oAppInfo &&
                bEnableAppResolutionCache === true &&
                oAppResolutionCache[sAppId] === undefined) {
                oAppResolutionCache[sAppId] = JSON.parse(JSON.stringify(oAppInfo));
            }
        };

        /**
         * @private
         */
        this.setCurrentApp = function (oApp, sAppIntent, ui5ComponentName) {
            this.resetCurrentApp();
            oRunningApp.oApp = oApp;
            oRunningApp.sAppIntent = sAppIntent;
            oRunningApp.ui5ComponentName = ui5ComponentName;
            // Initializing the disableKeepAliveRestoreRouterRetrigger flag to true
            if (oRunningApp.oApp) {
                oRouterDisableRetriggerApplications[oRunningApp.oApp.sId] = true;
            }
        };

        /**
         * @private
         */
        this.setCurrentAppAttributes = function (oAppInfo) {
            oRunningApp.oAppAttributes = oAppInfo;
        };

        /**
         * @private
         */
        this.resetCurrentApp = function () {
            oRunningApp = {
                oApp: undefined,
                sAppIntent: undefined,
                ui5ComponentName: undefined,
                oAppAttributes: {}
            };
        };

        this.cloneCurrentAppEntry = function (oEntry) {
            return {
                oApp: oEntry.oApp,
                sAppIntent: oEntry.sAppIntent,
                ui5ComponentName: oEntry.ui5ComponentName,
                oAppAttributes: oEntry.oAppAttributes
            };
        };

        /**
         * @private
         */
        this.setShellUIService = function (oService) {
            oShellUIService = oService;
        };

        /**
         * @private
         */
        this.setShellNavigationService = function (oService) {
            oShellNavigationService = oService;
        };

        /**
         * @private
         */
        this.checkDataLossAndContinue = function () {
            if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getDirtyFlag(oShellNavigationService.getNavigationContext())) {
                // eslint-disable-next-line no-alert
                if (window.confirm(sDatalossMessage)) {
                    sap.ushell.Container.setDirtyFlag(false);
                    return true;
                } else {
                    return false;
                }
            }
            return true;
        };
    }

    return new AppLifeCycleAgent();
}, true);
