/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/strings/formatMessage", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/m/Button", "sap/m/ObjectMarker", "sap/m/Popover", "sap/m/Text", "sap/m/VBox", "sap/m/library", "sap/ui/core/Core", "sap/fe/core/jsx-runtime/jsx", "sap/fe/core/jsx-runtime/jsxs"], function (formatMessage, CommonUtils, BuildingBlockSupport, RuntimeBuildingBlock, MetaModelConverter, BindingHelper, BindingToolkit, Button, ObjectMarker, Popover, Text, VBox, library, Core, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;
  var _exports = {};
  var ObjectMarkerVisibility = library.ObjectMarkerVisibility;
  var ObjectMarkerType = library.ObjectMarkerType;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isEmpty = BindingToolkit.isEmpty;
  var ifElse = BindingToolkit.ifElse;
  var constant = BindingToolkit.constant;
  var and = BindingToolkit.and;
  var UI = BindingHelper.UI;
  var Entity = BindingHelper.Entity;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let DraftIndicatorBlock = (
  /**
   * Building block for creating a DraftIndicator based on the metadata provided by OData V4.
   *
   * Usage example:
   * <pre>
   * &lt;macro:DraftIndicator
   *   id="SomeID"
   * /&gt;
   * </pre>
   *
   * @private
   */
  _dec = defineBuildingBlock({
    name: "DraftIndicator",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string"
  }), _dec3 = blockAttribute({
    type: "string"
  }), _dec4 = blockAttribute({
    type: "string",
    validate: value => {
      if (value && ![ObjectMarkerVisibility.IconOnly, ObjectMarkerVisibility.IconAndText].includes(value)) {
        throw new Error(`Allowed value ${value} does not match`);
      }
    }
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty"]
  }), _dec6 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec7 = blockAttribute({
    type: "string"
  }), _dec8 = blockAttribute({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(DraftIndicatorBlock, _RuntimeBuildingBlock);
    function DraftIndicatorBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "draftIndicatorType", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entitySet", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isDraftIndicatorVisible", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "class", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "usedInTable", _descriptor7, _assertThisInitialized(_this));
      return _this;
    }
    _exports = DraftIndicatorBlock;
    /**
     * Runtime formatter function to format the correct text that displays the owner of a draft.
     *
     * This is used in case the DraftIndicator is shown for an active entity that has a draft of another user.
     *
     * @param hasDraftEntity
     * @param draftInProcessByUser
     * @param draftLastChangedByUser
     * @param draftInProcessByUserDesc
     * @param draftLastChangedByUserDesc
     * @returns Text to display
     */
    DraftIndicatorBlock.formatDraftOwnerTextInPopover = function formatDraftOwnerTextInPopover(hasDraftEntity, draftInProcessByUser, draftLastChangedByUser, draftInProcessByUserDesc, draftLastChangedByUserDesc) {
      const macroResourceBundle = Core.getLibraryResourceBundle("sap.fe.macros");
      if (hasDraftEntity) {
        const userDescription = draftInProcessByUserDesc || draftInProcessByUser || draftLastChangedByUserDesc || draftLastChangedByUser;
        if (!userDescription) {
          return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_UNKNOWN");
        } else {
          return draftInProcessByUser ? macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_LOCKED_BY_KNOWN", [userDescription]) : macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_KNOWN", [userDescription]);
        }
      } else {
        return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_NO_DATA_TEXT");
      }
    }

    /***
     * Gets the properties of the DraftAdministrativeData entity connected to the given entity set
     *
     * @returns List of property names
     */;
    var _proto = DraftIndicatorBlock.prototype;
    _proto.getDraftAdministrativeDataProperties = function getDraftAdministrativeDataProperties() {
      const draftAdministrativeDataContext = this.entitySet.getModel().createBindingContext("DraftAdministrativeData", this.entitySet);
      const convertedDraftAdministrativeData = convertMetaModelContext(draftAdministrativeDataContext);
      return convertedDraftAdministrativeData.targetType.entityProperties.map(property => property.name);
    }

    /**
     * Constructs the binding expression for the text displayed as title of the popup.
     *
     * @returns The binding expression
     */;
    _proto.getPopoverTitleBindingExpression = function getPopoverTitleBindingExpression() {
      return ifElse(not(Entity.IsActive), pathInModel("M_COMMON_DRAFT_OBJECT", "sap.fe.i18n"), ifElse(Entity.HasDraft, ifElse(not(isEmpty(pathInModel("DraftAdministrativeData/InProcessByUser"))), pathInModel("M_COMMON_DRAFT_LOCKED_OBJECT", "sap.fe.i18n"), pathInModel("M_DRAFT_POPOVER_ADMIN_UNSAVED_OBJECT", "sap.fe.i18n")), this.draftIndicatorType === ObjectMarkerVisibility.IconAndText ? " " : pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_FLAGGED_OBJECT", "sap.fe.i18n")));
    }

    /**
     * Constructs the binding expression for the text displayed to identify the draft owner in the popup.
     * This binding is configured to call formatDraftOwnerTextInPopover at runtime.
     *
     * We cannot reference formatDraftOwnerTextInPopover directly as we need to conditionally pass properties that might exist or not,
     * and referring to non-existing properties fails the binding.
     *
     * @returns The binding expression
     */;
    _proto.getDraftOwnerTextBindingExpression = function getDraftOwnerTextBindingExpression() {
      const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();
      const parts = [{
        path: "HasDraftEntity",
        targetType: "any"
      }, {
        path: "DraftAdministrativeData/InProcessByUser"
      }, {
        path: "DraftAdministrativeData/LastChangedByUser"
      }];
      if (draftAdministrativeDataProperties.includes("InProcessByUserDescription")) {
        parts.push({
          path: "DraftAdministrativeData/InProcessByUserDescription"
        });
      }
      if (draftAdministrativeDataProperties.includes("LastChangedByUserDescription")) {
        parts.push({
          path: "DraftAdministrativeData/LastChangedByUserDescription"
        });
      }

      //parts.push({path: "sap.fe.i18n>"})

      return {
        parts,
        formatter: DraftIndicatorBlock.formatDraftOwnerTextInPopover
      };
    }

    /**
     * Creates a popover control to display draft information.
     *
     * @param control Control that the popover is to be created for
     * @returns The created popover control
     */;
    _proto.createPopover = function createPopover(control) {
      const isDraftWithNoChangesBinding = and(not(Entity.IsActive), isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime")));
      const draftWithNoChangesTextBinding = this.draftIndicatorType === ObjectMarkerVisibility.IconAndText ? pathInModel("M_DRAFT_POPOVER_ADMIN_GENERIC_LOCKED_OBJECT_POPOVER_TEXT", "sap.fe.i18n") : pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_POPOVER_NO_DATA_TEXT", "sap.fe.i18n");
      const isDraftWithChangesBinding = and(not(Entity.IsActive), not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime"))));
      const draftWithChangesTextBinding = {
        parts: [{
          path: "M_DRAFT_POPOVER_ADMIN_LAST_CHANGE_TEXT",
          model: "sap.fe.i18n"
        }, {
          path: "DraftAdministrativeData/LastChangeDateTime"
        }],
        formatter: formatMessage
      };
      const isActiveInstanceBinding = and(Entity.IsActive, not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime"))));
      const activeInstanceTextBinding = {
        ...draftWithChangesTextBinding
      };
      const popover = _jsx(Popover, {
        title: this.getPopoverTitleBindingExpression(),
        showHeader: true,
        contentWidth: "15.625rem",
        verticalScrolling: false,
        class: "sapUiContentPadding",
        placement: "Auto",
        endButton: _jsx(Button, {
          icon: "sap-icon://decline",
          press: () => {
            var _this$draftPopover;
            return (_this$draftPopover = this.draftPopover) === null || _this$draftPopover === void 0 ? void 0 : _this$draftPopover.close();
          }
        }),
        children: _jsxs(VBox, {
          class: "sapUiContentPadding",
          children: [_jsx(VBox, {
            visible: isDraftWithNoChangesBinding,
            children: _jsx(Text, {
              text: draftWithNoChangesTextBinding
            })
          }), _jsx(VBox, {
            visible: isDraftWithChangesBinding,
            children: _jsx(Text, {
              text: draftWithChangesTextBinding
            })
          }), _jsxs(VBox, {
            visible: isActiveInstanceBinding,
            children: [_jsx(Text, {
              text: this.getDraftOwnerTextBindingExpression()
            }), _jsx(Text, {
              class: "sapUiSmallMarginTop",
              text: activeInstanceTextBinding
            })]
          })]
        })
      });
      CommonUtils.getTargetView(control).addDependent(popover);
      return popover;
    }

    /**
     * Handles pressing of the object marker by opening a corresponding popover.
     *
     * @param event Event object passed from the press event
     */;
    _proto.onObjectMarkerPressed = function onObjectMarkerPressed(event) {
      const source = event.getSource();
      const bindingContext = source.getBindingContext();
      this.draftPopover ??= this.createPopover(source);
      this.draftPopover.setBindingContext(bindingContext);
      this.draftPopover.openBy(source, false);
    }

    /**
     * Constructs the binding expression for the "additionalInfo" attribute in the "IconAndText" case.
     *
     * @returns The binding expression
     */;
    _proto.getIconAndTextAdditionalInfoBindingExpression = function getIconAndTextAdditionalInfoBindingExpression() {
      const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();
      const orBindings = [];
      if (draftAdministrativeDataProperties.includes("InProcessByUserDescription")) {
        orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUserDescription"));
      }
      orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUser"));
      if (draftAdministrativeDataProperties.includes("LastChangedByUserDescription")) {
        orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUserDescription"));
      }
      orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUser"));
      return ifElse(Entity.HasDraft, or(...orBindings), "");
    }

    /**
     * Returns the content of this building block for the "IconAndText" type.
     *
     * @returns The control tree
     */;
    _proto.getIconAndTextContent = function getIconAndTextContent() {
      const type = ifElse(not(Entity.IsActive), ObjectMarkerType.Draft, ifElse(Entity.HasDraft, ifElse(pathInModel("DraftAdministrativeData/InProcessByUser"), ObjectMarkerType.LockedBy, ifElse(pathInModel("DraftAdministrativeData/LastChangedByUser"), ObjectMarkerType.UnsavedBy, ObjectMarkerType.Unsaved)), ObjectMarkerType.Flagged));
      const visibility = ifElse(not(Entity.HasDraft), ObjectMarkerVisibility.TextOnly, ObjectMarkerVisibility.IconAndText);
      return _jsx(ObjectMarker, {
        type: type,
        press: this.onObjectMarkerPressed.bind(this),
        visibility: visibility,
        visible: this.isDraftIndicatorVisible,
        additionalInfo: this.getIconAndTextAdditionalInfoBindingExpression(),
        ariaLabelledBy: this.ariaLabelledBy ? [this.ariaLabelledBy] : [],
        class: this.class
      });
    }

    /**
     * Returns the content of this building block for the "IconOnly" type.
     *
     * @returns The control tree
     */;
    _proto.getIconOnlyContent = function getIconOnlyContent() {
      const type = ifElse(not(Entity.IsActive), ObjectMarkerType.Draft, ifElse(Entity.HasDraft, ifElse(pathInModel("DraftAdministrativeData/InProcessByUser"), ObjectMarkerType.Locked, ObjectMarkerType.Unsaved), ObjectMarkerType.Flagged));
      let visible;
      if (this.usedInTable === true) {
        visible = or(not(Entity.IsActive), and(Entity.IsActive, Entity.HasDraft));
      } else {
        // If Entity.HasDraft is empty, there is no context at all, so don't show the indicator
        visible = and(not(isEmpty(Entity.HasDraft)), not(UI.IsEditable), Entity.HasDraft, not(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe")));
      }
      return _jsx(ObjectMarker, {
        type: type,
        press: this.onObjectMarkerPressed.bind(this),
        visibility: ObjectMarkerVisibility.IconOnly,
        visible: visible,
        ariaLabelledBy: this.ariaLabelledBy ? [this.ariaLabelledBy] : [],
        class: this.class
      });
    }

    /**
     * Returns the content of this building block.
     *
     * @returns The control tree
     */;
    _proto.getContent = function getContent() {
      if (this.draftIndicatorType === ObjectMarkerVisibility.IconAndText) {
        return this.getIconAndTextContent();
      } else {
        return this.getIconOnlyContent();
      }
    };
    return DraftIndicatorBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "draftIndicatorType", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return ObjectMarkerVisibility.IconAndText;
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "entitySet", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isDraftIndicatorVisible", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(false);
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "class", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "usedInTable", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = DraftIndicatorBlock;
  return _exports;
}, false);
