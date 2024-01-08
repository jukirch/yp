import CommonUtils from "sap/fe/core/CommonUtils";
import { aggregation, defineUI5Class } from "sap/fe/core/helpers/ClassSupport";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import QuickViewPage from "sap/m/QuickViewPage";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type Link from "sap/ui/mdc/Link";

@defineUI5Class("sap.fe.macros.controls.CustomQuickViewPage")
class CustomQuickViewPage extends QuickViewPage {
	@aggregation({ type: "sap.m.QuickViewGroup", multiple: true, singularName: "group" })
	groups!: Control[];

	/**
	 * Called before the control is rendered in order to set the link of the title.
	 *
	 * @param event
	 */
	onBeforeRendering(event: jQuery.Event): void {
		this.setTitleLink();
		super.onBeforeRendering(event);
	}

	/**
	 * Find the mdc link control.
	 *
	 * @param mdcLinkControl
	 * @returns The mdc link control
	 */
	findMdcLinkControl(mdcLinkControl: ManagedObject | null): Link | null {
		while (mdcLinkControl && !mdcLinkControl.isA<Link>("sap.ui.mdc.Link")) {
			mdcLinkControl = mdcLinkControl.getParent();
		}
		return mdcLinkControl;
	}

	/**
	 * Set the url for the title of the quickview.
	 *
	 * @returns The title url of the quickview is set
	 */
	public setTitleLink(): void {
		const sQuickViewPageTitleLinkHref = this.data("titleLink");
		if (sQuickViewPageTitleLinkHref) {
			this.setCrossAppNavCallback(() => {
				// eslint-disable-line
				const oView = CommonUtils.getTargetView(this);
				const oAppComponent = CommonUtils.getAppComponent(oView);
				const oShellServiceHelper = oAppComponent.getShellServices();
				let oShellHash = oShellServiceHelper.parseShellHash(sQuickViewPageTitleLinkHref);
				const oNavArgs = {
					target: {
						semanticObject: oShellHash.semanticObject,
						action: oShellHash.action
					},
					params: oShellHash.params
				};
				const sQuickViewPageTitleLinkIntent = `${oNavArgs.target.semanticObject}-${oNavArgs.target.action}`;
				if (
					sQuickViewPageTitleLinkIntent &&
					typeof sQuickViewPageTitleLinkIntent === "string" &&
					sQuickViewPageTitleLinkIntent !== "" &&
					this.oCrossAppNavigator &&
					this.oCrossAppNavigator.isNavigationSupported([sQuickViewPageTitleLinkIntent])
				) {
					const mdcLinkControl = this.findMdcLinkControl(this.getParent());
					const sTargetHref: string = mdcLinkControl?.getModel("$sapuimdcLink")?.getProperty("/titleLinkHref");
					if (sTargetHref) {
						oShellHash = oShellServiceHelper.parseShellHash(sTargetHref);
					} else {
						oShellHash = oShellServiceHelper.parseShellHash(sQuickViewPageTitleLinkIntent);
						oShellHash.params = oNavArgs.params;
					}
					KeepAliveHelper.storeControlRefreshStrategyForHash(oView, oShellHash);
					return {
						target: {
							semanticObject: oShellHash.semanticObject,
							action: oShellHash.action
						},
						params: oShellHash.params
					};
				} else {
					const oCurrentShellHash = oShellServiceHelper.parseShellHash(window.location.hash);
					KeepAliveHelper.storeControlRefreshStrategyForHash(oView, oCurrentShellHash);
					return {
						target: {
							semanticObject: oCurrentShellHash.semanticObject,
							action: oCurrentShellHash.action,
							appSpecificRoute: oCurrentShellHash.appSpecificRoute
						},
						params: oCurrentShellHash.params
					};
				}
			});
		}
		return undefined;
	}
}

interface CustomQuickViewPage {
	// Private in UI5
	oCrossAppNavigator: any;
}

export default CustomQuickViewPage;
