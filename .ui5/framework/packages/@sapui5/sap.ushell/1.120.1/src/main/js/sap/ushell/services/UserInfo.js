// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's user information service. Allows retrieving information about the logged-in user.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ushell/Config",
    "sap/ushell/User",
    "sap/ushell/Container"
], function (
    Log,
    Config,
    User,
    Container
) {
    "use strict";
    /**
     * @alias sap.ushell.services.UserInfo
     * @class
     * @classdesc The Unified Shell's user information service.
     * Allows retrieving information about the logged-in user.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("UserInfo")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @param {object} oAdapter Adapter
     * @param {object} oContainerInterface interface
     *
     * @hideconstructor
     *
     * @since 1.16.3
     * @public
     */

    // To not overload the adapter implementation on any platform, we memorize the Promises,
    // so we can return the same for each method call
    var mAdapterPromises = {
        themeList: null,
        languageList: null,
        userSettingList: null
    };

    function UserInfo (oAdapter, oContainerInterface) {
        /**
         * Returns the id of the user.
         *
         * @returns {string}
         *   The user id.
         *
         * @since 1.16.3
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getId
         */
        this.getId = function () {
            return Container.getUser().getId();
        };

        /**
         * Returns the first name of the user.
         *
         * @returns {string}
         *   The user's first name.
         *
         * @since 1.86.0
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getFirstName
         */
        this.getFirstName = function () {
            return Container.getUser().getFirstName();
        };

        /**
         * Returns the last name of the user.
         *
         * @returns {string}
         *   The user's last name.
         *
         * @since 1.86.0
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getLastName
         */
        this.getLastName = function () {
            return Container.getUser().getLastName();
        };

        /**
         * Returns the full name of the user.
         *
         * @returns {string}
         *   The user's full name.
         *
         * @since 1.86.0
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getFullName
         */
        this.getFullName = function () {
            return Container.getUser().getFullName();
        };

        /**
         * Returns the email address of the user.
         *
         * @returns {string}
         *   The user's email address.
         *
         * @since 1.86.0
         *
         * @public
         * @alias sap.ushell.services.UserInfo#getEmail
         */
        this.getEmail = function () {
            return Container.getUser().getEmail();
        };

        /**
         * Returns an object representing the logged-in user.
         *
         * @returns {User}
         *      object providing information about the logged-in user
         *
         * @since 1.15.0
         *
         * @private
         */
        this.getUser = function () {
            return Container.getUser();
        };

        /**
         * Returns an object representing data about the user: ID, first name, last name, full name, e-mail address.
         *
         * @returns {Promise}
         *      object providing information about the logged-in user: ID, first name, last name, full name, e-mail address
         * @since 1.71.0
         *
         * @public
         */
        this.getShellUserInfo = function () {
            return Promise.resolve({
                id: this.getId(),
                email: this.getEmail(),
                firstName: this.getFirstName(),
                lastName: this.getLastName(),
                fullName: this.getFullName()
            });
        };

        /**
         * Returns the list of available calendar week numberings to the user.
         * @returns {Array|null} Array of calendar week numberings, null if method in adapter does not exist.
         */
        this.getCalendarWeekNumberingList = function () {
            return oAdapter.getCalendarWeekNumberingList?.();
        };

        /**
         * Returns the list of themes available for the user.
         * In case of success, the <code>done</code> function returns an 'anonymous' object
         * representing the list of themes.
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         *
         * @returns {object}
         *  jQuery.promise object.
         *
         * @private
         */
        this.getThemeList = function () {
            if (mAdapterPromises.themeList) {
                return mAdapterPromises.themeList;
            }
            var oPromise = oAdapter.getThemeList();
            mAdapterPromises.themeList = oPromise;
            oPromise.fail(function () {
                Log.error("getThemeList failed");
            });
            return oPromise;
        };

        /**
         * Sends the updated user attributes to the adapter.
         * In case of success, the <code>done</code> function returns nothing.
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         *
         *  @returns {object}
         *  jQuery.promise object
         */
        this.updateUserPreferences = function () {
            var oPromise = oAdapter.updateUserPreferences(Container.getUser());
            oPromise.fail(function () {
                Log.error("updateAttributes: ");
            });
            return oPromise;
        };

        /**
         * Returns the list of languages or locales available for the user.
         * In case of success, the <code>done</code> function returns an object
         * representing a list of language (e.g., en) or locale IDs (e.g., en-us).
         * In case of failure, the <code>fail</code> function of the jQuery.promise object is called.
         * The first item is the browser language - e.g. {"Browser Language":"en-us"}
         * @returns {object}
         *  Promise object.
         *
         * @private
         */
        this.getLanguageList = function () {
            if (mAdapterPromises.languageList) {
                return mAdapterPromises.languageList;
            }
            var oPromise = oAdapter.getLanguageList();
            mAdapterPromises.languageList = oPromise;
            oPromise.fail(function () {
                Log.error("getLanguageList failed");
            });
            return oPromise;
        };

        /**
         * Returns the list of User Profile Property ValueLists .
         * In case of success, the <code>done</code> function returns an object
         * @returns {object}
         *  jQuery.promise object.
         *
         * @private
         */
        this.getUserSettingList = function () {
            if (mAdapterPromises.userSettingList) {
                return mAdapterPromises.userSettingList;
            }
            var oPromise = oAdapter.getUserProfilePropertyValueLists();
            mAdapterPromises.userSettingList = oPromise;
            oPromise.fail(function () {
                Log.error("getUserProfilePropertyValueLists failed");
            });
            return oPromise;
        };

        /**
         * Returns if the adapter supports editing User profile value list
         * @returns {boolean} true if the adapter allows it, false otherwise
         *
         * @private
         */
        this.getUserSettingListEditSupported = function () {
            if (typeof oAdapter.getUserProfilePropertyValueLists !== "undefined") {
                return true;
            }
            return false;
        };
    }

    UserInfo.hasNoAdapter = false;
    return UserInfo;
}, true /* bExport */);
