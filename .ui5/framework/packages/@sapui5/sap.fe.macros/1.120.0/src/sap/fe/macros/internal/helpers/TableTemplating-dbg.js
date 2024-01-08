/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit"], function (BindingToolkit) {
  "use strict";

  var _exports = {};
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var not = BindingToolkit.not;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Method to compute the headerVisible property.
   *
   * @param oProps Object containing the table properties
   * @returns Expression binding for headerVisible
   */
  const buildExpressionForHeaderVisible = oProps => {
    const headerBindingExpression = resolveBindingString(oProps === null || oProps === void 0 ? void 0 : oProps.header);
    const tabTileBindingExpression = resolveBindingString(oProps === null || oProps === void 0 ? void 0 : oProps.tabTitle);
    const headerVisibleBindingExpression = constant(oProps.headerVisible);
    return compileExpression(and(headerVisibleBindingExpression, not(equal(headerBindingExpression, tabTileBindingExpression))));
  };
  _exports.buildExpressionForHeaderVisible = buildExpressionForHeaderVisible;
  return _exports;
}, false);
