import type PageController from "sap/fe/core/PageController";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type { MultiValueField$ChangeEvent } from "sap/ui/mdc/MultiValueField";
import type Context from "sap/ui/model/odata/v4/Context";
import FieldRuntime from "../field/FieldRuntime";

const multiValueFieldRuntime = {
	/**
	 * Handler for the change event.
	 *
	 * Used to request SideEffects based on the validity of change.
	 *
	 * @param controller The controller of the page containing the field
	 * @param event The event object passed by the change event
	 */
	handleChange: function (controller: PageController, event: MultiValueField$ChangeEvent): void {
		const sourcefield = event.getSource() as Control,
			isTransient = (sourcefield.getBindingContext() as Context).isTransient(),
			isValueResolved = (event.getParameter("promise") as Promise<string> | undefined) || Promise.resolve();

		// Use the FE Controller instead of the extensionAPI to access internal FE controllers
		const feController = FieldRuntime._getExtensionController(controller) as PageController;

		feController.editFlow.syncTask(isValueResolved) as Promise<undefined>;

		// if the context is transient, it means the request would fail anyway as the record does not exist in reality
		if (isTransient) {
			return;
		}

		// register the change coming in this multi value field as successful (for group SideEffects)
		// immediate SideEffects will be handled by create/delete handlers
		feController._sideEffects.prepareSideEffectsForField(event, true, isValueResolved);
	},

	/**
	 * Handler for the validateFieldGroup event.
	 *
	 * @param controller The controller of the page containing the field
	 * @param event The event object passed by the validateFieldGroup event
	 */
	onValidateFieldGroup: async function (controller: PageController, event: Event) {
		const feController = FieldRuntime._getExtensionController(controller) as PageController;
		await feController._sideEffects.handleFieldGroupChange(event);
	}
};

export default multiValueFieldRuntime;