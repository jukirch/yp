/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Button", "sap/m/Column", "sap/m/ColumnListItem", "sap/m/Dialog", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/m/Table", "sap/m/Text", "sap/ui/core/library", "../../formatters/ValueFormatter", "../../helpers/StandardRecommendationHelper", "sap/fe/core/jsx-runtime/jsx", "sap/fe/core/jsx-runtime/Fragment", "sap/fe/core/jsx-runtime/jsxs"], function (Log, BuildingBlockSupport, RuntimeBuildingBlock, ClassSupport, ResourceModelHelper, Button, Column, ColumnListItem, Dialog, FlexBox, FlexItemData, Table, Text, library, valueFormatters, StandardRecommendationHelper, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var standardRecommendationHelper = StandardRecommendationHelper.standardRecommendationHelper;
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
  let ConfirmRecommendationDialogBlock = (_dec = defineBuildingBlock({
    name: "ConfirmRecommendationDialog",
    namespace: "sap.fe.core.controllerextensions"
  }), _dec2 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(ConfirmRecommendationDialogBlock, _RuntimeBuildingBlock);
    function ConfirmRecommendationDialogBlock(props) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props) || this;
      _initializerDefineProperty(_this, "confirmRecommendationDialog", _descriptor, _assertThisInitialized(_this));
      _this.view = props.view;
      _this.confirmRecommendationDialogResourceModel = getResourceModel(_this.view);
      return _this;
    }
    _exports = ConfirmRecommendationDialogBlock;
    var _proto = ConfirmRecommendationDialogBlock.prototype;
    /**
     * Opens the confirm recommendations dialog.
     *
     * @param isSave Boolean flag which would be set to true if we are saving the document and would be false if we do apply changes
     * @returns Promise which would resolve with true if Accept,Ignore are pressed or when there are no recommendations and false when continue editing is pressed
     */
    _proto.open = async function open(isSave) {
      var _this$view, _this$acceptAllParams, _this$acceptAllParams2, _this$getColumnListIt;
      this.acceptAllParams = await ((_this$view = this.view) === null || _this$view === void 0 ? void 0 : _this$view.getController()).recommendations.fetchAcceptAllParams();
      if (!((_this$acceptAllParams = this.acceptAllParams) !== null && _this$acceptAllParams !== void 0 && (_this$acceptAllParams2 = _this$acceptAllParams.recommendationData) !== null && _this$acceptAllParams2 !== void 0 && _this$acceptAllParams2.length) || !((_this$getColumnListIt = this.getColumnListItems()) !== null && _this$getColumnListIt !== void 0 && _this$getColumnListIt.length)) {
        return true;
      }
      this.isSave = isSave;
      const dialog = this.getContent();
      dialog === null || dialog === void 0 ? void 0 : dialog.setEscapeHandler(this.onContinueEditing.bind(this));
      this.view.addDependent(dialog);
      dialog === null || dialog === void 0 ? void 0 : dialog.open();
      return new Promise((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;
      });
    }

    /**
     * Handler to close the confirmRecommendation dialog.
     *
     */;
    _proto.close = function close() {
      var _this$confirmRecommen, _this$confirmRecommen2;
      (_this$confirmRecommen = this.confirmRecommendationDialog.current) === null || _this$confirmRecommen === void 0 ? void 0 : _this$confirmRecommen.close();
      (_this$confirmRecommen2 = this.confirmRecommendationDialog.current) === null || _this$confirmRecommen2 === void 0 ? void 0 : _this$confirmRecommen2.destroy();
    }

    /**
     * Handler for Accept and Save button.
     */;
    _proto.onAcceptAndSave = async function onAcceptAndSave() {
      try {
        var _this$view2;
        const isAccepted = await ((_this$view2 = this.view) === null || _this$view2 === void 0 ? void 0 : _this$view2.getController()).recommendations.acceptRecommendations(this.acceptAllParams);
        if (!isAccepted) {
          this.promiseReject("Accept Failed");
        }
        this.promiseResolve(true);
      } catch {
        Log.error("Accept Recommendations Failed");
        this.promiseReject("Accept Failed");
      } finally {
        this.close();
      }
    }

    /**
     * Handler for Ignore and Save button.
     */;
    _proto.onIgnoreAndSave = function onIgnoreAndSave() {
      this.promiseResolve(true);
      this.close();
    }

    /**
     * Handler for Continue Editing button.
     */;
    _proto.onContinueEditing = function onContinueEditing() {
      this.promiseResolve(false);
      this.close();
    }

    /**
     * Fetches all the ColumnListItems.
     *
     * @returns Array of ColumnListItems
     */;
    _proto.getColumnListItems = function getColumnListItems() {
      const columnListItems = [];
      for (const recommendationData of ((_this$acceptAllParams3 = this.acceptAllParams) === null || _this$acceptAllParams3 === void 0 ? void 0 : _this$acceptAllParams3.recommendationData) || []) {
        var _this$acceptAllParams3;
        if (recommendationData.value || recommendationData.text) {
          var _recommendationData$c, _this$view3, _this$view3$getBindin;
          const targetPath = ((_recommendationData$c = recommendationData.context) === null || _recommendationData$c === void 0 ? void 0 : _recommendationData$c.getPath()) + "/" + recommendationData.propertyPath;
          columnListItems.push(this.getColumnListItem(recommendationData, this.getFieldName(targetPath), standardRecommendationHelper.getDisplayModeForTargetPath(targetPath, (_this$view3 = this.view) === null || _this$view3 === void 0 ? void 0 : (_this$view3$getBindin = _this$view3.getBindingContext()) === null || _this$view3$getBindin === void 0 ? void 0 : _this$view3$getBindin.getModel())));
        }
      }
      return columnListItems;
    }

    /**
     * Fetches a ColumnListItem.
     *
     * @param recommendation
     * @param fieldName
     * @param displayMode
     * @returns ColumnListItem
     */;
    _proto.getColumnListItem = function getColumnListItem(recommendation, fieldName, displayMode) {
      return _jsx(ColumnListItem, {
        vAlign: "Middle",
        children: {
          cells: _jsxs(_Fragment, {
            children: [_jsx(Text, {
              text: fieldName
            }), _jsx(Text, {
              text: this.getText(recommendation, displayMode)
            })]
          })
        }
      });
    }

    /**
     * Gets the label or name of the Field based on its property path.
     *
     * @param targetPath
     * @returns Returns the label of the Field.
     */;
    _proto.getFieldName = function getFieldName(targetPath) {
      var _this$view4, _this$view4$getBindin, _involvedDataModelObj, _involvedDataModelObj2, _involvedDataModelObj3;
      const involvedDataModelObject = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(targetPath, (_this$view4 = this.view) === null || _this$view4 === void 0 ? void 0 : (_this$view4$getBindin = _this$view4.getBindingContext()) === null || _this$view4$getBindin === void 0 ? void 0 : _this$view4$getBindin.getModel());
      return (involvedDataModelObject === null || involvedDataModelObject === void 0 ? void 0 : (_involvedDataModelObj = involvedDataModelObject.targetObject) === null || _involvedDataModelObj === void 0 ? void 0 : (_involvedDataModelObj2 = _involvedDataModelObj.annotations) === null || _involvedDataModelObj2 === void 0 ? void 0 : (_involvedDataModelObj3 = _involvedDataModelObj2.Common) === null || _involvedDataModelObj3 === void 0 ? void 0 : _involvedDataModelObj3.Label) || targetPath.split("/")[targetPath.split("/").length - 1];
    }
    /**
     * Fetches text for recommendation based on display mode.
     *
     * @param recommendation
     * @param displayMode
     * @returns Text for a recommendation
     */;
    _proto.getText = function getText(recommendation, displayMode) {
      if (recommendation.text && recommendation.value) {
        switch (displayMode) {
          case "Description":
            return recommendation.text;
          case "DescriptionValue":
            return valueFormatters.formatWithBrackets(recommendation.text, recommendation.value);
          case "ValueDescription":
            return valueFormatters.formatWithBrackets(recommendation.value, recommendation.text);
          case "Value":
            return recommendation.value;
        }
      }
      return recommendation.value || "";
    }

    /**
     * Fetches FlexBox as Content.
     *
     * @returns FlexBox
     */;
    _proto.getFlexBox = function getFlexBox() {
      return _jsx(FlexBox, {
        direction: "Column",
        alignItems: "Center",
        fitContainer: "true",
        children: {
          items: _jsxs(_Fragment, {
            children: [_jsx(Text, {
              text: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT", [this.getColumnListItems().length]),
              class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
            }), this.getTable(), this.getButton(this.isSave ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_SAVE") : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT"), "Emphasized", this.onAcceptAndSave.bind(this)), this.getButton(this.isSave ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_SAVE") : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE"), "Default", this.onIgnoreAndSave.bind(this)), this.getButton(this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_CONTINUE_EDITING"), "Transparent", this.onContinueEditing.bind(this))]
          })
        }
      });
    }

    /**
     * Returns Button with given text, type and pressHandler.
     *
     * @param text Text for the button
     * @param type Type of the button
     * @param pressHandler Press Handler for the button
     * @returns Button with given settings
     */;
    _proto.getButton = function getButton(text, type, pressHandler) {
      return _jsx(Button, {
        text: text,
        type: type,
        width: "100%",
        press: pressHandler,
        children: {
          layoutData: _jsx(_Fragment, {
            children: _jsx(FlexItemData, {
              minWidth: "100%"
            })
          })
        }
      });
    }

    /**
     * Returns Table to render list of acceptable recommendations.
     *
     * @returns Table
     */;
    _proto.getTable = function getTable() {
      return _jsx(Table, {
        children: {
          columns: _jsxs(_Fragment, {
            children: [_jsx(Column, {
              children: _jsx(Text, {
                text: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_FIELD")
              })
            }), ",", _jsx(Column, {
              children: _jsx(Text, {
                text: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_VALUE")
              })
            })]
          }),
          items: _jsx(_Fragment, {
            children: this.getColumnListItems()
          })
        }
      });
    }

    /**
     * The building block render function.
     *
     * @returns An XML-based string
     */;
    _proto.getContent = function getContent() {
      return _jsx(Dialog, {
        title: this.confirmRecommendationDialogResourceModel.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO"),
        state: ValueState.Information,
        type: "Message",
        ref: this.confirmRecommendationDialog,
        resizable: "true",
        contentWidth: "30rem",
        children: {
          content: _jsx(_Fragment, {
            children: this.getFlexBox()
          })
        }
      });
    };
    return ConfirmRecommendationDialogBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "confirmRecommendationDialog", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = ConfirmRecommendationDialogBlock;
  return _exports;
}, false);
