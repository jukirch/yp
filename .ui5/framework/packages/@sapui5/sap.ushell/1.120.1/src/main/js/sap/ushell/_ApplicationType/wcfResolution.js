// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepExtend",
    "sap/ui/thirdparty/URI",
    "sap/ushell/_ApplicationType/systemAlias",
    "sap/ushell/_ApplicationType/utils"
], function (
    Log,
    deepExtend,
    URI,
    oSystemAlias,
    oApplicationTypeUtils
) {
    "use strict";

    function generateWCFResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oUri = new URI(sBaseUrl);
        var oInbound = oMatchingTarget.inbound;
        var oInboundResolutionResult = oInbound && oInbound.resolutionResult;
        var oEffectiveParameters = deepExtend({}, oMatchingTarget.mappedIntentParamsPlusSimpleDefaults);
        var sSapSystem;
        var sSapSystemDataSrc;

        if (oEffectiveParameters["sap-system"]) {
            sSapSystem = oEffectiveParameters["sap-system"][0];
            delete oEffectiveParameters["sap-system"];
        }

        if (oEffectiveParameters["sap-system-src"]) {
            sSapSystemDataSrc = oEffectiveParameters["sap-system-src"][0];
            delete oEffectiveParameters["sap-system-src"];
        }

        return oSystemAlias.spliceSapSystemIntoURI(
            oUri, oInboundResolutionResult.systemAlias, sSapSystem, sSapSystemDataSrc, "WCF",
            oInboundResolutionResult.systemAliasSemantics || oSystemAlias.SYSTEM_ALIAS_SEMANTICS.applied, fnExternalSystemAliasResolver)
            .then(function (oURI) {
                var sParameters = oApplicationTypeUtils.getURLParsing().paramsToString(oEffectiveParameters);
                var sFinalUrl = oApplicationTypeUtils.appendParametersToUrl(sParameters, oURI);

                var oResolutionResult = {
                    url: sFinalUrl,
                    text: oInboundResolutionResult.text || "",
                    additionalInformation: oInboundResolutionResult.additionalInformation || "",
                    applicationType: "WCF",
                    fullWidth: true,
                    extendedInfo: oApplicationTypeUtils.getExtendedInfo(oMatchingTarget)
                };
                oApplicationTypeUtils.checkOpenWithPost(oMatchingTarget, oResolutionResult);
                oApplicationTypeUtils.addKeepAliveToURLTemplateResult(oResolutionResult);
                oApplicationTypeUtils.addIframeCacheHintToURL(oResolutionResult, "WCF");

                return oResolutionResult;
            });
    }

    return {
        generateWCFResolutionResult: generateWCFResolutionResult
    };
});
