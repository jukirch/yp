/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "./InteractiveChartHelper", "./fragments/InteractiveBarChart", "./fragments/InteractiveChartWithError", "./fragments/InteractiveLineChart"], function (Log, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, DataVisualization, Aggregation, ModelHelper, StableIdHelper, InteractiveChartHelper, InteractiveBarChart, InteractiveChartWithError, InteractiveLineChart) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24;
  var _exports = {};
  var getInteractiveLineChartTemplate = InteractiveLineChart.getInteractiveLineChartTemplate;
  var getInteractiveChartWithErrorTemplate = InteractiveChartWithError.getInteractiveChartWithErrorTemplate;
  var getInteractiveBarChartTemplate = InteractiveBarChart.getInteractiveBarChartTemplate;
  var generate = StableIdHelper.generate;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getDefaultSelectionVariant = DataVisualization.getDefaultSelectionVariant;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let VisualFilterBlock = (
  /**
   * Building block for creating a VisualFilter based on the metadata provided by OData V4.
   * <br>
   * A Chart annotation is required to bring up an interactive chart
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:VisualFilter
   *   collection="{entitySet&gt;}"
   *   chartAnnotation="{chartAnnotation&gt;}"
   *   id="someID"
   *   groupId="someGroupID"
   *   title="some Title"
   * /&gt;
   * </pre>
   *
   * @private
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "VisualFilter",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty"]
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec6 = blockAttribute({
    type: "string"
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec9 = blockAttribute({
    type: "array"
  }), _dec10 = blockAttribute({
    type: "boolean"
  }), _dec11 = blockAttribute({
    type: "boolean"
  }), _dec12 = blockAttribute({
    type: "boolean"
  }), _dec13 = blockAttribute({
    type: "string"
  }), _dec14 = blockAttribute({
    type: "string"
  }), _dec15 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec16 = blockAttribute({
    type: "boolean"
  }), _dec17 = blockAttribute({
    type: "string"
  }), _dec18 = blockAttribute({
    type: "boolean"
  }), _dec19 = blockAttribute({
    type: "boolean"
  }), _dec20 = blockAttribute({
    type: "boolean"
  }), _dec21 = blockAttribute({
    type: "string"
  }), _dec22 = blockAttribute({
    type: "string"
  }), _dec23 = blockAttribute({
    type: "string"
  }), _dec24 = blockAttribute({
    type: "boolean"
  }), _dec25 = blockAttribute({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(VisualFilterBlock, _BuildingBlockBase);
    function VisualFilterBlock(props, configuration, mSettings) {
      var _this$metaPath, _this$chartAnnotation, _this$chartAnnotation2, _this$chartAnnotation4, _this$chartAnnotation5, _this$chartAnnotation6, _this$chartAnnotation7, _visualizations$, _visualizations$$$tar, _visualizations$2, _visualizations$2$$ta, _visualizations$2$$ta2, _visualizations$2$$ta3, _aggregation$Aggregat, _aggregation$Aggregat2, _propertyAnnotations$, _aggregatableProperty, _this$chartAnnotation8, _this$contextPath;
      var _this;
      _this = _BuildingBlockBase.call(this, props, configuration, mSettings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "title", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "outParameter", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "valuelistProperty", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionVariantAnnotation", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "inParameters", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "multipleSelectionAllowed", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "required", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showOverlayInitially", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "renderLineChart", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "requiredProperties", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBarEntityType", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showError", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartMeasure", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "UoMHasCustomAggregate", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showValueHelp", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "customAggregate", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "groupId", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "errorMessageTitle", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "errorMessage", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "draftSupported", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isValueListWithFixedValues", _descriptor24, _assertThisInitialized(_this));
      _this.groupId = "$auto.visualFilters";
      _this.path = (_this$metaPath = _this.metaPath) === null || _this$metaPath === void 0 ? void 0 : _this$metaPath.getPath();
      const contextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
      const converterContext = _this.getConverterContext(contextObjectPath, undefined, mSettings);
      const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext);
      const customAggregates = aggregationHelper.getCustomAggregateDefinitions();
      const pvAnnotation = contextObjectPath.targetObject;
      let measure;
      const visualizations = pvAnnotation && pvAnnotation.Visualizations;
      _this.getChartAnnotation(visualizations, converterContext);
      let aggregations,
        custAggMeasure = [];
      if ((_this$chartAnnotation = _this.chartAnnotation) !== null && _this$chartAnnotation !== void 0 && (_this$chartAnnotation2 = _this$chartAnnotation.Measures) !== null && _this$chartAnnotation2 !== void 0 && _this$chartAnnotation2.length) {
        custAggMeasure = customAggregates.filter(custAgg => {
          var _this$chartAnnotation3;
          return custAgg.qualifier === ((_this$chartAnnotation3 = _this.chartAnnotation) === null || _this$chartAnnotation3 === void 0 ? void 0 : _this$chartAnnotation3.Measures[0].value);
        });
        measure = custAggMeasure.length > 0 ? custAggMeasure[0].qualifier : _this.chartAnnotation.Measures[0].value;
        aggregations = aggregationHelper.getAggregatedProperties("AggregatedProperties")[0];
      }
      // if there are AggregatedProperty objects but no dynamic measures, rather there are transformation aggregates found in measures
      if (aggregations && aggregations.length > 0 && !((_this$chartAnnotation4 = _this.chartAnnotation) !== null && _this$chartAnnotation4 !== void 0 && _this$chartAnnotation4.DynamicMeasures) && custAggMeasure.length === 0 && (_this$chartAnnotation5 = _this.chartAnnotation) !== null && _this$chartAnnotation5 !== void 0 && _this$chartAnnotation5.Measures && ((_this$chartAnnotation6 = _this.chartAnnotation) === null || _this$chartAnnotation6 === void 0 ? void 0 : _this$chartAnnotation6.Measures.length) > 0) {
        Log.warning("The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly.");
      }
      //if the chart has dynamic measures, but with no other custom aggregate measures then consider the dynamic measures
      if ((_this$chartAnnotation7 = _this.chartAnnotation) !== null && _this$chartAnnotation7 !== void 0 && _this$chartAnnotation7.DynamicMeasures) {
        if (custAggMeasure.length === 0) {
          measure = converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(_this.chartAnnotation.DynamicMeasures[0].value)).getDataModelObjectPath().targetObject.Name;
          aggregations = aggregationHelper.getAggregatedProperties("AggregatedProperty");
        } else {
          Log.warning("The dynamic measures have been ignored as visual filters can deal with only 1 measure and the first (custom aggregate) measure defined under Chart.Measures is considered.");
        }
      }
      if (customAggregates.some(function (custAgg) {
        return custAgg.qualifier === measure;
      })) {
        _this.customAggregate = true;
      }
      const defaultSelectionVariant = getDefaultSelectionVariant(converterContext.getEntityType());
      _this.checkSelectionVariant(defaultSelectionVariant);
      const aggregation = _this.getAggregateProperties(aggregations, measure);
      if (aggregation) {
        _this.aggregateProperties = aggregation;
      }
      const propertyAnnotations = visualizations && ((_visualizations$ = visualizations[0]) === null || _visualizations$ === void 0 ? void 0 : (_visualizations$$$tar = _visualizations$.$target) === null || _visualizations$$$tar === void 0 ? void 0 : _visualizations$$$tar.Measures) && ((_visualizations$2 = visualizations[0]) === null || _visualizations$2 === void 0 ? void 0 : (_visualizations$2$$ta = _visualizations$2.$target) === null || _visualizations$2$$ta === void 0 ? void 0 : (_visualizations$2$$ta2 = _visualizations$2$$ta.Measures[0]) === null || _visualizations$2$$ta2 === void 0 ? void 0 : (_visualizations$2$$ta3 = _visualizations$2$$ta2.$target) === null || _visualizations$2$$ta3 === void 0 ? void 0 : _visualizations$2$$ta3.annotations);
      const aggregatablePropertyAnnotations = aggregation === null || aggregation === void 0 ? void 0 : (_aggregation$Aggregat = aggregation.AggregatableProperty) === null || _aggregation$Aggregat === void 0 ? void 0 : (_aggregation$Aggregat2 = _aggregation$Aggregat.$target) === null || _aggregation$Aggregat2 === void 0 ? void 0 : _aggregation$Aggregat2.annotations;
      _this.checkIfUOMHasCustomAggregate(customAggregates, propertyAnnotations, aggregatablePropertyAnnotations);
      const propertyHidden = propertyAnnotations === null || propertyAnnotations === void 0 ? void 0 : (_propertyAnnotations$ = propertyAnnotations.UI) === null || _propertyAnnotations$ === void 0 ? void 0 : _propertyAnnotations$.Hidden;
      const aggregatablePropertyHidden = aggregatablePropertyAnnotations === null || aggregatablePropertyAnnotations === void 0 ? void 0 : (_aggregatableProperty = aggregatablePropertyAnnotations.UI) === null || _aggregatableProperty === void 0 ? void 0 : _aggregatableProperty.Hidden;
      const hiddenMeasure = _this.getHiddenMeasure(propertyHidden, aggregatablePropertyHidden, _this.customAggregate);
      const chartType = (_this$chartAnnotation8 = _this.chartAnnotation) === null || _this$chartAnnotation8 === void 0 ? void 0 : _this$chartAnnotation8.ChartType;
      _this.chartType = chartType;
      _this.showValueHelp = _this.getShowValueHelp(chartType, hiddenMeasure);
      _this.draftSupported = ModelHelper.isDraftSupported(mSettings.models.metaModel, (_this$contextPath = _this.contextPath) === null || _this$contextPath === void 0 ? void 0 : _this$contextPath.getPath());
      /**
       * If the measure of the chart is marked as 'hidden', or if the chart type is invalid, or if the data type for the line chart is invalid,
       * the call is made to the InteractiveChartWithError fragment (using error-message related APIs, but avoiding batch calls)
       */
      _this.errorMessage = _this.getErrorMessage(hiddenMeasure, measure);
      _this.chartMeasure = measure;
      _this.measureDimensionTitle = InteractiveChartHelper.getMeasureDimensionTitle(_this.chartAnnotation, _this.customAggregate, _this.aggregateProperties);
      const collection = getInvolvedDataModelObjects(_this.contextPath);
      _this.toolTip = InteractiveChartHelper.getToolTip(_this.chartAnnotation, collection, _this.path, _this.customAggregate, _this.aggregateProperties, _this.renderLineChart);
      _this.UoMVisibility = InteractiveChartHelper.getUoMVisiblity(_this.chartAnnotation, _this.showError);
      _this.scaleUoMTitle = InteractiveChartHelper.getScaleUoMTitle(_this.chartAnnotation, collection, _this.path, _this.customAggregate, _this.aggregateProperties);
      _this.filterCountBinding = InteractiveChartHelper.getfilterCountBinding(_this.chartAnnotation);
      return _this;
    }
    _exports = VisualFilterBlock;
    var _proto = VisualFilterBlock.prototype;
    _proto.checkIfUOMHasCustomAggregate = function checkIfUOMHasCustomAggregate(customAggregates, propertyAnnotations, aggregatablePropertyAnnotations) {
      const measures = propertyAnnotations === null || propertyAnnotations === void 0 ? void 0 : propertyAnnotations.Measures;
      const aggregatablePropertyMeasures = aggregatablePropertyAnnotations === null || aggregatablePropertyAnnotations === void 0 ? void 0 : aggregatablePropertyAnnotations.Measures;
      const UOM = this.getUoM(measures, aggregatablePropertyMeasures);
      if (UOM && customAggregates.some(function (custAgg) {
        return custAgg.qualifier === UOM;
      })) {
        this.UoMHasCustomAggregate = true;
      } else {
        this.UoMHasCustomAggregate = false;
      }
    };
    _proto.getChartAnnotation = function getChartAnnotation(visualizations, converterContext) {
      if (visualizations) {
        for (let i = 0; i < visualizations.length; i++) {
          const sAnnotationPath = visualizations[i] && visualizations[i].value;
          this.chartAnnotation = converterContext.getEntityTypeAnnotation(sAnnotationPath) && converterContext.getEntityTypeAnnotation(sAnnotationPath).annotation;
        }
      }
    };
    _proto.getErrorMessage = function getErrorMessage(hiddenMeasure, measure) {
      let validChartType;
      if (this.chartAnnotation) {
        if (this.chartAnnotation.ChartType === "UI.ChartType/Line" || this.chartAnnotation.ChartType === "UI.ChartType/Bar") {
          validChartType = true;
        } else {
          validChartType = false;
        }
      }
      if (typeof hiddenMeasure === "boolean" && hiddenMeasure || !validChartType || this.renderLineChart === "false") {
        this.showError = true;
        this.errorMessageTitle = hiddenMeasure || !validChartType ? this.getTranslatedText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE") : this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_INVALID_DATATYPE");
        if (hiddenMeasure) {
          return this.getTranslatedText("M_VISUAL_FILTER_HIDDEN_MEASURE", [measure]);
        } else if (!validChartType) {
          return this.getTranslatedText("M_VISUAL_FILTER_UNSUPPORTED_CHART_TYPE");
        } else {
          return this.getTranslatedText("M_VISUAL_FILTER_LINE_CHART_UNSUPPORTED_DIMENSION");
        }
      }
    };
    _proto.getShowValueHelp = function getShowValueHelp(chartType, hiddenMeasure) {
      var _this$chartAnnotation9, _this$chartAnnotation10;
      const sDimensionType = ((_this$chartAnnotation9 = this.chartAnnotation) === null || _this$chartAnnotation9 === void 0 ? void 0 : _this$chartAnnotation9.Dimensions[0]) && ((_this$chartAnnotation10 = this.chartAnnotation) === null || _this$chartAnnotation10 === void 0 ? void 0 : _this$chartAnnotation10.Dimensions[0].$target) && this.chartAnnotation.Dimensions[0].$target.type;
      if (sDimensionType === "Edm.Date" || sDimensionType === "Edm.Time" || sDimensionType === "Edm.DateTimeOffset") {
        return false;
      } else if (typeof hiddenMeasure === "boolean" && hiddenMeasure) {
        return false;
      } else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
        return false;
      } else if (this.renderLineChart === "false" && chartType === "UI.ChartType/Line") {
        return false;
      } else if (this.isValueListWithFixedValues === true) {
        return false;
      } else {
        return true;
      }
    };
    _proto.checkSelectionVariant = function checkSelectionVariant(defaultSelectionVariant) {
      let selectionVariant;
      if (this.selectionVariantAnnotation) {
        var _this$metaPath2;
        const selectionVariantContext = (_this$metaPath2 = this.metaPath) === null || _this$metaPath2 === void 0 ? void 0 : _this$metaPath2.getModel().createBindingContext(this.selectionVariantAnnotation.getPath());
        selectionVariant = selectionVariantContext && getInvolvedDataModelObjects(selectionVariantContext, this.contextPath).targetObject;
      }
      if (!selectionVariant && defaultSelectionVariant) {
        selectionVariant = defaultSelectionVariant;
      }
      if (selectionVariant && selectionVariant.SelectOptions && !this.multipleSelectionAllowed) {
        for (const selectOption of selectionVariant.SelectOptions) {
          var _this$chartAnnotation11;
          if (selectOption.PropertyName.value === ((_this$chartAnnotation11 = this.chartAnnotation) === null || _this$chartAnnotation11 === void 0 ? void 0 : _this$chartAnnotation11.Dimensions[0].value)) {
            if (selectOption.Ranges.length > 1) {
              Log.error("Multiple SelectOptions for FilterField having SingleValue Allowed Expression");
            }
          }
        }
      }
    };
    _proto.getAggregateProperties = function getAggregateProperties(aggregations, measure) {
      let matchedAggregate;
      if (!aggregations) {
        return;
      }
      aggregations.some(function (aggregate) {
        if (aggregate.Name === measure) {
          matchedAggregate = aggregate;
          return true;
        }
      });
      return matchedAggregate;
    };
    _proto.getUoM = function getUoM(measures, aggregatablePropertyMeasures) {
      var _ISOCurrency, _unit;
      let ISOCurrency = measures === null || measures === void 0 ? void 0 : measures.ISOCurrency;
      let unit = measures === null || measures === void 0 ? void 0 : measures.Unit;
      if (!ISOCurrency && !unit && aggregatablePropertyMeasures) {
        ISOCurrency = aggregatablePropertyMeasures.ISOCurrency;
        unit = aggregatablePropertyMeasures.Unit;
      }
      return ((_ISOCurrency = ISOCurrency) === null || _ISOCurrency === void 0 ? void 0 : _ISOCurrency.path) || ((_unit = unit) === null || _unit === void 0 ? void 0 : _unit.path);
    };
    _proto.getHiddenMeasure = function getHiddenMeasure(propertyHidden, aggregatablePropertyHidden, customAggregate) {
      if (!customAggregate && aggregatablePropertyHidden) {
        return aggregatablePropertyHidden.valueOf();
      } else {
        return propertyHidden === null || propertyHidden === void 0 ? void 0 : propertyHidden.valueOf();
      }
    };
    _proto.getRequired = function getRequired() {
      if (this.required) {
        return xml`<Label text="" width="0.5rem" required="true">
							<layoutData>
								<OverflowToolbarLayoutData priority="Never" />
							</layoutData>
						</Label>`;
      } else {
        return "";
      }
    };
    _proto.getUoMTitle = function getUoMTitle(showErrorExpression) {
      if (this.UoMVisibility) {
        return xml`<Title
							id="${generate([this.id, "ScaleUoMTitle"])}"
							visible="{= !${showErrorExpression}}"
							text="${this.scaleUoMTitle}"
							titleStyle="H6"
							level="H3"
							width="4.15rem"
						/>`;
      } else {
        return "";
      }
    };
    _proto.getValueHelp = function getValueHelp(showErrorExpression) {
      if (this.showValueHelp) {
        return xml`<ToolbarSpacer />
						<Button
							id="${generate([this.id, "VisualFilterValueHelpButton"])}"
							type="Transparent"
							ariaHasPopup="Dialog"
							text="${this.filterCountBinding}"
							press="VisualFilterRuntime.fireValueHelp"
							enabled="{= !${showErrorExpression}}"
							customData:multipleSelectionAllowed="${this.multipleSelectionAllowed}"
						>
							<layoutData>
								<OverflowToolbarLayoutData priority="Never" />
							</layoutData>
						</Button>`;
      } else {
        return "";
      }
    };
    _proto.getInteractiveChartFragment = function getInteractiveChartFragment() {
      if (this.showError) {
        return getInteractiveChartWithErrorTemplate(this);
      } else if (this.chartType === "UI.ChartType/Bar") {
        return getInteractiveBarChartTemplate(this);
      } else if (this.chartType === "UI.ChartType/Line") {
        return getInteractiveLineChartTemplate(this);
      }
      return "";
    };
    _proto.getTemplate = function getTemplate() {
      const id = generate([this.path]);
      const showErrorExpression = "${internal>" + id + "/showError}";
      return xml`
		<control:VisualFilter
		core:require="{VisualFilterRuntime: 'sap/fe/macros/visualfilters/VisualFilterRuntime'}"
		xmlns="sap.m"
		xmlns:control="sap.fe.core.controls.filterbar"
		xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
		xmlns:core="sap.ui.core"
		id="${this.id}"
		height="13rem"
		width="20.5rem"
		class="sapUiSmallMarginBeginEnd"
		customData:infoPath="${generate([this.path])}"
	>
		<VBox height="2rem" class="sapUiSmallMarginBottom">
			<OverflowToolbar style="Clear">
				${this.getRequired()}
				<Title
					id="${generate([this.id, "MeasureDimensionTitle"])}"
					text="${this.measureDimensionTitle}"
					tooltip="${this.toolTip}"
					titleStyle="H6"
					level="H3"
					class="sapUiTinyMarginEnd sapUiNoMarginBegin"
				/>
				${this.getUoMTitle(showErrorExpression)}
				${this.getValueHelp(showErrorExpression)}
			</OverflowToolbar>
		</VBox>
		<VBox height="100%" width="100%">
			${this.getInteractiveChartFragment()}
		</VBox>
	</control:VisualFilter>`;
    };
    return VisualFilterBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "outParameter", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "valuelistProperty", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "selectionVariantAnnotation", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "inParameters", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "multipleSelectionAllowed", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "showOverlayInitially", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "renderLineChart", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "requiredProperties", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "filterBarEntityType", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "showError", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "chartMeasure", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "UoMHasCustomAggregate", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "showValueHelp", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "customAggregate", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "groupId", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "$auto.visualFilters";
    }
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "errorMessageTitle", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "errorMessage", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "draftSupported", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "isValueListWithFixedValues", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = VisualFilterBlock;
  return _exports;
}, false);
