// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/utils",
    "sap/base/Log"
], function (ushellUtils, Log) {
    "use strict";

    /**
     * To be called by the personalization service getPersonalizer method.
     *
     * @name sap.ushell.services.PersonalizationV2.Personalizer
     * @class The Unified Shell personalizer providing set get delete
     *        methods to access the persisted personalization data in direct mode.
     *
     * @since 1.120.0
     * @public
     */
    function Personalizer (oService, oAdapter, oPersId, oScope, oComponent) {
        this._sPersContainer = "";
        this._sPersItem = "";
        this._sPersVariant = null;
        this._oAdapter = oAdapter;
        this._oPersonalizationService = oService;
        this._oScope = oScope;
        this._oComponent = oComponent;

        if (!oPersId || !oPersId.container || !oPersId.item || typeof oPersId.container !== "string" || typeof oPersId.item !== "string") {
            throw new Error("Invalid input for oPersId: sap.ushell.services.Personalization");
        }
        this._sPersContainer = oPersId.container; // prefix is added in container constructor
        this._sPersItem = oPersId.item;
    }

    /**
     * todo: jsdoc
     * @param {string} sPersContainer
     * @returns {Promise<object>}
     *
     * @since 1.120.0
     * @private
     */
    Personalizer.prototype._getContainer = function (sPersContainer) {
        if (!this._oGetContainerPromise) {
            this._oGetContainerPromise = this._oPersonalizationService.getContainer(sPersContainer, this._oScope, this._oComponent);
        }
        return this._oGetContainerPromise;
    };

    /**
     * Gets a personalization data value.
     *
     * @returns {Promise<object>} Resolves the data
     *
     * @since 1.120.0
     * @public
     */
    Personalizer.prototype.getPersData = function () {
        return this._getContainer(this._sPersContainer)
            .then((oContainer) => {
                return oContainer.getItemValue(this._sPersItem);
            })
            .catch((oError)=> {
                Log.error("Fail to get Personalization data for Personalizer container: " + this._sPersContainer, oError);
                return Promise.reject();
            });
    };

    /**
     * Sets a personalization data value.
     *
     * @param {object} oValue JSON object containing the personalization value.
     * @returns {Promise} Resolves if save was successful
     *
     * @since 1.120.0
     * @public
     */
    Personalizer.prototype.setPersData = function (oValue) {
        return this._getContainer(this._sPersContainer)
            .then((oContainer) => {
                oContainer.setItemValue(this._sPersItem, oValue);
                return ushellUtils.promisify(oContainer.save());
            })
            .catch((oError)=> {
                Log.error("Fail to get Personalization data for Personalizer container: " + this._sPersContainer, oError);
                return Promise.reject();
            });
    };
    /**
     * Deletes a personalization data value.
     *
     * @returns {Promise} Resolves if delete was successful
     *
     * @since 1.120.0
     * @public
     */
    Personalizer.prototype.deletePersData = function () {
        return this._getContainer(this._sPersContainer)
            .then((oContainer) => {
                oContainer.deleteItem(this._sPersItem);
                return ushellUtils.promisify(oContainer.save());
            })
            .catch((oError)=> {
                Log.error("Fail to delete Personalization data for Personalizer container: " + this._sPersContainer, oError);
                return Promise.reject();
            });
    };

    return Personalizer;
});
