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

    return Control.extend("sap.ovp.cards.charts.OVPVizDataHandler", {
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
            var bData = merge({}, this.dataSet);
            if (parameters) {
                var selectedProperties = parameters.select.split(",");
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
            var entitySet = metaModel.getODataEntitySet(entitySetName);
            var entityType = metaModel.getODataEntityType(entitySet.entityType);
            var finalMeasures = [];
            var finalDimensions = [];
            for (var i = 0; i < entityType.property.length; i++) {
                //as part of supporting V4 annotation
                if (
                    entityType.property[i]["com.sap.vocabularies.Analytics.v1.Measure"] ||
                    (entityType.property[i].hasOwnProperty("sap:aggregation-role") &&
                        entityType.property[i]["sap:aggregation-role"] === "measure")
                ) {
                    if (
                        selectedProperties &&
                        selectedProperties.indexOf(entityType.property[i].name) !== -1
                    ) {
                        finalMeasures.push(entityType.property[i].name);
                    }
                } else {
                    if (
                        selectedProperties &&
                        selectedProperties.indexOf(entityType.property[i].name) !== -1
                    ) {
                        finalDimensions.push(entityType.property[i].name);
                    }
                }
            }

            if (bData && bData.results) {
                for (var i = 0; i < bData.results.length - 2; i++) {
                    for (var j = 0; j < finalMeasures.length; j++) {
                        bData.results[0][finalMeasures[j]] =
                            Number(bData.results[0][finalMeasures[j]]) +
                            Number(bData.results[i + 1][finalMeasures[j]]);
                    }
                }
                var count = bData.__count - bData.results.length;
                var object = {};
                object.results = [];
                object.results[0] = bData.results[0];
                var result;

                if (bData.__count > bData.results.length) {
                    var aggregateObject = merge({}, this.aggregateSet);
                    if (
                        aggregateObject &&
                        aggregateObject.results &&
                        bData.results.length < bData.__count
                    ) {
                        each(finalMeasures, function (i) {
                            aggregateObject.results[0][finalMeasures[i]] = String(
                                Number(that.aggregateSet.results[0][finalMeasures[i]]) -
                                Number(object.results[0][finalMeasures[i]])
                            );
                        });
                        each(finalDimensions, function (i) {
                            aggregateObject.results[0][finalDimensions[i]] =
                                OvpResources.getText("OTHERS_DONUT", [count + 1]);
                        });
                        aggregateObject.results[0].$isOthers = true;
                        result = aggregateObject.results[0];
                    }
                }
                if (result) {
                    oDataClone.results.push(result);
                }
                // Non-semantic coloring for donut charts, needs to be performed here, as the rules for coloring need to be updated every time
                // new data is loaded for the chart. This is applicable for resizable layout scenarios
                var oCardModel = content.getModel("ovpCardProperties");
                var bEnableStableColors =
                    oCardModel && oCardModel.getProperty("/bEnableStableColors");
                var oColorPalette = oCardModel && oCardModel.getProperty("/colorPalette");
                var oChartAnnotation =
                    entityType[oCardModel && oCardModel.getProperty("/chartAnnotationPath")];
                // Only one dimension allowed for stable coloring in donut chart, also adapt colorPalette to expect an Object, in addition to an Array
                if (
                    oChartAnnotation.DimensionAttributes.length === 1 &&
                    bEnableStableColors &&
                    content.getVizType() === "donut" &&
                    oColorPalette &&
                    oColorPalette instanceof Object
                ) {
                    var colorPaletteDimension = oChartAnnotation.DimensionAttributes[0].Dimension.PropertyPath;

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

                        var oDimension = metaModel.getODataProperty(entityType, colorPaletteDimension);
                        if (oDimension) {
                            //Dimension property label is fetched as maintained in either metadata or annotations
                            var sDimensionLabel = oDimension["com.sap.vocabularies.Common.v1.Label"] ?
                                oDimension["com.sap.vocabularies.Common.v1.Label"].String :
                                colorPaletteDimension;
                            var sDisplayProperty;

                            if (oDimension["com.sap.vocabularies.Common.v1.Text"]) {
                                sDisplayProperty = oDimension["com.sap.vocabularies.Common.v1.Text"]["Path"];
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
            oModel.setData(oDataClone.results);
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
                        that.dataSet = oEvent && oEvent.getParameter("data");
                        that.oDataClone = merge({}, that.dataSet);
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
                                var entitySetName = that.getEntitySet();
                                var oCardModel = binding.getModel();
                                var oMetadataMap = Utils.cacheODataMetadata(oCardModel);

                                var oEntitySet = oMetadataMap[entitySetName];
                                var oSemanticDateInfo = Utils.getSemanticProperties(oEntitySet);
                                var aTimeAxisProperties = oSemanticDateInfo && oSemanticDateInfo.aTimeAxisProperties || [];
                                var oTimeAxisPropertiesAndSemantics = oSemanticDateInfo && oSemanticDateInfo.oTimeAxisPropertiesAndSemantics || {};
                                OVPVizFrameDataHelper.formatDateBasedOnSemantics(aTimeAxisProperties, oTimeAxisPropertiesAndSemantics, that.dataSet.results);
                                oModel.setData(that.dataSet.results);
                                //Since the earlier commit was throwing multiple errors in qunit, adding this check to fix the errors in short term
                                // TODO: To be removed once the qunits are fixed
                                //have to remove once the qunits are fixed for data errors
                                that.oDataClone = merge({}, that.dataSet);
                            }
                            that.getContent().setModel(oModel, "analyticalmodel");
                            that.mergeDatasets(binding, that.oDataClone, that.getContent());
                        }
                    });
                }
                Control.prototype.updateBindingContext.apply(this, arguments);
            }
            OVPVizFrameDataHelper.attachDataReceivedToAggregationBinding.bind(this)();
        }
    });
});