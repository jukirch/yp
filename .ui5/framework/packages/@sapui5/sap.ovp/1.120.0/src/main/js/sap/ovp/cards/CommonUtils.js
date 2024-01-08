/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ui/Device",
    "sap/base/util/UriParameters",
    "sap/base/util/each",
    "sap/ui/model/json/JSONModel",
    "sap/ovp/app/OVPLogger"
], function (
    OVPCardAsAPIUtils,
    Device,
    UriParameters,
    each,
    JSONModel,
    OVPLogger
) {
    "use strict";

    var oLogger = new OVPLogger("OVP.cards.CommonUtils");

    return {
        app: undefined,
        navigationHandler: undefined,
        supportedCardTypes: [
            "sap.ovp.cards.list",
            "sap.ovp.cards.table",
            "sap.ovp.cards.stack",
            "sap.ovp.cards.linklist",
            "sap.ovp.cards.v4.list",
            "sap.ovp.cards.v4.table",
            "sap.ovp.cards.v4.linklist",
            "sap.ovp.cards.charts.analytical",
            "sap.ovp.cards.charts.smart.chart",
            "sap.ovp.cards.charts.bubble",
            "sap.ovp.cards.charts.donut",
            "sap.ovp.cards.charts.line"
        ],
        ovpConstantModel: new JSONModel({
            dontIncludeUOM: true,
            firstDataPointIndex: 0,
            secondDataPointIndex: 1,
            thirdDataPointIndex: 2,
            fourthDataPointIndex: 3,
            fifthDataPointIndex: 4,
            sixthDataPointIndex: 5,
            firstDataFieldIndex: 0,
            secondDataFieldIndex: 1,
            thirdDataFieldIndex: 2,
            fourthDataFieldIndex: 3,
            fifthDataFieldIndex: 4,
            sixthDataFieldIndex: 5
        }),
        deviceModel: new JSONModel(Device).setDefaultBindingMode("OneWay"),
        checkIfCardTypeSupported: function (sTemplate) {
            return this.supportedCardTypes.indexOf(sTemplate) !== -1;
        },
        enable: function (app, oNavHandler) {
            this.app = app;
            this.navigationHandler = oNavHandler;
        },
        getApp: function () {
            return this.app;
        },
        getNavigationHandler: function () {
            return this.navigationHandler;
        },
        createKeyForCB: function (oTabs, oTab) {
            return oTabs.indexOf(oTab) + 1;
        },
        /**
         * Creating OVP Cards for External Libraries
         *
         * @method createCardComponent
         * @param {Object} oView - View where the card's component will be set to a Container
         * @param {Object} oManifest - Manifest settings object
         * @param {String} sContainerId - Container's Id where card's component will be set
         * @param {Object} oSelectionVariant - Selection Variant Object
         * @param {Function} fnCheckNavigation - Custom Navigation check function returning true or false
         * @returns {Promise} - returns a promise on state of card creation
         */
        createCardComponent: function (
            oView,
            oManifest,
            sContainerId,
            oSelectionVariant,
            fnCheckNavigation
        ) {
            return OVPCardAsAPIUtils.createCardComponent(
                oView,
                oManifest,
                sContainerId,
                oSelectionVariant,
                fnCheckNavigation
            );
        },
        /**
         * TODO: This function should be changed whenever RuntimeAuthoring.prototype.setFlexSettings function changes
         * @returns {String|null} - returns the 'sap-ui-layer' parameter or null
         * @private
         */
        _getLayer: function () {
            // Check URI-parameters for sap-ui-layer
            var oUriParams = UriParameters.fromURL(window.location.href);
            return oUriParams.get("sap-ui-layer");
        },
        /**
         * @param {String} - query parameter key
         * @returns {String|null} - returns the query parameter value of the sParameter provided or null
         */
        getQueryParameterValue: function (sParameter) {
            var oUriParams = UriParameters.fromURL(window.location.href);
            return oUriParams.get(sParameter);
        },
        /**
         * Get layer settings namespace (By default it returns "customer" if no sap-ui-layer parameter in the url)
         * @returns {String} - the layer name in lower caps for the layer settings namespace
         * @private
         */

        _getLayerNamespace: function () {
            var sLayer = this._getLayer();
            /**
             *  Default Layer is Customer
             */
            if (!sLayer) {
                return "customer";
            }

            return sLayer.toLowerCase();
        },
        /* Returns column name that contains the unit for the measure */
        getUnitColumn: function (measure, oEntityType, forSubtitleUOM) {
            var tempUnit,
                properties = oEntityType.property;
            var sPath, sString;
            var UNIT_KEY_V4_ISOCurrency = "Org.OData.Measures.V1.ISOCurrency";
            var UNIT_KEY_V4_Unit = "Org.OData.Measures.V1.Unit";
            
            for (var i = 0, len = properties.length; i < len; i++) {
                if (properties[i].name !== measure) {
                    continue;
                }
                if (properties[i].hasOwnProperty(UNIT_KEY_V4_ISOCurrency)) {
                    //as part of supporting V4 annotation
                    sPath = properties[i][UNIT_KEY_V4_ISOCurrency].Path;
                    sString = properties[i][UNIT_KEY_V4_ISOCurrency].String;
                    if (sPath) {
                        return sPath;
                    } else {
                        return forSubtitleUOM ? sString : "";
                    }
                }
                if (properties[i].hasOwnProperty(UNIT_KEY_V4_Unit)) {
                    sPath = properties[i].hasOwnProperty(UNIT_KEY_V4_Unit).Path;
                    sString = properties[i][UNIT_KEY_V4_Unit].String;
                    if (sPath) {
                        tempUnit = sPath;
                    } else {
                        tempUnit = forSubtitleUOM ? sString : "";
                    }
                    if (tempUnit && tempUnit != "%") {
                        return tempUnit;
                    } else {
                        return null;
                    }
                }
                if (properties[i].hasOwnProperty("sap:unit")) {
                    return properties[i]["sap:unit"];
                }
                
                break;
            }
            return null;
        },

        /**
         * @param {string} sMeasure  name of the measure for which unit of measure is needed
         * @param {object} oMetaModel metaModel object
         * @param {string} sEntitySetName name of the entitySet
         * @param {boolean} bSubtitleUOM  boolean value maintained to check $String in UNIT_KEY_V4_ISOCurrency, to fetch UoM directly if $String is available instead of $Path
         * @return {string} updated column name that contains the UoM incase of bSubtitleUOM not passed, UoM incase of bSubtitleUOM true
        */

        getUnitColumnForODataV4: function (sMeasure, oMetaModel, sEntitySetName, bSubtitleUOM) {
            var sPath, sString;
            var UNIT_KEY_V4_ISOCurrency = "@Org.OData.Measures.V1.ISOCurrency";
            var oAnnotations = oMetaModel.getObject('/' + sEntitySetName + '/' + sMeasure + '@');

            if (oAnnotations && oAnnotations[UNIT_KEY_V4_ISOCurrency]) {
                sPath = oAnnotations[UNIT_KEY_V4_ISOCurrency].$Path;
                sString = oAnnotations[UNIT_KEY_V4_ISOCurrency].$String;
                if (sPath) {
                    return sPath;
                } else {
                    return bSubtitleUOM ? sString : "";
                }
            }
            return null;
        },

        /*
         * Hook function for Header Click
        **/
        onHeaderClicked: function () { },

        /*
         * Hook function for Content Click
        **/
        onContentClicked: function (oEvent) { },

        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                // check whether FLP has already set the content density class; do nothing in this case
                if (
                    document.body.classList.contains("sapUiSizeCozy") ||
                    document.body.classList.contains("sapUiSizeCompact")
                ) {
                    if (document.body.classList.contains("sapUiSizeCozy") === true) {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    } else if (document.body.classList.contains("sapUiSizeCompact") === true) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "";
                    }
                } else if (!Device.support.touch) {
                    // apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        },
        _setCardpropertyDensityAttribute: function () {
            var sContentDensityClassName = this.getContentDensityClass();
            if (sContentDensityClassName === "sapUiSizeCompact") {
                return "compact";
            } else if (sContentDensityClassName === "sapUiSizeCozy") {
                return "cozy";
            } else if (!Device.support.touch) {
                // apply "compact" mode if touch is not supported
                return "compact";
            } else {
                // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                return "cozy";
            }
        },
        //returns the number of pixel for one rem from the current browser font size
        getPixelPerRem: function () {
            // Returns a number
            var fontSize = parseFloat(
                // of the computed font-size, so in px
                getComputedStyle(
                    // for the root <html> element
                    document.documentElement
                ).fontSize
            );
            return fontSize;
        },
        /**
         * Shows the error messages from the body of an HTTP response.
         * @param {object} oError an object with error information.
         */
        showODataErrorMessages: function (oError) {
            var aMessages = [],
                mError,
                mResponseBody,
                result = "";
            if (oError && oError.responseText) {
                // It's an error coming in via the requestFailed event of the model
                var sResponse = oError.responseText;
                if (sResponse) {
                    try {
                        mResponseBody = JSON.parse(sResponse);
                    } catch (exception) {
                        oLogger.error("Failed parsing response as JSON: " + sResponse);
                    }
                    if (mResponseBody && mResponseBody.error) {
                        mError = mResponseBody.error;
                    }
                }
            }
            // Get messages from error
            if (mError && mError.innererror && mError.innererror.errordetails) {
                aMessages = mError.innererror.errordetails;
            }
            if (mError && mError.message && Array.isArray(aMessages)) {
                // Add the root message
                aMessages.unshift({
                    message: mError.message.value,
                    severity: "error"
                });
            }
            // Display the messages
            if (aMessages && aMessages.length > 0) {
                // SAP Gateway is overly cautious here and tends to provide you with the same error message multiple times. So let's keep track of the
                // messages that we've added already to avoid duplicates.
                // So here's the craziest thing: The OData framework does not only multiply messages but sometimes, it feels like it should add a dot
                // ('.') to the end of the message if not already available. This can result in the same message being displayed twice, once with a
                // dot and once without. So when we keep track of the messages that we've already added, we'll ignore the dot.
                var mAddedMessages = {};
                each(aMessages, function (iIdx, mMessage) {
                    var sMessageText = mMessage.message;
                    if (sMessageText.endsWith(".")) {
                        sMessageText = sMessageText.substr(0, sMessageText.length - 1);
                    }
                    if (!mAddedMessages[sMessageText]) {
                        mAddedMessages[sMessageText] = true;
                        result = result + sMessageText + " ";
                    }
                });
            }
            return result;
        },
        isODataV4: function (oModel) {
            return (
                (oModel && oModel.getODataVersion && oModel.getODataVersion() == "4.0") || false
            );
        },

        /**
         * Checks if the data is in JSON format or not
         * 
         * @param {string} sVariant Selection variant value
         * @returns {boolean} Return true if the selection variant is in JSON string format false otherwise
         */
        isJSONData: function (sVariant) {
            try {
                if (JSON.parse(sVariant)) {
                    return true;
                }
            } catch (err) {
                return false;
            }
        },

        /**
         * Checks if given property is of type semantic date range or not
         * => If type is 'Edm.DateTime' and 'sap:display-format' is Date and sap:filter-restriction exists either interval or single-value then returns true
         * => If type is 'Edm.String' and 'IsCalendarDate' annotation is enabled and sap:filter-restriction exists either interval or single-value then returns true false otherwise.
         * 
         * @param {object} oProperty Card defination object
         * @returns {boolean} If the given property is of type semantic date then true false otherwise.
        */
        isDate: function (oProperty) {
            if (((oProperty["type"] === "Edm.DateTime" && oProperty["sap:display-format"] === "Date") || (oProperty["type"] === "Edm.String" && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"] && oProperty["com.sap.vocabularies.Common.v1.IsCalendarDate"].Bool === "true")) && (oProperty["sap:filter-restriction"] === "interval" || oProperty["sap:filter-restriction"] === "single-value" || oProperty["_filterRestriction"] === "single-value")) {
                return true;
            }
            return false;
        },

        /**
         * 
         * Updates the property of an object with given value.
         * Updated sKey property of oMainObject with sValue
         * 
         * @param {object} oMainObject The object which needs to be updated
         * @param {string} sValue The value of the property
         * @param {string} sKey The key / Property of the object needs to be updated
         */
        updatePropertyValueForObject : function (oMainObject, sValue, sKey) {
            if (oMainObject && sValue && sKey) {
                if (sKey === "unitOfMeasurement") {
                    oMainObject["unitOfMeasurement"] = "{" + sValue + "}";
                } else if (Array.isArray(sValue) && sValue.length) {
                    oMainObject[sKey] = sValue;
                } else if (!Array.isArray(sValue)) {
                    oMainObject[sKey] = sValue;
                }
            }
        },

        /**
         * Remove the application component prefix
         * @param {string} sId
         * @returns {string} card id without the component prefix(if exists!)
         */
        removePrefixAndReturnLocalId: function(sId) {
            if (sId.indexOf("---") > -1) {
                return sId.split("---")[1];
            }
            return sId;
        },
        getCurrentAppIntent: function () {
            if (sap.ushell && sap.ushell.Container) {
                return sap.ushell.Container.getServiceAsync("AppLifeCycle")
                    .then(function (AppLifeCycleService) {
                        return AppLifeCycleService.getCurrentApplication();
                    })
                    .then(function (oResponse) {
                        return oResponse.getIntent();
                    }).catch(function (oError) {
                        oLogger.error(oError);
                        return Promise.reject(oError);
                    });
            }
        }
    };
}, /* bExport= */ true);
