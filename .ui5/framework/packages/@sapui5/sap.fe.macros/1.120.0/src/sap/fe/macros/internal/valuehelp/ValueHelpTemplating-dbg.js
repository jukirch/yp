/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/internal/valuehelp/AdditionalValueFormatter"], function (BindingToolkit, StableIdHelper, TypeGuards, DataModelPathHelper, PropertyHelper, UIFormatters, FieldHelper, additionalValueFormatter) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  var isUnit = PropertyHelper.isUnit;
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var isGuid = PropertyHelper.isGuid;
  var isCurrency = PropertyHelper.isCurrency;
  var hasValueListForValidation = PropertyHelper.hasValueListForValidation;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var hasDateType = PropertyHelper.hasDateType;
  var checkFilterExpressionRestrictions = DataModelPathHelper.checkFilterExpressionRestrictions;
  var isProperty = TypeGuards.isProperty;
  var generate = StableIdHelper.generate;
  var pathInModel = BindingToolkit.pathInModel;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Retrieve the displayMode for the value help.
   * The main rule is that if a property is used in a VHTable then we don't want to display the text arrangement directly.
   *
   * @param propertyPath The current property
   * @param isValueHelpWithFixedValues The value help is a drop-down list
   * @returns The target displayMode
   */
  const getValueHelpTableDisplayMode = function (propertyPath, isValueHelpWithFixedValues) {
    var _propertyPath$targetO, _propertyPath$targetO2, _oTextAnnotation$anno, _oTextAnnotation$anno2, _oTextAnnotation$anno3;
    const sDisplayMode = getDisplayMode(propertyPath);
    const oTextAnnotation = (_propertyPath$targetO = propertyPath.targetObject.annotations) === null || _propertyPath$targetO === void 0 ? void 0 : (_propertyPath$targetO2 = _propertyPath$targetO.Common) === null || _propertyPath$targetO2 === void 0 ? void 0 : _propertyPath$targetO2.Text;
    const oTextArrangementAnnotation = typeof oTextAnnotation !== "string" && (oTextAnnotation === null || oTextAnnotation === void 0 ? void 0 : (_oTextAnnotation$anno = oTextAnnotation.annotations) === null || _oTextAnnotation$anno === void 0 ? void 0 : (_oTextAnnotation$anno2 = _oTextAnnotation$anno.UI) === null || _oTextAnnotation$anno2 === void 0 ? void 0 : (_oTextAnnotation$anno3 = _oTextAnnotation$anno2.TextArrangement) === null || _oTextAnnotation$anno3 === void 0 ? void 0 : _oTextAnnotation$anno3.toString());
    if (isValueHelpWithFixedValues) {
      return oTextAnnotation && typeof oTextAnnotation !== "string" && oTextAnnotation.path ? sDisplayMode : "Value";
    } else {
      // Only explicit defined TextArrangements in a Value Help with Dialog are considered
      return oTextArrangementAnnotation ? sDisplayMode : "Value";
    }
  };

  /**
   * Method to return delegate property of Value Help.
   *
   * @function
   * @name getDelegateConfiguration
   * @memberof sap.fe.macros.internal.valuehelp.ValueHelpTemplating.js
   * @param propertyPath The current property path
   * @param conditionModelName Condition model of the Value Help
   * @param originalPropertyPath The original property path
   * @param requestGroupId The requestGroupId to use for requests
   * @param useMultiValueField If true the value help is for a multi value Field
   * @returns The expression needed to configure the delegate
   */
  _exports.getValueHelpTableDisplayMode = getValueHelpTableDisplayMode;
  const getDelegateConfiguration = function (propertyPath, conditionModelName, originalPropertyPath, requestGroupId) {
    let useMultiValueField = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    const isUnitValueHelp = propertyPath !== originalPropertyPath;
    const delegateConfiguration = {
      name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
      payload: {
        propertyPath,
        isUnitValueHelp,
        conditionModel: conditionModelName,
        requestGroupId,
        useMultiValueField,
        qualifiers: {},
        valueHelpQualifier: ""
      }
    };
    return compileExpression(delegateConfiguration); // for some reason "qualifiers: {}" is ignored here
  };

  /**
   * Method to return delegate property of Value Help for define conditions panel.
   *
   * @function
   * @name getDelegateConfigurationForDefineConditions
   * @memberof sap.fe.macros.internal.valuehelp.ValueHelpTemplating.js
   * @param propertyPath The current property path
   * @returns The expression needed to configure the delegate
   */
  _exports.getDelegateConfiguration = getDelegateConfiguration;
  const getDelegateConfigurationForDefineConditions = function (propertyPath) {
    const delegateConfiguration = {
      name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
      payload: {
        propertyPath,
        isDefineConditionValueHelp: true,
        qualifiers: {},
        valueHelpQualifier: ""
      }
    };
    return compileExpression(delegateConfiguration);
  };

  /**
   * Method to generate the ID for Value Help.
   *
   * @function
   * @name generateID
   * @memberof sap.fe.macros.internal.valuehelp.ValueHelpTemplating.js
   * @param sFlexId Flex ID of the current object
   * @param sIdPrefix Prefix for the ValueHelp ID
   * @param sOriginalPropertyName Name of the property
   * @param sPropertyName Name of the ValueHelp Property
   * @returns The Id generated for the ValueHelp
   */
  _exports.getDelegateConfigurationForDefineConditions = getDelegateConfigurationForDefineConditions;
  const generateID = function (sFlexId, sIdPrefix, sOriginalPropertyName, sPropertyName) {
    if (sFlexId) {
      return sFlexId;
    }
    let sProperty = sPropertyName;
    if (sOriginalPropertyName !== sPropertyName) {
      sProperty = `${sOriginalPropertyName}::${sPropertyName}`;
    }
    return generate([sIdPrefix, sProperty]);
  };

  /**
   * Method to check if a property needs to be validated or not when used in the valuehelp.
   *
   * @function
   * @name requiresValidation
   * @memberof sap.fe.macros.internal.valuehelp.ValueHelpTemplating.js
   * @param  property ValueHelp property type annotations
   * @returns `true` if the value help needs to be validated
   */
  _exports.generateID = generateID;
  const requiresValidation = function (property) {
    return hasValueHelpWithFixedValues(property) || hasValueListForValidation(property) || hasValueHelp(property) && (isUnit(property) || isCurrency(property) || isGuid(property));
  };

  /**
   * Method to decide if case-sensitive filter requests are to be used or not.
   *
   *  If the back end has FilterFunctions Capabilies for the service or the entity, we check it includes support for tolower.
   *
   * @function
   * @name useCaseSensitiveFilterRequests
   * @memberof sap.fe.macros.internal.valuehelp.ValueHelpTemplating.js
   * @param oDataModelPath Current data model path·
   * @param aEntityContainerFilterFunctions Filter functions of entity container
   * @returns `true` if the entity set or service supports case sensitive filter requests
   */
  _exports.requiresValidation = requiresValidation;
  const useCaseSensitiveFilterRequests = function (oDataModelPath, aEntityContainerFilterFunctions) {
    var _oDataModelPath$targe, _oDataModelPath$targe2, _oDataModelPath$targe3;
    const filterFunctions = (oDataModelPath === null || oDataModelPath === void 0 ? void 0 : (_oDataModelPath$targe = oDataModelPath.targetEntitySet) === null || _oDataModelPath$targe === void 0 ? void 0 : (_oDataModelPath$targe2 = _oDataModelPath$targe.annotations) === null || _oDataModelPath$targe2 === void 0 ? void 0 : (_oDataModelPath$targe3 = _oDataModelPath$targe2.Capabilities) === null || _oDataModelPath$targe3 === void 0 ? void 0 : _oDataModelPath$targe3.FilterFunctions) || aEntityContainerFilterFunctions;
    return filterFunctions ? !filterFunctions.includes("tolower") : true;
  };
  _exports.useCaseSensitiveFilterRequests = useCaseSensitiveFilterRequests;
  const isSemanticDateRange = function (oDataModelPath) {
    const targetProperty = oDataModelPath.targetObject;
    const targetRestrictions = checkFilterExpressionRestrictions(oDataModelPath, ["SingleRange"]);
    return hasDateType(targetProperty) && compileExpression(targetRestrictions);
  };
  _exports.isSemanticDateRange = isSemanticDateRange;
  const shouldShowConditionPanel = function (oDataModelPath, oContextPath) {
    // Force push the context path inside
    oDataModelPath.contextLocation = oContextPath;
    return compileExpression(checkFilterExpressionRestrictions(oDataModelPath, ["SingleValue", "MultiValue"])) === "false";
  };
  _exports.shouldShowConditionPanel = shouldShowConditionPanel;
  const getColumnDataProperty = function (sValueListProperty, propertyPath) {
    var _propertyPath$targetO3, _propertyPath$targetO4, _propertyPath$targetO5, _textAnnotation$annot, _textAnnotation$annot2, _textAnnotation$annot3;
    const textAnnotation = propertyPath === null || propertyPath === void 0 ? void 0 : (_propertyPath$targetO3 = propertyPath.targetObject) === null || _propertyPath$targetO3 === void 0 ? void 0 : (_propertyPath$targetO4 = _propertyPath$targetO3.annotations) === null || _propertyPath$targetO4 === void 0 ? void 0 : (_propertyPath$targetO5 = _propertyPath$targetO4.Common) === null || _propertyPath$targetO5 === void 0 ? void 0 : _propertyPath$targetO5.Text;
    return (textAnnotation === null || textAnnotation === void 0 ? void 0 : (_textAnnotation$annot = textAnnotation.annotations) === null || _textAnnotation$annot === void 0 ? void 0 : (_textAnnotation$annot2 = _textAnnotation$annot.UI) === null || _textAnnotation$annot2 === void 0 ? void 0 : (_textAnnotation$annot3 = _textAnnotation$annot2.TextArrangement) === null || _textAnnotation$annot3 === void 0 ? void 0 : _textAnnotation$annot3.valueOf()) === "UI.TextArrangementType/TextOnly" ? textAnnotation.path : sValueListProperty;
  };
  _exports.getColumnDataProperty = getColumnDataProperty;
  const getColumnDataPropertyType = function (valueListPropertyType, propertyPath) {
    var _propertyPath$targetO6, _propertyPath$targetO7, _propertyPath$targetO8, _propertyPath$targetO9, _propertyPath$targetO10, _propertyPath$targetO11;
    const textArrangement = propertyPath === null || propertyPath === void 0 ? void 0 : (_propertyPath$targetO6 = propertyPath.targetObject) === null || _propertyPath$targetO6 === void 0 ? void 0 : (_propertyPath$targetO7 = _propertyPath$targetO6.annotations) === null || _propertyPath$targetO7 === void 0 ? void 0 : (_propertyPath$targetO8 = _propertyPath$targetO7.Common) === null || _propertyPath$targetO8 === void 0 ? void 0 : (_propertyPath$targetO9 = _propertyPath$targetO8.Text) === null || _propertyPath$targetO9 === void 0 ? void 0 : (_propertyPath$targetO10 = _propertyPath$targetO9.annotations) === null || _propertyPath$targetO10 === void 0 ? void 0 : (_propertyPath$targetO11 = _propertyPath$targetO10.UI) === null || _propertyPath$targetO11 === void 0 ? void 0 : _propertyPath$targetO11.TextArrangement;
    return textArrangement && textArrangement.valueOf() !== "UI.TextArrangementType/TextSeparate" ? "Edm.String" : valueListPropertyType;
  };
  const getColumnHAlign = function (propertyPath) {
    const property = propertyPath.targetObject;
    const propertyType = isProperty(property) ? getColumnDataPropertyType(property.type, propertyPath) : "";
    return !propertyType || isSemanticKey(property, propertyPath) ? "Begin" : FieldHelper.getPropertyAlignment(propertyType, {
      textAlignMode: "Table"
    });
  };
  /**
   *
   * @param  propertyPath PropertyPath of the Field
   * @returns Runtime formatter for growing and growingThreshold
   */
  _exports.getColumnHAlign = getColumnHAlign;
  const getGrowingFormatter = function (propertyPath) {
    return compileExpression(formatResult([pathInModel("/recommendationsData", "internal"), constant(propertyPath)], additionalValueFormatter.getGrowing));
  };
  _exports.getGrowingFormatter = getGrowingFormatter;
  return _exports;
}, false);
