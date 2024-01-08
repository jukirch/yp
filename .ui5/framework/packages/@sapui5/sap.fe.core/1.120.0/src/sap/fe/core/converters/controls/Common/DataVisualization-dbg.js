/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/CommonHelper", "sap/ui/core/Core", "../../ManifestSettings", "./Chart", "./Table"], function (MetaModelConverter, IssueManager, StableIdHelper, TypeGuards, CommonHelper, Core, ManifestSettings, Chart, Table) {
  "use strict";

  var _exports = {};
  var createChartVisualization = Chart.createChartVisualization;
  var createBlankChartVisualization = Chart.createBlankChartVisualization;
  var VisualizationType = ManifestSettings.VisualizationType;
  var TemplateType = ManifestSettings.TemplateType;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var generate = StableIdHelper.generate;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  const getVisualizationsFromPresentationVariant = function (presentationVariantAnnotation, visualizationPath, converterContext, isMacroOrMultipleView) {
    const visualizationAnnotations = [];
    const isALP = isAlpAnnotation(converterContext);
    const baseVisualizationPath = visualizationPath.split("@")[0];
    if ((isMacroOrMultipleView === true || isALP) && !isPresentationCompliant(presentationVariantAnnotation, isALP)) {
      if (!annotationExistsInPresentationVariant(presentationVariantAnnotation, "com.sap.vocabularies.UI.v1.LineItem")) {
        const defaultLineItemAnnotation = prepareDefaultVisualization("com.sap.vocabularies.UI.v1.LineItem", baseVisualizationPath, converterContext);
        if (defaultLineItemAnnotation) {
          visualizationAnnotations.push(defaultLineItemAnnotation);
        }
      }
      if (!annotationExistsInPresentationVariant(presentationVariantAnnotation, "com.sap.vocabularies.UI.v1.Chart")) {
        const defaultChartAnnotation = prepareDefaultVisualization("com.sap.vocabularies.UI.v1.Chart", baseVisualizationPath, converterContext);
        if (defaultChartAnnotation) {
          visualizationAnnotations.push(defaultChartAnnotation);
        }
      }
    }
    const visualizations = presentationVariantAnnotation.Visualizations;
    const pushFirstVizOfType = function (allowedTerms) {
      const firstViz = visualizations === null || visualizations === void 0 ? void 0 : visualizations.find(viz => viz.$target !== undefined && allowedTerms.includes(viz.$target.term));
      if (firstViz) {
        visualizationAnnotations.push({
          visualization: firstViz.$target,
          annotationPath: `${baseVisualizationPath}${firstViz.value}`,
          converterContext: converterContext
        });
      }
    };
    if (isALP) {
      // In case of ALP, we use the first LineItem and the first Chart
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.LineItem"]);
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.Chart"]);
    } else {
      // Otherwise, we use the first viz only (Chart or LineItem)
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.Chart"]);
    }
    return visualizationAnnotations;
  };
  _exports.getVisualizationsFromPresentationVariant = getVisualizationsFromPresentationVariant;
  function getSelectionPresentationVariant(entityType, annotationPath, converterContext) {
    if (annotationPath) {
      const resolvedTarget = converterContext.getEntityTypeAnnotation(annotationPath);
      const selectionPresentationVariant = resolvedTarget.annotation;
      if (selectionPresentationVariant) {
        if (selectionPresentationVariant.term === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
          return selectionPresentationVariant;
        }
      } else {
        throw new Error("Annotation Path for the SPV mentioned in the manifest is not found, Please add the SPV in the annotation");
      }
    } else {
      var _entityType$annotatio, _entityType$annotatio2;
      return (_entityType$annotatio = entityType.annotations) === null || _entityType$annotatio === void 0 ? void 0 : (_entityType$annotatio2 = _entityType$annotatio.UI) === null || _entityType$annotatio2 === void 0 ? void 0 : _entityType$annotatio2.SelectionPresentationVariant;
    }
  }
  _exports.getSelectionPresentationVariant = getSelectionPresentationVariant;
  function isSelectionPresentationCompliant(selectionPresentationVariant, isALP) {
    const presentationVariant = selectionPresentationVariant && selectionPresentationVariant.PresentationVariant;
    if (presentationVariant) {
      return isPresentationCompliant(presentationVariant, isALP);
    } else {
      throw new Error("Presentation Variant is not present in the SPV annotation");
    }
  }
  _exports.isSelectionPresentationCompliant = isSelectionPresentationCompliant;
  function isPresentationCompliant(presentationVariant) {
    let isALP = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let hasTable = false,
      hasChart = false;
    if (isALP) {
      if (presentationVariant !== null && presentationVariant !== void 0 && presentationVariant.Visualizations) {
        const visualizations = presentationVariant.Visualizations;
        visualizations.forEach(visualization => {
          var _visualization$$targe, _visualization$$targe2;
          if (((_visualization$$targe = visualization.$target) === null || _visualization$$targe === void 0 ? void 0 : _visualization$$targe.term) === "com.sap.vocabularies.UI.v1.LineItem") {
            hasTable = true;
          }
          if (((_visualization$$targe2 = visualization.$target) === null || _visualization$$targe2 === void 0 ? void 0 : _visualization$$targe2.term) === "com.sap.vocabularies.UI.v1.Chart") {
            hasChart = true;
          }
        });
      }
      return hasChart && hasTable;
    } else {
      return (presentationVariant === null || presentationVariant === void 0 ? void 0 : presentationVariant.Visualizations) && !!presentationVariant.Visualizations.find(visualization => {
        var _visualization$$targe3, _visualization$$targe4;
        return ((_visualization$$targe3 = visualization.$target) === null || _visualization$$targe3 === void 0 ? void 0 : _visualization$$targe3.term) === "com.sap.vocabularies.UI.v1.LineItem" || ((_visualization$$targe4 = visualization.$target) === null || _visualization$$targe4 === void 0 ? void 0 : _visualization$$targe4.term) === "com.sap.vocabularies.UI.v1.Chart";
      });
    }
  }
  _exports.isPresentationCompliant = isPresentationCompliant;
  function getDefaultLineItem(entityType) {
    var _entityType$annotatio3;
    return (_entityType$annotatio3 = entityType.annotations.UI) === null || _entityType$annotatio3 === void 0 ? void 0 : _entityType$annotatio3.LineItem;
  }
  _exports.getDefaultLineItem = getDefaultLineItem;
  function getDefaultChart(entityType) {
    var _entityType$annotatio4;
    return (_entityType$annotatio4 = entityType.annotations.UI) === null || _entityType$annotatio4 === void 0 ? void 0 : _entityType$annotatio4.Chart;
  }
  _exports.getDefaultChart = getDefaultChart;
  function getDefaultPresentationVariant(entityType) {
    var _entityType$annotatio5, _entityType$annotatio6;
    return (_entityType$annotatio5 = entityType.annotations) === null || _entityType$annotatio5 === void 0 ? void 0 : (_entityType$annotatio6 = _entityType$annotatio5.UI) === null || _entityType$annotatio6 === void 0 ? void 0 : _entityType$annotatio6.PresentationVariant;
  }
  _exports.getDefaultPresentationVariant = getDefaultPresentationVariant;
  function getDefaultSelectionVariant(entityType) {
    var _entityType$annotatio7, _entityType$annotatio8;
    return (_entityType$annotatio7 = entityType.annotations) === null || _entityType$annotatio7 === void 0 ? void 0 : (_entityType$annotatio8 = _entityType$annotatio7.UI) === null || _entityType$annotatio8 === void 0 ? void 0 : _entityType$annotatio8.SelectionVariant;
  }
  _exports.getDefaultSelectionVariant = getDefaultSelectionVariant;
  function getSelectionVariant(entityType, converterContext) {
    const annotationPath = converterContext.getManifestWrapper().getDefaultTemplateAnnotationPath();
    const selectionPresentationVariant = getSelectionPresentationVariant(entityType, annotationPath, converterContext);
    let selectionVariant;
    if (selectionPresentationVariant) {
      selectionVariant = selectionPresentationVariant.SelectionVariant;
      if (selectionVariant) {
        return selectionVariant;
      }
    } else {
      selectionVariant = getDefaultSelectionVariant(entityType);
      return selectionVariant;
    }
  }
  _exports.getSelectionVariant = getSelectionVariant;
  function getDataVisualizationConfiguration(visualizationPath, isCondensedTableLayoutCompliant, inConverterContext, viewConfiguration, doNotCheckApplySupported, associatedPresentationVariantPath, isMacroOrMultipleView) {
    const resolvedTarget = visualizationPath !== "" ? inConverterContext.getEntityTypeAnnotation(visualizationPath) : {
      annotation: undefined,
      converterContext: inConverterContext
    };
    const resolvedAssociatedPresentationVariant = associatedPresentationVariantPath ? inConverterContext.getEntityTypeAnnotation(associatedPresentationVariantPath) : null;
    const resolvedVisualization = resolvedTarget.annotation;
    inConverterContext = resolvedTarget.converterContext;
    let visualizationAnnotations = [];
    let presentationVariantAnnotation;
    let presentationPath = "";
    let chartVisualization, tableVisualization;
    const term = resolvedVisualization === null || resolvedVisualization === void 0 ? void 0 : resolvedVisualization.term;
    if (term) {
      switch (term) {
        case "com.sap.vocabularies.UI.v1.LineItem":
        case "com.sap.vocabularies.UI.v1.Chart":
          presentationVariantAnnotation = resolvedAssociatedPresentationVariant === null || resolvedAssociatedPresentationVariant === void 0 ? void 0 : resolvedAssociatedPresentationVariant.annotation;
          visualizationAnnotations.push({
            visualization: resolvedVisualization,
            annotationPath: visualizationPath,
            converterContext: inConverterContext
          });
          break;
        case "com.sap.vocabularies.UI.v1.PresentationVariant":
          presentationVariantAnnotation = resolvedVisualization;
          visualizationAnnotations = visualizationAnnotations.concat(getVisualizationsFromPresentationVariant(resolvedVisualization, visualizationPath, inConverterContext, isMacroOrMultipleView));
          break;
        case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
          presentationVariantAnnotation = resolvedVisualization.PresentationVariant;
          // Presentation can be inline or outside the SelectionPresentationVariant
          presentationPath = presentationVariantAnnotation.fullyQualifiedName;
          visualizationAnnotations = visualizationAnnotations.concat(getVisualizationsFromPresentationVariant(presentationVariantAnnotation, visualizationPath, inConverterContext, isMacroOrMultipleView));
          break;
        default:
          break;
      }
      visualizationAnnotations.forEach(visualizationAnnotation => {
        const {
          visualization,
          annotationPath,
          converterContext
        } = visualizationAnnotation;
        switch (visualization.term) {
          case "com.sap.vocabularies.UI.v1.Chart":
            chartVisualization = createChartVisualization(visualization, annotationPath, converterContext, doNotCheckApplySupported, viewConfiguration);
            break;
          case "com.sap.vocabularies.UI.v1.LineItem":
          default:
            tableVisualization = Table.createTableVisualization(visualization, annotationPath, converterContext, presentationVariantAnnotation, isCondensedTableLayoutCompliant, viewConfiguration);
            break;
        }
      });
    }
    const visualizations = [];
    let path = term === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant" ? presentationPath : resolvedVisualization === null || resolvedVisualization === void 0 ? void 0 : resolvedVisualization.fullyQualifiedName;
    if (path === undefined) {
      path = "/";
    }
    const isALP = isAlpAnnotation(inConverterContext);
    if (!term || isALP && tableVisualization === undefined) {
      tableVisualization = Table.createDefaultTableVisualization(inConverterContext, isMacroOrMultipleView !== true);
      inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_LINEITEM);
    }
    if (isALP && chartVisualization === undefined) {
      chartVisualization = createBlankChartVisualization(inConverterContext);
      inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_CHART);
    }
    if (chartVisualization) {
      visualizations.push(chartVisualization);
    }
    if (tableVisualization) {
      visualizations.push(tableVisualization);
    }
    return {
      visualizations: visualizations,
      annotationPath: inConverterContext.getEntitySetBasedAnnotationPath(path)
    };
  }
  /**
   * Returns the context of the UI controls (either a UI.LineItem, or a UI.Chart).
   *
   * @param presentationContext Object of the presentation context (either a presentation variant, or a UI.LineItem, or a UI.Chart)
   * @param controlPath Control path
   * @returns The context of the control (either a UI.LineItem, or a UI.Chart)
   */
  _exports.getDataVisualizationConfiguration = getDataVisualizationConfiguration;
  function getUiControl(presentationContext, controlPath) {
    CommonHelper.validatePresentationMetaPath(presentationContext.getPath(), controlPath);
    const presentation = MetaModelConverter.convertMetaModelContext(presentationContext),
      model = presentationContext.getModel();
    if (presentation) {
      if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") || isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.PresentationVariantType")) {
        let visualizations;
        if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") && presentation.PresentationVariant) {
          visualizations = presentation.PresentationVariant.Visualizations;
        } else if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.PresentationVariantType")) {
          visualizations = presentation.Visualizations;
        }
        if (Array.isArray(visualizations)) {
          for (const visualization of visualizations) {
            if (visualization.type == "AnnotationPath" && visualization.value.includes(controlPath) &&
            // check if object exists for PresentationVariant visualization
            !!model.getMetaContext(presentationContext.getPath().split("@")[0] + visualization.value).getObject()) {
              controlPath = visualization.value;
              break;
            }
          }
        }
      } else {
        return presentationContext;
      }
    }
    return model.getMetaContext(presentationContext.getPath().split("@")[0] + controlPath);
  }
  _exports.getUiControl = getUiControl;
  const annotationExistsInPresentationVariant = function (presentationVariantAnnotation, annotationTerm) {
    var _presentationVariantA;
    return ((_presentationVariantA = presentationVariantAnnotation.Visualizations) === null || _presentationVariantA === void 0 ? void 0 : _presentationVariantA.some(visualization => visualization.value.includes(annotationTerm))) ?? false;
  };
  _exports.annotationExistsInPresentationVariant = annotationExistsInPresentationVariant;
  const prepareDefaultVisualization = function (visualizationType, baseVisualizationPath, converterContext) {
    const entityType = converterContext.getEntityType();
    const defaultAnnotation = visualizationType === "com.sap.vocabularies.UI.v1.LineItem" ? getDefaultLineItem(entityType) : getDefaultChart(entityType);
    if (defaultAnnotation) {
      return {
        visualization: defaultAnnotation,
        annotationPath: `${baseVisualizationPath}${converterContext.getRelativeAnnotationPath(defaultAnnotation.fullyQualifiedName, entityType)}`,
        converterContext: converterContext
      };
    }
    return undefined;
  };
  _exports.prepareDefaultVisualization = prepareDefaultVisualization;
  const isAlpAnnotation = function (converterContext) {
    return converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
  };
  _exports.isAlpAnnotation = isAlpAnnotation;
  const getMultiDimensionalGridVisualization = function (configuration) {
    if (Core.getLoadedLibraries().hasOwnProperty("sap.sac.df")) {
      return {
        visualizations: [{
          type: VisualizationType.MultiDimensionalGrid,
          id: generate(["fe", "MultiDimensionalGrid", configuration.dataProviderName]),
          variantManagementId: generate(["fe", "MultiDimensionalGrid", configuration.dataProviderName, "vm"]),
          modelName: configuration.modelName,
          dataProviderName: configuration.dataProviderName,
          dimensionMapping: configuration.dimensionMapping
        }]
      };
    } else {
      throw new Error("You need to add 'sap.sac.df' to sap.ui5.dependencies.libs in order to use the DragonFly multidimensional grid!");
    }
  };
  _exports.getMultiDimensionalGridVisualization = getMultiDimensionalGridVisualization;
  return _exports;
}, false);
