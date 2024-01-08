/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"], function (BuildingBlockTemplateProcessor) {
  "use strict";

  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  function getInteractiveChartWithErrorTemplate(visualFilter) {
    const chartAnnotation = visualFilter.chartAnnotation;
    if (visualFilter.chartMeasure && chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.Dimensions && chartAnnotation.Dimensions[0]) {
      return xml`<InteractiveLineChart
                        xmlns="sap.suite.ui.microchart"
                        xmlns:core="sap.ui.core"
                        core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                        showError="${visualFilter.showError}"
                        errorMessageTitle="${visualFilter.errorMessageTitle}"
                        errorMessage="${visualFilter.errorMessage}"
                    />`;
    }
    return "";
  }
  _exports.getInteractiveChartWithErrorTemplate = getInteractiveChartWithErrorTemplate;
  return _exports;
}, false);
