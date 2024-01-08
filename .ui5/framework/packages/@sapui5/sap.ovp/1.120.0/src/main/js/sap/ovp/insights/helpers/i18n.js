/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ovp/app/OVPLogger", "sap/ui/thirdparty/jquery"], function (OVPLogger, jQuery) {
    "use strict";

    var oLogger = new OVPLogger("sap.ovp.insights.helpers.i18n");

    var VIZ_PROPERTY_STRINGS = {
        "content.chartProperties.color.title.text": {
            keyType: "Label",
            comment: "Colour text label for chart"
        },
        "content.chartProperties.size.title.text": {
            keyType: "Label",
            comment: "Size text label for chart"
        },
        "content.chartProperties.categoryAxis.title.text": {
            keyType: "Title",
            comment: "Category Axis text title for chart"
        },
        "content.chartProperties.valueAxis.title.text": {
            keyType: "Title",
            comment: "Value Axis text title for chart"
        },
        "content.chartProperties.actualValues.title.text": {
            keyType: "Title",
            comment: "Actual Values text title for chart"
        },
        "content.chartProperties.targetValues.title.text": {
            keyType: "Title",
            comment: "Target Values text title for chart"
        }
    };
    var oi18nMap = {};
    var aI18nPayload = [];

    /**
     * This function sets i18n values to a map 
     *  - In case if it is a new key create a key in map.
     *  - In case if it is an existsinig one update it.
     * 
     * @param {string} key
     * @param {string} value
     * @param {boolean} bNew If it is a new key or existsing one
     * @returns {}
     * @public
     */
    function seti18nValueToMap(key, value, bNew) {
        if (value.startsWith("{{") && bNew) {
            value = "{{INT_CARD_" + value.split("{{")[1];
        }
        oi18nMap[key] = value;
    }

    /**
     * Gets the key value of an object
     *  - In case if type of value is object return value o/w an object with keys object and key
     *
     * @param {object} obj The  object
     * @param {string} key
     * @returns {object} 
     * @public
     */
    function getPropertyValue(obj, key) {
        if (typeof obj[key] === "object") {
            return obj[key];
        }
        return { object: obj, key: key };
    }

    /**
     * Inserts i18n keys to manifest object
     * 
     * @param {object} object The manifest object
     * @returns {}
     * @public
     */
    function inserti18nKeysManifest(object) {
        var i18PropMap = oi18nMap;
        var oProperty;
        for (var i18nKey in i18PropMap) {
            oProperty = i18nKey.split(".").reduce(getPropertyValue, object);
            if (!oProperty.object[oProperty["key"]] && i18PropMap[i18nKey]) {
                oProperty.object[oProperty["key"]] = i18PropMap[i18nKey];
            } else if (oProperty.object[oProperty["key"]].trim().length > 0) {
                oProperty.object[oProperty["key"]] = i18PropMap[i18nKey];
            }
        }
    }

    /**
     * Gets the text classification for given i18n key and value
     * 
     * @param {string} sKeyType Type of key
     * @param {string} sComment The comments which needs to be added 
     * @returns {string} The text classification string
     * @public
     */
    function textClassification(sKeyType, sComment) {
        var keyMap = {
            "Title": "XTIT:",
            "Label": "XFLD:",
            "Button": "XBUT:",
            "Column header": "XCOL:"
        };
        var sKey = keyMap[sKeyType] || "";
        return sKey + " " + sComment;
    }

    /**
     * This function sets i18n payload to an array 
     * 
     * @param {string} sCardId
     * @param {string} sTitleKey
     * @param {string} sTitle
     * @param {string} sType
     * @param {string} sDescription
     * @returns {}
     * @public
     */
    function inserti18nPayLoad(sCardId, sTitleKey, sTitle, sType, sDescription) {
        var oPayload = {
            comment: textClassification(sType, sCardId + " " + sDescription),
            key: "INT_CARD_" + sTitleKey,
            value: sTitle
        };
        if (oPayload.value.trim().length > 0) {
            aI18nPayload.push(oPayload);
        }
    }

    function getAllIndexes(arr, val) {
        var aIndexes = [],
            i = -1;
        while ((i = arr.indexOf(val, i + 1)) !== -1) {
            aIndexes.push(i);
        }
        return aIndexes;
    }

    /**
     * This function writes i18n payload to manifest
     *
     * @returns {}
     * @public
     */
    function writei18nPayload() {
        if (aI18nPayload.length > 0) {
            var aCombinedKeyVal = aI18nPayload.map(function (value) {
                return value.key + value.comment;
            });
            // if duplicate entries for i18n keys remove duplicates
            for (var j = 0; j < aCombinedKeyVal.length; j++) {
                var aIndex = getAllIndexes(aCombinedKeyVal, aCombinedKeyVal[j]),
                    iCount;
                if (aIndex.length > 1) {
                    iCount = 0;
                    for (var k = 1; k < aIndex.length; k++) {
                        aI18nPayload.splice(aIndex[k] - iCount, 1);
                        aCombinedKeyVal.splice(aIndex[k] - iCount, 1);
                        iCount++;
                    }
                }
            }

            jQuery
                .ajax({
                    type: "POST",
                    url: "/editor/i18n",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(aI18nPayload),
                    success: function (oResponse) {
                        oLogger.info("Success:", oResponse);
                    },
                    error: function (oError) {
                        oLogger.error("Error:", oError);
                    }
                })
                .done(function (msg) {
                    oLogger.info("Data Saved: " + msg);
                });
        }
    }

    /**
     * This function resets variable i.e. aI18nPayload and oi18nMap
     *
     * @returns {}
     * @public
     */
    function reseti18nProperties() {
        aI18nPayload = [];
        oi18nMap = {};
    }

    /**
     * Replace language direct texts from manifest file with new keys
     *
     * @param {object} oObject The SAP Card object
     * @param {string} sCardId
     * @returns {}
     * @public
     */
    function replaceStringsWithKeys(oObject, sCardId) {
        if (!oObject || !sCardId) {
            return;
        }
        for (var selectedKey in VIZ_PROPERTY_STRINGS) {
            var sStringValue = _getDeepValue(oObject, selectedKey);
            if (!sStringValue) {
                continue;
            }
            var sKeyName = sStringValue.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, "");
            var sKey = sCardId + "_" + sKeyName.replace(/ /g, "_") + "_" + selectedKey.replaceAll(".", "_");
            var sType = VIZ_PROPERTY_STRINGS[selectedKey].keyType;
            var sComment = VIZ_PROPERTY_STRINGS[selectedKey].comment;
            this.seti18nValueToMap(selectedKey, "{{" + sKey + "}}", true);
            this.inserti18nPayLoad(sCardId, sKey, sStringValue, sType, sComment);
        }
    }
    
    /**
     * Get Deep value of the keys defined in VIZ_PROPERTY_STRINGS from SAP Card Object
     *
     * @param {object} oObject The SAP Card object
     * @param {string} sKey
     * @returns {string}
     * @public
     */
    function _getDeepValue(object, sKey) {
        return sKey.split(".").reduce(function (o, k) {
            return (o || {})[k];
        }, object);
    }

    /**
     * Inserts i18n payload for title and subtitle in case if i18n key not already exists for both properties
     *
     * @param {String} sPropertyVal Property value i.e. value of title or subtitle
     * @param {String} sCardId  Card id
     * @param {String} sType
     * @param {String} sDescription Whether the property id title or subtile will be used for i18n key generation
     * @returns {String} Returns the i18n key for respective property
     */
    function generatei18nKeyAppProperty(sPropertyVal, sCardId, sType, sDescription) {
        var sIntegrationCardPrefix = "INT_CARD_";
        var sKeyName = sDescription.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, "");
        var sTitleKey = sCardId + "_" + sKeyName.replace(/ /g, "_");
        this.inserti18nPayLoad(sCardId, sTitleKey, sPropertyVal, sType, sDescription);
        return "{{" + sIntegrationCardPrefix + sTitleKey + "}}";
    }

    /**
     * In case if title and subtitle of app is not an i18n string then generate i18n key for both properties
     *
     * @param {Object} oManifestAppData Sap.app entry of manifest
     * @param {Object} oRawManifest Raw manifest data
     * @param {Object} oCardDefinition Card defination object
     * @returns {Object} Returns an object of title and subtitle of sap.app object both of the properties will have i18n key
     */
    function getKeysForAppProperties(oManifestAppData, oRawManifest, oCardDefinition) {
        var oRawManifestAppData = oRawManifest && oRawManifest["sap.app"];
        var oResult = {
            title: "",
            subtitle: ""
        };
        if (oRawManifestAppData) {
            var sTitle = oRawManifestAppData.title || "";
            var sSubTitle = oRawManifestAppData["subtitle"] || oRawManifestAppData["description"] || "";
            var sCardId = oCardDefinition.cardComponentData.cardId;
            if (sTitle && sTitle.startsWith("{")) {
                oResult.title = sTitle;
            } else if (sTitle) {
                //generate i18n key for title
                sTitle = oManifestAppData.title;
                oResult.title = generatei18nKeyAppProperty(sTitle, sCardId, "Title", "App Title");
            }
            if (sSubTitle && sSubTitle.startsWith("{")) {
                oResult.subtitle = sSubTitle;
            } else if (sSubTitle) {
                //generate i18n key for subtitle
                sSubTitle = oManifestAppData.subtitle || oManifestAppData.description;
                oResult.subtitle = generatei18nKeyAppProperty(sSubTitle, sCardId, "Title", "App Subtitle");
            }
        }
        return oResult;
    }

    /**
     * This function creates i18n keys from text
     *  - In case if text does not start with "{" create a key and set key and value to i18n map, also upload the i18n payload to the array.
     *  - In case if it is already a key then no need to create a new key.
     *
     * @param {string} sCardId
     * @param {string} sText
     * @param {string} sType Type of text eg: title, label
     * @param {string} sComment
     * @param {string} sPath
     * @returns {Object} Returns an object containing key, isNew and text as a property
     */
    function createKeysFromText(sCardId, sText, sType, sComment, sPath) {
        if (sText && !sText.startsWith("{")) {
            var sKeyFromPath = sPath && sPath.split(".").join("_");
            var sTitleKey = sCardId + "_" + sKeyFromPath + "_" + sComment.replace(/ /g, "_");
            this.seti18nValueToMap(sPath, "{{" + sTitleKey + "}}", true);
            this.inserti18nPayLoad(sCardId, sTitleKey, sText, sType, sComment);
            return {
                key: "{{" + sTitleKey + "}}",
                text: sText,
                isNew: true
            };
        }
        return {
            key: sText,
            isNew: false
        };
    }

    /**
     * This function handles replaces configuration parameters i18n keys in case if header Details are referring to configuration params in RT Mode
     *
     * @param {string} sHeaderDetails The header details string
     * @param {Object} oManifest
     * @param {Object} oi18nModel The i18n model
     */
    function fnReplaceConfigParamsi18nKeys(sHeaderDetails, oManifest, oi18nModel) {
        var sHeaderPath = sHeaderDetails.substring(2, sHeaderDetails.length - 2),
            sConfigParamPath = "configuration." + sHeaderPath,
            oConfigParamDetails = _getDeepValue(oManifest["sap.card"], sConfigParamPath),
            sConfigParamValue = oConfigParamDetails && oConfigParamDetails.value;

        if (sConfigParamValue && sConfigParamValue.startsWith("{{")) {
            sConfigParamValue = sConfigParamValue.substring(2, sConfigParamValue.length - 2);
            oConfigParamDetails.value = oi18nModel.getProperty(sConfigParamValue);
        }
    }

     /**
     * This function handles replacing header Details i18n keys with values in case of RT mode
     *
     * @param {Object} oManifest The generated manifest
     * @param {Object} oi18nModel The i18n model
     */
    function handleHeaderDetails(oManifest, oi18nModel) {
        var oCardHeader = oManifest["sap.card"]["header"],
            sHeaderDetails = oCardHeader.details;

        if (sHeaderDetails && sHeaderDetails.startsWith("{{")) {
            if (sHeaderDetails.indexOf("parameters") > -1) {
                var bMultipleDetailStrings = sHeaderDetails.indexOf("|") > -1;
                if (bMultipleDetailStrings) {
                    var aPaths = sHeaderDetails.split("|") || [];
                    aPaths.forEach(function(sPath) {
                        sPath = sPath.trim();
                        fnReplaceConfigParamsi18nKeys(sPath, oManifest, oi18nModel);
                    });
                } else {
                    fnReplaceConfigParamsi18nKeys(sHeaderDetails, oManifest, oi18nModel);
                }
            } else {
                var sPath = sHeaderDetails.substring(2, sHeaderDetails.length - 2);
                oCardHeader.details = oi18nModel.getProperty(sPath);
            }
        }
    }

    /**
     * This function returns the i18n key's value for the passed i18nkey property or default string value
     *
     * @param {string} sValue the i18n key property or string value
     * @param {Object} oi18nModel The i18n model
     */
    function getI18nValueOrDefaultString(sValue, oi18nModel) {
        var sPath = "";
        if (sValue && sValue.startsWith("{{")) {
            sPath = sValue.substring(2, sValue.length - 2);
            return oi18nModel.getProperty(sPath);
        }
        return sValue;
    }

    /**
     * This function replaces all i18n keys with i18n value in manifest object in case of RT mode
     *
     * @param {Object} oManifest The generated manifest
     * @param {Object} oi18nModel The i18n model
     */
    function fnReplacei18nKeysWithText(oManifest, oi18nModel) {
        if (oManifest && oi18nModel) {
            var oSapApp = oManifest["sap.app"],
                oCardHeader = oManifest["sap.card"]["header"];

            oSapApp.title = getI18nValueOrDefaultString(oSapApp.title, oi18nModel);
            oSapApp.subTitle = getI18nValueOrDefaultString(oSapApp.subTitle, oi18nModel);
            oCardHeader.title = getI18nValueOrDefaultString(oCardHeader.title, oi18nModel);
            oCardHeader.subTitle = getI18nValueOrDefaultString(oCardHeader.subTitle, oi18nModel);

            handleHeaderDetails(oManifest, oi18nModel);
        }
    }

    return {
        seti18nValueToMap: seti18nValueToMap,
        inserti18nKeysManifest: inserti18nKeysManifest,
        inserti18nPayLoad: inserti18nPayLoad,
        writei18nPayload: writei18nPayload,
        reseti18nProperties: reseti18nProperties,
        replaceStringsWithKeys: replaceStringsWithKeys,
        getKeysForAppProperties: getKeysForAppProperties,
        createKeysFromText: createKeysFromText,
        fnReplacei18nKeysWithText: fnReplacei18nKeysWithText,
        getI18nValueOrDefaultString: getI18nValueOrDefaultString
    };
});
