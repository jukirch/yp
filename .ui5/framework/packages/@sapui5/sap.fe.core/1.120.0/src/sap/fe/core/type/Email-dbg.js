/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/core/Core", "sap/ui/model/odata/type/String", "sap/ui/model/ValidateException"], function (ClassSupport, Core, ODataStringType, ValidateException) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  const emailW3CRegexp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$/;
  let EmailType = (_dec = defineUI5Class("sap.fe.core.type.Email"), _dec(_class = /*#__PURE__*/function (_ODataStringType) {
    _inheritsLoose(EmailType, _ODataStringType);
    function EmailType() {
      return _ODataStringType.apply(this, arguments) || this;
    }
    var _proto = EmailType.prototype;
    _proto.validateValue = function validateValue(sValue) {
      if (!emailW3CRegexp.test(sValue)) {
        throw new ValidateException(Core.getLibraryResourceBundle("sap.fe.core").getText("T_EMAILTYPE_INVALID_VALUE"));
      }
      _ODataStringType.prototype.validateValue.call(this, sValue);
    };
    return EmailType;
  }(ODataStringType)) || _class);
  return EmailType;
}, false);
