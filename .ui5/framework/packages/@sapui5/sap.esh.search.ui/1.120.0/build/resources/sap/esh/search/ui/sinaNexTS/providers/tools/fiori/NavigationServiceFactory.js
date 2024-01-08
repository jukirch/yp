/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define([], function () {
  var navigationServicePromise;
  function getNavigationService() {
    var _window, _window$sap, _window$sap$ushell, _window$sap$ushell$Co;
    if (navigationServicePromise) {
      return navigationServicePromise;
    }
    var getServiceAsync = typeof window !== "undefined" ? (_window = window) === null || _window === void 0 ? void 0 : (_window$sap = _window.sap) === null || _window$sap === void 0 ? void 0 : (_window$sap$ushell = _window$sap.ushell) === null || _window$sap$ushell === void 0 ? void 0 : (_window$sap$ushell$Co = _window$sap$ushell["Container"]) === null || _window$sap$ushell$Co === void 0 ? void 0 : _window$sap$ushell$Co["getServiceAsync"] : null; // not available for sina on node.js
    if (getServiceAsync) {
      navigationServicePromise = getServiceAsync("CrossApplicationNavigation");
    } else {
      navigationServicePromise = Promise.resolve(undefined);
    }
    return navigationServicePromise;
  }
  var __exports = {
    __esModule: true
  };
  __exports.getNavigationService = getNavigationService;
  return __exports;
});
})();