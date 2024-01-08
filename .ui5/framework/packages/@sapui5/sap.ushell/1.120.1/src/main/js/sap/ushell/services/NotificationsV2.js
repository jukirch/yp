// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/Log",
    "sap/ushell/utils/Deferred",
    "sap/ui/core/Core",
    "sap/ui/core/Configuration",
    "sap/ui/core/ws/SapPcpWebSocket",
    "sap/ui/model/json/JSONModel",
    "sap/ui/thirdparty/datajs",
    "sap/ushell/utils"
], function (
    Log,
    Deferred,
    Core,
    Configuration,
    SapPcpWebSocket,
    JSONModel,
    OData,
    ushellUtils
) {
    "use strict";

    /*eslint consistent-this: ["error", "oNotificationsService"]*/

    const S_DEFAULT_WEBSOCKET_URL = "/sap/bc/apc/iwngw/notification_push_apc";
    const I_DEFAULT_POLLING_INTERVAL = 60; // Seconds

    /**
     * @alias sap.ushell.services.NotificationsV2
     * @class
     * @classdesc UShell service for fetching user notification data from the Notification center/service<br>
     * and exposing them to the Unified Shell and Fiori applications UI controls.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("NotificationsV2")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * In order to get user notifications, Unified Shell notification service issues OData requests<br>
     * to the service defined by the configuration property <code>serviceUrl</code>,<br>
     * for example: "/sap/opu/odata4/iwngw/notification/default/iwngw/notification_srv/0001"<br>.
     *
     * Unified Shell Notification service has several working modes, depending on the environment and the available resources:<br>
     *   PackagedApp mode: Fiori launchpad runs in the context of PackagedApp<br>
     *   FioriClient mode: Fiori launchpad runs in the context of FioriLaunchpad<br>
     *   WebSocket mode: Fiori launchpad runs in a browser, and WebSocket connection to the notifications provider is available<br>
     *   Polling mode: Fiori launchpad in runs in a browser, and WebSocket connection to the notifications provider is not available<br>
     *
     * The notification service exposes an API that includes:
     *   - Service enabling and initialization<br>
     *   - Registration of callback functions (by Shell/FLP controls) that will be called for every data update<br>.
     *   - Retrieval of notification data (e.g. notifications, number of unseen notifications)
     *   - Execution of a notification actions
     *   - Marking user notifications as seen
     *
     * @param {object} oContainerInterface The interface provided by the container
     * @param {object} sParameters Not used in this service
     * @param {object} oServiceConfiguration configuration
     *
     * @hideconstructor
     *
     * @since 1.119
     * @public
     */
    function Notifications (oContainerInterface, sParameters, oServiceConfiguration) {
        const oModel = new JSONModel();
        const oServiceConfig = oServiceConfiguration && oServiceConfiguration.config;
        const aRequestURIs = {
            getNotifications: {},
            getNotificationsByType: {},
            getNotificationsInGroup: {},
            getBadgeNumber: {},
            resetBadgeNumber: {},
            getNotificationTypesSettings: {},
            getNotificationsGroupHeaders: {},
            getMobileSupportSettings: {},
            getEmailSupportSettings: {},
            getWebSocketValidity: {},
            getNotificationCount: {}
        };
        const aUpdateNotificationsCallbacks = [];
        const aUpdateNotificationsCountCallbacks = [];
        const tWebSocketRecoveryPeriod = 5000;
        const tFioriClientInitializationPeriod = 6000;
        const oOperationEnum = {
            NOTIFICATIONS: 0,
            NOTIFICATIONS_BY_TYPE: 1,
            GET_BADGE_NUMBER: 2,
            RESET_BADGE_NUMBER: 3,
            GET_SETTINGS: 4,
            GET_MOBILE_SUPPORT_SETTINGS: 5,
            NOTIFICATIONS_GROUP_HEADERS: 6,
            NOTIFICATIONS_IN_GROUP: 7,
            GET_NOTIFICATIONS_COUNT: 8,
            VALIDATE_WEBSOCKET_CHANNEL: 9,
            GET_EMAIL_SUPPORT_SETTINGS: 10,
            NOTIFICATIONS_BY_DATE_DESCENDING: "notificationsByDateDescending",
            NOTIFICATIONS_BY_DATE_ASCENDING: "notificationsByDateAscending",
            NOTIFICATIONS_BY_PRIORITY_DESCENDING: "notificationsByPriorityDescending",
            NOTIFICATIONS_BY_TYPE_DESCENDING: "notificationsByTypeDescending"
        };
        const oModesEnum = {
            PACKAGED_APP: 0,
            FIORI_CLIENT: 1,
            WEB_SOCKET: 2,
            POLLING: 3
        };
        const oUserFlagsReadFromPersonalizationDeferred = new Deferred();
        const oNotificationSettingsAvailabilityDeferred = new Deferred();
        const oUserFlagsReadFromPersonalizationPromise = oUserFlagsReadFromPersonalizationDeferred.promise();
        const oDummyItems = {};
        const iInitialBufferSize = 10;

        let tInitializationTimestamp = new Date();
        let oWebSocket;
        let initialReadTimer;
        let webSocketRecoveryTimer;
        let pollingTimer;
        let bIntentBasedConsumption = false;
        let aConsumedIntents = [];
        let bInitialized = false;
        let bOnServiceStop = false;
        let bEnabled = true;
        let sHeaderXcsrfToken;
        let sDataServiceVersion;
        let bWebSocketRecoveryAttempted = false;
        let oCurrentMode;
        let bFirstDataLoaded = false;
        let bHighPriorityBannerEnabled = true;
        let bNotificationSettingsMobileSupport;
        let bNotificationSettingsEmailSupport;
        let bUseDummyItems = false;
        let bInvalidCsrfTokenRecoveryMode = false;
        let bCsrfDataSet = false;
        let aDismissNotifications = [];

        // *************************************************************************************************
        // ************************************* Service API - Begin ***************************************

        /**
         * Indicates whether notification service is enabled.<br>
         * Enabling is based on the <code>enable</code> service configuration flag.<br>
         * The service configuration must also include serviceUrl attribute.<br>
         *
         * @returns {boolean} A boolean value indicating whether the notifications service is enabled
         * @public
         * @alias sap.ushell.services.NotificationsV2#isEnabled
         */
        this.isEnabled = function () {
            if (!oServiceConfig.enabled || !oServiceConfig.serviceUrl) {
                bEnabled = false;
                if (oServiceConfig.enabled && !oServiceConfig.serviceUrl) {
                    Log.warning("No serviceUrl was found in the service configuration");
                }
            } else {
                bEnabled = true;
            }
            return bEnabled;
        };

        /**
         * Initializes the notification service
         *
         * Initialization is performed only if the following two conditions are fulfilled:<br>
         *   1. Notification service is enabled<br>
         *   2. Notification service hasn't been initialized yet<br>
         *
         * The main initialization functionality is determining and setting the mode in which notifications are consumed.<br>
         * The possible modes are:<br>
         *   PACKAGED_APP - Notifications are fetched when a callback is called by PackagedApp environment<br>
         *   FIORI_CLIENT - Notifications are fetched when a callback is called by FioriClient environment<br>
         *   WEB_SOCKET - Notifications are fetched on WebSocket "ping"<br>
         *   POLLING - Notifications are fetched using periodic polling mechanism<br>
         *
         * @public
         * @alias sap.ushell.services.NotificationsV2#init
         */
        this.init = function () {
            if (!bInitialized && this.isEnabled()) {
                Core.getEventBus().subscribe("launchpad", "sessionTimeout", this.destroy, this);
                this.lastNotificationDate = new Date();
                this._setWorkingMode();
                bInitialized = true;
                this.bUpdateDependencyInitiatorExists = false;
                this._userSettingInitialization();
            }

            // Listen for requests to enable or disable the connection to the server
            Core.getEventBus().subscribe("launchpad", "setConnectionToServer", this._onSetConnectionToServer, this);
        };

        /**
         * This event handler enables or disables the connection to the server
         *
         * @param {string} channelID Channel ID of the event
         * @param {string} eventID Event ID of the event
         * @param {{active: boolean}} data Indicates if the connection is to be enabled or disabled
         *
         * @private
         * @alias sap.ushell.services.NotificationsV2#_onSetConnectionToServer
         */
        this._onSetConnectionToServer = function (channelID, eventID, data) {
            if (data.active) {
                this._resumeConnection();
            } else {
                this._closeConnection();
            }
        };

        /**
         * Returns the number of unseen notifications<br>
         * e.g. Notifications that the user hasn't seen yet.
         *
         * @returns {Promise} Promise resolves with the number of unread notifications of the user
         * @public
         * @alias sap.ushell.services.NotificationsV2#getUnseenNotificationsCount
         */
        this.getUnseenNotificationsCount = function () {
            return Promise.resolve(oModel.getProperty("/UnseenCount"));
        };
        /**
         * Returns the number of  notifications<br>
         * e.g. Notifications for user.
         *
         * @returns {int} Returns the number of notifications of the user
         * @public
         * @alias sap.ushell.services.NotificationsV2#getNotificationsCount
         */
        this.getNotificationsCount = function () {
            return oModel.getProperty("/NotificationsCount") || "0";
        };

        this._createRequest = function (sUri) {
            const oHeader = {
                "Accept-Language": Configuration.getLanguageTag(),
                "X-CSRF-Token": this._getHeaderXcsrfToken() || "fetch" // fetch if not token was obtained previously
            };
            return {
                requestUri: sUri,
                headers: oHeader
            };
        };

        /**
         * Returns the notifications of the user sorted by type include the group headers and the notifications
         *
         * @returns {Promise} Promise for all notification items
         * @public
         * @alias sap.ushell.services.NotificationsV2#getNotificationsByTypeWithGroupHeaders
         */
        this.getNotificationsByTypeWithGroupHeaders = function () {
            const oRequest = this._createRequest(this._getRequestURI(oOperationEnum.NOTIFICATIONS_BY_TYPE));

            return new Promise((resolve, reject) => {
                OData.request(oRequest, resolve, (oMessage) => {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        resolve(oMessage.response.body);
                    } else {
                        Log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                        reject(oMessage);
                    }
                });
            });
        };

        /**
         * Returns the group headers of the user notifications
         *
         * @returns {Promise} Promise for all group headers
         * @public
         * @alias sap.ushell.services.NotificationsV2#getNotificationsGroupHeaders
         */
        this.getNotificationsGroupHeaders = function () {
            const oRequest = this._createRequest(this._getRequestURI(oOperationEnum.NOTIFICATIONS_GROUP_HEADERS));

            return new Promise((resolve, reject) => {
                OData.request(oRequest, resolve, (oMessage) => {
                    if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                        resolve(oMessage.response.body);
                    } else {
                        Log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                        reject();
                    }
                });
            });
        };

        // Private. The function is used in Notifications.controller.
        this.getNotificationsBufferInGroup = function (sGroup, iSkip, iTop) {
            if (bUseDummyItems === true) {
                const aResponse = oDummyItems[oOperationEnum.NOTIFICATIONS_IN_GROUP].slice(iSkip, iSkip + iTop);
                const oResponse = JSON.stringify({
                    "@odata.context": "$metadata#Notifications",
                    value: aResponse
                });

                return new Promise((resolve) => {
                    window.setTimeout(() => resolve(oResponse), 1000);
                });
            }

            const oNotificationsService = this;
            const oArgs = {
                group: sGroup,
                skip: iSkip,
                top: iTop
            };
            const oRequest = this._createRequest(this._getRequestURI(oOperationEnum.NOTIFICATIONS_IN_GROUP, oArgs));

            return new Promise((resolve, reject) => {
                OData.request(oRequest,
                    (oResult) => {
                        oNotificationsService._updateCSRF(oResult.response);
                        resolve(oResult.value);
                    },
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            oNotificationsService._updateCSRF(oMessage.response);
                            resolve(JSON.parse(oMessage.response.body).value);
                        } else {
                            Log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject();
                        }
                    });
            });
        };

        // Private. The function is used in Notifications.controller.
        this.getNotificationsBufferBySortingType = function (sSortingType, iSkip, iTop) {
            if (bUseDummyItems === true) {
                const oResponse = JSON.stringify({
                    "@odata.context": "$metadata#Notifications",
                    value: oDummyItems[sSortingType].slice(iSkip, iSkip + iTop)
                });
                return new Promise((resolve) => window.setTimeout(() => resolve(oResponse), 1000));
            }

            const oNotificationsService = this;
            const oArgs = {
                skip: iSkip,
                top: iTop
            };
            const oRequestObject = this._createRequest(this._getRequestURI(sSortingType, oArgs));

            return new Promise((resolve, reject) => {
                OData.request(oRequestObject,
                    (oResult) => {
                        oNotificationsService._updateCSRF(oResult.response);
                        resolve(oResult.value);
                    },
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            oNotificationsService._updateCSRF(oMessage.response);
                            resolve(JSON.parse(oMessage.response.body).value);
                        } else {
                            Log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject();
                        }
                    });
            });
        };

        /**
         * Returns the 10 most recent notifications of the user
         *
         * @returns {Promise} Promise object that on success - returns the 10 most recent user notification items
         * @private
         * @alias sap.ushell.services.NotificationsV2#getNotifications
         */
        this.getNotifications = function () {
            if ((oCurrentMode === oModesEnum.FIORI_CLIENT) || (oCurrentMode === oModesEnum.PACKAGED_APP)) {
                // In Fiori Client mode, notification service fetches notification on initialization,
                // and after that - notification data is updated only by pushed notifications.
                // hence, there's no way that Notification service is updated regarding other changes
                // for example: if the user approved/rejected a notification via other device.
                // In order to solve this - we bring updated data when getNotifications is called from Fiori Client
                return this._readNotificationsData(false).then(() => oModel.getProperty("/Notifications"));
            }
            // In case of offline testing (when OData calls fail):
            // Comment the following line and uncomment the next one
            return Promise.resolve(oModel.getProperty("/Notifications"));
            // return Promise.resolve(this._getDummyJSON());
        };

        /**
         * Launches a notification action oData call.<br>
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {string} sNotificationGroupId The ID of the notification header/group whose action is being executed
         * @param {string} sActionId The ID of the action that is being executed
         * @returns {Promise} Promise object that on success resolves to undefined or it is rejected with failed notifications
         * @public
         * @alias sap.ushell.services.NotificationsV2#executeBulkAction
         */
        this.executeBulkAction = function (sNotificationGroupId, sActionId) {
            return new Promise((resolve, reject) => {
                this.sendBulkAction(sNotificationGroupId, sActionId).then((res) => {
                    const aSucceededNotifications = [];
                    const aFailedNotifications = [];
                    res.forEach((oNotification) => {
                        const sNotificationId = oNotification.NotificationId;
                        if (oNotification.Success) {
                            aSucceededNotifications.push(sNotificationId);
                        } else {
                            aFailedNotifications.push(sNotificationId);
                        }
                    });
                    const oResult = {
                        succededNotifications: aSucceededNotifications,
                        failedNotifications: aFailedNotifications
                    };
                    if (aFailedNotifications.length) {
                        reject(oResult);
                    } else {
                        resolve(oResult);
                    }
                });
            });
        };

        this.dismissBulkNotifications = function (sNotificationGroupId) {
            return this.sendBulkDismiss(sNotificationGroupId);
        };

        this.executeAction = function (sNotificationId, sActionId) {
            const oNotificationsService = this;
            const sActionUrl = oServiceConfig.serviceUrl + "/ExecuteAction";
            const oRequestBody = { NotificationId: sNotificationId, ActionId: sActionId };
            const oRequestObject = {
                requestUri: sActionUrl,
                method: "POST",
                data: oRequestBody,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };
            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    (oResult) => {
                        const responseAck = { isSucessfull: true, message: "" };
                        if (oResult && oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                            const responseAckJson = JSON.parse(oResult.response.body);
                            responseAck.isSucessfull = responseAckJson.Success;
                            responseAck.message = responseAckJson.MessageText;
                        }
                        resolve(responseAck);
                    },
                    (oMessage) => {
                        const responseAck = { isSucessfull: false, message: "" };

                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            const responseAckJson = JSON.parse(oMessage.response.body);
                            responseAck.isSucessfull = responseAckJson.Success;
                            responseAck.message = responseAckJson.MessageText;
                            resolve(responseAck);
                        } else if (oNotificationsService._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                            oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.executeAction, [sNotificationId, sActionId]);
                        } else {
                            Log.error("Notification service - oData executeAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    });
            });
        };

        this.sendBulkAction = function (sParentId, sActionId) {
            const oNotificationsService = this;
            const sActionUrl = oServiceConfig.serviceUrl + "/BulkActionByHeader";
            const oRequestBody = { ParentId: sParentId, ActionId: sActionId };
            const oRequestObject = {
                requestUri: sActionUrl,
                method: "POST",
                data: oRequestBody,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    (oResult) => {
                        let responseAck;
                        if (oResult && oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                            let responseAckJson = JSON.parse(oResult.response.body);
                            responseAck = responseAckJson.value;
                        }
                        resolve(responseAck);
                    },
                    (oResult) => {
                        if (oResult.response && oResult.response.statusCode === 200 && oResult.response.body) {
                            let responseAckJson = JSON.parse(oResult.response.body);
                            let responseAck = responseAckJson.value;
                            resolve(responseAck);
                        } else if (oNotificationsService._csrfTokenInvalid(oResult) && (bInvalidCsrfTokenRecoveryMode === false)) {
                            oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.sendBulkAction, [sParentId, sActionId]);
                        } else {
                            Log.error("Notification service - oData executeBulkAction failed: ", oResult.message, "sap.ushell.services.NotificationsV2");
                            reject();
                        }
                    });
            });
        };

        this.sendBulkDismiss = function (sParentId) {
            const oNotificationsService = this;
            const sActionUrl = oServiceConfig.serviceUrl + "/DismissAll";
            const oRequestBody = { ParentId: sParentId };
            const oRequestObject = {
                requestUri: sActionUrl,
                method: "POST",
                data: oRequestBody,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            return new Promise((resolve, reject) => {
                OData.request(oRequestObject, () => resolve(), (oResult) => {
                    if (oResult.response && oResult.response.statusCode === 200) {
                        resolve();
                    } else if (oNotificationsService._csrfTokenInvalid(oResult) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.sendBulkDismiss, [sParentId]);
                    } else {
                        const oMessage = oResult ? oResult.message : "";
                        Log.error("Notification service - oData executeBulkAction failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                        reject();
                    }
                });
            });
        };

        /**
         * Launches mark as read notification call.<br>
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {string} sNotificationId The ID of the notification whose action is being executed
         * @returns {Promise<undefined>} Promise object that on success resolves to undefined or it is rejected with a message object
         * @public
         * @alias sap.ushell.services.NotificationsV2#markRead
         */
        this.markRead = function (sNotificationId) {
            const oNotificationsService = this;
            const sActionUrl = oServiceConfig.serviceUrl + "/MarkRead";
            const oRequestBody = { NotificationId: sNotificationId };
            const oRequestObject = {
                requestUri: sActionUrl,
                method: "POST",
                data: oRequestBody,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            return new Promise((resolve, reject) => {
                OData.request(oRequestObject, () => resolve(), (oMessage) => {
                    if (oNotificationsService._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                        oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.markRead, [sNotificationId]);
                    } else {
                        Log.error("Notification service - oData reset badge number failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                        reject(oMessage);
                    }
                });
            });
        };

        /**
         * Launches dismiss notification call.<br>
         *
         * @param {string} sNotificationId The ID of the notification whose action is being executed
         * @returns {Promise<undefined>} Promise object that on success resolves to undefined or it is rejected with a message object
         * @public
         * @alias sap.ushell.services.NotificationsV2#dismissNotification
         */
        this.dismissNotification = function (sNotificationId) {
            const sActionUrl = oServiceConfig.serviceUrl + "/Dismiss";
            const oNotificationsService = this;
            const oRequestBody = { NotificationId: sNotificationId };
            const oRequestObject = {
                requestUri: sActionUrl,
                method: "POST",
                data: oRequestBody,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    () => {
                        oNotificationsService._addDismissNotifications(sNotificationId);
                        resolve();
                    },
                    (oMessage) => {
                        if (oNotificationsService._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                            oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.dismissNotification, [sNotificationId]);
                        } else {
                            Log.error("Notification service - oData dismiss notification failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    });
            });
        };

        /**
         * Gets a callback function that will be called when updated notifications data is available.
         *
         * @param {function} callback The callback function that is registered and called on data update.
         * @public
         * @alias sap.ushell.services.NotificationsV2#registerNotificationsUpdateCallback
         */
        this.registerNotificationsUpdateCallback = function (callback) {
            aUpdateNotificationsCallbacks.push(callback);
        };

        /**
         * Gets a callback function that will be called when updated unseen notifications count is available.
         *
         * @param {function} callback The callback function that is registered and called on data update.
         * @public
         * @alias sap.ushell.services.NotificationsV2#registerNotificationCountUpdateCallback
         */
        this.registerNotificationCountUpdateCallback = function (callback) {
            aUpdateNotificationsCountCallbacks.push(callback);
        };

        /**
         * @returns {boolean} boolean value whether first request was already performed and data was returned.<br>
         * @public
         * @alias sap.ushell.services.NotificationsV2#isFirstDataLoaded
         */
        this.isFirstDataLoaded = function () {
            return bFirstDataLoaded;
        };

        /**
         * @returns {Promise} promise with the user settings flags
         * @private
         */
        this.getUserSettingsFlags = function () {
            return oUserFlagsReadFromPersonalizationPromise.then(() => {
                return { highPriorityBannerEnabled: bHighPriorityBannerEnabled };
            });
        };

        this.setUserSettingsFlags = function (oFlags) {
            bHighPriorityBannerEnabled = oFlags.highPriorityBannerEnabled;
            this._writeUserSettingsFlagsToPersonalization(oFlags);
        };

        /**
         * @returns {boolean} value indicating whether the Push to Mobile capability is supported by the Notification channel
         * @private
         */
        this._getNotificationSettingsMobileSupport = function () {
            return bNotificationSettingsMobileSupport;
        };

        /**
         * @returns {Array} dismissed notifications
         * @private
         */
        this._getDismissNotifications = function () {
            return aDismissNotifications;
        };

        this.filterDismisssedItems = function (aRecentNotificationsArray, aNotifications) {
            return aRecentNotificationsArray.filter((oRecentItem) => {
                return !aNotifications.some((sDismissItem) => sDismissItem === oRecentItem.originalItemId);
            });
        };

        /**
         * adds an item to the array of dissmissed notifications
         * @param {string} sId Notification ID.
         * @private
         */
        this._addDismissNotifications = function (sId) {
            if (aDismissNotifications.indexOf(sId) === -1) {
                aDismissNotifications.push(sId);
            }
        };

        /**
         * initialize array of dissmissed notifications
         * @private
         */
        this._initializeDismissNotifications = function () {
            aDismissNotifications = [];
        };

        /**
         * @returns {boolean} value indicating whether the Push to Mobile capability is supported by the Notification channel
         * @private
         */
        this._getNotificationSettingsEmailSupport = function () {
            return bNotificationSettingsEmailSupport;
        };

        this.destroy = function () {
            bOnServiceStop = true;

            // Clear timers
            if (initialReadTimer) {
                clearTimeout(initialReadTimer);
            } else if (webSocketRecoveryTimer) {
                clearTimeout(webSocketRecoveryTimer);
            } else if (pollingTimer) {
                clearTimeout(pollingTimer);
            }

            // Close web socket
            if ((oCurrentMode === oModesEnum.WEB_SOCKET) && oWebSocket) {
                oWebSocket.close();
            }

            // Clear event subscriptions
            Core.getEventBus().unsubscribe("launchpad", "sessionTimeout", this.destroy, this);
            Core.getEventBus().unsubscribe("launchpad", "setConnectionToServer",
                this._onSetConnectionToServer, this);
        };

        // ************************************** Service API - End ****************************************
        // *************************************************************************************************

        // *************************************************************************************************
        // ********************************* oData functionality - Begin ***********************************

        /**
         * Fetching the number of notifications that the user hasn't seen yet <br>
         * and announcing the relevant consumers by calling all registered callback functions.<br>
         *
         * This function is similar to _readNotificationsData.
         * In the future the two functions will be sent together in a single batch request, when batch is supported.
         *
         * @returns {Promise} promise
         * @private
         */
        this._readUnseenNotificationsCount = function () {
            const oNotificationsService = this;
            const oRequestObject = this._createRequest(this._getRequestURI(oOperationEnum.GET_BADGE_NUMBER));

            return new Promise((resolve, reject) => {
                OData.read(
                    oRequestObject,
                    (oResult, oResponseData) => {
                        oModel.setProperty("/UnseenCount", oResponseData.data.GetBadgeNumber.Number);
                        oNotificationsService._setNativeIconBadge(oResponseData.data.GetBadgeNumber.Number);
                        resolve(oResponseData.data.GetBadgeNumber.Number);
                    },
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            const oReturnedObject = JSON.parse(oMessage.response.body);
                            oModel.setProperty("/UnseenCount", oReturnedObject.value);
                            oNotificationsService._setNativeIconBadge(oReturnedObject.value);
                            resolve(oReturnedObject.value);
                        } else {
                            Log.error("Notification service - oData read unseen notifications count failed: ", oMessage.message, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    }
                );
            });
        };

        /**
         * Fetching the number of notifications for user<br>
         * @returns {object} promise with notifications count
         */
        this.readNotificationsCount = function () {
            const oRequestObject = this._createRequest(this._getRequestURI(oOperationEnum.GET_NOTIFICATIONS_COUNT));
            return new Promise((resolve, reject) => {
                OData.read(
                    oRequestObject,
                    (oResult, oResponseData) => resolve(oResponseData.data),
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            const oReturnedObject = JSON.parse(oMessage.response.body);
                            resolve(oReturnedObject.value);
                        } else {
                            Log.error("Notification service - oData read notifications count failed: ", oMessage.message, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    }
                );
            });
        };

        /**
         * @returns {Promise} Returns promise object that is resolved if Notification settings data is available
         * @private
         */
        this._getNotificationSettingsAvailability = function () {
            return oNotificationSettingsAvailabilityDeferred.promise();
        };

        /**
         * Mark all notifications as seen.<br>
         * the main use-case is when the user navigated to the notification center and sees all the pending notifications.
         * @returns {Promise} Promise taht resolves when operation is finished
         *
         * @public
         * @alias sap.ushell.services.NotificationsV2#notificationsSeen
         */
        this.notificationsSeen = function () {
            const oNotificationsService = this;
            const oRequestObject = {
                requestUri: this._getRequestURI(oOperationEnum.RESET_BADGE_NUMBER),
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            if (this._isFioriClientMode() === true || this._isPackagedMode() === true) {
                this._setNativeIconBadge(0);
            }

            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    resolve,
                    function (oMessage) {
                        if (oNotificationsService._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                            oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.notificationsSeen);
                        } else {
                            Log.error("Notification service - oData reset badge number failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    }
                );
            });
        };

        /**
         * Basic notifications data read flow, occurs either on service initialization or on web-socket/polling update event.
         * Includes two read operations:
         *   - Read UnseenNotificationsCount and update consumers
         *   - Read several (i.e. iInitialBufferSize) notification items
         *
         * The two returned promise objects are pushed into an array, and after resolved, the following steps are performed:
         *   - Notifications (unseen) count consumers are updated
         *   - Service model is updated with the read notification objects
         *   - Notifications update consumers are updated
         *
         * @param {boolean} bUpdateConsumers value indicating whether the consumers should be updated
         * @returns {Promise} promise indicating success of both read actions
         * @private
         */
        this._readNotificationsData = function (bUpdateConsumers) {
            const oNotificationsService = this;

            this.readNotificationsCount().then((oResponseData) => oModel.setProperty("/NotificationsCount", oResponseData));

            const oReadUnseenCountPromise = this._readUnseenNotificationsCount(bUpdateConsumers).then(() => {
                if (bUpdateConsumers === true) {
                    oNotificationsService._updateNotificationsCountConsumers();
                }
            });

            const oReadNotificationsPromise = this.getNotificationsBufferBySortingType(oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING, 0, iInitialBufferSize)
                .then((oResponseData) => {
                    // Measure notification
                    oModel.setProperty("/Notifications", oResponseData);
                    oNotificationsService._notificationAlert(oResponseData);
                    if (bUpdateConsumers === true) {
                        oNotificationsService._updateNotificationsConsumers();
                    }
                });

            return Promise.all([oReadUnseenCountPromise, oReadNotificationsPromise]);
        };

        this._getHeaderXcsrfToken = function () {
            return sHeaderXcsrfToken;
        };

        this._getDataServiceVersion = function () {
            return sDataServiceVersion;
        };

        /**
         * Returns the appropriate URI that should be used in an OData request according to the nature of the request and according to filtering that might be required.
         * The object aRequestURIs is filled with the basic and/or byIntents-filter URI, and is used for maintaining the URIs throughout the session.
         *
         * @param {object} oRequiredURI value form the enumeration oOperationEnum, representing the relevant request
         * @param {object} oArgs additional arguments
         * @returns {string} The URI that should be user in the OData.read call
         */
        this._getRequestURI = function (oRequiredURI, oArgs) {
            const sEncodedConsumedIntents = encodeURI(this._getConsumedIntents(oRequiredURI));
            let sReturnedURI;

            switch (oRequiredURI) {
                // Get notifications
                case oOperationEnum.NOTIFICATIONS:
                    if (aRequestURIs.getNotifications.basic === undefined) {
                        aRequestURIs.getNotifications.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$filter=IsGroupHeader%20eq%20false";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotifications.byIntents === undefined) {
                            aRequestURIs.getNotifications.byIntents = aRequestURIs.getNotifications.basic.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotifications.byIntents;
                    }
                    return aRequestURIs.getNotifications.basic;
                // Get notifications, grouped by type
                case oOperationEnum.NOTIFICATIONS_BY_TYPE:
                    if (aRequestURIs.getNotificationsByType.basic === undefined) {
                        aRequestURIs.getNotificationsByType.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotificationsByType.byIntents === undefined) {
                            aRequestURIs.getNotificationsByType.byIntents = aRequestURIs.getNotificationsByType.basic.concat("&$filter=intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotificationsByType.byIntents;
                    }
                    return aRequestURIs.getNotificationsByType.basic;

                // Get notifications group Headers
                case oOperationEnum.NOTIFICATIONS_GROUP_HEADERS:
                    if (aRequestURIs.getNotificationsGroupHeaders.basic === undefined) {
                        aRequestURIs.getNotificationsGroupHeaders.basic = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$filter=IsGroupHeader%20eq%20true";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getNotificationsGroupHeaders.byIntents === undefined) {
                            aRequestURIs.getNotificationsGroupHeaders.byIntents = aRequestURIs.getNotificationsGroupHeaders.basic.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                        }
                        return aRequestURIs.getNotificationsGroupHeaders.byIntents;
                    }
                    return aRequestURIs.getNotificationsGroupHeaders.basic;

                // Get notifications in group
                case oOperationEnum.NOTIFICATIONS_IN_GROUP:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt desc&$filter=IsGroupHeader eq false and ParentId eq "
                        + oArgs.group + "&$skip=" + oArgs.skip + "&$top=" + oArgs.top;

                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get badge number
                case oOperationEnum.GET_BADGE_NUMBER:
                    if (aRequestURIs.getBadgeNumber.basic === undefined) {
                        aRequestURIs.getBadgeNumber.basic = oServiceConfig.serviceUrl + "/GetBadgeNumber()";
                    }
                    if (this._isIntentBasedConsumption()) {
                        if (aRequestURIs.getBadgeNumber.byIntents === undefined) {
                            aRequestURIs.getBadgeNumber.byIntents = oServiceConfig.serviceUrl + "/GetBadgeCountByIntent(" + sEncodedConsumedIntents + ")";
                        }
                        return aRequestURIs.getBadgeNumber.byIntents;
                    }
                    return aRequestURIs.getBadgeNumber.basic;

                // Get Notification Count
                case oOperationEnum.GET_NOTIFICATIONS_COUNT:
                    if (aRequestURIs.getNotificationCount.basic === undefined) {
                        aRequestURIs.getNotificationCount.basic = oServiceConfig.serviceUrl + "/Notifications/$count";
                    }
                    return aRequestURIs.getNotificationCount.basic;

                // Reset badge number (i.e. mark all notifications as "seen")
                case oOperationEnum.RESET_BADGE_NUMBER:
                    if (aRequestURIs.resetBadgeNumber.basic === undefined) {
                        aRequestURIs.resetBadgeNumber.basic = oServiceConfig.serviceUrl + "/ResetBadgeNumber";
                    }
                    return aRequestURIs.resetBadgeNumber.basic;

                // Get user settings
                case oOperationEnum.GET_SETTINGS:
                    if (aRequestURIs.getNotificationTypesSettings.basic === undefined) {
                        aRequestURIs.getNotificationTypesSettings.basic = oServiceConfig.serviceUrl + "/NotificationTypePersonalizationSet";
                    }
                    return aRequestURIs.getNotificationTypesSettings.basic;

                case oOperationEnum.GET_MOBILE_SUPPORT_SETTINGS:
                    if (aRequestURIs.getMobileSupportSettings.basic === undefined) {
                        aRequestURIs.getMobileSupportSettings.basic = oServiceConfig.serviceUrl + "/Channels(ChannelId='SAP_SMP')";
                    }
                    return aRequestURIs.getMobileSupportSettings.basic;

                case oOperationEnum.GET_EMAIL_SUPPORT_SETTINGS:
                    if (aRequestURIs.getEmailSupportSettings.basic === undefined) {
                        aRequestURIs.getEmailSupportSettings.basic = oServiceConfig.serviceUrl + "/Channels(ChannelId='SAP_EMAIL')";
                    }
                    return aRequestURIs.getEmailSupportSettings.basic;

                case oOperationEnum.VALIDATE_WEBSOCKET_CHANNEL:
                    if (aRequestURIs.getWebSocketValidity.basic === undefined) {
                        aRequestURIs.getWebSocketValidity.basic = oServiceConfig.serviceUrl + "/Channels('SAP_WEBSOCKET')";
                    }
                    return aRequestURIs.getWebSocketValidity.basic;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by date in descending order
                case oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt%20desc&$filter=IsGroupHeader%20eq%20false&$skip="
                        + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by date in ascending order
                case oOperationEnum.NOTIFICATIONS_BY_DATE_ASCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=CreatedAt%20asc&$filter=IsGroupHeader%20eq%20false&$skip="
                        + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                // Get a buffer of notifications (using $skip, $top and $orderby options) sorted by priority in ascending order
                case oOperationEnum.NOTIFICATIONS_BY_PRIORITY_DESCENDING:
                    sReturnedURI = oServiceConfig.serviceUrl + "/Notifications?$expand=Actions,NavigationTargetParams&$orderby=Priority%20desc&$filter=IsGroupHeader%20eq%20false&$skip="
                        + oArgs.skip + "&$top=" + oArgs.top;
                    if (this._isIntentBasedConsumption() === true) {
                        sReturnedURI = sReturnedURI.concat("&intents%20eq%20" + sEncodedConsumedIntents);
                    }
                    break;

                default:
                    sReturnedURI = "";
            }
            return sReturnedURI;
        };

        /**
         * @returns {Promise} Promise object that is resolved with the settings from the sever
         * @private
         */
        this.readSettings = function () {
            const oRequestObject = this._createRequest(this._getRequestURI(oOperationEnum.GET_SETTINGS));

            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    (oResult) => resolve(oResult.results),
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            resolve(oMessage.response.body);
                        } else {
                            Log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    });
            });
        };

        /**
         * Verifying whether the "push notifications to mobile" feature is supported.
         *
         * @returns {object} A Deferred.promise object that is always resolved even if the request failed.<br>
         *   In case of failure - the response property successStatus gets the value <code>false</code>
         */
        this._readMobileSettingsFromServer = function () {
            return this._readChannelSettingsFromServer(oOperationEnum.GET_MOBILE_SUPPORT_SETTINGS);
        };

        /**
         * Verifying whether the "push notifications to mobile" feature is supported.
         *
         * @returns {Promise} promise is always resolved even if the request failed.<br>
         *   In case of failure - the response property successStatus gets the value <code>false</code>
         */
        this._readEmailSettingsFromServer = function () {
            return this._readChannelSettingsFromServer(oOperationEnum.GET_EMAIL_SUPPORT_SETTINGS);
        };

        this._readChannelSettingsFromServer = function (operation) {
            const sRequestUrl = this._getRequestURI(operation);
            const oRequestObject = this._createRequest(sRequestUrl);
            let oResponseObject;
            let sUpdatedResponseString;

            return new Promise((resolve) => {
                OData.request(
                    oRequestObject,
                    (oResult) => {
                        if (typeof (oResult.results) === "string") {
                            oResponseObject = JSON.parse(oResult.results);
                            oResponseObject.successStatus = true;
                            sUpdatedResponseString = JSON.stringify(oResponseObject);
                            resolve(sUpdatedResponseString);
                        } else {
                            oResult.results.successStatus = true;
                            resolve(oResult.results);
                        }
                    },
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            oResponseObject = JSON.parse(oMessage.response.body);
                            oResponseObject.successStatus = true;
                            sUpdatedResponseString = JSON.stringify(oResponseObject);
                            resolve(sUpdatedResponseString);
                        } else {
                            Log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            resolve(JSON.stringify({ successStatus: false }));
                        }
                    }
                );
            });
        };

        /**
         * Verifying whether the WebSocket is active (while it is already opened)
         *
         * @returns {Promise} promise is always resolved even if the request fails.<br>
         *   The actual response is returned as the done function's boolean parameter:<br>
         *   In case of active WebSocket - the value <code>true</code> is returned, and <code>false</code> otherwise.
         */
        this._checkWebSocketActivity = function () {
            const oRequestObject = this._createRequest(this._getRequestURI(oOperationEnum.VALIDATE_WEBSOCKET_CHANNEL));
            return new Promise((resolve) => {
                OData.request(
                    oRequestObject,
                    (oResult) => {
                        if (typeof (oResult.results) === "string") {
                            const oResponseObject = JSON.parse(oResult.results);
                            resolve(oResponseObject.IsActive);
                        } else {
                            resolve(false);
                        }
                    },
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            const oResponseObject = JSON.parse(oMessage.response.body);
                            resolve(oResponseObject.IsActive);
                        } else {
                            Log.error("Notification service - oData get settings failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            resolve(false);
                        }
                    });
            });
        };

        /**
         * @param {object} oEntry Settings entry to be saved
         * @returns {Promise} Save settings promise
         * @private
         */
        this.saveSettingsEntry = function (oEntry) {
            const oNotificationsService = this;
            const sSetSettingsUrl = this._getRequestURI(oOperationEnum.GET_SETTINGS) + "(NotificationTypeId=" + oEntry.NotificationTypeId + ")";
            const oRequestObject = {
                requestUri: sSetSettingsUrl,
                method: "PUT",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json",
                    DataServiceVersion: sDataServiceVersion,
                    "X-CSRF-Token": sHeaderXcsrfToken
                }
            };

            // make sure to always send the entire set of properties to the backend
            oRequestObject.data = JSON.parse(JSON.stringify(oEntry));
            oRequestObject.data["@odata.context"] = "$metadata#NotificationTypePersonalizationSet/$entity";

            return new Promise((resolve, reject) => {
                OData.request(
                    oRequestObject,
                    resolve,
                    (oMessage) => {
                        if (oMessage.response && oMessage.response.statusCode === 200 && oMessage.response.body) {
                            resolve(oMessage.response.body);
                        } else if (oNotificationsService._csrfTokenInvalid(oMessage) && (bInvalidCsrfTokenRecoveryMode === false)) {
                            oNotificationsService._invalidCsrfTokenRecovery(resolve, reject, oNotificationsService.saveSettingsEntry, [oEntry]);
                        } else {
                            Log.error("Notification service - oData set settings entry failed: ", oMessage, "sap.ushell.services.NotificationsV2");
                            reject(oMessage);
                        }
                    });
            });
        };

        // ********************************** oData functionality - End ************************************
        // *************************************************************************************************

        this._updateNotificationsConsumers = function () {
            aUpdateNotificationsCallbacks.forEach(callback => callback());
        };

        this._updateNotificationsCountConsumers = function () {
            aUpdateNotificationsCountCallbacks.forEach(callback => callback());
        };

        this._updateAllConsumers = function () {
            this._updateNotificationsConsumers();
            this._updateNotificationsCountConsumers();
        };

        this._getModel = function () {
            return oModel;
        };

        //*************************************************************************************************
        //***********************  Handle Notifications consumption / modes - Begin ***********************

        this._getMode = function () {
            return oCurrentMode;
        };

        /**
         * There are four possible modes of working of Notification service, defined by oModesEnum.
         * The following functions (i.e. steps) are executes sequentially, from _setWorkingMode (step 1) downwards
         * in order to find what is the relevant working mode for notification service and to activate it.
         */

        /**
         * Starting the process of defining the mode in which notifications service consume notifications data.
         * Step 1. Handle packagedApp mode
         */
        this._setWorkingMode = function () {
            let aConsumedIntentsFromConfig;

            // check service configuration for ConsumedIntents enabling flag and data
            if (oServiceConfig.intentBasedConsumption === true) {
                aConsumedIntents = this._getIntentsFromConfiguration(oServiceConfig.consumedIntents);
                if (aConsumedIntents.length > 0) {
                    // First setting of the flag is from service configuration
                    bIntentBasedConsumption = true;
                }
            }

            // Check if this is packagedApp use-case
            if (this._isPackagedMode()) {
                oCurrentMode = oModesEnum.PACKAGED_APP;

                // Consumed intents are read from PackagedApp configuration, if exist
                aConsumedIntentsFromConfig = this._getIntentsFromConfiguration(window.fiori_client_appConfig.applications);
                if (aConsumedIntentsFromConfig.length > 0) {
                    aConsumedIntents = aConsumedIntentsFromConfig;
                }

                if (aConsumedIntents.length > 0) {
                    // Second setting of the flag (to true) is done in case of PackagedApp mode and if any intents were configured
                    bIntentBasedConsumption = true;
                }

                this._registerForPush();
                this._readNotificationsData(true);

                this._setNativeIconBadgeWithDelay();

                return;
            }

            // Call step 2: Perform the first oData read request
            this._performFirstRead();
        };

        /**
         * Step 2. Issue the initial oData call for getting notification data, then wait until it is possible to check if we're in Fiori Client mode:
         * The execution of the _isFioriClientMode check must be delayed by 6000ms for initial loading since it relies on the flag sap.FioriClient that is set by FioriClient
         */
        this._performFirstRead = function () {
            const oNotificationsService = this;

            this._readNotificationsData(true).then(() => {
                // Calculate time left until Fiori Client mode can be checked
                const tFioriClientRemainingDelay = oNotificationsService._getFioriClientRemainingDelay();
                if (tFioriClientRemainingDelay <= 0) {
                    oNotificationsService._fioriClientStep();
                } else {
                    initialReadTimer = setTimeout(function () {
                        oNotificationsService._fioriClientStep();
                    }, tFioriClientRemainingDelay);
                }
                bFirstDataLoaded = true;
            }).catch((sMsg) => {
                Log.error("Notifications oData read failed. Error: " + sMsg);
            });
        };

        /**
         * Step 3. waiting the delay necessary for Fiori Client - Check if this is indeed Fiori Client mode
         * If so - initialize Fiori Client mode. If not - go to the nest step (webSocket)
         */
        this._fioriClientStep = function () {
            if (this._isFioriClientMode()) {
                oCurrentMode = oModesEnum.FIORI_CLIENT;
                this._addPushNotificationHandler();

                this.getUnseenNotificationsCount()
                    .then(function (iBadgeValue) {
                        this._setNativeIconBadge(iBadgeValue, () => { });
                    }.bind(this))
                    .catch(() => { });
            } else {
                this._webSocketStep();
            }
        };

        /**
         * Step 4. WebSocket step
         */
        this._webSocketStep = function () {
            oCurrentMode = oModesEnum.WEB_SOCKET;
            this._establishWebSocketConnection();
        };

        /**
         * Step 5. WebSocket recovery step
         * Called on WebSocket onClose event.
         * In this case there is one additional trial to establish the WebSocket connection.
         * If the additional attempt also fails - move to polling
         */
        this._webSocketRecoveryStep = function () {
            if (bWebSocketRecoveryAttempted === false) {
                bWebSocketRecoveryAttempted = true;
                webSocketRecoveryTimer = window.setTimeout(this._webSocketStep.bind(this), tWebSocketRecoveryPeriod);
            } else {
                // Since the first request for notifications data was already issued -
                // the first polling request is delayed by (iPollingInterval * 1000) seconds
                this._activatePollingAfterInterval();
            }
        };

        this._activatePollingAfterInterval = function () {
            const iPollingInterval = oServiceConfig.pollingIntervalInSeconds || I_DEFAULT_POLLING_INTERVAL;

            window.clearTimeout(pollingTimer);
            pollingTimer = window.setTimeout(this._activatePolling.bind(this), ushellUtils.sanitizeTimeoutDelay(iPollingInterval * 1000));
        };

        /**
         * Step 6. Polling
         */
        this._activatePolling = function () {
            const iPollingInterval = oServiceConfig.pollingIntervalInSeconds || I_DEFAULT_POLLING_INTERVAL;

            oCurrentMode = oModesEnum.POLLING;
            this._readNotificationsData(true);
            // Call again after a delay
            window.clearTimeout(pollingTimer);
            pollingTimer = window.setTimeout(this._activatePolling.bind(this, iPollingInterval, false), ushellUtils.sanitizeTimeoutDelay(iPollingInterval * 1000));
        };

        this._formatAsDate = function (sUnformatted) {
            return new Date(sUnformatted);
        };

        this._notificationAlert = function (results) {
            // If alerts/banners for HIGH priority notifications are disabled by the user - then return
            if (bHighPriorityBannerEnabled === false) {
                return;
            }

            const aNewNotifications = [];
            let nextLastNotificationDate = 0;

            for (const oNotification in results) {
                if (this.lastNotificationDate && this._formatAsDate(results[oNotification].CreatedAt) > this.lastNotificationDate) {
                    if (results[oNotification].Priority === "HIGH") {
                        aNewNotifications.push(results[oNotification]);
                    }
                }
                // get the last notification date
                if (nextLastNotificationDate < this._formatAsDate(results[oNotification].CreatedAt)) {
                    nextLastNotificationDate = this._formatAsDate(results[oNotification].CreatedAt);
                }
            }
            if (this.lastNotificationDate && aNewNotifications.length > 0) {
                Core.getEventBus().publish("sap.ushell.services.Notifications", "onNewNotifications", aNewNotifications);
            }
            this.lastNotificationDate = nextLastNotificationDate;
        };

        /**
         * Returning the time, in milliseconds, left until the end of FioriClient waiting period.
         * The required period is represented by tFioriClientInitializationPeriod, and we reduce the time passed from service initialization until now
         * @returns {int} Remaining delay
         */
        this._getFioriClientRemainingDelay = function () {
            return tFioriClientInitializationPeriod - (new Date() - tInitializationTimestamp);
        };

        /**
         * Establishing a WebSocket connection for push updates
         */
        this._establishWebSocketConnection = function () {
            const oNotificationsService = this;
            let bDeliberateClose = false;

            try {
                // Init WebSocket connection
                oWebSocket = this._getWebSocketObjectObject(oServiceConfig.webSocketUrl || S_DEFAULT_WEBSOCKET_URL, [SapPcpWebSocket.SUPPORTED_PROTOCOLS.v10]);

                oWebSocket.attachMessage(this, function (oMessage/*, oData*/) {
                    const oPcpFields = oMessage.getParameter("pcpFields");
                    if ((oPcpFields) && (oPcpFields.Command) && (oPcpFields.Command === "Notification")) {
                        // Receive "pings" for Notification EntitySet
                        // Another optional "ping" would be oPcpFields.Command === "Badge" for new Badge Number, but is currently not supported.
                        oNotificationsService._readNotificationsData(true);
                    }
                });

                oWebSocket.attachOpen(this, function () {
                    oNotificationsService._checkWebSocketActivity().then((bIsActive) => {
                        // In case when bIsActive is false, the webSocket is not active although the connection is opened.
                        // in this case we should close the WebSocket connection and switch to polling step.
                        if (!bIsActive) {
                            bDeliberateClose = true;
                            oWebSocket.close();
                            oNotificationsService._activatePollingAfterInterval();
                        }
                    });
                    Log.info("Notifications UShell service WebSocket: webSocket connection opened");
                });

                oWebSocket.attachClose(this, function (oEvent) {
                    Log.warning("Notifications UShell service WebSocket: attachClose called with code: " + oEvent.mParameters.code + " and reason: " + oEvent.mParameters.reason);
                    if ((!bOnServiceStop) && (!bDeliberateClose)) {
                        oNotificationsService._webSocketRecoveryStep();
                    }
                });

                // attachError is not being handled since each attachError is followed by a call to attachClose (...which includes handling)
                oWebSocket.attachError(this, function () {
                    Log.warning("Notifications UShell service WebSocket: attachError called!");
                });
            } catch (e) {
                Log.error("Exception occurred while creating new sap.ui.core.ws.SapPcpWebSocket. Message: " + e.message);
            }
        };

        // *********************** Handle Notifications consumption / modes - End **************************
        // *************************************************************************************************

        // *************************************************************************************************
        // **************** Helper functions for Fiori client and PackagedApp mode - Begin *****************

        this._isFioriClientMode = function () {
            return !(sap.FioriClient === undefined);
        };

        /**
         * Helper function for Packaged App mode
         */
        this._isPackagedMode = function () {
            return (window.fiori_client_appConfig && window.fiori_client_appConfig.prepackaged === true);
        };

        this._setNativeIconBadge = function (iBadgeValue) {
            if (sap.Push && sap.Push.setBadgeNumber) {
                sap.Push.setBadgeNumber(iBadgeValue, () => { });
            }
        };

        this._setNativeIconBadgeWithDelay = function () {
            setTimeout(function () {
                this.getUnseenNotificationsCount().then(function (iBadgeValue) {
                    this._setNativeIconBadge(iBadgeValue);
                }.bind(this))
                    .catch(() => { });
            }.bind(this), 4000);
        };

        this._getIntentsFromConfiguration = function (aInput) {
            const aTempConsumedIntents = [];
            if (aInput && aInput.length > 0) {
                let sTempIntent;

                for (let index = 0; index < aInput.length; index++) {
                    sTempIntent = aInput[index].intent;
                    aTempConsumedIntents.push(sTempIntent);
                }
            }
            return aTempConsumedIntents;
        };

        this._handlePushedNotification = function (oNotificationData) {
            let sSemanticObject;
            let sAction;
            let oParameters;
            let aParameters = [];

            if (oNotificationData !== undefined) {
                // Either oNotificationData.additionalData is not defined
                // OR oNotificationData.additionalData has the value "true" (foreground use-case)
                if ((oNotificationData.additionalData === undefined) || (oNotificationData.additionalData.foreground === true)) {
                    // The given notification object is ignored, and we relate to this use-case as a "ping",
                    // telling us that notifications data (in the Notification Center) was changed, hence the call to _readNotificationsData
                    this._readNotificationsData(true);

                    // Background use-case (oNotificationData.additionalData is defined and equals "false")
                } else {
                    // Read the semantic object, the action and the navigation parameters from the additionalData part of the notification,
                    // or as a fallback - from the notification item's data

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetObject) {
                        sSemanticObject = oNotificationData.additionalData.NavigationTargetObject;
                    } else {
                        sSemanticObject = oNotificationData.NavigationTargetObject;
                    }

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetAction) {
                        sAction = oNotificationData.additionalData.NavigationTargetAction;
                    } else {
                        sAction = oNotificationData.NavigationTargetAction;
                    }

                    if (oNotificationData.additionalData && oNotificationData.additionalData.NavigationTargetParam) {
                        oParameters = oNotificationData.additionalData.NavigationTargetParam;
                    } else {
                        oParameters = oNotificationData.NavigationTargetParam;
                    }

                    if (oParameters) {
                        if (typeof oParameters === "string" || oParameters instanceof String) {
                            aParameters[0] = oParameters;
                        } else if (Array.isArray(oParameters) === true) {
                            aParameters = oParameters;
                        }
                    }

                    const sNotificationId = oNotificationData.NotificationId;

                    if (sSemanticObject && sAction) {
                        // Perform a navigation action according to the pushed notification's intent
                        ushellUtils.toExternalWithParameters(sSemanticObject, sAction, aParameters);
                    }

                    this.markRead(sNotificationId);

                    this._readNotificationsData(true);
                }
            }
        };

        this._registerForPush = function () {
            if (sap.Push) {
                sap.Push.initPush(this._handlePushedNotification.bind(this));
            }
        };

        /**
         * For Fiori Client use case on mobile platform.
         * This function registers the callback this._handlePushedNotification for the deviceready event
         */
        this._addPushNotificationHandler = function () {
            document.addEventListener("deviceready", this._registerForPush.bind(this), false);
        };

        this._isIntentBasedConsumption = function () {
            return bIntentBasedConsumption;
        };

        /**
         * Creates and returns the intents filter string of an OData request
         * For example: &NavigationIntent%20eq%20%27Action-toappstatesample%27%20or%20NavigationIntent%20eq%20%27Action-toappnavsample%27
         */
        this._getConsumedIntents = function (oRequestURI) {
            let sConsumedIntents = "";

            if (!this._isIntentBasedConsumption()) {
                return sConsumedIntents;
            }

            if (aConsumedIntents.length > 0) {
                // If it is not GetBadgeNumber use-case then the intents filter string should start with "&"
                if (oRequestURI !== oOperationEnum.GET_BADGE_NUMBER) {
                    sConsumedIntents = "&";
                }

                for (let index = 0; index < aConsumedIntents.length; index++) {
                    // If it is GetBadgeNumber use case then the intent are comma separated
                    if (oRequestURI === oOperationEnum.GET_BADGE_NUMBER) {
                        if (index === 0) {
                            sConsumedIntents = aConsumedIntents[index];
                        } else {
                            sConsumedIntents = sConsumedIntents + "," + aConsumedIntents[index];
                        }
                    } else {
                        sConsumedIntents = sConsumedIntents + "NavigationIntent%20eq%20%27" + aConsumedIntents[index] + "%27";
                    }
                }
            }
            return sConsumedIntents;
        };

        this._revalidateCsrfToken = function () {
            sHeaderXcsrfToken = undefined;
            bCsrfDataSet = false;

            return this.getNotificationsBufferBySortingType(oOperationEnum.NOTIFICATIONS_BY_DATE_DESCENDING, 0, 1);
        };

        this._csrfTokenInvalid = function (oMessage) {
            const oResponse = oMessage.response;
            const bAuthorizationError = oResponse && oResponse.statusCode === 403;
            const sCSRFTokenHeader = oResponse ? oResponse.headers["x-csrf-token"] : "";
            // There have been instances of services returning "Required" as well as "required",
            // therefore the method toLowerCase is used.
            const bCSRFTokenRequired = sCSRFTokenHeader.toLowerCase() === "required";
            return bAuthorizationError && bCSRFTokenRequired;
        };

        /**
         * Called in case that the CSRF token becomes invalid during the session.
         *
         * This problem (i.e., invalid CSRF token) is found when a POST oData call fails (e.g, markRead).
         * in such a case this function is called in order to perform the recovery flow.
         *
         * The recovery flow includes two main steps:
         *   1. Obtaining the new/valid CSRF token from the notification channel
         *   2. Calling the function that failed (with the same parameters)
         *   3. resolving/rejecting the deferred object of the first function call (the one that failed because the token became invalid) in order to continue with the original flow
         *
         * This function doesn't return anything, instead it calls the provided resolve or reject callbacks
         *
         * @private
         */
        this._invalidCsrfTokenRecovery = function (resolve, reject, fnFailedFunction, aArgsArray) {
            const oNotificationsService = this;

            bInvalidCsrfTokenRecoveryMode = true;

            // Getting the new/valid CSRF token
            this._revalidateCsrfToken().then(() => {
                // Call the failed function (with the same parameters)
                fnFailedFunction.apply(oNotificationsService, aArgsArray)
                    .then(resolve)
                    .catch((e) => {
                        if (e.response && e.response.statusCode === 200 && e.response.body) {
                            resolve(e.response.body);
                        } else {
                            reject(e);
                        }
                    })
                    .finally(() => {
                        bInvalidCsrfTokenRecoveryMode = false;
                    });
            }).catch((e) => {
                bInvalidCsrfTokenRecoveryMode = false;
                Log.error("Notification service - oData markRead failed: ", e.message, "sap.ushell.services.NotificationsV2");
                reject(e);
            });
        };

        // **************** Helper functions for Fiori client and PackagedApp mode - End *****************
        // ***********************************************************************************************

        this._notificationsAscendingSortBy = function (aNotifications, sPropertyToSortBy) {
            aNotifications.sort((x, y) => {
                let val1 = x[sPropertyToSortBy];
                let val2 = y[sPropertyToSortBy];

                if (val1 === val2) {
                    val1 = x.id;
                    val2 = y.id;
                }
                return val2 > val1 ? -1 : 1;
            });
            return aNotifications;
        };

        this._getWebSocketObjectObject = function (sWebSocketUrl, aVersionProtocol) {
            return new SapPcpWebSocket(sWebSocketUrl, aVersionProtocol);
        };

        this.getOperationEnum = function () {
            return oOperationEnum;
        };

        /**
         * Read user settings flags from the personalization and update the variable bHighPriorityBannerEnabled.
         * If the data does not yet exists in the personalization,
         * write the default value of bHighPriorityBannerEnabled to the personalization
         */
        this._readUserSettingsFlagsFromPersonalization = function () {
            const oNotificationsService = this;
            this._getUserSettingsPersonalizer()
                .then((oPersonalizer) => {
                    oPersonalizer.getPersData()
                        .then((oFlagsData) => {
                            if (oFlagsData === undefined) {
                                oNotificationsService._writeUserSettingsFlagsToPersonalization({
                                    highPriorityBannerEnabled: bHighPriorityBannerEnabled
                                });
                            } else {
                                bHighPriorityBannerEnabled = oFlagsData.highPriorityBannerEnabled;
                            }
                            oUserFlagsReadFromPersonalizationDeferred.resolve();
                        })
                        .catch(() => {
                            Log.error("Reading User Settings flags from Personalization service failed");
                        });
                })
                .catch((error) => {
                    Log.error("Personalization service does not work:");
                    Log.error(error.name + ": " + error.message);
                    Log.error("Reading User Settings flags from Personalization service failed");
                });
        };

        /**
         * Write/save user settings flags to the personalization.
         * The saved data consists of the user's show high-priority notifications alerts flag value.
         */
        this._writeUserSettingsFlagsToPersonalization = function (oFlags) {
            return this._getUserSettingsPersonalizer()
                .then((oPersonalizer) => oPersonalizer.setPersData(oFlags))
                .catch((error) => {
                    Log.error("Personalization service does not work:");
                    Log.error(error.name + ": " + error.message);
                });
        };

        this._getUserSettingsPersonalizer = function () {
            if (!this.oUserSettingsPersonalizerPromise) {
                this.oUserSettingsPersonalizerPromise = sap.ushell.Container.getServiceAsync("PersonalizationV2")
                    .then((PersonalizationService) => {
                        const oScope = {
                            keyCategory: PersonalizationService.constants.keyCategory.FIXED_KEY,
                            writeFrequency: PersonalizationService.constants.writeFrequency.LOW,
                            clientStorageAllowed: true
                        };

                        const oPersId = {
                            container: "sap.ushell.services.Notifications",
                            item: "userSettingsData"
                        };

                        return PersonalizationService.getPersonalizer(oPersId, oScope);
                    });
            }

            return this.oUserSettingsPersonalizerPromise;
        };

        this._updateCSRF = function (oResponseData) {
            if ((bCsrfDataSet === true) || (oResponseData.headers === undefined)) {
                return;
            }
            if (!this._getHeaderXcsrfToken()) {
                sHeaderXcsrfToken = oResponseData.headers["x-csrf-token"] || oResponseData.headers["X-CSRF-Token"] || oResponseData.headers["X-Csrf-Token"];
            }
            if (!this._getDataServiceVersion()) {
                sDataServiceVersion = oResponseData.headers.DataServiceVersion || oResponseData.headers["odata-version"];
            }
            bCsrfDataSet = true;
        };

        /**
         * Handles all the required steps in order to initialize Notification Settings UI
         *
         * Issues two calls to the Notifications channel backend system in order to check whether settings feature and Push to Mobile features are supported
         */
        this._userSettingInitialization = function () {
            // Contains three boolean flags:
            //   - settingsAvailable: Is the settings feature supported by the notification channel backend system
            //   - mobileAvailable: Is the "push to mobile" feature supported by the notification channel backend system
            //   - emailAvailable: Is the "send email" feature supported by the notification channel backend system
            const oSettingsStatus = {
                settingsAvailable: false,
                mobileAvailable: false,
                emailAvailable: false
            };

            // Read the part of user settings data that is kept in personalization service
            this._readUserSettingsFlagsFromPersonalization();

            // 1st asynchronous call: Get setting data from the backend, for the purpose of verifying that the feature is supported
            const oSettingsPromise = this.readSettings();
            // 2nd asynchronous call: verify Push To Mobile capability
            const oMobileSettingsPromise = this._readMobileSettingsFromServer();
            const oEmailSettingsPromise = this._readEmailSettingsFromServer();

            const aPromises = [oSettingsPromise, oMobileSettingsPromise, oEmailSettingsPromise];

            oSettingsPromise.then(() => {
                // Notification setting supported
                oSettingsStatus.settingsAvailable = true;
            }).catch(() => {
                Log.warning("User settings for the Notification service are not available.");
                oNotificationSettingsAvailabilityDeferred.promise().catch(() => { });
                oNotificationSettingsAvailabilityDeferred.reject();
            });

            oMobileSettingsPromise.then((oResult) => {
                const oResponseObject = JSON.parse(oResult);
                // Push to Mobile validation returned
                if (oResponseObject.successStatus) {
                    bNotificationSettingsMobileSupport = oResult ? oResponseObject.IsActive : false;
                    oSettingsStatus.mobileAvailable = bNotificationSettingsMobileSupport;
                } else {
                    bNotificationSettingsMobileSupport = false;
                    oSettingsStatus.mobileAvailable = false;
                }
            }).catch(() => {
                Log.warning("Mobile settings for the Notification service are not available.");
                bNotificationSettingsMobileSupport = false;
                oSettingsStatus.mobileAvailable = false;
            });

            oEmailSettingsPromise.then((oResult) => {
                const oResponseObject = JSON.parse(oResult);
                if (oResponseObject.successStatus) {
                    bNotificationSettingsEmailSupport = oResult ? oResponseObject.IsActive : false;
                    oSettingsStatus.emailAvailable = bNotificationSettingsEmailSupport;
                } else {
                    bNotificationSettingsEmailSupport = false;
                    oSettingsStatus.emailAvailable = false;
                }
            }).catch(() => {
                Log.warning("Email settings for the Notification service are not available.");
                bNotificationSettingsEmailSupport = false;
                oSettingsStatus.emailAvailable = false;
            });

            // Resolve the deferred object on which the setting UI depends after the two OData calls returned, no matter if they were successful or not
            Promise.all(aPromises).then(() => {
                // After both calls returned - the deferred object (on which the rendering of Notification Settings UI depends) is resolved
                oNotificationSettingsAvailabilityDeferred.resolve(oSettingsStatus);
            }).catch(() => Log.warning("Settings for the Notification service are not loaded completely."));
        };

        /**
         * Used to close all notification connection. In order to resume connection use _resumeConnection method
         * @private
         */
        this._closeConnection = function () {
            if (!bOnServiceStop) {
                if (oCurrentMode === oModesEnum.WEB_SOCKET && oWebSocket) {
                    oWebSocket.close();
                    bOnServiceStop = true;
                }
                if (oCurrentMode === oModesEnum.POLLING && pollingTimer) {
                    window.clearTimeout(pollingTimer);
                    bOnServiceStop = true;
                }
            }
        };

        /**
         * Used to open closed notification connection. Firstly, try to re-establish the websocket connection.
         * If the websocket connection can not be established, the polling start automatically after failed attempt
         * @private
         */
        this._resumeConnection = function () {
            if (bOnServiceStop) {
                bOnServiceStop = false;
                this._webSocketStep();
            }
        };
    }

    Notifications.hasNoAdapter = true;
    return Notifications;
}, true /* bExport */);
