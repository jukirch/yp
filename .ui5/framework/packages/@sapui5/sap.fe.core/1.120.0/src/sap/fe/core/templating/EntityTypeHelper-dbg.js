/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/BindingToolkit"], function (Log, BindingToolkit) {
  "use strict";

  var _exports = {};
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var concat = BindingToolkit.concat;
  // Collection of helper functions to retrieve information from an EntityType.

  // This is still a work in progress

  /**
   * Retrieve the binding expression required to display the title of an entity.
   *
   * This is usually defined as:
   *  - the HeaderInfo.Title value
   *  - the SemanticKeys properties
   *  - the keys properties.
   *
   * @param entityType The target entityType
   * @returns The title binding expression
   */
  const getTitleExpression = entityType => {
    var _entityType$annotatio, _entityType$annotatio2, _entityType$annotatio3, _entityType$annotatio4, _entityType$annotatio5, _entityType$annotatio6, _entityType$annotatio7, _entityType$annotatio8;
    // HeaderInfo can be a [DataField] and any of its children, or a [DataFieldForAnnotation] targeting [ConnectedFields](#ConnectedFields).
    const headerInfoTitle = (_entityType$annotatio = entityType.annotations) === null || _entityType$annotatio === void 0 ? void 0 : (_entityType$annotatio2 = _entityType$annotatio.UI) === null || _entityType$annotatio2 === void 0 ? void 0 : (_entityType$annotatio3 = _entityType$annotatio2.HeaderInfo) === null || _entityType$annotatio3 === void 0 ? void 0 : _entityType$annotatio3.Title;
    if (headerInfoTitle) {
      switch (headerInfoTitle.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
          return getExpressionFromAnnotation(headerInfoTitle.Value);
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          Log.error("DataFieldForAnnotation with connected fields not supported for HeaderInfo.Title");
          return getExpressionFromAnnotation((_entityType$annotatio4 = entityType.annotations) === null || _entityType$annotatio4 === void 0 ? void 0 : (_entityType$annotatio5 = _entityType$annotatio4.UI) === null || _entityType$annotatio5 === void 0 ? void 0 : (_entityType$annotatio6 = _entityType$annotatio5.HeaderInfo) === null || _entityType$annotatio6 === void 0 ? void 0 : _entityType$annotatio6.TypeName);
      }
    }
    const semanticKeys = (_entityType$annotatio7 = entityType.annotations) === null || _entityType$annotatio7 === void 0 ? void 0 : (_entityType$annotatio8 = _entityType$annotatio7.Common) === null || _entityType$annotatio8 === void 0 ? void 0 : _entityType$annotatio8.SemanticKey;
    if (semanticKeys) {
      return concat(...semanticKeys.map(key => pathInModel(key.value)));
    }
  };
  _exports.getTitleExpression = getTitleExpression;
  return _exports;
}, false);
