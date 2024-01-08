/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/macros/CommonHelper", "sap/fe/macros/internal/helpers/ActionHelper", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/v4/AnnotationHelper"], function (Log, DataVisualization, CommonHelper, ActionHelper, JSONModel, ODataModelAnnotationHelper) {
  "use strict";

  var getUiControl = DataVisualization.getUiControl;
  function getEntitySetPath(annotationContext) {
    return annotationContext.getPath().replace(/@com.sap.vocabularies.UI.v1.(Chart|PresentationVariant).*/, "");
  }
  var ChartTypeEnum;
  (function (ChartTypeEnum) {
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Column"] = "column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/ColumnStacked"] = "stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/ColumnDual"] = "dual_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual"] = "dual_stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/ColumnStacked100"] = "100_stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual100"] = "100_dual_stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Bar"] = "bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/BarStacked"] = "stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/BarDual"] = "dual_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/BarStackedDual"] = "dual_stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/BarStacked100"] = "100_stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/BarStackedDual100"] = "100_dual_stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Area"] = "area";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/AreaStacked"] = "stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/AreaStacked100"] = "100_stacked_column";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalArea"] = "bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked"] = "stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked100"] = "100_stacked_bar";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Line"] = "line";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/LineDual"] = "dual_line";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Combination"] = "combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/CombinationStacked"] = "stacked_combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/CombinationDual"] = "dual_combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/CombinationStackedDual"] = "dual_stacked_combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationStacked"] = "horizontal_stacked_combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Pie"] = "pie";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Donut"] = "donut";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Scatter"] = "scatter";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Bubble"] = "bubble";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Radar"] = "line";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HeatMap"] = "heatmap";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/TreeMap"] = "treemap";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Waterfall"] = "waterfall";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/Bullet"] = "bullet";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/VerticalBullet"] = "vertical_bullet";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalWaterfall"] = "horizontal_waterfall";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationDual"] = "dual_horizontal_combination";
    ChartTypeEnum["com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationStackedDual"] = "dual_horizontal_stacked_combination";
  })(ChartTypeEnum || (ChartTypeEnum = {}));
  var DimensionRoleTypeEnum;
  /**
   * Helper class for sap.fe.macros Chart phantom control for preprocessing.
   * <h3><b>Note:</b></h3>
   * The class is experimental and the API/behaviour is not finalised
   * and hence this should not be used for productive usage.
   * Especially this class is not intended to be used for the FE scenario,
   * here we shall use sap.fe.macros.ChartHelper that is especially tailored for V4
   * meta model
   *
   * @author SAP SE
   * @private
   * @experimental
   * @since 1.62.0
   * @alias sap.fe.macros.ChartHelper
   */
  (function (DimensionRoleTypeEnum) {
    DimensionRoleTypeEnum["com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category"] = "category";
    DimensionRoleTypeEnum["com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Series"] = "series";
    DimensionRoleTypeEnum["com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category2"] = "category2";
  })(DimensionRoleTypeEnum || (DimensionRoleTypeEnum = {}));
  const ChartHelper = {
    formatJSONToString(crit) {
      if (!crit) {
        return undefined;
      }
      let criticality = JSON.stringify(crit);
      criticality = criticality.replace(new RegExp("{", "g"), "\\{");
      criticality = criticality.replace(new RegExp("}", "g"), "\\}");
      return criticality;
    },
    formatChartType(chartType) {
      return ChartTypeEnum[chartType === null || chartType === void 0 ? void 0 : chartType.$EnumMember];
    },
    formatDimensions(annotationContext) {
      const annotation = annotationContext.getObject("./"),
        metaModel = annotationContext.getModel(),
        entitySetPath = getEntitySetPath(annotationContext),
        dimensions = [];
      let isNavigationText = false;

      //perhaps there are no dimension
      annotation.DimensionAttributes = annotation.DimensionAttributes || [];
      for (const dimension of annotation.Dimensions) {
        const key = dimension.$PropertyPath;
        const text = metaModel.getObject(`${entitySetPath + key}@${"com.sap.vocabularies.Common.v1.Text"}`) || {};
        if (key.includes("/")) {
          Log.error(`$expand is not yet supported. Dimension: ${key} from an association cannot be used`);
        }
        if (text.$Path && text.$Path.indexOf("/") > -1) {
          Log.error(`$expand is not yet supported. Text Property: ${text.$Path} from an association cannot be used for the dimension ${key}`);
          isNavigationText = true;
        }
        const chartDimension = {
          key: key,
          textPath: !isNavigationText ? text.$Path : undefined,
          label: metaModel.getObject(`${entitySetPath + key}@${"com.sap.vocabularies.Common.v1.Label"}`),
          role: "category"
        };
        for (const attribute of annotation.DimensionAttributes) {
          var _attribute$Dimension;
          if (chartDimension.key === ((_attribute$Dimension = attribute.Dimension) === null || _attribute$Dimension === void 0 ? void 0 : _attribute$Dimension.$PropertyPath)) {
            var _attribute$Role;
            chartDimension.role = DimensionRoleTypeEnum[(_attribute$Role = attribute.Role) === null || _attribute$Role === void 0 ? void 0 : _attribute$Role.$EnumMember] || chartDimension.role;
            break;
          }
        }
        chartDimension.criticality = this.fetchCriticality(metaModel, metaModel.createBindingContext(entitySetPath + key)).then(this.formatJSONToString);
        dimensions.push(chartDimension);
      }
      const dimensionModel = new JSONModel(dimensions);
      dimensionModel.$$valueAsPromise = true;
      return dimensionModel.createBindingContext("/");
    },
    fetchCriticality(oMetaModel, oCtx) {
      const UI = "@com.sap.vocabularies.UI.v1";
      return oMetaModel.requestObject(`${UI}.ValueCriticality`, oCtx).then(function (aValueCriticality) {
        let oCriticality, oValueCriticality;
        if (aValueCriticality) {
          oCriticality = {
            VeryPositive: [],
            Positive: [],
            Critical: [],
            VeryNegative: [],
            Negative: [],
            Neutral: []
          };
          for (let i = 0; i < aValueCriticality.length; i++) {
            oValueCriticality = aValueCriticality[i];
            if (oValueCriticality.Criticality.$EnumMember.endsWith("VeryPositive")) {
              oCriticality.VeryPositive.push(oValueCriticality.Value);
            } else if (oValueCriticality.Criticality.$EnumMember.endsWith("Positive")) {
              oCriticality.Positive.push(oValueCriticality.Value);
            } else if (oValueCriticality.Criticality.$EnumMember.endsWith("Critical")) {
              oCriticality.Critical.push(oValueCriticality.Value);
            } else if (oValueCriticality.Criticality.$EnumMember.endsWith("VeryNegative")) {
              oCriticality.VeryNegative.push(oValueCriticality.Value);
            } else if (oValueCriticality.Criticality.$EnumMember.endsWith("Negative")) {
              oCriticality.Negative.push(oValueCriticality.Value);
            } else {
              oCriticality.Neutral.push(oValueCriticality.Value);
            }
          }
          for (const sKey in oCriticality) {
            if (oCriticality[sKey].length == 0) {
              delete oCriticality[sKey];
            }
          }
        }
        return oCriticality;
      });
    },
    formatMeasures(annotationContext) {
      return annotationContext.getModel().getData();
    },
    getUiChart(presentationContext) {
      return getUiControl(presentationContext, `@${"com.sap.vocabularies.UI.v1.Chart"}`);
    },
    getOperationAvailableMap(chart, contextContext) {
      const chartCollection = (chart === null || chart === void 0 ? void 0 : chart.Actions) || [];
      return JSON.stringify(ActionHelper.getOperationAvailableMap(chartCollection, "chart", contextContext));
    },
    /**
     * Returns a stringified JSON object containing Presentation Variant sort conditions.
     *
     * @param oContext
     * @param oPresentationVariant Presentation Variant annotation
     * @param sPresentationVariantPath
     * @param oApplySupported
     * @returns Stringified JSON object
     */
    getSortConditions: function (oContext, oPresentationVariant, sPresentationVariantPath, oApplySupported) {
      if (oPresentationVariant && CommonHelper._isPresentationVariantAnnotation(sPresentationVariantPath) && oPresentationVariant.SortOrder) {
        const aSortConditions = {
          sorters: []
        };
        const sEntityPath = oContext.getPath(0).split("@")[0];
        oPresentationVariant.SortOrder.forEach(function () {
          let oCondition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          let oSortProperty = "";
          const oSorter = {};
          if (oCondition.DynamicProperty) {
            var _oContext$getModel$ge;
            oSortProperty = "_fe_aggregatable_" + ((_oContext$getModel$ge = oContext.getModel(0).getObject(sEntityPath + oCondition.DynamicProperty.$AnnotationPath)) === null || _oContext$getModel$ge === void 0 ? void 0 : _oContext$getModel$ge.Name);
          } else if (oCondition.Property) {
            const aGroupableProperties = oApplySupported.GroupableProperties;
            if (aGroupableProperties && aGroupableProperties.length) {
              for (let i = 0; i < aGroupableProperties.length; i++) {
                if (aGroupableProperties[i].$PropertyPath === oCondition.Property.$PropertyPath) {
                  oSortProperty = "_fe_groupable_" + oCondition.Property.$PropertyPath;
                  break;
                }
                if (!oSortProperty) {
                  oSortProperty = "_fe_aggregatable_" + oCondition.Property.$PropertyPath;
                }
              }
            } else if (oContext.getModel(0).getObject(`${sEntityPath + oCondition.Property.$PropertyPath}@${"Org.OData.Aggregation.V1.Groupable"}`)) {
              oSortProperty = "_fe_groupable_" + oCondition.Property.$PropertyPath;
            } else {
              oSortProperty = "_fe_aggregatable_" + oCondition.Property.$PropertyPath;
            }
          }
          if (oSortProperty) {
            oSorter.name = oSortProperty;
            oSorter.descending = !!oCondition.Descending;
            aSortConditions.sorters.push(oSorter);
          } else {
            throw new Error("Please define the right path to the sort property");
          }
        });
        return JSON.stringify(aSortConditions);
      }
      return undefined;
    },
    getBindingData(sTargetCollection, oContext, aActions) {
      const aOperationAvailablePath = [];
      let sSelect;
      for (const i in aActions) {
        if (aActions[i].$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
          const sActionName = aActions[i].Action;
          const oActionOperationAvailable = CommonHelper.getActionPath(oContext, false, sActionName, true);
          if (oActionOperationAvailable && oActionOperationAvailable.$Path) {
            aOperationAvailablePath.push(`'${oActionOperationAvailable.$Path}'`);
          } else if (oActionOperationAvailable === null) {
            // We disabled action advertisement but kept it in the code for the time being
            //aOperationAvailablePath.push(sActionName);
          }
        }
      }
      if (aOperationAvailablePath.length > 0) {
        //TODO: request fails with $select. check this with odata v4 model
        sSelect = " $select: '" + aOperationAvailablePath.join() + "'";
      }
      return "'{path: '" + (oContext.getObject("$kind") === "EntitySet" ? "/" : "") + oContext.getObject("@sapui.name") + "'" + (sSelect ? ",parameters:{" + sSelect + "}" : "") + "}'";
    },
    _getModel(oCollection, oInterface) {
      return oInterface.context;
    },
    // TODO: combine this one with the one from the table
    isDataFieldForActionButtonEnabled(bIsBound, sAction, oCollection, sOperationAvailableMap, sEnableSelectOn) {
      if (bIsBound !== true) {
        return "true";
      }
      const oModel = oCollection.getModel();
      const sNavPath = oCollection.getPath();
      const sPartner = oModel.getObject(sNavPath).$Partner;
      const oOperationAvailableMap = sOperationAvailableMap && JSON.parse(sOperationAvailableMap);
      const aPath = oOperationAvailableMap && oOperationAvailableMap[sAction] && oOperationAvailableMap[sAction].split("/");
      const sNumberOfSelectedContexts = ActionHelper.getNumberOfContextsExpression(sEnableSelectOn);
      if (aPath && aPath[0] === sPartner) {
        const sPath = oOperationAvailableMap[sAction].replace(sPartner + "/", "");
        return "{= ${" + sNumberOfSelectedContexts + " && ${" + sPath + "}}";
      } else {
        return "{= ${" + sNumberOfSelectedContexts + "}";
      }
    },
    getHiddenPathExpressionForTableActionsAndIBN(sHiddenPath, oDetails) {
      const oContext = oDetails.context,
        sPropertyPath = oContext.getPath(),
        sEntitySetPath = ODataModelAnnotationHelper.getNavigationPath(sPropertyPath);
      if (sHiddenPath.indexOf("/") > 0) {
        const aSplitHiddenPath = sHiddenPath.split("/");
        const sNavigationPath = aSplitHiddenPath[0];
        // supports visiblity based on the property from the partner association
        if (oContext.getObject(sEntitySetPath + "/$Partner") === sNavigationPath) {
          return "{= !%{" + aSplitHiddenPath.slice(1).join("/") + "} }";
        }
        // any other association will be ignored and the button will be made visible
      }

      return true;
    },
    /**
     * Method to get press event for DataFieldForActionButton.
     *
     * @function
     * @name getPressEventForDataFieldForActionButton
     * @param id Current control ID
     * @param action DataFieldForAction model
     * @param operationAvailableMap Stringified JSON object
     * @returns A binding expression for the press property of the DataFieldForActionButton
     */
    getPressEventForDataFieldForActionButton(id, action, operationAvailableMap) {
      return ActionHelper.getPressEventDataFieldForActionButton(id, action, {
        contexts: "${internal>selectedContexts}"
      }, operationAvailableMap);
    },
    /**
     * @function
     * @name getActionType
     * @param action DataFieldForAction model
     * @returns A Boolean value depending on the action type
     */
    getActionType(action) {
      return (action["$Type"].includes("com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") || action["$Type"].includes("com.sap.vocabularies.UI.v1.DataFieldForAction")) && action["Inline"];
    },
    getCollectionName(collection) {
      return collection.split("/")[collection.split("/").length - 1];
    }
  };
  ChartHelper.getSortConditions.requiresIContext = true;
  return ChartHelper;
}, false);
