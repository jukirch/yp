/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/ObjectPage/HeaderFacet", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "../../ManifestSettings", "../../annotations/DataField", "../../helpers/ConfigurableObject", "../../helpers/ID", "../../objectPage/FormMenuActions", "../Common/DataVisualization", "../Common/Form"], function (Log, Action, HeaderFacet, IssueManager, Key, BindingToolkit, TypeGuards, ManifestSettings, DataField, ConfigurableObject, ID, FormMenuActions, DataVisualization, Form) {
  "use strict";

  var _exports = {};
  var isReferenceFacet = Form.isReferenceFacet;
  var createFormDefinition = Form.createFormDefinition;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var getVisibilityEnablementFormMenuActions = FormMenuActions.getVisibilityEnablementFormMenuActions;
  var getFormHiddenActions = FormMenuActions.getFormHiddenActions;
  var getFormActions = FormMenuActions.getFormActions;
  var getSubSectionID = ID.getSubSectionID;
  var getSideContentID = ID.getSideContentID;
  var getFormID = ID.getFormID;
  var getCustomSubSectionID = ID.getCustomSubSectionID;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var isActionWithDialog = DataField.isActionWithDialog;
  var ActionType = ManifestSettings.ActionType;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var KeyHelper = Key.KeyHelper;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var getStashedSettingsForHeaderFacet = HeaderFacet.getStashedSettingsForHeaderFacet;
  var getHeaderFacetsFromManifest = HeaderFacet.getHeaderFacetsFromManifest;
  var getDesignTimeMetadataSettingsForHeaderFacet = HeaderFacet.getDesignTimeMetadataSettingsForHeaderFacet;
  var removeDuplicateActions = Action.removeDuplicateActions;
  var isActionNavigable = Action.isActionNavigable;
  var getSemanticObjectMapping = Action.getSemanticObjectMapping;
  var getEnabledForAnnotationAction = Action.getEnabledForAnnotationAction;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var ButtonType = Action.ButtonType;
  let SubSectionType;
  (function (SubSectionType) {
    SubSectionType["Unknown"] = "Unknown";
    SubSectionType["Form"] = "Form";
    SubSectionType["Notes"] = "Notes";
    SubSectionType["DataVisualization"] = "DataVisualization";
    SubSectionType["XMLFragment"] = "XMLFragment";
    SubSectionType["Placeholder"] = "Placeholder";
    SubSectionType["Mixed"] = "Mixed";
    SubSectionType["EmbeddedComponent"] = "EmbeddedComponent";
  })(SubSectionType || (SubSectionType = {}));
  _exports.SubSectionType = SubSectionType;
  const visualizationTerms = ["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.Chart", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"];

  /**
   * Create subsections based on facet definition.
   *
   * @param facetCollection Collection of facets
   * @param converterContext The converter context
   * @param isHeaderSection True if header section is generated in this iteration
   * @returns The current subsections
   */
  function createSubSections(facetCollection, converterContext, isHeaderSection) {
    // First we determine which sub section we need to create
    const facetsToCreate = facetCollection.reduce((facetsToCreate, facetDefinition) => {
      switch (facetDefinition.$Type) {
        case "com.sap.vocabularies.UI.v1.ReferenceFacet":
          facetsToCreate.push(facetDefinition);
          break;
        case "com.sap.vocabularies.UI.v1.CollectionFacet":
          // TODO If the Collection Facet has a child of type Collection Facet we bring them up one level (Form + Table use case) ?
          // first case facet Collection is combination of collection and reference facet or not all facets are reference facets.
          if (facetDefinition.Facets.find(facetType => facetType.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet")) {
            facetsToCreate.splice(facetsToCreate.length, 0, ...facetDefinition.Facets);
          } else {
            facetsToCreate.push(facetDefinition);
          }
          break;
        case "com.sap.vocabularies.UI.v1.ReferenceURLFacet":
          // Not supported
          break;
      }
      return facetsToCreate;
    }, []);

    // Then we create the actual subsections
    return facetsToCreate.map(facet => {
      var _Facets;
      return createSubSection(facet, facetsToCreate, converterContext, 0, !(facet !== null && facet !== void 0 && (_Facets = facet.Facets) !== null && _Facets !== void 0 && _Facets.length), isHeaderSection);
    });
  }

  /**
   * Creates subsections based on the definition of the custom header facet.
   *
   * @param converterContext The converter context
   * @returns The current subsections
   */
  _exports.createSubSections = createSubSections;
  function createCustomHeaderFacetSubSections(converterContext) {
    const customHeaderFacets = getHeaderFacetsFromManifest(converterContext.getManifestWrapper().getHeaderFacets());
    const aCustomHeaderFacets = [];
    Object.keys(customHeaderFacets).forEach(function (key) {
      aCustomHeaderFacets.push(customHeaderFacets[key]);
      return aCustomHeaderFacets;
    });
    const facetsToCreate = aCustomHeaderFacets.reduce((facetsToCreate, customHeaderFacet) => {
      if (customHeaderFacet.templateEdit) {
        facetsToCreate.push(customHeaderFacet);
      }
      return facetsToCreate;
    }, []);
    return facetsToCreate.map(customHeaderFacet => createCustomHeaderFacetSubSection(customHeaderFacet));
  }

  /**
   * Creates a subsection based on a custom header facet.
   *
   * @param customHeaderFacet A custom header facet
   * @returns A definition for a subsection
   */
  _exports.createCustomHeaderFacetSubSections = createCustomHeaderFacetSubSections;
  function createCustomHeaderFacetSubSection(customHeaderFacet) {
    const subSectionID = getCustomSubSectionID(customHeaderFacet.key);
    const subSection = {
      id: subSectionID,
      key: customHeaderFacet.key,
      title: customHeaderFacet.title,
      type: SubSectionType.XMLFragment,
      template: customHeaderFacet.templateEdit || "",
      visible: customHeaderFacet.visible,
      level: 1,
      sideContent: undefined,
      stashed: customHeaderFacet.stashed,
      flexSettings: customHeaderFacet.flexSettings,
      actions: {},
      objectPageLazyLoaderEnabled: false
    };
    return subSection;
  }

  // function isTargetForCompliant(annotationPath: AnnotationPath) {
  // 	return /.*com\.sap\.vocabularies\.UI\.v1\.(FieldGroup|Identification|DataPoint|StatusInfo).*/.test(annotationPath.value);
  // }
  const getSubSectionKey = (facetDefinition, fallback) => {
    var _facetDefinition$ID, _facetDefinition$Labe;
    return ((_facetDefinition$ID = facetDefinition.ID) === null || _facetDefinition$ID === void 0 ? void 0 : _facetDefinition$ID.toString()) || ((_facetDefinition$Labe = facetDefinition.Label) === null || _facetDefinition$Labe === void 0 ? void 0 : _facetDefinition$Labe.toString()) || fallback;
  };
  /**
   * Adds Form menu action to all form actions, removes duplicate actions and hidden actions.
   *
   * @param actions The actions involved
   * @param facetDefinition The definition for the facet
   * @param converterContext The converter context
   * @returns The form menu actions
   */
  function addFormMenuActions(actions, facetDefinition, converterContext) {
    const hiddenActions = getFormHiddenActions(facetDefinition, converterContext) || [],
      formActions = getFormActions(facetDefinition, converterContext),
      manifestActions = getActionsFromManifest(formActions, converterContext, actions, undefined, undefined, hiddenActions),
      actionOverwriteConfig = {
        enabled: OverrideType.overwrite,
        visible: OverrideType.overwrite,
        command: OverrideType.overwrite
      },
      formAllActions = insertCustomElements(actions, manifestActions.actions, actionOverwriteConfig);
    return {
      actions: formAllActions ? getVisibilityEnablementFormMenuActions(removeDuplicateActions(formAllActions)) : actions,
      commandActions: manifestActions.commandActions
    };
  }

  /**
   * Retrieves the action form a facet.
   *
   * @param facetDefinition
   * @param converterContext
   * @returns The current facet actions
   */
  function getFacetActions(facetDefinition, converterContext) {
    let actions = [];
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        actions = facetDefinition.Facets.filter(subFacetDefinition => isReferenceFacet(subFacetDefinition)).reduce((actionReducer, referenceFacet) => createFormActionReducer(actionReducer, referenceFacet, converterContext), []);
        break;
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        actions = createFormActionReducer([], facetDefinition, converterContext);
        break;
      default:
        break;
    }
    return addFormMenuActions(actions, facetDefinition, converterContext);
  }
  /**
   * Returns the button type based on @UI.Emphasized annotation.
   *
   * @param emphasized Emphasized annotation value.
   * @returns The button type or path based expression.
   */
  function getButtonType(emphasized) {
    // Emphasized is a boolean so if it's equal to true we show the button as Ghost, otherwise as Transparent
    const buttonTypeCondition = equal(getExpressionFromAnnotation(emphasized), true);
    return compileExpression(ifElse(buttonTypeCondition, ButtonType.Ghost, ButtonType.Transparent));
  }

  /**
   * Create a subsection based on FacetTypes.
   *
   * @param facetDefinition
   * @param facetsToCreate
   * @param converterContext
   * @param level
   * @param hasSingleContent
   * @param isHeaderSection
   * @returns A subsection definition
   */
  function createSubSection(facetDefinition, facetsToCreate, converterContext, level, hasSingleContent, isHeaderSection) {
    var _facetDefinition$anno, _facetDefinition$anno2, _presentation$visuali, _presentation$visuali2, _presentation$visuali3, _facetDefinition$anno3, _facetDefinition$anno4, _facetDefinition$anno5;
    const subSectionID = getSubSectionID(facetDefinition);
    const oHiddenAnnotation = (_facetDefinition$anno = facetDefinition.annotations) === null || _facetDefinition$anno === void 0 ? void 0 : (_facetDefinition$anno2 = _facetDefinition$anno.UI) === null || _facetDefinition$anno2 === void 0 ? void 0 : _facetDefinition$anno2.Hidden;
    const isVisibleExpression = not(equal(true, getExpressionFromAnnotation(oHiddenAnnotation)));
    const isVisible = compileExpression(isVisibleExpression);
    const isDynamicExpression = isVisible !== undefined && typeof isVisible === "string" && isVisible.indexOf("{=") === 0 && !isPathAnnotationExpression(oHiddenAnnotation);
    const isVisibleDynamicExpression = isVisible && isDynamicExpression ? isVisible.substring(isVisible.indexOf("{=") + 2, isVisible.lastIndexOf("}")) !== undefined : false;
    const title = compileExpression(getExpressionFromAnnotation(facetDefinition.Label));
    const subSection = {
      id: subSectionID,
      key: getSubSectionKey(facetDefinition, subSectionID),
      title: title,
      type: SubSectionType.Unknown,
      annotationPath: converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName),
      visible: isVisible,
      isVisibilityDynamic: isDynamicExpression,
      level: level,
      sideContent: undefined,
      objectPageLazyLoaderEnabled: converterContext.getManifestWrapper().getEnableLazyLoading()
    };
    if (isHeaderSection) {
      subSection.stashed = getStashedSettingsForHeaderFacet(facetDefinition, facetDefinition, converterContext);
      subSection.flexSettings = {
        designtime: getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, facetDefinition, converterContext)
      };
    }
    let unsupportedText = "";
    level++;
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        const facets = facetDefinition.Facets;

        // Filter for all facets of this subsection that are referring to an annotation describing a visualization (e.g. table or chart)
        const visualizationFacets = facets.map((facet, index) => ({
          index,
          facet
        })) // Remember the index assigned to each facet
        .filter(_ref => {
          let {
            facet
          } = _ref;
          return isReferenceFacet(facet) && facet.Target.$target && visualizationTerms.includes(facet.Target.$target.term);
        });

        // Filter out all visualization facets; "visualizationFacets" and "nonVisualizationFacets" are disjoint
        const nonVisualizationFacets = facets.filter(facet => !visualizationFacets.find(visualization => visualization.facet === facet));
        if (visualizationFacets.length > 0) {
          // CollectionFacets with visualizations must be handled separately as they cannot be included in forms
          const visualizationContent = [];
          const formContent = [];
          const mixedContent = [];

          // Create each visualization facet as if it was its own subsection (via recursion), and keep their relative ordering
          for (const {
            facet
          } of visualizationFacets) {
            visualizationContent.push(createSubSection(facet, [], converterContext, level, true, isHeaderSection));
          }
          if (nonVisualizationFacets.length > 0) {
            // This subsection includes visualizations and other content, so it is a "Mixed" subsection
            Log.warning(`Warning: CollectionFacet '${facetDefinition.ID}' includes a combination of either a chart or a table and other content. This can lead to rendering issues. Consider moving the chart or table into a separate CollectionFacet.`);
            const fakeFormFacet = {
              ...facetDefinition
            };
            fakeFormFacet.Facets = nonVisualizationFacets;
            // Create a joined form of all facets that are not referring to visualizations
            formContent.push(createSubSection(fakeFormFacet, [], converterContext, level, hasSingleContent, isHeaderSection));
          }

          // Merge the visualization content with the form content
          if (visualizationFacets.find(_ref2 => {
            let {
              index
            } = _ref2;
            return index === 0;
          })) {
            // If the first facet is a visualization, display the visualizations first
            mixedContent.push(...visualizationContent);
            mixedContent.push(...formContent);
          } else {
            // Otherwise, display the form first
            mixedContent.push(...formContent);
            mixedContent.push(...visualizationContent);
          }
          const mixedSubSection = {
            ...subSection,
            type: SubSectionType.Mixed,
            level: level,
            content: mixedContent
          };
          return mixedSubSection;
        } else {
          // This CollectionFacet only includes content that can be rendered in a merged form
          const facetActions = getFacetActions(facetDefinition, converterContext),
            formCollectionSubSection = {
              ...subSection,
              type: SubSectionType.Form,
              formDefinition: createFormDefinition(facetDefinition, isVisible, converterContext, facetActions.actions),
              level: level,
              actions: facetActions.actions.filter(action => action.facetName === undefined),
              commandActions: facetActions.commandActions
            };
          return formCollectionSubSection;
        }
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        if (!facetDefinition.Target.$target) {
          unsupportedText = `Unable to find annotationPath ${facetDefinition.Target.value}`;
        } else {
          switch (facetDefinition.Target.$target.term) {
            case "com.sap.vocabularies.UI.v1.LineItem":
            case "com.sap.vocabularies.UI.v1.Chart":
            case "com.sap.vocabularies.UI.v1.PresentationVariant":
            case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
              const presentation = getDataVisualizationConfiguration(facetDefinition.Target.value, getCondensedTableLayoutCompliance(facetDefinition, facetsToCreate, converterContext), converterContext, undefined, isHeaderSection);
              const subSectionTitle = subSection.title ? subSection.title : "";
              const controlTitle = ((_presentation$visuali = presentation.visualizations[0]) === null || _presentation$visuali === void 0 ? void 0 : (_presentation$visuali2 = _presentation$visuali.annotation) === null || _presentation$visuali2 === void 0 ? void 0 : _presentation$visuali2.title) || ((_presentation$visuali3 = presentation.visualizations[0]) === null || _presentation$visuali3 === void 0 ? void 0 : _presentation$visuali3.title);
              const isPartOfPreview = ((_facetDefinition$anno3 = facetDefinition.annotations) === null || _facetDefinition$anno3 === void 0 ? void 0 : (_facetDefinition$anno4 = _facetDefinition$anno3.UI) === null || _facetDefinition$anno4 === void 0 ? void 0 : (_facetDefinition$anno5 = _facetDefinition$anno4.PartOfPreview) === null || _facetDefinition$anno5 === void 0 ? void 0 : _facetDefinition$anno5.valueOf()) !== false;
              const showTitle = getTitleVisibility(controlTitle ?? "", subSectionTitle, hasSingleContent);

              // Either calculate the title visibility statically or dynamically
              // Additionally to checking whether a title exists,
              // we also need to check that the facet title is not the same as the control (i.e. visualization) title;
              // this is done by including "showTitle" in the and expression
              const titleVisible = ifElse(isDynamicExpression, and(isVisibleDynamicExpression, not(equal(title, "undefined")), showTitle), and(isVisible !== undefined, title !== "undefined", title !== undefined, isVisibleExpression, showTitle));
              const dataVisualizationSubSection = {
                ...subSection,
                type: SubSectionType.DataVisualization,
                level: level,
                presentation: presentation,
                showTitle: compileExpression(showTitle),
                // This is used on the ObjectPageSubSection
                isPartOfPreview,
                titleVisible: compileExpression(titleVisible) // This is used to hide the actual Title control
              };

              return dataVisualizationSubSection;
            case "com.sap.vocabularies.UI.v1.FieldGroup":
            case "com.sap.vocabularies.UI.v1.Identification":
            case "com.sap.vocabularies.UI.v1.DataPoint":
            case "com.sap.vocabularies.UI.v1.StatusInfo":
            case "com.sap.vocabularies.Communication.v1.Contact":
              // All those element belong to a from facet
              const facetActions = getFacetActions(facetDefinition, converterContext),
                formElementSubSection = {
                  ...subSection,
                  type: SubSectionType.Form,
                  level: level,
                  formDefinition: createFormDefinition(facetDefinition, isVisible, converterContext, facetActions.actions),
                  actions: facetActions.actions.filter(action => action.facetName === undefined),
                  commandActions: facetActions.commandActions
                };
              return formElementSubSection;
            case "com.sap.vocabularies.UI.v1.Note":
              return {
                ...subSection,
                type: SubSectionType.Notes
              };
            default:
              unsupportedText = `For ${facetDefinition.Target.$target.term} Fragment`;
              break;
          }
        }
        break;
      case "com.sap.vocabularies.UI.v1.ReferenceURLFacet":
        unsupportedText = "For Reference URL Facet";
        break;
      default:
        break;
    }
    // If we reach here we ended up with an unsupported SubSection type
    const unsupportedSubSection = {
      ...subSection,
      text: unsupportedText
    };
    return unsupportedSubSection;
  }

  /**
   * Checks whether to hide or show subsection title.
   *
   * @param controlTitle
   * @param subSectionTitle
   * @param hasSingleContent
   * @returns Boolean value or expression for showTitle
   */
  _exports.createSubSection = createSubSection;
  function getTitleVisibility(controlTitle, subSectionTitle, hasSingleContent) {
    // visible shall be true if there are multiple content or if the control and subsection title are different
    return or(not(hasSingleContent), notEqual(resolveBindingString(controlTitle), resolveBindingString(subSectionTitle)));
  }
  _exports.getTitleVisibility = getTitleVisibility;
  function createFormActionReducer(actions, facetDefinition, converterContext) {
    const referenceTarget = facetDefinition.Target.$target;
    const targetValue = facetDefinition.Target.value;
    let manifestActions = {};
    let dataFieldCollection = [];
    let navigationPropertyPath;
    [navigationPropertyPath] = targetValue.split("@");
    if (navigationPropertyPath.length > 0) {
      if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
        navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
      }
    } else {
      navigationPropertyPath = undefined;
    }
    if (referenceTarget) {
      switch (referenceTarget.term) {
        case "com.sap.vocabularies.UI.v1.FieldGroup":
          dataFieldCollection = referenceTarget.Data;
          manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(referenceTarget).actions, converterContext, undefined, undefined, undefined, undefined, facetDefinition.fullyQualifiedName).actions;
          break;
        case "com.sap.vocabularies.UI.v1.Identification":
        case "com.sap.vocabularies.UI.v1.StatusInfo":
          if (referenceTarget.qualifier) {
            dataFieldCollection = referenceTarget;
          }
          break;
        default:
          break;
      }
    }
    actions = dataFieldCollection.reduce((actionReducer, dataField) => {
      var _dataField$RequiresCo, _dataField$Inline, _dataField$Determinin, _dataField$Label, _dataField$annotation, _dataField$annotation2, _dataField$annotation3, _dataField$annotation4, _dataField$Label2, _dataField$annotation5, _dataField$annotation6, _dataField$annotation7, _dataField$annotation8, _dataField$Label3;
      switch (dataField.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          if (((_dataField$RequiresCo = dataField.RequiresContext) === null || _dataField$RequiresCo === void 0 ? void 0 : _dataField$RequiresCo.valueOf()) === true) {
            converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.REQUIRESCONTEXT);
          }
          if (((_dataField$Inline = dataField.Inline) === null || _dataField$Inline === void 0 ? void 0 : _dataField$Inline.valueOf()) === true) {
            converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.INLINE);
          }
          if (((_dataField$Determinin = dataField.Determining) === null || _dataField$Determinin === void 0 ? void 0 : _dataField$Determinin.valueOf()) === true) {
            converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.DETERMINING);
          }
          const mNavigationParameters = {};
          if (dataField.Mapping) {
            mNavigationParameters.semanticObjectMapping = getSemanticObjectMapping(dataField.Mapping);
          }
          actionReducer.push({
            type: ActionType.DataFieldForIntentBasedNavigation,
            id: getFormID(facetDefinition, dataField),
            key: KeyHelper.generateKeyFromDataField(dataField),
            text: (_dataField$Label = dataField.Label) === null || _dataField$Label === void 0 ? void 0 : _dataField$Label.toString(),
            annotationPath: "",
            enabled: dataField.NavigationAvailable !== undefined ? compileExpression(equal(getExpressionFromAnnotation(dataField.NavigationAvailable), true)) : "true",
            visible: compileExpression(not(equal(getExpressionFromAnnotation((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : _dataField$annotation2.Hidden), true))),
            buttonType: getButtonType((_dataField$annotation3 = dataField.annotations) === null || _dataField$annotation3 === void 0 ? void 0 : (_dataField$annotation4 = _dataField$annotation3.UI) === null || _dataField$annotation4 === void 0 ? void 0 : _dataField$annotation4.Emphasized),
            press: compileExpression(fn("._intentBasedNavigation.navigate", [getExpressionFromAnnotation(dataField.SemanticObject), getExpressionFromAnnotation(dataField.Action), mNavigationParameters])),
            customData: compileExpression({
              semanticObject: getExpressionFromAnnotation(dataField.SemanticObject),
              action: getExpressionFromAnnotation(dataField.Action)
            })
          });
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
          const formManifestActionsConfiguration = converterContext.getManifestControlConfiguration(referenceTarget).actions;
          const key = KeyHelper.generateKeyFromDataField(dataField);
          actionReducer.push({
            type: ActionType.DataFieldForAction,
            id: getFormID(facetDefinition, dataField),
            key: key,
            text: (_dataField$Label2 = dataField.Label) === null || _dataField$Label2 === void 0 ? void 0 : _dataField$Label2.toString(),
            annotationPath: "",
            enabled: getEnabledForAnnotationAction(converterContext, dataField.ActionTarget),
            binding: navigationPropertyPath ? `{ 'path' : '${navigationPropertyPath}'}` : undefined,
            visible: compileExpression(not(equal(getExpressionFromAnnotation((_dataField$annotation5 = dataField.annotations) === null || _dataField$annotation5 === void 0 ? void 0 : (_dataField$annotation6 = _dataField$annotation5.UI) === null || _dataField$annotation6 === void 0 ? void 0 : _dataField$annotation6.Hidden), true))),
            requiresDialog: isActionWithDialog(dataField),
            buttonType: getButtonType((_dataField$annotation7 = dataField.annotations) === null || _dataField$annotation7 === void 0 ? void 0 : (_dataField$annotation8 = _dataField$annotation7.UI) === null || _dataField$annotation8 === void 0 ? void 0 : _dataField$annotation8.Emphasized),
            press: compileExpression(fn("invokeAction", [dataField.Action, {
              contexts: fn("getBindingContext", [], pathInModel("", "$source")),
              invocationGrouping: dataField.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
              label: (_dataField$Label3 = dataField.Label) === null || _dataField$Label3 === void 0 ? void 0 : _dataField$Label3.toString(),
              model: fn("getModel", [], pathInModel("/", "$source")),
              isNavigable: isActionNavigable(formManifestActionsConfiguration && formManifestActionsConfiguration[key])
            }], ref(".editFlow"))),
            facetName: dataField.Inline ? facetDefinition.fullyQualifiedName : undefined
          });
          break;
        default:
          break;
      }
      return actionReducer;
    }, actions);
    // Overwriting of actions happens in addFormMenuActions
    return insertCustomElements(actions, manifestActions);
  }
  function isDialog(actionDefinition) {
    if (actionDefinition) {
      var _actionDefinition$ann, _actionDefinition$ann2;
      const bCritical = (_actionDefinition$ann = actionDefinition.annotations) === null || _actionDefinition$ann === void 0 ? void 0 : (_actionDefinition$ann2 = _actionDefinition$ann.Common) === null || _actionDefinition$ann2 === void 0 ? void 0 : _actionDefinition$ann2.IsActionCritical;
      if (actionDefinition.parameters.length > 1 || bCritical) {
        return "Dialog";
      } else {
        return "None";
      }
    } else {
      return "None";
    }
  }
  _exports.isDialog = isDialog;
  function createCustomSubSections(manifestSubSections, converterContext) {
    const subSections = {};
    Object.keys(manifestSubSections).forEach(subSectionKey => subSections[subSectionKey] = createCustomSubSection(manifestSubSections[subSectionKey], subSectionKey, converterContext));
    return subSections;
  }
  _exports.createCustomSubSections = createCustomSubSections;
  function createCustomSubSection(manifestSubSection, subSectionKey, converterContext) {
    const sideContent = manifestSubSection.sideContent ? {
      template: manifestSubSection.sideContent.template,
      id: getSideContentID(subSectionKey),
      visible: false,
      equalSplit: manifestSubSection.sideContent.equalSplit
    } : undefined;
    let position = manifestSubSection.position;
    if (!position) {
      position = {
        placement: Placement.After
      };
    }
    const isVisible = manifestSubSection.visible !== undefined ? manifestSubSection.visible : true;
    const isDynamicExpression = isVisible && typeof isVisible === "string" && isVisible.indexOf("{=") === 0;
    const manifestActions = getActionsFromManifest(manifestSubSection.actions, converterContext);
    const subSectionDefinition = {
      type: SubSectionType.Unknown,
      id: manifestSubSection.id || getCustomSubSectionID(subSectionKey),
      actions: manifestActions.actions,
      key: subSectionKey,
      title: manifestSubSection.title,
      level: 1,
      position: position,
      visible: manifestSubSection.visible !== undefined ? manifestSubSection.visible : "true",
      sideContent: sideContent,
      isVisibilityDynamic: isDynamicExpression,
      objectPageLazyLoaderEnabled: manifestSubSection.enableLazyLoading ?? false,
      componentName: "",
      settings: ""
    };
    if (manifestSubSection.template || manifestSubSection.name) {
      subSectionDefinition.type = SubSectionType.XMLFragment;
      subSectionDefinition.template = manifestSubSection.template || manifestSubSection.name || "";
    } else if (manifestSubSection.embeddedComponent !== undefined) {
      subSectionDefinition.type = SubSectionType.EmbeddedComponent;
      subSectionDefinition.componentName = manifestSubSection.embeddedComponent.name;
      if (manifestSubSection.embeddedComponent.settings !== undefined) {
        subSectionDefinition.settings = JSON.stringify(manifestSubSection.embeddedComponent.settings);
      }
    } else {
      subSectionDefinition.type = SubSectionType.Placeholder;
    }
    return subSectionDefinition;
  }

  /**
   * Evaluate if the condensed mode can be applied on the table.
   *
   * @param currentFacet
   * @param facetsToCreateInSection
   * @param converterContext
   * @returns `true` for compliant, false otherwise
   */
  _exports.createCustomSubSection = createCustomSubSection;
  function getCondensedTableLayoutCompliance(currentFacet, facetsToCreateInSection, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    if (manifestWrapper.useIconTabBar()) {
      // If the OP use the tab based we check if the facets that will be created for this section are all non visible
      return hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection);
    } else {
      var _entityType$annotatio, _entityType$annotatio2, _entityType$annotatio3, _entityType$annotatio4, _entityType$annotatio5, _entityType$annotatio6;
      const entityType = converterContext.getEntityType();
      if ((_entityType$annotatio = entityType.annotations) !== null && _entityType$annotatio !== void 0 && (_entityType$annotatio2 = _entityType$annotatio.UI) !== null && _entityType$annotatio2 !== void 0 && (_entityType$annotatio3 = _entityType$annotatio2.Facets) !== null && _entityType$annotatio3 !== void 0 && _entityType$annotatio3.length && ((_entityType$annotatio4 = entityType.annotations) === null || _entityType$annotatio4 === void 0 ? void 0 : (_entityType$annotatio5 = _entityType$annotatio4.UI) === null || _entityType$annotatio5 === void 0 ? void 0 : (_entityType$annotatio6 = _entityType$annotatio5.Facets) === null || _entityType$annotatio6 === void 0 ? void 0 : _entityType$annotatio6.length) > 1) {
        return hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection);
      } else {
        return true;
      }
    }
  }
  function hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection) {
    return facetsToCreateInSection.every(function (subFacet) {
      if (subFacet !== currentFacet) {
        if (subFacet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
          var _refFacet$Target, _refFacet$Target$$tar, _refFacet$Target2, _refFacet$Target2$$ta, _refFacet$Target$$tar2;
          const refFacet = subFacet;
          if (((_refFacet$Target = refFacet.Target) === null || _refFacet$Target === void 0 ? void 0 : (_refFacet$Target$$tar = _refFacet$Target.$target) === null || _refFacet$Target$$tar === void 0 ? void 0 : _refFacet$Target$$tar.term) === "com.sap.vocabularies.UI.v1.LineItem" || ((_refFacet$Target2 = refFacet.Target) === null || _refFacet$Target2 === void 0 ? void 0 : (_refFacet$Target2$$ta = _refFacet$Target2.$target) === null || _refFacet$Target2$$ta === void 0 ? void 0 : _refFacet$Target2$$ta.term) === "com.sap.vocabularies.UI.v1.PresentationVariant" || ((_refFacet$Target$$tar2 = refFacet.Target.$target) === null || _refFacet$Target$$tar2 === void 0 ? void 0 : _refFacet$Target$$tar2.term) === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
            var _refFacet$annotations, _refFacet$annotations2, _refFacet$annotations3, _refFacet$annotations4;
            return ((_refFacet$annotations = refFacet.annotations) === null || _refFacet$annotations === void 0 ? void 0 : (_refFacet$annotations2 = _refFacet$annotations.UI) === null || _refFacet$annotations2 === void 0 ? void 0 : _refFacet$annotations2.Hidden) !== undefined ? (_refFacet$annotations3 = refFacet.annotations) === null || _refFacet$annotations3 === void 0 ? void 0 : (_refFacet$annotations4 = _refFacet$annotations3.UI) === null || _refFacet$annotations4 === void 0 ? void 0 : _refFacet$annotations4.Hidden : false;
          }
          return true;
        } else {
          const subCollectionFacet = subFacet;
          return subCollectionFacet.Facets.every(function (facet) {
            var _subRefFacet$Target, _subRefFacet$Target$$, _subRefFacet$Target2, _subRefFacet$Target2$, _subRefFacet$Target3, _subRefFacet$Target3$;
            const subRefFacet = facet;
            if (((_subRefFacet$Target = subRefFacet.Target) === null || _subRefFacet$Target === void 0 ? void 0 : (_subRefFacet$Target$$ = _subRefFacet$Target.$target) === null || _subRefFacet$Target$$ === void 0 ? void 0 : _subRefFacet$Target$$.term) === "com.sap.vocabularies.UI.v1.LineItem" || ((_subRefFacet$Target2 = subRefFacet.Target) === null || _subRefFacet$Target2 === void 0 ? void 0 : (_subRefFacet$Target2$ = _subRefFacet$Target2.$target) === null || _subRefFacet$Target2$ === void 0 ? void 0 : _subRefFacet$Target2$.term) === "com.sap.vocabularies.UI.v1.PresentationVariant" || ((_subRefFacet$Target3 = subRefFacet.Target) === null || _subRefFacet$Target3 === void 0 ? void 0 : (_subRefFacet$Target3$ = _subRefFacet$Target3.$target) === null || _subRefFacet$Target3$ === void 0 ? void 0 : _subRefFacet$Target3$.term) === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
              var _subRefFacet$annotati, _subRefFacet$annotati2, _subRefFacet$annotati3, _subRefFacet$annotati4;
              return ((_subRefFacet$annotati = subRefFacet.annotations) === null || _subRefFacet$annotati === void 0 ? void 0 : (_subRefFacet$annotati2 = _subRefFacet$annotati.UI) === null || _subRefFacet$annotati2 === void 0 ? void 0 : _subRefFacet$annotati2.Hidden) !== undefined ? (_subRefFacet$annotati3 = subRefFacet.annotations) === null || _subRefFacet$annotati3 === void 0 ? void 0 : (_subRefFacet$annotati4 = _subRefFacet$annotati3.UI) === null || _subRefFacet$annotati4 === void 0 ? void 0 : _subRefFacet$annotati4.Hidden : false;
            }
            return true;
          });
        }
      }
      return true;
    });
  }
  return _exports;
}, false);
