/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/message/Message"],function(e){"use strict";var t={};async function a(t,a){t.addMessages(a.map(t=>{const a=t.actionParameterInfo.field.getBinding(t.actionParameterInfo.isMultiValue?"items":"value");return new e({message:t.message,type:"Error",processor:a===null||a===void 0?void 0:a.getModel(),persistent:true,target:a===null||a===void 0?void 0:a.getResolvedPath()})}))}t._addMessageForActionParameter=a;async function r(e,t,r){await Promise.allSettled(t.map(e=>e.validationPromise));const i=t.filter(e=>e.field.getRequired());const n=i.filter(e=>{if(e.isMultiValue){return e.value===undefined||!e.value.length}else{const t=e.field.getValue();return t===undefined||t===null||t===""}});a(e,n.map(e=>{var t;return{actionParameterInfo:e,message:r.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG",[((t=e.field.getParent())===null||t===void 0?void 0:t.getAggregation("label")).getText()])}}));const s=t.find(e=>e.hasError||e.field.getValueState()==="Error"||n.includes(e));if(s){s.field.focus();return false}else{return true}}t._validateProperties=r;return t},false);
//# sourceMappingURL=_internal.js.map