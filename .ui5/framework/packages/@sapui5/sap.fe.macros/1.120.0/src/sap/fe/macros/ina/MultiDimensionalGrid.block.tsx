import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import { controllerExtensionHandler } from "sap/fe/core/controllerextensions/HookSupport";
import type FilterBar from "sap/fe/core/controls/FilterBar";
import type { MultiDimensionalGridDimensionMapping } from "sap/fe/core/converters/ManifestSettings";
import { defineReference } from "sap/fe/core/helpers/ClassSupport";
import type { Ref } from "sap/fe/core/jsx-runtime/jsx";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import FilteringContextMenuHandler from "sap/fe/macros/ina/FilteringContextMenuHandler";
import NavigationContextMenuHandler from "sap/fe/macros/ina/NavigationContextMenuHandler";
import type FlexAnalysis from "sap/sac/df/FlexAnalysis";
import type MultiDimModelChangeHandler from "sap/sac/df/changeHandler/MultiDimModelChangeHandler";
import type MemberFilter from "sap/sac/df/model/MemberFilter";
import type View from "sap/ui/core/mvc/View";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Model from "sap/ui/model/Model";

export type MultiDimModelEx = Model & {
	loaded: () => Promise<void>;
	getDataProvider: (string?: string) => MultiDimDataProviderEx;
};

export type MultiDimDataProviderEx = {
	getResultSet: (boolean: boolean) => Promise<unknown>;
	getDimension: (string: string) => {
		removeMemberFilter(): unknown;
		setMemberFilter(memberFilters: MemberFilter[]): unknown;
	};
	Dimensions: Record<string, unknown>;
	Grid?: {
		Cells?: Cell[];
	};
};

export type ContextMenuHandlerGridContext = {
	Grid: {
		SelectedCells: {
			columnIndex: number;
			rowIndex: number;
		}[];
	};
};
export type ContextMenuHandler = {
	isActionVisible(key: string, context: ContextMenuHandlerGridContext): Promise<boolean>;
	isActionEnabled(key: string, context: ContextMenuHandlerGridContext): Promise<boolean>;
	getActionDescription(key: string, context: ContextMenuHandlerGridContext): Promise<{ Text: string; Icon: string }>;
	triggerAction(key: string, context: ContextMenuHandlerGridContext): Promise<void>;
};

export type FlexAnalysisEx = FlexAnalysis & {
	setBlocked(boolean: boolean): void;
	addContextMenuAction(Target: string, Handler: ContextMenuHandler): void;
};

export type Cell = {
	Row: number;
	Column: number;
	Member: string;
	Dimension: string;
};

/**
 * Building block for creating a DragonFly multidimensional grid
 * operating on a {@link MultiDimModel} and interacting with a {@link FilterBar}
 * and the page context.
 *
 * @experimental
 */
@defineBuildingBlock({ name: "MultiDimensionalGrid", namespace: "sap.fe.macros.internal", libraries: ["sap/sac/df"] })
export default class MultiDimensionalGridBlock extends RuntimeBuildingBlock {
	@blockAttribute({ type: "string", required: true })
	public id!: string;

	@blockAttribute({ type: "string", required: false })
	public variantManagementId?: string;

	@blockAttribute({ type: "string", required: true })
	public modelName!: string;

	@blockAttribute({ type: "string", required: true })
	public dataProviderName!: string;

	@blockAttribute({ type: "string", required: false })
	public filterBar?: string;

	@blockAttribute({ type: "string", required: false })
	public height = "100%";

	@blockAttribute({ type: "string", required: false })
	public width = "100%";

	@blockAttribute({ type: "object", required: false })
	public dimensionMapping: MultiDimensionalGridDimensionMapping = {};

	@defineReference()
	private flexAnalysisControl!: Ref<FlexAnalysisEx>;

	@defineReference()
	private multiDimModelChangeHandler!: Ref<MultiDimModelChangeHandler>;

	private dataProvider?: MultiDimDataProviderEx;

	private refreshPromise: Promise<unknown> = Promise.resolve();

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private static FlexAnalysisControl?: typeof FlexAnalysis;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private static MultiDimModelChangeHandlerControl?: typeof MultiDimModelChangeHandler;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private static MemberFilter?: typeof MemberFilter;

	/**
	 * Lazily loads the FlexAnalysis control.
	 *
	 * @returns MultiDimensionalGridBlock class
	 */
	static async load(): Promise<typeof MultiDimensionalGridBlock> {
		await super.load();
		if (MultiDimensionalGridBlock.FlexAnalysisControl === undefined) {
			const { default: control } = await import("sap/sac/df/FlexAnalysis");
			MultiDimensionalGridBlock.FlexAnalysisControl = control;
		}
		if (MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl === undefined) {
			const { default: control } = await import("sap/sac/df/changeHandler/MultiDimModelChangeHandler");
			MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl = control;
		}
		if (MultiDimensionalGridBlock.MemberFilter === undefined) {
			const { default: control } = await import("sap/sac/df/model/MemberFilter");
			MultiDimensionalGridBlock.MemberFilter = control;
		}
		return this;
	}

	/**
	 * Creates the content of this block, which is a single multidimensional grid
	 * represented by the control {@link FlexAnalysis}.
	 *
	 * @param view
	 * @param appComponent
	 * @returns The created control
	 */
	getContent(view: View, appComponent: AppComponent): FlexAnalysis | undefined {
		// Asynchronously attach event handlers once the view and data provider are ready
		Promise.all([MultiDimensionalGridBlock.waitForViewInitialization(view), this.prepareDataProvider(appComponent)])
			.then(() => this.attachFiltering(view))
			.then(() => this.addNavigationContextMenu(appComponent, view))
			.catch((error: unknown) =>
				Log.error(
					`Could not initialize the DragonFly data provider '${this.dataProviderName}' of model '${this.modelName}'!`,
					error as Error
				)
			);

		if (!MultiDimensionalGridBlock.FlexAnalysisControl || !MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl) {
			Log.error("sap/sac/df/FlexAnalysis or sap/sac/df/changeHandler/MultiDimModelChangeHandler could not be loaded!");
			return undefined;
		}

		return (
			<MultiDimensionalGridBlock.FlexAnalysisControl
				id={this.id}
				ref={this.flexAnalysisControl}
				multiDimModelId={this.modelName}
				dataProvider={this.dataProviderName}
				clientIdentifier="UI5"
				blocked="false"
				hideToolBar="true"
				hideFilterLine="true"
				height={this.height}
				width={this.width}
				configId="fe"
			>
				{{
					dependents: [
						<MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl
							id={this.variantManagementId}
							ref={this.multiDimModelChangeHandler}
						/>
					]
				}}
			</MultiDimensionalGridBlock.FlexAnalysisControl>
		) as FlexAnalysis;
	}

	/**
	 * Waits for a view to be initialized.
	 *
	 * @param view
	 * @returns A promise resolving when the view is initialized.
	 */
	private static async waitForViewInitialization(view: View): Promise<void> {
		return new Promise((resolve) => view.attachAfterInit(() => resolve()));
	}

	/**
	 * Prepares the configured data provider from the configured model to be used by this block.
	 * Once it is ready it is stored in the instance.
	 *
	 * Throws if the data provider could not be fetched.
	 *
	 * @param appComponent
	 * @returns The fetched data provider
	 */
	private async prepareDataProvider(appComponent: AppComponent): Promise<void> {
		const model = appComponent.getModel(this.modelName) as MultiDimModelEx | undefined;
		await model?.loaded();
		this.dataProvider = model?.getDataProvider(this.dataProviderName);
		if (!this.dataProvider) {
			throw new Error("Data provider not found");
		}
		this.multiDimModelChangeHandler.current?.registerMultiDimModel(model);
		model?.attachRequestCompleted(() => appComponent.getAppStateHandler().createAppState());
	}

	/**
	 * Attaches the block to the configured filter bar, if it exists, to synchronize filter values to the grid,
	 * and registers a context menu to allow directly filtering for members on the grid.
	 *
	 * Also makes sure that event handlers are detached again when the view is exited.
	 *
	 * @param view
	 */
	private attachFiltering(view: View): void {
		const filterBar = this.filterBar ? (view.byId(this.filterBar) as FilterBarAPI | FilterBar) : undefined;
		if (!filterBar) {
			return;
		}

		// Get the actual FilterBar control if the ID to a FilterBarAPI is configured
		const innerFilterBar = filterBar.isA<FilterBarAPI>("sap.fe.macros.filterBar.FilterBarAPI")
			? (filterBar.getAggregation("content") as FilterBar)
			: filterBar;

		// Set up synchronization of filters from filter bar to grid
		const onFiltersChanged = (): void => this.flexAnalysisControl.current?.setBlocked(true);
		const onSearch = (): void => {
			this.setConditionsOnGrid(innerFilterBar.getConditions());
			this.flexAnalysisControl.current?.setBlocked(false);
		};
		innerFilterBar.attachFiltersChanged(onFiltersChanged);
		innerFilterBar.attachSearch(onSearch);

		// Set up context menu to allow member filtering on the grid
		const filterContextMenuHandler = new FilteringContextMenuHandler(
			innerFilterBar.getParent() as FilterBarAPI,
			this.dataProvider,
			this.dimensionMapping
		).create({ Text: this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_FILTER_MEMBER"), Icon: "filter" });
		this.flexAnalysisControl.current?.addContextMenuAction("MemberCellFiltering", filterContextMenuHandler);

		// Detach all handlers on view exit
		view.attachBeforeExit(() => {
			innerFilterBar.detachFiltersChanged(onFiltersChanged);
			innerFilterBar.detachSearch(onSearch);
		});
	}

	/**
	 * Adds an entry for the context menu to navigate to the primary navigation target of a cell if there is any.
	 *
	 * @param appComponent
	 * @param view
	 */
	private addNavigationContextMenu(appComponent: AppComponent, view: View): void {
		const handler = new NavigationContextMenuHandler(appComponent, view, this.dataProvider, this.dimensionMapping).create({
			Text: this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_GO_TO_DETAILS"),
			Icon: "action"
		});
		this.flexAnalysisControl.current?.addContextMenuAction("MemberCellNavigation", handler);
	}

	/**
	 * Refreshes the data provider whenever an object is saved.
	 *
	 * The refresh promises are chained to make sure that we never refresh the data provider twice at the same time;
	 * otherwise this may cause inconsistent data.
	 */
	@controllerExtensionHandler("editFlow", "onAfterSave")
	private async refresh(): Promise<unknown> {
		this.refreshPromise = this.refreshPromise.then(async () => {
			if (this.dataProvider) {
				await this.dataProvider.getResultSet(true);
			}
		});
		return this.refreshPromise;
	}

	/**
	 * Sets filter conditions on the grid (using the data provider).
	 *
	 * @param conditions
	 */
	private setConditionsOnGrid(conditions: Record<string, ConditionObject[]>): void {
		if (!this.dataProvider || !MultiDimensionalGridBlock.MemberFilter) {
			return;
		}
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const MemberFilter = MultiDimensionalGridBlock.MemberFilter;

		// Clear all existing filters
		for (const dimension of Object.keys(this.dataProvider.Dimensions)) {
			this.dataProvider.getDimension(dimension).removeMemberFilter();
		}

		for (const [path, values] of Object.entries(conditions)) {
			const dimension = Object.entries(this.dimensionMapping).find(([, value]) => value.filterProperty === path)?.[0];
			// DragonFly only supports equality conditions
			const memberFilters = values
				.filter((value) => value.operator === FilterOperator.EQ.valueOf())
				.flatMap((value) => value.values as unknown[])
				.map((value) => new MemberFilter([value]));
			if (dimension && this.dataProvider.Dimensions[dimension]) {
				this.dataProvider.getDimension(dimension).setMemberFilter(memberFilters);
			}
		}
	}
}
