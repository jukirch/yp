/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  // ENUMS
  let TemplateType;
  (function (TemplateType) {
    TemplateType["ListReport"] = "ListReport";
    TemplateType["ObjectPage"] = "ObjectPage";
    TemplateType["AnalyticalListPage"] = "AnalyticalListPage";
    TemplateType["FreeStylePage"] = "None";
  })(TemplateType || (TemplateType = {}));
  _exports.TemplateType = TemplateType;
  let ActionType;
  (function (ActionType) {
    ActionType["DataFieldForAction"] = "ForAction";
    ActionType["DataFieldForIntentBasedNavigation"] = "ForNavigation";
    ActionType["Default"] = "Default";
    ActionType["Primary"] = "Primary";
    ActionType["Secondary"] = "Secondary";
    ActionType["SwitchToActiveObject"] = "SwitchToActiveObject";
    ActionType["SwitchToDraftObject"] = "SwitchToDraftObject";
    ActionType["DraftActions"] = "DraftActions";
    ActionType["CollaborationAvatars"] = "CollaborationAvatars";
    ActionType["DefaultApply"] = "DefaultApply";
    ActionType["Menu"] = "Menu";
    ActionType["ShowFormDetails"] = "ShowFormDetails";
    ActionType["Copy"] = "Copy";
    ActionType["Cut"] = "Cut";
    ActionType["Standard"] = "Standard";
  })(ActionType || (ActionType = {}));
  _exports.ActionType = ActionType;
  let SelectionMode;
  (function (SelectionMode) {
    SelectionMode["Auto"] = "Auto";
    SelectionMode["None"] = "None";
    SelectionMode["Multi"] = "Multi";
    SelectionMode["Single"] = "Single";
    SelectionMode["ForceMulti"] = "ForceMulti";
    SelectionMode["ForceSingle"] = "ForceSingle";
  })(SelectionMode || (SelectionMode = {}));
  _exports.SelectionMode = SelectionMode;
  let VariantManagementType;
  (function (VariantManagementType) {
    VariantManagementType["Page"] = "Page";
    VariantManagementType["Control"] = "Control";
    VariantManagementType["None"] = "None";
  })(VariantManagementType || (VariantManagementType = {}));
  _exports.VariantManagementType = VariantManagementType;
  let CreationMode;
  (function (CreationMode) {
    CreationMode["NewPage"] = "NewPage";
    CreationMode["Inline"] = "Inline";
    CreationMode["CreationRow"] = "CreationRow";
    CreationMode["InlineCreationRows"] = "InlineCreationRows";
    CreationMode["External"] = "External";
  })(CreationMode || (CreationMode = {}));
  _exports.CreationMode = CreationMode;
  let VisualizationType; // Table
  (function (VisualizationType) {
    VisualizationType["Table"] = "Table";
    VisualizationType["Chart"] = "Chart";
    VisualizationType["MultiDimensionalGrid"] = "MultiDimensionalGrid";
  })(VisualizationType || (VisualizationType = {}));
  _exports.VisualizationType = VisualizationType;
  let Importance;
  (function (Importance) {
    Importance["High"] = "High";
    Importance["Medium"] = "Medium";
    Importance["Low"] = "Low";
    Importance["None"] = "None";
  })(Importance || (Importance = {}));
  _exports.Importance = Importance;
  let HorizontalAlign; // TYPES
  (function (HorizontalAlign) {
    HorizontalAlign["End"] = "End";
    HorizontalAlign["Begin"] = "Begin";
    HorizontalAlign["Center"] = "Center";
  })(HorizontalAlign || (HorizontalAlign = {}));
  _exports.HorizontalAlign = HorizontalAlign;
  return _exports;
}, false);
