/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit", "../converters/annotations/DataField", "../helpers/BindingHelper", "../helpers/TypeGuards"], function (BindingToolkit, DataField, BindingHelper, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataField = DataField.isDataField;
  var or = BindingToolkit.or;
  var isConstant = BindingToolkit.isConstant;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  /**
   * Create the binding expression to check if the property is read only or not.
   *
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  const isReadOnlyExpression = function (oTarget, relativePath) {
    var _oTarget$annotations, _oTarget$annotations$;
    const fieldControlExpression = getExpressionFromAnnotation(oTarget === null || oTarget === void 0 ? void 0 : (_oTarget$annotations = oTarget.annotations) === null || _oTarget$annotations === void 0 ? void 0 : (_oTarget$annotations$ = _oTarget$annotations.Common) === null || _oTarget$annotations$ === void 0 ? void 0 : _oTarget$annotations$.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 1), equal(fieldControlExpression, "1"));
    } else {
      return equal(fieldControlExpression, "Common.FieldControlType/ReadOnly");
    }
  };

  /**
   * Create the binding expression to check if the property is disabled or not.
   *
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's disabled
   */
  _exports.isReadOnlyExpression = isReadOnlyExpression;
  const isDisabledExpression = function (oTarget, relativePath) {
    var _oTarget$annotations2, _oTarget$annotations3;
    const fieldControlExpression = getExpressionFromAnnotation(oTarget === null || oTarget === void 0 ? void 0 : (_oTarget$annotations2 = oTarget.annotations) === null || _oTarget$annotations2 === void 0 ? void 0 : (_oTarget$annotations3 = _oTarget$annotations2.Common) === null || _oTarget$annotations3 === void 0 ? void 0 : _oTarget$annotations3.FieldControl, relativePath);
    if (!isConstant(fieldControlExpression)) {
      return or(equal(fieldControlExpression, 0), equal(fieldControlExpression, "0"));
    } else {
      return equal(fieldControlExpression, "Common.FieldControlType/Inapplicable");
    }
  };

  /**
   * Create the binding expression to check if the property is editable or not.
   *
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's not editable
   */
  _exports.isDisabledExpression = isDisabledExpression;
  const isNonEditableExpression = function (oTarget, relativePath) {
    return or(isReadOnlyExpression(oTarget, relativePath), isDisabledExpression(oTarget, relativePath));
  };

  /**
   * Determines if the dataFieldForAnnotation has a fieldControl that is not set to Mandatory.
   *
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if it has a fieldControl set and not Mandatory.
   */
  _exports.isNonEditableExpression = isNonEditableExpression;
  const hasFieldControlNotMandatory = function (dataFieldForAnnotation) {
    var _dataFieldForAnnotati, _dataFieldForAnnotati2;
    const fieldControl = (_dataFieldForAnnotati = dataFieldForAnnotation.annotations) === null || _dataFieldForAnnotati === void 0 ? void 0 : (_dataFieldForAnnotati2 = _dataFieldForAnnotati.Common) === null || _dataFieldForAnnotati2 === void 0 ? void 0 : _dataFieldForAnnotati2.FieldControl;
    return fieldControl && fieldControl.toString() !== "Common.FieldControlType/Mandatory" ? true : false;
  };

  /**
   * Determines if the target has a field control annotation with static value mandatory .
   *
   * @param target The target to be processed
   * @returns True if it has a static mandatory field control.
   */
  _exports.hasFieldControlNotMandatory = hasFieldControlNotMandatory;
  function isStaticallyMandatory(target) {
    var _target$annotations, _target$annotations$C, _Value, _Value$$target, _Value$$target$annota, _Value$$target$annota2, _Value$$target$annota3;
    const fieldFieldControl = (_target$annotations = target.annotations) === null || _target$annotations === void 0 ? void 0 : (_target$annotations$C = _target$annotations.Common) === null || _target$annotations$C === void 0 ? void 0 : _target$annotations$C.FieldControl;
    if (isProperty(target) || isDataFieldForAnnotation(target)) {
      return (fieldFieldControl === null || fieldFieldControl === void 0 ? void 0 : fieldFieldControl.toString()) === "Common.FieldControlType/Mandatory";
    }
    if (isDataField(target)) {
      if ((fieldFieldControl === null || fieldFieldControl === void 0 ? void 0 : fieldFieldControl.toString()) === "Common.FieldControlType/Mandatory") {
        return true;
      }
      if ((fieldFieldControl === null || fieldFieldControl === void 0 ? void 0 : fieldFieldControl.toString()) !== undefined) {
        return false;
      } else {
        var _target$Value, _target$Value$$target, _target$Value$$target2, _target$Value$$target3, _target$Value$$target4;
        return (target === null || target === void 0 ? void 0 : (_target$Value = target.Value) === null || _target$Value === void 0 ? void 0 : (_target$Value$$target = _target$Value.$target) === null || _target$Value$$target === void 0 ? void 0 : (_target$Value$$target2 = _target$Value$$target.annotations) === null || _target$Value$$target2 === void 0 ? void 0 : (_target$Value$$target3 = _target$Value$$target2.Common) === null || _target$Value$$target3 === void 0 ? void 0 : (_target$Value$$target4 = _target$Value$$target3.FieldControl) === null || _target$Value$$target4 === void 0 ? void 0 : _target$Value$$target4.toString()) === "Common.FieldControlType/Mandatory";
      }
    }
    return (target === null || target === void 0 ? void 0 : (_Value = target.Value) === null || _Value === void 0 ? void 0 : (_Value$$target = _Value.$target) === null || _Value$$target === void 0 ? void 0 : (_Value$$target$annota = _Value$$target.annotations) === null || _Value$$target$annota === void 0 ? void 0 : (_Value$$target$annota2 = _Value$$target$annota.Common) === null || _Value$$target$annota2 === void 0 ? void 0 : (_Value$$target$annota3 = _Value$$target$annota2.FieldControl) === null || _Value$$target$annota3 === void 0 ? void 0 : _Value$$target$annota3.toString()) === "Common.FieldControlType/Mandatory";
  }

  /**
   * Create the binding expression to check if the property is read only or not.
   *
   * @param oTarget The target property or DataField
   * @param relativePath Array of navigation properties pointing to the location of field control property
   * @returns The binding expression resolving to a Boolean being true if it's read only
   */
  _exports.isStaticallyMandatory = isStaticallyMandatory;
  const isRequiredExpression = function (oTarget, relativePath) {
    var _oTarget$annotations4, _oTarget$annotations5;
    const oFieldControlValue = (_oTarget$annotations4 = oTarget.annotations) === null || _oTarget$annotations4 === void 0 ? void 0 : (_oTarget$annotations5 = _oTarget$annotations4.Common) === null || _oTarget$annotations5 === void 0 ? void 0 : _oTarget$annotations5.FieldControl;
    const fieldControlValue = getExpressionFromAnnotation(oFieldControlValue, relativePath);
    return _isRequiredExpression(fieldControlValue);
  };

  /**
   * Create the binding expression to check if action parameter is required.
   *
   * @param actionParameter Action parameter
   * @param actionTarget Action definition
   * @param convertedTypes Converted Metadata
   * @returns Is required binding expression for parameter.
   */
  _exports.isRequiredExpression = isRequiredExpression;
  const isActionParameterRequiredExpression = function (actionParameter, actionTarget, convertedTypes) {
    var _actionTarget$paramet, _actionParameter$anno, _actionParameter$anno2;
    const bindingParameterFullName = actionTarget.isBound ? (_actionTarget$paramet = actionTarget.parameters[0]) === null || _actionTarget$paramet === void 0 ? void 0 : _actionTarget$paramet.fullyQualifiedName : undefined;
    const fieldControlValue = (_actionParameter$anno = actionParameter.annotations) === null || _actionParameter$anno === void 0 ? void 0 : (_actionParameter$anno2 = _actionParameter$anno.Common) === null || _actionParameter$anno2 === void 0 ? void 0 : _actionParameter$anno2.FieldControl;
    const fieldControlExp = getExpressionFromAnnotation(fieldControlValue, [], undefined, path => bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName));
    return _isRequiredExpression(fieldControlExp);
  };
  _exports.isActionParameterRequiredExpression = isActionParameterRequiredExpression;
  const _isRequiredExpression = fieldControlExp => {
    return or(isConstant(fieldControlExp) && equal(fieldControlExp, "Common.FieldControlType/Mandatory"), equal(fieldControlExp, 7), equal(fieldControlExp, "7"));
  };
  return _exports;
}, false);
