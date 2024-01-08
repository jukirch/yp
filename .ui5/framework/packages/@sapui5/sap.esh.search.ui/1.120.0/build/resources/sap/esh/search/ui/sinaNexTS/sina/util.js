/*! 
 * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	 
 */

(function(){
sap.ui.define(["./ComparisonOperator", "./ComplexCondition", "./Filter", "./LogicalOperator", "./SearchResultSetItemAttribute", "./SearchResultSetItemAttributeGroup", "./SimpleCondition", "./HierarchyDisplayType"], function (___ComparisonOperator, ___ComplexCondition, ___Filter, ___LogicalOperator, ___SearchResultSetItemAttribute, ___SearchResultSetItemAttributeGroup, ___SimpleCondition, ___HierarchyDisplayType) {
  /*!
   * SAPUI5

		(c) Copyright 2009-2021 SAP SE. All rights reserved
	
   */
  var ComparisonOperator = ___ComparisonOperator["ComparisonOperator"];
  var ComplexCondition = ___ComplexCondition["ComplexCondition"];
  var Filter = ___Filter["Filter"];
  var LogicalOperator = ___LogicalOperator["LogicalOperator"];
  var SearchResultSetItemAttribute = ___SearchResultSetItemAttribute["SearchResultSetItemAttribute"];
  var SearchResultSetItemAttributeGroup = ___SearchResultSetItemAttributeGroup["SearchResultSetItemAttributeGroup"];
  var SimpleCondition = ___SimpleCondition["SimpleCondition"];
  var HierarchyDisplayType = ___HierarchyDisplayType["HierarchyDisplayType"];
  function convertOperator2Wildcards(value, operator) {
    if (operator === ComparisonOperator.Eq) {
      return value;
    }
    var result = [];
    var values = value.split(" ");
    for (var i = 0; i < values.length; i++) {
      var trimedValue = values[i].trim();
      if (trimedValue.length === 0) {
        continue;
      }
      switch (operator) {
        case ComparisonOperator.Co:
          trimedValue = "*" + trimedValue + "*";
          break;
        case ComparisonOperator.Bw:
          trimedValue = trimedValue + "*";
          break;
        case ComparisonOperator.Ew:
          trimedValue = "*" + trimedValue;
          break;
        default:
          break;
      }
      result.push(trimedValue);
    }
    return result.join(" ");
  }
  function getNavigationHierarchyDataSources(sina, hierarchyAttrId, hierarchyName, dataSource) {
    var navigationDataSources = [];
    if (hierarchyAttrId !== null && hierarchyAttrId !== void 0 && hierarchyAttrId.length && sina) {
      var boDataSources = sina.getBusinessObjectDataSources();
      boDataSources.forEach(function (boDataSource) {
        if (boDataSource.getHierarchyDataSource() === dataSource) {
          navigationDataSources.push(boDataSource);
        } else if (boDataSource.hierarchyName === hierarchyAttrId) {
          // avoid self reference
          return;
        } else {
          boDataSource.attributesMetadata.forEach(function (attribute) {
            if (attribute.hierarchyName === hierarchyName && attribute.id === hierarchyAttrId && attribute.hierarchyDisplayType === HierarchyDisplayType.HierarchyResultView || attribute.hierarchyDisplayType === HierarchyDisplayType.StaticHierarchyFacet) {
              navigationDataSources.push(boDataSource);
            }
          });
        }
      });
    }
    return navigationDataSources;
  }

  // Prepare title as value label in filter condition
  function assembleTitle(result) {
    var titleValueArray = [];
    result.titleAttributes.forEach(function (titleAttr) {
      if (titleAttr instanceof SearchResultSetItemAttributeGroup && Array.isArray(titleAttr.attributes)) {
        titleAttr.attributes.forEach(function (subAttributeGroup) {
          if (subAttributeGroup.attribute && subAttributeGroup.attribute.value.startsWith("sap-icon://") !== true) {
            titleValueArray.push(subAttributeGroup.attribute.valueFormatted);
          }
        });
      } else if (titleAttr instanceof SearchResultSetItemAttribute) {
        if (titleAttr.value.startsWith("sap-icon://") !== true) {
          titleValueArray.push(titleAttr.valueFormatted);
        }
      }
    });
    return titleValueArray.join("; ");
  }

  // Assemble down navigation to related descendants as bottom navigation toolbar link
  function assembleHierarchyDecendantsNavigations(result, attrName, attrValue, attrValueLabel, navigationDataSources) {
    var datasetCondition = new SimpleCondition({
      attribute: attrName,
      operator: ComparisonOperator.DescendantOf,
      value: attrValue,
      valueLabel: attrValueLabel
    });
    var wrapComplexConditionDS = new ComplexCondition({
      operator: LogicalOperator.And,
      conditions: [datasetCondition]
    });
    var rootConditionDS = new ComplexCondition({
      operator: LogicalOperator.And,
      conditions: [wrapComplexConditionDS]
    });
    navigationDataSources.forEach(function (navigationDataSource) {
      var filterDS = new Filter({
        dataSource: navigationDataSource,
        searchTerm: "",
        //navigation mode, ignore content in search input box
        rootCondition: rootConditionDS,
        sina: result.sina
      });
      result.navigationTargets.push(result.sina.createSearchNavigationTarget(filterDS, navigationDataSource.labelPlural));
    });
  }
  var __exports = {
    __esModule: true
  };
  __exports.convertOperator2Wildcards = convertOperator2Wildcards;
  __exports.getNavigationHierarchyDataSources = getNavigationHierarchyDataSources;
  __exports.assembleTitle = assembleTitle;
  __exports.assembleHierarchyDecendantsNavigations = assembleHierarchyDecendantsNavigations;
  return __exports;
});
})();