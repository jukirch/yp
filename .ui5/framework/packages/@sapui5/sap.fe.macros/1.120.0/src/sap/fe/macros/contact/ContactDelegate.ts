import CommonUtils from "sap/fe/core/CommonUtils";
import Fragment from "sap/ui/core/Fragment";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";

import type AppComponent from "sap/fe/core/AppComponent";
import type Control from "sap/ui/core/Control";
import LinkType from "sap/ui/mdc/enums/LinkType";
import type Link from "sap/ui/mdc/Link";
import LinkDelegate from "sap/ui/mdc/LinkDelegate";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

type ContactPayload = { navigationPath: string; contact: string };

export default Object.assign({}, LinkDelegate, {
	/**
	 * Method called to do the templating of the popover content.
	 *
	 * @param payload
	 * @param metaModel
	 * @param mdcLinkControl
	 * @returns  A promise containing the popover content
	 */
	_fnTemplateFragment: async function (payload: ContactPayload, metaModel: ODataMetaModel, mdcLinkControl: Link) {
		const fragmentName = "sap.fe.macros.contact.ContactQuickView";
		const containingView = CommonUtils.getTargetView(mdcLinkControl);
		const appComponent = CommonUtils.getAppComponent(containingView);

		const preProcessorSettings: { bindingContexts: object; models: object; appComponent: AppComponent } = {
			bindingContexts: {},
			models: {},
			appComponent
		};
		const contactContext = metaModel.createBindingContext(payload.contact);
		const payloadModel = new JSONModel(payload);

		if (payload.contact && contactContext) {
			preProcessorSettings.bindingContexts = {
				contact: contactContext,
				payload: payloadModel.createBindingContext("/")
			};
			preProcessorSettings.models = {
				contact: metaModel,
				payload: payloadModel
			};
		}

		const fragment = XMLTemplateProcessor.loadTemplate(fragmentName, "fragment");
		const templatedFragment = await XMLPreprocessor.process(fragment, { name: fragmentName }, preProcessorSettings);
		return Fragment.load({
			definition: templatedFragment,
			controller: containingView.getController()
		});
	},

	/**
	 * Method calls by the mdc.field to determine what should be the content of the popup when mdcLink#open is called.
	 *
	 * @param mdcLinkControl
	 * @returns A promise containing the popover content
	 */
	fetchAdditionalContent: async function (mdcLinkControl: Link) {
		const payload: ContactPayload = mdcLinkControl.getPayload() as ContactPayload;
		const navigateRegexpMatch = payload.navigationPath?.match(/{(.*?)}/);
		const bindingContext =
			navigateRegexpMatch && navigateRegexpMatch.length > 1 && navigateRegexpMatch[1]
				? (mdcLinkControl.getModel() as ODataModel).bindContext(
						navigateRegexpMatch[1],
						mdcLinkControl.getBindingContext() as Context,
						{ $$ownRequest: true }
				  )
				: null;
		if (mdcLinkControl.isA("sap.ui.mdc.Link")) {
			const metaModel = (mdcLinkControl.getModel() as ODataModel).getMetaModel();
			const popoverContent = (await this._fnTemplateFragment(payload, metaModel, mdcLinkControl)) as Control;
			if (bindingContext) {
				popoverContent.setBindingContext(bindingContext.getBoundContext());
			}
			return [popoverContent];
		}
		return Promise.resolve([]);
	},

	fetchLinkType: async function () {
		return {
			initialType: {
				type: LinkType.Popover, // this means mdcLink.open will open a popup which shows content retrieved by fetchAdditionalContent
				directLink: undefined
			},
			runtimeType: undefined
		};
	}
});
