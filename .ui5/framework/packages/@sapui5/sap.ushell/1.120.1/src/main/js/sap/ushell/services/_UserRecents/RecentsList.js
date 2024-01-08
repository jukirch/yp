// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "./UserRecentsBase"
], function (UserRecentsBase) {
    "use strict";

    /**
     * @class
     * @private
     */
    var RecentsList = UserRecentsBase.extend("sap.ushell.services.RecentsList");

    RecentsList.prototype._updateIfAlreadyIn = function (oItem, iTimestampNow) {
        return this.aRecents.some(function (oRecentEntry) {
            var bFound;

            if (this._compareItems(oRecentEntry.oItem, oItem)) {
                oRecentEntry.oItem = oItem;
                oRecentEntry.iTimestamp = iTimestampNow;
                oRecentEntry.iCount = oRecentEntry.iCount + 1;
                bFound = true;
            } else {
                bFound = false;
            }

            return bFound;
        }.bind(this));
    };

    RecentsList.prototype._insertNew = function (oItem, iTimestampNow) {
        var oNewEntry = {
            oItem: oItem,
            iTimestamp: iTimestampNow,
            iCount: 1
        };

        if (this.aRecents.length === this.iMaxItems) {
            this.aRecents.sort(UserRecentsBase._itemSorter);
            this.aRecents.pop();
        }

        this.aRecents.push(oNewEntry);
    };

    RecentsList.prototype.clearAllActivities = function () {
        return this._save([]);
    };

    RecentsList.prototype.newItem = function (oItem) {
        return new Promise((resolve, reject) => {
            const iTimestampNow = Date.now();
            let bAlreadyIn;

            this._load()
                .then(aLoadedRecents => {
                    this.aRecents = aLoadedRecents || [];

                    bAlreadyIn = this._updateIfAlreadyIn(oItem, iTimestampNow);
                    if (!bAlreadyIn) {
                        this._insertNew(oItem, iTimestampNow);
                    }

                    this._save(this.aRecents)
                        .then(() => {
                            resolve();
                        })
                        .catch(errorMessage => {
                            reject(errorMessage);
                        });
                });

        });
    };

    RecentsList.prototype.getRecentItems = function () {
        return new Promise((resolve, reject) => {
            this._load()
                .then(aLoadedRecents => {
                    aLoadedRecents = aLoadedRecents || [];
                    aLoadedRecents.sort(UserRecentsBase._itemSorter);
                    this.aRecents = aLoadedRecents.slice(0, this.iMaxItems);
                    resolve(this.aRecents.map(oRecentEntry => oRecentEntry.oItem
                    ));
                })
                .catch(errorMessage => {
                    reject(errorMessage);
                });
        });
    };

    return RecentsList;
});
