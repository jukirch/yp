/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport","sap/ui/core/mvc/ControllerExtension"],function(e,t){"use strict";var r,n;var o={};var i=e.defineUI5Class;function s(e){if(e===void 0){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}return e}function c(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;u(e,t)}function u(e,t){u=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,r){t.__proto__=r;return t};return u(e,t)}let a=(r=i("sap.fe.core.controllerextensions.BaseControllerExtension"),r(n=function(e){c(t,e);function t(){var t;t=e.call(this)||this;s(t).init();return t}o=t;return t}(t))||n);o=a;return o},false);
//# sourceMappingURL=BaseControllerExtension.js.map