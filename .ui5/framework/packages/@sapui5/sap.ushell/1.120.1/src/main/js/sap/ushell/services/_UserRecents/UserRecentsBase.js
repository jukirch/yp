// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/Log"
], function (BaseObject, Log) {
    "use strict";

    var PERSONALIZATION_CONTAINER = "sap.ushell.services.UserRecents";

    /**
     * Base class for all helper classes.
     * @class
     * @private
     */
    var UserRecentsBase = BaseObject.extend("sap.ushell.services.UserRecentsBase", {
        constructor: function (personalizationItemName, maxItems, compareItems) {
            this.aRecents = [];
            this.iMaxItems = maxItems;

            this._oPersonalizerPromise = sap.ushell.Container.getServiceAsync("PersonalizationV2")
                .then(function (PersonalizationService) {
                    return PersonalizationService.getPersonalizer({
                        container: PERSONALIZATION_CONTAINER,
                        item: personalizationItemName
                    });
                });

            this._compareItems = compareItems;
        }
    });

    UserRecentsBase.prototype._load = function () {
        return this._oPersonalizerPromise
            .then(oPersonalizer => {
                return oPersonalizer.getPersData();
            })
            .catch(error => {
                Log.error("Personalization service does not work:");
                Log.error(error.name + ": " + error.message);
                return Promise.reject(error);
            });
    };

    UserRecentsBase.prototype._save = function (aList) {
        return this._oPersonalizerPromise
            .then(oPersonalizer => {
                return oPersonalizer.setPersData(aList);
            })
            .catch(error => {
                Log.error("Personalization service does not work:");
                Log.error(error.name + ": " + error.message);
                return Promise.reject(error);
            });
    };

    UserRecentsBase._itemSorter = function (oItem1, oItem2) {
        return oItem2.iTimestamp - oItem1.iTimestamp;
    };

    return UserRecentsBase;
});
