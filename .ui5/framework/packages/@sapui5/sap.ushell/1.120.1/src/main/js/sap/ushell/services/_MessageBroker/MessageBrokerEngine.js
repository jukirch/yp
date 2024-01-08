// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview This module contains the implementation of the message broker
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepExtend",
    "sap/ushell/components/applicationIntegration/application/PostMessageUtils"
], function (Log, deepExtend, PostMessageUtils) {
    "use strict";

    var bEnabled = true,
        oAcceptedOrigins = {},
        oClientsPerChannel = {},
        oConnectedClients = {},
        oSubscribedClients = {};

    //add default origin
    oAcceptedOrigins[window.location.origin] = true;

    var MessageBrokerEngine = function () {

        this.setEnabled = function (bVal) {
            bEnabled = bVal;
        };

        /**
         *
         * @param {object} oPostMessageData The PostMessage object.
         * @returns {Promise} Promise result.
         *
         * @since 1.110.0
         * @private
         */

        this.processPostMessage = function (oPostMessageData) {
            if (!bEnabled) {
                return Promise.reject();
            }

            var oMessageData = oPostMessageData.oMessageData,
                oMessageDataBody = oMessageData.body,
                oMessage = oPostMessageData.oMessage,
                sOrigin = oMessage.origin,
                oIframe = oMessage.source;

            oMessageDataBody.requestId = oMessageData.request_id;

            if (!oIframe) {
                var sErrorMsg = "Missing iframe object in PostMessage request";
                Log.error(sErrorMsg, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sErrorMsg);
            }

            return this._handlePostMessageRequest(oMessageDataBody, oIframe, sOrigin);
        };

        /**
         *
         * @param {string} sClientId client id.
         * @returns {Promise} the result.
         *
         * @since 1.110.0
         * @private
         */

        this.connect = function (sClientId) {
            var sError;

            if (!bEnabled) {
                return Promise.reject();
            }

            if (typeof sClientId !== "string" || !sClientId.length) {
                sError = "Missing required parameter client id";
            } else if (oConnectedClients[sClientId]) {
                sError = "Client is already connected";
            } else {
                // add client initial entry to connected clients
                oConnectedClients[sClientId] = true;
                return Promise.resolve();
            }

            Log.error(sError, null, "sap.ushell.services.MessageBroker");
            return Promise.reject(sError);
        };

        /**
         *
         * @param {string} sClientId client id.
         * @returns {Promise} the result.
         *
         * @since 1.110.0
         * @private
         */

        this.disconnect = function (sClientId) {
            var sError;

            if (!bEnabled) {
                return Promise.reject();
            }

            if (typeof sClientId !== "string" || !sClientId.length) {
                sError = "Missing required parameter client id";
            } else if (!oConnectedClients[sClientId]) {
                sError = "Client is already disconnected";
            } else {

                for (var sChannelKey in oClientsPerChannel) {

                    var aChannelClients = oClientsPerChannel[sChannelKey];
                    // find client and remove from the channel
                    for (var oClientKey in aChannelClients) {

                        var oClient = aChannelClients[oClientKey];

                        if (oClient.clientId === sClientId) {
                            aChannelClients.splice(oClientKey, 1);
                            break;
                        }
                    }
                }

                // if client disconnects but is still subscribed
                if (oSubscribedClients[sClientId] && oSubscribedClients[sClientId].channels.length) {
                    this._emitEvent("clientUnsubscribed", sClientId, oSubscribedClients[sClientId].channels);

                    // remove from subscribed clients
                    delete oSubscribedClients[sClientId];
                }
                // remove from connected clients
                delete oConnectedClients[sClientId];

                return Promise.resolve();
            }

            Log.error(sError, null, "sap.ushell.services.MessageBroker");
            return Promise.reject(sError);
        };

        /**
         *
         * @param {string} sClientId client id.
         * @param {array} aSubscribedChannels array of channel-objects.
         * @param {function} fnMessageCallback callback function returns promise.
         * @param {function} fnClientConnectionCallback callback function returns promise.
         * @param {object} oIframe iframe object if iframe client.
         * @param {string} sOrigin iframe origin if iframe client.
         * @returns {Promise} the result.
         *
         * @since 1.110.0
         * @private
         */

        this.subscribe = function (
            sClientId,
            aSubscribedChannels,
            fnMessageCallback,
            fnClientConnectionCallback,
            oIframe,
            sOrigin
        ) {
            var sError,
                sMessageName = "clientSubscribed",
                aOtherSubscribedClients = [],
                bIsNewClient = false;

            if (!bEnabled) {
                return Promise.reject();
            }

            if (typeof sClientId !== "string" || !sClientId.length ||
                !aSubscribedChannels.length ||
                (typeof oIframe !== "object" &&
                    (typeof fnMessageCallback !== "function" ||
                        typeof fnClientConnectionCallback !== "function"))) {
                sError = "Missing required parameter(s)";
            } else if (!oConnectedClients[sClientId]) {
                sError = "Client is not connected";
            } else {
                for (var sChannelKey in aSubscribedChannels) {

                    var oChannel = aSubscribedChannels[sChannelKey];

                    // add new client to the channel
                    var oFullClientData = {
                        clientId: sClientId,
                        subscribedChannels: aSubscribedChannels,
                        messageCallback: fnMessageCallback,
                        clientConnectionCallback: fnClientConnectionCallback,
                        iframe: oIframe || {},
                        origin: sOrigin || "",
                        isUI5: !oIframe
                    };

                    // add new channel
                    if (!oClientsPerChannel[oChannel.channelId]) {
                        oClientsPerChannel[oChannel.channelId] = [];
                    }

                    var oExistingClient = oClientsPerChannel[oChannel.channelId].find(function (oClient) {
                        return oClient.clientId === sClientId;
                    });

                    // add new client
                    if (!oExistingClient) {
                        oClientsPerChannel[oChannel.channelId].push(oFullClientData);
                    }

                    // if client is already subscribed to any channel
                    if (oSubscribedClients[sClientId]) {
                        var oExistingChannel = oSubscribedClients[sClientId].channels.find(function (oSubChannel) {
                            return oSubChannel.channelId === oChannel.channelId;
                        });

                        if (!oExistingChannel) {
                            // add new channel to the existing channels
                            oSubscribedClients[sClientId].channels.push(oChannel);
                        }
                    }
                }

                // if new client
                if (!oSubscribedClients[sClientId]) {

                    bIsNewClient = true;

                    var oSubscriptionData = {
                        clientId: sClientId,
                        channels: aSubscribedChannels
                    };
                    // add to subscribed clients
                    oSubscribedClients[sClientId] = oSubscriptionData;

                    aOtherSubscribedClients = Object.values(oSubscribedClients).filter(function (oClient) {
                        return oClient.clientId !== sClientId;
                    });
                }

                // notify other subscribed clients of new subscription
                if (Object.keys(oSubscribedClients).length > 1) {
                    this._emitEvent(sMessageName, sClientId, aSubscribedChannels);
                }

                if (bIsNewClient) {
                    // notify new client of other already subscribed clients
                    setTimeout(function () {
                        if (aOtherSubscribedClients.length) {
                            aOtherSubscribedClients.forEach(function (oClient) {
                                if (!oIframe) {
                                    fnClientConnectionCallback(sMessageName, oClient.clientId, oClient.channels);
                                } else {
                                    var oParams = {
                                        clientId: oClient.clientId,
                                        channels: oClient.channels,
                                        channelId: "sap.ushell.MessageBroker",
                                        messageName: sMessageName
                                    };

                                    var oMessageBody = this._buildPostMessageObject("event", oParams);
                                    PostMessageUtils.postMessageToIframeObject(oMessageBody, oIframe, sOrigin, false);
                                }
                            }.bind(this));
                        }
                    }.bind(this), 1000);
                }

                return Promise.resolve();
            }

            Log.error(sError, null, "sap.ushell.services.MessageBroker");
            return Promise.reject(sError);
        };

        /**
         *
         * @param {string} sClientId client id.
         * @param {array} aUnsubscribedChannels channels to unsubscribe from.
         * @returns {Promise} the resolve or error.
         *
         * @since 1.110.0
         * @private
         */

        this.unsubscribe = function (sClientId, aUnsubscribedChannels) {
            var sError;

            if (!bEnabled) {
                return Promise.reject();
            }

            if (typeof sClientId !== "string" || !sClientId.length ||
                !Array.isArray(aUnsubscribedChannels) || !aUnsubscribedChannels.length) {
                sError = "Missing required parameter(s)";
                Log.error(sError, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sError);
            }

            if (!oConnectedClients[sClientId]) {
                sError = "Client is not connected";
                Log.error(sError, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sError);
            }

            for (var sChannelIndex in aUnsubscribedChannels) {

                var oChannel = aUnsubscribedChannels[sChannelIndex];

                if (oClientsPerChannel[oChannel.channelId]) {
                    var aChannelClients = oClientsPerChannel[oChannel.channelId];
                    // find client and remove from the channel
                    for (var oClientKey in aChannelClients) {

                        var oClient = aChannelClients[oClientKey];

                        if (oClient.clientId === sClientId) {
                            var aSubscribedChannels = oSubscribedClients[sClientId].channels;

                            oSubscribedClients[sClientId].channels = aSubscribedChannels.filter(function (oSubChannel) {
                                return oSubChannel.channelId !== oChannel.channelId;
                            });

                            aChannelClients.splice(oClientKey, 1);
                            break;
                        }
                    }
                } else {
                    // if channel does not exist
                    var sMessage = "Unknown channel Id: " + oChannel.channelId;
                    Log.warning(sMessage, null, "sap.ushell.services.MessageBroker");
                }
            }

            this._emitEvent("clientUnsubscribed", sClientId, aUnsubscribedChannels);
            return Promise.resolve();
        };

        /**
         *
         * @param {string} sChannelId channel id.
         * @param {string} sClientId client id.
         * @param {string} sMessageId request id for iframe clients or message id for UI5 clients.
         * @param {string} sMessageName message name.
         * @param {array} aTargetClientIds array of target clients Ids.
         * @param {object} data additional data.
         * @returns {Promise} Promise result.
         *
         * @since 1.110.0
         * @private
         */

        this.publish = function (sChannelId, sClientId, sMessageId, sMessageName, aTargetClientIds, data) {
            var sError,
                aTargetClients = [];

            if (!bEnabled) {
                return Promise.reject();
            }

            // if client is not connected
            if (!oConnectedClients[sClientId]) {
                sError = "Client is not connected";
                Log.error(sError, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sError);
            }

            // if channel does not exist
            if (!oClientsPerChannel[sChannelId]) {
                sError = "Unknown channel Id: " + sChannelId;
                Log.error(sError, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sError);
            }

            var oPubClient = oClientsPerChannel[sChannelId].find(function (oSubClient) {
                return oSubClient.clientId === sClientId;
            });

            // if client is not subscribed to the channel
            if (!oPubClient) {
                sError = "Client is not subscribed to the provided channel";
                Log.error(sError, null, "sap.ushell.services.MessageBroker");
                return Promise.reject(sError);
            }

            for (var sClientKey in aTargetClientIds) {

                var sTargetClientId = aTargetClientIds[sClientKey];

                // if message is for all clients in the channel
                if (sTargetClientId === "*") {
                    aTargetClients = oClientsPerChannel[sChannelId].concat();
                    break;
                } else {
                    // check if target client exists
                    var oTargetClient = oClientsPerChannel[sChannelId].find(function (oClient) {
                        return oClient.clientId === sTargetClientId;
                    });

                    if (oTargetClient) {
                        aTargetClients.push(this._deepCopy(oTargetClient));
                    }
                }
            }

            if (aTargetClients.length) {
                this._sendMessage(aTargetClients, sChannelId, sMessageId, sMessageName, sClientId, data);
                return Promise.resolve();
            }

            sError = "Target client(s) not found in the provided channel";
            Log.error(sError, null, "sap.ushell.services.MessageBroker");
            return Promise.reject(sError);
        };

        /**
         *
         * @param {string} sOrigin iframe origin.
         *
         * @since 1.110.0
         * @private
         */

        this.addAcceptedOrigin = function (sOrigin) {
            if (!bEnabled) {
                return;
            }

            if (typeof sOrigin === "string" && sOrigin.length > 0) {
                oAcceptedOrigins[sOrigin] = true;
            } else {
                Log.warning("Missing required parameter sOrigin", null, "sap.ushell.services.MessageBroker");
            }
        };

        /**
         *
         * @param {string} sOrigin iframe origin.
         *
         * @since 1.110.0
         * @private
         */

        this.removeAcceptedOrigin = function (sOrigin) {
            if (!bEnabled) {
                return;
            }
            delete oAcceptedOrigins[sOrigin];
        };

        /**
         *
         * @returns {array} the result.
         *
         * @since 1.110.0
         * @private
         */

        this.getAcceptedOrigins = function () {
            if (!bEnabled) {
                return;
            }
            return Object.keys(oAcceptedOrigins);
        };

        /**
         *
         * @returns {object} the result.
         *
         * @since 1.110.0
         * @private
         */

        this.getSubscribedClients = function () {
            if (!bEnabled) {
                return;
            }
            return this._deepCopy(oClientsPerChannel);
        };

        /**
         *
         * @param {string} sMessageName message name.
         * @param {string} sClientId client id.
         * @param {array} aChannels subscribed/unsubscribed channels of the client.
         *
         * @since 1.110.0
         * @private
         */

        this._emitEvent = function (sMessageName, sClientId, aChannels) {
            var oNotifiedClients = {};

            for (var sChannelKey in oClientsPerChannel) {

                var oChannel = oClientsPerChannel[sChannelKey];

                for (var sClientKey in oChannel) {

                    var oClient = oChannel[sClientKey];
                    // do not notify the same client who initiated the event
                    if (oClient.clientId !== sClientId && !oNotifiedClients[oClient.clientId]) {

                        var oParams = {
                            clientId: sClientId,
                            channels: aChannels
                        };

                        if (oClient.isUI5 !== false) {
                            oClient.clientConnectionCallback(sMessageName, sClientId, aChannels);
                        } else {

                            oParams.channelId = "sap.ushell.MessageBroker";
                            oParams.messageName = sMessageName;

                            var oMessageBody = this._buildPostMessageObject("event", oParams);
                            PostMessageUtils.postMessageToIframeObject(oMessageBody, oClient.iframe, oClient.origin, false);
                        }

                        oNotifiedClients[oClient.clientId] = true;
                    }
                }
            }
        };

        /**
         *
         * @param {array} aTargetClients target clients.
         * @param {string} sChannelId channel id.
         * @param {string} sMessageId request id for iframe clients or message id for UI5 clients.
         * @param {string} sMessageName message name.
         * @param {string} sClientId client id.
         * @param {object} data additional data.
         *
         * @since 1.110.0
         * @private
         */

        this._sendMessage = function (aTargetClients, sChannelId, sMessageId, sMessageName, sClientId, data) {
            for (var sClientKey in aTargetClients) {

                var oClient = aTargetClients[sClientKey];

                // do not send message to the same client who requested to send it
                if (oClient.clientId !== sClientId) {
                    if (oClient.isUI5 !== false) {
                        oClient.messageCallback(sClientId, sChannelId, sMessageName, data);
                    } else {
                        var oParams = {
                            clientId: sClientId,
                            channelId: sChannelId,
                            messageName: sMessageName,
                            data: data
                        };

                        var oMessageBody = this._buildPostMessageObject("request", oParams);
                        PostMessageUtils.postMessageToIframeObject(oMessageBody, oClient.iframe, oClient.origin, false);
                    }
                }
            }
        };

        /**
         *
         * @param {string} sEndpoint api method name.
         * @param {array} aParams api parameters.
         * @returns {Promise} Promise result.
         *
         * @since 1.110.0
         * @private
         */

        this._callApi = function (sEndpoint, aParams) {
            return this[sEndpoint].apply(this, aParams);
        };

        /**
         * @param {object} oMessageDataBody message object.
         * @param {object} oIframe The iFrame object.
         * @param {string} sOrigin iframe origin.
         * @returns {Promise} Promise result.
         *
         * @since 1.110.0
         * @private
         */

        this._handlePostMessageRequest = function (oMessageDataBody, oIframe, sOrigin) {
            return new Promise(function (resolve, reject) {

                var sEndpoint,
                    bPostMsgResponse = false,
                    sClientId = oMessageDataBody.clientId,
                    sChannelId = oMessageDataBody.channelId,
                    sRequestId = oMessageDataBody.requestId,
                    sMessageName = oMessageDataBody.messageName,
                    aSubscribedChannels = oMessageDataBody.subscribedChannels,
                    aTargetClientIds = oMessageDataBody.targetClientIds,
                    data = oMessageDataBody.data;

                var oEndpointParams = {
                    connect: [
                        sClientId
                    ],
                    disconnect: [
                        sClientId
                    ],
                    subscribe: [
                        sClientId,
                        aSubscribedChannels,
                        null,
                        null,
                        oIframe,
                        sOrigin
                    ],
                    unsubscribe: [
                        sClientId,
                        aSubscribedChannels
                    ],
                    publish: [
                        sChannelId,
                        sClientId,
                        sRequestId,
                        sMessageName,
                        aTargetClientIds,
                        data
                    ]
                };

                var oPostMessageParams = {
                        channelId: sChannelId,
                        clientId: sClientId,
                        messageName: sMessageName,
                        requestId: sRequestId
                    };

                switch (sMessageName) {
                    case "connect":
                    case "disconnect":
                    case "subscribe":
                    case "unsubscribe":
                        sEndpoint = sMessageName;
                        bPostMsgResponse = true;
                        break;
                    default:
                        sEndpoint = "publish";
                        break;
                }

                var oResponseObject = this._buildPostMessageObject("response", oPostMessageParams);

                this._callApi(sEndpoint, oEndpointParams[sEndpoint])
                    .then(function (oResponse) {
                        return resolve({ _noresponse_: true });
                    })
                    .catch(function (sError) {
                        // do not send post message, only reject promise
                        bPostMsgResponse = false;
                        return reject(sError);
                    })
                    .finally(function () {
                        if (bPostMsgResponse) {
                            oResponseObject.body.status = "accepted";
                            PostMessageUtils.postMessageToIframeObject(oResponseObject, oIframe, sOrigin, false);
                        }
                    }.bind(this));
            }.bind(this));
        };

        /**
         *
         * @param {string} sType object type.
         * @param {object} oParams object properties.
         * @returns {object} relevant post message object.
         *
         * @since 1.110.0
         * @private
         */

        this._buildPostMessageObject = function (sObjectType, oParams) {
            var sServiceName = "sap.ushell.services.MessageBroker",
                oMessageBody = {
                    request: {
                        channelId: oParams.channelId,
                        clientId: oParams.clientId,
                        messageName: oParams.messageName
                    },
                    response: {
                        channelId: oParams.channelId,
                        clientId: oParams.clientId,
                        correlationMessageId: oParams.requestId,
                        messageName: oParams.messageName
                    },
                    event: {
                        channelId: oParams.channelId,
                        clientId: oParams.clientId,
                        messageName: oParams.messageName
                    }
                };

            switch (sObjectType) {
                case "event":
                    oMessageBody.event.channels = oParams.channels;
                    break;
                case "request":
                    if (oParams.data) {
                        oMessageBody[sObjectType].data = oParams.data;
                    }
                    break;
            }

            var oObjectParams = {
                request: [
                    sServiceName,
                    oMessageBody.request
                ],
                response: [
                    sServiceName,
                    oParams.requestId,
                    oMessageBody.response,
                    true
                ],
                event: [
                    sServiceName,
                    oMessageBody.event
                ]
            };

            var fnMethod = (sObjectType === "response" ? PostMessageUtils.createPostMessageResponse : PostMessageUtils.createPostMessageRequest);
            return fnMethod.apply(this, oObjectParams[sObjectType]);
        };

        /**
         *
         * @param {string} sPrefix function name prefix.
         * @param {string} sType function type.
         * @returns {string} function name to call.
         *
         * @since 1.110.0
         * @private
         */

        this._buildFunctionName = function (sPrefix, sType) {
            sType = sType.charAt(0).toUpperCase() + sType.substring(1);
            return sPrefix + sType;
        };

        /**
         *
         * @param {object} oEntity.
         * @returns {object} deep copy.
         *
         * @since 1.110.0
         * @private
         */

        this._deepCopy = function (oEntity) {
            return deepExtend(oEntity);
        };
    };

    return new MessageBrokerEngine();
}, false);
