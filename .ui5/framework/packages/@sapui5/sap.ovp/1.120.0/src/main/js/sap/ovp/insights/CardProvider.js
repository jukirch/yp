/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/insights/IntegrationCard",
    "sap/insights/CardHelper"
], function (
    CommonUtils,
    IntegrationCard,
    CardHelper
) {
    "use strict";
    var mInsightCardProviders = {};
    var aInsightCards = [];

    return {

        /**
        * Initializes card provider and cache to a map i.e. mInsightCardProviders  
        * If the card provider already exists and has unregistered, then the function registers it again
        * 
        * @private
        * @param {string} sProviderID Unique ID of OVP App Component
        * 
        */
        init: function (sProviderID) {
            var oCardProvider = mInsightCardProviders[sProviderID];

            if (!oCardProvider) {
                return CardHelper.getServiceAsync().then(function (oServiceInstance) {
                    return oServiceInstance.getCardsChannel().then(function (oCardChannel) {
                        if (oCardChannel.isEnabled()) {
                            this.channel = oCardChannel;
                            this.id = sProviderID;
                            this.sharedCards = aInsightCards;
                            this.consumers = {};
                            return this.registerProvider().then(function() {
                                mInsightCardProviders[sProviderID] = Object.assign({}, this);
                                return this;
                            }.bind(this));
                        }
                    }.bind(this));
                }.bind(this));
            } else if (!oCardProvider.registered) {
                return oCardProvider.registerProvider().then(function () {
                    oCardProvider.shareAvailableCards();
                    return oCardProvider;
                });
            }
        },

        /**
         * Register this instance as a card provider.
         * @private
         * @returns {Promise} a promise
         */
        registerProvider: function () {
            if (this.channel) {
                return this.channel.registerProvider(this.id, this).then(function () {
                    this.registered = true;
                }.bind(this));
            }
        },

        /**
         * Event handler called by the cards channel when a cards consumer e.g. SAP Collaboration Manager is interested in cards.
         *
         * @param {string} sConsumerId id of the requesting consumer
         */
        onConsumerConnected: function (sConsumerId) {
            if (!this.consumers[sConsumerId]) {
                this.consumers[sConsumerId] = true;
                this.shareAvailableCards(sConsumerId);
            }
        },

        /**
         * Event handler called by the cards channel when a cards consumer e.g. SAP Collaboration Manager is not interested in cards anymore.
         *
         * @param {string} sConsumerId id of the requesting consumer
         */
        onConsumerDisconnected: function (sConsumerId) {
            if (this.consumers[sConsumerId]) {
                delete this.consumers[sConsumerId];
            }
        },

        /** 
        * Publishes the available cards to the card provider channel if at least one consumer exists
        * 
        * @private
        * @param {string} sConsumerId ID of the card consumer
        * 
        */
        shareAvailableCards: function (sConsumerId) {
            if (this.sharedCards.length !== aInsightCards.length) {
                this.sharedCards = aInsightCards;
            }
            this.channel.publishAvailableCards(this.id,  this.sharedCards, sConsumerId);  
        },

        /**
        * Publishes the requested integration card to the card provider channel
        * 
        * @private
        * @param {string} sConsumerId ID of the card consumer
        * @param {string} sCardId ID of the card for which the integration Card manifest is requested
        * 
        */
        onCardRequested: function (sConsumerId, sCardId) {
            if (this.consumers[sConsumerId]) {
                this.getCardDetails(sCardId).then(function(oCardManifest) {
                    this.channel.publishCard(this.id, oCardManifest, sConsumerId);
                }.bind(this));
            }
        },

        /**
        * Unregisters the current overview page application as a card provider
        * 
        * @private
        * @param {string} sProviderID Unique ID of OVP App Component
        * @returns {Promise} a promise
        */
        unregisterProvider: function(sProviderID) {
            aInsightCards = [];
            var oCardProvider = mInsightCardProviders[sProviderID];
            if (oCardProvider && oCardProvider.channel && oCardProvider.registered) {
                return oCardProvider.channel.unregister(oCardProvider.id).then(function () {
                    oCardProvider.registered = false;
                    oCardProvider.consumers = {};
                    oCardProvider.sharedCards = {};
                });
            }
        },

        /**
         * Generates and returns the integration card manifest for given id of the overview page card
         * 
         * @private
         * @param {string} sCardId
         * @returns {promise} Promise which resolves to an object consisting the id and descriptorContent as properties
         */
        getCardDetails: function (sCardId) {
            var oMainController = CommonUtils.getApp();
            var oCardComponent = oMainController && oMainController.getView().byId(sCardId).getComponentInstance(),
                oCardController = oCardComponent && oCardComponent.getRootControl() && oCardComponent.getRootControl().getController();

            var oCardDefinition = {
                entitySet: oCardController.entitySet,
                entityType: oCardController.entityType,
                cardComponentData: oCardController.oCardComponentData,
                cardComponent: oCardController.oCardComponent,
                view: oCardController.getView()
            };

            switch (oCardController.getView().getControllerName()) {
                case "sap.ovp.cards.list.List":
                case "sap.ovp.cards.v4.list.List":
                    oCardDefinition.cardComponentName = "List";
                    oCardDefinition.itemBindingInfo = oCardController.getCardItemBindingInfo();
                    break;

                case "sap.ovp.cards.table.Table":
                case "sap.ovp.cards.v4.table.Table":
                    oCardDefinition.cardComponentName = "Table";
                    oCardDefinition.itemBindingInfo = oCardController.getCardItemBindingInfo();
                    break;

                case "sap.ovp.cards.charts.analytical.analyticalChart":
                case "sap.ovp.cards.v4.charts.analytical.analyticalChart":
                    oCardDefinition.cardComponentName = "Analytical";
                    oCardDefinition.vizFrame = oCardController.vizFrame;
                    break;
            }

            return IntegrationCard.createManifestFor(oCardDefinition).then(function(oManifest) {
                return IntegrationCard.UpdateManifestDeltaChanges(oManifest, oCardDefinition).then(function(oUpdatedManifest) {
                    return {
                        id: sCardId,
                        descriptorContent: oUpdatedManifest
                    };
                });
            });
        },

        /**
         * @private
         * @param {string} sProviderID Unique ID of OVP App Component
         * Event handler called in cases where card visibility is changed from manage cards section
         */
        onViewUpdate: function (sProviderID) {
            var oCardProvider = mInsightCardProviders[sProviderID];
            if (oCardProvider && oCardProvider.registered) {
                oCardProvider.shareAvailableCards();
            }
        },

        /**
         * @private
         * Function to reset the property aInsightCards
         */
        resetInsightCards: function() {
            aInsightCards = [];
        },

        /**
         * Adds Insights enabled Cards to the array aInsightCards
         * 
         * @private
         * @param {object} oOvpCardPropertiesModel The OvpCardPropertiesModel set on the card
         * @param {string} sParentAppID Component id of ovp application
         */
        addInsightCard: function(oOvpCardPropertiesModel, sParentAppID) {
            var bInsightRTEnabled = oOvpCardPropertiesModel && oOvpCardPropertiesModel.getProperty("/bInsightRTEnabled"),
                bEnableAddToInsights = oOvpCardPropertiesModel && oOvpCardPropertiesModel.getProperty("/enableAddToInsights");

            if (bInsightRTEnabled && bEnableAddToInsights) {
                var sCardId = oOvpCardPropertiesModel.getProperty("/cardId"),
                    oMainController = CommonUtils.getApp(),
                    oCards = oMainController.getOwnerComponent().getOvpConfig().cards;
                if (oCards[sCardId]) {
                    aInsightCards.push({
                        title: oCards[sCardId].settings.title,
                        id: sCardId,
                        parentAppId: sParentAppID
                    });
                }
            }
        }
    };
}, /* bExport= */ true);