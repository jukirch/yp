import { defineUI5Class } from "sap/fe/core/helpers/ClassSupport";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
/**
 * A base implementation for controller extension used internally in sap.fe for central functionalities.
 *
 * @public
 * @since 1.118.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.BaseControllerExtension")
export default class BaseControllerExtension extends ControllerExtension {
	constructor() {
		super();
		(this as unknown as { init: Function }).init();
	}
}
