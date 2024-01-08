// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/Config"
], function (
    Config
) {
    "use strict";

    function generateWDAResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/wdaResolution"], function (oWdaResolution) {
                oWdaResolution.generateWDAResolutionResult.apply(oWdaResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function resolveEasyAccessMenuIntentWDA () {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/wdaResolution"], function (oWdaResolution) {
                oWdaResolution.resolveEasyAccessMenuIntentWDA.apply(oWdaResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function generateTRResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/guiResolution"], function (oGuiResolution) {
                oGuiResolution.generateTRResolutionResult(oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver).then(fnResolve, fnReject);
            });
        });
    }

    function resolveEasyAccessMenuIntentWebgui () {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/guiResolution"], function (oGuiResolution) {
                oGuiResolution.resolveEasyAccessMenuIntentWebgui.apply(oGuiResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function generateWCFResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/wcfResolution"], function (oWcfResolution) {
                oWcfResolution.generateWCFResolutionResult.apply(oWcfResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function generateUI5ResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/ui5Resolution"], function (oUi5Resolution) {
                oUi5Resolution.generateUI5ResolutionResult.apply(oUi5Resolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function generateURLTemplateResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/urlTemplateResolution"], function (oUrlTemplateResolution) {
                oUrlTemplateResolution.generateURLTemplateResolutionResult.apply(oUrlTemplateResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    function generateURLResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var _arguments = arguments;
        return new Promise(function (fnResolve, fnReject) {
            sap.ui.require(["sap/ushell/_ApplicationType/urlResolution"], function (oUrlResolution) {
                oUrlResolution.generateURLResolutionResult.apply(oUrlResolution, _arguments).then(fnResolve, fnReject);
            });
        });
    }

    var oApplicationType = {
        /**
         * This type represents web applications identified by any uniform resource locator. They
         * will be embedded into an <code>IFRAME</code>.
         *
         * @constant
         * @default "URL"
         * @name ApplicationType.URL
         * @since 1.15.0
         * @type string
         */
        URL: {
            type: "URL",
            defaultFullWidthSetting: true,
            generateResolutionResult: function (oMatchingTarget) {
                var bUseTemplate = oMatchingTarget.inbound.hasOwnProperty("templateContext");
                return bUseTemplate
                    ? generateURLTemplateResolutionResult.apply(null, arguments)
                    : generateURLResolutionResult.apply(null, arguments);
            },
            easyAccessMenu: {
                intent: "Shell-startURL",
                resolver: null,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: false,
                systemSelectionPriority: 1
            }
        },
        /**
         * This type represents applications built with Web Dynpro for ABAP. The embedding
         * container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "WDA"
         * @name ApplicationType.WDA
         * @since 1.15.0
         * @type string
         */
        WDA: {
            type: "WDA",
            defaultFullWidthSetting: true,
            enableWdaCompatibilityMode: Config.last("/core/navigation/enableWdaCompatibilityMode"),
            generateResolutionResult: generateWDAResolutionResult,
            easyAccessMenu: {
                intent: "Shell-startWDA",
                resolver: resolveEasyAccessMenuIntentWDA,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: true,
                systemSelectionPriority: 2 // preferred over URL
            }
        },
        /**
         * This type represents transaction applications.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "TR"
         * @name ApplicationType.TR
         * @since 1.36.0
         * @type string
         */
        TR: {
            type: "TR",
            defaultFullWidthSetting: true,
            generateResolutionResult: generateTRResolutionResult,
            easyAccessMenu: {
                intent: "Shell-startGUI",
                resolver: resolveEasyAccessMenuIntentWebgui,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: true,
                systemSelectionPriority: 3 // startGUI titles are preferred over WDA and URL
            }
        },
        /**
         * This type represents applications embedded via NetWeaver Business Client.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "NWBC"
         * @name ApplicationType.NWBC
         * @since 1.19.0
         * @type string
         */
        NWBC: {
            type: "NWBC",
            defaultFullWidthSetting: true
            // there is no input application type like this
        },
        /**
         * This type represents applications built with the WebClient UI Framework (aka CRM UI).
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "WCF"
         * @name ApplicationType.WCF
         * @since 1.56.0
         * @type string
         */
        WCF: {
            type: "WCF",
            generateResolutionResult: generateWCFResolutionResult,
            defaultFullWidthSetting: true
        },
        SAPUI5: {
            type: "SAPUI5",
            generateResolutionResult: generateUI5ResolutionResult,
            defaultFullWidthSetting: false
        }
    };

    function getEasyAccessMenuDefinitions () {
        return Object.keys(oApplicationType)
            .map(function (sApplicationType) {
                return oApplicationType[sApplicationType];
            })
            .filter(function (oApplicationTypeDefinition) {
                return typeof oApplicationTypeDefinition.easyAccessMenu === "object";
            });
    }

    function createEasyAccessMenuResolverGetter () {
        var oEasyAccessMenuIntentResolver = {};
        getEasyAccessMenuDefinitions()
            .forEach(function (oApplicationTypeDefinitionWithEasyAccessMenu) {
                oEasyAccessMenuIntentResolver[
                    oApplicationTypeDefinitionWithEasyAccessMenu.easyAccessMenu.intent
                ] = oApplicationTypeDefinitionWithEasyAccessMenu.easyAccessMenu.resolver;
            });

        return function (sMaybeEasyAccessMenuIntent, sResolvedApplicationType) {
            if (
                oEasyAccessMenuIntentResolver[sMaybeEasyAccessMenuIntent]
                && (!sResolvedApplicationType || sResolvedApplicationType !== "SAPUI5")
            ) {
                return oEasyAccessMenuIntentResolver[sMaybeEasyAccessMenuIntent];
            }
            return null;
        };
    }

    function getDefaultFullWidthSetting (sApplicationType) {
        return !!oApplicationType[sApplicationType] && oApplicationType[sApplicationType].defaultFullWidthSetting;
    }

    /**
     * The application types supported by the embedding container.
     *
     * @since 1.15.0
     * @enum {string}
     * @private
     */
    Object.defineProperty(oApplicationType, "enum", {
        value: Object.keys(oApplicationType).reduce(function (oAccumulator, sCurrentKey) {
            if (oApplicationType[sCurrentKey].type) {
                oAccumulator[sCurrentKey] = oApplicationType[sCurrentKey].type;
            }
            return oAccumulator;
        }, {})
    });

    var oMethods = {
        getEasyAccessMenuResolver: createEasyAccessMenuResolverGetter(),
        getEasyAccessMenuDefinitions: getEasyAccessMenuDefinitions,
        getDefaultFullWidthSetting: getDefaultFullWidthSetting
    };

    Object.keys(oMethods).forEach(function (sMethodName) {
        Object.defineProperty(oApplicationType, sMethodName, {
            value: oMethods[sMethodName]
        });
    });

    return oApplicationType;
});
