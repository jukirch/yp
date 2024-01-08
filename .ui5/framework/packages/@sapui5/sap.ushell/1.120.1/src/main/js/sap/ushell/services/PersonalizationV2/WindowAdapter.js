// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/ushell/services/PersonalizationV2/WindowAdapterContainer"
], function (jQuery, WindowAdapterContainer) {
    "use strict";

    /**
     * @name sap.ushell.services.PersonalizationV2.WindowAdapter
     * @class
     * Container for storage with window validity, data is stored in WindowAdapter.prototype.data
     *
     * @param {object} oPersonalizationService ignored
     * @param {object} oBackendAdapter BackendAdapter -> may be undefined
     *
     * @since 1.120.0
     * @private
     */
    function WindowAdapter (oPersonalizationService, oBackendAdapter) {
        this._oBackendAdapter = oBackendAdapter;

        if (oBackendAdapter) {
            this.supportsGetWithoutSubsequentLoad = oBackendAdapter.supportsGetWithoutSubsequentLoad;
        }
    }

    WindowAdapter.prototype.data = {};

    /**
     * @param {string} sContainerKey
     * @param {sap.ushell.services.PersonalizationV2.Scope} oScope
     * @param {string} sAppName
     * @returns
     *
     * @since 1.120.0
     * @private
     */
    WindowAdapter.prototype.getAdapterContainer = function (sContainerKey, oScope, sAppName) {
        const oBackendContainer = this._oBackendAdapter && this._oBackendAdapter.getAdapterContainer(sContainerKey, oScope, sAppName);
        return new WindowAdapterContainer(sContainerKey, oScope, oBackendContainer, WindowAdapter);
    };

    /**
     * @param {string} sContainerKey
     * @param {sap.ushell.services.PersonalizationV2.Scope} oScope
     * @returns {Promise}
     *
     * @since 1.120.0
     * @private
     */
    WindowAdapter.prototype.delAdapterContainer = function (sContainerKey, oScope) {
        // todo clarify
        const oDeferred = new jQuery.Deferred();
        delete WindowAdapter.prototype.data[sContainerKey];
        if (this._oBackendAdapter) {
            this._oBackendAdapter.delAdapterContainer(sContainerKey, oScope)
                .done(function () {
                    oDeferred.resolve();
                })
                .fail(function (sMsg) {
                    oDeferred.reject(sMsg);
                });
        } else {
            oDeferred.resolve();
        }
        return oDeferred.promise();
    };

    return WindowAdapter;

});
