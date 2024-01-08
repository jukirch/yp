/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/RuntimeBuildingBlock","sap/fe/core/helpers/ClassSupport","sap/fe/core/helpers/ResourceModelHelper","sap/m/Button","sap/m/Column","sap/m/ColumnListItem","sap/m/Dialog","sap/m/FlexBox","sap/m/FlexItemData","sap/m/Table","sap/m/Text","sap/ui/core/library","../../formatters/ValueFormatter","../../helpers/StandardRecommendationHelper","sap/fe/core/jsx-runtime/jsx","sap/fe/core/jsx-runtime/Fragment","sap/fe/core/jsx-runtime/jsxs"],function(e,t,i,n,o,r,a,l,s,c,u,d,m,h,p,f,g,v,R){"use strict";var D,C,A,E,_;var b={};var x=f.standardRecommendationHelper;var O=h.ValueState;var I=o.getResourceModel;var M=n.defineReference;var T=t.defineBuildingBlock;function N(e,t,i,n){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(n):void 0})}function y(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function B(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;w(e,t)}function w(e,t){w=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return w(e,t)}function L(e,t,i,n,o){var r={};Object.keys(n).forEach(function(e){r[e]=n[e]});r.enumerable=!!r.enumerable;r.configurable=!!r.configurable;if("value"in r||r.initializer){r.writable=true}r=i.slice().reverse().reduce(function(i,n){return n(e,t,i)||i},r);if(o&&r.initializer!==void 0){r.value=r.initializer?r.initializer.call(o):void 0;r.initializer=undefined}if(r.initializer===void 0){Object.defineProperty(e,t,r);r=null}return r}function P(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let S=(D=T({name:"ConfirmRecommendationDialog",namespace:"sap.fe.core.controllerextensions"}),C=M(),D(A=(E=function(t){B(i,t);function i(e){var i;i=t.call(this,e)||this;N(i,"confirmRecommendationDialog",_,y(i));i.view=e.view;i.confirmRecommendationDialogResourceModel=I(i.view);return i}b=i;var n=i.prototype;n.open=async function e(t){var i,n,o,r;this.acceptAllParams=await((i=this.view)===null||i===void 0?void 0:i.getController()).recommendations.fetchAcceptAllParams();if(!((n=this.acceptAllParams)!==null&&n!==void 0&&(o=n.recommendationData)!==null&&o!==void 0&&o.length)||!((r=this.getColumnListItems())!==null&&r!==void 0&&r.length)){return true}this.isSave=t;const a=this.getContent();a===null||a===void 0?void 0:a.setEscapeHandler(this.onContinueEditing.bind(this));this.view.addDependent(a);a===null||a===void 0?void 0:a.open();return new Promise((e,t)=>{this.promiseResolve=e;this.promiseReject=t})};n.close=function e(){var t,i;(t=this.confirmRecommendationDialog.current)===null||t===void 0?void 0:t.close();(i=this.confirmRecommendationDialog.current)===null||i===void 0?void 0:i.destroy()};n.onAcceptAndSave=async function t(){try{var i;const e=await((i=this.view)===null||i===void 0?void 0:i.getController()).recommendations.acceptRecommendations(this.acceptAllParams);if(!e){this.promiseReject("Accept Failed")}this.promiseResolve(true)}catch{e.error("Accept Recommendations Failed");this.promiseReject("Accept Failed")}finally{this.close()}};n.onIgnoreAndSave=function e(){this.promiseResolve(true);this.close()};n.onContinueEditing=function e(){this.promiseResolve(false);this.close()};n.getColumnListItems=function e(){const t=[];for(const e of((i=this.acceptAllParams)===null||i===void 0?void 0:i.recommendationData)||[]){var i;if(e.value||e.text){var n,o,r;const i=((n=e.context)===null||n===void 0?void 0:n.getPath())+"/"+e.propertyPath;t.push(this.getColumnListItem(e,this.getFieldName(i),x.getDisplayModeForTargetPath(i,(o=this.view)===null||o===void 0?void 0:(r=o.getBindingContext())===null||r===void 0?void 0:r.getModel())))}}return t};n.getColumnListItem=function e(t,i,n){return g(l,{vAlign:"Middle",children:{cells:R(v,{children:[g(m,{text:i}),g(m,{text:this.getText(t,n)})]})}})};n.getFieldName=function e(t){var i,n,o,r,a;const l=x.getInvolvedDataModelObjectsForTargetPath(t,(i=this.view)===null||i===void 0?void 0:(n=i.getBindingContext())===null||n===void 0?void 0:n.getModel());return(l===null||l===void 0?void 0:(o=l.targetObject)===null||o===void 0?void 0:(r=o.annotations)===null||r===void 0?void 0:(a=r.Common)===null||a===void 0?void 0:a.Label)||t.split("/")[t.split("/").length-1]};n.getText=function e(t,i){if(t.text&&t.value){switch(i){case"Description":return t.text;case"DescriptionValue":return p.formatWithBrackets(t.text,t.value);case"ValueDescription":return p.formatWithBrackets(t.value,t.text);case"Value":return t.value}}return t.value||""};n.getFlexBox=function e(){return g(c,{direction:"Column",alignItems:"Center",fitContainer:"true",children:{items:R(v,{children:[g(m,{text:this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT",[this.getColumnListItems().length]),class:"sapUiTinyMarginBegin sapUiTinyMarginTopBottom"}),this.getTable(),this.getButton(this.isSave?this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_SAVE"):this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT"),"Emphasized",this.onAcceptAndSave.bind(this)),this.getButton(this.isSave?this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_SAVE"):this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE"),"Default",this.onIgnoreAndSave.bind(this)),this.getButton(this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_CONTINUE_EDITING"),"Transparent",this.onContinueEditing.bind(this))]})}})};n.getButton=function e(t,i,n){return g(r,{text:t,type:i,width:"100%",press:n,children:{layoutData:g(v,{children:g(u,{minWidth:"100%"})})}})};n.getTable=function e(){return g(d,{children:{columns:R(v,{children:[g(a,{children:g(m,{text:this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_FIELD")})}),",",g(a,{children:g(m,{text:this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_VALUE")})})]}),items:g(v,{children:this.getColumnListItems()})}})};n.getContent=function e(){return g(s,{title:this.confirmRecommendationDialogResourceModel.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO"),state:O.Information,type:"Message",ref:this.confirmRecommendationDialog,resizable:"true",contentWidth:"30rem",children:{content:g(v,{children:this.getFlexBox()})}})};return i}(i),_=L(E.prototype,"confirmRecommendationDialog",[C],{configurable:true,enumerable:true,writable:true,initializer:null}),E))||A);b=S;return b},false);
//# sourceMappingURL=ConfirmRecommendationDialog.block.js.map