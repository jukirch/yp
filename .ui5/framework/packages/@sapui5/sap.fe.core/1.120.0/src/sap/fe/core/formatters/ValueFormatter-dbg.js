/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/strings/whitespaceReplacer", "sap/ui/core/Core", "sap/ui/core/format/DateFormat"], function (whitespaceReplacer, Core, DateFormat) {
  "use strict";

  var _exports = {};
  /**
   * Collection of table formatters.
   *
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const valueFormatters = function (sName) {
    if (valueFormatters.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return valueFormatters[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  const formatWithBrackets = (firstPart, secondPart) => {
    if (firstPart && secondPart) {
      return Core.getLibraryResourceBundle("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [firstPart, secondPart]);
    } else {
      return firstPart || secondPart || "";
    }
  };
  formatWithBrackets.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithBrackets";
  const formatTitle = (firstPart, secondPart) => {
    return secondPart ? formatWithBrackets(whitespaceReplacer(firstPart), whitespaceReplacer(secondPart)) : whitespaceReplacer(firstPart);
  };
  formatTitle.__functionName = "sap.fe.core.formatters.ValueFormatter#formatTitle";
  const formatWithPercentage = sValue => {
    return sValue !== null && sValue !== undefined ? `${sValue} %` : "";
  };
  formatWithPercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#formatWithPercentage";
  const computePercentage = (value, target, sUnit) => {
    let sPercentString;
    //BCP: 2370008548 If the base value is undefined return "0" by default
    if (value === undefined) {
      return "0";
    }
    const iValue = typeof value === "string" ? parseFloat(value) : value;
    const iTarget = typeof target === "string" ? parseFloat(target) : target;
    if (sUnit === "%") {
      if (iValue > 100) {
        sPercentString = "100";
      } else if (iValue <= 0) {
        sPercentString = "0";
      } else {
        sPercentString = typeof value === "string" ? value : value === null || value === void 0 ? void 0 : value.toString();
      }
    } else if (iValue > iTarget) {
      sPercentString = "100";
    } else if (iValue <= 0) {
      sPercentString = "0";
    } else {
      sPercentString = iValue && iTarget ? (iValue / iTarget * 100).toString() : "0";
    }
    return sPercentString;
  };
  computePercentage.__functionName = "sap.fe.core.formatters.ValueFormatter#computePercentage";
  const formatCriticalityIcon = val => {
    let sIcon;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sIcon = "sap-icon://message-error";
    } else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
      sIcon = "sap-icon://message-warning";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sIcon = "sap-icon://message-success";
    } else if (val === "UI.CriticalityType/Information" || val === "5" || val === 5) {
      sIcon = "sap-icon://message-information";
    } else {
      sIcon = "";
    }
    return sIcon;
  };
  formatCriticalityIcon.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityIcon";
  _exports.formatCriticalityIcon = formatCriticalityIcon;
  const formatCriticalityValueState = val => {
    let sValueState;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sValueState = "Error";
    } else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
      sValueState = "Warning";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sValueState = "Success";
    } else if (val === "UI.CriticalityType/Information" || val === "5" || val === 5) {
      sValueState = "Information";
    } else {
      sValueState = "None";
    }
    return sValueState;
  };
  formatCriticalityValueState.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityValueState";
  _exports.formatCriticalityValueState = formatCriticalityValueState;
  const formatCriticalityButtonType = val => {
    let sType;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sType = "Reject";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sType = "Accept";
    } else {
      sType = "Default";
    }
    return sType;
  };
  formatCriticalityButtonType.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityButtonType";
  _exports.formatCriticalityButtonType = formatCriticalityButtonType;
  const formatCriticalityColorMicroChart = val => {
    let sColor;
    if (val === "UI.CriticalityType/Negative" || val === "1" || val === 1) {
      sColor = "Error";
    } else if (val === "UI.CriticalityType/Critical" || val === "2" || val === 2) {
      sColor = "Critical";
    } else if (val === "UI.CriticalityType/Positive" || val === "3" || val === 3) {
      sColor = "Good";
    } else {
      sColor = "Neutral";
    }
    return sColor;
  };
  formatCriticalityColorMicroChart.__functionName = "sap.fe.core.formatters.ValueFormatter#formatCriticalityColorMicroChart";
  _exports.formatCriticalityColorMicroChart = formatCriticalityColorMicroChart;
  const formatProgressIndicatorText = (value, target, unit) => {
    if (value && target && unit) {
      var _localeData$dateField, _localeData$units, _localeData$units$sho;
      const unitSplit = unit.split("-");
      const searchUnit = `${unitSplit[1] === undefined ? unit : unitSplit[1]}-narrow`;
      const dateFormat = DateFormat.getDateInstance();
      const localeData = dateFormat.oLocaleData.mData;
      const oResourceModel = Core.getLibraryResourceBundle("sap.fe.macros");
      let unitDisplayed = unit;
      if (localeData !== null && localeData !== void 0 && (_localeData$dateField = localeData.dateFields[searchUnit]) !== null && _localeData$dateField !== void 0 && _localeData$dateField.displayName) {
        unitDisplayed = localeData.dateFields[searchUnit].displayName;
      } else if (localeData !== null && localeData !== void 0 && (_localeData$units = localeData.units) !== null && _localeData$units !== void 0 && (_localeData$units$sho = _localeData$units.short[unit]) !== null && _localeData$units$sho !== void 0 && _localeData$units$sho.displayName) {
        unitDisplayed = localeData.units.short[unit].displayName;
      }
      return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_WITH_UOM", [value, target, unitDisplayed]);
    }
  };
  formatProgressIndicatorText.__functionName = "sap.fe.core.formatters.ValueFormatter#formatProgressIndicatorText";
  _exports.formatProgressIndicatorText = formatProgressIndicatorText;
  const formatToKeepWhitespace = value => {
    return value === null || value === undefined ? "" : whitespaceReplacer(value + "");
  };
  formatToKeepWhitespace.__functionName = "sap.fe.core.formatters.ValueFormatter#formatToKeepWhitespace";
  _exports.formatToKeepWhitespace = formatToKeepWhitespace;
  valueFormatters.formatWithBrackets = formatWithBrackets;
  valueFormatters.formatTitle = formatTitle;
  valueFormatters.formatWithPercentage = formatWithPercentage;
  valueFormatters.computePercentage = computePercentage;
  valueFormatters.formatCriticalityIcon = formatCriticalityIcon;
  valueFormatters.formatCriticalityValueState = formatCriticalityValueState;
  valueFormatters.formatCriticalityButtonType = formatCriticalityButtonType;
  valueFormatters.formatCriticalityColorMicroChart = formatCriticalityColorMicroChart;
  valueFormatters.formatProgressIndicatorText = formatProgressIndicatorText;
  valueFormatters.formatToKeepWhitespace = formatToKeepWhitespace;
  /**
   * @global
   */
  return valueFormatters;
}, true);
