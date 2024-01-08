/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/helpers/StableIdHelper","sap/fe/core/helpers/TypeGuards","../InteractiveChartHelper"],function(e,t,a,i){"use strict";var r={};var o=a.isPathAnnotationExpression;var s=t.generate;var n=e.xml;function l(e){const t=i.getInteractiveChartProperties(e);if(t){var a,r,l,u,c,m,d,p;const i=s([(a=e.metaPath)===null||a===void 0?void 0:a.getPath()]);const v=(r=e.chartAnnotation)===null||r===void 0?void 0:r.Dimensions[0];return n`<InteractiveLineChart
                        xmlns="sap.suite.ui.microchart"
                        xmlns:core="sap.ui.core"
                        xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
                        core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                        visible="{= ${t.showErrorExpression}}"
                        selectionChanged="VisualFilterRuntime.selectionChanged"
                        showError="{= ${t.showErrorExpression}}"
                        errorMessageTitle="${t.errorMessageTitleExpression}"
                        errorMessage="${t.errorMessageExpression}"
                        points="${t.aggregationBinding}"
                        customData:outParameter="${e.outParameter}"
                        customData:valuelistProperty="${e.valuelistProperty}"
                        customData:multipleSelectionAllowed="${e.multipleSelectionAllowed}"
                        customData:dimension="${v===null||v===void 0?void 0:(l=v.$target)===null||l===void 0?void 0:l.name}"
                        customData:dimensionText="${o(v===null||v===void 0?void 0:(u=v.$target)===null||u===void 0?void 0:(c=u.annotations.Common)===null||c===void 0?void 0:c.Text)?v===null||v===void 0?void 0:(m=v.$target)===null||m===void 0?void 0:(d=m.annotations.Common)===null||d===void 0?void 0:d.Text.path:undefined}"
                        customData:measure="${e.chartMeasure}"
                        customData:scalefactor="${t.scalefactor}"
                        customData:uom="${t.uom}"
                        customData:inParameters="${t.inParameters}"
                        customData:inParameterConditions="${t.inParameterFilters}"
                        customData:dimensionType="${v===null||v===void 0?void 0:(p=v.$target)===null||p===void 0?void 0:p.type}"
                        customData:selectionVariantAnnotation="${t.selectionVariantAnnotation}"
                        customData:required="${e.required}"
                        customData:showOverlayInitially="${e.showOverlayInitially}"
                        customData:requiredProperties="${e.requiredProperties}"
                        customData:infoPath="${i}"
                        customData:parameters="${t.stringifiedParameters}"
                        customData:draftSupported="${e.draftSupported}"
                    >
                        <points>
                            <InteractiveLineChartPoint
                                core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
                                label="${t.chartLabel}"
                                value="${t.measure}"
                                displayedValue="${t.displayedValue}"
                                color="${t.color}"
                                selected="{path: '$field>/conditions', formatter: 'sap.fe.macros.visualfilters.VisualFilterRuntime.getAggregationSelected'}"
                            />
                        </points>
             </InteractiveLineChart>`}return""}r.getInteractiveLineChartTemplate=l;return r},false);
//# sourceMappingURL=InteractiveLineChart.js.map