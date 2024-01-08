import Log from "sap/base/Log";
import merge from "sap/base/util/merge";
import type Chart from "sap/chart/Chart";
import CommonUtils from "sap/fe/core/CommonUtils";
import { controllerExtensionHandler } from "sap/fe/core/controllerextensions/HookSupport";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { aggregation, defineUI5Class, event, property, xmlEventHandler } from "sap/fe/core/helpers/ClassSupport";
import type { WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import MacroAPI from "sap/fe/macros/MacroAPI";
import ChartRuntime from "sap/fe/macros/chart/ChartRuntime";
import ChartUtils from "sap/fe/macros/chart/ChartUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type { CardManifest } from "sap/insights/CardHelper";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type MDCChart from "sap/ui/mdc/Chart";
import type ChartDelegate from "sap/ui/mdc/ChartDelegate";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import Filter from "sap/ui/model/Filter";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { createChartCardParams } from "../insights/AnalyticalInsightsHelper";
import { hasInsightActionEnabled, showGenericErrorMessage } from "../insights/CommonInsightsHelper";
import type { ChartContent, InsightsParams } from "../insights/InsightsService";
import { getCardManifest, showCollaborationManagerCardPreview, showInsightsCardPreview } from "../insights/InsightsService";
/**
 * Definition of a custom action to be used in the chart toolbar
 *
 * @alias sap.fe.macros.chart.Action
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
	 * Defines if the action requires a selection.
	 *
	 * @public
	 */
	requiresSelection?: boolean;
	/**
	 * Event handler to be called when the user chooses the action
	 *
	 * @public
	 */
	press: string;
	/**
	 * Enables or disables the action
	 *
	 * @public
	 */
	enabled?: boolean;
};
/**
 * Definition of a custom action group to be used inside the chart toolbar
 *
 * @alias sap.fe.macros.chart.ActionGroup
 * @public
 */
export type ActionGroup = {
	/**
	 * Unique identifier of the action
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
	 * Defines where this action group should be placed relative to the defined anchor
	 *
	 * Allowed values are `Before` and `After`
	 *
	 * @public
	 */
	placement?: "Before" | "After";
	/**
	 * Reference to the key of another action or action group already displayed in the toolbar to properly place this one
	 *
	 * @public
	 */
	anchor?: string;
};

/**
 * Building block used to create a chart based on the metadata provided by OData V4.
 * <br>
 * Usually, a contextPath and metaPath is expected.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macro:Chart id="Mychart" contextPath="/RootEntity" metaPath="@com.sap.vocabularies.UI.v1.Chart" /&gt;
 * </pre>
 *
 * @alias sap.fe.macros.Chart
 * @public
 */
@defineUI5Class("sap.fe.macros.chart.ChartAPI", { returnTypes: ["sap.fe.macros.MacroAPI"] })
class ChartAPI extends MacroAPI {
	content!: MDCChart;

	/**
	 * ID of the chart
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Metadata path to the presentation context (UI.Chart with or without a qualifier)
	 *
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: ["com.sap.vocabularies.UI.v1.Chart"]
	})
	metaPath!: string;

	/**
	 * Metadata path to the entitySet or navigationProperty
	 *
	 * @public
	 */
	@property({
		type: "string",
		required: true,
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
		expectedAnnotations: []
	})
	contextPath!: string;

	/**
	 * Specifies the header text that is shown in the chart
	 *
	 * @public
	 */
	@property({ type: "string" })
	header!: string;

	/**
	 * Controls if the header text should be shown or not
	 *
	 * @public
	 */
	@property({ type: "boolean", defaultValue: true })
	headerVisible!: boolean;

	/**
	 * Defines the selection mode to be used by the chart.
	 *
	 * Allowed values are `None`, `Single` or `Multiple`
	 *
	 * @public
	 */
	@property({ type: "string", defaultValue: "Multiple", allowedValues: ["None", "Single", "Multiple"] })
	selectionMode!: string;

	/**
	 * Id of the FilterBar building block associated with the chart.
	 *
	 * @public
	 */
	@property({ type: "string" })
	filterBar?: string;

	/**
	 * Controls the kind of variant management that should be enabled for the chart.
	 *
	 * Allowed value is `Control`.<br/>
	 * If set with value `Control`, a variant management control is seen within the chart and the chart is linked to this.<br/>
	 * If not set with any value, variant management control is not available for this chart.
	 *
	 * @public
	 */
	@property({ type: "string", allowedValues: ["Control"] })
	variantManagement!: string;

	/**
	 * Controls which options should be enabled for the chart personalization dialog.
	 *
	 * If it is set to `true`, all possible options for this kind of chart are enabled.<br/>
	 * If it is set to `false`, personalization is disabled.<br/>
	 *<br/>
	 * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
	 * Available options are:<br/>
	 *  - Sort<br/>
	 *  - Type<br/>
	 *  - Item<br/>
	 *  - Filter<br/>
	 *
	 * @public
	 */
	@property({ type: "boolean | string", defaultValue: true })
	personalization!: boolean | string;

	/**
	 * Parameter with drillstack on a drill up/ drill down of the MDC_Chart
	 *
	 * @private
	 */
	@property({ type: "string[]", defaultValue: [] })
	prevDrillStack!: string[];

	/**
	 * Aggregate actions of the chart.
	 *
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.chart.Action", multiple: true })
	actions!: Action[];

	/**
	 * Gets contexts from the chart that have been selected by the user.
	 *
	 * @returns Contexts of the rows selected by the user
	 * @public
	 */
	getSelectedContexts(): Context[] {
		return this.content?.getBindingContext("internal")?.getProperty("selectedContexts") || [];
	}

	/**
	 * An event triggered when chart selections are changed. The event contains information about the data selected/deselected and the Boolean flag that indicates whether data is selected or deselected.
	 *
	 * @public
	 */
	@event()
	selectionChange!: Function;

	/**
	 * An event triggered when the chart state changes.
	 *
	 * You can set this in order to store the chart state in the iAppstate.
	 *
	 * @private
	 */
	@event()
	stateChange!: Function;

	/**
	 * An event triggered when the chart requests data.
	 *
	 * @private
	 */
	@event()
	internalDataRequested!: Function;

	onAfterRendering() {
		const view = this.getController().getView();
		const internalModelContext: any = view.getBindingContext("internal");
		const chart = (this as any).getContent();
		const showMessageStrip: any = {};
		const sChartEntityPath = chart.data("entitySet"),
			sCacheKey = `${sChartEntityPath}Chart`,
			oBindingContext = view.getBindingContext();
		showMessageStrip[sCacheKey] =
			chart.data("draftSupported") === "true" && !!oBindingContext && !oBindingContext.getObject("IsActiveEntity");
		internalModelContext.setProperty("controls/showMessageStrip", showMessageStrip);
	}

	refreshNotApplicableFields(oFilterControl: Control): any[] {
		const oChart = (this as any).getContent();
		return FilterUtils.getNotApplicableFilters(oFilterControl, oChart);
	}

	@xmlEventHandler()
	handleSelectionChange(oEvent: UI5Event<{ data: unknown[]; name: string }>): void {
		const aData = oEvent.getParameter("data");
		const bSelected = oEvent.getParameter("name") === "selectData";
		ChartRuntime.fnUpdateChart(oEvent);
		(this as any).fireSelectionChange(merge({}, { data: aData, selected: bSelected }));
	}

	@xmlEventHandler()
	onInternalDataRequested() {
		(this as any).fireEvent("internalDataRequested");
	}

	@controllerExtensionHandler("collaborationManager", "collectAvailableCards")
	collectAvailableCards(cards: Promise<WrappedCard>[]): void {
		const actionToolbarItems = this.content.getActions() as ActionToolbarAction[];
		if (hasInsightActionEnabled(actionToolbarItems)) {
			cards.push(
				(async (): Promise<WrappedCard> => {
					const card = await this.getCardManifestChart();
					return {
						card: card,
						title: this.getChartControl().getHeader(),
						callback: this.onAddCardToCollaborationManagerCallback.bind(this)
					};
				})()
			);
		}
	}

	hasSelections() {
		// consider chart selections in the current drill stack or on any further drill downs
		const mdcChart = this.content as unknown as MDCChart;
		if (mdcChart) {
			try {
				const chart = (mdcChart.getControlDelegate() as unknown as ChartDelegate)?.getInnerChart(mdcChart) as Chart;
				if (chart) {
					const aDimensions = ChartUtils.getDimensionsFromDrillStack(chart);
					const bIsDrillDown = aDimensions.length > this.prevDrillStack.length;
					const bIsDrillUp = aDimensions.length < this.prevDrillStack.length;
					const bNoChange = aDimensions.toString() === this.prevDrillStack.toString();
					let aFilters: Filter[];
					if (bIsDrillUp && aDimensions.length === 1) {
						// drilling up to level0 would clear all selections
						aFilters = ChartUtils.getChartSelections(mdcChart, true) as Filter[];
					} else {
						// apply filters of selections of previous drillstack when drilling up/down
						// to the chart and table
						aFilters = ChartUtils.getChartSelections(mdcChart) as Filter[];
					}
					if (bIsDrillDown || bIsDrillUp) {
						// update the drillstack on a drill up/ drill down
						this.prevDrillStack = aDimensions;
						return aFilters.length > 0;
					} else if (bNoChange) {
						// bNoChange is true when chart is selected
						return aFilters.length > 0;
					}
				}
			} catch (err: unknown) {
				Log.error(`Error while checking for selections in Chart: ${err}`);
			}
		}
		return false;
	}

	/**
	 * Event handler to create insightsParams and call the API to show insights card preview for charts.
	 *
	 * @returns Undefined if card preview is rendered.
	 */
	@xmlEventHandler()
	async onAddCardToInsightsPressed() {
		try {
			const insightsParams = await createChartCardParams(this);
			if (insightsParams) {
				showInsightsCardPreview(insightsParams);
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	/**
	 * Gets the card manifest optimized for the chart case.
	 *
	 * @returns Promise of CardManifest
	 */
	private async getCardManifestChart(): Promise<CardManifest> {
		const insightsParams = await createChartCardParams(this);
		return getCardManifest(insightsParams as InsightsParams<ChartContent>);
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
				await showCollaborationManagerCardPreview(card, this.getController().collaborationManager.getService());
				return;
			}
		} catch (e) {
			showGenericErrorMessage(this.content);
			Log.error(e as string);
		}
	}

	/**
	 * Gets the filters related to the chart.
	 *
	 * @returns  The filter configured on the chart or undefined if none
	 */
	getFilter(): Filter | undefined {
		const chartFilterInfo = ChartUtils.getAllFilterInfo(this.content as unknown as MDCChart);
		if (chartFilterInfo.filters.length) {
			chartFilterInfo.filters = CommonUtils.getChartPropertiesWithoutPrefixes(chartFilterInfo.filters);
			return new Filter({ filters: chartFilterInfo.filters, and: true });
		}
		return undefined;
	}

	/**
	 * Gets the chart control from the Chart API.
	 *
	 * @returns The Chart control inside the Chart API
	 */
	getChartControl(): MDCChart {
		return this.content;
	}

	/**
	 * Gets the datamodel object path for the dimension.
	 *
	 * @param dimensionName  Name of the dimension
	 * @returns The datamodel object path for the dimension
	 */

	getDimensionDataModel(dimensionName: string): DataModelObjectPath | null {
		const metaPath = this.content.data("targetCollectionPath") as string;
		const metaModel = (this.content.getModel() as ODataModel).getMetaModel();
		const dimensionContext = metaModel.createBindingContext(`${metaPath}/${dimensionName}`) as Context;
		return getInvolvedDataModelObjects(dimensionContext);
	}
}
export default ChartAPI;
