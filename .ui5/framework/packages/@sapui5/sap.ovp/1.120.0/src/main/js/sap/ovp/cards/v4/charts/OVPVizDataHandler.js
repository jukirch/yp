/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/model/json/JSONModel",
    "sap/ovp/cards/generic/base/analytical/Utils",
    "sap/ovp/app/resources",
    "sap/base/util/each",
    "sap/base/util/merge",
    "sap/ovp/cards/generic/base/analytical/OVPVizDatahelper"
], function (
    Control,
    JSONModel,
    Utils,
    OvpResources,
    each,
    merge,
    OVPVizFrameDataHelper
) {
    "use strict";

    return Control.extend("sap.ovp.cards.v4.charts.OVPVizDataHandler", {
        metadata: {
            aggregations: {
                data: {
                    type: "sap.ui.core.Element"
                },
                aggregateData: {
                    type: "sap.ui.core.Element"
                },
                content: {
                    multiple: false
                }
            },
            properties: {
                chartType: { defaultValue: false },
                dependentDataReceived: { defaultValue: false },
                scale: { defaultValue: "" },
                entitySet: {}
            }
        },
        renderer: function (oRM, oControl) {
            oRM.openStart("div", oControl).openEnd();
            if (oControl.getContent()) {
                oRM.renderControl(oControl.getContent());
            }
            oRM.close("div");
        },

        mergeDatasets: function (binding, oDataClone, content) {
            var that = this;
            var model = this.getModel();
            var parameters = binding.mParameters;
            var bData = merge([], this.dataSet);
            if (parameters) {
                var selectedProperties = parameters["$apply"];
            }
            var entitySetPath = binding.getPath().substring(1);
            var pos = -1;

            if (entitySetPath) {
                pos = entitySetPath.indexOf("Parameters");
            }
            if (pos >= 0) {
                entitySetPath = entitySetPath.substr(0, entitySetPath.indexOf("Parameters"));
            }
            var metaModel = model.getMetaModel();
            //			var entityset = this.getEntitySet();
            var entitySetName = this.getEntitySet();
            // var entitySet = metaModel.getODataEntitySet(entitySetName);
            var entityType = metaModel.getData("/")["$Annotations"];
            var finalMeasures = [];
            var finalDimensions = [];
            for (var key in entityType) {
                if (entityType[key]["@com.sap.vocabularies.Analytics.v1.Measure"]) {
                    if (selectedProperties && selectedProperties.includes(key.split("/")[1])) {
                        finalMeasures.push(key.split("/")[1]);
                    }
                } else {
                    if (selectedProperties && selectedProperties.includes(key.split("/")[1])) {
                        finalDimensions.push(key.split("/")[1]);
                    }
                }
            }

            if (bData) {
                for (var i = 0; i < bData.length - 2; i++) {
                    for (var j = 0; j < finalMeasures.length; j++) {
                        if (bData[0]) {
                            bData[0][finalMeasures[j]] = Number(bData[0][finalMeasures[j]]) + Number(bData[i + 1][finalMeasures[j]]);
                        }
                    }
                }
                bData.__count = bData.length;
                var count = bData.__count - bData.length;
                var object = {};
                object.results = [];
                object.results[0] = bData[0];
                var result;

                if (bData.__count > bData.length) {
                    var aggregateObject = merge({}, this.aggregateSet);
                    if (aggregateObject && aggregateObject.results && bData.results.length < bData.__count) {
                        each(finalMeasures, function (i) {
                            aggregateObject.results[0][finalMeasures[i]] = String(
                                Number(that.aggregateSet.results[0][finalMeasures[i]]) - Number(object.results[0][finalMeasures[i]])
                            );
                        });
                        each(finalDimensions, function (i) {
                            aggregateObject.results[0][finalDimensions[i]] = OvpResources.getText("OTHERS_DONUT", [count + 1]);
                        });
                        aggregateObject.results[0].$isOthers = true;
                        result = aggregateObject.results[0];

                        if (result) {
                            oDataClone.results.splice(-1, 1);
                        }
                    }
                }
                if (result) {
                    oDataClone.results.push(result);
                }
                //Non-semantic coloring for donut charts, needs to be performed here, as the rules for coloring need to be updated every time
                //new data is loaded for the chart. This is applicable for resizable layout scenarios
                var oCardModel = content.getModel("ovpCardProperties");
                var bEnableStableColors = oCardModel && oCardModel.getProperty("/bEnableStableColors");
                var oColorPalette = oCardModel && oCardModel.getProperty("/colorPalette");
                var oChartAnnotation = entityType[entitySetName]["@" + (oCardModel && oCardModel.getProperty("/chartAnnotationPath"))];
                //Only one dimension allowed for stable coloring in donut chart, also adapt colorPalette to expect an Object, in addition to an Array
                if (
                    oChartAnnotation.DimensionAttributes.length === 1 &&
                    bEnableStableColors &&
                    content.getVizType() === "donut" &&
                    oColorPalette &&
                    oColorPalette instanceof Object
                ) {
                    var colorPaletteDimension = oChartAnnotation.DimensionAttributes[0].Dimension.$PropertyPath;
                    var oVizProps = content.getVizProperties();
                    if (!oVizProps) {
                        var vizPropertiesObject = {
                            plotArea: {
                                dataPointStyle: {
                                    rules: []
                                }
                            }
                        };
                        oVizProps = vizPropertiesObject;
                    } else if (oVizProps && !oVizProps.plotArea) {
                        oVizProps.plotArea = {
                            dataPointStyle: {
                                rules: []
                            }
                        };
                    }

                    if (content && oVizProps && oVizProps.plotArea) {
                        //Initialize the coloring rules, everytime new data is loaded, to prevent replication of existing rules
                        if (!oVizProps.plotArea.dataPointStyle) {
                            oVizProps.plotArea.dataPointStyle = {
                                rules: []
                            };
                        } else {
                            oVizProps.plotArea.dataPointStyle.rules = [];
                        }

                        var oEntityType = oCardModel.getProperty("/entityType");
                        var oDimension = metaModel.getData()["$Annotations"][oEntityType.$Type + "/" + colorPaletteDimension];
                        if (oDimension) {
                            //Dimension property label is fetched as maintained in either metadata or annotations
                            var sDimensionLabel = oDimension["@com.sap.vocabularies.Common.v1.Label"]
                                ? oDimension["@com.sap.vocabularies.Common.v1.Label"]
                                : colorPaletteDimension;
                            var sDisplayProperty;
                            if (oDimension["@com.sap.vocabularies.Common.v1.Text"]) {
                                sDisplayProperty = oDimension["@com.sap.vocabularies.Common.v1.Text"]["$Path"];
                            } else if (oDimension["sap:text"]) {
                                sDisplayProperty = oDimension["sap:text"];
                            } else {
                                sDisplayProperty = oDimension;
                            }
                            OVPVizFrameDataHelper.cacheValues(oColorPalette, colorPaletteDimension, sDisplayProperty, sDimensionLabel);
                            OVPVizFrameDataHelper.addColorRulesToVizProperties(oDataClone, oVizProps);
                            OVPVizFrameDataHelper.handleOthersSectionForCharts(aggregateObject, oVizProps);
                        }
                    }
                    content.setVizProperties(oVizProps);
                    OVPVizFrameDataHelper.setVizPropertiesForInsightCards(oCardModel, content, oVizProps);
                }
            }

            var oModel = new JSONModel();
            var data = [];
            for (var i = 0; i < oDataClone.results.length; i++) {
                var obj = {};
                for (var k = 0; k < finalDimensions.length; k++) {
                    obj[finalDimensions[k]] = oDataClone.results[i] && oDataClone.results[i][finalDimensions[k]];
                }
                for (var l = 0; l < finalMeasures.length; l++) {
                    obj[finalMeasures[l]] = oDataClone.results[i] && ( oDataClone.results[i][finalMeasures[l] + "Aggregate"] || oDataClone.results[i][finalMeasures[l]]);
                }
                data.push(obj);
            }
            oModel.setData(data);
            content.setModel(oModel, "analyticalmodel");
        },

        updateBindingContext: function () {
            var binding = this.getBinding("data");
            var that = this;
            if (this.chartBinding == binding) {
                return;
            } else {
                this.chartBinding = binding;
                if (binding) {
                    var that = this;
                    binding.attachEvent("dataReceived", function (oEvent) {
                        if (Utils.checkIfDataExistInEvent(oEvent)) {
                            that.dataSet =
                                oEvent &&
                                oEvent
                                    .getSource()
                                    .getCurrentContexts()
                                    .map(function (context) {
                                        return context && context.getObject();
                                    });
                            that.oDataClone = { results: merge([], that.dataSet) };
                            if (that.getChartType() == "donut" && that.getBinding("aggregateData") !== undefined) {
                                if (that.getDependentDataReceived() === true || that.getDependentDataReceived() === "true") {
                                    that.mergeDatasets(binding, that.oDataClone, that.getContent());
                                    that.setDependentDataReceived(false);
                                } else {
                                    that.setDependentDataReceived(true);
                                    //store data local
                                }
                            } else {
                                var oModel = new JSONModel();
                                if (that.dataSet) {
                                    var entitySetName = that.getEntitySet().split(".")[that.getEntitySet().split(".").length - 1];
                                    var oCardModel = binding.getModel();
                                    var oMetadataMap = Utils.cacheODataMetadata(oCardModel);

                                    var aTimeAxisProperties = [];
                                    var oTimeAxisPropertiesAndSemantics = {};
                                    var oEntitySet = oMetadataMap[entitySetName];
                                    if (oEntitySet) {
                                        //Get all properties of the Entity set for the card
                                        var aEntitySetPropKeys = Object.keys(oEntitySet);
                                    }

                                    if (aEntitySetPropKeys && aEntitySetPropKeys.length) {
                                        each(aEntitySetPropKeys, function (i, property) {
                                            // Check if any property of the entity set is of type 'Edm.String' AND V4 support is provided via 
                                            // IsCalendarYearMonth, IsCalendarYearQuarter, IsCalendarYearWeek and IsFiscalYearPeriod annotations.
                                            if (oEntitySet[property].$Type === "Edm.String") {
                                                var semantics = that
                                                    .getModel()
                                                    .getMetaModel()
                                                    .getObject("/" + that.getEntitySet() + "/" + property + "@");
                                                if (semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
                                                    aTimeAxisProperties.push(property);
                                                    oTimeAxisPropertiesAndSemantics[property] = { "semantics": "yearmonth" };
                                                } else if (semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
                                                    aTimeAxisProperties.push(property);
                                                    oTimeAxisPropertiesAndSemantics[property] = { "semantics": "yearquarter" };
                                                } else if (semantics["@com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
                                                    aTimeAxisProperties.push(property);
                                                    oTimeAxisPropertiesAndSemantics[property] = { "semantics": "yearweek" };
                                                } else if (semantics["@com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"]) {
                                                    aTimeAxisProperties.push(property);
                                                    oTimeAxisPropertiesAndSemantics[property] = { "semantics": "fiscalyearperiod" };
                                                }
                                            }
                                        });
                                    }

                                    OVPVizFrameDataHelper.formatDateBasedOnSemantics(aTimeAxisProperties, oTimeAxisPropertiesAndSemantics, that.dataSet);
                                    oModel.setData(that.dataSet);
                                    //Since the earlier commit was throwing multiple errors in qunit, adding this check to fix the errors in short term
                                    // TODO: To be removed once the qunits are fixed
                                    //have to remove once the qunits are fixed for data errors
                                    that.oDataClone = { results: merge([], that.dataSet) };
                                }
                                that.getContent().setModel(oModel, "analyticalmodel");
                                that.mergeDatasets(binding, that.oDataClone, that.getContent());
                            }
                        }
                    });
                }
                Control.prototype.updateBindingContext.apply(this, arguments);
            }
            OVPVizFrameDataHelper.attachDataReceivedToAggregationBinding.bind(this)();
        }
    });
});
