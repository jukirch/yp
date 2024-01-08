import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import kpiFormatters from "sap/fe/core/formatters/KPIFormatter";
import type { BindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { formatResult, pathInModel, resolveBindingString } from "sap/fe/core/helpers/BindingToolkit";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * A building block used to display a KPI in the Analytical List Page
 *
 */
@defineBuildingBlock({
	name: "AnalyticalKPITag",
	namespace: "sap.fe.macros"
})
export default class AnalyticalKPITagBlock extends BuildingBlockBase {
	/**
	 * The ID of the KPI
	 */
	@blockAttribute({ type: "string", required: true })
	public id!: string;

	/**
	 * Path to the DataPoint annotation of the KPI
	 */
	@blockAttribute({ type: "sap.ui.model.Context", required: true })
	public metaPath!: Context;

	/**
	 * The name of the runtime model from where we fetch the KPI properties
	 */
	@blockAttribute({ type: "string", required: true })
	public kpiModelName!: string;

	/**
	 * Set it to `true` if the KPI value has an associated currency or unit of measure
	 */
	@blockAttribute({ type: "boolean", required: false })
	public hasUnit?: boolean;

	/**
	 * Creates a binding expression for a specific property in the KPI model.
	 *
	 * @param propertyName This is the name of the property that finds the KPI data in the associated KPI model.
	 * @returns A binding expression
	 */
	getKpiPropertyExpression(propertyName: string): BindingToolkitExpression<string> {
		return pathInModel(`/${this.id}/manifest/sap.card/data/json/${propertyName}`, this.kpiModelName);
	}

	/**
	 * Creates binding expressions for the KPITag's text and tooltip.
	 *
	 * @returns Object containing the binding expressions for the text and the tooltip
	 */
	getBindingExpressions(): { text?: BindingToolkitExpression<string>; tooltip?: BindingToolkitExpression<string> } {
		const kpiTitle = this.metaPath.getProperty("Title");

		if (!kpiTitle) {
			return { text: undefined, tooltip: undefined };
		}

		const titleExpression = resolveBindingString<string>(kpiTitle);
		return {
			text: formatResult([titleExpression], kpiFormatters.labelFormat),
			tooltip: formatResult(
				[
					titleExpression,
					this.getKpiPropertyExpression("mainValueUnscaled"),
					this.getKpiPropertyExpression("mainUnit"),
					this.getKpiPropertyExpression("mainCriticality"),
					String(this.hasUnit)
				],
				kpiFormatters.tooltipFormat
			)
		};
	}

	/**
	 * The template function of the building block.
	 *
	 * @returns An XML-based string
	 */
	getTemplate(): string {
		const { text, tooltip } = this.getBindingExpressions();
		return xml`<macros:KPITag
			id="kpiTag-${this.id}"
			text="${text}"
			status="${this.getKpiPropertyExpression("mainCriticality")}"
			tooltip="${tooltip}"
			press=".kpiManagement.onKPIPressed(\${$source>},'${this.id}')"
			number="${this.getKpiPropertyExpression("mainValue")}"
			unit="${this.getKpiPropertyExpression("mainUnit")}"
		/>`;
	}
}
