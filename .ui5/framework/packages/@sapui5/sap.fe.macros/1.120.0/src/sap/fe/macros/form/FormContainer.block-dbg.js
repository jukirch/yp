/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/templating/DataModelPathHelper"], function (BuildingBlockBase, BuildingBlockSupport, Form, MetaModelConverter, DataModelPathHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var _exports = {};
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var createFormDefinition = Form.createFormDefinition;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let FormContainerBlock = (
  /**
   * Building block for creating a FormContainer based on the provided OData V4 metadata.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:FormContainer
   *   id="SomeId"
   *   entitySet="{entitySet>}"
   *   dataFieldCollection ="{dataFieldCollection>}"
   *   title="someTitle"
   *   navigationPath="{ToSupplier}"
   *   visible=true
   *   onChange=".handlers.onFieldValueChange"
   * /&gt;
   * </pre>
   *
   * @private
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "FormContainer",
    namespace: "sap.fe.macros",
    fragment: "sap.fe.macros.form.FormContainer"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec6 = blockAttribute({
    type: "array"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "string"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec12 = blockAttribute({
    type: "string"
  }), _dec13 = blockAttribute({
    type: "array"
  }), _dec14 = blockAggregation({
    type: "sap.fe.macros.form.FormElement"
  }), _dec15 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(FormContainerBlock, _BuildingBlockBase);
    /**
     * Metadata path to the dataFieldCollection
     */

    /**
     * Control whether the form is in displayMode or not
     */

    /**
     * Title of the form container
     */

    /**
     * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
     */

    /**
     * Binding the form container using a navigation path
     */

    /**
     * Binding the visibility of the form container using an expression binding or Boolean
     */

    /**
     * Flex designtime settings to be applied
     */

    // Just proxied down to the Field may need to see if needed or not

    function FormContainerBlock(props, externalConfiguration, settings) {
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entitySet", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataFieldCollection", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "displayMode", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "title", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "titleLevel", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationPath", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "designtimeSettings", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actions", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formElements", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onChange", _descriptor14, _assertThisInitialized(_this));
      _this.entitySet = _this.contextPath;
      if (_this.formElements && Object.keys(_this.formElements).length > 0) {
        const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        // Wrap the facet in a fake Facet annotation
        oFacetDefinition = {
          $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
          Label: oFacetDefinition.Label,
          Target: {
            $target: oFacetDefinition,
            fullyQualifiedName: oFacetDefinition.fullyQualifiedName,
            path: "",
            term: "",
            type: "AnnotationPath",
            value: getContextRelativeTargetObjectPath(oContextObjectPath)
          },
          annotations: {},
          fullyQualifiedName: oFacetDefinition.fullyQualifiedName
        };
        mExtraSettings[oFacetDefinition.Target.value] = {
          fields: _this.formElements
        };
        const oConverterContext = _this.getConverterContext(oContextObjectPath, /*this.contextPath*/undefined, settings, mExtraSettings);
        const oFormDefinition = createFormDefinition(oFacetDefinition, "true", oConverterContext);
        _this.dataFieldCollection = oFormDefinition.formContainers[0].formElements;
      }
      return _this;
    }
    _exports = FormContainerBlock;
    return FormContainerBlock;
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
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "dataFieldCollection", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Auto";
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigationPath", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "designtimeSettings", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "sap/fe/macros/form/FormContainer.designtime";
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = FormContainerBlock;
  return _exports;
}, false);
