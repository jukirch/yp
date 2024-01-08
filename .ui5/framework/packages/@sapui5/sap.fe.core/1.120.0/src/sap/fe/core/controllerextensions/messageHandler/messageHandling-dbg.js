/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ResourceModelHelper", "sap/m/Bar", "sap/m/Button", "sap/m/Dialog", "sap/m/FormattedText", "sap/m/MessageBox", "sap/m/MessageItem", "sap/m/MessageToast", "sap/m/MessageView", "sap/m/Text", "sap/ui/core/Core", "sap/ui/core/IconPool", "sap/ui/core/format/DateFormat", "sap/ui/core/library", "sap/ui/core/message/Message", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter", "sap/ui/model/json/JSONModel"], function (ResourceModelHelper, Bar, Button, Dialog, FormattedText, MessageBox, MessageItem, MessageToast, MessageView, Text, Core, IconPool, DateFormat, CoreLib, Message, Filter, FilterOperator, Sorter, JSONModel) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  const MessageType = CoreLib.MessageType;
  let aMessageList = [];
  let aMessageDataList = [];
  let aResolveFunctions = [];
  let oDialog;
  let oBackButton;
  let oMessageView;
  function fnFormatTechnicalDetails() {
    let sPreviousGroupName;

    // Insert technical detail if it exists
    function insertDetail(oProperty) {
      return oProperty.property ? "( ${" + oProperty.property + '} ? ("<p>' + oProperty.property.substr(Math.max(oProperty.property.lastIndexOf("/"), oProperty.property.lastIndexOf(".")) + 1) + ' : " + ' + "${" + oProperty.property + '} + "</p>") : "" )' : "";
    }
    // Insert groupname if it exists
    function insertGroupName(oProperty) {
      let sHTML = "";
      if (oProperty.groupName && oProperty.property && oProperty.groupName !== sPreviousGroupName) {
        sHTML += "( ${" + oProperty.property + '} ? "<br><h3>' + oProperty.groupName + '</h3>" : "" ) + ';
        sPreviousGroupName = oProperty.groupName;
      }
      return sHTML;
    }

    // List of technical details to be shown
    function getPaths() {
      const sTD = "technicalDetails"; // name of property in message model data for technical details
      return [{
        groupName: "",
        property: `${sTD}/status`
      }, {
        groupName: "",
        property: `${sTD}/statusText`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ComponentId`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceId`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceRepository`
      }, {
        groupName: "Application",
        property: `${sTD}/error/@SAP__common.Application/ServiceVersion`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/Analysis`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/Note`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ErrorResolution/DetailedNote`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.ExceptionCategory`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.TimeStamp`
      }, {
        groupName: "ErrorResolution",
        property: `${sTD}/error/@SAP__common.TransactionId`
      }, {
        groupName: "Messages",
        property: `${sTD}/error/code`
      }, {
        groupName: "Messages",
        property: `${sTD}/error/message`
      }];
    }
    let sHTML = "Object.keys(" + "${technicalDetails}" + ').length > 0 ? "<h2>Technical Details</h2>" : "" ';
    getPaths().forEach(function (oProperty) {
      sHTML = `${sHTML + insertGroupName(oProperty)}${insertDetail(oProperty)} + `;
    });
    return sHTML;
  }
  function fnFormatDescription() {
    return "(${" + "description} ? (${" + 'description}) : "")';
  }
  /**
   * Calculates the highest priority message type(Error/Warning/Success/Information) from the available messages.
   *
   * @param [aMessages] Messages list
   * @returns Highest priority message from the available messages
   */
  function fnGetHighestMessagePriority(aMessages) {
    let sMessagePriority = MessageType.None;
    const iLength = aMessages.length;
    const oMessageCount = {
      Error: 0,
      Warning: 0,
      Success: 0,
      Information: 0
    };
    for (let i = 0; i < iLength; i++) {
      ++oMessageCount[aMessages[i].getType()];
    }
    if (oMessageCount[MessageType.Error] > 0) {
      sMessagePriority = MessageType.Error;
    } else if (oMessageCount[MessageType.Warning] > 0) {
      sMessagePriority = MessageType.Warning;
    } else if (oMessageCount[MessageType.Success] > 0) {
      sMessagePriority = MessageType.Success;
    } else if (oMessageCount[MessageType.Information] > 0) {
      sMessagePriority = MessageType.Information;
    }
    return sMessagePriority;
  }
  // function which modify e-Tag messages only.
  // returns : true, if any e-Tag message is modified, otherwise false.
  function fnModifyETagMessagesOnly(oMessageManager, oResourceBundle, concurrentEditFlag) {
    const aMessages = oMessageManager.getMessageModel().getObject("/");
    let bMessagesModified = false;
    let sEtagMessage = "";
    aMessages.forEach(function (oMessage, i) {
      const oTechnicalDetails = oMessage.getTechnicalDetails && oMessage.getTechnicalDetails();
      if (oTechnicalDetails && oTechnicalDetails.httpStatus === 412 && oTechnicalDetails.isConcurrentModification) {
        if (concurrentEditFlag) {
          sEtagMessage = sEtagMessage || oResourceBundle.getText("C_APP_COMPONENT_SAPFE_ETAG_TECHNICAL_ISSUES_CONCURRENT_MODIFICATION");
        } else {
          sEtagMessage = sEtagMessage || oResourceBundle.getText("C_APP_COMPONENT_SAPFE_ETAG_TECHNICAL_ISSUES");
        }
        oMessageManager.removeMessages(aMessages[i]);
        oMessage.setMessage(sEtagMessage);
        oMessage.target = "";
        oMessageManager.addMessages(oMessage);
        bMessagesModified = true;
      }
    });
    return bMessagesModified;
  }
  // Dialog close Handling
  function dialogCloseHandler() {
    oDialog.close();
    oBackButton.setVisible(false);
    aMessageList = [];
    const oMessageDialogModel = oMessageView.getModel();
    if (oMessageDialogModel) {
      oMessageDialogModel.setData({});
    }
    removeUnboundTransitionMessages();
  }
  function getRetryAfterMessage(oMessage, bMessageDialog) {
    const dNow = new Date();
    const oTechnicalDetails = oMessage.getTechnicalDetails();
    const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
    let sRetryAfterMessage;
    if (oTechnicalDetails && oTechnicalDetails.httpStatus === 503 && oTechnicalDetails.retryAfter) {
      const dRetryAfter = oTechnicalDetails.retryAfter;
      let oDateFormat;
      if (dNow.getFullYear() !== dRetryAfter.getFullYear()) {
        //different years
        oDateFormat = DateFormat.getDateTimeInstance({
          pattern: "MMMM dd, yyyy 'at' hh:mm a"
        });
        sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR", [oDateFormat.format(dRetryAfter)]);
      } else if (dNow.getFullYear() == dRetryAfter.getFullYear()) {
        //same year
        if (bMessageDialog) {
          //less than 2 min
          sRetryAfterMessage = `${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE")} ${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_DESC")}`;
        } else if (dNow.getMonth() !== dRetryAfter.getMonth() || dNow.getDate() !== dRetryAfter.getDate()) {
          oDateFormat = DateFormat.getDateTimeInstance({
            pattern: "MMMM dd 'at' hh:mm a"
          }); //different months or different days of same month
          sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR", [oDateFormat.format(dRetryAfter)]);
        } else {
          //same day
          oDateFormat = DateFormat.getDateTimeInstance({
            pattern: "hh:mm a"
          });
          sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR_DAY", [oDateFormat.format(dRetryAfter)]);
        }
      }
    }
    if (oTechnicalDetails && oTechnicalDetails.httpStatus === 503 && !oTechnicalDetails.retryAfter) {
      sRetryAfterMessage = oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_ERROR_NO_RETRY_AFTER");
    }
    return sRetryAfterMessage;
  }
  function prepareMessageViewForDialog(oMessageDialogModel, bStrictHandlingFlow, multi412) {
    let oMessageTemplate;
    if (!bStrictHandlingFlow) {
      const descriptionBinding = '{= ${description} ? "<html><body>" + ' + fnFormatDescription() + ' + "</html></body>" : "" }';
      const technicalDetailsBinding = '{= ${technicalDetails} ? "<html><body>" + ' + fnFormatTechnicalDetails() + ' + "</html></body>" : "" }';
      oMessageTemplate = new MessageItem(undefined, {
        counter: {
          path: "counter"
        },
        title: "{message}",
        subtitle: "{additionalText}",
        longtextUrl: "{descriptionUrl}",
        type: {
          path: "type"
        },
        groupName: "{headerName}",
        description: descriptionBinding + technicalDetailsBinding,
        markupDescription: true
      });
    } else if (multi412) {
      oMessageTemplate = new MessageItem(undefined, {
        counter: {
          path: "counter"
        },
        title: "{message}",
        subtitle: "{additionalText}",
        longtextUrl: "{descriptionUrl}",
        type: {
          path: "type"
        },
        description: "{description}",
        markupDescription: true
      });
    } else {
      oMessageTemplate = new MessageItem({
        title: "{message}",
        type: {
          path: "type"
        },
        longtextUrl: "{descriptionUrl}"
      });
    }
    oMessageView = new MessageView({
      showDetailsPageHeader: false,
      itemSelect: function () {
        oBackButton.setVisible(true);
      },
      items: {
        path: "/",
        template: oMessageTemplate
      }
    });
    oMessageView.setGroupItems(true);
    oBackButton = oBackButton || new Button({
      icon: IconPool.getIconURI("nav-back"),
      visible: false,
      press: function () {
        oMessageView.navigateBack();
        this.setVisible(false);
      }
    });
    // Update proper ETag Mismatch error
    oMessageView.setModel(oMessageDialogModel);
    return {
      oMessageView,
      oBackButton
    };
  }
  function showUnboundMessages(aCustomMessages, oContext, bShowBoundTransition, concurrentEditFlag, control, sActionName, bOnlyForTest, onBeforeShowMessage, viewType) {
    let aTransitionMessages = this.getMessages();
    const oMessageManager = Core.getMessageManager();
    let sHighestPriority;
    let sHighestPriorityText;
    const aFilters = [new Filter({
      path: "persistent",
      operator: FilterOperator.NE,
      value1: false
    })];
    let showMessageDialog = false,
      showMessageBox = false;
    if (bShowBoundTransition) {
      aTransitionMessages = aTransitionMessages.concat(getMessages(true, true));
      // we only want to show bound transition messages not bound state messages hence add a filter for the same
      aFilters.push(new Filter({
        path: "persistent",
        operator: FilterOperator.EQ,
        value1: true
      }));
      const fnCheckControlIdInDialog = function (aControlIds) {
        let index = Infinity,
          oControl = Core.byId(aControlIds[0]);
        const errorFieldControl = Core.byId(aControlIds[0]);
        while (oControl) {
          const fieldRankinDialog = oControl instanceof Dialog ? errorFieldControl.getParent().findElements(true).indexOf(errorFieldControl) : Infinity;
          if (oControl instanceof Dialog) {
            if (index > fieldRankinDialog) {
              index = fieldRankinDialog;
              // Set the focus to the dialog's control
              errorFieldControl.focus();
            }
            // messages with target inside sap.m.Dialog should not bring up the message dialog
            return false;
          }
          oControl = oControl.getParent();
        }
        return true;
      };
      aFilters.push(new Filter({
        path: "controlIds",
        test: fnCheckControlIdInDialog,
        caseSensitive: true
      }));
    } else {
      // only unbound messages have to be shown so add filter accordingly
      aFilters.push(new Filter({
        path: "target",
        operator: FilterOperator.EQ,
        value1: ""
      }));
    }
    if (aCustomMessages && aCustomMessages.length) {
      aCustomMessages.forEach(function (oMessage) {
        const messageCode = oMessage.code ? oMessage.code : "";
        oMessageManager.addMessages(new Message({
          message: oMessage.text,
          type: oMessage.type,
          target: "",
          persistent: true,
          code: messageCode
        }));
        //The target and persistent properties of the message are hardcoded as "" and true because the function deals with only unbound messages.
      });
    }

    const oMessageDialogModel = oMessageView && oMessageView.getModel() || new JSONModel();
    const bHasEtagMessage = this.modifyETagMessagesOnly(oMessageManager, Core.getLibraryResourceBundle("sap.fe.core"), concurrentEditFlag);
    if (aTransitionMessages.length === 1 && aTransitionMessages[0].getCode() === "503") {
      showMessageBox = true;
    } else if (aTransitionMessages.length !== 0) {
      showMessageDialog = true;
    }
    let showMessageParameters;
    let aModelDataArray = [];
    if (showMessageDialog || !showMessageBox && !onBeforeShowMessage) {
      const oListBinding = oMessageManager.getMessageModel().bindList("/", undefined, undefined, aFilters),
        aCurrentContexts = oListBinding.getCurrentContexts();
      if (aCurrentContexts && aCurrentContexts.length > 0) {
        showMessageDialog = true;
        // Don't show dialog incase there are no errors to show

        // if false, show messages in dialog
        // As fitering has already happened here hence
        // using the message model again for the message dialog view and then filtering on that binding again is unnecessary.
        // So we create new json model to use for the message dialog view.
        const aMessages = [];
        aCurrentContexts.forEach(function (currentContext) {
          const oMessage = currentContext.getObject();
          aMessages.push(oMessage);
          aMessageDataList = aMessages;
        });
        let existingMessages = [];
        if (Array.isArray(oMessageDialogModel.getData())) {
          existingMessages = oMessageDialogModel.getData();
        }
        const oUniqueObj = {};
        aModelDataArray = aMessageDataList.concat(existingMessages).filter(function (obj) {
          // remove entries having duplicate message ids
          return !oUniqueObj[obj.id] && (oUniqueObj[obj.id] = true);
        });
        oMessageDialogModel.setData(aModelDataArray);
      }
    }
    if (onBeforeShowMessage) {
      showMessageParameters = {
        showMessageBox,
        showMessageDialog
      };
      showMessageParameters = onBeforeShowMessage(aTransitionMessages, showMessageParameters);
      showMessageBox = showMessageParameters.showMessageBox;
      showMessageDialog = showMessageParameters.showMessageDialog;
      if (showMessageDialog || showMessageParameters.showChangeSetErrorDialog) {
        aModelDataArray = showMessageParameters.filteredMessages ? showMessageParameters.filteredMessages : aModelDataArray;
      }
    }
    if (aTransitionMessages.length === 0 && !aCustomMessages && !bHasEtagMessage) {
      // Don't show the popup if there are no transient messages
      return Promise.resolve(true);
    } else if (aTransitionMessages.length === 1 && aTransitionMessages[0].getType() === MessageType.Success && !aCustomMessages) {
      return new Promise(resolve => {
        MessageToast.show(aTransitionMessages[0].message);
        if (oMessageDialogModel) {
          oMessageDialogModel.setData({});
        }
        oMessageManager.removeMessages(aTransitionMessages);
        resolve();
      });
    } else if (showMessageDialog && aModelDataArray.length) {
      messageHandling.updateMessageObjectGroupName(aModelDataArray, control, sActionName, viewType);
      oMessageDialogModel.setData(aModelDataArray); // set the messages here so that if any of them are filtered for APD, they are filtered here as well.
      aResolveFunctions = aResolveFunctions || [];
      return new Promise(function (resolve, reject) {
        aResolveFunctions.push(resolve);
        Core.getLibraryResourceBundle("sap.fe.core", true).then(function (oResourceBundle) {
          const bStrictHandlingFlow = false;
          if (showMessageParameters && showMessageParameters.fnGetMessageSubtitle) {
            oMessageDialogModel.getData().forEach(function (oMessage) {
              showMessageParameters.fnGetMessageSubtitle(oMessage);
            });
          }
          const oMessageObject = prepareMessageViewForDialog(oMessageDialogModel, bStrictHandlingFlow);
          const oSorter = new Sorter("", undefined, undefined, (obj1, obj2) => {
            const rankA = getMessageRank(obj1);
            const rankB = getMessageRank(obj2);
            if (rankA < rankB) {
              return -1;
            }
            if (rankA > rankB) {
              return 1;
            }
            return 0;
          });
          oMessageObject.oMessageView.getBinding("items").sort(oSorter);
          oDialog = oDialog && oDialog.isOpen() ? oDialog : new Dialog({
            resizable: true,
            endButton: new Button({
              press: function () {
                dialogCloseHandler();
                // also remove bound transition messages if we were showing them
                oMessageManager.removeMessages(aModelDataArray);
              },
              text: oResourceBundle.getText("C_COMMON_SAPFE_CLOSE")
            }),
            customHeader: new Bar({
              contentMiddle: [new Text({
                text: oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE")
              })],
              contentLeft: [oBackButton]
            }),
            contentWidth: "37.5em",
            contentHeight: "21.5em",
            verticalScrolling: false,
            closeOnNavigation: false,
            afterClose: function () {
              for (let i = 0; i < aResolveFunctions.length; i++) {
                aResolveFunctions[i].call();
              }
              aResolveFunctions = [];
            }
          });
          oDialog.removeAllContent();
          oDialog.addContent(oMessageObject.oMessageView);
          if (bHasEtagMessage) {
            sap.ui.require(["sap/m/ButtonType"], function (ButtonType) {
              oDialog.setBeginButton(new Button({
                press: function () {
                  dialogCloseHandler();
                  if (oContext.hasPendingChanges()) {
                    oContext.getBinding().resetChanges();
                  }
                  oContext.refresh();
                },
                text: oResourceBundle.getText("C_COMMON_SAPFE_REFRESH"),
                type: ButtonType.Emphasized
              }));
            });
          } else {
            oDialog.destroyBeginButton();
          }
          sHighestPriority = fnGetHighestMessagePriority(oMessageView.getItems());
          sHighestPriorityText = getTranslatedTextForMessageDialog(sHighestPriority);
          oDialog.setState(sHighestPriority);
          oDialog.getCustomHeader().getContentMiddle()[0].setText(sHighestPriorityText);
          oMessageView.navigateBack();
          oDialog.open();
          if (bOnlyForTest) {
            resolve(oDialog);
          }
        }).catch(reject);
      });
    } else if (showMessageBox) {
      return new Promise(function (resolve) {
        const oMessage = aTransitionMessages[0];
        if (oMessage.technicalDetails && !aMessageList.includes(oMessage.technicalDetails.originalMessage.message) || showMessageParameters && showMessageParameters.showChangeSetErrorDialog) {
          if (!showMessageParameters || !showMessageParameters.showChangeSetErrorDialog) {
            aMessageList.push(oMessage.technicalDetails.originalMessage.message);
          }
          let formattedTextString = "<html><body>";
          const retryAfterMessage = getRetryAfterMessage(oMessage, true);
          if (retryAfterMessage) {
            formattedTextString = `<h6>${retryAfterMessage}</h6><br>`;
          }
          if (showMessageParameters && showMessageParameters.fnGetMessageSubtitle) {
            showMessageParameters.fnGetMessageSubtitle(oMessage);
          }
          if (oMessage.getCode() !== "503" && oMessage.getAdditionalText() !== undefined) {
            formattedTextString = `${formattedTextString + oMessage.getAdditionalText()}: ${oMessage.getMessage()}</html></body>`;
          } else {
            formattedTextString = `${formattedTextString + oMessage.getMessage()}</html></body>`;
          }
          const formattedText = new FormattedText({
            htmlText: formattedTextString
          });
          MessageBox.error(formattedText, {
            onClose: function () {
              aMessageList = [];
              if (bShowBoundTransition) {
                removeBoundTransitionMessages();
              }
              removeUnboundTransitionMessages();
              resolve(true);
            }
          });
        }
      });
    } else {
      return Promise.resolve(true);
    }
  }

  /**
   * This function sets the group name for all messages in a dialog.
   *
   * @param aModelDataArray Messages array
   * @param control
   * @param sActionName
   * @param viewType
   */
  function updateMessageObjectGroupName(aModelDataArray, control, sActionName, viewType) {
    aModelDataArray.forEach(aModelData => {
      var _aModelData$target, _aModelData$getCode, _aModelData$target2;
      aModelData["headerName"] = "";
      if (!((_aModelData$target = aModelData.target) !== null && _aModelData$target !== void 0 && _aModelData$target.length) && ((_aModelData$getCode = aModelData.getCode) === null || _aModelData$getCode === void 0 ? void 0 : _aModelData$getCode.call(aModelData)) !== "FE_CUSTOM_MESSAGE_CHANGESET_ALL_FAILED") {
        // unbound transiiton messages
        const generalGroupText = Core.getLibraryResourceBundle("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
        aModelData["headerName"] = generalGroupText;
      } else if ((_aModelData$target2 = aModelData.target) !== null && _aModelData$target2 !== void 0 && _aModelData$target2.length) {
        // LR flow
        if (viewType === "ListReport" && control !== null && control !== void 0 && control.isA("sap.ui.mdc.Table")) {
          messageHandling.setGroupNameLRTable(control, aModelData, sActionName);
        } else if (viewType === "ObjectPage") {
          // OP Display mode
          messageHandling.setGroupNameOPDisplayMode(aModelData, sActionName, control);
        } else {
          aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
        }
      }
    });
  }

  /**
   * This function will set the group name of Message Object for LR table.
   *
   * @param oElem
   * @param aModelData
   * @param sActionName
   */
  function setGroupNameLRTable(oElem, aModelData, sActionName) {
    const oRowBinding = oElem && oElem.getRowBinding();
    if (oRowBinding) {
      var _aModelData$target3;
      const sElemeBindingPath = `${oElem.getRowBinding().getPath()}`;
      if (((_aModelData$target3 = aModelData.target) === null || _aModelData$target3 === void 0 ? void 0 : _aModelData$target3.indexOf(sElemeBindingPath)) === 0) {
        const allRowContexts = oRowBinding.getCurrentContexts();
        allRowContexts.forEach(rowContext => {
          var _aModelData$target4;
          if ((_aModelData$target4 = aModelData.target) !== null && _aModelData$target4 !== void 0 && _aModelData$target4.includes(rowContext.getPath())) {
            const contextPath = `${rowContext.getPath()}/`;
            const identifierColumn = oElem.getParent().getIdentifierColumn();
            const rowIdentifier = identifierColumn && rowContext.getObject()[identifierColumn];
            const columnPropertyName = messageHandling.getTableColProperty(oElem, aModelData, contextPath);
            const {
              sTableTargetColName
            } = messageHandling.getTableColInfo(oElem, columnPropertyName);

            // if target has some column name and column is visible in UI
            if (columnPropertyName && sTableTargetColName) {
              // header will be row Identifier, if found from above code otherwise it should be table name
              aModelData["headerName"] = rowIdentifier ? ` ${rowIdentifier}` : oElem.getHeader();
            } else {
              // if column data not found (may be the column is hidden), add grouping as Last Action
              aModelData["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
            }
          }
        });
      }
    }
  }

  /**
   * This function will set the group name of Message Object in OP Display mode.
   *
   * @param aModelData Message Object
   * @param sActionName  Action name
   * @param control
   */
  function setGroupNameOPDisplayMode(aModelData, sActionName, control) {
    const oViewContext = control === null || control === void 0 ? void 0 : control.getBindingContext();
    const opLayout = (control === null || control === void 0 ? void 0 : control.getContent) && (control === null || control === void 0 ? void 0 : control.getContent()[0]);
    let bIsGeneralGroupName = true;
    if (opLayout) {
      messageHandling.getVisibleSectionsFromObjectPageLayout(opLayout).forEach(function (oSection) {
        const subSections = oSection.getSubSections();
        subSections.forEach(function (oSubSection) {
          oSubSection.findElements(true).forEach(function (oElem) {
            if (oElem.isA("sap.ui.mdc.Table")) {
              const oRowBinding = oElem.getRowBinding(),
                setSectionNameInGroup = true;
              let childTableElement;
              oElem.findElements(true).forEach(oElement => {
                if (oElement.isA("sap.m.Table") || oElement.isA("sap.ui.table.Table")) {
                  childTableElement = oElement;
                }
              });
              if (oRowBinding) {
                var _oElem$getRowBinding, _aModelData$target5;
                const sElemeBindingPath = `${oViewContext === null || oViewContext === void 0 ? void 0 : oViewContext.getPath()}/${(_oElem$getRowBinding = oElem.getRowBinding()) === null || _oElem$getRowBinding === void 0 ? void 0 : _oElem$getRowBinding.getPath()}`;
                if (((_aModelData$target5 = aModelData.target) === null || _aModelData$target5 === void 0 ? void 0 : _aModelData$target5.indexOf(sElemeBindingPath)) === 0) {
                  const obj = messageHandling.getTableColumnDataAndSetSubtile(aModelData, oElem, childTableElement, oRowBinding, sActionName, setSectionNameInGroup, fnCallbackSetGroupName);
                  const {
                    oTargetTableInfo
                  } = obj;
                  if (setSectionNameInGroup) {
                    const identifierColumn = oElem.getParent().getIdentifierColumn();
                    if (identifierColumn) {
                      const allRowContexts = oElem.getRowBinding().getContexts();
                      allRowContexts.forEach(rowContext => {
                        var _aModelData$target6;
                        if ((_aModelData$target6 = aModelData.target) !== null && _aModelData$target6 !== void 0 && _aModelData$target6.includes(rowContext.getPath())) {
                          const rowIdentifier = identifierColumn ? rowContext.getObject()[identifierColumn] : undefined;
                          aModelData["additionalText"] = `${rowIdentifier}, ${oTargetTableInfo.sTableTargetColName}`;
                        }
                      });
                    } else {
                      aModelData["additionalText"] = `${oTargetTableInfo.sTableTargetColName}`;
                    }
                    let headerName = oElem.getHeaderVisible() && oTargetTableInfo.tableHeader;
                    if (!headerName) {
                      headerName = oSubSection.getTitle();
                    } else {
                      const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
                      headerName = `${oResourceBundle.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${headerName}`;
                    }
                    aModelData["headerName"] = headerName;
                    bIsGeneralGroupName = false;
                  }
                }
              }
            }
          });
        });
      });
    }
    if (bIsGeneralGroupName) {
      var _aModelData$target7;
      const sElemeBindingPath = `${oViewContext === null || oViewContext === void 0 ? void 0 : oViewContext.getPath()}`;
      if (((_aModelData$target7 = aModelData.target) === null || _aModelData$target7 === void 0 ? void 0 : _aModelData$target7.indexOf(sElemeBindingPath)) === 0) {
        // check if OP context path is part of target, set Last Action as group name
        const headerName = messageHandling.getLastActionTextAndActionName(sActionName);
        aModelData["headerName"] = headerName;
      } else {
        const generalGroupText = Core.getLibraryResourceBundle("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
        aModelData["headerName"] = generalGroupText;
      }
    }
  }
  function getLastActionTextAndActionName(sActionName) {
    const sLastActionText = Core.getLibraryResourceBundle("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_LAST_ACTION");
    return sActionName ? `${sLastActionText}: ${sActionName}` : "";
  }

  /**
   * This function will give rank based on Message Group/Header name, which will be used for Sorting messages in Message dialog
   * Last Action should be shown at top, next Row Id and last General.
   *
   * @param obj
   * @returns Rank of message
   */
  function getMessageRank(obj) {
    var _obj$headerName, _obj$headerName2;
    if ((_obj$headerName = obj.headerName) !== null && _obj$headerName !== void 0 && _obj$headerName.toString().includes("Last Action")) {
      return 1;
    } else if ((_obj$headerName2 = obj.headerName) !== null && _obj$headerName2 !== void 0 && _obj$headerName2.toString().includes("General")) {
      return 3;
    } else {
      return 2;
    }
  }

  /**
   * This function will set the group name which can either General or Last Action.
   *
   * @param aMessage
   * @param sActionName
   * @param bIsGeneralGroupName
   */
  const fnCallbackSetGroupName = (aMessage, sActionName, bIsGeneralGroupName) => {
    if (bIsGeneralGroupName) {
      const sGeneralGroupText = Core.getLibraryResourceBundle("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
      aMessage["headerName"] = sGeneralGroupText;
    } else {
      aMessage["headerName"] = messageHandling.getLastActionTextAndActionName(sActionName);
    }
  };

  /**
   * This function will get the table row/column info and set subtitle.
   *
   * @param aMessage
   * @param oTable
   * @param oElement
   * @param oRowBinding
   * @param sActionName
   * @param setSectionNameInGroup
   * @param fnSetGroupName
   * @returns Table info and Subtitle.
   */
  function getTableColumnDataAndSetSubtile(aMessage, oTable, oElement, oRowBinding, sActionName, setSectionNameInGroup, fnSetGroupName) {
    const oTargetTableInfo = messageHandling.getTableAndTargetInfo(oTable, aMessage, oElement, oRowBinding);
    oTargetTableInfo.tableHeader = oTable.getHeader();
    let sControlId, bIsCreationRow;
    if (!oTargetTableInfo.oTableRowContext) {
      sControlId = aMessage.getControlIds().find(function (sId) {
        return messageHandling.isControlInTable(oTable, sId);
      });
    }
    if (sControlId) {
      const oControl = Core.byId(sControlId);
      bIsCreationRow = messageHandling.isControlPartOfCreationRow(oControl);
    }
    if (!oTargetTableInfo.sTableTargetColName) {
      // if the column is not present on UI or the target does not have a table field in it, use Last Action for grouping
      if (aMessage.persistent && sActionName) {
        fnSetGroupName(aMessage, sActionName);
        setSectionNameInGroup = false;
      }
    }
    const subTitle = messageHandling.getMessageSubtitle(aMessage, oTargetTableInfo.oTableRowBindingContexts, oTargetTableInfo.oTableRowContext, oTargetTableInfo.sTableTargetColName, oTable, bIsCreationRow);
    return {
      oTargetTableInfo,
      subTitle
    };
  }

  /**
   * This function will create the subtitle based on Table Row/Column data.
   *
   * @param message
   * @param oTableRowBindingContexts
   * @param oTableRowContext
   * @param sTableTargetColName
   * @param oTable
   * @param bIsCreationRow
   * @param oTargetedControl
   * @returns Message subtitle.
   */
  function getMessageSubtitle(message, oTableRowBindingContexts, oTableRowContext, sTableTargetColName, oTable, bIsCreationRow, oTargetedControl) {
    let sMessageSubtitle;
    let sRowSubtitleValue;
    const resourceModel = getResourceModel(oTable);
    const sTableFirstColProperty = oTable.getParent().getIdentifierColumn();
    const oColFromTableSettings = messageHandling.fetchColumnInfo(message, oTable);
    if (bIsCreationRow || oTableRowContext !== null && oTableRowContext !== void 0 && oTableRowContext.isInactive()) {
      sMessageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_CREATION_ROW_INDICATOR"), sTableTargetColName ? sTableTargetColName : oColFromTableSettings.label]);
    } else {
      const oTableFirstColBindingContextTextAnnotation = messageHandling.getTableFirstColBindingContextForTextAnnotation(oTable, oTableRowContext, sTableFirstColProperty);
      const sTableFirstColTextAnnotationPath = oTableFirstColBindingContextTextAnnotation ? oTableFirstColBindingContextTextAnnotation.getObject("$Path") : undefined;
      const sTableFirstColTextArrangement = sTableFirstColTextAnnotationPath && oTableFirstColBindingContextTextAnnotation ? oTableFirstColBindingContextTextAnnotation.getObject("@com.sap.vocabularies.UI.v1.TextArrangement/$EnumMember") : undefined;
      if (oTableRowBindingContexts.length > 0) {
        // set Row subtitle text
        if (oTargetedControl) {
          // The UI error is on the first column, we then get the control input as the row indicator:
          sRowSubtitleValue = oTargetedControl.getValue();
        } else if (oTableRowContext && sTableFirstColProperty) {
          sRowSubtitleValue = messageHandling.getTableFirstColValue(sTableFirstColProperty, oTableRowContext, sTableFirstColTextAnnotationPath, sTableFirstColTextArrangement);
        } else {
          sRowSubtitleValue = undefined;
        }
        // set the message subtitle
        const oColumnInfo = messageHandling.determineColumnInfo(oColFromTableSettings, resourceModel);
        if (sRowSubtitleValue && sTableTargetColName) {
          sMessageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [sRowSubtitleValue, sTableTargetColName]);
        } else if (sRowSubtitleValue && oColumnInfo.sColumnIndicator === "Hidden") {
          sMessageSubtitle = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW")}: ${sRowSubtitleValue}, ${oColumnInfo.sColumnValue}`;
        } else if (sRowSubtitleValue && oColumnInfo.sColumnIndicator === "Unknown") {
          sMessageSubtitle = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE", [sRowSubtitleValue, oColumnInfo.sColumnValue]);
        } else if (sRowSubtitleValue && oColumnInfo.sColumnIndicator === "undefined") {
          sMessageSubtitle = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW")}: ${sRowSubtitleValue}`;
        } else if (!sRowSubtitleValue && sTableTargetColName) {
          sMessageSubtitle = resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN") + ": " + sTableTargetColName;
        } else if (!sRowSubtitleValue && oColumnInfo.sColumnIndicator === "Hidden") {
          sMessageSubtitle = oColumnInfo.sColumnValue;
        } else {
          sMessageSubtitle = null;
        }
      } else {
        sMessageSubtitle = null;
      }
    }
    return sMessageSubtitle;
  }

  /**
   * This function will get the first column for text Annotation, this is needed to set subtitle of Message.
   *
   * @param oTable
   * @param oTableRowContext
   * @param sTableFirstColProperty
   * @returns Binding context.
   */
  function getTableFirstColBindingContextForTextAnnotation(oTable, oTableRowContext, sTableFirstColProperty) {
    let oBindingContext;
    if (oTableRowContext && sTableFirstColProperty) {
      const oModel = oTable === null || oTable === void 0 ? void 0 : oTable.getModel();
      const oMetaModel = oModel === null || oModel === void 0 ? void 0 : oModel.getMetaModel();
      const sMetaPath = oMetaModel === null || oMetaModel === void 0 ? void 0 : oMetaModel.getMetaPath(oTableRowContext.getPath());
      if (oMetaModel !== null && oMetaModel !== void 0 && oMetaModel.getObject(`${sMetaPath}/${sTableFirstColProperty}@com.sap.vocabularies.Common.v1.Text/$Path`)) {
        oBindingContext = oMetaModel.createBindingContext(`${sMetaPath}/${sTableFirstColProperty}@com.sap.vocabularies.Common.v1.Text`);
      }
    }
    return oBindingContext;
  }

  /**
   * This function will get the value of first Column of Table, with its text Arrangement.
   *
   * @param sTableFirstColProperty
   * @param oTableRowContext
   * @param sTextAnnotationPath
   * @param sTextArrangement
   * @returns Column Value.
   */
  function getTableFirstColValue(sTableFirstColProperty, oTableRowContext, sTextAnnotationPath, sTextArrangement) {
    const sCodeValue = oTableRowContext.getValue(sTableFirstColProperty);
    let sTextValue;
    let sComputedValue = sCodeValue;
    if (sTextAnnotationPath) {
      if (sTableFirstColProperty.lastIndexOf("/") > 0) {
        // the target property is replaced with the text annotation path
        sTableFirstColProperty = sTableFirstColProperty.slice(0, sTableFirstColProperty.lastIndexOf("/") + 1);
        sTableFirstColProperty = sTableFirstColProperty.concat(sTextAnnotationPath);
      } else {
        sTableFirstColProperty = sTextAnnotationPath;
      }
      sTextValue = oTableRowContext.getValue(sTableFirstColProperty);
      if (sTextValue) {
        if (sTextArrangement) {
          const sEnumNumber = sTextArrangement.slice(sTextArrangement.indexOf("/") + 1);
          switch (sEnumNumber) {
            case "TextOnly":
              sComputedValue = sTextValue;
              break;
            case "TextFirst":
              sComputedValue = `${sTextValue} (${sCodeValue})`;
              break;
            case "TextLast":
              sComputedValue = `${sCodeValue} (${sTextValue})`;
              break;
            case "TextSeparate":
              sComputedValue = sCodeValue;
              break;
            default:
          }
        } else {
          sComputedValue = `${sTextValue} (${sCodeValue})`;
        }
      }
    }
    return sComputedValue;
  }

  /**
   * The method that is called to retrieve the column info from the associated message of the message popover.
   *
   * @param oMessage Message object
   * @param oTable MdcTable
   * @returns Returns the column info.
   */
  function fetchColumnInfo(oMessage, oTable) {
    const sColNameFromMessageObj = oMessage === null || oMessage === void 0 ? void 0 : oMessage.getTargets()[0].split("/").pop();
    return oTable.getParent().getTableDefinition().columns.find(function (oColumn) {
      return oColumn.key.split("::").pop() === sColNameFromMessageObj;
    });
  }

  /**
   * This function get the Column data depending on its availability in Table, this is needed for setting subtitle of Message.
   *
   * @param oColFromTableSettings
   * @param resourceModel
   * @returns Column data.
   */
  function determineColumnInfo(oColFromTableSettings, resourceModel) {
    const oColumnInfo = {
      sColumnIndicator: String,
      sColumnValue: String
    };
    if (oColFromTableSettings) {
      // if column is neither in table definition nor personalization, show only row subtitle text
      if (oColFromTableSettings.availability === "Hidden") {
        oColumnInfo.sColumnValue = undefined;
        oColumnInfo.sColumnIndicator = "undefined";
      } else {
        //if column is in table personalization but not in table definition, show Column (Hidden) : <colName>
        oColumnInfo.sColumnValue = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN")} (${resourceModel.getText("T_COLUMN_INDICATOR_IN_TABLE_DEFINITION")}): ${oColFromTableSettings.label}`;
        oColumnInfo.sColumnIndicator = "Hidden";
      }
    } else {
      oColumnInfo.sColumnValue = resourceModel.getText("T_MESSAGE_ITEM_SUBTITLE_INDICATOR_UNKNOWN");
      oColumnInfo.sColumnIndicator = "Unknown";
    }
    return oColumnInfo;
  }

  /**
   * This function check if a given control id is a part of Table.
   *
   * @param oTable
   * @param sControlId
   * @returns True if control is part of table.
   */
  function isControlInTable(oTable, sControlId) {
    const oControl = Core.byId(sControlId);
    if (oControl && !oControl.isA("sap.ui.table.Table") && !oControl.isA("sap.m.Table")) {
      return oTable.findElements(true, function (oElem) {
        return oElem.getId() === oControl;
      });
    }
    return false;
  }
  function isControlPartOfCreationRow(oControl) {
    let oParentControl = oControl === null || oControl === void 0 ? void 0 : oControl.getParent();
    while (oParentControl && !((_oParentControl = oParentControl) !== null && _oParentControl !== void 0 && _oParentControl.isA("sap.ui.table.Row")) && !((_oParentControl2 = oParentControl) !== null && _oParentControl2 !== void 0 && _oParentControl2.isA("sap.ui.table.CreationRow")) && !((_oParentControl3 = oParentControl) !== null && _oParentControl3 !== void 0 && _oParentControl3.isA("sap.m.ColumnListItem"))) {
      var _oParentControl, _oParentControl2, _oParentControl3;
      oParentControl = oParentControl.getParent();
    }
    return !!oParentControl && oParentControl.isA("sap.ui.table.CreationRow");
  }
  function getTranslatedTextForMessageDialog(sHighestPriority) {
    const resourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
    switch (sHighestPriority) {
      case "Error":
        return resourceBundle.getText("C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR");
      case "Information":
        return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO");
      case "Success":
        return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_SUCCESS");
      case "Warning":
        return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_WARNING");
      default:
        return resourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE");
    }
  }
  function removeUnboundTransitionMessages() {
    removeTransitionMessages(false);
  }
  function removeBoundTransitionMessages(sPathToBeRemoved) {
    removeTransitionMessages(true, sPathToBeRemoved);
  }
  function getMessagesFromMessageModel(oMessageModel, sPathToBeRemoved) {
    if (sPathToBeRemoved === undefined) {
      return oMessageModel.getObject("/");
    }
    const listBinding = oMessageModel.bindList("/");
    listBinding.filter(new Filter({
      path: "target",
      operator: FilterOperator.StartsWith,
      value1: sPathToBeRemoved
    }));
    return listBinding.getCurrentContexts().map(function (oContext) {
      return oContext.getObject();
    });
  }
  function getMessages() {
    let bBoundMessages = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    let bTransitionOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let sPathToBeRemoved = arguments.length > 2 ? arguments[2] : undefined;
    let i;
    const oMessageManager = Core.getMessageManager(),
      oMessageModel = oMessageManager.getMessageModel(),
      oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core"),
      aTransitionMessages = [];
    let aMessages = [];
    if (bBoundMessages && bTransitionOnly && sPathToBeRemoved) {
      aMessages = getMessagesFromMessageModel(oMessageModel, sPathToBeRemoved);
    } else {
      aMessages = oMessageModel.getObject("/");
    }
    for (i = 0; i < aMessages.length; i++) {
      if ((!bTransitionOnly || aMessages[i].persistent) && (bBoundMessages && aMessages[i].target !== "" || !bBoundMessages && (!aMessages[i].target || aMessages[i].target === ""))) {
        aTransitionMessages.push(aMessages[i]);
      }
    }
    for (i = 0; i < aTransitionMessages.length; i++) {
      if (aTransitionMessages[i].code === "503" && aTransitionMessages[i].message !== "" && aTransitionMessages[i].message.indexOf(oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX")) === -1) {
        aTransitionMessages[i].message = `\n${oResourceBundle.getText("C_MESSAGE_HANDLING_SAPFE_503_BACKEND_PREFIX")}${aTransitionMessages[i].message}`;
      }
    }
    //Filtering messages again here to avoid showing pure technical messages raised by the model
    const backendMessages = [];
    for (i = 0; i < aTransitionMessages.length; i++) {
      if (aTransitionMessages[i].technicalDetails && (aTransitionMessages[i].technicalDetails.originalMessage !== undefined && aTransitionMessages[i].technicalDetails.originalMessage !== null || aTransitionMessages[i].technicalDetails.httpStatus !== undefined && aTransitionMessages[i].technicalDetails.httpStatus !== null) || aTransitionMessages[i].code) {
        backendMessages.push(aTransitionMessages[i]);
      }
    }
    return backendMessages;
  }
  function removeTransitionMessages(bBoundMessages, sPathToBeRemoved) {
    const aMessagesToBeDeleted = getMessages(bBoundMessages, true, sPathToBeRemoved);
    if (aMessagesToBeDeleted.length > 0) {
      Core.getMessageManager().removeMessages(aMessagesToBeDeleted);
    }
  }
  //TODO: This must be moved out of message handling
  function setMessageSubtitle(oTable, aContexts, message) {
    if (message.additionalText === undefined) {
      const subtitleColumn = oTable.getParent().getIdentifierColumn();
      const errorContext = aContexts.find(function (oContext) {
        return message.getTargets()[0].includes(oContext.getPath());
      });
      message.additionalText = errorContext ? errorContext.getObject()[subtitleColumn] : undefined;
    }
  }

  /**
   * The method retrieves the visible sections from an object page.
   *
   * @param oObjectPageLayout The objectPageLayout object for which we want to retrieve the visible sections.
   * @returns Array of visible sections.
   */
  function getVisibleSectionsFromObjectPageLayout(oObjectPageLayout) {
    return oObjectPageLayout.getSections().filter(function (oSection) {
      return oSection.getVisible();
    });
  }

  /**
   * This function checks if control ids from message are a part of a given subsection.
   *
   * @param subSection
   * @param oMessageObject
   * @returns SubSection matching control ids.
   */
  function getControlFromMessageRelatingToSubSection(subSection, oMessageObject) {
    return subSection.findElements(true, oElem => {
      return fnFilterUponIds(oMessageObject.getControlIds(), oElem);
    }).sort(function (a, b) {
      // controls are sorted in order to have the table on top of the array
      // it will help to compute the subtitle of the message based on the type of related controls
      if (a.isA("sap.ui.mdc.Table") && !b.isA("sap.ui.mdc.Table")) {
        return -1;
      }
      return 1;
    });
  }
  function getTableColProperty(oTable, oMessageObject, oContextPath) {
    //this function escapes a string to use it as a regex
    const fnRegExpescape = function (s) {
      return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    };
    // based on the target path of the message we retrieve the property name.
    // to achieve it we remove the bindingContext path and the row binding path from the target
    if (!oContextPath) {
      var _oTable$getBindingCon;
      oContextPath = new RegExp(`${fnRegExpescape(`${(_oTable$getBindingCon = oTable.getBindingContext()) === null || _oTable$getBindingCon === void 0 ? void 0 : _oTable$getBindingCon.getPath()}/${oTable.getRowBinding().getPath()}`)}\\(.*\\)/`);
    }
    return oMessageObject.getTargets()[0].replace(oContextPath, "");
  }

  /**
   * This function gives the column information if it matches with the property name from target of message.
   *
   * @param oTable
   * @param sTableTargetColProperty
   * @returns Column name and property.
   */
  function getTableColInfo(oTable, sTableTargetColProperty) {
    let sTableTargetColName;
    let oTableTargetCol = oTable.getColumns().find(function (column) {
      return column.getDataProperty() == sTableTargetColProperty;
    });
    if (!oTableTargetCol) {
      /* If the target column is not found, we check for a custom column */
      const oCustomColumn = oTable.getControlDelegate().getColumnsFor(oTable).find(function (oColumn) {
        if (!!oColumn.template && oColumn.propertyInfos) {
          return oColumn.propertyInfos[0] === sTableTargetColProperty || oColumn.propertyInfos[0].replace("Property::", "") === sTableTargetColProperty;
        } else {
          return false;
        }
      });
      if (oCustomColumn) {
        var _oTableTargetCol;
        oTableTargetCol = oCustomColumn;
        sTableTargetColProperty = (_oTableTargetCol = oTableTargetCol) === null || _oTableTargetCol === void 0 ? void 0 : _oTableTargetCol.name;
        sTableTargetColName = oTable.getColumns().find(function (oColumn) {
          return sTableTargetColProperty === oColumn.getDataProperty();
        }).getHeader();
      } else {
        /* If the target column is not found, we check for a field group */
        const aColumns = oTable.getControlDelegate().getColumnsFor(oTable);
        oTableTargetCol = aColumns.find(function (oColumn) {
          if (oColumn.key.indexOf("::FieldGroup::") !== -1) {
            var _oColumn$propertyInfo;
            return (_oColumn$propertyInfo = oColumn.propertyInfos) === null || _oColumn$propertyInfo === void 0 ? void 0 : _oColumn$propertyInfo.find(function () {
              return aColumns.find(function (tableColumn) {
                return tableColumn.relativePath === sTableTargetColProperty;
              });
            });
          }
        });
        /* check if the column with the field group is visible in the table: */
        let bIsTableTargetColVisible = false;
        if (oTableTargetCol && oTableTargetCol.label) {
          bIsTableTargetColVisible = oTable.getColumns().some(function (column) {
            return column.getHeader() === oTableTargetCol.label;
          });
        }
        sTableTargetColName = bIsTableTargetColVisible && oTableTargetCol.label;
        sTableTargetColProperty = bIsTableTargetColVisible && oTableTargetCol.key;
      }
    } else {
      sTableTargetColName = oTableTargetCol && oTableTargetCol.getHeader();
    }
    return {
      sTableTargetColName: sTableTargetColName,
      sTableTargetColProperty: sTableTargetColProperty
    };
  }

  /**
   * This function gives Table and column info if any of it matches the target from Message.
   *
   * @param oTable
   * @param oMessageObject
   * @param oElement
   * @param oRowBinding
   * @returns Table info matching the message target.
   */
  function getTableAndTargetInfo(oTable, oMessageObject, oElement, oRowBinding) {
    const oTargetTableInfo = {};
    oTargetTableInfo.sTableTargetColProperty = getTableColProperty(oTable, oMessageObject);
    const oTableColInfo = getTableColInfo(oTable, oTargetTableInfo.sTableTargetColProperty);
    oTargetTableInfo.oTableRowBindingContexts = oElement.isA("sap.ui.table.Table") ? oRowBinding.getContexts() : oRowBinding.getCurrentContexts();
    oTargetTableInfo.sTableTargetColName = oTableColInfo.sTableTargetColName;
    oTargetTableInfo.sTableTargetColProperty = oTableColInfo.sTableTargetColProperty;
    oTargetTableInfo.oTableRowContext = oTargetTableInfo.oTableRowBindingContexts.find(function (rowContext) {
      return rowContext && oMessageObject.getTargets()[0].indexOf(rowContext.getPath()) === 0;
    });
    return oTargetTableInfo;
  }

  /**
   *
   * @param aControlIds
   * @param oItem
   * @returns True if the item matches one of the controls
   */
  function fnFilterUponIds(aControlIds, oItem) {
    return aControlIds.some(function (sControlId) {
      if (sControlId === oItem.getId()) {
        return true;
      }
      return false;
    });
  }

  /**
   * This function gives the group name having section and subsection data.
   *
   * @param section
   * @param subSection
   * @param bMultipleSubSections
   * @param oTargetTableInfo
   * @param resourceModel
   * @returns Group name.
   */
  function createSectionGroupName(section, subSection, bMultipleSubSections, oTargetTableInfo, resourceModel) {
    return section.getTitle() + (subSection.getTitle() && bMultipleSubSections ? `, ${subSection.getTitle()}` : "") + (oTargetTableInfo ? `, ${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${oTargetTableInfo.tableHeader}` : "");
  }
  function bIsOrphanElement(oElement, aElements) {
    return !aElements.some(function (oElem) {
      let oParentElement = oElement.getParent();
      while (oParentElement && oParentElement !== oElem) {
        oParentElement = oParentElement.getParent();
      }
      return oParentElement ? true : false;
    });
  }

  /**
   * Static functions for Fiori Message Handling
   *
   * @namespace
   * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
   * @since 1.56.0
   */
  const messageHandling = {
    getMessages: getMessages,
    showUnboundMessages: showUnboundMessages,
    removeUnboundTransitionMessages: removeUnboundTransitionMessages,
    removeBoundTransitionMessages: removeBoundTransitionMessages,
    modifyETagMessagesOnly: fnModifyETagMessagesOnly,
    getRetryAfterMessage: getRetryAfterMessage,
    prepareMessageViewForDialog: prepareMessageViewForDialog,
    setMessageSubtitle: setMessageSubtitle,
    getVisibleSectionsFromObjectPageLayout: getVisibleSectionsFromObjectPageLayout,
    getControlFromMessageRelatingToSubSection: getControlFromMessageRelatingToSubSection,
    fnFilterUponIds: fnFilterUponIds,
    getTableAndTargetInfo: getTableAndTargetInfo,
    createSectionGroupName: createSectionGroupName,
    bIsOrphanElement: bIsOrphanElement,
    getLastActionTextAndActionName: getLastActionTextAndActionName,
    getTableColumnDataAndSetSubtile: getTableColumnDataAndSetSubtile,
    getTableColInfo: getTableColInfo,
    getTableColProperty: getTableColProperty,
    getMessageSubtitle: getMessageSubtitle,
    determineColumnInfo: determineColumnInfo,
    fetchColumnInfo: fetchColumnInfo,
    getTableFirstColBindingContextForTextAnnotation: getTableFirstColBindingContextForTextAnnotation,
    getMessageRank: getMessageRank,
    fnCallbackSetGroupName: fnCallbackSetGroupName,
    getTableFirstColValue: getTableFirstColValue,
    setGroupNameOPDisplayMode: setGroupNameOPDisplayMode,
    updateMessageObjectGroupName: updateMessageObjectGroupName,
    setGroupNameLRTable: setGroupNameLRTable,
    isControlInTable: isControlInTable,
    isControlPartOfCreationRow: isControlPartOfCreationRow
  };
  return messageHandling;
}, false);
