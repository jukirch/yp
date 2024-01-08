import { defineUI5Class, property } from "sap/fe/core/helpers/ClassSupport";
import Page from "sap/m/Page";
import ManagedObject from "sap/ui/base/ManagedObject";

import type Control from "sap/ui/core/Control";

import type Controller from "sap/ui/core/mvc/Controller";
import View from "sap/ui/core/mvc/View";
import type { ManagedObjectEx } from "../../../../../../../types/extension_types";

@defineUI5Class("sap.fe.core.jsx-runtime.MDXViewLoader")
export default class ViewLoader extends View {
	static preprocessorData: any;

	static controller: Controller;

	@property({ type: "string" })
	viewName!: string;

	async loadDependency(name: string): Promise<unknown> {
		return new Promise((resolve) => {
			sap.ui.require([name], async (MDXContent: Function) => {
				resolve(MDXContent);
			});
		});
	}

	getControllerName(): string {
		const viewData = this.getViewData() as any;
		return viewData.controllerName;
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async createContent(oController: any): Promise<Control> {
		const viewData = this.getViewData() as any;
		const MDXContent = viewData.viewContent || (await this.loadDependency(viewData._mdxViewName));
		ViewLoader.preprocessorData = (this as any).mPreprocessors.xml;
		ViewLoader.controller = oController;
		const mdxContent = (ManagedObject as ManagedObjectEx).runWithPreprocessors(
			() => {
				return MDXContent();
			},
			{
				id: (sId: string) => {
					return this.createId(sId);
				},
				settings: function () {
					this.controller = oController;
				}
			}
		);
		return <Page class={"sapUiContentPadding"}>{{ content: mdxContent }}</Page>;
	}
}
