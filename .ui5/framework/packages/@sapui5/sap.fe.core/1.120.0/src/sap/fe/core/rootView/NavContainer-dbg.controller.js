/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/KeepAliveHelper", "sap/m/IllustratedMessage", "sap/m/Page", "./RootViewBaseController"], function (Log, CommonUtils, ViewState, ClassSupport, KeepAliveHelper, IllustratedMessage, Page, BaseController) {
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
  /**
   * Base controller class for your own root view with a sap.m.NavContainer control.
   *
   * By using or extending this controller you can use your own root view with the sap.fe.core.AppComponent and
   * you can make use of SAP Fiori elements pages and SAP Fiori elements building blocks.
   *
   * @hideconstructor
   * @public
   * @since 1.108.0
   */
  let NavContainerController = (_dec = defineUI5Class("sap.fe.core.rootView.NavContainer"), _dec2 = usingExtension(ViewState.override({
    applyInitialStateOnly: function () {
      return false;
    },
    adaptBindingRefreshControls: function (aControls) {
      const oView = this.getView(),
        oController = oView.getController();
      aControls.push(oController._getCurrentPage(oView));
    },
    adaptStateControls: function (aStateControls) {
      const oView = this.getView(),
        oController = oView.getController();
      aStateControls.push(oController._getCurrentPage(oView));
    },
    onRestore: function () {
      const oView = this.getView(),
        oController = oView.getController(),
        oNavContainer = oController.getAppContentContainer();
      const oInternalModel = oNavContainer.getModel("internal");
      const oPages = oInternalModel.getProperty("/pages");
      for (const sComponentId in oPages) {
        oInternalModel.setProperty(`/pages/${sComponentId}/restoreStatus`, "pending");
      }
      oController.onContainerReady();
    },
    onSuspend: function () {
      const oView = this.getView(),
        oNavController = oView.getController(),
        oNavContainer = oNavController.getAppContentContainer();
      const aPages = oNavContainer.getPages();
      aPages.forEach(function (oPage) {
        const oTargetView = CommonUtils.getTargetView(oPage);
        const oController = oTargetView && oTargetView.getController();
        if (oController && oController.viewState && oController.viewState.onSuspend) {
          oController.viewState.onSuspend();
        }
      });
    }
  })), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    _inheritsLoose(NavContainerController, _BaseController);
    function NavContainerController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "viewState", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = NavContainerController.prototype;
    _proto.onContainerReady = function onContainerReady() {
      // Restore views if neccessary.
      const oView = this.getView(),
        oPagePromise = this._getCurrentPage(oView);
      return oPagePromise.then(function (oCurrentPage) {
        const oTargetView = CommonUtils.getTargetView(oCurrentPage);
        return KeepAliveHelper.restoreView(oTargetView);
      });
    };
    _proto._getCurrentPage = function _getCurrentPage(oView) {
      const oNavContainer = this.getAppContentContainer();
      return new Promise(function (resolve) {
        const oCurrentPage = oNavContainer.getCurrentPage();
        if (oCurrentPage && oCurrentPage.getController && oCurrentPage.getController().isPlaceholder && oCurrentPage.getController().isPlaceholder()) {
          oCurrentPage.getController().attachEventOnce("targetPageInsertedInContainer", function (oEvent) {
            const oTargetPage = oEvent.getParameter("targetpage");
            const oTargetView = CommonUtils.getTargetView(oTargetPage);
            resolve(oTargetView !== oView && oTargetView);
          });
        } else {
          const oTargetView = CommonUtils.getTargetView(oCurrentPage);
          resolve(oTargetView !== oView && oTargetView);
        }
      });
    };
    _proto._getNavContainer = function _getNavContainer() {
      return this.getAppContentContainer();
    }

    /**
     * Gets the instanced views in the navContainer component.
     *
     * @returns Return the views.
     */;
    _proto.getInstancedViews = function getInstancedViews() {
      return this._getNavContainer().getPages().map(page => {
        if (page && page.isA("sap.ui.core.ComponentContainer")) {
          return page.getComponentInstance().getRootControl();
        } else {
          return page;
        }
      });
    }

    /**
     * Check if the FCL component is enabled.
     *
     * @returns `false` since we are not in FCL scenario
     * @final
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      return false;
    };
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      // Do nothing
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
      return new Promise((resolve, reject) => {
        try {
          const oNavContainer = this._getNavContainer();
          if (!this.oPage) {
            this.oPage = new Page({
              showHeader: false
            });
            this.oIllustratedMessage = new IllustratedMessage({
              title: sErrorMessage,
              description: mParameters.description || "",
              illustrationType: `sapIllus-${mParameters.errorType}`
            });
            this.oPage.insertContent(this.oIllustratedMessage, 0);
            oNavContainer.addPage(this.oPage);
          }
          if (mParameters.handleShellBack) {
            const oErrorOriginPage = oNavContainer.getCurrentPage(),
              oAppComponent = CommonUtils.getAppComponent(oNavContainer.getCurrentPage());
            oAppComponent.getShellServices().setBackNavigation(function () {
              oNavContainer.to(oErrorOriginPage.getId());
              oAppComponent.getShellServices().setBackNavigation();
            });
          }
          oNavContainer.attachAfterNavigate(function () {
            resolve(true);
          });
          oNavContainer.to(this.oPage.getId());
        } catch (e) {
          reject(false);
          Log.info(e);
        }
      });
    };
    return NavContainerController;
  }(BaseController), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return NavContainerController;
}, false);
