/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/core/AppStateHandler","sap/fe/core/controllerextensions/routing/RouterProxy","sap/fe/core/helpers/ClassSupport","sap/fe/core/helpers/DraftEditState","sap/fe/core/helpers/ModelHelper","sap/fe/core/library","sap/fe/core/manifestMerger/ChangePageConfiguration","sap/fe/core/support/Diagnostics","sap/m/routing/Router","sap/ui/core/Core","sap/ui/core/Element","sap/ui/core/UIComponent","sap/ui/mdc/table/TableTypeBase","sap/ui/model/json/JSONModel","./controllerextensions/BusyLocker","./converters/MetaModelConverter","./helpers/SemanticDateOperators"],function(e,t,o,i,r,n,a,s,l,c,u,p,f,d,g,v,C,h){"use strict";var S,R,N;var M=C.deleteModelCacheData;var E=s.cleanPageConfigurationChanges;var A=s.changeConfiguration;var y=i.defineUI5Class;function m(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;w(e,t)}function w(e,t){w=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,o){t.__proto__=o;return t};return w(e,t)}const I=a.StartupMode;d.prototype.exit=function(){var e;(e=this._oManagedObjectModel)===null||e===void 0?void 0:e.destroy();delete this._oManagedObjectModel;p.prototype.exit.apply(this,[])};const O={FCL:{VIEWNAME:"sap.fe.core.rootView.Fcl",VIEWNAME_COMPATIBILITY:"sap.fe.templates.RootContainer.view.Fcl",ROUTERCLASS:"sap.f.routing.Router"},NAVCONTAINER:{VIEWNAME:"sap.fe.core.rootView.NavContainer",VIEWNAME_COMPATIBILITY:"sap.fe.templates.RootContainer.view.NavContainer",ROUTERCLASS:"sap.m.routing.Router"}};const V=c;let T=(S=y("sap.fe.core.AppComponent",{interfaces:["sap.ui.core.IAsyncContentCreation"],config:{fullWidth:true},manifest:{"sap.ui5":{services:{resourceModel:{factoryName:"sap.fe.core.services.ResourceModelService",startup:"waitFor",settings:{bundles:["sap.fe.core.messagebundle"],modelName:"sap.fe.i18n"}},routingService:{factoryName:"sap.fe.core.services.RoutingService",startup:"waitFor"},shellServices:{factoryName:"sap.fe.core.services.ShellServices",startup:"waitFor"},ShellUIService:{factoryName:"sap.ushell.ui5service.ShellUIService"},navigationService:{factoryName:"sap.fe.core.services.NavigationService",startup:"waitFor"},environmentCapabilities:{factoryName:"sap.fe.core.services.EnvironmentService",startup:"waitFor"},sideEffectsService:{factoryName:"sap.fe.core.services.SideEffectsService",startup:"waitFor"},asyncComponentService:{factoryName:"sap.fe.core.services.AsyncComponentService",startup:"waitFor"},collaborationManagerService:{factoryName:"sap.fe.core.services.CollaborationManagerService",startup:"waitFor"},collaborativeToolsService:{factoryName:"sap.fe.core.services.CollaborativeToolsService",startup:"waitFor"}},rootView:{viewName:O.NAVCONTAINER.VIEWNAME,type:"XML",async:true,id:"appRootView"},routing:{config:{controlId:"appContent",routerClass:O.NAVCONTAINER.ROUTERCLASS,viewType:"XML",controlAggregation:"pages",async:true,containerOptions:{propagateModel:true}}}}},designtime:"sap/fe/core/designtime/AppComponent.designtime",library:"sap.fe.core"}),S(R=(N=function(i){m(s,i);function s(){var e;for(var t=arguments.length,o=new Array(t),r=0;r<t;r++){o[r]=arguments[r]}e=i.call(this,...o)||this;e.startupMode=I.Normal;return e}var c=s.prototype;c._isFclEnabled=function e(){var t,o;const i=this.getManifestEntry("sap.ui5");return(i===null||i===void 0?void 0:(t=i.routing)===null||t===void 0?void 0:(o=t.config)===null||o===void 0?void 0:o.routerClass)===O.FCL.ROUTERCLASS};c.initializeFeatureToggles=async function e(){return Promise.resolve()};c.changePageConfiguration=function e(t,o,i){A(this.getManifest(),t,o,i,true)};c.getRouterProxy=function e(){return this._oRouterProxy};c.getAppStateHandler=function e(){return this._oAppStateHandler};c.getRootViewController=function e(){return this.getRootControl().getController()};c.getRootContainer=function e(){return this.getRootControl().getContent()[0]};c.getStartupMode=function e(){return this.startupMode};c.setStartupModeCreate=function e(){this.startupMode=I.Create};c.setStartupModeAutoCreate=function e(){this.startupMode=I.AutoCreate};c.setStartupModeDeeplink=function e(){this.startupMode=I.Deeplink};c.init=function e(){var c,u,p;const f=new g({editMode:a.EditMode.Display,isEditable:false,draftStatus:a.DraftStatus.Clear,busy:false,busyLocal:{},pages:{}});const d=new g({pages:{}});f.setDefaultBindingMode("OneWay");n.enhanceUiJSONModel(f,a);n.enhanceInternalJSONModel(d);this.setModel(f,"ui");this.setModel(d,"internal");this.bInitializeRouting=this.bInitializeRouting!==undefined?this.bInitializeRouting:true;this._oRouterProxy=new o;this._oAppStateHandler=new t(this);this._oDiagnostics=new l;const v=this.getModel();if(v!==null&&v!==void 0&&(c=v.isA)!==null&&c!==void 0&&c.call(v,"sap.ui.model.odata.v4.ODataModel")){n.enhanceODataModel(v);this.entityContainer=v.getMetaModel().requestObject("/$EntityContainer/")}else{this.entityContainer=Promise.resolve()}if((u=this.getManifestEntry("sap.fe"))!==null&&u!==void 0&&(p=u.app)!==null&&p!==void 0&&p.disableCollaborationDraft){n.disableCollaborationDraft=true}const C=this.getManifest()["sap.ui5"];this.checkRoutingConfiguration(C);h.addSemanticDateOperators();r.addDraftEditStateOperator();i.prototype.init.call(this);s.instanceMap[this.getId()]=this};c.checkRoutingConfiguration=function t(o){var i;if(o!==null&&o!==void 0&&(i=o.rootView)!==null&&i!==void 0&&i.viewName){var r,n,a,s,l,c;if(o.rootView.viewName===O.FCL.VIEWNAME_COMPATIBILITY){o.rootView.viewName=O.FCL.VIEWNAME}else if(o.rootView.viewName===O.NAVCONTAINER.VIEWNAME_COMPATIBILITY){o.rootView.viewName=O.NAVCONTAINER.VIEWNAME}if(o.rootView.viewName===O.FCL.VIEWNAME&&((r=o.routing)===null||r===void 0?void 0:(n=r.config)===null||n===void 0?void 0:n.routerClass)===O.FCL.ROUTERCLASS){e.info(`Rootcontainer: "${O.FCL.VIEWNAME}" - Routerclass: "${O.FCL.ROUTERCLASS}"`)}else if(o.rootView.viewName===O.NAVCONTAINER.VIEWNAME&&((a=o.routing)===null||a===void 0?void 0:(s=a.config)===null||s===void 0?void 0:s.routerClass)===O.NAVCONTAINER.ROUTERCLASS){e.info(`Rootcontainer: "${O.NAVCONTAINER.VIEWNAME}" - Routerclass: "${O.NAVCONTAINER.ROUTERCLASS}"`)}else if((l=o.rootView)!==null&&l!==void 0&&(c=l.viewName)!==null&&c!==void 0&&c.includes("sap.fe.core.rootView")){var u,p;throw Error(`\nWrong configuration for the couple (rootView/routerClass) in manifest file.\n`+`Current values are :(${o.rootView.viewName}/${((u=o.routing)===null||u===void 0?void 0:(p=u.config)===null||p===void 0?void 0:p.routerClass)||"<missing router class>"})\n`+`Expected values are \n`+`\t - (${O.NAVCONTAINER.VIEWNAME}/${O.NAVCONTAINER.ROUTERCLASS})\n`+`\t - (${O.FCL.VIEWNAME}/${O.FCL.ROUTERCLASS})`)}else{e.info(`Rootcontainer: "${o.rootView.viewName}" - Routerclass: "${O.NAVCONTAINER.ROUTERCLASS}"`)}}};c.onServicesStarted=async function t(){await this.initializeFeatureToggles();const o=()=>{this.entityContainer.then(()=>{if(this.getRootViewController().attachRouteMatchers){this.getRootViewController().attachRouteMatchers()}this.getRouter().initialize();this.getRouterProxy().init(this,this._isFclEnabled())}).catch(e=>{const t=u.getLibraryResourceBundle("sap.fe.core");this.getRootViewController().displayErrorPage(t.getText("C_APP_COMPONENT_SAPFE_APPSTART_TECHNICAL_ISSUES"),{title:t.getText("C_COMMON_SAPFE_ERROR"),description:e.message,FCLLevel:0})})};if(this.bInitializeRouting){return this.getRoutingService().initializeRouting().then(()=>{if(this.getRootViewController()){o()}else{this.getRootControl().attachAfterInit(function(){o()})}}).catch(function(t){e.error(`cannot cannot initialize routing: ${t.toString()}`)})}};c.exit=function e(){this._oAppStateHandler.destroy();this._oRouterProxy.destroy();delete this._oAppStateHandler;delete this._oRouterProxy;M(this.getMetaModel());this.getModel("ui").destroy();E()};c.getMetaModel=function e(){return this.getModel().getMetaModel()};c.getDiagnostics=function e(){return this._oDiagnostics};c.destroy=function t(o){var r,n;try{delete s.instanceMap[this.getId()];delete window._routing}catch(t){e.info(t)}const a=this.oModels[undefined];let l;if(a!==null&&a!==void 0&&a.oRequestor){l=Object.assign({},a.oRequestor.mHeaders)}(r=this.getRoutingService())===null||r===void 0?void 0:(n=r.beforeExit)===null||n===void 0?void 0:n.call(r);i.prototype.destroy.call(this,o);if(l&&a.oRequestor){a.oRequestor.mHeaders=l}};c.getRoutingService=function e(){return{}};c.getShellServices=function e(){return{}};c.getNavigationService=function e(){return{}};c.getSideEffectsService=function e(){return{}};c.getEnvironmentCapabilities=function e(){return{}};c.getCollaborationManagerService=function e(){return{}};c.getCollaborativeToolsService=function e(){return{}};c.getStartupParameters=async function e(){const t=this.getComponentData();return Promise.resolve(t&&t.startupParameters||{})};c.restore=function e(){this.getRootViewController().viewState.onRestore()};c.suspend=function e(){this.getRootViewController().viewState.onSuspend()};c.navigateBasedOnStartupParameter=async function t(o){try{if(!v.isLocked(this.getModel("ui"))){if(!o){o=null}const e=this.getRoutingService();await e._manageDeepLinkStartup(o)}}catch(t){e.error(t);v.unlock(this.getModel("ui"))}};c.isCollaborationManagerServiceEnabled=function e(){return true};return s}(f),N.instanceMap={},N))||R);return T},false);
//# sourceMappingURL=AppComponent.js.map