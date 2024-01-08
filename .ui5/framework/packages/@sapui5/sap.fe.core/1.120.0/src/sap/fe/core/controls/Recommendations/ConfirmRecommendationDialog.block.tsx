import Log from "sap/base/Log";
import { defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { defineReference } from "sap/fe/core/helpers/ClassSupport";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type { Ref } from "sap/fe/core/jsx-runtime/jsx";
import Button from "sap/m/Button";
import Column from "sap/m/Column";
import ColumnListItem from "sap/m/ColumnListItem";
import Dialog from "sap/m/Dialog";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import Table from "sap/m/Table";
import Text from "sap/m/Text";
import type UI5Element from "sap/ui/core/Element";
import { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type Model from "sap/ui/model/Model";
import type { EventHandler } from "types/extension_types";
import type PageController from "../../PageController";
import type ResourceModel from "../../ResourceModel";
import type { AcceptAllParams } from "../../controllerextensions/Recommendations";
import valueFormatters from "../../formatters/ValueFormatter";
import { standardRecommendationHelper, type StandardRecommendationAdditionalValues } from "../../helpers/StandardRecommendationHelper";

@defineBuildingBlock({
	name: "ConfirmRecommendationDialog",
	namespace: "sap.fe.core.controllerextensions"
})
export default class ConfirmRecommendationDialogBlock extends RuntimeBuildingBlock {
	constructor(props: PropertiesOf<ConfirmRecommendationDialogBlock>) {
		super(props);
		this.view = props.view as View;
		this.confirmRecommendationDialogResourceModel = getResourceModel(this.view);
	}

	@defineReference()
	confirmRecommendationDialog!: Ref<Dialog>;

	public view!: View;

	private confirmRecommendationDialogResourceModel!: ResourceModel;

	protected key!: string;

	private isSave!: boolean;

	private acceptAllParams!: AcceptAllParams;

	/**
	 * Resolves the promise with the selected dialog list option
	 */
	private promiseResolve!: Function;

	/**
	 * Rejects the promise of open dialog
	 */
	private promiseReject!: Function;

	/**
	 * Opens the confirm recommendations dialog.
	 *
	 * @param isSave Boolean flag which would be set to true if we are saving the document and would be false if we do apply changes
	 * @returns Promise which would resolve with true if Accept,Ignore are pressed or when there are no recommendations and false when continue editing is pressed
	 */
	public async open(isSave: boolean): Promise<boolean> {
		this.acceptAllParams = await (this.view?.getController() as PageController).recommendations.fetchAcceptAllParams();
		if (!this.acceptAllParams?.recommendationData?.length || !this.getColumnListItems()?.length) {
			return true;
		}
		this.isSave = isSave;
		const dialog = this.getContent();
		dialog?.setEscapeHandler(this.onContinueEditing.bind(this));
		this.view.addDependent(dialog as UI5Element);
		dialog?.open();
		return new Promise((resolve, reject) => {
			this.promiseResolve = resolve;
			this.promiseReject = reject;
		});
	}

	/**
	 * Handler to close the confirmRecommendation dialog.
	 *
	 */
	public close(): void {
		this.confirmRecommendationDialog.current?.close();
		this.confirmRecommendationDialog.current?.destroy();
	}

	/**
	 * Handler for Accept and Save button.
	 */
	private async onAcceptAndSave(): Promise<void> {
		try {
			const isAccepted = await (this.view?.getController() as PageController).recommendations.acceptRecommendations(
				this.acceptAllParams
			);
			if (!isAccepted) {
				this.promiseReject("Accept Failed");
			}
			this.promiseResolve(true);
		} catch {
			Log.error("Accept Recommendations Failed");
			this.promiseReject("Accept Failed");
		} finally {
			this.close();
		}
	}

	/**
	 * Handler for Ignore and Save button.
	 */
	private onIgnoreAndSave(): void {
		this.promiseResolve(true);
		this.close();
	}

	/**
	 * Handler for Continue Editing button.
	 */
	private onContinueEditing(): void {
		this.promiseResolve(false);
		this.close();
	}

	/**
	 * Fetches all the ColumnListItems.
	 *
	 * @returns Array of ColumnListItems
	 */
	private getColumnListItems(): Array<ColumnListItem> {
		const columnListItems: Array<ColumnListItem> = [];
		for (const recommendationData of this.acceptAllParams?.recommendationData || []) {
			if (recommendationData.value || recommendationData.text) {
				const targetPath = recommendationData.context?.getPath() + "/" + recommendationData.propertyPath;
				columnListItems.push(
					this.getColumnListItem(
						recommendationData,
						this.getFieldName(targetPath),
						standardRecommendationHelper.getDisplayModeForTargetPath(
							targetPath,
							this.view?.getBindingContext()?.getModel() as Model
						)
					)
				);
			}
		}
		return columnListItems;
	}

	/**
	 * Fetches a ColumnListItem.
	 *
	 * @param recommendation
	 * @param fieldName
	 * @param displayMode
	 * @returns ColumnListItem
	 */
	private getColumnListItem(
		recommendation: StandardRecommendationAdditionalValues,
		fieldName: string,
		displayMode: string
	): ColumnListItem {
		return (
			<ColumnListItem vAlign="Middle">
				{{
					cells: (
						<>
							<Text text={fieldName} />
							<Text text={this.getText(recommendation, displayMode)} />
						</>
					)
				}}
			</ColumnListItem>
		);
	}

	/**
	 * Gets the label or name of the Field based on its property path.
	 *
	 * @param targetPath
	 * @returns Returns the label of the Field.
	 */
	private getFieldName(targetPath: string): string {
		const involvedDataModelObject = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(
			targetPath,
			this.view?.getBindingContext()?.getModel() as Model
		);
		return involvedDataModelObject?.targetObject?.annotations?.Common?.Label || targetPath.split("/")[targetPath.split("/").length - 1];
	}
	/**
	 * Fetches text for recommendation based on display mode.
	 *
	 * @param recommendation
	 * @param displayMode
	 * @returns Text for a recommendation
	 */
	private getText(recommendation: StandardRecommendationAdditionalValues, displayMode: string): string {
		if (recommendation.text && recommendation.value) {
			switch (displayMode) {
				case "Description":
					return recommendation.text;
				case "DescriptionValue":
					return valueFormatters.formatWithBrackets(recommendation.text, recommendation.value);
				case "ValueDescription":
					return valueFormatters.formatWithBrackets(recommendation.value, recommendation.text);
				case "Value":
					return recommendation.value;
			}
		}
		return recommendation.value || "";
	}

	/**
	 * Fetches FlexBox as Content.
	 *
	 * @returns FlexBox
	 */
	private getFlexBox(): FlexBox {
		return (
			<FlexBox direction="Column" alignItems="Center" fitContainer="true">
				{{
					items: (
						<>
							<Text
								text={this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT", [
									this.getColumnListItems().length
								])}
								class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
							/>
							{this.getTable()}
							{this.getButton(
								this.isSave
									? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_SAVE")
									: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT"),
								"Emphasized",
								this.onAcceptAndSave.bind(this)
							)}
							{this.getButton(
								this.isSave
									? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_SAVE")
									: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE"),
								"Default",
								this.onIgnoreAndSave.bind(this)
							)}
							{this.getButton(
								this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_CONTINUE_EDITING"),
								"Transparent",
								this.onContinueEditing.bind(this)
							)}
						</>
					)
				}}
			</FlexBox>
		);
	}

	/**
	 * Returns Button with given text, type and pressHandler.
	 *
	 * @param text Text for the button
	 * @param type Type of the button
	 * @param pressHandler Press Handler for the button
	 * @returns Button with given settings
	 */
	private getButton(text: string, type: string, pressHandler: EventHandler<object>): Button {
		return (
			<Button text={text} type={type} width={"100%"} press={pressHandler}>
				{{
					layoutData: (
						<>
							<FlexItemData minWidth={"100%"}></FlexItemData>
						</>
					)
				}}
			</Button>
		);
	}

	/**
	 * Returns Table to render list of acceptable recommendations.
	 *
	 * @returns Table
	 */
	private getTable(): Table {
		return (
			<Table>
				{{
					columns: (
						<>
							<Column>
								<Text text={this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_FIELD")} />
							</Column>
							,
							<Column>
								<Text text={this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_VALUE")} />
							</Column>
						</>
					),
					items: <>{this.getColumnListItems()}</>
				}}
			</Table>
		);
	}

	/**
	 * The building block render function.
	 *
	 * @returns An XML-based string
	 */
	getContent(): Dialog {
		return (
			<Dialog
				title={this.confirmRecommendationDialogResourceModel.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO")}
				state={ValueState.Information}
				type={"Message"}
				ref={this.confirmRecommendationDialog}
				resizable={"true"}
				contentWidth={"30rem"}
			>
				{{
					content: <>{this.getFlexBox()}</>
				}}
			</Dialog>
		) as Dialog;
	}
}
