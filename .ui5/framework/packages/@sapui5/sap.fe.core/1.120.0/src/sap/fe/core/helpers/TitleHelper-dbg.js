/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataFieldFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters"], function (valueFormatters, BindingHelper, BindingToolkit, TypeGuards, DataFieldFormatters, DataModelPathHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var getLabelForConnectedFields = DataFieldFormatters.getLabelForConnectedFields;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var transformRecursively = BindingToolkit.transformRecursively;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isUndefinedExpression = BindingToolkit.isUndefinedExpression;
  var isEmpty = BindingToolkit.isEmpty;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var concat = BindingToolkit.concat;
  var compileExpression = BindingToolkit.compileExpression;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
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

  /**
   * Get property definition from data model object path.
   *
   * @param propertyDataModelObject The property data model object
   * @returns The property
   */
  _exports.formatValueRecursively = formatValueRecursively;
  const getPropertyDefinition = propertyDataModelObject => {
    const propertyPathOrProperty = propertyDataModelObject.targetObject;
    return isPropertyPathExpression(propertyPathOrProperty) ? propertyPathOrProperty.$target : propertyPathOrProperty;
  };

  /**
   * Checks whether an associated active entity exists.
   *
   * @param fullContextPath The full path to the context
   * @returns The expression-binding string
   */
  const isOrHasActiveEntity = fullContextPath => {
    var _fullContextPath$targ, _fullContextPath$targ2, _fullContextPath$targ3, _fullContextPath$targ4, _fullContextPath$targ5, _fullContextPath$targ6;
    const draftRoot = (_fullContextPath$targ = fullContextPath.targetEntitySet) === null || _fullContextPath$targ === void 0 ? void 0 : (_fullContextPath$targ2 = _fullContextPath$targ.annotations) === null || _fullContextPath$targ2 === void 0 ? void 0 : (_fullContextPath$targ3 = _fullContextPath$targ2.Common) === null || _fullContextPath$targ3 === void 0 ? void 0 : _fullContextPath$targ3.DraftRoot;
    const draftNode = (_fullContextPath$targ4 = fullContextPath.targetEntitySet) === null || _fullContextPath$targ4 === void 0 ? void 0 : (_fullContextPath$targ5 = _fullContextPath$targ4.annotations) === null || _fullContextPath$targ5 === void 0 ? void 0 : (_fullContextPath$targ6 = _fullContextPath$targ5.Common) === null || _fullContextPath$targ6 === void 0 ? void 0 : _fullContextPath$targ6.DraftNode;
    if (!!draftRoot || !!draftNode) {
      return not(Draft.IsNewObject);
    }
    return false;
  };

  /**
   * Checks if title value expression is empty.
   *
   * @param titleValueExpression The title value expression
   * @returns The expression-binding string
   */
  const isTitleEmptyBooleanExpression = titleValueExpression => titleValueExpression._type === "Constant" ? constant(!titleValueExpression.value) : isEmpty(titleValueExpression);

  /**
   * Retrieves the title expression binding.
   *
   * @param propertyDataModelPath The full path to the property context
   * @param propertyBindingExpression The binding expression of the property above
   * @param [fieldFormatOptions] The format options of the field
   * @param fieldFormatOptions.displayMode
   * @returns The expression-binding parameters
   */
  const getTitleBindingWithTextArrangement = function (propertyDataModelPath, propertyBindingExpression, formatOptions) {
    var _propertyDefinition$a, _propertyDefinition$a2, _commonText$annotatio, _commonText$annotatio2;
    const targetDisplayModeOverride = formatOptions === null || formatOptions === void 0 ? void 0 : formatOptions.displayMode;
    const propertyDefinition = getPropertyDefinition(propertyDataModelPath);
    const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
    const commonText = propertyDefinition === null || propertyDefinition === void 0 ? void 0 : (_propertyDefinition$a = propertyDefinition.annotations) === null || _propertyDefinition$a === void 0 ? void 0 : (_propertyDefinition$a2 = _propertyDefinition$a.Common) === null || _propertyDefinition$a2 === void 0 ? void 0 : _propertyDefinition$a2.Text;
    const relativeLocation = getRelativePaths(propertyDataModelPath);
    if (propertyDefinition) {
      propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
    }
    let params = [propertyBindingExpression];
    if (targetDisplayMode !== "Value" && commonText) {
      switch (targetDisplayMode) {
        case "Description":
          params = [getExpressionFromAnnotation(commonText, relativeLocation)];
          break;
        case "DescriptionValue":
          const targetExpression = (formatOptions === null || formatOptions === void 0 ? void 0 : formatOptions.splitTitleOnTwoLines) === undefined ? ifElse(!!((_commonText$annotatio = commonText.annotations) !== null && _commonText$annotatio !== void 0 && (_commonText$annotatio2 = _commonText$annotatio.UI) !== null && _commonText$annotatio2 !== void 0 && _commonText$annotatio2.TextArrangement), propertyBindingExpression, constant("")) : ifElse(!!(formatOptions !== null && formatOptions !== void 0 && formatOptions.splitTitleOnTwoLines), constant(""), getExpressionFromAnnotation(commonText, relativeLocation));
          params = [getExpressionFromAnnotation(commonText, relativeLocation), targetExpression];
          break;
        case "ValueDescription":
          params = [propertyBindingExpression, ifElse(!!(formatOptions !== null && formatOptions !== void 0 && formatOptions.splitTitleOnTwoLines), constant(""), getExpressionFromAnnotation(commonText, relativeLocation))];
          break;
      }
    }
    return params;
  };

  /**
   * Recursively add the text arrangement to a title binding expression.
   *
   * @param bindingExpressionToEnhance The binding expression to be enhanced
   * @param path The data field data model object path
   * @returns An updated expression containing the text arrangement binding parameters
   */
  const addTextArrangementToTitleBindingExpression = function (bindingExpressionToEnhance, path) {
    return transformRecursively(bindingExpressionToEnhance, "PathInModel", expression => {
      if (expression.modelName !== undefined) return expression;
      // In case of default model we then need to resolve the text arrangement property
      const propertyDataModelPath = enhanceDataModelPath(path, expression.path);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getTitleBindingWithTextArrangement(propertyDataModelPath, expression);
    });
  };

  /**
   * Gets binding expression for create mode title.
   *
   * @param viewData The associated view data
   * @param [typeName] The type name from the object page header info
   * @param typeName.TypeName
   * @returns The expression-binding string
   */
  const getCreateModeTitle = function (viewData, _ref) {
    let {
      TypeName: typeName
    } = _ref;
    const titleNoHeaderInfo = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
    let createModeTitle = titleNoHeaderInfo;
    if (viewData.resourceModel.getText("T_NEW_OBJECT", undefined, viewData.entitySet) === viewData.resourceModel.getText("T_NEW_OBJECT_DEFAULT", undefined, viewData.entitySet)) {
      //T_NEW_OBJECT has not been customized
      const titleWithHeaderInfo = viewData.resourceModel.getText("T_ANNOTATION_HELPER_DEFAULT_OBJECT_PAGE_HEADER_TITLE", undefined, viewData.entitySet);
      createModeTitle = typeName ? concat(titleWithHeaderInfo, ": ", resolveBindingString(typeName.toString())) : titleNoHeaderInfo;
    }
    return formatResult([createModeTitle], valueFormatters.formatTitle);
  };

  /**
   * Checks whether an empty string should be used.
   *
   * @param path The meta path pointing to the property used for the title
   * @returns The expression-binding string
   */
  const shouldForceEmptyString = path => {
    var _propertyDefinition$a3, _propertyDefinition$a4;
    const propertyDefinition = getPropertyDefinition(path);
    if (propertyDefinition && (_propertyDefinition$a3 = propertyDefinition.annotations) !== null && _propertyDefinition$a3 !== void 0 && (_propertyDefinition$a4 = _propertyDefinition$a3.Core) !== null && _propertyDefinition$a4 !== void 0 && _propertyDefinition$a4.Computed) {
      return UI.IsInactive;
    } else {
      return constant(false);
    }
  };

  /**
   * Gets title value expression from object page header info.
   *
   * @param fullContextPath The full path to the context
   * @param headerInfoTitle The title value from the object page header info
   * @param getTextBindingExpression The function to get the text binding expression
   * @returns The expression-binding string
   */
  const getTitleValueExpressionFromHeaderInfo = function (fullContextPath, headerInfoTitle, getTextBindingExpression) {
    var _headerInfoTitle$Targ;
    let titleValueExpression;
    if (headerInfoTitle.$Type === "com.sap.vocabularies.UI.v1.DataField") {
      var _Value, _Value$$target, _Value$$target$annota, _Value$$target$annota2, _Value$$target$annota3, _Value$$target$annota4;
      titleValueExpression = getExpressionFromAnnotation(headerInfoTitle.Value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((_Value = headerInfoTitle.Value) !== null && _Value !== void 0 && (_Value$$target = _Value.$target) !== null && _Value$$target !== void 0 && (_Value$$target$annota = _Value$$target.annotations.Common) !== null && _Value$$target$annota !== void 0 && (_Value$$target$annota2 = _Value$$target$annota.Text) !== null && _Value$$target$annota2 !== void 0 && (_Value$$target$annota3 = _Value$$target$annota2.annotations) !== null && _Value$$target$annota3 !== void 0 && (_Value$$target$annota4 = _Value$$target$annota3.UI) !== null && _Value$$target$annota4 !== void 0 && _Value$$target$annota4.TextArrangement) {
        // In case an explicit text arrangement was set we make use of it in the description as well
        titleValueExpression = addTextArrangementToTitleBindingExpression(titleValueExpression, fullContextPath);
      }
      titleValueExpression = formatValueRecursively(titleValueExpression, fullContextPath);
    }
    if (headerInfoTitle.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && ((_headerInfoTitle$Targ = headerInfoTitle.Target.$target) === null || _headerInfoTitle$Targ === void 0 ? void 0 : _headerInfoTitle$Targ.$Type) === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
      const connectedFieldsPath = enhanceDataModelPath(fullContextPath, "$Type/@UI.HeaderInfo/Title/Target/$AnnotationPath");
      titleValueExpression = getLabelForConnectedFields(connectedFieldsPath, getTextBindingExpression, false);
    }
    return titleValueExpression;
  };

  /**
   * Creates binding expression for Object Page, List Report, Quick View and other titles.
   *
   * @param path The data model object path
   * @param getTextBindingExpression The function to get the text binding expression
   * @param [fieldFormatOptions] The format options of the field
   * @param fieldFormatOptions.displayMode
   * @param [headerInfo] The object page header info
   * @param [viewData] The associated view data
   * @returns The compiled expression-binding string
   */
  const getTitleBindingExpression = function (path, getTextBindingExpression, formatOptions, headerInfo, viewData, customFormatter) {
    var _headerInfo$Title;
    const formatter = customFormatter || valueFormatters.formatTitle;
    let createModeTitle = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
    let titleValueExpression;
    let isHeaderInfoTitleEmpty = false;
    // If we have a headerInfo but no title, or empty title we need to display an empty string when we are on an active object
    // received header info for object page
    if (headerInfo !== null && headerInfo !== void 0 && (_headerInfo$Title = headerInfo.Title) !== null && _headerInfo$Title !== void 0 && _headerInfo$Title.$Type && viewData) {
      titleValueExpression = getTitleValueExpressionFromHeaderInfo(path, headerInfo.Title, getTextBindingExpression);
      createModeTitle = getCreateModeTitle(viewData, headerInfo);
      if (isConstant(titleValueExpression) && titleValueExpression.value === "") {
        isHeaderInfoTitleEmpty = true;
      }
    } else if (headerInfo && (headerInfo.Title === undefined || headerInfo.Title.toString() === "")) {
      isHeaderInfoTitleEmpty = true;
    }
    if (titleValueExpression && isConstant(titleValueExpression)) {
      return compileExpression(titleValueExpression);
    }

    // needed for quickview
    if (isPathAnnotationExpression(path.targetObject)) {
      path = enhanceDataModelPath(path, path.targetObject.path);
    }
    const propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(path));
    let params;
    if (titleValueExpression) {
      params = Array.isArray(titleValueExpression) ? titleValueExpression : [titleValueExpression];
    } else {
      params = getTitleBindingWithTextArrangement(path, propertyBindingExpression, formatOptions);
    }
    const isTitleEmpty = isTitleEmptyBooleanExpression(params[0]);
    const forceEmptyString = shouldForceEmptyString(path);
    const formattedExpression = formatResult(params, formatter);
    titleValueExpression = ifElse(isTitleEmpty, ifElse(or(isHeaderInfoTitleEmpty && isOrHasActiveEntity(path), forceEmptyString), "", ifElse(isUndefinedExpression(constant(customFormatter)), ifElse(or(UI.IsCreateMode, not(isOrHasActiveEntity(path))), createModeTitle, pathInModel("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO", "sap.fe.i18n")), ifElse(not(isOrHasActiveEntity(path)), viewData === null || viewData === void 0 ? void 0 : viewData.resourceModel.getText("T_NEW_OBJECT"), viewData === null || viewData === void 0 ? void 0 : viewData.resourceModel.getText("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO")))), formattedExpression);
    return compileExpression(titleValueExpression);
  };
  _exports.getTitleBindingExpression = getTitleBindingExpression;
  return _exports;
}, false);
