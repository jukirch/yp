/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/BindingToolkit", "sap/m/Link", "sap/m/library", "sap/ui/core/CustomData", "sap/base/Log", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, BindingToolkit, Link, MLibrary, CustomData, Log, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var compileExpression = BindingToolkit.compileExpression;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let EmailBlock = (_dec = defineBuildingBlock({
    name: "Email",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec4 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec5 = blockAttribute({
    type: "string",
    bindable: true
  }), _dec6 = blockAttribute({
    type: "string",
    bindable: true
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(EmailBlock, _RuntimeBuildingBlock);
    var _proto = EmailBlock.prototype;
    _proto.isTeamsConnectionActive = async function isTeamsConnectionActive() {
      if (this.appComponent) {
        return this.appComponent.getCollaborativeToolsService().isContactsCollaborationSupported();
      } else {
        return false;
      }
    };
    _proto.getMailPopoverFromMsTeamsIntegration = function getMailPopoverFromMsTeamsIntegration(mail) {
      if (this.appComponent) {
        return this.appComponent.getCollaborativeToolsService().getMailPopoverFromMsTeamsIntegration(mail);
      } else {
        return undefined;
      }
    };
    function EmailBlock(props, _controlConfiguration, _visitorSettings) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props, _controlConfiguration, _visitorSettings) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enabled", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "text", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "mail", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "emptyIndicatorMode", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor7, _assertThisInitialized(_this));
      _this.appComponent = _visitorSettings === null || _visitorSettings === void 0 ? void 0 : _visitorSettings.appComponent;
      return _this;
    }
    _exports = EmailBlock;
    _proto.openPopover = async function openPopover(event) {
      event.preventDefault(); // stop default behavior based on href
      let revertToDefaultBehaviour = false;
      const link = event.getSource();
      const mail = link.data("mail");

      // we need to check if the teams connection is active now because at templating the teamshelper service might not have been initialized yet
      if (await this.isTeamsConnectionActive()) {
        if (mail) {
          try {
            const popover = await this.getMailPopoverFromMsTeamsIntegration(mail);
            popover.openBy(link);
          } catch (e) {
            Log.error(`Failed to retrieve Teams minimal popover for email :${e}`);
            revertToDefaultBehaviour = true;
          }
        }
      } else {
        revertToDefaultBehaviour = true;
      }
      if (revertToDefaultBehaviour) {
        MLibrary.URLHelper.redirect(`mailto:${mail}`);
      }
    };
    _proto.getContent = function getContent() {
      const href = `mailto:${this.mail}`;
      const link = _jsx(Link, {
        id: this.id,
        visible: this.visible,
        text: this.text,
        href: href,
        enabled: this.enabled,
        emptyIndicatorMode: this.emptyIndicatorMode,
        class: "sapMTextRenderWhitespaceWrap",
        press: async event => this.openPopover(event)
      });
      if (this.ariaLabelledBy) {
        link.addAriaLabelledBy(this.ariaLabelledBy);
      }
      link.addCustomData(new CustomData({
        key: "mail",
        value: compileExpression(this.mail)
      }));
      return link;
    };
    return EmailBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "true";
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "enabled", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "true";
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "mail", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "emptyIndicatorMode", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Off";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  })), _class2)) || _class);
  _exports = EmailBlock;
  return _exports;
}, false);
