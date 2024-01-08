/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ClassSupport", "sap/fe/macros/library", "sap/m/FlexBox", "sap/m/Label", "sap/m/library", "sap/suite/ui/microchart/AreaMicroChart", "sap/suite/ui/microchart/ColumnMicroChart", "sap/suite/ui/microchart/ComparisonMicroChart", "sap/suite/ui/microchart/LineMicroChart", "sap/ui/core/Control", "sap/ui/core/format/NumberFormat", "sap/ui/model/odata/v4/ODataListBinding", "sap/ui/model/odata/v4/ODataMetaModel", "sap/ui/model/type/Date"], function (Log, ClassSupport, macroLib, FlexBox, Label, mobilelibrary, AreaMicroChart, ColumnMicroChart, ComparisonMicroChart, LineMicroChart, Control, NumberFormat, ODataV4ListBinding, ODataMetaModel, DateType) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const NavigationType = macroLib.NavigationType;
  const ValueColor = mobilelibrary.ValueColor;
  /**
   *  Container Control for Micro Chart and UoM.
   *
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  let MicroChartContainer = (_dec = defineUI5Class("sap.fe.macros.microchart.MicroChartContainer"), _dec2 = property({
    type: "boolean",
    defaultValue: false
  }), _dec3 = property({
    type: "string",
    defaultValue: undefined
  }), _dec4 = property({
    type: "string[]",
    defaultValue: []
  }), _dec5 = property({
    type: "string",
    defaultValue: undefined
  }), _dec6 = property({
    type: "string[]",
    defaultValue: []
  }), _dec7 = property({
    type: "int",
    defaultValue: undefined
  }), _dec8 = property({
    type: "int",
    defaultValue: 1
  }), _dec9 = property({
    type: "int",
    defaultValue: undefined
  }), _dec10 = property({
    type: "string",
    defaultValue: ""
  }), _dec11 = property({
    type: "string",
    defaultValue: ""
  }), _dec12 = property({
    type: "sap.fe.macros.NavigationType",
    defaultValue: "None"
  }), _dec13 = property({
    type: "string",
    defaultValue: ""
  }), _dec14 = event(), _dec15 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec16 = aggregation({
    type: "sap.m.Label",
    multiple: false
  }), _dec17 = aggregation({
    type: "sap.ui.core.Control",
    multiple: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    _inheritsLoose(MicroChartContainer, _Control);
    function MicroChartContainer() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Control.call(this, ...args) || this;
      _initializerDefineProperty(_this, "showOnlyChart", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "uomPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "measures", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dimension", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataPointQualifiers", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "measurePrecision", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "measureScale", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dimensionPrecision", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartTitle", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartDescription", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationType", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "calendarPattern", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onTitlePressed", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "microChart", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_uomLabel", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "microChartTitle", _descriptor16, _assertThisInitialized(_this));
      return _this;
    }
    MicroChartContainer.render = function render(renderManager, control) {
      renderManager.openStart("div", control);
      renderManager.openEnd();
      if (!control.showOnlyChart) {
        const chartTitle = control.microChartTitle;
        if (chartTitle) {
          chartTitle.forEach(function (subChartTitle) {
            renderManager.openStart("div");
            renderManager.openEnd();
            renderManager.renderControl(subChartTitle);
            renderManager.close("div");
          });
        }
        renderManager.openStart("div");
        renderManager.openEnd();
        const chartDescription = new Label({
          text: control.chartDescription
        });
        renderManager.renderControl(chartDescription);
        renderManager.close("div");
      }
      const microChart = control.microChart;
      if (microChart) {
        microChart.addStyleClass("sapUiTinyMarginTopBottom");
        renderManager.renderControl(microChart);
        if (!control.showOnlyChart && control.uomPath) {
          const settings = control._checkIfChartRequiresRuntimeLabels() ? undefined : {
              text: {
                path: control.uomPath
              }
            },
            label = new Label(settings),
            flexBox = new FlexBox({
              alignItems: "Start",
              justifyContent: "End",
              items: [label]
            });
          renderManager.renderControl(flexBox);
          control.setAggregation("_uomLabel", label);
        }
      }
      renderManager.close("div");
    };
    var _proto = MicroChartContainer.prototype;
    _proto.onBeforeRendering = function onBeforeRendering() {
      const binding = this._getListBindingForRuntimeLabels();
      if (binding) {
        binding.detachEvent("change", this._setRuntimeChartLabelsAndUnitOfMeasure, this);
        this._olistBinding = undefined;
      }
    };
    _proto.onAfterRendering = function onAfterRendering() {
      const binding = this._getListBindingForRuntimeLabels();
      if (!this._checkIfChartRequiresRuntimeLabels()) {
        return;
      }
      if (binding) {
        binding.attachEvent("change", this._setRuntimeChartLabelsAndUnitOfMeasure, this);
        this._olistBinding = binding;
      }
    };
    _proto.setShowOnlyChart = function setShowOnlyChart(value) {
      if (!value && this._olistBinding) {
        this._setChartLabels();
      }
      this.setProperty("showOnlyChart", value, false /*re-rendering*/);
    };
    _proto._checkIfChartRequiresRuntimeLabels = function _checkIfChartRequiresRuntimeLabels() {
      const microChart = this.microChart;
      return Boolean(microChart instanceof AreaMicroChart || microChart instanceof ColumnMicroChart || microChart instanceof LineMicroChart || microChart instanceof ComparisonMicroChart);
    };
    _proto._checkForChartLabelAggregations = function _checkForChartLabelAggregations() {
      const microChart = this.microChart;
      return Boolean(microChart instanceof AreaMicroChart && microChart.getAggregation("firstYLabel") && microChart.getAggregation("lastYLabel") && microChart.getAggregation("firstXLabel") && microChart.getAggregation("lastXLabel") || microChart instanceof ColumnMicroChart && microChart.getAggregation("leftTopLabel") && microChart.getAggregation("rightTopLabel") && microChart.getAggregation("leftBottomLabel") && microChart.getAggregation("rightBottomLabel") || microChart instanceof LineMicroChart);
    };
    _proto._getListBindingForRuntimeLabels = function _getListBindingForRuntimeLabels() {
      const microChart = this.microChart;
      let binding;
      if (microChart instanceof AreaMicroChart) {
        const chart = microChart.getChart();
        binding = chart && chart.getBinding("points");
      } else if (microChart instanceof ColumnMicroChart) {
        binding = microChart.getBinding("columns");
      } else if (microChart instanceof LineMicroChart) {
        const lines = microChart.getLines();
        binding = lines && lines.length && lines[0].getBinding("points");
      } else if (microChart instanceof ComparisonMicroChart) {
        binding = microChart.getBinding("data");
      }
      return binding instanceof ODataV4ListBinding ? binding : false;
    };
    _proto._setRuntimeChartLabelsAndUnitOfMeasure = async function _setRuntimeChartLabelsAndUnitOfMeasure() {
      const listBinding = this._olistBinding,
        contexts = listBinding === null || listBinding === void 0 ? void 0 : listBinding.getContexts(),
        measures = this.measures,
        dimension = this.dimension,
        unitOfMeasurePath = this.uomPath,
        microChart = this.microChart,
        unitOfMeasureLabel = this._uomLabel;
      if (unitOfMeasureLabel && unitOfMeasurePath && contexts && contexts.length && !this.showOnlyChart) {
        unitOfMeasureLabel.setText(contexts[0].getObject(unitOfMeasurePath));
      } else if (unitOfMeasureLabel) {
        unitOfMeasureLabel.setText("");
      }
      if (!this._checkForChartLabelAggregations()) {
        return;
      }
      if (!contexts || !contexts.length) {
        this._setChartLabels();
        return;
      }
      const firstContext = contexts[0],
        lastContext = contexts[contexts.length - 1],
        linesPomises = [],
        lineChart = microChart instanceof LineMicroChart,
        currentMinX = firstContext.getObject(dimension),
        currentMaxX = lastContext.getObject(dimension);
      let currentMinY,
        currentMaxY,
        minX = {
          value: Infinity
        },
        maxX = {
          value: -Infinity
        },
        minY = {
          value: Infinity
        },
        maxY = {
          value: -Infinity
        };
      minX = currentMinX == undefined ? minX : {
        context: firstContext,
        value: currentMinX
      };
      maxX = currentMaxX == undefined ? maxX : {
        context: lastContext,
        value: currentMaxX
      };
      if (measures !== null && measures !== void 0 && measures.length) {
        measures.forEach((measure, i) => {
          currentMinY = firstContext.getObject(measure);
          currentMaxY = lastContext.getObject(measure);
          maxY = currentMaxY > maxY.value ? {
            context: lastContext,
            value: currentMaxY,
            index: lineChart ? i : 0
          } : maxY;
          minY = currentMinY < minY.value ? {
            context: firstContext,
            value: currentMinY,
            index: lineChart ? i : 0
          } : minY;
          if (lineChart) {
            linesPomises.push(this._getCriticalityFromPoint({
              context: lastContext,
              value: currentMaxY,
              index: i
            }));
          }
        });
      }
      this._setChartLabels(minY.value, maxY.value, minX.value, maxX.value);
      if (lineChart) {
        const colors = await Promise.all(linesPomises);
        if (colors !== null && colors !== void 0 && colors.length) {
          const lines = microChart.getLines();
          lines.forEach(function (line, i) {
            line.setColor(colors[i]);
          });
        }
      } else {
        await this._setChartLabelsColors(maxY, minY);
      }
    };
    _proto._setChartLabelsColors = async function _setChartLabelsColors(maxY, minY) {
      const microChart = this.microChart;
      const criticality = await Promise.all([this._getCriticalityFromPoint(minY), this._getCriticalityFromPoint(maxY)]);
      if (microChart instanceof AreaMicroChart) {
        microChart.getAggregation("firstYLabel").setProperty("color", criticality[0], true);
        microChart.getAggregation("lastYLabel").setProperty("color", criticality[1], true);
      } else if (microChart instanceof ColumnMicroChart) {
        microChart.getAggregation("leftTopLabel").setProperty("color", criticality[0], true);
        microChart.getAggregation("rightTopLabel").setProperty("color", criticality[1], true);
      }
    };
    _proto._setChartLabels = function _setChartLabels(leftTop, rightTop, leftBottom, rightBottom) {
      const microChart = this.microChart;
      leftTop = this._formatDateAndNumberValue(leftTop, this.measurePrecision, this.measureScale);
      rightTop = this._formatDateAndNumberValue(rightTop, this.measurePrecision, this.measureScale);
      leftBottom = this._formatDateAndNumberValue(leftBottom, this.dimensionPrecision, undefined, this.calendarPattern);
      rightBottom = this._formatDateAndNumberValue(rightBottom, this.dimensionPrecision, undefined, this.calendarPattern);
      if (microChart instanceof AreaMicroChart) {
        microChart.getAggregation("firstYLabel").setProperty("label", leftTop, false);
        microChart.getAggregation("lastYLabel").setProperty("label", rightTop, false);
        microChart.getAggregation("firstXLabel").setProperty("label", leftBottom, false);
        microChart.getAggregation("lastXLabel").setProperty("label", rightBottom, false);
      } else if (microChart instanceof ColumnMicroChart) {
        microChart.getAggregation("leftTopLabel").setProperty("label", leftTop, false);
        microChart.getAggregation("rightTopLabel").setProperty("label", rightTop, false);
        microChart.getAggregation("leftBottomLabel").setProperty("label", leftBottom, false);
        microChart.getAggregation("rightBottomLabel").setProperty("label", rightBottom, false);
      } else if (microChart instanceof LineMicroChart) {
        microChart.setProperty("leftTopLabel", leftTop, false);
        microChart.setProperty("rightTopLabel", rightTop, false);
        microChart.setProperty("leftBottomLabel", leftBottom, false);
        microChart.setProperty("rightBottomLabel", rightBottom, false);
      }
    };
    _proto._getCriticalityFromPoint = async function _getCriticalityFromPoint(point) {
      if (point !== null && point !== void 0 && point.context) {
        const metaModel = this.getModel() && this.getModel().getMetaModel(),
          dataPointQualifiers = this.dataPointQualifiers,
          metaPath = metaModel instanceof ODataMetaModel && point.context.getPath() && metaModel.getMetaPath(point.context.getPath());
        if (metaModel && typeof metaPath === "string") {
          const dataPoint = await metaModel.requestObject(`${metaPath}/@${"com.sap.vocabularies.UI.v1.DataPoint"}${point.index !== undefined && dataPointQualifiers[point.index] ? `#${dataPointQualifiers[point.index]}` : ""}`);
          if (dataPoint) {
            let criticality = ValueColor.Neutral;
            const context = point.context;
            if (dataPoint.Criticality) {
              criticality = this._criticality(dataPoint.Criticality, context);
            } else if (dataPoint.CriticalityCalculation) {
              const criticalityCalculation = dataPoint.CriticalityCalculation;
              const getValue = function (valueProperty) {
                let valueResponse;
                if (valueProperty !== null && valueProperty !== void 0 && valueProperty.$Path) {
                  valueResponse = context.getObject(valueProperty.$Path);
                } else if (valueProperty !== null && valueProperty !== void 0 && valueProperty.hasOwnProperty("$Decimal")) {
                  valueResponse = valueProperty.$Decimal;
                }
                return valueResponse;
              };
              criticality = this._criticalityCalculation(criticalityCalculation.ImprovementDirection.$EnumMember, point.value, getValue(criticalityCalculation.DeviationRangeLowValue), getValue(criticalityCalculation.ToleranceRangeLowValue), getValue(criticalityCalculation.AcceptanceRangeLowValue), getValue(criticalityCalculation.AcceptanceRangeHighValue), getValue(criticalityCalculation.ToleranceRangeHighValue), getValue(criticalityCalculation.DeviationRangeHighValue));
            }
            return criticality;
          }
        }
      }
      return Promise.resolve(ValueColor.Neutral);
    };
    _proto._criticality = function _criticality(criticality, context) {
      let criticalityValue, result;
      if (criticality.$Path) {
        criticalityValue = context.getObject(criticality.$Path);
        if (criticalityValue === "Negative" || criticalityValue.toString() === "1") {
          result = ValueColor.Error;
        } else if (criticalityValue === "Critical" || criticalityValue.toString() === "2") {
          result = ValueColor.Critical;
        } else if (criticalityValue === "Positive" || criticalityValue.toString() === "3") {
          result = ValueColor.Good;
        }
      } else if (criticality.$EnumMember) {
        criticalityValue = criticality.$EnumMember;
        if (criticalityValue.indexOf("com.sap.vocabularies.UI.v1.CriticalityType/Negative") > -1) {
          result = ValueColor.Error;
        } else if (criticalityValue.indexOf("com.sap.vocabularies.UI.v1.CriticalityType/Positive") > -1) {
          result = ValueColor.Good;
        } else if (criticalityValue.indexOf("com.sap.vocabularies.UI.v1.CriticalityType/Critical") > -1) {
          result = ValueColor.Critical;
        }
      }
      if (result === undefined) {
        Log.warning("Case not supported, returning the default Value Neutral");
        return ValueColor.Neutral;
      }
      return result;
    };
    _proto._criticalityCalculation = function _criticalityCalculation(improvementDirection, value, deviationLow, toleranceLow, acceptanceLow, acceptanceHigh, toleranceHigh, deviationHigh) {
      let result;

      // Dealing with Decimal and Path based bingdings
      deviationLow = deviationLow == undefined ? -Infinity : deviationLow;
      toleranceLow = toleranceLow == undefined ? deviationLow : toleranceLow;
      acceptanceLow = acceptanceLow == undefined ? toleranceLow : acceptanceLow;
      deviationHigh = deviationHigh == undefined ? Infinity : deviationHigh;
      toleranceHigh = toleranceHigh == undefined ? deviationHigh : toleranceHigh;
      acceptanceHigh = acceptanceHigh == undefined ? toleranceHigh : acceptanceHigh;

      // Creating runtime expression binding from criticality calculation for Criticality State
      if (improvementDirection.includes("Minimize")) {
        if (value <= acceptanceHigh) {
          result = ValueColor.Good;
        } else if (value <= toleranceHigh) {
          result = ValueColor.Neutral;
        } else if (value <= deviationHigh) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      } else if (improvementDirection.includes("Maximize")) {
        if (value >= acceptanceLow) {
          result = ValueColor.Good;
        } else if (value >= toleranceLow) {
          result = ValueColor.Neutral;
        } else if (value >= deviationLow) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      } else if (improvementDirection.includes("Target")) {
        if (value <= acceptanceHigh && value >= acceptanceLow) {
          result = ValueColor.Good;
        } else if (value >= toleranceLow && value < acceptanceLow || value > acceptanceHigh && value <= toleranceHigh) {
          result = ValueColor.Neutral;
        } else if (value >= deviationLow && value < toleranceLow || value > toleranceHigh && value <= deviationHigh) {
          result = ValueColor.Critical;
        } else {
          result = ValueColor.Error;
        }
      }
      if (result === undefined) {
        Log.warning("Case not supported, returning the default Value Neutral");
        return ValueColor.Neutral;
      }
      return result;
    };
    _proto._formatDateAndNumberValue = function _formatDateAndNumberValue(value, precision, scale, pattern) {
      if (pattern) {
        return this._getSemanticsValueFormatter(pattern).formatValue(value, "string");
      } else if (!isNaN(value)) {
        return this._getLabelNumberFormatter(precision, scale).format(value);
      }
      return value;
    };
    _proto._getSemanticsValueFormatter = function _getSemanticsValueFormatter(pattern) {
      if (!this._oDateType) {
        this._oDateType = new DateType({
          style: "short",
          source: {
            pattern
          }
        });
      }
      return this._oDateType;
    };
    _proto._getLabelNumberFormatter = function _getLabelNumberFormatter(precision, scale) {
      return NumberFormat.getFloatInstance({
        style: "short",
        showScale: true,
        precision: typeof precision === "number" && precision || 0,
        decimals: typeof scale === "number" && scale || 0
      });
    };
    return MicroChartContainer;
  }(Control), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "showOnlyChart", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "uomPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "measures", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "dimension", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "dataPointQualifiers", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "measurePrecision", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "measureScale", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "dimensionPrecision", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "chartTitle", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "chartDescription", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "navigationType", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "calendarPattern", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "onTitlePressed", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "microChart", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "_uomLabel", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "microChartTitle", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return MicroChartContainer;
}, false);
