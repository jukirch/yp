/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/Filterhelper",
    "sap/ovp/app/FilterHelper",
    "sap/ovp/app/OVPLogger",
    "sap/ui/base/SyncPromise",
    "sap/ui/model/FilterOperator"
], function (
    FilterHelper,
    appFilterHelper,
    OVPLogger,
    SyncPromise,
    FilterOperator
) {
    "use strict";

    var oLogger = new OVPLogger("sap.ovp.filter.filterUtils");

    var oFilterUtils = {
        applyFiltersToV2Card: function (aFilters, that) {
            var oEntityType = that.getEntityType(),
                oGlobalFilter = that.oMainComponent.getMacroFilterBar() || that.oMainComponent.getGlobalFilter(),
                oFilterModel = oGlobalFilter && oGlobalFilter.getModel(),
                oCardProperties = that.getView().getModel("ovpCardProperties"),
                entityType = oCardProperties && oCardProperties.getProperty("/entityType"),
                oCardModel = entityType && entityType.name;
            if (oEntityType && oFilterModel && oCardModel) {
                var aRelevantFilters = appFilterHelper.getEntityRelevantFilters(
                    oEntityType,
                    aFilters,
                    oCardModel,
                    oFilterModel
                );
                var aAllFilters = appFilterHelper.mergeFilters(aRelevantFilters, that.selectionVaraintFilter, oCardProperties);
                try {
                    var oChartBinding = that.getCardItemsBinding();
                    if (oChartBinding) {
                        oChartBinding.filter(aAllFilters);
                    }
                    if (that.getKPIBinding()) {
                        that.getKPIBinding().filter(aAllFilters);
                    }
                } catch (e) {
                    oLogger.error(e);
                }
            }
        },
        applyFiltersToV4Card: function (aFilters, that) {
            if (that.getView().getModel().getMetaModel().getData) {
                var metaData = that.getView().getModel().getMetaModel().getData();
                var oCardProperties = that.getView().getModel("ovpCardProperties");
                var entityType = oCardProperties.getProperty("/entityType");
                var entityTypeKey = entityType && entityType["$Type"];
                if (entityTypeKey) {
                    var relfilters = FilterHelper._getEntityRelevantFilters(metaData[entityTypeKey], aFilters);
                    relfilters = FilterHelper.mergeFilters(relfilters, that.selectionVaraintFilter, oCardProperties);
                    try {
                        that.getCardItemsBinding().filter(relfilters);
                        if (that.getKPIBinding()) {
                            that.getKPIBinding().filter(relfilters);
                        }
                    } catch (e) {
                        oLogger.error(e);
                    }
                }
            }
        },
        applyFiltersToV4AnalyticalCard: function (aFilters, that) {
            if (that.getView().getModel().getMetaModel().getData) {
                var metaData = that.getView().getModel().getMetaModel().getData();
                var oCardProperties = that.getView().getModel("ovpCardProperties");
                var entityTypeKey = oCardProperties.getData().entityType.$Type;
                var relfilters = FilterHelper._getEntityRelevantFilters(metaData[entityTypeKey], aFilters);
                relfilters = FilterHelper.mergeFilters(relfilters, that.selectionVaraintFilter, oCardProperties);
                var cardBinding = that.getCardItemsBinding();
                var sApplyParameter = cardBinding && cardBinding.mParameters && cardBinding.mParameters.$apply;
                var iApplyParameterLength = sApplyParameter && sApplyParameter.split("/").length || 0;
                try {
                    if (relfilters && relfilters.aFilters) {
                        this.fetchFilter(relfilters, cardBinding, {})
                            .then(function (filterParameters) {
                                var aggregateParams =
                                iApplyParameterLength > 1
                                        ? sApplyParameter.split("/")[iApplyParameterLength - 1]
                                        : sApplyParameter.split("/")[0];
                                cardBinding.mParameters.$apply =
                                    "filter(" + filterParameters + ")/" + aggregateParams;
                                cardBinding.setAggregation();
                            })
                            .catch(function (err) {
                                oLogger.error(err);
                            });
                    } else {
                        //in case of no filters
                        if (iApplyParameterLength > 1) {
                            cardBinding.mParameters.$apply = sApplyParameter.split("/")[iApplyParameterLength - 1];
                            cardBinding.setAggregation();
                        }
                    }
                    if (that.getKPIBinding()) {
                        that.getKPIBinding().filter(relfilters);
                    }
                } catch (err) {
                    oLogger.error(err);
                }
            }
        },
        fetchFilter: function (oFilter, cardBinding, mLambdaVariableToPath, bWithinAnd) {
            var sResolvedPath;
            var oMetaModel = cardBinding.oModel.getMetaModel();
            var oMetaContext = oMetaModel.getMetaContext(
                cardBinding.oModel.resolve(cardBinding.sPath, cardBinding.oContext)
            );

            if (!oFilter) {
                return SyncPromise.resolve();
            }

            if (oFilter.aFilters) {
                return SyncPromise.all(
                    oFilter.aFilters.map(function (oSubFilter) {
                        return this.fetchFilter(oSubFilter, cardBinding, mLambdaVariableToPath, oFilter.bAnd);
                    }, this)
                ).then(
                    function (aFilterStrings) {
                        // wrap it if it's an 'or' filter embedded in an 'and'
                        return this.wrap(
                            aFilterStrings.join(oFilter.bAnd ? " and " : " or "),
                            bWithinAnd && !oFilter.bAnd
                        );
                    }.bind(this)
                );
            }

            sResolvedPath = oMetaModel.resolve(
                this.replaceLambdaVariables(oFilter.sPath, mLambdaVariableToPath),
                oMetaContext
            );

            return oMetaModel.fetchObject(sResolvedPath).then(
                function (oPropertyMetadata) {
                    var oCondition, sLambdaVariable, sOperator;

                    if (!oPropertyMetadata) {
                        throw new Error("Type cannot be determined, no metadata for path: " + sResolvedPath);
                    }
                    sOperator = oFilter.sOperator;
                    if (sOperator === FilterOperator.All || sOperator === FilterOperator.Any) {
                        oCondition = oFilter.oCondition;
                        sLambdaVariable = oFilter.sVariable;
                        if (sOperator === FilterOperator.Any && !oCondition) {
                            return oFilter.sPath + "/any()";
                        }
                        // multifilters are processed in parallel, so clone mLambdaVariableToPath
                        // to allow same lambda variables in different filters
                        mLambdaVariableToPath = Object.create(mLambdaVariableToPath);
                        mLambdaVariableToPath[sLambdaVariable] = this.replaceLambdaVariables(
                            oFilter.sPath,
                            mLambdaVariableToPath
                        );

                        return this.fetchFilter(oCondition, mLambdaVariableToPath).then(function (sFilterValue) {
                            return (
                                oFilter.sPath +
                                "/" +
                                oFilter.sOperator.toLowerCase() +
                                "(" +
                                sLambdaVariable +
                                ":" +
                                sFilterValue +
                                ")"
                            );
                        });
                    }
                    return this.getSingleFilterValue(oFilter, oPropertyMetadata.$Type, bWithinAnd);
                }.bind(this)
            );
        },
        wrap: function (sFilter, bWrap) {
            return bWrap ? "(" + sFilter + ")" : sFilter;
        },
        replaceLambdaVariables: function (sPath, mLambdaVariableToPath) {
            var aSegments = sPath.split("/");
            aSegments[0] = mLambdaVariableToPath[aSegments[0]];
            return aSegments[0] ? aSegments.join("/") : sPath;
        },
        getSingleFilterValue: function (oFilter, sEdmType, bWithinAnd) {
            var sFilter, sFilterPath, bToLower, sValue;
            function setCase(sText) {
                return bToLower ? "tolower(" + sText + ")" : sText;
            }
            bToLower = sEdmType === "Edm.String" && oFilter.bCaseSensitive === false;
            sFilterPath = setCase(decodeURIComponent(oFilter.sPath));
            sValue = setCase(FilterHelper.formatLiteral(oFilter.oValue1, sEdmType));
            switch (oFilter.sOperator) {
                case FilterOperator.BT:
                    sFilter =
                        sFilterPath +
                        " ge " +
                        sValue +
                        " and " +
                        sFilterPath +
                        " le " +
                        setCase(FilterHelper.formatLiteral(oFilter.oValue2, sEdmType));
                    break;
                case FilterOperator.NB:
                    sFilter = this.wrap(
                        sFilterPath +
                        " lt " +
                        sValue +
                        " or " +
                        sFilterPath +
                        " gt " +
                        setCase(FilterHelper.formatLiteral(oFilter.oValue2, sEdmType)),
                        bWithinAnd
                    );
                    break;
                case FilterOperator.EQ:
                case FilterOperator.GE:
                case FilterOperator.GT:
                case FilterOperator.LE:
                case FilterOperator.LT:
                case FilterOperator.NE:
                    sFilter = sFilterPath + " " + oFilter.sOperator.toLowerCase() + " " + sValue;
                    break;
                case FilterOperator.Contains:
                case FilterOperator.EndsWith:
                case FilterOperator.NotContains:
                case FilterOperator.NotEndsWith:
                case FilterOperator.NotStartsWith:
                case FilterOperator.StartsWith:
                    sFilter =
                        oFilter.sOperator.toLowerCase().replace("not", "not ") +
                        "(" +
                        sFilterPath +
                        "," +
                        sValue +
                        ")";
                    break;
                default:
                    throw new Error("Unsupported operator: " + oFilter.sOperator);
            }
            return sFilter;
        }
    };
    return {
        applyFiltersToV2Card: oFilterUtils.applyFiltersToV2Card,
        applyFiltersToV4Card: oFilterUtils.applyFiltersToV4Card,
        applyFiltersToV4AnalyticalCard: oFilterUtils.applyFiltersToV4AnalyticalCard,
        fetchFilter: oFilterUtils.fetchFilter,
        wrap: oFilterUtils.wrap,
        replaceLambdaVariables: oFilterUtils.replaceLambdaVariables,
        getSingleFilterValue: oFilterUtils.getSingleFilterValue
    };
});
