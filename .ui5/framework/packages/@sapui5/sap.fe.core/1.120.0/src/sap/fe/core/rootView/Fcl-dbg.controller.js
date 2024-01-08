/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/f/FlexibleColumnLayoutSemanticHelper", "sap/f/library", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/KeepAliveHelper", "sap/m/IllustratedMessage", "sap/m/Link", "sap/m/MessageBox", "sap/m/Page", "./RootViewBaseController"], function (Log, FlexibleColumnLayoutSemanticHelper, fLibrary, ViewState, ClassSupport, KeepAliveHelper, IllustratedMessage, Link, MessageBox, Page, BaseController) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var usingExtension = ClassSupport.usingExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  const LayoutType = fLibrary.LayoutType;
  const CONSTANTS = {
    page: {
      names: ["BeginColumn", "MidColumn", "EndColumn"],
      currentGetter: {
        prefix: "getCurrent",
        suffix: "Page"
      },
      getter: {
        prefix: "get",
        suffix: "Pages"
      }
    }
  };
  const _getViewFromContainer = function (oContainer) {
    if (oContainer.isA("sap.ui.core.ComponentContainer")) {
      return oContainer.getComponentInstance().getRootControl();
    } else {
      return oContainer;
    }
  };
  /**
   * Base controller class for your own root view with an sap.f.FlexibleColumnLayout control.
   *
   * By using or extending this controller, you can use your own root view with the sap.fe.core.AppComponent and
   * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
   *
   * @hideconstructor
   * @public
   * @since 1.110.0
   */
  let FclController = (_dec = defineUI5Class("sap.fe.core.rootView.Fcl"), _dec2 = usingExtension(ViewState.override({
    applyInitialStateOnly: function () {
      return false;
    },
    adaptBindingRefreshControls: function (aControls) {
      this.getView().getController()._getAllVisibleViews().forEach(function (oChildView) {
        const pChildView = Promise.resolve(oChildView);
        aControls.push(pChildView);
      });
    },
    adaptStateControls: function (aStateControls) {
      this.getView().getController()._getAllVisibleViews().forEach(function (oChildView) {
        const pChildView = Promise.resolve(oChildView);
        aStateControls.push(pChildView);
      });
    },
    onRestore: function () {
      const fclController = this.getView().getController();
      const appContentContainer = fclController.getAppContentContainer();
      const internalModel = appContentContainer.getModel("internal");
      const pages = internalModel.getProperty("/pages");
      for (const componentId in pages) {
        internalModel.setProperty(`/pages/${componentId}/restoreStatus`, "pending");
      }
      fclController.onContainerReady();
    },
    onSuspend: function () {
      const oFCLController = this.getView().getController();
      const oFCLControl = oFCLController.getFclControl();
      const aBeginColumnPages = oFCLControl.getBeginColumnPages() || [];
      const aMidColumnPages = oFCLControl.getMidColumnPages() || [];
      const aEndColumnPages = oFCLControl.getEndColumnPages() || [];
      const aPages = [].concat(aBeginColumnPages, aMidColumnPages, aEndColumnPages);
      aPages.forEach(function (oPage) {
        const oTargetView = _getViewFromContainer(oPage);
        const oController = oTargetView && oTargetView.getController();
        if (oController && oController.viewState && oController.viewState.onSuspend) {
          oController.viewState.onSuspend();
        }
      });
    }
  })), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    _inheritsLoose(FclController, _BaseController);
    function FclController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "viewState", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = FclController.prototype;
    _proto.onInit = function onInit() {
      _BaseController.prototype.onInit.call(this);
      this._internalInit();
    };
    _proto.manageDataReceived = function manageDataReceived(event) {
      if (event.getParameter("error")) {
        var _targetedView$getBind;
        const path = event.getParameter("path"),
          targetedView = this._getAllVisibleViews().find(view => {
            var _view$getBindingConte;
            return ((_view$getBindingConte = view.getBindingContext()) === null || _view$getBindingConte === void 0 ? void 0 : _view$getBindingConte.getPath()) === path;
          });
        // We need to manage error when the request is related to a form  into an ObjectPage
        if (path && targetedView !== null && targetedView !== void 0 && (_targetedView$getBind = targetedView.getBindingContext()) !== null && _targetedView$getBind !== void 0 && _targetedView$getBind.isKeepAlive()) {
          targetedView.getController()._routing.onDataReceived(event);
        }
      }
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this.getRouter().attachBeforeRouteMatched(this._getViewForNavigatedRowsComputation, this);
      _BaseController.prototype.attachRouteMatchers.call(this);
      this._internalInit();
      this.getRouter().attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
      this.getRouter().attachRouteMatched(this.onRouteMatched, this);
      this.getFclControl().attachStateChange(this._saveLayout, this);
    };
    _proto._internalInit = function _internalInit() {
      var _oRoutingConfig$confi, _oRoutingConfig$confi2;
      if (this._oRouterProxy) {
        return; // Already initialized
      }

      this.sCurrentRouteName = "";
      this.sCurrentArguments = {};
      this.SQUERYKEYNAME = "?query";
      const oAppComponent = this.getAppComponent();
      const oDataModel = this.getAppComponent().getModel();
      oDataModel === null || oDataModel === void 0 ? void 0 : oDataModel.attachEvent("dataReceived", this.manageDataReceived.bind(this));
      this._oRouterProxy = oAppComponent.getRouterProxy();

      // Get FCL configuration in the manifest
      this._oFCLConfig = {
        maxColumnsCount: 3
      };
      const oRoutingConfig = oAppComponent.getManifest()["sap.ui5"].routing;
      if (oRoutingConfig !== null && oRoutingConfig !== void 0 && (_oRoutingConfig$confi = oRoutingConfig.config) !== null && _oRoutingConfig$confi !== void 0 && _oRoutingConfig$confi.flexibleColumnLayout) {
        const oFCLManifestConfig = oRoutingConfig.config.flexibleColumnLayout;

        // Default layout for 2 columns
        if (oFCLManifestConfig.defaultTwoColumnLayoutType) {
          this._oFCLConfig.defaultTwoColumnLayoutType = oFCLManifestConfig.defaultTwoColumnLayoutType;
        }

        // Default layout for 3 columns
        if (oFCLManifestConfig.defaultThreeColumnLayoutType) {
          this._oFCLConfig.defaultThreeColumnLayoutType = oFCLManifestConfig.defaultThreeColumnLayoutType;
        }

        // Limit FCL to 2 columns ?
        if (oFCLManifestConfig.limitFCLToTwoColumns === true) {
          this._oFCLConfig.maxColumnsCount = 2;
        }
      }
      if (oRoutingConfig !== null && oRoutingConfig !== void 0 && (_oRoutingConfig$confi2 = oRoutingConfig.config) !== null && _oRoutingConfig$confi2 !== void 0 && _oRoutingConfig$confi2.controlAggregation) {
        this._oFCLConfig.defaultControlAggregation = oRoutingConfig.config.controlAggregation;
      }
      this._initializeTargetAggregation(oAppComponent);
      this._initializeRoutesInformation(oAppComponent);
      this.getFclControl().attachStateChange(this.onStateChanged, this);
      this.getFclControl().attachAfterEndColumnNavigate(this.onStateChanged, this);
    };
    _proto.getFclControl = function getFclControl() {
      return this.getAppContentContainer();
    };
    _proto._saveLayout = function _saveLayout(oEvent) {
      this.sPreviousLayout = oEvent.getParameters().layout;
    }

    /**
     * Get the additional view (on top of the visible views), to be able to compute the latest table navigated rows of
     * the most right visible view after a nav back or column fullscreen.
     *
     */;
    _proto._getViewForNavigatedRowsComputation = function _getViewForNavigatedRowsComputation() {
      const aAllVisibleViewsBeforeRouteMatched = this._getAllVisibleViews(this.sPreviousLayout);
      const oRightMostViewBeforeRouteMatched = aAllVisibleViewsBeforeRouteMatched[aAllVisibleViewsBeforeRouteMatched.length - 1];
      let oRightMostView;
      this.getRouter().attachEventOnce("routeMatched", oEvent => {
        oRightMostView = _getViewFromContainer(oEvent.getParameter("views")[oEvent.getParameter("views").length - 1]);
        if (oRightMostViewBeforeRouteMatched) {
          // Navigation forward from L2 to view level L3 (FullScreenLayout):
          if (oRightMostView.getViewData() && oRightMostView.getViewData().viewLevel === this._oFCLConfig.maxColumnsCount) {
            this.oAdditionalViewForNavRowsComputation = oRightMostView;
          }
          // Navigations backward from L3 down to L2, L1, L0 (ThreeColumn layout):
          if (oRightMostView.getViewData() && oRightMostViewBeforeRouteMatched.getViewData() && oRightMostViewBeforeRouteMatched.getViewData().viewLevel < this._oFCLConfig.maxColumnsCount && oRightMostViewBeforeRouteMatched.getViewData() && oRightMostViewBeforeRouteMatched.getViewData().viewLevel > oRightMostView.getViewData().viewLevel && oRightMostView !== oRightMostViewBeforeRouteMatched) {
            this.oAdditionalViewForNavRowsComputation = oRightMostViewBeforeRouteMatched;
          }
        }
      });
    };
    _proto.getViewForNavigatedRowsComputation = function getViewForNavigatedRowsComputation() {
      return this.oAdditionalViewForNavRowsComputation;
    };
    _proto.onExit = function onExit() {
      this.getRouter().detachRouteMatched(this.onRouteMatched, this);
      this.getRouter().detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
      this.getFclControl().detachStateChange(this.onStateChanged, this);
      this.getFclControl().detachAfterEndColumnNavigate(this.onStateChanged, this);
      this._oTargetsAggregation = null;
      this._oTargetsFromRoutePattern = null;
      BaseController.prototype.onExit.bind(this)();
    }

    /**
     * Check if the FCL component is enabled.
     *
     * @returns `true` since we are in FCL scenario
     * @final
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      return true;
    }

    /**
     * Method that creates a new Page to display the IllustratedMessage containing the current error.
     *
     * @param sErrorMessage
     * @param mParameters
     * @returns A promise that creates a Page to display the error
     * @public
     */;
    _proto.displayErrorPage = function displayErrorPage(sErrorMessage, mParameters) {
      const oFCLControl = this.getFclControl();
      if (this._oFCLConfig && mParameters.FCLLevel >= this._oFCLConfig.maxColumnsCount) {
        mParameters.FCLLevel = this._oFCLConfig.maxColumnsCount - 1;
      }
      if (!this.aMessagePages) {
        this.aMessagePages = [null, null, null];
      }
      let oMessagePage = this.aMessagePages[mParameters.FCLLevel];
      if (!oMessagePage) {
        oMessagePage = new Page({
          showHeader: false
        });
        const illustratedMessage = new IllustratedMessage({
          title: sErrorMessage,
          description: mParameters.description || "",
          illustrationType: `sapIllus-${mParameters.errorType}`
        });
        oMessagePage.insertContent(illustratedMessage, 0);
        this.aMessagePages[mParameters.FCLLevel] = oMessagePage;
        switch (mParameters.FCLLevel) {
          case 0:
            oFCLControl.addBeginColumnPage(oMessagePage);
            break;
          case 1:
            oFCLControl.addMidColumnPage(oMessagePage);
            break;
          default:
            oFCLControl.addEndColumnPage(oMessagePage);
        }
      }
      oMessagePage.setText(sErrorMessage);
      if (mParameters.technicalMessage) {
        oMessagePage.setCustomDescription(new Link({
          text: mParameters.description || mParameters.technicalMessage,
          press: function () {
            MessageBox.show(mParameters.technicalMessage, {
              icon: MessageBox.Icon.ERROR,
              title: mParameters.title,
              actions: [MessageBox.Action.OK],
              defaultAction: MessageBox.Action.OK,
              details: mParameters.technicalDetails || "",
              contentWidth: "60%"
            });
          }
        }));
      } else {
        oMessagePage.setDescription(mParameters.description || "");
      }
      oFCLControl.to(oMessagePage.getId());
      return Promise.resolve(true);
    }

    /**
     * Initialize the object _oTargetsAggregation that defines for each route the relevant aggregation and pattern.
     *
     * @param oAppComponent Reference to the AppComponent
     */;
    _proto._initializeTargetAggregation = function _initializeTargetAggregation(oAppComponent) {
      const oManifest = oAppComponent.getManifest(),
        oTargets = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.targets : null;
      this._oTargetsAggregation = {};
      if (oTargets) {
        Object.keys(oTargets).forEach(sTargetName => {
          const oTarget = oTargets[sTargetName];
          if (oTarget.controlAggregation) {
            this._oTargetsAggregation[sTargetName] = {
              aggregation: oTarget.controlAggregation,
              pattern: oTarget.contextPattern
            };
          } else {
            this._oTargetsAggregation[sTargetName] = {
              aggregation: "page",
              pattern: null
            };
          }
        });
      }
    }

    /**
     * Initializes the mapping between a route (identifed as its pattern) and the corresponding targets
     *
     * @param oAppComponent ref to the AppComponent
     */;
    _proto._initializeRoutesInformation = function _initializeRoutesInformation(oAppComponent) {
      const oManifest = oAppComponent.getManifest(),
        aRoutes = oManifest["sap.ui5"].routing ? oManifest["sap.ui5"].routing.routes : null;
      this._oTargetsFromRoutePattern = {};
      if (aRoutes) {
        aRoutes.forEach(route => {
          this._oTargetsFromRoutePattern[route.pattern] = route.target;
        });
      }
    };
    _proto.getCurrentArgument = function getCurrentArgument() {
      return this.sCurrentArguments;
    };
    _proto.getCurrentRouteName = function getCurrentRouteName() {
      return this.sCurrentRouteName;
    }

    /**
     * Get FE FCL constant.
     *
     * @returns The constants
     */;
    _proto.getConstants = function getConstants() {
      return CONSTANTS;
    }

    /**
     * Getter for oTargetsAggregation array.
     *
     * @returns The _oTargetsAggregation array
     */;
    _proto.getTargetAggregation = function getTargetAggregation() {
      return this._oTargetsAggregation;
    }

    /**
     * Function triggered by the router RouteMatched event.
     *
     * @param oEvent
     */;
    _proto.onRouteMatched = function onRouteMatched(oEvent) {
      const sRouteName = oEvent.getParameter("name");

      // Save the current/previous routes and arguments
      this.sCurrentRouteName = sRouteName;
      this.sCurrentArguments = oEvent.getParameter("arguments");
    }

    /**
     * This function is triggering the table scroll to the navigated row after each layout change.
     *
     */;
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      const aViews = this._getAllVisibleViews();
      //The scrolls are triggered only if the layout is with several columns or when switching the mostRight column in full screen
      if (aViews.length > 1 || aViews[0].getViewData().viewLevel < this._oFCLConfig.maxColumnsCount) {
        let sCurrentViewPath;
        const oAdditionalView = this.getViewForNavigatedRowsComputation();
        if (oAdditionalView && !aViews.includes(oAdditionalView)) {
          aViews.push(oAdditionalView);
        }
        for (let index = aViews.length - 1; index > 0; index--) {
          const oView = aViews[index],
            oPreviousView = aViews[index - 1];
          if (oView.getBindingContext()) {
            sCurrentViewPath = oView.getBindingContext().getPath();
            oPreviousView.getController()._scrollTablesToRow(sCurrentViewPath);
          }
        }
      }
    }

    /**
     * Function triggered by the FCL StateChanged event.
     *
     * @param oEvent
     */;
    _proto.onStateChanged = function onStateChanged(oEvent) {
      const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow");
      if (this.sCurrentArguments !== undefined) {
        if (!this.sCurrentArguments[this.SQUERYKEYNAME]) {
          this.sCurrentArguments[this.SQUERYKEYNAME] = {};
        }
        this.sCurrentArguments[this.SQUERYKEYNAME].layout = oEvent.getParameter("layout");
      }
      this._forceModelContextChangeOnBreadCrumbs(oEvent);

      // Replace the URL with the new layout if a navigation arrow was used
      if (bIsNavigationArrow) {
        this._oRouterProxy.navTo(this.sCurrentRouteName, this.sCurrentArguments);
      }
      const oView = this.getRightmostView();
      if (oView) {
        this._computeTitleHierarchy(oView);
      }
    }

    /**
     * Function to fire ModelContextChange event on all breadcrumbs ( on each ObjectPages).
     *
     * @param oEvent
     */;
    _proto._forceModelContextChangeOnBreadCrumbs = function _forceModelContextChangeOnBreadCrumbs(oEvent) {
      //force modelcontextchange on ObjectPages to refresh the breadcrumbs link hrefs
      const oFcl = oEvent.getSource();
      let oPages = [];
      oPages = oPages.concat(oFcl.getBeginColumnPages()).concat(oFcl.getMidColumnPages()).concat(oFcl.getEndColumnPages());
      oPages.forEach(function (oPage) {
        const oView = _getViewFromContainer(oPage);
        const oBreadCrumbs = oView.byId && oView.byId("breadcrumbs");
        if (oBreadCrumbs) {
          oBreadCrumbs.fireModelContextChange();
        }
      });
    }

    /**
     * Function triggered to update the Share button Visibility.
     *
     * @param viewColumn Name of the current column ("beginColumn", "midColumn", "endColumn")
     * @param sLayout The current layout used by the FCL
     * @returns The share button visibility
     */;
    _proto._updateShareButtonVisibility = function _updateShareButtonVisibility(viewColumn, sLayout) {
      let bShowShareIcon;
      switch (sLayout) {
        case "OneColumn":
          bShowShareIcon = viewColumn === "beginColumn";
          break;
        case "MidColumnFullScreen":
        case "ThreeColumnsBeginExpandedEndHidden":
        case "ThreeColumnsMidExpandedEndHidden":
        case "TwoColumnsBeginExpanded":
        case "TwoColumnsMidExpanded":
          bShowShareIcon = viewColumn === "midColumn";
          break;
        case "EndColumnFullScreen":
        case "ThreeColumnsEndExpanded":
        case "ThreeColumnsMidExpanded":
          bShowShareIcon = viewColumn === "endColumn";
          break;
        default:
          bShowShareIcon = false;
      }
      return bShowShareIcon;
    };
    _proto._updateEditButtonVisiblity = function _updateEditButtonVisiblity(viewColumn, sLayout) {
      let bEditButtonVisible = true;
      switch (viewColumn) {
        case "midColumn":
          switch (sLayout) {
            case "TwoColumnsMidExpanded":
            case "ThreeColumnsMidExpanded":
            case "ThreeColumnsEndExpanded":
              bEditButtonVisible = false;
              break;
          }
          break;
        case "endColumn":
          switch (sLayout) {
            case "ThreeColumnsMidExpanded":
            case "ThreeColumnsEndExpanded":
              bEditButtonVisible = false;
          }
          break;
      }
      return bEditButtonVisible;
    };
    _proto.updateUIStateForView = function updateUIStateForView(oView, FCLLevel) {
      const oUIState = this.getHelper().getCurrentUIState(),
        oFclColName = ["beginColumn", "midColumn", "endColumn"],
        sLayout = this.getFclControl().getLayout();
      let viewColumn;
      if (!oView.getModel("fclhelper")) {
        oView.setModel(this._createHelperModel(), "fclhelper");
      }
      if (FCLLevel >= this._oFCLConfig.maxColumnsCount) {
        // The view is on a level > max number of columns. It's always fullscreen without close/exit buttons
        viewColumn = oFclColName[this._oFCLConfig.maxColumnsCount - 1];
        oUIState.actionButtonsInfo.midColumn.fullScreen = null;
        oUIState.actionButtonsInfo.midColumn.exitFullScreen = null;
        oUIState.actionButtonsInfo.midColumn.closeColumn = null;
        oUIState.actionButtonsInfo.endColumn.exitFullScreen = null;
        oUIState.actionButtonsInfo.endColumn.fullScreen = null;
        oUIState.actionButtonsInfo.endColumn.closeColumn = null;
      } else {
        viewColumn = oFclColName[FCLLevel];
      }
      if (FCLLevel >= this._oFCLConfig.maxColumnsCount || sLayout === "EndColumnFullScreen" || sLayout === "MidColumnFullScreen" || sLayout === "OneColumn") {
        oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", true);
      } else {
        oView.getModel("fclhelper").setProperty("/breadCrumbIsVisible", false);
      }
      // Unfortunately, the FCLHelper doesn't provide actionButton values for the first column
      // so we have to add this info manually
      oUIState.actionButtonsInfo.beginColumn = {
        fullScreen: null,
        exitFullScreen: null,
        closeColumn: null
      };
      const oActionButtonInfos = Object.assign({}, oUIState.actionButtonsInfo[viewColumn]);
      oActionButtonInfos.switchVisible = oActionButtonInfos.fullScreen !== null || oActionButtonInfos.exitFullScreen !== null;
      oActionButtonInfos.switchIcon = oActionButtonInfos.fullScreen !== null ? "sap-icon://full-screen" : "sap-icon://exit-full-screen";
      oActionButtonInfos.isFullScreen = oActionButtonInfos.fullScreen === null;
      oActionButtonInfos.closeVisible = oActionButtonInfos.closeColumn !== null;
      oView.getModel("fclhelper").setProperty("/actionButtonsInfo", oActionButtonInfos);
      oView.getModel("fclhelper").setProperty("/showEditButton", this._updateEditButtonVisiblity(viewColumn, sLayout));
      oView.getModel("fclhelper").setProperty("/showShareIcon", this._updateShareButtonVisibility(viewColumn, sLayout));
    }

    /**
     * Function triggered by the router BeforeRouteMatched event.
     *
     * @param oEvent
     */;
    _proto.onBeforeRouteMatched = function onBeforeRouteMatched(oEvent) {
      if (oEvent) {
        const oQueryParams = oEvent.getParameters().arguments[this.SQUERYKEYNAME];
        let sLayout = oQueryParams ? oQueryParams.layout : null;

        // If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
        if (!sLayout) {
          const oNextUIState = this.getHelper().getNextUIState(0);
          sLayout = oNextUIState.layout;
        }

        // Check if the layout if compatible with the number of targets
        // This should always be the case for normal navigation, just needed in case
        // the URL has been manually modified
        const aTargets = oEvent.getParameter("config").target;
        sLayout = this._correctLayoutForTargets(sLayout, aTargets);

        // Update the layout of the FlexibleColumnLayout
        if (sLayout) {
          this.getFclControl().setLayout(sLayout);
        }
      }
    }

    /**
     * Helper for the FCL Component.
     *
     * @returns Instance of a semantic helper
     */;
    _proto.getHelper = function getHelper() {
      return FlexibleColumnLayoutSemanticHelper.getInstanceFor(this.getFclControl(), this._oFCLConfig);
    }

    /**
     * Calculates the FCL layout for a given FCL level and a target hash.
     *
     * @param iNextFCLLevel FCL level to be navigated to
     * @param sHash The hash to be navigated to
     * @param sProposedLayout The proposed layout
     * @param keepCurrentLayout True if we want to keep the current layout if possible
     * @returns The calculated layout
     */;
    _proto.calculateLayout = function calculateLayout(iNextFCLLevel, sHash, sProposedLayout) {
      let keepCurrentLayout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      // First, ask the FCL helper to calculate the layout if nothing is proposed
      if (!sProposedLayout) {
        sProposedLayout = keepCurrentLayout ? this.getFclControl().getLayout() : this.getHelper().getNextUIState(iNextFCLLevel).layout;
      }

      // Then change this value if necessary, based on the number of targets
      const oRoute = this.getRouter().getRouteByHash(`${sHash}?layout=${sProposedLayout}`);
      const aTargets = this._oTargetsFromRoutePattern[oRoute.getPattern()];
      return this._correctLayoutForTargets(sProposedLayout, aTargets);
    }

    /**
     * Checks whether a given FCL layout is compatible with an array of targets.
     *
     * @param sProposedLayout Proposed value for the FCL layout
     * @param aTargets Array of target names used for checking
     * @returns The corrected layout
     */;
    _proto._correctLayoutForTargets = function _correctLayoutForTargets(sProposedLayout, aTargets) {
      const allAllowedLayouts = {
        "2": ["TwoColumnsMidExpanded", "TwoColumnsBeginExpanded", "MidColumnFullScreen"],
        "3": ["ThreeColumnsMidExpanded", "ThreeColumnsEndExpanded", "ThreeColumnsMidExpandedEndHidden", "ThreeColumnsBeginExpandedEndHidden", "MidColumnFullScreen", "EndColumnFullScreen"]
      };
      if (aTargets && !Array.isArray(aTargets)) {
        // To support single target as a string in the manifest
        aTargets = [aTargets];
      }
      if (!aTargets) {
        // Defensive, just in case...
        return sProposedLayout;
      } else if (aTargets.length > 1) {
        // More than 1 target: just simply check from the allowed values
        const aLayouts = allAllowedLayouts[aTargets.length];
        if (aLayouts.indexOf(sProposedLayout) < 0) {
          // The proposed layout isn't compatible with the number of columns
          // --> Ask the helper for the default layout for the number of columns
          sProposedLayout = aLayouts[0];
        }
      } else {
        // Only one target
        const sTargetAggregation = this.getTargetAggregation()[aTargets[0]].aggregation || this._oFCLConfig.defaultControlAggregation;
        switch (sTargetAggregation) {
          case "beginColumnPages":
            sProposedLayout = "OneColumn";
            break;
          case "midColumnPages":
            sProposedLayout = "MidColumnFullScreen";
            break;
          case "endColumnPages":
            sProposedLayout = "EndColumnFullScreen";
            break;
          // no default
        }
      }

      return sProposedLayout;
    }

    /**
     * Gets the instanced views in the FCL component.
     *
     * @returns Return the views.
     */;
    _proto.getInstancedViews = function getInstancedViews() {
      const fclControl = this.getFclControl();
      const componentContainers = [...fclControl.getBeginColumnPages(), ...fclControl.getMidColumnPages(), ...fclControl.getEndColumnPages()];
      return componentContainers.map(oPage => {
        if (oPage && oPage.isA("sap.ui.core.ComponentContainer")) {
          return oPage.getComponentInstance().getRootControl();
        } else {
          return oPage;
        }
      });
    }

    /**
     * get all visible views in the FCL component.
     * sLayout optional parameter is very specific as part of the calculation of the latest navigated row
     *
     * @param {*} sLayout Layout that was applied just before the current navigation
     * @returns {Array} return views
     */;
    _proto._getAllVisibleViews = function _getAllVisibleViews(sLayout) {
      const aViews = [];
      sLayout = sLayout ? sLayout : this.getFclControl().getLayout();
      switch (sLayout) {
        case LayoutType.EndColumnFullScreen:
          if (this.getFclControl().getCurrentEndColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentEndColumnPage()));
          }
          break;
        case LayoutType.MidColumnFullScreen:
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          break;
        case LayoutType.OneColumn:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          break;
        case LayoutType.ThreeColumnsEndExpanded:
        case LayoutType.ThreeColumnsMidExpanded:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          if (this.getFclControl().getCurrentEndColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentEndColumnPage()));
          }
          break;
        case LayoutType.TwoColumnsBeginExpanded:
        case LayoutType.TwoColumnsMidExpanded:
        case LayoutType.ThreeColumnsMidExpandedEndHidden:
        case LayoutType.ThreeColumnsBeginExpandedEndHidden:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          break;
        default:
          Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
      }
      return aViews;
    };
    _proto._getAllViews = function _getAllViews(sLayout) {
      const aViews = [];
      sLayout = sLayout ? sLayout : this.getFclControl().getLayout();
      switch (sLayout) {
        case LayoutType.OneColumn:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          break;
        case LayoutType.ThreeColumnsEndExpanded:
        case LayoutType.ThreeColumnsMidExpanded:
        case LayoutType.ThreeColumnsMidExpandedEndHidden:
        case LayoutType.ThreeColumnsBeginExpandedEndHidden:
        case LayoutType.EndColumnFullScreen:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          if (this.getFclControl().getCurrentEndColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentEndColumnPage()));
          }
          break;
        case LayoutType.TwoColumnsBeginExpanded:
        case LayoutType.TwoColumnsMidExpanded:
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          break;
        case LayoutType.MidColumnFullScreen:
          // In this case we need to determine if this mid column fullscreen comes from a 2 or a 3 column layout
          const sLayoutWhenExitFullScreen = this.getHelper().getCurrentUIState().actionButtonsInfo.midColumn.exitFullScreen;
          if (this.getFclControl().getCurrentBeginColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentBeginColumnPage()));
          }
          if (this.getFclControl().getCurrentMidColumnPage()) {
            aViews.push(_getViewFromContainer(this.getFclControl().getCurrentMidColumnPage()));
          }
          if (sLayoutWhenExitFullScreen.indexOf("ThreeColumn") >= 0) {
            // We come from a 3 column layout
            if (this.getFclControl().getCurrentEndColumnPage()) {
              aViews.push(_getViewFromContainer(this.getFclControl().getCurrentEndColumnPage()));
            }
          }
          break;
        default:
          Log.error(`Unhandled switch case for ${this.getFclControl().getLayout()}`);
      }
      return aViews;
    };
    _proto.onContainerReady = function onContainerReady() {
      // Restore views if neccessary.
      const aViews = this._getAllVisibleViews();
      const aRestorePromises = aViews.reduce(function (aPromises, oTargetView) {
        aPromises.push(KeepAliveHelper.restoreView(oTargetView));
        return aPromises;
      }, []);
      return Promise.all(aRestorePromises);
    };
    _proto.getRightmostContext = function getRightmostContext() {
      const oView = this.getRightmostView();
      return oView && oView.getBindingContext();
    };
    _proto.getRightmostView = function getRightmostView() {
      return this._getAllViews().pop();
    };
    _proto.isContextUsedInPages = function isContextUsedInPages(oContext) {
      if (!this.getFclControl()) {
        return false;
      }
      const aAllVisibleViews = this._getAllViews();
      for (const view of aAllVisibleViews) {
        if (view) {
          if (view.getBindingContext() === oContext) {
            return true;
          }
        } else {
          // A view has been destroyed --> app is currently being destroyed
          return false;
        }
      }
      return false;
    };
    _proto._setShellMenuTitle = function _setShellMenuTitle(oAppComponent, sTitle, sAppTitle) {
      if (this.getHelper().getCurrentUIState().isFullScreen !== true) {
        oAppComponent.getShellServices().setTitle(sAppTitle);
      } else {
        oAppComponent.getShellServices().setTitle(sTitle);
      }
    };
    return FclController;
  }(BaseController), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return FclController;
}, false);
