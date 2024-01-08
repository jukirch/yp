/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  let MessageType;
  (function (MessageType) {
    MessageType["Error"] = "Error";
    MessageType["Information"] = "Information";
    MessageType["None"] = "None";
    MessageType["Success"] = "Success";
    MessageType["Warning"] = "Warning";
  })(MessageType || (MessageType = {}));
  _exports.MessageType = MessageType;
  return _exports;
}, false);
