import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";

/**
 * Building block for adding overflow toolbar buttons to integrate into the flexible column layout support from Fiori elements.
 *
 * Usage example:
 * <pre>
 * &lt;macro:FlexibleColumnLayoutActions /&gt;
 * </pre>
 *
 * @public
 * @since 1.93.0
 */
@defineBuildingBlock({
	name: "FlexibleColumnLayoutActions",
	namespace: "sap.fe.macros.fcl",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.m.OverflowToolbarButton"]
})
export default class FlexibleColumnLayoutActionsBlock extends BuildingBlockBase {
	getTemplate() {
		return xml`
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::FullScreen"
                type="Transparent"
                icon="{fclhelper>/actionButtonsInfo/switchIcon}"
                visible="{fclhelper>/actionButtonsInfo/switchVisible}"
                press="._routing.switchFullScreen()"
            />
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::Close"
                type="Transparent"
                icon="sap-icon://decline"
                tooltip="{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}"
                visible="{fclhelper>/actionButtonsInfo/closeVisible}"
                press="._routing.closeColumn()"
            />`;
	}
}