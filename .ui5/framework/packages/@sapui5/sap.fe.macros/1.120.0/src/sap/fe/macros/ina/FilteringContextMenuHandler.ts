import type { MultiDimensionalGridDimensionMapping } from "sap/fe/core/converters/ManifestSettings";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import type { CellContext } from "sap/fe/macros/ina/AbstractContextMenuHandler";
import { AbstractContextMenuHandler } from "sap/fe/macros/ina/AbstractContextMenuHandler";
import type { MultiDimDataProviderEx } from "sap/fe/macros/ina/MultiDimensionalGrid.block";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * Manages the creation and handling of the context menu item for filtering members ("Filter Member") of the MultiDimensionalGrid
 */
export default class FilteringContextMenuHandler extends AbstractContextMenuHandler {
	private readonly filterBar: FilterBarAPI;

	constructor(
		filterBar: FilterBarAPI,
		dataProvider: MultiDimDataProviderEx | undefined,
		dimensionalMapping: MultiDimensionalGridDimensionMapping
	) {
		super(dataProvider, dimensionalMapping);
		this.filterBar = filterBar;
	}

	protected async isActionVisible(context: CellContext): Promise<boolean> {
		return Promise.resolve(!!context.dimensionMapping?.filterProperty);
	}

	protected async isActionEnabled(): Promise<boolean> {
		return Promise.resolve(true);
	}

	/**
	 * Sets a filter for a member on the filter bar if the action is pressed.
	 *
	 * @param context
	 * @returns A promise
	 */
	protected async triggerAction(context: CellContext): Promise<void> {
		const { cell, dimensionMapping } = context;
		if (!cell || !dimensionMapping?.filterProperty) {
			return;
		}
		await this.filterBar.setFilterValues(dimensionMapping.filterProperty, FilterOperator.EQ, cell.Member);
	}
}
