/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/base/BindingParser"], function (BindingParser) {
    var getBindingPath = function (sBinding) {
        var oBinding = BindingParser.complexParser(sBinding);
        return oBinding.path || (oBinding.parts && oBinding.parts[0].path);
    };

    // var ALL_CHART_TYPES = [
    //     "column",
    //     "dual_column",
    //     "bar",
    //     "dual_bar",
    //     "stacked_bar",
    //     "stacked_column",
    //     "line",
    //     "dual_line",
    //     "combination",
    //     "bullet",
    //     "time_bullet",
    //     "bubble",
    //     "time_bubble",
    //     "pie",
    //     "donut",
    //     "timeseries_column",
    //     "timeseries_line",
    //     "timeseries_scatter",
    //     "timeseries_bubble",
    //     "timeseries_stacked_column",
    //     "timeseries_100_stacked_column",
    //     "timeseries_bullet",
    //     "timeseries_waterfall",
    //     "timeseries_stacked_combination",
    //     "scatter",
    //     "vertical_bullet",
    //     "dual_stacked_bar",
    //     "100_stacked_bar",
    //     "100_dual_stacked_bar",
    //     "dual_stacked_column",
    //     "100_stacked_column",
    //     "100_dual_stacked_column",
    //     "stacked_combination",
    //     "horizontal_stacked_combination",
    //     "dual_stacked_combination",
    //     "dual_horizontal_stacked_combination",
    //     "heatmap",
    //     "treemap",
    //     "waterfall",
    //     "horizontal_waterfall",
    //     "area",
    //     "radar"
    // ];

    var SINGLE_MEASURE_CHART_TYPES = {
        "bar_series" : [
            "bar",
            "column",
            "line",
            "bullet",
            "stacked_bar",
            "stacked_column",
            "vertical_bullet",
            "100_stacked_bar",
            "100_stacked_column",
            "waterfall",
            "horizontal_waterfall",
            "area",
            "radar"
        ],
        "pie_series": ["pie", "donut"]
    };

    var MULTI_MEASURE_CHART_TYPES = {
        "bar_series": SINGLE_MEASURE_CHART_TYPES["bar_series"].concat(
            "combination",
            "stacked_combination",
            "horizontal_stacked_combination"
        ),
        "pie_series": SINGLE_MEASURE_CHART_TYPES["pie_series"],
        "dual_series": [
            "dual_bar",
            "dual_column",
            "dual_line",
            "dual_stacked_bar",
            "dual_stacked_column",
            "dual_combination",
            "dual_horizontal_combination",
            "dual_stacked_combination",
            "dual_horizontal_stacked_combination",
            "100_dual_stacked_bar",
            "100_dual_stacked_column"
        ],
        "scatter_series": ["scatter"],
        "heatmap_series": ["heatmap"],
        "bubble_series": ["bubble"]
    };

    var getSupportedChartSeries = function (oManifest) {
        var iMeasureCount = oManifest.content.measures.length;
        return iMeasureCount > 1 ? MULTI_MEASURE_CHART_TYPES : SINGLE_MEASURE_CHART_TYPES;
    };

    var getOwnChartSeriesName = function (sChartType, oSupportedChartSeries) {
        var sChartSeries = null;
        var aSupportedChartSeries = Object.keys(oSupportedChartSeries);
        aSupportedChartSeries.forEach(function(sSupportedChartSeries) {
            if (oSupportedChartSeries[sSupportedChartSeries].includes(sChartType)) {
                sChartSeries = sSupportedChartSeries;
            }
        });
        return sChartSeries;
    };

    var generateManifests = function(sManifestCopy, aChartTypes) {
        var aManifests = [];
        aChartTypes.forEach(function(sChartType) {
            var oManifestClone = JSON.parse(sManifestCopy);
            var oCardSection = oManifestClone["sap.card"];
            var oContentSection = oCardSection.content;
            oContentSection.chartType = sChartType;

            aManifests.push(oManifestClone);
        });
        return aManifests;
    };

    var generateManifestForBarSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = false;
        }
        oContentSection.feeds = [
            {
                "uid": "categoryAxis",
                "type": "Dimension",
                "values": oContentSection.dimensions.map(function(oDimension){
                    return oDimension.label || oDimension.name;
                })
            },
            {
                "uid": "valueAxis",
                "type": "Measure",
                "values": oContentSection.measures.map(function(oMeasure){
                    return oMeasure.label || oMeasure.name;
                })
            }
        ];

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestForPieSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = true;
        }

        oContentSection.feeds = [
            {
                "uid": "size",
                "type": "Measure",
                "values": oContentSection.measures.map(function(oMeasure){
                    return oMeasure.label || oMeasure.name;
                })
            },
            {
                "uid": "color",
                "type": "Dimension",
                "values": oContentSection.dimensions.map(function(oDimension){
                    return oDimension.label || oDimension.name;
                })
            }
        ];

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestForDualSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = false;
        }

        oContentSection.feeds = [
            {
                "uid": "categoryAxis",
                "type": "Dimension",
                "values": oContentSection.dimensions.map(function(oDimension){
                    return oDimension.label || oDimension.name;
                })
            }
        ].concat(oContentSection.measures.map(function(oMeasure, index){
            return {
                "uid": "valueAxis" + (index === 0 ? '' : index + 1),
                "type": "Measure",
                "values": [oMeasure.label || oMeasure.name]
            };
        }));

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestForScatterSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = false;
        }

        oContentSection.feeds = [
            {
                "uid": "color",
                "type": "Dimension",
                "values": oContentSection.dimensions.map(function(oDimension){
                    return oDimension.label || oDimension.name;
                })
            }
        ].concat(
            oContentSection.measures.map(function(oMeasure, index){
                var uid = "valueAxis";
                if (index !== 0){
                    if (index === 1) {
                        uid = "valueAxis2";
                    } else {
                        if (index !== (oContentSection.measures.length - 1)) {
                            uid = uid + (index + 1);
                        }
                        if (index === (oContentSection.measures.length - 1)) {
                            uid = "bubbleWidth";
                        }
                    }
                }
                return {
                    "uid": uid,
                    "type": "Measure",
                    "values": [oMeasure.label || oMeasure.name]
                };
            })
        );

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestForHeatMapSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = true;
            // oContentSection.chartProperties.legendGroup = {
            //     "layout": {
            //         "position": "right",
            //         "alignment": "topLeft"
            //     }
            // };
        }

        oContentSection.feeds = [
            {
                "uid": "color",
                "type": "Measure",
                "values": [oContentSection.measures[0].name || oContentSection.measures[0].label]
            },
            {
                "uid": "categoryAxis",
                "type": "Dimension",
                "values": oContentSection.dimensions.map(function(oDimension){
                    return oDimension.name || oDimension.label;
                })
            }
        ];

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestForBubbleSeries = function(sManifest, aChartTypes) {
        var oManifestClone = JSON.parse(sManifest);
        var oCardSection = oManifestClone["sap.card"];
        var oContentSection = oCardSection.content;

        if (oContentSection.measures.length < 3){
            return null;
        }

        if (oContentSection.chartProperties && oContentSection.chartProperties.legend){
            oContentSection.chartProperties.legend["visible"] = true;
            // oContentSection.chartProperties.legendGroup = {
            //     "layout": {
            //         "position": "right",
            //         "alignment": "topLeft"
            //     }
            // };
        }

        oContentSection.feeds = [
            {
                "uid": "color",
                "type": "Dimension",
                "values": [oContentSection.dimensions[0].name || oContentSection.dimensions[0].label]
            },
            {
                "uid": "valueAxis",
                "type": "Measure",
                "values": [oContentSection.measures[0].name || oContentSection.measures[0].label]
            },
            {
                "uid": "valueAxis2",
                "type": "Measure",
                "values": [oContentSection.measures[1].name || oContentSection.measures[1].label]
            },
            {
                "uid": "bubbleWidth",
                "type": "Measure",
                "values": [oContentSection.measures[2].name || oContentSection.measures[2].label]
            }
        ];

        return generateManifests(JSON.stringify(oManifestClone), aChartTypes);
    };

    var generateManifestsForChartSeries = function(sManifest, sChartSeries, aChartTypes) {
        switch (sChartSeries) {
            case "bar_series":
                return generateManifestForBarSeries(sManifest, aChartTypes);
            case "pie_series":
                return generateManifestForPieSeries(sManifest, aChartTypes);
            case "dual_series":
                return generateManifestForDualSeries(sManifest, aChartTypes);
            case "scatter_series":
                return generateManifestForScatterSeries(sManifest, aChartTypes);
            case "heatmap_series":
                return generateManifestForHeatMapSeries(sManifest, aChartTypes);
            case "bubble_series":
                return generateManifestForBubbleSeries(sManifest, aChartTypes);
            default:
                return null;
        }
    };

    /**
     * transformAnalyticalManifest
     *
     * Creates analytical card options
     *
     * @param {object} oManifest original card manifest
     * @param {Array} aTargetChartTypes List of target chartTypes
     * @returns {Array} List of transformed manifests
     */
    function transformAnalyticalManifest(oManifest, aTargetChartTypes) {

        var oSupportedChartSeries = getSupportedChartSeries(oManifest["sap.card"]);
        var sOriginalChartType = oManifest["sap.card"].content.chartType;
        var sManifest = JSON.stringify(oManifest);
        var aFinalCardsList = [];
        var aSupportedChartSeries = Object.keys(oSupportedChartSeries);

        // If list of Target chart types are  present, convert manifest to only those chart types
        if (aTargetChartTypes && Array.isArray(aTargetChartTypes) && aTargetChartTypes.length) {
            aTargetChartTypes.forEach(function(sChartType) {
                var sOwnSeriesName = getOwnChartSeriesName(sChartType, oSupportedChartSeries);
                if (sOwnSeriesName) {
                    aFinalCardsList = aFinalCardsList.concat(generateManifestsForChartSeries(sManifest, sOwnSeriesName, [sChartType]));
                } else {
                    aFinalCardsList.push(null);
                }
            });
        } else {
            oManifest["sap.card"].data.request["timeout"] = 100000; // Manually Increasing data request timeout (to be removed after implementation of caching)
            aSupportedChartSeries.forEach(function(sChartSeries) {
                var aChartTypes = oSupportedChartSeries[sChartSeries];
                if (aChartTypes.includes(sOriginalChartType)){
                    aFinalCardsList = aFinalCardsList.concat(generateManifests(sManifest, aChartTypes));
                } else {
                    aFinalCardsList = aFinalCardsList.concat(generateManifestsForChartSeries(sManifest, sChartSeries, aChartTypes));
                }
            });
        }
        return aFinalCardsList;
    }

    var aListTransformations = [
        function originalCard(oCard) {
            return oCard;
        },
        function removeMicroChart(oCard) {
            var oItem = oCard["sap.card"].content.item;
            if (oItem.chart) {
                if (!oItem.info && oItem.chart.displayValue) {
                    oItem.info = {
                        value: oItem.chart.displayValue
                    };
                    if (oItem.chart.color) {
                        oItem.info.state = oItem.chart.color;
                    }
                }
                delete oItem.chart;
                return oCard;
            }
            return null;
        },
        function removeInfo(oCard) {
            var oItem = oCard["sap.card"].content.item;
            if (oItem.info) {
                delete oItem.info;
                return oCard;
            }
            return null;
        },
        function removeAttributes(oCard) {
            var oItem = oCard["sap.card"].content.item;
            if (oItem.attributes && oItem.attributes.length > 0) {
                delete oItem.attributes;
                delete oItem.attributesLayoutType;
                return oCard;
            }
            return null;
        },
        function groupByInfo(oCard) {
            var oItem = oCard["sap.card"].content.item;
            if (oItem.info) {
                oCard["sap.card"].content.group = {
                    title: oItem.info.value,
                    order: {
                        path: getBindingPath(oItem.info.value),
                        dir: "DESC"
                    }
                };
                delete oItem.info;
                return oCard;
            }
            return null;
        },
        function groupByFirstAttribute(oCard) {
            var oItem = oCard["sap.card"].content.item;
            if (oItem.attributes && oItem.attributes.length > 0) {
                oCard["sap.card"].content.group = {
                    title: oItem.attributes[0].value,
                    order: {
                        path: getBindingPath(oItem.attributes[0].value),
                        dir: "DESC"
                    }
                };
                delete oItem.attributes;
                delete oItem.attributesLayoutType;
                return oCard;
            }
            return null;
        },
        function listToTable(oCard) {
            /*
             *  Challenges:
             *  we don't have column titles as the List doesn't have it
             */
            var oContent = oCard["sap.card"].content;
            var oItem = oContent.item;
            var aColumns = [];
            var aActions = [];
            if (oItem.title) {
                aColumns.push({
                    value: oItem.title
                });
            }
            if (oItem.actions && oItem.actions.length) {
                aActions = aActions.concat(oItem.actions);
            }
            if (oItem.chart && oItem.chart.displayValue) {
                aColumns.push({
                    value: oItem.chart.displayValue
                });
                if (oItem.chart.color) {
                    aColumns[aColumns.length - 1].state = oItem.chart.color;
                }
            }
            if (oItem.attributes && oItem.attributes.length > 0) {
                aColumns = aColumns.concat(oItem.attributes);
            }
            if (oItem.info) {
                aColumns.push(oItem.info);
            }
            // aColumns.map(function(oCol, index) {
            //   oCol.title = String.fromCharCode(65 + index); //"Col" + index;
            // });
            if (aColumns.length > 0) {
                oContent.row = {
                    columns: aColumns
                };
                if (aActions.length > 0) {
                    oContent.row["actions"] = aActions;
                }
                delete oContent.item;
                oCard["sap.card"].type = "Table";
                return oCard;
            }
            return null;
        }
    ];

    /**
     * createTransformationOptions
     *
     * @param {object} oManifest Card manifest
     * @param {Array} aTransformations Transformation functions for a card manifest
     * @returns {Array} Array of card manifests
     */
    function createTransformationOptions(oManifest, aTransformations) {
        var sManifest = JSON.stringify(oManifest);
        return aTransformations.map(function (fn) {
            var oManifestClone = JSON.parse(sManifest);
            return fn(oManifestClone);
        });
    }

    /**
     * createListOptions
     *
     * @param {object} oManifest Card manifest
     * @returns {Array} Array of card manifests
     */
    function createListOptions(oManifest) {
        return createTransformationOptions(oManifest, aListTransformations);
    }

    var aTableTransformations = [
        function originalCard(oCard) {
            return oCard;
        },
        function tableToList(oCard) {
            var oContent = oCard["sap.card"].content;
            var oItem = {"attributesLayoutType":"OneColumn"};
            var aColumns = oContent.row.columns || [];
            if (aColumns.length > 0) {
              aColumns.forEach(function(oCol, index) {
                // if (index === 0) {
                //   oItem.title = oCol.value;
                // } else {
                //   if (oCol.state && !oItem.info) {
                //     oItem.info = {
                //       value: oCol.value,
                //       state: oCol.state
                //     };
                //   } else {
                    oItem.attributes = oItem.attributes || [];
                    oItem.attributes.push(oCol);
                //   }
                // }
              });
                if (oContent.row.actions && oContent.row.actions.length) {
                    oItem["actions"] = oContent.row.actions;
                }
                oCard["sap.card"].type = "List";
                oContent.item = oItem;
                delete oContent.row;
                return oCard;
            }
            return null;
        }
    ];

    /**
     * createListOptions
     *
     * @param {object} oManifest Card manifest
     * @returns {Array} Array of card manifests
     */
    function createTableOptions(oManifest) {
        return createTransformationOptions(oManifest, aTableTransformations);
    }

    var aChartTransformations = [
        function chartToTable(oCard) {
            var oContent = oCard["sap.card"].content;
            var oData = oContent.data;
            var aDimensions = oContent.dimensions || [];
            var aMeasures = oContent.measures || [];
            var aColumns = aDimensions.map(function (oDim) {
                return {
                    title: oDim.label,
                    value: oDim.displayValue || oDim.value
                };
            });
            aColumns = aColumns.concat(
                aMeasures.map(function (oMeasure) {
                    return {
                        title: oMeasure.label,
                        value: oMeasure.value
                    };
                })
            );
            if (aColumns.length > 0) {
                oCard["sap.card"].type = "Table";
                oCard["sap.card"].content = {
                    data: oData,
                    row: {
                        columns: aColumns
                    }
                };
                return oCard;
            }
            return null;
        }
    ];
    /**
     * createChartToListOrTableOptions
     *
     * @param {object} oManifest Card manifest
     * @returns {Array} Array of card manifests
     */
    function createChartToListOrTableOptions(oManifest) {
        return createTransformationOptions(oManifest, aChartTransformations);
    }

    return {
        transformAnalyticalManifest: transformAnalyticalManifest,
        createListOptions: createListOptions,
        createTableOptions: createTableOptions,
        createChartToListOrTableOptions: createChartToListOrTableOptions
    };
});
