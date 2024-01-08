/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/insights/helpers/i18n",
    "sap/ovp/app/resources"
    ], 
    function (i18nHelper, OvpResources) {
    "use strict";
    
    /**
     * This function generates binding expression for card header
     *
     * @param {Object} oCardManifest
     * @param {Object} oCardSetting
     * @param {string} sCardId
     * @param {number} index The current selected key from settings.
     * @returns {string} The header details binding string
     * @public
     */
    function generateDetailsExpression(oCardManifest, oCardSetting, sCardId, index) {
        var bKPIHeaderExists = oCardManifest.data.request.batch && oCardManifest.data.request.batch.header;
        if (index && index > 0) {
            var exp = "";
            if ((oCardSetting.valueSelectionInfo && bKPIHeaderExists) || oCardSetting.description) {
                var valueSelectionKey = i18nHelper.createKeysFromText(
                    sCardId,
                    oCardSetting.valueSelectionInfo || oCardSetting.description,
                    "Label",
                    "card valueselection info",
                    "header.details"
                );
                var valueSelectionPreview = valueSelectionKey.isNew
                    ? valueSelectionKey.text
                    : valueSelectionKey.key;
                var valueSelectionPersist = valueSelectionKey.key;
                oCardManifest.configuration.parameters._detailsString1 = {
                    value: valueSelectionPreview
                };
                i18nHelper.seti18nValueToMap(
                    "configuration.parameters._detailsString1.value",
                    valueSelectionPersist,
                    valueSelectionKey.isNew
                );
                exp = "{{parameters._detailsString1}} | ";
            }
            var viewSwitchKey = i18nHelper.createKeysFromText(
                sCardId,
                oCardSetting.tabs[index - 1].value,
                "Label",
                "card view switch text",
                "header.details"
            );
            var viewSwitchKeyPreview = viewSwitchKey.isNew ? viewSwitchKey.text : viewSwitchKey.key;
            var viewSwitchKeyPersist = viewSwitchKey.key;
            oCardManifest.configuration.parameters._detailsString2 = {
                value: viewSwitchKeyPreview
            };
            i18nHelper.seti18nValueToMap(
                "configuration.parameters._detailsString2.value",
                viewSwitchKeyPersist,
                viewSwitchKey.isNew
            );
            exp = exp + "{{parameters._detailsString2}}";
            i18nHelper.seti18nValueToMap("header.details", exp, false);
            return exp;
        }
        if ((oCardSetting.valueSelectionInfo && bKPIHeaderExists) || oCardSetting.description) {
            i18nHelper.createKeysFromText(
                sCardId,
                oCardSetting.valueSelectionInfo || oCardSetting.description,
                "Label",
                "card valueselection info",
                "header.details"
            );
        }
        return bKPIHeaderExists && oCardSetting.valueSelectionInfo ? oCardSetting.valueSelectionInfo : oCardSetting.description;
    }

    /**
     * To Get value color / indicator binding paths for for card header
     *
     * @param {Object} oValue OVP Target Value
     * @returns {Object} The value color / indicator binding paths
     * @private
     */
    function findValueBinding(oValue) {
        var oValueObj = { path: [] };
        if (oValue && oValue.parts) {
            for (var j = 0; j < oValue.parts.length; j++) {
                if (oValue.parts[j].path) {
                    oValueObj.path.push(oValue.parts[j].path);
                } else if (oValue.parts[j].model == "ovpCardProperties") {
                    oValueObj.ovpProp = oValue.parts[j].value;
                }
            }
            return oValueObj;
        }
    }

    //TODO: find alternative way to show header details with applied filter info
    // var createHeaderDetailsToReflectFilters = function (oCardDefinition) {
    //     var oSelectionVariant = oCardDefinition.selectionVariant,
    //         aParameters = (oSelectionVariant && oSelectionVariant.Parameters) || [],
    //         aSelectOptions = (oSelectionVariant && oSelectionVariant.SelectOptions) || [],
    //         sDetailString = "";
    //     aSelectOptions.forEach(function (oSelectOption) {
    //         sDetailString += oSelectOption.PropertyName;
    //         oSelectOption.Ranges.forEach(function (oRange) {
    //             switch (oRange.Option) {
    //                 case "EQ":
    //                     sDetailString += "=" + oRange.Low;
    //                     break;
    //                 default:
    //                     sDetailString += oRange.Low;
    //                     break;
    //             }
    //             sDetailString += ",";
    //         });
    //     });
    //     aParameters.forEach(function (oParam) {
    //         sDetailString += oParam.PropertyName + "=" + oParam.PropertyValue;
    //     });
    //     return sDetailString;
    // };

    /**
     * To Get value color / indicator binding for card header
     *
     * @param {Object} oValue OVP Target Value
     * @returns {Array} The parts of binding
     * @private
     */
    function setBindingTargetDeviation(oValue) {
        var oTargetDevParts = oValue.getBindingInfo ? oValue.getBindingInfo("text").parts : "";
        var aParts = [];
        aParts[0] = oTargetDevParts && oTargetDevParts.length ? oTargetDevParts[0].path : "";
        aParts[1] = oTargetDevParts && oTargetDevParts.length > 1 ? oTargetDevParts[1].path : "";
        if (aParts.length) {
            return aParts;
        } else {
            return [];
        }
    }

    /**
     * To Get the card header details
     *
     * @param {Object} oCardDefinition
     * @returns {string} The type of header Defaulr or Numeric
     * @public
     */
    function getHeaderDetails(oCardDefinition) {
        if (
            oCardDefinition.cardComponentData.settings.dataPointAnnotationPath ||
            oCardDefinition.cardComponentData.settings.kpiAnnotationPath
        ) {
            return "Numeric";
        } else if (oCardDefinition.cardComponentData.settings.tabs) {
            return oCardDefinition.cardComponentData.settings.tabs[0].dataPointAnnotationPath ||
                oCardDefinition.cardComponentData.settings.tabs[0].kpiAnnotationPath
                ? "Numeric"
                : "Default";
        }
        return "Default";
    }

    /**
     * To Get the main indicator details
     *
     * @param {Object} oCardDefinition
     * @returns {object} The main indicator details object
     * @public
     */
    function mainIndicatorDetails(oCardDefinition) {
        var oRootControl = oCardDefinition.cardComponent.getRootControl();
        var oHeaderNumber = oRootControl.byId("kpiNumberValue");
        if (oHeaderNumber) {
            var oValue = oHeaderNumber.getBindingInfo ? oHeaderNumber.getBindingInfo("value") : "";
            var oValueColor = oHeaderNumber.getBindingInfo ? oHeaderNumber.getBindingInfo("valueColor") : "";
            var oIndicator = oHeaderNumber.getBindingInfo ? oHeaderNumber.getBindingInfo("indicator") : "";
        }
        var oTargetValue = oRootControl.byId("ovpTargetValue");
        var oKpiPercent = oRootControl.byId("kpiNumberPercentage");
        var oMainInd = { path: [] };
        if (oValue && oValue.parts) {
            for (var j = 0; j < oValue.parts.length; j++) {
                if (oValue.parts[j].path) {
                    oMainInd.path.push(oValue.parts[j].path);
                } else if (oValue.parts[j].model == "ovpCardProperties") {
                    oMainInd.ovpProp = oValue.parts[j].value;
                }
            }
            oMainInd.valueColor = oValueColor ? findValueBinding(oValueColor) : "";
            oMainInd.indicator = oIndicator ? findValueBinding(oIndicator) : "";
        }
        if (oTargetValue) {
            oMainInd.target = { parts: [], text: OvpResources.getText("KPI_Target_Text") };
            oMainInd.target.parts = oMainInd.target.parts.concat(setBindingTargetDeviation(oTargetValue));
            var sKeyTarget = oCardDefinition.cardComponentData.cardId + "_" + "KPI_Target_Text";
            i18nHelper.seti18nValueToMap("header.sideIndicators.0.title", "{{" + sKeyTarget + "}}", true);
            i18nHelper.inserti18nPayLoad(
                oCardDefinition.cardComponentData.cardId,
                sKeyTarget,
                OvpResources.getText("KPI_Target_Text"),
                "Label",
                "target Label"
            );
        }
        if (oKpiPercent) {
            oMainInd.deviation = { parts: [], text: OvpResources.getText("KPI_Deviation_Text") };
            oMainInd.deviation.parts = oMainInd.deviation.parts.concat(setBindingTargetDeviation(oKpiPercent));
            var sKeyDeviation = oCardDefinition.cardComponentData.cardId + "_" + "KPI_Deviation_Text";
            if (oTargetValue) {
                i18nHelper.seti18nValueToMap("header.sideIndicators.1.title", "{{" + sKeyDeviation + "}}", true);
            } else {
                i18nHelper.seti18nValueToMap("header.sideIndicators.0.title", "{{" + sKeyDeviation + "}}", true);
            }
            i18nHelper.inserti18nPayLoad(
                oCardDefinition.cardComponentData.cardId,
                sKeyDeviation,
                OvpResources.getText("KPI_Deviation_Text"),
                "Label",
                "deviation label"
            );
        }
        return oMainInd;
    }
    
    /**
     * This function is used to get target deviation binding string
     *
     * @param {Object} oTargetDevValue The target deviation value
     * @param {Object} oOvpCardProperties
     * @param {string} sFormatterName
     * @returns {string} The Expression binding string for target deviation
     * @public
     */
    function targetDeviationValuePath(oTargetDevValue, oOvpCardProperties, sFormatterName) {
        if (oTargetDevValue.parts.length > 1 && oTargetDevValue.parts[1]) {
            return (
                "{= extension.formatters." +
                sFormatterName +
                "(${" +
                oTargetDevValue.parts[0] +
                "}, ${" +
                oTargetDevValue.parts[1] +
                "},{NumberOfFractionalDigits:" +
                oOvpCardProperties.getProperty("/iNumberOfFractionalDigits") +
                ", manifestTarget:" +
                oOvpCardProperties.getProperty("/sManifestTargetValue") +
                "})}"
            );
        }
        return (
            "{= extension.formatters." +
            sFormatterName +
            "(${" +
            oTargetDevValue.parts[0] +
            "}," +
            null +
            ",{NumberOfFractionalDigits:" +
            oOvpCardProperties.getProperty("/iNumberOfFractionalDigits") +
            ", manifestTarget:" +
            oOvpCardProperties.getProperty("/sManifestTargetValue") +
            "})}"
        );
    }

    /**
     * This function is used to get main indicator number binding
     *
     * @param {Array} aParts The main indicator property path.
     * @param {Object} oStaticValues
     * @param {boolean} bUnit Unit of measure of the value.
     * @returns {string} The Expression binding string for main indicator number.
     * @public
     */
    function mainIndicatorNumberPath(aParts, oStaticValues, bUnit) {
        var sPath = "";
        sPath =
            "{= extension.formatters.kpiformatter(${" +
            aParts[0] +
            "},{NumberOfFractionalDigits:" +
            oStaticValues.NumberOfFractionalDigits +
            ", percentageAvailable:" +
            oStaticValues.percentageAvailable +
            "}";
        sPath += bUnit ? "," + bUnit + ")}" : ")}";
        return sPath;
    }
   
    return {
        generateDetailsExpression: generateDetailsExpression,
        getHeaderDetails: getHeaderDetails,
        mainIndicatorDetails: mainIndicatorDetails,
        targetDeviationValuePath: targetDeviationValuePath,
        mainIndicatorNumberPath: mainIndicatorNumberPath
    };
}, /* bExport= */ true);
