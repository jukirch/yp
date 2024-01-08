// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The NavigationMode module
 *
 * <p>This module provides methods to get the navigation mode.</p>
 * The main method is #getNavigationMode that is used by
 * NavTargetResolution#resolveHashFragment and
 * indirectly by ClientSideTargetResolution#resolveTileIntent
 * It provides the navigationMode in LPA for CDM in method getTileView
 * Method Compute is used by ClientSide TargetResolution and takes not only the
 * next application but also the current application into account.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/isPlainObject",
    "sap/ushell/Config"
], function (
    Log,
    isPlainObject,
    Config
) {
    "use strict";

    /**
     * Checks whether the provided service configuration is valid and
     * logs an error message if not
     *
     * @param {object} oServiceConfiguration
     *  the service configuration object
     */
    var oExport = {};
    var _validateServiceConfiguration = function (oEnableInPlaceForClassicUIs) {
        var bIsValid = true;

        if (oEnableInPlaceForClassicUIs) {
            if (typeof oEnableInPlaceForClassicUIs !== "object") {
                bIsValid = false;
            } else {
                Object.keys(oEnableInPlaceForClassicUIs).forEach(function (sKey) {
                    if (["GUI", "WDA", "WCF"].indexOf(sKey) === -1) {
                        bIsValid = false;
                    } else if (typeof oEnableInPlaceForClassicUIs[sKey] !== "boolean") {
                        bIsValid = false;
                    }
                });
            }
        }

        if (!bIsValid) {
            Log.error("Invalid parameter: 'enableInPlaceForClassicUIs' must be an object; allowed properties: GUI|WDA, type boolean",
                "Actual parameter: " + JSON.stringify(oEnableInPlaceForClassicUIs),
                "sap.ushell.services.navigationMode");
        }
    };


    // enableInPlaceForClassicUIs
    var _getClassicUITechnologyForApplicationType = function (sApplicationType) {
        switch (sApplicationType) {
            case "TR":
                return "GUI";
            case "WDA":
                return "WDA";
            case "WCF":
                return "WCF";
            default:
                return undefined;
        }
    };

    oExport._isInplaceEnabledForApplicationType = function (sApplicationType) {
        var oEnableInPlaceForClassicUIsConfig = Config.last("/core/navigation/enableInPlaceForClassicUIs");
        _validateServiceConfiguration(oEnableInPlaceForClassicUIsConfig);
        if (isPlainObject(oEnableInPlaceForClassicUIsConfig)) {
            return oEnableInPlaceForClassicUIsConfig[_getClassicUITechnologyForApplicationType(sApplicationType)];
        }

        return false; // default
    };


    /**
     * Determine the internal navigation mode for a given navigation mode.
     *
     * @param {string} sExternalNavigationMode
     *    A string identifying the external navigation mode. This is normally
     *    the value of the sap-ushell-next-navmode parameter configured in a
     *    matched inbound or provided in the intent.
     *
     *    This string can be one of:
     *    <ul>
     *       <li>explace</li>
     *       <li>inplace</li>
     *       <li>frameless</li>
     *    </ul>
     *
     * @param {string} oResolvedHashFragment
     *    Resolved Hash Fragment containing app type and probably URL template capabilities
     *
     * @returns {string}
     *
     *    The corresponding internal navigation mode. Can be one of the followings:
     *
     *    <ul>
     *      <li>newWindow: "open a new window and put the URL of this target in the address bar"</li>
     *      <li>embedded: "embed this target (not merely its URL) into the current FLP"</li>
     *      <li>newWindowThenEmbedded: "open an FLP in a new window and embed this target (not merely its URL) into it"</li>
     *    </ul>
     *
     *    Returns null and logs an error in case wrong input parameters were given.
     *
     * @private
     */
    oExport._getInternalNavigationMode = function (sExternalNavigationMode, oResolvedHashFragment) {

        var sApplicationType = oResolvedHashFragment.applicationType;
        var oInternalNavigationModeMap = {
            SAPUI5: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindowThenEmbedded" // Error case - see below
            },
            WDA: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            },
            TR: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            },
            URL: {
                inplace: "embedded",
                explace: "newWindow",
                frameless: "newWindow"
            },
            WCF: {
                inplace: "embedded",
                explace: "newWindowThenEmbedded",
                frameless: "newWindow"
            }
        };

        if (!oInternalNavigationModeMap.hasOwnProperty(sApplicationType)) {
            Log.error(
                sApplicationType + " is not a valid application type",
                "expected one of " + Object.keys(oInternalNavigationModeMap).join(", "),
                "sap.ushell.navigationMode"
            );
            return null;
        }

        if (sExternalNavigationMode !== "inplace" && sExternalNavigationMode !== "explace" && sExternalNavigationMode !== "frameless") {
            Log.error(
                sExternalNavigationMode + " is not a valid external navigation mode",
                "expected one of 'inplace', 'explace' or 'frameless'",
                "sap.ushell.navigationMode"
            );
            return null;
        }

        if (sApplicationType === "SAPUI5" && sExternalNavigationMode === "frameless") {
            Log.error(
                "'" + sExternalNavigationMode + "' is not a valid external navigation mode for application type '" + sApplicationType + "'",
                "falling back to internal navigation mode '" + oInternalNavigationModeMap.SAPUI5.frameless + "'",
                "sap.ushell.navigationMode"
            );
        }

        // URL Template case
        if (sApplicationType === "URL") {
            var sTemplateNavigationMode = oResolvedHashFragment.appCapabilities ? oResolvedHashFragment.appCapabilities.templateNavigationMode : undefined;
            if (sTemplateNavigationMode) {
                var oUrlTemplateIntNavigationMap = {
                    embedded: {
                        inplace: "embedded",
                        explace: "newWindowThenEmbedded",
                        frameless: "newWindowThenEmbedded" // Error case - see below
                    },
                    standalone: {
                        inplace: "newWindow", // Error case - see below
                        explace: "newWindow",
                        frameless: "newWindow"
                    }
                };
                if (sTemplateNavigationMode === "standalone" && sExternalNavigationMode === "inplace") {
                    Log.warning("Inplace navigation was requested for an app that supports only standalone mode! 'newWindow' used instead...", "sap.ushell.navigationMode");
                }
                if (sTemplateNavigationMode === "embedded" && sExternalNavigationMode === "frameless") {
                    Log.warning("Frameless navigation was requested for an app that supports only embedded mode! 'newWindowThenEmbedded' used instead...", "sap.ushell.navigationMode");
                }
                return oUrlTemplateIntNavigationMap[sTemplateNavigationMode][sExternalNavigationMode];
            }
        }

        return oInternalNavigationModeMap[sApplicationType][sExternalNavigationMode];
    };

    /**
     * Returns the external navigation mode corresponding to an internal
     * navigation node.
     *
     * @param {string} sInternalNavigationMode
     *  the navigation mode used at runtime, for example,
     *  "newWindowThenEmbedded".
     *
     * @returns {string}
     *  the corresponding external navigation mode. Can be "inplace" or
     *  "explace".
     *
     * @private
     */
    oExport.getExternalNavigationMode = function (sInternalNavigationMode) {
        var oExternalNavigationModeMap = {
            embedded: "inplace",
            newWindowThenEmbedded: "explace",
            replace: "inplace",
            newWindow: "explace"
        };

        if (!oExternalNavigationModeMap.hasOwnProperty(sInternalNavigationMode)) {
            Log.error(
                sInternalNavigationMode + " is not a recognized internal navigation mode",
                "expected one of " + Object.keys(oExternalNavigationModeMap).join(","),
                "sap.ushell.navigationMode"
            );
            return null;
        }

        return oExternalNavigationModeMap[sInternalNavigationMode];
    };

    var aWDAGUIAppType = [
        "NWBC", // Netweaver Business Client - HTML version (wrapping e.g. WDA apps). Do not confuse with NWBC native client!
        "WDA", // Directly integrated WDA apps (w/o NWBC wrapper)
        "TR", // Relates to technology "GUI"
        "WCF" // WebClientUI Framework (aka. "CRM UI")
    ];

    /**
     * Returns details about the navigation mode of a given resolved hash fragment.
     * The returned data is meant to be mixed into the Resolution Result of a NavTarget resolution run.
     *
     * @param {object} oResolvedHashFragment The hash fragment resolved by one of the registered resolvers
     * @param {string} [sExternalUshellNavMode] sap-ushell-navmode
     * @param {string} [sExternalUshellNextNavMode] sap-ushell-next-navmode
     *
     * @returns {object}
     *     the navigation mode for the given hash fragment. Returns the
     *     following values, each corresponding to a specific way the
     *     application should be navigated to:
     *     <ul>
     *         <li><code>"embedded"</code>: the application should be opened in the current window, and rendered within the launchpad shell.</li>
     *
     *         <li><code>"newWindow"</code>: the application should be rendered in a new window, but no launchpad header must be present.</li>
     *
     *         <li><code>"newWindowThenEmbedded"</code>: the application should be opened in a new window but rendered within the launchpad shell.</li>
     *
     *         <li><code>undefined</code>: it was not possible to determine a navigation mode for the app. An error should be displayed in this case.</li>
     *     </ul>
     *
     *   {
     *        explicitNavMode: true,      // use the specified navigationMode
     *        navigationMode: "embedded", // the (internal) navigation mode
     *                                    // used for the resolved target
     *        "sap-ushell-next-navmode": "explace"
     *   }
     * @private
     */
    oExport.getNavigationMode = function (oResolvedHashFragment, sExternalUshellNavMode, sExternalUshellNextNavMode) {
        var sAdditionalInformation = oResolvedHashFragment.additionalInformation;
        var sApplicationType = oResolvedHashFragment.applicationType;
        var sUi5ComponentPart;
        var sUi5ComponentRegex;

        var oNavModeResult = {
            navigationMode: undefined,
            explicitNavMode: false
        };


        if (["inplace", "explace"].indexOf(sExternalUshellNextNavMode) >= 0) {
            oNavModeResult["sap-ushell-next-navmode"] = sExternalUshellNextNavMode;
        }


        if (["inplace", "explace", "frameless"].indexOf(sExternalUshellNavMode) >= 0) {
            var sInternalNavigationMode = oExport._getInternalNavigationMode(sExternalUshellNavMode, oResolvedHashFragment);

            Log.debug(
                "Navigation mode was forced to " + sInternalNavigationMode
                + " because sap-ushell-navmode parameter was set to " + sExternalUshellNavMode + " for target",
                "sap.ushell.navigationMode"
            );

            oNavModeResult.navigationMode = sInternalNavigationMode;
            oNavModeResult.explicitNavMode = true;
            return oNavModeResult;
        }

        // Only relevant for TR/GUI, WCF, WDA
        if (oExport._isInplaceEnabledForApplicationType(sApplicationType) === true) {
            oNavModeResult.navigationMode = oExport._getInternalNavigationMode("inplace", oResolvedHashFragment);
        }


        // Only relevant for URL
        if (oResolvedHashFragment.appCapabilities && oResolvedHashFragment.appCapabilities.navigationMode) {
            oNavModeResult.navigationMode = oResolvedHashFragment.appCapabilities.navigationMode;
            return oNavModeResult;
        }

        if ((sAdditionalInformation === null || typeof sAdditionalInformation === "string" || typeof sAdditionalInformation === "undefined") &&
            (sApplicationType === "URL" || sApplicationType === "SAPUI5")) {
            /*
             * NOTE: The "managed=" and "SAPUI5.Component=" cases are
             * skipped if the additionalInformation field does not start
             * exactly with the "managed=" and "SAPUI5.Component=" values;
             */

            // managed= case(s)
            if (sAdditionalInformation && sAdditionalInformation.indexOf("managed=") === 0) {
                if (sAdditionalInformation === "managed=FioriWave1") {
                    oNavModeResult.navigationMode = "embedded";
                    return oNavModeResult;
                }

                if (sAdditionalInformation === "managed=") {
                    oNavModeResult.navigationMode = "newWindow";
                    return oNavModeResult;
                }

                return oNavModeResult;
            }

            // UI5 component case
            if (sAdditionalInformation && sAdditionalInformation.indexOf("SAPUI5.Component=") === 0) {
                sUi5ComponentPart = "[a-zA-Z0-9_]+";
                sUi5ComponentRegex = [
                    "^SAPUI5.Component=", // starts with SAPUI5.Component=
                    sUi5ComponentPart, // at least one part
                    "([.]", sUi5ComponentPart, ")*$" // multiple dot-separated parts
                ].join("");

                if (!(new RegExp(sUi5ComponentRegex)).test(sAdditionalInformation)) {
                    Log.warning(["The UI5 component name in",
                        sAdditionalInformation, "is not valid.",
                        "Please use names satisfying", sUi5ComponentRegex
                    ].join(" "));
                }
                oNavModeResult.navigationMode = "embedded";
                return oNavModeResult;
            }

            oNavModeResult.navigationMode = "newWindow";
            return oNavModeResult;
        }

        // default
        if (oNavModeResult.navigationMode === undefined) {
            // Compatibility... explace for WDA, GUI, WCF
            if (aWDAGUIAppType.indexOf(sApplicationType) > -1) {
                oNavModeResult.navigationMode = "newWindowThenEmbedded";
            } else if (sApplicationType === "SAPUI5") {
                oNavModeResult.navigationMode = "embedded";
            } else {
                oNavModeResult.navigationMode = "newWindow";
                Log.error("Invalid ApplicationType: " + sApplicationType);
            }
        }

        return oNavModeResult;
    };

    /**
     * Computes the navigation mode for all types of applications
     *
     * @param {string} sApplicationType
     *  the application type of the tile
     *
     * @param {string} sAdditionalInformation
     *  additional information about the tile
     *
     * @param {boolean} bIsApplicationTypeConfiguredInPlace
     *  configuration of Classic UI technology for this application type
     *
     * @returns {string}
     *  the computed navigation mode for homepage tiles
     *
     * @private
     */
    oExport.computeNavigationModeForHomepageTiles = function (sApplicationType, sAdditionalInformation, bIsApplicationTypeConfiguredInPlace) {
        var oResolvedHashFragment = {
            applicationType: sApplicationType,
            additionalInformation: sAdditionalInformation
        };

        if (aWDAGUIAppType.indexOf(sApplicationType) > -1 && bIsApplicationTypeConfiguredInPlace) {
            return "embedded";
        }

        return this.getNavigationMode(oResolvedHashFragment).navigationMode;
    };

    return oExport;
}, false);
