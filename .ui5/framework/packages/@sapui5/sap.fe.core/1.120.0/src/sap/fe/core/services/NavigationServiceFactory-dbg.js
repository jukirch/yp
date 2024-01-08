/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/navigation/NavigationHandler", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/thirdparty/jquery"], function (NavigationHandler, Service, ServiceFactory, jQuery) {
  "use strict";

  var _exports = {};
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let NavigationService = /*#__PURE__*/function (_Service) {
    _inheritsLoose(NavigationService, _Service);
    function NavigationService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.NavigationService = NavigationService;
    var _proto = NavigationService.prototype;
    _proto.init = function init() {
      const oContext = this.getContext(),
        oComponent = oContext && oContext.scopeObject;
      this.oNavHandler = new NavigationHandler(oComponent);
      this.oNavHandler.setModel(oComponent.getModel());
      this.initPromise = Promise.resolve(this);
    };
    _proto.exit = function exit() {
      this.oNavHandler.destroy();
    }

    /**
     * Triggers a cross-app navigation after saving the inner and the cross-app states.
     *
     * @param sSemanticObject Semantic object of the target app
     * @param sActionName Action of the target app
     * @param [vNavigationParameters] Navigation parameters as an object with key/value pairs or as a string representation of
     *        such an object. If passed as an object, the properties are not checked against the <code>IsPotentialSensitive</code> or
     *        <code>Measure</code> type.
     * @param [oInnerAppData] Object for storing current state of the app
     * @param [fnOnError] Callback that is called if an error occurs during navigation <br>
     * @param [oExternalAppData] Object for storing the state which will be forwarded to the target component.
     * @param [sNavMode] Argument is used to overwrite the FLP-configured target for opening a URL. If used, only the
     *        <code>explace</code> or <code>inplace</code> values are allowed. Any other value will lead to an exception
     *        <code>NavigationHandler.INVALID_NAV_MODE</code>.
     */;
    _proto.navigate = function navigate(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnError, oExternalAppData, sNavMode) {
      // TODO: Navigation Handler does not handle navigation without a context
      // but in v4 DataFieldForIBN with requiresContext false can trigger a navigation without any context
      // This should be handled
      this.oNavHandler.navigate(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnError, oExternalAppData, sNavMode);
    }

    /**
     * Parses the incoming URL and returns a Promise.
     *
     * @returns A Promise object which returns the
     * extracted app state, the startup parameters, and the type of navigation when execution is successful,
     */;
    _proto.parseNavigation = function parseNavigation() {
      return this.oNavHandler.parseNavigation();
    }

    /**
     * Processes navigation-related tasks related to beforePopoverOpens event handling for the SmartLink control and returns a Promise object.
     *
     * @param oTableEventParameters The parameters made available by the SmartTable control when the SmartLink control has been clicked,
     *        an instance of a PopOver object
     * @param sSelectionVariant Stringified JSON object as returned, for example, from getDataSuiteFormat() of the SmartFilterBar control
     * @param [mInnerAppData] Object containing the current state of the app. If provided, opening the Popover is deferred until the
     *        inner app data is saved in a consistent way.
     * @returns A Promise object to monitor when all actions of the function have been executed; if the execution is successful, the
     *          modified oTableEventParameters is returned; if an error occurs, an error object of type
     *          {@link sap.fe.navigation.NavError} is returned
     */;
    _proto._processBeforeSmartLinkPopoverOpens = function _processBeforeSmartLinkPopoverOpens(oTableEventParameters, sSelectionVariant, mInnerAppData) {
      return this.oNavHandler.processBeforeSmartLinkPopoverOpens(oTableEventParameters, sSelectionVariant, mInnerAppData);
    }

    /**
     * Get App specific hash.
     *
     * @param appHash The path string
     * @returns A string representing base path
     *
     */;
    _proto.getAppSpecificHash = async function getAppSpecificHash(appHash) {
      return this.oNavHandler._getAppSpecificHash(appHash);
    }

    /**
     * Processes selectionVariant string and returns a Promise object (semanticAttributes and AppStateKey).
     *
     * @param sSelectionVariant Stringified JSON object
     * @returns A Promise object to monitor when all actions in the function have been executed; if the execution is successful, the
     *          semanticAttributes as well as the appStateKey are returned; if an error occurs, an error object of type
     *          {@link sap.fe.navigation.NavError} is returned
     * <br>
     * @example <code>
     *
     * 		var oSelectionVariant = new sap.fe.navigation.SelectionVariant();
     * 		oSelectionVariant.addSelectOption("CompanyCode", "I", "EQ", "0001");
     * 		oSelectionVariant.addSelectOption("Customer", "I", "EQ", "C0001");
     * 		var sSelectionVariant= oSelectionVariant.toJSONString();
     *
     * 		var oNavigationHandler = new sap.fe.navigation.NavigationHandler(oController);
     * 		var oPromiseObject = oNavigationHandler._getAppStateKeyAndUrlParameters(sSelectionVariant);
     *
     * 		oPromiseObject.done(function(oSemanticAttributes, sAppStateKey){
     * 			// here you can add coding that should run after all app state and the semantic attributes have been returned.
     * 		});
     *
     * 		oPromiseObject.fail(function(oError){
     * 			//some error handling
     * 		});
     *
     * </code>
     */;
    _proto.getAppStateKeyAndUrlParameters = function getAppStateKeyAndUrlParameters(sSelectionVariant) {
      return this.oNavHandler._getAppStateKeyAndUrlParameters(sSelectionVariant);
    }

    /**
     * Gets the application specific technical parameters.
     *
     * @returns Containing the technical parameters.
     */;
    _proto.getTechnicalParameters = function getTechnicalParameters() {
      return this.oNavHandler.getTechnicalParameters();
    }

    /**
     * Sets the application specific technical parameters. Technical parameters will not be added to the selection variant passed to the
     * application.
     * As a default sap-system, sap-ushell-defaultedParameterNames and hcpApplicationId are considered as technical parameters.
     *
     * @param aTechnicalParameters List of parameter names to be considered as technical parameters. <code>null</code> or
     *        <code>undefined</code> may be used to reset the complete list.
     */;
    _proto.setTechnicalParameters = function setTechnicalParameters(aTechnicalParameters) {
      this.oNavHandler.setTechnicalParameters(aTechnicalParameters);
    }

    /**
     * Sets the model that is used for verification of sensitive information. If the model is not set, the unnamed component model is used for the
     * verification of sensitive information.
     *
     * @param oModel Model For checking sensitive information
     */;
    _proto.setModel = function setModel(oModel) {
      this.oNavHandler.setModel(oModel);
    }

    /**
     * Changes the URL according to the current app state and stores the app state for later retrieval.
     *
     * @param mInnerAppData Object containing the current state of the app
     * @param [bImmediateHashReplace] If set to false, the inner app hash will not be replaced until storing is successful; do not
     *        set to false if you cannot react to the resolution of the Promise, for example, when calling the beforeLinkPressed event
     * @param [bSkipHashReplace] If set to true, the inner app hash will not be replaced in the storeInnerAppState. Also the bImmediateHashReplace
     * 		  will be ignored.
     * @returns A Promise object to monitor when all the actions of the function have been executed; if the execution is successful, the
     *          app state key is returned; if an error occurs, an object of type {@link sap.fe.navigation.NavError} is
     *          returned
     */;
    _proto.storeInnerAppStateAsync = function storeInnerAppStateAsync(mInnerAppData, bImmediateHashReplace, bSkipHashReplace) {
      // safely converting JQuerry deferred to ES6 promise
      return new Promise((resolve, reject) => this.oNavHandler.storeInnerAppStateAsync(mInnerAppData, bImmediateHashReplace, bSkipHashReplace).then(resolve, reject));
    }

    /**
     * Changes the URL according to the current app state and stores the app state for later retrieval.
     *
     * @param mInnerAppData Object containing the current state of the app
     * @param [bImmediateHashReplace] If set to false, the inner app hash will not be replaced until storing is successful; do not
     * @returns An object containing the appStateId and a promise object to monitor when all the actions of the function have been
     * executed; Please note that the appStateKey may be undefined or empty.
     */;
    _proto.storeInnerAppStateWithImmediateReturn = function storeInnerAppStateWithImmediateReturn(mInnerAppData, bImmediateHashReplace) {
      return this.oNavHandler.storeInnerAppStateWithImmediateReturn(mInnerAppData, bImmediateHashReplace);
    }

    /**
     * Changes the URL according to the current sAppStateKey. As an reaction route change event will be triggered.
     *
     * @param sAppStateKey The new app state key.
     */;
    _proto.replaceHash = function replaceHash(sAppStateKey) {
      this.oNavHandler.replaceHash(sAppStateKey);
    };
    _proto.replaceInnerAppStateKey = function replaceInnerAppStateKey(sAppHash, sAppStateKey) {
      return this.oNavHandler._replaceInnerAppStateKey(sAppHash, sAppStateKey);
    }

    /**
     * Get single values from SelectionVariant for url parameters.
     *
     * @param [vSelectionVariant]
     * @param [vSelectionVariant.oUrlParamaters]
     * @returns The url parameters
     */;
    _proto.getUrlParametersFromSelectionVariant = function getUrlParametersFromSelectionVariant(vSelectionVariant) {
      return this.oNavHandler._getURLParametersFromSelectionVariant(vSelectionVariant);
    }

    /**
     * Save app state and return immediately without waiting for response.
     *
     * @param oInSelectionVariant Instance of sap.fe.navigation.SelectionVariant
     * @returns AppState key
     */;
    _proto.saveAppStateWithImmediateReturn = function saveAppStateWithImmediateReturn(oInSelectionVariant) {
      if (oInSelectionVariant) {
        const sSelectionVariant = oInSelectionVariant.toJSONString(),
          // create an SV for app state in string format
          oSelectionVariant = JSON.parse(sSelectionVariant),
          // convert string into JSON to store in AppState
          oXAppStateObject = {
            selectionVariant: oSelectionVariant
          },
          oReturn = this.oNavHandler._saveAppStateWithImmediateReturn(oXAppStateObject);
        return oReturn !== null && oReturn !== void 0 && oReturn.appStateKey ? oReturn.appStateKey : "";
      } else {
        return undefined;
      }
    }

    /**
     * Mix Attributes and selectionVariant.
     *
     * @param vSemanticAttributes Object/(Array of Objects) containing key/value pairs
     * @param sSelectionVariant The selection variant in string format as provided by the SmartFilterBar control
     * @param iSuppressionBehavior Indicates whether semantic
     *        attributes with special values (see {@link sap.fe.navigation.SuppressionBehavior suppression behavior}) must be
     *        suppressed before they are combined with the selection variant; several
     *        {@link sap.fe.navigation.SuppressionBehavior suppression behaviors} can be combined with the bitwise OR operator
     *        (|)
     * @returns Instance of {@link sap.fe.navigation.SelectionVariant}
     */;
    _proto.mixAttributesAndSelectionVariant = function mixAttributesAndSelectionVariant(vSemanticAttributes, sSelectionVariant, iSuppressionBehavior) {
      return this.oNavHandler.mixAttributesAndSelectionVariant(vSemanticAttributes, sSelectionVariant, iSuppressionBehavior);
    }

    /**
     * The method creates a context url based on provided data. This context url can either be used as.
     *
     * @param sEntitySetName Used for url determination
     * @param oModel The ODataModel used for url determination. If omitted, the NavigationHandler model is used.
     * @returns The context url for the given entities
     */;
    _proto.constructContextUrl = function constructContextUrl(sEntitySetName, oModel) {
      return this.oNavHandler.constructContextUrl(sEntitySetName, oModel);
    };
    _proto.getInterface = function getInterface() {
      return this;
    }

    /**
     * The method returns iAppState key for the current navgation handler instance.
     *
     * @returns IAppState key
     */;
    _proto.getIAppStateKey = function getIAppStateKey() {
      return this.oNavHandler.getIAppStateKey();
    };
    return NavigationService;
  }(Service);
  _exports.NavigationService = NavigationService;
  function fnGetEmptyObject() {
    return {};
  }
  function fnGetPromise() {
    return Promise.resolve({});
  }
  function fnGetJQueryPromise() {
    const oMyDeffered = jQuery.Deferred();
    oMyDeffered.resolve({}, {}, "initial");
    return oMyDeffered.promise();
  }
  function fnGetEmptyString() {
    return "";
  }
  let NavigationServicesMock = /*#__PURE__*/function (_ServiceFactory) {
    _inheritsLoose(NavigationServicesMock, _ServiceFactory);
    function NavigationServicesMock() {
      var _this;
      _this = _ServiceFactory.call(this) || this;
      _this.createEmptyAppState = fnGetEmptyObject;
      _this.storeInnerAppStateWithImmediateReturn = fnGetEmptyObject;
      _this.mixAttributesAndSelectionVariant = fnGetEmptyObject;
      _this.getAppState = fnGetPromise;
      _this.getStartupAppState = fnGetPromise;
      _this.parseNavigation = fnGetJQueryPromise;
      _this.constructContextUrl = fnGetEmptyString;
      _this.getIAppStateKey = fnGetEmptyString;
      _this.initPromise = Promise.resolve(_assertThisInitialized(_this));
      return _this;
    }
    _exports.NavigationServicesMock = NavigationServicesMock;
    var _proto2 = NavigationServicesMock.prototype;
    _proto2.getInterface = function getInterface() {
      return this;
    }

    // return empty object
    ;
    _proto2.replaceInnerAppStateKey = function replaceInnerAppStateKey(sAppHash) {
      return sAppHash ? sAppHash : "";
    };
    _proto2.navigate = function navigate() {
      // Don't do anything
    };
    return NavigationServicesMock;
  }(ServiceFactory);
  _exports.NavigationServicesMock = NavigationServicesMock;
  let NavigationServiceFactory = /*#__PURE__*/function (_ServiceFactory2) {
    _inheritsLoose(NavigationServiceFactory, _ServiceFactory2);
    function NavigationServiceFactory() {
      return _ServiceFactory2.apply(this, arguments) || this;
    }
    var _proto3 = NavigationServiceFactory.prototype;
    _proto3.createInstance = function createInstance(oServiceContext) {
      const oNavigationService = sap.ushell && sap.ushell.Container ? new NavigationService(oServiceContext) : new NavigationServicesMock();
      // Wait For init
      return oNavigationService.initPromise.then(function (oService) {
        return oService;
      });
    };
    return NavigationServiceFactory;
  }(ServiceFactory);
  return NavigationServiceFactory;
}, false);
