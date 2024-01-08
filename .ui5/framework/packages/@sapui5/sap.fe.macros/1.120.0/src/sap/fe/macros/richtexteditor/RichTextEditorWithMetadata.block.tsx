import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import RuntimeBuildingBlock from "sap/fe/core/buildingBlocks/RuntimeBuildingBlock";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { BindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { constant } from "sap/fe/core/helpers/BindingToolkit";
import { getValueBinding } from "sap/fe/macros/field/FieldTemplating";
import type Control from "sap/ui/core/Control";
import type Context from "sap/ui/model/odata/v4/Context";
import type { UnparsedButtonGroup } from "./RichTextEditor.block";
import RichTextEditorBlock from "./RichTextEditor.block";

/**
 * Metadata-driven building block that exposes the RichTextEditor UI5 control.
 *
 * It's used to enter formatted text and uses the third-party component called TinyMCE.
 *
 * @public
 * @since 1.117.0
 */
@defineBuildingBlock({
	name: "RichTextEditorWithMetadata",
	namespace: "sap.fe.macros"
})
export default class RichTextEditorWithMetadataBlock extends RuntimeBuildingBlock {
	/**
	 * ID of the editor
	 */
	@blockAttribute({ type: "string", required: true })
	id!: string;

	/**
	 * The metaPath of the displayed property
	 *
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true
	})
	metaPath!: Context;

	/**
	 * The context path of the property displayed
	 *
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true
	})
	contextPath!: Context;

	/**
	 * Use the readOnly attribute to override the edit flow of the page.
	 * By setting 'readOnly' to true, a FormattedText is displayed instead of the editor.
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", bindable: true })
	readOnly: BindingToolkitExpression<boolean> = constant(false);

	/**
	 * With the 'buttonGroups' attribute, you can customize the buttons that are displayed on the toolbar of the editor.
	 *
	 * @public
	 */
	@blockAttribute({ type: "array" })
	buttonGroups?: UnparsedButtonGroup[];

	/**
	 * Use the 'required' attribute, to make sure that the editor is filled with some text.
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", bindable: true })
	required: BindingToolkitExpression<boolean> = constant(false);

	static async load(): Promise<typeof this> {
		await RichTextEditorBlock.load();
		return this;
	}

	getContent(): Control {
		const involvedDataModelObjects = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
		const valueBinding = getValueBinding(involvedDataModelObjects, {});

		return (
			<RichTextEditorBlock
				id={this.id}
				readOnly={this.readOnly}
				buttonGroups={this.buttonGroups}
				required={this.required}
				value={valueBinding !== undefined ? constant(valueBinding) : valueBinding}
			/>
		);
	}
}
