/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/PropertyHelper", "../helpers/DataFieldHelper"], function (TypeGuards, DisplayModeFormatter, PropertyHelper, DataFieldHelper) {
  "use strict";

  var _exports = {};
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTimezoneProperty = PropertyHelper.getAssociatedTimezoneProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionAbstract".
   * DataFieldForActionAbstract has an inline action defined.
   *
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForActionAbstractType
   */
  function isDataFieldForActionAbstract(dataField) {
    return dataField.hasOwnProperty("Action");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "isDataFieldForAnnotation".
   * isDataFieldForAnnotation has an inline $Type property that can be used.
   *
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForAnnotation
   */
  _exports.isDataFieldForActionAbstract = isDataFieldForActionAbstract;
  function isDataFieldForAnnotation(dataField) {
    return (dataField === null || dataField === void 0 ? void 0 : dataField.$Type) === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation";
  }
  _exports.isDataFieldForAnnotation = isDataFieldForAnnotation;
  function isDataFieldForAction(dataField) {
    return (dataField === null || dataField === void 0 ? void 0 : dataField.$Type) === "com.sap.vocabularies.UI.v1.DataFieldForAction";
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForIntentBasedNavigation".
   * DataFieldForIntentBasedNavigation has an inline $Type property that can be used.
   *
   * @param dataField DataField to be evaluated
   * @returns Validates that dataField is a DataFieldForIntentBasedNavigation
   */
  _exports.isDataFieldForAction = isDataFieldForAction;
  function isDataFieldForIntentBasedNavigation(dataField) {
    return dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
   * DataField has a value defined.
   *
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataFieldTypes
   */
  _exports.isDataFieldForIntentBasedNavigation = isDataFieldForIntentBasedNavigation;
  function isDataFieldTypes(dataField) {
    return dataField.hasOwnProperty("Value");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataField".
   * DataField has a value defined.
   *
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataField
   */
  _exports.isDataFieldTypes = isDataFieldTypes;
  function isDataField(dataField) {
    return dataField.hasOwnProperty("Value");
  }

  /**
   * Determines if the dataFieldForAnnotation is a field group.
   *
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if the dataFieldForAnnotation is a field group.
   */
  _exports.isDataField = isDataField;
  function hasFieldGroupTarget(dataFieldForAnnotation) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    return isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.FieldGroupType");
  }

  /**
   * Determines if the dataFieldForAnnotation is a data point.
   *
   * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
   * @returns True if the dataFieldForAnnotation is a data point.
   */
  _exports.hasFieldGroupTarget = hasFieldGroupTarget;
  function hasDataPointTarget(dataFieldForAnnotation) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    return isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.DataPointType");
  }

  /**
   * Determine if the data model object path targeting a dataField for action opens up a dialog.
   *
   * @param dataModelObjectPath DataModelObjectPath
   * @returns `Dialog` | `None` if a dialog is needed
   */
  _exports.hasDataPointTarget = hasDataPointTarget;
  function isDataModelObjectPathForActionWithDialog(dataModelObjectPath) {
    const target = dataModelObjectPath.targetObject;
    return isActionWithDialog(isDataFieldForAction(target) ? target : undefined);
  }

  /**
   * Determine if the dataField for action opens up a dialog.
   *
   * @param dataField DataField for action
   * @returns `Dialog` | `None` if a dialog is needed
   */
  _exports.isDataModelObjectPathForActionWithDialog = isDataModelObjectPathForActionWithDialog;
  function isActionWithDialog(dataField) {
    const action = dataField === null || dataField === void 0 ? void 0 : dataField.ActionTarget;
    if (action) {
      var _action$annotations, _action$annotations$C;
      const bCritical = (_action$annotations = action.annotations) === null || _action$annotations === void 0 ? void 0 : (_action$annotations$C = _action$annotations.Common) === null || _action$annotations$C === void 0 ? void 0 : _action$annotations$C.IsActionCritical;
      if (action.parameters.length > 1 || bCritical) {
        return "Dialog";
      } else {
        return "None";
      }
    } else {
      return "None";
    }
  }

  /**
   * Retrieves the TargetValue from a DataPoint.
   *
   * @param source The target property or DataPoint
   * @returns The TargetValue as a decimal or a property path
   */
  _exports.isActionWithDialog = isActionWithDialog;
  function getTargetValueOnDataPoint(source) {
    let targetValue;
    if (isProperty(source)) {
      var _source$annotations, _source$annotations$U, _source$annotations$U2, _source$annotations$U3, _source$annotations$U4, _source$annotations2, _source$annotations2$, _source$annotations2$2, _source$annotations2$3, _source$annotations2$4;
      targetValue = ((_source$annotations = source.annotations) === null || _source$annotations === void 0 ? void 0 : (_source$annotations$U = _source$annotations.UI) === null || _source$annotations$U === void 0 ? void 0 : (_source$annotations$U2 = _source$annotations$U.DataFieldDefault) === null || _source$annotations$U2 === void 0 ? void 0 : (_source$annotations$U3 = _source$annotations$U2.Target) === null || _source$annotations$U3 === void 0 ? void 0 : (_source$annotations$U4 = _source$annotations$U3.$target) === null || _source$annotations$U4 === void 0 ? void 0 : _source$annotations$U4.TargetValue) ?? ((_source$annotations2 = source.annotations) === null || _source$annotations2 === void 0 ? void 0 : (_source$annotations2$ = _source$annotations2.UI) === null || _source$annotations2$ === void 0 ? void 0 : (_source$annotations2$2 = _source$annotations2$.DataFieldDefault) === null || _source$annotations2$2 === void 0 ? void 0 : (_source$annotations2$3 = _source$annotations2$2.Target) === null || _source$annotations2$3 === void 0 ? void 0 : (_source$annotations2$4 = _source$annotations2$3.$target) === null || _source$annotations2$4 === void 0 ? void 0 : _source$annotations2$4.MaximumValue);
    } else {
      targetValue = source.TargetValue ?? source.MaximumValue;
    }
    if (typeof targetValue === "number") {
      return targetValue.toString();
    }
    return isPathAnnotationExpression(targetValue) ? targetValue : "100";
  }

  /**
   * Check if a property uses a DataPoint within a DataFieldDefault.
   *
   * @param property The property to be checked
   * @returns `true` if the referenced property has a DataPoint within the DataFieldDefault, false else
   */
  _exports.getTargetValueOnDataPoint = getTargetValueOnDataPoint;
  const isDataPointFromDataFieldDefault = function (property) {
    var _property$annotations, _property$annotations2, _property$annotations3, _property$annotations4, _property$annotations5;
    return ((_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.UI) === null || _property$annotations2 === void 0 ? void 0 : (_property$annotations3 = _property$annotations2.DataFieldDefault) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3.Target) === null || _property$annotations4 === void 0 ? void 0 : (_property$annotations5 = _property$annotations4.$target) === null || _property$annotations5 === void 0 ? void 0 : _property$annotations5.$Type) === "com.sap.vocabularies.UI.v1.DataPointType";
  };

  /**
   * Check if a property uses a default visualization Rating through a DataFieldDefault.
   *
   * @param property The property to be checked
   * @returns `true` if the visualization through a DataFieldDefault is a Rating
   */
  _exports.isDataPointFromDataFieldDefault = isDataPointFromDataFieldDefault;
  const isRatingVisualizationFromDataFieldDefault = function (property) {
    var _property$annotations6, _property$annotations7, _property$annotations8, _property$annotations9, _property$annotations10;
    return isDataPointFromDataFieldDefault(property) && ((_property$annotations6 = property.annotations) === null || _property$annotations6 === void 0 ? void 0 : (_property$annotations7 = _property$annotations6.UI) === null || _property$annotations7 === void 0 ? void 0 : (_property$annotations8 = _property$annotations7.DataFieldDefault) === null || _property$annotations8 === void 0 ? void 0 : (_property$annotations9 = _property$annotations8.Target) === null || _property$annotations9 === void 0 ? void 0 : (_property$annotations10 = _property$annotations9.$target) === null || _property$annotations10 === void 0 ? void 0 : _property$annotations10.Visualization) === "UI.VisualizationType/Rating";
  };
  _exports.isRatingVisualizationFromDataFieldDefault = isRatingVisualizationFromDataFieldDefault;
  function getSemanticObjectPath(converterContext, object) {
    if (typeof object === "object") {
      var _object$Value;
      if (isDataFieldTypes(object) && (_object$Value = object.Value) !== null && _object$Value !== void 0 && _object$Value.$target) {
        var _object$Value2, _property$annotations11, _property$annotations12;
        const property = (_object$Value2 = object.Value) === null || _object$Value2 === void 0 ? void 0 : _object$Value2.$target;
        if ((property === null || property === void 0 ? void 0 : (_property$annotations11 = property.annotations) === null || _property$annotations11 === void 0 ? void 0 : (_property$annotations12 = _property$annotations11.Common) === null || _property$annotations12 === void 0 ? void 0 : _property$annotations12.SemanticObject) !== undefined) {
          return converterContext.getEntitySetBasedAnnotationPath(property === null || property === void 0 ? void 0 : property.fullyQualifiedName);
        }
      } else if (isProperty(object)) {
        var _object$annotations, _object$annotations$C;
        if ((object === null || object === void 0 ? void 0 : (_object$annotations = object.annotations) === null || _object$annotations === void 0 ? void 0 : (_object$annotations$C = _object$annotations.Common) === null || _object$annotations$C === void 0 ? void 0 : _object$annotations$C.SemanticObject) !== undefined) {
          return converterContext.getEntitySetBasedAnnotationPath(object === null || object === void 0 ? void 0 : object.fullyQualifiedName);
        }
      }
    }
    return undefined;
  }

  /**
   * Returns the navigation path prefix for a property path.
   *
   * @param path The property path For e.g. /EntityType/Navigation/Property
   * @returns The navigation path prefix For e.g. /EntityType/Navigation/
   */
  _exports.getSemanticObjectPath = getSemanticObjectPath;
  function _getNavigationPathPrefix(path) {
    if (path) {
      return path.includes("/") ? path.substring(0, path.lastIndexOf("/") + 1) : "";
    }
    return "";
  }

  /**
   * Collect additional properties for the ALP table use-case.
   *
   * For e.g. If UI.Hidden points to a property, include this property in the additionalProperties of ComplexPropertyInfo object.
   *
   * @param target Property or DataField being processed
   * @param navigationPathPrefix Navigation path prefix, applicable in case of navigation properties.
   * @param tableType Table type.
   * @param relatedProperties The related properties identified so far.
   * @returns The related properties identified.
   */
  function _collectAdditionalPropertiesForAnalyticalTable(target, navigationPathPrefix, tableType, relatedProperties) {
    if (tableType === "AnalyticalTable") {
      var _target$annotations, _target$annotations$U;
      const hiddenAnnotation = (_target$annotations = target.annotations) === null || _target$annotations === void 0 ? void 0 : (_target$annotations$U = _target$annotations.UI) === null || _target$annotations$U === void 0 ? void 0 : _target$annotations$U.Hidden;
      if (hiddenAnnotation !== null && hiddenAnnotation !== void 0 && hiddenAnnotation.path && isProperty(hiddenAnnotation.$target)) {
        const hiddenAnnotationPropertyPath = navigationPathPrefix + hiddenAnnotation.path;
        // This property should be added to additionalProperties map for the ALP table use-case.
        relatedProperties.additionalProperties[hiddenAnnotationPropertyPath] = hiddenAnnotation.$target;
      }
      const criticality = target.Criticality;
      if (criticality !== null && criticality !== void 0 && criticality.path && isProperty(criticality === null || criticality === void 0 ? void 0 : criticality.$target)) {
        const criticalityPropertyPath = navigationPathPrefix + criticality.path;
        relatedProperties.additionalProperties[criticalityPropertyPath] = criticality === null || criticality === void 0 ? void 0 : criticality.$target;
      }
    }
    return relatedProperties;
  }

  /**
   * Collect related properties from a property's annotations.
   *
   * @param path The property path
   * @param property The property to be considered
   * @param converterContext The converter context
   * @param ignoreSelf Whether to exclude the same property from the related properties.
   * @param tableType The table type.
   * @param relatedProperties The related properties identified so far.
   * @param addUnitInTemplate True if the unit/currency property needs to be added in the export template
   * @param isAnnotatedAsHidden True if the DataField or the property are statically hidden
   * @returns The related properties identified.
   */
  function collectRelatedProperties(path, property, converterContext, ignoreSelf, tableType) {
    let relatedProperties = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
      properties: {},
      additionalProperties: {},
      exportSettings: {},
      textOnlyPropertiesFromTextAnnotation: []
    };
    let addUnitInTemplate = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    let isAnnotatedAsHidden = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
    /**
     * Helper to push unique related properties.
     *
     * @param key The property path
     * @param value The properties object containing value property, description property...
     * @returns Index at which the property is available
     */
    function _pushUnique(key, value) {
      if (!relatedProperties.properties.hasOwnProperty(key)) {
        relatedProperties.properties[key] = value;
      }
      return Object.keys(relatedProperties.properties).indexOf(key);
    }

    /**
     * Helper to append the export settings template with a formatted text.
     *
     * @param value Formatted text
     */
    function _appendTemplate(value) {
      var _relatedProperties$ex, _relatedProperties$ex2;
      relatedProperties.exportSettings.template = (_relatedProperties$ex = relatedProperties.exportSettings) !== null && _relatedProperties$ex !== void 0 && _relatedProperties$ex.template ? `${(_relatedProperties$ex2 = relatedProperties.exportSettings) === null || _relatedProperties$ex2 === void 0 ? void 0 : _relatedProperties$ex2.template}${value}` : `${value}`;
    }
    if (path && property) {
      var _property$annotations13, _property$annotations14, _relatedProperties$ex3;
      let valueIndex;
      let targetValue;
      let currencyOrUoMIndex;
      let timezoneOrUoMIndex;
      let dataPointIndex;
      if (isAnnotatedAsHidden) {
        // Collect underlying property
        valueIndex = _pushUnique(path, property);
        _appendTemplate(`{${valueIndex}}`);
        return relatedProperties;
      }
      const navigationPathPrefix = _getNavigationPathPrefix(path);

      // Check for Text annotation.
      const textAnnotation = (_property$annotations13 = property.annotations) === null || _property$annotations13 === void 0 ? void 0 : (_property$annotations14 = _property$annotations13.Common) === null || _property$annotations14 === void 0 ? void 0 : _property$annotations14.Text;
      if ((_relatedProperties$ex3 = relatedProperties.exportSettings) !== null && _relatedProperties$ex3 !== void 0 && _relatedProperties$ex3.template) {
        // FieldGroup use-case. Need to add each Field in new line.
        _appendTemplate("\n");
        relatedProperties.exportSettings.wrap = true;
      }
      if (textAnnotation !== null && textAnnotation !== void 0 && textAnnotation.path && textAnnotation !== null && textAnnotation !== void 0 && textAnnotation.$target) {
        // Check for Text Arrangement.
        const dataModelObjectPath = converterContext.getDataModelObjectPath();
        const textAnnotationPropertyPath = navigationPathPrefix + textAnnotation.path;
        const displayMode = getDisplayMode(property, dataModelObjectPath);
        let descriptionIndex;
        switch (displayMode) {
          case "Value":
            valueIndex = _pushUnique(path, property);
            _appendTemplate(`{${valueIndex}}`);
            break;
          case "Description":
            descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
            _appendTemplate(`{${descriptionIndex}}`);
            relatedProperties.textOnlyPropertiesFromTextAnnotation.push(textAnnotationPropertyPath);
            break;
          case "ValueDescription":
            valueIndex = _pushUnique(path, property);
            descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
            _appendTemplate(`{${valueIndex}} ({${descriptionIndex}})`);
            break;
          case "DescriptionValue":
            valueIndex = _pushUnique(path, property);
            descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
            _appendTemplate(`{${descriptionIndex}} ({${valueIndex}})`);
            break;
          // no default
        }
      } else {
        var _property$annotations15, _property$annotations16, _property$annotations17, _property$annotations18, _property$annotations19, _property$annotations20, _property$Target, _property$Target$$tar, _property$Target2, _property$Target2$$ta, _property$annotations21, _property$annotations22, _property$annotations23, _property$annotations24, _property$annotations25;
        // Check for field containing Currency Or Unit Properties or Timezone
        const currencyProperty = getAssociatedCurrencyProperty(property);
        const unitProperty = getAssociatedUnitProperty(property);
        const currencyOrUoMProperty = currencyProperty || unitProperty;
        const currencyOrUnitAnnotation = (property === null || property === void 0 ? void 0 : (_property$annotations15 = property.annotations) === null || _property$annotations15 === void 0 ? void 0 : (_property$annotations16 = _property$annotations15.Measures) === null || _property$annotations16 === void 0 ? void 0 : _property$annotations16.ISOCurrency) || (property === null || property === void 0 ? void 0 : (_property$annotations17 = property.annotations) === null || _property$annotations17 === void 0 ? void 0 : (_property$annotations18 = _property$annotations17.Measures) === null || _property$annotations18 === void 0 ? void 0 : _property$annotations18.Unit);
        const timezoneProperty = getAssociatedTimezoneProperty(property);
        const timezoneAnnotation = property === null || property === void 0 ? void 0 : (_property$annotations19 = property.annotations) === null || _property$annotations19 === void 0 ? void 0 : (_property$annotations20 = _property$annotations19.Common) === null || _property$annotations20 === void 0 ? void 0 : _property$annotations20.Timezone;
        if (currencyOrUoMProperty) {
          valueIndex = _pushUnique(path, property);
          currencyOrUoMIndex = _pushUnique(navigationPathPrefix + currencyOrUnitAnnotation.path, currencyOrUnitAnnotation.$target);
          if (addUnitInTemplate) {
            _appendTemplate(`{${valueIndex}}  {${currencyOrUoMIndex}}`);
          } else {
            relatedProperties.exportSettings.unitProperty = navigationPathPrefix + currencyOrUnitAnnotation.path;
          }
          if (currencyProperty) {
            relatedProperties.exportSettings.isCurrency = true;
          }
        } else if (timezoneProperty && timezoneAnnotation !== null && timezoneAnnotation !== void 0 && timezoneAnnotation.$target) {
          valueIndex = _pushUnique(path, property);
          timezoneOrUoMIndex = _pushUnique(navigationPathPrefix + timezoneAnnotation.path, timezoneAnnotation.$target);
          if (addUnitInTemplate) {
            _appendTemplate(`{${valueIndex}}  {${timezoneOrUoMIndex}}`);
          } else {
            relatedProperties.exportSettings.timezoneProperty = navigationPathPrefix + timezoneAnnotation.path;
          }
        } else if (((_property$Target = property.Target) === null || _property$Target === void 0 ? void 0 : (_property$Target$$tar = _property$Target.$target) === null || _property$Target$$tar === void 0 ? void 0 : _property$Target$$tar.$Type) === "com.sap.vocabularies.UI.v1.DataPointType" && !((_property$Target2 = property.Target) !== null && _property$Target2 !== void 0 && (_property$Target2$$ta = _property$Target2.$target) !== null && _property$Target2$$ta !== void 0 && _property$Target2$$ta.ValueFormat) || ((_property$annotations21 = property.annotations) === null || _property$annotations21 === void 0 ? void 0 : (_property$annotations22 = _property$annotations21.UI) === null || _property$annotations22 === void 0 ? void 0 : (_property$annotations23 = _property$annotations22.DataFieldDefault) === null || _property$annotations23 === void 0 ? void 0 : (_property$annotations24 = _property$annotations23.Target) === null || _property$annotations24 === void 0 ? void 0 : (_property$annotations25 = _property$annotations24.$target) === null || _property$annotations25 === void 0 ? void 0 : _property$annotations25.$Type) === "com.sap.vocabularies.UI.v1.DataPointType") {
          var _property$Target3, _property$Target3$$ta, _property$Target4, _property$annotations26, _property$annotations27;
          const dataPointProperty = (_property$Target3 = property.Target) === null || _property$Target3 === void 0 ? void 0 : (_property$Target3$$ta = _property$Target3.$target) === null || _property$Target3$$ta === void 0 ? void 0 : _property$Target3$$ta.Value.$target;
          const datapointTarget = (_property$Target4 = property.Target) === null || _property$Target4 === void 0 ? void 0 : _property$Target4.$target;
          // DataPoint use-case using DataFieldDefault.
          const dataPointDefaultProperty = (_property$annotations26 = property.annotations) === null || _property$annotations26 === void 0 ? void 0 : (_property$annotations27 = _property$annotations26.UI) === null || _property$annotations27 === void 0 ? void 0 : _property$annotations27.DataFieldDefault;
          valueIndex = _pushUnique(navigationPathPrefix ? navigationPathPrefix + path : path, dataPointDefaultProperty ? property : dataPointProperty);
          targetValue = getTargetValueOnDataPoint(dataPointDefaultProperty ? property : datapointTarget);
          if (isPathAnnotationExpression(targetValue)) {
            if (targetValue.$target) {
              //in case it's a dynamic targetValue
              dataPointIndex = _pushUnique(navigationPathPrefix ? navigationPathPrefix + targetValue.$target.name : targetValue.$target.name, targetValue.$target);
              _appendTemplate(`{${valueIndex}}/{${dataPointIndex}}`);
            }
          } else {
            relatedProperties.exportSettings.dataPointTargetValue = targetValue;
            _appendTemplate(`{${valueIndex}}/${targetValue}`);
          }
        } else if (property.$Type === "com.sap.vocabularies.Communication.v1.ContactType") {
          var _property$fn, _property$fn2;
          const contactProperty = (_property$fn = property.fn) === null || _property$fn === void 0 ? void 0 : _property$fn.$target;
          const contactPropertyPath = (_property$fn2 = property.fn) === null || _property$fn2 === void 0 ? void 0 : _property$fn2.path;
          valueIndex = _pushUnique(navigationPathPrefix ? navigationPathPrefix + contactPropertyPath : contactPropertyPath, contactProperty);
          _appendTemplate(`{${valueIndex}}`);
        } else if (!ignoreSelf) {
          // Collect underlying property
          valueIndex = _pushUnique(path, property);
          _appendTemplate(`{${valueIndex}}`);
          if (currencyOrUnitAnnotation) {
            var _property$annotations28, _property$annotations29;
            relatedProperties.exportSettings.unit = `${currencyOrUnitAnnotation}`; // Hard-coded currency/unit
            if (property !== null && property !== void 0 && (_property$annotations28 = property.annotations) !== null && _property$annotations28 !== void 0 && (_property$annotations29 = _property$annotations28.Measures) !== null && _property$annotations29 !== void 0 && _property$annotations29.ISOCurrency) {
              relatedProperties.exportSettings.isCurrency = true;
            }
          } else if (timezoneAnnotation) {
            relatedProperties.exportSettings.timezone = `${timezoneAnnotation}`; // Hard-coded timezone
          }
        }
      }

      relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(property, navigationPathPrefix, tableType, relatedProperties);
      if (Object.keys(relatedProperties.additionalProperties).length > 0 && Object.keys(relatedProperties.properties).length === 0) {
        // Collect underlying property if not collected already.
        // This is to ensure that additionalProperties are made available only to complex property infos.
        valueIndex = _pushUnique(path, property);
        _appendTemplate(`{${valueIndex}}`);
      }
    }
    return relatedProperties;
  }

  /**
   * Collect properties consumed by a DataField.
   * This is for populating the ComplexPropertyInfos of the table delegate.
   *
   * @param dataField The DataField for which the properties need to be identified.
   * @param converterContext The converter context.
   * @param tableType The table type.
   * @param relatedProperties The properties identified so far.
   * @param isEmbedded True if the DataField is embedded in another annotation (e.g. FieldGroup).
   * @returns The properties related to the DataField.
   */
  _exports.collectRelatedProperties = collectRelatedProperties;
  function collectRelatedPropertiesRecursively(dataField, converterContext, tableType) {
    var _dataField$Target, _dataField$Target$$ta, _dataField$Target$$ta2;
    let relatedProperties = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
      properties: {},
      additionalProperties: {},
      textOnlyPropertiesFromTextAnnotation: [],
      exportSettings: {}
    };
    let isEmbedded = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    let isStaticallyHidden = false;
    switch (dataField === null || dataField === void 0 ? void 0 : dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        if (dataField.Value) {
          const property = dataField.Value;
          isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
          relatedProperties = collectRelatedProperties(property.path, property.$target, converterContext, false, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
          const navigationPathPrefix = _getNavigationPathPrefix(property.path);
          relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(dataField, navigationPathPrefix, tableType, relatedProperties);
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        switch ((_dataField$Target = dataField.Target) === null || _dataField$Target === void 0 ? void 0 : (_dataField$Target$$ta = _dataField$Target.$target) === null || _dataField$Target$$ta === void 0 ? void 0 : _dataField$Target$$ta.$Type) {
          case "com.sap.vocabularies.UI.v1.FieldGroupType":
            (_dataField$Target$$ta2 = dataField.Target.$target.Data) === null || _dataField$Target$$ta2 === void 0 ? void 0 : _dataField$Target$$ta2.forEach(innerDataField => {
              relatedProperties = collectRelatedPropertiesRecursively(innerDataField, converterContext, tableType, relatedProperties, true);
            });
            break;
          case "com.sap.vocabularies.UI.v1.DataPointType":
            isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
            relatedProperties = collectRelatedProperties(dataField.Target.$target.Value.path, dataField, converterContext, false, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
            break;
          case "com.sap.vocabularies.Communication.v1.ContactType":
            const dataFieldContact = dataField.Target.$target;
            isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
            relatedProperties = collectRelatedProperties(dataField.Target.value, dataFieldContact, converterContext, isStaticallyHidden, tableType, relatedProperties, isEmbedded, isStaticallyHidden);
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    return relatedProperties;
  }
  _exports.collectRelatedPropertiesRecursively = collectRelatedPropertiesRecursively;
  const getDataFieldDataType = function (oDataField) {
    var _Value, _Value$$target, _oDataField$Target, _oDataField$Target$$t;
    if (isProperty(oDataField)) {
      return oDataField.type;
    }
    let sDataType;
    switch (oDataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        sDataType = undefined;
        break;
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        sDataType = oDataField === null || oDataField === void 0 ? void 0 : (_Value = oDataField.Value) === null || _Value === void 0 ? void 0 : (_Value$$target = _Value.$target) === null || _Value$$target === void 0 ? void 0 : _Value$$target.type;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
      default:
        if ((_oDataField$Target = oDataField.Target) !== null && _oDataField$Target !== void 0 && (_oDataField$Target$$t = _oDataField$Target.$target) !== null && _oDataField$Target$$t !== void 0 && _oDataField$Target$$t.$Type) {
          const dataFieldTarget = oDataField.Target.$target;
          if (dataFieldTarget.$Type === "com.sap.vocabularies.Communication.v1.ContactType" && isPathAnnotationExpression(dataFieldTarget.fn)) {
            var _dataFieldTarget$fn$$;
            sDataType = (_dataFieldTarget$fn$$ = dataFieldTarget.fn.$target) === null || _dataFieldTarget$fn$$ === void 0 ? void 0 : _dataFieldTarget$fn$$.type;
          } else if (dataFieldTarget.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
            var _dataFieldTarget$Valu, _dataFieldTarget$Valu2, _dataFieldTarget$Valu3, _dataFieldTarget$Valu4;
            sDataType = ((_dataFieldTarget$Valu = dataFieldTarget.Value) === null || _dataFieldTarget$Valu === void 0 ? void 0 : (_dataFieldTarget$Valu2 = _dataFieldTarget$Valu.$Path) === null || _dataFieldTarget$Valu2 === void 0 ? void 0 : _dataFieldTarget$Valu2.$Type) || ((_dataFieldTarget$Valu3 = dataFieldTarget.Value) === null || _dataFieldTarget$Valu3 === void 0 ? void 0 : (_dataFieldTarget$Valu4 = _dataFieldTarget$Valu3.$target) === null || _dataFieldTarget$Valu4 === void 0 ? void 0 : _dataFieldTarget$Valu4.type);
          } else {
            // e.g. FieldGroup or Chart
            // FieldGroup Properties have no type, so we define it as a boolean type to prevent exceptions during the calculation of the width
            sDataType = oDataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.ChartDefinitionType" ? undefined : "Edm.Boolean";
          }
        } else {
          sDataType = undefined;
        }
        break;
    }
    return sDataType;
  };
  _exports.getDataFieldDataType = getDataFieldDataType;
  return _exports;
}, false);
