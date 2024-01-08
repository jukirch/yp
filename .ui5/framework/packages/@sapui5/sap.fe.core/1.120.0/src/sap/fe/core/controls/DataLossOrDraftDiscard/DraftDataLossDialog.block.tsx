import { defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { defineReference } from "sap/fe/core/helpers/ClassSupport";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type { Ref } from "sap/fe/core/jsx-runtime/jsx";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import List from "sap/m/List";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import CustomData from "sap/ui/core/CustomData";
import type UI5Element from "sap/ui/core/Element";
import { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type PageController from "../../PageController";
import type ResourceModel from "../../ResourceModel";

@defineBuildingBlock({
	name: "DraftDataLossDialog",
	namespace: "sap.fe.core.controllerextensions"
})
export default class DraftDataLossDialogBlock extends RuntimeBuildingBlock {
	constructor(props: PropertiesOf<DraftDataLossDialogBlock>) {
		super(props);
	}

	@defineReference()
	dataLossDialog!: Ref<Dialog>;

	@defineReference()
	optionsList!: Ref<List>;

	private view!: View;

	private dataLossResourceModel!: ResourceModel;

	/**
	 * Resolves the promise with the selected dialog list option
	 */
	private promiseResolve!: Function;

	/**
	 * Opens the data loss dialog.
	 *
	 * @param controller
	 */
	public async open(controller: PageController): Promise<unknown> {
		this.view = controller.getView();
		this.dataLossResourceModel = getResourceModel(this.view);
		this.getContent();
		const dataLossConfirm = (): void => this.handleDataLossOk();
		this.optionsList.current?.addEventDelegate({
			onkeyup: function (e: KeyboardEvent) {
				if (e.key === "Enter") {
					dataLossConfirm();
				}
			}
		});
		this.view.addDependent(this.dataLossDialog.current as UI5Element);
		this.dataLossDialog.current?.open();
		this.selectAndFocusFirstEntry();

		return new Promise((resolve) => {
			this.promiseResolve = resolve;
		});
	}

	/**
	 * Handler to close the dataloss dialog.
	 *
	 */
	public close(): void {
		this.dataLossDialog.current?.close();
		this.dataLossDialog.current?.destroy();
	}

	/**
	 * Executes the logic when the data loss dialog is confirmed. The selection of an option resolves the promise and leads to the
	 * processing of the originally triggered action like e.g. a back navigation.
	 *
	 */

	private handleDataLossOk(): void {
		this.promiseResolve(this.getSelectedKey());
	}

	/**
	 * Handler to close the dataloss dialog.
	 *
	 */
	private handleDataLossCancel(): void {
		this.promiseResolve("cancel");
	}

	/**
	 * Sets the focus on the first list item of the dialog.
	 *
	 */
	private selectAndFocusFirstEntry() {
		const firstListItemOption: CustomListItem = this.optionsList.current?.getItems()[0] as CustomListItem;
		this.optionsList.current?.setSelectedItem(firstListItemOption);
		// We do not set the focus on the button, but catch the ENTER key in the dialog
		// and process it as Ok, since focusing the button was reported as an ACC issue
		firstListItemOption?.focus();
	}

	/**
	 * Gets the key of the selected item from the list of options that was set via customData.
	 *
	 * @returns The key of the currently selected item
	 */
	private getSelectedKey() {
		const optionsList = this.optionsList.current as List;
		return optionsList.getSelectedItem().data("itemKey");
	}

	/**
	 * Returns the confirm button.
	 *
	 * @returns A button
	 */
	private getConfirmButton() {
		return (
			<Button
				text={this.dataLossResourceModel.getText("C_COMMON_DIALOG_OK")}
				type={"Emphasized"}
				press={(): void => this.handleDataLossOk()}
			/>
		) as Button;
	}

	/**
	 * Returns the cancel button.
	 *
	 * @returns A button
	 */
	private getCancelButton(): Button {
		return (
			<Button text={this.dataLossResourceModel.getText("C_COMMON_DIALOG_CANCEL")} press={(): void => this.handleDataLossCancel()} />
		) as Button;
	}

	/**
	 * The building block render function.
	 *
	 * @returns An XML-based string
	 */
	getContent(): Dialog {
		const hasActiveEntity = this.view.getBindingContext()?.getObject().HasActiveEntity;
		const description = hasActiveEntity
			? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_SAVE")
			: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_CREATE");
		const createOrSaveLabel = hasActiveEntity
			? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_RBL")
			: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_RBL");
		const createOrSaveText = hasActiveEntity
			? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_TOL")
			: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_TOL");
		return (
			<Dialog
				title={this.dataLossResourceModel.getText("WARNING")}
				state={ValueState.Warning}
				type={"Message"}
				contentWidth={"22rem"}
				ref={this.dataLossDialog}
			>
				{{
					content: (
						<>
							<Text text={description} class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom" />
							<List
								mode="SingleSelectLeft"
								showSeparators="None"
								includeItemInSelection="true"
								backgroundDesign="Transparent"
								class="sapUiNoContentPadding"
								ref={this.optionsList}
							>
								<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionSave" })]}>
									<VBox class="sapUiTinyMargin">
										<Label text={createOrSaveLabel} design="Bold" />
										<Text text={createOrSaveText} />
									</VBox>
								</CustomListItem>
								<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionKeep" })]}>
									<VBox class="sapUiTinyMargin">
										<Label
											text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_RBL")}
											design="Bold"
										/>
										<Text text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_TOL")} />
									</VBox>
								</CustomListItem>
								<CustomListItem customData={[new CustomData({ key: "itemKey", value: "draftDataLossOptionDiscard" })]}>
									<VBox class="sapUiTinyMargin">
										<Label
											text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_RBL")}
											design="Bold"
										/>
										<Text text={this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_TOL")} />
									</VBox>
								</CustomListItem>
							</List>
						</>
					),
					buttons: (
						<>
							confirmButton = {this.getConfirmButton()}
							cancelButton = {this.getCancelButton()}
						</>
					)
				}}
			</Dialog>
		) as Dialog;
	}
}
