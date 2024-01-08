/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/buildingBlocks/BuildingBlockSupport","sap/fe/core/buildingBlocks/RuntimeBuildingBlock","sap/fe/core/controllerextensions/HookSupport","sap/fe/core/helpers/ClassSupport","sap/fe/macros/ina/FilteringContextMenuHandler","sap/fe/macros/ina/NavigationContextMenuHandler","sap/ui/model/FilterOperator","sap/fe/core/jsx-runtime/jsx"],function(e,t,r,i,n,a,o,l,s){"use strict";var d,u,c,f,p,h,m,g,v,b,y,M,C,w,P,D,x,A,F,I,O,N,z,B;function E(e){return new Promise((t,r)=>{sap.ui.require([e],r=>{if(!(r&&r.__esModule)){r=r===null||!(typeof r==="object"&&e.endsWith("/library"))?{default:r}:r;Object.defineProperty(r,"__esModule",{value:true})}t(r)},e=>{r(e)})})}var _={};var T=n.defineReference;var H=i.controllerExtensionHandler;var j=t.defineBuildingBlock;var k=t.blockAttribute;function S(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function q(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function R(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;L(e,t)}function L(e,t){L=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return L(e,t)}function G(e,t,r,i,n){var a={};Object.keys(i).forEach(function(e){a[e]=i[e]});a.enumerable=!!a.enumerable;a.configurable=!!a.configurable;if("value"in a||a.initializer){a.writable=true}a=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},a);if(n&&a.initializer!==void 0){a.value=a.initializer?a.initializer.call(n):void 0;a.initializer=undefined}if(a.initializer===void 0){Object.defineProperty(e,t,a);a=null}return a}function U(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let V=(d=j({name:"MultiDimensionalGrid",namespace:"sap.fe.macros.internal",libraries:["sap/sac/df"]}),u=k({type:"string",required:true}),c=k({type:"string",required:false}),f=k({type:"string",required:true}),p=k({type:"string",required:true}),h=k({type:"string",required:false}),m=k({type:"string",required:false}),g=k({type:"string",required:false}),v=k({type:"object",required:false}),b=T(),y=T(),M=H("editFlow","onAfterSave"),d(C=(w=function(t){R(r,t);function r(){var e;for(var r=arguments.length,i=new Array(r),n=0;n<r;n++){i[n]=arguments[n]}e=t.call(this,...i)||this;S(e,"id",P,q(e));S(e,"variantManagementId",D,q(e));S(e,"modelName",x,q(e));S(e,"dataProviderName",A,q(e));S(e,"filterBar",F,q(e));S(e,"height",I,q(e));S(e,"width",O,q(e));S(e,"dimensionMapping",N,q(e));S(e,"flexAnalysisControl",z,q(e));S(e,"multiDimModelChangeHandler",B,q(e));e.refreshPromise=Promise.resolve();return e}_=r;r.load=async function e(){await t.load.call(this);if(r.FlexAnalysisControl===undefined){const{default:e}=await E("sap/sac/df/FlexAnalysis");r.FlexAnalysisControl=e}if(r.MultiDimModelChangeHandlerControl===undefined){const{default:e}=await E("sap/sac/df/changeHandler/MultiDimModelChangeHandler");r.MultiDimModelChangeHandlerControl=e}if(r.MemberFilter===undefined){const{default:e}=await E("sap/sac/df/model/MemberFilter");r.MemberFilter=e}return this};var i=r.prototype;i.getContent=function t(i,n){Promise.all([r.waitForViewInitialization(i),this.prepareDataProvider(n)]).then(()=>this.attachFiltering(i)).then(()=>this.addNavigationContextMenu(n,i)).catch(t=>e.error(`Could not initialize the DragonFly data provider '${this.dataProviderName}' of model '${this.modelName}'!`,t));if(!r.FlexAnalysisControl||!r.MultiDimModelChangeHandlerControl){e.error("sap/sac/df/FlexAnalysis or sap/sac/df/changeHandler/MultiDimModelChangeHandler could not be loaded!");return undefined}return s(r.FlexAnalysisControl,{id:this.id,ref:this.flexAnalysisControl,multiDimModelId:this.modelName,dataProvider:this.dataProviderName,clientIdentifier:"UI5",blocked:"false",hideToolBar:"true",hideFilterLine:"true",height:this.height,width:this.width,configId:"fe",children:{dependents:[s(r.MultiDimModelChangeHandlerControl,{id:this.variantManagementId,ref:this.multiDimModelChangeHandler})]}})};r.waitForViewInitialization=async function e(t){return new Promise(e=>t.attachAfterInit(()=>e()))};i.prepareDataProvider=async function e(t){var r;const i=t.getModel(this.modelName);await(i===null||i===void 0?void 0:i.loaded());this.dataProvider=i===null||i===void 0?void 0:i.getDataProvider(this.dataProviderName);if(!this.dataProvider){throw new Error("Data provider not found")}(r=this.multiDimModelChangeHandler.current)===null||r===void 0?void 0:r.registerMultiDimModel(i);i===null||i===void 0?void 0:i.attachRequestCompleted(()=>t.getAppStateHandler().createAppState())};i.attachFiltering=function e(t){var r;const i=this.filterBar?t.byId(this.filterBar):undefined;if(!i){return}const n=i.isA("sap.fe.macros.filterBar.FilterBarAPI")?i.getAggregation("content"):i;const o=()=>{var e;return(e=this.flexAnalysisControl.current)===null||e===void 0?void 0:e.setBlocked(true)};const l=()=>{var e;this.setConditionsOnGrid(n.getConditions());(e=this.flexAnalysisControl.current)===null||e===void 0?void 0:e.setBlocked(false)};n.attachFiltersChanged(o);n.attachSearch(l);const s=new a(n.getParent(),this.dataProvider,this.dimensionMapping).create({Text:this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_FILTER_MEMBER"),Icon:"filter"});(r=this.flexAnalysisControl.current)===null||r===void 0?void 0:r.addContextMenuAction("MemberCellFiltering",s);t.attachBeforeExit(()=>{n.detachFiltersChanged(o);n.detachSearch(l)})};i.addNavigationContextMenu=function e(t,r){var i;const n=new o(t,r,this.dataProvider,this.dimensionMapping).create({Text:this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_GO_TO_DETAILS"),Icon:"action"});(i=this.flexAnalysisControl.current)===null||i===void 0?void 0:i.addContextMenuAction("MemberCellNavigation",n)};i.refresh=async function e(){this.refreshPromise=this.refreshPromise.then(async()=>{if(this.dataProvider){await this.dataProvider.getResultSet(true)}});return this.refreshPromise};i.setConditionsOnGrid=function e(t){if(!this.dataProvider||!r.MemberFilter){return}const i=r.MemberFilter;for(const e of Object.keys(this.dataProvider.Dimensions)){this.dataProvider.getDimension(e).removeMemberFilter()}for(const[e,r]of Object.entries(t)){var n;const t=(n=Object.entries(this.dimensionMapping).find(t=>{let[,r]=t;return r.filterProperty===e}))===null||n===void 0?void 0:n[0];const a=r.filter(e=>e.operator===l.EQ.valueOf()).flatMap(e=>e.values).map(e=>new i([e]));if(t&&this.dataProvider.Dimensions[t]){this.dataProvider.getDimension(t).setMemberFilter(a)}}};return r}(r),P=G(w.prototype,"id",[u],{configurable:true,enumerable:true,writable:true,initializer:null}),D=G(w.prototype,"variantManagementId",[c],{configurable:true,enumerable:true,writable:true,initializer:null}),x=G(w.prototype,"modelName",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),A=G(w.prototype,"dataProviderName",[p],{configurable:true,enumerable:true,writable:true,initializer:null}),F=G(w.prototype,"filterBar",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),I=G(w.prototype,"height",[m],{configurable:true,enumerable:true,writable:true,initializer:function(){return"100%"}}),O=G(w.prototype,"width",[g],{configurable:true,enumerable:true,writable:true,initializer:function(){return"100%"}}),N=G(w.prototype,"dimensionMapping",[v],{configurable:true,enumerable:true,writable:true,initializer:function(){return{}}}),z=G(w.prototype,"flexAnalysisControl",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),B=G(w.prototype,"multiDimModelChangeHandler",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),G(w.prototype,"refresh",[M],Object.getOwnPropertyDescriptor(w.prototype,"refresh"),w.prototype),w))||C);_=V;return _},false);
//# sourceMappingURL=MultiDimensionalGrid.block.js.map