/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/base/util/merge","sap/fe/core/CommonUtils","sap/fe/core/controllerextensions/HookSupport","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/ClassSupport","sap/fe/macros/MacroAPI","sap/fe/macros/chart/ChartRuntime","sap/fe/macros/chart/ChartUtils","sap/fe/macros/filter/FilterUtils","sap/ui/model/Filter","../insights/AnalyticalInsightsHelper","../insights/CommonInsightsHelper","../insights/InsightsService"],function(e,t,r,n,i,a,o,l,s,c,u,p,g,d){"use strict";var h,f,b,y,C,v,m,w,P,S,M,z,A,D,I,O,x,E,k,j,T,R,V,q,F,B,H,U,N,$,_,G,L,W,J;var K=d.showInsightsCardPreview;var Q=d.showCollaborationManagerCardPreview;var X=d.getCardManifest;var Y=g.showGenericErrorMessage;var Z=g.hasInsightActionEnabled;var ee=p.createChartCardParams;var te=a.xmlEventHandler;var re=a.property;var ne=a.event;var ie=a.defineUI5Class;var ae=a.aggregation;var oe=i.getInvolvedDataModelObjects;var le=n.controllerExtensionHandler;function se(e,t,r,n){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(n):void 0})}function ce(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function ue(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;pe(e,t)}function pe(e,t){pe=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return pe(e,t)}function ge(e,t,r,n,i){var a={};Object.keys(n).forEach(function(e){a[e]=n[e]});a.enumerable=!!a.enumerable;a.configurable=!!a.configurable;if("value"in a||a.initializer){a.writable=true}a=r.slice().reverse().reduce(function(r,n){return n(e,t,r)||r},a);if(i&&a.initializer!==void 0){a.value=a.initializer?a.initializer.call(i):void 0;a.initializer=undefined}if(a.initializer===void 0){Object.defineProperty(e,t,a);a=null}return a}function de(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let he=(h=ie("sap.fe.macros.chart.ChartAPI",{returnTypes:["sap.fe.macros.MacroAPI"]}),f=re({type:"string"}),b=re({type:"string",required:true,expectedTypes:["EntitySet","EntityType","Singleton","NavigationProperty"],expectedAnnotations:["com.sap.vocabularies.UI.v1.Chart"]}),y=re({type:"string",required:true,expectedTypes:["EntitySet","EntityType","Singleton","NavigationProperty"],expectedAnnotations:[]}),C=re({type:"string"}),v=re({type:"boolean",defaultValue:true}),m=re({type:"string",defaultValue:"Multiple",allowedValues:["None","Single","Multiple"]}),w=re({type:"string"}),P=re({type:"string",allowedValues:["Control"]}),S=re({type:"boolean | string",defaultValue:true}),M=re({type:"string[]",defaultValue:[]}),z=ae({type:"sap.fe.macros.chart.Action",multiple:true}),A=ne(),D=ne(),I=ne(),O=te(),x=te(),E=le("collaborationManager","collectAvailableCards"),k=te(),h(j=(T=function(n){ue(i,n);function i(){var e;for(var t=arguments.length,r=new Array(t),i=0;i<t;i++){r[i]=arguments[i]}e=n.call(this,...r)||this;se(e,"id",R,ce(e));se(e,"metaPath",V,ce(e));se(e,"contextPath",q,ce(e));se(e,"header",F,ce(e));se(e,"headerVisible",B,ce(e));se(e,"selectionMode",H,ce(e));se(e,"filterBar",U,ce(e));se(e,"variantManagement",N,ce(e));se(e,"personalization",$,ce(e));se(e,"prevDrillStack",_,ce(e));se(e,"actions",G,ce(e));se(e,"selectionChange",L,ce(e));se(e,"stateChange",W,ce(e));se(e,"internalDataRequested",J,ce(e));return e}var a=i.prototype;a.getSelectedContexts=function e(){var t,r;return((t=this.content)===null||t===void 0?void 0:(r=t.getBindingContext("internal"))===null||r===void 0?void 0:r.getProperty("selectedContexts"))||[]};a.onAfterRendering=function e(){const t=this.getController().getView();const r=t.getBindingContext("internal");const n=this.getContent();const i={};const a=n.data("entitySet"),o=`${a}Chart`,l=t.getBindingContext();i[o]=n.data("draftSupported")==="true"&&!!l&&!l.getObject("IsActiveEntity");r.setProperty("controls/showMessageStrip",i)};a.refreshNotApplicableFields=function e(t){const r=this.getContent();return c.getNotApplicableFilters(t,r)};a.handleSelectionChange=function e(r){const n=r.getParameter("data");const i=r.getParameter("name")==="selectData";l.fnUpdateChart(r);this.fireSelectionChange(t({},{data:n,selected:i}))};a.onInternalDataRequested=function e(){this.fireEvent("internalDataRequested")};a.collectAvailableCards=function e(t){const r=this.content.getActions();if(Z(r)){t.push((async()=>{const e=await this.getCardManifestChart();return{card:e,title:this.getChartControl().getHeader(),callback:this.onAddCardToCollaborationManagerCallback.bind(this)}})())}};a.hasSelections=function t(){const r=this.content;if(r){try{var n;const e=(n=r.getControlDelegate())===null||n===void 0?void 0:n.getInnerChart(r);if(e){const t=s.getDimensionsFromDrillStack(e);const n=t.length>this.prevDrillStack.length;const i=t.length<this.prevDrillStack.length;const a=t.toString()===this.prevDrillStack.toString();let o;if(i&&t.length===1){o=s.getChartSelections(r,true)}else{o=s.getChartSelections(r)}if(n||i){this.prevDrillStack=t;return o.length>0}else if(a){return o.length>0}}}catch(t){e.error(`Error while checking for selections in Chart: ${t}`)}}return false};a.onAddCardToInsightsPressed=async function t(){try{const e=await ee(this);if(e){K(e);return}}catch(t){Y(this.content);e.error(t)}};a.getCardManifestChart=async function e(){const t=await ee(this);return X(t)};a.onAddCardToCollaborationManagerCallback=async function t(r){try{if(r){await Q(r,this.getController().collaborationManager.getService());return}}catch(t){Y(this.content);e.error(t)}};a.getFilter=function e(){const t=s.getAllFilterInfo(this.content);if(t.filters.length){t.filters=r.getChartPropertiesWithoutPrefixes(t.filters);return new u({filters:t.filters,and:true})}return undefined};a.getChartControl=function e(){return this.content};a.getDimensionDataModel=function e(t){const r=this.content.data("targetCollectionPath");const n=this.content.getModel().getMetaModel();const i=n.createBindingContext(`${r}/${t}`);return oe(i)};return i}(o),R=ge(T.prototype,"id",[f],{configurable:true,enumerable:true,writable:true,initializer:null}),V=ge(T.prototype,"metaPath",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),q=ge(T.prototype,"contextPath",[y],{configurable:true,enumerable:true,writable:true,initializer:null}),F=ge(T.prototype,"header",[C],{configurable:true,enumerable:true,writable:true,initializer:null}),B=ge(T.prototype,"headerVisible",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),H=ge(T.prototype,"selectionMode",[m],{configurable:true,enumerable:true,writable:true,initializer:null}),U=ge(T.prototype,"filterBar",[w],{configurable:true,enumerable:true,writable:true,initializer:null}),N=ge(T.prototype,"variantManagement",[P],{configurable:true,enumerable:true,writable:true,initializer:null}),$=ge(T.prototype,"personalization",[S],{configurable:true,enumerable:true,writable:true,initializer:null}),_=ge(T.prototype,"prevDrillStack",[M],{configurable:true,enumerable:true,writable:true,initializer:null}),G=ge(T.prototype,"actions",[z],{configurable:true,enumerable:true,writable:true,initializer:null}),L=ge(T.prototype,"selectionChange",[A],{configurable:true,enumerable:true,writable:true,initializer:null}),W=ge(T.prototype,"stateChange",[D],{configurable:true,enumerable:true,writable:true,initializer:null}),J=ge(T.prototype,"internalDataRequested",[I],{configurable:true,enumerable:true,writable:true,initializer:null}),ge(T.prototype,"handleSelectionChange",[O],Object.getOwnPropertyDescriptor(T.prototype,"handleSelectionChange"),T.prototype),ge(T.prototype,"onInternalDataRequested",[x],Object.getOwnPropertyDescriptor(T.prototype,"onInternalDataRequested"),T.prototype),ge(T.prototype,"collectAvailableCards",[E],Object.getOwnPropertyDescriptor(T.prototype,"collectAvailableCards"),T.prototype),ge(T.prototype,"onAddCardToInsightsPressed",[k],Object.getOwnPropertyDescriptor(T.prototype,"onAddCardToInsightsPressed"),T.prototype),T))||j);return he},false);
//# sourceMappingURL=ChartAPI.js.map