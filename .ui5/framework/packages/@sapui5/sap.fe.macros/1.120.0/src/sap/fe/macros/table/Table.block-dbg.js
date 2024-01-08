/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlockBase", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/internal/helpers/TableTemplating", "sap/ui/core/library", "../CommonHelper", "../MacroAPI", "../internal/helpers/ActionHelper", "./ActionsTemplating", "./TableHelper"], function (Log, CommonUtils, BuildingBlockBase, BuildingBlockSupport, BuildingBlockTemplateProcessor, ManifestSettings, MetaModelConverter, DataField, DataVisualization, StandardActions, BindingHelper, BindingToolkit, ModelHelper, StableIdHelper, TypeGuards, DataModelPathHelper, TableTemplating, library, CommonHelper, MacroAPI, ActionHelper, ActionsTemplating, TableHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _descriptor41, _descriptor42, _descriptor43, _descriptor44, _descriptor45, _descriptor46, _descriptor47, _descriptor48, _descriptor49, _descriptor50, _descriptor51, _descriptor52, _descriptor53, _descriptor54, _descriptor55, _descriptor56, _descriptor57, _descriptor58, _descriptor59, _descriptor60, _descriptor61, _descriptor62, _descriptor63, _descriptor64, _descriptor65, _descriptor66;
  var _exports = {};
  var getTableActionTemplate = ActionsTemplating.getTableActionTemplate;
  var TitleLevel = library.TitleLevel;
  var buildExpressionForHeaderVisible = TableTemplating.buildExpressionForHeaderVisible;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var getPathRelativeLocation = DataModelPathHelper.getPathRelativeLocation;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isSingleton = TypeGuards.isSingleton;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var generate = StableIdHelper.generate;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var fn = BindingToolkit.fn;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var getVisualizationsFromPresentationVariant = DataVisualization.getVisualizationsFromPresentationVariant;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var CreationMode = ManifestSettings.CreationMode;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const setCustomActionProperties = function (childAction) {
    var _act$getAttribute;
    let menuContentActions = null;
    const act = childAction;
    let menuActions = [];
    const actionKey = (_act$getAttribute = act.getAttribute("key")) === null || _act$getAttribute === void 0 ? void 0 : _act$getAttribute.replace("InlineXML_", "");
    // For the actionGroup we authorize the both entries <sap.fe.macros:ActionGroup> (compliant with old FPM examples) and <sap.fe.macros.table:ActionGroup>
    if (act.children.length && act.localName === "ActionGroup" && act.namespaceURI && ["sap.fe.macros", "sap.fe.macros.table"].includes(act.namespaceURI)) {
      const actionsToAdd = Array.prototype.slice.apply(act.children);
      let actionIdx = 0;
      menuContentActions = actionsToAdd.reduce((acc, actToAdd) => {
        var _actToAdd$getAttribut;
        const actionKeyAdd = ((_actToAdd$getAttribut = actToAdd.getAttribute("key")) === null || _actToAdd$getAttribut === void 0 ? void 0 : _actToAdd$getAttribut.replace("InlineXML_", "")) || actionKey + "_Menu_" + actionIdx;
        const curOutObject = {
          key: actionKeyAdd,
          text: actToAdd.getAttribute("text"),
          __noWrap: true,
          press: actToAdd.getAttribute("press"),
          requiresSelection: actToAdd.getAttribute("requiresSelection") === "true",
          enabled: actToAdd.getAttribute("enabled") === null ? true : actToAdd.getAttribute("enabled")
        };
        acc[curOutObject.key] = curOutObject;
        actionIdx++;
        return acc;
      }, {});
      menuActions = Object.values(menuContentActions).slice(-act.children.length).map(function (menuItem) {
        return menuItem.key;
      });
    }
    return {
      key: actionKey,
      text: act.getAttribute("text"),
      position: {
        placement: act.getAttribute("placement"),
        anchor: act.getAttribute("anchor")
      },
      __noWrap: true,
      press: act.getAttribute("press"),
      requiresSelection: act.getAttribute("requiresSelection") === "true",
      enabled: act.getAttribute("enabled") === null ? true : act.getAttribute("enabled"),
      menu: menuActions.length ? menuActions : null,
      menuContentActions: menuContentActions
    };
  };
  const setCustomColumnProperties = function (childColumn, aggregationObject) {
    var _childColumn$children, _childColumn$getAttri;
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    childColumn.setAttribute("key", aggregationObject.key);
    return {
      // Defaults are to be defined in Table.ts
      key: aggregationObject.key,
      type: "Slot",
      width: childColumn.getAttribute("width"),
      widthIncludingColumnHeader: childColumn.getAttribute("widthIncludingColumnHeader") ? childColumn.getAttribute("widthIncludingColumnHeader") === "true" : undefined,
      importance: childColumn.getAttribute("importance"),
      horizontalAlign: childColumn.getAttribute("horizontalAlign"),
      availability: childColumn.getAttribute("availability") || "Default",
      header: childColumn.getAttribute("header"),
      template: ((_childColumn$children = childColumn.children[0]) === null || _childColumn$children === void 0 ? void 0 : _childColumn$children.outerHTML) || "",
      properties: childColumn.getAttribute("properties") ? (_childColumn$getAttri = childColumn.getAttribute("properties")) === null || _childColumn$getAttri === void 0 ? void 0 : _childColumn$getAttri.split(",") : undefined,
      position: {
        placement: childColumn.getAttribute("placement") || childColumn.getAttribute("positionPlacement"),
        //positionPlacement is kept for backwards compatibility
        anchor: childColumn.getAttribute("anchor") || childColumn.getAttribute("positionAnchor") //positionAnchor is kept for backwards compatibility
      },

      required: childColumn.getAttribute("required")
    };
  };
  let TableBlock = (_dec = defineBuildingBlock({
    name: "Table",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.table.TableAPI"]
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec5 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "number",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "string"
  }), _dec10 = blockAttribute({
    type: "number"
  }), _dec11 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec12 = blockAttribute({
    type: "boolean",
    isPublic: false
  }), _dec13 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec14 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec15 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec16 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec17 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec18 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec19 = blockAttribute({
    type: "string|boolean",
    isPublic: true
  }), _dec20 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec21 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec22 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec23 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec24 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec25 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: false,
    required: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "Singleton"]
  }), _dec26 = blockAttribute({
    type: "string"
  }), _dec27 = blockAttribute({
    type: "boolean"
  }), _dec28 = blockAttribute({
    type: "string"
  }), _dec29 = blockAttribute({
    type: "string"
  }), _dec30 = blockAttribute({
    type: "string"
  }), _dec31 = blockAttribute({
    type: "string"
  }), _dec32 = blockAttribute({
    type: "string"
  }), _dec33 = blockAttribute({
    type: "boolean"
  }), _dec34 = blockAttribute({
    type: "boolean"
  }), _dec35 = blockAttribute({
    type: "boolean"
  }), _dec36 = blockAttribute({
    type: "string"
  }), _dec37 = blockAttribute({
    type: "string"
  }), _dec38 = blockAttribute({
    type: "number"
  }), _dec39 = blockAttribute({
    type: "boolean"
  }), _dec40 = blockAttribute({
    type: "boolean"
  }), _dec41 = blockAttribute({
    type: "boolean"
  }), _dec42 = blockAttribute({
    type: "string"
  }), _dec43 = blockAttribute({
    type: "string"
  }), _dec44 = blockAttribute({
    type: "string"
  }), _dec45 = blockAttribute({
    type: "string"
  }), _dec46 = blockAttribute({
    type: "string"
  }), _dec47 = blockAttribute({
    type: "string"
  }), _dec48 = blockAttribute({
    type: "boolean"
  }), _dec49 = blockAttribute({
    type: "boolean"
  }), _dec50 = blockAttribute({
    type: "number"
  }), _dec51 = blockAttribute({
    type: "string"
  }), _dec52 = blockAttribute({
    type: "object",
    isPublic: true
  }), _dec53 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec54 = blockAttribute({
    type: "string"
  }), _dec55 = blockAttribute({
    type: "string"
  }), _dec56 = blockAttribute({
    type: "boolean"
  }), _dec57 = blockAttribute({
    type: "object",
    isPublic: true,
    validate: function (creationOptionsInput) {
      if (creationOptionsInput.name && !["NewPage", "Inline", "InlineCreationRows", "External"].includes(creationOptionsInput.name)) {
        throw new Error(`Allowed value ${creationOptionsInput.name} for creationMode does not match`);
      }
      return creationOptionsInput;
    }
  }), _dec58 = blockAggregation({
    type: "sap.fe.macros.internal.table.Action | sap.fe.macros.internal.table.ActionGroup",
    isPublic: true,
    processAggregations: setCustomActionProperties
  }), _dec59 = blockAggregation({
    type: "sap.fe.macros.internal.table.Column",
    isPublic: true,
    hasVirtualNode: true,
    processAggregations: setCustomColumnProperties
  }), _dec60 = blockEvent(), _dec61 = blockEvent(), _dec62 = blockEvent(), _dec63 = blockEvent(), _dec64 = blockEvent(), _dec65 = blockEvent(), _dec66 = blockEvent(), _dec67 = blockEvent(), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockBase) {
    _inheritsLoose(TableBlock, _BuildingBlockBase);
    //  *************** Public & Required Attributes ********************

    //  *************** Public Attributes ********************
    /**
     *The `busy` mode of table
     */

    /**
     * Parameter used to show the fullScreen button on the table.
     */

    /**
     * Enable export to file
     */

    /**
     * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
     */

    /**
     * Indicates if the column header should be part of the width calculation.
     */

    /**
     * Mode of rows to be displayed in the table. Values: ["Auto", "Fixed"]
     */

    /**
     * Number of rows to be displayed in the table.
     */

    /**
     * Paste button enablement
     */

    /**
     * visibility of the Paste Button
     */

    /**
     * The control ID of the FilterBar that is used to filter the rows of the table.
     */

    /**
     * Specifies header text that is shown in table.
     */

    /**
     * Defines the "aria-level" of the table header
     */

    /**
     * Controls if the header text should be shown or not
     */

    /**
     * Personalization Mode
     */

    /**
     * Specifies whether the table should be read-only or not.
     */

    /**
     * Allows to choose the Table type. Allowed values are `ResponsiveTable` or `GridTable`.
     */

    /**
     * Specifies whether the table is displayed with condensed layout (true/false). The default setting is `false`.
     */

    /**
     * Specifies the selection mode (None,Single,Multi,Auto,ForceMulti,ForceSingle)
     */

    //  *************** Private & Required Attributes ********************

    //  *************** Private Attributes ********************

    /**
     * Specifies the full path and function name of a custom validation function.
     */

    /**
     * Specifies whether the button is hidden when no data has been entered yet in the row (true/false). The default setting is `false`.
     */

    /**
     * The control ID of the FilterBar that is used internally to filter the rows of the table.
     */

    /**
     * ONLY FOR RESPONSIVE TABLE: Setting to define the checkbox in the column header: Allowed values are `Default` or `ClearAll`. If set to `Default`, the sap.m.Table control renders the Select All checkbox, otherwise the Deselect All button is rendered.
     */

    /**
     * Used for binding the table to a navigation path. Only the path is used for binding rows.
     */

    /**
     * Parameter which sets the noDataText for the mdc table
     */

    /**
     * Specifies the possible actions available on the table row (Navigation,null). The default setting is `undefined`
     */

    /**
     * ONLY FOR GRID TABLE: Number of indices which can be selected in a range. If set to 0, the selection limit is disabled, and the Select All checkbox appears instead of the Deselect All button.
     */

    // We require tableDefinition to be there even though it is not formally required

    /**
     * The object with the formatting options
     */

    /**
     * Event handler to react when the user chooses a row
     */

    /**
     * Event handler to react to the contextChange event of the table.
     */

    /**
     *  Event handler for change event.
     */

    /**
     * Event handler called when the user chooses an option of the segmented button in the ALP View
     */

    /**
     * Event handler to react to the stateChange event of the table.
     */

    /**
     * Event handler to react when the table selection changes
     */

    function TableBlock(props, controlConfiguration, settings) {
      var _this$contextPath, _this$tableDefinition2, _this$tableDefinition3, _this$tableDefinition4;
      var _this;
      _this = _BuildingBlockBase.call(this, props, controlConfiguration, settings) || this;
      _initializerDefineProperty(_this, "metaPath", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "busy", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableFullScreen", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableExport", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "frozenColumnCount", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowCountMode", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowCount", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enablePaste", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "pasteVisible", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBar", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "header", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerLevel", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerVisible", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "id", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isSearchable", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "personalization", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "type", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useCondensedLayout", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionMode", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantManagement", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "collection", _descriptor24, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "_apiId", _descriptor25, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "autoBindOnInit", _descriptor26, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "columnEditMode", _descriptor27, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "createNewAction", _descriptor28, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "createOutbound", _descriptor29, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "customValidationFunction", _descriptor30, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataStateIndicatorFilter", _descriptor31, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "disableAddRowButtonForEmptyData", _descriptor32, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableAutoColumnWidth", _descriptor33, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableAutoScroll", _descriptor34, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "fieldMode", _descriptor35, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBarId", _descriptor36, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "inlineCreationRowCount", _descriptor37, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isAlp", _descriptor38, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isCompactType", _descriptor39, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isOptimizedForSmallDevice", _descriptor40, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "multiSelectMode", _descriptor41, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "navigationPath", _descriptor42, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "noDataText", _descriptor43, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowAction", _descriptor44, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tableType", _descriptor45, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "updatablePropertyPath", _descriptor46, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useBasicSearch", _descriptor47, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "searchable", _descriptor48, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionLimit", _descriptor49, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showCreate", _descriptor50, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tableDefinition", _descriptor51, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tableDefinitionContext", _descriptor52, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tableDelegate", _descriptor53, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tabTitle", _descriptor54, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor55, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "creationMode", _descriptor56, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actions", _descriptor57, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "columns", _descriptor58, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowPress", _descriptor59, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onContextChange", _descriptor60, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onChange", _descriptor61, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onSegmentedButtonPressed", _descriptor62, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantSaved", _descriptor63, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor64, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionChange", _descriptor65, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantSelected", _descriptor66, _assertThisInitialized(_this));
      _this.getTableType = () => {
        const collection = _this.collection.getObject();
        switch (_this.tableType) {
          case "GridTable":
            return xml`<mdcTable:GridTableType
                rowCountMode="${_this.tableDefinition.control.rowCountMode}"
                rowCount="${_this.tableDefinition.control.rowCount}"
                selectionLimit="${_this.selectionLimit}"
				fixedColumnCount="${_this.tableDefinition.control.frozenColumnCount}"
            />`;
          case "TreeTable":
            return xml`<mdcTable:TreeTableType
                rowCountMode="${_this.tableDefinition.control.rowCountMode}"
                rowCount="${_this.tableDefinition.control.rowCount}"
				fixedColumnCount="${_this.tableDefinition.control.frozenColumnCount}"
            />`;
          default:
            const growingMode = collection.$kind === "EntitySet" ? "Scroll" : undefined;
            return xml`<mdcTable:ResponsiveTableType
                showDetailsButton="true"
                detailsButtonSetting="{=['Low', 'Medium', 'None']}"
                growingMode="${growingMode}"
            />`;
        }
      };
      _this.getDependents = () => {
        var _this$tableDefinition;
        let dependents = ``;
        const cutAction = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Cut);
        if ((cutAction === null || cutAction === void 0 ? void 0 : cutAction.isTemplated) === "true") {
          dependents += xml`<control:CommandExecution
			execute="API.onCut"
			command="Cut"
			enabled="${cutAction.enabled}"
			/>`;
        }
        const pasteAction = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Paste);
        if ((pasteAction === null || pasteAction === void 0 ? void 0 : pasteAction.visible) !== "false" && _this.tableType === "TreeTable") dependents += xml`<control:CommandExecution
			execute="API.onPaste"
			command="Paste"
			enabled="${pasteAction === null || pasteAction === void 0 ? void 0 : pasteAction.enabled}"
			/>`;
        if (!_this.readOnly && (_this$tableDefinition = _this.tableDefinition) !== null && _this$tableDefinition !== void 0 && _this$tableDefinition.columns) {
          for (const column of _this.tableDefinition.columns) {
            if (column.availability === "Default" && "annotationPath" in column) {
              dependents += _this.getValueHelp(column);
            }
          }
        }
        const createAction = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create);
        const deleteAction = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Delete);
        if (_this.tableDefinition.annotation.isInsertUpdateActionsTemplated && (createAction === null || createAction === void 0 ? void 0 : createAction.isTemplated) === "true" && _this.tableDefinition.control.nodeType === undefined) {
          // The shortcut is not enabled in case of a create menu (i.e. when nodeType is defined)
          dependents += xml`<control:CommandExecution
                                execute="${TableHelper.pressEventForCreateButton(_assertThisInitialized(_this), true)}"
                                visible="${createAction.visible}"
                                enabled="${createAction.enabled}"
                                command="Create"
                            />`;
        }
        if ((deleteAction === null || deleteAction === void 0 ? void 0 : deleteAction.isTemplated) === "true") {
          var _ref, _ref$annotations, _ref$annotations$UI, _this$collectionEntit, _this$collectionEntit2;
          const headerInfo = (_ref = ((_this$collectionEntit = _this.collectionEntity) === null || _this$collectionEntit === void 0 ? void 0 : _this$collectionEntit.entityType) || ((_this$collectionEntit2 = _this.collectionEntity) === null || _this$collectionEntit2 === void 0 ? void 0 : _this$collectionEntit2.targetType)) === null || _ref === void 0 ? void 0 : (_ref$annotations = _ref.annotations) === null || _ref$annotations === void 0 ? void 0 : (_ref$annotations$UI = _ref$annotations.UI) === null || _ref$annotations$UI === void 0 ? void 0 : _ref$annotations$UI.HeaderInfo;
          dependents += xml`<control:CommandExecution
                        execute="${TableHelper.pressEventForDeleteButton(_assertThisInitialized(_this), _this.collectionEntity.name, headerInfo, _this.contextObjectPath)}"
                        visible="${deleteAction.visible}"
                        enabled="${deleteAction.enabled}"
                        command="DeleteEntry"
                        />`;
        }
        for (const actionName in _this.tableDefinition.commandActions) {
          const action = _this.tableDefinition.commandActions[actionName];
          dependents += `${_this.getActionCommand(actionName, action)}`;
        }
        dependents += `<control:CommandExecution execute="TableRuntime.displayTableSettings" command="TableSettings" />`;
        if (_this.variantManagement === "None") {
          dependents += `<!-- Persistence provider offers persisting personalization changes without variant management -->
			<p13n:PersistenceProvider id="${generate([_this.id, "PersistenceProvider"])}" for="${_this.id}" />`;
        }
        if (_this.tableType && ["GridTable", "TreeTable"].includes(_this.tableType)) {
          dependents += xml`<plugins:CellSelector enabled="${compileExpression(or(_this.tableType !== "TreeTable", not(_this.getDragAndDropEnabled())))}" rangeLimit= "200"/>`;
        }
        return xml`${dependents}`;
      };
      _this.getActions = () => {
        let dependents = "";
        if (_this.onSegmentedButtonPressed) {
          dependents = `<mdcat:ActionToolbarAction
            layoutInformation="{
                    aggregationName: 'end',
                    alignment: 'End'
                }"
            visible="{= \${pageInternal>alpContentView} === 'Table' }"
        >
            <SegmentedButton
                id="${generate([_this.id, "SegmentedButton", "TemplateContentView"])}"
                select="${_this.onSegmentedButtonPressed}"
                selectedKey="{pageInternal>alpContentView}"
            >
                <items>`;
          if (CommonHelper.isDesktop()) {
            dependents += `<SegmentedButtonItem
                            tooltip="{sap.fe.i18n>M_COMMON_HYBRID_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
							key = "Hybrid"
							icon = "sap-icon://chart-table-view"
							/>`;
          }
          dependents += `<SegmentedButtonItem
                        tooltip="{sap.fe.i18n>M_COMMON_CHART_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
                        key="Chart"
                        icon="sap-icon://bar-chart"
                    />
                    <SegmentedButtonItem
                        tooltip="{sap.fe.i18n>M_COMMON_TABLE_SEGMENTED_BUTTON_ITEM_TOOLTIP}"
                        key="Table"
                        icon="sap-icon://table-view"
                    />
                </items>
            </SegmentedButton>
        </mdcat:ActionToolbarAction>`;
        }
        dependents += `${getTableActionTemplate(_assertThisInitialized(_this))}`;
        return xml`${dependents}`;
      };
      const contextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
      _this.contextObjectPath = contextObjectPath;
      const pageContext = settings.bindingContexts.converterContext;
      _this.pageTemplateType = pageContext === null || pageContext === void 0 ? void 0 : pageContext.getObject("/templateType");
      const tableDefinition = TableBlock.setUpTableDefinition(_assertThisInitialized(_this), settings);
      _this.collection = settings.models.metaModel.createBindingContext(tableDefinition.annotation.collection);
      _this.convertedMetaData = _this.contextObjectPath.convertedTypes;
      _this.collectionEntity = _this.convertedMetaData.resolvePath(_this.tableDefinition.annotation.collection).target;
      _this.setUpId();
      const converterContext = _this.getConverterContext(_this.contextObjectPath, (_this$contextPath = _this.contextPath) === null || _this$contextPath === void 0 ? void 0 : _this$contextPath.getPath(), settings);
      _this._collectionIsDraftEnabled = converterContext.getManifestWrapper().isFilterBarHidden() && ModelHelper.isDraftNode(_this.collectionEntity) || ModelHelper.isDraftRoot(_this.collectionEntity);
      _this.selectionMode = _this.tableDefinition.annotation.selectionMode;
      _this.enableFullScreen = _this.tableDefinition.control.enableFullScreen;
      _this.enableExport = _this.tableDefinition.control.enableExport;
      const _pasteAction = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Paste);
      _this.enablePaste = _pasteAction === null || _pasteAction === void 0 ? void 0 : _pasteAction.enabled;
      _this.pasteVisible = _pasteAction === null || _pasteAction === void 0 ? void 0 : _pasteAction.visible;
      _this.frozenColumnCount = _this.tableDefinition.control.frozenColumnCount;
      _this.widthIncludingColumnHeader = _this.tableDefinition.control.widthIncludingColumnHeader;
      _this.rowCountMode = _this.tableDefinition.control.rowCountMode;
      _this.rowCount = _this.tableDefinition.control.rowCount;
      _this.updatablePropertyPath = _this.tableDefinition.annotation.updatablePropertyPath;
      _this.type = _this.tableDefinition.control.type;
      _this.disableAddRowButtonForEmptyData ??= _this.tableDefinition.control.disableAddRowButtonForEmptyData;
      _this.customValidationFunction ??= _this.tableDefinition.control.customValidationFunction;
      _this.headerVisible ??= _this.tableDefinition.control.headerVisible;
      _this.searchable ??= _this.tableDefinition.annotation.searchable;
      _this.inlineCreationRowCount ??= _this.tableDefinition.control.inlineCreationRowCount;
      _this.header ??= _this.tableDefinition.annotation.title;
      _this.selectionLimit ??= _this.tableDefinition.control.selectionLimit;
      _this.isCompactType ??= _this.tableDefinition.control.isCompactType;
      _this.creationMode.name ??= _this.tableDefinition.annotation.create.mode;
      _this.creationMode.createAtEnd ??= _this.tableDefinition.annotation.create.append;
      _this.createOutbound ??= _this.tableDefinition.annotation.create.outbound;
      _this.createNewAction ??= _this.tableDefinition.annotation.create.newAction;
      _this.createOutboundDetail ??= _this.tableDefinition.annotation.create.outboundDetail;
      _this.personalization ??= _this.tableDefinition.annotation.p13nMode;
      _this.variantManagement ??= _this.tableDefinition.annotation.variantManagement;
      _this.enableAutoColumnWidth ??= true;
      _this.dataStateIndicatorFilter ??= _this.tableDefinition.control.dataStateIndicatorFilter;
      _this.isOptimizedForSmallDevice ??= CommonUtils.isSmallDevice();
      _this.navigationPath = tableDefinition.annotation.navigationPath;
      if (tableDefinition.annotation.collection.startsWith("/") && isSingleton(contextObjectPath.startingEntitySet)) {
        tableDefinition.annotation.collection = _this.navigationPath;
      }
      _this.setReadOnly();
      if (_this.rowPress) {
        _this.rowAction = "Navigation";
      }
      _this.rowPress ??= (_this$tableDefinition2 = _this.tableDefinition.annotation.row) === null || _this$tableDefinition2 === void 0 ? void 0 : _this$tableDefinition2.press;
      _this.rowAction ??= (_this$tableDefinition3 = _this.tableDefinition.annotation.row) === null || _this$tableDefinition3 === void 0 ? void 0 : _this$tableDefinition3.action;
      _this.selectionChange ??= _this.buildEventHandlerWrapper(_this.tableDefinition.control.selectionChange);
      if (_this.personalization === "false") {
        _this.personalization = undefined;
      } else if (_this.personalization === "true") {
        _this.personalization = "Sort,Column,Filter";
      }
      switch (_this.personalization) {
        case "false":
          _this.personalization = undefined;
          break;
        case "true":
          _this.personalization = "Sort,Column,Filter";
          break;
        default:
      }
      if (_this.isSearchable === false) {
        _this.searchable = false;
      } else {
        _this.searchable = _this.tableDefinition.annotation.searchable;
      }

      // Auto bind on init if there's no filterbar (basic search doesn't count, that's why we calculate autoBindOnInit before setting filterBarID for basic search below)
      _this.autoBindOnInit = !_this.filterBar && !_this.filterBarId;
      let useBasicSearch = false;

      // Note for the 'filterBar' property:
      // 1. ID relative to the view of the Table.
      // 2. Absolute ID.
      // 3. ID would be considered in association to TableAPI's ID.
      if (!_this.filterBar && !_this.filterBarId && _this.searchable) {
        // filterBar: Public property for building blocks
        // filterBarId: Only used as Internal private property for FE templates
        _this.filterBarId = generate([_this.id, "StandardAction", "BasicSearch"]);
        useBasicSearch = true;
      }
      // Internal properties
      _this.useBasicSearch = useBasicSearch;
      _this.tableType = _this.type;
      _this.showCreate = ((_this$tableDefinition4 = _this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create)) === null || _this$tableDefinition4 === void 0 ? void 0 : _this$tableDefinition4.visible) || true;
      switch (_this.readOnly) {
        case true:
          _this.columnEditMode = "Display";
          break;
        case false:
          _this.columnEditMode = "Editable";
          break;
        default:
          _this.columnEditMode = undefined;
      }
      return _this;
    }

    /**
     * Returns the annotation path pointing to the visualization annotation (LineItem).
     *
     * @param contextObjectPath The datamodel object path for the table
     * @param converterContext The converter context
     * @returns The annotation path
     */
    _exports = TableBlock;
    TableBlock.getVisualizationPath = function getVisualizationPath(contextObjectPath, converterContext) {
      const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

      // fallback to default LineItem if metapath is not set
      if (!metaPath) {
        Log.error(`Missing meta path parameter for LineItem`);
        return `@${"com.sap.vocabularies.UI.v1.LineItem"}`;
      }
      if (contextObjectPath.targetObject.term === "com.sap.vocabularies.UI.v1.LineItem") {
        return metaPath; // MetaPath is already pointing to a LineItem
      }
      //Need to switch to the context related the PV or SPV
      const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);
      let visualizations = [];
      switch (contextObjectPath.targetObject.term) {
        case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
          if (contextObjectPath.targetObject.PresentationVariant) {
            visualizations = getVisualizationsFromPresentationVariant(contextObjectPath.targetObject.PresentationVariant, metaPath, resolvedTarget.converterContext, true);
          }
          break;
        case "com.sap.vocabularies.UI.v1.PresentationVariant":
          visualizations = getVisualizationsFromPresentationVariant(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
          break;
        default:
          Log.error(`Bad metapath parameter for table : ${contextObjectPath.targetObject.term}`);
      }
      const lineItemViz = visualizations.find(viz => {
        return viz.visualization.term === "com.sap.vocabularies.UI.v1.LineItem";
      });
      if (lineItemViz) {
        return lineItemViz.annotationPath;
      } else {
        // fallback to default LineItem if annotation missing in PV
        Log.error(`Bad meta path parameter for LineItem: ${contextObjectPath.targetObject.term}`);
        return `@${"com.sap.vocabularies.UI.v1.LineItem"}`; // Fallback
      }
    };
    TableBlock.getPresentationPath = function getPresentationPath(contextObjectPath) {
      var _contextObjectPath$ta;
      let presentationPath;
      switch ((_contextObjectPath$ta = contextObjectPath.targetObject) === null || _contextObjectPath$ta === void 0 ? void 0 : _contextObjectPath$ta.term) {
        case "com.sap.vocabularies.UI.v1.PresentationVariant":
          presentationPath = getContextRelativeTargetObjectPath(contextObjectPath);
          break;
        case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
          presentationPath = getContextRelativeTargetObjectPath(contextObjectPath) + "/PresentationVariant";
          break;
      }
      return presentationPath;
    };
    TableBlock.setUpTableDefinition = function setUpTableDefinition(table, settings) {
      let tableDefinition = table.tableDefinition;
      if (!tableDefinition) {
        var _table$contextPath, _table$contextPath2;
        const initialConverterContext = table.getConverterContext(table.contextObjectPath, (_table$contextPath = table.contextPath) === null || _table$contextPath === void 0 ? void 0 : _table$contextPath.getPath(), settings);
        const visualizationPath = TableBlock.getVisualizationPath(table.contextObjectPath, initialConverterContext);
        const presentationPath = TableBlock.getPresentationPath(table.contextObjectPath);

        //Check if we have ActionGroup and add nested actions

        const extraParams = {};
        const tableSettings = {
          enableExport: table.enableExport,
          frozenColumnCount: table.frozenColumnCount,
          widthIncludingColumnHeader: table.widthIncludingColumnHeader,
          rowCountMode: table.rowCountMode,
          rowCount: table.rowCount,
          enableFullScreen: table.enableFullScreen,
          enablePaste: table.enablePaste,
          selectionMode: table.selectionMode,
          type: table.type,
          creationMode: {
            name: table.creationMode.name,
            createAtEnd: table.creationMode.createAtEnd,
            inlineCreationRowsHiddenInEditMode: table.creationMode.inlineCreationRowsHiddenInEditMode
          }
        };
        if (table.actions) {
          var _Object$values;
          (_Object$values = Object.values(table.actions)) === null || _Object$values === void 0 ? void 0 : _Object$values.forEach(item => {
            table.actions = {
              ...table.actions,
              ...item.menuContentActions
            };
            delete item.menuContentActions;
          });
        }

        // table actions and columns as {} if not provided to allow merge with manifest settings
        extraParams[visualizationPath] = {
          actions: table.actions || {},
          columns: table.columns || {},
          tableSettings: tableSettings
        };
        const converterContext = table.getConverterContext(table.contextObjectPath, (_table$contextPath2 = table.contextPath) === null || _table$contextPath2 === void 0 ? void 0 : _table$contextPath2.getPath(), settings, extraParams);
        const visualizationDefinition = getDataVisualizationConfiguration(visualizationPath, table.useCondensedLayout, converterContext, undefined, undefined, presentationPath, true);
        tableDefinition = visualizationDefinition.visualizations[0];
        table.tableDefinition = tableDefinition;
      }
      table.tableDefinitionContext = MacroAPI.createBindingContext(table.tableDefinition, settings);
      return tableDefinition;
    };
    var _proto = TableBlock.prototype;
    _proto.setUpId = function setUpId() {
      if (this.id) {
        // The given ID shall be assigned to the TableAPI and not to the MDC Table
        this._apiId = this.id;
        this.id = this.getContentId(this.id);
      } else {
        // We generate the ID. Due to compatibility reasons we keep it on the MDC Table but provide assign
        // the ID with a ::Table suffix to the TableAPI
        const tableDefinition = this.tableDefinition;
        this.id ??= tableDefinition.annotation.id;
        this._apiId = generate([tableDefinition.annotation.id, "Table"]);
      }
    };
    _proto.setReadOnly = function setReadOnly() {
      // Special code for readOnly
      // readonly = false -> Force editable
      // readonly = true -> Force display mode
      // readonly = undefined -> Bound to edit flow
      if (this.readOnly === undefined && this.tableDefinition.annotation.displayMode === true) {
        this.readOnly = true;
      }
    };
    _proto._getEntityType = function _getEntityType() {
      var _this$collectionEntit3, _this$collectionEntit4;
      return ((_this$collectionEntit3 = this.collectionEntity) === null || _this$collectionEntit3 === void 0 ? void 0 : _this$collectionEntit3.entityType) || ((_this$collectionEntit4 = this.collectionEntity) === null || _this$collectionEntit4 === void 0 ? void 0 : _this$collectionEntit4.targetType);
    }

    /**
     * Generates the template string for the valueHelp based on the dataField path.
     *
     * @param dataFieldPath DataFieldPath to be evaluated
     * @param isMultiValueField
     * @returns The xml string representation of the valueHelp
     */;
    _proto.getValueHelpTemplateFromPath = function getValueHelpTemplateFromPath(dataFieldPath, isMultiValueField) {
      return dataFieldPath ? `<macros:ValueHelp
					idPrefix="${generate([this.id, "TableValueHelp"])}"
					property="${dataFieldPath}/Value"
					${isMultiValueField === true ? 'useMultiValueField="true"' : ""}
				/>` : "";
    }

    /**
     * Generates the template string for the valueHelp based on column.
     *
     * @param column Column to be evaluated
     * @returns The xml string representation of the valueHelp
     */;
    _proto.getValueHelp = function getValueHelp(column) {
      var _dataFieldObject$Targ, _dataFieldObject$Targ2;
      const dataFieldObject = this.convertedMetaData.resolvePath(column.annotationPath).target;
      if (isDataFieldForAnnotation(dataFieldObject) && ((_dataFieldObject$Targ = dataFieldObject.Target.$target) === null || _dataFieldObject$Targ === void 0 ? void 0 : _dataFieldObject$Targ.term) === "com.sap.vocabularies.UI.v1.Chart") {
        return ``;
      } else if (isDataFieldForAnnotation(dataFieldObject) && ((_dataFieldObject$Targ2 = dataFieldObject.Target.$target) === null || _dataFieldObject$Targ2 === void 0 ? void 0 : _dataFieldObject$Targ2.term) === "com.sap.vocabularies.UI.v1.FieldGroup") {
        let template = ``;
        for (const index in dataFieldObject.Target.$target.Data) {
          template += this.getValueHelpTemplateFromPath(column.annotationPath + "/Target/$AnnotationPath/Data/" + index);
        }
        return xml`${template}`;
      } else {
        if (isDataFieldTypes(dataFieldObject)) {
          const propertyDataModelObject = enhanceDataModelPath(this.contextObjectPath, dataFieldObject.Value.path);
          const relativeNavigationProperties = getPathRelativeLocation(this.contextObjectPath, propertyDataModelObject.navigationProperties);
          if (isMultipleNavigationProperty(relativeNavigationProperties[relativeNavigationProperties.length - 1])) {
            return xml`${this.getValueHelpTemplateFromPath(column.annotationPath, true)}`;
          }
        }
        return xml`${this.getValueHelpTemplateFromPath(column.annotationPath)}`;
      }
    };
    /**
     * Generates the template string for the actionCommand.
     *
     * @param actionName The name of the action
     * @param action Action to be evaluated
     * @returns The xml string representation of the actionCommand
     */
    _proto.getActionCommand = function getActionCommand(actionName, action) {
      var _ActionTarget, _ActionTarget2, _ActionTarget2$annota, _ActionTarget2$annota2, _ActionTarget2$annota3;
      const dataField = action.annotationPath ? this.convertedMetaData.resolvePath(action.annotationPath).target : undefined;
      const actionContextPath = action.annotationPath ? CommonHelper.getActionContext(this.metaPath.getModel().createBindingContext(action.annotationPath + "/Action")) : undefined;
      const actionContext = this.metaPath.getModel().createBindingContext(actionContextPath);
      const dataFieldDataModelObjectPath = actionContext ? MetaModelConverter.getInvolvedDataModelObjects(actionContext, this.collection) : undefined;
      const isBound = dataField === null || dataField === void 0 ? void 0 : (_ActionTarget = dataField.ActionTarget) === null || _ActionTarget === void 0 ? void 0 : _ActionTarget.isBound;
      const isOperationAvailable = (dataField === null || dataField === void 0 ? void 0 : (_ActionTarget2 = dataField.ActionTarget) === null || _ActionTarget2 === void 0 ? void 0 : (_ActionTarget2$annota = _ActionTarget2.annotations) === null || _ActionTarget2$annota === void 0 ? void 0 : (_ActionTarget2$annota2 = _ActionTarget2$annota.Core) === null || _ActionTarget2$annota2 === void 0 ? void 0 : (_ActionTarget2$annota3 = _ActionTarget2$annota2.OperationAvailable) === null || _ActionTarget2$annota3 === void 0 ? void 0 : _ActionTarget2$annota3.valueOf()) !== false;
      const displayCommandAction = action.type === "ForAction" ? isBound !== true || isOperationAvailable : true;
      if (displayCommandAction) {
        return xml`<internalMacro:ActionCommand
							action="{tableDefinition>commandActions/${actionName}}"
							onExecuteAction="${TableHelper.pressEventDataFieldForActionButton({
          contextObjectPath: this.contextObjectPath,
          id: this.id
        }, dataField, this.collectionEntity.name, this.tableDefinition.operationAvailableMap, actionContext === null || actionContext === void 0 ? void 0 : actionContext.getObject(), action.isNavigable, action.enableAutoScroll, action.defaultValuesExtensionFunction)}"
							onExecuteIBN="${CommonHelper.getPressHandlerForDataFieldForIBN(dataField, "${internal>selectedContexts}", !this.tableDefinition.enableAnalytics)}"
							onExecuteManifest="${action.noWrap ? action.press : CommonHelper.buildActionWrapper(action, this)}"
							isIBNEnabled="${action.enabled ?? TableHelper.isDataFieldForIBNEnabled(this, dataField, !!dataField.RequiresContext, dataField.NavigationAvailable)}"
							isActionEnabled="${action.enabled ?? TableHelper.isDataFieldForActionEnabled(this.tableDefinition, dataField.Action, !!isBound, actionContextPath, action.enableOnSelect, dataFieldDataModelObjectPath === null || dataFieldDataModelObjectPath === void 0 ? void 0 : dataFieldDataModelObjectPath.targetEntityType)}"
							/>`;
      }
      return ``;
    };
    /**
     * Generates the binding expression for the drag and drop enablement.
     *
     * @returns The binding expression
     */
    _proto.getDragAndDropEnabled = function getDragAndDropEnabled() {
      const isPathUpdatableOnNavigation = isPathUpdatable(this.contextObjectPath, {
        ignoreTargetCollection: true,
        authorizeUnresolvable: true,
        pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, this.contextObjectPath.convertedTypes, navigationPaths)
      });
      const isPathUpdatableOnTarget = isPathUpdatable(this.contextObjectPath, {
        authorizeUnresolvable: true,
        pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, this.contextObjectPath.convertedTypes, navigationPaths)
      });
      return and(isPathUpdatableOnNavigation._type === "Unresolvable" ? ifElse(isConstant(isPathUpdatableOnTarget), isPathUpdatableOnTarget, constant(true)) : isPathUpdatableOnNavigation, pathInModel("/isEditable", "ui"));
    }

    /**
     * Generates the template string for the drag and drop config.
     *
     * @returns The xml string representation of the drag and drop config
     */;
    _proto.getDragAndDropConfig = function getDragAndDropConfig() {
      if (this.tableType === "TreeTable") {
        return xml`<mdc:dragDropConfig>
				<mdcTable:DragDropConfig
					enabled="${compileExpression(this.getDragAndDropEnabled())}"
					dropPosition="OnOrBetween"
					draggable="true"
					droppable="true"
					dragStart="API.onDragStartDocument"
					dragEnter="API.onDragEnterDocument"
					drop="API.onDropDocument"
				/>
			</mdc:dragDropConfig>`;
      }
      return "";
    }

    /**
     * Generates the template string for the CreationRow.
     *
     * @returns The xml string representation of the CreationRow
     */;
    _proto.getCreationRow = function getCreationRow() {
      if (this.creationMode.name === CreationMode.CreationRow) {
        const creationRowAction = this.tableDefinition.actions.find(a => a.key === StandardActionKeys.CreationRow);
        if (creationRowAction !== null && creationRowAction !== void 0 && creationRowAction.isTemplated) {
          return xml`<mdc:creationRow>
							<mdcTable:CreationRow
								id="${generate([this.id, CreationMode.CreationRow])}"
								visible="${creationRowAction.visible}"
								apply="${TableHelper.pressEventForCreateButton(this, false)}"
								applyEnabled="${creationRowAction.enabled}"
								macrodata:disableAddRowButtonForEmptyData="${this.disableAddRowButtonForEmptyData}"
								macrodata:customValidationFunction="${this.customValidationFunction}"
							/>
					   	   </mdc:creationRow>`;
        }
      }
      return "";
    };
    _proto.getRowSetting = function getRowSetting() {
      var _this$tableDefinition5, _this$tableDefinition6;
      let rowSettingsTemplate = `<mdcTable:RowSettings
        navigated="${(_this$tableDefinition5 = this.tableDefinition.annotation.row) === null || _this$tableDefinition5 === void 0 ? void 0 : _this$tableDefinition5.rowNavigated}"
        highlight="${(_this$tableDefinition6 = this.tableDefinition.annotation.row) === null || _this$tableDefinition6 === void 0 ? void 0 : _this$tableDefinition6.rowHighlighting}"
        >`;
      if (this.rowAction === "Navigation") {
        var _this$tableDefinition7;
        rowSettingsTemplate += `<mdcTable:rowActions>
                <mdcTable:RowActionItem
                    type = "${this.rowAction}"
                    press = "${this.tableType === "ResponsiveTable" ? "" : this.rowPress}"
                    visible = "${(_this$tableDefinition7 = this.tableDefinition.annotation.row) === null || _this$tableDefinition7 === void 0 ? void 0 : _this$tableDefinition7.visible}"
                    />
                </mdcTable:rowActions>`;
      }
      rowSettingsTemplate += `</mdcTable:RowSettings>`;
      return xml`${rowSettingsTemplate}`;
    };
    _proto.getVariantManagement = function getVariantManagement() {
      if (this.variantManagement === "Control") {
        return xml`<mdc:variant>
                        <variant:VariantManagement
                            id="${generate([this.id, "VM"])}"
                            for="{this>id}"
                            showSetAsDefault="true"
                            select="{this>variantSelected}"
                            headerLevel="${this.headerLevel}"
                            save="${this.variantSaved}"
                        />
                    </mdc:variant>`;
      }
      return "";
    };
    _proto.getQuickFilter = function getQuickFilter() {
      var _this$tableDefinition8;
      if ((_this$tableDefinition8 = this.tableDefinition.control.filters) !== null && _this$tableDefinition8 !== void 0 && _this$tableDefinition8.quickFilters) {
        const quickFilters = this.tableDefinition.control.filters.quickFilters;
        return xml`<mdc:quickFilter>
						<macroTable:QuickFilterSelector
							id="${generate([this.id, "QuickFilterContainer"])}"
							metaPath="${this.metaPath}"
							filterConfiguration="${quickFilters}"
							onSelectionChange="API.onQuickFilterSelectionChange"
						/>
					</mdc:quickFilter>`;
      }
      return "";
    }

    /**
     * Generates the template string for the CopyProvider.
     *
     * @returns The xml string representation of the CopyProvider
     */;
    _proto.getCopyProvider = function getCopyProvider() {
      return xml`<mdc:copyProvider>
						<plugins:CopyProvider 
						visible="${this.tableType === "TreeTable" ? not(pathInModel("/isEditable", "ui")) : true}"
						/>
					</mdc:copyProvider>`;
    };
    _proto.getEmptyRowsEnabled = function getEmptyRowsEnabled() {
      var _this$tableDefinition9;
      return this.creationMode.name === CreationMode.InlineCreationRows ? (_this$tableDefinition9 = this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create)) === null || _this$tableDefinition9 === void 0 ? void 0 : _this$tableDefinition9.enabled : undefined;
    };
    _proto.buildEventHandlerWrapper = function buildEventHandlerWrapper(eventHandler) {
      if (!eventHandler) {
        return undefined;
      }

      // FPM.getCustomFunction returns a function, that's why we have 2 nested function calls below
      return compileExpression(fn(compileExpression(fn("FPM.getCustomFunction", [eventHandler.moduleName, eventHandler.methodName, ref("$event")])), [ref("$event")]));
    }

    /**
     * Generates the template string for the required modules.
     *
     * @returns The list of required modules
     */;
    _proto.getCoreRequire = function getCoreRequire() {
      const customModules = this.tableDefinition.control.additionalRequiredModules ?? [];
      return `TableRuntime: 'sap/fe/macros/table/TableRuntime', API: 'sap/fe/macros/table/TableAPI'${customModules.map((module, index) => `, customModule${index + 1}: '${module}'`).join("")}`;
    };
    _proto.getTemplate = function getTemplate() {
      var _this$tableDefinition10, _annotations$Capabili, _annotations$Capabili2, _annotations$Capabili3, _TableHelper$getDeleg, _this$isAlp, _annotations$Common, _this$metaPath, _this$contextPath2, _this$tableDefinition11;
      const headerBindingExpression = buildExpressionForHeaderVisible(this);
      if (this.rowPress) {
        this.rowAction = "Navigation";
      }
      this.rowPress ??= (_this$tableDefinition10 = this.tableDefinition.annotation.row) === null || _this$tableDefinition10 === void 0 ? void 0 : _this$tableDefinition10.press;
      const collectionDeletablePath = (_annotations$Capabili = this.collectionEntity.annotations.Capabilities) === null || _annotations$Capabili === void 0 ? void 0 : (_annotations$Capabili2 = _annotations$Capabili.DeleteRestrictions) === null || _annotations$Capabili2 === void 0 ? void 0 : (_annotations$Capabili3 = _annotations$Capabili2.Deletable) === null || _annotations$Capabili3 === void 0 ? void 0 : _annotations$Capabili3.path;
      const lineItem = TableHelper.getUiLineItemObject(this.metaPath, this.convertedMetaData);
      const delegate = (_TableHelper$getDeleg = TableHelper.getDelegate) === null || _TableHelper$getDeleg === void 0 ? void 0 : _TableHelper$getDeleg.call(TableHelper, this.tableDefinition, (_this$isAlp = this.isAlp) === null || _this$isAlp === void 0 ? void 0 : _this$isAlp.toString(), this.tableDefinition.annotation.entityName);
      const selectionChange = `TableRuntime.setContexts(\${$source>/}, '${collectionDeletablePath}', '${(_annotations$Common = this.collectionEntity.annotations.Common) === null || _annotations$Common === void 0 ? void 0 : _annotations$Common.DraftRoot}', '${this.tableDefinition.operationAvailableMap}', '${TableHelper.getNavigationAvailableMap(lineItem)}', '${ActionHelper.getMultiSelectDisabledActions(lineItem)}', '${this.updatablePropertyPath}')`;
      const entityType = this._getEntityType();
      const modelContextChange = this.tableType === "TreeTable" ? `TableRuntime.onTreeTableContextChanged(\${$source>/}, ${this.tableDefinition.annotation.initialExpansionLevel})` : undefined;
      const pasteAction = this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Paste);
      const createEnablementRequire = this.tableDefinition.control.createEnablement && !this.tableDefinition.control.createEnablement.moduleName.startsWith("/extension/") ? `{_createEnablement: '${this.tableDefinition.control.createEnablement.moduleName}'}` : undefined;
      return xml`
            <macroTable:TableAPI
                xmlns="sap.m"
                xmlns:mdc="sap.ui.mdc"
                xmlns:plugins="sap.m.plugins"
                xmlns:mdcTable="sap.ui.mdc.table"
                xmlns:macroTable="sap.fe.macros.table"
                xmlns:mdcat="sap.ui.mdc.actiontoolbar"
                xmlns:core="sap.ui.core"
                xmlns:control="sap.fe.core.controls"
                xmlns:dt="sap.ui.dt"
                xmlns:fl="sap.ui.fl"
                xmlns:variant="sap.ui.fl.variants"
                xmlns:p13n="sap.ui.mdc.p13n"
                xmlns:internalMacro="sap.fe.macros.internal"
                xmlns:unittest="http://schemas.sap.com/sapui5/preprocessorextension/sap.fe.unittesting/1"
                xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
				core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
                binding="{internal>controls/${this.id}}"
                id="${this._apiId}"
                tableDefinition="{_pageModel>${this.tableDefinitionContext.getPath()}}"
                entityTypeFullyQualifiedName="${entityType === null || entityType === void 0 ? void 0 : entityType.fullyQualifiedName}"
                metaPath="${(_this$metaPath = this.metaPath) === null || _this$metaPath === void 0 ? void 0 : _this$metaPath.getPath()}"
                contextPath="${(_this$contextPath2 = this.contextPath) === null || _this$contextPath2 === void 0 ? void 0 : _this$contextPath2.getPath()}"
                stateChange="${this.stateChange}"
                selectionChange="${this.selectionChange}"
				contextChange="${this.onContextChange}"
                readOnly="${this.readOnly}"
                filterBar="${this.filterBar}"
                macrodata:tableAPILocalId="${this._apiId}"
                emptyRowsEnabled="${this.getEmptyRowsEnabled()}"
                enableAutoColumnWidth="${this.enableAutoColumnWidth}"
                isOptimizedForSmallDevice="${this.isOptimizedForSmallDevice}"
				widthIncludingColumnHeader="${this.widthIncludingColumnHeader}"
            >
				<template:with path="collection>${CommonHelper.getTargetCollectionPath(this.collection)}" var="targetCollection">
                <macroTable:layoutData>
                    <FlexItemData maxWidth="100%" />
                </macroTable:layoutData>
                <!-- macrodata has to be an expression binding if it needs to be set as attribute via change handler during templating -->
                    <mdc:Table
                        unittest:id="TableMacroFragment"
						core:require="{${this.getCoreRequire()}}"
                        fl:flexibility="{this>fl:flexibility}"
                        sortConditions="${this.tableDefinition.annotation.sortConditions}"
                        groupConditions="${CommonHelper.stringifyObject(this.tableDefinition.annotation.groupConditions)}"
                        aggregateConditions="${CommonHelper.stringifyObject(this.tableDefinition.annotation.aggregateConditions)}"
                        dt:designtime="${this.variantManagement === "None" ? "not-adaptable" : undefined}"
                        macrodata:kind="${this.collectionEntity._type}"
                        macrodata:navigationPath="${this.navigationPath}"
                        id="${this.id}"
                        busy="${this.busy}"
                        busyIndicatorDelay="0"
                        enableExport="${this.enableExport}"
                        delegate="${delegate}"
                        rowPress="${this.tableType === "ResponsiveTable" ? this.rowPress : undefined}"
                        height="100%"
                        autoBindOnInit="${this.autoBindOnInit}"
                        selectionMode="${this.selectionMode || "None"}"
                        selectionChange="${selectionChange}"
                        showRowCount="${this.tableDefinition.control.showRowCount}"
                        ${this.attr("header", this.header)}
                        headerVisible="${headerBindingExpression}"
                        headerLevel="${this.headerLevel}"
                        threshold="${this.tableDefinition.annotation.threshold}"
                        noData="${this.noDataText}"
                        p13nMode="${this.personalization}"
                        filter="${this.filterBarId}"
                        paste="API.onPaste($event, $controller)"
                        beforeExport="API.onBeforeExport($event)"
                        class="${this.tableDefinition.control.useCondensedTableLayout === true ? "sapUiSizeCondensed" : undefined}"
                        multiSelectMode="${this.tableDefinition.control.multiSelectMode}"
                        showPasteButton="${this.tableType === "TreeTable" ? "false" : pasteAction === null || pasteAction === void 0 ? void 0 : pasteAction.visible}"
                        enablePaste="${this.tableType === "TreeTable" ? "false" : pasteAction === null || pasteAction === void 0 ? void 0 : pasteAction.enabled}"
                        macrodata:rowsBindingInfo="${TableHelper.getRowsBindingInfo(this)}"
                        macrodata:enableAnalytics="${this.tableDefinition.enableAnalytics}"
                        macrodata:creationMode="${this.creationMode.name}"
                        macrodata:inlineCreationRowCount="${this.inlineCreationRowCount}"
                        macrodata:showCreate="${this.showCreate}"
                        macrodata:createAtEnd="${this.creationMode.createAtEnd}"
                        macrodata:enableAutoScroll="${this.enableAutoScroll}"
                        macrodata:displayModePropertyBinding="${this.readOnly}"
                        macrodata:tableType="${this.tableType}"
                        macrodata:targetCollectionPath="${CommonHelper.getContextPath(null, {
        context: this.collection
      })}"
                        macrodata:entityType="${CommonHelper.getContextPath(null, {
        context: this.collection
      }) + "/"}"
                        macrodata:metaPath="${CommonHelper.getContextPath(null, {
        context: this.collection
      })}"
                        macrodata:onChange="${this.onChange}"
                        macrodata:hiddenFilters="${TableHelper.formatHiddenFilters((_this$tableDefinition11 = this.tableDefinition.control.filters) === null || _this$tableDefinition11 === void 0 ? void 0 : _this$tableDefinition11.hiddenFilters)}"
                        macrodata:requestGroupId="$auto.Workers"
                        macrodata:segmentedButtonId="${generate([this.id, "SegmentedButton", "TemplateContentView"])}"
                        macrodata:enablePaste="${this.tableType === "TreeTable" ? "false" : this.enablePaste}"
                        macrodata:operationAvailableMap="${CommonHelper.stringifyCustomData(this.tableDefinition.operationAvailableMap)}"
                        visible="${this.visible}"
						modelContextChange="${modelContextChange}"
                    >
                        <mdc:dataStateIndicator>
                            <plugins:DataStateIndicator
                                filter="${this.dataStateIndicatorFilter}"
                                enableFiltering="true"
                                dataStateChange="API.onDataStateChange"
                            />
                        </mdc:dataStateIndicator>
                        <mdc:type>
                            ${this.getTableType()}
                        </mdc:type>
                        <mdc:dependents>
                            ${this.getDependents()}
                        </mdc:dependents>
                        <mdc:actions>
                            ${this.getActions()}
                        </mdc:actions>
                        <mdc:rowSettings>
                        ${this.getRowSetting()}
                        </mdc:rowSettings>
                        <mdc:columns>
                            <core:Fragment fragmentName="sap.fe.macros.table.Columns" type="XML" />
                        </mdc:columns>
						${this.getDragAndDropConfig()}
                        ${this.getCreationRow()}
                        ${this.getVariantManagement()}
                        ${this.getQuickFilter()}
                        ${this.getCopyProvider()}
                    </mdc:Table>
				</template:with>
            </macroTable:TableAPI>
        `;
    };
    return TableBlock;
  }(BuildingBlockBase), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "enableFullScreen", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enableExport", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "frozenColumnCount", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "rowCountMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "rowCount", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enablePaste", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "pasteVisible", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "isSearchable", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "useCondensedLayout", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "collection", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "_apiId", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "autoBindOnInit", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "columnEditMode", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "createNewAction", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "createOutbound", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "customValidationFunction", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "dataStateIndicatorFilter", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "disableAddRowButtonForEmptyData", [_dec33], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoColumnWidth", [_dec34], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoScroll", [_dec35], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "fieldMode", [_dec36], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "filterBarId", [_dec37], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "inlineCreationRowCount", [_dec38], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor38 = _applyDecoratedDescriptor(_class2.prototype, "isAlp", [_dec39], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor39 = _applyDecoratedDescriptor(_class2.prototype, "isCompactType", [_dec40], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor40 = _applyDecoratedDescriptor(_class2.prototype, "isOptimizedForSmallDevice", [_dec41], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor41 = _applyDecoratedDescriptor(_class2.prototype, "multiSelectMode", [_dec42], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor42 = _applyDecoratedDescriptor(_class2.prototype, "navigationPath", [_dec43], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor43 = _applyDecoratedDescriptor(_class2.prototype, "noDataText", [_dec44], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor44 = _applyDecoratedDescriptor(_class2.prototype, "rowAction", [_dec45], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return undefined;
    }
  }), _descriptor45 = _applyDecoratedDescriptor(_class2.prototype, "tableType", [_dec46], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor46 = _applyDecoratedDescriptor(_class2.prototype, "updatablePropertyPath", [_dec47], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor47 = _applyDecoratedDescriptor(_class2.prototype, "useBasicSearch", [_dec48], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor48 = _applyDecoratedDescriptor(_class2.prototype, "searchable", [_dec49], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor49 = _applyDecoratedDescriptor(_class2.prototype, "selectionLimit", [_dec50], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor50 = _applyDecoratedDescriptor(_class2.prototype, "showCreate", [_dec51], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor51 = _applyDecoratedDescriptor(_class2.prototype, "tableDefinition", [_dec52], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor52 = _applyDecoratedDescriptor(_class2.prototype, "tableDefinitionContext", [_dec53], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor53 = _applyDecoratedDescriptor(_class2.prototype, "tableDelegate", [_dec54], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor54 = _applyDecoratedDescriptor(_class2.prototype, "tabTitle", [_dec55], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor55 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec56], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor56 = _applyDecoratedDescriptor(_class2.prototype, "creationMode", [_dec57], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor57 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec58], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor58 = _applyDecoratedDescriptor(_class2.prototype, "columns", [_dec59], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor59 = _applyDecoratedDescriptor(_class2.prototype, "rowPress", [_dec60], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor60 = _applyDecoratedDescriptor(_class2.prototype, "onContextChange", [_dec61], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor61 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec62], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor62 = _applyDecoratedDescriptor(_class2.prototype, "onSegmentedButtonPressed", [_dec63], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor63 = _applyDecoratedDescriptor(_class2.prototype, "variantSaved", [_dec64], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor64 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec65], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor65 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec66], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor66 = _applyDecoratedDescriptor(_class2.prototype, "variantSelected", [_dec67], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = TableBlock;
  return _exports;
}, false);
