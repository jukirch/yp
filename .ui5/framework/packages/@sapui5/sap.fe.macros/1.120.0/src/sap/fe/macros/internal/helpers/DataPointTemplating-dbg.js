/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/ui/model/odata/v4/AnnotationHelper"], function (valueFormatters, BindingToolkit, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters, AnnotationHelper) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getBindingWithUnitOrCurrency = UIFormatters.getBindingWithUnitOrCurrency;
  var getBindingWithTimezone = UIFormatters.getBindingWithTimezone;
  var getBindingForTimezone = UIFormatters.getBindingForTimezone;
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  const typesSupportingNumberOfFractionalDigits = ["Edm.Single", "Edm.Double", "Edm.Decimal"];
  const getDataPointTargetExpression = oDataModelPath => {
    return oDataModelPath !== null && oDataModelPath !== void 0 && oDataModelPath.TargetValue ? getExpressionFromAnnotation(oDataModelPath.TargetValue) : unresolvableExpression;
  };
  const oResourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.macros");
  const buildExpressionForProgressIndicatorDisplayValue = oPropertyDataModelObjectPath => {
    var _oPropertyDataModelOb;
    const fieldValue = (oPropertyDataModelObjectPath === null || oPropertyDataModelObjectPath === void 0 ? void 0 : (_oPropertyDataModelOb = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb === void 0 ? void 0 : _oPropertyDataModelOb.Value) || "";
    const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
    let fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const TargetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject);
    if (fieldValueExpression && TargetExpression) {
      var _targetObject$annotat, _targetObject$annotat2, _targetObject$annotat3, _targetObject$annotat4;
      let targetObject = oPropertyDataModelObjectPath.targetObject.Value;
      if (!isProperty(targetObject)) {
        targetObject = oPropertyDataModelObjectPath.targetObject.Value.$target;
      }
      const unit = ((_targetObject$annotat = targetObject.annotations) === null || _targetObject$annotat === void 0 ? void 0 : (_targetObject$annotat2 = _targetObject$annotat.Measures) === null || _targetObject$annotat2 === void 0 ? void 0 : _targetObject$annotat2.Unit) || ((_targetObject$annotat3 = targetObject.annotations) === null || _targetObject$annotat3 === void 0 ? void 0 : (_targetObject$annotat4 = _targetObject$annotat3.Measures) === null || _targetObject$annotat4 === void 0 ? void 0 : _targetObject$annotat4.ISOCurrency);
      if (!unit) {
        return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [compileExpression(fieldValueExpression), compileExpression(TargetExpression)]);
      }
      // If the unit isn't a path, we check for a % sign as it is a special case.
      if (hasStaticPercentUnit(fieldValue === null || fieldValue === void 0 ? void 0 : fieldValue.$target)) {
        return `${compileExpression(fieldValueExpression)} %`;
      }
      fieldValueExpression = formatWithTypeInformation(targetObject, fieldValueExpression);
      const unitBindingExpression = unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation)) : getExpressionFromAnnotation(unit, relativeLocation);
      return compileExpression(formatResult([fieldValueExpression, TargetExpression, unitBindingExpression], valueFormatters.formatProgressIndicatorText));
    }
    return undefined;
  };
  _exports.buildExpressionForProgressIndicatorDisplayValue = buildExpressionForProgressIndicatorDisplayValue;
  const buildUnitBindingExpression = dataPoint => {
    var _dataPoint$targetObje, _dataPoint$targetObje2, _targetObject$annotat5, _targetObject$annotat6, _targetObject$annotat7, _targetObject$annotat8;
    const relativeLocation = getRelativePaths(dataPoint);
    const targetObject = dataPoint === null || dataPoint === void 0 ? void 0 : (_dataPoint$targetObje = dataPoint.targetObject) === null || _dataPoint$targetObje === void 0 ? void 0 : (_dataPoint$targetObje2 = _dataPoint$targetObje.Value) === null || _dataPoint$targetObje2 === void 0 ? void 0 : _dataPoint$targetObje2.$target;
    if (!isProperty(targetObject)) {
      return "";
    }
    const unit = ((_targetObject$annotat5 = targetObject.annotations) === null || _targetObject$annotat5 === void 0 ? void 0 : (_targetObject$annotat6 = _targetObject$annotat5.Measures) === null || _targetObject$annotat6 === void 0 ? void 0 : _targetObject$annotat6.Unit) || ((_targetObject$annotat7 = targetObject.annotations) === null || _targetObject$annotat7 === void 0 ? void 0 : (_targetObject$annotat8 = _targetObject$annotat7.Measures) === null || _targetObject$annotat8 === void 0 ? void 0 : _targetObject$annotat8.ISOCurrency);
    return unit ? compileExpression(getExpressionFromAnnotation(unit, relativeLocation)) : "";
  };
  _exports.buildUnitBindingExpression = buildUnitBindingExpression;
  const buildRatingIndicatorSubtitleExpression = (oContext, mSampleSize) => {
    if (mSampleSize) {
      return formatRatingIndicatorSubTitle(AnnotationHelper.value(mSampleSize, {
        context: oContext
      }));
    }
  };
  // returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
  const formatRatingIndicatorSubTitle = iSampleSizeValue => {
    if (iSampleSizeValue) {
      const sSubTitleLabel = iSampleSizeValue > 1 ? oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL");
      return oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE", [String(iSampleSizeValue), sSubTitleLabel]);
    }
  };

  /**
   * This function is used to get the header text of rating indicator.
   *
   * @param oContext Context of interface
   * @param oDataPoint Data point object
   * @returns Expression binding for rating indicator text
   */
  const getHeaderRatingIndicatorText = (oContext, oDataPoint) => {
    let result;
    if (oDataPoint && oDataPoint.SampleSize) {
      result = buildRatingIndicatorSubtitleExpression(oContext, oDataPoint.SampleSize);
    } else if (oDataPoint && oDataPoint.Description) {
      const sModelValue = AnnotationHelper.value(oDataPoint.Description, {
        context: oContext
      });
      result = "${path:" + sModelValue + "}";
    }
    return result;
  };
  getHeaderRatingIndicatorText.requiresIContext = true;
  _exports.getHeaderRatingIndicatorText = getHeaderRatingIndicatorText;
  const buildExpressionForDescription = fieldValue => {
    var _fieldValue$targetObj, _fieldValue$targetObj2, _fieldValue$targetObj3;
    const relativeLocation = getRelativePaths(fieldValue);
    if (fieldValue !== null && fieldValue !== void 0 && (_fieldValue$targetObj = fieldValue.targetObject) !== null && _fieldValue$targetObj !== void 0 && (_fieldValue$targetObj2 = _fieldValue$targetObj.annotations) !== null && _fieldValue$targetObj2 !== void 0 && (_fieldValue$targetObj3 = _fieldValue$targetObj2.Common) !== null && _fieldValue$targetObj3 !== void 0 && _fieldValue$targetObj3.Text) {
      var _fieldValue$targetObj4, _fieldValue$targetObj5;
      const oTextExpression = getExpressionFromAnnotation(fieldValue === null || fieldValue === void 0 ? void 0 : (_fieldValue$targetObj4 = fieldValue.targetObject.annotations) === null || _fieldValue$targetObj4 === void 0 ? void 0 : (_fieldValue$targetObj5 = _fieldValue$targetObj4.Common) === null || _fieldValue$targetObj5 === void 0 ? void 0 : _fieldValue$targetObj5.Text, relativeLocation);
      if (isPathInModelExpression(oTextExpression)) {
        oTextExpression.parameters = {
          $$noPatch: true
        };
      }
      return oTextExpression;
    }
    return undefined;
  };
  const getFloatFormat = (outExpression, fieldValue, numberOfFractionalDigits) => {
    // numberOfFractionalDigits is only defined in getValueFormatted when NumberOfFractionalDigits is defined.
    // In that case, we need to instance the preserveDecimals parameter because of a change MDC side
    if (numberOfFractionalDigits) {
      if (!outExpression.formatOptions) {
        outExpression.formatOptions = {};
      }
      outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
        preserveDecimals: false,
        maxFractionDigits: numberOfFractionalDigits
      });
    }
    return outExpression;
  };
  const getValueFormatted = (oPropertyDataModelPath, fieldValue, sPropertyType, sNumberOfFractionalDigits) => {
    var _fieldValue$path;
    let outExpression;
    const relativeLocation = (fieldValue === null || fieldValue === void 0 ? void 0 : (_fieldValue$path = fieldValue.path) === null || _fieldValue$path === void 0 ? void 0 : _fieldValue$path.indexOf("/")) === -1 ? getRelativePaths(oPropertyDataModelPath) : [];
    outExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    if (sPropertyType && isPathInModelExpression(outExpression)) {
      var _EDM_TYPE_MAPPING$sPr;
      formatWithTypeInformation(oPropertyDefinition, outExpression);
      outExpression.type = (_EDM_TYPE_MAPPING$sPr = EDM_TYPE_MAPPING[sPropertyType]) === null || _EDM_TYPE_MAPPING$sPr === void 0 ? void 0 : _EDM_TYPE_MAPPING$sPr.type;
      if (typesSupportingNumberOfFractionalDigits.includes(sPropertyType)) {
        // for the listReport, the decimal/single/double fields are formatted by returning a string
        // for the facets of the OP, the decimal/single/double fields are formatted by returning a promise, so we manage all the cases
        outExpression = getFloatFormat(outExpression, fieldValue, sNumberOfFractionalDigits);
      }
    }
    return outExpression;
  };
  _exports.getValueFormatted = getValueFormatted;
  const buildFieldBindingExpression = (oDataModelPath, dataPointFormatOptions, bHideMeasure) => {
    var _oDataPointValue$$tar, _oPropertyDataModelOb2, _oPropertyDataModelOb3, _oPropertyDataModelOb4, _oPropertyDataModelOb5, _oPropertyDataModelOb6, _oPropertyDataModelOb7;
    const oDataPoint = oDataModelPath.targetObject;
    const oDataPointValue = (oDataPoint === null || oDataPoint === void 0 ? void 0 : oDataPoint.Value) || "";
    const propertyType = oDataPointValue === null || oDataPointValue === void 0 ? void 0 : (_oDataPointValue$$tar = oDataPointValue.$target) === null || _oDataPointValue$$tar === void 0 ? void 0 : _oDataPointValue$$tar.type;
    let numberOfFractionalDigits;
    if (typesSupportingNumberOfFractionalDigits.includes(propertyType) && oDataPoint.ValueFormat) {
      if (oDataPoint.ValueFormat.NumberOfFractionalDigits) {
        numberOfFractionalDigits = oDataPoint.ValueFormat.NumberOfFractionalDigits;
      }
    }
    const oPropertyDataModelObjectPath = enhanceDataModelPath(oDataModelPath, oDataPointValue.path);
    const oDescription = oPropertyDataModelObjectPath ? buildExpressionForDescription(oPropertyDataModelObjectPath) : undefined;
    const oFormattedValue = getValueFormatted(oPropertyDataModelObjectPath, oDataPointValue, propertyType, numberOfFractionalDigits);
    const sDisplayMode = oDescription ? dataPointFormatOptions.displayMode || getDisplayMode(oPropertyDataModelObjectPath) : "Value";
    let oBindingExpression;
    switch (sDisplayMode) {
      case "Description":
        oBindingExpression = oDescription;
        break;
      case "ValueDescription":
        oBindingExpression = formatResult([oFormattedValue, oDescription], valueFormatters.formatWithBrackets);
        break;
      case "DescriptionValue":
        oBindingExpression = formatResult([oDescription, oFormattedValue], valueFormatters.formatWithBrackets);
        break;
      default:
        if ((_oPropertyDataModelOb2 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb2 !== void 0 && (_oPropertyDataModelOb3 = _oPropertyDataModelOb2.annotations) !== null && _oPropertyDataModelOb3 !== void 0 && (_oPropertyDataModelOb4 = _oPropertyDataModelOb3.Common) !== null && _oPropertyDataModelOb4 !== void 0 && _oPropertyDataModelOb4.Timezone) {
          oBindingExpression = getBindingWithTimezone(oPropertyDataModelObjectPath, oFormattedValue);
        } else if ((_oPropertyDataModelOb5 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb5 !== void 0 && (_oPropertyDataModelOb6 = _oPropertyDataModelOb5.annotations) !== null && _oPropertyDataModelOb6 !== void 0 && (_oPropertyDataModelOb7 = _oPropertyDataModelOb6.Common) !== null && _oPropertyDataModelOb7 !== void 0 && _oPropertyDataModelOb7.IsTimezone) {
          oBindingExpression = getBindingForTimezone(oPropertyDataModelObjectPath, oFormattedValue);
        } else {
          oBindingExpression = _computeBindingWithUnitOrCurrency(oPropertyDataModelObjectPath, oFormattedValue, bHideMeasure || (dataPointFormatOptions === null || dataPointFormatOptions === void 0 ? void 0 : dataPointFormatOptions.measureDisplayMode) === "Hidden");
        }
    }
    return compileExpression(oBindingExpression);
  };
  _exports.buildFieldBindingExpression = buildFieldBindingExpression;
  const _computeBindingWithUnitOrCurrency = (propertyDataModelObjectPath, formattedValue, hideMeasure) => {
    var _propertyDataModelObj, _propertyDataModelObj2, _propertyDataModelObj3, _propertyDataModelObj4, _propertyDataModelObj5, _propertyDataModelObj6;
    if ((_propertyDataModelObj = propertyDataModelObjectPath.targetObject) !== null && _propertyDataModelObj !== void 0 && (_propertyDataModelObj2 = _propertyDataModelObj.annotations) !== null && _propertyDataModelObj2 !== void 0 && (_propertyDataModelObj3 = _propertyDataModelObj2.Measures) !== null && _propertyDataModelObj3 !== void 0 && _propertyDataModelObj3.Unit || (_propertyDataModelObj4 = propertyDataModelObjectPath.targetObject) !== null && _propertyDataModelObj4 !== void 0 && (_propertyDataModelObj5 = _propertyDataModelObj4.annotations) !== null && _propertyDataModelObj5 !== void 0 && (_propertyDataModelObj6 = _propertyDataModelObj5.Measures) !== null && _propertyDataModelObj6 !== void 0 && _propertyDataModelObj6.ISOCurrency) {
      if (hideMeasure && hasStaticPercentUnit(propertyDataModelObjectPath.targetObject)) {
        return formattedValue;
      }
      return getBindingWithUnitOrCurrency(propertyDataModelObjectPath, formattedValue, undefined, hideMeasure ? {
        showMeasure: false
      } : undefined);
    }
    return formattedValue;
  };

  /**
   * Method to calculate the percentage value of Progress Indicator. Basic formula is Value/Target * 100.
   *
   * @param oPropertyDataModelObjectPath
   * @returns The expression binding used to calculate the percentage value, which is shown in the progress indicator based on the formula given above.
   */
  _exports._computeBindingWithUnitOrCurrency = _computeBindingWithUnitOrCurrency;
  const buildExpressionForProgressIndicatorPercentValue = oPropertyDataModelObjectPath => {
    var _oPropertyDefinition$, _oPropertyDefinition$2, _oPropertyDefinition$3, _oPropertyDefinition$4;
    const fieldValue = (oPropertyDataModelObjectPath === null || oPropertyDataModelObjectPath === void 0 ? void 0 : oPropertyDataModelObjectPath.targetObject.Value) || "";
    const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
    const fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
    const TargetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject);
    const oPropertyDefinition = fieldValue.$target;
    const unit = ((_oPropertyDefinition$ = oPropertyDefinition.annotations) === null || _oPropertyDefinition$ === void 0 ? void 0 : (_oPropertyDefinition$2 = _oPropertyDefinition$.Measures) === null || _oPropertyDefinition$2 === void 0 ? void 0 : _oPropertyDefinition$2.Unit) || ((_oPropertyDefinition$3 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$3 === void 0 ? void 0 : (_oPropertyDefinition$4 = _oPropertyDefinition$3.Measures) === null || _oPropertyDefinition$4 === void 0 ? void 0 : _oPropertyDefinition$4.ISOCurrency);
    if (unit) {
      const unitBindingExpression = isPathAnnotationExpression(unit) && unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation)) : getExpressionFromAnnotation(unit, relativeLocation);
      return compileExpression(formatResult([fieldValueExpression, TargetExpression, unitBindingExpression], valueFormatters.computePercentage));
    }
    return compileExpression(formatResult([fieldValueExpression, TargetExpression, ""], valueFormatters.computePercentage));
  };
  _exports.buildExpressionForProgressIndicatorPercentValue = buildExpressionForProgressIndicatorPercentValue;
  return _exports;
}, false);
