/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/uid", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/CommonHelper", "sap/ui/Device", "sap/ui/core/library", "sap/ui/model/json/JSONModel", "../internal/helpers/ActionHelper", "../internal/helpers/DefaultActionHandler", "./ChartHelper"], function (Log, uid, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, MetaModelConverter, DataField, DataVisualization, Aggregation, BindingToolkit, ModelHelper, StableIdHelper, DataModelPathHelper, CommonHelper, Device, library, JSONModel, ActionHelper, DefaultActionHandler, ChartHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _class3;
  var _exports = {};
  var TitleLevel = library.TitleLevel;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getVisualizationsFromPresentationVariant = DataVisualization.getVisualizationsFromPresentationVariant;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var isDataModelObjectPathForActionWithDialog = DataField.isDataModelObjectPathForActionWithDialog;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var escapeXMLAttributeValue = BuildingBlockTemplateProcessor.escapeXMLAttributeValue;
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
  const measureRole = {
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1": "axis1",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2": "axis2",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3": "axis3",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis4": "axis4"
  };
  var personalizationValues;
  /**
   * Build actions and action groups with all properties for chart visualization.
   *
   * @param childAction XML node corresponding to actions
   * @returns Prepared action object
   */
  (function (personalizationValues) {
    personalizationValues["Sort"] = "Sort";
    personalizationValues["Type"] = "Type";
    personalizationValues["Item"] = "Item";
    personalizationValues["Filter"] = "Filter";
  })(personalizationValues || (personalizationValues = {}));
  const setCustomActionProperties = function (childAction) {
    var _action$getAttribute;
    let menuContentActions = null;
    const action = childAction;
    let menuActions = [];
    const actionKey = (_action$getAttribute = action.getAttribute("key")) === null || _action$getAttribute === void 0 ? void 0 : _action$getAttribute.replace("InlineXML_", "");
    // For the actionGroup we authorize the both entries <sap.fe.macros:ActionGroup> (compliant with old FPM examples) and <sap.fe.macros.chart:ActionGroup>
    if (action.children.length && action.localName === "ActionGroup" && action.namespaceURI && ["sap.fe.macros", "sap.fe.macros.chart"].includes(action.namespaceURI)) {
      const actionsToAdd = Array.prototype.slice.apply(action.children);
      let actionIdx = 0;
      menuContentActions = actionsToAdd.reduce((customAction, actToAdd) => {
        var _actToAdd$getAttribut;
        const actionKeyAdd = ((_actToAdd$getAttribut = actToAdd.getAttribute("key")) === null || _actToAdd$getAttribut === void 0 ? void 0 : _actToAdd$getAttribut.replace("InlineXML_", "")) || actionKey + "_Menu_" + actionIdx;
        const curOutObject = {
          key: actionKeyAdd,
          text: actToAdd.getAttribute("text"),
          __noWrap: true,
          press: actToAdd.getAttribute("press"),
          requiresSelection: actToAdd.getAttribute("requiresSelection") === "true",
          enabled: actToAdd.getAttribute("enabled") === null ? true : actToAdd.getAttribute("enabled")
        };
        customAction[curOutObject.key] = curOutObject;
        actionIdx++;
        return customAction;
      }, {});
      menuActions = Object.values(menuContentActions).slice(-action.children.length).map(function (menuItem) {
        return menuItem.key;
      });
    }
    return {
      key: actionKey,
      text: action.getAttribute("text"),
      position: {
        placement: action.getAttribute("placement"),
        anchor: action.getAttribute("anchor")
      },
      __noWrap: true,
      press: action.getAttribute("press"),
      requiresSelection: action.getAttribute("requiresSelection") === "true",
      enabled: action.getAttribute("enabled") === null ? true : action.getAttribute("enabled"),
      menu: menuActions.length ? menuActions : null,
      menuContentActions: menuContentActions
    };
  };
  let ChartBlock = (
  /**
   *
   * Building block for creating a Chart based on the metadata provided by OData V4.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Chart id="MyChart" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
   * </pre>
   *
   * Building block for creating a Chart based on the metadata provided by OData V4.
   *
   * @private
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "Chart",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.chart.ChartAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "object"
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "string"
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec11 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec12 = blockAttribute({
    type: "string|boolean",
    isPublic: true
  }), _dec13 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec14 = blockAttribute({
    type: "string"
  }), _dec15 = blockAttribute({
    type: "string"
  }), _dec16 = blockAttribute({
    type: "string"
  }), _dec17 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec18 = blockAttribute({
    type: "boolean"
  }), _dec19 = blockAttribute({
    type: "boolean"
  }), _dec20 = blockAttribute({
    type: "string"
  }), _dec21 = blockAttribute({
    type: "string"
  }), _dec22 = blockAttribute({
    type: "string"
  }), _dec23 = blockAttribute({
    type: "string"
  }), _dec24 = blockAttribute({
    type: "boolean"
  }), _dec25 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec26 = blockEvent(), _dec27 = blockEvent(), _dec28 = blockAggregation({
    type: "sap.fe.macros.internal.chart.Action | sap.fe.macros.internal.chart.ActionGroup",
    isPublic: true,
    processAggregations: setCustomActionProperties
  }), _dec29 = blockEvent(), _dec30 = blockEvent(), _dec(_class = (_class2 = (_class3 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(ChartBlock, _BuildingBlockBase);
    /**
     * ID of the chart
     */

    /**
     * Metadata path to the presentation context (UI.Chart with or without a qualifier)
     */

    // We require metaPath to be there even though it is not formally required

    /**
     * Metadata path to the entitySet or navigationProperty
     */

    // We require contextPath to be there even though it is not formally required

    /**
     * The height of the chart
     */

    /**
     * The width of the chart
     */

    /**
     * Specifies the header text that is shown in the chart
     */

    /**
     * Specifies the visibility of the chart header
     */

    /**
     * Defines the "aria-level" of the chart header
     */

    /**
     * Specifies the selection mode
     */

    /**
     * Parameter which sets the personalization of the chart
     */

    /**
     * Parameter which sets the ID of the filterbar associating it to the chart
     */

    /**
     * 	Parameter which sets the noDataText for the chart
     */

    /**
     * Parameter which sets the chart delegate for the chart
     */

    /**
     * Parameter which sets the visualization properties for the chart
     */

    /**
     * The actions to be shown in the action area of the chart
     */

    /**
     * The XML and manifest actions to be shown in the action area of the chart
     */

    /**
     * An event triggered when chart selections are changed. The event contains information about the data selected/deselected and
     * the Boolean flag that indicates whether data is selected or deselected
     */

    /**
     * Event handler to react to the stateChange event of the chart.
     */

    function ChartBlock(_props, configuration, _settings) {
      var _this;
      _this = _BuildingBlockBase.call(this, _props, configuration, _settings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartDefinition", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "height", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "width", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "header", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerVisible", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerLevel", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionMode", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "personalization", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBar", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "noDataText", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartDelegate", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "vizProperties", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "chartActions", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "draftSupported", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "autoBindOnInit", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationPath", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filter", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "measures", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_applyIdToContent", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantManagement", _descriptor24, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantSelected", _descriptor25, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantSaved", _descriptor26, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actions", _descriptor27, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionChange", _descriptor28, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor29, _assertThisInitialized(_this));
      _this._commandActions = [];
      _this.createChartDefinition = (converterContext, contextObjectPath, controlPath) => {
        var _this$metaPath, _this$metaPath$getObj;
        let visualizationPath = getContextRelativeTargetObjectPath(contextObjectPath);
        if (((_this$metaPath = _this.metaPath) === null || _this$metaPath === void 0 ? void 0 : (_this$metaPath$getObj = _this$metaPath.getObject()) === null || _this$metaPath$getObj === void 0 ? void 0 : _this$metaPath$getObj.$Type) === "com.sap.vocabularies.UI.v1.PresentationVariantType") {
          const visualizations = _this.metaPath.getObject().Visualizations;
          visualizationPath = ChartBlock.checkChartVisualizationPath(visualizations, visualizationPath);
        }

        // fallback to default Chart if visualizationPath is missing or visualizationPath is not found in control (in case of PresentationVariant)
        if (!visualizationPath || !controlPath.includes(visualizationPath)) {
          visualizationPath = `@${"com.sap.vocabularies.UI.v1.Chart"}`;
        }
        const visualizationDefinition = getDataVisualizationConfiguration(visualizationPath, _this.useCondensedLayout, converterContext, undefined, undefined, undefined, true);
        return visualizationDefinition.visualizations[0];
      };
      _this.createBindingContext = function (data, settings) {
        const contextPath = `/${uid()}`;
        settings.models.converterContext.setProperty(contextPath, data);
        return settings.models.converterContext.createBindingContext(contextPath);
      };
      _this.getChartMeasures = (props, aggregationHelper) => {
        const chartAnnotationPath = props.chartDefinition.annotationPath.split("/");
        // this is required because getAbsolutePath in converterContext returns "/SalesOrderManage/_Item/_Item/@com.sap.vocabularies.v1.Chart" as annotationPath
        const annotationPath = chartAnnotationPath.filter(function (item, pos) {
          return chartAnnotationPath.indexOf(item) == pos;
        }).toString().replaceAll(",", "/");
        const oChart = getInvolvedDataModelObjects(_this.metaPath.getModel().createBindingContext(annotationPath), _this.contextPath).targetObject;
        const aggregatedProperty = aggregationHelper.getAggregatedProperties("AggregatedProperty");
        let measures = [];
        const annoPath = props.metaPath.getPath();
        const aggregatedProperties = aggregationHelper.getAggregatedProperties("AggregatedProperties");
        const chartMeasures = oChart.Measures ? oChart.Measures : [];
        const chartDynamicMeasures = oChart.DynamicMeasures ? oChart.DynamicMeasures : [];
        //check if there are measures pointing to aggregatedproperties
        const transAggInMeasures = aggregatedProperties[0] ? aggregatedProperties[0].filter(function (properties) {
          return chartMeasures.some(function (propertyMeasureType) {
            return properties.Name === propertyMeasureType.value;
          });
        }) : undefined;
        const entitySetPath = annoPath.replace(/@com.sap.vocabularies.UI.v1.(Chart|PresentationVariant|SelectionPresentationVariant).*/, "");
        const transAggregations = props.chartDefinition.transAgg;
        const customAggregations = props.chartDefinition.customAgg;
        // intimate the user if there is Aggregatedproperty configured with no DYnamicMeasures, bu there are measures with AggregatedProperties
        if (aggregatedProperty.length > 0 && !chartDynamicMeasures && transAggInMeasures.length > 0) {
          Log.warning("The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly.");
        }
        const isCustomAggregateIsMeasure = chartMeasures.some(oChartMeasure => {
          const oCustomAggMeasure = _this.getCustomAggMeasure(customAggregations, oChartMeasure);
          return !!oCustomAggMeasure;
        });
        if (aggregatedProperty.length > 0 && !(chartDynamicMeasures !== null && chartDynamicMeasures !== void 0 && chartDynamicMeasures.length) && !isCustomAggregateIsMeasure) {
          throw new Error("Please configure DynamicMeasures for the chart");
        }
        if (aggregatedProperty.length > 0) {
          for (const dynamicMeasure of chartDynamicMeasures) {
            measures = _this.getDynamicMeasures(measures, dynamicMeasure, entitySetPath, oChart);
          }
        }
        for (const chartMeasure of chartMeasures) {
          const key = chartMeasure.value;
          const customAggMeasure = _this.getCustomAggMeasure(customAggregations, chartMeasure);
          const measureType = {};
          if (customAggMeasure) {
            measures = _this.setCustomAggMeasure(measures, measureType, customAggMeasure, key);
            //if there is neither aggregatedProperty nor measures pointing to customAggregates, but we have normal measures. Now check if these measures are part of AggregatedProperties Obj
          } else if (aggregatedProperty.length === 0 && transAggregations[key]) {
            measures = _this.setTransAggMeasure(measures, measureType, transAggregations, key);
          }
          _this.setChartMeasureAttributes(_this._chart.MeasureAttributes, entitySetPath, measureType);
        }
        const measuresModel = new JSONModel(measures);
        measuresModel.$$valueAsPromise = true;
        return measuresModel.createBindingContext("/");
      };
      _this.setCustomAggMeasure = (measures, measure, customAggMeasure, key) => {
        if (key.includes("/")) {
          Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
        }
        measure.key = customAggMeasure.value;
        measure.role = "axis1";
        measure.label = customAggMeasure.label;
        measure.propertyPath = customAggMeasure.value;
        measures.push(measure);
        return measures;
      };
      _this.setTransAggMeasure = (measures, measure, transAggregations, key) => {
        const transAggMeasure = transAggregations[key];
        measure.key = transAggMeasure.name;
        measure.role = "axis1";
        measure.propertyPath = key;
        measure.aggregationMethod = transAggMeasure.aggregationMethod;
        measure.label = transAggMeasure.label || measure.label;
        measures.push(measure);
        return measures;
      };
      _this.getDynamicMeasures = (measures, chartDynamicMeasure, entitySetPath, chart) => {
        var _chartDynamicMeasure$;
        const key = chartDynamicMeasure.value || "";
        const aggregatedProperty = getInvolvedDataModelObjects(_this.metaPath.getModel().createBindingContext(entitySetPath + key), _this.contextPath).targetObject;
        if (key.includes("/")) {
          Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
          // check if the annotation path is wrong
        } else if (!aggregatedProperty) {
          throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
          // check if the path starts with @
        } else if (((_chartDynamicMeasure$ = chartDynamicMeasure.value) === null || _chartDynamicMeasure$ === void 0 ? void 0 : _chartDynamicMeasure$.startsWith(`@${"com.sap.vocabularies.Analytics.v1.AggregatedProperty"}`)) === null) {
          throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
        } else {
          var _aggregatedProperty$a;
          // check if AggregatedProperty is defined in given DynamicMeasure
          const dynamicMeasure = {
            key: aggregatedProperty.Name,
            role: "axis1"
          };
          dynamicMeasure.propertyPath = aggregatedProperty.AggregatableProperty.value;
          dynamicMeasure.aggregationMethod = aggregatedProperty.AggregationMethod;
          dynamicMeasure.label = resolveBindingString(((_aggregatedProperty$a = aggregatedProperty.annotations.Common) === null || _aggregatedProperty$a === void 0 ? void 0 : _aggregatedProperty$a.Label) || getInvolvedDataModelObjects(_this.metaPath.getModel().createBindingContext(entitySetPath + dynamicMeasure.propertyPath + `@${"com.sap.vocabularies.Common.v1.Label"}`), _this.contextPath).targetObject);
          _this.setChartMeasureAttributes(chart.MeasureAttributes, entitySetPath, dynamicMeasure);
          measures.push(dynamicMeasure);
        }
        return measures;
      };
      _this.getCustomAggMeasure = (customAggregations, measure) => {
        if (measure.value && customAggregations[measure.value]) {
          var _customAggregations$m;
          measure.label = (_customAggregations$m = customAggregations[measure.value]) === null || _customAggregations$m === void 0 ? void 0 : _customAggregations$m.label;
          return measure;
        }
        return null;
      };
      _this.setChartMeasureAttributes = (measureAttributes, entitySetPath, measure) => {
        if (measureAttributes !== null && measureAttributes !== void 0 && measureAttributes.length) {
          for (const measureAttribute of measureAttributes) {
            _this._setChartMeasureAttribute(measureAttribute, entitySetPath, measure);
          }
        }
      };
      _this._setChartMeasureAttribute = (measureAttribute, entitySetPath, measure) => {
        var _measureAttribute$Dyn, _measureAttribute$Mea, _measureAttribute$Dat;
        const path = measureAttribute.DynamicMeasure ? measureAttribute === null || measureAttribute === void 0 ? void 0 : (_measureAttribute$Dyn = measureAttribute.DynamicMeasure) === null || _measureAttribute$Dyn === void 0 ? void 0 : _measureAttribute$Dyn.value : measureAttribute === null || measureAttribute === void 0 ? void 0 : (_measureAttribute$Mea = measureAttribute.Measure) === null || _measureAttribute$Mea === void 0 ? void 0 : _measureAttribute$Mea.value;
        const measureAttributeDataPoint = measureAttribute.DataPoint ? measureAttribute === null || measureAttribute === void 0 ? void 0 : (_measureAttribute$Dat = measureAttribute.DataPoint) === null || _measureAttribute$Dat === void 0 ? void 0 : _measureAttribute$Dat.value : null;
        const role = measureAttribute.Role;
        const dataPoint = measureAttributeDataPoint && getInvolvedDataModelObjects(_this.metaPath.getModel().createBindingContext(entitySetPath + measureAttributeDataPoint), _this.contextPath).targetObject;
        if (measure.key === path) {
          _this.setMeasureRole(measure, role);
          //still to add data point, but UI5 Chart API is missing
          _this.setMeasureDataPoint(measure, dataPoint);
        }
      };
      _this.setMeasureDataPoint = (measure, dataPoint) => {
        if (dataPoint && dataPoint.Value.$Path == measure.key) {
          measure.dataPoint = ChartHelper.formatJSONToString(_this.createDataPointProperty(dataPoint)) || "";
        }
      };
      _this.setMeasureRole = (measure, role) => {
        if (role) {
          const index = role.$EnumMember;
          measure.role = measureRole[index];
        }
      };
      _this.getDependents = chartContext => {
        if (_this._commandActions.length > 0) {
          return _this._commandActions.map(commandAction => {
            return _this.getActionCommand(commandAction, chartContext);
          });
        }
        return "";
      };
      _this.checkPersonalizationInChartProperties = oProps => {
        if (oProps.personalization) {
          if (oProps.personalization === "false") {
            _this.personalization = undefined;
          } else if (oProps.personalization === "true") {
            _this.personalization = Object.values(personalizationValues).join(",");
          } else if (_this.verifyValidPersonlization(oProps.personalization) === true) {
            _this.personalization = oProps.personalization;
          } else {
            _this.personalization = undefined;
          }
        }
      };
      _this.verifyValidPersonlization = personalization => {
        let valid = true;
        const splitArray = personalization.split(",");
        const acceptedValues = Object.values(personalizationValues);
        splitArray.forEach(arrayElement => {
          if (!acceptedValues.includes(arrayElement)) {
            valid = false;
          }
        });
        return valid;
      };
      _this.getVariantManagement = (oProps, oChartDefinition) => {
        let variantManagement = oProps.variantManagement ? oProps.variantManagement : oChartDefinition.variantManagement;
        variantManagement = _this.personalization === undefined ? "None" : variantManagement;
        return variantManagement;
      };
      _this.createVariantManagement = () => {
        const personalization = _this.personalization;
        if (personalization) {
          const variantManagement = _this.variantManagement;
          if (variantManagement === "Control") {
            return xml`
					<mdc:variant>
					<variant:VariantManagement
						id="${generate([_this.id, "VM"])}"
						for="${_this.id}"
						showSetAsDefault="${true}"
						select="${_this.variantSelected}"
						headerLevel="${_this.headerLevel}"
						save="${_this.variantSaved}"
					/>
					</mdc:variant>
			`;
          } else if (variantManagement === "None" || variantManagement === "Page") {
            return "";
          }
        } else if (!personalization) {
          Log.warning("Variant Management cannot be enabled when personalization is disabled");
        }
        return "";
      };
      _this.getPersistenceProvider = () => {
        if (_this.variantManagement === "None") {
          return xml`<p13n:PersistenceProvider id="${generate([_this.id, "PersistenceProvider"])}" for="${_this.id}"/>`;
        }
        return "";
      };
      _this.pushActionCommand = (actionContext, dataField, chartOperationAvailableMap, action) => {
        if (dataField) {
          const commandAction = {
            actionContext: actionContext,
            onExecuteAction: ChartHelper.getPressEventForDataFieldForActionButton(_this.id, dataField, chartOperationAvailableMap || ""),
            onExecuteIBN: CommonHelper.getPressHandlerForDataFieldForIBN(dataField, `\${internal>selectedContexts}`, false),
            onExecuteManifest: CommonHelper.buildActionWrapper(action, _assertThisInitialized(_this))
          };
          _this._commandActions.push(commandAction);
        }
      };
      _this.getActionCommand = (commandAction, chartContext) => {
        const action = commandAction.actionContext.getObject();
        const dataFieldContext = action.annotationPath && _this.contextPath.getModel().createBindingContext(action.annotationPath);
        const dataField = dataFieldContext && dataFieldContext.getObject();
        const dataFieldAction = _this.contextPath.getModel().createBindingContext(action.annotationPath + "/Action");
        const actionContext = CommonHelper.getActionContext(dataFieldAction);
        const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
        const isBound = _this.contextPath.getModel().createBindingContext(isBoundPath).getObject();
        const chartOperationAvailableMap = escapeXMLAttributeValue(ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
          context: chartContext
        }));
        const isActionEnabled = action.enabled ? action.enabled : ChartHelper.isDataFieldForActionButtonEnabled(isBound && isBound.$IsBound, dataField.Action, _this.contextPath, chartOperationAvailableMap || "", action.enableOnSelect || "");
        let isIBNEnabled;
        if (action.enabled) {
          isIBNEnabled = action.enabled;
        } else if (dataField.RequiresContext) {
          isIBNEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
        }
        const actionCommand = xml`<internalMacro:ActionCommand
		action="${action}"
		onExecuteAction="${commandAction.onExecuteAction}"
		onExecuteIBN="${commandAction.onExecuteIBN}"
		onExecuteManifest="${commandAction.onExecuteManifest}"
		isIBNEnabled="${isIBNEnabled}"
		isActionEnabled="${isActionEnabled}"
		visible="${_this.getVisible(dataFieldContext)}"
	/>`;
        if (action.type == "ForAction" && (!isBound || isBound.IsBound !== true || actionContext[`@${"Org.OData.Core.V1.OperationAvailable"}`] !== false)) {
          return actionCommand;
        } else if (action.type == "ForAction") {
          return "";
        } else {
          return actionCommand;
        }
      };
      _this.getItems = chartContext => {
        if (_this._chart) {
          const dimensions = [];
          const measures = [];
          if (_this._chart.Dimensions) {
            ChartHelper.formatDimensions(chartContext).getObject().forEach(dimension => {
              dimension.id = generate([_this.id, "dimension", dimension.key]);
              dimensions.push(_this.getItem({
                id: dimension.id,
                key: dimension.key,
                label: dimension.label,
                role: dimension.role
              }, "_fe_groupable_", "groupable"));
            });
          }
          if (_this.measures) {
            ChartHelper.formatMeasures(_this.measures).forEach(measure => {
              measure.id = generate([_this.id, "measure", measure.key]);
              measures.push(_this.getItem({
                id: measure.id,
                key: measure.key,
                label: measure.label,
                role: measure.role
              }, "_fe_aggregatable_", "aggregatable"));
            });
          }
          if (dimensions.length && measures.length) {
            return dimensions.concat(measures);
          }
        }
        return "";
      };
      _this.getItem = (item, prefix, type) => {
        return xml`<chart:Item
			id="${item.id}"
			name="${prefix + item.key}"
			type="${type}"
			label="${resolveBindingString(item.label, "string")}"
			role="${item.role}"
		/>`;
      };
      _this.getToolbarActions = (chartContext, isInsightsEnabled, isInsightsVisible) => {
        var _this$chartDefinition;
        const actions = _this.getActions(chartContext);
        if ((_this$chartDefinition = _this.chartDefinition) !== null && _this$chartDefinition !== void 0 && _this$chartDefinition.onSegmentedButtonPressed) {
          actions.push(_this.getSegmentedButton());
        }
        if (isInsightsEnabled) {
          actions.push(_this.getStandardActions(isInsightsEnabled, isInsightsVisible));
        }
        if (actions.length > 0) {
          return xml`<mdc:actions>${actions}</mdc:actions>`;
        }
        return "";
      };
      _this.getStandardActions = (isInsightsEnabled, isInsightsVisible) => {
        return xml`<mdcat:ActionToolbarAction  xmlns="sap.m" xmlns:mdcat="sap.ui.mdc.actiontoolbar" visible="${isInsightsVisible}">
				<Button
					id="${generate([_this.id, "StandardAction::Insights"])}"
					text="{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}"
					core:require="{API: 'sap/fe/macros/chart/ChartAPI'}"
					press="API.onAddCardToInsightsPressed($event)"
					enabled="${isInsightsEnabled}"
				>
					<layoutData>
						<OverflowToolbarLayoutData priority="AlwaysOverflow"/>
					</layoutData>
				</Button>
			</mdcat:ActionToolbarAction>`;
      };
      _this.getActions = chartContext => {
        var _this$chartActions;
        let actions = (_this$chartActions = _this.chartActions) === null || _this$chartActions === void 0 ? void 0 : _this$chartActions.getObject();
        actions = _this.removeMenuItems(actions);
        return actions.map(action => {
          if (action.annotationPath) {
            // Load annotation based actions
            return _this.getAction(action, chartContext, false);
          } else if (action.hasOwnProperty("noWrap")) {
            // Load XML or manifest based actions / action groups
            return _this.getCustomActions(action, chartContext);
          }
        });
      };
      _this.removeMenuItems = actions => {
        // If action is already part of menu in action group, then it will
        // be removed from the main actions list
        for (const action of actions) {
          if (action.menu) {
            action.menu.forEach(item => {
              const idx = actions.map(act => act.key).indexOf(item.key);
              if (idx !== -1) {
                actions.splice(idx, 1);
              }
            });
          }
        }
        return actions;
      };
      _this.getCustomActions = (action, chartContext) => {
        let actionEnabled = action.enabled;
        if ((action.requiresSelection ?? false) && action.enabled === "true") {
          actionEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
        }
        if (action.type === "Default") {
          // Load XML or manifest based toolbar actions
          return _this.getActionToolbarAction(action, {
            id: generate([_this.id, action.id]),
            unittestid: "DataFieldForActionButtonAction",
            label: action.text ? action.text : "",
            ariaHasPopup: undefined,
            press: action.press ? action.press : "",
            enabled: actionEnabled,
            visible: action.visible ? action.visible : false
          }, false);
        } else if (action.type === "Menu") {
          // Load action groups (Menu)
          return _this.getActionToolbarMenuAction({
            id: generate([_this.id, action.id]),
            text: action.text,
            visible: action.visible,
            enabled: actionEnabled,
            useDefaultActionOnly: DefaultActionHandler.getUseDefaultActionOnly(action),
            buttonMode: DefaultActionHandler.getButtonMode(action),
            defaultAction: undefined,
            actions: action
          }, chartContext);
        }
      };
      _this.getMenuItemFromMenu = (menuItemAction, chartContext) => {
        let pressHandler;
        if (menuItemAction.annotationPath) {
          //Annotation based action is passed as menu item for menu button
          return _this.getAction(menuItemAction, chartContext, true);
        }
        if (menuItemAction.command) {
          pressHandler = "cmd:" + menuItemAction.command;
        } else if (menuItemAction.noWrap ?? false) {
          pressHandler = menuItemAction.press;
        } else {
          pressHandler = CommonHelper.buildActionWrapper(menuItemAction, _assertThisInitialized(_this));
        }
        return xml`<MenuItem
		core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
		text="${menuItemAction.text}"
		press="${pressHandler}"
		visible="${menuItemAction.visible}"
		enabled="${menuItemAction.enabled}"
	/>`;
      };
      _this.getActionToolbarMenuAction = (props, chartContext) => {
        var _props$actions, _props$actions$menu;
        const aMenuItems = (_props$actions = props.actions) === null || _props$actions === void 0 ? void 0 : (_props$actions$menu = _props$actions.menu) === null || _props$actions$menu === void 0 ? void 0 : _props$actions$menu.map(action => {
          return _this.getMenuItemFromMenu(action, chartContext);
        });
        return xml`<mdcat:ActionToolbarAction>
			<MenuButton
			text="${props.text}"
			type="Transparent"
			menuPosition="BeginBottom"
			id="${props.id}"
			visible="${props.visible}"
			enabled="${props.enabled}"
			useDefaultActionOnly="${props.useDefaultActionOnly}"
			buttonMode="${props.buttonMode}"
			defaultAction="${props.defaultAction}"
			>
				<menu>
					<Menu>
						${aMenuItems}
					</Menu>
				</menu>
			</MenuButton>
		</mdcat:ActionToolbarAction>`;
      };
      _this.getAction = (action, chartContext, isMenuItem) => {
        const dataFieldContext = _this.contextPath.getModel().createBindingContext(action.annotationPath || "");
        if (action.type === "ForNavigation") {
          return _this.getNavigationActions(action, dataFieldContext, isMenuItem);
        } else if (action.type === "ForAction") {
          return _this.getAnnotationActions(chartContext, action, dataFieldContext, isMenuItem);
        }
        return "";
      };
      _this.getNavigationActions = (action, dataFieldContext, isMenuItem) => {
        let enabled = "true";
        const dataField = dataFieldContext.getObject();
        if (action.enabled !== undefined) {
          enabled = action.enabled;
        } else if (dataField.RequiresContext) {
          enabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
        }
        return _this.getActionToolbarAction(action, {
          id: undefined,
          unittestid: "DataFieldForIntentBasedNavigationButtonAction",
          label: dataField.Label,
          ariaHasPopup: undefined,
          press: CommonHelper.getPressHandlerForDataFieldForIBN(dataField, `\${internal>selectedContexts}`, false),
          enabled: enabled,
          visible: _this.getVisible(dataFieldContext)
        }, isMenuItem);
      };
      _this.getAnnotationActions = (chartContext, action, dataFieldContext, isMenuItem) => {
        const dataFieldAction = _this.contextPath.getModel().createBindingContext(action.annotationPath + "/Action");
        const actionContext = _this.contextPath.getModel().createBindingContext(CommonHelper.getActionContext(dataFieldAction));
        const actionObject = actionContext.getObject();
        const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
        const isBound = _this.contextPath.getModel().createBindingContext(isBoundPath).getObject();
        const dataField = dataFieldContext.getObject();
        if (!isBound || isBound.$IsBound !== true || actionObject[`@${"Org.OData.Core.V1.OperationAvailable"}`] !== false) {
          const enabled = _this.getAnnotationActionsEnabled(action, isBound, dataField, chartContext);
          const dataFieldModelObjectPath = getInvolvedDataModelObjects(_this.contextPath.getModel().createBindingContext(action.annotationPath));
          const ariaHasPopup = isDataModelObjectPathForActionWithDialog(dataFieldModelObjectPath);
          const chartOperationAvailableMap = escapeXMLAttributeValue(ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
            context: chartContext
          })) || "";
          return _this.getActionToolbarAction(action, {
            id: generate([_this.id, getInvolvedDataModelObjects(dataFieldContext)]),
            unittestid: "DataFieldForActionButtonAction",
            label: dataField.Label,
            ariaHasPopup: ariaHasPopup,
            press: ChartHelper.getPressEventForDataFieldForActionButton(_this.id, dataField, chartOperationAvailableMap),
            enabled: enabled,
            visible: _this.getVisible(dataFieldContext)
          }, isMenuItem);
        }
        return "";
      };
      _this.getActionToolbarAction = (action, toolbarAction, isMenuItem) => {
        if (isMenuItem) {
          return xml`
			<MenuItem
				text="${toolbarAction.label}"
				press="${action.command ? "cmd:" + action.command : toolbarAction.press}"
				enabled="${toolbarAction.enabled}"
				visible="${toolbarAction.visible}"
			/>`;
        } else {
          return _this.buildAction(action, toolbarAction);
        }
      };
      _this.buildAction = (action, toolbarAction) => {
        let actionPress = "";
        if (action.hasOwnProperty("noWrap")) {
          if (action.command) {
            actionPress = "cmd:" + action.command;
          } else if (action.noWrap === true) {
            actionPress = toolbarAction.press;
          } else if (!action.annotationPath) {
            actionPress = CommonHelper.buildActionWrapper(action, _assertThisInitialized(_this));
          }
          return xml`<mdcat:ActionToolbarAction>
			<Button
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
				unittest:id="${toolbarAction.unittestid}"
				id="${toolbarAction.id}"
				text="${toolbarAction.label}"
				ariaHasPopup="${toolbarAction.ariaHasPopup}"
				press="${actionPress}"
				enabled="${toolbarAction.enabled}"
				visible="${toolbarAction.visible}"
			/>
		   </mdcat:ActionToolbarAction>`;
        } else {
          return xml`<mdcat:ActionToolbarAction>
			<Button
				unittest:id="${toolbarAction.unittestid}"
				id="${toolbarAction.id}"
				text="${toolbarAction.label}"
				ariaHasPopup="${toolbarAction.ariaHasPopup}"
				press="${action.command ? "cmd:" + action.command : toolbarAction.press}"
				enabled="${toolbarAction.enabled}"
				visible="${toolbarAction.visible}"
			/>
		</mdcat:ActionToolbarAction>`;
        }
      };
      _this.getAnnotationActionsEnabled = (action, isBound, dataField, chartContext) => {
        return action.enabled !== undefined ? action.enabled : ChartHelper.isDataFieldForActionButtonEnabled(isBound && isBound.$IsBound, dataField.Action, _this.contextPath, ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
          context: chartContext
        }), action.enableOnSelect || "");
      };
      _this.getSegmentedButton = () => {
        return xml`<mdcat:ActionToolbarAction layoutInformation="{
			aggregationName: 'end',
			alignment: 'End'
		}">
			<SegmentedButton
				id="${generate([_this.id, "SegmentedButton", "TemplateContentView"])}"
				select="${_this.chartDefinition.onSegmentedButtonPressed}"
				visible="{= \${pageInternal>alpContentView} !== 'Table' }"
				selectedKey="{pageInternal>alpContentView}"
			>
				<items>
					${_this.getSegmentedButtonItems()}
				</items>
			</SegmentedButton>
		</mdcat:ActionToolbarAction>`;
      };
      _this.getSegmentedButtonItems = () => {
        const segmentedButtonItems = [];
        if (CommonHelper.isDesktop()) {
          segmentedButtonItems.push(_this.getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_HYBRID_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Hybrid", "sap-icon://chart-table-view"));
        }
        segmentedButtonItems.push(_this.getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_CHART_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Chart", "sap-icon://bar-chart"));
        segmentedButtonItems.push(_this.getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_TABLE_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Table", "sap-icon://table-view"));
        return segmentedButtonItems;
      };
      _this.getSegmentedButtonItem = (tooltip, key, icon) => {
        return xml`<SegmentedButtonItem
			tooltip="${tooltip}"
			key="${key}"
			icon="${icon}"
		/>`;
      };
      _this.getVisible = dataFieldContext => {
        const dataField = dataFieldContext.getObject();
        if (dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`] && dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path) {
          const hiddenPathContext = _this.contextPath.getModel().createBindingContext(dataFieldContext.getPath() + `/@${"com.sap.vocabularies.UI.v1.Hidden"}/$Path`, dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path);
          return ChartHelper.getHiddenPathExpressionForTableActionsAndIBN(dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path, {
            context: hiddenPathContext
          });
        } else if (dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`]) {
          return !dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`];
        } else {
          return true;
        }
      };
      _this.getContextPath = () => {
        return _this.contextPath.getPath().lastIndexOf("/") === _this.contextPath.getPath().length - 1 ? _this.contextPath.getPath().replaceAll("/", "") : _this.contextPath.getPath().split("/")[_this.contextPath.getPath().split("/").length - 1];
      };
      const _contextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
      const initialConverterContext = _this.getConverterContext(_contextObjectPath, /*this.contextPath*/undefined, _settings);
      const _visualizationPath = ChartBlock.getVisualizationPath(_assertThisInitialized(_this), _contextObjectPath, initialConverterContext);
      const extraParams = ChartBlock.getExtraParams(_assertThisInitialized(_this), _visualizationPath);
      const _converterContext = _this.getConverterContext(_contextObjectPath, /*this.contextPath*/undefined, _settings, extraParams);
      const _aggregationHelper = new AggregationHelper(_converterContext.getEntityType(), _converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart
      _this._chartContext = ChartHelper.getUiChart(_this.metaPath);
      _this._chart = _this._chartContext.getObject();
      if (_this._applyIdToContent ?? false) {
        _this._apiId = _this.id + "::Chart";
        _this._contentId = _this.id;
      } else {
        _this._apiId = _this.id;
        _this._contentId = _this.getContentId(_this.id);
      }
      if (_this._chart) {
        var _this$chartDefinition2, _contextObjectPath$co, _this$chartDefinition5, _this$chartDefinition6, _this$chartDefinition7, _this$chartDefinition8, _this$chartDefinition9, _this$chartDefinition10, _this$chartDefinition11;
        _this.chartDefinition = _this.chartDefinition === undefined || _this.chartDefinition === null ? _this.createChartDefinition(_converterContext, _contextObjectPath, _this._chartContext.getPath()) : _this.chartDefinition;
        // API Properties
        _this.navigationPath = _this.chartDefinition.navigationPath;
        _this.autoBindOnInit = _this.chartDefinition.autoBindOnInit;
        _this.vizProperties = _this.chartDefinition.vizProperties;
        _this.chartActions = _this.createBindingContext(_this.chartDefinition.actions, _settings);
        _this.selectionMode = _this.selectionMode.toUpperCase();
        if (_this.filterBar) {
          _this.filter = _this.getContentId(_this.filterBar);
        } else if (!_this.filter) {
          _this.filter = _this.chartDefinition.filterId;
        }
        _this.checkPersonalizationInChartProperties(_assertThisInitialized(_this));
        _this.variantManagement = _this.getVariantManagement(_assertThisInitialized(_this), _this.chartDefinition);
        _this.visible = _this.chartDefinition.visible;
        let contextPath = _this.contextPath.getPath();
        contextPath = contextPath[contextPath.length - 1] === "/" ? contextPath.slice(0, -1) : contextPath;
        _this.draftSupported = ModelHelper.isDraftSupported(_settings.models.metaModel, contextPath);
        _this._chartType = ChartHelper.formatChartType(_this._chart.ChartType);
        const operationAvailableMap = ChartHelper.getOperationAvailableMap(_this._chart, {
          context: _this._chartContext
        });
        if (Object.keys((_this$chartDefinition2 = _this.chartDefinition) === null || _this$chartDefinition2 === void 0 ? void 0 : _this$chartDefinition2.commandActions).length > 0) {
          var _this$chartDefinition3;
          Object.keys((_this$chartDefinition3 = _this.chartDefinition) === null || _this$chartDefinition3 === void 0 ? void 0 : _this$chartDefinition3.commandActions).forEach(key => {
            var _this$chartDefinition4;
            const action = (_this$chartDefinition4 = _this.chartDefinition) === null || _this$chartDefinition4 === void 0 ? void 0 : _this$chartDefinition4.commandActions[key];
            const actionContext = _this.createBindingContext(action, _settings);
            const dataFieldContext = action.annotationPath && _this.contextPath.getModel().createBindingContext(action.annotationPath);
            const dataField = dataFieldContext && dataFieldContext.getObject();
            const chartOperationAvailableMap = escapeXMLAttributeValue(operationAvailableMap);
            _this.pushActionCommand(actionContext, dataField, chartOperationAvailableMap, action);
          });
        }
        _this.measures = _this.getChartMeasures(_assertThisInitialized(_this), _aggregationHelper);
        const presentationPath = CommonHelper.createPresentationPathContext(_this.metaPath);
        _this._sortCondtions = ChartHelper.getSortConditions(_this.metaPath, _this.metaPath.getObject(), presentationPath.getPath(), _this.chartDefinition.applySupported);
        const chartActionsContext = _this.contextPath.getModel().createBindingContext(_this._chartContext.getPath() + "/Actions", _this._chart.Actions);
        const contextPathContext = _this.contextPath.getModel().createBindingContext(_this.contextPath.getPath(), _this.contextPath);
        const contextPathPath = CommonHelper.getContextPath(_this.contextPath, {
          context: contextPathContext
        });
        const targetCollectionPath = CommonHelper.getTargetCollectionPath(_this.contextPath);
        const targetCollectionPathContext = _this.contextPath.getModel().createBindingContext(targetCollectionPath, _this.contextPath);
        const actionsObject = (_contextObjectPath$co = _contextObjectPath.convertedTypes.resolvePath(chartActionsContext.getPath())) === null || _contextObjectPath$co === void 0 ? void 0 : _contextObjectPath$co.target;
        _this._customData = {
          targetCollectionPath: contextPathPath,
          entitySet: typeof targetCollectionPathContext.getObject() === "string" ? targetCollectionPathContext.getObject() : targetCollectionPathContext.getObject("@sapui.name"),
          entityType: contextPathPath + "/",
          operationAvailableMap: CommonHelper.stringifyCustomData(JSON.parse(operationAvailableMap)),
          multiSelectDisabledActions: ActionHelper.getMultiSelectDisabledActions(actionsObject) + "",
          segmentedButtonId: generate([_this.id, "SegmentedButton", "TemplateContentView"]),
          customAgg: CommonHelper.stringifyCustomData((_this$chartDefinition5 = _this.chartDefinition) === null || _this$chartDefinition5 === void 0 ? void 0 : _this$chartDefinition5.customAgg),
          transAgg: CommonHelper.stringifyCustomData((_this$chartDefinition6 = _this.chartDefinition) === null || _this$chartDefinition6 === void 0 ? void 0 : _this$chartDefinition6.transAgg),
          applySupported: CommonHelper.stringifyCustomData((_this$chartDefinition7 = _this.chartDefinition) === null || _this$chartDefinition7 === void 0 ? void 0 : _this$chartDefinition7.applySupported),
          vizProperties: _this.vizProperties,
          draftSupported: _this.draftSupported,
          multiViews: (_this$chartDefinition8 = _this.chartDefinition) === null || _this$chartDefinition8 === void 0 ? void 0 : _this$chartDefinition8.multiViews,
          selectionPresentationVariantPath: CommonHelper.stringifyCustomData({
            data: (_this$chartDefinition9 = _this.chartDefinition) === null || _this$chartDefinition9 === void 0 ? void 0 : _this$chartDefinition9.selectionPresentationVariantPath
          })
        };
        _this._actions = _this.chartActions ? _this.getToolbarActions(_this._chartContext, (_this$chartDefinition10 = _this.chartDefinition) === null || _this$chartDefinition10 === void 0 ? void 0 : _this$chartDefinition10.isInsightsEnabled, (_this$chartDefinition11 = _this.chartDefinition) === null || _this$chartDefinition11 === void 0 ? void 0 : _this$chartDefinition11.isInsightsVisible) : "";
      } else {
        // fallback to display empty chart
        _this.autoBindOnInit = false;
        _this.visible = "true";
        _this.navigationPath = "";
        _this._actions = "";
        _this._customData = {
          targetCollectionPath: "",
          entitySet: "",
          entityType: "",
          operationAvailableMap: "",
          multiSelectDisabledActions: "",
          segmentedButtonId: "",
          customAgg: "",
          transAgg: "",
          applySupported: "",
          vizProperties: ""
        };
      }
      return _this;
    }
    _exports = ChartBlock;
    var _proto = ChartBlock.prototype;
    _proto.getContentId = function getContentId(macroId) {
      return `${macroId}-content`;
    };
    ChartBlock.getExtraParams = function getExtraParams(props, visualizationPath) {
      const extraParams = {};
      if (props.actions) {
        var _Object$values;
        (_Object$values = Object.values(props.actions)) === null || _Object$values === void 0 ? void 0 : _Object$values.forEach(item => {
          props.actions = {
            ...props.actions,
            ...item.menuContentActions
          };
          delete item.menuContentActions;
        });
      }
      if (visualizationPath) {
        extraParams[visualizationPath] = {
          actions: props.actions
        };
      }
      return extraParams;
    };
    /**
     * Format the data point as a JSON object.
     *
     * @param oDataPointAnno
     * @returns The formatted json object
     */
    _proto.createDataPointProperty = function createDataPointProperty(oDataPointAnno) {
      const oDataPoint = {};
      if (oDataPointAnno.TargetValue) {
        oDataPoint.targetValue = oDataPointAnno.TargetValue.$Path;
      }
      if (oDataPointAnno.ForeCastValue) {
        oDataPoint.foreCastValue = oDataPointAnno.ForeCastValue.$Path;
      }
      let oCriticality = null;
      if (oDataPointAnno.Criticality) {
        if (oDataPointAnno.Criticality.$Path) {
          //will be an aggregated property or custom aggregate
          oCriticality = {
            Calculated: oDataPointAnno.Criticality.$Path
          };
        } else {
          oCriticality = {
            Static: oDataPointAnno.Criticality.$EnumMember.replace("com.sap.vocabularies.UI.v1.CriticalityType/", "")
          };
        }
      } else if (oDataPointAnno.CriticalityCalculation) {
        const oThresholds = {};
        const bConstant = this.buildThresholds(oThresholds, oDataPointAnno.CriticalityCalculation);
        if (bConstant) {
          oCriticality = {
            ConstantThresholds: oThresholds
          };
        } else {
          oCriticality = {
            DynamicThresholds: oThresholds
          };
        }
      }
      if (oCriticality) {
        oDataPoint.criticality = oCriticality;
      }
      return oDataPoint;
    }

    /**
     * Checks whether the thresholds are dynamic or constant.
     *
     * @param oThresholds The threshold skeleton
     * @param oCriticalityCalculation The UI.DataPoint.CriticalityCalculation annotation
     * @returns `true` if the threshold should be supplied as ConstantThresholds, <code>false</code> if the threshold should
     * be supplied as DynamicThresholds
     * @private
     */;
    _proto.buildThresholds = function buildThresholds(oThresholds, oCriticalityCalculation) {
      const aKeys = ["AcceptanceRangeLowValue", "AcceptanceRangeHighValue", "ToleranceRangeLowValue", "ToleranceRangeHighValue", "DeviationRangeLowValue", "DeviationRangeHighValue"];
      let bConstant = true,
        sKey,
        i,
        j;
      oThresholds.ImprovementDirection = oCriticalityCalculation.ImprovementDirection.$EnumMember.replace("com.sap.vocabularies.UI.v1.ImprovementDirectionType/", "");
      const oDynamicThresholds = {
        oneSupplied: false,
        usedMeasures: []
        // combination to check whether at least one is supplied
      };

      const oConstantThresholds = {
        oneSupplied: false
        // combination to check whether at least one is supplied
      };

      for (i = 0; i < aKeys.length; i++) {
        sKey = aKeys[i];
        oDynamicThresholds[sKey] = oCriticalityCalculation[sKey] ? oCriticalityCalculation[sKey].$Path : undefined;
        oDynamicThresholds.oneSupplied = oDynamicThresholds.oneSupplied || oDynamicThresholds[sKey];
        if (!oDynamicThresholds.oneSupplied) {
          // only consider in case no dynamic threshold is supplied
          oConstantThresholds[sKey] = oCriticalityCalculation[sKey];
          oConstantThresholds.oneSupplied = oConstantThresholds.oneSupplied || oConstantThresholds[sKey];
        } else if (oDynamicThresholds[sKey]) {
          oDynamicThresholds.usedMeasures.push(oDynamicThresholds[sKey]);
        }
      }

      // dynamic definition shall overrule constant definition
      if (oDynamicThresholds.oneSupplied) {
        bConstant = false;
        for (i = 0; i < aKeys.length; i++) {
          if (oDynamicThresholds[aKeys[i]]) {
            oThresholds[aKeys[i]] = oDynamicThresholds[aKeys[i]];
          }
        }
        oThresholds.usedMeasures = oDynamicThresholds.usedMeasures;
      } else {
        let oAggregationLevel;
        oThresholds.AggregationLevels = [];

        // check if at least one static value is supplied
        if (oConstantThresholds.oneSupplied) {
          // add one entry in the aggregation level
          oAggregationLevel = {
            VisibleDimensions: null
          };
          for (i = 0; i < aKeys.length; i++) {
            if (oConstantThresholds[aKeys[i]]) {
              oAggregationLevel[aKeys[i]] = oConstantThresholds[aKeys[i]];
            }
          }
          oThresholds.AggregationLevels.push(oAggregationLevel);
        }

        // further check for ConstantThresholds
        if (oCriticalityCalculation.ConstantThresholds && oCriticalityCalculation.ConstantThresholds.length > 0) {
          for (i = 0; i < oCriticalityCalculation.ConstantThresholds.length; i++) {
            const oAggregationLevelInfo = oCriticalityCalculation.ConstantThresholds[i];
            const aVisibleDimensions = oAggregationLevelInfo.AggregationLevel ? [] : null;
            if (oAggregationLevelInfo.AggregationLevel && oAggregationLevelInfo.AggregationLevel.length > 0) {
              for (j = 0; j < oAggregationLevelInfo.AggregationLevel.length; j++) {
                aVisibleDimensions.push(oAggregationLevelInfo.AggregationLevel[j].$PropertyPath);
              }
            }
            oAggregationLevel = {
              VisibleDimensions: aVisibleDimensions
            };
            for (j = 0; j < aKeys.length; j++) {
              const nValue = oAggregationLevelInfo[aKeys[j]];
              if (nValue) {
                oAggregationLevel[aKeys[j]] = nValue;
              }
            }
            oThresholds.AggregationLevels.push(oAggregationLevel);
          }
        }
      }
      return bConstant;
    };
    _proto.getTemplate = function getTemplate() {
      let chartdelegate = "";
      if (this._customData.targetCollectionPath === "") {
        this.noDataText = this.getTranslatedText("M_CHART_NO_ANNOTATION_SET_TEXT");
      }
      if (this.chartDelegate) {
        chartdelegate = this.chartDelegate;
      } else {
        const contextPath = this.getContextPath();
        chartdelegate = "{name:'sap/fe/macros/chart/ChartDelegate', payload: {collectionName: '" + contextPath + "', contextPath: '" + contextPath + "', parameters:{$$groupId:'$auto.Workers'}, selectionMode: '" + this.selectionMode + "'}}";
      }
      const binding = "{internal>controls/" + this.id + "}";
      if (!this.header) {
        var _this$_chart, _this$_chart$Title;
        this.header = (_this$_chart = this._chart) === null || _this$_chart === void 0 ? void 0 : (_this$_chart$Title = _this$_chart.Title) === null || _this$_chart$Title === void 0 ? void 0 : _this$_chart$Title.toString();
      }
      return xml`
			<macro:ChartAPI xmlns="sap.m" xmlns:macro="sap.fe.macros.chart" xmlns:variant="sap.ui.fl.variants" xmlns:p13n="sap.ui.mdc.p13n" xmlns:unittest="http://schemas.sap.com/sapui5/preprocessorextension/sap.fe.unittesting/1" xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1" xmlns:internalMacro="sap.fe.macros.internal" xmlns:chart="sap.ui.mdc.chart" xmlns:mdc="sap.ui.mdc" xmlns:mdcat="sap.ui.mdc.actiontoolbar" xmlns:core="sap.ui.core" id="${this._apiId}" selectionChange="${this.selectionChange}" stateChange="${this.stateChange}">
				<macro:layoutData>
					<FlexItemData growFactor="1" shrinkFactor="1" />
				</macro:layoutData>
				<mdc:Chart
					binding="${binding}"
					unittest:id="ChartMacroFragment"
					id="${this._contentId}"
					chartType="${this._chartType}"
					sortConditions="${this._sortCondtions}"
					header="${this.header}"
					headerVisible="${this.headerVisible}"
					height="${this.height}"
					width="${this.width}"
					headerLevel="${this.headerLevel}"
					p13nMode="${this.personalization}"
					filter="${this.filter}"
					noDataText="${this.noDataText}"
					autoBindOnInit="${this.autoBindOnInit}"
					delegate="${chartdelegate}"
					macrodata:targetCollectionPath="${this._customData.targetCollectionPath}"
					macrodata:entitySet="${this._customData.entitySet}"
					macrodata:entityType="${this._customData.entityType}"
					macrodata:operationAvailableMap="${this._customData.operationAvailableMap}"
					macrodata:multiSelectDisabledActions="${this._customData.multiSelectDisabledActions}"
					macrodata:segmentedButtonId="${this._customData.segmentedButtonId}"
					macrodata:customAgg="${this._customData.customAgg}"
					macrodata:transAgg="${this._customData.transAgg}"
					macrodata:applySupported="${this._customData.applySupported}"
					macrodata:vizProperties="${this._customData.vizProperties}"
					macrodata:draftSupported="${this._customData.draftSupported}"
					macrodata:multiViews="${this._customData.multiViews}"
					macrodata:selectionPresentationVariantPath="${this._customData.selectionPresentationVariantPath}"
					visible="${this.visible}"
				>
				<mdc:dependents>
					${this.getDependents(this._chartContext)}
					${this.getPersistenceProvider()}
				</mdc:dependents>
				<mdc:items>
					${this.getItems(this._chartContext)}
				</mdc:items>
				${this._actions}
				${this.createVariantManagement()}
			</mdc:Chart>
		</macro:ChartAPI>`;
    };
    return ChartBlock;
  }(BuildingBlockBase), _class3.checkChartVisualizationPath = (visualizations, visualizationPath) => {
    visualizations.forEach(function (visualization) {
      if (visualization.$AnnotationPath.includes(`@${"com.sap.vocabularies.UI.v1.Chart"}`)) {
        visualizationPath = visualization.$AnnotationPath;
      }
    });
    return visualizationPath;
  }, _class3.getVisualizationPath = (props, contextObjectPath, converterContext) => {
    var _contextObjectPath$ta;
    const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

    // fallback to default Chart if metapath is not set
    if (!metaPath) {
      Log.error(`Missing metapath parameter for Chart`);
      return `@${"com.sap.vocabularies.UI.v1.Chart"}`;
    }
    if (contextObjectPath.targetObject.term === "com.sap.vocabularies.UI.v1.Chart") {
      return metaPath; // MetaPath is already pointing to a Chart
    }

    //Need to switch to the context related the PV or SPV
    const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);
    let visualizations = [];
    switch ((_contextObjectPath$ta = contextObjectPath.targetObject) === null || _contextObjectPath$ta === void 0 ? void 0 : _contextObjectPath$ta.term) {
      case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
        if (contextObjectPath.targetObject.PresentationVariant) {
          visualizations = getVisualizationsFromPresentationVariant(contextObjectPath.targetObject.PresentationVariant, metaPath, resolvedTarget.converterContext, true);
        }
        break;
      case "com.sap.vocabularies.UI.v1.PresentationVariant":
        visualizations = getVisualizationsFromPresentationVariant(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
        break;
    }
    const chartViz = visualizations.find(viz => {
      return viz.visualization.term === "com.sap.vocabularies.UI.v1.Chart";
    });
    if (chartViz) {
      return chartViz.annotationPath;
    } else {
      // fallback to default Chart if annotation missing in PV
      Log.error(`Bad metapath parameter for chart: ${contextObjectPath.targetObject.term}`);
      return `@${"com.sap.vocabularies.UI.v1.Chart"}`;
    }
  }, _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "chartDefinition", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "height", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return Device.system.phone ? "75vh" : "100%";
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "100%";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "MULTIPLE";
    }
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "noDataText", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "chartDelegate", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "vizProperties", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "chartActions", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "draftSupported", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "autoBindOnInit", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "navigationPath", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "filter", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "measures", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "_applyIdToContent", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "variantSelected", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "variantSaved", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ChartBlock;
  return _exports;
}, false);
