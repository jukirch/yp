import type Chart from "sap/chart/Chart";
import { getTextBinding } from "sap/fe/macros/field/FieldTemplating";
import { createInsightsParams } from "sap/fe/macros/insights/CommonInsightsHelper";
import type Control from "sap/ui/core/Control";
import type { Dimension, Feed, Measure } from "sap/ui/integration/widgets/Card";
import type ChartAPI from "../chart/ChartAPI";

import type ChartDelegate from "sap/ui/mdc/ChartDelegate";
import type ODataV4ListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type VizFrame from "sap/viz/ui5/controls/VizFrame";
import type { ChartContent, InsightsParams } from "./InsightsService";

/**
 * Get measures of the chart.
 *
 * @param innerChart
 * @returns Measures of the chart.
 */
export function getMeasures(innerChart: Chart): Measure[] {
	return innerChart.getMeasures().map((measure) => {
		return {
			name: measure.getLabel(),
			value: "{" + measure.getName() + "}"
		};
	});
}

/**
 * Get dimensions of the chart.
 *
 * @param innerChart Inner chart
 * @param chartAPI Chart API
 * @returns Dimensions of the chart.
 */
export function getDimensions(innerChart: Chart, chartAPI: ChartAPI): Dimension[] {
	return innerChart
		.getDimensions()
		.filter(function (dimension) {
			return innerChart.getVisibleDimensions().includes(dimension.getName());
		})
		.map((dimension) => {
			const dataModel = chartAPI.getDimensionDataModel(dimension.getName());
			const displayValue = dataModel
				? getTextBinding(dataModel, {}, false, "extension.formatters.sapfe.formatWithBrackets")
				: undefined;
			if (dimension.getTextProperty()) {
				return {
					name: dimension.getLabel(),
					value: "{" + dimension.getTextProperty() + "}",
					displayValue: displayValue
				};
			} else {
				return {
					name: dimension.getLabel(),
					value: "{" + dimension.getName() + "}",
					displayValue: displayValue
				};
			}
		});
}

/**
 * Get feeds of the chart.
 *
 * @param innerChart
 * @returns Feeds of the chart.
 */
export function getFeeds(innerChart: Chart): Feed[] {
	const vizFeeds = (innerChart.getAggregation("_vizFrame") as VizFrame).getFeeds();
	const feeds: Feed[][] = vizFeeds.map((feed) => {
		return (feed.getProperty("values") as Control[]).map((feedValue) => {
			const label = getLabel(innerChart, feedValue.getProperty("name") as string, feedValue.getProperty("type") as string);
			const feedType: Feed = {
				type: feed.getProperty("type") as string,
				uid: feed.getProperty("uid") as string,
				values: [label]
			};
			return feedType;
		});
	});
	return feeds.flat();
}

/**
 * Get measure label or dimension label of the chart.
 *
 * @param innerChart
 * @param name
 * @param type
 * @returns Measure label or Dimension label of the chart.
 */

function getLabel(innerChart: Chart, name: string, type: string): string {
	if (type === "Dimension") {
		const dimensions = innerChart.getDimensions();
		return (
			dimensions
				.filter((dimension) => {
					return dimension.getName() === name;
				})[0]
				.getLabel() || name
		);
	} else {
		const measures = innerChart.getMeasures();
		return (
			measures
				.filter((measure) => {
					return measure.getName() === name;
				})[0]
				.getLabel() || name
		);
	}
}

/**
 * Constructs the insights parameters from the table that is required to create the insights card.
 *
 * @param controlAPI
 * @returns The insights parameters from the table.
 */
export async function createChartCardParams(controlAPI: ChartAPI): Promise<InsightsParams<ChartContent> | undefined> {
	const chart = controlAPI.content;
	const innerChart = (chart.getControlDelegate() as unknown as ChartDelegate | undefined)?.getInnerChart(chart) as Chart | undefined;

	if (!innerChart) {
		throw new Error("Cannot access chart.");
	}

	const params = await createInsightsParams("Analytical", controlAPI, chart.getFilter());
	if (!params) {
		return;
	}
	params.entitySetPath = chart.data("targetCollectionPath") as string;
	params.requestParameters.queryUrl = (innerChart.getBinding("data") as ODataV4ListBinding).getDownloadUrl();

	const content: ChartContent = {
		cardTitle: chart.getHeader(),
		legendVisible: false,
		chartType: chart.getChartType(),
		measures: getMeasures(innerChart),
		dimensions: getDimensions(innerChart, controlAPI),
		feeds: getFeeds(innerChart),
		allowedChartTypes: (innerChart.getAvailableChartTypes() as { available: { chart: string }[] }).available,
		chartProperties: (innerChart.getAggregation("_vizFrame") as VizFrame).getVizProperties()
	};
	return { ...params, content };
}
