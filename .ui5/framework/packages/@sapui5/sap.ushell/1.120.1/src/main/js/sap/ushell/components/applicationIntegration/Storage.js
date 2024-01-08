// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([], function () {
    "use strict";

    function Storage () {
        var oMainStorage = {};

        //for qunit
        this._clean = function () {
            oMainStorage = {};
        };

        this.get = function (key) {
            if (key && oMainStorage.hasOwnProperty(key)) {
                return oMainStorage[key];
            }
            return undefined;
        };

        this.set = function (key, value) {
            if (key) {
                oMainStorage[key] = value;
            }
        };

        this.removeById = function (key) {
            if (key && oMainStorage.hasOwnProperty(key)) {
                delete oMainStorage[key];
            }
        };

        this.removeByContainer = function (oContainer) {
            var arrKeepAliveApps = [];
            this.forEach(function (oApp, sKey) {
                if (oApp.container === oContainer) {
                    arrKeepAliveApps.push(sKey);
                }
            });
            arrKeepAliveApps.forEach(this.removeById);
        };

        this.forEach = function (callback) {
            Object.keys(oMainStorage).forEach(function (key) {
                callback.apply(this, [oMainStorage[key], key, this]);
            });
        };

        this.length = function () {
            return Object.keys(oMainStorage).length;
        };
    }

    return new Storage();
}, /* bExport= */ true);
