/**
 * Collection of formatters needed for the collaboration draft.
 *
 * @param {object} this The context
 * @param {string} sName The inner function name
 * @param {object[]} oArgs The inner function parameters
 * @returns {object} The value from the inner function
 */

import type { Property } from "@sap-ux/vocabularies-types";
import type { UserActivity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { getActivityKeyFromPath } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Core from "sap/ui/core/Core";

const collaborationFormatters = function (this: object, sName: string, ...oArgs: any[]): any {
	if (collaborationFormatters.hasOwnProperty(sName)) {
		return (collaborationFormatters as any)[sName].apply(this, oArgs);
	} else {
		return "";
	}
};
export const hasCollaborationActivity = function (this: ManagedObject, activities: UserActivity[], ..._keys: any[]): boolean | undefined {
	return !!getCollaborationActivity(activities, this);
};
hasCollaborationActivity.__functionName = "sap.fe.core.formatters.CollaborationFormatter#hasCollaborationActivity";

export const getCollaborationActivityInitials = function (
	this: ManagedObject,
	activities: UserActivity[],
	..._keys: Property[]
): string | undefined {
	const activity = getCollaborationActivity(activities, this);
	return activity?.initials;
};
getCollaborationActivityInitials.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityInitials";

export const getCollaborationActivityColor = function (
	this: ManagedObject,
	activities: UserActivity[],
	..._keys: Property[]
): string | undefined {
	const activity = getCollaborationActivity(activities, this);
	return activity?.color;
};
getCollaborationActivityColor.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityColor";

function getCollaborationActivity(activities?: UserActivity[], control?: ManagedObject) {
	const path = control?.getBindingContext()?.getPath();
	if (!path) {
		return undefined;
	}
	const activityKey = getActivityKeyFromPath(path);
	if (activities && activities.length > 0) {
		return activities.find((activity) => {
			return activity.key === activityKey;
		});
	} else {
		return undefined;
	}
}

/**
 * Compute the Invitation dialog title based on the underlying resource bundle.
 *
 * @param args The inner function parameters
 * @returns The dialog title
 */
export const getFormattedText = (...args: string[]): string => {
	const textId = args[0];
	const resourceModel = Core.getLibraryResourceBundle("sap.fe.core");
	const params = [];
	for (let i = 1; i < args.length; i++) {
		params.push(args[i]);
	}
	return resourceModel.getText(textId, params);
};

getFormattedText.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getFormattedText";

collaborationFormatters.hasCollaborationActivity = hasCollaborationActivity;
collaborationFormatters.getCollaborationActivityInitials = getCollaborationActivityInitials;
collaborationFormatters.getCollaborationActivityColor = getCollaborationActivityColor;
collaborationFormatters.getFormattedText = getFormattedText;
/**
 * @global
 */
export default collaborationFormatters;
