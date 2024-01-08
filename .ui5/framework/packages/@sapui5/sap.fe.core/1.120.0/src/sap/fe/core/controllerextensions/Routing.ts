import { defineUI5Class, extensible, finalExtension, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type PageController from "sap/fe/core/PageController";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";

/**
 * A controller extension offering hooks into the routing flow of the application
 *
 * @hideconstructor
 * @public
 * @since 1.86.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.Routing")
class Routing extends ControllerExtension {
	private base!: PageController;

	/**
	 * This function can be used to intercept the routing event happening during the normal process of navigating from one page to another (like clicking on the table row to navigate, or when pagination buttons are clicked).
	 *
	 * The function is NOT called during other means of external outbound navigation (like a navigation configured via a link, or by using navigation buttons).
	 *
	 * If declared as an extension, it allows you to intercept and change the normal navigation flow.
	 * If you decide to do your own navigation processing, you can return `true` to prevent the default routing behavior.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param mNavigationParameters Object containing row context and page context
	 * @param mNavigationParameters.bindingContext The currently selected context
	 * @returns `true` to prevent the default execution, false to keep the standard behavior
	 * @public
	 * @since 1.86.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onBeforeNavigation(mNavigationParameters: { bindingContext: Context }): boolean {
		// to be overriden by the application
		return false;
	}

	/**
	 * Allows navigation to a specific context.
	 *
	 * @param oContext Object containing the context to be navigated to
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	navigate(oContext: Context) {
		const internalModel = this.base.getModel("internal") as JSONModel;
		// We have to delete the internal model value for "paginatorCurrentContext" to ensure it is re-evaluated by the navigateToContext function
		// BCP: 2270123820
		internalModel.setProperty("/paginatorCurrentContext", null);
		this.base._routing.navigateToContext(oContext);
	}

	/**
	 * This function is used to intercept the routing event before binding a page.
	 *
	 * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
	 *
	 * This function is not called directly, but overridden separately by consuming controllers.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param oContext Object containing the context for the navigation
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onBeforeBinding(oContext: object) {
		// to be overriden by the application
	}

	/**
	 * This function is used to intercept the routing event after binding a page.
	 *
	 * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
	 *
	 * This function is not called directly, but overridden separately by consuming controllers.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param oContext Object containing the context to be navigated
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onAfterBinding(oContext: object) {
		// to be overriden by the application
	}

	/**
	 * Navigate to another target.
	 *
	 * @param sTargetRouteName Name of the target route
	 * @param oParameters Parameters to be used with route to create the target hash
	 * @param oParameters.bIsStickyMode PRIVATE
	 * @returns Promise that is resolved when the navigation is finalized
	 * @public
	 */
	@publicExtension()
	@finalExtension()
	async navigateToRoute(sTargetRouteName: string, oParameters?: { bIsStickyMode?: boolean }): Promise<boolean> {
		const oMetaModel = this.base.getModel().getMetaModel();
		const bIsStickyMode = ModelHelper.isStickySessionSupported(oMetaModel);
		if (!oParameters) {
			oParameters = {};
		}
		oParameters.bIsStickyMode = bIsStickyMode;
		return this.base._routing.navigateToRoute(sTargetRouteName, oParameters);
	}
}

export default Routing;
