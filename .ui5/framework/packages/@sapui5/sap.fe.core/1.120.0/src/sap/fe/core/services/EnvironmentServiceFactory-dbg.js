/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/suite/ui/commons/collaboration/CollaborationHelper", "sap/ui/VersionInfo", "sap/ui/core/Core", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "../converters/MetaModelConverter"], function (CollaborationHelper, VersionInfo, Core, Service, ServiceFactory, MetaModelConverter) {
  "use strict";

  var _exports = {};
  var DefaultEnvironmentCapabilities = MetaModelConverter.DefaultEnvironmentCapabilities;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let EnvironmentCapabilitiesService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(EnvironmentCapabilitiesService, _Service);
    function EnvironmentCapabilitiesService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.EnvironmentCapabilitiesService = EnvironmentCapabilitiesService;
    var _proto = EnvironmentCapabilitiesService.prototype;
    // !: means that we know it will be assigned before usage
    _proto.init = function init() {
      this.initPromise = new Promise((resolve, reject) => {
        this.resolveFn = resolve;
        this.rejectFn = reject;
      });
      const oContext = this.getContext();
      this.environmentCapabilities = Object.assign({}, DefaultEnvironmentCapabilities);
      VersionInfo.load().then(async versionInfo => {
        this.environmentCapabilities.Chart = !!versionInfo.libraries.find(lib => lib.name === "sap.viz");
        this.environmentCapabilities.MicroChart = !!versionInfo.libraries.find(lib => lib.name === "sap.suite.ui.microchart");
        this.environmentCapabilities.UShell = !!(sap && sap.ushell && sap.ushell.Container);
        this.environmentCapabilities.IntentBasedNavigation = !!(sap && sap.ushell && sap.ushell.Container);
        this.environmentCapabilities.InsightsSupported = !!versionInfo.libraries.find(lib => lib.name === "sap.insights") && (await getInsightsEnabled());
        this.environmentCapabilities = Object.assign(this.environmentCapabilities, oContext.settings);
        this.resolveFn(this);
        return null;
      }).catch(this.rejectFn);
    };
    EnvironmentCapabilitiesService.resolveLibrary = async function resolveLibrary(libraryName) {
      return new Promise(function (resolve) {
        try {
          Core.loadLibrary(`${libraryName.replace(/\./g, "/")}`, {
            async: true
          }).then(function () {
            resolve(true);
          }).catch(function () {
            resolve(false);
          });
        } catch (e) {
          resolve(false);
        }
      });
    };
    _proto.setCapabilities = function setCapabilities(oCapabilities) {
      this.environmentCapabilities = oCapabilities;
    };
    _proto.setCapability = function setCapability(capability, value) {
      this.environmentCapabilities[capability] = value;
    };
    _proto.getCapabilities = function getCapabilities() {
      return this.environmentCapabilities;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    return EnvironmentCapabilitiesService;
  }(Service);
  _exports.EnvironmentCapabilitiesService = EnvironmentCapabilitiesService;
  let EnvironmentServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(EnvironmentServiceFactory, _ServiceFactory);
    function EnvironmentServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    _exports.EnvironmentServiceFactory = EnvironmentServiceFactory;
    var _proto2 = EnvironmentServiceFactory.prototype;
    _proto2.createInstance = function createInstance(oServiceContext) {
      const environmentCapabilitiesService = new EnvironmentCapabilitiesService(oServiceContext);
      return environmentCapabilitiesService.initPromise;
    };
    return EnvironmentServiceFactory;
  }(ServiceFactory);
  /**
   * Checks if insights are enabled on the home page.
   *
   * @returns True if insights are enabled on the home page.
   */
  _exports.EnvironmentServiceFactory = EnvironmentServiceFactory;
  async function getInsightsEnabled() {
    // insights is enabled
    return new Promise(async resolve => {
      try {
        // getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
        const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
        if (isLibAvailable) {
          sap.ui.require(["sap/insights/CardHelper"], async CardHelper => {
            try {
              await CardHelper.getServiceAsync("UIService");
              resolve(!(await getMSTeamsActive()));
            } catch {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Checks if the application is opened on Microsoft Teams.
   *
   * @returns True if the application is opened on Microsoft Teams.
   */
  _exports.getInsightsEnabled = getInsightsEnabled;
  async function getMSTeamsActive() {
    let isTeamsModeActive = false;
    try {
      isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
    } catch {
      return false;
    }
    return isTeamsModeActive;
  }
  _exports.getMSTeamsActive = getMSTeamsActive;
  return _exports;
}, false);
