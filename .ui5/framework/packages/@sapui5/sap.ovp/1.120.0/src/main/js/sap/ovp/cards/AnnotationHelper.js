/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * Any function that needs to be exported(used outside this file) via namespace should be defined as
 * a function and then added to the return statement at the end of this file
 */
sap.ui.define([
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/format/DateFormat",
    "sap/ovp/cards/CommonUtils",
    "sap/ui/model/odata/AnnotationHelper",
    "sap/ui/model/odata/v4/AnnotationHelper",
    "sap/ui/Device",
    "sap/ovp/app/resources",
    "sap/base/strings/formatMessage",
    "sap/base/util/isPlainObject",
    "sap/base/util/each",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/base/util/merge",
    "sap/ovp/app/OVPLogger",
    "sap/base/util/isEmptyObject",
    "sap/ui/comp/odata/type/FiscalDate",
    "sap/ui/comp/odata/FiscalFormat",
    "sap/ui/core/library",
    "sap/ovp/cards/Constants",
    "sap/ovp/helpers/V4/MetadataAnalyzer",
    "sap/ovp/app/OVPUtils",
    "sap/ovp/cards/Filterhelper"
], function (
    NumberFormat,
    DateFormat,
    CommonUtils,
    OdataAnnotationHelper,
    oDataV4AnnotationHelper,
    Device,
    OvpResources,
    formatMessage,
    isPlainObject,
    each,
    MetadataAnalyser,
    merge,
    OVPLogger,
    isEmptyObject,
    FiscalDate,
    FiscalFormat,
    coreLibrary,
    CardConstants,
    V4MetadataAnalyzer,
    OVPUtils,
    Filterhelper
) {
    "use strict";

    var mErrorMessages = CardConstants.errorMessages;

    var ANNOTATIONTYPE = {
        TEXT: "com.sap.vocabularies.Common.v1.Text",
        TEXT_ARRANGEMENT: "com.sap.vocabularies.UI.v1.TextArrangement",
        UOM: "Org.OData.Measures.V1.Unit",
        ISO_CURRENCY: "Org.OData.Measures.V1.ISOCurrency"
    };

    var TextArrangementType = {
        TEXT_LAST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast",
        TEXT_FIRST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst",
        TEXT_ONLY: "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly",
        TEXT_SEPARATE: "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate"
    };

    var oLogger = new OVPLogger("OVP.cards.AnnotationHelper");

    /*This function takes a dataitem (can be Datafield or DatafieldForAnnotation) and returns the corresponding Label by
     * reading from that dataitem. If not present there, then pick sap:label from metadata for that particular
     * property from entity type*/
    function getLabelForDataItem(iContext, oDataItem) {
        if (!oDataItem) {
            return "";
        }

        var bODataV4 = isODataV4Context(iContext);

        if (oDataItem.Label) {
            return bODataV4 ? oDataItem.Label : oDataItem.Label.String;
        }
        //If control reaches here, that means Label not defined at dataitem level
        //so check if there is any sap:label present at Entity property level
        //Property name should be present to extract sap:label

        var oModel = iContext.getSetting && iContext.getSetting("ovpCardProperties");
        //oModel is just a JSON model
        //oEntityType is the one associated with the card
        var oMetaModel = oModel && oModel.getProperty("/metaModel");
        var oEntityType = oModel && oModel.getProperty("/entityType");
        if (!oMetaModel || !oEntityType) {
            return "";
        }
        var sPropertyName;

        //For datafields, value is there
        if (oDataItem.Value) {
            sPropertyName = bODataV4 ? oDataItem.Value.$Path : oDataItem.Value.Path;
        }
        //For DatafieldForAnnotation, target is there
        //Pick the property name by reading from target datapoint
        if (oDataItem.Target) {
            var sTargetPath = bODataV4 ? "/" + getTargetPathForDataFieldForAnnotation(oEntityType.$Type, oDataItem, iContext) : getTargetPathForDataFieldForAnnotation(oEntityType.$path, oDataItem, iContext);
            var oDataPoint = sTargetPath && oMetaModel.getProperty(sTargetPath);
            sPropertyName = bODataV4 ? oDataPoint && oDataPoint.Value.$Path : oDataPoint && oDataPoint.Value.Path;
        }
        if (!sPropertyName || !sPropertyName.length > 0 || sPropertyName === " ") {
            return "";
        }

        var oProperty = bODataV4 ? oMetaModel.getData()["$Annotations"][oEntityType.$Type + "/" + sPropertyName] : oMetaModel.getODataProperty(oEntityType, sPropertyName);
        if (!oProperty) {
            return "";
        }
        //If sap:label found, return value from first condition
        //If first condition returns undefined or null, then  check if com.sap.vocabularies.Common.v1.Label found, if not, then
        //second condition returns "".String which is also undefined, then control flows to third condition
        //Finally return "" from third condition
        var sLabel = "";
        if (bODataV4) {
            sLabel = oProperty["@com.sap.vocabularies.Common.v1.Label"] || "";
        } else {
            sLabel = oProperty["sap:label"] || (oProperty["com.sap.vocabularies.Common.v1.Label"] || "").String || "";
        }

        return sLabel;
    }
    getLabelForDataItem.requiresIContext = true;

    function setAlignmentForDataPoint(iContext) {
        if (iContext.EdmType === "Edm.DateTime" || iContext.EdmType === "Edm.DateTimeOffset") {
            return "Right";
        }
        return "Left";
    }
    setAlignmentForDataPoint.requiresContext = true;

    function getCacheEntry(iContext, sKey) {
        if (iContext.getSetting) {
            var oCache = iContext.getSetting("_ovpCache");
            // temp fix
            if (oCache) {
                return oCache[sKey];
            }
        }
        return undefined;
    }

    function setCacheEntry(iContext, sKey, oValue) {
        if (iContext.getSetting) {
            var oCache = iContext.getSetting("_ovpCache");
            // temp fix
            if (oCache) {
                oCache[sKey] = oValue;
            }
        }
    }

    function criticality2state(criticality, oCriticalityConfigValues, bODataV4) {
        var sState, sEnumMember;
        if (oCriticalityConfigValues) {
            sState = oCriticalityConfigValues.None;
            sEnumMember = bODataV4 ? criticality && criticality.$EnumMember : criticality && criticality.EnumMember;
            if (sEnumMember) {
                if (endsWith(sEnumMember, "Negative")) {
                    sState = oCriticalityConfigValues.Negative;
                } else if (endsWith(sEnumMember, "Critical")) {
                    sState = oCriticalityConfigValues.Critical;
                } else if (endsWith(sEnumMember, "Positive")) {
                    sState = oCriticalityConfigValues.Positive;
                }
            }
        }
        return sState;
    }

    function criticalityState2Value(sState) {
        if (sState == "Error") {
            sState = 1;
        } else if (sState == "Warning") {
            sState = 2;
        } else if (sState == "Success") {
            sState = 3;
        } else {
            sState = 0;
        }
        return sState;
    }

    function endsWith(sString, sSuffix) {
        return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
    }

    function calculateCriticalityState(
        value,
        sImproveDirection,
        deviationLow,
        deviationHigh,
        toleranceLow,
        toleranceHigh,
        oCriticalityConfigValues,
        bODataV4
    ) {
        if (typeof value == "string" && bODataV4) { // Check if applicable for v2 as well
            value = NumberFormat.getIntegerInstance().parse(value);
        }
        var oCriticality = {};
        oCriticality.EnumMember = "None";

        // Consider fallback values for optional threshold values in criticality calculation
        // after considering fallback values if all the values required for calculation are not present then the criticality will be neutral

        /* example - in case of maximizing
         * if deviationLow is mentioned and toleranceLow not mentioned, then toleranceLow = deviationLow
         * if toleranceLow is mentioned and deviationLow not mentioned, then deviationLow = Number.NEGATIVE_INFINITY
         * if both values are not mentioned then there will not be any calculation and criticality will be neutral
         * */

        var nMinValue = Number.NEGATIVE_INFINITY;
        var nMaxValue = Number.POSITIVE_INFINITY;

        if (!toleranceLow && toleranceLow !== 0 && (deviationLow || deviationLow === 0)) {
            toleranceLow = deviationLow;
        }
        if (!toleranceHigh && toleranceHigh !== 0 && (deviationHigh || deviationHigh === 0)) {
            toleranceHigh = deviationHigh;
        }
        if (!deviationLow && deviationLow !== 0) {
            deviationLow = nMinValue;
        }
        if (!deviationHigh && deviationHigh !== 0) {
            deviationHigh = nMaxValue;
        }

        // number could be a zero number so check if it is not undefined
        if (value !== undefined) {
            value = Number(value);

            if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
                if ((toleranceHigh || toleranceHigh === 0) && (deviationHigh || deviationHigh === 0)) {
                    if (value <= parseFloat(toleranceHigh)) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value > parseFloat(deviationHigh)) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }
            } else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {
                if ((toleranceLow || toleranceLow === 0) && (deviationLow || deviationLow === 0)) {
                    if (value >= parseFloat(toleranceLow)) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value < parseFloat(deviationLow)) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }
            } else if (endsWith(sImproveDirection, "Target")) {
                if (
                    (toleranceHigh || toleranceHigh === 0) &&
                    (deviationHigh || deviationHigh === 0) &&
                    (toleranceLow || toleranceLow === 0) &&
                    (deviationLow || deviationLow === 0)
                ) {
                    if (value >= parseFloat(toleranceLow) && value <= parseFloat(toleranceHigh)) {
                        oCriticality.EnumMember = "Positive";
                    } else if (value < parseFloat(deviationLow) || value > parseFloat(deviationHigh)) {
                        oCriticality.EnumMember = "Negative";
                    } else {
                        oCriticality.EnumMember = "Critical";
                    }
                }
            }
        }
        return criticality2state(oCriticality, oCriticalityConfigValues, false);
    }

    /* Trend Direction for Header */
    function calculateTrendDirection(aggregateValue, referenceValue, downDifference, upDifference, bODataV4) {
        if (bODataV4 && typeof aggregateValue == "string") {
            aggregateValue = NumberFormat.getIntegerInstance().parse(aggregateValue);
        }

        if (!aggregateValue || !referenceValue) {
            return;
        }

        aggregateValue = Number(aggregateValue);
        if (!upDifference && aggregateValue - referenceValue >= 0) {
            return "Up";
        }
        if (!downDifference && aggregateValue - referenceValue <= 0) {
            return "Down";
        }
        if (referenceValue && upDifference && aggregateValue - referenceValue >= upDifference) {
            return "Up";
        }
        if (referenceValue && downDifference && aggregateValue - referenceValue <= downDifference) {
            return "Down";
        }
    }

    /**
     * This function returns the dataField annotations in sorted order
     **/
    function getSortedDataFields(iContext, aCollection) {
        // we are sending index 0 to iContext.getPath(0) function
        // for composite binding - index 0 will be considered
        // for path - index 0 will be ignored
        var sCacheKey = iContext.getPath(0) + "-DataFields-Sorted";
        var aSortedFields = getCacheEntry(iContext, sCacheKey);
        var bODataV4 = isODataV4Context(iContext);
        if (!aSortedFields) {
            var aDataPoints = getSortedDataPoints(iContext, aCollection);
            var aDataPointsValues = aDataPoints.map(function (oDataPoint) {
                return bODataV4 ? oDataPoint.Value.$Path : oDataPoint.Value.Path;
            });
            aDataPointsValues = aDataPointsValues.filter(function (element) {
                return !!element;
            });

            var sPath, sRecordType, oItemValue;
            aSortedFields = aCollection.filter(function (item) {
                oItemValue = item && item.Value || {};
                sPath = (bODataV4 ? oItemValue.$Path : oItemValue.Path) || "";
                sRecordType = (bODataV4 ? item.$Type : item.RecordType) || "";

                return sRecordType === "com.sap.vocabularies.UI.v1.DataField" &&
                    aDataPointsValues.indexOf(sPath) === -1;
            });
            aSortedFields = sortCollectionByImportance(aSortedFields, iContext);
            setCacheEntry(iContext, sCacheKey, aSortedFields);
        }
        return aSortedFields;
    }
    getSortedDataFields.requiresIContext = true;

    function getSortedDataPoints(iContext, aCollection, sortForTableCard) {
        var sCacheKey = iContext.getPath(0) + "-DataPoints-Sorted";
        var aSortedFields = getCacheEntry(iContext, sCacheKey);
        var bODataV4 = isODataV4Context(iContext);

        if (!aSortedFields) {
            if (sortForTableCard) {
                aSortedFields = aCollection.filter(function (oItem) {
                    return isDataFieldForAnnotationWithDataPointOrContact(oItem, bODataV4);
                });
            } else {
                aSortedFields = aCollection.filter(function (oItem) {
                    return isDataFieldForAnnotation(oItem, bODataV4);
                });
            }
            aSortedFields = sortCollectionByImportance(aSortedFields, iContext);
            var sEntityTypePath;
            for (var i = 0; i < aSortedFields.length; i++) {
                sEntityTypePath = iContext.getPath(0).substr(0, iContext.getPath(0).lastIndexOf("/") + 1);
                aSortedFields[i] = iContext
                    .getModel(0)
                    .getProperty(getTargetPathForDataFieldForAnnotation(sEntityTypePath, aSortedFields[i], iContext));
                sEntityTypePath = "";
            }
            setCacheEntry(iContext, sCacheKey, aSortedFields);
        }
        return aSortedFields;
    }
    getSortedDataPoints.requiresIContext = true;

    function isDataFieldForAnnotation(oItem, bODataV4) {
        var sRecordType = bODataV4 ? oItem && oItem.$Type : oItem && oItem.RecordType;
        var oItemTarget = oItem && oItem.Target || {};
        var sAnnotationPath = (bODataV4 ? oItemTarget.$AnnotationPath : oItemTarget.AnnotationPath) || "";

        return sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
            sAnnotationPath.match(/@com.sap.vocabularies.UI.v1.DataPoint.*/);
    }

    /**
     in case of table card check both data point and contact annotation property with data field property if they are same then remove the data field
     so only quick view with contact information shown and smartlink with  semantic object will be removed
     **/
    function isDataFieldForAnnotationWithDataPointOrContact(oItem, bODataV4) {
        var sRecordType = bODataV4 ? oItem && oItem.$Type : oItem && oItem.RecordType || "";
        var oItemTarget = oItem && oItem.Target || {};
        var sAnnotationPath = (bODataV4 ? oItemTarget.$AnnotationPath : oItemTarget.AnnotationPath) || "";

        return (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
            sAnnotationPath.match(/@com.sap.vocabularies.UI.v1.DataPoint.*/)) ||
            (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
                sAnnotationPath.match(/@com.sap.vocabularies.Communication.v1.Contact.*/));
    }

    /**
     * This function returns formatted field for criticality path
     * @param oDataFieldForAnnotation
     * @returns {string}
     */
    function getCriticalityForDataPoint(oDataFieldForAnnotation) {
        if (
            !oDataFieldForAnnotation ||
            !oDataFieldForAnnotation.Criticality ||
            !oDataFieldForAnnotation.Criticality.Path
        ) {
            return;
        }
        return "{path:'" + oDataFieldForAnnotation.Criticality.Path + "'}";
    }

    function getTargetPathForDataFieldForAnnotation(sEntityTypePath, oDataFieldForAnnotation, iContext) {
        var bODataV4 = isODataV4Context(iContext);

        if (bODataV4) {
            return sEntityTypePath + oDataFieldForAnnotation.Target.$AnnotationPath;
        }

        if (sEntityTypePath && !endsWith(sEntityTypePath, "/")) {
            sEntityTypePath += "/";
        }
        return sEntityTypePath + oDataFieldForAnnotation.Target.AnnotationPath.slice(1);
    }

    function getImportance(oDataField, iContext) {
        var sImportance, iImportance;
        var bODataV4 = isODataV4Context(iContext);
        var oDataFieldImportance = bODataV4 ?
            oDataField["@com.sap.vocabularies.UI.v1.Importance"] :
            oDataField["com.sap.vocabularies.UI.v1.Importance"];

        if (oDataFieldImportance) {
            sImportance = bODataV4 ? oDataFieldImportance.$EnumMember : oDataFieldImportance.EnumMember;
            switch (sImportance) {
                case "com.sap.vocabularies.UI.v1.ImportanceType/High":
                    iImportance = 1;
                    break;
                case "com.sap.vocabularies.UI.v1.ImportanceType/Medium":
                    iImportance = 2;
                    break;
                case "com.sap.vocabularies.UI.v1.ImportanceType/Low":
                    iImportance = 3;
                    break;
            }
        } else {
            iImportance = 4;
        }
        return iImportance;
    }

    /**
     * Sorting the collection by importance. Using merge sort as the Javascript sort implementation behaves unexpectedly
     * for same elements - it is a known issue
     * @param aCollection
     * @returns [] - SortedArray
     */
    function sortCollectionByImportance(aCollection, iContext) {
        if (aCollection.length < 2) {
            return aCollection;
        }

        var middle = parseInt(aCollection.length / 2, 10);
        var left = aCollection.slice(0, middle);
        var right = aCollection.slice(middle, aCollection.length);

        return mergeCollection(sortCollectionByImportance(left, iContext), sortCollectionByImportance(right, iContext), iContext);
    }

    function mergeCollection(left, right, iContext) {
        var aSortedArray = [];
        while (left.length && right.length) {
            var aImportance = getImportance(left[0], iContext),
                bImportance = getImportance(right[0], iContext);
            if (aImportance <= bImportance) {
                aSortedArray.push(left.shift());
            } else {
                aSortedArray.push(right.shift());
            }
        }
        while (left.length) {
            aSortedArray.push(left.shift());
        }
        while (right.length) {
            aSortedArray.push(right.shift());
        }

        return aSortedArray;
    }

    function formatDataField(iContext, aCollection, index) {
        var item = getSortedDataFields(iContext, aCollection)[index];
        if (item) {
            return formatField(iContext, item);
        }
        return "";
    }

    /*This function first picks a datafield from line item based on index and then
     * finds the label for that datafield*/
    function getDataFieldName(iContext, aCollection, index) {
        var oDataField = getSortedDataFields(iContext, aCollection)[index];
        return getLabelForDataItem(iContext, oDataField);
    }

    /*This function returns label for the datapoint mentioned by index*/
    function getLabelForDataPoint(iContext, aCollection, index) {
        var aSortedFields = aCollection.filter(isDataFieldForAnnotation);
        aSortedFields = sortCollectionByImportance(aSortedFields, iContext);
        if (!aSortedFields || !aSortedFields.length || !aSortedFields.length > 0) {
            return "";
        }
        return getLabelForDataItem(iContext, aSortedFields[0]);
    }

    function formatDataPoint(iContext, aCollection, index, dontIncludeUOM) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        if (!item) {
            return "";
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatDataPoint(iContext, item, oEntityType, oMetaModel, dontIncludeUOM);
    }

    function criticalityConditionCheck(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        return item && item.Criticality ? true : false;
    }

    function getCriticality(iContext, aCollection, index) {
        var item = getSortedDataPoints(iContext, aCollection)[index];
        var criticalityStatus = item.Criticality.Path;
        return "{path:'" + criticalityStatus + "'}";
    }

    function _formatDataPoint(iContext, oItem, oEntityType, oMetaModel, dontIncludeUOM) {
        if (!oItem || !oItem.Value) {
            return "";
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var bIgnoreSapText = false;
        if (oModel) {
            var bExtractedIgnoreSapText = oModel.getProperty("/ignoreSapText");
            bIgnoreSapText = bExtractedIgnoreSapText == undefined ? bIgnoreSapText : bExtractedIgnoreSapText;
        }
        var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, oItem.Value.Path);

        //Support sap:aggregation-role=measure configuration
        var bMeasuresType = false;
        if (bIgnoreSapText == true) {
            //as part of supporting V4 annotation
            if (
                oEntityTypeProperty &&
                (oEntityTypeProperty["com.sap.vocabularies.Analytics.v1.Measure"] ||
                    oEntityTypeProperty["sap:aggregation-role"] == "measure")
            ) {
                bMeasuresType = true;
            }
        }

        //Support sap:text attribute
        if (!bMeasuresType && oEntityTypeProperty) {
            var txtValue;
            if (oEntityTypeProperty[ANNOTATIONTYPE.TEXT]) {
                //as part of supporting V4 annotation
                txtValue = oEntityTypeProperty[ANNOTATIONTYPE.TEXT].String
                    ? oEntityTypeProperty[ANNOTATIONTYPE.TEXT].String
                    : oEntityTypeProperty[ANNOTATIONTYPE.TEXT].Path;
            } else if (oEntityTypeProperty["sap:text"]) {
                txtValue = oEntityTypeProperty["sap:text"];
            }
            if (txtValue) {
                oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, txtValue);
                oItem = {
                    Value: {
                        Path: oEntityTypeProperty.name
                    }
                };
            }
        }
        return formatField(iContext, oItem, dontIncludeUOM);
    }

    function formatField(iContext, item, bDontIncludeUOM, bIncludeOnlyUOM) {
        if (item.Value.Apply) {
            return OdataAnnotationHelper.format(iContext, item.Value);
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatField(iContext, item, oEntityType, oMetaModel, bDontIncludeUOM, bIncludeOnlyUOM);
    }
    formatField.requiresIContext = true;

    /**
     * This function checks if the given property (oProperty)
     * has a text annotation associated with it, if yes it returns the appropriate binding
     * based on the textArrangement annotation, the default is TEXT_LAST
     * @param oEntityType  OPTIONAL
     * @param oProperty    MANDATORY
     * @param sIdBinding   MANDATORY
     * @returns String
     */
    function getTextArrangementBinding(iContext, oEntityType, oProperty, sIdBinding) {
        if (!oProperty || typeof sIdBinding !== "string") {
            return sIdBinding;
        }
        //Get Text Arrangement annotation
        var oText = oProperty[ANNOTATIONTYPE.TEXT] || oProperty['sap:text'];
        //No Text found to be used in Text Arrangement
        if (!oText) {
            return sIdBinding;
        }
        var oTextArrangement, sTextArrangementType;
        //Text Arrangement annotation can be at property level, text level or entity level
        // 1. check TextArrangement definition for property - Priority 1 (max)
        oTextArrangement = oProperty[ANNOTATIONTYPE.TEXT_ARRANGEMENT];
        sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;

        // 2. check TextArrangement definition under property/text - Priority 2
        if (!sTextArrangementType) {
            oTextArrangement = oText && oText[ANNOTATIONTYPE.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
        }
        // 3. check TextArrangement definition for entity type - Priority 3 (min)
        if (!sTextArrangementType) {
            oTextArrangement = oEntityType && oEntityType[ANNOTATIONTYPE.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.EnumMember;
        }

        var sDescriptionBinding;
        if (typeof oText === "object") {
            sDescriptionBinding = OdataAnnotationHelper.format(iContext, oText);
        } else {
            sDescriptionBinding = OdataAnnotationHelper.format(iContext, { Path: oText });
        }
        //No Text Binding found
        if (!sDescriptionBinding || sDescriptionBinding === " ") {
            return sIdBinding;
        }
        //No Text Arrangement found then append it to property
        if (!sTextArrangementType) {
            return sIdBinding + " (" + sDescriptionBinding + ")";
        }
        var sFinalBinding;
        switch (sTextArrangementType) {
            case TextArrangementType.TEXT_FIRST:
                sFinalBinding = sDescriptionBinding + " (" + sIdBinding + ")";
                break;
            case TextArrangementType.TEXT_LAST:
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            case TextArrangementType.TEXT_ONLY:
                sFinalBinding = sDescriptionBinding;
                break;
            case TextArrangementType.TEXT_SEPARATE:
                //Text Separate not supported, fallback to text last.
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            default:
                sFinalBinding = sIdBinding;
                break;
        }
        return sFinalBinding;
    }

    function _formatField(
        iContext,
        oItem,
        oEntityType,
        oMetaModel,
        bDontIncludeUOM,
        bIncludeOnlyUOM,
        bUseSimplePath
    ) {
        if (oItem.Value.Apply) {
            return OdataAnnotationHelper.format(iContext, oItem.Value);
        }

        var sProperty = oItem.Value.Path ? oItem.Value.Path : oItem.Value.String;
        var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, sProperty),
            result = "",
            functionName,
            oStaticValues;
        var oCardProperties = iContext.getSetting("ovpCardProperties");
        var sContentFragment = oCardProperties && oCardProperties.getProperty("/contentFragment");

        if (!bIncludeOnlyUOM) {
            //Support association
            if (oItem.Value.Path && oItem.Value.Path.split("/").length > 1) {
                oEntityTypeProperty = getNavigationSuffix(oMetaModel, oEntityType, oItem.Value.Path, iContext);
            }
            if (!oEntityTypeProperty) {
                return "";
            }
            //Item has ValueFormat annotation
            if (
                oEntityTypeProperty["type"] === "Edm.DateTime" ||
                oEntityTypeProperty["type"] === "Edm.DateTimeOffset"
            ) {
                // By default or if showDateInRelativeFormat is true relative Date Format is selected
                var dateFormat = {
                    relative: true,
                    relativeScale: "auto"
                },
                    showDateInRelativeFormat =
                        oCardProperties && oCardProperties.getProperty("/showDateInRelativeFormat"); // Getting Parameter value from card properties
                // Otherwise if showDateInRelativeFormat is false then medium Date format is used
                if (showDateInRelativeFormat !== undefined && !showDateInRelativeFormat) {
                    dateFormat = {
                        style: "medium"
                    };
                }
                functionName = "sap.ovp.cards.AnnotationHelper.formatDate";
                oStaticValues = {
                    dateFormat: dateFormat,
                    bUTC: oEntityTypeProperty["type"] === "Edm.DateTime" ? true : false,
                    functionName: functionName
                };

                result = generatePathForField(
                    [oItem.Value.Path ? oItem.Value.Path : oEntityTypeProperty.name],
                    functionName,
                    oStaticValues
                );
            } else if (
                (oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits) ||
                oEntityTypeProperty["scale"]
            ) {
                //By default no decimals would be shown
                //If user specifies in Annotations then he can set 1 or 2 decimal places.
                // If he provides a value beyond 2 then also it would be considered as 2.

                var iScale =
                    oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits
                        ? oItem.ValueFormat.NumberOfFractionalDigits.Int
                        : 0,
                    sUnitPath;
                var iScaleFactor =
                    oItem.ValueFormat && oItem.ValueFormat.ScaleFactor && oItem.ValueFormat.ScaleFactor.Decimal;
                if (oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY]) {
                    //as part of supporting V4 annotation
                    sUnitPath = oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY].Path
                        ? oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY].Path
                        : oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY].String;
                } else if (oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
                    sUnitPath = oEntityTypeProperty[ANNOTATIONTYPE.UOM].Path
                        ? oEntityTypeProperty[ANNOTATIONTYPE.UOM].Path
                        : oEntityTypeProperty[ANNOTATIONTYPE.UOM].String;
                } else if (oEntityTypeProperty["sap:unit"]) {
                    sUnitPath = oEntityTypeProperty["sap:unit"];
                }
                var oUnitProperty = sUnitPath ? oMetaModel.getODataProperty(oEntityType, sUnitPath) : null,
                    aParts = [oItem.Value.Path ? oItem.Value.Path : oEntityTypeProperty.name];
                //Default value for currency and number scale if scale is more than 2
                if (iScale > 2) {
                    iScale = 2;
                }

                oStaticValues = {
                    numberOfFractionalDigits: iScale,
                    scaleFactor: iScaleFactor
                };

                // check if currency is applicable and format the number based on currency or number
                if (oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY]) {
                    var oCurrency = oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY];
                    if (oCurrency.Path) {
                        functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                        aParts.push(oCurrency.Path);
                    } else if (oCurrency.String) {
                        oStaticValues.currencyString = oCurrency.String;
                        functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                    } //as part of supporting V4 annotation
                } else if (
                    oUnitProperty &&
                    (oUnitProperty[ANNOTATIONTYPE.ISO_CURRENCY] ||
                        oUnitProperty["sap:semantics"] === "currency-code")
                ) {
                    functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                    aParts.push(sUnitPath);
                } else {
                    //If there is no value format annotation, we will use the metadata scale property
                    functionName = "sap.ovp.cards.AnnotationHelper.formatNumberCalculation";
                }
                oStaticValues.functionName = functionName;
                result = generatePathForField(aParts, functionName, oStaticValues);
            } else {
                if (bUseSimplePath) {
                    result = OdataAnnotationHelper.simplePath(iContext, oItem.Value);
                } else {
                    var sFormattedResult = OdataAnnotationHelper.format(
                        iContext.getModel() ? iContext : iContext.getInterface(0),
                        oItem.Value
                    );
                    var aResult = sFormattedResult.split(",");
                    var aForamttedFields = [];
                    if (aResult.length > 1) {
                        for (var i = 0; i < aResult.length; i++) {
                            if (aResult[i].indexOf("path:") >= 0 || aResult[i].indexOf("type:") >= 0) {
                                aForamttedFields.push(aResult[i]);
                            }
                        }
                        if (aForamttedFields.length > 0) {
                            result = result + aForamttedFields.join(",");
                            if (result.substring(result.length - 1) !== "}") {
                                result = result + "}";
                            }
                        }
                    } else {
                        result = sFormattedResult;
                    }
                }
            }

            //Get text arrangement (if present) binding for the property
            if (sContentFragment) {
                result = getTextArrangementBinding(iContext, oEntityType, oEntityTypeProperty, result);
            }

            //Add unit using path or string
            if (oEntityTypeProperty && oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
                var oUnit = oEntityTypeProperty[ANNOTATIONTYPE.UOM];
                if (oUnit.Path) {
                    result += " " + generatePathForField([oUnit.Path]);
                    //support sap:text property for UOM
                    result += " " + getSapTextPathForUOM(oUnit.Path, oMetaModel, oEntityType, iContext);
                } else if (oUnit.String) {
                    //If the unit string is percentage, then no space required
                    //Note that if % comes from path, then space will be there
                    if (oUnit.String !== "%") {
                        result += " ";
                    }
                    result += oUnit.String;
                }
            }
        }

        if (!bDontIncludeUOM) {
            //Add currency using path or string
            if (oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY]) {
                var oCurrency = oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY];
                if (oCurrency) {
                    if (oCurrency.Path) {
                        result += " " + generatePathForField([oCurrency.Path]);
                        //support sap:text property for ISOCurrency
                        result += " " + getSapTextPathForUOM(oCurrency.Path, oMetaModel, oEntityType, iContext);
                    } else if (oCurrency.String) {
                        result += " " + oCurrency.String;
                    }
                }
            }
        }

        if (result[0] === " ") {
            result = result.substring(1);
        }
        return result;
    }

    /**
     *  function to return text annotation path for a unit of measurment
     *
     *  @method {public} getSapTextPathForUOM
     *  @param {string} sUnitPath - unit of measurement path for an entity property
     *  @param {object} oMetaModel - meta model
     *  @param {object} oEntityType - entity type
     *  @param {object} iContext
     *  @return {string} returns text annotation binding path
     *
     */
    function getSapTextPathForUOM(sUnitPath, oMetaModel, oEntityType, iContext) {
        if (sUnitPath) {
            var oUnitEntityTypeProperty, sAssociatedEntityPath, sTextPath;
            var bODataV4 = isODataV4Context(iContext);
            if (sUnitPath.split("/").length > 1) {
                oUnitEntityTypeProperty = getNavigationSuffix(oMetaModel, oEntityType, sUnitPath, iContext);
                sAssociatedEntityPath = getNavigationPrefix(oMetaModel, oEntityType, sUnitPath, iContext);
            } else {
                oUnitEntityTypeProperty = bODataV4 ?
                    getEntityTypeForODataV4Model(oMetaModel, oEntityType, sUnitPath) :
                    oMetaModel.getODataProperty(oEntityType, sUnitPath);
            }
            if (oUnitEntityTypeProperty) {
                sTextPath = bODataV4 ?
                    oUnitEntityTypeProperty["@" + ANNOTATIONTYPE.TEXT] && oUnitEntityTypeProperty["@" + ANNOTATIONTYPE.TEXT].$Path :
                    (oUnitEntityTypeProperty[ANNOTATIONTYPE.TEXT] && oUnitEntityTypeProperty[ANNOTATIONTYPE.TEXT].Path) || oUnitEntityTypeProperty['sap:text'];
            }
            if (sTextPath && sAssociatedEntityPath) {
                sTextPath = sAssociatedEntityPath + "/" + sTextPath;
            }
            if (sTextPath) {
                return " ({" + sTextPath + "})";
            }
            return '';
        }
    }

    /**
     * Note:if passing parts, then formatter is mandatory
     * @param aParts
     * @param sFormatterName
     * @param oStaticValues
     * @param bTypeString
     * @returns {string}
     */
    function generatePathForField(aParts, sFormatterName, oStaticValues, bTypeString) {
        var sPath = "",
            iLength = aParts.length;
        if (iLength > 1 || oStaticValues) {
            sPath = "{parts:[";
            for (var i = 0; i < iLength; i++) {
                if (bTypeString) {
                    sPath +=
                        "{path: '" +
                        aParts[i] +
                        "',type:'sap.ui.model.odata.type.String'}" +
                        (i === iLength - 1 && !oStaticValues ? "]" : ", ");
                } else {
                    sPath += "{path: '" + aParts[i] + "'}" + (i === iLength - 1 && !oStaticValues ? "]" : ", ");
                }
            }
            if (oStaticValues) {
                var sStaticValue = "{value:" + JSON.stringify(oStaticValues) + ", model: 'ovpCardProperties'}";
                sPath += sStaticValue + "]";
            }
        } else {
            sPath = "{path: '" + aParts[0] + "'";
        }
        sPath += (sFormatterName ? ", formatter: '" + sFormatterName + "'" : "") + "}";
        return sPath;
    }

    function formatNumberCalculation() {
        var oStaticValue = arguments[arguments.length - 1],
            value = arguments[0];
        var formatNumber = NumberFormat.getFloatInstance({
            style: "short",
            showMeasure: false,
            shortRefNumber: oStaticValue.scaleFactor,
            minFractionDigits: oStaticValue.numberOfFractionalDigits,
            maxFractionDigits: oStaticValue.numberOfFractionalDigits
        });
        if (typeof value == "string" && oStaticValue.bODataV4) {
            value = NumberFormat.getIntegerInstance().parse(value);
        }
        return formatNumber.format(Number(value));
    }

    /**
     * Returns the date formatter function name
     * @param functionName
     * @param functionName
     * @param showDateInRelativeFormat
     * @returns {string}
     */
    function formatDate() {
        var oStaticValues = arguments[arguments.length - 1],
            value = arguments[0];
        var oDateFormatter = DateFormat.getInstance(oStaticValues.dateFormat);
        if (!value) {
            value = "";
            return value;
        }
        // bUTC should be true to show time stamp in UTC
        return oDateFormatter.format(new Date(value), oStaticValues.bUTC);
    }
    /**
     * Generates the currency formatter function based on the currency and scale
     * @param iNumOfFragmentDigit
     * @param sCurrency
     * @returns {Function}
     */
    function formatCurrency() {
        var oStaticValues = arguments[arguments.length - 1],
            value = Number(arguments[0]),
            currency = arguments[1];
        var sFormattedValue = "";
        var oCurrencyFormatter = NumberFormat.getCurrencyInstance({
            style: "short",
            showMeasure: false,
            shortRefNumber: oStaticValues.scaleFactor,
            minFractionDigits: oStaticValues.numberOfFractionalDigits,
            maxFractionDigits: oStaticValues.numberOfFractionalDigits
        });
        if (typeof value == "string" && oStaticValues.bODataV4) {
            value = NumberFormat.getIntegerInstance().parse(value);
        }
        if (currency) {
            sFormattedValue = oCurrencyFormatter.format(value, currency);
        } else {
            sFormattedValue = oStaticValues.currencyString
                ? oCurrencyFormatter.format(value, oStaticValues.currencyString)
                : oCurrencyFormatter.format(value);
        }
        return sFormattedValue;
    }

    function getNavigationSuffix(oMetaModel, oEntityType, sProperty, iContext) {
        var aParts = sProperty.split("/");
        var bODataV4 = isODataV4Context(iContext);

        if (aParts.length > 1) {
            if (bODataV4) {
                for (var i = 0; i < aParts.length - 1; i++) {
                    oEntityType = oMetaModel.getProperty("/" + oEntityType.$Type)[aParts[i]];
                }
                return getEntityTypeForODataV4Model(oMetaModel, oEntityType, aParts[aParts.length - 1]);
            } else {
                for (var i = 0; i < aParts.length - 1; i++) {
                    var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                    if (oAssociationEnd) {
                        oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                    }
                }
                return oMetaModel.getODataProperty(oEntityType, aParts[aParts.length - 1]);
            }
        }
    }

    function formatDataPointState(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        var oCriticalityConfigValues = CardConstants.Criticality.StateValues;
        var oItem = aDataPoints[index];

        // return "None" if the item is not available in the sorted data points list
        if (!oItem) {
            return oCriticalityConfigValues.None;
        }

        // Format data points to criticality expression if criticality is available in the item, else format to value
        if (oItem.Criticality) {
            return buildExpressionForProgressIndicatorCriticality(iContext, oItem, oCriticalityConfigValues);
        }
        return formatDataPointToValue(iContext, oItem, oCriticalityConfigValues);
    }

    function hasCriticalityAnnotation(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        // aDataPoints is not Undefined and aDataPoints.length is not 0
        if (aDataPoints && aDataPoints.length) {
            var item = aDataPoints[0];
            if (item && (item.Criticality || item.CriticalityCalculation)) {
                return true;
            }
        }
        return false;
    }

    function colorPaletteForComparisonMicroChart(iContext, aCollection, index) {
        if (hasCriticalityAnnotation(iContext, aCollection, index)) {
            return "";
        }
        return "sapUiChartPaletteQualitativeHue1";
    }
    colorPaletteForComparisonMicroChart.requiresIContext = true;

    function formatDataPointColor(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection),
            oCriticalityConfigValues = CardConstants.Criticality.ColorValues;
        var sState = oCriticalityConfigValues.None;
        if (aDataPoints.length > index) {
            var item = aDataPoints[index];
            if (item && item.Criticality) {
                sState = buildExpressionForProgressIndicatorCriticality(iContext, item, oCriticalityConfigValues);
            } else {
                sState = formatDataPointToValue(iContext, item, oCriticalityConfigValues);
            }
        }
        return sState;
    }

    function buildExpressionForProgressIndicatorCriticality(iContext, dataPoint, oCriticalityConfigValues) {
        var sFormatCriticalityExpression = oCriticalityConfigValues.None;
        var sExpressionTemplate;
        var oCriticalityProperty = dataPoint.Criticality;
        var bODataV4 = isODataV4Context(iContext);

        if (oCriticalityProperty) {
            sExpressionTemplate =
                "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''" +
                oCriticalityConfigValues.Negative +
                "'' : " +
                "({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Critical'') || ({0} === ''2'') || ({0} === 2) ? ''" +
                oCriticalityConfigValues.Critical +
                "'' : " +
                "({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''" +
                oCriticalityConfigValues.Positive +
                "'' : " +
                "''" +
                oCriticalityConfigValues.None +
                "'' '}'";
            if (oCriticalityProperty.Path && !bODataV4) {
                var sCriticalitySimplePath =
                    "$" + OdataAnnotationHelper.simplePath(iContext, oCriticalityProperty);
                sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticalitySimplePath);
            } else if (bODataV4 && oCriticalityProperty.$Path) {
                var sCriticalitySimplePath =
                    "$" + oDataV4AnnotationHelper.format(oCriticalityProperty, { context: iContext });
                sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticalitySimplePath);
            } else if (oCriticalityProperty.EnumMember || oCriticalityProperty.$EnumMember) {
                var sEnumMember = bODataV4 ? oCriticalityProperty.$EnumMember : oCriticalityProperty.EnumMember;
                var sCriticality = "'" + sEnumMember + "'";
                sFormatCriticalityExpression = formatMessage(sExpressionTemplate, sCriticality);
            } else {
                oLogger.warning("Case not supported, returning the default Neutral state");
            }
        } else {
            // Any other cases are not valid, the default value of 'None' will be returned
            oLogger.warning("Case not supported, returning the default Neutral state");
        }
        return sFormatCriticalityExpression;
    }

    function formatDataPointStateForSmartField(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        var sState = "None";
        if (aDataPoints.length > index) {
            var item = aDataPoints[index];
            if (item && item.Criticality && item.Criticality.Path) {
                sState = getCriticality(iContext, aCollection, index);
            } else {
                sState = formatDataPointToValue(iContext, item, CardConstants.Criticality.StateValues);
                sState = criticalityState2Value(sState);
            }
        }
        return sState;
    }

    function formatDataPointToValue(iContext, oDataPoint, oCriticalityConfigValues, bKPIHeader) {
        var bODataV4 = isODataV4Context(iContext);
        var sState = oCriticalityConfigValues.None;
        var oDataPointValue = oDataPoint && oDataPoint.Value || {};
        var sPath = bODataV4 ? oDataPointValue.$Path : oDataPointValue.Path;
        if (oDataPoint.Criticality) {
            sState = criticality2state(oDataPoint.Criticality, oCriticalityConfigValues, bODataV4);
        } else if (oDataPoint.CriticalityCalculation && sPath) {
            sState = formThePathForCriticalityStateCalculation(iContext, oDataPoint, oCriticalityConfigValues, bKPIHeader);
        }

        return sState;
    }

    function formThePathForCriticalityStateCalculation(
        iContext,
        oDataPoint,
        oCriticalityConfigValues,
        bKPIHeader
    ) {
        var bODataV4 = isODataV4Context(iContext);
        var value = getPathOrPrimitiveValue(oDataPoint.Value, bODataV4, bKPIHeader);
        var sImprovementDirection = bODataV4 ?
            oDataPoint.CriticalityCalculation.ImprovementDirection.$EnumMember :
            oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;

        var deviationLow = getPathOrPrimitiveValue(
            oDataPoint.CriticalityCalculation.DeviationRangeLowValue,
            bODataV4,
            bKPIHeader
        );
        var deviationHigh = getPathOrPrimitiveValue(
            oDataPoint.CriticalityCalculation.DeviationRangeHighValue,
            bODataV4,
            bKPIHeader
        );
        var toleranceLow = getPathOrPrimitiveValue(
            oDataPoint.CriticalityCalculation.ToleranceRangeLowValue,
            bODataV4,
            bKPIHeader
        );
        var toleranceHigh = getPathOrPrimitiveValue(
            oDataPoint.CriticalityCalculation.ToleranceRangeHighValue,
            bODataV4,
            bKPIHeader
        );

        var bIsDeviationLowBinding = isBindingValue(deviationLow);
        var bIsDeviationHighBinding = isBindingValue(deviationHigh);
        var bIsToleranceLowBinding = isBindingValue(toleranceLow);
        var bIsToleranceHighBinding = isBindingValue(toleranceHigh);
        var sFunctionName = "sap.ovp.cards.AnnotationHelper.formatColor";
        var oStaticValue = {
            deviationLow: deviationLow,
            deviationHigh: deviationHigh,
            toleranceLow: toleranceLow,
            toleranceHigh: toleranceHigh,
            bIsDeviationLowBinding: bIsDeviationLowBinding,
            bIsDeviationHighBinding: bIsDeviationHighBinding,
            bIsToleranceLowBinding: bIsToleranceLowBinding,
            bIsToleranceHighBinding: bIsToleranceHighBinding,
            sImprovementDirection: sImprovementDirection,
            oCriticalityConfigValues: oCriticalityConfigValues,
            functionName: sFunctionName,
            bODataV4: bODataV4
        };
        var sStaticValue = "{value:" + JSON.stringify(oStaticValue) + ", model: 'ovpCardProperties'}";
        var sParts = "parts: [" + value;
        sParts += bIsDeviationLowBinding ? "," + deviationLow : "";
        sParts += bIsDeviationHighBinding ? "," + deviationHigh : "";
        sParts += bIsToleranceLowBinding ? "," + toleranceLow : "";
        sParts += bIsToleranceHighBinding ? "," + toleranceHigh : "";
        sParts += "," + sStaticValue;
        sParts += "]";
        return "{" + sParts + ", formatter: '" + sFunctionName + "'}";
    }

    function formatColor() {
        var oStaticValues = arguments[arguments.length - 1];
        var index = 1;

        if (oStaticValues && oStaticValues.bODataV4) {
            return calculateCriticalityState(
                arguments[0],
                oStaticValues.sImprovementDirection,
                oStaticValues.bIsDeviationLowBinding
                    ? parseFloat(arguments[index++].split(",").join(""))
                    : oStaticValues.deviationLow,
                oStaticValues.bIsDeviationHighBinding
                    ? parseFloat(arguments[index++].split(",").join(""))
                    : oStaticValues.deviationHigh,
                oStaticValues.bIsToleranceLowBinding
                    ? parseFloat(arguments[index++].split(",").join(""))
                    : oStaticValues.toleranceLow,
                oStaticValues.bIsToleranceHighBinding
                    ? parseFloat(arguments[index++].split(",").join(""))
                    : oStaticValues.toleranceHigh,
                oStaticValues.oCriticalityConfigValues,
                oStaticValues.bODataV4
            );
        }

        return calculateCriticalityState(
            arguments[0],
            oStaticValues.sImprovementDirection,
            oStaticValues.bIsDeviationLowBinding ? arguments[index++] : oStaticValues.deviationLow,
            oStaticValues.bIsDeviationHighBinding ? arguments[index++] : oStaticValues.deviationHigh,
            oStaticValues.bIsToleranceLowBinding ? arguments[index++] : oStaticValues.toleranceLow,
            oStaticValues.bIsToleranceHighBinding ? arguments[index++] : oStaticValues.toleranceHigh,
            oStaticValues.oCriticalityConfigValues,
            oStaticValues.bODataV4
        );
    }

    function isBindingValue(value) {
        return typeof value === "string" && value.charAt(0) === "{";
    }

    function getNavigationPrefix(oMetaModel, oEntityType, sProperty, iContext) {
        var sExpand = "";
        var aParts = sProperty.split("/");
        var bODataV4 = isODataV4Context(iContext);

        if (aParts.length > 1) {

            if (bODataV4) {
                aParts.pop();
                sExpand = aParts.join("/");
            } else {
                for (var i = 0; i < aParts.length - 1; i++) {
                    var oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[i]);
                    if (oAssociationEnd) {
                        oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
                        if (sExpand) {
                            sExpand = sExpand + "/";
                        }
                        sExpand = sExpand + aParts[i];
                    } else {
                        return sExpand;
                    }
                }
            }
        }
        return sExpand;
    }

    function checkFilterPreference(oModel) {
        var mFilterPreference;
        if (oModel && typeof oModel.getData === "function") {
            var oSettings = oModel.getData();
            if (oSettings.tabs) {
                var iIndex = 0;
                var iSelectedKey = oSettings.selectedKey;
                if (iSelectedKey && oSettings.tabs.length >= iSelectedKey) {
                    iIndex = iSelectedKey - 1;
                }
                mFilterPreference = oSettings.tabs[iIndex].mFilterPreference;
            } else {
                mFilterPreference = oSettings.mFilterPreference;
            }
        }
        return !!mFilterPreference;
    }

    /*
     * This formatter method parses the List-Card List's items aggregation path in the Model.
     * The returned path may contain also sorter definition (for the List) sorting is defined
     * appropriately via respected Annotations.
     *
     * @param iContext
     * @param itemsPath
     * @returns List-Card List's items aggregation path in the Model
     */
    function formatItems(iContext, oEntitySet) {
        var oModel = iContext.getSetting("ovpCardProperties");
        var bAddODataSelect = oModel.getProperty("/addODataSelect");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        var oSelectionVariant = oEntityType[oModel.getProperty("/selectionAnnotationPath")];
        var oPresentationVariant = oEntityType[oModel.getProperty("/presentationAnnotationPath")];
        var sEntitySetPath = "/" + oEntitySet.name;
        var aAnnotationsPath = Array.prototype.slice.call(arguments, 2);
        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters");
        var bODataV4 = isODataV4Context(iContext);

        // check if entity set needs parameters
        // if selection-annotations path is supplied - we need to resolve it in order to resolve the full entity-set path
        if (oSelectionVariant || !!aParameters) {
            if (
                (oSelectionVariant && oSelectionVariant.Parameters && oSelectionVariant.Parameters.length > 0) ||
                !!aParameters
            ) {
                // in case we have UI.SelectionVariant annotation defined on the entityType including Parameters - we need to resolve the entity-set path to include it
                sEntitySetPath = MetadataAnalyser.resolveParameterizedEntitySet(
                    iContext.getSetting("dataModel"),
                    oEntitySet,
                    oSelectionVariant,
                    aParameters
                );
            }
        }

        if (oModel.getProperty("/cardLayout") && oModel.getProperty("/cardLayout/noOfItems")) {
            var result = "{path: '" + sEntitySetPath + "', length: " + +oModel.getProperty("/cardLayout/noOfItems");
        } else {
            var result = "{path: '" + sEntitySetPath + "', length: " + getItemsLength(oModel);
        }

        //prepare the select fields in case flag is on
        var aSelectFields = [];
        if (bAddODataSelect) {
            aSelectFields = getSelectFields(iContext, oMetaModel, oEntityType, aAnnotationsPath);
            var cardTemplate = oModel.getProperty("/template");
            if (
                cardTemplate != "sap.ovp.cards.charts.analytical" &&
                cardTemplate != "sap.ovp.cards.charts.smart.chart"
            ) {
                var aRequestFields = getRequestAtLeastFields(oPresentationVariant);
                for (var i = 0; i < aRequestFields.length; i++) {
                    if (aSelectFields.indexOf(aRequestFields[i]) === -1) {
                        aSelectFields.push(aRequestFields[i]);
                    }
                }
            }
        }
        //prepare the expand list if navigation properties are used
        var aExpand = getExpandList(oMetaModel, oEntityType, aAnnotationsPath, iContext);
        var bCheckFilterPreference = checkFilterPreference(oModel);
        var bSelectOrExpandParams = false;
        if (bCheckFilterPreference || aSelectFields.length > 0 || aExpand.length > 0) {
            result = result + ", parameters: {";
        }

        //add select and expand parameters to the binding info string if needed
        if (aSelectFields.length > 0 || aExpand.length > 0) {
            if (aSelectFields.length > 0) {
                result = result + "select: '" + aSelectFields.join(",") + "'";
                bSelectOrExpandParams = true;
            }

            if (aExpand.length > 0) {
                if (aSelectFields.length > 0) {
                    result = result + ", ";
                }
                result = result + "expand: '" + aExpand.join(",") + "'";
                bSelectOrExpandParams = true;
            }
            if (bCheckFilterPreference) {
                result = result + ", ";
            }
        }

        // add card id as custom parameter
        if (bCheckFilterPreference) {
            result = result + "custom: {cardId: '" + oModel.getProperty("/cardId") + "'" + ", _requestFrom: 'ovp_internal'}";
            bSelectOrExpandParams = false;
        } else if (!result.includes(", parameters: {")) {
            result = result + ", parameters: {custom: {_requestFrom: 'ovp_internal'}}";
            bSelectOrExpandParams = false;
        } else if (bSelectOrExpandParams) {
            result = result + ", custom: {_requestFrom: 'ovp_internal'}";
        }

        if (bCheckFilterPreference || aSelectFields.length > 0 || aExpand.length > 0) {
            result = result + "}";
        }

        //apply sorters information
        var aSorters = getSorters(oModel, oPresentationVariant, bODataV4);
        if (aSorters.length > 0) {
            result = result + ", sorter:" + JSON.stringify(aSorters);
        }

        //apply filters information
        var aFilters = Filterhelper.getFilters(oModel, oSelectionVariant);

        if (aFilters.length > 0) {
            aFilters = Filterhelper.createExcludeFilters(aFilters, oModel);
            result = result + ", filters:" + JSON.stringify(aFilters);
        }
        result = result + "}";
        // returning the parsed path for the Card's items-aggregation binding
        return result;
    }
    formatItems.requiresIContext = true;

    /**
     * returns an array of navigation properties prefixes to be used in an odata $expand parameter
     *
     * @param oMetaModel - metamodel to get the annotations to query
     * @param oEntityType - the relevant entityType
     * @param aAnnotationsPath - an array of annotation path to check
     * @param iContext
     * @returns {Array} of navigation properties prefixes to be used in an odata $expand parameter
     */
    function getExpandList(oMetaModel, oEntityType, aAnnotationsPath, iContext) {
        var aExpand = [];
        var sAnnotationPath, oBindingContext, aColl, sExpand;

        //loop over the annotation paths
        for (var i = 0; i < aAnnotationsPath.length; i++) {
            if (!aAnnotationsPath[i]) {
                continue;
            }
            sAnnotationPath = oEntityType.$path + "/" + aAnnotationsPath[i];
            oBindingContext = oMetaModel.createBindingContext(sAnnotationPath);
            aColl = oBindingContext.getObject();
            //if the annotationPath does not exists there is no BindingContext
            aColl = aColl ? aColl : [];
            for (var j = 0; j < aColl.length; j++) {
                if (aColl[j].Value && aColl[j].Value.Path) {
                    sExpand = getNavigationPrefix(oMetaModel, oEntityType, aColl[j].Value.Path, iContext);
                    if (sExpand && aExpand.indexOf(sExpand) === -1) {
                        aExpand.push(sExpand);
                    }
                    // expand if UOM or ISOCurrency or Text annotation is an assosciated property
                    var oEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, aColl[j].Value.Path);
                    if (oEntityTypeProperty) {
                        var sUnitPath;
                        if (oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
                            sUnitPath = oEntityTypeProperty[ANNOTATIONTYPE.UOM].Path;
                        } else if (oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY]) {
                            sUnitPath = oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY].Path;
                        } else if (oEntityTypeProperty[ANNOTATIONTYPE.TEXT]) {
                            sUnitPath = oEntityTypeProperty[ANNOTATIONTYPE.TEXT].Path;
                        }

                        if (sUnitPath && sUnitPath.split("/").length > 1) {
                            sExpand = getNavigationPrefix(oMetaModel, oEntityType, sUnitPath, iContext);
                            if (sExpand && aExpand.indexOf(sExpand) === -1) {
                                aExpand.push(sExpand);
                            }
                        } else {
                            // expand if UOM or ISOCurrency has a Text annotation which is an assosciated property
                            var oUnitEntityTypeProperty = oMetaModel.getODataProperty(oEntityType, sUnitPath);
                            if (oUnitEntityTypeProperty) {
                                var sUnitTextPath = oUnitEntityTypeProperty[ANNOTATIONTYPE.TEXT] && oUnitEntityTypeProperty[ANNOTATIONTYPE.TEXT].Path;
                                if (sUnitTextPath && sUnitTextPath.split("/").length > 1) {
                                    sExpand = getNavigationPrefix(oMetaModel, oEntityType, sUnitTextPath, iContext);
                                    if (sExpand && aExpand.indexOf(sExpand) === -1) {
                                        aExpand.push(sExpand);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return aExpand;
    }

    /**
     * returns an array of properties paths to be used in an odata $select parameter
     *
     * @param oMetaModel - metamodel to get the annotations to query
     * @param oEntityType - the relevant entityType
     * @param aAnnotationsPath - an array of annotation path to check
     * @returns {Array} of properties paths to be used in an odata $select parameter
     */
    function getSelectFields(iContext, oMetaModel, oEntityType, aAnnotationsPath) {
        var aSelectFields = [];
        var sAnnotationPath, oBindingContext, aColl;

        //loop over the annotation paths
        for (var i = 0; i < aAnnotationsPath.length; i++) {
            if (!aAnnotationsPath[i]) {
                continue;
            }

            sAnnotationPath = oEntityType.$path + "/" + aAnnotationsPath[i];
            oBindingContext = oMetaModel.createBindingContext(sAnnotationPath);
            var oContext = {};

            // This is currently true for stack cards, we have sent a dummy iContext which we need to enrich in order to format fields correctly
            if (iContext && iContext.bDummyContext) {
                merge(oContext, iContext, oBindingContext, true);
            } else {
                oContext = iContext;
            }

            aColl = oBindingContext.getObject();
            //if the annotationPath does not exists there is no BindingContext
            if (!aColl) {
                aColl = [];
            } else if (isPlainObject(aColl)) {
                // For the case of FieldGroups
                if (aColl.Data) {
                    aColl = aColl.Data;
                } else {
                    aColl = [];
                }
            }

            var oItem;
            var aItemValue;
            var sFormattedField;
            var sRecordType;
            for (var j = 0; j < aColl.length; j++) {
                aItemValue = [];
                oItem = aColl[j];
                sFormattedField = "";
                sRecordType = oItem.RecordType;

                if (sRecordType === "com.sap.vocabularies.UI.v1.DataField") {
                    // in case of a DataField we format the field to get biding string ; we use simple paths as we simply need select column names
                    sFormattedField = _formatField(
                        oContext,
                        oItem,
                        oEntityType,
                        oMetaModel,
                        undefined,
                        undefined,
                        true
                    );
                } else if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
                    // in case of DataFieldForAnnotation we resolve the DataPoint target path of the DataField and format the field to get biding string
                    var sTargetPath = getTargetPathForDataFieldForAnnotation(oEntityType.$path, oItem, iContext);
                    sFormattedField = _formatDataPoint(
                        oContext,
                        oMetaModel.getProperty(sTargetPath),
                        oEntityType,
                        oMetaModel
                    );

                    var sCriticality = getCriticalityForDataPoint(oMetaModel.getProperty(sTargetPath));
                    if (sCriticality && sCriticality.length > 0) {
                        sFormattedField += sCriticality;
                    }
                } else if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" && oItem.Url) {
                    // format the URL ONLY IN CASE NO UrlRef member resides under it
                    var sFormattedUrl;
                    if (!oItem.Url.UrlRef) {
                        sFormattedUrl = OdataAnnotationHelper.format(oContext, oItem.Url);
                    }

                    // meaning binding which needs to be evaluated at runtime
                    if (sFormattedUrl && sFormattedUrl.substring(0, 2) === "{=") {
                        sFormattedField = sFormattedUrl;
                    }
                }

                // if we have found a relevant binding-info-string this iteration then parse it to get binded properties
                if (sFormattedField) {
                    var result = OdataAnnotationHelper.simplePath(oContext, oItem.Value);
                    //To handle select parameter for text only
                    if (sFormattedField.indexOf("(") < 0 && sFormattedField !== result) {
                        sFormattedField = [].concat(result, sFormattedField).join(" ");
                    }
                    aItemValue = getPropertiesFromBindingString(sFormattedField);
                }

                if (aItemValue && aItemValue.length > 0) {
                    // for each property found we check if has sap:unit and sap:text
                    var sItemValue;
                    for (var k = 0; k < aItemValue.length; k++) {
                        sItemValue = aItemValue[k];

                        // if this property is found for the first time - look for its unit and text properties as well
                        if (!aSelectFields[sItemValue]) {
                            aSelectFields[sItemValue] = true;
                            // checking if we need to add also the sap:unit property of the field's value
                            var sUnitPropName = CommonUtils.getUnitColumn(sItemValue, oEntityType);
                            if (sUnitPropName && sUnitPropName !== sItemValue) {
                                aSelectFields[sUnitPropName] = true;
                            }
                            // checking if we need to add also the sap:text property of the field's value
                            var sTextPropName = getTextPropertyForEntityProperty(
                                oMetaModel,
                                oEntityType,
                                sItemValue,
                                iContext
                            );
                            if (sTextPropName && sTextPropName !== sItemValue) {
                                aSelectFields[sTextPropName] = true;
                            }
                        }
                    }
                }
            }
        }
        // return all relevant property names
        return Object.keys(aSelectFields);
    }

    function getPropertiesFromBindingString(sBinding) {
        //Remove direct values and keep only the bindings in sBinding
        //"{NetAmount} kg" would be converted to "{NetAmount}"
        //"{NetAmount} kg {Country}" would be converted to "{NetAmount}{Country}"
        //"{path: Customer, formatter: something.something}" will remain as is
        var i,
            iMatchCount = 0,
            len = sBinding.length,
            sBindingPathOnly = "",
            sCharAt;
        for (i = 0; i < len; i++) {
            sCharAt = sBinding.charAt(i);
            if (!sCharAt) {
                return;
            }
            switch (sCharAt) {
                case "{":
                    iMatchCount++; //Add opening brace to stack
                    break; //from switch (not loop)
                case "}":
                    iMatchCount--; //Match and remove one opening brace from stack
                    break; //from switch (not loop)
                default:
                    //No opening braces in stack, that means current character is outside braces
                    //and should be ignored
                    if (iMatchCount <= 0) {
                        continue; //to next loop ignoring next statements
                    }
                    break; //from switch (not loop)
            }
            sBindingPathOnly += sCharAt;
        }
        sBinding = sBindingPathOnly;
        /**
         * BCP: 1680241227
         * Regex expressions were not handling properties that included the '_' character.
         * With '\_' as part of [a-zA-Z0-9], they should be able to handle.
         */
        var regexBindingEvaluation = /\${([a-zA-Z0-9\_|\/]*)/g;
        var regexBindingNoPath = /[^[{]*[a-zA-Z0-9\_]/g;
        var regexBindingPath = /path *\: *\'([a-zA-Z0-9\_]+)*\'/g;
        var regex,
            index,
            matches = [];

        //in case the path consists of parts - replace it with empty string so that
        //'parts' does not appear as a property
        if (sBinding.indexOf("{parts:[") !== -1) {
            sBinding = sBinding.replace("{parts:[", "");
            sBinding = sBinding.replace("]", "");
            sBinding = sBinding.replace(sBinding.lastIndexOf("}", ""));
        }

        if (sBinding.substring(0, 2) === "{=") {
            /*
             meaning binding string looks like "{= <rest of the binding string>}"
             which is a binding which needs to be evaluated using some supported function
             properties appear as ${propertyName} inside the string
             */
            regex = regexBindingEvaluation;

            /* index is 1 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of 2 items, for example ["${Address}", "Address"] so we need the 2nd result each match found */
            index = 1;
        } else if (sBinding.indexOf("path") !== -1) {
            /* In a scenario where binding contains string like "{propertyName} {path:'propertyName'}" */
            /* Here we get the properties without path and add it to array matches*/
            if (sBinding.indexOf("{value") > 0) {
                var countBraces = 0;
                var i = sBinding.indexOf("{value") + 5;
                var indexOfClosingBraces;
                while (i < len) {
                    if (sBinding[i] === "}" && countBraces === 0) {
                        indexOfClosingBraces = i;
                        break;
                    }
                    if (sBinding[i] === "{") {
                        countBraces += 1;
                    }
                    if (sBinding[i] === "}") {
                        countBraces -= 1;
                    }
                    i++;
                }
                sBinding = sBinding.slice(0, sBinding.indexOf("{value")) + sBinding.slice(indexOfClosingBraces);
            }
            //In case the sBinding consists of constraints - remove constraints:{} so that it is not added to matches array
            if (sBinding.indexOf("constraints:{") !== -1) {
                var countBraces = 0;
                var i = sBinding.indexOf("constraints:{") + 12;
                var indexOfClosingBraces;
                while (i < len) {
                    if (sBinding[i] === "{") {
                        countBraces += 1;
                    }
                    if (sBinding[i] === "}") {
                        countBraces -= 1;
                        if (countBraces === 0) {
                            indexOfClosingBraces = i;
                            break;
                        }
                    }
                    i++;
                }
                sBinding = sBinding.slice(0, sBinding.indexOf("constraints:{") - 1) + sBinding.slice(indexOfClosingBraces + 1);
            }
            var matchWithNoPath = regexBindingNoPath.exec(sBinding);
            while (matchWithNoPath) {
                //i18n is also enclosed in braces, but that is not a property, so ignore them
                if (
                    matchWithNoPath[0].indexOf("path") === -1 &&
                    matchWithNoPath[0].indexOf("@i18n") !== 0 &&
                    matchWithNoPath[0].indexOf("model: 'ovpCardProperties'") <= -1
                ) {
                    matches.push(matchWithNoPath[0]);
                }
                matchWithNoPath = regexBindingNoPath.exec(sBinding);
            }

            /* meaning binding contains string like "{path:'propertyName'}" */
            regex = regexBindingPath;

            /* index is 1 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of 2 items, for example ["{path: 'Address'}", "Address"] so we need the 2nd result each match found */
            index = 1;
        } else {
            /* meaning binding contains string like "{'propertyName'}" */
            regex = regexBindingNoPath;

            /* index is 0 as each match found by this regular expression (by invoking regex.exec(string) below) */
            /* is an array of one item, for example ["Address"] so we need the 1st result each match found */
            index = 0;
        }

        var match = regex.exec(sBinding);
        while (match) {
            //i18n is also enclosed in braces, but that is not a property, so ignore them
            if (match[index] && match[index].indexOf("@i18n") !== 0) {
                matches.push(match[index]);
            }
            match = regex.exec(sBinding);
        }
        return matches;
    }

    /**
     * return the sorters that need to be applyed on an aggregation
     *
     * @param ovpCardProperties - card properties model which might contains sort configurations
     * @param oPresentationVariant - optional presentation variant annotation with SortOrder configuration
     * @param bODataV4  - If OData type is V4 then true false otherwise
     * @returns {Array} of model sorters
     */
    function getSorters(ovpCardProperties, oPresentationVariant, bODataV4) {
        var aSorters = [];
        var oSorter, bDescending;

        //get the configured sorter if exist and append them to the sorters array
        var sPropertyPath = ovpCardProperties.getProperty("/sortBy");
        if (sPropertyPath) {
            // If sorting is enabled by card configuration
            var sSortOrder = ovpCardProperties.getProperty("/sortOrder");
            if (sSortOrder && sSortOrder.toLowerCase() !== "descending") {
                bDescending = false;
            } else {
                bDescending = true;
            }
            oSorter = {
                path: sPropertyPath,
                descending: bDescending
            };
            aSorters.push(oSorter);
        }

        //get the sorters from the presentation variant annotations if exists
        var aSortOrder = (oPresentationVariant && oPresentationVariant.SortOrder) || undefined;
        var oSortOrder, sPropertyPath;
        if (aSortOrder) {
            for (var i = 0; i < aSortOrder.length; i++) {
                oSortOrder = aSortOrder[i];
                sPropertyPath = bODataV4 ? oSortOrder.Property.$PropertyPath : oSortOrder.Property.PropertyPath;
                bDescending = Filterhelper.getBooleanValue(oSortOrder.Descending, true);
                oSorter = {
                    path: sPropertyPath,
                    descending: bDescending
                };
                aSorters.push(oSorter);
            }
        }

        return aSorters;
    }

    function getRequestAtLeastFields(oPresentationVariant) {
        var aRequest = [];
        var aRequestFields = (oPresentationVariant && oPresentationVariant.RequestAtLeast) || undefined;
        if (aRequestFields) {
            for (var i = 0; i < aRequestFields.length; i++) {
                if (aRequestFields[i].PropertyPath) {
                    aRequest.push(aRequestFields[i].PropertyPath);
                }
            }
        }
        return aRequest;
    }

    function getCardSelections(ovpCardProperties, bODataV4) {
        var selectionAnnotationPath = ovpCardProperties.getProperty("/selectionAnnotationPath");
        var oEntityType, oSelectionVariant;

        if (bODataV4 && selectionAnnotationPath) {
            var oEntitySet = ovpCardProperties.getProperty("/entityType");
            var oMetaModel = ovpCardProperties.getProperty("/metaModel");
            oEntityType = oMetaModel.getObject("/" + oEntitySet.$Type + "/@");
            selectionAnnotationPath = "@" + selectionAnnotationPath;
        } else {
            oEntityType = ovpCardProperties.getProperty("/entityType");
        }

        oSelectionVariant = selectionAnnotationPath && oEntityType[selectionAnnotationPath];

        return {
            filters: Filterhelper.getFilters(ovpCardProperties, oSelectionVariant, bODataV4),
            parameters: getParameters(oSelectionVariant, bODataV4)
        };
    }

    /**
     * This function is called during navigation to get the card sorters in a format
     * accepted by presentation variant
     * @param ovpCardProperties
     * @param bODataV4
     * @returns {object} with property SortOrder of type array
     */
    function getCardSorters(ovpCardProperties, bODataV4) {
        if (!ovpCardProperties) {
            return;
        }
        var oEntityType = ovpCardProperties.getProperty("/entityType");
        var oPresentationVariant = oEntityType[ovpCardProperties.getProperty("/presentationAnnotationPath")];
        var aSorters = getSorters(ovpCardProperties, oPresentationVariant, bODataV4);

        //Convert aSorters to a format accepted by presentation variant during navigation
        //"SortOrder":[{"Property":"FiscalPeriod","Descending":false}],
        var aCardSorters = [];
        var i,
            iLength = aSorters.length;
        for (i = 0; i < iLength; i++) {
            if (!aSorters[i].path) {
                continue;
            }
            aCardSorters.push({
                Property: aSorters[i].path,
                Descending: aSorters[i].descending
            });
        }
        if (aCardSorters.length > 0) {
            return {
                SortOrder: aCardSorters
            };
        }
    }

    /**
     * return the card level parameters defined in selection annotation
     *
     * @param oSelectionVariant - optional selection variant annotation with SelectOptions configuration
     * @param bODataV4 - If the model type is v4 or not
     * @returns {Array} of parameters
     */
    function getParameters(oSelectionVariant, bODataV4) {
        var oParameter,
            aParameters = [];

        //If selection variant or parameters do not exist in annotations
        if (!oSelectionVariant || !oSelectionVariant.Parameters) {
            return aParameters;
        }

        var iLength = oSelectionVariant.Parameters.length;
        for (var i = 0; i < iLength; i++) {
            oParameter = oSelectionVariant.Parameters[i];

            //If parameter property name or path not present
            if (!oParameter.PropertyName || !oParameter.PropertyName.PropertyPath) {
                continue;
            }

            //Property name is there but value annotation is not there, then give error
            if (!oParameter.PropertyValue) {
                oLogger.error("Missing value for parameter " + oParameter.PropertyName.PropertyPath);
                continue;
            }

            aParameters[aParameters.length] = {
                path: oParameter.PropertyName.PropertyPath,
                value: Filterhelper.getPrimitiveValue(oParameter.PropertyValue, bODataV4)
            };
        }
        return aParameters;
    }

    /**
     * This function returns path or primitive value or expression binding based on bKPIHeader
     * 
     * @param oItem
     * @param bODataV4
     * @param bKPIHeader for KPI header the aggregation is aggregation and needs a type : add true in case of oData V4
     * @returns {string}
     */
    function getPathOrPrimitiveValue(oItem, bODataV4, bKPIHeader) {
        if (oItem) {
            var sPath = bODataV4 ? oItem.$Path : oItem.Path;
            if (sPath) {
                return bKPIHeader
                    ? "{path:'" + sPath + "Agg" + "', type:'sap.ui.model.odata.type.Decimal'}"
                    : "{path:'" + sPath + "'}";
            } else {
                return Filterhelper.getPrimitiveValue(oItem, bODataV4);
            }
        } else {
            return "";
        }
    }

    function getItemsLength(oOvpCardPropertiesModel) {
        var type = oOvpCardPropertiesModel.getProperty("/contentFragment");
        var listType = oOvpCardPropertiesModel.getProperty("/listType");
        var flavor = oOvpCardPropertiesModel.getProperty("/listFlavor");
        var oItemSizes;
        var device = "desktop";

        //get current device
        if (Device.system.phone) {
            device = "phone";
        } else if (Device.system.tablet) {
            device = "tablet";
        }
        //check the current card type and get the sizes objects
        if (type == "sap.ovp.cards.list.List") {
            if (listType == "extended") {
                if (flavor == "bar") {
                    oItemSizes = CardConstants.ItemLength["List_extended_bar"];
                } else {
                    oItemSizes = CardConstants.ItemLength["List_extended"];
                }
            } else if (flavor == "bar") {
                oItemSizes = CardConstants.ItemLength["List_condensed_bar"];
            } else {
                oItemSizes = CardConstants.ItemLength["List_condensed"];
            }
        } else if (type == "sap.ovp.cards.table.Table") {
            oItemSizes = CardConstants.ItemLength["Table"];
        } else if (type == "sap.ovp.cards.stack.Stack") {
            if (oOvpCardPropertiesModel.getProperty("/objectStreamCardsNavigationProperty")) {
                oItemSizes = CardConstants.ItemLength["Stack_complex"];
            } else {
                oItemSizes = CardConstants.ItemLength["Stack_simple"];
            }
        }

        if (oItemSizes) {
            return oItemSizes[device];
        }
        return 5;
    }

    //Function to remove the datafield if there is a datapoint with same target as datafield
    function removeDuplicateDataField(oContext) {
        var aCollection = oContext.getObject();
        var aDataPoints = getSortedDataPoints(oContext, aCollection, true);
        var oDataPointValue, oDataPointFnValue;
        var bODataV4 = isODataV4Context(oContext);
        var sRecordType, sPath;

        var aDataPointsValues = aDataPoints.map(function (oDataPoint) {
            oDataPointValue = oDataPoint && oDataPoint.Value;
            oDataPointFnValue = oDataPoint && oDataPoint.fn;

            if (oDataPointValue &&
                (oDataPointValue.Path || oDataPointValue.$Path)) {
                return bODataV4 ? oDataPointValue.$Path : oDataPointValue.Path;
            } else if (oDataPointFnValue &&
                (oDataPointFnValue.Path || oDataPointFnValue.$Path)) {
                return bODataV4 ? oDataPointFnValue.$Path : oDataPointFnValue.Path;
            }
        });
        aCollection.filter(function (item, index) {
            sRecordType = bODataV4 ? item.$Type : item.RecordType;
            sPath = bODataV4 ?
                item.Value && item.Value.$Path :
                item.Value && item.Value.Path;
            if (
                sRecordType === "com.sap.vocabularies.UI.v1.DataField" &&
                aDataPointsValues.indexOf(sPath) > -1
            ) {
                aCollection.splice(index, 1);
            }
        });

        if (bODataV4) {
            return oContext.sPath;
        }
    }
    removeDuplicateDataField.requiresIContext = true;

    function getDataPointsCount(iContext, aCollection) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection);
        return aDataPoints.length;
    }
    getDataPointsCount.requiresIContext = true;

    function getFirstDataPointValue(iContext, aCollection) {
        return getDataPointValue(iContext, aCollection, 0);
    }
    getFirstDataPointValue.requiresIContext = true;

    function getDataPointValue(iContext, aCollection, index) {
        var aDataPoints = getSortedDataPoints(iContext, aCollection),
            oDataPoint = aDataPoints[index],
            oDataPointValue = oDataPoint && oDataPoint.Value,
            bODataV4 = isODataV4Context(iContext),
            sPath = bODataV4 ?
                oDataPointValue && oDataPointValue.$Path :
                oDataPointValue && oDataPointValue.Path;

        return sPath || "";
    }

    function getFirstDataFieldName(iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 0);
    }
    getFirstDataFieldName.requiresIContext = true;

    function getSecondDataFieldName(iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 1);
    }
    getSecondDataFieldName.requiresIContext = true;

    function getThirdDataFieldName(iContext, aCollection) {
        return getDataFieldName(iContext, aCollection, 2);
    }
    getThirdDataFieldName.requiresIContext = true;

    function formatDataFieldValueOnIndex(iContext, aCollection, index) {
        return formatDataField(iContext, aCollection, index);
    }
    formatDataFieldValueOnIndex.requiresIContext = true;

    function formatDataPointValueOnIndex(iContext, aCollection, index) {
        return formatDataPoint(iContext, aCollection, index);
    }
    formatDataPointValueOnIndex.requiresIContext = true;

    /**
     * This function checks the count of the data points for a particular line item and returns the data point or data field based on the index passed from the XML fragment
     * Data point takes the priority over the data field
     * @param iContext
     * @param aCollection
     * @param iDataPointIndex
     * @param iDataFieldIndex
     * @returns {*}
     */
    function formatDataPointOrField(iContext, aCollection, iDataPointIndex, iDataFieldIndex) {
        var iDataPointCount = getDataPointsCount(iContext, aCollection);
        if (iDataPointCount > 0) {
            return formatDataPointValueOnIndex(iContext, aCollection, iDataPointIndex);
        } else {
            return formatDataFieldValueOnIndex(iContext, aCollection, iDataFieldIndex);
        }
    }
    formatDataPointOrField.requiresIContext = true;

    function formatsemanticObjectOfDataFieldGeneric(iContext, oEntitySet, aCollection) {
        return semanticObjectOfDataField(iContext, oEntitySet, aCollection);
    }
    formatsemanticObjectOfDataFieldGeneric.requiresIContext = true;

    function getLabelForFirstDataPoint(iContext, aCollection) {
        return getLabelForDataPoint(iContext, aCollection, 0);
    }
    getLabelForFirstDataPoint.requiresIContext = true;

    /**
     * This function returns the binding for the first dataField which contains
     * an iconURL property
     * @param iContext
     * @param aCollection
     * @returns a binding or a URL based on what has been defined in the annotations
     */
    function formatImageUrl(iContext, aCollection) {
        var bODataV4 = isODataV4Context(iContext);
        var sRecordType;

        for (var i = 0; i < aCollection.length; i++) {
            var oItem = aCollection[i];
            sRecordType = bODataV4 ? oItem.$Type : oItem.RecordType;
            if (sRecordType === "com.sap.vocabularies.UI.v1.DataField") {
                if (oItem.IconUrl && oItem.IconUrl.String) {
                    return oItem.IconUrl.String;
                }
                if (bODataV4 && oItem.IconUrl && oItem.IconUrl.$Path) {
                    return oDataV4AnnotationHelper.format(oItem.IconUrl, { context: iContext });
                }
                if (!bODataV4 && oItem.IconUrl && oItem.IconUrl.Path) {
                    return OdataAnnotationHelper.simplePath(iContext, oItem.IconUrl);
                }
            }
        }
    }
    formatImageUrl.requiresIContext = true;

    /**
     * this function returns the formatted unit for a particular object number
     * returns blank if there is no entity type of currency is available
     * @param iContext
     * @param aCollection
     * @param index
     * @returns {string}
     */
    function formatUnit(iContext, aCollection, index) {
        var result = "";
        var oItem;

        if (Array.isArray(aCollection)) {
            oItem = getSortedDataPoints(iContext, aCollection)[index];
        } else {
            // it will be a plain object
            var oCopyOfCollection = Object.assign({}, aCollection);
            var oCopyOfContext = Object.assign({}, iContext);
            oItem = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);
        }
        if (!oItem || !oItem.Value) {
            return result;
        }
        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel && oModel.getProperty("/entityType");
        var oMetaModel = oModel && oModel.getProperty("/metaModel");
        var bODataV4 = isODataV4Context(iContext);

        var oEntityTypeProperty = bODataV4 ?
            oMetaModel && oMetaModel.getData()["$Annotations"][oEntityType.$Type + "/" + oItem.Value.$Path] :
            oMetaModel && oMetaModel.getODataProperty(oEntityType, oItem.Value.Path);
        var oCurrency = bODataV4 ?
            oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY] :
            oEntityTypeProperty && oEntityTypeProperty[ANNOTATIONTYPE.ISO_CURRENCY]; // TODO: need to check for the unit as well
        if (oCurrency && !bODataV4) {
            if (oCurrency.Path) {
                result += " " + generatePathForField([oCurrency.Path]);
                //support sap:text property for ISOCurrency
                result += " " + getSapTextPathForUOM(oCurrency.Path, oMetaModel, oEntityType, iContext);
            } else if (oCurrency.String) {
                result += " " + oCurrency.String;
            }
        } else if (oCurrency && bODataV4) {
            if (oCurrency.$Path) {
                result += " " + generatePathForField([oCurrency.$Path]);
            } else {
                result += " " + oCurrency;
            }
            result += " " + getSapTextPathForUOM(oCurrency.$Path, oMetaModel, oEntityType, iContext);
        }
        return result;
    }
    formatUnit.requiresIContext = true;

    /**
     * Function takes care of the formatting of the controls that need to display the number and the corresponding units
     * this function is getting called from the xml view and the data from the ovpConstants model is passed to the function
     * this calls the same function with different index based on the values passed from the xmml views
     * this method inturn calls the format data point function with the recieved parameters
     * @param iContext
     * @param aCollection
     * @param index
     * @param dontIncludeUOM - this field will always be true for object numbers and the unit of measure will not be appended to the actual value
     * @returns {*}
     */
    function formatObjectNumber(iContext, aCollection, index, dontIncludeUOM) {
        return formatDataPoint(iContext, aCollection, index, dontIncludeUOM);
    }
    formatObjectNumber.requiresIContext = true;

    function formatFirstDataPointState(iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 0);
    }
    formatFirstDataPointState.requiresIContext = true;

    function formatFirstDataPointColor(iContext, aCollection) {
        return formatDataPointColor(iContext, aCollection, 0);
    }
    formatFirstDataPointColor.requiresIContext = true;

    function formatSecondDataPointState(iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 1);
    }
    formatSecondDataPointState.requiresIContext = true;

    function formatThirdDataPointState(iContext, aCollection) {
        return formatDataPointState(iContext, aCollection, 2);
    }
    formatThirdDataPointState.requiresIContext = true;

    function formatFirstDataPointStateForSmartField(iContext, aCollection) {
        return formatDataPointStateForSmartField(iContext, aCollection, 0);
    }
    formatFirstDataPointStateForSmartField.requiresIContext = true;

    //To support criticality with path for kpi value
    function kpiValueCriticality(nCriticality) {
        var oCriticality = {};
        oCriticality.EnumMember = "None";

        if (Number(nCriticality) === 1) {
            oCriticality.EnumMember = "Negative";
        } else if (Number(nCriticality) === 2) {
            oCriticality.EnumMember = "Critical";
        } else if (Number(nCriticality) === 3) {
            oCriticality.EnumMember = "Positive";
        }
        return criticality2state(oCriticality, CardConstants.Criticality.ColorValues, false);
    }

    function isODataV4Context(iContext) {
        var oModel = iContext &&
            typeof iContext.getModel === 'function' &&
            iContext.getModel(0) &&
            iContext.getModel(0).oModel;

        return oModel && CommonUtils.isODataV4(oModel) || false;
    }

    function formatKPIHeaderState(iContext, oDataPoint) {
        var bODataV4 = isODataV4Context(iContext),
            oDataPointCriticallity = oDataPoint && oDataPoint.Criticality || {},
            sCriticalityPath = bODataV4 ? oDataPointCriticallity.$Path : oDataPointCriticallity.Path;

        if (sCriticalityPath && bODataV4) {
            return (
                "{parts: [{path:'" +
                sCriticalityPath +
                "Agg', type:'sap.ui.model.odata.type.Decimal'}], formatter: 'sap.ovp.cards.AnnotationHelper.kpiValueCriticality'}"
            );
        } else if (sCriticalityPath && !bODataV4) {
            return (
                "{parts: [{path:'" +
                oDataPoint.Criticality.Path +
                "'}], formatter: 'sap.ovp.cards.AnnotationHelper.kpiValueCriticality'}"
            );
        } else {
            // In case of v4 cards the fourth parameter will be true i.e. bKPIHeader
            return formatDataPointToValue(iContext, oDataPoint, CardConstants.Criticality.ColorValues, bODataV4);
        }
    }
    formatKPIHeaderState.requiresIContext = true;

    function isFirstDataPointCriticality(iContext, aCollection) {
        return criticalityConditionCheck(iContext, aCollection, 0);
    }
    isFirstDataPointCriticality.requiresIContext = true;

    //check data point criticality for center alignment in table easy scan layout
    function isFirstDataPointCriticalityForTableStatus(iContext, aCollection) {
        var item = getSortedDataPoints(iContext, aCollection)[0];
        return item && (item.Criticality || item.CriticalityCalculation) ? true : false;
    }
    isFirstDataPointCriticalityForTableStatus.requiresIContext = true;

    //Generic formatting functions

    function formatValueFromTarget(oContext, aCollection) {
        var sContextPath = oContext.getPath(0);
        var sEntityTypePath = sContextPath.slice(0, sContextPath.lastIndexOf("/"));
        sEntityTypePath = sEntityTypePath.slice(0, sEntityTypePath.lastIndexOf("/"));
        var sPath = getTargetPathForDataFieldForAnnotation(sEntityTypePath, aCollection, oContext);
        aCollection = oContext.getModel(0).getProperty(sPath);

        return aCollection;
    }

    function formatDataFieldValueGeneric(iContext, aCollection) {
        if (!aCollection) {
            return "";
        }
        return formatField(iContext, aCollection);
    }
    formatDataFieldValueGeneric.requiresIContext = true;

    function semanticObjectOfDataField(iContext, oEntitySet, aCollection, index) {
        var semanticObjectOfDF;
        var bODataV4 = isODataV4Context(iContext);
        var item = index == undefined ? aCollection : getSortedDataFields(iContext, aCollection)[index];
        var oModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityType = bODataV4 ? oEntitySet.$Type : oMetaModel.getODataEntityType(oEntitySet.entityType);
        var oEntityTypeProps = bODataV4 ?
            oMetaModel.getData()["$Annotations"][oEntityType + "/" + item.Value.$Path] :
            oEntityType.property;

        if (oEntityTypeProps && bODataV4) {
            semanticObjectOfDF = oEntityTypeProps["@com.sap.vocabularies.Common.v1.SemanticObject"];
            if (semanticObjectOfDF) {
                return oDataV4AnnotationHelper.format(
                    semanticObjectOfDF,
                    iContext.getModel() ? { context: iContext } : { context: iContext.getInterface(0) }
                );
            } else {
                return "";
            }
        }

        if (oEntityTypeProps && !bODataV4) {
            for (var i = 0; i < oEntityTypeProps.length; i++) {
                if (item.Value.Path === oEntityTypeProps[i].name) {
                    semanticObjectOfDF = oEntityTypeProps[i]["com.sap.vocabularies.Common.v1.SemanticObject"];
                    if (semanticObjectOfDF) {
                        return OdataAnnotationHelper.format(iContext, semanticObjectOfDF);
                    } else {
                        return "";
                    }
                }
            }
        }
    }

    function checkNavTargetForContactAnno(iContext, item, index) {
        var bODataV4 = isODataV4Context(iContext);
        var oItemValue = item && item.Value;
        var oItemIndexValue = item && item[index] && item[index].Value;
        var sPath = bODataV4 ?
            oItemValue && oItemValue.$Path :
            oItemValue && oItemValue.Path;
        var sItemIndexPath = bODataV4 ?
            oItemIndexValue && oItemIndexValue.$Path :
            oItemIndexValue && oItemIndexValue.Path;
        var path = index === undefined ? sPath : sItemIndexPath;
        var navTarget = path.indexOf("/") != -1 ? path.split("/")[0] : "";
        return navTarget;
    }
    checkNavTargetForContactAnno.requiresIContext = true;

    function checkForContactAnnotation(iContext, oEntitySet) {
        var oModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oModel.getProperty("/metaModel");
        var bODataV4 = isODataV4Context(iContext);
        var oEntityType = bODataV4 ?
            oMetaModel.getData()["$Annotations"][oEntitySet.$Type] :
            oMetaModel.getODataEntityType(oEntitySet.entityType);
        var sContactAnnotation = "com.sap.vocabularies.Communication.v1.Contact";

        if (bODataV4) {
            sContactAnnotation = "@" + sContactAnnotation;
        }

        return oEntityType && oEntityType[sContactAnnotation] ? true : false;
    }
    checkForContactAnnotation.requiresIContext = true;

    function formatDataPointValue(iContext, aCollection, dontIncludeUOM) {
        if (!aCollection) {
            return "";
        }
        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        return _formatDataPoint(iContext, aCollection, oEntityType, oMetaModel, dontIncludeUOM);
    }
    formatDataPointValue.requiresIContext = true;

    function formatDataPointStateGeneric(iContext, aCollection) {
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        var sState = "None",
            oCriticalityConfigValues = CardConstants.Criticality.StateValues;
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        if (aCollection && aCollection.Criticality) {
            sState = buildExpressionForProgressIndicatorCriticality(
                iContext,
                aCollection,
                oCriticalityConfigValues
            );
        } else {
            sState = formatDataPointToValue(iContext, aCollection, oCriticalityConfigValues);
        }
        return sState;
    }
    formatDataPointStateGeneric.requiresIContext = true;

    function checkCriticalityGeneric(iContext, aCollection) {
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        if (aCollection && aCollection.Criticality) {
            return true;
        }
    }
    checkCriticalityGeneric.requiresIContext = true;

    // check data point criticality for center alignment of property with type Edm.String in table dashboard layout
    function checkCriticalityGenericForTableStatus(iContext, aCollection) {
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var bODataV4 = isODataV4Context(iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);
        if (!aCollection) {
            return;
        }
        var oProperty = bODataV4 ?
            oMetaModel.getProperty("/" + oEntityType.$Type)[aCollection.Value.$Path] :
            oMetaModel.getODataProperty(oEntityType, aCollection.Value.Path);

        var sPropertyType = bODataV4 ?
            oProperty && oProperty.$Type :
            oProperty && oProperty.type;

        if (
            aCollection &&
            sPropertyType == "Edm.String" &&
            (aCollection.Criticality || aCollection.CriticalityCalculation)
        ) {
            return "Center";
        }

        if (oProperty && (sPropertyType == "Edm.DateTime" || sPropertyType == "Edm.DateTimeOffset")) {
            return "Right";
        }
    }
    checkCriticalityGenericForTableStatus.requiresIContext = true;

    function formatDataPointStateForSmartFieldGeneric(iContext, aCollection) {
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        aCollection = formatValueFromTarget(oCopyOfContext, oCopyOfCollection);
        var sState = "None";
        if (aCollection && aCollection.Criticality && aCollection.Criticality.Path) {
            sState = "{path:'" + aCollection.Criticality.Path + "'}";
        } else {
            sState = formatDataPointToValue(iContext, aCollection, CardConstants.Criticality.StateValues);
            sState = criticalityState2Value(sState);
        }
        return sState;
    }
    formatDataPointStateForSmartFieldGeneric.requiresIContext = true;

    /*
     * @param iContext
     * @param aCollection
     * @returns false - if there are no actions for this context
     *          true - if there are actions for this context
     *          does not return actual boolean - so we won't need to parse the result in the xml
     */
    function hasActions(iContext, aCollection) {
        var oItem;
        var bODataV4 = isODataV4Context(iContext);
        var sRecordType;
        for (var i = 0; i < aCollection.length; i++) {
            oItem = aCollection[i];
            sRecordType = bODataV4 ? oItem.$Type : oItem.RecordType;
            if (
                sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" ||
                sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
                sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl"
            ) {
                return true;
            }
        }
        return false;
    }
    hasActions.requiresIContext = true;

    function isFirstDataPointPercentageUnit(iContext, aCollection) {
        var oDataPoint = getSortedDataPoints(iContext, aCollection)[0];
        var bODataV4 = isODataV4Context(iContext);
        var oDataPointValue = oDataPoint && oDataPoint.Value;
        var sPath = bODataV4 ?
            oDataPointValue && oDataPointValue.$Path :
            oDataPointValue && oDataPointValue.Path;
        // we are sending index 0 to iContext.getPath() function
        // if we pass the default index to this method, it works for both composite path as well as parts
        // in case of parts, we need only the path from the first path in the parts
        if (sPath) {
            var sEntityTypePath = iContext.getPath(0).substr(0, iContext.getPath(0).lastIndexOf("/") + 1);
            var oModel = iContext.getModel(0);
            var oEntityType;

            if (!bODataV4) {
                oEntityType = oModel.getProperty(sEntityTypePath);
            }

            var oProperty = bODataV4 ?
                oModel.getData(sPath) :
                oModel.getODataProperty(oEntityType, sPath);
            var sEntityName = sEntityTypePath.substr(1, sEntityTypePath.length - 2);

            if (oProperty && oProperty[ANNOTATIONTYPE.UOM] && !bODataV4) {
                return oProperty[ANNOTATIONTYPE.UOM].String === "%";
            }
            if (bODataV4 &&
                oProperty &&
                oProperty[sEntityName][oDataPoint.Value.$Path][ANNOTATIONTYPE.UOM]) {
                return oProperty[ANNOTATIONTYPE.UOM].String === "%";
            }
        }
        return false;
    }
    isFirstDataPointPercentageUnit.requiresIContext = true;

    function resolveEntityTypePath(oAnnotationPathContext) {
        var sAnnotationPath = oAnnotationPathContext.getObject();
        var oModel = oAnnotationPathContext.getModel();
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntitySet = oMetaModel.getODataEntitySet(oModel.getProperty("/entitySet"));
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        sAnnotationPath = oEntityType.$path + "/" + sAnnotationPath;
        return oMetaModel.createBindingContext(sAnnotationPath);
    }

    function getAssociationObject(oModel, sAssociation, ns) {
        // find a nicer way of getting association set entry in meta model
        var aAssociations = oModel.getServiceMetadata().dataServices.schema[0].association;
        for (var i = 0; i < aAssociations.length; i++) {
            if (ns + "." + aAssociations[i].name === sAssociation) {
                return aAssociations[i];
            }
        }
    }

    /*
     Generic function to get com.sap.vocabularies.UI.v1.DataField record type from lineitem with index
     */
    function getDataFieldGeneric(iContext, aCollection, index) {
        var bODataV4 = isODataV4Context(iContext);
        var aDataFields = aCollection.filter(function (oItem) {
            return bODataV4 ?
                oItem.$Type === "com.sap.vocabularies.UI.v1.DataField" :
                oItem.RecordType === "com.sap.vocabularies.UI.v1.DataField";
        });
        var aDataFieldsSorted = sortCollectionByImportance(aDataFields, iContext);
        if (aDataFieldsSorted) {
            return aDataFieldsSorted[index];
        }
        return;
    }

    /*
     function to check com.sap.vocabularies.Common.v1.SemanticObject for first data field to show smart link in list card
     */
    function semanticObjectOfFirstDataField(iContext, oEntitySet, aCollection) {
        if (!aCollection || !aCollection.length || aCollection.length === 0) {
            return false;
        }
        aCollection = getDataFieldGeneric(iContext, aCollection, 0);
        return semanticObjectOfDataField(iContext, oEntitySet, aCollection);
    }
    semanticObjectOfFirstDataField.requiresIContext = true;

    /*
     function to check com.sap.vocabularies.Common.v1.SemanticObject for second data field to show smart link in list card
     */
    function semanticObjectOfSecondDataField(iContext, oEntitySet, aCollection) {
        if (!aCollection || !aCollection.length || aCollection.length === 0) {
            return false;
        }
        aCollection = getDataFieldGeneric(iContext, aCollection, 1);
        return semanticObjectOfDataField(iContext, oEntitySet, aCollection);
    }
    semanticObjectOfSecondDataField.requiresIContext = true;

    /*
     Generic function to check com.sap.vocabularies.Communication.v1.Contact record type from lineitem with index
     */

    function getContactAnnotation(iContext, aCollection, index) {
        var bODataV4 = isODataV4Context(iContext);
        var sRecordType, sAnnotationPath, oTarget;
        var aContactFields = aCollection.filter(function (oItem) {
            sRecordType = bODataV4 ? oItem.$Type : oItem.RecordType;
            oTarget = oItem && oItem.Target || {};
            sAnnotationPath = bODataV4 ? oTarget.$AnnotationPath : oTarget.AnnotationPath || "";
            return sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
                sAnnotationPath.indexOf("@com.sap.vocabularies.Communication.v1.Contact") !== -1;
        });
        var aContactFieldsSorted = sortCollectionByImportance(aContactFields, iContext);
        if (aContactFieldsSorted) {
            return aContactFieldsSorted[index];
        }
        return;
    }

    /*
     check if first contact annotation is available or not in lineitem
     */
    function isFirstContactAnnotation(iContext, aCollection) {
        if (!aCollection || !aCollection.length || aCollection.length === 0) {
            return false;
        }
        var oFirstContactAnnotation = getContactAnnotation(iContext, aCollection, 0);
        if (oFirstContactAnnotation) {
            return true;
        }
        return false;
    }
    isFirstContactAnnotation.requiresIContext = true;

    /**************************** Formatters & Helpers for KPI-Header logic  ****************************/

    /* Returns binding path for singleton */
    function getAggregateNumber(iContext, oEntitySet, oDataPoint, oSelectionVariant) {
        var measure, dataPointDescription, dataPointTitle;
        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
            measure = oDataPoint.Value.Path;
        } else if (
            oDataPoint &&
            oDataPoint.Description &&
            oDataPoint.Description.Value &&
            oDataPoint.Description.Value.Path
        ) {
            measure = oDataPoint.Description.Value.Path;
        }
        if (oDataPoint && oDataPoint.Description && oDataPoint.Description.Path) {
            dataPointDescription = oDataPoint.Description.Path;
        } else if (oDataPoint && oDataPoint.Title && oDataPoint.Title.Path) {
            dataPointTitle = oDataPoint.Title.Path;
        }
        var ret = "";
        var bParams = oSelectionVariant && oSelectionVariant.Parameters;
        var filtersString = "";

        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters");

        bParams = bParams || !!aParameters;

        if (bParams) {
            var dataModel = iContext.getSetting("dataModel");
            var path = MetadataAnalyser.resolveParameterizedEntitySet(dataModel, oEntitySet, oSelectionVariant, aParameters);
            ret += "{path: '" + path + "'";
        } else {
            ret += "{path: '/" + oEntitySet.name + "'";
        }

        ret += ", length: 1";
        var oOvpCardSettings = iContext.getSetting("ovpCardProperties");
        var oEntityType = oOvpCardSettings.getProperty("/entityType");
        var unitColumn = CommonUtils.getUnitColumn(measure, oEntityType);
        var aFilters = Filterhelper.getFilters(oOvpCardSettings, oSelectionVariant);

        if (aFilters.length > 0) {
            aFilters = Filterhelper.createExcludeFilters(aFilters, oOvpCardSettings);
            filtersString += ", filters: " + JSON.stringify(aFilters);
        }

        var selectArr = [];
        selectArr.push(measure);
        if (dataPointDescription) {
            selectArr.push(dataPointDescription);
        } else if (dataPointTitle) {
            selectArr.push(dataPointTitle);
        }
        if (oDataPoint && oDataPoint.Criticality && oDataPoint.Criticality.Path) {
            selectArr.push(oDataPoint.Criticality.Path);
        }
        // if DeviationRangeLowValue and ToleranceRangeLowValue read from Path instead of string
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.DeviationRangeLowValue &&
            oDataPoint.CriticalityCalculation.DeviationRangeLowValue.Path
        ) {
            selectArr.push(oDataPoint.CriticalityCalculation.DeviationRangeLowValue.Path);
        }
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.ToleranceRangeLowValue &&
            oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.Path
        ) {
            selectArr.push(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.Path);
        }

        // if DeviationRangeHighValue and ToleranceRangeHighValue read from Path instead of string
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.DeviationRangeHighValue &&
            oDataPoint.CriticalityCalculation.DeviationRangeHighValue.Path
        ) {
            selectArr.push(oDataPoint.CriticalityCalculation.DeviationRangeHighValue.Path);
        }
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.ToleranceRangeHighValue &&
            oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.Path
        ) {
            selectArr.push(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.Path);
        }

        if (unitColumn) {
            selectArr.push(unitColumn);
        }
        if (
            oDataPoint &&
            oDataPoint.TrendCalculation &&
            oDataPoint.TrendCalculation.ReferenceValue &&
            oDataPoint.TrendCalculation.ReferenceValue.Path
        ) {
            selectArr.push(oDataPoint.TrendCalculation.ReferenceValue.Path);
        }

        var bCheckFilterPreference = checkFilterPreference(ovpCardProperties);
        var sCustomParameter = bCheckFilterPreference
            ? ", custom: {cardId: '" + ovpCardProperties.getProperty("/cardId") + "', _requestFrom: 'ovp_internal'}"
            : ", custom: {_requestFrom: 'ovp_internal'}";

        var sSearchQuery = ovpCardProperties.getProperty("/searchQuery");
        var bOvpCardsAsApi = ovpCardProperties.getProperty("/enableOVPCardAsAPI");

        if (sSearchQuery && bOvpCardsAsApi) {
            if (sCustomParameter === "") {
                sCustomParameter = ", custom: {search: '" + sSearchQuery + "'}";
            } else {
                sCustomParameter = sCustomParameter.slice(0, 11) + "search: '" + sSearchQuery + "', " + sCustomParameter.slice(11);
            } 
        } 
        return (
            ret +
            ", parameters:{select:'" +
            selectArr.join(",") +
            "'" +
            sCustomParameter +
            "}" +
            filtersString +
            "}"
        );
    }
    getAggregateNumber.requiresIContext = true;

    /* Creates binding path for NumericContent value */
    function formThePathForAggregateNumber(iContext, dataPoint) {
        if (!dataPoint || !dataPoint.Value) {
            return "";
        }

        var bODataV4 = isODataV4Context(iContext);
        var sDataPointPath = bODataV4 ? dataPoint.Value.$Path : dataPoint.Value.Path;

        if (!sDataPointPath) {
            return "";
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityTypeProperty = bODataV4 ?
            getEntityTypeForODataV4Model(oMetaModel, oEntityType, sDataPointPath) :
            oMetaModel.getODataProperty(oEntityType, sDataPointPath);
        var numberOfFractionalDigits = dataPoint && dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits;
        var iValue = numberOfFractionalDigits && numberOfFractionalDigits.Int;

        if (oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
            var oUnit = oEntityTypeProperty[ANNOTATIONTYPE.UOM];
            if (oUnit.String == "%") {
                oModel.oData.percentageAvailable = true;
            }
        }
        if (numberOfFractionalDigits && bODataV4) {
            oModel.oData.NumberOfFractionalDigits = numberOfFractionalDigits;
        } else if (!bODataV4 && iValue) {
            oModel.oData.NumberOfFractionalDigits = iValue;
        }
        var oStaticValues = {
            NumberOfFractionalDigits: oModel.oData.NumberOfFractionalDigits || 0,
            percentageAvailable: oModel.oData.percentageAvailable || false
        };
        var sFunctionName = "sap.ovp.cards.AnnotationHelper.KpiValueFormatter";
        var sPath = bODataV4 ? sDataPointPath + "Agg" : sDataPointPath;
        var aParts = [sPath];
        return generatePathForField(aParts, sFunctionName, oStaticValues, bODataV4);
    }
    formThePathForAggregateNumber.requiresIContext = true;

    function KpiValueFormatter() {
        var oStaticValue = arguments[arguments.length - 1],
            kpiValue = arguments[0];
        var numberFormat = NumberFormat.getFloatInstance({
            minFractionDigits: oStaticValue.NumberOfFractionalDigits,
            maxFractionDigits: oStaticValue.NumberOfFractionalDigits,
            style: "short",
            showScale: true,
            shortRefNumber: kpiValue
        });
        if (oStaticValue.percentageAvailable) {
            return numberFormat.format(Number(kpiValue)) + " %";
        } else {
            return numberFormat.format(Number(kpiValue));
        }
    }

    /* Creates binding path for trend icon */
    function formThePathForTrendIcon(iContext, oDataPoint) {
        if (!oDataPoint || !oDataPoint.Value ||
            (!oDataPoint.Value.Path && !oDataPoint.Value.$Path) ||
            !oDataPoint.TrendCalculation) {
            return "";
        }
        var bODataV4 = isODataV4Context(iContext);
        var value = getPathOrPrimitiveValue(oDataPoint.Value, bODataV4, bODataV4/*bKPIHeader*/);
        var referenceValue = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.ReferenceValue, bODataV4, bODataV4/*bKPIHeader*/);
        var downDifference = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.DownDifference, bODataV4, bODataV4/*bKPIHeader*/);
        var upDifference = getPathOrPrimitiveValue(oDataPoint.TrendCalculation.UpDifference, bODataV4, bODataV4/*bKPIHeader*/);

        var bIsRefValBinding = isBindingValue(referenceValue);
        var bIsDownDiffBinding = isBindingValue(downDifference);
        var bIsUpDiffBinding = isBindingValue(upDifference);
        var oStaticValue = {
            referenceValue: referenceValue,
            downDifference: downDifference,
            upDifference: upDifference,
            bIsRefValBinding: bIsRefValBinding,
            bIsDownDiffBinding: bIsDownDiffBinding,
            bIsUpDiffBinding: bIsUpDiffBinding,
            bODataV4: bODataV4
        };

        var sStaticValue = "{value:" + JSON.stringify(oStaticValue) + ", model: 'ovpCardProperties'}";
        var sParts = "parts: [" + value;
        sParts += bIsRefValBinding ? "," + referenceValue : "";
        sParts += bIsDownDiffBinding ? "," + downDifference : "";
        sParts += bIsUpDiffBinding ? "," + upDifference : "";
        sParts += "," + sStaticValue;
        sParts += "]";
        var sFunctionName = "sap.ovp.cards.AnnotationHelper.formatTrendIcon";
        return "{" + sParts + ", formatter: '" + sFunctionName + "'}";
    }
    formThePathForTrendIcon.requiresIContext = true;

    function formatTrendIcon() {
        var oStaticValues = arguments[arguments.length - 1];
        var index = 1;
        return calculateTrendDirection(
            arguments[0],
            oStaticValues.bIsRefValBinding ? arguments[index++] : oStaticValues.referenceValue,
            oStaticValues.bIsDownDiffBinding ? arguments[index++] : oStaticValues.downDifference,
            oStaticValues.bIsUpDiffBinding ? arguments[index++] : oStaticValues.upDifference,
            oStaticValues.bODataV4
        );
    }

    /* Creates binding path for % change */
    function formPathForPercentageChange(iContext, dataPoint) {
        if (!dataPoint || !dataPoint.TrendCalculation || !dataPoint.TrendCalculation.ReferenceValue) {
            return "";
        }

        var bODataV4 = isODataV4Context(iContext);
        var oModel = iContext.getSetting("ovpCardProperties");
        var iNumberOfFractionalDigits = dataPoint && dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits;

        if (bODataV4 && iNumberOfFractionalDigits) {
            oModel.oData.NumberOfFractionalDigits = iNumberOfFractionalDigits;
        } else if (!bODataV4 && iNumberOfFractionalDigits && iNumberOfFractionalDigits.Int) {
            oModel.oData.NumberOfFractionalDigits = iNumberOfFractionalDigits.Int;
        }

        if (dataPoint.TrendCalculation.ReferenceValue.Path && !bODataV4) {
            return (
                "{parts: [{path:'" +
                dataPoint.Value.Path +
                "'}, {path:'" +
                dataPoint.TrendCalculation.ReferenceValue.Path +
                "'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}"
            );
        }
        if (dataPoint.TrendCalculation.ReferenceValue.$Path && bODataV4) {
            return (
                "{parts: [{path:'" +
                dataPoint.Value.$Path +
                "Agg', type:'sap.ui.model.odata.type.Decimal'}, {path:'" +
                dataPoint.TrendCalculation.ReferenceValue.$Path +
                "'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}"
            );
        }

        if (bODataV4) {
            return (
                "{parts: [{path:'" +
                dataPoint.Value.$Path +
                "Agg', type:'sap.ui.model.odata.type.Decimal'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}"
            );
        } else {
            return (
                "{parts: [{path:'" +
                dataPoint.Value.Path +
                "'}], formatter: 'sap.ovp.cards.AnnotationHelper.returnPercentageChange'}"
            );
        }
    }
    formPathForPercentageChange.requiresIContext = true;

    /**
     *  function to format target value as per scalefactor, NumberOfFractionalDigits, with or without %
     *
     *  @method {private} TargetValueFormatter
     *  @param {number} iKpiValue - kpi value
     *  @param {number} iTargetValue - target/reference value
     *  @return {number} formatted target value
     *
     */
    function TargetValueFormatter(iKpiValue, iTargetValue) {
        var iValue,
            oOvpCardProperties,
            iFractionalDigits,
            iScaleFactor,
            bPercentageFlagForTarget = false;

        if (typeof iKpiValue == "string") {
            iKpiValue = NumberFormat.getIntegerInstance().parse(iKpiValue);
        }
        if (isNaN(+iKpiValue)) {
            return "";
        }

        iScaleFactor = iKpiValue == 0 ? iTargetValue : iKpiValue;
        oOvpCardProperties = this.getModel("ovpCardProperties");
        if (oOvpCardProperties.getProperty("/iNumberOfFractionalDigits")) {
            iFractionalDigits = +oOvpCardProperties.getProperty("/iNumberOfFractionalDigits");
        }
        if (oOvpCardProperties.getProperty("/bPercentageAvailableForTarget")) {
            bPercentageFlagForTarget = true;
        }
        if (iTargetValue) {
            iValue = iTargetValue;
        } else {
            if (oOvpCardProperties.getProperty("/sManifestTargetValue")) {
                iValue = oOvpCardProperties.getProperty("/sManifestTargetValue");
            }
        }

        if (!iFractionalDigits || iFractionalDigits < 0) {
            iFractionalDigits = 0;
        } else if (iFractionalDigits > 2) {
            iFractionalDigits = 2;
        }

        if (iValue) {
            var fnNumberFormat = NumberFormat.getFloatInstance({
                minFractionDigits: iFractionalDigits,
                maxFractionDigits: iFractionalDigits,
                style: "short",
                showScale: true,
                shortRefNumber: iScaleFactor
            });
            if (bPercentageFlagForTarget) {
                return fnNumberFormat.format(+iValue) + " %";
            } else {
                return fnNumberFormat.format(+iValue);
            }
        }
    }

    /**
     *  function to return binding path for target value
     *
     *  @method {private} formPathForTargetValue
     *  @param {object} oDataPointAnnotation - data point annotation
     *  @return {string} returns TargetValueFormatter with binding paths
     *
     */

    function formPathForTargetValue(iContext, oDataPointAnnotation) {
        if (
            !oDataPointAnnotation ||
            !oDataPointAnnotation.TrendCalculation ||
            !oDataPointAnnotation.TrendCalculation.ReferenceValue
        ) {
            return "";
        }
        if (!oDataPointAnnotation || !oDataPointAnnotation.Value ||
            (!oDataPointAnnotation.Value.Path && !oDataPointAnnotation.Value.$Path)) {
            return "";
        }
        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var bODataV4 = isODataV4Context(iContext);
        var NumberOfFractionalDigits = oDataPointAnnotation &&
            oDataPointAnnotation.ValueFormat &&
            oDataPointAnnotation.ValueFormat.NumberOfFractionalDigits;
        var iValue = NumberOfFractionalDigits && NumberOfFractionalDigits.Int;

        if (iValue && !bODataV4) {
            oModel.setProperty("/iNumberOfFractionalDigits", iValue);
        } else if (bODataV4 && NumberOfFractionalDigits) {
            oModel.setProperty("/iNumberOfFractionalDigits", NumberOfFractionalDigits);
        }
        if (oDataPointAnnotation.TrendCalculation.ReferenceValue && !bODataV4) {
            if (oDataPointAnnotation.TrendCalculation.ReferenceValue.String) {
                oModel.setProperty(
                    "/sManifestTargetValue",
                    oDataPointAnnotation.TrendCalculation.ReferenceValue.String
                );
                return (
                    "{parts: [{path:'" +
                    oDataPointAnnotation.Value.Path +
                    "'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}"
                );
            }
            if (oDataPointAnnotation.TrendCalculation.ReferenceValue.Path) {
                var oEntityTypeProperty = oMetaModel.getODataProperty(
                    oEntityType,
                    oDataPointAnnotation.TrendCalculation.ReferenceValue.Path
                );
                if (oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
                    var oUnit = oEntityTypeProperty[ANNOTATIONTYPE.UOM];
                    if (oUnit.String == "%") {
                        oModel.setProperty("/bPercentageAvailableForTarget", true);
                    }
                }
                return (
                    "{parts: [{path:'" +
                    oDataPointAnnotation.Value.Path +
                    "'},{path:'" +
                    oDataPointAnnotation.TrendCalculation.ReferenceValue.Path +
                    "'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}"
                );
            }
        } else if (bODataV4 && oDataPointAnnotation.TrendCalculation.ReferenceValue) {
            if (oDataPointAnnotation.TrendCalculation.ReferenceValue.$Path) {
                var oEntityTypeProperty = getEntityTypeForODataV4Model(
                    oMetaModel,
                    oEntityType,
                    oDataPointAnnotation.TrendCalculation.ReferenceValue.$Path
                );
                if (oEntityTypeProperty[ANNOTATIONTYPE.UOM]) {
                    var oUnit = oEntityTypeProperty[ANNOTATIONTYPE.UOM];
                    if (oUnit.String == "%") {
                        oModel.setProperty("/bPercentageAvailableForTarget", true);
                    }
                }
                return (
                    "{parts: [{path:'" +
                    oDataPointAnnotation.Value.$Path +
                    "Agg', type:'sap.ui.model.odata.type.Decimal'},{path:'" +
                    oDataPointAnnotation.TrendCalculation.ReferenceValue.$Path +
                    "Agg', type:'sap.ui.model.odata.type.Decimal'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}"
                );
            }
            if (oDataPointAnnotation.TrendCalculation.ReferenceValue) {
                oModel.setProperty("/sManifestTargetValue", oDataPointAnnotation.TrendCalculation.ReferenceValue);
                return (
                    "{parts: [{path:'" +
                    oDataPointAnnotation.Value.$Path +
                    "Agg', type:'sap.ui.model.odata.type.Decimal'}], formatter: 'sap.ovp.cards.AnnotationHelper.TargetValueFormatter'}"
                );
            }
        }
    }
    formPathForTargetValue.requiresIContext = true;

    /**
     *  function to calculate Percentage change/deviation
     *
     *  @method {private} returnPercentageChange
     *  @param {number} iKpiValue - kpi value
     *  @param {number} iTargetValue - target/reference value
     *  @return {number} formatted deviation value
     *
     */
    function returnPercentageChange(iKpiValue, iTargetValue) {
        var iFractionalDigits, iReferenceValue, oOvpCardProperties;
        if (typeof iKpiValue == "string") {
            iKpiValue = NumberFormat.getIntegerInstance().parse(iKpiValue);
        }

        if (isNaN(+iKpiValue)) {
            return "";
        }
        iKpiValue = +iKpiValue;
        oOvpCardProperties = this.getModel("ovpCardProperties");
        if (oOvpCardProperties.getProperty("/iNumberOfFractionalDigits")) {
            iFractionalDigits = +oOvpCardProperties.getProperty("/iNumberOfFractionalDigits");
        }
        if (iTargetValue) {
            iReferenceValue = +iTargetValue;
        } else {
            if (oOvpCardProperties.getProperty("/sManifestTargetValue")) {
                iReferenceValue = +oOvpCardProperties.getProperty("/sManifestTargetValue");
            }
        }

        if (!iFractionalDigits || iFractionalDigits < 0) {
            iFractionalDigits = 0;
        } else if (iFractionalDigits > 2) {
            iFractionalDigits = 2;
        }

        if (iReferenceValue) {
            var iPercentNumber = (iKpiValue - iReferenceValue) / iReferenceValue;
            var fnPercentFormatter = NumberFormat.getPercentInstance({
                style: "short",
                minFractionDigits: iFractionalDigits,
                maxFractionDigits: iFractionalDigits,
                showScale: true
            });
            return fnPercentFormatter.format(iPercentNumber);
        }
    }

    function isPresentationVarientPresent(iContext, oPresentationVariant) {
        var bODataV4 = isODataV4Context(iContext);

        if (oPresentationVariant &&
            oPresentationVariant.GroupBy &&
            !isEmptyObject(oPresentationVariant.GroupBy)) {
            return bODataV4 ?
                oPresentationVariant.GroupBy[0].hasOwnProperty("$PropertyPath") :
                oPresentationVariant.GroupBy[0].hasOwnProperty("PropertyPath");
        }
        return false;
    }
    isPresentationVarientPresent.requiresIContext = true;

    function getLabelFromKey(aItems, sKey) {
        var oItem;
        for (var i = 0; aItems && i < aItems.length; i++) {
            if (aItems[i].value == sKey) {
                oItem = aItems[i];
                break;
            }
        }
        return oItem ? oItem.name : null;
    }

    function getAnnotationLabel(aItems, sKey) {
        return getLabelFromKey(aItems, sKey);
    }

    function getApplicationName(aItems, sKey) {
        var sLabel = getLabelFromKey(aItems, sKey);
        return sLabel ? sLabel : OvpResources.getText("OVP_KEYUSER_LABEL_NO_NAVIGATION");
    }

    /*
     * Reads groupBy from annotation and prepares comma separated list
     */
    function listGroupBy(iContext, oPresentationVariant) {
        var result = "";
        var bPV = oPresentationVariant && oPresentationVariant.GroupBy;
        if (!bPV) {
            return result;
        }
        var bODataV4 = isODataV4Context(iContext);

        var metaModel = iContext.getSetting("ovpCardProperties").getProperty("/metaModel");
        var oEntityType = iContext.getSetting("ovpCardProperties").getProperty("/entityType");
        var groupByList;

        if (oPresentationVariant.GroupBy.constructor === Array) {
            groupByList = oPresentationVariant.GroupBy;
        } else if (!oPresentationVariant.GroupBy.Collection) {
            return result;
        } else {
            groupByList = oPresentationVariant.GroupBy.Collection;
        }

        var propVal;
        var sPropertyPath;
        each(groupByList, function () {
            sPropertyPath = bODataV4 ? this.$PropertyPath : this.PropertyPath;
            propVal = getLabelForEntityProperty(metaModel, oEntityType, sPropertyPath, iContext);
            if (!propVal) {
                return;
            }

            result += propVal;
            result += ", ";
        });
        if (result[result.length - 1] === " " && result[result.length - 2] === ",") {
            result = result.substring(0, result.length - 2);
        }
        return result == "" ? "" : OvpResources.getText("By", [result]);
    }
    listGroupBy.requiresIContext = true;

    /*
     * returns the string for the filter-by values of the KPI Header
     * */
    function formTheFilterByString(iContext, oSelectionVariant, aAllSelVar) {
        var bAppend = true;
        var bODataV4 = isODataV4Context(iContext);
        var lastFilterIndex = aAllSelVar["SelectOptions"].length - 1;
        if (
            oSelectionVariant.PropertyName.PropertyPath ===
            aAllSelVar["SelectOptions"][lastFilterIndex].PropertyName.PropertyPath
        ) {
            bAppend = false;
        }

        oSelectionVariant = [oSelectionVariant];
        var oCardPropsModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oCardPropsModel.getProperty("/entityType");
        var oMetaModel = oCardPropsModel.getProperty("/metaModel");
        var aFilters = Filterhelper.getFilters(oCardPropsModel, oSelectionVariant, bODataV4);

        if (aFilters.length == 0) {
            return "";
        }
        aFilters = Filterhelper.createExcludeFilters(aFilters, oCardPropsModel);
        var sProp;
        var sTextPropKey;

        //Clean from Filter array all the filters with sap-text that the filter array contains there sap-text
        sProp = aFilters[0].path;
        sTextPropKey = getTextPropertyForEntityProperty(oMetaModel, oEntityType, sProp, iContext);

        //Check if there is sap-text, in case there is checks that the Filter array contains it
        if (sTextPropKey !== sProp) {
            return "";
        }

        // check the datatype of filter
        var propertyType = oMetaModel.getODataProperty(oEntityType, oSelectionVariant[0].PropertyName.PropertyPath)[
            "type"
        ];
        // build the filter string
        var sFilter = generateStringForFilters(aFilters, propertyType);
        if (bAppend === true) {
            return sFilter + ", ";
        }
        return sFilter;
    }
    formTheFilterByString.requiresIContext = true;

    function formTheFilterByStringNotFromSelVar(iContext, oFilter, aFilters) {
        var bAppend = !(oFilter.index === aFilters.length - 1);
        var oCardPropsModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oCardPropsModel.getProperty("/metaModel");
        var oEntityType = oCardPropsModel.getProperty("/entityType");
        var propertyType = oMetaModel.getODataProperty(oEntityType, aFilters[oFilter.index].path)["type"];
        // build the filter string
        var sFilter = generateStringForFilters([aFilters[oFilter.index]], propertyType);
        if (bAppend === true) {
            return sFilter + ", ";
        }
        return sFilter;
    }
    formTheFilterByStringNotFromSelVar.requiresIContext = true;

    function formTheIdForFilter(oSelectionVariant) {
        return oSelectionVariant.id;
    }

    function formTheIdForFilterNotFromSelVar(oFilter) {
        return oFilter.id;
    }

    /************************ METADATA PARSERS ************************/

    function generateStringForFilters(aFilters, propertyType) {
        var aFormatterFilters = [];

        for (var i = 0; i < aFilters.length; i++) {
            aFormatterFilters.push(generateSingleFilter(aFilters[i], propertyType));
        }

        return aFormatterFilters.join(", ");
    }

    function generateSingleFilter(oFilter, propertyType) {
        var bNotOperator = false;
        var sFormattedFilter,
            dateFormatInstance = DateFormat.getInstance({ style: "medium" });

        if (propertyType === "Edm.DateTime") {
            sFormattedFilter = dateFormatInstance.format(new Date(oFilter.value1));
        } else if (propertyType === "Edm.DateTimeOffset") {
            sFormattedFilter = dateFormatInstance.format(new Date(oFilter.value1), true);
        } else {
            sFormattedFilter = oFilter.value1;
        }
        if (oFilter.operator[0] === "N") {
            bNotOperator = true;
        }

        if (oFilter.value2) {
            if (propertyType === "Edm.DateTime") {
                sFormattedFilter += " - " + dateFormatInstance.format(new Date(oFilter.value1));
            } else if (propertyType === "Edm.DateTimeOffset") {
                sFormattedFilter += " - " + dateFormatInstance.format(new Date(oFilter.value1), true);
            } else {
                sFormattedFilter += " - " + oFilter.value1;
            }
        }

        if (bNotOperator) {
            sFormattedFilter = OvpResources.getText("kpiHeader_Filter_NotOperator", [sFormattedFilter]);
        }
        return sFormattedFilter;
    }

    /* Returns column name that contains the unit for the measure */
    // function getUnitColumn(measure, oEntityType) {
    // 	var tempUnit, properties = oEntityType.property;
    // 	for (var i = 0, len = properties.length; i < len; i++) {
    // 		if (properties[i].name == measure) {
    //               if (properties[i].hasOwnProperty("Org.OData.Measures.V1.ISOCurrency")) { //as part of supporting V4 annotation
    //                   return properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path ? properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path : properties[i]["Org.OData.Measures.V1.ISOCurrency"].String;
    //               } else if (properties[i].hasOwnProperty("Org.OData.Measures.V1.Unit")) {
    //                   tempUnit = properties[i]["Org.OData.Measures.V1.Unit"].Path ? properties[i]["Org.OData.Measures.V1.Unit"].Path : properties[i]["Org.OData.Measures.V1.Unit"].String;
    //                   if (tempUnit && tempUnit != "%") {
    //                       return tempUnit;
    //                   } else {
    //                       return null;
    //                   }
    //               } else if (properties[i].hasOwnProperty("sap:unit")) {
    //                   return properties[i]["sap:unit"];
    //               }
    // 			break;
    // 		}
    // 	}
    // 	return null;
    // }

    function getLabelForEntityProperty(oMetadata, oEntityType, sPropertyName, iContext) {
        return getAttributeValueForEntityProperty(
            oMetadata,
            oEntityType,
            sPropertyName,
            "com.sap.vocabularies.Common.v1.Label",
            iContext
        );
    }

    function getTextPropertyForEntityProperty(oMetaModel, oEntityType, sPropertyName, iContext) {
        return getAttributeValueForEntityProperty(oMetaModel, oEntityType, sPropertyName, "sap:text", iContext);
    }

    function getAttributeValueForEntityProperty(oMetaModel, oEntityType, sPropertyName, sAttributeName, iContext) {
        var bODataV4 = isODataV4Context(iContext);
        var oProp;
        if (bODataV4) {
            oProp = {};
            oProp[sPropertyName] = getEntityTypeForODataV4Model(oMetaModel, oEntityType, sPropertyName);
        } else {
            oProp = oMetaModel.getODataProperty(oEntityType, sPropertyName);
        }

        if (!oProp) {
            oLogger.error(
                "No Property Found for with Name '" + sPropertyName + " For Entity-Type '" + oEntityType.name + "'"
            );
            return;
        }

        if (bODataV4) {
            if (oProp[sPropertyName].annotations) {
                var oPropAttVal = oProp[sPropertyName].annotations["@" + sAttributeName];
            }
            if (oPropAttVal) {
                return oPropAttVal;
            }

            return Object.keys(oProp)[0];
        } else {
            var oPropAttVal = oProp[sAttributeName];
            if (oPropAttVal) {
                if (sAttributeName === "com.sap.vocabularies.Common.v1.Label") {
                    return oPropAttVal.String;
                }
                return oPropAttVal;
            }

            return oProp.name;
        }
    }

    function getEntityTypeForODataV4Model(oMetaModel, oEntityType, sProperty) {
        var oEntitySetAnnotations = oMetaModel.getData().$Annotations[oEntityType.$Type + "/" + sProperty];
        var sEntitySetName = V4MetadataAnalyzer.getEntitySetName(oMetaModel, oEntityType.$Type);
        var oEntitySetProperties = oMetaModel.getObject("/" + sEntitySetName + "/" + sProperty);
        var entityType = OVPUtils.merge(true, {}, oEntitySetAnnotations, oEntitySetProperties);
        return entityType;
    }

    // Get Aggregation number for aria-label in the KPI cards
    function getKPIHeaderAggregateNumber(iContext, dataPoint) {
        var bODataV4 = isODataV4Context(iContext);
        var oModel = iContext.getSetting("ovpCardProperties");
        if (!dataPoint || !dataPoint.Value || (!dataPoint.Value.Path && !dataPoint.Value.$Path)) {
            return "";
        }
        var oStaticValues = {
            NumberOfFractionalDigits: oModel.oData.NumberOfFractionalDigits || 0,
            percentageAvailable: oModel.oData.percentageAvailable || false
        };
        var sFunctionName = "sap.ovp.cards.AnnotationHelper.KpiValueFormatter";
        var sPath = bODataV4 ? dataPoint.Value.$Path + "Agg" : dataPoint.Value.Path;
        var aParts = [sPath];
        return generatePathForField(aParts, sFunctionName, oStaticValues);
    }
    getKPIHeaderAggregateNumber.requiresIContext = true;

    /**
     * This function returns if the controlConfiguration properties are Date or not
     * @param {string} sSelectionFieldName
     * @param {object} oDateSettings
     * @returns {boolean}
     */
    function isDateRangeType(sSelectionFieldName, oDateSettings) {
        return oDateSettings &&
            oDateSettings.hasOwnProperty(sSelectionFieldName);
    }

    /**
     * This function returns the conditionType for Daterange type controlConfiguration
     * @param {string} sSelectionFieldName
     * @param {object} oDateSettings
     * @returns {string}
     */
    function getConditionTypeForDateProperties(sSelectionFieldName, oDateSettings) {
        var oConditionType;
        if (oDateSettings[sSelectionFieldName].customDateRangeImplementation) {
            return oDateSettings[sSelectionFieldName].customDateRangeImplementation;
        } else if (oDateSettings[sSelectionFieldName].filter) {
            oConditionType = {
                module: "sap.ui.comp.config.condition.DateRangeType",
                operations: {
                    filter: oDateSettings[sSelectionFieldName].filter
                }
            };
            return JSON.stringify(oConditionType);
        } else if (oDateSettings[sSelectionFieldName].selectedValues) {
            oConditionType = {
                module: "sap.ui.comp.config.condition.DateRangeType",
                operations: {
                    filter: [
                        {
                            path: "key",
                            contains: oDateSettings[sSelectionFieldName].selectedValues,
                            exclude: oDateSettings[sSelectionFieldName].exclude
                        }
                    ]
                }
            };
            return JSON.stringify(oConditionType);
        } else if (oDateSettings[sSelectionFieldName].defaultValue) {
            oConditionType = {
                module: "sap.ui.comp.config.condition.DateRangeType"
            };
            return JSON.stringify(oConditionType);
        }
    }

    /**
     * This function returns the groupID based on whether properties are part of SelectionField
     * @param {string} sSelectionFieldName
     * @param {object} oDateSettings
     * @returns {string}
     */
    function getGroupID(bNotPartOfSelectionField) {
        if (bNotPartOfSelectionField) {
            return undefined;
        }
        return "_BASIC";
    }

    /**
     * This function returns the formatted data for fiscal annotations
     * @param {string} sFiscalData
     * @param {string} sAnnotationType
     * @returns {string}
     */
    function getFormattedFiscalData(sFiscalData, sAnnotationType) {
        if (sAnnotationType === 'com.sap.vocabularies.Common.v1.IsFiscalYearPeriod') {
            var sYear = sFiscalData.substring(0, 4);
            var sPeriod = sFiscalData.substring(4);
            while (sPeriod.length < 3) {
                sPeriod = '0' + sPeriod;
            }
            var oFormat = FiscalDate.FiscalDateFormatter["IsFiscalYearPeriod"];
            var oFormatOptions = {
                UTC: false,
                style: "medium"
            };
            var oFormatter = FiscalFormat.getDateInstance(Object.assign({ format: oFormat, calendarType: coreLibrary.CalendarType.Gregorian }, oFormatOptions));
            var sPattern = oFormatter.getPattern();
            if (sPattern === 'PPP/YYYY') {
                return sPeriod + '/' + sYear;
            } else if (sPattern === 'PPP.YYYY') {
                return sPeriod + '.' + sYear;
            } else {
                return sPeriod + sYear;
            }
        } else {
            return sFiscalData;
        }
    }

    /*
     * Check if annotations exist vis-a-vis manifest
     * @param {String} term - Annotation with Qualifier
     * @param {Object} annotation - Annotation Data
     * @param {String} type - Type of Annotation
     * @param {Boolean} [bMandatory=false] - Whether the term is mandatory
     * @param {String} logViewId - Id of the view for log purposes
     * @param {String} contentFragment - To check whether we're dealing with
     * @param {boolean} bODataV4 - The data model is oData V4 or V2.
     * generic analytic card or legacy type.
     * @returns {Boolean}
     */
    function checkExists(term, annotation, type, bMandatory, logViewId, contentFragment, bODataV4) {
        bMandatory = typeof bMandatory === "undefined" ? false : bMandatory;
        var ret = false;
        var annoTerm;
        if (!term && bMandatory) {
            oLogger.error(logViewId + mErrorMessages.CARD_ERROR + type + mErrorMessages.IS_MANDATORY);
            return ret;
        }

        if (!term) {
            /* Optional parameters can be blank */
            oLogger.warning(logViewId + mErrorMessages.CARD_WARNING + type + mErrorMessages.IS_MISSING);
            return true;
        }

        if (bODataV4) {
            term = "@" + term;
        }

        annoTerm = annotation[term];
        if (!annoTerm || typeof annoTerm !== "object") {
            var logger = bMandatory ? oLogger.error : oLogger.warning;
            logger(logViewId + mErrorMessages.CARD_ERROR + "in " + type + ". (" + term + " " + mErrorMessages.NOT_WELL_FORMED);
            return ret;
        }
        /*
         * For new style generic analytical card, make a check chart annotation
         * has chart type.
         */
        var sContentFragmentChart = bODataV4 ? 
            "sap.ovp.cards.v4.charts.analytical.analyticalChart" : 
            "sap.ovp.cards.charts.analytical.analyticalChart";
        
        var bEnumMemberNotExists = bODataV4 ? 
            (!annoTerm.ChartType || !annoTerm.ChartType.$EnumMember) : 
            (!annoTerm.ChartType || !annoTerm.ChartType.EnumMember);
        if (
            contentFragment &&
            contentFragment === sContentFragmentChart &&
            type === "Chart Annotation" &&
            bEnumMemberNotExists
        ) {
            oLogger.error(
                logViewId + mErrorMessages.CARD_ERROR + mErrorMessages.MISSING_CHARTTYPE + mErrorMessages.CHART_ANNO
            );
            return ret;
        }
        return true;
    }

    return {
        getFormattedFiscalData: getFormattedFiscalData,
        getGroupID: getGroupID,
        getConditionTypeForDateProperties: getConditionTypeForDateProperties,
        isDateRangeType: isDateRangeType,
        TextArrangementType: TextArrangementType,
        getLabelForDataItem: getLabelForDataItem,
        setAlignmentForDataPoint: setAlignmentForDataPoint,
        colorPaletteForComparisonMicroChart: colorPaletteForComparisonMicroChart,
        formatField: formatField,
        checkFilterPreference: checkFilterPreference,
        formatItems: formatItems,
        getCardSelections: getCardSelections,
        getCardSorters: getCardSorters,
        getAnnotationLabel: getAnnotationLabel,
        getApplicationName: getApplicationName,
        removeDuplicateDataField: removeDuplicateDataField,
        getDataPointsCount: getDataPointsCount,
        getFirstDataPointValue: getFirstDataPointValue,
        getFirstDataFieldName: getFirstDataFieldName,
        getSecondDataFieldName: getSecondDataFieldName,
        getRequestFields: getRequestAtLeastFields,
        getThirdDataFieldName: getThirdDataFieldName,
        formatDataFieldValueOnIndex: formatDataFieldValueOnIndex,
        formatDataPointValueOnIndex: formatDataPointValueOnIndex,
        formatDataPointOrField: formatDataPointOrField,
        formatsemanticObjectOfDataFieldGeneric: formatsemanticObjectOfDataFieldGeneric,
        getLabelForFirstDataPoint: getLabelForFirstDataPoint,
        formatImageUrl: formatImageUrl,
        formatUnit: formatUnit,
        formatObjectNumber: formatObjectNumber,
        formatFirstDataPointState: formatFirstDataPointState,
        formatFirstDataPointColor: formatFirstDataPointColor,
        formatSecondDataPointState: formatSecondDataPointState,
        formatThirdDataPointState: formatThirdDataPointState,
        formatFirstDataPointStateForSmartField: formatFirstDataPointStateForSmartField,
        formatKPIHeaderState: formatKPIHeaderState,
        isFirstDataPointCriticality: isFirstDataPointCriticality,
        isFirstDataPointCriticalityForTableStatus: isFirstDataPointCriticalityForTableStatus,
        getSortedDataFields: getSortedDataFields,
        getSortedDataPoints: getSortedDataPoints,
        formatDataFieldValueGeneric: formatDataFieldValueGeneric,
        formatDataPointValue: formatDataPointValue,
        formatDataPointStateGeneric: formatDataPointStateGeneric,
        checkCriticalityGeneric: checkCriticalityGeneric,
        checkCriticalityGenericForTableStatus: checkCriticalityGenericForTableStatus,
        formatDataPointStateForSmartFieldGeneric: formatDataPointStateForSmartFieldGeneric,
        hasActions: hasActions,
        isFirstDataPointPercentageUnit: isFirstDataPointPercentageUnit,
        resolveEntityTypePath: resolveEntityTypePath,
        getAssociationObject: getAssociationObject,
        semanticObjectOfFirstDataField: semanticObjectOfFirstDataField,
        semanticObjectOfSecondDataField: semanticObjectOfSecondDataField,
        isFirstContactAnnotation: isFirstContactAnnotation,
        getAggregateNumber: getAggregateNumber,
        KpiValueFormatter: KpiValueFormatter,
        kpiValueCriticality: kpiValueCriticality,
        formThePathForAggregateNumber: formThePathForAggregateNumber,
        formThePathForTrendIcon: formThePathForTrendIcon,
        formPathForPercentageChange: formPathForPercentageChange,
        TargetValueFormatter: TargetValueFormatter,
        formPathForTargetValue: formPathForTargetValue,
        returnPercentageChange: returnPercentageChange,
        isPresentationVarientPresent: isPresentationVarientPresent,
        listGroupBy: listGroupBy,
        formTheFilterByString: formTheFilterByString,
        formTheFilterByStringNotFromSelVar: formTheFilterByStringNotFromSelVar,
        formTheIdForFilter: formTheIdForFilter,
        formTheIdForFilterNotFromSelVar: formTheIdForFilterNotFromSelVar,
        _criticality2state: criticality2state,
        _calculateCriticalityState: calculateCriticalityState,
        _calculateTrendDirection: calculateTrendDirection,
        _getPropertiesFromBindingString: getPropertiesFromBindingString,
        sortCollectionByImportance: sortCollectionByImportance,
        checkNavTargetForContactAnno: checkNavTargetForContactAnno,
        checkForContactAnnotation: checkForContactAnnotation,
        getKPIHeaderAggregateNumber: getKPIHeaderAggregateNumber,
        formatColor: formatColor,
        formatTrendIcon: formatTrendIcon,
        formatNumberCalculation: formatNumberCalculation,
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        getSapTextPathForUOM: getSapTextPathForUOM,
        getPathOrPrimitiveValue: getPathOrPrimitiveValue,
        getSorters: getSorters,
        _getItemsLength: getItemsLength,
        isODataV4Context: isODataV4Context,
        _generatePathForField: generatePathForField,
        _getNavigationSuffix: getNavigationSuffix,
        _getNavigationPrefix: getNavigationPrefix,
        _getEntityTypeForODataV4Model: getEntityTypeForODataV4Model,
        _formatValueFromTarget: formatValueFromTarget,
        checkExists: checkExists
    };
}, /* bExport= */ true);
