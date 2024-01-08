/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core"], function (Core) {
  "use strict";

  var _exports = {};
  let TriggerType;
  (function (TriggerType) {
    TriggerType["action"] = "actions";
    TriggerType["standardAction"] = "standardActions";
  })(TriggerType || (TriggerType = {}));
  _exports.TriggerType = TriggerType;
  let StandardActions;
  /**
   * Asking user for feedback
   *
   */
  (function (StandardActions) {
    StandardActions["save"] = "save";
  })(StandardActions || (StandardActions = {}));
  _exports.StandardActions = StandardActions;
  const channel = "sap.feedback";
  const feature = "inapp.feature";

  /**
   * Triggers a feedback survey.
   *
   * @param areaId The area id of the application.
   * @param triggerName The name of the trigger.
   * @param payload A flat list of key/values to be passed to the survey.
   */
  function triggerSurvey(areaId, triggerName, payload) {
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
  _exports.triggerSurvey = triggerSurvey;
  function triggerConfiguredSurvey(view, action, triggerType) {
    var _view$getViewData, _view$getViewData$con, _feedbackConfig$trigg;
    const feedbackConfig = (_view$getViewData = view.getViewData()) === null || _view$getViewData === void 0 ? void 0 : (_view$getViewData$con = _view$getViewData.content) === null || _view$getViewData$con === void 0 ? void 0 : _view$getViewData$con.feedback;
    const surveyConfig = feedbackConfig === null || feedbackConfig === void 0 ? void 0 : (_feedbackConfig$trigg = feedbackConfig[triggerType]) === null || _feedbackConfig$trigg === void 0 ? void 0 : _feedbackConfig$trigg[action];
    if (surveyConfig) {
      triggerSurvey(surveyConfig.areaId, surveyConfig.triggerName, surveyConfig.payload);
    }
  }
  _exports.triggerConfiguredSurvey = triggerConfiguredSurvey;
  return _exports;
}, false);
