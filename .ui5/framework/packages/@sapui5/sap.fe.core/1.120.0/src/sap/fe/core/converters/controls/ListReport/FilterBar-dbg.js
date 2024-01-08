/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/controls/Common/Table", "sap/fe/core/converters/controls/ListReport/VisualFilters", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/m/library", "../Common/DataVisualization"], function (Table, VisualFilters, ConfigurableObject, IssueManager, Key, ModelHelper, TypeGuards, DataModelPathHelper, PropertyHelper, library, DataVisualization) {
  "use strict";

  var _exports = {};
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  var StandardDynamicDateRangeKeys = library.StandardDynamicDateRangeKeys;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedTimezonePropertyPath = PropertyHelper.getAssociatedTimezonePropertyPath;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getTargetNavigationPath = DataModelPathHelper.getTargetNavigationPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var isComplexType = TypeGuards.isComplexType;
  var KeyHelper = Key.KeyHelper;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var getVisualFilters = VisualFilters.getVisualFilters;
  var isFilteringCaseSensitive = Table.isFilteringCaseSensitive;
  var getTypeConfig = Table.getTypeConfig;
  var getSelectionVariantConfiguration = Table.getSelectionVariantConfiguration;
  var filterFieldType;
  (function (filterFieldType) {
    filterFieldType["Default"] = "Default";
    filterFieldType["Slot"] = "Slot";
  })(filterFieldType || (filterFieldType = {}));
  const sEdmString = "Edm.String";
  const sStringDataType = "sap.ui.model.odata.type.String";
  /**
   * Enter all DataFields of a given FieldGroup into the filterFacetMap.
   *
   * @param fieldGroup
   * @returns The map of facets for the given FieldGroup
   */
  function getFieldGroupFilterGroups(fieldGroup) {
    const filterFacetMap = {};
    fieldGroup.Data.forEach(dataField => {
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataField") {
        var _fieldGroup$Label, _fieldGroup$annotatio, _fieldGroup$annotatio2, _fieldGroup$annotatio3;
        filterFacetMap[dataField.Value.path] = {
          group: fieldGroup.fullyQualifiedName,
          groupLabel: ((_fieldGroup$Label = fieldGroup.Label) === null || _fieldGroup$Label === void 0 ? void 0 : _fieldGroup$Label.toString()) ?? ((_fieldGroup$annotatio = fieldGroup.annotations) === null || _fieldGroup$annotatio === void 0 ? void 0 : (_fieldGroup$annotatio2 = _fieldGroup$annotatio.Common) === null || _fieldGroup$annotatio2 === void 0 ? void 0 : (_fieldGroup$annotatio3 = _fieldGroup$annotatio2.Label) === null || _fieldGroup$annotatio3 === void 0 ? void 0 : _fieldGroup$annotatio3.toString()) ?? fieldGroup.qualifier
        };
      }
    });
    return filterFacetMap;
  }
  function getExcludedFilterProperties(selectionVariants) {
    return selectionVariants.reduce((previousValue, selectionVariant) => {
      selectionVariant.propertyNames.forEach(propertyName => {
        previousValue[propertyName] = true;
      });
      return previousValue;
    }, {});
  }

  /**
   * Check that all the tables for a dedicated entity set are configured as analytical tables.
   *
   * @param listReportTables List report tables
   * @param contextPath
   * @returns Is FilterBar search field hidden or not
   */
  function checkAllTableForEntitySetAreAnalytical(listReportTables, contextPath) {
    if (contextPath && listReportTables.length > 0) {
      return listReportTables.every(visualization => {
        return visualization.enableAnalytics && contextPath === visualization.annotation.collection;
      });
    }
    return false;
  }
  function getSelectionVariants(lrTableVisualizations, converterContext) {
    const selectionVariantPaths = [];
    return lrTableVisualizations.map(visualization => {
      const tableFilters = visualization.control.filters;
      const tableSVConfigs = [];
      for (const key in tableFilters) {
        if (Array.isArray(tableFilters[key].paths)) {
          const paths = tableFilters[key].paths;
          paths.forEach(path => {
            if (path && path.annotationPath && !selectionVariantPaths.includes(path.annotationPath)) {
              selectionVariantPaths.push(path.annotationPath);
              const selectionVariantConfig = getSelectionVariantConfiguration(path.annotationPath, converterContext);
              if (selectionVariantConfig) {
                tableSVConfigs.push(selectionVariantConfig);
              }
            }
          });
        }
      }
      return tableSVConfigs;
    }).reduce((svConfigs, selectionVariant) => svConfigs.concat(selectionVariant), []);
  }

  /**
   * Returns the condition path required for the condition model. It looks as follows:
   * <1:N-PropertyName>*\/<1:1-PropertyName>/<PropertyName>.
   *
   * @param entityType The root EntityType
   * @param propertyPath The full path to the target property
   * @returns The formatted condition path
   */
  const _getConditionPath = function (entityType, propertyPath) {
    const parts = propertyPath.split("/");
    let partialPath;
    let key = "";
    while (parts.length) {
      let part = parts.shift();
      partialPath = partialPath ? `${partialPath}/${part}` : part;
      const property = entityType.resolvePath(partialPath);
      if (isMultipleNavigationProperty(property)) {
        part += "*";
      }
      key = key ? `${key}/${part}` : part;
    }
    return key;
  };
  const _createFilterSelectionField = function (entityType, property, fullPropertyPath, includeHidden, converterContext) {
    var _property$annotations, _property$annotations2, _property$annotations3;
    // ignore complex property types and hidden annotated ones
    if (property && property.targetType === undefined && (includeHidden || ((_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.UI) === null || _property$annotations2 === void 0 ? void 0 : (_property$annotations3 = _property$annotations2.Hidden) === null || _property$annotations3 === void 0 ? void 0 : _property$annotations3.valueOf()) !== true)) {
      var _property$annotations4, _property$annotations5, _property$annotations6, _property$annotations7, _property$annotations8, _targetEntityType$ann, _targetEntityType$ann2, _targetEntityType$ann3;
      const targetEntityType = converterContext.getAnnotationEntityType(property),
        filterField = {
          key: KeyHelper.getSelectionFieldKeyFromPath(fullPropertyPath),
          annotationPath: converterContext.getAbsoluteAnnotationPath(fullPropertyPath),
          conditionPath: _getConditionPath(entityType, fullPropertyPath),
          availability: ((_property$annotations4 = property.annotations) === null || _property$annotations4 === void 0 ? void 0 : (_property$annotations5 = _property$annotations4.UI) === null || _property$annotations5 === void 0 ? void 0 : (_property$annotations6 = _property$annotations5.HiddenFilter) === null || _property$annotations6 === void 0 ? void 0 : _property$annotations6.valueOf()) === true ? "Hidden" : "Adaptation",
          label: ((_property$annotations7 = property.annotations.Common) === null || _property$annotations7 === void 0 ? void 0 : (_property$annotations8 = _property$annotations7.Label) === null || _property$annotations8 === void 0 ? void 0 : _property$annotations8.toString()) ?? property.name,
          group: targetEntityType.name,
          groupLabel: (targetEntityType === null || targetEntityType === void 0 ? void 0 : (_targetEntityType$ann = targetEntityType.annotations) === null || _targetEntityType$ann === void 0 ? void 0 : (_targetEntityType$ann2 = _targetEntityType$ann.Common) === null || _targetEntityType$ann2 === void 0 ? void 0 : (_targetEntityType$ann3 = _targetEntityType$ann2.Label) === null || _targetEntityType$ann3 === void 0 ? void 0 : _targetEntityType$ann3.toString()) ?? targetEntityType.name
        };
      getSettingsOfDefaultFilterFields(filterField);
      return filterField;
    }
    return undefined;
  };

  /**
   * Retrieve the configuration for the technical property DraftAdministrativeData. Only relevant for CreationDateTime
   * and LastChangeDateTime, as they are displaying the timeframe related properties as a SemanticDateRange.
   *
   * @param filterField
   */
  const getSettingsOfDefaultFilterFields = function (filterField) {
    if (filterField.key === "DraftAdministrativeData::CreationDateTime" || filterField.key === "DraftAdministrativeData::LastChangeDateTime") {
      const standardDynamicDateRangeKeys = [StandardDynamicDateRangeKeys.TO, StandardDynamicDateRangeKeys.TOMORROW, StandardDynamicDateRangeKeys.NEXTWEEK, StandardDynamicDateRangeKeys.NEXTMONTH, StandardDynamicDateRangeKeys.NEXTQUARTER, StandardDynamicDateRangeKeys.NEXTYEAR];
      filterField.settings = {
        operatorConfiguration: [{
          path: "key",
          equals: standardDynamicDateRangeKeys.join(","),
          exclude: true
        }]
      };
    }
  };
  const _getSelectionFields = function (entityType, navigationPath, properties, includeHidden, converterContext) {
    const selectionFieldMap = {};
    if (properties) {
      properties.forEach(property => {
        const propertyPath = property.name;
        const fullPath = (navigationPath ? `${navigationPath}/` : "") + propertyPath;
        const selectionField = _createFilterSelectionField(entityType, property, fullPath, includeHidden, converterContext);
        if (selectionField) {
          selectionFieldMap[fullPath] = selectionField;
        }
      });
    }
    return selectionFieldMap;
  };
  const _getSelectionFieldsByPath = function (entityType, propertyPaths, includeHidden, converterContext) {
    let selectionFields = {};
    if (propertyPaths) {
      propertyPaths.forEach(propertyPath => {
        let localSelectionFields = {};
        const enhancedPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), propertyPath);
        const property = enhancedPath.targetObject;
        if (property === undefined || !includeHidden && enhancedPath.navigationProperties.find(navigationProperty => {
          var _navigationProperty$a, _navigationProperty$a2, _navigationProperty$a3;
          return ((_navigationProperty$a = navigationProperty.annotations) === null || _navigationProperty$a === void 0 ? void 0 : (_navigationProperty$a2 = _navigationProperty$a.UI) === null || _navigationProperty$a2 === void 0 ? void 0 : (_navigationProperty$a3 = _navigationProperty$a2.Hidden) === null || _navigationProperty$a3 === void 0 ? void 0 : _navigationProperty$a3.valueOf()) === true;
        })) {
          return;
        }
        if (isNavigationProperty(property)) {
          // handle navigation properties
          localSelectionFields = _getSelectionFields(entityType, propertyPath, property.targetType.entityProperties, includeHidden, converterContext);
        } else if (isComplexType(property.targetType)) {
          // handle ComplexType properties
          localSelectionFields = _getSelectionFields(entityType, propertyPath, property.targetType.properties, includeHidden, converterContext);
        } else {
          localSelectionFields = _getSelectionFields(entityType, getTargetNavigationPath(enhancedPath, true), [property], includeHidden, converterContext);
        }
        selectionFields = {
          ...selectionFields,
          ...localSelectionFields
        };
      });
    }
    return selectionFields;
  };
  const _getFilterField = function (filterFields, propertyPath, converterContext, entityType) {
    let filterField = filterFields[propertyPath];
    if (filterField) {
      delete filterFields[propertyPath];
    } else {
      filterField = _createFilterSelectionField(entityType, entityType.resolvePath(propertyPath), propertyPath, true, converterContext);
    }
    if (!filterField) {
      var _converterContext$get;
      (_converterContext$get = converterContext.getDiagnostics()) === null || _converterContext$get === void 0 ? void 0 : _converterContext$get.addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MISSING_SELECTIONFIELD);
    }
    // defined SelectionFields are available by default
    if (filterField) {
      var _entityType$annotatio, _entityType$annotatio2;
      filterField.availability = filterField.availability === "Hidden" ? "Hidden" : "Default";
      filterField.isParameter = !!((_entityType$annotatio = entityType.annotations) !== null && _entityType$annotatio !== void 0 && (_entityType$annotatio2 = _entityType$annotatio.Common) !== null && _entityType$annotatio2 !== void 0 && _entityType$annotatio2.ResultContext);
    }
    return filterField;
  };
  const _getDefaultFilterFields = function (aSelectOptions, entityType, converterContext, excludedFilterProperties, annotatedSelectionFields) {
    const selectionFields = [];
    const UISelectionFields = {};
    const properties = entityType.entityProperties;
    // Using entityType instead of entitySet
    annotatedSelectionFields === null || annotatedSelectionFields === void 0 ? void 0 : annotatedSelectionFields.forEach(SelectionField => {
      UISelectionFields[SelectionField.value] = true;
    });
    if (aSelectOptions && aSelectOptions.length > 0) {
      aSelectOptions === null || aSelectOptions === void 0 ? void 0 : aSelectOptions.forEach(selectOption => {
        const propertyName = selectOption.PropertyName;
        const sPropertyPath = propertyName === null || propertyName === void 0 ? void 0 : propertyName.value;
        const currentSelectionFields = {};
        annotatedSelectionFields === null || annotatedSelectionFields === void 0 ? void 0 : annotatedSelectionFields.forEach(SelectionField => {
          currentSelectionFields[SelectionField.value] = true;
        });
        if (sPropertyPath && !(sPropertyPath in excludedFilterProperties)) {
          if (!(sPropertyPath in currentSelectionFields)) {
            const FilterField = getFilterField(sPropertyPath, converterContext, entityType);
            if (FilterField) {
              selectionFields.push(FilterField);
            }
          }
        }
      });
    } else if (properties) {
      properties.forEach(property => {
        var _property$annotations9, _property$annotations10;
        const defaultFilterValue = (_property$annotations9 = property.annotations) === null || _property$annotations9 === void 0 ? void 0 : (_property$annotations10 = _property$annotations9.Common) === null || _property$annotations10 === void 0 ? void 0 : _property$annotations10.FilterDefaultValue;
        const propertyPath = property.name;
        if (!(propertyPath in excludedFilterProperties)) {
          if (defaultFilterValue && !(propertyPath in UISelectionFields)) {
            const FilterField = getFilterField(propertyPath, converterContext, entityType);
            if (FilterField) {
              selectionFields.push(FilterField);
            }
          }
        }
      });
    }
    return selectionFields;
  };

  /**
   * Get all parameter filter fields in case of a parameterized service.
   *
   * @param converterContext
   * @returns An array of parameter FilterFields
   */
  function _getParameterFields(converterContext) {
    var _parameterEntityType$, _parameterEntityType$2;
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const parameterEntityType = dataModelObjectPath.startingEntitySet.entityType;
    const isParameterized = !!((_parameterEntityType$ = parameterEntityType.annotations) !== null && _parameterEntityType$ !== void 0 && (_parameterEntityType$2 = _parameterEntityType$.Common) !== null && _parameterEntityType$2 !== void 0 && _parameterEntityType$2.ResultContext) && !dataModelObjectPath.targetEntitySet;
    const parameterConverterContext = isParameterized && converterContext.getConverterContextFor(`/${dataModelObjectPath.startingEntitySet.name}`);
    return parameterConverterContext ? parameterEntityType.entityProperties.map(function (property) {
      return _getFilterField({}, property.name, parameterConverterContext, parameterEntityType);
    }) : [];
  }

  /**
   * Determines if the FilterBar search field is hidden or not.
   *
   * @param listReportTables The list report tables
   * @param charts The ALP charts
   * @param converterContext The converter context
   * @returns The information if the FilterBar search field is hidden or not
   */
  const getFilterBarHideBasicSearch = function (listReportTables, charts, converterContext) {
    // Check if charts allow search
    const noSearchInCharts = charts.length === 0 || charts.every(chart => !chart.applySupported.enableSearch);

    // Check if all tables are analytical and none of them allow for search
    // or all tables are TreeTable and none of them allow for search
    const noSearchInTables = listReportTables.length === 0 || listReportTables.every(table => (table.enableAnalytics || table.control.type === "TreeTable") && !table.enableBasicSearch);
    const contextPath = converterContext.getContextPath();
    if (contextPath && noSearchInCharts && noSearchInTables) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Retrieves filter fields from the manifest.
   *
   * @param entityType The current entityType
   * @param converterContext The converter context
   * @returns The filter fields defined in the manifest
   */
  _exports.getFilterBarHideBasicSearch = getFilterBarHideBasicSearch;
  const getManifestFilterFields = function (entityType, converterContext) {
    const fbConfig = converterContext.getManifestWrapper().getFilterConfiguration();
    const definedFilterFields = (fbConfig === null || fbConfig === void 0 ? void 0 : fbConfig.filterFields) || {};
    const selectionFields = _getSelectionFieldsByPath(entityType, Object.keys(definedFilterFields).map(key => definedFilterFields[key].property ?? KeyHelper.getPathFromSelectionFieldKey(key)), true, converterContext);
    const filterFields = {};
    for (const sKey in definedFilterFields) {
      const filterField = definedFilterFields[sKey];
      const propertyName = filterField.property ?? KeyHelper.getPathFromSelectionFieldKey(sKey);
      const selectionField = selectionFields[propertyName];
      const type = filterField.type === "Slot" ? filterFieldType.Slot : filterFieldType.Default;
      const visualFilter = filterField && filterField !== null && filterField !== void 0 && filterField.visualFilter ? getVisualFilters(entityType, converterContext, sKey, definedFilterFields) : undefined;
      if (filterField.template || filterField.type === filterFieldType.Slot) {
        if (filterField.settings) {
          filterField.settings.isCustomFilter = true;
        } else {
          filterField.settings = {
            isCustomFilter: true
          };
        }
      }
      filterFields[sKey] = {
        key: sKey,
        type: type,
        slotName: (filterField === null || filterField === void 0 ? void 0 : filterField.slotName) || sKey,
        annotationPath: selectionField === null || selectionField === void 0 ? void 0 : selectionField.annotationPath,
        conditionPath: filterField.property ? KeyHelper.getPathFromSelectionFieldKey(sKey) : (selectionField === null || selectionField === void 0 ? void 0 : selectionField.conditionPath) || propertyName,
        template: filterField.template,
        label: filterField.label,
        position: filterField.position || {
          placement: Placement.After
        },
        availability: filterField.availability || "Default",
        settings: filterField.settings,
        visualFilter: visualFilter,
        required: filterField.required
      };
    }
    return filterFields;
  };
  _exports.getManifestFilterFields = getManifestFilterFields;
  const getFilterField = function (propertyPath, converterContext, entityType) {
    return _getFilterField({}, propertyPath, converterContext, entityType);
  };
  _exports.getFilterField = getFilterField;
  const getFilterRestrictions = function (oFilterRestrictionsAnnotation, sRestriction) {
    let aProps = [];
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation[sRestriction]) {
      aProps = oFilterRestrictionsAnnotation[sRestriction].map(function (oProperty) {
        return oProperty.value;
      });
    }
    return aProps;
  };
  _exports.getFilterRestrictions = getFilterRestrictions;
  const getFilterAllowedExpression = function (oFilterRestrictionsAnnotation) {
    const mAllowedExpressions = {};
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation.FilterExpressionRestrictions) {
      oFilterRestrictionsAnnotation.FilterExpressionRestrictions.forEach(function (oProperty) {
        var _oProperty$Property;
        //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
        if ((_oProperty$Property = oProperty.Property) !== null && _oProperty$Property !== void 0 && _oProperty$Property.value && oProperty.AllowedExpressions) {
          var _oProperty$Property2;
          if (mAllowedExpressions[(_oProperty$Property2 = oProperty.Property) === null || _oProperty$Property2 === void 0 ? void 0 : _oProperty$Property2.value]) {
            var _oProperty$Property3;
            mAllowedExpressions[(_oProperty$Property3 = oProperty.Property) === null || _oProperty$Property3 === void 0 ? void 0 : _oProperty$Property3.value].push(oProperty.AllowedExpressions.toString());
          } else {
            var _oProperty$Property4;
            mAllowedExpressions[(_oProperty$Property4 = oProperty.Property) === null || _oProperty$Property4 === void 0 ? void 0 : _oProperty$Property4.value] = [oProperty.AllowedExpressions.toString()];
          }
        }
      });
    }
    return mAllowedExpressions;
  };
  _exports.getFilterAllowedExpression = getFilterAllowedExpression;
  const getSearchFilterPropertyInfo = function () {
    return {
      name: "$search",
      path: "$search",
      dataType: sStringDataType,
      maxConditions: 1
    };
  };
  const getEditStateFilterPropertyInfo = function () {
    return {
      name: "$editState",
      path: "$editState",
      groupLabel: "",
      group: "",
      dataType: sStringDataType,
      hiddenFilter: false
    };
  };
  const getSearchRestrictions = function (converterContext) {
    var _entitySet$annotation;
    const entitySet = converterContext.getEntitySet();
    return isEntitySet(entitySet) ? (_entitySet$annotation = entitySet.annotations.Capabilities) === null || _entitySet$annotation === void 0 ? void 0 : _entitySet$annotation.SearchRestrictions : undefined;
  };
  const getNavigationRestrictions = function (converterContext, sNavigationPath) {
    var _converterContext$get2, _converterContext$get3, _converterContext$get4;
    const oNavigationRestrictions = (_converterContext$get2 = converterContext.getEntitySet()) === null || _converterContext$get2 === void 0 ? void 0 : (_converterContext$get3 = _converterContext$get2.annotations) === null || _converterContext$get3 === void 0 ? void 0 : (_converterContext$get4 = _converterContext$get3.Capabilities) === null || _converterContext$get4 === void 0 ? void 0 : _converterContext$get4.NavigationRestrictions;
    const aRestrictedProperties = oNavigationRestrictions && oNavigationRestrictions.RestrictedProperties;
    return aRestrictedProperties && aRestrictedProperties.find(function (oRestrictedProperty) {
      return oRestrictedProperty && oRestrictedProperty.NavigationProperty && oRestrictedProperty.NavigationProperty.value === sNavigationPath;
    });
  };
  _exports.getNavigationRestrictions = getNavigationRestrictions;
  const _fetchBasicPropertyInfo = function (oFilterFieldInfo) {
    var _oFilterFieldInfo$set;
    return {
      key: oFilterFieldInfo.key,
      annotationPath: oFilterFieldInfo.annotationPath,
      conditionPath: oFilterFieldInfo.conditionPath,
      name: oFilterFieldInfo.conditionPath,
      label: oFilterFieldInfo.label,
      hiddenFilter: oFilterFieldInfo.availability === "Hidden",
      display: "Value",
      isParameter: oFilterFieldInfo.isParameter,
      caseSensitive: oFilterFieldInfo.caseSensitive,
      availability: oFilterFieldInfo.availability,
      position: oFilterFieldInfo.position,
      type: oFilterFieldInfo.type,
      template: oFilterFieldInfo.template,
      menu: oFilterFieldInfo.menu,
      required: oFilterFieldInfo.required,
      isCustomFilter: (_oFilterFieldInfo$set = oFilterFieldInfo.settings) === null || _oFilterFieldInfo$set === void 0 ? void 0 : _oFilterFieldInfo$set.isCustomFilter
    };
  };
  const getSpecificAllowedExpression = function (aExpressions) {
    const aAllowedExpressionsPriority = ["SingleValue", "MultiValue", "SingleRange", "MultiRange", "SearchExpression", "MultiRangeOrSearchExpression"];
    aExpressions.sort(function (a, b) {
      return aAllowedExpressionsPriority.indexOf(a) - aAllowedExpressionsPriority.indexOf(b);
    });
    return aExpressions[0];
  };
  _exports.getSpecificAllowedExpression = getSpecificAllowedExpression;
  const displayMode = function (oPropertyAnnotations, oCollectionAnnotations) {
    var _oPropertyAnnotations, _oPropertyAnnotations2, _oPropertyAnnotations3, _oPropertyAnnotations4, _oPropertyAnnotations5, _oCollectionAnnotatio;
    const oTextAnnotation = oPropertyAnnotations === null || oPropertyAnnotations === void 0 ? void 0 : (_oPropertyAnnotations = oPropertyAnnotations.Common) === null || _oPropertyAnnotations === void 0 ? void 0 : _oPropertyAnnotations.Text,
      oTextArrangmentAnnotation = oTextAnnotation && (oPropertyAnnotations && (oPropertyAnnotations === null || oPropertyAnnotations === void 0 ? void 0 : (_oPropertyAnnotations2 = oPropertyAnnotations.Common) === null || _oPropertyAnnotations2 === void 0 ? void 0 : (_oPropertyAnnotations3 = _oPropertyAnnotations2.Text) === null || _oPropertyAnnotations3 === void 0 ? void 0 : (_oPropertyAnnotations4 = _oPropertyAnnotations3.annotations) === null || _oPropertyAnnotations4 === void 0 ? void 0 : (_oPropertyAnnotations5 = _oPropertyAnnotations4.UI) === null || _oPropertyAnnotations5 === void 0 ? void 0 : _oPropertyAnnotations5.TextArrangement) || oCollectionAnnotations && (oCollectionAnnotations === null || oCollectionAnnotations === void 0 ? void 0 : (_oCollectionAnnotatio = oCollectionAnnotations.UI) === null || _oCollectionAnnotatio === void 0 ? void 0 : _oCollectionAnnotatio.TextArrangement));
    if (oTextArrangmentAnnotation) {
      if (oTextArrangmentAnnotation.valueOf() === "UI.TextArrangementType/TextOnly") {
        return "Description";
      } else if (oTextArrangmentAnnotation.valueOf() === "UI.TextArrangementType/TextLast") {
        return "ValueDescription";
      }
      return "DescriptionValue"; //TextFirst
    }

    return oTextAnnotation ? "DescriptionValue" : "Value";
  };
  _exports.displayMode = displayMode;
  const fetchPropertyInfo = function (converterContext, oFilterFieldInfo, oTypeConfig) {
    var _converterContext$get5;
    let oPropertyInfo = _fetchBasicPropertyInfo(oFilterFieldInfo);
    const sAnnotationPath = oFilterFieldInfo.annotationPath;
    if (!sAnnotationPath) {
      return oPropertyInfo;
    }
    const targetPropertyObject = converterContext.getConverterContextFor(sAnnotationPath).getDataModelObjectPath().targetObject;
    const oPropertyAnnotations = targetPropertyObject === null || targetPropertyObject === void 0 ? void 0 : targetPropertyObject.annotations;
    const oCollectionAnnotations = converterContext === null || converterContext === void 0 ? void 0 : (_converterContext$get5 = converterContext.getDataModelObjectPath().targetObject) === null || _converterContext$get5 === void 0 ? void 0 : _converterContext$get5.annotations;
    const oFormatOptions = oTypeConfig.formatOptions;
    const oConstraints = oTypeConfig.constraints;
    oPropertyInfo = Object.assign(oPropertyInfo, {
      formatOptions: oFormatOptions,
      constraints: oConstraints,
      display: displayMode(oPropertyAnnotations, oCollectionAnnotations)
    });
    return oPropertyInfo;
  };
  _exports.fetchPropertyInfo = fetchPropertyInfo;
  const isMultiValue = function (oProperty) {
    let bIsMultiValue = true;
    //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
    switch (oProperty.filterExpression) {
      case "SearchExpression":
      case "SingleRange":
      case "SingleValue":
        bIsMultiValue = false;
        break;
      default:
        break;
    }
    if (oProperty.type && oProperty.type.indexOf("Boolean") > 0) {
      bIsMultiValue = false;
    }
    return bIsMultiValue;
  };
  _exports.isMultiValue = isMultiValue;
  const _isFilterableNavigationProperty = function (entry) {
    return (entry.$Type === "com.sap.vocabularies.UI.v1.DataField" || entry.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || entry.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") && entry.Value.path.includes("/");
  };

  /**
   * Adds the additional property which references to the unit, timezone, textArrangement or currency from a data field.
   *
   * @param dataField The data field to be considered
   * @param converterContext The converter context
   * @param navProperties The list of navigation properties
   */
  const addChildNavigationProperties = function (dataField, converterContext, navProperties) {
    var _Value;
    const targetProperty = (_Value = dataField.Value) === null || _Value === void 0 ? void 0 : _Value.$target;
    if (targetProperty) {
      const additionalPropertyPath = getAssociatedTextPropertyPath(targetProperty) || getAssociatedCurrencyPropertyPath(targetProperty) || getAssociatedUnitPropertyPath(targetProperty) || getAssociatedTimezonePropertyPath(targetProperty);
      const navigationProperty = additionalPropertyPath ? enhanceDataModelPath(converterContext.getDataModelObjectPath(), additionalPropertyPath).navigationProperties : undefined;
      if (navigationProperty !== null && navigationProperty !== void 0 && navigationProperty.length) {
        const navigationPropertyPath = navigationProperty[0].name;
        if (!navProperties.includes(navigationPropertyPath)) {
          navProperties.push(navigationPropertyPath);
        }
      }
    }
  };

  /**
   * Gets used navigation properties for available dataField.
   *
   * @param navProperties The list of navigation properties
   * @param dataField The data field to be considered
   * @param converterContext The converter context
   * @returns The list of navigation properties
   */
  const getNavigationPropertiesRecursively = function (navProperties, dataField, converterContext) {
    var _dataField$Target, _dataField$Target$$ta, _dataField$Target$$ta2;
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        switch ((_dataField$Target = dataField.Target) === null || _dataField$Target === void 0 ? void 0 : (_dataField$Target$$ta = _dataField$Target.$target) === null || _dataField$Target$$ta === void 0 ? void 0 : _dataField$Target$$ta.$Type) {
          case "com.sap.vocabularies.UI.v1.FieldGroupType":
            (_dataField$Target$$ta2 = dataField.Target.$target.Data) === null || _dataField$Target$$ta2 === void 0 ? void 0 : _dataField$Target$$ta2.forEach(innerDataField => {
              getNavigationPropertiesRecursively(navProperties, innerDataField, converterContext);
            });
            break;
          default:
            break;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        if (_isFilterableNavigationProperty(dataField)) {
          const navigationPropertyPath = getRelativePaths(enhanceDataModelPath(converterContext.getDataModelObjectPath(), dataField.Value.path)).join("/");
          if (!navProperties.includes(navigationPropertyPath)) {
            navProperties.push(navigationPropertyPath);
          }
        }
        // Additional property from text arrangement/units/currencies/timezone...
        addChildNavigationProperties(dataField, converterContext, navProperties);
        break;
      default:
        break;
    }
    return navProperties;
  };
  const getAnnotatedSelectionFieldData = function (converterContext) {
    var _converterContext$get6, _entityType$annotatio3, _entityType$annotatio4;
    let lrTables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let annotationPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    let includeHidden = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let lineItemTerm = arguments.length > 4 ? arguments[4] : undefined;
    // Fetch all selectionVariants defined in the different visualizations and different views (multi table mode)
    const selectionVariants = getSelectionVariants(lrTables, converterContext);

    // create a map of properties to be used in selection variants
    const excludedFilterProperties = getExcludedFilterProperties(selectionVariants);
    const entityType = converterContext.getEntityType();
    //Filters which has to be added which is part of SV/Default annotations but not present in the SelectionFields
    const annotatedSelectionFields = annotationPath && ((_converterContext$get6 = converterContext.getEntityTypeAnnotation(annotationPath)) === null || _converterContext$get6 === void 0 ? void 0 : _converterContext$get6.annotation) || ((_entityType$annotatio3 = entityType.annotations) === null || _entityType$annotatio3 === void 0 ? void 0 : (_entityType$annotatio4 = _entityType$annotatio3.UI) === null || _entityType$annotatio4 === void 0 ? void 0 : _entityType$annotatio4.SelectionFields) || [];
    let navProperties = [];
    if (lrTables.length === 0 && !!lineItemTerm) {
      var _converterContext$get7;
      (_converterContext$get7 = converterContext.getEntityTypeAnnotation(lineItemTerm).annotation) === null || _converterContext$get7 === void 0 ? void 0 : _converterContext$get7.forEach(dataField => {
        navProperties = getNavigationPropertiesRecursively(navProperties, dataField, converterContext);
      });
    }
    if (ModelHelper.isDraftRoot(converterContext.getEntitySet())) {
      navProperties.push("DraftAdministrativeData/CreationDateTime", "DraftAdministrativeData/CreatedByUser", "DraftAdministrativeData/LastChangeDateTime", "DraftAdministrativeData/LastChangedByUser");
    }

    // create a map of all potential filter fields based on...
    const filterFields = {
      // ...non hidden properties of the entity
      ..._getSelectionFields(entityType, "", entityType.entityProperties, includeHidden, converterContext),
      // ... non hidden properties of navigation properties
      ..._getSelectionFieldsByPath(entityType, navProperties, false, converterContext),
      // ...additional manifest defined navigation properties
      ..._getSelectionFieldsByPath(entityType, converterContext.getManifestWrapper().getFilterConfiguration().navigationProperties, includeHidden, converterContext)
    };
    let aSelectOptions = [];
    const selectionVariant = getSelectionVariant(entityType, converterContext);
    if (selectionVariant) {
      aSelectOptions = selectionVariant.SelectOptions;
    }
    const propertyInfoFields = (annotatedSelectionFields === null || annotatedSelectionFields === void 0 ? void 0 : annotatedSelectionFields.reduce((selectionFields, selectionField) => {
      const propertyPath = selectionField.value;
      if (!(propertyPath in excludedFilterProperties)) {
        let navigationPath;
        if (annotationPath.startsWith("@com.sap.vocabularies.UI.v1.SelectionFields")) {
          navigationPath = "";
        } else {
          navigationPath = annotationPath.split("/@com.sap.vocabularies.UI.v1.SelectionFields")[0];
        }
        const filterPropertyPath = navigationPath ? navigationPath + "/" + propertyPath : propertyPath;
        const filterField = _getFilterField(filterFields, filterPropertyPath, converterContext, entityType);
        if (filterField) {
          filterField.group = "";
          filterField.groupLabel = "";
          selectionFields.push(filterField);
        }
      }
      return selectionFields;
    }, [])) || [];
    const defaultFilterFields = _getDefaultFilterFields(aSelectOptions, entityType, converterContext, excludedFilterProperties, annotatedSelectionFields);
    return {
      excludedFilterProperties: excludedFilterProperties,
      entityType: entityType,
      annotatedSelectionFields: annotatedSelectionFields,
      filterFields: filterFields,
      propertyInfoFields: propertyInfoFields,
      defaultFilterFields: defaultFilterFields
    };
  };
  const fetchTypeConfig = function (property) {
    const oTypeConfig = getTypeConfig(property, property === null || property === void 0 ? void 0 : property.type);
    if ((property === null || property === void 0 ? void 0 : property.type) === sEdmString && (oTypeConfig.constraints.nullable === undefined || oTypeConfig.constraints.nullable === true)) {
      oTypeConfig.formatOptions.parseKeepsEmptyString = false;
    }
    return oTypeConfig;
  };
  _exports.fetchTypeConfig = fetchTypeConfig;
  const assignDataTypeToPropertyInfo = function (propertyInfoField, converterContext, aRequiredProps, aTypeConfig) {
    let oPropertyInfo = fetchPropertyInfo(converterContext, propertyInfoField, aTypeConfig[propertyInfoField.key]),
      sPropertyPath = "";
    if (propertyInfoField.conditionPath) {
      sPropertyPath = propertyInfoField.conditionPath.replace(/\+|\*/g, "");
    }
    if (oPropertyInfo) {
      oPropertyInfo = Object.assign(oPropertyInfo, {
        maxConditions: !oPropertyInfo.isParameter && isMultiValue(oPropertyInfo) ? -1 : 1,
        required: propertyInfoField.required ?? (oPropertyInfo.isParameter || aRequiredProps.includes(sPropertyPath)),
        caseSensitive: isFilteringCaseSensitive(converterContext),
        dataType: aTypeConfig[propertyInfoField.key].type
      });
    }
    return oPropertyInfo;
  };
  _exports.assignDataTypeToPropertyInfo = assignDataTypeToPropertyInfo;
  const processSelectionFields = function (propertyInfoFields, converterContext, defaultValuePropertyFields) {
    var _entitySet$annotation2;
    //get TypeConfig function
    const selectionFieldTypes = [];
    const aTypeConfig = {};
    if (defaultValuePropertyFields) {
      propertyInfoFields = propertyInfoFields.concat(defaultValuePropertyFields);
    }
    //add typeConfig
    propertyInfoFields.forEach(function (parameterField) {
      if (parameterField.annotationPath) {
        const propertyConvertyContext = converterContext.getConverterContextFor(parameterField.annotationPath);
        const propertyTargetObject = propertyConvertyContext.getDataModelObjectPath().targetObject;
        selectionFieldTypes.push(propertyTargetObject === null || propertyTargetObject === void 0 ? void 0 : propertyTargetObject.type);
        const oTypeConfig = fetchTypeConfig(propertyTargetObject);
        aTypeConfig[parameterField.key] = oTypeConfig;
      } else {
        selectionFieldTypes.push(sEdmString);
        aTypeConfig[parameterField.key] = {
          type: sStringDataType
        };
      }
    });

    // filterRestrictions
    const entitySet = converterContext.getEntitySet();
    const oFilterRestrictions = isEntitySet(entitySet) ? (_entitySet$annotation2 = entitySet.annotations.Capabilities) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.FilterRestrictions : undefined;
    const oRet = {};
    oRet.RequiredProperties = getFilterRestrictions(oFilterRestrictions, "RequiredProperties") || [];
    oRet.NonFilterableProperties = getFilterRestrictions(oFilterRestrictions, "NonFilterableProperties") || [];
    oRet.FilterAllowedExpressions = getFilterAllowedExpression(oFilterRestrictions);
    const sEntitySetPath = converterContext.getContextPath();
    const aPathParts = sEntitySetPath.split("/");
    if (aPathParts.length > 2) {
      const sNavigationPath = aPathParts[aPathParts.length - 1];
      aPathParts.splice(-1, 1);
      const oNavigationRestrictions = getNavigationRestrictions(converterContext, sNavigationPath);
      const oNavigationFilterRestrictions = oNavigationRestrictions && oNavigationRestrictions.FilterRestrictions;
      oRet.RequiredProperties = oRet.RequiredProperties.concat(getFilterRestrictions(oNavigationFilterRestrictions, "RequiredProperties") || []);
      oRet.NonFilterableProperties = oRet.NonFilterableProperties.concat(getFilterRestrictions(oNavigationFilterRestrictions, "NonFilterableProperties") || []);
      oRet.FilterAllowedExpressions = {
        ...(getFilterAllowedExpression(oNavigationFilterRestrictions) || {}),
        ...oRet.FilterAllowedExpressions
      };
    }
    const aRequiredProps = oRet.RequiredProperties;
    const aNonFilterableProps = oRet.NonFilterableProperties;
    const aFetchedProperties = [];

    // process the fields to add necessary properties
    propertyInfoFields.forEach(function (propertyInfoField) {
      const sPropertyPath = propertyInfoField.conditionPath.replace(/\+|\*/g, "");
      if (!aNonFilterableProps.includes(sPropertyPath)) {
        const oPropertyInfo = assignDataTypeToPropertyInfo(propertyInfoField, converterContext, aRequiredProps, aTypeConfig);
        aFetchedProperties.push(oPropertyInfo);
      }
    });

    //add edit
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    if (ModelHelper.isObjectPathDraftSupported(dataModelObjectPath)) {
      aFetchedProperties.push(getEditStateFilterPropertyInfo());
    }
    // add search
    const searchRestrictions = getSearchRestrictions(converterContext);
    const hideBasicSearch = Boolean(searchRestrictions && !searchRestrictions.Searchable);
    if (sEntitySetPath && hideBasicSearch !== true) {
      if (!searchRestrictions || searchRestrictions !== null && searchRestrictions !== void 0 && searchRestrictions.Searchable) {
        aFetchedProperties.push(getSearchFilterPropertyInfo());
      }
    }
    return aFetchedProperties;
  };
  _exports.processSelectionFields = processSelectionFields;
  const insertCustomManifestElements = function (filterFields, entityType, converterContext) {
    return insertCustomElements(filterFields, getManifestFilterFields(entityType, converterContext), {
      availability: OverrideType.overwrite,
      label: OverrideType.overwrite,
      type: OverrideType.overwrite,
      position: OverrideType.overwrite,
      slotName: OverrideType.overwrite,
      template: OverrideType.overwrite,
      settings: OverrideType.overwrite,
      visualFilter: OverrideType.overwrite,
      required: OverrideType.overwrite
    });
  };
  _exports.insertCustomManifestElements = insertCustomManifestElements;
  const sortPropertyInfosByGroupLabel = propertyInfos => {
    propertyInfos.sort(function (a, b) {
      const aGroupLabelIsSet = a.groupLabel !== undefined && a.groupLabel !== null;
      const bGroupLabelIsSet = b.groupLabel !== undefined && b.groupLabel !== null;
      if (!aGroupLabelIsSet && !bGroupLabelIsSet) {
        return 0;
      }
      if (aGroupLabelIsSet && !bGroupLabelIsSet) {
        return -1;
      }
      if (!aGroupLabelIsSet && bGroupLabelIsSet) {
        return 1;
      }
      return a.groupLabel.localeCompare(b.groupLabel);
    });
  };

  /**
   * Retrieve the configuration for the selection fields that will be used within the filter bar
   * This configuration takes into account the annotation and the selection variants.
   *
   * @param converterContext
   * @param lrTables
   * @param annotationPath
   * @param [includeHidden]
   * @param [lineItemTerm]
   * @returns An array of selection fields
   */
  _exports.sortPropertyInfosByGroupLabel = sortPropertyInfosByGroupLabel;
  const getSelectionFields = function (converterContext) {
    var _entityType$annotatio5, _entityType$annotatio6;
    let lrTables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    let annotationPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    let includeHidden = arguments.length > 3 ? arguments[3] : undefined;
    let lineItemTerm = arguments.length > 4 ? arguments[4] : undefined;
    const oAnnotatedSelectionFieldData = getAnnotatedSelectionFieldData(converterContext, lrTables, annotationPath, includeHidden, lineItemTerm);
    const parameterFields = _getParameterFields(converterContext);
    let propertyInfoFields = oAnnotatedSelectionFieldData.propertyInfoFields;
    const entityType = oAnnotatedSelectionFieldData.entityType;
    propertyInfoFields = parameterFields.concat(propertyInfoFields);
    propertyInfoFields = insertCustomManifestElements(propertyInfoFields, entityType, converterContext);
    const aFetchedProperties = processSelectionFields(propertyInfoFields, converterContext, oAnnotatedSelectionFieldData.defaultFilterFields);
    sortPropertyInfosByGroupLabel(aFetchedProperties);
    let sFetchProperties = JSON.stringify(aFetchedProperties);
    sFetchProperties = sFetchProperties.replace(/\{/g, "\\{");
    sFetchProperties = sFetchProperties.replace(/\}/g, "\\}");
    const sPropertyInfo = sFetchProperties;
    // end of propertyFields processing

    // to populate selection fields
    let propSelectionFields = JSON.parse(JSON.stringify(oAnnotatedSelectionFieldData.propertyInfoFields));
    propSelectionFields = parameterFields.concat(propSelectionFields);
    // create a map of properties to be used in selection variants
    const excludedFilterProperties = oAnnotatedSelectionFieldData.excludedFilterProperties;
    const filterFacets = entityType === null || entityType === void 0 ? void 0 : (_entityType$annotatio5 = entityType.annotations) === null || _entityType$annotatio5 === void 0 ? void 0 : (_entityType$annotatio6 = _entityType$annotatio5.UI) === null || _entityType$annotatio6 === void 0 ? void 0 : _entityType$annotatio6.FilterFacets;
    let filterFacetMap = {};
    const aFieldGroups = converterContext.getAnnotationsByTerm("UI", "com.sap.vocabularies.UI.v1.FieldGroup");
    if (filterFacets === undefined || filterFacets.length < 0) {
      for (const i in aFieldGroups) {
        filterFacetMap = {
          ...filterFacetMap,
          ...getFieldGroupFilterGroups(aFieldGroups[i])
        };
      }
    } else {
      filterFacetMap = filterFacets.reduce((previousValue, filterFacet) => {
        for (let i = 0; i < (filterFacet === null || filterFacet === void 0 ? void 0 : (_filterFacet$Target = filterFacet.Target) === null || _filterFacet$Target === void 0 ? void 0 : (_filterFacet$Target$$ = _filterFacet$Target.$target) === null || _filterFacet$Target$$ === void 0 ? void 0 : (_filterFacet$Target$$2 = _filterFacet$Target$$.Data) === null || _filterFacet$Target$$2 === void 0 ? void 0 : _filterFacet$Target$$2.length); i++) {
          var _filterFacet$Target, _filterFacet$Target$$, _filterFacet$Target$$2, _filterFacet$Target2, _filterFacet$Target2$, _filterFacet$Target2$2, _filterFacet$Target2$3, _filterFacet$ID, _filterFacet$Label;
          previousValue[filterFacet === null || filterFacet === void 0 ? void 0 : (_filterFacet$Target2 = filterFacet.Target) === null || _filterFacet$Target2 === void 0 ? void 0 : (_filterFacet$Target2$ = _filterFacet$Target2.$target) === null || _filterFacet$Target2$ === void 0 ? void 0 : (_filterFacet$Target2$2 = _filterFacet$Target2$.Data[i]) === null || _filterFacet$Target2$2 === void 0 ? void 0 : (_filterFacet$Target2$3 = _filterFacet$Target2$2.Value) === null || _filterFacet$Target2$3 === void 0 ? void 0 : _filterFacet$Target2$3.path] = {
            group: filterFacet === null || filterFacet === void 0 ? void 0 : (_filterFacet$ID = filterFacet.ID) === null || _filterFacet$ID === void 0 ? void 0 : _filterFacet$ID.toString(),
            groupLabel: filterFacet === null || filterFacet === void 0 ? void 0 : (_filterFacet$Label = filterFacet.Label) === null || _filterFacet$Label === void 0 ? void 0 : _filterFacet$Label.toString()
          };
        }
        return previousValue;
      }, {});
    }

    // create a map of all potential filter fields based on...
    const filterFields = oAnnotatedSelectionFieldData.filterFields;

    // finally create final list of filter fields by adding the SelectionFields first (order matters)...
    let allFilters = propSelectionFields

    // ...and adding remaining filter fields, that are not used in a SelectionVariant (order doesn't matter)
    .concat(Object.keys(filterFields).filter(propertyPath => !(propertyPath in excludedFilterProperties)).map(propertyPath => {
      return Object.assign(filterFields[propertyPath], filterFacetMap[propertyPath]);
    }));
    const sContextPath = converterContext.getContextPath();

    //if all tables are analytical tables "aggregatable" properties must be excluded
    if (checkAllTableForEntitySetAreAnalytical(lrTables, sContextPath)) {
      // Currently all agregates are root entity properties (no properties coming from navigation) and all
      // tables with same entitySet gets same aggreagte configuration that's why we can use first table into
      // LR to get aggregates (without currency/unit properties since we expect to be able to filter them).
      const aggregates = lrTables[0].aggregates;
      if (aggregates) {
        const aggregatableProperties = Object.keys(aggregates).map(aggregateKey => aggregates[aggregateKey].relativePath);
        allFilters = allFilters.filter(filterField => {
          return !aggregatableProperties.includes(filterField.key);
        });
      }
    }
    const selectionFields = insertCustomManifestElements(allFilters, entityType, converterContext);

    // Add caseSensitive property to all selection fields.
    const isCaseSensitive = isFilteringCaseSensitive(converterContext);
    selectionFields.forEach(filterField => {
      filterField.caseSensitive = isCaseSensitive;
    });
    return {
      selectionFields,
      sPropertyInfo
    };
  };

  /**
   * Determines whether the filter bar inside a value help dialog should be expanded. This is true if one of the following conditions hold:
   * (1) a filter property is mandatory,
   * (2) no search field exists (entity isn't search enabled),
   * (3) when the data isn't loaded by default (annotation FetchValues = 2).
   *
   * @param converterContext The converter context
   * @param filterRestrictionsAnnotation The FilterRestriction annotation
   * @param valueList The ValueList annotation
   * @returns The value for expandFilterFields
   */
  _exports.getSelectionFields = getSelectionFields;
  const getExpandFilterFields = function (converterContext, filterRestrictionsAnnotation, valueList) {
    const requiredProperties = getFilterRestrictions(filterRestrictionsAnnotation, "RequiredProperties");
    const searchRestrictions = getSearchRestrictions(converterContext);
    const hideBasicSearch = Boolean(searchRestrictions && !searchRestrictions.Searchable);
    if (requiredProperties.length > 0 || hideBasicSearch || (valueList === null || valueList === void 0 ? void 0 : valueList.FetchValues) === 2) {
      return true;
    }
    return false;
  };
  _exports.getExpandFilterFields = getExpandFilterFields;
  return _exports;
}, false);
