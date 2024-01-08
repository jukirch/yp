/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  const getPath = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return oInterface.context.getPath();
    }
    return "";
  };
  getPath.requiresIContext = true;
  _exports.getPath = getPath;
  return _exports;
}, false);
