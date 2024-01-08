/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/controllerextensions/routing/NavigationReason", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/EditState", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/SemanticKeyHelper", "sap/ui/core/Component", "sap/ui/core/Core", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (Log, CommonUtils, BusyLocker, ActivitySync, draft, NavigationReason, ClassSupport, EditState, ModelHelper, SemanticKeyHelper, Component, Core, ControllerExtension, OverrideExecution, Filter, FilterOperator) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * {@link sap.ui.core.mvc.ControllerExtension Controller extension}
   *
   * @since 1.74.0
   */
  let InternalRouting = (_dec = defineUI5Class("sap.fe.core.controllerextensions.InternalRouting"), _dec2 = methodOverride(), _dec3 = methodOverride(), _dec4 = publicExtension(), _dec5 = extensible(OverrideExecution.After), _dec6 = publicExtension(), _dec7 = extensible(OverrideExecution.After), _dec8 = publicExtension(), _dec9 = extensible(OverrideExecution.After), _dec10 = publicExtension(), _dec11 = extensible(OverrideExecution.After), _dec12 = publicExtension(), _dec13 = publicExtension(), _dec14 = publicExtension(), _dec15 = finalExtension(), _dec16 = publicExtension(), _dec17 = finalExtension(), _dec18 = publicExtension(), _dec19 = finalExtension(), _dec20 = publicExtension(), _dec21 = publicExtension(), _dec22 = finalExtension(), _dec23 = publicExtension(), _dec24 = extensible(OverrideExecution.Before), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(InternalRouting, _ControllerExtension);
    function InternalRouting() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = InternalRouting.prototype;
    _proto.onExit = function onExit() {
      if (this._oRoutingService) {
        this._oRoutingService.detachRouteMatched(this._fnRouteMatchedBound);
      }
    };
    _proto.onInit = function onInit() {
      this._oView = this.base.getView();
      this._oAppComponent = CommonUtils.getAppComponent(this._oView);
      this._oPageComponent = Component.getOwnerComponentFor(this._oView);
      this._oRouter = this._oAppComponent.getRouter();
      this._oRouterProxy = this._oAppComponent.getRouterProxy();
      if (!this._oAppComponent || !this._oPageComponent) {
        throw new Error("Failed to initialize controler extension 'sap.fe.core.controllerextesions.InternalRouting");
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (this._oAppComponent === this._oPageComponent) {
        // The view isn't hosted in a dedicated UIComponent, but directly in the app
        // --> just keep the view
        this._oPageComponent = null;
      }
      this._oAppComponent.getService("routingService").then(oRoutingService => {
        this._oRoutingService = oRoutingService;
        this._fnRouteMatchedBound = this._onRouteMatched.bind(this);
        this._oRoutingService.attachRouteMatched(this._fnRouteMatchedBound);
        this._oTargetInformation = oRoutingService.getTargetInformationFor(this._oPageComponent || this._oView);
      }).catch(function () {
        throw new Error("This controller extension cannot work without a 'routingService' on the main AppComponent");
      });
    }

    /**
     * Triggered every time this controller is a navigation target.
     */;
    _proto.onRouteMatched = function onRouteMatched() {
      /**/
    };
    _proto.onRouteMatchedFinished = function onRouteMatchedFinished() {
      /**/
    };
    _proto.onBeforeBinding = function onBeforeBinding(oBindingContext, mParameters) {
      const oRouting = this.base.getView().getController().routing;
      if (oRouting && oRouting.onBeforeBinding) {
        oRouting.onBeforeBinding(oBindingContext, mParameters);
      }
    };
    _proto.onAfterBinding = function onAfterBinding(oBindingContext, mParameters) {
      this._oAppComponent.getRootViewController().onContextBoundToView(oBindingContext);
      const oRouting = this.base.getView().getController().routing;
      if (oRouting && oRouting.onAfterBinding) {
        oRouting.onAfterBinding(oBindingContext, mParameters);
      }
    }

    ///////////////////////////////////////////////////////////
    // Methods triggering a navigation after a user action
    // (e.g. click on a table row, button, etc...)
    ///////////////////////////////////////////////////////////

    /**
     * Navigates to the specified navigation target.
     *
     * @param oContext Context instance
     * @param sNavigationTargetName Name of the navigation target
     * @param bPreserveHistory True to force the new URL to be added at the end of the browser history (no replace)
     */;
    _proto.navigateToTarget = function navigateToTarget(oContext, sNavigationTargetName, bPreserveHistory) {
      const oNavigationConfiguration = this._oPageComponent && this._oPageComponent.getNavigationConfiguration && this._oPageComponent.getNavigationConfiguration(sNavigationTargetName);
      if (oNavigationConfiguration) {
        const oDetailRoute = oNavigationConfiguration.detail;
        const sRouteName = oDetailRoute.route;
        const mParameterMapping = oDetailRoute.parameters;
        this._oRoutingService.navigateTo(oContext, sRouteName, mParameterMapping, bPreserveHistory);
      } else {
        this._oRoutingService.navigateTo(oContext, null, null, bPreserveHistory);
      }
      this._oView.getViewData();
    }

    /**
     * Navigates to the specified navigation target route.
     *
     * @param sTargetRouteName Name of the target route
     * @param [oParameters] Parameters to be used with route to create the target hash
     * @returns Promise that is resolved when the navigation is finalized
     */;
    _proto.navigateToRoute = async function navigateToRoute(sTargetRouteName, oParameters) {
      return this._oRoutingService.navigateToRoute(sTargetRouteName, oParameters);
    }

    /**
     * Navigates to a specific context.
     *
     * @param context The context to be navigated to
     * @param parameters Optional navigation parameters
     * @returns Promise resolved to 'true' when the navigation has been triggered, 'false' if the navigation did not happen
     */;
    _proto.navigateToContext = async function navigateToContext(context) {
      let parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (context.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        var _parameters$createOnN, _parameters$createOnN2;
        if (((_parameters$createOnN = parameters.createOnNavigateParameters) === null || _parameters$createOnN === void 0 ? void 0 : _parameters$createOnN.mode) === "Async") {
          // the context is either created async (Promise)
          // We need to activate the routeMatchSynchro on the RouterProxy to avoid that
          // the subsequent call to navigateToContext conflicts with the current one
          this._oRouterProxy.activateRouteMatchSynchronization();
          parameters.createOnNavigateParameters.createContextPromise.then(async createdContext => {
            // once the context is returned we navigate into it
            return this.navigateToContext(createdContext, {
              checkNoHashChange: parameters.checkNoHashChange,
              editable: parameters.editable,
              persistOPScroll: parameters.persistOPScroll,
              updateFCLLevel: parameters.updateFCLLevel,
              forceFocus: parameters.forceFocus
            });
          }).catch(function (oError) {
            Log.error("Error with the async context", oError);
          });
        } else if (((_parameters$createOnN2 = parameters.createOnNavigateParameters) === null || _parameters$createOnN2 === void 0 ? void 0 : _parameters$createOnN2.mode) !== "Deferred") {
          // Navigate to a list binding not yet supported
          throw "navigation to a list binding is not yet supported";
        }
      } else if (parameters.callExtension) {
        const internalModel = this._oView.getModel("internal");
        internalModel.setProperty("/paginatorCurrentContext", null);

        // Storing the selected context to use it in internal route navigation if neccessary.
        const overrideNav = this.base.getView().getController().routing.onBeforeNavigation({
          bindingContext: context
        });
        if (overrideNav) {
          internalModel.setProperty("/paginatorCurrentContext", context);
          return Promise.resolve(true);
        }
      }
      parameters.FCLLevel = this._getFCLLevel();
      return this._oRoutingService.navigateToContext(context, parameters, this._oView.getViewData(), this._oTargetInformation);
    }

    /**
     * Navigates backwards from a context.
     *
     * @param context Context to be navigated from
     * @param [mParameters] Optional navigation parameters
     * @returns Promise resolved when the navigation has been triggered
     */;
    _proto.navigateBackFromContext = async function navigateBackFromContext(context) {
      let parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      parameters.updateFCLLevel = -1;
      return this.navigateToContext(context, parameters);
    }

    /**
     * Navigates forwards to a context.
     *
     * @param context Context to be navigated to
     * @param parameters Optional navigation parameters
     * @returns Promise resolved when the navigation has been triggered
     */;
    _proto.navigateForwardToContext = async function navigateForwardToContext(context) {
      var _this$_oView$getBindi;
      let parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (((_this$_oView$getBindi = this._oView.getBindingContext("internal")) === null || _this$_oView$getBindi === void 0 ? void 0 : _this$_oView$getBindi.getProperty("messageFooterContainsErrors")) === true) {
        return Promise.resolve(true);
      }
      parameters.updateFCLLevel = 1;
      return this.navigateToContext(context, parameters);
    }

    /**
     * Navigates back in history if the current hash corresponds to a transient state.
     */;
    _proto.navigateBackFromTransientState = function navigateBackFromTransientState() {
      const sHash = this._oRouterProxy.getHash();

      // if triggered while navigating to (...), we need to navigate back
      if (sHash.includes("(...)")) {
        this._oRouterProxy.navBack();
      }
    };
    _proto.navigateToMessagePage = function navigateToMessagePage(sErrorMessage, mParameters) {
      mParameters = mParameters || {};
      if (this._oRouterProxy.getHash().includes("i-action=create") || this._oRouterProxy.getHash().includes("i-action=autoCreate")) {
        return this._oRouterProxy.navToHash(this._oRoutingService.getDefaultCreateHash());
      } else {
        mParameters.FCLLevel = this._getFCLLevel();
        return this._oAppComponent.getRootViewController().displayErrorPage(sErrorMessage, mParameters);
      }
    }

    /**
     * Checks if one of the current views on the screen is bound to a given context.
     *
     * @param oContext
     * @returns `true` if the state is impacted by the context
     */;
    _proto.isCurrentStateImpactedBy = function isCurrentStateImpactedBy(oContext) {
      return this._oRoutingService.isCurrentStateImpactedBy(oContext);
    };
    _proto._isViewPartOfRoute = function _isViewPartOfRoute(routeInformation) {
      const aTargets = routeInformation === null || routeInformation === void 0 ? void 0 : routeInformation.targets;
      if (!aTargets || aTargets.indexOf(this._oTargetInformation.targetName) === -1) {
        // If the target for this view has a view level greater than the route level, it means this view comes "after" the route
        // in terms of navigation.
        // In such case, we remove its binding context, to avoid this view to have data if we navigate to it later on
        // This is done in a timeout to allow for focusout events to be processed before properly in collaborative draft
        if ((this._oTargetInformation.viewLevel ?? 0) >= ((routeInformation === null || routeInformation === void 0 ? void 0 : routeInformation.routeLevel) ?? 0)) {
          setTimeout(() => {
            if ((routeInformation === null || routeInformation === void 0 ? void 0 : routeInformation.routeLevel) === 0 && ActivitySync.isConnected(this.getView())) {
              // The route has level 0 --> we need to leave the collaboration session as no OP is displayed
              ActivitySync.disconnect(this.getView());
            }
            this._setBindingContext(null); // This also call setKeepAlive(false) on the current context
          }, 0);
        }
        return false;
      }
      return true;
    };
    _proto._buildBindingPath = function _buildBindingPath(routeArguments, bindingPattern, navigationParameters) {
      let path = bindingPattern.replace(":?query:", "");
      let deferred = false;
      for (const sKey in routeArguments) {
        const sValue = routeArguments[sKey];
        if (typeof sValue !== "string") {
          continue;
        }
        if (sValue === "..." && bindingPattern.includes(`{${sKey}}`)) {
          deferred = true;
          // Sometimes in preferredMode = create, the edit button is shown in background when the
          // action parameter dialog shows up, setting bTargetEditable passes editable as true
          // to onBeforeBinding in _bindTargetPage function
          navigationParameters.bTargetEditable = true;
        }
        path = path.replace(`{${sKey}}`, sValue);
      }
      if (routeArguments["?query"] && routeArguments["?query"].hasOwnProperty("i-action")) {
        navigationParameters.bActionCreate = true;
      }

      // the binding path is always absolute
      if (path && path[0] !== "/") {
        path = `/${path}`;
      }
      return {
        path,
        deferred
      };
    }

    ///////////////////////////////////////////////////////////
    // Methods to bind the page when a route is matched
    ///////////////////////////////////////////////////////////

    /**
     * Called when a route is matched.
     * Builds the binding context from the navigation parameters, and bind the page accordingly.
     *
     * @param oEvent
     */;
    _proto._onRouteMatched = function _onRouteMatched(oEvent) {
      // Check if the target for this view is part of the event targets (i.e. is a target for the current route).
      // If not, we don't need to bind it --> return
      if (!this._isViewPartOfRoute(oEvent.getParameter("routeInformation"))) {
        return;
      }

      // Retrieve the binding context pattern
      let bindingPattern;
      if (this._oPageComponent && this._oPageComponent.getBindingContextPattern) {
        bindingPattern = this._oPageComponent.getBindingContextPattern();
      }
      bindingPattern = bindingPattern || this._oTargetInformation.contextPattern;
      if (bindingPattern === null || bindingPattern === undefined) {
        // Don't do this if we already got sTarget == '', which is a valid target pattern
        bindingPattern = oEvent.getParameter("routePattern");
      }

      // Replace the parameters by their values in the binding context pattern
      const mArguments = oEvent.getParameters().arguments;
      const oNavigationParameters = oEvent.getParameter("navigationInfo");
      const {
        path,
        deferred
      } = this._buildBindingPath(mArguments, bindingPattern, oNavigationParameters);
      this.onRouteMatched();
      const oModel = this._oView.getModel();
      const bindPromise = deferred ? this._bindDeferred(path, oNavigationParameters) : this._bindPage(path, oModel, oNavigationParameters);
      bindPromise.finally(() => {
        this.onRouteMatchedFinished();
      }).catch(error => {
        Log.error("Error during page binding " + error.toString());
      });
      this._oAppComponent.getRootViewController().updateUIStateForView(this._oView, this._getFCLLevel());
    }

    /**
     * Deferred binding (during object creation).
     *
     * @param targetPath The path to the deffered context
     * @param navigationParameters Navigation parameters
     * @returns A promise
     */;
    _proto._bindDeferred = async function _bindDeferred(targetPath, navigationParameters) {
      this.onBeforeBinding(null, {
        editable: navigationParameters.bTargetEditable
      });
      if (!navigationParameters.createOnNavigateParameters || navigationParameters.createOnNavigateParameters.mode === "Deferred") {
        // either the context shall be created in the target page (deferred Context) or it shall
        // be created async but the user refreshed the page / bookmarked this URL
        // TODO: currently the target component creates this document but we shall move this to
        // a central place
        if (this._oPageComponent && this._oPageComponent.createDeferredContext) {
          var _navigationParameters, _navigationParameters2, _navigationParameters3;
          this._oPageComponent.createDeferredContext(targetPath, (_navigationParameters = navigationParameters.createOnNavigateParameters) === null || _navigationParameters === void 0 ? void 0 : _navigationParameters.listBinding, (_navigationParameters2 = navigationParameters.createOnNavigateParameters) === null || _navigationParameters2 === void 0 ? void 0 : _navigationParameters2.parentContext, (_navigationParameters3 = navigationParameters.createOnNavigateParameters) === null || _navigationParameters3 === void 0 ? void 0 : _navigationParameters3.data, !!navigationParameters.bActionCreate);
        }
      }
      const currentBindingContext = this._getBindingContext();
      if (currentBindingContext !== null && currentBindingContext !== void 0 && currentBindingContext.hasPendingChanges()) {
        // For now remove the pending changes to avoid the model raises errors and the object page is at least bound
        // Ideally the user should be asked for
        currentBindingContext.getBinding().resetChanges();
      }

      // remove the context to avoid showing old data
      this._setBindingContext(null);
      this.onAfterBinding(null);
      return Promise.resolve();
    }

    /**
     * Sets the binding context of the page from a path.
     *
     * @param targetPath The path to the context
     * @param model The OData model
     * @param navigationParameters Navigation parameters
     * @returns A Promise resolved once the binding has been set on the page
     */;
    _proto._bindPage = function _bindPage(targetPath, model, navigationParameters) {
      if (targetPath === "") {
        return Promise.resolve(this._bindPageToContext(null, model, navigationParameters));
      }
      return this.resolvePath(targetPath, model, navigationParameters).then(technicalPath => {
        this._bindPageToPath(technicalPath, model, navigationParameters);
      }).catch(error => {
        // Error handling for erroneous metadata request
        const resourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
        this.navigateToMessagePage(resourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
          title: resourceBundle.getText("C_COMMON_SAPFE_ERROR"),
          description: error.message
        });
      });
    }

    /**
     * Creates the filter to retrieve a context corresponding to a semantic path.
     *
     * @param semanticPath The semantic or technical path
     * @param semanticKeys The semantic or technical keys for the path
     * @param metaModel The instance of the metamodel
     * @returns The filter
     */;
    _proto.createFilterFromPath = function createFilterFromPath(semanticPath, semanticKeys, metaModel) {
      const unquoteAndDecode = function (value) {
        if (value.indexOf("'") === 0 && value.lastIndexOf("'") === value.length - 1) {
          // Remove the quotes from the value and decode special chars
          value = decodeURIComponent(value.substring(1, value.length - 1));
        }
        return value;
      };
      const keyValues = semanticPath.substring(semanticPath.indexOf("(") + 1, semanticPath.length - 1).split(",");
      let finalKeys = semanticKeys;
      let finalKeyValues = keyValues;
      // If we have technical keys, IsActiveEntity will be present. We need to remove it as we're already adding them at the end.
      if (semanticKeys.includes("IsActiveEntity")) {
        finalKeys = semanticKeys.filter(singleKey => !singleKey.includes("IsActiveEntity"));
        finalKeyValues = keyValues.filter(element => !element.startsWith("IsActiveEntity"));
      }
      if (finalKeys.length != finalKeyValues.length) {
        return null;
      }
      const filteringCaseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel);
      let filters;
      if (finalKeys.length === 1) {
        // If this is a technical key, the equal is present because there's at least 2 parameters, a technical key and IsActiveEntity
        if (finalKeyValues[0].indexOf("=") > 0) {
          const keyPart = finalKeyValues[0].split("=");
          finalKeyValues[0] = keyPart[1];
        }
        // Take the first key value
        const keyValue = unquoteAndDecode(finalKeyValues[0]);
        filters = [new Filter({
          path: finalKeys[0],
          operator: FilterOperator.EQ,
          value1: keyValue,
          caseSensitive: filteringCaseSensitive
        })];
      } else {
        const mKeyValues = {};
        // Create a map of all key values
        finalKeyValues.forEach(function (sKeyAssignment) {
          const aParts = sKeyAssignment.split("="),
            keyValue = unquoteAndDecode(aParts[1]);
          mKeyValues[aParts[0]] = keyValue;
        });
        let failed = false;
        filters = finalKeys.map(function (semanticKey) {
          const key = semanticKey,
            value = mKeyValues[key];
          if (value !== undefined) {
            return new Filter({
              path: key,
              operator: FilterOperator.EQ,
              value1: value,
              caseSensitive: filteringCaseSensitive
            });
          } else {
            failed = true;
            return new Filter({
              path: "XX"
            }); // will be ignored anyway since we return after
          }
        });

        if (failed) {
          return null;
        }
      }

      // Add a draft filter to make sure we take the draft entity if there is one
      // Or the active entity otherwise
      const draftFilter = new Filter({
        filters: [new Filter("IsActiveEntity", "EQ", false), new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
        and: false
      });
      filters.push(draftFilter);
      return new Filter(filters, true);
    }

    /**
     * Converts a path with semantic keys to a path with technical keys.
     *
     * @param pathWithParameters The path with semantic keys
     * @param model The model for the path
     * @param keys The semantic or technical keys for the path
     * @returns A Promise containing the path with technical keys if pathWithParameters could be interpreted as a technical path, null otherwise
     */;
    _proto.getTechnicalPathFromPath = async function getTechnicalPathFromPath(pathWithParameters, model, keys) {
      var _entitySetPath;
      const metaModel = model.getMetaModel();
      let entitySetPath = metaModel.getMetaContext(pathWithParameters).getPath();
      if (!keys || keys.length === 0) {
        // No semantic/technical keys
        return null;
      }

      // Create a set of filters corresponding to all keys
      const filter = this.createFilterFromPath(pathWithParameters, keys, metaModel);
      if (filter === null) {
        // Couldn't interpret the path as a semantic one
        return null;
      }

      // Load the corresponding object
      if (!((_entitySetPath = entitySetPath) !== null && _entitySetPath !== void 0 && _entitySetPath.startsWith("/"))) {
        entitySetPath = `/${entitySetPath}`;
      }
      const listBinding = model.bindList(entitySetPath, undefined, undefined, filter, {
        $$groupId: "$auto.Heroes"
      });
      const contexts = await listBinding.requestContexts(0, 2);
      if (contexts.length) {
        return contexts[0].getPath();
      } else {
        // No data could be loaded
        return null;
      }
    }

    /**
     * Refreshes a context.
     *
     * @param model The OData model
     * @param pathToReplaceWith The path to the new context
     * @param contextToRemove The initial context that is going to be replaced
     */;
    _proto.refreshContext = async function refreshContext(model, pathToReplaceWith, contextToRemove) {
      const rootViewController = this._oAppComponent.getRootViewController();
      if (rootViewController.isFclEnabled()) {
        const contextToReplaceWith = model.getKeepAliveContext(pathToReplaceWith);
        contextToRemove.replaceWith(contextToReplaceWith);
      } else {
        EditState.setEditStateDirty();
      }
    }

    /**
     * Checks if a path is a root draft.
     *
     * @param path The path to test
     * @param metaModel The associated metadata model
     * @returns `true` if the path is a root path
     */;
    _proto.checkDraftAvailability = function checkDraftAvailability(path, metaModel) {
      const matches = /^[/]?(\w+)\([^/]+\)$/.exec(path);
      if (!matches) {
        return false;
      }
      // Get the entitySet name
      const entitySetPath = `/${matches[1]}`;
      // Check the entity set supports draft
      const draftRoot = metaModel.getObject(`${entitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
      return draftRoot ? true : false;
    }

    /**
     * Builds a path to navigate to from a path with SemanticKeys or technical keys.
     *
     * @param pathToResolve The path to be transformed
     * @param model The OData model
     * @param navigationParameter The parameter of the navigation
     * @returns String promise for the new path. If pathToResolve couldn't be interpreted as a semantic path, it is returned as is.
     */;
    _proto.resolvePath = async function resolvePath(pathToResolve, model, navigationParameter) {
      var _currentHashNoParams, _currentHashNoParams2, _currentHashNoParams3;
      const metaModel = model.getMetaModel();
      const lastSemanticMapping = this._oRoutingService.getLastSemanticMapping();
      let currentHashNoParams = this._oRouter.getHashChanger().getHash().split("?")[0];
      if (((_currentHashNoParams = currentHashNoParams) === null || _currentHashNoParams === void 0 ? void 0 : _currentHashNoParams.lastIndexOf("/")) === ((_currentHashNoParams2 = currentHashNoParams) === null || _currentHashNoParams2 === void 0 ? void 0 : _currentHashNoParams2.length) - 1) {
        // Remove trailing '/'
        currentHashNoParams = currentHashNoParams.substring(0, currentHashNoParams.length - 1);
      }
      let rootEntityName = (_currentHashNoParams3 = currentHashNoParams) === null || _currentHashNoParams3 === void 0 ? void 0 : _currentHashNoParams3.substring(0, currentHashNoParams.indexOf("("));
      if (rootEntityName.indexOf("/") === 0) {
        rootEntityName = rootEntityName.substring(1);
      }
      const isRootDraft = this.checkDraftAvailability(currentHashNoParams, metaModel),
        semanticKeys = isRootDraft ? SemanticKeyHelper.getSemanticKeys(metaModel, rootEntityName) : undefined,
        isCollaborationEnabled = ModelHelper.isCollaborationDraftSupported(metaModel);

      /**
       * If the entity is draft enabled, we're in a collaboration application, and we're navigating to a draft from a list, we're treating it as a new path.
       * We want to check if the draft exists first, then we navigate on it if it does exist, otherwise we navigate to the saved version.
       */
      if (isRootDraft && isCollaborationEnabled && navigationParameter.reason === NavigationReason.RowPress) {
        var _navigationParameter$;
        const isActiveEntity = ((_navigationParameter$ = navigationParameter.useContext) === null || _navigationParameter$ === void 0 ? void 0 : _navigationParameter$.getProperty("IsActiveEntity")) ?? true;
        if (!isActiveEntity) {
          return this.resolveCollaborationPath(pathToResolve, model, navigationParameter, semanticKeys, rootEntityName);
        }
      }
      /**
       * This is the 'normal' process.
       * If we don't have semantic keys, the path we have is technical and can be used as is.
       * If the path to resolve is the same as the semantic path, then we know is has been resolved previously and we can return the technical path
       * Otherwise, we need to evaluate the technical path, to set up the semantic mapping (if it's been resolved).
       */
      if (semanticKeys === undefined) {
        return pathToResolve;
      }
      if ((lastSemanticMapping === null || lastSemanticMapping === void 0 ? void 0 : lastSemanticMapping.semanticPath) === pathToResolve) {
        // This semantic path has been resolved previously
        return lastSemanticMapping.technicalPath;
      }
      const formattedSemanticKeys = semanticKeys.map(singleKey => singleKey.$PropertyPath);

      // We need resolve the semantic path to get the technical keys
      const technicalPath = await this.getTechnicalPathFromPath(currentHashNoParams, model, formattedSemanticKeys);
      if (technicalPath && technicalPath !== pathToResolve) {
        // The semantic path was resolved (otherwise keep the original value for target)
        this._oRoutingService.setLastSemanticMapping({
          technicalPath: technicalPath,
          semanticPath: pathToResolve
        });
        return technicalPath;
      }
      return pathToResolve;
    }

    /**
     * Evaluate the path to navigate when we're in a collaboration application and navigating to a draft.
     * If the draft has been discarded, we change the path to the sibling element associated, otherwise we keep the same path.
     * We're not doing it outside of collaboration as it's adding a request during navigation!
     *
     * @param pathToResolve The path we're checking. If the draft exists, we return it as is, otherwise we return the sibling element associated
     * @param model The oData model
     * @param navigationParameter The parameter of the navigation
     * @param semanticKeys The semantic keys if we have semantic navigation, otherwise false
     * @param rootEntityName Name of the root entity
     * @returns The path to navigate to
     */;
    _proto.resolveCollaborationPath = async function resolveCollaborationPath(pathToResolve, model, navigationParameter, semanticKeys, rootEntityName) {
      const lastSemanticMapping = this._oRoutingService.getLastSemanticMapping();
      const metaModel = model.getMetaModel();
      const currentHashNoParams = this._oRouter.getHashChanger().getHash().split("?")[0];
      let formattedKeys;
      const comparativePath = (lastSemanticMapping === null || lastSemanticMapping === void 0 ? void 0 : lastSemanticMapping.technicalPath) ?? pathToResolve;
      if (semanticKeys) {
        formattedKeys = semanticKeys.map(singleKey => singleKey.$PropertyPath);
      } else {
        formattedKeys = metaModel.getObject(`/${rootEntityName}/$Type/$Key`);
      }
      const technicalPath = await this.getTechnicalPathFromPath(currentHashNoParams, model, formattedKeys);
      if (technicalPath === null) {
        return pathToResolve;
      }
      // Comparing path that was returned from the server with the one we have. If they are different, it means the draft doesn't exist.
      if (technicalPath !== comparativePath && navigationParameter.useContext) {
        var _metaModel$getObject;
        if (lastSemanticMapping) {
          this._oRoutingService.setLastSemanticMapping({
            technicalPath: technicalPath,
            semanticPath: pathToResolve
          });
        }
        navigationParameter.redirectedToNonDraft = ((_metaModel$getObject = metaModel.getObject(`/${rootEntityName}/@com.sap.vocabularies.UI.v1.HeaderInfo`)) === null || _metaModel$getObject === void 0 ? void 0 : _metaModel$getObject.TypeName) ?? rootEntityName;
        await this.refreshContext(model, technicalPath, navigationParameter.useContext);
      }
      return technicalPath;
    }

    /**
     * Sets the binding context of the page from a path.
     *
     * @param sTargetPath The path to build the context. Needs to contain technical keys only.
     * @param oModel The OData model
     * @param oNavigationParameters Navigation parameters
     */;
    _proto._bindPageToPath = function _bindPageToPath(sTargetPath, oModel, oNavigationParameters) {
      const oCurrentContext = this._getBindingContext(),
        sCurrentPath = oCurrentContext && oCurrentContext.getPath(),
        oUseContext = oNavigationParameters.useContext;

      // We set the binding context only if it's different from the current one
      // or if we have a context already selected
      if (oUseContext && oUseContext.getPath() === sTargetPath) {
        if (oUseContext !== oCurrentContext) {
          let shouldRefreshContext = false;
          // We already have the context to be used, and it's not the current one
          const oRootViewController = this._oAppComponent.getRootViewController();

          // In case of FCL, if we're reusing a context from a table (through navigation), we refresh it to avoid outdated data
          // We don't wait for the refresh to be completed (requestRefresh), so that the corresponding query goes into the same
          // batch as the ones from controls in the page.
          if (oRootViewController.isFclEnabled() && oNavigationParameters.reason === NavigationReason.RowPress) {
            const metaModel = oUseContext.getModel().getMetaModel();
            if (!oUseContext.getBinding().hasPendingChanges()) {
              shouldRefreshContext = true;
            } else if (ActivitySync.isConnected(this.getView()) || ModelHelper.isDraftSupported(metaModel, oUseContext.getPath()) && ModelHelper.isCollaborationDraftSupported(metaModel)) {
              // If there are pending changes but we're in collaboration draft, we force the refresh (discarding pending changes) as we need to have the latest version.
              // When navigating from LR to OP, the view is not connected yet --> check if we're in draft with collaboration from the metamodel
              oUseContext.getBinding().resetChanges();
              shouldRefreshContext = true;
            }
          }
          this._bindPageToContext(oUseContext, oModel, oNavigationParameters);
          if (shouldRefreshContext) {
            oUseContext.refresh();
          }
        } else if (oNavigationParameters.reason === NavigationReason.EditFlowAction) {
          // We have the same context but an editflow action happened (e.g. CancelDocument in sticky mode)
          // --> We need to call onBefore/AfterBinding to refresh the object page properly
          this.onBeforeBinding(oUseContext, {
            editable: oNavigationParameters.bTargetEditable,
            listBinding: oUseContext.getBinding(),
            bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
            reason: oNavigationParameters.reason,
            showPlaceholder: oNavigationParameters.bShowPlaceholder
          });
          this.onAfterBinding(oUseContext, {
            redirectedToNonDraft: oNavigationParameters === null || oNavigationParameters === void 0 ? void 0 : oNavigationParameters.redirectedToNonDraft
          });
        }
      } else if (sCurrentPath !== sTargetPath) {
        // We need to create a new context for its path
        this._bindPageToContext(this._createContext(sTargetPath, oModel), oModel, oNavigationParameters);
      } else if (oNavigationParameters.reason !== NavigationReason.AppStateChanged && oNavigationParameters.reason !== NavigationReason.RestoreHistory && EditState.isEditStateDirty()) {
        this._refreshBindingContext(oCurrentContext);
      }
    }

    /**
     * Binds the page to a context.
     *
     * @param oContext Context to be bound
     * @param oModel The OData model
     * @param oNavigationParameters Navigation parameters
     */;
    _proto._bindPageToContext = function _bindPageToContext(oContext, oModel, oNavigationParameters) {
      if (!oContext) {
        this.onBeforeBinding(null);
        this.onAfterBinding(null);
        return;
      }
      const oParentListBinding = oContext.getBinding();
      const oRootViewController = this._oAppComponent.getRootViewController();
      if (oRootViewController.isFclEnabled()) {
        if (!oParentListBinding || !oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          // if the parentBinding is not a listBinding, we create a new context
          oContext = this._createContext(oContext.getPath(), oModel);
        }
        try {
          this._setKeepAlive(oContext, true, () => {
            if (oContext && oRootViewController.isContextUsedInPages(oContext)) {
              this.navigateBackFromContext(oContext);
            }
          }, true // Load messages, otherwise they don't get refreshed later, e.g. for side effects
          );
        } catch (oError) {
          // setKeepAlive throws an exception if the parent listbinding doesn't have $$ownRequest=true
          // This case for custom fragments is supported, but an error is logged to make the lack of synchronization apparent
          Log.error(`View for ${oContext.getPath()} won't be synchronized. Parent listBinding must have binding parameter $$ownRequest=true`);
        }
      } else if (!oParentListBinding || oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        // We need to recreate the context otherwise we get errors
        oContext = this._createContext(oContext.getPath(), oModel);
      }

      // Set the binding context with the proper before/after callbacks
      this.onBeforeBinding(oContext, {
        editable: oNavigationParameters.bTargetEditable,
        listBinding: oParentListBinding,
        bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
        reason: oNavigationParameters.reason,
        showPlaceholder: oNavigationParameters.bShowPlaceholder
      });
      this._setBindingContext(oContext);
      this.onAfterBinding(oContext, {
        redirectedToNonDraft: oNavigationParameters === null || oNavigationParameters === void 0 ? void 0 : oNavigationParameters.redirectedToNonDraft
      });
    }

    /**
     * Creates a context from a path.
     *
     * @param sPath The path
     * @param oModel The OData model
     * @returns The created context
     */;
    _proto._createContext = function _createContext(sPath, oModel) {
      const oPageComponent = this._oPageComponent,
        sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet(),
        sContextPath = oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath() || sEntitySet && `/${sEntitySet}`,
        oMetaModel = oModel.getMetaModel(),
        mParameters = {
          $$groupId: "$auto.Heroes",
          $$updateGroupId: "$auto",
          $$patchWithoutSideEffects: true
        };
      // In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity)
      const oDraftRoot = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
      const oDraftNode = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftNode`);
      const oRootViewController = this._oAppComponent.getRootViewController();
      if (oRootViewController.isFclEnabled()) {
        const oContext = this._getKeepAliveContext(oModel, sPath, false, mParameters);
        if (!oContext) {
          throw new Error(`Cannot create keepAlive context ${sPath}`);
        } else if (oDraftRoot || oDraftNode) {
          if (oContext.getProperty("IsActiveEntity") === undefined) {
            oContext.requestProperty(["HasActiveEntity", "HasDraftEntity", "IsActiveEntity"]);
            if (oDraftRoot) {
              oContext.requestObject("DraftAdministrativeData");
            }
          } else {
            // when switching between draft and edit we need to ensure those properties are requested again even if they are in the binding's cache
            // otherwise when you edit and go to the saved version you have no way of switching back to the edit version
            oContext.requestSideEffects(oDraftRoot ? ["HasActiveEntity", "HasDraftEntity", "IsActiveEntity", "DraftAdministrativeData"] : ["HasActiveEntity", "HasDraftEntity", "IsActiveEntity"]);
          }
        }
        return oContext;
      } else {
        if (sEntitySet) {
          const sMessagesPath = oMetaModel.getObject(`${sContextPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
          if (sMessagesPath) {
            mParameters.$select = sMessagesPath;
          }
        }

        // In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity)
        if (oDraftRoot || oDraftNode) {
          if (mParameters.$select === undefined) {
            mParameters.$select = "HasActiveEntity,HasDraftEntity,IsActiveEntity";
          } else {
            mParameters.$select += ",HasActiveEntity,HasDraftEntity,IsActiveEntity";
          }
        }
        if (this._oView.getBindingContext()) {
          var _this$_oView$getBindi2;
          const oPreviousBinding = (_this$_oView$getBindi2 = this._oView.getBindingContext()) === null || _this$_oView$getBindi2 === void 0 ? void 0 : _this$_oView$getBindi2.getBinding();
          if (oPreviousBinding) {
            oModel.resetChanges(oPreviousBinding.getUpdateGroupId());
            oPreviousBinding.destroy();
          }
        }
        const oHiddenBinding = oModel.bindContext(sPath, undefined, mParameters);
        oHiddenBinding.attachEventOnce("dataRequested", () => {
          BusyLocker.lock(this._oView);
        });
        oHiddenBinding.attachEventOnce("dataReceived", this.onDataReceived.bind(this));
        return oHiddenBinding.getBoundContext();
      }
    };
    _proto.onDataReceived = async function onDataReceived(oEvent) {
      const sErrorDescription = oEvent && oEvent.getParameter("error");
      if (BusyLocker.isLocked(this._oView)) {
        BusyLocker.unlock(this._oView);
      }
      if (sErrorDescription) {
        // TODO: in case of 404 the text shall be different
        try {
          const oResourceBundle = await Core.getLibraryResourceBundle("sap.fe.core", true);
          const messageHandler = this.base.messageHandler;
          let mParams = {};
          if (sErrorDescription.status === 503) {
            mParams = {
              isInitialLoad503Error: true,
              shellBack: true
            };
          } else if (sErrorDescription.status === 400) {
            mParams = {
              title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
              description: oResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR_DESCRIPTION"),
              isDataReceivedError: true,
              shellBack: true
            };
          } else {
            mParams = {
              title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
              description: sErrorDescription,
              isDataReceivedError: true,
              shellBack: true
            };
          }
          await messageHandler.showMessages(mParams);
        } catch (oError) {
          Log.error("Error while getting the core resource bundle", oError);
        }
      }
    }

    /**
     * Requests side effects on a binding context to "refresh" it.
     * TODO: get rid of this once provided by the model
     * a refresh on the binding context does not work in case a creation row with a transient context is
     * used. also a requestSideEffects with an empty path would fail due to the transient context
     * therefore we get all dependent bindings (via private model method) to determine all paths and then
     * request them.
     *
     * @param oBindingContext Context to be refreshed
     */;
    _proto._refreshBindingContext = function _refreshBindingContext(oBindingContext) {
      const oPageComponent = this._oPageComponent;
      const oSideEffectsService = this._oAppComponent.getSideEffectsService();
      const sRootContextPath = oBindingContext.getPath();
      const sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet();
      const sContextPath = oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath() || sEntitySet && `/${sEntitySet}`;
      const oMetaModel = this._oView.getModel().getMetaModel();
      let sMessagesPath;
      const aNavigationPropertyPaths = [];
      const aPropertyPaths = [];
      const oSideEffects = {
        targetProperties: [],
        targetEntities: []
      };
      function getBindingPaths(oBinding) {
        let aDependentBindings;
        const sRelativePath = (oBinding.getContext() && oBinding.getContext().getPath() || "").replace(sRootContextPath, ""); // If no context, this is an absolute binding so no relative path
        const sPath = (sRelativePath ? `${sRelativePath.slice(1)}/` : sRelativePath) + oBinding.getPath();
        if (oBinding.isA("sap.ui.model.odata.v4.ODataContextBinding")) {
          // if (sPath === "") {
          // now get the dependent bindings
          aDependentBindings = oBinding.getDependentBindings();
          if (aDependentBindings) {
            // ask the dependent bindings (and only those with the specified groupId
            //if (aDependentBindings.length > 0) {
            for (let i = 0; i < aDependentBindings.length; i++) {
              getBindingPaths(aDependentBindings[i]);
            }
          } else if (!aNavigationPropertyPaths.includes(sPath)) {
            aNavigationPropertyPaths.push(sPath);
          }
        } else if (oBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          if (!aNavigationPropertyPaths.includes(sPath)) {
            aNavigationPropertyPaths.push(sPath);
          }
        } else if (oBinding.isA("sap.ui.model.odata.v4.ODataPropertyBinding")) {
          if (!aPropertyPaths.includes(sPath)) {
            aPropertyPaths.push(sPath);
          }
        }
      }
      if (sContextPath) {
        sMessagesPath = oMetaModel.getObject(`${sContextPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
      }

      // binding of the context must have $$PatchWithoutSideEffects true, this bound context may be needed to be fetched from the dependent binding
      getBindingPaths(oBindingContext.getBinding());
      let i;
      for (i = 0; i < aNavigationPropertyPaths.length; i++) {
        oSideEffects.targetEntities.push({
          $NavigationPropertyPath: aNavigationPropertyPaths[i]
        });
      }
      oSideEffects.targetProperties = aPropertyPaths;
      if (sMessagesPath) {
        oSideEffects.targetProperties.push(sMessagesPath);
      }
      //all this logic to be replaced with a SideEffects request for an empty path (refresh everything), after testing transient contexts
      oSideEffects.targetProperties = oSideEffects.targetProperties.reduce((targets, targetProperty) => {
        if (targetProperty) {
          const index = targetProperty.indexOf("/");
          targets.push(index > 0 ? targetProperty.slice(0, index) : targetProperty);
        }
        return targets;
      }, []);
      // OData model will take care of duplicates
      oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
    }

    /**
     * Gets the binding context of the page or the component.
     *
     * @returns The binding context
     */;
    _proto._getBindingContext = function _getBindingContext() {
      if (this._oPageComponent) {
        return this._oPageComponent.getBindingContext();
      } else {
        return this._oView.getBindingContext();
      }
    }

    /**
     * Sets the binding context of the page or the component.
     *
     * @param oContext The binding context
     */;
    _proto._setBindingContext = function _setBindingContext(oContext) {
      var _oPreviousContext;
      let oPreviousContext, oTargetControl;
      if (this._oPageComponent) {
        oPreviousContext = this._oPageComponent.getBindingContext();
        oTargetControl = this._oPageComponent;
      } else {
        oPreviousContext = this._oView.getBindingContext();
        oTargetControl = this._oView;
      }
      oTargetControl.setBindingContext(oContext);
      if ((_oPreviousContext = oPreviousContext) !== null && _oPreviousContext !== void 0 && _oPreviousContext.isKeepAlive() && oPreviousContext !== oContext) {
        this._setKeepAlive(oPreviousContext, false);
      }
    }

    /**
     * Gets the flexible column layout (FCL) level corresponding to the view (-1 if the app is not FCL).
     *
     * @returns The level
     */;
    _proto._getFCLLevel = function _getFCLLevel() {
      return this._oTargetInformation.FCLLevel;
    };
    _proto._setKeepAlive = function _setKeepAlive(oContext, bKeepAlive, fnBeforeDestroy, bRequestMessages) {
      if (oContext.getPath().endsWith(")")) {
        // We keep the context alive only if they're part of a collection, i.e. if the path ends with a ')'
        const oMetaModel = oContext.getModel().getMetaModel();
        const sMetaPath = oMetaModel.getMetaPath(oContext.getPath());
        const sMessagesPath = oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
        oContext.setKeepAlive(bKeepAlive, fnBeforeDestroy, !!sMessagesPath && bRequestMessages);
      }
    };
    _proto._getKeepAliveContext = function _getKeepAliveContext(oModel, path, bRequestMessages, parameters) {
      // Get the path for the context that is really kept alive (part of a collection)
      // i.e. remove all segments not ending with a ')'
      const keptAliveSegments = path.split("/");
      const additionnalSegments = [];
      while (keptAliveSegments.length && !keptAliveSegments[keptAliveSegments.length - 1].endsWith(")")) {
        additionnalSegments.push(keptAliveSegments.pop());
      }
      if (keptAliveSegments.length === 0) {
        return undefined;
      }
      const keptAlivePath = keptAliveSegments.join("/");
      const oKeepAliveContext = oModel.getKeepAliveContext(keptAlivePath, bRequestMessages, parameters);
      if (additionnalSegments.length === 0) {
        return oKeepAliveContext;
      } else {
        additionnalSegments.reverse();
        const additionnalPath = additionnalSegments.join("/");
        return oModel.bindContext(additionnalPath, oKeepAliveContext).getBoundContext();
      }
    }

    /**
     * Switches between column and full-screen mode when FCL is used.
     *
     */;
    _proto.switchFullScreen = function switchFullScreen() {
      const oSource = this.base.getView();
      const oFCLHelperModel = oSource.getModel("fclhelper"),
        bIsFullScreen = oFCLHelperModel.getProperty("/actionButtonsInfo/isFullScreen"),
        sNextLayout = oFCLHelperModel.getProperty(bIsFullScreen ? "/actionButtonsInfo/exitFullScreen" : "/actionButtonsInfo/fullScreen"),
        oRootViewController = this._oAppComponent.getRootViewController();
      const oContext = oRootViewController.getRightmostContext ? oRootViewController.getRightmostContext() : oSource.getBindingContext();
      this.base._routing.navigateToContext(oContext, {
        layout: sNextLayout
      }).catch(function () {
        Log.warning("cannot switch between column and fullscreen");
      });
    }

    /**
     * Closes the column for the current view in a FCL.
     *
     */;
    _proto.closeColumn = function closeColumn() {
      const oViewData = this._oView.getViewData();
      const oContext = this._oView.getBindingContext();
      const oMetaModel = oContext.getModel().getMetaModel();
      const navigationParameters = {
        noPreservationCache: true,
        sLayout: this._oView.getModel("fclhelper").getProperty("/actionButtonsInfo/closeColumn")
      };
      if ((oViewData === null || oViewData === void 0 ? void 0 : oViewData.viewLevel) === 1 && ModelHelper.isDraftSupported(oMetaModel, oContext.getPath())) {
        draft.processDataLossOrDraftDiscardConfirmation(() => {
          this.navigateBackFromContext(oContext, navigationParameters);
        }, Function.prototype, oContext, this._oView.getController(), false, draft.NavigationType.BackNavigation);
      } else {
        this.navigateBackFromContext(oContext, navigationParameters);
      }
    };
    return InternalRouting;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRouteMatched", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "onRouteMatched"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRouteMatchedFinished", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onRouteMatchedFinished"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeBinding", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateToTarget", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateToTarget"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateToRoute", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateToRoute"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateBackFromTransientState", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateBackFromTransientState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateToMessagePage", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateToMessagePage"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isCurrentStateImpactedBy", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "isCurrentStateImpactedBy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDataReceived", [_dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "onDataReceived"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "switchFullScreen", [_dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "switchFullScreen"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "closeColumn", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "closeColumn"), _class2.prototype)), _class2)) || _class);
  return InternalRouting;
}, false);
