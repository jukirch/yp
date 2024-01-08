/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "../InteractiveChartHelper"], function (BuildingBlockTemplateProcessor, StableIdHelper, TypeGuards, InteractiveChartHelper) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  var xml = BuildingBlockTemplateProcessor.xml;
  function getInteractiveBarChartTemplate(visualFilter) {
    const interactiveChartProperties = InteractiveChartHelper.getInteractiveChartProperties(visualFilter);
    if (interactiveChartProperties) {
      var _visualFilter$metaPat, _visualFilter$chartAn, _dimension$$target, _dimension$$target2, _dimension$$target2$a, _dimension$$target3, _dimension$$target3$a, _dimension$$target4;
      const id = generate([(_visualFilter$metaPat = visualFilter.metaPath) === null || _visualFilter$metaPat === void 0 ? void 0 : _visualFilter$metaPat.getPath()]);
      const dimension = (_visualFilter$chartAn = visualFilter.chartAnnotation) === null || _visualFilter$chartAn === void 0 ? void 0 : _visualFilter$chartAn.Dimensions[0];
      return xml`<InteractiveBarChart
                            xmlns="sap.suite.ui.microchart"
                            xmlns:core="sap.ui.core"
                            xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
                            core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                            visible="{= ${interactiveChartProperties.showErrorExpression}}"
                            selectionChanged="VisualFilterRuntime.selectionChanged"
                            showError="{= ${interactiveChartProperties.showErrorExpression}}"
                            errorMessageTitle="${interactiveChartProperties.errorMessageTitleExpression}"
                            errorMessage="${interactiveChartProperties.errorMessageExpression}"
                            bars="${interactiveChartProperties.aggregationBinding}"
                            customData:outParameter="${visualFilter.outParameter}"
                            customData:valuelistProperty="${visualFilter.valuelistProperty}"
                            customData:multipleSelectionAllowed="${visualFilter.multipleSelectionAllowed}"
                            customData:dimension="${dimension === null || dimension === void 0 ? void 0 : (_dimension$$target = dimension.$target) === null || _dimension$$target === void 0 ? void 0 : _dimension$$target.name}"
                            customData:dimensionText="${isPathAnnotationExpression(dimension === null || dimension === void 0 ? void 0 : (_dimension$$target2 = dimension.$target) === null || _dimension$$target2 === void 0 ? void 0 : (_dimension$$target2$a = _dimension$$target2.annotations.Common) === null || _dimension$$target2$a === void 0 ? void 0 : _dimension$$target2$a.Text) ? dimension === null || dimension === void 0 ? void 0 : (_dimension$$target3 = dimension.$target) === null || _dimension$$target3 === void 0 ? void 0 : (_dimension$$target3$a = _dimension$$target3.annotations.Common) === null || _dimension$$target3$a === void 0 ? void 0 : _dimension$$target3$a.Text.path : undefined}"
                            customData:scalefactor="${interactiveChartProperties.scalefactor}"
                            customData:measure="${visualFilter.chartMeasure}"
                            customData:uom="${interactiveChartProperties.uom}"
                            customData:inParameters="${interactiveChartProperties.inParameters}"
                            customData:inParameterFilters="${interactiveChartProperties.inParameterFilters}"
                            customData:dimensionType="${dimension === null || dimension === void 0 ? void 0 : (_dimension$$target4 = dimension.$target) === null || _dimension$$target4 === void 0 ? void 0 : _dimension$$target4.type}"
                            customData:selectionVariantAnnotation="${interactiveChartProperties.selectionVariantAnnotation}"
                            customData:required="${visualFilter.required}"
                            customData:showOverlayInitially="${visualFilter.showOverlayInitially}"
                            customData:requiredProperties="${visualFilter.requiredProperties}"
                            customData:infoPath="${id}"
                            customData:parameters="${interactiveChartProperties.stringifiedParameters}"
                            customData:draftSupported="${visualFilter.draftSupported}"
                        >
                            <bars>
                                <InteractiveBarChartBar
                                    core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                                    label="${interactiveChartProperties.chartLabel}"
                                    value="${interactiveChartProperties.measure}"
                                    displayedValue="${interactiveChartProperties.displayedValue}"
                                    color="${interactiveChartProperties.color}"
                                    selected="{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
                                />
                            </bars>
                        </InteractiveBarChart>`;
    }
    return "";
  }
  _exports.getInteractiveBarChartTemplate = getInteractiveBarChartTemplate;
  return _exports;
}, false);
