/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/mvc/Controller"], function (CommonUtils, ClassSupport, Controller) {
  "use strict";

  var _dec, _dec2, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * Internal base controller class for SAP Fiori elements application.
   *
   * If you want to extend a base controller for your custom page, please use for sap.fe.core.PageController.
   *
   * @hideconstructor
   * @public
   * @since 1.90.0
   */
  let BaseController = (_dec = defineUI5Class("sap.fe.core.BaseController"), _dec2 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_Controller) {
    _inheritsLoose(BaseController, _Controller);
    function BaseController() {
      return _Controller.apply(this, arguments) || this;
    }
    var _proto = BaseController.prototype;
    /**
     * Returns the current app component.
     *
     * @returns The app component or, if not found, null
     * @public
     * @since 1.91.0
     */
    _proto.getAppComponent = function getAppComponent() {
      if (!this._oAppComponent) {
        this._oAppComponent = CommonUtils.getAppComponent(this.getView());
      }
      return this._oAppComponent;
    }

    /**
     * Convenience method provided by SAP Fiori elements to enable applications to include the view model by name into each controller.
     *
     * @public
     * @param sName The model name
     * @returns The model instance
     */;
    _proto.getModel = function getModel(sName) {
      return this.getView().getModel(sName);
    }

    /**
     * Convenience method for setting the view model in every controller of the application.
     *
     * @public
     * @param oModel The model instance
     * @param sName The model name
     * @returns The view instance
     */;
    _proto.setModel = function setModel(oModel, sName) {
      return this.getView().setModel(oModel, sName);
    };
    _proto.getResourceBundle = function getResourceBundle(sI18nModelName) {
      if (!sI18nModelName) {
        sI18nModelName = "i18n";
      }
      return this.getAppComponent().getModel(sI18nModelName).getResourceBundle();
    };
    return BaseController;
  }(Controller), (_applyDecoratedDescriptor(_class2.prototype, "getAppComponent", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "getAppComponent"), _class2.prototype)), _class2)) || _class);
  return BaseController;
}, false);
