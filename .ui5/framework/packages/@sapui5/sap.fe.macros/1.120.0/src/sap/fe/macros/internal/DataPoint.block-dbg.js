/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/helpers/DataPointTemplating"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingToolkit, StableIdHelper, TypeGuards, CriticalityFormatters, DataModelPathHelper, PropertyHelper, UIFormatters, FieldTemplating, DataPointTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var getValueFormatted = DataPointTemplating.getValueFormatted;
  var getHeaderRatingIndicatorText = DataPointTemplating.getHeaderRatingIndicatorText;
  var buildFieldBindingExpression = DataPointTemplating.buildFieldBindingExpression;
  var buildExpressionForProgressIndicatorPercentValue = DataPointTemplating.buildExpressionForProgressIndicatorPercentValue;
  var buildExpressionForProgressIndicatorDisplayValue = DataPointTemplating.buildExpressionForProgressIndicatorDisplayValue;
  var isUsedInNavigationWithQuickViewFacets = FieldTemplating.isUsedInNavigationWithQuickViewFacets;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getPropertyWithSemanticObject = FieldTemplating.getPropertyWithSemanticObject;
  var hasUnit = PropertyHelper.hasUnit;
  var hasCurrency = PropertyHelper.hasCurrency;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var buildExpressionForCriticalityIcon = CriticalityFormatters.buildExpressionForCriticalityIcon;
  var buildExpressionForCriticalityColor = CriticalityFormatters.buildExpressionForCriticalityColor;
  var isProperty = TypeGuards.isProperty;
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let DataPointBlock = (_dec = defineBuildingBlock({
    name: "DataPoint",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "string"
  }), _dec5 = blockAttribute({
    type: "object",
    validate: function (formatOptionsInput) {
      if (formatOptionsInput !== null && formatOptionsInput !== void 0 && formatOptionsInput.dataPointStyle && !["", "large"].includes(formatOptionsInput === null || formatOptionsInput === void 0 ? void 0 : formatOptionsInput.dataPointStyle)) {
        throw new Error(`Allowed value ${formatOptionsInput.dataPointStyle} for dataPointStyle does not match`);
      }
      if (formatOptionsInput !== null && formatOptionsInput !== void 0 && formatOptionsInput.displayMode && !["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput === null || formatOptionsInput === void 0 ? void 0 : formatOptionsInput.displayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
      }
      if (formatOptionsInput !== null && formatOptionsInput !== void 0 && formatOptionsInput.iconSize && !["1rem", "1.375rem", "2rem"].includes(formatOptionsInput === null || formatOptionsInput === void 0 ? void 0 : formatOptionsInput.iconSize)) {
        throw new Error(`Allowed value ${formatOptionsInput.iconSize} for iconSize does not match`);
      }
      if (formatOptionsInput !== null && formatOptionsInput !== void 0 && formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput === null || formatOptionsInput === void 0 ? void 0 : formatOptionsInput.measureDisplayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
      }
      return formatOptionsInput;
    }
  }), _dec6 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(DataPointBlock, _BuildingBlockBase);
    /**
     * Prefix added to the generated ID of the field
     */
    /**
     * Metadata path to the dataPoint.
     * This property is usually a metadataContext pointing to a DataPoint having
     * $Type = "com.sap.vocabularies.UI.v1.DataPointType"
     */
    /**
     * Property added to associate the label with the DataPoint
     */
    /**
     * Retrieves the templating objects to further process the DataPoint.
     *
     * @param context DataPointProperties or a DataPoint
     * @returns The models containing infos like the DataModelPath, ValueDataModelPath and DataPointConverted
     */
    DataPointBlock.getTemplatingObjects = function getTemplatingObjects(context) {
      var _internalDataModelPat, _internalDataModelPat2;
      const internalDataModelPath = getInvolvedDataModelObjects(context.metaPath, context.contextPath);
      let internalValueDataModelPath;
      context.visible = getVisibleExpression(internalDataModelPath);
      if (internalDataModelPath !== null && internalDataModelPath !== void 0 && (_internalDataModelPat = internalDataModelPath.targetObject) !== null && _internalDataModelPat !== void 0 && (_internalDataModelPat2 = _internalDataModelPat.Value) !== null && _internalDataModelPat2 !== void 0 && _internalDataModelPat2.path) {
        internalValueDataModelPath = enhanceDataModelPath(internalDataModelPath, internalDataModelPath.targetObject.Value.path);
      }
      const internalDataPointConverted = convertMetaModelContext(context.metaPath);
      return {
        dataModelPath: internalDataModelPath,
        valueDataModelPath: internalValueDataModelPath,
        dataPointConverted: internalDataPointConverted
      };
    }

    /**
     * Function that calculates the visualization type for this DataPoint.
     *
     * @param properties The datapoint properties
     * @returns The DataPointProperties with the optimized coding for the visualization type
     */;
    DataPointBlock.getDataPointVisualization = function getDataPointVisualization(properties) {
      const {
        dataModelPath,
        valueDataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(properties);
      if ((dataPointConverted === null || dataPointConverted === void 0 ? void 0 : dataPointConverted.Visualization) === "UI.VisualizationType/Rating") {
        properties.visualization = "Rating";
        return properties;
      }
      if ((dataPointConverted === null || dataPointConverted === void 0 ? void 0 : dataPointConverted.Visualization) === "UI.VisualizationType/Progress") {
        properties.visualization = "Progress";
        return properties;
      }
      const valueProperty = valueDataModelPath && valueDataModelPath.targetObject;
      //check whether the visualization type should be an object number in case one of the if conditions met
      properties.hasQuickView = valueProperty && isUsedInNavigationWithQuickViewFacets(dataModelPath, valueProperty);
      if (getPropertyWithSemanticObject(valueDataModelPath)) {
        properties.hasQuickView = true;
      }
      if (!properties.hasQuickView) {
        if (isProperty(valueProperty) && (hasUnit(valueProperty) || hasCurrency(valueProperty))) {
          // we only show an objectNumber if there is no quickview and a unit or a currency
          properties.visualization = "ObjectNumber";
          return properties;
        }
      }

      //default case to handle this as objectStatus type
      properties.visualization = "ObjectStatus";
      return properties;
    }

    /**
     * Constructor method of the building block.
     *
     * @param properties The datapoint properties
     */;
    function DataPointBlock(properties) {
      var _this;
      //setup initial default property settings
      properties.hasQuickView = false;
      _this = _BuildingBlockBase.call(this, DataPointBlock.getDataPointVisualization(properties)) || this;
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formatOptions", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _assertThisInitialized(_this));
      return _this;
    }

    /**
     * The building block template for the rating indicator part.
     *
     * @returns An XML-based string with the definition of the rating indicator template
     */
    _exports = DataPointBlock;
    var _proto = DataPointBlock.prototype;
    _proto.getRatingIndicatorTemplate = function getRatingIndicatorTemplate() {
      var _dataPointValue$$targ;
      const {
        dataModelPath,
        valueDataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      const dataPointTarget = dataModelPath.targetObject;
      const targetValue = this.getTargetValueBinding();
      const dataPointValue = (dataPointTarget === null || dataPointTarget === void 0 ? void 0 : dataPointTarget.Value) || "";
      const propertyType = dataPointValue === null || dataPointValue === void 0 ? void 0 : (_dataPointValue$$targ = dataPointValue.$target) === null || _dataPointValue$$targ === void 0 ? void 0 : _dataPointValue$$targ.type;
      let numberOfFractionalDigits;
      if (propertyType === "Edm.Decimal" && dataPointTarget.ValueFormat) {
        if (dataPointTarget.ValueFormat.NumberOfFractionalDigits) {
          numberOfFractionalDigits = dataPointTarget.ValueFormat.NumberOfFractionalDigits;
        }
      }
      const value = getValueFormatted(valueDataModelPath, dataPointValue, propertyType, numberOfFractionalDigits);
      const text = getHeaderRatingIndicatorText(this.metaPath, dataPointTarget);
      let headerLabel = "";
      let targetLabel = "";
      const targetLabelExpression = compileExpression(formatResult([pathInModel("T_HEADER_RATING_INDICATOR_FOOTER", "sap.fe.i18n"), getExpressionFromAnnotation(dataPointConverted.Value, getRelativePaths(dataModelPath)), dataPointConverted.TargetValue ? getExpressionFromAnnotation(dataPointConverted.TargetValue, getRelativePaths(dataModelPath)) : "5"], "MESSAGE"));
      if (this.formatOptions.showLabels ?? false) {
        headerLabel = xml`<Label xmlns="sap.m"
					${this.attr("text", text)}
					${this.attr("visible", dataPointTarget.SampleSize || dataPointTarget.Description ? true : false)}
				/>`;
        targetLabel = xml`<Label
			xmlns="sap.m"
			core:require="{MESSAGE: 'sap/base/strings/formatMessage' }"
			${this.attr("text", targetLabelExpression)}
			visible="true" />`;
      }
      return xml`
		${headerLabel}
		<RatingIndicator
		xmlns="sap.m"

		${this.attr("id", this.idPrefix ? generate([this.idPrefix, "RatingIndicator-Field-display"]) : undefined)}
		${this.attr("maxValue", targetValue)}
		${this.attr("value", value)}
		${this.attr("tooltip", this.getTooltipValue())}
		${this.attr("iconSize", this.formatOptions.iconSize)}
		${this.attr("class", this.formatOptions.showLabels ?? false ? "sapUiTinyMarginTopBottom" : undefined)}
		editable="false"
	/>
	${targetLabel}`;
    }

    /**
     * The building block template for the progress indicator part.
     *
     * @returns An XML-based string with the definition of the progress indicator template
     */;
    _proto.getProgressIndicatorTemplate = function getProgressIndicatorTemplate() {
      var _this$formatOptions;
      const {
        dataModelPath,
        valueDataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      const criticalityColorExpression = buildExpressionForCriticalityColor(dataPointConverted, dataModelPath);
      const displayValue = buildExpressionForProgressIndicatorDisplayValue(dataModelPath);
      const percentValue = buildExpressionForProgressIndicatorPercentValue(dataModelPath);
      const dataPointTarget = dataModelPath.targetObject;
      let firstLabel;
      let secondLabel;
      if ((this === null || this === void 0 ? void 0 : (_this$formatOptions = this.formatOptions) === null || _this$formatOptions === void 0 ? void 0 : _this$formatOptions.showLabels) ?? false) {
        var _valueDataModelPath$t, _valueDataModelPath$t2, _valueDataModelPath$t3, _valueDataModelPath$t4;
        firstLabel = xml`<Label
				xmlns="sap.m"
				${this.attr("text", dataPointTarget === null || dataPointTarget === void 0 ? void 0 : dataPointTarget.Description)}
				${this.attr("visible", !!(dataPointTarget !== null && dataPointTarget !== void 0 && dataPointTarget.Description))}
			/>`;

        // const secondLabelText = (valueDataModelPath?.targetObject as Property)?.annotations?.Common?.Label;
        const secondLabelExpression = valueDataModelPath === null || valueDataModelPath === void 0 ? void 0 : (_valueDataModelPath$t = valueDataModelPath.targetObject) === null || _valueDataModelPath$t === void 0 ? void 0 : (_valueDataModelPath$t2 = _valueDataModelPath$t.annotations) === null || _valueDataModelPath$t2 === void 0 ? void 0 : (_valueDataModelPath$t3 = _valueDataModelPath$t2.Common) === null || _valueDataModelPath$t3 === void 0 ? void 0 : (_valueDataModelPath$t4 = _valueDataModelPath$t3.Label) === null || _valueDataModelPath$t4 === void 0 ? void 0 : _valueDataModelPath$t4.toString();
        if (secondLabelExpression) {
          secondLabel = xml`<Label
					xmlns="sap.m"
					${this.attr("text", compileExpression(secondLabelExpression))}
					${this.attr("visible", !!compileExpression(notEqual(undefined, secondLabelExpression)))}
				/>`;
        }
      }
      return xml`
		${firstLabel}
			<ProgressIndicator
				xmlns="sap.m"
				${this.attr("id", this.idPrefix ? generate([this.idPrefix, "ProgressIndicator-Field-display"]) : undefined)}
				${this.attr("displayValue", displayValue)}
				${this.attr("percentValue", percentValue)}
				${this.attr("state", criticalityColorExpression)}
				${this.attr("tooltip", this.getTooltipValue())}
			/>
			${secondLabel}`;
    }

    /**
     * The building block template for the object number common part.
     *
     * @returns An XML-based string with the definition of the object number common template
     */;
    _proto.getObjectNumberCommonTemplate = function getObjectNumberCommonTemplate() {
      const {
        dataModelPath,
        valueDataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      const criticalityColorExpression = buildExpressionForCriticalityColor(dataPointConverted, dataModelPath);
      const emptyIndicatorMode = this.formatOptions.showEmptyIndicator ?? false ? "On" : undefined;
      const objectStatusNumber = buildFieldBindingExpression(dataModelPath, this.formatOptions, true);
      const unit = this.formatOptions.measureDisplayMode === "Hidden" ? undefined : compileExpression(UIFormatters.getBindingForUnitOrCurrency(valueDataModelPath));
      return xml`<ObjectNumber
			xmlns="sap.m"
			${this.attr("id", this.idPrefix ? generate([this.idPrefix, "ObjectNumber-Field-display"]) : undefined)}
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			${this.attr("state", criticalityColorExpression)}
			${this.attr("number", objectStatusNumber)}
			${this.attr("unit", unit)}
			${this.attr("visible", this.visible)}
			emphasized="false"
			${this.attr("class", this.formatOptions.dataPointStyle === "large" ? "sapMObjectNumberLarge" : undefined)}
			${this.attr("tooltip", this.getTooltipValue())}
			${this.attr("emptyIndicatorMode", emptyIndicatorMode)}
		/>`;
    }

    /**
     * The building block template for the object number.
     *
     * @returns An XML-based string with the definition of the object number template
     */;
    _proto.getObjectNumberTemplate = function getObjectNumberTemplate() {
      var _this$formatOptions2;
      const {
        valueDataModelPath
      } = DataPointBlock.getTemplatingObjects(this);
      if ((this === null || this === void 0 ? void 0 : (_this$formatOptions2 = this.formatOptions) === null || _this$formatOptions2 === void 0 ? void 0 : _this$formatOptions2.isAnalytics) ?? false) {
        return xml`
				<control:ConditionalWrapper
					xmlns:control="sap.fe.macros.controls"
					${this.attr("condition", UIFormatters.hasValidAnalyticalCurrencyOrUnit(valueDataModelPath))}
				>
					<control:contentTrue>
						${this.getObjectNumberCommonTemplate()}
					</control:contentTrue>
					<control:contentFalse>
						<ObjectNumber
							xmlns="sap.m"
							${this.attr("id", this.idPrefix ? generate([this.idPrefix, "ObjectNumber-Field-display-differentUnit"]) : undefined)}
							number="*"
							unit=""
							${this.attr("visible", this.visible)}
							emphasized="false"
							${this.attr("class", this.formatOptions.dataPointStyle === "large" ? "sapMObjectNumberLarge" : undefined)}
						/>
					</control:contentFalse>
				</control:ConditionalWrapper>`;
      } else {
        return xml`${this.getObjectNumberCommonTemplate()}`;
      }
    }

    /**
     * Returns the dependent or an empty string.
     *
     * @returns Dependent either with the QuickView or an empty string.
     */;
    _proto.getObjectStatusDependentsTemplate = function getObjectStatusDependentsTemplate() {
      if (this.hasQuickView) {
        return `<dependents><macro:QuickView
						xmlns:macro="sap.fe.macros"
						dataField="{metaPath>}"
						contextPath="{contextPath>}"
					/></dependents>`;
      }
      return "";
    }

    /**
     * The building block template for the object status.
     *
     * @returns An XML-based string with the definition of the object status template
     */;
    _proto.getObjectStatusTemplate = function getObjectStatusTemplate() {
      const {
        dataModelPath,
        valueDataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      let criticalityColorExpression = buildExpressionForCriticalityColor(dataPointConverted, dataModelPath);
      if (criticalityColorExpression === "None" && valueDataModelPath) {
        criticalityColorExpression = this.hasQuickView ? "Information" : "None";
      }

      // if the semanticObjects already calculated the criticality we don't calculate it again
      criticalityColorExpression = criticalityColorExpression ? criticalityColorExpression : buildExpressionForCriticalityColor(dataPointConverted, dataModelPath);
      const emptyIndicatorMode = this.formatOptions.showEmptyIndicator ?? false ? "On" : undefined;
      const objectStatusText = buildFieldBindingExpression(dataModelPath, this.formatOptions, false);
      const iconExpression = this.formatOptions.dataPointStyle === "large" ? undefined : buildExpressionForCriticalityIcon(dataPointConverted, dataModelPath);
      return xml`<ObjectStatus
						xmlns="sap.m"
						${this.attr("id", this.idPrefix ? generate([this.idPrefix, "ObjectStatus-Field-display"]) : undefined)}
						core:require="{ FieldRuntime: 'sap/fe/macros/field/FieldRuntime' }"
						${this.attr("class", this.formatOptions.dataPointStyle === "large" ? "sapMObjectStatusLarge" : undefined)}
						${this.attr("icon", iconExpression)}
						${this.attr("tooltip", this.getTooltipValue())}
						${this.attr("state", criticalityColorExpression)}
						${this.attr("text", objectStatusText)}
						${this.attr("emptyIndicatorMode", emptyIndicatorMode)}
						${this.attr("active", this.hasQuickView)}
						press="FieldRuntime.pressLink"
						${this.attr("ariaLabelledBy", this.ariaLabelledBy !== null ? this.ariaLabelledBy : undefined)}
				>${this.getObjectStatusDependentsTemplate()}
				</ObjectStatus>`;
    }

    /**
     * The helper method to get a possible tooltip text.
     *
     * @returns BindingToolkitExpression
     */;
    _proto.getTooltipValue = function getTooltipValue() {
      var _dataPointConverted$a, _dataPointConverted$a2;
      const {
        dataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      return getExpressionFromAnnotation(dataPointConverted === null || dataPointConverted === void 0 ? void 0 : (_dataPointConverted$a = dataPointConverted.annotations) === null || _dataPointConverted$a === void 0 ? void 0 : (_dataPointConverted$a2 = _dataPointConverted$a.Common) === null || _dataPointConverted$a2 === void 0 ? void 0 : _dataPointConverted$a2.QuickInfo, getRelativePaths(dataModelPath));
    }

    /**
     * The helper method to get a possible target value binding.
     *
     * @returns BindingToolkitExpression
     */;
    _proto.getTargetValueBinding = function getTargetValueBinding() {
      const {
        dataModelPath,
        dataPointConverted
      } = DataPointBlock.getTemplatingObjects(this);
      return getExpressionFromAnnotation(dataPointConverted.TargetValue, getRelativePaths(dataModelPath));
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.getTemplate = function getTemplate() {
      switch (this.visualization) {
        case "Rating":
          {
            return this.getRatingIndicatorTemplate();
          }
        case "Progress":
          {
            return this.getProgressIndicatorTemplate();
          }
        case "ObjectNumber":
          {
            return this.getObjectNumberTemplate();
          }
        default:
          {
            return this.getObjectStatusTemplate();
          }
      }
    };
    return DataPointBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = DataPointBlock;
  return _exports;
}, false);
