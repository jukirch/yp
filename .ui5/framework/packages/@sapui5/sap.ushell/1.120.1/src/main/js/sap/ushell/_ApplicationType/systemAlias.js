// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/thirdparty/URI",
    "sap/ushell/utils",
    "sap/base/util/isPlainObject",
    "sap/base/Log"
], function (
    URI,
    oUtils,
    isPlainObject,
    Log
) {
    "use strict";

    var S_LOCAL_SYSTEM_ALIAS = ""; // the empty value means the LOCAL system alias. Adapter should resolve this by design.
    var O_SYSTEM_ALIAS_SEMANTICS = {
        apply: "apply",
        applied: "applied"
    };

    /**
     * Determines whether the given URI object is absolute or not.
     *
     * @param {URI} oURI
     *    The URI object to check.
     *
     * @returns {boolean}
     *    Whether the given URI object is absolute.
     */
    function isAbsoluteURI (oURI) {
        return (oURI.protocol() || "").length > 0;
    }

    /**
     * Resolves a system id using the adapter if necessary. It rejects the
     * promise in case the adapter does not implement the
     * 'resolveSystemAlias' method.
     *
     * @param {string} sSystemAlias
     *   The id of the system to be resolved.
     *
     * @param {string} sSystemDataSrc
     *   Whether the system data should be taken from a system other than the
     *   local system where the FLP runs.
     *
     * @param {function} [fnExternalResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @returns {Promise}
     *   A promise that resolves to a system alias resolved by the
     *   adapter or rejects with an error message if the adapter cannot
     *   resolve the system alias.
     *
     *   <p> NOTE: the "fallback:" prefix in the error message of the
     *   rejected promise is currently used as a convention to trigger
     *   fallback behavior. </p>
     *
     * @private
     */
    function _resolveSystemAlias (sSystemAlias, sSystemDataSrc, fnExternalResolver) {
        // Check local storage first
        var bSystemDataSrcProvided = typeof sSystemDataSrc === "string";
        var aSystemIds = [sSystemAlias];
        if (bSystemDataSrcProvided) {
            aSystemIds.unshift(sSystemDataSrc);
        }

        var sKey = oUtils.generateLocalStorageKey("sap-system-data", aSystemIds);
        var oLocalStorage = oUtils.getLocalStorage();
        var sSerializedSystemData = oLocalStorage.getItem(sKey);
        var oSystemData = {};

        if (sSerializedSystemData) {
            try {
                oSystemData = JSON.parse(sSerializedSystemData);
            } catch (oError) {
                return Promise.reject("Cannot parse system data from local storage at key '" + sKey + "'. Data: " + sSerializedSystemData);
            }
            return Promise.resolve(oSystemData);
        } else if (bSystemDataSrcProvided) {
            // Fail in this case, because the navigation **must** be done in
            // the context of the source system.
            return Promise.reject("Cannot find data for system '" + sSystemAlias + "' in local storage using key '" + sKey + "'");
        }


        // Check adapter
        // Prepare to call resolveSystemAlias, ensure method is there.
        if (!fnExternalResolver) {
            return Promise.reject("fallback: the adapter does not implement resolveSystemAlias");
        }

        return new Promise(function (fnResolve, fnReject) {
            fnExternalResolver(sSystemAlias)
                .done(function (oResolvedSystemAlias) {
                    fnResolve(oResolvedSystemAlias);
                })
                .catch(function (vError) {
                    fnReject(vError);
                });
        });
    }

    /**
     * Applies the given system alias to the given URI object.
     *
     * @param {string} sSystemAlias
     *   The name of the system alias to interpolate the given URI with.
     *
     * @param {string} sSystemDataSrc
     *   The id of another system. Indicates that the data for the given
     *   sSystemAlias should be resolved in the context of a system other than
     *   the current system.
     *
     * @param {URI} oURI
     *   The URI object to interpolate with the system alias.
     * @param {string} sURIType
     *   The type of URI (e.g., "TR")
     *
     * @param {function} [fnExternalSystemAliasResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @returns {Promise}
     *   A promise that resolves to a URI object with data from the given
     *   sSystemAlias.
     *
     * @private
     */
    function _applyAliasToURI (sSystemAlias, sSystemDataSrc, oURI, sURIType, fnExternalSystemAliasResolver) {
        var oNewURI = oURI;

        var oPromise = new Promise(function (fnResolve, fnReject) {
            // Interpolate oURI
            _resolveSystemAlias(sSystemAlias, sSystemDataSrc, fnExternalSystemAliasResolver)
                .catch(function (sErrorMessage) {
                    fnReject(sErrorMessage);
                })
                .then(function (oResolvedSystemAlias) {
                    var oValidation = validateResolvedSystemAlias(oResolvedSystemAlias);
                    if (!oValidation.isValid) {
                        reportResolvedSystemAliasValidationErrors(oValidation);
                        fnReject("Invalid system alias definition");
                        return;
                    }

                    var sSystemAliasDataName = _selectSystemAliasDataName(oResolvedSystemAlias, new URI(window.location.toString()).protocol());
                    var oSystemAliasData = oResolvedSystemAlias[sSystemAliasDataName];
                    var sQuery;
                    var sLanguage;
                    var oUser;

                    // replace using data in oSystemAliasData

                    // Add web-related parts
                    if (sSystemAlias === S_LOCAL_SYSTEM_ALIAS
                        && oSystemAliasData.host === ""
                        && (oSystemAliasData.port === 0 || oSystemAliasData.port === "")) {
                        // Cancel the protocol to avoid having
                        // "https:///sap/bc/...". We want a relative URL in this
                        // case.
                        sSystemAliasDataName = "";
                    }

                    oNewURI.protocol(sSystemAliasDataName); // http or https
                    oNewURI.hostname(oSystemAliasData.host);
                    oNewURI.port(oSystemAliasData.port);

                    _interpolatePathPrefixIntoURI(oNewURI, sURIType, oSystemAliasData.pathPrefix, fnExternalSystemAliasResolver)
                        .catch(function (sErrorMessage) {
                            fnReject(sErrorMessage);
                        })
                        .then(function (oNewURI) {
                            // add sap-client and sap-language in case we have data for them
                            sQuery = oNewURI.query();
                            if (typeof oResolvedSystemAlias.client === "string" && oResolvedSystemAlias.client !== "") {
                                sQuery = sQuery + (sQuery.length > 0 ? "&" : "") + "sap-client=" + oResolvedSystemAlias.client;
                            }

                            // set sap-language
                            if (typeof oResolvedSystemAlias.language === "string" && oResolvedSystemAlias.language !== "") {
                                sLanguage = oResolvedSystemAlias.language;
                            } else {
                                oUser = sap.ushell.Container.getUser();
                                if (!oUser) {
                                    Log.error(
                                        "Cannot retieve the User object via sap.ushell.Container while determining sap-language",
                                        "will default to 'en' language",
                                        "sap.ushell.services.ClientSideTargetResolution"
                                    );
                                    sLanguage = "en";
                                } else {
                                    sLanguage = oUser.getLanguage();
                                }
                            }
                            sQuery = sQuery + (sQuery.length > 0 ? "&" : "") + "sap-language=" + sLanguage;
                            oNewURI.query(sQuery);

                            // native webgui interpolation
                            if (oResolvedSystemAlias.hasOwnProperty("rfc") && sURIType === "NATIVEWEBGUI") {
                                var sWebguiParameters = _constructNativeWebguiParameters(oResolvedSystemAlias.rfc, oSystemAliasData.host, oNewURI);
                                var sPathWithParameters = oNewURI.path() + ";" + sWebguiParameters;

                                // 1. invalidate internal oURI _string cache
                                oNewURI.path(sPathWithParameters); // NOTE: after this, oURI._parts.path is
                                // partly unescaped (but we want to keep escaping!)

                                // Overwrite internal _parts.path member of URI object.
                                //
                                // With 1. the _string cache is invalidated, and this new _parts.path should be used to
                                // reconstruct it when the toString() method is next called.
                                //
                                oURI._parts.path = sPathWithParameters;
                            }

                            fnResolve(oNewURI);
                        });
                });
        });

        return oPromise;
    }

    /**
     * Resolves the given sSapSystem interpolating the result into the
     * given oURI object.
     *
     * @param {URI} oURI
     *   An URI object representing the current URI.
     *
     * @param {string} [sSystemAlias]
     *   The sap-system alias that was used to generate the url in
     *   <code>oURI</code>. The value <code>undefined</code> will
     *   implicitly indicate that the url in <code>oURI</code> was not
     *   generated or processed based on a sap-system alias.
     *
     * @param {string} sSapSystem
     *   The sap-system alias to be resolved, may be undefined.  The object
     *   is mutated, e.g. server, port, and search (sap-client within
     *   search) are modified to represent the actual system.
     *
     * @param {string} sSapSystemDataSrc
     *   The id of the system that holds expanded data about the given
     *   <code>sSapSystem</code>
     *
     * @param {string} sURIType
     *   The type of URI passed as first parameter, for example, "WDA".
     *
     * @param {string} sSystemAliasSemantics
     *  How to interpret the system alias in relation to a configured URL. This
     *  can be one of the following two strings:
     *  <ul>
     *  <li>applied: the system alias was already applied to the URL</li>
     *  <li>apply: the system alias is to be applied to the URL</li>
     *  </ul>
     *
     * @param {function} [fnExternalSystemAliasResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @returns {Promise<sap.ui.thirdparty.URI>}
     *   A promise that is resolved with a modified URI object, or rejected
     *   with two parameters in case it was not possible to resolve the
     *   given sap-system.
     *
     *   <p> NOTE: the "fallback:" prefix in the error message of the
     *   rejected promise is currently used as a convention to trigger
     *   fallback behavior.  </p>
     *
     * @private
     */
    function spliceSapSystemIntoURI (oURI, sSystemAlias, sSapSystem, sSapSystemDataSrc, sURIType, sSystemAliasSemantics, fnExternalSystemAliasResolver) {

        if (sSystemAliasSemantics !== O_SYSTEM_ALIAS_SEMANTICS.apply && sSystemAliasSemantics !== O_SYSTEM_ALIAS_SEMANTICS.applied) {
            throw new Error("Invalid system alias semantic was provided: '" + sSystemAliasSemantics + "'");
        }

        // Cases in which there is no need to manipulate the source url.
        if (sSystemAliasSemantics === O_SYSTEM_ALIAS_SEMANTICS.applied && ( // assuming system alias was already applied...
            (// ... no sap system to apply
                typeof sSapSystem === "undefined"
                || sSystemAlias === sSapSystem) // ... sap system is the same as the (already applied) system alias
        )) {
            return Promise.resolve(oURI);
        }

        if (sSystemAliasSemantics === O_SYSTEM_ALIAS_SEMANTICS.apply // if the logic is to apply something...
            && typeof sSystemAlias === "undefined"
            && typeof sSapSystem === "undefined") { // ... but there is nothing that can be applied

            return Promise.resolve(oURI);
        }

        // Treat URL types where a system alias was already applied separately...
        if (sURIType === "URL" && sSystemAliasSemantics === O_SYSTEM_ALIAS_SEMANTICS.applied) {
            return _spliceSapSystemIntoUrlURI(oURI, sSystemAlias, sSapSystem, sSapSystemDataSrc, fnExternalSystemAliasResolver);
        }

        var oResultPromise = new Promise(function (fnResolve, fnReject) {
            if (sSystemAliasSemantics === O_SYSTEM_ALIAS_SEMANTICS.apply) {
                fnResolve({
                    targetUri: oURI,
                    alias: sSapSystem || sSystemAlias,
                    sapSystemSrc: sSapSystem
                        ? sSapSystemDataSrc
                        : undefined
                }); // don't strip URI, just apply.
                return;
            }

            // 'applied' semantics

            _stripURI(oURI, sSystemAlias, undefined /* sSystemDataSrc */, sURIType, fnExternalSystemAliasResolver)
                .catch(function (sErrorMessage) {
                    fnReject(sErrorMessage);
                })
                .then(function (oStrippedURI) {
                    fnResolve({
                        targetUri: oStrippedURI,
                        alias: sSapSystem
                    });
                });
        })
            .then(function (oApply) {
                return _applyAliasToURI(oApply.alias, oApply.sapSystemSrc, oApply.targetUri, sURIType, fnExternalSystemAliasResolver);
            });

        return oResultPromise;
    }

    /**
     * Resolves the given sSapSystem interpolating the result into the
     * given oURI object.
     *
     * @param {URI} oURI
     *   An URI object representing the current URL type.
     *
     * @param {string} [sSystemAlias]
     *   The sap-system alias that was used to generate the url in
     *   <code>oURI</code>. The value <code>undefined</code> will
     *   implicitly indicate that the url in <code>oURI</code> was not
     *   generated or processed based on a sap-system alias.
     *
     * @param {string} sSapSystem
     *   The sap-system alias to be resolved, may be undefined.  The object
     *   is mutated, e.g. server, port, and search (sap-client within
     *   search) are modified to represent the actual system.
     *
     * @param {string} sSapSystemDataSrc
     *   The id of the system that holds expanded data about the given
     *   <code>sSapSystem</code>
     *
     * @returns {Promise}
     *   A promise that is resolved with a modified URI object, or rejected
     *   with two parameters in case it was not possible to resolve the
     *   given sap-system.
     *
     *   <p> NOTE: the "fallback:" prefix in the error message of the
     *   rejected promise is currently used as a convention to trigger
     *   fallback behavior. </p>
     *
     * @param {function} [fnExternalSystemAliasResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @private
     */
    function _spliceSapSystemIntoUrlURI (oURI, sSystemAlias, sSapSystem, sSapSystemDataSrc, fnExternalSystemAliasResolver) {
        /*
         * Deal with empty system alias cases
         *
         * having an empty or undefined system alias indicates that the URL
         * was not pre-interpolated.
         */
        var oResultPromise = new Promise(function (fnResolve, fnReject) {
            if (sSystemAlias === S_LOCAL_SYSTEM_ALIAS || typeof sSystemAlias === "undefined") {
                // absolute urls are kept as is and resolved directly
                if (isAbsoluteURI(oURI)) {
                    fnResolve(oURI);
                    return;
                }

                // no need to check for containment of all parts, can apply sap
                // system directly as the url is relative.
                fnResolve(_applyAliasToURI(sSapSystem, sSapSystemDataSrc, oURI, "URL", fnExternalSystemAliasResolver)
                    .then(function (oURIWithSystemAlias) {
                        return oURIWithSystemAlias;
                    })
                );
            }

            /*
             * At this point we need to detect the case in which an absolute
             * URL was given because the system alias was applied to it.  To
             * detect this, we try to strip each piece of the system alias from
             * the URL and if we are not successful we can assume the URL was
             * hardcoded.
             */
            fnResolve(
                _resolveSystemAlias(sSystemAlias, sSapSystemDataSrc, fnExternalSystemAliasResolver) // must check if the URL was given absolute because of the systemAlias
                    .catch(function (sError) {
                        fnReject(sError);
                    })
                    .then(function (oResolvedSystemAlias) {
                        var sSystemAliasDataName = _selectSystemAliasDataName(
                            oResolvedSystemAlias, new URI(window.location.toString()).protocol()
                        ),
                            oSystemAliasData = oResolvedSystemAlias[sSystemAliasDataName],
                            sDeinterpolatedPath;

                        // Check if URL contains *all* the parts from the systemAlias
                        if ((oURI.protocol() || "").toLowerCase() === sSystemAliasDataName &&
                            (oURI.hostname() || "") === oSystemAliasData.host &&
                            (oURI.path().indexOf(oSystemAliasData.pathPrefix) === 0)) {
                            // URL was interpolated - must de-interpolate it!
                            oURI.protocol("");
                            oURI.hostname("");
                            sDeinterpolatedPath = oURI.path().replace(oSystemAliasData.pathPrefix, "");
                            oURI.path(sDeinterpolatedPath);
                            removeParametersFromURI(oURI, ["sap-language", "sap-client"]);

                            // URL was de-interpolated, apply sap system!
                            return _applyAliasToURI(sSapSystem, sSapSystemDataSrc, oURI, "URL", fnExternalSystemAliasResolver)
                                .then(function (oURIWithSystemAlias) {
                                    return oURIWithSystemAlias;
                                });
                        }
                        return oURI;
                    })
            );
        });
        return oResultPromise;
    }

    /**
     * Generates the list of "tilde-parameters" necessary to start a native
     * Webgui transaction, based on the given RFC information and the current
     * host name.
     *
     * @param {object} oSystemAliasDataRfc
     *   The "rfc" section of the resolved system alias data.
     *
     * @param {string} sSystemAliasHttpHost
     *   The host name that will be part of the http or https URL.
     *
     * @returns {string}
     *   The parameters to be appended to a Native webgui URL.
     *
     * @private
     */
    function _constructNativeWebguiParameters (oSystemAliasDataRfc, sSystemAliasHttpHost) {
        var bRfcHostIsConnectString,
            bRfcHostSameAsHttpHost,
            bIsLoadBalancing,
            aTransactionParamSet,
            sRfcHostName;

        /*
         * Add a certain subset of parameters depending on
         * whether load balancing is active in rfc. For now use:
         *
         * system id provided -> load balancing active
         */
        bIsLoadBalancing = !!oSystemAliasDataRfc.systemId;

        if (bIsLoadBalancing) {
            aTransactionParamSet = [
                oSystemAliasDataRfc.systemId && ("~sysid=" + oSystemAliasDataRfc.systemId),
                oSystemAliasDataRfc.loginGroup && ("~loginGroup=" + oSystemAliasDataRfc.loginGroup),
                oSystemAliasDataRfc.sncNameR3 && ("~messageServer=" + encodeURIComponent(oSystemAliasDataRfc.sncNameR3)),
                oSystemAliasDataRfc.sncNameR3 && ("~sncNameR3=" + encodeURIComponent(oSystemAliasDataRfc.sncNameR3)),
                oSystemAliasDataRfc.sncQoPR3 && ("~sncQoPR3=" + oSystemAliasDataRfc.sncQoPR3)
            ].filter(function (o) {
                return (typeof o === "string") && (o !== "");
            }); // remove empty parameters
        } else {
            sRfcHostName = (oSystemAliasDataRfc.host || "");
            bRfcHostSameAsHttpHost = sRfcHostName.toLowerCase() === sSystemAliasHttpHost.toLowerCase();

            // Connect string: /H/<host>/S/<service>/M/<message server>/S/<service>..."
            // See wikipage: /wiki/x/NnT-ag
            bRfcHostIsConnectString = /^[/][HGMR][/].*/.test(sRfcHostName);

            if (sRfcHostName.length > 0 && !bRfcHostSameAsHttpHost && !bRfcHostIsConnectString) {
                Log.error(
                    "Invalid connect string provided in 'host' field of system alias",
                    "Data for rfc destination provided are: " + JSON.stringify(oSystemAliasDataRfc, null, 3),
                    "sap.ushell.services.ClientSideTargetResolution"
                );
            }

            aTransactionParamSet = [
                sRfcHostName && !bRfcHostIsConnectString && !bRfcHostSameAsHttpHost && ("~rfcHostName=" + sRfcHostName),
                bRfcHostIsConnectString && ("~connectString=" + encodeURIComponent(sRfcHostName)),
                oSystemAliasDataRfc.service && ("~service=" + oSystemAliasDataRfc.service),
                oSystemAliasDataRfc.sncNameR3 && ("~sncNameR3=" + encodeURIComponent(oSystemAliasDataRfc.sncNameR3)),
                oSystemAliasDataRfc.sncQoPR3 && ("~sncQoPR3=" + oSystemAliasDataRfc.sncQoPR3)
            ].filter(function (o) {
                return (typeof o === "string") && (o !== "");
            }); // remove empty parameters
        }

        return aTransactionParamSet.join(";")
            .replace(/(%[A-F0-9]{2})/g, function (sEncodedChars) { // lower case all HEX-encoded strings to avoid double
                return sEncodedChars.toLowerCase(); // encoding format (lower case is currently used anywhere
            }); // else when dealing with URLs.
    }

    /**
     * De-interpolates a URL interpolated with data (protocol, port...)
     * from a system alias.
     *
     * @param {URI} oURI
     *   A URI object that may or may not have been interpolated with a
     *   certain system alias.
     *
     * @param {string} sSystem
     *   The system alias or sap-system the url in <code>oURI</code> was
     *   interpolated with, or <code>undefined</code> if the URL was not
     *   intepolated.  <p>This is used as a hint to de-interpolate the URL path
     *   prefix.</p>
     *
     * @param {string} sSystemDataSrc
     *   The id of another system. Indicates that the data for the indicated
     *   system should be taken from a system other than the current system.
     *
     * @param {string} sURIType
     *   The type of URI, for example, "WDA".
     *
     * @param {function} [fnExternalSystemAliasResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @returns {Promise}
     *   A promise that resolves to a URI object containing a URL
     *   de-interpolated of parts from a system alias.
     *
     * @private
     */
    function _stripURI (oURI, sSystem, sSystemDataSrc, sURIType, fnExternalSystemAliasResolver) {
        var oPromise = new Promise(function (fnResolve, fnReject) {
            if (typeof sSystem === "undefined") {
                fnResolve(
                    _stripURIWithSystemAlias(oURI, sSystem, sURIType, undefined, fnExternalSystemAliasResolver)
                );
                return;
            }

            fnResolve(
                _resolveSystemAlias(sSystem, sSystemDataSrc, fnExternalSystemAliasResolver)
                    .then(function (oResolvedSystemAlias) {
                        return _stripURIWithSystemAlias(oURI, sSystem, sURIType, oResolvedSystemAlias, fnExternalSystemAliasResolver);
                    })
            );
        });

        return oPromise;
    }

    /**
     * Helper for {@link #_stripURI}.
     *
     * @param {URI} oURI
     *   A URI object that may or may not have been interpolated with a
     *   certain system alias.
     * @param {string} sSystemAlias
     *   The system alias the url in <code>oURI</code> was interpolated
     *   with, or <code>undefined</code> if the URL was not intepolated.
     *   <p>This is used as a hint to de-interpolate the URL path
     *   prefix.</p>
     * @param {string} sURIType
     *   The type of URI, for example, "WDA".
     * @param {object} oResolvedSystemAlias
     *   The resolved system alias
     * @param {function} [fnExternalSystemAliasResolver]
     *    An external resolver that can be used to resolve the system alias
     *    outside the platform-independent code.
     *
     * @returns {Promise}
     *   A promise that resolves to a URI object containing a URL
     *   de-interpolated of parts from a system alias.
     *
     * @private
     */
    function _stripURIWithSystemAlias (oURI, sSystemAlias, sURIType, oResolvedSystemAlias, fnExternalSystemAliasResolver) {
        // Strip web-related parts
        oURI.protocol("");
        oURI.hostname("");
        oURI.port("");

        var oPromise = new Promise(function (fnOuterResolve) {
            var oSystemAliasData, sSystemAliasDataName;

            removeParametersFromURI(oURI, ["sap-client", "sap-language"]);

            /*
             * Only modify paths if we are going to replace a systemAlias (i.e.,
             * take into account undefined system alias -> no replacement).
             */
            if (!isPlainObject(oResolvedSystemAlias) || typeof sSystemAlias !== "string") {
                fnOuterResolve(oURI);
            }

            // guess what web system alias was used to interpolate URL
            sSystemAliasDataName = _selectSystemAliasDataName(
                oResolvedSystemAlias, new URI(window.location.toString()).protocol()
            );
            oSystemAliasData = oResolvedSystemAlias[sSystemAliasDataName];

            // decide path prefix
            var oInnerPromise = new Promise(function (fnResolve, fnReject) {
                var sSystemAliasPathPrefix = (typeof oSystemAliasData.pathPrefix === "string") && oSystemAliasData.pathPrefix;
                if (sSystemAliasPathPrefix !== "") {
                    // current system alias is good enough for de-interpolate
                    fnResolve(sSystemAliasPathPrefix);
                } else {
                    // must use local path prefix
                    _resolveSystemAlias("" /* local system alias */, undefined, fnExternalSystemAliasResolver)
                        .catch(function (sErrorMessage) {
                            fnReject(sErrorMessage);
                        })
                        .then(function (oResolvedLocalSystemAlias) {
                            var oResolvedLocalSystemAliasData = oResolvedLocalSystemAlias[sSystemAliasDataName];
                            fnResolve(oResolvedLocalSystemAliasData.pathPrefix);
                        });
                }
            }).then(function (sSystemAliasPathPrefix) {
                var sTmpPath;
                if (sSystemAliasPathPrefix && sSystemAliasPathPrefix.length > 0) {
                    // use the obtained data to strip path prefix, otherwise assume it was hardcoded
                    sTmpPath = oURI.path();
                    sTmpPath = sTmpPath.replace(sSystemAliasPathPrefix, "");

                    // Check also for WCF-specific, enhanced prefix
                    if (sSystemAliasPathPrefix === "/sap/bc/") {
                        sTmpPath = sTmpPath.replace("/sap(====)/bc/", "");
                    }

                    // add leading forward slash if replacement deleted it
                    if (sTmpPath.indexOf("/") !== 0) {
                        sTmpPath = "/" + sTmpPath;
                    }

                    oURI.path(sTmpPath);
                }

                // Deal with transaction related parts
                if (sURIType === "NATIVEWEBGUI" && oResolvedSystemAlias.hasOwnProperty("rfc")) {
                    // remove all rfc related parameters from the path
                    sTmpPath = oURI.path();
                    sTmpPath = sTmpPath.split(";")
                        .filter(function (sParam) {
                            return sParam.indexOf("~sysid=") !== 0 &&
                                sParam.indexOf("~service=") !== 0 &&
                                sParam.indexOf("~loginGroup=") !== 0 &&
                                sParam.indexOf("~messageServer=") !== 0 &&
                                sParam.indexOf("~sncNameR3=") !== 0 &&
                                sParam.indexOf("~sncQoPR3=") !== 0;
                        })
                        .join(";");

                    oURI.path(sTmpPath);
                }

                return oURI;
            });
            fnOuterResolve(oInnerPromise);

        });

        return oPromise;
    }

    /**
     * Select the name of the right system alias among those available in
     * the given collection.
     *
     * @param {object} oSystemAliasData
     *   All available system alias data. An object with either one or both
     *   http/https, like:
     *   <pre>
     *   {
     *      "http": { ... },
     *      "https": { ... }
     *   }
     *   </pre>
     * @param {string} sBrowserLocationProtocol
     *   The protocol displayed in the current url. Can be obtained via
     *   <code>window.location.url</code>.
     *
     * @returns {string}
     *   The name of the right system alias name in
     *   <code>oSystemAliasData</code>, or logs an error message
     *   and returns undefined if it was not possible to determine the
     *   name of the right system alias name.
     *
     * @private
     */
    function _selectSystemAliasDataName (oSystemAliasData, sBrowserLocationProtocol) {
        // 1. prefer https
        if (oSystemAliasData.hasOwnProperty("https")) {
            return "https";
        }

        // 2. fallback to http
        if (oSystemAliasData.hasOwnProperty("http")) {
            return "http";
        }

        Log.error(
            "Cannot select which system alias to pick between http/https",
            "make sure they are provided in the given system alias collection",
            "sap.ushell.services.ClientSideTargetResolution"
        );

        return undefined;
    }

    /**
     * Logs system alias validation errors on the console.
     *
     * @param {object} oValidation
     *    Validation data generated via <code>#validateResolvedSystemAlias</code>
     *
     * @private
     */
    function reportResolvedSystemAliasValidationErrors (oValidation) {
        Log.error(
            "Invalid system alias definition: " + oValidation.debug,
            "ERRORS:" + oValidation.errors.map(function (sError) {
                return "\n - " + sError;
            }).join(""),
            "sap.ushell.ApplicationType"
        );
    }

    /**
     * Validates a resolved system alias.
     *
     * @param {object} oResolvedSystemAlias
     *    A system alias resolved by the adapter. An object like:
     *    <pre>
     *        "http": {
     *            "id": "ALIAS111",
     *            "host": "vmw.example.corp.com",
     *            "port": 44335,
     *            "pathPrefix": "/go-to/the/moon"
     *        },
     *        "https": {
     *            "id": "ALIAS111_HTTPS",
     *            "host": "vmw.example.corp.com",
     *            "port": 44335,
     *            "pathPrefix": "/go-to/the/moon"
     *        },
     *        "rfc": {
     *            "id": "",
     *            "systemId": "",
     *            "host": "",
     *            "service": 32,
     *            "loginGroup": "",
     *            "sncNameR3": "",
     *            "sncQoPR3": ""
     *        },
     *        "id": "ALIAS111",
     *        "client": "111",
     *        "language": ""
     *    </pre>
     *
     * @returns {object}
     *    An object describing whether the system alias is valid or not. It's an object structured like:
     *    <pre>
     *    {
     *      isValid: false,
     *      errors: "error message",   // only provided when invalid
     *      debug: "..." // printable string representing the system alias that was checked
     *    }
     *    </pre>
     *
     * @private
     */
    function validateResolvedSystemAlias (oResolvedSystemAlias) {
        function validateWebProtocolField (oField) {
            var aErrors = [];

            if (typeof oField.host !== "string") {
                aErrors.push("host field must be a string");
            }
            if (typeof oField.port !== "number" && typeof oField.port !== "string") {
                aErrors.push("port field must be a number or a string");
            }
            if (typeof oField.pathPrefix !== "string") {
                aErrors.push("pathPrefix field must be a string");
            }

            return aErrors;
        }

        var aErrors = [],
            bHasHttpsField = oResolvedSystemAlias.hasOwnProperty("https"),
            bHasHttpField = oResolvedSystemAlias.hasOwnProperty("http");

        // A correct system alias must have one of http/https defined
        if (!bHasHttpField && !bHasHttpsField) {
            aErrors.push("at least one of 'http' or 'https' fields must be defined");
        }

        if (bHasHttpsField) {
            validateWebProtocolField(oResolvedSystemAlias.https).forEach(function (sError) {
                aErrors.push("https>" + sError);
            });
        }
        if (bHasHttpField) {
            validateWebProtocolField(oResolvedSystemAlias.http).forEach(function (sError) {
                aErrors.push("http>" + sError);
            });
        }

        if (aErrors.length > 0) {
            return {
                isValid: false,
                errors: aErrors,
                debug: JSON.stringify(oResolvedSystemAlias, null, 3)
            };
        }

        return { isValid: true };
    }

    /**
     * Removes the specified parameters from the given URI object. Treats
     * the given object which is mutated.
     *
     * @param {URI} oURI
     *    The URI object to remove parameter from.
     * @param {string[]} aParametersToRemove
     *    An array of parameters to remove from oURI query
     *
     * @private
     */
    function removeParametersFromURI (oURI, aParametersToRemove) {
        var oBannedParametersLookup = {},
            sTmpQuery;

        aParametersToRemove.forEach(function (sParam) {
            oBannedParametersLookup[sParam] = true;
        });

        sTmpQuery = oURI.query();
        sTmpQuery = sTmpQuery
            .split("&")
            .filter(function (sParam) {
                var sParamName = (sParam.split("=")[0] || "").toLowerCase();
                return !oBannedParametersLookup.hasOwnProperty(sParamName);
            })
            .join("&");
        oURI.query(sTmpQuery);
    }

    /**
     * Helper method to interpolate the given path prefix into the given
     * URI object, taking into account that the empty path prefix should be
     * resolved to the local path prefix.
     *
     * @param {URI} oURI
     *   The URI object to interpolate tha path prefix into.
     * @param {string} sURIType
     *   The type of the URI being interpolated. e.g., "WEBGUI"
     * @param {string} sPathPrefixToInterpolate
     *   The path prefix to interpolate. The empty string indicates that
     *   the path prefix should be taken from the local system alias.
     *   <p>
     *      <b>IMPORTANT</b> this parameter cannot be <code>undefined</code>
     *   </p>
     *
     * @param {function} [fnExternalSystemAliasResolver]
     *   An external resolver that can be used to resolve the system alias
     *   outside the platform-independent code.
     *
     * @returns {Promise}
     *   A promise that resolves to a URI object amended with the given path prefix.
     *
     * @private
     */
    function _interpolatePathPrefixIntoURI (oURI, sURIType, sPathPrefixToInterpolate, fnExternalSystemAliasResolver) {
        var sTmpPath;

        var oPromise = new Promise(function (fnResolve) {
            // Do not treat empty path prefix as local path prefix
            if (sURIType === "URL" && sPathPrefixToInterpolate.length === 0) {
                fnResolve(oURI);
                return;
            }

            fnResolve(_resolveSystemAlias("", undefined /* sSystemDataSrc */, fnExternalSystemAliasResolver)
                .then(function (oResolvedSystemAlias) {

                    var sSystemAliasDataName = _selectSystemAliasDataName(
                        oResolvedSystemAlias, new URI(window.location.toString()).protocol()
                    );
                    var sLocalPathPrefix = oResolvedSystemAlias[sSystemAliasDataName].pathPrefix;
                    var bPathPrefixMatchesLocal = sPathPrefixToInterpolate === sLocalPathPrefix;

                    if (sPathPrefixToInterpolate.length > 0 && !bPathPrefixMatchesLocal) {
                        if ((sURIType === "WDA" || sURIType === "WEBGUI") && oURI.path().indexOf("~canvas") >= 0) {
                            // Strip the complete path if we are dealing with WDA and TR urls.
                            sTmpPath = oURI.path();
                            sTmpPath = "/~canvas" + sTmpPath.split("~canvas")[1]; // "<anything>~canvas;<anything>" -> "/~canvas;<anything>"
                            oURI.path(sTmpPath);
                        }
                    }

                    function prependPath (sPath) {
                        var sResultPath = sPath + oURI.path();
                        oURI.path(sResultPath.replace(/\/+/g, "/")); // avoid double slashes
                        return oURI;
                    }

                    if (sPathPrefixToInterpolate.length === 0) {
                        // WCF special case to optimize performance: when the session placeholder (====) already exists
                        // in the URL, WCF avoids a roundtrip
                        if (sURIType === "WCF" && sLocalPathPrefix === "/sap/bc/") {
                            return prependPath("/sap(====)/bc/");
                        }
                        return prependPath(sLocalPathPrefix);
                    }

                    return prependPath(sPathPrefixToInterpolate);
                })
            );
        });

        return oPromise;
    }

    return {
        LOCAL_SYSTEM_ALIAS: S_LOCAL_SYSTEM_ALIAS,
        SYSTEM_ALIAS_SEMANTICS: O_SYSTEM_ALIAS_SEMANTICS,
        spliceSapSystemIntoURI: spliceSapSystemIntoURI,
        isAbsoluteURI: isAbsoluteURI,

        // for testing
        _stripURI: _stripURI,
        _selectSystemAliasDataName: _selectSystemAliasDataName,
        _constructNativeWebguiParameters: _constructNativeWebguiParameters
    };
});
