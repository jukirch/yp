/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/library", "sap/fe/core/templating/CriticalityFormatters", "sap/m/Button", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, DataField, MetaModelConverter, library, CriticalityFormatters, Button, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var isActionWithDialog = DataField.isActionWithDialog;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let DataFieldForActionBlock = (_dec = defineBuildingBlock({
    name: "DataFieldForAction",
    namespace: "sap.fe.macros.actions"
  }), _dec2 = blockAttribute({
    type: "object",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "string",
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(DataFieldForActionBlock, _RuntimeBuildingBlock);
    function DataFieldForActionBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "action", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "id", _descriptor3, _assertThisInitialized(_this));
      return _this;
    }
    _exports = DataFieldForActionBlock;
    var _proto = DataFieldForActionBlock.prototype;
    _proto.getContent = function getContent(view) {
      const controller = view.getController();
      const dataViewModelPath = getInvolvedDataModelObjects(this.contextPath);
      const odataMetaModel = this.contextPath.getModel();
      const annotationPath = this.action.annotationPath;
      let pressEvent;
      if (annotationPath) {
        const annotationPathContext = odataMetaModel.getContext(annotationPath);
        const dataFieldContextModelPath = getInvolvedDataModelObjects(annotationPathContext);
        const dataFieldForAction = dataFieldContextModelPath.targetObject;
        if (dataFieldForAction) {
          var _dataViewModelPath$ta, _dataFieldForAction$L;
          const actionParameters = {
            entitySetName: (_dataViewModelPath$ta = dataViewModelPath.targetEntitySet) === null || _dataViewModelPath$ta === void 0 ? void 0 : _dataViewModelPath$ta.name,
            invocationGrouping: dataFieldForAction.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? library.InvocationGrouping.ChangeSet : library.InvocationGrouping.Isolated,
            label: (_dataFieldForAction$L = dataFieldForAction.Label) === null || _dataFieldForAction$L === void 0 ? void 0 : _dataFieldForAction$L.toString(),
            isNavigable: this.action.isNavigable,
            defaultValuesExtensionFunction: this.action.defaultValuesExtensionFunction
          };
          if (!this.action.command) {
            pressEvent = {
              press: () => {
                controller.handlers.onCallAction(view, dataFieldForAction.Action, {
                  ...actionParameters,
                  ...{
                    contexts: view.getBindingContext(),
                    model: view.getModel()
                  }
                });
              }
            };
          } else {
            pressEvent = {
              "jsx:command": `${this.action.command}|press`
            };
          }
          return _jsx(Button, {
            id: this.id,
            text: actionParameters.label,
            ...pressEvent,
            ariaHasPopup: isActionWithDialog(dataFieldContextModelPath.targetObject),
            visible: this.action.visible,
            enabled: this.action.enabled,
            type: CriticalityFormatters.buildExpressionForCriticalityButtonType(dataFieldContextModelPath)
          });
        }
      }
    };
    return DataFieldForActionBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "action", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = DataFieldForActionBlock;
  return _exports;
}, false);
