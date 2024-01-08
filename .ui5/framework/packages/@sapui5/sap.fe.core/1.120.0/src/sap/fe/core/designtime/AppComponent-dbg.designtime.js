/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _sap$ushell, _urlParams$fioriTool, _urlParams$fioriTool$;
  const urlParserMock = {
    parseParameters: function () {
      return {};
    }
  };
  const urlParser = (_sap$ushell = sap.ushell) !== null && _sap$ushell !== void 0 && _sap$ushell.Container ? sap.ushell.Container.getService("URLParsing") : urlParserMock;
  const urlParams = urlParser.parseParameters(window.location.search);
  const fioriToolsRtaMode = ((_urlParams$fioriTool = urlParams["fiori-tools-rta-mode"]) === null || _urlParams$fioriTool === void 0 ? void 0 : (_urlParams$fioriTool$ = _urlParams$fioriTool[0]) === null || _urlParams$fioriTool$ === void 0 ? void 0 : _urlParams$fioriTool$.toLowerCase()) === "true";
  const getAllowList = function (element) {
    let allowList = {};
    const elementName = element.getMetadata().getName();
    if (fioriToolsRtaMode) {
      // build the allow list for Fiori tools (developers)
      allowList = {
        "sap.fe.core.controls.FilterBar": true,
        "sap.ui.fl.variants.VariantManagement": true,
        "sap.ui.mdc.Table": true
      };
    } else {
      var _element$getParent, _element$getParent2;
      // build the allow list for UI Adaptation (key users)
      allowList = {
        "sap.fe.core.controls.FilterBar": true,
        "sap.fe.templates.ObjectPage.controls.StashableHBox": true,
        "sap.fe.templates.ObjectPage.controls.StashableVBox": true,
        "sap.m.IconTabBar": true,
        "sap.ui.fl.util.IFrame": true,
        "sap.ui.fl.variants.VariantManagement": true,
        "sap.ui.layout.form.Form": true,
        "sap.ui.layout.form.FormContainer": true,
        "sap.ui.layout.form.FormElement": true,
        "sap.ui.mdc.Table": true,
        "sap.uxap.AnchorBar": true,
        "sap.uxap.ObjectPageLayout": true,
        "sap.uxap.ObjectPageSection": true,
        "sap.uxap.ObjectPageSubSection": true
      };
      // currently we support the adaptation of MenuButtons only for the AnchorBar on Object Page (adaptation of sections and subsections)
      if (elementName === "sap.m.MenuButton" && ((_element$getParent = element.getParent()) === null || _element$getParent === void 0 ? void 0 : _element$getParent.getMetadata().getName()) === "sap.uxap.AnchorBar") {
        allowList["sap.m.MenuButton"] = true;
      }
      // currently we support the adaptation of Buttons only for the AnchorBar on Object Page (adaptation of sections and subsections)
      if (elementName === "sap.m.Button" && ((_element$getParent2 = element.getParent()) === null || _element$getParent2 === void 0 ? void 0 : _element$getParent2.getMetadata().getName()) === "sap.uxap.AnchorBar") {
        allowList["sap.m.Button"] = true;
      }
      // the adaptation of FlexBoxes is only supported for the HeaderContainer on Object Page
      if (elementName === "sap.m.FlexBox" && element.getId().includes("--fe::HeaderContentContainer")) {
        allowList["sap.m.FlexBox"] = true;
      }
    }
    return allowList;
  };

  // To enable all actions, remove the propagateMetadata function. Or, remove this file and its entry in AppComponent.js referring 'designTime'.
  const AppComponentDesignTime = {
    actions: "not-adaptable",
    aggregations: {
      rootControl: {
        actions: "not-adaptable",
        propagateMetadata: function (element) {
          const allowList = getAllowList(element);
          if (allowList[element.getMetadata().getName()]) {
            // by returning the empty object, the same will be merged with element's native designtime definition, i.e. all actions will be enabled for this element
            return {};
          } else {
            // not-adaptable will be interpreted by flex to disable all actions for this element
            return {
              actions: "not-adaptable"
            };
          }
        }
      }
    },
    tool: {
      start: function (appComponent) {
        appComponent.getEnvironmentCapabilities().setCapability("AppState", false);
      },
      stop: function (appComponent) {
        appComponent.getEnvironmentCapabilities().setCapability("AppState", true);
      }
    }
  };
  return AppComponentDesignTime;
}, false);
