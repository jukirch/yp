import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAttribute, blockEvent, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";

/**
 * Building block used to create a KPI tag.
 *
 * @public
 */
@defineBuildingBlock({
	name: "KPITag",
	namespace: "sap.fe.macros"
})
export default class KPITagBlock extends BuildingBlockBase {
	/**
	 * The ID of the KPI
	 */
	@blockAttribute({ type: "string", required: true })
	public id!: string;

	/**
	 * The Text to be displayed.
	 *
	 * @public
	 */
	@blockAttribute({ type: "string" })
	public text?: string;

	/**
	 * The Status to be displayed.
	 *
	 * @public
	 */
	@blockAttribute({ type: "string", allowedValues: ["Success", "Error", "Warning", "None", "Information"] })
	public status = "None";

	/**
	 * The Tooltip to be displayed.
	 *
	 * @public
	 */
	@blockAttribute({ type: "string" })
	public tooltip?: string;

	/**
	 * An event is triggered when the KPI is pressed.
	 *
	 * @public
	 */
	@blockEvent()
	public press?: string;

	/**
	 * The Number to be displayed.
	 *
	 * @public
	 */
	@blockAttribute({ type: "number", required: true })
	public number!: number;

	/**
	 * The Unit of Measure of the number to be displayed.
	 *
	 * @public
	 */
	@blockAttribute({ type: "string" })
	public unit?: string;

	/**
	 * Set it to `true` if the KPI should display its status icon.
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", required: false })
	public showIcon = false;

	/**
	 * The template function of the building block.
	 *
	 * @returns An XML-based string
	 */
	getTemplate() {
		return xml`<m:GenericTag
			id="${this.id}"
			text="${this.text}"
			design="${this.showIcon ? "Full" : "StatusIconHidden"}"
			status="${this.status}"
			class="sapUiTinyMarginBegin"
			tooltip="${this.tooltip}"
			press="${this.press}"
		>
			<m:ObjectNumber
				state="${this.status}"
				emphasized="false"
				number="${this.number}"
				unit="${this.unit}"

			/>
		</m:GenericTag>`;
	}
}
