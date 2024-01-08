/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/macros/CommonHelper","sap/m/library","sap/ui/core/format/DateFormat","sap/ui/core/format/NumberFormat"],function(t,e,a,r,n){"use strict";const i=a.ValueColor;const o={yyyy:/[1-9][0-9]{3,}|0[0-9]{3}/,Q:/[1-4]/,MM:/0[1-9]|1[0-2]/,ww:/0[1-9]|[1-4][0-9]|5[0-3]/,yyyyMMdd:/([1-9][0-9]{3,}|0[0-9]{3})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/,yyyyMM:/([1-9][0-9]{3,}|0[0-9]{3})(0[1-9]|1[0-2])/,"yyyy-MM-dd":/([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/};const u={getThresholdColor:function(t,e){const a=e.context.getPath();if(a.indexOf("DeviationRange")>-1){return i.Error}else if(a.indexOf("ToleranceRange")>-1){return i.Critical}return i.Neutral},getMeasurePropertyPaths:function(a,r,n){const i=[];if(!r){t.warning("FE:Macro:MicroChart : Couldn't find annotations for the DataPoint.");return undefined}for(const u in a.Measures){var o;const s=e.getMeasureAttributeIndex(u,a),l=s>-1&&a.MeasureAttributes&&a.MeasureAttributes[s],c=l&&r&&r[l.DataPoint.$AnnotationPath];if(c!==null&&c!==void 0&&(o=c.Value)!==null&&o!==void 0&&o.$Path){i.push(c.Value.$Path)}else{t.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute ${n} MicroChart.`)}}return i.join(",")},getHiddenPathExpression:function(){for(var t=arguments.length,e=new Array(t),a=0;a<t;a++){e[a]=arguments[a]}if(!e[0]&&!e[1]){return true}if(e[0]===true||e[1]===true){return false}const r=[];[].forEach.call(e,function(t){if(t&&t.$Path){r.push("%{"+t.$Path+"}")}});return r.length?"{= "+r.join(" || ")+" === true ? false : true }":false},isNotAlwaysHidden:function(t,e,a,r,n){if(r===true){this.logError(t,e)}if(n===true){this.logError(t,a)}if(r===undefined&&n===undefined){return true}else{return(!r||r.$Path)&&r!==undefined||(!n||n.$Path)&&n!==undefined?true:false}},logError:function(e,a){t.error(`Measure Property ${a.$Path} is hidden for the ${e} Micro Chart`)},formatDecimal:function(t,e,a,r){if(t){const r=[],n=["style: 'short'"];const i=typeof a==="number"?a:e&&(e===null||e===void 0?void 0:e.$Scale)||1;if(e.$Nullable!=undefined){r.push("nullable: "+e.$Nullable)}if(e.$Precision!=undefined){n.push("precision: "+(e.$Precision?e.$Precision:"1"))}r.push("scale: "+(i==="variable"?"'"+i+"'":i));return"{ path: '"+t+"'"+", type: 'sap.ui.model.odata.type.Decimal', constraints: { "+r.join(",")+" }, formatOptions: { "+n.join(",")+" } }"}else if(r){const t=typeof a==="number"?a:1;return n.getFloatInstance({style:"short",preserveDecimals:true,decimals:t}).format(r)}},getSelectParameters:function(t,e,a){const r=[],n=[];if(t){n.push(`$$groupId : '${t}'`)}if(a){r.push(a)}else if(e){for(const t in e){if(!e[t].$EnumMember&&e[t].$Path){r.push(e[t].$Path)}}}for(var i=arguments.length,o=new Array(i>3?i-3:0),u=3;u<i;u++){o[u-3]=arguments[u]}for(const t of o){if(t){r.push(t)}}if(r.length){n.push(`$select : '${r.join(",")}'`)}return n.join(",")},getDataPointQualifiersForMeasures:function(e,a,r){const n=[],i=e.MeasureAttributes,o=function(e){const o=e.$PropertyPath;let u;if(a){i.forEach(function(t){var e,r;if(((e=t.Measure)===null||e===void 0?void 0:e.$PropertyPath)===o&&(r=t.DataPoint)!==null&&r!==void 0&&r.$AnnotationPath){const e=t.DataPoint.$AnnotationPath;if(a[e]){u=e.split("#")[1];if(u){n.push(u)}}}})}if(u===undefined){t.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute for ${r} MicroChart.`)}};if(!a){t.warning(`FE:Macro:MicroChart : Couldn't find annotations for the DataPoint ${r} MicroChart.`)}e.Measures.forEach(o);return n.join(",")},logWarning:function(e,a){for(const r in a){if(!a[r]){t.warning(`${r} parameter is missing for the ${e} Micro Chart`)}}},getDisplayValueForMicroChart:function(t,e,a,r){const n=t.ValueFormat&&t.ValueFormat.NumberOfFractionalDigits;if(e){return u.formatDecimal(e["$Path"],a,n)}return u.formatDecimal(t.Value["$Path"],r,n)},shouldMicroChartRender:function(t,e,a,r,n){const i=["Area","Column","Comparison"],o=e&&e.Value,s=a&&a["com.sap.vocabularies.UI.v1.Hidden"],l=r&&r.Dimensions&&r.Dimensions[0],c=i.includes(t)?o&&l:o;if(t==="Harvey"){const t=e&&e.MaximumValue,a=n&&n["com.sap.vocabularies.UI.v1.Hidden"];return o&&t&&u.isNotAlwaysHidden("Bullet",o,t,s,a)}return c&&u.isNotAlwaysHidden(t,o,undefined,s)},getDataPointQualifiersForMicroChart:function(t){if(!t.includes("com.sap.vocabularies.UI.v1.DataPoint")){return undefined}return t.split("#")[1]??""},getColorPaletteForMicroChart:function(t){return t.Criticality?undefined:"sapUiChartPaletteQualitativeHue1, sapUiChartPaletteQualitativeHue2, sapUiChartPaletteQualitativeHue3,          sapUiChartPaletteQualitativeHue4, sapUiChartPaletteQualitativeHue5, sapUiChartPaletteQualitativeHue6, sapUiChartPaletteQualitativeHue7,          sapUiChartPaletteQualitativeHue8, sapUiChartPaletteQualitativeHue9, sapUiChartPaletteQualitativeHue10, sapUiChartPaletteQualitativeHue11"},getMeasureScaleForMicroChart:function(t){if(t.ValueFormat&&t.ValueFormat.NumberOfFractionalDigits){return t.ValueFormat.NumberOfFractionalDigits}if(t.Value&&t.Value["$Path"]&&t.Value["$Path"]["$Scale"]){return t.Value["$Path"]["$Scale"]}return 1},getBindingExpressionForMicrochart:function(t,e,a,r,n,i){const o=r["$isCollection"]||r["$kind"]==="EntitySet";const s=o?"":n;let l=u.getUOMPathForMicrochart(e);let c="";switch(t){case"Radial":l="";break;case"Harvey":c=i.Criticality?i.Criticality["$Path"]:"";break}const f=u.getSelectParameters(a.batchGroupId,"",c,l);return`{ path: '${s}'`+`, parameters : {${f}} }`},getUOMPathForMicrochart:function(t,e){if(e&&!t){return e[`@${"Org.OData.Measures.V1.ISOCurrency"}`]&&e[`@${"Org.OData.Measures.V1.ISOCurrency"}`].$Path||e[`@${"Org.OData.Measures.V1.Unit"}`]&&e[`@${"Org.OData.Measures.V1.Unit"}`].$Path}return undefined},getAggregationForMicrochart:function(t,e,a,r,n,i,o){let s=e["$kind"]==="EntitySet"?"/":"";s=s+r;const l="";let c="";let f=a.Criticality?a.Criticality["$Path"]:"";const h=u.getUOMPathForMicrochart(false,i);let d="";let m="";if(n&&n.$PropertyPath&&n.$PropertyPath[`@${"com.sap.vocabularies.Common.v1.Text"}`]){m=n.$PropertyPath[`@${"com.sap.vocabularies.Common.v1.Text"}`].$Path}else{m=n.$PropertyPath}switch(t){case"Points":c=a&&a.CriticalityCalculation;d=a&&a.TargetValue&&a.TargetValue["$Path"];f="";break;case"Columns":c=a&&a.CriticalityCalculation;break;case"LinePoints":f="";break;case"Bars":m="";break}const $=u.getSelectParameters(l,c,f,h,d,m,o);return`{path:'${s}'`+`, parameters : {${$}} }`},getCurrencyOrUnit:function(t){if(t[`@${"Org.OData.Measures.V1.ISOCurrency"}`]){return t[`@${"Org.OData.Measures.V1.ISOCurrency"}`].$Path||t[`@${"Org.OData.Measures.V1.ISOCurrency"}`]}if(t[`@${"Org.OData.Measures.V1.Unit"}`]){return t[`@${"Org.OData.Measures.V1.Unit"}`].$Path||t[`@${"Org.OData.Measures.V1.Unit"}`]}return""},getCalendarPattern:function(t,e){return e[`@${"com.sap.vocabularies.Common.v1.IsCalendarYear"}`]&&"yyyy"||e[`@${"com.sap.vocabularies.Common.v1.IsCalendarQuarter"}`]&&"Q"||e[`@${"com.sap.vocabularies.Common.v1.IsCalendarMonth"}`]&&"MM"||e[`@${"com.sap.vocabularies.Common.v1.IsCalendarWeek"}`]&&"ww"||e[`@${"com.sap.vocabularies.Common.v1.IsCalendarDate"}`]&&"yyyyMMdd"||e[`@${"com.sap.vocabularies.Common.v1.IsCalendarYearMonth"}`]&&"yyyyMM"||t==="Edm.Date"&&"yyyy-MM-dd"||undefined},formatDimension:function(e,a,n){const i=r.getDateInstance({pattern:a}).parse(e,false,true);if(i instanceof Date){return i.getTime()}else{t.warning("Date value could not be determined for "+n)}return 0},formatStringDimension:function(e,a,r){if(a in o){const t=e===null||e===void 0?void 0:e.toString().match(o[a]);if(t&&t!==null&&t!==void 0&&t.length){return u.formatDimension(t[0],a,r)}}t.warning("Pattern not supported for "+r);return 0},getX:function(t,e,a){const r=a&&u.getCalendarPattern(e,a);if(r&&["Edm.Date","Edm.String"].some(t=>t===e)){return`{parts: [{path: '${t}', targetType: 'any'}, {value: '${r}'}, {value: '${t}'}], formatter: 'MICROCHARTR.formatStringDimension'}`}}};return u},false);
//# sourceMappingURL=MicroChartHelper.js.map