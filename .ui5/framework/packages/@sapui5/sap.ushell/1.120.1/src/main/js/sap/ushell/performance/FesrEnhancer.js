// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @file The FESR Enhancer attaches to the Front End Sub-Records tracker by UI5.
 * UI5 tracks rendering and request activities and tries to detect what happens.
 * The ushell FESR Enhancer has then the possibility to overwrite and enhance the result with FLP specific information.
 * @private
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepExtend",
    "sap/ui/performance/trace/FESR",
    "sap/ushell/EventHub",
    "sap/ushell/performance/ShellAnalytics"
], function (
    Log,
    deepExtend,
    FESR,
    EventHub,
    ShellAnalytics
) {
    "use strict";

    const sModuleName = "FesrEnhancer";
    const sLogPrefix = "[FesrFlp]";

    const SCENARIOS = {
        HOME_INITIAL: "FLP@LOAD",
        HOME_LOADING: "FLP@DURING_LOAD",
        FINDER_INITIAL: "FLP@LOAD_FINDER",
        APP_INITIAL: "FLP@DEEP_LINK",
        NAVIGATION: "NAVIGATION",
        CUSTOM_HOME_INITIAL: "FLPCUSTOMHOME"
    };

    const START_UP_SCENARIOS = [
        SCENARIOS.HOME_INITIAL,
        SCENARIOS.FINDER_INITIAL,
        SCENARIOS.CUSTOM_HOME_INITIAL,
        SCENARIOS.APP_INITIAL
    ];

    // type of interaction, more details in "sap/ui/performance/trace/FESR.js"
    const INTERACTION_TYPE = {
        APP_START: 1,
        STEP_IN_APP: 2,
        UNKNOWN: 3
    };

    // only those fields are allowed to change on the fesr record
    const aSupportedFields = [
        "stepName",
        "appNameLong",
        "appNameShort",
        "interactionType",
        "timeToInteractive"
    ];
    const oFieldFormatting = {
        stepName: { maxLength: 20 },
        // appNameLong does not use any prefixes yet
        appNameShort: { maxLength: 20 }
    };

    const oFesrEnhancer = {
        _fnOriginalOnBeforeCreated: null,
        _lastTrackedRecord: null,

        /**
         * Initializes the enhancer. This includes attaching to sap/ui/performance/trace/FESR#onBeforeCreated and enable ShellAnalytics.
         *
         * @private
         */
        init: function () {
            if (FESR.getActive()) {
                ShellAnalytics.enable();
                this._fnOriginalOnBeforeCreated = FESR.onBeforeCreated;
                FESR.onBeforeCreated = this._onBeforeCreatedHandler.bind(this);
            }
        },

        /**
         * Resets the enhancer and detaches form sap/ui/performance/trace/FESR and ushell specific events.
         *
         * @private
         */
        reset: function () {
            FESR.onBeforeCreated = this._fnOriginalOnBeforeCreated;
            ShellAnalytics.disable();
            this._setLastTrackedRecord(null);
        },

        /**
         * Gets performance entries for a given event.
         *
         * @param {string} sEventName The name of the event.
         * @param {boolean} bExactName If true, only entries with exact name of event will be returned.
         *                             If false, all entries with events including event name will be returned.
         * @returns {PerformanceEntry[]} The performance entries.
         */
        _getPerformanceEntries: function (sEventName, bExactName) {
            if (bExactName) {
                return performance.getEntriesByName(sEventName);
            }
            return performance.getEntriesByType("mark").filter((oMark) => {
                return oMark.name.includes(sEventName);
            });
        },

        /**
         * Gets the ID of the last tracked application.
         *
         * @returns {string} ID of the application.
         */
        _getLastTrackedApplicationId: function () {
            const oCurrentApplication = ShellAnalytics.getCurrentApplication();
            if (oCurrentApplication) {
                return oCurrentApplication.id;
            }
            return null;
        },

        /**
         * Gets the last tracked record.
         *
         * @returns {object} The last tracked record.
         */
        _getLastTrackedRecord: function () {
            return this._lastTrackedRecord;
        },

        /**
         * Set the last tracked record.
         *
         * @param {object} oNewRecord New Statistical record which was tracked.
         */
        _setLastTrackedRecord: function (oNewRecord) {
            this._lastTrackedRecord = oNewRecord;
        },

        /**
         * Hook for {@link sap.ui.performance.trace.FESR#onBeforeCreated} which enhances the "oUi5FesrHandle" with FLP-specific information.
         * The handler will try to detect selected scenarios related to the FLP like open homepage or app to app navigation.
         * All other scenarios are ignored.
         *
         * @param {object} oUi5FesrHandle The header information that can be modified.
         * @param {string} oUi5FesrHandle.stepName The step name with <Trigger>_<Event>.
         * @param {string} oUi5FesrHandle.appNameLong The application name with max 70 chars.
         * @param {string} oUi5FesrHandle.appNameShort The application name with max 20 chars.
         * @param {int} oUi5FesrHandle.interactionType type of interaction
         * @param {int} oUi5FesrHandle.timeToInteractive The detected end-to-end time of the step.
         * @param {object} oUi5Interaction The corresponding interaction object, read-only.
         * @returns {object} Modified header information.
         * @private
         */
        _onBeforeCreatedHandler: function (oUi5FesrHandle, oUi5Interaction) {
            let oFesrHandle = deepExtend({}, oUi5FesrHandle); // copy first to prevent side effects

            try {
                const { scenario, relatedRecord } = this._detectScenario(oFesrHandle);
                Log.debug(`${sLogPrefix} identified scenario: ${scenario}`, null, sModuleName);

                const sApplicationId = this._getLastTrackedApplicationId();
                if (sApplicationId) {
                    // Add the latest remembered Fiori ID to every record until a different Fiori ID is set.
                    // This is needed to relate interactions tracked afterward to the started app.
                    // Restriction: Fiori IDs are also added to not related interactions like FLP button clicks or shell plugin interactions.
                    // Still, this is considered by S/4 and UI5 to be more helpful than not adding it anywhere.
                    oFesrHandle.appNameShort = sApplicationId;
                }

                let oEnhancement;
                switch (scenario) {
                    case SCENARIOS.HOME_INITIAL:
                    case SCENARIOS.CUSTOM_HOME_INITIAL:
                    case SCENARIOS.FINDER_INITIAL:
                        oEnhancement = this._enhanceInitialStart(oFesrHandle, scenario, relatedRecord);
                        break;
                    case SCENARIOS.APP_INITIAL:
                        oEnhancement = this._enhanceInitialAppStart(scenario, relatedRecord);
                        break;
                    case SCENARIOS.NAVIGATION:
                    case SCENARIOS.HOME_LOADING:
                        oEnhancement = this._enhanceNavigationRecord(scenario, relatedRecord);
                        break;
                    default:
                        // unknown scenarios cannot be enhanced
                        Log.debug(`${sLogPrefix} unknown scenario, step name: ${oFesrHandle.stepName}`, null, sModuleName);
                        return oFesrHandle;
                }

                // Consumed in SchedulingAgent
                if (START_UP_SCENARIOS.includes(scenario)) {
                    EventHub.emit("startUpFesrEnhanced", Date.now());
                }

                // Sanitize Enhancements
                oEnhancement = Object.keys(oEnhancement).reduce((oResult, sKey) => {
                    const vValue = oEnhancement[sKey];
                    // only keep supported fields and actual values
                    if (aSupportedFields.includes(sKey) && !!vValue) {
                        const oFormat = oFieldFormatting[sKey];
                        if (oFormat && oFormat.maxLength) {
                            // FLP uses prefixes we want them to be always visible
                            oResult[sKey] = vValue.substring(0, oFormat.maxLength);
                        } else {
                            oResult[sKey] = vValue;
                        }
                    }
                    return oResult;
                }, {});

                oFesrHandle = {...oFesrHandle, ...oEnhancement};
                Log.debug(`${sLogPrefix} passing enhancements:`, JSON.stringify(oEnhancement, null, 2), sModuleName);
            } catch (oError) {
                Log.error(`${sLogPrefix} Could not enhance the FESR:`, oError, sModuleName);
            }

            Log.debug(`${sLogPrefix}      => UI5: ${oFesrHandle.stepName} - ${oFesrHandle.appNameShort}`, null, sModuleName);

            return oFesrHandle;
        },

        /**
         * Determines the relevant PerformanceMark based on the related record
         * @param {sap.ushell.performance.StatisticalRecord} oRelatedRecord The related Record
         *
         * @returns {PerformanceMark|undefined} The relevant performance mark
         * @private
         * @since 1.118
         */
        _getRelevantPerformanceMark: function (oRelatedRecord) {
            if (!oRelatedRecord) {
                Log.warning(`${sLogPrefix} Could not determine performance mark`, "No Statistical Record found", sModuleName);
                return;
            }

            const aMarks = [];
            if (oRelatedRecord.getTargetIsHomeApp()) {
                aMarks.push(this._getPerformanceEntries("FLP-TTI-Homepage-Custom", true)[0]);
            } else {
                switch (oRelatedRecord.getTargetApplication()) {
                    case "FLP_HOME":
                        aMarks.push(this._getPerformanceEntries("FLP-TTI-Homepage", true)[0]);
                        break;
                    case "FLP_PAGE":
                        aMarks.push(this._getPerformanceEntries("FLP-TTI-Homepage", true)[0]);
                        aMarks.push(this._getPerformanceEntries("FLP-Pages-Service-loadPage-end", false)[0]);
                        break;
                    case "FLP_FINDER":
                        aMarks.push(this._getPerformanceEntries("FLP-TTI-AppFinder", true)[0]);
                        break;
                    default:
                }
            }

            return aMarks.filter((oMark) => {
                // no mark found
                if (!oMark) {
                    return false;
                }
                if (typeof oMark.startTime !== "number") {
                    return false;
                }
                // mark was set after Statistical Record was opened
                if (oMark.startTime > oRelatedRecord.getTimeStart()) {
                    return true;
                }
                return false;
            })[0];
        },

        /**
         * Tries to detect the current scenario based on the given information.
         *
         * @param {object} oFesrHandle The FESR header information.
         * @returns {object} Returns an object which has at least a scenario property. This property may be null if the scenario is unknown.
         * @private
         */
        _detectScenario: function (oFesrHandle) {
            if (oFesrHandle.stepName === "undetermined_startup") {
                let sDeterminedScenario;

                const oLastClosedRecord = ShellAnalytics.getLastClosedRecord();

                if (oLastClosedRecord) {
                    this._setLastTrackedRecord(oLastClosedRecord);
                } else {
                    Log.warning(`${sLogPrefix} Identified undetermined_startup but could not find a closed StatisticalRecord`, null, sModuleName);
                    return {
                        scenario: null,
                        relatedRecord: null
                    };
                }

                // case home app: Home app is detected in a special way.
                if (oLastClosedRecord.getTargetIsHomeApp()) {
                    sDeterminedScenario = SCENARIOS.CUSTOM_HOME_INITIAL;
                } else {
                    // case app finder, pages, and homepage
                    switch (oFesrHandle.appNameLong) {
                        case "sap.ushell.components.homepage":
                        case "sap.ushell.components.pages":
                            sDeterminedScenario = SCENARIOS.HOME_INITIAL;
                            break;
                        case "sap.ushell.components.appfinder":
                            sDeterminedScenario = SCENARIOS.FINDER_INITIAL;
                            break;
                        default:
                            // application direct start
                            sDeterminedScenario = SCENARIOS.APP_INITIAL;
                    }
                }

                return {
                    scenario: sDeterminedScenario,
                    relatedRecord: oLastClosedRecord
                };
            }

            const oLastTrackedRecord = this._getLastTrackedRecord();
            const aUntrackedNavigationRecords = ShellAnalytics.getNextNavigationRecords(oLastTrackedRecord);

            if (aUntrackedNavigationRecords.length) {
                // take the last record, with this we stay in sync with the user action
                const oNavigationRecord = aUntrackedNavigationRecords[aUntrackedNavigationRecords.length - 1];
                if (aUntrackedNavigationRecords.length > 1) {
                    const aUntrackedHashes = aUntrackedNavigationRecords.reduce((aHashes, oRecord, iIndex) =>{
                        if (iIndex < aUntrackedNavigationRecords.length - 1) {
                            aHashes.push(oRecord.getTargetHash());
                        }
                        return aHashes;
                    }, []);
                    Log.warning(`${sLogPrefix} skipped Records:`, JSON.stringify(aUntrackedHashes, null, 2), sModuleName);
                }

                // do not track if last tracked record equals current record
                if (oLastTrackedRecord && oNavigationRecord.isEqual(oLastTrackedRecord)) {
                    // no scenario detected
                    return {
                        scenario: null,
                        relatedRecord: null
                    };
                }

                this._setLastTrackedRecord(oNavigationRecord);
                // specify navigation scenario further when during loading
                const sScenario = oNavigationRecord.getStep() === SCENARIOS.HOME_LOADING ? SCENARIOS.HOME_LOADING : SCENARIOS.NAVIGATION;
                return {
                    scenario: sScenario,
                    relatedRecord: oNavigationRecord
                };
            }

            // no scenario detected
            return {
                scenario: null,
                relatedRecord: null
            };
        },

        /**
         * Takes the given FESR information and returns an enhancement using the given information
         * for scenario initial start.
         *
         * @param {object} oFesrHandle Result that is enhanced.
         * @param {string} sStepName Name of Step.
         * @param {sap.ushell.performance.StatisticalRecord} oRelatedRecord The related StatisticalRecord
         *
         * @returns {object} The enhancement for the initial start scenario.
         */
        _enhanceInitialStart: function (oFesrHandle, sStepName, oRelatedRecord) {
            const oResult = {};

            if (sStepName === SCENARIOS.CUSTOM_HOME_INITIAL) {
                // special case: home app
                oResult.stepName = sStepName + "@" + oFesrHandle.appNameShort;
            } else {
                // ordinary case
                oResult.stepName = sStepName;
            }

            oResult.interactionType = INTERACTION_TYPE.APP_START;
            oResult.appNameShort = oRelatedRecord.getTargetAppNameShort() || oRelatedRecord.getTargetApplication();

            const oPerformanceMark = this._getRelevantPerformanceMark(oRelatedRecord);
            if (oPerformanceMark) {
                Log.debug(`${sLogPrefix} using performance mark: ${oPerformanceMark.name}`, null, sModuleName);
                oResult.timeToInteractive = oPerformanceMark.startTime;
            } else {
                Log.warning(`${sLogPrefix} Scenario ${sStepName} detected did not found a performance mark`, null, sModuleName);
            }

            return oResult;
        },

        /**
         * Takes the given FESR information and related record and returns an enhancement
         * using the given information for scenario navigation.
         *
         * @param {string} sDetectedScenario detected scenario
         * @param {sap.ushell.performance.StatisticalRecord} oRelatedRecord Related record.
         *
         * @returns {object} The enhancement for the navigation scenario.
         */
        _enhanceNavigationRecord: function (sDetectedScenario, oRelatedRecord) {
            const oResult = {};
            if (sDetectedScenario !== "FLP@DURING_LOAD") {
                oResult.stepName = oRelatedRecord.getStep();
            }

            if (oRelatedRecord.getTargetApplicationType() === "UI5") {
                oResult.interactionType = INTERACTION_TYPE.APP_START;
            }

            oResult.appNameShort = oRelatedRecord.getTargetAppNameShort() || oRelatedRecord.getTargetApplication();

            // Adding TTI for navigating back from direct app start to home
            const oPerformanceMark = this._getRelevantPerformanceMark(oRelatedRecord);
            if (/^FLP_BACK/.test(oResult.stepName) && oPerformanceMark) {
                Log.debug(`${sLogPrefix} using performance mark: ${oPerformanceMark.name}`, null, sModuleName);
                oResult.timeToInteractive = oPerformanceMark.startTime - oRelatedRecord.getTimeStart();
            }
            return oResult;
        },

        /**
         * Takes the given FESR information and returns an enhancement using the given information
         * for scenario initial app start.
         *
         * @param {string} sStepName Name of the step.
         * @param {object} oRelatedRecord Related record.
         *
         * @returns {object} The enhancement for the navigation scenario.
         */
        _enhanceInitialAppStart: function (sStepName, oRelatedRecord) {
            const oResult = {};
            oResult.stepName = sStepName;

            if (oRelatedRecord.getTargetApplicationType() === "UI5") {
                oResult.interactionType = INTERACTION_TYPE.APP_START;
            } else {
                //Not UI5 applications handle the start flag themselves and we need to avoid duplication in the statistic
                oResult.interactionType = INTERACTION_TYPE.STEP_IN_APP;
            }
            return oResult;
        }
    };

    return oFesrEnhancer;
}, /* bExport= */ true);
