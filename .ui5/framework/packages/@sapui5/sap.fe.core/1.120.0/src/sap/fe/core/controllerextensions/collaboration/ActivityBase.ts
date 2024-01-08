import UriParameters from "sap/base/util/UriParameters";
import type { FEView } from "sap/fe/core/BaseController";
import type { Message, User } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import MessageBox from "sap/m/MessageBox";
import type Event from "sap/ui/base/Event";
import SapPcpWebSocket, { SUPPORTED_PROTOCOLS } from "sap/ui/core/ws/SapPcpWebSocket";
import type { WebSocket$MessageEvent } from "sap/ui/core/ws/WebSocket";
import type JSONModel from "sap/ui/model/json/JSONModel";

const COLLABORATION = "/collaboration";
const CONNECTION = "/collaboration/connection";
const CURRENTDRAFTID = "/collaboration/DraftID";
const WEBSOCKETSTATUS = "/collaboration/websocket_status";

export enum WEBSOCKET_STATUS {
	CLOSED = 0,
	CLOSING = 1,
	CONNECTING = 2,
	CONNECTED = 3,
	ERROR = 4
}

export function isCollaborationConnected(internalModel: JSONModel): boolean {
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
export function initializeCollaboration(
	user: User,
	webSocketBaseURL: string,
	draftUUID: string,
	serviceUrl: string,
	internalModel: JSONModel,
	receiveCallback: (_: Message) => void,
	view: FEView,
	sendUserInfo = false
): boolean {
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

	const activeUsers: User[] = [user];
	internalModel.setProperty(COLLABORATION, { activeUsers: activeUsers, activities: {} });

	sendUserInfo = sendUserInfo || UriParameters.fromQuery(window.location.search).get("useFLPUser") === "true";

	const webSocket = createWebSocket(user, webSocketBaseURL, draftUUID, serviceUrl, sendUserInfo);

	internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CONNECTING);
	internalModel.setProperty(CONNECTION, webSocket);
	internalModel.setProperty(CURRENTDRAFTID, draftUUID);

	webSocket.attachMessage(function (event: WebSocket$MessageEvent & Event<{ pcpFields?: Message }>): void {
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

export function broadcastCollaborationMessage(
	action: Activity,
	content: string | undefined,
	internalModel: JSONModel,
	triggeredActionName?: string,
	refreshListBinding?: boolean,
	requestedProperties?: string
) {
	if (isCollaborationConnected(internalModel)) {
		const webSocket = internalModel.getProperty(CONNECTION) as SapPcpWebSocket;

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

export function endCollaboration(internalModel: JSONModel) {
	const webSocket = internalModel.getProperty(CONNECTION) as SapPcpWebSocket | undefined;
	internalModel.setProperty(COLLABORATION, {});
	internalModel.setProperty(WEBSOCKETSTATUS, WEBSOCKET_STATUS.CLOSING);
	webSocket?.close();
}

function createWebSocket(user: User, socketBaseURL: string, draftUUID: string, serviceUrl: string, sendUserInfo = false) {
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
