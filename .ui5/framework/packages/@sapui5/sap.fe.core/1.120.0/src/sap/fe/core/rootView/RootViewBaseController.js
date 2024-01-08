/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/BaseController","sap/fe/core/CommonUtils","sap/fe/core/controllerextensions/Placeholder","sap/fe/core/controllerextensions/ViewState","sap/fe/core/helpers/ClassSupport","sap/fe/core/helpers/SizeHelper","sap/ui/base/BindingParser","sap/ui/core/Core","sap/ui/core/routing/HashChanger","sap/ui/model/json/JSONModel","sap/ui/model/odata/v4/AnnotationHelper","sap/ui/thirdparty/URI"],function(e,t,o,n,i,r,a,s,c,l,u,h,f){"use strict";var p,g,d,m,y,b,P;var C=r.usingExtension;var v=r.defineUI5Class;function R(e,t,o,n){if(!o)return;Object.defineProperty(e,t,{enumerable:o.enumerable,configurable:o.configurable,writable:o.writable,value:o.initializer?o.initializer.call(n):void 0})}function I(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function _(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;H(e,t)}function H(e,t){H=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,o){t.__proto__=o;return t};return H(e,t)}function T(e,t,o,n,i){var r={};Object.keys(n).forEach(function(e){r[e]=n[e]});r.enumerable=!!r.enumerable;r.configurable=!!r.configurable;if("value"in r||r.initializer){r.writable=true}r=o.slice().reverse().reduce(function(o,n){return n(e,t,o)||o},r);if(i&&r.initializer!==void 0){r.value=r.initializer?r.initializer.call(i):void 0;r.initializer=undefined}if(r.initializer===void 0){Object.defineProperty(e,t,r);r=null}return r}function w(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let M=(p=v("sap.fe.core.rootView.RootViewBaseController"),g=C(n),d=C(i),p(m=(y=function(t){_(n,t);function n(){var e;for(var o=arguments.length,n=new Array(o),i=0;i<o;i++){n[i]=arguments[i]}e=t.call(this,...n)||this;R(e,"oPlaceholder",b,I(e));R(e,"viewState",P,I(e));e.bIsComputingTitleHierachy=false;return e}var i=n.prototype;i.onInit=function e(){a.init();this._aHelperModels=[]};i.getPlaceholder=function e(){return this.oPlaceholder};i.attachRouteMatchers=function e(){this.oPlaceholder.attachRouteMatchers();this.getAppComponent().getRoutingService().attachAfterRouteMatched(this._onAfterRouteMatched,this)};i.onExit=function e(){this.getAppComponent().getRoutingService().detachAfterRouteMatched(this._onAfterRouteMatched,this);this.oRouter=undefined;a.exit();this._aHelperModels.forEach(function(e){e.destroy()})};i.getResourceBundle=function e(){return this.getOwnerComponent().getModel("i18n").getResourceBundle()};i.getRouter=function e(){if(!this.oRouter){this.oRouter=this.getAppComponent().getRouter()}return this.oRouter};i._createHelperModel=function e(){const t=new u;this._aHelperModels.push(t);return t};i.waitForRightMostViewReady=function e(t){return new Promise(function(e){const o=t.getParameter("views")??[],n=[];o.forEach(function(e){let t=e;if(e&&e.getComponentInstance){const o=e.getComponentInstance();t=o.getRootControl()}if(t&&t.getController()&&t.getController().pageReady){n.push(t)}});const i=n[n.length-1];if(i&&i.getController().pageReady.isPageReady()){e(i)}else if(i){i.getController().pageReady.attachEventOnce("pageReady",function(){e(i)})}})};i.restoreFocusFromHistory=function e(){var t;switch(history.state.focusInfo.type){case"Row":const e=c.byId(history.state.focusInfo.tableId);const o=e.getRowBinding().getCurrentContexts().findIndex(e=>e.getPath()===history.state.focusInfo.contextPathFocus);if(o!==-1){e.focusRow(o)}break;default:(t=c.byId(history.state.focusInfo.controlId))===null||t===void 0?void 0:t.focus()}history.replaceState(Object.assign(history.state,{focusInfo:null}),"")};i._onAfterRouteMatched=function t(o){if(!this._oRouteMatchedPromise){this._oRouteMatchedPromise=this.waitForRightMostViewReady(o).then(e=>{const t=this.getView().getContent()[0];if(t&&t.getAutoFocus&&!t.getAutoFocus()){t.setProperty("autoFocus",true,true)}const o=this.getAppComponent();this._scrollTablesToLastNavigatedItems();if(o.getEnvironmentCapabilities().getCapabilities().UShell){this._computeTitleHierarchy(e)}const n=o.getRouterProxy().isFocusForced();o.getRouterProxy().setFocusForced(false);if(e.getController()&&e.getController().onPageReady&&e.getParent().onPageReady){e.getParent().onPageReady({forceFocus:n})}if(history.state.focusInfo){this.restoreFocusFromHistory()}else if(!n){o.getRouterProxy().restoreFocusForCurrentHash()}if(this.onContainerReady){this.onContainerReady()}}).catch(function(t){e.error("An error occurs while computing the title hierarchy and calling focus method",t)}).finally(()=>{this._oRouteMatchedPromise=null})}};i._getTitleHierarchyCache=function e(){if(!this.oTitleHierarchyCache){this.oTitleHierarchyCache={}}return this.oTitleHierarchyCache};i._computeTitleInfo=function e(t,o,n){let i=arguments.length>3&&arguments[3]!==undefined?arguments[3]:"";const r=n.split("/");if(r[r.length-1].indexOf("?")===-1){n+="?restoreHistory=true"}else{n+="&restoreHistory=true"}return{title:t,subtitle:o,intent:n,icon:i}};i._formatTitle=function e(t,o,n){let i="";switch(t){case"Value":i=`${o}`;break;case"ValueDescription":i=`${o} (${n})`;break;case"DescriptionValue":i=`${n} (${o})`;break;case"Description":i=`${n}`;break;default:}return i};i._fetchTitleValue=async function t(n){const i=this.getAppComponent(),r=this.getView().getModel(),a=i.getMetaModel(),c=a.getMetaPath(n),l=r.createBindingContext(n),u=h.format(a.getObject(`${c}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value`),{context:a.createBindingContext("/")});if(!u){return Promise.resolve("")}const f=h.format(a.getObject(`${c}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@com.sap.vocabularies.Common.v1.Text`),{context:a.createBindingContext("/")}),p=a.getObject(`${c}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@`),g=[],d=s.complexParser(u),m=new Promise(function(e){const t=o.computeDisplayMode(p);e(t)});g.push(m);const y=d.parts?d.parts[0].path:d.path,b=d.formatter,P=r.bindProperty(y,l,{$$groupId:"$auto.Heroes"});P.initialize();const C=new Promise(function(e){const t=function(o){const n=b?b(o.getSource().getValue()):o.getSource().getValue();P.detachChange(t);e(n)};P.attachChange(t)});g.push(C);if(f){const e=s.complexParser(f);let t=e.parts?e.parts[0].path:e.path;t=y.lastIndexOf("/")>-1?`${y.slice(0,y.lastIndexOf("/"))}/${t}`:t;const o=e.formatter,n=r.bindProperty(t,l,{$$groupId:"$auto.Heroes"});n.initialize();const i=new Promise(function(e){const t=function(i){const r=o?o(i.getSource().getValue()):i.getSource().getValue();n.detachChange(t);e(r)};n.attachChange(t)});g.push(i)}try{const e=await Promise.all(g);let t="";if(typeof e!=="string"){t=this._formatTitle(e[0],e[1],e[2])}return t}catch(t){e.error("Error while fetching the title from the header info :"+t)}return""};i._getAppSpecificHash=function e(){const t=l.getInstance();return"hrefForAppSpecificHash"in t?f.decode(t.hrefForAppSpecificHash("")):"#/"};i._getHash=function e(){return l.getInstance().getHash()};i.getTitleInfoFromPath=function e(t){const o=this._getTitleHierarchyCache();if(o[t]){return Promise.resolve(o[t])}const n=this.getAppComponent().getMetaModel();const i=n.getMetaPath(t);const r=n.getObject(`${i}/@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName`);const a=this._getAppSpecificHash();const s=a+t.slice(1);return this._fetchTitleValue(t).then(e=>{const n=this._computeTitleInfo(r,e,s);o[t]=n;return n})};i._ensureHierarchyElementsAreStrings=function e(t){const o=[];for(const e in t){const n=t[e];const i={};for(const e in n){i[e]=typeof n[e]!=="string"?String(n[e]):n[e]}o.push(i)}return o};i._getTargetTypeFromHash=function e(t){var o;const n=this.getAppComponent();let i="";const r=((o=n.getManifestEntry("sap.ui5").routing)===null||o===void 0?void 0:o.routes)??[];for(const e of r){const o=n.getRouter().getRoute(e.name);if(o!==null&&o!==void 0&&o.match(t)){const t=Array.isArray(e.target)?e.target[0]:e.target;i=n.getRouter().getTarget(t)._oOptions.name;break}}return i};i._computeTitleHierarchy=function t(o){const n=this.getAppComponent(),i=o.getBindingContext(),r=o.getParent(),a=[],s=this._getAppSpecificHash(),c=n.getManifestEntry("sap.app"),l=c.title||"",u=c.subTitle||"",h=c.icon||"";let f,p;if(r&&r._getPageTitleInformation){if(i){if(this._getTargetTypeFromHash("")==="sap.fe.templates.ListReport"){a.push(Promise.resolve(this._computeTitleInfo(l,u,s,h)))}p=i.getPath();const e=p.split("/");let t="";e.shift();e.pop();e.forEach(e=>{t+=`/${e}`;const o=n.getMetaModel(),i=o.getMetaPath(t),r=o.getObject(`${i}/@com.sap.vocabularies.Common.v1.ResultContext`);if(!r){a.push(this.getTitleInfoFromPath(t))}})}f=r._getPageTitleInformation();f=this._computeTitleInfo(f.title,f.subtitle,s+this._getHash());if(i){this._getTitleHierarchyCache()[p]=f}else{this._getTitleHierarchyCache()[s]=f}}else{a.push(Promise.reject("Title information missing in HeaderInfo"))}return Promise.all(a).then(e=>{const t=this._ensureHierarchyElementsAreStrings(e),o=f.title;t.reverse();n.getShellServices().setHierarchy(t);this._setShellMenuTitle(n,o,l)}).catch(function(t){e.error(t)}).finally(()=>{this.bIsComputingTitleHierachy=false}).catch(function(t){e.error(t)})};i.calculateLayout=function e(t,o,n){let i=arguments.length>3&&arguments[3]!==undefined?arguments[3]:false;return""};i.onContextBoundToView=function e(t){if(t){const e=this.getView().getModel("internal").getProperty("/deepestPath"),o=t.getPath();if(!e||e.indexOf(o)!==0){this.getView().getModel("internal").setProperty("/deepestPath",o,undefined,true)}}};i.displayErrorPage=function e(t,o){return Promise.resolve(true)};i.updateUIStateForView=function e(t,o){};i.getInstancedViews=function e(){return[]};i._scrollTablesToLastNavigatedItems=function e(){};i.isFclEnabled=function e(){return false};i._setShellMenuTitle=function e(t,o,n){t.getShellServices().setTitle(o)};i.getAppContentContainer=function e(){var t,o;const n=this.getAppComponent();const i=((t=n.getManifestEntry("sap.ui5").routing)===null||t===void 0?void 0:(o=t.config)===null||o===void 0?void 0:o.controlId)??"appContent";return this.getView().byId(i)};return n}(t),b=T(y.prototype,"oPlaceholder",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),P=T(y.prototype,"viewState",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),y))||m);return M},false);
//# sourceMappingURL=RootViewBaseController.js.map