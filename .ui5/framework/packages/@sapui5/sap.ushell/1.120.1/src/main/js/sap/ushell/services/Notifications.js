// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/ushell/services/NotificationsV2" // preload NotificationsV2 early
], function (
    jQuery
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Notifications
     * @class
     * @classdesc UShell service for fetching user notification data from the Notification center/service<br>
     * and exposing them to the Unified Shell and Fiori applications UI controls.
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
     * @hideconstructor
     *
     * @param {object} oContainerInterface The interface provided by the container
     * @param {object} sParameters Not used in this service
     * @param {object} oServiceConfiguration configuration
     *
     * @see sap.ushell.services.Container#getServiceAsync
     * @since 1.32.0
     * @deprecated since 1.119. Please use {@link sap.ushell.services.NotificationsV2} instead.
     * @public
     */
    function Notifications (oContainerInterface, sParameters, oServiceConfiguration) {

        // Get the reference to the NotificationsV2 service promise
        this._getNotificationsV2 = function () {
            if (!this.oNotificationsV2Promise) {
                this.oNotificationsV2Promise = sap.ushell.Container.getServiceAsync("NotificationsV2");
                this.oNotificationsV2Promise.then(function (oService) {
                    this._oNotificationsV2Service = oService; // Save ref to the service for static calls, beware race conditions
                }.bind(this));
            }
            return this.oNotificationsV2Promise;
        };

        // Wrap Promise into jQuery.Deferred.promise
        this._proxyV2 = function (sMethod, aArguments) {
            var oDeferred = new jQuery.Deferred();
            this._getNotificationsV2()
                .then(function (oService) {
                    return oService[sMethod].apply(oService, aArguments); // Call NotificationsV2 service method instead
                })
                .then(oDeferred.resolve)
                .catch(oDeferred.reject);
            return oDeferred.promise();
        };

        this._proxyV2sync = function (sMethod, defaultValue, aArguments) {
            var oService = this._oNotificationsV2Service;
            //return oService ? oService[sMethod].apply(oService, aArguments) : defaultValue;
            return oService[sMethod].apply(oService, aArguments);
        };

        // *************************************************************************************************
        // ************************************* Service API - Begin ***************************************

        /**
         * Indicates whether notification service is enabled.<br>
         * Enabling is based on the <code>enable</code> service configuration flag.<br>
         * The service configuration must also include serviceUrl attribute.<br>
         *
         * @returns {boolean} A boolean value indicating whether the notifications service is enabled
         * @since 1.32.0
         * @public
         * @alias sap.ushell.services.Notifications#isEnabled
         */
        this.isEnabled = function () {
            var oServiceConfig = oServiceConfiguration && oServiceConfiguration.config;
            return !!(oServiceConfig && oServiceConfig.enabled && oServiceConfig.serviceUrl);
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
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#init
         */
        this.init = function () {
            this._proxyV2("init");
        };

        /**
         * Returns the number of unseen notifications<br>
         * e.g. Notifications that the user hasn't seen yet.
         *
         * @returns {jQuery.Deferred.promise} Promise object that on success - returns the number of unread notifications of the user
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#getUnseenNotificationsCount
         */
        this.getUnseenNotificationsCount = function () {
            return this._proxyV2("getUnseenNotificationsCount");
        };

        /**
         * Returns the number of  notifications<br>
         * e.g. Notifications for user.
         *
         * @returns {int} Returns the number of notifications of the user
         * @since 1.44
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsCount
         */
        this.getNotificationsCount = function () {
            return this._proxyV2sync("getNotificationsCount", "0");
        };

        /**
         * Returns the notifications of the user sorted by type include the group headers and the notifications
         *
         * @returns {jQuery.Deferred.promise} Promise object that - on success - returns all notification items
         * @since 1.38
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsByTypeWithGroupHeaders
         */
        this.getNotificationsByTypeWithGroupHeaders = function () {
            return this._proxyV2("getNotificationsByTypeWithGroupHeaders");
        };

        /**
         * Returns the group headers of the user notifications
         *
         * @returns {jQuery.Deferred.promise} Promise object that - on success - returns all group headers
         * @since 1.44
         * @public
         * @alias sap.ushell.services.Notifications#getNotificationsGroupHeaders
         */
        this.getNotificationsGroupHeaders = function () {
            return this._proxyV2("getNotificationsGroupHeaders");
        };

        this.getNotificationsBufferInGroup = function (sGroup, iSkip, iTop) {
            return this._proxyV2("getNotificationsBufferInGroup", arguments);
        };

        this.getNotificationsBufferBySortingType = function (sSortingType, iSkip, iTop) {
            return this._proxyV2("getNotificationsBufferBySortingType", arguments);
        };

        /**
         * Returns the 10 most recent notifications of the user
         *
         * @returns {Promise} Promise object that on success - returns the 10 most recent user notification items
         * @since 1.32
         * @private
         * @alias sap.ushell.services.Notifications#getNotifications
         */
        this.getNotifications = function () {
            return this._proxyV2("getNotifications", arguments);
        };

        /**
         * Launches a notification action oData call.<br>
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {string} sNotificationGroupId The ID of the notification header/group whose action is being executed
         * @param {string} sActionId The ID of the action that is being executed
         * @returns {Promise<undefined>} Promise object that on success resolves to undefined or it is rejected with failed notifications
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#executeBulkAction
         */
        this.executeBulkAction = function (sNotificationGroupId, sActionId) {
            return this._proxyV2("executeBulkAction", arguments);
        };

        this.dismissBulkNotifications = function (sNotificationGroupId) {
            return this._proxyV2("dismissBulkNotifications", arguments);
        };

        this.executeAction = function (sNotificationId, sActionId) {
            return this._proxyV2("executeAction", arguments);
        };

        this.sendBulkAction = function (sParentId, sActionId) {
            return this._proxyV2("sendBulkAction", arguments);
        };

        this.sendBulkDismiss = function (sParentId) {
            return this._proxyV2("sendBulkDismiss", arguments);
        };

        /**
         * Launches mark as read notification call.<br>
         * After launching the action, the function gets updated notification data in order to push the updated data to the consumers.
         *
         * @param {string} sNotificationId The ID of the notification whose action is being executed
         * @returns {jQuery.Deferred.promise} Promise object that on success resolves to undefined or it is rejected with a message object
         * @since 1.34
         * @public
         * @alias sap.ushell.services.Notifications#markRead
         */
        this.markRead = function (sNotificationId) {
            return this._proxyV2("markRead", arguments);
        };

        /**
         * Launches dismiss notification call.<br>
         *
         * @param {string} sNotificationId The ID of the notification whose action is being executed
         * @returns {jQuery.Deferred.promise} Promise object that on success resolves to undefined or it is rejected with a message object
         * @since 1.34
         * @public
         * @alias sap.ushell.services.Notifications#dismissNotification
         */
        this.dismissNotification = function (sNotificationId) {
            return this._proxyV2("dismissNotification", arguments);
        };

        /**
         * Gets a callback function that will be called when updated notifications data is available.
         *
         * @param {function} callback The callback function that is registered and called on data update.
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#registerNotificationsUpdateCallback
         */
        this.registerNotificationsUpdateCallback = function (callback) {
            this._proxyV2("registerNotificationsUpdateCallback", arguments);
        };

        /**
         * Gets a callback function to be called on notifications update, with a dependency in other callbacks
         *
         * On every notification update:
         *   1. A deferred object is created
         *   2. The registered callback functions are called with a parameter
         *   3. The parameter is either the deferred object or the deferred's promise
         *
         * This way there is a dependency between one of the callback (that performs the deferred.resolve/reject) and all the other (that implement the promise.done/fail)
         *
         * @param {function} callback The callback function that is registered and called on data update.
         * @param {boolean} bDependent Determines whether the callback gets a deferred object or a promise object, when called
         * @private
         */
        this.registerDependencyNotificationsUpdateCallback = function (callback, bDependent) {
            this._proxyV2("registerNotificationsUpdateCallback", arguments); // V2 does not have registerDependencyNotificationsUpdateCallback
        };

        /**
         * Gets a callback function that will be called when updated unseen notifications count is available.
         *
         * @param {function} callback The callback function that is registered and called on data update.
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#registerNotificationCountUpdateCallback
         */
        this.registerNotificationCountUpdateCallback = function (callback) {
            this._proxyV2("registerNotificationCountUpdateCallback", arguments);
        };

        /**
         * Mark all notifications as seen.<br>
         * the main use-case is when the user navigated to the notification center and sees all the pending notifications.<br>
         *
         * @since 1.32
         * @public
         * @alias sap.ushell.services.Notifications#notificationsSeen
         */
        this.notificationsSeen = function () {
            this._setNotificationsAsSeen();
        };

        /**
         * @returns {boolean} boolean value whether first request was already performed and data was returned.<br>
         * @since 1.38
         * @public
         * @alias sap.ushell.services.Notifications#isFirstDataLoaded
         */
        this.isFirstDataLoaded = function () {
            return this._proxyV2sync("isFirstDataLoaded", false);
        };

        /**
         * @returns {Promise} Promise object that is resolved with the settings from the sever
         * @since 1.41
         * @private
         */
        this.readSettings = function () {
            return this._readSettingsFromServer();
        };

        /**
         * @returns {object} oPromise
         * @since 1.41
         * @private
         */
        this.saveSettingsEntry = function (oEntry) {
            return this._writeSettingsEntryToServer(oEntry);
        };

        /**
         * @returns {object} promise
         * @since 1.41
         * @private
         */
        this.getUserSettingsFlags = function () {
            return this._proxyV2("getUserSettingsFlags");
        };

        /**
         * @since 1.41
         * @private
         */
        this.setUserSettingsFlags = function (oFlags) {
            this._proxyV2("setUserSettingsFlags", arguments);
        };

        /**
         * @returns {boolean} value indicating whether the Push to Mobile capability is supported by the Notification channel
         * @since 1.43
         * @private
         */
        this._getNotificationSettingsMobileSupport = function () {
            return this._proxyV2sync("_getNotificationSettingsMobileSupport", false);
        };

        /**
         * @returns {Array} dismissed notifications
         * @since 1.43
         * @private
         */
        this._getDismissNotifications = function () {
            return this._proxyV2sync("_getDismissNotifications", []);
        };

        this.filterDismisssedItems = function (aRecentNotificationsArray, aDismissNotifications) {
            return this._proxyV2sync("_getDismissNotifications", [], arguments);
        };

        /**
         * adds an item to the array of dissmissed notifications
         *
         * @since 1.43
         * @private
         */
        this._addDismissNotifications = function (sId) {
            this._proxyV2sync("_getDismissNotifications", null, arguments);
        };

        /**
         * initialize array of dissmissed notifications
         *
         * @since 1.43
         * @private
         */
        this._initializeDismissNotifications = function () {
            this._proxyV2sync("_initializeDismissNotifications");
        };

        /**
         * @returns {boolean} value indicating whether the Push to Mobile capability is supported by the Notification channel
         * @since 1.43
         * @private
         */
        this._getNotificationSettingsEmailSupport = function () {
            return this._proxyV2sync("_getNotificationSettingsEmailSupport", false);
        };

        this.destroy = function () {
            this._proxyV2sync("destroy");
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
         * @param {boolean} bUpdateCustomers boolean parameter indicating whether to update the registered consumers or not
         * @returns {object} promise
         * @private
         */
        this._readUnseenNotificationsCount = function (bUpdateCustomers) {
            return this._proxyV2("_readUnseenNotificationsCount", arguments);
        };

        /**
         * Fetching the number of notifications for user<br>
         * @returns {object} promise
         */
        this.readNotificationsCount = function () {
            return this._proxyV2("readNotificationsCount", arguments);
        };

        /**
         * @returns {Promise} Returns promise object that is resolved if Notification settings data is available, and rejected if not
         * @private
         */
        this._getNotificationSettingsAvailability = function () {
            return this._proxyV2("_getNotificationSettingsAvailability");
        };

        this._setNotificationsAsSeen = function () {
            return this._proxyV2("_setNotificationsAsSeen");
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
         *   - Dependent consumers are updated (i.e. call that._updateDependentNotificationsConsumers())
         *
         * @param {boolean} bUpdateConsumers value indicating whether the consumers should be updated
         * @returns {object} oDeferred.promise() object, indicating success of both read actions
         * @private
         */
        this._readNotificationsData = function (bUpdateConsumers) {
            return this._proxyV2("_readNotificationsData", arguments);
        };

        this._getHeaderXcsrfToken = function () {
            return this._proxyV2sync("_getHeaderXcsrfToken");
        };

        this._getDataServiceVersion = function () {
            return this._proxyV2sync("_getDataServiceVersion");
        };

        /**
         * Returns the appropriate URI that should be used in an OData request according to the nature of the request and according to filtering that might be required.
         * The object aRequestURIs is filled with the basic and/or byIntents-filter URI, and is used for maintaining the URIs throughout the session.
         *
         * @param {object} The value form the enumeration oOperationEnum, representing the relevant request
         * @returns {string} The URI that should be user in the OData.read call
         */
        this._getRequestURI = function (oRequiredURI, oArgs) {
            return this._proxyV2sync("_getDataServiceVersion", "", arguments);
        };

        this._readSettingsFromServer = function () {
            return this._proxyV2("readSettings"); // _readSettingsFromServer is removed in V2 because it's a duplicate of readSettings
        };

        /**
         * Verifying whether the "push notifications to mobile" feature is supported.
         *
         * @returns {object} A Deferred.promise object that is always resolved even if the request failed.<br>
         *   In case of failure - the response property successStatus gets the value <code>false</code>
         */
        this._readMobileSettingsFromServer = function () {
            return this._proxyV2sync("_readMobileSettingsFromServer", "");
        };

        /**
         * Verifying whether the "push notifications to mobile" feature is supported.
         *
         * @returns {object} A Deferred.promise object that is always resolved even if the request failed.<br>
         *   In case of failure - the response property successStatus gets the value <code>false</code>
         */
        this._readEmailSettingsFromServer = function () {
            return this._proxyV2sync("_readEmailSettingsFromServer", "");
        };

        this._readChannelSettingsFromServer = function (operation) {
            return this._proxyV2("_readChannelSettingsFromServer", arguments);
        };

        /**
         * Verifying whether the WebSocket is active (while it is already opened)
         *
         * @returns {object} A Deferred.promise object that is always resolved even if the request fails.<br>
         *   The actual response is returned as the done function's boolean parameter:<br>
         *   In case of active WebSocket - the value <code>true</code> is returned, and <code>false</code> otherwise.
         */
        this._checkWebSocketActivity = function () {
            return this._proxyV2("_checkWebSocketActivity", arguments);
        };

        this._writeSettingsEntryToServer = function (oEntry) {
            return this._proxyV2("_writeSettingsEntryToServer", arguments);
        };

        // ********************************** oData functionality - End ************************************
        // *************************************************************************************************

        this._updateNotificationsConsumers = function () {
            this._proxyV2sync("_updateNotificationsConsumers");
        };

        this._updateDependentNotificationsConsumers = function () {
            this._proxyV2sync("_updateDependentNotificationsConsumers");
        };

        this._updateNotificationsCountConsumers = function () {
            this._proxyV2sync("_updateNotificationsCountConsumers");
        };

        this._updateAllConsumers = function () {
            this._proxyV2sync("_updateAllConsumers");
        };

        this._getModel = function () {
            return this._proxyV2sync("_getModel");
        };

        //*************************************************************************************************
        //***********************  Handle Notifications consumption / modes - Begin ***********************

        this._getMode = function () {
            return this._proxyV2sync("_getMode");
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
            this._proxyV2sync("_setWorkingMode");
        };

        /**
         * Step 2. Issue the initial oData call for getting notification data, then wait until it is possible to check if we're in Fiori Client mode:
         * The execution of the _isFioriClientMode check must be delayed by 6000ms for initial loading since it relies on the flag sap.FioriClient that is set by FioriClient
         */
        this._performFirstRead = function () {
            this._proxyV2sync("_performFirstRead");
        };

        /**
         * Step 3. waiting the delay necessary for Fiori Client - Check if this is indeed Fiori Client mode
         * If so - initialize Fiori Client mode. If not - go to the nest step (webSocket)
         */
        this._fioriClientStep = function () {
            this._proxyV2sync("_fioriClientStep");
        };

        /**
         * Step 4. WebSocket step
         */
        this._webSocketStep = function () {
            this._proxyV2sync("_webSocketStep");
        };

        /**
         * Step 5. WebSocket recovery step
         * Called on WebSocket onClose event.
         * In this case there is one additional trial to establish the WebSocket connection.
         * If the additional attempt also fails - move to polling
         */
        this._webSocketRecoveryStep = function () {
            this._proxyV2sync("_webSocketRecoveryStep");
        };

        this._activatePollingAfterInterval = function () {
            this._proxyV2sync("_activatePollingAfterInterval");
        };

        /**
         * Step 6. Polling
         */
        this._activatePolling = function () {
            this._proxyV2sync("_activatePolling");
        };

        this._formatAsDate = function (sUnformatted) {
            return new Date(sUnformatted);
        };

        this._notificationAlert = function (results) {
            this._proxyV2sync("_notificationAlert", arguments);
        };

        /**
         * Returning the time, in milliseconds, left until the end of FioriClient waiting period.
         * The required period is represented by tFioriClientInitializationPeriod, and we reduce the time passed from service initialization until now
         */
        this._getFioriClientRemainingDelay = function () {
            return this._proxyV2sync("_getFioriClientRemainingDelay", arguments);
        };

        /**
         * Establishing a WebSocket connection for push updates
         */
        this._establishWebSocketConnection = function () {
            this._proxyV2sync("_establishWebSocketConnection", arguments);
        };

        // *********************** Handle Notifications consumption / modes - End **************************
        // *************************************************************************************************

        // *************************************************************************************************
        // **************** Helper functions for Fiori client and PackagedApp mode - Begin *****************

        this._isFioriClientMode = function () {
            return this._proxyV2sync("_isFioriClientMode");
        };

        /**
         * Helper function for Packaged App mode
         */
        this._isPackagedMode = function () {
            return this._proxyV2sync("_isPackagedMode");
        };

        this._setNativeIconBadge = function (iBadgeValue) {
            this._proxyV2sync("_setNativeIconBadge", arguments);
        };

        this._setNativeIconBadgeWithDelay = function () {
            this._proxyV2sync("_setNativeIconBadgeWithDelay");
        };

        this._getIntentsFromConfiguration = function (aInput) {
            return this._proxyV2sync("_getIntentsFromConfiguration", [], arguments);
        };

        this._handlePushedNotification = function (oNotificationData) {
            this._proxyV2sync("_handlePushedNotification", null, arguments);
        };

        this._registerForPush = function () {
            this._proxyV2sync("_registerForPush");
        };

        /**
         * For Fiori Client use case on mobile platform.
         * This function registers the callback this._handlePushedNotification for the deviceready event
         */
        this._addPushNotificationHandler = function () {
            this._proxyV2sync("_addPushNotificationHandler");
        };

        this._isIntentBasedConsumption = function () {
            return this._proxyV2sync("_isIntentBasedConsumption");
        };

        /**
         * Creates and returns the intents filter string of an OData request
         * For example: &NavigationIntent%20eq%20%27Action-toappstatesample%27%20or%20NavigationIntent%20eq%20%27Action-toappnavsample%27
         */
        this._getConsumedIntents = function (oRequestURI) {
            return this._proxyV2sync("_getConsumedIntents", "", arguments);
        };

        this._revalidateCsrfToken = function () {
            return this._proxyV2("_revalidateCsrfToken");
        };

        this._csrfTokenInvalid = function (oMessage) {
            return this._proxyV2sync("_csrfTokenInvalid", true, arguments);
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
         * This function doesn't return anything, instead it resolves or rejects the given oOriginalDeferred
         *
         * @private
         */
        this._invalidCsrfTokenRecovery = function (oOriginalDeferred, fnFailedFunction, aArgsArray) {
            this._proxyV2sync("_invalidCsrfTokenRecovery", null, arguments);
        };

        // **************** Helper functions for Fiori client and PackagedApp mode - End *****************
        // ***********************************************************************************************

        this._notificationsAscendingSortBy = function (aNotifications, sPropertyToSortBy) {
            aNotifications.sort(function (x, y) {
                var val1 = x[sPropertyToSortBy],
                    val2 = y[sPropertyToSortBy];

                if (val1 === val2) {
                    val1 = x.id;
                    val2 = y.id;
                }
                return val2 > val1 ? -1 : 1;
            });
            return aNotifications;
        };

        this._getWebSocketObjectObject = function (sWebSocketUrl, aVersionProtocol) {
            this._proxyV2sync("_getWebSocketObjectObject", null, arguments);
        };

        this.getOperationEnum = function () {
            return this._proxyV2sync("getOperationEnum", {});
        };

        /**
         * Read user settings flags from the personalization and update the variable bHighPriorityBannerEnabled.
         * If the data does not yet exists in the personalization,
         * write the default value of bHighPriorityBannerEnabled to the personalization
         */
        this._readUserSettingsFlagsFromPersonalization = function () {
            this._proxyV2sync("_readUserSettingsFlagsFromPersonalization");
        };

        /**
         * Write/save user settings flags to the personalization.
         * The saved data consists of the user's show high-priority notifications alerts flag value.
         */
        this._writeUserSettingsFlagsToPersonalization = function (oFlags) {
            return this._proxyV2("_writeUserSettingsFlagsToPersonalization", arguments);
        };

        this._getUserSettingsPersonalizer = function () {
            return this._proxyV2sync("_getUserSettingsPersonalizer");
        };

        this._updateCSRF = function (oResponseData) {
            this._proxyV2sync("_updateCSRF", null, arguments);
        };

        /**
         * Handles all the required steps in order to initialize Notification Settings UI
         *
         * Issues two calls to the Notifications channel backend system in order to check whether settings feature and Push to Mobile features are supported
         */
        this._userSettingInitialization = function () {
            this._proxyV2sync("_userSettingInitialization");
        };

        /**
         * Used to close all notification connection. In order to resume connection use _resumeConnection method
         *
         * @since 1.71.0
         * @private
         */
        this._closeConnection = function () {
            this._proxyV2sync("_closeConnection");
        };

        /**
         * Used to open closed notification connection. Firstly, try to re-establish the websocket connection.
         * If the websocket connection can not be established, the polling start automatically after failed attempt
         *
         * @since 1.71.0
         * @private
         */
        this._resumeConnection = function () {
            this._proxyV2sync("_resumeConnection");
        };
    }

    Notifications.hasNoAdapter = true;
    return Notifications;
}, true /* bExport */);
