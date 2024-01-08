/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core", "sap/ui/core/library"], function (Core, _library) {
  "use strict";

  var _exports = {};
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.ParamHandlingMode}.<br>
   * A static enumeration type which indicates the conflict resolution method when merging URL parameters into select options.
   *
   * @public
   * @enum {string}
   * @readonly
   * @since 1.83.0
   */
  let ParamHandlingMode;
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.NavType}.<br>
   * A static enumeration type which indicates the type of inbound navigation.
   *
   * @enum {string}
   * @readonly
   * @public
   * @since 1.86.0
   */
  (function (ParamHandlingMode) {
    ParamHandlingMode["SelVarWins"] = "SelVarWins";
    ParamHandlingMode["URLParamWins"] = "URLParamWins";
    ParamHandlingMode["InsertInSelOpt"] = "InsertInSelOpt";
  })(ParamHandlingMode || (ParamHandlingMode = {}));
  _exports.ParamHandlingMode = ParamHandlingMode;
  let NavType;
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.SuppressionBehavior}.<br>
   * A static enumeration type which indicates whether semantic attributes with values <code>null</code>,
   * <code>undefined</code> or <code>""</code> (empty string) shall be suppressed, before they are mixed in to the selection variant in the
   * method {@link sap.fe.navigation.NavigationHandler.mixAttributesAndSelectionVariant mixAttributesAndSelectionVariant}
   * of the {@link sap.fe.navigation.NavigationHandler NavigationHandler}.
   *
   * @public
   * @enum {string}
   * @readonly
   * @since 1.83.0
   */
  (function (NavType) {
    NavType["initial"] = "initial";
    NavType["URLParams"] = "URLParams";
    NavType["xAppState"] = "xAppState";
    NavType["iAppState"] = "iAppState";
    NavType["hybrid"] = "hybrid";
  })(NavType || (NavType = {}));
  _exports.NavType = NavType;
  let SuppressionBehavior;
  /**
   * A static enumeration type which indicates the Odata version used for runnning the Navigation Handler.
   *
   * @public
   * @enum {string}
   * @readonly
   * @since 1.83.0
   */
  (function (SuppressionBehavior) {
    SuppressionBehavior[SuppressionBehavior["standard"] = 0] = "standard";
    SuppressionBehavior[SuppressionBehavior["ignoreEmptyString"] = 1] = "ignoreEmptyString";
    SuppressionBehavior[SuppressionBehavior["raiseErrorOnNull"] = 2] = "raiseErrorOnNull";
    SuppressionBehavior[SuppressionBehavior["raiseErrorOnUndefined"] = 4] = "raiseErrorOnUndefined";
  })(SuppressionBehavior || (SuppressionBehavior = {}));
  _exports.SuppressionBehavior = SuppressionBehavior;
  let Mode;
  /**
   * Common library for all cross-application navigation functions.
   *
   * @namespace
   * @public
   */
  (function (Mode) {
    Mode["ODataV2"] = "ODataV2";
    Mode["ODataV4"] = "ODataV4";
  })(Mode || (Mode = {}));
  _exports.Mode = Mode;
  const feNavigationNamespace = "sap.fe.navigation";

  /**
   * Common library for all cross-application navigation functions.
   *
   * @public
   * @name sap.fe.navigation
   * @since 1.83.0
   */
  _exports.feNavigationNamespace = feNavigationNamespace;
  const thisLib = Core.initLibrary({
    name: "sap.fe.navigation",
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.120.0",
    dependencies: ["sap.ui.core"],
    types: ["sap.fe.navigation.NavType", "sap.fe.navigation.ParamHandlingMode", "sap.fe.navigation.SuppressionBehavior"],
    interfaces: [],
    controls: [],
    elements: [],
    noLibraryCSS: true
  });
  thisLib.ParamHandlingMode = ParamHandlingMode;
  thisLib.NavType = NavType;
  thisLib.SuppressionBehavior = SuppressionBehavior;
  thisLib.Mode = Mode;
  return thisLib;
}, false);
