/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/core/CommonUtils"], function (Log, ObjectPath, CommonUtils) {
  "use strict";

  const FPMHelper = {
    actionWrapper: function (oEvent, sModule, sMethod, oParameters) {
      return new Promise(function (resolve) {
        var _oSource$getParent, _oSource$getParent2;
        //The source would be command execution, in case a command is defined for the action in the manifest.
        const oSource = oEvent.getSource ? oEvent.getSource() : oEvent.oSource,
          oView = CommonUtils.getTargetView(oSource),
          oBindingContext = oSource.getBindingContext();
        let oExtensionAPI;
        let listBinding;
        let aSelectedContexts;
        if (oParameters !== undefined) {
          aSelectedContexts = oParameters.contexts || [];
        } else if (oBindingContext !== undefined) {
          aSelectedContexts = [oBindingContext];
        } else {
          aSelectedContexts = [];
        }
        if ((_oSource$getParent = oSource.getParent()) !== null && _oSource$getParent !== void 0 && _oSource$getParent.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction") || (_oSource$getParent2 = oSource.getParent()) !== null && _oSource$getParent2 !== void 0 && _oSource$getParent2.isA("sap.m.Menu")) {
          var _FPMHelper$getMdcTabl;
          listBinding = (_FPMHelper$getMdcTabl = FPMHelper.getMdcTable(oSource)) === null || _FPMHelper$getMdcTabl === void 0 ? void 0 : _FPMHelper$getMdcTabl.getRowBinding();
        }
        if (oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" || oView.getControllerName() === "sap.fe.templates.ListReport.ListReportController") {
          oExtensionAPI = oView.getController().getExtensionAPI();
        }
        if (sModule.startsWith("/extension/")) {
          const fnTarget = ObjectPath.get(sModule.replace(/\//g, ".").substr(1), oExtensionAPI);
          resolve(fnTarget[sMethod](oBindingContext, aSelectedContexts, listBinding));
        } else {
          sap.ui.require([sModule], function (module) {
            // - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
            // - we provide the context as API, maybe if needed further properties
            resolve(module[sMethod].bind(oExtensionAPI)(oBindingContext, aSelectedContexts, listBinding));
          });
        }
      });
    },
    getMdcTable: function (control) {
      const parent = control.getParent();
      if (!parent || parent.isA("sap.ui.mdc.Table")) {
        return parent;
      }
      return FPMHelper.getMdcTable(parent);
    },
    validationWrapper: function (sModule, sMethod, oValidationContexts, oView, oBindingContext) {
      return new Promise(function (resolve) {
        let oExtensionAPI;
        if (oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" || oView.getControllerName() === "sap.fe.templates.ListReport.ListReportController") {
          oExtensionAPI = oView.getController().getExtensionAPI();
        }
        sap.ui.require([sModule], function (module) {
          // - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
          // - we provide the context as API, maybe if needed further properties
          resolve(module[sMethod].bind(oExtensionAPI)(oBindingContext, oValidationContexts));
        });
      });
    },
    /**
     * Returns an external custom function defined either in a custom controller extension or in an external module.
     *
     * @param moduleName The external module name, or /extension/<path to the custom controller extension module>
     * @param functionName The name of the function
     * @param source A control in the view or an event triggered by a control in the view
     * @returns The function (or undefined if it couldn't be found)
     */
    getCustomFunction(moduleName, functionName, source) {
      let control;
      if (source.isA("sap.ui.base.Event")) {
        control = source.getSource();
      } else {
        control = source;
      }
      const view = CommonUtils.getTargetView(control);
      const extensionAPI = view.getController().getExtensionAPI();
      let customFunction;
      if (moduleName.startsWith("/extension/")) {
        const controllerExt = ObjectPath.get(moduleName.replace(/\//g, ".").substring(1), extensionAPI);
        customFunction = controllerExt ? controllerExt[functionName] : undefined;
      } else {
        var _module$functionName;
        const module = sap.ui.require(moduleName);
        customFunction = module ? (_module$functionName = module[functionName]) === null || _module$functionName === void 0 ? void 0 : _module$functionName.bind(extensionAPI) : undefined;
      }
      if (!customFunction) {
        Log.error(`Couldn't find method ${functionName} in ${moduleName}`);
      }
      return customFunction;
    }
  };
  return FPMHelper;
}, false);
