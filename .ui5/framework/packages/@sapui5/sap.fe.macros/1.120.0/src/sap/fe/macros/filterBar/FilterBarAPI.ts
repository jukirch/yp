import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import merge from "sap/base/util/merge";
import { aggregation, defineUI5Class, event, property, xmlEventHandler } from "sap/fe/core/helpers/ClassSupport";
import DraftEditState from "sap/fe/core/helpers/DraftEditState";
import SemanticDateOperators from "sap/fe/core/helpers/SemanticDateOperators";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type { FilterFieldPropertyInfo } from "sap/fe/macros/filterBar/FilterBarDelegate";
import type { ConversionInfo } from "sap/fe/macros/filterBar/adapter/SelectionVariantToStateFilters";
import svToStateFilters from "sap/fe/macros/filterBar/adapter/SelectionVariantToStateFilters";
import StateFiltersToSelectionVariant from "sap/fe/macros/filterBar/adapter/StateFilterToSelectionVariant";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type UI5Event from "sap/ui/base/Event";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type FilterBarDelegate from "sap/ui/mdc/FilterBarDelegate";
import type { Filter as StateUtilFilter } from "sap/ui/mdc/p13n/StateUtil";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import MacroAPI from "../MacroAPI";
import type { ExternalStateType } from "../valuehelp/ValueHelpDelegate";

/**
 * Definition of a custom filter to be used inside the FilterBar.
 *
 * The template for the FilterField has to be provided as the default aggregation
 *
 * @alias sap.fe.macros.FilterField
 * @public
 */
export type FilterField = {
	/**
	 * The property name of the FilterField
	 *
	 * @public
	 */
	key: string;
	/**
	 * The text that will be displayed for this FilterField
	 *
	 * @public
	 */
	label: string;
	/**
	 * Reference to the key of another filter already displayed in the table to properly place this one
	 *
	 * @public
	 */
	anchor?: string;
	/**
	 * Defines where this filter should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 *
	 * @public
	 */
	placement?: "Before" | "After";
	/**
	 * If set, possible errors that occur during the search will be displayed in a message box.
	 *
	 * @public
	 */
	showMessages?: boolean;

	slotName?: string;
};

/**
 * Building block for creating a FilterBar based on the metadata provided by OData V4.
 * <br>
 * Usually, a SelectionFields annotation is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macro:FilterBar id="MyFilterBar" metaPath="@com.sap.vocabularies.UI.v1.SelectionFields" /&gt;
 * </pre>
 *
 * @alias sap.fe.macros.FilterBar
 * @public
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterBarAPI", {
	returnTypes: ["sap.ui.core.Control"]
})
class FilterBarAPI extends MacroAPI {
	/**
	 * The identifier of the FilterBar control.
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 *
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionFields"],
		expectedTypes: ["EntitySet", "EntityType"]
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
		expectedTypes: ["EntitySet", "EntityType", "NavigationProperty"]
	})
	contextPath!: string;

	/**
	 * If true, the search is triggered automatically when a filter value is changed.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	liveMode?: boolean;

	/**
	 * Parameter which sets the visibility of the FilterBar building block
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	visible?: boolean;

	/**
	 * Displays possible errors during the search in a message box
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	showMessages?: boolean;

	/**
	 * Handles the visibility of the 'Clear' button on the FilterBar.
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: false })
	showClearButton?: boolean;

	/**
	 * Aggregate filter fields of the FilterBar building block
	 *
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.FilterField", multiple: true })
	filterFields?: FilterField[];

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change.
	 *
	 * @public
	 */
	@event()
	search!: Function;

	/**
	 * This event is fired when the 'Go' button is pressed or after a condition change. This is only internally used by sap.fe (Fiori elements) and
	 * exposes parameters from internal MDC-FilterBar search event
	 *
	 * @private
	 */
	@event()
	internalSearch!: Function;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that will be used as filters.
	 *
	 * @public
	 */
	@event()
	filterChanged!: Function;

	/**
	 * This event is fired when the 'Clear' button is pressed. This is only possible when the 'Clear' button is enabled.
	 *
	 * @public
	 */
	@event()
	afterClear!: Function;

	/**
	 * This event is fired after either a filter value or the visibility of a filter item has been changed. The event contains conditions that will be used as filters.
	 * This is used internally only by sap.fe (Fiori Elements). This exposes parameters from the MDC-FilterBar filterChanged event that is used by sap.fe in some cases.
	 *
	 * @private
	 */
	@event()
	internalFilterChanged!: Function;

	/**
	 * An event that is triggered when the FilterBar State changes.
	 *
	 * You can set this to store the state of the filter bar in the app state.
	 *
	 * @private
	 */
	@event()
	stateChange!: Function;

	@xmlEventHandler()
	handleSearch(oEvent: UI5Event) {
		const oFilterBar = oEvent.getSource() as FilterBar;
		const oEventParameters = oEvent.getParameters();
		if (oFilterBar) {
			const oConditions = oFilterBar.getFilterConditions();
			const eventParameters: object = this._prepareEventParameters(oFilterBar);
			(this as any).fireInternalSearch(merge({ conditions: oConditions }, oEventParameters));
			(this as any).fireSearch(eventParameters);
		}
	}

	@xmlEventHandler()
	handleFilterChanged(oEvent: UI5Event) {
		const oFilterBar = oEvent.getSource() as FilterBar;
		const oEventParameters = oEvent.getParameters();
		if (oFilterBar) {
			const oConditions = oFilterBar.getFilterConditions();
			const eventParameters: object = this._prepareEventParameters(oFilterBar);
			(this as any).fireInternalFilterChanged(merge({ conditions: oConditions }, oEventParameters));
			(this as any).fireFilterChanged(eventParameters);
		}
	}

	_prepareEventParameters(oFilterBar: FilterBar) {
		const { parameters, filters, search } = FilterUtils.getFilters(oFilterBar);

		return { parameters, filters, search };
	}

	/**
	 * Set the filter values for the given property in the filter bar.
	 * The filter values can be either a single value or an array of values.
	 * Each filter value must be represented as a primitive value.
	 *
	 * @param sConditionPath The path to the property as a condition path
	 * @param [sOperator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
	 * @param vValues The values to be applied
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	setFilterValues(
		sConditionPath: string,
		sOperator: string | undefined,
		vValues?: undefined | string | number | boolean | string[] | number[] | boolean[]
	): Promise<void> {
		if (arguments.length === 2) {
			vValues = sOperator;
			return FilterUtils.setFilterValues(this.content, sConditionPath, vValues);
		}
		return FilterUtils.setFilterValues(this.content, sConditionPath, sOperator, vValues);
	}

	/**
	 * Get the Active Filters Text Summary for the filter bar.
	 *
	 * @returns Active filters summary as text
	 * @public
	 */
	getActiveFiltersText(): string {
		const oFilterBar = this.content as FilterBar;
		return oFilterBar?.getAssignedFiltersText()?.filtersText || "";
	}

	/**
	 * Provides all the filters that are currently active
	 * along with the search expression.
	 *
	 * @returns An array of active filters and the search expression.
	 * @public
	 */
	getFilters(): object {
		return FilterUtils.getFilters(this.content as FilterBar);
	}

	/**
	 * Triggers the API search on the filter bar.
	 *
	 * @returns Returns a promise which resolves if filter go is triggered successfully; otherwise gets rejected.
	 * @public
	 */
	async triggerSearch(): Promise<object | undefined> {
		const filterBar = this.content as FilterBar;
		try {
			if (filterBar) {
				await filterBar.waitForInitialization();
				return await filterBar.triggerSearch();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Buildingblock : FilterBar : ${message}`);
			throw Error(message);
		}
	}

	isSemanticDateFilterApplied = (): boolean => {
		return SemanticDateOperators.hasSemanticDateOperations((this.content as FilterBar).getConditions(), false);
	};

	/**
	 * Get the selection variant from the filter bar.
	 *
	 *
	 * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
	 * @public
	 */
	async getSelectionVariant(): Promise<SelectionVariant> {
		try {
			const filterBar = this.content as FilterBar;
			const filterState = await StateUtil.retrieveExternalState(filterBar);
			const filterObject = filterState.filter as StateUtilFilter;
			const parameters = filterBar.data("parameters") as string[];
			return StateFiltersToSelectionVariant.getSelectionVariantFromConditions(
				filterObject,
				filterBar.getPropertyHelper(),
				parameters
			);
		} catch (error: unknown) {
			const id: string = this.getId();
			const message = error instanceof Error ? error.message : String(error);
			Log.error(`FilterBar Building Block (${id}) - get selection variant failed : ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Get the list of mandatory filter property names.
	 *
	 * @returns The list of mandatory filter property names
	 */
	getMandatoryFilterPropertyNames(): string[] {
		const filterBar = this.content as FilterBar;
		return (filterBar.getPropertyInfoSet() as FilterFieldPropertyInfo[])
			.filter(function (filterProp) {
				return filterProp.required;
			})
			.map(function (requiredProp) {
				return requiredProp.conditionPath;
			});
	}

	/**
	 * Sets {@link sap.fe.navigation.SelectionVariant} to the filter bar. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
	 *
	 * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the filter bar
	 * @returns A promise for asynchronous handling
	 * @public
	 */
	async setSelectionVariant(selectionVariant: SelectionVariant): Promise<unknown> {
		try {
			const filterBar = this.content as FilterBar,
				conditions: StateUtilFilter = await this.convertSelectionVariantToStateFilters(selectionVariant);

			// Clear filter bar before applying selection varaint
			await this.clearFilterValues(filterBar);

			// State to apply
			const propertyInfos = await this._getFilterBarSupportedFields(filterBar);
			const stateToApply = svToStateFilters.getStateToApply(propertyInfos, conditions);
			return await StateUtil.applyExternalState(filterBar, stateToApply);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`FE : Buildingblock : FilterBar : ${message}`);
			throw Error(message);
		}
	}

	/**
	 * Convert {@link sap.fe.navigation.SelectionVariant} to conditions.
	 *
	 * @param selectionVariant The selection variant to apply to the filter bar.
	 * @returns A promise resolving to conditions
	 * @private
	 * @ui5-restricted sap.fe
	 */
	async convertSelectionVariantToStateFilters(selectionVariant: SelectionVariant): Promise<StateUtilFilter> {
		// Note: This method is private and restricted to usage by sap.fe(ViewState controller extension) for filter bar state scenarios.
		const filterBar = this.content as FilterBar;
		const propertyInfos = await this._getFilterBarSupportedFields(filterBar);

		if (!propertyInfos.length) {
			throw new Error("No valid metadata properties present for filter bar");
		}

		const filterBarInfoForConversion = this._getFilterBarInfoForConversion();
		const conditions: StateUtilFilter =
			svToStateFilters.getStateFiltersFromSV(selectionVariant, filterBarInfoForConversion, propertyInfos) || {};

		return conditions;
	}

	/**
	 * Get the filter bar info needed for conversion of selection variant to conditions.
	 *
	 * @returns The Filter bar info (metaModel, contextPath, use of semantic date range, all filter fields config)
	 */
	_getFilterBarInfoForConversion(): ConversionInfo {
		const filterBar = this.content as FilterBar,
			metaModel = filterBar.getModel()?.getMetaModel() as ODataMetaModel,
			contextPath = filterBar.data("entityType") as string,
			useSemanticDateRange: boolean =
				filterBar.data("useSemanticDateRange") === "true" || filterBar.data("useSemanticDateRange") === true,
			viewDataInstance = filterBar.getModel("viewData") as JSONModel,
			viewData = viewDataInstance.getData() as ViewData,
			config = viewData?.controlConfiguration,
			selectionFieldsConfigs = config?.["@com.sap.vocabularies.UI.v1.SelectionFields"],
			filterFieldsConfig = selectionFieldsConfigs?.filterFields;

		return { metaModel, contextPath, useSemanticDateRange, filterFieldsConfig };
	}

	/**
	 * Get the filter bar parameters for a parameterized service.
	 *
	 * @returns Array of parameters configured in a parameterized service
	 */

	getParameters(): string[] {
		const filterBar = this.content as FilterBar;
		const parameters = filterBar.data("parameters");
		if (parameters) {
			return Array.isArray(parameters) ? parameters : JSON.parse(parameters);
		}
		return [];
	}

	/**
	 * Get supported filter field properties from the filter bar.
	 *
	 * @param filterBar Filter bar
	 * @returns Supported filter fields in filter bar.
	 */
	async _getFilterBarSupportedFields(filterBar: FilterBar): Promise<FilterFieldPropertyInfo[]> {
		await filterBar.waitForInitialization();
		return (filterBar.getControlDelegate() as FilterBarDelegate).fetchProperties(filterBar) as Promise<FilterFieldPropertyInfo[]>;
	}

	/**
	 * Clears all input values of visible filter fields in the filter bar.
	 *
	 * @param filterBar The filter bar that contains the filter field
	 */
	async clearFilterValues(filterBar: FilterBar): Promise<void> {
		await this._clearFilterValuesWithOptions(filterBar);
		// Allow app developers to update filters after clearing
		this.fireEvent("afterClear");
	}

	/**
	 * Clears all input values of visible filter fields in the filter bar with flag to indicate whether to clear Edit Filter or not.
	 *
	 * @param filterBar The filter bar that contains the filter field
	 * @param options Options for filtering on the filter bar
	 * @param options.clearEditFilter Whether to clear the edit filter or let it be default value 'All' instead
	 */
	async _clearFilterValuesWithOptions(filterBar: FilterBar, options?: { clearEditFilter: boolean }): Promise<void> {
		if (!filterBar) {
			return;
		}

		const state: ExternalStateType = await StateUtil.retrieveExternalState(filterBar);
		const editStatePath = "$editState";
		const editStateDefaultValue = DraftEditState.ALL.id;
		const currentEditStateCondition = deepClone(state.filter[editStatePath]?.[0]);
		const currentEditStateIsDefault = currentEditStateCondition?.values[0] === editStateDefaultValue;
		const shouldClearEditFilter = options && Object.keys(options).length > 0 && options.clearEditFilter;

		// Clear all conditions
		for (const conditionPath of Object.keys(state.filter)) {
			if (!shouldClearEditFilter && conditionPath === editStatePath && currentEditStateIsDefault) {
				// Do not clear edit state condition if it is already "ALL"
				continue;
			}
			for (const condition of state.filter[conditionPath]) {
				condition.filtered = false;
			}
		}

		await StateUtil.applyExternalState(filterBar, { filter: state.filter });

		// Set edit state to 'ALL' if it wasn't before
		if (!shouldClearEditFilter && currentEditStateCondition && !currentEditStateIsDefault) {
			currentEditStateCondition.values = [editStateDefaultValue];
			await StateUtil.applyExternalState(filterBar, { filter: { [editStatePath]: [currentEditStateCondition] } });
		}

		//clear filter fields in error state
		filterBar.cleanUpAllFilterFieldsInErrorState();
	}
}
export default FilterBarAPI;
