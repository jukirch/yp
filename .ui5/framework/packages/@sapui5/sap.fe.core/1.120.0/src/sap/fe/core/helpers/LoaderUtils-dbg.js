/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  async function requireDependencies(dependencyNames) {
    let resolveFn;
    const awaiter = new Promise(resolve => {
      resolveFn = resolve;
    });
    if (dependencyNames.length > 0) {
      sap.ui.require(dependencyNames, function () {
        for (var _len = arguments.length, dependencies = new Array(_len), _key = 0; _key < _len; _key++) {
          dependencies[_key] = arguments[_key];
        }
        resolveFn(dependencies);
      });
    } else {
      resolveFn([]);
    }
    return awaiter;
  }
  _exports.requireDependencies = requireDependencies;
  return _exports;
}, false);
