/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/library", "sap/fe/macros/filter/type/MultiValue", "sap/fe/macros/filter/type/Range", "sap/fe/macros/macroLibrary", "sap/ui/core/Core", "sap/ui/core/CustomData", "sap/ui/core/Fragment", "sap/ui/core/library", "sap/ui/core/XMLTemplateProcessor", "sap/ui/mdc/field/ConditionsType", "sap/ui/mdc/library", "sap/ui/unified/library"], function (_library, _MultiValue, _Range, _macroLibrary, Core, CustomData, Fragment, _library2, _XMLTemplateProcessor, _ConditionsType, _library3, _library4) {
  "use strict";

  var _exports = {};
  /**
   * Library containing the building blocks for SAP Fiori elements.
   *
   * @namespace
   * @name sap.fe.macros
   * @public
   */
  const macrosNamespace = "sap.fe.macros";

  // library dependencies
  _exports.macrosNamespace = macrosNamespace;
  const thisLib = Core.initLibrary({
    name: "sap.fe.macros",
    dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.m"],
    types: ["sap.fe.macros.NavigationType"],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.120.0",
    noLibraryCSS: true
  });
  thisLib.NavigationType = {
    /**
     * For External Navigation
     *
     * @public
     */
    External: "External",
    /**
     * For In-Page Navigation
     *
     * @public
     */
    InPage: "InPage",
    /**
     * For No Navigation
     *
     * @public
     */
    None: "None"
  };
  Fragment.registerType("CUSTOM", {
    load: Fragment.getType("XML").load,
    init: async function (mSettings) {
      const currentController = mSettings.containingView.getController();
      let targetControllerExtension = currentController;
      if (currentController && !currentController.isA("sap.fe.core.ExtensionAPI")) {
        targetControllerExtension = currentController.getExtensionAPI();
      }
      mSettings.containingView = {
        oController: targetControllerExtension
      };
      const childCustomData = mSettings.childCustomData ?? undefined;
      delete mSettings.childCustomData;
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      const result = await Fragment.getType("XML").init.apply(this, [mSettings, args]);
      if (childCustomData && result !== null && result !== void 0 && result.isA("sap.ui.core.Control")) {
        for (const customDataKey in childCustomData) {
          result.addCustomData(new CustomData({
            key: customDataKey,
            value: childCustomData[customDataKey]
          }));
        }
      }
      return result;
    }
  });
  return thisLib;
}, false);
