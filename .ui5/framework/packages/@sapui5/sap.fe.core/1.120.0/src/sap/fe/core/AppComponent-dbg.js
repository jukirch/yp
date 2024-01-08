/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/AppStateHandler", "sap/fe/core/controllerextensions/routing/RouterProxy", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/DraftEditState", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/library", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/fe/core/support/Diagnostics", "sap/m/routing/Router", "sap/ui/core/Core", "sap/ui/core/Element", "sap/ui/core/UIComponent", "sap/ui/mdc/table/TableTypeBase", "sap/ui/model/json/JSONModel", "./controllerextensions/BusyLocker", "./converters/MetaModelConverter", "./helpers/SemanticDateOperators"], function (Log, AppStateHandler, RouterProxy, ClassSupport, DraftEditState, ModelHelper, library, ChangePageConfiguration, Diagnostics, Router, Core, UI5Element, UIComponent, TableTypeBase, JSONModel, BusyLocker, MetaModelConverter, SemanticDateOperators) {
  "use strict";

  var _dec, _class, _class2;
  var deleteModelCacheData = MetaModelConverter.deleteModelCacheData;
  var cleanPageConfigurationChanges = ChangePageConfiguration.cleanPageConfigurationChanges;
  var changeConfiguration = ChangePageConfiguration.changeConfiguration;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  const StartupMode = library.StartupMode;
  TableTypeBase.prototype.exit = function () {
    var _this$_oManagedObject;
    (_this$_oManagedObject = this._oManagedObjectModel) === null || _this$_oManagedObject === void 0 ? void 0 : _this$_oManagedObject.destroy();
    delete this._oManagedObjectModel;
    UI5Element.prototype.exit.apply(this, []);
  };
  const NAVCONF = {
    FCL: {
      VIEWNAME: "sap.fe.core.rootView.Fcl",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.Fcl",
      ROUTERCLASS: "sap.f.routing.Router"
    },
    NAVCONTAINER: {
      VIEWNAME: "sap.fe.core.rootView.NavContainer",
      VIEWNAME_COMPATIBILITY: "sap.fe.templates.RootContainer.view.NavContainer",
      ROUTERCLASS: "sap.m.routing.Router"
    }
  };
  // Keep a reference so as to keep the import despite it not being directly used
  const _mRouter = Router;
  /**
   * Main class for components used for an application in SAP Fiori elements.
   *
   * Application developers using the templates and building blocks provided by SAP Fiori elements should create their apps by extending this component.
   * This ensures that all the necessary services that you need for the building blocks and templates to work properly are started.
   *
   * When you use sap.fe.core.AppComponent as the base component, you also need to use a rootView. SAP Fiori elements provides two options: <br/>
   *  - sap.fe.core.rootView.NavContainer when using sap.m.routing.Router <br/>
   *  - sap.fe.core.rootView.Fcl when using sap.f.routing.Router (FCL use case) <br/>
   *
   * @hideconstructor
   * @public
   */
  let AppComponent = (_dec = defineUI5Class("sap.fe.core.AppComponent", {
    interfaces: ["sap.ui.core.IAsyncContentCreation"],
    config: {
      fullWidth: true
    },
    manifest: {
      "sap.ui5": {
        services: {
          resourceModel: {
            factoryName: "sap.fe.core.services.ResourceModelService",
            startup: "waitFor",
            settings: {
              bundles: ["sap.fe.core.messagebundle"],
              modelName: "sap.fe.i18n"
            }
          },
          routingService: {
            factoryName: "sap.fe.core.services.RoutingService",
            startup: "waitFor"
          },
          shellServices: {
            factoryName: "sap.fe.core.services.ShellServices",
            startup: "waitFor"
          },
          ShellUIService: {
            factoryName: "sap.ushell.ui5service.ShellUIService"
          },
          navigationService: {
            factoryName: "sap.fe.core.services.NavigationService",
            startup: "waitFor"
          },
          environmentCapabilities: {
            factoryName: "sap.fe.core.services.EnvironmentService",
            startup: "waitFor"
          },
          sideEffectsService: {
            factoryName: "sap.fe.core.services.SideEffectsService",
            startup: "waitFor"
          },
          asyncComponentService: {
            factoryName: "sap.fe.core.services.AsyncComponentService",
            startup: "waitFor"
          },
          collaborationManagerService: {
            factoryName: "sap.fe.core.services.CollaborationManagerService",
            startup: "waitFor"
          },
          collaborativeToolsService: {
            factoryName: "sap.fe.core.services.CollaborativeToolsService",
            startup: "waitFor"
          }
        },
        rootView: {
          viewName: NAVCONF.NAVCONTAINER.VIEWNAME,
          type: "XML",
          async: true,
          id: "appRootView"
        },
        routing: {
          config: {
            controlId: "appContent",
            routerClass: NAVCONF.NAVCONTAINER.ROUTERCLASS,
            viewType: "XML",
            controlAggregation: "pages",
            async: true,
            containerOptions: {
              propagateModel: true
            }
          }
        }
      }
    },
    designtime: "sap/fe/core/designtime/AppComponent.designtime",
    library: "sap.fe.core"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_UIComponent) {
    _inheritsLoose(AppComponent, _UIComponent);
    function AppComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _UIComponent.call(this, ...args) || this;
      _this.startupMode = StartupMode.Normal;
      return _this;
    }
    var _proto = AppComponent.prototype;
    _proto._isFclEnabled = function _isFclEnabled() {
      var _oManifestUI5$routing, _oManifestUI5$routing2;
      const oManifestUI5 = this.getManifestEntry("sap.ui5");
      return (oManifestUI5 === null || oManifestUI5 === void 0 ? void 0 : (_oManifestUI5$routing = oManifestUI5.routing) === null || _oManifestUI5$routing === void 0 ? void 0 : (_oManifestUI5$routing2 = _oManifestUI5$routing.config) === null || _oManifestUI5$routing2 === void 0 ? void 0 : _oManifestUI5$routing2.routerClass) === NAVCONF.FCL.ROUTERCLASS;
    }

    /**
     * Provides a hook to initialize feature toggles.
     *
     * This hook is being called by the SAP Fiori elements AppComponent at the time feature toggles can be initialized.
     * To change page configuration use the {@link sap.fe.core.AppComponent#changePageConfiguration} method.
     *
     * @public
     * @returns A promise without any value to allow asynchronous processes
     */;
    _proto.initializeFeatureToggles = async function initializeFeatureToggles() {
      // this method can be overridden by applications
      return Promise.resolve();
    }

    /**
     * Changes the page configuration of SAP Fiori elements.
     *
     * This method enables you to change the page configuration of SAP Fiori elements.
     *
     * @param pageId The ID of the page for which the configuration is to be changed.
     * @param path The path in the page settings for which the configuration is to be changed.
     * @param value The new value of the configuration. This could be a plain value like a string, or a Boolean, or a structured object.
     * @public
     */;
    _proto.changePageConfiguration = function changePageConfiguration(pageId, path, value) {
      changeConfiguration(this.getManifest(), pageId, path, value, true);
    }

    /**
     * Get a reference to the RouterProxy.
     *
     * @returns A Reference to the RouterProxy
     * @final
     */;
    _proto.getRouterProxy = function getRouterProxy() {
      return this._oRouterProxy;
    }

    /**
     * Get a reference to the AppStateHandler.
     *
     * @returns A reference to the AppStateHandler
     * @final
     */;
    _proto.getAppStateHandler = function getAppStateHandler() {
      return this._oAppStateHandler;
    }

    /**
     * Get a reference to the nav/FCL Controller.
     *
     * @returns  A reference to the FCL Controller
     * @final
     */;
    _proto.getRootViewController = function getRootViewController() {
      return this.getRootControl().getController();
    }

    /**
     * Get the NavContainer control or the FCL control.
     *
     * @returns  A reference to NavContainer control or the FCL control
     * @final
     */;
    _proto.getRootContainer = function getRootContainer() {
      return this.getRootControl().getContent()[0];
    }

    /**
     * Get the startup mode of the app.
     *
     * @returns The startup mode
     */;
    _proto.getStartupMode = function getStartupMode() {
      return this.startupMode;
    }

    /**
     * Set the startup mode for the app to 'Create'.
     *
     */;
    _proto.setStartupModeCreate = function setStartupModeCreate() {
      this.startupMode = StartupMode.Create;
    }

    /**
     * Set the startup mode for the app to 'AutoCreate'.
     *
     */;
    _proto.setStartupModeAutoCreate = function setStartupModeAutoCreate() {
      this.startupMode = StartupMode.AutoCreate;
    }

    /**
     * Set the startup mode for the app to 'Deeplink'.
     *
     */;
    _proto.setStartupModeDeeplink = function setStartupModeDeeplink() {
      this.startupMode = StartupMode.Deeplink;
    };
    _proto.init = function init() {
      var _oModel$isA, _this$getManifestEntr, _this$getManifestEntr2;
      const uiModel = new JSONModel({
        editMode: library.EditMode.Display,
        isEditable: false,
        draftStatus: library.DraftStatus.Clear,
        busy: false,
        busyLocal: {},
        pages: {}
      });
      const oInternalModel = new JSONModel({
        pages: {}
      });
      // set the binding OneWay for uiModel to prevent changes if controller extensions modify a bound property of a control
      uiModel.setDefaultBindingMode("OneWay");
      // for internal model binding needs to be two way
      ModelHelper.enhanceUiJSONModel(uiModel, library);
      ModelHelper.enhanceInternalJSONModel(oInternalModel);
      this.setModel(uiModel, "ui");
      this.setModel(oInternalModel, "internal");
      this.bInitializeRouting = this.bInitializeRouting !== undefined ? this.bInitializeRouting : true;
      this._oRouterProxy = new RouterProxy();
      this._oAppStateHandler = new AppStateHandler(this);
      this._oDiagnostics = new Diagnostics();
      const oModel = this.getModel();
      if (oModel !== null && oModel !== void 0 && (_oModel$isA = oModel.isA) !== null && _oModel$isA !== void 0 && _oModel$isA.call(oModel, "sap.ui.model.odata.v4.ODataModel")) {
        ModelHelper.enhanceODataModel(oModel);
        this.entityContainer = oModel.getMetaModel().requestObject("/$EntityContainer/");
      } else {
        // not an OData v4 service
        this.entityContainer = Promise.resolve();
      }
      if ((_this$getManifestEntr = this.getManifestEntry("sap.fe")) !== null && _this$getManifestEntr !== void 0 && (_this$getManifestEntr2 = _this$getManifestEntr.app) !== null && _this$getManifestEntr2 !== void 0 && _this$getManifestEntr2.disableCollaborationDraft) {
        // disable the collaboration draft globally in case private manifest flag is set
        // this allows customers to disable the collaboration draft in case we run into issues with the first delivery
        // this will be removed with the next S/4 release
        ModelHelper.disableCollaborationDraft = true;
      }
      const oManifestUI5 = this.getManifest()["sap.ui5"];
      this.checkRoutingConfiguration(oManifestUI5);

      // Adding Semantic Date Operators
      // Commenting since it is not needed for SingleRange
      SemanticDateOperators.addSemanticDateOperators();
      DraftEditState.addDraftEditStateOperator();

      // the init function configures the routing according to the settings above
      // it will call the createContent function to instantiate the RootView and add it to the UIComponent aggregations

      _UIComponent.prototype.init.call(this);
      AppComponent.instanceMap[this.getId()] = this;
    };
    _proto.checkRoutingConfiguration = function checkRoutingConfiguration(oManifestUI5) {
      var _oManifestUI5$rootVie;
      if (oManifestUI5 !== null && oManifestUI5 !== void 0 && (_oManifestUI5$rootVie = oManifestUI5.rootView) !== null && _oManifestUI5$rootVie !== void 0 && _oManifestUI5$rootVie.viewName) {
        var _oManifestUI5$routing3, _oManifestUI5$routing4, _oManifestUI5$routing5, _oManifestUI5$routing6, _oManifestUI5$rootVie2, _oManifestUI5$rootVie3;
        // The application specified an own root view in the manifest

        // Root View was moved from sap.fe.templates to sap.fe.core - keep it compatible
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.FCL.VIEWNAME;
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME_COMPATIBILITY) {
          oManifestUI5.rootView.viewName = NAVCONF.NAVCONTAINER.VIEWNAME;
        }
        if (oManifestUI5.rootView.viewName === NAVCONF.FCL.VIEWNAME && ((_oManifestUI5$routing3 = oManifestUI5.routing) === null || _oManifestUI5$routing3 === void 0 ? void 0 : (_oManifestUI5$routing4 = _oManifestUI5$routing3.config) === null || _oManifestUI5$routing4 === void 0 ? void 0 : _oManifestUI5$routing4.routerClass) === NAVCONF.FCL.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.FCL.VIEWNAME}" - Routerclass: "${NAVCONF.FCL.ROUTERCLASS}"`);
        } else if (oManifestUI5.rootView.viewName === NAVCONF.NAVCONTAINER.VIEWNAME && ((_oManifestUI5$routing5 = oManifestUI5.routing) === null || _oManifestUI5$routing5 === void 0 ? void 0 : (_oManifestUI5$routing6 = _oManifestUI5$routing5.config) === null || _oManifestUI5$routing6 === void 0 ? void 0 : _oManifestUI5$routing6.routerClass) === NAVCONF.NAVCONTAINER.ROUTERCLASS) {
          Log.info(`Rootcontainer: "${NAVCONF.NAVCONTAINER.VIEWNAME}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        } else if ((_oManifestUI5$rootVie2 = oManifestUI5.rootView) !== null && _oManifestUI5$rootVie2 !== void 0 && (_oManifestUI5$rootVie3 = _oManifestUI5$rootVie2.viewName) !== null && _oManifestUI5$rootVie3 !== void 0 && _oManifestUI5$rootVie3.includes("sap.fe.core.rootView")) {
          var _oManifestUI5$routing7, _oManifestUI5$routing8;
          throw Error(`\nWrong configuration for the couple (rootView/routerClass) in manifest file.\n` + `Current values are :(${oManifestUI5.rootView.viewName}/${((_oManifestUI5$routing7 = oManifestUI5.routing) === null || _oManifestUI5$routing7 === void 0 ? void 0 : (_oManifestUI5$routing8 = _oManifestUI5$routing7.config) === null || _oManifestUI5$routing8 === void 0 ? void 0 : _oManifestUI5$routing8.routerClass) || "<missing router class>"})\n` + `Expected values are \n` + `\t - (${NAVCONF.NAVCONTAINER.VIEWNAME}/${NAVCONF.NAVCONTAINER.ROUTERCLASS})\n` + `\t - (${NAVCONF.FCL.VIEWNAME}/${NAVCONF.FCL.ROUTERCLASS})`);
        } else {
          Log.info(`Rootcontainer: "${oManifestUI5.rootView.viewName}" - Routerclass: "${NAVCONF.NAVCONTAINER.ROUTERCLASS}"`);
        }
      }
    };
    _proto.onServicesStarted = async function onServicesStarted() {
      await this.initializeFeatureToggles();

      //router must be started once the rootcontainer is initialized
      //starting of the router
      const finalizedRoutingInitialization = () => {
        this.entityContainer.then(() => {
          if (this.getRootViewController().attachRouteMatchers) {
            this.getRootViewController().attachRouteMatchers();
          }
          this.getRouter().initialize();
          this.getRouterProxy().init(this, this._isFclEnabled());
        }).catch(error => {
          const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
          this.getRootViewController().displayErrorPage(oResourceBundle.getText("C_APP_COMPONENT_SAPFE_APPSTART_TECHNICAL_ISSUES"), {
            title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
            description: error.message,
            FCLLevel: 0
          });
        });
      };
      if (this.bInitializeRouting) {
        return this.getRoutingService().initializeRouting().then(() => {
          if (this.getRootViewController()) {
            finalizedRoutingInitialization();
          } else {
            this.getRootControl().attachAfterInit(function () {
              finalizedRoutingInitialization();
            });
          }
        }).catch(function (err) {
          Log.error(`cannot cannot initialize routing: ${err.toString()}`);
        });
      }
    };
    _proto.exit = function exit() {
      this._oAppStateHandler.destroy();
      this._oRouterProxy.destroy();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oAppStateHandler;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this._oRouterProxy;
      deleteModelCacheData(this.getMetaModel());
      this.getModel("ui").destroy();
      cleanPageConfigurationChanges();
    };
    _proto.getMetaModel = function getMetaModel() {
      return this.getModel().getMetaModel();
    };
    _proto.getDiagnostics = function getDiagnostics() {
      return this._oDiagnostics;
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      var _this$getRoutingServi, _this$getRoutingServi2;
      // LEAKS, with workaround for some Flex / MDC issue
      try {
        delete AppComponent.instanceMap[this.getId()];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete window._routing;
      } catch (e) {
        Log.info(e);
      }

      //WORKAROUND for sticky discard request : due to async callback, request triggered by the exitApplication will be send after the UIComponent.prototype.destroy
      //so we need to copy the Requestor headers as it will be destroy

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const oMainModel = this.oModels[undefined];
      let oHeaders;
      if (oMainModel !== null && oMainModel !== void 0 && oMainModel.oRequestor) {
        oHeaders = Object.assign({}, oMainModel.oRequestor.mHeaders);
      }

      // As we need to cleanup the application / handle the dirty object we need to call our cleanup before the models are destroyed
      (_this$getRoutingServi = this.getRoutingService()) === null || _this$getRoutingServi === void 0 ? void 0 : (_this$getRoutingServi2 = _this$getRoutingServi.beforeExit) === null || _this$getRoutingServi2 === void 0 ? void 0 : _this$getRoutingServi2.call(_this$getRoutingServi);
      _UIComponent.prototype.destroy.call(this, bSuppressInvalidate);
      if (oHeaders && oMainModel.oRequestor) {
        oMainModel.oRequestor.mHeaders = oHeaders;
      }
    };
    _proto.getRoutingService = function getRoutingService() {
      return {}; // overriden at runtime
    };
    _proto.getShellServices = function getShellServices() {
      return {}; // overriden at runtime
    };
    _proto.getNavigationService = function getNavigationService() {
      return {}; // overriden at runtime
    };
    _proto.getSideEffectsService = function getSideEffectsService() {
      return {};
    };
    _proto.getEnvironmentCapabilities = function getEnvironmentCapabilities() {
      return {};
    };
    _proto.getCollaborationManagerService = function getCollaborationManagerService() {
      return {};
    };
    _proto.getCollaborativeToolsService = function getCollaborativeToolsService() {
      return {};
    };
    _proto.getStartupParameters = async function getStartupParameters() {
      const oComponentData = this.getComponentData();
      return Promise.resolve(oComponentData && oComponentData.startupParameters || {});
    };
    _proto.restore = function restore() {
      // called by FLP when app sap-keep-alive is enabled and app is restored
      this.getRootViewController().viewState.onRestore();
    };
    _proto.suspend = function suspend() {
      // called by FLP when app sap-keep-alive is enabled and app is suspended
      this.getRootViewController().viewState.onSuspend();
    }

    /**
     * navigateBasedOnStartupParameter function is a public api that acts as a wrapper to _manageDeepLinkStartup function. It passes the startup parameters further to _manageDeepLinkStartup function
     *
     * @param startupParameters Defines the startup parameters which is further passed to _manageDeepLinkStartup function.
     */;
    _proto.navigateBasedOnStartupParameter = async function navigateBasedOnStartupParameter(startupParameters) {
      try {
        if (!BusyLocker.isLocked(this.getModel("ui"))) {
          if (!startupParameters) {
            startupParameters = null;
          }
          const routingService = this.getRoutingService();
          await routingService._manageDeepLinkStartup(startupParameters);
        }
      } catch (exception) {
        Log.error(exception);
        BusyLocker.unlock(this.getModel("ui"));
      }
    }

    /**
     * Used to allow disabling the Collaboration Manager integration for the OVP use case.
     *
     * @returns Whether the collaboration manager service is active.
     */;
    _proto.isCollaborationManagerServiceEnabled = function isCollaborationManagerServiceEnabled() {
      return true;
    };
    return AppComponent;
  }(UIComponent), _class2.instanceMap = {}, _class2)) || _class);
  return AppComponent;
}, false);
