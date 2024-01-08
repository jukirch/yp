/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isEntitySet = TypeGuards.isEntitySet;
  function getIsRequired(converterContext, sPropertyPath) {
    var _capabilities, _capabilities$FilterR;
    const entitySet = converterContext.getEntitySet();
    let capabilities;
    if (isEntitySet(entitySet)) {
      capabilities = entitySet.annotations.Capabilities;
    }
    const aRequiredProperties = (_capabilities = capabilities) === null || _capabilities === void 0 ? void 0 : (_capabilities$FilterR = _capabilities.FilterRestrictions) === null || _capabilities$FilterR === void 0 ? void 0 : _capabilities$FilterR.RequiredProperties;
    let bIsRequired = false;
    if (aRequiredProperties) {
      aRequiredProperties.forEach(function (oRequiredProperty) {
        if (sPropertyPath === (oRequiredProperty === null || oRequiredProperty === void 0 ? void 0 : oRequiredProperty.value)) {
          bIsRequired = true;
        }
      });
    }
    return bIsRequired;
  }
  _exports.getIsRequired = getIsRequired;
  function isPropertyFilterable(converterContext, valueListProperty) {
    var _capabilities2, _capabilities2$Filter;
    let bNotFilterable, bHidden;
    const entityType = converterContext.getEntityType();
    const entitySet = converterContext.getEntitySet();
    let capabilities;
    if (isEntitySet(entitySet)) {
      capabilities = entitySet.annotations.Capabilities;
    }
    const nonFilterableProperties = (_capabilities2 = capabilities) === null || _capabilities2 === void 0 ? void 0 : (_capabilities2$Filter = _capabilities2.FilterRestrictions) === null || _capabilities2$Filter === void 0 ? void 0 : _capabilities2$Filter.NonFilterableProperties;
    const properties = entityType.entityProperties;
    properties.forEach(property => {
      const PropertyPath = property.name;
      if (PropertyPath === valueListProperty) {
        var _property$annotations, _property$annotations2, _property$annotations3;
        bHidden = (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.UI) === null || _property$annotations2 === void 0 ? void 0 : (_property$annotations3 = _property$annotations2.Hidden) === null || _property$annotations3 === void 0 ? void 0 : _property$annotations3.valueOf();
      }
    });
    if (nonFilterableProperties && nonFilterableProperties.length > 0) {
      for (let i = 0; i < nonFilterableProperties.length; i++) {
        var _nonFilterablePropert;
        const sPropertyName = (_nonFilterablePropert = nonFilterableProperties[i]) === null || _nonFilterablePropert === void 0 ? void 0 : _nonFilterablePropert.value;
        if (sPropertyName === valueListProperty) {
          bNotFilterable = true;
        }
      }
    }
    return bNotFilterable || bHidden;
  }
  _exports.isPropertyFilterable = isPropertyFilterable;
  return _exports;
}, false);
