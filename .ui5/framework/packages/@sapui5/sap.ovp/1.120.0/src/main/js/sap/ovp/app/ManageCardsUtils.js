/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/ui/fl/write/api/ControlPersonalizationWriteAPI",
    "sap/ui/core/Fragment",
    "sap/ovp/cards/PersonalizationUtils",
    "sap/ovp/cards/CommonUtils"
], function (
    BaseObject,
    JSONModel,
    ControlPersonalizationWriteAPI,
    Fragment,
    PersonalizationUtils,
    CommonUtils
) {
    "use strict";

    return BaseObject.extend("sap.ovp.app.ManageCardsUtils", {
        /**
         * constructor of the class
         * @memberOf sap.ovp.app.ManageCardsUtils
         * @param {sap.ui.core.mvc.Controller} controller
         */

        constructor: function (controller) {
            if (!controller) {
                throw new Error("Main Controller is required to initialize ManageCardsUtil");
            }
        },

        /**
         * Function for one time initialization once view is loaded
         * @memberOf sap.ovp.app.ManageCardsUtils
         */

        onManageCardsMenuButtonPress: function () {
            this.aManageCardsDialogModelState = [];
            var oMainController = CommonUtils.getApp();
            var that = this;
            var oManageCardsFragmentController = {
                onManageCardOkButtonPressed: function (oEvent) {
                    if (oEvent.getParameters().reason === 'Ok') {
                        var aP13nData = oMainController.byId("manageCardsSelectionPanel").getP13nData();
                        var aOrderedCards = oMainController.getUIModel().getProperty("/aOrderedCards");
                        var aVisibilityDeltaChanges = [];
                        var iDataLength = aP13nData.length;
                        for (var i = 0; i < iDataLength; i++) {
                            if (aP13nData[i].visible !== aOrderedCards[i].visible) {
                                aVisibilityDeltaChanges.push({
                                  changeType: "visibility",
                                  content: {
                                    cardId: aP13nData[i].id,
                                    visibility: aP13nData[i].visible
                                  },
                                  isUserDependent: true
                                });
                            }
                            aP13nData[i].visibility = aP13nData[i].visible;
                        }
                        oMainController.createOrDestroyCards.apply(oMainController, [that.aManageCardsDialogModelState, aP13nData, false]);
                        oMainController.getUIModel().setProperty("/aOrderedCards", aP13nData);
                        oMainController.updateDashboardLayoutCards(aP13nData);

                        var oOvpConfig = oMainController.getOwnerComponent().oOvpConfig,
                            bInsightRTEnabled = oOvpConfig && oOvpConfig.bInsightRTEnabled;
                        if (bInsightRTEnabled) {
                            oMainController.updateCardVisibiltyForCM(aP13nData);
                        }
                        oMainController.updateLayoutWithOrderedCards();
                        PersonalizationUtils.savePersonalization(aVisibilityDeltaChanges, oMainController.getView());
                        for (var i = 0; i < aP13nData.length; i++) {
                            var oCard = aP13nData[i];
                            var iCardIndex = oMainController.aErrorCards.indexOf(oCard.id);
                            if (iCardIndex > -1 && oCard.visibility == false) {
                                oMainController.aErrorCards.splice(iCardIndex, 1);
                            }
                        }
                        if (document.querySelector(".sapFAvatar")) {
                            document.querySelector(".sapFAvatar").focus();
                        }
                    }
                    // Destroy dialog instance when dialog is closed
                    var oSelectionPanelContainer = oMainController.byId("manageCardsSelectionPanel");
                    var oDialogContainer = oMainController.byId("manageCardsDialog");
                    if (oSelectionPanelContainer && oDialogContainer) {
                        oSelectionPanelContainer.destroy();
                        oDialogContainer.destroy();
                    }
                },
                onManageCardResetButtonPressed: function () {
                    var sLayoutName = oMainController.getLayout().getMetadata().getName();
                    var oUiModel = oMainController.getUIModel();
                    var aOrderedCards = oUiModel.getProperty("/aOrderedCards");
                    oMainController.createOrDestroyCards.apply(oMainController, [aOrderedCards, oMainController.aManifestOrderedCards, sLayoutName === "sap.ovp.ui.DashboardLayout" ? true : false]);
                    oUiModel.setProperty("/aOrderedCards", oMainController.aManifestOrderedCards);
                    oMainController.resetDashboardLayout();
                    oMainController.updateDashboardLayoutCards(oMainController.aManifestOrderedCards);
                    oMainController.updateLayoutWithOrderedCards();
                    that.manageCardsDialog.getModel().setProperty("/cards", oMainController.aManifestOrderedCards);
                    var aCardForDeletion = [];
                    for (var i = 0; i < aOrderedCards.length; i++) {
                        aCardForDeletion.push(oMainController.getView().byId(aOrderedCards[i].id));
                    }
                    var aCards = that.enhanceOrderedCardsForP13NDialog(aOrderedCards);
                    var oSelectionPanel = oMainController.byId("manageCardsSelectionPanel");
                    oSelectionPanel.setP13nData(aCards);
                    ControlPersonalizationWriteAPI.reset({
                        selectors: aCardForDeletion
                    }).finally(
                        function () {
                            if (document.querySelector(".sapFAvatar")) {
                                document.querySelector(".sapFAvatar").focus();
                            }
                        }
                    );
                }
            };

            this.oManageCardsFragment = Fragment.load({
                id: oMainController.getView().getId(),
                name: "sap.ovp.app.ManageCard",
                controller: oManageCardsFragmentController
            }).then(
                function (oControl) {
                    that.manageCardsDialog = oControl;
                    var aOrderedCards = oMainController.getUIModel().getProperty("/aOrderedCards");
                    var oManageCardsDialogModel = Object.assign([], aOrderedCards);
                    that.aManageCardsDialogModelState = that.getManageCardsDialogModelState(aOrderedCards);
                    var oModel = new JSONModel({
                        cards: oManageCardsDialogModel
                    });
                    that.manageCardsDialog.setModel(oModel);
                    oMainController.getView().addDependent(that.manageCardsDialog);
                    that.openManageCardsDialog(aOrderedCards);
                }
            );
        },

        openManageCardsDialog: function (aOrderedCards) {
            var oMainController = CommonUtils.getApp();
            var aCards = this.enhanceOrderedCardsForP13NDialog(aOrderedCards);
            var oPopup = oMainController.byId("manageCardsDialog");
            var oSelectionPanel = oMainController.byId("manageCardsSelectionPanel");
            oSelectionPanel.setP13nData(aCards);
            oPopup.open();
        },

        /**
        * Add visible, name and label property to each card object in aOrderedCards for P13N dialog.
        * 
        * @param {Array} aOrderedCards array of card objects having properties of id, visibility
        * @returns {Array} OrderedCards array enhanced with visible, name and label property.
        */

        enhanceOrderedCardsForP13NDialog: function (aOrderedCards) {
            var aVisibleCardIds = [];
            var oMainController = CommonUtils.getApp();
            aOrderedCards.forEach(function (card) {
                aVisibleCardIds.push(card["id"]);
            });
            var aCardsModel = oMainController._getCardsModel();
            var aVisibleCardsForLayout = [];
            var sLayoutName = oMainController.getLayout().getMetadata().getName();
            if (sLayoutName === "sap.ovp.ui.DashboardLayout") {
                var aCards = oMainController._getCardArrayAsVariantFormatDashboard();
                aCards.forEach(function (card) {
                    var oCard = aCardsModel.find(function (oElement) {
                        return oElement.id === card.id;
                    });
                    if (aVisibleCardIds.indexOf(card.id) != -1) {
                        aVisibleCardsForLayout.push({
                            id: card.id,
                            visibility: card.visibility,
                            visible: card.visibility,
                            name: card.id,
                            label: oCard.settings.title
                        });
                    }
                });
                aOrderedCards = aVisibleCardsForLayout;
            } else if (sLayoutName === "sap.ovp.ui.EasyScanLayout") {
                var aContent = oMainController.getLayout().getContent();
                var aCardsModel = oMainController._getCardsModel();
                aContent.forEach(function (content) {
                    var id = content.getId();
                    var cardId = id.split("--").pop();
                    var oCard = aCardsModel.find(function (oElement) {
                        return oElement.id === cardId;
                    });
                    if (aVisibleCardIds.indexOf(cardId) != -1) {
                        aVisibleCardsForLayout.push({
                            id: cardId,
                            visibility: content.getVisible(),
                            visible: content.getVisible(),
                            name: cardId,
                            label: oCard.settings.title
                        });
                    }
                });
                aOrderedCards = aVisibleCardsForLayout;
            }
            this.aManageCardsDialogModelState = this.getManageCardsDialogModelState(aOrderedCards);
            oMainController.getUIModel().setProperty("/aOrderedCards", aOrderedCards);
            this.manageCardsDialog.getModel().setProperty("/cards", aOrderedCards);
            return aOrderedCards;
        },

        /**
        * Store current state of cards to compare with the new state for createOrDestroyCards method
        * 
        * @param {Array} aCardArray 
        * @returns {Array} Cards array with the new state
        */

        getManageCardsDialogModelState: function (aCardArray) {
            var aCardsArray = [];
            for (var i = 0; i < aCardArray.length; i++) {
                aCardsArray.push({
                    id: aCardArray[i].id,
                    visibility: aCardArray[i].visibility
                });
            }
            return aCardsArray;
        }
    });
});