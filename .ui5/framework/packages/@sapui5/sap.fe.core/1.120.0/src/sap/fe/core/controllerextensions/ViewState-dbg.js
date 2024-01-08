/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/navigation/library", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "sap/ui/fl/apply/api/ControlVariantApplyAPI", "sap/ui/mdc/p13n/StateUtil"], function (Log, mergeObjects, CommonUtils, ClassSupport, KeepAliveHelper, ModelHelper, NavLibrary, ControllerExtension, OverrideExecution, ControlVariantApplyAPI, StateUtil) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  // additionalStates are stored next to control IDs, so name clash avoidance needed. Fortunately IDs have restrictions:
  // "Allowed is a sequence of characters (capital/lowercase), digits, underscores, dashes, points and/or colons."
  // Therefore adding a symbol like # or @
  const NavType = NavLibrary.NavType;

  /**
   * Definition of a custom action to be used inside the table toolbar
   *
   * @public
   */

  const ADDITIONAL_STATES_KEY = "#additionalStates";
  ///////////////////////////////////////////////////////////////////
  // methods to retrieve & apply states for the different controls //
  ///////////////////////////////////////////////////////////////////

  const _mControlStateHandlerMap = {
    "sap.ui.fl.variants.VariantManagement": {
      retrieve: function (oVM) {
        return {
          variantId: oVM.getCurrentVariantKey()
        };
      },
      apply: async function (oVM, controlState) {
        try {
          if (controlState && controlState.variantId !== undefined && controlState.variantId !== oVM.getCurrentVariantKey()) {
            const isVariantIdAvailable = this._checkIfVariantIdIsAvailable(oVM, controlState.variantId);
            let sVariantReference;
            if (isVariantIdAvailable) {
              sVariantReference = controlState.variantId;
            } else {
              sVariantReference = oVM.getStandardVariantKey();
              this.controlsVariantIdUnavailable.push(...oVM.getFor());
            }
            try {
              await ControlVariantApplyAPI.activateVariant({
                element: oVM,
                variantReference: sVariantReference
              });
              await this._setInitialStatesForDeltaCompute(oVM);
            } catch (error) {
              Log.error(error);
              this.invalidateInitialStateForApply.push(...oVM.getFor());
              await this._setInitialStatesForDeltaCompute(oVM);
            }
          } else {
            this._setInitialStatesForDeltaCompute(oVM);
          }
        } catch (error) {
          Log.error(error);
        }
      }
    },
    "sap.m.IconTabBar": {
      retrieve: function (oTabBar) {
        return {
          selectedKey: oTabBar.getSelectedKey()
        };
      },
      apply: function (oTabBar, oControlState) {
        if (oControlState && oControlState.selectedKey) {
          const oSelectedItem = oTabBar.getItems().find(function (oItem) {
            return oItem.getKey() === oControlState.selectedKey;
          });
          if (oSelectedItem) {
            oTabBar.setSelectedItem(oSelectedItem);
          }
        }
      }
    },
    "sap.ui.mdc.FilterBar": {
      retrieve: async function (filterBar) {
        const controlStateKey = this.getStateKey(filterBar);
        const filterBarState = await StateUtil.retrieveExternalState(filterBar);
        // remove sensitive or view state irrelevant fields
        const propertiesInfo = filterBar.getPropertyInfoSet();
        const filter = filterBarState.filter || {};
        propertiesInfo.filter(function (propertyInfo) {
          return Object.keys(filter).length > 0 && propertyInfo.path && filter[propertyInfo.path] && (propertyInfo.removeFromAppState || filter[propertyInfo.path].length === 0);
        }).forEach(function (PropertyInfo) {
          if (PropertyInfo.path) {
            delete filter[PropertyInfo.path];
          }
        });
        return this._getControlState(controlStateKey, filterBarState);
      },
      apply: async function (filterBar, controlState, navParameter, skipMerge) {
        try {
          if (controlState) {
            const isInitialStateApplicable = this._isInitialStatesApplicable(controlState === null || controlState === void 0 ? void 0 : controlState.initialState, filterBar, skipMerge);
            const navigationType = navParameter.navigationType;
            //When navigation type is hybrid, we override the filter conditions in IAppState with SV received from XappState
            if (navigationType === NavType.hybrid && controlState.fullState !== undefined) {
              const filterBarAPI = filterBar.getParent(),
                xAppStateFilters = await filterBarAPI.convertSelectionVariantToStateFilters(navParameter.selectionVariant);
              const mergedFullState = {
                ...controlState.fullState,
                filter: {
                  ...controlState.fullState.filter,
                  ...xAppStateFilters
                }
              };
              //when navigating from card, remove all existing filters values (default or otherwise) and then apply the state
              await filterBar.getParent()._clearFilterValuesWithOptions(filterBar, {
                clearEditFilter: true
              });
              return StateUtil.applyExternalState(filterBar, mergedFullState);
            }
            if (isInitialStateApplicable) {
              const diffState = await StateUtil.diffState(filterBar, controlState.initialState, controlState.fullState);
              return StateUtil.applyExternalState(filterBar, diffState);
            } else if (skipMerge) {
              //skipMerge is true when coming from the dynamic tile, in this case, remove all existing filters values (default or otherwise)
              await filterBar.getParent()._clearFilterValuesWithOptions(filterBar, {
                clearEditFilter: true
              });
            }
            return StateUtil.applyExternalState(filterBar, (controlState === null || controlState === void 0 ? void 0 : controlState.fullState) ?? controlState);
          }
        } catch (error) {
          Log.error(error);
        }
      }
    },
    "sap.ui.mdc.Table": {
      retrieve: async function (table) {
        const controlStateKey = this.getStateKey(table);
        const tableState = await StateUtil.retrieveExternalState(table);
        return this._getControlState(controlStateKey, tableState);
      },
      apply: async function (table, controlState, navParameters, skipMerge) {
        try {
          if (controlState) {
            // Extra condition added to apply the diff state logic for mdc control
            const isInitialStateApplicable = this._isInitialStatesApplicable(controlState === null || controlState === void 0 ? void 0 : controlState.initialState, table, skipMerge, navParameters.navigationType !== NavType.hybrid);
            if (isInitialStateApplicable) {
              var _controlState$initial;
              if (controlState.initialState && !((_controlState$initial = controlState.initialState) !== null && _controlState$initial !== void 0 && _controlState$initial.supplementaryConfig)) {
                controlState.initialState.supplementaryConfig = {};
              }
              const oDiffState = await StateUtil.diffState(table, controlState.initialState, controlState.fullState);
              return StateUtil.applyExternalState(table, oDiffState);
            } else {
              if (!controlState.supplementaryConfig) {
                controlState.supplementaryConfig = {};
              }
              return StateUtil.applyExternalState(table, (controlState === null || controlState === void 0 ? void 0 : controlState.fullState) ?? controlState);
            }
          }
        } catch (error) {
          Log.error(error);
        }
      },
      refreshBinding: function (oTable) {
        const oTableBinding = oTable.getRowBinding();
        if (oTableBinding) {
          const oRootBinding = oTableBinding.getRootBinding();
          if (oRootBinding === oTableBinding) {
            // absolute binding
            oTableBinding.refresh();
          } else {
            // relative binding
            const oHeaderContext = oTableBinding.getHeaderContext();
            const sGroupId = oTableBinding.getGroupId();
            if (oHeaderContext) {
              oHeaderContext.requestSideEffects([{
                $NavigationPropertyPath: ""
              }], sGroupId);
            }
          }
        } else {
          Log.info(`Table: ${oTable.getId()} was not refreshed. No binding found!`);
        }
      }
    },
    "sap.ui.mdc.Chart": {
      retrieve: function (oChart) {
        return StateUtil.retrieveExternalState(oChart);
      },
      apply: function (oChart, oControlState) {
        if (oControlState) {
          return StateUtil.applyExternalState(oChart, oControlState);
        }
      }
      // TODO: uncomment after mdc fix is merged
      /* retrieve: async function (chart: Chart) {
      	const controlStateKey = this.getStateKey(chart);
      	const chartState = await StateUtil.retrieveExternalState(chart);
      		return this._getControlState(controlStateKey, chartState);
      },
      apply: async function (chart: Chart, controlState: ControlState) {
      	try {
      		if (controlState) {
      			// Extra condition added to apply the diff state logic for mdc control
      			const isInitialStateApplicable = controlState?.initialState && this.invalidateInitialStateForApply.indexOf(chart.getId()) === -1 && this.controlsVariantIdUnavailable.indexOf(chart.getId()) === -1;
      				if (isInitialStateApplicable) {
      				const diffState = await StateUtil.diffState(
      					chart,
      					controlState.initialState as object,
      					controlState.fullState as object
      				);
      				return await StateUtil.applyExternalState(chart, diffState);
      			} else {
      				return await StateUtil.applyExternalState(chart, controlState?.fullState ?? controlState);
      			}
      		}
      	} catch (error) {
      		Log.error(error as string);
      	}
      } */
    },

    "sap.uxap.ObjectPageLayout": {
      retrieve: function (oOPLayout) {
        return {
          selectedSection: oOPLayout.getSelectedSection()
        };
      },
      apply: function (oOPLayout, oControlState) {
        if (oControlState) {
          oOPLayout.setSelectedSection(oControlState.selectedSection);
        }
      },
      refreshBinding: function (oOPLayout) {
        const oBindingContext = oOPLayout.getBindingContext();
        const oBinding = oBindingContext && oBindingContext.getBinding();
        if (oBinding) {
          const sMetaPath = ModelHelper.getMetaPathForContext(oBindingContext);
          const sStrategy = KeepAliveHelper.getControlRefreshStrategyForContextPath(oOPLayout, sMetaPath);
          if (sStrategy === "self") {
            // Refresh main context and 1-1 navigation properties or OP
            const oModel = oBindingContext.getModel(),
              oMetaModel = oModel.getMetaModel(),
              oNavigationProperties = CommonUtils.getContextPathProperties(oMetaModel, sMetaPath, {
                $kind: "NavigationProperty"
              }) || {},
              aNavPropertiesToRequest = Object.keys(oNavigationProperties).reduce(function (aPrev, sNavProp) {
                if (oNavigationProperties[sNavProp].$isCollection !== true) {
                  aPrev.push({
                    $NavigationPropertyPath: sNavProp
                  });
                }
                return aPrev;
              }, []),
              aProperties = [{
                $PropertyPath: "*"
              }],
              sGroupId = oBinding.getGroupId();
            oBindingContext.requestSideEffects(aProperties.concat(aNavPropertiesToRequest), sGroupId);
          } else if (sStrategy === "includingDependents") {
            // Complete refresh
            oBinding.refresh();
          }
        } else {
          Log.info(`ObjectPage: ${oOPLayout.getId()} was not refreshed. No binding found!`);
        }
      }
    },
    "sap.m.SegmentedButton": {
      retrieve: function (oSegmentedButton) {
        return {
          selectedKey: oSegmentedButton.getSelectedKey()
        };
      },
      apply: function (oSegmentedButton, oControlState) {
        if (oControlState !== null && oControlState !== void 0 && oControlState.selectedKey && oControlState.selectedKey !== oSegmentedButton.getSelectedKey()) {
          var _oSegmentedButton$get;
          oSegmentedButton.setSelectedKey(oControlState.selectedKey);
          if ((_oSegmentedButton$get = oSegmentedButton.getParent()) !== null && _oSegmentedButton$get !== void 0 && _oSegmentedButton$get.isA("sap.ui.mdc.ActionToolbar")) {
            oSegmentedButton.fireEvent("selectionChange");
          }
        }
      }
    },
    "sap.m.Select": {
      retrieve: function (oSelect) {
        return {
          selectedKey: oSelect.getSelectedKey()
        };
      },
      apply: function (oSelect, oControlState) {
        if (oControlState !== null && oControlState !== void 0 && oControlState.selectedKey && oControlState.selectedKey !== oSelect.getSelectedKey()) {
          var _oSelect$getParent;
          oSelect.setSelectedKey(oControlState.selectedKey);
          if ((_oSelect$getParent = oSelect.getParent()) !== null && _oSelect$getParent !== void 0 && _oSelect$getParent.isA("sap.ui.mdc.ActionToolbar")) {
            oSelect.fireEvent("change");
          }
        }
      }
    },
    "sap.f.DynamicPage": {
      retrieve: function (oDynamicPage) {
        return {
          headerExpanded: oDynamicPage.getHeaderExpanded()
        };
      },
      apply: function (oDynamicPage, oControlState) {
        if (oControlState) {
          oDynamicPage.setHeaderExpanded(oControlState.headerExpanded);
        }
      }
    },
    "sap.ui.core.mvc.View": {
      retrieve: function (oView) {
        const oController = oView.getController();
        if (oController && oController.viewState) {
          return oController.viewState.retrieveViewState(oController.viewState);
        }
        return {};
      },
      apply: function (oView, oControlState, oNavParameters, skipMerge) {
        const oController = oView.getController();
        if (oController && oController.viewState) {
          return oController.viewState.applyViewState(oControlState, oNavParameters, skipMerge);
        }
      },
      refreshBinding: function (oView) {
        const oController = oView.getController();
        if (oController && oController.viewState) {
          return oController.viewState.refreshViewBindings();
        }
      }
    },
    "sap.ui.core.ComponentContainer": {
      retrieve: function (oComponentContainer) {
        const oComponent = oComponentContainer.getComponentInstance();
        if (oComponent) {
          return this.retrieveControlState(oComponent.getRootControl());
        }
        return {};
      },
      apply: function (oComponentContainer, oControlState, oNavParameters) {
        const oComponent = oComponentContainer.getComponentInstance();
        if (oComponent) {
          return this.applyControlState(oComponent.getRootControl(), oControlState, oNavParameters);
        }
      }
    },
    "sap.sac.df.changeHandler.MultiDimModelChangeHandler": {
      retrieve: function (control) {
        return control._getMultiDimModel().serialize("INA_REPOSITORY_DELTA");
      },
      apply: function (control, controlState) {
        if (controlState) {
          return control._getMultiDimModel().deserialize(controlState, "INA_REPOSITORY_DELTA");
        }
      }
    }
  };
  /**
   * A controller extension offering hooks for state handling
   *
   * If you need to maintain a specific state for your application, you can use the controller extension.
   *
   * @hideconstructor
   * @public
   * @since 1.85.0
   */
  let ViewState = (_dec = defineUI5Class("sap.fe.core.controllerextensions.ViewState"), _dec2 = publicExtension(), _dec3 = finalExtension(), _dec4 = publicExtension(), _dec5 = extensible(OverrideExecution.After), _dec6 = privateExtension(), _dec7 = finalExtension(), _dec8 = privateExtension(), _dec9 = finalExtension(), _dec10 = publicExtension(), _dec11 = extensible(OverrideExecution.After), _dec12 = publicExtension(), _dec13 = extensible(OverrideExecution.After), _dec14 = publicExtension(), _dec15 = extensible(OverrideExecution.After), _dec16 = privateExtension(), _dec17 = finalExtension(), _dec18 = publicExtension(), _dec19 = extensible(OverrideExecution.After), _dec20 = privateExtension(), _dec21 = finalExtension(), _dec22 = publicExtension(), _dec23 = extensible(OverrideExecution.After), _dec24 = publicExtension(), _dec25 = finalExtension(), _dec26 = publicExtension(), _dec27 = finalExtension(), _dec28 = publicExtension(), _dec29 = extensible(OverrideExecution.After), _dec30 = privateExtension(), _dec31 = finalExtension(), _dec32 = publicExtension(), _dec33 = extensible(OverrideExecution.Instead), _dec34 = publicExtension(), _dec35 = finalExtension(), _dec36 = privateExtension(), _dec37 = publicExtension(), _dec38 = extensible(OverrideExecution.After), _dec39 = publicExtension(), _dec40 = extensible(OverrideExecution.After), _dec41 = publicExtension(), _dec42 = extensible(OverrideExecution.After), _dec43 = privateExtension(), _dec44 = publicExtension(), _dec45 = extensible(OverrideExecution.After), _dec46 = privateExtension(), _dec47 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(ViewState, _ControllerExtension);
    /**
     * Constructor.
     */
    function ViewState() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.initialControlStatesMapper = {};
      _this.controlsVariantIdUnavailable = [];
      _this.invalidateInitialStateForApply = [];
      _this.viewStateControls = [];
      _this._setInitialStatesForDeltaCompute = async variantManagement => {
        try {
          const adaptControls = _this.viewStateControls;
          const externalStatePromises = [];
          const controlStateKey = [];
          let initialControlStates = [];
          const variantControls = (variantManagement === null || variantManagement === void 0 ? void 0 : variantManagement.getFor()) ?? [];
          adaptControls.filter(function (control) {
            return control && (!variantManagement || variantControls.includes(control.getId())) && (control.isA("sap.ui.mdc.Table") || control.isA("sap.ui.mdc.FilterBar") || control.isA("sap.ui.mdc.Chart"));
          }).forEach(control => {
            if (variantManagement) {
              _this._addEventListenersToVariantManagement(variantManagement, variantControls);
            }
            const externalStatePromise = StateUtil.retrieveExternalState(control);
            externalStatePromises.push(externalStatePromise);
            controlStateKey.push(_this.getStateKey(control));
          });
          initialControlStates = await Promise.all(externalStatePromises);
          initialControlStates.forEach((initialControlState, i) => {
            _this.initialControlStatesMapper[controlStateKey[i]] = initialControlState;
          });
        } catch (e) {
          Log.error(e);
        }
      };
      _this._iRetrievingStateCounter = 0;
      _this._pInitialStateApplied = new Promise(resolve => {
        _this._pInitialStateAppliedResolve = resolve;
      });
      return _this;
    }
    var _proto = ViewState.prototype;
    _proto.refreshViewBindings = async function refreshViewBindings() {
      const aControls = await this.collectResults(this.base.viewState.adaptBindingRefreshControls);
      let oPromiseChain = Promise.resolve();
      aControls.filter(oControl => {
        return oControl && oControl.isA && oControl.isA("sap.ui.base.ManagedObject");
      }).forEach(oControl => {
        oPromiseChain = oPromiseChain.then(this.refreshControlBinding.bind(this, oControl));
      });
      return oPromiseChain;
    }

    /**
     * This function should add all controls relevant for refreshing to the provided control array.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param aCollectedControls The collected controls
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptBindingRefreshControls = function adaptBindingRefreshControls(aCollectedControls) {
      // to be overriden
    };
    _proto.refreshControlBinding = function refreshControlBinding(oControl) {
      const oControlRefreshBindingHandler = this.getControlRefreshBindingHandler(oControl);
      let oPromiseChain = Promise.resolve();
      if (typeof oControlRefreshBindingHandler.refreshBinding !== "function") {
        Log.info(`refreshBinding handler for control: ${oControl.getMetadata().getName()} is not provided`);
      } else {
        oPromiseChain = oPromiseChain.then(oControlRefreshBindingHandler.refreshBinding.bind(this, oControl));
      }
      return oPromiseChain;
    }

    /**
     * Returns a map of <code>refreshBinding</code> function for a certain control.
     *
     * @param oControl The control to get state handler for
     * @returns A plain object with one function: <code>refreshBinding</code>
     */;
    _proto.getControlRefreshBindingHandler = function getControlRefreshBindingHandler(oControl) {
      const oRefreshBindingHandler = {};
      if (oControl) {
        for (const sType in _mControlStateHandlerMap) {
          if (oControl.isA(sType)) {
            // pass only the refreshBinding handler in an object so that :
            // 1. Application has access only to refreshBinding and not apply and reterive at this stage
            // 2. Application modifications to the object will be reflected here (as we pass by reference)
            oRefreshBindingHandler["refreshBinding"] = _mControlStateHandlerMap[sType].refreshBinding || {};
            break;
          }
        }
      }
      this.base.viewState.adaptBindingRefreshHandler(oControl, oRefreshBindingHandler);
      return oRefreshBindingHandler;
    }

    /**
     * Customize the <code>refreshBinding</code> function for a certain control.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oControl The control for which the refresh handler is adapted.
     * @param oControlHandler A plain object which can have one function: <code>refreshBinding</code>
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptBindingRefreshHandler = function adaptBindingRefreshHandler(oControl, oControlHandler) {
      // to be overriden
    }

    /**
     * Called when the application is suspended due to keep-alive mode.
     *
     * @public
     */;
    _proto.onSuspend = function onSuspend() {
      // to be overriden
    }

    /**
     * Called when the application is restored due to keep-alive mode.
     *
     * @public
     */;
    _proto.onRestore = function onRestore() {
      // to be overriden
    }

    /**
     * Destructor method for objects.
     */;
    _proto.destroy = function destroy() {
      delete this._pInitialStateAppliedResolve;
      _ControllerExtension.prototype.destroy.call(this);
    }

    /**
     * Helper function to enable multi override. It is adding an additional parameter (array) to the provided
     * function (and its parameters), that will be evaluated via <code>Promise.all</code>.
     *
     * @param fnCall The function to be called
     * @param args
     * @returns A promise to be resolved with the result of all overrides
     */;
    _proto.collectResults = function collectResults(fnCall) {
      const aResults = [];
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      args.push(aResults);
      fnCall.apply(this, args);
      return Promise.all(aResults);
    }

    /**
     * Customize the <code>retrieve</code> and <code>apply</code> functions for a certain control.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oControl The control to get state handler for
     * @param aControlHandler A list of plain objects with two functions: <code>retrieve</code> and <code>apply</code>
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptControlStateHandler = function adaptControlStateHandler(oControl, aControlHandler) {
      // to be overridden if needed
    }

    /**
     * Returns a map of <code>retrieve</code> and <code>apply</code> functions for a certain control.
     *
     * @param oControl The control to get state handler for
     * @returns A plain object with two functions: <code>retrieve</code> and <code>apply</code>
     */;
    _proto.getControlStateHandler = function getControlStateHandler(oControl) {
      const aInternalControlStateHandler = [],
        aCustomControlStateHandler = [];
      if (oControl) {
        for (const sType in _mControlStateHandlerMap) {
          if (oControl.isA(sType)) {
            // avoid direct manipulation of internal _mControlStateHandlerMap
            aInternalControlStateHandler.push(Object.assign({}, _mControlStateHandlerMap[sType]));
            break;
          }
        }
      }
      this.base.viewState.adaptControlStateHandler(oControl, aCustomControlStateHandler);
      return aInternalControlStateHandler.concat(aCustomControlStateHandler);
    }

    /**
     * This function should add all controls for given view that should be considered for the state handling to the provided control array.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param aCollectedControls The collected controls
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adaptStateControls = function adaptStateControls(aCollectedControls) {
      // to be overridden if needed
    }

    /**
     * Returns the key to be used for given control.
     *
     * @param oControl The control to get state key for
     * @returns The key to be used for storing the controls state
     */;
    _proto.getStateKey = function getStateKey(oControl) {
      return this.getView().getLocalId(oControl.getId()) || oControl.getId();
    }

    /**
     * Retrieve the view state of this extensions view.
     * When this function is called more than once before finishing, all but the final response will resolve to <code>undefined</code>.
     *
     * @returns A promise resolving the view state
     * @public
     */;
    _proto.retrieveViewState = async function retrieveViewState() {
      ++this._iRetrievingStateCounter;
      let oViewState;
      try {
        await this._pInitialStateApplied;
        const aControls = await this.collectResults(this.base.viewState.adaptStateControls);
        const aResolvedStates = await Promise.all(aControls.filter(function (oControl) {
          return oControl && oControl.isA && oControl.isA("sap.ui.base.ManagedObject");
        }).map(oControl => {
          return this.retrieveControlState(oControl).then(vResult => {
            return {
              key: this.getStateKey(oControl),
              value: vResult
            };
          });
        }));
        oViewState = aResolvedStates.reduce(function (oStates, mState) {
          const oCurrentState = {};
          oCurrentState[mState.key] = mState.value;
          return mergeObjects(oStates, oCurrentState);
        }, {});
        const mAdditionalStates = await Promise.resolve(this._retrieveAdditionalStates());
        if (mAdditionalStates && Object.keys(mAdditionalStates).length) {
          oViewState[ADDITIONAL_STATES_KEY] = mAdditionalStates;
        }
      } finally {
        --this._iRetrievingStateCounter;
      }
      return this._iRetrievingStateCounter === 0 ? oViewState : undefined;
    }

    /**
     * Extend the map of additional states (not control bound) to be added to the current view state of the given view.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param mAdditionalStates The additional state
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    retrieveAdditionalStates = function retrieveAdditionalStates(mAdditionalStates) {
      // to be overridden if needed
    }

    /**
     * Returns a map of additional states (not control bound) to be added to the current view state of the given view.
     *
     * @returns Additional view states
     */;
    _proto._retrieveAdditionalStates = function _retrieveAdditionalStates() {
      const mAdditionalStates = {};
      this.base.viewState.retrieveAdditionalStates(mAdditionalStates);
      return mAdditionalStates;
    }

    /**
     * Returns the current state for the given control.
     *
     * @param oControl The object to get the state for
     * @returns The state for the given control
     */;
    _proto.retrieveControlState = function retrieveControlState(oControl) {
      const aControlStateHandlers = this.getControlStateHandler(oControl);
      return Promise.all(aControlStateHandlers.map(mControlStateHandler => {
        if (typeof mControlStateHandler.retrieve !== "function") {
          throw new Error(`controlStateHandler.retrieve is not a function for control: ${oControl.getMetadata().getName()}`);
        }
        return mControlStateHandler.retrieve.call(this, oControl);
      })).then(aStates => {
        return aStates.reduce(function (oFinalState, oCurrentState) {
          return mergeObjects(oFinalState, oCurrentState);
        }, {});
      });
    }

    /**
     * Defines whether the view state should only be applied once initially.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.Instead}.
     *
     * Important:
     * You should only override this method for custom pages and not for the standard ListReportPage and ObjectPage!
     *
     * @returns If <code>true</code>, only the initial view state is applied once,
     * else any new view state is also applied on follow-up calls (default)
     * @protected
     */;
    _proto.applyInitialStateOnly = function applyInitialStateOnly() {
      return true;
    }

    /**
     * Applies the given view state to this extensions view.
     *
     * @param oViewState The view state to apply (can be undefined)
     * @param oNavParameter The current navigation parameter
     * @param oNavParameter.navigationType The actual navigation type
     * @param oNavParameter.selectionVariant The selectionVariant from the navigation
     * @param oNavParameter.selectionVariantDefaults The selectionVariant defaults from the navigation
     * @param oNavParameter.requiresStandardVariant Defines whether the standard variant must be used in variant management
     * @param skipMerge Boolean which determines to skip the key user shine through
     * @returns Promise for async state handling
     * @public
     */;
    _proto.applyViewState = async function applyViewState(oViewState, oNavParameter, skipMerge) {
      if (this.base.viewState.applyInitialStateOnly() && this._getInitialStateApplied()) {
        return;
      }
      try {
        await this.collectResults(this.base.viewState.onBeforeStateApplied, [], oNavParameter.navigationType);
        const aControls = await this.collectResults(this.base.viewState.adaptStateControls);
        this.viewStateControls = aControls;
        let oPromiseChain = Promise.resolve();
        let hasVariantManagement = false;
        /**
         * this ensures that variantManagement control is applied first to calculate initial state for delta logic
         */
        const sortedAdaptStateControls = aControls.reduce((modifiedControls, control) => {
          if (!control) {
            return modifiedControls;
          }
          const isVariantManagementControl = control.isA("sap.ui.fl.variants.VariantManagement");
          if (!hasVariantManagement) {
            hasVariantManagement = isVariantManagementControl;
          }
          modifiedControls = isVariantManagementControl ? [control, ...modifiedControls] : [...modifiedControls, control];
          return modifiedControls;
        }, []);

        // In case of no Variant Management, this ensures that initial states is set
        if (!hasVariantManagement) {
          this._setInitialStatesForDeltaCompute();
        }
        sortedAdaptStateControls.filter(function (oControl) {
          return oControl.isA("sap.ui.base.ManagedObject");
        }).forEach(oControl => {
          const sKey = this.getStateKey(oControl);
          oPromiseChain = oPromiseChain.then(this.applyControlState.bind(this, oControl, oViewState ? oViewState[sKey] : undefined, oNavParameter, skipMerge ?? false));
        });
        await oPromiseChain;
        if (oNavParameter.navigationType === NavType.iAppState || oNavParameter.navigationType === NavType.hybrid) {
          await this.collectResults(this.base.viewState.applyAdditionalStates, oViewState ? oViewState[ADDITIONAL_STATES_KEY] : undefined);
        } else {
          await this.collectResults(this.base.viewState.applyNavigationParameters, oNavParameter);
          await this.collectResults(this.base.viewState._applyNavigationParametersToFilterbar, oNavParameter);
        }
      } finally {
        try {
          await this.collectResults(this.base.viewState.onAfterStateApplied);
          this._setInitialStateApplied();
        } catch (e) {
          Log.error(e);
        }
      }
    };
    _proto._checkIfVariantIdIsAvailable = function _checkIfVariantIdIsAvailable(oVM, sVariantId) {
      const aVariants = oVM.getVariants();
      let bIsControlStateVariantAvailable = false;
      aVariants.forEach(function (oVariant) {
        if (oVariant.key === sVariantId) {
          bIsControlStateVariantAvailable = true;
        }
      });
      return bIsControlStateVariantAvailable;
    };
    _proto._setInitialStateApplied = function _setInitialStateApplied() {
      if (this._pInitialStateAppliedResolve) {
        const pInitialStateAppliedResolve = this._pInitialStateAppliedResolve;
        delete this._pInitialStateAppliedResolve;
        pInitialStateAppliedResolve();
      }
    };
    _proto._getInitialStateApplied = function _getInitialStateApplied() {
      return !this._pInitialStateAppliedResolve;
    }

    /**
     * Hook to react before a state for given view is applied.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @param navigationType Navigation type responsible for the applying the state
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeforeStateApplied = function onBeforeStateApplied(aPromises, navigationType) {
      // to be overriden
    }

    /**
     * Hook to react when state for given view was applied.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterStateApplied = function onAfterStateApplied(aPromises) {
      // to be overriden
    }

    /**
     * Applying additional, not control related, states - is called only if navigation type is iAppState.
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oViewState The current view state
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    applyAdditionalStates = function applyAdditionalStates(oViewState, aPromises) {
      // to be overridden if needed
    };
    _proto._applyNavigationParametersToFilterbar = function _applyNavigationParametersToFilterbar(_oNavParameter, _aPromises) {
      // to be overridden if needed
    }

    /**
     * Apply navigation parameters is not called if the navigation type is iAppState
     *
     * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
     * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
     *
     * @param oNavParameter The current navigation parameter
     * @param oNavParameter.navigationType The actual navigation type
     * @param [oNavParameter.selectionVariant] The selectionVariant from the navigation
     * @param [oNavParameter.selectionVariantDefaults] The selectionVariant defaults from the navigation
     * @param [oNavParameter.requiresStandardVariant] Defines whether the standard variant must be used in variant management
     * @param aPromises Extensible array of promises to be resolved before continuing
     * @protected
     */;
    _proto.applyNavigationParameters = function applyNavigationParameters(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    oNavParameter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    aPromises) {
      // to be overridden if needed
    }

    /**
     * Applying the given state to the given control.
     *
     * @param oControl The object to apply the given state
     * @param oControlState The state for the given control
     * @param [oNavParameters] The current navigation parameters
     * @returns Return a promise for async state handling
     */;
    _proto.applyControlState = async function applyControlState(oControl, oControlState, oNavParameters, skipMerge) {
      const aControlStateHandlers = this.getControlStateHandler(oControl);
      let oPromiseChain = Promise.resolve();
      aControlStateHandlers.forEach(mControlStateHandler => {
        if (typeof mControlStateHandler.apply !== "function") {
          throw new Error(`controlStateHandler.apply is not a function for control: ${oControl.getMetadata().getName()}`);
        }
        oPromiseChain = oPromiseChain.then(mControlStateHandler.apply.bind(this, oControl, oControlState, oNavParameters, skipMerge));
      });
      return oPromiseChain;
    };
    _proto.getInterface = function getInterface() {
      return this;
    }

    // method to get the control state for mdc controls applying the delta logic
    ;
    _proto._getControlState = function _getControlState(controlStateKey, controlState) {
      const initialControlStatesMapper = this.initialControlStatesMapper;
      if (Object.keys(initialControlStatesMapper).length > 0 && initialControlStatesMapper[controlStateKey]) {
        if (Object.keys(initialControlStatesMapper[controlStateKey]).length === 0) {
          initialControlStatesMapper[controlStateKey] = {
            ...controlState
          };
        }
        return {
          fullState: controlState,
          initialState: initialControlStatesMapper[controlStateKey]
        };
      }
      return controlState;
    }

    //method to store the initial states for delta computation of mdc controls
    ;
    // Attach event to save and select of Variant Management to update the initial Control States on variant change
    _proto._addEventListenersToVariantManagement = function _addEventListenersToVariantManagement(variantManagement, variantControls) {
      const oPayload = {
        variantManagedControls: variantControls
      };
      const fnEvent = () => {
        this._updateInitialStatesOnVariantChange(variantControls);
      };
      variantManagement.attachSave(oPayload, fnEvent, {});
      variantManagement.attachSelect(oPayload, fnEvent, {});
    };
    _proto._updateInitialStatesOnVariantChange = function _updateInitialStatesOnVariantChange(vmAssociatedControlsToReset) {
      const initialControlStatesMapper = this.initialControlStatesMapper;
      Object.keys(initialControlStatesMapper).forEach(controlKey => {
        for (const vmAssociatedcontrolKey of vmAssociatedControlsToReset) {
          if (vmAssociatedcontrolKey.includes(controlKey)) {
            initialControlStatesMapper[controlKey] = {};
          }
        }
      });
    };
    _proto._isInitialStatesApplicable = function _isInitialStatesApplicable(initialState, control, skipMerge, isNavHybrid) {
      return initialState && !this.invalidateInitialStateForApply.includes(control.getId()) && !this.controlsVariantIdUnavailable.includes(control.getId()) && (isNavHybrid ?? true) && skipMerge !== true;
    };
    return ViewState;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "refreshViewBindings", [_dec2, _dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "refreshViewBindings"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptBindingRefreshControls", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptBindingRefreshControls"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "refreshControlBinding", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "refreshControlBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getControlRefreshBindingHandler", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "getControlRefreshBindingHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptBindingRefreshHandler", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptBindingRefreshHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onSuspend", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "onSuspend"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRestore", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "onRestore"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "collectResults", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "collectResults"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptControlStateHandler", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptControlStateHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getControlStateHandler", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "getControlStateHandler"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptStateControls", [_dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptStateControls"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getStateKey", [_dec24, _dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "getStateKey"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveViewState", [_dec26, _dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveViewState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveAdditionalStates", [_dec28, _dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveAdditionalStates"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "retrieveControlState", [_dec30, _dec31], Object.getOwnPropertyDescriptor(_class2.prototype, "retrieveControlState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyInitialStateOnly", [_dec32, _dec33], Object.getOwnPropertyDescriptor(_class2.prototype, "applyInitialStateOnly"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyViewState", [_dec34, _dec35], Object.getOwnPropertyDescriptor(_class2.prototype, "applyViewState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_checkIfVariantIdIsAvailable", [_dec36], Object.getOwnPropertyDescriptor(_class2.prototype, "_checkIfVariantIdIsAvailable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeStateApplied", [_dec37, _dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeStateApplied"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterStateApplied", [_dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterStateApplied"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyAdditionalStates", [_dec41, _dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "applyAdditionalStates"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_applyNavigationParametersToFilterbar", [_dec43], Object.getOwnPropertyDescriptor(_class2.prototype, "_applyNavigationParametersToFilterbar"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyNavigationParameters", [_dec44, _dec45], Object.getOwnPropertyDescriptor(_class2.prototype, "applyNavigationParameters"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "applyControlState", [_dec46, _dec47], Object.getOwnPropertyDescriptor(_class2.prototype, "applyControlState"), _class2.prototype)), _class2)) || _class);
  return ViewState;
}, false);
