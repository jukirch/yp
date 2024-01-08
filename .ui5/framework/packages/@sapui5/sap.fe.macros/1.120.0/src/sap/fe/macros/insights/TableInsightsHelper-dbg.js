/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TitleHelper", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/field/FieldTemplating", "sap/ui/mdc/p13n/StateUtil", "./CommonInsightsHelper"], function (CommonUtils, MetaModelConverter, DataField, BindingToolkit, TitleHelper, CriticalityFormatters, PropertyHelper, FieldTemplating, StateUtil, CommonInsightsHelper) {
  "use strict";

  var _exports = {};
  var createInsightsParams = CommonInsightsHelper.createInsightsParams;
  var getTextBinding = FieldTemplating.getTextBinding;
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var isImageURL = PropertyHelper.isImageURL;
  var hasSemanticObject = PropertyHelper.hasSemanticObject;
  var buildExpressionForCriticalityIcon = CriticalityFormatters.buildExpressionForCriticalityIcon;
  var buildExpressionForCriticalityColor = CriticalityFormatters.buildExpressionForCriticalityColor;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var concat = BindingToolkit.concat;
  var compileExpression = BindingToolkit.compileExpression;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  function getUomBinding(propertyTargetObject, property) {
    var _propertyTargetObject, _propertyTargetObject2;
    const uom = ((_propertyTargetObject = propertyTargetObject.annotations.Measures) === null || _propertyTargetObject === void 0 ? void 0 : _propertyTargetObject.ISOCurrency) || ((_propertyTargetObject2 = propertyTargetObject.annotations.Measures) === null || _propertyTargetObject2 === void 0 ? void 0 : _propertyTargetObject2.Unit);
    if (!uom) {
      return;
    } else {
      const propertyBinding = pathInModel(property);
      return compileExpression(concat(propertyBinding, " ", getExpressionFromAnnotation(uom)));
    }
  }
  /**
   * Check if the given TableColumn is an AnnotationTableColumn.
   *
   * @param column Column that is to be checked
   * @returns True of it is an AnnotationTableColumn
   */
  function isAnnotationTableColumn(column) {
    return "annotationPath" in column;
  }

  /**
   * Get all columns that are supported with SAP Insights.
   * The current implementation does not support columns with image urls and columns with multiple values, therefore, they are removed here.
   *
   * @param columns
   * @param table
   * @param metaData
   * @returns An array containing all supported columns.
   */
  function getSupportedColumns(columns, table, metaData) {
    return table.columns.reduce(function (supportedColumns, column) {
      if (column.name in columns && isAnnotationTableColumn(column)) {
        const dataField = metaData.resolvePath(column.annotationPath).target;
        // include only those columns that are annotated as part of the table (skip entity props)
        if (column.label && column.annotationPath.includes("@com.sap.vocabularies.UI.v1.LineItem") && isDataFieldTypes(dataField)) {
          // image urls and multi value columns are not supported
          const property = dataField.Value.$target;
          if (!(property && isImageURL(property)) && !column.isMultiValue) {
            var _column$typeConfig;
            supportedColumns.push({
              ...columns[column.name],
              annotationPath: column.annotationPath,
              formatOptions: (_column$typeConfig = column.typeConfig) === null || _column$typeConfig === void 0 ? void 0 : _column$typeConfig.formatOptions
            });
          }
        }
      }
      return supportedColumns;
    }, []);
  }
  function isAdditionalTextVisible(propertyTargetObject) {
    var _propertyTargetObject3;
    // We do not display additional text on insight cards for semantic keys if text arrangement is defined
    const text = (_propertyTargetObject3 = propertyTargetObject.annotations.Common) === null || _propertyTargetObject3 === void 0 ? void 0 : _propertyTargetObject3.Text;
    if (text) {
      var _text$annotations, _text$annotations$UI;
      const textArrangement = (_text$annotations = text.annotations) === null || _text$annotations === void 0 ? void 0 : (_text$annotations$UI = _text$annotations.UI) === null || _text$annotations$UI === void 0 ? void 0 : _text$annotations$UI.TextArrangement;
      return !textArrangement;
    }
    return false;
  }

  /**
   * Filters the columns that can be shown on the insights card from the visible columns on the table.
   *
   * @param tableAPI Table API
   * @returns A list of columns that can be shown on the insightsCard.
   */
  function getInsightsRelevantColumns(tableAPI) {
    var _table$getModel;
    const table = tableAPI.content;
    const metaModel = (_table$getModel = table.getModel()) === null || _table$getModel === void 0 ? void 0 : _table$getModel.getMetaModel();
    const metaPath = table.data("metaPath");
    const columns = {};
    table.getColumns().forEach(column => {
      const property = column.getDataProperty();
      const context = metaModel.getContext(metaPath + "/" + property);
      const objectPath = getInvolvedDataModelObjects(context);
      const title = column.getProperty("header");
      columns[property] = {
        property,
        context,
        objectPath,
        title
      };
    });
    const supportedColumns = getSupportedColumns(columns, tableAPI.getTableDefinition(), convertTypes(metaModel));
    return supportedColumns.map(function (supportedColumn) {
      const dataModel = getInvolvedDataModelObjects(supportedColumn.context);
      const propertyTargetObject = dataModel.targetObject;
      const uomBinding = getUomBinding(propertyTargetObject, supportedColumn.property);
      const columnText = uomBinding ?? getTextBinding(dataModel, {}, false, "extension.formatters.sapfe.formatWithBrackets");
      const column = {
        visible: false,
        value: columnText,
        title: supportedColumn.title
      };
      if (isSemanticKey(propertyTargetObject, dataModel) && !hasSemanticObject(propertyTargetObject)) {
        column.value = getTitleBindingExpression(dataModel, FieldTemplating.getTextBindingExpression, supportedColumn.formatOptions, undefined, CommonUtils.getTargetView(tableAPI).getViewData(), "extension.formatters.sapfe.formatTitle");
        column.additionalText = isAdditionalTextVisible(propertyTargetObject) ? pathInModel(supportedColumn.property) : undefined;
        column.identifier = true;
      }
      if (supportedColumn.annotationPath) {
        const criticalityBinding = getCriticalityBinding(supportedColumn.annotationPath, metaPath, metaModel);
        if (criticalityBinding) {
          column.state = criticalityBinding.state;
          column.showStateIcon = criticalityBinding.showStateIcon;
          column.customStateIcon = criticalityBinding.customStateIcon;
        }
      }
      return column;
    });
  }

  /**
   * Get criticality state binding expression and icon information.
   *
   * @param annotationPath Annotation path
   * @param metaPath Meta path
   * @param metaModel Meta model
   * @returns The criticality state binding expression and icon information.
   */
  _exports.getInsightsRelevantColumns = getInsightsRelevantColumns;
  function getCriticalityBinding(annotationPath, metaPath, metaModel) {
    const dataModel = getInvolvedDataModelObjects(metaModel.getContext(annotationPath), metaModel.getContext(metaPath)),
      propertyTargetObject = dataModel.targetObject;
    if (propertyTargetObject.Criticality) {
      const showCriticalityIcon = propertyTargetObject.CriticalityRepresentation !== "UI.CriticalityRepresentationType/WithoutIcon";
      return {
        state: buildExpressionForCriticalityColor(propertyTargetObject),
        showStateIcon: showCriticalityIcon,
        customStateIcon: showCriticalityIcon ? buildExpressionForCriticalityIcon(propertyTargetObject) : ""
      };
    }
    return undefined;
  }

  /**
   * Constructs the insights parameters from the table that is required to create the insights card.
   *
   * @param controlAPI
   * @param insightsRelevantColumns
   * @returns The insights parameters from the table.
   */
  async function createTableCardParams(controlAPI, insightsRelevantColumns) {
    const table = controlAPI.content;
    const params = await createInsightsParams("Table", controlAPI, table.getFilter(), insightsRelevantColumns);
    if (!params) {
      return;
    }
    try {
      var _controlState$groupLe, _controlState$groupLe2;
      const controlState = await StateUtil.retrieveExternalState(table);
      const groupProperty = (_controlState$groupLe = controlState.groupLevels) === null || _controlState$groupLe === void 0 ? void 0 : (_controlState$groupLe2 = _controlState$groupLe[0]) === null || _controlState$groupLe2 === void 0 ? void 0 : _controlState$groupLe2.name.split("::").pop();
      if (groupProperty) {
        params.requestParameters.groupBy = {
          property: groupProperty
        };
      }
    } catch {
      throw Error("Error retrieving control states");
    }
    params.parameters.isNavigationEnabled = isNavigationEnabled(controlAPI);
    params.entitySetPath = table.data("metaPath");
    params.requestParameters.sortQuery = controlAPI.getSortConditionsQuery();
    params.requestParameters.queryUrl = table.getRowBinding().getDownloadUrl();
    const content = {
      cardTitle: table.getHeader(),
      insightsRelevantColumns
    };
    return {
      ...params,
      content
    };
  }

  /**
   * Checks if row level navigation is enabled for table card.
   *
   * @param controlAPI Table API
   * @returns True if row level navigation is enabled.
   */
  _exports.createTableCardParams = createTableCardParams;
  function isNavigationEnabled(controlAPI) {
    var _viewData$navigation, _viewData$navigation2, _navigationSetting$de, _navigationSetting$di;
    const table = controlAPI.content,
      viewData = CommonUtils.getTargetView(controlAPI).getViewData(),
      entitySet = table.data("metaPath"),
      navigationSetting = (_viewData$navigation = viewData.navigation) !== null && _viewData$navigation !== void 0 && _viewData$navigation[entitySet] ? viewData.navigation[entitySet] : (_viewData$navigation2 = viewData.navigation) === null || _viewData$navigation2 === void 0 ? void 0 : _viewData$navigation2[entitySet.replace("/", "")];
    // Disable row level navigation if external navigation is configured for LR table using manifest
    return !(navigationSetting !== null && navigationSetting !== void 0 && (_navigationSetting$de = navigationSetting.detail) !== null && _navigationSetting$de !== void 0 && _navigationSetting$de.outbound || navigationSetting !== null && navigationSetting !== void 0 && (_navigationSetting$di = navigationSetting.display) !== null && _navigationSetting$di !== void 0 && _navigationSetting$di.target);
  }
  return _exports;
}, false);
