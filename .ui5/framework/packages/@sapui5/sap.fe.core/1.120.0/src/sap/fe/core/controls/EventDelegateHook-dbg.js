/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/core/Element"], function (ClassSupport, Element) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let EventDelegateHook = (
  /**
   * Create an event delegate hook on the parent of this control to deal with event propagation.
   *
   * This is a specific solution for the Avatar control case where the press cannot be interrupted and which then ends up interacting with control behind it.
   *
   */
  _dec = defineUI5Class("sap.fe.core.controls.EventDelegateHook"), _dec2 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Element) {
    _inheritsLoose(EventDelegateHook, _Element);
    function EventDelegateHook(idOrSettings, settings) {
      var _this;
      _this = _Element.call(this, idOrSettings, settings) || this;
      _initializerDefineProperty(_this, "stopTapPropagation", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    _exports = EventDelegateHook;
    var _proto = EventDelegateHook.prototype;
    _proto.setParent = function setParent(parentObject) {
      if (this.getParent()) {
        this.getParent().removeEventDelegate(this);
      }
      parentObject.addEventDelegate(this);
      _Element.prototype.setParent.call(this, parentObject);
    };
    _proto.ontap = function ontap(event) {
      if (this.stopTapPropagation) {
        event.stopPropagation();
      }
    };
    return EventDelegateHook;
  }(Element), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "stopTapPropagation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  })), _class2)) || _class);
  _exports = EventDelegateHook;
  return _exports;
}, false);
