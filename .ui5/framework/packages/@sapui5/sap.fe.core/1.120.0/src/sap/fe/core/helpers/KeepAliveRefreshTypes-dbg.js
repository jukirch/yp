/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Enumeration for supported refresh strategy type
   */
  let RefreshStrategyType;
  /**
   * Configuration of a RefreshStrategy
   */
  (function (RefreshStrategyType) {
    RefreshStrategyType["Self"] = "self";
    RefreshStrategyType["IncludingDependents"] = "includingDependents";
  })(RefreshStrategyType || (RefreshStrategyType = {}));
  _exports.RefreshStrategyType = RefreshStrategyType;
  /**
   * Path used to store information
   */
  const PATH_TO_STORE = "/refreshStrategyOnAppRestore";
  _exports.PATH_TO_STORE = PATH_TO_STORE;
  return _exports;
}, false);
