/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/UIComponent", "sap/ui/mdc/p13n/StateUtil"], function (CommonUtils, ClassSupport, UIComponent, StateUtil) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let TemplateComponent = (_dec = defineUI5Class("sap.fe.core.TemplateComponent"), _dec2 = implementInterface("sap.ui.core.IAsyncContentCreation"), _dec3 = property({
    type: "string",
    defaultValue: null
  }), _dec4 = property({
    type: "string",
    defaultValue: null
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "object"
  }), _dec7 = property({
    type: "string[]"
  }), _dec8 = property({
    type: "object"
  }), _dec9 = property({
    type: "object"
  }), _dec10 = property({
    type: "boolean"
  }), _dec11 = property({
    type: "object"
  }), _dec12 = property({
    type: "string"
  }), _dec13 = event(), _dec14 = event(), _dec15 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_UIComponent) {
    _inheritsLoose(TemplateComponent, _UIComponent);
    function TemplateComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UIComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IAsyncContentCreation", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entitySet", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "bindingContextPattern", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigation", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enhanceI18n", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "controlConfiguration", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "content", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "allowDeepLinking", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "refreshStrategyOnAppRestore", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "viewType", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "containerDefined", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "heroesBatchReceived", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "workersBatchReceived", _descriptor14, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = TemplateComponent.prototype;
    _proto.setContainer = function setContainer(oContainer) {
      _UIComponent.prototype.setContainer.call(this, oContainer);
      this.fireEvent("containerDefined", {
        container: oContainer
      });
      return this;
    };
    _proto.init = function init() {
      this.oAppComponent = CommonUtils.getAppComponent(this);
      _UIComponent.prototype.init.call(this);
      const oStateChangeHandler = function (oEvent) {
        const oControl = oEvent.getParameter("control");
        if (oControl.isA("sap.ui.mdc.Table") || oControl.isA("sap.ui.mdc.FilterBar") || oControl.isA("sap.ui.mdc.Chart")) {
          const oMacroAPI = oControl.getParent();
          if (oMacroAPI !== null && oMacroAPI !== void 0 && oMacroAPI.fireStateChange) {
            oMacroAPI.fireStateChange();
          }
        }
      };
      StateUtil.detachStateChange(oStateChangeHandler);
      StateUtil.attachStateChange(oStateChangeHandler);
    }

    // This method is called by UI5 core to access to the component containing the customizing configuration.
    // as controller extensions are defined in the manifest for the app component and not for the
    // template component we return the app component.
    ;
    _proto.getExtensionComponent = function getExtensionComponent() {
      return this.oAppComponent;
    };
    _proto.getRootController = function getRootController() {
      const rootControl = this.getRootControl();
      let rootController;
      if (rootControl && rootControl.getController) {
        rootController = rootControl.getController();
      }
      return rootController;
    };
    _proto.onPageReady = function onPageReady(mParameters) {
      const rootController = this.getRootController();
      if (rootController && rootController.onPageReady) {
        rootController.onPageReady(mParameters);
      }
    };
    _proto.getNavigationConfiguration = function getNavigationConfiguration(sTargetPath) {
      const mNavigation = this.navigation;
      return mNavigation[sTargetPath];
    };
    _proto.getViewData = function getViewData() {
      const mProperties = this.getMetadata().getAllProperties();
      const oViewData = Object.keys(mProperties).reduce((mViewData, sPropertyName) => {
        mViewData[sPropertyName] = mProperties[sPropertyName].get(this);
        return mViewData;
      }, {});

      // Access the internal _isFclEnabled which will be there
      oViewData.fclEnabled = this.oAppComponent._isFclEnabled();
      return oViewData;
    };
    _proto._getPageTitleInformation = function _getPageTitleInformation() {
      const rootControl = this.getRootControl();
      if (rootControl && rootControl.getController() && rootControl.getController()._getPageTitleInformation) {
        return rootControl.getController()._getPageTitleInformation();
      } else {
        return {};
      }
    };
    _proto.getExtensionAPI = function getExtensionAPI() {
      return this.getRootControl().getController().getExtensionAPI();
    };
    return TemplateComponent;
  }(UIComponent), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IAsyncContentCreation", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return null;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return null;
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "bindingContextPattern", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "navigation", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "enhanceI18n", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "controlConfiguration", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "allowDeepLinking", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "refreshStrategyOnAppRestore", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "viewType", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "XML";
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "containerDefined", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "heroesBatchReceived", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "workersBatchReceived", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return TemplateComponent;
}, false);
