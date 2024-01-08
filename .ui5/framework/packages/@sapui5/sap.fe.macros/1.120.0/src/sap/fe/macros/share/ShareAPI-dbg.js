/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ClassSupport", "sap/suite/ui/commons/collaboration/CollaborationHelper", "../MacroAPI"], function (Log, ClassSupport, CollaborationHelper, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Building block used to create the ‘Share’ functionality.
   * <br>
   * Please note that the 'Share in SAP Jam' option is only available on platforms that are integrated with SAP Jam.
   * <br>
   * If you are consuming this building block in an environment where the SAP Fiori launchpad is not available, then the 'Save as Tile' option is not visible.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Share
   * 	id="someID"
   *	visible="true"
   * /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.ShareAPI
   * @private
   * @since 1.108.0
   */
  let ShareAPI = (_dec = defineUI5Class("sap.fe.macros.share.ShareAPI", {
    interfaces: ["sap.m.IOverflowToolbarContent"]
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "boolean",
    defaultValue: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(ShareAPI, _MacroAPI);
    function ShareAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = ShareAPI.prototype;
    /**
     * Returns properties for the interface IOverflowToolbarContent.
     *
     * @returns Returns the configuration of IOverflowToolbarContent
     */
    _proto.getOverflowToolbarConfig = function getOverflowToolbarConfig() {
      return {
        canOverflow: false
      };
    }

    /**
     * Sets the visibility of the 'Share' building block based on the value.
     * If the 'Share' building block is used in an application that's running in Microsoft Teams,
     * this function does not have any effect,
     * since the 'Share' building block handles the visibility on it's own in that case.
     *
     * @param visibility The desired visibility to be set
     * @returns Promise which resolves with the instance of ShareAPI
     * @private
     */;
    _proto.setVisibility = async function setVisibility(visibility) {
      const isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
      // In case of teams mode share should not be visible
      // so we do not do anything
      if (!isTeamsModeActive) {
        this.content.setVisible(visibility);
        this.visible = visibility;
      } else {
        Log.info("Share Building Block: visibility not changed since application is running in teams mode!");
      }
      return Promise.resolve(this);
    }

    /**
     * Adds style class to MenuButton. Requested by the toolbars that contain the Share Button.
     *
     * @param style
     * @returns Returns the reference to the MenuButton
     */;
    _proto.addStyleClass = function addStyleClass(style) {
      const menuButton = this.getAggregation("content");
      menuButton.addStyleClass(style);
      return this;
    };
    return ShareAPI;
  }(MacroAPI), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return ShareAPI;
}, false);
