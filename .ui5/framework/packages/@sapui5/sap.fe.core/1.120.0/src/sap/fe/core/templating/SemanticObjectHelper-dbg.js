/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Get the path of the semantic Object if it is a dynamic SemanticObject.
   *
   * @param semanticObject The value of the Common.SemanticObject annotation.
   * @returns  The path of the semantic Object if it is a dynamic SemanticObject null otherwise.
   */
  const getDynamicPathFromSemanticObject = semanticObject => {
    const dynamicSemObjectRegex = semanticObject === null || semanticObject === void 0 ? void 0 : semanticObject.match(/{(.*?)}/);
    if (dynamicSemObjectRegex !== null && dynamicSemObjectRegex !== void 0 && dynamicSemObjectRegex.length && dynamicSemObjectRegex.length > 1) {
      return dynamicSemObjectRegex[1];
    }
    return null;
  };

  /**
   * Check whether a property or a NavigationProperty has a semantic object defined or not.
   *
   * @param property The target property
   * @returns `true` if it has a semantic object
   */
  _exports.getDynamicPathFromSemanticObject = getDynamicPathFromSemanticObject;
  const hasSemanticObject = function (property) {
    var _property$annotations;
    const _propertyCommonAnnotations = (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : _property$annotations.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        var _propertyCommonAnnota;
        if (((_propertyCommonAnnota = _propertyCommonAnnotations[key]) === null || _propertyCommonAnnota === void 0 ? void 0 : _propertyCommonAnnota.term) === "com.sap.vocabularies.Common.v1.SemanticObject") {
          return true;
        }
      }
    }
    return false;
  };
  _exports.hasSemanticObject = hasSemanticObject;
  const getSemanticObjects = function (property) {
    var _property$annotations2;
    const semanticObjects = [];
    const _propertyCommonAnnotations = (_property$annotations2 = property.annotations) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        var _propertyCommonAnnota2;
        if (((_propertyCommonAnnota2 = _propertyCommonAnnotations[key]) === null || _propertyCommonAnnota2 === void 0 ? void 0 : _propertyCommonAnnota2.term) === "com.sap.vocabularies.Common.v1.SemanticObject") {
          semanticObjects.push(_propertyCommonAnnotations[key]);
        }
      }
    }
    return semanticObjects;
  };
  _exports.getSemanticObjects = getSemanticObjects;
  const getSemanticObjectMappings = function (property) {
    var _property$annotations3;
    const semanticObjectMappings = [];
    const _propertyCommonAnnotations = (_property$annotations3 = property.annotations) === null || _property$annotations3 === void 0 ? void 0 : _property$annotations3.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        var _propertyCommonAnnota3;
        if (((_propertyCommonAnnota3 = _propertyCommonAnnotations[key]) === null || _propertyCommonAnnota3 === void 0 ? void 0 : _propertyCommonAnnota3.term) === "com.sap.vocabularies.Common.v1.SemanticObjectMapping") {
          semanticObjectMappings.push(_propertyCommonAnnotations[key]);
        }
      }
    }
    return semanticObjectMappings;
  };
  _exports.getSemanticObjectMappings = getSemanticObjectMappings;
  const getSemanticObjectUnavailableActions = function (property) {
    var _property$annotations4;
    const semanticObjectUnavailableActions = [];
    const _propertyCommonAnnotations = (_property$annotations4 = property.annotations) === null || _property$annotations4 === void 0 ? void 0 : _property$annotations4.Common;
    if (_propertyCommonAnnotations) {
      for (const key in _propertyCommonAnnotations) {
        var _propertyCommonAnnota4;
        if (((_propertyCommonAnnota4 = _propertyCommonAnnotations[key]) === null || _propertyCommonAnnota4 === void 0 ? void 0 : _propertyCommonAnnota4.term) === "com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions") {
          semanticObjectUnavailableActions.push(_propertyCommonAnnotations[key]);
        }
      }
    }
    return semanticObjectUnavailableActions;
  };
  _exports.getSemanticObjectUnavailableActions = getSemanticObjectUnavailableActions;
  return _exports;
}, false);
