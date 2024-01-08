/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/ui/mdc/field/MultiValueFieldDelegate"], function (CommonUtils, MdcMultiValueFieldDelegate) {
  "use strict";

  const MultiValueFieldDelegate = Object.assign({}, MdcMultiValueFieldDelegate);
  MultiValueFieldDelegate.updateItems = function (oPayload, aConditions, oControl) {
    const oListBinding = oControl.getBinding("items");
    if (oListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
      const oBindingInfo = oControl.getBindingInfo("items");
      // check if conditions are added, removed or changed
      const oTemplate = oBindingInfo.template;
      const oKeyBindingInfo = oTemplate.getBindingInfo("key");
      const oDescriptionBindingInfo = oTemplate.getBindingInfo("description");
      const sKeyPath = oKeyBindingInfo && oKeyBindingInfo.parts[0].path;
      const sDescriptionPath = oDescriptionBindingInfo && oDescriptionBindingInfo.parts && oDescriptionBindingInfo.parts[0] && oDescriptionBindingInfo.parts[0].path;
      const aContexts = oListBinding.getCurrentContexts();
      const aDataToAdd = [];
      const oController = CommonUtils.getTargetView(oControl).getController();

      // Contexts to delete
      const aNewKeys = aConditions.map(function (oCondition) {
        return oCondition.values[0];
      });
      const aOldKeys = aContexts.map(function (oContext) {
        return oContext.getProperty(sKeyPath);
      });
      const aModificationPromises = [];
      for (let i = 0; i < aContexts.length; i++) {
        const oDeleteContext = aContexts[i];
        if (!aNewKeys.includes(oDeleteContext.getProperty(sKeyPath))) {
          aModificationPromises.push(oController.editFlow.deleteMultipleDocuments([oDeleteContext], {
            controlId: oControl.getId(),
            noDialog: true
          }));
        }
      }
      // data to add
      aConditions.forEach(oCondition => {
        if (!aOldKeys.includes(oCondition.values[0])) {
          const oItem = {};
          if (sKeyPath && sKeyPath.indexOf("/") === -1) {
            // we do not manage to create on a sub entity of the 1:n navigation
            oItem[sKeyPath] = oCondition.values[0];
            if (sDescriptionPath && sDescriptionPath.indexOf("/") === -1 && sDescriptionPath !== sKeyPath) {
              oItem[sDescriptionPath] = oCondition.values[1];
            }
            aDataToAdd.push(oItem);
          }
        }
      });
      if (aDataToAdd.length) {
        aModificationPromises.push(oController.editFlow.createMultipleDocuments(oListBinding, aDataToAdd, true, false));
      }
      return Promise.all(aModificationPromises);
    }
  };
  return MultiValueFieldDelegate;
}, false);
