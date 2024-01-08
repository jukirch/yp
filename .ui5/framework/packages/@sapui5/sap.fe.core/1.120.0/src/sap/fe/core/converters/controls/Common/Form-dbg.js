/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "../../../helpers/StableIdHelper", "../../ManifestSettings", "../../helpers/ConfigurableObject", "../../helpers/DataFieldHelper", "../../helpers/ID", "../../helpers/Key"], function (DataField, BindingToolkit, TypeGuards, DataModelPathHelper, StableIdHelper, ManifestSettings, ConfigurableObject, DataFieldHelper, ID, Key) {
  "use strict";

  var _exports = {};
  var KeyHelper = Key.KeyHelper;
  var getFormStandardActionButtonID = ID.getFormStandardActionButtonID;
  var getFormID = ID.getFormID;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var ActionType = ManifestSettings.ActionType;
  var createIdForAnnotation = StableIdHelper.createIdForAnnotation;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetEntitySetPath = DataModelPathHelper.getTargetEntitySetPath;
  var isSingleton = TypeGuards.isSingleton;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  let FormElementType;
  (function (FormElementType) {
    FormElementType["Default"] = "Default";
    FormElementType["Slot"] = "Slot";
    FormElementType["Annotation"] = "Annotation";
  })(FormElementType || (FormElementType = {}));
  _exports.FormElementType = FormElementType;
  /**
   * Returns default format options for text fields on a form.
   *
   * @returns Collection of format options with default values
   */
  function getDefaultFormatOptionsForForm() {
    return {
      textLinesEdit: 4
    };
  }
  function isFieldPartOfPreview(field, formPartOfPreview) {
    var _field$annotations, _field$annotations$UI, _field$annotations2, _field$annotations2$U;
    // Both each form and field can have the PartOfPreview annotation. Only if the form is not hidden (not partOfPreview) we allow toggling on field level
    return (formPartOfPreview === null || formPartOfPreview === void 0 ? void 0 : formPartOfPreview.valueOf()) === false || ((_field$annotations = field.annotations) === null || _field$annotations === void 0 ? void 0 : (_field$annotations$UI = _field$annotations.UI) === null || _field$annotations$UI === void 0 ? void 0 : _field$annotations$UI.PartOfPreview) === undefined || ((_field$annotations2 = field.annotations) === null || _field$annotations2 === void 0 ? void 0 : (_field$annotations2$U = _field$annotations2.UI) === null || _field$annotations2$U === void 0 ? void 0 : _field$annotations2$U.PartOfPreview.valueOf()) === true;
  }
  function getFormElementsFromAnnotations(facetDefinition, converterContext) {
    const formElements = [];
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const formAnnotation = resolvedTarget.annotation;
    converterContext = resolvedTarget.converterContext;
    function getDataFieldsFromAnnotations(field, formPartOfPreview) {
      const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, field);
      if (field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForAction" && field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && !isReferencePropertyStaticallyHidden(field)) {
        var _field$Target$$target;
        const formElement = {
          key: KeyHelper.generateKeyFromDataField(field),
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(field.fullyQualifiedName)}/`,
          semanticObjectPath: semanticObjectAnnotationPath,
          formatOptions: getDefaultFormatOptionsForForm(),
          isPartOfPreview: isFieldPartOfPreview(field, formPartOfPreview)
        };
        if (field.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && ((_field$Target$$target = field.Target.$target) === null || _field$Target$$target === void 0 ? void 0 : _field$Target$$target.$Type) === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
          const connectedFields = Object.values(field.Target.$target.Data).filter(connectedField => connectedField === null || connectedField === void 0 ? void 0 : connectedField.hasOwnProperty("Value"));
          formElement.connectedFields = connectedFields.map(connnectedFieldElement => {
            return {
              semanticObjectPath: getSemanticObjectPath(converterContext, connnectedFieldElement)
            };
          });
        }
        formElements.push(formElement);
      }
    }
    switch (formAnnotation === null || formAnnotation === void 0 ? void 0 : formAnnotation.term) {
      case "com.sap.vocabularies.UI.v1.FieldGroup":
        formAnnotation.Data.forEach(field => {
          var _facetDefinition$anno, _facetDefinition$anno2;
          return getDataFieldsFromAnnotations(field, (_facetDefinition$anno = facetDefinition.annotations) === null || _facetDefinition$anno === void 0 ? void 0 : (_facetDefinition$anno2 = _facetDefinition$anno.UI) === null || _facetDefinition$anno2 === void 0 ? void 0 : _facetDefinition$anno2.PartOfPreview);
        });
        break;
      case "com.sap.vocabularies.UI.v1.Identification":
        formAnnotation.forEach(field => {
          var _facetDefinition$anno3, _facetDefinition$anno4;
          return getDataFieldsFromAnnotations(field, (_facetDefinition$anno3 = facetDefinition.annotations) === null || _facetDefinition$anno3 === void 0 ? void 0 : (_facetDefinition$anno4 = _facetDefinition$anno3.UI) === null || _facetDefinition$anno4 === void 0 ? void 0 : _facetDefinition$anno4.PartOfPreview);
        });
        break;
      case "com.sap.vocabularies.UI.v1.DataPoint":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `DataPoint::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.Communication.v1.Contact":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `Contact::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      default:
        break;
    }
    return formElements;
  }
  function getFormElementsFromManifest(facetDefinition, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const manifestFormContainer = manifestWrapper.getFormContainer(facetDefinition.Target.value);
    const formElements = {};
    if (manifestFormContainer !== null && manifestFormContainer !== void 0 && manifestFormContainer.fields) {
      Object.keys(manifestFormContainer === null || manifestFormContainer === void 0 ? void 0 : manifestFormContainer.fields).forEach(fieldId => {
        formElements[fieldId] = {
          key: fieldId,
          id: `CustomFormElement::${fieldId}`,
          type: manifestFormContainer.fields[fieldId].type || FormElementType.Default,
          template: manifestFormContainer.fields[fieldId].template,
          label: manifestFormContainer.fields[fieldId].label,
          position: manifestFormContainer.fields[fieldId].position || {
            placement: Placement.After
          },
          formatOptions: {
            ...getDefaultFormatOptionsForForm(),
            ...manifestFormContainer.fields[fieldId].formatOptions
          }
        };
      });
    }
    return formElements;
  }
  _exports.getFormElementsFromManifest = getFormElementsFromManifest;
  function getFormContainer(facetDefinition, converterContext, actions) {
    var _facetDefinition$anno5, _facetDefinition$anno6, _resolvedTarget$conve, _facetDefinition$anno7, _facetDefinition$anno8, _facetDefinition$anno9;
    const sFormContainerId = createIdForAnnotation(facetDefinition);
    const sAnnotationPath = converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName);
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const isVisible = compileExpression(not(equal(true, getExpressionFromAnnotation((_facetDefinition$anno5 = facetDefinition.annotations) === null || _facetDefinition$anno5 === void 0 ? void 0 : (_facetDefinition$anno6 = _facetDefinition$anno5.UI) === null || _facetDefinition$anno6 === void 0 ? void 0 : _facetDefinition$anno6.Hidden))));
    let sEntitySetPath;
    // resolvedTarget doesn't have a entitySet in case Containments and Paramterized services.
    const entitySet = resolvedTarget.converterContext.getEntitySet();
    if (entitySet && entitySet !== converterContext.getEntitySet()) {
      sEntitySetPath = getTargetEntitySetPath(resolvedTarget.converterContext.getDataModelObjectPath());
    } else if (((_resolvedTarget$conve = resolvedTarget.converterContext.getDataModelObjectPath().targetObject) === null || _resolvedTarget$conve === void 0 ? void 0 : _resolvedTarget$conve.containsTarget) === true) {
      sEntitySetPath = getTargetObjectPath(resolvedTarget.converterContext.getDataModelObjectPath(), false);
    } else if (entitySet && !sEntitySetPath && isSingleton(entitySet)) {
      sEntitySetPath = entitySet.fullyQualifiedName;
    }
    const aFormElements = insertCustomElements(getFormElementsFromAnnotations(facetDefinition, converterContext), getFormElementsFromManifest(facetDefinition, converterContext), {
      formatOptions: OverrideType.overwrite
    });
    actions = actions !== undefined ? actions.filter(action => action.facetName == facetDefinition.fullyQualifiedName) : [];
    if (actions.length === 0) {
      actions = undefined;
    }
    const oActionShowDetails = {
      id: getFormStandardActionButtonID(sFormContainerId, "ShowHideDetails"),
      key: "StandardAction::ShowHideDetails",
      text: compileExpression(ifElse(equal(pathInModel("showDetails", "internal"), true), pathInModel("T_COMMON_OBJECT_PAGE_HIDE_FORM_CONTAINER_DETAILS", "sap.fe.i18n"), pathInModel("T_COMMON_OBJECT_PAGE_SHOW_FORM_CONTAINER_DETAILS", "sap.fe.i18n"))),
      type: ActionType.ShowFormDetails,
      press: "FormContainerRuntime.toggleDetails"
    };
    if (((_facetDefinition$anno7 = facetDefinition.annotations) === null || _facetDefinition$anno7 === void 0 ? void 0 : (_facetDefinition$anno8 = _facetDefinition$anno7.UI) === null || _facetDefinition$anno8 === void 0 ? void 0 : (_facetDefinition$anno9 = _facetDefinition$anno8.PartOfPreview) === null || _facetDefinition$anno9 === void 0 ? void 0 : _facetDefinition$anno9.valueOf()) !== false && aFormElements.some(oFormElement => oFormElement.isPartOfPreview === false)) {
      if (actions !== undefined) {
        actions.push(oActionShowDetails);
      } else {
        actions = [oActionShowDetails];
      }
    }
    return {
      id: sFormContainerId,
      formElements: aFormElements,
      annotationPath: sAnnotationPath,
      isVisible: isVisible,
      entitySet: sEntitySetPath,
      actions: actions
    };
  }
  _exports.getFormContainer = getFormContainer;
  function getFormContainersForCollection(facetDefinition, converterContext, actions) {
    var _facetDefinition$Face;
    const formContainers = [];
    (_facetDefinition$Face = facetDefinition.Facets) === null || _facetDefinition$Face === void 0 ? void 0 : _facetDefinition$Face.forEach(facet => {
      // Ignore level 3 collection facet
      if (facet.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
        return;
      }
      formContainers.push(getFormContainer(facet, converterContext, actions));
    });
    return formContainers;
  }
  function isReferenceFacet(facetDefinition) {
    return facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet";
  }
  _exports.isReferenceFacet = isReferenceFacet;
  function createFormDefinition(facetDefinition, isVisible, converterContext, actions) {
    var _facetDefinition$anno10, _facetDefinition$anno11, _facetDefinition$anno12;
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        // Keep only valid children
        return {
          id: getFormID(facetDefinition),
          useFormContainerLabels: true,
          hasFacetsNotPartOfPreview: facetDefinition.Facets.some(childFacet => {
            var _childFacet$annotatio, _childFacet$annotatio2, _childFacet$annotatio3;
            return ((_childFacet$annotatio = childFacet.annotations) === null || _childFacet$annotatio === void 0 ? void 0 : (_childFacet$annotatio2 = _childFacet$annotatio.UI) === null || _childFacet$annotatio2 === void 0 ? void 0 : (_childFacet$annotatio3 = _childFacet$annotatio2.PartOfPreview) === null || _childFacet$annotatio3 === void 0 ? void 0 : _childFacet$annotatio3.valueOf()) === false;
          }),
          formContainers: getFormContainersForCollection(facetDefinition, converterContext, actions),
          isVisible: isVisible
        };
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        return {
          id: getFormID(facetDefinition),
          useFormContainerLabels: false,
          hasFacetsNotPartOfPreview: ((_facetDefinition$anno10 = facetDefinition.annotations) === null || _facetDefinition$anno10 === void 0 ? void 0 : (_facetDefinition$anno11 = _facetDefinition$anno10.UI) === null || _facetDefinition$anno11 === void 0 ? void 0 : (_facetDefinition$anno12 = _facetDefinition$anno11.PartOfPreview) === null || _facetDefinition$anno12 === void 0 ? void 0 : _facetDefinition$anno12.valueOf()) === false,
          formContainers: [getFormContainer(facetDefinition, converterContext, actions)],
          isVisible: isVisible
        };
      default:
        throw new Error("Cannot create form based on ReferenceURLFacet");
    }
  }
  _exports.createFormDefinition = createFormDefinition;
  return _exports;
}, false);
