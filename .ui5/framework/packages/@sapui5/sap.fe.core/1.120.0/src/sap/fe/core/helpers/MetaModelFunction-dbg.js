/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/type/EDM"], function (IssueManager, BindingToolkit, ModelHelper, EDM) {
  "use strict";

  var _exports = {};
  var isTypeFilterable = EDM.isTypeFilterable;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var compileExpression = BindingToolkit.compileExpression;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  // From FilterBar.block.ts only
  function getSearchRestrictions(fullPath, metaModel) {
    let searchRestrictions;
    let navigationSearchRestrictions;
    const navigationText = "$NavigationPropertyBinding";
    const searchRestrictionsTerm = "@Org.OData.Capabilities.V1.SearchRestrictions";
    const entityTypePathParts = fullPath.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entitySetPath = ModelHelper.getEntitySetPath(fullPath, metaModel);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = metaModel.getObject(`/${entityTypePathParts.join("/")}/$ContainsTarget`) ? true : false;
    const containmentNavPath = isContainment ? entityTypePathParts[entityTypePathParts.length - 1] : "";

    //LEAST PRIORITY - Search restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      searchRestrictions = metaModel.getObject(`${entitySetPath}${searchRestrictionsTerm}`);
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      // In case of containment we take entitySet provided as parent. And in case of normal we would remove the last navigation from entitySetPath.
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(`/${navigationText}/`)}`;

      //HIGHEST priority - Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModel, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      navigationSearchRestrictions = navigationRestrictions === null || navigationRestrictions === void 0 ? void 0 : navigationRestrictions.SearchRestrictions;
    }
    return navigationSearchRestrictions ?? searchRestrictions;
  }

  // From CommonUtils
  _exports.getSearchRestrictions = getSearchRestrictions;
  function getNavigationRestrictions(metaModelContext, entitySetPath, navigationPath) {
    const navigationRestrictions = metaModelContext.getObject(`${entitySetPath}@Org.OData.Capabilities.V1.NavigationRestrictions`);
    const restrictedProperties = navigationRestrictions === null || navigationRestrictions === void 0 ? void 0 : navigationRestrictions.RestrictedProperties;
    return restrictedProperties === null || restrictedProperties === void 0 ? void 0 : restrictedProperties.find(function (restrictedProperty) {
      var _restrictedProperty$N;
      return ((_restrictedProperty$N = restrictedProperty.NavigationProperty) === null || _restrictedProperty$N === void 0 ? void 0 : _restrictedProperty$N.$NavigationPropertyPath) === navigationPath;
    });
  }

  // Internal usage only
  _exports.getNavigationRestrictions = getNavigationRestrictions;
  function isInNonFilterableProperties(metamodelContext, entitySetPath, contextPath) {
    let isNotFilterable = false;
    const filterRestrictionsAnnotation = metamodelContext.getObject(`${entitySetPath}@Org.OData.Capabilities.V1.FilterRestrictions`);
    if (filterRestrictionsAnnotation !== null && filterRestrictionsAnnotation !== void 0 && filterRestrictionsAnnotation.NonFilterableProperties) {
      isNotFilterable = filterRestrictionsAnnotation.NonFilterableProperties.some(function (property) {
        return property.$NavigationPropertyPath === contextPath || property.$PropertyPath === contextPath;
      });
    }
    return isNotFilterable;
  }

  // Internal usage only
  function isCustomAggregate(metamodelContext, entitySetPath, contextPath) {
    let interanlIsCustomAggregate = false;
    // eslint-disable-next-line regex/invalid-warn
    const isApplySupported = metamodelContext.getObject(entitySetPath + "@Org.OData.Aggregation.V1.ApplySupported") ? true : false;
    if (isApplySupported) {
      const entitySetAnnotations = metamodelContext.getObject(`${entitySetPath}@`);
      const customAggregatesAnnotations = METAMODEL_FUNCTIONS.getAllCustomAggregates(entitySetAnnotations);
      const customAggregates = customAggregatesAnnotations ? Object.keys(customAggregatesAnnotations) : undefined;
      if (customAggregates !== null && customAggregates !== void 0 && customAggregates.includes(contextPath)) {
        interanlIsCustomAggregate = true;
      }
    }
    return interanlIsCustomAggregate;
  }

  // Internal usage only
  _exports.isCustomAggregate = isCustomAggregate;
  function checkEntitySetIsFilterable(entitySetPath, metaModelContext, property, navigationContext) {
    let isFilterable = entitySetPath.split("/").length === 2 && !property.includes("/") ? !isInNonFilterableProperties(metaModelContext, entitySetPath, property) && !isCustomAggregate(metaModelContext, entitySetPath, property) : !isContextPathFilterable(metaModelContext, entitySetPath, property);
    // check if type can be used for filtering
    if (isFilterable && navigationContext) {
      const propertyDataType = getPropertyDataType(navigationContext);
      if (propertyDataType) {
        isFilterable = propertyDataType ? isTypeFilterable(propertyDataType) : false;
      } else {
        isFilterable = false;
      }
    }
    return isFilterable;
  }

  // Internal usage only
  function isContextPathFilterable(metaModelContext, entitySetPath, contextPath) {
    const fullPath = `${entitySetPath}/${contextPath}`,
      esParts = fullPath.split("/").splice(0, 2),
      contexts = fullPath.split("/").splice(2);
    let isNoFilterable = false,
      context = "";
    entitySetPath = esParts.join("/");
    isNoFilterable = contexts.some(function (item, index, array) {
      if (context.length > 0) {
        context += `/${item}`;
      } else {
        context = item;
      }
      if (index === array.length - 2) {
        // In case of "/Customer/Set/Property" this is to check navigation restrictions of "Customer" for non-filterable properties in "Set"
        const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModelContext, entitySetPath, item);
        const filterRestrictions = navigationRestrictions === null || navigationRestrictions === void 0 ? void 0 : navigationRestrictions.FilterRestrictions;
        const nonFilterableProperties = filterRestrictions === null || filterRestrictions === void 0 ? void 0 : filterRestrictions.NonFilterableProperties;
        const targetPropertyPath = array[array.length - 1];
        if (nonFilterableProperties !== null && nonFilterableProperties !== void 0 && nonFilterableProperties.find(function (propertyPath) {
          return propertyPath.$PropertyPath === targetPropertyPath;
        })) {
          return true;
        }
      }
      if (index === array.length - 1) {
        //last path segment
        isNoFilterable = isInNonFilterableProperties(metaModelContext, entitySetPath, context);
      } else if (metaModelContext.getObject(`${entitySetPath}/$NavigationPropertyBinding/${item}`)) {
        //check existing context path and initialize it
        isNoFilterable = isInNonFilterableProperties(metaModelContext, entitySetPath, context);
        context = "";
        //set the new EntitySet
        entitySetPath = `/${metaModelContext.getObject(`${entitySetPath}/$NavigationPropertyBinding/${item}`)}`;
      }
      return isNoFilterable;
    });
    return isNoFilterable;
  }

  // Internal usage only

  function getPropertyDataType(navigationContext) {
    let dataType = navigationContext.getProperty("$Type");
    // if $kind exists, it's not a DataField and we have the final type already
    if (!navigationContext.getProperty("$kind")) {
      switch (dataType) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          dataType = undefined;
          break;
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          dataType = navigationContext.getProperty("Value/$Path/$Type");
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        default:
          const annotationPath = navigationContext.getProperty("Target/$AnnotationPath");
          if (annotationPath) {
            if (annotationPath.includes("com.sap.vocabularies.Communication.v1.Contact")) {
              dataType = navigationContext.getProperty("Target/$AnnotationPath/fn/$Path/$Type");
            } else if (annotationPath.includes("com.sap.vocabularies.UI.v1.DataPoint")) {
              dataType = navigationContext.getProperty("Value/$Path/$Type");
            } else {
              // e.g. FieldGroup or Chart
              dataType = undefined;
            }
          } else {
            dataType = undefined;
          }
          break;
      }
    }
    return dataType;
  }

  // From CommonUtils, CommonHelper, FilterBarDelegate, FilterField, ValueListHelper, TableDelegate
  // TODO check used places and rework this
  function isPropertyFilterable(metaModelContext, entitySetPath, property, skipHiddenFilters) {
    if (typeof property !== "string") {
      throw new Error("sProperty parameter must be a string");
    }

    // Parameters should be rendered as filterfields
    if (metaModelContext.getObject(`${entitySetPath}/@com.sap.vocabularies.Common.v1.ResultContext`) === true) {
      return true;
    }
    const navigationContext = metaModelContext.createBindingContext(`${entitySetPath}/${property}`);
    if (navigationContext && !skipHiddenFilters) {
      if (navigationContext.getProperty("@com.sap.vocabularies.UI.v1.Hidden") === true || navigationContext.getProperty("@com.sap.vocabularies.UI.v1.HiddenFilter") === true) {
        return false;
      }
      const hiddenPath = navigationContext.getProperty("@com.sap.vocabularies.UI.v1.Hidden/$Path");
      const hiddenFilterPath = navigationContext.getProperty("@com.sap.vocabularies.UI.v1.HiddenFilter/$Path");
      if (hiddenPath && hiddenFilterPath) {
        return compileExpression(not(or(pathInModel(hiddenPath), pathInModel(hiddenFilterPath))));
      } else if (hiddenPath) {
        return compileExpression(not(pathInModel(hiddenPath)));
      } else if (hiddenFilterPath) {
        return compileExpression(not(pathInModel(hiddenFilterPath)));
      }
    }
    return checkEntitySetIsFilterable(entitySetPath, metaModelContext, property, navigationContext);
  }

  // From TransactionHelper / EditFlow
  _exports.isPropertyFilterable = isPropertyFilterable;
  function getNonComputedVisibleFields(metaModelContext, path, appComponent) {
    const technicalKeys = metaModelContext.getObject(`${path}/`).$Key;
    const nonComputedVisibleKeys = [];
    const immutableVisibleFields = [];
    const entityType = metaModelContext.getObject(`${path}/`);
    for (const item in entityType) {
      if (entityType[item].$kind && entityType[item].$kind === "Property") {
        const annotations = metaModelContext.getObject(`${path}/${item}@`) || {},
          isKey = technicalKeys.includes(item),
          isImmutable = annotations["@Org.OData.Core.V1.Immutable"],
          isNonComputed = !annotations["@Org.OData.Core.V1.Computed"],
          isVisible = !annotations["@com.sap.vocabularies.UI.v1.Hidden"],
          isComputedDefaultValue = annotations["@Org.OData.Core.V1.ComputedDefaultValue"],
          isKeyComputedDefaultValueWithText = isKey && entityType[item].$Type === "Edm.Guid" ? isComputedDefaultValue && annotations["@com.sap.vocabularies.Common.v1.Text"] : false;
        if ((isKeyComputedDefaultValueWithText || isKey && entityType[item].$Type !== "Edm.Guid") && isNonComputed && isVisible) {
          nonComputedVisibleKeys.push(item);
        } else if (isImmutable && isNonComputed && isVisible) {
          immutableVisibleFields.push(item);
        }
        if (!isNonComputed && isComputedDefaultValue && appComponent) {
          const diagnostics = appComponent.getDiagnostics();
          const message = "Core.ComputedDefaultValue is ignored as Core.Computed is already set to true";
          diagnostics.addIssue(IssueCategory.Annotation, IssueSeverity.Medium, message, IssueCategoryType, IssueCategoryType.Annotations.IgnoredAnnotation);
        }
      }
    }
    const requiredProperties = METAMODEL_FUNCTIONS.getRequiredPropertiesFromInsertRestrictions(path, metaModelContext);
    if (requiredProperties.length) {
      requiredProperties.forEach(function (property) {
        const annotations = metaModelContext.getObject(`${path}/${property}@`),
          isVisible = !(annotations !== null && annotations !== void 0 && annotations["@com.sap.vocabularies.UI.v1.Hidden"]);
        if (isVisible && !nonComputedVisibleKeys.includes(property) && !immutableVisibleFields.includes(property)) {
          nonComputedVisibleKeys.push(property);
        }
      });
    }
    return nonComputedVisibleKeys.concat(immutableVisibleFields);
  }
  // Internal only, exposed for tests
  _exports.getNonComputedVisibleFields = getNonComputedVisibleFields;
  function getRequiredProperties(path, metaModelContext) {
    let checkUpdateRestrictions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    const requiredProperties = [];
    let requiredPropertiesWithPath = [];
    const navigationText = "$NavigationPropertyBinding";
    let entitySetAnnotation = null;
    if (path.endsWith("$")) {
      // if sPath comes with a $ in the end, removing it as it is of no significance
      path = path.replace("/$", "");
    }
    const entityTypePathParts = path.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entitySetPath = ModelHelper.getEntitySetPath(path, metaModelContext);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = metaModelContext.getObject(`/${entityTypePathParts.join("/")}/$ContainsTarget`) ? true : false;
    const containmentNavPath = isContainment ? entityTypePathParts[entityTypePathParts.length - 1] : "";

    //Restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      entitySetAnnotation = metaModelContext.getObject(`${entitySetPath}@`);
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(`/${navigationText}/`)}`;
      //Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const navigationRestrictions = METAMODEL_FUNCTIONS.getNavigationRestrictions(metaModelContext, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      if (navigationRestrictions !== undefined && METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(navigationRestrictions, true, checkUpdateRestrictions)) {
        var _navigationRestrictio, _navigationRestrictio2;
        requiredPropertiesWithPath = checkUpdateRestrictions ? ((_navigationRestrictio = navigationRestrictions.UpdateRestrictions) === null || _navigationRestrictio === void 0 ? void 0 : _navigationRestrictio.RequiredProperties) ?? [] : ((_navigationRestrictio2 = navigationRestrictions.InsertRestrictions) === null || _navigationRestrictio2 === void 0 ? void 0 : _navigationRestrictio2.RequiredProperties) ?? [];
      }
      if (!requiredPropertiesWithPath.length && METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(entitySetAnnotation, false, checkUpdateRestrictions)) {
        requiredPropertiesWithPath = METAMODEL_FUNCTIONS.getRequiredPropertiesFromAnnotations(entitySetAnnotation, checkUpdateRestrictions);
      }
    } else if (METAMODEL_FUNCTIONS.hasRestrictedPropertiesInAnnotations(entitySetAnnotation, false, checkUpdateRestrictions)) {
      requiredPropertiesWithPath = METAMODEL_FUNCTIONS.getRequiredPropertiesFromAnnotations(entitySetAnnotation, checkUpdateRestrictions);
    }
    requiredPropertiesWithPath.forEach(function (requiredProperty) {
      const propertyPath = requiredProperty.$PropertyPath;
      requiredProperties.push(propertyPath);
    });
    return requiredProperties;
  }

  // TransactionHelper // InternalField
  function getRequiredPropertiesFromInsertRestrictions(path, metamodelContext) {
    return METAMODEL_FUNCTIONS.getRequiredProperties(path, metamodelContext);
  }

  // InternalField
  _exports.getRequiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions;
  function getRequiredPropertiesFromUpdateRestrictions(path, metamodelContext) {
    return METAMODEL_FUNCTIONS.getRequiredProperties(path, metamodelContext, true);
  }

  // Internal only, exposed for tests
  _exports.getRequiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions;
  function getRequiredPropertiesFromAnnotations(annotations) {
    var _annotations$OrgODa2;
    let checkUpdateRestrictions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (checkUpdateRestrictions) {
      var _annotations$OrgODa;
      return (annotations === null || annotations === void 0 ? void 0 : (_annotations$OrgODa = annotations["@Org.OData.Capabilities.V1.UpdateRestrictions"]) === null || _annotations$OrgODa === void 0 ? void 0 : _annotations$OrgODa.RequiredProperties) ?? [];
    }
    return (annotations === null || annotations === void 0 ? void 0 : (_annotations$OrgODa2 = annotations["@Org.OData.Capabilities.V1.InsertRestrictions"]) === null || _annotations$OrgODa2 === void 0 ? void 0 : _annotations$OrgODa2.RequiredProperties) ?? [];
  }

  // Internal only, exposed for tests
  function hasRestrictedPropertiesInAnnotations(annotations) {
    var _entitytSetAnnotation;
    let isNavigationRestrictions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let checkUpdateRestrictions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (isNavigationRestrictions) {
      var _navAnnotations$Inser;
      const navAnnotations = annotations;
      if (checkUpdateRestrictions) {
        var _navAnnotations$Updat;
        return navAnnotations !== null && navAnnotations !== void 0 && (_navAnnotations$Updat = navAnnotations.UpdateRestrictions) !== null && _navAnnotations$Updat !== void 0 && _navAnnotations$Updat.RequiredProperties ? true : false;
      }
      return navAnnotations !== null && navAnnotations !== void 0 && (_navAnnotations$Inser = navAnnotations.InsertRestrictions) !== null && _navAnnotations$Inser !== void 0 && _navAnnotations$Inser.RequiredProperties ? true : false;
    } else if (checkUpdateRestrictions) {
      var _entityAnnotations$O;
      const entityAnnotations = annotations;
      return entityAnnotations !== null && entityAnnotations !== void 0 && (_entityAnnotations$O = entityAnnotations["@Org.OData.Capabilities.V1.UpdateRestrictions"]) !== null && _entityAnnotations$O !== void 0 && _entityAnnotations$O.RequiredProperties ? true : false;
    }
    const entitytSetAnnotations = annotations;
    return entitytSetAnnotations !== null && entitytSetAnnotations !== void 0 && (_entitytSetAnnotation = entitytSetAnnotations["@Org.OData.Capabilities.V1.InsertRestrictions"]) !== null && _entitytSetAnnotation !== void 0 && _entitytSetAnnotation.RequiredProperties ? true : false;
  }
  // Used in this file and FilterUtils
  /**
   * Returns custom aggregates for a given entitySet.
   *
   * @param annotations A list of annotations of the entity set
   * @returns A map to the custom aggregates keyed by their qualifiers
   */
  function getAllCustomAggregates(annotations) {
    const customAggregates = {};
    let annotation;
    for (const annotationKey in annotations) {
      if (annotationKey.startsWith("@Org.OData.Aggregation.V1.CustomAggregate")) {
        annotation = annotationKey.replace("@Org.OData.Aggregation.V1.CustomAggregate#", "");
        const annotationParts = annotation.split("@");
        if (annotationParts.length == 2) {
          const customAggregate = {};
          //inner annotation that is not part of 	Validation.AggregatableTerms
          if (annotationParts[1] == "Org.OData.Aggregation.V1.ContextDefiningProperties") {
            customAggregate.contextDefiningProperties = annotations[annotationKey];
          }
          if (annotationParts[1] == "com.sap.vocabularies.Common.v1.Label") {
            customAggregate.label = annotations[annotationKey];
          }
          customAggregates[annotationParts[0]] = customAggregate;
        } else if (annotationParts.length == 1) {
          customAggregates[annotationParts[0]] = {
            name: annotationParts[0],
            propertyPath: annotationParts[0],
            label: `Custom Aggregate (${annotation})`,
            sortable: true,
            sortOrder: "both",
            custom: true
          };
        }
      }
    }
    return customAggregates;
  }

  // Used in ValueListHelper, ChartDelegate and ValueHelp-TableDelegate
  _exports.getAllCustomAggregates = getAllCustomAggregates;
  /**
   * Determines the sorting information from the restriction annotation.
   *
   * @param entitySetAnnotations EntitySet or collection annotations with the sort restrictions annotation
   * @returns An object containing the sort restriction information
   */
  function getSortRestrictionsInfo(entitySetAnnotations) {
    const sortRestrictionsInfo = {
      sortable: true,
      propertyInfo: {}
    };
    const sortRestrictions = entitySetAnnotations["@Org.OData.Capabilities.V1.SortRestrictions"];
    if (!sortRestrictions) {
      return sortRestrictionsInfo;
    }
    if (sortRestrictions.Sortable === false) {
      sortRestrictionsInfo.sortable = false;
    }
    for (const propertyItem of sortRestrictions.NonSortableProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: false
      };
    }
    for (const propertyItem of sortRestrictions.AscendingOnlyProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: true,
        sortDirection: "asc" // not used, yet
      };
    }

    for (const propertyItem of sortRestrictions.DescendingOnlyProperties || []) {
      const propertyName = propertyItem.$PropertyPath;
      sortRestrictionsInfo.propertyInfo[propertyName] = {
        sortable: true,
        sortDirection: "desc" // not used, yet
      };
    }

    return sortRestrictionsInfo;
  }

  // Used in ChartDelegate and ValueHelp-TableDelegate
  _exports.getSortRestrictionsInfo = getSortRestrictionsInfo;
  /**
   * Determines the filter information based on the filter restrictions annoation.
   *
   * @param filterRestrictions The filter restrictions annotation
   * @returns An object containing the filter restriction information
   */
  function getFilterRestrictionsInfo(filterRestrictions) {
    let i, propertyName;
    const filterRestrictionsInfo = {
      filterable: true,
      requiresFilter: (filterRestrictions === null || filterRestrictions === void 0 ? void 0 : filterRestrictions.RequiresFilter) || false,
      propertyInfo: {},
      requiredProperties: []
    };
    if (!filterRestrictions) {
      return filterRestrictionsInfo;
    }
    if (filterRestrictions.Filterable === false) {
      filterRestrictionsInfo.filterable = false;
    }

    //Hierarchical Case
    if (filterRestrictions.RequiredProperties) {
      for (i = 0; i < filterRestrictions.RequiredProperties.length; i++) {
        propertyName = filterRestrictions.RequiredProperties[i].$PropertyPath;
        filterRestrictionsInfo.requiredProperties.push(propertyName);
      }
    }
    if (filterRestrictions.NonFilterableProperties) {
      for (i = 0; i < filterRestrictions.NonFilterableProperties.length; i++) {
        propertyName = filterRestrictions.NonFilterableProperties[i].$PropertyPath;
        filterRestrictionsInfo.propertyInfo[propertyName] = {
          filterable: false
        };
      }
    }
    if (filterRestrictions.FilterExpressionRestrictions) {
      //TBD
      for (i = 0; i < filterRestrictions.FilterExpressionRestrictions.length; i++) {
        var _filterRestrictions$F;
        propertyName = (_filterRestrictions$F = filterRestrictions.FilterExpressionRestrictions[i].Property) === null || _filterRestrictions$F === void 0 ? void 0 : _filterRestrictions$F.$PropertyPath;
        if (propertyName) {
          filterRestrictionsInfo.propertyInfo[propertyName] = {
            filterable: true,
            allowedExpressions: filterRestrictions.FilterExpressionRestrictions[i].AllowedExpressions
          };
        }
      }
    }
    return filterRestrictionsInfo;
  }

  // Used in ChartDelegate and ValueHelp-TableDelegate
  /**
   * Provides the information if the FilterExpression is a multiValue Filter Expression.
   *
   * @param filterExpression The FilterExpressionType
   * @returns A boolean value wether it is a multiValue Filter Expression or not
   */
  _exports.getFilterRestrictionsInfo = getFilterRestrictionsInfo;
  function isMultiValueFilterExpression(filterExpression) {
    let isMultiValue = true;

    //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
    switch (filterExpression) {
      case "SearchExpression":
      case "SingleRange":
      case "SingleValue":
        isMultiValue = false;
        break;
      default:
        break;
    }
    return isMultiValue;
  }

  // DO NOT USE, only for tests and internally in this file
  _exports.isMultiValueFilterExpression = isMultiValueFilterExpression;
  const METAMODEL_FUNCTIONS = {
    getRequiredProperties,
    getRequiredPropertiesFromAnnotations,
    hasRestrictedPropertiesInAnnotations,
    getRequiredPropertiesFromInsertRestrictions,
    getNavigationRestrictions,
    getAllCustomAggregates
  };
  _exports.METAMODEL_FUNCTIONS = METAMODEL_FUNCTIONS;
  return _exports;
}, false);
