/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/BindingToolkit", "sap/ui/core/CustomData", "sap/fe/core/helpers/ClassSupport", "sap/m/Button", "sap/m/Toolbar", "sap/ui/performance/trace/FESRHelper", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, BindingToolkit, CustomData, ClassSupport, Button, Toolbar, FESRHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var defineReference = ClassSupport.defineReference;
  var compileExpression = BindingToolkit.compileExpression;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let TeamContactOptionsBlock = (_dec = defineBuildingBlock({
    name: "TeamContactOptions",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "string",
    bindable: true
  }), _dec4 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(TeamContactOptionsBlock, _RuntimeBuildingBlock);
    function TeamContactOptionsBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "mail", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "toolbar", _descriptor3, _assertThisInitialized(_this));
      _this.visible = false;
      return _this;
    }
    _exports = TeamContactOptionsBlock;
    var _proto = TeamContactOptionsBlock.prototype;
    _proto.retrieveContactOptions = async function retrieveContactOptions(appComponent) {
      var _this$toolbar$current, _this$toolbar$current3;
      const contactOptions = appComponent ? await appComponent.getCollaborativeToolsService().getTeamContactOptions() : undefined;
      if (!(contactOptions !== null && contactOptions !== void 0 && contactOptions.length) || !this.mail) {
        return;
      }
      this.visible = true;
      (_this$toolbar$current = this.toolbar.current) === null || _this$toolbar$current === void 0 ? void 0 : _this$toolbar$current.removeAllContent();
      contactOptions.map(contactOptionDef => {
        var _this$toolbar$current2;
        (_this$toolbar$current2 = this.toolbar.current) === null || _this$toolbar$current2 === void 0 ? void 0 : _this$toolbar$current2.addContent(this.getContactOptionButton(contactOptionDef));
      });
      this.visible = true;
      (_this$toolbar$current3 = this.toolbar.current) === null || _this$toolbar$current3 === void 0 ? void 0 : _this$toolbar$current3.setVisible(true);
    };
    _proto.getContactOptionButton = function getContactOptionButton(contactOptionDef) {
      const button = _jsx(Button, {
        icon: contactOptionDef.icon,
        class: "sapUiSmallMarginEnd",
        type: "Transparent"
      });
      button.attachPress(contactOptionDef.callBackHandler);
      button.addCustomData(new CustomData({
        key: "email",
        value: compileExpression(this.mail)
      }));
      button.addCustomData(new CustomData({
        key: "type",
        value: contactOptionDef.key
      }));
      FESRHelper.setSemanticStepname(button, "press", contactOptionDef.fesrStepName);
      return button;
    };
    _proto.getContent = function getContent(containingView, appComponent) {
      const toolbar = _jsx(Toolbar, {
        id: this.id,
        ref: this.toolbar,
        visible: this.visible,
        width: "100%"
      });
      this.isInitialized = this.retrieveContactOptions(appComponent);
      return toolbar;
    };
    return TeamContactOptionsBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "mail", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "toolbar", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = TeamContactOptionsBlock;
  return _exports;
}, false);
