/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/JSTokenizer", "sap/fe/core/CommonUtils", "sap/fe/core/controls/filterbar/utils/VisualFilterUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/FilterHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/m/library", "sap/ui/core/Core", "sap/ui/core/format/NumberFormat", "sap/ui/mdc/condition/ConditionConverter", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/odata/v4/ODataUtils", "../field/FieldTemplating"], function (JSTokenizer, CommonUtils, VisualFilterUtils, MetaModelConverter, StableIdHelper, TypeGuards, CriticalityFormatters, FilterHelper, CommonHelper, FilterFieldHelper, mLibrary, Core, NumberFormat, ConditionConverter, TypeMap, ODataUtils, FieldTemplating) {
  "use strict";

  var getTextBinding = FieldTemplating.getTextBinding;
  var formatOptions = FilterFieldHelper.formatOptions;
  var constraints = FilterFieldHelper.constraints;
  var getFiltersConditionsFromSelectionVariant = FilterHelper.getFiltersConditionsFromSelectionVariant;
  var buildExpressionForCriticalityColorMicroChart = CriticalityFormatters.buildExpressionForCriticalityColorMicroChart;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var generate = StableIdHelper.generate;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const InteractiveChartHelper = {
    getChartDisplayedValue: function (value, valueFormat, metaPath) {
      const infoPath = generate([metaPath]);
      return "{parts:[{path:'" + value + "',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}" + (valueFormat && valueFormat.ScaleFactor ? ",{value:'" + valueFormat.ScaleFactor.valueOf() + "'}" : ",{path:'internal>scalefactorNumber/" + infoPath + "'}") + (valueFormat && valueFormat.NumberOfFractionalDigits ? ",{value:'" + valueFormat.NumberOfFractionalDigits + "'}" : ",{value:'0'}") + ",{path:'internal>currency/" + infoPath + "'}" + ",{path:'" + value + "',type:'sap.ui.model.odata.type.String', constraints:{'nullable':false}}" + "], formatter:'VisualFilterRuntime.scaleVisualFilterValue'}"; //+ sType.split('#').length ? sType.split('#')[1] : 'Decimal' + "}";
    },

    getChartValue: function (value) {
      return "{path:'" + value + "',type:'sap.ui.model.odata.type.Decimal', constraints:{'nullable':false}}";
    },
    _getCollectionName: function (collection, contextPath, parameters) {
      const collectionObject = collection.targetObject;
      if (isNavigationProperty(collectionObject)) {
        return parameters ? contextPath.getPath() : collectionObject.name;
      } else if (isEntitySet(collectionObject)) {
        return "/" + collectionObject.name;
      } else {
        return collectionObject.name;
      }
    },
    _getBindingPathForParameters: function (filterConditions, metaModel, collectionName, parameters, entitySetPath) {
      const params = [];
      const convertedFilterConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
      const parameterProperties = CommonUtils.getParameterInfo(metaModel, collectionName).parameterProperties;
      if (parameterProperties) {
        for (const i in parameters) {
          const parameter = parameters[i];
          const property = parameterProperties[parameter];
          const entityPath = entitySetPath.split("/")[1];
          const propertyContext = metaModel.createBindingContext(`/${entityPath}/${parameter}`);
          const typeConfig = TypeMap.getTypeConfig(property.$Type, JSTokenizer.parseJS(formatOptions(property, {
            context: propertyContext
          }) || "{}"), JSTokenizer.parseJS(constraints(property, {
            context: propertyContext
          }) || "{}"));
          const condition = convertedFilterConditions[parameter];
          const conditionInternal = condition ? condition[0] : undefined;
          if (conditionInternal) {
            const internalParameterCondition = ConditionConverter.toType(conditionInternal, typeConfig, TypeMap);
            const edmType = property.$Type;
            let value = encodeURIComponent(ODataUtils.formatLiteral(internalParameterCondition.values[0], edmType));
            value = value.replaceAll("'", "\\'");
            params.push(`${parameter}=${value}`);
          }
        }
      }
      const parameterEntitySet = collectionName.slice(0, collectionName.lastIndexOf("/"));
      const targetNavigation = collectionName.substring(collectionName.lastIndexOf("/") + 1);
      // create parameter context
      return `${parameterEntitySet}(${params.toString()})/${targetNavigation}`;
    },
    _getUOMAggregationExpression: function (customAggregate, UoMHasCustomAggregate, UOM, aggregation) {
      let aggregationExpression, UOMExpression;
      const path = UOM && typeof UOM != "string" && UOM.path;
      if (customAggregate) {
        //custom aggregate for a currency or unit of measure corresponding to this aggregatable property
        if (UoMHasCustomAggregate) {
          aggregationExpression = path ? `{ 'unit' : '${path}' }` : "{}";
          UOMExpression = "";
        } else {
          aggregationExpression = "{}";
          UOMExpression = path ? `, '${path}' : {}` : "";
        }
      } else if (aggregation && aggregation.AggregatableProperty && aggregation.AggregatableProperty.value && aggregation.AggregationMethod) {
        aggregationExpression = "{ 'name' : '" + aggregation.AggregatableProperty.value + "', 'with' : '" + aggregation.AggregationMethod + "'}";
        UOMExpression = path ? ", '" + path + "' : {}" : "";
      }
      return {
        aggregationExpression: aggregationExpression,
        UOMExpression: UOMExpression
      };
    },
    getAggregationBinding: function (chartAnnotations, collection, contextPath, textAssociation, dimensionType, sortOrder, selectionVariant, customAggregate, aggregation, UoMHasCustomAggregate, parameters, filterBarContext, draftSupported, chartMeasure) {
      const selectionVariantAnnotation = selectionVariant === null || selectionVariant === void 0 ? void 0 : selectionVariant.targetObject;
      const entityType = filterBarContext ? filterBarContext.getPath() : "";
      const entitySetPath = contextPath.getPath();
      const dimension = chartAnnotations.Dimensions[0].value;
      const filters = [];
      let filterConditions;
      let collectionName = this._getCollectionName(collection, contextPath, parameters);
      const UOM = InteractiveChartHelper.getUoM(chartAnnotations, collection, undefined, customAggregate, aggregation);
      const metaModel = contextPath.getModel();
      if (draftSupported) {
        filters.push({
          operator: "EQ",
          value1: "true",
          value2: null,
          path: "IsActiveEntity",
          isParameter: true
        });
      }
      if (selectionVariantAnnotation) {
        filterConditions = getFiltersConditionsFromSelectionVariant(entitySetPath, metaModel, selectionVariantAnnotation, VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils));
        for (const path in filterConditions) {
          const conditions = filterConditions[path];
          conditions.forEach(function (condition) {
            if (!condition.isParameter) {
              filters.push(condition);
            }
          });
        }
      }
      if (entityType !== `${collectionName}/` && parameters && parameters.length && filterConditions) {
        const bindingPath = this._getBindingPathForParameters(filterConditions, metaModel, collectionName, parameters, entitySetPath);
        collectionName = bindingPath;
      }
      const UOMAggregationExpression = this._getUOMAggregationExpression(customAggregate, UoMHasCustomAggregate, UOM, aggregation);
      const aggregationExpression = UOMAggregationExpression.aggregationExpression;
      const UOMExpression = UOMAggregationExpression.UOMExpression;
      const textAssociationExpression = textAssociation ? "' : { 'additionally' : ['" + textAssociation.path + "'] }" : "' : { }";
      const filterExpression = JSON.stringify(filters);
      return "{path: '" + collectionName + "', templateShareable: true, suspended : true, 'filters' : " + filterExpression + ",'parameters' : {" + InteractiveChartHelper.getSortOrder(chartAnnotations, dimensionType, sortOrder, chartMeasure) + ", '$$aggregation' : {'aggregate' : {'" + chartMeasure + "' : " + aggregationExpression + "},'group' : {'" + dimension + textAssociationExpression + UOMExpression + "} } }" + InteractiveChartHelper.getMaxItems(chartAnnotations) + "}";
    },
    _getOrderExpressionFromMeasure: function (sortOrder, chartMeasure) {
      let sortPropertyName;
      if (sortOrder && sortOrder.length) {
        if (sortOrder[0].DynamicProperty) {
          var _sortOrder$0$DynamicP;
          sortPropertyName = (_sortOrder$0$DynamicP = sortOrder[0].DynamicProperty.$target) === null || _sortOrder$0$DynamicP === void 0 ? void 0 : _sortOrder$0$DynamicP.Name;
        } else {
          var _sortOrder$0$Property;
          sortPropertyName = (_sortOrder$0$Property = sortOrder[0].Property) === null || _sortOrder$0$Property === void 0 ? void 0 : _sortOrder$0$Property.value;
        }
        if (sortPropertyName === chartMeasure) {
          return "'$orderby' : '" + chartMeasure + (sortOrder[0].Descending ? " desc'" : "'");
        }
        return "'$orderby' : '" + chartMeasure + " desc'";
      }
      return "'$orderby' : '" + chartMeasure + " desc'";
    },
    getSortOrder: function (chartAnnotations, dimensionType, sortOrder, chartMeasure) {
      var _sortOrder$0$Property2, _sortOrder$0$Property3;
      if (chartAnnotations.ChartType === "UI.ChartType/Donut" || chartAnnotations.ChartType === "UI.ChartType/Bar") {
        return this._getOrderExpressionFromMeasure(sortOrder, chartMeasure);
      } else if (dimensionType === "Edm.Date" || dimensionType === "Edm.Time" || dimensionType === "Edm.DateTimeOffset") {
        return "'$orderby' : '" + chartAnnotations.Dimensions[0].value + "'";
      } else if (sortOrder && sortOrder.length && ((_sortOrder$0$Property2 = sortOrder[0].Property) === null || _sortOrder$0$Property2 === void 0 ? void 0 : (_sortOrder$0$Property3 = _sortOrder$0$Property2.$target) === null || _sortOrder$0$Property3 === void 0 ? void 0 : _sortOrder$0$Property3.path) === chartAnnotations.Dimensions[0].value) {
        var _sortOrder$0$Property4, _sortOrder$0$Property5;
        return "'$orderby' : '" + ((_sortOrder$0$Property4 = sortOrder[0].Property) === null || _sortOrder$0$Property4 === void 0 ? void 0 : (_sortOrder$0$Property5 = _sortOrder$0$Property4.$target) === null || _sortOrder$0$Property5 === void 0 ? void 0 : _sortOrder$0$Property5.name) + (sortOrder[0].Descending ? " desc'" : "'");
      } else {
        var _chartAnnotations$Dim;
        return "'$orderby' : '" + ((_chartAnnotations$Dim = chartAnnotations.Dimensions[0].$target) === null || _chartAnnotations$Dim === void 0 ? void 0 : _chartAnnotations$Dim.name) + "'";
      }
    },
    getMaxItems: function (chartAnnotations) {
      if (chartAnnotations.ChartType === "UI.ChartType/Bar") {
        return ",'startIndex' : 0,'length' : 3";
      } else if (chartAnnotations.ChartType === "UI.ChartType/Line") {
        return ",'startIndex' : 0,'length' : 6";
      } else {
        return "";
      }
    },
    getColorBinding: function (dataPoint, dimension) {
      var _dimension$$target, _dimension$$target$an, _dimension$$target$an2;
      const valueCriticality = dimension === null || dimension === void 0 ? void 0 : (_dimension$$target = dimension.$target) === null || _dimension$$target === void 0 ? void 0 : (_dimension$$target$an = _dimension$$target.annotations) === null || _dimension$$target$an === void 0 ? void 0 : (_dimension$$target$an2 = _dimension$$target$an.UI) === null || _dimension$$target$an2 === void 0 ? void 0 : _dimension$$target$an2.ValueCriticality;
      if (dataPoint !== null && dataPoint !== void 0 && dataPoint.Criticality) {
        return buildExpressionForCriticalityColorMicroChart(dataPoint);
      } else if (dataPoint !== null && dataPoint !== void 0 && dataPoint.CriticalityCalculation) {
        const oDirection = dataPoint.CriticalityCalculation.ImprovementDirection;
        const oDataPointValue = dataPoint.Value;
        const oDeviationRangeLowValue = dataPoint.CriticalityCalculation.DeviationRangeLowValue.valueOf();
        const oToleranceRangeLowValue = dataPoint.CriticalityCalculation.ToleranceRangeLowValue.valueOf();
        const oAcceptanceRangeLowValue = dataPoint.CriticalityCalculation.AcceptanceRangeLowValue.valueOf();
        const oAcceptanceRangeHighValue = dataPoint.CriticalityCalculation.AcceptanceRangeHighValue.valueOf();
        const oToleranceRangeHighValue = dataPoint.CriticalityCalculation.ToleranceRangeHighValue.valueOf();
        const oDeviationRangeHighValue = dataPoint.CriticalityCalculation.DeviationRangeHighValue.valueOf();
        return CommonHelper.getCriticalityCalculationBinding(oDirection, oDataPointValue, oDeviationRangeLowValue, oToleranceRangeLowValue, oAcceptanceRangeLowValue, oAcceptanceRangeHighValue, oToleranceRangeHighValue, oDeviationRangeHighValue);
      } else if (valueCriticality && valueCriticality.length) {
        return InteractiveChartHelper.getValueCriticality(dimension.value, valueCriticality);
      } else {
        return undefined;
      }
    },
    getValueCriticality: function (dimension, valueCriticality) {
      let result;
      const values = [];
      if (valueCriticality && valueCriticality.length > 0) {
        valueCriticality.forEach(function (valueCriticalityType) {
          if (valueCriticalityType.Value && valueCriticalityType.Criticality) {
            const value = "${" + dimension + "} === '" + valueCriticalityType.Value + "' ? '" + InteractiveChartHelper._getCriticalityFromEnum(valueCriticalityType.Criticality) + "'";
            values.push(value);
          }
        });
        result = values.length > 0 && values.join(" : ") + " : undefined";
      }
      return result ? "{= " + result + " }" : undefined;
    },
    /**
     * This function returns the criticality indicator from annotations if criticality is EnumMember.
     *
     * @param criticality Criticality provided in the annotations
     * @returns Return the indicator for criticality
     * @private
     */
    _getCriticalityFromEnum: function (criticality) {
      const valueColor = mLibrary.ValueColor;
      let indicator;
      if (criticality === "UI.CriticalityType/Negative") {
        indicator = valueColor.Error;
      } else if (criticality === "UI.CriticalityType/Positive") {
        indicator = valueColor.Good;
      } else if (criticality === "UI.CriticalityType/Critical") {
        indicator = valueColor.Critical;
      } else {
        indicator = valueColor.Neutral;
      }
      return indicator;
    },
    getScaleUoMTitle: function (chartAnnotation, collection, metaPath, customAggregate, aggregation, seperator, toolTip) {
      var _chartAnnotation$Meas, _chartAnnotation$Meas2, _chartAnnotation$Meas3, _chartAnnotation$Meas4, _chartAnnotation$Meas5;
      const scaleFactor = chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.MeasureAttributes ? (_chartAnnotation$Meas = chartAnnotation.MeasureAttributes[0]) === null || _chartAnnotation$Meas === void 0 ? void 0 : (_chartAnnotation$Meas2 = _chartAnnotation$Meas.DataPoint) === null || _chartAnnotation$Meas2 === void 0 ? void 0 : (_chartAnnotation$Meas3 = _chartAnnotation$Meas2.$target) === null || _chartAnnotation$Meas3 === void 0 ? void 0 : (_chartAnnotation$Meas4 = _chartAnnotation$Meas3.ValueFormat) === null || _chartAnnotation$Meas4 === void 0 ? void 0 : (_chartAnnotation$Meas5 = _chartAnnotation$Meas4.ScaleFactor) === null || _chartAnnotation$Meas5 === void 0 ? void 0 : _chartAnnotation$Meas5.valueOf() : undefined;
      const infoPath = generate([metaPath]);
      const fixedInteger = NumberFormat.getIntegerInstance({
        style: "short",
        showScale: false,
        shortRefNumber: scaleFactor
      });
      let scale = fixedInteger.getScale();
      let UOM = InteractiveChartHelper.getUoM(chartAnnotation, collection, undefined, customAggregate, aggregation);
      UOM = UOM && (UOM.path ? "${internal>uom/" + infoPath + "}" : "'" + UOM + "'");
      scale = scale ? "'" + scale + "'" : "${internal>scalefactor/" + infoPath + "}";
      if (!seperator) {
        seperator = "|";
      }
      seperator = "' " + seperator + " ' + ";
      const expression = scale && UOM ? seperator + scale + " + ' ' + " + UOM : seperator + (scale || UOM);
      return toolTip ? expression : "{= " + expression + "}";
    },
    getMeasureDimensionTitle: function (chartAnnotation, customAggregate, aggregation) {
      var _chartAnnotation$Dime, _chartAnnotation$Dime2, _chartAnnotation$Dime3, _chartAnnotation$Dime4, _chartAnnotation$Dime5;
      let measureLabel;
      let measurePath;
      if (customAggregate) {
        var _chartAnnotation$Meas6, _chartAnnotation$Meas7;
        measurePath = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Meas6 = chartAnnotation.Measures[0]) === null || _chartAnnotation$Meas6 === void 0 ? void 0 : (_chartAnnotation$Meas7 = _chartAnnotation$Meas6.$target) === null || _chartAnnotation$Meas7 === void 0 ? void 0 : _chartAnnotation$Meas7.name;
      }
      if (chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
        var _chartAnnotation$Dyna, _chartAnnotation$Dyna2, _chartAnnotation$Dyna3;
        measurePath = (_chartAnnotation$Dyna = chartAnnotation.DynamicMeasures[0]) === null || _chartAnnotation$Dyna === void 0 ? void 0 : (_chartAnnotation$Dyna2 = _chartAnnotation$Dyna.$target) === null || _chartAnnotation$Dyna2 === void 0 ? void 0 : (_chartAnnotation$Dyna3 = _chartAnnotation$Dyna2.AggregatableProperty) === null || _chartAnnotation$Dyna3 === void 0 ? void 0 : _chartAnnotation$Dyna3.value;
      } else if (!customAggregate && chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.Measures && (chartAnnotation === null || chartAnnotation === void 0 ? void 0 : chartAnnotation.Measures.length) > 0) {
        var _chartAnnotation$Meas8, _chartAnnotation$Meas9;
        measurePath = (_chartAnnotation$Meas8 = chartAnnotation.Measures[0]) === null || _chartAnnotation$Meas8 === void 0 ? void 0 : (_chartAnnotation$Meas9 = _chartAnnotation$Meas8.$target) === null || _chartAnnotation$Meas9 === void 0 ? void 0 : _chartAnnotation$Meas9.name;
      }
      const dimensionPath = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Dime = chartAnnotation.Dimensions[0]) === null || _chartAnnotation$Dime === void 0 ? void 0 : _chartAnnotation$Dime.value;
      let dimensionLabel = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Dime2 = chartAnnotation.Dimensions[0]) === null || _chartAnnotation$Dime2 === void 0 ? void 0 : (_chartAnnotation$Dime3 = _chartAnnotation$Dime2.$target) === null || _chartAnnotation$Dime3 === void 0 ? void 0 : (_chartAnnotation$Dime4 = _chartAnnotation$Dime3.annotations) === null || _chartAnnotation$Dime4 === void 0 ? void 0 : (_chartAnnotation$Dime5 = _chartAnnotation$Dime4.Common) === null || _chartAnnotation$Dime5 === void 0 ? void 0 : _chartAnnotation$Dime5.Label;
      if (!customAggregate && aggregation) {
        // check if the label is part of aggregated properties (Transformation aggregates)
        measureLabel = aggregation.annotations && aggregation.annotations.Common && aggregation.annotations.Common.Label;
        if (measureLabel === undefined) {
          var _chartAnnotation$Meas10, _chartAnnotation$Meas11, _chartAnnotation$Meas12, _chartAnnotation$Meas13;
          measureLabel = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Meas10 = chartAnnotation.Measures[0]) === null || _chartAnnotation$Meas10 === void 0 ? void 0 : (_chartAnnotation$Meas11 = _chartAnnotation$Meas10.$target) === null || _chartAnnotation$Meas11 === void 0 ? void 0 : (_chartAnnotation$Meas12 = _chartAnnotation$Meas11.annotations) === null || _chartAnnotation$Meas12 === void 0 ? void 0 : (_chartAnnotation$Meas13 = _chartAnnotation$Meas12.Common) === null || _chartAnnotation$Meas13 === void 0 ? void 0 : _chartAnnotation$Meas13.Label;
        }
      } else {
        var _chartAnnotation$Meas14, _chartAnnotation$Meas15, _chartAnnotation$Meas16, _chartAnnotation$Meas17;
        measureLabel = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Meas14 = chartAnnotation.Measures[0]) === null || _chartAnnotation$Meas14 === void 0 ? void 0 : (_chartAnnotation$Meas15 = _chartAnnotation$Meas14.$target) === null || _chartAnnotation$Meas15 === void 0 ? void 0 : (_chartAnnotation$Meas16 = _chartAnnotation$Meas15.annotations) === null || _chartAnnotation$Meas16 === void 0 ? void 0 : (_chartAnnotation$Meas17 = _chartAnnotation$Meas16.Common) === null || _chartAnnotation$Meas17 === void 0 ? void 0 : _chartAnnotation$Meas17.Label;
      }
      if (measureLabel === undefined) {
        measureLabel = measurePath;
      }
      if (dimensionLabel === undefined) {
        dimensionLabel = dimensionPath;
      }
      return Core.getLibraryResourceBundle("sap.fe.macros").getText("M_INTERACTIVE_CHART_HELPER_VISUALFILTER_MEASURE_DIMENSION_TITLE", [measureLabel, dimensionLabel]);
    },
    getToolTip: function (chartAnnotation, collection, metaPath, customAggregate, aggregation, renderLineChart) {
      const chartType = chartAnnotation && chartAnnotation["ChartType"];
      let measureDimensionToolTip = InteractiveChartHelper.getMeasureDimensionTitle(chartAnnotation, customAggregate, aggregation);
      measureDimensionToolTip = CommonHelper.escapeSingleQuotes(measureDimensionToolTip);
      if (renderLineChart === "false" && chartType === "UI.ChartType/Line") {
        return `{= '${measureDimensionToolTip}'}`;
      }
      const seperator = Core.getLibraryResourceBundle("sap.fe.macros").getText("M_INTERACTIVE_CHART_HELPER_VISUALFILTER_TOOLTIP_SEPERATOR");
      const infoPath = generate([metaPath]);
      const scaleUOMTooltip = InteractiveChartHelper.getScaleUoMTitle(chartAnnotation, collection, infoPath, customAggregate, aggregation, seperator, true);
      return "{= '" + measureDimensionToolTip + (scaleUOMTooltip ? "' + " + scaleUOMTooltip : "'") + "}";
    },
    _getUOM: function (UOMObjectPath, UOM, collection, customData, aggregatablePropertyPath) {
      const UOMObject = {};
      const collectionObject = collection === null || collection === void 0 ? void 0 : collection.targetObject;
      if (UOMObjectPath && UOM) {
        // check if the UOM is part of Measure annotations(Custom aggregates)
        UOMObject[UOM] = {
          $Path: UOMObjectPath.path
        };
        return customData && UOMObjectPath.path ? JSON.stringify(UOMObject) : UOMObjectPath;
      } else if (aggregatablePropertyPath) {
        var _collectionObject$tar, _propertyAnnotations$;
        // check if the UOM is part of base property annotations(Transformation aggregates)
        const entityProperties = collectionObject.entityType ? collectionObject.entityType.entityProperties : (_collectionObject$tar = collectionObject.targetType) === null || _collectionObject$tar === void 0 ? void 0 : _collectionObject$tar.entityProperties;
        const propertyAnnotations = entityProperties === null || entityProperties === void 0 ? void 0 : entityProperties.find(property => property.name == aggregatablePropertyPath);
        if (propertyAnnotations !== null && propertyAnnotations !== void 0 && (_propertyAnnotations$ = propertyAnnotations.annotations) !== null && _propertyAnnotations$ !== void 0 && _propertyAnnotations$.Measures && UOM) {
          var _propertyAnnotations$2, _UOMObjectPath;
          UOMObjectPath = propertyAnnotations === null || propertyAnnotations === void 0 ? void 0 : (_propertyAnnotations$2 = propertyAnnotations.annotations) === null || _propertyAnnotations$2 === void 0 ? void 0 : _propertyAnnotations$2.Measures[UOM];
          UOMObject[UOM] = {
            $Path: (_UOMObjectPath = UOMObjectPath) === null || _UOMObjectPath === void 0 ? void 0 : _UOMObjectPath.path
          };
        }
        return UOMObjectPath && customData && UOMObjectPath.path ? JSON.stringify(UOMObject) : UOMObjectPath;
      }
    },
    getUoM: function (chartAnnotation, collection, customData, customAggregate, aggregation) {
      var _measure, _measure2;
      let measure = {};
      if (customAggregate) {
        measure = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : chartAnnotation.Measures[0];
      }
      if (chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.DynamicMeasures && chartAnnotation.DynamicMeasures.length > 0) {
        var _chartAnnotation$Dyna4, _chartAnnotation$Dyna5, _chartAnnotation$Dyna6, _chartAnnotation$Dyna7, _chartAnnotation$Dyna8;
        measure = (_chartAnnotation$Dyna4 = chartAnnotation.DynamicMeasures[0]) === null || _chartAnnotation$Dyna4 === void 0 ? void 0 : (_chartAnnotation$Dyna5 = _chartAnnotation$Dyna4.$target) === null || _chartAnnotation$Dyna5 === void 0 ? void 0 : (_chartAnnotation$Dyna6 = _chartAnnotation$Dyna5.AggregatableProperty) === null || _chartAnnotation$Dyna6 === void 0 ? void 0 : (_chartAnnotation$Dyna7 = _chartAnnotation$Dyna6.$target) === null || _chartAnnotation$Dyna7 === void 0 ? void 0 : (_chartAnnotation$Dyna8 = _chartAnnotation$Dyna7.annotations) === null || _chartAnnotation$Dyna8 === void 0 ? void 0 : _chartAnnotation$Dyna8.Measures;
      } else if (!customAggregate && chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.Measures && chartAnnotation.Measures.length > 0) {
        measure = chartAnnotation.Measures[0];
      }
      const ISOCurrency = (_measure = measure) === null || _measure === void 0 ? void 0 : _measure.ISOCurrency;
      const unit = (_measure2 = measure) === null || _measure2 === void 0 ? void 0 : _measure2.Unit;
      let aggregatablePropertyPath;
      if (!customAggregate && aggregation) {
        aggregatablePropertyPath = aggregation.AggregatableProperty && aggregation.AggregatableProperty.value;
      } else {
        var _measure3;
        aggregatablePropertyPath = (_measure3 = measure) === null || _measure3 === void 0 ? void 0 : _measure3.value;
      }
      return this._getUOM(ISOCurrency, "ISOCurrency", collection, customData, aggregatablePropertyPath) || this._getUOM(unit, "Unit", collection, customData, aggregatablePropertyPath);
    },
    getScaleFactor: function (valueFormat) {
      if (valueFormat && valueFormat.ScaleFactor) {
        return valueFormat.ScaleFactor.valueOf();
      }
      return undefined;
    },
    getUoMVisiblity: function (chartAnnotation, showError) {
      const chartType = chartAnnotation && chartAnnotation["ChartType"];
      if (showError) {
        return false;
      } else if (!(chartType === "UI.ChartType/Bar" || chartType === "UI.ChartType/Line")) {
        return false;
      } else {
        return true;
      }
    },
    getInParameterFiltersBinding: function (inParameters) {
      if (inParameters.length > 0) {
        const parts = [];
        let paths = "";
        inParameters.forEach(function (inParameter) {
          if (inParameter.localDataProperty) {
            parts.push(`{path:'$filters>/conditions/${inParameter.localDataProperty}'}`);
          }
        });
        if (parts.length > 0) {
          paths = parts.join();
          return `{parts:[${paths}], formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.getFiltersFromConditions'}`;
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    },
    getfilterCountBinding: function (chartAnnotation) {
      var _chartAnnotation$Dime6, _chartAnnotation$Dime7;
      const dimension = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$Dime6 = chartAnnotation.Dimensions[0]) === null || _chartAnnotation$Dime6 === void 0 ? void 0 : (_chartAnnotation$Dime7 = _chartAnnotation$Dime6.$target) === null || _chartAnnotation$Dime7 === void 0 ? void 0 : _chartAnnotation$Dime7.name;
      return "{path:'$filters>/conditions/" + dimension + "', formatter:'sap.fe.macros.visualfilters.VisualFilterRuntime.getFilterCounts'}";
    },
    getInteractiveChartProperties: function (visualFilter) {
      const chartAnnotation = visualFilter.chartAnnotation;
      const interactiveChartProperties = {};
      if (visualFilter.chartMeasure && chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.Dimensions && chartAnnotation.Dimensions[0]) {
        var _visualFilter$metaPat, _dimension$$target2, _dimension$$target2$a, _dimension$$target2$a2, _dimension$$target3, _dataPointAnnotation, _visualFilter$metaPat2, _visualFilter$metaPat3, _dataPointAnnotation2, _visualFilter$metaPat4;
        const id = generate([(_visualFilter$metaPat = visualFilter.metaPath) === null || _visualFilter$metaPat === void 0 ? void 0 : _visualFilter$metaPat.getPath()]);
        interactiveChartProperties.showErrorExpression = "${internal>" + id + "/showError}";
        interactiveChartProperties.errorMessageExpression = "{internal>" + id + "/errorMessage}";
        interactiveChartProperties.errorMessageTitleExpression = "{internal>" + id + "/errorMessageTitle}";
        let dataPointAnnotation;
        if (chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.MeasureAttributes && chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.MeasureAttributes[0]) {
          var _chartAnnotation$Meas18;
          dataPointAnnotation = chartAnnotation !== null && chartAnnotation !== void 0 && (_chartAnnotation$Meas18 = chartAnnotation.MeasureAttributes[0]) !== null && _chartAnnotation$Meas18 !== void 0 && _chartAnnotation$Meas18.DataPoint ? chartAnnotation === null || chartAnnotation === void 0 ? void 0 : chartAnnotation.MeasureAttributes[0].DataPoint.$target : chartAnnotation === null || chartAnnotation === void 0 ? void 0 : chartAnnotation.MeasureAttributes[0];
        }
        const dimension = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : chartAnnotation.Dimensions[0];
        const parameters = CommonHelper.getParameters(visualFilter.contextPath.getObject(), {
          context: visualFilter.contextPath
        });
        const dimensionText = dimension === null || dimension === void 0 ? void 0 : (_dimension$$target2 = dimension.$target) === null || _dimension$$target2 === void 0 ? void 0 : (_dimension$$target2$a = _dimension$$target2.annotations) === null || _dimension$$target2$a === void 0 ? void 0 : (_dimension$$target2$a2 = _dimension$$target2$a.Common) === null || _dimension$$target2$a2 === void 0 ? void 0 : _dimension$$target2$a2.Text;
        const contextObjectPath = getInvolvedDataModelObjects(visualFilter.metaPath, visualFilter.contextPath).targetObject;
        const collection = getInvolvedDataModelObjects(visualFilter.contextPath);
        const selectionVariant = visualFilter.selectionVariantAnnotation ? getInvolvedDataModelObjects(visualFilter.selectionVariantAnnotation) : undefined;
        const sortOrder = contextObjectPath.SortOrder;
        interactiveChartProperties.aggregationBinding = InteractiveChartHelper.getAggregationBinding(chartAnnotation, collection, visualFilter.contextPath, dimensionText, (_dimension$$target3 = dimension.$target) === null || _dimension$$target3 === void 0 ? void 0 : _dimension$$target3.type, sortOrder, selectionVariant, visualFilter.customAggregate, visualFilter.aggregateProperties, visualFilter.UoMHasCustomAggregate, parameters, visualFilter.filterBarEntityType, visualFilter.draftSupported, visualFilter.chartMeasure);
        interactiveChartProperties.scalefactor = InteractiveChartHelper.getScaleFactor((_dataPointAnnotation = dataPointAnnotation) === null || _dataPointAnnotation === void 0 ? void 0 : _dataPointAnnotation.ValueFormat);
        interactiveChartProperties.uom = InteractiveChartHelper.getUoM(chartAnnotation, collection, true, visualFilter.customAggregate, visualFilter.aggregateProperties);
        interactiveChartProperties.inParameters = CommonHelper.stringifyCustomData(visualFilter.inParameters);
        interactiveChartProperties.inParameterFilters = visualFilter.inParameters ? InteractiveChartHelper.getInParameterFiltersBinding(visualFilter.inParameters) : undefined;
        interactiveChartProperties.selectionVariantAnnotation = visualFilter.selectionVariantAnnotation ? CommonHelper.stringifyCustomData(visualFilter.selectionVariantAnnotation) : undefined;
        interactiveChartProperties.stringifiedParameters = CommonHelper.stringifyCustomData(parameters);
        const dimensionContext = (_visualFilter$metaPat2 = visualFilter.metaPath) === null || _visualFilter$metaPat2 === void 0 ? void 0 : (_visualFilter$metaPat3 = _visualFilter$metaPat2.getModel()) === null || _visualFilter$metaPat3 === void 0 ? void 0 : _visualFilter$metaPat3.createBindingContext(visualFilter.contextPath.getPath() + "/@" + dimension.fullyQualifiedName.split("@")[1]);
        if (dimensionContext) {
          const dimensionObject = getInvolvedDataModelObjects(dimensionContext, visualFilter.contextPath);
          interactiveChartProperties.chartLabel = getTextBinding(dimensionObject, {});
        }
        interactiveChartProperties.measure = InteractiveChartHelper.getChartValue(visualFilter.chartMeasure);
        interactiveChartProperties.displayedValue = InteractiveChartHelper.getChartDisplayedValue(visualFilter.chartMeasure, (_dataPointAnnotation2 = dataPointAnnotation) === null || _dataPointAnnotation2 === void 0 ? void 0 : _dataPointAnnotation2.ValueFormat, (_visualFilter$metaPat4 = visualFilter.metaPath) === null || _visualFilter$metaPat4 === void 0 ? void 0 : _visualFilter$metaPat4.getPath());
        interactiveChartProperties.color = InteractiveChartHelper.getColorBinding(dataPointAnnotation, dimension);
      }
      return interactiveChartProperties;
    }
  };
  return InteractiveChartHelper;
}, false);
