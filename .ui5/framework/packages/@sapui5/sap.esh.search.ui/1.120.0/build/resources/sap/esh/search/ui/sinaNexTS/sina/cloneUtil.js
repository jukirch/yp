/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["../core/clone", "./AttributeMetadata", "./DataSource", "./NavigationTarget", "./SearchResultSet", "./SearchResultSetItem", "./SearchResultSetItemAttribute"], function (___core_clone, ___AttributeMetadata, ___DataSource, ___NavigationTarget, ___SearchResultSet, ___SearchResultSetItem, ___SearchResultSetItemAttribute) {
  var CloneService = ___core_clone["CloneService"];
  var AttributeMetadata = ___AttributeMetadata["AttributeMetadata"];
  var DataSource = ___DataSource["DataSource"];
  var NavigationTarget = ___NavigationTarget["NavigationTarget"];
  var SearchResultSet = ___SearchResultSet["SearchResultSet"];
  var SearchResultSetItem = ___SearchResultSetItem["SearchResultSetItem"];
  var SearchResultSetItemAttribute = ___SearchResultSetItemAttribute["SearchResultSetItemAttribute"];
  /* 
  - clone service which clones sina objects
  - the clone includes only public (= to be used by stakeholder developers) properties
  */
  var cloneService = new CloneService({
    classes: [{
      "class": SearchResultSet,
      properties: ["items"]
    }, {
      "class": SearchResultSetItem,
      properties: ["attributes", "attributesMap", "dataSource", "defaultNavigationTarget", "detailAttributes", "navigationTargets", "titleAttributes", "titleDescriptionAttributes"]
    }, {
      "class": SearchResultSetItemAttribute,
      properties: ["id", "value", "valueFormatted", "valueHighlighted", "defaultNavigationTarget", "isHighlighted", "metadata", "navigationTargets"]
    }, {
      "class": DataSource,
      properties: ["id", "label", "labelPlural"]
    }, {
      "class": AttributeMetadata,
      properties: ["id", "label", "type", "isKey"]
    }, {
      "class": NavigationTarget,
      properties: ["label", "target", "targetUrl"]
    }]
  });
  function clonePublic(obj) {
    return cloneService.clone(obj);
  }
  var __exports = {
    __esModule: true
  };
  __exports.clonePublic = clonePublic;
  return __exports;
});
})();