import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import "sap/fe/core/library";
import type PageController from "sap/fe/core/PageController";
import "sap/fe/macros/filter/type/MultiValue";
import "sap/fe/macros/filter/type/Range";
import "sap/fe/macros/macroLibrary";
import type Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import CustomData from "sap/ui/core/CustomData";
import Fragment from "sap/ui/core/Fragment";
import "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import "sap/ui/core/XMLTemplateProcessor";
import "sap/ui/mdc/field/ConditionsType";
import "sap/ui/mdc/library";
import "sap/ui/unified/library";

/**
 * Library containing the building blocks for SAP Fiori elements.
 *
 * @namespace
 * @name sap.fe.macros
 * @public
 */
export const macrosNamespace = "sap.fe.macros";

// library dependencies
const thisLib = Core.initLibrary({
	name: "sap.fe.macros",
	dependencies: ["sap.ui.core", "sap.ui.mdc", "sap.ui.unified", "sap.fe.core", "sap.fe.navigation", "sap.m"],
	types: ["sap.fe.macros.NavigationType"],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true
}) as any;

thisLib.NavigationType = {
	/**
	 * For External Navigation
	 *
	 * @public
	 */
	External: "External",

	/**
	 * For In-Page Navigation
	 *
	 * @public
	 */
	InPage: "InPage",

	/**
	 * For No Navigation
	 *
	 * @public
	 */
	None: "None"
};

Fragment.registerType("CUSTOM", {
	load: (Fragment as any).getType("XML").load,
	init: async function (
		mSettings: { containingView: View; id: string; childCustomData: Record<string, string> | undefined },
		...args: unknown[]
	) {
		const currentController = mSettings.containingView.getController() as PageController;
		let targetControllerExtension: PageController | ExtensionAPI = currentController;
		if (currentController && !currentController.isA<ExtensionAPI>("sap.fe.core.ExtensionAPI")) {
			targetControllerExtension = currentController.getExtensionAPI();
		}
		mSettings.containingView = {
			oController: targetControllerExtension
		} as unknown as View;
		const childCustomData = mSettings.childCustomData ?? undefined;
		delete mSettings.childCustomData;
		const result = await (Fragment as unknown as { getType: Function }).getType("XML").init.apply(this, [mSettings, args]);
		if (childCustomData && result?.isA("sap.ui.core.Control")) {
			for (const customDataKey in childCustomData) {
				(result as Control).addCustomData(new CustomData({ key: customDataKey, value: childCustomData[customDataKey] }));
			}
		}
		return result;
	}
});

export default thisLib;
