// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/utils",
    "sap/ushell/services/PersonalizationV2/constants.private",
    "sap/ushell/services/PersonalizationV2/Variant"
], function (ushellUtils, constants, Variant) {
    "use strict";

    /**
     * A VariantSet is a class representing a collection of
     * Variants (identified by a key and name)
     * and a member variable indicating the
     * "current variable"
     *
     * When manipulating the underlying data, additional constraints are enforced.
     *
     * To be called by the personalization container.
     *
     * @name sap.ushell.services.Personalization.VariantSet
     * @class The personalization variant set contains variants of personalization data.
     *        It is used in the personalization container mode.
     *
     * @since 1.120.0
     * @public
     */

    function VariantSet (sVariantSetKey, oContextContainer) {
        let sVariantKey;
        const oVariantNameMap = new ushellUtils.Map();
        this._oContextContainer = oContextContainer;
        this._sVariantSetKey = sVariantSetKey;
        this._oVariantSetData = this._oContextContainer._getItemValueInternal(constants.S_VARIANT_PREFIX, this._sVariantSetKey);

        if (!Object.hasOwn(this._oVariantSetData, "currentVariant")) {
            throw new Error("Corrupt variant set data: sap.ushell.services.Personalization");
            // TODO variant set name + container
        }
        if (Object.hasOwn(this._oVariantSetData, "variants")) {
            for (sVariantKey in this._oVariantSetData.variants) {
                if (Object.hasOwn(this._oVariantSetData.variants, sVariantKey)) {
                    const sVariantName = this._oVariantSetData.variants[sVariantKey].name;
                    const oVariantData = this._oVariantSetData.variants[sVariantKey].variantData;
                    if (oVariantNameMap.containsKey(sVariantName)) {
                        throw new Error("Variant name already exists: sap.ushell.services.Personalization");
                        // TODO skip? log instead error
                    } else {
                        // validate variant
                        if (typeof sVariantKey !== "string") {
                            throw new Error("Parameter value of sVariantKey is not a string: sap.ushell.services.Personalization");
                        }
                        if (typeof sVariantName !== "string") {
                            throw new Error("Parameter value of sVariantName is not a string: sap.ushell.services.Personalization");
                        }
                        if (oVariantData && typeof oVariantData !== "object") {

                            throw Error("Parameter value of sVariantName is not a string: sap.ushell.services.Personalization");
                        }
                        oVariantNameMap.put(sVariantName, sVariantKey);
                    }
                }
            }
        } else {
            throw new Error("Corrupt variant set data: sap.ushell.services.Personalization");
        }
        return this;
    }

    /**
     * todo: jsdoc
     * @returns {*}
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype._getVariantSet = function () {
        return this._oVariantSetData;
    };

    /**
     * todo: jsdoc
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype._serialize = function () {
        this._oContextContainer._setItemValueInternal(constants.S_VARIANT_PREFIX, this._sVariantSetKey, this._oVariantSetData);
    };

    /**
     * Returns the current variant key.
     * @returns {string} current variant key. In case the current variant was never set <code>null</code> is returned.
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.getCurrentVariantKey = function () {
        return this._getVariantSet().currentVariant;
    };

    /**
     * Sets the current variant key.
     * @param {string} sVariantKey There is no validity check for the variant key.
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.setCurrentVariantKey = function (sVariantKey) {
        this._getVariantSet().currentVariant = sVariantKey;
        this._serialize();
    };

    /**
     * Returns an array with the keys of the variants in the variant set.
     * @returns {string[]} variant keys
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.getVariantKeys = function () {
        const oVariantMap = new ushellUtils.Map();
        const oVariantSetData = this._getVariantSet(this._sVariantSetKey);
        let sVariantKey;
        if (Object.hasOwn(oVariantSetData, "variants")) {
            for (sVariantKey in oVariantSetData.variants) {
                if (Object.hasOwn(oVariantSetData.variants, sVariantKey)) {
                    oVariantMap.put(sVariantKey, "dummy");
                }
            }
        } else {
            throw new Error("Corrupt variant set data: sap.ushell.services.Personalization");
        }
        return oVariantMap.keys();
    };

    /**
     * todo: jsdoc
     * @returns {*}
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.getVariantNamesAndKeys = function () {
        const oVariantNameMap = new ushellUtils.Map();
        const oVariantMap = new ushellUtils.Map();
        const oVariantSetData = this._getVariantSet(this._sVariantSetKey);
        let sVariantKey;
        if (Object.hasOwn(oVariantSetData, "variants")) {
            for (sVariantKey in oVariantSetData.variants) {
                if (Object.hasOwn(oVariantSetData.variants, sVariantKey)) {
                    const sVariantName = oVariantSetData.variants[sVariantKey].name;
                    if (oVariantNameMap.containsKey(sVariantName)) {
                        throw new Error("Variant name already exists: sap.ushell.services.Personalization");
                        // TODO skip? log instead error
                    } else {
                        oVariantNameMap.put(sVariantName, sVariantKey);
                    }
                    oVariantMap.put(sVariantKey, "dummy");
                }
            }
        } else {
            throw new Error("Corrupt variant set data: sap.ushell.services.Personalization");
        }
        return oVariantNameMap.entries;
    };

    /**
     * Returns a variant object.
     * @param {string} sVariantKey variant key
     * @returns {sap.ushell.services.PersonalizationV2.Variant}
     *            In case the variant set does not contain a variant with this key
     *            <code>undefined</code> is returned.
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.getVariant = function (sVariantKey) {
        if (typeof sVariantKey !== "string") {
            return undefined;
        }
        const oVariantSetData = this._getVariantSet(this._sVariantSetKey);

        if (Object.hasOwn(oVariantSetData, "variants") && Object.hasOwn(oVariantSetData.variants, sVariantKey)) {
            const sVariantName = oVariantSetData.variants[sVariantKey].name;
            const oVariantData = oVariantSetData.variants[sVariantKey].variantData;

            const oVariant = new Variant(this, sVariantKey, sVariantName, oVariantData);
            return oVariant;
        }
        return undefined;
    };

    /**
     * Returns the variant key corresponding to a variant name.
     * @param {string} sVariantName variant name
     * @returns {string} variant key. In case the variant set does not contain a variant with this name
     *            <code>undefined</code> is returned.
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.getVariantKeyByName = function (sVariantName) {
        if (typeof sVariantName !== "string") {
            return undefined;
        }
        const oVariantSetData = this._getVariantSet(this._sVariantSetKey);
        let sVariantKey;
        if (Object.hasOwn(oVariantSetData, "variants")) {
            for (sVariantKey in oVariantSetData.variants) {
                if (Object.hasOwn(oVariantSetData.variants, sVariantKey)) {
                    if (sVariantName === oVariantSetData.variants[sVariantKey].name) {
                        return sVariantKey;
                    }
                }
            }
        } else {
            throw new Error("Corrupt variant set data: sap.ushell.services.Personalization");
        }
        return undefined;
    };

    /**
     * Checks if a specific variant is contained in the variant set.
     * @param {string} sVariantKey variant key
     * @returns {boolean} <code>true</code> if the variant set contains a variant with the key
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.containsVariant = function (sVariantKey) {
        const oVariantSetData = this._getVariantSet();
        if (typeof sVariantKey !== "string") {
            return undefined;
        }
        return Object.hasOwn(oVariantSetData, "variants") && Object.hasOwn(oVariantSetData.variants, sVariantKey);
    };

    /**
     * Creates a new variant in the variant set.
     * In case a variant with this name is already existing an exception is thrown.
     * @param {string} sVariantName variant set name
     * @returns {sap.ushell.services.PersonalizationV2.Variant}
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.addVariant = function (sVariantName) {
        const aKeys = this.getVariantKeys();
        // generate a new "unique" key not yet present in aKeys
        const iMaxKey = parseInt(aKeys.sort(function (a, b) {
            return a - b;
        }).reverse()[0], 10); // get the highest key; in case of an empty
        // variant set -> NaN
        const sVariantKey = isNaN(iMaxKey) ? "0" : (iMaxKey + 1).toString();
        // tested for up to 1 mio variants
        if (aKeys.indexOf(sVariantKey) >= 0) {
            throw new Error(`Variant key '${sVariantKey}' already exists in variant set '${this._sVariantSetKey}': sap.ushell.services.Personalization`);
        }
        if (typeof sVariantName !== "string") {
            throw new Error("Parameter value of sVariantName is not a string: sap.ushell.services.Personalization");
        }
        if (this.getVariantKeyByName(sVariantName) !== undefined) {
            const sDetails = `(Old key: '${this.getVariantKeyByName(sVariantName)}' New key: '${sVariantKey}')`;
            throw new Error(`Variant name '${sVariantName}' already exists in variant set '${this._sVariantSetKey}' ${sDetails}: sap.ushell.services.Personalization`);
        }
        const oVariant = new Variant(this, sVariantKey, sVariantName);
        this._getVariantSet(this._sVariantSetKey).variants[sVariantKey] = {
            name: sVariantName,
            variantData: {}
        };
        this._serialize();
        return oVariant;
    };



    /**
     * Deletes a variant from the variant set.
     * In case the variant does not exist nothing happens.
     * @param {string} sVariantKey variant key
     *
     * @since 1.120.0
     * @public
     */
    VariantSet.prototype.deleteVariant = function (sVariantKey) {
        if (typeof sVariantKey !== "string") {
            return;
        }
        const oVariantSetData = this._getVariantSet();
        if (oVariantSetData && oVariantSetData.variants) {
            delete this._oVariantSetData.variants[sVariantKey];
        }
        this._serialize();
    };

    return VariantSet;
});
