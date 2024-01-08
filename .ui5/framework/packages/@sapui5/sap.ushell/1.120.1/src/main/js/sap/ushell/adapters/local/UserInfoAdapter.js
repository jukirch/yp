// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The UserInfo adapter for the demo platform.
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/base/util/ObjectPath",
    "sap/base/Log"
], function (jQuery, ObjectPath, Log) {
    "use strict";

    /**
     * This demo adapter reads its configuration from the demo config, where the target applications are defined.
     *
     * @param oSystem
     * @returns {sap.ushell.adapters.local.UserInfoAdapter}
     */
    var UserInfoAdapter = function (oUnused, sParameter, oAdapterConfiguration) {
        var oUserThemeConfiguration;

        /**
         * Generates the theme configuration for the user based on the external configuration
         * provided in window['sap-ushell-config'].
         *
         * @param {object}
         *     the configuration specified by the user externally
         *
         * @returns {object}
         *     the theme configuration array for getThemeList method
         *
         * @private
         */
        function generateThemeConfiguration (oAdapterThemesConfiguration) {
            var defaultConfig = [
                { id: "sap_horizon", name: "SAP Morning Horizon" },
                { id: "sap_horizon_dark", name: "SAP Evening Horizon" },
                { id: "sap_horizon_hcb", name: "SAP HCB (SAP Horizon)" },
                { id: "sap_horizon_hcw", name: "SAP HCW (SAP Horizon)" },
                { id: "sap_fiori_3", name: "SAP Quartz Light" },
                { id: "sap_fiori_3_dark", name: "SAP Quartz Dark" },
                { id: "sap_belize_plus", name: "SAP Belize Plus" },
                { id: "sap_belize", name: "SAP Belize" },
                { id: "theme1_id", name: "Custom Theme" },
                { id: "sap_fiori_3_hcb", name: "SAP Quartz HCB" },
                { id: "sap_fiori_3_hcw", name: "SAP Quartz HCW" }
            ];
            var externalConfig = ObjectPath.get("config.themes", oAdapterThemesConfiguration);

            return externalConfig === undefined ? defaultConfig : externalConfig;
        }

        this.updateUserPreferences = function (oUser) {
            var oDeferred = new jQuery.Deferred();

            function logError (vError) {
                var sError = "Failed to update user preferences: " + (vError && vError.message ? vError.message : vError);
                Log.error(sError, vError && vError.stack, "com.sap.ushell.adapters.local.UserInfo");
            }

            sap.ushell.Container.getServiceAsync("PersonalizationV2").then(function (oPersonalizationService) {
                var oScope = {
                    keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                    writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                    clientStorageAllowed: true
                };

                function setChangedPropertiesInContainer (oContainer, oUser) {
                    var aChangedProperties = oUser.getChangedProperties() || [];

                    aChangedProperties.forEach(function (oChange) {
                        oContainer.setItemValue(oChange.propertyName, oChange.newValue);
                    });
                }

                oPersonalizationService.getContainer("sap.ushell.UserProfile", oScope, undefined)
                    .then(function (oContainer) {
                        setChangedPropertiesInContainer(oContainer, oUser);
                        oContainer.save()
                            .then(function () {
                                oDeferred.resolve();
                            })
                            .catch(function (vError) {
                                logError(vError);
                                oDeferred.reject(vError);
                            });
                    })
                    .catch(function (vError) {
                        logError(vError);
                        oDeferred.reject(vError);
                    });
            });

            return oDeferred.promise();
        };

        this.getThemeList = function () {
            var oDeferred = new jQuery.Deferred();

            // make sure a configuration is available
            if (oUserThemeConfiguration === undefined) {
                oUserThemeConfiguration = generateThemeConfiguration(oAdapterConfiguration);
            }

            // we need to have at least one theme
            if (oUserThemeConfiguration.length === 0) {
                oDeferred.reject("no themes were configured");
            } else {
                oDeferred.resolve({
                    options: oUserThemeConfiguration
                });
            }

            return oDeferred.promise();
        };

        this.getLanguageList = function () {
            var oDeferred = new jQuery.Deferred();
            oDeferred.resolve(
                [
                    {
                        text: "Browser Language",
                        key: "default"
                    },
                    {
                        text: "American English",
                        key: "en-US"
                    },
                    {
                        text: "British English",
                        key: "en-GB"
                    },
                    {
                        text: "English",
                        key: "en"
                    },
                    {
                        text: "German",
                        key: "de"
                    },
                    {
                        text: "Hebrew",
                        key: "he"
                    },
                    {
                        text: "Russian",
                        key: "ru"
                    }
                ]
            );

            return oDeferred.promise();
        };
    };

    return UserInfoAdapter;
}, /* bExport= */ false);
