// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's search service which provides Enterprise Search via SINA.
 * @version 1.120.1
 */
sap.ui.define([], function () {
    "use strict";

    /**
     * @alias sap.ushell.services.Search
     * @class
     * @classdesc The Unified Shell's Search service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("Search")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @private
     */
    function Search (oAdapter, oContainerInterface) {
        this.init.apply(this, arguments);
    }

    Search.prototype = {

        init: function (oAdapter, oContainerInterface, sParameter, oServiceProperties) {
            this.oAdapter = oAdapter;
            this.oContainerInterface = oContainerInterface;
            this.appSearchDeferred = null;
        },

        getAppSearch: function () {
            if (this.appSearchPromise) {
                return this.appSearchPromise;
            }

            this.appSearchPromise = new Promise(function (resolve) {
                sap.ui.getCore().loadLibrary("sap.esh.search.ui", { async: true }).then(function () {
                    sap.ui.require(["sap/esh/search/ui/appsearch/AppSearch"], function (AppSearch) {
                        resolve(new AppSearch({}));
                    });
                });
            });

            return this.appSearchPromise;
        },

        isSearchAvailable: function () {
            return this.oAdapter.isSearchAvailable();
        },

        prefetch: function () {
            return this.getAppSearch().then(function (appSearch) {
                return appSearch.prefetch();
            });
        },

        queryApplications: function (query) {
            query.top = query.top || 10;
            query.skip = query.skip || 0;
            return this.getAppSearch().then(function (appSearch) {
                return appSearch.search(query).then(function (searchResult) {
                    return {
                        totalResults: searchResult.totalCount,
                        searchTerm: query.searchTerm,
                        getElements: function () {
                            return searchResult.tiles;
                        }
                    };
                });
            });
        }
    };

    Search.hasNoAdapter = false;
    return Search;
}, true /* bExport */);
