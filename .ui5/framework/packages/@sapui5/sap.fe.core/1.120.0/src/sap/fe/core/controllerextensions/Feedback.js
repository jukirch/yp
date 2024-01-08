/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Core"],function(e){"use strict";var n={};let t;(function(e){e["action"]="actions";e["standardAction"]="standardActions"})(t||(t={}));n.TriggerType=t;let a;(function(e){e["save"]="save"})(a||(a={}));n.StandardActions=a;const i="sap.feedback";const o="inapp.feature";function r(n,t,a){const r={areaId:n,triggerName:t,payload:a};e.getEventBus().publish(i,o,r)}n.triggerSurvey=r;function d(e,n,t){var a,i,o;const d=(a=e.getViewData())===null||a===void 0?void 0:(i=a.content)===null||i===void 0?void 0:i.feedback;const c=d===null||d===void 0?void 0:(o=d[t])===null||o===void 0?void 0:o[n];if(c){r(c.areaId,c.triggerName,c.payload)}}n.triggerConfiguredSurvey=d;return n},false);
//# sourceMappingURL=Feedback.js.map