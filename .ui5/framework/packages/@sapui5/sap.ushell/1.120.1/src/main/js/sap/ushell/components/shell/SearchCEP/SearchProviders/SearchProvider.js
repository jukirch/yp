// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview This module is the search provider main interface
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/resources",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/FrequentActivityProvider",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/RecentSearchProvider",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/SearchServiceProvider"
], function (
    resources,
    FrequentActivityProvider,
    RecentSearchProvider,
    SearchServiceProvider
) {
    "use strict";

    var SearchProvider = {};

    SearchProvider.defaultProviders = {
        applications: {
            id: "SearchResultList",
            entryType: "app",
            title: "Applications",
            showNoData: true,
            titleVisible: false,
            highlightResult: true,
            highlightSearchStringPart: true,
            minQueryLength: 1,
            maxQueryLength: 100,
            defaultItemCount: 6,
            maxItemCount: 12,
            priority: 0,
            execSearch: SearchServiceProvider.execSearch
        },

        frequentApplications: {
            id: "FrequentlyUsedAppsList",
            entryType: "product",
            title: resources.i18n.getText("frequentAppsCEPSearch"),
            titleVisible: true,
            minQueryLength: 0,
            maxQueryLength: 0,
            defaultItemCount: 6,
            maxItemCount: 12,
            priority: 1,
            execSearch: FrequentActivityProvider.execSearch
        },

        recentSearches: {
            id: "SearchHistoryList",
            entryType: "app",
            title: "Recent Searches",
            titleVisible: false,
            minQueryLength: 0,
            maxQueryLength: 0,
            defaultItemCount: 2,
            maxItemCount: 10,
            priority: 0,
            execSearch: RecentSearchProvider.execSearch
        },

        homePageApplications: {
            id: "ProductsList",
            entryType: "app",
            title: resources.i18n.getText("products"),
            titleVisible: true,
            minQueryLength: 0,
            maxQueryLength: 0,
            defaultItemCount: 6,
            maxItemCount: 12,
            priority: 2,
            execSearch: SearchServiceProvider.execSearch
        },

        externalSearchApplications: {
            id: "ExternalSearchAppsList",
            entryType: "app",
            title: resources.i18n.getText("searchWithin"),
            titleVisible: true,
            minQueryLength: 1,
            maxQueryLength: 100,
            defaultItemCount: 6,
            maxItemCount: 12,
            priority: 2,
            execSearch: SearchServiceProvider.execSearch
        }
    };

    return SearchProvider;
}, false);
