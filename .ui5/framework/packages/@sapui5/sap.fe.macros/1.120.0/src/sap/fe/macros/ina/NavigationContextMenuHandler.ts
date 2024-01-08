import type AppComponent from "sap/fe/core/AppComponent";
import type PageController from "sap/fe/core/PageController";
import type { MultiDimensionalGridDimensionMapping } from "sap/fe/core/converters/ManifestSettings";
import type { CellContext } from "sap/fe/macros/ina/AbstractContextMenuHandler";
import { AbstractContextMenuHandler } from "sap/fe/macros/ina/AbstractContextMenuHandler";
import type { MultiDimDataProviderEx } from "sap/fe/macros/ina/MultiDimensionalGrid.block";
import type View from "sap/ui/core/mvc/View";

/**
 * Manages the creation and handling of the context menu item for MultiDimensionalGrid navigation ("Go to Details")
 */
export default class NavigationContextMenuHandler extends AbstractContextMenuHandler {
	private readonly appComponent: AppComponent;

	private readonly view: View;

	constructor(
		appComponent: AppComponent,
		view: View,
		dataProvider: MultiDimDataProviderEx | undefined,
		dimensionalMapping: MultiDimensionalGridDimensionMapping
	) {
		super(dataProvider, dimensionalMapping);
		this.appComponent = appComponent;
		this.view = view;
	}

	protected async isActionVisible(context: CellContext): Promise<boolean> {
		const { dimensionMapping } = context;
		if (dimensionMapping?.navigationType === "internal") {
			return !!dimensionMapping.navigationEntitySet;
		} else if (dimensionMapping?.navigationType === "external") {
			return (
				!!dimensionMapping.navigationSemanticObject &&
				!!(await this.appComponent.getShellServices().getPrimaryIntent(dimensionMapping.navigationSemanticObject))
			);
		} else {
			return false;
		}
	}

	protected async isActionEnabled(context: CellContext): Promise<boolean> {
		return Promise.resolve(!!context.dimensionMapping && !!context.cell?.Member);
	}

	/**
	 * Navigates to the configured target of a dimension if the action is pressed, using routing or intent-based navigation.
	 *
	 * @param context
	 * @returns A promise
	 */
	protected async triggerAction(context: CellContext): Promise<void> {
		const { cell, dimensionMapping } = context;
		if (!cell || !dimensionMapping) {
			return;
		}

		if (dimensionMapping.navigationType === "internal" && dimensionMapping.navigationEntitySet) {
			const targetContext = this.appComponent
				.getModel()
				.createBindingContext(`/${dimensionMapping.navigationEntitySet}(${cell.Member})`);
			await (this.view.getController() as PageController)._routing.navigateForwardToContext(targetContext);
		} else if (
			dimensionMapping.navigationType === "external" &&
			dimensionMapping.navigationKeyProperty &&
			dimensionMapping.navigationSemanticObject
		) {
			const link = (await this.appComponent.getShellServices().getPrimaryIntent(dimensionMapping.navigationSemanticObject)) as {
				intent: string;
			} | null;
			if (link) {
				const navigationTarget = {
					target: {
						shellHash: `${link.intent}?${dimensionMapping.navigationKeyProperty}=${cell.Member}`
					}
				};
				await this.appComponent.getShellServices().crossAppNavService?.toExternal(navigationTarget);
			}
		}
	}
}
