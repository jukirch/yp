import Log from "sap/base/Log";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import CommonUtils from "sap/fe/core/CommonUtils";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import deleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import FELibrary from "sap/fe/core/library";
import FieldRuntime from "sap/fe/macros/field/FieldRuntime";
import TableHelper from "sap/fe/macros/table/TableHelper";
import TableUtils from "sap/fe/macros/table/Utils";
import type Button from "sap/m/Button";
import type UI5Event from "sap/ui/base/Event";
import type UI5Element from "sap/ui/core/Element";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type TableAPI from "./TableAPI";

const CreationMode = FELibrary.CreationMode;
/**
 * Static class used by Table building block during runtime
 *
 * @private
 * @experimental This module is only for internal/experimental use!
 */
const TableRuntime = {
	displayTableSettings: function (oEvent: any) {
		/*
				 Temporary solution
				 Wait for mdc Table to provide public api to either get button 'Settings' or fire event on this button
				 */
		const oParent = oEvent.getSource().getParent(),
			oSettingsButton = sap.ui.getCore().byId(`${oParent.getId()}-settings`);
		CommonUtils.fireButtonPress(oSettingsButton as Button);
	},
	executeConditionalActionShortcut: function (sButtonMatcher: any, oSource: any) {
		// Get the button related to keyboard shortcut
		const oMdcTable = oSource.getParent();
		if (sButtonMatcher !== CreationMode.CreationRow) {
			const oButton = oMdcTable
				.getActions()
				.reduce(function (aActionButtons: any, oActionToolbarAction: any) {
					return aActionButtons.concat(oActionToolbarAction.getAction());
				}, [])
				.find(function (oActionButton: any) {
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

	setContexts: function (
		oTable: Table,
		sDeletablePath: string,
		draft: string,
		sCollection: string,
		sNavigationAvailableMap: string,
		sActionsMultiselectDisabled: string,
		sUpdatablePath: string
	) {
		BusyLocker.lock(oTable);
		return TableRuntime.setContextsAsync(
			oTable,
			sDeletablePath,
			draft,
			sCollection,
			sNavigationAvailableMap,
			sActionsMultiselectDisabled,
			sUpdatablePath
		)
			.then(() => {
				Log.info("Selections updated");
				return;
			})
			.catch((error) => {
				Log.error(error);
			})
			.finally(() => {
				BusyLocker.unlock(oTable);
			});
	},

	setContextsAsync: async function (
		table: Table,
		sDeletablePath: string,
		draft: string,
		sCollection: string,
		sNavigationAvailableMap: string,
		sActionsMultiselectDisabled: string,
		sUpdatablePath: string
	): Promise<void[] | undefined> {
		const aActionsMultiselectDisabled = sActionsMultiselectDisabled ? sActionsMultiselectDisabled.split(",") : [];
		const oActionOperationAvailableMap = JSON.parse(sCollection);
		const oNavigationAvailableMap =
			sNavigationAvailableMap && sNavigationAvailableMap !== "undefined" && JSON.parse(sNavigationAvailableMap);
		let aSelectedContexts = table.getSelectedContexts() as Context[];
		const aDeletableContexts: Context[] = [];
		const bReadOnlyDraftEnabled = table.data("displayModePropertyBinding") === "true" && draft !== "undefined";
		const aUpdatableContexts: Context[] = [];
		// oDynamicActions are bound actions that are available according to some property
		// in each item
		const oDynamicActions: Record<string, unknown> | undefined = {};
		const oIBN = {};
		const oInternalModelContext = table.getBindingContext("internal") as InternalModelContext;

		if (!oInternalModelContext) {
			return;
		}
		//do not consider empty rows as selected context
		aSelectedContexts = aSelectedContexts.filter(function (oContext: Context) {
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
			semanticKeyHasDraftIndicator: oInternalModelContext.getProperty("semanticKeyHasDraftIndicator")
				? oInternalModelContext.getProperty("semanticKeyHasDraftIndicator")
				: undefined
		});

		for (const oSelectedContext of aSelectedContexts) {
			const oContextData = oSelectedContext.getObject();
			for (const key in oContextData) {
				if (key.indexOf("#") === 0) {
					let sActionPath: string = key;
					sActionPath = sActionPath.substring(1, sActionPath.length);
					oModelObject.dynamicActions[sActionPath] = { enabled: true };
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
		const tableAPI = table.getParent() as TableAPI;
		if (aSelectedContexts.length <= 1 && tableAPI.tableDefinition.control.createEnablement) {
			const parentContext = aSelectedContexts.length ? aSelectedContexts[0] : undefined;
			this._updateCreateEnablement(
				oInternalModelContext,
				tableAPI.tableDefinition.control.createEnablement,
				table,
				parentContext,
				tableAPI.tableDefinition.control.nodeType
			);
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
	updateCutPasteEnablement: function (modelObject: { [key: string]: unknown }, table: Table): void {
		const isNodeMovableFunction = (table.getParent() as TableAPI).getTableDefinition().control.isNodeMovable;
		modelObject["cutableContexts"] = (
			isNodeMovableFunction
				? (modelObject["updatableContexts"] as Context[] | undefined)?.filter((context: Context) =>
						(
							FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
								isNodeMovableFunction.moduleName,
								isNodeMovableFunction.methodName,
								table
							) as Function
						)(context)
				  )
				: (modelObject["updatableContexts"] as Context[] | undefined)
		)?.map((context) => context.getPath());

		const isMoveToPositionAllowedFunction = (table.getParent() as TableAPI).getTableDefinition().control.isMoveToPositionAllowed;
		if (isMoveToPositionAllowedFunction && (modelObject.numberOfSelectedContexts as number) === 1) {
			if (
				!(
					FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
						isMoveToPositionAllowedFunction.moduleName,
						isMoveToPositionAllowedFunction.methodName,
						table
					) as Function
				)(null, (modelObject.selectedContexts as Context[])[0])
			) {
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
	_updateCreateEnablement: function (
		internalContext: InternalModelContext,
		createEnablementCallback: { moduleName: string; methodName: string },
		table: Table,
		parentContext?: Context,
		nodeTypeParameters?: { propertyName: string; values: { value: string }[] }
	): void {
		let possibleValues: (string | undefined)[];
		if (nodeTypeParameters !== undefined) {
			// Push all possible values in the menu
			possibleValues = nodeTypeParameters.values.map((option) => option.value);
		} else {
			// No menu --> Only 'undefined' value that corresponds to the 'Create' button
			possibleValues = [undefined];
		}

		const enablementFunction = FPMHelper.getCustomFunction<(nodeType?: string, parentContext?: Context) => boolean>(
			createEnablementCallback.moduleName,
			createEnablementCallback.methodName,
			table
		);

		if (!enablementFunction) {
			return;
		}
		const enabledFlags = possibleValues.map((value) => {
			let enabled = false;
			try {
				enabled = !!(enablementFunction(value, parentContext) ?? true);
			} catch (_error) {
				enabled = true;
			}
			return enabled;
		});
		// enableFlags[i] is true <=> possibleValues[i] is allowed for creation

		const enablementMap: Record<string, boolean> = {};
		enablementMap["Create"] = enabledFlags.some((flag) => flag); // Enable the Menu (or the button) if at least one option is possible
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
	clearSelection: function (table: Table): void {
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
		const tableAPI = table.getParent() as TableAPI;
		if (tableAPI.tableDefinition.control.createEnablement) {
			this._updateCreateEnablement(
				internalModelContext as InternalModelContext,
				tableAPI.tableDefinition.control.createEnablement,
				table,
				undefined,
				tableAPI.tableDefinition.control.nodeType
			);
		}
	},

	disableAction: function (aActionsMultiselectDisabled: any, oDynamicActions: any) {
		aActionsMultiselectDisabled.forEach(function (sAction: any) {
			oDynamicActions[sAction] = { bEnabled: false };
		});
	},
	onFieldChangeInCreationRow: function (oEvent: any, oCustomValidationFunction: any) {
		// CREATION ROW CASE
		const mField = FieldRuntime.getFieldStateOnChange(oEvent),
			oSourceField = mField.field,
			sFieldId = oSourceField.getId();

		const oInternalModelContext = oSourceField.getBindingContext("internal") as InternalModelContext,
			mFieldValidity = oInternalModelContext.getProperty("creationRowFieldValidity"),
			mNewFieldValidity = Object.assign({}, mFieldValidity);

		mNewFieldValidity[sFieldId] = mField.state;
		oInternalModelContext.setProperty("creationRowFieldValidity", mNewFieldValidity);

		// prepare Custom Validation
		if (oCustomValidationFunction) {
			const mCustomValidity = oInternalModelContext.getProperty("creationRowCustomValidity"),
				mNewCustomValidity = Object.assign({}, mCustomValidity);
			mNewCustomValidity[oSourceField.getBinding("value")!.getPath()] = {
				fieldId: oSourceField.getId()
			};
			oInternalModelContext.setProperty("creationRowCustomValidity", mNewCustomValidity);
			// Remove existing CustomValidation message
			const oMessageManager = sap.ui.getCore().getMessageManager();
			const sTarget = `${oSourceField.getBindingContext()?.getPath()}/${oSourceField.getBindingPath("value")}`;
			oMessageManager
				.getMessageModel()
				.getData()
				.forEach(function (oMessage: any) {
					if (oMessage.target === sTarget) {
						oMessageManager.removeMessages(oMessage);
					}
				});
		}
	},
	onTreeTableContextChanged: function (table: Table, initialExpansionLevel?: number) {
		// When the context of a TreeTable changes, we want to restore its expansion state to the default:
		//   - all expanded if there's a search parameter coming from the filterBar
		//   - otherwise initial expansion state coming from the PV (stored in the payload)
		//   - otherwise no expansion at all

		const rowBinding = table.getRowBinding() as ODataListBinding;
		if (!rowBinding.getContext()) {
			return;
		}

		const aggregation = (rowBinding as any).getAggregation() ?? {};
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
	onCreateMenuItemPress: function (event: UI5Event, valueIndex: number, selectedContexts: Context[]): void {
		const mdcTable = FPMHelper.getMdcTable(event.getSource() as UI5Element);
		const tableAPI = mdcTable?.getParent() as TableAPI | undefined;

		// Some checks to be on the safe side
		if (!tableAPI) {
			return;
		}
		const nodeType = tableAPI.tableDefinition.control.nodeType;
		if (!nodeType) {
			return;
		}

		const view = CommonUtils.getTargetView(tableAPI);
		const creationData: Record<string, string> = {};
		creationData[nodeType.propertyName] = nodeType.values[valueIndex].value;
		view.getController()
			.editFlow.createDocument(mdcTable!.getRowBinding(), {
				selectedContexts,
				creationMode: tableAPI.tableDefinition.control.creationMode,
				data: creationData,
				tableId: mdcTable?.getId()
			})
			.catch((error) => {
				Log.error(`Failed to create new document: ${error}`);
			});
	}
};

export default TableRuntime;
