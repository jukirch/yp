// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's Search for myHome.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ushell/utils/WindowUtils",
    "sap/ushell/EventHub",
    "sap/base/util/deepExtend",
    "sap/ushell/utils/UrlParsing"
], function (Log, WindowUtils, EventHub, deepExtend, UrlParsing) {
    "use strict";

    var EMPTY_SEARCH_RESULTS = {
        count: 0,
        data: []
    };

    /**
     * @alias sap.ushell.services.SearchCEP
     * @class
     * @classdesc The Unified Shell's search service for CEP myHome.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("SearchCEP")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     *
     * @param {object} oAdapter the service adapter for the search service, as already provided by the container
     * @param {object} oContainerInterface oContainerInterface
     * @param {string} sParameter sParameter
     * @param {object} oConfig oConfig
     *
     * @hideconstructor
     *
     * @since 1.101.0
     * @private
     */
    function SearchCEP (oAdapter, oContainerInterface, sParameter, oConfig) {
        this.oAdapter = oAdapter;
        this._mSearchProviders = {
            default: {},
            external: {}
        };
    }

    SearchCEP.prototype.suggest = function (oParameters) {
        return this.search(oParameters);
    };

    /**
     * @typedef SearchResults
     * @type {object}
     * @property {int} count the total number of results
     * @property {object[]} data an array of search results
     */

    /**
     * Execute the search.
     *
     * @param {object} oParameters the parameters for the search.
     * @param {string} oParameters.searchTerm the search term.
     * @param {int} [oParameters.skip] (optional) the specified number of results are skipped.
     * @param {int} [oParameters.top]
     *                  (optional) only the specified top (first) results are returned.
     * @param {object|sap.ui.model.Filter} [oParameters.filter] (optional) the filter json configuration or Filter object.
     *    Defined as json (expected by sap.ui.model.Filter) or as a sap.ui.model.Filter instance
     * @param {object|sap.ui.model.Sorter} [oParameters.sort] (optional) the sorter json configuration or Sorter object
     *    Defined as json (expected by sap.ui.model.Sorter) or as a sap.ui.model.Sorter instance
     *
     * @returns {Promise<SearchResults>} Promise resolving the search results
     *
     * @private
     * @since 1.115.0
     */
    SearchCEP.prototype.search = function (oParameters) {
        if (typeof (this.oAdapter.search) === "function") {
            return this.oAdapter.search(oParameters);
        }

        return Promise.resolve(EMPTY_SEARCH_RESULTS);
    };

    /**
     * Navigate to the search result.
     * <p>
     * This is a convenience method for navigating to the search result. It either
     * delegates to the {@link sap.ushell.services.CrossApplicationNavigation#toExternal}
     * method for intent-based-navigation or opens the URL of the search result in a new window.
     *
     * If the search result does not contain a <code>url</code> property, nothing is done.
     *
     * @param {object} oSearchResult a single result object retrieved from the search or suggest method.
     * @param {string} oSearchResult.url the URL of the search result.
     * @param {string} [sSearchTerm] optional parameter for passing the search term. If the result URL
     *      is an intent-based-navigation intent, this will be added as parameter <code>searchTerm</code>.
     *      Can be used for launching external search apps.
     *
     * @returns {Promise<undefined>} A <code>Promise</code> which resolves once the navigation was triggered.
     *  The <code>Promise</code> might never reject or resolve when an error occurs during the navigation.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.navigate = function (oSearchResult, sSearchTerm) {
        var sUrl = oSearchResult.url;
        var oShellHash;

        if (!sUrl) {
            return Promise.resolve();
        }
        EventHub.emit("UITracer.trace", {
            reason: "LaunchApp",
            source: "Search",
            data: {
                targetUrl: sUrl
            }
        });
        if (sUrl.startsWith("#")) {
            if (sSearchTerm) {
                oShellHash = UrlParsing.parseShellHash(sUrl);
                if (oShellHash) {
                    oShellHash.params.searchTerm = sSearchTerm;
                    sUrl = UrlParsing.constructShellHash(oShellHash);
                }
            }

            return sap.ushell.Container.getServiceAsync("Navigation").then(function (oNavigationService) {
                return oNavigationService.navigate({
                    target: {
                        shellHash: sUrl
                    }
                });
            });
        }

        WindowUtils.openURL(sUrl);
        return Promise.resolve();
    };

    /**
     * Register default search providers.
     *
     * Used internally to support the generic way of handling both default and external providers.
     * Accepts a default provider configuration as defined in SearchProvider.js
     *
     * @param {object} oProviderConfig parameters for building a List.
     * @returns {Promise} resolved Promise.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype._registerDefaultSearchProvider = function (oProviderConfig) {
        var oProvider = deepExtend(oProviderConfig);
        oProvider.name = oProvider.id.replace(/\./g, "_");
        this._mSearchProviders.default[oProvider.id] = oProvider;

        return Promise.resolve();
    };

    /**
     * Register external search provider (add a custom Suggestion section to the SearchCEP popover).
     *
     * Adds an external search provider configuration to the list of providers
     * and notifies the Controller to update the order of Suggestion sections in the SearchCEP popover.
     *
     * @param {object} oProviderConfig parameters for building a list, for example
     * <pre>
     *   {
     *          id: "travelAppsList" -> required parameter
     *          title: "Your travel assistant" -> required parameter
     *          titleVisible: true
     *          execSearch: function(sQuery) { -> required parameter
     *             return Promise.resolve([{
     *                  icon: "sap-icon://flight",
     *                  text: "Check popular destinations", ("title" or "label" can be used instead of "text" as the parameter name)
     *                  press: function (oEvent) {
     *                      window.open("");
     *                  }
     *              }, {
     *                  icon: "sap-icon://suitcase",
     *                  text: "Book flights & hotels",
     *                  press: function (oEvent) {
     *                      window.open("");
     *                  }
     *              }, {
     *                  icon: "sap-icon://employee-lookup",
     *                  text: "Hire local guides",
     *                  press: function (oEvent) {
     *                      window.open("");
     *                  }
     *              }]);
     *         },
     *         popoverClosed: function(oEvent) -> triggered after the SearchCEP popover is closed
     *         itemPress: function(oEvent) -> triggered on selection of any item (always triggered before the item's "press" event callback if there is one)
     *         minQueryLength: 3 -> only trigger suggestions if typed string length => the value
     *         maxQueryLength: 100 -> only trigger suggestions if typed string length <= the value
     *         defaultItemCount: number 1-5 (default 3)
     *         maxItemCount: number 6-15 (if not passed, the "More" button isn't displayed)
     *         priority: 101-1000 -> sort order for the Lists in the SearchCEP popover (up to 100 is reserved for default providers)
     *   }
     * </pre>
     *
     * If a configuration object is missing required properties, the Promise is rejected.
     * All other optional missing properties will be filled with default values.
     *
     * @returns {Promise} resolved/rejected Promise.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.registerExternalSearchProvider = function (oProviderConfig) {
        var oProvider = deepExtend(oProviderConfig);
        var fnNoOpFunction = Function.prototype;
        var oParameterCheck = {
            id: "SearchProvider needs an id",
            title: "SearchProvider needs a title",
            execSearch: "SearchProvider needs an execSearch callback"
        };
        var oDefaults = {
            minQueryLength: 1,
            maxQueryLength: 100,
            defaultItemCount: 3,
            maxItemCount: 10,
            priority: 10,
            closePopover: true,
            itemPress: fnNoOpFunction,
            popoverClosed: fnNoOpFunction
        };

        for (var sKey in oParameterCheck) {
            if (!oProvider[sKey]) {
                Log.error(oParameterCheck[sKey]);
                return Promise.reject();
            }
        }

        for (var sParameter in oDefaults) {
            if (!oProvider.hasOwnProperty(sParameter)) {
                oProvider[sParameter] = oDefaults[sParameter];
            }
        }

        oProvider.name = oProvider.id.replace(/\./g, "_");
        this._mSearchProviders.external[oProvider.id] = oProvider;
        EventHub.emit("updateExtProviderLists", Date.now());

        return Promise.resolve();
    };

    /**
     * Unregister an external search provider (remove the custom Suggestion section from the SearchCEP popover).
     *
     * Removes an external search provider configuration from the list of providers
     * and notifies the controller to update the order of Suggestion sections in the SearchCEP popover.
     *
     * @param {string} sProviderId external search provider ID (List ID) to remove.
     * @returns {Promise} resolved Promise.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.unregisterExternalSearchProvider = function (sProviderId) {
        if (this._mSearchProviders.external[sProviderId]) {
            delete this._mSearchProviders.external[sProviderId];
        }
        EventHub.emit("updateExtProviderLists", Date.now());
        return Promise.resolve();
    };

    /**
     * Returns all search providers grouped by their category.
     *
     * @returns {Promise} Promise resolving object of all registered search providers by category.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.getSearchProviders = function () {
        return Promise.resolve(deepExtend(this._mSearchProviders));
    };

    /**
     * Returns all search providers sorted by priority.
     *
     * @returns {Promise} Promise resolving array of all registered search providers sorted by priority.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.getSearchProvidersPriorityArray = function () {
        var aSorted = [];

        for (var sKey in this._mSearchProviders) {
            aSorted.push.apply(aSorted, Object.values(this._mSearchProviders[sKey]));
        }
        aSorted.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return Promise.resolve(aSorted);
    };

    /**
     * Returns all external search providers sorted by priority.
     *
     * @returns {Promise} Promise resolving array of all external registered search providers sorted by priority.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.getExternalSearchProvidersPriorityArray = function () {
        var aSorted = [];

        for (var sItem in this._mSearchProviders.external) {
            aSorted.push(this._mSearchProviders.external[sItem]);
        }
        aSorted.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return Promise.resolve(aSorted);
    };

    /**
     * Returns all default search providers.
     *
     * @returns {Promise} Promise resolving array of all default registered search providers.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.getDefaultSearchProviders = function () {
        var aDefaultProviders = Object.values(this._mSearchProviders.default);
        return Promise.resolve(aDefaultProviders);
    };

    /**
     * Returns all external search providers.
     *
     * @returns {Promise} Promise resolving array of all external registered search providers.
     *
     * @private
     * @since 1.116.0
     */
    SearchCEP.prototype.getExternalSearchProviders = function () {
        var aExternalProviders = Object.values(this._mSearchProviders.external);
        return Promise.resolve(aExternalProviders);
    };

    SearchCEP.hasNoAdapter = false;
    return SearchCEP;
}, true /* bExport */);
