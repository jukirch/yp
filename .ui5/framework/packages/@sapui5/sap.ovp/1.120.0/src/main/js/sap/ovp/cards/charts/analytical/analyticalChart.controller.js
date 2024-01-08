/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/analytical/BaseAnalyticalChart.controller",
    "sap/ovp/cards/charts/VizAnnotationManager",
    "sap/ovp/app/resources",
    "sap/base/util/each",
    "sap/ovp/filter/FilterUtils",
    "sap/ui/core/Core",
    "sap/ui/Device",
    "sap/ovp/cards/generic/base/analytical/Utils"
], function (
    BaseAnalyticalChartController,
    VizAnnotationManager,
    OvpResources,
    each,
    FilterUtils,
    Core,
    Device,
    Utils
) {
    "use strict";

    return BaseAnalyticalChartController.extend("sap.ovp.cards.charts.analytical.analyticalChart", {
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            BaseAnalyticalChartController.prototype.onInit.apply(this, arguments);
            var that = this;
            this.eventhandler = function (sChannelId, sEventName, aFilters) {
                FilterUtils.applyFiltersToV2Card(aFilters, that);
            };
            this.GloabalEventBus = Core.getEventBus();
            if (this.oMainComponent && this.oMainComponent.isMacroFilterBar) {
                this.GloabalEventBus.subscribe(
                    "OVPGlobalfilter",
                    "OVPGlobalFilterSeacrhfired",
                    that.eventhandler
                );
            }
        },

        onDataReceived: function (oEvent) {
            var that = this;
            var vizFrame = this.getView().byId("analyticalChart");
            var bubbleText = this.getView().byId("bubbleText");
            var bubbleSizeText = OvpResources.getText("BUBBLESIZE");
            this.oDataSet.bindData("analyticalmodel>/", "");
            vizFrame.setDataset(this.oDataSet);
            var handler = vizFrame.getParent();

            if (!this.isVizPropSet) {
                VizAnnotationManager.buildVizAttributes(vizFrame, handler, this);
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
            var vizData = oEvent ? oEvent.getParameter("data") : null;
            //FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
            VizAnnotationManager.setChartUoMTitle(vizFrame, vizData);
            if (this.bFlag == true) {
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
        }
    });
}
);
