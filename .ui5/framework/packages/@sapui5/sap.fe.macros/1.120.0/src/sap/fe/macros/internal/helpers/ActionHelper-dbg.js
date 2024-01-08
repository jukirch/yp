/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/CommonHelper"], function (BindingHelper, BindingToolkit, TypeGuards, CommonHelper) {
  "use strict";

  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  const ActionHelper = {
    /**
     * Returns an array of actions that are not enabled with a multiple selection.
     *
     * @function
     * @name getMultiSelectDisabledActions
     * @param collections Array of records
     * @returns An array of action paths
     * @ui5-restricted
     */
    getMultiSelectDisabledActions(collections) {
      const multiSelectDisabledActions = [];
      const actions = (collections === null || collections === void 0 ? void 0 : collections.filter(collection => collection.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction")) ?? [];
      for (const action of actions) {
        const actionTarget = action === null || action === void 0 ? void 0 : action.ActionTarget;
        if ((actionTarget === null || actionTarget === void 0 ? void 0 : actionTarget.isBound) === true) {
          for (const parameter of actionTarget.parameters) {
            var _parameter$annotation, _parameter$annotation2;
            if (isPathAnnotationExpression((_parameter$annotation = parameter.annotations.UI) === null || _parameter$annotation === void 0 ? void 0 : _parameter$annotation.Hidden) || isPathAnnotationExpression((_parameter$annotation2 = parameter.annotations.Common) === null || _parameter$annotation2 === void 0 ? void 0 : _parameter$annotation2.FieldControl)) {
              multiSelectDisabledActions.push(actionTarget.name);
            }
          }
        }
      }
      return multiSelectDisabledActions;
    },
    /**
     * Method to get the expression for the 'press' event for the DataFieldForActionButton.
     *
     * @function
     * @name getPressEventDataFieldForActionButton
     * @param sId Control ID
     * @param oAction Action object
     * @param oParams Parameters
     * @param sOperationAvailableMap OperationAvailableMap as stringified JSON object
     * @returns The binding expression
     */
    getPressEventDataFieldForActionButton(sId, oAction, oParams, sOperationAvailableMap) {
      const sInvocationGrouping = oAction.InvocationGrouping && oAction.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
      oParams = oParams || {};
      oParams["invocationGrouping"] = CommonHelper.addSingleQuotes(sInvocationGrouping);
      oParams["controlId"] = CommonHelper.addSingleQuotes(sId);
      oParams["operationAvailableMap"] = CommonHelper.addSingleQuotes(sOperationAvailableMap);
      oParams["model"] = "${$source>/}.getModel()";
      oParams["label"] = oAction.Label && CommonHelper.addSingleQuotes(oAction.Label, true);
      return CommonHelper.generateFunction(".editFlow.invokeAction", CommonHelper.addSingleQuotes(oAction.Action), CommonHelper.objectToString(oParams));
    },
    /**
     * Return Number of contexts expression.
     *
     * @function
     * @name getNumberOfContextsExpression
     * @param vActionEnabled Status of action (single or multiselect)
     * @returns Number of contexts expression
     */
    getNumberOfContextsExpression(vActionEnabled) {
      let sNumberOfSelectedContexts;
      if (vActionEnabled === "single") {
        sNumberOfSelectedContexts = "${internal>numberOfSelectedContexts} === 1";
      } else {
        sNumberOfSelectedContexts = "${internal>numberOfSelectedContexts} > 0";
      }
      return sNumberOfSelectedContexts;
    },
    /**
     * Return UI Control (LineItem/Chart) Operation Available Map.
     *
     * @function
     * @name getOperationAvailableMap
     * @param aCollection Array of records
     * @param sControl Control name (lineItem / chart)
     * @param oContext Converter context
     * @returns The record containing all action names and their corresponding Core.OperationAvailable property paths
     */
    getOperationAvailableMap(aCollection, sControl, oContext) {
      let oOperationAvailableMap = {};
      if (aCollection) {
        aCollection.forEach(oRecord => {
          if (oRecord.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
            if (oRecord.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
              const actionName = oRecord.Action;
              if (!(actionName !== null && actionName !== void 0 && actionName.includes("/")) && !oRecord.Determining) {
                if (sControl === "table") {
                  oOperationAvailableMap = this._getOperationAvailableMapOfTable(oRecord, actionName, oOperationAvailableMap, oContext);
                } else if (sControl === "chart") {
                  oOperationAvailableMap = this._getOperationAvailableMapOfChart(actionName, oOperationAvailableMap, oContext);
                }
              }
            }
          }
        });
      }
      return oOperationAvailableMap;
    },
    /**
     * Return LineItem Action Operation Available Map.
     *
     * @function
     * @name _getOperationAvailableMapOfTable
     * @private
     * @param oDataFieldForAction Data field for action object
     * @param sActionName Action name
     * @param oOperationAvailableMap Operation available map object
     * @param oConverterContext Converter context object
     * @returns The record containing all action name of line item and the corresponding Core.OperationAvailable property path
     */
    _getOperationAvailableMapOfTable(oDataFieldForAction, sActionName, oOperationAvailableMap, oConverterContext) {
      var _actionTarget$annotat, _actionTarget$annotat2, _actionTarget$paramet;
      const actionTarget = oDataFieldForAction.ActionTarget;
      if ((actionTarget === null || actionTarget === void 0 ? void 0 : (_actionTarget$annotat = actionTarget.annotations) === null || _actionTarget$annotat === void 0 ? void 0 : (_actionTarget$annotat2 = _actionTarget$annotat.Core) === null || _actionTarget$annotat2 === void 0 ? void 0 : _actionTarget$annotat2.OperationAvailable) === null) {
        // We disabled action advertisement but kept it in the code for the time being
        //oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
      } else if (actionTarget !== null && actionTarget !== void 0 && (_actionTarget$paramet = actionTarget.parameters) !== null && _actionTarget$paramet !== void 0 && _actionTarget$paramet.length) {
        var _actionTarget$annotat3, _actionTarget$annotat4, _actionTarget$annotat5, _actionTarget$annotat6;
        const bindingParameterFullName = actionTarget.parameters[0].fullyQualifiedName,
          targetExpression = getExpressionFromAnnotation(actionTarget === null || actionTarget === void 0 ? void 0 : (_actionTarget$annotat3 = actionTarget.annotations) === null || _actionTarget$annotat3 === void 0 ? void 0 : (_actionTarget$annotat4 = _actionTarget$annotat3.Core) === null || _actionTarget$annotat4 === void 0 ? void 0 : _actionTarget$annotat4.OperationAvailable, [], undefined, path => bindingContextPathVisitor(path, oConverterContext.getConvertedTypes(), bindingParameterFullName));
        if (isPathInModelExpression(targetExpression)) {
          oOperationAvailableMap = this._addToMap(sActionName, targetExpression.path, oOperationAvailableMap);
        } else if ((actionTarget === null || actionTarget === void 0 ? void 0 : (_actionTarget$annotat5 = actionTarget.annotations) === null || _actionTarget$annotat5 === void 0 ? void 0 : (_actionTarget$annotat6 = _actionTarget$annotat5.Core) === null || _actionTarget$annotat6 === void 0 ? void 0 : _actionTarget$annotat6.OperationAvailable) !== undefined) {
          oOperationAvailableMap = this._addToMap(sActionName, targetExpression, oOperationAvailableMap);
        }
      }
      return oOperationAvailableMap;
    },
    /**
     * Return LineItem Action Operation Available Map.
     *
     * @function
     * @name _getOperationAvailableMapOfChart
     * @private
     * @param sActionName Action name
     * @param oOperationAvailableMap Operation available map object
     * @param oContext Context object
     * @returns The record containing all action name of chart and the corresponding Core.OperationAvailable property path
     */
    _getOperationAvailableMapOfChart(sActionName, oOperationAvailableMap, oContext) {
      let oResult = CommonHelper.getActionPath(oContext.context, false, sActionName, true);
      if (oResult === null) {
        oOperationAvailableMap = this._addToMap(sActionName, null, oOperationAvailableMap);
      } else {
        oResult = CommonHelper.getActionPath(oContext.context, false, sActionName);
        if (oResult.sProperty) {
          oOperationAvailableMap = this._addToMap(sActionName, oResult.sProperty.substr(oResult.sBindingParameter.length + 1), oOperationAvailableMap);
        }
      }
      return oOperationAvailableMap;
    },
    /**
     * Return Map.
     *
     * @function
     * @name _addToMap
     * @private
     * @param sKey Key
     * @param oValue Value
     * @param oMap Map object
     * @returns Map object
     */
    _addToMap(sKey, oValue, oMap) {
      if (sKey && oMap) {
        oMap[sKey] = oValue;
      }
      return oMap;
    }
  };
  return ActionHelper;
}, false);
