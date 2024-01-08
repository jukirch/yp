/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/CommonUtils", "sap/fe/core/controls/CommandExecution", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ClassSupport", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/suite/ui/commons/collaboration/CollaborationHelper", "sap/suite/ui/commons/collaboration/ServiceContainer", "sap/ui/core/CustomData", "sap/ui/performance/trace/FESRHelper", "./ShareAPI", "sap/fe/core/jsx-runtime/jsx"], function (Log, BuildingBlockSupport, RuntimeBuildingBlock, CommonUtils, CommandExecution, BindingHelper, BindingToolkit, ClassSupport, Menu, MenuButton, MenuItem, CollaborationHelper, ServiceContainer, CustomData, FESRHelper, ShareAPI, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var defineReference = ClassSupport.defineReference;
  var not = BindingToolkit.not;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var UI = BindingHelper.UI;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const COLLABORATION_MSTEAMS_CARD = "COLLABORATION_MSTEAMS_CARD";

  /**
   * Building block used to create the ‘Share’ functionality.
   * <br>
   * Please note that the 'Share in SAP Jam' option is only available on platforms that are integrated with SAP Jam.
   * <br>
   * If you are consuming this macro in an environment where the SAP Fiori launchpad is not available, then the 'Save as Tile' option is not visible.
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
   * @hideconstructor
   * @public
   * @since 1.93.0
   */
  let ShareBlock = (_dec = defineBuildingBlock({
    name: "Share",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.share.ShareAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    required: true,
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "boolean",
    isPublic: true,
    bindable: true
  }), _dec4 = blockAttribute({
    type: "object",
    isPublic: false
  }), _dec5 = defineReference(), _dec6 = defineReference(), _dec7 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(ShareBlock, _RuntimeBuildingBlock);
    function ShareBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "msTeamsOptions", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "menuButton", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "menu", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "saveAsTileMenuItem", _descriptor6, _assertThisInitialized(_this));
      return _this;
    }
    _exports = ShareBlock;
    var _proto = ShareBlock.prototype;
    /**
     * Retrieves the share option from the shell configuration asynchronously and prepare the content of the menu button.
     * Options order are:
     * - Send as Email
     * - Share as Jam (if available)
     * - Teams options (if available)
     * - Save as tile.
     *
     * @param view The view this building block is used in
     * @param appComponent The AppComponent instance
     */
    _proto._initializeMenuItems = async function _initializeMenuItems(view, appComponent) {
      const isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
      if (isTeamsModeActive) {
        var _this$menuButton$curr, _this$menuButton$curr2;
        //need to clear the visible property bindings otherwise when the binding value changes then it will set back the visible to the resolved value
        (_this$menuButton$curr = this.menuButton.current) === null || _this$menuButton$curr === void 0 ? void 0 : _this$menuButton$curr.unbindProperty("visible", true);
        (_this$menuButton$curr2 = this.menuButton.current) === null || _this$menuButton$curr2 === void 0 ? void 0 : _this$menuButton$curr2.setVisible(false);
        return;
      }
      const controller = view.getController();
      const shellServices = appComponent.getShellServices();
      const isPluginInfoStable = await shellServices.waitForPluginsLoad();
      if (!isPluginInfoStable) {
        var _this$menuButton$curr3;
        // In case the plugin info is not yet available we need to do this computation again on the next button click
        const internalButton = (_this$menuButton$curr3 = this.menuButton.current) === null || _this$menuButton$curr3 === void 0 ? void 0 : _this$menuButton$curr3.getAggregation("_control");
        internalButton === null || internalButton === void 0 ? void 0 : internalButton.attachEventOnce("press", {}, () => this._initializeMenuItems, this);
      }
      if (this.menu.current) {
        this.menu.current.addItem(_jsx(MenuItem, {
          text: this.getTranslatedText("T_SEMANTIC_CONTROL_SEND_EMAIL"),
          icon: "sap-icon://email",
          press: () => controller.share._triggerEmail()
        }));
        await this._addShellBasedMenuItems(controller, shellServices);
      }
    };
    _proto._addShellBasedMenuItems = async function _addShellBasedMenuItems(controller, shellServices) {
      var _shellServices$getUse, _shellServices$getUse2, _this$msTeamsOptions;
      const hasUshell = shellServices.hasUShell();
      const hasJam = !!((_shellServices$getUse = (_shellServices$getUse2 = shellServices.getUser()).isJamActive) !== null && _shellServices$getUse !== void 0 && _shellServices$getUse.call(_shellServices$getUse2));
      const collaborationTeamsHelper = await ServiceContainer.getServiceAsync();
      const shareCollaborationOptions = collaborationTeamsHelper.getOptions({
        isShareAsCardEnabled: ((_this$msTeamsOptions = this.msTeamsOptions) === null || _this$msTeamsOptions === void 0 ? void 0 : _this$msTeamsOptions.enableCard) === "true"
      });
      if (hasUshell) {
        if (hasJam) {
          var _this$menu, _this$menu$current;
          this === null || this === void 0 ? void 0 : (_this$menu = this.menu) === null || _this$menu === void 0 ? void 0 : (_this$menu$current = _this$menu.current) === null || _this$menu$current === void 0 ? void 0 : _this$menu$current.addItem(_jsx(MenuItem, {
            text: this.getTranslatedText("T_COMMON_SAPFE_SHARE_JAM"),
            icon: "sap-icon://share-2",
            press: () => controller.share._triggerShareToJam()
          }));
        }
        // prepare teams menu items
        for (const collaborationOption of shareCollaborationOptions) {
          var _collaborationOption$, _collaborationOption$2, _this$menu2, _this$menu2$current;
          const menuItemSettings = {
            text: collaborationOption.text,
            icon: collaborationOption.icon,
            visible: ((_collaborationOption$ = collaborationOption.subOptions) === null || _collaborationOption$ === void 0 ? void 0 : _collaborationOption$.length) === 1 && collaborationOption.subOptions[0].key === COLLABORATION_MSTEAMS_CARD ? compileExpression(not(UI.IsEditable)) : undefined,
            items: []
          };
          if (collaborationOption !== null && collaborationOption !== void 0 && collaborationOption.subOptions && (collaborationOption === null || collaborationOption === void 0 ? void 0 : (_collaborationOption$2 = collaborationOption.subOptions) === null || _collaborationOption$2 === void 0 ? void 0 : _collaborationOption$2.length) > 0) {
            menuItemSettings.items = [];
            collaborationOption.subOptions.forEach(subOption => {
              const subMenuItem = new MenuItem({
                text: subOption.text,
                icon: subOption.icon,
                press: this.collaborationMenuItemPress,
                visible: subOption.key === COLLABORATION_MSTEAMS_CARD ? compileExpression(not(UI.IsEditable)) : undefined,
                customData: new CustomData({
                  key: "collaborationData",
                  value: subOption
                })
              });
              if (subOption.fesrStepName) {
                FESRHelper.setSemanticStepname(subMenuItem, "press", subOption.fesrStepName);
              }
              menuItemSettings.items.push(subMenuItem);
            });
          } else {
            // if there are no sub option then the main option should be clickable
            // so add a press handler.
            menuItemSettings.press = this.collaborationMenuItemPress;
            menuItemSettings["customData"] = new CustomData({
              key: "collaborationData",
              value: collaborationOption
            });
          }
          const menuItem = new MenuItem(menuItemSettings);
          if (menuItemSettings.press && collaborationOption.fesrStepName) {
            FESRHelper.setSemanticStepname(menuItem, "press", collaborationOption.fesrStepName);
          }
          this === null || this === void 0 ? void 0 : (_this$menu2 = this.menu) === null || _this$menu2 === void 0 ? void 0 : (_this$menu2$current = _this$menu2.current) === null || _this$menu2$current === void 0 ? void 0 : _this$menu2$current.addItem(menuItem);
        }
        // set save as tile
        // for now we need to create addBookmarkButton to use the save as tile feature.
        // In the future save as tile should be available as an API or a MenuItem so that it can be added to the Menu button.
        // This needs to be discussed with AddBookmarkButton team.
        const {
          default: AddBookmarkButton
        } = await __ui5_require_async("sap/ushell/ui/footerbar/AddBookmarkButton");
        const addBookmarkButton = new AddBookmarkButton();
        if (addBookmarkButton.getEnabled()) {
          var _this$menu3, _this$menu3$current;
          this === null || this === void 0 ? void 0 : (_this$menu3 = this.menu) === null || _this$menu3 === void 0 ? void 0 : (_this$menu3$current = _this$menu3.current) === null || _this$menu3$current === void 0 ? void 0 : _this$menu3$current.addItem(_jsx(MenuItem, {
            ref: this.saveAsTileMenuItem,
            text: addBookmarkButton.getText(),
            icon: addBookmarkButton.getIcon(),
            press: () => controller.share._saveAsTile(this.saveAsTileMenuItem.current),
            children: {
              dependents: [addBookmarkButton]
            }
          }));
        } else {
          addBookmarkButton.destroy();
        }
      }
    };
    _proto.collaborationMenuItemPress = async function collaborationMenuItemPress(event) {
      const clickedMenuItem = event.getSource();
      const collaborationTeamsHelper = await ServiceContainer.getServiceAsync();
      const view = CommonUtils.getTargetView(clickedMenuItem);
      const controller = view.getController();
      await controller.share._adaptShareMetadata();
      const shareInfoModel = view.getModel("shareInfo");
      if (shareInfoModel) {
        const shareInfo = shareInfoModel.getData();
        const {
          collaborationInfo
        } = shareInfo;
        const collaborationData = clickedMenuItem.data("collaborationData");
        if (collaborationData["key"] === COLLABORATION_MSTEAMS_CARD) {
          const isShareAsCardEnabled = collaborationTeamsHelper.isFeatureFlagEnabled();
          const cardDefinition = isShareAsCardEnabled ? controller.share.getCardDefinition() : undefined;
          let cardId;
          if (cardDefinition) {
            const shellServiceHelper = controller.getAppComponent().getShellServices();
            const {
              semanticObject,
              action
            } = shellServiceHelper.parseShellHash(document.location.hash);
            cardId = `${semanticObject}_${action}`;
          } else {
            const reason = !isShareAsCardEnabled ? "Feature flag disabled in collaboration teams helper" : "Card definition was not created";
            Log.info(`FE V4 : Share block : share as Card : ${reason}`);
          }
          collaborationInfo["cardManifest"] = cardDefinition;
          collaborationInfo["cardId"] = cardId;
        }
        collaborationTeamsHelper.share(collaborationData, collaborationInfo);
      }
    };
    _proto.getContent = function getContent(view, appComponent) {
      // Ctrl+Shift+S is needed for the time being but this needs to be removed after backlog from menu button
      const menuButton = _jsx(ShareAPI, {
        id: this.id,
        children: _jsx(MenuButton, {
          ref: this.menuButton,
          icon: "sap-icon://action",
          visible: this.visible,
          tooltip: "{sap.fe.i18n>M_COMMON_SAPFE_ACTION_SHARE} (Ctrl+Shift+S)",
          children: _jsx(Menu, {
            ref: this.menu
          })
        })
      });
      view.addDependent(_jsx(CommandExecution, {
        visible: this.visible,
        enabled: this.visible,
        command: "Share",
        execute: () => {
          var _this$menuButton$curr4;
          return (_this$menuButton$curr4 = this.menuButton.current) === null || _this$menuButton$curr4 === void 0 ? void 0 : _this$menuButton$curr4.getMenu().openBy(this.menuButton.current, true);
        }
      }));
      // The initialization is asynchronous, so we just trigger it and hope for the best :D
      this.isInitialized = this._initializeMenuItems(view, appComponent).catch(error => {
        Log.error(error);
      });
      return menuButton;
    };
    return ShareBlock;
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
      return constant(true);
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "msTeamsOptions", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "menuButton", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "menu", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "saveAsTileMenuItem", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ShareBlock;
  return _exports;
}, false);
