/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 * This extension is for OVP Analytical cards delivered in 2208.
 */
sap.ui.define(
    [
        "sap/ui/integration/Host"
    ],
    function (Host) {
        "use strict";

        var oCacheResponse = {};
        var oTempPromise = {};

        return Host.extend("sap.insights.InMemoryCachingHost", {

            clearCache: function (sCardId) {
                if (sCardId) {
                    oCacheResponse[sCardId] = oTempPromise[sCardId] = {};
                } else {
                    oCacheResponse = oTempPromise = {};
                }
            },

            _fetchData: function (sResource, mOptions, mRequestSettings, sCardId) {
                return Host.prototype.fetch.call(this, sResource, mOptions, mRequestSettings)
                    .then(function (oResponse) {
                        oCacheResponse[sCardId][sResource] = oResponse;
                        return oCacheResponse[sCardId][sResource];
                    })
                    .catch(function (oError) {
                        var oResponseBody = {
                            error: oError.toString()
                        };
                        var oResponse = new Response(
                            JSON.stringify(oResponseBody),
                            {
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }
                        );
                        oCacheResponse[sCardId][sResource] = oResponse;
                        return oCacheResponse[sCardId][sResource];
                    });
            },

            _isCSRFFetchCall: function (mRequestSettings) {
                return mRequestSettings.method === "HEAD";
            },

            fetch: function (sResource, mOptions, mRequestSettings, oCard) {
                var sCardId = oCard.getManifestEntry("sap.app").id;
                oCacheResponse[sCardId] = oCacheResponse[sCardId] ? oCacheResponse[sCardId] : {};
                oTempPromise[sCardId] = oTempPromise[sCardId] ? oTempPromise[sCardId] : {};
                if (this._isCSRFFetchCall(mRequestSettings)) {
                    return Host.prototype.fetch.call(this, sResource, mOptions, mRequestSettings);
                } else if (!oCacheResponse[sCardId][sResource] && !oTempPromise[sCardId][sResource]) {
                    oTempPromise[sCardId][sResource] = this._fetchData(sResource, mOptions, mRequestSettings, sCardId);
                    return oTempPromise[sCardId][sResource];
                } else if (!oCacheResponse[sCardId][sResource] && oTempPromise[sCardId][sResource]) {
                    return oTempPromise[sCardId][sResource];
                } else {
                    return new Promise(function (resolve) {
                        resolve(oCacheResponse[sCardId][sResource]);
                    });
                }
            }
        });
    });