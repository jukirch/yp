/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/macros/field/FieldTemplating", "./RichTextEditor.block", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, MetaModelConverter, BindingToolkit, FieldTemplating, RichTextEditorBlock, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var getValueBinding = FieldTemplating.getValueBinding;
  var constant = BindingToolkit.constant;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let RichTextEditorWithMetadataBlock = (
  /**
   * Metadata-driven building block that exposes the RichTextEditor UI5 control.
   *
   * It's used to enter formatted text and uses the third-party component called TinyMCE.
   *
   * @public
   * @since 1.117.0
   */
  _dec = defineBuildingBlock({
    name: "RichTextEditorWithMetadata",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec5 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec6 = blockAttribute({
    type: "array"
  }), _dec7 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(RichTextEditorWithMetadataBlock, _RuntimeBuildingBlock);
    function RichTextEditorWithMetadataBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "buttonGroups", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "required", _descriptor6, _assertThisInitialized(_this));
      return _this;
    }
    _exports = RichTextEditorWithMetadataBlock;
    RichTextEditorWithMetadataBlock.load = async function load() {
      await RichTextEditorBlock.load();
      return this;
    };
    var _proto = RichTextEditorWithMetadataBlock.prototype;
    _proto.getContent = function getContent() {
      const involvedDataModelObjects = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
      const valueBinding = getValueBinding(involvedDataModelObjects, {});
      return _jsx(RichTextEditorBlock, {
        id: this.id,
        readOnly: this.readOnly,
        buttonGroups: this.buttonGroups,
        required: this.required,
        value: valueBinding !== undefined ? constant(valueBinding) : valueBinding
      });
    };
    return RichTextEditorWithMetadataBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(false);
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "buttonGroups", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(false);
    }
  })), _class2)) || _class);
  _exports = RichTextEditorWithMetadataBlock;
  return _exports;
}, false);
