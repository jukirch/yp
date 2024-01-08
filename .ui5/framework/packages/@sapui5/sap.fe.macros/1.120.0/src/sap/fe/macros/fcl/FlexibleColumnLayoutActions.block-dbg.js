/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor"], function (BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let FlexibleColumnLayoutActionsBlock = (
  /**
   * Building block for adding overflow toolbar buttons to integrate into the flexible column layout support from Fiori elements.
   *
   * Usage example:
   * <pre>
   * &lt;macro:FlexibleColumnLayoutActions /&gt;
   * </pre>
   *
   * @public
   * @since 1.93.0
   */
  _dec = defineBuildingBlock({
    name: "FlexibleColumnLayoutActions",
    namespace: "sap.fe.macros.fcl",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.m.OverflowToolbarButton"]
  }), _dec(_class = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(FlexibleColumnLayoutActionsBlock, _BuildingBlockBase);
    function FlexibleColumnLayoutActionsBlock() {
      return _BuildingBlockBase.apply(this, arguments) || this;
    }
    _exports = FlexibleColumnLayoutActionsBlock;
    var _proto = FlexibleColumnLayoutActionsBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      return xml`
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::FullScreen"
                type="Transparent"
                icon="{fclhelper>/actionButtonsInfo/switchIcon}"
                visible="{fclhelper>/actionButtonsInfo/switchVisible}"
                press="._routing.switchFullScreen()"
            />
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::Close"
                type="Transparent"
                icon="sap-icon://decline"
                tooltip="{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}"
                visible="{fclhelper>/actionButtonsInfo/closeVisible}"
                press="._routing.closeColumn()"
            />`;
    };
    return FlexibleColumnLayoutActionsBlock;
  }(BuildingBlockBase)) || _class);
  _exports = FlexibleColumnLayoutActionsBlock;
  return _exports;
}, false);
