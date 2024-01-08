/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/base/util/uid", "sap/fe/core/converters/ConverterContext", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/Component", "sap/ui/core/Control", "sap/ui/core/UIArea"], function (merge, uid, ConverterContext, ClassSupport, Component, Control, UIArea) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _class3;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const MacroAPIFQN = "sap.fe.macros.MacroAPI";

  /**
   * Base API control for building blocks.
   *
   * @hideconstructor
   * @name sap.fe.macros.MacroAPI
   * @public
   */
  let MacroAPI = (_dec = defineUI5Class("sap.fe.macros.MacroAPI"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec(_class = (_class2 = (_class3 = /*#__PURE__*/function (_Control) {
    _inheritsLoose(MacroAPI, _Control);
    function MacroAPI(mSettings) {
      var _this;
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      _this = _Control.call(this, mSettings, ...others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "content", _descriptor4, _assertThisInitialized(_this));
      _this.parentContextToBind = {};
      MacroAPI.registerInstance(_assertThisInitialized(_this));
      return _this;
    }
    var _proto = MacroAPI.prototype;
    _proto.init = function init() {
      _Control.prototype.init.call(this);
      if (!this.getModel("_pageModel")) {
        var _Component$getOwnerCo;
        const oPageModel = (_Component$getOwnerCo = Component.getOwnerComponentFor(this)) === null || _Component$getOwnerCo === void 0 ? void 0 : _Component$getOwnerCo.getModel("_pageModel");
        if (oPageModel) {
          this.setModel(oPageModel, "_pageModel");
        }
      }
    };
    MacroAPI.registerInstance = function registerInstance(_instance) {
      if (!this.instanceMap.get(_instance.constructor)) {
        this.instanceMap.set(_instance.constructor, []);
      }
      this.instanceMap.get(_instance.constructor).push(_instance);
    }

    /**
     * Defines the path of the context used in the current page or block.
     * This setting is defined by the framework.
     *
     * @public
     */;
    MacroAPI.render = function render(oRm, oControl) {
      oRm.renderControl(oControl.content);
    };
    _proto.rerender = function rerender() {
      UIArea.rerenderControl(this.content);
    };
    _proto.getDomRef = function getDomRef() {
      const oContent = this.content;
      return oContent ? oContent.getDomRef() : _Control.prototype.getDomRef.call(this);
    };
    _proto.getController = function getController() {
      return this.getModel("$view").getObject().getController();
    };
    MacroAPI.getAPI = function getAPI(oEvent) {
      let apiFQN = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : MacroAPIFQN;
      let oSource = oEvent.getSource();
      while (oSource && !oSource.isA(apiFQN) && oSource.getParent) {
        if (this.isDependentBound) {
          const oDependents = oSource.getDependents();
          const hasCorrectDependent = oDependents.find(oDependent => oDependent.isA(apiFQN));
          if (hasCorrectDependent) {
            oSource = hasCorrectDependent;
          } else {
            oSource = oSource.getParent();
          }
        } else {
          oSource = oSource.getParent();
        }
      }
      if (!oSource || !oSource.isA(apiFQN)) {
        const oSourceMap = this.instanceMap.get(this);
        oSource = oSourceMap === null || oSourceMap === void 0 ? void 0 : oSourceMap[oSourceMap.length - 1];
      }
      let targetControl;
      if (oSource && oSource.isA(apiFQN)) {
        targetControl = oSource;
      }
      return targetControl;
    }

    /**
     * Retrieve a Converter Context.
     *
     * @param oDataModelPath
     * @param contextPath
     * @param mSettings
     * @returns A Converter Context
     */;
    /**
     * Keep track of a binding context that should be assigned to the parent of that control.
     *
     * @param modelName The model name that the context will relate to
     * @param path The path of the binding context
     */
    _proto.setParentBindingContext = function setParentBindingContext(modelName, path) {
      this.parentContextToBind[modelName] = path;
    };
    _proto.setParent = function setParent() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _Control.prototype.setParent.call(this, ...args);
      Object.keys(this.parentContextToBind).forEach(modelName => {
        this.getParent().bindObject({
          path: this.parentContextToBind[modelName],
          model: modelName,
          events: {
            change: function () {
              const oBoundContext = this.getBoundContext();
              if (oBoundContext && !oBoundContext.getObject()) {
                oBoundContext.setProperty("", {});
              }
            }
          }
        });
      });
    };
    return MacroAPI;
  }(Control), _class3.namespace = "sap.fe.macros", _class3.macroName = "Macro", _class3.fragment = "sap.fe.macros.Macro", _class3.hasValidation = true, _class3.instanceMap = new WeakMap(), _class3.isDependentBound = false, _class3.getConverterContext = function (oDataModelPath, contextPath, mSettings) {
    const oAppComponent = mSettings.appComponent;
    const viewData = mSettings.models.viewData && mSettings.models.viewData.getData();
    return ConverterContext.createConverterContextForMacro(oDataModelPath.startingEntitySet.name, mSettings.models.metaModel, oAppComponent && oAppComponent.getDiagnostics(), merge, oDataModelPath.contextLocation, viewData);
  }, _class3.createBindingContext = function (oData, mSettings) {
    const sContextPath = `/uid--${uid()}`;
    mSettings.models.converterContext.setProperty(sContextPath, oData);
    return mSettings.models.converterContext.createBindingContext(sContextPath);
  }, _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return MacroAPI;
}, false);
