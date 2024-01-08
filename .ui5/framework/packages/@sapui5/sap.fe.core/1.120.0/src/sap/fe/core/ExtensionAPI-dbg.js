/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/ui/base/Object", "sap/ui/core/Component", "sap/ui/model/json/JSONModel", "./helpers/ClassSupport"], function (Log, CommonUtils, BaseObject, Component, JSONModel, ClassSupport) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Common Extension API for all pages of SAP Fiori elements for OData V4.
   *
   * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
   *
   * @public
   * @hideconstructor
   * @since 1.79.0
   */
  let ExtensionAPI = (_dec = defineUI5Class("sap.fe.core.ExtensionAPI"), _dec2 = property({
    type: "sap.fe.core.controllerextensions.EditFlow"
  }), _dec3 = property({
    type: "sap.fe.core.controllerextensions.Routing"
  }), _dec4 = property({
    type: "sap.fe.core.controllerextensions.IntentBasedNavigation"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseObject) {
    _inheritsLoose(ExtensionAPI, _BaseObject);
    /**
     * A controller extension offering hooks into the edit flow of the application.
     *
     * @public
     */

    /**
     * A controller extension offering hooks into the routing flow of the application.
     *
     * @public
     */

    /**
     * ExtensionAPI for intent-based navigation
     *
     * @public
     */

    function ExtensionAPI(oController, sId) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _initializerDefineProperty(_this, "editFlow", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "routing", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor3, _assertThisInitialized(_this));
      _this._controller = oController;
      _this._view = oController.getView();
      _this.extension = _this._controller.extension;
      _this.editFlow = _this._controller.editFlow;
      _this.routing = _this._controller.routing;
      _this._routing = _this._controller._routing;
      _this.intentBasedNavigation = _this._controller.intentBasedNavigation;
      _this._prefix = sId;
      return _this;
    }

    /**
     * Retrieves the editFlow controller extension for this page.
     *
     * @public
     * @returns The editFlow controller extension
     */
    var _proto = ExtensionAPI.prototype;
    _proto.getEditFlow = function getEditFlow() {
      return this.editFlow;
    }

    /**
     * Retrieves the routing controller extension for this page.
     *
     * @public
     * @returns The routing controller extension
     */;
    _proto.getRouting = function getRouting() {
      return this.routing;
    }

    /**
     * Retrieves the intentBasedNavigation controller extension for this page.
     *
     * @public
     * @returns The intentBasedNavigation controller extension
     */;
    _proto.getIntentBasedNavigation = function getIntentBasedNavigation() {
      return this.intentBasedNavigation;
    }

    /**
     * Access a control by its ID. If you attempt to access an internal control instead of the stable API, the method will raise an error.
     *
     * @param id ID of the control without view and section prefix.
     * @returns The requested control, if found in the view / section.
     * @public
     */;
    _proto.byId = function byId(id) {
      let control = this._view.byId(id);
      if (!control && this._prefix) {
        // give it a try with the prefix
        control = this._view.byId(`${this._prefix}--${id}`);
      }
      if (!control) {
        return undefined;
      }
      if (!control.isA("sap.fe.macros.MacroAPI")) {
        // check if app tried to access an internal control wrapped by a macro API
        let parent = control.getParent();
        while (parent) {
          if (parent.isA("sap.fe.macros.form.FormAPI")) {
            // we reached the formAPI but no fieldAPI - the app tries to access any custom control which is fine
            break;
          }
          if (parent.isA("sap.fe.macros.MacroAPI")) {
            throw new Error(`You attempted to access an internal control. This is risky and might change later. Instead access its stable API by using ID ${parent.getId()}`);
          }
          parent = parent.getParent();
        }
      }
      return control;
    }

    /**
     * Get access to models managed by SAP Fiori elements.<br>
     * The following models can be accessed:
     * <ul>
     * <li>undefined: the undefined model returns the SAPUI5 OData V4 model bound to this page</li>
     * <li>i18n / further data models defined in the manifest</li>
     * <li>ui: returns a SAPUI5 JSON model containing UI information.
     * Only the following properties are public and supported:
     * 	<ul>
     *     <li>isEditable: set to true if the application is in edit mode</li>
     *  </ul>
     * </li>
     * </ul>.
     * editMode is deprecated and should not be used anymore. Use isEditable instead.
     *
     * @param sModelName Name of the model
     * @returns The required model
     * @public
     */;
    _proto.getModel = function getModel(sModelName) {
      let oAppComponent;
      if (sModelName && sModelName !== "ui") {
        oAppComponent = CommonUtils.getAppComponent(this._view);
        if (!oAppComponent.getManifestEntry("sap.ui5").models[sModelName]) {
          // don't allow access to our internal models
          return undefined;
        }
      }
      return this._view.getModel(sModelName);
    }

    /**
     * Add any control as a dependent control to this SAP Fiori elements page.
     *
     * @param oControl Control to be added as a dependent control
     * @public
     */;
    _proto.addDependent = function addDependent(oControl) {
      this._view.addDependent(oControl);
    }

    /**
     * Remove a dependent control from this SAP Fiori elements page.
     *
     * @param oControl Control to be added as a dependent control
     * @public
     */;
    _proto.removeDependent = function removeDependent(oControl) {
      this._view.removeDependent(oControl);
    }

    /**
     * Navigate to another target.
     *
     * @param sTarget Name of the target route
     * @param [oContext] Context instance
     * @public
     */;
    _proto.navigateToTarget = function navigateToTarget(sTarget, oContext) {
      this._controller._routing.navigateToTarget(oContext, sTarget);
    }

    /**
     * Load a fragment and go through the template preprocessor with the current page context.
     *
     * @param mSettings The settings object
     * @param mSettings.id The ID of the fragment itself
     * @param mSettings.name The name of the fragment to be loaded
     * @param mSettings.controller The controller to be attached to the fragment
     * @param mSettings.contextPath The contextPath to be used for the templating process
     * @param mSettings.initialBindingContext The initial binding context
     * @returns The fragment definition
     * @public
     */;
    _proto.loadFragment = async function loadFragment(mSettings) {
      var _this$getModel, _mSettings$controller, _mSettings$controller2;
      const oTemplateComponent = Component.getOwnerComponentFor(this._view);
      const oPageModel = this._view.getModel("_pageModel");
      const i18nModel = this._view.getModel("sap.fe.i18n");
      const oMetaModel = (_this$getModel = this.getModel()) === null || _this$getModel === void 0 ? void 0 : _this$getModel.getMetaModel();
      const mViewData = oTemplateComponent.getViewData();
      const targetContextPath = oTemplateComponent.getEntitySet() ? `/${oTemplateComponent.getEntitySet()}` : oTemplateComponent.getContextPath();
      const oViewDataModel = new JSONModel(mViewData),
        oPreprocessorSettings = {
          bindingContexts: {
            contextPath: oMetaModel === null || oMetaModel === void 0 ? void 0 : oMetaModel.createBindingContext(mSettings.contextPath || targetContextPath),
            converterContext: oPageModel.createBindingContext("/", undefined, {
              noResolve: true
            }),
            viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
          },
          models: {
            contextPath: oMetaModel,
            converterContext: oPageModel,
            metaModel: oMetaModel,
            viewData: oViewDataModel,
            "sap.fe.i18n": i18nModel
          },
          appComponent: CommonUtils.getAppComponent(this._view)
        };

      // We scope the fragment with our ExtensionAPI. If a controller object is passed we merge it with the extensionAPI
      let controllerInstance;
      if (mSettings.controller && !((_mSettings$controller = mSettings.controller) !== null && _mSettings$controller !== void 0 && (_mSettings$controller2 = _mSettings$controller.isA) !== null && _mSettings$controller2 !== void 0 && _mSettings$controller2.call(_mSettings$controller, "sap.fe.core.ExtensionAPI"))) {
        const subClass = this.getMetadata().getClass().extend(mSettings.id + "-controller", {});
        for (const controllerElementKey in mSettings.controller) {
          const controllerElement = mSettings.controller[controllerElementKey];
          if (controllerElement !== null && controllerElement !== void 0 && controllerElement.bind) {
            subClass.prototype[controllerElementKey] = controllerElement.bind(mSettings.controller);
          } else {
            Object.defineProperty(subClass.prototype, controllerElementKey, {
              get() {
                var _mSettings$controller3;
                return (_mSettings$controller3 = mSettings.controller) === null || _mSettings$controller3 === void 0 ? void 0 : _mSettings$controller3[controllerElementKey];
              },
              set(v) {
                if (mSettings.controller) {
                  mSettings.controller[controllerElementKey] = v;
                }
              }
            });
          }
        }
        controllerInstance = new subClass(this._controller);
      } else {
        controllerInstance = mSettings.controller ?? this;
      }
      const oTemplatePromise = CommonUtils.templateControlFragment(mSettings.name, oPreprocessorSettings, {
        controller: controllerInstance,
        isXML: false,
        id: mSettings.id
      });
      oTemplatePromise.then(oFragment => {
        if (mSettings.initialBindingContext !== undefined) {
          oFragment.setBindingContext(mSettings.initialBindingContext);
        }
        this.addDependent(oFragment);
        return oFragment;
      }).catch(function (oError) {
        Log.error(oError);
      });
      return oTemplatePromise;
    }

    /**
     * Triggers an update of the app state.
     * Should be called if the state of a control, or any other state-relevant information, was changed.
     *
     * @returns A promise that resolves with the new app state object.
     * @public
     */;
    _proto.updateAppState = async function updateAppState() {
      const appStateInfo = await this._controller.getAppComponent().getAppStateHandler().createAppState();
      return appStateInfo === null || appStateInfo === void 0 ? void 0 : appStateInfo.appStateData;
    };
    return ExtensionAPI;
  }(BaseObject), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "editFlow", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "routing", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return ExtensionAPI;
}, false);
