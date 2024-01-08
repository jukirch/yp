/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/integration/widgets/Card",
    "sap/ovp/app/OVPLogger",
    "sap/ovp/app/NavigationHelper",
    "sap/ovp/insights/helpers/AnalyticalCard",
    "sap/ovp/insights/helpers/i18n",
    "sap/ovp/insights/helpers/Batch",
    "sap/ovp/insights/helpers/Filters",
    "sap/ovp/app/resources",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/helpers/ODataDelegator",
    "sap/ovp/insights/helpers/CardHeader",
    "sap/fe/navigation/SelectionVariant",
    "sap/ovp/cards/CommonUtils",
    "sap/ui/core/Core",
    "sap/ovp/insights/helpers/ListContentHelper",
    "sap/ovp/insights/helpers/ContentHelper",
    "sap/ovp/insights/helpers/TableContentHelper",
    "sap/insights/CardHelper",
    "sap/m/MessageToast",
    "sap/ovp/insights/helpers/CardAction",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/handlers/SmartFilterbarHandler"
], function (
    Card,
    OVPLogger,
    NavigationHelper,
    AnalyticalCardHelper,
    i18nHelper,
    BatchHelper,
    Filterhelper,
    OvpResources,
    Fragment,
    JSONModel,
    MetadataAnalyser,
    ODataDelegator,
    CardHeader,
    SelectionVariant,
    CommonUtils,
    Core,
    ListContentHelper,
    ContentHelper,
    TableContentHelper,
    CardHelper,
    MessageToast,
    CardActionHelper,
    CardNavigationHelper,
    SmartFilterBarHandler
) {
    "use strict";

    var oLogger = new OVPLogger("sap.ovp.insights.IntegrationCard");
    var sHomeFormatterPath = "module:sap/insights/CardExtension";
    var sapAppi18nPath = "";

    var getParametersForACard = function (oControl, sBindingParam, aRequestAtLeastProps, bAddODataSelect, cardTemplate) {
        var oDataBinding = oControl && oControl.getBinding(sBindingParam);
        var aApplicationFilters, sBindingPath, sSelect, aUniqueSelect, sSortParameters, sRangeParams;
        var sCustomParam, aCustomParams, sExpandParam;
        var bAddRequestAtLeastProps = bAddODataSelect && cardTemplate != "sap.ovp.cards.charts.analytical" && cardTemplate != "sap.ovp.cards.charts.smart.chart"; 
        if (oDataBinding) {
            aApplicationFilters = oDataBinding.aApplicationFilters;
            sBindingPath = oDataBinding.getPath();
            sSelect = oDataBinding.mParameters.select;
            aUniqueSelect = aUniqueArray(sSelect && sSelect.split(","));
            sSelect = aUniqueSelect && aUniqueSelect.join();
            sSortParameters = oDataBinding.sSortParams;
            sRangeParams = oDataBinding.sRangeParams;
            sCustomParam = oDataBinding && oDataBinding.sCustomParams;
            aCustomParams = sCustomParam && sCustomParam.split("&");
            aCustomParams = aCustomParams && aCustomParams.filter(function(sCustomParam) {
                return sCustomParam.indexOf("$expand") > -1;
            });
            sExpandParam = aCustomParams && aCustomParams[0];
        }
        var aRangeParams = sRangeParams && sRangeParams.split("&") || [];
        var skip, top;
        for (var i = 0; i < aRangeParams.length; i++) {
            var sParam = aRangeParams[i];
            if (sParam.indexOf("$skip") > -1) {
                skip = sParam.split("&")[0];
            }
            if (sParam.indexOf("$top") > -1) {
                top = sParam.split("&")[0];
            }
        }
        // consider requestAtLeast properties for $select
        if (bAddRequestAtLeastProps && aRequestAtLeastProps && aRequestAtLeastProps.length) {
            var aSelectParams = (sSelect && sSelect.split(",")) || [];
            aRequestAtLeastProps.forEach(function (sParam) {
                if (!aSelectParams.includes(sParam)) {
                    aSelectParams.push(sParam);
                }
            });
            sSelect = aSelectParams.join(",");
        }
        return {
            sBindingPath: sBindingPath,
            aApplicationFilters: aApplicationFilters,
            sSelect: sSelect ? "$select=" + sSelect : "",
            sSortParameters: sSortParameters ? sSortParameters : "",
            skip: skip ? skip : "$skip=0", // $skip will be useful for scenario's like pagination in LR for OVP cards we can keep default value as 0.
            top: top ? top : "",
            sExpandParam: sExpandParam || "" 
        };
    };

    var getRangeOptionFilter = function (oCardDefinition, aRangeFilters) {
        var oCardController = oCardDefinition.view.getController(),
            oMainComponent = oCardController.oCardComponentData && oCardController.oCardComponentData.mainComponent,
            oCardNavigationParams = CardNavigationHelper.getEntityNavigationParameters(
                oMainComponent, 
                oCardController.getModel(), 
                oCardDefinition.cardComponentData, 
                oCardController.getCardPropertiesModel(), 
                oCardController.getEntityType()
            ),
            sNavSelectionVariant = oCardNavigationParams && oCardNavigationParams.sNavSelectionVariant,
            oNavSelectionVariant = sNavSelectionVariant && JSON.parse(sNavSelectionVariant),
            aSelectionOptions = oNavSelectionVariant && oNavSelectionVariant.SelectOptions || [];
        
        return aSelectionOptions.filter(function(oSelectionVariant) {
            return aRangeFilters.indexOf(oSelectionVariant["PropertyName"]) > -1;
        });
    };
    
    var getPropertyMapping = function (
        sTargetProperty,
        oTargetEntityType,
        oTargetModel,
        aParams,
        oCardDefinition
    ) {
        var oEntityModel = oCardDefinition.view.getModel(),
            oEntityType = oCardDefinition && oCardDefinition.entityType,
            aEntityProperties = oEntityType && oEntityType.property;

        var sMappedProperty,
            aEntityArr = [],
            oProperty,
            oResult,
            sEntityname = oEntityType && oEntityType.name,
            sTargetEntityname = oTargetEntityType && oTargetEntityType.name;
        var oEntity = oEntityModel.oMetadata._getEntityTypeByName(sEntityname);
        var oTargetEntity = oTargetModel && oTargetModel.oMetadata._getEntityTypeByName(sTargetEntityname);
        if (!oEntity && !oTargetEntity) {
            return;
        } else if (oEntity && !oTargetEntity) {
            aEntityArr = [oEntity.property];
        } else if (oEntity && oTargetEntity) {
            aEntityArr = [oEntity.property, oTargetEntity.property];
        }
        for (var j = 0; j < aEntityArr.length; j++) {
            aEntityProperties = JSON.parse(JSON.stringify(aEntityArr[j]));
            //Check if entity property found with same name
            for (var i = 0; i < aEntityProperties.length; i++) {
                if (aEntityProperties[i].name === sTargetProperty) {
                    sMappedProperty = aEntityProperties[i];
                    return sMappedProperty;
                }
                //If direct match not found then check for fuzzy logic using "P_"
                if (
                    "P_" + aEntityProperties[i].name === sTargetProperty ||
                    aEntityProperties[i].name === "P_" + sTargetProperty ||
                    "$Parameter.P_" + aEntityProperties[i].name === sTargetProperty ||
                    aEntityProperties[i].name === "$Parameter.P_" + sTargetProperty
                ) {
                    sMappedProperty = aEntityProperties[i];
                    if (sMappedProperty && MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oEntityModel, oCardDefinition.entitySet.name)) {
                        oProperty = aParams.length && matchedParameterProperty(sTargetProperty, aParams);
                    }
                    return oProperty && oProperty.length ? oProperty[0] : sMappedProperty;
                }
            }
        }
        if (MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oEntityModel, oCardDefinition.entitySet.name)) {
            oResult = aParams.length && matchedParameterProperty(sTargetProperty, aParams);
            if ((!oResult || !oResult.length) && sTargetProperty.includes("/")) {
                var aParameter = sTargetProperty.split("/");
                oResult = aParameter.length && matchedParameterProperty(aParameter[aParameter.length - 1], aParams);
            }
        }
        if (oResult && oResult.length) {
            return oResult[0];
        }
        return undefined;
    };
    var propertyExtensionData = function (oPropertyTest, sProperty) {
        var oDataValues;
        if (oPropertyTest && oPropertyTest[sProperty]) {
            return oPropertyTest[sProperty];
        } else if (oPropertyTest && oPropertyTest.extensions) {
            oDataValues = oPropertyTest.extensions;
            for (var i = 0; i < oDataValues.length; i++) {
                if (oDataValues[i].name === sProperty) {
                    return oDataValues[i].value;
                }
            }
        }
        return "";
    };
    var matchedParameterProperty = function (sKey, aParams) {
        return aParams.filter(function (param) {
            if (
                param.name === sKey ||
                "P_" + param.name === sKey ||
                param.name === "P_" + sKey ||
                "$Parameter.P_" + param.name === sKey ||
                param.name === "$Parameter.P_" + sKey ||
                param.name === "$Parameter." + sKey ||
                "$Parameter." + param.name === sKey
            ) {
                return param;
            }
        });
    };
    var isPropertyFilterable = function (oProperty) {
        return oProperty["sap:filterable"] ? oProperty["sap:filterable"] !== "false" : true;
    };
    var getCommonPropertiesFromGlobalEntity = function (aEntityProp, aGlobalProp, aParameters) {
        var aGlobalPropKeys = aGlobalProp.filter(function(oProperty) {
            var bPropertyExitsInCardEntity = aEntityProp.some(function(oProp) {
                return oProp === oProperty.name;
            });
            return isPropertyFilterable(oProperty) && bPropertyExitsInCardEntity;
        }) || [];
        if (aParameters && aParameters.length > 0) {
            aEntityProp.forEach(function(oEntityProp){
                var sPropertyNameWithPrefix = "P_" + oEntityProp.name;
                if (aParameters.includes(sPropertyNameWithPrefix)) {
                    aGlobalPropKeys.push(oEntityProp);
                }
            });
        }
        return aGlobalPropKeys;
    };
    var mandatoryParamCheck = function (oPropertyTest) {
        var aDataValues = [];
        if (oPropertyTest && oPropertyTest.extensions) {
            aDataValues = oPropertyTest.extensions;
            for (var i = 0; i < aDataValues.length; i++) {
                if (aDataValues[i].name === "parameter" && aDataValues[i].value === "mandatory") {
                    return oPropertyTest.name;
                } else if (aDataValues[i].name === "required-in-filter" && aDataValues[i].value === "true") {
                    return oPropertyTest.name;
                }
            }
        }
    };

    var getRelatedEntityProperty = function(oFilterProp, aEntityProperties) {
        if (aEntityProperties && aEntityProperties.length) {
            var aEntityProperty = aEntityProperties.filter(function(oEntityProperty) {
                return oEntityProperty.name === oFilterProp.name;
            });

            return aEntityProperty && aEntityProperty[0];
        }
    };

    var addFilterPropertyDetails = function (
        oFilterProperty,
        oFinal,
        aParams,
        aParameterKeys,
        aMandatoryParamSet,
        aMandatoryFilterSet,
        oCardDefinition
    ) {

        var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter,
            oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties"),
            bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');
        var sSemanticDateDescription = "";

        if (oFilterProperty["PropertyName"] && oFilterProperty["PropertyName"]["PropertyPath"]) {
            var sKeyName = oFilterProperty["PropertyName"]["PropertyPath"],
                sTargetEntityname = SmartFilterBarHandler.getEntityType(oGlobalFilter),
                oFiltermodel = oGlobalFilter && oGlobalFilter.getModel(),
                oFilterMetaModel = oFiltermodel && oFiltermodel.getMetaModel(),
                oTargetEntityType = oFilterMetaModel && oFilterMetaModel.getODataEntityType(sTargetEntityname),
                bConsiderAnalyticParameters = oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters();
            
            var oPropertyDetails;

            if (bConsiderAnalyticParameters) {
                oPropertyDetails = aParams.filter(function(oParameterProperty) {
                    return oParameterProperty.name === sKeyName;
                })[0];
            }
            if (!oPropertyDetails) {
                oPropertyDetails = getPropertyMapping(
                    sKeyName,
                    oTargetEntityType,
                    oFiltermodel,
                    aParams,
                    oCardDefinition
                );
            }

            if (oFilterProperty["PropertyValue"] && oFilterProperty["PropertyValue"]["String"]) {
                sKeyName = oPropertyDetails && oPropertyDetails.name ? oPropertyDetails.name : sKeyName;
                var sMandatoryParam = mandatoryParamCheck(oPropertyDetails);
                var sParamActualValue = Filterhelper.getParameterActualValue(sKeyName, oGlobalFilter);
                var bIsValidSemanticDateRange = Filterhelper.IsSemanticDateRangeValid(oCardDefinition, oPropertyDetails);

                if (sMandatoryParam && aParameterKeys.includes(sMandatoryParam)) {
                    aMandatoryParamSet.push(sMandatoryParam);

                    if (!bIsValidSemanticDateRange) {
                        oFinal[sKeyName] = {
                            value: bInsightRTEnabled && sParamActualValue ? sParamActualValue : oFilterProperty["PropertyValue"]["String"],
                            type: Filterhelper.getPropertyType(oPropertyDetails),
                            description:
                                oPropertyDetails && oPropertyDetails.description ? oPropertyDetails.description : null,
                            label: Filterhelper.getLabelForConfigParams(sKeyName, oGlobalFilter, oFinal, oCardDefinition, oFilterProperty["PropertyValue"]["String"])
                        };
                    } else {
                        sSemanticDateDescription = Filterhelper.getDateRangeControlValue(sKeyName, oCardDefinition);
                    }

                    oFinal[sKeyName]["description"] = sSemanticDateDescription || propertyExtensionData(oPropertyDetails, "description");
                } else if (sMandatoryParam) {
                    aMandatoryFilterSet.push(sMandatoryParam);
                    var oSelecVariant = new SelectionVariant();
                    var aFilterLabel = Filterhelper.getLabelForConfigParams(sKeyName, oGlobalFilter, oFinal, oCardDefinition, oFilterProperty["PropertyValue"]["String"]) || [];
                    var sText = "";
                    if (bInsightRTEnabled && sParamActualValue) {
                        sText = Filterhelper.getRelatedTextToRange({Low : sParamActualValue}, aFilterLabel, oGlobalFilter, sKeyName);
                        oSelecVariant.addSelectOption(sKeyName, "I", "EQ", sParamActualValue, null, sText);
                    } else {
                        sText = Filterhelper.getRelatedTextToRange({Low : oFilterProperty["PropertyValue"]["String"]}, aFilterLabel, oGlobalFilter, sKeyName);
                        oSelecVariant.addSelectOption(sKeyName, "I", "EQ", oFilterProperty["PropertyValue"]["String"], null, sText);
                    }

                    var bIsValidSemanticDateRange = Filterhelper.IsSemanticDateRangeValid(oCardDefinition, oPropertyDetails);

                    if (!bIsValidSemanticDateRange) {
                        oFinal[sKeyName] = {
                            value: oSelecVariant.toJSONString(),
                            type: Filterhelper.getPropertyType(oPropertyDetails),
                            description:
                                oPropertyDetails && oPropertyDetails.description ? oPropertyDetails.description : null
                        };
                        oFinal[sKeyName].value = Filterhelper.enhanceVariant(oFinal[sKeyName].value);
                    } else {
                        sSemanticDateDescription = Filterhelper.getDateRangeControlValue(sKeyName, oCardDefinition);
                    }

                    oFinal[sKeyName]["description"] = sSemanticDateDescription || propertyExtensionData(oPropertyDetails, "description");
                }
            }
        }
    };
    var aUniqueArray = function (aArr) {
        return aArr && aArr.filter(function (element, index) {
            return aArr.indexOf(element) === index;
        });
    };

    /**
     * This function returns the array of property name of an entity set
     * @param {object} oEntityType The entity type
     * @param {object} oEntityModel entity model object
     * @returns {array} 
     * @public
     */
    var getEntityTypePropertiesList = function (oEntityType, oEntityModel) {
        if (!CommonUtils.isODataV4(oEntityModel)) {
            return oEntityType.property.map(function(prop){
                return prop.name;
            });
        } else {
            return Object.keys(oEntityType.property);
        }
    };

    /**
     * Create the configuration parameters for the generated card
     *  - Evaluate all the parameters to get the value for the manifest configuration.
     *  - Evaluate all filter properties which are common between both card and smart filter bar entity type.
     *  - Evaluate the SelectionAnnotation given for card.
     *  - Add all filters to '_relevantODataFilters', all parameters to '_relevantODataParameters' [ All means including mandatory ].
     *  - Add mandatory filters to '_mandatoryODataFilters' and mandatory parameters to '_mandatoryODataParameters'.
     *
     * @param {Object} oCardDefinition
     * @returns {Object} oFinalSet The final configuration parameters
     */
    var getFilterDetails = function (oCardDefinition) {
        var oFinalSet = { filters: {} };
        var oFinal = oFinalSet.filters;
        var oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter;
        var oFiltermodel = oGlobalFilter && oGlobalFilter.getModel();
        var sTargetEntityname = SmartFilterBarHandler.getEntityType(oGlobalFilter);
        var oEntityModel = oCardDefinition.view.getModel();
        var oEntityType = oCardDefinition.entityType,
            oPropertyTest,
            aParameterSet = [];
        var aRelevantFilter = [],
            aRangeFilters = [],
            aMandatoryParamSet = [],
            aMandatoryFilterSet = [],
            oSelectionVariant,
            aRangeSelectionOptions,
            aParameterKeys = [];
        var aCommonFilterProperties = [];
        var oFilterMetaModel = oFiltermodel && oFiltermodel.getMetaModel();
        var oEntityContainer = oFilterMetaModel && oFilterMetaModel.getODataEntityContainer();
        var oTargetEntityType = oFilterMetaModel && oFilterMetaModel.getODataEntityType(sTargetEntityname);
        var aFBEntityType = oEntityContainer &&
            oEntityContainer.entitySet &&
            oEntityContainer.entitySet.filter(function (oEntitySet) {
                return oEntitySet.entityType === sTargetEntityname;
            });
        var oFBEntityType = aFBEntityType && aFBEntityType.length > 0 ? aFBEntityType[0] : {};
        var aParameterProperties = [];
        if (oFiltermodel) {
            var bParameterised = MetadataAnalyser.checkAnalyticalParameterisedEntitySet(oFiltermodel, oFBEntityType && oFBEntityType.name);
            if (bParameterised) {
                var oParametersInfo = ODataDelegator.getParametersByEntitySet(oFiltermodel, oFBEntityType);
                if (oParametersInfo.entitySetName) {
                    aParameterProperties = oParametersInfo.parameters || [];
                }
            }
        }
        var aParams = ODataDelegator.getParametersByEntitySet(oEntityModel, oCardDefinition.entitySet).parameters;
        Filterhelper.handleConsiderAnalyticalParameters(oCardDefinition, aParams);

        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');
        var sParamLabel = "";
        aParams.forEach(function (oParameter) {
            var sSemanticDateDescription = "";
            var sMandatoryProp = mandatoryParamCheck(oParameter);
            var sFilterParamDefaultValue = Filterhelper.getParameterDefaultValue(oFiltermodel, oFBEntityType, sMandatoryProp, oCardDefinition);
            var sCardParamDefaultValue = Filterhelper.getParameterDefaultValue(oEntityModel, oCardDefinition.entitySet, sMandatoryProp, oCardDefinition);
            var sDefaultValue = sFilterParamDefaultValue || sCardParamDefaultValue || oParameter.defaultValue || "";
            var sParamActualValue = Filterhelper.getParameterActualValue(oParameter.name, oGlobalFilter);
            sParamLabel = Filterhelper.getLabelForConfigParams(oParameter.name, oGlobalFilter, oFinal, oCardDefinition, sDefaultValue);

            var bIsValidSemanticDateRange = Filterhelper.IsSemanticDateRangeValid(oCardDefinition, oParameter);
            if (bIsValidSemanticDateRange) {
                var oConditionInfo = sParamActualValue.conditionTypeInfo;
                var sOperation = oConditionInfo && oConditionInfo.data && oConditionInfo.data["operation"];
                Filterhelper.setFilterRestrictionToSemanticDateRange(oParameter, true);
                sDefaultValue = Filterhelper.getDateRangeDefaultValue(oCardDefinition, oParameter.name) || sDefaultValue;
                sParamActualValue = Filterhelper.getDateRangeValueForParameters(sParamActualValue) || sParamActualValue;
                var bIsDateOperationValue = Filterhelper.getDateOperationValue(sOperation) || false;

                if (!bIsDateOperationValue) {
                    if (bInsightRTEnabled && sParamLabel && typeof sParamLabel === 'string') {
                        sParamLabel = sParamLabel.substring(0, sParamLabel.indexOf("(") - 1);
                    } else if (sDefaultValue) {
                        sParamLabel = sDefaultValue;
                        Filterhelper.getLabelForConfigParams(oParameter.name, oGlobalFilter, oFinal, oCardDefinition, sDefaultValue, true);
                    }
                }
                sSemanticDateDescription = Filterhelper.getDateRangeControlValue(oParameter.name, oCardDefinition);
            }

            if (sMandatoryProp) {
                aMandatoryParamSet.push(oParameter.name);
            }
            oFinal[oParameter.name] = {
                value: bInsightRTEnabled && sParamActualValue ? sParamActualValue : sDefaultValue,
                type: Filterhelper.getPropertyType(oParameter),
                description: sSemanticDateDescription || oParameter && oParameter.description,
                label: sParamLabel || ""
            };
            oFinal[oParameter.name]["description"] = sSemanticDateDescription || propertyExtensionData(oParameter, "description");
            aParameterSet.push(oParameter.name);
            aParameterKeys.push(oParameter.name);
        });
        aParameterProperties = aParameterProperties.filter(function(key) { 
            return !aParameterKeys.includes(key);
        });
        if (oEntityType && oEntityType.property && oTargetEntityType &&  oTargetEntityType.property) {
            var aEntityTypeProperties = getEntityTypePropertiesList(oEntityType, oEntityModel);
            aCommonFilterProperties = getCommonPropertiesFromGlobalEntity(aEntityTypeProperties, oTargetEntityType.property, aParameterProperties);
        }
        for (var i = 0; i < aCommonFilterProperties.length; i++) {
            var sSemanticDateDescription = "";
            var oFilterProp = aCommonFilterProperties[i],
                sFilterVal = "";
            var oRelatedEntityProperty = getRelatedEntityProperty(oFilterProp, oEntityType.property); //For checking mandatory parameter, Properties of card's entityset should be considered.
            var sMandatoryParam = mandatoryParamCheck(oRelatedEntityProperty);
            var sDefaultValue = Filterhelper.getFilterDefaultValue(oFilterProp.name, oTargetEntityType, oEntityType) || oFilterProp.defaultValue || "";
            var sParamActualValue = Filterhelper.getParameterActualValue(oFilterProp.name, oGlobalFilter);

            if (aParameterKeys.includes(oFilterProp.name)) {
                sParamLabel = Filterhelper.getLabelForConfigParams(oFilterProp.name, oGlobalFilter, oFinal, oCardDefinition, sDefaultValue);

                var bIsValidSemanticDateRange = Filterhelper.IsSemanticDateRangeValid(oCardDefinition, oFilterProp);
                if (bIsValidSemanticDateRange) {
                    Filterhelper.setFilterRestrictionToSemanticDateRange(oFilterProp, true);
                    sDefaultValue = Filterhelper.getDateRangeDefaultValue(oCardDefinition, oFilterProp.name) || sDefaultValue;
                    sParamActualValue = Filterhelper.getDateRangeValueForParameters(sParamActualValue) || sParamActualValue;

                    if (bInsightRTEnabled && sParamLabel && typeof sParamLabel === 'string') {
                        sParamLabel = sParamLabel.substring(0, sParamLabel.indexOf("(") - 1);
                    } else if (sDefaultValue) {
                        sParamLabel = sDefaultValue;
                        Filterhelper.getLabelForConfigParams(oFilterProp.name, oGlobalFilter, oFinal, oCardDefinition, sDefaultValue, true);
                    }
                    sSemanticDateDescription = Filterhelper.getDateRangeControlValue(oFilterProp.name, oCardDefinition);
                }
                oFinal[oFilterProp.name] = {
                    value: bInsightRTEnabled && sParamActualValue ? sParamActualValue : sDefaultValue,
                    type: Filterhelper.getPropertyType(oFilterProp),
                    description: sSemanticDateDescription || oFilterProp && oFilterProp.description,
                    label: sParamLabel
                };
                if (sMandatoryParam) {
                    aMandatoryParamSet.push(sMandatoryParam);
                }
                aParameterSet.push(oFilterProp.name);
            } else {
                oSelectionVariant = new SelectionVariant();
                var aFilterLabel = Filterhelper.getLabelForConfigParams(oFilterProp.name, oGlobalFilter, oFinal, oCardDefinition, sDefaultValue);

                var sParamActualValue;
                var bIsValidSemanticDateRange = Filterhelper.IsSemanticDateRangeValid(oCardDefinition, oFilterProp);
                if (bIsValidSemanticDateRange) {
                    Filterhelper.setFilterRestrictionToSemanticDateRange(oFilterProp, false);
                    Filterhelper.addDateRangeValueToSV(oCardDefinition, oFilterProp, sDefaultValue, oSelectionVariant, aFilterLabel);
                    sSemanticDateDescription = Filterhelper.getDateRangeControlValue(oFilterProp.name, oCardDefinition);
                } else {
                    if (bInsightRTEnabled) {
                        Filterhelper.addFiltervalues(oGlobalFilter, oFilterProp.name, oSelectionVariant, aFilterLabel);
                    } else if (sDefaultValue) {
                        var sText = Filterhelper.getRelatedTextToRange({Low : sDefaultValue}, aFilterLabel, oGlobalFilter, oFilterProp.name);
                        oSelectionVariant.addSelectOption(oFilterProp.name, "I", "EQ", sDefaultValue, null, sText);
                    } else {
                        oSelectionVariant.addSelectOption(oFilterProp.name, "I", "EQ", sFilterVal);
                    }
                }

                oFinal[oFilterProp.name] = {
                    value: oSelectionVariant.toJSONString(),
                    type: Filterhelper.getPropertyType(oFilterProp),
                    description: sSemanticDateDescription || oFilterProp && oFilterProp.description
                };

                oFinal[oFilterProp.name].value = Filterhelper.enhanceVariant(oFinal[oFilterProp.name].value);

                if (sMandatoryParam) {
                    aMandatoryFilterSet.push(sMandatoryParam);
                }
                aRelevantFilter.push(oFilterProp.name);
            }
            oFinal[oFilterProp.name]["description"] = sSemanticDateDescription || propertyExtensionData(oFilterProp, "description");
        }

        var sSelectionAnnotation = oCardDefinition.cardComponentData.settings["selectionAnnotationPath"];
        var oFilterSetvalues =
            oCardDefinition.entityType[sSelectionAnnotation] &&
            JSON.parse(JSON.stringify(oCardDefinition.entityType[sSelectionAnnotation]));
        var aSelectOptions = [],
            oFilterProperty;
        var sPropertyPath;
        for (var sFilterId in oFilterSetvalues) {
            if (oFilterSetvalues.hasOwnProperty(sFilterId)) {
                oFilterProperty = "";
                var aFilterSet = Array.isArray(oFilterSetvalues[sFilterId]) && oFilterSetvalues[sFilterId];
                if (sFilterId === "Parameters") {
                    for (var j = 0; aFilterSet && j < aFilterSet.length; j++) {
                        if (aFilterSet[j]["PropertyName"][["PropertyPath"]].includes("/")) {
                            var aPropValues = aFilterSet[j]["PropertyName"][["PropertyPath"]].split("/");
                            aParameterSet.push(aPropValues[aPropValues.length - 1]);
                        } else {
                            aParameterSet.push(aFilterSet[j]["PropertyName"][["PropertyPath"]]);
                        }
                        oFilterProperty = aFilterSet[j];
                        addFilterPropertyDetails(
                            oFilterProperty,
                            oFinal,
                            aParams,
                            aParameterKeys,
                            aMandatoryParamSet,
                            aMandatoryFilterSet,
                            oCardDefinition
                        );
                    }
                } else if (sFilterId === "SelectOptions") {
                    aSelectOptions = oFilterSetvalues["SelectOptions"];
                    for (var k = 0; aFilterSet && k < aFilterSet.length; k++) {
                        sPropertyPath = aSelectOptions[k]["PropertyName"]["PropertyPath"];
                        sPropertyPath = sPropertyPath && sPropertyPath.replace("/", "."); // Replace "/" with "." in case if Navigation Property is used for card.

                        // Do not add Property to Range filters if it is a Sensitive property
                        var oView = oCardDefinition.view;
                        var oController = oView.getController();
                        var oStaticParams = NavigationHelper.getStaticParams(oController);
                        var aSensitiveProps = oStaticParams && oStaticParams.sensitiveProperties;

                        if (aSelectOptions[k].Ranges) {
                            if (aRangeFilters.indexOf(sPropertyPath) === -1 &&
                                aSensitiveProps.indexOf(sPropertyPath) === -1) {
                                aRangeFilters.push(sPropertyPath);
                                aRelevantFilter.push(sPropertyPath);
                            }
                        } else {
                            aRelevantFilter.push(sPropertyPath);
                            oFilterProperty = aFilterSet[k];
                            addFilterPropertyDetails(
                                oFilterProperty,
                                oFinal,
                                aParams,
                                aParameterKeys,
                                aMandatoryParamSet,
                                aMandatoryFilterSet,
                                oCardDefinition
                            );
                        }
                    }
                    aRangeSelectionOptions = getRangeOptionFilter(oCardDefinition, aRangeFilters);
                }
            }
        }

        // if there are selectOptions annotations with Ranges defined which are not defined under configuration parameters
        if (aRangeSelectionOptions) {
            aRangeSelectionOptions.forEach(function(oSelectionOption) {
                var sKeyName = oSelectionOption && oSelectionOption.PropertyName;
                var aTexts = Filterhelper.getLabelForConfigParams(sKeyName, oGlobalFilter, oFinal, oCardDefinition) || [];
                var aRanges = oSelectionOption && oSelectionOption.Ranges || [];
                aRanges.forEach(function(oRange) {
                    var sText = Filterhelper.getRelatedTextToRange(oRange, aTexts, oGlobalFilter, sKeyName);
                    if (sText) {
                        oRange.Text = sText;
                    }
                });
                var oValue = {"Parameters" : [], "SelectOptions" : [oSelectionOption]};
                var oPropertyInfo = getPropertyMapping(
                                    sKeyName,
                                    oTargetEntityType,
                                    oFiltermodel,
                                    aParams,
                                    oCardDefinition
                                );
                if (oPropertyInfo) {
                    sKeyName = oPropertyInfo.name;
                }

                oFinal[sKeyName] = {
                    value: JSON.stringify(oValue),
                    type: Filterhelper.getPropertyType(oPropertyInfo),
                    description: oPropertyInfo && oPropertyInfo.description
                };
                oFinal[sKeyName]["description"] = propertyExtensionData(oPropertyTest, "description");
                var sMandatoryProperty = mandatoryParamCheck(oPropertyInfo);
                if (sMandatoryProperty && aParameterKeys.includes(sMandatoryProperty)) {
                    aMandatoryParamSet.push(sMandatoryProperty);
                } else if (sMandatoryProperty) {
                    aMandatoryFilterSet.push(sMandatoryProperty);
                }
            });
        }
        var aRelevant = aUniqueArray(aRelevantFilter);
        var aParameter = aUniqueArray(aParameterSet);
        var aMandatoryParam = aUniqueArray(aMandatoryParamSet);
        var aMandatoryFilter = aUniqueArray(aMandatoryFilterSet);
        Filterhelper.updateRangeValue(oFinal);
        oFinal["_relevantODataFilters"] = { value: aRelevant };
        oFinal["_relevantODataParameters"] = { value: aParameter };
        oFinal["_mandatoryODataParameters"] = { value: aMandatoryParam };
        oFinal["_mandatoryODataFilters"] = { value: aMandatoryFilter };
        return oFinalSet;
    };
    var valueColorPath = function (aParts, oStaticValues, bColor) {
        var sPath = "";
        if (oStaticValues) {
            for (var i = 0; i < aParts.length; i++) {
                sPath = sPath + "${" + aParts[i] + "},";
            }
        }
        // for valuecolor format
        if (bColor) {
            if (oStaticValues) {
                return "{= extension.formatters.formatValueColor(" + sPath + JSON.stringify(oStaticValues) + ")}";
            } else if (aParts.length) {
                return "{= extension.formatters.kpiValueCriticality(${" + aParts[0] + "})}";
            }
        } else {
            // for indicator format, indicator formatter will always have ovp properties
            return "{= extension.formatters.formatTrendIcon(" + sPath + JSON.stringify(oStaticValues) + ")}";
        }
    };

    var getQueryParamsOfCard = function (oCardDefinition, sHeader, oSapCardConfigParams) {
        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var oPresentationVariant = oCardDefinition.entityType[oOvpCardProperties.getProperty("/presentationAnnotationPath")];
        var aRequestAtLeastProps = Filterhelper.getRequestAtLeastFields(oPresentationVariant);
        var bAddODataSelect = oOvpCardProperties.getProperty("/addODataSelect");
        var cardTemplate = oOvpCardProperties.getProperty("/template");

        if (oCardDefinition) {
            var oControl, sBindingPath = "";

            switch (oCardDefinition.cardComponentName) {
                case 'Analytical':
                    var oVizFrame = oCardDefinition.vizFrame;
                    oControl = oVizFrame && oVizFrame.getParent();
                    sBindingPath = "data";
                    break;
                case 'List':
                    oControl = oCardDefinition.view.byId('ovpList');
                    sBindingPath = "items";
                    break;
                case 'Table':
                    oControl = oCardDefinition.view.byId('ovpTable');
                    sBindingPath = "items";
                break;
            }

            var oContentParams = getParametersForACard(oControl, sBindingPath, aRequestAtLeastProps, bAddODataSelect, cardTemplate);
            oSapCardConfigParams["_contentSkipQuery"] = { value: oContentParams.skip };
            if (oCardDefinition.cardComponentName === "List" || oCardDefinition.cardComponentName === "Table") {
                oSapCardConfigParams["_contentTopQuery"] = { value: "$top=13" };
            } else {
                oSapCardConfigParams["_contentTopQuery"] = { value: oContentParams.top };
            }
            oSapCardConfigParams["_contentSortQuery"] = { value: oContentParams.sSortParameters };
            oSapCardConfigParams["_contentSelectQuery"] = { value: oContentParams.sSelect };
            oSapCardConfigParams["_contentExpandQuery"] = { value: oContentParams.sExpandParam };
        }
        if (sHeader === "Numeric") {
            var oNumericHeaderBox = oCardDefinition.view.byId("kpiHBoxNumeric");
            var oHeaderParams = getParametersForACard(oNumericHeaderBox, "items", aRequestAtLeastProps, bAddODataSelect, cardTemplate);
            oSapCardConfigParams["_headerSkipQuery"] = { value: oHeaderParams.skip };
            oSapCardConfigParams["_headerTopQuery"] = { value: oHeaderParams.top };
            oSapCardConfigParams["_headerSortQuery"] = { value: oHeaderParams.sSortParameters };
            oSapCardConfigParams["_headerSelectQuery"] = { value: oHeaderParams.sSelect };
            oSapCardConfigParams["_headerExpandQuery"] = { value: oHeaderParams.sExpandParam };
        }
    };
    var getCrossNavigation = function (oCardDefinition, oFilterSet) {
        var oSettings = oCardDefinition.cardComponentData.settings;
        var oView = oCardDefinition.view;
        var oController = oView && oView.getController();
        var oMainComponent = oController.oCardComponentData && oController.oCardComponentData.mainComponent;
        var sNavSelectionVariant = 
            CardNavigationHelper.getEntityNavigationParameters(
                oMainComponent, 
                oController.getModel(), 
                oCardDefinition.cardComponentData, 
                oController.getCardPropertiesModel(), 
                oController.getEntityType()
            ).sNavSelectionVariant;
        sNavSelectionVariant = sNavSelectionVariant ? JSON.parse(sNavSelectionVariant) : "";
        var aSelectOptions = sNavSelectionVariant && sNavSelectionVariant.SelectOptions;
        var sRequireAppAuth = oSettings.requireAppAuthorization;
        var oNavigationIntent = {},
            oParameters = {},
            oNavigationParams = {},
            oFinalObjectVal = {};

        if (sRequireAppAuth) {
            oNavigationIntent = NavigationHelper.getNavigationIntentFromAuthString(sRequireAppAuth);
            oNavigationParams = oNavigationIntent.parameters;
        }

        var oParamKeys = Object.keys(oNavigationParams);
        if (oParamKeys.length > 0) {
            for (var i = 0; i < oParamKeys.length; i++) {
                if (!Array.isArray(oNavigationParams[oParamKeys[i]])) {
                    oParameters[oParamKeys[i]] = {
                        defaultValue: {
                            value: oNavigationParams[oParamKeys[i]]
                        }
                    };
                }
            }
        }
        if (aSelectOptions && aSelectOptions.length) {
            aSelectOptions.forEach(function (oSelectionVariant) {
                var sPropertyName = oSelectionVariant["PropertyName"];
                var bRelavantFilter = oFilterSet.filters._relevantODataFilters.value.includes(sPropertyName),
                    bRelavantParameter = oFilterSet.filters._relevantODataParameters.value.includes(
                        oSelectionVariant["PropertyName"]
                    );
                var LowRangeVal;
                if (
                    oSelectionVariant &&
                    sPropertyName &&
                    !oParameters[sPropertyName] &&
                    oSelectionVariant.Ranges.length &&
                    oSelectionVariant.Ranges[0].Option === "EQ" &&
                    !(bRelavantFilter || bRelavantParameter)
                ) {
                    LowRangeVal = oSelectionVariant.Ranges[0].Low;
                    if (LowRangeVal !== undefined || LowRangeVal !== null) {
                        try {
                            LowRangeVal = JSON.parse(oSelectionVariant.Ranges[0].Low);
                        } catch (err) { }
                        if (!Array.isArray(LowRangeVal)) {
                            // If LowRangeValue is an array then it should not be added to cross app navigation parameters
                            oParameters[sPropertyName] = LowRangeVal;
                        }
                    }
                }
            });
        }
        oFinalObjectVal = {
            inbounds: {
                intent: {
                    signature: {
                        additionalParameters: "allowed"
                    }
                }
            }
        };
        CommonUtils.updatePropertyValueForObject(oFinalObjectVal.inbounds.intent, oNavigationIntent.semanticObject, "semanticObject");
        CommonUtils.updatePropertyValueForObject(oFinalObjectVal.inbounds.intent, oNavigationIntent.action, "action");
        CommonUtils.updatePropertyValueForObject(
            oFinalObjectVal.inbounds.intent.signature,
            oParameters && Object.keys(oParameters).length ? oParameters : null,
            "parameters"
        );
        return oFinalObjectVal;
    };
    var getEntitySetFromContainer = function (oModel, sEntityTypeName) {
        if (!oModel || !sEntityTypeName) {
            return;
        }
        var oMetaModel = oModel.getMetaModel();
        var oEntityContainer = oMetaModel && oMetaModel.getODataEntityContainer();
        var aEntitySet = oEntityContainer && oEntityContainer.entitySet;
        if (!aEntitySet || !Array.isArray(aEntitySet)) {
            return;
        }
        //Loop through all entity sets and find matching for given entity type
        var iLen = aEntitySet.length;
        for (var i = 0; i < iLen; i++) {
            if (aEntitySet[i].entityType === sEntityTypeName) {
                return aEntitySet[i].name;
            }
        }
    };

    var setUriDataType = function (sURI, bInsightRTEnabled, oAppManifest) {
        if (sURI.startsWith("/sap/opu/odata") && !sURI.endsWith(".xml")) {
            return { uri: sURI, type: "ODataAnnotation" };
        } else if (
            (!sURI.startsWith("/sap/opu/odata") || sURI.startsWith("/sap/opu/odata")) &&
            sURI.endsWith(".xml")
        ) {
            // prefix the runtime url only for RT
            if (bInsightRTEnabled && oAppManifest['sap.platform.abap']) {
                var sRTPath = oAppManifest['sap.platform.abap'].uri;
                if (sURI.indexOf('./') === 0) {
                    sURI = sURI.replace('./', '');
                } else if (sURI.indexOf('/') === 0) {
                    sURI = sURI.replace('/', '');
                } else if (sURI.indexOf('../') === 0) {
                    sURI = sURI.replace('../', '');
                } 
                sURI = sRTPath + '/' + sURI;
            }
            return { uri: sURI, type: "XML" };
        }
    };

    /**
     * Create Manifest for Data Property of Sap.Card component with the given card defination
     *
     * @param {Object} oCardDefinition
     * @param {Object} oSapCard
     * @returns {Object} oSapCardData Data property for Sap.Card component of the Manifest
     */
    var fnCreateManifestSapCardData = function(oCardDefinition, oSapCard) {
        var sServiceUrl = oCardDefinition.cardComponentData.model.sServiceUrl;
        var oCardEntityModel = oCardDefinition.view.getModel();
        var sRequestUrl;
        if (!CommonUtils.isODataV4(oCardEntityModel)) {
            sRequestUrl = "{{destinations.service}}" + sServiceUrl + "/$batch";
        } else {
            sRequestUrl = "{{destinations.service}}" + sServiceUrl + "$batch";
        }
        var oSapCardData = {};
        var oBatchObject = BatchHelper.getBatchObject(oCardDefinition, oSapCard["configuration"]);
        oSapCardData["request"] = {
            url: sRequestUrl,
            method: "POST",
            headers : {
                "Accept": "multipart/mixed",
                "X-CSRF-Token": "{{csrfTokens.token1}}"
            },
            batch: oBatchObject
        };

        if (oSapCardData.request.batch.header) {
            oSapCardData.request.batch.header.url = "{{parameters._headerDataUrl}}";
        }
        oSapCardData.request.batch.content.url = "{{parameters._contentDataUrl}}";

        if (!oBatchObject.header) {
            var oContentRequest = oSapCardData["request"].batch.content;
            oContentRequest.headers["X-CSRF-Token"] = "{{csrfTokens.token1}}";
            if (!CommonUtils.isODataV4(oCardEntityModel)) {
                oContentRequest.url = "{{destinations.service}}" + sServiceUrl + "/" + oContentRequest.url;
            } else {
                oContentRequest.url = "{{destinations.service}}" + sServiceUrl + oContentRequest.url;
            }
            oSapCardData["request"] = oContentRequest;
        }

        return oSapCardData;
    };

     /**
     * Create Manifest for Configuration Property of Sap.Card component with the given card defination
     *  - Evaluate parameters, destinations, csrfTokens and add to the Configuration object
     *
     * @param {Object} oCardDefinition
     * @param {Object} oSapCard
     * @returns {Object} oCardConfiguration Configuration property for Sap.Card component of the Manifest
     */
    var fnCreateManifestSapCardConfig = function(oCardDefinition) {
        var sServiceUrl = oCardDefinition.cardComponentData.model.sServiceUrl;
        var oCardConfiguration = {};
        oCardConfiguration["parameters"] = getFilterDetails(oCardDefinition)["filters"];
        oCardConfiguration["destinations"] = { service: { name: "(default)", defaultUrl: "/" } };
        oCardConfiguration["csrfTokens"] = {
            token1: {
                data: {
                    request: {
                        url: "{{destinations.service}}" + sServiceUrl,
                        method: "HEAD",
                        headers: {
                            "X-CSRF-Token": "Fetch"
                        }
                    }
                }
            }
        };
        return oCardConfiguration;
    };

    /**
     * Create Manifest for Header property of Sap.Card component with the given card defination
     *
     * @param {Object} oCardDefinition
     * @param {Object} oSapCard
     * @returns {Object} oSapCardHeader Header property for Sap.Card component of the Manifest
     */
    var fnCreateManifestSapCardHeader = function(oCardDefinition, oSapCard, oBatch) {
        var sHeaderType = CardHeader.getHeaderDetails(oCardDefinition),
            sCardId = oCardDefinition.cardComponentData.cardId,
            oRawManifest = oCardDefinition.cardComponentData.appComponent.getManifestObject().getRawJson(),
            oCardSetting = oRawManifest["sap.ovp"]["cards"][sCardId].settings,
            oSettings = oCardDefinition.cardComponentData.settings,
            iKey = oSettings && oSettings.selectedKey,
            oSapCardHeader,
            oEntityModel = oCardDefinition.view.getModel();

        getQueryParamsOfCard(oCardDefinition, sHeaderType, oSapCard["configuration"]["parameters"]);
        var oMainIndicator =
            oSapCard.extension && sHeaderType === "Numeric" ? CardHeader.mainIndicatorDetails(oCardDefinition) : "";
        var sMainIndicatorNumber = oMainIndicator && oMainIndicator.path && oMainIndicator.path.length
            ? CardHeader.mainIndicatorNumberPath(oMainIndicator.path, oMainIndicator.ovpProp)
            : "";
        i18nHelper.createKeysFromText(sCardId, oCardSetting.title, "Title", "card Title", "header.title");
        i18nHelper.createKeysFromText(sCardId, oCardSetting.subTitle, "Title", "card subTitle", "header.subTitle");
        var sValueColor =
            oMainIndicator && oMainIndicator.valueColor
                ? valueColorPath(oMainIndicator.valueColor.path, oMainIndicator.valueColor.ovpProp, true)
                : null;
        var sTrend =
            oMainIndicator && oMainIndicator.indicator
                ? valueColorPath(oMainIndicator.indicator.path, oMainIndicator.indicator.ovpProp, false)
                : null;
        var oTargetValue = oMainIndicator && oMainIndicator.target ? oMainIndicator.target : null;
        var oDeviationValue = oMainIndicator && oMainIndicator.deviation ? oMainIndicator.deviation : null;
        var sTargetPath = "",
            sPercent,
            sDevPath = "",
            sUnit,
            aIndicator = [],
            oTargObject = {},
            oSideIdicator = {};
        if (oTargetValue && oTargetValue.parts.length) {
            sTargetPath = CardHeader.targetDeviationValuePath(
                oTargetValue,
                oCardDefinition.view.getModel("ovpCardProperties"),
                "targetValueFormatter"
            );
            sPercent = oCardDefinition.view
                .getModel("ovpCardProperties")
                .getProperty("/bPercentageAvailableForTarget")
                ? "%"
                : null;
            if (sTargetPath) {
                CommonUtils.updatePropertyValueForObject(oSideIdicator, oMainIndicator.target.text, "title");
                CommonUtils.updatePropertyValueForObject(oSideIdicator, sTargetPath, "number");
                CommonUtils.updatePropertyValueForObject(oSideIdicator, sPercent, "unit");
                aIndicator.push(oSideIdicator);
            }
        }
        if (oMainIndicator && oMainIndicator.ovpProp) {
            sUnit = CardHeader.mainIndicatorNumberPath(oMainIndicator.path, oMainIndicator.ovpProp, true);
        }
        if (oDeviationValue && oDeviationValue.parts.length) {
            sDevPath = CardHeader.targetDeviationValuePath(
                oDeviationValue,
                oCardDefinition.view.getModel("ovpCardProperties"),
                "returnPercentageChange"
            );
            oSideIdicator = {};
            if (sDevPath) {
                CommonUtils.updatePropertyValueForObject(oSideIdicator, oMainIndicator.deviation.text, "title");
                CommonUtils.updatePropertyValueForObject(oSideIdicator, sDevPath, "number");
                aIndicator.push(oSideIdicator);
            }
        }
        var sUnitOfMeasure = AnalyticalCardHelper.getUoMForSubTitle(sCardId);
        if (sHeaderType !== "Default") {
            oTargObject = {
                type: sHeaderType,
                title: oCardSetting.title,
                subTitle: oCardSetting.subTitle,
                details: CardHeader.generateDetailsExpression(oSapCard, oCardSetting, sCardId, iKey)
            };
            CommonUtils.updatePropertyValueForObject(oTargObject, sUnitOfMeasure, "unitOfMeasurement");
            CommonUtils.updatePropertyValueForObject(oTargObject, aIndicator, "sideIndicators");
            if (sMainIndicatorNumber) {
                oTargObject["mainIndicator"] = {};
                CommonUtils.updatePropertyValueForObject(oTargObject.mainIndicator, sMainIndicatorNumber, "number");
                CommonUtils.updatePropertyValueForObject(oTargObject.mainIndicator, sValueColor, "state");
                CommonUtils.updatePropertyValueForObject(oTargObject.mainIndicator, sTrend, "trend");
                CommonUtils.updatePropertyValueForObject(oTargObject.mainIndicator, sUnit, "unit");
            }
            oSapCardHeader = oTargObject;
        } else {
            oSapCardHeader = {
                type: sHeaderType,
                title: oCardSetting.title,
                subTitle: oCardSetting.subTitle,
                details: CardHeader.generateDetailsExpression(oSapCard, oCardSetting, sCardId, iKey)
            };
        }
        if (oBatch) { // when batch is not there, there is no data response for header
            oSapCardHeader.data = { path: BatchHelper.getBatchRequestPath("/header/d/results/0", oEntityModel) };
        }
        if (oSapCardHeader.details) {
            oSapCardHeader.type = 'Numeric'; //always make card header type as Numeric when details is present
        }
        if (oSapCard["type"] === "List" || oSapCard["type"] === "Table") {
            oSapCardHeader.status = ContentHelper.getHeaderStatus(oBatch, oEntityModel);
        }
        return oSapCardHeader;
    };



    /**
     * Create Manifest for content of Sap.Card component with the given card defination
     *
     * @param {Object} oCardDefinition
     * @param {Object} oSapCard
     * @returns {Object} oSapCardContent Content property for Sap.Card component of the Manifest
     */
    var fnCreateManifestSapCardContent = function(oCardDefinition, oSapCard) {
        var oSettings = oCardDefinition.cardComponentData.settings;
        var oSapCardContent;
        switch (oSapCard["type"]) {
            case "Analytical":
                oSapCardContent = AnalyticalCardHelper.createChartContent(
                    oCardDefinition,
                    oSettings.chartAnnotationPath,
                    oSapCard
                );
                oSapCardContent.chartProperties["title"] = oSapCardContent.title;
                delete oSapCardContent.title;
                break;
            case "List":
                oSapCardContent = ListContentHelper.getListContent(oCardDefinition, oSapCard);
                break;
            case "Table":
                oSapCardContent = TableContentHelper.getTableContent(oCardDefinition, oSapCard);
                break;
            default:
                oSapCardContent = {};
                break;
        }
        return oSapCardContent;
    };

    /**
     * Create Manifest for Sap.Card component with the given card defination
     * @param {Object} oCardDefinition
     * @returns {Object} oCardConfig Sap.Card component of the Manifest
     */
    var fnCreateManifestSapCard = function(oCardDefinition) {
        var oCardConfig = {},
            sCardId = oCardDefinition.cardComponentData.cardId;

        oCardConfig["extension"] = sHomeFormatterPath;
        oCardConfig["type"] = oCardDefinition.cardComponentName;
        oCardConfig["configuration"] = fnCreateManifestSapCardConfig(oCardDefinition);
        oCardConfig["data"] = fnCreateManifestSapCardData(oCardDefinition, oCardConfig);
        oCardConfig["header"] = fnCreateManifestSapCardHeader(oCardDefinition, oCardConfig, oCardConfig["data"].request.batch);
        oCardConfig["content"] = fnCreateManifestSapCardContent(oCardDefinition, oCardConfig);

        var oSematicDateRangeConfig = Filterhelper.getSemanticDateConfiguration(oCardDefinition) || {};
        if (Object.keys(oSematicDateRangeConfig).length) {
            oCardConfig["configuration"]["parameters"]["_semanticDateRangeSetting"] = {
                "value" : JSON.stringify(oSematicDateRangeConfig)
            };
        }

        // replace langage direct texts from manifest file with new keys
        i18nHelper.replaceStringsWithKeys(oCardConfig, sCardId);

        var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
        var bInsightDTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightDTEnabled');
        if (bInsightDTEnabled) {
            BatchHelper.updateBatchObject(oCardDefinition, oCardConfig["configuration"], true);
        }

        return oCardConfig;
    };

    /**
     * Create Manifest for Sap.App component with the given card defination
     *
     * @param {Object} oCardDefinition
     * @returns {Object} oAppManifest Sap.App component of the Manifest
     */
    var fnCreateManifestSapApp = function(oCardDefinition) {
        var oManifestAppData = oCardDefinition.cardComponentData.appComponent.getManifest()["sap.app"],
            sAppId = oManifestAppData.id,
            oSettings = oCardDefinition.cardComponentData.settings,
            sCardId = oCardDefinition.cardComponentData.cardId,
            oRawManifest = oCardDefinition.cardComponentData.appComponent.getManifestObject().getRawJson(),
            si18nPath = (oRawManifest["sap.app"].i18n && oRawManifest["sap.app"].i18n.bundleUrl) || oRawManifest["sap.app"].i18n,
            si18nPrefix = oRawManifest["sap.platform.abap"] && oRawManifest["sap.platform.abap"].uri,
            iKey = oSettings && oSettings.selectedKey,
            oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties"),
            bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled'),
            bInsightDTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightDTEnabled');

        // replace the app id with application fiori id
        var sFiorAppID = (oRawManifest["sap.fiori"] && oRawManifest["sap.fiori"].registrationIds && oRawManifest["sap.fiori"].registrationIds[0]) || sAppId,
            sIntegrationCardId = iKey
            ? sFiorAppID + ".cards." + sCardId + ".tab_" + iKey
            : sFiorAppID + ".cards." + sCardId;

        // Choose relative path based on view switch
        var sRelativePath = iKey ? "../../../" : "../../";

        sapAppi18nPath = sRelativePath + si18nPath; // Store sapAppi18nPath original value to assign at the time of card creation

        // If sap.platform.abap's uri is present add this as a prefix of  si18nPath
        if (si18nPrefix) {
            if (si18nPrefix.startsWith("/")) {
                si18nPrefix = si18nPrefix.substring(1);
            }
            si18nPath = si18nPrefix + "/" + si18nPath;
        }

        if (bInsightRTEnabled) {
            sIntegrationCardId = "user." + sIntegrationCardId + "." + Date.now();
        }

        var oAppPropertyInfo;
        if (bInsightRTEnabled) { // In case of RT Mode no need to generate i18n keys for app title and subtitle
            oAppPropertyInfo = {
                title : oManifestAppData && oManifestAppData.title || "",
                subtitle : oManifestAppData && (oManifestAppData.subtitle || oManifestAppData.description) || "" 
            };
        } else {
            oAppPropertyInfo = i18nHelper.getKeysForAppProperties(oManifestAppData, oRawManifest, oCardDefinition);
        }
        var sAppTitle = oAppPropertyInfo && oAppPropertyInfo.title,
            sAppSubtitle = oAppPropertyInfo && oAppPropertyInfo.subtitle,
            oFilterSet = getFilterDetails(oCardDefinition),
            oAppManifest = {
                id: sIntegrationCardId, // integration card id format: <componentId>.cards.<cardId>
                type: "card",
                embeddedBy: sRelativePath,
                tags: {
                    keywords: ["Analytical", "Card", "Line", "Sample"]
                },
                crossNavigation: getCrossNavigation(oCardDefinition, oFilterSet),
                dataSources: {}
            };

            if (bInsightDTEnabled) {
                oAppManifest.i18n = sRelativePath + si18nPath;
            }

        //If application title and subtitle exists then only add title or subtitle to generated card manifest
        if (sAppTitle) {
            oAppManifest.title = sAppTitle;
        }
        if (sAppSubtitle) {
            oAppManifest.subTitle = sAppSubtitle;
        }

        var oOVPConfig = oCardDefinition.cardComponentData.appComponent.getManifest()["sap.ovp"];
        var sFilterModel = oOVPConfig.globalFilterModel;
        var sFilterDataSource =
            oCardDefinition.cardComponentData.appComponent.getManifest()["sap.ui5"].models[sFilterModel].dataSource;
        var oDataSource = oManifestAppData.dataSources;
        var oFilterDataSource = oDataSource[sFilterDataSource];
        var aAnnotationsURI = {},
            aAnnotations = [],
            sOData = "",
            oFilterDataType;
        if (oFilterDataSource && oFilterDataSource.settings) {
            var aFilterAnnotations = oFilterDataSource.settings.annotations,
                sURI;
            aFilterAnnotations.length &&
                aFilterAnnotations.forEach(function (annotation) {
                    for (var dataSource in oDataSource) {
                        sURI = oDataSource[annotation].uri;
                        if (dataSource === annotation && sURI) {
                            aAnnotations.push(dataSource);
                            aAnnotationsURI[dataSource] = setUriDataType(sURI, bInsightRTEnabled, oRawManifest);
                            break;
                        }
                    }
                });
            if (oFilterDataSource && oFilterDataSource.uri) {
                oFilterDataType = setUriDataType(oFilterDataSource.uri, bInsightRTEnabled, oRawManifest);
            }
            sOData = oFilterDataSource.settings && oFilterDataSource.settings["odataVersion"];
        }
        oAppManifest.dataSources = aAnnotationsURI;
        oAppManifest.dataSources["filterService"] = {
            uri: oFilterDataSource && oFilterDataSource.uri,
            settings: {
                annotations: aAnnotations,
                odataVersion: sOData ? sOData : "2.0"
            },
            type: oFilterDataType && oFilterDataType.type
        };

        return oAppManifest;
    };

    /**
     * Create Manifest for Sap.insight component with the given card defination
     *
     * @param {Object} oCardDefinition
     * @returns {Object}
     */
    var fnCreateManifestSapInsight = function(oCardDefinition) {
        var oManifestAppData = oCardDefinition.cardComponentData.appComponent.getManifest()["sap.app"],
            sAppId = oManifestAppData.id,
            oOVPConfig = oCardDefinition.cardComponentData.appComponent.getManifest()["sap.ovp"],
            oOvpCardProperties = oCardDefinition.view.getModel('ovpCardProperties'),
            bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled'),
            sFilterEntitySetName = "",
            oGlobalFilter = oCardDefinition.cardComponentData.mainComponent.oGlobalFilter,
            sTargetEntityTypename = SmartFilterBarHandler.getEntityType(oGlobalFilter),
            oMainOwnerComponent = oCardDefinition.cardComponentData.mainComponent.getOwnerComponent(),
            /* 
            * During OPA execution VersionInfo.load({...}) does not return sap ui5 version which leads to failing OPA.
            * If sapUICoreVersionInfo is undefined then assign oSapUICoreVersionInfo to an empty object for OPA tests to work.
            * VersionInfo.load({...}) would work fine in case of a running application 
            */
            oSapUICoreVersionInfo = oMainOwnerComponent.oOvpConfig.sapUICoreVersionInfo || {};


        if (!oOVPConfig.globalFilterEntitySet) {
            sFilterEntitySetName = getEntitySetFromContainer(
                oGlobalFilter && oGlobalFilter.getModel(),
                sTargetEntityTypename
            );
        }

        return {
            templateName: "OVP",
            parentAppId: sAppId,
            filterEntitySet: oOVPConfig.globalFilterEntitySet
                ? oOVPConfig.globalFilterEntitySet
                : sFilterEntitySetName,
            cardType: bInsightRTEnabled ? "RT" : "DT",
            "versions": {
                "ui5": oSapUICoreVersionInfo.version + "-" + oSapUICoreVersionInfo.buildTimestamp
            }
        };
    };

     /**
     * Create Manifest for the given card defination
     *
     * @param {Object} oCardDefinition
     * @returns {Object} oManifest
     */
    var createManifestFor = function (oCardDefinition) {
        var oManifest = {};
        oManifest["sap.card"] = fnCreateManifestSapCard(oCardDefinition);
        oManifest["sap.app"] = fnCreateManifestSapApp(oCardDefinition);
        oManifest["sap.insights"] = fnCreateManifestSapInsight(oCardDefinition);
        var pCardAction = CardActionHelper.getCardActions(oCardDefinition, oManifest["sap.card"]);
        return pCardAction.then(function (oActions) {
            if (oActions.header.enabled) {
                oManifest["sap.card"].header.actions = oActions.header.actions;
            }
            if (oActions.content.enabled) {
                switch (oCardDefinition.cardComponentName) {
                    case 'Analytical':
                        oManifest["sap.card"].content.actions = oActions.content.actions;
                        break;
                    case 'List':
                        oManifest["sap.card"].content.item.actions = oActions.content.actions;
                        break;
                    case 'Table':
                        oManifest["sap.card"].content.row.actions = oActions.content.actions;
                        break;
                }
            }
            Filterhelper.resetSemanticDateRangeConfig();
            return oManifest;
        });
    };
    var findTitle = function (oManifest, oCardDefinition, sKey) {
        var sTitleVal = oManifest["sap.card"]["header"][sKey];
        if (sTitleVal && sTitleVal.startsWith("{{")) {
            var sTitleKey = sTitleVal.split("{{")[1].split("}}")[0];
            var oi18nModel = oCardDefinition.view.getModel("@i18n") || oCardDefinition.view.getModel("i18n");
            sTitleVal = oi18nModel ? oi18nModel.getProperty(sTitleKey) : undefined;
        }
        return sTitleVal ? sTitleVal : "";
    };
    var setTitleValueState = function (oTitle, sValueState, sValueStateText, oDialogSettings) {
        oDialogSettings.valueState = sValueState;
        oDialogSettings.valueStateText = sValueStateText;
        oTitle.setValueState(oDialogSettings.valueState);
        oTitle.setValueStateText(oDialogSettings.valueStateText);
    };
    var IntegrationCard = {
        createManifestFor: createManifestFor,
        /**
         * Downloads the card manifest
         * Comment out this function code to download manifest for generated integration card
         * @param {Object} oManifest
         */
        downloadCardManifest: function (oManifest) {
            // var a = document.createElement("a");
            // var file = new Blob([JSON.stringify(oManifest, null, 2)], {
            //     type: "text/plain"
            // });
            // a.href = URL.createObjectURL(file);
            // a.setAttribute("download", "manifest.json");
            // a.click();
        },
        /**
         * Creates an Integration card using given OVP card defination
         *
         * @param {Object} oCardDefinition
         * @returns {Promise}
         */
        createCard: function (oCardDefinition) {
            var oManifestPromise = createManifestFor(oCardDefinition);
            var sOrigin = window.location.origin,
                sResourcePath = sOrigin + "/resources",
                that = this;

            return oManifestPromise.then(function (oManifest) {
                return new Promise(function (resolve, reject) {
                    try {
                        if (!that.integrationLib) {
                            that.integrationLib = Core.loadLibrary("sap.ui.integration", { async: true });
                        }

                        return that.integrationLib.then(function () {
                            sap.ui.require([
                                "sap/ui/integration/widgets/Card"
                            ], function (Card) {
                                var oCard = new Card({
                                    height: "533px",
                                    width: "314px",
                                    manifest: oManifest,
                                    baseUrl: sResourcePath
                                });
                                resolve(oCard);
                            });
                        }).catch(function (oError) {
                            oLogger.error("Failed to get sap.ui.integration" + oError);
                            reject(oError);
                        });
                    } catch (oError) {
                        oLogger.error("Failed to get sap.ui.integration" + oError);
                        reject(oError);
                    }
                });
            });
        },

         /**
         * This function Executes when Add is clicked on the Integration card preview dialog
         * Executes for both click on Add or download card manifest
         *
         * @param {Object} oManifest
         * @param {Object} oCardDefinition
         * @param {string} sIntegrationCardPreviewId Intergration card id
         * @param {string} sManifestAction If create manifest needs to be triggered or download card manifest
         * @returns {Promise} Promise resolving to value of updated manifest
         */
        UpdateManifestDeltaChanges : function(oManifest, oCardDefinition, sIntegrationCardPreviewId, sManifestAction) {
            var oUI5Config = {
                _version: "1.1.0",
                contentDensities: { compact: true, cozy: true },
                "dependencies": {
                    "libs": {
                        "sap.insights": {
                            lazy: false
                        }
                    }
                }
            };
            oManifest["sap.ui5"] = oUI5Config;

            BatchHelper.enhanceHeaderAndContentURLForSemanticDate(oManifest["sap.card"]);
            BatchHelper.enhanceHeaderAndContentURL(oManifest["sap.card"]);

            var oOvpCardProperties = oCardDefinition.view.getModel("ovpCardProperties");
            var bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled');
            var bInsightDTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightDTEnabled');

            if (bInsightDTEnabled) {
                // Change the i18n path under "sap.app" in generated card to sapAppi18nPath
                if (oManifest["sap.app"]["i18n"] !== sapAppi18nPath) {
                    oManifest["sap.app"]["i18n"] = sapAppi18nPath;
                }

                var sInitialTitleText = findTitle(oManifest, oCardDefinition, "title");
                var sInitialSubTitleText = findTitle(oManifest, oCardDefinition, "subTitle");
                var oTitle = Core.byId(sIntegrationCardPreviewId + "--titleTextInput");

                if (oTitle && oTitle.getValue()) {
                    var oSubTitle = Core.byId(sIntegrationCardPreviewId + "--subTitleTextInput");
                    var sCardId = oCardDefinition.cardComponentData.cardId;
                    if (this.titleChanged && oTitle.getValue() !== sInitialTitleText) {
                        i18nHelper.createKeysFromText(sCardId, oTitle.getValue(), "Title", "card Title", "header.title");
                        this.titleChanged = false;
                    }
                    var sSubtitleValue = oSubTitle.getValue();
                    var bCreateSubtitleKeyForI18n =  oSubTitle && sSubtitleValue && this.subTitleChanged && sSubtitleValue !== sInitialSubTitleText;
                    if (bCreateSubtitleKeyForI18n) {
                        i18nHelper.createKeysFromText(sCardId, sSubtitleValue, "Title", "card subTitle", "header.subTitle");
                        this.subTitleChanged = false;
                    } else if (oSubTitle && !sSubtitleValue) {
                        this.subTitleChanged = false;
                        delete oManifest["sap.card"].header.subTitle;
                    }
                }
                i18nHelper.inserti18nKeysManifest(oManifest["sap.card"]);
                i18nHelper.writei18nPayload();

                // In case of DT Mode update _headerDataUrl and _contentDataUrl
                BatchHelper.updateBatchObject(oCardDefinition, oManifest["sap.card"]["configuration"], false);

                if (sManifestAction === "Download") {
                    this.downloadCardManifest(oManifest);
                }

                i18nHelper.reseti18nProperties();
            } else if (bInsightRTEnabled) {
                // Start of chart title's key is not resolved in case if RT Mode Hence adding direct value
                var oi18nModel = oCardDefinition.view.getModel("@i18n") || oCardDefinition.view.getModel("i18n");
                if (oManifest["sap.card"].type  === "Analytical") {
                    oManifest["sap.card"]["content"].chartProperties.title.text = i18nHelper.getI18nValueOrDefaultString(oManifest["sap.card"]["content"].chartProperties.title.text, oi18nModel);
                } else if (oManifest["sap.card"].type  === "Table") {
                    var aCols = oManifest['sap.card'].content.row.columns;
                    if (Array.isArray(aCols) && aCols.length) {
                        aCols.forEach(function (oCol, idx) {
                            aCols[idx].title = i18nHelper.getI18nValueOrDefaultString(oCol.title, oi18nModel);
                        });
                    }
                } else if (oManifest["sap.card"].type === "List") {
                    var oContent = oManifest["sap.card"]["content"];
                    var sInfoValue = (((oContent || {}).item || {}).info || {}).value;
                    var aParameter = sInfoValue && sInfoValue.split(",").slice(-1);
                    var sParameterValue = aParameter && aParameter[0] && aParameter[0].split("/")[1];
                    var oManifestConfigParams = oManifest["sap.card"].configuration.parameters;
                    var sParameterManifestValue = oManifestConfigParams[sParameterValue] && oManifestConfigParams[sParameterValue].value;
                    if (sParameterManifestValue && sParameterManifestValue.startsWith("{{")) {
                        oManifestConfigParams[sParameterValue].value = oi18nModel.getProperty(sParameterValue);
                    }
                }
                // In case of RT Mode replace all keys with texts
                i18nHelper.fnReplacei18nKeysWithText(oManifest, oi18nModel);
                // End of chart title's key is not resolved in case if RT Mode

                var bCustomNavigationExists = CardActionHelper.checkCustomNavigationForCard(oCardDefinition);
                if (bCustomNavigationExists) {
                    return CommonUtils.getCurrentAppIntent().then(function (oIntentResponse) {
                        var oManifestParameters = oManifest["sap.card"].configuration.parameters;
                        var sOVPDefaultAction = CardActionHelper.getOVPDefaultActions(oIntentResponse);
                        if (oCardDefinition.cardComponentName === "Analytical") {
                            if (oManifestParameters.state) {
                                oManifestParameters.state.value = sOVPDefaultAction;
                            }
                        } else {
                            if (oManifestParameters.headerState) {
                                oManifestParameters.headerState.value = sOVPDefaultAction;
                            }
                            if (oManifestParameters.lineItemState) {
                                oManifestParameters.lineItemState.value = sOVPDefaultAction;
                            }
                        }
                        return Promise.resolve(oManifest);
                    });
                }
            }
            return Promise.resolve(oManifest);
        },
        showCard: function (oCardDefinition) {
            var oOvpCardProperties = oCardDefinition.view.getModel('ovpCardProperties'),
                bInsightRTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightRTEnabled'),
                bInsightDTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightDTEnabled'),
                bCustomNavigationExists = CardActionHelper.checkCustomNavigationForCard(oCardDefinition),
                oCardMessageInfo;

            if (bCustomNavigationExists) {
                oCardMessageInfo = {
                    type: "Warning",
                    text: OvpResources.getText("CARD_MESSAGE_INFO")
                };
            }
            if (bInsightRTEnabled) {
                var oCreateManifestPromise = createManifestFor(oCardDefinition);
                return oCreateManifestPromise.then(function (oManifest) {
                    return this.UpdateManifestDeltaChanges(oManifest, oCardDefinition).then(function () {
                        return CardHelper.getServiceAsync("UIService").then(function (oInstance) {
                            return oInstance.showCardPreview(oManifest, false, oCardMessageInfo).then(function () {
                                return Promise.resolve(oManifest);
                            });
                        }).catch(function (oError) {
                            MessageToast.show(oError.message);
                        });
                    });
                }.bind(this)).catch(function (oError) {
                    oLogger.error(oError);
                    return Promise.reject(oError);
                });
            } else if (bInsightDTEnabled) {
                return this.createCard(oCardDefinition).then(function (oCard) {
                    var oManifest = oCard.getManifest();
                    return new Promise(
                        function (resolve, reject) {
                            var oOvpResourceModel = OvpResources.oResourceModel,
                                sInitialTitleText = findTitle(oManifest, oCardDefinition, "title"),
                                sInitialSubTitleText = findTitle(oManifest, oCardDefinition, "subTitle"),
                                oPreviewDialogSettings = {
                                    draggable: true,
                                    cardTitle: sInitialTitleText,
                                    cardSubTitle: sInitialSubTitleText,
                                    valueState: sInitialTitleText ? "None" : "Error",
                                    valueStateText: sInitialTitleText
                                        ? ""
                                        : OvpResources.getText("INT_Preview_Title_ValueStateText")
                                },
                                oIntegrationDialogModel = new JSONModel({
                                    dialogSettings: oPreviewDialogSettings
                                }),
                                oAppComponent = CommonUtils.getApp().getOwnerComponent(),
                                sIntegrationCardPreviewId = oAppComponent.createId("integrationCardPreview");
                            this.handleCancel = function () {
                                this.previewDialogPromise.then(
                                    function (oConfirmDialog) {
                                        oConfirmDialog.close();
                                        i18nHelper.reseti18nProperties();
                                        oConfirmDialog.destroy();
                                        this.titleChanged = false;
                                        this.subTitleChanged = false;
                                    }.bind(this)
                                );
                            };
                            this.handleTitleLiveChange = function (oEvent) {
                                var oTitleText = oEvent.getSource();
                                var sTitleTextValue = oTitleText.getValue();
                                this.previewDialogPromise.then(
                                    function () {
                                        if (sTitleTextValue && oCard.getCardHeader().getTitle() !== sTitleTextValue) {
                                            setTitleValueState(oTitleText, "None", "", oPreviewDialogSettings);
                                            oCard.getCardHeader().setTitle(sTitleTextValue);
                                            this.titleChanged = true;
                                        } else if (!sTitleTextValue) {
                                            this.titleChanged = true;
                                            setTitleValueState(
                                                oTitleText,
                                                "Error",
                                                OvpResources.getText("INT_Preview_Title_ValueStateText"),
                                                oPreviewDialogSettings
                                            );
                                        } else {
                                            setTitleValueState(oTitleText, "None", "", oPreviewDialogSettings);
                                        }
                                    }.bind(this)
                                );
                            };
                            this.handleSubTitleLiveChange = function (oEvent) {
                                var oSubTitleText = oEvent.getSource();
                                var sSubTitleTextValue = oSubTitleText.getValue();
                                this.previewDialogPromise.then(
                                    function () {
                                        if (oCard.getCardHeader().getSubtitle() !== sSubTitleTextValue) {
                                            oCard.getCardHeader().setSubtitle(sSubTitleTextValue);
                                            this.subTitleChanged = true;
                                        }
                                    }.bind(this)
                                );
                            };
                            this.confirmActionHandler = function () {
                                var oTitle = Core.byId(sIntegrationCardPreviewId + "--titleTextInput");
                                var sTitleText = oTitle && oTitle.getValue() && oTitle.getValue().trim();
                                if (sTitleText.length === 0) {
                                    setTitleValueState(
                                        oTitle,
                                        "Error",
                                        OvpResources.getText("INT_Preview_Title_ValueStateText"),
                                        oPreviewDialogSettings
                                    );
                                    oTitle.focus();
                                } else {
                                    this.previewDialogPromise.then(function (oConfirmDialog) {
                                        this.UpdateManifestDeltaChanges(oManifest, oCardDefinition, sIntegrationCardPreviewId, "Create").then(function () {
                                            oConfirmDialog.close();
                                            oConfirmDialog.destroy();
                                            resolve(oManifest);
                                        }).catch(function (oError) {
                                            MessageToast.show(oError.message);
                                        });
                                    }.bind(this));
                                }
                            };
        
                            this.downloadCardManifestHandler = function () {
                                this.previewDialogPromise.then(function (oConfirmDialog) {
                                    this.UpdateManifestDeltaChanges(oManifest, oCardDefinition, sIntegrationCardPreviewId, "Download").then(function () {
                                        oConfirmDialog.close();
                                        oConfirmDialog.destroy();
                                        resolve(oManifest);
                                    }).catch(function (oError) {
                                        MessageToast.show(oError.message);
                                    });
                                }.bind(this));
                            };
                            this.previewDialogPromise = Fragment.load({
                                id: sIntegrationCardPreviewId,
                                type: "XML",
                                name: "sap.ovp.insights.Preview",
                                controller: this
                            })
                            .then( function (previewDialogFragment) {
                                previewDialogFragment.setModel(oIntegrationDialogModel);
                                previewDialogFragment.setModel(oCardDefinition.view.getModel("i18n"), "i18n");
                                previewDialogFragment.setModel(oOvpResourceModel, "ovpResourceModel");
                                var oFlexBoxControl = Core.byId(sIntegrationCardPreviewId + "--subFlexBoxNew");
                                oFlexBoxControl.addItem(oCard);
                                this.titleChanged = false;
                                this.subTitleChanged = false;
                                if (oCardDefinition.cardComponentName !== "Analytical") {
                                    Core.byId(sIntegrationCardPreviewId + "--ovpIntPreviewOverflowLayer").setVisible(true);
                                }
                                previewDialogFragment.open();
                                return previewDialogFragment;
                            }.bind(this))
                            .catch(function (oError) {
                                oLogger.error("Integration card preview fragment failed to load, " + oError);
                            });
                        }.bind(this)
                    );
                }.bind(this)).catch(function (oError) {
                    oLogger.error(oError);
                    return Promise.reject(oError);
                });
            }
        },
        getFilterDetails: getFilterDetails
    };
    return IntegrationCard;
}, /* bExport= */ true);
