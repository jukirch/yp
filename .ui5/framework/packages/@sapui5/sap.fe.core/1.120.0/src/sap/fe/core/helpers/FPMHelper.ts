import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type MdcTable from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

const FPMHelper = {
	actionWrapper: function (oEvent: any, sModule: any, sMethod: any, oParameters: any) {
		return new Promise(function (resolve: (value: any) => void) {
			//The source would be command execution, in case a command is defined for the action in the manifest.
			const oSource = oEvent.getSource ? oEvent.getSource() : oEvent.oSource,
				oView = CommonUtils.getTargetView(oSource),
				oBindingContext = oSource.getBindingContext();
			let oExtensionAPI: ExtensionAPI | undefined;
			let listBinding: ODataListBinding | undefined;
			let aSelectedContexts: Context[];

			if (oParameters !== undefined) {
				aSelectedContexts = oParameters.contexts || [];
			} else if (oBindingContext !== undefined) {
				aSelectedContexts = [oBindingContext];
			} else {
				aSelectedContexts = [];
			}
			if (oSource.getParent()?.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction") || oSource.getParent()?.isA("sap.m.Menu")) {
				listBinding = FPMHelper.getMdcTable(oSource)?.getRowBinding();
			}
			if (
				oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" ||
				oView.getControllerName() === "sap.fe.templates.ListReport.ListReportController"
			) {
				oExtensionAPI = (oView.getController() as PageController).getExtensionAPI();
			}

			if (sModule.startsWith("/extension/")) {
				const fnTarget = ObjectPath.get(sModule.replace(/\//g, ".").substr(1), oExtensionAPI);
				resolve(fnTarget[sMethod](oBindingContext, aSelectedContexts, listBinding));
			} else {
				sap.ui.require([sModule], function (module: any) {
					// - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
					// - we provide the context as API, maybe if needed further properties
					resolve(module[sMethod].bind(oExtensionAPI)(oBindingContext, aSelectedContexts, listBinding));
				});
			}
		});
	},
	getMdcTable: function (control: UI5Element): MdcTable | null | undefined {
		const parent = control.getParent();
		if (!parent || parent.isA<MdcTable>("sap.ui.mdc.Table")) {
			return parent;
		}
		return FPMHelper.getMdcTable(parent as Control);
	},
	validationWrapper: function (sModule: any, sMethod: any, oValidationContexts: any, oView: any, oBindingContext: any) {
		return new Promise(function (resolve: (value: any) => void) {
			let oExtensionAPI: ExtensionAPI;

			if (
				oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController" ||
				oView.getControllerName() === "sap.fe.templates.ListReport.ListReportController"
			) {
				oExtensionAPI = oView.getController().getExtensionAPI();
			}

			sap.ui.require([sModule], function (module: any) {
				// - we bind the action to the extensionAPI of the controller so it has the same scope as a custom section
				// - we provide the context as API, maybe if needed further properties
				resolve(module[sMethod].bind(oExtensionAPI)(oBindingContext, oValidationContexts));
			});
		});
	},
	/**
	 * Returns an external custom function defined either in a custom controller extension or in an external module.
	 *
	 * @param moduleName The external module name, or /extension/<path to the custom controller extension module>
	 * @param functionName The name of the function
	 * @param source A control in the view or an event triggered by a control in the view
	 * @returns The function (or undefined if it couldn't be found)
	 */
	getCustomFunction<FunctionType>(moduleName: string, functionName: string, source: Control | UI5Event): FunctionType | undefined {
		let control: Control;
		if (source.isA<UI5Event>("sap.ui.base.Event")) {
			control = source.getSource() as Control;
		} else {
			control = source;
		}
		const view = CommonUtils.getTargetView(control);
		const extensionAPI = view.getController().getExtensionAPI();

		let customFunction: FunctionType | undefined;

		if (moduleName.startsWith("/extension/")) {
			const controllerExt = ObjectPath.get(moduleName.replace(/\//g, ".").substring(1), extensionAPI);
			customFunction = controllerExt ? controllerExt[functionName] : undefined;
		} else {
			const module = sap.ui.require(moduleName);
			customFunction = module ? module[functionName]?.bind(extensionAPI) : undefined;
		}

		if (!customFunction) {
			Log.error(`Couldn't find method ${functionName} in ${moduleName}`);
		}
		return customFunction;
	}
};

export default FPMHelper;
