/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/fe/core/converters/helpers/IssueManager", "./ConverterContext", "./ManifestSettings", "./MetaModelConverter", "./templates/ListReportConverter", "./templates/ObjectPageConverter"], function (merge, IssueManager, ConverterContext, ManifestSettings, MetaModelConverter, ListReportConverter, ObjectPageConverter) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var TemplateType = ManifestSettings.TemplateType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  function handleErrorForCollectionFacets(oFacets, oDiagnostics, sEntitySetName, level) {
    oFacets.forEach(oFacet => {
      let Message = `For entity set ${sEntitySetName}`;
      if ((oFacet === null || oFacet === void 0 ? void 0 : oFacet.$Type) === "com.sap.vocabularies.UI.v1.CollectionFacet" && !(oFacet !== null && oFacet !== void 0 && oFacet.ID)) {
        var _IssueCategoryType$Fa;
        Message = `${Message}, ` + `level ${level}, the collection facet does not have an ID.`;
        oDiagnostics.addIssue(IssueCategory.Facets, IssueSeverity.High, Message, IssueCategoryType, IssueCategoryType === null || IssueCategoryType === void 0 ? void 0 : (_IssueCategoryType$Fa = IssueCategoryType.Facets) === null || _IssueCategoryType$Fa === void 0 ? void 0 : _IssueCategoryType$Fa.MissingID);
      }
      if ((oFacet === null || oFacet === void 0 ? void 0 : oFacet.$Type) === "com.sap.vocabularies.UI.v1.CollectionFacet" && level >= 3) {
        var _IssueCategoryType$Fa2;
        Message = `${Message}, collection facet ${oFacet.Label} is not supported at ` + `level ${level}`;
        oDiagnostics.addIssue(IssueCategory.Facets, IssueSeverity.Medium, Message, IssueCategoryType, IssueCategoryType === null || IssueCategoryType === void 0 ? void 0 : (_IssueCategoryType$Fa2 = IssueCategoryType.Facets) === null || _IssueCategoryType$Fa2 === void 0 ? void 0 : _IssueCategoryType$Fa2.UnSupportedLevel);
      }
      if (oFacet !== null && oFacet !== void 0 && oFacet.Facets) {
        handleErrorForCollectionFacets(oFacet === null || oFacet === void 0 ? void 0 : oFacet.Facets, oDiagnostics, sEntitySetName, ++level);
        level = level - 1;
      }
    });
  }
  /**
   * Based on a template type, convert the metamodel and manifest definition into a json structure for the page.
   *
   * @param sTemplateType The template type
   * @param oMetaModel The odata model metaModel
   * @param oManifestSettings The current manifest settings
   * @param oDiagnostics The diagnostics wrapper
   * @param sFullContextPath The context path to reach this page
   * @param oCapabilities
   * @param component The template component
   * @returns The target page definition
   */
  function convertPage(sTemplateType, oMetaModel, oManifestSettings, oDiagnostics, sFullContextPath, oCapabilities, component) {
    var _oConvertedMetadata$e;
    const oConvertedMetadata = convertTypes(oMetaModel, oCapabilities);
    // TODO: This will have incomplete information because the conversion happens lazily
    oConvertedMetadata.diagnostics.forEach(annotationErrorDetail => {
      const checkIfIssueExists = oDiagnostics.checkIfIssueExists(IssueCategory.Annotation, IssueSeverity.High, annotationErrorDetail.message);
      if (!checkIfIssueExists) {
        oDiagnostics.addIssue(IssueCategory.Annotation, IssueSeverity.High, annotationErrorDetail.message);
      }
    });
    oConvertedMetadata === null || oConvertedMetadata === void 0 ? void 0 : (_oConvertedMetadata$e = oConvertedMetadata.entityTypes) === null || _oConvertedMetadata$e === void 0 ? void 0 : _oConvertedMetadata$e.forEach(oEntitySet => {
      var _oEntitySet$annotatio, _oEntitySet$annotatio2;
      if (oEntitySet !== null && oEntitySet !== void 0 && (_oEntitySet$annotatio = oEntitySet.annotations) !== null && _oEntitySet$annotatio !== void 0 && (_oEntitySet$annotatio2 = _oEntitySet$annotatio.UI) !== null && _oEntitySet$annotatio2 !== void 0 && _oEntitySet$annotatio2.Facets) {
        var _oEntitySet$annotatio3, _oEntitySet$annotatio4;
        handleErrorForCollectionFacets(oEntitySet === null || oEntitySet === void 0 ? void 0 : (_oEntitySet$annotatio3 = oEntitySet.annotations) === null || _oEntitySet$annotatio3 === void 0 ? void 0 : (_oEntitySet$annotatio4 = _oEntitySet$annotatio3.UI) === null || _oEntitySet$annotatio4 === void 0 ? void 0 : _oEntitySet$annotatio4.Facets, oDiagnostics, oEntitySet === null || oEntitySet === void 0 ? void 0 : oEntitySet.name, 1);
      }
    });
    const sTargetEntitySetName = oManifestSettings.entitySet;
    const sContextPath = (oManifestSettings === null || oManifestSettings === void 0 ? void 0 : oManifestSettings.contextPath) || (sFullContextPath === "/" ? sFullContextPath + sTargetEntitySetName : sFullContextPath);
    const oContext = oMetaModel.createBindingContext(sContextPath);
    const oFullContext = getInvolvedDataModelObjects(oContext);
    if (oFullContext) {
      let oConvertedPage = {};
      const converterContext = new ConverterContext(oConvertedMetadata, oManifestSettings, oDiagnostics, merge, oFullContext);
      switch (sTemplateType) {
        case TemplateType.ListReport:
        case TemplateType.AnalyticalListPage:
          oConvertedPage = ListReportConverter.convertPage(converterContext);
          break;
        case TemplateType.ObjectPage:
          oConvertedPage = ObjectPageConverter.convertPage(converterContext);
          break;
      }
      if (component !== null && component !== void 0 && component.extendPageDefinition) {
        oConvertedPage = component.extendPageDefinition(oConvertedPage, converterContext);
      }
      return oConvertedPage;
    }
    return undefined;
  }
  _exports.convertPage = convertPage;
  return _exports;
}, false);
