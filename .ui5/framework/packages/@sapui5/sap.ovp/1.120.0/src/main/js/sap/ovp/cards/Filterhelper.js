/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/base/util/isEmptyObject",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    isEmptyObject,
    Filter,
    FilterOperator
) {
    "use strict";

    var oExcludeFilterMap = {};

    function getSeletionAnnotaionPath(oCard) {
        var annotationPath;
        if (oCard) {
            if (oCard.settings.tabs) {
                var iIndex = 0;
                var iSelectedKey = oCard.settings.selectedKey;
                if (iSelectedKey && oCard.settings.tabs.length >= iSelectedKey) {
                    iIndex = iSelectedKey - 1;
                }
                annotationPath = oCard.settings.tabs[iIndex]["selectionAnnotationPath"];
            } else {
                annotationPath = oCard.settings["selectionAnnotationPath"];
            }
        }
        return annotationPath;
    }

    /**
     * return the Transformed filter operation if exclude sign is being used in range otherwise the operation
     *
     * @param {String} sOperation - The filter operation
     * @returns {String} The Transformed filter operation if exclude sign is being used in range otherwise the operation
     */
    function getTransformedExcludeOperation(sOperation) {
        var sTransformedOperation = {
            "EQ": "NE",
            "GE": "LT",
            "LT": "GE",
            "LE": "GT",
            "GT": "LE",
            "BT": "NB",
            "Contains": "NotContains",
            "StartsWith": "NotStartsWith",
            "EndsWith": "NotEndsWith"
        }[sOperation];

        return sTransformedOperation ? sTransformedOperation : sOperation;
    }

    /**
     * Checks if the exclude operation exists or not
     *
     * @param {string} sOperation - The filter operation
     * @returns {boolean} True if exclude operations exists false otherwise
     */
    function excludeOperationExists(sOperation) {
        var aNegationOperators = ["NE", "NB", "NotContains", "NotStartsWith", "NotEndsWith"];
        return aNegationOperators.indexOf(sOperation) > -1;
    }

    function getNumberValue(oValue, bODataV4) {
        var value;

        if (oValue) {
            if (oValue.String) {
                value = Number(oValue.String);
            } else if (oValue.Int) {
                value = Number(oValue.Int);
            } else if (oValue.Decimal) {
                value = Number(oValue.Decimal);
            } else if (bODataV4 && oValue.$Decimal) {
                value = Number(oValue.$Decimal);
            } else if (oValue.Double) {
                value = Number(oValue.Double);
            } else if (oValue.Single) {
                value = Number(oValue.Single);
            } else if (bODataV4 && typeof oValue === "number") {
                return oValue;
            }
        }
        return value;
    }

    /**
     * Combines filter with similar path together and adds them to aOutFilters with the provided operator bAnd
     *
     * @param {array} aFilters - The filters which needs to be processed.
     * @param {array} aOutFilters - The output array
     * @param {boolean} bAnd - The and operator while generating the filters
     */
    function combineFiltersWithSamePath(aFilters, aOutFilters, bAnd) {

        if (aFilters && aFilters.length) {
            var oPathFilterMap = {};

            aFilters.forEach(function (oFilter) {
                if (oPathFilterMap[oFilter.path]) {
                    oPathFilterMap[oFilter.path].push(new Filter(oFilter));
                } else {
                    oPathFilterMap[oFilter.path] = [new Filter(oFilter)];
                }
            });

            Object.keys(oPathFilterMap).forEach(function (sPath) {
                aOutFilters.push(new Filter({ filters: oPathFilterMap[sPath], and: bAnd }));
            });
        }
    }

    return {
        _getEntityRelevantFilters: function (oEntityType, aFilters) {
            var oReturnFilterWrap = [];
            if (aFilters.length > 0 && oEntityType) {
                var oReturnFilter = this._checkRelevantFiltersRecursive(oEntityType, aFilters[0]);

                //Wrap the return filter in an array
                if (oReturnFilter) {
                    oReturnFilterWrap.push(oReturnFilter);
                }
            }
            return oReturnFilterWrap;
        },
        _checkRelevantFiltersRecursive: function (aEntityProperties, oFilterDetails) {
            if (!oFilterDetails._bMultiFilter) {
                //End point of recursion (base case)
                oFilterDetails.sPath = oFilterDetails.sPath.split("/").pop();
                //Get the mapping property. This would return the same property name in case a match is found
                //or else a property that is mapped in annotations. If nothing is found, then it returns null
                var sMappedProperty = this._getPropertyMapping(aEntityProperties, oFilterDetails.sPath);
                if (sMappedProperty) {
                    oFilterDetails.sPath = sMappedProperty;
                    return oFilterDetails;
                }
            } else {
                //For multifilter cases, there are deep structures
                var aDeepFilters = oFilterDetails.aFilters;
                var oSelectedFilter,
                    aSelectedFilters = [];

                if (aDeepFilters) {
                    for (var i = 0; i < aDeepFilters.length; i++) {
                        //Get the relevant filter object for each internal filter
                        oSelectedFilter = this._checkRelevantFiltersRecursive(aEntityProperties, aDeepFilters[i]);
                        if (oSelectedFilter) {
                            aSelectedFilters.push(oSelectedFilter);
                        }
                    }
                    if (aSelectedFilters.length > 0) {
                        return new Filter(aSelectedFilters, oFilterDetails.bAnd);
                    }
                }
            }
        },
        _getPropertyMapping: function (aEntityProperties, sTargetProperty) {
            if (sTargetProperty in aEntityProperties) {
                return sTargetProperty;
            }
        },
        mergeFilters: function (entityRelevantFilters, selectionFilters, oCardPropertiesModel) {

            var sCardId = oCardPropertiesModel.getProperty("/cardId");
            var aCardExcludeFilters = oExcludeFilterMap[sCardId] || [];

            // no selectionFilters and no entityRelevantFilters exit
            if (
                selectionFilters &&
                selectionFilters.length === 0 &&
                entityRelevantFilters &&
                entityRelevantFilters.length === 0
            ) {
                return [];
            }
            var aFilters = [];
            
            //filter out exclude filters from selectionFilters if both selectionFilters and exclude filters exist
            if (aCardExcludeFilters.length && 
                selectionFilters && 
                selectionFilters.length) {
                selectionFilters = selectionFilters.filter(function(oSelectionFilter) {
                    return !aCardExcludeFilters.includes(oSelectionFilter);
                });
            }

            //the filters returned from V4AnnotationHelper getFilters are filter objets not sap filter type they need to be converted
            if ((selectionFilters && selectionFilters.length > 0) || aCardExcludeFilters.length) {
                var aTempFilter = [];
                combineFiltersWithSamePath(selectionFilters, aTempFilter, false);
                combineFiltersWithSamePath(aCardExcludeFilters, aTempFilter, true);
                aFilters.push(new Filter({ filters: aTempFilter, and: true }));
            }
            //the filters from relevant filters are already multifilters merge the above
            if (!isEmptyObject(entityRelevantFilters[0])) {
                aFilters.push(entityRelevantFilters[0]);
            }
            return new Filter({ filters: aFilters, and: true });
        },
        getSelectionVariantFilters: function (cardmanifestModel, oOVPCardPropertiesModel, entityType) {
            var propertiesModeldata = oOVPCardPropertiesModel.getData(),
                currentCardManifestModel = cardmanifestModel.filter(function (el) {
                    return el.id === propertiesModeldata.cardId;
                })[0],
                //selectionAnnotationPath = "@" + currentCardManifestModel.settings['selectionAnnotationPath'],
                selectionAnnotationPath = "@" + getSeletionAnnotaionPath(currentCardManifestModel),
                oSelectionVariant = entityType[selectionAnnotationPath];
            return oSelectionVariant
                ? this.getFilters(oOVPCardPropertiesModel, oSelectionVariant, true) // true in case of oDataV4
                : [];
        },
        formatLiteral: function (vValue, sType) {
            var rSingleQuote = /'/g;
            if (vValue === undefined) {
                throw new Error("Illegal value: undefined");
            }
            if (vValue === null) {
                return "null";
            }

            switch (sType) {
                case "Edm.Binary":
                    return "binary'" + vValue + "'";
                case "Edm.Boolean":
                case "Edm.Byte":
                case "Edm.Double":
                case "Edm.Int16":
                case "Edm.Int32":
                case "Edm.SByte":
                case "Edm.Single":
                    return String(vValue);
                case "Edm.Date":
                case "Edm.DateTimeOffset":
                case "Edm.Decimal":
                case "Edm.Guid":
                case "Edm.Int64":
                case "Edm.TimeOfDay":
                    return vValue;
                case "Edm.Duration":
                    return "duration'" + vValue + "'";
                case "Edm.String":
                    return "'" + vValue.replace(rSingleQuote, "''") + "'";
                default:
                    throw new Error("Unsupported type: " + sType);
            }
        },

        getBooleanValue: function(oValue, bDefault) {
            if (oValue && oValue.Boolean) {
                if (oValue.Boolean.toLowerCase() === "true") {
                    return true;
                } else if (oValue.Boolean.toLowerCase() === "false") {
                    return false;
                }
            } else if (oValue && oValue.Bool) {
                if (oValue.Bool.toLowerCase() === "true") {
                    return true;
                } else if (oValue.Bool.toLowerCase() === "false") {
                    return false;
                }
            }
            return bDefault;
        },

        getPrimitiveValue: function(oValue, bODataV4) {
            var value;
    
            if (oValue) {
                if (oValue.String || oValue.String === "") {
                    value = oValue.String;
                } else if (bODataV4 && typeof oValue == "string") {
                    value = oValue;
                } else if (oValue.Boolean || oValue.Bool) {
                    value = this.getBooleanValue(oValue);
                } else if (oValue.DateTime) {
                    value = oValue.DateTime;
                } else if (oValue.DateTimeOffset) {
                    value = oValue.DateTimeOffset;
                } else {
                    value = getNumberValue(oValue, bODataV4);
                }
            }
            return value;
        },

        /**
         * return the filters that need to be applyed on an aggregation
         *
         * @param {Object} ovpCardProperties - card properties model which might contains filters configurations
         * @param {Object} oSelectionVariant - optional selection variant annotation with SelectOptions configuration
         * @param {Boolean} bODataV4 - identifies an odata v4 model
         * @returns {Array} of model filters
         */
        getFilters : function(ovpCardProperties, oSelectionVariant, bODataV4) {
            var aFilters = [];
            //get the configured filters if exist and append them to the filter array
            var aConfigFilters = ovpCardProperties.getProperty("/filters");
            if (aConfigFilters) {
                aFilters = aFilters.concat(aConfigFilters);
            }

            //get the filters from the selection variant annotations if exists
            var aSelectOptions = oSelectionVariant && oSelectionVariant.SelectOptions;
            var oSelectOption, sPropertyPath, oRange;
            var aExcludeFilters = [];

            if (aSelectOptions) {
                for (var i = 0; i < aSelectOptions.length; i++) {
                    oSelectOption = aSelectOptions[i];
                    sPropertyPath = bODataV4 ? oSelectOption.PropertyName.$PropertyPath : oSelectOption.PropertyName.PropertyPath;
                    //a select option might contains more then one filter in the Ranges array
                    for (var j = 0; j < oSelectOption.Ranges.length; j++) {
                        oRange = oSelectOption.Ranges[j];
                        var sRangeSignEnumMember = bODataV4 ? oRange.Sign.$EnumMember : oRange.Sign.EnumMember;
                        var sRangeOptionEnumMember = bODataV4 ? oRange.Option.$EnumMember : oRange.Option.EnumMember;
                        if (sRangeSignEnumMember) {
                            //create the filter. the Low value is mandatory
                            var oFilter = {
                                path: sPropertyPath,
                                operator: sRangeOptionEnumMember.split("/")[1],
                                value1: this.getPrimitiveValue(oRange.Low, bODataV4),
                                value2: this.getPrimitiveValue(oRange.High, bODataV4),
                                sign: sRangeSignEnumMember === "com.sap.vocabularies.UI.v1.SelectionRangeSignType/I" ? "I" : "E"
                            };

                            // aFilters will be used later in the flow to create filter object. (sap.ui.model.Filter),
                            // that does not support sign property, so the sign property will be ignored later in the flow.

                            
                            //This will also be called during navigation to create selection variant.
                            //for selection variant sign property is supported but NE / NB / NotContains / NotStartsWith / NotEndsWith  
                            //operators are not supported, This case will be handled by the calling function in card.controller

                            if (oFilter.sign === "E") {
                                oFilter.operator = getTransformedExcludeOperation(oFilter.operator);
                                oFilter.sign = "I";
                                aExcludeFilters.push(oFilter);
                            } else if (oFilter.sign === "I" && excludeOperationExists(oFilter.operator)) {
                                aExcludeFilters.push(oFilter);
                            }

                            // contains operation is supported only in includes case by the smartFilter
                            if (oFilter.operator === "CP" && oFilter.sign === "I") {
                                var sInternalOperation = FilterOperator.Contains;
                                var sValue = oFilter.value1;
                                if (sValue) {
                                    var nIndexOf = sValue.indexOf("*");
                                    var nLastIndex = sValue.lastIndexOf("*");

                                    // only when there are '*' at all
                                    if (nIndexOf > -1) {
                                        if (nIndexOf === 0 && nLastIndex !== sValue.length - 1) {
                                            sInternalOperation = FilterOperator.EndsWith;
                                            sValue = sValue.substring(1, sValue.length);
                                        } else if (nIndexOf !== 0 && nLastIndex === sValue.length - 1) {
                                            sInternalOperation = FilterOperator.StartsWith;
                                            sValue = sValue.substring(0, sValue.length - 1);
                                        } else {
                                            sValue = sValue.substring(1, sValue.length - 1);
                                        }
                                    }
                                }
                                oFilter.operator = sInternalOperation;
                                oFilter.value1 = sValue;
                            }

                            //append the filter to the filters array
                            aFilters.push(oFilter);
                        }
                    }
                }

                if (aExcludeFilters.length) {
                    var sCardId = ovpCardProperties.getProperty("/cardId");
                    oExcludeFilterMap[sCardId] = aExcludeFilters;
                }
            }

            return aFilters;
        },

        /**
         * Transforms the exlude operation for navigation as exclude operations are not supported from SV side.
         *
         * @param {Object} oCardFilter - The card filter
         */
        transformExcludeOperationForNavigation: function(oCardFilter) {
            var oTransformedOperation = {
                "NE": "EQ",
                "NB": "BT",
                "NotContains": "Contains",
                "NotStartsWith": "StartsWith",
                "NotEndsWith": "EndsWith"
            };

            if (oCardFilter && 
                oCardFilter.operator && 
                oTransformedOperation[oCardFilter.operator]) {
                oCardFilter.operator = oTransformedOperation[oCardFilter.operator];
                oCardFilter.sign = "E";
            }
        },

        /**
         * Forms exclude filters for ovp cards.
         *
         * @param {Array} aFilters - filters array
         * @param {Object} oCardPropertiesModel
         * @returns {Array} aFilters if no exclude filter exists aModelFilters otherwise.
         */
        createExcludeFilters: function(aFilters, oCardPropertiesModel) {
            var aModelFilters = [];

            var sCardId = oCardPropertiesModel.getProperty("/cardId");
            var aCardExcludeFilters = oExcludeFilterMap[sCardId] || [];

            if (aCardExcludeFilters.length > 0) {
                aFilters.forEach(function(oFilter) {
                    if (!aCardExcludeFilters.includes(oFilter)) {
                        aModelFilters.push(oFilter);
                    }
                });

                aModelFilters.push({ filters: aCardExcludeFilters, and: true });

                return aModelFilters;
            }
            return aFilters;
        }
    };
}, /* bExport= */ true);
