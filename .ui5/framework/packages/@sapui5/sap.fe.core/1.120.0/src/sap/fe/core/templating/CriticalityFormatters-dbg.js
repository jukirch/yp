/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/DataModelPathHelper"], function (BindingToolkit, DataModelPathHelper) {
  "use strict";

  var _exports = {};
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var or = BindingToolkit.or;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const DEFAULTCRITICALITYMAP = {
    error: "Error",
    critical: "Critical",
    good: "Good",
    neutral: "Neutral"
  };
  /**
   * Returns an expression to set button type based on Criticality
   * Supported Criticality: Positive, Negative, Critical and Information leading to Success, Error, Warning and None state respectively.
   *
   * @param oTarget A DataField a DataPoint or a DataModelObjectPath.
   * @param [oPropertyDataModelPath] DataModelObjectPath.
   * @returns An expression to deduce the state of an objectStatus.
   */
  const buildExpressionForCriticalityColor = (oTarget, oPropertyDataModelPath) => {
    const oAnnotationTarget = oTarget.targetObject ? oTarget.targetObject : oTarget;
    const oCriticalityProperty = oAnnotationTarget === null || oAnnotationTarget === void 0 ? void 0 : oAnnotationTarget.Criticality;
    const relativeLocation = oPropertyDataModelPath ? getRelativePaths(oPropertyDataModelPath) : undefined;
    const oCriticalityExpression = getExpressionFromAnnotation(oCriticalityProperty, relativeLocation);
    let sValueStateExpression;
    if (oCriticalityProperty) {
      sValueStateExpression = ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Negative")), equal(oCriticalityExpression, constant(1)), equal(oCriticalityExpression, constant("1"))), constant("Error"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Critical")), equal(oCriticalityExpression, constant(2)), equal(oCriticalityExpression, constant("2"))), constant("Warning"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Positive")), equal(oCriticalityExpression, constant(3)), equal(oCriticalityExpression, constant("3"))), constant("Success"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Information")), equal(oCriticalityExpression, constant(5)), equal(oCriticalityExpression, constant("5"))), constant("Information"), constant("None")))));
    } else {
      // Any other cases are not valid, the default value of 'None' will be returned
      sValueStateExpression = constant("None");
    }
    return compileExpression(sValueStateExpression);
  };

  /**
   * Returns an expression to set icon type based on Criticality
   * Supported Criticality: Positive, Negative, Critical and Information.
   *
   * @param oTarget A DataField a DataPoint or a DataModelObjectPath.
   * @param [oPropertyDataModelPath] DataModelObjectPath.
   * @returns An expression to deduce the icon of an objectStatus.
   */
  _exports.buildExpressionForCriticalityColor = buildExpressionForCriticalityColor;
  const buildExpressionForCriticalityIcon = (oTarget, oPropertyDataModelPath) => {
    const oAnnotationTarget = oTarget !== null && oTarget !== void 0 && oTarget.targetObject ? oTarget.targetObject : oTarget;
    const oCriticalityProperty = oAnnotationTarget === null || oAnnotationTarget === void 0 ? void 0 : oAnnotationTarget.Criticality;
    const relativeLocation = oPropertyDataModelPath ? getRelativePaths(oPropertyDataModelPath) : undefined;
    const oCriticalityExpression = getExpressionFromAnnotation(oCriticalityProperty, relativeLocation);
    const bCondition = (oAnnotationTarget === null || oAnnotationTarget === void 0 ? void 0 : oAnnotationTarget.CriticalityRepresentation) && (oAnnotationTarget === null || oAnnotationTarget === void 0 ? void 0 : oAnnotationTarget.CriticalityRepresentation) === "UI.CriticalityRepresentationType/WithoutIcon";
    let sIconPath;
    if (!bCondition) {
      if (oCriticalityProperty) {
        sIconPath = ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Negative")), equal(oCriticalityExpression, constant(1)), equal(oCriticalityExpression, constant("1"))), constant("sap-icon://message-error"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Critical")), equal(oCriticalityExpression, constant(2)), equal(oCriticalityExpression, constant("2"))), constant("sap-icon://message-warning"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Positive")), equal(oCriticalityExpression, constant(3)), equal(oCriticalityExpression, constant("3"))), constant("sap-icon://message-success"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Information")), equal(oCriticalityExpression, constant(5)), equal(oCriticalityExpression, constant("5"))), constant("sap-icon://message-information"), constant("")))));
      } else {
        sIconPath = constant("");
      }
    } else {
      sIconPath = constant("");
    }
    return compileExpression(sIconPath);
  };

  /**
   * Returns an expression to set button type based on Criticality
   * Supported Criticality: Positive and Negative leading to Accept and Reject button type respectively.
   *
   * @param oTarget A DataField, DataPoint, DataModelObjectPath.
   * @returns An expression to deduce button type.
   */
  _exports.buildExpressionForCriticalityIcon = buildExpressionForCriticalityIcon;
  const buildExpressionForCriticalityButtonType = oTarget => {
    const oAnnotationTarget = oTarget !== null && oTarget !== void 0 && oTarget.targetObject ? oTarget.targetObject : oTarget;
    const oCriticalityProperty = oAnnotationTarget === null || oAnnotationTarget === void 0 ? void 0 : oAnnotationTarget.Criticality;
    const oCriticalityExpression = getExpressionFromAnnotation(oCriticalityProperty);
    let sButtonTypeExpression;
    if (oCriticalityProperty) {
      sButtonTypeExpression = ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Negative")), equal(oCriticalityExpression, constant(1)), equal(oCriticalityExpression, constant("1"))), constant("Reject"), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Positive")), equal(oCriticalityExpression, constant(3)), equal(oCriticalityExpression, constant("3"))), constant("Accept"), constant("Default")));
    } else {
      // Any other cases are not valid, the ghost value of 'Ghost' will be returned
      sButtonTypeExpression = constant("Ghost");
    }
    return compileExpression(sButtonTypeExpression);
  };

  /**
   * Returns an expression to set color in MicroCharts based on Criticality
   * Supported Criticality: Positive, Negative and Critical leading to Good, Error and Critical color respectively.
   *
   * @param oTarget A DataField, DataPoint, DataModelObjectPath
   * @returns An expression to deduce colors in Microcharts
   */
  _exports.buildExpressionForCriticalityButtonType = buildExpressionForCriticalityButtonType;
  const buildExpressionForCriticalityColorMicroChart = oTarget => {
    const oAnnotationTarget = oTarget !== null && oTarget !== void 0 && oTarget.targetObject ? oTarget.targetObject : oTarget;
    const sColorExpression = buildExpressionForCriticality(oAnnotationTarget);
    return compileExpression(sColorExpression);
  };

  /**
   * Generates an expression to set color based on Criticality.
   *
   * @param annotationTarget A DataField, DataPoint
   * @param criticalityMap Criticality Mapper
   * @returns An expression to deduce colors in datapoints
   */
  _exports.buildExpressionForCriticalityColorMicroChart = buildExpressionForCriticalityColorMicroChart;
  const buildExpressionForCriticality = function (annotationTarget) {
    let criticalityMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULTCRITICALITYMAP;
    const oCriticalityProperty = annotationTarget === null || annotationTarget === void 0 ? void 0 : annotationTarget.Criticality;
    const oCriticalityExpression = getExpressionFromAnnotation(oCriticalityProperty);
    let sColorExpression;
    if (oCriticalityProperty) {
      sColorExpression = ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Negative")), equal(oCriticalityExpression, constant(1)), equal(oCriticalityExpression, constant("1"))), constant(criticalityMap.error), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Critical")), equal(oCriticalityExpression, constant(2)), equal(oCriticalityExpression, constant("2"))), constant(criticalityMap.critical), ifElse(or(equal(oCriticalityExpression, constant("UI.CriticalityType/Positive")), equal(oCriticalityExpression, constant(3)), equal(oCriticalityExpression, constant("3"))), constant(criticalityMap.good), constant(criticalityMap.neutral))));
    } else {
      sColorExpression = constant(criticalityMap.neutral);
    }
    return sColorExpression;
  };
  _exports.buildExpressionForCriticality = buildExpressionForCriticality;
  return _exports;
}, false);
