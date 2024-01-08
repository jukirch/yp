/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../eventlogging/UserEvents", "../sinaNexTS/sina/ObjectSuggestion", "../sinaNexTS/sina/ResultSet", "../sinaNexTS/sina/SearchResultSetItem", "../sinaNexTS/sina/SearchResultSetItemAttributeBase"], function (___eventlogging_UserEvents, ___sinaNexTS_sina_ObjectSuggestion, ___sinaNexTS_sina_ResultSet, ___sinaNexTS_sina_SearchResultSetItem, ___sinaNexTS_sina_SearchResultSetItemAttributeBase) {
  var UserEventType = ___eventlogging_UserEvents["UserEventType"];
  var ObjectSuggestion = ___sinaNexTS_sina_ObjectSuggestion["ObjectSuggestion"];
  var ResultSet = ___sinaNexTS_sina_ResultSet["ResultSet"];
  var SearchResultSetItem = ___sinaNexTS_sina_SearchResultSetItem["SearchResultSetItem"];
  var SearchResultSetItemAttributeBase = ___sinaNexTS_sina_SearchResultSetItemAttributeBase["SearchResultSetItemAttributeBase"];
  function assembleResultData(resultSetItem) {
    if (!resultSetItem) {
      return {
        executionId: "-1",
        positionInList: -1
      };
    }
    var resultSet = resultSetItem.parent;
    if (!(resultSet instanceof ResultSet)) {
      return {
        executionId: "-1",
        positionInList: -1
      };
    }
    return {
      executionId: resultSet.id,
      positionInList: resultSet === null || resultSet === void 0 ? void 0 : resultSet.items.indexOf(resultSetItem)
    };
  }
  function assembleEventData(navigationTarget) {
    var parent = navigationTarget.parent;

    // check for nav target on result set attribute
    if (parent instanceof SearchResultSetItemAttributeBase) {
      return Object.assign({
        type: UserEventType.RESULT_LIST_ITEM_ATTRIBUTE_NAVIGATE,
        targetUrl: navigationTarget.targetUrl
      }, assembleResultData(parent.parent));
    }

    // check for nav target on object suggestion
    if (parent instanceof SearchResultSetItem && parent.parent instanceof ObjectSuggestion) {
      return Object.assign({
        type: UserEventType.OBJECT_SUGGESTION_NAVIGATE,
        targetUrl: navigationTarget.targetUrl
      }, assembleResultData(parent.parent));
    }

    // check for nav target on result set item
    if (parent instanceof SearchResultSetItem) {
      var type = parent.defaultNavigationTarget === navigationTarget ? UserEventType.RESULT_LIST_ITEM_NAVIGATE : UserEventType.RESULT_LIST_ITEM_NAVIGATE_CONTEXT;
      return Object.assign({
        type: type,
        targetUrl: navigationTarget.targetUrl
      }, assembleResultData(parent));
    }

    // fallback
    return {
      type: UserEventType.ITEM_NAVIGATE,
      targetUrl: navigationTarget.targetUrl,
      executionId: "",
      positionInList: -1
    };
  }
  function generateEventLoggerNavigationTracker(model) {
    return function (navigationTarget) {
      var eventData = assembleEventData(navigationTarget);
      model.eventLogger.logEvent(eventData);
    };
  }
  var __exports = {
    __esModule: true
  };
  __exports.generateEventLoggerNavigationTracker = generateEventLoggerNavigationTracker;
  return __exports;
});
})();