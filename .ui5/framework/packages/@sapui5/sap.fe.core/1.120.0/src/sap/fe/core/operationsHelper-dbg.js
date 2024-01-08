/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/MessageBox", "sap/ui/core/message/Message", "sap/ui/model/json/JSONModel", "./controllerextensions/dialog/OperationsDialog.block", "./controllerextensions/messageHandler/messageHandling", "./formatters/TableFormatterTypes"], function (MessageBox, Message, JSONModel, OperationsDialogBlock, messageHandling, TableFormatterTypes) {
  "use strict";

  var MessageType = TableFormatterTypes.MessageType;
  function renderMessageView(mParameters, resourceModel, messageHandler, aMessages, strictHandlingUtilities, isMultiContext412, resolve, sGroupId, isUnboundAction) {
    const sActionName = mParameters.label;
    const oModel = mParameters.model;
    const strictHandlingPromises = strictHandlingUtilities === null || strictHandlingUtilities === void 0 ? void 0 : strictHandlingUtilities.strictHandlingPromises;
    let sMessage;
    let sCancelButtonTxt = resourceModel.getText("C_COMMON_DIALOG_CANCEL");
    let warningMessageText = "";
    let genericChangesetMessage = "";
    warningMessageText = mParameters.bGrouped ? resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGE_TEXT", [sActionName]) : resourceModel.getText("C_COMMON_DIALOG_SKIP_SINGLE_MESSAGE_TEXT");
    if (aMessages.length === 1) {
      const messageText = aMessages[0].getMessage();
      const identifierText = aMessages[0].getAdditionalText();
      genericChangesetMessage = resourceModel.getText("C_COMMON_DIALOG_CANCEL_SINGLE_MESSAGE_TEXT");
      if (!isMultiContext412) {
        sMessage = `${messageText}\n${resourceModel.getText("PROCEED")}`;
      } else if (identifierText !== undefined && identifierText !== "") {
        sCancelButtonTxt = mParameters.bGrouped ? sCancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        const sHeaderInfoTypeName = mParameters.control.getParent().getTableDefinition().headerInfoTypeName;
        if (sHeaderInfoTypeName) {
          sMessage = `${sHeaderInfoTypeName.toString()} ${identifierText}: ${messageText}\n\n${warningMessageText}`;
        } else {
          sMessage = `${identifierText}: ${messageText}\n\n${warningMessageText}`;
        }
      } else {
        sCancelButtonTxt = mParameters.bGrouped ? sCancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        sMessage = `${messageText}\n\n${warningMessageText}`;
      }
      if (isMultiContext412) {
        sMessage = `${genericChangesetMessage}\n\n${sMessage}`;
      }
      MessageBox.warning(sMessage, {
        title: resourceModel.getText("WARNING"),
        actions: [sActionName, sCancelButtonTxt],
        emphasizedAction: sActionName,
        onClose: function (sAction) {
          if (sAction === sActionName) {
            if (isUnboundAction) {
              // condition is true for unbound as well as static actions
              resolve(true);
              oModel.submitBatch(sGroupId);
              if (mParameters.requestSideEffects) {
                mParameters.requestSideEffects();
              }
            } else if (!isMultiContext412) {
              // condition true when mulitple contexts are selected but only one strict handling warning is recieved
              strictHandlingPromises[0].resolve(true);
              oModel.submitBatch(strictHandlingPromises[0].groupId);
              if (strictHandlingPromises[0].requestSideEffects) {
                strictHandlingPromises[0].requestSideEffects();
              }
            } else {
              strictHandlingPromises.forEach(function (sHPromise) {
                sHPromise.resolve(true);
                oModel.submitBatch(sHPromise.groupId);
                if (sHPromise.requestSideEffects) {
                  sHPromise.requestSideEffects();
                }
              });
              const strictHandlingFails = strictHandlingUtilities === null || strictHandlingUtilities === void 0 ? void 0 : strictHandlingUtilities.strictHandlingTransitionFails;
              if (strictHandlingFails.length > 0) {
                messageHandler === null || messageHandler === void 0 ? void 0 : messageHandler.removeTransitionMessages();
              }
            }
            if (strictHandlingUtilities) {
              strictHandlingUtilities.is412Executed = true;
            }
          } else {
            if (strictHandlingUtilities) {
              strictHandlingUtilities.is412Executed = false;
            }
            if (isUnboundAction) {
              resolve(false);
            } else if (!isMultiContext412) {
              strictHandlingPromises[0].resolve(false);
            } else {
              strictHandlingPromises.forEach(function (sHPromise) {
                sHPromise.resolve(false);
              });
            }
            if (mParameters.bGrouped) {
              MessageBox.information(resourceModel.getText("M_CHANGESET_CANCEL_MESSAGES"), {
                contentWidth: "150px"
              });
            }
          }
          if (strictHandlingUtilities) {
            strictHandlingUtilities.strictHandlingWarningMessages = [];
          }
        }
      });
    } else if (aMessages.length > 1) {
      if (isMultiContext412) {
        sCancelButtonTxt = mParameters.bGrouped ? sCancelButtonTxt : resourceModel.getText("C_COMMON_DIALOG_SKIP");
        const sWarningMessage = mParameters.bGrouped ? resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGES_WARNING") : resourceModel.getText("C_COMMON_DIALOG_SKIP_MESSAGES_WARNING");
        const sWarningDesc = mParameters.bGrouped ? resourceModel.getText("C_COMMON_DIALOG_CANCEL_MESSAGES_TEXT", [sActionName]) : resourceModel.getText("C_COMMON_DIALOG_SKIP_MESSAGES_TEXT", [sActionName]);
        const genericMessage = new Message({
          message: sWarningMessage,
          type: MessageType.Warning,
          target: undefined,
          persistent: true,
          description: sWarningDesc
        });
        aMessages = [genericMessage].concat(aMessages);
      }
      const oMessageDialogModel = new JSONModel();
      oMessageDialogModel.setData(aMessages);
      const bStrictHandlingFlow = true;
      const oMessageObject = messageHandling.prepareMessageViewForDialog(oMessageDialogModel, bStrictHandlingFlow, isMultiContext412);
      const operationsDialog = new OperationsDialogBlock({
        messageObject: oMessageObject,
        isMultiContext412: isMultiContext412,
        isGrouped: mParameters === null || mParameters === void 0 ? void 0 : mParameters.bGrouped,
        resolve: resolve,
        model: oModel,
        groupId: sGroupId,
        actionName: sActionName,
        strictHandlingUtilities: strictHandlingUtilities,
        strictHandlingPromises: strictHandlingPromises,
        messageHandler: messageHandler,
        messageDialogModel: oMessageDialogModel,
        cancelButtonTxt: sCancelButtonTxt,
        showMessageInfo: function showMessageInfo() {
          MessageBox.information(resourceModel.getText("M_CHANGESET_CANCEL_MESSAGES"), {
            contentWidth: "150px"
          });
        }
      });
      operationsDialog.open();
    }
  }
  async function fnOnStrictHandlingFailed(sGroupId, mParameters, resourceModel, currentContextIndex, oContext, iContextLength, messageHandler, strictHandlingUtilities, a412Messages) {
    let shPromiseParams;
    if (currentContextIndex === null && iContextLength === null || currentContextIndex === 1 && iContextLength === 1) {
      return new Promise(function (resolve) {
        operationsHelper.renderMessageView(mParameters, resourceModel, messageHandler, a412Messages, strictHandlingUtilities, false, resolve, sGroupId, true);
      });
    }
    if (a412Messages.length) {
      var _mParameters$control, _mParameters$control$;
      const strictHandlingPromise = new Promise(function (resolve) {
        shPromiseParams = {
          requestSideEffects: mParameters.requestSideEffects,
          resolve: resolve,
          groupId: sGroupId
        };
      });
      strictHandlingUtilities.strictHandlingPromises.push(shPromiseParams);
      // copy existing 412 warning messages
      const aStrictHandlingWarningMessages = strictHandlingUtilities.strictHandlingWarningMessages;
      const sColumn = (_mParameters$control = mParameters.control) === null || _mParameters$control === void 0 ? void 0 : (_mParameters$control$ = _mParameters$control.getParent()) === null || _mParameters$control$ === void 0 ? void 0 : _mParameters$control$.getIdentifierColumn();
      let sValue = "";
      if (sColumn && iContextLength && iContextLength > 1) {
        sValue = oContext && oContext.getObject(sColumn);
      }

      // set type and subtitle for all warning messages
      a412Messages.forEach(function (msg) {
        msg.setType("Warning");
        msg.setAdditionalText(sValue);
        aStrictHandlingWarningMessages.push(msg);
      });
      strictHandlingUtilities.strictHandlingWarningMessages = aStrictHandlingWarningMessages;
      mParameters.internalOperationsPromiseResolve();
      return strictHandlingPromise;
    }
  }
  const operationsHelper = {
    renderMessageView: renderMessageView,
    fnOnStrictHandlingFailed: fnOnStrictHandlingFailed
  };
  return operationsHelper;
}, false);
