// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log"
], function (Log) {
    "use strict";

    /**
     * @class
     * @since 1.101.0
     * @private
     */
    var RecentSearchProvider = function () {};

    /**
     * returns the name of the search provider
     *
     * @returns {string} the name of the provider
     *
     * @since 1.101.0
     * @private
     */
    RecentSearchProvider.prototype.getName = function () {
        return "Recent Search Terms Provider";
    };

    /**
     * provide the recent searches
     *
     * @returns {Promise} when resolved, contains the search result array
     *
     * @since 1.101.0
     * @private
     */
    RecentSearchProvider.prototype.execSearch = function () {
        return sap.ushell.Container.getServiceAsync("UserRecents").then(function (UserRecentsService) {
            return UserRecentsService.getRecentSearches().then(function (aRecents) {
                var aFinalResult = [];
                if (Array.isArray(aRecents) && aRecents.length > 0) {
                    aFinalResult = aRecents.map(
                        function (item) {
                            return {
                                text: item.sTerm,
                                icon: item.icon || "sap-icon://history"
                            };
                        });
                }

                return aFinalResult;
            }, function (sError) {
                Log.error("Recent Search Terms Provider failed", "error: " + sError, "sap.ushell.components.shell.SearchCEP.SearchProviders.RecentSearchProvider::execSearch");
                return [];
            });
        });
    };

    return new RecentSearchProvider();
}, false);
