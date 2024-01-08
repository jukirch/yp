import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import type { BindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { constant, not, or } from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { defineReference } from "sap/fe/core/helpers/ClassSupport";
import type { Ref } from "sap/fe/core/jsx-runtime/jsx";
import FormattedText from "sap/m/FormattedText";
import VBox from "sap/m/VBox";
import type Event from "sap/ui/base/Event";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import type RichTextEditor from "sap/ui/richtexteditor/RichTextEditor";

export type UnparsedButtonGroup = {
	name?: string;
	visible?: string;
	priority?: string;
	customToolbarPriority?: string;
	buttons?: string;
};

type ParsedButtonGroup = {
	name: string;
	visible: boolean;
	priority: number;
	customToolbarPriority: number;
	buttons: string[];
};

/**
 * Building block that exposes the RichTextEditor UI5 control.
 *
 * It's used to enter formatted text, and uses the third-party component called TinyMCE.
 *
 * @public
 * @since 1.117.0
 */
@defineBuildingBlock({
	name: "RichTextEditor",
	namespace: "sap.fe.macros",
	libraries: ["sap/ui/richtexteditor"]
})
export default class RichTextEditorBlock extends RuntimeBuildingBlock {
	/**
	 * ID of the editor
	 */
	@blockAttribute({ type: "string", required: true })
	id!: string;

	/**
	 * The value contained in the editor. You can use this attribute to set a default value.
	 *
	 * @public
	 */
	@blockAttribute({ type: "string", bindable: true })
	value?: BindingToolkitExpression<string>;

	/**
	 * Use the readOnly attribute to override the edit flow of the page.
	 * By setting 'readOnly' to true, a FormattedText will be displayed instead of the editor.
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", bindable: true })
	readOnly: BindingToolkitExpression<boolean> = constant(false);

	/**
	 * With the 'buttonGroups' attribute you can customize the buttons that are displayed on the toolbar of the editor.
	 *
	 * @public
	 */
	@blockAttribute({ type: "array" })
	buttonGroups?: UnparsedButtonGroup[];

	/**
	 * Use the 'required' attribute to make sure that the editor is filled with some text.
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", bindable: true })
	required: BindingToolkitExpression<boolean> = constant(false);

	/**
	 * Reference to the RichTextEditor
	 */
	@defineReference()
	richTextEditor!: Ref<RichTextEditor>;

	/**
	 * Reference to the FormattedText
	 */
	@defineReference()
	formattedText!: Ref<FormattedText>;

	/**
	 * Reference to the VBox
	 */
	@defineReference()
	bbContainer!: Ref<VBox>;

	private static RTEControl: typeof RichTextEditor;

	/**
	 * Represents a RichTextEditor.
	 *
	 * @param properties Properties of this building block
	 */
	constructor(properties: PropertiesOf<RichTextEditorBlock>) {
		super(properties);
	}

	static async load(): Promise<typeof RichTextEditorBlock> {
		await super.load();
		if (RichTextEditorBlock.RTEControl === undefined) {
			const { default: RTEControl } = await import("sap/ui/richtexteditor/RichTextEditor");
			RichTextEditorBlock.RTEControl = RTEControl;
		}

		return this;
	}

	/**
	 * Method that returns the RichTextEditor control.
	 *
	 * @returns RTEControl
	 */
	getRTE = (): RichTextEditor => {
		return (
			<RichTextEditorBlock.RTEControl
				id={this.id}
				ref={this.richTextEditor}
				value={this.value}
				visible={true}
				customToolbar={true}
				editable={true}
				editorType="TinyMCE6"
				showGroupFontStyle={true}
				showGroupTextAlign={true}
				showGroupStructure={true}
				showGroupFont={false}
				showGroupClipboard={true}
				showGroupInsert={false}
				showGroupLink={false}
				showGroupUndo={false}
				sanitizeValue={true}
				wrapping={true}
				width={"100%"}
				required={this.required}
				{...this.getButtonGroups()}
			/>
		) as RichTextEditor;
	};

	/**
	 * Method that returns the button customizations for the editor toolbar.
	 * Because all values come as strings from XML, some parsing needs to be done to get attributes with the correct type.
	 *
	 * @returns The button groups.
	 */
	getButtonGroups = (): { buttonGroups?: ParsedButtonGroup[] } => {
		return this.buttonGroups
			? {
					buttonGroups: this.buttonGroups.map((buttonGroup: UnparsedButtonGroup) => ({
						name: buttonGroup.name ?? "",
						visible: buttonGroup.visible === "true",
						priority: parseInt(buttonGroup.priority || "", 10),
						customToolbarPriority: parseInt(buttonGroup.customToolbarPriority || "", 10),
						buttons: buttonGroup.buttons?.split(",") || []
					}))
			  }
			: {};
	};

	/**
	 * Hook onto the model context change event to make sure we will be notified when the `visible` binding value change.
	 * When it changes we need to make sure to reattach to the current visibility binding.
	 */
	onFormattedTextModelContextChange = (): void => {
		if (this.formattedText.current && this.formattedText.current.getBinding("visible")) {
			this.formattedText.current.getBinding("visible")?.detachChange(this.toggleRTEAvailability);
			this.formattedText.current.getBinding("visible")?.attachChange(this.toggleRTEAvailability);
		}
	};

	/**
	 * Toggle between the RichTextEditor and the FormattedText control.
	 *
	 * @param args Allows access to the FormattedText 'visible' attribute
	 *
	 * In order to follow the next guideline:
	 *
	 * `Make sure you destroy the RichTextEditor instance instead of hiding it and create a new one
	 * when you show it again.`
	 *
	 * The editor is only added to the DOM when it is needed to edit its content.
	 * In display mode, the editor is removed from the DOM and the
	 * FormattedText control is displayed with the previously added/edited content.
	 */
	toggleRTEAvailability = (args: Event): void => {
		// we need the reversed value of FormattedText visible property
		const displayEditor = !(args.getSource() as CompositeBinding)?.getExternalValue();

		// we should always check if there's already a rte in the dom
		// so we don't render it twice
		if (displayEditor && !this.richTextEditor.current) {
			this.bbContainer.current?.addItem(this.getRTE());
		} else if (!displayEditor) {
			// we have to hide the editor before destroying it so we don't see the html
			// on the page for a split second when we change from edit to readOnly mode
			// timeout is needed so the editor has time to hide
			setTimeout(() => {
				// destroy the elements
				this.richTextEditor.current?.destroy();
				// clean the refs
				this.richTextEditor.current = undefined;
			});
		}
	};

	/**
	 * Method that returns the content of the RichTextEditor building block.
	 *
	 * @returns The result of the building block rendering
	 */
	getContent(): VBox {
		const vboxEl = (
			<VBox ref={this.bbContainer} width={"100%"} height={"100%"}>
				<FormattedText
					ref={this.formattedText}
					htmlText={this.value}
					visible={or(this.readOnly, not(UI.IsEditable))}
					modelContextChange={this.onFormattedTextModelContextChange}
				/>
			</VBox>
		) as VBox;

		// FIXME: Workaround when the property change event doesn't get triggered
		setTimeout(() => {
			const isVisible = this.formattedText.current?.getVisible();
			if (isVisible === true) {
				this.formattedText.current?.getBinding("visible")?.fireEvent("change", { oSource: this.formattedText.current });
			}
		});

		return vboxEl;
	}
}
