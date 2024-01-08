/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/library", "sap/fe/macros/field/FieldRuntime", "sap/fe/macros/table/TableHelper", "sap/fe/macros/table/Utils"], function (Log, ActionRuntime, CommonUtils, BusyLocker, deleteHelper, FPMHelper, FELibrary, FieldRuntime, TableHelper, TableUtils) {
  "use strict";

  const CreationMode = FELibrary.CreationMode;
  /**
   * Static class used by Table building block during runtime
   *
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const TableRuntime = {
    displayTableSettings: function (oEvent) {
      /*
      		 Temporary solution
      		 Wait for mdc Table to provide public api to either get button 'Settings' or fire event on this button
      		 */
      const oParent = oEvent.getSource().getParent(),
        oSettingsButton = sap.ui.getCore().byId(`${oParent.getId()}-settings`);
      CommonUtils.fireButtonPress(oSettingsButton);
    },
    executeConditionalActionShortcut: function (sButtonMatcher, oSource) {
      // Get the button related to keyboard shortcut
      const oMdcTable = oSource.getParent();
      if (sButtonMatcher !== CreationMode.CreationRow) {
        const oButton = oMdcTable.getActions().reduce(function (aActionButtons, oActionToolbarAction) {
          return aActionButtons.concat(oActionToolbarAction.getAction());
        }, []).find(function (oActionButton) {
          return oActionButton.getId().endsWith(sButtonMatcher);
        });
        CommonUtils.fireButtonPress(oButton);
      } else {
        const oCreationRow = oMdcTable.getAggregation("creationRow");
        if (oCreationRow && oCreationRow.getApplyEnabled() && oCreationRow.getVisible()) {
          oCreationRow.fireApply();
        }
      }
    },
    setContexts: function (oTable, sDeletablePath, draft, sCollection, sNavigationAvailableMap, sActionsMultiselectDisabled, sUpdatablePath) {
      BusyLocker.lock(oTable);
      return TableRuntime.setContextsAsync(oTable, sDeletablePath, draft, sCollection, sNavigationAvailableMap, sActionsMultiselectDisabled, sUpdatablePath).then(() => {
        Log.info("Selections updated");
        return;
      }).catch(error => {
        Log.error(error);
      }).finally(() => {
        BusyLocker.unlock(oTable);
      });
    },
    setContextsAsync: async function (table, sDeletablePath, draft, sCollection, sNavigationAvailableMap, sActionsMultiselectDisabled, sUpdatablePath) {
      const aActionsMultiselectDisabled = sActionsMultiselectDisabled ? sActionsMultiselectDisabled.split(",") : [];
      const oActionOperationAvailableMap = JSON.parse(sCollection);
      const oNavigationAvailableMap = sNavigationAvailableMap && sNavigationAvailableMap !== "undefined" && JSON.parse(sNavigationAvailableMap);
      let aSelectedContexts = table.getSelectedContexts();
      const aDeletableContexts = [];
      const bReadOnlyDraftEnabled = table.data("displayModePropertyBinding") === "true" && draft !== "undefined";
      const aUpdatableContexts = [];
      // oDynamicActions are bound actions that are available according to some property
      // in each item
      const oDynamicActions = {};
      const oIBN = {};
      const oInternalModelContext = table.getBindingContext("internal");
      if (!oInternalModelContext) {
        return;
      }
      //do not consider empty rows as selected context
      aSelectedContexts = aSelectedContexts.filter(function (oContext) {
        return !oContext.isInactive();
      });
      const oModelObject = Object.assign(oInternalModelContext.getObject() || {}, {
        selectedContexts: aSelectedContexts,
        numberOfSelectedContexts: aSelectedContexts.length,
        dynamicActions: oDynamicActions,
        ibn: oIBN,
        deleteEnabled: true,
        deletableContexts: aDeletableContexts,
        unSavedContexts: [],
        lockedContexts: [],
        draftsWithNonDeletableActive: [],
        draftsWithDeletableActive: [],
        controlId: "",
        updatableContexts: aUpdatableContexts,
        pasteAuthorized: true,
        cutableContext: [],
        semanticKeyHasDraftIndicator: oInternalModelContext.getProperty("semanticKeyHasDraftIndicator") ? oInternalModelContext.getProperty("semanticKeyHasDraftIndicator") : undefined
      });
      for (const oSelectedContext of aSelectedContexts) {
        const oContextData = oSelectedContext.getObject();
        for (const key in oContextData) {
          if (key.indexOf("#") === 0) {
            let sActionPath = key;
            sActionPath = sActionPath.substring(1, sActionPath.length);
            oModelObject.dynamicActions[sActionPath] = {
              enabled: true
            };
            oInternalModelContext.setProperty("", oModelObject);
          }
        }
        // The updatable contexts with mass edit depend on the following:
        // 1. Update is dependendent on current entity property (sUpdatablePath).
        // 2. The table is read only and draft enabled(like LR), in this case only active contexts can be mass edited(not draft contexts).
        //    So, update depends on 'IsActiveEntity' value which needs to be checked.
        const bUpdatableByPath = sUpdatablePath.length === 0 || !!oSelectedContext.getProperty(sUpdatablePath);
        const bNotDraftInReadOnlyMode = !bReadOnlyDraftEnabled || oContextData.IsActiveEntity;
        if (bUpdatableByPath && bNotDraftInReadOnlyMode) {
          aUpdatableContexts.push(oSelectedContext);
        }
      }
      deleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);
      if (!table.data("enableAnalytics")) {
        TableHelper.setIBNEnablement(oInternalModelContext, oNavigationAvailableMap, aSelectedContexts);
      }
      if (aSelectedContexts.length > 1) {
        this.disableAction(aActionsMultiselectDisabled, oDynamicActions);
      }
      if (oModelObject) {
        oModelObject["updatableContexts"] = aUpdatableContexts;
        oModelObject["controlId"] = table.getId();
        oInternalModelContext.setProperty("", oModelObject);
      }

      // Manage a potential callback to enable/disable the create button/menu for a TreeTable
      const tableAPI = table.getParent();
      if (aSelectedContexts.length <= 1 && tableAPI.tableDefinition.control.createEnablement) {
        const parentContext = aSelectedContexts.length ? aSelectedContexts[0] : undefined;
        this._updateCreateEnablement(oInternalModelContext, tableAPI.tableDefinition.control.createEnablement, table, parentContext, tableAPI.tableDefinition.control.nodeType);
      }
      this.updateCutPasteEnablement(oModelObject, table);
      return ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, "table");
    },
    /**
     * Updates the internal context to enable/disable the Cut and Paste buttons.
     *
     * @param modelObject Internal context object of the table
     * @param table Instance of the Table
     */
    updateCutPasteEnablement: function (modelObject, table) {
      var _ref, _modelObject$updatabl;
      const isNodeMovableFunction = table.getParent().getTableDefinition().control.isNodeMovable;
      modelObject["cutableContexts"] = (_ref = isNodeMovableFunction ? (_modelObject$updatabl = modelObject["updatableContexts"]) === null || _modelObject$updatabl === void 0 ? void 0 : _modelObject$updatabl.filter(context => FPMHelper.getCustomFunction(isNodeMovableFunction.moduleName, isNodeMovableFunction.methodName, table)(context)) : modelObject["updatableContexts"]) === null || _ref === void 0 ? void 0 : _ref.map(context => context.getPath());
      const isMoveToPositionAllowedFunction = table.getParent().getTableDefinition().control.isMoveToPositionAllowed;
      if (isMoveToPositionAllowedFunction && modelObject.numberOfSelectedContexts === 1) {
        if (!FPMHelper.getCustomFunction(isMoveToPositionAllowedFunction.moduleName, isMoveToPositionAllowedFunction.methodName, table)(null, modelObject.selectedContexts[0])) {
          modelObject.pasteAuthorized = false;
        }
      }
    },
    /**
     * Updates the internal context to enable/disable the Create button / menu / menu items.
     *
     * @param internalContext
     * @param createEnablementCallback
     * @param createEnablementCallback.moduleName
     * @param createEnablementCallback.methodName
     * @param table
     * @param parentContext
     * @param nodeTypeParameters
     * @param nodeTypeParameters.propertyName
     * @param nodeTypeParameters.values
     */
    _updateCreateEnablement: function (internalContext, createEnablementCallback, table, parentContext, nodeTypeParameters) {
      let possibleValues;
      if (nodeTypeParameters !== undefined) {
        // Push all possible values in the menu
        possibleValues = nodeTypeParameters.values.map(option => option.value);
      } else {
        // No menu --> Only 'undefined' value that corresponds to the 'Create' button
        possibleValues = [undefined];
      }
      const enablementFunction = FPMHelper.getCustomFunction(createEnablementCallback.moduleName, createEnablementCallback.methodName, table);
      if (!enablementFunction) {
        return;
      }
      const enabledFlags = possibleValues.map(value => {
        let enabled = false;
        try {
          enabled = !!(enablementFunction(value, parentContext) ?? true);
        } catch (_error) {
          enabled = true;
        }
        return enabled;
      });
      // enableFlags[i] is true <=> possibleValues[i] is allowed for creation

      const enablementMap = {};
      enablementMap["Create"] = enabledFlags.some(flag => flag); // Enable the Menu (or the button) if at least one option is possible
      enabledFlags.forEach((enabled, index) => {
        enablementMap[`Create_${index}`] = enabled;
      });
      internalContext.setProperty("createEnablement", enablementMap);
    },
    /**
     * Clears the table selection, and enables/disables the 'Create' button/menu if necessary.
     *
     * @param table The table
     */
    clearSelection: function (table) {
      // Clear the selection in the control
      table.clearSelection();

      // Update the selection-related information in the internal model
      const internalModelContext = table.getBindingContext("internal");
      if (internalModelContext) {
        internalModelContext.setProperty("deleteEnabled", false);
        internalModelContext.setProperty("numberOfSelectedContexts", 0);
        internalModelContext.setProperty("selectedContexts", []);
        internalModelContext.setProperty("deletableContexts", []);
      }

      // Enable/disable the 'Create' button/menu if necessary
      const tableAPI = table.getParent();
      if (tableAPI.tableDefinition.control.createEnablement) {
        this._updateCreateEnablement(internalModelContext, tableAPI.tableDefinition.control.createEnablement, table, undefined, tableAPI.tableDefinition.control.nodeType);
      }
    },
    disableAction: function (aActionsMultiselectDisabled, oDynamicActions) {
      aActionsMultiselectDisabled.forEach(function (sAction) {
        oDynamicActions[sAction] = {
          bEnabled: false
        };
      });
    },
    onFieldChangeInCreationRow: function (oEvent, oCustomValidationFunction) {
      // CREATION ROW CASE
      const mField = FieldRuntime.getFieldStateOnChange(oEvent),
        oSourceField = mField.field,
        sFieldId = oSourceField.getId();
      const oInternalModelContext = oSourceField.getBindingContext("internal"),
        mFieldValidity = oInternalModelContext.getProperty("creationRowFieldValidity"),
        mNewFieldValidity = Object.assign({}, mFieldValidity);
      mNewFieldValidity[sFieldId] = mField.state;
      oInternalModelContext.setProperty("creationRowFieldValidity", mNewFieldValidity);

      // prepare Custom Validation
      if (oCustomValidationFunction) {
        var _oSourceField$getBind;
        const mCustomValidity = oInternalModelContext.getProperty("creationRowCustomValidity"),
          mNewCustomValidity = Object.assign({}, mCustomValidity);
        mNewCustomValidity[oSourceField.getBinding("value").getPath()] = {
          fieldId: oSourceField.getId()
        };
        oInternalModelContext.setProperty("creationRowCustomValidity", mNewCustomValidity);
        // Remove existing CustomValidation message
        const oMessageManager = sap.ui.getCore().getMessageManager();
        const sTarget = `${(_oSourceField$getBind = oSourceField.getBindingContext()) === null || _oSourceField$getBind === void 0 ? void 0 : _oSourceField$getBind.getPath()}/${oSourceField.getBindingPath("value")}`;
        oMessageManager.getMessageModel().getData().forEach(function (oMessage) {
          if (oMessage.target === sTarget) {
            oMessageManager.removeMessages(oMessage);
          }
        });
      }
    },
    onTreeTableContextChanged: function (table, initialExpansionLevel) {
      // When the context of a TreeTable changes, we want to restore its expansion state to the default:
      //   - all expanded if there's a search parameter coming from the filterBar
      //   - otherwise initial expansion state coming from the PV (stored in the payload)
      //   - otherwise no expansion at all

      const rowBinding = table.getRowBinding();
      if (!rowBinding.getContext()) {
        return;
      }
      const aggregation = rowBinding.getAggregation() ?? {};
      const filterInfo = TableUtils.getAllFilterInfo(table);
      aggregation.expandTo = filterInfo.search ? 100 : initialExpansionLevel;
      rowBinding.setAggregation(aggregation);
    },
    /**
     * Called when an item in a 'Create' menu is clicked. It creates a document with the corresponding initial data.
     *
     * @param event
     * @param valueIndex The index of the item in the menu
     * @param selectedContexts The selected contexts in the table for this 'Create' menu
     */
    onCreateMenuItemPress: function (event, valueIndex, selectedContexts) {
      const mdcTable = FPMHelper.getMdcTable(event.getSource());
      const tableAPI = mdcTable === null || mdcTable === void 0 ? void 0 : mdcTable.getParent();

      // Some checks to be on the safe side
      if (!tableAPI) {
        return;
      }
      const nodeType = tableAPI.tableDefinition.control.nodeType;
      if (!nodeType) {
        return;
      }
      const view = CommonUtils.getTargetView(tableAPI);
      const creationData = {};
      creationData[nodeType.propertyName] = nodeType.values[valueIndex].value;
      view.getController().editFlow.createDocument(mdcTable.getRowBinding(), {
        selectedContexts,
        creationMode: tableAPI.tableDefinition.control.creationMode,
        data: creationData,
        tableId: mdcTable === null || mdcTable === void 0 ? void 0 : mdcTable.getId()
      }).catch(error => {
        Log.error(`Failed to create new document: ${error}`);
      });
    }
  };
  return TableRuntime;
}, false);
