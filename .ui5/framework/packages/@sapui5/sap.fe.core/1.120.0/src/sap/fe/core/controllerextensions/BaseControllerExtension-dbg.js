/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/core/mvc/ControllerExtension"], function (ClassSupport, ControllerExtension) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let BaseControllerExtension = (
  /**
   * A base implementation for controller extension used internally in sap.fe for central functionalities.
   *
   * @public
   * @since 1.118.0
   */
  _dec = defineUI5Class("sap.fe.core.controllerextensions.BaseControllerExtension"), _dec(_class = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(BaseControllerExtension, _ControllerExtension);
    function BaseControllerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _assertThisInitialized(_this).init();
      return _this;
    }
    _exports = BaseControllerExtension;
    return BaseControllerExtension;
  }(ControllerExtension)) || _class);
  _exports = BaseControllerExtension;
  return _exports;
}, false);
