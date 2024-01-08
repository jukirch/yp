/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/helpers/BindingToolkit", "sap/fe/macros/field/FieldHelper"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, BindingToolkit, FieldHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ifElse = BindingToolkit.ifElse;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let PublicFieldBlock = (
  /**
   * Public external field representation
   */
  _dec = defineBuildingBlock({
    name: "Field",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.field.FieldAPI", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec5 = blockAttribute({
    type: "boolean",
    isPublic: true,
    required: false
  }), _dec6 = blockAttribute({
    type: "string",
    isPublic: true,
    required: false
  }), _dec7 = blockAttribute({
    type: "string",
    isPublic: true,
    required: false
  }), _dec8 = blockAttribute({
    type: "object",
    isPublic: true,
    validate: function (formatOptionsInput) {
      if (formatOptionsInput.displayMode && !["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput.displayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
      }
      if (formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput.measureDisplayMode)) {
        throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
      }
      if (formatOptionsInput.textExpandBehaviorDisplay && !["InPlace", "Popover"].includes(formatOptionsInput.textExpandBehaviorDisplay)) {
        throw new Error(`Allowed value ${formatOptionsInput.textExpandBehaviorDisplay} for textExpandBehaviorDisplay does not match`);
      }
      return formatOptionsInput;
    }
  }), _dec9 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(PublicFieldBlock, _BuildingBlockBase);
    /**
     * The 'id' property
     */

    /**
     * The meta path provided for the field
     */

    /**
     * The context path provided for the field
     */

    /**
     * The readOnly flag
     */

    /**
     * The semantic object associated to the field
     */

    /**
     * The edit mode expression for the field
     */

    /**
     * The object with the formatting options
     */

    /**
     * The generic change event
     */

    function PublicFieldBlock(props) {
      var _this;
      _this = _BuildingBlockBase.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "semanticObject", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "editModeExpression", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formatOptions", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "change", _descriptor8, _assertThisInitialized(_this));
      if (_this.readOnly !== undefined) {
        _this.editModeExpression = compileExpression(ifElse(equal(resolveBindingString(_this.readOnly, "boolean"), true), "Display", "Editable"));
      }
      return _this;
    }

    /**
     * Sets the internal formatOptions for the building block.
     *
     * @returns A string with the internal formatOptions for the building block
     */
    _exports = PublicFieldBlock;
    var _proto = PublicFieldBlock.prototype;
    _proto.getFormatOptions = function getFormatOptions() {
      return xml`
		<internalMacro:formatOptions
			textAlignMode="Form"
			showEmptyIndicator="true"
			displayMode="${this.formatOptions.displayMode}"
			measureDisplayMode="${this.formatOptions.measureDisplayMode}"
			textLinesEdit="${this.formatOptions.textLinesEdit}"
			textMaxLines="${this.formatOptions.textMaxLines}"
			textMaxCharactersDisplay="${this.formatOptions.textMaxCharactersDisplay}"
			textExpandBehaviorDisplay="${this.formatOptions.textExpandBehaviorDisplay}"
			textMaxLength="${this.formatOptions.textMaxLength}"
			>
			${this.writeDateFormatOptions()}
		</internalMacro:formatOptions>
			`;
    };
    _proto.writeDateFormatOptions = function writeDateFormatOptions() {
      if (this.formatOptions.showTime || this.formatOptions.showDate || this.formatOptions.showTimezone) {
        return xml`<internalMacro:dateFormatOptions showTime="${this.formatOptions.showTime}"
				showDate="${this.formatOptions.showDate}"
				showTimezone="${this.formatOptions.showTimezone}"
				/>`;
      }
      return "";
    }

    /**
     * The function calculates the corresponding ValueHelp field in case it´s
     * defined for the specific control.
     *
     * @returns An XML-based string with a possible ValueHelp control.
     */;
    _proto.getPossibleValueHelpTemplate = function getPossibleValueHelpTemplate() {
      const vhp = FieldHelper.valueHelpProperty(this.metaPath);
      const vhpCtx = this.metaPath.getModel().createBindingContext(vhp, this.metaPath);
      const hasValueHelpAnnotations = FieldHelper.hasValueHelpAnnotation(vhpCtx.getObject("@"));
      if (hasValueHelpAnnotations) {
        // depending on whether this one has a value help annotation included, add the dependent
        return xml`
			<internalMacro:dependents>
				<macros:ValueHelp _flexId="${this.id}-content_FieldValueHelp" property="${vhpCtx}" contextPath="${this.contextPath}" />
			</internalMacro:dependents>`;
      }
      return "";
    }

    /**
     * The building block template function.
     *
     * @returns An XML-based string with the definition of the field control
     */;
    _proto.getTemplate = function getTemplate() {
      const contextPathPath = this.contextPath.getPath();
      const metaPathPath = this.metaPath.getPath();
      return xml`
		<internalMacro:Field
			xmlns:internalMacro="sap.fe.macros.internal"
			entitySet="${contextPathPath}"
			dataField="${metaPathPath}"
			editMode="${this.editModeExpression}"
			onChange="${this.change}"
			_flexId="${this.id}"
			semanticObject="${this.semanticObject}"
		>
			${this.getFormatOptions()}
			${this.getPossibleValueHelpTemplate()}
		</internalMacro:Field>`;
    };
    return PublicFieldBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "semanticObject", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "editModeExpression", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = PublicFieldBlock;
  return _exports;
}, false);
