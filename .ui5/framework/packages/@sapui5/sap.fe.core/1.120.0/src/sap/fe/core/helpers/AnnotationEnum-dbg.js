/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  // This list needs to come from AVT
  const ENUM_VALUES = {
    "com.sap.vocabularies.Common.v1.FieldControlType": {
      Mandatory: 7,
      Optional: 3,
      ReadOnly: 0,
      Inapplicable: 0,
      Disabled: 1
    }
  };
  const resolveEnumValue = function (enumName) {
    const [termName, value] = enumName.split("/");
    if (ENUM_VALUES.hasOwnProperty(termName)) {
      return ENUM_VALUES[termName][value];
    } else {
      return false;
    }
  };
  _exports.resolveEnumValue = resolveEnumValue;
  return _exports;
}, false);
