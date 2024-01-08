import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { compileExpression } from "sap/fe/core/helpers/BindingToolkit";
import type { ContactOption as TeamsContactOption } from "sap/suite/ui/commons/collaboration/TeamsHelperService";
import CustomData from "sap/ui/core/CustomData";

import type AppComponent from "sap/fe/core/AppComponent";
import { defineReference } from "sap/fe/core/helpers/ClassSupport";
import type { Ref } from "sap/fe/core/jsx-runtime/jsx";
import Button from "sap/m/Button";
import Toolbar from "sap/m/Toolbar";
import type View from "sap/ui/core/mvc/View";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";

@defineBuildingBlock({ name: "TeamContactOptions", namespace: "sap.fe.macros" })
export default class TeamContactOptionsBlock extends RuntimeBuildingBlock {
	@blockAttribute({
		type: "string"
	})
	id?: string;

	@blockAttribute({
		type: "string",
		bindable: true
	})
	mail: CompiledBindingToolkitExpression = "";

	@defineReference()
	toolbar!: Ref<Toolbar>;

	visible = false;

	public isInitialized?: Promise<void>;

	async retrieveContactOptions(appComponent: AppComponent | undefined): Promise<void> {
		const contactOptions = appComponent ? await appComponent.getCollaborativeToolsService().getTeamContactOptions() : undefined;
		if (!contactOptions?.length || !this.mail) {
			return;
		}
		this.visible = true;
		this.toolbar.current?.removeAllContent();
		contactOptions.map((contactOptionDef) => {
			this.toolbar.current?.addContent(this.getContactOptionButton(contactOptionDef));
		});

		this.visible = true;
		this.toolbar.current?.setVisible(true);
	}

	getContactOptionButton(contactOptionDef: TeamsContactOption): Button {
		const button = <Button icon={contactOptionDef.icon} class="sapUiSmallMarginEnd" type="Transparent" />;
		button.attachPress(contactOptionDef.callBackHandler);
		button.addCustomData(new CustomData({ key: "email", value: compileExpression(this.mail) }));
		button.addCustomData(new CustomData({ key: "type", value: contactOptionDef.key }));
		FESRHelper.setSemanticStepname(button, "press", contactOptionDef.fesrStepName);

		return button;
	}

	getContent(containingView: View, appComponent: AppComponent): Toolbar {
		const toolbar = <Toolbar id={this.id} ref={this.toolbar} visible={this.visible} width="100%" />;
		this.isInitialized = this.retrieveContactOptions(appComponent);
		return toolbar;
	}
}
