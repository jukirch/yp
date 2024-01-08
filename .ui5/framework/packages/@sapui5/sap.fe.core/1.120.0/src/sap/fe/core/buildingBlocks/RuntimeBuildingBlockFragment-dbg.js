/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/HookSupport", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/jsx-runtime/jsx", "sap/m/Label", "sap/ui/base/ManagedObject", "sap/ui/core/Component", "sap/ui/core/Fragment"], function (CommonUtils, HookSupport, BindingToolkit, ClassSupport, jsx, Label, ManagedObject, Component, Fragment) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var initControllerExtensionHookHandlers = HookSupport.initControllerExtensionHookHandlers;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let RuntimeBuildingBlockFragment = (
  /**
   * Internal extension to the Fragment class in order to add some place to hold functions for runtime building blocks
   */
  _dec = defineUI5Class("sap.fe.core.buildingBlocks.RuntimeBuildingBlockFragment"), _dec2 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_Fragment) {
    _inheritsLoose(RuntimeBuildingBlockFragment, _Fragment);
    function RuntimeBuildingBlockFragment() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Fragment.call(this, ...args) || this;
      _initializerDefineProperty(_this, "functionHolder", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    _exports = RuntimeBuildingBlockFragment;
    return RuntimeBuildingBlockFragment;
  }(Fragment), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "functionHolder", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = RuntimeBuildingBlockFragment;
  const RUNTIME_BLOCKS = {};
  /**
   * Stores the class of a runtime building block to be loaded whenever the building block is used at runtime.
   *
   * @param BuildingBlockClass
   */
  function storeRuntimeBlock(BuildingBlockClass) {
    RUNTIME_BLOCKS[`${BuildingBlockClass.metadata.namespace ?? BuildingBlockClass.metadata.publicNamespace}.${BuildingBlockClass.metadata.name}`] = BuildingBlockClass;
  }
  _exports.storeRuntimeBlock = storeRuntimeBlock;
  RuntimeBuildingBlockFragment.registerType("FE_COMPONENTS", {
    load: async function (mSettings) {
      let buildingBlockDetail;
      try {
        buildingBlockDetail = await RUNTIME_BLOCKS[mSettings.fragmentName].load();
      } catch (e) {
        mSettings.loadErrorMessage = e;
      }
      return buildingBlockDetail;
    },
    init: function (mSettings) {
      var _mSettings$customData, _mSettings$customData2, _mSettings$customData3, _mSettings$customData4, _mSettings$containing, _mSettings$containing2, _mSettings$containing3, _mSettings$containing4, _mSettings$containing5, _mSettings$containing6, _mSettings$containing7, _feCustomData$functio, _feCustomData$propert;
      // In case there was an error during the load process, exit early
      if (mSettings.loadErrorMessage) {
        return new Label({
          text: mSettings.loadErrorMessage
        });
      }
      let BuildingBlockClass = mSettings.fragmentContent;
      if (BuildingBlockClass === undefined) {
        // In some case we might have been called here synchronously (unstash case for instance), which means we didn't go through the load function
        BuildingBlockClass = RUNTIME_BLOCKS[mSettings.fragmentName];
      }
      if (BuildingBlockClass === undefined) {
        throw new Error(`No building block class for runtime building block ${mSettings.fragmentName} found`);
      }
      const classSettings = {};
      const feCustomData = ((_mSettings$customData = mSettings.customData) === null || _mSettings$customData === void 0 ? void 0 : (_mSettings$customData2 = _mSettings$customData[0]) === null || _mSettings$customData2 === void 0 ? void 0 : (_mSettings$customData3 = _mSettings$customData2.mProperties) === null || _mSettings$customData3 === void 0 ? void 0 : (_mSettings$customData4 = _mSettings$customData3.value) === null || _mSettings$customData4 === void 0 ? void 0 : _mSettings$customData4["sap.fe.core.buildingBlocks"]) || {};
      delete mSettings.customData;
      const functionHolder = mSettings.functionHolder ?? [];
      delete mSettings.functionHolder;

      // containingView can also be a fragment, so we have to use the controller (which could also be an ExtensionAPI) get the actual view
      const containingView = ((_mSettings$containing = (_mSettings$containing2 = mSettings.containingView).getController) === null || _mSettings$containing === void 0 ? void 0 : (_mSettings$containing3 = (_mSettings$containing4 = _mSettings$containing.call(_mSettings$containing2)).getView) === null || _mSettings$containing3 === void 0 ? void 0 : _mSettings$containing3.call(_mSettings$containing4)) ?? ((_mSettings$containing5 = (_mSettings$containing6 = mSettings.containingView).getController) === null || _mSettings$containing5 === void 0 ? void 0 : (_mSettings$containing7 = _mSettings$containing5.call(_mSettings$containing6)) === null || _mSettings$containing7 === void 0 ? void 0 : _mSettings$containing7["_view"]) ?? mSettings.containingView;
      const pageComponent = Component.getOwnerComponentFor(containingView);
      const appComponent = CommonUtils.getAppComponent(containingView);
      const metaModel = appComponent.getMetaModel();
      const pageModel = pageComponent.getModel("_pageModel");
      const functionStringInOrder = (_feCustomData$functio = feCustomData.functionStringInOrder) === null || _feCustomData$functio === void 0 ? void 0 : _feCustomData$functio.split(",");
      const propertiesAssignedToFunction = (_feCustomData$propert = feCustomData.propertiesAssignedToFunction) === null || _feCustomData$propert === void 0 ? void 0 : _feCustomData$propert.split(",");
      for (const propertyName in BuildingBlockClass.metadata.properties) {
        const propertyMetadata = BuildingBlockClass.metadata.properties[propertyName];
        const pageModelContext = pageModel.createBindingContext(feCustomData[propertyName]);
        if (pageModelContext === null) {
          // value cannot be resolved, so it is either a runtime binding or a constant
          let value = feCustomData[propertyName];
          if (typeof value === "string") {
            if (propertyMetadata.bindable !== true) {
              // runtime bindings are not allowed, so convert strings into actual primitive types
              switch (propertyMetadata.type) {
                case "boolean":
                  value = value === "true";
                  break;
                case "number":
                  value = Number(value);
                  break;
              }
            } else {
              // runtime bindings are allowed, so resolve the values as BindingToolkit expressions
              value = resolveBindingString(value, propertyMetadata.type);
            }
          } else if (propertyMetadata.type === "function") {
            const functionIndex = propertiesAssignedToFunction.indexOf(propertyName);
            const functionString = functionStringInOrder[functionIndex];
            const targetFunction = functionHolder === null || functionHolder === void 0 ? void 0 : functionHolder.find(functionDef => {
              var _functionDef$;
              return ((_functionDef$ = functionDef[0]) === null || _functionDef$ === void 0 ? void 0 : _functionDef$._sapui_handlerName) === functionString;
            });
            // We use the _sapui_handlerName to identify which function is the one we want to bind here
            if (targetFunction && targetFunction.length > 1) {
              value = targetFunction[0].bind(targetFunction[1]);
            }
          }
          classSettings[propertyName] = value;
        } else if (pageModelContext.getObject() !== undefined) {
          // get value from page model
          classSettings[propertyName] = pageModelContext.getObject();
        } else {
          // bind to metamodel
          classSettings[propertyName] = metaModel.createBindingContext(feCustomData[propertyName]);
        }
      }
      return ManagedObject.runWithPreprocessors(() => {
        const renderedControl = jsx.withContext({
          view: containingView,
          appComponent: appComponent
        }, () => {
          var _buildingBlockInstanc;
          const templateProcessingSettings = {
            models: {
              "sap.fe.i18n": containingView.getModel("sap.fe.i18n")
            },
            appComponent: appComponent
          };
          const buildingBlockInstance = new BuildingBlockClass(classSettings, {}, templateProcessingSettings);
          initControllerExtensionHookHandlers(buildingBlockInstance, containingView.getController());
          return (_buildingBlockInstanc = buildingBlockInstance.getContent) === null || _buildingBlockInstanc === void 0 ? void 0 : _buildingBlockInstanc.call(buildingBlockInstance, containingView, appComponent);
        });
        if (!this._bAsync) {
          this._aContent = renderedControl;
        }
        return renderedControl;
      }, {
        id: function (sId) {
          return containingView.createId(sId);
        },
        settings: function (controlSettings) {
          const allAssociations = this.getMetadata().getAssociations();
          for (const associationDetailName of Object.keys(allAssociations)) {
            if (controlSettings[associationDetailName] !== undefined) {
              // The associated elements are indicated via local IDs; we need to change the references to global ones
              const associations = Array.isArray(controlSettings[associationDetailName]) ? controlSettings[associationDetailName] : [controlSettings[associationDetailName]];

              // Create global IDs for associations given as strings, not for already resolved ManagedObjects
              controlSettings[associationDetailName] = associations.map(association => typeof association === "string" ? mSettings.containingView.createId(association) : association);
            }
          }
          return controlSettings;
        }
      });
    }
  });
  return _exports;
}, false);
