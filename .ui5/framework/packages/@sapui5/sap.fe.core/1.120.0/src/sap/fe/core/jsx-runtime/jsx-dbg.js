/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/jsx-runtime/jsx-control", "sap/fe/core/jsx-runtime/jsx-xml"], function (jsxControl, jsxXml) {
  "use strict";

  let renderNextAsXML = false;
  const jsx = function (ControlType, mSettings, key) {
    if (!renderNextAsXML) {
      return jsxControl(ControlType, mSettings, key, jsxContext);
    } else {
      return jsxXml(ControlType, mSettings, key);
    }
  };

  /**
   * Indicates that the next JSX call should be rendered as XML.
   *
   * @param renderMethod The method that needs to be rendered as XML
   * @returns The XML representation of the control
   */
  jsx.renderAsXML = function (renderMethod) {
    renderNextAsXML = true;
    const returnValue = renderMethod();
    renderNextAsXML = false;
    return returnValue;
  };
  let jsxContext = {};
  jsx.getContext = function () {
    return jsxContext;
  };
  jsx.withContext = function (context, functionToExecute) {
    jsxContext = context;
    const callBackReturn = functionToExecute();
    jsxContext = {};
    return callBackReturn;
  };
  return jsx;
}, false);
