/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/insights/CardHelper"
], function (BaseObject, CardHelper) {
    return BaseObject.extend("sap.insights.CardProvider", {


        /**
         * Constructor for the card provider.
         * @constructor
         * @param {string} sId unique ID to be used for registering the provider
         * @param {Array<sap.insights.CardsChannel.Card>} aCards An array containing available cards
         */
        constructor: function (sId, aCards) {
            CardHelper.getServiceAsync().then(function (service) {
                service.getCardsChannel().then(function (channel) {
                    if (channel.isEnabled()) {
                        this.channel = channel;
                        this.id = sId;
                        this.sharedCards = aCards;
                        this.consumers = {};
                        this._registerProvider();
                    }
                }.bind(this));
            }.bind(this));
        },

        /**
         * Register this instance as a card provider.
         * @private
         * @returns {Promise} a promise
         */
        _registerProvider: function () {
            if (this.channel) {
                return this.channel.registerProvider(this.id, this).then(function () {
                    this.registered = true;
                }.bind(this));
            }
        },

        /**
        * Unregister this instance as a card provider.
        * @private
        * @returns {Promise} a promise
        */
        _unregisterProvider: function () {
            if (this.channel) {
                return this.channel.unregister(this.id).then(function () {
                    this.registered = false;
                    this.consumers = {};
                    this.sharedCards = [];
                }.bind(this));
            }
        },

        /**
         * Share the list of available cards with all consumers or if provided, with a specific one.
         * @private
         * @param {string} sConsumerId optional target consumer id. if not provided it will be broadcasted to all
         */
        _shareAvailableCards: function (sConsumerId) {
            var aCardInfo = this.sharedCards.map(function (oCard) {
                return {
                    id: oCard.id,
                    title: oCard.descriptorContent["sap.card"].header.title,
                    parentAppId: oCard.descriptorContent["sap.insights"].parentAppId
                };
            });
            this.channel.publishAvailableCards(this.id, aCardInfo, sConsumerId);
        },

        /**
         * Event handler called by the cards channel when a cards consumer e.g. SAP Collaboration Manager is interested in cards.
         *
         * @param {string} sConsumerId id of the requesting consumer
         */
        onConsumerConnected: function (sConsumerId) {
            if (!this.consumers[sConsumerId]) {
                this.consumers[sConsumerId] = true;
                this._shareAvailableCards(sConsumerId);
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
         * Event handler called by the cards channel when a consumer is requesting a specific card.
         *
         * @param {string} sConsumerId id of the requesting consumer
         * @param {string} sCardId unique ID of available card
         */
        onCardRequested: function (sConsumerId, sCardId) {
            if (this.consumers[sConsumerId]) {
                var card = this.sharedCards.find(function (card) {
                    return card.id === sCardId;
                });
                if (card) {
                    this.publishCard(this.id, card, sConsumerId);
                }
            }
        },

        /**
         * Event handler called by the myhome controller when anything happened in the Insights section
         *
         * @param {boolean} bActive true if the home page is currently being rendered.
         * @param {Array<sap.insights.CardsChannel.Card>} aCards An array containing available cards
         *
         */
        onViewUpdate: function (bActive, aCards) {
            // register / unregister if the status of the home page changed
            if (this.registered !== bActive) {
                if (bActive) {
                    this._registerProvider().then(function () {
                        this.sharedCards = aCards;
                        this._shareAvailableCards();
                    }.bind(this));
                } else {
                    this._unregisterProvider();
                }
            } else {
                if (this.registered) {
                    this.sharedCards = aCards;
                    this._shareAvailableCards();
                }
            }
        }
    });
});
