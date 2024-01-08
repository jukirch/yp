/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport","sap/ui/model/odata/type/DateTimeWithTimezone"],function(e,t){"use strict";var o,r;var n=e.defineUI5Class;function i(e,t){e.prototype=Object.create(t.prototype);e.prototype.constructor=e;u(e,t)}function u(e,t){u=Object.setPrototypeOf?Object.setPrototypeOf.bind():function e(t,o){t.__proto__=o;return t};return u(e,t)}let a=(o=n("sap.fe.core.type.DateTimeWithTimezone"),o(r=function(e){i(t,e);function t(t,o){var r;r=e.call(this,t,o)||this;r.bShowTimezoneForEmptyValues=(t===null||t===void 0?void 0:t.showTimezoneForEmptyValues)??true;return r}var o=t.prototype;o.formatValue=function t(o,r){const n=o&&o[0];if(n===undefined||!n&&!this.bShowTimezoneForEmptyValues){return null}return e.prototype.formatValue.call(this,o,r)};return t}(t))||r);return a},false);
//# sourceMappingURL=DateTimeWithTimezone.js.map