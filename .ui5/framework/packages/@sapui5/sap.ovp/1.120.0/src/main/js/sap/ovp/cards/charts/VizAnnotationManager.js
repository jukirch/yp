/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * @fileOverview Library to Manage rendering of Viz Charts.
 * Any function that needs to be exported(used outside this file) via namespace should be defined as
 * a function and then added to the return statement at the end of this file
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/analytical/Utils",
    "sap/ui/model/odata/CountMode",
    "sap/ovp/cards/AnnotationHelper",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/format/DateFormat",
    "sap/viz/ui5/controls/VizTooltip",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/viz/ui5/data/DimensionDefinition",
    "sap/viz/ui5/data/MeasureDefinition",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/ui/core/Element",
    "sap/ovp/app/resources",
    "sap/ovp/app/OVPUtils",
    "sap/base/util/each",
    "sap/base/util/merge",
    "sap/ovp/app/OVPLogger",
    "sap/ovp/insights/helpers/AnalyticalCard",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/cards/Constants",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/cards/Filterhelper",
    "sap/ovp/cards/generic/base/analytical/VizAnnotationManagerHelper"
], function (
    Utils,
    CountMode,
    CardAnnotationHelper,
    NumberFormat,
    DateFormat,
    VizTooltip,
    CommonUtils,
    OVPCardAsAPIUtils,
    DimensionDefinition,
    MeasureDefinition,
    FeedItem,
    CoreElement,
    OvpResources,
    OVPUtils,
    each,
    merge,
    OVPLogger,
    AnalyticalCardHelper,
    NavigationHelper,
    CardConstants,
    MetadataAnalyser,
    Filterhelper,
    VizAnnotationManagerHelper
) {
    "use strict";

    var mAnnotationConstants = CardConstants.Annotations;
    var mErrorMessages = CardConstants.errorMessages;

    // Supported chart type for semantic coloring
    var aSupportedChartTypesForSemanticColors = [
        mAnnotationConstants.COLUMNSTACKED_CHARTTYPE,
        mAnnotationConstants.DONUT_CHARTTYPE,
        mAnnotationConstants.COLUMN_CHARTTYPE,
        mAnnotationConstants.BAR_CHARTTYPE,
        mAnnotationConstants.VERTICALBULLET_CHARTTYPE,
        mAnnotationConstants.LINE_CHARTTYPE,
        mAnnotationConstants.COMBINATION_CHARTTYPE,
        mAnnotationConstants.BUBBLE_CHARTTYPE
    ];

    // Supported chart type for coloring with stable dimensions
    var aSupportedChartTypesForStableColors = [mAnnotationConstants.COLUMNSTACKED_CHARTTYPE];
    var oGlobalEntityType;

    var oLogger = new OVPLogger("OVP.charts.VizAnnotationManager");
    /*
     * Reads filters from annotation and prepares data binding path
     */
    function formatItems(
        iContext,
        oEntitySet,
        oSelectionVariant,
        oPresentationVariant,
        oDimensions,
        oMeasures,
        chartType
    ) {
        var ret = "{";
        if (!iContext || !iContext.getSetting("ovpCardProperties")) {
            oLogger.error(mErrorMessages.ANALYTICAL_CONFIG_ERROR);
            ret += "}";
            return ret;
        }
        var dataModel = iContext.getSetting("dataModel");
        var chartEnumArr;
        if (chartType && chartType.EnumMember) {
            chartEnumArr = chartType.EnumMember.split("/");
            if (chartEnumArr && chartEnumArr[1] === "Donut") {
                dataModel.setDefaultCountMode(CountMode.Inline);
            }
            if (chartEnumArr && chartEnumArr[1] != "Donut" && oDimensions === undefined) {
                return null;
            }
        }

        var dimensionsList = [];
        var aExpand = [];
        var aAssociationKeys = [];
        var aTempAssociationKeyArr = [];
        var measuresList = [];
        var requestList = [];
        var sorterList = [];
        var bParams = oSelectionVariant && oSelectionVariant.Parameters;
        var bSorter = oPresentationVariant && oPresentationVariant.SortOrder;
        var maxItemTerm = oPresentationVariant && oPresentationVariant.MaxItems,
            maxItems = null;
        var tmp;
        var sExpand;
        var textPath;
        var entitySet = null;
        var textKey = mAnnotationConstants.TEXT_KEY;
        var textKeyV4 = mAnnotationConstants.TEXT_KEY_V4; //as part of supporting V4 annotation
        var unitKey = mAnnotationConstants.UNIT_KEY;
        var unitKey_v4_isoCurrency = mAnnotationConstants.UNIT_KEY_V4_ISOCurrency; //as part of supporting V4 annotation
        var unitKey_v4_unit = mAnnotationConstants.UNIT_KEY_V4_Unit; //as part of supporting V4 annotation
        var oSelectItems = {};

        if (maxItemTerm) {
            maxItems = maxItemTerm.Int32 ? maxItemTerm.Int32 : maxItemTerm.Int;
        }

        if (maxItems) {
            if (maxItems === "0") {
                oLogger.error("OVP-AC: Analytic card Error: maxItems is configured as " + maxItems);
                ret += "}";
                return ret;
            }
            if (!/^\d+$/.test(maxItems)) {
                oLogger.error("OVP-AC: Analytic card Error: maxItems is Invalid. Please enter an Integer.");
                ret += "}";
                return ret;
            }
        }

        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters"),
            oMetaModel = ovpCardProperties.getProperty("/metaModel");

        bParams = bParams || !!aParameters;

        if (bParams) {
            var path = MetadataAnalyser.resolveParameterizedEntitySet(
                dataModel,
                oEntitySet,
                oSelectionVariant,
                aParameters
            );
            ret += "path: '" + path + "'";
        } else {
            ret += "path: '/" + oEntitySet.name + "'";
        }

        var filters = [];

        entitySet = iContext.getSetting("ovpCardProperties").getProperty("/entitySet");
        if (!dataModel || !entitySet) {
            return ret;
        }
        var oMetadata = Utils.getMetadata(dataModel, entitySet);

        var cardLayout = iContext.getSetting("ovpCardProperties").getProperty("/cardLayout");
        var colSpan = 1,
            colSpanOffset;
        var allConfig = Utils.getConfig();
        var config;
        var reference;

        if (
            oDimensions &&
            cardLayout &&
            cardLayout.colSpan &&
            cardLayout.colSpan > 1
        ) {
            colSpanOffset = cardLayout.colSpan - colSpan;

            for (var key in allConfig) {
                if ((reference = allConfig[key].reference) && allConfig[reference]) {
                    var virtualEntry = merge({}, allConfig[reference]);
                    allConfig[key] = virtualEntry;
                }
                if (
                    key === chartEnumArr[1] ||
                    (allConfig[key].time && allConfig[key].time.type === chartEnumArr[1].toLowerCase())
                ) {
                    config = allConfig[key];
                    break;
                }
            }

            var bSupportsTimeSemantics = Utils.hasTimeSemantics(oDimensions, config, dataModel, entitySet);
            if (bSupportsTimeSemantics) {
                config = config.time;
            } else {
                config = config.default;
            }

            var dataStep = iContext.getSetting("ovpCardProperties").getProperty("/dataStep");
            if (!dataStep) {
                if (config.resize && config.resize.hasOwnProperty("dataStep") && !isNaN(config.resize.dataStep)) {
                    dataStep = config.resize.dataStep;
                }
            }

            dataStep = parseInt(dataStep, 10);

            if (colSpanOffset > 0 && dataStep && !isNaN(dataStep)) {
                maxItems = parseInt(maxItems, 10) + dataStep * colSpanOffset;
            }
        }

        // The filters specified in the card and the selection variant
        // are both merged in the getFilters function
        if (oSelectionVariant) {
            var ovpCardProperties = iContext.getSetting("ovpCardProperties");
            filters = Filterhelper.getFilters(ovpCardProperties, oSelectionVariant);
        }

        if (filters.length > 0) {
            filters = Filterhelper.createExcludeFilters(filters, ovpCardProperties);
            ret += ", filters: " + JSON.stringify(filters);
        }

        if (bSorter) {
            var oSortAnnotationCollection = oPresentationVariant.SortOrder;
            if (!oSortAnnotationCollection.length) {
                oSortAnnotationCollection = Utils.getSortAnnotationCollection(
                    dataModel,
                    oPresentationVariant,
                    oEntitySet
                );
            }
            if (oSortAnnotationCollection.length < 1) {
                oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.SORTORDER_WARNING);
            } else {
                var sSorterValue = "";
                var oSortOrder;
                var sSortOrder;
                var sSortBy;
                for (var i = 0; i < oSortAnnotationCollection.length; i++) {
                    oSortOrder = oSortAnnotationCollection[i];
                    sSortBy = oSortOrder.Property.PropertyPath;
                    sorterList.push(sSortBy);
                    if (typeof oSortOrder.Descending === "undefined") {
                        sSortOrder = "true";
                    } else {
                        var checkFlag = oSortOrder.Descending.Bool || oSortOrder.Descending.Boolean;
                        if (!checkFlag) {
                            oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.BOOLEAN_ERROR);
                            sSortOrder = "true";
                        } else {
                            sSortOrder = checkFlag.toLowerCase() === "true" ? "true" : "false";
                        }
                    }
                    sSorterValue = sSorterValue + "{path: '" + sSortBy + "',descending: " + sSortOrder + "},";
                }
                /* trim the last ',' */
                ret += ", sorter: [" + sSorterValue.substring(0, sSorterValue.length - 1) + "]";
            }
        }

        var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");

        each(oMeasures, function (i, m) {
            tmp = m.Measure.PropertyPath;
            if (m.DataPoint && m.DataPoint.AnnotationPath) {
                var datapointAnnotationPath = entityTypeObject[m.DataPoint.AnnotationPath.substring(1)];
                if (
                    datapointAnnotationPath.ForecastValue &&
                    (datapointAnnotationPath.ForecastValue.PropertyPath ||
                        datapointAnnotationPath.ForecastValue.Path)
                ) {
                    var forecastProperty = datapointAnnotationPath.ForecastValue.PropertyPath ||
                        datapointAnnotationPath.ForecastValue.Path;
                    measuresList.push(forecastProperty);
                    if (oMetadata && oMetadata[forecastProperty]) {
                        var unitCode;
                        if (oMetadata[forecastProperty][unitKey_v4_isoCurrency]) {
                            //as part of supporting V4 annotation
                            unitCode = oMetadata[forecastProperty][unitKey_v4_isoCurrency].Path
                                ? oMetadata[forecastProperty][unitKey_v4_isoCurrency].Path
                                : undefined;
                        } else if (oMetadata[forecastProperty][unitKey_v4_unit]) {
                            unitCode = oMetadata[forecastProperty][unitKey_v4_unit].Path
                                ? oMetadata[forecastProperty][unitKey_v4_unit].Path
                                : undefined;
                        } else if (oMetadata[forecastProperty][unitKey]) {
                            unitCode = oMetadata[forecastProperty][unitKey];
                        }
                        if (unitCode) {
                            if ((measuresList ? Array.prototype.indexOf.call(measuresList, unitCode) : -1) === -1) {
                                measuresList.push(unitCode);
                            }
                        }
                    }
                }
                if (
                    datapointAnnotationPath.TargetValue &&
                    (datapointAnnotationPath.TargetValue.PropertyPath || datapointAnnotationPath.TargetValue.Path)
                ) {
                    var targetProperty = datapointAnnotationPath.TargetValue.PropertyPath ||
                        datapointAnnotationPath.TargetValue.Path;
                    measuresList.push(targetProperty);
                    if (oMetadata && oMetadata[targetProperty]) {
                        var unitCode;
                        if (oMetadata[targetProperty][unitKey_v4_isoCurrency]) {
                            //as part of supporting V4 annotation
                            unitCode = oMetadata[targetProperty][unitKey_v4_isoCurrency].Path
                                ? oMetadata[targetProperty][unitKey_v4_isoCurrency].Path
                                : undefined;
                        } else if (oMetadata[targetProperty][unitKey_v4_unit]) {
                            unitCode = oMetadata[targetProperty][unitKey_v4_unit].Path
                                ? oMetadata[targetProperty][unitKey_v4_unit].Path
                                : undefined;
                        } else if (oMetadata[targetProperty][unitKey]) {
                            unitCode = oMetadata[targetProperty][unitKey];
                        }
                        if (unitCode) {
                            if ((measuresList ? Array.prototype.indexOf.call(measuresList, unitCode) : -1) === -1) {
                                measuresList.push(unitCode);
                            }
                        }
                    }
                }
            }
            measuresList.push(tmp);
            if (oMetadata && oMetadata[tmp]) {
                if (oMetadata[tmp][textKeyV4]) {
                    //as part of supporting V4 annotation
                    if (oMetadata[tmp][textKeyV4].String && tmp != oMetadata[tmp][textKeyV4].String) {
                        measuresList.push(oMetadata[tmp][textKeyV4].String ? oMetadata[tmp][textKeyV4].String : tmp);
                    } else if (oMetadata[tmp][textKeyV4].Path && tmp != oMetadata[tmp][textKeyV4].Path) {
                        measuresList.push(oMetadata[tmp][textKeyV4].Path ? oMetadata[tmp][textKeyV4].Path : tmp);
                    }
                } else if (oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    measuresList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            }

            if (oMetadata && oMetadata[tmp]) {
                var unitCode;
                if (oMetadata[tmp][unitKey_v4_isoCurrency]) {
                    //as part of supporting V4 annotation
                    unitCode = oMetadata[tmp][unitKey_v4_isoCurrency].Path
                        ? oMetadata[tmp][unitKey_v4_isoCurrency].Path
                        : undefined;
                } else if (oMetadata[tmp][unitKey_v4_unit]) {
                    unitCode = oMetadata[tmp][unitKey_v4_unit].Path
                        ? oMetadata[tmp][unitKey_v4_unit].Path
                        : undefined;
                } else if (oMetadata[tmp][unitKey]) {
                    unitCode = oMetadata[tmp][unitKey];
                }
                if (unitCode) {
                    if ((measuresList ? Array.prototype.indexOf.call(measuresList, unitCode) : -1) === -1) {
                        measuresList.push(unitCode);
                    }
                }
            }
        });

        each(oDimensions, function (i, d) {
            tmp = d.Dimension.PropertyPath;
            dimensionsList.push(tmp);
            if (oMetadata && oMetadata[tmp]) {
                if (oMetadata[tmp][textKeyV4]) {
                    //as part of supporting V4 annotation
                    if (oMetadata[tmp][textKeyV4].String && tmp != oMetadata[tmp][textKeyV4].String) {
                        dimensionsList.push(oMetadata[tmp][textKeyV4].String ? oMetadata[tmp][textKeyV4].String : tmp);
                    } else if (oMetadata[tmp][textKeyV4].Path && tmp != oMetadata[tmp][textKeyV4].Path) {
                        textPath = oMetadata[tmp][textKeyV4].Path;
                        var aParts = textPath.split("/");
                        if (aParts.length > 1) {
                            sExpand = getNavigationPrefix(oMetaModel, entityTypeObject, textPath);
                            if (sExpand !== "") {
                                dimensionsList.push(textPath);
                                aExpand.push(sExpand);
                                aTempAssociationKeyArr = getAssociationKeys(oMetaModel, entityTypeObject, textPath);
                                if (aTempAssociationKeyArr.length > 0) {
                                    aAssociationKeys = aAssociationKeys.concat(aTempAssociationKeyArr);
                                }
                            }
                        } else {
                            dimensionsList.push(textPath ? textPath : tmp);
                        }
                    }
                } else if (oMetadata[tmp][textKey] && tmp != oMetadata[tmp][textKey]) {
                    dimensionsList.push(oMetadata[tmp][textKey] ? oMetadata[tmp][textKey] : tmp);
                }
            }
        });
        if (aAssociationKeys.length > 0) {
            var k = 0;
            while (k < aAssociationKeys.length) {
                if (dimensionsList.indexOf(aAssociationKeys[k]) !== -1) {
                    aAssociationKeys.splice(k, 1);
                } else {
                    k++;
                }
            }
        }

        //Here, the measures and dimensions are combined into a single object to indicate whether it will be a part of
        //the select query
        if (measuresList.length > 0) {
            each(measuresList, function (i, m) {
                oSelectItems[m] = true;
            });
        }
        if (dimensionsList.length > 0) {
            each(dimensionsList, function (i, d) {
                oSelectItems[d] = true;
            });
        }

        ret += ", parameters: {select:'" + [].concat(dimensionsList, measuresList).join(",");

        //check for the entity type and add requestAtLeast Fields to $Select
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        if (oEntityType) {
            var requestFields = CardAnnotationHelper.getRequestFields(oPresentationVariant);
            if (requestFields && requestFields.length > 0) {
                each(requestFields, function (i, r) {
                    //If requestAtLeast Fields are not part of select Items then append to select query
                    if (!oSelectItems.hasOwnProperty(r)) {
                        oSelectItems[r] = true;
                        requestList.push(r);
                    }
                });
                if (requestList.length > 0) {
                    ret += "," + requestList.join(",");
                }
            }
        }

        if (sorterList.length > 0) {
            var modSortList = [];
            each(sorterList, function (i, s) {
                //Here, a check occurs if any sort parameter is already a part of the select query object ie. oSelectItems
                if (!oSelectItems.hasOwnProperty(s)) {
                    //if not, then add it into a separate array
                    modSortList.push(s);
                }
            });
            if (modSortList.length > 0) {
                ret += "," + modSortList.join(",");
            }
        }
        if (aExpand.length > 0) {
            ret += "'" + "," + " expand:'" + aExpand.join(",");
        }
        // add card id as custom parameter
        var bCheckFilterPreference = CardAnnotationHelper.checkFilterPreference(
            iContext.getSetting("ovpCardProperties")
        );
        if (bCheckFilterPreference) {
            ret += "', custom: {cardId: '" + iContext.getSetting("ovpCardProperties").getProperty("/cardId") + "', _requestFrom: 'ovp_internal'}}";
        } else {
            /* close `parameters` */
            ret += "', custom: {_requestFrom: 'ovp_internal'}}";
        }

        if (chartEnumArr && chartEnumArr[1] === "Donut" && oDimensions === undefined) {
            ret += ", length: 1";
        } else if (chartEnumArr && chartEnumArr[1] === "Donut" && oDimensions && maxItems) {
            ret += ", length: " + (parseInt(maxItems, 10) + 1);
        } else if (maxItems) {
            ret += ", length: " + maxItems;
        }
        ret += "}";
        return ret;
    }

    formatItems.requiresIContext = true;

    function getNavigationPrefix(oMetaModel, oEntityType, sProperty) {
        var sExpand = "";
        var aParts = sProperty.split("/");

        if (aParts.length > 1) {
            for (var i = 0; i < aParts.length - 1; i++) {
                var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                if (oAssociationEnd) {
                    oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                    if (sExpand) {
                        sExpand = sExpand + "/";
                    }
                    sExpand = sExpand + aParts[i];
                } else {
                    return sExpand;
                }
            }
        }
        return sExpand;
    }

    function getAssociationKeys(oMetaModel, oEntityType, sProperty) {
        var aAssociationKeys = [];
        var aKeyObjects = [];
        var targetKey;
        var aParts = sProperty.split("/");
        if (aParts.length > 1) {
            for (var i = 0; i < aParts.length - 1; i++) {
                var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                if (oAssociationEnd) {
                    oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                    if (oEntityType) {
                        aKeyObjects = oEntityType && oEntityType.key && oEntityType.key.propertyRef;
                        for (var j = 0; j < aKeyObjects.length; j++) {
                            targetKey = aParts[i] + "/" + aKeyObjects[j].name;
                            aAssociationKeys.push(targetKey);
                        }
                    }
                }
            }
        }
        return aAssociationKeys;
    }

    function checkForecastMeasure(aMeasure, entityTypeObject) {
        var boolflag = false;
        var realMeasure;
        if (aMeasure.DataPoint && aMeasure.DataPoint.AnnotationPath) {
            var oDatapoint = entityTypeObject[aMeasure.DataPoint.AnnotationPath.substring(1)];
            if (
                oDatapoint &&
                oDatapoint.ForecastValue &&
                (oDatapoint.ForecastValue.PropertyPath || oDatapoint.ForecastValue.Path)
            ) {
                boolflag = true;
                realMeasure = aMeasure;
            }
        }

        if (boolflag === true) {
            return realMeasure;
        } else {
            oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_FORECAST);
            return undefined;
        }
    }

    function checkTargetMeasure(aMeasure, entityTypeObject) {
        var boolflag = false;
        var realMeasure;
        if (aMeasure.DataPoint && aMeasure.DataPoint.AnnotationPath) {
            var oDatapoint = entityTypeObject[aMeasure.DataPoint.AnnotationPath.substring(1)];
            if (
                oDatapoint &&
                oDatapoint.TargetValue &&
                (oDatapoint.TargetValue.PropertyPath || oDatapoint.TargetValue.Path)
            ) {
                boolflag = true;
                realMeasure = aMeasure;
            }
        }

        if (boolflag === true) {
            return realMeasure;
        } else {
            oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_TARGET);
            return undefined;
        }
    }

    function getSapLabel(aMeasure, oMetadata) {
        var value;
        each(oMetadata, function (i, v) {
            if (v.name === aMeasure) {
                if (v["com.sap.vocabularies.Common.v1.Label"]) {
                    //as part of supporting V4 annotation
                    value = v["com.sap.vocabularies.Common.v1.Label"].String
                        ? v["com.sap.vocabularies.Common.v1.Label"].String
                        : v["com.sap.vocabularies.Common.v1.Label"].Path;
                } else if (v["sap:label"]) {
                    value = v["sap:label"];
                }
                return false;
            }
        });
        return value;
    }

    function getMeasureDimCheck(feeds, chartType) {
        var boolFlag = true;
        if (chartType === "line" || chartType === "column" || chartType === "bar") {
            each(feeds, function (i, v) {
                if (v.getUid() === "valueAxis" || v.getUid() === "categoryAxis") {
                    if (v.getValues().length != 1) {
                        boolFlag = false;
                        oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_DIMMEAS);
                        return false;
                    }
                }
            });
        } else if (chartType === "vertical_bullet") {
            each(feeds, function (i, v) {
                if (v.getUid() === "actualValues" || v.getUid() === "categoryAxis") {
                    if (v.getValues().length != 1) {
                        boolFlag = false;
                        oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_DIMMEAS);
                        return false;
                    }
                }
            });
        }

        if (boolFlag === true) {
            return true;
        }
    }

    function returnDateFormat(date) {
        return date || "";
    }

    function hideDateTimeAxis(vizFrame, feedName) {
        var dataModel = vizFrame.getModel();
        var type = vizFrame.getVizType();
        if (type != "line" && type != "bubble") {
            return;
        }
        if (!feedName) {
            feedName = type === "line" ? "categoryAxis" : "valueAxis";
        }
        var entitySet = vizFrame.getModel("ovpCardProperties").getProperty("/entitySet");
        if (!dataModel || !entitySet) {
            return;
        }
        var oMetadata = Utils.getMetadata(dataModel, entitySet);
        var feeds = vizFrame.getFeeds();
        for (var i = 0; i < feeds.length; i++) {
            if (feeds[i].getUid() === feedName) {
                var feedValues = feeds[i].getValues();
                if (!feedValues) {
                    return;
                }
                for (var j = 0; j < feedValues.length; j++) {
                    if (oMetadata[feedValues[j][mAnnotationConstants.TYPE_KEY]] != "Edm.DateTime") {
                        return;
                    }
                }
                vizFrame.setVizProperties({
                    categoryAxis: {
                        title: {
                            visible: false
                        }
                    }
                });
                var oCardsModel = vizFrame && vizFrame.getModel("ovpCardProperties");
                if (oCardsModel && oCardsModel.getProperty("/bInsightEnabled")) {
                    var sKey = vizFrame && vizFrame.getId();
                    AnalyticalCardHelper.setVizPropertyMap(sKey, { categoryAxis: { title: { visible: false } } });
                }
                return;
            }
        }
    }

    /*
     * Check if backend supplies no data.
     * If so, show the no-data fragment.
     * Commented out due to an issue with filters.
     * Shows No data available even when correct filters are applied the second time.
     * So, removing it temporarily.
     */
    function checkNoData(oEvent, cardContainer, vizFrame) {
        /*	var self = sap.ovp.cards.charts.VizAnnotationManager;
         var data, noDataDiv;
         if (!cardContainer) {
         oLogger.error(mErrorMessages.CARD_ERROR + mErrorMessages.CARD_CONTAINER_ERROR +
         "(" + vizFrame.getId() + ")");
         return;
         }
         data = oEvent.getParameter("data");
         if (!data || isEmptyObject(data) ||
         !data.results || !data.results.length) {

         oLogger.error(mErrorMessages.CARD_ERROR + mErrorMessages.DATA_UNAVAIALABLE  +
         "(" + vizFrame.getId() + ")");
         noDataDiv = sap.ui.xmlfragment("sap.ovp.cards.charts.generic.noData");
         cardContainer.removeAllItems();
         cardContainer.addItem(noDataDiv);
         }*/
    }

    /*
     * Formatter for VizFrame type.
     * @param {Object} oChartType - Chart Annotation Object
     * @returns {String} Valid Enum for Vizframe type
     */
    function getChartType(iContext, oChartType, aDimensions) {
        var bODataV4 = CardAnnotationHelper.isODataV4Context(iContext);
        var ret = "";
        var config = Utils.getConfig(oChartType, bODataV4);
        var dataModel, entitySet;
        if (!config) {
            return ret;
        }
        ret = config.default.type;
        dataModel = iContext.getSetting("dataModel");
        entitySet = iContext.getSetting("ovpCardProperties").getProperty("/entitySet");
        if (Utils.hasTimeSemantics(aDimensions, config, dataModel, entitySet, bODataV4)) {
            ret = config.time.type;
        }
        return ret;
    }

    getChartType.requiresIContext = true;

    function checkFlag(aMeasures, entityTypeObject) {
        var oResult = {
            boolFlag: false
        };

        each(aMeasures, function (i, v) {
            if (v.DataPoint && v.DataPoint.AnnotationPath) {
                var oDatapoint = entityTypeObject[v.DataPoint.AnnotationPath.substring(1)];
                VizAnnotationManagerHelper.UpdateFlagValueForDataPoint(oDatapoint, oResult);
            }
        });
        if (oResult.boolFlag === true && aMeasures.length > 1) {
            oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_SEMANTIC_MEASURES);
        }
        return oResult.boolFlag;
    }

    function buildSemanticLegends(oMeasure, entityTypeObject, oMetadata, vizFrame) {
        var sMeasureName = VizAnnotationManagerHelper.getMeasureName(oMeasure, oMetadata, vizFrame);
        var dataPointAnnotationPath = oMeasure.DataPoint.AnnotationPath;
        var oDataPoint = entityTypeObject[dataPointAnnotationPath.substring(1)];
        return VizAnnotationManagerHelper.getSemanticLegends(oDataPoint, true, sMeasureName);
    }

    function checkEDMINT32Exists(oMetadata, val, feedtype) {
        if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.EDM_TYPE] === mAnnotationConstants.EDM_INT32) {
            return true;
        }
        return false;
    }

    function checkEDMINT64Exists(oMetadata, val, feedtype) {
        if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.EDM_TYPE] === mAnnotationConstants.EDM_INT64) {
            return true;
        }
        return false;
    }

    /**
     * 
     * Check if roles are valid for dimension/measure for the chart type
     * 
     * @param {array} queue 
     * @param {object} config 
     * @param {string} type 
     */
    function _checkRolesForProperty(queue, config, type) {
        /* Nothing remains in the queue, all good !!! */
        if (!queue.length) {
            return;
        }
        var feedtype = type === "dimension" ? "Dimension" : "Measure";
        var queuedNames = [];
        each(queue, function (i, val) {
            if (!val || !val[feedtype] || !val[feedtype].PropertyPath) {
                oLogger.error(mErrorMessages.INVALID_CHART_ANNO);
                return false;
            }
            queuedNames.push(val[feedtype].PropertyPath);
        });
        var allowedRoles = jQuery.map(config.feeds, function (f) {
            if (f.type === type) {
                if (f.role) {
                    return f.role.split("|");
                }
                return [];
            }
        });
        allowedRoles = jQuery
            .grep(allowedRoles, function (role, i) {
                return (allowedRoles ? Array.prototype.indexOf.call(allowedRoles, role) : -1) === i;
            })
            .join(", ");

        oLogger.error(
            mErrorMessages.CARD_ERROR +
            mErrorMessages.INVALID_REDUNDANT +
            type +
            "(s) " +
            queuedNames.join(", ") +
            ". " +
            mErrorMessages.ALLOWED_ROLES +
            config.type +
            mErrorMessages.CHART_IS +
            allowedRoles
        );
    }

    /*
     * Construct VizProperties and Feeds for VizFrame
     * @param {Object} VizFrame
     */
    function buildVizAttributes(vizFrame, handler, oController) {
        var oCardsModel, entityTypeObject, sChartAnnotationPath, chartContext, bShowDataLabel;
        var chartType,
            allConfig,
            config,
            aDimensions,
            aMeasures,
            bShowDataLabelCardsAsApi = false;
        var oVizProperties;
        var aQueuedProperties, aQueuedDimensions, aQueuedMeasures;
        var aPropertyWithoutRoles,
            aDimensionWithoutRoles = [],
            aMeasureWithoutRoles = [];
        var aLegendTextArrangement = [];
        var bSupportsTimeSemantics;
        var reference;
        var oView = oController && oController.getView();
        var oDropdown, selectedKey;
        var uiModel = oView && oView.getModel("ui");
        var oChartSettings = uiModel && uiModel.getProperty("/chartSettings");
        // to show datalabel in case of ALP KPICards
        oCardsModel = vizFrame.getModel("ovpCardProperties");
        if (OVPCardAsAPIUtils.checkIfAPIIsUsed(oController)) {
            bShowDataLabelCardsAsApi = oCardsModel && oCardsModel.getData() && oCardsModel.getData().showDataLabel;
        }
        bShowDataLabel = oChartSettings ? oChartSettings.showDataLabel : bShowDataLabelCardsAsApi;

        chartType = vizFrame.getVizType();
        allConfig = Utils.getConfig();

        for (var key in allConfig) {
            if ((reference = allConfig[key].reference) && allConfig[reference]) {
                var virtualEntry = merge({}, allConfig[reference]);
                allConfig[key] = virtualEntry;
            }
            if (
                allConfig[key].default.type === chartType ||
                (allConfig[key].time && allConfig[key].time.type === chartType)
            ) {
                config = allConfig[key];
                break;
            }
        }

        if (!config) {
            oLogger.error(
                mErrorMessages.CARD_ERROR +
                "in " +
                mErrorMessages.CARD_CONFIG +
                mErrorMessages.CARD_CONFIG_ERROR +
                chartType +
                " " +
                mErrorMessages.CARD_CONFIG_JSON
            );
            return;
        }

        if (!oCardsModel) {
            oLogger.error(
                mErrorMessages.CARD_ERROR + "in " + mErrorMessages.CARD_CONFIG + mErrorMessages.NO_CARD_MODEL
            );
            return;
        }
        var dataModel = vizFrame.getModel();
        var entitySet = oCardsModel.getProperty("/entitySet");
        if (!dataModel || !entitySet) {
            return;
        }
        entityTypeObject = oCardsModel.getProperty("/entityType");
        if (!entityTypeObject) {
            oLogger.error(mErrorMessages.CARD_ANNO_ERROR + "in " + mErrorMessages.CARD_ANNO);
            return;
        }
        var oMetadata = Utils.getMetadata(dataModel, entitySet);
        sChartAnnotationPath = oCardsModel.getProperty("/chartAnnotationPath");
        if (!sChartAnnotationPath || !(chartContext = entityTypeObject[sChartAnnotationPath])) {
            oLogger.error(mErrorMessages.CARD_ANNO_ERROR + "in " + mErrorMessages.CARD_ANNO);
            return;
        }
        var sChartTitle = getChartTitle(entityTypeObject, sChartAnnotationPath, vizFrame);
        
        if (!(aDimensions = chartContext.DimensionAttributes) || !aDimensions.length) {
            oLogger.error(
                mErrorMessages.CHART_ANNO_ERROR +
                "in " +
                mErrorMessages.CHART_ANNO +
                " " +
                mErrorMessages.DIMENSIONS_MANDATORY
            );
            return;
        }
        //Added support for fractional digits
        var aNumberOfFractionalDigits;
        if (!(aMeasures = chartContext.MeasureAttributes) || !aMeasures.length) {
            oLogger.error(
                mErrorMessages.CHART_ANNO_ERROR +
                "in " +
                mErrorMessages.CHART_ANNO +
                " " +
                mErrorMessages.MEASURES_MANDATORY
            );
            return;
        } else {
            var datapointAnnotationPath = aMeasures[0].DataPoint
                ? entityTypeObject[aMeasures[0].DataPoint.AnnotationPath.substring(1)]
                : null;
            var dpNumberOfFractionalDigits =
                datapointAnnotationPath &&
                datapointAnnotationPath.ValueFormat &&
                datapointAnnotationPath.ValueFormat.NumberOfFractionalDigits &&
                datapointAnnotationPath.ValueFormat.NumberOfFractionalDigits.Int;
            aNumberOfFractionalDigits = dpNumberOfFractionalDigits ? dpNumberOfFractionalDigits : 0;
        }
        bSupportsTimeSemantics = Utils.hasTimeSemantics(aDimensions, config, dataModel, entitySet);
        if (bSupportsTimeSemantics) {
            config = config.time;
        } else {
            config = config.default;
        }

        var chartProps = oCardsModel.getProperty("/ChartProperties") || oCardsModel.getProperty("/chartProperties");
        if (oCardsModel && oCardsModel.getProperty("/tabs") && chartProps === undefined) {
            oDropdown = oView.byId("ovp_card_dropdown");
            selectedKey = parseInt(oDropdown.getSelectedKey(), 10);
            chartProps =
                oCardsModel.getProperty("/tabs") &&
                oCardsModel.getProperty("/tabs")[selectedKey - 1] &&
                (oCardsModel.getProperty("/tabs")[selectedKey - 1]["ChartProperties"] ||
                    oCardsModel.getProperty("/tabs")[selectedKey - 1]["chartProperties"]);
        }

        var bErrors = false;
        var tooltipFormatString =
            aNumberOfFractionalDigits > 0
                ? "tooltipNoScaleFormatter/" + aNumberOfFractionalDigits.toString() + "/"
                : "tooltipNoScaleFormatter/-1/";
        var oTooltip = new VizTooltip({ formatString: tooltipFormatString });
        oTooltip.connect(vizFrame.getVizUid());
        oTooltip.connect(vizFrame.getVizUid());
        vizFrame._oOvpVizFrameTooltip = oTooltip;

        var aVizData = [];
        var bChartTypesForStableColors = aSupportedChartTypesForStableColors.indexOf(chartContext.ChartType.EnumMember) >= 0;
        if (bChartTypesForStableColors && vizFrame && vizFrame.getModel("analyticalmodel")) {
            aVizData = vizFrame.getModel("analyticalmodel").getData() || [];
        }
        /*
         * Check if given number of dimensions, measures
         * are valid acc to config's min and max requirements
         */
        [config.dimensions, config.measures].forEach(function (entry, i) {
            var oProperty = i ? aMeasures : aDimensions;
            var typeCue = i ? "measure(s)" : "dimension(s)";
            if (entry.min && oProperty.length < entry.min) {
                oLogger.error(mErrorMessages.CARD_ERROR + "in " + chartType + " " + mErrorMessages.CARD_LEAST + entry.min + " " + typeCue);
                bErrors = true;
            }
            if (entry.max && oProperty.length > entry.max) {
                oLogger.error(mErrorMessages.CARD_ERROR + "in " + chartType + mErrorMessages.CARD_MOST + entry.max + " " + typeCue);
                bErrors = true;
            }
        });

        if (bErrors) {
            return;
        }

        /* HEADER UX stuff */
        var bHideAxisTitle = true;

        if (config.properties && config.properties.hasOwnProperty("hideLabel") && !config.properties["hideLabel"]) {
            bHideAxisTitle = false;
        }

        var bDatapointNavigation = true;

        // FIORITECHP1-6021 - Allow Disabling of Navigation from Graph
        // var dNav = oCardsModel.getProperty("/navigation");
        // if (dNav === "chartNav") {
        //      bDatapointNavigation = false;
        // }
        var bDonutChart = false;
        if (chartType === "donut") {
            bDonutChart = true;
        }
        vizFrame.removeAllAggregation();
        /*
         * Default viz properties template
         */
        oVizProperties = {
            legend: {
                isScrollable: false
            },
            title: {
                visible: true
            },
            interaction: {
                noninteractiveMode: bDatapointNavigation ? false : true,
                selectability: {
                    legendSelection: bDonutChart ? true : false,
                    axisLabelSelection: false,
                    mode: "EXCLUSIVE",
                    plotLassoSelection: false,
                    plotStdSelection: true
                },
                zoom: {
                    enablement: "disabled"
                }
            },
            plotArea: {
                window: {
                    start: "firstDataPoint",
                    end: "lastDataPoint"
                },
                dataLabel: {
                    visible: bShowDataLabel || bDonutChart ? true : false,
                    type: "value" //FIORITECHP1-5665 - Donut and Pie charts should be able to show numbers
                },
                dataPoint: {
                    invalidity: "ignore"
                },
                alignment: {
                    vertical: "top"
                }
            },
            categoryAxis: {
                label: {
                    truncatedLabelRatio: 0.15
                }
            },
            general: {
                groupData: false,
                showAsUTC: true
            }
        };

        if (
            config.properties &&
            config.properties.semanticColor === true &&
            checkFlag(aMeasures, entityTypeObject)
        ) {
            //put strings in resource bundle
            var goodLegend = OvpResources.getText("GOOD");
            var badLegend = OvpResources.getText("BAD");
            var criticalLegend = OvpResources.getText("CRITICAL");
            var othersLegend = OvpResources.getText("OTHERS");
            if (aMeasures.length === 1) {
                var legends = buildSemanticLegends(aMeasures[0], entityTypeObject, oMetadata, vizFrame);
                var goodLegend = legends[0] || goodLegend,
                    badLegend = legends[1] || badLegend,
                    criticalLegend = legends[2] || criticalLegend,
                    othersLegend = OvpResources.getText("OTHERS");
            }
            oVizProperties.plotArea.dataPointStyle = {
                rules: [
                    {
                        callback: function (oContext) {
                            var dataPointAnnotationPath = Utils.mapMeasures(oContext, oMetadata, aMeasures);
                            if (!dataPointAnnotationPath) {
                                return false;
                            }
                            var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
                            var sState = VizAnnotationManagerHelper.formThePathForCriticalityStateCalculation(oContext, criticality);
                            if (sState === CardConstants.Criticality.StateValues.Positive) {
                                return true;
                            } else if (sState === "Positive") {
                                return true;
                            }
                        },
                        properties: {
                            color: "sapUiChartPaletteSemanticGoodLight1"
                        },
                        displayName: goodLegend
                    },
                    {
                        callback: function (oContext) {
                            var dataPointAnnotationPath = Utils.mapMeasures(oContext, oMetadata, aMeasures);
                            if (!dataPointAnnotationPath) {
                                return false;
                            }
                            var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
                            var sState = VizAnnotationManagerHelper.formThePathForCriticalityStateCalculation(oContext, criticality);
                            if (sState === CardConstants.Criticality.StateValues.Critical) {
                                return true;
                            } else if (sState === "Critical") {
                                return true;
                            }
                        },
                        properties: {
                            color: "sapUiChartPaletteSemanticCriticalLight1"
                        },
                        displayName: criticalLegend
                    },
                    {
                        callback: function (oContext) {
                            var dataPointAnnotationPath = Utils.mapMeasures(oContext, oMetadata, aMeasures);
                            if (!dataPointAnnotationPath) {
                                return false;
                            }
                            var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
                            var sState = VizAnnotationManagerHelper.formThePathForCriticalityStateCalculation(oContext, criticality);
                            if (sState === CardConstants.Criticality.StateValues.Negative) {
                                return true;
                            } else if (sState === "Negative") {
                                return true;
                            }
                        },
                        properties: {
                            color: "sapUiChartPaletteSemanticBadLight1"
                        },
                        displayName: badLegend
                    },
                    {
                        callback: function (oContext) {
                            var dataPointAnnotationPath = Utils.mapMeasures(oContext, oMetadata, aMeasures);
                            if (!dataPointAnnotationPath) {
                                return false;
                            }
                            var criticality = entityTypeObject[dataPointAnnotationPath.substring(1)];
                            var sState = VizAnnotationManagerHelper.formThePathForCriticalityStateCalculation(oContext, criticality);
                            if (sState === CardConstants.Criticality.StateValues.None) {
                                return true;
                            } else if (sState === "Neutral") {
                                return true;
                            }
                        },
                        properties: {
                            color: "sapUiChartPaletteSemanticNeutralLight1"
                        },
                        displayName: othersLegend
                    }
                ]
            };
        }

        var bEnableStableColors = oCardsModel.getProperty("/bEnableStableColors");
        var oColorPalette = oCardsModel.getProperty("/colorPalette");
        var colorPaletteDimension;

        //Perform only semantic coloring here
        if (
            !bEnableStableColors &&
            aSupportedChartTypesForSemanticColors.indexOf(chartContext.ChartType.EnumMember) >= 0 &&
            oColorPalette &&
            Object.keys(oColorPalette).length >= 2 &&
            Object.keys(oColorPalette).length <= 4
        ) {
            each(aDimensions, function (i, oDimension) {
                if (
                    oDimension &&
                    oDimension.Role &&
                    oDimension.Role.EnumMember === "com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Series"
                ) {
                    colorPaletteDimension = oDimension.Dimension && oDimension.Dimension.PropertyPath;
                    return;
                }
            });
            var feedName;
            if (colorPaletteDimension) {
                if (oMetadata && oMetadata[colorPaletteDimension]) {
                    if (oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY_V4]) {
                        //as part of supporting V4 annotation
                        feedName = VizAnnotationManagerHelper.getLabelFromAnnotationPath(
                            oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY_V4].String
                                ? oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY_V4].String
                                : oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY_V4].Path,
                            vizFrame,
                            oMetadata
                        );
                    } else if (oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY]) {
                        feedName = oMetadata[colorPaletteDimension][mAnnotationConstants.LABEL_KEY];
                    } else if (colorPaletteDimension) {
                        feedName = colorPaletteDimension;
                    }
                }
                /*if (chartContext.ChartType.EnumMember === mAnnotationConstants.COLUMNSTACKED_CHARTTYPE) {
                    var chartData = vizFrame.getDataset() && vizFrame.getDataset().getBinding("data");
                    if (chartData) {
                        chartData.sort([new sap.ui.model.Sorter(colorPaletteDimension, true)]);
                    }
                }*/

                //In case of an array based colorPalette
                if (oColorPalette instanceof Array) {
                    var aColorValues = oColorPalette.map(function (value) {
                        return value.color;
                    });
                    var aLegendTexts = oColorPalette.map(function (value) {
                        return value.legendText;
                    });
                    //put strings in resource bundle
                    var othersCustomLegend = aLegendTexts[0] != undefined ? aLegendTexts[0] : OvpResources.getText("OTHERS");
                    var badCustomLegend = aLegendTexts[1] != undefined ? aLegendTexts[1] : OvpResources.getText("BAD");
                    var criticalCustomLegend = aLegendTexts[2] != undefined ? aLegendTexts[2] : OvpResources.getText("CRITICAL");
                    var goodCustomLegend = aLegendTexts[3] != undefined ? aLegendTexts[3] : OvpResources.getText("GOOD");
                }

                oVizProperties.plotArea.dataPointStyle = {
                    rules: [
                        {
                            callback: function (oContext) {
                                if (oContext && (oContext[feedName] === "3" || oContext[feedName] === 3)) {
                                    //This rule should always return false, when the number of colors maintained in the colorPalette is less
                                    //than value of Criticality + 1(which signifies the position of the color within the colorPalette array)
                                    //Coloring is not applied for such cases
                                    if (oColorPalette instanceof Array) {
                                        //In case an array based colorPalette is used
                                        if (oColorPalette.length < 4) {
                                            return false;
                                        }
                                    } else if (oColorPalette && !oColorPalette.hasOwnProperty(3)) {
                                        //In case an object map based colorPalette is used
                                        return false;
                                    }
                                    return true;
                                }
                            },
                            properties: {
                                color:
                                    oColorPalette instanceof Array && aColorValues.length
                                        ? aColorValues[3]
                                        : oColorPalette[3] && oColorPalette[3]["color"]
                            },
                            displayName: goodCustomLegend || (oColorPalette[3] && oColorPalette[3]["legendText"])
                        },
                        {
                            callback: function (oContext) {
                                if (oContext && (oContext[feedName] === "2" || oContext[feedName] === 2)) {
                                    //This rule should always return false, when the number of colors maintained in the colorPalette is less
                                    //than value of Criticality + 1(which signifies the position of the color within the colorPalette array)
                                    //Coloring is not applied for such cases
                                    if (oColorPalette instanceof Array) {
                                        //In case an array based colorPalette is used
                                        if (oColorPalette.length < 3) {
                                            return false;
                                        }
                                    } else if (oColorPalette && !oColorPalette.hasOwnProperty(2)) {
                                        //In case an object map based colorPalette is used
                                        return false;
                                    }
                                    return true;
                                }
                            },
                            properties: {
                                color:
                                    oColorPalette instanceof Array && aColorValues.length
                                        ? aColorValues[2]
                                        : oColorPalette[2] && oColorPalette[2]["color"]
                            },
                            displayName:
                                criticalCustomLegend || (oColorPalette[2] && oColorPalette[2]["legendText"])
                        },
                        {
                            callback: function (oContext) {
                                if (oContext && (oContext[feedName] === "1" || oContext[feedName] === 1)) {
                                    return true;
                                }
                            },
                            properties: {
                                color:
                                    oColorPalette instanceof Array && aColorValues.length
                                        ? aColorValues[1]
                                        : oColorPalette[1] && oColorPalette[1]["color"]
                            },
                            displayName: badCustomLegend || (oColorPalette[1] && oColorPalette[1]["legendText"])
                        },
                        {
                            callback: function (oContext) {
                                if (oContext && (oContext[feedName] === "0" || oContext[feedName] === 0)) {
                                    return true;
                                }
                            },
                            properties: {
                                color:
                                    oColorPalette instanceof Array && aColorValues.length
                                        ? aColorValues[0]
                                        : oColorPalette[0] && oColorPalette[0]["color"]
                            },
                            displayName: othersCustomLegend || (oColorPalette[0] && oColorPalette[0]["legendText"])
                        }
                    ]
                };

                var oDataPointStyleRulesCopy;
                if (oCardsModel && oCardsModel.getProperty("/bInsightEnabled")) {
                    oDataPointStyleRulesCopy = merge({}, oVizProperties.plotArea.dataPointStyle);
                    var sColorPaletteDimensionType = oMetadata && oMetadata[colorPaletteDimension] && oMetadata[colorPaletteDimension].type || "";

                    oDataPointStyleRulesCopy.rules.forEach(function(rule, index, rules) {
                        delete rule["callback"];
                        rule.dataContext = {};
                        if (sColorPaletteDimensionType) {
                            rule.dataContext[feedName] = sColorPaletteDimensionType === "Edm.String" ? (rules.length - 1 - index) + "" : (rules.length - 1 - index);
                        } else {
                            rule.dataContext[feedName] = (rules.length - 1 - index) + "";
                        }
                    });
                }
            }
        }

        /*Check if the Config.json has scale properties set*/
        var bConsiderAnnotationScales = false;
        var bIsMinMax = false;
        if (
            chartContext.ChartType.EnumMember === mAnnotationConstants.SCATTER_CHARTTYPE ||
            chartContext.ChartType.EnumMember === mAnnotationConstants.BUBBLE_CHARTTYPE ||
            chartContext.ChartType.EnumMember === mAnnotationConstants.LINE_CHARTTYPE
        ) {
            if (
                chartContext &&
                chartContext.AxisScaling &&
                chartContext.AxisScaling.RecordType == "com.sap.vocabularies.UI.v1.ChartAxisScalingType"
            ) {
                var oAxisScaling = chartContext.AxisScaling;
                if (
                    oAxisScaling.AutoScaleBehavior &&
                    oAxisScaling.AutoScaleBehavior.RecordType == "com.sap.vocabularies.UI.v1.ChartAxisAutoScaleBehaviorType"
                ) {
                    var oAutoScaleBehavior = oAxisScaling.AutoScaleBehavior;
                    if (
                        oAutoScaleBehavior.ZeroAlwaysVisible &&
                        oAutoScaleBehavior.ZeroAlwaysVisible.Bool == "true"
                    ) {
                        oVizProperties.plotArea.adjustScale = false;
                        bConsiderAnnotationScales = true;
                    } else if (oAutoScaleBehavior.DataScope) {
                        oVizProperties.plotArea.adjustScale = true;
                        bConsiderAnnotationScales = true;
                    }
                } else if (
                    oAxisScaling.RecordType == "com.sap.vocabularies.UI.v1.ChartAxisScalingType" &&
                    oAxisScaling.ScaleBehavior &&
                    oAxisScaling.ScaleBehavior.EnumMember
                ) {
                    var sEnumMember = oAxisScaling.ScaleBehavior.EnumMember;
                    var sEnumMemberValue = sEnumMember.substring(
                        sEnumMember.lastIndexOf("/") + 1,
                        sEnumMember.length
                    );
                    if (sEnumMemberValue == "FixedScale") {
                        bIsMinMax = true;
                    }
                }
            } else if (chartContext && chartContext.AxisScaling && chartContext.AxisScaling.EnumMember) {
                var sScaleType = chartContext.AxisScaling.EnumMember.substring(
                    chartContext.AxisScaling.EnumMember.lastIndexOf("/") + 1,
                    chartContext.AxisScaling.EnumMember.length
                );
                //bConsiderAnnotationScales are individually set for each case to make sure the scale values are set casewise
                switch (sScaleType) {
                    case "AdjustToDataIncluding0":
                        oVizProperties.plotArea.adjustScale = false;
                        bConsiderAnnotationScales = true;
                        break;
                    case "AdjustToData":
                        oVizProperties.plotArea.adjustScale = true;
                        bConsiderAnnotationScales = true;
                        break;
                    case "MinMaxValues":
                        bIsMinMax = true;
                        break;
                    default:
                        break;
                }
            }

            if (bIsMinMax) {
                var aChartScales = [];
                if (
                    chartContext["MeasureAttributes"][0] &&
                    chartContext["MeasureAttributes"][0].DataPoint &&
                    chartContext["MeasureAttributes"][0].DataPoint.AnnotationPath
                ) {
                    var sDataPointAnnotationPath = chartContext["MeasureAttributes"][0].DataPoint.AnnotationPath;
                    var sDataPointPath = sDataPointAnnotationPath.substring(
                        sDataPointAnnotationPath.lastIndexOf("@") + 1,
                        sDataPointAnnotationPath.length
                    );
                    if (entityTypeObject && entityTypeObject[sDataPointPath]) {
                        var oMinMaxParams = entityTypeObject[sDataPointPath];
                        if (
                            oMinMaxParams &&
                            oMinMaxParams.MaximumValue &&
                            oMinMaxParams.MaximumValue.Decimal &&
                            oMinMaxParams.MinimumValue &&
                            oMinMaxParams.MinimumValue.Decimal
                        ) {
                            aChartScales.push({
                                feed: "valueAxis",
                                max: oMinMaxParams.MaximumValue.Decimal,
                                min: oMinMaxParams.MinimumValue.Decimal
                            });
                            bConsiderAnnotationScales = true;
                        } else {
                            oLogger.error(mErrorMessages.ERROR_MISSING_AXISSCALES);
                        }
                    }
                }
                //LINE_CHARTTYPE donot have valueAxis2
                if (
                    chartContext.ChartType.EnumMember !== mAnnotationConstants.LINE_CHARTTYPE &&
                    chartContext["MeasureAttributes"][1] &&
                    chartContext["MeasureAttributes"][1].DataPoint &&
                    chartContext["MeasureAttributes"][1].DataPoint.AnnotationPath
                ) {
                    var sDataPointAnnotationPath = chartContext["MeasureAttributes"][1].DataPoint.AnnotationPath;
                    var sDataPointPath = sDataPointAnnotationPath.substring(
                        sDataPointAnnotationPath.lastIndexOf("@") + 1,
                        sDataPointAnnotationPath.length
                    );
                    if (entityTypeObject && entityTypeObject[sDataPointPath]) {
                        var oMinMaxParams = entityTypeObject[sDataPointPath];
                        if (
                            oMinMaxParams &&
                            oMinMaxParams.MaximumValue &&
                            oMinMaxParams.MaximumValue.Decimal &&
                            oMinMaxParams.MinimumValue &&
                            oMinMaxParams.MinimumValue.Decimal
                        ) {
                            aChartScales.push({
                                feed: "valueAxis2",
                                max: oMinMaxParams.MaximumValue.Decimal,
                                min: oMinMaxParams.MinimumValue.Decimal
                            });
                            bConsiderAnnotationScales = true;
                        } else {
                            oLogger.error(mErrorMessages.ERROR_MISSING_AXISSCALES);
                        }
                    }
                }
                vizFrame.setVizScales(aChartScales);
            }
        }
        aQueuedDimensions = aDimensions.slice();
        aQueuedMeasures = aMeasures.slice();

        //		var minFractionDigits = Number(dataContext.NumberFormat.NumberOfFractionalDigits.Int);

        var minValue = 0;
        var minValCurr = 0;
        var maxScaleValue;
        var maxScaleValueCurr;
        var isCurrency = false;
        var isNotCurrency = false;
        var sapUnit;
        var oVizPropertiesFeeds = [];
        var measureArr = [],
            dimensionArr = [];
        /*
            IMPORTANT - Temporary fix to add the color feed at runtime for column and vertical bullet custom charts
            This is a dirty fix and has to be taken care of.
        */
        if (
            (chartType === "column" || chartType === "bar" || chartType === "vertical_bullet") &&
            config.feeds &&
            config.feeds.length > 0
        ) {
            //First delete all the config properties that are unnecessary.
            //This is required as the config is picked up from the cache if available.
            var index;
            for (index = 0; index < config.feeds.length; index++) {
                if (config.feeds[index].uid === "color") {
                    config.feeds.splice(index, 1);
                    break;
                }
            }
            for (index = 0; index < config.feeds.length; index++) {
                if (config.feeds[index].uid === "categoryAxis") {
                    delete config.feeds[index].role;
                    break;
                }
            }
            if (oCardsModel.getProperty("/colorPalette")) {
                //Now add the properties required for the custom color charts
                for (index = 0; index < config.feeds.length; index++) {
                    if (config.feeds[index].uid === "categoryAxis") {
                        config.feeds[index].role = "Category";
                        break;
                    }
                }
                //Push color feed to the config for custom coloring to be applied against this feed.
                config.feeds.push({
                    uid: "color",
                    min: 1,
                    type: "dimension",
                    role: "Series"
                });
            }
        }

        each(config.feeds, function (i, feed) {
            var uid = feed.uid;
            var aFeedProperties = [];
            if (feed.type) {
                var iPropertiesLength, feedtype, propertyName;
                if (feed.type === "dimension") {
                    iPropertiesLength = aDimensions.length;
                    feedtype = "Dimension";
                    propertyName = "dimensions";
                    aQueuedProperties = aQueuedDimensions;
                    aPropertyWithoutRoles = aDimensionWithoutRoles;
                } else {
                    iPropertiesLength = aMeasures.length;
                    feedtype = "Measure";
                    propertyName = "measures";
                    aQueuedProperties = aQueuedMeasures;
                    aPropertyWithoutRoles = aMeasureWithoutRoles;
                }
                var min = 0,
                    max = iPropertiesLength;
                if (feed.min) {
                    min = min > feed.min ? min : feed.min;
                }
                if (feed.max) {
                    max = max < feed.max ? max : feed.max;
                }
                /* If no roles configured - add the property to feed */
                if (!feed.role) {
                    var len = aQueuedProperties.length;
                    for (var j = 0; j < len && aFeedProperties.length < max; ++j) {
                        var val = aQueuedProperties[j];
                        aQueuedProperties.splice(j, 1);
                        --len;
                        --j;
                        aFeedProperties.push(val);
                        if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency]) {
                            //as part of supporting V4 annotation
                            sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                : undefined;
                        } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit]) {
                            sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                : undefined;
                        } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY]) {
                            sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY];
                        }

                        if (Utils.isMeasureCurrency(oMetadata, sapUnit)) {
                            isCurrency = true;
                        } else {
                            isNotCurrency = true;
                        }

                        if (!isCurrency) {
                            minValue = Utils.checkNumberFormat(minValue, val, entityTypeObject);
                            maxScaleValue = Utils.getMaxScaleFactor(maxScaleValue, val, entityTypeObject);
                        } else {
                            minValCurr = Utils.checkNumberFormat(minValCurr, val, entityTypeObject);
                            maxScaleValueCurr = Utils.getMaxScaleFactor(maxScaleValueCurr, val, entityTypeObject);
                        }
                    }
                } else {
                    var rolesByPrio = feed.role.split("|");
                    each(rolesByPrio, function (j, role) {
                        if (aFeedProperties.length === max) {
                            return false;
                        }
                        var len = aQueuedProperties.length;
                        for (var k = 0; k < len && aFeedProperties.length < max; ++k) {
                            var val = aQueuedProperties[k];
                            if (
                                val &&
                                val.Role &&
                                val.Role.EnumMember &&
                                val.Role.EnumMember.split("/") &&
                                val.Role.EnumMember.split("/")[1]
                            ) {
                                var annotationRole = val.Role.EnumMember.split("/")[1];
                                if (annotationRole === role) {
                                    aQueuedProperties.splice(k, 1);
                                    --len;
                                    --k;
                                    aFeedProperties.push(val);
                                    if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency]) {
                                        //as part of supporting V4 annotation
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                            ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                            : undefined;
                                    } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit]) {
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                            ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                            : undefined;
                                    } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY]) {
                                        sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY];
                                    }
                                    if (Utils.isMeasureCurrency(oMetadata, sapUnit)) {
                                        isCurrency = true;
                                    } else {
                                        isNotCurrency = true;
                                    }

                                    if (!isCurrency) {
                                        minValue = Utils.checkNumberFormat(minValue, val, entityTypeObject);
                                        maxScaleValue = Utils.getMaxScaleFactor(maxScaleValue, val, entityTypeObject);
                                    } else {
                                        minValCurr = Utils.checkNumberFormat(minValCurr, val, entityTypeObject);
                                        maxScaleValueCurr = Utils.getMaxScaleFactor(
                                            maxScaleValueCurr,
                                            val,
                                            entityTypeObject
                                        );
                                    }
                                }
                            } else if (
                                (aPropertyWithoutRoles
                                    ? Array.prototype.indexOf.call(aPropertyWithoutRoles, val) : -1) === -1
                            ) {
                                aPropertyWithoutRoles.push(val);
                            }
                        }
                    });
                    if (aFeedProperties.length < max) {
                        each(aPropertyWithoutRoles, function (k, val) {
                            /* defaultRole is the fallback role */
                            var defaultRole;
                            var index;
                            if (
                                (defaultRole = config[propertyName].defaultRole) &&
                                (rolesByPrio ? Array.prototype.indexOf.call(rolesByPrio, defaultRole) : -1) !== -1 &&
                                (index = (aQueuedProperties ? Array.prototype.indexOf.call(aQueuedProperties, val) : -1) !== -1)
                            ) {
                                aQueuedProperties.splice(index, 1);
                                aFeedProperties.push(val);
                                if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency]) {
                                    //as part of supporting V4 annotation
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                        ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_ISOCurrency].Path
                                        : undefined;
                                } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit]) {
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                        ? oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY_V4_Unit].Path
                                        : undefined;
                                } else if (oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY]) {
                                    sapUnit = oMetadata[val[feedtype].PropertyPath][mAnnotationConstants.UNIT_KEY];
                                }
                                if (Utils.isMeasureCurrency(oMetadata, sapUnit)) {
                                    isCurrency = true;
                                } else {
                                    isNotCurrency = true;
                                }

                                if (!isCurrency) {
                                    minValue = Utils.checkNumberFormat(minValue, val, entityTypeObject);
                                    maxScaleValue = Utils.getMaxScaleFactor(maxScaleValue, val, entityTypeObject);
                                } else {
                                    minValCurr = Utils.checkNumberFormat(minValCurr, val, entityTypeObject);
                                    maxScaleValueCurr = Utils.getMaxScaleFactor(maxScaleValueCurr, val, entityTypeObject);
                                }

                                if (aFeedProperties.length === max) {
                                    return false;
                                }
                            }
                        });
                    }
                    if (aFeedProperties.length < min) {
                        oLogger.error(
                            mErrorMessages.CARD_ERROR +
                            mErrorMessages.MIN_FEEDS +
                            chartType +
                            " " +
                            mErrorMessages.FEEDS_OBTAINED +
                            aFeedProperties.length +
                            " " +
                            mErrorMessages.FEEDS_REQUIRED +
                            min +
                            " " +
                            mErrorMessages.FEEDS
                        );
                        return false;
                    }
                }
                if (aFeedProperties.length) {
                    var aFeeds = [];
                    var dataset;
                    if (!(dataset = vizFrame.getDataset())) {
                        oLogger.error(mErrorMessages.NO_DATASET);
                        return false;
                    }
                    oGlobalEntityType = entityTypeObject;
                    each(aFeedProperties, function (i, val) {
                        if (!val || !val[feedtype] || !val[feedtype].PropertyPath) {
                            oLogger.error(mErrorMessages.INVALID_CHART_ANNO);
                            return false;
                        }
                        var property = val[feedtype].PropertyPath;
                        var feedName = property;
                        var textColumn = property;
                        var edmType = null;
                        if (oMetadata && oMetadata[property]) {
                            if (oMetadata[property][mAnnotationConstants.LABEL_KEY_V4]) {
                                //as part of supporting V4 annotation
                                if (oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].String) {
                                    feedName = VizAnnotationManagerHelper.getLabelFromAnnotationPath(
                                        oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].String,
                                        vizFrame,
                                        oMetadata
                                    );
                                } else if (oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].Path) {
                                    feedName = oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].Path;
                                } else {
                                    feedName = property; //Fallback on the technical name in case sap:label is not maintained in the desired language
                                }
                            } else if (oMetadata[property][mAnnotationConstants.LABEL_KEY]) {
                                feedName = oMetadata[property][mAnnotationConstants.LABEL_KEY];
                            } else if (property) {
                                feedName = property;
                            }
                            if (oMetadata[property][mAnnotationConstants.TEXT_KEY_V4]) {
                                //as part of supporting V4 annotation
                                textColumn = oMetadata[property][mAnnotationConstants.TEXT_KEY_V4].String
                                    ? oMetadata[property][mAnnotationConstants.TEXT_KEY_V4].String
                                    : oMetadata[property][mAnnotationConstants.TEXT_KEY_V4].Path;
                            } else if (oMetadata[property][mAnnotationConstants.TEXT_KEY]) {
                                textColumn = oMetadata[property][mAnnotationConstants.TEXT_KEY];
                            } else if (property) {
                                textColumn = property;
                            }
                            edmType = oMetadata[property][mAnnotationConstants.TYPE_KEY] || null;
                        }
                        var displayBindingPath,
                            oDimensionMap = {};
                        oDimensionMap[property] = textColumn;
                        if (
                            (edmType === "Edm.DateTime" || edmType === "Edm.DateTimeOffset") &&
                            textColumn === property
                        ) {
                            displayBindingPath =
                                "{path:'" +
                                property +
                                "', formatter: 'sap.ovp.cards.charts.VizAnnotationManager.returnDateFormat'}";
                        } else {
                            //Check if there's a text arrangement annotation
                            if (
                                oMetadata[property] &&
                                oMetadata[property][mAnnotationConstants.TEXT_KEY_V4] &&
                                oMetadata[property][mAnnotationConstants.TEXT_KEY_V4][mAnnotationConstants.TEXT_ARRANGEMENT_ANNO]
                            ) {
                                var oTextArrangement, sTextArrangementType;
                                //Once you find the text for text arrangement, you need to get the text arrangement type
                                //Text Arrangement annotation can be defined in three ways - Property Level, Text Level or Entity Level

                                //Priority 1 - Property Level
                                oTextArrangement = oMetadata[property][mAnnotationConstants.TEXT_ARRANGEMENT_ANNO];
                                sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;

                                //Priority 2 - Text Level
                                if (!sTextArrangementType) {
                                    oTextArrangement = oMetadata[property][mAnnotationConstants.TEXT_KEY_V4][mAnnotationConstants.TEXT_ARRANGEMENT_ANNO];
                                    sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
                                }

                                //Priority 3 - Entity Level
                                if (!sTextArrangementType) {
                                    var oEntityType = oGlobalEntityType;
                                    oTextArrangement = oEntityType && oEntityType[mAnnotationConstants.TEXT_ARRANGEMENT_ANNO];
                                    sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
                                }
                                var oMapPropText;
                                switch (sTextArrangementType) {
                                    //Possible cases are TextFirst, TextLast, TextOnly and TextSeperate. Currently we don't support TextSeperate
                                    case "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst":
                                        displayBindingPath = "{" + textColumn + "}" + " " + "(" + "{" + property + "}" + ")";
                                        if (bChartTypesForStableColors && aVizData.length) {
                                            oMapPropText = getPropertyTextColumnMap(property, textColumn, aVizData);
                                            for (var key in oMapPropText) {
                                                oMapPropText[key] = oMapPropText[key] + " " + "(" + key + ")";
                                            }
                                            aLegendTextArrangement[property] = oMapPropText;
                                        }
                                        break;
                                    case "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast":
                                        displayBindingPath = "{" + property + "}" + " " + "(" + "{" + textColumn + "}" + ")";
                                            if (bChartTypesForStableColors && aVizData.length) {
                                            oMapPropText = getPropertyTextColumnMap(property, textColumn, aVizData);
                                            for (var prop in oMapPropText) {
                                                oMapPropText[prop] = prop + " " + "(" + oMapPropText[prop] + ")";
                                            }
                                            aLegendTextArrangement[property] = oMapPropText;
                                        }
                                        break;
                                    case "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly":
                                        displayBindingPath = "{" + textColumn + "}";
                                        if (bChartTypesForStableColors && aVizData.length) {
                                            aLegendTextArrangement[property] = getPropertyTextColumnMap(property, textColumn, aVizData);
                                        }
                                        break;
                                    case "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeperate": //Currently we don't support Text Seperate, fallback to TextLast instead
                                        displayBindingPath = "{" + property + "}" + " " + "(" + "{" + textColumn + "}" + ")";
                                        break;
                                    default:
                                        displayBindingPath = "{" + property + "}";
                                        oDimensionMap[property] = property;
                                        break;
                                }
                            } else {
                                //If there is a Text annotation but no TextArrangement annotation, just show the corresponding property (Like it behaved earlier, before this feature)
                                displayBindingPath = "{" + textColumn + "}";
                            }
                            if (oCardsModel && oCardsModel.getProperty("/bInsightEnabled")) {
                                AnalyticalCardHelper.setDimensionPath(
                                    oCardsModel.getData().cardId,
                                    property,
                                    displayBindingPath
                                );
                            }
                        }
                        aFeeds.push(feedName);
                        if (feedtype === "Dimension") {
                            if (uid === "waterfallType") {
                                var dimensionDefinition = new DimensionDefinition({
                                    name: feedName,
                                    value: "{" + property + "}"
                                    //displayValue: displayBindingPath
                                });
                            } else {
                                var dimensionDefinition = new DimensionDefinition({
                                    name: feedName,
                                    value: "{" + property + "}",
                                    displayValue: displayBindingPath
                                });
                            }
                            var sapSemantics = oMetadata[property][mAnnotationConstants.SEMANTICS_KEY];
                            var isV4CalendarYear =
                                (oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYear"] && oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYear"].Bool) ||
                                (oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"] && oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"].Bool) ||
                                (oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"] && oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"].Bool) ||
                                (oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"] && oMetadata[property]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"].Bool);
                            if (
                                bSupportsTimeSemantics &&
                                (edmType === "Edm.DateTime" ||
                                    isV4CalendarYear ||
                                    edmType === "Edm.DateTimeOffset" ||
                                    (sapSemantics && sapSemantics.lastIndexOf("year", 0) === 0))
                            ) {
                                dimensionDefinition.setDataType("date");
                            }
                            dataset.addDimension(dimensionDefinition);
                            if ((dimensionArr ? Array.prototype.indexOf.call(dimensionArr, feedName) : -1) === -1) {
                                dimensionArr.push(feedName);
                            }
                        } else {
                            dataset.addMeasure(
                                new MeasureDefinition({
                                    name: feedName,
                                    value: "{" + property + "}"
                                })
                            );
                            if (
                                (measureArr ? Array.prototype.indexOf.call(measureArr, feedName) : -1) === -1 &&
                                uid != "bubbleWidth"
                            ) {
                                measureArr.push(feedName);
                            }
                        }
                    });
                    vizFrame.addFeed(
                        new FeedItem({
                            uid: uid,
                            type: feedtype,
                            values: aFeeds
                        })
                    );
                    if (uid === "categoryAxis") {
                        oVizProperties[uid] = {
                            title: {
                                visible: bHideAxisTitle ? false : true,
                                text: aFeeds.join(", ")
                            },
                            label: {
                                formatString: isCurrency ? "CURR" : "axisFormatter",
                                truncatedLabelRatio: 0.15
                            }
                        };
                    } else {
                        oVizProperties[uid] = {
                            title: {
                                visible: bHideAxisTitle ? false : true,
                                text: aFeeds.join(", ")
                            },
                            label: {
                                formatString: isCurrency ? "CURR" : "axisFormatter"
                            }
                        };
                    }

                    oVizPropertiesFeeds.push(oVizProperties[uid]);

                    if (config.hasOwnProperty("vizProperties")) {
                        var configi = 0;
                        var confignumberOfProperties = config.vizProperties.length;
                        var configpathToUse;
                        var configvalue;
                        for (; configi < confignumberOfProperties; configi++) {
                            if (config.vizProperties[configi].hasOwnProperty("value")) {
                                configvalue = config.vizProperties[configi].value;
                            }
                            if (config.vizProperties[configi].hasOwnProperty("path")) {
                                configpathToUse = config.vizProperties[configi].path.split(".");
                                var configlengthOfPathToUse = configpathToUse.length;
                                var configtmp, manifestTmp;
                                var configcurrent;
                                for (var configj = 0,
                                    configcurrent = configpathToUse[0],
                                    configtmp = oVizProperties,
                                    manifestTmp = chartProps;
                                    configj < configlengthOfPathToUse;
                                    ++configj
                                ) {
                                    if (configj === configlengthOfPathToUse - 1) {
                                        if (manifestTmp && manifestTmp.hasOwnProperty(configcurrent)) {
                                            //FIORITECHP1-5665 - Donut and Pie charts should be able to show numbers
                                            if (
                                                chartType === "donut" &&
                                                (manifestTmp[configcurrent] === "value" ||
                                                    manifestTmp[configcurrent] === "percentage")
                                            ) {
                                                configvalue = manifestTmp[configcurrent];
                                            } else if (chartType != "donut") {
                                                configvalue = manifestTmp[configcurrent];
                                            }
                                        }
                                        if (
                                            (bConsiderAnnotationScales && configcurrent != "adjustScale") ||
                                            (!bConsiderAnnotationScales && configcurrent === "adjustScale") ||
                                            (!bConsiderAnnotationScales && configcurrent != "adjustScale")
                                        ) {
                                            configtmp[configcurrent] = configvalue;
                                        }
                                        break;
                                    }
                                    configtmp[configcurrent] = configtmp[configcurrent] || {};
                                    configtmp = configtmp[configcurrent];
                                    if (manifestTmp) {
                                        manifestTmp[configcurrent] = manifestTmp[configcurrent] || {};
                                        manifestTmp = manifestTmp[configcurrent];
                                    }

                                    configcurrent = configpathToUse[configj + 1];
                                }
                            }
                        }
                    }
                    if (feed.hasOwnProperty("vizProperties")) {
                        var i = 0;
                        var numberOfProperties = feed.vizProperties.length;
                        var attributeValue;
                        var methodToUse;
                        var pathToUse;

                        for (; i < numberOfProperties; i++) {
                            if (feed.vizProperties[i].hasOwnProperty("method")) {
                                methodToUse = feed.vizProperties[i].method;

                                switch (methodToUse) {
                                    case "count":
                                        attributeValue = aFeeds.length;
                                        if (
                                            feed.vizProperties[i].hasOwnProperty("min") &&
                                            attributeValue <= feed.vizProperties[i].min
                                        ) {
                                            attributeValue = feed.vizProperties[i].min;
                                        } else if (
                                            feed.vizProperties[i].hasOwnProperty("max") &&
                                            attributeValue >= feed.vizProperties[i].max
                                        ) {
                                            attributeValue = feed.vizProperties[i].max;
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            } else if (feed.vizProperties[i].hasOwnProperty("value")) {
                                attributeValue = feed.vizProperties[i].value;
                            }
                            if (feed.vizProperties[i].hasOwnProperty("path")) {
                                pathToUse = feed.vizProperties[i].path.split(".");
                                var lengthOfPathToUse = pathToUse.length;
                                for (
                                    var j = 0, current = pathToUse[0], tmp = oVizProperties;
                                    j < lengthOfPathToUse;
                                    ++j
                                ) {
                                    if (j === lengthOfPathToUse - 1) {
                                        tmp[current] = attributeValue;
                                        break;
                                    }
                                    tmp[current] = tmp[current] || {};
                                    tmp = tmp[current];
                                    current = pathToUse[j + 1];
                                }
                            }
                        }
                    }
                }
            }
        });

        var feeds = vizFrame.getFeeds();
        if (
            config.properties &&
            config.properties.semanticPattern === true &&
            getMeasureDimCheck(feeds, chartType)
        ) {
            each(feeds, function (i, v) {
                if (
                    feeds[i].getType() === "Measure" &&
                    (feeds[i].getUid() === "valueAxis" || feeds[i].getUid() === "actualValues")
                ) {
                    var selectedValue;
                    each(aMeasures, function (index, value) {
                        var valueLabel = getSapLabel(value.Measure.PropertyPath, oMetadata);
                        if (valueLabel === feeds[i].getValues()[0]) {
                            selectedValue = checkForecastMeasure(value, entityTypeObject);
                            return false;
                        }
                    });
                    if (selectedValue) {
                        var actualMeasure = getSapLabel(selectedValue.Measure.PropertyPath, oMetadata);
                        var forecastMeasure =
                            entityTypeObject[selectedValue.DataPoint.AnnotationPath.substring(1)].ForecastValue.PropertyPath ||
                            entityTypeObject[selectedValue.DataPoint.AnnotationPath.substring(1)].ForecastValue.Path;
                        var forecastValue = getSapLabel(forecastMeasure, oMetadata);
                        var actualValue = OvpResources.getText("ACTUAL", [actualMeasure]);
                        var forecastValueName = OvpResources.getText("FORECAST", [forecastValue]);
                        oVizProperties.plotArea.dataPointStyle = {
                            rules: [
                                {
                                    dataContext: {
                                        MeasureNamesDimension: actualMeasure
                                    },
                                    properties: {
                                        color: "sapUiChartPaletteSequentialHue1Light1",
                                        lineType: "line",
                                        lineColor: "sapUiChartPaletteSequentialHue1Light1"
                                    },
                                    displayName: actualValue
                                },
                                {
                                    dataContext: {
                                        MeasureNamesDimension: forecastValue
                                    },
                                    properties: {
                                        color: "sapUiChartPaletteSequentialHue1Light1",
                                        lineType: "dotted",
                                        lineColor: "sapUiChartPaletteSequentialHue1Light1",
                                        pattern: "diagonalLightStripe"
                                    },
                                    displayName: forecastValueName
                                }
                            ]
                        };
                        vizFrame.getDataset().addMeasure(
                            new MeasureDefinition({
                                name: forecastValue,
                                value: "{" + forecastMeasure + "}"
                            })
                        );
                        var values = feeds[i].getValues();
                        values.push(forecastValue);
                        feeds[i].setValues(values);
                    }
                    return false;
                }
            });
        }

        var bColorRestriction = false;
        if (
            oColorPalette &&
            oColorPalette.dimensionSettings &&
            Object.keys(oColorPalette.dimensionSettings).length > 0
        ) {
            var aDimensionPaths = Object.keys(oColorPalette.dimensionSettings);
            for (var i = 0; i < aDimensionPaths.length; i++) {
                var sDimensionPath = aDimensionPaths[i];
                var oRules = oColorPalette.dimensionSettings[sDimensionPath];
                if (Object.keys(oRules).length > 10) {
                    bColorRestriction = true;
                    break;
                }
            }
        }

        if (
            bEnableStableColors &&
            bChartTypesForStableColors &&
            !bColorRestriction
        ) {
            var aChartDimensions = [];
            var bStableColoringByDimensionValue = true;
            for (var i = 0; i < aDimensions.length; i++) {
                var sChartDimension = aDimensions[i].Dimension.PropertyPath;
                aChartDimensions.push(sChartDimension);
            }
            for (var i = 0; i < aChartDimensions.length; i++) {
                var sDimensionPath = aChartDimensions[i];
                if (aDimensionPaths.indexOf(sDimensionPath) > -1) {
                    var oColorRules = oColorPalette.dimensionSettings[sDimensionPath];
                    var aDefinedRules = Object.keys(oColorRules);
                    var aColorRules = [];
                    for (var i = 0; i < aDefinedRules.length; i++) {
                        var oRule = oColorRules[aDefinedRules[i]];
                        aColorRules.push(oRule);
                    }
                    bStableColoringByDimensionValue =
                        bStableColoringByDimensionValue && aColorRules.every(_fnCheckColorNotDefined);
                }
            }

            if (bStableColoringByDimensionValue) {
                var aRules = [];
                for (var i = 0; i < aChartDimensions.length; i++) {
                    var sDimensionPath = aChartDimensions[i];
                    if (aDimensionPaths.indexOf(sDimensionPath) > -1) {
                        var oColorRules = oColorPalette.dimensionSettings[sDimensionPath];
                        var aDefinedRules = Object.keys(oColorRules);
                        var aColorRules = [];
                        for (var i = 0; i < aDefinedRules.length; i++) {
                            var oRule = oColorRules[aDefinedRules[i]];
                            aColorRules.push(oRule);
                        }
                        _sortColorsByIndex(aColorRules);

                        for (var j = 0; j < aColorRules.length; j++) {
                            var sDimensionValue = aColorRules[j].dimensionValue;
                            var sColor = aColorRules[j].color;
                            var oRule = {
                                properties: {
                                    color: sColor
                                }
                            };
                            oRule.dataContext = {};
                            var feedname = getFeednameByProperty(oMetadata, vizFrame, sDimensionPath);
                            oRule.dataContext[feedname] = sDimensionValue;
                            var sName = aLegendTextArrangement[sDimensionPath] ? aLegendTextArrangement[sDimensionPath][sDimensionValue] : sDimensionValue;
                            oRule.displayName = sName;
                            aRules.push(oRule);
                        }
                    }
                }
                oVizProperties.plotArea.dataPointStyle = oVizProperties.plotArea.dataPointStyle || {};
                oVizProperties.plotArea.dataPointStyle["rules"] = aRules;
            } else {
                var aRules = [];
                for (var i = 0; i < aChartDimensions.length; i++) {
                    var sDimensionPath = aChartDimensions[i];
                    if (aDimensionPaths.indexOf(sDimensionPath) > -1) {
                        var oColorRules = oColorPalette.dimensionSettings[sDimensionPath];
                        var aDefinedRules = Object.keys(oColorRules);
                        var aColorRules = [];
                        for (var i = 0; i < aDefinedRules.length; i++) {
                            var oRule = oColorRules[aDefinedRules[i]];
                            aColorRules.push(oRule);
                        }
                        _sortColorsByIndex(aColorRules);
                        var aDimensionsByOrder = aColorRules.map(_getDimensionValue);
                    }
                }
                oVizProperties.legend.order = function (m, n) {
                    var indexM = aDimensionsByOrder.indexOf(m);
                    var indexN = aDimensionsByOrder.indexOf(n);
                    return indexM > indexN ? 1 : -1;
                };
            }
        }

        if (
            config.properties &&
            config.properties.semanticPattern === true &&
            getMeasureDimCheck(feeds, chartType) &&
            vizFrame.getVizType() === "vertical_bullet"
        ) {
            each(feeds, function (i, v) {
                if (
                    feeds[i].getType() === "Measure" &&
                    (feeds[i].getUid() === "valueAxis" || feeds[i].getUid() === "actualValues")
                ) {
                    var selectedValue;
                    each(aMeasures, function (index, value) {
                        var valueLabel = getSapLabel(value.Measure.PropertyPath, oMetadata);
                        if (valueLabel === feeds[i].getValues()[0]) {
                            selectedValue = checkTargetMeasure(value, entityTypeObject);
                            return false;
                        }
                    });
                    if (selectedValue) {
                        //var actualMeasure = getSapLabel(selectedValue.Measure.PropertyPath, oMetadata);
                        var targetMeasure =
                            entityTypeObject[selectedValue.DataPoint.AnnotationPath.substring(1)].TargetValue
                                .PropertyPath ||
                            entityTypeObject[selectedValue.DataPoint.AnnotationPath.substring(1)].TargetValue.Path;
                        var targetValue = getSapLabel(targetMeasure, oMetadata);
                        /*var actualValue = OvpResources.getText("ACTUAL",[actualMeasure]);
                         var targetValueName = OvpResources.getText("FORECAST",[targetValue]);*/

                        vizFrame.getDataset().addMeasure(
                            new MeasureDefinition({
                                name: targetValue,
                                value: "{" + targetMeasure + "}"
                            })
                        );
                        /*var values = feeds[i].getValues();
                         values.push(targetValue);
                         feeds[i].setValues(values);*/
                        vizFrame.addFeed(
                            new FeedItem({
                                uid: "targetValues",
                                type: "Measure",
                                values: [targetValue]
                            })
                        );
                    }
                    return false;
                }
            });
        }

        if (isCurrency && isNotCurrency) {
            oLogger.warning(OvpResources.getText("Currency_non_currency_measure"));
        }

        //Applying the correct formatting for valueAxes as per the property type
        each(feeds, function (i, feed) {
            //Loop through available feeds for the chart
            //Only perform this task for measures
            var feedType = feed.getProperty("type");
            if (feedType === "Measure") {
                var aFeedValues = feed.getProperty("values");
                var isMeasureDecimal = true;
                var aFeedValueContexts = chartContext.MeasureAttributes.filter(function (measureAttr) {
                    return (
                        aFeedValues.indexOf(oMetadata[measureAttr[feedType]["PropertyPath"]][mAnnotationConstants.LABEL_KEY]) >= 0 ||
                        aFeedValues.indexOf(oMetadata[measureAttr[feedType]["PropertyPath"]][mAnnotationConstants.LABEL_KEY_V4]) >= 0
                    );
                });
                //Loop through the feedValues - these are properties of the entity set
                each(aFeedValueContexts, function (j, contextMeasure) {
                    //if any one property that is a measure is not of
                    //type Int32 or Int64, consider Decimal formatting for it
                    if (
                        checkEDMINT32Exists(oMetadata, contextMeasure, feedType) ||
                        checkEDMINT64Exists(oMetadata, contextMeasure, feedType)
                    ) {
                        isMeasureDecimal = false;
                    } else {
                        isMeasureDecimal = true;
                        //break once this condition is met
                        return false;
                    }
                });
                if (!isMeasureDecimal) {
                    oVizProperties[feed.getProperty("uid")]["label"]["allowDecimals"] = false;
                }
            }
        });

        var scaleUnit;

        if (maxScaleValueCurr === undefined) {
            maxScaleValueCurr = "";
        }

        if (maxScaleValue === undefined) {
            maxScaleValue = "";
        }

        if (isCurrency) {
            scaleUnit = getScaleUnit(maxScaleValueCurr, isCurrency);
        } else {
            scaleUnit = getScaleUnit(maxScaleValue, isCurrency);
        }

        if (handler) {
            handler.setScale(scaleUnit);
        }
        
        var sFormattedTitle = getFormattedChartTitle(measureArr, dimensionArr, sChartTitle);

        var fmtStr = "";

        //Applying NumberOfFractionalDigits per measure feed
        each(feeds, function (i, feed) {
            var feedFractionalDigits = "-1";
            var currentFeedType = feed.getProperty("type");
            //Looping through feeds
            if (currentFeedType === "Measure") {
                //Get the correct feed
                var oVizPropertiesFeed = oVizPropertiesFeeds.filter(function (singleFeed) {
                    var result = singleFeed["title"]["text"].split(",").filter(function (property) {
                        if (feed.getValues().indexOf(property.trim()) >= 0) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (result.length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (oVizPropertiesFeed && oVizPropertiesFeed.length) {
                    var aPropertiesLabels = feed.getValues();
                    if (aPropertiesLabels && aPropertiesLabels.length) {
                        //Get the correct property
                        each(aPropertiesLabels, function (i, propertyLabel) {
                            var trimmedPropertyLabel = propertyLabel.trim();
                            var currentMeasure = aMeasures.filter(function (measureObject) {
                                if (measureObject["Measure"] && measureObject["Measure"]["PropertyPath"]) {
                                    var measureProperty = measureObject["Measure"]["PropertyPath"];
                                    if (
                                        (oMetadata[measureProperty] && oMetadata[measureProperty][mAnnotationConstants.LABEL_KEY] === trimmedPropertyLabel) ||
                                        (oMetadata[measureProperty] && oMetadata[measureProperty][mAnnotationConstants.LABEL_KEY_V4] === trimmedPropertyLabel)
                                    ) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }
                            });

                            //Get the Datapoint annotation and corresponding fractional digits for the measure
                            if (currentMeasure && currentMeasure.length) {
                                var currentMeasureObject = currentMeasure[0];
                                //Fetch fractional digits only if the measure is not of Edm.Int32 or Edm.Int64
                                if (
                                    !checkEDMINT32Exists(oMetadata, currentMeasureObject, currentFeedType) &&
                                    !checkEDMINT64Exists(oMetadata, currentMeasureObject, currentFeedType)
                                ) {
                                    var currentMeasureDPPath = "";
                                    if (
                                        currentMeasureObject &&
                                        currentMeasureObject["DataPoint"] &&
                                        currentMeasureObject["DataPoint"]["AnnotationPath"] &&
                                        currentMeasureObject["DataPoint"]["AnnotationPath"]
                                    ) {
                                        currentMeasureDPPath =
                                            currentMeasureObject["DataPoint"]["AnnotationPath"] &&
                                            currentMeasureObject["DataPoint"]["AnnotationPath"].substring(1);
                                        if (currentMeasureDPPath != "") {
                                            var tempFractionalDigits;
                                            //Only overwrite the fractional digits for the feed if it is greater than the previous measure's NumberOfFractionalDigits
                                            tempFractionalDigits =
                                                entityTypeObject[currentMeasureDPPath] &&
                                                entityTypeObject[currentMeasureDPPath]["ValueFormat"] &&
                                                entityTypeObject[currentMeasureDPPath]["ValueFormat"]["NumberOfFractionalDigits"] &&
                                                entityTypeObject[currentMeasureDPPath]["ValueFormat"]["NumberOfFractionalDigits"]["Int"];
                                            feedFractionalDigits =
                                                tempFractionalDigits > feedFractionalDigits
                                                    ? tempFractionalDigits
                                                    : feedFractionalDigits;
                                        }
                                    }
                                } else {
                                    //If the datatype is Edm.Int32 or Edm.Int64
                                    feedFractionalDigits = feedFractionalDigits < "0" ? "0" : feedFractionalDigits;
                                }
                            }
                        });
                    }
                }

                if (
                    oVizPropertiesFeed &&
                    oVizPropertiesFeed[0] &&
                    oVizPropertiesFeed[0].label &&
                    oVizPropertiesFeed[0].label.formatString
                ) {
                    var formatStr = oVizPropertiesFeed[0].label.formatString;
                }
                fmtStr = "";
                if (isCurrency) {
                    if (formatStr === "CURR") {
                        fmtStr = "CURR/" + feedFractionalDigits.toString() + "/"; // + maxScaleValueCurr.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
                    } else {
                        fmtStr = "axisFormatter/" + feedFractionalDigits.toString() + "/"; // + maxScaleValueCurr.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
                    }
                } else {
                    fmtStr = "axisFormatter/" + feedFractionalDigits.toString() + "/"; // + maxScaleValue.toString(); //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
                }
                if (oVizPropertiesFeed && oVizPropertiesFeed[0]) {
                    oVizPropertiesFeed[0].label.formatString = fmtStr;
                }
            }
        });

        if (chartType === "vertical_bullet") {
            oVizProperties["valueAxis"] = {
                title: {
                    visible: bHideAxisTitle ? false : true
                },
                label: {
                    formatString: fmtStr
                }
            };
        }

        var finalMinValue = "";
        var chartFmtStr = "";
        if (isCurrency) {
            finalMinValue = minValCurr.toString();
            chartFmtStr = "CURR/" + minValCurr.toString() + "/";
        } else {
            finalMinValue = minValue.toString();
            chartFmtStr = "axisFormatter/" + minValue.toString() + "/";
        }

        if (chartType === "donut" || bShowDataLabel) {
            oVizProperties.plotArea.dataLabel.formatString = chartFmtStr;
            if (oVizProperties.plotArea.dataLabel.type === "percentage") {
                oVizProperties.plotArea.dataLabel.formatString = "0.0%/" + finalMinValue + "/";
            }
        }

        _checkRolesForProperty(aQueuedDimensions, config, "dimension");
        _checkRolesForProperty(aQueuedMeasures, config, "measure");

        //updating levels for timeAxis vizproperty
        if (bSupportsTimeSemantics) {
            var timeDimension = aDimensions[0].Dimension.PropertyPath;
            //Support for V4 annotations
            if (oMetadata[timeDimension][mAnnotationConstants.SEMANTICS_KEY] === "yearmonth" || oMetadata[timeDimension]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
                oVizProperties.timeAxis.levels = ["year", "month"];
            } else if (oMetadata[timeDimension][mAnnotationConstants.SEMANTICS_KEY] === "yearquarter" || oMetadata[timeDimension]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
                oVizProperties.timeAxis.levels = ["year", "quarter"];
            } else if (oMetadata[timeDimension][mAnnotationConstants.SEMANTICS_KEY] === "yearweek" || oMetadata[timeDimension]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
                oVizProperties.timeAxis.levels = ["year", "week"];
            } else if (oMetadata[timeDimension][mAnnotationConstants.SEMANTICS_KEY] === "year" || oMetadata[timeDimension]["com.sap.vocabularies.Common.v1.IsCalendarYear"]) {
                oVizProperties.timeAxis.levels = ["year"];
            }
        }

        oVizProperties.title = {
            text: sChartTitle ? sChartTitle : sFormattedTitle,
            alignment: "left",
            layout: { respectPlotPosition: false },
            style: { 
                fontFamily: "72, 72full, Arial, Helvetica, sans-serif !important",
                fontSize: ".875rem",
                fontWeight: "normal"
            }
        };
        vizFrame.setVizProperties(oVizProperties);
        if (oCardsModel && oCardsModel.getProperty("/bInsightEnabled")) {
            var sKey = vizFrame && vizFrame.getId();
            var oVizPropertiesCopy = merge({}, oVizProperties);
            if (oDataPointStyleRulesCopy !== undefined) {
                oVizPropertiesCopy.plotArea.dataPointStyle = oDataPointStyleRulesCopy;
            }
            AnalyticalCardHelper.setVizPropertyMap(sKey, oVizPropertiesCopy);
        }
    }

    /**
    * This function return dimension / measure property to text property map for handling text arrangement.
    * @param {string} sProperty  The property specified in the dimension/measure.
    * @param {string} sTextColumn The textColumn property specified in TextArrangement.
    * @param {array} aVizData The array of VizData from the analytical model.
    * @returns {object} oVizResult  - mapped PropertTextColumn.
    */

    function getPropertyTextColumnMap(sProperty, sTextColumn, aVizData) {
        var oProprtyToTextMap = {};
        for (var i = 0; i < aVizData.length; i++) {
            var oVizData = aVizData[i];
            if (oVizData.hasOwnProperty(sProperty) && oVizData.hasOwnProperty(sTextColumn)) {
                oProprtyToTextMap[oVizData[sProperty]] = oVizData[sTextColumn];
            }
        }
        return oProprtyToTextMap;
    }

    /**
    * This function returns value of chart title
    * @param {object} oEntityType  EntityType object  
    * @param {string} sChartAnnotationPath The value of chart annotaion path
    * @param {object} oVizFrame 
    * @returns {string} sChartTitle  The value of chart title
    */

    function getChartTitle(oEntityType, sChartAnnotationPath, oVizFrame) {
        var sChartTitle = "";
        var oEntityTypeTitle = oEntityType && oEntityType[sChartAnnotationPath] && oEntityType[sChartAnnotationPath].Title;
        if (oEntityTypeTitle) {
            sChartTitle = oEntityTypeTitle.String;
        }
        return Utils.resolvei18nKeyToChartTitle(oVizFrame, sChartTitle);
    }

    function getFeednameByProperty(oMetadata, vizFrame, property) {
        var feedName = "";
        if (oMetadata && oMetadata[property]) {
            if (oMetadata[property][mAnnotationConstants.LABEL_KEY_V4]) {
                //as part of supporting V4 annotation
                feedName = VizAnnotationManagerHelper.getLabelFromAnnotationPath(
                    oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].String
                        ? oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].String
                        : oMetadata[property][mAnnotationConstants.LABEL_KEY_V4].Path,
                    vizFrame,
                    oMetadata
                );
            } else if (oMetadata[property][mAnnotationConstants.LABEL_KEY]) {
                feedName = oMetadata[property][mAnnotationConstants.LABEL_KEY];
            } else if (property) {
                feedName = property;
            }
        }
        return feedName;
    }

    function setChartUoMTitle(vizFrame, vizData) {
        if (vizFrame && (vizFrame.getVizType() === "bubble" || vizFrame.getVizType() === "scatter")) {
            return;
        }
        var oCardsModel, entityTypeObject, chartAnno, chartContext;
        var aMeasures;
        var unitKey = mAnnotationConstants.UNIT_KEY;
        var unitKey_v4_isoCurrency = mAnnotationConstants.UNIT_KEY_V4_ISOCurrency; //as part of supporting V4 annotation
        var unitKey_v4_unit = mAnnotationConstants.UNIT_KEY_V4_Unit; //as part of supporting V4 annotation
        var tmp;
        var measureList = [];

        if (!(oCardsModel = vizFrame.getModel("ovpCardProperties"))) {
            oLogger.error(
                mErrorMessages.CARD_ERROR + "in " + mErrorMessages.CARD_CONFIG + mErrorMessages.NO_CARD_MODEL
            );
            return;
        }

        var dataModel = vizFrame.getModel();
        var entitySet = oCardsModel.getProperty("/entitySet");
        if (!dataModel || !entitySet) {
            return;
        }
        entityTypeObject = oCardsModel.getProperty("/entityType");
        if (!entityTypeObject) {
            oLogger.error(mErrorMessages.CARD_ANNO_ERROR + "in " + mErrorMessages.CARD_ANNO);
            return;
        }
        var oMetadata = Utils.getMetadata(dataModel, entitySet);
        chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
        if (!chartAnno || !(chartContext = entityTypeObject[chartAnno])) {
            oLogger.error(mErrorMessages.CARD_ANNO_ERROR + "in " + mErrorMessages.CARD_ANNO);
            return;
        }

        if (!(aMeasures = chartContext.MeasureAttributes) || !aMeasures.length) {
            oLogger.error(
                mErrorMessages.CHART_ANNO_ERROR +
                "in " +
                mErrorMessages.CHART_ANNO +
                " " +
                mErrorMessages.MEASURES_MANDATORY
            );
            return;
        }

        each(aMeasures, function (i, m) {
            tmp = m.Measure.PropertyPath;
            if (m.DataPoint && m.DataPoint.AnnotationPath) {
                var datapointAnnotationPath = entityTypeObject[m.DataPoint.AnnotationPath.substring(1)];
                if (
                    datapointAnnotationPath.ForecastValue &&
                    (datapointAnnotationPath.ForecastValue.PropertyPath || datapointAnnotationPath.ForecastValue.Path)
                ) {
                    measureList.push(
                        datapointAnnotationPath.ForecastValue.PropertyPath ||
                        datapointAnnotationPath.ForecastValue.Path
                    );
                }
            }
            measureList.push(tmp);
        });

        var result = vizData ? vizData.results : null;
        var sUnitType = "";
        var bSetChartUoMTitle = true;
        var feedMeasures = [];

        var feeds = vizFrame.getFeeds();

        each(feeds, function (i, feed) {
            if (feed.getType() === "Measure") {
                feedMeasures = feedMeasures.concat(feed.getValues());
            }
        });

        if (result) {
            each(measureList, function (i, property) {
                var feedName = getFeednameByProperty(oMetadata, vizFrame, property);
                if ((feedMeasures ? Array.prototype.indexOf.call(feedMeasures, feedName) : -1) != -1) {
                    if (oMetadata && oMetadata[property]) {
                        var unitCode;
                        // if (unitCode && oMetadata[unitCode] && oMetadata[currCode][semanticKey] === currencyCode) {
                        if (oMetadata[property][unitKey_v4_isoCurrency]) {
                            //as part of supporting V4 annotation
                            unitCode = oMetadata[property][unitKey_v4_isoCurrency].Path
                                ? oMetadata[property][unitKey_v4_isoCurrency].Path
                                : oMetadata[property][unitKey_v4_isoCurrency].String;
                        } else if (oMetadata[property][unitKey_v4_unit]) {
                            unitCode = oMetadata[property][unitKey_v4_unit].Path
                                ? oMetadata[property][unitKey_v4_unit].Path
                                : oMetadata[property][unitKey_v4_unit].String;
                        } else if (oMetadata[property][unitKey]) {
                            unitCode = oMetadata[property][unitKey];
                        }
                        if (!unitCode) {
                            bSetChartUoMTitle = false;
                            return false;
                        }
                        if (unitCode && oMetadata[unitCode]) {
                            for (var i = 0; i < result.length; i++) {
                                var objData = result[i];
                                if (bSetChartUoMTitle) {
                                    if (
                                        sUnitType &&
                                        objData[unitCode] &&
                                        objData[unitCode] != "" &&
                                        sUnitType != "" &&
                                        sUnitType != objData[unitCode]
                                    ) {
                                        bSetChartUoMTitle = false;
                                        break;
                                    }
                                }
                                sUnitType = objData[unitCode];
                                if (!sUnitType) {
                                    bSetChartUoMTitle = false;
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }

        var chartUnitTitleTxt = "";

        if (bSetChartUoMTitle) {
            if (sUnitType != "") {
                chartUnitTitleTxt = OvpResources.getText("IN_NO_SCALE", [sUnitType]);
                chartUnitTitleTxt = " " + chartUnitTitleTxt;
            }

            //Also append it to the existing aria-label for VizFrame
            var labelForVizFrame = vizFrame.data("aria-label");
            if (labelForVizFrame && chartUnitTitleTxt && labelForVizFrame.indexOf(chartUnitTitleTxt) === -1) {
                var updatedLabelForVizFrame = labelForVizFrame + chartUnitTitleTxt;
                vizFrame.data("aria-label", updatedLabelForVizFrame, true);
            }
            var sVizFrameTitle = vizFrame.getVizProperties().title && vizFrame.getVizProperties().title.text;
            if (sVizFrameTitle) {
                var iIndexOfSeperator = sVizFrameTitle.indexOf('|');
                if (iIndexOfSeperator !== -1) {
                    var sPreviousUoM = sVizFrameTitle.slice(iIndexOfSeperator + 2);
                    if (sPreviousUoM !== sUnitType) {
                        sVizFrameTitle = sVizFrameTitle.slice(0, iIndexOfSeperator - 1);
                    }
                }
                var oVizProperties = {
                    title: {
                        visible: true,
                        text: sPreviousUoM === sUnitType ? sVizFrameTitle : sVizFrameTitle + chartUnitTitleTxt,
                        alignment: "left",
                        layout: { respectPlotPosition: false },
                        style: { 
                            fontFamily: "72, 72full, Arial, Helvetica, sans-serif !important",
                            fontSize: ".875rem",
                            fontWeight: "normal"
                        }
                    }
                };
                vizFrame.setVizProperties(oVizProperties);
            }
        }
    }

    function getFormattedChartTitle(measureArr, dimensionArr, sChartTitle) {
        var txt = "",
            measureStr = "",
            dimensionStr = "";
        if (sChartTitle) {
            txt = sChartTitle;
        }

        if (measureArr && measureArr.length > 1) {
            for (var i = 0; i < measureArr.length - 1; i++) {
                if (measureStr != "") {
                    measureStr += ", ";
                }
                measureStr += measureArr[i];
            }
            measureStr = OvpResources.getText("MEAS_DIM_TITLE", [measureStr, measureArr[i]]);
        } else if (measureArr) {
            measureStr = measureArr[0];
        }

        if (dimensionArr && dimensionArr.length > 1) {
            for (var i = 0; i < dimensionArr.length - 1; i++) {
                if (dimensionStr != "") {
                    dimensionStr += ", ";
                }
                dimensionStr += dimensionArr[i];
            }
            dimensionStr = OvpResources.getText("MEAS_DIM_TITLE", [dimensionStr, dimensionArr[i]]);
        } else if (dimensionArr) {
            dimensionStr = dimensionArr[0];
        }

        if (txt === "") {
            sChartTitle = OvpResources.getText("NO_CHART_TITLE", [measureStr, dimensionStr]);
        }
        return sChartTitle;
    }

    function getScaleUnit(maxScaleValue, isCurrency) {
        var num = 1;
        var scaledNum;
        if (isCurrency) {
            var currencyFormat = NumberFormat.getCurrencyInstance({
                style: "short",
                currencyCode: false,
                shortRefNumber: maxScaleValue
            });
            scaledNum = currencyFormat.format(Number(num));
        } else {
            var numberFormat = NumberFormat.getFloatInstance({
                style: "short",
                shortRefNumber: maxScaleValue
            });
            scaledNum = numberFormat.format(Number(num));
        }

        var scaleUnit = scaledNum.slice(-1);
        return scaleUnit;
    }

    function getSelectedDataPoint(vizFrame, controller) {
        vizFrame.attachSelectData(function (oEvent) {
            var sNavMode = OVPUtils.bCRTLPressed ? OVPUtils.constants.explace : OVPUtils.constants.inplace;
            OVPUtils.bCRTLPressed = false;

            var oCardsModel = vizFrame.getModel("ovpCardProperties");
            var dataModel = vizFrame.getModel();
            var entitySet = oCardsModel.getProperty("/entitySet");
            var oMetadata = Utils.getMetadata(dataModel, entitySet);
            var dimensionArrayNames = [],
                dimensions = [];
            var finalDimensions = {},
                aCustomContext = {};
            var dimensionsArr = vizFrame.getDataset().getDimensions();
            var contextNumber;

            for (var i = 0; i < dimensionsArr.length; i++) {
                dimensionArrayNames.push(dimensionsArr[i].getName());
            }

            var allData = vizFrame
                .getDataset()
                .getBinding("data")
                .getCurrentContexts()
                .map(function (x) {
                    return x.getObject();
                });

            if (
                oEvent.getParameter("data") &&
                oEvent.getParameter("data")[0] &&
                oEvent.getParameter("data")[0].data
            ) {
                dimensions = Object.keys(oEvent.getParameter("data")[0].data);
                contextNumber = oEvent.getParameter("data")[0].data._context_row_number;
                var oContext = vizFrame.getDataset().getBinding("data").getContexts()[contextNumber];
                var oNavigationField = 
                    NavigationHelper.getEntityNavigationEntries(
                        oContext, 
                        dataModel,
                        controller.getEntityType(),
                        controller.getCardPropertiesModel()
                    )[0];
                if (allData[contextNumber].$isOthers && allData[contextNumber].$isOthers === true) {
                    var aOtherNavigationDimension = {},
                        aFinalDimensions = [];
                    //get all dimensions which are shown
                    for (var j = 0; j < dimensionArrayNames.length; j++) {
                        for (var k = 0; k < dimensions.length; k++) {
                            if (dimensionArrayNames[j] === dimensions[k]) {
                                for (var key in oMetadata) {
                                    if (oMetadata.hasOwnProperty(key)) {
                                        var propertyName =
                                            oMetadata[key][mAnnotationConstants.LABEL_KEY] ||
                                            oMetadata[key][mAnnotationConstants.NAME_KEY] ||
                                            oMetadata[key][mAnnotationConstants.NAME_CAP_KEY];
                                        if (propertyName === dimensions[k]) {
                                            aFinalDimensions.push(key);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    //get all values of all dimensions which are shown
                    for (var i = 0; i < aFinalDimensions.length; i++) {
                        aOtherNavigationDimension[aFinalDimensions[i]] = [];
                        for (var j = 0; j < allData.length - 1; j++) {
                            if (j != contextNumber) {
                                aOtherNavigationDimension[aFinalDimensions[i]].push(
                                    allData[j][aFinalDimensions[i]]
                                );
                            }
                        }
                    }

                    var donutIntent = { $isOthers: true };
                    var payLoad = {
                        getObject: function () {
                            return donutIntent;
                        },
                        getOtherNavigationDimensions: function () {
                            return aOtherNavigationDimension;
                        }
                    };
                    if (OVPCardAsAPIUtils.checkIfAPIIsUsed(controller)) {
                        if (controller.checkAPINavigation()) {
                            //The function is only called when there is a valid semantic object and action is available
                            CommonUtils.onContentClicked(payLoad);
                        }
                    } else {
                        if (oNavigationField) {
                            controller.doNavigation(payLoad, oNavigationField, sNavMode);
                        }
                    }
                } else {
                    for (var j = 0; j < dimensionArrayNames.length; j++) {
                        for (var k = 0; k < dimensions.length; k++) {
                            if (dimensionArrayNames[j] === dimensions[k]) {
                                for (var key in oMetadata) {
                                    if (oMetadata.hasOwnProperty(key)) {
                                        var propertyName = (oMetadata[key][mAnnotationConstants.LABEL_KEY_V4] && oMetadata[key][mAnnotationConstants.LABEL_KEY_V4].String) ||
                                            oMetadata[key][mAnnotationConstants.LABEL_KEY] ||
                                            oMetadata[key][mAnnotationConstants.NAME_KEY] ||
                                            oMetadata[key][mAnnotationConstants.NAME_CAP_KEY];
                                        if (propertyName.match(/{@i18n>.+}/gi)) {
                                            //To also consider i18n string coming from Common.Label annotation
                                            var oRb = this.getModel("@i18n").getResourceBundle();
                                            propertyName = oRb.getText(propertyName.substring(propertyName.indexOf(">") + 1, propertyName.length - 1));
                                        }
                                        if (propertyName === dimensions[k]) {
                                            finalDimensions[key] = allData[contextNumber][key];
                                        }
                                    }
                                }
                            }
                            for (var key in allData[contextNumber]) {
                                if (oMetadata.hasOwnProperty(key)) {
                                    aCustomContext[key] = allData[contextNumber][key]; //aCustomContext will have all the data related to datapoint
                                }
                            }
                        }
                    }

                    //converting Date timeAxis dimension values back to Edm.String, if as per metadata, they are of type Edm.String
                    if (finalDimensions) {
                        each(Object.keys(finalDimensions), function (i, key) {
                            if (oMetadata[key]["type"] === "Edm.String") {
                                if (oMetadata[key]["sap:semantics"] === "yearmonth" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
                                    finalDimensions[key] = finalDimensions[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYMM" }).format(finalDimensions[key])
                                            : finalDimensions[key];
                                } else if (oMetadata[key]["sap:semantics"] === "yearquarter" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
                                    finalDimensions[key] = finalDimensions[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYQ" }).format(finalDimensions[key])
                                            : finalDimensions[key];
                                } else if (oMetadata[key]["sap:semantics"] === "yearweek" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
                                    finalDimensions[key] = finalDimensions[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYww" }).format(finalDimensions[key])
                                            : finalDimensions[key];
                                } else if (oMetadata[key]["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"] && oMetadata[key]["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"].Bool) {
                                    var sFiscalDate = finalDimensions[key];
                                    if (sFiscalDate.includes(".")) {
                                        finalDimensions[key] = sFiscalDate.split(".").reverse().join("");
                                    } else if (sFiscalDate.includes("/")) {
                                        finalDimensions[key] = sFiscalDate.split("/").reverse().join("");
                                    }
                                }
                            }
                        });
                    }

                    if (aCustomContext) {
                        each(Object.keys(aCustomContext), function (i, key) {
                            if (oMetadata[key]["type"] === "Edm.String") {
                                if (oMetadata[key]["sap:semantics"] === "yearmonth" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
                                    aCustomContext[key] = aCustomContext[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYMM" }).format(aCustomContext[key])
                                            : aCustomContext[key];
                                } else if (oMetadata[key]["sap:semantics"] === "yearquarter" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
                                    aCustomContext[key] = aCustomContext[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYQ" }).format(aCustomContext[key])
                                            : aCustomContext[key];
                                } else if (oMetadata[key]["sap:semantics"] === "yearweek" || oMetadata[key]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
                                    aCustomContext[key] = aCustomContext[key].constructor === Date
                                            ? DateFormat.getDateTimeInstance({ pattern: "YYYYww" }).format(aCustomContext[key])
                                            : aCustomContext[key];
                                } else if (oMetadata[key]["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"] && oMetadata[key]["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"].Bool) {
                                    var sFiscalDate = aCustomContext[key];
                                    if (sFiscalDate.includes(".")) {
                                        aCustomContext[key] = sFiscalDate.split(".").reverse().join("");
                                    } else if (sFiscalDate.includes("/")) {
                                        aCustomContext[key] = sFiscalDate.split("/").reverse().join("");
                                    }
                                }
                            }
                        });
                    }
                    
                    //Adding requestAtLeast Fields as the part of Navigation Params for analytical card
                    var oEntityType = oCardsModel.getProperty("/entityType"),
                        oPresentationVariant = oEntityType[oCardsModel.getProperty("/presentationAnnotationPath")];
                    if (oEntityType) {
                        var requestFields = CardAnnotationHelper.getRequestFields(oPresentationVariant);
                        if (requestFields && requestFields.length > 0) {
                            each(requestFields, function (i, r) {
                                if (!finalDimensions.hasOwnProperty(r)) {
                                    finalDimensions[r] = allData[contextNumber][r];
                                }
                            });
                        }
                    }

                    var payLoad = {
                        getObject: function () {
                            return finalDimensions;
                        },
                        //getAllData will allow the user to pass additional data using cutom navigation
                        getAllData: function () {
                            return aCustomContext;
                        }
                    };

                    if (OVPCardAsAPIUtils.checkIfAPIIsUsed(controller)) {
                        if (controller.checkAPINavigation()) {
                            //The function is only called when there is a valid semantic object and action is available
                            CommonUtils.onContentClicked(payLoad);
                        }
                    } else {
                        if (oNavigationField) {
                            controller.doNavigation(payLoad, oNavigationField, sNavMode);
                        }
                    }
                }
            }
        });
    }

    function checkBubbleChart(chartType) {
        return chartType.EnumMember.endsWith("Bubble");
    }

    function dimensionAttrCheck(dimensions) {
        var ret = false;
        if (
            !dimensions ||
            dimensions.constructor != Array ||
            dimensions.length < 1 ||
            dimensions[0].constructor != Object ||
            !dimensions[0].Dimension ||
            !dimensions[0].Dimension.PropertyPath
        ) {
            oLogger.error(mErrorMessages.CHART_ANNO_ERROR + "in " + mErrorMessages.CHART_ANNO + " " + mErrorMessages.DIMENSIONS_MANDATORY);
            return ret;
        }
        ret = true;
        return ret;
    }

    function measureAttrCheck(measures) {
        var ret = false;
        if (
            !measures ||
            measures.constructor != Array ||
            measures.length < 1 ||
            measures[0].constructor != Object ||
            !measures[0].Measure ||
            !measures[0].Measure.PropertyPath
        ) {
            oLogger.error(mErrorMessages.CHART_ANNO_ERROR + "in " + mErrorMessages.CHART_ANNO + " " + mErrorMessages.MEASURES_MANDATORY);
            return ret;
        }
        ret = true;
        return ret;
    }

    function getEntitySet(oEntitySet) {
        return oEntitySet.name;
    }

    /*
     * Method called upon resize of analytical card where the calculation is done to fetch more data-point
     * @method reprioritizeContent
     * @param {Object} newCardLayout - Card layout object which contains all resizing properties
     * @param {boolean} bODataV4
     * @param {Object} vizFrame - viz object
     */
    function reprioritizeContent(newCardLayout, vizFrame, bODataV4) {
        var oCardsModel = vizFrame.getModel("ovpCardProperties");
        var cardPropObject = Utils.getMaxItems(vizFrame, bODataV4);
        var maxItems = +cardPropObject.itemsLength;
        var dataStep = +oCardsModel.getProperty("/dataStep");
        if (maxItems && dataStep) {
            var colSpanOffset = newCardLayout.colSpan - 1;
            if (colSpanOffset >= 0) {
                maxItems += dataStep * colSpanOffset;
                updateBindingForAnalyticalCard(vizFrame, maxItems);
            }
        }
    }

    /*
     * Method to update the binding after resize if required
     * @method updateBindingForAnalyticalCard
     * @param {Object} vizFrame - viz object
     * @param {Integer} maxItems - no of datat-points to fetch
     */
    function updateBindingForAnalyticalCard(vizFrame, maxItems) {
        var newAggrBinding,
            newBinding = {},
            finalMeasures = [];
        var chartType = vizFrame.getVizType();
        var oCardsModel = vizFrame.getModel("ovpCardProperties");
        var entityTypeObject = oCardsModel.getProperty("/entityType");
        var chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
        var chartContext = entityTypeObject[chartAnno];
        var vizFrameParent = vizFrame.getParent();
        var dataBinding = vizFrameParent.getBinding("data");
        newBinding.path = dataBinding.getPath();
        newBinding.parameters = {};
        if (dataBinding.mParameters && dataBinding.mParameters.select) {
            newBinding.parameters.select = dataBinding.mParameters.select;
        }
        newBinding.parameters.custom = newBinding.parameters.custom || {};
        newBinding.parameters.custom._requestFrom = "ovp_internal";
        newBinding.filters = dataBinding.aApplicationFilters;
        newBinding.sorter = dataBinding.aSorters;
        newBinding.length = chartType === "donut" ? maxItems + 1 : maxItems; //(count-1)== maxItems? maxItems+1:maxItems;
        newBinding.template = new CoreElement();
        vizFrameParent.bindAggregation("data", newBinding);
        if (chartType === "donut") {
            each(chartContext.MeasureAttributes, function (i, m) {
                finalMeasures.push(m.Measure.PropertyPath);
            });
            newAggrBinding = {};
            newAggrBinding.path = dataBinding.getPath();
            newAggrBinding.parameters = {};
            newAggrBinding.parameters.select = finalMeasures.join(",");
            newAggrBinding.filters = dataBinding.aApplicationFilters;
            newAggrBinding.sorter = dataBinding.aSorters;
            newAggrBinding.length = 1; //(count-1)== maxItems? maxItems+1:maxItems;
            newAggrBinding.template = new CoreElement();
            vizFrameParent.bindAggregation("aggregateData", newAggrBinding);
        }
        vizFrameParent.updateBindingContext();
    }

    function _sortColorsByIndex(aColors) {
        aColors.sort(function (oRule1, oRule2) {
            if (oRule1.index < oRule2.index) {
                return -1;
            }
            if (oRule1.index > oRule2.index) {
                return 1;
            }
            return 0;
        });
    }

    function _fnCheckColorNotDefined(oColor) {
        return oColor.color !== undefined;
    }

    function _getDimensionValue(oRule) {
        return oRule.dimensionValue;
    }

    //The returned attributes can be used outside this file using namespace sap.ovp.cards.charts.SmartAnnotationManager
    return {
        constants: mAnnotationConstants,
        errorMessages: mErrorMessages,
        formatItems: formatItems,
        returnDateFormat: returnDateFormat,
        hideDateTimeAxis: hideDateTimeAxis,
        checkNoData: checkNoData,
        getChartType: getChartType,
        checkFlag: checkFlag,
        buildVizAttributes: buildVizAttributes,
        setChartUoMTitle: setChartUoMTitle,
        getSelectedDataPoint: getSelectedDataPoint,
        checkBubbleChart: checkBubbleChart,
        dimensionAttrCheck: dimensionAttrCheck,
        measureAttrCheck: measureAttrCheck,
        getEntitySet: getEntitySet,
        reprioritizeContent: reprioritizeContent,
        getChartTitle: getChartTitle,
        getNavigationPrefix: getNavigationPrefix,
        getAssociationKeys: getAssociationKeys,
        getSapLabel: getSapLabel,
        getMeasureDimCheck: getMeasureDimCheck,
        getPropertyTextColumnMap: getPropertyTextColumnMap,
        getScaleUnit: getScaleUnit,
        _sortColorsByIndex: _sortColorsByIndex,
        _checkRolesForProperty: _checkRolesForProperty
    };
}, /* bExport= */ true);