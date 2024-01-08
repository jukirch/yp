/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/BaseController", "sap/fe/core/ExtensionAPI", "sap/fe/core/controllerextensions/EditFlow", "sap/fe/core/controllerextensions/IntentBasedNavigation", "sap/fe/core/controllerextensions/InternalIntentBasedNavigation", "sap/fe/core/controllerextensions/InternalRouting", "sap/fe/core/controllerextensions/MassEdit", "sap/fe/core/controllerextensions/MessageHandler", "sap/fe/core/controllerextensions/PageReady", "sap/fe/core/controllerextensions/Paginator", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/Recommendations", "sap/fe/core/controllerextensions/Routing", "sap/fe/core/controllerextensions/Share", "sap/fe/core/controllerextensions/SideEffects", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/Component", "sap/ui/core/mvc/OverrideExecution", "./controllerextensions/cards/CollaborationManager"], function (BaseController, ExtensionAPI, EditFlow, IntentBasedNavigation, InternalIntentBasedNavigation, InternalRouting, MassEdit, MessageHandler, PageReady, Paginator, Placeholder, Recommendations, Routing, Share, SideEffects, ViewState, ClassSupport, Component, OverrideExecution, CollaborationManager) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15;
  var usingExtension = ClassSupport.usingExtension;
  var publicExtension = ClassSupport.publicExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Base controller class for your custom page used inside an SAP Fiori elements application.
   *
   * This controller provides preconfigured extensions that will ensure you have the basic functionalities required to use the building blocks.
   *
   * @hideconstructor
   * @public
   * @since 1.88.0
   */
  let PageController = (_dec = defineUI5Class("sap.fe.core.PageController"), _dec2 = usingExtension(Routing), _dec3 = usingExtension(CollaborationManager), _dec4 = usingExtension(InternalRouting), _dec5 = usingExtension(EditFlow), _dec6 = usingExtension(IntentBasedNavigation), _dec7 = usingExtension(InternalIntentBasedNavigation), _dec8 = usingExtension(PageReady), _dec9 = usingExtension(MessageHandler), _dec10 = usingExtension(Share), _dec11 = usingExtension(Paginator), _dec12 = usingExtension(ViewState), _dec13 = usingExtension(Placeholder), _dec14 = usingExtension(SideEffects), _dec15 = usingExtension(MassEdit), _dec16 = usingExtension(Recommendations), _dec17 = publicExtension(), _dec18 = publicExtension(), _dec19 = publicExtension(), _dec20 = publicExtension(), _dec21 = extensible(OverrideExecution.After), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    _inheritsLoose(PageController, _BaseController);
    function PageController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "routing", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "collaborationManager", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_routing", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "editFlow", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_intentBasedNavigation", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "pageReady", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "messageHandler", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "share", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "paginator", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "viewState", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "placeholder", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_sideEffects", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "massEdit", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "recommendations", _descriptor15, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = PageController.prototype;
    _proto.onInit = function onInit() {
      const oUIModel = this.getAppComponent().getModel("ui"),
        oInternalModel = this.getAppComponent().getModel("internal"),
        sPath = `/pages/${this.getView().getId()}`;
      oUIModel.setProperty(sPath, {
        controls: {}
      });
      oInternalModel.setProperty(sPath, {
        controls: {},
        collaboration: {}
      });
      this.getView().bindElement({
        path: sPath,
        model: "ui"
      });
      this.getView().bindElement({
        path: sPath,
        model: "internal"
      });

      // for the time being provide it also pageInternal as some macros access it - to be removed
      this.getView().bindElement({
        path: sPath,
        model: "pageInternal"
      });
      this.getView().setModel(oInternalModel, "pageInternal");

      // as the model propagation happens after init but we actually want to access the binding context in the
      // init phase already setting the model here
      this.getView().setModel(oUIModel, "ui");
      this.getView().setModel(oInternalModel, "internal");
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      if (this.placeholder.attachHideCallback) {
        this.placeholder.attachHideCallback();
      }
    }

    /**
     * Get the extension API for the current page.
     *
     * @public
     * @returns The extension API.
     */;
    _proto.getExtensionAPI = function getExtensionAPI() {
      if (!this.extensionAPI) {
        this.extensionAPI = new ExtensionAPI(this);
      }
      return this.extensionAPI;
    }

    // We specify the extensibility here the same way as it is done in the object page controller
    // since the specification here overrides it and if we do not specify anything here, the
    // behavior defaults to an execute instead!
    // TODO This may not be ideal, since it also influences the list report controller but currently it's the best solution.
    ;
    _proto.onPageReady = function onPageReady(_mParameters) {
      // Apply app state only after the page is ready with the first section selected
      this.getAppComponent().getAppStateHandler().applyAppState();
    };
    _proto._getPageTitleInformation = function _getPageTitleInformation() {
      return {};
    };
    _proto._getPageModel = function _getPageModel() {
      const pageComponent = Component.getOwnerComponentFor(this.getView());
      return pageComponent === null || pageComponent === void 0 ? void 0 : pageComponent.getModel("_pageModel");
    };
    return PageController;
  }(BaseController), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "routing", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "collaborationManager", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_routing", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "editFlow", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "_intentBasedNavigation", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "pageReady", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "messageHandler", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "paginator", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "placeholder", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "_sideEffects", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "massEdit", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "recommendations", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeRendering", [_dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeRendering"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getExtensionAPI", [_dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "getExtensionAPI"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPageReady", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "onPageReady"), _class2.prototype)), _class2)) || _class);
  return PageController;
}, false);
