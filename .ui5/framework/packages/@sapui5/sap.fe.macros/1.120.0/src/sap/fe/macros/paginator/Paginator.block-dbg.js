/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, BindingToolkit, StableIdHelper) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let PaginatorBlock = (
  /**
   * Building block used to create a paginator control.
   *
   * Usage example:
   * <pre>
   * &lt;macro:Paginator /&gt;
   * </pre>
   *
   * @hideconstructor
   * @public
   * @since 1.94.0
   */
  _dec = defineBuildingBlock({
    name: "Paginator",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.m.HBox"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(PaginatorBlock, _BuildingBlockBase);
    function PaginatorBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlockBase.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    _exports = PaginatorBlock;
    var _proto = PaginatorBlock.prototype;
    /**
     * The building block template function.
     *
     * @returns An XML-based string
     */
    _proto.getTemplate = function getTemplate() {
      // The model name is hardcoded, as this building block can also be used transparently by application developers
      const navUpEnabledExpression = pathInModel("/navUpEnabled", "paginator");
      const navDownEnabledExpression = pathInModel("/navDownEnabled", "paginator");
      const visibleExpression = or(navUpEnabledExpression, navDownEnabledExpression);
      const navUpTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_UP", "sap.fe.i18n");
      const navDownTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_DOWN", "sap.fe.i18n");
      return xml`
			<m:HBox displayInline="true" id="${this.id}" visible="${visibleExpression}">
				<uxap:ObjectPageHeaderActionButton
					xmlns:uxap="sap.uxap"
					id="${generate([this.id, "previousItem"])}"
					enabled="${navUpEnabledExpression}"
					tooltip="${navUpTooltipExpression}"
					icon="sap-icon://navigation-up-arrow"
					press=".paginator.updateCurrentContext(-1)"
					type="Transparent"
					importance="High"
				/>
				<uxap:ObjectPageHeaderActionButton
					xmlns:uxap="sap.uxap"
					id="${generate([this.id, "nextItem"])}"
					enabled="${navDownEnabledExpression}"
					tooltip="${navDownTooltipExpression}"
					icon="sap-icon://navigation-down-arrow"
					press=".paginator.updateCurrentContext(1)"
					type="Transparent"
					importance="High"
				/>
			</m:HBox>`;
    };
    return PaginatorBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  })), _class2)) || _class);
  _exports = PaginatorBlock;
  return _exports;
}, false);
