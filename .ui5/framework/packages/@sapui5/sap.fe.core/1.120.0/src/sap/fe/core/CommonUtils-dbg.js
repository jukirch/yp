/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/array/uniqueSort", "sap/base/util/merge", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/SemanticDateOperators", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/library", "sap/ui/Device", "sap/ui/core/Component", "sap/ui/core/Fragment", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/Filter", "./controls/AnyElement", "./helpers/MetaModelFunction"], function (Log, uniqueSort, mergeObjects, ConverterContext, MetaModelConverter, BindingToolkit, ModelHelper, SemanticDateOperators, StableIdHelper, FELibrary, Device, Component, Fragment, XMLTemplateProcessor, XMLPreprocessor, FilterOperatorUtil, TypeMap, Filter, AnyElement, MetaModelFunction) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var compileExpression = BindingToolkit.compileExpression;
  const ProgrammingModel = FELibrary.ProgrammingModel;
  function normalizeSearchTerm(sSearchTerm) {
    if (!sSearchTerm) {
      return undefined;
    }
    return sSearchTerm.replace(/"/g, " ").replace(/\\/g, "\\\\") //escape backslash characters. Can be removed if odata/binding handles backend errors responds.
    .split(/\s+/).reduce(function (sNormalized, sCurrentWord) {
      if (sCurrentWord !== "") {
        sNormalized = `${sNormalized ? `${sNormalized} ` : ""}"${sCurrentWord}"`;
      }
      return sNormalized;
    }, undefined);
  }
  async function waitForContextRequested(bindingContext) {
    var _dataModel$targetEnti;
    const model = bindingContext.getModel();
    const metaModel = model.getMetaModel();
    const entityPath = metaModel.getMetaPath(bindingContext.getPath());
    const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(entityPath));
    await bindingContext.requestProperty((_dataModel$targetEnti = dataModel.targetEntityType.keys[0]) === null || _dataModel$targetEnti === void 0 ? void 0 : _dataModel$targetEnti.name);
  }
  function fnHasTransientContexts(oListBinding) {
    let bHasTransientContexts = false;
    if (oListBinding) {
      oListBinding.getCurrentContexts().forEach(function (oContext) {
        if (oContext && oContext.isTransient()) {
          bHasTransientContexts = true;
        }
      });
    }
    return bHasTransientContexts;
  }

  // there is no navigation in entitySet path and property path

  async function _getSOIntents(oShellServiceHelper, oObjectPageLayout, oSemanticObject, oParam) {
    return oShellServiceHelper.getLinks({
      semanticObject: oSemanticObject,
      params: oParam
    });
  }

  // TO-DO add this as part of applySemanticObjectmappings logic in IntentBasednavigation controller extension
  function _createMappings(oMapping) {
    const aSOMappings = [];
    const aMappingKeys = Object.keys(oMapping);
    let oSemanticMapping;
    for (const element of aMappingKeys) {
      oSemanticMapping = {
        LocalProperty: {
          $PropertyPath: element
        },
        SemanticObjectProperty: oMapping[element]
      };
      aSOMappings.push(oSemanticMapping);
    }
    return aSOMappings;
  }
  /**
   * @param aLinks
   * @param aExcludedActions
   * @param oTargetParams
   * @param aItems
   * @param aAllowedActions
   */
  function _getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aItems, aAllowedActions) {
    for (const element of aLinks) {
      const oLink = element;
      const sIntent = oLink.intent;
      const sAction = sIntent.split("-")[1].split("?")[0];
      if (aAllowedActions && aAllowedActions.includes(sAction) || !aAllowedActions && aExcludedActions && !aExcludedActions.includes(sAction)) {
        aItems.push({
          text: oLink.text,
          targetSemObject: sIntent.split("#")[1].split("-")[0],
          targetAction: sAction.split("~")[0],
          targetParams: oTargetParams
        });
      }
    }
  }
  function _getRelatedIntents(oAdditionalSemanticObjects, oBindingContext, aManifestSOItems, aLinks) {
    if (aLinks && aLinks.length > 0) {
      const aAllowedActions = oAdditionalSemanticObjects.allowedActions || undefined;
      const aExcludedActions = oAdditionalSemanticObjects.unavailableActions ? oAdditionalSemanticObjects.unavailableActions : [];
      const aSOMappings = oAdditionalSemanticObjects.mapping ? _createMappings(oAdditionalSemanticObjects.mapping) : [];
      const oTargetParams = {
        navigationContexts: oBindingContext,
        semanticObjectMapping: aSOMappings
      };
      _getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aManifestSOItems, aAllowedActions);
    }
  }

  /**
   * This function fetches the related intents when semantic object and action are passed from feEnvironment.getIntent() only in case of My Inbox integration.
   *
   * @param semanticObjectAndAction This specifies the semantic object and action for fetching the intents
   * @param oBindingContext This sepcifies the binding context for updating related apps
   * @param appComponentSOItems This is a list of semantic items used for updating the related apps button
   * @param aLinks This is an array comprising of related intents
   */

  function _getRelatedIntentsWithSemanticObjectsAndAction(semanticObjectAndAction, oBindingContext, appComponentSOItems, aLinks) {
    if (aLinks.length > 0) {
      const actions = [semanticObjectAndAction.action];
      const excludedActions = [];
      const soMappings = [];
      const targetParams = {
        navigationContexts: oBindingContext,
        semanticObjectMapping: soMappings
      };
      _getRelatedAppsMenuItems(aLinks, excludedActions, targetParams, appComponentSOItems, actions);
    }
  }
  async function updateRelateAppsModel(oBindingContext, oEntry, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent) {
    const oShellServiceHelper = appComponent.getShellServices();
    const oParam = {};
    let sCurrentSemObj = "",
      sCurrentAction = "";
    let oSemanticObjectAnnotations;
    let aRelatedAppsMenuItems = [];
    let aExcludedActions = [];
    let aManifestSOKeys;
    async function fnGetParseShellHashAndGetLinks() {
      const oParsedUrl = oShellServiceHelper.parseShellHash(document.location.hash);
      sCurrentSemObj = oParsedUrl.semanticObject; // Current Semantic Object
      sCurrentAction = oParsedUrl.action;
      return _getSOIntents(oShellServiceHelper, oObjectPageLayout, sCurrentSemObj, oParam);
    }
    try {
      if (oEntry) {
        if (aSemKeys && aSemKeys.length > 0) {
          for (const element of aSemKeys) {
            const sSemKey = element.$PropertyPath;
            if (!oParam[sSemKey]) {
              oParam[sSemKey] = {
                value: oEntry[sSemKey]
              };
            }
          }
        } else {
          // fallback to Technical Keys if no Semantic Key is present
          const aTechnicalKeys = oMetaModel.getObject(`${oMetaPath}/$Type/$Key`);
          for (const key in aTechnicalKeys) {
            const sObjKey = aTechnicalKeys[key];
            if (!oParam[sObjKey]) {
              oParam[sObjKey] = {
                value: oEntry[sObjKey]
              };
            }
          }
        }
      }
      // Logic to read additional SO from manifest and updated relatedapps model

      const oManifestData = getTargetView(oObjectPageLayout).getViewData();
      const aManifestSOItems = [];
      let semanticObjectIntents;
      if (oManifestData.additionalSemanticObjects) {
        aManifestSOKeys = Object.keys(oManifestData.additionalSemanticObjects);
        for (const element of aManifestSOKeys) {
          semanticObjectIntents = await Promise.resolve(_getSOIntents(oShellServiceHelper, oObjectPageLayout, element, oParam));
          _getRelatedIntents(oManifestData.additionalSemanticObjects[element], oBindingContext, aManifestSOItems, semanticObjectIntents);
        }
      }

      // appComponentSOItems is updated in case of My Inbox integration when semantic object and action are passed from feEnvironment.getIntent() method
      // In other cases it remains as an empty list
      // We concat this list towards the end with aManifestSOItems

      const appComponentSOItems = [];
      const componentData = appComponent.getComponentData();
      if (componentData.feEnvironment && componentData.feEnvironment.getIntent()) {
        const intent = componentData.feEnvironment.getIntent();
        semanticObjectIntents = await Promise.resolve(_getSOIntents(oShellServiceHelper, oObjectPageLayout, intent.semanticObject, oParam));
        _getRelatedIntentsWithSemanticObjectsAndAction(intent, oBindingContext, appComponentSOItems, semanticObjectIntents);
      }
      const internalModelContext = oObjectPageLayout.getBindingContext("internal");
      const aLinks = await fnGetParseShellHashAndGetLinks();
      if (aLinks) {
        if (aLinks.length > 0) {
          let isSemanticObjectHasSameTargetInManifest = false;
          const oTargetParams = {};
          const aAnnotationsSOItems = [];
          const sEntitySetPath = `${oMetaPath}@`;
          const sEntityTypePath = `${oMetaPath}/@`;
          const oEntitySetAnnotations = oMetaModel.getObject(sEntitySetPath);
          oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntitySetAnnotations, sCurrentSemObj);
          if (!oSemanticObjectAnnotations.bHasEntitySetSO) {
            const oEntityTypeAnnotations = oMetaModel.getObject(sEntityTypePath);
            oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntityTypeAnnotations, sCurrentSemObj);
          }
          aExcludedActions = oSemanticObjectAnnotations.aUnavailableActions;
          //Skip same application from Related Apps
          aExcludedActions.push(sCurrentAction);
          oTargetParams.navigationContexts = oBindingContext;
          oTargetParams.semanticObjectMapping = oSemanticObjectAnnotations.aMappings;
          _getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aAnnotationsSOItems);
          aManifestSOItems.forEach(function (_ref) {
            var _aAnnotationsSOItems$;
            let {
              targetSemObject
            } = _ref;
            if (((_aAnnotationsSOItems$ = aAnnotationsSOItems[0]) === null || _aAnnotationsSOItems$ === void 0 ? void 0 : _aAnnotationsSOItems$.targetSemObject) === targetSemObject) {
              isSemanticObjectHasSameTargetInManifest = true;
            }
          });

          // remove all actions from current hash application if manifest contains empty allowedActions
          if (oManifestData.additionalSemanticObjects && aAnnotationsSOItems[0] && oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject] && !!oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject].allowedActions) {
            isSemanticObjectHasSameTargetInManifest = true;
          }
          const soItems = aManifestSOItems.concat(appComponentSOItems);
          aRelatedAppsMenuItems = isSemanticObjectHasSameTargetInManifest ? soItems : soItems.concat(aAnnotationsSOItems);
          // If no app in list, related apps button will be hidden
          internalModelContext.setProperty("relatedApps/visibility", aRelatedAppsMenuItems.length > 0);
          internalModelContext.setProperty("relatedApps/items", aRelatedAppsMenuItems);
        } else {
          internalModelContext.setProperty("relatedApps/visibility", false);
        }
      } else {
        internalModelContext.setProperty("relatedApps/visibility", false);
      }
    } catch (error) {
      Log.error("Cannot read links", error);
    }
    return aRelatedAppsMenuItems;
  }
  function _getSemanticObjectAnnotations(oEntityAnnotations, sCurrentSemObj) {
    const oSemanticObjectAnnotations = {
      bHasEntitySetSO: false,
      aAllowedActions: [],
      aUnavailableActions: [],
      aMappings: []
    };
    let sAnnotationMappingTerm, sAnnotationActionTerm;
    let sQualifier;
    for (const key in oEntityAnnotations) {
      if (key.includes("com.sap.vocabularies.Common.v1.SemanticObject") && oEntityAnnotations[key] === sCurrentSemObj) {
        oSemanticObjectAnnotations.bHasEntitySetSO = true;
        sAnnotationMappingTerm = `@${"com.sap.vocabularies.Common.v1.SemanticObjectMapping"}`;
        sAnnotationActionTerm = `@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`;
        if (key.includes("#")) {
          sQualifier = key.split("#")[1];
          sAnnotationMappingTerm = `${sAnnotationMappingTerm}#${sQualifier}`;
          sAnnotationActionTerm = `${sAnnotationActionTerm}#${sQualifier}`;
        }
        if (oEntityAnnotations[sAnnotationMappingTerm]) {
          oSemanticObjectAnnotations.aMappings = oSemanticObjectAnnotations.aMappings.concat(oEntityAnnotations[sAnnotationMappingTerm]);
        }
        if (oEntityAnnotations[sAnnotationActionTerm]) {
          oSemanticObjectAnnotations.aUnavailableActions = oSemanticObjectAnnotations.aUnavailableActions.concat(oEntityAnnotations[sAnnotationActionTerm]);
        }
        break;
      }
    }
    return oSemanticObjectAnnotations;
  }
  function fnUpdateRelatedAppsDetails(oObjectPageLayout, appComponent) {
    const oMetaModel = oObjectPageLayout.getModel().getMetaModel();
    const oBindingContext = oObjectPageLayout.getBindingContext();
    const path = oBindingContext && oBindingContext.getPath() || "";
    const oMetaPath = oMetaModel.getMetaPath(path);
    // Semantic Key Vocabulary
    const sSemanticKeyVocabulary = `${oMetaPath}/` + `@com.sap.vocabularies.Common.v1.SemanticKey`;
    //Semantic Keys
    const aSemKeys = oMetaModel.getObject(sSemanticKeyVocabulary);
    // Unavailable Actions
    const oEntry = oBindingContext === null || oBindingContext === void 0 ? void 0 : oBindingContext.getObject();
    if (!oEntry && oBindingContext) {
      oBindingContext.requestObject().then(async function (requestedObject) {
        return CommonUtils.updateRelateAppsModel(oBindingContext, requestedObject, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent);
      }).catch(function (oError) {
        Log.error("Cannot update the related app details", oError);
      });
    } else {
      return CommonUtils.updateRelateAppsModel(oBindingContext, oEntry, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent);
    }
  }

  /**
   * @param oButton
   */
  function fnFireButtonPress(oButton) {
    if (oButton && oButton.isA(["sap.m.Button", "sap.m.OverflowToolbarButton"]) && oButton.getVisible() && oButton.getEnabled()) {
      oButton.firePress();
    }
  }
  function getAppComponent(oControl) {
    if (oControl.isA("sap.fe.core.AppComponent")) {
      return oControl;
    }
    const oOwner = Component.getOwnerComponentFor(oControl);
    if (!oOwner) {
      throw new Error("There should be a sap.fe.core.AppComponent as owner of the control");
    } else {
      return getAppComponent(oOwner);
    }
  }
  function getCurrentPageView(oAppComponent) {
    const rootViewController = oAppComponent.getRootViewController();
    return rootViewController.isFclEnabled() ? rootViewController.getRightmostView() : CommonUtils.getTargetView(oAppComponent.getRootContainer().getCurrentPage());
  }
  function getTargetView(oControl) {
    if (oControl && oControl.isA("sap.ui.core.ComponentContainer")) {
      const oComponent = oControl.getComponentInstance();
      oControl = oComponent && oComponent.getRootControl();
    }
    while (oControl && !oControl.isA("sap.ui.core.mvc.View")) {
      oControl = oControl.getParent();
    }
    return oControl;
  }
  function _fnCheckIsMatch(oObject, oKeysToCheck) {
    for (const sKey in oKeysToCheck) {
      if (oKeysToCheck[sKey] !== oObject[sKey]) {
        return false;
      }
    }
    return true;
  }
  function fnGetContextPathProperties(metaModelContext, sContextPath, oFilter) {
    const oEntityType = metaModelContext.getObject(`${sContextPath}/`) || {},
      oProperties = {};
    for (const sKey in oEntityType) {
      if (oEntityType.hasOwnProperty(sKey) && !/^\$/i.test(sKey) && oEntityType[sKey].$kind && _fnCheckIsMatch(oEntityType[sKey], oFilter || {
        $kind: "Property"
      })) {
        oProperties[sKey] = oEntityType[sKey];
      }
    }
    return oProperties;
  }
  function fnGetIBNActions(oControl, aIBNActions) {
    const aActions = oControl && oControl.getActions();
    if (aActions) {
      aActions.forEach(function (oAction) {
        if (oAction.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction")) {
          oAction = oAction.getAction();
        }
        if (oAction.isA("sap.m.MenuButton")) {
          const oMenu = oAction.getMenu();
          const aItems = oMenu.getItems();
          aItems.forEach(oItem => {
            if (oItem.data("IBNData")) {
              aIBNActions.push(oItem);
            }
          });
        } else if (oAction.data("IBNData")) {
          aIBNActions.push(oAction);
        }
      });
    }
    return aIBNActions;
  }

  /**
   * @param aIBNActions
   * @param oView
   */
  function fnUpdateDataFieldForIBNButtonsVisibility(aIBNActions, oView) {
    const oParams = {};
    const oAppComponent = CommonUtils.getAppComponent(oView);
    const isSticky = ModelHelper.isStickySessionSupported(oView.getModel().getMetaModel());
    const fnGetLinks = function (oData) {
      if (oData) {
        const aKeys = Object.keys(oData);
        aKeys.forEach(function (sKey) {
          if (sKey.indexOf("_") !== 0 && !sKey.includes("odata.context")) {
            oParams[sKey] = {
              value: oData[sKey]
            };
          }
        });
      }
      if (aIBNActions.length) {
        aIBNActions.forEach(function (oIBNAction) {
          const sSemanticObject = oIBNAction.data("IBNData").semanticObject;
          const sAction = oIBNAction.data("IBNData").action;
          oAppComponent.getShellServices().getLinks({
            semanticObject: sSemanticObject,
            action: sAction,
            params: oParams
          }).then(function (aLink) {
            oIBNAction.setVisible(oIBNAction.getVisible() && aLink && aLink.length === 1);
            if (isSticky) {
              oIBNAction.getBindingContext("internal").setProperty(oIBNAction.getId().split("--")[1], {
                shellNavigationNotAvailable: !(aLink && aLink.length === 1)
              });
            }
          }).catch(function (oError) {
            Log.error("Cannot retrieve the links from the shell service", oError);
          });
        });
      }
    };
    if (oView && oView.getBindingContext()) {
      var _oView$getBindingCont;
      (_oView$getBindingCont = oView.getBindingContext()) === null || _oView$getBindingCont === void 0 ? void 0 : _oView$getBindingCont.requestObject().then(function (oData) {
        return fnGetLinks(oData);
      }).catch(function (oError) {
        Log.error("Cannot retrieve the links from the shell service", oError);
      });
    } else {
      fnGetLinks();
    }
  }
  function getActionPath(actionContext, bReturnOnlyPath, inActionName, bCheckStaticValue) {
    const sActionName = !inActionName ? actionContext.getObject(actionContext.getPath()).toString() : inActionName;
    let sContextPath = actionContext.getPath().split("/@")[0];
    const sEntityTypeName = actionContext.getObject(sContextPath).$Type;
    const sEntityName = getEntitySetName(actionContext.getModel(), sEntityTypeName);
    if (sEntityName) {
      sContextPath = `/${sEntityName}`;
    }
    if (bCheckStaticValue) {
      return actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable`);
    }
    if (bReturnOnlyPath) {
      return `${sContextPath}/${sActionName}`;
    } else {
      return {
        sContextPath: sContextPath,
        sProperty: actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable/$Path`),
        sBindingParameter: actionContext.getObject(`${sContextPath}/${sActionName}/@$ui5.overload/0/$Parameter/0/$Name`)
      };
    }
  }
  function getEntitySetName(oMetaModel, sEntityType) {
    const oEntityContainer = oMetaModel.getObject("/");
    for (const key in oEntityContainer) {
      if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
        return key;
      }
    }
  }
  function computeDisplayMode(oPropertyAnnotations, oCollectionAnnotations) {
    const oTextAnnotation = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"],
      oTextArrangementAnnotation = oTextAnnotation && (oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"] || oCollectionAnnotations && oCollectionAnnotations["@com.sap.vocabularies.UI.v1.TextArrangement"]);
    if (oTextArrangementAnnotation) {
      if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
        return "Description";
      } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
        return "ValueDescription";
      } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate") {
        return "Value";
      }
      //Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
      return "DescriptionValue";
    }
    return oTextAnnotation ? "DescriptionValue" : "Value";
  }
  function _getEntityType(oContext) {
    const oMetaModel = oContext.getModel().getMetaModel();
    return oMetaModel.getObject(`${oMetaModel.getMetaPath(oContext.getPath())}/$Type`);
  }
  async function _requestObject(sAction, oSelectedContext, sProperty) {
    let oContext = oSelectedContext;
    const nBracketIndex = sAction.indexOf("(");
    if (nBracketIndex > -1) {
      const sTargetType = sAction.slice(nBracketIndex + 1, -1);
      let sCurrentType = _getEntityType(oContext);
      while (sCurrentType !== sTargetType) {
        // Find parent binding context and retrieve entity type
        oContext = oContext.getBinding().getContext();
        if (oContext) {
          sCurrentType = _getEntityType(oContext);
        } else {
          Log.warning("Cannot determine target type to request property value for bound action invocation");
          return Promise.resolve(undefined);
        }
      }
    }
    return oContext.requestObject(sProperty);
  }
  async function requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath) {
    const oPromise = sProperty && sProperty.indexOf("/") === 0 ? requestSingletonProperty(sProperty, oSelectedContext.getModel()) : _requestObject(sAction, oSelectedContext, sProperty);
    return oPromise.then(function (vPropertyValue) {
      return {
        vPropertyValue: vPropertyValue,
        oSelectedContext: oSelectedContext,
        sAction: sAction,
        sDynamicActionEnabledPath: sDynamicActionEnabledPath
      };
    });
  }
  async function setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises) {
    return Promise.all(aRequestPromises).then(function (aResults) {
      if (aResults.length) {
        const aApplicableContexts = [],
          aNotApplicableContexts = [];
        aResults.forEach(function (aResult) {
          if (aResult) {
            if (aResult.vPropertyValue) {
              oInternalModelContext.getModel().setProperty(aResult.sDynamicActionEnabledPath, true);
              aApplicableContexts.push(aResult.oSelectedContext);
            } else {
              aNotApplicableContexts.push(aResult.oSelectedContext);
            }
          }
        });
        setDynamicActionContexts(oInternalModelContext, aResults[0].sAction, aApplicableContexts, aNotApplicableContexts);
      }
    }).catch(function (oError) {
      Log.trace("Cannot retrieve property value from path", oError);
    });
  }

  /**
   * @param oInternalModelContext
   * @param sAction
   * @param aApplicable
   * @param aNotApplicable
   */
  function setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable) {
    const sDynamicActionPathPrefix = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}`,
      oInternalModel = oInternalModelContext.getModel();
    oInternalModel.setProperty(`${sDynamicActionPathPrefix}/aApplicable`, aApplicable);
    oInternalModel.setProperty(`${sDynamicActionPathPrefix}/aNotApplicable`, aNotApplicable);
  }
  function _getDefaultOperators(sPropertyType) {
    // mdc defines the full set of operations that are meaningful for each Edm Type
    // TODO Replace with model / internal way of retrieving the actual model type used for the property
    const oDataClass = TypeMap.getDataTypeClassName(sPropertyType);
    // TODO need to pass proper formatOptions, constraints here
    const oBaseType = TypeMap.getBaseType(oDataClass, {}, {});
    return FilterOperatorUtil.getOperatorsForType(oBaseType);
  }
  function _getRestrictions(aDefaultOps, aExpressionOps) {
    // From the default set of Operators for the Base Type, select those that are defined in the Allowed Value.
    // In case that no operators are found, return undefined so that the default set is used.
    return aDefaultOps.filter(function (sElement) {
      return aExpressionOps.includes(sElement);
    });
  }
  function getSpecificAllowedExpression(aExpressions) {
    const aAllowedExpressionsPriority = CommonUtils.AllowedExpressionsPrio;
    aExpressions.sort(function (a, b) {
      return aAllowedExpressionsPriority.indexOf(a) - aAllowedExpressionsPriority.indexOf(b);
    });
    return aExpressions[0];
  }

  /**
   * Method to fetch the correct operators based on the filter restrictions that can be annotated on an entity set or a navigation property.
   * We return the correct operators based on the specified restriction and also check for the operators defined in the manifest to include or exclude them.
   *
   * @param sProperty String name of the property
   * @param sEntitySetPath String path to the entity set
   * @param oContext Context used during templating
   * @param sType String data type od the property, for example edm.Date
   * @param bUseSemanticDateRange Boolean passed from the manifest for semantic date range
   * @param settings Stringified object of the property settings or property settings as a whole
   * @returns An array of strings representing operators for filtering
   */
  function getOperatorsForProperty(sProperty, sEntitySetPath, oContext, sType, bUseSemanticDateRange, settings) {
    const oFilterRestrictions = CommonUtils.getFilterRestrictionsByPath(sEntitySetPath, oContext);
    const aEqualsOps = ["EQ"];
    const aSingleRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
    const aSingleRangeDTBasicOps = ["EQ", "BT"];
    const aSingleValueDateOps = ["TODAY", "TOMORROW", "YESTERDAY", "DATE", "FIRSTDAYWEEK", "LASTDAYWEEK", "FIRSTDAYMONTH", "LASTDAYMONTH", "FIRSTDAYQUARTER", "LASTDAYQUARTER", "FIRSTDAYYEAR", "LASTDAYYEAR"];
    const aMultiRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NE", "NOTBT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
    const aSearchExpressionOps = ["Contains", "NotContains", "StartsWith", "NotStartsWith", "EndsWith", "NotEndsWith"];
    const aSemanticDateOpsExt = SemanticDateOperators.getSupportedOperations();
    const bSemanticDateRange = bUseSemanticDateRange === "true" || bUseSemanticDateRange === true;
    let aSemanticDateOps = [];
    const oSettings = settings && typeof settings === "string" ? JSON.parse(settings).customData : settings;
    if (oContext.getObject(`${sEntitySetPath}/@com.sap.vocabularies.Common.v1.ResultContext`) === true) {
      return aEqualsOps;
    }
    if (oSettings && oSettings.operatorConfiguration && oSettings.operatorConfiguration.length > 0) {
      aSemanticDateOps = SemanticDateOperators.getFilterOperations(oSettings.operatorConfiguration, sType);
    } else {
      aSemanticDateOps = SemanticDateOperators.getSemanticDateOperations(sType);
    }
    // Get the default Operators for this Property Type
    let aDefaultOperators = _getDefaultOperators(sType);
    if (bSemanticDateRange) {
      aDefaultOperators = aSemanticDateOpsExt.concat(aDefaultOperators);
    }
    let restrictions = [];

    // Is there a Filter Restriction defined for this property?
    if (oFilterRestrictions && oFilterRestrictions.FilterAllowedExpressions && oFilterRestrictions.FilterAllowedExpressions[sProperty]) {
      // Extending the default operators list with Semantic Date options DATERANGE, DATE, FROM and TO
      const sAllowedExpression = CommonUtils.getSpecificAllowedExpression(oFilterRestrictions.FilterAllowedExpressions[sProperty]);
      // In case more than one Allowed Expressions has been defined for a property
      // choose the most restrictive Allowed Expression

      // MultiValue has same Operator as SingleValue, but there can be more than one (maxConditions)
      switch (sAllowedExpression) {
        case "SingleValue":
          const aSingleValueOps = sType === "Edm.Date" && bSemanticDateRange ? aSingleValueDateOps : aEqualsOps;
          restrictions = _getRestrictions(aDefaultOperators, aSingleValueOps);
          break;
        case "MultiValue":
          restrictions = _getRestrictions(aDefaultOperators, aEqualsOps);
          break;
        case "SingleRange":
          let aExpressionOps;
          if (bSemanticDateRange) {
            if (sType === "Edm.Date") {
              aExpressionOps = aSemanticDateOps;
            } else if (sType === "Edm.DateTimeOffset") {
              aExpressionOps = aSemanticDateOps;
            } else {
              aExpressionOps = aSingleRangeOps;
            }
          } else if (sType === "Edm.DateTimeOffset") {
            aExpressionOps = aSingleRangeDTBasicOps;
          } else {
            aExpressionOps = aSingleRangeOps;
          }
          const sOperators = _getRestrictions(aDefaultOperators, aExpressionOps);
          restrictions = sOperators;
          break;
        case "MultiRange":
          restrictions = _getRestrictions(aDefaultOperators, aMultiRangeOps);
          break;
        case "SearchExpression":
          restrictions = _getRestrictions(aDefaultOperators, aSearchExpressionOps);
          break;
        case "MultiRangeOrSearchExpression":
          restrictions = _getRestrictions(aDefaultOperators, aSearchExpressionOps.concat(aMultiRangeOps));
          break;
        default:
          break;
      }
      // In case AllowedExpressions is not recognised, undefined in return results in the default set of
      // operators for the type.
    }

    return restrictions;
  }

  /**
   * Method to return allowed operators for type Guid.
   *
   * @returns Allowed operators for type Guid
   */
  _exports.getOperatorsForProperty = getOperatorsForProperty;
  function getOperatorsForGuidProperty() {
    const allowedOperatorsForGuid = ["EQ", "NE"];
    return allowedOperatorsForGuid.toString();
  }
  function getOperatorsForDateProperty(propertyType) {
    // In case AllowedExpressions is not provided for type Edm.Date then all the default
    // operators for the type should be returned excluding semantic operators from the list.
    const aDefaultOperators = _getDefaultOperators(propertyType);
    const aMultiRangeOps = ["EQ", "GE", "LE", "LT", "GT", "BT", "NE", "NOTBT", "NOTLE", "NOTLT", "NOTGE", "NOTGT"];
    return _getRestrictions(aDefaultOperators, aMultiRangeOps);
  }
  function getParameterInfo(metaModelContext, sContextPath) {
    const sParameterContextPath = sContextPath.substring(0, sContextPath.lastIndexOf("/"));
    const bResultContext = metaModelContext.getObject(`${sParameterContextPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
    const oParameterInfo = {};
    if (bResultContext && sParameterContextPath !== sContextPath) {
      oParameterInfo.contextPath = sParameterContextPath;
      oParameterInfo.parameterProperties = CommonUtils.getContextPathProperties(metaModelContext, sParameterContextPath);
    }
    return oParameterInfo;
  }
  function addPageContextToSelectionVariant(oSelectionVariant, mPageContext, oView) {
    const oAppComponent = CommonUtils.getAppComponent(oView);
    const oNavigationService = oAppComponent.getNavigationService();
    return oNavigationService.mixAttributesAndSelectionVariant(mPageContext, oSelectionVariant.toJSONString());
  }
  function isStickyEditMode(oControl) {
    const bIsStickyMode = ModelHelper.isStickySessionSupported(oControl.getModel().getMetaModel());
    const bUIEditable = oControl.getModel("ui").getProperty("/isEditable");
    return bIsStickyMode && bUIEditable;
  }
  /**
   * Retrieves the user defaults from the startup app state (if available) or the startup parameter and sets them to a model.
   *
   * @param oAppComponent
   * @param aParameters
   * @param oModel
   * @param bIsAction
   * @param bIsCreate
   * @param oActionDefaultValues
   */
  async function setUserDefaults(oAppComponent, aParameters, oModel, bIsAction, bIsCreate, oActionDefaultValues) {
    const oComponentData = oAppComponent.getComponentData(),
      oStartupParameters = oComponentData && oComponentData.startupParameters || {},
      oShellServices = oAppComponent.getShellServices();
    const oStartupAppState = await oShellServices.getStartupAppState(oAppComponent);
    const oData = (oStartupAppState === null || oStartupAppState === void 0 ? void 0 : oStartupAppState.getData()) || {},
      aExtendedParameters = oData.selectionVariant && oData.selectionVariant.SelectOptions || [];
    aParameters.forEach(function (oParameter) {
      var _oParameter$getPath;
      const sPropertyName = bIsAction ? `/${oParameter.$Name}` : (_oParameter$getPath = oParameter.getPath) === null || _oParameter$getPath === void 0 ? void 0 : _oParameter$getPath.call(oParameter).slice(oParameter.getPath().lastIndexOf("/") + 1);
      const sParameterName = bIsAction ? sPropertyName.slice(1) : sPropertyName;
      if (oActionDefaultValues && bIsCreate) {
        if (oActionDefaultValues[sParameterName]) {
          oModel.setProperty(sPropertyName, oActionDefaultValues[sParameterName]);
        }
      } else if (oStartupParameters[sParameterName]) {
        oModel.setProperty(sPropertyName, oStartupParameters[sParameterName][0]);
      } else if (aExtendedParameters.length > 0) {
        for (const oExtendedParameter of aExtendedParameters) {
          if (oExtendedParameter.PropertyName === sParameterName) {
            const oRange = oExtendedParameter.Ranges.length ? oExtendedParameter.Ranges[oExtendedParameter.Ranges.length - 1] : undefined;
            if (oRange && oRange.Sign === "I" && oRange.Option === "EQ") {
              oModel.setProperty(sPropertyName, oRange.Low); // high is ignored when Option=EQ
            }
          }
        }
      }
    });
  }

  function getAdditionalParamsForCreate(oStartupParameters, oInboundParameters) {
    const oInbounds = oInboundParameters,
      aCreateParameters = oInbounds !== undefined ? Object.keys(oInbounds).filter(function (sParameter) {
        return oInbounds[sParameter].useForCreate;
      }) : [];
    let oRet;
    for (const element of aCreateParameters) {
      const sCreateParameter = element;
      const aValues = oStartupParameters && oStartupParameters[sCreateParameter];
      if (aValues && aValues.length === 1) {
        oRet = oRet || Object.create(null);
        oRet[sCreateParameter] = aValues[0];
      }
    }
    return oRet;
  }
  function getSemanticObjectMapping(oOutbound) {
    const aSemanticObjectMapping = [];
    if (oOutbound.parameters) {
      const aParameters = Object.keys(oOutbound.parameters) || [];
      if (aParameters.length > 0) {
        aParameters.forEach(function (sParam) {
          const oMapping = oOutbound.parameters[sParam];
          if (oMapping.value && oMapping.value.value && oMapping.value.format === "binding") {
            // using the format of UI.Mapping
            const oSemanticMapping = {
              LocalProperty: {
                $PropertyPath: oMapping.value.value
              },
              SemanticObjectProperty: sParam
            };
            if (aSemanticObjectMapping.length > 0) {
              // To check if the semanticObject Mapping is done for the same local property more that once then first one will be considered
              for (const element of aSemanticObjectMapping) {
                var _element$LocalPropert;
                if (((_element$LocalPropert = element.LocalProperty) === null || _element$LocalPropert === void 0 ? void 0 : _element$LocalPropert.$PropertyPath) !== oSemanticMapping.LocalProperty.$PropertyPath) {
                  aSemanticObjectMapping.push(oSemanticMapping);
                }
              }
            } else {
              aSemanticObjectMapping.push(oSemanticMapping);
            }
          }
        });
      }
    }
    return aSemanticObjectMapping;
  }
  function getHeaderFacetItemConfigForExternalNavigation(oViewData, oCrossNav) {
    const oHeaderFacetItems = {};
    let sId;
    const oControlConfig = oViewData.controlConfiguration;
    for (const config in oControlConfig) {
      if (config.includes("@com.sap.vocabularies.UI.v1.DataPoint") || config.includes("@com.sap.vocabularies.UI.v1.Chart")) {
        var _oControlConfig$confi, _oControlConfig$confi2;
        const sOutbound = (_oControlConfig$confi = oControlConfig[config].navigation) === null || _oControlConfig$confi === void 0 ? void 0 : (_oControlConfig$confi2 = _oControlConfig$confi.targetOutbound) === null || _oControlConfig$confi2 === void 0 ? void 0 : _oControlConfig$confi2.outbound;
        if (sOutbound !== undefined) {
          const oOutbound = oCrossNav[sOutbound];
          if (oOutbound.semanticObject && oOutbound.action) {
            if (config.includes("Chart")) {
              sId = generate(["fe", "MicroChartLink", config]);
            } else {
              sId = generate(["fe", "HeaderDPLink", config]);
            }
            const aSemanticObjectMapping = CommonUtils.getSemanticObjectMapping(oOutbound);
            oHeaderFacetItems[sId] = {
              semanticObject: oOutbound.semanticObject,
              action: oOutbound.action,
              semanticObjectMapping: aSemanticObjectMapping
            };
          } else {
            Log.error(`Cross navigation outbound is configured without semantic object and action for ${sOutbound}`);
          }
        }
      }
    }
    return oHeaderFacetItems;
  }
  function setSemanticObjectMappings(oSelectionVariant, vMappings) {
    const oMappings = typeof vMappings === "string" ? JSON.parse(vMappings) : vMappings;
    for (const element of oMappings) {
      const sLocalProperty = element["LocalProperty"] && element["LocalProperty"]["$PropertyPath"] || element["@com.sap.vocabularies.Common.v1.LocalProperty"] && element["@com.sap.vocabularies.Common.v1.LocalProperty"]["$Path"];
      const sSemanticObjectProperty = element["SemanticObjectProperty"] || element["@com.sap.vocabularies.Common.v1.SemanticObjectProperty"];
      const oSelectOption = oSelectionVariant.getSelectOption(sLocalProperty);
      if (oSelectOption) {
        //Create a new SelectOption with sSemanticObjectProperty as the property Name and remove the older one
        oSelectionVariant.removeSelectOption(sLocalProperty);
        oSelectionVariant.massAddSelectOption(sSemanticObjectProperty, oSelectOption);
      }
    }
    return oSelectionVariant;
  }
  async function fnGetSemanticObjectsFromPath(oMetaModel, sPath, sQualifier) {
    return new Promise(function (resolve) {
      let sSemanticObject, aSemanticObjectUnavailableActions;
      if (sQualifier === "") {
        sSemanticObject = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObject"}`);
        aSemanticObjectUnavailableActions = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`);
      } else {
        sSemanticObject = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObject"}#${sQualifier}`);
        aSemanticObjectUnavailableActions = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}#${sQualifier}`);
      }
      const aSemanticObjectForGetLinks = [{
        semanticObject: sSemanticObject
      }];
      const oSemanticObject = {
        semanticObject: sSemanticObject
      };
      resolve({
        semanticObjectPath: sPath,
        semanticObjectForGetLinks: aSemanticObjectForGetLinks,
        semanticObject: oSemanticObject,
        unavailableActions: aSemanticObjectUnavailableActions
      });
    });
  }
  async function fnUpdateSemanticTargetsModel(aGetLinksPromises, aSemanticObjects, oInternalModelContext, sCurrentHash) {
    return Promise.all(aGetLinksPromises).then(function (aValues) {
      let aLinks,
        _oLink,
        _sLinkIntentAction,
        aFinalLinks = [];
      let oFinalSemanticObjects = {};
      const bIntentHasActions = function (sIntent, aActions) {
        for (const intent in aActions) {
          if (intent === sIntent) {
            return true;
          } else {
            return false;
          }
        }
      };
      for (let k = 0; k < aValues.length; k++) {
        aLinks = aValues[k];
        if (aLinks && aLinks.length > 0 && aLinks[0] !== undefined) {
          const oSemanticObject = {};
          let oTmp;
          let sAlternatePath;
          for (let i = 0; i < aLinks.length; i++) {
            aFinalLinks.push([]);
            let hasTargetsNotFiltered = false;
            let hasTargets = false;
            for (const element of aLinks[i][0]) {
              _oLink = element;
              _sLinkIntentAction = _oLink && _oLink.intent.split("?")[0].split("-")[1];
              if (!(_oLink && _oLink.intent && _oLink.intent.indexOf(sCurrentHash) === 0)) {
                hasTargetsNotFiltered = true;
                if (!bIntentHasActions(_sLinkIntentAction, aSemanticObjects[k].unavailableActions)) {
                  aFinalLinks[i].push(_oLink);
                  hasTargets = true;
                }
              }
            }
            oTmp = {
              semanticObject: aSemanticObjects[k].semanticObject,
              path: aSemanticObjects[k].path,
              HasTargets: hasTargets,
              HasTargetsNotFiltered: hasTargetsNotFiltered
            };
            if (oSemanticObject[aSemanticObjects[k].semanticObject] === undefined) {
              oSemanticObject[aSemanticObjects[k].semanticObject] = {};
            }
            sAlternatePath = aSemanticObjects[k].path.replace(/\//g, "_");
            if (oSemanticObject[aSemanticObjects[k].semanticObject][sAlternatePath] === undefined) {
              oSemanticObject[aSemanticObjects[k].semanticObject][sAlternatePath] = {};
            }
            oSemanticObject[aSemanticObjects[k].semanticObject][sAlternatePath] = Object.assign(oSemanticObject[aSemanticObjects[k].semanticObject][sAlternatePath], oTmp);
          }
          const sSemanticObjectName = Object.keys(oSemanticObject)[0];
          if (Object.keys(oFinalSemanticObjects).includes(sSemanticObjectName)) {
            oFinalSemanticObjects[sSemanticObjectName] = Object.assign(oFinalSemanticObjects[sSemanticObjectName], oSemanticObject[sSemanticObjectName]);
          } else {
            oFinalSemanticObjects = Object.assign(oFinalSemanticObjects, oSemanticObject);
          }
          aFinalLinks = [];
        }
      }
      if (Object.keys(oFinalSemanticObjects).length > 0) {
        oInternalModelContext.setProperty("semanticsTargets", mergeObjects(oFinalSemanticObjects, oInternalModelContext.getProperty("semanticsTargets")));
        return oFinalSemanticObjects;
      }
    }).catch(function (oError) {
      Log.error("fnUpdateSemanticTargetsModel: Cannot read links", oError);
    });
  }
  async function fnGetSemanticObjectPromise(oAppComponent, oView, oMetaModel, sPath, sQualifier) {
    return CommonUtils.getSemanticObjectsFromPath(oMetaModel, sPath, sQualifier);
  }
  function fnPrepareSemanticObjectsPromises(_oAppComponent, _oView, _oMetaModel, _aSemanticObjectsFound, _aSemanticObjectsPromises) {
    let _Keys, sPath;
    let sQualifier, regexResult;
    for (const semanticObjectFound of _aSemanticObjectsFound) {
      sPath = semanticObjectFound;
      _Keys = Object.keys(_oMetaModel.getObject(sPath + "@"));
      for (const element of _Keys) {
        if (element.indexOf(`@${"com.sap.vocabularies.Common.v1.SemanticObject"}`) === 0 && !element.includes(`@${"com.sap.vocabularies.Common.v1.SemanticObjectMapping"}`) && !element.includes(`@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`)) {
          regexResult = /#(.*)/.exec(element);
          sQualifier = regexResult ? regexResult[1] : "";
          _aSemanticObjectsPromises.push(CommonUtils.getSemanticObjectPromise(_oAppComponent, _oView, _oMetaModel, sPath, sQualifier));
        }
      }
    }
  }
  function fnGetSemanticTargetsFromPageModel(oController, sPageModel) {
    const _fnfindValuesHelper = function (obj, key, list) {
      if (!obj) {
        return list;
      }
      if (obj instanceof Array) {
        obj.forEach(item => {
          list = list.concat(_fnfindValuesHelper(item, key, []));
        });
        return list;
      }
      if (obj[key]) {
        list.push(obj[key]);
      }
      if (typeof obj == "object" && obj !== null) {
        const children = Object.keys(obj);
        if (children.length > 0) {
          for (const element of children) {
            list = list.concat(_fnfindValuesHelper(obj[element], key, []));
          }
        }
      }
      return list;
    };
    const _fnfindValues = function (obj, key) {
      return _fnfindValuesHelper(obj, key, []);
    };
    const _fnDeleteDuplicateSemanticObjects = function (aSemanticObjectPath) {
      return aSemanticObjectPath.filter(function (value, index) {
        return aSemanticObjectPath.indexOf(value) === index;
      });
    };
    const oView = oController.getView();
    const oInternalModelContext = oView.getBindingContext("internal");
    if (oInternalModelContext) {
      const aSemanticObjectsPromises = [];
      const oComponent = oController.getOwnerComponent();
      const oAppComponent = Component.getOwnerComponentFor(oComponent);
      const oMetaModel = oAppComponent.getMetaModel();
      let oPageModel = oComponent.getModel(sPageModel).getData();
      if (JSON.stringify(oPageModel) === "{}") {
        oPageModel = oComponent.getModel(sPageModel)._getObject("/", undefined);
      }
      let aSemanticObjectsFound = _fnfindValues(oPageModel, "semanticObjectPath");
      aSemanticObjectsFound = _fnDeleteDuplicateSemanticObjects(aSemanticObjectsFound);
      const oShellServiceHelper = oAppComponent.getShellServices();
      let sCurrentHash = oShellServiceHelper.getHash();
      const aSemanticObjects = [];
      let _oSemanticObject;
      if (sCurrentHash && sCurrentHash.includes("?")) {
        // sCurrentHash can contain query string, cut it off!
        sCurrentHash = sCurrentHash.split("?")[0];
      }
      fnPrepareSemanticObjectsPromises(oAppComponent, oView, oMetaModel, aSemanticObjectsFound, aSemanticObjectsPromises);
      if (aSemanticObjectsPromises.length === 0) {
        return Promise.resolve();
      } else {
        Promise.all(aSemanticObjectsPromises).then(async function (aValues) {
          const aGetLinksPromises = [];
          let sSemObjExpression;
          const aSemanticObjectsResolved = aValues.filter(function (element) {
            if (element.semanticObject !== undefined && element.semanticObject.semanticObject && typeof element.semanticObject.semanticObject === "object") {
              sSemObjExpression = compileExpression(pathInModel(element.semanticObject.semanticObject.$Path));
              element.semanticObject.semanticObject = sSemObjExpression;
              element.semanticObjectForGetLinks[0].semanticObject = sSemObjExpression;
              return true;
            } else if (element) {
              return element.semanticObject !== undefined;
            } else {
              return false;
            }
          });
          for (const item of aSemanticObjectsResolved) {
            _oSemanticObject = item;
            if (_oSemanticObject && _oSemanticObject.semanticObject && !(_oSemanticObject.semanticObject.semanticObject.indexOf("{") === 0)) {
              aSemanticObjects.push({
                semanticObject: _oSemanticObject.semanticObject.semanticObject,
                unavailableActions: _oSemanticObject.unavailableActions,
                path: item.semanticObjectPath
              });
              aGetLinksPromises.push(oShellServiceHelper.getLinksWithCache([_oSemanticObject.semanticObjectForGetLinks]));
            }
          }
          return CommonUtils.updateSemanticTargets(aGetLinksPromises, aSemanticObjects, oInternalModelContext, sCurrentHash);
        }).catch(function (oError) {
          Log.error("fnGetSemanticTargetsFromTable: Cannot get Semantic Objects", oError);
        });
      }
    } else {
      return Promise.resolve();
    }
  }
  function getFilterAllowedExpression(oFilterRestrictionsAnnotation) {
    const mAllowedExpressions = {};
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation.FilterExpressionRestrictions !== undefined) {
      oFilterRestrictionsAnnotation.FilterExpressionRestrictions.forEach(function (oProperty) {
        if (oProperty.Property && oProperty.AllowedExpressions !== undefined) {
          //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
          if (mAllowedExpressions[oProperty.Property.$PropertyPath] !== undefined) {
            mAllowedExpressions[oProperty.Property.$PropertyPath].push(oProperty.AllowedExpressions);
          } else {
            mAllowedExpressions[oProperty.Property.$PropertyPath] = [oProperty.AllowedExpressions];
          }
        }
      });
    }
    return mAllowedExpressions;
  }
  function getFilterRestrictions(oFilterRestrictionsAnnotation, sRestriction) {
    let aProps = [];
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation[sRestriction]) {
      aProps = oFilterRestrictionsAnnotation[sRestriction].map(function (oProperty) {
        return oProperty.$PropertyPath;
      });
    }
    return aProps;
  }
  function _fetchPropertiesForNavPath(paths, navPath, props) {
    const navPathPrefix = navPath + "/";
    return paths.reduce((outPaths, pathToCheck) => {
      if (pathToCheck.startsWith(navPathPrefix)) {
        const outPath = pathToCheck.replace(navPathPrefix, "");
        if (!outPaths.includes(outPath)) {
          outPaths.push(outPath);
        }
      }
      return outPaths;
    }, props);
  }
  function getFilterRestrictionsByPath(entityPath, oContext) {
    const oRet = {
      RequiredProperties: [],
      NonFilterableProperties: [],
      FilterAllowedExpressions: {}
    };
    let oFilterRestrictions;
    const navigationText = "$NavigationPropertyBinding";
    const frTerm = "@Org.OData.Capabilities.V1.FilterRestrictions";
    const entityTypePathParts = entityPath.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entityTypePath = `/${entityTypePathParts.join("/")}/`;
    const entitySetPath = ModelHelper.getEntitySetPath(entityPath, oContext);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = oContext.getObject(`${entityTypePath}$ContainsTarget`);
    const containmentNavPath = !!isContainment && entityTypePathParts[entityTypePathParts.length - 1];

    //LEAST PRIORITY - Filter restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      oFilterRestrictions = oContext.getObject(`${entitySetPath}${frTerm}`);
      oRet.RequiredProperties = getFilterRestrictions(oFilterRestrictions, "RequiredProperties") || [];
      const resultContextCheck = oContext.getObject(`${entityTypePath}@com.sap.vocabularies.Common.v1.ResultContext`);
      if (!resultContextCheck) {
        oRet.NonFilterableProperties = getFilterRestrictions(oFilterRestrictions, "NonFilterableProperties") || [];
      }
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = getFilterAllowedExpression(oFilterRestrictions) || {};
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      // In case of containment we take entitySet provided as parent. And in case of normal we would remove the last navigation from entitySetPath.
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(`/${navigationText}/`)}`;
      //THIRD HIGHEST PRIORITY - Reading property path restrictions - Annotation at main entity but directly on navigation property path
      //e.g. Parent Customer with PropertyPath="Set/CityName" ContextPath: Customer/Set
      const oParentRet = {
        RequiredProperties: [],
        NonFilterableProperties: [],
        FilterAllowedExpressions: {}
      };
      if (!navPath.includes("%2F")) {
        const oParentFR = oContext.getObject(`${parentEntitySetPath}${frTerm}`);
        oRet.RequiredProperties = _fetchPropertiesForNavPath(getFilterRestrictions(oParentFR, "RequiredProperties") || [], navPath, oRet.RequiredProperties || []);
        oRet.NonFilterableProperties = _fetchPropertiesForNavPath(getFilterRestrictions(oParentFR, "NonFilterableProperties") || [], navPath, oRet.NonFilterableProperties || []);
        //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
        const completeAllowedExps = getFilterAllowedExpression(oParentFR) || {};
        oParentRet.FilterAllowedExpressions = Object.keys(completeAllowedExps).reduce((outProp, propPath) => {
          if (propPath.startsWith(navPath + "/")) {
            const outPropPath = propPath.replace(navPath + "/", "");
            outProp[outPropPath] = completeAllowedExps[propPath];
          }
          return outProp;
        }, {});
      }

      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions || {}, oParentRet.FilterAllowedExpressions || {});

      //SECOND HIGHEST priority - Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const oNavRestrictions = MetaModelFunction.getNavigationRestrictions(oContext, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      const oNavFilterRest = oNavRestrictions && oNavRestrictions["FilterRestrictions"];
      const navResReqProps = getFilterRestrictions(oNavFilterRest, "RequiredProperties") || [];
      oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navResReqProps));
      const navNonFilterProps = getFilterRestrictions(oNavFilterRest, "NonFilterableProperties") || [];
      oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navNonFilterProps));
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions || {}, getFilterAllowedExpression(oNavFilterRest) || {});

      //HIGHEST priority - Restrictions having target with navigation association entity
      // e.g. FR in "CustomerParameters/Set" ContextPath: "Customer/Set"
      const navAssociationEntityRest = oContext.getObject(`/${entityTypePathParts.join("/")}${frTerm}`);
      const navAssocReqProps = getFilterRestrictions(navAssociationEntityRest, "RequiredProperties") || [];
      oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navAssocReqProps));
      const navAssocNonFilterProps = getFilterRestrictions(navAssociationEntityRest, "NonFilterableProperties") || [];
      oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navAssocNonFilterProps));
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions, getFilterAllowedExpression(navAssociationEntityRest) || {});
    }
    return oRet;
  }
  async function templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier) {
    oOptions = oOptions || {};
    if (oModifier) {
      return oModifier.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions.view).then(function (oFragment) {
        // This is required as Flex returns an HTMLCollection as templating result in XML time.
        return oModifier.targets === "xmlTree" && oFragment.length > 0 ? oFragment[0] : oFragment;
      });
    } else {
      const oFragment = await XMLPreprocessor.process(XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment"), {
        name: sFragmentName
      }, oPreprocessorSettings);
      const oControl = oFragment.firstElementChild;
      if (!!oOptions.isXML && oControl) {
        return oControl;
      }
      return Fragment.load({
        id: oOptions.id,
        definition: oFragment,
        controller: oOptions.controller
      });
    }
  }
  function getSingletonPath(path, metaModel) {
    const parts = path.split("/").filter(Boolean),
      propertyName = parts.pop(),
      navigationPath = parts.join("/"),
      entitySet = navigationPath && metaModel.getObject(`/${navigationPath}`);
    if ((entitySet === null || entitySet === void 0 ? void 0 : entitySet.$kind) === "Singleton") {
      const singletonName = parts[parts.length - 1];
      return `/${singletonName}/${propertyName}`;
    }
    return undefined;
  }
  async function requestSingletonProperty(path, model) {
    if (!path || !model) {
      return Promise.resolve(null);
    }
    const metaModel = model.getMetaModel();
    // Find the underlying entity set from the property path and check whether it is a singleton.
    const resolvedPath = getSingletonPath(path, metaModel);
    if (resolvedPath) {
      const propertyBinding = model.bindProperty(resolvedPath);
      return propertyBinding.requestValue();
    }
    return Promise.resolve(null);
  }

  // Get the path for action parameters that is needed to read the annotations
  function getParameterPath(sPath, sParameter) {
    let sContext;
    if (sPath.includes("@$ui5.overload")) {
      sContext = sPath.split("@$ui5.overload")[0];
    } else {
      // For Unbound Actions in Action Parameter Dialogs
      const aAction = sPath.split("/0")[0].split(".");
      sContext = `/${aAction[aAction.length - 1]}/`;
    }
    return sContext + sParameter;
  }

  /**
   * Get resolved expression binding used for texts at runtime.
   *
   * @param expBinding
   * @param control
   * @returns A string after resolution.
   */
  function _fntranslatedTextFromExpBindingString(expBinding, control) {
    // The idea here is to create dummy element with the expresion binding.
    // Adding it as dependent to the view/control would propagate all the models to the dummy element and resolve the binding.
    // We remove the dummy element after that and destroy it.

    const anyResourceText = new AnyElement({
      anyText: expBinding
    });
    control.addDependent(anyResourceText);
    const resultText = anyResourceText.getAnyText();
    control.removeDependent(anyResourceText);
    anyResourceText.destroy();
    return resultText;
  }
  /**
   * Check if the current device has a small screen.
   *
   * @returns A Boolean.
   */
  function isSmallDevice() {
    return !Device.system.desktop || Device.resize.width <= 320;
  }
  /**
   * Get filter information for a SelectionVariant annotation.
   *
   * @param oControl The table/chart instance
   * @param selectionVariantPath Relative SelectionVariant annotation path
   * @param isChart
   * @returns Information on filters
   *  filters: array of sap.ui.model.filters
   * text: Text property of the SelectionVariant
   */

  function getFiltersInfoForSV(oControl, selectionVariantPath, isChart) {
    const sEntityTypePath = oControl.data("entityType"),
      oMetaModel = CommonUtils.getAppComponent(oControl).getMetaModel(),
      mPropertyFilters = {},
      aFilters = [],
      aPaths = [];
    let sText = "";
    let oSelectionVariant = oMetaModel.getObject(`${sEntityTypePath}${selectionVariantPath}`);
    // for chart the structure varies hence read it from main object
    if (isChart) {
      oSelectionVariant = oSelectionVariant.SelectionVariant;
    }
    if (oSelectionVariant) {
      sText = oSelectionVariant.Text;
      (oSelectionVariant.SelectOptions || []).filter(function (oSelectOption) {
        return oSelectOption && oSelectOption.PropertyName && oSelectOption.PropertyName.$PropertyPath;
      }).forEach(function (oSelectOption) {
        const sPath = oSelectOption.PropertyName.$PropertyPath;
        if (!aPaths.includes(sPath)) {
          aPaths.push(sPath);
        }
        for (const j in oSelectOption.Ranges) {
          var _oRange$Option, _oRange$Option$$EnumM;
          const oRange = oSelectOption.Ranges[j];
          mPropertyFilters[sPath] = (mPropertyFilters[sPath] || []).concat(new Filter(sPath, (_oRange$Option = oRange.Option) === null || _oRange$Option === void 0 ? void 0 : (_oRange$Option$$EnumM = _oRange$Option.$EnumMember) === null || _oRange$Option$$EnumM === void 0 ? void 0 : _oRange$Option$$EnumM.split("/").pop(), oRange.Low, oRange.High));
        }
      });
      for (const sPropertyPath in mPropertyFilters) {
        aFilters.push(new Filter({
          filters: mPropertyFilters[sPropertyPath],
          and: false
        }));
      }
    }
    return {
      properties: aPaths,
      filters: aFilters,
      text: sText
    };
  }
  function getConverterContextForPath(sMetaPath, oMetaModel, sEntitySet, oDiagnostics) {
    const oContext = oMetaModel.createBindingContext(sMetaPath);
    return ConverterContext === null || ConverterContext === void 0 ? void 0 : ConverterContext.createConverterContextForMacro(sEntitySet, oContext || oMetaModel, oDiagnostics, mergeObjects, undefined);
  }

  /**
   * This function returns an ID which should be used in the internal chart for the measure or dimension.
   * For standard cases, this is just the ID of the property.
   * If it is necessary to use another ID internally inside the chart (e.g. on duplicate property IDs) this method can be overwritten.
   * In this case, <code>getPropertyFromNameAndKind</code> needs to be overwritten as well.
   *
   * @param name ID of the property
   * @param kind Type of the property (measure or dimension)
   * @returns Internal ID for the sap.chart.Chart
   */
  function getInternalChartNameFromPropertyNameAndKind(name, kind) {
    return name.replace("_fe_" + kind + "_", "");
  }

  /**
   * This function returns an array of chart properties by remvoing _fe_groupable prefix.
   *
   * @param {Array} aFilters Chart filter properties
   * @returns Chart properties without prefixes
   */

  function getChartPropertiesWithoutPrefixes(aFilters) {
    aFilters.forEach(element => {
      if (element.sPath && element.sPath.includes("fe_groupable")) {
        element.sPath = CommonUtils.getInternalChartNameFromPropertyNameAndKind(element.sPath, "groupable");
      }
    });
    return aFilters;
  }

  /**
   * Gets the context of the DraftRoot path.
   * If a view has been created with the draft Root Path, this method returns its bindingContext.
   * Where no view is found a new created context is returned.
   * The new created context request the key of the entity in order to get the Etag of this entity.
   *
   * @param programmingModel
   * @param view
   * @param appComponent
   * @returns Returns a Promise
   */
  async function createRootContext(programmingModel, view, appComponent) {
    const context = view.getBindingContext();
    if (context) {
      const rootContextPath = programmingModel === ProgrammingModel.Draft ? ModelHelper.getDraftRootPath(context) : ModelHelper.getStickyRootPath(context);
      let simpleRootContext;
      if (rootContextPath) {
        var _appComponent$getRoot, _simpleRootContext;
        // Check if a view matches with the draft root path
        const existingBindingContextOnPage = (_appComponent$getRoot = appComponent.getRootViewController().getInstancedViews().find(pageView => {
          var _pageView$getBindingC;
          return ((_pageView$getBindingC = pageView.getBindingContext()) === null || _pageView$getBindingC === void 0 ? void 0 : _pageView$getBindingC.getPath()) === rootContextPath;
        })) === null || _appComponent$getRoot === void 0 ? void 0 : _appComponent$getRoot.getBindingContext();
        if (existingBindingContextOnPage) {
          return existingBindingContextOnPage;
        }
        const internalModel = view.getModel("internal");
        simpleRootContext = internalModel.getProperty("/simpleRootContext");
        if (((_simpleRootContext = simpleRootContext) === null || _simpleRootContext === void 0 ? void 0 : _simpleRootContext.getPath()) === rootContextPath) {
          return simpleRootContext;
        }
        const model = context.getModel();
        simpleRootContext = model.bindContext(rootContextPath).getBoundContext();
        await CommonUtils.waitForContextRequested(simpleRootContext);
        // Store this new created context to use it on the next iterations
        internalModel.setProperty("/simpleRootContext", simpleRootContext);
        return simpleRootContext;
      }
    }
  }
  const CommonUtils = {
    fireButtonPress: fnFireButtonPress,
    getTargetView: getTargetView,
    getCurrentPageView: getCurrentPageView,
    hasTransientContext: fnHasTransientContexts,
    updateRelatedAppsDetails: fnUpdateRelatedAppsDetails,
    getAppComponent: getAppComponent,
    getContextPathProperties: fnGetContextPathProperties,
    getParameterInfo: getParameterInfo,
    updateDataFieldForIBNButtonsVisibility: fnUpdateDataFieldForIBNButtonsVisibility,
    getEntitySetName: getEntitySetName,
    getActionPath: getActionPath,
    computeDisplayMode: computeDisplayMode,
    isStickyEditMode: isStickyEditMode,
    getOperatorsForProperty: getOperatorsForProperty,
    getOperatorsForDateProperty: getOperatorsForDateProperty,
    getOperatorsForGuidProperty: getOperatorsForGuidProperty,
    addPageContextToSelectionVariant: addPageContextToSelectionVariant,
    setUserDefaults: setUserDefaults,
    getIBNActions: fnGetIBNActions,
    getHeaderFacetItemConfigForExternalNavigation: getHeaderFacetItemConfigForExternalNavigation,
    getSemanticObjectMapping: getSemanticObjectMapping,
    setSemanticObjectMappings: setSemanticObjectMappings,
    getSemanticObjectPromise: fnGetSemanticObjectPromise,
    getSemanticTargetsFromPageModel: fnGetSemanticTargetsFromPageModel,
    getSemanticObjectsFromPath: fnGetSemanticObjectsFromPath,
    updateSemanticTargets: fnUpdateSemanticTargetsModel,
    waitForContextRequested: waitForContextRequested,
    getFilterRestrictionsByPath: getFilterRestrictionsByPath,
    getSpecificAllowedExpression: getSpecificAllowedExpression,
    getAdditionalParamsForCreate: getAdditionalParamsForCreate,
    requestSingletonProperty: requestSingletonProperty,
    templateControlFragment: templateControlFragment,
    FilterRestrictions: {
      REQUIRED_PROPERTIES: "RequiredProperties",
      NON_FILTERABLE_PROPERTIES: "NonFilterableProperties",
      ALLOWED_EXPRESSIONS: "FilterAllowedExpressions"
    },
    AllowedExpressionsPrio: ["SingleValue", "MultiValue", "SingleRange", "MultiRange", "SearchExpression", "MultiRangeOrSearchExpression"],
    normalizeSearchTerm: normalizeSearchTerm,
    setContextsBasedOnOperationAvailable: setContextsBasedOnOperationAvailable,
    setDynamicActionContexts: setDynamicActionContexts,
    requestProperty: requestProperty,
    getParameterPath: getParameterPath,
    getRelatedAppsMenuItems: _getRelatedAppsMenuItems,
    getTranslatedTextFromExpBindingString: _fntranslatedTextFromExpBindingString,
    updateRelateAppsModel: updateRelateAppsModel,
    getSemanticObjectAnnotations: _getSemanticObjectAnnotations,
    getFiltersInfoForSV: getFiltersInfoForSV,
    getInternalChartNameFromPropertyNameAndKind: getInternalChartNameFromPropertyNameAndKind,
    getChartPropertiesWithoutPrefixes: getChartPropertiesWithoutPrefixes,
    createRootContext: createRootContext,
    isSmallDevice,
    getConverterContextForPath
  };
  return CommonUtils;
}, false);
