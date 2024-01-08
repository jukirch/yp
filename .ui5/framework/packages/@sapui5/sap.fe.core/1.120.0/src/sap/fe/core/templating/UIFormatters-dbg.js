/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/ui/mdc/enums/FieldEditMode"], function (MetaModelConverter, valueFormatters, BindingHelper, BindingToolkit, TypeGuards, DataModelPathHelper, DisplayModeFormatter, FieldControlHelper, PropertyHelper, FieldEditMode) {
  "use strict";

  var _exports = {};
  var isMultiLineText = PropertyHelper.isMultiLineText;
  var isKey = PropertyHelper.isKey;
  var isImmutable = PropertyHelper.isImmutable;
  var isComputed = PropertyHelper.isComputed;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var hasStaticPercentUnit = PropertyHelper.hasStaticPercentUnit;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var isReadOnlyExpression = FieldControlHelper.isReadOnlyExpression;
  var isNonEditableExpression = FieldControlHelper.isNonEditableExpression;
  var isDisabledExpression = FieldControlHelper.isDisabledExpression;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var unresolvableExpression = BindingToolkit.unresolvableExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var not = BindingToolkit.not;
  var isTruthy = BindingToolkit.isTruthy;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var addTypeInformation = BindingToolkit.addTypeInformation;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var bindingContextPathVisitor = BindingHelper.bindingContextPathVisitor;
  var UI = BindingHelper.UI;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  const getDisplayMode = function (oDataModelObjectPath) {
    return DisplayModeFormatter.getDisplayMode(oDataModelObjectPath.targetObject, oDataModelObjectPath);
  };
  _exports.getDisplayMode = getDisplayMode;
  const getEditableExpressionAsObject = function (oPropertyPath) {
    let oDataFieldConverted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    let oDataModelObjectPath = arguments.length > 2 ? arguments[2] : undefined;
    let isEditable = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : UI.IsEditable;
    let considerUpdateRestrictions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    return getEditableExpression(oPropertyPath, oDataFieldConverted, oDataModelObjectPath, true, isEditable, considerUpdateRestrictions);
  };
  _exports.getEditableExpressionAsObject = getEditableExpressionAsObject;
  /**
   * Create the expression to generate an "editable" Boolean value.
   *
   * @param oPropertyPath The input property
   * @param oDataFieldConverted The DataFieldConverted object to read the fieldControl annotation
   * @param oDataModelObjectPath The path to this property object
   * @param bAsObject Whether or not this should be returned as an object or a binding string
   * @param isEditable Whether or not UI.IsEditable be considered.
   * @param considerUpdateRestrictions Whether we want to take into account UpdateRestrictions to compute the editable
   * @returns The binding expression used to determine if a property is editable or not
   */
  const getEditableExpression = function (oPropertyPath) {
    let oDataFieldConverted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    let oDataModelObjectPath = arguments.length > 2 ? arguments[2] : undefined;
    let bAsObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let isEditable = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : UI.IsEditable;
    let considerUpdateRestrictions = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      return compileExpression(false);
    }
    let dataFieldEditableExpression = constant(true);
    if (oDataFieldConverted !== null) {
      dataFieldEditableExpression = ifElse(isNonEditableExpression(oDataFieldConverted), false, isEditable);
    }
    const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;
    const relativePath = getRelativePaths(oDataModelObjectPath);
    // Editability depends on the field control expression
    // If the Field control is statically in ReadOnly or Inapplicable (disabled) -> not editable
    // If the property is a key -> not editable except in creation if not computed
    // If the property is computed -> not editable
    // If the property is not updatable -> not editable
    // If the property is immutable -> not editable except in creation
    // If the Field control is a path resolving to ReadOnly or Inapplicable (disabled) (<= 1) -> not editable
    // Else, to be editable you need
    // immutable and key while in the creation row
    // ui/isEditable
    const isPathUpdatableExpression = isPathUpdatable(oDataModelObjectPath, {
      propertyPath: oPropertyPath,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, oDataModelObjectPath.convertedTypes, navigationPaths)
    });
    if (compileExpression(isPathUpdatableExpression) === "false" && considerUpdateRestrictions) {
      return bAsObject ? isPathUpdatableExpression : "false";
    }
    const editableExpression = oProperty !== undefined ? ifElse(or(and(not(isPathUpdatableExpression), considerUpdateRestrictions), isComputed(oProperty), isKey(oProperty), isImmutable(oProperty), isNonEditableExpression(oProperty, relativePath)), ifElse(or(isComputed(oProperty), isNonEditableExpression(oProperty, relativePath)), false, UI.IsTransientBinding), isEditable) : unresolvableExpression;
    if (bAsObject) {
      return and(editableExpression, dataFieldEditableExpression);
    }
    return compileExpression(and(editableExpression, dataFieldEditableExpression));
  };
  _exports.getEditableExpression = getEditableExpression;
  const getCollaborationExpression = function (dataModelObjectPath, formatter) {
    var _dataModelObjectPath$;
    const objectPath = getTargetObjectPath(dataModelObjectPath);
    const activityExpression = pathInModel(`/collaboration/activities${objectPath}`, "internal");
    const keys = dataModelObjectPath === null || dataModelObjectPath === void 0 ? void 0 : (_dataModelObjectPath$ = dataModelObjectPath.targetEntityType) === null || _dataModelObjectPath$ === void 0 ? void 0 : _dataModelObjectPath$.keys;
    const keysExpressions = [];
    keys === null || keys === void 0 ? void 0 : keys.forEach(function (key) {
      const keyExpression = pathInModel(key.name);
      keysExpressions.push(keyExpression);
    });
    return formatResult([activityExpression, ...keysExpressions], formatter);
  };
  _exports.getCollaborationExpression = getCollaborationExpression;
  const getEnabledExpressionAsObject = function (oPropertyPath, oDataFieldConverted, oDataModelObjectPath) {
    return getEnabledExpression(oPropertyPath, oDataFieldConverted, true, oDataModelObjectPath);
  };
  /**
   * Create the expression to generate an "enabled" Boolean value.
   *
   * @param oPropertyPath The input property
   * @param oDataFieldConverted The DataFieldConverted Object to read the fieldControl annotation
   * @param bAsObject Whether or not this should be returned as an object or a binding string
   * @param oDataModelObjectPath
   * @returns The binding expression to determine if a property is enabled or not
   */
  _exports.getEnabledExpressionAsObject = getEnabledExpressionAsObject;
  const getEnabledExpression = function (oPropertyPath, oDataFieldConverted) {
    let bAsObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let oDataModelObjectPath = arguments.length > 3 ? arguments[3] : undefined;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      return compileExpression(true);
    }
    let relativePath;
    if (oDataModelObjectPath) {
      relativePath = getRelativePaths(oDataModelObjectPath);
    }
    let dataFieldEnabledExpression = constant(true);
    if (oDataFieldConverted !== null) {
      dataFieldEnabledExpression = ifElse(isDisabledExpression(oDataFieldConverted), false, true);
    }
    const oProperty = isPathAnnotationExpression(oPropertyPath) ? oPropertyPath.$target : oPropertyPath;
    // Enablement depends on the field control expression
    // If the Field control is statically in Inapplicable (disabled) -> not enabled
    const enabledExpression = oProperty !== undefined ? ifElse(isDisabledExpression(oProperty, relativePath), false, true) : unresolvableExpression;
    if (bAsObject) {
      return and(enabledExpression, dataFieldEnabledExpression);
    }
    return compileExpression(and(enabledExpression, dataFieldEnabledExpression));
  };

  /**
   * Create the expression to generate an "editMode" enum value.
   *
   * @param propertyPath The input property
   * @param dataModelObjectPath The list of data model objects that are involved to reach that property
   * @param measureReadOnly Whether we should set UoM / currency field mode to read only
   * @param asObject Whether we should return this as an expression or as a string
   * @param dataFieldConverted The dataField object
   * @param isEditable Whether or not UI.IsEditable be considered.
   * @returns The binding expression representing the current property edit mode, compliant with the MDC Field definition of editMode.
   */
  _exports.getEnabledExpression = getEnabledExpression;
  const getEditMode = function (propertyPath, dataModelObjectPath) {
    var _property$annotations, _property$annotations2, _property$annotations3, _property$annotations4;
    let measureReadOnly = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let asObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let dataFieldConverted = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    let isEditable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : UI.IsEditable;
    if (!propertyPath || typeof propertyPath === "string" || (dataFieldConverted === null || dataFieldConverted === void 0 ? void 0 : dataFieldConverted.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
      return FieldEditMode.Display;
    }
    const property = isPathAnnotationExpression(propertyPath) ? propertyPath.$target : propertyPath;
    const relativePath = getRelativePaths(dataModelObjectPath);
    const isPathUpdatableExpression = isPathUpdatable(dataModelObjectPath, {
      propertyPath: property,
      pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, dataModelObjectPath.convertedTypes, navigationPaths)
    });

    // we get the editable Expression without considering update Restrictions because they are handled separately
    const editableExpression = getEditableExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath, isEditable, false);
    const enabledExpression = getEnabledExpressionAsObject(propertyPath, dataFieldConverted, dataModelObjectPath);
    const associatedCurrencyProperty = getAssociatedCurrencyProperty(property);
    const unitProperty = associatedCurrencyProperty || getAssociatedUnitProperty(property);
    let resultExpression = constant(FieldEditMode.Editable);
    if (unitProperty) {
      const isUnitReadOnly = isReadOnlyExpression(unitProperty, relativePath);
      resultExpression = ifElse(or(isUnitReadOnly, isComputed(unitProperty), and(isImmutable(unitProperty), not(UI.IsTransientBinding)), measureReadOnly), ifElse(!isConstant(isUnitReadOnly) && isUnitReadOnly, FieldEditMode.EditableReadOnly, FieldEditMode.EditableDisplay), FieldEditMode.Editable);
    }
    if (!unitProperty && (property !== null && property !== void 0 && (_property$annotations = property.annotations) !== null && _property$annotations !== void 0 && (_property$annotations2 = _property$annotations.Measures) !== null && _property$annotations2 !== void 0 && _property$annotations2.ISOCurrency || property !== null && property !== void 0 && (_property$annotations3 = property.annotations) !== null && _property$annotations3 !== void 0 && (_property$annotations4 = _property$annotations3.Measures) !== null && _property$annotations4 !== void 0 && _property$annotations4.Unit)) {
      // no unit property associated means this is a static unit
      resultExpression = constant(FieldEditMode.EditableDisplay);
    }
    const readOnlyExpression = or(isReadOnlyExpression(property, relativePath), isReadOnlyExpression(dataFieldConverted));

    // if there are update Restrictions it is always display mode
    const editModeExpression = ifElse(or(isPathUpdatableExpression, UI.IsTransientBinding), ifElse(enabledExpression, ifElse(editableExpression, resultExpression, ifElse(and(!isConstant(readOnlyExpression) && readOnlyExpression, isEditable), FieldEditMode.ReadOnly, FieldEditMode.Display)), ifElse(isEditable, FieldEditMode.Disabled, FieldEditMode.Display)), FieldEditMode.Display);
    if (asObject) {
      return editModeExpression;
    }
    return compileExpression(editModeExpression);
  };
  _exports.getEditMode = getEditMode;
  const hasValidAnalyticalCurrencyOrUnit = function (oPropertyDataModelObjectPath) {
    var _oPropertyDefinition$, _oPropertyDefinition$2, _oPropertyDefinition$3, _oPropertyDefinition$4;
    const oPropertyDefinition = oPropertyDataModelObjectPath.targetObject;
    const currency = (_oPropertyDefinition$ = oPropertyDefinition.annotations) === null || _oPropertyDefinition$ === void 0 ? void 0 : (_oPropertyDefinition$2 = _oPropertyDefinition$.Measures) === null || _oPropertyDefinition$2 === void 0 ? void 0 : _oPropertyDefinition$2.ISOCurrency;
    const measure = currency ? currency : (_oPropertyDefinition$3 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$3 === void 0 ? void 0 : (_oPropertyDefinition$4 = _oPropertyDefinition$3.Measures) === null || _oPropertyDefinition$4 === void 0 ? void 0 : _oPropertyDefinition$4.Unit;
    if (measure) {
      return compileExpression(or(isTruthy(getExpressionFromAnnotation(measure)), not(UI.IsTotal)));
    } else {
      return compileExpression(constant(true));
    }
  };
  _exports.hasValidAnalyticalCurrencyOrUnit = hasValidAnalyticalCurrencyOrUnit;
  const getFieldDisplay = function (oPropertyPath, sTargetDisplayMode, oComputedEditMode) {
    var _oProperty$annotation, _oProperty$annotation2;
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    const hasTextAnnotation = ((_oProperty$annotation = oProperty.annotations) === null || _oProperty$annotation === void 0 ? void 0 : (_oProperty$annotation2 = _oProperty$annotation.Common) === null || _oProperty$annotation2 === void 0 ? void 0 : _oProperty$annotation2.Text) !== undefined;
    return hasValueHelp(oProperty) ? compileExpression(sTargetDisplayMode) : hasTextAnnotation ? compileExpression(ifElse(equal(oComputedEditMode, "Editable"), "Value", sTargetDisplayMode)) : "Value";
  };
  _exports.getFieldDisplay = getFieldDisplay;
  const getTypeConfig = function (oProperty, dataType) {
    var _propertyTypeConfig$t, _propertyTypeConfig$t2, _propertyTypeConfig$t3, _propertyTypeConfig$t4;
    const oTargetMapping = EDM_TYPE_MAPPING[oProperty === null || oProperty === void 0 ? void 0 : oProperty.type] || (dataType ? EDM_TYPE_MAPPING[dataType] : undefined);
    const propertyTypeConfig = {
      type: oTargetMapping.type,
      constraints: {},
      formatOptions: {}
    };
    if (isProperty(oProperty)) {
      var _oTargetMapping$const, _oTargetMapping$const2, _oTargetMapping$const3, _oTargetMapping$const4, _oTargetMapping$const5, _oProperty$annotation3, _oProperty$annotation4, _oProperty$annotation5, _oProperty$annotation6, _oTargetMapping$const6, _oProperty$annotation7, _oProperty$annotation8, _oProperty$annotation9, _oProperty$annotation10, _oTargetMapping$const7, _oProperty$annotation11, _oProperty$annotation12, _oTargetMapping$const8;
      propertyTypeConfig.constraints = {
        scale: (_oTargetMapping$const = oTargetMapping.constraints) !== null && _oTargetMapping$const !== void 0 && _oTargetMapping$const.$Scale ? oProperty.scale : undefined,
        precision: (_oTargetMapping$const2 = oTargetMapping.constraints) !== null && _oTargetMapping$const2 !== void 0 && _oTargetMapping$const2.$Precision ? oProperty.precision : undefined,
        maxLength: (_oTargetMapping$const3 = oTargetMapping.constraints) !== null && _oTargetMapping$const3 !== void 0 && _oTargetMapping$const3.$MaxLength ? oProperty.maxLength : undefined,
        nullable: (_oTargetMapping$const4 = oTargetMapping.constraints) !== null && _oTargetMapping$const4 !== void 0 && _oTargetMapping$const4.$Nullable ? oProperty.nullable : undefined,
        minimum: (_oTargetMapping$const5 = oTargetMapping.constraints) !== null && _oTargetMapping$const5 !== void 0 && _oTargetMapping$const5["@Org.OData.Validation.V1.Minimum/$Decimal"] && !isNaN((_oProperty$annotation3 = oProperty.annotations) === null || _oProperty$annotation3 === void 0 ? void 0 : (_oProperty$annotation4 = _oProperty$annotation3.Validation) === null || _oProperty$annotation4 === void 0 ? void 0 : _oProperty$annotation4.Minimum) ? `${(_oProperty$annotation5 = oProperty.annotations) === null || _oProperty$annotation5 === void 0 ? void 0 : (_oProperty$annotation6 = _oProperty$annotation5.Validation) === null || _oProperty$annotation6 === void 0 ? void 0 : _oProperty$annotation6.Minimum}` : undefined,
        maximum: (_oTargetMapping$const6 = oTargetMapping.constraints) !== null && _oTargetMapping$const6 !== void 0 && _oTargetMapping$const6["@Org.OData.Validation.V1.Maximum/$Decimal"] && !isNaN((_oProperty$annotation7 = oProperty.annotations) === null || _oProperty$annotation7 === void 0 ? void 0 : (_oProperty$annotation8 = _oProperty$annotation7.Validation) === null || _oProperty$annotation8 === void 0 ? void 0 : _oProperty$annotation8.Maximum) ? `${(_oProperty$annotation9 = oProperty.annotations) === null || _oProperty$annotation9 === void 0 ? void 0 : (_oProperty$annotation10 = _oProperty$annotation9.Validation) === null || _oProperty$annotation10 === void 0 ? void 0 : _oProperty$annotation10.Maximum}` : undefined,
        isDigitSequence: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && (_oTargetMapping$const7 = oTargetMapping.constraints) !== null && _oTargetMapping$const7 !== void 0 && _oTargetMapping$const7["@com.sap.vocabularies.Common.v1.IsDigitSequence"] && (_oProperty$annotation11 = oProperty.annotations) !== null && _oProperty$annotation11 !== void 0 && (_oProperty$annotation12 = _oProperty$annotation11.Common) !== null && _oProperty$annotation12 !== void 0 && _oProperty$annotation12.IsDigitSequence ? true : undefined,
        V4: (_oTargetMapping$const8 = oTargetMapping.constraints) !== null && _oTargetMapping$const8 !== void 0 && _oTargetMapping$const8.$V4 ? true : undefined
      };
    }
    propertyTypeConfig.formatOptions = {
      parseAsString: (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t = propertyTypeConfig.type) === null || _propertyTypeConfig$t === void 0 ? void 0 : _propertyTypeConfig$t.indexOf("sap.ui.model.odata.type.Int")) === 0 || (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t2 = propertyTypeConfig.type) === null || _propertyTypeConfig$t2 === void 0 ? void 0 : _propertyTypeConfig$t2.indexOf("sap.ui.model.odata.type.Double")) === 0 ? false : undefined,
      emptyString: (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t3 = propertyTypeConfig.type) === null || _propertyTypeConfig$t3 === void 0 ? void 0 : _propertyTypeConfig$t3.indexOf("sap.ui.model.odata.type.Int")) === 0 || (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t4 = propertyTypeConfig.type) === null || _propertyTypeConfig$t4 === void 0 ? void 0 : _propertyTypeConfig$t4.indexOf("sap.ui.model.odata.type.Double")) === 0 ? "" : undefined,
      parseKeepsEmptyString: propertyTypeConfig.type === "sap.ui.model.odata.type.String" ? true : undefined
    };
    return propertyTypeConfig;
  };
  _exports.getTypeConfig = getTypeConfig;
  const getBindingWithUnitOrCurrency = function (oPropertyDataModelPath, propertyBindingExpression, ignoreUnitConstraint, formatOptions) {
    var _oPropertyDefinition$5, _oPropertyDefinition$6, _oPropertyDefinition$7, _oPropertyDefinition$8;
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    let unit = (_oPropertyDefinition$5 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$5 === void 0 ? void 0 : (_oPropertyDefinition$6 = _oPropertyDefinition$5.Measures) === null || _oPropertyDefinition$6 === void 0 ? void 0 : _oPropertyDefinition$6.Unit;
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    if (hasStaticPercentUnit(oPropertyDefinition)) {
      if ((formatOptions === null || formatOptions === void 0 ? void 0 : formatOptions.showMeasure) === false) {
        return propertyBindingExpression;
      }
      return formatResult([propertyBindingExpression], valueFormatters.formatWithPercentage);
    }
    const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
    unit = unit ? unit : (_oPropertyDefinition$7 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$7 === void 0 ? void 0 : (_oPropertyDefinition$8 = _oPropertyDefinition$7.Measures) === null || _oPropertyDefinition$8 === void 0 ? void 0 : _oPropertyDefinition$8.ISOCurrency;
    const unitBindingExpression = isPathAnnotationExpression(unit) && unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation), ignoreUnitConstraint) : getExpressionFromAnnotation(unit, relativeLocation);
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions);
  };
  _exports.getBindingWithUnitOrCurrency = getBindingWithUnitOrCurrency;
  const getBindingForUnitOrCurrency = function (oPropertyDataModelPath) {
    var _oPropertyDefinition$9, _oPropertyDefinition$10, _oPropertyDefinition$11, _oPropertyDefinition$12;
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    let unit = (_oPropertyDefinition$9 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$9 === void 0 ? void 0 : (_oPropertyDefinition$10 = _oPropertyDefinition$9.Measures) === null || _oPropertyDefinition$10 === void 0 ? void 0 : _oPropertyDefinition$10.Unit;
    if (hasStaticPercentUnit(oPropertyDefinition)) {
      return constant("%");
    }
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    const complexType = unit ? "sap.ui.model.odata.type.Unit" : "sap.ui.model.odata.type.Currency";
    unit = unit ? unit : (_oPropertyDefinition$11 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$11 === void 0 ? void 0 : (_oPropertyDefinition$12 = _oPropertyDefinition$11.Measures) === null || _oPropertyDefinition$12 === void 0 ? void 0 : _oPropertyDefinition$12.ISOCurrency;
    const unitBindingExpression = isPathAnnotationExpression(unit) && unit.$target ? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation)) : getExpressionFromAnnotation(unit, relativeLocation);
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oPropertyDataModelPath));
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression, true);
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, {
      parseKeepsEmptyString: true,
      showNumber: false
    });
  };
  _exports.getBindingForUnitOrCurrency = getBindingForUnitOrCurrency;
  const getBindingWithTimezone = function (oPropertyDataModelPath, propertyBindingExpression) {
    var _oPropertyDefinition$13, _oPropertyDefinition$14;
    let ignoreUnitConstraint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let hideTimezoneForEmptyValues = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let dateFormatOptions = arguments.length > 4 ? arguments[4] : undefined;
    const oPropertyDefinition = oPropertyDataModelPath.targetObject;
    const timezone = (_oPropertyDefinition$13 = oPropertyDefinition.annotations) === null || _oPropertyDefinition$13 === void 0 ? void 0 : (_oPropertyDefinition$14 = _oPropertyDefinition$13.Common) === null || _oPropertyDefinition$14 === void 0 ? void 0 : _oPropertyDefinition$14.Timezone;
    const relativeLocation = getRelativePaths(oPropertyDataModelPath);
    propertyBindingExpression = formatWithTypeInformation(oPropertyDefinition, propertyBindingExpression);
    const complexType = "sap.fe.core.type.DateTimeWithTimezone";
    const unitBindingExpression = timezone.$target ? formatWithTypeInformation(timezone.$target, getExpressionFromAnnotation(timezone, relativeLocation), ignoreUnitConstraint) : getExpressionFromAnnotation(timezone, relativeLocation);
    let formatOptions = {};
    if (hideTimezoneForEmptyValues) {
      formatOptions = {
        showTimezoneForEmptyValues: false
      };
    }
    if (dateFormatOptions !== null && dateFormatOptions !== void 0 && dateFormatOptions.showTime) {
      formatOptions = {
        ...formatOptions,
        ...{
          showTime: dateFormatOptions.showTime === "false" ? false : true
        }
      };
    }
    if (dateFormatOptions !== null && dateFormatOptions !== void 0 && dateFormatOptions.showDate) {
      formatOptions = {
        ...formatOptions,
        ...{
          showDate: dateFormatOptions.showDate === "false" ? false : true
        }
      };
    }
    if (dateFormatOptions !== null && dateFormatOptions !== void 0 && dateFormatOptions.showTimezone) {
      formatOptions = {
        ...formatOptions,
        ...{
          showTimezone: dateFormatOptions.showTimezone === "false" ? false : true
        }
      };
    }
    return addTypeInformation([propertyBindingExpression, unitBindingExpression], complexType, undefined, formatOptions);
  };
  _exports.getBindingWithTimezone = getBindingWithTimezone;
  const getBindingForTimezone = function (propertyDataModelPath, propertyBindingExpression) {
    const propertyDefinition = propertyDataModelPath.targetObject;
    propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    propertyBindingExpression.type = "any";
    const complexType = "sap.ui.model.odata.type.DateTimeWithTimezone";
    const formatOptions = {
      showTime: false,
      showDate: false,
      showTimezone: true
    };

    // null is required by formatter when there is just a timezone
    return addTypeInformation([null, propertyBindingExpression], complexType, undefined, formatOptions);
  };
  _exports.getBindingForTimezone = getBindingForTimezone;
  const getAlignmentExpression = function (oComputedEditMode) {
    let sAlignDisplay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Begin";
    let sAlignEdit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "Begin";
    return compileExpression(ifElse(equal(oComputedEditMode, "Display"), sAlignDisplay, sAlignEdit));
  };

  /**
   * Formatter helper to retrieve the converterContext from the metamodel context.
   *
   * @param oContext The original metamodel context
   * @param oInterface The current templating context
   * @returns The ConverterContext representing that object
   */
  _exports.getAlignmentExpression = getAlignmentExpression;
  const getConverterContext = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return convertMetaModelContext(oInterface.context);
    }
    return null;
  };
  getConverterContext.requiresIContext = true;

  /**
   * Formatter helper to retrieve the data model objects that are involved from the metamodel context.
   *
   * @param oContext The original ODataMetaModel context
   * @param oInterface The current templating context
   * @returns An array of entitysets and navproperties that are involved to get to a specific object in the metamodel
   */
  _exports.getConverterContext = getConverterContext;
  const getDataModelObjectPath = function (oContext, oInterface) {
    if (oInterface && oInterface.context) {
      return getInvolvedDataModelObjects(oInterface.context);
    }
    return null;
  };
  getDataModelObjectPath.requiresIContext = true;

  /**
   * Checks if the referenced property is part of a 1..n navigation.
   *
   * @param oDataModelPath The data model path to check
   * @returns True if the property is part of a 1..n navigation
   */
  _exports.getDataModelObjectPath = getDataModelObjectPath;
  const isMultiValueField = function (oDataModelPath) {
    var _oDataModelPath$navig;
    if ((_oDataModelPath$navig = oDataModelPath.navigationProperties) !== null && _oDataModelPath$navig !== void 0 && _oDataModelPath$navig.length) {
      const hasOneToManyNavigation = (oDataModelPath === null || oDataModelPath === void 0 ? void 0 : oDataModelPath.navigationProperties.findIndex(oNav => {
        if (isMultipleNavigationProperty(oNav)) {
          var _oDataModelPath$conte, _oDataModelPath$conte2;
          if ((_oDataModelPath$conte = oDataModelPath.contextLocation) !== null && _oDataModelPath$conte !== void 0 && (_oDataModelPath$conte2 = _oDataModelPath$conte.navigationProperties) !== null && _oDataModelPath$conte2 !== void 0 && _oDataModelPath$conte2.length) {
            var _oDataModelPath$conte3;
            //we check the one to many nav is not already part of the context
            return ((_oDataModelPath$conte3 = oDataModelPath.contextLocation) === null || _oDataModelPath$conte3 === void 0 ? void 0 : _oDataModelPath$conte3.navigationProperties.findIndex(oContextNav => oContextNav.name === oNav.name)) === -1;
          }
          return true;
        }
        return false;
      })) > -1;
      if (hasOneToManyNavigation) {
        return true;
      }
    }
    return false;
  };
  _exports.isMultiValueField = isMultiValueField;
  const getRequiredExpressionAsObject = function (oPropertyPath, oDataFieldConverted) {
    let forceEditMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return getRequiredExpression(oPropertyPath, oDataFieldConverted, forceEditMode, true);
  };
  _exports.getRequiredExpressionAsObject = getRequiredExpressionAsObject;
  const getRequiredExpression = function (oPropertyPath, oDataFieldConverted) {
    let forceEditMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let bAsObject = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let oRequiredProperties = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    let dataModelObjectPath = arguments.length > 5 ? arguments[5] : undefined;
    const aRequiredPropertiesFromInsertRestrictions = oRequiredProperties.requiredPropertiesFromInsertRestrictions;
    const aRequiredPropertiesFromUpdateRestrictions = oRequiredProperties.requiredPropertiesFromUpdateRestrictions;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      if (bAsObject) {
        return constant(false);
      }
      return compileExpression(constant(false));
    }
    let relativePath;
    if (dataModelObjectPath) {
      relativePath = getRelativePaths(dataModelObjectPath);
    }
    let dataFieldRequiredExpression = constant(false);
    if (oDataFieldConverted !== null && oDataFieldConverted !== undefined) {
      dataFieldRequiredExpression = isRequiredExpression(oDataFieldConverted);
    }
    let requiredPropertyFromInsertRestrictionsExpression = constant(false);
    let requiredPropertyFromUpdateRestrictionsExpression = constant(false);
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    // Enablement depends on the field control expression
    // If the Field control is statically in Inapplicable (disabled) -> not enabled
    const requiredExpression = isRequiredExpression(oProperty, relativePath);
    const editMode = forceEditMode || UI.IsEditable;
    if (aRequiredPropertiesFromInsertRestrictions !== null && aRequiredPropertiesFromInsertRestrictions !== void 0 && aRequiredPropertiesFromInsertRestrictions.includes(oPropertyPath.name)) {
      requiredPropertyFromInsertRestrictionsExpression = UI.IsCreateMode;
    }
    if (aRequiredPropertiesFromUpdateRestrictions !== null && aRequiredPropertiesFromUpdateRestrictions !== void 0 && aRequiredPropertiesFromUpdateRestrictions.includes(oPropertyPath.name)) {
      requiredPropertyFromUpdateRestrictionsExpression = and(UI.IsEditable, not(UI.IsCreateMode));
    }
    const returnExpression = or(and(or(requiredExpression, dataFieldRequiredExpression), editMode), requiredPropertyFromInsertRestrictionsExpression, requiredPropertyFromUpdateRestrictionsExpression);
    if (bAsObject) {
      return returnExpression;
    }
    return compileExpression(returnExpression);
  };
  _exports.getRequiredExpression = getRequiredExpression;
  const getRequiredExpressionForConnectedDataField = function (dataFieldObjectPath) {
    var _dataFieldObjectPath$, _dataFieldObjectPath$2;
    const data = dataFieldObjectPath === null || dataFieldObjectPath === void 0 ? void 0 : (_dataFieldObjectPath$ = dataFieldObjectPath.targetObject) === null || _dataFieldObjectPath$ === void 0 ? void 0 : (_dataFieldObjectPath$2 = _dataFieldObjectPath$.$target) === null || _dataFieldObjectPath$2 === void 0 ? void 0 : _dataFieldObjectPath$2.Data;
    const keys = Object.keys(data);
    const dataFields = [];
    let propertyPath;
    const isRequiredExpressions = [];
    for (const key of keys) {
      if (data[key]["$Type"] && data[key]["$Type"].indexOf("DataField") > -1) {
        dataFields.push(data[key]);
      }
    }
    for (const dataField of dataFields) {
      switch (dataField.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          if (typeof dataField.Value === "object") {
            propertyPath = dataField.Value.$target;
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          if (dataField.Target.$target) {
            if (dataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.DataField" || dataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
              if (typeof dataField.Target.$target.Value === "object") {
                propertyPath = dataField.Target.$target.Value.$target;
              }
            } else {
              if (typeof dataField.Target === "object") {
                propertyPath = dataField.Target.$target;
              }
              break;
            }
          }
          break;
        // no default
      }

      isRequiredExpressions.push(getRequiredExpressionAsObject(propertyPath, dataField, false));
    }
    return compileExpression(or(...isRequiredExpressions));
  };

  /**
   * Check if header facet or action is visible.
   *
   * @param targetObject Header facets or Actions
   * @returns BindingToolkitExpression<boolean>
   */
  _exports.getRequiredExpressionForConnectedDataField = getRequiredExpressionForConnectedDataField;
  function isVisible(targetObject) {
    var _targetObject$annotat, _targetObject$annotat2;
    return not(equal(getExpressionFromAnnotation(targetObject === null || targetObject === void 0 ? void 0 : (_targetObject$annotat = targetObject.annotations) === null || _targetObject$annotat === void 0 ? void 0 : (_targetObject$annotat2 = _targetObject$annotat.UI) === null || _targetObject$annotat2 === void 0 ? void 0 : _targetObject$annotat2.Hidden), true));
  }

  /**
   * Checks whether action parameter is supports multi line input.
   *
   * @param dataModelObjectPath Object path to the action parameter.
   * @returns Boolean
   */
  _exports.isVisible = isVisible;
  const isMultiLine = function (dataModelObjectPath) {
    return isMultiLineText(dataModelObjectPath.targetObject);
  };

  /**
   * Check if the action is enabled.
   * @param actionTarget Action
   * @param convertedTypes ConvertedMetadata
   * @param dataModelObjectPath DataModelObjectPath
   * @param pathFromContextLocation Boolean
   * @returns BindingToolkitExpression
   */
  _exports.isMultiLine = isMultiLine;
  function getActionEnabledExpression(actionTarget, convertedTypes, dataModelObjectPath, pathFromContextLocation) {
    var _dataModelObjectPath$2, _actionTarget$paramet, _actionTarget$annotat;
    let prefix = "";
    if (dataModelObjectPath && pathFromContextLocation && pathFromContextLocation === true && (_dataModelObjectPath$2 = dataModelObjectPath.contextLocation) !== null && _dataModelObjectPath$2 !== void 0 && _dataModelObjectPath$2.targetEntityType && dataModelObjectPath.contextLocation.targetEntityType !== actionTarget.sourceEntityType) {
      const navigations = getRelativePaths(dataModelObjectPath);
      let sourceActionDataModelObject = enhanceDataModelPath(dataModelObjectPath.contextLocation);
      //Start from contextLocation and navigate until the source entityType of the action to get the right prefix
      for (const nav of navigations) {
        sourceActionDataModelObject = enhanceDataModelPath(sourceActionDataModelObject, nav);
        if (sourceActionDataModelObject.targetEntityType === actionTarget.sourceEntityType) {
          prefix = `${getRelativePaths(sourceActionDataModelObject).join("/")}/`;
          break;
        }
      }
    }
    const bindingParameterFullName = actionTarget.isBound ? (_actionTarget$paramet = actionTarget.parameters[0]) === null || _actionTarget$paramet === void 0 ? void 0 : _actionTarget$paramet.fullyQualifiedName : undefined;
    const operationAvailableExpression = getExpressionFromAnnotation((_actionTarget$annotat = actionTarget.annotations.Core) === null || _actionTarget$annotat === void 0 ? void 0 : _actionTarget$annotat.OperationAvailable, [], undefined, path => `${prefix}${bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName)}`);
    return notEqual(operationAvailableExpression, false);
  }
  _exports.getActionEnabledExpression = getActionEnabledExpression;
  return _exports;
}, false);
