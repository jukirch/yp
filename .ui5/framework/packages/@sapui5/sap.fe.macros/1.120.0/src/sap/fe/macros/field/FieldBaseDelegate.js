/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/CommonUtils","sap/ui/mdc/field/FieldBaseDelegate","sap/ui/mdc/odata/v4/TypeMap","sap/ui/model/Filter"],function(e,t,n,o,i){"use strict";return Object.assign({},n,{apiVersion:2,initializeTypeFromBinding:function(e,t,n){const o={};if(t&&t.isA(["sap.ui.model.odata.type.Unit","sap.ui.model.odata.type.Currency"])&&Array.isArray(n)&&n.length>2&&n[2]!==undefined){t.formatValue(n,"string");o.bTypeInitialized=true;o.mCustomUnits=n[2]}return o},initializeInternalUnitType:function(e,t,n){if((n===null||n===void 0?void 0:n.mCustomUnits)!==undefined){t.formatValue([null,null,n.mCustomUnits],"string")}},enhanceValueForUnit:function(e,t,n){if((n===null||n===void 0?void 0:n.bTypeInitialized)===true&&t.length===2){t.push(n.mCustomUnits);return t}return undefined},getDefaultValueHelpDelegate:function(e){return{name:"sap/ui/mdc/odata/v4/ValueHelpDelegate",payload:{}}},getTypeMap:function(e){return o},_getValueListParameter:function(e,t){return e.Parameters.filter(function(e){if(e.LocalDataProperty){return e.LocalDataProperty.$PropertyPath===t}else{return false}})},_getFilter:function(e,t,n,o,a,r,l){const u=[];const s=e.Parameters.filter(function(e){var o;return e.$Type==="com.sap.vocabularies.Common.v1.ValueListParameterIn"||e.$Type==="com.sap.vocabularies.Common.v1.ValueListParameterInOut"||((o=e.LocalDataProperty)===null||o===void 0?void 0:o.$PropertyPath)===t&&e.ValueListProperty===n});for(const e of s){var d;let n;if(((d=e.LocalDataProperty)===null||d===void 0?void 0:d.$PropertyPath)===t){n=o}else if((a===null||a===void 0?void 0:a.isActionParameterDialog)===true){var c;const t=`APD_::${(c=e.LocalDataProperty)===null||c===void 0?void 0:c.$PropertyPath}`;const o=sap.ui.getCore().byId(t);n=o===null||o===void 0?void 0:o.getValue()}else if(r!==undefined){var f;const t=(f=e.LocalDataProperty)===null||f===void 0?void 0:f.$PropertyPath;const o=r===null||r===void 0?void 0:r[0];n=t&&(o===null||o===void 0?void 0:o[t])}else if(l!==undefined){var p;const t=(p=e.LocalDataProperty)===null||p===void 0?void 0:p.$PropertyPath;n=l.getObject(t)}if(n!==null&&n!==undefined){u.push(new i({path:e.ValueListProperty,operator:"EQ",value1:n}))}}return u},getItemForValue:function(e,t,o){if(o.value===""){return}if(o.checkDescription){const e=t.getPayload();const n=e.valueHelpDescriptionPath;const i=e===null||e===void 0?void 0:e.maxLength;const a=o.value!==null&&o.value!==undefined?o.value.toString().length:0;if(n===""){o.checkDescription=false}else if(i!==undefined&&a>i){return}}return n.getItemForValue(e,t,o)},getDescription:async function(n,o,i,a,r,l,u,s,d,c,f){var p,v;let g=n===null||n===void 0?void 0:n.getPayload();if(!g&&c!==null&&c!==void 0&&c.getDisplay().includes("Description")){g={retrieveTextFromValueList:true}}if(((p=g)===null||p===void 0?void 0:p.retrieveTextFromValueList)===true||((v=g)===null||v===void 0?void 0:v.isFilterField)===true){const n=o.getModel();const a=n?n.getMetaModel():t.getAppComponent(o).getModel().getMetaModel();const r=o.getPayload();const u=d===null||d===void 0?void 0:d[r.valueHelpQualifier];const s=r.propertyPath;const c=r===null||r===void 0?void 0:r.propertyDescriptionPath;let f;try{var m;const n=await a.requestValueListInfo(s,true,l);const d=a.getObject(`${s}@sapui.name`);const p=n[Object.keys(n)[0]];const v=this._getValueListParameter(p,d);const g=v===null||v===void 0?void 0:(m=v[0])===null||m===void 0?void 0:m.ValueListProperty;if(!g){throw Error(`Inconsistent value help annotation for ${d}`)}const y=p.$model;const P=y.getMetaModel().getObject(`/${p.CollectionPath}/${g}@com.sap.vocabularies.Common.v1.Text`);if(P&&P.$Path){f=P.$Path;const e=this._getFilter(p,d,g,i,r,u,l);const t=y.bindList(`/${p.CollectionPath}`,undefined,undefined,e,{$select:f});const n=await t.requestContexts(0,2);return n.length?n[0].getObject(f):undefined}else if(l!==undefined&&c){const n=c.lastIndexOf("/");const i=n>0?c.substring(0,n):c;const a=t.getAppComponent(o).getSideEffectsService();await a.requestSideEffects([i],l);e.warning(`RequestSideEffects is triggered because the text annotation for ${g} is not defined at the CollectionPath of the value help`);return undefined}else{e.error(`Text Annotation for ${g} is not defined`);return undefined}}catch(t){const n=t?t.status:undefined;const o=t instanceof Error?t.message:String(t);const i=n===404?`Metadata not found (${n}) for value help of property ${s}`:o;e.error(i)}}return undefined}})},false);
//# sourceMappingURL=FieldBaseDelegate.js.map