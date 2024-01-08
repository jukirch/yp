sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/util/extend",
    "sap/m/MessageBox",
	"sap/suite/ui/generic/template/lib/insights/InsightsCardHelper"
], function(BaseObject, extend, MessageBox, InsightsCardHelper) {
    'use strict';
    function getMethods(oState, oController, oTemplateUtils) {

        var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
        var oTemplatePrivateGlobalModel = oTemplateUtils.oComponentUtils.getTemplatePrivateGlobalModel();
        var oInsightsInstance = oTemplatePrivateGlobalModel.getProperty("/generic/insights/oInsightsInstance");

        /**
         * This function can be called by any InsightsHandler instance to add the card that the user wants to share
         * @param {*} oInsightsCardProvider single insight instance which is shared across the application
         * @param {*} oCard card that will be provided by the component (LR/ALP/OP) to the provider
         *
         */
        function fnAddCardsToShare(oInsightsCardProvider , oCard) {
            var sCardTitle;
            var sViewId = oController.getView().getId();
            // The below if else block is to determine the card header. Since the cards are added early before the table is intialized the title is
            // fetched from the HeaderInfo annotation of the entity set.
            if (oState.oPresentationControlHandler) {
                var sEntitySet;
                var oMetaModel = oController.getOwnerComponent().getModel().getMetaModel();
                if (oState.oPresentationControlHandler.getEntitySet) { // getEntitySet is empty in case of multiview scenario.
                    sEntitySet = oState.oPresentationControlHandler.getEntitySet();
                } else {
                    sEntitySet = oController.getOwnerComponent().getEntitySet();
                }
                var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
                var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                sCardTitle  = oEntityType['com.sap.vocabularies.UI.v1.HeaderInfo'] && oEntityType['com.sap.vocabularies.UI.v1.HeaderInfo'].TypeNamePlural;
            } else {
                // For instances where the cards can be added later i.e when the table is loaded then the toolbar title can be used.
                var oToolbar = oState && oState.oPresentationControlHandler && oState.oPresentationControlHandler.getToolbar();
                sCardTitle = oToolbar ? oToolbar.getTitleControl() && oToolbar.getTitleControl().getText() : "";
            }
            // For now simply override the card
            oCard = {
                "sap.app" : {
                    id : oController.getOwnerComponent().getId() + "-" + new Date().getTime()
                },
                "sap.card" : {
                    "header" : {
                        "title" : sCardTitle
                    }
                }
            };
            oInsightsCardProvider.sharedCards.push(oCard);
            //updating the same card to the global model so that the addtional details can be used when card detail is requested from a card consumer.
            var oShareCard = Object.create(null);
            extend(oShareCard,oCard);
            oShareCard.cardType = oCard.cardType;
            oShareCard.viewId = sViewId;
            oTemplatePrivateGlobalModel.setProperty("/generic/insights/shareCards", [oShareCard]);
        }


        function isCardCreationAllowed(oState) {
            return InsightsCardHelper.isCardCreationAllowed(oState);
        }

        /**
         * This method is relevant for table and list card types
         * @param {*} oEntityType
         * @returns
         */
        function fnCheckSimpleTableColumns (oEntityType) {
            var oMetaModel = oState.oPresentationControlHandler.getModel().getMetaModel();
            return oState.oPresentationControlHandler.getVisibleProperties().some(function (oColumn) {
                var oProperty = oMetaModel.getODataProperty(oEntityType, oColumn.data("p13nData").leadingProperty);
                if (oTemplateUtils.oCommonUtils.isSupportedColumn(oColumn, oProperty) &&
                   (oProperty &&  (oProperty["sap:label"] || oProperty['com.sap.vocabularies.Common.v1.Label']) && oColumn.getVisible())) {
                    return true;
                }
            });
        }

        function fnGetCardCreationFailureMessage(sType, oRb, oEntityType) {
            var sErrorMessage = "";
            if (sType === InsightsCardHelper.CardTypes.ANALYTICAL && !isCardCreationAllowed(oState)) {
                sErrorMessage = oRb.getText("ST_CARD_CREATION_FAILURE_REASON_SEMANTIC_DATE_FILTERS");
            } else if (sType === InsightsCardHelper.CardTypes.TABLE) {
                if (!isCardCreationAllowed(oState) || !fnCheckSimpleTableColumns(oEntityType)) {
                    sErrorMessage = oRb.getText("ST_CARD_CREATION_FAILURE") + "\n" + oRb.getText("ST_CARD_CREATION_FAILURE_INFO") +
                    "\n" + oRb.getText("ST_CARD_FAILURE_REASON_SEMANTIC_DATE_FILTERS") + "\n" + oRb.getText("ST_CARD_FAILURE_TABLE_REASON_UNSUPPORTED_COLUMNS");
                }
                // sErrorMessage = oRb.getText("ST_CARD_CREATION_FAILURE") + "\n" + oRb.getText("ST_CARD_CREATION_FAILURE_INFO");
                // if (!isCardCreationAllowed(oState)) {
                //     sErrorMessage = sErrorMessage +  "\n" + oRb.getText("ST_CARD_FAILURE_REASON_SEMANTIC_DATE_FILTERS");
                // }
                // if (!fnCheckSimpleTableColumns(oEntityType)) {
                //     sErrorMessage = sErrorMessage +  "\n" + oRb.getText("ST_CARD_FAILURE_TABLE_REASON_UNSUPPORTED_COLUMNS");
                // }
            }
            return sErrorMessage.length === 0 ? false : sErrorMessage;
        }

        function fnPrepareAndShowCard(oEvent, sType, oPresentationControlHandler, mAdditionalProperties) {

            var oPresentationControlHandler = oPresentationControlHandler || oState.oPresentationControlHandler;
            var oModel = oPresentationControlHandler.getModel();
            var sEntitySet = oPresentationControlHandler.getEntitySet();
            var oMetaModel = oModel.getMetaModel();
            var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
            var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
            var oComponent = oController.getOwnerComponent();
            var oRb = oComponent.getModel("i18n").getResourceBundle();
            
            function fnPrepareCardDefinition() {
                var oView = oController.getView();
                var oCardDefinition = {};
                oCardDefinition.currentControlHandler = oPresentationControlHandler;
                oCardDefinition.component = oComponent;
                oCardDefinition.view = oView;
                oCardDefinition.entitySet = oEntitySet;
                oCardDefinition.entityType = oEntityType;
                oCardDefinition.oSmartFilterbar = oState.oSmartFilterbar;
                oCardDefinition.oTemplateUtils = oTemplateUtils;
                var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
                var vDraftState = oTemplatePrivateModel.getProperty("/listReport/vDraftState");
                if (vDraftState && Number(vDraftState)) {
                    oCardDefinition.oFECustomFilterData = {
                        name: "IsActiveEntity",
                        value: vDraftState
                    };
                }
                return oCardDefinition;
            }

            var fnPublishCardToInsightsChannel = function(oEvent) {
                var oCardManifest = oEvent.getSource().getManifest(); // This will be changed to oEvent.getParameter("manifest");
                var oInsightsCardProvider = oTemplateUtils.oServices.oInsightsCardProvider.getCardProviderInsightsInstance();
                oInsightsCardProvider.channel.publishCard(oInsightsCardProvider.id, oCardManifest, mAdditionalProperties.consumerId);
            };

            var sCardCreationFailureMessage = fnGetCardCreationFailureMessage(sType, oRb, oEntityType);
            if (!sCardCreationFailureMessage) {
                var oCardMessageInfo = {};
                var oCardManifest = InsightsCardHelper.createCardForPreview(fnPrepareCardDefinition());
                if (oTemplatePrivateModel.getProperty("/listReport/bSupressCardRowNavigation")) {
                    oCardMessageInfo.text = oRb.getText("ST_CARD_NAVIGATION_FAILURE_INFO");
                }
                 // To act as a card provider the final manifest is shared back via callback which is publish to the card channel
                 if (mAdditionalProperties && mAdditionalProperties.sendManifestToCardConsumer) {
                    var sInsightsDialogCustomActionText = oRb.getText("ST_SEND_CARD_TO_CHAT");
                    oInsightsInstance.showCardPreview(oCardManifest, true, oCardMessageInfo, sInsightsDialogCustomActionText, fnPublishCardToInsightsChannel);
                } else {
                    oInsightsInstance && oInsightsInstance.showCardPreview(oCardManifest, true, oCardMessageInfo);
                }
            } else {
                MessageBox.error(sCardCreationFailureMessage);
            }
        }

        return {
            prepareAndShowCard : fnPrepareAndShowCard,
            addCardsToShare : fnAddCardsToShare
        };
    }

    return BaseObject.extend("sap.suite.ui.generic.template.lib.InsightsCardHandler", {
		constructor: function (oState, oController, oTemplateUtils) {
			extend(this, getMethods(oState, oController, oTemplateUtils));
		}
	});
});