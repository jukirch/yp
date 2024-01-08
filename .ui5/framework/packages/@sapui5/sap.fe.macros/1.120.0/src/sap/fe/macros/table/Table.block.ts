import type { ConvertedMetadata, EntitySet, NavigationProperty, PathAnnotationExpression } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldForIntentBasedNavigation
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAggregation, blockAttribute, blockEvent, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { NavigationTargetConfiguration, TemplateType } from "sap/fe/core/converters/ManifestSettings";
import { CreationMode } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isDataFieldForAnnotation, isDataFieldTypes } from "sap/fe/core/converters/annotations/DataField";
import type { CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import type { VisualizationAndPath } from "sap/fe/core/converters/controls/Common/DataVisualization";
import {
	getDataVisualizationConfiguration,
	getVisualizationsFromPresentationVariant
} from "sap/fe/core/converters/controls/Common/DataVisualization";
import type { AnnotationTableColumn, ExternalMethodConfig, TableVisualization } from "sap/fe/core/converters/controls/Common/Table";
import { type CreateBehavior, type CreateBehaviorExternal } from "sap/fe/core/converters/controls/Common/Table";
import type { StandardAction } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import { StandardActionKeys } from "sap/fe/core/converters/controls/Common/table/StandardActions";
import { singletonPathVisitor } from "sap/fe/core/helpers/BindingHelper";
import {
	BindingToolkitExpression,
	and,
	compileExpression,
	constant,
	fn,
	ifElse,
	isConstant,
	not,
	or,
	pathInModel,
	ref,
	type CompiledBindingToolkitExpression
} from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isMultipleNavigationProperty, isSingleton } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextRelativeTargetObjectPath,
	getPathRelativeLocation,
	isPathUpdatable
} from "sap/fe/core/templating/DataModelPathHelper";
import { buildExpressionForHeaderVisible } from "sap/fe/macros/internal/helpers/TableTemplating";
import { TitleLevel } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";
import CommonHelper from "../CommonHelper";
import MacroAPI from "../MacroAPI";
import ActionHelper from "../internal/helpers/ActionHelper";
import { getTableActionTemplate } from "./ActionsTemplating";
import type { Action, ActionGroup, Column, TableCreationOptions } from "./TableAPI";
import TableHelper from "./TableHelper";
type ExtendedActionGroup = ActionGroup & { menuContentActions?: Record<string, Action> };
type ActionOrActionGroup = Record<string, Action | ExtendedActionGroup>;

const setCustomActionProperties = function (childAction: Element) {
	let menuContentActions = null;
	const act = childAction;
	let menuActions: any[] = [];
	const actionKey = act.getAttribute("key")?.replace("InlineXML_", "");
	// For the actionGroup we authorize the both entries <sap.fe.macros:ActionGroup> (compliant with old FPM examples) and <sap.fe.macros.table:ActionGroup>
	if (
		act.children.length &&
		act.localName === "ActionGroup" &&
		act.namespaceURI &&
		["sap.fe.macros", "sap.fe.macros.table"].includes(act.namespaceURI)
	) {
		const actionsToAdd = Array.prototype.slice.apply(act.children);
		let actionIdx = 0;
		menuContentActions = actionsToAdd.reduce((acc, actToAdd) => {
			const actionKeyAdd = actToAdd.getAttribute("key")?.replace("InlineXML_", "") || actionKey + "_Menu_" + actionIdx;
			const curOutObject = {
				key: actionKeyAdd,
				text: actToAdd.getAttribute("text"),
				__noWrap: true,
				press: actToAdd.getAttribute("press"),
				requiresSelection: actToAdd.getAttribute("requiresSelection") === "true",
				enabled: actToAdd.getAttribute("enabled") === null ? true : actToAdd.getAttribute("enabled")
			};
			acc[curOutObject.key] = curOutObject;
			actionIdx++;
			return acc;
		}, {});
		menuActions = Object.values(menuContentActions)
			.slice(-act.children.length)
			.map(function (menuItem: any) {
				return menuItem.key;
			});
	}
	return {
		key: actionKey,
		text: act.getAttribute("text"),
		position: {
			placement: act.getAttribute("placement"),
			anchor: act.getAttribute("anchor")
		},
		__noWrap: true,
		press: act.getAttribute("press"),
		requiresSelection: act.getAttribute("requiresSelection") === "true",
		enabled: act.getAttribute("enabled") === null ? true : act.getAttribute("enabled"),
		menu: menuActions.length ? menuActions : null,
		menuContentActions: menuContentActions
	};
};

const setCustomColumnProperties = function (childColumn: Element, aggregationObject: any) {
	aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
	childColumn.setAttribute("key", aggregationObject.key);
	return {
		// Defaults are to be defined in Table.ts
		key: aggregationObject.key,
		type: "Slot",
		width: childColumn.getAttribute("width"),
		widthIncludingColumnHeader: childColumn.getAttribute("widthIncludingColumnHeader")
			? childColumn.getAttribute("widthIncludingColumnHeader") === "true"
			: undefined,
		importance: childColumn.getAttribute("importance"),
		horizontalAlign: childColumn.getAttribute("horizontalAlign"),
		availability: childColumn.getAttribute("availability") || "Default",
		header: childColumn.getAttribute("header"),
		template: childColumn.children[0]?.outerHTML || "",
		properties: childColumn.getAttribute("properties") ? childColumn.getAttribute("properties")?.split(",") : undefined,
		position: {
			placement: childColumn.getAttribute("placement") || childColumn.getAttribute("positionPlacement"), //positionPlacement is kept for backwards compatibility
			anchor: childColumn.getAttribute("anchor") || childColumn.getAttribute("positionAnchor") //positionAnchor is kept for backwards compatibility
		},
		required: childColumn.getAttribute("required")
	};
};

@defineBuildingBlock({
	name: "Table",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.fe.macros.table.TableAPI"]
})
export default class TableBlock extends BuildingBlockBase {
	//  *************** Public & Required Attributes ********************
	@blockAttribute({ type: "sap.ui.model.Context", isPublic: true, required: true })
	metaPath!: Context;

	//  *************** Public Attributes ********************
	/**
	 *The `busy` mode of table
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	busy?: boolean;

	@blockAttribute({ type: "sap.ui.model.Context", isPublic: true })
	contextPath?: Context;

	/**
	 * Parameter used to show the fullScreen button on the table.
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	enableFullScreen?: boolean;

	/**
	 * Enable export to file
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	enableExport?: boolean;

	/**
	 * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
	 */
	@blockAttribute({ type: "number", isPublic: true })
	frozenColumnCount?: number;

	/**
	 * Indicates if the column header should be part of the width calculation.
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	widthIncludingColumnHeader?: boolean;

	/**
	 * Mode of rows to be displayed in the table. Values: ["Auto", "Fixed"]
	 */
	@blockAttribute({ type: "string" })
	rowCountMode?: string;

	/**
	 * Number of rows to be displayed in the table.
	 */
	@blockAttribute({ type: "number" })
	rowCount?: number;

	/**
	 * Paste button enablement
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	enablePaste?: boolean | CompiledBindingToolkitExpression;

	/**
	 * visibility of the Paste Button
	 */
	@blockAttribute({ type: "boolean", isPublic: false })
	pasteVisible?: boolean | CompiledBindingToolkitExpression;

	/**
	 * The control ID of the FilterBar that is used to filter the rows of the table.
	 */
	@blockAttribute({ type: "string", isPublic: true })
	filterBar?: string;

	/**
	 * Specifies header text that is shown in table.
	 */
	@blockAttribute({ type: "string", isPublic: true })
	header?: string;

	/**
	 * Defines the "aria-level" of the table header
	 */
	@blockAttribute({ type: "sap.ui.core.TitleLevel", isPublic: true })
	headerLevel: TitleLevel = TitleLevel.Auto;

	/**
	 * Controls if the header text should be shown or not
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	headerVisible?: boolean;

	@blockAttribute({ type: "string", isPublic: true })
	id!: string;

	@blockAttribute({ type: "boolean", isPublic: true })
	isSearchable?: boolean;

	/**
	 * Personalization Mode
	 */
	@blockAttribute({ type: "string|boolean", isPublic: true })
	personalization?: string | boolean;

	/**
	 * Specifies whether the table should be read-only or not.
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	readOnly?: boolean;

	/**
	 * Allows to choose the Table type. Allowed values are `ResponsiveTable` or `GridTable`.
	 */
	@blockAttribute({ type: "string", isPublic: true })
	type?: string;

	/**
	 * Specifies whether the table is displayed with condensed layout (true/false). The default setting is `false`.
	 */
	@blockAttribute({ type: "boolean", isPublic: true })
	useCondensedLayout?: boolean;

	/**
	 * Specifies the selection mode (None,Single,Multi,Auto,ForceMulti,ForceSingle)
	 */
	@blockAttribute({ type: "string", isPublic: true })
	selectionMode?: string;

	@blockAttribute({ type: "string", isPublic: true })
	variantManagement?: string;

	//  *************** Private & Required Attributes ********************
	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: false,
		required: true,
		expectedTypes: ["EntitySet", "NavigationProperty", "Singleton"]
	})
	collection!: Context;

	//  *************** Private Attributes ********************
	@blockAttribute({ type: "string" })
	_apiId?: string;

	@blockAttribute({ type: "boolean" })
	autoBindOnInit?: boolean;

	collectionEntity: EntitySet | NavigationProperty;

	@blockAttribute({ type: "string" })
	columnEditMode?: string;

	@blockAttribute({ type: "string" })
	createNewAction?: string;

	@blockAttribute({ type: "string" })
	createOutbound?: string;

	createOutboundDetail?: NavigationTargetConfiguration["outboundDetail"];

	/**
	 * Specifies the full path and function name of a custom validation function.
	 */
	@blockAttribute({ type: "string" })
	customValidationFunction?: string;

	@blockAttribute({ type: "string" })
	dataStateIndicatorFilter?: string;

	/**
	 * Specifies whether the button is hidden when no data has been entered yet in the row (true/false). The default setting is `false`.
	 */
	@blockAttribute({ type: "boolean" })
	disableAddRowButtonForEmptyData?: boolean;

	@blockAttribute({ type: "boolean" })
	enableAutoColumnWidth?: boolean;

	@blockAttribute({ type: "boolean" })
	enableAutoScroll?: boolean;

	@blockAttribute({ type: "string" })
	fieldMode = "";

	/**
	 * The control ID of the FilterBar that is used internally to filter the rows of the table.
	 */
	@blockAttribute({ type: "string" })
	filterBarId?: string;

	@blockAttribute({ type: "number" })
	inlineCreationRowCount?: number;

	@blockAttribute({ type: "boolean" })
	isAlp?: boolean = false;

	@blockAttribute({ type: "boolean" })
	isCompactType?: boolean;

	@blockAttribute({ type: "boolean" })
	isOptimizedForSmallDevice?: boolean;

	/**
	 * ONLY FOR RESPONSIVE TABLE: Setting to define the checkbox in the column header: Allowed values are `Default` or `ClearAll`. If set to `Default`, the sap.m.Table control renders the Select All checkbox, otherwise the Deselect All button is rendered.
	 */
	@blockAttribute({ type: "string" })
	multiSelectMode?: string;

	/**
	 * Used for binding the table to a navigation path. Only the path is used for binding rows.
	 */
	@blockAttribute({ type: "string" })
	navigationPath?: string;

	/**
	 * Parameter which sets the noDataText for the mdc table
	 */
	@blockAttribute({ type: "string" })
	noDataText?: string;

	/**
	 * Specifies the possible actions available on the table row (Navigation,null). The default setting is `undefined`
	 */
	@blockAttribute({ type: "string" })
	rowAction?: string = undefined;

	@blockAttribute({ type: "string" })
	tableType?: string;

	@blockAttribute({ type: "string" })
	updatablePropertyPath?: string;

	@blockAttribute({ type: "boolean" })
	useBasicSearch?: boolean;

	@blockAttribute({ type: "boolean" })
	searchable?: boolean;

	/**
	 * ONLY FOR GRID TABLE: Number of indices which can be selected in a range. If set to 0, the selection limit is disabled, and the Select All checkbox appears instead of the Deselect All button.
	 */
	@blockAttribute({ type: "number" })
	selectionLimit?: number;

	@blockAttribute({ type: "string" })
	showCreate?: string | boolean;

	@blockAttribute({ type: "object", isPublic: true })
	tableDefinition!: TableVisualization; // We require tableDefinition to be there even though it is not formally required

	@blockAttribute({ type: "sap.ui.model.Context" })
	tableDefinitionContext?: Context;

	@blockAttribute({ type: "string" })
	tableDelegate?: string;

	@blockAttribute({ type: "string" })
	tabTitle = "";

	@blockAttribute({ type: "boolean" })
	visible?: boolean;

	/**
	 * The object with the formatting options
	 */
	@blockAttribute({
		type: "object",
		isPublic: true,
		validate: function (creationOptionsInput: TableCreationOptions) {
			if (creationOptionsInput.name && !["NewPage", "Inline", "InlineCreationRows", "External"].includes(creationOptionsInput.name)) {
				throw new Error(`Allowed value ${creationOptionsInput.name} for creationMode does not match`);
			}

			return creationOptionsInput;
		}
	})
	creationMode: TableCreationOptions = {};

	@blockAggregation({
		type: "sap.fe.macros.internal.table.Action | sap.fe.macros.internal.table.ActionGroup",
		isPublic: true,
		processAggregations: setCustomActionProperties
	})
	actions?: ActionOrActionGroup;

	@blockAggregation({
		type: "sap.fe.macros.internal.table.Column",
		isPublic: true,
		hasVirtualNode: true,
		processAggregations: setCustomColumnProperties
	})
	columns?: Record<string, Column>;

	convertedMetaData: ConvertedMetadata;

	contextObjectPath: DataModelObjectPath;

	pageTemplateType: TemplateType;

	/**
	 * Event handler to react when the user chooses a row
	 */
	@blockEvent()
	rowPress?: string;

	/**
	 * Event handler to react to the contextChange event of the table.
	 */
	@blockEvent()
	onContextChange?: string;

	/**
	 *  Event handler for change event.
	 */
	@blockEvent()
	onChange?: string;

	/**
	 * Event handler called when the user chooses an option of the segmented button in the ALP View
	 */
	@blockEvent()
	onSegmentedButtonPressed?: string;

	@blockEvent()
	variantSaved?: string;

	/**
	 * Event handler to react to the stateChange event of the table.
	 */
	@blockEvent()
	stateChange?: string;

	/**
	 * Event handler to react when the table selection changes
	 */
	@blockEvent()
	selectionChange?: string;

	@blockEvent()
	variantSelected?: string;

	/**
	 * Whether the collection is draft enabled or not
	 */
	_collectionIsDraftEnabled: boolean;

	constructor(props: PropertiesOf<TableBlock>, controlConfiguration: any, settings: any) {
		super(props, controlConfiguration, settings);
		const contextObjectPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath as Context);
		this.contextObjectPath = contextObjectPath;
		const pageContext = settings.bindingContexts.converterContext;
		this.pageTemplateType = pageContext?.getObject("/templateType");

		const tableDefinition = TableBlock.setUpTableDefinition(this, settings);
		this.collection = settings.models.metaModel.createBindingContext(tableDefinition.annotation.collection);
		this.convertedMetaData = this.contextObjectPath.convertedTypes;
		this.collectionEntity = this.convertedMetaData.resolvePath(this.tableDefinition.annotation.collection).target as EntitySet;

		this.setUpId();
		const converterContext = this.getConverterContext(this.contextObjectPath, this.contextPath?.getPath(), settings);
		this._collectionIsDraftEnabled =
			(converterContext.getManifestWrapper().isFilterBarHidden() && ModelHelper.isDraftNode(this.collectionEntity)) ||
			ModelHelper.isDraftRoot(this.collectionEntity);
		this.selectionMode = this.tableDefinition.annotation.selectionMode;
		this.enableFullScreen = this.tableDefinition.control.enableFullScreen;
		this.enableExport = this.tableDefinition.control.enableExport;
		const pasteAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Paste);
		this.enablePaste = pasteAction?.enabled;
		this.pasteVisible = pasteAction?.visible;
		this.frozenColumnCount = this.tableDefinition.control.frozenColumnCount;
		this.widthIncludingColumnHeader = this.tableDefinition.control.widthIncludingColumnHeader;
		this.rowCountMode = this.tableDefinition.control.rowCountMode;
		this.rowCount = this.tableDefinition.control.rowCount;
		this.updatablePropertyPath = this.tableDefinition.annotation.updatablePropertyPath;
		this.type = this.tableDefinition.control.type;
		this.disableAddRowButtonForEmptyData ??= this.tableDefinition.control.disableAddRowButtonForEmptyData;
		this.customValidationFunction ??= this.tableDefinition.control.customValidationFunction;
		this.headerVisible ??= this.tableDefinition.control.headerVisible;
		this.searchable ??= this.tableDefinition.annotation.searchable;
		this.inlineCreationRowCount ??= this.tableDefinition.control.inlineCreationRowCount;
		this.header ??= this.tableDefinition.annotation.title;
		this.selectionLimit ??= this.tableDefinition.control.selectionLimit;
		this.isCompactType ??= this.tableDefinition.control.isCompactType;
		this.creationMode.name ??= this.tableDefinition.annotation.create.mode as TableCreationOptions["name"];
		this.creationMode.createAtEnd ??= (this.tableDefinition.annotation.create as CreateBehavior).append;
		this.createOutbound ??= (this.tableDefinition.annotation.create as CreateBehaviorExternal).outbound;
		this.createNewAction ??= (this.tableDefinition.annotation.create as CreateBehavior).newAction;
		this.createOutboundDetail ??= (this.tableDefinition.annotation.create as CreateBehaviorExternal).outboundDetail;

		this.personalization ??= this.tableDefinition.annotation.p13nMode;
		this.variantManagement ??= this.tableDefinition.annotation.variantManagement;
		this.enableAutoColumnWidth ??= true;
		this.dataStateIndicatorFilter ??= this.tableDefinition.control.dataStateIndicatorFilter;
		this.isOptimizedForSmallDevice ??= CommonUtils.isSmallDevice();
		this.navigationPath = tableDefinition.annotation.navigationPath;
		if (tableDefinition.annotation.collection.startsWith("/") && isSingleton(contextObjectPath.startingEntitySet)) {
			tableDefinition.annotation.collection = this.navigationPath;
		}
		this.setReadOnly();
		if (this.rowPress) {
			this.rowAction = "Navigation";
		}
		this.rowPress ??= this.tableDefinition.annotation.row?.press;
		this.rowAction ??= this.tableDefinition.annotation.row?.action;
		this.selectionChange ??= this.buildEventHandlerWrapper(this.tableDefinition.control.selectionChange);

		if (this.personalization === "false") {
			this.personalization = undefined;
		} else if (this.personalization === "true") {
			this.personalization = "Sort,Column,Filter";
		}

		switch (this.personalization) {
			case "false":
				this.personalization = undefined;
				break;
			case "true":
				this.personalization = "Sort,Column,Filter";
				break;
			default:
		}

		if (this.isSearchable === false) {
			this.searchable = false;
		} else {
			this.searchable = this.tableDefinition.annotation.searchable;
		}

		// Auto bind on init if there's no filterbar (basic search doesn't count, that's why we calculate autoBindOnInit before setting filterBarID for basic search below)
		this.autoBindOnInit = !this.filterBar && !this.filterBarId;

		let useBasicSearch = false;

		// Note for the 'filterBar' property:
		// 1. ID relative to the view of the Table.
		// 2. Absolute ID.
		// 3. ID would be considered in association to TableAPI's ID.
		if (!this.filterBar && !this.filterBarId && this.searchable) {
			// filterBar: Public property for building blocks
			// filterBarId: Only used as Internal private property for FE templates
			this.filterBarId = generate([this.id, "StandardAction", "BasicSearch"]);
			useBasicSearch = true;
		}
		// Internal properties
		this.useBasicSearch = useBasicSearch;
		this.tableType = this.type;
		this.showCreate = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.visible || true;

		switch (this.readOnly) {
			case true:
				this.columnEditMode = "Display";
				break;
			case false:
				this.columnEditMode = "Editable";
				break;
			default:
				this.columnEditMode = undefined;
		}
	}

	/**
	 * Returns the annotation path pointing to the visualization annotation (LineItem).
	 *
	 * @param contextObjectPath The datamodel object path for the table
	 * @param converterContext The converter context
	 * @returns The annotation path
	 */
	static getVisualizationPath(contextObjectPath: DataModelObjectPath, converterContext: ConverterContext): string {
		const metaPath = getContextRelativeTargetObjectPath(contextObjectPath) as string;

		// fallback to default LineItem if metapath is not set
		if (!metaPath) {
			Log.error(`Missing meta path parameter for LineItem`);
			return `@${UIAnnotationTerms.LineItem}`;
		}

		if (contextObjectPath.targetObject.term === UIAnnotationTerms.LineItem) {
			return metaPath; // MetaPath is already pointing to a LineItem
		}
		//Need to switch to the context related the PV or SPV
		const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);

		let visualizations: VisualizationAndPath[] = [];
		switch (contextObjectPath.targetObject.term) {
			case UIAnnotationTerms.SelectionPresentationVariant:
				if (contextObjectPath.targetObject.PresentationVariant) {
					visualizations = getVisualizationsFromPresentationVariant(
						contextObjectPath.targetObject.PresentationVariant,
						metaPath,
						resolvedTarget.converterContext,
						true
					);
				}
				break;

			case UIAnnotationTerms.PresentationVariant:
				visualizations = getVisualizationsFromPresentationVariant(
					contextObjectPath.targetObject,
					metaPath,
					resolvedTarget.converterContext,
					true
				);
				break;

			default:
				Log.error(`Bad metapath parameter for table : ${contextObjectPath.targetObject.term}`);
		}

		const lineItemViz = visualizations.find((viz) => {
			return viz.visualization.term === UIAnnotationTerms.LineItem;
		});

		if (lineItemViz) {
			return lineItemViz.annotationPath;
		} else {
			// fallback to default LineItem if annotation missing in PV
			Log.error(`Bad meta path parameter for LineItem: ${contextObjectPath.targetObject.term}`);
			return `@${UIAnnotationTerms.LineItem}`; // Fallback
		}
	}

	static getPresentationPath(contextObjectPath: DataModelObjectPath): string | undefined {
		let presentationPath;

		switch (contextObjectPath.targetObject?.term) {
			case UIAnnotationTerms.PresentationVariant:
				presentationPath = getContextRelativeTargetObjectPath(contextObjectPath);
				break;
			case UIAnnotationTerms.SelectionPresentationVariant:
				presentationPath = getContextRelativeTargetObjectPath(contextObjectPath) + "/PresentationVariant";
				break;
		}

		return presentationPath;
	}

	static setUpTableDefinition(table: TableBlock, settings: any): TableVisualization {
		let tableDefinition = table.tableDefinition;
		if (!tableDefinition) {
			const initialConverterContext = table.getConverterContext(table.contextObjectPath, table.contextPath?.getPath(), settings);
			const visualizationPath = TableBlock.getVisualizationPath(table.contextObjectPath, initialConverterContext);
			const presentationPath = TableBlock.getPresentationPath(table.contextObjectPath);

			//Check if we have ActionGroup and add nested actions

			const extraParams: any = {};
			const tableSettings = {
				enableExport: table.enableExport,
				frozenColumnCount: table.frozenColumnCount,
				widthIncludingColumnHeader: table.widthIncludingColumnHeader,
				rowCountMode: table.rowCountMode,
				rowCount: table.rowCount,
				enableFullScreen: table.enableFullScreen,
				enablePaste: table.enablePaste,
				selectionMode: table.selectionMode,
				type: table.type,
				creationMode: {
					name: table.creationMode.name,
					createAtEnd: table.creationMode.createAtEnd,
					inlineCreationRowsHiddenInEditMode: table.creationMode.inlineCreationRowsHiddenInEditMode
				}
			};

			if (table.actions) {
				Object.values(table.actions)?.forEach((item) => {
					table.actions = { ...table.actions, ...(item as ExtendedActionGroup).menuContentActions };
					delete (item as ExtendedActionGroup).menuContentActions;
				});
			}

			// table actions and columns as {} if not provided to allow merge with manifest settings
			extraParams[visualizationPath] = {
				actions: table.actions || {},
				columns: table.columns || {},
				tableSettings: tableSettings
			};
			const converterContext = table.getConverterContext(
				table.contextObjectPath,
				table.contextPath?.getPath(),
				settings,
				extraParams
			);

			const visualizationDefinition = getDataVisualizationConfiguration(
				visualizationPath,
				table.useCondensedLayout,
				converterContext,
				undefined,
				undefined,
				presentationPath,
				true
			);

			tableDefinition = visualizationDefinition.visualizations[0] as TableVisualization;
			table.tableDefinition = tableDefinition;
		}
		table.tableDefinitionContext = MacroAPI.createBindingContext(table.tableDefinition as object, settings);

		return tableDefinition;
	}

	setUpId() {
		if (this.id) {
			// The given ID shall be assigned to the TableAPI and not to the MDC Table
			this._apiId = this.id;
			this.id = this.getContentId(this.id);
		} else {
			// We generate the ID. Due to compatibility reasons we keep it on the MDC Table but provide assign
			// the ID with a ::Table suffix to the TableAPI
			const tableDefinition = this.tableDefinition;
			this.id ??= tableDefinition.annotation.id;
			this._apiId = generate([tableDefinition.annotation.id, "Table"]);
		}
	}

	setReadOnly() {
		// Special code for readOnly
		// readonly = false -> Force editable
		// readonly = true -> Force display mode
		// readonly = undefined -> Bound to edit flow
		if (this.readOnly === undefined && this.tableDefinition.annotation.displayMode === true) {
			this.readOnly = true;
		}
	}

	getTableType = () => {
		const collection = this.collection.getObject();
		switch (this.tableType) {
			case "GridTable":
				return xml`<mdcTable:GridTableType
                rowCountMode="${this.tableDefinition.control.rowCountMode}"
                rowCount="${this.tableDefinition.control.rowCount}"
                selectionLimit="${this.selectionLimit}"
				fixedColumnCount="${this.tableDefinition.control.frozenColumnCount}"
            />`;
			case "TreeTable":
				return xml`<mdcTable:TreeTableType
                rowCountMode="${this.tableDefinition.control.rowCountMode}"
                rowCount="${this.tableDefinition.control.rowCount}"
				fixedColumnCount="${this.tableDefinition.control.frozenColumnCount}"
            />`;
			default:
				const growingMode = collection.$kind === "EntitySet" ? "Scroll" : undefined;
				return xml`<mdcTable:ResponsiveTableType
                showDetailsButton="true"
                detailsButtonSetting="{=['Low', 'Medium', 'None']}"
                growingMode="${growingMode}"
            />`;
		}
	};

	_getEntityType() {
		return (this.collectionEntity as EntitySet)?.entityType || (this.collectionEntity as NavigationProperty)?.targetType;
	}

	/**
	 * Generates the template string for the valueHelp based on the dataField path.
	 *
	 * @param dataFieldPath DataFieldPath to be evaluated
	 * @param isMultiValueField
	 * @returns The xml string representation of the valueHelp
	 */
	getValueHelpTemplateFromPath(dataFieldPath?: string, isMultiValueField?: boolean): string {
		return dataFieldPath
			? `<macros:ValueHelp
					idPrefix="${generate([this.id, "TableValueHelp"])}"
					property="${dataFieldPath}/Value"
					${isMultiValueField === true ? 'useMultiValueField="true"' : ""}
				/>`
			: "";
	}

	/**
	 * Generates the template string for the valueHelp based on column.
	 *
	 * @param column Column to be evaluated
	 * @returns The xml string representation of the valueHelp
	 */
	getValueHelp(column: AnnotationTableColumn) {
		const dataFieldObject = this.convertedMetaData.resolvePath(column.annotationPath).target as DataFieldAbstractTypes;
		if (isDataFieldForAnnotation(dataFieldObject) && dataFieldObject.Target.$target?.term === UIAnnotationTerms.Chart) {
			return ``;
		} else if (isDataFieldForAnnotation(dataFieldObject) && dataFieldObject.Target.$target?.term === UIAnnotationTerms.FieldGroup) {
			let template = ``;
			for (const index in dataFieldObject.Target.$target.Data) {
				template += this.getValueHelpTemplateFromPath(column.annotationPath + "/Target/$AnnotationPath/Data/" + index);
			}
			return xml`${template}`;
		} else {
			if (isDataFieldTypes(dataFieldObject)) {
				const propertyDataModelObject = enhanceDataModelPath(this.contextObjectPath, dataFieldObject.Value.path);
				const relativeNavigationProperties = getPathRelativeLocation(
					this.contextObjectPath,
					propertyDataModelObject.navigationProperties
				);
				if (isMultipleNavigationProperty(relativeNavigationProperties[relativeNavigationProperties.length - 1])) {
					return xml`${this.getValueHelpTemplateFromPath(column.annotationPath, true)}`;
				}
			}
			return xml`${this.getValueHelpTemplateFromPath(column.annotationPath)}`;
		}
	}

	getDependents = () => {
		let dependents = ``;
		const cutAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Cut) as StandardAction | undefined;
		if (cutAction?.isTemplated === "true") {
			dependents += xml`<control:CommandExecution
			execute="API.onCut"
			command="Cut"
			enabled="${cutAction.enabled}"
			/>`;
		}
		const pasteAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Paste) as StandardAction | undefined;
		if (pasteAction?.visible !== "false" && this.tableType === "TreeTable")
			dependents += xml`<control:CommandExecution
			execute="API.onPaste"
			command="Paste"
			enabled="${pasteAction?.enabled}"
			/>`;

		if (!this.readOnly && this.tableDefinition?.columns) {
			for (const column of this.tableDefinition.columns) {
				if (column.availability === "Default" && "annotationPath" in column) {
					dependents += this.getValueHelp(column);
				}
			}
		}
		const createAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create) as StandardAction | undefined;
		const deleteAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Delete) as StandardAction | undefined;

		if (
			this.tableDefinition.annotation.isInsertUpdateActionsTemplated &&
			createAction?.isTemplated === "true" &&
			this.tableDefinition.control.nodeType === undefined
		) {
			// The shortcut is not enabled in case of a create menu (i.e. when nodeType is defined)
			dependents += xml`<control:CommandExecution
                                execute="${TableHelper.pressEventForCreateButton(this, true)}"
                                visible="${createAction.visible}"
                                enabled="${createAction.enabled}"
                                command="Create"
                            />`;
		}
		if (deleteAction?.isTemplated === "true") {
			const headerInfo = (
				(this.collectionEntity as EntitySet)?.entityType || (this.collectionEntity as NavigationProperty)?.targetType
			)?.annotations?.UI?.HeaderInfo;
			dependents += xml`<control:CommandExecution
                        execute="${TableHelper.pressEventForDeleteButton(
							this,
							this.collectionEntity.name,
							headerInfo,
							this.contextObjectPath
						)}"
                        visible="${deleteAction.visible}"
                        enabled="${deleteAction.enabled}"
                        command="DeleteEntry"
                        />`;
		}

		for (const actionName in this.tableDefinition.commandActions) {
			const action = this.tableDefinition.commandActions[actionName];
			dependents += `${this.getActionCommand(actionName, action)}`;
		}
		dependents += `<control:CommandExecution execute="TableRuntime.displayTableSettings" command="TableSettings" />`;
		if (this.variantManagement === "None") {
			dependents += `<!-- Persistence provider offers persisting personalization changes without variant management -->
			<p13n:PersistenceProvider id="${generate([this.id, "PersistenceProvider"])}" for="${this.id}" />`;
		}

		if (this.tableType && ["GridTable", "TreeTable"].includes(this.tableType)) {
			dependents += xml`<plugins:CellSelector enabled="${compileExpression(
				or(this.tableType !== "TreeTable", not(this.getDragAndDropEnabled()))
			)}" rangeLimit= "200"/>`;
		}

		return xml`${dependents}`;
	};

	/**
	 * Generates the template string for the actionCommand.
	 *
	 * @param actionName The name of the action
	 * @param action Action to be evaluated
	 * @returns The xml string representation of the actionCommand
	 */
	getActionCommand(actionName: string, action: CustomAction) {
		const dataField = action.annotationPath
			? (this.convertedMetaData.resolvePath(action.annotationPath).target as DataFieldForAction | DataFieldForIntentBasedNavigation)
			: undefined;
		const actionContextPath = action.annotationPath
			? CommonHelper.getActionContext(this.metaPath.getModel().createBindingContext(action.annotationPath + "/Action")!)
			: undefined;
		const actionContext = this.metaPath.getModel().createBindingContext(actionContextPath);
		const dataFieldDataModelObjectPath = actionContext
			? MetaModelConverter.getInvolvedDataModelObjects(actionContext, this.collection)
			: undefined;
		const isBound = (dataField as DataFieldForAction)?.ActionTarget?.isBound;
		const isOperationAvailable =
			(dataField as DataFieldForAction)?.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false;
		const displayCommandAction = action.type === "ForAction" ? isBound !== true || isOperationAvailable : true;
		if (displayCommandAction) {
			return xml`<internalMacro:ActionCommand
							action="{tableDefinition>commandActions/${actionName}}"
							onExecuteAction="${TableHelper.pressEventDataFieldForActionButton(
								{
									contextObjectPath: this.contextObjectPath,
									id: this.id
								},
								dataField as DataFieldForAction,
								this.collectionEntity.name,
								this.tableDefinition.operationAvailableMap,
								actionContext?.getObject(),
								action.isNavigable,
								action.enableAutoScroll,
								action.defaultValuesExtensionFunction
							)}"
							onExecuteIBN="${CommonHelper.getPressHandlerForDataFieldForIBN(
								dataField,
								"${internal>selectedContexts}",
								!this.tableDefinition.enableAnalytics
							)}"
							onExecuteManifest="${action.noWrap ? action.press : CommonHelper.buildActionWrapper(action, this)}"
							isIBNEnabled="${
								action.enabled ??
								TableHelper.isDataFieldForIBNEnabled(
									this,
									dataField! as DataFieldForIntentBasedNavigation,
									!!(dataField as DataFieldForIntentBasedNavigation).RequiresContext,
									(dataField as DataFieldForIntentBasedNavigation).NavigationAvailable
								)
							}"
							isActionEnabled="${
								action.enabled ??
								TableHelper.isDataFieldForActionEnabled(
									this.tableDefinition,
									(dataField! as DataFieldForAction).Action,
									!!isBound,
									actionContextPath,
									action.enableOnSelect,
									dataFieldDataModelObjectPath?.targetEntityType
								)
							}"
							/>`;
		}
		return ``;
	}

	getActions = () => {
		let dependents = "";
		if (this.onSegmentedButtonPressed) {
			dependents = `<mdcat:ActionToolbarAction
            layoutInformation="{
                    aggregationName: 'end',
                    alignment: 'End'
                }"
            visible="{= \${pageInternal>alpContentView} === 'Table' }"
        >
            <SegmentedButton
                id="${generate([this.id, "SegmentedButton", "TemplateContentView"])}"
                select="${this.onSegmentedButtonPressed}"
                selectedKey="{pageInternal>alpContentView}"
            >
                <items>`;

			if (CommonHelper.isDesktop()) {
				dependents += `<SegmentedButtonItem
                            tooltip="{sap.fe.i18n>M_COMMON_HYBRID_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
							key = "Hybrid"
							icon = "sap-icon://chart-table-view"
							/>`;
			}
			dependents += `<SegmentedButtonItem
                        tooltip="{sap.fe.i18n>M_COMMON_CHART_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
                        key="Chart"
                        icon="sap-icon://bar-chart"
                    />
                    <SegmentedButtonItem
                        tooltip="{sap.fe.i18n>M_COMMON_TABLE_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
                        key="Table"
                        icon="sap-icon://table-view"
                    />
                </items>
            </SegmentedButton>
        </mdcat:ActionToolbarAction>`;
		}

		dependents += `${getTableActionTemplate(this)}`;
		return xml`${dependents}`;
	};

	/**
	 * Generates the binding expression for the drag and drop enablement.
	 *
	 * @returns The binding expression
	 */
	getDragAndDropEnabled(): BindingToolkitExpression<boolean> {
		const isPathUpdatableOnNavigation = isPathUpdatable(this.contextObjectPath, {
			ignoreTargetCollection: true,
			authorizeUnresolvable: true,
			pathVisitor: (path: string, navigationPaths: string[]) =>
				singletonPathVisitor(path, this.contextObjectPath.convertedTypes, navigationPaths)
		});
		const isPathUpdatableOnTarget = isPathUpdatable(this.contextObjectPath, {
			authorizeUnresolvable: true,
			pathVisitor: (path: string, navigationPaths: string[]) =>
				singletonPathVisitor(path, this.contextObjectPath.convertedTypes, navigationPaths)
		});

		return and(
			isPathUpdatableOnNavigation._type === "Unresolvable"
				? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true))
				: isPathUpdatableOnNavigation,
			pathInModel("/isEditable", "ui")
		);
	}

	/**
	 * Generates the template string for the drag and drop config.
	 *
	 * @returns The xml string representation of the drag and drop config
	 */
	getDragAndDropConfig(): string {
		if (this.tableType === "TreeTable") {
			return xml`<mdc:dragDropConfig>
				<mdcTable:DragDropConfig
					enabled="${compileExpression(this.getDragAndDropEnabled())}"
					dropPosition="OnOrBetween"
					draggable="true"
					droppable="true"
					dragStart="API.onDragStartDocument"
					dragEnter="API.onDragEnterDocument"
					drop="API.onDropDocument"
				/>
			</mdc:dragDropConfig>`;
		}
		return "";
	}

	/**
	 * Generates the template string for the CreationRow.
	 *
	 * @returns The xml string representation of the CreationRow
	 */
	getCreationRow() {
		if ((this.creationMode.name as string) === CreationMode.CreationRow) {
			const creationRowAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.CreationRow) as
				| StandardAction
				| undefined;
			if (creationRowAction?.isTemplated) {
				return xml`<mdc:creationRow>
							<mdcTable:CreationRow
								id="${generate([this.id, CreationMode.CreationRow])}"
								visible="${creationRowAction.visible}"
								apply="${TableHelper.pressEventForCreateButton(this, false)}"
								applyEnabled="${creationRowAction.enabled}"
								macrodata:disableAddRowButtonForEmptyData="${this.disableAddRowButtonForEmptyData}"
								macrodata:customValidationFunction="${this.customValidationFunction}"
							/>
					   	   </mdc:creationRow>`;
			}
		}
		return "";
	}

	getRowSetting() {
		let rowSettingsTemplate = `<mdcTable:RowSettings
        navigated="${this.tableDefinition.annotation.row?.rowNavigated}"
        highlight="${this.tableDefinition.annotation.row?.rowHighlighting}"
        >`;
		if (this.rowAction === "Navigation") {
			rowSettingsTemplate += `<mdcTable:rowActions>
                <mdcTable:RowActionItem
                    type = "${this.rowAction}"
                    press = "${this.tableType === "ResponsiveTable" ? "" : this.rowPress}"
                    visible = "${this.tableDefinition.annotation.row?.visible}"
                    />
                </mdcTable:rowActions>`;
		}
		rowSettingsTemplate += `</mdcTable:RowSettings>`;
		return xml`${rowSettingsTemplate}`;
	}

	getVariantManagement() {
		if (this.variantManagement === "Control") {
			return xml`<mdc:variant>
                        <variant:VariantManagement
                            id="${generate([this.id, "VM"])}"
                            for="{this>id}"
                            showSetAsDefault="true"
                            select="{this>variantSelected}"
                            headerLevel="${this.headerLevel}"
                            save="${this.variantSaved}"
                        />
                    </mdc:variant>`;
		}
		return "";
	}

	getQuickFilter() {
		if (this.tableDefinition.control.filters?.quickFilters) {
			const quickFilters = this.tableDefinition.control.filters.quickFilters;
			return xml`<mdc:quickFilter>
						<macroTable:QuickFilterSelector
							id="${generate([this.id, "QuickFilterContainer"])}"
							metaPath="${this.metaPath}"
							filterConfiguration="${quickFilters}"
							onSelectionChange="API.onQuickFilterSelectionChange"
						/>
					</mdc:quickFilter>`;
		}
		return "";
	}

	/**
	 * Generates the template string for the CopyProvider.
	 *
	 * @returns The xml string representation of the CopyProvider
	 */
	getCopyProvider(): string {
		return xml`<mdc:copyProvider>
						<plugins:CopyProvider 
						visible="${this.tableType === "TreeTable" ? not(pathInModel("/isEditable", "ui")) : true}"
						/>
					</mdc:copyProvider>`;
	}

	getEmptyRowsEnabled() {
		return this.creationMode.name === CreationMode.InlineCreationRows
			? this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Create)?.enabled
			: undefined;
	}

	buildEventHandlerWrapper(eventHandler?: ExternalMethodConfig): string | undefined {
		if (!eventHandler) {
			return undefined;
		}

		// FPM.getCustomFunction returns a function, that's why we have 2 nested function calls below
		return compileExpression(
			fn(
				compileExpression(fn("FPM.getCustomFunction", [eventHandler.moduleName, eventHandler.methodName, ref("$event")])) as string,
				[ref("$event")]
			)
		);
	}

	/**
	 * Generates the template string for the required modules.
	 *
	 * @returns The list of required modules
	 */
	getCoreRequire(): string {
		const customModules = this.tableDefinition.control.additionalRequiredModules ?? [];

		return `TableRuntime: 'sap/fe/macros/table/TableRuntime', API: 'sap/fe/macros/table/TableAPI'${customModules
			.map((module: string, index: number) => `, customModule${index + 1}: '${module}'`)
			.join("")}`;
	}

	getTemplate() {
		const headerBindingExpression = buildExpressionForHeaderVisible(this);
		if (this.rowPress) {
			this.rowAction = "Navigation";
		}
		this.rowPress ??= this.tableDefinition.annotation.row?.press;
		const collectionDeletablePath = (
			(this.collectionEntity as EntitySet).annotations.Capabilities?.DeleteRestrictions
				?.Deletable as PathAnnotationExpression<boolean>
		)?.path;
		const lineItem = TableHelper.getUiLineItemObject(this.metaPath, this.convertedMetaData) as
			| DataFieldForIntentBasedNavigation[]
			| undefined;
		const delegate = TableHelper.getDelegate?.(
			this.tableDefinition,
			(this.isAlp as boolean)?.toString(),
			this.tableDefinition.annotation.entityName
		);
		const selectionChange = `TableRuntime.setContexts(\${$source>/}, '${collectionDeletablePath}', '${(
			this.collectionEntity as EntitySet
		).annotations.Common?.DraftRoot}', '${this.tableDefinition.operationAvailableMap}', '${TableHelper.getNavigationAvailableMap(
			lineItem
		)}', '${ActionHelper.getMultiSelectDisabledActions(lineItem)}', '${this.updatablePropertyPath}')`;

		const entityType = this._getEntityType();

		const modelContextChange =
			this.tableType === "TreeTable"
				? `TableRuntime.onTreeTableContextChanged(\${$source>/}, ${this.tableDefinition.annotation.initialExpansionLevel})`
				: undefined;

		const pasteAction = this.tableDefinition.actions.find((a) => a.key === StandardActionKeys.Paste);

		const createEnablementRequire =
			this.tableDefinition.control.createEnablement &&
			!this.tableDefinition.control.createEnablement.moduleName.startsWith("/extension/")
				? `{_createEnablement: '${this.tableDefinition.control.createEnablement.moduleName}'}`
				: undefined;

		return xml`
            <macroTable:TableAPI
                xmlns="sap.m"
                xmlns:mdc="sap.ui.mdc"
                xmlns:plugins="sap.m.plugins"
                xmlns:mdcTable="sap.ui.mdc.table"
                xmlns:macroTable="sap.fe.macros.table"
                xmlns:mdcat="sap.ui.mdc.actiontoolbar"
                xmlns:core="sap.ui.core"
                xmlns:control="sap.fe.core.controls"
                xmlns:dt="sap.ui.dt"
                xmlns:fl="sap.ui.fl"
                xmlns:variant="sap.ui.fl.variants"
                xmlns:p13n="sap.ui.mdc.p13n"
                xmlns:internalMacro="sap.fe.macros.internal"
                xmlns:unittest="http://schemas.sap.com/sapui5/preprocessorextension/sap.fe.unittesting/1"
                xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
                binding="{internal>controls/${this.id}}"
                id="${this._apiId}"
                tableDefinition="{_pageModel>${this.tableDefinitionContext!.getPath()}}"
                entityTypeFullyQualifiedName="${entityType?.fullyQualifiedName}"
                metaPath="${this.metaPath?.getPath()}"
                contextPath="${this.contextPath?.getPath()}"
                stateChange="${this.stateChange}"
                selectionChange="${this.selectionChange}"
				contextChange="${this.onContextChange}"
                readOnly="${this.readOnly}"
                filterBar="${this.filterBar}"
                macrodata:tableAPILocalId="${this._apiId}"
                emptyRowsEnabled="${this.getEmptyRowsEnabled()}"
                enableAutoColumnWidth="${this.enableAutoColumnWidth}"
                isOptimizedForSmallDevice="${this.isOptimizedForSmallDevice}"
				widthIncludingColumnHeader="${this.widthIncludingColumnHeader}"
            >
				<template:with path="collection>${CommonHelper.getTargetCollectionPath(this.collection)}" var="targetCollection">
                <macroTable:layoutData>
                    <FlexItemData maxWidth="100%" />
                </macroTable:layoutData>
                <!-- macrodata has to be an expression binding if it needs to be set as attribute via change handler during templating -->
                    <mdc:Table
                        unittest:id="TableMacroFragment"
						core:require="{${this.getCoreRequire()}}"
                        fl:flexibility="{this>fl:flexibility}"
                        sortConditions="${this.tableDefinition.annotation.sortConditions}"
                        groupConditions="${CommonHelper.stringifyObject(this.tableDefinition.annotation.groupConditions as string)}"
                        aggregateConditions="${CommonHelper.stringifyObject(this.tableDefinition.annotation.aggregateConditions as string)}"
                        dt:designtime="${this.variantManagement === "None" ? "not-adaptable" : undefined}"
                        macrodata:kind="${this.collectionEntity._type}"
                        macrodata:navigationPath="${this.navigationPath}"
                        id="${this.id}"
                        busy="${this.busy}"
                        busyIndicatorDelay="0"
                        enableExport="${this.enableExport}"
                        delegate="${delegate}"
                        rowPress="${this.tableType === "ResponsiveTable" ? this.rowPress : undefined}"
                        height="100%"
                        autoBindOnInit="${this.autoBindOnInit}"
                        selectionMode="${this.selectionMode || "None"}"
                        selectionChange="${selectionChange}"
                        showRowCount="${this.tableDefinition.control.showRowCount}"
                        ${this.attr("header", this.header)}
                        headerVisible="${headerBindingExpression}"
                        headerLevel="${this.headerLevel}"
                        threshold="${this.tableDefinition.annotation.threshold}"
                        noData="${this.noDataText}"
                        p13nMode="${this.personalization}"
                        filter="${this.filterBarId}"
                        paste="API.onPaste($event, $controller)"
                        beforeExport="API.onBeforeExport($event)"
                        class="${this.tableDefinition.control.useCondensedTableLayout === true ? "sapUiSizeCondensed" : undefined}"
                        multiSelectMode="${this.tableDefinition.control.multiSelectMode}"
                        showPasteButton="${this.tableType === "TreeTable" ? "false" : pasteAction?.visible}"
                        enablePaste="${this.tableType === "TreeTable" ? "false" : pasteAction?.enabled}"
                        macrodata:rowsBindingInfo="${TableHelper.getRowsBindingInfo(this)}"
                        macrodata:enableAnalytics="${this.tableDefinition.enableAnalytics}"
                        macrodata:creationMode="${this.creationMode.name}"
                        macrodata:inlineCreationRowCount="${this.inlineCreationRowCount}"
                        macrodata:showCreate="${this.showCreate}"
                        macrodata:createAtEnd="${this.creationMode.createAtEnd}"
                        macrodata:enableAutoScroll="${this.enableAutoScroll}"
                        macrodata:displayModePropertyBinding="${this.readOnly}"
                        macrodata:tableType="${this.tableType}"
                        macrodata:targetCollectionPath="${CommonHelper.getContextPath(null, { context: this.collection })}"
                        macrodata:entityType="${CommonHelper.getContextPath(null, { context: this.collection }) + "/"}"
                        macrodata:metaPath="${CommonHelper.getContextPath(null, { context: this.collection })}"
                        macrodata:onChange="${this.onChange}"
                        macrodata:hiddenFilters="${TableHelper.formatHiddenFilters(this.tableDefinition.control.filters?.hiddenFilters)}"
                        macrodata:requestGroupId="$auto.Workers"
                        macrodata:segmentedButtonId="${generate([this.id, "SegmentedButton", "TemplateContentView"])}"
                        macrodata:enablePaste="${this.tableType === "TreeTable" ? "false" : this.enablePaste}"
                        macrodata:operationAvailableMap="${CommonHelper.stringifyCustomData(this.tableDefinition.operationAvailableMap)}"
                        visible="${this.visible}"
						modelContextChange="${modelContextChange}"
                    >
                        <mdc:dataStateIndicator>
                            <plugins:DataStateIndicator
                                filter="${this.dataStateIndicatorFilter}"
                                enableFiltering="true"
                                dataStateChange="API.onDataStateChange"
                            />
                        </mdc:dataStateIndicator>
                        <mdc:type>
                            ${this.getTableType()}
                        </mdc:type>
                        <mdc:dependents>
                            ${this.getDependents()}
                        </mdc:dependents>
                        <mdc:actions>
                            ${this.getActions()}
                        </mdc:actions>
                        <mdc:rowSettings>
                        ${this.getRowSetting()}
                        </mdc:rowSettings>
                        <mdc:columns>
                            <core:Fragment fragmentName="sap.fe.macros.table.Columns" type="XML" />
                        </mdc:columns>
						${this.getDragAndDropConfig()}
                        ${this.getCreationRow()}
                        ${this.getVariantManagement()}
                        ${this.getQuickFilter()}
                        ${this.getCopyProvider()}
                    </mdc:Table>
				</template:with>
            </macroTable:TableAPI>
        `;
	}
}
