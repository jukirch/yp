/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/helpers/StableIdHelper","sap/fe/core/helpers/TypeGuards","../InteractiveChartHelper"],function(e,t,a,r){"use strict";var i={};var o=a.isPathAnnotationExpression;var s=t.generate;var n=e.xml;function l(e){const t=r.getInteractiveChartProperties(e);if(t){var a,i,l,u,c,m,d,v;const r=s([(a=e.metaPath)===null||a===void 0?void 0:a.getPath()]);const p=(i=e.chartAnnotation)===null||i===void 0?void 0:i.Dimensions[0];return n`<InteractiveBarChart
                            xmlns="sap.suite.ui.microchart"
                            xmlns:core="sap.ui.core"
                            xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
                            core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                            visible="{= ${t.showErrorExpression}}"
                            selectionChanged="VisualFilterRuntime.selectionChanged"
                            showError="{= ${t.showErrorExpression}}"
                            errorMessageTitle="${t.errorMessageTitleExpression}"
                            errorMessage="${t.errorMessageExpression}"
                            bars="${t.aggregationBinding}"
                            customData:outParameter="${e.outParameter}"
                            customData:valuelistProperty="${e.valuelistProperty}"
                            customData:multipleSelectionAllowed="${e.multipleSelectionAllowed}"
                            customData:dimension="${p===null||p===void 0?void 0:(l=p.$target)===null||l===void 0?void 0:l.name}"
                            customData:dimensionText="${o(p===null||p===void 0?void 0:(u=p.$target)===null||u===void 0?void 0:(c=u.annotations.Common)===null||c===void 0?void 0:c.Text)?p===null||p===void 0?void 0:(m=p.$target)===null||m===void 0?void 0:(d=m.annotations.Common)===null||d===void 0?void 0:d.Text.path:undefined}"
                            customData:scalefactor="${t.scalefactor}"
                            customData:measure="${e.chartMeasure}"
                            customData:uom="${t.uom}"
                            customData:inParameters="${t.inParameters}"
                            customData:inParameterFilters="${t.inParameterFilters}"
                            customData:dimensionType="${p===null||p===void 0?void 0:(v=p.$target)===null||v===void 0?void 0:v.type}"
                            customData:selectionVariantAnnotation="${t.selectionVariantAnnotation}"
                            customData:required="${e.required}"
                            customData:showOverlayInitially="${e.showOverlayInitially}"
                            customData:requiredProperties="${e.requiredProperties}"
                            customData:infoPath="${r}"
                            customData:parameters="${t.stringifiedParameters}"
                            customData:draftSupported="${e.draftSupported}"
                        >
                            <bars>
                                <InteractiveBarChartBar
                                    core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                                    label="${t.chartLabel}"
                                    value="${t.measure}"
                                    displayedValue="${t.displayedValue}"
                                    color="${t.color}"
                                    selected="{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
                                />
                            </bars>
                        </InteractiveBarChart>`}return""}i.getInteractiveBarChartTemplate=l;return i},false);
//# sourceMappingURL=InteractiveBarChart.js.map