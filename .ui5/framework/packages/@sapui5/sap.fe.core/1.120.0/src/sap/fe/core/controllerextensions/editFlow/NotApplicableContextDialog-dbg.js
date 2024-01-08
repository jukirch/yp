/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/templating/EntityTypeHelper", "sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/HBox", "sap/m/List", "sap/m/Text", "sap/m/VBox", "sap/fe/core/jsx-runtime/jsx", "sap/fe/core/jsx-runtime/Fragment", "sap/fe/core/jsx-runtime/jsxs"], function (EntityTypeHelper, Button, CustomListItem, Dialog, HBox, List, Text, VBox, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _exports = {};
  var getTitleExpression = EntityTypeHelper.getTitleExpression;
  /**
   * Display a dialog to inform the user that some contexts are not applicable for the action.
   * This is not the target Ux but just keeping the current behavior
   */
  let NotApplicableContextDialog = /*#__PURE__*/function () {
    function NotApplicableContextDialog(props) {
      this.totalContextCount = 0;
      this.title = props.title;
      this.resourceModel = props.resourceModel;
      this.entityType = props.entityType;
      this.notApplicableContexts = props.notApplicableContexts;
      this._shouldContinue = false;
      this._dialog = this.createDialog();
      this._processingPromise = new Promise(resolve => {
        this._fnResolve = resolve;
      });
    }
    _exports = NotApplicableContextDialog;
    var _proto = NotApplicableContextDialog.prototype;
    _proto.onAfterClose = function onAfterClose() {
      this._fnResolve(this._shouldContinue);
      this._dialog.destroy();
    };
    _proto.onContinue = function onContinue() {
      this._shouldContinue = true;
      this._dialog.close();
    };
    _proto.open = async function open(owner) {
      owner.addDependent(this._dialog);
      this._dialog.open();
      return this._processingPromise;
    };
    _proto.getDialog = function getDialog() {
      return this._dialog;
    };
    _proto.createDialog = function createDialog() {
      var _this$entityType$anno, _this$entityType$anno2;
      return _jsx(Dialog, {
        state: "Warning",
        showHeader: true,
        contentWidth: "20rem",
        resizable: true,
        verticalScrolling: true,
        horizontalScrolling: true,
        class: "sapUiContentPadding",
        title: this.title,
        afterClose: this.onAfterClose.bind(this),
        children: {
          beginButton: _jsx(Button, {
            text: this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_CONTINUE_ANYWAY"),
            press: this.onContinue.bind(this),
            type: "Emphasized"
          }),
          endButton: _jsx(Button, {
            text: this.resourceModel.getText("C_COMMON_SAPFE_CLOSE"),
            press: () => this._dialog.close()
          }),
          content: _jsxs(_Fragment, {
            children: [_jsx(VBox, {
              children: _jsx(Text, {
                text: this.notApplicableContexts.length === 1 ? this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION") : this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION_PLURAL", [this.notApplicableContexts.length]),
                class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
              })
            }), _jsx(List, {
              headerText: (_this$entityType$anno = this.entityType.annotations.UI) === null || _this$entityType$anno === void 0 ? void 0 : (_this$entityType$anno2 = _this$entityType$anno.HeaderInfo) === null || _this$entityType$anno2 === void 0 ? void 0 : _this$entityType$anno2.TypeNamePlural,
              showSeparators: "None",
              children: {
                items: this.notApplicableContexts.map(notApplicableContext => {
                  // Either show the HeaderInfoName or the Semantic Key property
                  const titleExpression = getTitleExpression(this.entityType);
                  const customListItem = _jsx(CustomListItem, {
                    children: _jsx(HBox, {
                      justifyContent: "Start",
                      children: _jsx(Text, {
                        text: titleExpression,
                        class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
                      })
                    })
                  });
                  customListItem.setBindingContext(notApplicableContext);
                  return customListItem;
                })
              }
            })]
          })
        }
      });
    };
    return NotApplicableContextDialog;
  }();
  _exports = NotApplicableContextDialog;
  return _exports;
}, false);
