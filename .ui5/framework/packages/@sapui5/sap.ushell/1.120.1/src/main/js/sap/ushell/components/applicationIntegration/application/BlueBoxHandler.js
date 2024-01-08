// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview handle all the resources for the different applications.
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/components/applicationIntegration/application/BlueBoxesCache",
    "sap/ushell/components/applicationIntegration/application/PostMessageUtils",
    "sap/ui/thirdparty/jquery",
    "sap/ui/core/Core",
    "sap/ui/thirdparty/hasher",
    "sap/base/Log",
    "sap/ushell/utils"
], function (
    BlueBoxesCache,
    PostMessageUtils,
    jQuery,
    Core,
    hasher,
    Log,
    utils
) {
    "use strict";

    function BlueBoxHandler () {
        var oBlueBoxContainer = {},
            oBasicStatefulCapabilities = [
                {
                    service: "sap.ushell.services.AppLifeCycle",
                    action: "create"
                }, {
                    service: "sap.ushell.services.AppLifeCycle",
                    action: "destroy"
                }
            ];

        this.STATEFUL_TYPES = {
            NOT_SUPPORTED: 0,
            GUI_V1: 1,
            FLP_V2: 2
        };

        this.init = function () {
            oBlueBoxContainer = {};
            BlueBoxesCache.init();
        };

        this.AddNewBlueBox = function (oBlueBox, oTarget, oInitialCapabilities) {
            oBlueBoxContainer[oBlueBox] = oBlueBox;
            BlueBoxesCache.add(oTarget.url, oBlueBox);
            if (oBlueBox.setBlueBoxCapabilities) {
                oBlueBox.setProperty("blueBoxCapabilities", {}, true);
            }
            if (oInitialCapabilities) {
                this.addCapabilities(oBlueBox, oInitialCapabilities);
            }
        };

        this.deleteBlueBoxByUrl = function (sUrl) {
            if (sUrl) {
                var oContainer = BlueBoxesCache.get(sUrl);
                if (oContainer && oBlueBoxContainer[oContainer]) {
                    delete oBlueBoxContainer[oContainer];
                }
                BlueBoxesCache.remove(sUrl);
            }
        };

        this.deleteBlueBoxByContainer = function (oContainer) {
            if (oContainer && oBlueBoxContainer[oContainer]) {
                delete oBlueBoxContainer[oContainer];
                BlueBoxesCache.removeByContainer(oContainer);
            }
        };

        this.getBlueBoxesCount = function () {
            return Object.keys(oBlueBoxContainer).length + BlueBoxesCache.getSize(true);
        };

        this.getBlueBoxByUrl = function (sUrl) {
            return BlueBoxesCache.get(sUrl);
        };

        this.getBlueBoxById = function (sId) {
            return BlueBoxesCache.getById(sId);
        };

        this.addCapabilities = function (oBlueBox, oCapabilities) {
            if (!oBlueBoxContainer[oBlueBox] || !oBlueBox.getBlueBoxCapabilities) {
                return;
            }

            var oCapMap = oBlueBox.getBlueBoxCapabilities();
            oCapabilities.forEach(function (oCap) {
                if (oCap.service === "sap.ushell.services.appLifeCycle") {
                    oCap.service = "sap.ushell.services.AppLifeCycle";
                }
                oCapMap[oCap.service + "." + oCap.action] = true;
            });
            if (oCapMap["sap.ushell.services.AppLifeCycle.create"]) {
                oBlueBox.setProperty("statefulType", this.STATEFUL_TYPES.FLP_V2, true);
            }
        };

        this.removeCapabilities = function (oBlueBox, oCapabilities) {
            if (!oBlueBoxContainer[oBlueBox] || !oBlueBox.getBlueBoxCapabilities) {
                return;
            }

            if (!oCapabilities) {
                oBlueBox.setProperty("blueBoxCapabilities", {}, true);
            } else {
                var oCapMap = oBlueBox.getBlueBoxCapabilities();
                oCapabilities.forEach(function (oCap) {
                    delete oCapMap[oCap.service + "." + oCap.action];
                    if (oCap.service + "." + oCap.action === "sap.ushell.services.AppLifeCycle.create") {
                        oBlueBox.setProperty("statefulType", 0 - oBlueBox.getStatefulType(), true);
                    }
                });
            }
        };

        this.statefulCreateApp = function (oInnerControl, sUrl, sStorageKey, oTarget, bNavigationInSameStatefullContainer) {
            var oDeferred = new jQuery.Deferred(),
                oFLPParams,
                oPostParams;

            function callPostMessage () {
                if (oFLPParams) {
                    oFLPParams["sap-flp-url"] = sap.ushell.Container.getFLPUrl(true);
                    oFLPParams["system-alias"] = oInnerControl.getSystemAlias();
                    oPostParams["sap-flp-params"] = oFLPParams;
                }

                Core.getEventBus().publish("launchpad", "appOpening", oTarget);
                PostMessageUtils.postMessageToIframeApp(
                    oInnerControl, "sap.ushell.services.appLifeCycle", "create", oPostParams, true)
                    .then(function (oResult) {
                        sap.ushell.Container.getServiceAsync("AppLifeCycle").then(function (oAppLifeCycleService) {
                            if (bNavigationInSameStatefullContainer === true) {
                                oAppLifeCycleService.prepareCurrentAppObject("URL", undefined, false, oInnerControl);
                            }
                            Core.getEventBus().publish("sap.ushell", "appOpened", oTarget);
                            oDeferred.resolve(oResult && oResult.body && oResult.body.result);
                        });
                    });
            }

            oInnerControl.setProperty("currentAppUrl", sUrl, true);
            oInnerControl.setProperty("currentAppId", sStorageKey, true);
            oInnerControl.setProperty("currentAppTargetResolution", oTarget, true);

            if (oInnerControl._checkNwbcUrlAdjustment) {
                sUrl = oInnerControl._checkNwbcUrlAdjustment(oInnerControl, oTarget.applicationType, sUrl);
            }
            oPostParams = {
                sCacheId: sStorageKey,
                sUrl: sUrl,
                sHash: hasher.getHash()
            };
            if (sUrl.indexOf("sap-iframe-hint=GUI") > 0 || sUrl.indexOf("sap-iframe-hint=WDA") > 0 || sUrl.indexOf("sap-iframe-hint=WCF") > 0) {
                var oAppStatesInfo = utils.getParamKeys(sUrl);

                if (oAppStatesInfo.aAppStateNamesArray.length > 0) {
                    sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCANService) {
                        oCANService.getAppStateData(oAppStatesInfo.aAppStateKeysArray).then(function (aDataArray) {
                            oFLPParams = {};
                            oAppStatesInfo.aAppStateNamesArray.forEach(function (item, index) {
                                if (aDataArray[index][0]) {
                                    oFLPParams[item] = aDataArray[index][0];
                                }
                            });
                            callPostMessage();
                        }, function () {
                            callPostMessage();
                        });
                    });
                } else {
                    oFLPParams = {};
                    callPostMessage();
                }
            } else {
                callPostMessage();
            }

            return oDeferred.promise();
        };

        this.statefulDestroyApp = function (oInnerControl, sStorageKey) {
            var oPromise,
                oAppTarget;

            oInnerControl.setProperty("currentAppUrl", "", true);
            oInnerControl.setProperty("currentAppId", "", true);
            oAppTarget = oInnerControl.getCurrentAppTargetResolution();
            oInnerControl.setProperty("currentAppTargetResolution", undefined, true);
            sap.ushell.Container.setAsyncDirtyStateProvider(undefined);
            oPromise = PostMessageUtils.postMessageToIframeApp(oInnerControl, "sap.ushell.services.appLifeCycle", "destroy", {
                sCacheId: sStorageKey
            }, true);

            oPromise.then(function () {
                Core.getEventBus().publish("sap.ushell", "appClosed", oAppTarget);
            });
            return oPromise;
        };

        this.statefulStoreKeepAliveApp = function (oInnerControl, sStorageKey) {
            var oPromise,
                oAppTarget;

            oInnerControl.setProperty("currentAppUrl", "", true);
            oInnerControl.setProperty("currentAppId", "", true);
            oAppTarget = oInnerControl.getCurrentAppTargetResolution();
            oInnerControl.setProperty("currentAppTargetResolution", undefined, true);
            sap.ushell.Container.setAsyncDirtyStateProvider(undefined);
            oPromise = PostMessageUtils.postMessageToIframeApp(oInnerControl, "sap.ushell.services.appLifeCycle", "store", {
                sCacheId: sStorageKey
            }, true);

            oPromise.then(function () {
                Core.getEventBus().publish("sap.ushell", "appClosed", oAppTarget);
            });
            return oPromise;
        };

        this.statefulRestoreKeepAliveApp = function (oInnerControl, sUrl, sStorageKey, oTarget, bNavigationInSameStatefullContainer) {
            return new Promise(function (fnResolve) {
                oInnerControl.setProperty("currentAppUrl", sUrl, true);
                oInnerControl.setProperty("currentAppId", sStorageKey, true);
                oInnerControl.setProperty("currentAppTargetResolution", oTarget, true);
                Core.getEventBus().publish("launchpad", "appOpening", oTarget);
                PostMessageUtils.postMessageToIframeApp(oInnerControl, "sap.ushell.services.appLifeCycle", "restore", {
                    sCacheId: sStorageKey,
                    sUrl: oTarget.url,
                    sHash: hasher.getHash()
                }, true).then(function () {
                    sap.ushell.Container.getServiceAsync("AppLifeCycle").then(function (oAppLifeCycleService) {
                        if (bNavigationInSameStatefullContainer === true) {
                            oAppLifeCycleService.prepareCurrentAppObject("URL", undefined, false, oInnerControl);
                        }
                        Core.getEventBus().publish("sap.ushell", "appOpened", oTarget);
                        fnResolve();
                    });
                });
            });
        };

        this.isCapabilitySupported = function (oBlueBox, sServiceName, sInterface) {
            if (oBlueBox && oBlueBox.getBlueBoxCapabilities && oBlueBox.getBlueBoxCapabilities()[sServiceName + "." + sInterface]) {
                return true;
            }
            return false;
        };

        this.isStatefulContainer = function (oBlueBox) {
            return this.isCapabilitySupported(oBlueBox, "sap.ushell.services.AppLifeCycle", "create");
        };

        this.isIframeIsValidSupported = function (oBlueBox) {
            return this.isCapabilitySupported(oBlueBox, "sap.ushell.appRuntime", "iframeIsValid");
        };

        this.isStatefulContainerInKeepAlivePool = function (oBlueBox) {
            return !!(oBlueBox && oBlueBox.getStatefulType && oBlueBox.getStatefulType() < this.STATEFUL_TYPES.NOT_SUPPORTED);
        };

        this.findFreeContainerForNewKeepAliveApp = function (oTarget) {
            if (!oTarget) {
                return undefined;
            }
            if (!utils.isSAPLegacyApplicationType(oTarget.applicationType, oTarget.appCapabilities && oTarget.appCapabilities.appFrameworkId)) {
                return undefined;
            }

            var oFreeContainer;
            var sTmpUrl = oTarget.url.replaceAll("sap-keep-alive", "sap-temp");

            oFreeContainer = BlueBoxesCache.get(sTmpUrl, true);
            if (oFreeContainer) {
                oBlueBoxContainer[oFreeContainer] = oFreeContainer;
            } else {
                oFreeContainer = BlueBoxesCache.get(sTmpUrl);
                if (oFreeContainer && oFreeContainer.getStatefulType() > this.STATEFUL_TYPES.NOT_SUPPORTED) {
                    if (oFreeContainer.getStatefulType() === this.STATEFUL_TYPES.FLP_V2) {
                        this.removeCapabilities(oFreeContainer, oBasicStatefulCapabilities);
                    } else {
                        oFreeContainer.setProperty("statefulType", 0 - oFreeContainer.getStatefulType(), true);
                    }
                    BlueBoxesCache.remove(sTmpUrl);
                }
            }

            if (oFreeContainer) {
                BlueBoxesCache.add(oTarget.url, oFreeContainer);
                oFreeContainer.setProperty("currentAppUrl", "", true);
                oFreeContainer.setProperty("isFetchedFromCache", true, true);
            }

            return oFreeContainer;
        };

        this.returnUnusedKeepAliveContainer = function (oAppContainer) {
            if (!oAppContainer) {
                return false;
            }
            if (!utils.isSAPLegacyApplicationType(oAppContainer.getApplicationType && oAppContainer.getApplicationType(),
                oAppContainer.getFrameworkId && oAppContainer.getFrameworkId())) {
                return false;
            }

            if (oAppContainer.getStatefulType() < this.STATEFUL_TYPES.NOT_SUPPORTED) {
                var sUrl = oAppContainer.getCurrentAppUrl();
                var sKey = BlueBoxesCache.getBlueBoxCacheKeyValues(sUrl.replaceAll("sap-keep-alive", "sap-temp")).sKey;
                var oHostMainContainer = BlueBoxesCache.get(sKey);
                if (oHostMainContainer) {
                    //If we're here, it means that there's already a stateful container Iframe, so we need to add
                    //this oAppContainer to the keep alive pool
                    BlueBoxesCache.add(sUrl.replaceAll("sap-keep-alive", "sap-temp"), oAppContainer, true);
                    this.deleteBlueBoxByUrl(sUrl);
                } else {
                    BlueBoxesCache.remove(sUrl);
                    BlueBoxesCache.add(sUrl.replaceAll("sap-keep-alive", "sap-temp"), oAppContainer);
                    if (oAppContainer.getStatefulType() === -this.STATEFUL_TYPES.FLP_V2) {
                        this.addCapabilities(oAppContainer, oBasicStatefulCapabilities);
                    } else {
                        oAppContainer.setProperty("statefulType", this.STATEFUL_TYPES.GUI_V1, true);
                    }
                }
                oAppContainer.setProperty("currentAppUrl", "", true);
                oAppContainer.setProperty("isFetchedFromCache", false, true);
                return true;
            }
            return false;
        };

        this.changeAppContainerToKeepAlive = function (oAppContainer) {
            if (!utils.isSAPLegacyApplicationType(oAppContainer.getApplicationType && oAppContainer.getApplicationType(),
                oAppContainer.getFrameworkId && oAppContainer.getFrameworkId())) {
                return false;
            }
            oAppContainer.setProperty("statefulType", -oAppContainer.getStatefulType(), true);
            BlueBoxesCache.remove(oAppContainer.getCurrentAppUrl());
            BlueBoxesCache.add(oAppContainer.getCurrentAppUrl() + "&sap-keep-alive=restricted", oAppContainer);
            return true;
        };

        this.getStatefulContainerType = function (sUrl, bIgnoreKeepAlive) {
            if (bIgnoreKeepAlive === true) {
                sUrl = sUrl.replaceAll("sap-keep-alive", "sap-temp");
            }
            var oContainer = BlueBoxesCache.get(sUrl);
            if (oContainer) {
                return oContainer.getStatefulType();
            }
            return this.STATEFUL_TYPES.NOT_SUPPORTED;
        };

        this.forEach = function (callback) {
            Object.keys(oBlueBoxContainer).forEach(function (key) {
                callback(oBlueBoxContainer[key]);
            });
            BlueBoxesCache.forEach(callback);
        };

        this.destroyApp = function (sAppId) {
            PostMessageUtils.postMessageToMultipleIframes("sap.ushell.services.appLifeCycle", "destroy", {
                appId: sAppId
            });
        };

        this.storeApp = function (sAppId) {
            PostMessageUtils.postMessageToMultipleIframes("sap.ushell.services.appLifeCycle", "store", {
                appId: sAppId,
                sHash: hasher.getHash()
            });
        };

        this.restoreApp = function (sAppId) {
            PostMessageUtils.postMessageToMultipleIframes("sap.ushell.services.appLifeCycle", "restore", {
                appId: sAppId,
                sHash: hasher.getHash()
            });
        };

        this._getStorageForDebug = function () {
            return {
                oBlueBoxContainer: oBlueBoxContainer,
                oBlueBoxesCache: BlueBoxesCache._getStorageForDebug()
            };
        };
    }

    return new BlueBoxHandler();
}, /* bExport= */ true);
