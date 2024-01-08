import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAggregation, blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import type Context from "sap/ui/model/Context";

/**
 * Content of a custom fragment
 *
 * @private
 * @experimental
 */
@defineBuildingBlock({
	name: "CustomFragment",
	namespace: "sap.fe.macros.fpm"
})
export default class CustomFragmentBlock extends BuildingBlockBase {
	/**
	 * ID of the custom fragment
	 */
	@blockAttribute({ type: "string", required: true })
	public id!: string;

	/**
	 * Context Path
	 */
	@blockAttribute({ type: "sap.ui.model.Context", required: false })
	public contextPath?: Context;

	/**
	 *  Name of the custom fragment
	 */
	@blockAttribute({ type: "string", required: true })
	public fragmentName!: string;

	@blockAggregation({ type: "sap.ui.core.CustomData", slot: "childCustomData" })
	public childCustomData!: Element;
	/**
	 * The building block template function.
	 *
	 * @returns An XML-based string
	 */
	getTemplate() {
		const fragmentInstanceName = this.fragmentName + "-JS".replace(/\//g, ".");
		const customData: Element = this.childCustomData;
		const customDataObj: Record<string, string | null> = {};
		let child = customData?.firstElementChild;
		while (child) {
			const name = child.getAttribute("key");
			if (name !== null) {
				customDataObj[name] = child.getAttribute("value");
			}
			child = child.nextElementSibling;
		}
		return xml`<macros:CustomFragmentFragment
			xmlns:compo="http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1"
			xmlns:macros="sap.fe.macros.fpm"
			fragmentName="${fragmentInstanceName}"
			${this.attr("childCustomData", Object.keys(customDataObj).length ? JSON.stringify(customDataObj) : undefined)}
			id="${this.id}"
			type="CUSTOM"
		>
			<compo:fragmentContent>
				<core:FragmentDefinition>
					<core:Fragment fragmentName="${this.fragmentName}" type="XML"/>
				</core:FragmentDefinition>
			</compo:fragmentContent>
		</macros:CustomFragmentFragment>`;
	}
}
