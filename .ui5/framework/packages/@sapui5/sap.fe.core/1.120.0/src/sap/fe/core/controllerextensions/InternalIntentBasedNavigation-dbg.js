/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/navigation/SelectionVariant", "sap/ui/core/Core", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../converters/helpers/Aggregation", "./editFlow/NotApplicableContextDialog"], function (Log, mergeObjects, CommonUtils, draft, MetaModelConverter, ClassSupport, FPMHelper, KeepAliveHelper, ModelHelper, ResourceModelHelper, SelectionVariant, Core, ControllerExtension, OverrideExecution, Aggregation, NotApplicableContextDialog) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _class, _class2;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var convertTypes = MetaModelConverter.convertTypes;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  /**
   * {@link sap.ui.core.mvc.ControllerExtension Controller extension}
   *
   * @since 1.84.0
   */
  let InternalIntentBasedNavigation = (_dec = defineUI5Class("sap.fe.core.controllerextensions.InternalInternalBasedNavigation"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec8 = extensible(OverrideExecution.Instead), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = privateExtension(), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec14 = publicExtension(), _dec15 = finalExtension(), _dec16 = publicExtension(), _dec17 = finalExtension(), _dec18 = publicExtension(), _dec19 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    _inheritsLoose(InternalIntentBasedNavigation, _ControllerExtension);
    function InternalIntentBasedNavigation() {
      return _ControllerExtension.apply(this, arguments) || this;
    }
    var _proto = InternalIntentBasedNavigation.prototype;
    _proto.onInit = function onInit() {
      this._oAppComponent = this.base.getAppComponent();
      this._oMetaModel = this._oAppComponent.getModel().getMetaModel();
      this._oNavigationService = this._oAppComponent.getNavigationService();
      this._oView = this.base.getView();
    }

    /**
     * Enables intent-based navigation (SemanticObject-Action) with the provided context.
     * If semantic object mapping is provided, this is also applied to the selection variant after the adaptation by a consumer.
     * This takes care of removing any technical parameters and determines if an explace or inplace navigation should take place.
     *
     * @param sSemanticObject Semantic object for the target app
     * @param sAction  Action for the target app
     * @param [mNavigationParameters] Optional parameters to be passed to the external navigation
     * @param [mNavigationParameters.navigationContexts] Uses one of the following to be passed to the intent:
     *    a single instance of {@link sap.ui.model.odata.v4.Context}
     *    multiple instances of {@link sap.ui.model.odata.v4.Context}
     *    an object or an array of objects
     *		  If an array of objects is passed, the context is used to determine the metaPath and to remove any sensitive data
     *		  If an array of objects is passed, the following format ix expected:
     *		  {
     *			data: {
     *	 			ProductID: 7634,
     *				Name: "Laptop"
     *			 },
     *			 metaPath: "/SalesOrderManage"
     *        }
     * @param [mNavigationParameters.semanticObjectMapping] String representation of the SemanticObjectMapping or SemanticObjectMapping that applies to this navigation
     * @param [mNavigationParameters.defaultRefreshStrategy] Default refresh strategy to be used in case no refresh strategy is specified for the intent in the view.
     * @param [mNavigationParameters.refreshStrategies]
     * @param [mNavigationParameters.additionalNavigationParameters] Additional navigation parameters configured in the crossAppNavigation outbound parameters.
     */;
    _proto.navigate = function navigate(semanticObject, action, navigationParameters) {
      const _doNavigate = oContext => {
        const vNavigationContexts = navigationParameters && navigationParameters.navigationContexts,
          aNavigationContexts = vNavigationContexts && !Array.isArray(vNavigationContexts) ? [vNavigationContexts] : vNavigationContexts,
          vSemanticObjectMapping = navigationParameters && navigationParameters.semanticObjectMapping,
          vOutboundParams = navigationParameters && navigationParameters.additionalNavigationParameters,
          oTargetInfo = {
            semanticObject: semanticObject,
            action: action
          },
          oView = this.base.getView(),
          oController = oView.getController();
        if (oContext) {
          this._oView.setBindingContext(oContext);
        }
        if (semanticObject && action) {
          let aSemanticAttributes = [],
            oSelectionVariant = new SelectionVariant();
          // 1. get SemanticAttributes for navigation
          if (aNavigationContexts && aNavigationContexts.length) {
            aNavigationContexts.forEach(oNavigationContext => {
              // 1.1.a if navigation context is instance of sap.ui.mode.odata.v4.Context
              // else check if navigation context is of type object
              if (oNavigationContext.isA && oNavigationContext.isA("sap.ui.model.odata.v4.Context")) {
                // 1.1.b remove sensitive data
                let oSemanticAttributes = oNavigationContext.getObject();
                const sMetaPath = this._oMetaModel.getMetaPath(oNavigationContext.getPath());
                // TODO: also remove sensitive data from  navigation properties
                oSemanticAttributes = this.removeSensitiveData(oSemanticAttributes, sMetaPath);
                const oNavContext = this.prepareContextForExternalNavigation(oSemanticAttributes, oNavigationContext);
                oTargetInfo["propertiesWithoutConflict"] = oNavContext.propertiesWithoutConflict;
                aSemanticAttributes.push(oNavContext.semanticAttributes);
              } else if (!(oNavigationContext && Array.isArray(oNavigationContext.data)) && typeof oNavigationContext === "object") {
                // 1.1.b remove sensitive data from object
                aSemanticAttributes.push(this.removeSensitiveData(oNavigationContext.data, oNavigationContext.metaPath));
              } else if (oNavigationContext && Array.isArray(oNavigationContext.data)) {
                // oNavigationContext.data can be array already ex : [{Customer: "10001"}, {Customer: "10091"}]
                // hence assigning it to the aSemanticAttributes
                aSemanticAttributes = this.removeSensitiveData(oNavigationContext.data, oNavigationContext.metaPath);
              }
            });
          }
          // 2.1 Merge base selection variant and sanitized semantic attributes into one SelectionVariant
          if (aSemanticAttributes && aSemanticAttributes.length) {
            oSelectionVariant = this._oNavigationService.mixAttributesAndSelectionVariant(aSemanticAttributes, oSelectionVariant.toJSONString());
          }

          // 3. Add filterContextUrl to SV so the NavigationHandler can remove any sensitive data based on view entitySet
          const oModel = this._oView.getModel(),
            sEntitySet = this.getEntitySet(),
            sContextUrl = sEntitySet ? this._oNavigationService.constructContextUrl(sEntitySet, oModel) : undefined;
          if (sContextUrl) {
            oSelectionVariant.setFilterContextUrl(sContextUrl);
          }

          // Apply Outbound Parameters to the SV
          if (vOutboundParams) {
            this._applyOutboundParams(oSelectionVariant, vOutboundParams);
          }

          // 4. give an opportunity for the application to influence the SelectionVariant
          oController.intentBasedNavigation.adaptNavigationContext(oSelectionVariant, oTargetInfo);

          // 5. Apply semantic object mappings to the SV
          if (vSemanticObjectMapping) {
            this._applySemanticObjectMappings(oSelectionVariant, vSemanticObjectMapping);
          }

          // 6. remove technical parameters from Selection Variant
          this._removeTechnicalParameters(oSelectionVariant);

          // 7. check if programming model is sticky and page is editable
          const sNavMode = oController._intentBasedNavigation.getNavigationMode();

          // 8. Updating refresh strategy in internal model
          const mRefreshStrategies = navigationParameters && navigationParameters.refreshStrategies || {},
            oInternalModel = oView.getModel("internal");
          if (oInternalModel) {
            if ((oView && oView.getViewData()).refreshStrategyOnAppRestore) {
              const mViewRefreshStrategies = oView.getViewData().refreshStrategyOnAppRestore || {};
              mergeObjects(mRefreshStrategies, mViewRefreshStrategies);
            }
            const mRefreshStrategy = KeepAliveHelper.getRefreshStrategyForIntent(mRefreshStrategies, semanticObject, action);
            if (mRefreshStrategy) {
              oInternalModel.setProperty("/refreshStrategyOnAppRestore", mRefreshStrategy);
            }
          }

          // 9. Navigate via NavigationHandler
          const onError = function () {
            sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
              const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
              MessageBox.error(oResourceBundle.getText("C_COMMON_HELPER_NAVIGATION_ERROR_MESSAGE"), {
                title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR")
              });
            });
          };
          this._oNavigationService.navigate(semanticObject, action, oSelectionVariant.toJSONString(), undefined, onError, undefined, sNavMode);
        } else {
          throw new Error("Semantic Object/action is not provided");
        }
      };
      const oBindingContext = this.base.getView().getBindingContext();
      const oMetaModel = oBindingContext && oBindingContext.getModel().getMetaModel();
      if (this.getView().getViewData().converterType === "ObjectPage" && oMetaModel && !ModelHelper.isStickySessionSupported(oMetaModel)) {
        draft.processDataLossOrDraftDiscardConfirmation(_doNavigate.bind(this), Function.prototype, this.base.getView().getBindingContext(), this.base.getView().getController(), true, draft.NavigationType.ForwardNavigation);
      } else {
        _doNavigate();
      }
    }

    /**
     * Prepare attributes to be passed to external navigation.
     *
     * @param oSemanticAttributes Context data after removing all sensitive information.
     * @param oContext Actual context from which the semanticAttributes were derived.
     * @returns Object of prepared attributes for external navigation and no conflict properties.
     */;
    _proto.prepareContextForExternalNavigation = function prepareContextForExternalNavigation(oSemanticAttributes, oContext) {
      // 1. Find all distinct keys in the object SemanticAttributes
      // Store meta path for each occurence of the key
      const oDistinctKeys = {},
        sContextPath = oContext.getPath(),
        oMetaModel = oContext.getModel().getMetaModel(),
        sMetaPath = oMetaModel.getMetaPath(sContextPath),
        aMetaPathParts = sMetaPath.split("/").filter(Boolean);
      function _findDistinctKeysInObject(LookUpObject, sLookUpObjectMetaPath) {
        for (const sKey in LookUpObject) {
          // null case??
          if (LookUpObject[sKey] === null || typeof LookUpObject[sKey] !== "object") {
            if (!oDistinctKeys[sKey]) {
              // if key is found for the first time then create array
              oDistinctKeys[sKey] = [];
            }
            // push path to array
            oDistinctKeys[sKey].push(sLookUpObjectMetaPath);
          } else {
            // if a nested object is found
            const oNewLookUpObject = LookUpObject[sKey];
            _findDistinctKeysInObject(oNewLookUpObject, `${sLookUpObjectMetaPath}/${sKey}`);
          }
        }
      }
      _findDistinctKeysInObject(oSemanticAttributes, sMetaPath);

      // 2. Determine distinct key value and add conflicted paths to semantic attributes
      const sMainEntitySetName = aMetaPathParts[0],
        sMainEntityTypeName = oMetaModel.getObject(`/${sMainEntitySetName}/@sapui.name`),
        oPropertiesWithoutConflict = {};
      let sMainEntityValuePath, sCurrentValuePath, sLastValuePath;
      for (const sDistinctKey in oDistinctKeys) {
        const aConflictingPaths = oDistinctKeys[sDistinctKey];
        let sWinnerValuePath;
        // Find winner value for each distinct key in case of conflict by the following rule:

        // -> A. if any meta path for a distinct key is the same as main entity take that as the value
        // -> B. if A is not met keep the value from the current context (sMetaPath === path of distince key)
        // -> C. if A, B or C are not met take the last path for value
        if (aConflictingPaths.length > 1) {
          // conflict
          for (let i = 0; i <= aConflictingPaths.length - 1; i++) {
            const sPath = aConflictingPaths[i];
            let sPathInContext = sPath.replace(sPath === sMetaPath ? sMetaPath : `${sMetaPath}/`, "");
            sPathInContext = (sPathInContext === "" ? sPathInContext : `${sPathInContext}/`) + sDistinctKey;
            const sEntityTypeName = oMetaModel.getObject(`${sPath}/@sapui.name`);
            // rule A

            // rule A
            if (sEntityTypeName === sMainEntityTypeName) {
              sMainEntityValuePath = sPathInContext;
            }

            // rule B
            if (sPath === sMetaPath) {
              sCurrentValuePath = sPathInContext;
            }

            // rule C
            sLastValuePath = sPathInContext;

            // add conflicted path to semantic attributes
            // check if the current path points to main entity and prefix attribute names accordingly
            oSemanticAttributes[`${sMetaPath}/${sPathInContext}`.split("/").filter(function (sValue) {
              return sValue != "";
            }).join(".")] = oContext.getProperty(sPathInContext);
          }
          // A || B || C
          sWinnerValuePath = sMainEntityValuePath || sCurrentValuePath || sLastValuePath;
          oSemanticAttributes[sDistinctKey] = oContext.getProperty(sWinnerValuePath);
          sMainEntityValuePath = undefined;
          sCurrentValuePath = undefined;
          sLastValuePath = undefined;
        } else {
          // no conflict, add distinct key without adding paths
          const sPath = aConflictingPaths[0]; // because there is only one and hence no conflict
          let sPathInContext = sPath.replace(sPath === sMetaPath ? sMetaPath : `${sMetaPath}/`, "");
          sPathInContext = (sPathInContext === "" ? sPathInContext : `${sPathInContext}/`) + sDistinctKey;
          oSemanticAttributes[sDistinctKey] = oContext.getProperty(sPathInContext);
          oPropertiesWithoutConflict[sDistinctKey] = `${sMetaPath}/${sPathInContext}`.split("/").filter(function (sValue) {
            return sValue != "";
          }).join(".");
        }
      }
      // 3. Remove all Navigation properties
      for (const sProperty in oSemanticAttributes) {
        if (oSemanticAttributes[sProperty] !== null && typeof oSemanticAttributes[sProperty] === "object") {
          delete oSemanticAttributes[sProperty];
        }
      }
      return {
        semanticAttributes: oSemanticAttributes,
        propertiesWithoutConflict: oPropertiesWithoutConflict
      };
    }

    /**
     * Get Navigation mode.
     *
     * @returns The navigation mode
     */;
    _proto.getNavigationMode = function getNavigationMode() {
      return undefined;
    }

    /**
     * Allows for navigation to a given intent (SemanticObject-Action) with the provided context, using a dialog that shows the contexts which cannot be passed
     * If semantic object mapping is provided, this setting is also applied to the selection variant after adaptation by a consumer.
     * This setting also removes any technical parameters and determines if an inplace or explace navigation should take place.
     *
     * @param sSemanticObject Semantic object for the target app
     * @param sAction  Action for the target app
     * @param [mNavigationParameters] Optional parameters to be passed to the external navigation
     */;
    _proto.navigateWithConfirmationDialog = async function navigateWithConfirmationDialog(sSemanticObject, sAction, mNavigationParameters) {
      var _mNavigationParameter;
      let shouldContinue = true;
      if (mNavigationParameters !== null && mNavigationParameters !== void 0 && mNavigationParameters.notApplicableContexts && ((_mNavigationParameter = mNavigationParameters.notApplicableContexts) === null || _mNavigationParameter === void 0 ? void 0 : _mNavigationParameter.length) >= 1) {
        const metaModel = this.base.getView().getModel().getMetaModel();
        const entitySetPath = metaModel.getMetaPath(mNavigationParameters.notApplicableContexts[0].getPath());
        const convertedMetadata = convertTypes(metaModel);
        const entitySet = convertedMetadata.resolvePath(entitySetPath).target;
        // Show the contexts that are not applicable and will not therefore be processed
        const notApplicableContextsDialog = new NotApplicableContextDialog({
          title: "",
          entityType: entitySet.entityType,
          resourceModel: getResourceModel(this.getView()),
          notApplicableContexts: mNavigationParameters.notApplicableContexts
        });
        mNavigationParameters.navigationContexts = mNavigationParameters.applicableContexts;
        shouldContinue = await notApplicableContextsDialog.open(this.getView());
      }
      if (shouldContinue) {
        this.navigate(sSemanticObject, sAction, mNavigationParameters);
      }
    };
    _proto._removeTechnicalParameters = function _removeTechnicalParameters(oSelectionVariant) {
      oSelectionVariant.removeSelectOption("@odata.context");
      oSelectionVariant.removeSelectOption("@odata.metadataEtag");
      oSelectionVariant.removeSelectOption("SAP__Messages");
    }

    /**
     * Get targeted Entity set.
     *
     * @returns Entity set name
     */;
    _proto.getEntitySet = function getEntitySet() {
      return this._oView.getViewData().entitySet;
    }

    /**
     * Removes sensitive data from the semantic attribute with respect to the entitySet.
     *
     * @param oAttributes Context data
     * @param sMetaPath Meta path to reach the entitySet in the MetaModel
     * @returns Array of semantic Attributes
     */
    // TO-DO add unit tests for this function in the controller extension qunit.
    ;
    _proto.removeSensitiveData = function removeSensitiveData(oAttributes, sMetaPath) {
      if (oAttributes) {
        const {
          transAggregations,
          customAggregates
        } = this._getAggregates(sMetaPath, this.base.getView(), this.base.getAppComponent().getDiagnostics());
        const aProperties = Object.keys(oAttributes);
        if (aProperties.length) {
          delete oAttributes["@odata.context"];
          delete oAttributes["@odata.metadataEtag"];
          delete oAttributes["SAP__Messages"];
          for (const element of aProperties) {
            if (oAttributes[element] && typeof oAttributes[element] === "object") {
              this.removeSensitiveData(oAttributes[element], `${sMetaPath}/${element}`);
            }
            if (element.includes("@odata.type")) {
              delete oAttributes[element];
              continue;
            }
            this._deleteAggregates([...transAggregations, ...customAggregates], element, oAttributes);
            const aPropertyAnnotations = this._getPropertyAnnotations(element, sMetaPath, oAttributes, this._oMetaModel);
            if (aPropertyAnnotations) {
              var _aPropertyAnnotations, _aPropertyAnnotations2, _aPropertyAnnotations3, _aPropertyAnnotations4;
              if ((_aPropertyAnnotations = aPropertyAnnotations.PersonalData) !== null && _aPropertyAnnotations !== void 0 && _aPropertyAnnotations.IsPotentiallySensitive || (_aPropertyAnnotations2 = aPropertyAnnotations.UI) !== null && _aPropertyAnnotations2 !== void 0 && _aPropertyAnnotations2.ExcludeFromNavigationContext || (_aPropertyAnnotations3 = aPropertyAnnotations.Analytics) !== null && _aPropertyAnnotations3 !== void 0 && _aPropertyAnnotations3.Measure) {
                delete oAttributes[element];
              } else if ((_aPropertyAnnotations4 = aPropertyAnnotations.Common) !== null && _aPropertyAnnotations4 !== void 0 && _aPropertyAnnotations4.FieldControl) {
                const oFieldControl = aPropertyAnnotations.Common.FieldControl;
                if (oFieldControl["$EnumMember"] && oFieldControl["$EnumMember"].split("/")[1] === "Inapplicable" || oFieldControl["$Path"] && this._isFieldControlPathInapplicable(oFieldControl["$Path"], oAttributes)) {
                  delete oAttributes[element];
                }
              }
            }
          }
        }
      }
      return oAttributes;
    }

    /**
     * Remove the attribute from navigation data if it is a measure.
     *
     * @param aggregates Array of Aggregates
     * @param sProp Attribute name
     * @param oAttributes SemanticAttributes
     */;
    _proto._deleteAggregates = function _deleteAggregates(aggregates, sProp, oAttributes) {
      if (aggregates && aggregates.includes(sProp)) {
        delete oAttributes[sProp];
      }
    }

    /**
     * Returns the property annotations.
     *
     * @param sProp
     * @param sMetaPath
     * @param oAttributes
     * @param oMetaModel
     * @returns - The property annotations
     */;
    _proto._getPropertyAnnotations = function _getPropertyAnnotations(sProp, sMetaPath, oAttributes, oMetaModel) {
      if (oAttributes[sProp] && sMetaPath && !sMetaPath.includes("undefined")) {
        var _oFullContext$targetO;
        const oContext = oMetaModel.createBindingContext(`${sMetaPath}/${sProp}`);
        const oFullContext = MetaModelConverter.getInvolvedDataModelObjects(oContext);
        return oFullContext === null || oFullContext === void 0 ? void 0 : (_oFullContext$targetO = oFullContext.targetObject) === null || _oFullContext$targetO === void 0 ? void 0 : _oFullContext$targetO.annotations;
      }
      return null;
    }

    /**
     * Returns the aggregates part of the EntitySet or EntityType.
     *
     * @param sMetaPath
     * @param oView
     * @param oDiagnostics
     * @returns - The aggregates
     */;
    _proto._getAggregates = function _getAggregates(sMetaPath, oView, oDiagnostics) {
      const converterContext = this._getConverterContext(sMetaPath, oView, oDiagnostics);
      const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext);
      const isAnalyticsSupported = aggregationHelper.isAnalyticsSupported();
      let transAggregations, customAggregates;
      if (isAnalyticsSupported) {
        var _transAggregations, _customAggregates;
        transAggregations = aggregationHelper.getTransAggregations();
        if ((_transAggregations = transAggregations) !== null && _transAggregations !== void 0 && _transAggregations.length) {
          transAggregations = transAggregations.map(transAgg => {
            return transAgg.Name || transAgg.Value;
          });
        }
        customAggregates = aggregationHelper.getCustomAggregateDefinitions();
        if ((_customAggregates = customAggregates) !== null && _customAggregates !== void 0 && _customAggregates.length) {
          customAggregates = customAggregates.map(customAggregate => {
            return customAggregate.qualifier;
          });
        }
      }
      transAggregations = transAggregations ? transAggregations : [];
      customAggregates = customAggregates ? customAggregates : [];
      return {
        transAggregations,
        customAggregates
      };
    }

    /**
     * Returns converterContext.
     *
     * @param sMetaPath
     * @param oView
     * @param oDiagnostics
     * @returns - ConverterContext
     */;
    _proto._getConverterContext = function _getConverterContext(sMetaPath, oView, oDiagnostics) {
      const oViewData = oView.getViewData();
      let sEntitySet = oViewData.entitySet;
      const sContextPath = oViewData.contextPath;
      if (sContextPath && (!sEntitySet || sEntitySet.includes("/"))) {
        sEntitySet = oViewData === null || oViewData === void 0 ? void 0 : oViewData.fullContextPath.split("/")[1];
      }
      return CommonUtils.getConverterContextForPath(sMetaPath, oView.getModel().getMetaModel(), sEntitySet, oDiagnostics);
    }

    /**
     * Check if path-based FieldControl evaluates to inapplicable.
     *
     * @param sFieldControlPath Field control path
     * @param oAttribute SemanticAttributes
     * @returns `true` if inapplicable
     */;
    _proto._isFieldControlPathInapplicable = function _isFieldControlPathInapplicable(sFieldControlPath, oAttribute) {
      let bInapplicable = false;
      const aParts = sFieldControlPath.split("/");
      // sensitive data is removed only if the path has already been resolved.
      if (aParts.length > 1) {
        bInapplicable = oAttribute[aParts[0]] && oAttribute[aParts[0]].hasOwnProperty(aParts[1]) && oAttribute[aParts[0]][aParts[1]] === 0;
      } else {
        bInapplicable = oAttribute[sFieldControlPath] === 0;
      }
      return bInapplicable;
    }

    /**
     * Method to replace Local Properties with Semantic Object mappings.
     *
     * @param oSelectionVariant SelectionVariant consisting of filterbar, Table and Page Context
     * @param vMappings A string representation of semantic object mapping
     * @returns - Modified SelectionVariant with LocalProperty replaced with SemanticObjectProperties.
     */;
    _proto._applySemanticObjectMappings = function _applySemanticObjectMappings(oSelectionVariant, vMappings) {
      const oMappings = typeof vMappings === "string" ? JSON.parse(vMappings) : vMappings;
      for (let i = 0; i < oMappings.length; i++) {
        const sLocalProperty = oMappings[i]["LocalProperty"] && oMappings[i]["LocalProperty"]["$PropertyPath"] || oMappings[i]["@com.sap.vocabularies.Common.v1.LocalProperty"] && oMappings[i]["@com.sap.vocabularies.Common.v1.LocalProperty"]["$Path"];
        const sSemanticObjectProperty = oMappings[i]["SemanticObjectProperty"] || oMappings[i]["@com.sap.vocabularies.Common.v1.SemanticObjectProperty"];
        const oSelectOption = oSelectionVariant.getSelectOption(sLocalProperty);
        if (oSelectOption) {
          //Create a new SelectOption with sSemanticObjectProperty as the property Name and remove the older one
          oSelectionVariant.removeSelectOption(sLocalProperty);
          oSelectionVariant.massAddSelectOption(sSemanticObjectProperty, oSelectOption);
        }
      }
      return oSelectionVariant;
    }

    /**
     * Method to store the focusInformation to the history object.
     */;
    _proto.storeFocusInfoInHistory = function storeFocusInfoInHistory() {
      let focusInfo = null;
      const focusControlId = Core.getCurrentFocusedControlId();
      const focusControl = focusControlId ? Core.byId(focusControlId) : undefined;
      const focusMDCTable = focusControl && FPMHelper.getMdcTable(focusControl);
      if (focusControl !== null && focusControl !== void 0 && focusControl.isA("sap.m.Button")) {
        focusInfo = {
          type: "Control",
          controlId: focusControlId
        };
      } else if (focusMDCTable) {
        var _focusControl$getBind;
        focusInfo = {
          type: "Row",
          tableId: focusMDCTable.getId(),
          contextPathFocus: (_focusControl$getBind = focusControl.getBindingContext()) === null || _focusControl$getBind === void 0 ? void 0 : _focusControl$getBind.getPath()
        };
      }
      history.replaceState(Object.assign({}, history.state, {
        focusInfo: focusInfo
      }), "");
    }

    /**
     * Navigates to an Outbound provided in the manifest.
     *
     * @param sOutbound Identifier to location the outbound in the manifest
     * @param mNavigationParameters Optional map containing key/value pairs to be passed to the intent
     * @since 1.86.0
     */;
    _proto.navigateOutbound = function navigateOutbound(sOutbound, mNavigationParameters) {
      var _oManifestEntry$cross, _oManifestEntry$cross2;
      this.storeFocusInfoInHistory();
      let aNavParams;
      const oManifestEntry = this.base.getAppComponent().getManifestEntry("sap.app"),
        oOutbound = (_oManifestEntry$cross = oManifestEntry.crossNavigation) === null || _oManifestEntry$cross === void 0 ? void 0 : (_oManifestEntry$cross2 = _oManifestEntry$cross.outbounds) === null || _oManifestEntry$cross2 === void 0 ? void 0 : _oManifestEntry$cross2[sOutbound];
      if (!oOutbound) {
        Log.error("Outbound is not defined in manifest!!");
        return;
      }
      const sSemanticObject = oOutbound.semanticObject,
        sAction = oOutbound.action,
        outboundParams = oOutbound.parameters && this.getOutboundParams(oOutbound.parameters);
      if (mNavigationParameters) {
        aNavParams = [];
        Object.keys(mNavigationParameters).forEach(function (key) {
          let oParams;
          if (Array.isArray(mNavigationParameters[key])) {
            const aValues = mNavigationParameters[key];
            for (let i = 0; i < aValues.length; i++) {
              var _aNavParams;
              oParams = {};
              oParams[key] = aValues[i];
              (_aNavParams = aNavParams) === null || _aNavParams === void 0 ? void 0 : _aNavParams.push(oParams);
            }
          } else {
            var _aNavParams2;
            oParams = {};
            oParams[key] = mNavigationParameters[key];
            (_aNavParams2 = aNavParams) === null || _aNavParams2 === void 0 ? void 0 : _aNavParams2.push(oParams);
          }
        });
      }
      if (aNavParams || outboundParams) {
        mNavigationParameters = {
          navigationContexts: {
            data: aNavParams || outboundParams
          }
        };
      }
      this.base._intentBasedNavigation.navigate(sSemanticObject, sAction, mNavigationParameters);
    }

    /**
     * Method to apply outbound parameters defined in the manifest.
     *
     * @param oSelectionVariant SelectionVariant consisting of a filter bar, a table, and a page context
     * @param vOutboundParams Outbound Properties defined in the manifest
     * @returns - The modified SelectionVariant with outbound parameters.
     */;
    _proto._applyOutboundParams = function _applyOutboundParams(oSelectionVariant, vOutboundParams) {
      const aParameters = Object.keys(vOutboundParams);
      const aSelectProperties = oSelectionVariant.getSelectOptionsPropertyNames();
      aParameters.forEach(function (key) {
        if (!aSelectProperties.includes(key)) {
          oSelectionVariant.addSelectOption(key, "I", "EQ", vOutboundParams[key]);
        }
      });
      return oSelectionVariant;
    }

    /**
     * Method to get the outbound parameters defined in the manifest.
     *
     * @param oOutboundParams Parameters defined in the outbounds. Only "plain" is supported
     * @returns Parameters with the key-Value pair
     */;
    _proto.getOutboundParams = function getOutboundParams(oOutboundParams) {
      const oParamsMapping = {};
      if (oOutboundParams) {
        const aParameters = Object.keys(oOutboundParams) || [];
        if (aParameters.length > 0) {
          aParameters.forEach(function (key) {
            const oMapping = oOutboundParams[key];
            if (oMapping.value && oMapping.value.value && oMapping.value.format === "plain") {
              if (!oParamsMapping[key]) {
                oParamsMapping[key] = oMapping.value.value;
              }
            }
          });
        }
      }
      return oParamsMapping;
    }

    /**
     * Triggers an outbound navigation when a user chooses the chevron.
     *
     * @param {object} oController
     * @param {string} sOutboundTarget Name of the outbound target (needs to be defined in the manifest)
     * @param oContext The context that contains the data for the target app
     * @param {string} sCreatePath Create path when the chevron is created.
     * @returns {Promise} Promise which is resolved once the navigation is triggered
     */;
    _proto.onChevronPressNavigateOutBound = function onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath) {
      const oOutbounds = oController.getAppComponent().getRoutingService().getOutbounds();
      const oDisplayOutbound = oOutbounds[sOutboundTarget];
      let additionalNavigationParameters;
      if (oDisplayOutbound && oDisplayOutbound.semanticObject && oDisplayOutbound.action) {
        const oRefreshStrategies = {
          intents: {}
        };
        const oDefaultRefreshStrategy = {};
        let sMetaPath;
        if (oContext) {
          if (oContext.isA && oContext.isA("sap.ui.model.odata.v4.Context")) {
            sMetaPath = ModelHelper.getMetaPathForContext(oContext);
            oContext = [oContext];
          } else {
            sMetaPath = ModelHelper.getMetaPathForContext(oContext[0]);
          }
          oDefaultRefreshStrategy[sMetaPath] = "self";
          oRefreshStrategies["_feDefault"] = oDefaultRefreshStrategy;
        }
        if (sCreatePath) {
          const sKey = `${oDisplayOutbound.semanticObject}-${oDisplayOutbound.action}`;
          oRefreshStrategies.intents[sKey] = {};
          oRefreshStrategies.intents[sKey][sCreatePath] = "self";
        }
        if (oDisplayOutbound && oDisplayOutbound.parameters) {
          const oParams = oDisplayOutbound.parameters && this.getOutboundParams(oDisplayOutbound.parameters);
          if (Object.keys(oParams).length > 0) {
            additionalNavigationParameters = oParams;
          }
        }
        oController._intentBasedNavigation.navigate(oDisplayOutbound.semanticObject, oDisplayOutbound.action, {
          navigationContexts: oContext,
          refreshStrategies: oRefreshStrategies,
          additionalNavigationParameters: additionalNavigationParameters
        });

        //TODO: check why returning a promise is required
        return Promise.resolve();
      } else {
        throw new Error(`outbound target ${sOutboundTarget} not found in cross navigation definition of manifest`);
      }
    };
    return InternalIntentBasedNavigation;
  }(ControllerExtension), (_applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigate", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "navigate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "prepareContextForExternalNavigation", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "prepareContextForExternalNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getNavigationMode", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "getNavigationMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateWithConfirmationDialog", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateWithConfirmationDialog"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getEntitySet", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "getEntitySet"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "removeSensitiveData", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "removeSensitiveData"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateOutbound", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateOutbound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getOutboundParams", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "getOutboundParams"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onChevronPressNavigateOutBound", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "onChevronPressNavigateOutBound"), _class2.prototype)), _class2)) || _class);
  return InternalIntentBasedNavigation;
}, false);
