/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/model/resource/ResourceModel"], function (ClassSupport, UI5ResourceModel) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let ResourceModel = (_dec = defineUI5Class("sap.fe.core.ResourceModel"), _dec(_class = /*#__PURE__*/function (_UI5ResourceModel) {
    _inheritsLoose(ResourceModel, _UI5ResourceModel);
    function ResourceModel() {
      return _UI5ResourceModel.apply(this, arguments) || this;
    }
    var _proto = ResourceModel.prototype;
    /**
     * Returns text for a given resource key.
     *
     * @param textID ID of the Text
     * @param parameters Array of parameters that are used to create the text
     * @param metaPath Entity set name or action name to overload a text
     * @returns Determined text
     */
    _proto.getText = function getText(textID, parameters, metaPath) {
      let resourceKey = textID;
      const resourceBundle = this._oResourceBundle;
      if (metaPath) {
        const resourceKeyExists = this.checkIfResourceKeyExists(`${resourceKey}|${metaPath}`);

        // if resource key with metapath (i.e. entity set name) for instance specific text overriding is provided by the application
        // then use the same key otherwise use the Framework key
        resourceKey = resourceKeyExists ? `${resourceKey}|${metaPath}` : resourceKey;
      }
      return (resourceBundle === null || resourceBundle === void 0 ? void 0 : resourceBundle.getText(resourceKey, parameters, true)) || textID;
    }

    /**
     * Check if a text exists for a given resource key.
     *
     * @param textID ID of the Text
     * @returns True in case the text exists
     */;
    _proto.checkIfResourceKeyExists = function checkIfResourceKeyExists(textID) {
      // There are console errors logged when making calls to getText for keys that are not defined in the resource bundle
      // for instance keys which are supposed to be provided by the application, e.g, <key>|<entitySet> to override instance specific text
      // hence check if text exists (using "hasText") in the resource bundle before calling "getText"

      // "hasText" only checks for the key in the immediate resource bundle and not it's custom bundles
      // hence we need to do this recurrsively to check if the key exists in any of the bundles the forms the FE resource bundle
      return this._checkIfResourceKeyExists(textID, this._oResourceBundle.aCustomBundles);
    };
    _proto._checkIfResourceKeyExists = function _checkIfResourceKeyExists(textID, bundles) {
      if (bundles !== null && bundles !== void 0 && bundles.length) {
        for (let i = bundles.length - 1; i >= 0; i--) {
          const sValue = bundles[i].hasText(textID);
          // text found return true
          if (sValue) {
            return true;
          }
          this._checkIfResourceKeyExists(textID, bundles[i].aCustomBundles);
        }
      }
      return false;
    };
    return ResourceModel;
  }(UI5ResourceModel)) || _class);
  return ResourceModel;
}, false);
