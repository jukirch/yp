/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/Card.controller",
    "sap/ui/thirdparty/jquery",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/app/OVPUtils",
    "sap/ovp/app/OVPLogger",
    "sap/ui/core/Core",
    "sap/ovp/insights/IntegrationCard",
    "sap/m/MessageBox",
    "sap/ovp/app/resources",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/cards/ViewCacheHelper"
], function (
    CardController,
    jQuery,
    OVPCardAsAPIUtils,
    CommonUtils,
    OVPUtils,
    OVPLogger,
    Core,
    IntegrationCard,
    MessageBox,
    OvpResources,
    NavigationHelper,
    ViewCacheHelper
) {
    "use strict";

    var oLogger = new OVPLogger("ovp.cards.generic.base.table.BaseTable");

    return CardController.extend("sap.ovp.cards.generic.base.table", {
        bdataLoadedToEnableAddToInsight: false,
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            CardController.prototype.onInit.apply(this, arguments);
        },

        onColumnListItemPress: function (oEvent) {
            var sNavMode = OVPUtils.bCRTLPressed ? OVPUtils.constants.explace : OVPUtils.constants.inplace;
            OVPUtils.bCRTLPressed = false;
            /*
             On Content click of OVP Cards used as an API in other Applications
             */
            if (OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                if (this.checkAPINavigation()) {
                    //The function is only called when there is a valid semantic object and action is available
                    CommonUtils.onContentClicked(oEvent);
                }
            } else {
                var aNavigationFields = NavigationHelper.getEntityNavigationEntries(
                    oEvent.getSource().getBindingContext(),
                    this.getModel(),
                    this.getEntityType(),
                    this.getCardPropertiesModel(),
                    this.getCardPropertiesModel().getProperty("/annotationPath")
                );
                this.doNavigation(oEvent.getSource().getBindingContext(), aNavigationFields[0], sNavMode);
            }
        },

        //function to open quick view popover to show contact information
        /*
         <Vbox>                             --- parent
         <ContactDetailFragmentPopover>  --- [0]th child
         <Link>                          --- [1]st child
         <Vbox>
         here on click of link we are taking binding context path and binding it to contact detail fragment
         */
        onContactDetailsLinkPress: function (oEvent) {
            if (this.oPopover) {
                this.oPopover.setVisible(false);
            }
            var oSource, oBindingContext;
            oSource = oEvent.getSource();
            this.oPopover = oSource.getParent().getAggregation("items")[0];
            oBindingContext = oSource.getBindingContext();
            if (!oBindingContext) {
                return;
            }
            this.oPopover.bindElement(oBindingContext.getPath());
            this.oPopover.setVisible(true);
            this.oPopover.openBy(oSource);
        },

        /**
         * Gets the card items binding object for the count footer
         */
        getCardItemsBinding: function () {
            var table = this.getView().byId("ovpTable");
            return table.getBinding("items");
        },

        onAfterRendering: function () {
            CardController.prototype.onAfterRendering.apply(this, arguments);
            var oCompData = this.getOwnerComponent().getComponentData();
            var oCardPropertiesModel = this.getCardPropertiesModel();
            var oTable = this.getView().byId("ovpTable");
            if (
                !OVPCardAsAPIUtils.checkIfAPIIsUsed(this) &&
                oCardPropertiesModel.getProperty("/layoutDetail") === "resizable"
            ) {
                var oCard = this.oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                var iHeaderHeight = Math.max(oCard.dashboardLayout.headerHeight, this.getHeaderHeight());
                var sCardId = this.oDashboardLayoutUtil.getCardDomId(oCompData.cardId);
                var element = document.getElementById(sCardId);

                if (!oCard.dashboardLayout.autoSpan) {
                    element.getElementsByClassName("sapOvpWrapper")[0].style.height =
                        oCard.dashboardLayout.rowSpan * this.oDashboardLayoutUtil.ROW_HEIGHT_PX +
                        1 -
                        (iHeaderHeight + 2 * this.oDashboardLayoutUtil.CARD_BORDER_PX) +
                        "px";
                }
                if (oCard.dashboardLayout.showOnlyHeader) {
                    element.classList.add("sapOvpMinHeightContainer");
                }
                //For resizable card layout show the no of columns based upon colspan
                this.addColumnInTable(jQuery(element), {
                    colSpan: oCard.dashboardLayout.colSpan
                });
            } else {
                var aAggregation = oTable.getAggregation("columns");
                //For fixed card layout show only 3 columns
                for (var iCount = 0; iCount < 3; iCount++) {
                    if (aAggregation[iCount]) {
                        aAggregation[iCount].setStyleClass("sapTableColumnShow").setVisible(true);
                    }
                }
            }
            var oBindingInfo = this.getCardItemsBinding();
            if (oBindingInfo && oBindingInfo.getPath()) {
                oBindingInfo.attachDataReceived(this.onDataReceived.bind(this));
            }

            if (oTable) {
                oTable.attachBrowserEvent("click", this.updateControlPressed.bind(this));
            }
        },

        onDataReceived: function() {
            this.bdataLoadedToEnableAddToInsight = true;
        },
        /**
         * Gets the card items binding info
         */
        getCardItemBindingInfo: function () {
            var oList = this.getView().byId("ovpTable");
            return oList.getBindingInfo("items");
        },

        /**
         * Handles no of columns to be shown in table when view-switch happens
         *
         * @method addColumnInTable
         * @param {String} sCardId - Card Id
         * @param {Object} oCardResizeData- card resize properties
         */
        addColumnInTable: function ($card, oCardResizeData) {
            if (oCardResizeData.colSpan >= 1) {
                if (jQuery($card).find("tr").length != 0) {
                    var table = Core.byId(jQuery($card).find(".sapMList").attr("id"));
                    var aggregation = table.getAggregation("columns");
                    var iColSpan = oCardResizeData.colSpan;
                    // No of columns to be shown calculated based upon colspan
                    var iIndicator = iColSpan + 1;
                    for (var i = 0; i < 6; i++) {
                        if (aggregation[i]) {
                            if (i <= iIndicator) {
                                //Show any particular column
                                aggregation[i].setStyleClass("sapTableColumnShow").setVisible(true);
                            } else {
                                //hide any particular column
                                aggregation[i].setStyleClass("sapTableColumnHide").setVisible(false);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Method called upon card resize
         *
         * @method resizeCard
         * @param {Object} newCardLayout- resize data of the card
         * @return {Object} cardSizeProperties - card properties
         */
        resizeCard: function (newCardLayout, cardSizeProperties) {
            var iNoOfItems, iAvailableSpace, iHeightWithoutContainer, iAvailableSpace;
            try {
                var $card = document.getElementById(this.oDashboardLayoutUtil.getCardDomId(this.cardId)),
                    oBindingInfo = this.getCardItemBindingInfo(),
                    iHeaderHeight = this.getHeaderHeight(),
                    oView = this.getView(),
                    oOvpContent = oView.byId("ovpCardContentContainer").getDomRef();
                if (newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.add("sapOvpContentHidden");
                    iNoOfItems = 0;
                } else {
                    oOvpContent.classList.remove("sapOvpContentHidden");
                    iHeightWithoutContainer = iHeaderHeight + cardSizeProperties.dropDownHeight;
                    iAvailableSpace =
                        newCardLayout.rowSpan * newCardLayout.iRowHeightPx - iHeightWithoutContainer - cardSizeProperties.itemHeight;
                    iNoOfItems = Math.abs(Math.floor(iAvailableSpace / cardSizeProperties.itemHeight));
                    $card.style.height = newCardLayout.rowSpan * newCardLayout.iRowHeightPx + "px";
                }
                oOvpContent.style.height =
                    newCardLayout.rowSpan * newCardLayout.iRowHeightPx - (iHeaderHeight + 2 * newCardLayout.iCardBorderPx) + "px";
                this.addColumnInTable(oView.getDomRef(), newCardLayout);
                if (iNoOfItems !== oBindingInfo.length) {
                    oBindingInfo.length = iNoOfItems;
                    newCardLayout.noOfItems = oBindingInfo.length;
                    this.getCardItemsBinding().refresh();
                    /**
                     * When a card with view switch is resized, it's view cache is not updated so binding length in the view cache remains the same.
                     * If the same view is selected again by view switch, card does not repect the new height and picks the number of items from the binding length of cache.
                     * This causes incorrect number of records on the card. To fix this behaviour, we need to delete all the view cache entries related to this card.
                     * During creation of the card (view switch, manage card's hide and show, page reload) view cache will be updated again
                     */
                    var aTabs = this.getCardPropertiesModel().getProperty("/tabs");
                    if (aTabs && aTabs.length > 0) {
                        ViewCacheHelper.clearViewCacheForTabbedCard(oView);
                    }
                } else {
                    //for resizing using keystrokes - to handle the case where the counter shows no value because the top condition is not met to refresh the card items binding
                    this._handleCountHeader();
                }
            } catch (error) {
                oLogger.warning("OVP resize: " + this.cardId + " catch " + error.toString());
            }
        },

        onExit: function () {
            CardController.prototype.onExit.apply(this, arguments);
        },
        
        onShowInsightCardPreview: function() {
            var oCardView = this.getView();
            var oCardController = oCardView.getController();
            var oCardComponentData = oCardController.oCardComponentData;
            var that = this;

            if (this.checkIBNNavigationExistsForCard()) {
                IntegrationCard.showCard({
                    entitySet: oCardController.entitySet,
                    entityType: oCardController.entityType,
                    cardComponentName: "Table",
                    cardComponentData: oCardComponentData,
                    cardComponent: oCardController.oCardComponent,
                    itemBindingInfo: that.getCardItemBindingInfo(),
                    view: oCardView
                }).then(function(oCardManifestConfiguration) {
                    that.saveGeneratedCardManifest(oCardManifestConfiguration); // Saving the manifest will be handled in card controller.
                });
            } else {
                MessageBox.error(OvpResources.getText("INT_IBN_NAVIGATION_NOT_FOUND_ERROR_MESSAGE_TEXT"));
            }
        }
    });
});
