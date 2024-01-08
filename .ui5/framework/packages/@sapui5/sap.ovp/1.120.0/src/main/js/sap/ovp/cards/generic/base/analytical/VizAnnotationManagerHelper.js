/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(
    [
        "sap/ovp/cards/AnnotationHelper",
        "sap/ovp/app/OVPLogger",
        "sap/ovp/cards/Constants",
        "sap/ovp/app/resources",
        "sap/ovp/cards/generic/base/analytical/Utils"
    ],
    function (
        CardAnnotationHelper,
        OVPLogger,
        CardConstants,
        OvpResources,
        ChartUtils
    ) {
        "use strict";

        var oLogger = new OVPLogger("OVP.charts.VizAnnotationManagerHelper");
        var mErrorMessages = CardConstants.errorMessages;
        var mAnnotationConstants = CardConstants.Annotations;

        /**
         * Forms path for criticality state calculation of datapoint
         * 
         * @param {object} iContext 
         * @param {object} oDataPoint 
         * @returns {string}
         */
        function formThePathForCriticalityStateCalculation(iContext, oDataPoint) {

            var value = iContext[iContext.measureNames];
            if (
                oDataPoint &&
                oDataPoint.CriticalityCalculation &&
                oDataPoint.CriticalityCalculation.ImprovementDirection
            ) {
                var sImprovementDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;
                var deviationLow = ChartUtils.getPathFormedOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue);
                var deviationHigh = ChartUtils.getPathFormedOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue);
                var toleranceLow = ChartUtils.getPathFormedOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue);
                var toleranceHigh = ChartUtils.getPathFormedOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue);

                return CardAnnotationHelper._calculateCriticalityState(
                    value,
                    sImprovementDirection,
                    deviationLow,
                    deviationHigh,
                    toleranceLow,
                    toleranceHigh,
                    CardConstants.Criticality.StateValues
                );
            } else {
                //If there's no criticality calculation in the datapoint annotation, we check for criticality
                var state = oDataPoint.Criticality.EnumMember;
                var criticalTypeArr = state ? state.split("/") : [];
                if (criticalTypeArr) {
                    return criticalTypeArr[1]; //returns positive, negative, critical or none
                }
            }
        }

        /**
         * Checks if the string ends with given suffix or not.
         * @param {string} sString 
         * @param {string} sSuffix 
         * @returns {boolean}
         */
        function endsWith(sString, sSuffix) {
            return sString &&
                sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
        }

        /**
         * 
         * @param {object} oDatapoint
         * @param {boolean} oResult
         */
        function UpdateFlagValueForDataPoint(oDatapoint, oResult) {
            if (
                oDatapoint &&
                oDatapoint.CriticalityCalculation &&
                oDatapoint.CriticalityCalculation.ImprovementDirection &&
                oDatapoint.CriticalityCalculation.ImprovementDirection.EnumMember
            ) {
                var sImproveDirection = oDatapoint.CriticalityCalculation.ImprovementDirection.EnumMember;

                var deviationLow = ChartUtils.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.DeviationRangeLowValue);
                var deviationHigh = ChartUtils.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.DeviationRangeHighValue);
                var toleranceLow = ChartUtils.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.ToleranceRangeLowValue);
                var toleranceHigh = ChartUtils.getPathOrPrimitiveValue(oDatapoint.CriticalityCalculation.ToleranceRangeHighValue);

                if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
                    if (toleranceHigh && deviationHigh) {
                        oResult.boolFlag = true;
                        return false;
                    } else {
                        oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_CRITICALITY);
                    }
                } else if (
                    endsWith(sImproveDirection, "Maximize") ||
                    endsWith(sImproveDirection, "Maximizing")
                ) {
                    if (toleranceLow && deviationLow) {
                        oResult.boolFlag = true;
                        return false;
                    } else {
                        oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_CRITICALITY);
                    }
                } else if (endsWith(sImproveDirection, "Target")) {
                    if (toleranceLow && deviationLow && toleranceHigh && deviationHigh) {
                        oResult.boolFlag = true;
                        return false;
                    } else {
                        oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_CRITICALITY);
                    }
                }
            } else if (oDatapoint && oDatapoint.Criticality) {
                oResult.boolFlag = true;
                return false;
            } else {
                oLogger.warning(mErrorMessages.CARD_WARNING + mErrorMessages.INVALID_IMPROVEMENT_DIR);
            }
        }

   /**
    * 
    * Check if the feed has a com.sap.vocabularies.Common.v1.Label associated with it, and obtain the appropriate value from ResourceBundle if present
    * 
    * @param {string} feedName 
    * @param {object} vizFrame 
    * @param {object} oMetadata 
    * @returns {string}
    */
    function getLabelFromAnnotationPath(feedName, vizFrame, oMetadata) {
        var sResourceModelName;
        var sPropertyName;
        var aTemp;
        if (feedName && feedName.indexOf("{") === 0) {
            feedName = feedName.slice(1, -1);
            if (feedName.indexOf(">") != -1) {
                aTemp = feedName.split(">");
                sResourceModelName = aTemp[0];
                sPropertyName = aTemp[1];
            } else if (feedName.indexOf("&gt;") != -1) {
                aTemp = feedName.split("&gt;");
                sResourceModelName = aTemp[0];
                sPropertyName = aTemp[1];
            }
            // get ovp card properties
            try {
                feedName = vizFrame.getModel(sResourceModelName).getProperty(sPropertyName);
            } catch (err) {
                feedName = oMetadata[feedName][mAnnotationConstants.LABEL_KEY_V4].String;
                oLogger.error("Unable to read labels from resource file", err);
            }
        }
        return feedName;
    }

        /**
         * Retrives measure name from using annotation and metadata
         * @param {object} oMeasure 
         * @returns {string}
         */
        function getMeasureName(oMeasure, oMetadata, vizFrame) {
            var measureName = oMeasure.Measure.PropertyPath;
            if (oMetadata[measureName]) {
                if (oMetadata[measureName][mAnnotationConstants.LABEL_KEY_V4]) {
                    //as part of supporting V4 annotation
                    measureName = getLabelFromAnnotationPath(
                        oMetadata[measureName][mAnnotationConstants.LABEL_KEY_V4].String
                            ? oMetadata[measureName][mAnnotationConstants.LABEL_KEY_V4].String
                            : oMetadata[measureName][mAnnotationConstants.LABEL_KEY_V4].Path,
                        vizFrame,
                        oMetadata
                    );
                } else if (oMetadata[measureName][mAnnotationConstants.LABEL_KEY]) {
                    measureName = oMetadata[measureName][mAnnotationConstants.LABEL_KEY];
                } else if (measureName) {
                    measureName = measureName;
                }
            }
            return measureName;
        }

        /**
         * return semantic legends for the card
         * @param {object} oDataPoint 
         * @param {boolean} isLegend 
         * @param {string} sMeasureName 
         * @returns 
         */
        function getSemanticLegends(oDataPoint, isLegend, sMeasureName) {
            var ret = [null, null];
            if (
                !oDataPoint.CriticalityCalculation ||
                !oDataPoint.CriticalityCalculation.ImprovementDirection ||
                !oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember
            ) {
                return ret;
            }
            var sImproveDirection = oDataPoint.CriticalityCalculation.ImprovementDirection.EnumMember;
            var deviationLow = ChartUtils.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeLowValue, isLegend);
            var deviationHigh = ChartUtils.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.DeviationRangeHighValue, isLegend);
            var toleranceLow = ChartUtils.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeLowValue, isLegend);
            var toleranceHigh = ChartUtils.getPathOrPrimitiveValue(oDataPoint.CriticalityCalculation.ToleranceRangeHighValue, isLegend);

            if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
                if (toleranceHigh && deviationHigh) {
                    ret[0] = OvpResources.getText("MINIMIZING_LESS", [sMeasureName, toleranceHigh]);
                    ret[1] = OvpResources.getText("MINIMIZING_MORE", [sMeasureName, deviationHigh]);
                    ret[2] = OvpResources.getText("MINIMIZING_CRITICAL", [toleranceHigh, sMeasureName, deviationHigh]);
                }
            } else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {
                if (toleranceLow && deviationLow) {
                    ret[0] = OvpResources.getText("MAXIMISING_MORE", [sMeasureName, toleranceLow]);
                    ret[1] = OvpResources.getText("MAXIMISING_LESS", [sMeasureName, deviationLow]);
                    ret[2] = OvpResources.getText("MAXIMIZING_CRITICAL", [deviationLow, sMeasureName, toleranceLow]);
                }
            } else if (endsWith(sImproveDirection, "Target")) {
                if (toleranceLow && deviationLow && toleranceHigh && deviationHigh) {
                    ret[0] = OvpResources.getText("TARGET_BETWEEN", [toleranceLow, sMeasureName, toleranceHigh]);
                    ret[1] = OvpResources.getText("TARGET_AROUND", [sMeasureName, deviationLow, deviationHigh]);
                    ret[2] = OvpResources.getText("TARGET_CRITICAL", [
                        deviationLow,
                        sMeasureName,
                        toleranceLow,
                        toleranceHigh,
                        deviationHigh
                    ]);
                }
            }
            return ret;
        }

        return {
            formThePathForCriticalityStateCalculation: formThePathForCriticalityStateCalculation,
            UpdateFlagValueForDataPoint: UpdateFlagValueForDataPoint,
            getMeasureName: getMeasureName,
            getSemanticLegends: getSemanticLegends,
            getLabelFromAnnotationPath: getLabelFromAnnotationPath
        };
    }
);