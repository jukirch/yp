/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/ui/core/Fragment", "sap/ui/core/util/XMLPreprocessor", "sap/ui/core/XMLTemplateProcessor", "sap/ui/mdc/enums/LinkType", "sap/ui/mdc/LinkDelegate", "sap/ui/model/json/JSONModel"], function (CommonUtils, Fragment, XMLPreprocessor, XMLTemplateProcessor, LinkType, LinkDelegate, JSONModel) {
  "use strict";

  return Object.assign({}, LinkDelegate, {
    /**
     * Method called to do the templating of the popover content.
     *
     * @param payload
     * @param metaModel
     * @param mdcLinkControl
     * @returns  A promise containing the popover content
     */
    _fnTemplateFragment: async function (payload, metaModel, mdcLinkControl) {
      const fragmentName = "sap.fe.macros.contact.ContactQuickView";
      const containingView = CommonUtils.getTargetView(mdcLinkControl);
      const appComponent = CommonUtils.getAppComponent(containingView);
      const preProcessorSettings = {
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
      const templatedFragment = await XMLPreprocessor.process(fragment, {
        name: fragmentName
      }, preProcessorSettings);
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
    fetchAdditionalContent: async function (mdcLinkControl) {
      var _payload$navigationPa;
      const payload = mdcLinkControl.getPayload();
      const navigateRegexpMatch = (_payload$navigationPa = payload.navigationPath) === null || _payload$navigationPa === void 0 ? void 0 : _payload$navigationPa.match(/{(.*?)}/);
      const bindingContext = navigateRegexpMatch && navigateRegexpMatch.length > 1 && navigateRegexpMatch[1] ? mdcLinkControl.getModel().bindContext(navigateRegexpMatch[1], mdcLinkControl.getBindingContext(), {
        $$ownRequest: true
      }) : null;
      if (mdcLinkControl.isA("sap.ui.mdc.Link")) {
        const metaModel = mdcLinkControl.getModel().getMetaModel();
        const popoverContent = await this._fnTemplateFragment(payload, metaModel, mdcLinkControl);
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
          type: LinkType.Popover,
          // this means mdcLink.open will open a popup which shows content retrieved by fetchAdditionalContent
          directLink: undefined
        },
        runtimeType: undefined
      };
    }
  });
}, false);
