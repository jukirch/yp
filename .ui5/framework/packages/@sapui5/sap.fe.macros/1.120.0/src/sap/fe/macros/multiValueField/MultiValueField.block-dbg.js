/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingHelper, BindingToolkit, ID, TypeGuards, DataModelPathHelper, PropertyFormatters, UIFormatters, FieldHelper, FieldTemplating, ValueHelpTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getValueBinding = FieldTemplating.getValueBinding;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var isPathInsertable = DataModelPathHelper.isPathInsertable;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isProperty = TypeGuards.isProperty;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var UI = BindingHelper.UI;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let MultiValueFieldBlock = (
  /**
   * Building block for creating a MultiValueField based on the metadata provided by OData V4.
   * <br>
   * The MultiValueField can be used to display either a DataField or Property directly. It has to point to a collection property.
   * <br>
   * Usage example:
   * <pre>
   * &lt;macro:MultiValueField
   *   id="SomeUniqueIdentifier"
   *   contextPath="{entitySet&gt;}"
   *   metaPath="{dataField&gt;}"
   *  /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.MultiValueField
   * @public
   * @since 1.118.0
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "MultiValueField",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    isPublic: true,
    type: "string"
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "string"
  }), _dec5 = blockAttribute({
    isPublic: true,
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["Property"],
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.DataField"]
  }), _dec6 = blockAttribute({
    type: "boolean",
    isPublic: true,
    required: false
  }), _dec7 = blockAttribute({
    isPublic: true,
    required: true,
    type: "sap.ui.model.Context",
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "object",
    validate: function (formatOptionsInput) {
      if (formatOptionsInput.displayMode && !["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput.displayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
      }
      if (typeof formatOptionsInput.displayOnly === "string" && !["true", "false"].includes(formatOptionsInput.displayOnly)) {
        throw new Error(`Allowed value ${formatOptionsInput.displayOnly} for displayOnly does not match`);
      }
      if (formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput.measureDisplayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
      }
      return formatOptionsInput;
    }
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(MultiValueFieldBlock, _BuildingBlockBase);
    /**
     * The 'id' property
     */
    /**
     * Prefix added to the generated ID of the field - only if no id is provided
     */
    /**
     * Prefix added to the generated ID of the value help used for the field
     */
    /**
     * Defines the relative Metadata path to the MultiValueField.
     * The metaPath should point to a Property or DataField.
     *
     * @public
     */
    /**
     * The readOnly flag
     *
     * @public
     */
    /**
     * The context path provided for the MultiValueField
     *
     * @public
     */
    /**
     * Property added to associate the label with the MultiValueField
     */
    /**
     * The object with the formatting options
     *
     */
    /**
     * Function to get the correct settings for the multi input.
     *
     * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
     * @param formatOptions The format options to calculate the result
     * @returns MultiInputSettings
     */
    MultiValueFieldBlock._getMultiInputSettings = function _getMultiInputSettings(propertyDataModelObjectPath, formatOptions) {
      var _propertyDefinition$a;
      const {
        collectionPath,
        itemDataModelObjectPath
      } = MultiValueFieldBlock._getPathStructure(propertyDataModelObjectPath);
      const collectionBindingDisplay = `{path:'${collectionPath}', templateShareable: false}`;
      const collectionBindingEdit = `{path:'${collectionPath}', templateShareable: false}`;
      const propertyPathOrProperty = propertyDataModelObjectPath.targetObject;
      const propertyDefinition = isPropertyPathExpression(propertyPathOrProperty) ? propertyPathOrProperty.$target : propertyPathOrProperty;
      const commonText = propertyDefinition === null || propertyDefinition === void 0 ? void 0 : (_propertyDefinition$a = propertyDefinition.annotations.Common) === null || _propertyDefinition$a === void 0 ? void 0 : _propertyDefinition$a.Text;
      const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
      const textExpression = commonText ? compileExpression(getExpressionFromAnnotation(commonText, relativeLocation)) : getValueBinding(itemDataModelObjectPath, formatOptions, true);
      return {
        description: textExpression,
        collectionBindingDisplay: collectionBindingDisplay,
        collectionBindingEdit: collectionBindingEdit,
        key: getValueBinding(itemDataModelObjectPath, formatOptions, true)
      };
    }

    // Process the dataModelPath to find the collection and the relative DataModelPath for the item.
    ;
    MultiValueFieldBlock._getPathStructure = function _getPathStructure(dataModelObjectPath) {
      var _dataModelObjectPath$, _dataModelObjectPath$2;
      let firstCollectionPath = "";
      const currentEntitySet = (_dataModelObjectPath$ = dataModelObjectPath.contextLocation) !== null && _dataModelObjectPath$ !== void 0 && _dataModelObjectPath$.targetEntitySet ? dataModelObjectPath.contextLocation.targetEntitySet : dataModelObjectPath.startingEntitySet;
      const navigatedPaths = [];
      const contextNavsForItem = ((_dataModelObjectPath$2 = dataModelObjectPath.contextLocation) === null || _dataModelObjectPath$2 === void 0 ? void 0 : _dataModelObjectPath$2.navigationProperties) || [];
      for (const navProp of dataModelObjectPath.navigationProperties) {
        if (dataModelObjectPath.contextLocation === undefined || !dataModelObjectPath.contextLocation.navigationProperties.some(contextNavProp => contextNavProp.fullyQualifiedName === navProp.fullyQualifiedName)) {
          // in case of relative entitySetPath we don't consider navigationPath that are already in the context
          navigatedPaths.push(navProp.name);
          contextNavsForItem.push(navProp);
        }
        if (currentEntitySet.navigationPropertyBinding.hasOwnProperty(navProp.name)) {
          if (isMultipleNavigationProperty(navProp)) {
            break;
          }
        }
      }
      firstCollectionPath = `${navigatedPaths.join("/")}`;
      const itemDataModelObjectPath = Object.assign({}, dataModelObjectPath);
      if (itemDataModelObjectPath.contextLocation) {
        itemDataModelObjectPath.contextLocation.navigationProperties = contextNavsForItem; // this changes the creation of the valueHelp ID ...
      }

      return {
        collectionPath: firstCollectionPath,
        itemDataModelObjectPath: itemDataModelObjectPath
      };
    }

    /**
     * Calculate the fieldGroupIds for the MultiValueField.
     *
     * @param appComponent
     * @returns The value for the fieldGroupIds
     */;
    var _proto = MultiValueFieldBlock.prototype;
    _proto.computeFieldGroupIds = function computeFieldGroupIds(appComponent) {
      if (!appComponent) {
        //for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
        return "";
      }
      const sideEffectService = appComponent.getSideEffectsService();
      const fieldGroupIds = sideEffectService.computeFieldGroupIds(this.dataModelPath.targetEntityType.fullyQualifiedName, this.dataModelPath.targetObject.fullyQualifiedName);
      const result = fieldGroupIds.join(",");
      return result === "" ? undefined : result;
    };
    function MultiValueFieldBlock(props, controlConfiguration, settings) {
      var _metaPathObject$annot;
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "idPrefix", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formatOptions", _descriptor8, _assertThisInitialized(_this));
      const metaPathObject = MetaModelConverter.convertMetaModelContext(_this.metaPath);
      // If the target is a property with a DataFieldDefault, use this as data field
      if (isProperty(metaPathObject) && ((_metaPathObject$annot = metaPathObject.annotations.UI) === null || _metaPathObject$annot === void 0 ? void 0 : _metaPathObject$annot.DataFieldDefault) !== undefined) {
        _this.enhancedMetaPath = settings.models.metaModel.createBindingContext(`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`, _this.metaPath);
      } else {
        _this.enhancedMetaPath = _this.metaPath;
      }
      const dataFieldDataModelPath = MetaModelConverter.getInvolvedDataModelObjects(_this.enhancedMetaPath, _this.contextPath);
      _this.convertedDataField = dataFieldDataModelPath.targetObject;
      _this.dataModelPath = enhanceDataModelPath(dataFieldDataModelPath, _this.convertedDataField.Value.path);
      _this.property = _this.dataModelPath.targetObject;
      const insertable = isPathInsertable(_this.dataModelPath);
      const deleteNavigationRestriction = isPathDeletable(_this.dataModelPath, {
        ignoreTargetCollection: true,
        authorizeUnresolvable: true
      });
      const deletePath = isPathDeletable(_this.dataModelPath);
      // deletable:
      //		if restrictions come from Navigation we apply it
      //		otherwise we apply restrictions defined on target collection only if it's a constant
      //      otherwise it's true!
      const deletable = ifElse(deleteNavigationRestriction._type === "Unresolvable", or(not(isConstant(deletePath)), deletePath), deletePath);
      _this.visible = getVisibleExpression(_this.dataModelPath, _this.formatOptions);
      _this.editMode = _this.formatOptions.displayOnly === "true" || _this.readOnly === true ? "Display" : compileExpression(ifElse(and(insertable, deletable, UI.IsEditable), constant("Editable"), constant("Display")));
      _this.displayMode = getDisplayMode(_this.dataModelPath);
      const localDataModelPath = enhanceDataModelPath(MetaModelConverter.getInvolvedDataModelObjects(_this.enhancedMetaPath, _this.contextPath), _this.convertedDataField.Value.path);
      _this.item = MultiValueFieldBlock._getMultiInputSettings(localDataModelPath, _this.formatOptions); // this function rewrites dataModelPath, therefore, for now a clean object is passed
      _this.collection = _this.editMode === "Display" ? _this.item.collectionBindingDisplay : _this.item.collectionBindingEdit;
      _this.fieldGroupIds = _this.computeFieldGroupIds(settings.appComponent);
      return _this;
    }

    /**
     * The function calculates the corresponding ValueHelp field in case it´s
     * defined for the specific control.
     *
     * @returns An XML-based string with a possible ValueHelp control.
     */
    _exports = MultiValueFieldBlock;
    _proto.getPossibleValueHelpTemplate = function getPossibleValueHelpTemplate() {
      const vhp = FieldHelper.valueHelpProperty(this.metaPath);
      const vhpCtx = this.metaPath.getModel().createBindingContext(vhp, this.metaPath);
      const hasValueHelpAnnotations = FieldHelper.hasValueHelpAnnotation(vhpCtx.getObject("@"));
      if (hasValueHelpAnnotations) {
        // depending on whether this one has a value help annotation included, add the dependent
        return xml`
			<mdc:dependents>
				<macros:ValueHelp
					idPrefix="${ID.generate([this.id, "FieldValueHelp"])}"
					property="${vhpCtx}"
					contextPath="${this.contextPath}"
					useMultiValueField="true"
				/>
			</mdc:dependents>`;
      }
      return "";
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.getTemplate = function getTemplate() {
      // BuildingBlock with set ID scenario
      if (this.id) {
        this.vhIdPrefix = ID.generate([this.id, this.vhIdPrefix]);
      } else {
        this.id = this.idPrefix ? ID.generate([this.idPrefix, "MultiValueField"]) : undefined;
      }

      //create a new binding context for the value help
      const valueHelpProperty = FieldHelper.valueHelpProperty(this.metaPath);
      const valueHelpPropertyContext = this.metaPath.getModel().createBindingContext(valueHelpProperty, this.metaPath);

      //calculate valueHelp
      const valueHelp = ValueHelpTemplating.generateID(undefined, this.vhIdPrefix, PropertyFormatters.getRelativePropertyPath(valueHelpPropertyContext, {
        context: this.contextPath
      }), getContextRelativeTargetObjectPath(this.dataModelPath) ?? "");
      //compute the correct label
      const label = FieldHelper.computeLabelText(this.convertedDataField.Value, {
        context: this.metaPath
      });
      const change = `MVFieldRuntime.handleChange($controller, $event)`;
      const validateFieldGroup = `MVFieldRuntime.onValidateFieldGroup($controller, $event)`;
      return xml`
		<mdc:MultiValueField
				core:require="{MVFieldRuntime:'sap/fe/macros/multiValueField/MultiValueFieldRuntime'}"
				delegate="{name: 'sap/fe/macros/multiValueField/MultiValueFieldDelegate'}"
				id="${this.id}"
				items="${this.collection}"
				display="${this.displayMode}"
				width="100%"
				editMode="${this.editMode}"
				valueHelp="${valueHelp}"
				ariaLabelledBy = "${this.ariaLabelledBy}"
				showEmptyIndicator = "${this.formatOptions.showEmptyIndicator}"
				label = "${label}"
				change="${change}"
				fieldGroupIds="${this.fieldGroupIds}"
				validateFieldGroup="${validateFieldGroup}"
		>
			<mdc:items>
				<mdcField:MultiValueFieldItem xmlns:mdcField="sap.ui.mdc.field" key="${this.item.key}" description="${this.item.description}" />
			</mdc:items>
			${this.getPossibleValueHelpTemplate()}
		</mdc:MultiValueField>`;
    };
    return MultiValueFieldBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FieldValueHelp";
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  })), _class2)) || _class);
  _exports = MultiValueFieldBlock;
  return _exports;
}, false);
