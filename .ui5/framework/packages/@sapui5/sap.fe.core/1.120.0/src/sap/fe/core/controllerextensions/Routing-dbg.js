/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ModelHelper", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, ModelHelper, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * A controller extension offering hooks into the routing flow of the application
   *
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  let Routing = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Routing"), _dec2 = publicExtension(), _dec3 = extensible(OverrideExecution.After), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = publicExtension(), _dec7 = extensible(OverrideExecution.After), _dec8 = publicExtension(), _dec9 = extensible(OverrideExecution.After), _dec10 = publicExtension(), _dec11 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(Routing, _ControllerExtension);
    function Routing() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = Routing.prototype;
    /**
     * This function can be used to intercept the routing event happening during the normal process of navigating from one page to another (like clicking on the table row to navigate, or when pagination buttons are clicked).
     *
     * The function is NOT called during other means of external outbound navigation (like a navigation configured via a link, or by using navigation buttons).
     *
     * If declared as an extension, it allows you to intercept and change the normal navigation flow.
     * If you decide to do your own navigation processing, you can return `true` to prevent the default routing behavior.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param mNavigationParameters Object containing row context and page context
     * @param mNavigationParameters.bindingContext The currently selected context
     * @returns `true` to prevent the default execution, false to keep the standard behavior
     * @public
     * @since 1.86.0
     */
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeNavigation = function onBeforeNavigation(mNavigationParameters) {
      // to be overriden by the application
      return false;
    }

    /**
     * Allows navigation to a specific context.
     *
     * @param oContext Object containing the context to be navigated to
     * @public
     * @since 1.90.0
     */;
    _proto.navigate = function navigate(oContext) {
      const internalModel = this.base.getModel("internal");
      // We have to delete the internal model value for "paginatorCurrentContext" to ensure it is re-evaluated by the navigateToContext function
      // BCP: 2270123820
      internalModel.setProperty("/paginatorCurrentContext", null);
      this.base._routing.navigateToContext(oContext);
    }

    /**
     * This function is used to intercept the routing event before binding a page.
     *
     * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
     *
     * This function is not called directly, but overridden separately by consuming controllers.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oContext Object containing the context for the navigation
     * @public
     * @since 1.90.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeBinding = function onBeforeBinding(oContext) {
      // to be overriden by the application
    }

    /**
     * This function is used to intercept the routing event after binding a page.
     *
     * If it is declared as an extension, it allows you to intercept and change the normal flow of binding.
     *
     * This function is not called directly, but overridden separately by consuming controllers.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oContext Object containing the context to be navigated
     * @public
     * @since 1.90.0
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterBinding = function onAfterBinding(oContext) {
      // to be overriden by the application
    }

    /**
     * Navigate to another target.
     *
     * @param sTargetRouteName Name of the target route
     * @param oParameters Parameters to be used with route to create the target hash
     * @param oParameters.bIsStickyMode PRIVATE
     * @returns Promise that is resolved when the navigation is finalized
     * @public
     */;
    _proto.navigateToRoute = async function navigateToRoute(sTargetRouteName, oParameters) {
      const oMetaModel = this.base.getModel().getMetaModel();
      const bIsStickyMode = ModelHelper.isStickySessionSupported(oMetaModel);
      if (!oParameters) {
        oParameters = {};
      }
      oParameters.bIsStickyMode = bIsStickyMode;
      return this.base._routing.navigateToRoute(sTargetRouteName, oParameters);
    };
    return Routing;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onBeforeNavigation", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigate", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "navigate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeBinding", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateToRoute", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateToRoute"), _class2.prototype)), _class2)) || _class);
  return Routing;
}, false);
