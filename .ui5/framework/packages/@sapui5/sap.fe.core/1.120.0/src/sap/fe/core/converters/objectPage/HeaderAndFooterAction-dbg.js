/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/ui/core/Core", "../../helpers/BindingHelper", "../ManifestSettings"], function (Action, ConfigurableObject, Key, BindingToolkit, ModelHelper, TypeGuards, DataModelPathHelper, UIFormatters, Core, BindingHelper, ManifestSettings) {
  "use strict";

  var _exports = {};
  var ActionType = ManifestSettings.ActionType;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
  var isVisible = UIFormatters.isVisible;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var isEntitySet = TypeGuards.isEntitySet;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var KeyHelper = Key.KeyHelper;
  var Placement = ConfigurableObject.Placement;
  var getSemanticObjectMapping = Action.getSemanticObjectMapping;
  var getEnabledForAnnotationAction = Action.getEnabledForAnnotationAction;
  var getCopyAction = Action.getCopyAction;
  var dataFieldIsCopyAction = Action.dataFieldIsCopyAction;
  var ButtonType = Action.ButtonType;
  /**
   * Retrieves all the data field for actions for the identification annotation
   * They must be
   * - Not statically hidden
   * - Either linked to an Unbound action or to an action which has an OperationAvailable that is not set to false statically.
   *
   * @param entityType The current entity type
   * @param isDeterminingAction The flag which denotes whether or not the action is a determining action
   * @returns An array of DataField for action respecting the input parameter 'isDeterminingAction'
   */
  function getIdentificationDataFieldForActions(entityType, isDeterminingAction) {
    var _entityType$annotatio, _entityType$annotatio2, _entityType$annotatio3;
    return ((_entityType$annotatio = entityType.annotations) === null || _entityType$annotatio === void 0 ? void 0 : (_entityType$annotatio2 = _entityType$annotatio.UI) === null || _entityType$annotatio2 === void 0 ? void 0 : (_entityType$annotatio3 = _entityType$annotatio2.Identification) === null || _entityType$annotatio3 === void 0 ? void 0 : _entityType$annotatio3.filter(identificationDataField => {
      var _identificationDataFi, _identificationDataFi2, _identificationDataFi3, _identificationDataFi4, _identificationDataFi5, _identificationDataFi6, _identificationDataFi7, _identificationDataFi8, _identificationDataFi9, _identificationDataFi10;
      return ((_identificationDataFi = identificationDataField.annotations) === null || _identificationDataFi === void 0 ? void 0 : (_identificationDataFi2 = _identificationDataFi.UI) === null || _identificationDataFi2 === void 0 ? void 0 : (_identificationDataFi3 = _identificationDataFi2.Hidden) === null || _identificationDataFi3 === void 0 ? void 0 : _identificationDataFi3.valueOf()) !== true && identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && Boolean((_identificationDataFi4 = identificationDataField.Determining) === null || _identificationDataFi4 === void 0 ? void 0 : _identificationDataFi4.valueOf()) === isDeterminingAction && (((_identificationDataFi5 = identificationDataField.ActionTarget) === null || _identificationDataFi5 === void 0 ? void 0 : (_identificationDataFi6 = _identificationDataFi5.isBound) === null || _identificationDataFi6 === void 0 ? void 0 : _identificationDataFi6.valueOf()) !== true || (identificationDataField === null || identificationDataField === void 0 ? void 0 : (_identificationDataFi7 = identificationDataField.ActionTarget) === null || _identificationDataFi7 === void 0 ? void 0 : (_identificationDataFi8 = _identificationDataFi7.annotations) === null || _identificationDataFi8 === void 0 ? void 0 : (_identificationDataFi9 = _identificationDataFi8.Core) === null || _identificationDataFi9 === void 0 ? void 0 : (_identificationDataFi10 = _identificationDataFi9.OperationAvailable) === null || _identificationDataFi10 === void 0 ? void 0 : _identificationDataFi10.valueOf()) !== false) ? true : false;
    })) || [];
  }

  /**
   * Retrieve all the IBN actions for the identification annotation.
   * They must be
   * - Not statically hidden.
   *
   * @param entityType The current entitytype
   * @param isDeterminingAction Whether or not the action should be determining
   * @returns An array of data field for action respecting the isDeterminingAction property.
   */
  _exports.getIdentificationDataFieldForActions = getIdentificationDataFieldForActions;
  function getIdentificationDataFieldForIBNActions(entityType, isDeterminingAction) {
    var _entityType$annotatio4, _entityType$annotatio5, _entityType$annotatio6;
    return ((_entityType$annotatio4 = entityType.annotations) === null || _entityType$annotatio4 === void 0 ? void 0 : (_entityType$annotatio5 = _entityType$annotatio4.UI) === null || _entityType$annotatio5 === void 0 ? void 0 : (_entityType$annotatio6 = _entityType$annotatio5.Identification) === null || _entityType$annotatio6 === void 0 ? void 0 : _entityType$annotatio6.filter(identificationDataField => {
      var _identificationDataFi11, _identificationDataFi12, _identificationDataFi13, _identificationDataFi14;
      return ((_identificationDataFi11 = identificationDataField.annotations) === null || _identificationDataFi11 === void 0 ? void 0 : (_identificationDataFi12 = _identificationDataFi11.UI) === null || _identificationDataFi12 === void 0 ? void 0 : (_identificationDataFi13 = _identificationDataFi12.Hidden) === null || _identificationDataFi13 === void 0 ? void 0 : _identificationDataFi13.valueOf()) !== true && identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && Boolean((_identificationDataFi14 = identificationDataField.Determining) === null || _identificationDataFi14 === void 0 ? void 0 : _identificationDataFi14.valueOf()) === isDeterminingAction ? true : false;
    })) || [];
  }
  const IMPORTANT_CRITICALITIES = ["UI.CriticalityType/VeryPositive", "UI.CriticalityType/Positive", "UI.CriticalityType/Negative", "UI.CriticalityType/VeryNegative"];

  /**
   * Method to determine the 'visible' property binding for the Delete button on an object page.
   *
   * @param converterContext Instance of the converter context.
   * @param deleteHidden The value of the UI.DeleteHidden annotation on the entity set / type.
   * @returns The binding expression for the 'visible' property of the Delete button.
   */
  _exports.IMPORTANT_CRITICALITIES = IMPORTANT_CRITICALITIES;
  function getDeleteButtonVisibility(converterContext, deleteHidden) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath(),
      visitedNavigationPaths = dataModelObjectPath.navigationProperties.map(navProp => navProp.name),
      // Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
      // For e.g. /com.sap.namespace.EntityContainer/Singleton/Property to /Singleton/Property
      deleteHiddenExpression = getExpressionFromAnnotation(deleteHidden, visitedNavigationPaths, false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), [])),
      // default to false
      manifestWrapper = converterContext.getManifestWrapper(),
      viewLevel = manifestWrapper.getViewLevel(),
      // Delete button is visible
      // In OP 		-->  when not in edit mode
      // In sub-OP 	-->  when in edit mode
      editableExpression = viewLevel > 1 ? UI.IsEditable : not(UI.IsEditable);

    // If UI.DeleteHidden annotation on entity set or type is either not defined or explicitly set to false,
    // Delete button is visible based on editableExpression.
    // else,
    // Delete button is visible based on both annotation path and editableExpression.
    return ifElse(deleteHidden === undefined || deleteHidden.valueOf() === false, editableExpression, and(editableExpression, equal(deleteHiddenExpression, false)));
  }

  /**
   * Method to determine the 'enabled' property binding for the Delete button on an object page.
   *
   * @param isDeletable The delete restriction configured
   * @param isParentDeletable The delete restriction configured on the parent entity
   * @param converterContext
   * @returns The binding expression for the 'enabled' property of the Delete button
   */
  _exports.getDeleteButtonVisibility = getDeleteButtonVisibility;
  function getDeleteButtonEnabled(isDeletable, isParentDeletable, converterContext) {
    const entitySet = converterContext.getEntitySet(),
      isDraftRoot = ModelHelper.isDraftRoot(entitySet);
    let ret = ifElse(isParentDeletable !== undefined, isParentDeletable, ifElse(isDeletable !== undefined, equal(getExpressionFromAnnotation(isDeletable), true), constant(true)));

    // delete should be disabled for Locked objects
    ret = isDraftRoot ? and(ret, not(pathInModel("DraftAdministrativeData/InProcessByUser"))) : ret;
    return ret;
  }

  /**
   * Method to determine the 'visible' property binding for the Edit button on an object page.
   *
   * @param converterContext Instance of the converter context.
   * @param rootUpdateHidden The value of the UI.UpdateHidden annotation on the entity set / type.
   * @param rootConverterContext
   * @param updateHidden
   * @param viewLevel
   * @returns The binding expression for the 'visible' property of the Edit button.
   */
  _exports.getDeleteButtonEnabled = getDeleteButtonEnabled;
  function getEditButtonVisibility(converterContext, rootUpdateHidden, rootConverterContext, updateHidden, viewLevel) {
    const rootEntitySet = rootConverterContext === null || rootConverterContext === void 0 ? void 0 : rootConverterContext.getEntitySet(),
      entitySet = converterContext.getEntitySet(),
      isFCLEnabled = converterContext.getManifestWrapper().isFclEnabled();
    let isDraftEnabled;
    const rootUpdateHiddenExpression = getHiddenExpression(rootConverterContext, rootUpdateHidden);
    if (viewLevel && viewLevel > 1) {
      // if viewlevel > 1 check if node is draft enabled
      isDraftEnabled = ModelHelper.isDraftNode(entitySet);
    } else {
      isDraftEnabled = ModelHelper.isDraftRoot(rootEntitySet);
    }
    const updateHiddenExpression = getHiddenExpression(rootConverterContext, updateHidden);
    const notEditableExpression = not(UI.IsEditable);

    // If UI.UpdateHidden annotation on entity set or type is either not defined or explicitly set to false,
    // Edit button is visible in display mode.
    // else,
    // Edit button is visible based on both annotation path and in display mode.
    const resultantExpression = ifElse(viewLevel > 1, ifElse(updateHidden === undefined || updateHidden.valueOf() === false, and(notEditableExpression, equal(pathInModel("rootEditVisible", "internal"), true), ifElse(isFCLEnabled, equal(pathInModel("/showEditButton", "fclhelper"), true), true)), and(notEditableExpression, equal(updateHiddenExpression, false), equal(pathInModel("rootEditVisible", "internal"), true), ifElse(isFCLEnabled, equal(pathInModel("/showEditButton", "fclhelper"), true), true))), ifElse(rootUpdateHidden === undefined || rootUpdateHidden.valueOf() === false, notEditableExpression, and(notEditableExpression, equal(rootUpdateHiddenExpression, false))));
    return ifElse(isDraftEnabled, and(resultantExpression, Draft.HasNoDraftForCurrentUser), resultantExpression);
  }
  _exports.getEditButtonVisibility = getEditButtonVisibility;
  function getHiddenExpression(converterContext, updateHidden) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath(),
      visitedNavigationPaths = dataModelObjectPath.navigationProperties.map(navProp => navProp.name),
      // Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
      // For e.g. /com.sap.namespace.EntityContainer/Singleton/Property to /Singleton/Property
      updateHiddenExpression = getExpressionFromAnnotation(updateHidden, visitedNavigationPaths, false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), visitedNavigationPaths));
    return updateHiddenExpression;
  }
  /**
   * Method to determine the 'enabled' property binding for the Edit button on an object page.
   *
   * @param converterContext Instance of the converter context.
   * @param updateRestrictions
   * @param viewLevel
   * @returns The binding expression for the 'enabled' property of the Edit button.
   */
  _exports.getHiddenExpression = getHiddenExpression;
  function getEditButtonEnabled(converterContext, updateRestrictions, viewLevel) {
    const entitySet = converterContext.getEntitySet(),
      isDraftRoot = ModelHelper.isDraftRoot(entitySet),
      isSticky = ModelHelper.isSticky(entitySet);
    let editActionName;
    if (isDraftRoot && isEntitySet(entitySet)) {
      var _entitySet$annotation, _entitySet$annotation2;
      editActionName = (_entitySet$annotation = entitySet.annotations.Common) === null || _entitySet$annotation === void 0 ? void 0 : (_entitySet$annotation2 = _entitySet$annotation.DraftRoot) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.EditAction;
    } else if (isSticky && isEntitySet(entitySet)) {
      var _entitySet$annotation3, _entitySet$annotation4;
      editActionName = (_entitySet$annotation3 = entitySet.annotations.Session) === null || _entitySet$annotation3 === void 0 ? void 0 : (_entitySet$annotation4 = _entitySet$annotation3.StickySessionSupported) === null || _entitySet$annotation4 === void 0 ? void 0 : _entitySet$annotation4.EditAction;
    }
    if (editActionName) {
      var _editAction$annotatio, _editAction$annotatio2;
      const editActionAnnotationPath = converterContext.getAbsoluteAnnotationPath(editActionName);
      const editAction = converterContext.resolveAbsolutePath(editActionAnnotationPath).target;
      if ((editAction === null || editAction === void 0 ? void 0 : (_editAction$annotatio = editAction.annotations) === null || _editAction$annotatio === void 0 ? void 0 : (_editAction$annotatio2 = _editAction$annotatio.Core) === null || _editAction$annotatio2 === void 0 ? void 0 : _editAction$annotatio2.OperationAvailable) === null) {
        // We disabled action advertisement but kept it in the code for the time being
        //return "{= ${#" + editActionName + "} ? true : false }";
      } else if (viewLevel > 1) {
        // Edit button is enabled based on the update restrictions of the sub-OP
        if (updateRestrictions !== undefined) {
          return compileExpression(and(equal(getExpressionFromAnnotation(updateRestrictions), true), equal(pathInModel("rootEditEnabled", "internal"), true)));
        } else {
          return compileExpression(equal(pathInModel("rootEditEnabled", "internal"), true));
        }
      } else {
        return getEnabledForAnnotationAction(converterContext, editAction ?? undefined);
      }
    }
    return "true";
  }
  _exports.getEditButtonEnabled = getEditButtonEnabled;
  function getHeaderDefaultActions(converterContext) {
    var _entitySet$annotation5, _entitySet$annotation6, _entitySet$annotation7, _entitySet$annotation8, _entityDeleteRestrict;
    const sContextPath = converterContext.getContextPath();
    const rootEntitySetPath = ModelHelper.getRootEntitySetPath(sContextPath);
    const rootConverterContext = converterContext.getConverterContextFor("/" + rootEntitySetPath);
    const entitySet = converterContext.getEntitySet(),
      entityType = converterContext.getEntityType(),
      rootEntitySet = rootConverterContext.getEntitySet(),
      rootEntityType = rootConverterContext.getEntityType(),
      stickySessionSupported = ModelHelper.getStickySession(rootEntitySet),
      //for sticky app
      draftRoot = ModelHelper.getDraftRoot(rootEntitySet),
      //entitySet && entitySet.annotations.Common?.DraftRoot,
      draftNode = ModelHelper.getDraftNode(rootEntitySet),
      entityDeleteRestrictions = entitySet && ((_entitySet$annotation5 = entitySet.annotations) === null || _entitySet$annotation5 === void 0 ? void 0 : (_entitySet$annotation6 = _entitySet$annotation5.Capabilities) === null || _entitySet$annotation6 === void 0 ? void 0 : _entitySet$annotation6.DeleteRestrictions),
      rootUpdateHidden = ModelHelper.isUpdateHidden(rootEntitySet, rootEntityType),
      updateHidden = rootEntitySet && isEntitySet(rootEntitySet) && (rootUpdateHidden === null || rootUpdateHidden === void 0 ? void 0 : rootUpdateHidden.valueOf()),
      dataModelObjectPath = converterContext.getDataModelObjectPath(),
      isParentDeletable = isPathDeletable(dataModelObjectPath, {
        pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, converterContext.getConvertedTypes(), navigationPaths)
      }),
      parentEntitySetDeletable = isParentDeletable ? compileExpression(isParentDeletable) : isParentDeletable,
      identificationFieldForActions = getIdentificationDataFieldForActions(converterContext.getEntityType(), false);
    const copyDataField = converterContext.getManifestWrapper().getViewLevel() === 1 ? getCopyAction(identificationFieldForActions.filter(dataField => {
      return dataFieldIsCopyAction(dataField);
    })) : undefined;
    const headerDataFieldForActions = identificationFieldForActions.filter(dataField => {
      return !dataFieldIsCopyAction(dataField);
    });

    // Initialize actions and start with draft actions if available since they should appear in the first
    // leftmost position in the actions area of the OP header
    // This is more like a placeholder than a single action, since this controls not only the templating of
    // the button for switching between draft and active document versions but also the controls for
    // the collaborative draft fragment.
    const headerActions = [];
    if (isEntitySet(entitySet) && draftRoot !== null && draftRoot !== void 0 && draftRoot.EditAction && updateHidden !== true) {
      headerActions.push({
        type: ActionType.DraftActions,
        key: "DraftActions"
      });
    }
    const viewLevel = converterContext.getManifestWrapper().getViewLevel();
    const updatablePropertyPath = viewLevel > 1 ? entitySet === null || entitySet === void 0 ? void 0 : (_entitySet$annotation7 = entitySet.annotations.Capabilities) === null || _entitySet$annotation7 === void 0 ? void 0 : (_entitySet$annotation8 = _entitySet$annotation7.UpdateRestrictions) === null || _entitySet$annotation8 === void 0 ? void 0 : _entitySet$annotation8.Updatable : undefined;
    if (draftRoot || draftNode) {
      headerActions.push({
        type: ActionType.CollaborationAvatars,
        key: "CollaborationAvatars"
      });
    }
    // Then add the "Critical" DataFieldForActions
    headerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField === null || dataField === void 0 ? void 0 : dataField.Criticality));
      return IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      headerActions.push(getDataFieldAnnotationAction(dataField, converterContext));
    });

    // Then the edit action if it exists
    if ((draftRoot !== null && draftRoot !== void 0 && draftRoot.EditAction || stickySessionSupported !== null && stickySessionSupported !== void 0 && stickySessionSupported.EditAction) && updateHidden !== true) {
      headerActions.push({
        type: ActionType.Primary,
        key: "EditAction",
        visible: compileExpression(getEditButtonVisibility(converterContext, rootUpdateHidden, rootConverterContext, ModelHelper.isUpdateHidden(entitySet, entityType), viewLevel)),
        enabled: getEditButtonEnabled(rootConverterContext, updatablePropertyPath, viewLevel)
      });
    }
    // Then the delete action if we're not statically not deletable
    if (parentEntitySetDeletable && parentEntitySetDeletable !== "false" || (entityDeleteRestrictions === null || entityDeleteRestrictions === void 0 ? void 0 : (_entityDeleteRestrict = entityDeleteRestrictions.Deletable) === null || _entityDeleteRestrict === void 0 ? void 0 : _entityDeleteRestrict.valueOf()) !== false && parentEntitySetDeletable !== "false") {
      const deleteHidden = ModelHelper.getDeleteHidden(entitySet, entityType);
      headerActions.push({
        type: ActionType.Secondary,
        key: "DeleteAction",
        visible: compileExpression(getDeleteButtonVisibility(converterContext, deleteHidden)),
        enabled: compileExpression(getDeleteButtonEnabled(entityDeleteRestrictions === null || entityDeleteRestrictions === void 0 ? void 0 : entityDeleteRestrictions.Deletable, isParentDeletable, converterContext)),
        parentEntityDeleteEnabled: parentEntitySetDeletable
      });
    }
    if (copyDataField) {
      var _copyDataField$Label;
      headerActions.push({
        ...getDataFieldAnnotationAction(copyDataField, converterContext),
        type: ActionType.Copy,
        text: ((_copyDataField$Label = copyDataField.Label) === null || _copyDataField$Label === void 0 ? void 0 : _copyDataField$Label.toString()) ?? Core.getLibraryResourceBundle("sap.fe.core").getText("C_COMMON_COPY")
      });
    }
    const headerDataFieldForIBNActions = getIdentificationDataFieldForIBNActions(converterContext.getEntityType(), false);
    headerDataFieldForIBNActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField === null || dataField === void 0 ? void 0 : dataField.Criticality));
      return !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      var _dataField$RequiresCo, _dataField$Inline, _dataField$Label, _dataField$annotation, _dataField$annotation2;
      if (((_dataField$RequiresCo = dataField.RequiresContext) === null || _dataField$RequiresCo === void 0 ? void 0 : _dataField$RequiresCo.valueOf()) === true) {
        throw new Error(`RequiresContext property should not be true for header IBN action : ${dataField.Label}`);
      }
      if (((_dataField$Inline = dataField.Inline) === null || _dataField$Inline === void 0 ? void 0 : _dataField$Inline.valueOf()) === true) {
        throw new Error(`Inline property should not be true for header IBN action : ${dataField.Label}`);
      }
      const oNavigationParams = {
        semanticObjectMapping: getSemanticObjectMapping(dataField.Mapping)
      };
      headerActions.push({
        type: ActionType.DataFieldForIntentBasedNavigation,
        text: (_dataField$Label = dataField.Label) === null || _dataField$Label === void 0 ? void 0 : _dataField$Label.toString(),
        annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
        buttonType: ButtonType.Ghost,
        visible: compileExpression(and(not(equal(getExpressionFromAnnotation((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : _dataField$annotation2.Hidden), true)), not(equal(pathInModel("shellNavigationNotAvailable", "internal"), true)))),
        enabled: dataField.NavigationAvailable !== undefined ? compileExpression(equal(getExpressionFromAnnotation(dataField.NavigationAvailable), true)) : true,
        key: KeyHelper.generateKeyFromDataField(dataField),
        isNavigable: true,
        press: compileExpression(fn("._intentBasedNavigation.navigate", [getExpressionFromAnnotation(dataField.SemanticObject), getExpressionFromAnnotation(dataField.Action), oNavigationParams])),
        customData: compileExpression({
          semanticObject: getExpressionFromAnnotation(dataField.SemanticObject),
          action: getExpressionFromAnnotation(dataField.Action)
        })
      });
    });
    // Finally the non critical DataFieldForActions
    headerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField === null || dataField === void 0 ? void 0 : dataField.Criticality));
      return !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      headerActions.push(getDataFieldAnnotationAction(dataField, converterContext));
    });
    return headerActions;
  }
  _exports.getHeaderDefaultActions = getHeaderDefaultActions;
  function getHiddenHeaderActions(converterContext) {
    var _entityType$annotatio7, _entityType$annotatio8, _entityType$annotatio9;
    const entityType = converterContext.getEntityType();
    const hiddenActions = ((_entityType$annotatio7 = entityType.annotations) === null || _entityType$annotatio7 === void 0 ? void 0 : (_entityType$annotatio8 = _entityType$annotatio7.UI) === null || _entityType$annotatio8 === void 0 ? void 0 : (_entityType$annotatio9 = _entityType$annotatio8.Identification) === null || _entityType$annotatio9 === void 0 ? void 0 : _entityType$annotatio9.filter(identificationDataField => {
      var _identificationDataFi15, _identificationDataFi16, _identificationDataFi17;
      return (identificationDataField === null || identificationDataField === void 0 ? void 0 : (_identificationDataFi15 = identificationDataField.annotations) === null || _identificationDataFi15 === void 0 ? void 0 : (_identificationDataFi16 = _identificationDataFi15.UI) === null || _identificationDataFi16 === void 0 ? void 0 : (_identificationDataFi17 = _identificationDataFi16.Hidden) === null || _identificationDataFi17 === void 0 ? void 0 : _identificationDataFi17.valueOf()) === true;
    })) || [];
    return hiddenActions.map(dataField => {
      return {
        type: ActionType.Default,
        key: KeyHelper.generateKeyFromDataField(dataField)
      };
    });
  }
  _exports.getHiddenHeaderActions = getHiddenHeaderActions;
  function getFooterDefaultActions(viewLevel, converterContext) {
    var _entitySet$annotation9, _entitySet$annotation10, _entitySet$annotation11, _entitySet$annotation12;
    const entitySet = converterContext.getEntitySet();
    const entityType = converterContext.getEntityType();
    const stickySessionSupported = ModelHelper.getStickySession(entitySet),
      //for sticky app
      entitySetDraftRoot = isEntitySet(entitySet) && (((_entitySet$annotation9 = entitySet.annotations.Common) === null || _entitySet$annotation9 === void 0 ? void 0 : (_entitySet$annotation10 = _entitySet$annotation9.DraftRoot) === null || _entitySet$annotation10 === void 0 ? void 0 : _entitySet$annotation10.term) ?? ((_entitySet$annotation11 = entitySet.annotations.Session) === null || _entitySet$annotation11 === void 0 ? void 0 : (_entitySet$annotation12 = _entitySet$annotation11.StickySessionSupported) === null || _entitySet$annotation12 === void 0 ? void 0 : _entitySet$annotation12.term)),
      conditionSave = Boolean(entitySetDraftRoot === "com.sap.vocabularies.Common.v1.DraftRoot" || stickySessionSupported && (stickySessionSupported === null || stickySessionSupported === void 0 ? void 0 : stickySessionSupported.SaveAction)),
      conditionApply = viewLevel > 1,
      conditionCancel = Boolean(entitySetDraftRoot === "com.sap.vocabularies.Common.v1.DraftRoot" || stickySessionSupported && (stickySessionSupported === null || stickySessionSupported === void 0 ? void 0 : stickySessionSupported.DiscardAction));

    // Retrieve all determining actions
    const footerDataFieldForActions = getIdentificationDataFieldForActions(converterContext.getEntityType(), true);

    // First add the "Critical" DataFieldForActions
    const footerActions = footerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField === null || dataField === void 0 ? void 0 : dataField.Criticality));
      return criticality && IMPORTANT_CRITICALITIES.includes(criticality);
    }).map(dataField => {
      return getDataFieldAnnotationAction(dataField, converterContext);
    });

    // Then the save action if it exists
    if ((entitySet === null || entitySet === void 0 ? void 0 : entitySet.entityTypeName) === (entityType === null || entityType === void 0 ? void 0 : entityType.fullyQualifiedName) && conditionSave) {
      footerActions.push({
        type: ActionType.Primary,
        key: "SaveAction"
      });
    }

    // Then the apply action if it exists
    if (conditionApply) {
      footerActions.push({
        type: ActionType.DefaultApply,
        key: "ApplyAction"
      });
    }

    // Then the non critical DataFieldForActions
    footerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField === null || dataField === void 0 ? void 0 : dataField.Criticality));
      return criticality && !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      footerActions.push(getDataFieldAnnotationAction(dataField, converterContext));
    });

    // Then the cancel action if it exists
    if (conditionCancel) {
      footerActions.push({
        type: ActionType.Secondary,
        key: "CancelAction",
        position: {
          placement: Placement.End
        }
      });
    }
    return footerActions;
  }
  _exports.getFooterDefaultActions = getFooterDefaultActions;
  function getDataFieldAnnotationAction(dataField, converterContext) {
    const isVisibleExp = isVisible(dataField);
    return {
      type: ActionType.DataFieldForAction,
      annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
      key: KeyHelper.generateKeyFromDataField(dataField),
      visible: compileExpression(isVisibleExp),
      enabled: getEnabledForAnnotationAction(converterContext, dataField.ActionTarget),
      isNavigable: true
    };
  }
  return _exports;
}, false);
