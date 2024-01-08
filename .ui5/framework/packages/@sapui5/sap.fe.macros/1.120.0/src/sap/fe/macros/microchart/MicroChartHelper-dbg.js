/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/CommonHelper", "sap/m/library", "sap/ui/core/format/DateFormat", "sap/ui/core/format/NumberFormat"], function (Log, CommonHelper, mobilelibrary, DateFormat, NumberFormat) {
  "use strict";

  const ValueColor = mobilelibrary.ValueColor;
  const calendarPatternMap = {
    yyyy: /[1-9][0-9]{3,}|0[0-9]{3}/,
    Q: /[1-4]/,
    MM: /0[1-9]|1[0-2]/,
    ww: /0[1-9]|[1-4][0-9]|5[0-3]/,
    yyyyMMdd: /([1-9][0-9]{3,}|0[0-9]{3})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/,
    yyyyMM: /([1-9][0-9]{3,}|0[0-9]{3})(0[1-9]|1[0-2])/,
    "yyyy-MM-dd": /([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/
  };

  /**
   * Helper class used by MDC_Controls to handle SAP Fiori elements for OData V4
   *
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const MicroChartHelper = {
    /**
     * This function returns the Threshold Color for bullet micro chart.
     *
     * @param value Threshold value provided in the annotations
     * @param iContext InterfaceContext with path to the threshold
     * @returns The indicator for Threshold Color
     */
    getThresholdColor: function (value, iContext) {
      const path = iContext.context.getPath();
      if (path.indexOf("DeviationRange") > -1) {
        return ValueColor.Error;
      } else if (path.indexOf("ToleranceRange") > -1) {
        return ValueColor.Critical;
      }
      return ValueColor.Neutral;
    },
    /**
     * To fetch measures from DataPoints.
     *
     * @param chartAnnotations Chart Annotations
     * @param entityTypeAnnotations EntityType Annotations
     * @param chartType Chart Type used
     * @returns Containing all measures.
     * @private
     */
    getMeasurePropertyPaths: function (chartAnnotations, entityTypeAnnotations, chartType) {
      const propertyPath = [];
      if (!entityTypeAnnotations) {
        Log.warning("FE:Macro:MicroChart : Couldn't find annotations for the DataPoint.");
        return undefined;
      }
      for (const measureIndex in chartAnnotations.Measures) {
        var _dataPoint$Value;
        const iMeasureAttribute = CommonHelper.getMeasureAttributeIndex(measureIndex, chartAnnotations),
          measureAttribute = iMeasureAttribute > -1 && chartAnnotations.MeasureAttributes && chartAnnotations.MeasureAttributes[iMeasureAttribute],
          dataPoint = measureAttribute && entityTypeAnnotations && entityTypeAnnotations[measureAttribute.DataPoint.$AnnotationPath];
        if (dataPoint !== null && dataPoint !== void 0 && (_dataPoint$Value = dataPoint.Value) !== null && _dataPoint$Value !== void 0 && _dataPoint$Value.$Path) {
          propertyPath.push(dataPoint.Value.$Path);
        } else {
          Log.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute ${chartType} MicroChart.`);
        }
      }
      return propertyPath.join(",");
    },
    /**
     * This function returns the visible expression path.
     *
     * @param args
     * @returns Expression Binding for the visible.
     */
    getHiddenPathExpression: function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      if (!args[0] && !args[1]) {
        return true;
      }
      if (args[0] === true || args[1] === true) {
        return false;
      }
      const hiddenPaths = [];
      [].forEach.call(args, function (hiddenProperty) {
        if (hiddenProperty && hiddenProperty.$Path) {
          hiddenPaths.push("%{" + hiddenProperty.$Path + "}");
        }
      });
      return hiddenPaths.length ? "{= " + hiddenPaths.join(" || ") + " === true ? false : true }" : false;
    },
    /**
     * This function returns the true/false to display chart.
     *
     * @param chartType The chart type
     * @param value Data point value of Value
     * @param maxValue Data point value of MaximumValue
     * @param valueHidden Hidden path object/boolean value for the referenced property of value
     * @param maxValueHidden Hidden path object/boolean value for the referenced property of MaxValue
     * @returns `true` or `false` to hide/show chart
     */
    isNotAlwaysHidden: function (chartType, value, maxValue, valueHidden, maxValueHidden) {
      if (valueHidden === true) {
        this.logError(chartType, value);
      }
      if (maxValueHidden === true) {
        this.logError(chartType, maxValue);
      }
      if (valueHidden === undefined && maxValueHidden === undefined) {
        return true;
      } else {
        return (!valueHidden || valueHidden.$Path) && valueHidden !== undefined || (!maxValueHidden || maxValueHidden.$Path) && maxValueHidden !== undefined ? true : false;
      }
    },
    /**
     * This function is to log errors for missing data point properties.
     *
     * @param chartType The chart type.
     * @param value Dynamic hidden property name.
     */
    logError: function (chartType, value) {
      Log.error(`Measure Property ${value.$Path} is hidden for the ${chartType} Micro Chart`);
    },
    /**
     * This function returns the formatted value with scale factor for the value displayed.
     *
     * @param path Property path for the value
     * @param property The Property for constraints
     * @param fractionDigits No. of fraction digits specified from annotations
     * @param value Static value of the property
     * @returns Expression Binding for the value with scale.
     */
    formatDecimal: function (path, property, fractionDigits, value) {
      if (path) {
        const constraints = [],
          formatOptions = ["style: 'short'"];
        const scale = typeof fractionDigits === "number" ? fractionDigits : property && (property === null || property === void 0 ? void 0 : property.$Scale) || 1;
        if (property.$Nullable != undefined) {
          constraints.push("nullable: " + property.$Nullable);
        }
        if (property.$Precision != undefined) {
          formatOptions.push("precision: " + (property.$Precision ? property.$Precision : "1"));
        }
        constraints.push("scale: " + (scale === "variable" ? "'" + scale + "'" : scale));
        return "{ path: '" + path + "'" + ", type: 'sap.ui.model.odata.type.Decimal', constraints: { " + constraints.join(",") + " }, formatOptions: { " + formatOptions.join(",") + " } }";
      } else if (value) {
        const decimals = typeof fractionDigits === "number" ? fractionDigits : 1;
        return NumberFormat.getFloatInstance({
          style: "short",
          preserveDecimals: true,
          decimals: decimals
        }).format(value);
      }
    },
    /**
     * To fetch, the select parameters from annotations to add to the list binding.
     *
     * @param groupId GroupId to be used
     * @param uomPath Unit of measure path
     * @param criticality Criticality for the chart
     * @param criticalityPath Criticality calculation object property path
     * @returns String containing all the property paths needed to be added to the $select query of the list binding.
     * @private
     */
    getSelectParameters: function (groupId, uomPath, criticality) {
      const propertyPath = [],
        parameters = [];
      if (groupId) {
        parameters.push(`$$groupId : '${groupId}'`);
      }
      if (criticality) {
        propertyPath.push(criticality);
      } else if (uomPath) {
        for (const k in uomPath) {
          if (!uomPath[k].$EnumMember && uomPath[k].$Path) {
            propertyPath.push(uomPath[k].$Path);
          }
        }
      }
      for (var _len2 = arguments.length, criticalityPath = new Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
        criticalityPath[_key2 - 3] = arguments[_key2];
      }
      for (const path of criticalityPath) {
        if (path) {
          propertyPath.push(path);
        }
      }
      if (propertyPath.length) {
        parameters.push(`$select : '${propertyPath.join(",")}'`);
      }
      return parameters.join(",");
    },
    /**
     * To fetch DataPoint Qualifiers of measures.
     *
     * @param chartAnnotations Chart Annotations
     * @param entityTypeAnnotations EntityType Annotations
     * @param chartType Chart Type used
     * @returns Containing all data point Qualifiers.
     * @private
     */
    getDataPointQualifiersForMeasures: function (chartAnnotations, entityTypeAnnotations, chartType) {
      const qualifiers = [],
        measureAttributes = chartAnnotations.MeasureAttributes,
        fnAddDataPointQualifier = function (chartMeasure) {
          const measure = chartMeasure.$PropertyPath;
          let qualifier;
          if (entityTypeAnnotations) {
            measureAttributes.forEach(function (measureAttribute) {
              var _measureAttribute$Mea, _measureAttribute$Dat;
              if (((_measureAttribute$Mea = measureAttribute.Measure) === null || _measureAttribute$Mea === void 0 ? void 0 : _measureAttribute$Mea.$PropertyPath) === measure && (_measureAttribute$Dat = measureAttribute.DataPoint) !== null && _measureAttribute$Dat !== void 0 && _measureAttribute$Dat.$AnnotationPath) {
                const annotationPath = measureAttribute.DataPoint.$AnnotationPath;
                if (entityTypeAnnotations[annotationPath]) {
                  qualifier = annotationPath.split("#")[1];
                  if (qualifier) {
                    qualifiers.push(qualifier);
                  }
                }
              }
            });
          }
          if (qualifier === undefined) {
            Log.warning(`FE:Macro:MicroChart : Couldn't find DataPoint(Value) measure for the measureAttribute for ${chartType} MicroChart.`);
          }
        };
      if (!entityTypeAnnotations) {
        Log.warning(`FE:Macro:MicroChart : Couldn't find annotations for the DataPoint ${chartType} MicroChart.`);
      }
      chartAnnotations.Measures.forEach(fnAddDataPointQualifier);
      return qualifiers.join(",");
    },
    /**
     * This function is to log warnings for missing datapoint properties.
     *
     * @param chartType The Chart type.
     * @param error Object with properties from DataPoint.
     */
    logWarning: function (chartType, error) {
      for (const key in error) {
        if (!error[key]) {
          Log.warning(`${key} parameter is missing for the ${chartType} Micro Chart`);
        }
      }
    },
    /**
     * This function is used to get DisplayValue for comparison micro chart data aggregation.
     *
     * @param dataPoint Data point object.
     * @param pathText Object after evaluating @com.sap.vocabularies.Common.v1.Text annotation
     * @param valueTextPath Evaluation of @com.sap.vocabularies.Common.v1.Text/$Path/$ value of the annotation
     * @param valueDataPointPath DataPoint>Value/$Path/$ value after evaluating annotation
     * @returns Expression binding for Display Value for comparison micro chart's aggregation data.
     */
    getDisplayValueForMicroChart: function (dataPoint, pathText, valueTextPath, valueDataPointPath) {
      const valueFormat = dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits;
      if (pathText) {
        return MicroChartHelper.formatDecimal(pathText["$Path"], valueTextPath, valueFormat);
      }
      return MicroChartHelper.formatDecimal(dataPoint.Value["$Path"], valueDataPointPath, valueFormat);
    },
    /**
     * This function is used to check whether micro chart is enabled or not by checking properties, chart annotations, hidden properties.
     *
     * @param chartType MicroChart Type eg:- Bullet.
     * @param dataPoint Data point object.
     * @param dataPointValueHidden Object with $Path annotation to get hidden value path
     * @param chartAnnotations ChartAnnotation object
     * @param dataPointMaxValue Object with $Path annotation to get hidden max value path
     * @returns `true` if the chart has all values and properties and also it is not always hidden sFinalDataPointValue && bMicrochartVisible.
     */
    shouldMicroChartRender: function (chartType, dataPoint, dataPointValueHidden, chartAnnotations, dataPointMaxValue) {
      const availableChartTypes = ["Area", "Column", "Comparison"],
        dataPointValue = dataPoint && dataPoint.Value,
        hiddenPath = dataPointValueHidden && dataPointValueHidden["com.sap.vocabularies.UI.v1.Hidden"],
        chartAnnotationDimension = chartAnnotations && chartAnnotations.Dimensions && chartAnnotations.Dimensions[0],
        finalDataPointValue = availableChartTypes.includes(chartType) ? dataPointValue && chartAnnotationDimension : dataPointValue; // only for three charts in array
      if (chartType === "Harvey") {
        const dataPointMaximumValue = dataPoint && dataPoint.MaximumValue,
          maxValueHiddenPath = dataPointMaxValue && dataPointMaxValue["com.sap.vocabularies.UI.v1.Hidden"];
        return dataPointValue && dataPointMaximumValue && MicroChartHelper.isNotAlwaysHidden("Bullet", dataPointValue, dataPointMaximumValue, hiddenPath, maxValueHiddenPath);
      }
      return finalDataPointValue && MicroChartHelper.isNotAlwaysHidden(chartType, dataPointValue, undefined, hiddenPath);
    },
    /**
     * This function is used to get dataPointQualifiers for Column, Comparison and StackedBar micro charts.
     *
     * @param annotationPath
     * @returns Result string or undefined.
     */
    getDataPointQualifiersForMicroChart: function (annotationPath) {
      if (!annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")) {
        return undefined;
      }
      return annotationPath.split("#")[1] ?? "";
    },
    /**
     * This function is used to get colorPalette for comparison and HarveyBall Microcharts.
     *
     * @param dataPoint Data point object.
     * @returns Result string for colorPalette or undefined.
     */
    getColorPaletteForMicroChart: function (dataPoint) {
      return dataPoint.Criticality ? undefined : "sapUiChartPaletteQualitativeHue1, sapUiChartPaletteQualitativeHue2, sapUiChartPaletteQualitativeHue3,          sapUiChartPaletteQualitativeHue4, sapUiChartPaletteQualitativeHue5, sapUiChartPaletteQualitativeHue6, sapUiChartPaletteQualitativeHue7,          sapUiChartPaletteQualitativeHue8, sapUiChartPaletteQualitativeHue9, sapUiChartPaletteQualitativeHue10, sapUiChartPaletteQualitativeHue11";
    },
    /**
     * This function is used to get MeasureScale for Area, Column and Line micro charts.
     *
     * @param dataPoint Data point object.
     * @returns Data point value format fractional digits or data point scale or 1.
     */
    getMeasureScaleForMicroChart: function (dataPoint) {
      if (dataPoint.ValueFormat && dataPoint.ValueFormat.NumberOfFractionalDigits) {
        return dataPoint.ValueFormat.NumberOfFractionalDigits;
      }
      if (dataPoint.Value && dataPoint.Value["$Path"] && dataPoint.Value["$Path"]["$Scale"]) {
        return dataPoint.Value["$Path"]["$Scale"];
      }
      return 1;
    },
    /**
     * This function is to return the binding expression of microchart.
     *
     * @param chartType The type of micro chart (Bullet, Radial etc.)
     * @param measure Measure value for micro chart.
     * @param microChart `this`/current model for micro chart.
     * @param collection Collection object.
     * @param uiName The @sapui.name in collection model is not accessible here from model hence need to pass it.
     * @param dataPoint Data point object used in case of Harvey Ball micro chart
     * @returns The binding expression for micro chart.
     * @private
     */
    getBindingExpressionForMicrochart: function (chartType, measure, microChart, collection, uiName, dataPoint) {
      const condition = collection["$isCollection"] || collection["$kind"] === "EntitySet";
      const path = condition ? "" : uiName;
      let currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(measure);
      let dataPointCriticallity = "";
      switch (chartType) {
        case "Radial":
          currencyOrUnit = "";
          break;
        case "Harvey":
          dataPointCriticallity = dataPoint.Criticality ? dataPoint.Criticality["$Path"] : "";
          break;
      }
      const functionValue = MicroChartHelper.getSelectParameters(microChart.batchGroupId, "", dataPointCriticallity, currencyOrUnit);
      return `{ path: '${path}'` + `, parameters : {${functionValue}} }`;
    },
    /**
     * This function is to return the UOMPath expression of the micro chart.
     *
     * @param showOnlyChart Whether only chart should be rendered or not.
     * @param measure Measures for the micro chart.
     * @returns UOMPath String for the micro chart.
     * @private
     */
    getUOMPathForMicrochart: function (showOnlyChart, measure) {
      if (measure && !showOnlyChart) {
        return measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`] && measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`].$Path || measure[`@${"Org.OData.Measures.V1.Unit"}`] && measure[`@${"Org.OData.Measures.V1.Unit"}`].$Path;
      }
      return undefined;
    },
    /**
     * This function is to return the aggregation binding expression of micro chart.
     *
     * @param aggregationType Aggregation type of chart (eg:- Point for AreaMicrochart)
     * @param collection Collection object.
     * @param dataPoint Data point info for micro chart.
     * @param uiName The @sapui.name in collection model is not accessible here from model hence need to pass it.
     * @param dimension Micro chart Dimensions.
     * @param measure Measure value for micro chart.
     * @param measureOrDimensionBar The measure or dimension passed specifically in case of bar chart
     * @returns Aggregation binding expression for micro chart.
     * @private
     */
    getAggregationForMicrochart: function (aggregationType, collection, dataPoint, uiName, dimension, measure, measureOrDimensionBar) {
      let path = collection["$kind"] === "EntitySet" ? "/" : "";
      path = path + uiName;
      const groupId = "";
      let dataPointCriticallityCalc = "";
      let dataPointCriticallity = dataPoint.Criticality ? dataPoint.Criticality["$Path"] : "";
      const currencyOrUnit = MicroChartHelper.getUOMPathForMicrochart(false, measure);
      let targetValuePath = "";
      let dimensionPropertyPath = "";
      if (dimension && dimension.$PropertyPath && dimension.$PropertyPath[`@${"com.sap.vocabularies.Common.v1.Text"}`]) {
        dimensionPropertyPath = dimension.$PropertyPath[`@${"com.sap.vocabularies.Common.v1.Text"}`].$Path;
      } else {
        dimensionPropertyPath = dimension.$PropertyPath;
      }
      switch (aggregationType) {
        case "Points":
          dataPointCriticallityCalc = dataPoint && dataPoint.CriticalityCalculation;
          targetValuePath = dataPoint && dataPoint.TargetValue && dataPoint.TargetValue["$Path"];
          dataPointCriticallity = "";
          break;
        case "Columns":
          dataPointCriticallityCalc = dataPoint && dataPoint.CriticalityCalculation;
          break;
        case "LinePoints":
          dataPointCriticallity = "";
          break;
        case "Bars":
          dimensionPropertyPath = "";
          break;
      }
      const functionValue = MicroChartHelper.getSelectParameters(groupId, dataPointCriticallityCalc, dataPointCriticallity, currencyOrUnit, targetValuePath, dimensionPropertyPath, measureOrDimensionBar);
      return `{path:'${path}'` + `, parameters : {${functionValue}} }`;
    },
    getCurrencyOrUnit: function (measure) {
      if (measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`]) {
        return measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`].$Path || measure[`@${"Org.OData.Measures.V1.ISOCurrency"}`];
      }
      if (measure[`@${"Org.OData.Measures.V1.Unit"}`]) {
        return measure[`@${"Org.OData.Measures.V1.Unit"}`].$Path || measure[`@${"Org.OData.Measures.V1.Unit"}`];
      }
      return "";
    },
    getCalendarPattern: function (propertyType, annotations) {
      return annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarYear"}`] && "yyyy" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarQuarter"}`] && "Q" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarMonth"}`] && "MM" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarWeek"}`] && "ww" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarDate"}`] && "yyyyMMdd" || annotations[`@${"com.sap.vocabularies.Common.v1.IsCalendarYearMonth"}`] && "yyyyMM" || propertyType === "Edm.Date" && "yyyy-MM-dd" || undefined;
    },
    formatDimension: function (date, pattern, propertyPath) {
      const value = DateFormat.getDateInstance({
        pattern
      }).parse(date, false, true);
      if (value instanceof Date) {
        return value.getTime();
      } else {
        Log.warning("Date value could not be determined for " + propertyPath);
      }
      return 0;
    },
    formatStringDimension: function (value, pattern, propertyPath) {
      if (pattern in calendarPatternMap) {
        const matchedValue = value === null || value === void 0 ? void 0 : value.toString().match(calendarPatternMap[pattern]);
        if (matchedValue && matchedValue !== null && matchedValue !== void 0 && matchedValue.length) {
          return MicroChartHelper.formatDimension(matchedValue[0], pattern, propertyPath);
        }
      }
      Log.warning("Pattern not supported for " + propertyPath);
      return 0;
    },
    getX: function (propertyPath, propertyType, annotations) {
      const pattern = annotations && MicroChartHelper.getCalendarPattern(propertyType, annotations);
      if (pattern && ["Edm.Date", "Edm.String"].some(type => type === propertyType)) {
        return `{parts: [{path: '${propertyPath}', targetType: 'any'}, {value: '${pattern}'}, {value: '${propertyPath}'}], formatter: 'MICROCHARTR.formatStringDimension'}`;
      }
    }
  };
  return MicroChartHelper;
}, false);
