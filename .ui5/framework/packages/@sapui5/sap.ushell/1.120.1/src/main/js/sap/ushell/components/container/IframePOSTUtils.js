// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @file This file contains miscellaneous utility functions for handling openning iframe with POST.
 */
sap.ui.define([
    "sap/ui/core/Core",
    "sap/base/Log",
    "sap/base/util/UriParameters",
    "sap/ui/thirdparty/jquery",
    "sap/ui/thirdparty/URI",
    "sap/ushell/utils",
    "sap/ushell/resources",
    "sap/ushell/Config"
], function (
    Core,
    Log,
    UriParameters,
    jQuery,
    URI,
    utils,
    resources,
    Config
) {
    "use strict";

    var IframePOSTUtils = {};
    var _that = IframePOSTUtils;

    IframePOSTUtils.renderIframeWithPOST = function (oRenderManager, oContainer, sUrl, iIframeIdx) {
        oContainer.setProperty("iframeWithPost", true, true);
        oContainer.oDeferredRenderer = new jQuery.Deferred();
        sUrl = utils.filterOutParamsFromLegacyAppURL(sUrl);
        var oAppStatesInfo = utils.getParamKeys(sUrl);

        //generate the <div> element that wraps the <form> and the <iframe>
        this.generateRootElementForIFrame(oRenderManager, oContainer, true);

        if (oAppStatesInfo.aAppStateNamesArray.length > 0) {
            sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCAService) {
                oCAService.getAppStateData(oAppStatesInfo.aAppStateKeysArray).then(function (aDataArray) {
                    var oNewRenderManager;
                    var oDomRef = jQuery("#" + oContainer.getId());

                    if (oDomRef.length > 0) {
                        oNewRenderManager = Core.createRenderManager();
                        _that.buildHTMLElements(oNewRenderManager, oContainer, aDataArray, oAppStatesInfo.aAppStateNamesArray, sUrl, iIframeIdx);
                        oNewRenderManager.flush(oDomRef[0]);
                        oNewRenderManager.destroy();
                    } else {
                        _that.buildHTMLElements(oRenderManager, oContainer, aDataArray, oAppStatesInfo.aAppStateNamesArray, sUrl, iIframeIdx);
                    }

                    setTimeout(oContainer.oDeferredRenderer.resolve, 0);
                }, function (sError) {
                    _that.buildHTMLElements(oRenderManager, oContainer, undefined, oAppStatesInfo.aAppStateNamesArray, sUrl, iIframeIdx);
                    setTimeout(oContainer.oDeferredRenderer.resolve, 0);
                });
            });
        } else {
            _that.buildHTMLElements(oRenderManager, oContainer, undefined, oAppStatesInfo.aAppStateNamesArray, sUrl, iIframeIdx);
            setTimeout(oContainer.oDeferredRenderer.resolve, 0);
        }

        this.generateRootElementForIFrame(oRenderManager, oContainer, false);
    };

    IframePOSTUtils.generateRootElementForIFrame = function (oRenderManager, oContainer, bStart) {
        if (bStart) {
            oRenderManager.openStart("div", oContainer)
                .attr("sap-iframe-app", "true")
                .class("sapUShellApplicationContainer")
                .style("height", oContainer.getHeight())
                .style("width", oContainer.getWidth())
                .openEnd();

        } else {
            oRenderManager.close("div");
        }
    };

    IframePOSTUtils.buildHTMLElements = function (oRenderManager, oContainer, aAdditionalDataArray, aInfoArray, sUrl, iIframeIdx) {
        var sFormId = oContainer.getId() + "-form",
            sPostAddParams = "",
            bIsHidden = false;

        if (aAdditionalDataArray === undefined) {
            aAdditionalDataArray = [];
        }
        aAdditionalDataArray.push([sap.ushell.Container.getFLPUrl(true)]);
        aInfoArray.push("sap-flp-url");
        aAdditionalDataArray.push([oContainer.getSystemAlias()]);
        aInfoArray.push("system-alias");

        var valStr = "";
        var obj = {};

        aInfoArray.forEach(function (item, index) {
            if (aAdditionalDataArray[index][0]) {
                obj[item] = aAdditionalDataArray[index][0];
            }
        });

        var sapOrigURL = sUrl;
        valStr = JSON.stringify(obj);

        var oIframeUriParams = {};
        if (oContainer.getIframePostAllParams() === true) {
            oIframeUriParams = UriParameters.fromURL(sUrl);
            sPostAddParams = buildHTMLForAllPostParams(oContainer, oIframeUriParams, false);
            if (sPostAddParams !== "") {
                sUrl = trimURL(sUrl, oIframeUriParams);
            }
        }

        oContainer.fireEvent("applicationConfiguration");
        oRenderManager
            .openStart("form")
            .attr("id", sFormId)
            .attr("method", "post")
            .attr("name", sFormId)
            .attr("target", oContainer.getId() + "-iframe")
            .attr("action", sUrl)
            .style("display", "none")
            .openEnd();

        oRenderManager
            .voidStart("input")
            .attr("name", "sap-flp-params")
            .attr("value", valStr)
            .voidEnd();

        if (oContainer.getIframePostAllParams() === true) {
            buildHTMLForAllPostParams(oContainer, oIframeUriParams, true, oRenderManager);
        }

        oRenderManager.close("form");

        var sID = oContainer.sId;
        // we need to remove the sapUShellApplicationContainerIframeHidden style as the style is relevant
        // only in the parent div of this iframe
        if (oContainer.hasStyleClass("sapUShellApplicationContainerIframeHidden")) {
            bIsHidden = true;
            oContainer.toggleStyleClass("sapUShellApplicationContainerIframeHidden", false);
        }

        // When sending a POST request, we concatenate the string "-iframe" to the 'id' attribute of the <iframe> node.
        // The reason is that in POST request the IFRAME element is a child of a new 'div' element, that holds the
        // original id of the <iframe> node, and in order not to associate them with them with the same id we add this string.
        oContainer.sId += "-iframe";
        oRenderManager
            .openStart("iframe", oContainer)
            .attr("name", oContainer.getId())
            .accessibilityState(oContainer)
            .attr("sap-orig-src", sapOrigURL)
            .attr("title", resources.i18n.getText("AppilcationContainer.IframeTitle"))
            .attr("sap-iframe-idx", iIframeIdx)
            .class("sapUShellApplicationContainer")
            .style("height", oContainer.getHeight())
            .style("width", oContainer.getWidth());

        if (Config.last("/core/shell/enableFeaturePolicyInIframes") === true) {
            oRenderManager.attr("allow", utils.getIframeFeaturePolicies().replaceAll(";", " " + (new URI(sUrl).origin()) + ";"));
        }
        oRenderManager
            .openEnd()
            .close("iframe");

        // Set the oContainer.sId back to its original value (without the string "-iframe")
        oContainer.sId = sID;

        if (bIsHidden) {
            oContainer.toggleStyleClass("sapUShellApplicationContainerIframeHidden", true);
        }

        // The form submission happens in the onAfterRendering()
    };

    function buildHTMLForAllPostParams (oContainer, oIframeUriParams, bRender, oRenderManager) {
        var sapIframeHintVal = "";
        var sRes = "";
        if (oIframeUriParams.has("sap-iframe-hint")) {
            sapIframeHintVal = oIframeUriParams.get("sap-iframe-hint");
        }

        var oParams = oIframeUriParams.mParams;
        //Verify that it's a WD app (in local FLP or cFLP)
        if (oContainer.getApplicationType() === "TR" || (sapIframeHintVal === "GUI")) {
            var p, valStr;
            for (p in oParams) {
                if (p === "sap-iframe-hint" || p === "sap-keep-alive") {
                    continue;
                }
                valStr = oParams[p][0];
                if (bRender === true) {
                    oRenderManager
                        .voidStart("input")
                        .attr("name", p)
                        .attr("value", valStr)
                        .voidEnd();
                } else {
                    sRes += "*";
                }
            }
        }

        return sRes;
    }

    function trimURL (sUrl, oIframeUriParams) {
        var sHint = oIframeUriParams.get("sap-iframe-hint"),
            sKeepAlive = oIframeUriParams.get("sap-keep-alive"),
            oNewURI = new URI(sUrl).query("");

        if (typeof sHint === "string") {
            oNewURI.addSearch("sap-iframe-hint", sHint);
        }
        if (typeof sKeepAlive === "string") {
            oNewURI.addSearch("sap-keep-alive", sKeepAlive);
        }

        return oNewURI.toString();
    }

    return IframePOSTUtils;
}, /* bExport= */ false);
