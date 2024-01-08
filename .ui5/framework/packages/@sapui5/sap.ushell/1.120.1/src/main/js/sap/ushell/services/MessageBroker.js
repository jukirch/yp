// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview This module exposes API enpoints for Generic Communication
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/services/_MessageBroker/MessageBrokerEngine",
    "sap/base/Log"
], function (MessageBrokerEngine, Log) {
    "use strict";

    var oServiceConfig = {};

    /**
     * @alias sap.ushell.services.MessageBroker
     * @class
     * @classdesc The Unified Shell's MessageBroker service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("MessageBroker")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.72.0
     * @private
     */
    var MessageBroker = function (oContainerInterface, sParameters, oServiceConfiguration) {
        oServiceConfig = oServiceConfiguration && oServiceConfiguration.config || {};
        MessageBrokerEngine.setEnabled(this.isEnabled());
        if (!this.isEnabled()) {
            Log.warning("FLP's message broker service is disabled by shell configuration");
        }
    };

    MessageBroker.prototype.isEnabled = function () {
        if (oServiceConfig.enabled === undefined || oServiceConfig.enabled === true) {
            return true;
        }
        return false;
    };

    /**
     *
     * @param {string} sClientId client id.
     * @returns {Promise} Promise result.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.connect = function (sClientId) {
        return MessageBrokerEngine.connect(sClientId);
    };

    /**
     *
     * @param {string} sClientId client ID.
     * @returns {Promise} Promise result.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.disconnect = function (sClientId) {
        return MessageBrokerEngine.disconnect(sClientId);
    };

    /**
     *
     * @param {string} sClientId client id.
     * @param {array} aSubscribedChannels array of channel-objects.
     * @param {function} fnMessageCallback callback function returns promise.
     * @param {function} fnClientConnectionCallback callback function returns promise.
     * @returns {Promise} Promise result.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.subscribe = function (
        sClientId,
        aSubscribedChannels,
        fnMessageCallback,
        fnClientConnectionCallback
    ) {
        return MessageBrokerEngine.subscribe(
            sClientId,
            aSubscribedChannels,
            fnMessageCallback,
            fnClientConnectionCallback
        );
    };

    /**
     *
     * @param {string} sClientId client ID.
     * @param {array} aUnsubscribedChannels channels to unsubscribe from.
     * @returns {Promise} Promise result.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.unsubscribe = function (sClientId, aUnsubscribedChannels) {
        return MessageBrokerEngine.unsubscribe(sClientId, aUnsubscribedChannels);
    };

    /**
     *
     * @param {string} sChannelId channel Id.
     * @param {string} sClientId client Id.
     * @param {string} sMessageId message Id.
     * @param {string} sMessageName message name.
     * @param {array} aTargetClientIds array of target clients Ids.
     * @param {object} data additional data.
     * @returns {Promise} Promise result.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.publish = function (
        sChannelId,
        sClientId,
        sMessageId,
        sMessageName,
        aTargetClientIds,
        data
    ) {
        return MessageBrokerEngine.publish(
            sChannelId,
            sClientId,
            sMessageId,
            sMessageName,
            aTargetClientIds,
            data);
    };

    /**
     *
     * @param {string} sOrigin iframe src.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.addAcceptedOrigin = function (sOrigin) {
        MessageBrokerEngine.addAcceptedOrigin(sOrigin);
    };

    /**
     *
     * @param {string} sOrigin iframe src.
     *
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.removeAcceptedOrigin = function (sOrigin) {
        MessageBrokerEngine.removeAcceptedOrigin(sOrigin);
    };

    /**
     *
     * @returns {Promise} Promise result.
     * @since 1.110.0
     * @private
     */

    MessageBroker.prototype.getAcceptedOrigins = function () {
        return MessageBrokerEngine.getAcceptedOrigins();
    };

    MessageBroker.hasNoAdapter = true;
    return MessageBroker;
});
