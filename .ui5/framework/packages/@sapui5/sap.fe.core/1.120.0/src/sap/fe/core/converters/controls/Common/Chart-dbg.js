/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/DataModelPathHelper", "sap/ui/core/Core", "../../ManifestSettings", "../../helpers/Aggregation", "../../helpers/ID", "../../helpers/InsightsHelpers"], function (Log, DataField, Action, ConfigurableObject, Key, BindingToolkit, DataModelPathHelper, Core, ManifestSettings, Aggregation, ID, InsightsHelpers) {
  "use strict";

  var _exports = {};
  var getInsightsVisibility = InsightsHelpers.getInsightsVisibility;
  var getInsightsEnablement = InsightsHelpers.getInsightsEnablement;
  var getFilterBarID = ID.getFilterBarID;
  var getChartID = ID.getChartID;
  var AggregationHelper = Aggregation.AggregationHelper;
  var VisualizationType = ManifestSettings.VisualizationType;
  var VariantManagementType = ManifestSettings.VariantManagementType;
  var TemplateType = ManifestSettings.TemplateType;
  var ActionType = ManifestSettings.ActionType;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var not = BindingToolkit.not;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var KeyHelper = Key.KeyHelper;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var OverrideType = ConfigurableObject.OverrideType;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var isDataFieldForActionAbstract = DataField.isDataFieldForActionAbstract;
  /**
   * Method to retrieve all chart actions from annotations.
   *
   * @param chartAnnotation
   * @param visualizationPath
   * @param converterContext
   * @returns The chart actions from the annotation
   */
  function getChartActionsFromAnnotations(chartAnnotation, visualizationPath, converterContext) {
    const chartActions = [];
    if (chartAnnotation !== null && chartAnnotation !== void 0 && chartAnnotation.Actions) {
      chartAnnotation.Actions.forEach(dataField => {
        if (isDataFieldForActionAbstract(dataField) && !dataField.Inline && !dataField.Determining) {
          const key = KeyHelper.generateKeyFromDataField(dataField);
          switch (dataField.$Type) {
            case "com.sap.vocabularies.UI.v1.DataFieldForAction":
              if (dataField.ActionTarget && !dataField.ActionTarget.isBound) {
                chartActions.push({
                  type: ActionType.DataFieldForAction,
                  annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
                  key,
                  visible: getCompileExpressionForAction(dataField, converterContext)
                });
              }
              break;
            case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
              chartActions.push({
                type: ActionType.DataFieldForIntentBasedNavigation,
                annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
                key,
                visible: getCompileExpressionForAction(dataField, converterContext),
                isNavigable: true
              });
              break;
          }
        }
      });
    }
    return chartActions;
  }
  function getChartActions(chartAnnotation, visualizationPath, converterContext) {
    const aAnnotationActions = getChartActionsFromAnnotations(chartAnnotation, visualizationPath, converterContext);
    const manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).actions, converterContext, aAnnotationActions);
    const actionOverwriteConfig = {
      enabled: OverrideType.overwrite,
      enableOnSelect: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      command: OverrideType.overwrite
    };
    const chartActions = insertCustomElements(aAnnotationActions, manifestActions.actions, actionOverwriteConfig);
    return {
      actions: chartActions,
      commandActions: manifestActions.commandActions
    };
  }
  _exports.getChartActions = getChartActions;
  function getP13nMode(visualizationPath, converterContext) {
    var _chartManifestSetting;
    const manifestWrapper = converterContext.getManifestWrapper();
    const chartManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const variantManagement = manifestWrapper.getVariantManagement();
    const aPersonalization = [];
    // Personalization configured in manifest.
    const personalization = chartManifestSettings === null || chartManifestSettings === void 0 ? void 0 : (_chartManifestSetting = chartManifestSettings.chartSettings) === null || _chartManifestSetting === void 0 ? void 0 : _chartManifestSetting.personalization;
    const isControlVariant = variantManagement === VariantManagementType.Control ? true : false;
    // if personalization is set to false do not show any option
    if (personalization !== undefined && !personalization || personalization == "false") {
      return undefined;
    }
    switch (true) {
      case typeof personalization === "object":
        // Specific personalization options enabled in manifest. Use them as is.
        if (personalization.type) {
          aPersonalization.push("Type");
        }
        if (personalization.item) {
          aPersonalization.push("Item");
        }
        if (personalization.sort) {
          aPersonalization.push("Sort");
        }
        if (personalization.filter) {
          aPersonalization.push("Filter");
        }
        return aPersonalization.join(",");
      case isControlVariant:
      case !!personalization:
        // manifest has personalization configured, check if it's true
        // if manifest doesn't have personalization, check for variant management is set to control
        return "Sort,Type,Item,Filter";
      default:
        // if manifest doesn't have personalization, show default options without filter
        return "Sort,Type,Item";
    }
  }
  _exports.getP13nMode = getP13nMode;
  // check if annoatation path has SPV and store the path
  function checkForSPV(viewConfiguration) {
    var _viewConfiguration$an;
    return viewConfiguration !== null && viewConfiguration !== void 0 && (_viewConfiguration$an = viewConfiguration.annotationPath) !== null && _viewConfiguration$an !== void 0 && _viewConfiguration$an.includes(`@${"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"}`) ? viewConfiguration === null || viewConfiguration === void 0 ? void 0 : viewConfiguration.annotationPath : undefined;
  }
  function getAggregatablePropertiesObject(aggProp) {
    let obj;
    if (aggProp !== null && aggProp !== void 0 && aggProp.Property) {
      var _Property;
      obj = {
        Property: {
          $PropertyPath: aggProp === null || aggProp === void 0 ? void 0 : (_Property = aggProp.Property) === null || _Property === void 0 ? void 0 : _Property.value
        }
      };
    } else {
      obj = {
        Property: {
          $PropertyPath: aggProp === null || aggProp === void 0 ? void 0 : aggProp.name
        }
      };
    }
    return obj;
  }
  /**
   * Create the ChartVisualization configuration that will be used to display a chart using the Chart building block.
   *
   * @param chartAnnotation The targeted chart annotation
   * @param visualizationPath The path of the visualization annotation
   * @param converterContext The converter context
   * @param doNotCheckApplySupported Flag that indicates whether ApplySupported needs to be checked or not
   * @param viewConfiguration
   * @returns The chart visualization based on the annotation
   */
  function createChartVisualization(chartAnnotation, visualizationPath, converterContext, doNotCheckApplySupported, viewConfiguration) {
    var _chartAnnotation$Titl;
    const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart
    if (!doNotCheckApplySupported && !aggregationHelper.isAnalyticsSupported()) {
      throw new Error("ApplySupported is not added to the annotations");
    }
    const aTransAggregations = aggregationHelper.getTransAggregations();
    const aCustomAggregates = aggregationHelper.getCustomAggregateDefinitions();
    const pageManifestSettings = converterContext.getManifestWrapper();
    const variantManagement = pageManifestSettings.getVariantManagement();
    const p13nMode = getP13nMode(visualizationPath, converterContext);
    if (p13nMode === undefined && variantManagement === "Control") {
      Log.warning("Variant Management cannot be enabled when personalization is disabled");
    }
    const mCustomAggregates = {};
    // check if annoatation path has SPV and store the path
    const mSelectionPresentationVariantPath = checkForSPV(viewConfiguration);
    if (aCustomAggregates) {
      const entityType = aggregationHelper.getEntityType();
      for (const customAggregate of aCustomAggregates) {
        var _customAggregate$anno, _customAggregate$anno2, _relatedCustomAggrega, _relatedCustomAggrega2, _relatedCustomAggrega3;
        const aContextDefiningProperties = customAggregate === null || customAggregate === void 0 ? void 0 : (_customAggregate$anno = customAggregate.annotations) === null || _customAggregate$anno === void 0 ? void 0 : (_customAggregate$anno2 = _customAggregate$anno.Aggregation) === null || _customAggregate$anno2 === void 0 ? void 0 : _customAggregate$anno2.ContextDefiningProperties;
        const qualifier = customAggregate === null || customAggregate === void 0 ? void 0 : customAggregate.qualifier;
        const relatedCustomAggregateProperty = qualifier && entityType.entityProperties.find(property => property.name === qualifier);
        const label = relatedCustomAggregateProperty && (relatedCustomAggregateProperty === null || relatedCustomAggregateProperty === void 0 ? void 0 : (_relatedCustomAggrega = relatedCustomAggregateProperty.annotations) === null || _relatedCustomAggrega === void 0 ? void 0 : (_relatedCustomAggrega2 = _relatedCustomAggrega.Common) === null || _relatedCustomAggrega2 === void 0 ? void 0 : (_relatedCustomAggrega3 = _relatedCustomAggrega2.Label) === null || _relatedCustomAggrega3 === void 0 ? void 0 : _relatedCustomAggrega3.toString());
        mCustomAggregates[qualifier] = {
          name: qualifier,
          label: label || `Custom Aggregate (${qualifier})`,
          sortable: true,
          sortOrder: "both",
          contextDefiningProperty: aContextDefiningProperties ? aContextDefiningProperties.map(oCtxDefProperty => {
            return oCtxDefProperty.value;
          }) : []
        };
      }
    }
    const mTransAggregations = {};
    const oResourceBundleCore = Core.getLibraryResourceBundle("sap.fe.core");
    if (aTransAggregations) {
      for (let i = 0; i < aTransAggregations.length; i++) {
        var _aTransAggregations$i, _aTransAggregations$i2, _aTransAggregations$i3, _aTransAggregations$i4, _aTransAggregations$i5, _aTransAggregations$i6;
        mTransAggregations[aTransAggregations[i].Name] = {
          name: aTransAggregations[i].Name,
          propertyPath: aTransAggregations[i].AggregatableProperty.valueOf().value,
          aggregationMethod: aTransAggregations[i].AggregationMethod,
          label: (_aTransAggregations$i = aTransAggregations[i]) !== null && _aTransAggregations$i !== void 0 && (_aTransAggregations$i2 = _aTransAggregations$i.annotations) !== null && _aTransAggregations$i2 !== void 0 && (_aTransAggregations$i3 = _aTransAggregations$i2.Common) !== null && _aTransAggregations$i3 !== void 0 && _aTransAggregations$i3.Label ? (_aTransAggregations$i4 = aTransAggregations[i]) === null || _aTransAggregations$i4 === void 0 ? void 0 : (_aTransAggregations$i5 = _aTransAggregations$i4.annotations) === null || _aTransAggregations$i5 === void 0 ? void 0 : (_aTransAggregations$i6 = _aTransAggregations$i5.Common) === null || _aTransAggregations$i6 === void 0 ? void 0 : _aTransAggregations$i6.Label.toString() : `${oResourceBundleCore.getText("AGGREGATABLE_PROPERTY")} (${aTransAggregations[i].Name})`,
          sortable: true,
          sortOrder: "both",
          custom: false
        };
      }
    }
    const aAggProps = aggregationHelper.getAggregatableProperties();
    const aGrpProps = aggregationHelper.getGroupableProperties();
    const mApplySupported = {};
    mApplySupported.$Type = "Org.OData.Aggregation.V1.ApplySupportedType";
    mApplySupported.AggregatableProperties = [];
    mApplySupported.GroupableProperties = [];
    if (aAggProps) {
      mApplySupported.AggregatableProperties = aAggProps.map(prop => getAggregatablePropertiesObject(prop));
    }
    if (aGrpProps) {
      mApplySupported.GroupableProperties = aGrpProps.map(prop => ({
        ["$PropertyPath"]: prop.value
      }));
    }
    const chartActions = getChartActions(chartAnnotation, visualizationPath, converterContext);
    let [navigationPropertyPath /*, annotationPath*/] = visualizationPath.split("@");
    if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
      // Drop trailing slash
      navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
    }
    const title = ((_chartAnnotation$Titl = chartAnnotation.Title) === null || _chartAnnotation$Titl === void 0 ? void 0 : _chartAnnotation$Titl.toString()) || ""; // read title from chart annotation
    const dataModelPath = converterContext.getDataModelObjectPath();
    const isEntitySet = navigationPropertyPath.length === 0;
    const entityName = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
    const sFilterbarId = isEntitySet ? getFilterBarID(converterContext.getContextPath()) : undefined;
    const oVizProperties = {
      legendGroup: {
        layout: {
          position: "bottom"
        }
      }
    };
    let autoBindOnInit;
    if (converterContext.getTemplateType() === TemplateType.ObjectPage) {
      autoBindOnInit = true;
    } else if (converterContext.getTemplateType() === TemplateType.ListReport || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      autoBindOnInit = false;
    }
    const hasMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
    const onSegmentedButtonPressed = hasMultipleVisualizations ? ".handlers.onSegmentedButtonPressed" : "";
    const visible = hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true";
    const allowedTransformations = aggregationHelper.getAllowedTransformations();
    mApplySupported.enableSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
    let qualifier = "";
    if (chartAnnotation.fullyQualifiedName.split("#").length > 1) {
      qualifier = chartAnnotation.fullyQualifiedName.split("#")[1];
    }
    const isInsightsVisible = getInsightsVisibility("Analytical", converterContext, visualizationPath);
    const isInsightsEnabled = and(getInsightsEnablement(), isInsightsVisible);
    return {
      type: VisualizationType.Chart,
      id: qualifier ? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart) : getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
      collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
      entityName: entityName,
      personalization: getP13nMode(visualizationPath, converterContext),
      navigationPath: navigationPropertyPath,
      annotationPath: converterContext.getAbsoluteAnnotationPath(visualizationPath),
      filterId: sFilterbarId,
      vizProperties: JSON.stringify(oVizProperties),
      actions: chartActions.actions,
      commandActions: chartActions.commandActions,
      title: title,
      autoBindOnInit: autoBindOnInit,
      onSegmentedButtonPressed: onSegmentedButtonPressed,
      visible: visible,
      customAgg: mCustomAggregates,
      transAgg: mTransAggregations,
      applySupported: mApplySupported,
      selectionPresentationVariantPath: mSelectionPresentationVariantPath,
      variantManagement: findVariantManagement(p13nMode, variantManagement),
      isInsightsEnabled: isInsightsEnabled,
      isInsightsVisible: isInsightsVisible
    };
  }
  /**
   * Method to determine the variant management.
   *
   * @param p13nMode
   * @param variantManagement
   * @returns The variant management for the chart
   */
  _exports.createChartVisualization = createChartVisualization;
  function findVariantManagement(p13nMode, variantManagement) {
    return variantManagement === "Control" && !p13nMode ? VariantManagementType.None : variantManagement;
  }

  /**
   * Method to get compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation.
   *
   * @param dataField
   * @param converterContext
   * @returns Compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation
   */
  function getCompileExpressionForAction(dataField, converterContext) {
    var _dataField$annotation, _dataField$annotation2;
    return compileExpression(not(equal(getExpressionFromAnnotation((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : _dataField$annotation2.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true)));
  }
  function createBlankChartVisualization(converterContext) {
    const hasMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
    const dataModelPath = converterContext.getDataModelObjectPath();
    const entityName = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
    const visualization = {
      type: VisualizationType.Chart,
      id: getChartID(entityName, VisualizationType.Chart),
      entityName: entityName,
      title: "",
      collection: "",
      personalization: undefined,
      navigationPath: "",
      annotationPath: "",
      vizProperties: JSON.stringify({
        legendGroup: {
          layout: {
            position: "bottom"
          }
        }
      }),
      actions: [],
      commandActions: {},
      autoBindOnInit: false,
      onSegmentedButtonPressed: "",
      visible: hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true",
      customAgg: {},
      transAgg: {},
      applySupported: {
        $Type: "Org.OData.Aggregation.V1.ApplySupportedType",
        AggregatableProperties: [],
        GroupableProperties: [],
        enableSearch: false
      },
      multiViews: false,
      variantManagement: VariantManagementType.None
    };
    return visualization;
  }
  _exports.createBlankChartVisualization = createBlankChartVisualization;
  return _exports;
}, false);
