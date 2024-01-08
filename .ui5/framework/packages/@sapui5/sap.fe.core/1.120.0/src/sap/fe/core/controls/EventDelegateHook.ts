import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { defineUI5Class, property } from "sap/fe/core/helpers/ClassSupport";
import type { $ElementSettings } from "sap/ui/core/Element";
import Element from "sap/ui/core/Element";

/**
 * Create an event delegate hook on the parent of this control to deal with event propagation.
 *
 * This is a specific solution for the Avatar control case where the press cannot be interrupted and which then ends up interacting with control behind it.
 *
 */
@defineUI5Class("sap.fe.core.controls.EventDelegateHook")
export default class EventDelegateHook extends Element {
	@property({ type: "boolean" })
	stopTapPropagation = false;

	constructor(idOrSettings?: EventDelegateSettings);

	constructor(idOrSettings: string, settings?: EventDelegateSettings);

	constructor(idOrSettings?: string | PropertiesOf<EventDelegateHook>, settings?: EventDelegateSettings) {
		super(idOrSettings as string, settings);
	}

	setParent(parentObject: Element): void {
		if (this.getParent()) {
			(this.getParent() as Element).removeEventDelegate(this);
		}
		parentObject.addEventDelegate(this);
		super.setParent(parentObject);
	}

	ontap(event: JQuery.Event): void {
		if (this.stopTapPropagation) {
			event.stopPropagation();
		}
	}
}

type EventDelegateSettings = $ElementSettings & PropertiesOf<EventDelegateHook>;
