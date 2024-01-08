// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @file This file contains miscellaneous utility functions for WebGui stateful container
 */
sap.ui.define([
    "sap/ushell/utils",
    "sap/ushell/components/applicationIntegration/application/PostMessageUtils"
], function (
    ushellUtils, PostMessageUtils
) {
    "use strict";

    var WebGUIStatefulHandler = {};

    WebGUIStatefulHandler.guiStatefulCreateApp = function (oAppLifeCycle, oContainer, oTarget) {
        if (oContainer.setCurrentAppUrl) {
            oContainer.setProperty("currentAppUrl", oTarget.url, true);
        }
        if (oContainer.setCurrentAppTargetResolution) {
            oContainer.setProperty("currentAppTargetResolution", oTarget, true);
        }
        oContainer.setProperty("iframeReusedForApp", true, true);
        return PostMessageUtils.postMessageToIframeApp(oContainer, "sap.gui", "triggerCloseSessionImmediately", {}, true).then(function () {
            return createGuiApp(oContainer, oTarget).then(function () {
                oAppLifeCycle.navTo(oContainer.getId());
                if (oContainer.hasStyleClass("sapUShellApplicationContainerShiftedIframe")) {
                    oContainer.toggleStyleClass("sapUShellApplicationContainerIframeHidden", false);
                } else {
                    oContainer.toggleStyleClass("hidden", false);
                }
            });
        });
    };

    WebGUIStatefulHandler.guiStatefulCloseCurrentApp = function (oContainer) {
        PostMessageUtils.postMessageToIframeApp(oContainer, "sap.gui", "triggerCloseSession", {}, false);
    };

    function createGuiApp (oContainer, oTarget) {
        return new Promise(async function (fnResolve, fnReject) {
            var oPostParams,
                oFLPParams,
                sUrl = oTarget.url;

            function callPostMessage () {
                if (oFLPParams) {
                    oFLPParams["sap-flp-url"] = sap.ushell.Container.getFLPUrl(true);
                    oFLPParams["system-alias"] = oContainer.getSystemAlias();
                    oPostParams["sap-flp-params"] = oFLPParams;
                }
                PostMessageUtils.postMessageToIframeApp(oContainer, "sap.its", "startService", oPostParams, true).then(fnResolve, fnReject);
            }

            sUrl = await ushellUtils.appendSapShellParam(sUrl);
            sUrl = ushellUtils.filterOutParamsFromLegacyAppURL(sUrl);

            oPostParams = {
                url: sUrl
            };
            if (oContainer.getIframeWithPost && oContainer.getIframeWithPost() === true) {
                var oAppStatesInfo = ushellUtils.getParamKeys(sUrl);

                if (oAppStatesInfo.aAppStateNamesArray.length > 0) {
                    sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oService) {
                        oService.getAppStateData(oAppStatesInfo.aAppStateKeysArray).then(function (aDataArray) {
                            oFLPParams = {};
                            oAppStatesInfo.aAppStateNamesArray.forEach(function (item, index) {
                                if (aDataArray[index][0]) {
                                    oFLPParams[item] = aDataArray[index][0];
                                }
                            });
                            callPostMessage();
                        }, function (sError) {
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
        });
    }

    return WebGUIStatefulHandler;
}, /* bExport= */ false);
