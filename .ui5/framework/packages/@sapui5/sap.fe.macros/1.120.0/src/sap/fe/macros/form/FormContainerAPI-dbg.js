/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "../MacroAPI"], function (ClassSupport, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _class3;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * @alias sap.fe.macros.form.FormContainerAPI
   * @private
   */
  let FormContainerAPI = (_dec = defineUI5Class("sap.fe.macros.form.FormContainerAPI"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "boolean"
  }), _dec4 = xmlEventHandler(), _dec(_class = (_class2 = (_class3 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(FormContainerAPI, _MacroAPI);
    /**
     * The identifier of the form container control.
     *
     * @public
     */

    function FormContainerAPI(props) {
      var _this;
      _this = _MacroAPI.call(this, props, true) || this;
      _initializerDefineProperty(_this, "formContainerId", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showDetails", _descriptor2, _assertThisInitialized(_this));
      _this.setParentBindingContext("internal", `controls/${_this.formContainerId}`);
      return _this;
    }
    var _proto = FormContainerAPI.prototype;
    _proto.toggleDetails = function toggleDetails() {
      this.showDetails = !this.showDetails;
    };
    return FormContainerAPI;
  }(MacroAPI), _class3.isDependentBound = true, _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "formContainerId", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "showDetails", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _applyDecoratedDescriptor(_class2.prototype, "toggleDetails", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "toggleDetails"), _class2.prototype)), _class2)) || _class);
  return FormContainerAPI;
}, false);
