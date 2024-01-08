// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/utils",
    "sap/ushell/services/PersonalizationV2/utils",
    "sap/ushell/services/PersonalizationV2/constants.private",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/UIComponent",
    "sap/ui/thirdparty/jquery",
    "sap/base/Log"
], function (ushellUtils, personalizationUtils, constants, DateFormat, UIComponent, jQuery, Log) {
    "use strict";

    /**
     * To be called by the personalization service getContainer method.
     *
     * @name sap.ushell.services.PersonalizationV2.ContextContainer
     * @class The container is the anchor object of the unified shell
     *        personalization in container mode.
     *
     * @since 1.120.0
     * @public
     */

    function ContextContainer (/* args... */) {
        this._init.apply(this, arguments);
    }

    // Need an _init method to be exposed (in this case in the prototype) when
    // the dependency is consumed. In this way it's possible to spy on the
    // constructor call.
    ContextContainer.prototype._init = function (oService, oAdapter, sContainerKey, oScope, oComponent) {
        this._oService = oService;
        this._sContainerKey = sContainerKey;
        this._oAdapterContainer = {};
        this._oScope = oScope || personalizationUtils.adjustScope(oScope);
        this._aLoadedKeys = [];
        this._oUnmodifiableContainer = undefined;
        let sAppName;

        if (!(oComponent instanceof UIComponent) && oComponent !== undefined) {
            throw new Error("oComponent passed is not a UI5 Component and not undefined");
        }

        if (oComponent && oComponent.getMetadata && oComponent.getMetadata().getComponentName) {
            sAppName = oComponent.getMetadata().getComponentName();
        }

        this.clearData();
        if (!this._sContainerKey || typeof this._sContainerKey !== "string") {
            throw new Error("Invalid container key: sap.ushell.services.PersonalizationV2");
        }
        this._oAdapterContainer = oAdapter.getAdapterContainer(this._sContainerKey, this._oScope, sAppName);
        return this;
    };

    /**
     * return the validity of this container
     * @returns {int} The validity of the container.
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._getValidity = function () {
        return this._oScope.validity;
    };

    /**
     * clears the local copy data of this container
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.clearData = function () {
        // resets all member variables of the personalization container
        this._oItemMap = {};
        this._aLoadedItemKeys = [];
        this._clear = true;
        this._oItemMap = new ushellUtils.Map();
    };


    /**
    * (Re)loads the current container data from the underlying storage asynchronously.
    * The current local data is discarded.
    *
    * Returns a promise for the load operation.
    * If another save/load/delete operation is not completed, the  operation may fail!
    * (wait for the other promise).
    *
    * Synchronous read and write operations before the load is done have undefined
    * effects.
    *
    * @returns {Promise<object>} Promise object
    *
    * @since 1.120.0
    * @public
    */
    ContextContainer.prototype.load = function () {
        const oDeferred = new jQuery.Deferred();
        if (!this._sContainerKey) {
            throw new Error("Invalid container key: sap.ushell.services.PersonalizationV2");
        }
        // delete local data
        this.clearData();
        const oPrior = this._oService._pendingContainerOperations_flushAddNext(this._sContainerKey, oDeferred);
        // get adapter container & load
        const that = this;
        oPrior.always(() => {
            that._oAdapterContainer.load()
                .fail(function () {
                    // TODO
                    oDeferred.reject();
                })
                .done(() => {
                    that._copyFromAdapter();
                    if (that.isExpired()) {
                        that.clearData();
                    }
                    oDeferred.resolve();
                });
        });
        return ushellUtils.promisify(oDeferred.promise());
    };

    /**
     * Copy data from adapter to local storage
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._copyFromAdapter = function () {
        const aAllKeys = this._oAdapterContainer.getItemKeys().splice(0);
        aAllKeys.forEach((sItemKey) => {
            this._oItemMap.put(sItemKey, JSON.stringify(this._oAdapterContainer.getItemValue(sItemKey)));
        });
        this._aLoadedItemKeys = this._oItemMap.keys().splice(0);
    };


    /**
     * @returns {boolean} Whether this container is expired
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype.isExpired = function () {
        if (this._getValidity() === Infinity || this._getValidity() === 0) {
            return false;
        }
        const sTimestampExpire = this._getItemValueInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_EXPIRE);
        const oFormatter = DateFormat.getDateInstance({ pattern: constants.S_ABAPTIMESTAMPFORMAT });
        const sTimestampNow = oFormatter.format(new Date(), true);
        return sTimestampExpire && sTimestampNow > sTimestampExpire;
    };

    /**
     * todo: jsdoc
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._copyToAdapterUpdatingValidity = function () {
        let aItemKeys = [];
        if (this._clear) {
            aItemKeys = this._oAdapterContainer.getItemKeys().splice(0);
            aItemKeys.forEach((sItemKey) => {
                this._oAdapterContainer.delItem(sItemKey);
            });
            this._clear = false;
        }
        if (this._getValidity() === Infinity || this._getValidity() === 0) {
            this._delItemInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_SCOPE);
            this._delItemInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_EXPIRE);
            this._delItemInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_STORAGE);
        } else {
            const oFormatter = DateFormat.getDateInstance({ pattern: constants.S_ABAPTIMESTAMPFORMAT });
            const oNow = new Date();
            const sTimestampStorage = oFormatter.format(oNow, true); // true UTC times !
            const sTimestampExpire = oFormatter.format(new Date(oNow.getTime() + this._getValidity() * 60000), /*UTC!*/ true);
            this._setItemValueInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_SCOPE, this._oScope);
            this._setItemValueInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_EXPIRE, sTimestampExpire);
            this._setItemValueInternal(constants.S_ADMIN_PREFIX, constants.S_ITEMKEY_STORAGE, sTimestampStorage);
        }
        aItemKeys = this._oItemMap.keys();
        aItemKeys.forEach((sItemKey) => {
            this._oAdapterContainer.setItemValue(sItemKey, personalizationUtils.cloneToObject(this._oItemMap.get(sItemKey)));
        });
        const aDiff = this._aLoadedItemKeys.filter(function (sItemKey) { return !(aItemKeys.indexOf(sItemKey) > -1); });
        aDiff.forEach((sItemKey) => {
            this._oAdapterContainer.delItem(sItemKey);
        });
    };

    /**
     * * todo: jsdoc
     * Save the current container data at the underlying storage asynchronously at the earlies
     * nDelayInMilliseconds seconds before.
     * The current state is serialized.
     *
     * @param {int} nDelayInMilliseconds
     * @returns {Promise} Promise object
     *
     * The operation may wait for completion of another pending operation.
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.save = function (nDelayInMilliseconds) {
        this._copyToAdapterUpdatingValidity();
        const oSaveDeferred = new jQuery.Deferred();

        const oPrior = this._oService._pendingContainerOperations_cancelAddNext(this._sContainerKey, oSaveDeferred);

        const that = this;
        function fnDelayedSave () {
            oPrior.always(function () {
                try {
                    that._oAdapterContainer.save() // promise
                        .fail(function () { oSaveDeferred.reject(); })
                        .done(function () { oSaveDeferred.resolve(); });
                } catch (e) {
                    oSaveDeferred.reject();
                }
            });
        }

        oSaveDeferred._sapFnSave = fnDelayedSave;
        oSaveDeferred._sapTimeoutId = setTimeout(fnDelayedSave, nDelayInMilliseconds);
        // we want to delay at least 200 ms,
        return ushellUtils.promisify(oSaveDeferred.promise());
    };

    /**
     * flush all pending request;
     * The result of the promise may reflect the last pending operation in the queue
     * @returns {Promise} promise
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.flushPendingRequests = function () {
        this._copyToAdapterUpdatingValidity();
        const oSaveDeferred = new jQuery.Deferred();
        const oPrior = this._oService._pendingContainerOperations_flushAddNext(this._sContainerKey, oSaveDeferred);
        oPrior
            .fail(function () { oSaveDeferred.reject(); })
            .done(function () { oSaveDeferred.resolve(); });
        return ushellUtils.promisify(oSaveDeferred.promise());
    };

    /**
     * Returns an array with the keys of direct items in the container.
     * @returns {string[]} item keys
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.getItemKeys = function () {
        // return a list of the (prefix stripped)  "Item" keys.
        const aFilteredTrueItemKeys = this._oItemMap.keys().filter(function (s) {
            return s.startsWith(constants.S_ITEM_PREFIX);
        });
        return aFilteredTrueItemKeys.map(function (sEntry) {
            return sEntry.replace(constants.S_ITEM_PREFIX, "", "");
        });
    };

    /**
     * Returns an array with all internal  keys of direct items in the container.
     * @returns {string[]} item keys
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._getInternalKeys = function () {
        return this._oItemMap.keys().splice(0);
    };

    /**
     * Returns the value for a direct item from the container.
     * (Value semantics, new copy is returned)
     * @param {string} sItemKey
     *            item key
     * @returns {object}
     *            item value (JSON object). In case the container does not contain a direct item with this key
     * <code>undefined</code> is returned.
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.getItemValue = function (sItemKey) {
        return this._getItemValueInternal(constants.S_ITEM_PREFIX, sItemKey);
    };

    /**
     * todo: jsdoc
     * @param {*} sPrefix
     * @param {*} sItemKey
     * @returns {*}
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._getItemValueInternal = function (sPrefix, sItemKey) {
        if (typeof sItemKey !== "string" || typeof sPrefix !== "string") {
            return undefined;
        }
        return personalizationUtils.cloneToObject(this._oItemMap.get(sPrefix + sItemKey));
    };

    /**
     * Checks if a specific direct item is contained in the container.
     * @param {string} sItemKey item key
     * @returns {boolean} <code>true</code> if the container contains a direct item with the key
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.containsItem = function (sItemKey) {
        if (typeof sItemKey !== "string") {
            return undefined;
        }
        return this._oItemMap.containsKey(constants.S_ITEM_PREFIX + sItemKey);
    };

    /**
     * Sets the value of a direct item in the container.
     * In case the item is already existing its value is overwritten. In case it is not
     * existing a new item with this key and value is created.
     * The value is serialized during set
     * @param {string} sItemKey item key. The string length is restricted to 40 characters
     * @param {object} oItemValue item value (JSON object)
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.setItemValue = function (sItemKey, oItemValue) {
        this._setItemValueInternal(constants.S_ITEM_PREFIX, sItemKey, oItemValue);
    };

    /**
     * todo: jsdoc
     * @param {*} sItemPrefix
     * @param {*} sItemKey
     * @param {*} oItemValue
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._setItemValueInternal = function (sItemPrefix, sItemKey, oItemValue) {
        if (typeof sItemKey !== "string" || typeof sItemPrefix !== "string") {
            throw Error("Parameter value of sItemKey or sItemValue is not a string: sap.ushell.services.PersonalizationV2");
        }

        if (sItemKey.length > 40) {
            Log.error(
                "Personalization Service item key/variant set name (\""
                + sItemKey
                + "\") should be less than 40 characters [current :"
                + sItemKey.length
                + "]"
            );
        }

        this._oItemMap.put(sItemPrefix + sItemKey, JSON.stringify(oItemValue));
    };

    /**
     * Deletes a direct item from the container.
     * In case the item does not exist, nothing happens.
     * @param {string} sItemKey item key
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.deleteItem = function (sItemKey) {
        this._delItemInternal(constants.S_ITEM_PREFIX, sItemKey);
    };

    /**
     * todo: jsdoc
     * @param {*} sPrefix
     * @param {*} sItemKey
     * @returns {*}
     *
     * @since 1.120.0
     * @private
     */
    ContextContainer.prototype._delItemInternal = function (sPrefix, sItemKey) {
        if (typeof sItemKey !== "string") {
            return undefined;
        }
        if (typeof sPrefix !== "string") {
            return undefined;
        }
        this._oItemMap.remove(sPrefix + sItemKey);
    };

    /**
     * return the container key as a string variable
     * @returns {string} the container key
     *
     * @since 1.120.0
     * @public
     */
    ContextContainer.prototype.getKey = function () {
        return this._sContainerKey.substring(constants.S_CONTAINER_PREFIX.length);
    };

    return ContextContainer;
});
