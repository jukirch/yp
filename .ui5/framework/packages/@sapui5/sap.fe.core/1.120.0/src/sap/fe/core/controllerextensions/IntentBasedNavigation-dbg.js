/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution"], function (ClassSupport, ControllerExtension, OverrideExecution) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2;
  var _exports = {};
  var publicExtension = ClassSupport.publicExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  let ContextStrategy;
  /**
   * Controller extension providing hooks for intent-based navigation
   *
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  (function (ContextStrategy) {
    ContextStrategy["Default"] = "default";
    ContextStrategy["Initiator"] = "initiator";
  })(ContextStrategy || (ContextStrategy = {}));
  _exports.ContextStrategy = ContextStrategy;
  let IntentBasedNavigation = (_dec = defineUI5Class("sap.fe.core.controllerextensions.IntentBasedNavigation"), _dec2 = publicExtension(), _dec3 = extensible(OverrideExecution.After), _dec4 = publicExtension(), _dec5 = extensible(OverrideExecution.After), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(IntentBasedNavigation, _ControllerExtension);
    function IntentBasedNavigation() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = IntentBasedNavigation.prototype;
    _proto.adaptContextPreparationStrategy = function adaptContextPreparationStrategy(_oNavigationInfo) {
      // to be overriden by the application
      return ContextStrategy.Default;
    }

    /**
     * Provides a hook to customize the {@link sap.fe.navigation.SelectionVariant} related to the intent-based navigation.
     *
     * @param _oSelectionVariant SelectionVariant provided by SAP Fiori elements.
     * @param _oNavigationInfo Object containing intent-based navigation-related info
     * @param _oNavigationInfo.semanticObject Semantic object related to the intent
     * @param _oNavigationInfo.action Action related to the intent
     * @public
     * @since 1.86.0
     */;
    _proto.adaptNavigationContext = function adaptNavigationContext(_oSelectionVariant, _oNavigationInfo) {
      // to be overriden by the application
    }

    /**
     * Navigates to an intent defined by an outbound definition in the manifest.
     *
     * @param sOutbound Identifier to locate the outbound definition in the manifest.
     * This provides the semantic object and action for the intent-based navigation.
     * Additionally, the outbound definition can be used to provide parameters for intent-based navigation.
     * See {@link topic:be0cf40f61184b358b5faedaec98b2da Descriptor for Applications, Components, and Libraries} for more information.
     * @param mNavigationParameters Optional map containing key/value pairs to be passed to the intent.
     * If mNavigationParameters are provided, the parameters provided in the outbound definition of the manifest are ignored.
     * @public
     * @since 1.86.0
     */;
    _proto.navigateOutbound = function navigateOutbound(sOutbound, mNavigationParameters) {
      var _this$base, _this$base2;
      const oInternalModelContext = (_this$base = this.base) === null || _this$base === void 0 ? void 0 : _this$base.getView().getBindingContext("internal");
      oInternalModelContext.setProperty("externalNavigationContext", {
        page: false
      });
      (_this$base2 = this.base) === null || _this$base2 === void 0 ? void 0 : _this$base2._intentBasedNavigation.navigateOutbound(sOutbound, mNavigationParameters);
    };
    return IntentBasedNavigation;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "adaptContextPreparationStrategy", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptContextPreparationStrategy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptNavigationContext", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptNavigationContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateOutbound", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateOutbound"), _class2.prototype)), _class2)) || _class);
  return IntentBasedNavigation;
}, false);
