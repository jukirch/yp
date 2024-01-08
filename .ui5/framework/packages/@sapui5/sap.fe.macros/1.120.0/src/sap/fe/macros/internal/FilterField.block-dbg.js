/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filter/FilterFieldTemplating"], function (Log, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingToolkit, StableIdHelper, DataModelPathHelper, PropertyFormatters, CommonHelper, FieldHelper, FilterFieldHelper, FilterFieldTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var getFilterFieldDisplayFormat = FilterFieldTemplating.getFilterFieldDisplayFormat;
  var maxConditions = FilterFieldHelper.maxConditions;
  var isRequiredInFilter = FilterFieldHelper.isRequiredInFilter;
  var getPlaceholder = FilterFieldHelper.getPlaceholder;
  var getDataType = FilterFieldHelper.getDataType;
  var getConditionsBinding = FilterFieldHelper.getConditionsBinding;
  var formatOptions = FilterFieldHelper.formatOptions;
  var constraints = FilterFieldHelper.constraints;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var generate = StableIdHelper.generate;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var xml = BuildingBlockTemplateProcessor.xml;
  var SAP_UI_MODEL_CONTEXT = BuildingBlockTemplateProcessor.SAP_UI_MODEL_CONTEXT;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let FilterFieldBlock = (
  /**
   * Building block for creating a Filter Field based on the metadata provided by OData V4.
   * <br>
   * It is designed to work based on a property context(property) pointing to an entity type property
   * needed to be used as filterfield and entityType context(contextPath) to consider the relativity of
   * the propertyPath of the property wrt entityType.
   *
   * Usage example:
   * <pre>
   * &lt;macro:FilterField id="MyFilterField" property="CompanyName" /&gt;
   * </pre>
   *
   * @private
   */
  _dec = defineBuildingBlock({
    name: "FilterField",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec5 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(FilterFieldBlock, _BuildingBlockBase);
    /**
     * Defines the metadata path to the property.
     */

    /**
     * Metadata path to the entitySet or navigationProperty
     */

    /**
     * Visual filter settings for filter field.
     */

    /**
     * A prefix that is added to the generated ID of the filter field.
     */

    /**
     * A prefix that is added to the generated ID of the value help used for the filter field.
     */

    /**
     * Specifies the Sematic Date Range option for the filter field.
     */

    /**
     * Settings from the manifest settings.
     */

    function FilterFieldBlock(props, configuration, settings) {
      var _propertyConverted$an, _propertyConverted$an2, _propertyConverted$an3, _propertyConverted$an4;
      var _this;
      _this = _BuildingBlockBase.call(this, props, configuration, settings) || this;
      _initializerDefineProperty(_this, "property", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visualFilter", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "idPrefix", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "settings", _descriptor7, _assertThisInitialized(_this));
      const propertyConverted = MetaModelConverter.convertMetaModelContext(_this.property);
      const dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(_this.property, _this.contextPath);

      // Property settings
      const propertyName = propertyConverted.name,
        fixedValues = !!((_propertyConverted$an = propertyConverted.annotations) !== null && _propertyConverted$an !== void 0 && (_propertyConverted$an2 = _propertyConverted$an.Common) !== null && _propertyConverted$an2 !== void 0 && _propertyConverted$an2.ValueListWithFixedValues);
      _this.controlId = _this.idPrefix && generate([_this.idPrefix, propertyName]);
      _this.sourcePath = getTargetObjectPath(dataModelPath);
      _this.dataType = getDataType(propertyConverted);
      const labelTerm = propertyConverted === null || propertyConverted === void 0 ? void 0 : (_propertyConverted$an3 = propertyConverted.annotations) === null || _propertyConverted$an3 === void 0 ? void 0 : (_propertyConverted$an4 = _propertyConverted$an3.Common) === null || _propertyConverted$an4 === void 0 ? void 0 : _propertyConverted$an4.Label;
      const labelExpression = (labelTerm === null || labelTerm === void 0 ? void 0 : labelTerm.toString()) ?? constant(propertyName);
      _this.label = compileExpression(labelExpression) || propertyName;
      _this.conditionsBinding = getConditionsBinding(dataModelPath) || "";
      _this.placeholder = getPlaceholder(propertyConverted);
      // Visual Filter settings
      _this.vfEnabled = !!_this.visualFilter && !(_this.idPrefix && _this.idPrefix.includes("Adaptation"));
      _this.vfId = _this.vfEnabled ? generate([_this.idPrefix, propertyName, "VisualFilter"]) : undefined;

      //-----------------------------------------------------------------------------------------------------//
      // TODO: need to change operations from MetaModel to Converters.
      // This mainly included changing changing getFilterRestrictions operations from metaModel to converters
      const propertyContext = _this.property,
        model = propertyContext.getModel(),
        vhPropertyPath = FieldHelper.valueHelpPropertyForFilterField(propertyContext),
        filterable = CommonHelper.isPropertyFilterable(propertyContext),
        propertyObject = propertyContext.getObject(),
        propertyInterface = {
          context: propertyContext
        };
      _this.display = getFilterFieldDisplayFormat(dataModelPath, propertyConverted, propertyInterface);
      _this.isFilterable = !(filterable === false || filterable === "false");
      _this.maxConditions = maxConditions(propertyObject, propertyInterface);
      _this.dataTypeConstraints = constraints(propertyObject, propertyInterface);
      _this.dataTypeFormatOptions = formatOptions(propertyObject, propertyInterface);
      _this.required = isRequiredInFilter(propertyObject, propertyInterface);
      _this.operators = FieldHelper.operators(propertyContext, propertyObject, _this.useSemanticDateRange, _this.settings || "", _this.contextPath.getPath());

      // Value Help settings
      // TODO: This needs to be updated when VH macro is converted to 2.0
      const vhProperty = model.createBindingContext(vhPropertyPath);
      const vhPropertyObject = vhProperty.getObject(),
        vhPropertyInterface = {
          context: vhProperty
        },
        relativeVhPropertyPath = getRelativePropertyPath(vhPropertyObject, vhPropertyInterface),
        relativePropertyPath = getRelativePropertyPath(propertyObject, propertyInterface);
      _this.valueHelpProperty = FieldHelper.getValueHelpPropertyForFilterField(propertyContext, propertyObject, propertyObject.$Type, _this.vhIdPrefix, relativePropertyPath, relativeVhPropertyPath, fixedValues, _this.useSemanticDateRange);

      //-----------------------------------------------------------------------------------------------------//
      return _this;
    }
    _exports = FilterFieldBlock;
    var _proto = FilterFieldBlock.prototype;
    _proto.getVisualFilterContent = function getVisualFilterContent() {
      var _visualFilterObject, _visualFilterObject$i;
      let visualFilterObject = this.visualFilter,
        vfXML = "";
      if (!this.vfEnabled || !visualFilterObject) {
        return vfXML;
      }
      if ((_visualFilterObject = visualFilterObject) !== null && _visualFilterObject !== void 0 && (_visualFilterObject$i = _visualFilterObject.isA) !== null && _visualFilterObject$i !== void 0 && _visualFilterObject$i.call(_visualFilterObject, SAP_UI_MODEL_CONTEXT)) {
        visualFilterObject = visualFilterObject.getObject();
      }
      const {
        contextPath,
        presentationAnnotation,
        outParameter,
        inParameters,
        valuelistProperty,
        selectionVariantAnnotation,
        multipleSelectionAllowed,
        required,
        requiredProperties = [],
        showOverlayInitially,
        renderLineChart,
        isValueListWithFixedValues
      } = visualFilterObject;
      vfXML = xml`
				<macro:VisualFilter
					id="${this.vfId}"
					contextPath="${contextPath}"
					metaPath="${presentationAnnotation}"
					outParameter="${outParameter}"
					inParameters="${inParameters}"
					valuelistProperty="${valuelistProperty}"
					selectionVariantAnnotation="${selectionVariantAnnotation}"
					multipleSelectionAllowed="${multipleSelectionAllowed}"
					required="${required}"
					requiredProperties="${CommonHelper.stringifyCustomData(requiredProperties)}"
					showOverlayInitially="${showOverlayInitially}"
					renderLineChart="${renderLineChart}"
					isValueListWithFixedValues="${isValueListWithFixedValues}"
					filterBarEntityType="${contextPath}"
				/>
			`;
      return vfXML;
    };
    _proto.getTemplate = async function getTemplate() {
      let xmlRet = ``;
      if (this.isFilterable) {
        let display;
        try {
          display = await this.display;
        } catch (err) {
          Log.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${err}`);
        }
        xmlRet = xml`
				<mdc:FilterField
					xmlns:mdc="sap.ui.mdc"
					xmlns:macro="sap.fe.macros"
					xmlns:unittest="http://schemas.sap.com/sapui5/preprocessorextension/sap.fe.unittesting/1"
					xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					unittest:id="UnitTest::FilterField"
					customData:sourcePath="${this.sourcePath}"
					id="${this.controlId}"
					delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate', payload:{isFilterField:true}}"
					label="${this.label}"
					dataType="${this.dataType}"
					display="${display}"
					maxConditions="${this.maxConditions}"
					valueHelp="${this.valueHelpProperty}"
					conditions="${this.conditionsBinding}"
					dataTypeConstraints="${this.dataTypeConstraints}"
					dataTypeFormatOptions="${this.dataTypeFormatOptions}"
					required="${this.required}"
					operators="${this.operators}"
					placeholder="${this.placeholder}"

				>
					${this.vfEnabled ? this.getVisualFilterContent() : ""}
				</mdc:FilterField>
			`;
      }
      return xmlRet;
    };
    return FilterFieldBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "property", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "visualFilter", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FilterField";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FilterFieldValueHelp";
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "settings", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  })), _class2)) || _class);
  _exports = FilterFieldBlock;
  return _exports;
}, false);
