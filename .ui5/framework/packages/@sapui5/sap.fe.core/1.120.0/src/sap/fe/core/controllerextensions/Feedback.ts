import Core from "sap/ui/core/Core";
import type View from "sap/ui/core/mvc/View";

type SurveyConfig = {
	areaId: string;
	triggerName: string;
	payload?: object;
};

export enum TriggerType {
	action = "actions",
	standardAction = "standardActions"
}

export enum StandardActions {
	save = "save"
}

/**
 * Asking user for feedback
 *
 */

const channel = "sap.feedback";
const feature = "inapp.feature";

/**
 * Triggers a feedback survey.
 *
 * @param areaId The area id of the application.
 * @param triggerName The name of the trigger.
 * @param payload A flat list of key/values to be passed to the survey.
 */
export function triggerSurvey(areaId: string, triggerName: string, payload: any) {
	const parameters = {
		areaId: areaId,
		triggerName: triggerName,
		payload: payload
	};
	Core.getEventBus().publish(channel, feature, parameters);
}

/**
 * Triggers a feedback survey configured for a given action on the current page.
 *
 * @param view The view which is checked for a feedback configuration.
 * @param action The name of the action.
 * @param triggerType The trigger type of the action (actions|standardActions)
 */
export function triggerConfiguredSurvey(view: View, action: string, triggerType: TriggerType) {
	const feedbackConfig = (view.getViewData() as any)?.content?.feedback;
	const surveyConfig = feedbackConfig?.[triggerType]?.[action] as SurveyConfig;
	if (surveyConfig) {
		triggerSurvey(surveyConfig.areaId, surveyConfig.triggerName, surveyConfig.payload);
	}
}
