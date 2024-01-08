/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FilterHelper", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/m/Select", "sap/ui/core/InvisibleText", "sap/ui/core/Item", "sap/fe/core/jsx-runtime/jsx"], function (BuildingBlockSupport, RuntimeBuildingBlock, MetaModelConverter, BindingToolkit, StableIdHelper, DataModelPathHelper, FilterHelper, SegmentedButton, SegmentedButtonItem, Select, InvisibleText, Item, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var isSelectionVariant = FilterHelper.isSelectionVariant;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let QuickFilterSelector = (_dec = defineBuildingBlock({
    name: "QuickFilterSelector",
    namespace: "sap.fe.macros.table"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec5 = blockAttribute({
    type: "object",
    required: true
  }), _dec6 = blockAttribute({
    type: "function"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(QuickFilterSelector, _RuntimeBuildingBlock);
    function QuickFilterSelector(props) {
      var _this;
      _this = _RuntimeBuildingBlock.call(this, props) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterConfiguration", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "onSelectionChange", _descriptor5, _assertThisInitialized(_this));
      return _this;
    }

    /**
     * Generates the selector as a SegmentedButton.
     *
     * @returns  The SegmentedButton
     */
    _exports = QuickFilterSelector;
    var _proto = QuickFilterSelector.prototype;
    _proto.getSegmentedButtonSelector = function getSegmentedButtonSelector() {
      const items = this.filterConfiguration.paths.map((path, index) => {
        return _jsx(SegmentedButtonItem, {
          ...this.getSelectorItemProperties(index)
        });
      });
      return _jsx(SegmentedButton, {
        id: this.id,
        enabled: notEqual(pathInModel("hasPendingFilters", "pageInternal"), true),
        ariaLabelledBy: [this.getSelectorAriaLabelledById()],
        items: items,
        selectionChange: event => {
          var _this$onSelectionChan;
          (_this$onSelectionChan = this.onSelectionChange) === null || _this$onSelectionChan === void 0 ? void 0 : _this$onSelectionChan.call(this, event);
        }
      });
    }

    /**
     * Generates the selector as a Select.
     *
     * @returns  The Select
     */;
    _proto.getSelectSelector = function getSelectSelector() {
      const items = this.filterConfiguration.paths.map((path, index) => {
        return _jsx(Item, {
          ...this.getSelectorItemProperties(index)
        });
      });
      return _jsx(Select, {
        id: this.id,
        enabled: notEqual(pathInModel("hasPendingFilters", "pageInternal"), true),
        ariaLabelledBy: [this.getSelectorAriaLabelledById()],
        autoAdjustWidth: true,
        items: items,
        change: event => {
          var _this$onSelectionChan2;
          (_this$onSelectionChan2 = this.onSelectionChange) === null || _this$onSelectionChan2 === void 0 ? void 0 : _this$onSelectionChan2.call(this, event);
        }
      });
    }

    /**
     * Gets the properties of the selector Item.
     *
     * @param index The index of the item into the selector
     * @returns  The properties
     */;
    _proto.getSelectorItemProperties = function getSelectorItemProperties(index) {
      return {
        key: this.filterConfiguration.paths[index].annotationPath,
        text: this.getSelectorItemText(index)
      };
    }

    /**
     * Generates the Id of the InvisibleText control.
     *
     * @returns  The Id
     */;
    _proto.getSelectorAriaLabelledById = function getSelectorAriaLabelledById() {
      return generate([this.id, "AriaText"]);
    }

    /**
     * Generates the text for the selector item.
     *
     * @param index The index of the item into the selector
     * @returns  The text
     */;
    _proto.getSelectorItemText = function getSelectorItemText(index) {
      var _selectionVariant$Tex;
      const countText = ` ({internal>quickFilters/counts/${index}})`;
      const dataTableModelPath = getInvolvedDataModelObjects(this.metaPath);
      const selectionVariant = enhanceDataModelPath(dataTableModelPath, this.filterConfiguration.paths[index].annotationPath).targetObject;
      const text = (selectionVariant === null || selectionVariant === void 0 ? void 0 : (_selectionVariant$Tex = selectionVariant.Text) === null || _selectionVariant$Tex === void 0 ? void 0 : _selectionVariant$Tex.toString()) ?? "";
      return `${text}${this.filterConfiguration.showCounts ? countText : ""}`;
    }

    /**
     * Registers the SideEffects control that must be executed when table cells that are related to configured filter(s) change.
     *
     * @param appComponent The appComponent
     */;
    _proto.registerSideEffectForQuickFilter = function registerSideEffectForQuickFilter(appComponent) {
      var _dataVisualizationMod;
      const dataVisualizationModelPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
      const viewEntityType = (_dataVisualizationMod = dataVisualizationModelPath.contextLocation) === null || _dataVisualizationMod === void 0 ? void 0 : _dataVisualizationMod.targetEntityType.fullyQualifiedName;
      const tableNavigationPath = getTargetNavigationPath(dataVisualizationModelPath, true);
      const selectionVariantPaths = this.filterConfiguration.paths.map(info => info.annotationPath);
      if (tableNavigationPath && viewEntityType) {
        const sourceProperties = new Set();
        for (const selectionVariantPath of selectionVariantPaths) {
          const selectionVariant = enhanceDataModelPath(dataVisualizationModelPath, selectionVariantPath).targetObject; // We authorize SelectionVariant without SelectOptions even if it's not compliant with vocabularies
          if (selectionVariant.SelectOptions && isSelectionVariant(selectionVariant)) {
            selectionVariant.SelectOptions.forEach(selectOption => {
              var _selectOption$Propert;
              const propertyPath = (_selectOption$Propert = selectOption.PropertyName) === null || _selectOption$Propert === void 0 ? void 0 : _selectOption$Propert.value;
              if (propertyPath) {
                const propertyModelPath = enhanceDataModelPath(dataVisualizationModelPath, propertyPath);
                sourceProperties.add(getTargetObjectPath(propertyModelPath, true));
              }
            });
          }
        }
        appComponent.getSideEffectsService().addControlSideEffects(viewEntityType, {
          sourceProperties: Array.from(sourceProperties),
          targetEntities: [{
            $NavigationPropertyPath: tableNavigationPath
          }],
          sourceControlId: this.id
        });
      }
    }

    /**
     * Creates the invisibleText for the accessibility compliance.
     *
     * @returns  The InvisibleText
     */;
    _proto.getAccessibilityControl = function getAccessibilityControl() {
      const textBinding = `{sap.fe.i18n>M_TABLE_QUICKFILTER_ARIA}`;
      const invisibleText = _jsx(InvisibleText, {
        text: textBinding,
        id: this.getSelectorAriaLabelledById()
      });

      //Adds the invisibleText into the static, hidden area UI area container.
      invisibleText.toStatic();
      return invisibleText;
    };
    _proto.getContent = function getContent(view, appComponent) {
      if (this.filterConfiguration.showCounts) {
        this.registerSideEffectForQuickFilter(appComponent);
      }
      /**
       * The number of views defined for a table determines the UI control that lets users switch the table views:
       *  - A segmented button for a maximum of three views
       *  - A select control for four or more views.
       */
      const selector = this.filterConfiguration.paths.length > 3 ? this.getSelectSelector() : this.getSegmentedButtonSelector();
      selector.addDependent(this.getAccessibilityControl());
      return selector;
    };
    return QuickFilterSelector;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filterConfiguration", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "onSelectionChange", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = QuickFilterSelector;
  return _exports;
}, false);
