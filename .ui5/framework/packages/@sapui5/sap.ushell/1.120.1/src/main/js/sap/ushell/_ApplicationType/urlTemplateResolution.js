// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/base/Log",
    "sap/ui/thirdparty/hasher",
    "sap/base/util/ObjectPath",
    "sap/ushell/utils",
    "sap/ushell/User",
    "sap/ui/core/Configuration",
    "sap/ushell/Config",
    "sap/ui/thirdparty/URI",
    "sap/ui/core/routing/History",
    "sap/ushell/_ApplicationType/utils",
    "sap/base/util/deepClone"
], function (
    Log,
    hasher,
    ObjectPath,
    ushellUtils,
    User,
    Configuration,
    Config,
    URI,
    History,
    oApplicationTypeUtils,
    deepClone
) {
    "use strict";

    var oUrlParams = (new URI(document.URL)).search(true),
        sIframeURLDomainForTests = oUrlParams["iframe-url"];

    function generateURLTemplateResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        return new Promise(function (fnResolveGlobal) {
            sap.ui.require(["sap/ushell/URLTemplateProcessor"], function (URLTemplateProcessor) {
                var oInbound = oMatchingTarget.inbound;
                var oTemplateContext = oInbound.templateContext;
                var oCapabilities = oTemplateContext.payload.capabilities || {};

                // Although the URL templates in WZ (e.g. JAM teamplate for WZ Advanced Homepage -> workzone-home) state "newWindow"
                // they need to run "embedded" until the URL templates are fixed.
                // TODO: Remove code when URL templates are fixed!
                if (sap?.cf?.config?.siteId !== undefined && oTemplateContext?.siteAppSection["sap.integration"]?.navMode === "inplace") {
                    Log.warning("URL template's navigationMode capability is ignored! navigationMode is forced to 'embedded'.");
                    oCapabilities.navigationMode = "embedded";
                }

                if (oMatchingTarget.mappedIntentParamsPlusSimpleDefaults &&
                    oMatchingTarget.mappedIntentParamsPlusSimpleDefaults.hasOwnProperty("sap-ushell-innerAppRoute")) {
                    var sTopHash = hasher.getHash();
                    if (oMatchingTarget.mappedIntentParamsPlusSimpleDefaults["sap-ushell-innerAppRoute"].length > 0 &&
                        sTopHash.indexOf("&/") === -1) {
                        sTopHash += "&/" + oMatchingTarget.mappedIntentParamsPlusSimpleDefaults["sap-ushell-innerAppRoute"];
                        hasher.replaceHash(sTopHash);
                    }
                }

                /*
                 * Attention: the names in this object must be kept stable. They might
                 * appear at any time in any template at runtime. Also, choose a name
                 * that can be read by a user. E.g., defaultParameterNames is good,
                 * mappedDefaultedParamNames is bad.
                 */
                var oRuntime = {
                    // the inner app route
                    innerAppRoute: getInnerAppRoute(oTemplateContext) || oMatchingTarget.parsedIntent.appSpecificRoute,
                    // the target navigation mode
                    targetNavMode: getTargetNavigationMode(oMatchingTarget),
                    // the names of default parameters among the startupParameters
                    defaultParameterNames: oMatchingTarget.mappedDefaultedParamNames,
                    /*
                     * the parameters (defaults + inent parameters) that must be passed
                     * to the application in order to start it
                     */
                    startupParameter: oMatchingTarget.mappedIntentParamsPlusSimpleDefaults,
                    // remote application information (for the scube scenario)
                    remoteApplication: {
                        remoteSO: undefined,
                        remoteAction: undefined
                    }
                };

                createEnv().then(function (oEnv) {
                    // the runtime environment, containing data from the current state of the FLP
                    oRuntime.env = oEnv;

                    var oTemplateParams = ObjectPath.get(["sap.integration", "urlTemplateParams", "query"], oTemplateContext.siteAppSection) || {};
                    if (oTemplateParams.hasOwnProperty("sap-cssurl")) {
                        oRuntime.env.themeServiceRoot = undefined;
                        oRuntime.env.theme = undefined;
                    }

                    if (oCapabilities.appFrameworkId === "UI5" && oRuntime.startupParameter) {
                        for (var key in oRuntime.startupParameter) {
                            if (key !== "sap-ushell-innerAppRoute") {
                                oRuntime.startupParameter[key][0] = encodeURIComponent(oRuntime.startupParameter[key][0]);
                            }
                            if (key === "sap-shell-so") {
                                oRuntime.remoteApplication.remoteSO = oRuntime.startupParameter[key][0];
                            }
                            if (key === "sap-shell-action") {
                                oRuntime.remoteApplication.remoteAction = oRuntime.startupParameter[key][0];
                            }
                        }
                        if (oMatchingTarget.mappedDefaultedParamNames && oMatchingTarget.mappedDefaultedParamNames.length > 0) {
                            var tmpMappedDefaultedParamNames = oMatchingTarget.mappedDefaultedParamNames.filter(function (paramName) {
                                return paramName !== "sap-shell-so" && paramName !== "sap-shell-action" && paramName !== "sap-system";
                            });
                            oRuntime.startupParameter["sap-ushell-defaultedParameterNames"] = [JSON.stringify(tmpMappedDefaultedParamNames)];
                        }
                        delete oRuntime.startupParameter["sap-shell-so"];
                        delete oRuntime.startupParameter["sap-shell-action"];
                    }

                    //this is a hot fix made for an escelation opened by
                    // Lockheed Martin 885662/2021 about sap workzone, which
                    // is the only quick way to solve the issue. A more
                    // deep process to solve the issue in a proper way will
                    // be done via a BLI as the issue is very complex
                    // please do not remove the usage of "window.location.hash"
                    var sJamSearchPref = "/universal_search/search";
                    var iJamSearchPos = oRuntime.innerAppRoute && oRuntime.innerAppRoute.indexOf(sJamSearchPref);
                    var JamInnerRoute;
                    if (iJamSearchPos === 0) {
                        JamInnerRoute = oRuntime.innerAppRoute.substring(1);
                        oRuntime.innerAppRoute = "/JAMSEARCHPATHH?JAMSEARCHVALUEE=VALUEE";
                    }

                    var sURL = URLTemplateProcessor.expand(
                        oTemplateContext.payload,
                        oTemplateContext.site,
                        oRuntime,
                        oTemplateContext.siteAppSection,
                        "startupParameter"
                    );

                    if (iJamSearchPos === 0) {
                        sURL = sURL.replace("/JAMSEARCHPATHH?JAMSEARCHVALUEE=VALUEE", "/" + JamInnerRoute);
                    }

                    if (oRuntime.env.theme === undefined) {
                        sURL = sURL.replace("&sap-theme=", "");
                    }

                    //temporary bug fix until URITemplate.js will be fixed.
                    //for ui5 apps, the hash added to the URL in the template processing is encoded twice
                    //and there for it does not match the hash of FLP (browser url). we need to replace the
                    //hash in the URL with the correct hash of FLP which is encoded only once.
                    //currently, there is no way to do that in the template itself.
                    if (oCapabilities.appFrameworkId === "UI5" && oExportedAPIs.getBrowserHash().length > 1) {
                        sURL = sURL.split("#")[0] + oExportedAPIs.getBrowserHash();
                        Log.debug("- created URL with fixed hash: " + sURL, "sap.ushell.ApplicationType");
                    }

                    //returns a function that instantiates an attribute, like appId of a template
                    var fnInstantiateTemplate = function (sTemplate) {

                        var oPayloadClone = deepClone(oTemplateContext.payload, 20);
                        oPayloadClone.urlTemplate = sTemplate;
                        return URLTemplateProcessor.expand(
                            oPayloadClone,
                            oTemplateContext.site,
                            oRuntime,
                            oTemplateContext.siteAppSection,
                            "startupParameter"
                        );
                    };

                    var oResult = {
                        applicationType: "URL",
                        text: oInbound.title,
                        appCapabilities: createAppCapabilities(
                            oCapabilities,
                            oTemplateContext.siteAppSection,
                            fnInstantiateTemplate
                        ),
                        url: sURL,
                        extendedInfo: oApplicationTypeUtils.getExtendedInfo(oMatchingTarget, oTemplateContext.siteAppSection, oTemplateContext.site),
                        contentProviderId: oInbound.contentProviderId || "",
                        systemAlias: (oTemplateContext.siteAppSection["sap.app"] &&
                                oTemplateContext.siteAppSection["sap.app"].destination) ||
                            oTemplateContext.siteAppSection.destination || ""
                    };
                    oApplicationTypeUtils.addIframeCacheHintToURL(oResult, oResult.appCapabilities.appFrameworkId);
                    oApplicationTypeUtils.addKeepAliveToURLTemplateResult(oResult);
                    addSpacesModeToURLTemplateResult(oResult);
                    addLanguageToURLTemplateResult(oResult, oTemplateContext.siteAppSection, oRuntime);

                    var oPromisePostTemplateProcessing = new Promise(function (fnResolve) {
                        sap.ushell.Container.getServiceAsync("URLTemplate").then(function (srv) {
                            sap.ui.require(["sap/ushell/components/applicationIntegration/application/BlueBoxesCache"], function (BlueBoxesCache) {
                                var bForNewIframe = (BlueBoxesCache.get(oResult.url) === undefined);
                                srv.handlePostTemplateProcessing(oResult.url, oTemplateContext.siteAppSection, bForNewIframe).then(fnResolve);
                            });
                        });
                    });

                    oPromisePostTemplateProcessing.then(function (sURLNew) {
                        //special case for selenium tests that use different iframe domain
                        if (sIframeURLDomainForTests && sURLNew.indexOf("ui5appruntime.html") > 0) {
                            var arrUrlParts = sURLNew.split("?");
                            arrUrlParts[0] = sIframeURLDomainForTests;
                            sURLNew = arrUrlParts.join("?");
                        }
                        oResult.url = sURLNew;
                        handleURLTransformation(URLTemplateProcessor, oResult.url, oCapabilities, oTemplateContext).then(function (sTransformedURL) {
                            oResult.url = sTransformedURL;
                            //GUI url should not be compacted as it is not compacted in ABAP FLP
                            if (oResult.url && typeof oResult.url === "string" && oResult.url.indexOf("sap-iframe-hint=GUI") > 0) {
                                fnResolveGlobal(oResult);
                            } else {
                                compactURLParameters(oResult.url, oRuntime.targetNavMode, oCapabilities)
                                    .then(function (sCompactURL) {
                                        oResult.url = sCompactURL;
                                        fnResolveGlobal(oResult);
                                    }, function () {
                                        fnResolveGlobal(oResult);
                                    });
                            }
                        });
                    });
                });
            });
        });
    }

    /*
    add "sap-spaces" parameter as a url parameter
    */
    function addSpacesModeToURLTemplateResult (oResult) {
        var sSpacesMode = Config.last("/core/spaces/enabled");
        if (sSpacesMode === true && oResult.url?.indexOf("ui5appruntime.html") > -1) {
            oApplicationTypeUtils.appParameterToUrl(oResult, "sap-spaces", sSpacesMode);
        }
    }

    /*
     * this is a temp solution until the url template is changed
     */
    function addLanguageToURLTemplateResult (oResult, oSiteAppSection, oRuntime) {
        var sTemplateId = ushellUtils.getMember(oSiteAppSection, "sap|integration.urlTemplateId");
        if (sTemplateId === "urltemplate.url-dynamic" && oResult.url.indexOf("sap-language=") === -1) {
            oApplicationTypeUtils.appParameterToUrl(oResult, "sap-language", oRuntime.env.language);
        }
    }

    function compactURLParameters (sUrlExpanded, vTargetNavMode, oCapabilities) {
        return new Promise(function (fnResolve, fnReject) {
            var oUrl = new URI(sUrlExpanded);
            var oParams = oUrl.query(true /* bAsObject */);
            var bIsTransient = true;
            var aRetainParameterList = ["sap-language", "sap-theme", "sap-shell", "sap-ui-app-id", "transaction", "sap-iframe-hint",
                "sap-keep-alive", "sap-ui-versionedLibCss", "sap-wd-configId"]/* retain list */;
            if (oCapabilities && oCapabilities.mandatoryUrlParams) {
                aRetainParameterList = aRetainParameterList.concat(oCapabilities.mandatoryUrlParams.split(","));
                // Remove duplicates
                aRetainParameterList = aRetainParameterList.filter(function (value, index) {
                    return aRetainParameterList.indexOf(value) === index;
                });
            }

            if (vTargetNavMode === "explace") {
                bIsTransient = false;
            }
            sap.ushell.Container.getServiceAsync("ShellNavigation").then(function (oShellNavigationService) {
                oShellNavigationService.compactParams(
                    oParams,
                    aRetainParameterList,
                    undefined /* no Component*/,
                    bIsTransient /*transient*/
                ).done(function (oCompactedParams) {
                    if (!oCompactedParams.hasOwnProperty("sap-intent-param")) {
                        // Return original URL if no compaction happened,
                        // because compacted parameters are sorted when compacting
                        // the shell hash (URLParsing#constructShellHash sorts).
                        // Here we try to keep the specified order from the URL
                        // template if possible.
                        fnResolve(sUrlExpanded);
                        return;
                    }

                    var sUrlCompacted;
                    if (oCompactedParams["sap-theme"]) {
                        var sThemeParam = "sap-theme=" + oCompactedParams["sap-theme"];
                        oCompactedParams["sap-theme"] = "sap-theme-temp-placeholder";
                        oUrl.query(oCompactedParams);
                        sUrlCompacted = oUrl.toString();
                        sUrlCompacted = sUrlCompacted.replace("sap-theme=sap-theme-temp-placeholder", sThemeParam);
                    } else {
                        oUrl.query(oCompactedParams);
                        sUrlCompacted = oUrl.toString();
                    }

                    fnResolve(sUrlCompacted);
                }).fail(function (sError) {
                    fnReject(sError);
                });
            });
        });
    }

    function handleURLTransformation (URLTemplateProcessor, sUrl, oCapabilities, oTemplateContext) {
        return new Promise(function (fnResolve) {
            var oTransformation = oCapabilities.urlTransformation || { enabled: false };


            if (isTransformationEnabled(URLTemplateProcessor, oTransformation, oTemplateContext)) {
                var oIframeURI = new URI(sUrl);
                var oFirstTransformation = oTransformation.transformations[0];
                var oService = oFirstTransformation.service.uri;
                var oTransformData = URLTemplateProcessor.prepareExpandData(
                    {
                        urlTemplate: "",
                        parameters: {
                            names: oService.queryOptions
                        }
                    },
                    {},
                    {
                        urlComponent: {
                            query: oIframeURI.query(),
                            fragment: oIframeURI.fragment()
                        }
                    },
                    oTemplateContext.siteAppSection,
                    ""
                );

                var sServiceUrl = URI.expand("{+rootPath}/{+resourcePath}{?queryParams*}", {
                    rootPath: oService.rootPath,
                    resourcePath: oService.resourcePath,
                    queryParams: oTransformData.oResolvedParameters
                }).toString();

                sap.ui.require(["sap/ui/thirdparty/datajs"], function (OData) {
                    OData.read({
                            requestUri: sServiceUrl,
                            headers: {
                                "Cache-Control": "no-cache, no-store, must-revalidate",
                                Pragma: "no-cache",
                                Expires: "0"
                            }
                        },
                        // Success handler
                        function (oRes) {
                            var resVal = ObjectPath.get("transformAppLaunchQueryString.value", oRes);
                            if (resVal === undefined) {
                                resVal = ObjectPath.get("transformAppLaunchIntent.value", oRes);
                            }
                            if (resVal === undefined) {
                                resVal = ObjectPath.get("transformAppLaunchQueryString.queryString", oRes);
                            }

                            Log.info(
                                "URL Transformation Succeeded",
                                JSON.stringify({
                                    URLBeforeTransformation: sUrl,
                                    URLAfterTransformation: resVal
                                }),
                                "sap.ushell.ApplicationType"
                            );

                            var sSourceURLComponent = oFirstTransformation.sourceURLComponent;
                            if (sSourceURLComponent === undefined) {
                                sSourceURLComponent = "query";
                            }

                            if (sSourceURLComponent === "query" || sSourceURLComponent === "fragment") {
                                sUrl = oIframeURI[sSourceURLComponent]([resVal]).toString();
                            } else {
                                Log.error(
                                    "The " + sSourceURLComponent + " component of the URL in URI.js is not transformed",
                                    "",
                                    "sap.ushell.ApplicationType"
                                );
                            }
                            fnResolve(sUrl);
                        },
                        // Fail handler
                        function (oMessage) {
                            Log.error(
                                "URL Transformation Failed",
                                JSON.stringify(oMessage),
                                "sap.ushell.ApplicationType"
                            );
                            fnResolve(sUrl);
                        }
                    );
                });
            } else {
                fnResolve(sUrl);
            }
        });
    }

    function isTransformationEnabled (URLTemplateProcessor, oTransformation, oTemplateContext) {
        if (typeof oTransformation.enabled === "boolean") {
            return oTransformation.enabled;
        }
        var oTransformData = URLTemplateProcessor.prepareExpandData(
            {
                urlTemplate: "",
                parameters: {
                    names: {
                        enabled: oTransformation.enabled
                    }
                }
            },
            {},
            {},
            oTemplateContext.siteAppSection,
            ""
        );

        return (typeof oTransformData.oResolvedParameters.enabled === "boolean" ?
            oTransformData.oResolvedParameters.enabled : false);
    }

    /**
     * Define the navigation mode app capability based on the template's
     * navigation mode (capability) and the app's (external) nav mode.
     *
     * @param {string} sTemplateNavigationMode
     *   The template navigation mode
     *
     * @param {object} oAppDescriptor
     *   The site app section
     *
     * @returns {string}
     *   The internal navigation mode that should be used by the shell to launch the application.
     */
    function getNavigationModeAppCapability (sTemplateNavigationMode, oAppDescriptor) {
        var sAppExternalNavMode = ushellUtils.getMember(oAppDescriptor, "sap|integration.navMode");

        switch (sAppExternalNavMode) {
            case "inplace":
                if (["embedded", /*Legacy Modes: */ "inplace", "newWindowThenEmbedded"].includes(sTemplateNavigationMode)) {
                    return "embedded";
                }
                Log.error(
                    "App-defined navigation mode was ignored",
                    "Application requests to be opened inplace, but the template's navigation mode doesn't allow!",
                    "sap.ushell.ApplicationType"
                );
                return "newWindow";

            case "explace":
                if (["embedded", /*Legacy Modes: */ "inplace", "newWindowThenEmbedded"].includes(sTemplateNavigationMode)) {
                    return "newWindowThenEmbedded";
                }

                if (["standalone", /*Legacy Modes: */ "explace", "newWindow"].includes(sTemplateNavigationMode)) {
                    return "newWindow";
                }

            default: // Fallback to URL template-defined navigation mode.
                Log.error(
                    "App-defined navigation mode is not valid!",
                    "Fallback to URL Template's capability",
                    "sap.ushell.ApplicationType"
                );
                if (["embedded", /*Legacy Modes: */ "inplace", "newWindowThenEmbedded"].includes(sTemplateNavigationMode)) {
                    return "embedded";
                }

                // "standalone" - and Legacy Modes "explace", "newWindow"
                return "newWindow";
        }
    }

    /**
     * Returns the URL template's navigation mode capability, reduced to either "embedded" or "standalone"
     * (according to ADR 1013).
     *
     * @param {string} sTemplateNavigationMode
     *   The template navigation mode
     *
     * @returns {string}
     *   The internal navigation mode that should be used by the shell to launch the application.
     */
    function getNavigationModeTemplateCapability (sTemplateNavigationMode) {
        if (["embedded", /*Legacy Modes: */ "inplace", "newWindowThenEmbedded"].includes(sTemplateNavigationMode)) {
            return "embedded";
        }

        if (["standalone", /*Legacy Modes: */ "explace", "newWindow"].includes(sTemplateNavigationMode)) {
            return "standalone";
        }
    }

    /**
     * Creates app capabilities from the template capabilities.
     *
     * The app capabilities are the capabilities of the application instance
     * and may be influenced by the specific configuration of the application.
     *
     *
     * @param {object} oTemplateCapabilities
     *   Template capabilities are default capabilities that indicate how an
     *   application can be configured.
     * @param {object} oSiteAppSection
     *   site application section
     *
     * @param {function} fnInstantiateTemplate
     * A function that instantiates an attribute, like appId of a template.
     *
     * @returns {object} oAppCapabilities
     *   application capabilities
     * @private
     *
     */
    function createAppCapabilities (oTemplateCapabilities, oSiteAppSection, fnInstantiateTemplate) {
        var oAppCapabilities = deepClone(oTemplateCapabilities);
        oAppCapabilities.navigationMode = getNavigationModeAppCapability(oTemplateCapabilities.navigationMode, oSiteAppSection);
        oAppCapabilities.templateNavigationMode = getNavigationModeTemplateCapability(oTemplateCapabilities.navigationMode);
        oAppCapabilities.appId = fnInstantiateTemplate(oTemplateCapabilities.appId || "");
        oAppCapabilities.technicalAppComponentId = fnInstantiateTemplate(oTemplateCapabilities.technicalAppComponentId || "");
        oAppCapabilities.appSupportInfo = oSiteAppSection["sap.app"] && oSiteAppSection["sap.app"].ach;
        oAppCapabilities.appFrameworkId = oTemplateCapabilities.appFrameworkId;
        delete oAppCapabilities.urlTransformation;
        return oAppCapabilities;
    }

    function getInnerAppState () {
        var sHash = hasher && hasher.getHash();
        var sKey = "";

        if (sHash && sHash.length > 0 && sHash.indexOf("sap-iapp-state=") > 0) {
            var aParams = /(?:sap-iapp-state=)([^&/\\]+)/.exec(sHash);
            if (aParams && aParams.length === 2) {
                sKey = aParams[1];
            }
        }

        return sKey;
    }

    function createEnv () {
        return new Promise(function (fnResolve) {
            Promise.all([
                sap.ushell.Container.getServiceAsync("UserInfo"),
                sap.ushell.Container.getServiceAsync("PluginManager"),
                ushellUtils.getUi5Version()
            ]).then(function (aResults) {
                var oUserInfoService = aResults[0];
                var oPluginsService = aResults[1];
                var sUi5Version = aResults[2];

                var oUser = oUserInfoService.getUser();
                var sContentDensity = oUser.getContentDensity() || (document.body.classList.contains("sapUiSizeCompact") ? "compact" : "cozy");
                var sTheme = oUser.getTheme();
                if (sTheme.indexOf("sap_") !== 0) {
                    var sThemeFormat = User.prototype.constants.themeFormat.THEME_NAME_PLUS_URL;
                    sTheme = oUser.getTheme(sThemeFormat);
                }

                var sLanguage = Configuration.getLanguage && Configuration.getLanguage();
                var sLogonLanguage = Configuration.getSAPLogonLanguage && Configuration.getSAPLogonLanguage();

                var themeServiceRoot = window.location.protocol + "//" + window.location.host // host
                    + "/comsapuitheming.runtime/themeroot/v1"; // route to theme service
                var sessionTimeout = 0;
                if (Config.last("/core/shell/sessionTimeoutIntervalInMinutes") > 0) {
                    sessionTimeout = Config.last("/core/shell/sessionTimeoutIntervalInMinutes");
                }

                var debugMode = false;
                if (window["sap-ui-debug"] !== false && window["sap-ui-debug"] !== undefined) {
                    debugMode = window["sap-ui-debug"];
                }

                fnResolve({
                    language: sLanguage,
                    logonLanguage: sLogonLanguage,
                    theme: sTheme,
                    themeServiceRoot: themeServiceRoot,
                    isDebugMode: debugMode,
                    ui5Version: sUi5Version,
                    contentDensity: sContentDensity,
                    sapPlugins: oPluginsService._getNamesOfPluginsWithAgents(),
                    innerAppState: getInnerAppState(),
                    sessionTimeout: sessionTimeout,
                    historyDirection: History.getInstance().getDirection() || ""
                });
            });
        });
    }

    // extracts the inner app route from the browser hash
    function getInnerAppRoute (oTemplateContext) {
        var oTemplatePayload = oTemplateContext.payload;
        var sInnerAppRoute;
        var sHashFragment = hasher.getHash() || oExportedAPIs.getBrowserHash();
        var indexOfInnerRoute = sHashFragment.indexOf("&/");
        var iOffset = 1; //to avoid the starting "&";
        var bIsJam = false;

        if (oTemplateContext.siteAppSection?.["sap.integration"]?.urlTemplateId === "urltemplate.jam") {
            bIsJam = true;
        }
        if (indexOfInnerRoute > 0) {
            if (oTemplatePayload && oTemplatePayload.capabilities && oTemplatePayload.capabilities.appFrameworkId === "UI5") {
                iOffset = 2; //to avoid the starting "&/"
            }
            sInnerAppRoute = sHashFragment.substring(indexOfInnerRoute + iOffset);
            try {
                if (!bIsJam && sInnerAppRoute && sInnerAppRoute.length > 0) {
                    sInnerAppRoute = decodeURIComponent(sInnerAppRoute);
                }
            } catch (e) {
                Log.warning("inner route should be double encoded", e, "sap.ushell.ApplicationType.getInnerAppRoute");
            }
        }
        return sInnerAppRoute;
    }

    function getTargetNavigationMode (oMatchingTarget) {
        var sMode = oMatchingTarget.targetNavigationMode;
        if (sMode === undefined || sMode === "") {
            sMode = "inplace";
        }

        return sMode;
    }

    function getBrowserHash () {
        return window.location.hash;
    }

    var oExportedAPIs = {
        generateURLTemplateResolutionResult: generateURLTemplateResolutionResult,
        handleURLTransformation: handleURLTransformation,

        // for testing
        getBrowserHash: getBrowserHash

    };

    return oExportedAPIs;
});
