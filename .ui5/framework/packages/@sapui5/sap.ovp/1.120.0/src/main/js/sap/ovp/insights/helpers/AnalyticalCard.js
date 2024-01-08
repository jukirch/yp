/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/analytical/Utils",
    "sap/ovp/insights/helpers/i18n",
    "sap/ovp/insights/helpers/Batch",
    "sap/ovp/app/OVPUtils",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/helpers/ODataAnnotationHelper",
    "sap/ovp/helpers/ODataDelegator"
], function (
    ChartUtils, 
    i18nHelper, 
    BatchHelper,
    OVPUtils,
    CommonUtils,
    ODataAnnotationHelper,
    ODataDelegator
) {
    "use strict";
    var oVizPropertyMap = {},
        dimensionCount = 0,
        measureCount = 0,
        oFeedCountNumberMap = {},
        oDimensionPropertyMap = {},
        oSubTitleUomMap = {};

    /**
     * This function sets viz properties to a map which will be used by Integration cards
     * @param {string} sKey This is key fromed using viz frame id
     * @param {object} oVizProperties Viz Properties associated
     * @returns {}
     * @private
     */
    function setVizPropertyMap(sKey, oVizProperties) {
        if (oVizPropertyMap && !oVizPropertyMap[sKey]) {
            oVizPropertyMap[sKey] = oVizProperties;
        } else {
            oVizPropertyMap[sKey] = OVPUtils.merge(true, {}, oVizPropertyMap[sKey], oVizProperties);
        }
    }

    /**
     * This function resets count for local variables used in class i.e. dimensionCount, measureCount, oFeedCountNumberMap
     * @private
     */
    function _resetCount() {
        dimensionCount = 0;
        measureCount = 0;
        oFeedCountNumberMap = {};
    }

    /**
     * This function is used to create the feed info which will be used to create chart content
     * @param {object} oVizFrame Viz Frame object
     * @param {string} sPropertyName Property for which feed info needs to be created
     * @returns {object} The Feed info object 
     * @private
     */
    function _getRelatedFeedInfo(oVizFrame, sPropertyName) {
        var aFeeds = oVizFrame && oVizFrame.getFeeds(),
            sFeedNo;
        for (var index = 0; index < aFeeds.length; index++) {
            if (aFeeds[index] && aFeeds[index].getValues() && aFeeds[index].getValues().indexOf(sPropertyName) > -1) {
                sFeedNo = index;
                oFeedCountNumberMap[sFeedNo] = oFeedCountNumberMap[sFeedNo] + 1 || 0;
            }
        }
        return { sFeedNo: sFeedNo, count: oFeedCountNumberMap[sFeedNo] };
    }

    /**
     * This function Stores calculated displayValue binding path to a map which will be used for integration cards
     * @param {string} sKey Viz Frame id / key of map
     * @param {string} sProperty Property for which the display binding path needs to be stored
     * @param {{string} sDisplayBindingPath The display value bindinig path
     * @returns {} 
     * @public
     */
    function setDimensionPath(sKey, sProperty, sDisplayBindingPath) {
        if (!oDimensionPropertyMap[sKey]) {
            oDimensionPropertyMap[sKey] = {};
        }
        oDimensionPropertyMap[sKey][sProperty] = sDisplayBindingPath;
    }

    /**
     * This function retrives the displayValue binding path from a map
     * @param {string} sKey Viz Frame id / key of map
     * @param {string} sProperty Property for which the display binding path needs to be stored
     * @returns {string} DisplayValue binding path
     * @private
     */
    function _getDimensionPath(sKey, sProperty) {
        if (oDimensionPropertyMap) {
            if (oDimensionPropertyMap[sKey]) {
                return oDimensionPropertyMap[sKey][sProperty];
            }
        }
    }

    /**
     * This function Stores calculated Unit of measure (UOM) path to a map which will be used for integration cards
     * @param {string} sKey Viz Frame id / key of map
     * @param {string} sPath The UOM path which needs to be stored
     * @returns {} 
     * @public
     */
    function setUoMForSubTitle(sKey, sPath) {
        oSubTitleUomMap[sKey] = sPath;
    }

    /**
     * This function retrives Unit of measure (UOM) path from a map
     * @param {string} sKey Viz Frame id / key of map
     * @returns {string} The UOM path
     * @public
     */
    function getUoMForSubTitle(sKey) {
        return oSubTitleUomMap && oSubTitleUomMap[sKey];
    }

    /**
     * This function is used for getting the dimension value biding
     *  - In case if property type in metadata are 'yearmonth', 'yearquarter' or 'yearweek' then formatDateValue [an extension formatter] will be used to format dates.
     *  - In case of normal date type format.dateTime will be used, the default formatter provided from Integration card side.
     *  - For types other than date formatter is not required direct path will be returned.
     * 
     * @param {string} sDataType Data type associated with property
     * @param {string} sPropertyPath Property path
     * @param {object} oEntityType Entity type object
     * @returns {string} The Dimension Value binding string
     * @private
     */
    function _getDimensionValueBinding(sDataType, sPropertyPath, oEntityType, oModel) {
        if (sDataType === "date") {
            var aPropertyInfo = ODataDelegator.getPropertyFromEntityType(sPropertyPath, oEntityType, oModel);
            var oSemanticDateInfo = ChartUtils.getSemanticProperties(aPropertyInfo);
            var sPropertyType = oSemanticDateInfo && oSemanticDateInfo.propertyType;
            if (sPropertyType) {
                var oStaticValues = {
                    propertyType: sPropertyType
                };
                return "{= extension.formatters.formatDateValue(${" + sPropertyPath + "}," + JSON.stringify(oStaticValues) + ")}";
            }
            return "{= format.dateTime(${" + sPropertyPath + "}, {pattern: 'YYYY-MM-dd'}) }";
        }
        return "{" + sPropertyPath + "}";
    }

    /**
     * This function is used to get the display value binding
     *  - If display binding path exists from OVP then return the same path.
     *  - If disply value property path exists then create a binding string out of it.
     *  - Check the property "displayValue" exists for dimension else return "" [empty string]
     * 
     * @param {object} oDim Dimension object
     * @param {string} sDisplayValuePropertyPath Display Value Property path
     * @param {string} sOVPDisplayBindingPath Display Value Property path coming from OVP
     * @returns {string} The Display Value binding string
     * @private
     */
    function _getDisplayBinding(oDim, sDisplayValuePropertyPath, sOVPDisplayBindingPath) {
        if (sOVPDisplayBindingPath) {
            return sOVPDisplayBindingPath;
        } else if (sDisplayValuePropertyPath) {
            return "{" + sDisplayValuePropertyPath + "}";
        } else {
            return oDim.getProperty("displayValue") || "";
        }
    }

    /**
     * This function creates the content for Integration chart
     * 
     * @param {object} oCardDefinition Card defination object
     * @param {string} sChartAnnotationPath Chart annotation path
     * @param {object} oSapCard Sap Card Object
     * @returns {object} Chart Content Object
     * @public
     */
    function createChartContent(oCardDefinition, sChartAnnotationPath, oSapCard) {
        var oEntityType = oCardDefinition.entityType,
            oVizFrame = oCardDefinition.vizFrame,
            sCardId = oCardDefinition.cardComponentData.cardId,
            oView = oCardDefinition.view,
            oBatchObject = BatchHelper.getBatchObject(oCardDefinition, oSapCard["configuration"]),
            oEntityModel = oView.getModel();

        var oChartAnnotation = ODataAnnotationHelper.getRecords(oEntityType, sChartAnnotationPath, oEntityModel);
        var sTitle = (oChartAnnotation.Title && oChartAnnotation.Title.String) || "",
            sChartType = oVizFrame.getVizType(),
            sMeasureKey = sCardId,
            sDimensionkey = sCardId,
            sTitleKey,
            sTitleVal;
        if (!sTitle && oVizFrame.getVizProperties() && oVizFrame.getVizProperties().title && oVizFrame.getVizProperties().title.text) {
            sTitle = oVizFrame.getVizProperties().title.text;
        }
        if (sTitle && !sTitle.startsWith("{")) {
            sTitleKey = sTitle.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, "");
            sTitleKey = sCardId + "_" + sTitleKey.replace(/ /g, "_");
            sTitleVal = sTitle;
            i18nHelper.seti18nValueToMap("content.chartProperties.title.text", "{{" + sTitleKey + "}}", true);
            i18nHelper.inserti18nPayLoad(sCardId, sTitleKey, sTitle, "Title", "chart Title");
        } else if (sTitle.includes("@i18n&gt;")) {
            var aTitleSplit = sTitle.split("@i18n&gt;");
            sTitleVal = "{{" + aTitleSplit[1] + "}"; // its intensionally one closing brakette
            // i18nHelper.seti18nValueToMap("content.chartProperties.title.text", "{{" + sTitleVal + "}");
        } else if (sTitle.includes("@i18n>")) {
            var aTitleSplit = sTitle.split("@i18n>");
            sTitleVal = "{{" + aTitleSplit[1] + "}";
        }
        var dimensionFn = function (sDimKey, sCardId, oEntityType) {
            return function (oDim) {
                var oDisplayValueBinding = oDim.getBinding("displayValue"),
                    sDisplayValuePropertyPath = oDisplayValueBinding && oDisplayValueBinding.getPath(),
                    oBinding = oDim.getBinding("value"),
                    sPropertyPath = oBinding && oBinding.getPath(),
                    sDimensionName = oDim.getName(),
                    sKey = sDimensionName.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, "");
                var sOVPDisplayBindingPath = "";
                if (sPropertyPath) {
                    sOVPDisplayBindingPath = _getDimensionPath(sCardId, sPropertyPath);
                }
                sDimKey = sDimKey + "_" + sKey.replace(/ /g, "_") + "_" + dimensionCount;
                i18nHelper.inserti18nPayLoad(sCardId, sDimKey, sDimensionName, "Label", "chart dimension name");
                i18nHelper.seti18nValueToMap(
                    "content.dimensions." + dimensionCount + ".label",
                    "{{" + sDimKey + "}}",
                    true
                );
                var oVizFrame = oDim.getParent().getParent(),
                    oFeedInfo = _getRelatedFeedInfo(oVizFrame, sDimensionName);
                i18nHelper.seti18nValueToMap(
                    "content.feeds." + oFeedInfo.sFeedNo + ".values." + oFeedInfo.count,
                    "{{" + sDimKey + "}}",
                    true
                );
                dimensionCount = dimensionCount + 1;
                return {
                    label: sDimensionName,
                    value: _getDimensionValueBinding(oDim.getProperty("dataType"), sPropertyPath, oEntityType, oBinding.getModel()),
                    dataType: oDim.getProperty("dataType"),
                    displayValue: _getDisplayBinding(oDim, sDisplayValuePropertyPath, sOVPDisplayBindingPath)
                };
            };
        };
        var measureFn = function (sKeyMeasure) {
            return function (oMeasure) {
                var oBinding = oMeasure.getBinding("value"),
                    oPropertyPath = oBinding && oBinding.getPath(),
                    sMeasureName = oMeasure.getName(),
                    sKey = sMeasureName.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, "");

                if (CommonUtils.isODataV4(oBinding.getModel())) {
                    oPropertyPath = oPropertyPath + "Aggregate";
                }
                sKeyMeasure = sKeyMeasure + "_" + sKey.replace(/ /g, "_") + "_" + measureCount;
                i18nHelper.inserti18nPayLoad(sCardId, sKeyMeasure, sMeasureName, "Label", "chart measure name");
                i18nHelper.seti18nValueToMap(
                    "content.measures." + measureCount + ".label",
                    "{{" + sKeyMeasure + "}}",
                    true
                );
                var oVizFrame = oMeasure.getParent().getParent(),
                    oFeedInfo = _getRelatedFeedInfo(oVizFrame, sMeasureName);
                i18nHelper.seti18nValueToMap(
                    "content.feeds." + oFeedInfo.sFeedNo + ".values." + oFeedInfo.count,
                    "{{" + sKeyMeasure + "}}",
                    true
                );
                measureCount = measureCount + 1;
                return {
                    label: sMeasureName,
                    value: "{" + oPropertyPath + "}"
                };
            };
        };
        _resetCount();
        var oChartContent = {
            chartType: sChartType,
            chartProperties: oVizPropertyMap && oVizPropertyMap[oVizFrame && oVizFrame.getId()] || {},
            title: {
                text: sTitleVal,
                visible: true,
                alignment: "left"
            },
            dimensions: oVizFrame.getDataset().getDimensions().map(dimensionFn(sDimensionkey, sCardId, oEntityType)),
            measures: oVizFrame.getDataset().getMeasures().map(measureFn(sMeasureKey)),
            feeds: oVizFrame.getFeeds().map(function (oFeed) {
                return {
                    type: oFeed.getType(),
                    uid: oFeed.getUid(),
                    values: oFeed.getValues()
                };
            }),
            data: {
                path: BatchHelper.getBatchRequestPath("/content/d/results", oEntityModel)
            },
            actionableArea: "Chart"
        };
        if (!oBatchObject.header) {
            oChartContent.data.path = BatchHelper.getBatchRequestPath("/d/results", oEntityModel);
        }
        return oChartContent;
    }
    
    return {
        setVizPropertyMap: setVizPropertyMap,
        setDimensionPath: setDimensionPath,
        setUoMForSubTitle: setUoMForSubTitle,
        getUoMForSubTitle: getUoMForSubTitle,
        createChartContent: createChartContent
    };
});
