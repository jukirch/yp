/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/CommonHelper", "sap/ui/model/odata/v4/AnnotationHelper"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, BindingToolkit, UIFormatters, CommonHelper, AnnotationHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13;
  var _exports = {};
  var hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var equal = BindingToolkit.equal;
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
  let MicroChartBlock = (
  /**
   * Building block used to create a MicroChart based on the metadata provided by OData V4.
   *
   * @hideconstructor
   * @public
   * @since 1.93.0
   */
  _dec = defineBuildingBlock({
    name: "MicroChart",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.controls.ConditionalWrapper", "sap.fe.macros.microchart.MicroChartContainer"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    expectedTypes: ["EntitySet", "NavigationProperty"],
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec5 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "string"
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec9 = blockAttribute({
    type: "string"
  }), _dec10 = blockAttribute({
    type: "sap.fe.macros.NavigationType"
  }), _dec11 = blockAttribute({
    type: "function"
  }), _dec12 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec13 = blockAttribute({
    type: "boolean"
  }), _dec14 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(MicroChartBlock, _BuildingBlockBase);
    /**
     * ID of the MicroChart.
     */

    /**
     * Metadata path to the entitySet or navigationProperty.
     */

    /**
     * Metadata path to the Chart annotations.
     */

    /**
     * To control the rendering of Title, Subtitle and Currency Labels. When the size is xs then we do
     * not see the inner labels of the MicroChart as well.
     */

    /**
     * Batch group ID along with which this call should be grouped.
     */

    /**
     * Title for the MicroChart. If no title is provided, the title from the Chart annotation is used.
     */

    /**
     * Show blank space in case there is no data in the chart
     */

    /**
     * Description for the MicroChart. If no description is provided, the description from the Chart annotation is used.
     */

    /**
     * Type of navigation, that is, External or InPage
     */

    /**
     * Event handler for onTitlePressed event
     */

    /**
     * Size of the MicroChart
     */

    /**
     * Defines whether the MicroChart is part of an analytical table
     */

    /*
     * This is used in inner fragments, so we need to declare it as block attribute context.
     */

    function MicroChartBlock(props) {
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showOnlyChart", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "batchGroupId", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "title", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "hideOnNoData", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "description", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationType", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onTitlePressed", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "size", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isAnalytics", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "DataPoint", _descriptor13, _assertThisInitialized(_this));
      _this.metaPath = _this.metaPath.getModel().createBindingContext(AnnotationHelper.resolve$Path(_this.metaPath));
      const measureAttributePath = CommonHelper.getMeasureAttributeForMeasure(_this.metaPath.getModel().createBindingContext("Measures/0", _this.metaPath));
      if (measureAttributePath) {
        _this.DataPoint = _this.metaPath.getModel().createBindingContext(measureAttributePath);
      }
      return _this;
    }

    /**
     * Gets the content of the micro chart, i.e. a reference to the fragment for the given chart type.
     *
     * @returns XML string
     */
    _exports = MicroChartBlock;
    var _proto = MicroChartBlock.prototype;
    _proto.getMicroChartContent = function getMicroChartContent() {
      const convertedChart = convertMetaModelContext(this.metaPath);
      switch (convertedChart.ChartType) {
        case "UI.ChartType/Bullet":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.BulletMicroChart" type="XML" />`;
        case "UI.ChartType/Donut":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.RadialMicroChart" type="XML" />`;
        case "UI.ChartType/Pie":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.HarveyBallMicroChart" type="XML" />`;
        case "UI.ChartType/BarStacked":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.StackedBarMicroChart" type="XML" />`;
        case "UI.ChartType/Area":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.AreaMicroChart" type="XML" />`;
        case "UI.ChartType/Column":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.ColumnMicroChart" type="XML" />`;
        case "UI.ChartType/Line":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.LineMicroChart" type="XML" />`;
        case "UI.ChartType/Bar":
          return `<core:Fragment fragmentName="sap.fe.macros.microchart.fragments.ComparisonMicroChart" type="XML" />`;
        default:
          return `<m:Text text="This chart type is not supported. Other Types yet to be implemented.." />`;
      }
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string
     */;
    _proto.getTemplate = function getTemplate() {
      const dataPointValueObjects = getInvolvedDataModelObjects(this.metaPath.getModel().createBindingContext("Value/$Path", this.DataPoint), this.contextPath);
      const wrapperConditionBinding = hasValidAnalyticalCurrencyOrUnit(dataPointValueObjects);
      const wrapperVisibleBinding = or(not(pathInModel("@$ui5.node.isExpanded")), equal(pathInModel("@$ui5.node.level"), 0));
      if (this.isAnalytics) {
        return xml`<controls:ConditionalWrapper
				xmlns:controls="sap.fe.macros.controls"
				condition="${wrapperConditionBinding}"
				visible="${wrapperVisibleBinding}" >
				<controls:contentTrue>
					${this.getMicroChartContent()}
				</controls:contentTrue>
				<controls:contentFalse>
					<m:Text text="*" />
				</controls:contentFalse>
			</controls:ConditionalWrapper>`;
      } else {
        return this.getMicroChartContent();
      }
    };
    return MicroChartBlock;
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "showOnlyChart", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "batchGroupId", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "hideOnNoData", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "description", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "navigationType", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "None";
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "onTitlePressed", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "size", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "isAnalytics", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "DataPoint", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = MicroChartBlock;
  return _exports;
}, false);
