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
    var FrequentActivityProvider = function () {};

    /**
     * returns the name of the search provider
     *
     * @returns {string} the name of the provider
     *
     * @since 1.101.0
     * @private
     */
    FrequentActivityProvider.prototype.getName = function () {
        return "Frequent Activity Provider";
    };

    /**
     * provide the frequent activity of the user
     *
     * @returns {Promise} when resolved, contains the frequent activity array
     *
     * @since 1.101.0
     * @private
     */
    FrequentActivityProvider.prototype.execSearch = function (sQuery, sGroupName) {
        return sap.ushell.Container.getServiceAsync("UserRecents").then(function (UserRecentsService) {
            return UserRecentsService.getFrequentActivity().then(function (oRecents) {
                var aFinalResult = [],
                    oMapping = {
                        frequentApplications: {
                            "Application": {
                                icon: "sap-icon://SAP-icons-TNT/application"
                            },
                            "External Link": {
                                icon: "sap-icon://internet-browser"
                            }
                        },
                        frequentProducts: {
                            "Product": {
                                icon: "sap-icon://product"
                            }
                        }
                    };

                if (oRecents && Array.isArray(oRecents) && oRecents.length > 0) {

                    aFinalResult = oRecents.filter(function (item) {
                        return oMapping[sGroupName].hasOwnProperty(item.appType);
                    }).map(function (item) {
                        item.text = item.text || item.title;
                        item.icon = item.icon || oMapping[sGroupName][item.appType].icon;
                        return item;
                    });
                }

                return aFinalResult;
            }, function (sError) {
                Log.error("Frequent Activity Provider failed", "error: " + sError, "sap.ushell.components.shell.SearchCEP.SearchProviders.FrequentActivityProvider::execSearch");
                return [];
            });
        });
    };

    return new FrequentActivityProvider();
}, false);
