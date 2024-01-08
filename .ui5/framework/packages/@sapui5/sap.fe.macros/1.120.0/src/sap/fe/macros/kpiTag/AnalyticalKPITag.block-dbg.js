/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/formatters/KPIFormatter", "sap/fe/core/helpers/BindingToolkit"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, kpiFormatters, BindingToolkit) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var formatResult = BindingToolkit.formatResult;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let AnalyticalKPITagBlock = (
  /**
   * A building block used to display a KPI in the Analytical List Page
   *
   */
  _dec = defineBuildingBlock({
    name: "AnalyticalKPITag",
    namespace: "sap.fe.macros"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "string",
    required: true
  }), _dec5 = blockAttribute({
    type: "boolean",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(AnalyticalKPITagBlock, _BuildingBlockBase);
    function AnalyticalKPITagBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "kpiModelName", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "hasUnit", _descriptor4, _assertThisInitialized(_this));
      return _this;
    }
    _exports = AnalyticalKPITagBlock;
    var _proto = AnalyticalKPITagBlock.prototype;
    /**
     * Creates a binding expression for a specific property in the KPI model.
     *
     * @param propertyName This is the name of the property that finds the KPI data in the associated KPI model.
     * @returns A binding expression
     */
    _proto.getKpiPropertyExpression = function getKpiPropertyExpression(propertyName) {
      return pathInModel(`/${this.id}/manifest/sap.card/data/json/${propertyName}`, this.kpiModelName);
    }

    /**
     * Creates binding expressions for the KPITag's text and tooltip.
     *
     * @returns Object containing the binding expressions for the text and the tooltip
     */;
    _proto.getBindingExpressions = function getBindingExpressions() {
      const kpiTitle = this.metaPath.getProperty("Title");
      if (!kpiTitle) {
        return {
          text: undefined,
          tooltip: undefined
        };
      }
      const titleExpression = resolveBindingString(kpiTitle);
      return {
        text: formatResult([titleExpression], kpiFormatters.labelFormat),
        tooltip: formatResult([titleExpression, this.getKpiPropertyExpression("mainValueUnscaled"), this.getKpiPropertyExpression("mainUnit"), this.getKpiPropertyExpression("mainCriticality"), String(this.hasUnit)], kpiFormatters.tooltipFormat)
      };
    }

    /**
     * The template function of the building block.
     *
     * @returns An XML-based string
     */;
    _proto.getTemplate = function getTemplate() {
      const {
        text,
        tooltip
      } = this.getBindingExpressions();
      return xml`<macros:KPITag
			id="kpiTag-${this.id}"
			text="${text}"
			status="${this.getKpiPropertyExpression("mainCriticality")}"
			tooltip="${tooltip}"
			press=".kpiManagement.onKPIPressed(\${$source>},'${this.id}')"
			number="${this.getKpiPropertyExpression("mainValue")}"
			unit="${this.getKpiPropertyExpression("mainUnit")}"
		/>`;
    };
    return AnalyticalKPITagBlock;
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
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "kpiModelName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "hasUnit", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = AnalyticalKPITagBlock;
  return _exports;
}, false);
