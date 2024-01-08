/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/Card.controller",
    "sap/ovp/cards/charts/VizAnnotationManager",
    "sap/ovp/cards/v4/charts/VizAnnotationManager",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ovp/app/resources",
    "sap/base/util/each",
    "sap/ovp/app/OVPLogger",
    "sap/ui/core/Fragment",
    "sap/ovp/insights/IntegrationCard",
    "sap/ui/Device",
    "sap/ui/dom/units/Rem",
    "sap/m/MessageBox",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/charts/OVPChartFormatter",
    "sap/ovp/cards/generic/base/analytical/Utils"
], function (
    CardController,
    VizAnnotationManager,
    VizAnnotationManagerV4,
    FlattenedDataset,
    OVPCardAsAPIUtils,
    OvpResources,
    each,
    OVPLogger,
    Fragment,
    IntegrationCard,
    Device,
    Rem,
    MessageBox,
    CommonUtils,
    OVPChartFormatter,
    ChartUtils
) {
    "use strict";

    var oLogger = new OVPLogger("sap.ovp.cards.generic.base.analytical.BaseAnalyticalChart");

    return CardController.extend("sap.ovp.cards.generic.base.analytical.BaseAnalyticalChart", {
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            CardController.prototype.onInit.apply(this, arguments);
            OVPChartFormatter.registerCustomFormatters();
            this.iPreviousRowSpan = 0;
            this.iRowSpan = 0;
            this.bResized = false;
            this.bdataLoadedToEnableAddToInsight = false;
        },
        onBeforeRendering: function () {
            if (this.bCardProcessed) {
                return;
            }
            var bODataV4 = CommonUtils.isODataV4(this.getModel());
            ChartUtils.validateCardConfiguration(this, bODataV4);
            var vizFrame = this.getView().byId("analyticalChart");
            var oCompData = this.getOwnerComponent().getComponentData();
            if (vizFrame) {
                vizFrame.setHeight("21rem");
            }
            if (
                this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable" &&
                oCompData &&
                oCompData.appComponent
            ) {
                var oDashboardLayoutUtil = oCompData.appComponent.getDashboardLayoutUtil();
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(
                    oCompData.cardId
                );
                if (oCard.dashboardLayout.autoSpan && vizFrame) {
                    vizFrame.setHeight("21rem");
                }
            }

            var vbLayout = this.getView().byId("vbLayout");
            var navigation;
            var isVizPropSet = false;
            var oDataSet = new FlattenedDataset({
                data: {
                    path: "/"
                }
            });

            this.isVizPropSet = isVizPropSet;
            this.oDataSet = oDataSet;
            this.vizFrame = vizFrame;
            this.vbLayout = vbLayout;

            if (!vizFrame) {
                oLogger.error(
                    VizAnnotationManager.constants.ERROR_NO_CHART +
                    ": (" +
                    this.getView().getId() +
                    ")"
                );
            } else {
                this.vbLayout.setBusy(true);
                navigation = vizFrame.getModel("ovpCardProperties").getProperty("/navigation");
                //FIORITECHP1-6021 - Allow Disabling of Navigation from Graph
                if (
                    navigation === undefined ||
                    navigation == "datapointNav" ||
                    navigation != "headerNav"
                ) {
                    if (bODataV4) {
                        VizAnnotationManagerV4.getSelectedDataPoint(vizFrame, this);
                    } else {
                        VizAnnotationManager.getSelectedDataPoint(vizFrame, this);
                    }
                }
                vizFrame.destroyDataset();
                var binding = vizFrame.getParent().getBinding("data");

                this._handleKPIHeader();

                if (binding && binding.getPath()) {
                    binding.attachDataReceived(this.onDataReceived.bind(this));
                    binding.attachDataRequested(this.onDataRequested.bind(this));
                } else {
                    Fragment.load("sap.ovp.cards.charts.generic.noData").then(
                        function (oControl) {
                            var cardContainer = this.getCardContentContainer();
                            cardContainer.removeAllItems();
                            cardContainer.addItem(oControl);
                        }.bind(this)
                    );
                }

                vizFrame.addEventDelegate({
                    onmouseover: function () {
                        var vizTooltip = vizFrame._oOvpVizFrameTooltip;
                        if (vizTooltip) {
                            vizTooltip._oPopup.close();
                        }
                    }
                });
            }
            this.bCardProcessed = true;
        },

        onAfterRendering: function () {
            CardController.prototype.onAfterRendering.apply(this, arguments);
            var iRowSpan = this.iRowSpan;
            if (
                !OVPCardAsAPIUtils.checkIfAPIIsUsed(this) &&
                this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable"
            ) {
                var oCard = this.oDashboardLayoutUtil.dashboardLayoutModel.getCardById(this.cardId);
                var sCardId = this.oDashboardLayoutUtil.getCardDomId(this.cardId);
                //BCP 2380079589 Adding this to prevent card getting collapsed after clicking ok from manage cards
                if (!this.bResized) {
                    oCard.dashboardLayout.rowSpan = Math.max(oCard.dashboardLayout.rowSpan, iRowSpan);
                    this.iRowSpan = oCard.dashboardLayout.rowSpan;
                }
                var element = document.getElementById(sCardId);
                var iHeaderHeight = this.getHeaderHeight();
                if (!oCard.dashboardLayout.autoSpan) {
                    if (element) {
                        var ovpWrapper = element.getElementsByClassName("sapOvpWrapper")[0];
                        if (ovpWrapper) {
                            ovpWrapper.style.height =
                                oCard.dashboardLayout.rowSpan *
                                this.oDashboardLayoutUtil.ROW_HEIGHT_PX +
                                2 -
                                (iHeaderHeight + 2 * this.oDashboardLayoutUtil.CARD_BORDER_PX) +
                                "px";
                        }
                    }
                }
                if (oCard.dashboardLayout.showOnlyHeader) {
                    element.classList.add("sapOvpMinHeightContainer");
                }
                var vizCard = this.getView().byId("analyticalChart");
                if (vizCard) {
                    vizCard.setHeight(this._calculateVizFrameHeight() + "px");
                    this._calculateWidth();
                    vizCard.attachBrowserEvent("click", this.updateControlPressed.bind(this));
                }
            }
        },

        onDataRequested: function () {
            this.vbLayout.setBusy(true);
        },

        getCardItemsBinding: function () {
            var vizFrame = this.getView().byId("analyticalChart");
            if (vizFrame && vizFrame.getParent()) {
                return vizFrame.getParent().getBinding("data");
            }

            return null;
        },

        /**
         * Method called upon when card is resized manually
         *
         * @method resizeCard
         * @param {Object} newCardLayout - new card layout after resize
         */
        resizeCard: function (newCardLayout) {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            this.newCardLayout = newCardLayout;
            oCardPropertiesModel.setProperty("/cardLayout/rowSpan", newCardLayout.rowSpan);
            oCardPropertiesModel.setProperty("/cardLayout/colSpan", newCardLayout.colSpan);
            var oCardLayout = this.getCardPropertiesModel().getProperty("/cardLayout");
            var iHeaderHeight = this.getHeaderHeight();
            //Set the height of cardContentContainer
            var setCardContentContainerHeight = this.getView()
                .getDomRef()
                .querySelectorAll(".sapOvpWrapper");
            for (var i = 0; i < setCardContentContainerHeight.length; i++) {
                setCardContentContainerHeight[i].style.height =
                    newCardLayout.rowSpan * oCardLayout.iRowHeightPx +
                    2 -
                    (iHeaderHeight + 2 * oCardLayout.iCardBorderPx) +
                    "px";
            }
            var vizCard = this.getView().byId("analyticalChart");
            var bubbleText = this.getView().byId("bubbleText");
            if (vizCard) {
                if (
                    vizCard.getVizType() === "timeseries_bubble" ||
                    vizCard.getVizType() === "bubble"
                ) {
                    if (oCardLayout.colSpan > 1) {
                        bubbleText.setVisible(false);
                    } else {
                        bubbleText.setVisible(true);
                    }
                }
                vizCard.setHeight(this._calculateVizFrameHeight() + "px");
                this._calculateWidth();
            }
            var oOvpContent = this.getView().byId("ovpCardContentContainer").getDomRef();
            if (oOvpContent) {
                if (!newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.remove("sapOvpContentHidden");
                } else {
                    oOvpContent.classList.add("sapOvpContentHidden");
                }
            }

            var bubbleSizeText = OvpResources.getText("BUBBLESIZE");
            this.oDataSet.bindData("analyticalmodel>/", "");
            this.vizFrame.setDataset(this.oDataSet);

            var handler = vizCard.getParent();
            var bODataV4 = CommonUtils.isODataV4(this.getModel());
            if (!this.isVizPropSet) {
                if (bODataV4) {
                    VizAnnotationManagerV4.buildVizAttributes(vizCard, handler, this);
                } else {
                    VizAnnotationManager.buildVizAttributes(vizCard, handler, this);
                }
                this.isVizPropSet = true;
                if (bubbleText != undefined) {
                    var feeds = vizCard.getFeeds();
                    each(feeds, function (i, v) {
                        if (feeds[i].getUid() == "bubbleWidth") {
                            bubbleText.setText(bubbleSizeText + " " + feeds[i].getValues());
                        }
                    });
                }
                VizAnnotationManager.hideDateTimeAxis(vizCard);
            }

            VizAnnotationManager.reprioritizeContent(this.newCardLayout, vizCard, bODataV4);
            this.bResized = true;
        },

        /**
         * Method to calculate viz frame height
         *
         * @method _calculateVizFrameHeight
         * @return {Integer} iVizFrameHeight - Calculated height of the viz frame
         * For Fixed layout - 480 px
         * For resizable layout - Calculated according to the rowspan
         */
        _calculateVizFrameHeight: function () {
            var iVizFrameHeight;
            //For resizable layout calculate height of vizframe
            if (this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable") {
                var vizCard = this.getView().byId("analyticalChart");
                var oCard = this.oDashboardLayoutUtil.dashboardLayoutModel.getCardById(this.cardId);
               
                var oGenCardCtrl = this.getView().getController();
                var iDropDownHeight = this.getItemHeight(oGenCardCtrl, "toolbar");
                var iHeaderHeight = this.getHeaderHeight();
                var iBubbleTextHeight =
                    (vizCard.getVizType() === "timeseries_bubble" ||
                        vizCard.getVizType() === "bubble") &&
                        oCard.dashboardLayout.colSpan === 1
                        ? 43
                        : 0;
                // Viz container height = Card Container height + Border top of OvpCardContainer[1px--.sapOvpCardContentContainer] - (Header height + Card padding top and bottom{16px} +
                // View switch toolbar height + Height of the Chart text(if present) + Height of bubble chart text +
                // Padding top to  the card container[0.875rem -- .ovpChartTitleVBox] + Margin top to viz frame[1rem .ovpViz])
                var rowSpan = (Device.system.phone && this.iPreviousRowSpan > 0) ? this.iPreviousRowSpan : oCard.dashboardLayout.rowSpan;
                iVizFrameHeight = rowSpan * this.oDashboardLayoutUtil.ROW_HEIGHT_PX + 2 -
                    (iHeaderHeight +
                        2 * this.oDashboardLayoutUtil.CARD_BORDER_PX +
                        iDropDownHeight +
                        iBubbleTextHeight +
                        30);
                var cardId = vizCard.sId;
                var updatedVizHeight = this._calculateVizLegendGroupHeight(iVizFrameHeight);
                var oVizCard = this.getView().byId(cardId);
                if (oVizCard) {
                    oVizCard.setVizProperties(updatedVizHeight);
                }
            } else {
                iVizFrameHeight = Rem.toPx(21);
            }
            return iVizFrameHeight;
        },

        /**
         * Method to update the height of the viz frame in Donut.
         * @method _calculateVizLegendGroupHeight
         * @param {Integer} iVizFrameHeight - Height of Vizframe.
         * @return {Object} updatedVizHeight
         *
         */

        _calculateVizLegendGroupHeight: function (iVizFrameHeight) {
            var layoutHeight;
            //The layoutHeight for legendGroup is calculated based on the iVizFrameHeight.
            //The donutHeight is set to 240 (donut chart limit) to maintain a stable donut chart height and to calculate the legend group height dynamically based on it.
            //The iVizFrameHeight with less than or equal to 270 is to have the donut chart with the max limit possible.
            //Thus maintains the ratios b/w the donut chart and the legend group in the vizFrame when vertically expanded.
            if (iVizFrameHeight <= 270) {
                layoutHeight = 0.1;
            } else {
                var donutHeight = 240;
                layoutHeight = (iVizFrameHeight - donutHeight) / iVizFrameHeight;
            }
            var updatedVizHeight = {
                legendGroup: {
                    layout: {
                        height: layoutHeight
                    }
                }
            };
            return updatedVizHeight;
        },

        /**
         * Method to calculate width for viz
         *
         * @method _calculateWidth
         */
        _calculateWidth: function () {
            var oCard = this.oDashboardLayoutUtil.dashboardLayoutModel.getCardById(this.cardId);
            var vizCard = this.getView().byId("analyticalChart");
            if (oCard) {
                var cardWidth = parseInt(oCard.dashboardLayout.width, 10);
                var chartType = vizCard.getVizType();
                var cardId = vizCard.sId;
                if (chartType === "donut") {
                    var updatedVizWidth = this._calculateVizLegendGroupWidth(cardWidth);
                    var oVizCard = this.getView().byId(cardId);
                    if (oVizCard) {
                        oVizCard.setVizProperties(updatedVizWidth);
                    }
                }
            }
        },

        /**
         * Method to update the width of the viz frame in Donut.
         * @method _calculateVizLegendGroupWidth
         * @param {Integer} cardWidth - width of the card
         * @return {Object} updatedVizWidth
         *
         */
        _calculateVizLegendGroupWidth: function (cardWidth) {
            var layoutWidth;
            if (cardWidth <= 600) {
                layoutWidth = 0.25;
            } else if (cardWidth <= 900) {
                layoutWidth = 0.55;
            } else if (cardWidth >= 1200) {
                layoutWidth = 0.7;
            } else {
                layoutWidth = 0.65;
            }
            var updatedVizWidth = {
                legendGroup: {
                    layout: {
                        maxWidth: layoutWidth
                    }
                }
            };
            return updatedVizWidth;
        },

        /**
         * Method to refresh the view after drag completion
         *
         * @method refreshCard
         */
        refreshCard: function () {
            this.getView().invalidate();
        },

        onShowInsightCardPreview: function() {
            var oCardView = this.getView();
            var oCardController = oCardView.getController();
            var oCardComponentData = oCardController.oCardComponentData;
            var that = this;

            if (this.checkIBNNavigationExistsForCard()) {
                IntegrationCard.showCard({
                    vizFrame: oCardController.vizFrame,
                    entitySet: oCardController.entitySet,
                    entityType: oCardController.entityType,
                    cardComponentName: "Analytical",
                    cardComponentData: oCardComponentData,
                    cardComponent: oCardController.oCardComponent,
                    view: oCardView
                }).then(function(oCardManifestConfiguration) {
                    that.saveGeneratedCardManifest(oCardManifestConfiguration); // Saving the manifest will be handled in card controller.
                });
            } else {
                MessageBox.error(OvpResources.getText("INT_IBN_NAVIGATION_NOT_FOUND_ERROR_MESSAGE_TEXT"));
            }
        }
    });
}
);
