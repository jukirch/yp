/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath","sap/base/util/UriParameters","sap/fe/core/helpers/ClassSupport","sap/fe/placeholder/library","sap/ui/core/mvc/ControllerExtension","sap/ui/core/Placeholder"],function(e,t,o,r,a,i){"use strict";var n,l,c,s,p,h,u,d,f,b;var P=o.publicExtension;var g=o.defineUI5Class;function y(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;m(e,t)}function m(e,t){m=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,o){t.__proto__=o;return t};return m(e,t)}function O(e,t,o,r,a){var i={};Object.keys(r).forEach(function(e){i[e]=r[e]});i.enumerable=!!i.enumerable;i.configurable=!!i.configurable;if("value"in i||i.initializer){i.writable=true}i=o.slice().reverse().reduce(function(o,r){return r(e,t,o)||o},i);if(a&&i.initializer!==void 0){i.value=i.initializer?i.initializer.call(a):void 0;i.initializer=undefined}if(i.initializer===void 0){Object.defineProperty(e,t,i);i=null}return i}let D=(n=g("sap.fe.core.controllerextensions.Placeholder"),l=P(),c=P(),s=P(),p=P(),h=P(),u=P(),d=P(),n(f=(b=function(o){y(r,o);function r(){return o.apply(this,arguments)||this}var a=r.prototype;a.attachHideCallback=function e(){if(this.isPlaceholderEnabled()){const e=this.base.getView();const o=e.getParent()&&e.getParent().oContainer;const r=o&&o.getParent();if(!r){return}const a={onAfterShow:function(e){if(e.isBackToPage){r.hidePlaceholder()}else if(t.fromQuery(window.location.hash.replace(/#.*\?/,"")).get("restoreHistory")==="true"){r.hidePlaceholder()}}};o.addEventDelegate(a);const i=e.getController().pageReady;const n=["pageReady"];if(e.getControllerName()==="sap.fe.templates.ObjectPage.ObjectPageController"){n.push("heroesBatchReceived")}n.forEach(function(e){i.attachEvent(e,null,function(){r.hidePlaceholder()},null)})}};a.attachRouteMatchers=function e(){this._init()};a._init=function e(){this.oAppComponent=this.base.getAppComponent();this.oRootContainer=this.oAppComponent.getRootContainer();this.oPlaceholders={};if(this.isPlaceholderEnabled()){i.registerProvider(function(e){switch(e.name){case"sap.fe.templates.ListReport":return{html:"sap/fe/placeholder/view/PlaceholderLR.fragment.html",autoClose:false};case"sap.fe.templates.ObjectPage":return{html:"sap/fe/placeholder/view/PlaceholderOP.fragment.html",autoClose:false};default:}})}if(this.isPlaceholderDebugEnabled()){this.initPlaceholderDebug()}};a.initPlaceholderDebug=function e(){this.resetPlaceholderDebugStats();const t={apply:e=>{if(this.oRootContainer._placeholder&&this.oRootContainer._placeholder.placeholder){this.debugStats.iHidePlaceholderTimestamp=Date.now()}return e.bind(this.oRootContainer)()}};const o=new Proxy(this.oRootContainer.hidePlaceholder,t);this.oRootContainer.hidePlaceholder=o};a.isPlaceholderDebugEnabled=function e(){if(t.fromQuery(window.location.search).get("sap-ui-xx-placeholder-debug")==="true"){return true}return false};a.resetPlaceholderDebugStats=function e(){this.debugStats={iHidePlaceholderTimestamp:0,iPageReadyEventTimestamp:0,iHeroesBatchReceivedEventTimestamp:0}};a.getPlaceholderDebugStats=function e(){return this.debugStats};a.isPlaceholderEnabled=function t(){const o=e.get("sap-ushell-config.apps.placeholder.enabled");if(o===false){return false}return i.isEnabled()};return r}(a),O(b.prototype,"attachHideCallback",[l],Object.getOwnPropertyDescriptor(b.prototype,"attachHideCallback"),b.prototype),O(b.prototype,"attachRouteMatchers",[c],Object.getOwnPropertyDescriptor(b.prototype,"attachRouteMatchers"),b.prototype),O(b.prototype,"initPlaceholderDebug",[s],Object.getOwnPropertyDescriptor(b.prototype,"initPlaceholderDebug"),b.prototype),O(b.prototype,"isPlaceholderDebugEnabled",[p],Object.getOwnPropertyDescriptor(b.prototype,"isPlaceholderDebugEnabled"),b.prototype),O(b.prototype,"resetPlaceholderDebugStats",[h],Object.getOwnPropertyDescriptor(b.prototype,"resetPlaceholderDebugStats"),b.prototype),O(b.prototype,"getPlaceholderDebugStats",[u],Object.getOwnPropertyDescriptor(b.prototype,"getPlaceholderDebugStats"),b.prototype),O(b.prototype,"isPlaceholderEnabled",[d],Object.getOwnPropertyDescriptor(b.prototype,"isPlaceholderEnabled"),b.prototype),b))||f);return D},false);
//# sourceMappingURL=Placeholder.js.map