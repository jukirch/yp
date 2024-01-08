/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "../../helpers/TypeGuards"], function (Log, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  /**
   * Checks for statically hidden reference properties.
   *
   * @param source The dataField or property to be analized
   * @returns Whether the argument has been set as hidden
   */
  function isReferencePropertyStaticallyHidden(source) {
    if (!source) {
      return false;
    }
    function isPropertyHidden(property) {
      var _property$annotations;
      const dataFieldDefault = ((_property$annotations = property.annotations.UI) === null || _property$annotations === void 0 ? void 0 : _property$annotations.DataFieldDefault) || false;
      return isPropertyStaticallyHidden("Hidden", property) || dataFieldDefault && isStaticallyHiddenDataField(dataFieldDefault);
    }
    function isDataFieldAbstractTypesHidden(dataField) {
      return isStaticallyHiddenDataField(dataField) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && isAnnotationFieldStaticallyHidden(dataField);
    }
    function getPropertyPathFromPropertyWithHiddenFilter(property) {
      return isPropertyStaticallyHidden("HiddenFilter", property) && property.name;
    }
    function getPropertyPathFromDataFieldWithHiddenFilter(dataField) {
      return isDataFieldTypes(dataField) && isPropertyStaticallyHidden("HiddenFilter", dataField.Value.$target) && dataField.Value.path;
    }
    const isHidden = isProperty(source) ? isPropertyHidden(source) : isDataFieldAbstractTypesHidden(source);
    const propertyPathWithHiddenFilter = isProperty(source) ? getPropertyPathFromPropertyWithHiddenFilter(source) : getPropertyPathFromDataFieldWithHiddenFilter(source);
    if (isHidden && propertyPathWithHiddenFilter) {
      setLogMessageForHiddenFilter(propertyPathWithHiddenFilter);
    }
    return isHidden;
  }

  /**
   * Checks for data fields for annotation with statically hidden referenced properties.
   *
   * @param annotationProperty The dataField or reference Facet type to be analyzed
   * @returns Whether the argument has been set as hidden
   */
  _exports.isReferencePropertyStaticallyHidden = isReferencePropertyStaticallyHidden;
  function isAnnotationFieldStaticallyHidden(annotationProperty) {
    var _annotationProperty$T;
    if (isStaticallyHiddenDataField(annotationProperty)) {
      return true;
    }
    switch ((_annotationProperty$T = annotationProperty.Target.$target) === null || _annotationProperty$T === void 0 ? void 0 : _annotationProperty$T.term) {
      case "com.sap.vocabularies.UI.v1.Chart":
        const measuresHidden = annotationProperty.Target.$target.Measures.every(chartMeasure => {
          if (chartMeasure.$target && isPropertyStaticallyHidden("Hidden", chartMeasure.$target)) {
            if (isPropertyStaticallyHidden("HiddenFilter", chartMeasure.$target)) {
              setLogMessageForHiddenFilter(chartMeasure.$target.name);
            }
            return true;
          }
        });
        if (measuresHidden) {
          Log.warning("Warning: All measures attribute for Chart are statically hidden hence chart can't be rendered");
        }
        return measuresHidden;
      case "com.sap.vocabularies.UI.v1.FieldGroup":
        return annotationProperty.Target.$target.Data.every(isReferencePropertyStaticallyHidden);
      case "com.sap.vocabularies.UI.v1.DataPoint":
        const propertyValueAnnotation = annotationProperty.Target.$target.Value.$target;
        return isReferencePropertyStaticallyHidden(propertyValueAnnotation);
      default:
        return false;
    }
  }

  /**
   * Checks if header is statically hidden.
   *
   * @param propertyDataModel The property Data Model to be analized
   * @returns Whether the argument has been set as hidden
   */
  _exports.isAnnotationFieldStaticallyHidden = isAnnotationFieldStaticallyHidden;
  function isHeaderStaticallyHidden(propertyDataModel) {
    if (propertyDataModel !== null && propertyDataModel !== void 0 && propertyDataModel.targetObject) {
      const headerInfoAnnotation = propertyDataModel.targetObject;
      return isReferencePropertyStaticallyHidden(headerInfoAnnotation);
    }
    return false;
  }

  /**
   * Checks if data field or Reference Facet is statically hidden.
   *
   * @param dataField The dataField or Reference Facet to be analyzed
   * @returns Whether the argument has been set statically as hidden
   */
  _exports.isHeaderStaticallyHidden = isHeaderStaticallyHidden;
  function isStaticallyHiddenDataField(dataField) {
    var _dataField$annotation, _dataField$annotation2, _dataField$annotation3, _dataField$Value;
    return ((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : (_dataField$annotation3 = _dataField$annotation2.Hidden) === null || _dataField$annotation3 === void 0 ? void 0 : _dataField$annotation3.valueOf()) === true || isDataFieldTypes(dataField) && isPropertyStaticallyHidden("Hidden", dataField === null || dataField === void 0 ? void 0 : (_dataField$Value = dataField.Value) === null || _dataField$Value === void 0 ? void 0 : _dataField$Value.$target);
  }

  /**
   * Adds console warning when setting hidden and hidden filter together.
   *
   * @param path The property path to be added to the warning error message
   */
  function setLogMessageForHiddenFilter(path) {
    Log.warning("Warning: Property " + path + " is set with both UI.Hidden and UI.HiddenFilter - please set only one of these! UI.HiddenFilter is ignored currently!");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
   * DataField has a value defined.
   *
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataFieldTypes
   */
  function isDataFieldTypes(dataField) {
    return dataField.hasOwnProperty("Value");
  }

  /**
   * Identifies if the given property is statically hidden or hidden Filter".
   *
   * @param AnnotationTerm AnnotationTerm to be evaluated, only options are "Hidden" or "HiddenFilter
   * @param property The property to be checked
   * @returns `true` if it is a statically hidden or hidden filter property
   */
  function isPropertyStaticallyHidden(AnnotationTerm, property) {
    var _property$annotations2, _property$annotations3, _property$annotations4;
    return (property === null || property === void 0 ? void 0 : (_property$annotations2 = property.annotations) === null || _property$annotations2 === void 0 ? void 0 : (_property$annotations3 = _property$annotations2.UI) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3[AnnotationTerm]) === null || _property$annotations4 === void 0 ? void 0 : _property$annotations4.valueOf()) === true;
  }

  /**
   * Check if dataField or dataPoint main property is potentially sensitive.
   *
   * @param dataField DataFieldAbstractTypes or DataPOint.
   * @returns Boolean
   */
  function isPotentiallySensitive(dataField) {
    var _dataField$Value2, _dataField$Value3, _property, _property$annotations5, _property$annotations6, _property$annotations7;
    let property;
    switch (dataField === null || dataField === void 0 ? void 0 : dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        property = dataField === null || dataField === void 0 ? void 0 : (_dataField$Value2 = dataField.Value) === null || _dataField$Value2 === void 0 ? void 0 : _dataField$Value2.$target;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        const dataFieldTarget = dataField.Target.$target;
        if ((dataFieldTarget === null || dataFieldTarget === void 0 ? void 0 : dataFieldTarget.term) === "com.sap.vocabularies.UI.v1.DataPoint") {
          var _dataFieldTarget$Valu;
          property = dataFieldTarget === null || dataFieldTarget === void 0 ? void 0 : (_dataFieldTarget$Valu = dataFieldTarget.Value) === null || _dataFieldTarget$Valu === void 0 ? void 0 : _dataFieldTarget$Valu.$target;
        }
        if ((dataFieldTarget === null || dataFieldTarget === void 0 ? void 0 : dataFieldTarget.term) === "com.sap.vocabularies.Communication.v1.Contact") {
          var _fn;
          property = dataFieldTarget === null || dataFieldTarget === void 0 ? void 0 : (_fn = dataFieldTarget.fn) === null || _fn === void 0 ? void 0 : _fn.$target;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataPointType":
        property = dataField === null || dataField === void 0 ? void 0 : (_dataField$Value3 = dataField.Value) === null || _dataField$Value3 === void 0 ? void 0 : _dataField$Value3.$target;
        break;
      default:
        break;
    }
    return ((_property = property) === null || _property === void 0 ? void 0 : (_property$annotations5 = _property.annotations) === null || _property$annotations5 === void 0 ? void 0 : (_property$annotations6 = _property$annotations5.PersonalData) === null || _property$annotations6 === void 0 ? void 0 : (_property$annotations7 = _property$annotations6.IsPotentiallySensitive) === null || _property$annotations7 === void 0 ? void 0 : _property$annotations7.valueOf()) === true;
  }
  _exports.isPotentiallySensitive = isPotentiallySensitive;
  return _exports;
}, false);
