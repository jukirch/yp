/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepEqual", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ToES6Promise", "sap/fe/navigation/library", "sap/ui/base/Object", "./controllerextensions/BusyLocker", "./helpers/ModelHelper"], function (Log, deepEqual, ClassSupport, toES6Promise, library, BaseObject, BusyLocker, ModelHelper) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  const NavType = library.NavType;
  const SKIP_MERGE_KEY = "skipMerge";
  let AppStateHandler = (_dec = defineUI5Class("sap.fe.core.AppStateHandler"), _dec(_class = /*#__PURE__*/function (_BaseObject) {
    _inheritsLoose(AppStateHandler, _BaseObject);
    function AppStateHandler(oAppComponent) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this._mCurrentAppState = {};
      _this.oAppComponent = oAppComponent;
      _this.sId = `${oAppComponent.getId()}/AppStateHandler`;
      _this.nbSimultaneousCreateRequest = 0;
      _this.bNoRouteChange = false;
      Log.info("APPSTATE : Appstate handler initialized");
      return _this;
    }
    var _proto = AppStateHandler.prototype;
    _proto.getId = function getId() {
      return this.sId;
    }

    /**
     * Creates or updates the appstate.
     * Replaces the hash with the new appstate based on replaceHash
     *
     * @param createAppParameters Parameters for creating new appstate
     * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
     * @param createAppParameters.skipMerge Boolean which determines to skip the key user shine through
     * @returns A promise resolving the stored data or appstate key based on returnKey property
     */;
    _proto.createAppState = async function createAppState(createAppParameters) {
      if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
        return;
      }
      const {
        replaceHash = true,
        skipMerge = false
      } = createAppParameters || {};
      const navigationService = this.oAppComponent.getNavigationService(),
        routerProxy = this.oAppComponent.getRouterProxy(),
        hash = routerProxy.getHash(),
        controller = this.oAppComponent.getRootControl().getController(),
        isStickyMode = ModelHelper.isStickySessionSupported(this.oAppComponent.getMetaModel());
      if (!controller.viewState) {
        throw new Error(`viewState controller extension not available for controller: ${controller.getMetadata().getName()}`);
      }
      let innerAppState = await controller.viewState.retrieveViewState();
      if (skipMerge) {
        innerAppState = {
          ...innerAppState,
          ...{
            skipMerge
          }
        };
      }
      const appStateData = {
        appState: innerAppState
      };
      let appStateKey = null;
      if (innerAppState && !deepEqual(this._mCurrentAppState, innerAppState)) {
        this._mCurrentAppState = innerAppState;
        try {
          this.nbSimultaneousCreateRequest++;
          appStateKey = await navigationService.storeInnerAppStateAsync(appStateData, true, true);
          Log.info("APPSTATE: Appstate stored");
          if (replaceHash === true) {
            const sNewHash = navigationService.replaceInnerAppStateKey(hash, appStateKey);
            this.nbSimultaneousCreateRequest--;
            if (this.nbSimultaneousCreateRequest === 0 && sNewHash !== hash) {
              routerProxy.navToHash(sNewHash, undefined, undefined, undefined, !isStickyMode);
              this.bNoRouteChange = true;
            }
            Log.info("APPSTATE: navToHash");
          }
        } catch (oError) {
          Log.error(oError);
        }
      } else {
        appStateKey = routerProxy.findAppStateInHash(hash);
      }
      return {
        appStateData: appStateData,
        appStateKey: appStateKey
      };
    };
    _proto._createNavigationParameters = function _createNavigationParameters(oAppData, sNavType) {
      return Object.assign({}, oAppData, {
        selectionVariantDefaults: oAppData.oDefaultedSelectionVariant,
        selectionVariant: oAppData.oSelectionVariant,
        requiresStandardVariant: !oAppData.bNavSelVarHasDefaultsOnly,
        navigationType: sNavType
      });
    };
    _proto._checkIfLastSeenRecord = function _checkIfLastSeenRecord(view) {
      //getting the internal model context in order to fetch the technicalkeys of last seen record and close column flag set in the internalrouting for retaining settings in persistence mode
      const internalModelContext = view && view.getBindingContext("internal");
      if (internalModelContext && internalModelContext.getProperty("fclColumnClosed") === true) {
        const technicalKeysObject = internalModelContext.getProperty("technicalKeysOfLastSeenRecord");
        const bindingContext = view === null || view === void 0 ? void 0 : view.getBindingContext();
        const path = bindingContext && bindingContext.getPath() || "";
        const metaModel = bindingContext === null || bindingContext === void 0 ? void 0 : bindingContext.getModel().getMetaModel();
        const metaPath = metaModel === null || metaModel === void 0 ? void 0 : metaModel.getMetaPath(path);
        const technicalKeys = metaModel === null || metaModel === void 0 ? void 0 : metaModel.getObject(`${metaPath}/$Type/$Key`);
        for (const element of technicalKeys) {
          const keyValue = bindingContext.getObject()[element];
          if (keyValue !== technicalKeysObject[element]) {
            internalModelContext.setProperty("fclColumnClosed", false);
            return true;
          }
        }
        //the record opened is not the last seen one : no need to persist the changes, reset to default instead
      }

      return false;
    };
    _proto._getAppStateData = function _getAppStateData(oAppData, viewId, navType) {
      let key = "",
        i = 0;
      const appStateData = navType === NavType.hybrid ? oAppData.iAppState : oAppData;
      if (appStateData !== null && appStateData !== void 0 && appStateData.appState) {
        for (i; i < Object.keys(appStateData.appState).length; i++) {
          if (Object.keys(appStateData.appState)[i] === viewId) {
            key = Object.keys(appStateData.appState)[i];
            break;
          }
        }
      }
      if (appStateData !== null && appStateData !== void 0 && appStateData.appState) {
        return {
          [Object.keys(appStateData.appState)[i]]: appStateData.appState[key] || {}
        };
      }
    }

    /**
     * Applies an appstate by fetching appdata and passing it to _applyAppstateToPage.
     *
     * @param viewId
     * @param view
     * @returns A promise for async handling
     */;
    _proto.applyAppState = async function applyAppState(viewId, view) {
      if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
        return Promise.resolve();
      }
      const checkIfLastSeenRecord = this._checkIfLastSeenRecord(view);
      if (checkIfLastSeenRecord === true) {
        return Promise.resolve();
      }
      BusyLocker.lock(this);
      // Done for busy indicator
      BusyLocker.lock(this.oAppComponent.getRootControl());
      const oNavigationService = this.oAppComponent.getNavigationService();
      // TODO oNavigationService.parseNavigation() should return ES6 promise instead jQuery.promise
      return toES6Promise(oNavigationService.parseNavigation()).catch(function (aErrorData) {
        if (!aErrorData) {
          aErrorData = [];
        }
        Log.warning("APPSTATE: Parse Navigation failed", aErrorData[0]);
        return [{
          /* app data */
        }, aErrorData[1], aErrorData[2]];
      }).then(aResults => {
        var _oAppData$appState;
        Log.info("APPSTATE: Parse Navigation done");

        // aResults[1] => oStartupParameters (not evaluated)
        const oAppData = aResults[0] || {},
          sNavType = aResults[2] || NavType.initial,
          oRootController = this.oAppComponent.getRootControl().getController();
        // apply the appstate depending upon the view (LR/OP)
        const appStateData = this._getAppStateData(oAppData, viewId, sNavType);
        // fetch the skipMerge flag from appState for save as tile
        const skipMerge = oAppData === null || oAppData === void 0 ? void 0 : (_oAppData$appState = oAppData.appState) === null || _oAppData$appState === void 0 ? void 0 : _oAppData$appState[SKIP_MERGE_KEY];
        this._mCurrentAppState = sNavType === NavType.iAppState || sNavType === NavType.hybrid ? appStateData : undefined;
        if (!oRootController.viewState) {
          throw new Error(`viewState extension required for controller ${oRootController.getMetadata().getName()}`);
        }
        if ((!oAppData || Object.keys(oAppData).length === 0) && sNavType == NavType.iAppState) {
          if (!oRootController.viewState._getInitialStateApplied()) {
            oRootController.viewState._setInitialStateApplied();
          }
          return {};
        }
        return oRootController.viewState.applyViewState(this._mCurrentAppState, this._createNavigationParameters(oAppData, sNavType), skipMerge);
      }).catch(function (oError) {
        Log.error("appState could not be applied", oError);
        throw oError;
      }).finally(() => {
        BusyLocker.unlock(this);
        BusyLocker.unlock(this.oAppComponent.getRootControl());
      });
    }

    /**
     * To check is route is changed by change in the iAPPState.
     *
     * @returns `true` if the route has chnaged
     */;
    _proto.checkIfRouteChangedByIApp = function checkIfRouteChangedByIApp() {
      return this.bNoRouteChange;
    }

    /**
     * Reset the route changed by iAPPState.
     */;
    _proto.resetRouteChangedByIApp = function resetRouteChangedByIApp() {
      if (this.bNoRouteChange) {
        this.bNoRouteChange = false;
      }
    };
    return AppStateHandler;
  }(BaseObject)) || _class);
  /**
   * @global
   */
  return AppStateHandler;
}, true);
