// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
], function () {
    "use strict";

    /**
     * @name sap.ushell.services.PersonalizationV2.TransientPersonalizer
     * @class
     * @classdesc The transient personalizer shall be used in container mode for table personalization.
     * To be called by the personalization service getTransientPersonalizer method.
     *
     * @since 1.120.0
     * @public
     */
    function TransientPersonalizer () {
        this._oValue = undefined;
    }

    /**
     * Gets a personalization data value.
     * @returns {Promise<object>} Resolves the data.
     *
     * @since 1.120.0
     * @public
     */
    TransientPersonalizer.prototype.getPersData = async function () {
        return this._oValue;
    };

    /**
     * Sets a personalization data value.
     *
     * @param {object} oValue JSON object containing the personalization value.
     * @returns {Promise} Resolves if save was successful.
     *
     * @since 1.120.0
     * @public
     */
    TransientPersonalizer.prototype.setPersData = async function (oValue) {
        this._oValue = oValue;
    };

    /**
     * Deletes a personalization data value.
     *
     * @returns {Promise} Resolves if delete was successful.
     *
     * @since 1.120.0
     * @public
     */
    TransientPersonalizer.prototype.deletePersData = async function () {
        this._oValue = undefined;
    };

    return TransientPersonalizer;

});
