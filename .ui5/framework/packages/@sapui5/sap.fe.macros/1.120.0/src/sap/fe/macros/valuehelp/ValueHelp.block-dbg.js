/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards"], function (BuildingBlockBase, BuildingBlockSupport, MetaModelConverter, ModelHelper, TypeGuards) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var isEntitySet = TypeGuards.isEntitySet;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let ValueHelpBlock = (
  /**
   * Building block for creating a ValueHelp based on the provided OData V4 metadata.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:ValueHelp
   *   idPrefix="SomePrefix"
   *   property="{someProperty&gt;}"
   *   conditionModel="$filters"
   * /&gt;
   * </pre>
   *
   * @private
   */
  _dec = defineBuildingBlock({
    name: "ValueHelp",
    namespace: "sap.fe.macros",
    fragment: "sap.fe.macros.internal.valuehelp.ValueHelp"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["Property"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec5 = blockAttribute({
    type: "string"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "boolean"
  }), _dec9 = blockAttribute({
    type: "string"
  }), _dec10 = blockAttribute({
    type: "boolean"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(ValueHelpBlock, _BuildingBlockBase);
    /**
     * A prefix that is added to the generated ID of the value help.
     */

    /**
     * Defines the metadata path to the property.
     */

    /**
     * Indicator whether the value help is for a filter field.
     */

    /**
     * Indicates that this is a value help of a filter field. Necessary to decide if a
     * validation should occur on the back end or already on the client.
     */

    /**
     * Specifies the Sematic Date Range option for the filter field.
     */

    /**
     * Specifies whether the ValueHelp can be used with a MultiValueField
     */

    function ValueHelpBlock(props, _controlConfiguration, settings) {
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "property", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "conditionModel", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterFieldValueHelp", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useMultiValueField", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationPrefix", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "requiresValidation", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_flexId", _descriptor10, _assertThisInitialized(_this));
      _this.requestGroupId = "$auto.Workers";
      _this.collaborationEnabled = false;
      const contextObject = getInvolvedDataModelObjects(_this.contextPath);
      const entitySetOrSingleton = contextObject.targetEntitySet;
      if (isEntitySet(entitySetOrSingleton)) {
        _this.collaborationEnabled = ModelHelper.isCollaborationDraftSupported(settings.models.metaModel);
      }
      return _this;
    }
    _exports = ValueHelpBlock;
    return ValueHelpBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "ValueHelp";
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "property", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "conditionModel", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "filterFieldValueHelp", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useMultiValueField", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "navigationPrefix", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "requiresValidation", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ValueHelpBlock;
  return _exports;
}, false);
