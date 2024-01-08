/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/field/FieldTemplating", "sap/fe/macros/insights/CommonInsightsHelper"], function (FieldTemplating, CommonInsightsHelper) {
  "use strict";

  var _exports = {};
  var createInsightsParams = CommonInsightsHelper.createInsightsParams;
  var getTextBinding = FieldTemplating.getTextBinding;
  /**
   * Get measures of the chart.
   *
   * @param innerChart
   * @returns Measures of the chart.
   */
  function getMeasures(innerChart) {
    return innerChart.getMeasures().map(measure => {
      return {
        name: measure.getLabel(),
        value: "{" + measure.getName() + "}"
      };
    });
  }

  /**
   * Get dimensions of the chart.
   *
   * @param innerChart Inner chart
   * @param chartAPI Chart API
   * @returns Dimensions of the chart.
   */
  _exports.getMeasures = getMeasures;
  function getDimensions(innerChart, chartAPI) {
    return innerChart.getDimensions().filter(function (dimension) {
      return innerChart.getVisibleDimensions().includes(dimension.getName());
    }).map(dimension => {
      const dataModel = chartAPI.getDimensionDataModel(dimension.getName());
      const displayValue = dataModel ? getTextBinding(dataModel, {}, false, "extension.formatters.sapfe.formatWithBrackets") : undefined;
      if (dimension.getTextProperty()) {
        return {
          name: dimension.getLabel(),
          value: "{" + dimension.getTextProperty() + "}",
          displayValue: displayValue
        };
      } else {
        return {
          name: dimension.getLabel(),
          value: "{" + dimension.getName() + "}",
          displayValue: displayValue
        };
      }
    });
  }

  /**
   * Get feeds of the chart.
   *
   * @param innerChart
   * @returns Feeds of the chart.
   */
  _exports.getDimensions = getDimensions;
  function getFeeds(innerChart) {
    const vizFeeds = innerChart.getAggregation("_vizFrame").getFeeds();
    const feeds = vizFeeds.map(feed => {
      return feed.getProperty("values").map(feedValue => {
        const label = getLabel(innerChart, feedValue.getProperty("name"), feedValue.getProperty("type"));
        const feedType = {
          type: feed.getProperty("type"),
          uid: feed.getProperty("uid"),
          values: [label]
        };
        return feedType;
      });
    });
    return feeds.flat();
  }

  /**
   * Get measure label or dimension label of the chart.
   *
   * @param innerChart
   * @param name
   * @param type
   * @returns Measure label or Dimension label of the chart.
   */
  _exports.getFeeds = getFeeds;
  function getLabel(innerChart, name, type) {
    if (type === "Dimension") {
      const dimensions = innerChart.getDimensions();
      return dimensions.filter(dimension => {
        return dimension.getName() === name;
      })[0].getLabel() || name;
    } else {
      const measures = innerChart.getMeasures();
      return measures.filter(measure => {
        return measure.getName() === name;
      })[0].getLabel() || name;
    }
  }

  /**
   * Constructs the insights parameters from the table that is required to create the insights card.
   *
   * @param controlAPI
   * @returns The insights parameters from the table.
   */
  async function createChartCardParams(controlAPI) {
    var _chart$getControlDele;
    const chart = controlAPI.content;
    const innerChart = (_chart$getControlDele = chart.getControlDelegate()) === null || _chart$getControlDele === void 0 ? void 0 : _chart$getControlDele.getInnerChart(chart);
    if (!innerChart) {
      throw new Error("Cannot access chart.");
    }
    const params = await createInsightsParams("Analytical", controlAPI, chart.getFilter());
    if (!params) {
      return;
    }
    params.entitySetPath = chart.data("targetCollectionPath");
    params.requestParameters.queryUrl = innerChart.getBinding("data").getDownloadUrl();
    const content = {
      cardTitle: chart.getHeader(),
      legendVisible: false,
      chartType: chart.getChartType(),
      measures: getMeasures(innerChart),
      dimensions: getDimensions(innerChart, controlAPI),
      feeds: getFeeds(innerChart),
      allowedChartTypes: innerChart.getAvailableChartTypes().available,
      chartProperties: innerChart.getAggregation("_vizFrame").getVizProperties()
    };
    return {
      ...params,
      content
    };
  }
  _exports.createChartCardParams = createChartCardParams;
  return _exports;
}, false);
