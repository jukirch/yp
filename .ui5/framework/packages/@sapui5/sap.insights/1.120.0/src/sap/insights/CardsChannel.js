/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 * POC
 */
sap.ui.define(
	[
		"sap/ui/base/Object"
	],
	function (UI5Object) {
		"use strict";

		/**
		 * Interface required for classes that would like to provide cards using the <code>sap.insights.CardsChannel</code>.
		 *
		 * @name sap.insights.ICardProvider
		 * @interface
		 * @public
		 * @experimental
		 */

		/**
		 * Callback when a consumer is connected.
		 *
		 * @param {string} consumerId Unique id of the ICardsConsumer that offers cards
		 * @public
		 * @experimental
		 * @function
		 * @name sap.insights.ICardProvider.onConsumerConnected
		 */

		/**
		 * Callback when a consumer is disconnected.
		 *
		 * @param {string} consumerId Unique id of the ICardsConsumer that offers cards
		 * @public
		 * @experimental
		 * @function
		 * @name sap.insights.ICardProvider.onConsumerDisconnected
		 */

		/**
		 * Callback when a consumer requests a specific card.
		 *
		 * @param {string} consumerId Unique id of the ICardsConsumer that offers cards
		 * @param {string} cardId Unique id of a card
		 * @public
		 * @experimental
		 * @function
		 * @name sap.insights.ICardProvider.onCardRequested
		 */

		/**
		 * The card object
		 * @typedef {object} sap.insights.CardsChannel.Card
		 * @property {string} id - Unique identifier for the card.
		 * @property {Object} descriptorContent - manifest of the card.
		 * @experimental
		 * @public
		 */

		/**
		 * The cardInfo object
		 * @typedef {object} sap.insights.CardsChannel.CardInfo
		 * @property {string} id - Unique identifier for the card.
		 * @property {string} title - Title of the card.
		 * @property {string} parentAppId - Id of the parent app.
		 * @experimental
		 * @public
		 */

		/**
		 * Interface required for classes that would like to consume cards using the <code>sap.insights.CardsChannel</code>.
		 *
		 * @name sap.insights.ICardConsumer
		 * @interface
		 * @public
		 * @experimental
		 */

		/**
		 * Callback when cards are available.
		 *
		 * @param {string} providerId Unique id of the ICardsProvider that offers cards
		 * @param {object[]} cardInfos Array of simple objects with card information
		 * @public
		 * @experimental
		 * @function
		 * @name sap.insights.ICardConsumer.onCardsAvailable
		 */

		/**
		 * Callback when a card is created for this consumer.
		 *
		 * @param {string} providerId Unique id of the ICardsProvider that offers cards
		 * @param {object} card
		 * @public
		 * @experimental
		 * @function
		 * @name sap.insights.ICardConsumer.onCardProvided
		 */

		/**
		 * Constant: name of the use message broker channel.
		 */
		var INSIGHTS_CHANNEL = "sap-insights";

		/**
		 * Constant: supported message names
		 */
		var MSG = {
			available: "cardsAvailable",
			requested: "cardRequested",
			provided: "cardProvided",
			subscribed: "clientSubscribed"
		};

		/**
		 * MessageBroker implementation for iframes.
		 */
		function IframeMessageBroker() {
			this.subscribers = {};
			this.onMessage = function (message) {
				if (typeof message.data === "string") {
					var data = JSON.parse(message.data);
					if (data.type === "request") {
						if (data.body.channelId === INSIGHTS_CHANNEL && this.onNewMessage) {
							this.onNewMessage(data.body.clientId, data.body.channelId, data.body.messageName, data.body.data);
						} else if (this.onSubscriptionChange) {
							if (data.body.messageName === "clientSubscribed" && !this.subscribers[data.body.clientId]) {
								this.subscribers[data.body.clientId] = true;
								this.onSubscriptionChange(data.body.messageName, data.body.clientId, data.body.channels);
							} else if (data.body.messageName === "clientUnsubscribed" && this.subscribers[data.body.clientId]) {
								delete this.subscribers[data.body.clientId];
								this.onSubscriptionChange(data.body.messageName, data.body.clientId, data.body.channels);
							}
						}
					}
				}
			};

			this.connect = function (id) {
				return new Promise(function (resolve) {
					var onConnect = function (message) {
						if (typeof message.data === "string") {
							var data = JSON.parse(message.data);
							if (data.body.messageName === "connect") {
								window.removeEventListener("message", onConnect);
								resolve();
							}
						}
					};
					window.addEventListener("message", onConnect);
					window.parent.postMessage(JSON.stringify({
						type: "request",
						service: "sap.ushell.services.MessageBroker",
						"request_id": Date.now().toString(),
						body: {
							channelId: INSIGHTS_CHANNEL,
							clientId: id,
							"messageName": "connect"
						}
					}), "*");
				});
			};

			this.subscribe = function (id, channels, onNewMessage, onSubscriptionChange) {
				this.onNewMessage = onNewMessage;
				this.onSubscriptionChange = onSubscriptionChange;
				window.addEventListener("message", this.onMessage.bind(this));
				window.parent.postMessage(JSON.stringify({
					type: "request",
					service: "sap.ushell.services.MessageBroker",
					request_id: Date.now().toString(),
					body: {
						channelId: "sap.ushell.MessageBroker",
						clientId: id,
						messageName: "subscribe",
						subscribedChannels: channels
					}
				}), "*");
				return Promise.resolve();
			};

			this.publish = function (channelId, clientId, msgId, msgName, targetIds, data) {
				window.parent.postMessage(JSON.stringify({
					type: "request",
					service: "sap.ushell.services.MessageBroker",
					request_id: msgId,
					body: {
						channelId: channelId,
						clientId: clientId,
						messageName: msgName,
						targetClientIds: targetIds,
						data: data
					}
				}), "*");
				return Promise.resolve();
			};

			this.unsubscribe = function (id, channels) {
				delete this.onNewMessage;
				delete this.onSubscriptionChange;
				window.addEventListener("message", this.onMessage.bind(this));
				window.parent.postMessage(JSON.stringify({
					type: "request",
					service: "sap.ushell.services.MessageBroker",
					request_id: Date.now().toString(),
					body: {
						channelId: "sap.ushell.MessageBroker",
						clientId: id,
						messageName: "unsubscribe",
						subscribedChannels: channels
					}
				}), "*");
				return Promise.resolve();
			};

			this.disconnect = function (id) {
				window.removeEventListener("message", this.onMessage.bind(this));
				window.parent.postMessage(JSON.stringify({
					type: "request",
					service: "sap.ushell.services.MessageBroker",
					request_id: Date.now().toString(),
					body: {
						channelId: INSIGHTS_CHANNEL,
						clientId: id,
						"messageName": "disconnect"
					}
				}), "*");
				return Promise.resolve();
			}.bind(this);
		}

		function CardProviderWrapper(id, provider, broker) {
			this.onSubscriptionChange = function (msgName, clientId, channels) {
				if (id !== clientId && channels.find(function (channel) { return channel.channelId === INSIGHTS_CHANNEL; })) {
					if (msgName === "clientSubscribed") {
						provider.onConsumerConnected(clientId);
					} else if (msgName === "clientUnsubscribed") {
						provider.onConsumerDisconnected(clientId);
					}
				}
			};

			this.onNewMessage = function (clientId, channelId, msgName, data) {
				if (channelId === INSIGHTS_CHANNEL) {
					switch (msgName) {
						case MSG.subscribed:
							provider.onConsumerConnected(clientId);
							break;
						case MSG.requested:
							provider.onCardRequested(clientId, data);
							break;
						default:
							// nothing to do
							break;
					}
				}
			};

			this.register = function () {
				return broker.connect(id).then(function () {
					return broker.subscribe(id, [{ channelId: INSIGHTS_CHANNEL }], this.onNewMessage, this.onSubscriptionChange);
				}.bind(this));
			};
		}

		function CardConsumerWrapper(id, consumer, broker) {
			this.onSubscriptionChange = function (msgName, clientId, channels) {
				if (id !== clientId && channels.find(function (channel) { return channel.channelId === INSIGHTS_CHANNEL; })) {
					if (msgName === "clientSubscribed") {
						// announce to existing providers that a new consumer is available
						// FIXME: it doesn't work from an iframe
						broker.publish(INSIGHTS_CHANNEL, id, Date.now().toString(), MSG.subscribed, [clientId]);
					} else if (msgName === "clientUnsubscribed") {
						consumer.onCardsAvailable(clientId, []);
					}
				}
			};

			this.onNewMessage = function (clientId, channelId, msgName, data) {
				if (channelId === INSIGHTS_CHANNEL) {
					switch (msgName) {
						case MSG.available:
							consumer.onCardsAvailable(clientId, data);
							break;
						case MSG.provided:
							consumer.onCardProvided(clientId, data);
							break;
						default:
							// nothing to do
							break;
					}
				}
			};

			this.register = function () {
				return broker.connect(id).then(function () {
					return broker.subscribe(id, [{ channelId: INSIGHTS_CHANNEL }], this.onNewMessage, this.onSubscriptionChange);
				}.bind(this));
			};
		}

		/**
		 * Provides a communication between card providers and consumers in FLP and included iframes.
		 *
		 * @class
		 * @alias sap.insights.CardsChannel
		 * @public
		 * @experimental
		 */
		var CardsChannel = UI5Object.extend("sap.insights.CardsChannel", /** @lends sap.insights.CardsChannel.prototype */ {

			constructor: function() {
				this.clients = {};
			},

			/**
			 * Checks if the broker is enabled.
			 *
			 * @returns {boolean} true if the broker is enabled
			 * @experimental
			 * @public
			 */
			isEnabled: function () {
				return !!this.broker;
			},

			/**
			 * Initialize the CardsChannel either with the FLP message broker or an internal implementation for iframes.
			 *
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			init: function () {
				var brokerPromise;
				if (sap.ushell.Container) {
					brokerPromise = sap.ushell.Container.getServiceAsync("MessageBroker");
				} else {
					brokerPromise = Promise.resolve(new IframeMessageBroker());
				}
				return brokerPromise.then(function (broker) {
					this.broker = broker;
				}.bind(this));
			},

			/**
			 * Register a card provider with a unique id. The provider will be notified if new consumers get registered.
			 *
			 * @param {string} id Unique id of the provider
			 * @param {sap.insights.ICardProvider} provider Object implementing the ICardProvider interface
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			registerProvider: function (id, provider) {
				this.clients[id] = new CardProviderWrapper(id, provider, this.broker);
				return this.clients[id].register();
			},

			/**
			 * Register a card consumer with a unique id. The consumer will be notified through its callback when corresponding messages are received.
			 *
			 * @param {string} id Unique id of the consumer
			 * @param {sap.insights.ICardConsumer} consumer Implementation of the consumer
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			registerConsumer: function (id, consumer) {
				this.clients[id] = new CardConsumerWrapper(id, consumer, this.broker);
				return this.clients[id].register();
			},

			/**
			 * Send a list of all available cards to a given consumer or broadcast it to all consumers.
			 *
			 * @param {string} providerId .
			 * @param {sap.insights.CardsChannel.CardInfo[]} cardInfos .
			 * @param {string} consumerId .
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			publishAvailableCards: function (providerId, cardInfos, consumerId) {
				if (!consumerId) {
					consumerId = "*";
				}
				return this.broker.publish(INSIGHTS_CHANNEL, providerId, Date.now().toString(), MSG.available, [consumerId], cardInfos);
			},

			/**
			 * Request a card from a given provider.
			 *
			 * @param {string} consumerId .
			 * @param {string} cardId .
			 * @param {string} providerId .
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			requestCard: function (consumerId, cardId, providerId) {
				return this.broker.publish(INSIGHTS_CHANNEL, consumerId, Date.now().toString(), MSG.requested, [providerId], cardId);
			},

			/**
			 * Send a card to a given consumer or broadcast it to all consumers.
			 *
			 * @param {string} providerId .
			 * @param {sap.insights.CardsChannel.Card} card .
			 * @param {string} [consumerId] .
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			publishCard: function (providerId, card, consumerId) {
				if (!consumerId) {
					consumerId = "*";
				}
				return this.broker.publish(INSIGHTS_CHANNEL, providerId, Date.now().toString(), MSG.provided, [consumerId], card);
			},

			/**
			 * Unregister a previously registered consumer or provider.
			 *
			 * @param {string} id .
			 * @returns {Promise<void>} .
			 * @experimental
			 * @public
			 */
			unregister: function (id) {
				return this.broker.unsubscribe(id, [{ channelId: INSIGHTS_CHANNEL }]).then(function () {
					delete this.clients[id];
					return this.broker.disconnect(id);
				}.bind(this));
			},

			/**
			 * Unregister all clients and disconnect the broker.
			 *
			 * @returns {Promise<void>} A promise returning an array with the length of the unregistered clients.
			 */
			destroy: function() {
				var promises = [];
				for (var clientId in this.clients) {
					promises.push(this.unregister(clientId));
				}
				return Promise.all(promises).then(function() {
					delete this.broker;
				}.bind(this));
			}
		});

		return CardsChannel;
	}
);
