/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/converters/controls/ListReport/FilterBar","sap/fe/core/converters/MetaModelConverter","sap/fe/core/TemplateModel"],function(e,t,r,i,n){"use strict";var l,a,o,u,c,s,p,b,f,d,g,v,y,m,h,w,z,F,B,x,P,C,k,M,O,S,j,_,E,R,D,L,q;var H={};var V=i.getInvolvedDataModelObjects;var A=r.getSelectionFields;var I=r.getExpandFilterFields;var T=t.defineBuildingBlock;var G=t.blockEvent;var J=t.blockAttribute;function K(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function N(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function Q(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;U(e,t)}function U(e,t){U=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return U(e,t)}function W(e,t,r,i,n){var l={};Object.keys(i).forEach(function(e){l[e]=i[e]});l.enumerable=!!l.enumerable;l.configurable=!!l.configurable;if("value"in l||l.initializer){l.writable=true}l=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},l);if(n&&l.initializer!==void 0){l.value=l.initializer?l.initializer.call(n):void 0;l.initializer=undefined}if(l.initializer===void 0){Object.defineProperty(e,t,l);l=null}return l}function X(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let Y=(l=T({name:"ValueHelpFilterBar",namespace:"sap.fe.macros.valuehelp",fragment:"sap.fe.macros.valuehelp.ValueHelpFilterBar"}),a=J({type:"string"}),o=J({type:"sap.ui.model.Context",required:true}),u=J({type:"sap.ui.model.Context"}),c=J({type:"boolean"}),s=J({type:"boolean"}),p=J({type:"sap.ui.mdc.FilterBarP13nMode[]"}),b=J({type:"boolean"}),f=J({type:"boolean"}),d=J({type:"sap.ui.model.Context",required:true}),g=J({type:"sap.ui.model.Context"}),v=J({type:"string"}),y=J({type:"boolean"}),m=J({type:"boolean"}),h=G(),w=G(),l(z=(F=function(e){Q(t,e);function t(t,r,i){var l;var a;a=e.call(this,t)||this;K(a,"id",B,N(a));K(a,"contextPath",x,N(a));K(a,"metaPath",P,N(a));K(a,"hideBasicSearch",C,N(a));K(a,"enableFallback",k,N(a));K(a,"p13nMode",M,N(a));K(a,"useSemanticDateRange",O,N(a));K(a,"liveMode",S,N(a));K(a,"_valueList",j,N(a));K(a,"selectionFields",_,N(a));K(a,"filterConditions",E,N(a));K(a,"suspendSelection",R,N(a));K(a,"expandFilterFields",D,N(a));K(a,"search",L,N(a));K(a,"filterChanged",q,N(a));const o=a.contextPath.getModel();const u=a.metaPath;const c=u===null||u===void 0?void 0:u.getPath();const s=V(a.contextPath);const p=a.getConverterContext(s,undefined,i);if(!a.selectionFields){const e=A(p,[],c).selectionFields;a.selectionFields=new n(e,o).createBindingContext("/")}const b=s.targetEntitySet;a.expandFilterFields=I(p,(l=b.annotations.Capabilities)===null||l===void 0?void 0:l.FilterRestrictions,a._valueList);return a}H=t;return t}(e),B=W(F.prototype,"id",[a],{configurable:true,enumerable:true,writable:true,initializer:null}),x=W(F.prototype,"contextPath",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),P=W(F.prototype,"metaPath",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),C=W(F.prototype,"hideBasicSearch",[c],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),k=W(F.prototype,"enableFallback",[s],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),M=W(F.prototype,"p13nMode",[p],{configurable:true,enumerable:true,writable:true,initializer:function(){return[]}}),O=W(F.prototype,"useSemanticDateRange",[b],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),S=W(F.prototype,"liveMode",[f],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),j=W(F.prototype,"_valueList",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),_=W(F.prototype,"selectionFields",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),E=W(F.prototype,"filterConditions",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),R=W(F.prototype,"suspendSelection",[y],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),D=W(F.prototype,"expandFilterFields",[m],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),L=W(F.prototype,"search",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),q=W(F.prototype,"filterChanged",[w],{configurable:true,enumerable:true,writable:true,initializer:null}),F))||z);H=Y;return H},false);
//# sourceMappingURL=ValueHelpFilterBar.block.js.map