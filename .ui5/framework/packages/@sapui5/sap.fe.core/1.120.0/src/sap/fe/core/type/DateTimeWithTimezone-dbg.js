/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/model/odata/type/DateTimeWithTimezone"], function (ClassSupport, _DateTimeWithTimezone) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let DateTimeWithTimezone = (_dec = defineUI5Class("sap.fe.core.type.DateTimeWithTimezone"), _dec(_class = /*#__PURE__*/function (_DateTimeWithTimezone2) {
    _inheritsLoose(DateTimeWithTimezone, _DateTimeWithTimezone2);
    function DateTimeWithTimezone(oFormatOptions, oConstraints) {
      var _this;
      _this = _DateTimeWithTimezone2.call(this, oFormatOptions, oConstraints) || this;
      _this.bShowTimezoneForEmptyValues = (oFormatOptions === null || oFormatOptions === void 0 ? void 0 : oFormatOptions.showTimezoneForEmptyValues) ?? true;
      return _this;
    }
    var _proto = DateTimeWithTimezone.prototype;
    _proto.formatValue = function formatValue(aValues, sTargetType) {
      const oTimestamp = aValues && aValues[0];
      if (oTimestamp === undefined ||
      // data is not yet available
      // if time zone is not shown falsy timestamps cannot be formatted -> return null
      !oTimestamp && !this.bShowTimezoneForEmptyValues) {
        return null;
      }
      return _DateTimeWithTimezone2.prototype.formatValue.call(this, aValues, sTargetType);
    };
    return DateTimeWithTimezone;
  }(_DateTimeWithTimezone)) || _class);
  return DateTimeWithTimezone;
}, false);
