// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's user activity service.
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ushell/utils",
    "sap/base/util/ObjectPath",
    "./_UserRecents/RecentsList",
    "./_UserRecents/RecentActivity",
    "./_UserRecents/RecentAppsUsage"
], function (
    BaseObject,
    utils,
    ObjectPath,
    RecentsList,
    RecentActivity,
    RecentAppsUsage
) {
    "use strict";

    /**
     * @alias sap.ushell.services.UserRecents
     * @class
     * @classdesc The Unified Shell's user recents service.
     * Manages recent searches and recently viewed apps.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("UserRecents")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.15.0
     * @private
     */
    var UserRecents = BaseObject.extend("sap.ushell.services.UserRecents", {
        constructor: function () {
            this.oRecentSearches = new RecentsList("RecentSearches", 10, UserRecents._compareSearchItems);
            this.oRecentDataSources = new RecentsList("RecentDataSources", 6, UserRecents._compareDataSources);
            this.oRecentApps = new RecentsList("RecentApps", 6, UserRecents._compareApps);

            this.oRecentActivity = new RecentActivity(500);
            this.oAppsUsage = new RecentAppsUsage();
        }
    });

    /**
     * Checks if the given search items are equivalent.
     *
     * @param {object} a The first search item to be checked.
     * @param {object} b The second search item to be checked.
     * @returns {boolean} True if both search item are equivalent, otherwise false.
     * @static
     * @private
     */
    UserRecents._compareSearchItems = function (a, b) {
        var bResult = false;

        if (a.oDataSource && b.oDataSource) {
            if (a.oDataSource.objectName && b.oDataSource.objectName) {
                bResult = ((a.sTerm === b.sTerm) && (a.oDataSource.objectName.value === b.oDataSource.objectName.value));
            }
            if (!a.oDataSource.objectName && !b.oDataSource.objectName) {
                bResult = (a.sTerm === b.sTerm);
            }
        }

        if (!a.oDataSource && !b.oDataSource) {
            bResult = (a.sTerm === b.sTerm);
        }

        return bResult;
    };

    /**
     * Checks if the given data sources are equivalent.
     *
     * @param {object} a The first data source to be checked.
     * @param {object} b The second data source to be checked.
     * @returns {boolean} True if both data sources are equivalent, otherwise false.
     * @static
     * @private
     */
    UserRecents._compareDataSources = function (a, b) {
        if (a.objectName && b.objectName) {
            return a.objectName.value === b.objectName.value;
        }
        return false;
    };

    /**
     * Checks if the given applications are equivalent.
     *
     * @param {object} a The first app to be checked.
     * @param {object} b The second app to be checked.
     * @returns {boolean} True if both applications are equivalent, otherwise false.
     * @static
     * @private
     */
    UserRecents._compareApps = function (a, b) {
        return a.semanticObject === b.semanticObject && a.action === b.action;
    };

    /**
     * Adds the given activity item to the list of activities.
     *
     * @param {object} oActionItem The activity to be added.
     * @returns {Promise} A Promise that is resolved to the list of updated activities.
     * @since 1.32.0
     * @public
     * @alias sap.ushell.services.UserRecents#addActivity
     */
    UserRecents.prototype.addActivity = function (oActionItem) {
        return new Promise((resolve, reject) => {
            this.oRecentActivity.newItem(oActionItem)
                .then(() => {
                    this.oRecentActivity.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    /**
     * Clears the list of activities.
     *
     * @since 1.54.0
     * @returns {Promise} A promise that is resolved once all activities are cleared.
     * @public
     * @alias sap.ushell.services.UserRecents#clearRecentActivities
     */
    UserRecents.prototype.clearRecentActivities = function () {
        return this.oRecentActivity.clearAllActivities();
    };

    /**
     * Resolves to the list of activities.
     *
     * @returns {Promise} A Promise that is resolved to the list of activities.
     * @since 1.32.0
     * @public
     * @alias sap.ushell.services.UserRecents#getRecentActivity
     */
    UserRecents.prototype.getRecentActivity = function () {
        return this.oRecentActivity.getRecentItems();
    };

    /**
     * @returns {Promise} A Promise that is resolved to a list of frequently used activities.
     * @since 1.42.0
     * @public
     * @alias sap.ushell.services.UserRecents#getFrequentActivity
     */
    UserRecents.prototype.getFrequentActivity = function () {
        return this.oRecentActivity.getFrequentItems();
    };

    /**
     * Notification that the given data source has just been used.
     * Adds the search to the LRU list of data sources.
     *
     * @param {object} oDataSource The data source identified by the string parameter <code>objectName.value</code>
     * @returns {Promise} A Promise that is resolved to the list of updated entries for data sources.
     * @since 1.19.0
     * @deprecated since 1.93. Please use {@link #addDataSourceActivity} instead.
     * @public
     * @alias sap.ushell.services.UserRecents#noticeDataSource
     */
    UserRecents.prototype.noticeDataSource = function (oDataSource) {
        var sObjectNameValue = ObjectPath.get("objectName.value", oDataSource) || "";
        var sObjectName = ObjectPath.get("objectName", oDataSource) || "";
        var bValueIsAll = sObjectNameValue.toLowerCase() === "$$all$$";
        var bObjectNameIsAll = sObjectName.toLowerCase() === "$$all$$";

        // Don't save $$ALL$$
        if (!bValueIsAll && !bObjectNameIsAll) {
            this.oRecentDataSources.newItem(oDataSource)
                .then(() => new Promise((resolve, reject) => {
                    this.oRecentDataSources.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                }));
        }

        return this.oRecentDataSources.getRecentItems();
    };

    /**
     * Notifies the service that the given data source has been used recently.
     *
     * @param {object} oDataSource The data source identified by the string parameter <code>objectName.value</code>
     * @returns {Promise} A Promise that is resolved to the list of updated entries for data sources.
     * @since 1.93.0
     * @public
     * @alias sap.ushell.services.UserRecents#addDataSourceActivity
     */
    UserRecents.prototype.addDataSourceActivity = function (oDataSource) {
        const sObjectNameValue = ObjectPath.get("objectName.value", oDataSource) || "";
        const sObjectName = ObjectPath.get("objectName", oDataSource) || "";
        const bValueIsAll = sObjectNameValue.toLowerCase() === "$$all$$";
        const bObjectNameIsAll = sObjectName.toLowerCase() === "$$all$$";

        // Don't save $$ALL$$
        if (!bValueIsAll && !bObjectNameIsAll) {
            return new Promise((resolve, reject) => {
                this.oRecentDataSources.newItem(oDataSource)
                    .then(() => {
                        this.oRecentDataSources.getRecentItems()
                            .then(resolve)
                            .catch(reject);
                    })
                    .catch(reject);
            });
        }

        return this.oRecentDataSources.getRecentItems();
    };

    /**
     * Returns the list of recently used data sources.
     *
     * @returns {Promise} A Promise that is resolved to the list of updated entries for data sources.
     * @since 1.19.0
     * @public
     * @alias sap.ushell.services.UserRecents#getRecentDataSources
     */
    UserRecents.prototype.getRecentDataSources = function () {
        return this.oRecentDataSources.getRecentItems();
    };

    /**
     * Notification that the given search item has just been used.
     * Adds the search to the list of recently done searches.
     *
     * @param {object} oSearchItem The search item identified by the string parameter <code>sTerm</code>
     * @returns {Promise} A Promise that is resolved to the updated list of recent searches.
     * @since 1.15.0
     * @deprecated since 1.93. Please use {@link #addSearchActivity} instead.
     * @public
     * @alias sap.ushell.services.UserRecents#noticeSearch
     */
    UserRecents.prototype.noticeSearch = function (oSearchItem) {
        return new Promise((resolve, reject) => {
            this.oRecentSearches.newItem(oSearchItem)
                .then(() => {
                    this.oRecentSearches.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    /**
     * Notifies the service that the given search item has been used recently.
     *
     * @param {object} oSearchItem The search item identified by the string parameter <code>sTerm</code>
     * @returns {Promise} A Promise that is resolved to the updated list of recent searches.
     * @since 1.93.0
     * @public
     * @alias sap.ushell.services.UserRecents#addSearchActivity
     */
    UserRecents.prototype.addSearchActivity = function (oSearchItem) {
        return new Promise((resolve, reject) => {
            this.oRecentSearches.newItem(oSearchItem)
                .then(() => {
                    this.oRecentSearches.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    /**
     * Returns the list of recently done searches.
     *
     * @returns {Promise} A Promise that is resolved to the list of recent searches.
     * @since 1.15.0
     * @public
     * @alias sap.ushell.services.UserRecents#getRecentSearches
     */
    UserRecents.prototype.getRecentSearches = function () {
        return this.oRecentSearches.getRecentItems();
    };

    /**
     * Notification that the given app item has just been used.
     * Adds the search to the list of recently done searches.
     *
     * @param {object} oAppItem The app item identified by the string parameter <code>id</code>
     * @returns {Promise} A Promise that is resolved to the updated list of recent apps.
     * @since 1.15.0
     * @deprecated since 1.93. Please use {@link #addAppActivity} instead.
     * @public
     * @alias sap.ushell.services.UserRecents#noticeApp
     */
    UserRecents.prototype.noticeApp = function (oAppItem) {
        return new Promise((resolve, reject) => {
            this.oRecentApps.newItem(oAppItem)
                .then(() => {
                    this.oRecentApps.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    /**
     * Notifies the service that the given app item has been used recently.
     *
     * @param {object} oAppItem The app item identified by the string parameter <code>id</code>
     * @returns {Promise} A Promise that is resolved to the updated list of recent apps.
     * @since 1.93.0
     * @public
     * @alias sap.ushell.services.UserRecents#addAppActivity
     */
    UserRecents.prototype.addAppActivity = function (oAppItem) {
        return new Promise((resolve, reject) => {
            this.oRecentApps.newItem(oAppItem)
                .then(() => {
                    this.oRecentApps.getRecentItems()
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    /**
     * Returns the list of recently used apps.
     *
     * @returns {Promise} A Promise that is resolved to the list of recent apps.
     * @since 1.15.0
     * @public
     * @alias sap.ushell.services.UserRecents#getRecentApps
     */
    UserRecents.prototype.getRecentApps = function () {
        return this.oRecentApps.getRecentItems();
    };

    /**
     * Increment usage count for the given hash.
     * Currently called on openApp event.
     *
     * @param {string} hash The hash for the app for which a usage should be registered.
     */
    UserRecents.prototype.addAppUsage = function (hash) {
        var sRelevantHash = utils.getBasicHash(hash);

        this.oAppsUsage.addAppUsage(sRelevantHash);
    };

    /**
     * API function for the New VD 1 - user action Collector
     * Returns a map of total usage of all (used) applications, plus the maximum and minimum values.
     *
     * @returns {Promise} A Promise that is resolved to an object containing usage-per-hash map and the minimum and maximum values.
     */
    UserRecents.prototype.getAppsUsage = function () {
        return this.oAppsUsage.getAppsUsage();
    };

    UserRecents.hasNoAdapter = true;
    return UserRecents;
});
