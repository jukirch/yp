/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/SemanticObjectHelper"], function (TypeGuards, SemanticObjectHelper) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  /**
   * Check whether the property has the Core.Computed annotation or not.
   *
   * @param oProperty The target property
   * @returns `true` if the property is computed
   */
  const isComputed = function (oProperty) {
    var _oProperty$annotation, _oProperty$annotation2, _oProperty$annotation3;
    return !!((_oProperty$annotation = oProperty.annotations) !== null && _oProperty$annotation !== void 0 && (_oProperty$annotation2 = _oProperty$annotation.Core) !== null && _oProperty$annotation2 !== void 0 && (_oProperty$annotation3 = _oProperty$annotation2.Computed) !== null && _oProperty$annotation3 !== void 0 && _oProperty$annotation3.valueOf());
  };

  /**
   * Check whether the property has the Core.Immutable annotation or not.
   *
   * @param oProperty The target property
   * @returns `true` if it's immutable
   */
  _exports.isComputed = isComputed;
  const isImmutable = function (oProperty) {
    var _oProperty$annotation4, _oProperty$annotation5, _oProperty$annotation6;
    return !!((_oProperty$annotation4 = oProperty.annotations) !== null && _oProperty$annotation4 !== void 0 && (_oProperty$annotation5 = _oProperty$annotation4.Core) !== null && _oProperty$annotation5 !== void 0 && (_oProperty$annotation6 = _oProperty$annotation5.Immutable) !== null && _oProperty$annotation6 !== void 0 && _oProperty$annotation6.valueOf());
  };

  /**
   * Check whether the property is a key or not.
   *
   * @param oProperty The target property
   * @returns `true` if it's a key
   */
  _exports.isImmutable = isImmutable;
  const isKey = function (oProperty) {
    return !!oProperty.isKey;
  };

  /**
   * Check whether the property is a semanticKey for the context entity.
   *
   * @param property
   * @param contextDataModelObject The DataModelObject that holds the context
   * @returns `true`if it's a semantic key
   */
  _exports.isKey = isKey;
  const isSemanticKey = function (property, contextDataModelObject) {
    var _contextDataModelObje, _contextDataModelObje2, _contextDataModelObje3, _contextDataModelObje4;
    const semanticKeys = (_contextDataModelObje = contextDataModelObject.contextLocation) === null || _contextDataModelObje === void 0 ? void 0 : (_contextDataModelObje2 = _contextDataModelObje.targetEntityType) === null || _contextDataModelObje2 === void 0 ? void 0 : (_contextDataModelObje3 = _contextDataModelObje2.annotations) === null || _contextDataModelObje3 === void 0 ? void 0 : (_contextDataModelObje4 = _contextDataModelObje3.Common) === null || _contextDataModelObje4 === void 0 ? void 0 : _contextDataModelObje4.SemanticKey;
    return (semanticKeys === null || semanticKeys === void 0 ? void 0 : semanticKeys.some(function (key) {
      var _key$$target;
      return (key === null || key === void 0 ? void 0 : (_key$$target = key.$target) === null || _key$$target === void 0 ? void 0 : _key$$target.fullyQualifiedName) === property.fullyQualifiedName;
    })) ?? false;
  };

  /**
   * Checks whether the property has a date time or not.
   *
   * @param oProperty
   * @returns `true` if it is of type date / datetime / datetimeoffset
   */
  _exports.isSemanticKey = isSemanticKey;
  const hasDateType = function (oProperty) {
    return ["Edm.Date", "Edm.DateTime", "Edm.DateTimeOffset"].includes(oProperty.type);
  };

  /**
   * Retrieve the label annotation.
   *
   * @param oProperty The target property
   * @returns The label string
   */
  _exports.hasDateType = hasDateType;
  const getLabel = function (oProperty) {
    var _oProperty$annotation7, _oProperty$annotation8, _oProperty$annotation9;
    return ((_oProperty$annotation7 = oProperty.annotations) === null || _oProperty$annotation7 === void 0 ? void 0 : (_oProperty$annotation8 = _oProperty$annotation7.Common) === null || _oProperty$annotation8 === void 0 ? void 0 : (_oProperty$annotation9 = _oProperty$annotation8.Label) === null || _oProperty$annotation9 === void 0 ? void 0 : _oProperty$annotation9.toString()) || "";
  };

  /**
   * Check whether the property has a semantic object defined or not.
   *
   * @param property The target property
   * @returns `true` if it has a semantic object
   */
  _exports.getLabel = getLabel;
  const hasSemanticObject = function (property) {
    return SemanticObjectHelper.hasSemanticObject(property);
  };

  /**
   * Retrieves the timezone property associated to the property, if applicable.
   *
   * @param oProperty The target property
   * @returns The timezone property, if it exists
   */
  _exports.hasSemanticObject = hasSemanticObject;
  const getAssociatedTimezoneProperty = function (oProperty) {
    var _oProperty$annotation10, _oProperty$annotation11, _oProperty$annotation12, _oProperty$annotation13;
    return isPathAnnotationExpression(oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation10 = oProperty.annotations) === null || _oProperty$annotation10 === void 0 ? void 0 : (_oProperty$annotation11 = _oProperty$annotation10.Common) === null || _oProperty$annotation11 === void 0 ? void 0 : _oProperty$annotation11.Timezone) ? (_oProperty$annotation12 = oProperty.annotations) === null || _oProperty$annotation12 === void 0 ? void 0 : (_oProperty$annotation13 = _oProperty$annotation12.Common) === null || _oProperty$annotation13 === void 0 ? void 0 : _oProperty$annotation13.Timezone.$target : undefined;
  };

  /**
   * Retrieves the timezone property path associated to the property, if applicable.
   *
   * @param oProperty The target property
   * @returns The timezone property path, if it exists
   */
  _exports.getAssociatedTimezoneProperty = getAssociatedTimezoneProperty;
  const getAssociatedTimezonePropertyPath = function (oProperty) {
    var _oProperty$annotation14, _oProperty$annotation15, _oProperty$annotation16, _oProperty$annotation17, _oProperty$annotation18;
    return isPathAnnotationExpression(oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation14 = oProperty.annotations) === null || _oProperty$annotation14 === void 0 ? void 0 : (_oProperty$annotation15 = _oProperty$annotation14.Common) === null || _oProperty$annotation15 === void 0 ? void 0 : _oProperty$annotation15.Timezone) ? oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation16 = oProperty.annotations) === null || _oProperty$annotation16 === void 0 ? void 0 : (_oProperty$annotation17 = _oProperty$annotation16.Common) === null || _oProperty$annotation17 === void 0 ? void 0 : (_oProperty$annotation18 = _oProperty$annotation17.Timezone) === null || _oProperty$annotation18 === void 0 ? void 0 : _oProperty$annotation18.path : undefined;
  };

  /**
   * Retrieves the associated text property for that property, if it exists.
   *
   * @param oProperty The target property
   * @returns The text property, if it exists
   */
  _exports.getAssociatedTimezonePropertyPath = getAssociatedTimezonePropertyPath;
  const getAssociatedTextProperty = function (oProperty) {
    var _oProperty$annotation19, _oProperty$annotation20, _oProperty$annotation21, _oProperty$annotation22;
    return isPathAnnotationExpression(oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation19 = oProperty.annotations) === null || _oProperty$annotation19 === void 0 ? void 0 : (_oProperty$annotation20 = _oProperty$annotation19.Common) === null || _oProperty$annotation20 === void 0 ? void 0 : _oProperty$annotation20.Text) ? (_oProperty$annotation21 = oProperty.annotations) === null || _oProperty$annotation21 === void 0 ? void 0 : (_oProperty$annotation22 = _oProperty$annotation21.Common) === null || _oProperty$annotation22 === void 0 ? void 0 : _oProperty$annotation22.Text.$target : undefined;
  };

  /**
   * Retrieves the unit property associated to the property, if applicable.
   *
   * @param oProperty The target property
   * @returns The unit property, if it exists
   */
  _exports.getAssociatedTextProperty = getAssociatedTextProperty;
  const getAssociatedUnitProperty = function (oProperty) {
    var _oProperty$annotation23, _oProperty$annotation24;
    return oProperty && isPathAnnotationExpression((_oProperty$annotation23 = oProperty.annotations.Measures) === null || _oProperty$annotation23 === void 0 ? void 0 : _oProperty$annotation23.Unit) ? (_oProperty$annotation24 = oProperty.annotations.Measures) === null || _oProperty$annotation24 === void 0 ? void 0 : _oProperty$annotation24.Unit.$target : undefined;
  };
  _exports.getAssociatedUnitProperty = getAssociatedUnitProperty;
  const getAssociatedUnitPropertyPath = function (oProperty) {
    var _oProperty$annotation25, _oProperty$annotation26, _oProperty$annotation27, _oProperty$annotation28;
    return isPathAnnotationExpression(oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation25 = oProperty.annotations) === null || _oProperty$annotation25 === void 0 ? void 0 : (_oProperty$annotation26 = _oProperty$annotation25.Measures) === null || _oProperty$annotation26 === void 0 ? void 0 : _oProperty$annotation26.Unit) ? (_oProperty$annotation27 = oProperty.annotations) === null || _oProperty$annotation27 === void 0 ? void 0 : (_oProperty$annotation28 = _oProperty$annotation27.Measures) === null || _oProperty$annotation28 === void 0 ? void 0 : _oProperty$annotation28.Unit.path : undefined;
  };

  /**
   * Retrieves the associated currency property for that property if it exists.
   *
   * @param oProperty The target property
   * @returns The unit property, if it exists
   */
  _exports.getAssociatedUnitPropertyPath = getAssociatedUnitPropertyPath;
  const getAssociatedCurrencyProperty = function (oProperty) {
    var _oProperty$annotation29, _oProperty$annotation30;
    return oProperty && isPathAnnotationExpression((_oProperty$annotation29 = oProperty.annotations.Measures) === null || _oProperty$annotation29 === void 0 ? void 0 : _oProperty$annotation29.ISOCurrency) ? (_oProperty$annotation30 = oProperty.annotations.Measures) === null || _oProperty$annotation30 === void 0 ? void 0 : _oProperty$annotation30.ISOCurrency.$target : undefined;
  };
  _exports.getAssociatedCurrencyProperty = getAssociatedCurrencyProperty;
  const getAssociatedCurrencyPropertyPath = function (oProperty) {
    var _oProperty$annotation31, _oProperty$annotation32, _oProperty$annotation33, _oProperty$annotation34;
    return isPathAnnotationExpression(oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation31 = oProperty.annotations) === null || _oProperty$annotation31 === void 0 ? void 0 : (_oProperty$annotation32 = _oProperty$annotation31.Measures) === null || _oProperty$annotation32 === void 0 ? void 0 : _oProperty$annotation32.ISOCurrency) ? (_oProperty$annotation33 = oProperty.annotations) === null || _oProperty$annotation33 === void 0 ? void 0 : (_oProperty$annotation34 = _oProperty$annotation33.Measures) === null || _oProperty$annotation34 === void 0 ? void 0 : _oProperty$annotation34.ISOCurrency.path : undefined;
  };

  /**
   * Retrieves the associated static currency or unit for a given property if it exists.
   *
   * @param property The target property
   * @returns The unit or currency static value, if it exists
   */
  _exports.getAssociatedCurrencyPropertyPath = getAssociatedCurrencyPropertyPath;
  const getStaticUnitOrCurrency = function (property) {
    var _property$annotations, _property$annotations2, _property$annotations3, _property$annotations4;
    const unitOrCurrency = ((_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.Measures) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.ISOCurrency) ?? ((_property$annotations3 = property.annotations) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3.Measures) === null || _property$annotations4 === void 0 ? void 0 : _property$annotations4.Unit);
    if (!unitOrCurrency || isPathAnnotationExpression(unitOrCurrency)) {
      return undefined;
    }
    return `${unitOrCurrency}`;
  };

  /**
   * Retrieves the associated timezone static text a given property if it exists.
   *
   * @param property The target property
   * @returns The timezone static value, if it exists
   */
  _exports.getStaticUnitOrCurrency = getStaticUnitOrCurrency;
  const getStaticTimezone = function (property) {
    var _property$annotations5, _property$annotations6;
    const staticTimezone = (_property$annotations5 = property.annotations) === null || _property$annotations5 === void 0 ? void 0 : (_property$annotations6 = _property$annotations5.Common) === null || _property$annotations6 === void 0 ? void 0 : _property$annotations6.Timezone;
    if (!staticTimezone || isPathAnnotationExpression(staticTimezone)) {
      return undefined;
    }
    return `${staticTimezone}`;
  };

  /**
   * Retrieves the Common.Text property path if it exists.
   *
   * @param oProperty The target property
   * @returns The Common.Text property path or undefined if it does not exist
   */
  _exports.getStaticTimezone = getStaticTimezone;
  const getAssociatedTextPropertyPath = function (oProperty) {
    var _oProperty$annotation35, _oProperty$annotation36, _oProperty$annotation37, _oProperty$annotation38;
    return isPathAnnotationExpression((_oProperty$annotation35 = oProperty.annotations) === null || _oProperty$annotation35 === void 0 ? void 0 : (_oProperty$annotation36 = _oProperty$annotation35.Common) === null || _oProperty$annotation36 === void 0 ? void 0 : _oProperty$annotation36.Text) ? (_oProperty$annotation37 = oProperty.annotations) === null || _oProperty$annotation37 === void 0 ? void 0 : (_oProperty$annotation38 = _oProperty$annotation37.Common) === null || _oProperty$annotation38 === void 0 ? void 0 : _oProperty$annotation38.Text.path : undefined;
  };

  /**
   * Check whether the property has a value help annotation defined or not.
   *
   * @param property The target property to be checked
   * @returns `true` if it has a value help
   */
  _exports.getAssociatedTextPropertyPath = getAssociatedTextPropertyPath;
  const hasValueHelp = function (property) {
    var _property$annotations7, _property$annotations8, _property$annotations9, _property$annotations10, _property$annotations11, _property$annotations12, _property$annotations13, _property$annotations14;
    return !!((_property$annotations7 = property.annotations) !== null && _property$annotations7 !== void 0 && (_property$annotations8 = _property$annotations7.Common) !== null && _property$annotations8 !== void 0 && _property$annotations8.ValueList) || !!((_property$annotations9 = property.annotations) !== null && _property$annotations9 !== void 0 && (_property$annotations10 = _property$annotations9.Common) !== null && _property$annotations10 !== void 0 && _property$annotations10.ValueListReferences) || !!((_property$annotations11 = property.annotations) !== null && _property$annotations11 !== void 0 && (_property$annotations12 = _property$annotations11.Common) !== null && _property$annotations12 !== void 0 && _property$annotations12.ValueListWithFixedValues) || !!((_property$annotations13 = property.annotations) !== null && _property$annotations13 !== void 0 && (_property$annotations14 = _property$annotations13.Common) !== null && _property$annotations14 !== void 0 && _property$annotations14.ValueListMapping);
  };

  /**
   * Check whether the property has a value help with fixed value annotation defined or not.
   *
   * @param oProperty The target property
   * @returns `true` if it has a value help
   */
  _exports.hasValueHelp = hasValueHelp;
  const hasValueHelpWithFixedValues = function (oProperty) {
    var _oProperty$annotation39, _oProperty$annotation40, _oProperty$annotation41;
    return !!(oProperty !== null && oProperty !== void 0 && (_oProperty$annotation39 = oProperty.annotations) !== null && _oProperty$annotation39 !== void 0 && (_oProperty$annotation40 = _oProperty$annotation39.Common) !== null && _oProperty$annotation40 !== void 0 && (_oProperty$annotation41 = _oProperty$annotation40.ValueListWithFixedValues) !== null && _oProperty$annotation41 !== void 0 && _oProperty$annotation41.valueOf());
  };

  /**
   * Check whether the property has a value help for validation annotation defined or not.
   *
   * @param oProperty The target property
   * @returns `true` if it has a value help
   */
  _exports.hasValueHelpWithFixedValues = hasValueHelpWithFixedValues;
  const hasValueListForValidation = function (oProperty) {
    var _oProperty$annotation42, _oProperty$annotation43;
    return ((_oProperty$annotation42 = oProperty.annotations) === null || _oProperty$annotation42 === void 0 ? void 0 : (_oProperty$annotation43 = _oProperty$annotation42.Common) === null || _oProperty$annotation43 === void 0 ? void 0 : _oProperty$annotation43.ValueListForValidation) !== undefined;
  };
  _exports.hasValueListForValidation = hasValueListForValidation;
  const hasTimezone = function (oProperty) {
    var _oProperty$annotation44, _oProperty$annotation45;
    return ((_oProperty$annotation44 = oProperty.annotations) === null || _oProperty$annotation44 === void 0 ? void 0 : (_oProperty$annotation45 = _oProperty$annotation44.Common) === null || _oProperty$annotation45 === void 0 ? void 0 : _oProperty$annotation45.Timezone) !== undefined;
  };
  /**
   * Checks whether the property is a unit property.
   *
   * @param property The property to be checked
   * @returns `true` if it is a unit
   */
  _exports.hasTimezone = hasTimezone;
  const isUnit = function (property) {
    var _property$annotations15, _property$annotations16, _property$annotations17;
    return !!((_property$annotations15 = property.annotations) !== null && _property$annotations15 !== void 0 && (_property$annotations16 = _property$annotations15.Common) !== null && _property$annotations16 !== void 0 && (_property$annotations17 = _property$annotations16.IsUnit) !== null && _property$annotations17 !== void 0 && _property$annotations17.valueOf());
  };

  /**
   * Checks whether the property has a text property.
   *
   * @param property The property to be checked
   * @returns `true` if it is a Text
   */
  _exports.isUnit = isUnit;
  const hasText = function (property) {
    var _property$annotations18, _property$annotations19;
    return ((_property$annotations18 = property.annotations) === null || _property$annotations18 === void 0 ? void 0 : (_property$annotations19 = _property$annotations18.Common) === null || _property$annotations19 === void 0 ? void 0 : _property$annotations19.Text) !== undefined;
  };

  /**
   * Checks whether the property has an ImageURL.
   *
   * @param property The property to be checked
   * @returns `true` if it is an ImageURL
   */
  _exports.hasText = hasText;
  const isImageURL = function (property) {
    var _property$annotations20, _property$annotations21, _property$annotations22;
    return !!((_property$annotations20 = property.annotations) !== null && _property$annotations20 !== void 0 && (_property$annotations21 = _property$annotations20.UI) !== null && _property$annotations21 !== void 0 && (_property$annotations22 = _property$annotations21.IsImageURL) !== null && _property$annotations22 !== void 0 && _property$annotations22.valueOf());
  };

  /**
   * Checks whether the property is a currency property.
   *
   * @param oProperty The property to be checked
   * @returns `true` if it is a currency
   */
  _exports.isImageURL = isImageURL;
  const isCurrency = function (oProperty) {
    var _oProperty$annotation46, _oProperty$annotation47, _oProperty$annotation48;
    return !!((_oProperty$annotation46 = oProperty.annotations) !== null && _oProperty$annotation46 !== void 0 && (_oProperty$annotation47 = _oProperty$annotation46.Common) !== null && _oProperty$annotation47 !== void 0 && (_oProperty$annotation48 = _oProperty$annotation47.IsCurrency) !== null && _oProperty$annotation48 !== void 0 && _oProperty$annotation48.valueOf());
  };

  /**
   * Checks whether the property has a currency property.
   *
   * @param property The property to be checked
   * @returns `true` if it has a currency
   */
  _exports.isCurrency = isCurrency;
  const hasCurrency = function (property) {
    var _property$annotations23, _property$annotations24;
    return ((_property$annotations23 = property.annotations) === null || _property$annotations23 === void 0 ? void 0 : (_property$annotations24 = _property$annotations23.Measures) === null || _property$annotations24 === void 0 ? void 0 : _property$annotations24.ISOCurrency) !== undefined;
  };

  /**
   * Checks whether the property has a unit property.
   *
   * @param property The property to be checked
   * @returns `true` if it has a unit
   */
  _exports.hasCurrency = hasCurrency;
  const hasUnit = function (property) {
    var _property$annotations25, _property$annotations26;
    return ((_property$annotations25 = property.annotations) === null || _property$annotations25 === void 0 ? void 0 : (_property$annotations26 = _property$annotations25.Measures) === null || _property$annotations26 === void 0 ? void 0 : _property$annotations26.Unit) !== undefined;
  };

  /**
   * Checks whether the property type has Edm.Guid.
   *
   * @param property The property to be checked
   * @returns `true` if it is a Guid
   */
  _exports.hasUnit = hasUnit;
  const isGuid = function (property) {
    return property.type === "Edm.Guid";
  };
  _exports.isGuid = isGuid;
  const hasStaticPercentUnit = function (oProperty) {
    var _oProperty$annotation49, _oProperty$annotation50, _oProperty$annotation51;
    return (oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation49 = oProperty.annotations) === null || _oProperty$annotation49 === void 0 ? void 0 : (_oProperty$annotation50 = _oProperty$annotation49.Measures) === null || _oProperty$annotation50 === void 0 ? void 0 : (_oProperty$annotation51 = _oProperty$annotation50.Unit) === null || _oProperty$annotation51 === void 0 ? void 0 : _oProperty$annotation51.toString()) === "%";
  };

  /**
   * Check if the form element or action parameter supports multi line text input.
   *
   * @param parameter Property or ActionParameter.
   * @returns Boolean
   */
  _exports.hasStaticPercentUnit = hasStaticPercentUnit;
  function isMultiLineText(parameter) {
    var _parameter$annotation, _parameter$annotation2, _parameter$annotation3;
    return (parameter === null || parameter === void 0 ? void 0 : (_parameter$annotation = parameter.annotations) === null || _parameter$annotation === void 0 ? void 0 : (_parameter$annotation2 = _parameter$annotation.UI) === null || _parameter$annotation2 === void 0 ? void 0 : (_parameter$annotation3 = _parameter$annotation2.MultiLineText) === null || _parameter$annotation3 === void 0 ? void 0 : _parameter$annotation3.valueOf()) === true;
  }

  /**
   * Checks whether the property is a timezone property.
   *
   * @param property The property to be checked
   * @returns `true` if it is a timezone property
   */
  _exports.isMultiLineText = isMultiLineText;
  function isTimezone(property) {
    var _property$annotations27, _property$annotations28, _property$annotations29;
    return !!((_property$annotations27 = property.annotations) !== null && _property$annotations27 !== void 0 && (_property$annotations28 = _property$annotations27.Common) !== null && _property$annotations28 !== void 0 && (_property$annotations29 = _property$annotations28.IsTimezone) !== null && _property$annotations29 !== void 0 && _property$annotations29.valueOf());
  }
  _exports.isTimezone = isTimezone;
  return _exports;
}, false);
