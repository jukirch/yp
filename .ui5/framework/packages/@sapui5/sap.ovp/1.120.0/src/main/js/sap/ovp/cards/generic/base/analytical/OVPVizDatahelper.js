/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(
  [
    "sap/base/util/each",
    "sap/base/util/merge",
    "sap/ovp/insights/helpers/AnalyticalCard",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Control",
    "sap/ovp/cards/AnnotationHelper"
  ],
  function (
    each,
    merge,
    AnalyticalCardHelper,
    JSONModel,
    Control,
    AnnotationHelper
  ) {
    "use strict";

    var aColorValues = [];
    var sDisplayProperty = "";
    var sDimensionLabel = "";
    var sColorPaletteDimension = "";
    var aColorPaletteChart = [];
    var aColorPalette = [];

    /**
     * return the relavant color rule
     *
     * @param {number} iRelavantColor - Index will be used to get relavant color from array aColorValues
     * @param {number} iDisplayName - The index used to get displayName property
     * @param {object} oChartData - The data received in batch response
     * @returns {object} - oResult The color rule
     */
    var getColorRule = function (iRelavantColor, iDisplayName, oChartData) {
      var oResult = {
          dataContext: {},
          properties: {
              color: (aColorValues && aColorValues[iRelavantColor])
          },
          displayName: oChartData.results[iDisplayName][sDisplayProperty]
      };
      oResult.dataContext[sDimensionLabel] = oChartData.results[iDisplayName][sColorPaletteDimension];
      return oResult;
    };

    return {
      /**
       * Function Caches the values of color values, duplicate values, display property,
       * Dimension label and color Palette Dimension.
       *
       * @param {object} oColorPalette - The Color Palette Object
       * @param {string} colorPaletteDimension - The Dimension of Color Palette
       * @param {string} displayProperty - The display property
       * @param {string} dimensionLabel - The dimension label
       */
      cacheValues: function(oColorPalette, colorPaletteDimension, displayProperty, dimensionLabel) {
        aColorPaletteChart = [];
        aColorValues = [];

        if (oColorPalette instanceof Array) {
            aColorValues = oColorPalette.map(function (value) {
                return value.color;
            });
            aColorPaletteChart = oColorPalette;
        } else {
            var aDimensionValues = Object.keys(oColorPalette) || [];
            for (var i = 0; i < aDimensionValues.length; i++) {
                aColorValues.push(oColorPalette[aDimensionValues[i]]);
                aColorPaletteChart.push({
                    "dimensionValue": aDimensionValues[i], 
                    "color": oColorPalette[aDimensionValues[i]]
                });
            }
        }

        aColorPalette = aColorValues.slice();
        sDisplayProperty = displayProperty;
        sDimensionLabel = dimensionLabel;
        sColorPaletteDimension = colorPaletteDimension;
      },

      /**
       * Add the datapointstyle color rules to viz properties.
       *
       * @param {object} oChartData - The data received in batch response
       * @param {object} oVizProps - The viz property object
       */
      addColorRulesToVizProperties: function(oChartData, oVizProps) {

        if (aColorPaletteChart instanceof Array) {
            each(aColorPaletteChart, function (iRelavantColor, colorObject) {
                for (var k = 0; k < oChartData.results.length; k++) {
                    if (oChartData.results[k][sColorPaletteDimension] === colorObject.dimensionValue) {
                        //Load the coloring rules
                        var oRule = getColorRule(iRelavantColor, k, oChartData);
                        oVizProps.plotArea.dataPointStyle["rules"].push(oRule);
                        //As rules, for a particular color in the palette is loaded, remove it from the color array
                        aColorPalette.splice(iRelavantColor, 1);
                    }
                }
            });
        }
      },

      /**
       * Function to handle the color, displayname properties of Others section of analytical chart.
       *
       * @param {object} aggregateObject - The aggregate Object
       * @param {string} oVizProps - The viz property object
       */
      handleOthersSectionForCharts: function(aggregateObject, oVizProps) {
        //Handle the 'Others' section
        if (aggregateObject && aggregateObject.results && Array.isArray(aggregateObject.results)) {

            var sColorvalue = "";
            if (aColorPalette && aColorPalette.length) {
                sColorvalue = aColorPalette[aColorPalette.length - 1];
            }

            oVizProps.plotArea.dataPointStyle["rules"].push({
                callback: function (oContext) {
                    return oContext && 
                        oContext[sDimensionLabel] && 
                        oContext[sDimensionLabel].lastIndexOf("Others") != -1;
                },
                properties: {
                    //Provide a color that is from the remainder of the color array or color map
                    color: sColorvalue
                },
                displayName: aggregateObject.results[0][sColorPaletteDimension]
            });
        }
      },

      /**
       * Sets the vizproperties to a map which will be consumed by Insight card at the time of generation.
       *
       * @param {object} oCardModel - ovpCardProperties model
       * @param {object} content - The viz frame chart
       * @param {object} oVizProps - The vizproperty object
       */
      setVizPropertiesForInsightCards: function(oCardModel, content, oVizProps) {
        if (oCardModel && oCardModel.getProperty("/bInsightEnabled")) {
            var sKey = content.getId(),
                oVizPropertiesCopy = merge({}, oVizProps);
            AnalyticalCardHelper.setVizPropertyMap(sKey, oVizPropertiesCopy);
        }
      },

      /**
       * Function to format / constuct date objects based on sap:semantics and replace the date value
       *
       * @param {array} aTimeAxisProperties - Time axis properties properties array
       * @param {object} oTimeAxisPropertiesAndSemantics - Timeaxis Property to Semanticinfo map
       * @param {array} aResults - The data received in batch response
       */
      formatDateBasedOnSemantics: function(aTimeAxisProperties, oTimeAxisPropertiesAndSemantics, aResults) {
        //Check if entity set properties fit the above criteria
        if (aTimeAxisProperties && aTimeAxisProperties.length) {
            if (aResults && aResults.length) {
                each(aResults, function (i, result) {
                    //If result has any of the properties in oTimeAxisPropertiesAndSemantics, 
                    //convert that props' value to Date object
                    each(aTimeAxisProperties, function (i, property) {
                        if (result.hasOwnProperty(property)) {
                            //It is known, at this point, that there exist properties relating to dates
                            var sDatePropertyValue = result[property];
                            var iYearValue,
                                sMonthValue,
                                sQuarterValue,
                                iMonthValueFromQuarter,
                                iMonthValue,
                                sWeekValue,
                                iStartDayOfWeek;
                            //Do the following:
                            //1. Construct date objects based on the value of "semantics"
                            //2. Replace the string in the data property, with the newly created date object
                            switch (oTimeAxisPropertiesAndSemantics[property]["semantics"]) {
                                case "yearmonth":
                                    iYearValue = parseInt(sDatePropertyValue.substr(0, 4), 10);
                                    sMonthValue = sDatePropertyValue.substr(4);
                                    //sMonthValue attribute in Date constructor is 0-based
                                    iMonthValue = parseInt(sMonthValue, 10) - 1;
                                    result[property] = new Date(
                                        Date.UTC(iYearValue, iMonthValue)
                                    );
                                    break;
                                case "yearquarter":
                                    iYearValue = parseInt(sDatePropertyValue.substr(0, 4), 10);
                                    sQuarterValue = sDatePropertyValue.substr(4);
                                    iMonthValueFromQuarter = parseInt(sQuarterValue, 10) * 3 - 2;
                                    //sMonthValue attribute in Date constructor is 0-based
                                    iMonthValue = iMonthValueFromQuarter - 1;
                                    result[property] = new Date(
                                        Date.UTC(iYearValue, iMonthValue)
                                    );
                                    break;
                                case "yearweek":
                                    iYearValue = parseInt(sDatePropertyValue.substr(0, 4), 10);
                                    sWeekValue = sDatePropertyValue.substr(4);

                                    // 1st of January + 7 days for each week
                                    var iStartDayOfWeek = 1 + (parseInt(sWeekValue, 10) - 1) * 7;
                                    result[property] = new Date(
                                        Date.UTC(iYearValue, 0, iStartDayOfWeek)
                                    );
                                    break;
                                case "fiscalyearperiod":
                                    var sAnnotationType = "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod";
                                    var sFiscalData = AnnotationHelper.getFormattedFiscalData(
                                        sDatePropertyValue,
                                        sAnnotationType
                                    );
                                    result[property] = sFiscalData;
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                });
            }
        }
      },

      /**
       *
       * Function to attach datareceived event to Aggregation Binding of the viz frame charts
       *
       */
      attachDataReceivedToAggregationBinding: function() {
        var aggrDataBinding = this.getBinding("aggregateData");
        var binding = this.getBinding("data");

        if (this.chartAggrBinding !== aggrDataBinding) {
          this.chartAggrBinding = aggrDataBinding;
          if (aggrDataBinding) {
              var that = this;
              aggrDataBinding.attachEvent("dataReceived", function (oEvent) {
                  that.aggregateSet = oEvent && oEvent.getParameter("data");
                  if (that.getChartType() == "donut") {
                      if (that.getDependentDataReceived() === true ||
                          that.getDependentDataReceived() === "true") {
                          that.oDataClone = merge({}, that.dataSet);
                          that.mergeDatasets(binding, that.oDataClone, that.getContent());
                          that.setDependentDataReceived(false);
                      } else {
                          that.setDependentDataReceived(true);
                          //store data local
                      }
                  } else {
                      var oModel = new JSONModel();
                      oModel.setData(that.aggregateSet.results);
                      that.getContent().setModel(oModel, "analyticalmodel");
                  }
              });
          }
          Control.prototype.updateBindingContext.apply(this, arguments);
        }
     }
    };
  }
);
