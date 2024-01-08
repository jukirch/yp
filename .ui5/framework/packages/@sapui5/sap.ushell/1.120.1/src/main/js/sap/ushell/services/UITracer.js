// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The Unified Shell's UI tracing service.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/EventHub",
    "sap/base/util/isPlainObject",
    "sap/base/Log",
    "sap/ushell/Config",
    "sap/ui/Device",
    "sap/base/util/fetch"
], function (
    EventHub,
    isPlainObject,
    Log,
    Config,
    Device,
    fetch
) {
    "use strict";

    var MAX_BYTE_SIZE = 0x8000; // 32kB
    var START_BYTE_SIZE = 0x2; // 2 Bytes for an empty array
    var COMMA_SIZE = 1; // 1 Byte to add for size calculation
    var EVENT_NAME = "UITracer.trace";

    /**
     * @alias sap.ushell.services.UITracer
     * @class
     * @classdesc Allows passing trace entries from the client to a service endpoint in CEP.
     * UI traces can be used for metering or usage analysis.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("UITracer")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * <p>
     * Besides the trace method the UITracer listens to the EventHub event "UITracerService.trace"
     * Logging from other modules can be easily done by emitting the event.
     * <pre>
     * <code>
     *  EventHub.emit("UITracerService.trace", {
     *     reason: "TraceReason",
     *     source: "SourceOfTheTrace",
     *     data: {your data}
     *  })
     * </code>
     * </pre>
     *
     * For all traces the UITracer will enhance the trace entry with additional information:
     * {
     *     _ts: iso string of time.
     *     reason: "TraceReason",
     *     source: "SourceOfTheTrace",
     *     data: {
     *       your data
     *       deviceType: browser-desktop|browser-tablet|browser-phone
     *       siteType: sap-start|wz-standard|wz-advanced
     *       siteId: id of the current site
     *     }
     * }
     *
     * <b>UI Trace Objects for Metering Information</b>
     * For metering relevant trace entries a special schema of the traced object needs to be used.
     * It needs to contain at least the information below.
     * Currently metering relevant is
     * - AppLaunch to URL or Intent from Tile, Link, Search or Card.
     * - AppNavigate for Intent based navigation.
     * - DataFetch from Tile or Card.
     * - Init from Card.
     *
     *
     *
     * LaunchApp - Tile
     * - targetUrl can start with # or fully qualified url.
     * - an app launch is reported only with a targetUrl. In case an intent based navigation is triggered afterwards,
     *   the AppNavigate with source Intent is reported.
     * - for metering the combination of AppLaunch and AppNavigate will be combined in the trace backend
     *   service for intent based navigation.
     * <code>
     * {
     *   "source": "Tile",
     *   "reason":"LaunchApp",
     *   "data": {
     *      "targetUrl": "#Action-toappnavsample",
     *   }
     * }
     * </code>
     *
     * LaunchApp - Link
     * - targetUrl can start with # or fully qualified url.
     * - an app launch is reported only with a targetUrl. In case an intent based navigation is triggered afterwards,
     *   the AppNavigate with source Intent is reported.
     * - for metering the combination of AppLaunch and AppNavigate will be combined in the trace backend
     *   service for intent based navigation.
     * <code>
     * {
     *   "source": "Link",
     *   "reason":"LaunchApp",
     *   "data": {
     *      "targetUrl": "#Action-toappnavsample",
     *   }
     * }
     * </code>
     *
     * LaunchApp - Card
     * - targetUrl can start with # or fully qualified url.
     * - an app launch is reported with a targetUrl. In case an intent based navigation is triggered afterwards,
     *   the AppNavigate with source Intent is reported.
     * - additionally the card (manifest sap.app/id) and the providerId is reported in any case.
     * - for metering the combination of AppLaunch and AppNavigate will be combined in the trace backend
     *   service for intent based navigation.
     * <code>
     * {
     *   "source": "Card",
     *   "reason":"LaunchApp",
     *   "data": {
     *      "cardId": "card.explorer.table.card",
     *      "providerId": "provider2",
     *      "targetUrl": "#Action-toappnavsample",
     *   }
     * }
     * </code>
     *
     * LaunchApp - Search
     * - targetUrl can start with # or fully qualified url.
     * - an app launch is reported with a targetUrl. In case an intent based navigation is triggered afterwards,
     *   the AppNavigate with source Intent is reported.
     * - for metering the combination of AppLaunch and AppNavigate will be combined in the trace backend
     *   service for intent based navigation.
     * <code>
     * {
     *   "source": "Search",
     *   "reason":"LaunchApp",
     *   "data": {
     *      "targetUrl": "#Action-toappnavsample",
     *   }
     * }
     * </code>
     *
     * NavigateApp - Intent
     * @see sap.ushell.renderer.Shell.controller#_notifyUITracer
     * {
     *   "source":"Intent",
     *   "reason": "NavigateApp",
     *   "data": {
     *     "applicationId": "sap.ushell.demo.AppNavSample",
     *     "applicationType": "URL",
     *     "hash": "#Action-toappnavsample",
     *     "targetNavigationMode": "inplace",
     *     "providerId": "provider2",
     *     "targetUrl": "../../demoapps/AppNavSample"
     * }
     *
     * FetchData - Tile
     * @see sap.ushell.utils.DynamicTileRequest#_onSuccess, ushell.utils.DynamicTileRequest#_onError
     * <code>
     * {
     *   "source": "Tile",
     *   "reason": "FetchData",
     *   "data": {
     *      "providerId": "my.comp.ns.cpkg",
     *      "targetUrl": "https://services.odata.org/V4/Northwind/Northwind.svc/Products?%24format=json",
     *      "status":200
     *   }
     * }
     * </code>
     *
     * FetchData - Card
     * @see sap.ushell.components.workPageBuilder.controller.WorkPageHost#.fetch
     * <code>
     * {
     *   "source": "Card",
     *   "reason": "FetchData",
     *   "data": {
     *      "cardId": "my.company.ns.data.list.card",
     *      "providerId": "my.comp.ns.cpkg",
     *      "targetUrl": "https://services.odata.org/V4/Northwind/Northwind.svc/Products?%24format=json",
     *      "status":200
     *   }
     * }
     * </code>
     *
     * Init - Card
     * @see  sap.ushell.components.workPageBuilder.controller.WorkPageHost#.attachCardStateChanged
     * {
     *   source: "Card",
     *   reason: "Init",
     *   data: {
     *     cardId: "my.company.ns.data.list.card",
     *     providerId: "my.comp.ns.cpkg"
     *   }
     * }
     *
     * @param {object} oContainerInterface Container Interface
     * @param {string} sParameter Parameter
     * @param {object} oConfig Config
     *
     * @hideconstructor
     *
     * @since 1.116.0
     * @private
     */
    function UITracer (oContainerInterface, sParameter, oConfig) {
        this._sServiceUrl = oConfig.serviceUrl || "/bff/ui-trace/v1/trace";
        this._pToken = null;
        this._sToken = "";
        this._resetTrace();
        this._attachBrowserEvents();
        this._attachEventHubEvents();
        this._sSpacesPages = Config.last("/core/spaces/enabled") ? "-spaces" : "-groups";
        this._sSiteType = "wz-standard" + this._sSpacesPages;
        this._sSiteId = (new URLSearchParams(window.location.search)).get("siteId") || Config.last("/core/site/siteId");
        this._sDeviceType = this._getDeviceType();

        if (sap.ushell.Container) {
            this._initialized = sap.ushell.Container.getFLPPlatform().then(function (sPlatform) {
                if (sPlatform === "MYHOME") {
                    this._sSiteType = "sap-start" + this._sSpacesPages;
                    return;
                }
                // wz-standard or wz-advanced or wz-advancedhr needs to be decided on the existence of the WorkzoneHome/SFHost app.
                // WorkzoneHome application is the root for WZ advanced content shown in Iframe.
                // SFHost is application navigation to SF system.
                // in future this should be based on connected providers?
                return sap.ushell.Container.getServiceAsync("CommonDataModel").then(function (oCDMModel) {
                    oCDMModel.getApplications().then(function (mApplications) {
                        if (mApplications.SFHost) {
                            this._sSiteType = "wz-advancedhr" + this._sSpacesPages;
                        } else if (mApplications.WorkzoneHome) {
                            this._sSiteType = "wz-advanced" + this._sSpacesPages;
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        } else {
            this._initialized = Promise.resolve();
        }
    }

    /**
     * Requests a token from the the service.
     *
     * @private
     * @since 1.117.0
     */
    UITracer.prototype._getToken = function () {
        this._pToken = fetch(this._sServiceUrl)
            .then(
                function (oResponse) {
                    this._sToken = "-";
                    return oResponse.json();
                }.bind(this)
            )
            .then(
                function (oJson) {
                    if (oJson && oJson.token) {
                        this._sToken = oJson.token;
                    }
                }.bind(this)
            )
            .catch(
                function () {
                    Log.debug(
                        "UITracer: getToken failed on " + this._sServiceUrl,
                        "",
                        "sap.ushell.services.UITracer"
                    );
                    this._sToken = "-";
                }.bind(this)
            );
    };

    /**
     * Traces the given object and passes it on to the server
     * if window is closed or trace size limit is reached.
     *
     * @param {object} oEntry The trace entry.
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype.trace = function (oEntry) {
        if (!this._sToken && !this._pToken) {
            this._getToken();
        }
        this._addEntry(oEntry);
    };

    /**
     * @returns {string} The device type for the trace.
     * as "browser-desktop", "browser-tablet", "browser-phone".
     */
    UITracer.prototype._getDeviceType = function () {
        var sSystem = "desktop";
        if (Device.system.tablet) {
            sSystem = "tablet";
        } else if (Device.system.phone) {
            sSystem = "phone";
        }
        return "browser-" + sSystem;
    };

    /**
     * Resets the trace list, size and
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._resetTrace = function () {
        this._aTrace = [];
        this._iSize = START_BYTE_SIZE;
    };

    /**
     * Adds a clone of the entry to the trace and calculates the size.
     * If, by adding, the size of the trace (32kB) would be succeeded, the trace is send.
     * Additional attributes are added to the clone:
     *   _ts: Current timestamp.
     * @param {object} oEntry The trace entry.
     * @returns {boolean} true if the entry was added, otherwise false.
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._addEntry = function (oEntry) {
        if (isPlainObject(oEntry) && Object.keys(oEntry).length > 0) {
            try {
                var oTraceEntry = this._createTraceEntry(oEntry);
                var iEntrySize = this._getBlob(oTraceEntry).size + COMMA_SIZE;
                if (this._iSize + iEntrySize > MAX_BYTE_SIZE) {
                    this._sendTrace();
                }
                this._iSize += iEntrySize;
                this._aTrace.push(oTraceEntry);
                Log.debug(
                    "UITracer: Trace entry added with size " + iEntrySize,
                    JSON.stringify(oTraceEntry),
                    "sap.ushell.services.UITracer"
                );
                return true;
            } catch (ex) {
                return false;
            }
        }
        return false;
    };

    /**
     * Creates a trace entry with additional technical fields in a clone of the given entry.
     * @param {object} oEntry The original entry
     * @returns {object} the trace entry with technical fields
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._createTraceEntry = function (oEntry) {
        var oTraceEntry = JSON.parse(JSON.stringify(oEntry));
        var oData = oTraceEntry.data || {};

        // enrich data
        oData.siteType = this._sSiteType;
        oData.siteId = this._sSiteId;
        oData.deviceType = this._sDeviceType;

        // add timestamp and new data
        oTraceEntry._ts = new Date().toISOString();
        oTraceEntry.data = oData;

        return oTraceEntry;
    };

    /**
     * Sends the trace to the serviceUrl given by the configuration.
     * Request is only sent if the trace is not empty.
     * In case the force flag is set (true) and the last entry has reason LaunchApp with data.targetUrl with #
     * sending is suppressed.
     *
     * sendBeacon method of the browser is used to send the request.
     * Beacon request are POST request and have a size limit of 64kB.
     * UITracer uses half that size, see MAX_BYTE_SIZE.
     *
     * @param {boolean} bForce force immediate send (for onbeforeunload).
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._sendTrace = function (bForce) {
        if (!this._sToken || this._sToken === "-") {
            Log.debug(
                "UITracer: _sendTrace failed, token " + this._sToken === "-" ? "request failed " : "is missing",
                "",
                "sap.ushell.services.UITracer"
            );
            return;
        }
        if (this._aTrace.length > 0) {
            var oLastEntry = this._aTrace[this._aTrace.length - 1];
            if (!bForce && oLastEntry.reason === "LaunchApp" &&
                oLastEntry.data &&
                oLastEntry.data.targetUrl &&
                oLastEntry.data.targetUrl.indexOf("#") === 0) {
                // do not send the entries immediately, wait for next trace entry (probably a NavigateApp event) {
                return;
            }
            var oBlob = this._getBlob({
                token: this._sToken,
                data: this._aTrace
            });
            try {
                window.navigator.sendBeacon(this._sServiceUrl, oBlob);
                Log.debug(
                    "UITracer: _sendTrace to " +
                    this._sServiceUrl +
                    "with size " +
                    oBlob.size +
                    " byte, entry count " + this._aTrace.length,
                    "",
                    "sap.ushell.services.UITracer"
                );
            } catch (ex) {
                Log.debug(
                    "UITracer: _sendTrace failed " +
                    this._sServiceUrl +
                    "with size " +
                    oBlob.size +
                    " byte, entry count " + this._aTrace.length,
                    "",
                    "sap.ushell.services.UITracer"
                );
            }
        }
        this._resetTrace();
    };

    /**
     * Creates an application/json Blob from a given parameter
     *
     * @param {object|string} vValue A serializable js object or string.
     * @returns {Blob} The Blob representation of oEntry or null
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._getBlob = function (vValue) {
        if (isPlainObject(vValue) || Array.isArray(vValue)) {
            vValue = JSON.stringify(vValue);
        }
        if (typeof vValue === "string") {
            return new Blob([vValue], {
                type: "application/json"
            });
        }
        return null;
    };

    /**
     * Attaches to handlers to visibilitychange or alternatively to beforeunload browser events.
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._attachBrowserEvents = function () {
        // ensure to send the trace if page is closed

        if (document.visibilityState) {
            document.addEventListener(
                "visibilitychange",
                function () {
                    if (document.visibilityState === "hidden") {
                        this._sendTrace();
                    }
                }.bind(this)
            );
        }
        // ensure that unload forces send
        window.addEventListener(
            "beforeunload",
            function () {
                this._sendTrace(true /*force*/);
            }.bind(this)
        );
    };

    /**
     * Attaches to the EventHub "UITracerService.trace" event
     *
     * @private
     * @since 1.116.0
     */
    UITracer.prototype._attachEventHubEvents = function () {
        EventHub.on(EVENT_NAME).do(
            function (oEntry) {
                this.trace(oEntry);
            }.bind(this)
        );
    };

    UITracer.hasNoAdapter = true;
    return UITracer;
}, true /* bExport */);
