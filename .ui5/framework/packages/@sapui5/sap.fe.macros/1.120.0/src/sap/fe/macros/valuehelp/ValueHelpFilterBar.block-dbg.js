/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/TemplateModel"], function (BuildingBlockBase, BuildingBlockSupport, FilterBar, MetaModelConverter, TemplateModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getExpandFilterFields = FilterBar.getExpandFilterFields;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let ValueHelpFilterBarBlock = (
  /**
   * Building block for creating a FilterBar based on the metadata provided by OData V4 for the value help dialog.
   *
   * @private
   */
  _dec = defineBuildingBlock({
    name: "ValueHelpFilterBar",
    namespace: "sap.fe.macros.valuehelp",
    fragment: "sap.fe.macros.valuehelp.ValueHelpFilterBar"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "boolean"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "sap.ui.mdc.FilterBarP13nMode[]"
  }), _dec8 = blockAttribute({
    type: "boolean"
  }), _dec9 = blockAttribute({
    type: "boolean"
  }), _dec10 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec11 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec12 = blockAttribute({
    type: "string"
  }), _dec13 = blockAttribute({
    type: "boolean"
  }), _dec14 = blockAttribute({
    type: "boolean"
  }), _dec15 = blockEvent(), _dec16 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(ValueHelpFilterBarBlock, _BuildingBlockBase);
    /**
     * ID of the FilterBar
     */

    /**
     * Don't show the basic search field
     */

    /**
     * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
     */

    /**
     * Specifies the personalization options for the filter bar.
     */

    /**
     * Specifies the Sematic Date Range option for the filter bar.
     */

    /**
     * If set the search will be automatically triggered, when a filter value was changed.
     */

    /**
     * Temporary workaround only
     * path to valuelist
     */

    /**
     * selectionFields to be displayed
     */

    /**
     * Filter conditions to be applied to the filter bar
     */

    /**
     * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
     * a search is triggered immediately if one or more search requests have been triggered in the meantime
     * but were ignored based on the setting.
     */

    /**
     * Determines whether the Show/Hide Filters button is in the state show or hide.
     */

    /**
     * Search handler name
     */

    /**
     * Filters changed handler name
     */

    function ValueHelpFilterBarBlock(props, controlConfiguration, settings) {
      var _targetEntitySet$anno;
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "hideBasicSearch", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableFallback", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "p13nMode", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "liveMode", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_valueList", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionFields", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterConditions", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "suspendSelection", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "expandFilterFields", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "search", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterChanged", _descriptor15, _assertThisInitialized(_this));
      const metaModel = _this.contextPath.getModel();
      const metaPathContext = _this.metaPath;
      const metaPathPath = metaPathContext === null || metaPathContext === void 0 ? void 0 : metaPathContext.getPath();
      const dataModelObjectPath = getInvolvedDataModelObjects(_this.contextPath);
      const converterContext = _this.getConverterContext(dataModelObjectPath, undefined, settings);
      if (!_this.selectionFields) {
        const selectionFields = getSelectionFields(converterContext, [], metaPathPath).selectionFields;
        _this.selectionFields = new TemplateModel(selectionFields, metaModel).createBindingContext("/");
      }
      const targetEntitySet = dataModelObjectPath.targetEntitySet; // It could be a singleton but the annotaiton are not defined there (yet?)
      _this.expandFilterFields = getExpandFilterFields(converterContext, (_targetEntitySet$anno = targetEntitySet.annotations.Capabilities) === null || _targetEntitySet$anno === void 0 ? void 0 : _targetEntitySet$anno.FilterRestrictions, _this._valueList);
      return _this;
    }
    _exports = ValueHelpFilterBarBlock;
    return ValueHelpFilterBarBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hideBasicSearch", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enableFallback", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "p13nMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return [];
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "_valueList", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "selectionFields", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "filterConditions", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "suspendSelection", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "expandFilterFields", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ValueHelpFilterBarBlock;
  return _exports;
}, false);
