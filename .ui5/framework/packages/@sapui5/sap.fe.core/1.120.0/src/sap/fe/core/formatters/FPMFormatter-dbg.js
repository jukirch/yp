/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const customBooleanPropertyCheck = function (oView, modulePath, aSelectedContexts) {
    const oExtensionAPI = oView.getController().getExtensionAPI();
    const parts = modulePath.split(".");
    const methodName = parts.pop();
    const moduleName = parts.join("/");
    return new Promise(resolve => {
      sap.ui.require([moduleName], module => {
        resolve(module[methodName].bind(oExtensionAPI)(this.getBindingContext(), aSelectedContexts || []));
      });
    });
  };
  customBooleanPropertyCheck.__functionName = "sap.fe.core.formatters.FPMFormatter#customBooleanPropertyCheck";

  /**
   * Collection of table formatters.
   *
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const fpmFormatter = function (sName) {
    if (fpmFormatter.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return fpmFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  fpmFormatter.customBooleanPropertyCheck = customBooleanPropertyCheck;

  /**
   * @global
   */
  return fpmFormatter;
}, true);
