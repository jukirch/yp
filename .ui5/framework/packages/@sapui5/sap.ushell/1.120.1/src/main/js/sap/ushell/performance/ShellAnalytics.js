// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview Provides analytical data like duration for navigation steps in the shell, in FLP,
 *               in particular an array of all statistical records
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ushell/EventHub",
    "sap/ushell/services/AppConfiguration",
    "sap/ushell/performance/StatisticalRecord",
    "sap/ushell/utils"
], function (
    Log,
    EventHub,
    AppConfiguration,
    StatisticalRecord,
    Utils
) {
    "use strict";

    const sModuleName = "ShellAnalytics";
    const sLogPrefix = "[FesrFlp]";

    let aStatisticalRecords = [];
    let aDoables = [];
    let bHomePageLoaded = false;
    let bInitialized = false;

    let oStatisticalRecord, // current statistical record
        oCurrentApplication,
        lastHashChangeTime;

    const NAVIGATION_MODE = {
        EXPLACE: "EXPLACE",
        INPLACE: "INPLACE"
    };

    const FLP_APPLICATION_LOOKUP = {
        "sap.ushell.components.appfinder": "FLP_FINDER",
        "sap.ushell.components.pages": "FLP_PAGE",
        "sap.ushell.components.homepage": "FLP_HOME"
    };

    /**
     * Check if application is FLP homepage
     *
     * @param {object} [oApplication] application
     *
     * @returns {boolean} true for homepage and page runtime and for special case that it is a home application
     */
    function _isFLPHome (oApplication) {
        if (!oApplication) {
            return false;
        }
        return oApplication.id === "FLP_HOME" || oApplication.id === "FLP_PAGE";
    }

    /**
     * Is application a home application
     * @param {object} [oApplication] application
     * @returns {boolean} isHomeApp true if given application is a home application
     */
    function _isHomeApp (oApplication) {
        return oApplication && oApplication.isHomeApp;
    }

    /**
     * Gets all statistical records
     * @returns {sap.ushell.performance.StatisticalRecord[]} Array of statistical records
     */
    function getAllRecords () {
        return aStatisticalRecords;
    }

    /**
     * Gets last closed record
     * @returns {sap.ushell.performance.StatisticalRecord} last closed record
     */
    function getLastClosedRecord () {
        const aClosedRecords = getAllRecords().filter((oRecord) => {
            return oRecord.isClosed();
        });
        if (aClosedRecords.length > 0) {
            return aClosedRecords[aClosedRecords.length - 1];
        }
        return null;
    }
    /**
     * Gets the next record according to the start time in a navigation given a last tracked record
     * @param {sap.ushell.performance.StatisticalRecord} [oLastTrackedRecord] The last tracked record
     * @returns {sap.ushell.performance.StatisticalRecord} oNextNavigationRecord The next navigation record or undefined if it does not exist
     */
    function getNextNavigationRecords (oLastTrackedRecord) {
        if (!oLastTrackedRecord) {
            return getAllRecords().filter((oRecord) => {
                return oRecord.isClosed();
            });
        }

        return getAllRecords().filter((oRecord) => {
            return oLastTrackedRecord.getTimeStart() < oRecord.getTimeStart() && oRecord.isClosed();
        });
    }

    function getCurrentApplication () {
        return oCurrentApplication;
    }

    function _setCurrentApplication (oApplication) {
        Log.debug(`${sLogPrefix} ShellAnalytics setCurrentApplication: ${oApplication && oApplication.id}`, null, sModuleName);
        oCurrentApplication = oApplication;
    }

    /**
     * Tracks the time the hash changes
     */
    function _trackHashChangeTime () {
        lastHashChangeTime = performance.now();
        Utils.setPerformanceMark("FLP -- change hash");
    }
    /**
     * Gets the current statistical record or creates it if it does not exist
     * @returns {sap.ushell.performance.StatisticalRecord} The current statistical record
     */
    function _getOrCreateCurrentStatisticalRecord () {
        if (!oStatisticalRecord) {
            const oLastRecord = aStatisticalRecords[aStatisticalRecords.length - 1] || null;
            oStatisticalRecord = new StatisticalRecord(oLastRecord);
            aStatisticalRecords.push(oStatisticalRecord);
        }
        return oStatisticalRecord;
    }

    /**
     * Tracks a new target hash with time in a statistical record
     * @param {string} sNewHash New hash value
     */
    function trackNewTargetHash (sNewHash) {
        const oRecord = _getOrCreateCurrentStatisticalRecord();
        oRecord.setTargetHash(sNewHash);
        oRecord.setTimeStart(lastHashChangeTime || performance.now());
    }

    /**
     * Removes the parameters of a technical name that comes
     * with a transaction name and parameters.
     * Removes star at the beginning if it exists.
     * Replaces the string (TCODE) by the string (TR) at the end.
     * @param {string} [sTechnicalName] Technical name of a transaction with parameters or WD application
     * @returns {string} The transaction name or an empty string if input is not a transaction
     */
    function _removeParametersIfTransaction (sTechnicalName) {
       const sTechnicalNameWithDefault = sTechnicalName || "";
       if (sTechnicalNameWithDefault.slice(-7) === "(TCODE)") {
           return sTechnicalNameWithDefault
           .replace(/ .*/, "") // remove all starting with a space
           .replace(/^\*/, "") // remove star at the beginning
           .substring(0, 15) // trim 15 char
           .concat(" (TR)"); // add type
       }
       return sTechnicalNameWithDefault;
   }

    /**
     * Gets the current application id from the manifest.
     * @param {object} oCurrentApp The application object from sap.ushell.Container.getServiceAsync("AppLifeCycle")
     * @returns {string} Application id like sap.ushell.components.homepage
     */
    function _getAppIdFromManifest (oCurrentApp) {
        let sApplicationId = "";
        const oApplicationManifest = oCurrentApp.componentInstance && oCurrentApp.componentInstance.getManifest();
        if (oApplicationManifest && oApplicationManifest["sap.app"] && oApplicationManifest["sap.app"].id) {
            sApplicationId = oApplicationManifest["sap.app"].id;
        }
        return sApplicationId;
    }

    /**
     * Gets the current application. This can be a UI5, Web Dynpro, SAP GUI or WCF application
     * @returns {Promise<object>} A promise to be resolved after service is loaded. The promise resolves to the current application.
     */
    async function _getCurrentApplication () {
        const oAppLifeCycleService = await sap.ushell.Container.getServiceAsync("AppLifeCycle");
        // error case
        const oCurrentApp = oAppLifeCycleService.getCurrentApplication();
        if (!oCurrentApp) {
            return {};
        }
        // some preparation
        const bIsHomeApp = oCurrentApp
            && oCurrentApp.componentInstance
            && oCurrentApp.componentInstance.sId
            && oCurrentApp.componentInstance.sId.includes("homeApp-component");
        let oPromiseFioriIds;
        // Method getTechnicalParameter might not exist.
        if (oCurrentApp.getTechnicalParameter) {
            oPromiseFioriIds = oCurrentApp.getTechnicalParameter("sap-fiori-id");
        } else {
            oPromiseFioriIds = Promise.resolve([]);
        }

        // get Fiori Id
        const aFioriIds = await oPromiseFioriIds;
        let sApplicationId = aFioriIds && aFioriIds[0];
        // custom home
        if (bIsHomeApp) {
                return {
                    type: "UI5",
                    id: sApplicationId,
                    isHomeApp: true
                };
        }

        // home page
        if (oCurrentApp.homePage) {
            const sId = FLP_APPLICATION_LOOKUP[_getAppIdFromManifest(oCurrentApp)] || "FLP_HOME";
            return {
                type: "UI5",
                id: sId
            };
        }

        // UI5 app
        if (oCurrentApp.applicationType === "UI5") {
            if (!sApplicationId) {
                sApplicationId = _getAppIdFromManifest(oCurrentApp);
                //Additional check that it is not flp application
                sApplicationId = FLP_APPLICATION_LOOKUP[sApplicationId] || sApplicationId;
            }
            //sApplicationId from sap.app.id can have comma (there is no validation from manifest validation)
            sApplicationId = sApplicationId.replace(/,/g, "");
            return {
                type: "UI5",
                id: sApplicationId
            };
        }

        // application Type WDA / TR / WCF
        // get technicalName from application configuration
        const sTechnicalNameFromAppConfiguration = AppConfiguration.getMetadata().technicalName || AppConfiguration.getCurrentApplication().text || oCurrentApp.applicationType;
        const sTechnicalNameForFESR = _removeParametersIfTransaction(
            //need to remove all comma, because fesr has the csv format with comma separation
                sTechnicalNameFromAppConfiguration.replace(/,/g, "")
            );

        return {
            type: oCurrentApp.applicationType,
            id: sTechnicalNameForFESR
        };
    }



    /**
     * Closes Navigation by closing the statistical record with updated data.
     * Additionally method check if the homepage loaded the first time (use global bHomePageLoaded variable)
     * and update the record respectively.
     *
     * @param {object} [oSourceApplication] source application
     * @param {string} oSourceApplication.id Fiori id for ui5 application or sTechnicalName for others
     * @param {boolean} oSourceApplication.isHomeApp true, if it is a custom application
     * @param {object} [oTargetApplication] target application
     * @param {string} oTargetApplication.id Fiori id for ui5 application or sTechnicalName for others
     * @param {boolean} oTargetApplication.isHomeApp true, if it is a custom application
     * @param {string} oTargetApplication.type Type of the application. For example, UI5
     * @param {string} sNavigationMode navigation mode
     * @param {sap.ushell.performance.StatisticalRecord} oRecord the related Statistical Record
     *
     */
    function _closeNavigation (oSourceApplication, oTargetApplication, sNavigationMode, oRecord) {
        if (oRecord) {
            oRecord.setSourceApplication(oSourceApplication && oSourceApplication.id);
            oRecord.setTargetApplication(oTargetApplication && oTargetApplication.id);
            oRecord.setTargetApplicationType(oTargetApplication && oTargetApplication.type);
            oRecord.setNavigationMode(sNavigationMode);
            oRecord.setTargetIsHomeApp(_isHomeApp(oTargetApplication));
            oRecord.setSourceIsHomeApp(_isHomeApp(oSourceApplication));

            if (!bHomePageLoaded && (_isHomeApp(oTargetApplication) || _isFLPHome(oTargetApplication))) {
                bHomePageLoaded = true;
                oRecord.setHomepageLoading(true);
            }
            oRecord.closeRecord();
        }
    }

    /**
     * Closes the inplace navigation
     * @param {object} oEventData data for the event
     */
    function _closeInplaceNavigation (oEventData) {
        if (!oStatisticalRecord) {
            return;
        }
        const oRecordTmp = oStatisticalRecord;
        oStatisticalRecord = null;
        _getCurrentApplication().then((oTargetApplication) => {
            const oCurrentApp = getCurrentApplication();
            // correct the target application in stateful case
            if (oEventData && oEventData.technicalName) {
                oTargetApplication.id = _removeParametersIfTransaction(oEventData.technicalName);
                oTargetApplication.type = oTargetApplication.id.slice(-4) === "(TR)" ? "GUI" : "NWBC";
            }
            _setCurrentApplication(oTargetApplication);
            _closeNavigation(oCurrentApp, oTargetApplication, NAVIGATION_MODE.INPLACE, oRecordTmp);
        });
    }

    /**
     * Closes explace navigation
     */
    function _closeExplaceNavigation () {
        const oRecordTmp = oStatisticalRecord;
        oStatisticalRecord = null;
        const oCurrentApp = getCurrentApplication();
        _closeNavigation(oCurrentApp, null, NAVIGATION_MODE.EXPLACE, oRecordTmp);
    }

    /**
     * Closes navigation in the error case
     */
    function _closeNavigationWithError () {
        if (oStatisticalRecord) {
            const oCurrentApp = getCurrentApplication();
            oStatisticalRecord.setSourceApplication(oCurrentApp ? oCurrentApp.id : undefined);
            oStatisticalRecord.closeRecordWithError();
            oStatisticalRecord = null;
        }
    }

    /**
     * attaches change listener
     */
    async function _attachHashChangeListener () {
        const oShellNavigation = await sap.ushell.Container.getServiceAsync("ShellNavigation");
        oShellNavigation.hashChanger.attachEvent("hashChanged", _trackHashChangeTime);
        oShellNavigation.hashChanger.attachEvent("shellHashChanged", _trackHashChangeTime);
    }
    /**
     * detach change listener
     */
    async function _detachHashChangeListener () {
        const oShellNavigation = await sap.ushell.Container.getServiceAsync("ShellNavigation");
        oShellNavigation.hashChanger.detachEvent("hashChanged", _trackHashChangeTime);
        oShellNavigation.hashChanger.detachEvent("shellHashChanged", _trackHashChangeTime);
    }

    /**
     * enables shell analytics
     * Registers to required events
     */
    function enable () {
        if (bInitialized) {
            return;
        }
        bInitialized = true;

        const aEventMappings = [
            // Track the time of hash change
            { once: true, eventName: "ShellNavigationInitialized", handler: _attachHashChangeListener },
            // New hash
            { eventName: "trackHashChange", handler: trackNewTargetHash },
            // Error during hash resolving
            { eventName: "doHashChangeError", handler: _closeNavigationWithError },
            // Initial Rendering of Classic Homepage
            { once: true, eventName: "firstSegmentCompleteLoaded", handler: _closeInplaceNavigation },
            // Initial Rendering of AppFinder
            { once: true, eventName: "firstCatalogSegmentCompleteLoaded", handler: _closeInplaceNavigation },
            // Initial Rendering of PagesRuntime
            { once: true, eventName: "PagesRuntimeRendered", handler: _closeInplaceNavigation },
            // Initial Rendering of CustomHome
            { once: true, eventName: "CustomHomeRendered", handler: _closeInplaceNavigation },
            { eventName: "PageRendered", handler: _addPageData },
            // Open app inplace
            { eventName: "AppRendered", handler: _closeInplaceNavigation },
            // Open app explace
            { eventName: "openedAppInNewWindow", handler: _closeExplaceNavigation },
            // Close current Record
            { eventName: "CloseFesrRecord", handler: _closeInplaceNavigation }
        ];

        const aNewDoables = aEventMappings.map((oMapping) => {
            if (oMapping.once) {
                return EventHub.once(oMapping.eventName).do((...args) => {
                    Log.debug(`${sLogPrefix} Incoming event: ${oMapping.eventName}`, JSON.stringify(args[0], null, 2), sModuleName);
                    oMapping.handler(...args);
                });
            }
            return EventHub.on(oMapping.eventName).do((...args) => {
                Log.debug(`${sLogPrefix} Incoming event: ${oMapping.eventName}`, JSON.stringify(args[0], null, 2), sModuleName);
                oMapping.handler(...args);
            });
        });

        aDoables = [...aDoables, ...aNewDoables];
    }

    /**
     * Adds data about the target page to the Statistical Record
     * @param {object} oEventData The eventData
     * @private
     * @since 1.118
     */
    function _addPageData (oEventData) {
        const oRecord = _getOrCreateCurrentStatisticalRecord();

        oRecord.enhanceTargetApplicationData({
            pageId: oEventData.pageId,
            spaceId: oEventData.spaceId
        });
    }

    /**
     * disables shell analytics
     */
    function disable () {
        if (!bInitialized) {
            return;
        }

        aDoables.forEach((oDoable) => {
            oDoable.off();
        });
        aDoables = [];

        _detachHashChangeListener();
        _setCurrentApplication(null);
        aStatisticalRecords = [];
        oStatisticalRecord = null;
        bInitialized = false;
    }

    return {
        enable: enable,
        disable: disable,
        getAllRecords: getAllRecords,
        getCurrentApplication: getCurrentApplication,
        getLastClosedRecord: getLastClosedRecord,
        getNextNavigationRecords: getNextNavigationRecords
    };

}, /* bExport= */ false);
