/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/insights/CardExtension","./formatters/ValueFormatter"],function(t,r){"use strict";function e(t,r){t.prototype=Object.create(r.prototype);t.prototype.constructor=t;o(t,r)}function o(t,r){o=Object.setPrototypeOf?Object.setPrototypeOf.bind():function t(r,e){r.__proto__=e;return r};return o(t,r)}let n=function(t){e(o,t);function o(){return t.apply(this,arguments)||this}var n=o.prototype;n.init=function e(){t.prototype.init.apply(this);this.addFormatters("sapfe",{formatWithBrackets:r.formatWithBrackets,formatTitle:r.formatTitle})};return o}(t);return n},false);
//# sourceMappingURL=InsightsFormattersExtension.js.map