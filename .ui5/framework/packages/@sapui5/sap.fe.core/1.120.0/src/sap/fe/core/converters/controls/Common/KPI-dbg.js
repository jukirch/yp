/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/SelectionVariantHelper", "sap/fe/core/formatters/TableFormatterTypes", "sap/fe/core/helpers/TypeGuards", "../../helpers/Aggregation", "../../helpers/ID", "./Criticality"], function (IssueManager, SelectionVariantHelper, TableFormatterTypes, TypeGuards, Aggregation, ID, Criticality) {
  "use strict";

  var _exports = {};
  var getMessageTypeFromCriticalityType = Criticality.getMessageTypeFromCriticalityType;
  var getKPIID = ID.getKPIID;
  var AggregationHelper = Aggregation.AggregationHelper;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var MessageType = TableFormatterTypes.MessageType;
  var getFilterDefinitionsFromSelectionVariant = SelectionVariantHelper.getFilterDefinitionsFromSelectionVariant;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  const DeviationIndicatorFromTrendType = {
    "UI.TrendType/StrongUp": "Up",
    "UI.TrendType/Up": "Up",
    "UI.TrendType/StrongDown": "Down",
    "UI.TrendType/Down": "Down",
    "UI.TrendType/Sideways": "None"
  };
  const KPIChartTypeFromUI = {
    "UI.ChartType/ColumnStacked": "StackedColumn",
    "UI.ChartType/BarStacked": "StackedBar",
    "UI.ChartType/Donut": "Donut",
    "UI.ChartType/Line": "Line",
    "UI.ChartType/Bubble": "bubble",
    "UI.ChartType/Column": "column",
    "UI.ChartType/Bar": "bar",
    "UI.ChartType/VerticalBullet": "vertical_bullet",
    "UI.ChartType/Combination": "combination",
    "UI.ChartType/Scatter": "scatter"
  };
  function convertKPIChart(chartAnnotation, presentationVariantAnnotation) {
    var _presentationVariantA, _presentationVariantA2;
    if (chartAnnotation.Measures === undefined) {
      // We need at least 1 measure (but no dimension is allowed, e.g. for bubble chart)
      return undefined;
    }
    const charDimensions = chartAnnotation.Dimensions ? chartAnnotation.Dimensions.map(propertyPath => {
      var _chartAnnotation$Dime, _propertyPath$$target, _propertyPath$$target2, _propertyPath$$target3, _dimAttribute$Role;
      const dimAttribute = (_chartAnnotation$Dime = chartAnnotation.DimensionAttributes) === null || _chartAnnotation$Dime === void 0 ? void 0 : _chartAnnotation$Dime.find(attribute => {
        var _attribute$Dimension;
        return ((_attribute$Dimension = attribute.Dimension) === null || _attribute$Dimension === void 0 ? void 0 : _attribute$Dimension.value) === propertyPath.value;
      });
      return {
        name: propertyPath.value,
        label: ((_propertyPath$$target = propertyPath.$target) === null || _propertyPath$$target === void 0 ? void 0 : (_propertyPath$$target2 = _propertyPath$$target.annotations.Common) === null || _propertyPath$$target2 === void 0 ? void 0 : (_propertyPath$$target3 = _propertyPath$$target2.Label) === null || _propertyPath$$target3 === void 0 ? void 0 : _propertyPath$$target3.toString()) || propertyPath.value,
        role: dimAttribute === null || dimAttribute === void 0 ? void 0 : (_dimAttribute$Role = dimAttribute.Role) === null || _dimAttribute$Role === void 0 ? void 0 : _dimAttribute$Role.replace("UI.ChartDimensionRoleType/", "")
      };
    }) : [];
    const chartMeasures = chartAnnotation.Measures.map(propertyPath => {
      var _chartAnnotation$Meas, _propertyPath$$target4, _propertyPath$$target5, _propertyPath$$target6, _measureAttribute$Rol;
      const measureAttribute = (_chartAnnotation$Meas = chartAnnotation.MeasureAttributes) === null || _chartAnnotation$Meas === void 0 ? void 0 : _chartAnnotation$Meas.find(attribute => {
        var _attribute$Measure;
        return ((_attribute$Measure = attribute.Measure) === null || _attribute$Measure === void 0 ? void 0 : _attribute$Measure.value) === propertyPath.value;
      });
      return {
        name: propertyPath.value,
        label: ((_propertyPath$$target4 = propertyPath.$target) === null || _propertyPath$$target4 === void 0 ? void 0 : (_propertyPath$$target5 = _propertyPath$$target4.annotations.Common) === null || _propertyPath$$target5 === void 0 ? void 0 : (_propertyPath$$target6 = _propertyPath$$target5.Label) === null || _propertyPath$$target6 === void 0 ? void 0 : _propertyPath$$target6.toString()) || propertyPath.value,
        role: measureAttribute === null || measureAttribute === void 0 ? void 0 : (_measureAttribute$Rol = measureAttribute.Role) === null || _measureAttribute$Rol === void 0 ? void 0 : _measureAttribute$Rol.replace("UI.ChartMeasureRoleType/", "")
      };
    });
    return {
      chartType: KPIChartTypeFromUI[chartAnnotation.ChartType] || "Line",
      dimensions: charDimensions,
      measures: chartMeasures,
      sortOrder: presentationVariantAnnotation === null || presentationVariantAnnotation === void 0 ? void 0 : (_presentationVariantA = presentationVariantAnnotation.SortOrder) === null || _presentationVariantA === void 0 ? void 0 : _presentationVariantA.map(sortOrder => {
        var _sortOrder$Property;
        return {
          name: ((_sortOrder$Property = sortOrder.Property) === null || _sortOrder$Property === void 0 ? void 0 : _sortOrder$Property.value) || "",
          descending: !!sortOrder.Descending
        };
      }),
      maxItems: presentationVariantAnnotation === null || presentationVariantAnnotation === void 0 ? void 0 : (_presentationVariantA2 = presentationVariantAnnotation.MaxItems) === null || _presentationVariantA2 === void 0 ? void 0 : _presentationVariantA2.valueOf()
    };
  }
  function updateCurrency(datapointAnnotation, kpiDef) {
    var _targetValueProperty$, _targetValueProperty$3;
    const targetValueProperty = datapointAnnotation.Value.$target;
    if ((_targetValueProperty$ = targetValueProperty.annotations.Measures) !== null && _targetValueProperty$ !== void 0 && _targetValueProperty$.ISOCurrency) {
      var _targetValueProperty$2;
      const currency = (_targetValueProperty$2 = targetValueProperty.annotations.Measures) === null || _targetValueProperty$2 === void 0 ? void 0 : _targetValueProperty$2.ISOCurrency;
      if (isPathAnnotationExpression(currency)) {
        kpiDef.datapoint.unit = {
          value: currency.$target.name,
          isCurrency: true,
          isPath: true
        };
      } else {
        kpiDef.datapoint.unit = {
          value: currency.toString(),
          isCurrency: true,
          isPath: false
        };
      }
    } else if ((_targetValueProperty$3 = targetValueProperty.annotations.Measures) !== null && _targetValueProperty$3 !== void 0 && _targetValueProperty$3.Unit) {
      var _targetValueProperty$4;
      const unit = (_targetValueProperty$4 = targetValueProperty.annotations.Measures) === null || _targetValueProperty$4 === void 0 ? void 0 : _targetValueProperty$4.Unit;
      if (isPathAnnotationExpression(unit)) {
        kpiDef.datapoint.unit = {
          value: unit.$target.name,
          isCurrency: false,
          isPath: true
        };
      } else {
        kpiDef.datapoint.unit = {
          value: unit.toString(),
          isCurrency: false,
          isPath: false
        };
      }
    }
  }
  function updateCriticality(datapointAnnotation, aggregationHelper, kpiDef) {
    if (datapointAnnotation.Criticality) {
      if (isPathAnnotationExpression(datapointAnnotation.Criticality)) {
        // Criticality is a path --> check if the corresponding property is aggregatable
        const criticalityProperty = datapointAnnotation.Criticality.$target;
        if (criticalityProperty && aggregationHelper.isPropertyAggregatable(criticalityProperty)) {
          kpiDef.datapoint.criticalityPath = datapointAnnotation.Criticality.path;
        } else {
          // The property isn't aggregatable --> we ignore it
          kpiDef.datapoint.criticalityValue = MessageType.None;
        }
      } else {
        // Criticality is an enum Value --> get the corresponding static value
        kpiDef.datapoint.criticalityValue = getMessageTypeFromCriticalityType(datapointAnnotation.Criticality);
      }
    } else if (datapointAnnotation.CriticalityCalculation) {
      kpiDef.datapoint.criticalityCalculationMode = datapointAnnotation.CriticalityCalculation.ImprovementDirection;
      kpiDef.datapoint.criticalityCalculationThresholds = [];
      switch (kpiDef.datapoint.criticalityCalculationMode) {
        case "UI.ImprovementDirectionType/Target":
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.DeviationRangeLowValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.ToleranceRangeLowValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.AcceptanceRangeLowValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.AcceptanceRangeHighValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.ToleranceRangeHighValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.DeviationRangeHighValue);
          break;
        case "UI.ImprovementDirectionType/Minimize":
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.AcceptanceRangeHighValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.ToleranceRangeHighValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.DeviationRangeHighValue);
          break;
        case "UI.ImprovementDirectionType/Maximize":
        default:
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.DeviationRangeLowValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.ToleranceRangeLowValue);
          kpiDef.datapoint.criticalityCalculationThresholds.push(datapointAnnotation.CriticalityCalculation.AcceptanceRangeLowValue);
      }
    } else {
      kpiDef.datapoint.criticalityValue = MessageType.None;
    }
  }
  function updateTrend(datapointAnnotation, aggregationHelper, kpiDef) {
    if (datapointAnnotation.Trend) {
      if (isPathAnnotationExpression(datapointAnnotation.Trend)) {
        // Trend is a path --> check if the corresponding property is aggregatable
        const trendProperty = datapointAnnotation.Trend.$target;
        if (trendProperty && aggregationHelper.isPropertyAggregatable(trendProperty)) {
          kpiDef.datapoint.trendPath = datapointAnnotation.Trend.path;
        } else {
          // The property isn't aggregatable --> we ignore it
          kpiDef.datapoint.trendValue = "None";
        }
      } else {
        // Trend is an enum Value --> get the corresponding static value
        kpiDef.datapoint.trendValue = DeviationIndicatorFromTrendType[datapointAnnotation.Trend] || "None";
      }
    } else if (datapointAnnotation.TrendCalculation) {
      kpiDef.datapoint.trendCalculationIsRelative = datapointAnnotation.TrendCalculation.IsRelativeDifference ? true : false;
      if (datapointAnnotation.TrendCalculation.ReferenceValue.$target) {
        // Reference value is a path --> check if the corresponding property is aggregatable
        const referenceProperty = datapointAnnotation.TrendCalculation.ReferenceValue.$target;
        if (aggregationHelper.isPropertyAggregatable(referenceProperty)) {
          kpiDef.datapoint.trendCalculationReferencePath = datapointAnnotation.TrendCalculation.ReferenceValue.path;
        } else {
          // The property isn't aggregatable --> we ignore it and switch back to trend 'None'
          kpiDef.datapoint.trendValue = "None";
        }
      } else {
        // Reference value is a static value
        kpiDef.datapoint.trendCalculationReferenceValue = datapointAnnotation.TrendCalculation.ReferenceValue;
      }
      if (kpiDef.datapoint.trendCalculationReferencePath !== undefined || kpiDef.datapoint.trendCalculationReferenceValue !== undefined) {
        kpiDef.datapoint.trendCalculationTresholds = [datapointAnnotation.TrendCalculation.StrongDownDifference.valueOf(), datapointAnnotation.TrendCalculation.DownDifference.valueOf(), datapointAnnotation.TrendCalculation.UpDifference.valueOf(), datapointAnnotation.TrendCalculation.StrongUpDifference.valueOf()];
      }
    } else {
      kpiDef.datapoint.trendValue = "None";
    }
  }
  function updateTarget(datapointAnnotation, aggregationHelper, kpiDef) {
    if (datapointAnnotation.TargetValue) {
      if (datapointAnnotation.TargetValue.$target) {
        // Target value is a path --> check if the corresponding property is aggregatable (otherwise ignore)
        const targetProperty = datapointAnnotation.TargetValue.$target;
        if (aggregationHelper.isPropertyAggregatable(targetProperty)) {
          kpiDef.datapoint.targetPath = datapointAnnotation.TargetValue.path;
        }
      } else {
        // Target value is a static value
        kpiDef.datapoint.targetValue = datapointAnnotation.TargetValue;
      }
    }
  }
  function getNavigationInfoFromProperty(property) {
    const annotations = property.annotations["Common"] || {};
    // Look for the semanticObject annotation (if any)
    let semanticObjectAnnotation;
    Object.keys(annotations).forEach(annotationKey => {
      const annotation = annotations[annotationKey];
      if (annotation.term === "com.sap.vocabularies.Common.v1.SemanticObject") {
        if (!annotation.qualifier || !semanticObjectAnnotation) {
          // We always take the annotation without qualifier if there's one, otherwise we take the first one
          semanticObjectAnnotation = annotation;
        }
      }
    });
    if (semanticObjectAnnotation) {
      const result = {
        semanticObject: semanticObjectAnnotation.toString(),
        unavailableActions: []
      };

      // Look for the unavailable actions (if any)
      const annotationKey = Object.keys(annotations).find(key => {
        var _semanticObjectAnnota;
        return annotations[key].term === "com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions" && annotations[key].qualifier === ((_semanticObjectAnnota = semanticObjectAnnotation) === null || _semanticObjectAnnota === void 0 ? void 0 : _semanticObjectAnnota.qualifier);
      });
      if (annotationKey) {
        result.unavailableActions = annotations[annotationKey];
      }
      return result;
    } else {
      return undefined;
    }
  }
  function isCustomKPIConfiguration(kpiConfig) {
    return !!kpiConfig.template;
  }
  function createAnalyticalKPIDefinition(converterContext, kpiConfig, kpiName) {
    var _datapointAnnotation$, _datapointAnnotation$2;
    const kpiConverterContext = converterContext.getConverterContextFor(`/${kpiConfig.entitySet}`);
    const aggregationHelper = new AggregationHelper(kpiConverterContext.getEntityType(), kpiConverterContext);
    if (!aggregationHelper.isAnalyticsSupported()) {
      // The entity doesn't support analytical queries
      converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.KPI_ISSUES.NO_ANALYTICS + kpiConfig.entitySet);
      return undefined;
    }
    let selectionVariantAnnotation;
    let datapointAnnotation;
    let presentationVariantAnnotation;
    let chartAnnotation;
    let navigationInfo;

    // Search for a KPI with the qualifier frmo the manifest
    const aKPIAnnotations = kpiConverterContext.getAnnotationsByTerm("UI", "com.sap.vocabularies.UI.v1.KPI");
    const targetKPI = aKPIAnnotations.find(kpi => {
      return kpi.qualifier === kpiConfig.qualifier;
    });
    if (targetKPI) {
      var _targetKPI$Detail, _presentationVariantA3, _presentationVariantA4, _presentationVariantA5, _targetKPI$Detail2;
      datapointAnnotation = targetKPI.DataPoint;
      selectionVariantAnnotation = targetKPI.SelectionVariant;
      presentationVariantAnnotation = (_targetKPI$Detail = targetKPI.Detail) === null || _targetKPI$Detail === void 0 ? void 0 : _targetKPI$Detail.DefaultPresentationVariant;
      chartAnnotation = (_presentationVariantA3 = presentationVariantAnnotation) === null || _presentationVariantA3 === void 0 ? void 0 : (_presentationVariantA4 = _presentationVariantA3.Visualizations) === null || _presentationVariantA4 === void 0 ? void 0 : (_presentationVariantA5 = _presentationVariantA4.find(viz => {
        return isAnnotationOfType(viz.$target, "com.sap.vocabularies.UI.v1.ChartDefinitionType");
      })) === null || _presentationVariantA5 === void 0 ? void 0 : _presentationVariantA5.$target;
      if ((_targetKPI$Detail2 = targetKPI.Detail) !== null && _targetKPI$Detail2 !== void 0 && _targetKPI$Detail2.SemanticObject) {
        var _targetKPI$Detail$Act;
        navigationInfo = {
          semanticObject: targetKPI.Detail.SemanticObject.toString(),
          action: (_targetKPI$Detail$Act = targetKPI.Detail.Action) === null || _targetKPI$Detail$Act === void 0 ? void 0 : _targetKPI$Detail$Act.toString(),
          unavailableActions: []
        };
      }
    } else {
      // Fallback: try to find a SPV with the same qualifier
      const aSPVAnnotations = kpiConverterContext.getAnnotationsByTerm("UI", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant");
      const targetSPV = aSPVAnnotations.find(spv => {
        return spv.qualifier === kpiConfig.qualifier;
      });
      if (targetSPV) {
        var _presentationVariantA6, _presentationVariantA7, _presentationVariantA8, _presentationVariantA9, _presentationVariantA10, _presentationVariantA11;
        selectionVariantAnnotation = targetSPV.SelectionVariant;
        presentationVariantAnnotation = targetSPV.PresentationVariant;
        datapointAnnotation = (_presentationVariantA6 = presentationVariantAnnotation) === null || _presentationVariantA6 === void 0 ? void 0 : (_presentationVariantA7 = _presentationVariantA6.Visualizations) === null || _presentationVariantA7 === void 0 ? void 0 : (_presentationVariantA8 = _presentationVariantA7.find(viz => {
          return isAnnotationOfType(viz.$target, "com.sap.vocabularies.UI.v1.DataPointType");
        })) === null || _presentationVariantA8 === void 0 ? void 0 : _presentationVariantA8.$target;
        chartAnnotation = (_presentationVariantA9 = presentationVariantAnnotation) === null || _presentationVariantA9 === void 0 ? void 0 : (_presentationVariantA10 = _presentationVariantA9.Visualizations) === null || _presentationVariantA10 === void 0 ? void 0 : (_presentationVariantA11 = _presentationVariantA10.find(viz => {
          return isAnnotationOfType(viz.$target, "com.sap.vocabularies.UI.v1.ChartDefinitionType");
        })) === null || _presentationVariantA11 === void 0 ? void 0 : _presentationVariantA11.$target;
      } else {
        // Couldn't find a KPI or a SPV annotation with the qualifier from the manifest
        converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.KPI_ISSUES.KPI_NOT_FOUND + kpiConfig.qualifier);
        return undefined;
      }
    }
    if (!presentationVariantAnnotation || !datapointAnnotation || !chartAnnotation) {
      // Couldn't find a chart or datapoint definition
      converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.KPI_ISSUES.KPI_DETAIL_NOT_FOUND + kpiConfig.qualifier);
      return undefined;
    }
    const datapointProperty = datapointAnnotation.Value.$target;
    if (!aggregationHelper.isPropertyAggregatable(datapointProperty)) {
      // The main property of the KPI is not aggregatable --> We can't calculate its value so we ignore the KPI
      converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.KPI_ISSUES.MAIN_PROPERTY_NOT_AGGREGATABLE + kpiConfig.qualifier);
      return undefined;
    }

    // Chart definition
    const chartDef = convertKPIChart(chartAnnotation, presentationVariantAnnotation);
    if (!chartDef) {
      return undefined;
    }
    const kpiDef = {
      type: "Analytical",
      id: getKPIID(kpiName),
      entitySet: kpiConfig.entitySet,
      datapoint: {
        propertyPath: datapointAnnotation.Value.path,
        annotationPath: kpiConverterContext.getEntitySetBasedAnnotationPath(datapointAnnotation.fullyQualifiedName),
        title: (_datapointAnnotation$ = datapointAnnotation.Title) === null || _datapointAnnotation$ === void 0 ? void 0 : _datapointAnnotation$.toString(),
        description: (_datapointAnnotation$2 = datapointAnnotation.Description) === null || _datapointAnnotation$2 === void 0 ? void 0 : _datapointAnnotation$2.toString()
      },
      selectionVariantFilterDefinitions: selectionVariantAnnotation ? getFilterDefinitionsFromSelectionVariant(selectionVariantAnnotation) : undefined,
      chart: chartDef
    };

    // Navigation
    if (!navigationInfo) {
      // No navigationInfo was found in the KPI annotation --> try the outbound navigation from the manifest
      if (kpiConfig.detailNavigation) {
        navigationInfo = {
          outboundNavigation: kpiConfig.detailNavigation
        };
      } else {
        // No outbound navigation in the manifest --> try the semantic object on the Datapoint value
        navigationInfo = getNavigationInfoFromProperty(datapointProperty);
      }
    }
    if (navigationInfo) {
      kpiDef.navigation = navigationInfo;
    }
    updateCurrency(datapointAnnotation, kpiDef);
    updateCriticality(datapointAnnotation, aggregationHelper, kpiDef);
    updateTrend(datapointAnnotation, aggregationHelper, kpiDef);
    updateTarget(datapointAnnotation, aggregationHelper, kpiDef);
    return kpiDef;
  }
  function createKPIDefinition(kpiName, kpiConfig, converterContext) {
    if (isCustomKPIConfiguration(kpiConfig)) {
      return {
        type: "Custom",
        key: kpiName,
        template: kpiConfig.template
      };
    } else {
      return createAnalyticalKPIDefinition(converterContext, kpiConfig, kpiName);
    }
  }

  /**
   * Creates the KPI definitions from the manifest and the annotations.
   *
   * @param converterContext The converter context for the page
   * @returns Returns an array of KPI definitions
   */
  function getKPIDefinitions(converterContext) {
    const kpiConfigs = converterContext.getManifestWrapper().getKPIConfiguration(),
      kpiDefs = [];
    Object.keys(kpiConfigs).forEach(kpiName => {
      const oDef = createKPIDefinition(kpiName, kpiConfigs[kpiName], converterContext);
      if (oDef) {
        kpiDefs.push(oDef);
      }
    });
    return kpiDefs;
  }
  _exports.getKPIDefinitions = getKPIDefinitions;
  return _exports;
}, false);
