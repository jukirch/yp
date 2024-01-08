/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/base/util/merge", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/DraftEditState", "sap/fe/core/helpers/SemanticDateOperators", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/adapter/SelectionVariantToStateFilters", "sap/fe/macros/filterBar/adapter/StateFilterToSelectionVariant", "sap/ui/mdc/p13n/StateUtil", "../MacroAPI"], function (Log, deepClone, merge, ClassSupport, DraftEditState, SemanticDateOperators, FilterUtils, svToStateFilters, StateFiltersToSelectionVariant, StateUtil, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Building block for creating a FilterBar based on the metadata provided by OData V4.
   * <br>
   * Usually, a SelectionFields annotation is expected.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:FilterBar id="MyFilterBar" metaPath="@com.sap.vocabularies.UI.v1.SelectionFields" /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.FilterBar
   * @public
   */
  let FilterBarAPI = (_dec = defineUI5Class("sap.fe.macros.filterBar.FilterBarAPI", {
    returnTypes: ["sap.ui.core.Control"]
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string",
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionFields"],
    expectedTypes: ["EntitySet", "EntityType"]
  }), _dec4 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "NavigationProperty"]
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec6 = property({
    type: "boolean",
    defaultValue: true
  }), _dec7 = property({
    type: "boolean",
    defaultValue: true
  }), _dec8 = property({
    type: "boolean",
    defaultValue: false
  }), _dec9 = aggregation({
    type: "sap.fe.macros.FilterField",
    multiple: true
  }), _dec10 = event(), _dec11 = event(), _dec12 = event(), _dec13 = event(), _dec14 = event(), _dec15 = event(), _dec16 = xmlEventHandler(), _dec17 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(FilterBarAPI, _MacroAPI);
    function FilterBarAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "liveMode", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "visible", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showMessages", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "showClearButton", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterFields", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "search", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalSearch", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterChanged", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "afterClear", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalFilterChanged", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor14, _assertThisInitialized(_this));
      _this.isSemanticDateFilterApplied = () => {
        return SemanticDateOperators.hasSemanticDateOperations(_this.content.getConditions(), false);
      };
      return _this;
    }
    var _proto = FilterBarAPI.prototype;
    _proto.handleSearch = function handleSearch(oEvent) {
      const oFilterBar = oEvent.getSource();
      const oEventParameters = oEvent.getParameters();
      if (oFilterBar) {
        const oConditions = oFilterBar.getFilterConditions();
        const eventParameters = this._prepareEventParameters(oFilterBar);
        this.fireInternalSearch(merge({
          conditions: oConditions
        }, oEventParameters));
        this.fireSearch(eventParameters);
      }
    };
    _proto.handleFilterChanged = function handleFilterChanged(oEvent) {
      const oFilterBar = oEvent.getSource();
      const oEventParameters = oEvent.getParameters();
      if (oFilterBar) {
        const oConditions = oFilterBar.getFilterConditions();
        const eventParameters = this._prepareEventParameters(oFilterBar);
        this.fireInternalFilterChanged(merge({
          conditions: oConditions
        }, oEventParameters));
        this.fireFilterChanged(eventParameters);
      }
    };
    _proto._prepareEventParameters = function _prepareEventParameters(oFilterBar) {
      const {
        parameters,
        filters,
        search
      } = FilterUtils.getFilters(oFilterBar);
      return {
        parameters,
        filters,
        search
      };
    }

    /**
     * Set the filter values for the given property in the filter bar.
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     *
     * @param sConditionPath The path to the property as a condition path
     * @param [sOperator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
     * @param vValues The values to be applied
     * @returns A promise for asynchronous handling
     * @public
     */;
    _proto.setFilterValues = function setFilterValues(sConditionPath, sOperator, vValues) {
      if (arguments.length === 2) {
        vValues = sOperator;
        return FilterUtils.setFilterValues(this.content, sConditionPath, vValues);
      }
      return FilterUtils.setFilterValues(this.content, sConditionPath, sOperator, vValues);
    }

    /**
     * Get the Active Filters Text Summary for the filter bar.
     *
     * @returns Active filters summary as text
     * @public
     */;
    _proto.getActiveFiltersText = function getActiveFiltersText() {
      var _oFilterBar$getAssign;
      const oFilterBar = this.content;
      return (oFilterBar === null || oFilterBar === void 0 ? void 0 : (_oFilterBar$getAssign = oFilterBar.getAssignedFiltersText()) === null || _oFilterBar$getAssign === void 0 ? void 0 : _oFilterBar$getAssign.filtersText) || "";
    }

    /**
     * Provides all the filters that are currently active
     * along with the search expression.
     *
     * @returns An array of active filters and the search expression.
     * @public
     */;
    _proto.getFilters = function getFilters() {
      return FilterUtils.getFilters(this.content);
    }

    /**
     * Triggers the API search on the filter bar.
     *
     * @returns Returns a promise which resolves if filter go is triggered successfully; otherwise gets rejected.
     * @public
     */;
    _proto.triggerSearch = async function triggerSearch() {
      const filterBar = this.content;
      try {
        if (filterBar) {
          await filterBar.waitForInitialization();
          return await filterBar.triggerSearch();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE : Buildingblock : FilterBar : ${message}`);
        throw Error(message);
      }
    };
    /**
     * Get the selection variant from the filter bar.
     *
     *
     * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
     * @public
     */
    _proto.getSelectionVariant = async function getSelectionVariant() {
      try {
        const filterBar = this.content;
        const filterState = await StateUtil.retrieveExternalState(filterBar);
        const filterObject = filterState.filter;
        const parameters = filterBar.data("parameters");
        return StateFiltersToSelectionVariant.getSelectionVariantFromConditions(filterObject, filterBar.getPropertyHelper(), parameters);
      } catch (error) {
        const id = this.getId();
        const message = error instanceof Error ? error.message : String(error);
        Log.error(`FilterBar Building Block (${id}) - get selection variant failed : ${message}`);
        throw Error(message);
      }
    }

    /**
     * Get the list of mandatory filter property names.
     *
     * @returns The list of mandatory filter property names
     */;
    _proto.getMandatoryFilterPropertyNames = function getMandatoryFilterPropertyNames() {
      const filterBar = this.content;
      return filterBar.getPropertyInfoSet().filter(function (filterProp) {
        return filterProp.required;
      }).map(function (requiredProp) {
        return requiredProp.conditionPath;
      });
    }

    /**
     * Sets {@link sap.fe.navigation.SelectionVariant} to the filter bar. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
     *
     * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the filter bar
     * @returns A promise for asynchronous handling
     * @public
     */;
    _proto.setSelectionVariant = async function setSelectionVariant(selectionVariant) {
      try {
        const filterBar = this.content,
          conditions = await this.convertSelectionVariantToStateFilters(selectionVariant);

        // Clear filter bar before applying selection varaint
        await this.clearFilterValues(filterBar);

        // State to apply
        const propertyInfos = await this._getFilterBarSupportedFields(filterBar);
        const stateToApply = svToStateFilters.getStateToApply(propertyInfos, conditions);
        return await StateUtil.applyExternalState(filterBar, stateToApply);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE : Buildingblock : FilterBar : ${message}`);
        throw Error(message);
      }
    }

    /**
     * Convert {@link sap.fe.navigation.SelectionVariant} to conditions.
     *
     * @param selectionVariant The selection variant to apply to the filter bar.
     * @returns A promise resolving to conditions
     * @private
     * @ui5-restricted sap.fe
     */;
    _proto.convertSelectionVariantToStateFilters = async function convertSelectionVariantToStateFilters(selectionVariant) {
      // Note: This method is private and restricted to usage by sap.fe(ViewState controller extension) for filter bar state scenarios.
      const filterBar = this.content;
      const propertyInfos = await this._getFilterBarSupportedFields(filterBar);
      if (!propertyInfos.length) {
        throw new Error("No valid metadata properties present for filter bar");
      }
      const filterBarInfoForConversion = this._getFilterBarInfoForConversion();
      const conditions = svToStateFilters.getStateFiltersFromSV(selectionVariant, filterBarInfoForConversion, propertyInfos) || {};
      return conditions;
    }

    /**
     * Get the filter bar info needed for conversion of selection variant to conditions.
     *
     * @returns The Filter bar info (metaModel, contextPath, use of semantic date range, all filter fields config)
     */;
    _proto._getFilterBarInfoForConversion = function _getFilterBarInfoForConversion() {
      var _filterBar$getModel;
      const filterBar = this.content,
        metaModel = (_filterBar$getModel = filterBar.getModel()) === null || _filterBar$getModel === void 0 ? void 0 : _filterBar$getModel.getMetaModel(),
        contextPath = filterBar.data("entityType"),
        useSemanticDateRange = filterBar.data("useSemanticDateRange") === "true" || filterBar.data("useSemanticDateRange") === true,
        viewDataInstance = filterBar.getModel("viewData"),
        viewData = viewDataInstance.getData(),
        config = viewData === null || viewData === void 0 ? void 0 : viewData.controlConfiguration,
        selectionFieldsConfigs = config === null || config === void 0 ? void 0 : config["@com.sap.vocabularies.UI.v1.SelectionFields"],
        filterFieldsConfig = selectionFieldsConfigs === null || selectionFieldsConfigs === void 0 ? void 0 : selectionFieldsConfigs.filterFields;
      return {
        metaModel,
        contextPath,
        useSemanticDateRange,
        filterFieldsConfig
      };
    }

    /**
     * Get the filter bar parameters for a parameterized service.
     *
     * @returns Array of parameters configured in a parameterized service
     */;
    _proto.getParameters = function getParameters() {
      const filterBar = this.content;
      const parameters = filterBar.data("parameters");
      if (parameters) {
        return Array.isArray(parameters) ? parameters : JSON.parse(parameters);
      }
      return [];
    }

    /**
     * Get supported filter field properties from the filter bar.
     *
     * @param filterBar Filter bar
     * @returns Supported filter fields in filter bar.
     */;
    _proto._getFilterBarSupportedFields = async function _getFilterBarSupportedFields(filterBar) {
      await filterBar.waitForInitialization();
      return filterBar.getControlDelegate().fetchProperties(filterBar);
    }

    /**
     * Clears all input values of visible filter fields in the filter bar.
     *
     * @param filterBar The filter bar that contains the filter field
     */;
    _proto.clearFilterValues = async function clearFilterValues(filterBar) {
      await this._clearFilterValuesWithOptions(filterBar);
      // Allow app developers to update filters after clearing
      this.fireEvent("afterClear");
    }

    /**
     * Clears all input values of visible filter fields in the filter bar with flag to indicate whether to clear Edit Filter or not.
     *
     * @param filterBar The filter bar that contains the filter field
     * @param options Options for filtering on the filter bar
     * @param options.clearEditFilter Whether to clear the edit filter or let it be default value 'All' instead
     */;
    _proto._clearFilterValuesWithOptions = async function _clearFilterValuesWithOptions(filterBar, options) {
      var _state$filter$editSta;
      if (!filterBar) {
        return;
      }
      const state = await StateUtil.retrieveExternalState(filterBar);
      const editStatePath = "$editState";
      const editStateDefaultValue = DraftEditState.ALL.id;
      const currentEditStateCondition = deepClone((_state$filter$editSta = state.filter[editStatePath]) === null || _state$filter$editSta === void 0 ? void 0 : _state$filter$editSta[0]);
      const currentEditStateIsDefault = (currentEditStateCondition === null || currentEditStateCondition === void 0 ? void 0 : currentEditStateCondition.values[0]) === editStateDefaultValue;
      const shouldClearEditFilter = options && Object.keys(options).length > 0 && options.clearEditFilter;

      // Clear all conditions
      for (const conditionPath of Object.keys(state.filter)) {
        if (!shouldClearEditFilter && conditionPath === editStatePath && currentEditStateIsDefault) {
          // Do not clear edit state condition if it is already "ALL"
          continue;
        }
        for (const condition of state.filter[conditionPath]) {
          condition.filtered = false;
        }
      }
      await StateUtil.applyExternalState(filterBar, {
        filter: state.filter
      });

      // Set edit state to 'ALL' if it wasn't before
      if (!shouldClearEditFilter && currentEditStateCondition && !currentEditStateIsDefault) {
        currentEditStateCondition.values = [editStateDefaultValue];
        await StateUtil.applyExternalState(filterBar, {
          filter: {
            [editStatePath]: [currentEditStateCondition]
          }
        });
      }

      //clear filter fields in error state
      filterBar.cleanUpAllFilterFieldsInErrorState();
    };
    return FilterBarAPI;
  }(MacroAPI), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
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
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "showMessages", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "showClearButton", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "filterFields", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "internalSearch", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "afterClear", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "internalFilterChanged", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "handleSearch", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "handleSearch"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleFilterChanged", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "handleFilterChanged"), _class2.prototype)), _class2)) || _class);
  return FilterBarAPI;
}, false);
