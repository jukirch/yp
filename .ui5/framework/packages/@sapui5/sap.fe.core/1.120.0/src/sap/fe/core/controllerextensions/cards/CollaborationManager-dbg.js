/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/HookSupport", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/mvc/ControllerExtension"], function (CommonUtils, HookSupport, ClassSupport, ControllerExtension) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2;
  var _exports = {};
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var hookable = HookSupport.hookable;
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  let CollaborationManagerExtension = (
  /**
   * An implementation for controller extension used internally in sap.fe for central functionalities to serve collaboration manager use cases.
   *
   * @since 1.120.0
   */
  _dec = defineUI5Class("sap.fe.core.controllerextensions.cards.CollaborationManager"), _dec2 = methodOverride(), _dec3 = methodOverride(), _dec4 = publicExtension(), _dec5 = hookable("before"), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(CollaborationManagerExtension, _ControllerExtension);
    function CollaborationManagerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _assertThisInitialized(_this).init();
      return _this;
    }
    _exports = CollaborationManagerExtension;
    var _proto = CollaborationManagerExtension.prototype;
    _proto.onInit = async function onInit() {
      this.feView = this.base.getView();
      this.appComponent = CommonUtils.getAppComponent(this.feView);
      const environmentCapabilities = await this.appComponent.getService("environmentCapabilities");

      // Only connect to the Collaboration Manager if it is explicitly enabled and the sap.insights library is loaded
      if (!this.appComponent["isCollaborationManagerServiceEnabled"]() || !environmentCapabilities.getCapabilities().InsightsSupported) {
        return;
      }
      await this.getService().connect(this.appComponent.getId(), async () => {
        const cardsPromises = this.collectAvailableCards([]);
        const cards = await Promise.all(cardsPromises);
        const cardObject = cards.reduce((acc, cur) => {
          acc[cur.card["sap.app"].id] = cur;
          return acc;
        }, {});
        const parentAppId = this.appComponent.getId();
        this.getService().addCardsToCollaborationManager(cardObject, parentAppId);
      });
    }

    /**
     * Automatic unregistering on exit of the application.
     *
     */;
    _proto.onExit = function onExit() {
      this.getService().unregisterProvider();
    };
    _proto.getService = function getService() {
      return this.appComponent.getCollaborationManagerService();
    };
    _proto.collectAvailableCards = function collectAvailableCards(cards) {
      return cards;
    };
    return CollaborationManagerExtension;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectAvailableCards", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "collectAvailableCards"), _class2.prototype)), _class2)) || _class);
  _exports = CollaborationManagerExtension;
  return _exports;
}, false);
