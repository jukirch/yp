/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Log, Service, ServiceFactory) {
  "use strict";

  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Mock implementation of the ShellService for OpenFE
   *
   */
  let ShellServiceMock = /*#__PURE__*/function (_Service) {
    _inheritsLoose(ShellServiceMock, _Service);
    function ShellServiceMock() {
      return _Service.apply(this, arguments) || this;
    }
    var _proto = ShellServiceMock.prototype;
    _proto.init = function init() {
      this.initPromise = Promise.resolve(this);
      this.instanceType = "mock";
    };
    _proto.getLinks = function getLinks( /*oArgs: object*/
    ) {
      return Promise.resolve([]);
    };
    _proto.getLinksWithCache = function getLinksWithCache( /*oArgs: object*/
    ) {
      return Promise.resolve([]);
    };
    _proto.toExternal = function toExternal( /*oNavArgumentsArr: Array<object>, oComponent: object*/
    ) {
      /* Do Nothing */
    };
    _proto.getStartupAppState = function getStartupAppState( /*oArgs: object*/
    ) {
      return Promise.resolve(undefined);
    };
    _proto.backToPreviousApp = function backToPreviousApp() {
      /* Do Nothing */
    };
    _proto.hrefForExternal = function hrefForExternal( /*oArgs?: object, oComponent?: object, bAsync?: boolean*/
    ) {
      return "";
    };
    _proto.getHash = function getHash() {
      return window.location.href;
    };
    _proto.hrefForExternalAsync = function hrefForExternalAsync( /*oArgs?: object, oComponent?: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.getAppState = function getAppState( /*oComponent: object, sAppStateKey: string*/
    ) {
      return Promise.resolve({});
    };
    _proto.createEmptyAppState = function createEmptyAppState( /*oComponent: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.createEmptyAppStateAsync = function createEmptyAppStateAsync( /*oComponent: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.isNavigationSupported = function isNavigationSupported( /*oNavArgumentsArr: Array<object>, oComponent: object*/
    ) {
      return Promise.resolve({});
    };
    _proto.isInitialNavigation = function isInitialNavigation() {
      return false;
    };
    _proto.isInitialNavigationAsync = function isInitialNavigationAsync() {
      return Promise.resolve({});
    };
    _proto.expandCompactHash = function expandCompactHash( /*sHashFragment: string*/
    ) {
      return Promise.resolve({});
    };
    _proto.parseShellHash = function parseShellHash( /*sHash: string*/
    ) {
      return {};
    };
    _proto.splitHash = function splitHash( /*sHash: string*/
    ) {
      return Promise.resolve({});
    };
    _proto.constructShellHash = function constructShellHash( /*oNewShellHash: object*/
    ) {
      return "";
    };
    _proto.setDirtyFlag = function setDirtyFlag( /*bDirty: boolean*/
    ) {
      /* Do Nothing */
    };
    _proto.registerDirtyStateProvider = function registerDirtyStateProvider( /*fnDirtyStateProvider: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.deregisterDirtyStateProvider = function deregisterDirtyStateProvider( /*fnDirtyStateProvider: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.createRenderer = function createRenderer() {
      return {};
    };
    _proto.getUser = function getUser() {
      return {};
    };
    _proto.hasUShell = function hasUShell() {
      return false;
    };
    _proto.registerNavigationFilter = function registerNavigationFilter( /*fnNavFilter: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.unregisterNavigationFilter = function unregisterNavigationFilter( /*fnNavFilter: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.setBackNavigation = function setBackNavigation( /*fnCallBack?: Function*/
    ) {
      /* Do Nothing */
    };
    _proto.setHierarchy = function setHierarchy( /*aHierarchyLevels: Array<object>*/
    ) {
      /* Do Nothing */
    };
    _proto.setTitle = function setTitle( /*sTitle: string*/
    ) {
      /* Do Nothing */
    };
    _proto.getContentDensity = function getContentDensity() {
      // in case there is no shell we probably need to look at the classes being defined on the body
      if (document.body.classList.contains("sapUiSizeCozy")) {
        return "cozy";
      } else if (document.body.classList.contains("sapUiSizeCompact")) {
        return "compact";
      } else {
        return "";
      }
    };
    _proto.getPrimaryIntent = function getPrimaryIntent( /*sSemanticObject: string, mParameters?: object*/
    ) {
      return Promise.resolve();
    };
    _proto.waitForPluginsLoad = function waitForPluginsLoad() {
      return Promise.resolve(true);
    };
    _proto.getTitle = function getTitle() {
      return "";
    };
    return ShellServiceMock;
  }(Service);
  /**
   * @typedef ShellServicesSettings
   */
  /**
   * Wrap a JQuery Promise within a native {Promise}.
   *
   * @template {object} T
   * @param jqueryPromise The original jquery promise
   * @returns A native promise wrapping the same object
   */
  function wrapJQueryPromise(jqueryPromise) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line promise/catch-or-return
      jqueryPromise.done(resolve).fail(reject);
    });
  }
  /**
   * Base implementation of the ShellServices
   *
   */
  let ShellServices = /*#__PURE__*/function (_Service2) {
    _inheritsLoose(ShellServices, _Service2);
    function ShellServices() {
      return _Service2.apply(this, arguments) || this;
    }
    var _proto2 = ShellServices.prototype;
    // !: means that we know it will be assigned before usage
    _proto2.init = function init() {
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      this.oShellContainer = oContext.settings.shellContainer;
      this.instanceType = "real";
      this.linksCache = {};
      this.fnFindSemanticObjectsInCache = function (oArgs) {
        const _oArgs = oArgs;
        const aCachedSemanticObjects = [];
        const aNonCachedSemanticObjects = [];
        for (let i = 0; i < _oArgs.length; i++) {
          if (!!_oArgs[i][0] && !!_oArgs[i][0].semanticObject) {
            if (this.linksCache[_oArgs[i][0].semanticObject]) {
              aCachedSemanticObjects.push(this.linksCache[_oArgs[i][0].semanticObject].links);
              Object.defineProperty(oArgs[i][0], "links", {
                value: this.linksCache[_oArgs[i][0].semanticObject].links
              });
            } else {
              aNonCachedSemanticObjects.push(_oArgs[i]);
            }
          }
        }
        return {
          oldArgs: oArgs,
          newArgs: aNonCachedSemanticObjects,
          cachedLinks: aCachedSemanticObjects
        };
      };
      this.initPromise = new Promise((resolve, reject) => {
        this.resolveFn = resolve;
        this.rejectFn = reject;
      });
      const oCrossAppNavServicePromise = this.oShellContainer.getServiceAsync("CrossApplicationNavigation");
      const oUrlParsingServicePromise = this.oShellContainer.getServiceAsync("URLParsing");
      const oShellNavigationServicePromise = this.oShellContainer.getServiceAsync("ShellNavigation");
      const oShellPluginManagerPromise = this.oShellContainer.getServiceAsync("PluginManager");
      const oShellUIServicePromise = oComponent.getService("ShellUIService");
      Promise.all([oCrossAppNavServicePromise, oUrlParsingServicePromise, oShellNavigationServicePromise, oShellUIServicePromise, oShellPluginManagerPromise]).then(_ref => {
        let [oCrossAppNavService, oUrlParsingService, oShellNavigation, oShellUIService, oShellPluginManager] = _ref;
        this.crossAppNavService = oCrossAppNavService;
        this.urlParsingService = oUrlParsingService;
        this.shellNavigation = oShellNavigation;
        this.shellUIService = oShellUIService;
        this.shellPluginManager = oShellPluginManager;
        this.resolveFn();
      }).catch(this.rejectFn);
    }

    /**
     * Retrieves the target links configured for a given semantic object & action
     * Will retrieve the CrossApplicationNavigation
     * service reference call the getLinks method. In case service is not available or any exception
     * method throws exception error in console.
     *
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
     * @returns Promise which will be resolved to target links array
     */;
    _proto2.getLinks = async function getLinks(oArgs) {
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line promise/catch-or-return
        this.crossAppNavService.getLinks(oArgs).fail(oError => {
          reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getLinks`));
        }).then(resolve);
      });
    }

    /**
     * Retrieves the target links configured for a given semantic object & action in cache
     * Will retrieve the CrossApplicationNavigation
     * service reference call the getLinks method. In case service is not available or any exception
     * method throws exception error in console.
     *
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
     * @returns Promise which will be resolved to target links array
     */;
    _proto2.getLinksWithCache = function getLinksWithCache(oArgs) {
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line promise/catch-or-return
        if (oArgs.length === 0) {
          resolve([]);
        } else {
          const oCacheResults = this.fnFindSemanticObjectsInCache(oArgs);
          if (oCacheResults.newArgs.length === 0) {
            resolve(oCacheResults.cachedLinks);
          } else {
            // eslint-disable-next-line promise/catch-or-return
            this.crossAppNavService.getLinks(oCacheResults.newArgs).fail(oError => {
              reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getLinksWithCache`));
            }).then(aLinks => {
              if (aLinks.length !== 0) {
                const oSemanticObjectsLinks = {};
                for (let i = 0; i < aLinks.length; i++) {
                  if (aLinks[i].length > 0 && oCacheResults.newArgs[i][0].links === undefined) {
                    oSemanticObjectsLinks[oCacheResults.newArgs[i][0].semanticObject] = {
                      links: aLinks[i]
                    };
                    this.linksCache = Object.assign(this.linksCache, oSemanticObjectsLinks);
                  }
                }
              }
              if (oCacheResults.cachedLinks.length === 0) {
                resolve(aLinks);
              } else {
                const aMergedLinks = [];
                let j = 0;
                for (let k = 0; k < oCacheResults.oldArgs.length; k++) {
                  if (j < aLinks.length) {
                    if (aLinks[j].length > 0 && oCacheResults.oldArgs[k][0].semanticObject === oCacheResults.newArgs[j][0].semanticObject) {
                      aMergedLinks.push(aLinks[j]);
                      j++;
                    } else {
                      aMergedLinks.push(oCacheResults.oldArgs[k][0].links);
                    }
                  } else {
                    aMergedLinks.push(oCacheResults.oldArgs[k][0].links);
                  }
                }
                resolve(aMergedLinks);
              }
            });
          }
        }
      });
    }

    /**
     * Will retrieve the ShellContainer.
     *
     * @returns Object with predefined shellContainer methods
     */;
    _proto2.getShellContainer = function getShellContainer() {
      return this.oShellContainer;
    }

    /**
     * Will call toExternal method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
     *
     * @param oNavArgumentsArr And
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>toExternal arguments
     */;
    _proto2.toExternal = function toExternal(oNavArgumentsArr, oComponent) {
      this.crossAppNavService.toExternal(oNavArgumentsArr, oComponent);
    }

    /**
     * Retrieves the target startupAppState
     * Will check the existance of the ShellContainer and retrieve the CrossApplicationNavigation
     * service reference call the getStartupAppState method. In case service is not available or any exception
     * method throws exception error in console.
     *
     * @param oArgs Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getStartupAppState arguments
     * @returns Promise which will be resolved to Object
     */;
    _proto2.getStartupAppState = function getStartupAppState(oArgs) {
      return new Promise((resolve, reject) => {
        // JQuery Promise behaves differently
        // eslint-disable-next-line promise/catch-or-return
        this.crossAppNavService.getStartupAppState(oArgs).fail(oError => {
          reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getStartupAppState`));
        }).then(startupAppState => resolve(startupAppState));
      });
    }

    /**
     * Will call backToPreviousApp method of CrossApplicationNavigation service.
     *
     * @returns Something that indicate we've navigated
     */;
    _proto2.backToPreviousApp = function backToPreviousApp() {
      return this.crossAppNavService.backToPreviousApp();
    }

    /**
     * Will call hrefForExternal method of CrossApplicationNavigation service.
     *
     * @param oArgs Check the definition of
     * @param oComponent The appComponent
     * @param bAsync Whether this call should be async or not
     * sap.ushell.services.CrossApplicationNavigation=>hrefForExternal arguments
     * @returns Promise which will be resolved to string
     */;
    _proto2.hrefForExternal = function hrefForExternal(oArgs, oComponent, bAsync) {
      return this.crossAppNavService.hrefForExternal(oArgs, oComponent, !!bAsync);
    }

    /**
     * Will call hrefForExternal method of CrossApplicationNavigation service.
     *
     * @param oArgs Check the definition of
     * @param oComponent The appComponent
     * sap.ushell.services.CrossApplicationNavigation=>hrefForExternalAsync arguments
     * @returns Promise which will be resolved to string
     */;
    _proto2.hrefForExternalAsync = function hrefForExternalAsync(oArgs, oComponent) {
      return this.crossAppNavService.hrefForExternalAsync(oArgs, oComponent);
    }

    /**
     * Will call getAppState method of CrossApplicationNavigation service with oComponent and oAppStateKey.
     *
     * @param oComponent
     * @param sAppStateKey Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>getAppState arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.getAppState = function getAppState(oComponent, sAppStateKey) {
      return wrapJQueryPromise(this.crossAppNavService.getAppState(oComponent, sAppStateKey));
    }

    /**
     * Will call createEmptyAppState method of CrossApplicationNavigation service with oComponent.
     *
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppState arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.createEmptyAppState = function createEmptyAppState(oComponent) {
      return this.crossAppNavService.createEmptyAppState(oComponent);
    }

    /**
     * Will call createEmptyAppStateAsync method of CrossApplicationNavigation service with oComponent.
     *
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppStateAsync arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.createEmptyAppStateAsync = function createEmptyAppStateAsync(oComponent) {
      return this.crossAppNavService.createEmptyAppStateAsync(oComponent);
    }

    /**
     * Will call isNavigationSupported method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
     *
     * @param oNavArgumentsArr
     * @param oComponent Check the definition of
     * sap.ushell.services.CrossApplicationNavigation=>isNavigationSupported arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.isNavigationSupported = function isNavigationSupported(oNavArgumentsArr, oComponent) {
      return wrapJQueryPromise(this.crossAppNavService.isNavigationSupported(oNavArgumentsArr, oComponent));
    }

    /**
     * Will call isInitialNavigation method of CrossApplicationNavigation service.
     *
     * @returns Promise which will be resolved to boolean
     */;
    _proto2.isInitialNavigation = function isInitialNavigation() {
      return this.crossAppNavService.isInitialNavigation();
    }

    /**
     * Will call isInitialNavigationAsync method of CrossApplicationNavigation service.
     *
     * @returns Promise which will be resolved to boolean
     */;
    _proto2.isInitialNavigationAsync = function isInitialNavigationAsync() {
      return this.crossAppNavService.isInitialNavigationAsync();
    }

    /**
     * Will call expandCompactHash method of CrossApplicationNavigation service.
     *
     * @param sHashFragment An (internal format) shell hash
     * @returns A promise the success handler of the resolve promise get an expanded shell hash as first argument
     */;
    _proto2.expandCompactHash = function expandCompactHash(sHashFragment) {
      return this.crossAppNavService.expandCompactHash(sHashFragment);
    };
    _proto2.getHash = function getHash() {
      return `#${this.urlParsingService.getShellHash(window.location.href)}`;
    }

    /**
     * Will call parseShellHash method of URLParsing service with given sHash.
     *
     * @param sHash Check the definition of
     * sap.ushell.services.URLParsing=>parseShellHash arguments
     * @returns The parsed url
     */;
    _proto2.parseShellHash = function parseShellHash(sHash) {
      return this.urlParsingService.parseShellHash(sHash);
    }

    /**
     * Will call splitHash method of URLParsing service with given sHash.
     *
     * @param sHash Check the definition of
     * sap.ushell.services.URLParsing=>splitHash arguments
     * @returns Promise which will be resolved to object
     */;
    _proto2.splitHash = function splitHash(sHash) {
      return this.urlParsingService.splitHash(sHash);
    }

    /**
     * Will call constructShellHash method of URLParsing service with given sHash.
     *
     * @param oNewShellHash Check the definition of
     * sap.ushell.services.URLParsing=>constructShellHash arguments
     * @returns Shell Hash string
     */;
    _proto2.constructShellHash = function constructShellHash(oNewShellHash) {
      return this.urlParsingService.constructShellHash(oNewShellHash);
    }

    /**
     * Will call setDirtyFlag method with given dirty state.
     *
     * @param bDirty Check the definition of sap.ushell.Container.setDirtyFlag arguments
     */;
    _proto2.setDirtyFlag = function setDirtyFlag(bDirty) {
      this.oShellContainer.setDirtyFlag(bDirty);
    }

    /**
     * Will call registerDirtyStateProvider method with given dirty state provider callback method.
     *
     * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.registerDirtyStateProvider arguments
     */;
    _proto2.registerDirtyStateProvider = function registerDirtyStateProvider(fnDirtyStateProvider) {
      this.oShellContainer.registerDirtyStateProvider(fnDirtyStateProvider);
    }

    /**
     * Will call deregisterDirtyStateProvider method with given dirty state provider callback method.
     *
     * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.deregisterDirtyStateProvider arguments
     */;
    _proto2.deregisterDirtyStateProvider = function deregisterDirtyStateProvider(fnDirtyStateProvider) {
      this.oShellContainer.deregisterDirtyStateProvider(fnDirtyStateProvider);
    }

    /**
     * Will call createRenderer method of ushell container.
     *
     * @returns Returns renderer object
     */;
    _proto2.createRenderer = function createRenderer() {
      return this.oShellContainer.createRenderer();
    }

    /**
     * Will call getUser method of ushell container.
     *
     * @returns Returns User object
     */;
    _proto2.getUser = function getUser() {
      return this.oShellContainer.getUser();
    }

    /**
     * Will check if ushell container is available or not.
     *
     * @returns Returns true
     */;
    _proto2.hasUShell = function hasUShell() {
      return true;
    }

    /**
     * Will call registerNavigationFilter method of shellNavigation.
     *
     * @param fnNavFilter The filter function to register
     */;
    _proto2.registerNavigationFilter = function registerNavigationFilter(fnNavFilter) {
      this.shellNavigation.registerNavigationFilter(fnNavFilter);
    }

    /**
     * Will call unregisterNavigationFilter method of shellNavigation.
     *
     * @param fnNavFilter The filter function to unregister
     */;
    _proto2.unregisterNavigationFilter = function unregisterNavigationFilter(fnNavFilter) {
      this.shellNavigation.unregisterNavigationFilter(fnNavFilter);
    }

    /**
     * Will call setBackNavigation method of ShellUIService
     * that displays the back button in the shell header.
     *
     * @param [fnCallBack] A callback function called when the button is clicked in the UI.
     */;
    _proto2.setBackNavigation = function setBackNavigation(fnCallBack) {
      this.shellUIService.setBackNavigation(fnCallBack);
    }

    /**
     * Will call setHierarchy method of ShellUIService
     * that displays the given hierarchy in the shell header.
     *
     * @param [aHierarchyLevels] An array representing hierarchies of the currently displayed app.
     */;
    _proto2.setHierarchy = function setHierarchy(aHierarchyLevels) {
      this.shellUIService.setHierarchy(aHierarchyLevels);
    }

    /**
     * Will call setTitle method of ShellUIService
     * that displays the given title in the shell header.
     *
     * @param [sTitle] The new title. The default title is set if this argument is not given.
     */;
    _proto2.setTitle = function setTitle(sTitle) {
      this.shellUIService.setTitle(sTitle);
    }

    /**
     * Will call getTitle method of ShellUIService
     * that displays the given title in the shell header.
     *
     * @returns The title of the application.
     */;
    _proto2.getTitle = function getTitle() {
      return this.shellUIService.getTitle();
    }

    /**
     * Retrieves the currently defined content density.
     *
     * @returns The content density value
     */;
    _proto2.getContentDensity = function getContentDensity() {
      return this.oShellContainer.getUser().getContentDensity();
    }

    /**
     * For a given semantic object, this method considers all actions associated with the semantic object and
     * returns the one tagged as a "primaryAction". If no inbound tagged as "primaryAction" exists, then it returns
     * the intent of the first inbound (after sorting has been applied) matching the action "displayFactSheet".
     *
     * @param sSemanticObject Semantic object.
     * @param mParameters See #CrossApplicationNavigation#getLinks for description.
     * @returns Promise which will be resolved with an object containing the intent if it exists.
     */;
    _proto2.getPrimaryIntent = function getPrimaryIntent(sSemanticObject, mParameters) {
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line promise/catch-or-return
        this.crossAppNavService.getPrimaryIntent(sSemanticObject, mParameters).fail(oError => {
          reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getPrimaryIntent`));
        }).then(resolve);
      });
    }

    /**
     * Wait for the render extensions plugin to be loaded.
     *
     * @returns True if we are able to wait for it, otherwise we couldn't and cannot rely on it.
     */;
    _proto2.waitForPluginsLoad = function waitForPluginsLoad() {
      return new Promise(resolve => {
        var _this$shellPluginMana;
        if (!((_this$shellPluginMana = this.shellPluginManager) !== null && _this$shellPluginMana !== void 0 && _this$shellPluginMana.getPluginLoadingPromise)) {
          resolve(false);
        } else {
          // eslint-disable-next-line promise/catch-or-return
          this.shellPluginManager.getPluginLoadingPromise("RendererExtensions").fail(oError => {
            Log.error(oError, "sap.fe.core.services.ShellServicesFactory.waitForPluginsLoad");
            resolve(false);
          }).then(() => resolve(true));
        }
      });
    };
    return ShellServices;
  }(Service);
  /**
   * Service Factory for the ShellServices
   *
   */
  let ShellServicesFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(ShellServicesFactory, _ServiceFactory);
    function ShellServicesFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    var _proto3 = ShellServicesFactory.prototype;
    /**
     * Creates either a standard or a mock Shell service depending on the configuration.
     *
     * @param oServiceContext The shellservice context
     * @returns A promise for a shell service implementation
     * @see ServiceFactory#createInstance
     */
    _proto3.createInstance = function createInstance(oServiceContext) {
      oServiceContext.settings.shellContainer = sap.ushell && sap.ushell.Container;
      const oShellService = oServiceContext.settings.shellContainer ? new ShellServices(oServiceContext) : new ShellServiceMock(oServiceContext);
      return oShellService.initPromise.then(() => {
        // Enrich the appComponent with this method
        oServiceContext.scopeObject.getShellServices = () => oShellService;
        return oShellService;
      });
    };
    return ShellServicesFactory;
  }(ServiceFactory);
  return ShellServicesFactory;
}, false);
