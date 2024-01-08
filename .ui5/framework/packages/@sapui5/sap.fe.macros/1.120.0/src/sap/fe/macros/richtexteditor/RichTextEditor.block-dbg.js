/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ClassSupport", "sap/m/FormattedText", "sap/m/VBox", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, BindingHelper, BindingToolkit, ClassSupport, FormattedText, VBox, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
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
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var constant = BindingToolkit.constant;
  var UI = BindingHelper.UI;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let RichTextEditorBlock = (
  /**
   * Building block that exposes the RichTextEditor UI5 control.
   *
   * It's used to enter formatted text, and uses the third-party component called TinyMCE.
   *
   * @public
   * @since 1.117.0
   */
  _dec = defineBuildingBlock({
    name: "RichTextEditor",
    namespace: "sap.fe.macros",
    libraries: ["sap/ui/richtexteditor"]
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "string",
    bindable: true
  }), _dec4 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec5 = blockAttribute({
    type: "array"
  }), _dec6 = blockAttribute({
    type: "boolean",
    bindable: true
  }), _dec7 = defineReference(), _dec8 = defineReference(), _dec9 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(RichTextEditorBlock, _RuntimeBuildingBlock);
    /**
     * ID of the editor
     */

    /**
     * The value contained in the editor. You can use this attribute to set a default value.
     *
     * @public
     */

    /**
     * Use the readOnly attribute to override the edit flow of the page.
     * By setting 'readOnly' to true, a FormattedText will be displayed instead of the editor.
     *
     * @public
     */

    /**
     * With the 'buttonGroups' attribute you can customize the buttons that are displayed on the toolbar of the editor.
     *
     * @public
     */

    /**
     * Use the 'required' attribute to make sure that the editor is filled with some text.
     *
     * @public
     */

    /**
     * Reference to the RichTextEditor
     */

    /**
     * Reference to the FormattedText
     */

    /**
     * Reference to the VBox
     */

    /**
     * Represents a RichTextEditor.
     *
     * @param properties Properties of this building block
     */
    function RichTextEditorBlock(properties) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, properties) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "value", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "buttonGroups", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "required", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "richTextEditor", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formattedText", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "bbContainer", _descriptor8, _assertThisInitialized(_this));
      _this.getRTE = () => {
        return _jsx(RichTextEditorBlock.RTEControl, {
          id: _this.id,
          ref: _this.richTextEditor,
          value: _this.value,
          visible: true,
          customToolbar: true,
          editable: true,
          editorType: "TinyMCE6",
          showGroupFontStyle: true,
          showGroupTextAlign: true,
          showGroupStructure: true,
          showGroupFont: false,
          showGroupClipboard: true,
          showGroupInsert: false,
          showGroupLink: false,
          showGroupUndo: false,
          sanitizeValue: true,
          wrapping: true,
          width: "100%",
          required: _this.required,
          ..._this.getButtonGroups()
        });
      };
      _this.getButtonGroups = () => {
        return _this.buttonGroups ? {
          buttonGroups: _this.buttonGroups.map(buttonGroup => {
            var _buttonGroup$buttons;
            return {
              name: buttonGroup.name ?? "",
              visible: buttonGroup.visible === "true",
              priority: parseInt(buttonGroup.priority || "", 10),
              customToolbarPriority: parseInt(buttonGroup.customToolbarPriority || "", 10),
              buttons: ((_buttonGroup$buttons = buttonGroup.buttons) === null || _buttonGroup$buttons === void 0 ? void 0 : _buttonGroup$buttons.split(",")) || []
            };
          })
        } : {};
      };
      _this.onFormattedTextModelContextChange = () => {
        if (_this.formattedText.current && _this.formattedText.current.getBinding("visible")) {
          var _this$formattedText$c, _this$formattedText$c2;
          (_this$formattedText$c = _this.formattedText.current.getBinding("visible")) === null || _this$formattedText$c === void 0 ? void 0 : _this$formattedText$c.detachChange(_this.toggleRTEAvailability);
          (_this$formattedText$c2 = _this.formattedText.current.getBinding("visible")) === null || _this$formattedText$c2 === void 0 ? void 0 : _this$formattedText$c2.attachChange(_this.toggleRTEAvailability);
        }
      };
      _this.toggleRTEAvailability = args => {
        var _args$getSource;
        // we need the reversed value of FormattedText visible property
        const displayEditor = !((_args$getSource = args.getSource()) !== null && _args$getSource !== void 0 && _args$getSource.getExternalValue());

        // we should always check if there's already a rte in the dom
        // so we don't render it twice
        if (displayEditor && !_this.richTextEditor.current) {
          var _this$bbContainer$cur;
          (_this$bbContainer$cur = _this.bbContainer.current) === null || _this$bbContainer$cur === void 0 ? void 0 : _this$bbContainer$cur.addItem(_this.getRTE());
        } else if (!displayEditor) {
          // we have to hide the editor before destroying it so we don't see the html
          // on the page for a split second when we change from edit to readOnly mode
          // timeout is needed so the editor has time to hide
          setTimeout(() => {
            var _this$richTextEditor$;
            // destroy the elements
            (_this$richTextEditor$ = _this.richTextEditor.current) === null || _this$richTextEditor$ === void 0 ? void 0 : _this$richTextEditor$.destroy();
            // clean the refs
            _this.richTextEditor.current = undefined;
          });
        }
      };
      return _this;
    }
    _exports = RichTextEditorBlock;
    RichTextEditorBlock.load = async function load() {
      await _RuntimeBuildingBlock.load.call(this);
      if (RichTextEditorBlock.RTEControl === undefined) {
        const {
          default: RTEControl
        } = await __ui5_require_async("sap/ui/richtexteditor/RichTextEditor");
        RichTextEditorBlock.RTEControl = RTEControl;
      }
      return this;
    }

    /**
     * Method that returns the RichTextEditor control.
     *
     * @returns RTEControl
     */;
    var _proto = RichTextEditorBlock.prototype;
    /**
     * Method that returns the content of the RichTextEditor building block.
     *
     * @returns The result of the building block rendering
     */
    _proto.getContent = function getContent() {
      const vboxEl = _jsx(VBox, {
        ref: this.bbContainer,
        width: "100%",
        height: "100%",
        children: _jsx(FormattedText, {
          ref: this.formattedText,
          htmlText: this.value,
          visible: or(this.readOnly, not(UI.IsEditable)),
          modelContextChange: this.onFormattedTextModelContextChange
        })
      });

      // FIXME: Workaround when the property change event doesn't get triggered
      setTimeout(() => {
        var _this$formattedText$c3;
        const isVisible = (_this$formattedText$c3 = this.formattedText.current) === null || _this$formattedText$c3 === void 0 ? void 0 : _this$formattedText$c3.getVisible();
        if (isVisible === true) {
          var _this$formattedText$c4, _this$formattedText$c5;
          (_this$formattedText$c4 = this.formattedText.current) === null || _this$formattedText$c4 === void 0 ? void 0 : (_this$formattedText$c5 = _this$formattedText$c4.getBinding("visible")) === null || _this$formattedText$c5 === void 0 ? void 0 : _this$formattedText$c5.fireEvent("change", {
            oSource: this.formattedText.current
          });
        }
      });
      return vboxEl;
    };
    return RichTextEditorBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(false);
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "buttonGroups", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(false);
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "richTextEditor", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "formattedText", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "bbContainer", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = RichTextEditorBlock;
  return _exports;
}, false);
