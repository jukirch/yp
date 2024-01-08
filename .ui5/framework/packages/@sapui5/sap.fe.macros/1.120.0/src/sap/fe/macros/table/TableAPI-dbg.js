/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/HookSupport", "sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog", "sap/fe/core/controllerextensions/routing/NavigationReason", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/PasteHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/SemanticDateOperators", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/insights/InsightsService", "sap/fe/macros/insights/TableInsightsHelper", "sap/fe/macros/table/Utils", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/core/Core", "sap/ui/core/library", "sap/ui/core/message/Message", "sap/ui/model/Filter", "../MacroAPI", "../insights/CommonInsightsHelper", "./TableHelper"], function (Log, CommonUtils, BusyLocker, HookSupport, ActivitySync, CollaborationCommon, NotApplicableContextDialog, NavigationReason, ManifestSettings, MetaModelConverter, ClassSupport, DeleteHelper, FPMHelper, PasteHelper, ResourceModelHelper, SemanticDateOperators, FilterUtils, InsightsService, TableInsightsHelper, TableUtils, MessageBox, MessageToast, Core, library, Message, Filter, MacroAPI, CommonInsightsHelper, TableHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37;
  var showGenericErrorMessage = CommonInsightsHelper.showGenericErrorMessage;
  var hasInsightActionEnabled = CommonInsightsHelper.hasInsightActionEnabled;
  var MessageType = library.MessageType;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  var convertTypes = MetaModelConverter.convertTypes;
  var CreationMode = ManifestSettings.CreationMode;
  var Activity = CollaborationCommon.Activity;
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Building block used to create a table based on the metadata provided by OData V4.
   * <br>
   * Usually, a LineItem or PresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macro:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
   * </pre>
   *
   * @alias sap.fe.macros.Table
   * @public
   */
  let TableAPI = (_dec = defineUI5Class("sap.fe.macros.table.TableAPI", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec2 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"]
  }), _dec3 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec4 = property({
    type: "object"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "string"
  }), _dec8 = property({
    type: "boolean",
    defaultValue: false
  }), _dec9 = property({
    type: "string",
    defaultValue: "ResponsiveTable",
    allowedValues: ["GridTable", "ResponsiveTable"]
  }), _dec10 = property({
    type: "boolean",
    defaultValue: true
  }), _dec11 = property({
    type: "boolean",
    defaultValue: false
  }), _dec12 = property({
    type: "boolean",
    defaultValue: false
  }), _dec13 = property({
    type: "string"
  }), _dec14 = property({
    type: "string",
    allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"]
  }), _dec15 = property({
    type: "string"
  }), _dec16 = property({
    type: "boolean",
    defaultValue: true
  }), _dec17 = property({
    type: "boolean",
    defaultValue: false
  }), _dec18 = property({
    type: "boolean",
    defaultValue: true
  }), _dec19 = property({
    type: "number"
  }), _dec20 = property({
    type: "boolean",
    defaultValue: false
  }), _dec21 = property({
    type: "string",
    defaultValue: "Fixed",
    allowedValues: ["Auto", "Fixed"]
  }), _dec22 = property({
    type: "number",
    defaultValue: 5
  }), _dec23 = aggregation({
    type: "sap.fe.macros.table.Action",
    multiple: true
  }), _dec24 = aggregation({
    type: "sap.fe.macros.table.Column",
    multiple: true
  }), _dec25 = property({
    type: "boolean",
    defaultValue: false
  }), _dec26 = property({
    type: "boolean",
    defaultValue: false
  }), _dec27 = property({
    type: "boolean",
    defaultValue: false
  }), _dec28 = property({
    type: "boolean",
    defaultValue: false
  }), _dec29 = property({
    type: "boolean",
    defaultValue: false
  }), _dec30 = event(), _dec31 = event(), _dec32 = event(), _dec33 = event(), _dec34 = property({
    type: "boolean | string",
    defaultValue: true
  }), _dec35 = property({
    type: "string",
    allowedValues: ["Control"]
  }), _dec36 = property({
    type: "boolean",
    defaultValue: true
  }), _dec37 = property({
    type: "sap.fe.macros.table.TableCreationOptions",
    defaultValue: {
      name: "Inline",
      createAtEnd: false,
      inlineCreationRowsHiddenInEditMode: false
    }
  }), _dec38 = event(), _dec39 = xmlEventHandler(), _dec40 = xmlEventHandler(), _dec41 = xmlEventHandler(), _dec42 = xmlEventHandler(), _dec43 = xmlEventHandler(), _dec44 = xmlEventHandler(), _dec45 = controllerExtensionHandler("collaborationManager", "collectAvailableCards"), _dec46 = xmlEventHandler(), _dec47 = xmlEventHandler(), _dec48 = xmlEventHandler(), _dec49 = xmlEventHandler(), _dec50 = xmlEventHandler(), _dec51 = xmlEventHandler(), _dec52 = xmlEventHandler(), _dec53 = xmlEventHandler(), _dec54 = xmlEventHandler(), _dec55 = xmlEventHandler(), _dec56 = xmlEventHandler(), _dec57 = xmlEventHandler(), _dec58 = xmlEventHandler(), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    _inheritsLoose(TableAPI, _MacroAPI);
    function TableAPI(mSettings) {
      var _this;
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      _this = _MacroAPI.call(this, mSettings, ...others) || this;
      _this.fetchedContextPaths = [];
      _initializerDefineProperty(_this, "metaPath", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "tableDefinition", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "entityTypeFullyQualifiedName", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "readOnly", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "id", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "busy", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "type", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableExport", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enablePaste", _descriptor10, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableFullScreen", _descriptor11, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBar", _descriptor12, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionMode", _descriptor13, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "header", _descriptor14, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "enableAutoColumnWidth", _descriptor15, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isOptimizedForSmallDevice", _descriptor16, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "headerVisible", _descriptor17, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "frozenColumnCount", _descriptor18, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor19, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowCountMode", _descriptor20, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowCount", _descriptor21, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "actions", _descriptor22, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "columns", _descriptor23, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataInitialized", _descriptor24, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "bindingSuspended", _descriptor25, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "outDatedBinding", _descriptor26, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "pendingRequest", _descriptor27, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "emptyRowsEnabled", _descriptor28, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "rowPress", _descriptor29, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "stateChange", _descriptor30, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "contextChange", _descriptor31, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "internalDataRequested", _descriptor32, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "personalization", _descriptor33, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantManagement", _descriptor34, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "isSearchable", _descriptor35, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "creationMode", _descriptor36, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "selectionChange", _descriptor37, _assertThisInitialized(_this));
      _this.updateFilterBar();
      if (_this.content) {
        _this.content.attachEvent("selectionChange", {}, _this.onTableSelectionChange, _assertThisInitialized(_this));
      }
      return _this;
    }

    /**
     * Defines the relative path of the property in the metamodel, based on the current contextPath.
     *
     * @public
     */
    /**
     * Gets the relevant tableAPI for a UI5 event.
     * An event can be triggered either by the inner control (the table) or the Odata listBinding
     * The first initiator is the usual one so it's managed by the MacroAPI whereas
     * the second one is specific to this API and has to managed by the TableAPI.
     *
     * @param ui5Event The UI5 event
     * @returns The TableAPI or false if not found
     * @private
     */
    TableAPI.getAPI = function getAPI(ui5Event) {
      const source = ui5Event.getSource();
      let tableAPI;
      if (source.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        var _this$instanceMap, _this$instanceMap$get;
        tableAPI = (_this$instanceMap = this.instanceMap) === null || _this$instanceMap === void 0 ? void 0 : (_this$instanceMap$get = _this$instanceMap.get(this)) === null || _this$instanceMap$get === void 0 ? void 0 : _this$instanceMap$get.find(api => {
          var _api$content;
          return ((_api$content = api.content) === null || _api$content === void 0 ? void 0 : _api$content.getRowBinding()) === source;
        });
      }
      return tableAPI || _MacroAPI.getAPI.call(this, ui5Event, "sap.fe.macros.table.TableAPI");
    }

    /**
     * Get the sort conditions query string.
     *
     * @returns The sort conditions query string
     */;
    var _proto = TableAPI.prototype;
    _proto.getSortConditionsQuery = function getSortConditionsQuery() {
      var _table$getSortConditi;
      const table = this.content;
      const sortConditions = (_table$getSortConditi = table.getSortConditions()) === null || _table$getSortConditi === void 0 ? void 0 : _table$getSortConditi.sorters;
      return sortConditions ? sortConditions.map(function (sortCondition) {
        var _table$getPropertyHel;
        const sortConditionsPath = (_table$getPropertyHel = table.getPropertyHelper().getProperty(sortCondition.name)) === null || _table$getPropertyHel === void 0 ? void 0 : _table$getPropertyHel.path;
        if (sortConditionsPath) {
          return `${sortConditionsPath}${sortCondition.descending ? " desc" : ""}`;
        }
        return "";
      }).join(",") : "";
    }

    /**
     * Gets contexts from the table that have been selected by the user.
     *
     * @returns Contexts of the rows selected by the user
     * @public
     */;
    _proto.getSelectedContexts = function getSelectedContexts() {
      return this.content.getSelectedContexts();
    }

    /**
     * Adds a message to the table.
     *
     * The message applies to the whole table and not to an individual table row.
     *
     * @param [parameters] The parameters to create the message
     * @param parameters.type Message type
     * @param parameters.message Message text
     * @param parameters.description Message description
     * @param parameters.persistent True if the message is persistent
     * @returns The ID of the message
     * @public
     */;
    _proto.addMessage = function addMessage(parameters) {
      const msgManager = this._getMessageManager();
      const oTable = this.content;
      const oMessage = new Message({
        target: oTable.getRowBinding().getResolvedPath(),
        type: parameters.type,
        message: parameters.message,
        processor: oTable.getModel(),
        description: parameters.description,
        persistent: parameters.persistent
      });
      msgManager.addMessages(oMessage);
      return oMessage.getId();
    }

    /**
     * This function will check if the table should request recommendations function.
     * The table in view should only request recommendations if
     *   1. The Page is in Edit mode
     *   2. Table is not read only
     *   3. It has annotation for Common.RecommendedValuesFunction
     *   4. View is not ListReport, for OP/SubOP and forward views recommendations should be requested.
     *
     * @param oEvent
     * @returns True if recommendations needs to be requested
     */;
    _proto.checkIfRecommendationRelevant = function checkIfRecommendationRelevant(oEvent) {
      const isTableReadOnly = this.getProperty("readOnly");
      const isEditable = this.getModel("ui").getProperty("/isEditable");
      const view = CommonUtils.getTargetView(this);
      const viewData = view.getViewData();
      // request for action only if we are in OP/SubOP and in Edit mode, also table is not readOnly
      if (!isTableReadOnly && isEditable && viewData.converterType !== "ListReport") {
        return true;
      }
      return false;
    }

    /**
     * Removes a message from the table.
     *
     * @param id The id of the message
     * @public
     */;
    _proto.removeMessage = function removeMessage(id) {
      const msgManager = this._getMessageManager();
      const messages = msgManager.getMessageModel().getData();
      const result = messages.find(e => e.id === id);
      if (result) {
        msgManager.removeMessages(result);
      }
    }

    /**
     * Requests a refresh of the table.
     *
     * @public
     */;
    _proto.refresh = function refresh() {
      this.content.getRowBinding().refresh();
    }

    /**
     * Sets the count in a pending state.
     *
     */;
    _proto.setQuickFilterCountsAsLoading = function setQuickFilterCountsAsLoading() {
      const table = this.content,
        internalContext = table.getBindingContext("internal"),
        selector = table.getQuickFilter(),
        quickFilterCounts = {};
      for (const k in selector.getItems()) {
        quickFilterCounts[k] = "...";
      }
      internalContext.setProperty("quickFilters", {
        counts: quickFilterCounts
      });
    }

    /**
     * Updates the count of the selected quickFilter.
     *
     */;
    _proto.refreshSelectedQuickFilterCount = function refreshSelectedQuickFilterCount() {
      var _this$getTableDefinit, _this$getTableDefinit2;
      const table = this.content;
      const count = table.getRowBinding().getCount();
      const selector = table.getQuickFilter();
      if (selector && (_this$getTableDefinit = this.getTableDefinition().control.filters) !== null && _this$getTableDefinit !== void 0 && (_this$getTableDefinit2 = _this$getTableDefinit.quickFilters) !== null && _this$getTableDefinit2 !== void 0 && _this$getTableDefinit2.showCounts && count !== undefined) {
        const itemIndex = selector.getItems().findIndex(selectorItem => selectorItem.getKey() === selector.getSelectedKey());
        if (itemIndex > -1) {
          var _table$getBindingCont;
          (_table$getBindingCont = table.getBindingContext("internal")) === null || _table$getBindingCont === void 0 ? void 0 : _table$getBindingCont.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
        }
      }
    }

    /**
     * Updates the counts of the unselected quickFilters.
     *
     * @returns  Promise resolves once the count are updated
     */;
    _proto.refreshUnSelectedQuickFilterCounts = async function refreshUnSelectedQuickFilterCounts() {
      var _CommonUtils$getTarge, _getChartControl, _ref;
      const table = this.content,
        selector = table.getQuickFilter(),
        items = selector.getItems(),
        internalContext = table.getBindingContext("internal"),
        controller = (_CommonUtils$getTarge = CommonUtils.getTargetView(this)) === null || _CommonUtils$getTarge === void 0 ? void 0 : _CommonUtils$getTarge.getController(),
        chart = (_getChartControl = (_ref = controller).getChartControl) === null || _getChartControl === void 0 ? void 0 : _getChartControl.call(_ref),
        chartAPI = chart && chart.getParent(),
        setItemCounts = async item => {
          const itemKey = item.getKey();
          const itemFilterInfos = CommonUtils.getFiltersInfoForSV(table, itemKey);
          const count = await TableUtils.getListBindingForCount(table, table.getBindingContext(), {
            batchGroupId: "$auto",
            additionalFilters: [...baseTableFilters, ...itemFilterInfos.filters]
          });
          const itemIndex = items.findIndex(selectorItem => selectorItem.getKey() === itemKey);
          if (itemIndex > -1) {
            internalContext.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
          }
        };
      const chartFilter = chartAPI && chartAPI.hasSelections() && chartAPI.getFilter();
      const baseTableFilters = TableUtils.getHiddenFilters(table);
      if (chartFilter) {
        baseTableFilters.push(chartFilter);
      }
      const bindingPromises = items.filter(item => item.getKey() !== selector.getSelectedKey()).map(async item => setItemCounts(item));
      try {
        await Promise.all(bindingPromises);
      } catch (error) {
        Log.error("Error while retrieving the binding promises", error);
      }
    };
    _proto._getMessageManager = function _getMessageManager() {
      return sap.ui.getCore().getMessageManager();
    }

    /**
     * An event triggered when the selection in the table changes.
     *
     * @public
     */;
    _proto._getRowBinding = function _getRowBinding() {
      const oTable = this.getContent();
      return oTable.getRowBinding();
    };
    _proto.getCounts = function getCounts() {
      const oTable = this.getContent();
      return TableUtils.getListBindingForCount(oTable, oTable.getBindingContext(), {
        batchGroupId: !this.getProperty("bindingSuspended") ? oTable.data("batchGroupId") : "$auto",
        additionalFilters: TableUtils.getHiddenFilters(oTable)
      }).then(iValue => {
        return TableUtils.getCountFormatted(iValue);
      }).catch(() => {
        return "0";
      });
    }

    /**
     * Handles the context change on the table.
     * An event is fired to propagate the OdataListBinding event and the enablement
     * of the creation row is calculated.
     *
     * @param ui5Event The UI5 event
     */;
    _proto.onContextChange = function onContextChange(ui5Event) {
      this.fireEvent("contextChange", ui5Event.getParameters());
      this.setFastCreationRowEnablement();
      this.refreshSelectedQuickFilterCount();
    }

    /**
     * Handler for the onFieldLiveChange event.
     *
     * @name onFieldLiveChange
     * @param ui5Event The event object passed by the onFieldLiveChange event
     */;
    _proto.onFieldLiveChange = function onFieldLiveChange(ui5Event) {
      const field = ui5Event.getSource(),
        bindingContext = field.getBindingContext(),
        binding = bindingContext.getBinding();
      // creation of a new inactive row if relevant
      if (bindingContext.isInactive()) {
        const table = this === null || this === void 0 ? void 0 : this.content;
        this === null || this === void 0 ? void 0 : this.createEmptyRows(binding, table, true);
      }
    }

    /**
     * Handles the change on a quickFilter
     * The table is rebound if the FilterBar is not suspended and update the AppState.
     *
     */;
    _proto.onQuickFilterSelectionChange = function onQuickFilterSelectionChange() {
      var _filterBar$getSuspend, _CommonUtils$getTarge2, _CommonUtils$getTarge3;
      const table = this.content;
      // Rebind the table to reflect the change in quick filter key.
      // We don't rebind the table if the filterBar for the table is suspended
      // as rebind will be done when the filterBar is resumed
      const filterBarID = table.getFilter();
      const filterBar = filterBarID && Core.byId(filterBarID);
      if (!(filterBar !== null && filterBar !== void 0 && (_filterBar$getSuspend = filterBar.getSuspendSelection) !== null && _filterBar$getSuspend !== void 0 && _filterBar$getSuspend.call(filterBar))) {
        table.rebind();
      }
      (_CommonUtils$getTarge2 = CommonUtils.getTargetView(this)) === null || _CommonUtils$getTarge2 === void 0 ? void 0 : (_CommonUtils$getTarge3 = _CommonUtils$getTarge2.getController()) === null || _CommonUtils$getTarge3 === void 0 ? void 0 : _CommonUtils$getTarge3.getExtensionAPI().updateAppState();
    };
    _proto.onTableRowPress = function onTableRowPress(oEvent, oController, oContext, mParameters) {
      // prevent navigation to an empty row
      if (oContext && oContext.isInactive() && oContext.isTransient()) {
        return false;
      }
      // In the case of an analytical table, if we're trying to navigate to a context corresponding to a visual group or grand total
      // --> Cancel navigation
      if (this.getTableDefinition().enableAnalytics && oContext && oContext.isA("sap.ui.model.odata.v4.Context") && typeof oContext.getProperty("@$ui5.node.isExpanded") === "boolean") {
        return false;
      } else {
        const navigationParameters = Object.assign({}, mParameters, {
          reason: NavigationReason.RowPress
        });
        oController._routing.navigateForwardToContext(oContext, navigationParameters);
      }
    };
    _proto.onInternalPatchCompleted = function onInternalPatchCompleted() {
      // BCP: 2380023090
      // We handle enablement of Delete for the table here.
      // EditFlow.ts#handlePatchSent is handling the action enablement.
      const internalModelContext = this.getBindingContext("internal");
      const selectedContexts = this.getSelectedContexts();
      DeleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, selectedContexts);
    };
    _proto.onInternalDataReceived = function onInternalDataReceived(oEvent) {
      const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
      if (isRecommendationRelevant) {
        const responseContextsArray = oEvent.getSource().getAllCurrentContexts();
        const newContexts = responseContextsArray.filter(context => {
          return !this.fetchedContextPaths.includes(context.getPath());
        });
        this.getController().recommendations.fetchAndApplyRecommendations(newContexts);
      }
      if (oEvent.getParameter("error")) {
        this.getController().messageHandler.showMessageDialog();
      }
    };
    _proto.collectAvailableCards = function collectAvailableCards(cards) {
      const actionToolbarItems = this.content.getActions();
      if (hasInsightActionEnabled(actionToolbarItems)) {
        cards.push((async () => {
          const card = await this.getCardManifestTable();
          return {
            card: card,
            title: this.getTableDefinition().headerInfoTypeName ?? "",
            callback: this.onAddCardToCollaborationManagerCallback.bind(this)
          };
        })());
      }
    };
    _proto.onInternalDataRequested = function onInternalDataRequested(oEvent) {
      var _this$getTableDefinit3, _this$getTableDefinit4;
      const table = this.content;
      this.setProperty("dataInitialized", true);
      const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
      if (isRecommendationRelevant) {
        const responseContextsArray = oEvent.getSource().getAllCurrentContexts();
        this.fetchedContextPaths = responseContextsArray.map(context => context === null || context === void 0 ? void 0 : context.getPath());
      }
      this.fireEvent("internalDataRequested", oEvent.getParameters());
      if (table.getQuickFilter() && (_this$getTableDefinit3 = this.getTableDefinition().control.filters) !== null && _this$getTableDefinit3 !== void 0 && (_this$getTableDefinit4 = _this$getTableDefinit3.quickFilters) !== null && _this$getTableDefinit4 !== void 0 && _this$getTableDefinit4.showCounts) {
        this.setQuickFilterCountsAsLoading();
        this.refreshUnSelectedQuickFilterCounts();
      }
    }

    /**
     * Handles the Paste operation.
     * @param evt The event
     * @param controller The page controller
     *
     */;
    _proto.onPaste = async function onPaste(evt, controller) {
      const rawPastedData = evt.getParameter("data"),
        source = evt.getSource(),
        table = source.isA("sap.ui.mdc.Table") ? source : source.getParent(),
        internalContext = table.getBindingContext("internal");

      // If paste is disable or if we're not in edit mode, we can't paste anything
      if (!this.tableDefinition.control.enablePaste || !this.getModel("ui").getProperty("/isEditable")) {
        return;
      }

      //This code is executed only in case of TreeTable
      if (internalContext !== null && internalContext !== void 0 && internalContext.getProperty("pastableContexts")) {
        const targetContextPath = internalContext.getProperty("pastableContexts")[0];
        const newParentContext = table.getSelectedContexts()[0];
        const targetContext = table.getRowBinding().getCurrentContexts().find(context => context.getPath() === targetContextPath);
        if (!targetContext) {
          Log.error("The Cut operation is unsuccessful because the relevant context is no longer available");
        } else {
          try {
            await targetContext.move({
              parent: newParentContext
            });
          } catch (e) {
            Log.error("The move context fails ", e);
          }
          internalContext.setProperty("pastableContexts", []);
          return;
        }
      }

      //This code is executed for tables excepted TreeTable
      if (table.getEnablePaste() === true) {
        PasteHelper.pasteData(rawPastedData, table, controller);
      } else {
        const resourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.core");
        MessageBox.error(resourceModel.getText("T_OP_CONTROLLER_SAPFE_PASTE_DISABLED_MESSAGE"), {
          title: resourceModel.getText("C_COMMON_SAPFE_ERROR")
        });
      }
    }

    /**
     * Handles the Cut operation.
     * @param evt The UI5 event
     *
     */;
    _proto.onCut = function onCut(evt) {
      const table = evt.getSource().getParent();
      const internalContext = table.getBindingContext("internal");
      if (table.getSelectedContexts().length > 1) {
        Log.error("Multi cutting is not supported");
        return;
      }
      internalContext.setProperty("pastableContexts", table.getSelectedContexts().map(context => context.getPath()));
      MessageToast.show(ResourceModelHelper.getResourceModel(table).getText("M_CUT_READY"));
      table.clearSelection();
      internalContext.setProperty("cutableContexts", []);
    }

    // This event will allow us to intercept the export before is triggered to cover specific cases
    // that couldn't be addressed on the propertyInfos for each column.
    // e.g. Fixed Target Value for the datapoints
    ;
    _proto.onBeforeExport = function onBeforeExport(exportEvent) {
      var _exportEvent$getParam;
      const isSplitMode = !!((_exportEvent$getParam = exportEvent.getParameter("userExportSettings")) !== null && _exportEvent$getParam !== void 0 && _exportEvent$getParam.splitCells);
      const tableController = exportEvent.getSource(),
        exportSettings = exportEvent.getParameter("exportSettings"),
        tableDefinition = this.getTableDefinition();
      TableAPI.updateExportSettings(exportSettings, tableDefinition, tableController, isSplitMode);
    }

    /**
     * Handles the MDC DataStateIndicator plugin to display messageStrip on a table.
     *
     * @param oMessage
     * @param oTable
     * @name dataStateFilter
     * @returns Whether to render the messageStrip visible
     */;
    TableAPI.dataStateIndicatorFilter = function dataStateIndicatorFilter(oMessage, oTable) {
      var _oTable$getBindingCon;
      const sTableContextBindingPath = (_oTable$getBindingCon = oTable.getBindingContext()) === null || _oTable$getBindingCon === void 0 ? void 0 : _oTable$getBindingCon.getPath();
      const sTableRowBinding = (sTableContextBindingPath ? `${sTableContextBindingPath}/` : "") + oTable.getRowBinding().getPath();
      return sTableRowBinding === oMessage.getTargets()[0] ? true : false;
    }

    /**
     * This event handles the DataState of the DataStateIndicator plugin from MDC on a table.
     * It's fired when new error messages are sent from the backend to update row highlighting.
     *
     * @name onDataStateChange
     * @param evt Event object
     */;
    _proto.onDataStateChange = function onDataStateChange(evt) {
      const dataStateIndicator = evt.getSource();
      const filteredMessages = evt.getParameter("filteredMessages");
      if (filteredMessages) {
        const hiddenMandatoryProperties = filteredMessages.map(msg => {
          const technicalDetails = msg.getTechnicalDetails() || {};
          return technicalDetails.emptyRowMessage === true && technicalDetails.missingColumn;
        }).filter(hiddenProperty => !!hiddenProperty);
        if (hiddenMandatoryProperties.length) {
          const messageStripError = sap.ui.getCore().getLibraryResourceBundle("sap.fe.macros").getText(hiddenMandatoryProperties.length === 1 ? "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN" : "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN_PLURAL", [hiddenMandatoryProperties.join(", ")]);
          dataStateIndicator.showMessage(messageStripError, "Error");
          evt.preventDefault();
        }
        const internalModel = dataStateIndicator.getModel("internal");
        internalModel.setProperty("filteredMessages", filteredMessages, dataStateIndicator.getBindingContext("internal"));
      }
    }

    /**
     * Updates the columns to be exported of a table.
     *
     * @param exportSettings The table export settings
     * @param tableDefinition The table definition from the table converter
     * @param tableController The table controller
     * @param isSplitMode Defines if the export has been launched using split mode
     * @returns The updated columns to be exported
     */;
    TableAPI.updateExportSettings = function updateExportSettings(exportSettings, tableDefinition, tableController, isSplitMode) {
      //Set static sizeLimit during export
      const columns = tableDefinition.columns;
      if (!tableDefinition.enableAnalytics && (tableDefinition.control.type === "ResponsiveTable" || tableDefinition.control.type === "GridTable")) {
        exportSettings.dataSource.sizeLimit = 1000;
      }
      if (exportSettings.fileType === "PDF") {
        //Remove the multiValue field from the PDF
        exportSettings.workbook.columns = exportSettings.workbook.columns.filter(column => {
          var _Core$byId;
          const columProperty = (_Core$byId = Core.byId(column.columnId)) === null || _Core$byId === void 0 ? void 0 : _Core$byId.getPropertyKey();
          if (columProperty) {
            var _tableDefinition$colu;
            return ((_tableDefinition$colu = tableDefinition.columns.find(columnDefinition => columnDefinition.name === columProperty)) === null || _tableDefinition$colu === void 0 ? void 0 : _tableDefinition$colu.isMultiValue) !== true;
          }
          return true;
        });
      }
      const exportColumns = exportSettings.workbook.columns;
      for (let index = exportColumns.length - 1; index >= 0; index--) {
        const exportColumn = exportColumns[index];
        const resourceBundle = Core.getLibraryResourceBundle("sap.fe.macros");
        exportColumn.label = getLocalizedText(exportColumn.label, tableController);
        //translate boolean values
        if (exportColumn.type === "Boolean") {
          exportColumn.falseValue = resourceBundle.getText("no");
          exportColumn.trueValue = resourceBundle.getText("yes");
        }
        const targetValueColumn = columns === null || columns === void 0 ? void 0 : columns.find(column => {
          if (isSplitMode) {
            return this.columnWithTargetValueToBeAdded(column, exportColumn);
          } else {
            return false;
          }
        });
        if (targetValueColumn) {
          const columnToBeAdded = {
            label: resourceBundle.getText("TargetValue"),
            property: Array.isArray(exportColumn.property) ? exportColumn.property : [exportColumn.property],
            template: targetValueColumn.exportDataPointTargetValue
          };
          exportColumns.splice(index + 1, 0, columnToBeAdded);
        }
      }
      return exportSettings;
    }

    /**
     * Defines if a column that is to be exported and contains a DataPoint with a fixed target value needs to be added.
     *
     * @param column The column from the annotations column
     * @param columnExport The column to be exported
     * @returns `true` if the referenced column has defined a targetValue for the dataPoint, false else
     * @private
     */;
    TableAPI.columnWithTargetValueToBeAdded = function columnWithTargetValueToBeAdded(column, columnExport) {
      var _column$propertyInfos;
      let columnNeedsToBeAdded = false;
      if (column.exportDataPointTargetValue && ((_column$propertyInfos = column.propertyInfos) === null || _column$propertyInfos === void 0 ? void 0 : _column$propertyInfos.length) === 1) {
        //Add TargetValue column when exporting on split mode
        if (column.relativePath === columnExport.property || columnExport.property[0] === column.propertyInfos[0] || columnExport.property.includes(column.relativePath) || columnExport.property.includes(column.name)) {
          // part of a FieldGroup or from a lineItem or from a column on the entitySet
          delete columnExport.template;
          columnNeedsToBeAdded = true;
        }
      }
      return columnNeedsToBeAdded;
    };
    _proto.resumeBinding = function resumeBinding(bRequestIfNotInitialized) {
      this.setProperty("bindingSuspended", false);
      if (bRequestIfNotInitialized && !this.getDataInitialized() || this.getProperty("outDatedBinding")) {
        var _getContent;
        this.setProperty("outDatedBinding", false);
        (_getContent = this.getContent()) === null || _getContent === void 0 ? void 0 : _getContent.rebind();
      }
    };
    _proto.refreshNotApplicableFields = function refreshNotApplicableFields(oFilterControl) {
      const oTable = this.getContent();
      return FilterUtils.getNotApplicableFilters(oFilterControl, oTable);
    };
    _proto.suspendBinding = function suspendBinding() {
      this.setProperty("bindingSuspended", true);
    };
    _proto.invalidateContent = function invalidateContent() {
      this.setProperty("dataInitialized", false);
      this.setProperty("outDatedBinding", false);
    }

    /**
     * Sets the enablement of the creation row.
     *
     * @private
     */;
    _proto.setFastCreationRowEnablement = function setFastCreationRowEnablement() {
      const table = this.content;
      const fastCreationRow = table.getCreationRow();
      if (fastCreationRow && !fastCreationRow.getBindingContext()) {
        const tableBinding = table.getRowBinding();
        const bindingContext = tableBinding.getContext();
        if (bindingContext) {
          TableHelper.enableFastCreationRow(fastCreationRow, tableBinding.getPath(), bindingContext, bindingContext.getModel(), table.getModel("ui").getProperty("/isEditable"));
        }
      }
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     *
     * @returns Undefined if the card preview is rendered.
     */;
    _proto.onAddCardToInsightsPressed = async function onAddCardToInsightsPressed() {
      try {
        const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
        const insightsParams = await TableInsightsHelper.createTableCardParams(this, insightsRelevantColumns);
        if (insightsParams) {
          const message = insightsParams.parameters.isNavigationEnabled ? undefined : {
            type: "Warning",
            text: this.createNavigationErrorMessage(this.content)
          };
          InsightsService.showInsightsCardPreview(insightsParams, message);
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    }

    /**
     * Gets the card manifest optimized for the table case.
     *
     * @returns Promise of CardManifest
     */;
    _proto.getCardManifestTable = async function getCardManifestTable() {
      const insightsRelevantColumns = TableInsightsHelper.getInsightsRelevantColumns(this);
      const insightsParams = await TableInsightsHelper.createTableCardParams(this, insightsRelevantColumns);
      return InsightsService.getCardManifest(insightsParams);
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     *
     * @param card The card manifest to be used for the callback
     * @returns Undefined if card preview is rendered.
     */;
    _proto.onAddCardToCollaborationManagerCallback = async function onAddCardToCollaborationManagerCallback(card) {
      try {
        if (card) {
          await InsightsService.showCollaborationManagerCardPreview(card, this.getController().collaborationManager.getService());
          return;
        }
      } catch (e) {
        showGenericErrorMessage(this.content);
        Log.error(e);
      }
    };
    _proto.createNavigationErrorMessage = function createNavigationErrorMessage(scope) {
      const resourceModel = ResourceModelHelper.getResourceModel(scope);
      return resourceModel.getText("M_ROW_LEVEL_NAVIGATION_DISABLED_MSG_REASON_EXTERNAL_NAVIGATION_CONFIGURED");
    };
    _proto.onMassEditButtonPressed = function onMassEditButtonPressed(oEvent, pageController) {
      const oTable = this.content;
      if (pageController && pageController.massEdit) {
        pageController.massEdit.openMassEditDialog(oTable);
      } else {
        Log.warning("The Controller is not enhanced with Mass Edit functionality");
      }
    };
    _proto.onTableSelectionChange = function onTableSelectionChange(oEvent) {
      this.fireEvent("selectionChange", oEvent.getParameters());
    };
    _proto.onActionPress = async function onActionPress(oEvent, pageController, actionName, parameters) {
      parameters.model = oEvent.getSource().getModel();
      let executeAction = true;
      if (parameters.notApplicableContexts && parameters.notApplicableContexts.length > 0) {
        // If we have non applicable contexts, we need to open a dialog to ask the user if he wants to continue
        const convertedMetadata = convertTypes(parameters.model.getMetaModel());
        const entityType = convertedMetadata.resolvePath(this.entityTypeFullyQualifiedName).target;
        const myUnapplicableContextDialog = new NotApplicableContextDialog({
          entityType: entityType,
          notApplicableContexts: parameters.notApplicableContexts,
          title: parameters.label,
          resourceModel: getResourceModel(this)
        });
        parameters.contexts = parameters.applicableContexts;
        executeAction = await myUnapplicableContextDialog.open(this);
      }
      if (executeAction) {
        // Direct execution of the action
        try {
          return await pageController.editFlow.invokeAction(actionName, parameters);
        } catch (e) {
          Log.info(e);
        }
      }
    }

    /**
     * Expose the internal table definition for external usage in delegate.
     *
     * @returns The tableDefinition
     */;
    _proto.getTableDefinition = function getTableDefinition() {
      return this.tableDefinition;
    }

    /**
     * connect the filter to the tableAPI if required
     *
     * @private
     * @alias sap.fe.macros.TableAPI
     */;
    _proto.updateFilterBar = function updateFilterBar() {
      const table = this.getContent();
      const filterBarRefId = this.getFilterBar();
      if (table && filterBarRefId && table.getFilter() !== filterBarRefId) {
        this._setFilterBar(filterBarRefId);
      }
    }

    /**
     * Sets the filter depending on the type of filterBar.
     *
     * @param filterBarRefId Id of the filter bar
     * @private
     * @alias sap.fe.macros.TableAPI
     */;
    _proto._setFilterBar = function _setFilterBar(filterBarRefId) {
      var _CommonUtils$getTarge4;
      const table = this.getContent();

      // 'filterBar' property of macro:Table(passed as customData) might be
      // 1. A localId wrt View(FPM explorer example).
      // 2. Absolute Id(this was not supported in older versions).
      // 3. A localId wrt FragmentId(when an XMLComposite or Fragment is independently processed) instead of ViewId.
      //    'filterBar' was supported earlier as an 'association' to the 'mdc:Table' control inside 'macro:Table' in prior versions.
      //    In newer versions 'filterBar' is used like an association to 'macro:TableAPI'.
      //    This means that the Id is relative to 'macro:TableAPI'.
      //    This scenario happens in case of FilterBar and Table in a custom sections in OP of FEV4.

      const tableAPIId = this === null || this === void 0 ? void 0 : this.getId();
      const tableAPILocalId = this.data("tableAPILocalId");
      const potentialfilterBarId = tableAPILocalId && filterBarRefId && tableAPIId && tableAPIId.replace(new RegExp(tableAPILocalId + "$"), filterBarRefId); // 3

      const filterBar = ((_CommonUtils$getTarge4 = CommonUtils.getTargetView(this)) === null || _CommonUtils$getTarge4 === void 0 ? void 0 : _CommonUtils$getTarge4.byId(filterBarRefId)) || Core.byId(filterBarRefId) || Core.byId(potentialfilterBarId);
      if (filterBar) {
        if (filterBar.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
          table.setFilter(`${filterBar.getId()}-content`);
        } else if (filterBar.isA("sap.ui.mdc.FilterBar")) {
          table.setFilter(filterBar.getId());
        }
      }
    };
    _proto.checkIfColumnExists = function checkIfColumnExists(aFilteredColummns, columnName) {
      return aFilteredColummns.some(function (oColumn) {
        if ((oColumn === null || oColumn === void 0 ? void 0 : oColumn.columnName) === columnName && oColumn !== null && oColumn !== void 0 && oColumn.sColumnNameVisible || (oColumn === null || oColumn === void 0 ? void 0 : oColumn.sTextArrangement) !== undefined && (oColumn === null || oColumn === void 0 ? void 0 : oColumn.sTextArrangement) === columnName) {
          return columnName;
        }
      });
    };
    _proto.getIdentifierColumn = function getIdentifierColumn() {
      const oTable = this.getContent();
      const headerInfoTitlePath = this.getTableDefinition().headerInfoTitle;
      const oMetaModel = oTable && oTable.getModel().getMetaModel(),
        sCurrentEntitySetName = oTable.data("metaPath");
      const aTechnicalKeys = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/$Key`);
      const aFilteredTechnicalKeys = [];
      if (aTechnicalKeys && aTechnicalKeys.length > 0) {
        aTechnicalKeys.forEach(function (technicalKey) {
          if (technicalKey !== "IsActiveEntity") {
            aFilteredTechnicalKeys.push(technicalKey);
          }
        });
      }
      const semanticKeyColumns = this.getTableDefinition().semanticKeys;
      const aVisibleColumns = [];
      const aFilteredColummns = [];
      const aTableColumns = oTable.getColumns();
      aTableColumns.forEach(function (oColumn) {
        const column = oColumn === null || oColumn === void 0 ? void 0 : oColumn.getDataProperty();
        aVisibleColumns.push(column);
      });
      aVisibleColumns.forEach(function (oColumn) {
        var _oTextArrangement$Co, _oTextArrangement$Co2;
        const oTextArrangement = oMetaModel.getObject(`${sCurrentEntitySetName}/$Type/${oColumn}@`);
        const sTextArrangement = oTextArrangement && ((_oTextArrangement$Co = oTextArrangement["@com.sap.vocabularies.Common.v1.Text"]) === null || _oTextArrangement$Co === void 0 ? void 0 : _oTextArrangement$Co.$Path);
        const sTextPlacement = oTextArrangement && ((_oTextArrangement$Co2 = oTextArrangement["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]) === null || _oTextArrangement$Co2 === void 0 ? void 0 : _oTextArrangement$Co2.$EnumMember);
        aFilteredColummns.push({
          columnName: oColumn,
          sTextArrangement: sTextArrangement,
          sColumnNameVisible: !(sTextPlacement === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly")
        });
      });
      let column;
      if (headerInfoTitlePath !== undefined && this.checkIfColumnExists(aFilteredColummns, headerInfoTitlePath)) {
        column = headerInfoTitlePath;
      } else if (semanticKeyColumns !== undefined && semanticKeyColumns.length === 1 && this.checkIfColumnExists(aFilteredColummns, semanticKeyColumns[0])) {
        column = semanticKeyColumns[0];
      } else if (aFilteredTechnicalKeys !== undefined && aFilteredTechnicalKeys.length === 1 && this.checkIfColumnExists(aFilteredColummns, aFilteredTechnicalKeys[0])) {
        column = aFilteredTechnicalKeys[0];
      }
      return column;
    }

    /**
     * EmptyRowsEnabled setter.
     *
     * @param enablement
     */;
    _proto.setEmptyRowsEnabled = function setEmptyRowsEnabled(enablement) {
      this.setProperty("emptyRowsEnabled", enablement);
      this.setUpEmptyRows(this.content);
    }

    /**
     * Handles the CreateActivate event from the ODataListBinding.
     *
     * @param activateEvent The event sent by the binding
     */;
    _proto.handleCreateActivate = async function handleCreateActivate(activateEvent) {
      const activatedContext = activateEvent.getParameter("context");
      // we start by asking to recreate an empty row (if live change has already done it this won't have any effect)
      // but we do not wait
      this.createEmptyRows(activateEvent.getSource(), this.content, true);
      if (!this.validateEmptyRow(activatedContext)) {
        activateEvent.preventDefault();
        return;
      }
      try {
        const transientPath = activatedContext.getPath();
        try {
          await (activatedContext.created() ?? Promise.resolve());
        } catch (e) {
          Log.warning(`Failed to activate context ${activatedContext.getPath()}`);
          return;
        }
        const content = activatedContext.getPath();
        const view = CommonUtils.getTargetView(this);
        // Send notification to other users only after the creation has been finalized
        ActivitySync.send(view, {
          action: Activity.Create,
          content
        });
        // Since the path of the context has changed during activation, we need to update all collaboration locks
        // that were using the transient path
        ActivitySync.updateLocksForContextPath(view, transientPath, activatedContext.getPath());
      } catch (error) {
        Log.error("Failed to activate new row -", error);
      }
    };
    _proto.setUpEmptyRows = async function setUpEmptyRows(table) {
      var _this$tableDefinition;
      let createButtonWasPressed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (((_this$tableDefinition = this.tableDefinition.control) === null || _this$tableDefinition === void 0 ? void 0 : _this$tableDefinition.creationMode) !== CreationMode.InlineCreationRows) {
        return;
      }
      const uiModel = table.getModel("ui");
      if (!uiModel) {
        return;
      }
      if (uiModel.getProperty("/isEditablePending")) {
        // The edit mode is still being computed, so we wait until this computation is done before checking its value
        const watchBinding = uiModel.bindProperty("/isEditablePending");
        await new Promise(resolve => {
          const fnHandler = () => {
            watchBinding.detachChange(fnHandler);
            watchBinding.destroy();
            resolve();
          };
          watchBinding.attachChange(fnHandler);
        });
      }
      const binding = table.getRowBinding();
      const bindingHeaderContext = binding === null || binding === void 0 ? void 0 : binding.getHeaderContext();
      if (binding && binding.isResolved() && binding.isLengthFinal() && bindingHeaderContext) {
        var _this$tableDefinition2, _table$getBindingCont2;
        const contextPath = bindingHeaderContext.getPath();
        if (!this.emptyRowsEnabled) {
          this.removeEmptyRowsMessages();
          return this._deleteEmptyRows(binding, contextPath);
        }
        if (!uiModel.getProperty("/isEditable")) {
          return;
        }
        if ((_this$tableDefinition2 = this.tableDefinition.control) !== null && _this$tableDefinition2 !== void 0 && _this$tableDefinition2.inlineCreationRowsHiddenInEditMode && !((_table$getBindingCont2 = table.getBindingContext("ui")) !== null && _table$getBindingCont2 !== void 0 && _table$getBindingCont2.getProperty("createMode")) && !createButtonWasPressed) {
          return;
        }
        const inactiveContext = binding.getAllCurrentContexts().find(function (context) {
          // when this is called from controller code we need to check that inactive contexts are still relative to the current table context
          return context.isInactive() && context.getPath().startsWith(contextPath);
        });
        if (!inactiveContext) {
          this.removeEmptyRowsMessages();
          await this.createEmptyRows(binding, table);
        }
      }
    }

    /**
     * Deletes inactive rows from the table listBinding.
     *
     * @param binding
     * @param contextPath
     */;
    _proto._deleteEmptyRows = function _deleteEmptyRows(binding, contextPath) {
      for (const context of binding.getAllCurrentContexts()) {
        if (context.isInactive() && context.getPath().startsWith(contextPath)) {
          context.delete();
        }
      }
    }

    /**
     * Returns the current number of inactive contexts within the list binding.
     *
     * @param binding Data list binding
     * @returns The number of inactive contexts
     */;
    _proto.getInactiveContextNumber = function getInactiveContextNumber(binding) {
      return binding.getAllCurrentContexts().filter(context => context.isInactive()).length;
    }

    /**
     * Handles the validation of the empty row.
     *
     * @param context The context of the empty row
     * @returns The validation status
     */;
    _proto.validateEmptyRow = function validateEmptyRow(context) {
      const requiredProperties = this.getTableDefinition().annotation.requiredProperties;
      if (requiredProperties !== null && requiredProperties !== void 0 && requiredProperties.length) {
        this.removeEmptyRowsMessages(context);
        const missingProperties = requiredProperties.filter(requiredProperty => !context.getObject(requiredProperty));
        if (missingProperties.length) {
          const resourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.macros");
          const messages = [];
          let displayedColumn;
          for (const missingProperty of missingProperties) {
            let errorMessage;
            const missingColumn = this.getTableDefinition().columns.find(tableColumn => tableColumn.relativePath === missingProperty || tableColumn.propertyInfos && tableColumn.propertyInfos.includes(missingProperty));
            if (!missingColumn) {
              errorMessage = resourceModel.getText("M_TABLE_EMPTYROW_MANDATORY", [missingProperty]);
            } else {
              var _displayedColumn;
              displayedColumn = this.content.getColumns().find(mdcColumn => mdcColumn.getPropertyKey() === missingColumn.name);
              errorMessage = resourceModel.getText(displayedColumn ? "M_TABLE_EMPTYROW_MANDATORY" : "M_TABLE_EMPTYROW_MANDATORY_HIDDEN", [((_displayedColumn = displayedColumn) === null || _displayedColumn === void 0 ? void 0 : _displayedColumn.getHeader()) || missingColumn.label]);
            }
            messages.push(new Message({
              message: errorMessage,
              processor: this.getModel(),
              type: MessageType.Error,
              technical: false,
              persistent: true,
              technicalDetails: {
                tableId: this.content.getId(),
                // Need to do it since handleCreateActivate can be triggered multiple times (extra properties set by value help) before controlIds are set on the message
                emptyRowMessage: true,
                missingColumn: displayedColumn ? undefined : missingProperty // needed to change the messageStrip message
              },

              target: `${context === null || context === void 0 ? void 0 : context.getPath()}/${missingProperty}`
            }));
          }
          Core.getMessageManager().addMessages(messages);
          return false;
        }
      }
      return true;
    }

    /**
     * Removes the messages related to the empty rows.
     *
     * @param inactiveContext The context of the empty row, if not provided the messages of all empty rows are removed
     */;
    _proto.removeEmptyRowsMessages = function removeEmptyRowsMessages(inactiveContext) {
      const messageManager = Core.getMessageManager();
      messageManager.removeMessages(messageManager.getMessageModel().getData().filter(msg => {
        const technicalDetails = msg.getTechnicalDetails() || {};
        return (inactiveContext ? msg.getTargets().some(value => value.startsWith(inactiveContext.getPath())) : true) && technicalDetails.emptyRowMessage && technicalDetails.tableId === this.content.getId();
      }));
    }

    /**
     * Creation of inactive rows for the table in creation mode "InlineCreationRows".
     *
     * @param binding Data list binding
     * @param table The table being edited
     * @param recreateOneRow `true` if the call is to recreate an emptyLine
     */;
    _proto.createEmptyRows = async function createEmptyRows(binding, table) {
      var _this$tableDefinition3;
      let recreateOneRow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const inlineCreationRowCount = ((_this$tableDefinition3 = this.tableDefinition.control) === null || _this$tableDefinition3 === void 0 ? void 0 : _this$tableDefinition3.inlineCreationRowCount) || 1;
      if (this.creatingEmptyRows || this.getInactiveContextNumber(binding) > inlineCreationRowCount) {
        return;
      }
      const data = Array.from({
          length: inlineCreationRowCount
        }, () => ({})),
        atEnd = table.data("tableType") !== "ResponsiveTable",
        inactive = true,
        view = CommonUtils.getTargetView(table),
        controller = view.getController(),
        editFlow = controller.editFlow,
        appComponent = CommonUtils.getAppComponent(table);
      this.creatingEmptyRows = true;
      try {
        const dataForCreate = recreateOneRow ? [{}] : data;
        const contexts = await editFlow.createMultipleDocuments(binding,
        // during a live change, only 1 new document is created
        dataForCreate,
        // When editing an empty row, the new empty row is to be created just below and not above
        recreateOneRow ? true : atEnd, false, controller.editFlow.onBeforeCreate, inactive);
        contexts === null || contexts === void 0 ? void 0 : contexts.forEach(async function (context) {
          try {
            await context.created();
            appComponent.getSideEffectsService().requestSideEffectsForNavigationProperty(binding.getPath(), view.getBindingContext());
          } catch (error) {
            if (!error.canceled) {
              throw error;
            }
          }
        });
      } catch (e) {
        Log.error(e);
      } finally {
        this.creatingEmptyRows = false;
      }
    };
    _proto.getDownloadUrlWithFilters = async function getDownloadUrlWithFilters() {
      const table = this.content;
      const filterBar = Core.byId(table === null || table === void 0 ? void 0 : table.getFilter());
      if (!filterBar) {
        throw new Error("filter bar is not available");
      }
      const binding = table.getRowBinding();
      const model = table.getModel();
      const filterPropSV = await filterBar.getParent().getSelectionVariant();
      // ignore filters with semantic operators which needs to be added later as filters with flp semantic date placeholders
      const filtersWithSemanticDateOpsInfo = SemanticDateOperators.getSemanticOpsFilterProperties(filterPropSV._getSelectOptions());
      const filtersWithoutSemanticDateOps = TableUtils.getAllFilterInfo(table, filtersWithSemanticDateOpsInfo.map(filterInfo => filterInfo.filterName));
      const propertiesInfo = filterBar.getPropertyInfoSet();
      // get the filters with semantic date operators with flp placeholder format and append to the exisiting filters
      const [flpMappedPlaceholders, semanticDateFilters] = SemanticDateOperators.getSemanticDateFiltersWithFlpPlaceholders(filtersWithSemanticDateOpsInfo, propertiesInfo);
      let allRelevantFilters = [];
      if (filtersWithoutSemanticDateOps.filters.length > 0) {
        allRelevantFilters = allRelevantFilters.concat(filtersWithoutSemanticDateOps.filters);
      }
      if (semanticDateFilters.length > 0) {
        allRelevantFilters.push(...semanticDateFilters);
      }
      const allFilters = new Filter({
        filters: allRelevantFilters,
        and: true
      });

      // create hidden binding with all filters e.g. static filters and filters with semantic operators
      const tempTableBinding = model.bindList(binding.getPath(), undefined, undefined, allFilters);
      let url = await tempTableBinding.requestDownloadUrl();
      for (const [placeholder, value] of Object.entries(flpMappedPlaceholders)) {
        url = url.replace(placeholder, value);
      }
      return url;
    }

    /**
     * The dragged element enters a table row.
     *
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     */;
    _proto.onDragEnterDocument = function onDragEnterDocument(ui5Event) {
      const targetContext = ui5Event.getParameter("bindingContext");
      const dragContext = ui5Event.getParameter("dragSource");
      const isMoveAllowedInfo = this.getTableDefinition().control.isMoveToPositionAllowed;
      const parentContext = targetContext.getParent();
      let disabledOnParent = !parentContext,
        disabledOnNode = false;
      let allowedDropPosition = "OnOrBetween";
      try {
        if (isMoveAllowedInfo) {
          const customFunction = FPMHelper.getCustomFunction(isMoveAllowedInfo.moduleName, isMoveAllowedInfo.methodName, ui5Event.getSource().getParent());
          disabledOnNode = customFunction(dragContext, targetContext) === false;
          disabledOnParent = disabledOnParent || customFunction(dragContext, parentContext) === false;
        }
      } catch (error) {
        Log.warning("Cannot execute function related to isMoveToPositionAllowed", error);
      }
      if (dragContext.isAncestorOf(targetContext) ||
      // The ancestor is dropped into a descendant -> not authorized
      targetContext === this.content.getBindingContext() ||
      // The drag is done on the table itself-> not yet authorized
      targetContext.getBinding() !== dragContext.getBinding() ||
      // The drag is done on a different table -> not authorized
      disabledOnParent && disabledOnNode // "On" and "Between" are not authorized
      ) {
        //Set the element as non droppable
        ui5Event.preventDefault();
        return;
      }
      if (disabledOnParent) {
        allowedDropPosition = "On";
      } else if (disabledOnNode) {
        allowedDropPosition = "Between";
      }
      ui5Event.getSource().setDropPosition(allowedDropPosition);
    }

    /**
     * Starts the drag of the document.
     *
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     */;
    _proto.onDragStartDocument = function onDragStartDocument(ui5Event) {
      const context = ui5Event.getParameter("bindingContext");
      const isMovableInfo = this.getTableDefinition().control.isNodeMovable;
      const updatablePropertyPath = this.getTableDefinition().annotation.updatablePropertyPath;
      let customDisabled = false;
      try {
        if (isMovableInfo) {
          customDisabled = FPMHelper.getCustomFunction(isMovableInfo.moduleName, isMovableInfo.methodName, ui5Event.getSource())(context) === false;
        }
      } catch (_error) {
        customDisabled = false;
      }
      if (updatablePropertyPath && !context.getProperty(updatablePropertyPath) || customDisabled) {
        //Set the element as non draggable
        ui5Event.preventDefault();
      }
    }

    /**
     * Drops the document.
     *
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     * @returns The Promise
     */;
    _proto.onDropDocument = async function onDropDocument(ui5Event) {
      BusyLocker.lock(this.content);
      const bindingContext = ui5Event.getParameter("bindingContext");
      const targetContext = ui5Event.getParameter("dropPosition") === "On" ? bindingContext : bindingContext.getParent();
      return ui5Event.getParameter("dragSource").move({
        parent: targetContext
      }).catch(error => {
        Log.error(error);
      }).finally(() => {
        BusyLocker.unlock(this.content);
      });
    };
    return TableAPI;
  }(MacroAPI), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "tableDefinition", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "entityTypeFullyQualifiedName", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "enableExport", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enablePaste", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "enableFullScreen", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoColumnWidth", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "isOptimizedForSmallDevice", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "frozenColumnCount", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "rowCountMode", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "rowCount", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "columns", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "dataInitialized", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "bindingSuspended", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "outDatedBinding", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "pendingRequest", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "emptyRowsEnabled", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "rowPress", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "stateChange", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "contextChange", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "internalDataRequested", [_dec33], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec34], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec35], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "isSearchable", [_dec36], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "creationMode", [_dec37], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec38], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onContextChange", [_dec39], Object.getOwnPropertyDescriptor(_class2.prototype, "onContextChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onFieldLiveChange", [_dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "onFieldLiveChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onQuickFilterSelectionChange", [_dec41], Object.getOwnPropertyDescriptor(_class2.prototype, "onQuickFilterSelectionChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onTableRowPress", [_dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "onTableRowPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalPatchCompleted", [_dec43], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalPatchCompleted"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataReceived", [_dec44], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataReceived"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectAvailableCards", [_dec45], Object.getOwnPropertyDescriptor(_class2.prototype, "collectAvailableCards"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataRequested", [_dec46], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataRequested"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPaste", [_dec47], Object.getOwnPropertyDescriptor(_class2.prototype, "onPaste"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onCut", [_dec48], Object.getOwnPropertyDescriptor(_class2.prototype, "onCut"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeExport", [_dec49], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeExport"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDataStateChange", [_dec50], Object.getOwnPropertyDescriptor(_class2.prototype, "onDataStateChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAddCardToInsightsPressed", [_dec51], Object.getOwnPropertyDescriptor(_class2.prototype, "onAddCardToInsightsPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onMassEditButtonPressed", [_dec52], Object.getOwnPropertyDescriptor(_class2.prototype, "onMassEditButtonPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onTableSelectionChange", [_dec53], Object.getOwnPropertyDescriptor(_class2.prototype, "onTableSelectionChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onActionPress", [_dec54], Object.getOwnPropertyDescriptor(_class2.prototype, "onActionPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleCreateActivate", [_dec55], Object.getOwnPropertyDescriptor(_class2.prototype, "handleCreateActivate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDragEnterDocument", [_dec56], Object.getOwnPropertyDescriptor(_class2.prototype, "onDragEnterDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDragStartDocument", [_dec57], Object.getOwnPropertyDescriptor(_class2.prototype, "onDragStartDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDropDocument", [_dec58], Object.getOwnPropertyDescriptor(_class2.prototype, "onDropDocument"), _class2.prototype)), _class2)) || _class);
  return TableAPI;
}, false);
