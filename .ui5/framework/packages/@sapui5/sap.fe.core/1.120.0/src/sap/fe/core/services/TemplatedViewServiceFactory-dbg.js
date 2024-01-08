/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/TemplateModel", "sap/fe/core/helpers/LoaderUtils", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/manifestMerger/ChangePageConfiguration", "sap/ui/Device", "sap/ui/VersionInfo", "sap/ui/core/Component", "sap/ui/core/mvc/View", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/core/service/ServiceFactoryRegistry", "sap/ui/model/json/JSONModel", "../helpers/DynamicAnnotationPathHelper"], function (Log, TemplateModel, LoaderUtils, ModelHelper, ChangePageConfiguration, Device, VersionInfo, Component, View, Service, ServiceFactory, ServiceFactoryRegistry, JSONModel, DynamicAnnotationPathHelper) {
  "use strict";

  var resolveDynamicExpression = DynamicAnnotationPathHelper.resolveDynamicExpression;
  var applyPageConfigurationChanges = ChangePageConfiguration.applyPageConfigurationChanges;
  var requireDependencies = LoaderUtils.requireDependencies;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let TemplatedViewService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(TemplatedViewService, _Service);
    function TemplatedViewService() {
      return _Service.apply(this, arguments) || this;
    }
    var _proto = TemplatedViewService.prototype;
    _proto.init = function init() {
      const aServiceDependencies = [];
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      const oAppComponent = Component.getOwnerComponentFor(oComponent);
      const oMetaModel = oAppComponent.getMetaModel();
      this.pageId = oAppComponent.getLocalId(oComponent.getId());
      const sStableId = `${oAppComponent.getMetadata().getComponentName()}::${this.pageId}`;
      const aEnhanceI18n = oComponent.getEnhanceI18n() || [];
      let sAppNamespace;
      this.oFactory = oContext.factory;
      if (aEnhanceI18n) {
        sAppNamespace = oAppComponent.getMetadata().getComponentName();
        for (let i = 0; i < aEnhanceI18n.length; i++) {
          // In order to support text-verticalization applications can also passs a resource model defined in the manifest
          // UI5 takes care of text-verticalization for resource models defined in the manifest
          // Hence check if the given key is a resource model defined in the manifest
          // if so this model should be used to enhance the sap.fe resource model so pass it as it is
          const oResourceModel = oAppComponent.getModel(aEnhanceI18n[i]);
          if (oResourceModel && oResourceModel.isA("sap.ui.model.resource.ResourceModel")) {
            aEnhanceI18n[i] = oResourceModel;
          } else {
            aEnhanceI18n[i] = `${sAppNamespace}.${aEnhanceI18n[i].replace(".properties", "")}`;
          }
        }
      }
      const sCacheIdentifier = `${oAppComponent.getMetadata().getName()}_${sStableId}_${sap.ui.getCore().getConfiguration().getLanguageTag()}`;
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.ResourceModelService").createInstance({
        scopeType: "component",
        scopeObject: oComponent,
        settings: {
          bundles: ["sap.fe.core.messagebundle", "sap.fe.macros.messagebundle", "sap.fe.templates.messagebundle"],
          enhanceI18n: aEnhanceI18n,
          modelName: "sap.fe.i18n"
        }
      }).then(oResourceModelService => {
        this.oResourceModelService = oResourceModelService;
        return oResourceModelService.getResourceModel();
      }));
      aServiceDependencies.push(ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").createInstance({
        settings: {
          metaModel: oMetaModel,
          appComponent: oAppComponent,
          component: oComponent
        }
      }).then(oCacheHandlerService => {
        this.oCacheHandlerService = oCacheHandlerService;
        return oCacheHandlerService.validateCacheKey(sCacheIdentifier, oComponent);
      }));
      aServiceDependencies.push(VersionInfo.load().then(function (oInfo) {
        let sTimestamp = "";
        if (!oInfo.libraries) {
          sTimestamp = sap.ui.buildinfo.buildtime;
        } else {
          oInfo.libraries.forEach(function (oLibrary) {
            sTimestamp += oLibrary.buildTimestamp;
          });
        }
        return sTimestamp;
      }).catch(function () {
        return "<NOVALUE>";
      }));
      this.initPromise = Promise.all(aServiceDependencies).then(async aDependenciesResult => {
        const oResourceModel = aDependenciesResult[0];
        const sCacheKey = aDependenciesResult[1];
        const oSideEffectsServices = oAppComponent.getSideEffectsService();
        const environmentCapabilitiesService = await oAppComponent.getService("environmentCapabilities");
        oSideEffectsServices.initializeSideEffects(environmentCapabilitiesService.getCapabilities());
        const [TemplateConverter, MetaModelConverter] = await requireDependencies(["sap/fe/core/converters/TemplateConverter", "sap/fe/core/converters/MetaModelConverter"]);
        return this.createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter);
      }).then(function (sCacheKey) {
        const oCacheHandlerService = ServiceFactoryRegistry.get("sap.fe.core.services.CacheHandlerService").getInstance(oMetaModel);
        oCacheHandlerService.invalidateIfNeeded(sCacheKey, sCacheIdentifier, oComponent);
      });
    }

    /**
     * Refresh the current view using the same configuration as before.
     *
     * @param oComponent
     * @returns A promise indicating when the view is refreshed
     */;
    _proto.refreshView = function refreshView(oComponent) {
      const oRootView = oComponent.getRootControl();
      if (oRootView) {
        oRootView.destroy();
      } else if (this.oView) {
        this.oView.destroy();
      }
      return this.createView(this.resourceModel, this.stableId, "", this.TemplateConverter, this.MetaModelConverter).then(function () {
        oComponent.oContainer.invalidate();
      }).catch(function (oError) {
        oComponent.oContainer.invalidate();
        Log.error(oError);
      });
    };
    _proto.createView = async function createView(oResourceModel, sStableId, sCacheKey, TemplateConverter, MetaModelConverter) {
      this.resourceModel = oResourceModel; // TODO: get rid, kept it for the time being
      this.stableId = sStableId;
      this.TemplateConverter = TemplateConverter;
      this.MetaModelConverter = MetaModelConverter;
      const oContext = this.getContext();
      const mServiceSettings = oContext.settings;
      const sConverterType = mServiceSettings.converterType;
      const oComponent = oContext.scopeObject;
      const oAppComponent = Component.getOwnerComponentFor(oComponent);
      const sFullContextPath = oAppComponent.getRoutingService().getTargetInformationFor(oComponent).options.settings.fullContextPath;
      const oMetaModel = oAppComponent.getMetaModel();
      const oManifestContent = oAppComponent.getManifest();
      const oDeviceModel = new JSONModel(Device).setDefaultBindingMode("OneWay");
      const oManifestModel = new JSONModel(oManifestContent);
      const bError = false;
      let oPageModel, oViewDataModel, oViewSettings, mViewData;
      // Load the index for the additional building blocks which is responsible for initializing them
      function getViewSettings() {
        const aSplitPath = sFullContextPath.split("/");
        const sEntitySetPath = aSplitPath.reduce(function (sPathSoFar, sNextPathPart) {
          if (sNextPathPart === "") {
            return sPathSoFar;
          }
          if (sPathSoFar === "") {
            sPathSoFar = `/${sNextPathPart}`;
          } else {
            const oTarget = oMetaModel.getObject(`${sPathSoFar}/$NavigationPropertyBinding/${sNextPathPart}`);
            if (oTarget && Object.keys(oTarget).length > 0) {
              sPathSoFar += "/$NavigationPropertyBinding";
            }
            sPathSoFar += `/${sNextPathPart}`;
          }
          return sPathSoFar;
        }, "");
        let viewType = mServiceSettings.viewType || oComponent.getViewType() || "XML";
        if (viewType !== "XML") {
          viewType = undefined;
        }
        return {
          type: viewType,
          preprocessors: {
            xml: {
              bindingContexts: {
                entitySet: sEntitySetPath ? oMetaModel.createBindingContext(sEntitySetPath) : null,
                fullContextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
                contextPath: sFullContextPath ? oMetaModel.createBindingContext(sFullContextPath) : null,
                converterContext: oPageModel.createBindingContext("/", undefined, {
                  noResolve: true
                }),
                viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
              },
              models: {
                entitySet: oMetaModel,
                fullContextPath: oMetaModel,
                contextPath: oMetaModel,
                "sap.fe.i18n": oResourceModel,
                metaModel: oMetaModel,
                device: oDeviceModel,
                manifest: oManifestModel,
                converterContext: oPageModel,
                viewData: oViewDataModel
              },
              appComponent: oAppComponent
            },
            controls: {}
          },
          id: sStableId,
          viewName: mServiceSettings.viewName || oComponent.getViewName(),
          viewData: mViewData,
          cache: {
            keys: [sCacheKey],
            additionalData: {
              // We store the page model data in the `additionalData` of the view cache, this way it is always in sync
              getAdditionalCacheData: () => {
                return oPageModel.getData();
              },
              setAdditionalCacheData: value => {
                oPageModel.setData(value);
              }
            }
          },
          models: {
            "sap.fe.i18n": oResourceModel
          },
          height: "100%"
        };
      }
      const createErrorPage = reason => {
        // just replace the view name and add an additional model containing the reason, but
        // keep the other settings
        Log.error(reason.message, reason);
        oViewSettings.viewName = mServiceSettings.errorViewName || "sap.fe.core.services.view.TemplatingErrorPage";
        oViewSettings.preprocessors.xml.models["error"] = new JSONModel(reason);
        return oComponent.runAsOwner(() => {
          return View.create(oViewSettings).then(oView => {
            this.oView = oView;
            this.oView.setModel(new JSONModel(this.oView), "$view");
            oComponent.setAggregation("rootControl", this.oView);
            return sCacheKey;
          });
        });
      };
      try {
        var _oManifestContent$sap;
        const oRoutingService = await oAppComponent.getService("routingService");
        // Retrieve the viewLevel for the component
        const oTargetInfo = oRoutingService.getTargetInformationFor(oComponent);
        const mOutbounds = oManifestContent["sap.app"] && oManifestContent["sap.app"].crossNavigation && oManifestContent["sap.app"].crossNavigation.outbounds || {};
        const mNavigation = oComponent.getNavigation() || {};
        Object.keys(mNavigation).forEach(function (navigationObjectKey) {
          const navigationObject = mNavigation[navigationObjectKey];
          let outboundConfig;
          if (navigationObject.detail && navigationObject.detail.outbound && mOutbounds[navigationObject.detail.outbound]) {
            outboundConfig = mOutbounds[navigationObject.detail.outbound];
            navigationObject.detail.outboundDetail = {
              semanticObject: outboundConfig.semanticObject,
              action: outboundConfig.action,
              parameters: outboundConfig.parameters
            };
          }
          if (navigationObject.create && navigationObject.create.outbound && mOutbounds[navigationObject.create.outbound]) {
            outboundConfig = mOutbounds[navigationObject.create.outbound];
            navigationObject.create.outboundDetail = {
              semanticObject: outboundConfig.semanticObject,
              action: outboundConfig.action,
              parameters: outboundConfig.parameters
            };
          }
        });
        mViewData = {
          appComponent: oAppComponent,
          navigation: mNavigation,
          viewLevel: oTargetInfo.viewLevel,
          stableId: sStableId,
          contentDensities: (_oManifestContent$sap = oManifestContent["sap.ui5"]) === null || _oManifestContent$sap === void 0 ? void 0 : _oManifestContent$sap.contentDensities,
          resourceModel: oResourceModel,
          fullContextPath: sFullContextPath,
          isDesktop: Device.system.desktop,
          isPhone: Device.system.phone
        };
        if (oComponent.getViewData) {
          var _oManifestContent$sap2, _oManifestContent$sap3, _oManifestContent$sap4, _oManifestContent$sap5, _oManifestContent$sap6;
          Object.assign(mViewData, oComponent.getViewData());
          const actualSettings = (oManifestContent === null || oManifestContent === void 0 ? void 0 : (_oManifestContent$sap2 = oManifestContent["sap.ui5"]) === null || _oManifestContent$sap2 === void 0 ? void 0 : (_oManifestContent$sap3 = _oManifestContent$sap2.routing) === null || _oManifestContent$sap3 === void 0 ? void 0 : (_oManifestContent$sap4 = _oManifestContent$sap3.targets) === null || _oManifestContent$sap4 === void 0 ? void 0 : (_oManifestContent$sap5 = _oManifestContent$sap4[this.pageId]) === null || _oManifestContent$sap5 === void 0 ? void 0 : (_oManifestContent$sap6 = _oManifestContent$sap5.options) === null || _oManifestContent$sap6 === void 0 ? void 0 : _oManifestContent$sap6.settings) || {};
          mViewData = applyPageConfigurationChanges(actualSettings, mViewData, oAppComponent, this.pageId);
        }
        mViewData.isShareButtonVisibleForMyInbox = TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox(oAppComponent);
        const oShellServices = oAppComponent.getShellServices();
        mViewData.converterType = sConverterType;
        mViewData.shellContentDensity = oShellServices.getContentDensity();
        mViewData.retrieveTextFromValueList = oManifestContent["sap.fe"] && oManifestContent["sap.fe"].form ? oManifestContent["sap.fe"].form.retrieveTextFromValueList : undefined;
        oViewDataModel = new JSONModel(mViewData);
        if (mViewData.controlConfiguration) {
          for (const sAnnotationPath in mViewData.controlConfiguration) {
            if (sAnnotationPath.includes("[")) {
              const sTargetAnnotationPath = resolveDynamicExpression(sAnnotationPath, oMetaModel);
              mViewData.controlConfiguration[sTargetAnnotationPath] = mViewData.controlConfiguration[sAnnotationPath];
            }
          }
        }
        MetaModelConverter.convertTypes(oMetaModel, oAppComponent.getEnvironmentCapabilities().getCapabilities());
        oPageModel = new TemplateModel(() => {
          try {
            const oDiagnostics = oAppComponent.getDiagnostics();
            const iIssueCount = oDiagnostics.getIssues().length;
            const oConverterPageModel = TemplateConverter.convertPage(sConverterType, oMetaModel, mViewData, oDiagnostics, sFullContextPath, oAppComponent.getEnvironmentCapabilities().getCapabilities(), oComponent);
            const aIssues = oDiagnostics.getIssues();
            const aAddedIssues = aIssues.slice(iIssueCount);
            if (aAddedIssues.length > 0) {
              Log.warning("Some issues have been detected in your project, please check the UI5 support assistant rule for sap.fe.core");
            }
            return oConverterPageModel;
          } catch (error) {
            Log.error(error, error);
            return {};
          }
        }, oMetaModel);
        if (!bError) {
          oViewSettings = getViewSettings();
          // Setting the pageModel on the component for potential reuse
          oComponent.setModel(oPageModel, "_pageModel");
          return oComponent.runAsOwner(() => {
            return View.create(oViewSettings).catch(createErrorPage).then(oView => {
              this.oView = oView;
              const viewJSONModel = new JSONModel(this.oView);
              ModelHelper.enhanceViewJSONModel(viewJSONModel);
              this.oView.setModel(viewJSONModel, "$view");
              this.oView.setModel(oViewDataModel, "viewData");
              oComponent.setAggregation("rootControl", this.oView);
              return sCacheKey;
            }).catch(e => Log.error(e.message, e));
          });
        }
      } catch (error) {
        Log.error(error.message, error);
        throw new Error(`Error while creating view : ${error}`);
      }
    };
    _proto.getView = function getView() {
      return this.oView;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.exit = function exit() {
      // Deregister global instance
      if (this.oResourceModelService) {
        this.oResourceModelService.destroy();
      }
      if (this.oCacheHandlerService) {
        this.oCacheHandlerService.destroy();
      }
      this.oFactory.removeGlobalInstance();
    };
    return TemplatedViewService;
  }(Service);
  let TemplatedViewServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(TemplatedViewServiceFactory, _ServiceFactory);
    function TemplatedViewServiceFactory() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ServiceFactory.call(this, ...args) || this;
      _this._oInstanceRegistry = {};
      return _this;
    }
    var _proto2 = TemplatedViewServiceFactory.prototype;
    _proto2.createInstance = function createInstance(oServiceContext) {
      TemplatedViewServiceFactory.iCreatingViews++;
      const oTemplatedViewService = new TemplatedViewService(Object.assign({
        factory: this
      }, oServiceContext));
      return oTemplatedViewService.initPromise.then(function () {
        TemplatedViewServiceFactory.iCreatingViews--;
        return oTemplatedViewService;
      });
    };
    _proto2.removeGlobalInstance = function removeGlobalInstance() {
      this._oInstanceRegistry = {};
    }

    /**
     * This function checks if the component data specifies the visibility of the 'Share' button and returns true or false based on the visibility.
     *
     * @param appComponent Specifies the app component
     * @returns Boolean value as true or false based whether the 'Share' button should be visible or not
     */;
    TemplatedViewServiceFactory.getShareButtonVisibilityForMyInbox = function getShareButtonVisibilityForMyInbox(appComponent) {
      const componentData = appComponent.getComponentData();
      if (componentData !== undefined && componentData.feEnvironment) {
        return componentData.feEnvironment.getShareControlVisibility();
      }
      return undefined;
    };
    TemplatedViewServiceFactory.getNumberOfViewsInCreationState = function getNumberOfViewsInCreationState() {
      return TemplatedViewServiceFactory.iCreatingViews;
    };
    return TemplatedViewServiceFactory;
  }(ServiceFactory);
  return TemplatedViewServiceFactory;
}, false);
