/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/ClassSupport", "sap/m/Bar", "sap/m/Button", "sap/m/Dialog", "sap/m/Title", "sap/ui/core/Core", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, ClassSupport, Bar, Button, Dialog, Title, Core, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16;
  var _exports = {};
  var defineReference = ClassSupport.defineReference;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const macroResourceBundle = Core.getLibraryResourceBundle("sap.fe.macros");
  /**
   * Known limitations for the first tryout as mentioned in git 5806442
   *  - functional block dependency
   * 	- questionable parameters will be refactored
   */
  let OperationsDialogBlock = (_dec = defineBuildingBlock({
    name: "OperationsDialog",
    namespace: "sap.fe.core.controllerextensions"
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "object",
    required: true
  }), _dec5 = defineReference(), _dec6 = blockAttribute({
    type: "boolean",
    required: true
  }), _dec7 = blockAttribute({
    type: "function"
  }), _dec8 = blockAttribute({
    type: "object",
    required: true
  }), _dec9 = blockAttribute({
    type: "string",
    required: true
  }), _dec10 = blockAttribute({
    type: "string",
    required: true
  }), _dec11 = blockAttribute({
    type: "string",
    required: true
  }), _dec12 = blockAttribute({
    type: "object",
    required: true
  }), _dec13 = blockAttribute({
    type: "object"
  }), _dec14 = blockAttribute({
    type: "object"
  }), _dec15 = blockAttribute({
    type: "object",
    required: true
  }), _dec16 = blockAttribute({
    type: "boolean"
  }), _dec17 = blockAttribute({
    type: "function"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(OperationsDialogBlock, _RuntimeBuildingBlock);
    function OperationsDialogBlock(props) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "title", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "messageObject", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "operationsDialog", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isMultiContext412", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "resolve", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "model", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "groupId", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actionName", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "cancelButtonTxt", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "strictHandlingPromises", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "strictHandlingUtilities", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "messageHandler", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "messageDialogModel", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isGrouped", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showMessageInfo", _descriptor16, _assertThisInitialized(_this));
      return _this;
    }

    /*
     * The 'id' property of the dialog
     */
    _exports = OperationsDialogBlock;
    var _proto = OperationsDialogBlock.prototype;
    _proto.open = function open() {
      var _this$operationsDialo;
      this.getContent();
      (_this$operationsDialo = this.operationsDialog.current) === null || _this$operationsDialo === void 0 ? void 0 : _this$operationsDialo.open();
    };
    _proto.getBeginButton = function getBeginButton() {
      return new Button({
        press: () => {
          if (!(this.isMultiContext412 ?? false)) {
            var _this$resolve;
            (_this$resolve = this.resolve) === null || _this$resolve === void 0 ? void 0 : _this$resolve.call(this, true);
            this.model.submitBatch(this.groupId);
          } else {
            var _this$strictHandlingU;
            this.strictHandlingPromises.forEach(strictHandlingPromise => {
              strictHandlingPromise.resolve(true);
              this.model.submitBatch(strictHandlingPromise.groupId);
              if (strictHandlingPromise.requestSideEffects) {
                strictHandlingPromise.requestSideEffects();
              }
            });
            const strictHandlingFails = (_this$strictHandlingU = this.strictHandlingUtilities) === null || _this$strictHandlingU === void 0 ? void 0 : _this$strictHandlingU.strictHandlingTransitionFails;
            if (strictHandlingFails && strictHandlingFails.length > 0) {
              var _this$messageHandler;
              (_this$messageHandler = this.messageHandler) === null || _this$messageHandler === void 0 ? void 0 : _this$messageHandler.removeTransitionMessages();
            }
            if (this.strictHandlingUtilities) {
              this.strictHandlingUtilities.strictHandlingWarningMessages = [];
            }
          }
          if (this.strictHandlingUtilities) {
            this.strictHandlingUtilities.is412Executed = true;
          }
          this.messageDialogModel.setData({});
          this.close();
        },
        type: "Emphasized",
        text: this.actionName
      });
    };
    _proto.close = function close() {
      var _this$operationsDialo2;
      (_this$operationsDialo2 = this.operationsDialog.current) === null || _this$operationsDialo2 === void 0 ? void 0 : _this$operationsDialo2.close();
    };
    _proto.getTitle = function getTitle() {
      const sTitle = macroResourceBundle.getText("M_WARNINGS");
      return new Title({
        text: sTitle
      });
    };
    _proto.getEndButton = function getEndButton() {
      return new Button({
        press: () => {
          if (this.strictHandlingUtilities) {
            this.strictHandlingUtilities.strictHandlingWarningMessages = [];
            this.strictHandlingUtilities.is412Executed = false;
          }
          if (!(this.isMultiContext412 ?? false)) {
            this.resolve(false);
          } else {
            this.strictHandlingPromises.forEach(function (strictHandlingPromise) {
              strictHandlingPromise.resolve(false);
            });
          }
          this.messageDialogModel.setData({});
          this.close();
          if (this.isGrouped ?? false) {
            this.showMessageInfo();
          }
        },
        text: this.cancelButtonTxt
      });
    }

    /**
     * The building block render function.
     *
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.getContent = function getContent() {
      return _jsx(Dialog, {
        id: this.id,
        ref: this.operationsDialog,
        resizable: true,
        content: this.messageObject.oMessageView,
        state: "Warning",
        customHeader: new Bar({
          contentLeft: [this.messageObject.oBackButton],
          contentMiddle: [this.getTitle()]
        }),
        contentHeight: "50%",
        contentWidth: "50%",
        verticalScrolling: false,
        beginButton: this.getBeginButton(),
        endButton: this.getEndButton()
      });
    };
    return OperationsDialogBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Dialog Standard Title";
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "messageObject", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "operationsDialog", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isMultiContext412", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "resolve", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "model", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "groupId", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "actionName", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "cancelButtonTxt", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "strictHandlingPromises", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "strictHandlingUtilities", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "messageHandler", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "messageDialogModel", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "isGrouped", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "showMessageInfo", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = OperationsDialogBlock;
  return _exports;
}, false);
