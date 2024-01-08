/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/ui/core/Core"], function (CollaborationCommon, Core) {
  "use strict";

  var _exports = {};
  var getActivityKeyFromPath = CollaborationCommon.getActivityKeyFromPath;
  const collaborationFormatters = function (sName) {
    if (collaborationFormatters.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return collaborationFormatters[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  const hasCollaborationActivity = function (activities) {
    return !!getCollaborationActivity(activities, this);
  };
  hasCollaborationActivity.__functionName = "sap.fe.core.formatters.CollaborationFormatter#hasCollaborationActivity";
  _exports.hasCollaborationActivity = hasCollaborationActivity;
  const getCollaborationActivityInitials = function (activities) {
    const activity = getCollaborationActivity(activities, this);
    return activity === null || activity === void 0 ? void 0 : activity.initials;
  };
  getCollaborationActivityInitials.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityInitials";
  _exports.getCollaborationActivityInitials = getCollaborationActivityInitials;
  const getCollaborationActivityColor = function (activities) {
    const activity = getCollaborationActivity(activities, this);
    return activity === null || activity === void 0 ? void 0 : activity.color;
  };
  getCollaborationActivityColor.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getCollaborationActivityColor";
  _exports.getCollaborationActivityColor = getCollaborationActivityColor;
  function getCollaborationActivity(activities, control) {
    var _control$getBindingCo;
    const path = control === null || control === void 0 ? void 0 : (_control$getBindingCo = control.getBindingContext()) === null || _control$getBindingCo === void 0 ? void 0 : _control$getBindingCo.getPath();
    if (!path) {
      return undefined;
    }
    const activityKey = getActivityKeyFromPath(path);
    if (activities && activities.length > 0) {
      return activities.find(activity => {
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
  const getFormattedText = function () {
    const textId = arguments.length <= 0 ? undefined : arguments[0];
    const resourceModel = Core.getLibraryResourceBundle("sap.fe.core");
    const params = [];
    for (let i = 1; i < arguments.length; i++) {
      params.push(i < 0 || arguments.length <= i ? undefined : arguments[i]);
    }
    return resourceModel.getText(textId, params);
  };
  getFormattedText.__functionName = "sap.fe.core.formatters.CollaborationFormatter#getFormattedText";
  _exports.getFormattedText = getFormattedText;
  collaborationFormatters.hasCollaborationActivity = hasCollaborationActivity;
  collaborationFormatters.getCollaborationActivityInitials = getCollaborationActivityInitials;
  collaborationFormatters.getCollaborationActivityColor = getCollaborationActivityColor;
  collaborationFormatters.getFormattedText = getFormattedText;
  /**
   * @global
   */
  return collaborationFormatters;
}, true);
