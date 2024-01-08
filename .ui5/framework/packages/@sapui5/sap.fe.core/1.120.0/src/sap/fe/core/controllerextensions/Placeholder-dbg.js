/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/ObjectPath", "sap/base/util/UriParameters", "sap/fe/core/helpers/ClassSupport", "sap/fe/placeholder/library", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/Placeholder"], function (ObjectPath, UriParameters, ClassSupport, _library, ControllerExtension, Placeholder) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * {@link sap.ui.core.mvc.ControllerExtension Controller extension} for Placeholder
   *
   */
  let PlaceholderControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Placeholder"), _dec2 = publicExtension(), _dec3 = publicExtension(), _dec4 = publicExtension(), _dec5 = publicExtension(), _dec6 = publicExtension(), _dec7 = publicExtension(), _dec8 = publicExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(PlaceholderControllerExtension, _ControllerExtension);
    function PlaceholderControllerExtension() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = PlaceholderControllerExtension.prototype;
    _proto.attachHideCallback = function attachHideCallback() {
      if (this.isPlaceholderEnabled()) {
        const oView = this.base.getView();
        const oPage = oView.getParent() && oView.getParent().oContainer;
        const oNavContainer = oPage && oPage.getParent();
        if (!oNavContainer) {
          return;
        }
        const _fnContainerDelegate = {
          onAfterShow: function (oEvent) {
            if (oEvent.isBackToPage) {
              oNavContainer.hidePlaceholder();
            } else if (UriParameters.fromQuery(window.location.hash.replace(/#.*\?/, "")).get("restoreHistory") === "true") {
              // in case we navigate to the listreport using the shell
              oNavContainer.hidePlaceholder();
            }
          }
        };
        oPage.addEventDelegate(_fnContainerDelegate);
        const oPageReady = oView.getController().pageReady;
        //In case of objectPage, the placeholder should be hidden when heroes requests are received
        // But for some scenario like "Create item", heroes requests are not sent .
        // The pageReady event is then used as fallback

        const aAttachEvents = ["pageReady"];
        if (oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController") {
          aAttachEvents.push("heroesBatchReceived");
        }
        aAttachEvents.forEach(function (sEvent) {
          oPageReady.attachEvent(sEvent, null, function () {
            oNavContainer.hidePlaceholder();
          }, null);
        });
      }
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this._init();
    };
    _proto._init = function _init() {
      this.oAppComponent = this.base.getAppComponent();
      this.oRootContainer = this.oAppComponent.getRootContainer();
      this.oPlaceholders = {};

      // eslint-disable-next-line no-constant-condition
      if (this.isPlaceholderEnabled()) {
        Placeholder.registerProvider(function (oConfig) {
          switch (oConfig.name) {
            case "sap.fe.templates.ListReport":
              return {
                html: "sap/fe/placeholder/view/PlaceholderLR.fragment.html",
                autoClose: false
              };
            case "sap.fe.templates.ObjectPage":
              return {
                html: "sap/fe/placeholder/view/PlaceholderOP.fragment.html",
                autoClose: false
              };
            default:
          }
        });
      }
      if (this.isPlaceholderDebugEnabled()) {
        this.initPlaceholderDebug();
      }
    };
    _proto.initPlaceholderDebug = function initPlaceholderDebug() {
      this.resetPlaceholderDebugStats();
      const handler = {
        apply: target => {
          if (this.oRootContainer._placeholder && this.oRootContainer._placeholder.placeholder) {
            this.debugStats.iHidePlaceholderTimestamp = Date.now();
          }
          return target.bind(this.oRootContainer)();
        }
      };
      // eslint-disable-next-line no-undef
      const proxy1 = new Proxy(this.oRootContainer.hidePlaceholder, handler);
      this.oRootContainer.hidePlaceholder = proxy1;
    };
    _proto.isPlaceholderDebugEnabled = function isPlaceholderDebugEnabled() {
      if (UriParameters.fromQuery(window.location.search).get("sap-ui-xx-placeholder-debug") === "true") {
        return true;
      }
      return false;
    };
    _proto.resetPlaceholderDebugStats = function resetPlaceholderDebugStats() {
      this.debugStats = {
        iHidePlaceholderTimestamp: 0,
        iPageReadyEventTimestamp: 0,
        iHeroesBatchReceivedEventTimestamp: 0
      };
    };
    _proto.getPlaceholderDebugStats = function getPlaceholderDebugStats() {
      return this.debugStats;
    };
    _proto.isPlaceholderEnabled = function isPlaceholderEnabled() {
      const bPlaceholderEnabledInFLP = ObjectPath.get("sap-ushell-config.apps.placeholder.enabled");
      if (bPlaceholderEnabledInFLP === false) {
        return false;
      }
      return Placeholder.isEnabled();
    };
    return PlaceholderControllerExtension;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "attachHideCallback", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "attachHideCallback"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "attachRouteMatchers", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "attachRouteMatchers"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "initPlaceholderDebug", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "initPlaceholderDebug"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isPlaceholderDebugEnabled", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "isPlaceholderDebugEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "resetPlaceholderDebugStats", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "resetPlaceholderDebugStats"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getPlaceholderDebugStats", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "getPlaceholderDebugStats"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isPlaceholderEnabled", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "isPlaceholderEnabled"), _class2.prototype)), _class2)) || _class);
  return PlaceholderControllerExtension;
}, false);
