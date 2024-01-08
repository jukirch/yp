/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let ActionCommandBlock = (
  /**
   * Content of an action command
   *
   * @private
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "ActionCommand",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "object",
    required: true
  }), _dec4 = blockAttribute({
    type: "boolean"
  }), _dec5 = blockAttribute({
    type: "boolean"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockEvent(), _dec8 = blockEvent(), _dec9 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(ActionCommandBlock, _BuildingBlockBase);
    function ActionCommandBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "action", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isActionEnabled", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isIBNEnabled", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onExecuteAction", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onExecuteIBN", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onExecuteManifest", _descriptor8, _assertThisInitialized(_this));
      return _this;
    }
    _exports = ActionCommandBlock;
    var _proto = ActionCommandBlock.prototype;
    /**
     * The building block template function.
     *
     * @returns An XML-based string
     */
    _proto.getTemplate = function getTemplate() {
      let execute;
      let enabled;
      switch (this.action.type) {
        case "ForAction":
          execute = this.onExecuteAction;
          enabled = this.isActionEnabled !== undefined ? this.isActionEnabled : this.action.enabled;
          break;
        case "ForNavigation":
          execute = this.onExecuteIBN;
          enabled = this.isIBNEnabled !== undefined ? this.isIBNEnabled : this.action.enabled;
          break;
        default:
          execute = this.onExecuteManifest;
          enabled = this.action.enabled;
          break;
      }
      return xml`
		<control:CommandExecution
			xmlns:control="sap.fe.core.controls"
			core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
			execute="${execute}"
			enabled="${enabled}"
			visible="${this.visible !== undefined ? this.visible : this.action.visible}"
			command="${this.action.command}"
		/>`;
    };
    return ActionCommandBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "action", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "isActionEnabled", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "isIBNEnabled", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteAction", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteIBN", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "onExecuteManifest", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ActionCommandBlock;
  return _exports;
}, false);
