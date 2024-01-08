import CollaborationActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import { Activity, CollaborationFieldGroupPrefix } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import type { EnhanceWithUI5 } from "sap/fe/core/helpers/ClassSupport";
import { association, defineUI5Class, event, property, xmlEventHandler } from "sap/fe/core/helpers/ClassSupport";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type Button from "sap/m/Button";
import type CheckBox from "sap/m/CheckBox";
import type HBox from "sap/m/HBox";
import type InputBase from "sap/m/InputBase";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import type { MessageType } from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import type MDCField from "sap/ui/mdc/Field";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import type Context from "sap/ui/model/odata/v4/Context";
import MacroAPI from "../MacroAPI";
import type FileWrapper from "../controls/FileWrapper";

/**
 * Additional format options for the field.
 *
 * @alias sap.fe.macros.FieldFormatOptions
 * @public
 */
export type FieldFormatOptions = {
	/**
	 *  Defines how the field value and associated text will be displayed together.<br/>
	 *
	 *  Allowed values are "Value", "Description", "DescriptionValue" and "ValueDescription"
	 *
	 *  @public
	 */
	displayMode: "Value" | "Description" | "DescriptionValue" | "ValueDescription";
	/**
	 * Defines if and how the field measure will be displayed.<br/>
	 *
	 * Allowed values are "Hidden" and "ReadOnly"
	 *
	 *  @public
	 */
	measureDisplayMode: "Hidden" | "ReadOnly";
	/**
	 * Maximum number of lines for multiline texts in edit mode.<br/>
	 *
	 *  @public
	 */
	textLinesEdit: number;
	/**
	 * Maximum number of lines that multiline texts in edit mode can grow to.<br/>
	 *
	 *  @public
	 */
	textMaxLines: number;
	/**
	 * Maximum number of characters from the beginning of the text field that are shown initially.<br/>
	 *
	 *  @public
	 */
	textMaxCharactersDisplay: number;
	/**
	 * Defines how the full text will be displayed.<br/>
	 *
	 * Allowed values are "InPlace" and "Popover"
	 *
	 *  @public
	 */
	textExpandBehaviorDisplay: "InPlace" | "Popover";
	/**
	 * Defines the maximum number of characters for the multiline text value.<br/>
	 *
	 * If a multiline text exceeds the maximum number of allowed characters, the counter below the input field displays the exact number.
	 *
	 *  @public
	 */
	textMaxLength: number;
	/**
	 * Defines if the date part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *
	 *  @public
	 */
	showDate: boolean;
	/**
	 * Defines if the time part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *
	 *  @public
	 */
	showTime: boolean;
	/**
	 * Defines if the timezone part of a date time with timezone field should be shown. <br/>
	 *
	 * The dateTimeOffset field must have a timezone annotation.
	 *
	 * The default value is true.
	 *
	 *  @public
	 */
	showTimezone: boolean;
};

/**
 * Returns the first visible control in the FieldWrapper.
 *
 * @param oControl FieldWrapper
 * @returns The first visible control
 */
function getControlInFieldWrapper(oControl: Control): Control | undefined {
	if (oControl.isA("sap.fe.macros.controls.FieldWrapper")) {
		const oFieldWrapper = oControl as EnhanceWithUI5<FieldWrapper>;
		const aControls = oFieldWrapper.getEditMode() === "Display" ? [oFieldWrapper.getContentDisplay()] : oFieldWrapper.getContentEdit();
		if (aControls.length >= 1) {
			return aControls.length ? aControls[0] : undefined;
		}
	} else {
		return oControl;
	}
	return undefined;
}

/**
 * Building block for creating a field based on the metadata provided by OData V4.
 * <br>
 * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macro:Field id="MyField" metaPath="MyProperty" /&gt;
 * </pre>
 *
 * @alias sap.fe.macros.Field
 * @public
 */
@defineUI5Class("sap.fe.macros.field.FieldAPI", {
	returnTypes: [
		"sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.field.FieldAPI", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/
	]
})
class FieldAPI extends MacroAPI {
	/**
	 * An expression that allows you to control the editable state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine if the page is currently editable.
	 * Please note that you cannot set a field to editable if it has been defined in the annotation as not editable.
	 *
	 * @private
	 * @deprecated
	 */
	@property({ type: "boolean" })
	editable!: boolean;

	/**
	 * An expression that allows you to control the read-only state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 *
	 * @public
	 */
	@property({ type: "boolean" })
	readOnly!: boolean;

	/**
	 * The identifier of the Field control.
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 *
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: [],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty", "Property"]
	})
	metaPath!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 *
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	contextPath!: string;

	/**
	 * An event containing details is triggered when the value of the field is changed.
	 *
	 * @public
	 */
	@event()
	change!: Function;

	/**
	 * An event containing details is triggered when the value of the field is live changed.
	 *
	 * @public
	 */
	@event()
	liveChange!: Function;

	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: Control;

	@property({ type: "boolean" })
	required!: boolean;

	/**
	 * A set of options that can be configured.
	 *
	 * @public
	 */
	@property({ type: "sap.fe.macros.FieldFormatOptions" })
	formatOptions!: FieldFormatOptions;

	/**
	 * Option to add semantic objects to a field.
	 * Valid options are either a single semantic object, a stringified array of semantic objects
	 * or a single binding expression returning either a single semantic object or an array of semantic objects
	 *
	 * @public
	 */
	@property({ type: "string" })
	semanticObject!: string;

	@property({ type: "boolean" })
	collaborationEnabled!: boolean;

	@property({ type: "boolean" })
	visible!: boolean;

	@property({ type: "string" })
	mainPropertyRelativePath?: string;

	private focusHandlersAttached = false;

	private static lastFocusId: string | undefined;

	private static lastFocusFieldGroups: string | undefined;

	@xmlEventHandler()
	handleChange(oEvent: Field$ChangeEvent): void {
		(this as any).fireChange({ value: this.getValue(), isValid: oEvent.getParameter("valid") });
	}

	@xmlEventHandler()
	handleLiveChange(_event: UI5Event): void {
		this.fireEvent("liveChange");
	}

	static getAPI(ui5Event: UI5Event): FieldAPI | undefined {
		return super.getAPI(ui5Event, "sap.fe.macros.field.FieldAPI") as FieldAPI;
	}

	onBeforeRendering(): void {
		const isArialLabelledByCompliant = function (
			control: Control
		): control is Control & { addAriaLabelledBy: Function; getAriaLabelledBy: Function } {
			return control.isA<Button | FieldWrapper | MDCField | FileWrapper>([
				"sap.m.Button",
				"sap.fe.macros.controls.FieldWrapper",
				"sap.ui.mdc.Field",
				"sap.fe.macros.controls.FileWrapper"
			]);
		};
		const oContent = this.content;
		if (oContent && isArialLabelledByCompliant(oContent) && oContent.addAriaLabelledBy) {
			const aAriaLabelledBy = (this as any).getAriaLabelledBy();

			for (let i = 0; i < aAriaLabelledBy.length; i++) {
				const sId = aAriaLabelledBy[i];
				const aAriaLabelledBys = oContent.getAriaLabelledBy() || [];
				if (aAriaLabelledBys.indexOf(sId) === -1) {
					oContent.addAriaLabelledBy(sId);
				}
			}
		}
	}

	/**
	 * Gets the id of the last focused FieldAPI (if any).
	 *
	 * @returns ID
	 */
	private static getLastFocusId(): string | undefined {
		return FieldAPI.lastFocusId;
	}

	/**
	 * Gets the fieldgroups of the last focused FieldAPI (if any).
	 *
	 * @returns A string containing the fieldgroups separated by ','
	 */
	private static getLastFocusFieldGroups(): string | undefined {
		return FieldAPI.lastFocusFieldGroups;
	}

	/**
	 * Stores information about the last focused FieldAPI (id and fieldgroups).
	 *
	 * @param focusedFieldAPI
	 */
	private static setLastFocusInformation(focusedFieldAPI: FieldAPI | undefined): void {
		FieldAPI.lastFocusId = focusedFieldAPI?.getId();
		FieldAPI.lastFocusFieldGroups = focusedFieldAPI?.getFieldGroupIds().join(",");
	}

	/**
	 * Gets the path used to send collaboration messages.
	 *
	 * @returns The path (or undefined is no valid path could be found)
	 */
	private getCollaborationPath(): string | undefined {
		// Note: we send messages even if the context is inactive (empty creation rows),
		// otherwise we can't update the corresponding locks when the context is activated.
		const bindingContext = this.getBindingContext() as Context | undefined;
		if (!this.mainPropertyRelativePath || !bindingContext) {
			return undefined;
		}

		const fieldWrapper = this.content as FieldWrapper | undefined;
		if (fieldWrapper?.getProperty("editMode") !== "Editable") {
			// The field is not in edit mode --> no collaboration messages
			return undefined;
		}

		return `${bindingContext.getPath()}/${this.mainPropertyRelativePath}`;
	}

	/**
	 * If collaboration is enabled, send a Lock collaboration message.
	 */
	private sendFocusInMessage(): void {
		const collaborationPath = this.getCollaborationPath();

		if (collaborationPath) {
			CollaborationActivitySync.send(this, { action: Activity.Lock, content: collaborationPath });
		}
	}

	/**
	 * If collaboration is enabled, send an Unlock collaboration message.
	 */
	private sendFocusOutMessage(): void {
		const collaborationPath = this.getCollaborationPath();

		if (collaborationPath) {
			CollaborationActivitySync.send(this, { action: Activity.Unlock, content: collaborationPath });
		}
	}

	/**
	 * Callback when the focus is set in the FieldAPI or one of its children.
	 *
	 * @param focusEvent
	 */
	private handleContentFocusIn(focusEvent: FocusEvent): void {
		// We send the event only if the focus was previously out of the FieldAPI
		if (!this.getDomRef()?.contains(focusEvent.relatedTarget as Node | null)) {
			// We need to handle the case where the newly focused FieldAPI is different from the previous one, but they share the same fieldGroupIDs
			// (e.g. fields in different rows in the same column of a table)
			// In such case, the focusOut handler was not called (because we stay in the same fieldGroupID), so we need to send a focusOut event manually
			if (FieldAPI.getLastFocusId() != this.getId() && FieldAPI.getLastFocusFieldGroups() === this.getFieldGroupIds().join(",")) {
				const lastFocused = Core.byId(FieldAPI.getLastFocusId()) as FieldAPI | undefined;
				lastFocused?.sendFocusOutMessage();
			}

			FieldAPI.setLastFocusInformation(this);

			this.sendFocusInMessage();
		}
	}

	/**
	 * Callback when the focus is removed from the FieldAPI or one of its children.
	 *
	 * @param fieldGroupEvent
	 */
	private handleContentFocusOut(fieldGroupEvent: Control$ValidateFieldGroupEvent): void {
		const fieldGroupIds = fieldGroupEvent.getParameter("fieldGroupIds") as string[];

		// We send the event only if the validated fieldCroup corresponds to a collaboration group
		if (
			fieldGroupIds.some((groupId) => {
				return groupId.startsWith(CollaborationFieldGroupPrefix);
			})
		) {
			const sourceControl = fieldGroupEvent.getSource() as Control;

			// Determine if the control that sent the event still has the focus (or one of its children).
			// This could happen e.g. if the user pressed <Enter> to validate the input.
			let currentFocusedControl: ManagedObject | null | undefined = Core.byId(Core.getCurrentFocusedControlId());
			while (currentFocusedControl && currentFocusedControl !== sourceControl) {
				currentFocusedControl = currentFocusedControl.getParent();
			}
			if (currentFocusedControl !== sourceControl) {
				// The control that sent the event isn't focused anymore
				this.sendFocusOutMessage();
				if (FieldAPI.getLastFocusId() === this.getId()) {
					FieldAPI.setLastFocusInformation(undefined);
				}
			}
		}
	}

	onAfterRendering(): void {
		if (this.collaborationEnabled && !this.focusHandlersAttached) {
			// The event delegate doesn't work on the FieldAPI, we need to put it on its content (FieldWrapper)
			this.content?.addEventDelegate(
				{
					onfocusin: this.handleContentFocusIn
				},
				this
			);

			// The validatefieldgroup event doesn't work on the FieldAPI, we need to put it on its content (FieldWrapper)
			this.content?.attachValidateFieldGroup(this.handleContentFocusOut, this);

			this.focusHandlersAttached = true; // To avoid attaching events twice
		}
	}

	enhanceAccessibilityState(_oElement: object, mAriaProps: object): object {
		const oParent = this.getParent();

		if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
			// forward  enhanceAccessibilityState call to the parent
			(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(_oElement, mAriaProps);
		}

		return mAriaProps;
	}

	getAccessibilityInfo(): Object {
		const oContent = this.content;
		return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
	}

	/**
	 * Returns the DOMNode ID to be used for the "labelFor" attribute.
	 *
	 * We forward the call of this method to the content control.
	 *
	 * @returns ID to be used for the <code>labelFor</code>
	 */
	getIdForLabel(): string {
		const oContent = this.content;
		return oContent.getIdForLabel();
	}

	/**
	 * Retrieves the current value of the field.
	 *
	 * @public
	 * @returns The current value of the field
	 */
	getValue(): boolean | string {
		let oControl = getControlInFieldWrapper(this.content);
		if (this.collaborationEnabled && oControl?.isA("sap.m.HBox")) {
			oControl = (oControl as HBox).getItems()[0];
		}
		if (oControl?.isA("sap.m.CheckBox")) {
			return (oControl as CheckBox).getSelected();
		} else if (oControl?.isA("sap.m.InputBase")) {
			return (oControl as InputBase).getValue();
		} else if (oControl?.isA("sap.ui.mdc.Field")) {
			return (oControl as any).getValue(); // FieldWrapper
		} else {
			throw "getting value not yet implemented for this field type";
		}
	}

	/**
	 * Adds a message to the field.
	 *
	 * @param [parameters] The parameters to create message
	 * @param parameters.type Type of the message
	 * @param parameters.message Message text
	 * @param parameters.description Message description
	 * @param parameters.persistent True if the message is persistent
	 * @returns The id of the message
	 * @public
	 */
	addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): string {
		const msgManager = this.getMessageManager();
		const oControl = getControlInFieldWrapper(this.content);

		let path; //target for oMessage
		if (oControl?.isA("sap.m.CheckBox")) {
			path = (oControl as CheckBox).getBinding("selected")?.getResolvedPath();
		} else if (oControl?.isA("sap.m.InputBase")) {
			path = (oControl as InputBase).getBinding("value")?.getResolvedPath();
		} else if (oControl?.isA("sap.ui.mdc.Field")) {
			path = (oControl as any).getBinding("value").getResolvedPath();
		}

		const oMessage = new Message({
			target: path,
			type: parameters.type,
			message: parameters.message,
			processor: oControl?.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});

		msgManager.addMessages(oMessage);
		return oMessage.getId();
	}

	/**
	 * Removes a message from the field.
	 *
	 * @param id The id of the message
	 * @public
	 */
	removeMessage(id: string) {
		const msgManager = this.getMessageManager();
		const arr = msgManager.getMessageModel().getData();
		const result = arr.find((e: any) => e.id === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}

	getMessageManager() {
		return Core.getMessageManager();
	}
}

export type FieldAPIType = typeof FieldAPI & {
	handleLiveChange: (event: UI5Event) => void;
};
export default FieldAPI;
