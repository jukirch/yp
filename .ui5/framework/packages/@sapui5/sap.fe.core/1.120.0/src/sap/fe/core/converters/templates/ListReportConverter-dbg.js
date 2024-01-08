/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/helpers/BindingToolkit", "../ManifestSettings", "../controls/Common/DataVisualization", "../controls/Common/KPI", "../helpers/ID"], function (Action, FilterBar, ConfigurableObject, BindingToolkit, ManifestSettings, DataVisualization, KPI, ID) {
  "use strict";

  var _exports = {};
  var getTableID = ID.getTableID;
  var getIconTabBarID = ID.getIconTabBarID;
  var getFilterVariantManagementID = ID.getFilterVariantManagementID;
  var getFilterBarID = ID.getFilterBarID;
  var getDynamicListReportID = ID.getDynamicListReportID;
  var getCustomTabID = ID.getCustomTabID;
  var getChartID = ID.getChartID;
  var getKPIDefinitions = KPI.getKPIDefinitions;
  var isSelectionPresentationCompliant = DataVisualization.isSelectionPresentationCompliant;
  var isPresentationCompliant = DataVisualization.isPresentationCompliant;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  var getSelectionPresentationVariant = DataVisualization.getSelectionPresentationVariant;
  var getMultiDimensionalGridVisualization = DataVisualization.getMultiDimensionalGridVisualization;
  var getDefaultPresentationVariant = DataVisualization.getDefaultPresentationVariant;
  var getDefaultLineItem = DataVisualization.getDefaultLineItem;
  var getDefaultChart = DataVisualization.getDefaultChart;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var VisualizationType = ManifestSettings.VisualizationType;
  var VariantManagementType = ManifestSettings.VariantManagementType;
  var TemplateType = ManifestSettings.TemplateType;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getManifestFilterFields = FilterBar.getManifestFilterFields;
  var getFilterBarHideBasicSearch = FilterBar.getFilterBarHideBasicSearch;
  var getActionsFromManifest = Action.getActionsFromManifest;
  /**
   * Retrieves all list report tables.
   *
   * @param views The list report views configured in the manifest
   * @returns The list report table
   */
  function getTableVisualizations(views) {
    const tables = [];
    views.forEach(function (view) {
      if (!view.type) {
        const visualizations = view.secondaryVisualization ? view.secondaryVisualization.visualizations : view.presentation.visualizations;
        visualizations.forEach(function (visualization) {
          if (visualization.type === VisualizationType.Table) {
            tables.push(visualization);
          }
        });
      }
    });
    return tables;
  }
  function getChartVisualizations(views) {
    const charts = [];
    views.forEach(function (view) {
      if (!view.type) {
        const visualizations = view.primaryVisualization ? view.primaryVisualization.visualizations : view.presentation.visualizations;
        visualizations.forEach(function (visualization) {
          if (visualization.type === VisualizationType.Chart) {
            charts.push(visualization);
          }
        });
      }
    });
    return charts;
  }
  const getDefaultSemanticDates = function (filterFields) {
    const defaultSemanticDates = {};
    for (const filterField in filterFields) {
      var _filterFields$filterF, _filterFields$filterF2, _filterFields$filterF3;
      if ((_filterFields$filterF = filterFields[filterField]) !== null && _filterFields$filterF !== void 0 && (_filterFields$filterF2 = _filterFields$filterF.settings) !== null && _filterFields$filterF2 !== void 0 && (_filterFields$filterF3 = _filterFields$filterF2.defaultValues) !== null && _filterFields$filterF3 !== void 0 && _filterFields$filterF3.length) {
        var _filterFields$filterF4, _filterFields$filterF5;
        defaultSemanticDates[filterField] = (_filterFields$filterF4 = filterFields[filterField]) === null || _filterFields$filterF4 === void 0 ? void 0 : (_filterFields$filterF5 = _filterFields$filterF4.settings) === null || _filterFields$filterF5 === void 0 ? void 0 : _filterFields$filterF5.defaultValues;
      }
    }
    return defaultSemanticDates;
  };
  /**
   * Find a visualization annotation that can be used for rendering the list report.
   *
   * @param entityType The current EntityType
   * @param converterContext
   * @param isALP
   * @returns A compliant annotation for rendering the list report
   */
  function getCompliantVisualizationAnnotation(entityType, converterContext, isALP) {
    const annotationPath = converterContext.getManifestWrapper().getDefaultTemplateAnnotationPath();
    const selectionPresentationVariant = getSelectionPresentationVariant(entityType, annotationPath, converterContext);
    const errorMessageForALP = "ALP flavor needs both chart and table to load the application";
    if (selectionPresentationVariant) {
      if (annotationPath) {
        const presentationVariant = selectionPresentationVariant.PresentationVariant;
        if (!presentationVariant) {
          throw new Error("Presentation Variant is not configured in the SPV mentioned in the manifest");
        }
        if (!isPresentationCompliant(presentationVariant, isALP)) {
          if (isALP) {
            throw new Error(errorMessageForALP);
          }
          return undefined;
        }
      }
      if (isSelectionPresentationCompliant(selectionPresentationVariant, isALP) === true) {
        return selectionPresentationVariant;
      } else if (isALP) {
        throw new Error(errorMessageForALP);
      }
    }
    const presentationVariant = getDefaultPresentationVariant(entityType);
    if (presentationVariant) {
      if (isPresentationCompliant(presentationVariant, isALP)) {
        return presentationVariant;
      } else if (isALP) {
        throw new Error(errorMessageForALP);
      }
    }
    if (!isALP) {
      return getDefaultLineItem(entityType);
    }
    return undefined;
  }
  const getView = function (viewConverterConfiguration) {
    let config = viewConverterConfiguration;
    if (config.converterContext) {
      var _presentation, _presentation$visuali;
      let converterContext = config.converterContext;
      config = config;
      const isMultipleViewConfiguration = function (currentConfig) {
        return currentConfig.key !== undefined;
      };
      let presentation = getDataVisualizationConfiguration(config.annotation ? converterContext.getRelativeAnnotationPath(config.annotation.fullyQualifiedName, converterContext.getEntityType()) : "", true, converterContext, config, undefined, undefined, isMultipleViewConfiguration(config));
      let tableControlId = "";
      let chartControlId = "";
      let title = "";
      let selectionVariantPath = "";
      const createVisualization = function (currentPresentation, isPrimary) {
        let defaultVisualization;
        for (const visualization of currentPresentation.visualizations) {
          if (isPrimary && (visualization.type === VisualizationType.Chart || visualization.type === VisualizationType.MultiDimensionalGrid)) {
            defaultVisualization = visualization;
            break;
          }
          if (!isPrimary && visualization.type === VisualizationType.Table) {
            defaultVisualization = visualization;
            break;
          }
        }
        const presentationCreated = Object.assign({}, currentPresentation);
        if (defaultVisualization) {
          presentationCreated.visualizations = [defaultVisualization];
        } else {
          // The primary visualization could also be a MultiDimensionalGrid, but as this feature is not yet released, we do not mention it here
          throw new Error((isPrimary ? "Primary" : "Secondary") + " visualisation needs valid " + (isPrimary ? "chart" : "table"));
        }
        return presentationCreated;
      };
      const getPresentation = function (item, isPrimary) {
        if (item.type === "MultiDimensionalGrid") {
          return getMultiDimensionalGridVisualization(item);
        }
        item = item;
        const resolvedTarget = converterContext.getEntityTypeAnnotation(item.annotationPath);
        const targetAnnotation = resolvedTarget.annotation;
        converterContext = resolvedTarget.converterContext;
        const annotation = targetAnnotation;
        if (annotation || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
          presentation = getDataVisualizationConfiguration(annotation ? converterContext.getRelativeAnnotationPath(annotation.fullyQualifiedName, converterContext.getEntityType()) : "", true, converterContext, config, undefined, undefined, undefined);
          return presentation;
        } else {
          const sError = "Annotation Path for the " + (isPrimary ? "primary" : "secondary") + " visualisation mentioned in the manifest is not found";
          throw new Error(sError);
        }
      };
      const createAlpView = function (presentations, defaultPath) {
        var _primaryVisualization, _primaryVisualization2, _secondaryVisualizati, _secondaryVisualizati2;
        const primaryVisualization = createVisualization(presentations[0], true);
        chartControlId = (primaryVisualization === null || primaryVisualization === void 0 ? void 0 : (_primaryVisualization = primaryVisualization.visualizations[0]) === null || _primaryVisualization === void 0 ? void 0 : _primaryVisualization.type) === VisualizationType.Chart ? primaryVisualization === null || primaryVisualization === void 0 ? void 0 : (_primaryVisualization2 = primaryVisualization.visualizations[0]) === null || _primaryVisualization2 === void 0 ? void 0 : _primaryVisualization2.id : "";
        const secondaryVisualization = createVisualization(presentations[1] ? presentations[1] : presentations[0], false);
        tableControlId = secondaryVisualization === null || secondaryVisualization === void 0 ? void 0 : (_secondaryVisualizati = secondaryVisualization.visualizations[0]) === null || _secondaryVisualizati === void 0 ? void 0 : (_secondaryVisualizati2 = _secondaryVisualizati.annotation) === null || _secondaryVisualizati2 === void 0 ? void 0 : _secondaryVisualizati2.id;
        if (primaryVisualization && secondaryVisualization) {
          config = config;
          const visible = config.visible;
          const view = {
            primaryVisualization,
            secondaryVisualization,
            tableControlId,
            chartControlId,
            defaultPath,
            visible
          };
          return view;
        }
      };
      if (!converterContext.getManifestWrapper().hasMultipleVisualizations(config) && ((_presentation = presentation) === null || _presentation === void 0 ? void 0 : (_presentation$visuali = _presentation.visualizations) === null || _presentation$visuali === void 0 ? void 0 : _presentation$visuali.length) === 2 && converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
        const view = createAlpView([presentation], "both");
        if (view) {
          return view;
        }
      } else if (converterContext.getManifestWrapper().hasMultipleVisualizations(config) || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
        const {
          primary,
          secondary
        } = config;
        if (primary && primary.length && secondary && secondary.length) {
          const view = createAlpView([getPresentation(primary[0], true), getPresentation(secondary[0], false)], config.defaultPath);
          if (view) {
            return view;
          }
        } else {
          throw new Error("SecondaryItems in the Views is not present");
        }
      } else if (isMultipleViewConfiguration(config)) {
        // key exists only on multi tables mode
        const resolvedTarget = converterContext.getEntityTypeAnnotation(config.annotationPath);
        const viewAnnotation = resolvedTarget.annotation;
        converterContext = resolvedTarget.converterContext;
        title = compileExpression(getExpressionFromAnnotation(viewAnnotation.Text));
        // Need to loop on table into views since multi table mode get specific configuration (hidden filters or Table Id)
        presentation.visualizations.forEach((visualizationDefinition, index) => {
          var _config$annotation;
          switch (visualizationDefinition.type) {
            case VisualizationType.Table:
              const tableVisualization = presentation.visualizations[index];
              const filters = tableVisualization.control.filters || {};
              filters.hiddenFilters = filters.hiddenFilters || {
                paths: []
              };
              if (!config.keepPreviousPersonalization) {
                // Need to override Table Id to match with Tab Key (currently only table is managed in multiple view mode)
                tableVisualization.annotation.id = getTableID(config.key || "", "LineItem");
              }
              config = config;
              if (((_config$annotation = config.annotation) === null || _config$annotation === void 0 ? void 0 : _config$annotation.term) === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
                var _config$annotation$Se;
                if (!config.annotation.SelectionVariant) {
                  throw new Error(`The Selection Variant is missing for the Selection Presentation Variant ${config.annotation.fullyQualifiedName}`);
                }
                selectionVariantPath = `@${(_config$annotation$Se = config.annotation.SelectionVariant) === null || _config$annotation$Se === void 0 ? void 0 : _config$annotation$Se.fullyQualifiedName.split("@")[1]}`;
              } else {
                selectionVariantPath = config.annotationPath;
              }
              //Provide Selection Variant to hiddenFilters in order to set the SV filters to the table.
              //MDC Table overrides binding Filter and from SAP FE the only method where we are able to add
              //additional filter is 'rebindTable' into Table delegate.
              //To avoid implementing specific LR feature to SAP FE Macro Table, the filter(s) related to the Tab (multi table mode)
              //can be passed to macro table via parameter/context named filters and key hiddenFilters.
              filters.hiddenFilters.paths.push({
                annotationPath: selectionVariantPath
              });
              tableVisualization.control.filters = filters;
              break;
            case VisualizationType.Chart:
              const chartVisualization = presentation.visualizations[index];
              chartVisualization.id = getChartID(config.key || "", "Chart");
              chartVisualization.multiViews = true;
              break;
            default:
              break;
          }
        });
      }
      presentation.visualizations.forEach(visualizationDefinition => {
        if (visualizationDefinition.type === VisualizationType.Table) {
          tableControlId = visualizationDefinition.annotation.id;
        } else if (visualizationDefinition.type === VisualizationType.Chart) {
          chartControlId = visualizationDefinition.id;
        }
      });
      config = config;
      const visible = config.visible;
      return {
        presentation,
        tableControlId,
        chartControlId,
        title,
        selectionVariantPath,
        visible
      };
    } else {
      config = config;
      const title = config.label,
        fragment = config.template,
        type = config.type,
        customTabId = getCustomTabID(config.key || ""),
        visible = config.visible;
      return {
        title,
        fragment,
        type,
        customTabId,
        visible
      };
    }
  };
  const getViews = function (converterContext, settingsViews) {
    let viewConverterConfigs = [];
    if (settingsViews) {
      settingsViews.paths.forEach(path => {
        if (converterContext.getManifestWrapper().hasMultipleVisualizations(path)) {
          if (settingsViews.paths.length > 1) {
            throw new Error("ALP flavor cannot have multiple views");
          } else {
            path = path;
            viewConverterConfigs.push({
              converterContext: converterContext,
              primary: path.primary,
              secondary: path.secondary,
              defaultPath: path.defaultPath
            });
          }
        } else if (path.template) {
          path = path;
          viewConverterConfigs.push({
            key: path.key,
            label: path.label,
            template: path.template,
            type: "Custom",
            visible: path.visible
          });
        } else {
          path = path;
          const viewConverterContext = converterContext.getConverterContextFor(path.contextPath || path.entitySet && `/${path.entitySet}` || converterContext.getContextPath()),
            entityType = viewConverterContext.getEntityType();
          if (entityType && viewConverterContext) {
            let annotation;
            const resolvedTarget = viewConverterContext.getEntityTypeAnnotation(path.annotationPath);
            const targetAnnotation = resolvedTarget.annotation;
            if (targetAnnotation) {
              annotation = targetAnnotation.term === "com.sap.vocabularies.UI.v1.SelectionVariant" ? getCompliantVisualizationAnnotation(entityType, viewConverterContext, false) : targetAnnotation;
              viewConverterConfigs.push({
                converterContext: viewConverterContext,
                annotation,
                annotationPath: path.annotationPath,
                keepPreviousPersonalization: path.keepPreviousPersonalization,
                key: path.key,
                visible: path.visible
              });
            }
          } else {
            // TODO Diagnostics message
          }
        }
      });
    } else {
      const entityType = converterContext.getEntityType();
      if (converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
        viewConverterConfigs = getAlpViewConfig(converterContext, viewConverterConfigs);
      } else {
        viewConverterConfigs.push({
          annotation: getCompliantVisualizationAnnotation(entityType, converterContext, false),
          converterContext: converterContext
        });
      }
    }
    return viewConverterConfigs.map(viewConverterConfig => {
      return getView(viewConverterConfig);
    });
  };
  const getMultiViewsControl = function (converterContext, views) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const viewsDefinition = manifestWrapper.getViewConfiguration();
    if (views.length > 1 && !hasMultiVisualizations(converterContext)) {
      return {
        showTabCounts: viewsDefinition ? (viewsDefinition === null || viewsDefinition === void 0 ? void 0 : viewsDefinition.showCounts) || manifestWrapper.hasMultipleEntitySets() : undefined,
        // with multi EntitySets, tab counts are displayed by default
        id: getIconTabBarID()
      };
    }
    return undefined;
  };
  function getAlpViewConfig(converterContext, viewConfigs) {
    const entityType = converterContext.getEntityType();
    const annotation = getCompliantVisualizationAnnotation(entityType, converterContext, true);
    let chart, table;
    if (annotation) {
      viewConfigs.push({
        annotation: annotation,
        converterContext
      });
    } else {
      chart = getDefaultChart(entityType);
      table = getDefaultLineItem(entityType);
      if (chart && table) {
        const primary = [{
          annotationPath: "@" + chart.term
        }];
        const secondary = [{
          annotationPath: "@" + table.term
        }];
        viewConfigs.push({
          converterContext: converterContext,
          primary: primary,
          secondary: secondary,
          defaultPath: "both"
        });
      } else {
        throw new Error("ALP flavor needs both chart and table to load the application");
      }
    }
    return viewConfigs;
  }
  function hasMultiVisualizations(converterContext) {
    return converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
  }
  const getHeaderActions = function (converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    return insertCustomElements([], getActionsFromManifest(manifestWrapper.getHeaderActions(), converterContext).actions);
  };
  _exports.getHeaderActions = getHeaderActions;
  const checkChartFilterBarId = function (views, filterBarId) {
    views.forEach(view => {
      if (!view.type) {
        const presentation = view.presentation;
        presentation.visualizations.forEach(visualizationDefinition => {
          if (visualizationDefinition.type === VisualizationType.Chart && visualizationDefinition.filterId !== filterBarId) {
            visualizationDefinition.filterId = filterBarId;
          }
        });
      }
    });
  };
  /**
   * Creates the ListReportDefinition for multiple entity sets (multiple table mode).
   *
   * @param converterContext The converter context
   * @returns The list report definition based on annotation + manifest
   */
  _exports.checkChartFilterBarId = checkChartFilterBarId;
  const convertPage = function (converterContext) {
    const entityType = converterContext.getEntityType();
    const sContextPath = converterContext.getContextPath();
    if (!sContextPath) {
      // If we don't have an entitySet at this point we have an issue I'd say
      throw new Error("An EntitySet is required to be able to display a ListReport, please adjust your `entitySet` property to point to one.");
    }
    const manifestWrapper = converterContext.getManifestWrapper();
    const viewsDefinition = manifestWrapper.getViewConfiguration();
    const hasMultipleEntitySets = manifestWrapper.hasMultipleEntitySets();
    const views = getViews(converterContext, viewsDefinition);
    const lrTableVisualizations = getTableVisualizations(views);
    const lrChartVisualizations = getChartVisualizations(views);
    const showPinnableToggle = lrTableVisualizations.some(table => table.control.type === "ResponsiveTable");
    let singleTableId = "";
    let singleChartId = "";
    const dynamicListReportId = getDynamicListReportID();
    const filterBarId = getFilterBarID(sContextPath);
    const filterVariantManagementID = getFilterVariantManagementID(filterBarId);
    const fbConfig = manifestWrapper.getFilterConfiguration();
    const filterInitialLayout = (fbConfig === null || fbConfig === void 0 ? void 0 : fbConfig.initialLayout) !== undefined ? fbConfig === null || fbConfig === void 0 ? void 0 : fbConfig.initialLayout.toLowerCase() : "compact";
    const filterLayout = (fbConfig === null || fbConfig === void 0 ? void 0 : fbConfig.layout) !== undefined ? fbConfig === null || fbConfig === void 0 ? void 0 : fbConfig.layout.toLowerCase() : "compact";
    const useSemanticDateRange = fbConfig.useSemanticDateRange !== undefined ? fbConfig.useSemanticDateRange : true;
    const showClearButton = fbConfig.showClearButton !== undefined ? fbConfig.showClearButton : false;
    const oConfig = getContentAreaId(converterContext, views);
    if (oConfig) {
      singleChartId = oConfig.chartId;
      singleTableId = oConfig.tableId;
    }
    const useHiddenFilterBar = manifestWrapper.useHiddenFilterBar();
    // Chart has a dependency to filter bar (issue with loading data). Once resolved, the check for chart should be removed here.
    // Until then, hiding filter bar is now allowed if a chart is being used on LR.
    const hideFilterBar = (manifestWrapper.isFilterBarHidden() || useHiddenFilterBar) && singleChartId === "";
    const lrFilterProperties = getSelectionFields(converterContext, lrTableVisualizations);
    const selectionFields = lrFilterProperties.selectionFields;
    const propertyInfoFields = lrFilterProperties.sPropertyInfo;
    const hideBasicSearch = getFilterBarHideBasicSearch(lrTableVisualizations, lrChartVisualizations, converterContext);
    const multiViewControl = getMultiViewsControl(converterContext, views);
    const selectionVariant = multiViewControl ? undefined : getSelectionVariant(entityType, converterContext);
    const defaultSemanticDates = useSemanticDateRange ? getDefaultSemanticDates(getManifestFilterFields(entityType, converterContext)) : {};
    // Sort header actions according to position attributes in manifest
    const headerActions = getHeaderActions(converterContext);
    if (hasMultipleEntitySets) {
      checkChartFilterBarId(views, filterBarId);
    }
    const visualizationIds = lrTableVisualizations.map(visualization => {
      return visualization.annotation.id;
    }).concat(lrChartVisualizations.map(visualization => {
      return visualization.id;
    }));
    const multiDimensionalGridIds = getMultiDimensionalGridIds(views);
    const targetControlIds = [...(hideFilterBar && !useHiddenFilterBar ? [] : [filterBarId]), ...(manifestWrapper.getVariantManagement() !== VariantManagementType.Control ? visualizationIds : []), ...(multiViewControl ? [multiViewControl.id] : []), ...(multiDimensionalGridIds.variantManagementId ? [multiDimensionalGridIds.variantManagementId] : [])];
    const stickySubheaderProvider = multiViewControl && manifestWrapper.getStickyMultiTabHeaderConfiguration() ? multiViewControl.id : undefined;
    return {
      mainEntitySet: sContextPath,
      mainEntityType: `${sContextPath}/`,
      multiViewsControl: multiViewControl,
      stickySubheaderProvider,
      singleTableId,
      singleChartId,
      multiDimensionalGridIds,
      dynamicListReportId,
      headerActions,
      showPinnableToggle: showPinnableToggle,
      filterBar: {
        propertyInfo: propertyInfoFields,
        selectionFields,
        hideBasicSearch,
        showClearButton
      },
      views: views,
      filterBarId: hideFilterBar && !useHiddenFilterBar ? "" : filterBarId,
      filterConditions: {
        selectionVariant: selectionVariant,
        defaultSemanticDates: defaultSemanticDates
      },
      variantManagement: {
        id: filterVariantManagementID,
        targetControlIds: targetControlIds.join(",")
      },
      hasMultiVisualizations: hasMultiVisualizations(converterContext),
      templateType: manifestWrapper.getTemplateType(),
      useSemanticDateRange,
      filterInitialLayout,
      filterLayout,
      kpiDefinitions: getKPIDefinitions(converterContext),
      hideFilterBar,
      useHiddenFilterBar
    };
  };
  _exports.convertPage = convertPage;
  function getContentAreaId(converterContext, views) {
    let singleTableId = "",
      singleChartId = "";
    if (converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      for (const lrView of views) {
        const view = lrView;
        if (view.chartControlId || view.tableControlId) {
          singleChartId = view.chartControlId ?? singleChartId;
          singleTableId = view.tableControlId ?? singleTableId;
          break;
        }
      }
    } else {
      for (const lrView of views) {
        const view = lrView;
        if (!singleTableId && view.tableControlId) {
          singleTableId = view.tableControlId || "";
        }
        if (!singleChartId && view.chartControlId) {
          singleChartId = view.chartControlId || "";
        }
        if (singleChartId && singleTableId) {
          break;
        }
      }
    }
    if (singleTableId || singleChartId) {
      return {
        chartId: singleChartId,
        tableId: singleTableId
      };
    }
    return undefined;
  }

  /**
   * Finds the IDs of the single MultiDimensionalGrid in the list report, if it exists.
   *
   * @param views
   * @returns An object containing the grid ID and the grid variant management ID.
   */
  function getMultiDimensionalGridIds(views) {
    for (const view of views) {
      var _primaryVisualization3, _primaryVisualization4;
      const gridVisualization = view === null || view === void 0 ? void 0 : (_primaryVisualization3 = view.primaryVisualization) === null || _primaryVisualization3 === void 0 ? void 0 : (_primaryVisualization4 = _primaryVisualization3.visualizations) === null || _primaryVisualization4 === void 0 ? void 0 : _primaryVisualization4[0];
      if ((gridVisualization === null || gridVisualization === void 0 ? void 0 : gridVisualization.type) === VisualizationType.MultiDimensionalGrid) {
        return {
          id: gridVisualization.id,
          variantManagementId: gridVisualization.variantManagementId
        };
      }
    }
    return {
      id: undefined,
      variantManagementId: undefined
    };
  }
  return _exports;
}, false);
