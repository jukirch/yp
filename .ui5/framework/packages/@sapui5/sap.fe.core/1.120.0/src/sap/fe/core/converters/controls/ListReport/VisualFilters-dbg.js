/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FilterTemplating"], function (Aggregation, IssueManager, BindingToolkit, TypeGuards, DataModelPathHelper, FilterTemplating) {
  "use strict";

  var _exports = {};
  var isPropertyFilterable = FilterTemplating.isPropertyFilterable;
  var getIsRequired = FilterTemplating.getIsRequired;
  var checkFilterExpressionRestrictions = DataModelPathHelper.checkFilterExpressionRestrictions;
  var isEntitySet = TypeGuards.isEntitySet;
  var not = BindingToolkit.not;
  var compileExpression = BindingToolkit.compileExpression;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var AggregationHelper = Aggregation.AggregationHelper;
  /**
   * Checks that measures and dimensions of the visual filter chart can be aggregated and grouped.
   *
   * @param converterContext The converter context
   * @param chartAnnotation The chart annotation
   * @param aggregationHelper The aggregation helper
   * @returns `true` if the measure can be grouped and aggregated
   */
  const _checkVFAggregation = function (converterContext, chartAnnotation, aggregationHelper) {
    var _chartAnnotation$$tar, _chartAnnotation$$tar8, _chartAnnotation$$tar11, _chartAnnotation$$tar12;
    let sMeasurePath, bGroupable, bAggregatable;
    let sMeasure;
    const customAggregates = aggregationHelper.getCustomAggregateDefinitions();
    let aTransAggregations = aggregationHelper.getTransAggregations();
    let aCustAggMeasure = [];
    // if the chart definition has custom aggregates, then consider them, else fall back to the measures with transformation aggregates
    if (chartAnnotation !== null && chartAnnotation !== void 0 && (_chartAnnotation$$tar = chartAnnotation.$target) !== null && _chartAnnotation$$tar !== void 0 && _chartAnnotation$$tar.Measures) {
      var _chartAnnotation$$tar5, _chartAnnotation$$tar6, _chartAnnotation$$tar7;
      aCustAggMeasure = customAggregates.filter(function (custAgg) {
        var _chartAnnotation$$tar2, _chartAnnotation$$tar3, _chartAnnotation$$tar4;
        return custAgg.qualifier === (chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$$tar2 = chartAnnotation.$target) === null || _chartAnnotation$$tar2 === void 0 ? void 0 : (_chartAnnotation$$tar3 = _chartAnnotation$$tar2.Measures) === null || _chartAnnotation$$tar3 === void 0 ? void 0 : (_chartAnnotation$$tar4 = _chartAnnotation$$tar3[0]) === null || _chartAnnotation$$tar4 === void 0 ? void 0 : _chartAnnotation$$tar4.value);
      });
      sMeasure = aCustAggMeasure.length > 0 ? aCustAggMeasure[0].qualifier : chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$$tar5 = chartAnnotation.$target) === null || _chartAnnotation$$tar5 === void 0 ? void 0 : (_chartAnnotation$$tar6 = _chartAnnotation$$tar5.Measures) === null || _chartAnnotation$$tar6 === void 0 ? void 0 : (_chartAnnotation$$tar7 = _chartAnnotation$$tar6[0]) === null || _chartAnnotation$$tar7 === void 0 ? void 0 : _chartAnnotation$$tar7.value;
    }
    // consider dynamic measures only if there are no measures with custom aggregates
    if (!aCustAggMeasure[0] && chartAnnotation !== null && chartAnnotation !== void 0 && (_chartAnnotation$$tar8 = chartAnnotation.$target) !== null && _chartAnnotation$$tar8 !== void 0 && _chartAnnotation$$tar8.DynamicMeasures) {
      var _chartAnnotation$$tar9, _chartAnnotation$$tar10;
      sMeasure = converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath((_chartAnnotation$$tar9 = chartAnnotation.$target.DynamicMeasures) === null || _chartAnnotation$$tar9 === void 0 ? void 0 : (_chartAnnotation$$tar10 = _chartAnnotation$$tar9[0]) === null || _chartAnnotation$$tar10 === void 0 ? void 0 : _chartAnnotation$$tar10.value)).getDataModelObjectPath().targetObject.Name;
      aTransAggregations = aggregationHelper.getAggregatedProperties("AggregatedProperty");
    } else {
      aTransAggregations = aggregationHelper.getAggregatedProperties("AggregatedProperties")[0];
    }
    const sDimension = chartAnnotation === null || chartAnnotation === void 0 ? void 0 : (_chartAnnotation$$tar11 = chartAnnotation.$target) === null || _chartAnnotation$$tar11 === void 0 ? void 0 : (_chartAnnotation$$tar12 = _chartAnnotation$$tar11.Dimensions[0]) === null || _chartAnnotation$$tar12 === void 0 ? void 0 : _chartAnnotation$$tar12.value;
    if (customAggregates.some(function (custAgg) {
      return custAgg.qualifier === sMeasure;
    })) {
      sMeasurePath = sMeasure;
    } else if (aTransAggregations && aTransAggregations[0]) {
      aTransAggregations.some(function (oAggregate) {
        if (oAggregate.Name === sMeasure) {
          sMeasurePath = oAggregate === null || oAggregate === void 0 ? void 0 : oAggregate.AggregatableProperty.value;
        }
      });
    }
    const aAggregatablePropsFromContainer = aggregationHelper.getAggregatableProperties();
    const aGroupablePropsFromContainer = aggregationHelper.getGroupableProperties();
    if (aAggregatablePropsFromContainer && aAggregatablePropsFromContainer.length) {
      for (const aggregatableProp of aAggregatablePropsFromContainer) {
        var _Property;
        if ((aggregatableProp === null || aggregatableProp === void 0 ? void 0 : (_Property = aggregatableProp.Property) === null || _Property === void 0 ? void 0 : _Property.value) === sMeasurePath) {
          bAggregatable = true;
        }
      }
    }
    if (aGroupablePropsFromContainer && aGroupablePropsFromContainer.length) {
      for (const groupableProp of aGroupablePropsFromContainer) {
        if ((groupableProp === null || groupableProp === void 0 ? void 0 : groupableProp.value) === sDimension) {
          bGroupable = true;
        }
      }
    }
    return bAggregatable && bGroupable;
  };
  /**
   * Method to get the visual filters object for a property.
   *
   * @param entityType The converter context
   * @param converterContext The chart annotation
   * @param sPropertyPath The aggregation helper
   * @param FilterFields The aggregation helper
   * @returns The visual filters
   */
  function getVisualFilters(entityType, converterContext, sPropertyPath, FilterFields) {
    var _oVisualFilter$visual;
    let visualFilter;
    const oVisualFilter = FilterFields[sPropertyPath];
    if (oVisualFilter !== null && oVisualFilter !== void 0 && (_oVisualFilter$visual = oVisualFilter.visualFilter) !== null && _oVisualFilter$visual !== void 0 && _oVisualFilter$visual.valueList) {
      var _oVisualFilter$visual2, _property$annotations, _property$annotations2, _property$annotations3, _property$annotations4, _property$annotations5;
      const oVFPath = oVisualFilter === null || oVisualFilter === void 0 ? void 0 : (_oVisualFilter$visual2 = oVisualFilter.visualFilter) === null || _oVisualFilter$visual2 === void 0 ? void 0 : _oVisualFilter$visual2.valueList;
      const annotationQualifierSplit = oVFPath.split("#");
      const qualifierVL = annotationQualifierSplit.length > 1 ? `ValueList#${annotationQualifierSplit[1]}` : annotationQualifierSplit[0];
      const property = entityType.resolvePath(sPropertyPath);
      const valueList = property === null || property === void 0 ? void 0 : (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.Common) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2[qualifierVL];
      const isValueListWithFixedValues = (property === null || property === void 0 ? void 0 : (_property$annotations3 = property.annotations) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3.Common) === null || _property$annotations4 === void 0 ? void 0 : (_property$annotations5 = _property$annotations4.ValueListWithFixedValues) === null || _property$annotations5 === void 0 ? void 0 : _property$annotations5.valueOf()) || false;
      if (valueList) {
        var _converterContext$get, _collectionPathConver;
        const collectionPath = valueList === null || valueList === void 0 ? void 0 : valueList.CollectionPath.toString();
        const collectionPathConverterContext = converterContext.getConverterContextFor(`/${collectionPath || ((_converterContext$get = converterContext.getEntitySet()) === null || _converterContext$get === void 0 ? void 0 : _converterContext$get.name)}`);
        const valueListParams = valueList === null || valueList === void 0 ? void 0 : valueList.Parameters;
        let outParameter;
        const inParameters = [];
        let aParameters = [];
        const parameterEntityType = collectionPathConverterContext.getParameterEntityType();
        aParameters = parameterEntityType ? parameterEntityType.keys.map(function (key) {
          return key.name;
        }) : [];
        if (converterContext.getContextPath() === collectionPathConverterContext.getContextPath()) {
          _addInParameters(inParameters, aParameters, true);
        }
        if (valueListParams) {
          for (const valueListParam of valueListParams) {
            var _LocalDataProperty;
            const localDataProperty = (_LocalDataProperty = valueListParam.LocalDataProperty) === null || _LocalDataProperty === void 0 ? void 0 : _LocalDataProperty.value;
            const valueListProperty = valueListParam.ValueListProperty;
            if (((valueListParam === null || valueListParam === void 0 ? void 0 : valueListParam.$Type) === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || (valueListParam === null || valueListParam === void 0 ? void 0 : valueListParam.$Type) === "com.sap.vocabularies.Common.v1.ValueListParameterOut") && sPropertyPath === localDataProperty) {
              outParameter = valueListParam;
            }
            if (((valueListParam === null || valueListParam === void 0 ? void 0 : valueListParam.$Type) === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || (valueListParam === null || valueListParam === void 0 ? void 0 : valueListParam.$Type) === "com.sap.vocabularies.Common.v1.ValueListParameterIn") && sPropertyPath !== localDataProperty) {
              const bNotFilterable = isPropertyFilterable(collectionPathConverterContext, valueListProperty);
              if (!bNotFilterable) {
                inParameters.push({
                  localDataProperty: localDataProperty,
                  valueListProperty: valueListProperty
                });
              }
            }
          }
        }
        if (inParameters && inParameters.length) {
          inParameters.forEach(function (oInParameter) {
            const mainEntitySetInMappingAllowedExpression = compileExpression(checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(oInParameter === null || oInParameter === void 0 ? void 0 : oInParameter.localDataProperty)).getDataModelObjectPath(), ["SingleValue"]));
            const valueListEntitySetInMappingAllowedExpression = compileExpression(checkFilterExpressionRestrictions(collectionPathConverterContext.getConverterContextFor(collectionPathConverterContext.getAbsoluteAnnotationPath(oInParameter === null || oInParameter === void 0 ? void 0 : oInParameter.valueListProperty)).getDataModelObjectPath(), ["SingleValue"]));
            if (valueListEntitySetInMappingAllowedExpression === "true" && mainEntitySetInMappingAllowedExpression === "false") {
              throw new Error(`FilterRestrictions of ${sPropertyPath} in MainEntitySet and ValueListEntitySet are different`);
            }
          });
        }
        const pvQualifier = valueList === null || valueList === void 0 ? void 0 : valueList.PresentationVariantQualifier;
        const svQualifier = valueList === null || valueList === void 0 ? void 0 : valueList.SelectionVariantQualifier;
        const pvAnnotation = collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : (_collectionPathConver = collectionPathConverterContext.getEntityType().annotations.UI) === null || _collectionPathConver === void 0 ? void 0 : _collectionPathConver[`PresentationVariant#${pvQualifier}`];
        const aggregationHelper = new AggregationHelper(collectionPathConverterContext.getEntityType(), collectionPathConverterContext);
        if (!aggregationHelper.isAnalyticsSupported()) {
          return undefined;
        }
        if (pvAnnotation) {
          var _collectionPathConver2;
          const aVisualizations = pvAnnotation === null || pvAnnotation === void 0 ? void 0 : pvAnnotation.Visualizations;
          const contextPath = `/${valueList === null || valueList === void 0 ? void 0 : valueList.CollectionPath}` || `/${collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : (_collectionPathConver2 = collectionPathConverterContext.getEntitySet()) === null || _collectionPathConver2 === void 0 ? void 0 : _collectionPathConver2.name}`;
          visualFilter = {};
          visualFilter.contextPath = contextPath;
          visualFilter.isValueListWithFixedValues = isValueListWithFixedValues;
          let chartAnnotation;
          for (const visualization of aVisualizations) {
            var _visualization$$targe;
            if (((_visualization$$targe = visualization.$target) === null || _visualization$$targe === void 0 ? void 0 : _visualization$$targe.term) === "com.sap.vocabularies.UI.v1.Chart") {
              chartAnnotation = visualization;
              break;
            }
          }
          if (chartAnnotation) {
            var _chartAnnotation, _chartAnnotation$$tar13, _chartAnnotation$$tar14, _chartAnnotation$$tar15, _chartAnnotation$$tar16, _chartAnnotation$$tar17, _chartAnnotation$$tar18, _chartAnnotation2, _chartAnnotation2$$ta, _chartAnnotation2$$ta2, _chartAnnotation2$$ta3, _chartAnnotation2$$ta4, _chartAnnotation2$$ta5, _chartAnnotation2$$ta6;
            const _bgetVFAggregation = _checkVFAggregation(collectionPathConverterContext, chartAnnotation, aggregationHelper);
            if (!_bgetVFAggregation) {
              return;
            }
            const bDimensionHidden = (_chartAnnotation = chartAnnotation) === null || _chartAnnotation === void 0 ? void 0 : (_chartAnnotation$$tar13 = _chartAnnotation.$target) === null || _chartAnnotation$$tar13 === void 0 ? void 0 : (_chartAnnotation$$tar14 = _chartAnnotation$$tar13.Dimensions[0]) === null || _chartAnnotation$$tar14 === void 0 ? void 0 : (_chartAnnotation$$tar15 = _chartAnnotation$$tar14.$target) === null || _chartAnnotation$$tar15 === void 0 ? void 0 : (_chartAnnotation$$tar16 = _chartAnnotation$$tar15.annotations) === null || _chartAnnotation$$tar16 === void 0 ? void 0 : (_chartAnnotation$$tar17 = _chartAnnotation$$tar16.UI) === null || _chartAnnotation$$tar17 === void 0 ? void 0 : (_chartAnnotation$$tar18 = _chartAnnotation$$tar17.Hidden) === null || _chartAnnotation$$tar18 === void 0 ? void 0 : _chartAnnotation$$tar18.valueOf();
            const bDimensionHiddenFilter = (_chartAnnotation2 = chartAnnotation) === null || _chartAnnotation2 === void 0 ? void 0 : (_chartAnnotation2$$ta = _chartAnnotation2.$target) === null || _chartAnnotation2$$ta === void 0 ? void 0 : (_chartAnnotation2$$ta2 = _chartAnnotation2$$ta.Dimensions[0]) === null || _chartAnnotation2$$ta2 === void 0 ? void 0 : (_chartAnnotation2$$ta3 = _chartAnnotation2$$ta2.$target) === null || _chartAnnotation2$$ta3 === void 0 ? void 0 : (_chartAnnotation2$$ta4 = _chartAnnotation2$$ta3.annotations) === null || _chartAnnotation2$$ta4 === void 0 ? void 0 : (_chartAnnotation2$$ta5 = _chartAnnotation2$$ta4.UI) === null || _chartAnnotation2$$ta5 === void 0 ? void 0 : (_chartAnnotation2$$ta6 = _chartAnnotation2$$ta5.HiddenFilter) === null || _chartAnnotation2$$ta6 === void 0 ? void 0 : _chartAnnotation2$$ta6.valueOf();
            if (bDimensionHidden === true || bDimensionHiddenFilter === true) {
              return;
            } else if (aVisualizations && aVisualizations.length) {
              var _collectionPathConver3, _outParameter, _outParameter$LocalDa, _outParameter2, _requiredProperties, _visualFilter$require, _chartAnnotation3, _chartAnnotation3$$ta, _chartAnnotation3$$ta2, _chartAnnotation3$$ta3, _chartAnnotation$$tar19;
              visualFilter.chartAnnotation = chartAnnotation.$target ? collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : collectionPathConverterContext.getAbsoluteAnnotationPath(`${chartAnnotation.$target.fullyQualifiedName}/$AnnotationPath/`) : undefined;
              // This needs to be done to avoid repetitive entity type in case of non-parameterized entity set e.g /SalesOrderManage/com.c_salesordermanage_sd_aggregate.SalesOrderManage
              const entitySetName = (_collectionPathConver3 = collectionPathConverterContext.getEntitySet()) === null || _collectionPathConver3 === void 0 ? void 0 : _collectionPathConver3.name;
              let presentationAnnotation;
              const relativeAnnotationPath = collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : collectionPathConverterContext.getRelativeAnnotationPath(`${pvAnnotation.fullyQualifiedName}/`, collectionPathConverterContext.getEntityType());
              if (parameterEntityType) {
                presentationAnnotation = collectionPathConverterContext.getContextPath() + "/" + relativeAnnotationPath;
              } else {
                presentationAnnotation = "/" + entitySetName + "/" + relativeAnnotationPath;
              }
              visualFilter.presentationAnnotation = pvAnnotation ? presentationAnnotation : undefined;
              visualFilter.outParameter = (_outParameter = outParameter) === null || _outParameter === void 0 ? void 0 : (_outParameter$LocalDa = _outParameter.LocalDataProperty) === null || _outParameter$LocalDa === void 0 ? void 0 : _outParameter$LocalDa.value;
              visualFilter.inParameters = inParameters;
              visualFilter.valuelistProperty = (_outParameter2 = outParameter) === null || _outParameter2 === void 0 ? void 0 : _outParameter2.ValueListProperty;
              const bIsRange = checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(sPropertyPath)).getDataModelObjectPath(), ["SingleRange", "MultiRange"]);
              if (compileExpression(bIsRange) === "true") {
                converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
                return undefined;
              }
              const bIsMainEntitySetSingleSelection = checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(sPropertyPath)).getDataModelObjectPath(), ["SingleValue"]);
              visualFilter.multipleSelectionAllowed = compileExpression(not(bIsMainEntitySetSingleSelection));
              visualFilter.required = getIsRequired(converterContext, sPropertyPath);
              let svAnnotation;
              if (svQualifier) {
                var _collectionPathConver4, _svAnnotation;
                svAnnotation = collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : (_collectionPathConver4 = collectionPathConverterContext.getEntityTypeAnnotation(`@UI.SelectionVariant#${svQualifier}`)) === null || _collectionPathConver4 === void 0 ? void 0 : _collectionPathConver4.annotation;
                let selectionVariantAnnotation;
                const relativeSelectionVariantPath = collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : collectionPathConverterContext.getRelativeAnnotationPath(`${(_svAnnotation = svAnnotation) === null || _svAnnotation === void 0 ? void 0 : _svAnnotation.fullyQualifiedName}/`, collectionPathConverterContext.getEntityType());
                if (parameterEntityType) {
                  selectionVariantAnnotation = collectionPathConverterContext.getContextPath() + "/" + relativeSelectionVariantPath;
                } else {
                  selectionVariantAnnotation = "/" + entitySetName + "/" + relativeSelectionVariantPath;
                }
                visualFilter.selectionVariantAnnotation = svAnnotation ? selectionVariantAnnotation : undefined;
              }
              let requiredProperties = [];
              if (parameterEntityType) {
                var _oEntitySetConverterC, _oEntitySetConverterC2, _oEntitySetConverterC3, _oEntitySetConverterC4, _oRestrictedProperty$;
                const sEntitySet = collectionPath.split("/")[0];
                const sNavigationProperty = collectionPath.split("/")[1];
                const oEntitySetConverterContext = converterContext.getConverterContextFor(`/${sEntitySet}`);
                const aRestrictedProperties = oEntitySetConverterContext === null || oEntitySetConverterContext === void 0 ? void 0 : (_oEntitySetConverterC = oEntitySetConverterContext.getDataModelObjectPath().startingEntitySet) === null || _oEntitySetConverterC === void 0 ? void 0 : (_oEntitySetConverterC2 = _oEntitySetConverterC.annotations) === null || _oEntitySetConverterC2 === void 0 ? void 0 : (_oEntitySetConverterC3 = _oEntitySetConverterC2.Capabilities) === null || _oEntitySetConverterC3 === void 0 ? void 0 : (_oEntitySetConverterC4 = _oEntitySetConverterC3.NavigationRestrictions) === null || _oEntitySetConverterC4 === void 0 ? void 0 : _oEntitySetConverterC4.RestrictedProperties;
                const oRestrictedProperty = aRestrictedProperties === null || aRestrictedProperties === void 0 ? void 0 : aRestrictedProperties.find(restrictedNavProp => {
                  var _restrictedNavProp$Na;
                  if (((_restrictedNavProp$Na = restrictedNavProp.NavigationProperty) === null || _restrictedNavProp$Na === void 0 ? void 0 : _restrictedNavProp$Na.type) === "NavigationPropertyPath") {
                    return restrictedNavProp.NavigationProperty.value === sNavigationProperty;
                  }
                });
                requiredProperties = (oRestrictedProperty === null || oRestrictedProperty === void 0 ? void 0 : (_oRestrictedProperty$ = oRestrictedProperty.FilterRestrictions) === null || _oRestrictedProperty$ === void 0 ? void 0 : _oRestrictedProperty$.RequiredProperties) ?? [];
              } else {
                const entitySetOrSingleton = collectionPathConverterContext === null || collectionPathConverterContext === void 0 ? void 0 : collectionPathConverterContext.getEntitySet();
                if (isEntitySet(entitySetOrSingleton)) {
                  var _entitySetOrSingleton, _entitySetOrSingleton2;
                  requiredProperties = ((_entitySetOrSingleton = entitySetOrSingleton.annotations.Capabilities) === null || _entitySetOrSingleton === void 0 ? void 0 : (_entitySetOrSingleton2 = _entitySetOrSingleton.FilterRestrictions) === null || _entitySetOrSingleton2 === void 0 ? void 0 : _entitySetOrSingleton2.RequiredProperties) ?? [];
                }
              }
              let requiredPropertyPaths = [];
              if ((_requiredProperties = requiredProperties) !== null && _requiredProperties !== void 0 && _requiredProperties.length) {
                requiredProperties.forEach(function (oRequireProperty) {
                  requiredPropertyPaths.push(oRequireProperty.value);
                });
              }
              requiredPropertyPaths = requiredPropertyPaths.concat(aParameters);
              visualFilter.requiredProperties = requiredPropertyPaths;
              if (converterContext.getContextPath() === collectionPathConverterContext.getContextPath()) {
                // if context Path for both visual filter and filter bar are same, consider required Properties as well along with in Parameters
                _addInParameters(inParameters, requiredProperties, false);
              }
              if ((_visualFilter$require = visualFilter.requiredProperties) !== null && _visualFilter$require !== void 0 && _visualFilter$require.length) {
                if (!visualFilter.inParameters || !visualFilter.inParameters.length) {
                  if (!visualFilter.selectionVariantAnnotation) {
                    visualFilter.showOverlayInitially = true;
                  } else {
                    var _svAnnotation2, _svAnnotation2$Select, _svAnnotation3, _svAnnotation3$Parame;
                    let selectOptions = ((_svAnnotation2 = svAnnotation) === null || _svAnnotation2 === void 0 ? void 0 : (_svAnnotation2$Select = _svAnnotation2.SelectOptions) === null || _svAnnotation2$Select === void 0 ? void 0 : _svAnnotation2$Select.map(oSelectOption => {
                      var _oSelectOption$Proper;
                      return (_oSelectOption$Proper = oSelectOption.PropertyName) === null || _oSelectOption$Proper === void 0 ? void 0 : _oSelectOption$Proper.value;
                    })) || [];
                    const parameterOptions = ((_svAnnotation3 = svAnnotation) === null || _svAnnotation3 === void 0 ? void 0 : (_svAnnotation3$Parame = _svAnnotation3.Parameters) === null || _svAnnotation3$Parame === void 0 ? void 0 : _svAnnotation3$Parame.map(oParameterOption => {
                      var _PropertyName;
                      return (_PropertyName = oParameterOption.PropertyName) === null || _PropertyName === void 0 ? void 0 : _PropertyName.value;
                    })) || [];
                    selectOptions = selectOptions.concat(parameterOptions);
                    requiredPropertyPaths = requiredPropertyPaths.sort();
                    selectOptions = selectOptions.sort();
                    visualFilter.showOverlayInitially = requiredPropertyPaths.some(function (sPath) {
                      return !selectOptions.includes(sPath);
                    });
                  }
                } else {
                  visualFilter.showOverlayInitially = false;
                }
              } else {
                visualFilter.showOverlayInitially = false;
              }
              const sDimensionType = (_chartAnnotation3 = chartAnnotation) === null || _chartAnnotation3 === void 0 ? void 0 : (_chartAnnotation3$$ta = _chartAnnotation3.$target) === null || _chartAnnotation3$$ta === void 0 ? void 0 : (_chartAnnotation3$$ta2 = _chartAnnotation3$$ta.Dimensions[0]) === null || _chartAnnotation3$$ta2 === void 0 ? void 0 : (_chartAnnotation3$$ta3 = _chartAnnotation3$$ta2.$target) === null || _chartAnnotation3$$ta3 === void 0 ? void 0 : _chartAnnotation3$$ta3.type;
              visualFilter.renderLineChart = sDimensionType === "Edm.DateTimeOffset" || sDimensionType === "Edm.Date" || sDimensionType === "Edm.TimeOfDay" || ((_chartAnnotation$$tar19 = chartAnnotation.$target) === null || _chartAnnotation$$tar19 === void 0 ? void 0 : _chartAnnotation$$tar19.ChartType) !== "UI.ChartType/Line";
            }
          } else {
            converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.CHART);
            return;
          }
        } else {
          converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.PRESENTATIONVARIANT);
        }
      } else {
        converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
      }
    } else {
      converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
    }
    return visualFilter;
  }

  /**
   * Method to add inparameters from required properties and parameters.
   *
   * @param inParams An array containing existing inparams
   * @param properties An array containing either requiredproperties or parameters
   * @param isParam A boolean flag indicating whether passed properties are parameters
   */
  _exports.getVisualFilters = getVisualFilters;
  function _addInParameters(inParams, properties, isParam) {
    properties.forEach(function (element) {
      const property = isParam ? element : element.value;
      inParams.push({
        localDataProperty: property,
        valueListProperty: property
      });
    });
  }
  _exports._addInParameters = _addInParameters;
  return _exports;
}, false);
