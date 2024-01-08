/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/TemplateModel","sap/fe/core/helpers/LoaderUtils","sap/fe/core/helpers/ModelHelper","sap/fe/core/manifestMerger/ChangePageConfiguration","sap/ui/Device","sap/ui/VersionInfo","sap/ui/core/Component","sap/ui/core/mvc/View","sap/ui/core/service/Service","sap/ui/core/service/ServiceFactory","sap/ui/core/service/ServiceFactoryRegistry","sap/ui/model/json/JSONModel","../helpers/DynamicAnnotationPathHelper"],function(e,t,n,o,i,r,s,a,c,l,u,p,g,d){"use strict";var f=d.resolveDynamicExpression;var h=i.applyPageConfigurationChanges;var v=n.requireDependencies;function m(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;C(e,t)}function C(e,t){C=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,n){t.__proto__=n;return t};return C(e,t)}let w=function(n){m(i,n);function i(){return n.apply(this,arguments)||this}var l=i.prototype;l.init=function e(){const t=[];const n=this.getContext();const o=n.scopeObject;const i=a.getOwnerComponentFor(o);const r=i.getMetaModel();this.pageId=i.getLocalId(o.getId());const c=`${i.getMetadata().getComponentName()}::${this.pageId}`;const l=o.getEnhanceI18n()||[];let u;this.oFactory=n.factory;if(l){u=i.getMetadata().getComponentName();for(let e=0;e<l.length;e++){const t=i.getModel(l[e]);if(t&&t.isA("sap.ui.model.resource.ResourceModel")){l[e]=t}else{l[e]=`${u}.${l[e].replace(".properties","")}`}}}const g=`${i.getMetadata().getName()}_${c}_${sap.ui.getCore().getConfiguration().getLanguageTag()}`;t.push(p.get("sap.fe.core.services.ResourceModelService").createInstance({scopeType:"component",scopeObject:o,settings:{bundles:["sap.fe.core.messagebundle","sap.fe.macros.messagebundle","sap.fe.templates.messagebundle"],enhanceI18n:l,modelName:"sap.fe.i18n"}}).then(e=>{this.oResourceModelService=e;return e.getResourceModel()}));t.push(p.get("sap.fe.core.services.CacheHandlerService").createInstance({settings:{metaModel:r,appComponent:i,component:o}}).then(e=>{this.oCacheHandlerService=e;return e.validateCacheKey(g,o)}));t.push(s.load().then(function(e){let t="";if(!e.libraries){t=sap.ui.buildinfo.buildtime}else{e.libraries.forEach(function(e){t+=e.buildTimestamp})}return t}).catch(function(){return"<NOVALUE>"}));this.initPromise=Promise.all(t).then(async e=>{const t=e[0];const n=e[1];const o=i.getSideEffectsService();const r=await i.getService("environmentCapabilities");o.initializeSideEffects(r.getCapabilities());const[s,a]=await v(["sap/fe/core/converters/TemplateConverter","sap/fe/core/converters/MetaModelConverter"]);return this.createView(t,c,n,s,a)}).then(function(e){const t=p.get("sap.fe.core.services.CacheHandlerService").getInstance(r);t.invalidateIfNeeded(e,g,o)})};l.refreshView=function t(n){const o=n.getRootControl();if(o){o.destroy()}else if(this.oView){this.oView.destroy()}return this.createView(this.resourceModel,this.stableId,"",this.TemplateConverter,this.MetaModelConverter).then(function(){n.oContainer.invalidate()}).catch(function(t){n.oContainer.invalidate();e.error(t)})};l.createView=async function n(i,s,l,u,p){this.resourceModel=i;this.stableId=s;this.TemplateConverter=u;this.MetaModelConverter=p;const d=this.getContext();const v=d.settings;const m=v.converterType;const C=d.scopeObject;const w=a.getOwnerComponentFor(C);const y=w.getRoutingService().getTargetInformationFor(C).options.settings.fullContextPath;const M=w.getMetaModel();const V=w.getManifest();const I=new g(r).setDefaultBindingMode("OneWay");const S=new g(V);const O=false;let x,D,N,P;function j(){const e=y.split("/");const t=e.reduce(function(e,t){if(t===""){return e}if(e===""){e=`/${t}`}else{const n=M.getObject(`${e}/$NavigationPropertyBinding/${t}`);if(n&&Object.keys(n).length>0){e+="/$NavigationPropertyBinding"}e+=`/${t}`}return e},"");let n=v.viewType||C.getViewType()||"XML";if(n!=="XML"){n=undefined}return{type:n,preprocessors:{xml:{bindingContexts:{entitySet:t?M.createBindingContext(t):null,fullContextPath:y?M.createBindingContext(y):null,contextPath:y?M.createBindingContext(y):null,converterContext:x.createBindingContext("/",undefined,{noResolve:true}),viewData:P?D.createBindingContext("/"):null},models:{entitySet:M,fullContextPath:M,contextPath:M,"sap.fe.i18n":i,metaModel:M,device:I,manifest:S,converterContext:x,viewData:D},appComponent:w},controls:{}},id:s,viewName:v.viewName||C.getViewName(),viewData:P,cache:{keys:[l],additionalData:{getAdditionalCacheData:()=>x.getData(),setAdditionalCacheData:e=>{x.setData(e)}}},models:{"sap.fe.i18n":i},height:"100%"}}const T=t=>{e.error(t.message,t);N.viewName=v.errorViewName||"sap.fe.core.services.view.TemplatingErrorPage";N.preprocessors.xml.models["error"]=new g(t);return C.runAsOwner(()=>c.create(N).then(e=>{this.oView=e;this.oView.setModel(new g(this.oView),"$view");C.setAggregation("rootControl",this.oView);return l}))};try{var $;const n=await w.getService("routingService");const a=n.getTargetInformationFor(C);const d=V["sap.app"]&&V["sap.app"].crossNavigation&&V["sap.app"].crossNavigation.outbounds||{};const v=C.getNavigation()||{};Object.keys(v).forEach(function(e){const t=v[e];let n;if(t.detail&&t.detail.outbound&&d[t.detail.outbound]){n=d[t.detail.outbound];t.detail.outboundDetail={semanticObject:n.semanticObject,action:n.action,parameters:n.parameters}}if(t.create&&t.create.outbound&&d[t.create.outbound]){n=d[t.create.outbound];t.create.outboundDetail={semanticObject:n.semanticObject,action:n.action,parameters:n.parameters}}});P={appComponent:w,navigation:v,viewLevel:a.viewLevel,stableId:s,contentDensities:($=V["sap.ui5"])===null||$===void 0?void 0:$.contentDensities,resourceModel:i,fullContextPath:y,isDesktop:r.system.desktop,isPhone:r.system.phone};if(C.getViewData){var E,F,R,B,L;Object.assign(P,C.getViewData());const e=(V===null||V===void 0?void 0:(E=V["sap.ui5"])===null||E===void 0?void 0:(F=E.routing)===null||F===void 0?void 0:(R=F.targets)===null||R===void 0?void 0:(B=R[this.pageId])===null||B===void 0?void 0:(L=B.options)===null||L===void 0?void 0:L.settings)||{};P=h(e,P,w,this.pageId)}P.isShareButtonVisibleForMyInbox=b.getShareButtonVisibilityForMyInbox(w);const I=w.getShellServices();P.converterType=m;P.shellContentDensity=I.getContentDensity();P.retrieveTextFromValueList=V["sap.fe"]&&V["sap.fe"].form?V["sap.fe"].form.retrieveTextFromValueList:undefined;D=new g(P);if(P.controlConfiguration){for(const e in P.controlConfiguration){if(e.includes("[")){const t=f(e,M);P.controlConfiguration[t]=P.controlConfiguration[e]}}}p.convertTypes(M,w.getEnvironmentCapabilities().getCapabilities());x=new t(()=>{try{const t=w.getDiagnostics();const n=t.getIssues().length;const o=u.convertPage(m,M,P,t,y,w.getEnvironmentCapabilities().getCapabilities(),C);const i=t.getIssues();const r=i.slice(n);if(r.length>0){e.warning("Some issues have been detected in your project, please check the UI5 support assistant rule for sap.fe.core")}return o}catch(t){e.error(t,t);return{}}},M);if(!O){N=j();C.setModel(x,"_pageModel");return C.runAsOwner(()=>c.create(N).catch(T).then(e=>{this.oView=e;const t=new g(this.oView);o.enhanceViewJSONModel(t);this.oView.setModel(t,"$view");this.oView.setModel(D,"viewData");C.setAggregation("rootControl",this.oView);return l}).catch(t=>e.error(t.message,t)))}}catch(t){e.error(t.message,t);throw new Error(`Error while creating view : ${t}`)}};l.getView=function e(){return this.oView};l.getInterface=function e(){return this};l.exit=function e(){if(this.oResourceModelService){this.oResourceModelService.destroy()}if(this.oCacheHandlerService){this.oCacheHandlerService.destroy()}this.oFactory.removeGlobalInstance()};return i}(l);let b=function(e){m(t,e);function t(){var t;for(var n=arguments.length,o=new Array(n),i=0;i<n;i++){o[i]=arguments[i]}t=e.call(this,...o)||this;t._oInstanceRegistry={};return t}var n=t.prototype;n.createInstance=function e(n){t.iCreatingViews++;const o=new w(Object.assign({factory:this},n));return o.initPromise.then(function(){t.iCreatingViews--;return o})};n.removeGlobalInstance=function e(){this._oInstanceRegistry={}};t.getShareButtonVisibilityForMyInbox=function e(t){const n=t.getComponentData();if(n!==undefined&&n.feEnvironment){return n.feEnvironment.getShareControlVisibility()}return undefined};t.getNumberOfViewsInCreationState=function e(){return t.iCreatingViews};return t}(u);return b},false);
//# sourceMappingURL=TemplatedViewServiceFactory.js.map