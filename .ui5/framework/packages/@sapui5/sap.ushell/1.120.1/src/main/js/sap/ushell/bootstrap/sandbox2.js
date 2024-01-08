// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's bootstrap code for development sandbox scenarios.
 * This is the version that creates spaces/pages runtime environment.
 *
 * @version 1.120.1
 */

/* eslint-disable quote-props */
(function () {
    "use strict";

    window["sap-ui-config"] = {
        "xx-bootTask": function (fnCallback) {
            init().then((bootstrap) => {
                bootstrap(fnCallback);
            });
        }
    };

    function init () {
        return new Promise(function (resolve) {
            sap.ui.require([
                "sap/base/util/UriParameters",
                "sap/base/Log",
                "sap/base/util/ObjectPath",
                "sap/ushell/bootstrap/common/common.util",
                "sap/ushell/Container"
            ], function (
                UriParameters,
                Log,
                ObjectPath,
                commonUtils
                /* Container - necessary for sap.ushell.bootstrap */
            ) {

                async function _loadJSON (sUrl) {
                    function logError () {
                        Log.error("Failed to load Fiori Launchpad Sandbox configuration", sUrl);
                    }
                    try {
                        const response = await fetch(sUrl, {
                            headers: {
                                "Content-Type": "application/json"
                            }
                        });
                        if (response.ok) {
                            const oData = await response.json();
                            return oData;
                        }
                        logError();
                    } catch (e) {
                        logError();
                    }
                }

                function mergeConfig (oBaseConfig, oCustomConfig, bCloneCustom) {
                    if (typeof oCustomConfig !== "object") {
                        return;
                    }

                    const oConfigToMerge = bCloneCustom ? JSON.parse(JSON.stringify(oCustomConfig)) : oCustomConfig;

                    Object.entries(oConfigToMerge).forEach(([sKey, oValue]) => {
                        if (Object.prototype.toString.apply(oBaseConfig[sKey]) === "[object Object]" &&
                            Object.prototype.toString.apply(oValue) === "[object Object]") {
                            mergeConfig(oBaseConfig[sKey], oValue, false);
                            return;
                        }
                        oBaseConfig[sKey] = oValue;
                    });
                }

                /*
                 * Add custom applications and tiles from the provided custom configuration to the template site:
                 * 1. Applications and tiles from oConfig.applications (documented way, My Home section)
                 * 2. Applications from oConfig.services.NavTargetResolution.adapter.config.applications
                 * 3. Applications from oConfig.services.ClientSideTargetResolution.adapter.config.inbounds
                 * 4. Groups and tiles from oConfig.services.LaunchPage.adapter.config.groups (a new section is created for each group)
                */
                function _addAppsToSite (oConfig) {
                    function getComponentName (oApplication) {
                        return oApplication.additionalInformation.replace("SAPUI5.Component=", "");
                    }

                    function createApp (oApplication, sKey) {
                        const sComponentName = getComponentName(oApplication);
                        const sApplicationTitle = oApplication.title || sComponentName.split(".").pop();
                        const aNavTarget = sKey.split("-"); // Convention: application key must be in form of "SemanticObject-action"

                        const oApp = {
                            "sap.app": {
                                "id": sComponentName,
                                "title": sApplicationTitle,
                                "subTitle": oApplication.description || "",
                                "ach": "CA-FLP-FE-COR",
                                "applicationVersion": {
                                    "version": "1.0.0"
                                },
                                "crossNavigation": {
                                    "inbounds": {
                                        "target": {
                                            "semanticObject": aNavTarget[0],
                                            "action": aNavTarget[1],
                                            "signature": {
                                                "parameters": {},
                                                "additionalParameters": "allowed"
                                            }
                                        }
                                    }
                                },
                                "tags": {
                                    "keywords": sApplicationTitle.split(" ")
                                }
                            },
                            "sap.flp": {
                                "type": "application"
                            },
                            "sap.ui": {
                                "technology": "UI5",
                                "icons": {
                                    "icon": "sap-icon://Fiori2/F0018"
                                },
                                "deviceTypes": {
                                    "desktop": true,
                                    "tablet": false,
                                    "phone": false
                                }
                            },
                            "sap.ui5": {
                                "componentName": sComponentName
                            },
                            "sap.platform.runtime": {
                                "componentProperties": {
                                    "url": oApplication.url
                                }
                            }
                        };
                        return oApp;
                    }

                    function createAppFromInbound (oInbound) {
                        const oApplication = oInbound.resolutionResult || {};
                        const sComponentName = oApplication.ui5ComponentName || getComponentName(oApplication);
                        const sApplicationTitle = oInbound.title || sComponentName.split(".").pop();

                        const oApp = {
                            "sap.app": {
                                "id": sComponentName,
                                "title": sApplicationTitle,
                                "subTitle": oApplication.description || "",
                                "ach": "CA-FLP-FE-COR",
                                "applicationVersion": {
                                    "version": "1.0.0"
                                },
                                "crossNavigation": {
                                    "inbounds": {
                                        "target": {
                                            "semanticObject": oInbound.semanticObject,
                                            "action": oInbound.action,
                                            "signature": oInbound.signature
                                        }
                                    }
                                },
                                "tags": {
                                    "keywords": sApplicationTitle.split(" ")
                                }
                            },
                            "sap.flp": {
                                "type": "application"
                            },
                            "sap.ui": {
                                "technology": "UI5",
                                "icons": {
                                    "icon": "sap-icon://Fiori2/F0018"
                                },
                                "deviceTypes": oInbound.deviceTypes
                            },
                            "sap.ui5": {
                                "componentName": sComponentName
                            },
                            "sap.platform.runtime": {
                                "componentProperties": {
                                    "url": oApplication.url
                                }
                            }
                        };
                        return oApp;
                    }

                    function createViz (oApplication, sKey) {
                        const sComponentName = getComponentName(oApplication);
                        const sApplicationTitle = oApplication.title || sComponentName.split(".").pop();


                        const oViz = {
                            "vizType": "sap.ushell.StaticAppLauncher",
                            "businessApp": sComponentName || "sap.ushell.sanbox.BusinessApp",
                            "vizConfig": {
                                "sap.app": {
                                    "title": sApplicationTitle,
                                    "subTitle": oApplication.description || ""
                                },
                                "sap.ui": {
                                    "icons": {
                                        "icon": oApplication.icon
                                    },
                                    "deviceTypes": {
                                        "desktop": true,
                                        "tablet": true,
                                        "phone": true
                                    }
                                },
                                "sap.flp": {
                                    "target": {
                                        "type": "URL",
                                        "url": "#" + sKey
                                    }
                                }
                            }
                        };
                        return oViz;
                    }

                    // predefined site is found here
                    const oSiteData = oConfig.services.CommonDataModel.adapter.config.siteData;

                    // generate applications and tiles from window["sap-ushell-config"].applications and add them to the site
                    const oApplications = ObjectPath.get("applications", oConfig) || {};
                    for (let [sAppKey, oApplication] of Object.entries(oApplications)) {
                        const sVizId = "custom_viz_" + sAppKey;
                        const oSection = oSiteData.pages.page1.payload.sections.APPS; // predefined section for custom apps
                        oSiteData.applications[sAppKey] = createApp(oApplication, sAppKey);
                        oSiteData.visualizations[sAppKey] = createViz(oApplication, sAppKey);
                        oSection.layout.vizOrder.push(sVizId);
                        oSection.viz[sVizId] = {
                            id: sVizId,
                            vizId: sAppKey
                        };
                    }

                    // generate applications from NavTargetResolution config
                    const oNavTargetApps = ObjectPath.get("services.NavTargetResolution.adapter.config.applications", oConfig) || {};
                    for (let [sNTAppKey, oNTApp] of Object.entries(oNavTargetApps)) {
                        if (oNTApp.additionalInformation) {
                            oSiteData.applications[sNTAppKey] = createApp(oNTApp, sNTAppKey);
                        }
                    }

                    // generate applications from ClientSideTargetResolution config (application dependencies not taken into account yet)
                    const oClientTargetApps = ObjectPath.get("services.ClientSideTargetResolution.adapter.config.inbounds", oConfig) || {};
                    for (let oInbound of Object.values(oClientTargetApps)) {
                        oSiteData.applications[oInbound.semanticObject + "-" + oInbound.action] = createAppFromInbound(oInbound);
                    }

                    // generate sections and tiles from the LaunchPage adapter config and add them to the site
                    const aGroups = ObjectPath.get("services.LaunchPage.adapter.config.groups", oConfig) || [];
                    aGroups.forEach((oGroup, index) => {
                        const sGroupId = oGroup.id || "GROUP_" + index;
                        const oPage = oSiteData.pages.page1; // predefined page
                        oPage.payload.layout.sectionOrder.splice(index + 1, 0, sGroupId); // insert groups between my home and sample apps
                        oPage.payload.sections[sGroupId] = {
                            id: sGroupId,
                            title: oGroup.title,
                            layout: {vizOrder: []},
                            viz: {}
                        };
                        const oSection = oPage.payload.sections[sGroupId];
                        (oGroup.tiles || []).forEach((oTile, tileIndex) => {
                            const sTileId = oTile.id || sGroupId + "_tile_" + tileIndex;
                            oSection.layout.vizOrder.push(sTileId);

                            const sFormFactor = oTile.formFactor || "Desktop,Tablet,Phone";
                            const oTileProperties = oTile.properties || {};
                            const oViz = {
                                "vizType": "sap.ushell.StaticAppLauncher", // always static tiles, no matter how it is configued
                                "businessApp": "sap.ushell.sanbox.BusinessApp",
                                "vizConfig": {
                                    "sap.app": {
                                        "title": oTile.title || oTileProperties.title || "",
                                        "subTitle": oTileProperties.subtitle || ""
                                    },
                                    "sap.ui": {
                                        "icons": {
                                            "icon": oTileProperties.icon
                                        },
                                        "deviceTypes": {
                                            "desktop": sFormFactor.indexOf("Desktop") > -1,
                                            "tablet": sFormFactor.indexOf("Tablet") > -1,
                                            "phone": sFormFactor.indexOf("Phone") > -1
                                        }
                                    },
                                    "sap.flp": {
                                        "target": {
                                            "type": "URL",
                                            "url": oTileProperties.targetURL || oTileProperties.href || "#"
                                        }
                                    }
                                }
                            };
                            oSiteData.visualizations[sTileId] = oViz;
                            oSection.viz[sTileId] = {
                                id: sTileId,
                                vizId: sTileId
                            };
                        });
                    });

                    delete oConfig.applications;
                    return oConfig;
                }

                function _applyDefaultUshellConfig (oConfig) {
                    mergeConfig(window["sap-ushell-config"], oConfig, true);
                }

                function _applyDefaultSiteData (oSiteData) {
                    const oAdapterConfig = window["sap-ushell-config"].services.CommonDataModel.adapter.config;
                    oAdapterConfig.siteData = oSiteData;
                    delete oAdapterConfig.siteDataUrl;
                }

                /**
                 * Read a new JSON application config defined by its URL and merge into
                 * window["sap-ushell-config"].
                 *
                 * @param {string} sUrlPrefix URL of JSON file to be merged into the configuration
                 */
                async function _applyJsonApplicationConfig (sUrlPrefix) {
                    const sUrl = /\.json/i.test(sUrlPrefix) ? sUrlPrefix : sUrlPrefix + ".json";
                    const oAppConfig = await _loadJSON(sUrl);
                    if (oAppConfig) {
                        mergeConfig(window["sap-ushell-config"], oAppConfig, true);
                    }
                }

                /*
                 * Get the path of our own script; module paths are registered relative to this path, not
                 * relative to the HTML page we introduce an ID for the bootstrap script, similar to UI5;
                 * allows to reference it later as well
                 * @returns {string} path of the bootstrap script
                 */
                function _getBootstrapScriptPath () {
                    const oBootstrapScript = window.document.getElementById("sap-ushell-bootstrap");
                    const sBootstrapScriptPath = oBootstrapScript.src.split("?")[0].split("/").slice(0, -1).join("/") + "/";
                    return sBootstrapScriptPath;
                }

                /*
                 * Perform sandbox bootstrap of local platform. The promise will make sure to call the UI5
                 * callback in case of success.
                 *
                 */
                async function bootstrap (fnBootstrapCallback) {
                    const aConfigFiles = UriParameters.fromURL(window.location.href).getAll("sap-ushell-sandbox-config");
                    const sBootstrapPath = _getBootstrapScriptPath(); // default config files are located in the sandbox2 subfolder
                    const sDefaultConfigUrl = sBootstrapPath + "./sandbox2/sandboxConfig.json";
                    const sDefaultSiteUrl = sBootstrapPath + "./sandbox2/sandboxSite.json";

                    // if one or more configuration files are specified explicitly via URL parameter, read them;
                    // otherwise, /appconfig/fioriSandboxConfig.json is the convention for WebIDE developers
                    if (aConfigFiles.length === 0) {
                        aConfigFiles.push("/appconfig/fioriSandboxConfig.json");
                    }

                    if (!window["sap-ushell-config"]) {
                        window["sap-ushell-config"] = {};
                    }

                    // load the predefined ushell configuration and site contents
                    const [oDefaultConfig, oDefaultSite] = await Promise.all([_loadJSON(sDefaultConfigUrl), _loadJSON(sDefaultSiteUrl)]);
                    _applyDefaultUshellConfig(oDefaultConfig);
                    _applyDefaultSiteData(oDefaultSite);

                    // merge with the custom configuration
                    for (const sConfigFile of aConfigFiles) {
                        await _applyJsonApplicationConfig(sConfigFile);
                    }

                    // convert custom data to the site data
                    const oUshellConfig = _addAppsToSite(window["sap-ushell-config"]);

                    // migrate adapter config
                    commonUtils.migrateV2ServiceConfig(oUshellConfig);

                    // merge custom application module paths for the loader, if provided
                    if (oUshellConfig.modulePaths) {
                        const oModules = Object.keys(oUshellConfig.modulePaths).reduce((result, sModulePath) => {
                            result[sModulePath.replace(/\./g, "/")] = oUshellConfig.modulePaths[sModulePath];
                            return result;
                        }, {});
                        sap.ui.loader.config({
                            paths: oModules
                        });
                    }
                    sap.ushell.bootstrap("cdm").done(fnBootstrapCallback);
                }
                resolve(bootstrap);
            });
        });
    }
}());
