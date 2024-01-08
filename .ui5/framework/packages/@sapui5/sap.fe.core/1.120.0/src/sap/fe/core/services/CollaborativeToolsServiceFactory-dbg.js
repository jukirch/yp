/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/suite/ui/commons/collaboration/ServiceContainer", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory"], function (ServiceContainer, Service, ServiceFactory) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let CollaborativeToolsService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(CollaborativeToolsService, _Service);
    function CollaborativeToolsService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.CollaborativeToolsService = CollaborativeToolsService;
    var _proto = CollaborativeToolsService.prototype;
    _proto.init = function init() {
      this.teamsIntegration = {
        isInitialized: false
      };
      this.initPromise = Promise.resolve(this);
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    _proto.initializeMSTeams = async function initializeMSTeams() {
      const helperService = await ServiceContainer.getServiceAsync();
      this.teamsIntegration.isInitialized = true;
      this.teamsIntegration.helperService = helperService;
      this.teamsIntegration.isContactsCollaborationSupported =
      //await helperService.isTeamsModeActive() && // this checks for url params appState=lean&sap-collaboration-teams=true
      typeof helperService.isContactsCollaborationSupported === "function" && helperService.isContactsCollaborationSupported();
    };
    _proto.getMailPopoverFromMsTeamsIntegration = async function getMailPopoverFromMsTeamsIntegration(mail) {
      if (!this.teamsIntegration.isInitialized) {
        await this.initializeMSTeams();
      }
      try {
        var _this$teamsIntegratio;
        return await ((_this$teamsIntegratio = this.teamsIntegration.helperService) === null || _this$teamsIntegratio === void 0 ? void 0 : _this$teamsIntegratio.enableMinimalContactsCollaboration(mail));
      } catch {
        return undefined;
      }
    };
    _proto.isContactsCollaborationSupported = async function isContactsCollaborationSupported() {
      if (!this.teamsIntegration.isInitialized) {
        await this.initializeMSTeams();
      }
      return this.teamsIntegration.isContactsCollaborationSupported === true;
    };
    _proto.getTeamContactOptions = async function getTeamContactOptions() {
      if (!this.teamsIntegration.isInitialized) {
        await this.initializeMSTeams();
      }
      if (!this.teamsIntegration.isContactsCollaborationSupported) {
        return undefined;
      }
      if (!this.teamsIntegration.contactOptions) {
        try {
          var _this$teamsIntegratio2;
          this.teamsIntegration.contactOptions = await ((_this$teamsIntegratio2 = this.teamsIntegration.helperService) === null || _this$teamsIntegratio2 === void 0 ? void 0 : _this$teamsIntegratio2.getTeamsContactCollabOptions());
        } catch {
          return undefined;
        }
      }
      return this.teamsIntegration.contactOptions;
    };
    return CollaborativeToolsService;
  }(Service);
  _exports.CollaborativeToolsService = CollaborativeToolsService;
  let CollaborativeToolsServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(CollaborativeToolsServiceFactory, _ServiceFactory);
    function CollaborativeToolsServiceFactory() {
      return _ServiceFactory.apply(this, arguments) || this;
    }
    var _proto2 = CollaborativeToolsServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(serviceContext) {
      const collaborativeToolsService = new CollaborativeToolsService(serviceContext);
      return collaborativeToolsService.initPromise;
    };
    return CollaborativeToolsServiceFactory;
  }(ServiceFactory);
  return CollaborativeToolsServiceFactory;
}, false);
