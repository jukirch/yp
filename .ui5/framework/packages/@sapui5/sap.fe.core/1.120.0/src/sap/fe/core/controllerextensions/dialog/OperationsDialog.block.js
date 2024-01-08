/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/RuntimeBuildingBlock","sap/fe/core/helpers/ClassSupport","sap/m/Bar","sap/m/Button","sap/m/Dialog","sap/m/Title","sap/ui/core/Core","sap/fe/core/jsx-runtime/jsx"],function(e,t,i,r,n,l,o,a,s){"use strict";var u,c,p,g,d,f,b,h,m,y,v,w,z,B,H,j,M,x,D,O,E,q,P,T,U,k,C,I,S,N,R,W,_,G,A;var L={};var F=i.defineReference;var V=e.defineBuildingBlock;var J=e.blockAttribute;function K(e,t,i,r){if(!i)return;Object.defineProperty(e,t,{enumerable:i.enumerable,configurable:i.configurable,writable:i.writable,value:i.initializer?i.initializer.call(r):void 0})}function Q(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function X(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;Y(e,t)}function Y(e,t){Y=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,i){t.__proto__=i;return t};return Y(e,t)}function Z(e,t,i,r,n){var l={};Object.keys(r).forEach(function(e){l[e]=r[e]});l.enumerable=!!l.enumerable;l.configurable=!!l.configurable;if("value"in l||l.initializer){l.writable=true}l=i.slice().reverse().reduce(function(i,r){return r(e,t,i)||i},l);if(n&&l.initializer!==void 0){l.value=l.initializer?l.initializer.call(n):void 0;l.initializer=undefined}if(l.initializer===void 0){Object.defineProperty(e,t,l);l=null}return l}function $(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}const ee=a.getLibraryResourceBundle("sap.fe.macros");let te=(u=V({name:"OperationsDialog",namespace:"sap.fe.core.controllerextensions"}),c=J({type:"string",isPublic:true,required:true}),p=J({type:"string"}),g=J({type:"object",required:true}),d=F(),f=J({type:"boolean",required:true}),b=J({type:"function"}),h=J({type:"object",required:true}),m=J({type:"string",required:true}),y=J({type:"string",required:true}),v=J({type:"string",required:true}),w=J({type:"object",required:true}),z=J({type:"object"}),B=J({type:"object"}),H=J({type:"object",required:true}),j=J({type:"boolean"}),M=J({type:"function"}),u(x=(D=function(e){X(t,e);function t(t){var i;i=e.call(this,t)||this;K(i,"id",O,Q(i));K(i,"title",E,Q(i));K(i,"messageObject",q,Q(i));K(i,"operationsDialog",P,Q(i));K(i,"isMultiContext412",T,Q(i));K(i,"resolve",U,Q(i));K(i,"model",k,Q(i));K(i,"groupId",C,Q(i));K(i,"actionName",I,Q(i));K(i,"cancelButtonTxt",S,Q(i));K(i,"strictHandlingPromises",N,Q(i));K(i,"strictHandlingUtilities",R,Q(i));K(i,"messageHandler",W,Q(i));K(i,"messageDialogModel",_,Q(i));K(i,"isGrouped",G,Q(i));K(i,"showMessageInfo",A,Q(i));return i}L=t;var i=t.prototype;i.open=function e(){var t;this.getContent();(t=this.operationsDialog.current)===null||t===void 0?void 0:t.open()};i.getBeginButton=function e(){return new n({press:()=>{if(!(this.isMultiContext412??false)){var e;(e=this.resolve)===null||e===void 0?void 0:e.call(this,true);this.model.submitBatch(this.groupId)}else{var t;this.strictHandlingPromises.forEach(e=>{e.resolve(true);this.model.submitBatch(e.groupId);if(e.requestSideEffects){e.requestSideEffects()}});const e=(t=this.strictHandlingUtilities)===null||t===void 0?void 0:t.strictHandlingTransitionFails;if(e&&e.length>0){var i;(i=this.messageHandler)===null||i===void 0?void 0:i.removeTransitionMessages()}if(this.strictHandlingUtilities){this.strictHandlingUtilities.strictHandlingWarningMessages=[]}}if(this.strictHandlingUtilities){this.strictHandlingUtilities.is412Executed=true}this.messageDialogModel.setData({});this.close()},type:"Emphasized",text:this.actionName})};i.close=function e(){var t;(t=this.operationsDialog.current)===null||t===void 0?void 0:t.close()};i.getTitle=function e(){const t=ee.getText("M_WARNINGS");return new o({text:t})};i.getEndButton=function e(){return new n({press:()=>{if(this.strictHandlingUtilities){this.strictHandlingUtilities.strictHandlingWarningMessages=[];this.strictHandlingUtilities.is412Executed=false}if(!(this.isMultiContext412??false)){this.resolve(false)}else{this.strictHandlingPromises.forEach(function(e){e.resolve(false)})}this.messageDialogModel.setData({});this.close();if(this.isGrouped??false){this.showMessageInfo()}},text:this.cancelButtonTxt})};i.getContent=function e(){return s(l,{id:this.id,ref:this.operationsDialog,resizable:true,content:this.messageObject.oMessageView,state:"Warning",customHeader:new r({contentLeft:[this.messageObject.oBackButton],contentMiddle:[this.getTitle()]}),contentHeight:"50%",contentWidth:"50%",verticalScrolling:false,beginButton:this.getBeginButton(),endButton:this.getEndButton()})};return t}(t),O=Z(D.prototype,"id",[c],{configurable:true,enumerable:true,writable:true,initializer:null}),E=Z(D.prototype,"title",[p],{configurable:true,enumerable:true,writable:true,initializer:function(){return"Dialog Standard Title"}}),q=Z(D.prototype,"messageObject",[g],{configurable:true,enumerable:true,writable:true,initializer:function(){return""}}),P=Z(D.prototype,"operationsDialog",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),T=Z(D.prototype,"isMultiContext412",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),U=Z(D.prototype,"resolve",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),k=Z(D.prototype,"model",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),C=Z(D.prototype,"groupId",[m],{configurable:true,enumerable:true,writable:true,initializer:null}),I=Z(D.prototype,"actionName",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),S=Z(D.prototype,"cancelButtonTxt",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),N=Z(D.prototype,"strictHandlingPromises",[w],{configurable:true,enumerable:true,writable:true,initializer:null}),R=Z(D.prototype,"strictHandlingUtilities",[z],{configurable:true,enumerable:true,writable:true,initializer:null}),W=Z(D.prototype,"messageHandler",[B],{configurable:true,enumerable:true,writable:true,initializer:null}),_=Z(D.prototype,"messageDialogModel",[H],{configurable:true,enumerable:true,writable:true,initializer:null}),G=Z(D.prototype,"isGrouped",[j],{configurable:true,enumerable:true,writable:true,initializer:null}),A=Z(D.prototype,"showMessageInfo",[M],{configurable:true,enumerable:true,writable:true,initializer:null}),D))||x);L=te;return L},false);
//# sourceMappingURL=OperationsDialog.block.js.map