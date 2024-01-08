/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter","../templating/UIFormatters"],function(e,t){"use strict";var o={};var n=t.getDisplayMode;const d={storeRecommendations:(e,t,o)=>{const n=t.getProperty("/recommendationsData")||{};d.clearRecommendationsForContextOnly(n,o);d.enhanceRecommendationModel(e,n);n["version"]=2;t.setProperty("/recommendationsData",n);t.refresh(true)},clearRecommendationsForContextOnly:(e,t)=>{if(t){Object.keys(e).forEach(o=>{const n=o.lastIndexOf(")");if(t.find(e=>e.getPath()===o.substring(0,n+1))){delete e[o]}})}},enhanceRecommendationModel:(e,t)=>{e===null||e===void 0?void 0:e.forEach(e=>{const o=e.AIRecommendedFieldPath;if(o){var n;const d=[];let a=false;(n=e._AIAltvRecmddFldVals)===null||n===void 0?void 0:n.forEach(t=>{const o={value:t.AIRecommendedFieldValue,probability:t.AIRecommendedFieldScoreValue};if(e.AIRecommendedFieldValue===t.AIRecommendedFieldValue){a=true}d.push(o)});t[o]={value:a?e.AIRecommendedFieldValue:undefined,text:a?e.AIRecommendedFieldDescription:undefined,additionalValues:d}}})},getStandardRecommendations:function(e,t,o){if(e&&t){const n=e.getPath()+"/"+t;return o[n]||undefined}},getDisplayModeForTargetPath(e,t){const o=d.getInvolvedDataModelObjectsForTargetPath(e,t);const a=o&&n(o);return a?a:"DescriptionValue"},getInvolvedDataModelObjectsForTargetPath(t,o){var n,d;const a=o===null||o===void 0?void 0:(n=o.getMetaModel())===null||n===void 0?void 0:n.getMetaPath(t);const l=a?o===null||o===void 0?void 0:(d=o.getMetaModel())===null||d===void 0?void 0:d.getContext(a):undefined;return l&&e.getInvolvedDataModelObjects(l)},isRecommendationFieldNull(e,t,o){const n=d.getInvolvedDataModelObjectsForTargetPath(t,e===null||e===void 0?void 0:e.getModel());if(!(e!==null&&e!==void 0&&e.getProperty(o))){const o=d.getDisplayModeForTargetPath(t,e===null||e===void 0?void 0:e.getModel());if(o&&o!=="Value"){var a,l,i,r;const t=n===null||n===void 0?void 0:(a=n.targetObject)===null||a===void 0?void 0:(l=a.annotations)===null||l===void 0?void 0:(i=l.Common)===null||i===void 0?void 0:(r=i.Text)===null||r===void 0?void 0:r.path;return t?!(e!==null&&e!==void 0&&e.getProperty(t)):true}return true}return false}};o.standardRecommendationHelper=d;return o},false);
//# sourceMappingURL=StandardRecommendationHelper.js.map