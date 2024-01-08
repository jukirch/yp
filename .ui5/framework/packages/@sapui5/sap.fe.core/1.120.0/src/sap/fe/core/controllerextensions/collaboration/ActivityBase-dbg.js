/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/UriParameters", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/MessageBox", "sap/ui/core/ws/SapPcpWebSocket"], function (UriParameters, CollaborationCommon, ResourceModelHelper, MessageBox, SapPcpWebSocket) {
  "use strict";

  var _exports = {};
  var SUPPORTED_PROTOCOLS = SapPcpWebSocket.SUPPORTED_PROTOCOLS;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var Activity = CollaborationCommon.Activity;
  const COLLABORATION = "/collaboration";
  const CONNECTION = "/collaboration/connection";
  const CURRENTDRAFTID = "/collaboration/DraftID";
  const WEBSOCKETSTATUS = "/collaboration/websocket_status";
  let WEBSOCKET_STATUS;
  (function (WEBSOCKET_STATUS) {
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CLOSED"] = 0] = "CLOSED";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CLOSING"] = 1] = "CLOSING";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CONNECTING"] = 2] = "CONNECTING";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["CONNECTED"] = 3] = "CONNECTED";
    WEBSOCKET_STATUS[WEBSOCKET_STATUS["ERROR"] = 4] = "ERROR";
  })(WEBSOCKET_STATUS || (WEBSOCKET_STATUS = {}));
  _exports.WEBSOCKET_STATUS = WEBSOCKET_STATUS;
  function isCollaborationConnected(internalModel) {
    return internalModel.getProperty(WEBSOCKETSTATUS) === WEBSOCKET_STATUS.CONNECTED;
  }

  /**
   * Initializes the collaboration websocket.
   *
   * @param user
   * @param webSocketBaseURL
   * @param draftUUID
   * @param serviceUrl
   * @param internalModel
   * @param receiveCallback
   * @param view
   * @param sendUserInfo
   * @returns True if a new websocket was created
   */
  _exports.isCollaborationConnected = isCollaborationConnected;
  function initializeCollaboration(user, webSocketBaseURL, draftUUID, serviceUrl, internalModel, receiveCallback, view) {
    let sendUserInfo = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
    if (internalModel.getProperty(CONNECTION)) {
      // A connection is already established
      if (internalModel.getProperty(CURRENTDRAFTID) === draftUUID) {
        // Connection corresponds to the same draft -> nothing to do
        return false;
      } else {
        // There was a connection to another draft -> we close it before creating a new one
        // This can happen e.g. when switching between items in FCL
        endCollaboration(internalModel);
      }
    }
    const activeUsers = [user];
    internalModel.setProperty(COLLABORATION, {
      activeUsers: activeUsers,
      activities: {}
    });
    sendUserInfo = sendUserInfo || UriParameters.fromQuery(window.location.search).get("useFLPUser") === "true";
    const webSocket = createWebSocket(user, webSocketBaseURL, draftUUID, serviceUrl, sendUserInfo);
    internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CONNECTING);
    internalModel.setProperty(CONNECTION, webSocket);
    internalModel.setProperty(CURRENTDRAFTID, draftUUID);
    webSocket.attachMessage(function (event) {
      const message = event.getParameter("pcpFields");
      if (message) {
        receiveCallback(message);
      }
    });
    webSocket.attachOpen(function () {
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CONNECTED);
    });
    webSocket.attachError(function () {
      if ([WEBSOCKET_STATUS.CONNECTING, WEBSOCKET_STATUS.CONNECTED].includes(internalModel.getProperty(WEBSOCKETSTATUS))) {
        const resourceModel = getResourceModel(view);
        const lostOfConnectionText = resourceModel.getText("C_COLLABORATIONDRAFT_CONNECTION_LOST");
        MessageBox.warning(lostOfConnectionText, {
          actions: [MessageBox.Action.OK],
          emphasizedAction: MessageBox.Action.OK
        });
      }
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.ERROR);
    });
    webSocket.attachClose(function () {
      internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CLOSED);
    });
    return true;
  }
  _exports.initializeCollaboration = initializeCollaboration;
  function broadcastCollaborationMessage(action, content, internalModel, triggeredActionName, refreshListBinding, requestedProperties) {
    if (isCollaborationConnected(internalModel)) {
      const webSocket = internalModel.getProperty(CONNECTION);
      webSocket.send("", {
        clientAction: action,
        clientContent: content,
        clientTriggeredActionName: triggeredActionName,
        clientRefreshListBinding: refreshListBinding,
        clientRequestedProperties: requestedProperties
      });
      if (action === Activity.Activate || action === Activity.Discard) {
        endCollaboration(internalModel);
      }
    }
  }
  _exports.broadcastCollaborationMessage = broadcastCollaborationMessage;
  function endCollaboration(internalModel) {
    const webSocket = internalModel.getProperty(CONNECTION);
    internalModel.setProperty(COLLABORATION, {});
    internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CLOSING);
    webSocket === null || webSocket === void 0 ? void 0 : webSocket.close();
  }
  _exports.endCollaboration = endCollaboration;
  function createWebSocket(user, socketBaseURL, draftUUID, serviceUrl) {
    let sendUserInfo = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    const hostLocation = window.location;
    let socketURI;

    // Support useBackendUrl for local testing
    const useBackendUrl = UriParameters.fromQuery(window.location.search).get("useBackendUrl");
    if (useBackendUrl) {
      socketURI = useBackendUrl.replace("https", "wss");
    } else {
      socketURI = hostLocation.protocol === "https:" ? "wss:" : "ws:";
      socketURI += `//${hostLocation.host}`;
    }
    socketURI += `${(socketBaseURL.startsWith("/") ? "" : "/") + socketBaseURL}?draft=${draftUUID}&relatedService=${serviceUrl}`;
    if (sendUserInfo) {
      socketURI += `&userID=${encodeURI(user.id)}&userName=${encodeURI(user.initialName || "")}`;
    }
    return new SapPcpWebSocket(socketURI, [SUPPORTED_PROTOCOLS.v10]);
  }
  return _exports;
}, false);
