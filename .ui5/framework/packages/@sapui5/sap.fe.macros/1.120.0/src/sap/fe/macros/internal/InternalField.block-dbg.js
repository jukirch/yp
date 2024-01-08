/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TitleHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/situations/SituationsIndicator.block", "sap/ui/mdc/enums/FieldEditMode", "./field/FieldStructure", "./valuehelp/AdditionalValueFormatter"], function (BuildingBlockBase, BuildingBlockSupport, CollaborationCommon, MetaModelConverter, CollaborationFormatters, valueFormatters, BindingToolkit, MetaModelFunction, ModelHelper, StableIdHelper, TitleHelper, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters, FieldTemplating, SituationsIndicatorBlock, FieldEditMode, getFieldStructureTemplate, additionalValueFormatter) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27;
  var _exports = {};
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var isProperty = TypeGuards.isProperty;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var generate = StableIdHelper.generate;
  var getRequiredPropertiesFromUpdateRestrictions = MetaModelFunction.getRequiredPropertiesFromUpdateRestrictions;
  var getRequiredPropertiesFromInsertRestrictions = MetaModelFunction.getRequiredPropertiesFromInsertRestrictions;
  var wrapBindingExpression = BindingToolkit.wrapBindingExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var fn = BindingToolkit.fn;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let InternalFieldBlock = (
  /**
   * Building block for creating a Field based on the metadata provided by OData V4.
   * <br>
   * Usually, a DataField annotation is expected
   *
   * Usage example:
   * <pre>
   * <internalMacro:Field
   *   idPrefix="SomePrefix"
   *   contextPath="{entitySet>}"
   *   metaPath="{dataField>}"
   * />
   * </pre>
   *
   * @hideconstructor
   * @private
   * @experimental
   * @since 1.94.0
   */
  _dec = defineBuildingBlock({
    name: "Field",
    namespace: "sap.fe.macros.internal",
    designtime: "sap/fe/macros/internal/Field.designtime"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "string"
  }), _dec5 = blockAttribute({
    type: "string"
  }), _dec6 = blockAttribute({
    type: "string"
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec10 = blockAttribute({
    type: "boolean"
  }), _dec11 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["Property"],
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataFieldWithUrl", "com.sap.vocabularies.UI.v1.DataFieldForAnnotation", "com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithAction", "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataPointType"]
  }), _dec12 = blockAttribute({
    type: "sap.ui.mdc.enums.EditMode"
  }), _dec13 = blockAttribute({
    type: "boolean"
  }), _dec14 = blockAttribute({
    type: "string"
  }), _dec15 = blockAttribute({
    type: "string"
  }), _dec16 = blockAttribute({
    type: "sap.ui.core.TextAlign"
  }), _dec17 = blockAttribute({
    type: "string",
    required: false
  }), _dec18 = blockAttribute({
    type: "string"
  }), _dec19 = blockAttribute({
    type: "boolean"
  }), _dec20 = blockAttribute({
    type: "boolean"
  }), _dec21 = blockAttribute({
    type: "object",
    validate: function (formatOptionsInput) {
      if (formatOptionsInput.textAlignMode && !["Table", "Form"].includes(formatOptionsInput.textAlignMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.textAlignMode} for textAlignMode does not match`);
      }
      if (formatOptionsInput.displayMode && !["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput.displayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
      }
      if (formatOptionsInput.fieldMode && !["nowrapper", ""].includes(formatOptionsInput.fieldMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.fieldMode} for fieldMode does not match`);
      }
      if (formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput.measureDisplayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
      }
      if (formatOptionsInput.textExpandBehaviorDisplay && !["InPlace", "Popover"].includes(formatOptionsInput.textExpandBehaviorDisplay)) {
        throw new Error(`Allowed value ${formatOptionsInput.textExpandBehaviorDisplay} for textExpandBehaviorDisplay does not match`);
      }
      if (formatOptionsInput.semanticKeyStyle && !["ObjectIdentifier", "Label", ""].includes(formatOptionsInput.semanticKeyStyle)) {
        throw new Error(`Allowed value ${formatOptionsInput.semanticKeyStyle} for semanticKeyStyle does not match`);
      }
      if (typeof formatOptionsInput.isAnalytics === "string") {
        formatOptionsInput.isAnalytics = formatOptionsInput.isAnalytics === "true";
      }
      if (typeof formatOptionsInput.forInlineCreationRows === "string") {
        formatOptionsInput.forInlineCreationRows = formatOptionsInput.forInlineCreationRows === "true";
      }
      if (typeof formatOptionsInput.hasDraftIndicator === "string") {
        formatOptionsInput.hasDraftIndicator = formatOptionsInput.hasDraftIndicator === "true";
      }

      /*
      Historical default values are currently disabled
      if (!formatOptionsInput.semanticKeyStyle) {
      	formatOptionsInput.semanticKeyStyle = "";
      }
      */

      return formatOptionsInput;
    }
  }), _dec22 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec23 = blockAttribute({
    type: "boolean"
  }), _dec24 = blockAttribute({
    type: "string"
  }), _dec25 = blockAttribute({
    type: "string"
  }), _dec26 = blockEvent(), _dec27 = blockEvent(), _dec28 = blockAttribute({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(InternalFieldBlock, _BuildingBlockBase);
    var _proto = InternalFieldBlock.prototype;
    /**
     * Metadata path to the entity set
     */
    /**
     * Flag indicating whether action will navigate after execution
     */
    /**
     * Metadata path to the dataField.
     * This property is usually a metadataContext pointing to a DataField having
     * $Type of DataField, DataFieldWithUrl, DataFieldForAnnotation, DataFieldForAction, DataFieldForIntentBasedNavigation, DataFieldWithNavigationPath, or DataPointType.
     * But it can also be a Property with $kind="Property"
     */
    /**
     * Edit Mode of the field.
     *
     * If the editMode is undefined then we compute it based on the metadata
     * Otherwise we use the value provided here.
     */
    /**
     * Wrap field
     */
    /**
     * CSS class for margin
     */
    /**
     * Property added to associate the label with the Field
     */
    /**
     * Option to add a semantic object to a field
     */
    /**
     * Metadata path to the entity set.
     * This is used in inner fragments, so we need to declare it as block attribute context.
     */
    /**
     * This is used in inner fragments, so we need to declare it as block attribute.
     */
    /**
     * This is used in inner fragments, so we need to declare it as block attribute.
     */
    /**
     * This is used to set valueState on the field
     */
    /**
     * Event handler for change event
     */
    /**
     * Event handler for live change event
     */
    /* Display style common properties start */
    /* AmountWith currency fragment end */
    /* Edit style common properties start */
    /**
     * This is used in inner fragments, so we need to declare it as block attribute.
     */
    /* Edit style common properties end */
    /* Rating Indicator properties start */
    /* InputWithUnit end */
    /*ObjectIdentifier start */
    /*SemanticKeyWithDraftIndicator end*/
    _proto.getOverrides = function getOverrides(controlConfiguration, id) {
      /*
      	Qualms: We need to use this TemplateProcessorSettings type to be able to iterate
      	over the properties later on and cast it afterwards as a field property type
      */
      const props = {};
      if (controlConfiguration) {
        const controlConfig = controlConfiguration[id];
        if (controlConfig) {
          Object.keys(controlConfig).forEach(function (configKey) {
            props[configKey] = controlConfig[configKey];
          });
        }
      }
      return props;
    };
    _proto.getObjectIdentifierText = function getObjectIdentifierText(fieldFormatOptions, propertyDataModelObjectPath) {
      var _propertyDefinition$a, _propertyDefinition$a2;
      let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(propertyDataModelObjectPath));
      const targetDisplayMode = fieldFormatOptions === null || fieldFormatOptions === void 0 ? void 0 : fieldFormatOptions.displayMode;
      const propertyDefinition = propertyDataModelObjectPath.targetObject.type === "PropertyPath" ? propertyDataModelObjectPath.targetObject.$target : propertyDataModelObjectPath.targetObject;
      const commonText = (_propertyDefinition$a = propertyDefinition.annotations) === null || _propertyDefinition$a === void 0 ? void 0 : (_propertyDefinition$a2 = _propertyDefinition$a.Common) === null || _propertyDefinition$a2 === void 0 ? void 0 : _propertyDefinition$a2.Text;
      if (commonText === undefined) {
        return undefined;
      }
      propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
      switch (targetDisplayMode) {
        case "ValueDescription":
          const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
          return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
        case "DescriptionValue":
          return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
        default:
          return undefined;
      }
    };
    _proto.setUpDataPointType = function setUpDataPointType(dataField) {
      // data point annotations need not have $Type defined, so add it if missing
      if ((dataField === null || dataField === void 0 ? void 0 : dataField.term) === "com.sap.vocabularies.UI.v1.DataPoint") {
        dataField.$Type = dataField.$Type || "com.sap.vocabularies.UI.v1.DataPointType";
      }
    };
    _proto.setUpVisibleProperties = function setUpVisibleProperties(internalField) {
      // we do this before enhancing the dataModelPath so that it still points at the DataField
      const propertyDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
      internalField.visible = FieldTemplating.getVisibleExpression(propertyDataModelObjectPath, internalField.formatOptions);
      internalField.displayVisible = internalField.formatOptions.fieldMode === "nowrapper" ? internalField.visible : undefined;
    };
    _proto.getContentId = function getContentId(macroId) {
      return `${macroId}-content`;
    };
    _proto.setUpFormatOptions = function setUpFormatOptions(internalField, dataModelPath, controlConfiguration, settings) {
      var _settings$models$view;
      const overrideProps = this.getOverrides(controlConfiguration, internalField.dataField.getPath());
      if (!internalField.formatOptions.displayMode) {
        internalField.formatOptions.displayMode = UIFormatters.getDisplayMode(dataModelPath);
      }
      if (internalField.formatOptions.displayMode === "Description") {
        internalField.valueAsStringBindingExpression = FieldTemplating.getValueBinding(dataModelPath, internalField.formatOptions, true, true, undefined, true);
      }
      internalField.formatOptions.textLinesEdit = overrideProps.textLinesEdit || overrideProps.formatOptions && overrideProps.formatOptions.textLinesEdit || internalField.formatOptions.textLinesEdit || 4;
      internalField.formatOptions.textMaxLines = overrideProps.textMaxLines || overrideProps.formatOptions && overrideProps.formatOptions.textMaxLines || internalField.formatOptions.textMaxLines;

      // Retrieve text from value list as fallback feature for missing text annotation on the property
      if ((_settings$models$view = settings.models.viewData) !== null && _settings$models$view !== void 0 && _settings$models$view.getProperty("/retrieveTextFromValueList")) {
        internalField.formatOptions.retrieveTextFromValueList = FieldTemplating.isRetrieveTextFromValueListEnabled(dataModelPath.targetObject, internalField.formatOptions);
        if (internalField.formatOptions.retrieveTextFromValueList) {
          var _dataModelPath$target, _dataModelPath$target2, _dataModelPath$target3;
          // Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
          const hasEntityTextArrangement = !!(dataModelPath !== null && dataModelPath !== void 0 && (_dataModelPath$target = dataModelPath.targetEntityType) !== null && _dataModelPath$target !== void 0 && (_dataModelPath$target2 = _dataModelPath$target.annotations) !== null && _dataModelPath$target2 !== void 0 && (_dataModelPath$target3 = _dataModelPath$target2.UI) !== null && _dataModelPath$target3 !== void 0 && _dataModelPath$target3.TextArrangement);
          internalField.formatOptions.displayMode = hasEntityTextArrangement ? internalField.formatOptions.displayMode : "DescriptionValue";
        }
      }
      if (internalField.formatOptions.fieldMode === "nowrapper" && internalField.editMode === "Display") {
        if (internalField._flexId) {
          internalField.noWrapperId = internalField._flexId;
        } else {
          internalField.noWrapperId = internalField.idPrefix ? generate([internalField.idPrefix, "Field-content"]) : undefined;
        }
      }
    };
    _proto.setUpDisplayStyle = function setUpDisplayStyle(internalField, dataField, dataModelPath) {
      var _property$annotations, _property$annotations2, _property$annotations3, _property$annotations4, _property$annotations5, _property$annotations6, _Target, _Target$$target, _Target2, _Target2$$target, _property$annotations7, _property$annotations8, _property$annotations9, _property$annotations10, _property$annotations11, _property$annotations12, _property$annotations13, _property$annotations14;
      const property = dataModelPath.targetObject;
      if (!dataModelPath.targetObject) {
        internalField.displayStyle = "Text";
        return;
      }
      internalField.hasUnitOrCurrency = ((_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.Measures) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.Unit) !== undefined || ((_property$annotations3 = property.annotations) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3.Measures) === null || _property$annotations4 === void 0 ? void 0 : _property$annotations4.ISOCurrency) !== undefined;
      internalField.hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit(dataModelPath);
      internalField.textFromValueList = wrapBindingExpression(compileExpression(fn("FieldRuntime.retrieveTextFromValueList", [pathInModel(getContextRelativeTargetObjectPath(dataModelPath)), `/${property.fullyQualifiedName}`, internalField.formatOptions.displayMode])), false);
      if (property.type === "Edm.Stream") {
        internalField.displayStyle = "File";
        return;
      }
      if ((_property$annotations5 = property.annotations) !== null && _property$annotations5 !== void 0 && (_property$annotations6 = _property$annotations5.UI) !== null && _property$annotations6 !== void 0 && _property$annotations6.IsImageURL) {
        internalField.displayStyle = "Avatar";
        return;
      }
      switch (dataField.$Type) {
        case "com.sap.vocabularies.UI.v1.DataPointType":
          internalField.displayStyle = "DataPoint";
          return;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          if (((_Target = dataField.Target) === null || _Target === void 0 ? void 0 : (_Target$$target = _Target.$target) === null || _Target$$target === void 0 ? void 0 : _Target$$target.$Type) === "com.sap.vocabularies.UI.v1.DataPointType") {
            internalField.displayStyle = "DataPoint";
            return;
          } else if (((_Target2 = dataField.Target) === null || _Target2 === void 0 ? void 0 : (_Target2$$target = _Target2.$target) === null || _Target2$$target === void 0 ? void 0 : _Target2$$target.$Type) === "com.sap.vocabularies.Communication.v1.ContactType") {
            internalField.displayStyle = "Contact";
            return;
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          internalField.displayStyle = "Button";
          return;
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          internalField.displayStyle = "Link";
          return;
      }
      const hasQuickView = FieldTemplating.isUsedInNavigationWithQuickViewFacets(dataModelPath, property);
      const hasSemanticObjects = !!FieldTemplating.getPropertyWithSemanticObject(dataModelPath) || internalField.semanticObject !== undefined && internalField.semanticObject !== "";
      if (isSemanticKey(property, dataModelPath) && internalField.formatOptions.semanticKeyStyle) {
        var _dataModelPath$contex, _dataModelPath$contex2, _dataModelPath$contex3, _dataModelPath$contex4, _dataModelPath$target4, _dataModelPath$target5, _dataModelPath$target6, _dataModelPath$contex5;
        internalField.hasQuickView = hasQuickView || hasSemanticObjects;
        internalField.hasSituationsIndicator = SituationsIndicatorBlock.getSituationsNavigationProperty(dataModelPath.targetEntityType) !== undefined;
        this.setUpObjectIdentifierTitleAndText(internalField, dataModelPath);
        if ((_dataModelPath$contex = dataModelPath.contextLocation) !== null && _dataModelPath$contex !== void 0 && (_dataModelPath$contex2 = _dataModelPath$contex.targetEntitySet) !== null && _dataModelPath$contex2 !== void 0 && (_dataModelPath$contex3 = _dataModelPath$contex2.annotations) !== null && _dataModelPath$contex3 !== void 0 && (_dataModelPath$contex4 = _dataModelPath$contex3.Common) !== null && _dataModelPath$contex4 !== void 0 && _dataModelPath$contex4.DraftRoot && (_dataModelPath$target4 = dataModelPath.targetEntitySet) !== null && _dataModelPath$target4 !== void 0 && (_dataModelPath$target5 = _dataModelPath$target4.annotations) !== null && _dataModelPath$target5 !== void 0 && (_dataModelPath$target6 = _dataModelPath$target5.Common) !== null && _dataModelPath$target6 !== void 0 && _dataModelPath$target6.DraftRoot && internalField.formatOptions.hasDraftIndicator !== false) {
          // In case of a grid table or tree table hasDraftIndicator will be false since the draft
          // indicator needs to be rendered into a separate column
          // Hence we then fall back to display styles ObjectIdentifier or LabelSemanticKey instead
          // of the combined ID and draft indicator style
          internalField.draftIndicatorVisible = FieldTemplating.getDraftIndicatorVisibleBinding(dataModelPath.targetObject.name);
          internalField.displayStyle = "SemanticKeyWithDraftIndicator";
          return;
        }
        internalField.showErrorIndicator = ((_dataModelPath$contex5 = dataModelPath.contextLocation) === null || _dataModelPath$contex5 === void 0 ? void 0 : _dataModelPath$contex5.targetObject._type) === "NavigationProperty" && !internalField.formatOptions.fieldGroupDraftIndicatorPropertyPath;
        internalField.situationsIndicatorPropertyPath = dataModelPath.targetObject.name;
        internalField.displayStyle = internalField.formatOptions.semanticKeyStyle === "ObjectIdentifier" ? "ObjectIdentifier" : "LabelSemanticKey";
        return;
      }
      if (dataField.Criticality) {
        internalField.hasQuickView = hasQuickView || hasSemanticObjects;
        internalField.displayStyle = "ObjectStatus";
        return;
      }
      if ((_property$annotations7 = property.annotations) !== null && _property$annotations7 !== void 0 && (_property$annotations8 = _property$annotations7.Measures) !== null && _property$annotations8 !== void 0 && _property$annotations8.ISOCurrency && String(internalField.formatOptions.isCurrencyAligned) === "true" && internalField.formatOptions.measureDisplayMode !== "Hidden") {
        internalField.valueAsStringBindingExpression = FieldTemplating.getValueBinding(dataModelPath, internalField.formatOptions, true, true, undefined, true);
        internalField.unitBindingExpression = compileExpression(UIFormatters.getBindingForUnitOrCurrency(dataModelPath));
        internalField.displayStyle = "AmountWithCurrency";
        return;
      }
      if ((_property$annotations9 = property.annotations) !== null && _property$annotations9 !== void 0 && (_property$annotations10 = _property$annotations9.Communication) !== null && _property$annotations10 !== void 0 && _property$annotations10.IsEmailAddress || (_property$annotations11 = property.annotations) !== null && _property$annotations11 !== void 0 && (_property$annotations12 = _property$annotations11.Communication) !== null && _property$annotations12 !== void 0 && _property$annotations12.IsPhoneNumber) {
        internalField.displayStyle = "Link";
        return;
      }
      if ((_property$annotations13 = property.annotations) !== null && _property$annotations13 !== void 0 && (_property$annotations14 = _property$annotations13.UI) !== null && _property$annotations14 !== void 0 && _property$annotations14.MultiLineText) {
        internalField.displayStyle = "ExpandableText";
        return;
      }
      if (hasQuickView || hasSemanticObjects) {
        internalField.hasQuickView = true;
        internalField.displayStyle = "LinkWithQuickView";
        return;
      }
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
        internalField.displayStyle = "Link";
        return;
      }
      internalField.displayStyle = "Text";
    };
    _proto.setUpEditStyle = function setUpEditStyle(appComponent) {
      if (this.idPrefix) {
        this.editStyleId = generate([this.idPrefix, "Field-edit"]);
      }
      FieldTemplating.setEditStyleProperties(this, this.convertedDataField, this.dataModelPath);
      this.computeFieldGroupIds(appComponent);
    }

    /**
     * Calculate the fieldGroupIds for an Input or other edit control.
     *
     * @param dataModelObjectPath
     * @param appComponent
     */;
    _proto.computeFieldGroupIds = function computeFieldGroupIds(appComponent) {
      var _this$dataModelPath$t, _this$dataModelPath$t2;
      const typesForCollaborationFocusManagement = ["InputWithValueHelp", "TextArea", "DatePicker", "TimePicker", "DateTimePicker", "InputWithUnit", "Input"];
      if (!appComponent) {
        //for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
        return;
      }
      const sideEffectService = appComponent.getSideEffectsService();
      const fieldGroupIds = sideEffectService.computeFieldGroupIds(((_this$dataModelPath$t = this.dataModelPath.targetEntityType) === null || _this$dataModelPath$t === void 0 ? void 0 : _this$dataModelPath$t.fullyQualifiedName) ?? "", ((_this$dataModelPath$t2 = this.dataModelPath.targetObject) === null || _this$dataModelPath$t2 === void 0 ? void 0 : _this$dataModelPath$t2.fullyQualifiedName) ?? "");
      if (this.collaborationEnabled && typesForCollaborationFocusManagement.includes(this.editStyle || "")) {
        const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${this.dataSourcePath}`;
        fieldGroupIds.push(collaborationFieldGroup);
        this.mainPropertyRelativePath = isProperty(this.dataModelPath.targetObject) ? getContextRelativeTargetObjectPath(this.dataModelPath) : undefined;
      }
      this.fieldGroupIds = fieldGroupIds.length ? fieldGroupIds.join(",") : undefined;
    };
    _proto.setUpObjectIdentifierTitleAndText = function setUpObjectIdentifierTitleAndText(internalField, propertyDataModelObjectPath) {
      var _internalField$format;
      const semanticStyle = (_internalField$format = internalField.formatOptions) === null || _internalField$format === void 0 ? void 0 : _internalField$format.semanticKeyStyle;
      const displayMode = internalField.formatOptions.displayMode;
      internalField.identifierTitle = getTitleBindingExpression(propertyDataModelObjectPath, FieldTemplating.getTextBindingExpression, {
        displayMode,
        splitTitleOnTwoLines: true
      }, undefined, undefined);
      internalField.identifierText = semanticStyle === "ObjectIdentifier" ? this.getObjectIdentifierText(internalField.formatOptions, propertyDataModelObjectPath) : undefined;
    };
    _proto.setUpValueState = function setUpValueState(internalField) {
      var _internalField$dataMo, _internalField$dataMo2, _internalField$dataMo3, _internalField$dataMo4;
      let valueStateExp;
      const fieldContainerType = internalField.formatOptions.textAlignMode;
      const propertyPathInModel = pathInModel(getContextRelativeTargetObjectPath(internalField.dataModelPath));
      const textPath = getExpressionFromAnnotation((_internalField$dataMo = internalField.dataModelPath) === null || _internalField$dataMo === void 0 ? void 0 : (_internalField$dataMo2 = _internalField$dataMo.targetObject) === null || _internalField$dataMo2 === void 0 ? void 0 : (_internalField$dataMo3 = _internalField$dataMo2.annotations) === null || _internalField$dataMo3 === void 0 ? void 0 : (_internalField$dataMo4 = _internalField$dataMo3.Common) === null || _internalField$dataMo4 === void 0 ? void 0 : _internalField$dataMo4.Text);
      if (fieldContainerType === "Table") {
        valueStateExp = formatResult([pathInModel(`/recommendationsData`, "internal"), pathInModel(`/isEditable`, "ui"), internalField.dataSourcePath, propertyPathInModel, textPath], additionalValueFormatter.formatValueState, internalField.dataModelPath.targetEntityType);
      } else {
        valueStateExp = formatResult([pathInModel(`/recommendationsData`, "internal"), pathInModel(`/isEditable`, "ui"), internalField.dataSourcePath, propertyPathInModel, textPath], additionalValueFormatter.formatValueState);
      }
      internalField.valueState = compileExpression(valueStateExp);
    };
    _proto.setInputWithValuehelpPlaceholder = function setInputWithValuehelpPlaceholder(internalField) {
      let targetEntityType;
      const editStylePlaceholder = internalField.editStylePlaceholder;
      const fieldContainerType = internalField.formatOptions.textAlignMode;
      if (fieldContainerType === "Table") {
        targetEntityType = internalField.dataModelPath.targetEntityType;
      }
      const placeholderExp = formatResult([pathInModel(`/recommendationsData`, "internal"), pathInModel(`/currentCtxt`, "internal"), pathInModel(`${internalField.dataModelPath.targetObject.name}@$ui5.fe.messageType`), editStylePlaceholder, internalField.formatOptions.displayMode], additionalValueFormatter.formatPlaceholder, targetEntityType);
      internalField.editStylePlaceholder = compileExpression(placeholderExp);
    };
    function InternalFieldBlock(props, controlConfiguration, settings) {
      var _this$formatOptions, _this$convertedDataFi, _this$convertedDataFi2;
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "dataSourcePath", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "emptyIndicatorMode", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_flexId", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "idPrefix", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_apiId", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "noWrapperId", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entitySet", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigateAfterAction", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataField", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "editMode", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "wrap", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "class", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "textAlign", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "semanticObject", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "requiredExpression", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showErrorObjectStatus", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formatOptions", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entityType", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "collaborationEnabled", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_vhFlexId", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "valueState", _descriptor24, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onChange", _descriptor25, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onLiveChange", _descriptor26, _assertThisInitialized(_this));
      _this.hasQuickView = false;
      _this.hasUnitOrCurrency = undefined;
      _this.hasValidAnalyticalCurrencyOrUnit = undefined;
      _this.textFromValueList = undefined;
      _this.editStyleId = undefined;
      _initializerDefineProperty(_this, "editStylePlaceholder", _descriptor27, _assertThisInitialized(_this));
      _this.ratingIndicatorTooltip = undefined;
      _this.ratingIndicatorTargetValue = undefined;
      _this.showErrorIndicator = false;
      _this.situationsIndicatorPropertyPath = "";
      _this.hasPropertyInsertRestrictions = false;
      _this.computeCommonProperties(_assertThisInitialized(_this), settings);
      _this.setUpDataPointType(_this.convertedDataField);
      _this.setUpVisibleProperties(_assertThisInitialized(_this));
      if (_this._flexId) {
        _this._apiId = _this._flexId;
        _this._flexId = _this.getContentId(_this._flexId);
        _this._vhFlexId = `${_this._flexId}_${_this.vhIdPrefix}`;
      }
      _this.dataSourcePath = getTargetObjectPath(_this.dataModelPath);
      _this.entityType = _this.metaModel.createBindingContext(`/${_this.dataModelPath.targetEntityType.fullyQualifiedName}`);
      if (((_this$formatOptions = _this.formatOptions) === null || _this$formatOptions === void 0 ? void 0 : _this$formatOptions.forInlineCreationRows) === true) {
        _this.hasPropertyInsertRestrictions = FieldTemplating.hasPropertyInsertRestrictions(_this.dataModelPath);
      }
      _this.computeEditMode(_assertThisInitialized(_this));
      _this.computeCollaborationProperties(_assertThisInitialized(_this));
      _this.computeEditableExpressions(_assertThisInitialized(_this));
      _this.setUpFormatOptions(_assertThisInitialized(_this), _this.dataModelPath, controlConfiguration, settings);
      _this.setUpDisplayStyle(_assertThisInitialized(_this), _this.convertedDataField, _this.dataModelPath);
      _this.setUpEditStyle(settings.appComponent);
      _this.setUpValueState(_assertThisInitialized(_this));
      if (_this.editStyle === "InputWithValueHelp") {
        _this.setInputWithValuehelpPlaceholder(_assertThisInitialized(_this));
      }

      // ---------------------------------------- compute bindings----------------------------------------------------
      const aDisplayStylesWithoutPropText = ["Avatar", "AmountWithCurrency"];
      if (_this.displayStyle && !aDisplayStylesWithoutPropText.includes(_this.displayStyle) && _this.dataModelPath.targetObject) {
        _this.text = _this.text ?? FieldTemplating.getTextBinding(_this.dataModelPath, _this.formatOptions);
      } else {
        _this.text = "";
      }
      _this.emptyIndicatorMode = _this.formatOptions.showEmptyIndicator ? "On" : undefined;

      // If the target is a property with a DataFieldDefault, use this as data field
      if (isProperty(_this.convertedDataField) && ((_this$convertedDataFi = _this.convertedDataField.annotations) === null || _this$convertedDataFi === void 0 ? void 0 : (_this$convertedDataFi2 = _this$convertedDataFi.UI) === null || _this$convertedDataFi2 === void 0 ? void 0 : _this$convertedDataFi2.DataFieldDefault) !== undefined) {
        _this.dataField = _this.metaModel.createBindingContext(`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`, _this.dataField);
      }
      return _this;
    }

    /**
     * This helper sets the common properties convertedDataField, dataModelPath
     * and property that can be reused in the individual templates if required.
     *
     * @param internalField Reference to the current internal field instance
     * @param settings
     */
    _exports = InternalFieldBlock;
    _proto.computeCommonProperties = function computeCommonProperties(internalField, settings) {
      var _this$dataModelPath, _this$dataModelPath$t3, _this$dataModelPath2;
      const convertedDataField = MetaModelConverter.convertMetaModelContext(internalField.dataField);
      let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
      dataModelPath = FieldTemplating.getDataModelObjectPathForValue(dataModelPath) || dataModelPath;
      const property = dataModelPath.targetObject;
      this.convertedDataField = convertedDataField;
      this.dataModelPath = dataModelPath;
      this.property = property;
      this.metaModel = settings.models.metaModel || settings.models.entitySet;
      this.propertyForFieldControl = (_this$dataModelPath = this.dataModelPath) !== null && _this$dataModelPath !== void 0 && (_this$dataModelPath$t3 = _this$dataModelPath.targetObject) !== null && _this$dataModelPath$t3 !== void 0 && _this$dataModelPath$t3.Value ? this.dataModelPath.targetObject.Value : (_this$dataModelPath2 = this.dataModelPath) === null || _this$dataModelPath2 === void 0 ? void 0 : _this$dataModelPath2.targetObject;
    };
    _proto.computeEditMode = function computeEditMode(internalField) {
      if (internalField.editMode !== undefined && internalField.editMode !== null) {
        // Even if it provided as a string it's a valid part of a binding expression that can be later combined into something else.
        internalField.editModeAsObject = internalField.editMode;
      } else {
        const measureReadOnly = internalField.formatOptions.measureDisplayMode ? internalField.formatOptions.measureDisplayMode === "ReadOnly" : false;
        internalField.editModeAsObject = UIFormatters.getEditMode(internalField.propertyForFieldControl, internalField.dataModelPath, measureReadOnly, true, internalField.convertedDataField);
        internalField.editMode = compileExpression(ifElse(and(pathInModel("@$ui5.context.isInactive"), internalField.hasPropertyInsertRestrictions), "Display", internalField.editModeAsObject));
      }
    }

    /**
     * This helper computes the properties that are needed for the collaboration avatar.
     *
     * @param internalField Reference to the current internal field instance
     */;
    _proto.computeCollaborationProperties = function computeCollaborationProperties(internalField) {
      const editableExpression = UIFormatters.getEditableExpressionAsObject(internalField.propertyForFieldControl, internalField.convertedDataField, internalField.dataModelPath);
      if (ModelHelper.isCollaborationDraftSupported(internalField.metaModel) && internalField.editMode !== FieldEditMode.Display) {
        internalField.collaborationEnabled = true;
        // Expressions needed for Collaboration Visualization
        internalField.collaborationExpression = UIFormatters.getCollaborationExpression(internalField.dataModelPath, CollaborationFormatters.hasCollaborationActivity);
        internalField.editableExpression = compileExpression(and(editableExpression, not(internalField.collaborationExpression)));
        internalField.editMode = compileExpression(ifElse(internalField.collaborationExpression, constant("ReadOnly"), ifElse(and(pathInModel("@$ui5.context.isInactive"), internalField.hasPropertyInsertRestrictions), "Display", internalField.editModeAsObject)));
      } else {
        internalField.editableExpression = compileExpression(editableExpression);
      }
    }

    /**
     * Helper to computes some of the expression for further processing.
     *
     * @param internalField Reference to the current internal field instance
     */;
    _proto.computeEditableExpressions = function computeEditableExpressions(internalField) {
      var _internalField$entity, _internalField$entity2;
      const requiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions((_internalField$entity = internalField.entitySet) === null || _internalField$entity === void 0 ? void 0 : _internalField$entity.getPath().replaceAll("/$NavigationPropertyBinding/", "/"), internalField.metaModel);
      const requiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions((_internalField$entity2 = internalField.entitySet) === null || _internalField$entity2 === void 0 ? void 0 : _internalField$entity2.getPath().replaceAll("/$NavigationPropertyBinding/", "/"), internalField.metaModel);
      const oRequiredProperties = {
        requiredPropertiesFromInsertRestrictions: requiredPropertiesFromInsertRestrictions,
        requiredPropertiesFromUpdateRestrictions: requiredPropertiesFromUpdateRestrictions
      };
      internalField.liveChangeEnabled = !!internalField.onLiveChange;
      internalField.enabledExpression = UIFormatters.getEnabledExpression(internalField.propertyForFieldControl, internalField.convertedDataField, false, internalField.dataModelPath);
      internalField.requiredExpression = UIFormatters.getRequiredExpression(internalField.propertyForFieldControl, internalField.convertedDataField, false, false, oRequiredProperties, internalField.dataModelPath);
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.getTemplate = function getTemplate() {
      return getFieldStructureTemplate(this);
    };
    return InternalFieldBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "dataSourcePath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "emptyIndicatorMode", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_apiId", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "noWrapperId", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FieldValueHelp";
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigateAfterAction", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "dataField", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "editMode", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "wrap", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "class", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "textAlign", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "requiredExpression", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "showErrorObjectStatus", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "entityType", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "collaborationEnabled", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "_vhFlexId", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "valueState", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "onLiveChange", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "editStylePlaceholder", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = InternalFieldBlock;
  return _exports;
}, false);
