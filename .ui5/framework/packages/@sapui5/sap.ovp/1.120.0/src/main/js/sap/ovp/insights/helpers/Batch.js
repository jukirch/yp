/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/fe/navigation/SelectionVariant",
    "sap/ui/model/Filter",
    "sap/ovp/insights/helpers/Filters",
    "sap/ovp/app/FilterHelper",
    "sap/base/security/encodeURL",
    "sap/ovp/cards/CommonUtils",
    "sap/ui/model/odata/ODataUtils",
    "sap/ui/model/FilterProcessor",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/handlers/SmartFilterbarHandler"
], function (
    SelectionVariant,
    Filter,
    Filterhelper,
    AppFilterHelper,
    encodeURL,
    CommonUtils,
    ODataUtils,
    FilterProcessor,
    MetadataAnalyser,
    SmartFilterBarHandler
) {
    "use strict";

    var oContentAndHeaderInfo = {
        contentDataUrlUpdated : false,
        headerDataUrlUpdated : false
    };
    /**
     * remove parameter from a request url
     * @param {string} url
     * @param {string} param
     * @returns {string} Request url after removing the parameter if it exists
     */
    function _removeQueryParam(url, param) {
        var aParts = url.split(/\?/);
        var aParams = aParts[1] && aParts[1].replace(/^.*\?/, "").split(/&/);
        var sFinalParams = "";
        aParams && aParams.forEach(function (sParam) {
            if (sParam.indexOf(param) === -1) {
                if (sFinalParams.length === 0) {
                    sFinalParams += sParam;
                } else {
                    sFinalParams += "&" + sParam;
                }
            }
        });
        return aParts[0] + (sFinalParams !== "" ? "?" + sFinalParams : "");
    }

    /**
     * adds parameter to the request url
     * @param {string} url
     * @param {string} sQueryParamUrl
     * @returns {string} The request url after adding query parameters
     */
    function _addQueryParam(sUrl, sQueryParamUrl) {
        if (sUrl && sQueryParamUrl) {
            if (sUrl.indexOf("?") === -1) {
                sUrl += "?" + sQueryParamUrl;
            } else {
                sUrl += "&" + sQueryParamUrl;
            }
        }
        return sUrl;
    }

    /**
     * get query parameter from a request url
     * @param {string} sUrl
     * @param {string} sUrlParam
     * @returns {string} gets url parameter from request url
     */
    function _getQueryParam(sUrl, sUrlParam) {
        var aParts = sUrl.split(/\?/);
        if (aParts.length > 1 ) {
            var aParams = aParts[1].replace(/^.*\?/, "").split(/&/);
            var aParam = aParams.filter(function(sParam) {
                return sParam.includes(sUrlParam);
            });
            return aParam.length === 1 ? aParam[0] : "";
        }
        return "";
    }

    /**
     * get the entityset and suffix path
     * @param {string} sPath
     * @param {object} oCardController
     * @param {object} oGlobalFilter
     * @param {boolean} bFilterEntityTypecase If entity set is parameterized or not
     * @returns {object} Object with properties _entitySet and _urlSuffix
     */
    function getURLEntitySetAndSuffixPath(sPath, oCardController, oGlobalFilter, bFilterEntityTypecase) {
        if (bFilterEntityTypecase) {
            var oFilterProvider = oGlobalFilter && oGlobalFilter._oFilterProvider;
            var oParameterization = oFilterProvider && oFilterProvider._oParameterization;
            var sUrlSuffix = oParameterization && oParameterization.getNavigationPropertyToQueryResult();
            return {
                _entitySet: {
                    value: oParameterization && oParameterization.getName()
                },
                _urlSuffix: {
                    value: "/" + sUrlSuffix
                }
            };
        } else {
            var oModel = oCardController && oCardController.getModel(),
                oMetaModel = oModel && oModel.getMetaModel(),
                // Entity set path exists in sPath
                sEntitySet = "";
            if (!CommonUtils.isODataV4(oModel)) {
                var oDataEntityContainer = oMetaModel && oMetaModel.getODataEntityContainer(),
                    sEntityPath = sPath && sPath.startsWith("/") ? sPath.substr(1) : sPath,
                    aEntitySet = oDataEntityContainer && oDataEntityContainer["entitySet"];
                    aEntitySet = aEntitySet.filter(function (oEntitySet) {
                        return oEntitySet &&
                            oEntitySet.name &&
                            sEntityPath &&
                            sEntityPath.startsWith(oEntitySet.name);
                    });
                sEntitySet = aEntitySet[0] && aEntitySet[0].name;
            } else {
                sEntitySet = oCardController.oCardComponentData.settings.entitySet;
            }
            //checking for suffix path
            var suffixUrl = sPath.split("/").length > 2 ? sPath.substring(sPath.lastIndexOf("/")) : "";
            return {
                _entitySet: {
                    value: sEntitySet
                },
                _urlSuffix: {
                    value: suffixUrl
                }
            };
        }
    }

    /**
     * get full entity path, entity set and suffix url
     *  - In case if the card entity is same as global filter entity set get the analytical binding path.
     *  - otherwise consider selection annotation path to get the full entity path
     * 
     * @param {object} oCardDefinition
     * @returns {object} Object with properties entitypath, _entitySet and _urlSuffix
     */
    function getEntityInfoWithParameters(oCardDefinition) {
        var oMainComponent = oCardDefinition.cardComponentData.mainComponent;
        var oCardController = oCardDefinition.view.getController();
        var oGlobalFilter = oMainComponent.getGlobalFilter();
        var sBindingPath = oCardController.getCardItemsBinding().getPath();
        var oURLInfo;

        if (oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters()) {
            var sGlobalAnalyticalPath = oGlobalFilter.getAnalyticBindingPath();
            var sEntityType = oCardController.getEntitySet().entityType;
            var sGlobalFilterEntityType = SmartFilterBarHandler.getEntityType(oGlobalFilter);

            if (sGlobalAnalyticalPath && sGlobalAnalyticalPath.length > 0) {
                if (sEntityType === sGlobalFilterEntityType) {
                    oURLInfo = getURLEntitySetAndSuffixPath(sGlobalAnalyticalPath, oCardController, oGlobalFilter, true);
                    return {
                        sPath: sGlobalAnalyticalPath,
                        _entitySet: oURLInfo._entitySet,
                        _urlSuffix: oURLInfo._urlSuffix
                    };
                }
            } else {
                var sSelectionAnnotationPath = oCardController.getCardPropertiesModel().getProperty("/selectionAnnotationPath");
                var oSelectionAnnotation = oCardDefinition.entityType[sSelectionAnnotationPath];
                var sEntityPath = MetadataAnalyser.resolveParameterizedEntitySet(
                    oCardController.getModel(),
                    oCardDefinition.entitySet,
                    oSelectionAnnotation
                );
                oURLInfo = getURLEntitySetAndSuffixPath(sEntityPath, oCardController, oGlobalFilter, false);
                return {
                    sPath: sEntityPath,
                    _entitySet: oURLInfo._entitySet,
                    _urlSuffix: oURLInfo._urlSuffix
                };
            }
        }
        oURLInfo = getURLEntitySetAndSuffixPath(sBindingPath, oCardController, oGlobalFilter, false);
        return {
            sPath: "",
            _entitySet: oURLInfo._entitySet,
            _urlSuffix: oURLInfo._urlSuffix
        };
    }

     /**
     * get entity path after applying all the analytical parameters
     * @param {string} sUrl
     * @param {object} oCardController
     * @returns {string} The entity set path with all the analytical params applied
     */
    function getEntityPathWithAppliedAnalyticalParameters(sUrl, oCardController) {
        var oMainController = oCardController.oMainComponent,
            oGlobalFilter = oMainController.getGlobalFilter(),
            sGlobalAnalyticalPath = oGlobalFilter && oGlobalFilter.getAnalyticBindingPath();
        
        var oModel = oCardController.getModel();
        var oMetaModel = oModel.getMetaModel();
        
        if (!CommonUtils.isODataV4(oModel)) {
            var sEntityName = oCardController.getEntityType().name;
            var oEntityContainer = oMetaModel.getODataEntityContainer();
            var aEntityType = oEntityContainer.entitySet.filter(function(oEntitySet) {
                return oEntitySet.entityType === oEntityContainer.namespace + "." + sEntityName;
            });
            var oEntityType = aEntityType.length > 0 ? aEntityType[0] : {};
        } else {
            var sEntityName = oCardController.oCardComponentData.settings.entitySet;
            var oEntityContainer = oMetaModel.getObject("/");
            var oEntityType = oEntityContainer[sEntityName];
            oEntityType.entityType = oEntityType.$Type;
        }

        if (oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters()) {
            var sGlobalAnalyticalPath = oGlobalFilter.getAnalyticBindingPath();
            var iIndexOf, sOldEntityPath, sNewEntityPath;

            if (sGlobalAnalyticalPath && sGlobalAnalyticalPath.length > 0) {
                if (oEntityType.entityType === SmartFilterBarHandler.getEntityType(oGlobalFilter)) { //For entity mapped to global filter
                    sOldEntityPath = sUrl;
                    iIndexOf = sUrl.indexOf("$");
                    if (iIndexOf > 0) {
                        sOldEntityPath = sUrl.substring(0, iIndexOf - 1);
                    }
                    sNewEntityPath = sGlobalAnalyticalPath;
                    if (sNewEntityPath.startsWith("/")) {
                        sNewEntityPath = sNewEntityPath.slice(1);
                    }
                    if (sOldEntityPath !== sNewEntityPath) {
                        sUrl = sUrl.replace(sOldEntityPath, sNewEntityPath);
                    }
                } else { // For entities, not mapped to global filter
                    var aEntityParams = oMainController._getParametersFromEntityPath(sUrl);
                    var aGlobalParams = oMainController._getParametersFromEntityPath(sGlobalAnalyticalPath);
                    var sMappedParameter, sRegEx, sMatch;
                    var oParameters = {};
                    if (aEntityParams && aEntityParams.length > 0) {
                        var oParameterEntity = oMainController._getEntityTypeFromPath(oModel, sUrl, oParameters.context, true);
                        for (var i = 0; i < aGlobalParams.length; i++) {
                            sMappedParameter = oMainController._getPropertyMapping(
                                aEntityParams,
                                aGlobalParams[i].name,
                                oParameterEntity.name,
                                SmartFilterBarHandler.getEntityType(oGlobalFilter),
                                oModel,
                                oGlobalFilter.getModel()
                            );

                            if (sMappedParameter) {
                                sRegEx = sMappedParameter + "=.*?[,)]";
                                sMatch = sUrl.match(new RegExp(sRegEx));
                                if (sMatch && sMatch.length > 0) {
                                    sOldEntityPath = sMatch[0].slice(0, -1);
                                    sNewEntityPath = sMappedParameter + "=" + aGlobalParams[i].sValue;
                                    if (sOldEntityPath !== sNewEntityPath) {
                                        sUrl = sUrl.replace(sOldEntityPath, sNewEntityPath);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return sUrl;
    }

    /**
     * get the filter query url
     * @param {object}  oCardDefinition
     * @param {object} oConfigParams
     * @param {string} sUrl
     * @param {boolean} bPreviewMode
     * @returns {string} The filter query url
     */
    function getFilterQuery(oCardDefinition, oConfigParams, sUrl, bPreviewMode) {
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');
        var sFilterQuery = "";
        if (bInsightRTEnabled || bPreviewMode) {
            sFilterQuery += getFiltersForCard(oCardDefinition);
        } else {
            sFilterQuery += getMandatoryFiltersForCard(oCardDefinition, oConfigParams);
        }
        var sUrlFilterParam = _getQueryParam(sUrl, "$filter");
        if (sUrlFilterParam.length > 0) {
            sUrlFilterParam = decodeURIComponent(sUrlFilterParam);
            sUrlFilterParam = sUrlFilterParam.replace("$filter=", "");
            sUrlFilterParam = !sUrlFilterParam.startsWith("(") ? "(" + sUrlFilterParam + ")" : sUrlFilterParam;
        }
        
        if (sFilterQuery.length > 0 && sUrlFilterParam.length > 0) {
            sFilterQuery = !sFilterQuery.startsWith("(") ? "(" + sFilterQuery + ")" : sFilterQuery;
            sFilterQuery += " and ";
        }
        sFilterQuery += sUrlFilterParam;

        if (sFilterQuery.length !== 0) {
            return "$filter=" + encodeURL(sFilterQuery);
        }
        return "";
    }

    /**
     * get the mandatory filter query url for a card in DT Mode
     *  - In case of design time we only need to consider Mandatory parameters.
     *  - If no mandatory params or no mandatory filters exists then return empty string.
     *  - Otherwise for each mandatory filter, get the selection option and create a singlefilter value.
     *  - Combine all created values in a string and return.
     *  
     * @param {object}  oCardDefinition
     * @param {object} oConfigParams
     * @returns {string} The mandatory filter query url
     */
    function getMandatoryFiltersForCard(oCardDefinition, oConfigParams) {
        var oMainComponent = oCardDefinition.cardComponentData.mainComponent;
        var oGlobalFilter = oMainComponent.getGlobalFilter();
        var oUiState = oGlobalFilter && oGlobalFilter.getUiState();
        var aMandatorySmartFilterParameters = oGlobalFilter && oGlobalFilter.determineMandatoryFilterItems();
        var aMandatoryODataFilters = oConfigParams.parameters._mandatoryODataFilters.value;
        var oSelectionVariant = new SelectionVariant(oUiState && oUiState.getSelectionVariant());

        if ((!aMandatorySmartFilterParameters || aMandatorySmartFilterParameters.length === 0) || 
            (!aMandatoryODataFilters || aMandatoryODataFilters.length === 0)) {
            return "";
        } else {
            var aFiltersQuery = [];
            for (var i = 0; i < aMandatoryODataFilters.length; i++) {
                var sMandatoryODataFilter = aMandatoryODataFilters[i];
                var aSelectOptions = oSelectionVariant.getSelectOption(sMandatoryODataFilter);
                var oFilters = new Filter(aSelectOptions);
                var iFilterLen = oFilters.aFilters && oFilters.aFilters.length || 0;
                var aFilters = [];
                for (var j = 0; j < iFilterLen; j++) {
                    var oFilter = oFilters.aFilters[j];
                    var sFilter = Filterhelper.getSingleFilterValue(oFilter, sMandatoryODataFilter);
                    if (sFilter.length > 0) {
                        aFilters.push(sFilter);
                    }
                }
                if (aFilters.length > 0) {
                    var sFilterQuery = aFilters.join(" or ");
                    sFilterQuery = "(" + sFilterQuery + ")";
                    aFiltersQuery.push(sFilterQuery);
                }
            }
            return (aFiltersQuery.length > 0) ? aFiltersQuery.join(" and ") : "";
        }
    }

     /**
     * get all property names for the filters present inside aFilters, recursively 
     * 
     * @param {Array} aFilters
     * @param {Array} aResult The shared variable where all property names needs to be filled
     * @returns {Array} aResult The Result arrays consists of all the property name associated with filters
     */
    function _getRelavantFiltersRecursively(aFilters, aResult) {
        aFilters && aFilters.forEach(function(oFilter) {
            if (oFilter && oFilter.getFilters()) {
                _getRelavantFiltersRecursively(oFilter.getFilters(), aResult);
            } else if (oFilter && oFilter.getPath() && aResult.indexOf(oFilter.getPath()) === -1){
                aResult.push(oFilter.getPath());
            }
        });
        return aResult;
    }

    /**
     * This function adds a prefix "Edm" to type of all the relavant odata properties in case if type is not of Edm.
     * 
     * @param {object} oEntityType
     * @param {Array} aEntityProperties All relavant entity property names
     */
    function fnAddEdmToPropertyType(oEntityType, aEntityProperties) {
        if (oEntityType && aEntityProperties) {
            var aProperties = oEntityType && oEntityType.property.filter(function(oProperty) {
                return aEntityProperties.indexOf(oProperty.name) > -1;
            }) || [];
            aProperties.forEach(function(oProperty) {
                var sPropertyType = oProperty.type || "";
                if (!sPropertyType.startsWith("Edm")) {
                    oProperty.type = "Edm." + oProperty.type;
                }
            });
        }
    }

    /**
     * get Filter query for a card Used to get all the applied filters (string) in RT Mode
     *  - Get selection variant from smart filter bar's UI state.
     *  - Process only the card entity relavant filters.
     *  - Get single filter value for each of the relavant filters and form the string.
     * 
     * @param {object} oCardDefinition
     * @returns {string} The filter query string of the card
     */
    function getFiltersForCard(oCardDefinition) {
        var oView = oCardDefinition.view;
        var oController = oView.getController();
        var oEntityType = oController.getEntityType(),
            oGlobalFilter = oController.oMainComponent.getGlobalFilter(),
            oFilterModel = oGlobalFilter && oGlobalFilter.getModel(),
            oCardProperties = oController.getView().getModel("ovpCardProperties"),
            entityType = oCardProperties && oCardProperties.getProperty("/entityType"),
            oCardModel = entityType && entityType.name,
            aFilters = oController.oMainComponent.aFilters;
        
        if (oEntityType && oFilterModel && oCardModel) {
            var aEntityRelevantFilters = AppFilterHelper.getEntityRelevantFilters(
                oEntityType,
                aFilters,
                oCardModel,
                oFilterModel
            );

            if (aEntityRelevantFilters.length) {
                var oFilter = FilterProcessor.groupFilters(aEntityRelevantFilters),
                    aRelavantFilters = _getRelavantFiltersRecursively(aEntityRelevantFilters, []),
                    oCardModelMetaData = oView && oView.getModel() && oView.getModel().oMetadata;

                fnAddEdmToPropertyType(oEntityType, aRelavantFilters);

			    var sFilterQuery = ODataUtils.createFilterParams(oFilter, oCardModelMetaData, oEntityType);
                if (sFilterQuery.length) {
                    sFilterQuery = sFilterQuery.replace("$filter=", "");
                    sFilterQuery = decodeURIComponent(sFilterQuery);
                    return sFilterQuery;
                }
                return "";
            }
        }
        return "";
    }

    /**
     * get request url for a card header and content
     * @param {object} oCardDefinition
     * @param {object} oConfigParams
     * @param {boolean} bHeader - parameter to determine if the request is for KPI header
     * @param {boolean} bPreviewMode - If the application is running in Preview mode or not
     * @returns {string} Request url for the card
     */
    function _getRequestUrlAndEntityInfo(oCardDefinition, oConfigParams, bHeader, bPreviewMode) {
        var oView = oCardDefinition.view;
        if (!oView) {
            return {};
        }
        var sServiceUrl = oCardDefinition.cardComponentData.model.sServiceUrl;
        var oCardController = oView.getController();
        var oCardItemsBinding = bHeader 
            ? oCardController.getKPIBinding() 
            : oCardController.getCardItemsBinding();
        var sRangeParameters = oCardItemsBinding && oCardItemsBinding.sRangeParams || "";
        if (oCardDefinition.cardComponentName === "List" || oCardDefinition.cardComponentName === "Table") {
            sRangeParameters = "$skip=0&$top=13"; // always load 13 for list and table
        }
        var oEntityInfo = getEntityInfoWithParameters(oCardDefinition);
        var sUrl = oCardItemsBinding && oCardItemsBinding.getDownloadUrl() || "";
        var sFilterQuery;
        if (sUrl) {
            sUrl = _removeQueryParam(sUrl, "sap-client");
            sUrl = _removeQueryParam(sUrl, "_requestFrom");
            if (!CommonUtils.isODataV4(oView.getModel())) {
                sUrl = sUrl.split(sServiceUrl + "/")[1];
            } else {
                sUrl = sUrl.split(sServiceUrl)[1];
            }
            sUrl = getEntityPathWithAppliedAnalyticalParameters(sUrl, oCardController);

            sFilterQuery = getFilterQuery(oCardDefinition, oConfigParams, sUrl, bPreviewMode);
            if (sFilterQuery.length > 0) {
                sUrl = _removeQueryParam(sUrl, "$filter");
                sUrl = _addQueryParam(sUrl, sFilterQuery);
            }
            var sUrlInlineCountParam = _getQueryParam(sUrl, "$inlinecount");
            if (sUrlInlineCountParam.length === 0 && (oCardDefinition.cardComponentName === "List" || oCardDefinition.cardComponentName === "Table") && !CommonUtils.isODataV4(oView.getModel())) {
                var sInlineCountQuery = "$inlinecount=allpages";
                sUrl = _addQueryParam(sUrl, sInlineCountQuery);
            }
            if (sRangeParameters) {
                sUrl = _addQueryParam(sUrl, sRangeParameters);
            }
        }
        return {
            sPath: sUrl,
            _entitySet: oEntityInfo._entitySet,
            _urlSuffix: oEntityInfo._urlSuffix
        };
    }

    /**
     * Update the _headerDataUrl and _contentDataUrl in case of DT Mode
     * @param {object} oCardDefinition
     * @param {object} oConfigParams
     * @param {boolean} bPreviewMode If the application is running in DT /Preview mode or not
     * @returns {object} Batch object consists of both header and content batch info
     */
    function updateBatchObject(oCardDefinition, oConfigParams, bPreviewMode) {
        if (!oContentAndHeaderInfo.headerDataUrlUpdated) {
            var oHeaderAndEntityInfo = this._getRequestUrlAndEntityInfo(oCardDefinition, oConfigParams, true, bPreviewMode);
            oConfigParams["parameters"]["_headerDataUrl"] = {
                value: oHeaderAndEntityInfo.sPath
            };
        }

        if (!oContentAndHeaderInfo.contentDataUrlUpdated) {
            var oContentAndEntityInfo = this._getRequestUrlAndEntityInfo(oCardDefinition, oConfigParams, false, bPreviewMode) || "";
            oConfigParams["parameters"]["_contentDataUrl"] = {
                value: oContentAndEntityInfo.sPath
            };
        }
        
        // Reset the values so that next time the preview url can be formed.
        oContentAndHeaderInfo.contentDataUrlUpdated = false;
        oContentAndHeaderInfo.headerDataUrlUpdated = false;
    }

    /**
     * get batch object for both header and content
     * @param {object} oCardDefinition
     * @param {object} oConfigParams
     * @returns {object} Batch object consists of both header and content batch info
     */
    function getBatchObject(oCardDefinition, oConfigParams) {
        var oSettings = oCardDefinition.cardComponentData.settings,
            sEntitySet = oCardDefinition.entitySet.name || oSettings.entitySet,
            oBatch = {};

        if (sEntitySet.endsWith("Results")) {
            sEntitySet = sEntitySet.replace("Results", "");
        }

        if (oSettings.dataPointAnnotationPath || oSettings.kpiAnnotationPath) {
            var oHeaderAndEntityInfo = this._getRequestUrlAndEntityInfo(oCardDefinition, oConfigParams, true) || "";
            oConfigParams["parameters"]["_headerDataUrl"] = {
                value: oHeaderAndEntityInfo.sPath
            };
            if (oHeaderAndEntityInfo.sPath) {
                oBatch.header = {
                    method: "GET",
                    url: oHeaderAndEntityInfo.sPath,
                    headers: {
                        Accept: "application/json",
                        "Accept-Language": "{{parameters.LOCALE}}"
                    },
                    retryAfter: 30
                };
            }
        }

        var oContentAndEntityInfo = this._getRequestUrlAndEntityInfo(oCardDefinition, oConfigParams, false) || "";
        oConfigParams["parameters"]["_contentDataUrl"] = {
            value: oContentAndEntityInfo.sPath
        };
        if (oContentAndEntityInfo.sPath) {
            oBatch.content = {
                method: "GET",
                url: oContentAndEntityInfo.sPath,
                headers: {
                    Accept: "application/json",
                    "Accept-Language": "{{parameters.LOCALE}}"
                }
            };
        }
        if (oContentAndEntityInfo._entitySet || oContentAndEntityInfo._urlSuffix) {
            oConfigParams["parameters"]["_entitySet"] = oContentAndEntityInfo._entitySet;
            oConfigParams["parameters"]["_urlSuffix"] = oContentAndEntityInfo._urlSuffix;
        }

        return oBatch;
    }

    /**
     * enahnce _headerDataUrl and _contentDataUrl
     *  - In case if both mandatory filters and mandatory parameters are empty / [], then the _headerDataUrl and _contentDataUrl remains unchanged
     *  - If either mandatory filter or mandatory parameters are not empty, and there does not exists a value for them 
     *      (i.e. either mandatory filter or mandatory parameter) then both _headerDataUrl and _contentDataUrl are set to blank ("").
     * 
     * @param {object} oCardConfig
     * @returns {}
     */
    function enhanceHeaderAndContentURL(oCardConfig) {
        var oParams = oCardConfig.configuration.parameters;
        var aMandatoryODataParams = oParams._mandatoryODataParameters.value;
        var aMandatoryODataFilters = oParams._mandatoryODataFilters.value;
        var bValueNotExistsFilters = aMandatoryODataFilters.some(function(sFilter) {
            var oValue = oParams[sFilter] && oParams[sFilter].value;
            var bResult = true;
            if (oValue && CommonUtils.isJSONData(oValue)) {
                oValue = JSON.parse(oValue);
                var oSelectionOptions = oValue && oValue["SelectOptions"];
                oSelectionOptions.forEach(function(oSelOption) {
                    if (oSelOption && oSelOption["Ranges"] && oSelOption["Ranges"].length > 0) {
                        bResult = false;
                    }
                });
                return bResult;
            }
            return false;
        });
        var bValueNotExistsParams = aMandatoryODataParams.some(function(sParam) {
            return oParams[sParam] && !oParams[sParam].value;
        });
        if (bValueNotExistsFilters || bValueNotExistsParams) {
            if (!oParams._headerDataUrl) {
                oParams._headerDataUrl = { value: "" };
            }
            if (!oParams._contentDataUrl) {
                oParams._contentDataUrl = { value: "" };
            }
            oParams._headerDataUrl.value = "";
            oParams._contentDataUrl.value = "";
            oContentAndHeaderInfo.headerDataUrlUpdated = true;
            oContentAndHeaderInfo.contentDataUrlUpdated = true;
        }

    }

    /**
     * Enhances _headerDataUrl, _contentDataUrl and the request url which referes to _headerDataUrl and _contentDataUrl in the generated manifest.
     *  - IF the header data url or content data url is having semantic data range key in the generated url THEN
     *    Add a formatter function to the request url and set _headerDataUrl / _contentDataUrl to blank(i.e."") as the request url needs to be generated again in runtime.
     * 
     *  - IF the batch request does not exists THEN make the changes to request url and set _contentDataUrl to blank(_headerDataUrl will already be blank)
     *    Add prefix of request url (The url apart from {{parameters._contentDataUrl}}) as a static value parameter to the formatter function.
     * 
     * @param {object} oCard
     */
    function enhanceHeaderAndContentURLForSemanticDate(oCard) {
        var oRequest = oCard && oCard.data && oCard.data.request,
            oHeaderDataUrl = oCard && oCard.configuration.parameters._headerDataUrl,
            oContentDataUrl = oCard && oCard.configuration.parameters._contentDataUrl,
            bSemanticDateConfigExists = oCard.configuration.parameters._semanticDateRangeSetting;

        if (oRequest && oRequest.batch && bSemanticDateConfigExists) {
            var oHeaderRequest = oRequest.batch.header || {},
                oContentRequest = oRequest.batch.content || {};
            oHeaderRequest.url = "{= extension.formatters.formatHeaderDataUrlForSemanticDate() }";
            oHeaderDataUrl.value = "";
            oContentRequest.url = "{= extension.formatters.formatContentDataUrlForSemanticDate() }";
            oContentDataUrl.value = "";
            oContentAndHeaderInfo.headerDataUrlUpdated = true;
            oContentAndHeaderInfo.contentDataUrlUpdated = true;
            
        } else if (oRequest && oRequest.url && bSemanticDateConfigExists) {
            oRequest.url = "{= extension.formatters.formatContentDataUrlForSemanticDate() }";
            oContentDataUrl.value = "";
            oContentAndHeaderInfo.contentDataUrlUpdated = true;
        }
    }

    /**
     * This function returns the correct path for a batch call
     * @param {object} oEntityModel entity model object
     * @returns {object} 
     * @public
     */
    function getBatchRequestPath (sPath, oEntityModel) {
        if (!CommonUtils.isODataV4(oEntityModel)) {
            return sPath;
        } else {
            return sPath.replace('d/results', 'value');
        }
    }

     /**
     * This function returns the correct count for a batch call
     * @param {object} oEntityModel entity model object
     * @returns {object} 
     * @public
     */
    function getBatchResultCount(sCountPath, oEntityModel) {
        if (!CommonUtils.isODataV4(oEntityModel)) {
            return sCountPath;
        } else {
            return sCountPath.replace('d/__count', '@odata.count');
        }
    }

    return {
        _getQueryParam: _getQueryParam,
        _removeQueryParam: _removeQueryParam,
        _getRequestUrlAndEntityInfo: _getRequestUrlAndEntityInfo,
        getBatchObject: getBatchObject,
        enhanceHeaderAndContentURL: enhanceHeaderAndContentURL,
        updateBatchObject: updateBatchObject,
        enhanceHeaderAndContentURLForSemanticDate: enhanceHeaderAndContentURLForSemanticDate,
        getBatchRequestPath: getBatchRequestPath,
        getBatchResultCount: getBatchResultCount
    };
}, /* bExport= */ true);
