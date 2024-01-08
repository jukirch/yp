/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntityType = TypeGuards.isEntityType;
  var isEntitySet = TypeGuards.isEntitySet;
  /**
   * helper class for Aggregation annotations.
   */
  let AggregationHelper = /*#__PURE__*/function () {
    /**
     * Creates a helper for a specific entity type and a converter context.
     *
     * @param entityType The EntityType
     * @param converterContext The ConverterContext
     * @param [considerOldAnnotations] The flag to indicate whether or not to consider old annotations
     */
    function AggregationHelper(entityType, converterContext) {
      var _this$oTargetAggregat;
      let considerOldAnnotations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      //considerOldAnnotations will be true and sent only for chart
      this._entityType = entityType;
      this._converterContext = converterContext;
      this._oAggregationAnnotationTarget = this._determineAggregationAnnotationTarget();
      if (isNavigationProperty(this._oAggregationAnnotationTarget) || isEntityType(this._oAggregationAnnotationTarget) || isEntitySet(this._oAggregationAnnotationTarget)) {
        this.oTargetAggregationAnnotations = this._oAggregationAnnotationTarget.annotations.Aggregation;
      }
      this._bApplySupported = (_this$oTargetAggregat = this.oTargetAggregationAnnotations) !== null && _this$oTargetAggregat !== void 0 && _this$oTargetAggregat.ApplySupported ? true : false;
      if (this._bApplySupported) {
        var _this$oTargetAggregat2, _this$oTargetAggregat3, _this$oTargetAggregat4, _this$oTargetAggregat5;
        this._aGroupableProperties = (_this$oTargetAggregat2 = this.oTargetAggregationAnnotations) === null || _this$oTargetAggregat2 === void 0 ? void 0 : (_this$oTargetAggregat3 = _this$oTargetAggregat2.ApplySupported) === null || _this$oTargetAggregat3 === void 0 ? void 0 : _this$oTargetAggregat3.GroupableProperties;
        this._aAggregatableProperties = (_this$oTargetAggregat4 = this.oTargetAggregationAnnotations) === null || _this$oTargetAggregat4 === void 0 ? void 0 : (_this$oTargetAggregat5 = _this$oTargetAggregat4.ApplySupported) === null || _this$oTargetAggregat5 === void 0 ? void 0 : _this$oTargetAggregat5.AggregatableProperties;
        this.oContainerAggregationAnnotation = converterContext.getEntityContainer().annotations.Aggregation;
      }
      if (!this._aAggregatableProperties && considerOldAnnotations) {
        const entityProperties = this._getEntityProperties();
        this._aAggregatableProperties = entityProperties === null || entityProperties === void 0 ? void 0 : entityProperties.filter(property => {
          var _property$annotations, _property$annotations2;
          return (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.Aggregation) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.Aggregatable;
        });
      }
    }

    /**
     * Determines the most appropriate target for the aggregation annotations.
     *
     * @returns  EntityType, EntitySet or NavigationProperty where aggregation annotations should be read from.
     */
    _exports.AggregationHelper = AggregationHelper;
    var _proto = AggregationHelper.prototype;
    _proto._determineAggregationAnnotationTarget = function _determineAggregationAnnotationTarget() {
      var _this$_converterConte, _this$_converterConte2, _this$_converterConte3, _this$_converterConte4, _this$_converterConte5;
      const bIsParameterized = (_this$_converterConte = this._converterContext.getDataModelObjectPath()) !== null && _this$_converterConte !== void 0 && (_this$_converterConte2 = _this$_converterConte.targetEntitySet) !== null && _this$_converterConte2 !== void 0 && (_this$_converterConte3 = _this$_converterConte2.entityType) !== null && _this$_converterConte3 !== void 0 && (_this$_converterConte4 = _this$_converterConte3.annotations) !== null && _this$_converterConte4 !== void 0 && (_this$_converterConte5 = _this$_converterConte4.Common) !== null && _this$_converterConte5 !== void 0 && _this$_converterConte5.ResultContext ? true : false;
      let oAggregationAnnotationSource;

      // find ApplySupported
      if (bIsParameterized) {
        var _oNavigationPropertyO, _oNavigationPropertyO2, _oEntityTypeObject$an, _oEntityTypeObject$an2;
        // if this is a parameterized view then applysupported can be found at either the navProp pointing to the result set or entityType.
        // If applySupported is present at both the navProp and the entityType then navProp is more specific so take annotations from there
        // targetObject in the converter context for a parameterized view is the navigation property pointing to th result set
        const oDataModelObjectPath = this._converterContext.getDataModelObjectPath();
        const oNavigationPropertyObject = oDataModelObjectPath === null || oDataModelObjectPath === void 0 ? void 0 : oDataModelObjectPath.targetObject;
        const oEntityTypeObject = oDataModelObjectPath === null || oDataModelObjectPath === void 0 ? void 0 : oDataModelObjectPath.targetEntityType;
        if (oNavigationPropertyObject !== null && oNavigationPropertyObject !== void 0 && (_oNavigationPropertyO = oNavigationPropertyObject.annotations) !== null && _oNavigationPropertyO !== void 0 && (_oNavigationPropertyO2 = _oNavigationPropertyO.Aggregation) !== null && _oNavigationPropertyO2 !== void 0 && _oNavigationPropertyO2.ApplySupported) {
          oAggregationAnnotationSource = oNavigationPropertyObject;
        } else if (oEntityTypeObject !== null && oEntityTypeObject !== void 0 && (_oEntityTypeObject$an = oEntityTypeObject.annotations) !== null && _oEntityTypeObject$an !== void 0 && (_oEntityTypeObject$an2 = _oEntityTypeObject$an.Aggregation) !== null && _oEntityTypeObject$an2 !== void 0 && _oEntityTypeObject$an2.ApplySupported) {
          oAggregationAnnotationSource = oEntityTypeObject;
        }
      } else {
        var _oEntitySetObject$ann;
        // For the time being, we ignore annotations at the container level, until the vocabulary is stabilized
        const oEntitySetObject = this._converterContext.getEntitySet();
        if (isEntitySet(oEntitySetObject) && (_oEntitySetObject$ann = oEntitySetObject.annotations.Aggregation) !== null && _oEntitySetObject$ann !== void 0 && _oEntitySetObject$ann.ApplySupported) {
          oAggregationAnnotationSource = oEntitySetObject;
        } else {
          oAggregationAnnotationSource = this._converterContext.getEntityType();
        }
      }
      return oAggregationAnnotationSource;
    }

    /**
     * Checks if the entity supports analytical queries.
     *
     * @returns `true` if analytical queries are supported, false otherwise.
     */;
    _proto.isAnalyticsSupported = function isAnalyticsSupported() {
      return this._bApplySupported;
    }

    /**
     * Checks if a property is groupable.
     *
     * @param property The property to check
     * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
     */;
    _proto.isPropertyGroupable = function isPropertyGroupable(property) {
      if (!this._bApplySupported) {
        return undefined;
      } else if (!this._aGroupableProperties || this._aGroupableProperties.length === 0) {
        // No groupableProperties --> all properties are groupable
        return true;
      } else {
        return this._aGroupableProperties.some(path => path.$target === property);
      }
    }

    /**
     * Checks if a property is aggregatable.
     *
     * @param property The property to check
     * @returns `undefined` if the entity doesn't support analytical queries, true or false otherwise
     */;
    _proto.isPropertyAggregatable = function isPropertyAggregatable(property) {
      if (!this._bApplySupported) {
        return undefined;
      } else {
        // Get the custom aggregates
        const aCustomAggregateAnnotations = this._converterContext.getAnnotationsByTerm("Aggregation", "Org.OData.Aggregation.V1.CustomAggregate", [this._oAggregationAnnotationTarget]);

        // Check if a custom aggregate has a qualifier that corresponds to the property name
        return aCustomAggregateAnnotations.some(annotation => {
          return property.name === annotation.qualifier;
        });
      }
    };
    _proto.getGroupableProperties = function getGroupableProperties() {
      return this._aGroupableProperties;
    };
    _proto.getAggregatableProperties = function getAggregatableProperties() {
      return this._aAggregatableProperties;
    };
    _proto.getEntityType = function getEntityType() {
      return this._entityType;
    }

    /**
     * Returns AggregatedProperties or AggregatedProperty based on param Term.
     * The Term here indicates if the AggregatedProperty should be retrieved or the deprecated AggregatedProperties.
     *
     * @param Term The Annotation Term
     * @returns Annotations The appropriate annotations based on the given Term.
     */;
    _proto.getAggregatedProperties = function getAggregatedProperties(Term) {
      if (Term === "AggregatedProperties") {
        return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperties", [this._converterContext.getEntityContainer(), this._converterContext.getEntityType()]);
      }
      return this._converterContext.getAnnotationsByTerm("Analytics", "com.sap.vocabularies.Analytics.v1.AggregatedProperty", [this._converterContext.getEntityContainer(), this._converterContext.getEntityType()]);
    }

    // retirve all transformation aggregates by prioritizing AggregatedProperty over AggregatedProperties objects
    ;
    _proto.getTransAggregations = function getTransAggregations() {
      var _aAggregatedPropertyO;
      let aAggregatedPropertyObjects = this.getAggregatedProperties("AggregatedProperty");
      if (!aAggregatedPropertyObjects || aAggregatedPropertyObjects.length === 0) {
        aAggregatedPropertyObjects = this.getAggregatedProperties("AggregatedProperties")[0];
      }
      return (_aAggregatedPropertyO = aAggregatedPropertyObjects) === null || _aAggregatedPropertyO === void 0 ? void 0 : _aAggregatedPropertyO.filter(aggregatedProperty => {
        if (this._getAggregatableAggregates(aggregatedProperty.AggregatableProperty)) {
          return aggregatedProperty;
        }
      });
    }

    /**
     * Check if each transformation is aggregatable.
     *
     * @param property The property to check
     * @returns 'aggregatedProperty'
     */;
    _proto._getAggregatableAggregates = function _getAggregatableAggregates(property) {
      const aAggregatableProperties = this.getAggregatableProperties() || [];
      return aAggregatableProperties.find(function (obj) {
        var _$target, _obj$Property;
        const prop = property.qualifier ? property.qualifier : (_$target = property.$target) === null || _$target === void 0 ? void 0 : _$target.name;
        if (obj !== null && obj !== void 0 && (_obj$Property = obj.Property) !== null && _obj$Property !== void 0 && _obj$Property.value) {
          return obj.Property.value === prop;
        }
        return (obj === null || obj === void 0 ? void 0 : obj.name) === prop;
      });
    };
    _proto._getEntityProperties = function _getEntityProperties() {
      let entityProperties;
      if (isEntitySet(this._oAggregationAnnotationTarget)) {
        var _this$_oAggregationAn, _this$_oAggregationAn2;
        entityProperties = (_this$_oAggregationAn = this._oAggregationAnnotationTarget) === null || _this$_oAggregationAn === void 0 ? void 0 : (_this$_oAggregationAn2 = _this$_oAggregationAn.entityType) === null || _this$_oAggregationAn2 === void 0 ? void 0 : _this$_oAggregationAn2.entityProperties;
      } else if (isEntityType(this._oAggregationAnnotationTarget)) {
        var _this$_oAggregationAn3;
        entityProperties = (_this$_oAggregationAn3 = this._oAggregationAnnotationTarget) === null || _this$_oAggregationAn3 === void 0 ? void 0 : _this$_oAggregationAn3.entityProperties;
      }
      return entityProperties;
    }

    /**
     * Returns the list of custom aggregate definitions for the entity type.
     *
     * @returns A map (propertyName --> array of context-defining property names) for each custom aggregate corresponding to a property. The array of
     * context-defining property names is empty if the custom aggregate doesn't have any context-defining property.
     */;
    _proto.getCustomAggregateDefinitions = function getCustomAggregateDefinitions() {
      // Get the custom aggregates
      const aCustomAggregateAnnotations = this._converterContext.getAnnotationsByTerm("Aggregation", "Org.OData.Aggregation.V1.CustomAggregate", [this._oAggregationAnnotationTarget]);
      return aCustomAggregateAnnotations;
    }

    /**
     * Returns the list of allowed transformations in the $apply.
     * First look at the current EntitySet, then look at the default values provided at the container level.
     *
     * @returns The list of transformations, or undefined if no list is found
     */;
    _proto.getAllowedTransformations = function getAllowedTransformations() {
      var _this$oTargetAggregat6, _this$oTargetAggregat7, _this$oContainerAggre, _this$oContainerAggre2;
      return ((_this$oTargetAggregat6 = this.oTargetAggregationAnnotations) === null || _this$oTargetAggregat6 === void 0 ? void 0 : (_this$oTargetAggregat7 = _this$oTargetAggregat6.ApplySupported) === null || _this$oTargetAggregat7 === void 0 ? void 0 : _this$oTargetAggregat7.Transformations) || ((_this$oContainerAggre = this.oContainerAggregationAnnotation) === null || _this$oContainerAggre === void 0 ? void 0 : (_this$oContainerAggre2 = _this$oContainerAggre.ApplySupportedDefaults) === null || _this$oContainerAggre2 === void 0 ? void 0 : _this$oContainerAggre2.Transformations);
    };
    return AggregationHelper;
  }();
  _exports.AggregationHelper = AggregationHelper;
  return _exports;
}, false);
