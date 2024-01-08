/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/analytical/BaseAnalyticalChart.controller",
    "sap/ovp/cards/v4/charts/VizAnnotationManager",
    "sap/ovp/cards/charts/VizAnnotationManager",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ovp/app/resources",
    "sap/base/util/each",
    "sap/ovp/cards/Filterhelper",
    "sap/ovp/cards/generic/base/analytical/Utils",
    "sap/ovp/filter/FilterUtils",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel"
], function (
    BaseAnalyticalChartController,
    VizAnnotationManagerV4,
    VizAnnotationManager,
    OVPCardAsAPIUtils,
    OvpResources,
    each,
    Filterhelper,
    Utils,
    FilterUtils,
    Device,
    JSONModel
) {
    "use strict";

    return BaseAnalyticalChartController.extend("sap.ovp.cards.charts.v4.analytical.analyticalChart", {
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            BaseAnalyticalChartController.prototype.onInit.apply(this, arguments);
            var oModel = new JSONModel({
                error: false
            });
            this.getView().setModel(oModel, "oAnalyticalCardErrorModel");
        },

        onAfterRendering: function () {
            BaseAnalyticalChartController.prototype.onAfterRendering.apply(this, arguments);

            if (!OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                var oCardPropertiesModel = this.getCardPropertiesModel();
                var cardmanifestModel = this.getOwnerComponent().getModel("ui").getData().cards;
                var sEntityType = this.getEntitySet() && this.getEntitySet()["$Type"];
                var oContext = sEntityType && this.getMetaModel().getContext("/" + sEntityType);
                if (oContext) {
                    this.selectionVaraintFilter = Filterhelper.getSelectionVariantFilters(
                        cardmanifestModel,
                        oCardPropertiesModel,
                        this.getEntityType()
                    );
                }
                var oMainComponent = this.oCardComponentData.mainComponent;
                var aFilters = [];
                if (oMainComponent.getGlobalFilter()) {
                    aFilters = oMainComponent.oGlobalFilter.getFilters();
                }
                if (oMainComponent.getMacroFilterBar()) {
                    aFilters = oMainComponent.aFilters;
                }
                FilterUtils.applyFiltersToV4AnalyticalCard(aFilters, this);
            }
        },

        onDataReceived: function (oEvent) {
            if (Utils.checkIfDataExistInEvent(oEvent)) {
                var that = this;
                var vizFrame = this.getView().byId("analyticalChart");
                var bubbleText = this.getView().byId("bubbleText");
                var bubbleSizeText = OvpResources.getText("BUBBLESIZE");
                var entityType = that.getMetaModel().getData()["$Annotations"];
                this.oDataSet.bindData("analyticalmodel>/", "");
                vizFrame.setDataset(this.oDataSet);

                var handler = vizFrame.getParent();
                if (!this.isVizPropSet) {
                    VizAnnotationManagerV4.buildVizAttributes(vizFrame, handler, this);
                    this.isVizPropSet = true;

                    if (bubbleText != undefined) {
                        var feeds = vizFrame.getFeeds();
                        each(feeds, function (i, v) {
                            if (feeds[i].getUid() == "bubbleWidth") {
                                bubbleText.setText(bubbleSizeText + " " + feeds[i].getValues());
                            }
                        });
                    }
                    VizAnnotationManager.hideDateTimeAxis(vizFrame);
                }
                if (
                    this.getCardPropertiesModel() &&
                    this.getCardPropertiesModel().getData() &&
                    this.getCardPropertiesModel().getData().colorPalette &&
                    vizFrame.getVizType() === "stacked_column"
                ) {
                    var allDims = vizFrame.getDataset().getDimensions(),
                        vfFeed = vizFrame.getFeeds(),
                        vfFeedColorName,
                        dim;
                    for (var m = 0; m < vfFeed.length; m++) {
                        if (vfFeed[m].getUid() === "color") {
                            vfFeedColorName = vfFeed[m].getValues()[0];
                            break;
                        }
                    }
                    for (var n = 0; n < allDims.length; n++) {
                        if (allDims[n].getName() === vfFeedColorName) {
                            dim = allDims[n];
                            break;
                        }
                    }
                    if (vfFeedColorName && dim) {
                        var sorter = {};
                        sorter["bDescending"] = true;
                        dim.setSorter(sorter);
                    }
                }
                var vizData = oEvent
                    ? oEvent
                        .getSource()
                        .getCurrentContexts()
                        .map(function (context) {
                            return context && context.getObject();
                        })
                    : null;
                // FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
                VizAnnotationManager.setChartUoMTitle(vizFrame, vizData, entityType);
                if (this.bFlag == true) {
                    // vizFrame.addEventDelegate(this.freeDelegate, vizFrame);
                    this.bFlag = false;
                    this.vbLayout.setBusy(false);
                } else {
                    setTimeout(function () {
                        that.vbLayout.setBusy(false);
                        that.bdataLoadedToEnableAddToInsight = true;
                    }, 0);
                }
                VizAnnotationManager.checkNoData(oEvent, this.getCardContentContainer(), vizFrame);
                
                if (Device.system.phone) {
                    if (this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable") {
                        var oCard = this.oDashboardLayoutUtil.dashboardLayoutModel.getCardById(this.cardId);
                        var iRowSpan = Math.max(oCard.dashboardLayout.rowSpan,  this.iPreviousRowSpan);
                        this.iPreviousRowSpan = iRowSpan;
                    }
                    if (Utils.isDataSetEmpty(oEvent)) {
                        vizFrame.setHeight(50 + "px");
                    } else {
                        var iVizFrameHeight = this._calculateVizFrameHeight();
                        if (iVizFrameHeight !== undefined && typeof iVizFrameHeight === "number") {
                           vizFrame.setHeight(iVizFrameHeight + "px");
                        }
                    }
                }
            } else if (oEvent && oEvent.getParameters().error) {
                this.vbLayout.setBusy(false); 
                var oModel = new JSONModel({
                    error: true
                });
                this.getView().setModel(oModel, "oAnalyticalCardErrorModel");
            } 
        }
    });
});
