/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/ID", "sap/fe/core/formatters/FPMFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/UIFormatters"], function (Log, ManifestSettings, ConfigurableObject, ID, fpmFormatter, BindingToolkit, StableIdHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var getActionEnabledExpression = UIFormatters.getActionEnabledExpression;
  var replaceSpecialChars = StableIdHelper.replaceSpecialChars;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var greaterOrEqual = BindingToolkit.greaterOrEqual;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var getCustomActionID = ID.getCustomActionID;
  var Placement = ConfigurableObject.Placement;
  var ActionType = ManifestSettings.ActionType;
  let ButtonType;
  (function (ButtonType) {
    ButtonType["Accept"] = "Accept";
    ButtonType["Attention"] = "Attention";
    ButtonType["Back"] = "Back";
    ButtonType["Critical"] = "Critical";
    ButtonType["Default"] = "Default";
    ButtonType["Emphasized"] = "Emphasized";
    ButtonType["Ghost"] = "Ghost";
    ButtonType["Negative"] = "Negative";
    ButtonType["Neutral"] = "Neutral";
    ButtonType["Reject"] = "Reject";
    ButtonType["Success"] = "Success";
    ButtonType["Transparent"] = "Transparent";
    ButtonType["Unstyled"] = "Unstyled";
    ButtonType["Up"] = "Up";
  })(ButtonType || (ButtonType = {}));
  _exports.ButtonType = ButtonType;
  /**
   * Maps an action by its key, based on the given annotation actions and manifest configuration. The result already represents the
   * merged action from both configuration sources.
   *
   * This function also returns an indication whether the action can be a menu item, saying whether it is visible or of a specific type
   * that allows this.
   *
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   * @param actionKey Key to look up
   * @returns Merged action and indicator whether it can be a menu item
   */
  function mapActionByKey(manifestActions, annotationActions, hiddenActions, actionKey) {
    const annotationAction = annotationActions.find(action => action.key === actionKey);
    const manifestAction = manifestActions[actionKey];
    const resultAction = {
      ...(annotationAction ?? manifestAction)
    };

    // Annotation action and manifest configuration already has to be merged here as insertCustomElements only considers top-level actions
    if (annotationAction) {
      // If enabled or visible is not set in the manifest, use the annotation value and hence do not overwrite
      resultAction.enabled = (manifestAction === null || manifestAction === void 0 ? void 0 : manifestAction.enabled) ?? annotationAction.enabled;
      resultAction.visible = (manifestAction === null || manifestAction === void 0 ? void 0 : manifestAction.visible) ?? annotationAction.visible;
      for (const prop in manifestAction || {}) {
        const propKey = prop;
        if (!annotationAction[propKey] && propKey !== "menu") {
          resultAction[propKey] = manifestAction[propKey];
        }
      }
    }
    const canBeMenuItem = ((resultAction === null || resultAction === void 0 ? void 0 : resultAction.visible) || (resultAction === null || resultAction === void 0 ? void 0 : resultAction.type) === ActionType.DataFieldForAction || (resultAction === null || resultAction === void 0 ? void 0 : resultAction.type) === ActionType.DataFieldForIntentBasedNavigation) && !hiddenActions.find(hiddenAction => hiddenAction.key === (resultAction === null || resultAction === void 0 ? void 0 : resultAction.key));
    return {
      action: resultAction,
      canBeMenuItem
    };
  }

  /**
   * Map the default action key of a menu to its actual action configuration and identify whether this default action is a command.
   *
   * @param menuAction Menu action to map the default action for
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param commandActions Array of command actions to push the default action to if applicable
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   */
  function mapMenuDefaultAction(menuAction, manifestActions, annotationActions, commandActions, hiddenActions) {
    const {
      action,
      canBeMenuItem
    } = mapActionByKey(manifestActions, annotationActions, hiddenActions, menuAction.defaultAction);
    if (canBeMenuItem) {
      menuAction.defaultAction = action;
    }
    if (action.command) {
      commandActions[action.key] = action;
    }
  }

  /**
   * Map the menu item keys of a menu to their actual action configurations and identify whether they are commands.
   *
   * @param menuAction Menu action to map the menu items for
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param commandActions Array of command actions to push the menu item actions to if applicable
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   */
  function mapMenuItems(menuAction, manifestActions, annotationActions, commandActions, hiddenActions) {
    const mappedMenuItems = [];
    for (const menuItemKey of menuAction.menu ?? []) {
      const {
        action,
        canBeMenuItem
      } = mapActionByKey(manifestActions, annotationActions, hiddenActions, menuItemKey);
      if (canBeMenuItem) {
        mappedMenuItems.push(action);
      }
      if (action.command) {
        commandActions[menuItemKey] = action;
      }
    }
    menuAction.menu = mappedMenuItems;

    // If the menu is set to invisible, it should be invisible, otherwise the visibility should be calculated from the items
    const visibleExpressions = mappedMenuItems.map(menuItem => resolveBindingString(menuItem.visible, "boolean"));
    menuAction.visible = compileExpression(and(resolveBindingString(menuAction.visible, "boolean"), or(...visibleExpressions)));
  }

  /**
   * Transforms the flat collection of actions into a nested structures of menus. The result is a record of actions that are either menus or
   * ones that do not appear in menus as menu items. It also returns a list of actions that have an assigned command.
   *
   * Note that menu items are already the merged result of annotation actions and their manifest configuration, as {@link insertCustomElements}
   * only considers root-level actions.
   *
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   * @returns The transformed actions from the manifest and a list of command actions
   */
  function transformMenuActionsAndIdentifyCommands(manifestActions, annotationActions, hiddenActions) {
    const allActions = {};
    const actionKeysToDelete = [];
    const commandActions = {};
    for (const actionKey in manifestActions) {
      const manifestAction = manifestActions[actionKey];
      if (manifestAction.defaultAction !== undefined) {
        mapMenuDefaultAction(manifestAction, manifestActions, annotationActions, commandActions, hiddenActions);
      }
      if (manifestAction.type === ActionType.Menu) {
        var _manifestAction$menu;
        // Menu items should not appear as top-level actions themselves
        actionKeysToDelete.push(...manifestAction.menu);
        mapMenuItems(manifestAction, manifestActions, annotationActions, commandActions, hiddenActions);

        // Menu has no visible items, so remove it
        if (!((_manifestAction$menu = manifestAction.menu) !== null && _manifestAction$menu !== void 0 && _manifestAction$menu.length)) {
          actionKeysToDelete.push(manifestAction.key);
        }
      }
      if (manifestAction.command) {
        commandActions[actionKey] = manifestAction;
      }
      allActions[actionKey] = manifestAction;
    }
    actionKeysToDelete.forEach(actionKey => delete allActions[actionKey]);
    return {
      actions: allActions,
      commandActions: commandActions
    };
  }

  /**
   * Gets the binding expression for the enablement of a manifest action.
   *
   * @param manifestAction The action configured in the manifest
   * @param isAnnotationAction Whether the action, defined in manifest, corresponds to an existing annotation action.
   * @param converterContext
   * @returns Determined property value for the enablement
   */
  const _getManifestEnabled = function (manifestAction, isAnnotationAction, converterContext) {
    if (isAnnotationAction && manifestAction.enabled === undefined) {
      // If annotation action has no property defined in manifest,
      // do not overwrite it with manifest action's default value.
      return undefined;
    }
    const result = getManifestActionBooleanPropertyWithFormatter(manifestAction.enabled, converterContext);

    // Consider requiresSelection property to include selectedContexts in the binding expression
    return compileExpression(ifElse(manifestAction.requiresSelection === true, and(greaterOrEqual(pathInModel("numberOfSelectedContexts", "internal"), 1), result), result));
  };

  /**
   * Gets the binding expression for the visibility of a manifest action.
   *
   * @param manifestAction The action configured in the manifest
   * @param isAnnotationAction Whether the action, defined in manifest, corresponds to an existing annotation action.
   * @param converterContext
   * @returns Determined property value for the visibility
   */
  const _getManifestVisible = function (manifestAction, isAnnotationAction, converterContext) {
    if (isAnnotationAction && manifestAction.visible === undefined) {
      // If annotation action has no property defined in manifest,
      // do not overwrite it with manifest action's default value.
      return undefined;
    }
    const result = getManifestActionBooleanPropertyWithFormatter(manifestAction.visible, converterContext);
    return compileExpression(result);
  };

  /**
   * As some properties should not be overridable by the manifest, make sure that the manifest configuration gets the annotation values for these.
   *
   * @param manifestAction Action defined in the manifest
   * @param annotationAction Action defined through annotations
   */
  function overrideManifestConfigurationWithAnnotation(manifestAction, annotationAction) {
    if (!annotationAction) {
      return;
    }

    // Do not override the 'type' given in an annotation action
    manifestAction.type = annotationAction.type;
    manifestAction.annotationPath = annotationAction.annotationPath;
    manifestAction.press = annotationAction.press;

    // Only use the annotation values for enablement and visibility if not set in the manifest
    manifestAction.enabled = manifestAction.enabled ?? annotationAction.enabled;
    manifestAction.visible = manifestAction.visible ?? annotationAction.visible;
  }

  /**
   * Hide an action if it is a hidden header action.
   *
   * @param action The action to hide
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   */
  function hideActionIfHiddenAction(action, hiddenActions) {
    if (hiddenActions !== null && hiddenActions !== void 0 && hiddenActions.find(hiddenAction => hiddenAction.key === action.key)) {
      action.visible = "false";
    }
  }

  /**
   * Creates the action configuration based on the manifest settings.
   *
   * @param manifestActions The manifest actions
   * @param converterContext The converter context
   * @param annotationActions The annotation actions definition
   * @param navigationSettings The navigation settings
   * @param considerNavigationSettings The navigation settings to be considered
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   * @param facetName The facet where an action is displayed if it is inline
   * @returns The actions from the manifest
   */
  function getActionsFromManifest(manifestActions, converterContext, annotationActions, navigationSettings, considerNavigationSettings, hiddenActions, facetName) {
    const actions = {};
    for (const actionKey in manifestActions) {
      var _manifestAction$press, _manifestAction$posit;
      const manifestAction = manifestActions[actionKey];
      const lastDotIndex = ((_manifestAction$press = manifestAction.press) === null || _manifestAction$press === void 0 ? void 0 : _manifestAction$press.lastIndexOf(".")) || -1;
      const oAnnotationAction = annotationActions === null || annotationActions === void 0 ? void 0 : annotationActions.find(obj => obj.key === actionKey);

      // To identify the annotation action property overwrite via manifest use-case.
      const isAnnotationAction = !!oAnnotationAction;
      if (manifestAction.facetName) {
        facetName = manifestAction.facetName;
      }
      actions[actionKey] = {
        id: oAnnotationAction ? actionKey : getCustomActionID(actionKey),
        type: manifestAction.menu ? ActionType.Menu : ActionType.Default,
        visible: _getManifestVisible(manifestAction, isAnnotationAction, converterContext),
        enabled: _getManifestEnabled(manifestAction, isAnnotationAction, converterContext),
        handlerModule: manifestAction.press && manifestAction.press.substring(0, lastDotIndex).replace(/\./gi, "/"),
        handlerMethod: manifestAction.press && manifestAction.press.substring(lastDotIndex + 1),
        press: manifestAction.press,
        text: manifestAction.text,
        noWrap: manifestAction.__noWrap,
        key: replaceSpecialChars(actionKey),
        enableOnSelect: manifestAction.enableOnSelect,
        defaultValuesExtensionFunction: manifestAction.defaultValuesFunction,
        position: {
          anchor: (_manifestAction$posit = manifestAction.position) === null || _manifestAction$posit === void 0 ? void 0 : _manifestAction$posit.anchor,
          placement: manifestAction.position === undefined ? Placement.After : manifestAction.position.placement
        },
        isNavigable: isActionNavigable(manifestAction, navigationSettings, considerNavigationSettings),
        command: manifestAction.command,
        requiresSelection: manifestAction.requiresSelection === undefined ? false : manifestAction.requiresSelection,
        enableAutoScroll: enableAutoScroll(manifestAction),
        menu: manifestAction.menu ?? [],
        facetName: manifestAction.inline ? facetName : undefined,
        defaultAction: manifestAction.defaultAction
      };
      overrideManifestConfigurationWithAnnotation(actions[actionKey], oAnnotationAction);
      hideActionIfHiddenAction(actions[actionKey], hiddenActions);
    }
    return transformMenuActionsAndIdentifyCommands(actions, annotationActions ?? [], hiddenActions ?? []);
  }

  /**
   * Gets a binding expression representing a Boolean manifest property that can either be represented by a static value, a binding string,
   * or a runtime formatter function.
   *
   * @param propertyValue String representing the configured property value
   * @param converterContext
   * @returns A binding expression representing the property
   */
  _exports.getActionsFromManifest = getActionsFromManifest;
  function getManifestActionBooleanPropertyWithFormatter(propertyValue, converterContext) {
    const resolvedBinding = resolveBindingString(propertyValue, "boolean");
    let result;
    if (isConstant(resolvedBinding) && resolvedBinding.value === undefined) {
      // No property value configured in manifest for the custom action --> default value is true
      result = constant(true);
    } else if (isConstant(resolvedBinding) && typeof resolvedBinding.value === "string") {
      var _converterContext$get;
      // Then it's a module-method reference "sap.xxx.yyy.doSomething"
      const methodPath = resolvedBinding.value;
      // FIXME: The custom "isEnabled" check does not trigger (because none of the bound values changes)
      result = formatResult([pathInModel("/", "$view"), methodPath, pathInModel("selectedContexts", "internal")], fpmFormatter.customBooleanPropertyCheck, ((_converterContext$get = converterContext.getDataModelObjectPath().contextLocation) === null || _converterContext$get === void 0 ? void 0 : _converterContext$get.targetEntityType) || converterContext.getEntityType());
    } else {
      // then it's a binding
      result = resolvedBinding;
    }
    return result;
  }
  const removeDuplicateActions = actions => {
    let oMenuItemKeys = {};
    actions.forEach(action => {
      var _action$menu;
      if (action !== null && action !== void 0 && (_action$menu = action.menu) !== null && _action$menu !== void 0 && _action$menu.length) {
        const actionMenu = action.menu;
        oMenuItemKeys = actionMenu.reduce((item, _ref) => {
          let {
            key
          } = _ref;
          if (key && !item[key]) {
            item[key] = true;
          }
          return item;
        }, oMenuItemKeys);
      }
    });
    return actions.filter(action => !oMenuItemKeys[action.key]);
  };

  /**
   * Method to determine the value of the 'enabled' property of an annotation-based action.
   *
   * @param converterContext The instance of the converter context
   * @param actionTarget The instance of the action
   * @param pathFromContextLocation Is the binding path calculated  from the converter context location
   * @returns The binding expression for the 'enabled' property of the action button.
   */
  _exports.removeDuplicateActions = removeDuplicateActions;
  function getEnabledForAnnotationAction(converterContext, actionTarget) {
    var _actionTarget$annotat;
    let pathFromContextLocation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (actionTarget !== null && actionTarget !== void 0 && (_actionTarget$annotat = actionTarget.annotations.Core) !== null && _actionTarget$annotat !== void 0 && _actionTarget$annotat.OperationAvailable) {
      const dataModelObjectPath = converterContext.getDataModelObjectPath();
      const isEnabledExp = getActionEnabledExpression(actionTarget, converterContext.getConvertedTypes(), dataModelObjectPath, pathFromContextLocation);
      return compileExpression(isEnabledExp);
    }
    return "true";
  }
  _exports.getEnabledForAnnotationAction = getEnabledForAnnotationAction;
  function getSemanticObjectMapping(mappings) {
    return mappings ? mappings.map(mapping => {
      return {
        LocalProperty: {
          $PropertyPath: mapping.LocalProperty.value
        },
        SemanticObjectProperty: mapping.SemanticObjectProperty
      };
    }) : [];
  }
  _exports.getSemanticObjectMapping = getSemanticObjectMapping;
  function isActionNavigable(action, navigationSettings, considerNavigationSettings) {
    var _action$afterExecutio, _action$afterExecutio2;
    let bIsNavigationConfigured = true;
    if (considerNavigationSettings) {
      const detailOrDisplay = navigationSettings && (navigationSettings.detail || navigationSettings.display);
      bIsNavigationConfigured = detailOrDisplay !== null && detailOrDisplay !== void 0 && detailOrDisplay.route ? true : false;
    }
    // when enableAutoScroll is true the navigateToInstance feature is disabled
    if (action && action.afterExecution && (((_action$afterExecutio = action.afterExecution) === null || _action$afterExecutio === void 0 ? void 0 : _action$afterExecutio.navigateToInstance) === false || ((_action$afterExecutio2 = action.afterExecution) === null || _action$afterExecutio2 === void 0 ? void 0 : _action$afterExecutio2.enableAutoScroll) === true) || !bIsNavigationConfigured) {
      return false;
    }
    return true;
  }
  _exports.isActionNavigable = isActionNavigable;
  function enableAutoScroll(action) {
    var _action$afterExecutio3;
    return (action === null || action === void 0 ? void 0 : (_action$afterExecutio3 = action.afterExecution) === null || _action$afterExecutio3 === void 0 ? void 0 : _action$afterExecutio3.enableAutoScroll) === true;
  }
  _exports.enableAutoScroll = enableAutoScroll;
  function dataFieldIsCopyAction(dataField) {
    var _dataField$annotation, _dataField$annotation2, _dataField$annotation3;
    return ((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : (_dataField$annotation3 = _dataField$annotation2.IsCopyAction) === null || _dataField$annotation3 === void 0 ? void 0 : _dataField$annotation3.valueOf()) === true && dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction";
  }
  _exports.dataFieldIsCopyAction = dataFieldIsCopyAction;
  function getCopyAction(copyDataFields) {
    if (copyDataFields.length === 1) {
      return copyDataFields[0];
    }
    if (copyDataFields.length > 1) {
      Log.error("Multiple actions are annotated with isCopyAction. There can be only one standard copy action.");
    }
    return undefined;
  }
  _exports.getCopyAction = getCopyAction;
  return _exports;
}, false);
