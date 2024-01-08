// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview This module prepares the navigation data.
 *
 * It provides the inbound and systemAlias data for the pages runtime.
 * Only used on the ABAP platform and on local for testing.
 *
 * Configured with the ClientSideTargetResolutionAdapter.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/resources"
], function (resources) {
    "use strict";

    /**
     * @alias sap.ushell.services.NavigationDataProvider
     * @class
     * @classdesc The Unified Shell's NavigationDataProvider service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("NavigationDataProvider")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.68.0
     * @experimental Since 1.68.0
     * @private
     */
    function NavigationDataProvider (/*adapter, serviceConfiguration*/) {
        this.S_COMPONENT_NAME = "sap.ushell.services.NavigationDataProvider";
        this._init.apply(this, arguments);
    }

    /**
     * Private initializer.
     *
     * @param {object} adapter
     *     the navigation data provider adapter for the frontend server
     * @param {object} serviceConfiguration
     *     the navigation data provider service configuration
     * @experimental Since 1.68.0
     *
     * @private
     */
    NavigationDataProvider.prototype._init = function (adapter, serviceConfiguration) {
        this.oAdapter = adapter;
    };

    /**
     * An object representing navigation data containing inbounds and available system aliases.
     * @typedef {object} NavigationData
     * @property {object[]} object.inbounds The inbounds.
     * @property {object} object.systemAliases The system aliases.
     */

    /**
     * Loads and returns the relevant navigation data.
     *
     * @returns {Promise<NavigationData>} The navigation data.
     * @experimental Since 1.68.0
     *
     * @private
     */
    NavigationDataProvider.prototype.getNavigationData = function () {
        return new Promise(function (resolve, reject) {
            var oSystemAliases = (this.oAdapter.getSystemAliases && this.oAdapter.getSystemAliases()) || {};

            this.oAdapter.getInbounds()
                .then(function (aInbounds) {
                    resolve({
                        systemAliases: oSystemAliases,
                        inbounds: aInbounds
                    });
                })
                .fail(function (error) {
                    var oError = {
                        component: this.S_COMPONENT_NAME,
                        description: resources.i18n.getText("NavigationDataProvider.CannotLoadData"),
                        detail: error
                    };
                    reject(oError);
                }.bind(this));
        }.bind(this));
    };

    NavigationDataProvider.hasNoAdapter = false;
    return NavigationDataProvider;
});
