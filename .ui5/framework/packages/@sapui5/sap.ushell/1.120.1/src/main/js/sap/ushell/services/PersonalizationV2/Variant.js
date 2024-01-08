// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/services/PersonalizationV2/utils"
], function (personalizationUtils) {
    "use strict";

    /**
     * To be instantiated via Personalization.VariantSet  add / get Variant only
     *
     * @name sap.ushell.services.PersonalizationV2.Variant
     * @class The personalization variant contains personalization data.
     *        It is used in the personalization container mode.
     *
     * @since 1.120.0
     * @public
     */
    function Variant (oVariantSet, sVariantKey, sVariantName) {
        if (typeof sVariantKey !== "string") {
            throw new Error("Parameter value of sVariantKey is not a string: sap.ushell.services.Personalization");
        }
        if (typeof sVariantName !== "string") {
            throw new Error("Parameter value of sVariantName is not a string: sap.ushell.services.Personalization");
        }
        this._oVariantSet = oVariantSet;
        this._sVariantKey = sVariantKey;
        this._sVariantName = sVariantName;
    }

    /**
     * Returns the key of this variant.
     * @returns {string} variant key.
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.getVariantKey = function () {
        return this._sVariantKey;
    };

    /**
     * Returns the name of this variant.
     * @returns {string} variant name.
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.getVariantName = function () {
        return this._sVariantName;
    };

    /**
     * Sets the name of the variant.
     *
     * In case a variant with <code>sVariantName</code> is already existing in the corresponding variant set an exception is thrown.
     *
     * @param {string} sVariantName variant name
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.setVariantName = function (sVariantName) {
        const oVariantSetData = this._oVariantSet._getVariantSet();

        if (typeof sVariantName !== "string") {
            throw new Error("Parameter value of sVariantName is not a string: sap.ushell.services.Personalization");
        }
        if (this._oVariantSet.getVariantKeyByName(sVariantName) !== undefined) {
            throw new Error(`Variant with name '${sVariantName}' already exists in variant set '${this._oVariantSet._sVariantSetKey}': sap.ushell.services.Personalization"`);
        }

        if (Object.hasOwn(oVariantSetData, "variants") && Object.hasOwn(oVariantSetData.variants, this._sVariantKey)) {
            const oVariantData = oVariantSetData.variants[this._sVariantKey];
            oVariantData.name = sVariantName;
            this._sVariantName = sVariantName;
            this._oVariantSet._serialize();
        } else {
            throw new Error("Variant does not longer exist");
        }
    };

    /**
     * Returns the value for an item in this variant.
     * @param {string} sItemKey item key
     * @returns {object}
     *            item value (JSON object). In case the variant does not contain an item with this key
     *            <code>undefined</code> is returned.
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.getItemValue = function (sItemKey) {
        if (typeof sItemKey !== "string") {
            return;
        }
        const variantData = this._oVariantSet._getVariantSet().variants[this._sVariantKey].variantData;
        if (!Object.hasOwn(variantData, sItemKey)) {
            return;
        }
        return personalizationUtils.clone(variantData[sItemKey]);
    };

    /**
     * Sets the value for an item in this variant.
     * @param {string} sItemKey item key
     * @param {object} oItemValue value (JSON object)
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.setItemValue = function (sItemKey, oItemValue) {
        if (typeof sItemKey !== "string") {
            throw new Error("Parameter value of sItemKey is not a string: sap.ushell.services.Personalization");
        }
        const variant = this._oVariantSet._getVariantSet().variants && this._oVariantSet._getVariantSet().variants[this._sVariantKey];
        if (!variant) {
            throw new Error("Variant does not longer exist");
        }
        if (!variant.variantData) {
            variant.variantData = {};
        }
        const variantData = variant.variantData;
        variantData[sItemKey] = personalizationUtils.clone(oItemValue);
        this._oVariantSet._serialize();
    };

    /**
     * Checks if a specific item is contained in this variant.
     * @param {string} sItemKey item key
     * @returns {boolean} <code>true</code> if the variant contains an item with the key
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.containsItem = function (sItemKey) {
        if (typeof sItemKey !== "string") {
            return undefined;
        }
        const variantData = this._oVariantSet._getVariantSet().variants[this._sVariantKey].variantData;
        return Object.hasOwn(variantData, sItemKey);
    };

    /**
     * Returns an array with the keys of all items in this variant.
     * @returns {string[]} item keys
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.getItemKeys = function () {
        const variantData = this._oVariantSet._getVariantSet().variants[this._sVariantKey].variantData;
        let sItemKey;
        const aItemKeys = [];
        for (sItemKey in variantData) {
            if (Object.hasOwn(variantData, sItemKey)) {
                aItemKeys.push(sItemKey);
            }
        }
        aItemKeys.sort();
        return aItemKeys;
    };

    /**
     * Deletes an item from this variant.
     * In case the item does not exist, nothing happens.
     * @param {string} sItemKey item key
     *
     * @since 1.120.0
     * @public
     */
    Variant.prototype.deleteItem = function (sItemKey) {
        if (typeof sItemKey !== "string") {
            return;
        }
        const variantData = this._oVariantSet._getVariantSet().variants[this._sVariantKey].variantData;
        delete variantData[sItemKey];
        this._oVariantSet._serialize();
    };

    return Variant;
});
