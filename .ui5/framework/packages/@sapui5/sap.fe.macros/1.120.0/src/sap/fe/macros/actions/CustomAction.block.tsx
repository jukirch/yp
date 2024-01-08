import Log from "sap/base/Log";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { CommandProperties } from "sap/fe/core/jsx-runtime/jsx";
import Button from "sap/m/Button";
import type Event from "sap/ui/base/Event";

@defineBuildingBlock({ name: "CustomAction", namespace: "sap.fe.macros.actions" })
export default class CustomActionBlock extends RuntimeBuildingBlock {
	@blockAttribute({ type: "object", required: true })
	action!: CustomAction;

	@blockAttribute({
		type: "string",
		required: true
	})
	id!: string;

	getContent() {
		let pressEvent: { press: (event: Event) => void } | { "jsx:command": CommandProperties };
		if (this.action.command) {
			pressEvent = { "jsx:command": `${this.action.command}|press` as CommandProperties };
		} else {
			pressEvent = {
				press: (event: Event) => {
					FPMHelper.actionWrapper(event, this.action.handlerModule, this.action.handlerMethod, {}).catch((error: unknown) =>
						Log.error(error as string)
					);
				}
			};
		}
		return (
			<Button
				id={this.id}
				text={this.action.text ?? ""}
				{...pressEvent}
				type="Transparent"
				visible={this.action.visible}
				enabled={this.action.enabled}
			/>
		) as Button;
	}
}
