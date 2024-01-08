/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "../converters/helpers/DataFieldHelper"], function (valueFormatters, BindingToolkit, TypeGuards, DataModelPathHelper, UIFormatters, DataFieldHelper) {
  "use strict";

  var _exports = {};
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  // Import-export methods related to the common annotations used by the converter to use them in the templating through the Common Formatters.

  /**
   * Retrieves the expressionBinding created out of a binding expression.
   *
   * @param expression The expression which needs to be compiled
   * @returns The expression-binding string
   */
  const getExpressionBinding = function (expression) {
    return compileExpression(expression);
  };
  _exports.getExpressionBinding = getExpressionBinding;
  const getBindingWithTextArrangement = function (propertyDataModelPath, propertyBindingExpression, fieldFormatOptions, customFormatter) {
    var _propertyDefinition$a, _propertyDefinition$a2;
    const targetDisplayModeOverride = fieldFormatOptions === null || fieldFormatOptions === void 0 ? void 0 : fieldFormatOptions.displayMode;
    let outExpression = propertyBindingExpression;
    const propertyDefinition = propertyDataModelPath.targetObject.type === "PropertyPath" ? propertyDataModelPath.targetObject.$target : propertyDataModelPath.targetObject;
    const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
    const commonText = (_propertyDefinition$a = propertyDefinition.annotations) === null || _propertyDefinition$a === void 0 ? void 0 : (_propertyDefinition$a2 = _propertyDefinition$a.Common) === null || _propertyDefinition$a2 === void 0 ? void 0 : _propertyDefinition$a2.Text;
    const relativeLocation = getRelativePaths(propertyDataModelPath);
    const formatter = customFormatter || valueFormatters.formatWithBrackets;
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    if (targetDisplayMode !== "Value" && commonText) {
      switch (targetDisplayMode) {
        case "Description":
          outExpression = getExpressionFromAnnotation(commonText, relativeLocation);
          break;
        case "DescriptionValue":
          outExpression = formatResult([getExpressionFromAnnotation(commonText, relativeLocation), propertyBindingExpression], formatter);
          break;
        case "ValueDescription":
          outExpression = formatResult([propertyBindingExpression, getExpressionFromAnnotation(commonText, relativeLocation)], formatter);
          break;
      }
    }
    return outExpression;
  };
  _exports.getBindingWithTextArrangement = getBindingWithTextArrangement;
  const getBindingWithText = function (targetDataModelPath, customFormatter) {
    let propertyDataModelPath = targetDataModelPath;
    if (isPathAnnotationExpression(targetDataModelPath === null || targetDataModelPath === void 0 ? void 0 : targetDataModelPath.targetObject)) {
      var _targetDataModelPath$;
      propertyDataModelPath = enhanceDataModelPath(targetDataModelPath, (_targetDataModelPath$ = targetDataModelPath.targetObject) === null || _targetDataModelPath$ === void 0 ? void 0 : _targetDataModelPath$.path);
    }
    const propertyDefinition = propertyDataModelPath.targetObject;
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(propertyDataModelPath));
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression, true);
    const textArrangementBinding = getBindingWithTextArrangement(propertyDataModelPath, propertyBindingExpression, {}, customFormatter);
    return propertyDefinition.annotations.UI && !isReferencePropertyStaticallyHidden(propertyDefinition.annotations.UI.DataFieldDefault) && compileExpression(textArrangementBinding) || undefined;
  };
  _exports.getBindingWithText = getBindingWithText;
  return _exports;
}, false);
