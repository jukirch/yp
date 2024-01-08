//Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview this module handles the creation of requests for the dynamic tile
 */

sap.ui.define([
    "sap/ushell/utils/HttpClient",
    "sap/ui/thirdparty/URI",
    "sap/base/util/isEmptyObject",
    "sap/base/util/UriParameters",
    "sap/base/Log",
    "sap/ui/core/Configuration",
    "sap/base/util/ObjectPath",
    "sap/ushell/EventHub",
    "sap/ushell/utils"
], function (
    HttpClient,
    URI,
    isEmptyObject,
    UriParameters,
    Log,
    Configuration,
    ObjectPath,
    EventHub,
    ushellUtils
) {
    "use strict";

    const sModuleName = "sap.ushell.utils.DynamicTileRequest";

    /**
     * Creates a DynamicTileRequest and starts the request
     * @since 1.87.0
     * @private
     */
    class DynamicTileRequest {

        #fnSuccess = () => {};
        #fnError = () => {};
        #sOriginalUrl = null; // for debugging
        #sODataVersion = null;
        #bResolveSemanticDateRanges = null;
        #sContentProviderId = null;

        #sUrlWithResolvedUserDefaults = null;
        #oCurrentRequest = null;
        #oClient = null;
        #sUrlRequestHref = null;
        #sUrlBasePath = null;
        #oUserDefaultsPromise = Promise.resolve();

        /**
         * Creates a DynamicTileRequest and starts the request
         *
         * @param {string} sUrl The request url
         * @param {function} fnSuccess The success handler
         * @param {function} fnError The error handler
         * @param {string|undefined} [sContentProviderId] The contentProviderId
         * @param {object} oOptions Further options for the dynamic tile request
         * @param {object} oOptions.dataSource Additional data about the request URL in the format of a data source as defined by the app descriptor.
         * @param {object} oOptions.datSource.settings.odataVersion The OData version of the request URL. Valid values are "2.0" and "4.0". Default is "2.0".
         *
         * @since 1.87.0
         * @private
         */
        constructor (sUrl, fnSuccess, fnError, sContentProviderId, oOptions) {
            this.#fnSuccess = fnSuccess;
            this.#fnError = fnError;
            this.#sOriginalUrl = sUrl;
            this.#sODataVersion = ObjectPath.get(["dataSource", "settings", "odataVersion"], oOptions);
            this.#bResolveSemanticDateRanges = true;
            this.#sContentProviderId = sContentProviderId;

            // Resolve UserDefaults first
            this.#oUserDefaultsPromise = this.#resolveUserDefaults(sUrl, sContentProviderId)
                .then((sUrlResolvedUserDefaults) => {
                    if (sUrlResolvedUserDefaults) {
                        // Save the URL for the resolved UserDefaults to re-use it every time refresh is called.
                        this.#sUrlWithResolvedUserDefaults = sUrlResolvedUserDefaults;
                    }
                })
                .catch((vError) => {
                    Log.error("Was not able to create a DynamicTileRequest:", vError, sModuleName);
                });

            this._oInitialRefreshPromise = this.#oUserDefaultsPromise.then(() => {
                if (this.#sUrlWithResolvedUserDefaults) {
                    return this.refresh();
                }
            });
        }

        set originalUrl (value) {
            throw new Error("originalUrl is read-only!");
        }

        get originalUrl () {
            return this.#sOriginalUrl;
        }

        set oDataVersion (value) {
            throw new Error("oDataVersion is read-only!");
        }

        get oDataVersion () {
            return this.#sODataVersion;
        }

        /**
         * Creates a request if no request is currently running
         *
         * Resolve semantic date ranges every time the method is called to keep them updated.
         * @returns {Promise} Resolves once the request was handled
         *
         * @since 1.87.0
         * @private
         */
        refresh () {
            if (!this.#oCurrentRequest) {
                this.#oCurrentRequest = this.#oUserDefaultsPromise
                    .then(this.#resolveSemanticDateRanges.bind(this))
                    .then((sResolvedUrl) => {
                        if (sResolvedUrl) {
                            return this.#sendRequest(sResolvedUrl);
                        }
                    });
            }
            return this.#oCurrentRequest;
        }

        /**
         * Resolves the semantic date ranges
         *
         * @returns {Promise<string>} The resolved url
         *
         * @since 1.110.0
         * @private
         */
        async #resolveSemanticDateRanges () {
            if (!this.#bResolveSemanticDateRanges) {
                return this.#sUrlWithResolvedUserDefaults;
            }

            try {
                const ReferenceResolverService = await sap.ushell.Container.getServiceAsync("ReferenceResolver");

                // UserDefaults are replaced before semantic dates
                const oResult = await ReferenceResolverService.resolveSemanticDateRanges(this.#sUrlWithResolvedUserDefaults, this.#sODataVersion);

                // Check for ignored (unresolved) references before the request is sent.
                if ((oResult.ignoredReferences && oResult.ignoredReferences.length > 0)
                    || (oResult.invalidSemanticDates && oResult.invalidSemanticDates.length > 0)
                ) {
                    const aReferences = [].concat(oResult.invalidSemanticDates || [], oResult.ignoredReferences || []);
                    Log.error("The service URL contains invalid Reference(s): " + aReferences.join(", "), "", sModuleName);
                    return;
                }

                // If there are no semantic date ranges in the URL this step can be skipped on the next refresh.
                this.#bResolveSemanticDateRanges = oResult.hasSemanticDateRanges;

                return oResult.url;
            } catch (vError) {
                Log.error("Could not resolve semantic date ranges:", vError, sModuleName);
                return Promise.reject(vError);
            }
        }

        /**
         * Sends the request
         *
         * All URL transformations are done in this method after constious placeholders were replaced.
         *
         * @param {string} sResolvedUrl The resolved url
         * @returns {Promise<undefined>} Resolves once the request is done
         *
         * @since 1.110.0
         * @private
         */
        #sendRequest (sResolvedUrl) {
            // Set escapeQuerySpace to false and use "%20" encoding instead of "+" for spaces.
            // The "+" encoding seems to fail for many OData services.
            let oUri = new URI(sResolvedUrl).escapeQuerySpace(false);

            // Adding a query parameter triggers the encoding of the whole query string.
            // Therefore, append the additional parameters as late as possible to avoid encoding the placeholders.
            const sSAPLogonLanguage = Configuration.getSAPLogonLanguage();
            if (sSAPLogonLanguage && !oUri.hasQuery("sap-language")) {
                oUri.addQuery("sap-language", sSAPLogonLanguage);
            }

            let bAddClient = false;
            if (oUri.is("relative")) {
                // Add the sap-client if the url is relative.
                bAddClient = true;
                // Make the url absolute
                oUri = oUri.absoluteTo(location.href);
            }

            const oHeaders = this.#getHeaders(bAddClient);
            const oConfig = {
                headers: oHeaders
            };

            this.#sUrlBasePath = oUri.origin();
            this.#sUrlRequestHref = oUri.href();

            this.#oClient = new HttpClient(this.#sUrlBasePath, oConfig);
            return this.#oClient.get(oUri.relativeTo(this.#sUrlBasePath).href())
                .then(this.#onSuccess.bind(this))
                .catch(this.#onError.bind(this));
        }

        /**
         * Aborts the running request
         *
         * @returns {boolean} Whether a request was running or not
         *
         * @since 1.87.0
         * @private
         */
        abort () {
            if (this.#oCurrentRequest && this.#oClient) {
                this.#oClient.abortAll();
                this.#oClient = null;
                this.#oCurrentRequest = null;
                return true;
            }
            return false;
        }

        /**
         * Converts the result of the request according to requirements of the dynamic tile
         * and reset the request
         *
         * @param {object} oResult Result of the request
         *
         * @since 1.87.0
         * @private
         */
        #onSuccess (oResult) {
            EventHub.emit("UITracer.trace", {
                source: "Tile",
                reason: "FetchData",
                data: {
                    providerId: this.#sContentProviderId,
                    targetUrl: this.#sUrlRequestHref,
                    status: 200
                }
            });
            let vResult;
            try {
                vResult = JSON.parse(oResult.responseText);
            } catch (err) {
                throw new Error("Was not able to parse response of dynamic tile request");
            }

            this.#oClient = null;
            this.#oCurrentRequest = null;
            let oData;

            if (typeof vResult === "object") {
                // OData v2 adds this additional "d" level
                vResult = vResult.d ? vResult.d : vResult;
                const oUriParameters = UriParameters.fromURL(this.#sUrlRequestHref);

                if (oUriParameters.get("$inlinecount") === "allpages") {
                    oData = { number: vResult.__count };

                // OData v4 $count=true
                } else if (oUriParameters.get("$count") === "true") {
                    oData = { number: vResult["@odata.count"] };

                } else {
                    oData = this.#extractData(vResult);
                }
            // plain result
            } else if (typeof vResult === "string" || typeof vResult === "number") {
                oData = { number: vResult };
            }

            this.#fnSuccess(oData);
        }

        /**
         * Calls the error handler and reset of the request
         *
         * @param {object} oError The error
         *
         * @since 1.87.0
         * @private
         */
        #onError (oError) {
            EventHub.emit("UITracer.trace", {
                source: "Tile",
                reason: "FetchData",
                data: {
                    providerId: this.#sContentProviderId,
                    targetUrl: this.#sUrlRequestHref,
                    status: oError.status
                }
            });
            this.#oClient = null;
            this.#oCurrentRequest = null;
            this.#fnError(oError);
        }

        /**
         * Converts and filters the data according to requirements of the dynamic tile
         *
         * @param {object} oData Result of the request
         * @returns {object} The converted object
         *
         * @since 1.87.0
         * @private
         */
        #extractData (oData) {
            const aSupportedKeys = [
                "results",
                "icon",
                "title",
                "number",
                "numberUnit",
                "info",
                "infoState",
                "infoStatus",
                "targetParams",
                "subtitle",
                "stateArrow",
                "numberState",
                "numberDigits",
                "numberFactor"
            ];

            // Filters data
            const oResult = Object.keys(oData).reduce((oAcc, sKey) => {
                if (aSupportedKeys.indexOf(sKey) > -1) {
                    oAcc[sKey] = oData[sKey];
                }
                return oAcc;
            }, {});

            if (!isEmptyObject(oResult)) {
                return oResult;
            }

            // Allow deeper nesting by one level when there is only one key in the first level,
            // this is needed in order to support that OData service operations (function imports) can return the dynamic tile data.
            const sFirstKey = Object.keys(oData)[0];
            if (sFirstKey !== undefined && Object.keys(oData).length === 1) {
                return Object.keys(oData[sFirstKey]).reduce((oAcc, sKey) => {
                    if (aSupportedKeys.indexOf(sKey) > -1) {
                        oAcc[sKey] = oData[sFirstKey][sKey];
                    }
                    return oAcc;
                }, {});
            }
            return {};
        }

        /**
         * Creates the request headers
         *
         * @param {boolean} bAddClient True if the sap-client should be added
         * @returns {object} The required headers
         *
         * @since 1.87.0
         * @private
         */
        #getHeaders (bAddClient) {
            const oHeaders = {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
                "Accept-Language": Configuration.getLanguage() || "",
                Accept: "application/json, text/plain"
            };

            const sSAPLogonLanguage = Configuration.getSAPLogonLanguage();
            if (sSAPLogonLanguage) {
                oHeaders["sap-language"] = sSAPLogonLanguage;
            }

            if (bAddClient) {
                const oLogonSystem = sap.ushell.Container.getLogonSystem();
                const sSapClient = oLogonSystem && oLogonSystem.getClient();
                if (sSapClient) {
                    oHeaders["sap-client"] = sSapClient;
                }
            }
            return oHeaders;
        }

        /**
         * Resolves the UserDefaults values within the request url
         *
         * @param {string} sUrl The request url
         * @param {string} [sContentProviderId] The ContentProviderId
         * @returns {Promise<string>} The resolved url
         *
         * @since 1.87.0
         * @private
         */
        async #resolveUserDefaults (sUrl, sContentProviderId) {
            const ClientSideTargetResolutionService = await sap.ushell.Container.getServiceAsync("ClientSideTargetResolution");
            const ReferenceResolverService = await sap.ushell.Container.getServiceAsync("ReferenceResolver");

            const oSystemContext = await ClientSideTargetResolutionService.getSystemContext(sContentProviderId);
            const oResult = await ushellUtils.promisify(ReferenceResolverService.resolveUserDefaultParameters(sUrl, oSystemContext));

            if (oResult.defaultsWithoutValue && oResult.defaultsWithoutValue.length > 0) {
                Log.error("The service URL contains User Default(s) with no set value: " + oResult.defaultsWithoutValue.join(", "), "", sModuleName);
                return;
            }

            if (oResult.ignoredReferences && oResult.ignoredReferences.length > 0) {
                // Filter ignored references for DynamicDate because they will be replaced later.
                const aIgnoredReferences = oResult.ignoredReferences.filter((sReference) => {
                    return !sReference.startsWith("DynamicDate");
                });
                if (aIgnoredReferences.length > 0) {
                    Log.error("The service URL contains invalid Reference(s): " + aIgnoredReferences.join(", "), "", sModuleName);
                    return;
                }
            }

            return oResult.url;
        }

        /**
         * Aborts the running requests and destroys the handler references
         *
         * @since 1.87.0
         * @private
         */
        destroy () {
            this.abort();
            this.#fnError = null;
            this.#fnSuccess = null;
        }
    }

    return DynamicTileRequest;

});
