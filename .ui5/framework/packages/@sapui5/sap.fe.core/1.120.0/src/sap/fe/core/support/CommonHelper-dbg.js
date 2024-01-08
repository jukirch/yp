/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager", "sap/ui/support/library"], function (IssueManager, SupportLib) {
  "use strict";

  var _exports = {};
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  const Categories = SupportLib.Categories,
    // Accessibility, Performance, Memory, ...
    Severity = SupportLib.Severity,
    // Hint, Warning, Error
    Audiences = SupportLib.Audiences; // Control, Internal, Application

  //**********************************************************
  // Rule Definitions
  //**********************************************************

  // Rule checks if objectPage componentContainer height is set
  _exports.Categories = Categories;
  _exports.Audiences = Audiences;
  _exports.Severity = Severity;
  const getSeverity = function (oSeverity) {
    switch (oSeverity) {
      case IssueSeverity.Low:
        return Severity.Low;
      case IssueSeverity.High:
        return Severity.High;
      case IssueSeverity.Medium:
        return Severity.Medium;
      // no default
    }
  };
  _exports.getSeverity = getSeverity;
  const getIssueByCategory = function (oIssueManager, oCoreFacade, issueCategoryType, issueSubCategoryType) {
    const mComponents = oCoreFacade.getComponents();
    let oAppComponent;
    Object.keys(mComponents).forEach(sKey => {
      var _oComponent$getMetada, _oComponent$getMetada2;
      const oComponent = mComponents[sKey];
      if ((oComponent === null || oComponent === void 0 ? void 0 : (_oComponent$getMetada = oComponent.getMetadata()) === null || _oComponent$getMetada === void 0 ? void 0 : (_oComponent$getMetada2 = _oComponent$getMetada.getParent()) === null || _oComponent$getMetada2 === void 0 ? void 0 : _oComponent$getMetada2.getName()) === "sap.fe.core.AppComponent") {
        oAppComponent = oComponent;
      }
    });
    if (oAppComponent) {
      const aIssues = oAppComponent.getDiagnostics().getIssuesByCategory(IssueCategory[issueCategoryType], issueSubCategoryType);
      aIssues.forEach(function (oElement) {
        oIssueManager.addIssue({
          severity: getSeverity(oElement.severity),
          details: oElement.details,
          context: {
            id: oElement.category
          }
        });
      });
    }
  };
  _exports.getIssueByCategory = getIssueByCategory;
  return _exports;
}, false);
