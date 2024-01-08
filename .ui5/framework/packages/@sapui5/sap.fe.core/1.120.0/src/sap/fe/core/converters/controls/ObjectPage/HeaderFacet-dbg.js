/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/ID", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "../../../helpers/StableIdHelper", "../../helpers/DataFieldHelper", "../Common/Form"], function (DataField, ConfigurableObject, ID, Key, BindingToolkit, PropertyHelper, UIFormatters, StableIdHelper, DataFieldHelper, Form) {
  "use strict";

  var _exports = {};
  var getFormElementsFromManifest = Form.getFormElementsFromManifest;
  var FormElementType = Form.FormElementType;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var isAnnotationFieldStaticallyHidden = DataFieldHelper.isAnnotationFieldStaticallyHidden;
  var createIdForAnnotation = StableIdHelper.createIdForAnnotation;
  var isVisible = UIFormatters.isVisible;
  var isMultiLineText = PropertyHelper.isMultiLineText;
  var compileExpression = BindingToolkit.compileExpression;
  var KeyHelper = Key.KeyHelper;
  var getHeaderFacetID = ID.getHeaderFacetID;
  var getHeaderFacetFormID = ID.getHeaderFacetFormID;
  var getHeaderFacetContainerID = ID.getHeaderFacetContainerID;
  var getCustomHeaderFacetID = ID.getCustomHeaderFacetID;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  // region definitions
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Definitions: Header Facet Types, Generic OP Header Facet, Manifest Properties for Custom Header Facet
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  let HeaderFacetType;
  (function (HeaderFacetType) {
    HeaderFacetType["Annotation"] = "Annotation";
    HeaderFacetType["XMLFragment"] = "XMLFragment";
  })(HeaderFacetType || (HeaderFacetType = {}));
  _exports.HeaderFacetType = HeaderFacetType;
  let FacetType;
  (function (FacetType) {
    FacetType["Reference"] = "Reference";
    FacetType["Collection"] = "Collection";
  })(FacetType || (FacetType = {}));
  _exports.FacetType = FacetType;
  let FlexDesignTimeType;
  (function (FlexDesignTimeType) {
    FlexDesignTimeType["Default"] = "Default";
    FlexDesignTimeType["NotAdaptable"] = "not-adaptable";
    FlexDesignTimeType["NotAdaptableTree"] = "not-adaptable-tree";
    FlexDesignTimeType["NotAdaptableVisibility"] = "not-adaptable-visibility";
  })(FlexDesignTimeType || (FlexDesignTimeType = {}));
  _exports.FlexDesignTimeType = FlexDesignTimeType;
  var HeaderDataPointType;
  (function (HeaderDataPointType) {
    HeaderDataPointType["ProgressIndicator"] = "ProgressIndicator";
    HeaderDataPointType["RatingIndicator"] = "RatingIndicator";
    HeaderDataPointType["Content"] = "Content";
  })(HeaderDataPointType || (HeaderDataPointType = {}));
  var TargetAnnotationType;
  (function (TargetAnnotationType) {
    TargetAnnotationType["None"] = "None";
    TargetAnnotationType["DataPoint"] = "DataPoint";
    TargetAnnotationType["Chart"] = "Chart";
    TargetAnnotationType["Identification"] = "Identification";
    TargetAnnotationType["Contact"] = "Contact";
    TargetAnnotationType["Address"] = "Address";
    TargetAnnotationType["FieldGroup"] = "FieldGroup";
  })(TargetAnnotationType || (TargetAnnotationType = {}));
  // endregion definitions

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Collect All Header Facets: Custom (via Manifest) and Annotation Based (via Metamodel)
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Retrieve header facets from annotations.
   *
   * @param converterContext
   * @returns Header facets from annotations
   */
  function getHeaderFacetsFromAnnotations(converterContext) {
    var _converterContext$get, _converterContext$get2, _converterContext$get3;
    const headerFacets = [];
    (_converterContext$get = converterContext.getEntityType().annotations) === null || _converterContext$get === void 0 ? void 0 : (_converterContext$get2 = _converterContext$get.UI) === null || _converterContext$get2 === void 0 ? void 0 : (_converterContext$get3 = _converterContext$get2.HeaderFacets) === null || _converterContext$get3 === void 0 ? void 0 : _converterContext$get3.forEach(facet => {
      const headerFacet = createHeaderFacet(facet, converterContext);
      if (headerFacet) {
        headerFacets.push(headerFacet);
      }
    });
    return headerFacets;
  }

  /**
   * Retrieve custom header facets from manifest.
   *
   * @param manifestCustomHeaderFacets
   * @returns HeaderFacets from manifest
   */
  _exports.getHeaderFacetsFromAnnotations = getHeaderFacetsFromAnnotations;
  function getHeaderFacetsFromManifest(manifestCustomHeaderFacets) {
    const customHeaderFacets = {};
    Object.keys(manifestCustomHeaderFacets).forEach(manifestHeaderFacetKey => {
      const customHeaderFacet = manifestCustomHeaderFacets[manifestHeaderFacetKey];
      customHeaderFacets[manifestHeaderFacetKey] = createCustomHeaderFacet(customHeaderFacet, manifestHeaderFacetKey);
    });
    return customHeaderFacets;
  }

  /**
   * Retrieve stashed settings for header facets from manifest.
   *
   * @param facetDefinition
   * @param collectionFacetDefinition
   * @param converterContext
   * @returns Stashed setting for header facet or false
   */
  _exports.getHeaderFacetsFromManifest = getHeaderFacetsFromManifest;
  function getStashedSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    var _headerFacetsControlC;
    // When a HeaderFacet is nested inside a CollectionFacet, stashing is not supported
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      return false;
    }
    const headerFacetID = createIdForAnnotation(facetDefinition) ?? "";
    const headerFacetsControlConfig = converterContext.getManifestWrapper().getHeaderFacets();
    const stashedSetting = (_headerFacetsControlC = headerFacetsControlConfig[headerFacetID]) === null || _headerFacetsControlC === void 0 ? void 0 : _headerFacetsControlC.stashed;
    return stashedSetting === true;
  }

  /**
   * Retrieve flexibility designtime settings from manifest.
   *
   * @param facetDefinition
   * @param collectionFacetDefinition
   * @param converterContext
   * @returns Designtime setting or default
   */
  _exports.getStashedSettingsForHeaderFacet = getStashedSettingsForHeaderFacet;
  function getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    let designTimeMetadata = FlexDesignTimeType.Default;
    const headerFacetID = createIdForAnnotation(facetDefinition);

    // For HeaderFacets nested inside CollectionFacet RTA should be disabled, therefore set to "not-adaptable-tree"
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      designTimeMetadata = FlexDesignTimeType.NotAdaptableTree;
    } else {
      const headerFacetsControlConfig = converterContext.getManifestWrapper().getHeaderFacets();
      if (headerFacetID) {
        var _headerFacetsControlC2, _headerFacetsControlC3;
        const designTime = (_headerFacetsControlC2 = headerFacetsControlConfig[headerFacetID]) === null || _headerFacetsControlC2 === void 0 ? void 0 : (_headerFacetsControlC3 = _headerFacetsControlC2.flexSettings) === null || _headerFacetsControlC3 === void 0 ? void 0 : _headerFacetsControlC3.designtime;
        switch (designTime) {
          case FlexDesignTimeType.NotAdaptable:
          case FlexDesignTimeType.NotAdaptableTree:
          case FlexDesignTimeType.NotAdaptableVisibility:
            designTimeMetadata = designTime;
            break;
          default:
            break;
        }
      }
    }
    return designTimeMetadata;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Convert & Build Annotation Based Header Facets
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _exports.getDesignTimeMetadataSettingsForHeaderFacet = getDesignTimeMetadataSettingsForHeaderFacet;
  function createReferenceHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    var _facetDefinition$anno, _facetDefinition$anno2, _facetDefinition$anno3;
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && !(((_facetDefinition$anno = facetDefinition.annotations) === null || _facetDefinition$anno === void 0 ? void 0 : (_facetDefinition$anno2 = _facetDefinition$anno.UI) === null || _facetDefinition$anno2 === void 0 ? void 0 : (_facetDefinition$anno3 = _facetDefinition$anno2.Hidden) === null || _facetDefinition$anno3 === void 0 ? void 0 : _facetDefinition$anno3.valueOf()) === true)) {
      var _facetDefinition$Targ, _facetDefinition$Targ2;
      const headerFacetID = getHeaderFacetID(facetDefinition),
        getHeaderFacetKey = (facetDefinitionToCheck, fallback) => {
          var _facetDefinitionToChe, _facetDefinitionToChe2;
          return ((_facetDefinitionToChe = facetDefinitionToCheck.ID) === null || _facetDefinitionToChe === void 0 ? void 0 : _facetDefinitionToChe.toString()) || ((_facetDefinitionToChe2 = facetDefinitionToCheck.Label) === null || _facetDefinitionToChe2 === void 0 ? void 0 : _facetDefinitionToChe2.toString()) || fallback;
        },
        targetAnnotationValue = facetDefinition.Target.value,
        targetAnnotationType = getTargetAnnotationType(facetDefinition);
      let headerFormData;
      let headerDataPointData;
      switch (targetAnnotationType) {
        case TargetAnnotationType.FieldGroup:
          headerFormData = getFieldGroupFormData(facetDefinition, converterContext);
          break;
        case TargetAnnotationType.DataPoint:
          headerDataPointData = getDataPointData(facetDefinition, converterContext);
          break;
        // ToDo: Handle other cases
        default:
          break;
      }
      if (((_facetDefinition$Targ = facetDefinition.Target) === null || _facetDefinition$Targ === void 0 ? void 0 : (_facetDefinition$Targ2 = _facetDefinition$Targ.$target) === null || _facetDefinition$Targ2 === void 0 ? void 0 : _facetDefinition$Targ2.term) === "com.sap.vocabularies.UI.v1.Chart" && isAnnotationFieldStaticallyHidden(facetDefinition)) {
        return undefined;
      } else {
        return {
          type: HeaderFacetType.Annotation,
          facetType: FacetType.Reference,
          id: headerFacetID,
          containerId: getHeaderFacetContainerID(facetDefinition),
          key: getHeaderFacetKey(facetDefinition, headerFacetID),
          flexSettings: {
            designtime: getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext)
          },
          stashed: getStashedSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext),
          visible: compileExpression(isVisible(facetDefinition)),
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName)}/`,
          targetAnnotationValue,
          targetAnnotationType,
          headerFormData,
          headerDataPointData
        };
      }
    }
    return undefined;
  }
  function createCollectionHeaderFacet(collectionFacetDefinition, converterContext) {
    if (collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      const facets = [],
        headerFacetID = getHeaderFacetID(collectionFacetDefinition),
        getHeaderFacetKey = (facetDefinition, fallback) => {
          var _facetDefinition$ID, _facetDefinition$Labe;
          return ((_facetDefinition$ID = facetDefinition.ID) === null || _facetDefinition$ID === void 0 ? void 0 : _facetDefinition$ID.toString()) || ((_facetDefinition$Labe = facetDefinition.Label) === null || _facetDefinition$Labe === void 0 ? void 0 : _facetDefinition$Labe.toString()) || fallback;
        };
      collectionFacetDefinition.Facets.forEach(facetDefinition => {
        const facet = createReferenceHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext);
        if (facet) {
          facets.push(facet);
        }
      });
      return {
        type: HeaderFacetType.Annotation,
        facetType: FacetType.Collection,
        id: headerFacetID,
        containerId: getHeaderFacetContainerID(collectionFacetDefinition),
        key: getHeaderFacetKey(collectionFacetDefinition, headerFacetID),
        flexSettings: {
          designtime: getDesignTimeMetadataSettingsForHeaderFacet(collectionFacetDefinition, collectionFacetDefinition, converterContext)
        },
        stashed: getStashedSettingsForHeaderFacet(collectionFacetDefinition, collectionFacetDefinition, converterContext),
        visible: compileExpression(isVisible(collectionFacetDefinition)),
        annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(collectionFacetDefinition.fullyQualifiedName)}/`,
        facets
      };
    }
    return undefined;
  }
  function getTargetAnnotationType(facetDefinition) {
    let annotationType = TargetAnnotationType.None;
    const annotationTypeMap = {
      "com.sap.vocabularies.UI.v1.DataPoint": TargetAnnotationType.DataPoint,
      "com.sap.vocabularies.UI.v1.Chart": TargetAnnotationType.Chart,
      "com.sap.vocabularies.UI.v1.Identification": TargetAnnotationType.Identification,
      "com.sap.vocabularies.Communication.v1.Contact": TargetAnnotationType.Contact,
      "com.sap.vocabularies.Communication.v1.Address": TargetAnnotationType.Address,
      "com.sap.vocabularies.UI.v1.FieldGroup": TargetAnnotationType.FieldGroup
    };
    // ReferenceURLFacet and CollectionFacet do not have Target property.
    if (facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.ReferenceURLFacet" && facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.CollectionFacet" && facetDefinition.Target.$target) {
      annotationType = annotationTypeMap[facetDefinition.Target.$target.term] ?? TargetAnnotationType.None;
    }
    return annotationType;
  }
  function getFieldGroupFormData(facetDefinition, converterContext) {
    var _facetDefinition$Labe2;
    // split in this from annotation + getFieldGroupFromDefault
    if (!facetDefinition) {
      throw new Error("Cannot get FieldGroup form data without facet definition");
    }
    const formElements = insertCustomElements(getFormElementsFromAnnotations(facetDefinition, converterContext), getFormElementsFromManifest(facetDefinition, converterContext));
    return {
      id: getHeaderFacetFormID(facetDefinition),
      label: (_facetDefinition$Labe2 = facetDefinition.Label) === null || _facetDefinition$Labe2 === void 0 ? void 0 : _facetDefinition$Labe2.toString(),
      formElements
    };
  }

  /**
   * Creates an array of manifest-based FormElements.
   *
   * @param facetDefinition The definition of the facet
   * @param converterContext The converter context for the facet
   * @returns Annotation-based FormElements
   */
  function getFormElementsFromAnnotations(facetDefinition, converterContext) {
    const annotationBasedFormElements = [];

    // ReferenceURLFacet and CollectionFacet do not have Target property.
    if (facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.ReferenceURLFacet" && facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.CollectionFacet") {
      var _facetDefinition$Targ3, _facetDefinition$Targ4;
      (_facetDefinition$Targ3 = facetDefinition.Target) === null || _facetDefinition$Targ3 === void 0 ? void 0 : (_facetDefinition$Targ4 = _facetDefinition$Targ3.$target) === null || _facetDefinition$Targ4 === void 0 ? void 0 : _facetDefinition$Targ4.Data.forEach(dataField => {
        var _dataField$annotation, _dataField$annotation2, _dataField$annotation3;
        if (!(((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : (_dataField$annotation3 = _dataField$annotation2.Hidden) === null || _dataField$annotation3 === void 0 ? void 0 : _dataField$annotation3.valueOf()) === true)) {
          const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, dataField);
          if ((dataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction") && !isReferencePropertyStaticallyHidden(dataField)) {
            var _dataField$Value, _dataField$Value2, _dataField$Value2$$ta, _dataField$Value2$$ta2, _dataField$Value2$$ta3;
            annotationBasedFormElements.push({
              isValueMultilineText: isMultiLineText((_dataField$Value = dataField.Value) === null || _dataField$Value === void 0 ? void 0 : _dataField$Value.$target),
              type: FormElementType.Annotation,
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(isVisible(dataField)),
              label: ((_dataField$Value2 = dataField.Value) === null || _dataField$Value2 === void 0 ? void 0 : (_dataField$Value2$$ta = _dataField$Value2.$target) === null || _dataField$Value2$$ta === void 0 ? void 0 : (_dataField$Value2$$ta2 = _dataField$Value2$$ta.annotations) === null || _dataField$Value2$$ta2 === void 0 ? void 0 : (_dataField$Value2$$ta3 = _dataField$Value2$$ta2.Common) === null || _dataField$Value2$$ta3 === void 0 ? void 0 : _dataField$Value2$$ta3.Label) || dataField.Label,
              idPrefix: getHeaderFacetFormID(facetDefinition, dataField),
              annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName)}/`,
              semanticObjectPath: semanticObjectAnnotationPath
            });
          } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && !isReferencePropertyStaticallyHidden(dataField)) {
            var _dataField$Target, _dataField$Target$$ta, _dataField$Target$$ta2, _dataField$Target$$ta3, _dataField$Target$$ta4, _dataField$Label;
            annotationBasedFormElements.push({
              isValueMultilineText: false,
              // was dataField.Target?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true but that doesn't make sense as the target cannot have that annotation
              type: FormElementType.Annotation,
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(isVisible(dataField)),
              label: ((_dataField$Target = dataField.Target) === null || _dataField$Target === void 0 ? void 0 : (_dataField$Target$$ta = _dataField$Target.$target) === null || _dataField$Target$$ta === void 0 ? void 0 : (_dataField$Target$$ta2 = _dataField$Target$$ta.annotations) === null || _dataField$Target$$ta2 === void 0 ? void 0 : (_dataField$Target$$ta3 = _dataField$Target$$ta2.Common) === null || _dataField$Target$$ta3 === void 0 ? void 0 : (_dataField$Target$$ta4 = _dataField$Target$$ta3.Label) === null || _dataField$Target$$ta4 === void 0 ? void 0 : _dataField$Target$$ta4.toString()) || ((_dataField$Label = dataField.Label) === null || _dataField$Label === void 0 ? void 0 : _dataField$Label.toString()),
              idPrefix: getHeaderFacetFormID(facetDefinition, dataField),
              annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName)}/`,
              semanticObjectPath: semanticObjectAnnotationPath
            });
          }
        }
      });
    }
    return annotationBasedFormElements;
  }
  function getDataPointData(facetDefinition, converterContext) {
    let type = HeaderDataPointType.Content;
    let semanticObjectPath;
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && !isAnnotationFieldStaticallyHidden(facetDefinition)) {
      var _facetDefinition$Targ5, _facetDefinition$Targ6, _facetDefinition$Targ7, _facetDefinition$Targ8, _facetDefinition$Targ9;
      if (((_facetDefinition$Targ5 = facetDefinition.Target) === null || _facetDefinition$Targ5 === void 0 ? void 0 : (_facetDefinition$Targ6 = _facetDefinition$Targ5.$target) === null || _facetDefinition$Targ6 === void 0 ? void 0 : _facetDefinition$Targ6.Visualization) === "UI.VisualizationType/Progress") {
        type = HeaderDataPointType.ProgressIndicator;
      } else if (((_facetDefinition$Targ7 = facetDefinition.Target) === null || _facetDefinition$Targ7 === void 0 ? void 0 : (_facetDefinition$Targ8 = _facetDefinition$Targ7.$target) === null || _facetDefinition$Targ8 === void 0 ? void 0 : _facetDefinition$Targ8.Visualization) === "UI.VisualizationType/Rating") {
        type = HeaderDataPointType.RatingIndicator;
      }
      const dataPoint = (_facetDefinition$Targ9 = facetDefinition.Target) === null || _facetDefinition$Targ9 === void 0 ? void 0 : _facetDefinition$Targ9.$target;
      if (typeof dataPoint === "object") {
        var _dataPoint$Value;
        if (dataPoint !== null && dataPoint !== void 0 && (_dataPoint$Value = dataPoint.Value) !== null && _dataPoint$Value !== void 0 && _dataPoint$Value.$target) {
          var _property$annotations, _property$annotations2;
          const property = dataPoint.Value.$target;
          if ((property === null || property === void 0 ? void 0 : (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.Common) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.SemanticObject) !== undefined) {
            semanticObjectPath = converterContext.getEntitySetBasedAnnotationPath(property === null || property === void 0 ? void 0 : property.fullyQualifiedName);
          }
        }
      }
    }
    return {
      type,
      semanticObjectPath
    };
  }

  /**
   * Creates an annotation-based header facet.
   *
   * @param facetDefinition The definition of the facet
   * @param converterContext The converter context
   * @returns The created annotation-based header facet
   */
  function createHeaderFacet(facetDefinition, converterContext) {
    let headerFacet;
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        headerFacet = createReferenceHeaderFacet(facetDefinition, facetDefinition, converterContext);
        break;
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        headerFacet = createCollectionHeaderFacet(facetDefinition, converterContext);
        break;
      default:
        break;
    }
    return headerFacet;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Convert & Build Manifest Based Header Facets
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function generateBinding(requestGroupId) {
    if (!requestGroupId) {
      return undefined;
    }
    const groupId = ["Heroes", "Decoration", "Workers", "LongRunners"].includes(requestGroupId) ? `$auto.${requestGroupId}` : requestGroupId;
    return `{ path : '', parameters : { $$groupId : '${groupId}' } }`;
  }

  /**
   * Create a manifest based custom header facet.
   *
   * @param customHeaderFacetDefinition
   * @param headerFacetKey
   * @returns The manifest based custom header facet created
   */
  function createCustomHeaderFacet(customHeaderFacetDefinition, headerFacetKey) {
    const customHeaderFacetID = getCustomHeaderFacetID(headerFacetKey);
    let position = customHeaderFacetDefinition.position;
    if (!position) {
      position = {
        placement: Placement.After
      };
    }
    // TODO for an non annotation fragment the name is mandatory -> Not checked
    return {
      facetType: FacetType.Reference,
      type: customHeaderFacetDefinition.type,
      id: customHeaderFacetID,
      containerId: customHeaderFacetID,
      key: headerFacetKey,
      position: position,
      visible: customHeaderFacetDefinition.visible,
      fragmentName: customHeaderFacetDefinition.template || customHeaderFacetDefinition.name,
      title: customHeaderFacetDefinition.title,
      subTitle: customHeaderFacetDefinition.subTitle,
      stashed: customHeaderFacetDefinition.stashed || false,
      flexSettings: {
        ...{
          designtime: FlexDesignTimeType.Default
        },
        ...customHeaderFacetDefinition.flexSettings
      },
      binding: generateBinding(customHeaderFacetDefinition.requestGroupId),
      templateEdit: customHeaderFacetDefinition.templateEdit
    };
  }
  return _exports;
}, false);
