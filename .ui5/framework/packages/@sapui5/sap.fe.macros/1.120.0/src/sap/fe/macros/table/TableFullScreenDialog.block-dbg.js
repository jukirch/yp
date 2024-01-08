/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/ClassSupport", "sap/m/Button", "sap/m/Dialog", "sap/m/library", "sap/m/Page", "sap/m/Panel", "sap/ui/core/Component", "sap/ui/core/Core", "sap/ui/core/util/reflection/JsControlTreeModifier", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, ClassSupport, Button, Dialog, mLibrary, Page, Panel, Component, Core, JsControlTreeModifier, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
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
  const ButtonType = mLibrary.ButtonType;
  let TableFullScreenDialogBlock = (_dec = defineBuildingBlock({
    name: "TableFullScreenDialog",
    namespace: "sap.fe.macros.table"
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(TableFullScreenDialogBlock, _RuntimeBuildingBlock);
    function TableFullScreenDialogBlock(props) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "fullScreenButton", _descriptor2, _assertThisInitialized(_this));
      _this.fullScreenDialogContentPage = new Page();
      _this.enteringFullScreen = false;
      _this.messageBundle = Core.getLibraryResourceBundle("sap.fe.macros");
      return _this;
    }
    _exports = TableFullScreenDialogBlock;
    var _proto = TableFullScreenDialogBlock.prototype;
    /**
     * Main handler for switching between full screen dialog and normal display.
     *
     * @function
     * @name onFullScreenToggle
     */
    _proto.onFullScreenToggle = async function onFullScreenToggle() {
      this.enteringFullScreen = !this.enteringFullScreen;
      this.tableAPI = this.getTableAPI();
      if (!this.tablePlaceHolderPanel) {
        this.tablePlaceHolderPanel = this.createTablePlaceHolderPanel();
      }
      if (this.enteringFullScreen) {
        var _this$fullScreenButto, _this$fullScreenButto2;
        // change the button icon and text
        (_this$fullScreenButto = this.fullScreenButton.current) === null || _this$fullScreenButto === void 0 ? void 0 : _this$fullScreenButto.setIcon("sap-icon://exit-full-screen");
        (_this$fullScreenButto2 = this.fullScreenButton.current) === null || _this$fullScreenButto2 === void 0 ? void 0 : _this$fullScreenButto2.setTooltip(this.messageBundle.getText("M_COMMON_TABLE_FULLSCREEN_MINIMIZE"));

        // Store the current location of the table to be able to move it back later
        this.nonFullScreenTableParent = this.tableAPI.getParent();
        this._originalAggregationName = await JsControlTreeModifier.getParentAggregationName(this.tableAPI);

        // Replace the current position of the table with an empty Panel as a placeholder
        this.nonFullScreenTableParent.setAggregation(this._originalAggregationName, this.tablePlaceHolderPanel);

        // Create the full screen dialog
        this.createDialog();

        // Move the table over into the content page in the dialog and open the dialog
        this.fullScreenDialogContentPage.addContent(this.tableAPI);
        this.fullScreenDialog.open();
      } else {
        var _this$fullScreenButto3, _this$fullScreenButto4;
        // change the button icon and text
        (_this$fullScreenButto3 = this.fullScreenButton.current) === null || _this$fullScreenButto3 === void 0 ? void 0 : _this$fullScreenButto3.setIcon("sap-icon://full-screen");
        (_this$fullScreenButto4 = this.fullScreenButton.current) === null || _this$fullScreenButto4 === void 0 ? void 0 : _this$fullScreenButto4.setTooltip(this.messageBundle.getText("M_COMMON_TABLE_FULLSCREEN_MAXIMIZE"));

        // Move the table back to the old place and close the dialog
        this.nonFullScreenTableParent.setAggregation(this._originalAggregationName, this.tableAPI);
        this.fullScreenDialog.close();
      }
    }

    /**
     * Determine a reference to the TableAPI control starting from the button.
     *
     * @function
     * @name getTableAPI
     * @returns The TableAPI
     */;
    _proto.getTableAPI = function getTableAPI() {
      let currentControl = this.fullScreenButton.current;
      do {
        currentControl = currentControl.getParent();
      } while (!currentControl.isA("sap.fe.macros.table.TableAPI"));
      return currentControl;
    }

    /**
     * Create the panel which acts as the placeholder for the table as long as it is displayed in the
     * full screen dialog.
     *
     * @function
     * @name createTablePlaceHolderPanel
     * @returns A Panel as placeholder for the table API
     */;
    _proto.createTablePlaceHolderPanel = function createTablePlaceHolderPanel() {
      const tablePlaceHolderPanel = new Panel({});
      tablePlaceHolderPanel.data("tableAPIreference", this.tableAPI);
      tablePlaceHolderPanel.data("FullScreenTablePlaceHolder", true);
      return tablePlaceHolderPanel;
    }

    /**
     * Create the full screen dialog.
     *
     * @function
     * @name createDialog
     */;
    _proto.createDialog = function createDialog() {
      if (!this.fullScreenDialog) {
        this.fullScreenDialog = new Dialog({
          showHeader: false,
          stretch: true,
          afterOpen: () => {
            this.afterDialogOpen();
          },
          beforeClose: () => {
            this.beforeDialogClose();
          },
          afterClose: () => {
            this.afterDialogClose();
          },
          endButton: this.getEndButton(),
          content: this.fullScreenDialogContentPage
        });
        // The below is needed for correctly setting the focus after adding a new row in
        // the table in fullscreen mode
        this.fullScreenDialog.data("FullScreenDialog", true);

        // Add the dialog as a dependent to the original parent of the table in order to not lose the context
        this.nonFullScreenTableParent.addDependent(this.fullScreenDialog);
      }
    }

    /**
     * Create the full screen dialog close button.
     *
     * @function
     * @name getEndButton
     * @returns The button control
     */;
    _proto.getEndButton = function getEndButton() {
      return new Button({
        text: this.messageBundle.getText("M_COMMON_TABLE_FULLSCREEN_CLOSE"),
        type: ButtonType.Transparent,
        press: () => {
          // Just close the dialog here, all the needed processing is triggered
          // in beforeClose.
          // This ensures, that we only do it once event if the user presses the
          // ESC key and the Close button simultaneously
          this.fullScreenDialog.close();
        }
      });
    }

    /**
     * Set the focus back to the full screen button after opening the dialog.
     *
     * @function
     * @name afterDialogOpen
     */;
    _proto.afterDialogOpen = function afterDialogOpen() {
      var _this$fullScreenButto5;
      (_this$fullScreenButto5 = this.fullScreenButton.current) === null || _this$fullScreenButto5 === void 0 ? void 0 : _this$fullScreenButto5.focus();
    }

    /**
     * Handle dialog close via Esc. navigation etc.
     *
     * @function
     * @name beforeDialogClose
     */;
    _proto.beforeDialogClose = function beforeDialogClose() {
      // In case fullscreen dialog was closed due to navigation to another page/view/app, "Esc" click, etc. The dialog close
      // would be triggered externally and we need to clean up and move the table back to the old location
      if (this.tableAPI && this.enteringFullScreen) {
        this.onFullScreenToggle();
      }
    }

    /**
     * Some follow up after closing the dialog.
     *
     * @function
     * @name afterDialogClose
     */;
    _proto.afterDialogClose = function afterDialogClose() {
      var _this$fullScreenButto6;
      const component = Component.getOwnerComponentFor(this.tableAPI);
      const appComponent = Component.getOwnerComponentFor(component);
      (_this$fullScreenButto6 = this.fullScreenButton.current) === null || _this$fullScreenButto6 === void 0 ? void 0 : _this$fullScreenButto6.focus();
      // trigger the automatic scroll to the latest navigated row :
      appComponent.getRootViewController().getView().getController()._scrollTablesToLastNavigatedItems();
    }

    /**
     * The building block render function.
     *
     * @function
     * @name getContent
     * @returns An XML-based string with the definition of the full screen button
     */;
    _proto.getContent = function getContent() {
      return _jsx(Button, {
        ref: this.fullScreenButton,
        id: this.id,
        tooltip: this.messageBundle.getText("M_COMMON_TABLE_FULLSCREEN_MAXIMIZE"),
        icon: "sap-icon://full-screen",
        press: () => this.onFullScreenToggle(),
        type: "Transparent",
        visible: true,
        enabled: true
      });
    };
    return TableFullScreenDialogBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "fullScreenButton", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = TableFullScreenDialogBlock;
  return _exports;
}, false);
