import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import { type TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { compileExpression } from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import Link from "sap/m/Link";
import type Popover from "sap/m/Popover";
import MLibrary from "sap/m/library";
import type UI5Event from "sap/ui/base/Event";
import CustomData from "sap/ui/core/CustomData";

import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";

@defineBuildingBlock({ name: "Email", namespace: "sap.fe.macros" })
export default class EmailBlock extends RuntimeBuildingBlock {
	@blockAttribute({
		type: "string"
	})
	id!: string;

	@blockAttribute({
		type: "boolean",
		bindable: true
	})
	visible: CompiledBindingToolkitExpression = "true";

	@blockAttribute({
		type: "boolean",
		bindable: true
	})
	enabled: CompiledBindingToolkitExpression = "true";

	@blockAttribute({
		type: "string",
		bindable: true
	})
	text: CompiledBindingToolkitExpression = "";

	@blockAttribute({
		type: "string",
		bindable: true
	})
	mail: CompiledBindingToolkitExpression = "";

	@blockAttribute({
		type: "string"
	})
	emptyIndicatorMode = "Off";

	@blockAttribute({
		type: "string"
	})
	ariaLabelledBy = "";

	appComponent?: AppComponent;

	async isTeamsConnectionActive(): Promise<boolean> {
		if (this.appComponent) {
			return this.appComponent.getCollaborativeToolsService().isContactsCollaborationSupported();
		} else {
			return false;
		}
	}

	getMailPopoverFromMsTeamsIntegration(mail: string): Promise<Popover | undefined> | undefined {
		if (this.appComponent) {
			return this.appComponent.getCollaborativeToolsService().getMailPopoverFromMsTeamsIntegration(mail);
		} else {
			return undefined;
		}
	}

	constructor(props: PropertiesOf<EmailBlock>, _controlConfiguration?: unknown, _visitorSettings?: TemplateProcessorSettings) {
		super(props, _controlConfiguration, _visitorSettings);
		this.appComponent = _visitorSettings?.appComponent;
	}

	async openPopover(event: UI5Event): Promise<void> {
		event.preventDefault(); // stop default behavior based on href
		let revertToDefaultBehaviour = false;
		const link = event.getSource() as Link;
		const mail = link.data("mail");

		// we need to check if the teams connection is active now because at templating the teamshelper service might not have been initialized yet
		if (await this.isTeamsConnectionActive()) {
			if (mail) {
				try {
					const popover = await this.getMailPopoverFromMsTeamsIntegration(mail);
					(popover as Popover).openBy(link);
				} catch (e) {
					Log.error(`Failed to retrieve Teams minimal popover for email :${e}`);
					revertToDefaultBehaviour = true;
				}
			}
		} else {
			revertToDefaultBehaviour = true;
		}
		if (revertToDefaultBehaviour) {
			MLibrary.URLHelper.redirect(`mailto:${mail}`);
		}
	}

	getContent(): Link {
		const href = `mailto:${this.mail}`;
		const link = (
			<Link
				id={this.id}
				visible={this.visible}
				text={this.text}
				href={href}
				enabled={this.enabled}
				emptyIndicatorMode={this.emptyIndicatorMode}
				class="sapMTextRenderWhitespaceWrap"
				press={async (event: UI5Event): Promise<void> => this.openPopover(event)}
			/>
		);
		if (this.ariaLabelledBy) {
			link.addAriaLabelledBy(this.ariaLabelledBy);
		}

		link.addCustomData(new CustomData({ key: "mail", value: compileExpression(this.mail) }));
		return link;
	}
}
