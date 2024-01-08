// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Configuration",
    "sap/ui/core/Locale",
    "sap/ui/core/LocaleData",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/performance/Measurement",
    "sap/ushell/Config"
], function (
    Log,
    Configuration,
    Locale,
    LocaleData,
    DateFormat,
    Controller,
    JSONModel,
    Measurement,
    Config
) {
    "use strict";

    return Controller.extend("sap.ushell.components.shell.Settings.userLanguageRegion.LanguageRegionSelector", {
        onInit: function () {
            this.oUserInfoServicePromise = sap.ushell.Container.getServiceAsync("UserInfo");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    this.oUser = sap.ushell.Container.getUser();

                    var oLocale = Configuration.getFormatSettings().getFormatLocale();
                    var oLocaleData = LocaleData.getInstance(oLocale);
                    var sDatePattern, sTimePattern, sTimeFormat, sNumberFormat, sCalendarWeekNumbering;


                    var bIsEnableSetLanguage = sap.ushell.Container.getRenderer("fiori2").getShellConfig().enableSetLanguage || false;
                    var bIsLanguagePersonalized = this.oUser.isLanguagePersonalized();
                    var bIsEnableSetUserPreference = UserInfo.getUserSettingListEditSupported();//Check if adapter supports user setting editing

                    var aUserPreferenceAndLanguageSettingPromises = [];
                    if (bIsEnableSetUserPreference) {
                        var oFormatSetting = Configuration.getFormatSettings();
                        sDatePattern = oFormatSetting.getLegacyDateFormat();
                        sTimeFormat = oFormatSetting.getLegacyTimeFormat();
                        sNumberFormat = this._getLegacyNumberFormat(oFormatSetting);
                        sCalendarWeekNumbering = this.oUser.getCalendarWeekNumbering?.() || "Default";
                        aUserPreferenceAndLanguageSettingPromises.push(this._loadUserSettingList());
                    } else {
                        sDatePattern = oLocaleData.getDatePattern("medium");
                        sTimePattern = oLocaleData.getTimePattern("medium");
                        sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h";
                        sCalendarWeekNumbering = "Default";
                    }

                    var oModel = new JSONModel({
                        languageList: null,
                        DateFormatList: null,
                        TimeFormatList: null,
                        NumberFormatList: null,
                        TimeZoneList: null,
                        CalendarWeekNumberingList: null,
                        selectedLanguage: this.oUser.getLanguage(),
                        selectedLanguageText: this.oUser.getLanguageText(),
                        selectedDatePattern: sDatePattern,
                        selectedTimeFormat: sTimeFormat,
                        selectedNumberFormat: sNumberFormat,
                        selectedTimeZone: this.oUser.getTimeZone(),
                        selectedCalendarWeekNumbering: sCalendarWeekNumbering,
                        isSettingsLoaded: true,
                        isLanguagePersonalized: bIsLanguagePersonalized,
                        isEnableSetLanguage: bIsEnableSetLanguage,
                        isEnableUserProfileSetting: bIsEnableSetUserPreference,
                        isTimeZoneFromServerInUI5: Config.last("/core/ui5/timeZoneFromServerInUI5")
                    });
                    oModel.setSizeLimit(1000);

                    if (bIsEnableSetLanguage) {
                        aUserPreferenceAndLanguageSettingPromises.push(this._loadLanguagesList());
                    }
                    if (aUserPreferenceAndLanguageSettingPromises.length > 0) {
                        this.getView().setBusy(true);
                        return Promise.all(aUserPreferenceAndLanguageSettingPromises).then(function (aResults) {
                            var oUserSettingList = bIsEnableSetUserPreference ? aResults[0] : null;
                            var aLanguageList = null;
                            if (bIsEnableSetLanguage) {
                                aLanguageList = aResults.length === 1 ? aResults[0] : aResults[1];
                            }


                            if (aLanguageList?.length > 1) {
                                oModel.setProperty("/languageList", aLanguageList);
                                var bHasDefault = aLanguageList.some(function (oLanguage) {
                                    return oLanguage.key === "default";
                                });
                                if (!bIsLanguagePersonalized && bHasDefault) {
                                    oModel.setProperty("/selectedLanguage", "default");
                                }
                            }
                            if (oUserSettingList?.TIME_FORMAT?.length > 0) {
                                oModel.setProperty("/TimeFormatList", oUserSettingList.TIME_FORMAT);
                            }
                            if (oUserSettingList?.DATE_FORMAT?.length > 0) {
                                oModel.setProperty("/DateFormatList", oUserSettingList.DATE_FORMAT);
                            }
                            if (oUserSettingList?.TIME_ZONE?.length > 0) {
                                var oDateTimeWithTimezone = DateFormat.getDateTimeWithTimezoneInstance({showDate: false, showTime: false});
                                var aTimeZones = oUserSettingList.TIME_ZONE.map(function (timeZone) {
                                    var sTimeZomeText = oDateTimeWithTimezone.format(null, timeZone.description) || timeZone.description;
                                    return {description: sTimeZomeText, value: timeZone.value};
                                });
                                oModel.setProperty("/TimeZoneList", aTimeZones);
                            }
                            if (oUserSettingList?.NUMBER_FORMAT?.length > 0) {
                                oModel.setProperty("/NumberFormatList", oUserSettingList.NUMBER_FORMAT);
                            }
                            if (oUserSettingList?.CALENDAR_WEEK_NUMBERING) {
                                var aCalendarWeekList = UserInfo.getCalendarWeekNumberingList()
                                    .map(/* updateSelectedNumbering*/ numbering => {
                                        numbering.selected = numbering.value === oModel.getProperty("/selectedCalendarWeekNumbering");
                                        return numbering;
                                    });
                                oModel.setProperty(
                                    "/CalendarWeekNumberingList",
                                    aCalendarWeekList
                                );
                            }

                            this.oView.setModel(oModel);
                            this.getView().setBusy(false);
                        }.bind(this));
                    }
                    this.oView.setModel(oModel);
                }.bind(this));
        },

        /**
         * Load language via userInfoService API
         * @returns {Promise<object[]>} the language list from the platforms
         * @private
         */
        _loadLanguagesList: function () {
            Measurement.start("FLP:LanguageRegionSelector._getLanguagesList", "_getLanguagesList", "FLP");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    return new Promise(function (resolve) {
                        Measurement.start("FLP:LanguageRegionSelector._getLanguagesList", "_getLanguagesList", "FLP");
                        UserInfo.getLanguageList()
                            .done(function (oData) {
                                Measurement.end("FLP:LanguageRegionSelector._getLanguagesList");
                                resolve(oData);
                            })
                            .fail(function (error) {
                                Measurement.end("FLP:LanguageRegionSelector._getLanguagesList");
                                Log.error("Failed to load language list.", error,
                                    "sap.ushell.components.ushell.settings.userLanguageRegion.LanguageRegionSelector.controller");
                                resolve(null);
                            });
                    });
                });
        },

        /**
         * Load User Profile settings List via userInfoService API
         * @returns {Promise} the Language List ,Date Format List,Time Format list and Time Zone List from the platforms
         * @private
         */
        _loadUserSettingList: function () {
            Measurement.start("FLP:LanguageRegionSelector._loadUserSettingList", "_loadUserSettingList", "FLP");
            return this.oUserInfoServicePromise
                .then(function (UserInfo) {
                    return new Promise(function (resolve) {
                        Measurement.start("FLP:LanguageRegionSelector._loadUserSettingList", "_loadUserSettingList", "FLP");
                        UserInfo.getUserSettingList()
                            .then(function (oData) {
                                Measurement.end("FLP:LanguageRegionSelector._loadUserSettingList");
                                resolve(oData);
                            });
                    });
                });
        },

        _resetLanguage: function () {
            var oUserLanguage = this.oUser.getLanguage(),
                oModel = this.getView().getModel(),
                oModelData = oModel.getData();
            // if the user language isn't personalzied - need to return browser language in select
            var sSelectedLanguage = oModelData.isLanguagePersonalized ? oUserLanguage : "default";
            oModel.setProperty("/selectedLanguage", sSelectedLanguage);
            //Date and time format are taken from current language
            this._updateTextFields(oUserLanguage);
        },

        onCancel: function () {
            var oModel = this.getView().getModel(),
                oModelData = oModel.getData(),
                aLanguageList = oModelData.languageList,
                isEnableSetLanguage = oModelData.isEnableSetLanguage;
            if (isEnableSetLanguage && aLanguageList) {
                this._resetLanguage();
            }
            if (oModelData.isEnableUserProfileSetting) {
                this._restoreUserSettingPreferenceValues();
            }
        },
        onSaveSuccess: function (oUser, bUpdateLanguage, sSelectedLanguage) {
            var oResolvedResult = {
                refresh: true
            };
            oUser.resetChangedProperty("dateFormat");
            oUser.resetChangedProperty("timeFormat");
            oUser.resetChangedProperty("numberFormat");
            oUser.resetChangedProperty("timeZone");
            oUser.resetChangedProperty("calendarWeekNumbering");
            if (bUpdateLanguage) {
                Log.debug("[000] onSaveSuccess: oUser.resetChangedPropertyLanguage:", "LanguageRegionSelector.controller");
                oUser.resetChangedProperty("language");
                oResolvedResult.obsoleteUrlParams = ["sap-language"];
            }
            return oResolvedResult; //refresh the page to apply changes.
        },

        /**
         * Event fired on the Save of the Language and Region Settings
         * @param {function} fnUpdateUserPreferences A function to update user preferences.
         * @returns {Promise<object>} oResolvedResult Promise that resolves with the save result containing urlParams and a refresh parameter
         *    and rejects with a message object.
         * @private
         */
        onSave: function (fnUpdateUserPreferences) {
            var oUser = this.oUser,
                oModelData = this.getView().getModel().getData(),
                sSelectedLanguage = oModelData.selectedLanguage,
                sOriginLanguage = oUser.getLanguage(),
                bLanguageChanged = sSelectedLanguage && sSelectedLanguage !== (oModelData.isLanguagePersonalized ? sOriginLanguage : "default"),
                bIsEnableSetUserProfileSetting = oModelData.isEnableUserProfileSetting,
                bUpdateLanguage = oModelData.isEnableSetLanguage && oModelData.languageList && bLanguageChanged,
                bUpdate = false,
                aPropertyNames = [
                    "DATE_FORMAT",
                    "TIME_FORMAT",
                    "NUMBER_FORMAT",
                    "TIME_ZONE",
                    "LANGUAGE",
                    "CALENDAR_WEEK_NUMBERING"
                ];
            Log.debug("[000] LanguageRegionSelector:onSave:bUpdateLanguage, bIsEnableSetUserProfileSetting:", bUpdateLanguage, "LanguageRegionSelector.controller");
            if (bUpdateLanguage) {
                Log.debug("[000] LanguageRegionSelector:onSave:UserInfo: oUser.setLanguage:", sSelectedLanguage, "LanguageRegionSelector.controller");
                oUser.setLanguage(sSelectedLanguage);
            } else {
                this._resetLanguage();
            }

            if (bIsEnableSetUserProfileSetting) {
                var oFormatSetting = Configuration.getFormatSettings();
                if (oFormatSetting.getLegacyDateFormat() !== oModelData.selectedDatePattern) {
                    bUpdate = true;
                    oUser.setChangedProperties({
                        propertyName: "dateFormat",
                        name: "DATE_FORMAT"
                    }, oFormatSetting.getLegacyDateFormat(), oModelData.selectedDatePattern);
                }
                if (oFormatSetting.getLegacyTimeFormat() !== oModelData.selectedTimeFormat) {
                    bUpdate = true;
                    oUser.setChangedProperties({
                        propertyName: "timeFormat",
                        name: "TIME_FORMAT"
                    }, oFormatSetting.getLegacyTimeFormat(), oModelData.selectedTimeFormat);
                }

                if (this._getLegacyNumberFormat(oFormatSetting) !== oModelData.selectedNumberFormat) {
                    bUpdate = true;
                    oUser.setChangedProperties({
                        propertyName: "numberFormat",
                        name: "NUMBER_FORMAT"
                    }, this._getLegacyNumberFormat(oFormatSetting), oModelData.selectedNumberFormat);
                }
                if (!oModelData.selectedTimeZone) { // Reset invalid time zone entry
                    this.getView().getModel().setProperty("/selectedTimeZone", this.oUser.getTimeZone());
                } else if (this.oUser.getTimeZone() !== oModelData.selectedTimeZone) {
                    bUpdate = true;
                    oUser.setChangedProperties({
                        propertyName: "timeZone",
                        name: "TIME_ZONE"
                    }, this.oUser.getTimeZone(), oModelData.selectedTimeZone);
                }
                if (Configuration.getCalendarWeekNumbering() !== oModelData.selectedCalendarWeekNumbering) {
                    bUpdate = true;
                    oUser.setChangedProperties({
                        propertyName: "calendarWeekNumbering",
                        name: "CALENDAR_WEEK_NUMBERING"
                    }, Configuration.getCalendarWeekNumbering(), oModelData.selectedCalendarWeekNumbering.trim());
                    Configuration.setCalendarWeekNumbering(oModelData.selectedCalendarWeekNumbering);
                }
            }
            if (bUpdateLanguage || bUpdate) {
                return fnUpdateUserPreferences()
                    .then(function () {
                        Log.debug("[000] onSave:fnUpdateUserPreferences", "LanguageRegionSelector.controller");
                        return this.onSaveSuccess(oUser, bUpdateLanguage, sSelectedLanguage);
                    }.bind(this))
                    // in case of failure - return to the original language
                    .catch(function (errorMessage) {
                        Log.debug("[000] onSave:catch:errorMessage", errorMessage, "LanguageRegionSelector.controller");
                        var bSomeNamesInErrorMessage = aPropertyNames.some(function (sName) {
                            return errorMessage.includes(sName);
                        });
                        if (!bSomeNamesInErrorMessage) {
                            return this.onSaveSuccess(oUser, bUpdateLanguage, sSelectedLanguage);
                        }
                        if (bUpdateLanguage) {
                            oUser.setLanguage(sOriginLanguage);
                            oUser.resetChangedProperty("language");
                            this._updateTextFields(sOriginLanguage);
                        }
                        oUser.resetChangedProperty("dateFormat");
                        oUser.resetChangedProperty("timeFormat");
                        oUser.resetChangedProperty("numberFormat");
                        oUser.resetChangedProperty("timeZone");
                        oUser.resetChangedProperty("calendarWeekNumbering");


                        if (oModelData.isEnableUserProfileSetting) {
                            this._restoreUserSettingPreferenceValues();
                        }
                        Log.error("Failed to save Language and Region Settings", errorMessage,
                            "sap.ushell.components.ushell.settings.userLanguageRegion.LanguageRegionSelector.controller");
                        throw errorMessage;
                    }.bind(this));
            }
            return Promise.resolve();
        },
        /**
         * Restores the User settings Preference original values
         *
         * @private
         */
        _restoreUserSettingPreferenceValues: function () {
            var oModel = this.getView().getModel();
            var oFormatSetting = Configuration.getFormatSettings();
            oModel.setProperty("/selectedDatePattern", oFormatSetting.getLegacyDateFormat());
            oModel.setProperty("/selectedTimeFormat", oFormatSetting.getLegacyTimeFormat());
            oModel.setProperty("/selectedNumberFormat", this._getLegacyNumberFormat(oFormatSetting));
            oModel.setProperty("/selectedTimeZone", this.oUser.getTimeZone());
            oModel.setProperty("/selectedCalendarWeekNumbering", Configuration.getCalendarWeekNumbering());
            // restore calendar week numbering
            var aCalendarWeekList = oModel.getProperty("/CalendarWeekNumberingList")
                .map(/* updateSelectedNumberingWithSavedValue*/ numbering => {
                    numbering.selected = numbering.value === Configuration.getCalendarWeekNumbering();
                    return numbering;
                });
            oModel.setProperty(
                "/CalendarWeekNumberingList",
                aCalendarWeekList
            );

        },


        /**
         * This method call handle the change in the selection language
         * @param {string} oEvent control event
         * @private
         */
        _handleLanguageSelectChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getSource().getSelectedKey();
            if (sSelectedLanguage) {
                this._updateTextFields(sSelectedLanguage);
            }
        },

        /**
         * Update Date and Time text fields
         * @param {string} language the newly selected language
         * @private
         */
        _updateTextFields: function (language) {
            var oLocale;

            if (language === this.oUser.getLanguage()) {
                oLocale = Configuration.getFormatSettings().getFormatLocale();
            } else {
                oLocale = new Locale(language);
            }

            var oModel = this.getView().getModel(),
                oLocaleData = LocaleData.getInstance(oLocale),
                sDatePattern = oLocaleData.getDatePattern("medium"),
                sTimePattern = oLocaleData.getTimePattern("medium"),
                sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h";
            if (!oModel.getData().isEnableUserProfileSetting) {
                oModel.setProperty("/selectedDatePattern", sDatePattern);
                oModel.setProperty("/selectedTimeFormat", sTimeFormat);
            }
        },

        /**
         * Returns the legacy number format from the core Configuration.
         * ATTENTION: We store the legacy number format as a string with a space character (" ") in the core config, while
         * the key returned by the backend is an empty string (""). Therefore we must convert it to empty string to make
         * valid comparisons.
         *
         * @param {object} oFormatSetting The object with format settings.
         * @returns {string|undefined} The number format if it exists or undefined if not.
         * @private
         */
        _getLegacyNumberFormat: function (oFormatSetting) {
            var sLegacyNumberFormat = oFormatSetting.getLegacyNumberFormat();
            if (sLegacyNumberFormat) {
                return sLegacyNumberFormat.trim();
            }
        },

        /**
         * Handle Change event of RadioButton List for Calendar Week Handling and update model
         * @param {Event} oEvent the event data of the change handler
         * @since 1.118.0
         * @private
         */
        _handleCalendarWeekNumberingChange: function (oEvent) {
            var sSelectedItem = oEvent.getSource().getSelectedItem().getCustomData()[0].getValue();
            this.getView().getModel().setProperty("/selectedCalendarWeekNumbering", sSelectedItem);
        }
    });
});
