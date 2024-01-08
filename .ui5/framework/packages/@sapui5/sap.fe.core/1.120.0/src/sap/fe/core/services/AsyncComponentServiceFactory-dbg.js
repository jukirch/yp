/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (Service, ServiceFactory) {
  "use strict";

  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let AsyncComponentService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(AsyncComponentService, _Service);
    function AsyncComponentService() {
      return _Service.apply(this, arguments) || this;
    }
    var _proto = AsyncComponentService.prototype;
    // !: means that we know it will be assigned before usage
    _proto.init = function init() {
      this.initPromise = new Promise((resolve, reject) => {
        this.resolveFn = resolve;
        this.rejectFn = reject;
      });
      const oContext = this.getContext();
      const oComponent = oContext.scopeObject;
      const oServices = oComponent._getManifestEntry("/sap.ui5/services", true);
      Promise.all(Object.keys(oServices).filter(sServiceKey => oServices[sServiceKey].startup === "waitFor" && oServices[sServiceKey].factoryName !== "sap.fe.core.services.AsyncComponentService").map(sServiceKey => {
        return oComponent.getService(sServiceKey).then(oServiceInstance => {
          const sMethodName = `get${sServiceKey[0].toUpperCase()}${sServiceKey.substring(1)}`;
          if (!oComponent.hasOwnProperty(sMethodName)) {
            oComponent[sMethodName] = function () {
              return oServiceInstance;
            };
          }
        });
      })).then(() => {
        return oComponent.pRootControlLoaded || Promise.resolve();
      }).then(() => {
        // notifiy the component
        if (oComponent.onServicesStarted) {
          oComponent.onServicesStarted();
        }
        this.resolveFn(this);
      }).catch(this.rejectFn);
    };
    return AsyncComponentService;
  }(Service);
  let AsyncComponentServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(AsyncComponentServiceFactory, _ServiceFactory);
    function AsyncComponentServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    var _proto2 = AsyncComponentServiceFactory.prototype;
    _proto2.createInstance = function createInstance(oServiceContext) {
      const asyncComponentService = new AsyncComponentService(oServiceContext);
      return asyncComponentService.initPromise;
    };
    return AsyncComponentServiceFactory;
  }(ServiceFactory);
  return AsyncComponentServiceFactory;
}, false);
