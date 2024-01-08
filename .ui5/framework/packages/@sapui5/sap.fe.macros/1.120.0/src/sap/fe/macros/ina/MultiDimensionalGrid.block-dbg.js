/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/BuildingBlockSupport", "sap/fe/core/buildingBlocks/RuntimeBuildingBlock", "sap/fe/core/controllerextensions/HookSupport", "sap/fe/core/helpers/ClassSupport", "sap/fe/macros/ina/FilteringContextMenuHandler", "sap/fe/macros/ina/NavigationContextMenuHandler", "sap/ui/model/FilterOperator", "sap/fe/core/jsx-runtime/jsx"], function (Log, BuildingBlockSupport, RuntimeBuildingBlock, HookSupport, ClassSupport, FilteringContextMenuHandler, NavigationContextMenuHandler, FilterOperator, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
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
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let MultiDimensionalGridBlock = (
  /**
   * Building block for creating a DragonFly multidimensional grid
   * operating on a {@link MultiDimModel} and interacting with a {@link FilterBar}
   * and the page context.
   *
   * @experimental
   */
  _dec = defineBuildingBlock({
    name: "MultiDimensionalGrid",
    namespace: "sap.fe.macros.internal",
    libraries: ["sap/sac/df"]
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "string",
    required: false
  }), _dec4 = blockAttribute({
    type: "string",
    required: true
  }), _dec5 = blockAttribute({
    type: "string",
    required: true
  }), _dec6 = blockAttribute({
    type: "string",
    required: false
  }), _dec7 = blockAttribute({
    type: "string",
    required: false
  }), _dec8 = blockAttribute({
    type: "string",
    required: false
  }), _dec9 = blockAttribute({
    type: "object",
    required: false
  }), _dec10 = defineReference(), _dec11 = defineReference(), _dec12 = controllerExtensionHandler("editFlow", "onAfterSave"), _dec(_class = (_class2 = /*#__PURE__*/function (_RuntimeBuildingBlock) {
    _inheritsLoose(MultiDimensionalGridBlock, _RuntimeBuildingBlock);
    function MultiDimensionalGridBlock() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _RuntimeBuildingBlock.call(this, ...args) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "variantManagementId", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "modelName", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dataProviderName", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filterBar", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "height", _descriptor6, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "width", _descriptor7, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "dimensionMapping", _descriptor8, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "flexAnalysisControl", _descriptor9, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "multiDimModelChangeHandler", _descriptor10, _assertThisInitialized(_this));
      _this.refreshPromise = Promise.resolve();
      return _this;
    }
    _exports = MultiDimensionalGridBlock;
    /**
     * Lazily loads the FlexAnalysis control.
     *
     * @returns MultiDimensionalGridBlock class
     */
    MultiDimensionalGridBlock.load = async function load() {
      await _RuntimeBuildingBlock.load.call(this);
      if (MultiDimensionalGridBlock.FlexAnalysisControl === undefined) {
        const {
          default: control
        } = await __ui5_require_async("sap/sac/df/FlexAnalysis");
        MultiDimensionalGridBlock.FlexAnalysisControl = control;
      }
      if (MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl === undefined) {
        const {
          default: control
        } = await __ui5_require_async("sap/sac/df/changeHandler/MultiDimModelChangeHandler");
        MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl = control;
      }
      if (MultiDimensionalGridBlock.MemberFilter === undefined) {
        const {
          default: control
        } = await __ui5_require_async("sap/sac/df/model/MemberFilter");
        MultiDimensionalGridBlock.MemberFilter = control;
      }
      return this;
    }

    /**
     * Creates the content of this block, which is a single multidimensional grid
     * represented by the control {@link FlexAnalysis}.
     *
     * @param view
     * @param appComponent
     * @returns The created control
     */;
    var _proto = MultiDimensionalGridBlock.prototype;
    _proto.getContent = function getContent(view, appComponent) {
      // Asynchronously attach event handlers once the view and data provider are ready
      Promise.all([MultiDimensionalGridBlock.waitForViewInitialization(view), this.prepareDataProvider(appComponent)]).then(() => this.attachFiltering(view)).then(() => this.addNavigationContextMenu(appComponent, view)).catch(error => Log.error(`Could not initialize the DragonFly data provider '${this.dataProviderName}' of model '${this.modelName}'!`, error));
      if (!MultiDimensionalGridBlock.FlexAnalysisControl || !MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl) {
        Log.error("sap/sac/df/FlexAnalysis or sap/sac/df/changeHandler/MultiDimModelChangeHandler could not be loaded!");
        return undefined;
      }
      return _jsx(MultiDimensionalGridBlock.FlexAnalysisControl, {
        id: this.id,
        ref: this.flexAnalysisControl,
        multiDimModelId: this.modelName,
        dataProvider: this.dataProviderName,
        clientIdentifier: "UI5",
        blocked: "false",
        hideToolBar: "true",
        hideFilterLine: "true",
        height: this.height,
        width: this.width,
        configId: "fe",
        children: {
          dependents: [_jsx(MultiDimensionalGridBlock.MultiDimModelChangeHandlerControl, {
            id: this.variantManagementId,
            ref: this.multiDimModelChangeHandler
          })]
        }
      });
    }

    /**
     * Waits for a view to be initialized.
     *
     * @param view
     * @returns A promise resolving when the view is initialized.
     */;
    MultiDimensionalGridBlock.waitForViewInitialization = async function waitForViewInitialization(view) {
      return new Promise(resolve => view.attachAfterInit(() => resolve()));
    }

    /**
     * Prepares the configured data provider from the configured model to be used by this block.
     * Once it is ready it is stored in the instance.
     *
     * Throws if the data provider could not be fetched.
     *
     * @param appComponent
     * @returns The fetched data provider
     */;
    _proto.prepareDataProvider = async function prepareDataProvider(appComponent) {
      var _this$multiDimModelCh;
      const model = appComponent.getModel(this.modelName);
      await (model === null || model === void 0 ? void 0 : model.loaded());
      this.dataProvider = model === null || model === void 0 ? void 0 : model.getDataProvider(this.dataProviderName);
      if (!this.dataProvider) {
        throw new Error("Data provider not found");
      }
      (_this$multiDimModelCh = this.multiDimModelChangeHandler.current) === null || _this$multiDimModelCh === void 0 ? void 0 : _this$multiDimModelCh.registerMultiDimModel(model);
      model === null || model === void 0 ? void 0 : model.attachRequestCompleted(() => appComponent.getAppStateHandler().createAppState());
    }

    /**
     * Attaches the block to the configured filter bar, if it exists, to synchronize filter values to the grid,
     * and registers a context menu to allow directly filtering for members on the grid.
     *
     * Also makes sure that event handlers are detached again when the view is exited.
     *
     * @param view
     */;
    _proto.attachFiltering = function attachFiltering(view) {
      var _this$flexAnalysisCon3;
      const filterBar = this.filterBar ? view.byId(this.filterBar) : undefined;
      if (!filterBar) {
        return;
      }

      // Get the actual FilterBar control if the ID to a FilterBarAPI is configured
      const innerFilterBar = filterBar.isA("sap.fe.macros.filterBar.FilterBarAPI") ? filterBar.getAggregation("content") : filterBar;

      // Set up synchronization of filters from filter bar to grid
      const onFiltersChanged = () => {
        var _this$flexAnalysisCon;
        return (_this$flexAnalysisCon = this.flexAnalysisControl.current) === null || _this$flexAnalysisCon === void 0 ? void 0 : _this$flexAnalysisCon.setBlocked(true);
      };
      const onSearch = () => {
        var _this$flexAnalysisCon2;
        this.setConditionsOnGrid(innerFilterBar.getConditions());
        (_this$flexAnalysisCon2 = this.flexAnalysisControl.current) === null || _this$flexAnalysisCon2 === void 0 ? void 0 : _this$flexAnalysisCon2.setBlocked(false);
      };
      innerFilterBar.attachFiltersChanged(onFiltersChanged);
      innerFilterBar.attachSearch(onSearch);

      // Set up context menu to allow member filtering on the grid
      const filterContextMenuHandler = new FilteringContextMenuHandler(innerFilterBar.getParent(), this.dataProvider, this.dimensionMapping).create({
        Text: this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_FILTER_MEMBER"),
        Icon: "filter"
      });
      (_this$flexAnalysisCon3 = this.flexAnalysisControl.current) === null || _this$flexAnalysisCon3 === void 0 ? void 0 : _this$flexAnalysisCon3.addContextMenuAction("MemberCellFiltering", filterContextMenuHandler);

      // Detach all handlers on view exit
      view.attachBeforeExit(() => {
        innerFilterBar.detachFiltersChanged(onFiltersChanged);
        innerFilterBar.detachSearch(onSearch);
      });
    }

    /**
     * Adds an entry for the context menu to navigate to the primary navigation target of a cell if there is any.
     *
     * @param appComponent
     * @param view
     */;
    _proto.addNavigationContextMenu = function addNavigationContextMenu(appComponent, view) {
      var _this$flexAnalysisCon4;
      const handler = new NavigationContextMenuHandler(appComponent, view, this.dataProvider, this.dimensionMapping).create({
        Text: this.getTranslatedText("MULTIDIMENSIONALGRID_CONTEXT_MENU_ITEM_GO_TO_DETAILS"),
        Icon: "action"
      });
      (_this$flexAnalysisCon4 = this.flexAnalysisControl.current) === null || _this$flexAnalysisCon4 === void 0 ? void 0 : _this$flexAnalysisCon4.addContextMenuAction("MemberCellNavigation", handler);
    }

    /**
     * Refreshes the data provider whenever an object is saved.
     *
     * The refresh promises are chained to make sure that we never refresh the data provider twice at the same time;
     * otherwise this may cause inconsistent data.
     */;
    _proto.refresh = async function refresh() {
      this.refreshPromise = this.refreshPromise.then(async () => {
        if (this.dataProvider) {
          await this.dataProvider.getResultSet(true);
        }
      });
      return this.refreshPromise;
    }

    /**
     * Sets filter conditions on the grid (using the data provider).
     *
     * @param conditions
     */;
    _proto.setConditionsOnGrid = function setConditionsOnGrid(conditions) {
      if (!this.dataProvider || !MultiDimensionalGridBlock.MemberFilter) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const MemberFilter = MultiDimensionalGridBlock.MemberFilter;

      // Clear all existing filters
      for (const dimension of Object.keys(this.dataProvider.Dimensions)) {
        this.dataProvider.getDimension(dimension).removeMemberFilter();
      }
      for (const [path, values] of Object.entries(conditions)) {
        var _Object$entries$find;
        const dimension = (_Object$entries$find = Object.entries(this.dimensionMapping).find(_ref => {
          let [, value] = _ref;
          return value.filterProperty === path;
        })) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[0];
        // DragonFly only supports equality conditions
        const memberFilters = values.filter(value => value.operator === FilterOperator.EQ.valueOf()).flatMap(value => value.values).map(value => new MemberFilter([value]));
        if (dimension && this.dataProvider.Dimensions[dimension]) {
          this.dataProvider.getDimension(dimension).setMemberFilter(memberFilters);
        }
      }
    };
    return MultiDimensionalGridBlock;
  }(RuntimeBuildingBlock), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "variantManagementId", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "modelName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "dataProviderName", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "height", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "100%";
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "100%";
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "dimensionMapping", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "flexAnalysisControl", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "multiDimModelChangeHandler", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "refresh", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "refresh"), _class2.prototype)), _class2)) || _class);
  _exports = MultiDimensionalGridBlock;
  return _exports;
}, false);
