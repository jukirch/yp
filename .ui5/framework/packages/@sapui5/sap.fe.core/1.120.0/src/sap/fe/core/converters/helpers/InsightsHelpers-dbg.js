/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["../../helpers/BindingToolkit", "../ManifestSettings"], function (BindingToolkit, ManifestSettings) {
  "use strict";

  var _exports = {};
  var TemplateType = ManifestSettings.TemplateType;
  var pathInModel = BindingToolkit.pathInModel;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var and = BindingToolkit.and;
  /**
   * Gets the boolean value for the 'visible' property of the 'AddCardToInsights' action.
   *
   * @param cardType
   * @param converterContext
   * @param visualizationPath
   * @param standardActionsContext
   * @returns Boolean value for the 'visible' property of the 'AddCardToInsights' action.
   */
  function getInsightsVisibility(cardType, converterContext, visualizationPath, standardActionsContext) {
    var _vizPathConfiguration;
    let tableManifestConfig, isResponsiveTable;
    const isMultiEntity = converterContext.getManifestWrapper().hasMultipleEntitySets();
    const isMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations();
    const viewConfig = converterContext.getManifestWrapper().getViewConfiguration();
    const isMultiTabs = viewConfig !== undefined && viewConfig.paths.length > 1 ? true : false;
    const templateBindingExpression = converterContext.getTemplateType() === TemplateType.ListReport;
    const vizPathConfiguration = converterContext.getManifestControlConfiguration(visualizationPath);
    const enableAddCardToInsights = cardType === "Analytical" ? (vizPathConfiguration === null || vizPathConfiguration === void 0 ? void 0 : vizPathConfiguration.enableAddCardToInsights) ?? true : (vizPathConfiguration === null || vizPathConfiguration === void 0 ? void 0 : (_vizPathConfiguration = vizPathConfiguration.tableSettings) === null || _vizPathConfiguration === void 0 ? void 0 : _vizPathConfiguration.enableAddCardToInsights) ?? true;
    if (cardType === "Table") {
      var _tableManifestConfig;
      tableManifestConfig = standardActionsContext === null || standardActionsContext === void 0 ? void 0 : standardActionsContext.tableManifestConfiguration;
      isResponsiveTable = ((_tableManifestConfig = tableManifestConfig) === null || _tableManifestConfig === void 0 ? void 0 : _tableManifestConfig.type) === "ResponsiveTable";
    }
    return and(constant(enableAddCardToInsights), constant(templateBindingExpression), constant(!isMultiEntity), constant(!isMultiTabs), constant(cardType === "Table" ? (isResponsiveTable ?? false) && !isMultipleVisualizations : true), equal(pathInModel("isInsightsSupported", "pageInternal"), true));
  }
  _exports.getInsightsVisibility = getInsightsVisibility;
  function getInsightsEnablement() {
    return equal(pathInModel("isInsightsEnabled", "internal"), true);
  }
  _exports.getInsightsEnablement = getInsightsEnablement;
  return _exports;
}, false);
