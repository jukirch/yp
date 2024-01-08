/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/UIFormatters", "../CommonHelper", "../internal/helpers/DefaultActionHandler", "./TableHelper"], function (BuildingBlockTemplateProcessor, ManifestSettings, MetaModelConverter, DataField, Action, StandardActions, BindingToolkit, StableIdHelper, UIFormatters, CommonHelper, DefaultActionHandler, TableHelper) {
  "use strict";

  var _exports = {};
  var getDataModelObjectPath = UIFormatters.getDataModelObjectPath;
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var ButtonType = Action.ButtonType;
  var isDataModelObjectPathForActionWithDialog = DataField.isDataModelObjectPathForActionWithDialog;
  var isDataFieldForIntentBasedNavigation = DataField.isDataFieldForIntentBasedNavigation;
  var isDataFieldForAction = DataField.isDataFieldForAction;
  var ActionType = ManifestSettings.ActionType;
  var xml = BuildingBlockTemplateProcessor.xml;
  /**
   * Generates the xml string for the DataFieldForAction MenuItem.
   *
   * @param dataField DataField for action
   * @param action The name of the action
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @returns The xml string for the DataFieldForAction MenuItem
   */
  function getMenuItemForAction(dataField, action, menuItemAction, table) {
    var _dataField$ActionTarg, _dataField$ActionTarg2, _dataField$ActionTarg3, _dataField$ActionTarg4, _dataField$ActionTarg5;
    if (!menuItemAction.annotationPath) {
      return "";
    }
    const actionContextPath = CommonHelper.getActionContext(table.metaPath.getModel().createBindingContext(menuItemAction.annotationPath + "/Action"));
    const actionContext = table.metaPath.getModel().createBindingContext(actionContextPath);
    const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, table.collection) : undefined;
    const isBound = (_dataField$ActionTarg = dataField.ActionTarget) === null || _dataField$ActionTarg === void 0 ? void 0 : _dataField$ActionTarg.isBound;
    const isOperationAvailable = ((_dataField$ActionTarg2 = dataField.ActionTarget) === null || _dataField$ActionTarg2 === void 0 ? void 0 : (_dataField$ActionTarg3 = _dataField$ActionTarg2.annotations) === null || _dataField$ActionTarg3 === void 0 ? void 0 : (_dataField$ActionTarg4 = _dataField$ActionTarg3.Core) === null || _dataField$ActionTarg4 === void 0 ? void 0 : (_dataField$ActionTarg5 = _dataField$ActionTarg4.OperationAvailable) === null || _dataField$ActionTarg5 === void 0 ? void 0 : _dataField$ActionTarg5.valueOf()) !== false;
    const press = menuItemAction.command ? "cmd:" + menuItemAction.command : TableHelper.pressEventDataFieldForActionButton({
      contextObjectPath: table.contextObjectPath,
      id: table.id
    }, dataField, table.collectionEntity.name, table.tableDefinition.operationAvailableMap, actionContext.getObject(), action.isNavigable, menuItemAction.enableAutoScroll, menuItemAction.defaultValuesExtensionFunction);
    const enabled = menuItemAction.enabled !== undefined ? menuItemAction.enabled : TableHelper.isDataFieldForActionEnabled(table.tableDefinition, dataField.Action, !!isBound, actionContext.getObject(), menuItemAction.enableOnSelect, dataFieldDataModelObjectPath === null || dataFieldDataModelObjectPath === void 0 ? void 0 : dataFieldDataModelObjectPath.targetEntityType);
    if (isBound !== true || isOperationAvailable) {
      return xml`<MenuItem
				text="${dataField.Label}"
				press="${press}"
				enabled="${enabled}"
				visible="${menuItemAction.visible}"
				/>`;
    } else {
      return "";
    }
  }

  /**
   * Generates the xml string for the DataFieldForIntentBasedNavigation MenuItem.
   *
   * @param dataField DataField for IntentBasedNavigation
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @returns The xml string for the DataFieldForIntentBasedNavigation MenuItem
   */
  function getMenuItemForIntentBasedNavigation(dataField, menuItemAction, table) {
    const dataFieldContext = menuItemAction.annotationPath ? table.metaPath.getModel().createBindingContext(menuItemAction.annotationPath) : null;
    return xml`<MenuItem xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			text="${dataField.Label}"
			press="${menuItemAction.command ? "cmd:" + menuItemAction.command : CommonHelper.getPressHandlerForDataFieldForIBN(dataFieldContext === null || dataFieldContext === void 0 ? void 0 : dataFieldContext.getObject(), "${internal>selectedContexts}", !table.tableDefinition.enableAnalytics)}"
			enabled="${menuItemAction.enabled !== undefined ? menuItemAction.enabled : TableHelper.isDataFieldForIBNEnabled({
      collection: table.collection,
      tableDefinition: table.tableDefinition
    }, dataField, dataField.RequiresContext, dataField.NavigationAvailable)}"
			visible="${menuItemAction.visible}"
			macrodata:IBNData="${!dataField.RequiresContext ? `{semanticObject: '${dataField.SemanticObject}' , action : '${dataField.Action}'}` : undefined}"
		/>`;
  }

  /**
   * Generates the xml string for the MenuItem based on the type of the menuItemAction.
   *
   * @param action The name of the action
   * @param menuItemAction The menuItemAction to be evaluated
   * @param table The instance of the table building block
   * @returns The xml string for the MenuItem
   */
  function getMenuItem(action, menuItemAction, table) {
    const dataField = menuItemAction.annotationPath ? table.convertedMetaData.resolvePath(menuItemAction.annotationPath).target : undefined;
    switch (dataField && menuItemAction.type) {
      case "ForAction":
        if (isDataFieldForAction(dataField)) {
          return getMenuItemForAction(dataField, action, menuItemAction, table);
        }
        break;
      case "ForNavigation":
        if (isDataFieldForIntentBasedNavigation(dataField)) {
          return getMenuItemForIntentBasedNavigation(dataField, menuItemAction, table);
        }
        break;
      default:
    }
    const actionPress = menuItemAction.noWrap ? menuItemAction.press : CommonHelper.buildActionWrapper(menuItemAction, {
      id: table.id
    });
    return xml`<MenuItem
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
				text="${menuItemAction === null || menuItemAction === void 0 ? void 0 : menuItemAction.text}"
				press="${menuItemAction.command ? "cmd:" + menuItemAction.command : actionPress}"
				visible="${menuItemAction.visible}"
				enabled="${menuItemAction.enabled}"
			/>`;
  }

  /**
   * Generates the xml string for the DataFieldForActionButton.
   *
   * @param dataField DataField for action
   * @param action The name of the action
   * @param table The instance of the table building block
   * @returns The xml string for the DataFieldForActionButton
   */
  function getDataFieldButtonForAction(dataField, action, table) {
    var _dataField$ActionTarg6;
    const dataFieldActionContext = table.metaPath.getModel().createBindingContext(action.annotationPath + "/Action");
    const actionContextPath = CommonHelper.getActionContext(dataFieldActionContext);
    const actionContext = table.metaPath.getModel().createBindingContext(actionContextPath);
    const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, table.collection) : undefined;
    const isBound = (_dataField$ActionTarg6 = dataField.ActionTarget) === null || _dataField$ActionTarg6 === void 0 ? void 0 : _dataField$ActionTarg6.isBound;
    const press = action.command ? "cmd:" + action.command : TableHelper.pressEventDataFieldForActionButton({
      contextObjectPath: table.contextObjectPath,
      id: table.id
    }, dataField, table.collectionEntity.name, table.tableDefinition.operationAvailableMap, actionContext.getObject(), action.isNavigable, action.enableAutoScroll, action.defaultValuesExtensionFunction);
    const enabled = action.enabled !== undefined ? action.enabled : TableHelper.isDataFieldForActionEnabled(table.tableDefinition, dataField.Action, !!isBound, actionContext.getObject(), action.enableOnSelect, dataFieldDataModelObjectPath === null || dataFieldDataModelObjectPath === void 0 ? void 0 : dataFieldDataModelObjectPath.targetEntityType);
    return xml`<Button xmlns="sap.m"
					id="${generate([table.id, dataField])}"
					text="${dataField.Label}"
					ariaHasPopup="${isDataModelObjectPathForActionWithDialog(getDataModelObjectPath({}, {
      context: dataFieldActionContext
    }))}"
					press="${press}"
					type="${ButtonType.Transparent}"
					enabled="${enabled}"
					visible="${action.visible}"
				/>`;
  }

  /**
   * Generates the xml string for the DataFieldForIntentBasedNavigation Button.
   *
   * @param dataField DataField for IntentBasedNavigation
   * @param action The name of the action
   * @param table The instance of the table building block
   * @returns The xml string for the DataFieldForIntentBasedNavigation Button
   */
  function getDataFieldButtonForIntentBasedNavigation(dataField, action, table) {
    const dataFieldContext = action.annotationPath ? table.metaPath.getModel().createBindingContext(action.annotationPath) : null;
    return xml`<Button xmlns="sap.m"
					id="${generate([table.id, dataField])}"
					text="${dataField.Label}"
					press="${action.command ? "cmd:" + action.command : CommonHelper.getPressHandlerForDataFieldForIBN(dataFieldContext === null || dataFieldContext === void 0 ? void 0 : dataFieldContext.getObject(), "${internal>selectedContexts}", !table.tableDefinition.enableAnalytics)}"
					type="${ButtonType.Transparent}"
					enabled="${action.enabled !== undefined ? action.enabled : TableHelper.isDataFieldForIBNEnabled({
      collection: table.collection,
      tableDefinition: table.tableDefinition
    }, dataField, dataField.RequiresContext, dataField.NavigationAvailable)}"
					visible="${action.visible}"
					macrodata:IBNData="${!dataField.RequiresContext ? "{semanticObject: '" + dataField.SemanticObject + "' , action : '" + dataField.Action + "'}" : undefined}"
				/>`;
  }

  /**
   * Generates the xml string for the button based on the type of the action.
   *
   * @param action The name of the action
   * @param table The instance of the table building block
   * @returns The xml string for the button
   */
  function getDataFieldButton(action, table) {
    const dataField = action.annotationPath ? table.convertedMetaData.resolvePath(action.annotationPath).target : undefined;
    let template = "";
    if (!dataField) {
      return template;
    }
    switch (action.type) {
      case "ForAction":
        if (isDataFieldForAction(dataField)) {
          var _dataField$ActionTarg7, _dataField$ActionTarg8, _dataField$ActionTarg9, _dataField$ActionTarg10, _dataField$ActionTarg11;
          const isBound = (_dataField$ActionTarg7 = dataField.ActionTarget) === null || _dataField$ActionTarg7 === void 0 ? void 0 : _dataField$ActionTarg7.isBound;
          const isOperationAvailable = ((_dataField$ActionTarg8 = dataField.ActionTarget) === null || _dataField$ActionTarg8 === void 0 ? void 0 : (_dataField$ActionTarg9 = _dataField$ActionTarg8.annotations) === null || _dataField$ActionTarg9 === void 0 ? void 0 : (_dataField$ActionTarg10 = _dataField$ActionTarg9.Core) === null || _dataField$ActionTarg10 === void 0 ? void 0 : (_dataField$ActionTarg11 = _dataField$ActionTarg10.OperationAvailable) === null || _dataField$ActionTarg11 === void 0 ? void 0 : _dataField$ActionTarg11.valueOf()) !== false;
          if (isBound !== true || isOperationAvailable) {
            template += getDataFieldButtonForAction(dataField, action, table);
          }
        }
        break;
      case "ForNavigation":
        if (isDataFieldForIntentBasedNavigation(dataField)) {
          template += getDataFieldButtonForIntentBasedNavigation(dataField, action, table);
        }
        break;
      default:
    }
    return template !== "" ? `<mdcat:ActionToolbarAction
			xmlns="sap.m"
			xmlns:mdcat="sap.ui.mdc.actiontoolbar"
			xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1">
			${template}
			</mdcat:ActionToolbarAction>` : "";
  }

  /**
   * Generates the xml string for the MenuButton control which enables the user to show a hierarchical menu.
   *
   * @param action The name of the action
   * @param table The instance of the table building block
   * @returns The xml string for the MenuButton control
   */
  function getMenuButton(action, table) {
    var _action$menu;
    let xmltemplate = `<mdcat:ActionToolbarAction
						xmlns="sap.m"
						xmlns:mdcat="sap.ui.mdc.actiontoolbar">`;
    const defaultAction = action.defaultAction;
    const dataFieldForDefaultAction = defaultAction !== null && defaultAction !== void 0 && defaultAction.annotationPath ? table.convertedMetaData.resolvePath(defaultAction.annotationPath).target : null;
    const defaultActionContext = defaultAction !== null && defaultAction !== void 0 && defaultAction.annotationPath ? CommonHelper.getActionContext(table.metaPath.getModel().createBindingContext(defaultAction.annotationPath + "/Action")) : null;
    xmltemplate += xml`<MenuButton
						text="${action.text}"
						type="${ButtonType.Transparent}"
						menuPosition="BeginBottom"
						id="${generate([table.id, action.id])}"
						visible="${action.visible}"
						enabled="${action.enabled}"
						useDefaultActionOnly="${DefaultActionHandler.getUseDefaultActionOnly(action)}"
						buttonMode="${DefaultActionHandler.getButtonMode(action)}"
						defaultAction="${DefaultActionHandler.getDefaultActionHandler(table, action, dataFieldForDefaultAction, defaultActionContext, "Table")}"
						>
					<menu>
						<Menu>`;
    (_action$menu = action.menu) === null || _action$menu === void 0 ? void 0 : _action$menu.forEach(menuItemAction => {
      if (typeof menuItemAction !== "string") {
        xmltemplate += getMenuItem(action, menuItemAction, table);
      }
    });
    xmltemplate += `</Menu>
				</menu>
			</MenuButton>
		</mdcat:ActionToolbarAction>`;
    return xmltemplate;
  }

  /**
   * Generates the xml string for the default button.
   *
   * @param action The name of the action
   * @param table The instance of the table building block
   * @returns The xml string for the default button.
   */
  function getDefaultButton(action, table) {
    const actionPress = action.noWrap ? action.press : CommonHelper.buildActionWrapper(action, {
      id: table.id
    });
    return xml`<mdcat:ActionToolbarAction
		xmlns="sap.m"
		xmlns:mdcat="sap.ui.mdc.actiontoolbar">
		<Button
			core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
			id="${generate([table.id, action.id])}"
			text="${action.text}"
			press="${action.command ? "cmd:" + action.command : actionPress}"
			type="${ButtonType.Transparent}"
			visible="${action.visible}"
			enabled="${action.enabled}"
		/>
	</mdcat:ActionToolbarAction>`;
  }

  /**
   * Generates the xml string for an action based on the type of the action.
   *
   * @param action The action to get
   * @param table The instance of the table building block
   * @returns The xml string representation of the action
   */
  function getAction(action, table) {
    switch (action.type) {
      case "Default":
        if ("noWrap" in action) {
          return getDefaultButton(action, table);
        }
        break;
      case "Menu":
        return getMenuButton(action, table);
      default:
    }
    return getDataFieldButton(action, table);
  }

  /**
   * Generates the xml string for the copy action.
   *
   * @param action The copy action
   * @param table The instance of the table building block
   * @returns The xml string representation of the action
   */
  function getCopyAction(action, table) {
    const dataField = action.annotationPath ? table.convertedMetaData.resolvePath(action.annotationPath).target : undefined;
    return xml`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${generate([table.id, dataField])}"
					  text="${action.text}"
					  press="${dataField ? TableHelper.pressEventDataFieldForActionButton({
      contextObjectPath: table.contextObjectPath,
      id: table.id
    }, dataField, table.collectionEntity.name, table.tableDefinition.operationAvailableMap, "${internal>selectedContexts}", action.isNavigable, action.enableAutoScroll, action.defaultValuesExtensionFunction) : undefined}"
					  type="${ButtonType.Transparent}"
					  enabled="${action.enabled}"
					  visible="${action.visible}"
					/>
			</mdcat:ActionToolbarAction>`;
  }

  /**
   * Generates the xml string for the create button.
   *
   * @param standardAction Standard actions to be evaluated
   * @param table The instance of the table building block
   * @returns The xml string for the create button
   */
  function getCreateButton(standardAction, table) {
    const suffixResourceKey = table.collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_CREATE", undefined, suffixResourceKey);
    return xml`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar"
				xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1">
					<Button
						id="${generate([table.id, standardAction.key])}"
						text="${buttonText}"
						press="cmd:Create"
						type="${ButtonType.Transparent}"
						visible="${standardAction.visible}"
						enabled="${standardAction.enabled}"
						macrodata:IBNData="${TableHelper.getIBNData(table.createOutboundDetail)}"
					/>
				</mdcat:ActionToolbarAction>`;
  }
  function getCreateMenu(standardAction, table) {
    const suffixResourceKey = table.collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_CREATE", undefined, suffixResourceKey);
    const values = table.tableDefinition.control.nodeType.values;
    const hasCustomCreateEnablement = table.tableDefinition.control.createEnablement !== undefined;
    let xmlTemplate = `<mdcat:ActionToolbarAction
						xmlns="sap.m"
						xmlns:mdcat="sap.ui.mdc.actiontoolbar">`;
    xmlTemplate += xml`<MenuButton
							text="${buttonText}"
							type="${ButtonType.Transparent}"
							menuPosition="BeginBottom"
							id="${generate([table.id, standardAction.key])}"
							visible="${standardAction.visible}"
							enabled="${standardAction.enabled}"
							>
							<menu>
								<Menu>`;
    values.forEach((allowedValue, index) => {
      const isEnabled = hasCustomCreateEnablement ? notEqual(pathInModel(`createEnablement/Create_${index}`, "internal"), false) : undefined;
      xmlTemplate += xml`<MenuItem
								text="${allowedValue.text}"
								enabled="${isEnabled}"
								press="TableRuntime.onCreateMenuItemPress($event, ${index}, \${internal>selectedContexts})"
							/>`;
    });
    xmlTemplate += `</Menu>
				</menu>
			</MenuButton>
		</mdcat:ActionToolbarAction>`;
    return xmlTemplate;
  }

  /**
   * Generates the xml string for the delete button.
   *
   * @param standardAction Standard actions to be evaluated
   * @param table The instance of the table building block
   * @returns The xml string for the delete button
   */
  function getDeleteButton(standardAction, table) {
    const suffixResourceKey = table.collectionEntity.name;
    const buttonText = table.getTranslatedText("M_COMMON_TABLE_DELETE", undefined, suffixResourceKey);
    return xml`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				<Button
					id="${generate([table.id, standardAction.key])}"
					text="${buttonText}"
					press="cmd:DeleteEntry"
					type="${ButtonType.Transparent}"
					visible="${standardAction.visible}"
					enabled="${standardAction.enabled}"
				/>
			</mdcat:ActionToolbarAction>`;
  }

  /**
   * Generates the xml string for standard actions based on the key of the standard action.
   *
   * @param action The action to template
   * @param table The instance of the table building block
   * @returns The xml string representation of the standard action
   */
  function getStandardAction(action, table) {
    if (action.isTemplated === "false") {
      return "";
    }
    switch (action.key) {
      case StandardActionKeys.Create:
        if (!table.tableDefinition.annotation.isInsertUpdateActionsTemplated) {
          return "";
        } else if (table.tableDefinition.control.nodeType) {
          return getCreateMenu(action, table);
        } else {
          return getCreateButton(action, table);
        }
      case StandardActionKeys.Delete:
        return getDeleteButton(action, table);
      case StandardActionKeys.Cut:
        return getCutButton(action, table);
      case StandardActionKeys.MassEdit:
        if (table.tableDefinition.annotation.isInsertUpdateActionsTemplated) {
          return xml`<mdcat:ActionToolbarAction xmlns="sap.m" xmlns:mdcat="sap.ui.mdc.actiontoolbar">
								<Button
									id="${generate([table.id, action.key])}"
									text="{sap.fe.i18n>M_COMMON_TABLE_MASSEDIT}"
									press="API.onMassEditButtonPressed($event, $controller)"
									visible="${action.visible}"
									enabled="${action.enabled}"
								/>
							</mdcat:ActionToolbarAction>`;
        }
        return "";
      case StandardActionKeys.Insights:
        return xml`<mdcat:ActionToolbarAction xmlns="sap.m" xmlns:mdcat="sap.ui.mdc.actiontoolbar" visible="${action.visible}">
							<Button
								id="${generate([table.id, action.key])}"
								text="{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}"
								press="API.onAddCardToInsightsPressed($event, $controller)"
								visible="${action.visible}"
								enabled="${action.enabled}"
							>
								<layoutData>
									<OverflowToolbarLayoutData priority="AlwaysOverflow" />
								</layoutData>
							</Button>
						</mdcat:ActionToolbarAction>`;
      default:
        return "";
    }
  }

  /**
   * Generates the xml string for standard, annotation, and custom actions of the table.
   *
   * @param table The instance of the table building block
   * @returns The xml string representation of the actions
   */
  function getActions(table) {
    let actionsTemplate = table.tableDefinition.actions.reduce((template, action) => {
      switch (action.type) {
        case ActionType.Standard:
          return template + getStandardAction(action, table);
        case ActionType.Copy:
          return template + getCopyAction(action, table);
        default:
          return template + getAction(action, table);
      }
    }, "");

    //For the TreeTable, the Paste button has been included as an actionToolbaraction, positioned alongside the Cut Button.
    //However, once the Cut button is managed by the MDC table, this code will no longer be required
    actionsTemplate += getPasteButton(table);
    return actionsTemplate;
  }

  /**
   * Generates the xml string for BasicSearch.
   *
   * @param table The instance of the table building block
   * @returns The xml string representation of the BasicSearch
   */
  function getBasicSearch(table) {
    if (table.useBasicSearch) {
      return xml`<mdcat:ActionToolbarAction xmlns:mdcat="sap.ui.mdc.actiontoolbar" xmlns:macroTable="sap.fe.macros.table">
						<macroTable:BasicSearch id="${table.filterBarId}" useDraftEditState="${table._collectionIsDraftEnabled}"/>
					</mdcat:ActionToolbarAction>`;
    }
    return "";
  }

  /**
   * Generates the xml string for TableFullScreenDialog.
   *
   * @param table The instance of the table building block
   * @returns The xml string representation of the TableFullScreenDialog
   */
  function getFullScreen(table) {
    if (table.enableFullScreen) {
      return xml`<mdcat:ActionToolbarAction xmlns:mdcat="sap.ui.mdc.actiontoolbar" xmlns:macroTable="sap.fe.macros.table">
						<macroTable:TableFullScreenDialog id="${generate([table.id, "StandardAction", "FullScreen"])}" />
					</mdcat:ActionToolbarAction>`;
    }
    return "";
  }

  /**
   * Generates the XML string for the Cut Button.
   *
   * @param action The instance of the standardAction
   * @param table The instance of the table building block
   * @returns The XML string representation of the Cut Button
   */
  function getCutButton(action, table) {
    return xml`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${generate([table.id, "Cut"])}"
					  text="{sap.fe.i18n>M_TABLE_CUT}"
					  press="cmd:Cut"
					  visible="${action.visible}"
					  enabled="${action.enabled}"
					/>
			</mdcat:ActionToolbarAction>`;
  }

  /**
   * Generates the XML string for the Paste Button.
   *
   * @param table The instance of the table building block
   * @returns The XML string representation of the Paste Button
   */
  function getPasteButton(table) {
    if (table.tableType === "TreeTable") {
      return xml`<mdcat:ActionToolbarAction
				xmlns="sap.m"
				xmlns:mdcat="sap.ui.mdc.actiontoolbar">
				  <Button
					  id="${generate([table.id, "Paste"])}"
					  text="{sap.fe.i18n>M_PASTE}"
					  press="cmd:Paste"
					  visible="${table.pasteVisible}"
					  enabled="${table.enablePaste}"
					/>
			</mdcat:ActionToolbarAction>`;
    }
    return "";
  }

  /**
   * Generates the XML string for actions.
   *
   * @param table The instance of the table building block
   * @returns The XML string representation of the actions
   */
  function getTableActionTemplate(table) {
    return getBasicSearch(table) + getActions(table) + getFullScreen(table);
  }
  _exports.getTableActionTemplate = getTableActionTemplate;
  return _exports;
}, false);
