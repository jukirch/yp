/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/BaseController", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/Placeholder", "sap/fe/core/controllerextensions/ViewState", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/SizeHelper", "sap/ui/base/BindingParser", "sap/ui/core/Core", "sap/ui/core/routing/HashChanger", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/v4/AnnotationHelper", "sap/ui/thirdparty/URI"], function (Log, BaseController, CommonUtils, Placeholder, ViewState, ClassSupport, SizeHelper, BindingParser, Core, HashChanger, JSONModel, AnnotationHelper, URI) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var usingExtension = ClassSupport.usingExtension;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let RootViewBaseController = (_dec = defineUI5Class("sap.fe.core.rootView.RootViewBaseController"), _dec2 = usingExtension(Placeholder), _dec3 = usingExtension(ViewState), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseController) {
    _inheritsLoose(RootViewBaseController, _BaseController);
    function RootViewBaseController() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BaseController.call(this, ...args) || this;
      _initializerDefineProperty(_this, "oPlaceholder", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "viewState", _descriptor2, _assertThisInitialized(_this));
      _this.bIsComputingTitleHierachy = false;
      return _this;
    }
    var _proto = RootViewBaseController.prototype;
    _proto.onInit = function onInit() {
      SizeHelper.init();
      this._aHelperModels = [];
    };
    _proto.getPlaceholder = function getPlaceholder() {
      return this.oPlaceholder;
    };
    _proto.attachRouteMatchers = function attachRouteMatchers() {
      this.oPlaceholder.attachRouteMatchers();
      this.getAppComponent().getRoutingService().attachAfterRouteMatched(this._onAfterRouteMatched, this);
    };
    _proto.onExit = function onExit() {
      this.getAppComponent().getRoutingService().detachAfterRouteMatched(this._onAfterRouteMatched, this);
      this.oRouter = undefined;
      SizeHelper.exit();

      // Destroy all JSON models created dynamically for the views
      this._aHelperModels.forEach(function (oModel) {
        oModel.destroy();
      });
    }

    /**
     * Convenience method for getting the resource bundle.
     *
     * @public
     * @returns The resourceModel of the component
     */;
    _proto.getResourceBundle = function getResourceBundle() {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    };
    _proto.getRouter = function getRouter() {
      if (!this.oRouter) {
        this.oRouter = this.getAppComponent().getRouter();
      }
      return this.oRouter;
    };
    _proto._createHelperModel = function _createHelperModel() {
      // We keep a reference on the models created dynamically, as they don't get destroyed
      // automatically when the view is destroyed.
      // This is done during onExit
      const oModel = new JSONModel();
      this._aHelperModels.push(oModel);
      return oModel;
    }

    /**
     * Function waiting for the Right most view to be ready.
     *
     * @param oEvent Reference an Event parameter coming from routeMatched event
     * @returns A promise indicating when the right most view is ready
     */;
    _proto.waitForRightMostViewReady = function waitForRightMostViewReady(oEvent) {
      return new Promise(function (resolve) {
        const aContainers = oEvent.getParameter("views") ?? [],
          // There can also be reuse components in the view, remove them before processing.
          aFEContainers = [];
        aContainers.forEach(function (oContainer) {
          let oView = oContainer;
          if (oContainer && oContainer.getComponentInstance) {
            const oComponentInstance = oContainer.getComponentInstance();
            oView = oComponentInstance.getRootControl();
          }
          if (oView && oView.getController() && oView.getController().pageReady) {
            aFEContainers.push(oView);
          }
        });
        const oRightMostFEView = aFEContainers[aFEContainers.length - 1];
        if (oRightMostFEView && oRightMostFEView.getController().pageReady.isPageReady()) {
          resolve(oRightMostFEView);
        } else if (oRightMostFEView) {
          oRightMostFEView.getController().pageReady.attachEventOnce("pageReady", function () {
            resolve(oRightMostFEView);
          });
        }
      });
    }

    /**
     * Method to restore the focusInformation from the history Object.
     */;
    _proto.restoreFocusFromHistory = function restoreFocusFromHistory() {
      var _Core$byId;
      switch (history.state.focusInfo.type) {
        case "Row":
          const table = Core.byId(history.state.focusInfo.tableId);
          const pos = table.getRowBinding().getCurrentContexts().findIndex(context => context.getPath() === history.state.focusInfo.contextPathFocus);
          if (pos !== -1) {
            table.focusRow(pos);
          }
          break;
        default:
          (_Core$byId = Core.byId(history.state.focusInfo.controlId)) === null || _Core$byId === void 0 ? void 0 : _Core$byId.focus();
      }
      //once applied, the focus info is removed to prevent focusing on it each time the user do a back navigation to this page
      history.replaceState(Object.assign(history.state, {
        focusInfo: null
      }), "");
    }

    /**
     * Callback when the navigation is done.
     *  - update the shell title.
     *  - update table scroll.
     *  - call onPageReady on the rightMostView.
     *
     * @param oEvent
     */;
    _proto._onAfterRouteMatched = function _onAfterRouteMatched(oEvent) {
      if (!this._oRouteMatchedPromise) {
        this._oRouteMatchedPromise = this.waitForRightMostViewReady(oEvent).then(oView => {
          // The autoFocus is initially disabled on the navContainer or the FCL, so that the focus stays on the Shell menu
          // even if the app takes a long time to launch
          // The first time the view is displayed, we need to enable the autofocus so that it's managed properly during navigation
          const oRootControl = this.getView().getContent()[0];
          if (oRootControl && oRootControl.getAutoFocus && !oRootControl.getAutoFocus()) {
            oRootControl.setProperty("autoFocus", true, true); // Do not mark the container as invalid, otherwise it's re-rendered
          }

          const oAppComponent = this.getAppComponent();
          this._scrollTablesToLastNavigatedItems();
          if (oAppComponent.getEnvironmentCapabilities().getCapabilities().UShell) {
            this._computeTitleHierarchy(oView);
          }
          const bForceFocus = oAppComponent.getRouterProxy().isFocusForced();
          oAppComponent.getRouterProxy().setFocusForced(false); // reset
          if (oView.getController() && oView.getController().onPageReady && oView.getParent().onPageReady) {
            oView.getParent().onPageReady({
              forceFocus: bForceFocus
            });
          }
          if (history.state.focusInfo) {
            this.restoreFocusFromHistory();
          } else if (!bForceFocus) {
            // Try to restore the focus on where it was when we last visited the current hash
            oAppComponent.getRouterProxy().restoreFocusForCurrentHash();
          }
          if (this.onContainerReady) {
            this.onContainerReady();
          }
        }).catch(function (oError) {
          Log.error("An error occurs while computing the title hierarchy and calling focus method", oError);
        }).finally(() => {
          this._oRouteMatchedPromise = null;
        });
      }
    }

    /**
     * This function returns the TitleHierarchy cache ( or initializes it if undefined).
     *
     * @returns  The TitleHierarchy cache
     */;
    _proto._getTitleHierarchyCache = function _getTitleHierarchyCache() {
      if (!this.oTitleHierarchyCache) {
        this.oTitleHierarchyCache = {};
      }
      return this.oTitleHierarchyCache;
    }

    /**
     * This function returns a titleInfo object.
     *
     * @param title The application's title
     * @param subtitle The application's subTitle
     * @param sIntent The intent path to be redirected to
     * @param icon The application's icon
     * @returns The title information
     */;
    _proto._computeTitleInfo = function _computeTitleInfo(title, subtitle, sIntent) {
      let icon = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
      const aParts = sIntent.split("/");
      if (aParts[aParts.length - 1].indexOf("?") === -1) {
        sIntent += "?restoreHistory=true";
      } else {
        sIntent += "&restoreHistory=true";
      }
      return {
        title: title,
        subtitle: subtitle,
        intent: sIntent,
        icon: icon
      };
    };
    _proto._formatTitle = function _formatTitle(displayMode, titleValue, titleDescription) {
      let formattedTitle = "";
      switch (displayMode) {
        case "Value":
          formattedTitle = `${titleValue}`;
          break;
        case "ValueDescription":
          formattedTitle = `${titleValue} (${titleDescription})`;
          break;
        case "DescriptionValue":
          formattedTitle = `${titleDescription} (${titleValue})`;
          break;
        case "Description":
          formattedTitle = `${titleDescription}`;
          break;
        default:
      }
      return formattedTitle;
    }

    /**
     * Fetches the value of the HeaderInfo title for a given path.
     *
     * @param sPath The path to the entity
     * @returns A promise containing the formatted title, or an empty string if no HeaderInfo title annotation is available
     */;
    _proto._fetchTitleValue = async function _fetchTitleValue(sPath) {
      const oAppComponent = this.getAppComponent(),
        oModel = this.getView().getModel(),
        oMetaModel = oAppComponent.getMetaModel(),
        sMetaPath = oMetaModel.getMetaPath(sPath),
        oBindingViewContext = oModel.createBindingContext(sPath),
        sValueExpression = AnnotationHelper.format(oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value`), {
          context: oMetaModel.createBindingContext("/")
        });
      if (!sValueExpression) {
        return Promise.resolve("");
      }
      const sTextExpression = AnnotationHelper.format(oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@com.sap.vocabularies.Common.v1.Text`), {
          context: oMetaModel.createBindingContext("/")
        }),
        oPropertyContext = oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value/$Path@`),
        aPromises = [],
        oValueExpression = BindingParser.complexParser(sValueExpression),
        oPromiseForDisplayMode = new Promise(function (resolve) {
          const displayMode = CommonUtils.computeDisplayMode(oPropertyContext);
          resolve(displayMode);
        });
      aPromises.push(oPromiseForDisplayMode);
      const sValuePath = oValueExpression.parts ? oValueExpression.parts[0].path : oValueExpression.path,
        fnValueFormatter = oValueExpression.formatter,
        oValueBinding = oModel.bindProperty(sValuePath, oBindingViewContext, {
          $$groupId: "$auto.Heroes"
        });
      oValueBinding.initialize();
      const oPromiseForTitleValue = new Promise(function (resolve) {
        const fnChange = function (oEvent) {
          const sTargetValue = fnValueFormatter ? fnValueFormatter(oEvent.getSource().getValue()) : oEvent.getSource().getValue();
          oValueBinding.detachChange(fnChange);
          resolve(sTargetValue);
        };
        oValueBinding.attachChange(fnChange);
      });
      aPromises.push(oPromiseForTitleValue);
      if (sTextExpression) {
        const oTextExpression = BindingParser.complexParser(sTextExpression);
        let sTextPath = oTextExpression.parts ? oTextExpression.parts[0].path : oTextExpression.path;
        sTextPath = sValuePath.lastIndexOf("/") > -1 ? `${sValuePath.slice(0, sValuePath.lastIndexOf("/"))}/${sTextPath}` : sTextPath;
        const fnTextFormatter = oTextExpression.formatter,
          oTextBinding = oModel.bindProperty(sTextPath, oBindingViewContext, {
            $$groupId: "$auto.Heroes"
          });
        oTextBinding.initialize();
        const oPromiseForTitleText = new Promise(function (resolve) {
          const fnChange = function (oEvent) {
            const sTargetText = fnTextFormatter ? fnTextFormatter(oEvent.getSource().getValue()) : oEvent.getSource().getValue();
            oTextBinding.detachChange(fnChange);
            resolve(sTargetText);
          };
          oTextBinding.attachChange(fnChange);
        });
        aPromises.push(oPromiseForTitleText);
      }
      try {
        const titleInfo = await Promise.all(aPromises);
        let formattedTitle = "";
        if (typeof titleInfo !== "string") {
          formattedTitle = this._formatTitle(titleInfo[0], titleInfo[1], titleInfo[2]);
        }
        return formattedTitle;
      } catch (error) {
        Log.error("Error while fetching the title from the header info :" + error);
      }
      return "";
    }

    /**
     * Function returning the decoded application-specific hash.
     *
     * @returns Decoded application-specific hash
     */;
    _proto._getAppSpecificHash = function _getAppSpecificHash() {
      // HashChanged isShellNavigationHashChanger
      const hashChanger = HashChanger.getInstance();
      return "hrefForAppSpecificHash" in hashChanger ? URI.decode(hashChanger.hrefForAppSpecificHash("")) : "#/";
    };
    _proto._getHash = function _getHash() {
      return HashChanger.getInstance().getHash();
    }

    /**
     * This function returns titleInformation from a path.
     * It updates the cache to store title information if necessary
     *
     * @param {*} sPath path of the context to retrieve title information from MetaModel
     * @returns {Promise}  oTitleinformation returned as promise
     */;
    _proto.getTitleInfoFromPath = function getTitleInfoFromPath(sPath) {
      const oTitleHierarchyCache = this._getTitleHierarchyCache();
      if (oTitleHierarchyCache[sPath]) {
        // The title info is already stored in the cache
        return Promise.resolve(oTitleHierarchyCache[sPath]);
      }
      const oMetaModel = this.getAppComponent().getMetaModel();
      const sEntityPath = oMetaModel.getMetaPath(sPath);
      const sTypeName = oMetaModel.getObject(`${sEntityPath}/@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName`);
      const sAppSpecificHash = this._getAppSpecificHash();
      const sIntent = sAppSpecificHash + sPath.slice(1);
      return this._fetchTitleValue(sPath).then(sTitle => {
        const oTitleInfo = this._computeTitleInfo(sTypeName, sTitle, sIntent);
        oTitleHierarchyCache[sPath] = oTitleInfo;
        return oTitleInfo;
      });
    }

    /**
     * Ensure that the ushell service receives all elements
     * (title, subtitle, intent, icon) as strings.
     *
     * Annotation HeaderInfo allows for binding of title and description
     * (which are used here as title and subtitle) to any element in the entity
     * (being possibly types like boolean, timestamp, double, etc.)
     *
     * Creates a new hierarchy and converts non-string types to string.
     *
     * @param aHierarchy Shell title hierarchy
     * @returns Copy of shell title hierarchy containing all elements as strings
     */;
    _proto._ensureHierarchyElementsAreStrings = function _ensureHierarchyElementsAreStrings(aHierarchy) {
      const aHierarchyShell = [];
      for (const level in aHierarchy) {
        const oHierarchy = aHierarchy[level];
        const oShellHierarchy = {};
        for (const key in oHierarchy) {
          oShellHierarchy[key] = typeof oHierarchy[key] !== "string" ? String(oHierarchy[key]) : oHierarchy[key];
        }
        aHierarchyShell.push(oShellHierarchy);
      }
      return aHierarchyShell;
    };
    _proto._getTargetTypeFromHash = function _getTargetTypeFromHash(sHash) {
      var _oAppComponent$getMan;
      const oAppComponent = this.getAppComponent();
      let sTargetType = "";
      const aRoutes = ((_oAppComponent$getMan = oAppComponent.getManifestEntry("sap.ui5").routing) === null || _oAppComponent$getMan === void 0 ? void 0 : _oAppComponent$getMan.routes) ?? [];
      for (const route of aRoutes) {
        const oRoute = oAppComponent.getRouter().getRoute(route.name);
        if (oRoute !== null && oRoute !== void 0 && oRoute.match(sHash)) {
          const sTarget = Array.isArray(route.target) ? route.target[0] : route.target;
          sTargetType = oAppComponent.getRouter().getTarget(sTarget)._oOptions.name;
          break;
        }
      }
      return sTargetType;
    }

    /**
     * This function updates the shell title after each navigation.
     *
     * @param oView The current view
     * @returns A Promise that is resolved when the menu is filled properly
     */;
    _proto._computeTitleHierarchy = function _computeTitleHierarchy(oView) {
      const oAppComponent = this.getAppComponent(),
        oContext = oView.getBindingContext(),
        oCurrentPage = oView.getParent(),
        aTitleInformationPromises = [],
        sAppSpecificHash = this._getAppSpecificHash(),
        manifestAppSettings = oAppComponent.getManifestEntry("sap.app"),
        sAppTitle = manifestAppSettings.title || "",
        sAppSubTitle = manifestAppSettings.subTitle || "",
        appIcon = manifestAppSettings.icon || "";
      let oPageTitleInformation, sNewPath;
      if (oCurrentPage && oCurrentPage._getPageTitleInformation) {
        if (oContext) {
          // If the first page of the application is a LR, use the title and subtitle from the manifest
          if (this._getTargetTypeFromHash("") === "sap.fe.templates.ListReport") {
            aTitleInformationPromises.push(Promise.resolve(this._computeTitleInfo(sAppTitle, sAppSubTitle, sAppSpecificHash, appIcon)));
          }

          // Then manage other pages
          sNewPath = oContext.getPath();
          const aPathParts = sNewPath.split("/");
          let sPath = "";
          aPathParts.shift(); // Remove the first segment (empty string) as it has been managed above
          aPathParts.pop(); // Remove the last segment as it corresponds to the current page and shouldn't appear in the menu

          aPathParts.forEach(sPathPart => {
            sPath += `/${sPathPart}`;
            const oMetaModel = oAppComponent.getMetaModel(),
              sParameterPath = oMetaModel.getMetaPath(sPath),
              bIsParameterized = oMetaModel.getObject(`${sParameterPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
            if (!bIsParameterized) {
              aTitleInformationPromises.push(this.getTitleInfoFromPath(sPath));
            }
          });
        }

        // Current page
        oPageTitleInformation = oCurrentPage._getPageTitleInformation();
        oPageTitleInformation = this._computeTitleInfo(oPageTitleInformation.title, oPageTitleInformation.subtitle, sAppSpecificHash + this._getHash());
        if (oContext) {
          this._getTitleHierarchyCache()[sNewPath] = oPageTitleInformation;
        } else {
          this._getTitleHierarchyCache()[sAppSpecificHash] = oPageTitleInformation;
        }
      } else {
        aTitleInformationPromises.push(Promise.reject("Title information missing in HeaderInfo"));
      }
      return Promise.all(aTitleInformationPromises).then(aTitleInfoHierarchy => {
        // workaround for shell which is expecting all elements being of type string
        const aTitleInfoHierarchyShell = this._ensureHierarchyElementsAreStrings(aTitleInfoHierarchy),
          sTitle = oPageTitleInformation.title;
        aTitleInfoHierarchyShell.reverse();
        oAppComponent.getShellServices().setHierarchy(aTitleInfoHierarchyShell);
        this._setShellMenuTitle(oAppComponent, sTitle, sAppTitle);
      }).catch(function (sErrorMessage) {
        Log.error(sErrorMessage);
      }).finally(() => {
        this.bIsComputingTitleHierachy = false;
      }).catch(function (sErrorMessage) {
        Log.error(sErrorMessage);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.calculateLayout = function calculateLayout(iNextFCLLevel, sHash, sProposedLayout) {
      let keepCurrentLayout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      return "";
    }

    /**
     * Callback after a view has been bound to a context.
     *
     * @param oContext The context that has been bound to a view
     */;
    _proto.onContextBoundToView = function onContextBoundToView(oContext) {
      if (oContext) {
        const sDeepestPath = this.getView().getModel("internal").getProperty("/deepestPath"),
          sViewContextPath = oContext.getPath();
        if (!sDeepestPath || sDeepestPath.indexOf(sViewContextPath) !== 0) {
          // There was no previous value for the deepest reached path, or the path
          // for the view isn't a subpath of the previous deepest path --> update
          this.getView().getModel("internal").setProperty("/deepestPath", sViewContextPath, undefined, true);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.displayErrorPage = function displayErrorPage(sErrorMessage, mParameters) {
      // To be overridden
      return Promise.resolve(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.updateUIStateForView = function updateUIStateForView(oView, FCLLevel) {
      // To be overriden
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.getInstancedViews = function getInstancedViews() {
      return [];
      // To be overriden
    };
    _proto._scrollTablesToLastNavigatedItems = function _scrollTablesToLastNavigatedItems() {
      // To be overriden
    };
    _proto.isFclEnabled = function isFclEnabled() {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto._setShellMenuTitle = function _setShellMenuTitle(oAppComponent, sTitle, sAppTitle) {
      // To be overriden by FclController
      oAppComponent.getShellServices().setTitle(sTitle);
    };
    _proto.getAppContentContainer = function getAppContentContainer() {
      var _oAppComponent$getMan2, _oAppComponent$getMan3;
      const oAppComponent = this.getAppComponent();
      const appContentId = ((_oAppComponent$getMan2 = oAppComponent.getManifestEntry("sap.ui5").routing) === null || _oAppComponent$getMan2 === void 0 ? void 0 : (_oAppComponent$getMan3 = _oAppComponent$getMan2.config) === null || _oAppComponent$getMan3 === void 0 ? void 0 : _oAppComponent$getMan3.controlId) ?? "appContent";
      return this.getView().byId(appContentId);
    };
    return RootViewBaseController;
  }(BaseController), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "oPlaceholder", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "viewState", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return RootViewBaseController;
}, false);
