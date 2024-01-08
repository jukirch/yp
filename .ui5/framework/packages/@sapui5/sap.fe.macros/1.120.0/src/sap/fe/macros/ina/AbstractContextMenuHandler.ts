import type {
	MultiDimensionalGridDimensionMapping,
	SingleMultiDimensionalGridDimensionMapping
} from "sap/fe/core/converters/ManifestSettings";
import type {
	Cell,
	ContextMenuHandler,
	ContextMenuHandlerGridContext,
	MultiDimDataProviderEx
} from "sap/fe/macros/ina/MultiDimensionalGrid.block";

export type CellContext = {
	cell: Cell | null | undefined;
	dimensionMapping: SingleMultiDimensionalGridDimensionMapping | undefined;
};

/**
 * Abstract super class for context menu handlers registered to the DragonFly MultiDimensionalGrid.
 */
export abstract class AbstractContextMenuHandler {
	private readonly dataProvider: MultiDimDataProviderEx | undefined;

	private readonly dimensionMapping: MultiDimensionalGridDimensionMapping;

	protected constructor(dataProvider: MultiDimDataProviderEx | undefined, dimensionalMapping: MultiDimensionalGridDimensionMapping) {
		this.dataProvider = dataProvider;
		this.dimensionMapping = dimensionalMapping;
	}

	/**
	 * Creates the context menu handler to be registered to DragonFly.
	 *
	 * @param actionDescription
	 * @param actionDescription.Text
	 * @param actionDescription.Icon
	 * @returns The handler
	 */
	public create(actionDescription: { Text: string; Icon: string }): ContextMenuHandler {
		return {
			isActionVisible: async (_key: string, context: ContextMenuHandlerGridContext) => this.isActionVisible(this.findCell(context)),
			isActionEnabled: async (_key: string, context: ContextMenuHandlerGridContext) => this.isActionEnabled(this.findCell(context)),
			getActionDescription: async (_key: string, _context: ContextMenuHandlerGridContext) => Promise.resolve(actionDescription),
			triggerAction: async (_key: string, context: ContextMenuHandlerGridContext) => this.triggerAction(this.findCell(context))
		};
	}

	/**
	 * Determines whether the context menu item is visible
	 * @param context
	 */
	protected abstract isActionVisible(context: CellContext): Promise<boolean>;

	/**
	 * Determines whether the context menu item is enabled
	 * @param context
	 */
	protected abstract isActionEnabled(context: CellContext): Promise<boolean>;

	/**
	 * Triggers the action of the context menu item
	 * @param context
	 */
	protected abstract triggerAction(context: CellContext): Promise<void>;

	/**
	 * Finds and returns the cell data for a given context.
	 *
	 * @param context
	 * @returns The cell and its dimension mapping
	 */
	private findCell(context: ContextMenuHandlerGridContext): CellContext {
		if (context.Grid.SelectedCells.length !== 1) {
			return { cell: undefined, dimensionMapping: undefined };
		}
		const column = context.Grid.SelectedCells[0].columnIndex;
		const row = context.Grid.SelectedCells[0].rowIndex;
		const cell = this.dataProvider?.Grid?.Cells?.find((c: { Row: number; Column: number }) => c.Row === row && c.Column === column);
		const dimensionMapping = cell?.Dimension ? this.dimensionMapping[cell.Dimension] : undefined;
		return { cell, dimensionMapping };
	}
}
