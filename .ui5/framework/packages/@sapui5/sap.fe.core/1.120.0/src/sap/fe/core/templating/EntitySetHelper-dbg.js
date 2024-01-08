/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isEntitySet = TypeGuards.isEntitySet;
  /**
   * Reads all SortRestrictions of the main entity and the (first level) navigation restrictions.
   * This does not work for more than one level of navigation.
   *
   * @param entitySet Entity set to be analyzed
   * @returns Array containing the property names of all non-sortable properties
   */
  const getNonSortablePropertiesRestrictions = function (entitySet) {
    var _entitySet$annotation6, _entitySet$annotation7, _entitySet$annotation8;
    let nonSortableProperties = [];
    // Check annotations for main entity
    if (isEntitySet(entitySet)) {
      var _entitySet$annotation, _entitySet$annotation2;
      if (((_entitySet$annotation = entitySet.annotations.Capabilities) === null || _entitySet$annotation === void 0 ? void 0 : (_entitySet$annotation2 = _entitySet$annotation.SortRestrictions) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.Sortable) === false) {
        // add all properties of the entity to the nonSortableProperties
        nonSortableProperties.push(...entitySet.entityType.entityProperties.map(property => property.name));
      } else {
        var _entitySet$annotation3, _entitySet$annotation4, _entitySet$annotation5;
        nonSortableProperties = ((_entitySet$annotation3 = entitySet.annotations.Capabilities) === null || _entitySet$annotation3 === void 0 ? void 0 : (_entitySet$annotation4 = _entitySet$annotation3.SortRestrictions) === null || _entitySet$annotation4 === void 0 ? void 0 : (_entitySet$annotation5 = _entitySet$annotation4.NonSortableProperties) === null || _entitySet$annotation5 === void 0 ? void 0 : _entitySet$annotation5.map(property => property.value)) || [];
      }
    } else {
      return [];
    }
    // Check for every navigationRestriction if it has sortRestrictions
    (_entitySet$annotation6 = entitySet.annotations.Capabilities) === null || _entitySet$annotation6 === void 0 ? void 0 : (_entitySet$annotation7 = _entitySet$annotation6.NavigationRestrictions) === null || _entitySet$annotation7 === void 0 ? void 0 : (_entitySet$annotation8 = _entitySet$annotation7.RestrictedProperties) === null || _entitySet$annotation8 === void 0 ? void 0 : _entitySet$annotation8.forEach(navigationRestriction => {
      var _navigationRestrictio;
      if ((navigationRestriction === null || navigationRestriction === void 0 ? void 0 : (_navigationRestrictio = navigationRestriction.SortRestrictions) === null || _navigationRestrictio === void 0 ? void 0 : _navigationRestrictio.Sortable) === false) {
        var _navigationRestrictio2;
        // find correct navigation property
        const navigationProperty = entitySet.entityType.navigationProperties.by_name(navigationRestriction === null || navigationRestriction === void 0 ? void 0 : (_navigationRestrictio2 = navigationRestriction.NavigationProperty) === null || _navigationRestrictio2 === void 0 ? void 0 : _navigationRestrictio2.value);
        if (navigationProperty) {
          // add all properties of the navigation property to the nonSortableProperties
          nonSortableProperties.push(...navigationProperty.targetType.entityProperties.map(property => `${navigationProperty.name}/${property.name}`));
        }
      } else {
        var _navigationRestrictio3, _navigationRestrictio4;
        // leave the property path unchanged (it is relative to the annotation target!)
        const nonSortableNavigationProperties = navigationRestriction === null || navigationRestriction === void 0 ? void 0 : (_navigationRestrictio3 = navigationRestriction.SortRestrictions) === null || _navigationRestrictio3 === void 0 ? void 0 : (_navigationRestrictio4 = _navigationRestrictio3.NonSortableProperties) === null || _navigationRestrictio4 === void 0 ? void 0 : _navigationRestrictio4.map(property => property.value);
        if (nonSortableNavigationProperties) {
          nonSortableProperties.push(...nonSortableNavigationProperties);
        }
      }
    });
    return nonSortableProperties;
  };
  _exports.getNonSortablePropertiesRestrictions = getNonSortablePropertiesRestrictions;
  return _exports;
}, false);
