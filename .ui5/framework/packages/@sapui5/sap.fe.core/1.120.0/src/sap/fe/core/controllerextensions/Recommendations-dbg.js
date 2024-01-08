/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/RecommendationHelper", "sap/fe/core/helpers/StandardRecommendationHelper", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../CommonUtils", "./editFlow/TransactionHelper"], function (Log, ClassSupport, RecommendationHelper, StandardRecommendationHelper, ControllerExtension, OverrideExecution, CommonUtils, TransactionHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _class, _class2;
  var _exports = {};
  var standardRecommendationHelper = StandardRecommendationHelper.standardRecommendationHelper;
  var recommendationHelper = RecommendationHelper.recommendationHelper;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  let Recommendations = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Recommendations"), _dec2 = methodOverride(), _dec3 = methodOverride("_routing"), _dec4 = publicExtension(), _dec5 = publicExtension(), _dec6 = extensible(OverrideExecution.Instead), _dec7 = publicExtension(), _dec8 = extensible(OverrideExecution.Instead), _dec9 = publicExtension(), _dec10 = publicExtension(), _dec11 = publicExtension(), _dec12 = extensible("AfterAsync"), _dec13 = publicExtension(), _dec14 = extensible(OverrideExecution.Instead), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(Recommendations, _ControllerExtension);
    function Recommendations() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    _exports = Recommendations;
    var _proto = Recommendations.prototype;
    _proto.onInit = function onInit() {
      //this.recommendationEnabledPromise = this.base.recommendations.isEnabled();
    };
    _proto.onAfterBinding = async function onAfterBinding(context) {
      // use internal model because we have to use this information across the application for different instances.
      const internalModel = this.base.getView().getModel("internal");
      const isRecommendationEnabled = internalModel.getProperty("/isRecommendationEnabled");
      // onAfter binding is called for all contexts
      // but we do not need to call the isEnabled hook all the time
      // so check if recommendation enabled is already available
      if (isRecommendationEnabled === undefined && context) {
        const rootContext = await this._getRootContext(context);
        if (rootContext) {
          this.recommendationEnabledPromise = this.base.recommendations.isEnabled(rootContext);
        }
      } else if (isRecommendationEnabled !== undefined) {
        this.recommendationEnabledPromise = Promise.resolve(isRecommendationEnabled);
      }
    };
    _proto._getRootContext = async function _getRootContext(context) {
      const programmingModel = TransactionHelper.getProgrammingModel(context);
      return CommonUtils.createRootContext(programmingModel, this.base.getView(), this.base.getAppComponent());
    }
    /**
     * Clear all recommendations currently available on the UI.
     *
     * @public
     */;
    _proto.clearRecommendations = function clearRecommendations() {
      const bindingContext = this.getView().getBindingContext();
      if (bindingContext) {
        recommendationHelper.clearRecommendations(this.getView(), bindingContext);
      }
    }

    /**
     * Check if recommendations are enabled or not.
     *
     * @param _rootContext The root entity context
     * @returns True if recommendation is enabled. False if recommendation is disabled.
     * @public
     */;
    _proto.isEnabled = async function isEnabled(_rootContext) {
      return Promise.resolve(false);
    }

    /**
     * Fetch the recommendation for a specific context.
     *
     * @param context The context that shall be considered when fetching recommendations
     * @param _rootContext The root entity context
     * @returns The recommendation entries
     * @public
     */;
    _proto.fetchRecommendations = async function fetchRecommendations(_context, _rootContext) {
      return Promise.resolve([]);
    }

    /**
     * Fetch the recommendations and apply them on the UI.
     *
     * @param context The context that shall be considered when fetching recommendations
     * @public
     * @returns `true` if the recommendation were fetched and applied correctly
     */;
    _proto.fetchAndApplyRecommendations = async function fetchAndApplyRecommendations(contexts) {
      if (contexts && contexts.length > 0) {
        const internalModel = this.base.getView().getModel("internal");
        const isRecommendationEnabled = await this.recommendationEnabledPromise;
        // store the result of recommendation enabled for later use
        internalModel.setProperty("/isRecommendationEnabled", isRecommendationEnabled);
        if (isRecommendationEnabled) {
          try {
            const rootContext = await this._getRootContext(contexts[0]);
            const recommendationData = await this.base.recommendations.fetchRecommendations(contexts, rootContext);
            if (recommendationData !== null && recommendationData !== void 0 && recommendationData.length) {
              this.storeRecommendationContexts(contexts);
            }
            // need to validate that the response is properly formatted
            return this.applyRecommendation(recommendationData, contexts);
          } catch (e) {
            Log.error("There was an error fetching the recommendations", e);
          }
        }
      }
      return false;
    }

    /**
     * Fetch the recommendations on field change and apply them on the UI.
     *
     * @param field The changed field.
     * @param context The context that shall be considered when fetching recommendations.
     * @public
     * @returns `true` if the recommendation were fetched and applied correctly
     */;
    _proto.fetchAndApplyRecommendationsOnFieldChange = async function fetchAndApplyRecommendationsOnFieldChange(field, context) {
      const appComponent = this.base.getAppComponent();
      const isFieldRecommendationRelevant = appComponent.getSideEffectsService().checkIfFieldIsRecommendationRelevant(field);
      if (isFieldRecommendationRelevant) {
        return this.fetchAndApplyRecommendations(context);
      } else {
        return false;
      }
    }

    /**
     * Returns the filtered recommendations from passed recommendations and then based on it we either show the filtered recommendations or not show the Accept all Dialog if there are no recommendations.
     * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
     * @returns Promise
     */;
    _proto.onBeforeAcceptRecommendations = async function onBeforeAcceptRecommendations(_params) {
      //do nothing
      return Promise.resolve(); //had to do this because of eslint error of not having await when the function is async
    }

    /**
     * This function is responsible for accepting the recommendations.
     * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
     * @returns Promise which resolved to a Boolean value based on whether recommendations are accepted or not
     */;
    _proto.acceptRecommendations = async function acceptRecommendations(_params) {
      //do nothing
      return Promise.resolve(true); //had to do this because of eslint error of not having await when the function is async
    };
    _proto.applyRecommendation = function applyRecommendation(recommendationResponses, _context) {
      standardRecommendationHelper.storeRecommendations(recommendationResponses, this.getView().getModel("internal"), _context);
      return true;
    }

    /**
     * Stores the recommendation contexts.
     *
     * @param contexts
     */;
    _proto.storeRecommendationContexts = function storeRecommendationContexts(contexts) {
      var _recommendationContex;
      let recommendationContexts = this.recommendationContexts || [];
      const contextPaths = [];
      contexts.forEach(context => {
        contextPaths.push(context.getPath());
      });
      recommendationContexts = (_recommendationContex = recommendationContexts) === null || _recommendationContex === void 0 ? void 0 : _recommendationContex.filter(recommendationContext => {
        if (recommendationContext && recommendationContext !== null && recommendationContext !== void 0 && recommendationContext.getModel() && !contextPaths.includes(recommendationContext.getPath())) {
          return true;
        }
        return false;
      });
      this.recommendationContexts = [...recommendationContexts, ...contexts];
    }

    /**
     * Filters the contexts and only returns the contexts which are matching with the contexts .
     *
     * @param targets
     * @returns Filtered Recommendation relevant Contexts
     */;
    _proto.fetchFilteredRecommendationContexts = function fetchFilteredRecommendationContexts(targets) {
      const contextPaths = [];
      const filteredRecommendationContexts = [];
      for (const key of targets) {
        const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
        this.recommendationContexts.forEach(context => {
          if (context.getPath() == contextPathFromKey && !contextPaths.includes(contextPathFromKey)) {
            contextPaths.push(contextPathFromKey);
            filteredRecommendationContexts.push(context);
          }
        });
      }
      return filteredRecommendationContexts;
    }

    /**
     * Fetches RecommendationData based on filtered targets.
     *
     * @param filteredTargets
     * @returns RecommendationData
     */;
    _proto.fetchFilteredRecommendationData = function fetchFilteredRecommendationData(filteredTargets) {
      var _this$getView, _this$getView$getMode;
      const filterRecommendationsData = {};
      const recommendationData = (_this$getView = this.getView()) === null || _this$getView === void 0 ? void 0 : (_this$getView$getMode = _this$getView.getModel("internal")) === null || _this$getView$getMode === void 0 ? void 0 : _this$getView$getMode.getProperty("/recommendationsData");
      Object.keys(recommendationData).forEach(key => {
        if (filteredTargets.includes(key)) {
          filterRecommendationsData[key] = Object.assign(recommendationData[key], {});
        }
      });
      return filterRecommendationsData;
    }

    /**
     * Fetches the filtered targets.
     *
     * @returns Array of Filtered targets
     */;
    _proto.fetchTargets = function fetchTargets() {
      var _this$getView2, _this$getView2$getMod;
      const recommendationData = (_this$getView2 = this.getView()) === null || _this$getView2 === void 0 ? void 0 : (_this$getView2$getMod = _this$getView2.getModel("internal")) === null || _this$getView2$getMod === void 0 ? void 0 : _this$getView2$getMod.getProperty("/recommendationsData");
      if (recommendationData.version === null) {
        return [];
      }
      return Object.keys(recommendationData).filter(key => {
        var _this$getView3, _this$getView3$getBin;
        return key !== "version" && key.includes((_this$getView3 = this.getView()) === null || _this$getView3 === void 0 ? void 0 : (_this$getView3$getBin = _this$getView3.getBindingContext()) === null || _this$getView3$getBin === void 0 ? void 0 : _this$getView3$getBin.getPath());
      }) || [];
    }

    /**
     * Overwrites AcceptAll Params based of recommendation data and contexts.
     *
     * @param filterRecommendationData
     * @param filterRecommendationContexts
     * @param params
     */;
    _proto.adjustAcceptAllParams = function adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params) {
      params.recommendationData = [];
      for (const key in filterRecommendationData) {
        const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
        const propertyPathFromKey = key.substring(key.lastIndexOf(")") + 2);
        const matchingContext = filterRecommendationContexts.filter(function (context) {
          if (context.getPath() === contextPathFromKey) {
            return true;
          }
        });
        if (standardRecommendationHelper.isRecommendationFieldNull(matchingContext[0], key, propertyPathFromKey)) {
          params.recommendationData.push({
            context: matchingContext[0],
            propertyPath: propertyPathFromKey,
            value: filterRecommendationData[key].value,
            text: filterRecommendationData[key].text
          });
        }
      }
    }

    /**
     * Fetches RecommendationInfo that contains targets, filterRecommendationData, filterRecommendationContexts.
     *
     * @returns Promise which resolves with AcceptallParams
     */;
    _proto.fetchAcceptAllParams = async function fetchAcceptAllParams() {
      var _this$getView4;
      const targets = this.fetchTargets();
      const filterRecommendationData = this.fetchFilteredRecommendationData(targets);
      const filterRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
      const params = {};
      this.adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params);
      await ((_this$getView4 = this.getView()) === null || _this$getView4 === void 0 ? void 0 : _this$getView4.getController()).recommendations.onBeforeAcceptRecommendations(params);
      return params;
    }

    /**
     * Checks if recommendations exist or not.
     *
     * @returns Boolean value based on whether recommendations are present or not
     */;
    _proto.checkIfRecommendationsExist = function checkIfRecommendationsExist() {
      var _this$getView5, _this$getView5$getMod;
      const recommendationData = ((_this$getView5 = this.getView()) === null || _this$getView5 === void 0 ? void 0 : (_this$getView5$getMod = _this$getView5.getModel("internal")) === null || _this$getView5$getMod === void 0 ? void 0 : _this$getView5$getMod.getProperty("/recommendationsData")) || {};
      return Object.keys(recommendationData).length !== 0;
    };
    return Recommendations;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearRecommendations", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "clearRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isEnabled", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "isEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchRecommendations", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchAndApplyRecommendations", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchAndApplyRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchAndApplyRecommendationsOnFieldChange", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchAndApplyRecommendationsOnFieldChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeAcceptRecommendations", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeAcceptRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "acceptRecommendations", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "acceptRecommendations"), _class2.prototype)), _class2)) || _class);
  _exports = Recommendations;
  return _exports;
}, false);
