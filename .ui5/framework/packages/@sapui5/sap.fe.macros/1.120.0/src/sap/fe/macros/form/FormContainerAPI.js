/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport","../MacroAPI"],function(e,t){"use strict";var r,i,n,o,a,l,u,s,c;var f=e.xmlEventHandler;var p=e.property;var b=e.defineUI5Class;function d(e,t,r,i){if(!r)return;Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function y(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function h(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;v(e,t)}function v(e,t){v=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return v(e,t)}function g(e,t,r,i,n){var o={};Object.keys(i).forEach(function(e){o[e]=i[e]});o.enumerable=!!o.enumerable;o.configurable=!!o.configurable;if("value"in o||o.initializer){o.writable=true}o=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},o);if(n&&o.initializer!==void 0){o.value=o.initializer?o.initializer.call(n):void 0;o.initializer=undefined}if(o.initializer===void 0){Object.defineProperty(e,t,o);o=null}return o}function m(e,t){throw new Error("Decorating class property failed. Please ensure that "+"proposal-class-properties is enabled and runs after the decorators transform.")}let w=(r=b("sap.fe.macros.form.FormContainerAPI"),i=p({type:"string"}),n=p({type:"boolean"}),o=f(),r(a=(l=(c=function(e){h(t,e);function t(t){var r;r=e.call(this,t,true)||this;d(r,"formContainerId",u,y(r));d(r,"showDetails",s,y(r));r.setParentBindingContext("internal",`controls/${r.formContainerId}`);return r}var r=t.prototype;r.toggleDetails=function e(){this.showDetails=!this.showDetails};return t}(t),c.isDependentBound=true,c),u=g(l.prototype,"formContainerId",[i],{configurable:true,enumerable:true,writable:true,initializer:null}),s=g(l.prototype,"showDetails",[n],{configurable:true,enumerable:true,writable:true,initializer:function(){return false}}),g(l.prototype,"toggleDetails",[o],Object.getOwnPropertyDescriptor(l.prototype,"toggleDetails"),l.prototype),l))||a);return w},false);
//# sourceMappingURL=FormContainerAPI.js.map