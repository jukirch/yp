/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CommonFormatters", "sap/fe/core/templating/DataFieldFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/core/templating/UIFormatters", "sap/ui/model/json/JSONModel", "./FieldHelper"], function (DataField, BindingHelper, BindingToolkit, TypeGuards, CommonFormatters, DataFieldFormatters, DataModelPathHelper, PropertyHelper, SemanticObjectHelper, UIFormatters, JSONModel, FieldHelper) {
  "use strict";

  var _exports = {};
  var hasSemanticObject = SemanticObjectHelper.hasSemanticObject;
  var getDynamicPathFromSemanticObject = SemanticObjectHelper.getDynamicPathFromSemanticObject;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var getContextPropertyRestriction = DataModelPathHelper.getContextPropertyRestriction;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var generateVisibleExpression = DataFieldFormatters.generateVisibleExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var transformRecursively = BindingToolkit.transformRecursively;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var isComplexTypeExpression = BindingToolkit.isComplexTypeExpression;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var UI = BindingHelper.UI;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  /**
   * Recursively add the text arrangement to a binding expression.
   *
   * @param bindingExpressionToEnhance The binding expression to be enhanced
   * @param fullContextPath The current context path we're on (to properly resolve the text arrangement properties)
   * @returns An updated expression containing the text arrangement binding.
   */
  const addTextArrangementToBindingExpression = function (bindingExpressionToEnhance, fullContextPath) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      let outExpression = expression;
      if (expression.modelName === undefined) {
        // In case of default model we then need to resolve the text arrangement property
        const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
        outExpression = CommonFormatters.getBindingWithTextArrangement(oPropertyDataModelPath, expression);
      }
      return outExpression;
    });
  };
  _exports.addTextArrangementToBindingExpression = addTextArrangementToBindingExpression;
  const formatValueRecursively = function (bindingExpressionToEnhance, fullContextPath) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      let outExpression = expression;
      if (expression.modelName === undefined) {
        // In case of default model we then need to resolve the text arrangement property
        const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
        outExpression = formatWithTypeInformation(oPropertyDataModelPath.targetObject, expression);
      }
      return outExpression;
    });
  };
  _exports.formatValueRecursively = formatValueRecursively;
  const getTextBindingExpression = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    return getTextBinding(oPropertyDataModelObjectPath, fieldFormatOptions, true);
  };
  _exports.getTextBindingExpression = getTextBindingExpression;
  const getTextBinding = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    var _oPropertyDataModelOb, _oPropertyDataModelOb2, _oPropertyDataModelOb3, _oPropertyDataModelOb4, _oPropertyDataModelOb5, _oPropertyDataModelOb6, _oPropertyDataModelOb7, _oPropertyDataModelOb8, _oPropertyDataModelOb9, _oPropertyDataModelOb10, _oPropertyDataModelOb11, _oPropertyDataModelOb12, _oPropertyDataModelOb13, _oPropertyDataModelOb14, _oPropertyDataModelOb15, _oPropertyDataModelOb16, _oPropertyDataModelOb17, _oPropertyDataModelOb18;
    let asObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let customFormatter = arguments.length > 3 ? arguments[3] : undefined;
    if (((_oPropertyDataModelOb = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb === void 0 ? void 0 : _oPropertyDataModelOb.$Type) === "com.sap.vocabularies.UI.v1.DataField" || ((_oPropertyDataModelOb2 = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb2 === void 0 ? void 0 : _oPropertyDataModelOb2.$Type) === "com.sap.vocabularies.UI.v1.DataPointType" || ((_oPropertyDataModelOb3 = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb3 === void 0 ? void 0 : _oPropertyDataModelOb3.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath" || ((_oPropertyDataModelOb4 = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb4 === void 0 ? void 0 : _oPropertyDataModelOb4.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || ((_oPropertyDataModelOb5 = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb5 === void 0 ? void 0 : _oPropertyDataModelOb5.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || ((_oPropertyDataModelOb6 = oPropertyDataModelObjectPath.targetObject) === null || _oPropertyDataModelOb6 === void 0 ? void 0 : _oPropertyDataModelOb6.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithAction") {
      // If there is no resolved property, the value is returned as a constant
      const fieldValue = getExpressionFromAnnotation(oPropertyDataModelObjectPath.targetObject.Value) ?? "";
      return compileExpression(fieldValue);
    }
    if (isPathAnnotationExpression(oPropertyDataModelObjectPath.targetObject) && oPropertyDataModelObjectPath.targetObject.$target) {
      oPropertyDataModelObjectPath = enhanceDataModelPath(oPropertyDataModelObjectPath, oPropertyDataModelObjectPath.targetObject.path);
    }
    const oPropertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oPropertyDataModelObjectPath));
    let oTargetBinding;
    // formatting
    if ((_oPropertyDataModelOb7 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb7 !== void 0 && (_oPropertyDataModelOb8 = _oPropertyDataModelOb7.annotations) !== null && _oPropertyDataModelOb8 !== void 0 && (_oPropertyDataModelOb9 = _oPropertyDataModelOb8.Measures) !== null && _oPropertyDataModelOb9 !== void 0 && _oPropertyDataModelOb9.Unit || (_oPropertyDataModelOb10 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb10 !== void 0 && (_oPropertyDataModelOb11 = _oPropertyDataModelOb10.annotations) !== null && _oPropertyDataModelOb11 !== void 0 && (_oPropertyDataModelOb12 = _oPropertyDataModelOb11.Measures) !== null && _oPropertyDataModelOb12 !== void 0 && _oPropertyDataModelOb12.ISOCurrency) {
      oTargetBinding = UIFormatters.getBindingWithUnitOrCurrency(oPropertyDataModelObjectPath, oPropertyBindingExpression);
      if ((fieldFormatOptions === null || fieldFormatOptions === void 0 ? void 0 : fieldFormatOptions.measureDisplayMode) === "Hidden" && isComplexTypeExpression(oTargetBinding)) {
        // TODO: Refactor once types are less generic here
        oTargetBinding.formatOptions = {
          ...oTargetBinding.formatOptions,
          showMeasure: false
        };
      }
    } else if ((_oPropertyDataModelOb13 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb13 !== void 0 && (_oPropertyDataModelOb14 = _oPropertyDataModelOb13.annotations) !== null && _oPropertyDataModelOb14 !== void 0 && (_oPropertyDataModelOb15 = _oPropertyDataModelOb14.Common) !== null && _oPropertyDataModelOb15 !== void 0 && _oPropertyDataModelOb15.Timezone) {
      oTargetBinding = UIFormatters.getBindingWithTimezone(oPropertyDataModelObjectPath, oPropertyBindingExpression, false, true, fieldFormatOptions.dateFormatOptions);
    } else if ((_oPropertyDataModelOb16 = oPropertyDataModelObjectPath.targetObject) !== null && _oPropertyDataModelOb16 !== void 0 && (_oPropertyDataModelOb17 = _oPropertyDataModelOb16.annotations) !== null && _oPropertyDataModelOb17 !== void 0 && (_oPropertyDataModelOb18 = _oPropertyDataModelOb17.Common) !== null && _oPropertyDataModelOb18 !== void 0 && _oPropertyDataModelOb18.IsTimezone) {
      oTargetBinding = UIFormatters.getBindingForTimezone(oPropertyDataModelObjectPath, oPropertyBindingExpression);
    } else {
      oTargetBinding = CommonFormatters.getBindingWithTextArrangement(oPropertyDataModelObjectPath, oPropertyBindingExpression, fieldFormatOptions, customFormatter);
    }
    if (asObject) {
      return oTargetBinding;
    }
    // We don't include $$nopatch and parseKeepEmptyString as they make no sense in the text binding case
    return compileExpression(oTargetBinding);
  };
  _exports.getTextBinding = getTextBinding;
  const getValueBinding = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    let ignoreUnit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let ignoreFormatting = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    let bindingParameters = arguments.length > 4 ? arguments[4] : undefined;
    let targetTypeAny = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    let keepUnit = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    if (isPathAnnotationExpression(oPropertyDataModelObjectPath.targetObject) && oPropertyDataModelObjectPath.targetObject.$target) {
      const oNavPath = oPropertyDataModelObjectPath.targetEntityType.resolvePath(oPropertyDataModelObjectPath.targetObject.path, true);
      oPropertyDataModelObjectPath.targetObject = oNavPath.target;
      oNavPath.visitedObjects.forEach(oNavObj => {
        if (isNavigationProperty(oNavObj)) {
          oPropertyDataModelObjectPath.navigationProperties.push(oNavObj);
        }
      });
    }
    const targetObject = oPropertyDataModelObjectPath.targetObject;
    if (isProperty(targetObject)) {
      let oBindingExpression = pathInModel(getContextRelativeTargetObjectPath(oPropertyDataModelObjectPath));
      if (isPathInModelExpression(oBindingExpression)) {
        var _targetObject$annotat, _targetObject$annotat2, _targetObject$annotat3, _targetObject$annotat4, _targetObject$annotat5, _targetObject$annotat6, _oPropertyDataModelOb19, _oPropertyDataModelOb20;
        if ((_targetObject$annotat = targetObject.annotations) !== null && _targetObject$annotat !== void 0 && (_targetObject$annotat2 = _targetObject$annotat.Communication) !== null && _targetObject$annotat2 !== void 0 && _targetObject$annotat2.IsEmailAddress) {
          oBindingExpression.type = "sap.fe.core.type.Email";
        } else if (!ignoreUnit && ((_targetObject$annotat3 = targetObject.annotations) !== null && _targetObject$annotat3 !== void 0 && (_targetObject$annotat4 = _targetObject$annotat3.Measures) !== null && _targetObject$annotat4 !== void 0 && _targetObject$annotat4.ISOCurrency || (_targetObject$annotat5 = targetObject.annotations) !== null && _targetObject$annotat5 !== void 0 && (_targetObject$annotat6 = _targetObject$annotat5.Measures) !== null && _targetObject$annotat6 !== void 0 && _targetObject$annotat6.Unit)) {
          oBindingExpression = UIFormatters.getBindingWithUnitOrCurrency(oPropertyDataModelObjectPath, oBindingExpression, true, keepUnit ? undefined : {
            showMeasure: false
          });
        } else if ((_oPropertyDataModelOb19 = oPropertyDataModelObjectPath.targetObject.annotations) !== null && _oPropertyDataModelOb19 !== void 0 && (_oPropertyDataModelOb20 = _oPropertyDataModelOb19.Common) !== null && _oPropertyDataModelOb20 !== void 0 && _oPropertyDataModelOb20.IsTimezone) {
          oBindingExpression = UIFormatters.getBindingForTimezone(oPropertyDataModelObjectPath, oBindingExpression);
        } else {
          var _oPropertyDataModelOb21, _oPropertyDataModelOb22;
          const oTimezone = (_oPropertyDataModelOb21 = oPropertyDataModelObjectPath.targetObject.annotations) === null || _oPropertyDataModelOb21 === void 0 ? void 0 : (_oPropertyDataModelOb22 = _oPropertyDataModelOb21.Common) === null || _oPropertyDataModelOb22 === void 0 ? void 0 : _oPropertyDataModelOb22.Timezone;
          if (oTimezone) {
            oBindingExpression = UIFormatters.getBindingWithTimezone(oPropertyDataModelObjectPath, oBindingExpression, true);
          } else {
            oBindingExpression = formatWithTypeInformation(targetObject, oBindingExpression);
          }
        }
        if (isPathInModelExpression(oBindingExpression)) {
          if (ignoreFormatting) {
            delete oBindingExpression.formatOptions;
            delete oBindingExpression.constraints;
            delete oBindingExpression.type;
          }
          if (bindingParameters) {
            oBindingExpression.parameters = bindingParameters;
          }
          if (targetTypeAny) {
            oBindingExpression.targetType = "any";
          }
        }
        return compileExpression(oBindingExpression);
      } else {
        // if somehow we could not compile the binding -> return empty string
        return "";
      }
    } else if ((targetObject === null || targetObject === void 0 ? void 0 : targetObject.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || (targetObject === null || targetObject === void 0 ? void 0 : targetObject.$Type) === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
      return compileExpression(getExpressionFromAnnotation(targetObject.Value));
    } else {
      return "";
    }
  };
  _exports.getValueBinding = getValueBinding;
  const getAssociatedTextBinding = function (oPropertyDataModelObjectPath, fieldFormatOptions) {
    const textPropertyPath = PropertyHelper.getAssociatedTextPropertyPath(oPropertyDataModelObjectPath.targetObject);
    if (textPropertyPath) {
      const oTextPropertyPath = enhanceDataModelPath(oPropertyDataModelObjectPath, textPropertyPath);
      //BCP 2380120806: getValueBinding needs to be able to set formatOptions.parseKeepsEmptyString.
      //Otherwise emptying an input field that has a text annotation to a not nullable string would result in
      //an error message. Therefore import param 'ignoreFormatting' is now set to false.
      return getValueBinding(oTextPropertyPath, fieldFormatOptions, true, false, {
        $$noPatch: true
      });
    }
    return undefined;
  };
  _exports.getAssociatedTextBinding = getAssociatedTextBinding;
  const isUsedInNavigationWithQuickViewFacets = function (oDataModelPath, oProperty) {
    var _oDataModelPath$targe, _oDataModelPath$targe2, _oDataModelPath$targe3, _oDataModelPath$targe4, _oDataModelPath$conte;
    const aNavigationProperties = (oDataModelPath === null || oDataModelPath === void 0 ? void 0 : (_oDataModelPath$targe = oDataModelPath.targetEntityType) === null || _oDataModelPath$targe === void 0 ? void 0 : _oDataModelPath$targe.navigationProperties) || [];
    const aSemanticObjects = (oDataModelPath === null || oDataModelPath === void 0 ? void 0 : (_oDataModelPath$targe2 = oDataModelPath.targetEntityType) === null || _oDataModelPath$targe2 === void 0 ? void 0 : (_oDataModelPath$targe3 = _oDataModelPath$targe2.annotations) === null || _oDataModelPath$targe3 === void 0 ? void 0 : (_oDataModelPath$targe4 = _oDataModelPath$targe3.Common) === null || _oDataModelPath$targe4 === void 0 ? void 0 : _oDataModelPath$targe4.SemanticKey) || [];
    let bIsUsedInNavigationWithQuickViewFacets = false;
    aNavigationProperties.forEach(oNavProp => {
      if (oNavProp.referentialConstraint && oNavProp.referentialConstraint.length) {
        oNavProp.referentialConstraint.forEach(oRefConstraint => {
          if ((oRefConstraint === null || oRefConstraint === void 0 ? void 0 : oRefConstraint.sourceProperty) === oProperty.name) {
            var _oNavProp$targetType, _oNavProp$targetType$, _oNavProp$targetType$2;
            if (oNavProp !== null && oNavProp !== void 0 && (_oNavProp$targetType = oNavProp.targetType) !== null && _oNavProp$targetType !== void 0 && (_oNavProp$targetType$ = _oNavProp$targetType.annotations) !== null && _oNavProp$targetType$ !== void 0 && (_oNavProp$targetType$2 = _oNavProp$targetType$.UI) !== null && _oNavProp$targetType$2 !== void 0 && _oNavProp$targetType$2.QuickViewFacets) {
              bIsUsedInNavigationWithQuickViewFacets = true;
            }
          }
        });
      }
    });
    if (((_oDataModelPath$conte = oDataModelPath.contextLocation) === null || _oDataModelPath$conte === void 0 ? void 0 : _oDataModelPath$conte.targetEntitySet) !== oDataModelPath.targetEntitySet) {
      var _oDataModelPath$targe5, _oDataModelPath$targe6, _oDataModelPath$targe7;
      const aIsTargetSemanticKey = aSemanticObjects.some(function (oSemantic) {
        var _oSemantic$$target;
        return (oSemantic === null || oSemantic === void 0 ? void 0 : (_oSemantic$$target = oSemantic.$target) === null || _oSemantic$$target === void 0 ? void 0 : _oSemantic$$target.name) === oProperty.name;
      });
      if ((aIsTargetSemanticKey || oProperty.isKey) && oDataModelPath !== null && oDataModelPath !== void 0 && (_oDataModelPath$targe5 = oDataModelPath.targetEntityType) !== null && _oDataModelPath$targe5 !== void 0 && (_oDataModelPath$targe6 = _oDataModelPath$targe5.annotations) !== null && _oDataModelPath$targe6 !== void 0 && (_oDataModelPath$targe7 = _oDataModelPath$targe6.UI) !== null && _oDataModelPath$targe7 !== void 0 && _oDataModelPath$targe7.QuickViewFacets) {
        bIsUsedInNavigationWithQuickViewFacets = true;
      }
    }
    return bIsUsedInNavigationWithQuickViewFacets;
  };
  _exports.isUsedInNavigationWithQuickViewFacets = isUsedInNavigationWithQuickViewFacets;
  const isRetrieveTextFromValueListEnabled = function (oPropertyPath, fieldFormatOptions) {
    var _oProperty$annotation, _oProperty$annotation2, _oProperty$annotation3;
    const oProperty = isPathAnnotationExpression(oPropertyPath) && oPropertyPath.$target || oPropertyPath;
    if (!((_oProperty$annotation = oProperty.annotations) !== null && _oProperty$annotation !== void 0 && (_oProperty$annotation2 = _oProperty$annotation.Common) !== null && _oProperty$annotation2 !== void 0 && _oProperty$annotation2.Text) && !((_oProperty$annotation3 = oProperty.annotations) !== null && _oProperty$annotation3 !== void 0 && _oProperty$annotation3.Measures) && PropertyHelper.hasValueHelp(oProperty) && fieldFormatOptions.textAlignMode === "Form") {
      return true;
    }
    return false;
  };

  /**
   * Calculates text alignment based on the dataModelObjectPath.
   *
   * @param dataFieldModelPath The property's type
   * @param formatOptions The field format options
   * @param formatOptions.displayMode Display format
   * @param formatOptions.textAlignMode Text alignment of the field
   * @param computedEditMode The editMode used in this case
   * @param considerTextAnnotation Whether to consider the text annotation when computing the alignment
   * @returns The property alignment
   */
  _exports.isRetrieveTextFromValueListEnabled = isRetrieveTextFromValueListEnabled;
  const getTextAlignment = function (dataFieldModelPath, formatOptions, computedEditMode) {
    var _dataFieldModelPath$t, _dataFieldModelPath$t2, _dataFieldModelPath$t3, _dataFieldModelPath$t4, _dataFieldModelPath$t5, _dataFieldModelPath$t6;
    let considerTextAnnotation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    // check for the target value type directly, or in case it is pointing to a DataPoint we look at the dataPoint's value
    let typeForAlignment = ((_dataFieldModelPath$t = dataFieldModelPath.targetObject.Value) === null || _dataFieldModelPath$t === void 0 ? void 0 : _dataFieldModelPath$t.$target.type) || ((_dataFieldModelPath$t2 = dataFieldModelPath.targetObject.Target) === null || _dataFieldModelPath$t2 === void 0 ? void 0 : _dataFieldModelPath$t2.$target.Value.$target.type);
    if (PropertyHelper.isKey(((_dataFieldModelPath$t3 = dataFieldModelPath.targetObject.Value) === null || _dataFieldModelPath$t3 === void 0 ? void 0 : _dataFieldModelPath$t3.$target) || ((_dataFieldModelPath$t4 = dataFieldModelPath.targetObject.Target) === null || _dataFieldModelPath$t4 === void 0 ? void 0 : (_dataFieldModelPath$t5 = _dataFieldModelPath$t4.$target) === null || _dataFieldModelPath$t5 === void 0 ? void 0 : (_dataFieldModelPath$t6 = _dataFieldModelPath$t5.Value) === null || _dataFieldModelPath$t6 === void 0 ? void 0 : _dataFieldModelPath$t6.$target))) {
      return "Begin";
    }
    if (considerTextAnnotation && formatOptions.displayMode && ["Description", "DescriptionValue", "ValueDescription"].includes(formatOptions.displayMode)) {
      var _dataFieldModelPath$t7, _dataFieldModelPath$t8, _dataFieldModelPath$t9, _textAnnotation$annot, _textAnnotation$annot2;
      const textAnnotation = (_dataFieldModelPath$t7 = dataFieldModelPath.targetObject.Value) === null || _dataFieldModelPath$t7 === void 0 ? void 0 : (_dataFieldModelPath$t8 = _dataFieldModelPath$t7.$target.annotations) === null || _dataFieldModelPath$t8 === void 0 ? void 0 : (_dataFieldModelPath$t9 = _dataFieldModelPath$t8.Common) === null || _dataFieldModelPath$t9 === void 0 ? void 0 : _dataFieldModelPath$t9.Text;
      const textArrangementAnnotation = textAnnotation === null || textAnnotation === void 0 ? void 0 : (_textAnnotation$annot = textAnnotation.annotations) === null || _textAnnotation$annot === void 0 ? void 0 : (_textAnnotation$annot2 = _textAnnotation$annot.UI) === null || _textAnnotation$annot2 === void 0 ? void 0 : _textAnnotation$annot2.TextArrangement.valueOf();
      if (textAnnotation && textArrangementAnnotation !== "UI.TextArrangementType/TextSeparate") {
        typeForAlignment = textAnnotation.$target.type;
      }
    }
    return FieldHelper.getPropertyAlignment(typeForAlignment, formatOptions, computedEditMode);
  };

  /**
   * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
   *
   * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
   *
   * @param dataFieldModelPath The metapath referring to the annotation we are evaluating.
   * @param [formatOptions] FormatOptions optional.
   * @param formatOptions.isAnalytics This flag is set when using an analytical table.
   * @returns An expression that you can bind to the UI.
   */
  _exports.getTextAlignment = getTextAlignment;
  const getVisibleExpression = function (dataFieldModelPath, formatOptions) {
    const targetObject = dataFieldModelPath.targetObject;
    return compileExpression(generateVisibleExpression(targetObject, formatOptions));
  };

  /**
   * Returns the binding for a property in a QuickViewFacets.
   *
   * @param propertyDataModelObjectPath The DataModelObjectPath of the property
   * @returns A string of the value, or a BindingExpression
   */
  _exports.getVisibleExpression = getVisibleExpression;
  const getQuickViewBinding = function (propertyDataModelObjectPath) {
    if (!propertyDataModelObjectPath.targetObject) {
      return "";
    }
    if (typeof propertyDataModelObjectPath.targetObject === "string") {
      return propertyDataModelObjectPath.targetObject;
    }
    return getTextBinding(propertyDataModelObjectPath, {});
  };

  /**
   * Return the type of the QuickViewGroupElement.
   *
   * @param dataFieldDataModelObjectPath The DataModelObjectPath of the DataField
   * @returns The type of the QuickViewGroupElement
   */
  _exports.getQuickViewBinding = getQuickViewBinding;
  const getQuickViewType = function (dataFieldDataModelObjectPath) {
    var _targetObject$Value$$, _targetObject$Value$$2, _targetObject$Value$$3, _targetObject$annotat7, _targetObject$annotat8, _targetObject$Value$$4, _targetObject$Value$$5, _targetObject$Value$$6, _targetObject$annotat9, _targetObject$annotat10;
    const targetObject = dataFieldDataModelObjectPath.targetObject;
    if (targetObject !== null && targetObject !== void 0 && targetObject.Url && targetObject.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
      return "link";
    }
    if (targetObject !== null && targetObject !== void 0 && (_targetObject$Value$$ = targetObject.Value.$target) !== null && _targetObject$Value$$ !== void 0 && (_targetObject$Value$$2 = _targetObject$Value$$.annotations) !== null && _targetObject$Value$$2 !== void 0 && (_targetObject$Value$$3 = _targetObject$Value$$2.Communication) !== null && _targetObject$Value$$3 !== void 0 && _targetObject$Value$$3.IsEmailAddress || (_targetObject$annotat7 = targetObject.annotations) !== null && _targetObject$annotat7 !== void 0 && (_targetObject$annotat8 = _targetObject$annotat7.Communication) !== null && _targetObject$annotat8 !== void 0 && _targetObject$annotat8.IsEmailAddress) {
      return "email";
    }
    if (targetObject !== null && targetObject !== void 0 && (_targetObject$Value$$4 = targetObject.Value.$target) !== null && _targetObject$Value$$4 !== void 0 && (_targetObject$Value$$5 = _targetObject$Value$$4.annotations) !== null && _targetObject$Value$$5 !== void 0 && (_targetObject$Value$$6 = _targetObject$Value$$5.Communication) !== null && _targetObject$Value$$6 !== void 0 && _targetObject$Value$$6.IsPhoneNumber || (_targetObject$annotat9 = targetObject.annotations) !== null && _targetObject$annotat9 !== void 0 && (_targetObject$annotat10 = _targetObject$annotat9.Communication) !== null && _targetObject$annotat10 !== void 0 && _targetObject$annotat10.IsPhoneNumber) {
      return "phone";
    }
    return "text";
  };
  _exports.getQuickViewType = getQuickViewType;
  /**
   * Get the customData key value pair of SemanticObjects.
   *
   * @param propertyAnnotations The value of the Common annotation.
   * @param [dynamicSemanticObjectsOnly] Flag for retrieving dynamic Semantic Objects only.
   * @returns The array of the semantic Objects.
   */
  const getSemanticObjectExpressionToResolve = function (propertyAnnotations, dynamicSemanticObjectsOnly) {
    const aSemObjExprToResolve = [];
    let sSemObjExpression;
    let annotation;
    if (propertyAnnotations) {
      const semanticObjectsKeys = Object.keys(propertyAnnotations).filter(function (element) {
        return element === "SemanticObject" || element.startsWith("SemanticObject#");
      });
      for (const semanticObject of semanticObjectsKeys) {
        annotation = propertyAnnotations[semanticObject];
        sSemObjExpression = compileExpression(getExpressionFromAnnotation(annotation));
        if (!dynamicSemanticObjectsOnly || dynamicSemanticObjectsOnly && isPathAnnotationExpression(annotation)) {
          aSemObjExprToResolve.push({
            key: getDynamicPathFromSemanticObject(sSemObjExpression) || sSemObjExpression,
            value: sSemObjExpression
          });
        }
      }
    }
    return aSemObjExprToResolve;
  };
  _exports.getSemanticObjectExpressionToResolve = getSemanticObjectExpressionToResolve;
  const getSemanticObjects = function (aSemObjExprToResolve) {
    if (aSemObjExprToResolve.length > 0) {
      let sCustomDataKey = "";
      let sCustomDataValue = "";
      const aSemObjCustomData = [];
      for (let iSemObjCount = 0; iSemObjCount < aSemObjExprToResolve.length; iSemObjCount++) {
        sCustomDataKey = aSemObjExprToResolve[iSemObjCount].key;
        sCustomDataValue = compileExpression(getExpressionFromAnnotation(aSemObjExprToResolve[iSemObjCount].value));
        aSemObjCustomData.push({
          key: sCustomDataKey,
          value: sCustomDataValue
        });
      }
      const oSemanticObjectsModel = new JSONModel(aSemObjCustomData);
      oSemanticObjectsModel.$$valueAsPromise = true;
      const oSemObjBindingContext = oSemanticObjectsModel.createBindingContext("/");
      return oSemObjBindingContext;
    } else {
      return new JSONModel([]).createBindingContext("/");
    }
  };

  /**
   * Method to get MultipleLines for a DataField.
   *
   * @name getMultipleLinesForDataField
   * @param {any} oThis The current object
   * @param {string} sPropertyType The property type
   * @param {boolean} isMultiLineText The property isMultiLineText
   * @returns {CompiledBindingToolkitExpression<string>} The binding expression to determine if a data field should be a MultiLineText or not
   * @public
   */
  _exports.getSemanticObjects = getSemanticObjects;
  const getMultipleLinesForDataField = function (oThis, sPropertyType, isMultiLineText) {
    if (oThis.wrap === false) {
      return false;
    }
    if (sPropertyType !== "Edm.String") {
      return isMultiLineText;
    }
    if (oThis.editMode === "Display") {
      return true;
    }
    if (oThis.editMode.indexOf("{") > -1) {
      // If the editMode is computed then we just care about the page editMode to determine if the multiline property should be taken into account
      return compileExpression(or(not(UI.IsEditable), isMultiLineText));
    }
    return isMultiLineText;
  };
  _exports.getMultipleLinesForDataField = getMultipleLinesForDataField;
  const _hasValueHelpToShow = function (oProperty, measureDisplayMode) {
    // we show a value help if teh property has one or if its visible unit has one
    const oPropertyUnit = PropertyHelper.getAssociatedUnitProperty(oProperty);
    const oPropertyCurrency = PropertyHelper.getAssociatedCurrencyProperty(oProperty);
    return PropertyHelper.hasValueHelp(oProperty) && oProperty.type !== "Edm.Boolean" || measureDisplayMode !== "Hidden" && (oPropertyUnit && PropertyHelper.hasValueHelp(oPropertyUnit) || oPropertyCurrency && PropertyHelper.hasValueHelp(oPropertyCurrency));
  };

  /**
   * Sets Edit Style properties for Field in case of Macro Field and MassEditDialog fields.
   *
   * @param oProps Field Properties for the Macro Field.
   * @param oDataField DataField Object.
   * @param oDataModelPath DataModel Object Path to the property.
   * @param onlyEditStyle To add only editStyle.
   */
  const setEditStyleProperties = function (oProps, oDataField, oDataModelPath, onlyEditStyle) {
    var _oDataField$Target, _oProps$formatOptions, _oProps$formatOptions2, _oProperty$annotation4, _oProperty$annotation5, _oProperty$annotation6, _oProperty$annotation7, _oProperty$annotation8, _oProperty$annotation9, _oProperty$annotation10, _oProperty$annotation11, _oProperty$annotation12;
    const oProperty = oDataModelPath.targetObject;
    if (!isProperty(oProperty) || ["com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"].includes(oDataField.$Type)) {
      oProps.editStyle = null;
      return;
    }
    if (!onlyEditStyle) {
      var _oDataField$annotatio, _oDataField$annotatio2, _oDataField$Value, _oDataField$Value$$ta, _oDataField$Value$$ta2, _oDataField$Value$$ta3;
      oProps.valueBindingExpression = getValueBinding(oDataModelPath, oProps.formatOptions);
      const editStylePlaceholder = ((_oDataField$annotatio = oDataField.annotations) === null || _oDataField$annotatio === void 0 ? void 0 : (_oDataField$annotatio2 = _oDataField$annotatio.UI) === null || _oDataField$annotatio2 === void 0 ? void 0 : _oDataField$annotatio2.Placeholder) || ((_oDataField$Value = oDataField.Value) === null || _oDataField$Value === void 0 ? void 0 : (_oDataField$Value$$ta = _oDataField$Value.$target) === null || _oDataField$Value$$ta === void 0 ? void 0 : (_oDataField$Value$$ta2 = _oDataField$Value$$ta.annotations) === null || _oDataField$Value$$ta2 === void 0 ? void 0 : (_oDataField$Value$$ta3 = _oDataField$Value$$ta2.UI) === null || _oDataField$Value$$ta3 === void 0 ? void 0 : _oDataField$Value$$ta3.Placeholder);
      if (editStylePlaceholder) {
        oProps.editStylePlaceholder = compileExpression(getExpressionFromAnnotation(editStylePlaceholder));
      }
    }

    // Setup RatingIndicator
    const dataPointAnnotation = isDataFieldForAnnotation(oDataField) ? (_oDataField$Target = oDataField.Target) === null || _oDataField$Target === void 0 ? void 0 : _oDataField$Target.$target : oDataField;
    if ((dataPointAnnotation === null || dataPointAnnotation === void 0 ? void 0 : dataPointAnnotation.Visualization) === "UI.VisualizationType/Rating") {
      var _dataPointAnnotation$, _dataPointAnnotation$2;
      oProps.editStyle = "RatingIndicator";
      if ((_dataPointAnnotation$ = dataPointAnnotation.annotations) !== null && _dataPointAnnotation$ !== void 0 && (_dataPointAnnotation$2 = _dataPointAnnotation$.Common) !== null && _dataPointAnnotation$2 !== void 0 && _dataPointAnnotation$2.QuickInfo) {
        var _dataPointAnnotation$3, _dataPointAnnotation$4;
        oProps.ratingIndicatorTooltip = compileExpression(getExpressionFromAnnotation((_dataPointAnnotation$3 = dataPointAnnotation.annotations) === null || _dataPointAnnotation$3 === void 0 ? void 0 : (_dataPointAnnotation$4 = _dataPointAnnotation$3.Common) === null || _dataPointAnnotation$4 === void 0 ? void 0 : _dataPointAnnotation$4.QuickInfo));
      }
      oProps.ratingIndicatorTargetValue = compileExpression(getExpressionFromAnnotation(dataPointAnnotation.TargetValue));
      return;
    }
    if (_hasValueHelpToShow(oProperty, (_oProps$formatOptions = oProps.formatOptions) === null || _oProps$formatOptions === void 0 ? void 0 : _oProps$formatOptions.measureDisplayMode) || ((_oProps$formatOptions2 = oProps.formatOptions) === null || _oProps$formatOptions2 === void 0 ? void 0 : _oProps$formatOptions2.measureDisplayMode) !== "Hidden" && ((_oProperty$annotation4 = oProperty.annotations) !== null && _oProperty$annotation4 !== void 0 && (_oProperty$annotation5 = _oProperty$annotation4.Measures) !== null && _oProperty$annotation5 !== void 0 && _oProperty$annotation5.ISOCurrency || (_oProperty$annotation6 = oProperty.annotations) !== null && _oProperty$annotation6 !== void 0 && (_oProperty$annotation7 = _oProperty$annotation6.Measures) !== null && _oProperty$annotation7 !== void 0 && _oProperty$annotation7.Unit)) {
      if (!onlyEditStyle) {
        var _oProps$formatOptions3;
        oProps.textBindingExpression = getAssociatedTextBinding(oDataModelPath, oProps.formatOptions);
        if (((_oProps$formatOptions3 = oProps.formatOptions) === null || _oProps$formatOptions3 === void 0 ? void 0 : _oProps$formatOptions3.measureDisplayMode) !== "Hidden") {
          // for the MDC Field we need to keep the unit inside the valueBindingExpression
          oProps.valueBindingExpression = getValueBinding(oDataModelPath, oProps.formatOptions, false, false, undefined, false, true);
        }
      }
      oProps.editStyle = "InputWithValueHelp";
      return;
    }
    switch (oProperty.type) {
      case "Edm.Date":
        oProps.editStyle = "DatePicker";
        return;
      case "Edm.Time":
      case "Edm.TimeOfDay":
        oProps.editStyle = "TimePicker";
        return;
      case "Edm.DateTime":
      case "Edm.DateTimeOffset":
        oProps.editStyle = "DateTimePicker";
        // No timezone defined. Also for compatibility reasons.
        if (!((_oProperty$annotation8 = oProperty.annotations) !== null && _oProperty$annotation8 !== void 0 && (_oProperty$annotation9 = _oProperty$annotation8.Common) !== null && _oProperty$annotation9 !== void 0 && _oProperty$annotation9.Timezone)) {
          oProps.showTimezone = undefined;
        } else {
          oProps.showTimezone = true;
        }
        return;
      case "Edm.Boolean":
        oProps.editStyle = "CheckBox";
        return;
      case "Edm.Stream":
        oProps.editStyle = "File";
        return;
      case "Edm.String":
        if ((_oProperty$annotation10 = oProperty.annotations) !== null && _oProperty$annotation10 !== void 0 && (_oProperty$annotation11 = _oProperty$annotation10.UI) !== null && _oProperty$annotation11 !== void 0 && (_oProperty$annotation12 = _oProperty$annotation11.MultiLineText) !== null && _oProperty$annotation12 !== void 0 && _oProperty$annotation12.valueOf()) {
          oProps.editStyle = "TextArea";
          return;
        }
        break;
      default:
        oProps.editStyle = "Input";
    }
    oProps.editStyle = "Input";
  };
  _exports.setEditStyleProperties = setEditStyleProperties;
  const hasSemanticObjectInNavigationOrProperty = propertyDataModelObjectPath => {
    var _propertyDataModelObj, _propertyDataModelObj2, _propertyDataModelObj3, _propertyDataModelObj4;
    const property = propertyDataModelObjectPath.targetObject;
    if (SemanticObjectHelper.hasSemanticObject(property)) {
      return true;
    }
    const lastNavProp = propertyDataModelObjectPath !== null && propertyDataModelObjectPath !== void 0 && (_propertyDataModelObj = propertyDataModelObjectPath.navigationProperties) !== null && _propertyDataModelObj !== void 0 && _propertyDataModelObj.length ? propertyDataModelObjectPath === null || propertyDataModelObjectPath === void 0 ? void 0 : propertyDataModelObjectPath.navigationProperties[(propertyDataModelObjectPath === null || propertyDataModelObjectPath === void 0 ? void 0 : (_propertyDataModelObj2 = propertyDataModelObjectPath.navigationProperties) === null || _propertyDataModelObj2 === void 0 ? void 0 : _propertyDataModelObj2.length) - 1] : null;
    if (!lastNavProp || (_propertyDataModelObj3 = propertyDataModelObjectPath.contextLocation) !== null && _propertyDataModelObj3 !== void 0 && (_propertyDataModelObj4 = _propertyDataModelObj3.navigationProperties) !== null && _propertyDataModelObj4 !== void 0 && _propertyDataModelObj4.find(contextNavProp => contextNavProp.name === lastNavProp.name)) {
      return false;
    }
    return SemanticObjectHelper.hasSemanticObject(lastNavProp);
  };

  /**
   * Get the dataModelObjectPath with the value property as targetObject if it exists
   * for a dataModelObjectPath targeting a DataField or a DataPoint annotation.
   *
   * @param initialDataModelObjectPath
   * @returns The dataModelObjectPath targetiing the value property or undefined
   */
  _exports.hasSemanticObjectInNavigationOrProperty = hasSemanticObjectInNavigationOrProperty;
  const getDataModelObjectPathForValue = initialDataModelObjectPath => {
    if (!initialDataModelObjectPath.targetObject) {
      return undefined;
    }
    let valuePath = "";
    // data point annotations need not have $Type defined, so add it if missing
    if (initialDataModelObjectPath.targetObject.term === "com.sap.vocabularies.UI.v1.DataPoint") {
      initialDataModelObjectPath.targetObject.$Type = initialDataModelObjectPath.targetObject.$Type || "com.sap.vocabularies.UI.v1.DataPointType";
    }
    switch (initialDataModelObjectPath.targetObject.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataPointType":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        if (typeof initialDataModelObjectPath.targetObject.Value === "object") {
          valuePath = initialDataModelObjectPath.targetObject.Value.path;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        if (initialDataModelObjectPath.targetObject.Target.$target) {
          if (initialDataModelObjectPath.targetObject.Target.$target.$Type === "com.sap.vocabularies.UI.v1.DataField" || initialDataModelObjectPath.targetObject.Target.$target.$Type === "com.sap.vocabularies.UI.v1.DataPointType") {
            if (initialDataModelObjectPath.targetObject.Target.value.indexOf("/") > 0) {
              var _initialDataModelObje;
              valuePath = initialDataModelObjectPath.targetObject.Target.value.replace(/\/@.*/, `/${(_initialDataModelObje = initialDataModelObjectPath.targetObject.Target.$target.Value) === null || _initialDataModelObje === void 0 ? void 0 : _initialDataModelObje.path}`);
            } else {
              var _initialDataModelObje2;
              valuePath = (_initialDataModelObje2 = initialDataModelObjectPath.targetObject.Target.$target.Value) === null || _initialDataModelObje2 === void 0 ? void 0 : _initialDataModelObje2.path;
            }
          } else {
            var _initialDataModelObje3;
            valuePath = (_initialDataModelObje3 = initialDataModelObjectPath.targetObject.Target) === null || _initialDataModelObje3 === void 0 ? void 0 : _initialDataModelObje3.path;
          }
        }
        break;
    }
    if (valuePath && valuePath.length > 0) {
      return enhanceDataModelPath(initialDataModelObjectPath, valuePath);
    } else {
      return undefined;
    }
  };

  /**
   * Get the property or the navigation property in  its relative path that holds semanticObject annotation if it exists.
   *
   * @param dataModelObjectPath
   * @returns A property or a NavProperty or undefined
   */
  _exports.getDataModelObjectPathForValue = getDataModelObjectPathForValue;
  const getPropertyWithSemanticObject = dataModelObjectPath => {
    let propertyWithSemanticObject;
    if (hasSemanticObject(dataModelObjectPath.targetObject)) {
      propertyWithSemanticObject = dataModelObjectPath.targetObject;
    } else if (dataModelObjectPath.navigationProperties.length > 0) {
      // there are no semantic objects on the property itself so we look for some on nav properties
      for (const navProperty of dataModelObjectPath.navigationProperties) {
        var _dataModelObjectPath$;
        if (!((_dataModelObjectPath$ = dataModelObjectPath.contextLocation) !== null && _dataModelObjectPath$ !== void 0 && _dataModelObjectPath$.navigationProperties.find(contextNavProp => contextNavProp.fullyQualifiedName === navProperty.fullyQualifiedName)) && !propertyWithSemanticObject && hasSemanticObject(navProperty)) {
          propertyWithSemanticObject = navProperty;
        }
      }
    }
    return propertyWithSemanticObject;
  };

  /**
   * Check if the considered property is a non-insertable property
   * A first check is done on the last navigation from the contextLocation:
   * 	- If the annotation 'nonInsertableProperty' is found and the property is listed, then the property is non-insertable,
   *  - Else the same check is done on the target entity.
   *
   * @param propertyDataModelObjectPath
   * @returns True if the property is not insertable
   */
  _exports.getPropertyWithSemanticObject = getPropertyWithSemanticObject;
  const hasPropertyInsertRestrictions = propertyDataModelObjectPath => {
    const nonInsertableProperties = getContextPropertyRestriction(propertyDataModelObjectPath, capabilities => {
      var _InsertRestrictions;
      return capabilities === null || capabilities === void 0 ? void 0 : (_InsertRestrictions = capabilities.InsertRestrictions) === null || _InsertRestrictions === void 0 ? void 0 : _InsertRestrictions.NonInsertableProperties;
    });
    return nonInsertableProperties.some(nonInsertableProperty => {
      var _nonInsertablePropert, _propertyDataModelObj5;
      return (nonInsertableProperty === null || nonInsertableProperty === void 0 ? void 0 : (_nonInsertablePropert = nonInsertableProperty.$target) === null || _nonInsertablePropert === void 0 ? void 0 : _nonInsertablePropert.fullyQualifiedName) === ((_propertyDataModelObj5 = propertyDataModelObjectPath.targetObject) === null || _propertyDataModelObj5 === void 0 ? void 0 : _propertyDataModelObj5.fullyQualifiedName);
    });
  };

  /**
   * Get the binding for the draft indicator visibility.
   *
   * @param draftIndicatorKey
   * @returns  The visibility binding expression.
   */
  _exports.hasPropertyInsertRestrictions = hasPropertyInsertRestrictions;
  const getDraftIndicatorVisibleBinding = draftIndicatorKey => {
    return draftIndicatorKey ? compileExpression(formatResult([constant(draftIndicatorKey), pathInModel("semanticKeyHasDraftIndicator", "internal"), pathInModel("HasDraftEntity"), pathInModel("IsActiveEntity"), pathInModel("hideDraftInfo", "pageInternal")], "sap.fe.macros.field.FieldRuntime.isDraftIndicatorVisible")) : "false";
  };
  _exports.getDraftIndicatorVisibleBinding = getDraftIndicatorVisibleBinding;
  return _exports;
}, false);
