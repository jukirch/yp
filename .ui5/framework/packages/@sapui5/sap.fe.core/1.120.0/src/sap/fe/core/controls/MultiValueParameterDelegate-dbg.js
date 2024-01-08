/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/mdc/field/MultiValueFieldDelegate"], function (MultiValueFieldDelegate) {
  "use strict";

  const oMultiValueFieldDelegate = Object.assign({}, MultiValueFieldDelegate, {
    _transformConditions: function (aConditions, sKeyPath, sDescriptionPath) {
      const aTransformedItems = [];
      for (let i = 0; i < aConditions.length; i++) {
        const oItem = {};
        const oCondition = aConditions[i];
        oItem[sKeyPath] = oCondition.values[0];
        if (sDescriptionPath) {
          oItem[sDescriptionPath] = oCondition.values[1];
        }
        aTransformedItems.push(oItem);
      }
      return aTransformedItems;
    },
    updateItems: function (oPayload, aConditions, oMultiValueField) {
      const oListBinding = oMultiValueField.getBinding("items");
      const oBindingInfo = oMultiValueField.getBindingInfo("items");
      const sItemPath = oBindingInfo.path;
      const oTemplate = oBindingInfo.template;
      const oKeyBindingInfo = oTemplate.getBindingInfo("key");
      const sKeyPath = oKeyBindingInfo && oKeyBindingInfo.parts[0].path;
      const oDescriptionBindingInfo = oTemplate.getBindingInfo("description");
      const sDescriptionPath = oDescriptionBindingInfo && oDescriptionBindingInfo.parts[0].path;
      const oModel = oListBinding.getModel();
      oModel.setProperty(sItemPath, this._transformConditions(aConditions, sKeyPath, sDescriptionPath));
    }
  });
  return oMultiValueFieldDelegate;
}, false);