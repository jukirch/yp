/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * @fileOverview Miscellaneous utility functions for legacy cards.
 * See VizAnnotationManager.js for generic card methods.
 * This file can be safely deleted when legacy cards deprecate.
 */
sap.ui.define([
    "sap/base/util/each",
    "sap/base/util/merge",
    "sap/ovp/app/OVPLogger",
    "sap/ovp/cards/generic/base/analytical/config",
    "sap/ovp/cards/CommonUtils",
    "sap/base/util/isEmptyObject",
    "sap/ovp/cards/AnnotationHelper",
    "sap/ovp/cards/Constants",
    "sap/ui/core/format/NumberFormat"
], function (
    each,
    merge,
    OVPLogger,
    oConfig,
    CommonUtils,
    isEmptyObject,
    CardAnnotationHelper,
    CardConstants,
    NumberFormat
) {
    "use strict";

    var aSupportedDateSemantics = ["year", "yearweek", "yearmonth", "yearquarter"];

    var oUtils = {};
    /* All constants feature here */
    var mAnnotationConstants = merge({
        /* qualifiers for annotation terms */
        CHART_QUALIFIER_KEY: "chartAnnotationPath",
        SELVAR_QUALIFIER_KEY: "selectionAnnotationPath",
        PREVAR_QUALIFIER_KEY: "presentationAnnotationPath",
        /* DEBUG MESSAGES */
        ERROR_NO_CHART: 'Analytic cards require valid "chartAnnotationPath" ' + "configured in manifest.json",
        LABEL_KEY: "sap:label",
        TEXT_KEY: "sap:text",
        TYPE_KEY: "type"
    }, CardConstants.Annotations);

    var mErrorMessages = CardConstants.errorMessages;

    var oLogger = new OVPLogger("ovp.cards.generic.base.analytical.Utils");

    /* retrieve qualifier from iContext */
    function getQualifier(iContext, annoTerm) {
        /* see sap.ovp.cards.charts.Utils.constants for legal values of annoTerm */
        if (!annoTerm) {
            return "";
        }
        var settingsModel = iContext.getSetting("ovpCardProperties");
        if (!settingsModel) {
            return "";
        }
        var oSettings = settingsModel.oData;
        if (!oSettings) {
            return "";
        }
        var fullQualifier = oSettings && oSettings[annoTerm] ? oSettings[annoTerm] : "";
        return fullQualifier === "" ? "" : fullQualifier.split("#")[1];
    }

    /**
     * 
     * Returns the boolean value for the given input value
     * 
     * @param {object} oValue 
     * @param {boolean} bDefault 
     * @returns {boolean}
     */
    function getBooleanValue(oValue, bDefault) {
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
    }

    /**
     * Retrives number value from given object value, handles legend case differently.
     * 
     * @param {object} oValue 
     * @param {boolean} isLegend
     * @returns {number}
     */
    function getNumberValue(oValue, isLegend) {
        var value;
        if (oValue) {
            if (oValue.String) {
                value = Number(oValue.String);
            } else if (oValue.Int) {
                value = Number(oValue.Int);
            } else if (oValue.Decimal) {
                value = Number(oValue.Decimal);
            } else if (oValue.Double) {
                value = Number(oValue.Double);
            } else if (oValue.Single) {
                value = Number(oValue.Single);
            }
        }
        if (isLegend) {
            var numberFormat = NumberFormat.getFloatInstance({
                style: "short",
                minFractionDigits: 2,
                maxFractionDigits: 2
            });
            if (value) {
                value = numberFormat.format(Number(value));
            }
        }
        return value;
    }

    /************************ FORMATTERS ************************/
    /* Returns column name that contains the sap:text(s) for all properties in the metadata*/
    oUtils.getAllColumnTexts = function (entityTypeObject) {
        return getAllColumnProperties("sap:text", entityTypeObject);
    };

    oUtils.formDimensionPath = function (dimension) {
        var ret = "{" + dimension + "}";
        var entityTypeObject = this.getModel("ovpCardProperties").getProperty("/entityType");
        if (!entityTypeObject) {
            return ret;
        }
        var edmTypes = getEdmTypeOfAll(entityTypeObject);
        if (!edmTypes || !edmTypes[dimension]) {
            return ret;
        }
        var type = edmTypes[dimension];
        if (type == "Edm.DateTime") {
            return "{path:'" + dimension + "', formatter: 'sap.ovp.cards.charts.VizAnnotationManager.returnDateFormat'}";
        }
        var columnTexts = oUtils.getAllColumnTexts(entityTypeObject);
        if (!columnTexts) {
            return ret;
        }
        ret = "{" + (columnTexts[dimension] || dimension) + "}";
        return ret;
    };

    /************************ METADATA PARSERS ************************/

    /* Returns the set of all properties in the metadata */
    function getAllColumnProperties(prop, entityTypeObject) {
        var finalObject = {};
        var properties = entityTypeObject.property;
        for (var i = 0, len = properties.length; i < len; i++) {
            if (properties[i].hasOwnProperty(prop) && prop == "com.sap.vocabularies.Common.v1.Label") {
                finalObject[properties[i].name] = properties[i][prop].String;
            } else if (properties[i].hasOwnProperty(prop)) {
                finalObject[properties[i].name] = properties[i][prop];
            } else {
                finalObject[properties[i].name] = properties[i].name;
            }
        }
        return finalObject;
    }

    /* Returns column name that contains the sap:label(s) for all properties in the metadata*/
    function getAllColumnLabels(entityTypeObject) {
        return getAllColumnProperties("com.sap.vocabularies.Common.v1.Label", entityTypeObject);
    }

    /* get EdmType of all properties from $metadata */
    function getEdmTypeOfAll(entityTypeObject) {
        return getAllColumnProperties("type", entityTypeObject);
    }

    /************************ Line Chart functions ************************/

    var categoryAxisFeedList = {};

    oUtils.LineChart = (function () {
        function getVizProperties(iContext, dimensions, measures) {
            var rawValueAxisTitles = getValueAxisFeed(iContext, measures).split(",");
            var rawCategoryAxisTitles = getCategoryAxisFeed(iContext, dimensions).split(",");
            var valueAxisTitles = [];
            each(rawValueAxisTitles, function (i, m) {
                valueAxisTitles.push(m);
            });
            var categoryAxisTitles = [];
            each(rawCategoryAxisTitles, function (i, d) {
                categoryAxisTitles.push(d);
            });
            var bDatapointNavigation = true;
            var dNav = iContext.getSetting("ovpCardProperties").getProperty("/navigation");
            if (dNav == "chartNav") {
                bDatapointNavigation = false;
            }
            var bDatapointNavigation = bDatapointNavigation ? false : true;
            return (
                "{ valueAxis:{  layout: { maxWidth : 0.4 }, title:{   visible:false,   text: '" +
                valueAxisTitles.join(",") +
                "'  },  label:{   formatString:'axisFormatter'  } }, categoryAxis:{  title:{   visible:false,   text: '" +
                categoryAxisTitles.join(",") +
                "'  },  label:{   formatString:'axisFormatter'  } }, legend: {  isScrollable: false }, title: {  visible: false }, general: { groupData: false }, interaction:{  noninteractiveMode: " +
                bDatapointNavigation +
                ",  selectability: {   legendSelection: false,   axisLabelSelection: false,   mode: 'EXCLUSIVE',   plotLassoSelection: false,   plotStdSelection: true  }, zoom:{   enablement: 'disabled'} } }"
            );
        }
        getVizProperties.requiresIContext = true;

        function getValueAxisFeed(iContext, measures) {
            var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
            if (!entityTypeObject) {
                return "";
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var ret = [];
            each(measures, function (i, m) {
                ret.push(columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath);
            });
            return ret.join(",");
        }
        getValueAxisFeed.requiresIContext = true;

        function getCategoryAxisFeed(iContext, dimensions) {
            var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
            if (!entityTypeObject) {
                return "";
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var ret = [];
            var qualifier;
            var feedValue;
            each(dimensions, function (i, d) {
                if (d.Role.EnumMember.split("/")[1] === "Category") {
                    feedValue = columnLabels[d.Dimension.PropertyPath];
                    ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
                }
            });
            /*
             * If no dimensions are given as category, pick first dimension as category
             * (see Software Design Description UI5 Chart Control 3.1.2.2.1.1)
             */
            if (ret.length < 1) {
                feedValue = columnLabels[dimensions[0].Dimension.PropertyPath];
                ret.push(feedValue ? feedValue : dimensions[0].Dimension.PropertyPath);
            }
            qualifier = getQualifier(iContext, mAnnotationConstants.CHART_QUALIFIER_KEY);
            categoryAxisFeedList[qualifier] = ret;
            return ret.join(",");
        }
        getCategoryAxisFeed.requiresIContext = true;

        function getColorFeed(iContext, dimensions) {
            var ret = [];
            var qualifier;
            var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
            if (!entityTypeObject) {
                return "";
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var feedValue;
            each(dimensions, function (i, d) {
                if (d.Role.EnumMember.split("/")[1] === "Series") {
                    feedValue = columnLabels[d.Dimension.PropertyPath];
                    ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
                }
            });
            /*
             * If the dimensions is picked up for category feed as no category is given in the annotation,
             * remove it from color feed.
             * (see Software Design Description UI5 Chart Control 3.1.2.2.1.1)
             */
            qualifier = getQualifier(iContext, mAnnotationConstants.CHART_QUALIFIER_KEY);
            ret = ret.filter(function (value) {
                if (!categoryAxisFeedList[qualifier]) {
                    return true;
                }
                return value !== categoryAxisFeedList[qualifier][0];
            });
            return ret.join(",");
        }
        getColorFeed.requiresIContext = true;

        function testColorFeed(iContext, dimensions) {
            return getColorFeed(iContext, dimensions) !== "";
        }
        testColorFeed.requiresIContext = true;

        return {
            getVizProperties: getVizProperties,
            getValueAxisFeed: getValueAxisFeed,
            getCategoryAxisFeed: getCategoryAxisFeed,
            getColorFeed: getColorFeed,
            testColorFeed: testColorFeed
        };
    })();

    /************************ Bubble Chart Functions ************************/

    oUtils.BubbleChart = (function () {
        function getVizProperties(iContext, dimensions, measures) {
            var rawValueAxisTitles = getValueAxisFeed(iContext, measures).split(",");
            var rawValueAxis2Titles = getValueAxis2Feed(iContext, measures).split(",");
            var valueAxisTitles = [];
            each(rawValueAxisTitles, function (i, m) {
                valueAxisTitles.push(m);
            });
            var valueAxis2Titles = [];
            each(rawValueAxis2Titles, function (i, m) {
                valueAxis2Titles.push(m);
            });
            var bDatapointNavigation = true;
            var dNav = iContext.getSetting("ovpCardProperties").getProperty("/navigation");
            if (dNav == "chartNav") {
                bDatapointNavigation = false;
            }
            var bDatapointNavigation = bDatapointNavigation ? false : true;

            return (
                "{ valueAxis:{  layout: { maxWidth : 0.4 }, title:{ visible:true, text: '" +
                valueAxisTitles.join(",") +
                "'  },  label:{ formatString:'axisFormatter'  } }, valueAxis2:{  title:{ visible:true, text: '" +
                valueAxis2Titles.join(",") +
                "'  },  label:{ formatString:'axisFormatter'  } }, categoryAxis:{  title:{ visible:true  },  label:{ formatString:'axisFormatter'  } }, legend: {  isScrollable: false }, title: {  visible: false }, interaction:{  noninteractiveMode: " +
                bDatapointNavigation +
                ",  selectability: { legendSelection: false, axisLabelSelection: false, mode: 'EXCLUSIVE', plotLassoSelection: false, plotStdSelection: true  }, zoom:{   enablement: 'disabled'} } }"
            );
        }
        getVizProperties.requiresIContext = true;

        function getMeasurePriorityList(iContext, measures) {
            /* (see Software Design Description UI5 Chart Control - Bubble Chart) */
            var ovpCardPropertiesModel;
            if (!iContext || !iContext.getSetting || !(ovpCardPropertiesModel = iContext.getSetting("ovpCardProperties"))) {
                return [""];
            }
            var entityTypeObject = ovpCardPropertiesModel.getProperty("/entityType");
            if (!entityTypeObject) {
                return [""];
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var ret = [null, null, null];
            var axisList = ["Axis1", "Axis2", "Axis3"];
            each(measures, function (i, m) {
                if (axisList.indexOf(m.Role.EnumMember.split("/")[1]) > -1) {
                    if (ret[0] === null) {
                        ret[0] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
                    } else if (ret[1] === null) {
                        ret[1] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
                    } else if (ret[2] == null) {
                        ret[2] = columnLabels[m.Measure.PropertyPath] || m.Measure.PropertyPath;
                    }
                }
            });
            return ret;
        }
        getMeasurePriorityList.requiresIContext = true;

        function getValueAxisFeed(iContext, measures) {
            return getMeasurePriorityList(iContext, measures)[0];
        }
        getValueAxisFeed.requiresIContext = true;

        function getValueAxis2Feed(iContext, measures) {
            return getMeasurePriorityList(iContext, measures)[1];
        }
        getValueAxis2Feed.requiresIContext = true;

        function getBubbleWidthFeed(iContext, measures) {
            return getMeasurePriorityList(iContext, measures)[2];
        }
        getBubbleWidthFeed.requiresIContext = true;

        function getColorFeed(iContext, dimensions) {
            var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
            if (!entityTypeObject) {
                return "";
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var ret = [];
            var feedValue;
            each(dimensions, function (i, d) {
                if (d.Role.EnumMember.split("/")[1] === "Series") {
                    feedValue = columnLabels[d.Dimension.PropertyPath];
                    ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
                }
            });
            return ret.join(",");
        }
        getColorFeed.requiresIContext = true;

        function getShapeFeed(iContext, dimensions) {
            var entityTypeObject = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
            if (!entityTypeObject) {
                return "";
            }
            var columnLabels = getAllColumnLabels(entityTypeObject);
            var ret = [];
            var feedValue;
            each(dimensions, function (i, d) {
                if (d.Role.EnumMember.split("/")[1] === "Category") {
                    feedValue = columnLabels[d.Dimension.PropertyPath];
                    ret.push(feedValue ? feedValue : d.Dimension.PropertyPath);
                }
            });
            return ret.join(",");
        }
        getShapeFeed.requiresIContext = true;

        function testColorFeed(iContext, dimensions) {
            return getColorFeed(iContext, dimensions) !== "";
        }
        testColorFeed.requiresIContext = true;

        function testShapeFeed(iContext, dimensions) {
            return getShapeFeed(iContext, dimensions) !== "";
        }
        testShapeFeed.requiresIContext = true;

        return {
            getVizProperties: getVizProperties,
            getMeasurePriorityList: getMeasurePriorityList,
            getValueAxisFeed: getValueAxisFeed,
            getValueAxis2Feed: getValueAxis2Feed,
            getBubbleWidthFeed: getBubbleWidthFeed,
            getColorFeed: getColorFeed,
            getShapeFeed: getShapeFeed,
            testColorFeed: testColorFeed,
            testShapeFeed: testShapeFeed
        };
    })();

    oUtils.validateMeasuresDimensions = function (vizFrame, type) {
        var measuresArr = null;
        var dimensionsArr = null;
        if (!vizFrame.getDataset()) {
            oLogger.error("OVP-AC: " + type + " Card Error: No Dataset defined for chart.");
            return false;
        }
        measuresArr = vizFrame.getDataset().getMeasures();
        dimensionsArr = vizFrame.getDataset().getDimensions();

        switch (type) {
            case "Bubble":
                if (
                    measuresArr.length !== 3 ||
                    dimensionsArr.length < 1 ||
                    !measuresArr[0].getName() ||
                    !measuresArr[1].getName() ||
                    !measuresArr[2].getName() ||
                    !dimensionsArr[0].getName()
                ) {
                    oLogger.error("OVP-AC: Bubble Card Error: Enter exactly 3 measures and at least 1 dimension.");
                    return false;
                }
                break;

            case "Donut":
                if (
                    measuresArr.length !== 1 ||
                    dimensionsArr.length !== 1 ||
                    !measuresArr[0].getName() ||
                    !dimensionsArr[0].getName()
                ) {
                    oLogger.error("OVP-AC: Donut Card Error: Enter exactly 1 measure and 1 dimension.");
                    return false;
                }
                break;

            case "Line":
                if (measuresArr.length < 1 || dimensionsArr.length < 1 || !measuresArr[0].getName() || !dimensionsArr[0].getName()) {
                    oLogger.error("OVP-AC: Line Card Error: Configure at least 1 dimensions and 1 measure.");
                    return false;
                }
                break;
        }
        return true;
    };

    oUtils.getSortAnnotationCollection = function (dataModel, presentationVariant, entitySet) {
        if (
            presentationVariant &&
            presentationVariant.SortOrder &&
            presentationVariant.SortOrder.Path &&
            presentationVariant.SortOrder.Path.indexOf("@") >= 0
        ) {
            var sSortOrderPath = presentationVariant.SortOrder.Path.split("@")[1];
            var oAnnotationData = dataModel.getServiceAnnotations()[entitySet.entityType];
            return oAnnotationData[sSortOrderPath];
        }
        return presentationVariant.SortOrder;
    };

    oUtils.oFullConfig = null;
    oUtils.getConfig = function (oChartType, bODataV4) {
        //If calculated once, the configuration is already stored, no need to read again
        if (!this.oFullConfig) {
            try {
                this.oFullConfig = merge({}, oConfig.getChartsConfiguration());
            } catch (err) {
                oLogger.error(mErrorMessages.CONFIG_LOAD_ERROR + err);
            }
        }
        //If chart type not provided, return whole configuration
        if (!oChartType) {
            return this.oFullConfig;
        }
        //Read the chart type from the annotation
        var sChartType;
        try {
            sChartType = bODataV4 ? oChartType.$EnumMember.split("/")[1] : oChartType.EnumMember.split("/")[1];
        } catch (err) {
            oLogger.error(mErrorMessages.CARD_ERROR + mErrorMessages.INVALID_CHARTTYPE + mErrorMessages.ANNO_REF);
            return {};
        }

        //Read the configuration for the particular chart type
        if (!this.oFullConfig[sChartType]) {
            oLogger.error(mErrorMessages.INVALID_CONFIG + sChartType + " " + mErrorMessages.CONFIG_JSON);
            return {};
        }

        var sReference;
        if ((sReference = this.oFullConfig[sChartType].reference) && this.oFullConfig[sReference]) {
            var oVirtualEntry = merge({}, this.oFullConfig[sReference]);
            this.oFullConfig[sChartType] = oVirtualEntry;
        }
        return this.oFullConfig[sChartType];
    };

    //Cache OData metadata information with key as UI5 ODataModel id.
    oUtils.oCachedMetaModel = {};
    oUtils.cacheODataMetadata = function (oModel) {
        if (!oModel) {
            oLogger.error(mErrorMessages.CARD_ERROR + mErrorMessages.CACHING_ERROR);
            //return if no oModel present
            return;
        }
        var oEntityPropertyMap = this.oCachedMetaModel[oModel.getId()];

        //calculate map for first time
        if (!oEntityPropertyMap) {
            oEntityPropertyMap = {};
            var oMetaModel = oModel.getMetaModel();
            var bODataV4 = CommonUtils.isODataV4(oModel);

            if (bODataV4) {
                var oEntityContainer = oMetaModel && oMetaModel.getObject("/");
                var oEntityType, oPropertyMap;
                each(oEntityContainer, function (nEntityIndex, oEntitySet) {
                    if (nEntityIndex != "$kind") {
                        oEntityType = oMetaModel.getObject("/" + oEntitySet.$Type);
                        oPropertyMap = {};

                        each(oEntityType, function (nPropertyIndex, oProperty) {
                            if (oProperty.$kind && oProperty.$kind == "Property") {
                                oPropertyMap[nPropertyIndex] = oProperty;
                            }
                        });
                        oEntityPropertyMap[nEntityIndex] = oPropertyMap;
                    }
                });
            } else {
                var oEntityContainer = oMetaModel && oMetaModel.getODataEntityContainer();
                var oEntityType, oPropertyMap;
                each(oEntityContainer.entitySet, function (nEntityIndex, oEntitySet) {
                    oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                    oPropertyMap = {};

                    each(oEntityType.property, function (nPropertyIndex, oProperty) {
                        oPropertyMap[oProperty.name] = oProperty;
                    });
                    oEntityPropertyMap[oEntitySet.name] = oPropertyMap;
                });
            }
            this.oCachedMetaModel[oModel.getId()] = oEntityPropertyMap;
        }
        return oEntityPropertyMap;
    };

    //Check if oEvent contains data for v4 or returns undefined
    oUtils.checkIfDataExistInEvent = function (oEvent) {
        if (oEvent && oEvent.getSource() && oEvent.getSource().getCurrentContexts()) {
            var bCheckIfUndefined = oEvent
                .getSource()
                .getCurrentContexts()
                .some(function (oElement) {
                    return typeof oElement === "undefined";
                });
            return !bCheckIfUndefined;
        }
        return false;
    };

    oUtils.isDataSetEmpty = function (oEvent) {
        if (oEvent && oEvent.getSource() && oEvent.getSource().getCurrentContexts()) {
            return oEvent.getSource().getCurrentContexts().length === 0;
        }
    };

    // return the semantic property info for yearmonth yearquarter and yearquarter will be consumed by Integration card and ovpVizDataHandler Both
    oUtils.getSemanticProperties = function (oEntitySet) {
        var oResult = {
            aTimeAxisProperties: [],
            oTimeAxisPropertiesAndSemantics: {},
            propertyType: ""
        };
        if (oEntitySet) {
            //Get all properties of the Entity set for the card
            var aEntitySetPropKeys = Object.keys(oEntitySet);
            if (aEntitySetPropKeys && aEntitySetPropKeys.length) {
                each(aEntitySetPropKeys, function (i, property) {
                    // Check if any property of the entity set is of type 'Edm.String' AND it contains sap:semantics 
                    // OR V4 is provided support via IsCalendarYearMonth, IsCalendarYearQuarter, IsCalendarYearWeek and IsFiscalYearPeriod.
                    if (oEntitySet[property]["type"] === "Edm.String") {
                        if (oEntitySet[property]["sap:semantics"] === "yearmonth" || oEntitySet[property]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
                            oResult.aTimeAxisProperties.push(property);
                            oResult.oTimeAxisPropertiesAndSemantics[property] = {
                                "semantics": "yearmonth"
                            };
                            oResult.propertyType = "yearmonth";
                        } else if (oEntitySet[property]["sap:semantics"] === "yearquarter" || oEntitySet[property]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
                            oResult.aTimeAxisProperties.push(property);
                            oResult.oTimeAxisPropertiesAndSemantics[property] = {
                                "semantics": "yearquarter"
                            };
                            oResult.propertyType = "yearquarter";
                        } else if (oEntitySet[property]["sap:semantics"] === "yearweek" || oEntitySet[property]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
                            oResult.aTimeAxisProperties.push(property);
                            oResult.oTimeAxisPropertiesAndSemantics[property] = {
                                "semantics": "yearweek"
                            };
                            oResult.propertyType = "yearweek";
                        } else if (oEntitySet[property]["sap:semantics"] === "fiscalyearperiod" || oEntitySet[property]["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"]) {
                            oResult.aTimeAxisProperties.push(property);
                            oResult.oTimeAxisPropertiesAndSemantics[property] = {
                                "semantics": "fiscalyearperiod"
                            };
                        }
                    }
                });
            }
        }
        return oResult;
    };

    /**
     * Get the (cached) OData metadata information.
     * 
     * @param {object} oModel
     * @param {string} sEntitySet
     * @returns {object} The metadata related to current entity set
     */
    oUtils.getMetadata = function (oModel, sEntitySet) {
        var oMetadataMap = this.cacheODataMetadata(oModel) || {};
        return oMetadataMap[sEntitySet];
    };

    /**
     * 
     * Checks if time series annotations exists or not
     * 
     * @param {object} oDataModel 
     * @param {string} sEntitySet 
     * @param {string} sDimensionName 
     * @param {boolean} bODataV4
     * @returns {boolean}
     */
    oUtils.isV4TimeSeriesSemantics = function (oDataModel, sEntitySet, sDimensionName, bODataV4) {
        if (bODataV4) {
            var semantics = oDataModel.getMetaModel().getObject("/" + sEntitySet + "/" + sDimensionName + "@");
            return (
                semantics["@com.sap.vocabularies.Common.v1.IsCalendarYear"] ||
                semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearMonth"] ||
                semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"] ||
                semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]
            );
        }

        var oMetadata = this.getMetadata(oDataModel, sEntitySet);

        return oMetadata[sDimensionName]["com.sap.vocabularies.Common.v1.IsCalendarYear"] ||
            oMetadata[sDimensionName]["com.sap.vocabularies.Common.v1.IsCalendarYearMonth"] ||
            oMetadata[sDimensionName]["com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"] ||
            oMetadata[sDimensionName]["com.sap.vocabularies.Common.v1.IsCalendarYearWeek"];
    };

    /**
    * 
    * If there is exactly one dimension with time semantics (according to model metadata),
    * then instead time type shall be used.
    * 
    * @param {array} aDimensions 
    * @param {object} oConfig 
    * @param {object} oDataModel 
    * @param {string} sEntitySet 
    * @returns 
    */
    oUtils.hasTimeSemantics = function (aDimensions, oConfig, oDataModel, sEntitySet, bODataV4) {
        var ret = false;
        var oMetadata;
        var dimensionType;
        var displayFormat;
        var sapSemantics;
        var sapSemanticsV4; //as part of supporting V4 annotation
        var sDimensionPropertyPath;
        if (!oConfig.time || isEmptyObject(oConfig.time)) {
            return ret;
        }
        if (!aDimensions) {
            return ret;
        }
        for (var index = 0; index < aDimensions.length; index++) {

            if (aDimensions[index].Dimension) {
                sDimensionPropertyPath = bODataV4 ? aDimensions[index].Dimension.$PropertyPath : aDimensions[index].Dimension.PropertyPath;
            }

            if (!aDimensions[index].Dimension) {
                return ret;
            }

            oMetadata = this.getMetadata(oDataModel, sEntitySet);
            if (oMetadata && oMetadata[sDimensionPropertyPath]) {
                dimensionType = oMetadata[sDimensionPropertyPath][mAnnotationConstants.TYPE_KEY];
                displayFormat = oMetadata[sDimensionPropertyPath][mAnnotationConstants.DISPLAY_FORMAT_KEY];
                sapSemantics = oMetadata[sDimensionPropertyPath][mAnnotationConstants.SEMANTICS_KEY];
                sapSemanticsV4 = this.isV4TimeSeriesSemantics(oDataModel, sEntitySet, sDimensionPropertyPath, bODataV4); //as part of supporting V4 annotation
            }
            if (dimensionType && dimensionType.lastIndexOf("Edm.Date", 0) === 0) {
                if (dimensionType.toLowerCase() === "edm.datetime") {
                    //displayFormat is mandatory only if the type is edm.datetime
                    ret = displayFormat && displayFormat.toLowerCase() === "date";
                } else {
                    ret = true;
                }
            }
            //
            //as part of supporting V4 annotation
            if (
                dimensionType === "Edm.String" &&
                (sapSemanticsV4 || (sapSemantics && aSupportedDateSemantics.indexOf(sapSemantics) > -1))
            ) {
                ret = true;
            }
            if (ret) {
                //In the dimension array insert the date dimension at first place
                aDimensions.unshift(aDimensions.splice(index, 1)[0]);
                break;
            }
        }
        return ret;
    };

    /**
     * 
     * @param {object} oContext 
     * @param {object} oMetadata 
     * @param {Array} aMeasures 
     * @param {boolean} bODataV4 
     * @returns {string}
     */
    oUtils.mapMeasures = function (oContext, oMetadata, aMeasures, bODataV4) {
        var value, sDataPointAnnotationPath, sAnnotationPath;
        each(oMetadata, function (i, v) {
            //as part of supporting V4 annotation
            if (
                v["com.sap.vocabularies.Common.v1.Label"] &&
                v["com.sap.vocabularies.Common.v1.Label"].String === oContext.measureNames
            ) {
                value = v.name;
                return false;
            } else if (
                v["com.sap.vocabularies.Common.v1.Label"] &&
                v["com.sap.vocabularies.Common.v1.Label"].Path === oContext.measureNames
            ) {
                value = v.name;
                return false;
            } else if (v["sap:label"] === oContext.measureNames) {
                value = v.name;
                return false;
            }
        });

        each(aMeasures, function (i, v) {
            if (v.Measure.PropertyPath === value) {
                sAnnotationPath = bODataV4 ?
                    v.DataPoint.$AnnotationPath :
                    v.DataPoint.AnnotationPath;
                if (!v.DataPoint || !sAnnotationPath) {
                    return false;
                }
                sDataPointAnnotationPath = sAnnotationPath;
                return false;
            }
        });
        return sDataPointAnnotationPath;
    };

    /**
     * Validates the card configuration Check and log errors/warnings if any.
     * @param {object} oController 
     * @param {boolean} bODataV4 
     * @returns {boolean}
     */
    oUtils.validateCardConfiguration = function (oController, bODataV4) {
        var ret = false;
        if (!oController) {
            return ret;
        }
        var selVar;
        var chartAnno;
        var contentFragment;
        var preVar;
        var idAnno;
        var dPAnno;
        var entityTypeData;
        var logViewId = "";
        var oCardsModel;
        var oView = oController.getView();
        if (oView) {
            logViewId = "[" + oView.getId() + "] ";
        }

        if (!(oCardsModel = oController.getCardPropertiesModel())) {
            oLogger.error(
                logViewId +
                mErrorMessages.CARD_ERROR + //TO DO Change this errorMessages variable is currently accessible in vizannotationManager
                "in " +
                mErrorMessages.CARD_CONFIG +
                mErrorMessages.NO_CARD_MODEL
            );
            return ret;
        }

        entityTypeData = oCardsModel.getProperty("/entityType");

        if (bODataV4) {
            var oMetaModel = oController.getMetaModel();
            entityTypeData = oMetaModel.getData().$Annotations[entityTypeData.$Type];
        }

        if (!entityTypeData || isEmptyObject(entityTypeData)) {
            oLogger.error(logViewId + mErrorMessages.CARD_ERROR + "in " + mErrorMessages.CARD_ANNO);
            return ret;
        }

        selVar = oCardsModel.getProperty("/selectionAnnotationPath");
        chartAnno = oCardsModel.getProperty("/chartAnnotationPath");
        preVar = oCardsModel.getProperty("/presentationAnnotationPath");
        idAnno = oCardsModel.getProperty("/identificationAnnotationPath");
        dPAnno = oCardsModel.getProperty("/dataPointAnnotationPath");
        contentFragment = oCardsModel.getProperty("/contentFragment");

        ret = CardAnnotationHelper.checkExists(selVar, entityTypeData, "Selection Variant", false, logViewId);
        ret = CardAnnotationHelper.checkExists(chartAnno, entityTypeData, "Chart Annotation", true, logViewId, contentFragment) && ret;
        ret = CardAnnotationHelper.checkExists(preVar, entityTypeData, "Presentation Variant", false, logViewId) && ret;
        ret = CardAnnotationHelper.checkExists(idAnno, entityTypeData, "Identification Annotation", true, logViewId) && ret;
        ret = CardAnnotationHelper.checkExists(dPAnno, entityTypeData, "Data Point", false, logViewId) && ret;
        return ret;
    };

    /**
     * 
     * @param {object} oValue 
     * @param {boolean} isLegend 
     * @returns {*} Primitive value for given Item
     */
    oUtils.getPrimitiveValue = function (oValue, isLegend) {
        var value;

        if (oValue) {
            if (oValue.String) {
                value = oValue.String;
            } else if (oValue.Boolean || oValue.Bool) {
                value = getBooleanValue(oValue);
            } else {
                value = getNumberValue(oValue, isLegend);
            }
        }
        return value;
    };

    /**
     * Returns Path or primitive value for given input
     * 
     * @param {object} oItem 
     * @returns {*}
     */
    oUtils.getPathFormedOrPrimitiveValue = function (oItem) {
        if (oItem) {
            if (oItem.Path) {
                return "{path:'" + oItem.Path + "'}";
            } else {
                return this.getPrimitiveValue(oItem);
            }
        } else {
            return "";
        }
    };

    /**
     * 
     * Gets path or primitive value from given item
     * 
     * @param {object} oItem 
     * @param {boolean} isLegend
     * @returns 
     */
    oUtils.getPathOrPrimitiveValue = function (oItem, isLegend) {
        if (oItem) {
            if (oItem.Path) {
                return oItem.Path;
            } else {
                return this.getPrimitiveValue(oItem, isLegend);
            }
        } else {
            return "";
        }
    };

    /**
     * 
     * Check the numberFormat of the DataPoint for each measure
     * 
     * @param {number} minValue 
     * @param {object} oValue 
     * @param {object} oEntityTypeObject 
     * @param {boolean} bODataV4
     * @returns {number}
     */
    oUtils.checkNumberFormat = function (minValue, oValue, oEntityTypeObject, bODataV4) {
        var iMinValue = minValue;
        if (oValue && oValue.DataPoint) {
            var sAnnotationPath = bODataV4 ? oValue.DataPoint.$AnnotationPath : oValue.DataPoint.AnnotationPath.substring(1),
                oDataPoint = oEntityTypeObject[sAnnotationPath],
                fractionDigits, fractionDigitsVal;

            if (oDataPoint && oDataPoint.ValueFormat) {
                fractionDigits = oDataPoint.ValueFormat;
            } else if (oDataPoint && oDataPoint.NumberFormat) {
                fractionDigits = oDataPoint.NumberFormat;
            }

            var oNumberFractionDigits = fractionDigits && fractionDigits.NumberOfFractionalDigits;
            if (oNumberFractionDigits) {
                fractionDigitsVal = bODataV4 ? oNumberFractionDigits : oNumberFractionDigits.Int;
                if (iMinValue < Number(fractionDigitsVal)) {
                    iMinValue = Number(fractionDigitsVal);
                }
            }
        }
        return iMinValue;
    };

    /**
     * Get the maximum value of scale
     * @param {number} maxScaleValue 
     * @param {object} oValue 
     * @param {object} oEntityTypeObject 
     * @param {boolean} bODataV4 
     * @returns {number}
     */
    oUtils.getMaxScaleFactor = function (maxScaleValue, oValue, oEntityTypeObject, bODataV4) {
        var iMaxScaleValue = maxScaleValue;
        if (oValue && oValue.DataPoint) {
            var sAnnotationPath = bODataV4 ? oValue.DataPoint.$AnnotationPath : oValue.DataPoint.AnnotationPath;
            var oDataPoint = oEntityTypeObject[sAnnotationPath];
            var scaleF, ScaleFVal;
            if (oDataPoint && oDataPoint.ValueFormat) {
                scaleF = oDataPoint.ValueFormat;
            } else if (oDataPoint && oDataPoint.NumberFormat) {
                scaleF = oDataPoint.NumberFormat;
            }

            if (scaleF) {
                if (scaleF.ScaleFactor && scaleF.ScaleFactor.Decimal) {
                    ScaleFVal = Number(scaleF.ScaleFactor.Decimal);
                } else if (scaleF.ScaleFactor && scaleF.ScaleFactor.Int) {
                    ScaleFVal = Number(scaleF.ScaleFactor.Int);
                }

                if (!isNaN(ScaleFVal)) {
                    if (iMaxScaleValue === undefined) {
                        iMaxScaleValue = Number(ScaleFVal);
                    } else if (iMaxScaleValue > Number(ScaleFVal)) {
                        iMaxScaleValue = Number(ScaleFVal);
                    }
                }
            }
        }
        return iMaxScaleValue;
    };

    /**
     * Check If the Unit property is currency or not
     * @param {object} oMetadata 
     * @param {string} sapUnit 
     * @returns {boolean}
     */

    oUtils.isMeasureCurrency = function (oMetadata, sapUnit) {
        //as part of supporting V4 annotation

        return oMetadata && oMetadata[sapUnit] &&
            (oMetadata[sapUnit]["Org.OData.Measures.V1.ISOCurrency"] ||
                (oMetadata[sapUnit][mAnnotationConstants.SEMANTICS_KEY] &&
                    oMetadata[sapUnit][mAnnotationConstants.SEMANTICS_KEY] === mAnnotationConstants.CURRENCY_CODE));
    };

    /*
     * Method to calculate the initial items mentioned in presentation annotation and data step
     * @method getMaxItems
     * @param {Object} vizFrame - viz object
     * @param {boolean} bODataV4 - The Data Model is of type V4 or V2
     * @return {Object} object - object containing maxitems and data step
     */
    oUtils.getMaxItems = function (vizFrame, bODataV4) {
        var oCardsModel = vizFrame.getModel("ovpCardProperties"),
            entityTypeObject = oCardsModel.getProperty("/entityType"),
            presentationAnno = oCardsModel.getProperty("/presentationAnnotationPath"),
            presentationContext =
                entityTypeObject.hasOwnProperty(presentationAnno) && entityTypeObject[presentationAnno],
            maxItemTerm = presentationContext && presentationContext.MaxItems;
        var maxItems;

        if (bODataV4 &&
            (typeof maxItemTerm === "number" ||
                (typeof maxItemTerm === "string" && !isNaN(maxItemTerm)))) {
            maxItems = parseInt(maxItemTerm, 10);
        } else if (maxItemTerm && !bODataV4) {
            maxItems = maxItemTerm.Int32 ? maxItemTerm.Int32 : maxItemTerm.Int;
        }

        return {
            itemsLength: +maxItems,
            dataStep: +oCardsModel.getProperty("/dataStep")
        };
    };

    /**
     * In case if i18n key is present in chart title resolves it to value o/w return chart title as it is
     * @param {object} oVizFrame 
     * @param {string} sTitleValue 
     * @returns {string} sChartTitle The value of chart title
     */
    oUtils.resolvei18nKeyToChartTitle = function (oVizFrame, sTitleValue) {
        var oI18nModel = oVizFrame.getModel("@i18n") ?
            oVizFrame.getModel("@i18n") :
            oVizFrame.getModel("i18n");
        var sChartTitle = sTitleValue || "";

        if (sChartTitle.match(/{[@]?i18n>.+}/gi) ||
            sChartTitle.match(/{[@]?i18n&gt;.+}/gi)) {
            var oResourceBundle = oI18nModel.getResourceBundle();
            var indexOfGt = sChartTitle.indexOf(">") > -1 ?
                sChartTitle.indexOf(">") :
                sChartTitle.indexOf("&gt;") + 3;
            var i18nTitle = sChartTitle.substring(indexOfGt + 1, sChartTitle.length - 1);
            sChartTitle = oResourceBundle.getText(i18nTitle);
        }

        return sChartTitle;
    };

    return oUtils;
}, /* bExport= */ true);
