import type { EntityType } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import { controllerExtensionHandler } from "sap/fe/core/controllerextensions/HookSupport";
import ActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import NotApplicableContextDialog from "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import type { HorizontalAlign } from "sap/fe/core/converters/ManifestSettings";
import { CreationMode } from "sap/fe/core/converters/ManifestSettings";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import type { AnnotationTableColumn, ColumnExportSettings, TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { aggregation, defineUI5Class, event, property, xmlEventHandler } from "sap/fe/core/helpers/ClassSupport";
import DeleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import PasteHelper from "sap/fe/core/helpers/PasteHelper";
import ResourceModelHelper, { getLocalizedText, getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import SemanticDateOperators from "sap/fe/core/helpers/SemanticDateOperators";
import type { WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import * as InsightsService from "sap/fe/macros/insights/InsightsService";
import * as TableInsightsHelper from "sap/fe/macros/insights/TableInsightsHelper";
import TableUtils from "sap/fe/macros/table/Utils";
import type { CardManifest, CardMessage } from "sap/insights/CardHelper";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type SegmentedButton from "sap/m/SegmentedButton";
import type Select from "sap/m/Select";
import type DataStateIndicator from "sap/m/plugins/DataStateIndicator";
import type { DataStateIndicator$DataStateChangeEvent } from "sap/m/plugins/DataStateIndicator";
import type { PasteProvider$PasteEvent } from "sap/m/plugins/PasteProvider";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import type UI5Element from "sap/ui/core/Element";
import type Item from "sap/ui/core/Item";
import type DragDropInfo from "sap/ui/core/dnd/DragDropInfo";
import { MessageType } from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import type Controller from "sap/ui/core/mvc/Controller";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Table from "sap/ui/mdc/Table";
import type { Table$BeforeExportEvent } from "sap/ui/mdc/Table";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type MDCColumn from "sap/ui/mdc/table/Column";
import Filter from "sap/ui/model/Filter";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type { ContextErrorType } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import MacroAPI from "../MacroAPI";
import type FilterBarAPI from "../filterBar/FilterBarAPI";
import { hasInsightActionEnabled, showGenericErrorMessage } from "../insights/CommonInsightsHelper";
import type { InsightsParams, TableContent } from "../insights/InsightsService";
import TableHelper from "./TableHelper";

/**
 * Create options for the table.
 *
 * @alias sap.fe.macros.table.TableCreationOptions
 * @public
 */
export type TableCreationOptions = {
	/**
	 * Defines the creation mode to be used by the table.
	 *
	 * Allowed values are `NewPage`, `Inline`, `InlineCreationsRows` or `External`.<br/>
	 * <br/>
	 * NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async' or 'Deferred' is used<br/>
	 * Inline - The creation is done inline<br/>
	 * InlineCreationsRows - The creation is done inline with an empty row<br/>
	 * External - The creation is done in a different application specified via the parameter 'outbound'
	 *
	 * If not set with any value:<br/>
	 * if navigation is defined, the default value is 'NewPage'. Otherwise it is 'Inline'.
	 *
	 * @public
	 */
	name?: "NewPage" | "Inline" | "InlineCreationRows" | "External";

	/**
	 * Specifies if the new entry should be created at the top or bottom of a table in case of creationMode 'Inline'<br/>
	 * The default value is 'false'
	 *
	 * @public
	 */
	createAtEnd?: boolean;

	/**
	 * Specifies if the new entry should be hidden in case of creationMode 'InlineCreationRows'. This only applies to responsive tables.<br/>
	 * The default value is 'false'
	 *
	 * @public
	 */
	inlineCreationRowsHiddenInEditMode?: boolean;

	/**
	 * The navigation target where the document is created in case of creationMode 'External'<br/>
	 *
	 * @public
	 */
	outbound?: string;
};

/**
 * Definition of a custom action to be used inside the table toolbar
 *
 * @alias sap.fe.macros.table.Action
 * @public
 */
export type Action = {
	/**
	 * Unique identifier of the action
	 *
	 * @public
	 */
	key: string;

	/**
	 * The text that will be displayed for this action
	 *
	 * @public
	 */
	text: string;
	/**
	 * Reference to the key of another action already displayed in the toolbar to properly place this one
	 *
	 * @public
	 */
	anchor?: string;
	/**
	 * Defines where this action should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 *
	 * @public
	 */
	placement?: "Before" | "After";

	/**
	 * Event handler to be called when the user chooses the action
	 *
	 * @public
	 */
	press: string;

	/**
	 * Defines if the action requires a selection.
	 *
	 * @public
	 */
	requiresSelection?: boolean;

	/**
	 * Enables or disables the action
	 *
	 * @public
	 */
	enabled?: boolean;
};

/**
 * Definition of a custom ActionGroup to be used inside the table toolbar
 *
 * @alias sap.fe.macros.table.ActionGroup
 * @public
 */
export type ActionGroup = {
	/**
	 * Unique identifier of the ActionGroup
	 *
	 * @public
	 */
	key: string;

	/**
	 * Defines nested actions
	 *
	 * @public
	 */
	actions: Action[];

	/**
	 * The text that will be displayed for this action group
	 *
	 * @public
	 */
	text: string;

	/**
	 * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
	 *
	 * @public
	 */
	anchor?: string;

	/**
	 * Defines where this action group should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 *
	 * @public
	 */
	placement?: "Before" | "After";
};

/**
 * Definition of a custom column to be used inside the table.
 *
 * The template for the column has to be provided as the default aggregation
 *
 * @alias sap.fe.macros.table.Column
 * @public
 */
export type Column = {
	/**
	 * Unique identifier of the column
	 *
	 * @public
	 */
	key: string;

	/**
	 * The text that will be displayed for this column header
	 *
	 * @public
	 */
	header: string;

	/**
	 * Defines the column's width.
	 *
	 * Allowed values are `auto`, `value` and `inherit` according to {@link sap.ui.core.CSSSize}
	 *
	 * @public
	 */
	width?: string;

	/**
	 * Defines the column importance.
	 *
	 * You can define which columns should be automatically moved to the pop-in area based on their importance
	 *
	 * @public
	 */
	importance?: string;

	/**
	 * Aligns the header as well as the content horizontally
	 *
	 * @public
	 */
	horizontalAlign?: HorizontalAlign;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 *
	 * @public
	 */
	widthIncludingColumnHeader?: boolean;

	/**
	 * Reference to the key of another column already displayed in the table to properly place this one
	 *
	 * @public
	 */
	anchor?: string;

	/**
	 * Defines where this column should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 *
	 * @public
	 */
	placement?: "Before" | "After";
};

type ExportColumn = ColumnExportSettings & {
	property: string | Array<string>;
	label: string;
	columnId?: string;
	width?: number;
	textAlign?: string;
	displayUnit?: boolean;
	trueValue?: string;
	falseValue?: string;
	valueMap?: string;
};

type UserExportSettings = {
	splitCells?: boolean;
};
export type ExportSettings = {
	fileType?: string;
	dataSource: {
		sizeLimit?: number;
	};
	workbook: {
		columns: ExportColumn[];
	};
};

/**
 * Building block used to create a table based on the metadata provided by OData V4.
 * <br>
 * Usually, a LineItem or PresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macro:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
 * </pre>
 *
 * @alias sap.fe.macros.Table
 * @public
 */
@defineUI5Class("sap.fe.macros.table.TableAPI", { returnTypes: ["sap.fe.macros.MacroAPI"] })
class TableAPI extends MacroAPI {
	creatingEmptyRows?: boolean;

	content!: Table;

	fetchedContextPaths: string[] = [];
	constructor(mSettings?: PropertiesOf<TableAPI>, ...others: any[]) {
		super(mSettings as any, ...others);

		this.updateFilterBar();

		if (this.content) {
			this.content.attachEvent("selectionChange", {}, this.onTableSelectionChange, this);
		}
	}

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 *
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: [
			"com.sap.vocabularies.UI.v1.LineItem",
			"com.sap.vocabularies.UI.v1.PresentationVariant",
			"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"
		]
	})
	metaPath!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 *
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	contextPath!: string;

	@property({ type: "object" })
	tableDefinition!: TableVisualization;

	@property({ type: "string" })
	entityTypeFullyQualifiedName!: string;

	/**
	 * An expression that allows you to control the 'read-only' state of the table.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 *
	 * @public
	 */
	@property({ type: "boolean" })
	readOnly!: boolean;

	/**
	 * The identifier of the table control.
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * An expression that allows you to control the 'busy' state of the table.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	busy!: boolean;

	/**
	 * Defines the type of table that will be used by the building block to render the data.
	 *
	 * Allowed values are `GridTable` and `ResponsiveTable`
	 *
	 * @public
	 */
	@property({ type: "string", defaultValue: "ResponsiveTable", allowedValues: ["GridTable", "ResponsiveTable"] })
	type!: string;

	/**
	 * Controls if the export functionality of the table is enabled or not.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	enableExport!: boolean;

	/**
	 * Controls if the paste functionality of the table is enabled or not.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	enablePaste!: boolean;

	/**
	 * Controls whether the table can be opened in fullscreen mode or not.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	enableFullScreen!: boolean;

	/**
	 * ID of the FilterBar building block associated with the table.
	 *
	 * @public
	 */
	@property({ type: "string" })
	filterBar?: string;

	/**
	 * Defines the selection mode to be used by the table.
	 *
	 * Allowed values are `None`, `Single`, `ForceSingle`, `Multi`, `ForceMulti` or `Auto`.
	 * If set to 'Single', 'Multi' or 'Auto', SAP Fiori elements hooks into the standard lifecycle to determine the consistent selection mode.
	 * If set to 'ForceSingle' or 'ForceMulti' your choice will be respected but this might not respect the Fiori guidelines.
	 *
	 * @public
	 */
	@property({ type: "string", allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"] })
	selectionMode!: string;

	/**
	 * Specifies the header text that is shown in the table.
	 *
	 * @public
	 */
	@property({ type: "string" })
	header!: string;

	/**
	 * Specifies if the column width is automatically calculated.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	enableAutoColumnWidth!: boolean;

	/**
	 * Specifies it the table is designed for a mobile device.
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	isOptimizedForSmallDevice!: boolean;

	/**
	 * Controls if the header text should be shown or not.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	headerVisible!: boolean;

	/**
	 * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
	 *
	 * This property is not relevant for responsive tables
	 *
	 * @public
	 */
	@property({ type: "number" })
	frozenColumnCount?: number;

	/**
	 * Indicates if the column header should be a part of the width calculation.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	widthIncludingColumnHeader?: boolean;

	/**
	 * Defines how the table handles the visible rows. Does not apply to Responsive tables.
	 *
	 * Allowed values are `Auto`, `Fixed`.<br/>
	 * - If set to `Fixed`, the table always has as many rows as defined in the rowCount property.<br/>
	 * - If set to `Auto`, the number of rows is changed by the table automatically. It will then adjust its row count to the space it is allowed to cover (limited by the surrounding container) but it cannot have less than defined in the `rowCount` property.<br/>
	 *
	 * @public
	 */
	@property({ type: "string", defaultValue: "Fixed", allowedValues: ["Auto", "Fixed"] })
	rowCountMode?: string;

	/**
	 * Number of rows to be displayed in the table. Does not apply to responsive tables.
	 *
	 * @public
	 */
	@property({ type: "number", defaultValue: 5 })
	rowCount?: number;

	/**
	 * Aggregate actions of the table.
	 *
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.Action", multiple: true })
	actions!: Action[];

	/**
	 * Aggregate columns of the table.
	 *
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.table.Column", multiple: true })
	columns!: Column[];

	/**
	 *
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	dataInitialized!: boolean;

	/**
	 *
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	bindingSuspended!: boolean;

	/**
	 *
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	outDatedBinding!: boolean;

	/**
	 *
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	pendingRequest!: boolean;

	/**
	 * Specifies if the empty rows are enabled. This allows to have dynamic enablement of the empty rows via the setter function.
	 *
	 * @private
	 */
	@property({ type: "boolean", defaultValue: false })
	emptyRowsEnabled!: boolean;

	/**
	 * An event is triggered when the user chooses a row; the event contains information about which row is chosen.
	 *
	 * You can set this in order to handle the navigation manually.
	 *
	 * @public
	 */
	@event()
	rowPress!: Function;

	/**
	 * An event triggered when the Table State changes.
	 *
	 * You can set this in order to store the table state in the appstate.
	 *
	 * @private
	 */
	@event()
	stateChange!: Function;

	/**
	 * An event triggered when the Table context changes.
	 *
	 *
	 * @private
	 */
	@event()
	contextChange?: Function;

	@event()
	internalDataRequested!: Function;

	/**
	 * Controls which options should be enabled for the table personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 *<br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 *  - Sort<br/>
	 *  - Column<br/>
	 *  - Filter<br/>
	 *
	 * @public
	 */
	@property({ type: "boolean | string", defaultValue: true })
	personalization!: boolean | string;

	/**
	 * Controls the kind of variant management that should be enabled for the table.
	 *
	 * Allowed value is `Control`.<br/>
	 * If set with value `Control`, a variant management control is seen within the table and the table is linked to this.<br/>
	 * If not set with any value, control level variant management is not available for this table.
	 *
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Control"] })
	variantManagement!: string;

	/**
	 * Defines whether to display the search action.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	isSearchable?: boolean;

	/**
	 * A set of options that can be configured.
	 *
	 * @public
	 */
	@property({
		type: "sap.fe.macros.table.TableCreationOptions",
		defaultValue: {
			name: "Inline",
			createAtEnd: false,
			inlineCreationRowsHiddenInEditMode: false
		}
	})
	creationMode?: TableCreationOptions;

	/**
	 * Gets the relevant tableAPI for a UI5 event.
	 * An event can be triggered either by the inner control (the table) or the Odata listBinding
	 * The first initiator is the usual one so it's managed by the MacroAPI whereas
	 * the second one is specific to this API and has to managed by the TableAPI.
	 *
	 * @param ui5Event The UI5 event
	 * @returns The TableAPI or false if not found
	 * @private
	 */
	static getAPI(ui5Event: UI5Event): TableAPI | undefined {
		const source = ui5Event.getSource();
		let tableAPI: TableAPI | undefined;
		if (source.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			tableAPI = (this.instanceMap?.get(this) as TableAPI[])?.find((api) => api.content?.getRowBinding() === source);
		}
		return tableAPI || (super.getAPI(ui5Event, "sap.fe.macros.table.TableAPI") as TableAPI);
	}

	/**
	 * Get the sort conditions query string.
	 *
	 * @returns The sort conditions query string
	 */
	getSortConditionsQuery(): string {
		const table = this.content;
		type SortConditions = {
			sorters: [
				{
					name: string;
					descending: boolean;
				}
			];
		};
		const sortConditions = (table.getSortConditions() as SortConditions)?.sorters;
		return sortConditions
			? sortConditions
					.map(function (sortCondition) {
						const sortConditionsPath = table.getPropertyHelper().getProperty(sortCondition.name)?.path;
						if (sortConditionsPath) {
							return `${sortConditionsPath}${sortCondition.descending ? " desc" : ""}`;
						}
						return "";
					})
					.join(",")
			: "";
	}

	/**
	 * Gets contexts from the table that have been selected by the user.
	 *
	 * @returns Contexts of the rows selected by the user
	 * @public
	 */
	getSelectedContexts(): Context[] {
		return (this.content as any).getSelectedContexts();
	}

	/**
	 * Adds a message to the table.
	 *
	 * The message applies to the whole table and not to an individual table row.
	 *
	 * @param [parameters] The parameters to create the message
	 * @param parameters.type Message type
	 * @param parameters.message Message text
	 * @param parameters.description Message description
	 * @param parameters.persistent True if the message is persistent
	 * @returns The ID of the message
	 * @public
	 */
	addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): string {
		const msgManager = this._getMessageManager();

		const oTable = this.content as any as Table;

		const oMessage = new Message({
			target: oTable.getRowBinding().getResolvedPath(),
			type: parameters.type,
			message: parameters.message,
			processor: oTable.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});

		msgManager.addMessages(oMessage);
		return oMessage.getId();
	}

	/**
	 * This function will check if the table should request recommendations function.
	 * The table in view should only request recommendations if
	 *   1. The Page is in Edit mode
	 *   2. Table is not read only
	 *   3. It has annotation for Common.RecommendedValuesFunction
	 *   4. View is not ListReport, for OP/SubOP and forward views recommendations should be requested.
	 *
	 * @param oEvent
	 * @returns True if recommendations needs to be requested
	 */
	checkIfRecommendationRelevant(oEvent: UI5Event): boolean {
		const isTableReadOnly = this.getProperty("readOnly");
		const isEditable = (this.getModel("ui") as JSONModel).getProperty("/isEditable");
		const view = CommonUtils.getTargetView(this);
		const viewData = view.getViewData() as ViewData;
		// request for action only if we are in OP/SubOP and in Edit mode, also table is not readOnly
		if (!isTableReadOnly && isEditable && viewData.converterType !== "ListReport") {
			return true;
		}
		return false;
	}

	/**
	 * Removes a message from the table.
	 *
	 * @param id The id of the message
	 * @public
	 */
	removeMessage(id: string) {
		const msgManager = this._getMessageManager();
		const messages = msgManager.getMessageModel().getData();
		const result = messages.find((e: any) => e.id === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}

	/**
	 * Requests a refresh of the table.
	 *
	 * @public
	 */
	refresh(): void {
		this.content.getRowBinding().refresh();
	}

	/**
	 * Sets the count in a pending state.
	 *
	 */
	setQuickFilterCountsAsLoading(): void {
		const table = this.content,
			internalContext = table.getBindingContext("internal") as Context,
			selector = table.getQuickFilter() as Select | SegmentedButton,
			quickFilterCounts = {} as Record<number, string>;

		for (const k in selector.getItems()) {
			quickFilterCounts[k] = "...";
		}
		internalContext.setProperty("quickFilters", { counts: quickFilterCounts });
	}

	/**
	 * Updates the count of the selected quickFilter.
	 *
	 */
	refreshSelectedQuickFilterCount(): void {
		const table = this.content;
		const count = (table.getRowBinding() as ODataListBinding).getCount();
		const selector = table.getQuickFilter() as Select | SegmentedButton | undefined;
		if (selector && this.getTableDefinition().control.filters?.quickFilters?.showCounts && count !== undefined) {
			const itemIndex = selector.getItems().findIndex((selectorItem) => selectorItem.getKey() === selector.getSelectedKey());
			if (itemIndex > -1) {
				table.getBindingContext("internal")?.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
			}
		}
	}

	/**
	 * Updates the counts of the unselected quickFilters.
	 *
	 * @returns  Promise resolves once the count are updated
	 */
	async refreshUnSelectedQuickFilterCounts(): Promise<void> {
		const table = this.content,
			selector = table.getQuickFilter() as Select | SegmentedButton,
			items = selector.getItems(),
			internalContext = table.getBindingContext("internal") as Context,
			controller = CommonUtils.getTargetView(this)?.getController(),
			chart = (controller as Controller & { getChartControl?: Function }).getChartControl?.(),
			chartAPI = chart && chart.getParent(),
			setItemCounts = async (item: Item): Promise<void> => {
				const itemKey = item.getKey();
				const itemFilterInfos = CommonUtils.getFiltersInfoForSV(table, itemKey);
				const count = await TableUtils.getListBindingForCount(table, table.getBindingContext(), {
					batchGroupId: "$auto",
					additionalFilters: [...baseTableFilters, ...itemFilterInfos.filters]
				});
				const itemIndex = items.findIndex((selectorItem) => selectorItem.getKey() === itemKey);
				if (itemIndex > -1) {
					internalContext.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
				}
			};

		const chartFilter = chartAPI && chartAPI.hasSelections() && chartAPI.getFilter();
		const baseTableFilters = TableUtils.getHiddenFilters(table);
		if (chartFilter) {
			baseTableFilters.push(chartFilter);
		}
		const bindingPromises = items
			.filter((item) => item.getKey() !== selector.getSelectedKey())
			.map(async (item) => setItemCounts(item));
		try {
			await Promise.all(bindingPromises);
		} catch (error: unknown) {
			Log.error("Error while retrieving the binding promises", error as string);
		}
	}

	_getMessageManager() {
		return sap.ui.getCore().getMessageManager();
	}

	/**
	 * An event triggered when the selection in the table changes.
	 *
	 * @public
	 */
	@event()
	selectionChange!: Function;

	_getRowBinding() {
		const oTable = (this as any).getContent();
		return oTable.getRowBinding();
	}

	getCounts(): Promise<string> {
		const oTable = (this as any).getContent();
		return TableUtils.getListBindingForCount(oTable, oTable.getBindingContext(), {
			batchGroupId: !this.getProperty("bindingSuspended") ? oTable.data("batchGroupId") : "$auto",
			additionalFilters: TableUtils.getHiddenFilters(oTable)
		})
			.then((iValue: any) => {
				return TableUtils.getCountFormatted(iValue);
			})
			.catch(() => {
				return "0";
			});
	}

	/**
	 * Handles the context change on the table.
	 * An event is fired to propagate the OdataListBinding event and the enablement
	 * of the creation row is calculated.
	 *
	 * @param ui5Event The UI5 event
	 */
	@xmlEventHandler()
	onContextChange(ui5Event: UI5Event) {
		this.fireEvent("contextChange", ui5Event.getParameters());
		this.setFastCreationRowEnablement();
		this.refreshSelectedQuickFilterCount();
	}

	/**
	 * Handler for the onFieldLiveChange event.
	 *
	 * @name onFieldLiveChange
	 * @param ui5Event The event object passed by the onFieldLiveChange event
	 */
	@xmlEventHandler()
	onFieldLiveChange(ui5Event: UI5Event): void {
		const field = ui5Event.getSource() as Control,
			bindingContext = field.getBindingContext() as Context,
			binding = bindingContext.getBinding();
		// creation of a new inactive row if relevant
		if (bindingContext.isInactive()) {
			const table = this?.content as Table;
			this?.createEmptyRows(binding as ODataListBinding, table, true);
		}
	}

	/**
	 * Handles the change on a quickFilter
	 * The table is rebound if the FilterBar is not suspended and update the AppState.
	 *
	 */
	@xmlEventHandler()
	onQuickFilterSelectionChange() {
		const table = this.content;
		// Rebind the table to reflect the change in quick filter key.
		// We don't rebind the table if the filterBar for the table is suspended
		// as rebind will be done when the filterBar is resumed
		const filterBarID = table.getFilter();
		const filterBar = (filterBarID && Core.byId(filterBarID)) as FilterBar | undefined;
		if (!filterBar?.getSuspendSelection?.()) {
			table.rebind();
		}
		(CommonUtils.getTargetView(this)?.getController() as PageController | undefined)?.getExtensionAPI().updateAppState();
	}

	@xmlEventHandler()
	onTableRowPress(oEvent: UI5Event, oController: PageController, oContext: Context, mParameters: any) {
		// prevent navigation to an empty row
		if (oContext && oContext.isInactive() && oContext.isTransient()) {
			return false;
		}
		// In the case of an analytical table, if we're trying to navigate to a context corresponding to a visual group or grand total
		// --> Cancel navigation
		if (
			this.getTableDefinition().enableAnalytics &&
			oContext &&
			oContext.isA("sap.ui.model.odata.v4.Context") &&
			typeof oContext.getProperty("@$ui5.node.isExpanded") === "boolean"
		) {
			return false;
		} else {
			const navigationParameters = Object.assign({}, mParameters, { reason: NavigationReason.RowPress });
			(oController as any)._routing.navigateForwardToContext(oContext, navigationParameters);
		}
	}

	@xmlEventHandler()
	onInternalPatchCompleted() {
		// BCP: 2380023090
		// We handle enablement of Delete for the table here.
		// EditFlow.ts#handlePatchSent is handling the action enablement.
		const internalModelContext = this.getBindingContext("internal") as InternalModelContext;
		const selectedContexts = this.getSelectedContexts();
		DeleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, selectedContexts);
	}

	@xmlEventHandler()
	onInternalDataReceived(oEvent: UI5Event<{ error: string }>): void {
		const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
		if (isRecommendationRelevant) {
			const responseContextsArray = (oEvent.getSource() as ODataListBinding).getAllCurrentContexts();
			const newContexts = responseContextsArray.filter((context) => {
				return !this.fetchedContextPaths.includes(context.getPath());
			});
			this.getController().recommendations.fetchAndApplyRecommendations(newContexts);
		}
		if (oEvent.getParameter("error")) {
			this.getController().messageHandler.showMessageDialog();
		}
	}

	@controllerExtensionHandler("collaborationManager", "collectAvailableCards")
	collectAvailableCards(cards: Promise<WrappedCard>[]): void {
		const actionToolbarItems = this.content.getActions() as ActionToolbarAction[];
		if (hasInsightActionEnabled(actionToolbarItems)) {
			cards.push(
				(async (): Promise<WrappedCard> => {
					const card = await this.getCardManifestTable();
					return {
						card: card,
						title: (this.getTableDefinition().headerInfoTypeName as string | undefined) ?? "",
						callback: this.onAddCardToCollaborationManagerCallback.bind(this)
					};
				})()
			);
		}
	}

	@xmlEventHandler()
	onInternalDataRequested(oEvent: UI5Event) {
		const table = this.content;
		this.setProperty("dataInitialized", true);
		const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
		if (isRecommendationRelevant) {
			const responseContextsArray = (oEvent.getSource() as ODataListBinding).getAllCurrentContexts();
			this.fetchedContextPaths = responseContextsArray.map((context) => context?.getPath());
		}
		(this as any).fireEvent("internalDataRequested", oEvent.getParameters());
		if (table.getQuickFilter() && this.getTableDefinition().control.filters?.quickFilters?.showCounts) {
			this.setQuickFilterCountsAsLoading();
			this.refreshUnSelectedQuickFilterCounts();
		}
	}

	/**
	 * Handles the Paste operation.
	 * @param evt The event
	 * @param controller The page controller
	 *
	 */
	@xmlEventHandler()
	async onPaste(evt: PasteProvider$PasteEvent, controller: PageController): Promise<void> {
		const rawPastedData = evt.getParameter("data"),
			source = evt.getSource(),
			table = (source.isA("sap.ui.mdc.Table") ? source : (source as Control).getParent()) as Table,
			internalContext = table.getBindingContext("internal") as InternalModelContext | null;

		// If paste is disable or if we're not in edit mode, we can't paste anything
		if (!this.tableDefinition.control.enablePaste || !(this.getModel("ui") as JSONModel).getProperty("/isEditable")) {
			return;
		}

		//This code is executed only in case of TreeTable
		if (internalContext?.getProperty("pastableContexts")) {
			const targetContextPath = internalContext.getProperty("pastableContexts")[0] as string;
			const newParentContext = table.getSelectedContexts()[0] as Context;
			const targetContext = table
				.getRowBinding()
				.getCurrentContexts()
				.find((context) => context.getPath() === targetContextPath);

			if (!targetContext) {
				Log.error("The Cut operation is unsuccessful because the relevant context is no longer available");
			} else {
				try {
					await targetContext.move({ parent: newParentContext });
				} catch (e: unknown) {
					Log.error("The move context fails ", e as string);
				}
				internalContext.setProperty("pastableContexts", []);
				return;
			}
		}

		//This code is executed for tables excepted TreeTable
		if (table.getEnablePaste() === true) {
			PasteHelper.pasteData(rawPastedData, table, controller);
		} else {
			const resourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.core");
			MessageBox.error(resourceModel.getText("T_OP_CONTROLLER_SAPFE_PASTE_DISABLED_MESSAGE"), {
				title: resourceModel.getText("C_COMMON_SAPFE_ERROR")
			});
		}
	}

	/**
	 * Handles the Cut operation.
	 * @param evt The UI5 event
	 *
	 */
	@xmlEventHandler()
	onCut(evt: UI5Event): void {
		const table = (evt.getSource() as UI5Element).getParent() as Table;
		const internalContext = table.getBindingContext("internal") as InternalModelContext;
		if (table.getSelectedContexts().length > 1) {
			Log.error("Multi cutting is not supported");
			return;
		}

		internalContext.setProperty(
			"pastableContexts",
			table.getSelectedContexts().map((context) => context.getPath())
		);
		MessageToast.show(ResourceModelHelper.getResourceModel(table).getText("M_CUT_READY"));
		table.clearSelection();
		internalContext.setProperty("cutableContexts", []);
	}

	// This event will allow us to intercept the export before is triggered to cover specific cases
	// that couldn't be addressed on the propertyInfos for each column.
	// e.g. Fixed Target Value for the datapoints
	@xmlEventHandler()
	onBeforeExport(exportEvent: Table$BeforeExportEvent): void {
		const isSplitMode = !!(exportEvent.getParameter("userExportSettings") as UserExportSettings)?.splitCells;
		const tableController = exportEvent.getSource() as PageController,
			exportSettings = exportEvent.getParameter("exportSettings") as ExportSettings,
			tableDefinition = this.getTableDefinition();

		TableAPI.updateExportSettings(exportSettings, tableDefinition, tableController, isSplitMode);
	}

	/**
	 * Handles the MDC DataStateIndicator plugin to display messageStrip on a table.
	 *
	 * @param oMessage
	 * @param oTable
	 * @name dataStateFilter
	 * @returns Whether to render the messageStrip visible
	 */
	static dataStateIndicatorFilter(oMessage: any, oTable: any): boolean {
		const sTableContextBindingPath = oTable.getBindingContext()?.getPath();
		const sTableRowBinding = (sTableContextBindingPath ? `${sTableContextBindingPath}/` : "") + oTable.getRowBinding().getPath();
		return sTableRowBinding === oMessage.getTargets()[0] ? true : false;
	}

	/**
	 * This event handles the DataState of the DataStateIndicator plugin from MDC on a table.
	 * It's fired when new error messages are sent from the backend to update row highlighting.
	 *
	 * @name onDataStateChange
	 * @param evt Event object
	 */
	@xmlEventHandler()
	onDataStateChange(evt: DataStateIndicator$DataStateChangeEvent): void {
		const dataStateIndicator = evt.getSource() as DataStateIndicator;
		const filteredMessages = evt.getParameter("filteredMessages") as Message[];
		if (filteredMessages) {
			const hiddenMandatoryProperties = filteredMessages
				.map((msg) => {
					const technicalDetails = (msg.getTechnicalDetails() || {}) as {
						tableId?: string;
						emptyRowMessage?: boolean;
						missingColumn?: string;
					};
					return technicalDetails.emptyRowMessage === true && technicalDetails.missingColumn;
				})
				.filter((hiddenProperty) => !!hiddenProperty);
			if (hiddenMandatoryProperties.length) {
				const messageStripError = sap.ui
					.getCore()
					.getLibraryResourceBundle("sap.fe.macros")
					.getText(
						hiddenMandatoryProperties.length === 1
							? "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN"
							: "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN_PLURAL",
						[hiddenMandatoryProperties.join(", ")]
					);
				dataStateIndicator.showMessage(messageStripError, "Error");
				evt.preventDefault();
			}
			const internalModel = dataStateIndicator.getModel("internal") as JSONModel;
			internalModel.setProperty("filteredMessages", filteredMessages, dataStateIndicator.getBindingContext("internal") as Context);
		}
	}

	/**
	 * Updates the columns to be exported of a table.
	 *
	 * @param exportSettings The table export settings
	 * @param tableDefinition The table definition from the table converter
	 * @param tableController The table controller
	 * @param isSplitMode Defines if the export has been launched using split mode
	 * @returns The updated columns to be exported
	 */
	static updateExportSettings(
		exportSettings: ExportSettings,
		tableDefinition: TableVisualization,
		tableController: PageController,
		isSplitMode: boolean
	): ExportSettings {
		//Set static sizeLimit during export
		const columns = tableDefinition.columns;
		if (
			!tableDefinition.enableAnalytics &&
			(tableDefinition.control.type === "ResponsiveTable" || tableDefinition.control.type === "GridTable")
		) {
			exportSettings.dataSource.sizeLimit = 1000;
		}

		if (exportSettings.fileType === "PDF") {
			//Remove the multiValue field from the PDF
			exportSettings.workbook.columns = exportSettings.workbook.columns.filter((column) => {
				const columProperty = (Core.byId(column.columnId as string) as MDCColumn | undefined)?.getPropertyKey();
				if (columProperty) {
					return (
						(
							tableDefinition.columns.find((columnDefinition) => columnDefinition.name === columProperty) as
								| AnnotationTableColumn
								| undefined
						)?.isMultiValue !== true
					);
				}
				return true;
			});
		}

		const exportColumns = exportSettings.workbook.columns;
		for (let index = exportColumns.length - 1; index >= 0; index--) {
			const exportColumn = exportColumns[index];
			const resourceBundle = Core.getLibraryResourceBundle("sap.fe.macros");
			exportColumn.label = getLocalizedText(exportColumn.label, tableController);
			//translate boolean values
			if (exportColumn.type === "Boolean") {
				exportColumn.falseValue = resourceBundle.getText("no");
				exportColumn.trueValue = resourceBundle.getText("yes");
			}
			const targetValueColumn = columns?.find((column) => {
				if (isSplitMode) {
					return this.columnWithTargetValueToBeAdded(column as AnnotationTableColumn, exportColumn);
				} else {
					return false;
				}
			});
			if (targetValueColumn) {
				const columnToBeAdded = {
					label: resourceBundle.getText("TargetValue"),
					property: Array.isArray(exportColumn.property) ? exportColumn.property : [exportColumn.property],
					template: (targetValueColumn as AnnotationTableColumn).exportDataPointTargetValue
				};
				exportColumns.splice(index + 1, 0, columnToBeAdded);
			}
		}
		return exportSettings;
	}

	/**
	 * Defines if a column that is to be exported and contains a DataPoint with a fixed target value needs to be added.
	 *
	 * @param column The column from the annotations column
	 * @param columnExport The column to be exported
	 * @returns `true` if the referenced column has defined a targetValue for the dataPoint, false else
	 * @private
	 */
	static columnWithTargetValueToBeAdded(column: AnnotationTableColumn, columnExport: ExportColumn): boolean {
		let columnNeedsToBeAdded = false;
		if (column.exportDataPointTargetValue && column.propertyInfos?.length === 1) {
			//Add TargetValue column when exporting on split mode
			if (
				column.relativePath === columnExport.property ||
				columnExport.property[0] === column.propertyInfos[0] ||
				columnExport.property.includes(column.relativePath) ||
				columnExport.property.includes(column.name)
			) {
				// part of a FieldGroup or from a lineItem or from a column on the entitySet
				delete columnExport.template;
				columnNeedsToBeAdded = true;
			}
		}
		return columnNeedsToBeAdded;
	}

	resumeBinding(bRequestIfNotInitialized: boolean) {
		this.setProperty("bindingSuspended", false);
		if ((bRequestIfNotInitialized && !(this as any).getDataInitialized()) || this.getProperty("outDatedBinding")) {
			this.setProperty("outDatedBinding", false);
			(this as any).getContent()?.rebind();
		}
	}

	refreshNotApplicableFields(oFilterControl: Control): any[] {
		const oTable = (this as any).getContent();
		return FilterUtils.getNotApplicableFilters(oFilterControl, oTable);
	}

	suspendBinding() {
		this.setProperty("bindingSuspended", true);
	}

	invalidateContent() {
		this.setProperty("dataInitialized", false);
		this.setProperty("outDatedBinding", false);
	}

	/**
	 * Sets the enablement of the creation row.
	 *
	 * @private
	 */
	setFastCreationRowEnablement() {
		const table = this.content;
		const fastCreationRow = table.getCreationRow();

		if (fastCreationRow && !fastCreationRow.getBindingContext()) {
			const tableBinding = table.getRowBinding();
			const bindingContext = tableBinding.getContext() as Context;

			if (bindingContext) {
				TableHelper.enableFastCreationRow(
					fastCreationRow,
					tableBinding.getPath(),
					bindingContext,
					bindingContext.getModel(),
					(table.getModel("ui") as JSONModel).getProperty("/isEditable")
				);
			}
		}
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 *
	 * @returns Undefined if the card preview is rendered.
	 */
	@xmlEventHandler()
	async onAddCardToInsightsPressed() {
		try {
			const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
			const insightsParams = await TableInsightsHelper.createTableCardParams(this, insightsRelevantColumns);
			if (insightsParams) {
				const message: CardMessage = insightsParams.parameters.isNavigationEnabled
					? undefined
					: {
							type: "Warning",
							text: this.createNavigationErrorMessage(this.content)
					  };

				InsightsService.showInsightsCardPreview(insightsParams, message);
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	/**
	 * Gets the card manifest optimized for the table case.
	 *
	 * @returns Promise of CardManifest
	 */
	private async getCardManifestTable(): Promise<CardManifest> {
		const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
		const insightsParams = (await TableInsightsHelper.createTableCardParams(
			this,
			insightsRelevantColumns
		)) as InsightsParams<TableContent>;
		return InsightsService.getCardManifest(insightsParams);
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for table.
	 *
	 * @param card The card manifest to be used for the callback
	 * @returns Undefined if card preview is rendered.
	 */
	async onAddCardToCollaborationManagerCallback(card: CardManifest): Promise<void> {
		try {
			if (card) {
				await InsightsService.showCollaborationManagerCardPreview(card, this.getController().collaborationManager.getService());
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	createNavigationErrorMessage(scope: Control): string {
		const resourceModel = ResourceModelHelper.getResourceModel(scope);
		return resourceModel.getText("M_ROW_LEVEL_NAVIGATION_DISABLED_MSG_REASON_EXTERNAL_NAVIGATION_CONFIGURED");
	}

	@xmlEventHandler()
	onMassEditButtonPressed(oEvent: UI5Event, pageController: any) {
		const oTable = this.content;
		if (pageController && pageController.massEdit) {
			pageController.massEdit.openMassEditDialog(oTable);
		} else {
			Log.warning("The Controller is not enhanced with Mass Edit functionality");
		}
	}

	@xmlEventHandler()
	onTableSelectionChange(oEvent: UI5Event) {
		this.fireEvent("selectionChange", oEvent.getParameters());
	}

	@xmlEventHandler()
	async onActionPress(oEvent: UI5Event, pageController: PageController, actionName: string, parameters: any) {
		parameters.model = (oEvent.getSource() as Control).getModel();
		let executeAction = true;
		if (parameters.notApplicableContexts && parameters.notApplicableContexts.length > 0) {
			// If we have non applicable contexts, we need to open a dialog to ask the user if he wants to continue
			const convertedMetadata = convertTypes(parameters.model.getMetaModel());
			const entityType = convertedMetadata.resolvePath<EntityType>(this.entityTypeFullyQualifiedName).target!;
			const myUnapplicableContextDialog = new NotApplicableContextDialog({
				entityType: entityType,
				notApplicableContexts: parameters.notApplicableContexts,
				title: parameters.label,
				resourceModel: getResourceModel(this)
			});
			parameters.contexts = parameters.applicableContexts;
			executeAction = await myUnapplicableContextDialog.open(this);
		}
		if (executeAction) {
			// Direct execution of the action
			try {
				return await pageController.editFlow.invokeAction(actionName, parameters);
			} catch (e) {
				Log.info(e as string);
			}
		}
	}

	/**
	 * Expose the internal table definition for external usage in delegate.
	 *
	 * @returns The tableDefinition
	 */
	getTableDefinition() {
		return this.tableDefinition;
	}

	/**
	 * connect the filter to the tableAPI if required
	 *
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */

	updateFilterBar() {
		const table = (this as any).getContent();
		const filterBarRefId = (this as any).getFilterBar();
		if (table && filterBarRefId && table.getFilter() !== filterBarRefId) {
			this._setFilterBar(filterBarRefId);
		}
	}

	/**
	 * Sets the filter depending on the type of filterBar.
	 *
	 * @param filterBarRefId Id of the filter bar
	 * @private
	 * @alias sap.fe.macros.TableAPI
	 */
	_setFilterBar(filterBarRefId: string): void {
		const table = (this as any).getContent();

		// 'filterBar' property of macro:Table(passed as customData) might be
		// 1. A localId wrt View(FPM explorer example).
		// 2. Absolute Id(this was not supported in older versions).
		// 3. A localId wrt FragmentId(when an XMLComposite or Fragment is independently processed) instead of ViewId.
		//    'filterBar' was supported earlier as an 'association' to the 'mdc:Table' control inside 'macro:Table' in prior versions.
		//    In newer versions 'filterBar' is used like an association to 'macro:TableAPI'.
		//    This means that the Id is relative to 'macro:TableAPI'.
		//    This scenario happens in case of FilterBar and Table in a custom sections in OP of FEV4.

		const tableAPIId = this?.getId();
		const tableAPILocalId = this.data("tableAPILocalId");
		const potentialfilterBarId =
			tableAPILocalId && filterBarRefId && tableAPIId && tableAPIId.replace(new RegExp(tableAPILocalId + "$"), filterBarRefId); // 3

		const filterBar =
			CommonUtils.getTargetView(this)?.byId(filterBarRefId) || Core.byId(filterBarRefId) || Core.byId(potentialfilterBarId);

		if (filterBar) {
			if (filterBar.isA<FilterBarAPI>("sap.fe.macros.filterBar.FilterBarAPI")) {
				table.setFilter(`${filterBar.getId()}-content`);
			} else if (filterBar.isA<FilterBar>("sap.ui.mdc.FilterBar")) {
				table.setFilter(filterBar.getId());
			}
		}
	}

	checkIfColumnExists(aFilteredColummns: any, columnName: any) {
		return aFilteredColummns.some(function (oColumn: any) {
			if (
				(oColumn?.columnName === columnName && oColumn?.sColumnNameVisible) ||
				(oColumn?.sTextArrangement !== undefined && oColumn?.sTextArrangement === columnName)
			) {
				return columnName;
			}
		});
	}

	getIdentifierColumn(): any {
		const oTable = (this as any).getContent();
		const headerInfoTitlePath = this.getTableDefinition().headerInfoTitle;
		const oMetaModel = oTable && oTable.getModel().getMetaModel(),
			sCurrentEntitySetName = oTable.data("metaPath");
		const aTechnicalKeys = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/$Key`);
		const aFilteredTechnicalKeys: string[] = [];

		if (aTechnicalKeys && aTechnicalKeys.length > 0) {
			aTechnicalKeys.forEach(function (technicalKey: string) {
				if (technicalKey !== "IsActiveEntity") {
					aFilteredTechnicalKeys.push(technicalKey);
				}
			});
		}
		const semanticKeyColumns = this.getTableDefinition().semanticKeys;

		const aVisibleColumns: any = [];
		const aFilteredColummns: any = [];
		const aTableColumns = oTable.getColumns();
		aTableColumns.forEach(function (oColumn: any) {
			const column = oColumn?.getDataProperty();
			aVisibleColumns.push(column);
		});

		aVisibleColumns.forEach(function (oColumn: any) {
			const oTextArrangement = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/${oColumn}@`);
			const sTextArrangement = oTextArrangement && oTextArrangement["@com.sap.vocabularies.Common.v1.Text"]?.$Path;
			const sTextPlacement =
				oTextArrangement &&
				oTextArrangement["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]?.$EnumMember;
			aFilteredColummns.push({
				columnName: oColumn,
				sTextArrangement: sTextArrangement,
				sColumnNameVisible: !(sTextPlacement === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly")
			});
		});
		let column: any;

		if (headerInfoTitlePath !== undefined && this.checkIfColumnExists(aFilteredColummns, headerInfoTitlePath)) {
			column = headerInfoTitlePath;
		} else if (
			semanticKeyColumns !== undefined &&
			semanticKeyColumns.length === 1 &&
			this.checkIfColumnExists(aFilteredColummns, semanticKeyColumns[0])
		) {
			column = semanticKeyColumns[0];
		} else if (
			aFilteredTechnicalKeys !== undefined &&
			aFilteredTechnicalKeys.length === 1 &&
			this.checkIfColumnExists(aFilteredColummns, aFilteredTechnicalKeys[0])
		) {
			column = aFilteredTechnicalKeys[0];
		}
		return column;
	}

	/**
	 * EmptyRowsEnabled setter.
	 *
	 * @param enablement
	 */
	setEmptyRowsEnabled(enablement: boolean) {
		this.setProperty("emptyRowsEnabled", enablement);
		this.setUpEmptyRows(this.content);
	}

	/**
	 * Handles the CreateActivate event from the ODataListBinding.
	 *
	 * @param activateEvent The event sent by the binding
	 */
	@xmlEventHandler()
	async handleCreateActivate(activateEvent: UI5Event<{ context: Context }>): Promise<void> {
		const activatedContext = activateEvent.getParameter("context");
		// we start by asking to recreate an empty row (if live change has already done it this won't have any effect)
		// but we do not wait
		this.createEmptyRows(activateEvent.getSource() as ODataListBinding, this.content, true);
		if (!this.validateEmptyRow(activatedContext)) {
			activateEvent.preventDefault();
			return;
		}

		try {
			const transientPath = activatedContext.getPath();
			try {
				await (activatedContext.created() ?? Promise.resolve());
			} catch (e) {
				Log.warning(`Failed to activate context ${activatedContext.getPath()}`);
				return;
			}
			const content = activatedContext.getPath();
			const view = CommonUtils.getTargetView(this);
			// Send notification to other users only after the creation has been finalized
			ActivitySync.send(view, { action: Activity.Create, content });
			// Since the path of the context has changed during activation, we need to update all collaboration locks
			// that were using the transient path
			ActivitySync.updateLocksForContextPath(view, transientPath, activatedContext.getPath());
		} catch (error) {
			Log.error("Failed to activate new row -", error as Error);
		}
	}

	async setUpEmptyRows(table: Table, createButtonWasPressed = false): Promise<void> {
		if (this.tableDefinition.control?.creationMode !== CreationMode.InlineCreationRows) {
			return;
		}

		const uiModel = table.getModel("ui") as JSONModel | undefined;
		if (!uiModel) {
			return;
		}
		if (uiModel.getProperty("/isEditablePending")) {
			// The edit mode is still being computed, so we wait until this computation is done before checking its value
			const watchBinding = uiModel.bindProperty("/isEditablePending");
			await new Promise<void>((resolve) => {
				const fnHandler = () => {
					watchBinding.detachChange(fnHandler);
					watchBinding.destroy();
					resolve();
				};
				watchBinding.attachChange(fnHandler);
			});
		}
		const binding = table.getRowBinding() as ODataListBinding | undefined;
		const bindingHeaderContext = binding?.getHeaderContext();
		if (binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext) {
			const contextPath = bindingHeaderContext.getPath();
			if (!this.emptyRowsEnabled) {
				this.removeEmptyRowsMessages();
				return this._deleteEmptyRows(binding, contextPath);
			}
			if (!uiModel.getProperty("/isEditable")) {
				return;
			}
			if (
				this.tableDefinition.control?.inlineCreationRowsHiddenInEditMode &&
				!table.getBindingContext("ui")?.getProperty("createMode") &&
				!createButtonWasPressed
			) {
				return;
			}
			const inactiveContext = binding.getAllCurrentContexts().find(function (context) {
				// when this is called from controller code we need to check that inactive contexts are still relative to the current table context
				return context.isInactive() && context.getPath().startsWith(contextPath);
			});
			if (!inactiveContext) {
				this.removeEmptyRowsMessages();
				await this.createEmptyRows(binding, table);
			}
		}
	}

	/**
	 * Deletes inactive rows from the table listBinding.
	 *
	 * @param binding
	 * @param contextPath
	 */
	_deleteEmptyRows(binding: ODataListBinding, contextPath: string) {
		for (const context of binding.getAllCurrentContexts()) {
			if (context.isInactive() && context.getPath().startsWith(contextPath)) {
				context.delete();
			}
		}
	}

	/**
	 * Returns the current number of inactive contexts within the list binding.
	 *
	 * @param binding Data list binding
	 * @returns The number of inactive contexts
	 */
	getInactiveContextNumber(binding: ODataListBinding): number {
		return binding.getAllCurrentContexts().filter((context) => context.isInactive()).length;
	}

	/**
	 * Handles the validation of the empty row.
	 *
	 * @param context The context of the empty row
	 * @returns The validation status
	 */
	validateEmptyRow(context: Context): boolean {
		const requiredProperties = this.getTableDefinition().annotation.requiredProperties;
		if (requiredProperties?.length) {
			this.removeEmptyRowsMessages(context);
			const missingProperties = requiredProperties.filter((requiredProperty) => !context.getObject(requiredProperty));
			if (missingProperties.length) {
				const resourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.macros");
				const messages: Message[] = [];
				let displayedColumn: MDCColumn | undefined;
				for (const missingProperty of missingProperties) {
					let errorMessage: string;
					const missingColumn = this.getTableDefinition().columns.find(
						(tableColumn) =>
							(tableColumn as AnnotationTableColumn).relativePath === missingProperty ||
							(tableColumn.propertyInfos && tableColumn.propertyInfos.includes(missingProperty))
					);

					if (!missingColumn) {
						errorMessage = resourceModel.getText("M_TABLE_EMPTYROW_MANDATORY", [missingProperty]);
					} else {
						displayedColumn = this.content.getColumns().find((mdcColumn) => mdcColumn.getPropertyKey() === missingColumn.name);
						errorMessage = resourceModel.getText(
							displayedColumn ? "M_TABLE_EMPTYROW_MANDATORY" : "M_TABLE_EMPTYROW_MANDATORY_HIDDEN",
							[displayedColumn?.getHeader() || missingColumn.label]
						);
					}

					messages.push(
						new Message({
							message: errorMessage,
							processor: this.getModel(),
							type: MessageType.Error,
							technical: false,
							persistent: true,
							technicalDetails: {
								tableId: this.content.getId(), // Need to do it since handleCreateActivate can be triggered multiple times (extra properties set by value help) before controlIds are set on the message
								emptyRowMessage: true,
								missingColumn: displayedColumn ? undefined : missingProperty // needed to change the messageStrip message
							},
							target: `${context?.getPath()}/${missingProperty}`
						})
					);
				}
				Core.getMessageManager().addMessages(messages);
				return false;
			}
		}
		return true;
	}

	/**
	 * Removes the messages related to the empty rows.
	 *
	 * @param inactiveContext The context of the empty row, if not provided the messages of all empty rows are removed
	 */
	removeEmptyRowsMessages(inactiveContext?: Context): void {
		const messageManager = Core.getMessageManager();
		messageManager.removeMessages(
			(messageManager.getMessageModel().getData() as Message[]).filter((msg) => {
				const technicalDetails = (msg.getTechnicalDetails() || {}) as { tableId?: string; emptyRowMessage?: boolean };
				return (
					(inactiveContext ? msg.getTargets().some((value) => value.startsWith(inactiveContext.getPath())) : true) &&
					technicalDetails.emptyRowMessage &&
					technicalDetails.tableId === this.content.getId()
				);
			})
		);
	}

	/**
	 * Creation of inactive rows for the table in creation mode "InlineCreationRows".
	 *
	 * @param binding Data list binding
	 * @param table The table being edited
	 * @param recreateOneRow `true` if the call is to recreate an emptyLine
	 */
	async createEmptyRows(binding: ODataListBinding, table: Table, recreateOneRow = false): Promise<void> {
		const inlineCreationRowCount = this.tableDefinition.control?.inlineCreationRowCount || 1;
		if (this.creatingEmptyRows || this.getInactiveContextNumber(binding) > inlineCreationRowCount) {
			return;
		}
		const data = Array.from({ length: inlineCreationRowCount }, () => ({})),
			atEnd = table.data("tableType") !== "ResponsiveTable",
			inactive = true,
			view = CommonUtils.getTargetView(table),
			controller = view.getController() as PageController,
			editFlow = controller.editFlow,
			appComponent = CommonUtils.getAppComponent(table);

		this.creatingEmptyRows = true;
		try {
			const dataForCreate = recreateOneRow ? [{}] : data;
			const contexts = await editFlow.createMultipleDocuments(
				binding,
				// during a live change, only 1 new document is created
				dataForCreate,
				// When editing an empty row, the new empty row is to be created just below and not above
				recreateOneRow ? true : atEnd,
				false,
				controller.editFlow.onBeforeCreate,
				inactive
			);
			contexts?.forEach(async function (context: Context) {
				try {
					await context.created();
					appComponent
						.getSideEffectsService()
						.requestSideEffectsForNavigationProperty(binding.getPath(), view.getBindingContext() as Context);
				} catch (error) {
					if (!(error as ContextErrorType).canceled) {
						throw error;
					}
				}
			});
		} catch (e) {
			Log.error(e as string);
		} finally {
			this.creatingEmptyRows = false;
		}
	}

	async getDownloadUrlWithFilters(): Promise<string> {
		const table = this.content;
		const filterBar = Core.byId(table?.getFilter()) as FilterBar | undefined;

		if (!filterBar) {
			throw new Error("filter bar is not available");
		}
		const binding = table.getRowBinding();
		const model = table.getModel() as ODataModel;
		const filterPropSV = await (filterBar.getParent() as FilterBarAPI).getSelectionVariant();
		// ignore filters with semantic operators which needs to be added later as filters with flp semantic date placeholders
		const filtersWithSemanticDateOpsInfo = SemanticDateOperators.getSemanticOpsFilterProperties(filterPropSV._getSelectOptions());
		const filtersWithoutSemanticDateOps = TableUtils.getAllFilterInfo(
			table,
			filtersWithSemanticDateOpsInfo.map((filterInfo) => filterInfo.filterName)
		);
		const propertiesInfo = filterBar.getPropertyInfoSet();
		// get the filters with semantic date operators with flp placeholder format and append to the exisiting filters
		const [flpMappedPlaceholders, semanticDateFilters] = SemanticDateOperators.getSemanticDateFiltersWithFlpPlaceholders(
			filtersWithSemanticDateOpsInfo,
			propertiesInfo
		);

		let allRelevantFilters: Filter[] = [];
		if (filtersWithoutSemanticDateOps.filters.length > 0) {
			allRelevantFilters = allRelevantFilters.concat(filtersWithoutSemanticDateOps.filters);
		}
		if (semanticDateFilters.length > 0) {
			allRelevantFilters.push(...semanticDateFilters);
		}
		const allFilters = new Filter({
			filters: allRelevantFilters,
			and: true
		});

		// create hidden binding with all filters e.g. static filters and filters with semantic operators
		const tempTableBinding = model.bindList(binding.getPath(), undefined, undefined, allFilters);
		let url = await tempTableBinding.requestDownloadUrl();
		for (const [placeholder, value] of Object.entries(flpMappedPlaceholders)) {
			url = url.replace(placeholder, value);
		}
		return url;
	}

	/**
	 * The dragged element enters a table row.
	 *
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragEnterDocument(ui5Event: UI5Event<{ bindingContext: Context; dragSource: Context }>): void {
		const targetContext = ui5Event.getParameter("bindingContext");
		const dragContext = ui5Event.getParameter("dragSource");
		const isMoveAllowedInfo = this.getTableDefinition().control.isMoveToPositionAllowed;
		const parentContext = targetContext.getParent();
		let disabledOnParent = !parentContext,
			disabledOnNode = false;
		let allowedDropPosition: "OnOrBetween" | "On" | "Between" = "OnOrBetween";
		try {
			if (isMoveAllowedInfo) {
				const customFunction = FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
					isMoveAllowedInfo.moduleName,
					isMoveAllowedInfo.methodName,
					(ui5Event.getSource() as DragDropInfo).getParent() as Control
				) as Function;

				disabledOnNode = customFunction(dragContext, targetContext) === false;
				disabledOnParent = disabledOnParent || customFunction(dragContext, parentContext) === false;
			}
		} catch (error) {
			Log.warning("Cannot execute function related to isMoveToPositionAllowed", error as string);
		}
		if (
			dragContext.isAncestorOf(targetContext) || // The ancestor is dropped into a descendant -> not authorized
			targetContext === this.content.getBindingContext() || // The drag is done on the table itself-> not yet authorized
			targetContext.getBinding() !== dragContext.getBinding() || // The drag is done on a different table -> not authorized
			(disabledOnParent && disabledOnNode) // "On" and "Between" are not authorized
		) {
			//Set the element as non droppable
			ui5Event.preventDefault();
			return;
		}
		if (disabledOnParent) {
			allowedDropPosition = "On";
		} else if (disabledOnNode) {
			allowedDropPosition = "Between";
		}
		(ui5Event.getSource() as DragDropInfo).setDropPosition(allowedDropPosition);
	}

	/**
	 * Starts the drag of the document.
	 *
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	@xmlEventHandler()
	onDragStartDocument(ui5Event: UI5Event<{ bindingContext: Context }>): void {
		const context = ui5Event.getParameter("bindingContext");
		const isMovableInfo = this.getTableDefinition().control.isNodeMovable;
		const updatablePropertyPath = this.getTableDefinition().annotation.updatablePropertyPath;
		let customDisabled = false;
		try {
			if (isMovableInfo) {
				customDisabled =
					(
						FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
							isMovableInfo.moduleName,
							isMovableInfo.methodName,
							ui5Event.getSource() as Control
						) as Function
					)(context) === false;
			}
		} catch (_error) {
			customDisabled = false;
		}
		if ((updatablePropertyPath && !context.getProperty(updatablePropertyPath)) || customDisabled) {
			//Set the element as non draggable
			ui5Event.preventDefault();
		}
	}

	/**
	 * Drops the document.
	 *
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 * @returns The Promise
	 */
	@xmlEventHandler()
	async onDropDocument(
		ui5Event: UI5Event<{
			bindingContext: Context;
			dragSource: Context;
			dropPosition: string;
		}>
	): Promise<void> {
		BusyLocker.lock(this.content);
		const bindingContext = ui5Event.getParameter("bindingContext");
		const targetContext = ui5Event.getParameter("dropPosition") === "On" ? bindingContext : bindingContext.getParent();
		return ui5Event
			.getParameter("dragSource")
			.move({
				parent: targetContext
			})
			.catch((error: unknown) => {
				Log.error(error as string);
			})
			.finally(() => {
				BusyLocker.unlock(this.content);
			});
	}
}

export default TableAPI;
