/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport","sap/fe/macros/filter/type/Value"],function(t,e){"use strict";var r,o;var n={};var a=t.defineUI5Class;function u(t,e){t.prototype=Object.create(e.prototype);t.prototype.constructor=t;i(t,e)}function i(t,e){i=Object.setPrototypeOf?Object.setPrototypeOf.bind():function t(e,r){e.__proto__=r;return e};return i(t,e)}let p=(r=a("sap.fe.macros.filter.type.Range"),r(o=function(t){u(e,t);function e(){return t.apply(this,arguments)||this}n=e;var r=e.prototype;r.getDefaultOperatorName=function t(){return"BT"};r.formatConditionValues=function t(e){return e};r.formatValue=function e(r,o){let n=t.prototype.formatValue.call(this,r,o);if(!n){const t=this.oFormatOptions.min||Number.MIN_SAFE_INTEGER,e=this.oFormatOptions.max||Number.MAX_SAFE_INTEGER;n=[t,e]}return n};return e}(e))||o);n=p;return n},false);
//# sourceMappingURL=Range.js.map