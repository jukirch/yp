import type { SelectionVariantType, SelectionVariantTypeTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type AppComponent from "sap/fe/core/AppComponent";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { TableFiltersConfiguration } from "sap/fe/core/converters/controls/Common/Table";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { notEqual, pathInModel } from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { enhanceDataModelPath, getTargetNavigationPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isSelectionVariant } from "sap/fe/core/templating/FilterHelper";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import Select from "sap/m/Select";
import InvisibleText from "sap/ui/core/InvisibleText";
import Item from "sap/ui/core/Item";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/Context";

@defineBuildingBlock({ name: "QuickFilterSelector", namespace: "sap.fe.macros.table" })
export default class QuickFilterSelector extends RuntimeBuildingBlock {
	@blockAttribute({
		type: "string",
		required: true
	})
	id!: string;

	@blockAttribute({ type: "sap.ui.model.Context", required: true })
	metaPath!: Context;

	@blockAttribute({ type: "sap.ui.model.Context", required: true })
	contextPath!: Context;

	@blockAttribute({ type: "object", required: true })
	filterConfiguration!: TableFiltersConfiguration;

	@blockAttribute({ type: "function" })
	onSelectionChange?: Function;

	constructor(props: PropertiesOf<QuickFilterSelector>) {
		super(props);
	}

	/**
	 * Generates the selector as a SegmentedButton.
	 *
	 * @returns  The SegmentedButton
	 */
	private getSegmentedButtonSelector(): SegmentedButton {
		const items = this.filterConfiguration.paths.map((path, index) => {
			return (<SegmentedButtonItem {...this.getSelectorItemProperties(index)} />) as SegmentedButtonItem;
		});
		return (
			<SegmentedButton
				id={this.id}
				enabled={notEqual(pathInModel("hasPendingFilters", "pageInternal"), true)}
				ariaLabelledBy={[this.getSelectorAriaLabelledById()]}
				items={items}
				selectionChange={(event) => {
					this.onSelectionChange?.(event);
				}}
			/>
		) as SegmentedButton;
	}

	/**
	 * Generates the selector as a Select.
	 *
	 * @returns  The Select
	 */
	private getSelectSelector(): Select {
		const items = this.filterConfiguration.paths.map((path, index) => {
			return (<Item {...this.getSelectorItemProperties(index)} />) as Item;
		});
		return (
			<Select
				id={this.id}
				enabled={notEqual(pathInModel("hasPendingFilters", "pageInternal"), true)}
				ariaLabelledBy={[this.getSelectorAriaLabelledById()]}
				autoAdjustWidth={true}
				items={items}
				change={(event) => {
					this.onSelectionChange?.(event);
				}}
			/>
		) as Select;
	}

	/**
	 * Gets the properties of the selector Item.
	 *
	 * @param index The index of the item into the selector
	 * @returns  The properties
	 */
	private getSelectorItemProperties(index: number) {
		return {
			key: this.filterConfiguration.paths[index].annotationPath,
			text: this.getSelectorItemText(index)
		};
	}

	/**
	 * Generates the Id of the InvisibleText control.
	 *
	 * @returns  The Id
	 */
	private getSelectorAriaLabelledById() {
		return generate([this.id, "AriaText"]);
	}

	/**
	 * Generates the text for the selector item.
	 *
	 * @param index The index of the item into the selector
	 * @returns  The text
	 */
	private getSelectorItemText(index: number): string {
		const countText = ` ({internal>quickFilters/counts/${index}})`;
		const dataTableModelPath = getInvolvedDataModelObjects(this.metaPath);
		const selectionVariant = enhanceDataModelPath(dataTableModelPath, this.filterConfiguration.paths[index].annotationPath)
			.targetObject as SelectionVariantType | undefined;
		const text = selectionVariant?.Text?.toString() ?? "";
		return `${text}${this.filterConfiguration.showCounts ? countText : ""}`;
	}

	/**
	 * Registers the SideEffects control that must be executed when table cells that are related to configured filter(s) change.
	 *
	 * @param appComponent The appComponent
	 */
	private registerSideEffectForQuickFilter(appComponent: AppComponent) {
		const dataVisualizationModelPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
		const viewEntityType = dataVisualizationModelPath.contextLocation?.targetEntityType.fullyQualifiedName;
		const tableNavigationPath = getTargetNavigationPath(dataVisualizationModelPath, true);
		const selectionVariantPaths = this.filterConfiguration.paths.map((info) => info.annotationPath);

		if (tableNavigationPath && viewEntityType) {
			const sourceProperties: Set<string> = new Set();
			for (const selectionVariantPath of selectionVariantPaths) {
				const selectionVariant = enhanceDataModelPath(dataVisualizationModelPath, selectionVariantPath)
					.targetObject as Partial<SelectionVariantTypeTypes>; // We authorize SelectionVariant without SelectOptions even if it's not compliant with vocabularies
				if (selectionVariant.SelectOptions && isSelectionVariant(selectionVariant)) {
					selectionVariant.SelectOptions.forEach((selectOption) => {
						const propertyPath = selectOption.PropertyName?.value;
						if (propertyPath) {
							const propertyModelPath = enhanceDataModelPath(dataVisualizationModelPath, propertyPath);
							sourceProperties.add(getTargetObjectPath(propertyModelPath, true));
						}
					});
				}
			}
			appComponent.getSideEffectsService().addControlSideEffects(viewEntityType, {
				sourceProperties: Array.from(sourceProperties),
				targetEntities: [
					{
						$NavigationPropertyPath: tableNavigationPath
					}
				],
				sourceControlId: this.id
			});
		}
	}

	/**
	 * Creates the invisibleText for the accessibility compliance.
	 *
	 * @returns  The InvisibleText
	 */
	private getAccessibilityControl() {
		const textBinding = `{sap.fe.i18n>M_TABLE_QUICKFILTER_ARIA}`;
		const invisibleText = (<InvisibleText text={textBinding} id={this.getSelectorAriaLabelledById()} />) as InvisibleText;

		//Adds the invisibleText into the static, hidden area UI area container.
		invisibleText.toStatic();
		return invisibleText;
	}

	getContent(view: View, appComponent: AppComponent) {
		if (this.filterConfiguration.showCounts) {
			this.registerSideEffectForQuickFilter(appComponent);
		}
		/**
		 * The number of views defined for a table determines the UI control that lets users switch the table views:
		 *  - A segmented button for a maximum of three views
		 *  - A select control for four or more views.
		 */
		const selector = this.filterConfiguration.paths.length > 3 ? this.getSelectSelector() : this.getSegmentedButtonSelector();
		selector.addDependent(this.getAccessibilityControl());
		return selector;
	}
}
