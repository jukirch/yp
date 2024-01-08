// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/base/util/deepExtend",
    "sap/ui/thirdparty/URI",
    "sap/ushell/_ApplicationType/systemAlias",
    "sap/ushell/_ApplicationType/utils",
    "sap/ushell/Config"
], function (
    deepExtend,
    URI,
    oSystemAlias,
    oApplicationTypeUtils,
    Config
) {
    "use strict";

    function generateURLResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oInbound = oMatchingTarget.inbound;
        var oInboundResolutionResult = oInbound && oInbound.resolutionResult;
        var oResolutionResult = {};

        // splice parameters into url
        var oURI = new URI(sBaseUrl);

        // construct effective parameters including defaults
        var oEffectiveParameters = deepExtend({}, oMatchingTarget.mappedIntentParamsPlusSimpleDefaults);

        // a special hack to work around the AA modelling of Tile Intents in the export
        // the special intent Shell-launchURL with a dedicated parameter sap-external-url
        // which shall *not* be propagated into the final url
        if (oMatchingTarget.inbound
            && oMatchingTarget.inbound.action === "launchURL"
            && oMatchingTarget.inbound.semanticObject === "Shell"
        ) {
            delete oEffectiveParameters["sap-external-url"];
        }

        var sSapSystem = oEffectiveParameters["sap-system"] && oEffectiveParameters["sap-system"][0];
        var sSapSystemDataSrc = oEffectiveParameters["sap-system-src"] && oEffectiveParameters["sap-system-src"][0];

        // do not include the sap-system parameter in the URL
        oResolutionResult["sap-system"] = sSapSystem;
        delete oEffectiveParameters["sap-system"];

        // do not include the sap-system-src parameter in the URL
        if (typeof sSapSystemDataSrc === "string") {
            oResolutionResult["sap-system-src"] = sSapSystemDataSrc;
            delete oEffectiveParameters["sap-system-src"];
        }

        return (new Promise(function (fnResolve, fnReject) {
            if (
                oApplicationTypeUtils.absoluteUrlDefinedByUser(
                    oURI, oInboundResolutionResult.systemAlias,
                    oInboundResolutionResult.systemAliasSemantics
                )
            ) {
                fnResolve(sBaseUrl);
            } else {
                oSystemAlias.spliceSapSystemIntoURI(
                    oURI, oInboundResolutionResult.systemAlias, sSapSystem, sSapSystemDataSrc,
                    "URL", oInboundResolutionResult.systemAliasSemantics || oSystemAlias.SYSTEM_ALIAS_SEMANTICS.applied,
                    fnExternalSystemAliasResolver)
                    .then(function (oSapSystemURI) {
                        var sSapSystemUrl = oSapSystemURI.toString();
                        fnResolve(sSapSystemUrl);
                    }, fnReject);
            }
        }))
            .then(function (sUrlWithoutParameters) {
                var bAppendParams = false,
                    sParameters,
                    sFLPURLDetectionPattern = Config.last("/core/navigation/flpURLDetectionPattern"),
                    rFLPURLDetectionRegex = new RegExp(sFLPURLDetectionPattern);

                if (oEffectiveParameters && oEffectiveParameters.hasOwnProperty("sap-params-append")) {
                    delete oEffectiveParameters["sap-params-append"];
                    bAppendParams = true;
                }
                sParameters = oApplicationTypeUtils.getURLParsing().paramsToString(oEffectiveParameters);
                return rFLPURLDetectionRegex.test(sUrlWithoutParameters) || (bAppendParams === true)
                    ? oApplicationTypeUtils.appendParametersToIntentURL(oEffectiveParameters, sUrlWithoutParameters)
                    : oApplicationTypeUtils.appendParametersToUrl(sParameters, sUrlWithoutParameters);

            }, Promise.reject.bind(Promise))
            .then(function (sUrlWithParameters) {
                // propagate properties from the inbound in the resolution result
                ["additionalInformation", "applicationDependencies", "systemAlias"].forEach(function (sPropName) {
                    if (oInbound.resolutionResult.hasOwnProperty(sPropName)) {
                        oResolutionResult[sPropName] = oInbound.resolutionResult[sPropName];
                    }
                });

                oResolutionResult.url = sUrlWithParameters;
                oResolutionResult.text = oInbound.title;
                oResolutionResult.applicationType = "URL";

                return Promise.resolve(oResolutionResult);
            }, Promise.reject.bind(Promise));
    }

    return {
        generateURLResolutionResult: generateURLResolutionResult
    };
});
