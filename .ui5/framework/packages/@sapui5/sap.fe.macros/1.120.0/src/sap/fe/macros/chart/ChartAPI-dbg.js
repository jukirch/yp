/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/HookSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ClassSupport", "sap/fe/macros/MacroAPI", "sap/fe/macros/chart/ChartRuntime", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/ui/model/Filter", "../insights/AnalyticalInsightsHelper", "../insights/CommonInsightsHelper", "../insights/InsightsService"], function (Log, merge, CommonUtils, HookSupport, MetaModelConverter, ClassSupport, MacroAPI, ChartRuntime, ChartUtils, FilterUtils, Filter, AnalyticalInsightsHelper, CommonInsightsHelper, InsightsService) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var showInsightsCardPreview = InsightsService.showInsightsCardPreview;
  var showCollaborationManagerCardPreview = InsightsService.showCollaborationManagerCardPreview;
  var getCardManifest = InsightsService.getCardManifest;
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  var hasInsightActionEnabled = CommonInsightsHelper.hasInsightActionEnabled;
  var createChartCardParams = AnalyticalInsightsHelper.createChartCardParams;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Building block used to create a chart based on the metadata provided by OData V4.
   * <br>
   * Usually, a contextPath and metaPath is expected.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Chart id="Mychart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.Chart
   * @public
   */
  let ChartAPI = (_dec = defineUI5Class("sap.fe.macros.chart.ChartAPI", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string",
    required: true,
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.Chart"]
  }), _dec4 = property({
    type: "string",
    required: true,
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: []
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean",
    defaultValue: true
  }), _dec7 = property({
    type: "string",
    defaultValue: "Multiple",
    allowedValues: ["None", "Single", "Multiple"]
  }), _dec8 = property({
    type: "string"
  }), _dec9 = property({
    type: "string",
    allowedValues: ["Control"]
  }), _dec10 = property({
    type: "boolean | string",
    defaultValue: true
  }), _dec11 = property({
    type: "string[]",
    defaultValue: []
  }), _dec12 = aggregation({
    type: "sap.fe.macros.chart.Action",
    multiple: true
  }), _dec13 = event(), _dec14 = event(), _dec15 = event(), _dec16 = xmlEventHandler(), _dec17 = xmlEventHandler(), _dec18 = controllerExtensionHandler("collaborationManager", "collectAvailableCards"), _dec19 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(ChartAPI, _MacroAPI);
    function ChartAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "header", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerVisible", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionMode", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBar", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantManagement", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "personalization", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "prevDrillStack", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actions", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionChange", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalDataRequested", _descriptor14, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = ChartAPI.prototype;
    /**
     * Gets contexts from the chart that have been selected by the user.
     *
     * @returns Contexts of the rows selected by the user
     * @public
     */
    _proto.getSelectedContexts = function getSelectedContexts() {
      var _this$content, _this$content$getBind;
      return ((_this$content = this.content) === null || _this$content === void 0 ? void 0 : (_this$content$getBind = _this$content.getBindingContext("internal")) === null || _this$content$getBind === void 0 ? void 0 : _this$content$getBind.getProperty("selectedContexts")) || [];
    }

    /**
     * An event triggered when chart selections are changed. The event contains information about the data selected/deselected and the Boolean flag that indicates whether data is selected or deselected.
     *
     * @public
     */;
    _proto.onAfterRendering = function onAfterRendering() {
      const view = this.getController().getView();
      const internalModelContext = view.getBindingContext("internal");
      const chart = this.getContent();
      const showMessageStrip = {};
      const sChartEntityPath = chart.data("entitySet"),
        sCacheKey = `${sChartEntityPath}Chart`,
        oBindingContext = view.getBindingContext();
      showMessageStrip[sCacheKey] = chart.data("draftSupported") === "true" && !!oBindingContext && !oBindingContext.getObject("IsActiveEntity");
      internalModelContext.setProperty("controls/showMessageStrip", showMessageStrip);
    };
    _proto.refreshNotApplicableFields = function refreshNotApplicableFields(oFilterControl) {
      const oChart = this.getContent();
      return FilterUtils.getNotApplicableFilters(oFilterControl, oChart);
    };
    _proto.handleSelectionChange = function handleSelectionChange(oEvent) {
      const aData = oEvent.getParameter("data");
      const bSelected = oEvent.getParameter("name") === "selectData";
      ChartRuntime.fnUpdateChart(oEvent);
      this.fireSelectionChange(merge({}, {
        data: aData,
        selected: bSelected
      }));
    };
    _proto.onInternalDataRequested = function onInternalDataRequested() {
      this.fireEvent("internalDataRequested");
    };
    _proto.collectAvailableCards = function collectAvailableCards(cards) {
      const actionToolbarItems = this.content.getActions();
      if (hasInsightActionEnabled(actionToolbarItems)) {
        cards.push((async () => {
          const card = await this.getCardManifestChart();
          return {
            card: card,
            title: this.getChartControl().getHeader(),
            callback: this.onAddCardToCollaborationManagerCallback.bind(this)
          };
        })());
      }
    };
    _proto.hasSelections = function hasSelections() {
      // consider chart selections in the current drill stack or on any further drill downs
      const mdcChart = this.content;
      if (mdcChart) {
        try {
          var _mdcChart$getControlD;
          const chart = (_mdcChart$getControlD = mdcChart.getControlDelegate()) === null || _mdcChart$getControlD === void 0 ? void 0 : _mdcChart$getControlD.getInnerChart(mdcChart);
          if (chart) {
            const aDimensions = ChartUtils.getDimensionsFromDrillStack(chart);
            const bIsDrillDown = aDimensions.length > this.prevDrillStack.length;
            const bIsDrillUp = aDimensions.length < this.prevDrillStack.length;
            const bNoChange = aDimensions.toString() === this.prevDrillStack.toString();
            let aFilters;
            if (bIsDrillUp && aDimensions.length === 1) {
              // drilling up to level0 would clear all selections
              aFilters = ChartUtils.getChartSelections(mdcChart, true);
            } else {
              // apply filters of selections of previous drillstack when drilling up/down
              // to the chart and table
              aFilters = ChartUtils.getChartSelections(mdcChart);
            }
            if (bIsDrillDown || bIsDrillUp) {
              // update the drillstack on a drill up/ drill down
              this.prevDrillStack = aDimensions;
              return aFilters.length > 0;
            } else if (bNoChange) {
              // bNoChange is true when chart is selected
              return aFilters.length > 0;
            }
          }
        } catch (err) {
          Log.error(`Error while checking for selections in Chart: ${err}`);
        }
      }
      return false;
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for charts.
     *
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToInsightsPressed = async function onAddCardToInsightsPressed() {
      try {
        const insightsParams = await createChartCardParams(this);
        if (insightsParams) {
          showInsightsCardPreview(insightsParams);
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    }

    /**
     * Gets the card manifest optimized for the chart case.
     *
     * @returns Promise of CardManifest
     */;
    _proto.getCardManifestChart = async function getCardManifestChart() {
      const insightsParams = await createChartCardParams(this);
      return getCardManifest(insightsParams);
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     *
     * @param card The card manifest to be used for the callback
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToCollaborationManagerCallback = async function onAddCardToCollaborationManagerCallback(card) {
      try {
        if (card) {
          await showCollaborationManagerCardPreview(card, this.getController().collaborationManager.getService());
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    }

    /**
     * Gets the filters related to the chart.
     *
     * @returns  The filter configured on the chart or undefined if none
     */;
    _proto.getFilter = function getFilter() {
      const chartFilterInfo = ChartUtils.getAllFilterInfo(this.content);
      if (chartFilterInfo.filters.length) {
        chartFilterInfo.filters = CommonUtils.getChartPropertiesWithoutPrefixes(chartFilterInfo.filters);
        return new Filter({
          filters: chartFilterInfo.filters,
          and: true
        });
      }
      return undefined;
    }

    /**
     * Gets the chart control from the Chart API.
     *
     * @returns The Chart control inside the Chart API
     */;
    _proto.getChartControl = function getChartControl() {
      return this.content;
    }

    /**
     * Gets the datamodel object path for the dimension.
     *
     * @param dimensionName  Name of the dimension
     * @returns The datamodel object path for the dimension
     */;
    _proto.getDimensionDataModel = function getDimensionDataModel(dimensionName) {
      const metaPath = this.content.data("targetCollectionPath");
      const metaModel = this.content.getModel().getMetaModel();
      const dimensionContext = metaModel.createBindingContext(`${metaPath}/${dimensionName}`);
      return getInvolvedDataModelObjects(dimensionContext);
    };
    return ChartAPI;
  }(MacroAPI), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "prevDrillStack", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "internalDataRequested", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "handleSelectionChange", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "handleSelectionChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataRequested", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataRequested"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectAvailableCards", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "collectAvailableCards"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAddCardToInsightsPressed", [_dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "onAddCardToInsightsPressed"), _class2.prototype)), _class2)) || _class);
  return ChartAPI;
}, false);
