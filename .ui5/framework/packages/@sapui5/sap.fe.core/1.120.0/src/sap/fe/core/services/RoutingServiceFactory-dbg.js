/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/controllerextensions/routing/NavigationReason", "sap/fe/core/helpers/AppStartupHelper", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/EditState", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/SemanticKeyHelper", "sap/suite/ui/commons/collaboration/CollaborationHelper", "sap/ui/base/BindingParser", "sap/ui/base/EventProvider", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/model/odata/v4/ODataUtils", "../converters/MetaModelConverter"], function (Log, BusyLocker, Placeholder, messageHandling, NavigationReason, AppStartupHelper, ClassSupport, EditState, ModelHelper, SemanticKeyHelper, CollaborationHelper, BindingParser, EventProvider, Service, ServiceFactory, ODataUtils, MetaModelConverter) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let RoutingServiceEventing = (_dec = defineUI5Class("sap.fe.core.services.RoutingServiceEventing"), _dec2 = event(), _dec3 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_EventProvider) {
    _inheritsLoose(RoutingServiceEventing, _EventProvider);
    function RoutingServiceEventing() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _EventProvider.call(this, ...args) || this;
      _initializerDefineProperty(_this, "routeMatched", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "afterRouteMatched", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    return RoutingServiceEventing;
  }(EventProvider), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "routeMatched", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "afterRouteMatched", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  let RoutingService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(RoutingService, _Service);
    function RoutingService() {
      var _this2;
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      _this2 = _Service.call(this, ...args) || this;
      _this2.navigationInfoQueue = [];
      return _this2;
    }
    _exports.RoutingService = RoutingService;
    var _proto = RoutingService.prototype;
    _proto.init = function init() {
      const oContext = this.getContext();
      if (oContext.scopeType === "component") {
        var _oAppConfig$crossNavi;
        this.oAppComponent = oContext.scopeObject;
        this.oModel = this.oAppComponent.getModel();
        this.oMetaModel = this.oModel.getMetaModel();
        this.oRouter = this.oAppComponent.getRouter();
        this.oRouterProxy = this.oAppComponent.getRouterProxy();
        this.eventProvider = new RoutingServiceEventing();
        const oRoutingConfig = this.oAppComponent.getManifestEntry("sap.ui5").routing;
        this._parseRoutingConfiguration(oRoutingConfig);
        const oAppConfig = this.oAppComponent.getManifestEntry("sap.app");
        this.outbounds = (_oAppConfig$crossNavi = oAppConfig.crossNavigation) === null || _oAppConfig$crossNavi === void 0 ? void 0 : _oAppConfig$crossNavi.outbounds;
      }
      this.initPromise = Promise.resolve(this);
    };
    _proto.beforeExit = function beforeExit() {
      this.oRouter.detachRouteMatched(this._fnOnRouteMatched, this);
      this.eventProvider.fireEvent("routeMatched", {});
    };
    _proto.exit = function exit() {
      this.eventProvider.destroy();
    }

    /**
     * Parse a manifest routing configuration for internal usage.
     *
     * @param oRoutingConfig The routing configuration from the manifest
     */;
    _proto._parseRoutingConfiguration = function _parseRoutingConfiguration(oRoutingConfig) {
      var _oRoutingConfig$confi;
      const isFCL = (oRoutingConfig === null || oRoutingConfig === void 0 ? void 0 : (_oRoutingConfig$confi = oRoutingConfig.config) === null || _oRoutingConfig$confi === void 0 ? void 0 : _oRoutingConfig$confi.routerClass) === "sap.f.routing.Router";

      // Information of targets
      this._mTargets = {};
      Object.keys(oRoutingConfig.targets).forEach(sTargetName => {
        this._mTargets[sTargetName] = Object.assign({
          targetName: sTargetName
        }, oRoutingConfig.targets[sTargetName]);

        // View level for FCL cases is calculated from the target pattern
        if (this._mTargets[sTargetName].contextPattern !== undefined) {
          this._mTargets[sTargetName].viewLevel = this._getViewLevelFromPattern(this._mTargets[sTargetName].contextPattern, 0);
        }
      });

      // Information of routes
      this._mRoutes = {};
      for (const sRouteKey in oRoutingConfig.routes) {
        const oRouteManifestInfo = oRoutingConfig.routes[sRouteKey],
          aRouteTargets = Array.isArray(oRouteManifestInfo.target) ? oRouteManifestInfo.target : [oRouteManifestInfo.target],
          sRouteName = Array.isArray(oRoutingConfig.routes) ? oRouteManifestInfo.name : sRouteKey,
          sRoutePattern = oRouteManifestInfo.pattern;

        // Check route pattern: all patterns need to end with ':?query:', that we use for parameters
        if (sRoutePattern.length < 8 || sRoutePattern.indexOf(":?query:") !== sRoutePattern.length - 8) {
          Log.warning(`Pattern for route ${sRouteName} doesn't end with ':?query:' : ${sRoutePattern}`);
        }
        const iRouteLevel = this._getViewLevelFromPattern(sRoutePattern, 0);
        this._mRoutes[sRouteName] = {
          name: sRouteName,
          pattern: sRoutePattern,
          targets: aRouteTargets,
          routeLevel: iRouteLevel
        };

        // Add the parent targets in the list of targets for the route
        for (let i = 0; i < aRouteTargets.length; i++) {
          const sParentTargetName = this._mTargets[aRouteTargets[i]].parent;
          if (sParentTargetName) {
            aRouteTargets.push(sParentTargetName);
          }
        }
        if (!isFCL) {
          // View level for non-FCL cases is calculated from the route pattern
          if (this._mTargets[aRouteTargets[0]].viewLevel === undefined || this._mTargets[aRouteTargets[0]].viewLevel < iRouteLevel) {
            // There are cases when different routes point to the same target. We take the
            // largest viewLevel in that case.
            this._mTargets[aRouteTargets[0]].viewLevel = iRouteLevel;
          }

          // FCL level for non-FCL cases is equal to -1
          this._mTargets[aRouteTargets[0]].FCLLevel = -1;
        } else if (aRouteTargets.length === 1 && this._mTargets[aRouteTargets[0]].controlAggregation !== "beginColumnPages") {
          // We're in the case where there's only 1 target for the route, and it's not in the first column
          // --> this is a fullscreen column after all columns in the FCL have been used
          this._mTargets[aRouteTargets[0]].FCLLevel = 3;
        } else {
          // Other FCL cases
          aRouteTargets.forEach(sTargetName => {
            switch (this._mTargets[sTargetName].controlAggregation) {
              case "beginColumnPages":
                this._mTargets[sTargetName].FCLLevel = 0;
                break;
              case "midColumnPages":
                this._mTargets[sTargetName].FCLLevel = 1;
                break;
              default:
                this._mTargets[sTargetName].FCLLevel = 2;
            }
          });
        }
      }

      // Propagate viewLevel, contextPattern, FCLLevel and controlAggregation to parent targets
      Object.keys(this._mTargets).forEach(sTargetName => {
        while (this._mTargets[sTargetName].parent) {
          const sParentTargetName = this._mTargets[sTargetName].parent;
          this._mTargets[sParentTargetName].viewLevel = this._mTargets[sParentTargetName].viewLevel || this._mTargets[sTargetName].viewLevel;
          this._mTargets[sParentTargetName].contextPattern = this._mTargets[sParentTargetName].contextPattern || this._mTargets[sTargetName].contextPattern;
          this._mTargets[sParentTargetName].FCLLevel = this._mTargets[sParentTargetName].FCLLevel || this._mTargets[sTargetName].FCLLevel;
          this._mTargets[sParentTargetName].controlAggregation = this._mTargets[sParentTargetName].controlAggregation || this._mTargets[sTargetName].controlAggregation;
          sTargetName = sParentTargetName;
        }
      });

      // Determine the root entity for the app
      const aLevel0RouteNames = [];
      const aLevel1RouteNames = [];
      let sDefaultRouteName;
      for (const sName in this._mRoutes) {
        const iLevel = this._mRoutes[sName].routeLevel;
        if (iLevel === 0) {
          aLevel0RouteNames.push(sName);
        } else if (iLevel === 1) {
          aLevel1RouteNames.push(sName);
        }
      }
      if (aLevel0RouteNames.length === 1) {
        sDefaultRouteName = aLevel0RouteNames[0];
      } else if (aLevel1RouteNames.length === 1) {
        sDefaultRouteName = aLevel1RouteNames[0];
      }
      if (sDefaultRouteName) {
        const sDefaultTargetName = this._mRoutes[sDefaultRouteName].targets.slice(-1)[0];
        this.sContextPath = "";
        if (this._mTargets[sDefaultTargetName].options && this._mTargets[sDefaultTargetName].options.settings) {
          const oSettings = this._mTargets[sDefaultTargetName].options.settings;
          this.sContextPath = oSettings.contextPath || `/${oSettings.entitySet}`;
        }
        if (!this.sContextPath) {
          Log.warning(`Cannot determine default contextPath: contextPath or entitySet missing in default target: ${sDefaultTargetName}`);
        }
      } else {
        Log.warning("Cannot determine default contextPath: no default route found.");
      }

      // We need to establish the correct path to the different pages, including the navigation properties
      Object.keys(this._mTargets).map(sTargetKey => {
        return this._mTargets[sTargetKey];
      }).sort((a, b) => {
        return a.viewLevel < b.viewLevel ? -1 : 1;
      }).forEach(target => {
        // After sorting the targets per level we can then go through their navigation object and update the paths accordingly.
        if (target.options) {
          const settings = target.options.settings;
          const sContextPath = settings.contextPath || (settings.entitySet ? `/${settings.entitySet}` : "");
          if (!settings.fullContextPath && sContextPath) {
            settings.fullContextPath = `${sContextPath}/`;
          }
          Object.keys(settings.navigation || {}).forEach(sNavName => {
            // Check if it's a navigation property
            const targetRoute = this._mRoutes[settings.navigation[sNavName].detail.route];
            if (targetRoute && targetRoute.targets) {
              targetRoute.targets.forEach(sTargetName => {
                if (this._mTargets[sTargetName].options && this._mTargets[sTargetName].options.settings && !this._mTargets[sTargetName].options.settings.fullContextPath) {
                  if (target.viewLevel === 0) {
                    this._mTargets[sTargetName].options.settings.fullContextPath = `${(sNavName.startsWith("/") ? "" : "/") + sNavName}/`;
                  } else {
                    this._mTargets[sTargetName].options.settings.fullContextPath = `${settings.fullContextPath + sNavName}/`;
                  }
                }
              });
            }
          });
        }
      });
    }

    /**
     * Calculates a view level from a pattern by counting the number of segments.
     *
     * @param sPattern The pattern
     * @param viewLevel The current level of view
     * @returns The level
     */;
    _proto._getViewLevelFromPattern = function _getViewLevelFromPattern(sPattern, viewLevel) {
      sPattern = sPattern.replace(":?query:", "");
      const regex = new RegExp("/[^/]*$");
      if (sPattern && sPattern[0] !== "/" && sPattern[0] !== "?") {
        sPattern = `/${sPattern}`;
      }
      if (sPattern.length) {
        sPattern = sPattern.replace(regex, "");
        if (this.oRouter.match(sPattern) || sPattern === "") {
          return this._getViewLevelFromPattern(sPattern, ++viewLevel);
        } else {
          return this._getViewLevelFromPattern(sPattern, viewLevel);
        }
      } else {
        return viewLevel;
      }
    };
    _proto._getRouteInformation = function _getRouteInformation(sRouteName) {
      return this._mRoutes[sRouteName];
    };
    _proto._getTargetInformation = function _getTargetInformation(sTargetName) {
      return this._mTargets[sTargetName];
    };
    _proto._getComponentId = function _getComponentId(sOwnerId, sComponentId) {
      if (sComponentId.indexOf(`${sOwnerId}---`) === 0) {
        return sComponentId.substr(sOwnerId.length + 3);
      }
      return sComponentId;
    }

    /**
     * Get target information for a given component.
     *
     * @param oComponentInstance Instance of the component
     * @returns The configuration for the target
     */;
    _proto.getTargetInformationFor = function getTargetInformationFor(oComponentInstance) {
      const sTargetComponentId = this._getComponentId(oComponentInstance._sOwnerId, oComponentInstance.getId());
      let sCorrectTargetName = null;
      Object.keys(this._mTargets).forEach(sTargetName => {
        if (this._mTargets[sTargetName].id === sTargetComponentId || this._mTargets[sTargetName].viewId === sTargetComponentId) {
          sCorrectTargetName = sTargetName;
        }
      });
      return this._getTargetInformation(sCorrectTargetName);
    };
    _proto.getLastSemanticMapping = function getLastSemanticMapping() {
      return this.oLastSemanticMapping;
    };
    _proto.setLastSemanticMapping = function setLastSemanticMapping(oMapping) {
      this.oLastSemanticMapping = oMapping;
    };
    _proto.navigateTo = function navigateTo(oContext, sRouteName, mParameterMapping, bPreserveHistory) {
      let sTargetURLPromise, bIsStickyMode;
      if (oContext.getModel() && oContext.getModel().getMetaModel && oContext.getModel().getMetaModel()) {
        bIsStickyMode = ModelHelper.isStickySessionSupported(oContext.getModel().getMetaModel());
      }
      if (!mParameterMapping) {
        // if there is no parameter mapping define this mean we rely entirely on the binding context path
        sTargetURLPromise = Promise.resolve(SemanticKeyHelper.getSemanticPath(oContext));
      } else {
        sTargetURLPromise = this.prepareParameters(mParameterMapping, sRouteName, oContext).then(mParameters => {
          return this.oRouter.getURL(sRouteName, mParameters);
        });
      }
      return sTargetURLPromise.then(sTargetURL => {
        this.oRouterProxy.navToHash(sTargetURL, bPreserveHistory, false, false, !bIsStickyMode);
      });
    }

    /**
     * Method to return a map of routing target parameters where the binding syntax is resolved to the current model.
     *
     * @param mParameters Parameters map in the format [k: string] : ComplexBindingSyntax
     * @param sTargetRoute Name of the target route
     * @param oContext The instance of the binding context
     * @returns A promise which resolves to the routing target parameters
     */;
    _proto.prepareParameters = function prepareParameters(mParameters, sTargetRoute, oContext) {
      let oParametersPromise;
      try {
        const sContextPath = oContext.getPath();
        const oMetaModel = oContext.getModel().getMetaModel();
        const aContextPathParts = sContextPath.split("/");
        const aAllResolvedParameterPromises = Object.keys(mParameters).map(sParameterKey => {
          const sParameterMappingExpression = mParameters[sParameterKey];
          // We assume the defined parameters will be compatible with a binding expression
          const oParsedExpression = BindingParser.complexParser(sParameterMappingExpression);
          const aParts = oParsedExpression.parts || [oParsedExpression];
          const aResolvedParameterPromises = aParts.map(function (oPathPart) {
            const aRelativeParts = oPathPart.path.split("../");
            // We go up the current context path as many times as necessary
            const aLocalParts = aContextPathParts.slice(0, aContextPathParts.length - aRelativeParts.length + 1);
            const localContextPath = aLocalParts.join("/");
            const localContext = localContextPath === oContext.getPath() ? oContext : oContext.getModel().bindContext(localContextPath).getBoundContext();
            const oMetaContext = oMetaModel.getMetaContext(localContextPath + "/" + aRelativeParts[aRelativeParts.length - 1]);
            return localContext.requestProperty(aRelativeParts[aRelativeParts.length - 1]).then(function (oValue) {
              const oPropertyInfo = oMetaContext.getObject();
              const sEdmType = oPropertyInfo.$Type;
              return ODataUtils.formatLiteral(oValue, sEdmType);
            });
          });
          return Promise.all(aResolvedParameterPromises).then(aResolvedParameters => {
            const value = oParsedExpression.formatter ? oParsedExpression.formatter.apply(this, aResolvedParameters) : aResolvedParameters.join("");
            return {
              key: sParameterKey,
              value: value
            };
          });
        });
        oParametersPromise = Promise.all(aAllResolvedParameterPromises).then(function (aAllResolvedParameters) {
          const oParameters = {};
          aAllResolvedParameters.forEach(function (oResolvedParameter) {
            oParameters[oResolvedParameter.key] = oResolvedParameter.value;
          });
          return oParameters;
        });
      } catch (oError) {
        Log.error(`Could not parse the parameters for the navigation to route ${sTargetRoute}`);
        oParametersPromise = Promise.resolve(undefined);
      }
      return oParametersPromise;
    };
    _proto._fireRouteMatchEvents = function _fireRouteMatchEvents(mParameters) {
      this.eventProvider.fireEvent("routeMatched", mParameters);
      this.eventProvider.fireEvent("afterRouteMatched", mParameters);
      EditState.cleanProcessedEditState(); // Reset UI state when all bindings have been refreshed
    }

    /**
     * Navigates to a context.
     *
     * @param context The Context to be navigated to, or the list binding for creation (deferred creation)
     * @param [mParameters] Optional, map containing the following attributes:
     * @param [mParameters.checkNoHashChange] Navigate to the context without changing the URL
     * @param [mParameters.asyncContext] The context is created async, navigate to (...) and
     *                    wait for Promise to be resolved and then navigate into the context
     * @param [mParameters.bDeferredContext] The context shall be created deferred at the target page
     * @param [mParameters.editable] The target page shall be immediately in the edit mode to avoid flickering
     * @param [mParameters.bPersistOPScroll] The bPersistOPScroll will be used for scrolling to first tab
     * @param [mParameters.updateFCLLevel] `+1` if we add a column in FCL, `-1` to remove a column, 0 to stay on the same column
     * @param [mParameters.noPreservationCache] Do navigation without taking into account the preserved cache mechanism
     * @param [mParameters.bRecreateContext] Force re-creation of the context instead of using the one passed as parameter
     * @param [mParameters.bForceFocus] Forces focus selection after navigation
     * @param [oViewData] View data
     * @param [oCurrentTargetInfo] The target information from which the navigation is triggered
     * @returns Promise which is resolved once the navigation is triggered
     * @final
     */;
    _proto.navigateToContext = function navigateToContext(context) {
      let parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      let viewData = arguments.length > 2 ? arguments[2] : undefined;
      let currentTargetInfo = arguments.length > 3 ? arguments[3] : undefined;
      let targetRoute = "";
      let routeParametersPromise;
      const isStickyMode = ModelHelper.isStickySessionSupported(this.oMetaModel);

      // Manage parameter mapping
      if (parameters !== null && parameters !== void 0 && parameters.targetPath && viewData !== null && viewData !== void 0 && viewData.navigation) {
        const navigationInfo = viewData.navigation;
        const oRouteDetail = navigationInfo[parameters.targetPath].detail;
        targetRoute = oRouteDetail.route;
        if (oRouteDetail.parameters && context.isA("sap.ui.model.odata.v4.Context")) {
          routeParametersPromise = this.prepareParameters(oRouteDetail.parameters, targetRoute, context);
        }
      }
      let sTargetPath = this._getPathFromContext(context, parameters);
      // If the path is empty, we're supposed to navigate to the first page of the app
      // Check if we need to exit from the app instead
      if (sTargetPath.length === 0 && this.bExitOnNavigateBackToRoot) {
        this.oRouterProxy.exitFromApp();
        return Promise.resolve(true);
      }

      // If the navigation goes with a creation, we add (...) to the path (expecting context is an ODataListBinding)
      if (parameters !== null && parameters !== void 0 && parameters.createOnNavigateParameters) {
        sTargetPath += "(...)";
      }

      // Add layout parameter if needed
      const sLayout = this._calculateLayout(sTargetPath, parameters);
      if (sLayout) {
        sTargetPath += `?layout=${sLayout}`;
      }

      // Navigation parameters for later usage
      const oNavigationInfo = {
        createOnNavigateParameters: parameters.createOnNavigateParameters,
        bTargetEditable: parameters === null || parameters === void 0 ? void 0 : parameters.editable,
        bPersistOPScroll: parameters === null || parameters === void 0 ? void 0 : parameters.persistOPScroll,
        bShowPlaceholder: (parameters === null || parameters === void 0 ? void 0 : parameters.showPlaceholder) !== undefined ? parameters === null || parameters === void 0 ? void 0 : parameters.showPlaceholder : true,
        reason: parameters === null || parameters === void 0 ? void 0 : parameters.reason
      };
      if ((parameters === null || parameters === void 0 ? void 0 : parameters.updateFCLLevel) !== -1 && (parameters === null || parameters === void 0 ? void 0 : parameters.recreateContext) !== true) {
        if (context.isA("sap.ui.model.odata.v4.Context")) {
          oNavigationInfo.useContext = context;
        }
      }
      if (parameters !== null && parameters !== void 0 && parameters.checkNoHashChange) {
        // Check if the new hash is different from the current one
        const sCurrentHashNoAppState = this.oRouterProxy.getHash().replace(/[&?]{1}sap-iapp-state=[A-Z0-9]+/, "");
        if (sTargetPath === sCurrentHashNoAppState) {
          // The hash doesn't change, but we fire the routeMatch event to trigger page refresh / binding
          const mEventParameters = this.oRouter.getRouteInfoByHash(this.oRouterProxy.getHash());
          if (mEventParameters) {
            mEventParameters.navigationInfo = oNavigationInfo;
            mEventParameters.routeInformation = this._getRouteInformation(this.sCurrentRouteName);
            mEventParameters.routePattern = this.sCurrentRoutePattern;
            mEventParameters.views = this.aCurrentViews;
          }
          this.oRouterProxy.setFocusForced(!!parameters.forceFocus);
          this._fireRouteMatchEvents(mEventParameters);
          return Promise.resolve(true);
        }
      }
      if (parameters !== null && parameters !== void 0 && parameters.transient && !!parameters.editable && !sTargetPath.includes("(...)")) {
        if (sTargetPath.includes("?")) {
          sTargetPath += "&i-action=create";
        } else {
          sTargetPath += "?i-action=create";
        }
      }

      // Clear unbound messages upon navigating from LR to OP
      // This is to ensure stale error messages from LR are not shown to the user after navigation to OP.
      if ((currentTargetInfo === null || currentTargetInfo === void 0 ? void 0 : currentTargetInfo.name) === "sap.fe.templates.ListReport") {
        const oRouteInfo = this.oRouter.getRouteInfoByHash(sTargetPath);
        if (oRouteInfo) {
          const oRoute = this._getRouteInformation(oRouteInfo.name);
          if (oRoute && oRoute.targets && oRoute.targets.length > 0) {
            const sLastTargetName = oRoute.targets[oRoute.targets.length - 1];
            const oTarget = this._getTargetInformation(sLastTargetName);
            if (oTarget && oTarget.name === "sap.fe.templates.ObjectPage") {
              messageHandling.removeUnboundTransitionMessages();
            }
          }
        }
      }

      // Add the navigation parameters in the queue
      this.navigationInfoQueue.push(oNavigationInfo);
      if (targetRoute && routeParametersPromise) {
        return routeParametersPromise.then(oRouteParameters => {
          Object.assign(oRouteParameters, {
            bIsStickyMode: isStickyMode
          });
          this.oRouter.navTo(targetRoute, oRouteParameters);
          return true;
        });
      }
      return this.oRouterProxy.navToHash(sTargetPath, false, parameters === null || parameters === void 0 ? void 0 : parameters.noPreservationCache, parameters === null || parameters === void 0 ? void 0 : parameters.forceFocus, !isStickyMode).then(bNavigated => {
        if (!bNavigated) {
          // The navigation did not happen --> remove the navigation parameters from the queue as they shouldn't be used
          this.navigationInfoQueue.pop();
        }
        return bNavigated;
      });
    }

    /**
     * Navigates to a route.
     *
     * @param sTargetRouteName Name of the target route
     * @param [oRouteParameters] Parameters to be used with route to create the target hash
     * @returns Promise that is resolved when the navigation is finalized
     * @final
     */;
    _proto.navigateToRoute = function navigateToRoute(sTargetRouteName, oRouteParameters) {
      this.setLastSemanticMapping(undefined);
      const sTargetURL = this.oRouter.getURL(sTargetRouteName, oRouteParameters);
      return this.oRouterProxy.navToHash(sTargetURL, undefined, undefined, undefined, !oRouteParameters.bIsStickyMode);
    }

    /**
     * Checks if one of the current views on the screen is bound to a given context.
     *
     * @param oContext The context
     * @returns `true` or `false` if the current state is impacted or not
     */;
    _proto.isCurrentStateImpactedBy = function isCurrentStateImpactedBy(oContext) {
      const sPath = oContext.getPath();

      // First, check with the technical path. We have to try it, because for level > 1, we
      // uses technical keys even if Semantic keys are enabled
      if (this.oRouterProxy.isCurrentStateImpactedBy(sPath)) {
        return true;
      } else if (/^[^()]+\([^()]+\)$/.test(sPath)) {
        // If the current path can be semantic (i.e. is like xxx(yyy))
        // check with the semantic path if we can find it
        let sSemanticPath;
        if (this.oLastSemanticMapping && this.oLastSemanticMapping.technicalPath === sPath) {
          // We have already resolved this semantic path
          sSemanticPath = this.oLastSemanticMapping.semanticPath;
        } else {
          sSemanticPath = SemanticKeyHelper.getSemanticPath(oContext);
        }
        return sSemanticPath != sPath ? this.oRouterProxy.isCurrentStateImpactedBy(sSemanticPath) : false;
      } else {
        return false;
      }
    };
    _proto._findPathToNavigate = function _findPathToNavigate(sPath) {
      const regex = new RegExp("/[^/]*$");
      sPath = sPath.replace(regex, "");
      if (this.oRouter.match(sPath) || sPath === "") {
        return sPath;
      } else {
        return this._findPathToNavigate(sPath);
      }
    };
    _proto._checkIfContextSupportsSemanticPath = function _checkIfContextSupportsSemanticPath(oContext) {
      const sPath = oContext.getPath();

      // First, check if this is a level-1 object (path = /aaa(bbb))
      if (!/^\/[^(]+\([^)]+\)$/.test(sPath)) {
        return false;
      }

      // Then check if the entity has semantic keys
      const oMetaModel = oContext.getModel().getMetaModel();
      const entitySet = MetaModelConverter.getInvolvedDataModelObjects(oMetaModel.getMetaContext(oContext.getPath())).targetObject;
      const sEntitySetName = entitySet.name;
      if (!SemanticKeyHelper.getSemanticKeys(oMetaModel, sEntitySetName)) {
        return false;
      }

      // Then check the entity is draft-enabled
      return ModelHelper.isDraftRoot(entitySet);
    };
    _proto._getPathFromContext = function _getPathFromContext(context, parameters) {
      let sPath = "";
      if (context.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        var _context$getHeaderCon;
        sPath = ((_context$getHeaderCon = context.getHeaderContext()) === null || _context$getHeaderCon === void 0 ? void 0 : _context$getHeaderCon.getPath()) ?? "";
      } else {
        sPath = context.getPath();
        if (parameters.updateFCLLevel === -1) {
          var _this$oLastSemanticMa;
          // When navigating back from a context, we need to remove the last component of the path
          sPath = this._findPathToNavigate(sPath);

          // Check if we're navigating back to a semantic path that was previously resolved
          if (((_this$oLastSemanticMa = this.oLastSemanticMapping) === null || _this$oLastSemanticMa === void 0 ? void 0 : _this$oLastSemanticMa.technicalPath) === sPath) {
            sPath = this.oLastSemanticMapping.semanticPath;
          }
        } else if (this._checkIfContextSupportsSemanticPath(context)) {
          // We check if we have to use a semantic path
          const sSemanticPath = SemanticKeyHelper.getSemanticPath(context, true);
          if (!sSemanticPath) {
            // We were not able to build the semantic path --> Use the technical path and
            // clear the previous mapping, otherwise the old mapping is used in EditFlow#updateDocument
            // and it leads to unwanted page reloads
            this.setLastSemanticMapping(undefined);
          } else if (sSemanticPath !== sPath) {
            // Store the mapping technical <-> semantic path to avoid recalculating it later
            // and use the semantic path instead of the technical one
            this.setLastSemanticMapping({
              technicalPath: sPath,
              semanticPath: sSemanticPath
            });
            sPath = sSemanticPath;
          }
        }
      }

      // remove extra '/' at the beginning of path
      if (sPath[0] === "/") {
        sPath = sPath.substring(1);
      }
      return sPath;
    };
    _proto._calculateLayout = function _calculateLayout(hash, parameters) {
      let FCLLevel = parameters.FCLLevel ?? 0;
      if (parameters.updateFCLLevel) {
        FCLLevel += parameters.updateFCLLevel;
        if (FCLLevel < 0) {
          FCLLevel = 0;
        }
      }

      // When navigating back, try to find the layout in the navigation history if it's not provided as parameter
      // (layout calculation is not handled properly by the FlexibleColumnLayoutSemanticHelper in this case)
      if (parameters.updateFCLLevel !== undefined && parameters.updateFCLLevel < 0 && !parameters.layout) {
        parameters.layout = this.oRouterProxy.findLayoutForHash(hash);
      }
      return this.oAppComponent.getRootViewController().calculateLayout(FCLLevel, hash, parameters.layout, parameters.keepCurrentLayout);
    }

    /**
     * Event handler before a route is matched.
     * Displays a busy indicator.
     *
     */;
    _proto._beforeRouteMatched = function _beforeRouteMatched( /*oEvent: Event*/
    ) {
      const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
      if (!bPlaceholderEnabled) {
        const oRootView = this.oAppComponent.getRootControl();
        BusyLocker.lock(oRootView);
      }
    }

    /**
     * Checks if the current navigation has been triggered by the RouterProxy.
     *
     * @returns True if the current navigation has been triggered by the RouterProxy.
     */;
    _proto._isNavigationTriggeredByRouterProxy = function _isNavigationTriggeredByRouterProxy() {
      var _history$state;
      // The RouterProxy sets a 'feLevel' property on the history.state object
      return ((_history$state = history.state) === null || _history$state === void 0 ? void 0 : _history$state.feLevel) !== undefined;
    }

    /**
     * Event handler when a route is matched.
     * Hides the busy indicator and fires its own 'routematched' event.
     *
     * @param oEvent The event
     */;
    _proto._onRouteMatched = function _onRouteMatched(oEvent) {
      const oAppStateHandler = this.oAppComponent.getAppStateHandler(),
        oRootView = this.oAppComponent.getRootControl();
      const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
      if (BusyLocker.isLocked(oRootView) && !bPlaceholderEnabled) {
        BusyLocker.unlock(oRootView);
      }
      const mParameters = oEvent.getParameters();
      if (this.navigationInfoQueue.length) {
        mParameters.navigationInfo = this.navigationInfoQueue[0];
        this.navigationInfoQueue = this.navigationInfoQueue.slice(1);
      } else {
        mParameters.navigationInfo = {};
      }
      if (oAppStateHandler.checkIfRouteChangedByIApp()) {
        mParameters.navigationInfo.reason = NavigationReason.AppStateChanged;
        oAppStateHandler.resetRouteChangedByIApp();
      } else if (this.oRouterProxy.checkRestoreHistoryWasTriggered()) {
        mParameters.navigationInfo.reason = NavigationReason.RestoreHistory;
        this.oRouterProxy.resetRestoreHistoryFlag();
      }
      this.sCurrentRouteName = oEvent.getParameter("name");
      this.sCurrentRoutePattern = mParameters.config.pattern;
      this.aCurrentViews = oEvent.getParameter("views");
      mParameters.routeInformation = this._getRouteInformation(this.sCurrentRouteName);
      mParameters.routePattern = this.sCurrentRoutePattern;
      this._fireRouteMatchEvents(mParameters);

      // Check if current hash has been set by the routerProxy.navToHash function
      // If not, rebuild history properly (both in the browser and the RouterProxy)
      if (!this._isNavigationTriggeredByRouterProxy()) {
        this.oRouterProxy.restoreHistory().then(() => {
          this.oRouterProxy.resolveRouteMatch();
        }).catch(function (oError) {
          Log.error("Error while restoring history", oError);
        });
      } else {
        this.oRouterProxy.resolveRouteMatch();
      }
    };
    _proto.attachRouteMatched = function attachRouteMatched(oData, fnFunction, oListener) {
      this.eventProvider.attachEvent("routeMatched", oData, fnFunction, oListener);
    };
    _proto.detachRouteMatched = function detachRouteMatched(fnFunction, oListener) {
      this.eventProvider.detachEvent("routeMatched", fnFunction, oListener);
    };
    _proto.attachAfterRouteMatched = function attachAfterRouteMatched(oData, fnFunction, oListener) {
      this.eventProvider.attachEvent("afterRouteMatched", oData, fnFunction, oListener);
    };
    _proto.detachAfterRouteMatched = function detachAfterRouteMatched(fnFunction, oListener) {
      this.eventProvider.detachEvent("afterRouteMatched", fnFunction, oListener);
    };
    _proto.getRouteFromHash = function getRouteFromHash(oRouter, oAppComponent) {
      const sHash = oRouter.getHashChanger().hash;
      const oRouteInfo = oRouter.getRouteInfoByHash(sHash);
      return oAppComponent.getMetadata().getManifestEntry("/sap.ui5/routing/routes").filter(function (oRoute) {
        return oRoute.name === oRouteInfo.name;
      })[0];
    };
    _proto.getTargetsFromRoute = function getTargetsFromRoute(oRoute) {
      const oTarget = oRoute.target;
      if (typeof oTarget === "string") {
        return [this._mTargets[oTarget]];
      } else {
        const aTarget = [];
        oTarget.forEach(sTarget => {
          aTarget.push(this._mTargets[sTarget]);
        });
        return aTarget;
      }
    };
    _proto.initializeRouting = async function initializeRouting() {
      // Attach router handlers
      await CollaborationHelper.processAndExpandHash();
      this._fnOnRouteMatched = this._onRouteMatched.bind(this);
      this.oRouter.attachRouteMatched(this._fnOnRouteMatched, this);
      const bPlaceholderEnabled = new Placeholder().isPlaceholderEnabled();
      if (!bPlaceholderEnabled) {
        this.oRouter.attachBeforeRouteMatched(this._beforeRouteMatched.bind(this));
      }
      // Reset internal state
      this.navigationInfoQueue = [];
      EditState.resetEditState();
      this.bExitOnNavigateBackToRoot = !this.oRouter.match("");
      const bIsIappState = this.oRouter.getHashChanger().getHash().includes("sap-iapp-state");
      try {
        const oStartupParameters = await this.oAppComponent.getStartupParameters();
        const bHasStartUpParameters = oStartupParameters !== undefined && Object.keys(oStartupParameters).length !== 0;
        const sHash = this.oRouter.getHashChanger().getHash();
        // Manage startup parameters (in case of no iapp-state)
        if (!bIsIappState && bHasStartUpParameters && !sHash) {
          if (oStartupParameters.preferredMode && oStartupParameters.preferredMode[0].toUpperCase().includes("CREATE")) {
            // Create mode
            // This check will catch multiple modes like create, createWith and autoCreateWith which all need
            // to be handled like create startup!
            await this._manageCreateStartup(oStartupParameters);
          } else {
            // Deep link
            await this._manageDeepLinkStartup(oStartupParameters);
          }
        }
      } catch (oError) {
        Log.error("Error during routing initialization", oError);
      }
    };
    _proto.getDefaultCreateHash = function getDefaultCreateHash(oStartupParameters) {
      return AppStartupHelper.getDefaultCreateHash(oStartupParameters, this.getContextPath(), this.oRouter);
    };
    _proto._manageCreateStartup = function _manageCreateStartup(oStartupParameters) {
      return AppStartupHelper.getCreateStartupHash(oStartupParameters, this.getContextPath(), this.oRouter, this.oMetaModel).then(sNewHash => {
        if (sNewHash) {
          this.oRouter.getHashChanger().replaceHash(sNewHash);
          if (oStartupParameters !== null && oStartupParameters !== void 0 && oStartupParameters.preferredMode && oStartupParameters.preferredMode[0].toUpperCase().indexOf("AUTOCREATE") !== -1) {
            this.oAppComponent.setStartupModeAutoCreate();
          } else {
            this.oAppComponent.setStartupModeCreate();
          }
          this.bExitOnNavigateBackToRoot = true;
        }
      });
    };
    _proto._manageDeepLinkStartup = function _manageDeepLinkStartup(oStartupParameters) {
      return AppStartupHelper.getDeepLinkStartupHash(this.oAppComponent.getManifest()["sap.ui5"].routing, oStartupParameters, this.oModel).then(oDeepLink => {
        let sHash;
        if (oDeepLink.context) {
          const sTechnicalPath = oDeepLink.context.getPath();
          const sSemanticPath = this._checkIfContextSupportsSemanticPath(oDeepLink.context) ? SemanticKeyHelper.getSemanticPath(oDeepLink.context) : sTechnicalPath;
          if (sSemanticPath !== sTechnicalPath) {
            // Store the mapping technical <-> semantic path to avoid recalculating it later
            // and use the semantic path instead of the technical one
            this.setLastSemanticMapping({
              technicalPath: sTechnicalPath,
              semanticPath: sSemanticPath
            });
          }
          sHash = sSemanticPath.substring(1); // To remove the leading '/'
        } else if (oDeepLink.hash) {
          sHash = oDeepLink.hash;
        }
        if (sHash) {
          //Replace the hash with newly created hash
          this.oRouter.getHashChanger().replaceHash(sHash);
          this.oAppComponent.setStartupModeDeeplink();
        }
      });
    };
    _proto.getOutbounds = function getOutbounds() {
      return this.outbounds;
    }

    /**
     * Gets the name of the Draft root entity set or the sticky-enabled entity set.
     *
     * @returns The name of the root EntitySet
     */;
    _proto.getContextPath = function getContextPath() {
      return this.sContextPath;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    return RoutingService;
  }(Service);
  _exports.RoutingService = RoutingService;
  let RoutingServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(RoutingServiceFactory, _ServiceFactory);
    function RoutingServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    var _proto2 = RoutingServiceFactory.prototype;
    _proto2.createInstance = function createInstance(oServiceContext) {
      const oRoutingService = new RoutingService(oServiceContext);
      return oRoutingService.initPromise;
    };
    return RoutingServiceFactory;
  }(ServiceFactory);
  return RoutingServiceFactory;
}, false);
