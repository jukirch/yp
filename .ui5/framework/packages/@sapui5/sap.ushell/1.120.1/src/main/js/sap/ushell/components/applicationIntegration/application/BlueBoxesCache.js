// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/thirdparty/URI",
    "sap/base/Log"
], function (URI, Log) {
    "use strict";

    var oCacheStorage = {},
        oKeepAliveIframePool = {};

    function init () {
        oCacheStorage = {};
        oKeepAliveIframePool = {};
    }

    function getSize (bFromKeepAlivePull) {
        if (bFromKeepAlivePull) {
            return Object.keys(oKeepAliveIframePool).length;
        }

        return Object.keys(oCacheStorage).length;
    }

    function add (sUrl, oIframe, bToPool) {
        var oKeyValues = getBlueBoxCacheKeyValues(sUrl);
        if (bToPool) {
            if (!oKeepAliveIframePool.hasOwnProperty((oKeyValues.sKey))) {
                oKeepAliveIframePool[oKeyValues.sKey] = [];
            }
            oKeepAliveIframePool[oKeyValues.sKey].push(oIframe);
        } else {
            oCacheStorage[oKeyValues.sKey] = {
                oContainer: oIframe,
                oKeyValues: oKeyValues
            };
        }
    }

    function remove (sUrl) {
        if (sUrl) {
            var sKey = getBlueBoxCacheKeyValues(sUrl).sKey;
            if (oCacheStorage[sKey]) {
                delete oCacheStorage[sKey];
            }
        }
    }

    function removeByContainer (oContainer) {
        if (oContainer) {
            var aKeys = Object.keys(oCacheStorage);
            aKeys.forEach(function (sKey) {
                if (oCacheStorage[sKey].oContainer === oContainer) {
                    delete oCacheStorage[sKey];
                }
            });
        }
    }

    function get (sUrl, bFromKeepAlivePool) {
        var oAppContainer;

        if (sUrl === undefined || getSize(bFromKeepAlivePool) === 0) {
            return undefined;
        }
        var sKey = getBlueBoxCacheKeyValues(sUrl).sKey;

        if (bFromKeepAlivePool === true) {
            if (oKeepAliveIframePool.hasOwnProperty(sKey) && oKeepAliveIframePool[sKey].length > 0) {
                oAppContainer = oKeepAliveIframePool[sKey].shift();
                if (oKeepAliveIframePool[sKey].length === 0) {
                    delete oKeepAliveIframePool[sKey];
                }
            }
            return oAppContainer;
        }
        return (sKey && oCacheStorage.hasOwnProperty(sKey) ? oCacheStorage[sKey].oContainer : undefined);
    }

    function getById (sId) {
        for (var sKey in oCacheStorage) {
            if (oCacheStorage.hasOwnProperty(sKey)) {
                var oEntry = oCacheStorage[sKey].oContainer;

                if (oEntry.sId === sId) {
                    return oEntry;
                }
            }
        }

        return undefined;
    }

    function forEach (callback) {
        Object.keys(oKeepAliveIframePool).forEach(function (key) {
            oKeepAliveIframePool[key].forEach(function (oContainer) {
                callback(oContainer);
            });
        });
    }

    function getBlueBoxCacheKeyValues (sUrl) {
        var oUri,
            sOrigin,
            oParams,
            sIframeHint = "",
            sUI5Version = "",
            sKeepAlive = "",
            sTestUniqueId = "",
            oRes = {
                sKey: "",
                sOrigin: "",
                sIframeHint: "",
                sUI5Version: "",
                sKeepAlive: ""
            };

        //special cases
        if (sUrl === undefined || sUrl === "" || sUrl === "../") {
            oRes.sKey = sUrl;
            return oRes;
        }

        try {
            oUri = new URI(sUrl);
            if (sUrl.charAt(0) === "/") {
                sOrigin = window.location.origin;
            } else {
                sOrigin = oUri.origin();
            }
            if (sOrigin === undefined || sOrigin === "") {
                sOrigin = oUri.path();
                if (sOrigin === undefined || sOrigin === "") {
                    sOrigin = sUrl;
                }
            }
            oParams = oUri.query(true);
            if (oParams.hasOwnProperty("sap-iframe-hint")) {
                oRes.sIframeHint = oParams["sap-iframe-hint"];
                sIframeHint = "@" + oRes.sIframeHint;
            }
            if (oParams.hasOwnProperty("sap-ui-version")) {
                oRes.sUI5Version = oParams["sap-ui-version"];
                sUI5Version = "@" + oRes.sUI5Version;
            }
            if ((sIframeHint === "@GUI" || sIframeHint === "@WDA" || sIframeHint === "@WCF") && oParams.hasOwnProperty("sap-keep-alive")) {
                oRes.sKeepAlive = oParams["sap-keep-alive"];
                sKeepAlive = "@" + oRes.sKeepAlive + "-" + sUrl;
            }
            if (oParams.hasOwnProperty("sap-testcflp-iframeid")) {
                sTestUniqueId = "@" + oParams["sap-testcflp-iframeid"];
            }
        } catch (ex) {
            Log.error(
                "URL '" + sUrl + "' can not be parsed: " + ex,
                "sap.ushell.components.applicationIntegration.application.BlueBoxHandler"
            );
            sOrigin = sUrl;
        }

        oRes.sOrigin = sOrigin;
        oRes.sKey = sOrigin + sIframeHint + sUI5Version + sKeepAlive + sTestUniqueId;

        return oRes;
    }

    return {
        init: init,
        getSize: getSize,
        add: add,
        remove: remove,
        removeByContainer: removeByContainer,
        get: get,
        getById: getById,
        forEach: forEach,
        getBlueBoxCacheKeyValues: getBlueBoxCacheKeyValues,
        _getStorageForDebug: function () {
            return {
                oCacheStorage: oCacheStorage,
                oKeepAliveIframePool: oKeepAliveIframePool
            };
        }
    };
}, /* bExport= */ false);
