/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/message/Message"], function (Message) {
  "use strict";

  var _exports = {};
  /**
   * Adds error messages for an action parameter field to the message manager.
   *
   * @param messageManager The active MessageManager instance
   * @param messageParameters Information identifying an action parameter and messages refering to this parameter
   * @returns True if the action parameters contain valid data and the mandatory parameters are provided
   */
  // in case of missing mandaotory parameter, message currently differs per parameter, as it superfluously contains the label as parameter. Possiblky this could be removed in future, in that case, interface could be simplified to ActionParameterInfo[], string
  async function _addMessageForActionParameter(messageManager, messageParameters) {
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
  }

  /**
   * Checks if all required action parameters contain data and checks for all action parameters if the
   * contained data is valid.
   *
   *
   * @param messageManager The active MessageManager instance
   * @param actionParameterInfos Information identifying an action parameter
   * @param resourceModel The model to load text resources
   * @returns A promise that indicate if the properties are valid or not
   */
  _exports._addMessageForActionParameter = _addMessageForActionParameter;
  async function _validateProperties(messageManager, actionParameterInfos, resourceModel) {
    await Promise.allSettled(actionParameterInfos.map(actionParameterInfo => actionParameterInfo.validationPromise));
    const requiredParameterInfos = actionParameterInfos.filter(actionParameterInfo => actionParameterInfo.field.getRequired());

    /* Hint: The boolean false is a valid value */
    const emptyRequiredFields = requiredParameterInfos.filter(requiredParameterInfo => {
      if (requiredParameterInfo.isMultiValue) {
        return requiredParameterInfo.value === undefined || !requiredParameterInfo.value.length;
      } else {
        const fieldValue = requiredParameterInfo.field.getValue();
        return fieldValue === undefined || fieldValue === null || fieldValue === "";
      }
    });

    // message contains label per field for historical reason (originally, it was shown in additional popup, now it's directly added to the field)
    // if this was not the case (and hopefully, in future this might be subject to change), interface of _addMessageForActionParameter could be simplified to just pass emptyRequiredFields and a constant message here
    _addMessageForActionParameter(messageManager, emptyRequiredFields.map(actionParameterInfo => {
      var _actionParameterInfo$;
      return {
        actionParameterInfo: actionParameterInfo,
        message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [((_actionParameterInfo$ = actionParameterInfo.field.getParent()) === null || _actionParameterInfo$ === void 0 ? void 0 : _actionParameterInfo$.getAggregation("label")).getText()])
      };
    }));

    /* Check value state of all parameter */
    const firstInvalidActionParameter = actionParameterInfos.find(
    // unfortunately, _addMessageForActionParameter sets valueState only asynchroneously, thus checking emptyRequiredFields and hasError additionally:
    // - checking hasError: user has changed field to invalid value, validation promise has been rejected, therefore we are adding message to message model
    // which in turn sets value state to 'Error' but this last step might not have happened yet due to asynchronity in model.
    // - also checking value state: also out parameter of another action parameter could change field and it's value state without sending change event.

    actionParameterInfo => actionParameterInfo.hasError || actionParameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(actionParameterInfo));
    if (firstInvalidActionParameter) {
      firstInvalidActionParameter.field.focus();
      return false;
    } else {
      return true;
    }
  }
  _exports._validateProperties = _validateProperties;
  return _exports;
}, false);
