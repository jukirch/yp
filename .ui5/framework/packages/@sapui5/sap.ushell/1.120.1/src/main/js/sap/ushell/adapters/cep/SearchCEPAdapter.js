// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's Search adapter for CEP applications (client-side search).
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/utils/UrlParsing",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter"
], function (
    UrlParsing,
    JSONModel,
    Filter,
    Sorter
) {
    "use strict";
    /**
     * The Unified Shell's Search adapter for SAP Start (client-side search).
     * This constructor will be initialized when requesting the corresponding service.
     * Do NOT initialize directly.
     *
     * @param {object} oSystem  The system served by the adapter
     * @param {string} sParameters Parameter string, not in use (legacy, was used before oAdapterConfiguration was added)
     * @param {object} oConfig A potential Adapter Configuration
     * @class
     *
     * @since 1.115.0
     * @private
     */
    var SearchCEPAdapter = function (oSystem, sParameters, oConfig) {
    };

     /**
     * Searching applications via the a client side search service.
     *
     * @param {object} oParameters The parameters for the search
     * @param {string} oParameters.searchTerm The search term
     * @param {int} [oParameters.skip] (optional) the specified number of results are skipped.
     * @param {int} [oParameters.top]
     *                  (optional) only the specified top (first) results are returned.
     * @param {object|sap.ui.model.Filter} [oParameters.filter] (optional) the filter json configuration or Filter object.
     *    Defined as json (expected by sap.ui.model.Filter) or as a sap.ui.model.Filter instance
     * @param {object|sap.ui.model.Sorter} [oParameters.sort] (optional) the sorter json configuration or Sorter object
     *    Defined as json (expected by sap.ui.model.Sorter) or as a sap.ui.model.Sorter instance
     *
     * @returns {Promise} Promise resolving the search result (array of application objects)
     *
     * @private
     * @since 1.115.0
     */
    SearchCEPAdapter.prototype.search = function (oParameters) {
        return this._searchWithSearchableContentAndJsSearch(oParameters);
    };

    /*
     * Search using the SearchableContent service and the jsSearch implementation
     */
    SearchCEPAdapter.prototype._searchWithSearchableContentAndJsSearch = function (oParameters) {

        return Promise.all([this._getNormalizedSearchableContentApps(oParameters), this._loadJsSearchModule()]).then(function (aPromiseResults) {
            var aNormalizedSearchableContentApps = aPromiseResults[0];
            var JsSearch = aPromiseResults[1];
            var oSearchEngine = new JsSearch({
                objects: aNormalizedSearchableContentApps,
                fields: ["title", "label", "description", "keywords"],
                shouldNormalize: !String.prototype.normalize,
                algorithm: {
                    id: "contains-ranked",
                    options: [50, 49, 40, 39, 5, 4, 51]
                }
            });
            var oSearchOptions = {
                searchFor: oParameters && oParameters.searchTerm || "*", // set wildcard if no search term specified
                top: Number.MAX_SAFE_INTEGER, // apply pagination after search due to filtering
                skip: 0
            };
            var oSearchResult = oSearchEngine.search(oSearchOptions);
            var aResultData = oSearchResult.results.map(function (o) {
                return o.object;
            });

            return this._getPaginatedResult(
                this._applyFiltersAndSorter(aResultData, oParameters.filter, oParameters.sort),
                oParameters.skip || 0,
                oParameters.top || 10
            );

        }.bind(this));
    };

    SearchCEPAdapter.prototype._getPaginatedResult = function (aResultData, iSkip, iTop) {
        return {
            data: aResultData.slice(iSkip, iSkip + iTop),
            count: aResultData.length
        };
    };

    SearchCEPAdapter.prototype._getSearchableContent = function (oParameters) {
        var oSearchableContentParameters = oParameters && {
            includeAppsWithoutVisualizations: !!oParameters.includeAppsWithoutVisualizations,
            enableVisualizationPreview: oParameters.enableVisualizationPreview !== false
        };

        return sap.ushell.Container.getServiceAsync("SearchableContent")
            .then(function (oService) {
                return oService.getApps(oSearchableContentParameters);
            });
    };

    SearchCEPAdapter.prototype._getNormalizedSearchableContentApps = function (oParameters) {
        return this._getSearchableContent(oParameters).then(function (aApps) {
            return this._normalizeSearchableContentServiceResult(aApps);
        }.bind(this));
    };

    SearchCEPAdapter.prototype._normalizeSearchableContentServiceResult = function (aApps) {
        if (!Array.isArray(aApps)) {
            aApps = [];
        }
        var aResultApps = [];
        var title;
        var description;
        var label;

        aApps.forEach(function (oApp) {
            if (oApp.visualizations && oApp.visualizations.length > 0) {
                oApp.visualizations.forEach(function (oVis) {
                    title = (oVis.vizConfig && oVis.vizConfig["sap.app"] && oVis.vizConfig["sap.app"].title) || oVis.title || oApp.title;
                    description = (oVis.vizConfig && oVis.vizConfig["sap.app"] && oVis.vizConfig["sap.app"].subTitle) || oVis.subtitle || oApp.subtitle;
                    label = description ? title + " - " + description : title;

                    aResultApps.push({
                        title: title,
                        description: description,
                        keywords: Array.isArray(oVis.keywords) ? oVis.keywords.join(" ") : "",
                        icon: oVis.icon || "",
                        label: label,
                        visualization: oVis,
                        url: oVis.targetURL,
                        technicalAttributes: Array.isArray(oApp.technicalAttributes) ? oApp.technicalAttributes.join(" ") : ""
                    });
                });
            } else {
                title = oApp.title;
                description = oApp.subtitle;
                label = description ? title + " - " + description : title;

                aResultApps.push({
                    title: title,
                    description: description,
                    keywords: Array.isArray(oApp.keywords) ? oApp.keywords.join(" ") : "",
                    icon: oApp.icon || "",
                    label: label,
                    url: oApp.targetURL,
                    technicalAttributes: Array.isArray(oApp.technicalAttributes) ? oApp.technicalAttributes.join(" ") : ""
                });
            }
        });
        return aResultApps;
    };

    SearchCEPAdapter.prototype._loadJsSearchModule = function () {

        this._loadJsSearchModulePromise = new Promise(function (resolve) {
            // always load the library first to ensure async loading
            // (even if the JsSearch module is self-contained)
            sap.ui.getCore().loadLibrary("sap.esh.search.ui", { async: true }).then(function () {
                sap.ui.require(["sap/esh/search/ui/appsearch/JsSearch"], function (JsSearch) {
                    resolve(JsSearch);
                });
            });
        });

        return this._loadJsSearchModulePromise;
    };

    /**
     * Creates an array of sap.ui.model.Filter instances from the given configuration.
     *
     * @param {object|sap.ui.model.Filter} vFilters the filter json configuration or Filter object.
     *    Defined as json (expected by sap.ui.model.Filter) or as a sap.ui.model.Filter instance
     * @returns {sap.ui.model.Filter[]} Array or filter instances
     *
     * @private
     * @since 1.115.0
     */
     SearchCEPAdapter.prototype._createFilters = function (vFilters) {
        var aFilters = null;
        if (vFilters) {
            if (typeof vFilters === "object") {
                if (Array.isArray(vFilters.filters)) {
                    vFilters.filters = vFilters.filters.map(function (oFilter) {
                        return oFilter instanceof Filter ? oFilter : new Filter(oFilter);
                    });
                }
                aFilters = [vFilters instanceof Filter ? vFilters : new Filter(vFilters)];
            }
        }
        return aFilters;
    };

    /**
     * Creates an array of sap.ui.model.Sorter instances from the given configuration.
     *
     * @param {object|sap.ui.model.Sorter} vSorter the sorter json configuration or Sorter object
     *    Defined as json (expected by sap.ui.model.Sorter) or as a sap.ui.model.Sorter instance
     * @returns {sap.ui.model.Sorter[]} Array or sorter instances
     *
     * @private
     * @since 1.115.0
     */
    SearchCEPAdapter.prototype._createSorters = function (vSorter) {
        var aSorters = null;
        if (vSorter) {
            if (typeof vSorter === "object" && !Array.isArray(vSorter)) {
                vSorter = [vSorter];
            }
            if (Array.isArray(vSorter)) {
                aSorters = vSorter.map(function (oSorter) {
                    return oSorter instanceof Sorter ? oSorter : new Sorter(oSorter);
                });
            }
        }
        return aSorters;
    };

    /**
     * Applies filters and sorters to given data.
     * The maximum number of data to be filtered and sorted is Number.MAX_SAFE_INTEGER
     *
     * @param {object[]} aData the data to be filtered and/or sorted
     * @param {object|sap.ui.model.Filter} vFilters the filter json configuration or Filter object.
     *    Defined as json (expected by sap.ui.model.Filter) or as a sap.ui.model.Filter instance
     * @param {object|sap.ui.model.Sorter} vSorter the sorter json configuration or Sorter object
     *    Defined as json (expected by sap.ui.model.Sorter) or as a sap.ui.model.Sorter instance
     * @returns {object[]} The filtered and sorted data array
     *
     * @private
     * @since 1.115.0
     */
    SearchCEPAdapter.prototype._applyFiltersAndSorter = function (aData, vFilters, vSorter) {
        if (!vFilters && !vSorter) {
            return aData;
        }
        var aFilters = this._createFilters(vFilters),
            aSorters = this._createSorters(vSorter),
            oModel = new JSONModel();
        oModel.setSizeLimit(Number.MAX_SAFE_INTEGER);
        oModel.setData(aData);
        return oModel.bindList("/", null, aSorters, aFilters).getContexts().map(function (oContext) {
            return oContext.getObject();
        });
    };

    return SearchCEPAdapter;
}, false);
