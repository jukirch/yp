/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var NavigationReason;
  (function (NavigationReason) {
    NavigationReason["RowPress"] = "RowPress";
    NavigationReason["AppStateChanged"] = "AppStateChanged";
    NavigationReason["RestoreHistory"] = "RestoreHistory";
    NavigationReason["EditFlowAction"] = "EditFlowAction";
  })(NavigationReason || (NavigationReason = {}));
  return NavigationReason;
}, false);
