/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/Label", "sap/m/List", "sap/m/Text", "sap/m/VBox", "sap/ui/core/CustomData", "sap/ui/core/library", "sap/fe/core/jsx-runtime/jsx", "sap/fe/core/jsx-runtime/jsxs", "sap/fe/core/jsx-runtime/Fragment"], function (BuildingBlockSupport, RuntimeBuildingBlock, ClassSupport, ResourceModelHelper, Button, CustomListItem, Dialog, Label, List, Text, VBox, CustomData, library, _jsx, _jsxs, _Fragment) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var ValueState = library.ValueState;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var defineReference = ClassSupport.defineReference;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let DraftDataLossDialogBlock = (_dec = defineBuildingBlock({
    name: "DraftDataLossDialog",
    namespace: "sap.fe.core.controllerextensions"
  }), _dec2 = defineReference(), _dec3 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(DraftDataLossDialogBlock, _RuntimeBuildingBlock);
    function DraftDataLossDialogBlock(props) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props) || this;
      _initializerDefineProperty(_this, "dataLossDialog", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "optionsList", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    _exports = DraftDataLossDialogBlock;
    var _proto = DraftDataLossDialogBlock.prototype;
    /**
     * Opens the data loss dialog.
     *
     * @param controller
     */
    _proto.open = async function open(controller) {
      var _this$optionsList$cur, _this$dataLossDialog$;
      this.view = controller.getView();
      this.dataLossResourceModel = getResourceModel(this.view);
      this.getContent();
      const dataLossConfirm = () => this.handleDataLossOk();
      (_this$optionsList$cur = this.optionsList.current) === null || _this$optionsList$cur === void 0 ? void 0 : _this$optionsList$cur.addEventDelegate({
        onkeyup: function (e) {
          if (e.key === "Enter") {
            dataLossConfirm();
          }
        }
      });
      this.view.addDependent(this.dataLossDialog.current);
      (_this$dataLossDialog$ = this.dataLossDialog.current) === null || _this$dataLossDialog$ === void 0 ? void 0 : _this$dataLossDialog$.open();
      this.selectAndFocusFirstEntry();
      return new Promise(resolve => {
        this.promiseResolve = resolve;
      });
    }

    /**
     * Handler to close the dataloss dialog.
     *
     */;
    _proto.close = function close() {
      var _this$dataLossDialog$2, _this$dataLossDialog$3;
      (_this$dataLossDialog$2 = this.dataLossDialog.current) === null || _this$dataLossDialog$2 === void 0 ? void 0 : _this$dataLossDialog$2.close();
      (_this$dataLossDialog$3 = this.dataLossDialog.current) === null || _this$dataLossDialog$3 === void 0 ? void 0 : _this$dataLossDialog$3.destroy();
    }

    /**
     * Executes the logic when the data loss dialog is confirmed. The selection of an option resolves the promise and leads to the
     * processing of the originally triggered action like e.g. a back navigation.
     *
     */;
    _proto.handleDataLossOk = function handleDataLossOk() {
      this.promiseResolve(this.getSelectedKey());
    }

    /**
     * Handler to close the dataloss dialog.
     *
     */;
    _proto.handleDataLossCancel = function handleDataLossCancel() {
      this.promiseResolve("cancel");
    }

    /**
     * Sets the focus on the first list item of the dialog.
     *
     */;
    _proto.selectAndFocusFirstEntry = function selectAndFocusFirstEntry() {
      var _this$optionsList$cur2, _this$optionsList$cur3;
      const firstListItemOption = (_this$optionsList$cur2 = this.optionsList.current) === null || _this$optionsList$cur2 === void 0 ? void 0 : _this$optionsList$cur2.getItems()[0];
      (_this$optionsList$cur3 = this.optionsList.current) === null || _this$optionsList$cur3 === void 0 ? void 0 : _this$optionsList$cur3.setSelectedItem(firstListItemOption);
      // We do not set the focus on the button, but catch the ENTER key in the dialog
      // and process it as Ok, since focusing the button was reported as an ACC issue
      firstListItemOption === null || firstListItemOption === void 0 ? void 0 : firstListItemOption.focus();
    }

    /**
     * Gets the key of the selected item from the list of options that was set via customData.
     *
     * @returns The key of the currently selected item
     */;
    _proto.getSelectedKey = function getSelectedKey() {
      const optionsList = this.optionsList.current;
      return optionsList.getSelectedItem().data("itemKey");
    }

    /**
     * Returns the confirm button.
     *
     * @returns A button
     */;
    _proto.getConfirmButton = function getConfirmButton() {
      return _jsx(Button, {
        text: this.dataLossResourceModel.getText("C_COMMON_DIALOG_OK"),
        type: "Emphasized",
        press: () => this.handleDataLossOk()
      });
    }

    /**
     * Returns the cancel button.
     *
     * @returns A button
     */;
    _proto.getCancelButton = function getCancelButton() {
      return _jsx(Button, {
        text: this.dataLossResourceModel.getText("C_COMMON_DIALOG_CANCEL"),
        press: () => this.handleDataLossCancel()
      });
    }

    /**
     * The building block render function.
     *
     * @returns An XML-based string
     */;
    _proto.getContent = function getContent() {
      var _this$view$getBinding;
      const hasActiveEntity = (_this$view$getBinding = this.view.getBindingContext()) === null || _this$view$getBinding === void 0 ? void 0 : _this$view$getBinding.getObject().HasActiveEntity;
      const description = hasActiveEntity ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_SAVE") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_CREATE");
      const createOrSaveLabel = hasActiveEntity ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_RBL") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_RBL");
      const createOrSaveText = hasActiveEntity ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_TOL") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_TOL");
      return _jsx(Dialog, {
        title: this.dataLossResourceModel.getText("WARNING"),
        state: ValueState.Warning,
        type: "Message",
        contentWidth: "22rem",
        ref: this.dataLossDialog,
        children: {
          content: _jsxs(_Fragment, {
            children: [_jsx(Text, {
              text: description,
              class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
            }), _jsxs(List, {
              mode: "SingleSelectLeft",
              showSeparators: "None",
              includeItemInSelection: "true",
              backgroundDesign: "Transparent",
              class: "sapUiNoContentPadding",
              ref: this.optionsList,
              children: [_jsx(CustomListItem, {
                customData: [new CustomData({
                  key: "itemKey",
                  value: "draftDataLossOptionSave"
                })],
                children: _jsxs(VBox, {
                  class: "sapUiTinyMargin",
                  children: [_jsx(Label, {
                    text: createOrSaveLabel,
                    design: "Bold"
                  }), _jsx(Text, {
                    text: createOrSaveText
                  })]
                })
              }), _jsx(CustomListItem, {
                customData: [new CustomData({
                  key: "itemKey",
                  value: "draftDataLossOptionKeep"
                })],
                children: _jsxs(VBox, {
                  class: "sapUiTinyMargin",
                  children: [_jsx(Label, {
                    text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_RBL"),
                    design: "Bold"
                  }), _jsx(Text, {
                    text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_TOL")
                  })]
                })
              }), _jsx(CustomListItem, {
                customData: [new CustomData({
                  key: "itemKey",
                  value: "draftDataLossOptionDiscard"
                })],
                children: _jsxs(VBox, {
                  class: "sapUiTinyMargin",
                  children: [_jsx(Label, {
                    text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_RBL"),
                    design: "Bold"
                  }), _jsx(Text, {
                    text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_TOL")
                  })]
                })
              })]
            })]
          }),
          buttons: _jsxs(_Fragment, {
            children: ["confirmButton = ", this.getConfirmButton(), "cancelButton = ", this.getCancelButton()]
          })
        }
      });
    };
    return DraftDataLossDialogBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "dataLossDialog", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "optionsList", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = DraftDataLossDialogBlock;
  return _exports;
}, false);
