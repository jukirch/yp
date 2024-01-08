/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/insights/CardExtension", "./formatters/ValueFormatter"], function (CardExtension, valueFormatters) {
  "use strict";

  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let InsightsFormatters = /*#__PURE__*/function (_CardExtension) {
    _inheritsLoose(InsightsFormatters, _CardExtension);
    function InsightsFormatters() {
      return _CardExtension.apply(this, arguments) || this;
    }
    var _proto = InsightsFormatters.prototype;
    _proto.init = function init() {
      _CardExtension.prototype.init.apply(this);
      this.addFormatters("sapfe", {
        formatWithBrackets: valueFormatters.formatWithBrackets,
        formatTitle: valueFormatters.formatTitle
      });
    };
    return InsightsFormatters;
  }(CardExtension);
  return InsightsFormatters;
}, false);
