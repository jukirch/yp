/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/cards/CommonUtils",
    "sap/fe/navigation/SelectionVariant",
    "sap/ovp/insights/helpers/i18n",
    "sap/m/DynamicDateUtil",
    "sap/ui/core/Core"
], function (MetadataAnalyser, CommonUtils, SelectionVariant, i18nHelper, DynamicDateUtil, Core) {
    "use strict";

    var oSemanticDateRangeConfig = {};

    function resetSemanticDateRangeConfig() {
        oSemanticDateRangeConfig = {};
    }
    /**
     * Remove extra information from variant object keep only SelectionOptions and Parameters
     * 
     * @param {object} oValue Variant value
     * @returns {object} Updated value of selection variant after removinig the extra info
     */
    function removeExtraInfoVariant(oValue) {
        if (oValue) {
            if (oValue.hasOwnProperty("SelectionVariantID")) {
                delete oValue.SelectionVariantID;
            } else if (oValue.hasOwnProperty("PresentationVariantID")) {
                delete oValue.PresentationVariantID;
            }
            delete oValue.Text;
            delete oValue.ODataFilterExpression;
            delete oValue.Version;
            delete oValue.FilterContextUrl;
            delete oValue.ParameterContextUrl;
            return oValue;
        }
        return oValue;
    }

    /**
     * Updates the multiple Range values of a selection variant
     * 
     * @param {Array} aSelectOptions
     * @param {object} oSVValue Selection Variant value
     * @param {string} sKey The filter name act as key for card's config params
     * @returns {}
     */
    function handleMultiRangeVariant(aSelectOptions, oSVValue, sKey) {
        var aRanges;
        aSelectOptions.forEach(function(oSelOption) {
            aRanges = oSelOption && oSelOption.Ranges;
            oSVValue.massAddSelectOption(sKey, aRanges);
        });
    }

    /**
     * Updates the Range values for the selection options of filters under configuration params
     *  - In case if selection option has only single Range, without a LOW value defined in Range set Ranges to [] for that selection variant.
     *  - In case if there are multiple different Ranges for same property combine together to same Ranges array.
     * 
     * @param {object} oFilters Configuration parameters
     * @returns {}
     */
    function updateRangeValue(oFilters) {
        var oVariant, oSelectOption, oRange;
        var k = 0;

        for (var sKey in oFilters) {
            var oSVValue = new SelectionVariant();
            if (oFilters.hasOwnProperty(sKey) && oFilters[sKey]) {
                oVariant = oFilters[sKey].value;
                if (oVariant && typeof oVariant === "string" && CommonUtils.isJSONData(oVariant)) {
                    oVariant = JSON.parse(oVariant);
                    if (typeof oVariant !== "object") {
                        oFilters[sKey].value = oVariant.toString();
                        continue;
                    }
                    oSelectOption = oVariant.SelectOptions && oVariant.SelectOptions[0];
                    if (oSelectOption && oSelectOption.Ranges && oSelectOption.Ranges.length === 1) {
                        oRange = oSelectOption.Ranges[0] || {};
                        if (oRange.Option === "EQ" && !oRange.Low) {
                            oSelectOption.Ranges = [];
                            oFilters[sKey].value = JSON.stringify(oVariant);
                        }
                    }
                } else if (oVariant && Array.isArray(oVariant)) {

                    var oVariantVal, aSelectOptions;

                    for (k = 0; k < oVariant.length; k++) {
                        oVariantVal = JSON.parse(oVariant[k]);
                        aSelectOptions = oVariantVal && oVariantVal.SelectOptions || [];
                        handleMultiRangeVariant(aSelectOptions, oSVValue, sKey);
                    }
                    oSVValue = removeExtraInfoVariant(oSVValue && oSVValue.toJSONObject());
                    oFilters[sKey].value = JSON.stringify(oSVValue);
                }
            }
        }
    }

    /**
     * Get the parameter value from Global filter
     * 
     * @param {string} sMandatoryProp Parameter path
     * @param {object} oGlobalFilter
     * @returns {object} The value of mandatory / non-mandatory parameter from global filter
     */
    function getParameterValue(sMandatoryProp, oGlobalFilter) {
        var sPropertyName,
            sResult = "";
        oGlobalFilter &&
            oGlobalFilter.getAllFiltersWithValues().filter(function (oFilterVal) {
                sPropertyName = oFilterVal.getName();
                if (sPropertyName.includes(sMandatoryProp) || sPropertyName === sMandatoryProp) {
                    sResult = (oGlobalFilter && oGlobalFilter.getFilterData() && oGlobalFilter.getFilterData()[sPropertyName]) || "";
                }
            });
        return sResult;
    }

    /**
     * Get the parameterized entity set properties
     * 
     * @param {object} oModel
     * @param {object} oEntitySet
     * @param {string} sProperty
     * @param {object} oCardDefinition
     * @returns {Array} The entity set properties Array
     */
    function getParameterizedEntityProperties(oModel, oEntitySet, sProperty, oCardDefinition) {
        var oEntityType = oModel.getMetaModel().getODataEntityType(oEntitySet.entityType) || {};
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var oSelectionVariant = oEntityType[oOvpCardProperties.getProperty("/selectionAnnotationPath")] || {};
        var aParameters = oOvpCardProperties.getProperty("/parameters") || [];
        var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter;
        var aProperties = [];
        var bParameterised = MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oModel, oEntitySet.name);

        if (bParameterised) {
            aProperties = MetadataAnalyser.resolveAnalyticalParameterizedEntitySet(oModel, oEntitySet, oSelectionVariant, aParameters, oGlobalFilter, true) || [];
        } else {
             //for transactional parameterised entity seys
             var oParametersInfo = MetadataAnalyser.getParametersByEntitySet(oModel, oEntitySet.name); //pre-existing method defined to get metadat properties
             if (oParametersInfo && oParametersInfo.entitySetName) {
                aProperties = MetadataAnalyser.getPropertyOfEntitySet(oModel, oParametersInfo.entitySetName) || [];
            }
        }
        return aProperties.filter(function (oProperty) {
            return oProperty && oProperty.name === sProperty;
        });
    }

    /**
     * Get default value of parameter in smart filter bar or card
     * 
     * @param {object} oModel
     * @param {object} oEntityType
     * @param {string} sPropertyName
     * @param {string} oCardDefinition
     * @returns {string} Default Value of the property
     */
    function getParameterDefaultValue(oModel, oEntityType, sPropertyName, oCardDefinition) {
        if (sPropertyName) {
            var aPropertyInfo = getParameterizedEntityProperties(oModel, oEntityType, sPropertyName, oCardDefinition) || [],
                oProperty = aPropertyInfo[0] || {},
                oFilterDefaultvalue = oProperty["com.sap.vocabularies.Common.v1.FilterDefaultValue"] || {},
                aFilterDefaultKeys = Object.keys(oFilterDefaultvalue) || [];

            return oFilterDefaultvalue[aFilterDefaultKeys[0]] || oProperty.defaultValue;
        }
    }

    /**
     * Get Actual value of parameter from smart filter bar
     * 
     * @param {string} sProperty
     * @param {object} oGlobalFilter Global Filter Model
     * @returns {string} Actual Value of the property or empty string
     */
    function getParameterActualValue(sProperty, oGlobalFilter) {
        var oFilterData = oGlobalFilter && oGlobalFilter.getFilterData();
        return oFilterData && (oFilterData["$Parameter." + sProperty] || oFilterData[sProperty]) || "";
    }

    /**
     * Get Deafult value of filter from smart filter bar
     *  - If the filter property is direct property of global filter's entity type, then process the property from global filter.
     *  - If the property is associated from card entity Type use card entity type to get the default value.
     *  
     *  - Check if property has FilterDefaultValue annotation
     *  - Check if property object direct have a defaultValue property, cominig from metadata
     * 
     * @param {string} sProperty
     * @param {object} oFilterEntityType Global Filter Entity Type
     * @param {object} oEntityType Card Entity Type
     * @returns {string} Default Value of the property
     */
    function getFilterDefaultValue(sProperty, oFilterEntityType, oEntityType) {

        if (sProperty) {
            var aPropertyInfo = oFilterEntityType &&
                oFilterEntityType.property &&
                oFilterEntityType.property.filter(function (oProperty) {
                    return oProperty && oProperty.name === sProperty;
                }) || [];

            if (!aPropertyInfo.length) {
                aPropertyInfo = oEntityType && oEntityType.property && oEntityType.property.filter(function (oProperty) {
                    return oProperty && oProperty.name === sProperty;
                });
            }
        }

        var oProperty = aPropertyInfo && aPropertyInfo.length ? aPropertyInfo[0] : {};
        var oFilterDefaultvalue = (oProperty && oProperty["com.sap.vocabularies.Common.v1.FilterDefaultValue"]) || {};
        var aFilterDefaultKeys = Object.keys(oFilterDefaultvalue);

        return oProperty && ((aFilterDefaultKeys && aFilterDefaultKeys.length && oFilterDefaultvalue[aFilterDefaultKeys[0]]) || oProperty.defaultValue);
    }

    /**
     * Enahnces the selection variant value
     * 
     * @param {Array | object} oVariantValue selection variant value could be an array or object
     * @returns {Array | object} The Enahnced selection variant value
    */
    function enhanceVariant(oVariantValue) {
        var oValue;
        var aFinalValue = [];
        if (oVariantValue && Array.isArray(oVariantValue)) {
            oVariantValue.forEach(function (oVal) {
                if (oVal) {
                    oValue = removeExtraInfoVariant(JSON.parse(oVal));
                    aFinalValue.push(JSON.stringify(oValue));
                }
            });
            return aFinalValue;
        } else if (oVariantValue && CommonUtils.isJSONData(oVariantValue)) {
            oValue = removeExtraInfoVariant(JSON.parse(oVariantValue));
            return JSON.stringify(oValue);
        }
    }

    /**
     * Check and returns the property type using the property object used to create type of configuration params
     * 
     * @param {object} oPropertyDetails selection variant value could be an array or object.
     * @returns {*} The type of property could be of type string or null in case if no type is matched.
    */
    function getPropertyType(oPropertyDetails) {
        var sType = "";
        if (!oPropertyDetails) {
            return null;
        }
        if (oPropertyDetails.type) {
            sType = oPropertyDetails.type.startsWith("Edm.")
                ? oPropertyDetails.type.split("Edm.")[1]
                : oPropertyDetails.type;
        }
        var oDataTypeMap = {
            Boolean: "boolean",
            Byte: "integer",
            SByte: "integer",
            Int16: "integer",
            Int32: "integer",
            Int64: "number",
            Single: "number",
            Double: "number",
            Float: "number",
            Decimal: "number",
            Guid: "string",
            String: "string",
            Date: "date",
            DateTime: "datetime",
            DateTimeOffset: "datetime",
            Time: "datetime",
            Binary: "",
            Stream: "",
            TimeOfDay: "",
            Duration: ""
        };
        if (sType && sType === "string") {
            return sType;
        } else if (sType && oDataTypeMap[sType]) {
            return oDataTypeMap[sType];
        } else {
            return "string"; // keep string type as default
        }
    }

    /**
     * Get Request AtLeastFields fields using presentation Variant
     * 
     * @param {object} oPresentationVariant
     * @returns {Array} The Request at least properties array.
    */
    function getRequestAtLeastFields(oPresentationVariant) {
        var aRequest = [];
        var aRequestFields = (oPresentationVariant && oPresentationVariant.RequestAtLeast) || undefined;
        if (aRequestFields) {
            for (var i = 0; i < aRequestFields.length; i++) {
                if (aRequestFields[i].PropertyPath) {
                    aRequest.push(aRequestFields[i].PropertyPath);
                }
            }
        }
        return aRequest;
    }

    /**
     * Get The text value specific to the Low value of Range in selection option
     * 
     * @param {object} oRange
     * @param {Array} aFilterLabel The Label / token values from smart filter bar
     * @param {object} oGlobalFilter
     * @param {String} sPropertyName
     * @returns {String} sRangeText The Text which needs to updated to the Range object.
    */
    function getRelatedTextToRange(oRange, aFilterLabel, oGlobalFilter, sPropertyName) {
        var sRangeText = "";

        if (Array.isArray(aFilterLabel)) {
            aFilterLabel.filter(function(sText) {
                if (sText && sText.includes(oRange.Low)) {
                    sRangeText = sText;
                }
            });
        } else if (typeof aFilterLabel === "string") {
            sRangeText = aFilterLabel;
        }
        if (!sRangeText && oRange.Low && oRange.High) {
            var oFilterData = oGlobalFilter && oGlobalFilter.getFilterData() || {},
                oPropertyData = oFilterData[sPropertyName] || {};
            if (oPropertyData.ranges) {
                var aRanges = oPropertyData.ranges || [];
                var aRelativeRange = aRanges.filter(function(oRangeInfo) {
                    return oRangeInfo.value1 === oRange.Low;
                });
                var oRelativeRange = aRelativeRange[0] || {};
                sRangeText = oRelativeRange.tokenText || "";
            }
        }

        return sRangeText;
    }

    /**
     * Adds a filter value to selection variant
     * 
     *  - Use the Global Filter's UI state to get the actual filter value, and add it to selection option.
     *  - In case if the property / filter value does not exist in global filter's UI state then add a "" (empty string) as a value to Selection Variant.
     * 
     * @param {object} oGlobalFilter
     * @param {string} sPropertyName
     * @param {object} oSelectionVariant
     * @param {Array} aFilterLabel
    */
    function addFiltervalues(oGlobalFilter, sPropertyName, oSelectionVariant, aFilterLabel) {
        var oUIState = oGlobalFilter && oGlobalFilter.getUiState(),
            oSelVariant = oUIState && oUIState.getSelectionVariant(),
            aSelectOptions = oSelVariant && oSelVariant.SelectOptions || [],
            bFilterUpdated = false;
        aSelectOptions.filter(function(oSelOption) {
            return oSelOption && oSelOption["PropertyName"] === sPropertyName;
        }).map(function(oSelOption) {
            bFilterUpdated = true;
            var aRanges = oSelOption && oSelOption.Ranges || [];
            
            aRanges.forEach(function(oRange) {
                var sText = getRelatedTextToRange(oRange, aFilterLabel, oGlobalFilter, sPropertyName);
                oSelectionVariant.addSelectOption(sPropertyName, oRange.Sign, oRange.Option, oRange.Low, oRange.High, sText);
            });
        });

        if (!bFilterUpdated) {
            oSelectionVariant.addSelectOption(sPropertyName, "I", "EQ", "");
        }
    }

    /**
     * Get the single filter value
     * 
     * @param {object} oFilter
     * @param {string} sFilterPath
     * @returns {*} string value in case of success, error in case of unsupported operator.
    */
    function getSingleFilterValue(oFilter, sFilterPath) {
        var sFilter;
        var rSingleQuote = /'/g;

        switch (oFilter.Option) {
            case "BT":
                sFilter =
                    sFilterPath +
                    " ge " +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    " and " +
                    sFilterPath +
                    " le " +
                    "'" +
                    oFilter.High.replace(rSingleQuote, "''") +
                    "'";
                break;
            case "NB":
                sFilter =
                    sFilterPath +
                    " lt " +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    " or " +
                    sFilterPath +
                    " gt " +
                    "'" +
                    oFilter.High.replace(rSingleQuote, "''") +
                    "'";
                break;
            case "EQ":
            case "GE":
            case "GT":
            case "LE":
            case "LT":
            case "NE":
                sFilter = sFilterPath + " " + oFilter.Option.toLowerCase() + " " + "'" + oFilter.Low.replace(rSingleQuote, "''") + "'";
                break;
            case "Contains":
            case "EndsWith":
            case "NotContains":
            case "NotEndsWith":
            case "NotStartsWith":
            case "StartsWith":
                sFilter =
                    oFilter.Option.toLowerCase().replace("not", "not ") +
                    "(" +
                    sFilterPath +
                    "," +
                    "'" +
                    oFilter.Low.replace(rSingleQuote, "''") +
                    "'" +
                    ")";
                break;
            default:
                throw new Error("Unsupported operator: " + oFilter.Option);
        }
        return sFilter;
    }

     /**
     * Returns the semantic date range properties
     * 
     * @param {object} oCardDefinition Card defination object
     * @returns {Object} aDateProperties The date property keys in object format.
    */
    function getSemanticDateRangeProperties(oCardDefinition) {
        var oCardComponentData = oCardDefinition && oCardDefinition.cardComponentData,
            oAppComponent = oCardComponentData && oCardComponentData.appComponent,
            oOvpConfig = oAppComponent && oAppComponent.ovpConfig,
            oDateProperties = oOvpConfig && oOvpConfig.datePropertiesSettings;
        
        if (oDateProperties) {
            return oDateProperties;
        }
    }

    /**
     * Returns the related filter item from global filter items
     * 
     * @param {string} sParameterName Property name.
     * @param {object} oGlobalFilter
     * @returns {object} Related filter item object.
    */
    function getRelatedFilterItem(sParameterName, oGlobalFilter) {
        if (sParameterName && oGlobalFilter) {
            var aFilterItems = oGlobalFilter.getAllFilterItems() || [];

            return aFilterItems.filter(function (oFilterItem) {
                var sFilterItemName = oFilterItem && oFilterItem.getProperty("name");
                return sFilterItemName === "$Parameter." + sParameterName || sFilterItemName === sParameterName;
            })[0];
        }
    }

    /**
     * Checks if semantic date field has filter restriction applied in metadata in case if restriction is not present will be evaluated here.
     * 
     * @param {object} oProperty Card Property Object
     * @returns {Object} oDateRangeControl The Semantic Date Range control
    */
    function validateAndAddFilterRestriction(oProperty, oDateRangeControl) {
        if (oDateRangeControl && (!oProperty["sap:filter-restriction"])) {
            var aSingleRangeOptions = ['DATE', 'YESTERDAY', 'TODAY', 'TOMORROW', 'FIRSTDAYWEEK', 'LASTDAYWEEK', 'FIRSTDAYMONTH', 'LASTDAYMONTH', 'FIRSTDAYQUARTER', 'LASTDAYQUARTER', 'FIRSTDAYYEAR', 'LASTDAYYEAR'],
                aAllOptions = DynamicDateUtil.getAllOptionKeys(),
                aInterValOptions = aAllOptions.filter(function (sOptions) {
                    return aSingleRangeOptions.indexOf(sOptions) === -1;
                }),
                aDateRangeOptions = oDateRangeControl.getStandardOptions(),
                bFilterRestrictionInterval = aDateRangeOptions.some(function (sDateRangeOption) {
                    return aInterValOptions.indexOf(sDateRangeOption) > -1;
                });

            oProperty["_filterRestriction"] = bFilterRestrictionInterval ? "interval" : "single-value";
        }
    }

    /**
     * Checks if the semantic date range property is valid or not by checking if the property exists in the datePropertiesSettings of OVP's ui model or not
     * 
     * @param {object} oCardDefinition Card defination object
     * @param {object} oProperty 
     * @returns {boolean} true if control type is 'sap.m.DynamicDateRange' false otherwise.
    */
    function IsSemanticDateRangeValid(oCardDefinition, oProperty) {
        var bSemanticDateControl = false;
        if (oCardDefinition && oProperty) {
            var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter,
                sPropertyName = oProperty.name,
                oRelatedFilterItem = getRelatedFilterItem(sPropertyName, oGlobalFilter),
                oDateRangeControl = oRelatedFilterItem && oRelatedFilterItem.getControl(),
                bSemanticDateControl = oDateRangeControl && oDateRangeControl.getMetadata() && oDateRangeControl.getMetadata().getName() === 'sap.m.DynamicDateRange';
            
            if (bSemanticDateControl) {
                validateAndAddFilterRestriction(oProperty, oDateRangeControl);
            }
        }
        return bSemanticDateControl;
    }

    /**
     * Adds _semanticDateRangeSetting setting under configuration parameters for generated manifest 
     * Add the fields only if there is a property in card's entity type equivalent to the manifest field.
     * Currently Fields which has options "customDateRangeImplementation" will be ignored as for custom date range a 
     * JS class reference will be given which might not be available for generated cards.
     * The option of default value will also be ignored as the default value will be set to configuration parameters if exists.
     * In case if user has changed the value that changed value will replace the default value in configuration parameters.
     * 
     * @param {object} oCardDefinition Card defination object
     * @returns {object} oSemanticDateRangeConfig The semantic date range configuration.
    */
    function getSemanticDateConfiguration(oCardDefinition) {
        var oDateProperties = getSemanticDateRangeProperties(oCardDefinition);
        var aDateProperties = oDateProperties && Object.keys(oDateProperties);
        
        if (aDateProperties && aDateProperties.length) {
            aDateProperties.forEach(function(sFieldKey) {
                if (oSemanticDateRangeConfig[sFieldKey]) {
                    var aOperations = oDateProperties[sFieldKey] && Object.keys(oDateProperties[sFieldKey]) || [];
                    aOperations.forEach(function(sOperation) {
                        if (sOperation && sOperation !== "defaultValue" && sOperation !== "customDateRangeImplementation") {
                            oSemanticDateRangeConfig[sFieldKey][sOperation] = oDateProperties[sFieldKey][sOperation];
                        }
                    });
                }
            });
        }

        return oSemanticDateRangeConfig;
    }

    /**
     * Sets filter restriction to oSemanticDateRangeConfig property of filterhelper from the given property.
     * 
     * @param {object} oParameter Property defination from entity type for relavant filter / parameters.
     * @param {boolean} bTypeParameter If the type of property is parameter or a filter.
     * 
    */
    function setFilterRestrictionToSemanticDateRange(oParameter, bTypeParameter) {
        if (bTypeParameter) {
            oSemanticDateRangeConfig[oParameter.name] = {"sap:filter-restriction" : "single-value"};
        } else {
            oSemanticDateRangeConfig[oParameter.name] = {"sap:filter-restriction" : oParameter["sap:filter-restriction"] || oParameter["_filterRestriction"]};
        }
    }

    /**
     * Returns the default value for given property from the semantic date range configuration of OVP manifest in case if exists.
     * 
     * @param {object} oCardDefinition
     * @param {string} sPropertyName The relavant filter property name.
     * @param {string} The default value for relavant property from semantic date range configuration of OVP manifest.
    */
    function getDateRangeDefaultValue(oCardDefinition, sPropertyName) {
        var oDateProperties = getSemanticDateRangeProperties(oCardDefinition);
        
        if (oDateProperties && oDateProperties[sPropertyName] && oDateProperties[sPropertyName]['defaultValue']) {
            return oDateProperties[sPropertyName]['defaultValue']['operation'];
        } else {
            var oRawManifest = oCardDefinition.cardComponentData.appComponent.getManifestObject().getRawJson();
            var oOvpConfig = oRawManifest && oRawManifest["sap.ovp"];
            var oFields = oOvpConfig && oOvpConfig.filterSettings && oOvpConfig.filterSettings.dateSettings && oOvpConfig.filterSettings.dateSettings.fields;

            return oFields && oFields[sPropertyName] && oFields[sPropertyName]['defaultValue'] && oFields[sPropertyName]['defaultValue']['operation'];
        }
    }

    /**
     * Returns the Range value from smart filter bar which is relavant to given property.
     * 
     * @param {object} oGlobalFilter
     * @param {string} sPropertyName The relavant filter property name.
     * @param {object} The relavant Range value form smart filter bar.
    */
    function getRangeValueFromSmartFilterBar(oGlobalFilter, sPropertyName) {
        var oUIState = oGlobalFilter && oGlobalFilter.getUiState(),
            oSelVariant = oUIState && oUIState.getSelectionVariant(),
            aSelectOptions = oSelVariant && oSelVariant.SelectOptions || [];

        var aRelativeSelectOption = aSelectOptions.filter(function(oSelOption) {
            return oSelOption && oSelOption["PropertyName"] === sPropertyName;
        });

        aRelativeSelectOption = aRelativeSelectOption && aRelativeSelectOption[0] || [];

        var aRanges = aRelativeSelectOption.Ranges || [];

        return aRanges && aRanges[0];
    }
   /**
     * Returns the boolean value if the given operation is matching from list of Operations.
     * 
     * @param {string} sOperation Parameter value to search for operation.
     * @returns {boolean} boolean indicating the operation is present or not.
    */
    function getDateOperationValue(sOperation) {
        var aDateOperations = ["DATE", "DATETIME"];
        return aDateOperations.indexOf(sOperation) > -1;
    }
    /**
     * Returns the date range value for parameters, the value will be a string.
     * 
     * @param {object} oValue Parameter value from smart filter bar.
     * @returns {string} For date and datetime operation return the value in stringified format otherwise return the operation
    */
    function getDateRangeValueForParameters(oValue) {
        if (oValue) {
            var oConditionInfo = oValue.conditionTypeInfo,
                oControlData = oConditionInfo && oConditionInfo.data;
            if (getDateOperationValue(oControlData.operation) && oControlData.value1) {
                return JSON.stringify(oControlData.value1);
            }
            return oControlData.operation;
        }
    }
    /**
     * Returns the date range value for filters, the value will be in form of Selection Variant Range.
     * 
     * @param {object} oParameter Property defination from entity type for relavant filter / parameters.
     * @param {object} oGlobalFilter
     * @param {*} aFilterLabel The labels of current field could be of type Array | String.
     * @returns {*} Range object in case of filters.
    */
    function getDateRangeValueForFilters(oParameter, oGlobalFilter, aFilterLabel) {

        var oDateRangeValue = getParameterActualValue(oParameter.name, oGlobalFilter);
        var oConditionInfo = oDateRangeValue && oDateRangeValue.conditionTypeInfo;

        var sOperation = oConditionInfo && oConditionInfo.data && oConditionInfo.data["operation"];
        var aRanges = oDateRangeValue && oDateRangeValue["ranges"];
        var oRange = aRanges && aRanges[0];

        if (sOperation) {
            switch (sOperation) {
                case "DATE":
                case "DATERANGE":
                case "SPECIFICMONTH":
                case "FROM":
                case "TO":
                case "DATETIME":
                case "DATETIMERANGE":
                case "FROMDATETIME":
                case "TODATETIME":
                    var sText = getRelatedTextToRange({ Low: oRange.Low }, aFilterLabel, oGlobalFilter, oParameter.name);
                    var oDateRange = getRangeValueFromSmartFilterBar(oGlobalFilter, oParameter.name);
                    if (oDateRange) {
                        oDateRange.Text = sText;
                        return oDateRange;
                    }
                    break;
                case "LASTDAYS":
                case "LASTWEEKS":
                case "LASTMONTHS":
                case "LASTQUARTERS":
                case "LASTYEARS":
                case "NEXTDAYS":
                case "NEXTWEEKS":
                case "NEXTMONTHS":
                case "NEXTQUARTERS":
                case "NEXTYEARS":
                    var sValue = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value1;
                    var sText = getRelatedTextToRange({ Low: sValue }, aFilterLabel, oGlobalFilter, oParameter.name);
                    return { Low: sOperation, High: sValue.toString(), Option: "BT", Text: sText };
                case "TODAYFROMTO":
                    var Value1 = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value1;
                    var Value2 = oConditionInfo && oConditionInfo.data && oConditionInfo.data.value2;
                    var sText = getRelatedTextToRange({ Low: Value1 }, aFilterLabel, oGlobalFilter, oParameter.name);
                    return { Low: sOperation, High: Value1.toString() + "," + Value2.toString(), Option: "BT", Text: sText };
                default:
                    var sText = getRelatedTextToRange({ Low: sOperation }, aFilterLabel, oGlobalFilter, oParameter.name) || "";
                    sText = sText.substring(0, sText.indexOf("(") - 1);
                    return { Low: sOperation, High: null, Option: "EQ", Text: sText };
            }
        }
    }

    /**
     * Returns the related filter item from global filter items
     * 
     * @param {string} sParameterName Property name.
     * @param {object} oCardDefinition
     * @returns {object} Object consists of operator and values.
    */
    function getDateRangeControlValue(sParameterName, oCardDefinition) {
        var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter;
        var oRelatedFilterItem = getRelatedFilterItem(sParameterName, oGlobalFilter);
        var oDateRangeControl = oRelatedFilterItem && oRelatedFilterItem.getControl();
        var oDateRangeValue = oDateRangeControl && oDateRangeControl.getValue();
        var bSemanticDateRangeControl = oDateRangeControl && oDateRangeControl.getMetadata() && oDateRangeControl.getMetadata().getName() === 'sap.m.DynamicDateRange';
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');

        if (oDateRangeValue && bSemanticDateRangeControl && bInsightRTEnabled) {
            return JSON.stringify(oDateRangeValue);
        } else {
            var sSemanticDateRangeDefaultValue = getDateRangeDefaultValue(oCardDefinition, sParameterName) || "";
            return JSON.stringify({operator: sSemanticDateRangeDefaultValue, values: []});
        }
    }

    /**
     * Adds the semantic date range value to the filter property in generated manifest's configuration parameter in form of selection variant.
     * 
     * @param {object} oCardDefinition
     * @param {object} oProperty Property defination from entity type for relavant filter.
     * @param {string} sDefaultValue The default value of the current filter.
     * @param {object} oSelectionVariant
     * @param {*} aFilterLabel The labels of current field could be of type Array | String.
    */
    function addDateRangeValueToSV(oCardDefinition, oProperty, sDefaultValue, oSelectionVariant, aFilterLabel) {
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties"),
            bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled'),
            oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter,
            sSemantiDateRangeDefaultValue = getDateRangeDefaultValue(oCardDefinition, oProperty.name) || sDefaultValue;

        if (bInsightRTEnabled) {
            var oDateRangeValue = getDateRangeValueForFilters(oProperty, oGlobalFilter, aFilterLabel);
            if (oDateRangeValue) {
                oSelectionVariant.addSelectOption(oProperty.name, "I", oDateRangeValue.Option, oDateRangeValue.Low, oDateRangeValue.High, oDateRangeValue.Text);
            } else {
                oSelectionVariant.addSelectOption(oProperty.name, "I", "EQ", "", null, "");
            }
        } else if (sSemantiDateRangeDefaultValue) {
            oSelectionVariant.addSelectOption(oProperty.name, "I", "EQ", sSemantiDateRangeDefaultValue, null, sSemantiDateRangeDefaultValue);
        } else {
            oSelectionVariant.addSelectOption(oProperty.name, "I", "EQ", "", null, "");
        }
    }

    /**
     * Get the label for given smart filter bar's filter field.
     * 
     * @param {string} sParameterName Smart filter bar property name.
     * @param {object} oGlobalFilter
     * @returns {*} The value of smart filter bar's filter, in case of parameter in a string for filters in Object.
    */
    function getLabelForField(sParameterName, oGlobalFilter) {
        if (oGlobalFilter && sParameterName) {
            var aFilterValues = oGlobalFilter.getFiltersWithValues() || [],
                sFilterName = "",
                aRelatedFilterValue = aFilterValues.filter(function(oFilterVal) {
                    sFilterName = oFilterVal && oFilterVal.getName();
                    return sFilterName === sParameterName || "$Parameter." + sParameterName === sFilterName;
                });
            var oControl = aRelatedFilterValue && aRelatedFilterValue[0] && aRelatedFilterValue[0].getControl();

            if (oControl && 
                oControl.getMetadata() && 
                oControl.getMetadata().getName() === "sap.m.DynamicDateRange") {
                var sIdForLabel = oControl.getIdForLabel() || "";
                sIdForLabel = sIdForLabel.substring(0, sIdForLabel.lastIndexOf("-"));

                if (sIdForLabel) {
                    var sInputControl = Core.byId(sIdForLabel);
                    return sInputControl && sInputControl.getValue();
                }
            } else if (oControl &&
                oControl.getProperty("value")) {
                return oControl.getProperty("value");
            } else if (oControl && 
                typeof oControl.getTokens === 'function') {
                var aTokens = oControl.getTokens() || [],
                    aTexts = aTokens.map(function(oToken) {
                    return oToken.getText();
                });

                return {type : "filters", value : aTexts};
            }
        }
    }

    /**
     * Get the label property of smartfilterbar control and add to the configuration parameters in generated manifest.
     * Generated i18n key for the property in case of DT scenario.
     * 
     * @param {string} sKeyName Smart filter bar property name.
     * @param {object} oGlobalFilter
     * @param {object} oTarget The target configuration parameter object which needs to be  updated.
     * @param {object} oCardDefinition
     * @param {string} sDefaultValue Default value of parameter
     * @param {boolean} bSemanticDateRange If semantic date range is enabled or not
     * @returns {string} sLabelForField The lablel value for the given smart filter bar control
    */
    function getLabelForConfigParams(sKeyName, oGlobalFilter, oTarget, oCardDefinition, sDefaultValue, bSemanticDateRange) {
        var sLabelForField = getLabelForField(sKeyName, oGlobalFilter);
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');

        // Either in RT Mode or In case of DT Mode if it is a mandatory parameter then add label value as despription if present.
        if (sLabelForField &&
            typeof sLabelForField === 'string' &&
            (bInsightRTEnabled || sDefaultValue)) {

            if (!oTarget[sKeyName]) {
                oTarget[sKeyName] = {};
            }

            oTarget[sKeyName]["label"] = sLabelForField;

            // In case of DT Scenario generate i18n keys
            if (sDefaultValue && !bInsightRTEnabled) {
                var si8nKey = "configuration.parameters." + sKeyName + ".label",
                    sCardId = oCardDefinition.cardComponentData.cardId,
                    sTextKey = sCardId + "_configuration_parameters_" + sKeyName + "_label";
                i18nHelper.seti18nValueToMap(si8nKey, "{{" + sTextKey + "}}", true);
                sLabelForField = bSemanticDateRange ? sDefaultValue : sLabelForField;
                i18nHelper.inserti18nPayLoad(sCardId, sTextKey, sLabelForField, "Label", "Configuration Parameter label");
            }
            return sLabelForField;
        } else if (sLabelForField && sLabelForField.value && sLabelForField.type === "filters") {
            return sLabelForField.value;
        }
    }

    /**
     * Adds values of analytical parameters to aParams (by reference) in case if ConsiderAnalyticalParameters is set to true.
     * => Add the anlytical parameter to aParams only if it does not already exists in aParams and exists in cardItemsBinding path. 
     * 
     * @param {object} oCardDefinition
     * @param {object} aParams The parameters reference.
    */
    function handleConsiderAnalyticalParameters(oCardDefinition, aParams) {
        var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter;

        if (oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters()) {
            var oCardItemsBinding = oCardDefinition.view.getController().getCardItemsBinding(),
                sBindingPath = oCardItemsBinding && oCardItemsBinding.getPath() || "",
                aAnalyticalParams = oGlobalFilter.getAnalyticalParameters() || [];

            aAnalyticalParams.forEach(function(oAnalyticalParam) {
                var bParameterExists = aParams.some(function(oParameter) {
                    return oParameter.name === oAnalyticalParam.name;
                });

                if (!bParameterExists && sBindingPath.indexOf(oAnalyticalParam.name) > -1) {
                    aParams.push(oAnalyticalParam);
                }
            });
        }
    }

    return {
        enhanceVariant: enhanceVariant,
        updateRangeValue: updateRangeValue,
        getPropertyType: getPropertyType,
        getParameterValue: getParameterValue,
        getRequestAtLeastFields: getRequestAtLeastFields,
        getFilterDefaultValue: getFilterDefaultValue,
        getParameterDefaultValue: getParameterDefaultValue,
        addFiltervalues: addFiltervalues,
        getParameterActualValue: getParameterActualValue,
        removeExtraInfoVariant: removeExtraInfoVariant,
        getSingleFilterValue: getSingleFilterValue,
        getSemanticDateConfiguration: getSemanticDateConfiguration,
        IsSemanticDateRangeValid: IsSemanticDateRangeValid,
        getDateRangeValueForParameters: getDateRangeValueForParameters,
        getDateRangeControlValue: getDateRangeControlValue,
        getDateOperationValue: getDateOperationValue,
        getLabelForConfigParams: getLabelForConfigParams,
        getRelatedTextToRange: getRelatedTextToRange,
        setFilterRestrictionToSemanticDateRange: setFilterRestrictionToSemanticDateRange,
        addDateRangeValueToSV: addDateRangeValueToSV,
        getDateRangeDefaultValue: getDateRangeDefaultValue,
        resetSemanticDateRangeConfig: resetSemanticDateRangeConfig,
        handleConsiderAnalyticalParameters: handleConsiderAnalyticalParameters
    };
});
