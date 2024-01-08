/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport","sap/ui/core/Core","sap/ui/model/odata/type/String","sap/ui/model/ValidateException"],function(t,e,o,r){"use strict";var a,n;var p=t.defineUI5Class;function i(t,e){t.prototype=Object.create(e.prototype);t.prototype.constructor=t;s(t,e)}function s(t,e){s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function t(e,o){e.__proto__=o;return e};return s(t,e)}const u=/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$/;let c=(a=p("sap.fe.core.type.Email"),a(n=function(t){i(o,t);function o(){return t.apply(this,arguments)||this}var a=o.prototype;a.validateValue=function o(a){if(!u.test(a)){throw new r(e.getLibraryResourceBundle("sap.fe.core").getText("T_EMAILTYPE_INVALID_VALUE"))}t.prototype.validateValue.call(this,a)};return o}(o))||n);return c},false);
//# sourceMappingURL=Email.js.map