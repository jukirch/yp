/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/fe/core/CommonUtils", "sap/fe/core/controls/Any", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/ActionHelper", "sap/ui/core/message/Message", "./controls/AnyElement", "./converters/ConverterContext", "./converters/MetaModelConverter", "./converters/objectPage/HeaderAndFooterAction"], function (merge, CommonUtils, Any, BindingToolkit, ModelHelper, TypeGuards, ActionHelper, Message, AnyElement, ConverterContext, MetaModelConverter, HeaderAndFooterAction) {
  "use strict";

  var getHiddenExpression = HeaderAndFooterAction.getHiddenExpression;
  var getEditButtonEnabled = HeaderAndFooterAction.getEditButtonEnabled;
  var convertTypes = MetaModelConverter.convertTypes;
  var getIsActionCriticalExpression = ActionHelper.getIsActionCriticalExpression;
  var isEntitySet = TypeGuards.isEntitySet;
  var transformRecursively = BindingToolkit.transformRecursively;
  var isConstant = BindingToolkit.isConstant;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var compileConstant = BindingToolkit.compileConstant;
  const ActionRuntime = {
    /**
     * Adds error messages for an action parameter field to the message manager.
     *
     * @param messageManager The active MessageManager instance
     * @param messageParameters Information identifying an action parameter and messages referring to this parameter
     */
    _addMessageForActionParameter: function (messageManager, messageParameters) {
      messageManager.addMessages(messageParameters.map(messageParameter => {
        const binding = messageParameter.actionParameterInfo.field.getBinding(messageParameter.actionParameterInfo.isMultiValue ? "items" : "value");
        return new Message({
          message: messageParameter.message,
          type: "Error",
          processor: binding === null || binding === void 0 ? void 0 : binding.getModel(),
          persistent: true,
          target: binding === null || binding === void 0 ? void 0 : binding.getResolvedPath()
        });
      }));
    },
    /**
     * Checks if all required action parameters contain data and checks for all action parameters if the
     * contained data is valid.
     *
     *
     * @param messageManager The active MessageManager instance
     * @param actionParameterInfos Information identifying an action parameter
     * @param resourceModel The model to load text resources
     * @returns The validation result can be true or false
     */
    validateProperties: async function (messageManager, actionParameterInfos, resourceModel) {
      await Promise.allSettled(actionParameterInfos.map(actionParameterInfo => actionParameterInfo.validationPromise));
      const requiredParameterInfos = actionParameterInfos.filter(parameterInfo => parameterInfo.field.getRequired());
      const allMessages = messageManager.getMessageModel().getData();
      const emptyRequiredFields = requiredParameterInfos.filter(requiredParameterInfo => {
        const fieldId = requiredParameterInfo.field.getId();
        const relevantMessages = allMessages.filter(msg => msg.getControlIds().some(controlId => controlId.includes(fieldId)));
        if (relevantMessages.length > 0) {
          return false;
        } else if (requiredParameterInfo.isMultiValue) {
          return requiredParameterInfo.value === undefined || !requiredParameterInfo.value.length;
        } else {
          const fieldValue = requiredParameterInfo.field.getValue();
          return fieldValue === undefined || fieldValue === null || fieldValue === "";
        }
      });
      /* Message for missing mandatory value of the action parameter */
      if (emptyRequiredFields.length) {
        this._addMessageForActionParameter(messageManager, emptyRequiredFields.map(actionParameterInfo => {
          var _actionParameterInfo$;
          return {
            actionParameterInfo: actionParameterInfo,
            message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [((_actionParameterInfo$ = actionParameterInfo.field.getParent()) === null || _actionParameterInfo$ === void 0 ? void 0 : _actionParameterInfo$.getAggregation("label")).getText()])
          };
        }));
      }
      /* Check value state of all parameters */
      const firstInvalidParameter = actionParameterInfos.find(parameterInfo => parameterInfo.hasError || parameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(parameterInfo));
      if (firstInvalidParameter) {
        firstInvalidParameter.field.focus();
        return false;
      } else {
        return true;
      }
    },
    /**
     * Sets the action enablement.
     *
     * @param oInternalModelContext Object containing the context model
     * @param oActionOperationAvailableMap Map containing the operation availability of actions
     * @param aSelectedContexts Array containing selected contexts of the chart
     * @param sControl Control name
     * @returns The action enablement promises
     */
    setActionEnablement: async function (oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, sControl) {
      const aPromises = [];
      for (const sAction in oActionOperationAvailableMap) {
        let aRequestPromises = [];
        oInternalModelContext.setProperty(sAction, false);
        const sProperty = oActionOperationAvailableMap[sAction];
        for (const element of aSelectedContexts) {
          const oSelectedContext = element;
          if (oSelectedContext) {
            const oContextData = oSelectedContext.getObject();
            if (sControl === "chart") {
              if (sProperty === null && !!oContextData[`#${sAction}`] || oSelectedContext.getObject(sProperty)) {
                //look for action advertisement if present and its value is not null
                oInternalModelContext.setProperty(sAction, true);
                break;
              }
            } else if (sControl === "table") {
              aRequestPromises = this._setActionEnablementForTable(oSelectedContext, oInternalModelContext, sAction, sProperty, aRequestPromises);
            }
          }
        }
        if (sControl === "table") {
          if (!aSelectedContexts.length) {
            oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
              bEnabled: false,
              aApplicable: [],
              aNotApplicable: []
            });
            aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, []));
          } else if (aSelectedContexts.length && typeof sProperty === "string") {
            // When all property values have been retrieved, set
            // The applicable and not-applicable selected contexts for each action and
            // The enabled property of the dynamic action in internal model context.
            aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises));
          }
        }
      }
      return Promise.all(aPromises);
    },
    setActionEnablementAfterPatch: function (oView, oListBinding, oInternalModelContext) {
      const oInternalModelContextData = oInternalModelContext === null || oInternalModelContext === void 0 ? void 0 : oInternalModelContext.getObject();
      const oControls = (oInternalModelContextData === null || oInternalModelContextData === void 0 ? void 0 : oInternalModelContextData.controls) || {};
      for (const sKey in oControls) {
        if (oControls[sKey] && oControls[sKey].controlId) {
          const oTable = oView.byId(sKey);
          if (oTable && oTable.isA("sap.ui.mdc.Table")) {
            const oRowBinding = oTable.getRowBinding();
            if (oRowBinding == oListBinding) {
              ActionRuntime.setActionEnablement(oTable.getBindingContext("internal"), JSON.parse(oTable.data("operationAvailableMap").customData), oTable.getSelectedContexts(), "table");
            }
          }
        }
      }
    },
    updateEditButtonVisibilityAndEnablement(oView) {
      var _oView$getViewData, _oView$getModel;
      const iViewLevel = (_oView$getViewData = oView.getViewData()) === null || _oView$getViewData === void 0 ? void 0 : _oView$getViewData.viewLevel,
        isEditable = (_oView$getModel = oView.getModel("ui")) === null || _oView$getModel === void 0 ? void 0 : _oView$getModel.getProperty("/isEditable");
      if (iViewLevel > 1 && isEditable !== true) {
        var _oContext$getModel$ge, _entitySet$annotation, _entitySet$annotation2;
        const oContext = oView.getBindingContext();
        const oAppComponent = CommonUtils.getAppComponent(oView);
        const sMetaPath = ModelHelper.getMetaPathForContext(oContext);
        const sEntitySet = ModelHelper.getRootEntitySetPath(sMetaPath);
        const metaContext = oContext === null || oContext === void 0 ? void 0 : (_oContext$getModel$ge = oContext.getModel().getMetaModel()) === null || _oContext$getModel$ge === void 0 ? void 0 : _oContext$getModel$ge.getContext(oContext === null || oContext === void 0 ? void 0 : oContext.getPath());
        const converterContext = ConverterContext === null || ConverterContext === void 0 ? void 0 : ConverterContext.createConverterContextForMacro(sEntitySet, metaContext, oAppComponent.getDiagnostics(), merge, undefined);
        const entitySet = converterContext.getEntitySet();
        const entityType = converterContext.getEntityType();
        let updateHidden;
        //Find the Update Hidden of the root entity set and bind the property to AnyElement, any changes in the path of the root UpdateHidden will be updated via the property, internal model context is updated based on the property
        const bUpdateHidden = isEntitySet(entitySet) && ((_entitySet$annotation = entitySet.annotations.UI) === null || _entitySet$annotation === void 0 ? void 0 : (_entitySet$annotation2 = _entitySet$annotation.UpdateHidden) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.valueOf());
        if (bUpdateHidden !== true) {
          updateHidden = ModelHelper.isUpdateHidden(entitySet, entityType);
        }
        //Find the operation available property of the root edit configuration and fetch the property using AnyElement
        const sEditEnableBinding = getEditButtonEnabled(converterContext);
        const draftRootPath = ModelHelper.getDraftRootPath(oContext);
        const sStickyRootPath = ModelHelper.getStickyRootPath(oContext);
        const sPath = draftRootPath || sStickyRootPath;
        const oInternalModelContext = oView.getBindingContext("internal");
        if (sPath) {
          const oRootContext = oView.getModel().bindContext(sPath).getBoundContext();
          if (updateHidden !== undefined) {
            const sHiddenExpression = compileExpression(equal(getHiddenExpression(converterContext, updateHidden), false));
            this.updateEditModelContext(sHiddenExpression, oView, oRootContext, "rootEditVisible", oInternalModelContext);
          }
          if (sEditEnableBinding) {
            this.updateEditModelContext(sEditEnableBinding, oView, oRootContext, "rootEditEnabled", oInternalModelContext);
          }
        }
      }
    },
    updateEditModelContext: function (sBindingExpression, oView, oRootContext, sProperty, oInternalModelContext) {
      if (sBindingExpression) {
        var _oHiddenElement$getMo, _oHiddenElement$getMo2, _oHiddenElement$getBi;
        const oHiddenElement = new AnyElement({
          anyText: sBindingExpression
        });
        oHiddenElement.setBindingContext(null);
        oView.addDependent(oHiddenElement);
        oHiddenElement.getBinding("anyText");
        const oContext = (_oHiddenElement$getMo = oHiddenElement.getModel()) === null || _oHiddenElement$getMo === void 0 ? void 0 : (_oHiddenElement$getMo2 = _oHiddenElement$getMo.bindContext(oRootContext.getPath(), oRootContext, {
          $$groupId: "$auto.Heroes"
        })) === null || _oHiddenElement$getMo2 === void 0 ? void 0 : _oHiddenElement$getMo2.getBoundContext();
        oHiddenElement.setBindingContext(oContext);
        oHiddenElement === null || oHiddenElement === void 0 ? void 0 : (_oHiddenElement$getBi = oHiddenElement.getBinding("anyText")) === null || _oHiddenElement$getBi === void 0 ? void 0 : _oHiddenElement$getBi.attachChange(oEvent => {
          const oNewValue = oEvent.getSource().getExternalValue();
          oInternalModelContext.setProperty(sProperty, oNewValue);
        });
      }
    },
    _setActionEnablementForTable: function (oSelectedContext, oInternalModelContext, sAction, sProperty, aRequestPromises) {
      // Reset all properties before computation
      oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
        bEnabled: false,
        aApplicable: [],
        aNotApplicable: []
      });
      // Note that non dynamic actions are not processed here. They are enabled because
      // one or more are selected and the second part of the condition in the templating
      // is then undefined and thus the button takes the default enabling, which is true!
      const aApplicable = [],
        aNotApplicable = [],
        sDynamicActionEnabledPath = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}/bEnabled`;
      if (typeof sProperty === "object" && sProperty !== null && sProperty !== undefined) {
        if (oSelectedContext) {
          const oContextData = oSelectedContext.getObject();
          const oTransformedBinding = transformRecursively(sProperty, "PathInModel",
          // eslint-disable-next-line no-loop-func
          function (oBindingExpression) {
            return oContextData ? constant(oContextData[oBindingExpression.path]) : constant(false);
          }, true);
          const sResult = compileExpression(oTransformedBinding);
          if (sResult === "true") {
            oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
            aApplicable.push(oSelectedContext);
          } else {
            aNotApplicable.push(oSelectedContext);
          }
        }
        CommonUtils.setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable);
      } else {
        const oContextData = oSelectedContext === null || oSelectedContext === void 0 ? void 0 : oSelectedContext.getObject();
        if (sProperty === null && !!oContextData[`#${sAction}`]) {
          //look for action advertisement if present and its value is not null
          oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
        } else if (oSelectedContext !== undefined) {
          // Collect promises to retrieve singleton or normal property value asynchronously
          aRequestPromises.push(CommonUtils.requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath));
        }
      }
      return aRequestPromises;
    },
    /**
     * Check if action is critical.
     *
     * @param metaModel MetaModel
     * @param path Path to the action
     * @param contexts Contexts in case of bound actions.
     * @returns Boolean indicating action is critical
     */
    getIsActionCritical: function (metaModel, path) {
      let contexts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      // default is true.
      let isActionCriticalValue = true;
      const convertedTypes = convertTypes(metaModel);
      const actionTargetResolution = convertedTypes.resolvePath(path);
      const actionTarget = actionTargetResolution.target;
      if (!actionTarget) {
        return isActionCriticalValue;
      }
      const isActionCriticalBindingExp = getIsActionCriticalExpression(actionTarget, convertedTypes);
      if (isConstant(isActionCriticalBindingExp)) {
        // Constant expression resolves to "true" or "false". But, we need boolean.
        isActionCriticalValue = compileConstant(isActionCriticalBindingExp, false, undefined, true);
      } else if (contexts.length > 0) {
        // We evaluate the value of the expression via a UI5 managed object instance.
        const anyObject = new Any({
          anyBoolean: compileExpression(isActionCriticalBindingExp)
        });
        anyObject.setModel(contexts[0].getModel());
        anyObject.setBindingContext(contexts[0]);
        isActionCriticalValue = anyObject.getBinding("anyBoolean").getExternalValue();
        anyObject.destroy();
      }
      return isActionCriticalValue;
    }
  };
  return ActionRuntime;
}, false);
