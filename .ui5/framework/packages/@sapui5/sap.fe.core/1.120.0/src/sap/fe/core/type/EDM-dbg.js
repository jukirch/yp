/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  const DefaultTypeForEdmType = {
    "Edm.Binary": {
      modelType: undefined
    },
    "Edm.Boolean": {
      modelType: "Bool"
    },
    "Edm.Byte": {
      modelType: "Int"
    },
    "Edm.Date": {
      modelType: "Date"
    },
    "Edm.DateTime": {
      modelType: "Date"
    },
    "Edm.DateTimeOffset": {
      modelType: "DateTimeOffset"
    },
    "Edm.Decimal": {
      modelType: "Decimal"
    },
    "Edm.Duration": {
      modelType: undefined
    },
    "Edm.Double": {
      modelType: "Float"
    },
    "Edm.Float": {
      modelType: "Float"
    },
    "Edm.Guid": {
      modelType: "Guid"
    },
    "Edm.Int16": {
      modelType: "Int"
    },
    "Edm.Int32": {
      modelType: "Int"
    },
    "Edm.Int64": {
      modelType: "Int"
    },
    "Edm.SByte": {
      modelType: "Int"
    },
    "Edm.Single": {
      modelType: "Float"
    },
    "Edm.String": {
      modelType: "String"
    },
    "Edm.Time": {
      modelType: "TimeOfDay"
    },
    "Edm.TimeOfDay": {
      modelType: "TimeOfDay"
    },
    "Edm.Stream": {
      modelType: undefined
    }
  };
  _exports.DefaultTypeForEdmType = DefaultTypeForEdmType;
  function isTypeFilterable(edmType) {
    var _DefaultTypeForEdmTyp;
    return !!((_DefaultTypeForEdmTyp = DefaultTypeForEdmType[edmType]) !== null && _DefaultTypeForEdmTyp !== void 0 && _DefaultTypeForEdmTyp.modelType);
  }
  _exports.isTypeFilterable = isTypeFilterable;
  function getModelType(edmType) {
    var _DefaultTypeForEdmTyp2;
    return (_DefaultTypeForEdmTyp2 = DefaultTypeForEdmType[edmType]) === null || _DefaultTypeForEdmTyp2 === void 0 ? void 0 : _DefaultTypeForEdmTyp2.modelType;
  }
  _exports.getModelType = getModelType;
  return _exports;
}, false);
