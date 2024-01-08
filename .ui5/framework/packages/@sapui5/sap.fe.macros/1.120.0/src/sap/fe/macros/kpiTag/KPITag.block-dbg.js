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
  let KPITagBlock = (
  /**
   * Building block used to create a KPI tag.
   *
   * @public
   */
  _dec = defineBuildingBlock({
    name: "KPITag",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "string",
    allowedValues: ["Success", "Error", "Warning", "None", "Information"]
  }), _dec5 = blockAttribute({
    type: "string"
  }), _dec6 = blockEvent(), _dec7 = blockAttribute({
    type: "number",
    required: true
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "boolean",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(KPITagBlock, _BuildingBlockBase);
    function KPITagBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "text", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "status", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tooltip", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "press", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "number", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "unit", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showIcon", _descriptor8, _assertThisInitialized(_this));
      return _this;
    }
    _exports = KPITagBlock;
    var _proto = KPITagBlock.prototype;
    /**
     * The template function of the building block.
     *
     * @returns An XML-based string
     */
    _proto.getTemplate = function getTemplate() {
      return xml`<m:GenericTag
			id="${this.id}"
			text="${this.text}"
			design="${this.showIcon ? "Full" : "StatusIconHidden"}"
			status="${this.status}"
			class="sapUiTinyMarginBegin"
			tooltip="${this.tooltip}"
			press="${this.press}"
		>
			<m:ObjectNumber
				state="${this.status}"
				emphasized="false"
				number="${this.number}"
				unit="${this.unit}"

			/>
		</m:GenericTag>`;
    };
    return KPITagBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "status", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "None";
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "tooltip", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "press", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "number", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "unit", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "showIcon", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  })), _class2)) || _class);
  _exports = KPITagBlock;
  return _exports;
}, false);
