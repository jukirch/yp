
sap.ui.define([
    "sap/ui/base/Object", "sap/base/util/extend",
    "sap/insights/CardProvider"
], function(BaseObject, extend, CardProvider) {
    'use strict';
    /**
     * This class will act as a Generic Card provider. For each Application instance this class will exist if the Insights service is available.
     * The FE card provider instance has callbacks for the sap.insights.CardProvider and will pass the card details sharing request to the relevant InsightsHandler instance.
     */
    
    function getMethods(oTemplateContract) {
        var aShareCards = [] , sAppComponentId, oInsightsCardProvider,
        mCardProviders = {};

        /**
         * This method creates an instance of the insights card provider and it already takes care of registering this app to the "sap-insights" channel as a card provider.
         */
        function fnRegisterApplicationAsCardProvider() {
            sAppComponentId = oTemplateContract.oAppComponent.getId();
            oInsightsCardProvider = new CardProvider(sAppComponentId, aShareCards);
            oInsightsCardProvider.onCardRequested = onCardDetailsRequested;
        }
        /**
         * Each component can individually register as a card provider within the application (ex : List Report acts as a individual provider).
         * When a card is requested then the related provider is identified and card sharing logic is initiated.
         * @param {*} oInsightsHandler
         * @param {*} sComponentId
         */
        function fnRegisterComponentForProvider(oInsightsHandler, sComponentId) {
            mCardProviders[sComponentId] = oInsightsHandler;
        }
        /**
         * This method overrides the original method of insights card provider so that additional card details can be shared.
         */
        function onCardDetailsRequested(sConsumerId, sCardId) {
            var aShareCards = oTemplateContract.oTemplatePrivateGlobalModel.getProperty("/generic/insights/shareCards");
            var oCard = aShareCards.find(function(oCard) {
                return oCard["sap.app"].id === sCardId;
            });
            var oInsightsHandler = mCardProviders[oCard.viewId];
            oInsightsHandler.prepareAndShowCard(undefined, oCard.cardType, undefined, {
                sendManifestToCardConsumer : true,
                consumerId : sConsumerId
            });
        }
        function fnGetCardProviderInsightsInstance() {
            return oInsightsCardProvider;
        }
        return {
            fnRegisterApplicationAsCardProvider : fnRegisterApplicationAsCardProvider,
            fnRegisterComponentForProvider : fnRegisterComponentForProvider,
            getCardProviderInsightsInstance: fnGetCardProviderInsightsInstance
        };
    }
    return BaseObject.extend("sap.suite.ui.generic.template.lib.insights.CardProvider",{
        constructor: function(oTemplateContract) {
			extend(this, getMethods(oTemplateContract));
		}
    });
});
