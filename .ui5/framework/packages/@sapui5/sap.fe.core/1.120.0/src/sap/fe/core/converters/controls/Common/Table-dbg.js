/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/formatters/TableFormatter", "sap/fe/core/formatters/TableFormatterTypes", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/EntitySetHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/internal/helpers/ActionHelper", "sap/ui/core/Core", "../../ManifestSettings", "../../helpers/Aggregation", "../../helpers/DataFieldHelper", "../../helpers/ID", "./Criticality", "./table/StandardActions"], function (Log, DataField, Action, ConfigurableObject, IssueManager, Key, tableFormatters, TableFormatterTypes, BindingHelper, BindingToolkit, ModelHelper, StableIdHelper, TypeGuards, DataModelPathHelper, DisplayModeFormatter, EntitySetHelper, FieldControlHelper, PropertyHelper, UIFormatters, ActionHelper, Core, ManifestSettings, Aggregation, DataFieldHelper, ID, Criticality, StandardActions) {
  "use strict";

  var _exports = {};
  var isInDisplayMode = StandardActions.isInDisplayMode;
  var isDraftOrStickySupported = StandardActions.isDraftOrStickySupported;
  var getStandardActionPaste = StandardActions.getStandardActionPaste;
  var getStandardActionMassEdit = StandardActions.getStandardActionMassEdit;
  var getStandardActionInsights = StandardActions.getStandardActionInsights;
  var getStandardActionDelete = StandardActions.getStandardActionDelete;
  var getStandardActionCut = StandardActions.getStandardActionCut;
  var getStandardActionCreate = StandardActions.getStandardActionCreate;
  var getRestrictions = StandardActions.getRestrictions;
  var getMassEditVisibility = StandardActions.getMassEditVisibility;
  var getInsertUpdateActionsTemplating = StandardActions.getInsertUpdateActionsTemplating;
  var getDeleteVisibility = StandardActions.getDeleteVisibility;
  var getCreationRow = StandardActions.getCreationRow;
  var generateStandardActionsContext = StandardActions.generateStandardActionsContext;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var getMessageTypeFromCriticalityType = Criticality.getMessageTypeFromCriticalityType;
  var getTableID = ID.getTableID;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var AggregationHelper = Aggregation.AggregationHelper;
  var VisualizationType = ManifestSettings.VisualizationType;
  var VariantManagementType = ManifestSettings.VariantManagementType;
  var TemplateType = ManifestSettings.TemplateType;
  var SelectionMode = ManifestSettings.SelectionMode;
  var Importance = ManifestSettings.Importance;
  var HorizontalAlign = ManifestSettings.HorizontalAlign;
  var CreationMode = ManifestSettings.CreationMode;
  var ActionType = ManifestSettings.ActionType;
  var isMultiValueField = UIFormatters.isMultiValueField;
  var isTimezone = PropertyHelper.isTimezone;
  var getStaticUnitOrCurrency = PropertyHelper.getStaticUnitOrCurrency;
  var getStaticTimezone = PropertyHelper.getStaticTimezone;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTimezoneProperty = PropertyHelper.getAssociatedTimezoneProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var isStaticallyMandatory = FieldControlHelper.isStaticallyMandatory;
  var hasFieldControlNotMandatory = FieldControlHelper.hasFieldControlNotMandatory;
  var getNonSortablePropertiesRestrictions = EntitySetHelper.getNonSortablePropertiesRestrictions;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var isPathSearchable = DataModelPathHelper.isPathSearchable;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextPropertyRestriction = DataModelPathHelper.getContextPropertyRestriction;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isTypeDefinition = TypeGuards.isTypeDefinition;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var replaceSpecialChars = StableIdHelper.replaceSpecialChars;
  var generate = StableIdHelper.generate;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  var UI = BindingHelper.UI;
  var Entity = BindingHelper.Entity;
  var MessageType = TableFormatterTypes.MessageType;
  var KeyHelper = Key.KeyHelper;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var removeDuplicateActions = Action.removeDuplicateActions;
  var isActionNavigable = Action.isActionNavigable;
  var getEnabledForAnnotationAction = Action.getEnabledForAnnotationAction;
  var getCopyAction = Action.getCopyAction;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var dataFieldIsCopyAction = Action.dataFieldIsCopyAction;
  var isRatingVisualizationFromDataFieldDefault = DataField.isRatingVisualizationFromDataFieldDefault;
  var isDataPointFromDataFieldDefault = DataField.isDataPointFromDataFieldDefault;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataFieldForActionAbstract = DataField.isDataFieldForActionAbstract;
  var isDataField = DataField.isDataField;
  var hasFieldGroupTarget = DataField.hasFieldGroupTarget;
  var hasDataPointTarget = DataField.hasDataPointTarget;
  var getTargetValueOnDataPoint = DataField.getTargetValueOnDataPoint;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  var getDataFieldDataType = DataField.getDataFieldDataType;
  var collectRelatedPropertiesRecursively = DataField.collectRelatedPropertiesRecursively;
  var collectRelatedProperties = DataField.collectRelatedProperties;
  var ColumnType; // Custom Column from Manifest
  (function (ColumnType) {
    ColumnType["Default"] = "Default";
    ColumnType["Annotation"] = "Annotation";
    ColumnType["Slot"] = "Slot";
    ColumnType["Computed"] = "Computed";
  })(ColumnType || (ColumnType = {}));
  /**
   * Returns an array of all standard, annotation-based, and manifest-based table actions.
   *
   * @param lineItemAnnotation
   * @param visualizationPath
   * @param converterContext
   * @param standardActions
   * @param navigationSettings
   * @returns The complete table actions
   */
  function getTableActions(lineItemAnnotation, visualizationPath, converterContext, standardActions, navigationSettings) {
    const tableActions = getTableAnnotationActions(lineItemAnnotation, visualizationPath, converterContext);
    const hiddenActions = tableActions.hiddenTableActions;
    const manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).actions, converterContext, tableActions.tableActions, navigationSettings, true, hiddenActions);
    // The "Copy" action always needs to be placed after the "Create" action, so we need to separate it
    const copyActions = tableActions.tableActions.filter(a => a.type === ActionType.Copy);
    const annotationActions = tableActions.tableActions.filter(a => a.type !== ActionType.Copy);
    // Combine standard, annotation, and custom actions together, respecting the fixed order of standard actions
    const annotationAndStandardActions = [...annotationActions, standardActions.create, ...copyActions, standardActions.delete, standardActions.massEdit, standardActions.insights,
    // Note that the following actions are not templated as buttons
    standardActions.creationRow, standardActions.paste, standardActions.cut];
    // Anchor all non-anchored manifest actions before the standard actions
    // Note that overridden annotation actions are not affected by this as the position can never be overridden
    for (const manifestAction of Object.values(manifestActions.actions)) {
      var _manifestAction$posit;
      if (!((_manifestAction$posit = manifestAction.position) !== null && _manifestAction$posit !== void 0 && _manifestAction$posit.anchor)) {
        manifestAction.position = {
          anchor: StandardActionKeys.Create,
          placement: Placement.Before
        };
      }
    }
    // Insert twice to allow regular override for non-standard actions and positional override for standard actions
    const manifestActionEntries = Object.entries(manifestActions.actions);
    const standardManifestActions = Object.fromEntries(manifestActionEntries.filter(_ref => {
      let [key] = _ref;
      return key.startsWith("StandardAction::");
    }));
    const nonStandardManifestActions = Object.fromEntries(manifestActionEntries.filter(_ref2 => {
      let [key] = _ref2;
      return !standardManifestActions[key];
    }));
    let actions = insertCustomElements(annotationAndStandardActions, nonStandardManifestActions, {
      isNavigable: OverrideType.overwrite,
      enableOnSelect: OverrideType.overwrite,
      enableAutoScroll: OverrideType.overwrite,
      enabled: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      defaultValuesExtensionFunction: OverrideType.overwrite,
      command: OverrideType.overwrite
    });
    actions = insertCustomElements(actions, standardManifestActions, {
      position: OverrideType.overwrite
    });
    return {
      actions,
      commandActions: manifestActions.commandActions
    };
  }
  /**
   * Returns an array of all columns, annotation-based as well as manifest-based.
   * They are sorted and some properties can be overwritten via the manifest (check out the keys that can be overwritten).
   *
   * @param lineItemAnnotation Collection of data fields for representation in a table or list
   * @param visualizationPath
   * @param converterContext
   * @param navigationSettings
   * @returns Returns all table columns that should be available, regardless of templating or personalization or their origin
   */
  _exports.getTableActions = getTableActions;
  function getTableColumns(lineItemAnnotation, visualizationPath, converterContext, navigationSettings) {
    const annotationColumns = getColumnsFromAnnotations(lineItemAnnotation, visualizationPath, converterContext);
    const manifestColumns = getColumnsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).columns, annotationColumns, converterContext, converterContext.getAnnotationEntityType(lineItemAnnotation), navigationSettings);
    const tableColumns = insertCustomElements(annotationColumns, manifestColumns, {
      width: OverrideType.overwrite,
      widthIncludingColumnHeader: OverrideType.overwrite,
      importance: OverrideType.overwrite,
      horizontalAlign: OverrideType.overwrite,
      availability: OverrideType.overwrite,
      isNavigable: OverrideType.overwrite,
      settings: OverrideType.overwrite,
      formatOptions: OverrideType.overwrite
    });
    return addComputedColumns(tableColumns, visualizationPath, converterContext);
  }
  /**
   * Retrieve the custom aggregation definitions from the entityType.
   *
   * @param entityType The target entity type.
   * @param tableColumns The array of columns for the entity type.
   * @param converterContext The converter context.
   * @returns The aggregate definitions from the entityType, or undefined if the entity doesn't support analytical queries.
   */
  _exports.getTableColumns = getTableColumns;
  const getAggregateDefinitionsFromEntityType = function (entityType, tableColumns, converterContext) {
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    function findColumnFromPath(path) {
      return tableColumns.find(column => {
        const annotationColumn = column;
        return annotationColumn.propertyInfos === undefined && annotationColumn.relativePath === path;
      });
    }
    if (!aggregationHelper.isAnalyticsSupported()) {
      return undefined;
    }
    // Keep a set of all currency/unit properties, as we don't want to consider them as aggregates
    // They are aggregates for technical reasons (to manage multi-units situations) but it doesn't make sense from a user standpoint
    const currencyOrUnitProperties = new Set();
    tableColumns.forEach(column => {
      const tableColumn = column;
      if (tableColumn.unit) {
        currencyOrUnitProperties.add(tableColumn.unit);
      }
    });
    const customAggregateAnnotations = aggregationHelper.getCustomAggregateDefinitions();
    const definitions = {};
    customAggregateAnnotations.forEach(annotation => {
      const aggregatedProperty = aggregationHelper._entityType.entityProperties.find(property => {
        return property.name === annotation.qualifier;
      });
      if (aggregatedProperty) {
        var _annotation$annotatio, _annotation$annotatio2;
        const contextDefiningProperties = (_annotation$annotatio = annotation.annotations) === null || _annotation$annotatio === void 0 ? void 0 : (_annotation$annotatio2 = _annotation$annotatio.Aggregation) === null || _annotation$annotatio2 === void 0 ? void 0 : _annotation$annotatio2.ContextDefiningProperties;
        definitions[aggregatedProperty.name] = contextDefiningProperties ? contextDefiningProperties.map(ctxDefProperty => {
          return ctxDefProperty.value;
        }) : [];
      }
    });
    const result = {};
    tableColumns.forEach(column => {
      const tableColumn = column;
      if (tableColumn.propertyInfos === undefined && tableColumn.relativePath) {
        const rawContextDefiningProperties = definitions[tableColumn.relativePath];
        // Ignore aggregates corresponding to currencies or units of measure
        if (rawContextDefiningProperties && !currencyOrUnitProperties.has(tableColumn.name)) {
          result[tableColumn.name] = {
            defaultAggregate: {},
            relativePath: tableColumn.relativePath
          };
          const contextDefiningProperties = [];
          rawContextDefiningProperties.forEach(contextDefiningPropertyName => {
            const foundColumn = findColumnFromPath(contextDefiningPropertyName);
            if (foundColumn) {
              contextDefiningProperties.push(foundColumn.name);
            }
          });
          if (contextDefiningProperties.length) {
            result[tableColumn.name].defaultAggregate.contextDefiningProperties = contextDefiningProperties;
          }
        }
      }
    });
    return result;
  };
  /**
   * Updates a table visualization for analytical use cases.
   *
   * @param tableVisualization The visualization to be updated
   * @param entityType The entity type displayed in the table
   * @param converterContext The converter context
   * @param presentationVariantAnnotation The presentationVariant annotation (if any)
   */
  _exports.getAggregateDefinitionsFromEntityType = getAggregateDefinitionsFromEntityType;
  function updateTableVisualizationForType(tableVisualization, entityType, converterContext, presentationVariantAnnotation) {
    if (tableVisualization.control.type === "AnalyticalTable") {
      const aggregatesDefinitions = getAggregateDefinitionsFromEntityType(entityType, tableVisualization.columns, converterContext),
        aggregationHelper = new AggregationHelper(entityType, converterContext);
      if (aggregatesDefinitions) {
        tableVisualization.enableAnalytics = true;
        tableVisualization.enable$select = false;
        tableVisualization.enable$$getKeepAliveContext = false;
        tableVisualization.aggregates = aggregatesDefinitions;
        _updatePropertyInfosWithAggregatesDefinitions(tableVisualization);
        const allowedTransformations = aggregationHelper.getAllowedTransformations();
        tableVisualization.enableBasicSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
        // Add group and sort conditions from the presentation variant
        tableVisualization.annotation.groupConditions = getGroupConditions(presentationVariantAnnotation, tableVisualization.columns, tableVisualization.control.type);
        tableVisualization.annotation.aggregateConditions = getAggregateConditions(presentationVariantAnnotation, tableVisualization.columns);
      }
      tableVisualization.control.type = "GridTable"; // AnalyticalTable isn't a real type for the MDC:Table, so we always switch back to Grid
    } else if (tableVisualization.control.type === "ResponsiveTable") {
      tableVisualization.annotation.groupConditions = getGroupConditions(presentationVariantAnnotation, tableVisualization.columns, tableVisualization.control.type);
    } else if (tableVisualization.control.type === "TreeTable") {
      const aggregationHelper = new AggregationHelper(entityType, converterContext);
      const allowedTransformations = aggregationHelper.getAllowedTransformations();
      tableVisualization.enableBasicSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
      tableVisualization.enable$$getKeepAliveContext = true;
    }
  }
  /**
   * Get the navigation target path from manifest settings.
   *
   * @param converterContext The converter context
   * @param navigationPropertyPath The navigation path to check in the manifest settings
   * @returns Navigation path from manifest settings
   */
  _exports.updateTableVisualizationForType = updateTableVisualizationForType;
  function getNavigationTargetPath(converterContext, navigationPropertyPath) {
    const manifestWrapper = converterContext.getManifestWrapper();
    if (navigationPropertyPath && manifestWrapper.getNavigationConfiguration(navigationPropertyPath)) {
      const navConfig = manifestWrapper.getNavigationConfiguration(navigationPropertyPath);
      if (Object.keys(navConfig).length > 0) {
        return navigationPropertyPath;
      }
    }
    const dataModelPath = converterContext.getDataModelObjectPath();
    const contextPath = converterContext.getContextPath();
    const navConfigForContextPath = manifestWrapper.getNavigationConfiguration(contextPath);
    if (navConfigForContextPath && Object.keys(navConfigForContextPath).length > 0) {
      return contextPath;
    }
    return dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
  }
  /**
   * Sets the 'unit' and 'textArrangement' properties in columns when necessary.
   *
   * @param entityType The entity type displayed in the table
   * @param tableColumns The columns to be updated
   */
  _exports.getNavigationTargetPath = getNavigationTargetPath;
  function updateLinkedProperties(entityType, tableColumns) {
    function findColumnByPath(path) {
      return tableColumns.find(column => {
        const annotationColumn = column;
        return annotationColumn.propertyInfos === undefined && annotationColumn.relativePath === path;
      });
    }
    tableColumns.forEach(oColumn => {
      const oTableColumn = oColumn;
      if (oTableColumn.propertyInfos === undefined && oTableColumn.relativePath) {
        const oProperty = entityType.entityProperties.find(oProp => oProp.name === oTableColumn.relativePath);
        if (oProperty) {
          var _oProperty$annotation, _oProperty$annotation2, _oProperty$annotation7;
          const oUnit = getAssociatedCurrencyProperty(oProperty) || getAssociatedUnitProperty(oProperty);
          const oTimezone = getAssociatedTimezoneProperty(oProperty);
          const sTimezone = oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation = oProperty.annotations) === null || _oProperty$annotation === void 0 ? void 0 : (_oProperty$annotation2 = _oProperty$annotation.Common) === null || _oProperty$annotation2 === void 0 ? void 0 : _oProperty$annotation2.Timezone;
          if (oUnit) {
            const oUnitColumn = findColumnByPath(oUnit.name);
            oTableColumn.unit = oUnitColumn === null || oUnitColumn === void 0 ? void 0 : oUnitColumn.name;
          } else {
            var _oProperty$annotation3, _oProperty$annotation4, _oProperty$annotation5, _oProperty$annotation6;
            const sUnit = (oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation3 = oProperty.annotations) === null || _oProperty$annotation3 === void 0 ? void 0 : (_oProperty$annotation4 = _oProperty$annotation3.Measures) === null || _oProperty$annotation4 === void 0 ? void 0 : _oProperty$annotation4.ISOCurrency) || (oProperty === null || oProperty === void 0 ? void 0 : (_oProperty$annotation5 = oProperty.annotations) === null || _oProperty$annotation5 === void 0 ? void 0 : (_oProperty$annotation6 = _oProperty$annotation5.Measures) === null || _oProperty$annotation6 === void 0 ? void 0 : _oProperty$annotation6.Unit);
            if (sUnit) {
              oTableColumn.unitText = `${sUnit}`;
            }
          }
          if (oTimezone) {
            const oTimezoneColumn = findColumnByPath(oTimezone.name);
            oTableColumn.timezone = oTimezoneColumn === null || oTimezoneColumn === void 0 ? void 0 : oTimezoneColumn.name;
          } else if (sTimezone) {
            oTableColumn.timezoneText = sTimezone.toString();
          }
          const displayMode = getDisplayMode(oProperty),
            textAnnotation = (_oProperty$annotation7 = oProperty.annotations.Common) === null || _oProperty$annotation7 === void 0 ? void 0 : _oProperty$annotation7.Text;
          if (isPathAnnotationExpression(textAnnotation) && displayMode !== "Value") {
            const oTextColumn = findColumnByPath(textAnnotation.path);
            if (oTextColumn && oTextColumn.name !== oTableColumn.name) {
              oTableColumn.textArrangement = {
                textProperty: oTextColumn.name,
                mode: displayMode
              };
            }
          }
        }
      }
    });
  }
  _exports.updateLinkedProperties = updateLinkedProperties;
  function getSemanticKeysAndTitleInfo(converterContext) {
    var _converterContext$get, _converterContext$get2, _converterContext$get3, _converterContext$get4, _converterContext$get5, _converterContext$get6, _converterContext$get7, _converterContext$get8, _converterContext$get9, _converterContext$get10, _converterContext$get11, _converterContext$get12, _converterContext$get13;
    const headerInfoTitlePath = (_converterContext$get = converterContext.getAnnotationEntityType()) === null || _converterContext$get === void 0 ? void 0 : (_converterContext$get2 = _converterContext$get.annotations) === null || _converterContext$get2 === void 0 ? void 0 : (_converterContext$get3 = _converterContext$get2.UI) === null || _converterContext$get3 === void 0 ? void 0 : (_converterContext$get4 = _converterContext$get3.HeaderInfo) === null || _converterContext$get4 === void 0 ? void 0 : (_converterContext$get5 = _converterContext$get4.Title) === null || _converterContext$get5 === void 0 ? void 0 : (_converterContext$get6 = _converterContext$get5.Value) === null || _converterContext$get6 === void 0 ? void 0 : _converterContext$get6.path;
    const semanticKeyAnnotations = (_converterContext$get7 = converterContext.getAnnotationEntityType()) === null || _converterContext$get7 === void 0 ? void 0 : (_converterContext$get8 = _converterContext$get7.annotations) === null || _converterContext$get8 === void 0 ? void 0 : (_converterContext$get9 = _converterContext$get8.Common) === null || _converterContext$get9 === void 0 ? void 0 : _converterContext$get9.SemanticKey;
    const headerInfoTypeName = converterContext === null || converterContext === void 0 ? void 0 : (_converterContext$get10 = converterContext.getAnnotationEntityType()) === null || _converterContext$get10 === void 0 ? void 0 : (_converterContext$get11 = _converterContext$get10.annotations) === null || _converterContext$get11 === void 0 ? void 0 : (_converterContext$get12 = _converterContext$get11.UI) === null || _converterContext$get12 === void 0 ? void 0 : (_converterContext$get13 = _converterContext$get12.HeaderInfo) === null || _converterContext$get13 === void 0 ? void 0 : _converterContext$get13.TypeName;
    const semanticKeyColumns = [];
    if (semanticKeyAnnotations) {
      semanticKeyAnnotations.forEach(function (oColumn) {
        semanticKeyColumns.push(oColumn.value);
      });
    }
    return {
      headerInfoTitlePath,
      semanticKeyColumns,
      headerInfoTypeName
    };
  }
  function createTableVisualization(lineItemAnnotation, visualizationPath, converterContext, presentationVariantAnnotation, isCondensedTableLayoutCompliant, viewConfiguration) {
    const tableManifestConfig = getTableManifestConfiguration(lineItemAnnotation, visualizationPath, converterContext, isCondensedTableLayoutCompliant);
    const {
      navigationPropertyPath
    } = splitPath(visualizationPath);
    const navigationTargetPath = getNavigationTargetPath(converterContext, navigationPropertyPath);
    const navigationSettings = converterContext.getManifestWrapper().getNavigationConfiguration(navigationTargetPath);
    const columns = getTableColumns(lineItemAnnotation, visualizationPath, converterContext, navigationSettings);
    const operationAvailableMap = getOperationAvailableMap(lineItemAnnotation, converterContext);
    const semanticKeysAndHeaderInfoTitle = getSemanticKeysAndTitleInfo(converterContext);
    const standardActionsConfiguration = getStandardActionsConfiguration(lineItemAnnotation, visualizationPath, converterContext, tableManifestConfig, navigationSettings, viewConfiguration);
    const tableAnnotation = getTableAnnotationConfiguration(lineItemAnnotation, visualizationPath, converterContext, tableManifestConfig, columns, navigationSettings, standardActionsConfiguration, presentationVariantAnnotation, viewConfiguration);
    const tableActions = getTableActions(lineItemAnnotation, visualizationPath, converterContext, standardActionsConfiguration.standardActions, navigationSettings);
    const oVisualization = {
      type: VisualizationType.Table,
      annotation: tableAnnotation,
      control: tableManifestConfig,
      actions: removeDuplicateActions(tableActions.actions),
      commandActions: tableActions.commandActions,
      columns: columns,
      operationAvailableMap: JSON.stringify(operationAvailableMap),
      operationAvailableProperties: getOperationAvailableProperties(operationAvailableMap, converterContext),
      headerInfoTitle: semanticKeysAndHeaderInfoTitle.headerInfoTitlePath,
      semanticKeys: semanticKeysAndHeaderInfoTitle.semanticKeyColumns,
      headerInfoTypeName: semanticKeysAndHeaderInfoTitle.headerInfoTypeName,
      enable$select: true,
      enable$$getKeepAliveContext: true
    };
    updateLinkedProperties(converterContext.getAnnotationEntityType(lineItemAnnotation), columns);
    updateTableVisualizationForType(oVisualization, converterContext.getAnnotationEntityType(lineItemAnnotation), converterContext, presentationVariantAnnotation);
    return oVisualization;
  }
  _exports.createTableVisualization = createTableVisualization;
  function createDefaultTableVisualization(converterContext, isBlankTable) {
    const tableManifestConfig = getTableManifestConfiguration(undefined, "", converterContext, false);
    const columns = getColumnsFromEntityType({}, converterContext.getEntityType(), [], [], converterContext, tableManifestConfig.type, tableManifestConfig.creationMode, []);
    const operationAvailableMap = getOperationAvailableMap(undefined, converterContext);
    const semanticKeysAndHeaderInfoTitle = getSemanticKeysAndTitleInfo(converterContext);
    const navigationTargetPath = getNavigationTargetPath(converterContext, "");
    const navigationSettings = converterContext.getManifestWrapper().getNavigationConfiguration(navigationTargetPath);
    const standardActionsConfiguration = getStandardActionsConfiguration(undefined, "", converterContext, tableManifestConfig, navigationSettings);
    const oVisualization = {
      type: VisualizationType.Table,
      annotation: getTableAnnotationConfiguration(undefined, "", converterContext, tableManifestConfig, isBlankTable ? [] : columns, navigationSettings, standardActionsConfiguration),
      control: tableManifestConfig,
      actions: [],
      columns: columns,
      operationAvailableMap: JSON.stringify(operationAvailableMap),
      operationAvailableProperties: getOperationAvailableProperties(operationAvailableMap, converterContext),
      headerInfoTitle: semanticKeysAndHeaderInfoTitle.headerInfoTitlePath,
      semanticKeys: semanticKeysAndHeaderInfoTitle.semanticKeyColumns,
      headerInfoTypeName: semanticKeysAndHeaderInfoTitle.headerInfoTypeName,
      enable$select: true,
      enable$$getKeepAliveContext: true
    };
    updateLinkedProperties(converterContext.getEntityType(), columns);
    updateTableVisualizationForType(oVisualization, converterContext.getEntityType(), converterContext);
    return oVisualization;
  }
  /**
   * Gets the map of Core.OperationAvailable property paths for all DataFieldForActions.
   *
   * @param lineItemAnnotation The instance of the line item
   * @param converterContext The instance of the converter context
   * @returns The record containing all action names and their corresponding Core.OperationAvailable property paths
   */
  _exports.createDefaultTableVisualization = createDefaultTableVisualization;
  function getOperationAvailableMap(lineItemAnnotation, converterContext) {
    return ActionHelper.getOperationAvailableMap(lineItemAnnotation, "table", converterContext);
  }
  /**
   * Gets updatable propertyPath for the current entityset if valid.
   *
   * @param converterContext The instance of the converter context
   * @returns The updatable property for the rows
   */
  function getCurrentEntitySetUpdatablePath(converterContext) {
    var _entitySet$annotation, _entitySet$annotation2;
    const restrictions = getRestrictions(converterContext);
    const entitySet = converterContext.getEntitySet();
    const updatable = restrictions.isUpdatable;
    const isOnlyDynamicOnCurrentEntity = !isConstant(updatable.expression) && updatable.navigationExpression._type === "Unresolvable";
    const updatableExpression = entitySet === null || entitySet === void 0 ? void 0 : (_entitySet$annotation = entitySet.annotations.Capabilities) === null || _entitySet$annotation === void 0 ? void 0 : (_entitySet$annotation2 = _entitySet$annotation.UpdateRestrictions) === null || _entitySet$annotation2 === void 0 ? void 0 : _entitySet$annotation2.Updatable;
    const updatablePropertyPath = isPathAnnotationExpression(updatableExpression) && updatableExpression.path;
    return isOnlyDynamicOnCurrentEntity ? updatablePropertyPath : "";
  }
  /**
   * Method to retrieve all property paths assigned to the Core.OperationAvailable annotation.
   *
   * @param operationAvailableMap The record consisting of actions and their Core.OperationAvailable property paths
   * @param converterContext The instance of the converter context
   * @returns The CSV string of all property paths associated with the Core.OperationAvailable annotation
   */
  function getOperationAvailableProperties(operationAvailableMap, converterContext) {
    const properties = new Set();
    for (const actionName in operationAvailableMap) {
      const propertyName = operationAvailableMap[actionName];
      if (propertyName === null) {
        // Annotation configured with explicit 'null' (action advertisement relevant)
        properties.add(actionName);
      } else if (typeof propertyName === "string") {
        // Add property paths and not Constant values.
        properties.add(propertyName);
      }
    }
    if (properties.size) {
      var _entityType$annotatio, _entityType$annotatio2, _entityType$annotatio3, _entityType$annotatio4, _entityType$annotatio5;
      // Some actions have an operation available based on property --> we need to load the HeaderInfo.Title property
      // so that the dialog on partial actions is displayed properly (BCP 2180271425)
      const entityType = converterContext.getEntityType();
      const titleProperty = (_entityType$annotatio = entityType.annotations) === null || _entityType$annotatio === void 0 ? void 0 : (_entityType$annotatio2 = _entityType$annotatio.UI) === null || _entityType$annotatio2 === void 0 ? void 0 : (_entityType$annotatio3 = _entityType$annotatio2.HeaderInfo) === null || _entityType$annotatio3 === void 0 ? void 0 : (_entityType$annotatio4 = _entityType$annotatio3.Title) === null || _entityType$annotatio4 === void 0 ? void 0 : (_entityType$annotatio5 = _entityType$annotatio4.Value) === null || _entityType$annotatio5 === void 0 ? void 0 : _entityType$annotatio5.path;
      if (titleProperty) {
        properties.add(titleProperty);
      }
    }
    return Array.from(properties).join(",");
  }
  /**
   * Iterates over the DataFieldForAction and DataFieldForIntentBasedNavigation of a line item and
   * returns all the UI.Hidden annotation expressions.
   *
   * @param lineItemAnnotation Collection of data fields used for representation in a table or list
   * @param currentEntityType Current entity type
   * @param contextDataModelObjectPath Object path of the data model
   * @param isEntitySet
   * @returns All the `UI.Hidden` path expressions found in the relevant actions
   */
  function getUIHiddenExpForActionsRequiringContext(lineItemAnnotation, currentEntityType, contextDataModelObjectPath, isEntitySet) {
    const aUiHiddenPathExpressions = [];
    lineItemAnnotation.forEach(dataField => {
      var _dataField$ActionTarg, _dataField$Inline;
      // Check if the lineItem context is the same as that of the action:
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && dataField !== null && dataField !== void 0 && (_dataField$ActionTarg = dataField.ActionTarget) !== null && _dataField$ActionTarg !== void 0 && _dataField$ActionTarg.isBound && currentEntityType === (dataField === null || dataField === void 0 ? void 0 : dataField.ActionTarget.sourceEntityType) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && dataField.RequiresContext && (dataField === null || dataField === void 0 ? void 0 : (_dataField$Inline = dataField.Inline) === null || _dataField$Inline === void 0 ? void 0 : _dataField$Inline.valueOf()) !== true) {
        var _dataField$annotation, _dataField$annotation2, _dataField$annotation3;
        if (typeof ((_dataField$annotation = dataField.annotations) === null || _dataField$annotation === void 0 ? void 0 : (_dataField$annotation2 = _dataField$annotation.UI) === null || _dataField$annotation2 === void 0 ? void 0 : (_dataField$annotation3 = _dataField$annotation2.Hidden) === null || _dataField$annotation3 === void 0 ? void 0 : _dataField$annotation3.valueOf()) === "object") {
          aUiHiddenPathExpressions.push(equal(getHiddenExpressionAtTableLevel(dataField, contextDataModelObjectPath, isEntitySet), false));
        }
      }
    });
    return aUiHiddenPathExpressions;
  }
  /**
   * This method is used to get the binding expression of the path of a DataField.
   *
   * @param expression CompiledBindingToolkitExpression
   * @returns The binding expression
   */
  function getPathFromActionAnnotation(expression) {
    let path;
    if (isPathAnnotationExpression(expression)) {
      path = expression.path;
    } else {
      path = expression;
    }
    return path;
  }
  /**
   * This method is used to change the context currently referenced by this binding by removing the last navigation property.
   *
   * It is used (specifically in this case), to transform a binding made for a NavProp context /MainObject/NavProp1/NavProp2,
   * into a binding on the previous context /MainObject/NavProp1.
   *
   * @param source DataFieldForAction | DataFieldForIntentBasedNavigation | CustomAction
   * @param contextDataModelObjectPath DataModelObjectPath
   * @param isEntitySet
   * @returns The binding expression
   */
  function getHiddenExpressionAtTableLevel(source, contextDataModelObjectPath, isEntitySet) {
    var _source$annotations, _source$annotations$U;
    const expression = (_source$annotations = source.annotations) === null || _source$annotations === void 0 ? void 0 : (_source$annotations$U = _source$annotations.UI) === null || _source$annotations$U === void 0 ? void 0 : _source$annotations$U.Hidden;
    let path = getPathFromActionAnnotation(expression);
    if (typeof path === "object") {
      return constant(false);
    } else if (typeof path === "string") {
      if ("visible" in source) {
        path = path.substring(1, path.length - 1);
      }
      if (path.indexOf("/") > 0) {
        //check if the navigation property is correct:
        const splitPathForNavigationProperty = path.split("/");
        const navigationPath = splitPathForNavigationProperty[0];
        if (isNavigationProperty(contextDataModelObjectPath === null || contextDataModelObjectPath === void 0 ? void 0 : contextDataModelObjectPath.targetObject) && contextDataModelObjectPath.targetObject.partner === navigationPath) {
          return pathInModel(splitPathForNavigationProperty.slice(1).join("/"));
        } else {
          return constant(true);
        }
        // In case there is no navigation property, if it's an entitySet, the expression binding has to be returned:
      } else if (isEntitySet) {
        return pathInModel(path);
        // otherwise the expression binding cannot be taken into account for the selection mode evaluation:
      } else {
        return constant(false);
      }
    }
    return constant(true);
  }
  /**
   * Loop through the manifest actions and check the following:
   *
   * If the data field is also referenced as a custom action.
   * If the underlying manifest action is either a bound action or has the 'RequiresContext' property set to true.
   *
   * If so, the 'requiresSelection' property is forced to 'true' in the manifest.
   *
   * @param dataFieldId Id of the DataField evaluated
   * @param dataField DataField evaluated
   * @param manifestActions The actions defined in the manifest
   * @returns `true` if the DataField is found among the manifest actions
   */
  function updateManifestActionAndTagIt(dataFieldId, dataField, manifestActions) {
    return Object.keys(manifestActions).some(actionKey => {
      if (actionKey === dataFieldId) {
        var _ActionTarget;
        if (dataField !== null && dataField !== void 0 && (_ActionTarget = dataField.ActionTarget) !== null && _ActionTarget !== void 0 && _ActionTarget.isBound || dataField !== null && dataField !== void 0 && dataField.RequiresContext) {
          manifestActions[dataFieldId].requiresSelection = true;
        }
        return true;
      }
      return false;
    });
  }
  /**
   * Loop through the DataFieldForAction and DataFieldForIntentBasedNavigation of a line item and
   * check the following:
   * If at least one of them is always visible in the table toolbar and requires a context
   * If an action is also defined in the manifest, it is set aside and will be considered
   * when going through the manifest.
   *
   * @param lineItemAnnotation Collection of data fields for representation in a table or list
   * @param manifestActions The actions defined in the manifest
   * @param currentEntityType Current Entity Type
   * @returns `true` if there is at least 1 action that meets the criteria
   */
  function hasBoundActionsAlwaysVisibleInToolBar(lineItemAnnotation, manifestActions, currentEntityType) {
    return lineItemAnnotation.some(dataField => {
      var _dataField$Inline2, _dataField$annotation4, _dataField$annotation5, _dataField$annotation6, _dataField$annotation7, _dataField$annotation8, _dataField$annotation9;
      if ((dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") && (dataField === null || dataField === void 0 ? void 0 : (_dataField$Inline2 = dataField.Inline) === null || _dataField$Inline2 === void 0 ? void 0 : _dataField$Inline2.valueOf()) !== true && (((_dataField$annotation4 = dataField.annotations) === null || _dataField$annotation4 === void 0 ? void 0 : (_dataField$annotation5 = _dataField$annotation4.UI) === null || _dataField$annotation5 === void 0 ? void 0 : (_dataField$annotation6 = _dataField$annotation5.Hidden) === null || _dataField$annotation6 === void 0 ? void 0 : _dataField$annotation6.valueOf()) === false || ((_dataField$annotation7 = dataField.annotations) === null || _dataField$annotation7 === void 0 ? void 0 : (_dataField$annotation8 = _dataField$annotation7.UI) === null || _dataField$annotation8 === void 0 ? void 0 : (_dataField$annotation9 = _dataField$annotation8.Hidden) === null || _dataField$annotation9 === void 0 ? void 0 : _dataField$annotation9.valueOf()) === undefined)) {
        if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
          var _dataField$ActionTarg2;
          const manifestActionId = generate(["DataFieldForAction", dataField.Action]);
          // if the DataFieldForActon from annotation also exists in the manifest, its visibility will be evaluated later on
          if (updateManifestActionAndTagIt(manifestActionId, dataField, manifestActions)) {
            return false;
          }
          // Check if the lineItem context is the same as that of the action:
          return (dataField === null || dataField === void 0 ? void 0 : (_dataField$ActionTarg2 = dataField.ActionTarget) === null || _dataField$ActionTarg2 === void 0 ? void 0 : _dataField$ActionTarg2.isBound) && currentEntityType === (dataField === null || dataField === void 0 ? void 0 : dataField.ActionTarget.sourceEntityType);
        } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
          // if the DataFieldForIntentBasedNavigation from annotation also exists in the manifest, its visibility will be evaluated later on
          if (updateManifestActionAndTagIt(`DataFieldForIntentBasedNavigation::${dataField.SemanticObject}::${dataField.Action}`, dataField, manifestActions)) {
            return false;
          }
          return dataField.RequiresContext;
        }
      }
      return false;
    });
  }
  /**
   * Checks if a custom action that requires a context is always visible in the toolbar.
   *
   * @param manifestActions The actions defined in the manifest
   * @returns `true` if there is at least 1 action that meets the criteria
   */
  function hasCustomActionsAlwaysVisibleInToolBar(manifestActions) {
    const customActions = Object.keys(manifestActions).reduce((actions, actionKey) => {
      const action = manifestActions[actionKey];
      if (!action.menu) {
        //simple custom action
        actions.push(action);
      } else {
        // grouped actions
        actions = [...actions, ...action.menu.filter(menuAction => typeof menuAction !== "string")];
      }
      return actions;
    }, []);
    return !!customActions.find(action => {
      var _action$visible;
      return action.requiresSelection && (action.visible === undefined || ((_action$visible = action.visible) === null || _action$visible === void 0 ? void 0 : _action$visible.toString()) === "true");
    });
  }
  /**
   * Iterates over the custom actions (with key requiresSelection) declared in the manifest for the current line item and returns all the
   * visible key values as an expression.
   *
   * @param manifestActions The actions defined in the manifest
   * @returns Array<Expression<boolean>> All the visible path expressions of the actions that meet the criteria
   */
  function getVisibleExpForCustomActionsRequiringContext(manifestActions) {
    const aVisiblePathExpressions = [];
    if (manifestActions) {
      Object.keys(manifestActions).forEach(actionKey => {
        const action = manifestActions[actionKey];
        if (action.requiresSelection === true && action.visible !== undefined) {
          if (typeof action.visible === "string") {
            var _action$visible2;
            /*The final aim would be to check if the path expression depends on the parent context
            and considers only those expressions for the expression evaluation,
            but currently not possible from the manifest as the visible key is bound on the parent entity.
            Tricky to differentiate the path as it's done for the Hidden annotation.
            For the time being we consider all the paths of the manifest*/
            aVisiblePathExpressions.push(resolveBindingString(action === null || action === void 0 ? void 0 : (_action$visible2 = action.visible) === null || _action$visible2 === void 0 ? void 0 : _action$visible2.valueOf()));
          }
        }
      });
    }
    return aVisiblePathExpressions;
  }
  /**
   * Evaluate if the path is statically deletable or updatable.
   *
   * @param converterContext
   * @returns The table capabilities
   */
  function getCapabilityRestriction(converterContext) {
    const isDeletable = isPathDeletable(converterContext.getDataModelObjectPath());
    const isUpdatable = isPathUpdatable(converterContext.getDataModelObjectPath());
    return {
      isDeletable: !(isConstant(isDeletable) && isDeletable.value === false),
      isUpdatable: !(isConstant(isUpdatable) && isUpdatable.value === false)
    };
  }
  _exports.getCapabilityRestriction = getCapabilityRestriction;
  function getSelectionMode(lineItemAnnotation, visualizationPath, converterContext, isEntitySet, targetCapabilities, deleteButtonVisibilityExpression) {
    var _tableManifestSetting;
    let massEditVisibilityExpression = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : constant(false);
    const tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    let selectionMode = (_tableManifestSetting = tableManifestSettings.tableSettings) === null || _tableManifestSetting === void 0 ? void 0 : _tableManifestSetting.selectionMode;
    // If the selection mode is forced to 'None' in the manifest/macro table parameters, we ignore the rest of the logic and keep it as specified
    if (!lineItemAnnotation || selectionMode === SelectionMode.None) {
      return SelectionMode.None;
    }
    if (selectionMode === SelectionMode.ForceMulti) {
      return SelectionMode.Multi;
    } else if (selectionMode === SelectionMode.ForceSingle) {
      return SelectionMode.Single;
    }
    let aHiddenBindingExpressions = [],
      aVisibleBindingExpressions = [];
    const manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).actions, converterContext, [], undefined, false);
    let isParentDeletable, parentEntitySetDeletable;
    if (converterContext.getTemplateType() === TemplateType.ObjectPage) {
      isParentDeletable = isPathDeletable(converterContext.getDataModelObjectPath());
      parentEntitySetDeletable = isParentDeletable ? compileExpression(isParentDeletable, true) : isParentDeletable;
    }
    const bMassEditEnabled = !isConstant(massEditVisibilityExpression) || massEditVisibilityExpression.value !== false;
    if (!selectionMode || selectionMode === SelectionMode.Auto) {
      selectionMode = SelectionMode.Multi;
    }
    if (bMassEditEnabled) {
      // Override default selection mode when mass edit is visible
      selectionMode = selectionMode === SelectionMode.Single ? SelectionMode.Single : SelectionMode.Multi;
    }
    if (hasBoundActionsAlwaysVisibleInToolBar(lineItemAnnotation, manifestActions.actions, converterContext.getEntityType()) || hasCustomActionsAlwaysVisibleInToolBar(manifestActions.actions)) {
      return selectionMode;
    }
    aHiddenBindingExpressions = getUIHiddenExpForActionsRequiringContext(lineItemAnnotation, converterContext.getEntityType(), converterContext.getDataModelObjectPath(), isEntitySet);
    aVisibleBindingExpressions = getVisibleExpForCustomActionsRequiringContext(manifestActions.actions);
    // No action requiring a context:
    if (aHiddenBindingExpressions.length === 0 && aVisibleBindingExpressions.length === 0 && (deleteButtonVisibilityExpression || bMassEditEnabled)) {
      if (!isEntitySet) {
        // Example: OP case
        if (targetCapabilities.isDeletable || parentEntitySetDeletable !== "false" || bMassEditEnabled) {
          // Building expression for delete and mass edit
          const buttonVisibilityExpression = or(deleteButtonVisibilityExpression || true,
          // default delete visibility as true
          massEditVisibilityExpression);
          return compileExpression(ifElse(and(UI.IsEditable, buttonVisibilityExpression), constant(selectionMode), constant(SelectionMode.None)));
        } else {
          return SelectionMode.None;
        }
        // EntitySet deletable:
      } else if (bMassEditEnabled) {
        // example: LR scenario
        return selectionMode;
      } else if (targetCapabilities.isDeletable && deleteButtonVisibilityExpression) {
        return compileExpression(ifElse(deleteButtonVisibilityExpression, constant(selectionMode), constant("None")));
        // EntitySet not deletable:
      } else {
        return SelectionMode.None;
      }
      // There are actions requiring a context:
    } else if (!isEntitySet) {
      // Example: OP case
      if (targetCapabilities.isDeletable || parentEntitySetDeletable !== "false" || bMassEditEnabled) {
        // Use selectionMode in edit mode if delete is enabled or mass edit is visible
        const editModebuttonVisibilityExpression = ifElse(bMassEditEnabled && !targetCapabilities.isDeletable, massEditVisibilityExpression, constant(true));
        return compileExpression(ifElse(and(UI.IsEditable, editModebuttonVisibilityExpression), constant(selectionMode), ifElse(or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions)), constant(selectionMode), constant(SelectionMode.None))));
      } else {
        return compileExpression(ifElse(or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions)), constant(selectionMode), constant(SelectionMode.None)));
      }
      //EntitySet deletable:
    } else if (targetCapabilities.isDeletable || bMassEditEnabled) {
      // Example: LR scenario
      return selectionMode;
      //EntitySet not deletable:
    } else {
      return compileExpression(ifElse(or(...aHiddenBindingExpressions.concat(aVisibleBindingExpressions), massEditVisibilityExpression), constant(selectionMode), constant(SelectionMode.None)));
    }
  }
  /**
   * Method to retrieve all table actions from annotations.
   *
   * @param lineItemAnnotation
   * @param visualizationPath
   * @param converterContext
   * @returns The table annotation actions
   */
  _exports.getSelectionMode = getSelectionMode;
  function getTableAnnotationActions(lineItemAnnotation, visualizationPath, converterContext) {
    const tableActions = [];
    const hiddenTableActions = [];
    const copyDataField = getCopyAction(lineItemAnnotation.filter(dataField => {
      return dataFieldIsCopyAction(dataField);
    }));
    const sEntityType = converterContext.getEntityType().fullyQualifiedName;
    if (copyDataField) {
      var _copyDataField$annota, _copyDataField$annota2, _copyDataField$Label;
      const useEnabledExpression = _useEnabledExpression(copyDataField, sEntityType);
      tableActions.push({
        type: ActionType.Copy,
        annotationPath: converterContext.getEntitySetBasedAnnotationPath(copyDataField.fullyQualifiedName),
        key: KeyHelper.generateKeyFromDataField(copyDataField),
        // Use OperationAvailable if defined, otherwise default to one selected item
        enabled: useEnabledExpression ? getEnabledForAnnotationAction(converterContext, copyDataField.ActionTarget, true) : compileExpression(equal(pathInModel("numberOfSelectedContexts", "internal"), 1)),
        visible: compileExpression(not(equal(getExpressionFromAnnotation((_copyDataField$annota = copyDataField.annotations) === null || _copyDataField$annota === void 0 ? void 0 : (_copyDataField$annota2 = _copyDataField$annota.UI) === null || _copyDataField$annota2 === void 0 ? void 0 : _copyDataField$annota2.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true))),
        text: ((_copyDataField$Label = copyDataField.Label) === null || _copyDataField$Label === void 0 ? void 0 : _copyDataField$Label.toString()) ?? Core.getLibraryResourceBundle("sap.fe.core").getText("C_COMMON_COPY"),
        isNavigable: true
      });
    }
    lineItemAnnotation.filter(dataField => {
      return !dataFieldIsCopyAction(dataField);
    }).forEach(dataField => {
      var _dataField$annotation10, _dataField$annotation11, _dataField$annotation12, _dataField$Inline3, _dataField$Determinin, _dataField$annotation13, _dataField$annotation14, _dataField$annotation15, _dataField$annotation16;
      if (((_dataField$annotation10 = dataField.annotations) === null || _dataField$annotation10 === void 0 ? void 0 : (_dataField$annotation11 = _dataField$annotation10.UI) === null || _dataField$annotation11 === void 0 ? void 0 : (_dataField$annotation12 = _dataField$annotation11.Hidden) === null || _dataField$annotation12 === void 0 ? void 0 : _dataField$annotation12.valueOf()) === true) {
        hiddenTableActions.push({
          type: ActionType.Default,
          key: KeyHelper.generateKeyFromDataField(dataField)
        });
      } else if (isDataFieldForActionAbstract(dataField) && ((_dataField$Inline3 = dataField.Inline) === null || _dataField$Inline3 === void 0 ? void 0 : _dataField$Inline3.valueOf()) !== true && ((_dataField$Determinin = dataField.Determining) === null || _dataField$Determinin === void 0 ? void 0 : _dataField$Determinin.valueOf()) !== true) {
        switch (dataField.$Type) {
          case "com.sap.vocabularies.UI.v1.DataFieldForAction":
            const tableAction = {
              type: ActionType.DataFieldForAction,
              annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(not(equal(getExpressionFromAnnotation((_dataField$annotation13 = dataField.annotations) === null || _dataField$annotation13 === void 0 ? void 0 : (_dataField$annotation14 = _dataField$annotation13.UI) === null || _dataField$annotation14 === void 0 ? void 0 : _dataField$annotation14.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true))),
              isNavigable: true
            };
            if (_useEnabledExpression(dataField, sEntityType)) {
              tableAction.enabled = getEnabledForAnnotationAction(converterContext, dataField.ActionTarget, true);
            }
            tableActions.push(tableAction);
            break;
          case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
            tableActions.push({
              type: ActionType.DataFieldForIntentBasedNavigation,
              annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(not(equal(getExpressionFromAnnotation((_dataField$annotation15 = dataField.annotations) === null || _dataField$annotation15 === void 0 ? void 0 : (_dataField$annotation16 = _dataField$annotation15.UI) === null || _dataField$annotation16 === void 0 ? void 0 : _dataField$annotation16.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true)))
            });
            break;
          default:
            break;
        }
      }
    });
    return {
      tableActions,
      hiddenTableActions
    };
  }
  /**
   * Generate the bindingExpression for the highlight rowSetting parameter.
   *
   * @param criticalityAnnotation Path or value of the criticality
   * @param isDraftRootOrNode  Is the current entitySet an Draft root or a node
   * @param targetEntityType The targeted entityType
   * @returns An expressionBinding
   */
  function getHighlightRowBinding(criticalityAnnotation, isDraftRootOrNode, targetEntityType) {
    let defaultHighlightRowDefinition = MessageType.None;
    if (criticalityAnnotation) {
      if (typeof criticalityAnnotation === "object") {
        defaultHighlightRowDefinition = getExpressionFromAnnotation(criticalityAnnotation);
      } else {
        // Enum Value so we get the corresponding static part
        defaultHighlightRowDefinition = getMessageTypeFromCriticalityType(criticalityAnnotation);
      }
    }
    const aMissingKeys = [];
    targetEntityType === null || targetEntityType === void 0 ? void 0 : targetEntityType.keys.forEach(key => {
      if (key.name !== "IsActiveEntity") {
        aMissingKeys.push(pathInModel(key.name, undefined));
      }
    });
    return formatResult([defaultHighlightRowDefinition, pathInModel(`filteredMessages`, "internal"), isDraftRootOrNode && Entity.HasActive, isDraftRootOrNode && Entity.IsActive, `${isDraftRootOrNode}`, ...aMissingKeys], tableFormatters.rowHighlighting, targetEntityType);
  }
  function _getCreationBehaviour(lineItemAnnotation, tableManifestConfiguration, converterContext, navigationSettings, visualizationPath) {
    var _newAction2;
    const navigation = (navigationSettings === null || navigationSettings === void 0 ? void 0 : navigationSettings.create) || (navigationSettings === null || navigationSettings === void 0 ? void 0 : navigationSettings.detail);
    const tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const originalTableSettings = tableManifestSettings && tableManifestSettings.tableSettings || {};
    // cross-app
    if (navigation !== null && navigation !== void 0 && navigation.outbound && navigation.outboundDetail && navigationSettings !== null && navigationSettings !== void 0 && navigationSettings.create) {
      return {
        mode: "External",
        outbound: navigation.outbound,
        outboundDetail: navigation.outboundDetail,
        navigationSettings: navigationSettings
      };
    }
    if (converterContext.getTemplateType() === TemplateType.ListReport && ![CreationMode.NewPage, CreationMode.External].includes(tableManifestConfiguration.creationMode)) {
      // Fallback to "NewPage"
      Log.warning(`Creation mode '${tableManifestConfiguration.creationMode}' can not be used within the List Report. Instead, the default mode "NewPage" is used.`);
      tableManifestConfiguration.creationMode = CreationMode.NewPage;
    } else if (converterContext.getTemplateType() !== TemplateType.ListReport && tableManifestConfiguration.type === "TreeTable" && ![CreationMode.NewPage, CreationMode.Inline].includes(tableManifestConfiguration.creationMode)) {
      // Fallback to "NewPage" in case of a non-supported mode for a TreeTable
      Log.warning(`Creation mode '${tableManifestConfiguration.creationMode}' can not be used with a Tree Table. Instead, the default mode "NewPage" is used.`);
      tableManifestConfiguration.creationMode = CreationMode.NewPage;
    }
    let newAction;
    if (lineItemAnnotation) {
      var _converterContext$get14, _targetAnnotationsCom, _targetAnnotationsSes;
      // in-app
      const targetAnnotations = (_converterContext$get14 = converterContext.getEntitySet()) === null || _converterContext$get14 === void 0 ? void 0 : _converterContext$get14.annotations;
      const targetAnnotationsCommon = targetAnnotations === null || targetAnnotations === void 0 ? void 0 : targetAnnotations.Common,
        targetAnnotationsSession = targetAnnotations === null || targetAnnotations === void 0 ? void 0 : targetAnnotations.Session;
      newAction = (targetAnnotationsCommon === null || targetAnnotationsCommon === void 0 ? void 0 : (_targetAnnotationsCom = targetAnnotationsCommon.DraftRoot) === null || _targetAnnotationsCom === void 0 ? void 0 : _targetAnnotationsCom.NewAction) || (targetAnnotationsSession === null || targetAnnotationsSession === void 0 ? void 0 : (_targetAnnotationsSes = targetAnnotationsSession.StickySessionSupported) === null || _targetAnnotationsSes === void 0 ? void 0 : _targetAnnotationsSes.NewAction);
      if (tableManifestConfiguration.creationMode === CreationMode.CreationRow && newAction) {
        // A combination of 'CreationRow' and 'NewAction' does not make sense
        throw Error(`Creation mode '${CreationMode.CreationRow}' can not be used with a custom 'new' action (${newAction})`);
      }
      if (navigation !== null && navigation !== void 0 && navigation.route) {
        var _newAction;
        // route specified
        return {
          mode: tableManifestConfiguration.creationMode,
          append: tableManifestConfiguration.createAtEnd,
          newAction: (_newAction = newAction) === null || _newAction === void 0 ? void 0 : _newAction.toString(),
          navigateToTarget: tableManifestConfiguration.creationMode === CreationMode.NewPage ? navigation.route : undefined // navigate only in NewPage mode
        };
      }
    }
    // no navigation or no route specified - fallback to inline create if original creation mode was 'NewPage'
    if (tableManifestConfiguration.creationMode === CreationMode.NewPage) {
      if (converterContext.getTemplateType() === TemplateType.ListReport) {
        Log.error("The creation mode 'NewPage' is used but the navigation configuration to the sub page is missing.");
      } else {
        var _originalTableSetting;
        tableManifestConfiguration.creationMode = CreationMode.Inline;
        // In case there was no specific configuration for the createAtEnd we force it to false
        if (((_originalTableSetting = originalTableSettings.creationMode) === null || _originalTableSetting === void 0 ? void 0 : _originalTableSetting.createAtEnd) === undefined) {
          tableManifestConfiguration.createAtEnd = false;
        }
        Log.info("The creation mode was changed from 'NewPage' to 'Inline' due to missing navigation configuration to the sub page.");
      }
    }
    return {
      mode: tableManifestConfiguration.creationMode,
      append: tableManifestConfiguration.createAtEnd,
      newAction: (_newAction2 = newAction) === null || _newAction2 === void 0 ? void 0 : _newAction2.toString()
    };
  }
  const _getRowConfigurationProperty = function (lineItemAnnotation, converterContext, navigationSettings, targetPath, tableType) {
    let pressProperty, navigationTarget;
    let criticalityProperty = constant(MessageType.None);
    const targetEntityType = converterContext.getEntityType();
    if (navigationSettings && lineItemAnnotation) {
      var _navigationSettings$d, _navigationSettings$d2, _lineItemAnnotation$a, _lineItemAnnotation$a2, _navigationSettings$d3;
      navigationTarget = ((_navigationSettings$d = navigationSettings.display) === null || _navigationSettings$d === void 0 ? void 0 : _navigationSettings$d.target) || ((_navigationSettings$d2 = navigationSettings.detail) === null || _navigationSettings$d2 === void 0 ? void 0 : _navigationSettings$d2.outbound);
      const targetEntitySet = converterContext.getEntitySet();
      criticalityProperty = getHighlightRowBinding((_lineItemAnnotation$a = lineItemAnnotation.annotations) === null || _lineItemAnnotation$a === void 0 ? void 0 : (_lineItemAnnotation$a2 = _lineItemAnnotation$a.UI) === null || _lineItemAnnotation$a2 === void 0 ? void 0 : _lineItemAnnotation$a2.Criticality, !!ModelHelper.getDraftRoot(targetEntitySet) || !!ModelHelper.getDraftNode(targetEntitySet), targetEntityType);
      if (navigationTarget) {
        pressProperty = ".handlers.onChevronPressNavigateOutBound( $controller ,'" + navigationTarget + "', ${$parameters>bindingContext})";
      }
      if (!navigationTarget && (_navigationSettings$d3 = navigationSettings.detail) !== null && _navigationSettings$d3 !== void 0 && _navigationSettings$d3.route) {
        pressProperty = "API.onTableRowPress($event, $controller, ${$parameters>bindingContext}, { callExtension: true, targetPath: '" + targetPath + "', editable : " + (ModelHelper.getDraftRoot(targetEntitySet) || ModelHelper.getDraftNode(targetEntitySet) ? "!${$parameters>bindingContext}.getProperty('IsActiveEntity')" : "undefined") + (tableType === "AnalyticalTable" || tableType === "TreeTable" ? ", bRecreateContext: true" : "") + "})"; //Need to access to DraftRoot and DraftNode !!!!!!!
      }
    }

    const rowNavigatedExpression = formatResult([pathInModel("/deepestPath", "internal")], tableFormatters.navigatedRow, targetEntityType);
    return {
      press: pressProperty,
      action: pressProperty ? "Navigation" : undefined,
      rowHighlighting: compileExpression(criticalityProperty),
      rowNavigated: compileExpression(rowNavigatedExpression),
      visible: compileExpression(not(UI.IsInactive))
    };
  };
  /**
   * Retrieve the columns from the entityType.
   *
   * @param columnsToBeCreated The columns to be created.
   * @param entityType The target entity type.
   * @param annotationColumns The array of columns created based on LineItem annotations.
   * @param nonSortableColumns The array of all non sortable column names.
   * @param converterContext The converter context.
   * @param tableType The table type.
   * @param textOnlyColumnsFromTextAnnotation The array of columns from a property using a text annotation with textOnly as text arrangement.
   * @returns The column from the entityType
   */
  const getColumnsFromEntityType = function (columnsToBeCreated, entityType) {
    let annotationColumns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    let nonSortableColumns = arguments.length > 3 ? arguments[3] : undefined;
    let converterContext = arguments.length > 4 ? arguments[4] : undefined;
    let tableType = arguments.length > 5 ? arguments[5] : undefined;
    let tableCreationMode = arguments.length > 6 ? arguments[6] : undefined;
    let textOnlyColumnsFromTextAnnotation = arguments.length > 7 ? arguments[7] : undefined;
    const tableColumns = annotationColumns;
    // Catch already existing columns - which were added before by LineItem Annotations
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    entityType.entityProperties.forEach(property => {
      // Catch already existing columns - which were added before by LineItem Annotations
      const exists = annotationColumns.some(column => {
        return column.name === property.name;
      });
      // if target type exists, it is a complex property and should be ignored
      if (!property.targetType && !exists) {
        const relatedPropertiesInfo = collectRelatedProperties(property.name, property, converterContext, true, tableType);
        const relatedPropertyNames = Object.keys(relatedPropertiesInfo.properties);
        const additionalPropertyNames = Object.keys(relatedPropertiesInfo.additionalProperties);
        if (relatedPropertiesInfo.textOnlyPropertiesFromTextAnnotation.length > 0) {
          // Include text properties found during analysis on getColumnsFromAnnotations
          textOnlyColumnsFromTextAnnotation.push(...relatedPropertiesInfo.textOnlyPropertiesFromTextAnnotation);
        }
        const columnInfo = getColumnDefinitionFromProperty(property, converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName), property.name, true, true, nonSortableColumns, aggregationHelper, converterContext, textOnlyColumnsFromTextAnnotation, tableCreationMode, relatedPropertiesInfo);
        if (relatedPropertyNames.length > 0) {
          columnInfo.propertyInfos = relatedPropertyNames;
          if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
            columnInfo.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
          }
          // Collect information of related columns to be created.
          relatedPropertyNames.forEach(name => {
            columnsToBeCreated[name] = relatedPropertiesInfo.properties[name];
          });
        }
        // update Property Label when it's referenced only once in a column, new label will be the label of the column
        updatePropertyLabel(annotationColumns, columnsToBeCreated, columnInfo);
        if (additionalPropertyNames.length > 0) {
          columnInfo.additionalPropertyInfos = additionalPropertyNames;
          // Create columns for additional properties identified for ALP use case.
          additionalPropertyNames.forEach(name => {
            // Intentional overwrite as we require only one new PropertyInfo for a related Property.
            columnsToBeCreated[name] = relatedPropertiesInfo.additionalProperties[name];
          });
        }
        tableColumns.push(columnInfo);
      }
      // In case a property has defined a #TextOnly text arrangement don't only create the complex property with the text property as a child property,
      // but also the property itself as it can be used as within the sortConditions or on custom columns.
      // This step must be valide also from the columns added via LineItems or from a column available on the p13n.
      if (getDisplayMode(property) === "Description") {
        nonSortableColumns = nonSortableColumns.concat(property.name);
        tableColumns.push(getColumnDefinitionFromProperty(property, converterContext.getEntitySetBasedAnnotationPath(property.fullyQualifiedName), property.name, false, false, nonSortableColumns, aggregationHelper, converterContext, [], tableCreationMode));
      }
    });
    // Create a propertyInfo for each related property.
    const relatedColumns = _createRelatedColumns(columnsToBeCreated, tableColumns, nonSortableColumns, converterContext, entityType, textOnlyColumnsFromTextAnnotation, tableCreationMode);
    return tableColumns.concat(relatedColumns);
  };
  /**
   * Create a column definition from a property.
   *
   * @param property Entity type property for which the column is created
   * @param fullPropertyPath The full path to the target property
   * @param relativePath The relative path to the target property based on the context
   * @param useDataFieldPrefix Should be prefixed with "DataField::", else it will be prefixed with "Property::"
   * @param availableForAdaptation Decides whether the column should be available for adaptation
   * @param nonSortableColumns The array of all non-sortable column names
   * @param aggregationHelper The aggregationHelper for the entity
   * @param converterContext The converter context
   * @param textOnlyColumnsFromTextAnnotation The array of columns from a property using a text annotation with textOnly as text arrangement.
   * @returns The annotation column definition
   */
  _exports.getColumnsFromEntityType = getColumnsFromEntityType;
  const getColumnDefinitionFromProperty = function (property, fullPropertyPath, relativePath, useDataFieldPrefix, availableForAdaptation, nonSortableColumns, aggregationHelper, converterContext, textOnlyColumnsFromTextAnnotation, tableCreationMode, relatedPropertiesInfo) {
    var _property$annotations, _property$annotations2;
    const name = useDataFieldPrefix ? relativePath : `Property::${relativePath}`;
    const key = (useDataFieldPrefix ? "DataField::" : "Property::") + replaceSpecialChars(relativePath);
    const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, property);
    const isHidden = isReferencePropertyStaticallyHidden(property);
    const groupPath = property.name ? _sliceAtSlash(property.name, true, false) : undefined;
    const isGroup = groupPath != property.name;
    const label = getLabel(property, isGroup);
    const dataType = getDataFieldDataType(property);
    const propertyTypeConfig = getTypeConfig(property, dataType);
    const isAPropertyFromTextOnlyAnnotation = textOnlyColumnsFromTextAnnotation && textOnlyColumnsFromTextAnnotation.includes(relativePath);
    const sortable = (!isHidden || isAPropertyFromTextOnlyAnnotation) && !nonSortableColumns.includes(relativePath);
    const typeConfig = {
      className: property.type || dataType,
      formatOptions: propertyTypeConfig.formatOptions,
      constraints: propertyTypeConfig.constraints
    };
    let exportSettings = null;
    if (_isExportableColumn(property)) {
      exportSettings = createColumnExportSettings(property, relatedPropertiesInfo);
    }
    const collectedNavigationPropertyLabels = _getCollectedNavigationPropertyLabels(relativePath, converterContext);
    const column = {
      key: key,
      type: ColumnType.Annotation,
      label: label,
      groupLabel: isGroup ? getLabel(property) : undefined,
      group: isGroup ? groupPath : undefined,
      annotationPath: fullPropertyPath,
      semanticObjectPath: semanticObjectAnnotationPath,
      availability: !availableForAdaptation || isHidden ? "Hidden" : "Adaptation",
      name: name,
      relativePath: relativePath,
      sortable: sortable,
      isGroupable: aggregationHelper.isAnalyticsSupported() ? !!aggregationHelper.isPropertyGroupable(property) : sortable,
      isKey: property.isKey,
      exportSettings: exportSettings,
      caseSensitive: isFilteringCaseSensitive(converterContext),
      typeConfig: typeConfig,
      importance: getImportance(converterContext, (_property$annotations = property.annotations) === null || _property$annotations === void 0 ? void 0 : (_property$annotations2 = _property$annotations.UI) === null || _property$annotations2 === void 0 ? void 0 : _property$annotations2.DataFieldDefault),
      required: isRequiredColumn(converterContext, property, tableCreationMode),
      additionalLabels: collectedNavigationPropertyLabels
    };
    const tooltip = _getTooltip(property) || label;
    if (tooltip) {
      column.tooltip = tooltip;
    }
    const targetValuefromDP = getTargetValueOnDataPoint(property);
    if (isDataPointFromDataFieldDefault(property) && typeof targetValuefromDP === "string" && column.exportSettings) {
      column.exportDataPointTargetValue = targetValuefromDP;
      column.exportSettings.template = "{0}/" + targetValuefromDP;
    }
    return column;
  };
  /**
   * Create the export settings for a given column.
   *
   * @param column The given column from a line item as a data field or a property from the entity type
   * @param relatedPropertiesInfo The related properties linked to the column (named also complex property)
   * @returns The export settings in a the given column
   */
  const createColumnExportSettings = function (column, relatedPropertiesInfo) {
    var _relatedPropertiesInf, _unitProperty, _currencyProperty, _relatedPropertiesInf2, _timezoneProperty, _relatedPropertiesInf3, _timezoneText;
    let unitProperty, timezoneProperty, unitText, timezoneText, utc, isATimezone, currencyProperty, scale;
    const relatedPropertyNames = relatedPropertiesInfo ? Object.keys(relatedPropertiesInfo.properties) : [];
    if (relatedPropertiesInfo && (relatedPropertyNames === null || relatedPropertyNames === void 0 ? void 0 : relatedPropertyNames.length) === 1) {
      // Create the export settings of a column based on the related (child) property in case there is only one.
      // This is required when we have a text only annotation to compute the export settings from the text instead of the value
      column = relatedPropertiesInfo.properties[relatedPropertyNames[0]];
    }
    const dataType = getDataFieldDataType(column);
    if (isProperty(column)) {
      unitProperty = getAssociatedUnitProperty(column);
      currencyProperty = getAssociatedCurrencyProperty(column);
      timezoneProperty = getAssociatedTimezoneProperty(column);
      unitText = getStaticUnitOrCurrency(column);
      timezoneText = getStaticTimezone(column);
      isATimezone = isTimezone(column);
      scale = column.scale;
    }
    unitProperty = (relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : (_relatedPropertiesInf = relatedPropertiesInfo.exportSettings) === null || _relatedPropertiesInf === void 0 ? void 0 : _relatedPropertiesInf.unitProperty) ?? ((_unitProperty = unitProperty) === null || _unitProperty === void 0 ? void 0 : _unitProperty.name) ?? ((_currencyProperty = currencyProperty) === null || _currencyProperty === void 0 ? void 0 : _currencyProperty.name);
    timezoneProperty = (relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : (_relatedPropertiesInf2 = relatedPropertiesInfo.exportSettings) === null || _relatedPropertiesInf2 === void 0 ? void 0 : _relatedPropertiesInf2.timezoneProperty) ?? ((_timezoneProperty = timezoneProperty) === null || _timezoneProperty === void 0 ? void 0 : _timezoneProperty.name);
    scale = (relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : (_relatedPropertiesInf3 = relatedPropertiesInfo.exportSettings) === null || _relatedPropertiesInf3 === void 0 ? void 0 : _relatedPropertiesInf3.scale) ?? scale;
    const exportType = getExportDataType(dataType, isATimezone, !!currencyProperty, relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : relatedPropertiesInfo.exportSettings);
    if (timezoneProperty || exportType === "DateTime" && !timezoneText) {
      utc = false;
    }
    const exportSettings = {
      type: exportType,
      inputFormat: getDateInputFormat(dataType),
      delimiter: getDelimiter(dataType),
      scale: scale,
      unitProperty: unitProperty,
      unit: (relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : relatedPropertiesInfo.exportSettings.unit) ?? unitText,
      timezoneProperty: timezoneProperty,
      timezone: (relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : relatedPropertiesInfo.exportSettings.timezone) ?? ((_timezoneText = timezoneText) === null || _timezoneText === void 0 ? void 0 : _timezoneText.toString()),
      template: relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : relatedPropertiesInfo.exportSettings.template,
      //only in case of complex properties, wrap the cell content	on the excel exported file
      wrap: relatedPropertiesInfo === null || relatedPropertiesInfo === void 0 ? void 0 : relatedPropertiesInfo.exportSettings.wrap,
      utc: utc
    };
    return removeUndefinedFromExportSettings(exportSettings);
  };
  /**
   * Gets the export format template for columns with dates.
   *
   * @param dataType The data type of the column
   * @returns The inputFormat
   */
  const getDateInputFormat = function (dataType) {
    return dataType === "Edm.Date" ? "YYYY-MM-DD" : undefined;
  };
  /**
   * Gets the delimiter in numeric columns.
   * The delimiter is used to display thousands separator in numeric columns.
   *
   * @param dataType The data type of the column
   * @returns True to display thousands separator in numeric columns
   */
  const getDelimiter = function (dataType) {
    return dataType === "Edm.Int64" ? true : undefined;
  };
  /**
   *
   * Removes undefined values from the export settings object of a column.
   *
   * @param exportSettings The export settings configurations for a column
   * @returns The export settings configurations without undefined values
   */
  const removeUndefinedFromExportSettings = function (exportSettings) {
    //Remove undefined settings from exportSetting object
    for (const setting in exportSettings) {
      if (exportSettings[setting] === undefined) {
        delete exportSettings[setting];
      }
    }
    return exportSettings;
  };
  /**
   * Update property label in case it's only referenced in one column. The label of the column must be used instead of the property label.
   * This update also is applied for the tooltip as it is based on the column's label
   *
   * @param annotationColumns The array of columns created based on LineItem annotations.
   * @param columnsToBeCreated The columns to be created
   * @param columnInfo The column definition
   */
  function updatePropertyLabel(annotationColumns, columnsToBeCreated, columnInfo) {
    var _linkedAnnotationColu;
    const linkedAnnotationColumns = annotationColumns.filter(col => {
      var _col$propertyInfos;
      return (_col$propertyInfos = col.propertyInfos) === null || _col$propertyInfos === void 0 ? void 0 : _col$propertyInfos.includes(columnInfo.relativePath);
    });
    if ((linkedAnnotationColumns === null || linkedAnnotationColumns === void 0 ? void 0 : linkedAnnotationColumns.length) === 1 && columnsToBeCreated[columnInfo.relativePath] && ((_linkedAnnotationColu = linkedAnnotationColumns[0].propertyInfos) === null || _linkedAnnotationColu === void 0 ? void 0 : _linkedAnnotationColu.length) === 1) {
      columnInfo.label = linkedAnnotationColumns[0].label;
      columnInfo.tooltip = linkedAnnotationColumns[0].tooltip;
    }
  }
  /**
   * Returns Boolean true for exportable columns, false for non exportable columns.
   *
   * @param source The dataField or property to be evaluated
   * @returns True for exportable column, false for non exportable column
   */
  function _isExportableColumn(source) {
    var _annotations$UI;
    let propertyType, property;
    const dataFieldDefaultProperty = (_annotations$UI = source.annotations.UI) === null || _annotations$UI === void 0 ? void 0 : _annotations$UI.DataFieldDefault;
    if (isProperty(source)) {
      if (isReferencePropertyStaticallyHidden(source)) {
        return false;
      }
      propertyType = dataFieldDefaultProperty === null || dataFieldDefaultProperty === void 0 ? void 0 : dataFieldDefaultProperty.$Type;
    } else if (isReferencePropertyStaticallyHidden(source)) {
      return false;
    } else {
      var _Target, _Target$$target, _Value, _Value$$target, _Value$$target$annota, _Value$$target$annota2, _Value$$target$annota3, _Value2, _Value2$$target, _Value2$$target$annot, _Value2$$target$annot2;
      property = source;
      propertyType = property.$Type;
      if (propertyType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && (_Target = property.Target) !== null && _Target !== void 0 && (_Target$$target = _Target.$target) !== null && _Target$$target !== void 0 && _Target$$target.$Type) {
        var _Target2, _Target2$$target;
        //For Chart
        propertyType = (_Target2 = property.Target) === null || _Target2 === void 0 ? void 0 : (_Target2$$target = _Target2.$target) === null || _Target2$$target === void 0 ? void 0 : _Target2$$target.$Type;
        return propertyType !== undefined && !"com.sap.vocabularies.UI.v1.ChartDefinitionType".includes(propertyType);
      } else if (((_Value = property.Value) === null || _Value === void 0 ? void 0 : (_Value$$target = _Value.$target) === null || _Value$$target === void 0 ? void 0 : (_Value$$target$annota = _Value$$target.annotations) === null || _Value$$target$annota === void 0 ? void 0 : (_Value$$target$annota2 = _Value$$target$annota.Core) === null || _Value$$target$annota2 === void 0 ? void 0 : (_Value$$target$annota3 = _Value$$target$annota2.MediaType) === null || _Value$$target$annota3 === void 0 ? void 0 : _Value$$target$annota3.term) === "Org.OData.Core.V1.MediaType" && ((_Value2 = property.Value) === null || _Value2 === void 0 ? void 0 : (_Value2$$target = _Value2.$target) === null || _Value2$$target === void 0 ? void 0 : (_Value2$$target$annot = _Value2$$target.annotations) === null || _Value2$$target$annot === void 0 ? void 0 : (_Value2$$target$annot2 = _Value2$$target$annot.Core) === null || _Value2$$target$annot2 === void 0 ? void 0 : _Value2$$target$annot2.isURL) !== true) {
        //For Stream
        return false;
      }
    }
    return propertyType ? !["com.sap.vocabularies.UI.v1.DataFieldForAction", "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldForActionGroup"].includes(propertyType) : true;
  }
  /**
   * Returns Boolean true for valid columns, false for invalid columns.
   *
   * @param dataField Different DataField types defined in the annotations
   * @returns True for valid columns, false for invalid columns
   */
  const _isValidColumn = function (dataField) {
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        return !!dataField.Inline;
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        return true;
      default:
      // Todo: Replace with proper Log statement once available
      //  throw new Error("Unhandled DataField Abstract type: " + dataField.$Type);
    }
  };
  /**
   * Returns the binding expression to evaluate the visibility of a DataField or DataPoint annotation.
   *
   * SAP Fiori elements will evaluate either the UI.Hidden annotation defined on the annotation itself or on the target property.
   *
   * @param dataFieldModelPath The metapath referring to the annotation that is evaluated by SAP Fiori elements.
   * @returns An expression that you can bind to the UI.
   */
  const _getVisibleExpression = function (dataFieldModelPath) {
    var _targetObject$Target, _targetObject$Target$, _targetObject$annotat, _targetObject$annotat2, _propertyValue$annota, _propertyValue$annota2;
    const targetObject = dataFieldModelPath.targetObject;
    let propertyValue;
    if (targetObject) {
      switch (targetObject.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        case "com.sap.vocabularies.UI.v1.DataPointType":
          propertyValue = targetObject.Value.$target;
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          // if it is a DataFieldForAnnotation pointing to a DataPoint we look at the dataPoint's value
          if ((targetObject === null || targetObject === void 0 ? void 0 : (_targetObject$Target = targetObject.Target) === null || _targetObject$Target === void 0 ? void 0 : (_targetObject$Target$ = _targetObject$Target.$target) === null || _targetObject$Target$ === void 0 ? void 0 : _targetObject$Target$.$Type) === "com.sap.vocabularies.UI.v1.DataPointType") {
            var _targetObject$Target$2;
            propertyValue = (_targetObject$Target$2 = targetObject.Target.$target) === null || _targetObject$Target$2 === void 0 ? void 0 : _targetObject$Target$2.Value.$target;
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        default:
          propertyValue = undefined;
      }
    }
    // FIXME Prove me wrong that this is useless
    const isAnalyticalGroupHeaderExpanded = /*formatOptions?.isAnalytics ? UI.IsExpanded :*/constant(false);
    const isAnalyticalLeaf = /*formatOptions?.isAnalytics ? equal(UI.NodeLevel, 0) :*/constant(false);
    // A data field is visible if:
    // - the UI.Hidden expression in the original annotation does not evaluate to 'true'
    // - the UI.Hidden expression in the target property does not evaluate to 'true'
    // - in case of Analytics it's not visible for an expanded GroupHeader
    return and(...[not(equal(getExpressionFromAnnotation(targetObject === null || targetObject === void 0 ? void 0 : (_targetObject$annotat = targetObject.annotations) === null || _targetObject$annotat === void 0 ? void 0 : (_targetObject$annotat2 = _targetObject$annotat.UI) === null || _targetObject$annotat2 === void 0 ? void 0 : _targetObject$annotat2.Hidden), true)), ifElse(!!propertyValue, propertyValue && not(equal(getExpressionFromAnnotation((_propertyValue$annota = propertyValue.annotations) === null || _propertyValue$annota === void 0 ? void 0 : (_propertyValue$annota2 = _propertyValue$annota.UI) === null || _propertyValue$annota2 === void 0 ? void 0 : _propertyValue$annota2.Hidden), true)), true), or(not(isAnalyticalGroupHeaderExpanded), isAnalyticalLeaf)]);
  };
  /**
   * Returns hidden binding expressions for a field group.
   *
   * @param dataFieldGroup DataField defined in the annotations
   * @returns Compile binding of field group expressions.
   */
  _exports._getVisibleExpression = _getVisibleExpression;
  const _getFieldGroupHiddenExpressions = function (dataFieldGroup) {
    var _dataFieldGroup$Targe, _dataFieldGroup$Targe2;
    const fieldGroupHiddenExpressions = [];
    if (dataFieldGroup.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && ((_dataFieldGroup$Targe = dataFieldGroup.Target) === null || _dataFieldGroup$Targe === void 0 ? void 0 : (_dataFieldGroup$Targe2 = _dataFieldGroup$Targe.$target) === null || _dataFieldGroup$Targe2 === void 0 ? void 0 : _dataFieldGroup$Targe2.$Type) === "com.sap.vocabularies.UI.v1.FieldGroupType") {
      var _dataFieldGroup$annot, _dataFieldGroup$annot2;
      if (dataFieldGroup !== null && dataFieldGroup !== void 0 && (_dataFieldGroup$annot = dataFieldGroup.annotations) !== null && _dataFieldGroup$annot !== void 0 && (_dataFieldGroup$annot2 = _dataFieldGroup$annot.UI) !== null && _dataFieldGroup$annot2 !== void 0 && _dataFieldGroup$annot2.Hidden) {
        return compileExpression(not(equal(getExpressionFromAnnotation(dataFieldGroup.annotations.UI.Hidden), true)));
      } else {
        var _dataFieldGroup$Targe3;
        (_dataFieldGroup$Targe3 = dataFieldGroup.Target.$target.Data) === null || _dataFieldGroup$Targe3 === void 0 ? void 0 : _dataFieldGroup$Targe3.forEach(innerDataField => {
          fieldGroupHiddenExpressions.push(_getVisibleExpression({
            targetObject: innerDataField
          }));
        });
        return compileExpression(ifElse(or(...fieldGroupHiddenExpressions), constant(true), constant(false)));
      }
    } else {
      return undefined;
    }
  };
  /**
   * Returns the label for the property and dataField.
   *
   * @param [property] Property, DataField or Navigation Property defined in the annotations
   * @param isGroup
   * @returns Label of the property or DataField
   */
  const getLabel = function (property) {
    let isGroup = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (!property) {
      return undefined;
    }
    if (isProperty(property) || isNavigationProperty(property)) {
      var _annotations, _annotations$UI2, _property$annotations3, _property$annotations4;
      const dataFieldDefault = (_annotations = property.annotations) === null || _annotations === void 0 ? void 0 : (_annotations$UI2 = _annotations.UI) === null || _annotations$UI2 === void 0 ? void 0 : _annotations$UI2.DataFieldDefault;
      if (dataFieldDefault && !dataFieldDefault.qualifier && dataFieldDefault.Label) {
        var _dataFieldDefault$Lab;
        return (_dataFieldDefault$Lab = dataFieldDefault.Label) === null || _dataFieldDefault$Lab === void 0 ? void 0 : _dataFieldDefault$Lab.toString();
      }
      return ((_property$annotations3 = property.annotations.Common) === null || _property$annotations3 === void 0 ? void 0 : (_property$annotations4 = _property$annotations3.Label) === null || _property$annotations4 === void 0 ? void 0 : _property$annotations4.toString()) ?? property.name;
    } else if (isDataFieldTypes(property)) {
      var _property$Label2, _property$Value, _property$Value$$targ, _property$Value$$targ2, _property$Value$$targ3, _property$Value2, _property$Value2$$tar;
      if (!!isGroup && property.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation") {
        var _property$Label;
        return property === null || property === void 0 ? void 0 : (_property$Label = property.Label) === null || _property$Label === void 0 ? void 0 : _property$Label.toString();
      }
      return (property === null || property === void 0 ? void 0 : (_property$Label2 = property.Label) === null || _property$Label2 === void 0 ? void 0 : _property$Label2.toString()) ?? compileExpression(getExpressionFromAnnotation((_property$Value = property.Value) === null || _property$Value === void 0 ? void 0 : (_property$Value$$targ = _property$Value.$target) === null || _property$Value$$targ === void 0 ? void 0 : (_property$Value$$targ2 = _property$Value$$targ.annotations) === null || _property$Value$$targ2 === void 0 ? void 0 : (_property$Value$$targ3 = _property$Value$$targ2.Common) === null || _property$Value$$targ3 === void 0 ? void 0 : _property$Value$$targ3.Label, [], (_property$Value2 = property.Value) === null || _property$Value2 === void 0 ? void 0 : (_property$Value2$$tar = _property$Value2.$target) === null || _property$Value2$$tar === void 0 ? void 0 : _property$Value2$$tar.name));
    } else if (property.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      var _property$Label3, _property$Target, _property$Target$$tar, _property$Target$$tar2, _property$Target$$tar3, _property$Target$$tar4, _property$Target$$tar5, _property$Target$$tar6;
      return ((_property$Label3 = property.Label) === null || _property$Label3 === void 0 ? void 0 : _property$Label3.toString()) ?? compileExpression(getExpressionFromAnnotation((_property$Target = property.Target) === null || _property$Target === void 0 ? void 0 : (_property$Target$$tar = _property$Target.$target) === null || _property$Target$$tar === void 0 ? void 0 : (_property$Target$$tar2 = _property$Target$$tar.Value) === null || _property$Target$$tar2 === void 0 ? void 0 : (_property$Target$$tar3 = _property$Target$$tar2.$target) === null || _property$Target$$tar3 === void 0 ? void 0 : (_property$Target$$tar4 = _property$Target$$tar3.annotations) === null || _property$Target$$tar4 === void 0 ? void 0 : (_property$Target$$tar5 = _property$Target$$tar4.Common) === null || _property$Target$$tar5 === void 0 ? void 0 : (_property$Target$$tar6 = _property$Target$$tar5.Label) === null || _property$Target$$tar6 === void 0 ? void 0 : _property$Target$$tar6.valueOf()));
    } else {
      var _property$Label4;
      return (_property$Label4 = property.Label) === null || _property$Label4 === void 0 ? void 0 : _property$Label4.toString();
    }
  };
  const _getTooltip = function (source) {
    var _source$annotations2, _source$annotations2$;
    if (!source) {
      return undefined;
    }
    if (isProperty(source) || (_source$annotations2 = source.annotations) !== null && _source$annotations2 !== void 0 && (_source$annotations2$ = _source$annotations2.Common) !== null && _source$annotations2$ !== void 0 && _source$annotations2$.QuickInfo) {
      var _source$annotations3, _source$annotations3$;
      return (_source$annotations3 = source.annotations) !== null && _source$annotations3 !== void 0 && (_source$annotations3$ = _source$annotations3.Common) !== null && _source$annotations3$ !== void 0 && _source$annotations3$.QuickInfo ? compileExpression(getExpressionFromAnnotation(source.annotations.Common.QuickInfo)) : undefined;
    } else if (isDataFieldTypes(source)) {
      var _source$Value, _source$Value$$target, _source$Value$$target2, _source$Value$$target3;
      return (_source$Value = source.Value) !== null && _source$Value !== void 0 && (_source$Value$$target = _source$Value.$target) !== null && _source$Value$$target !== void 0 && (_source$Value$$target2 = _source$Value$$target.annotations) !== null && _source$Value$$target2 !== void 0 && (_source$Value$$target3 = _source$Value$$target2.Common) !== null && _source$Value$$target3 !== void 0 && _source$Value$$target3.QuickInfo ? compileExpression(getExpressionFromAnnotation(source.Value.$target.annotations.Common.QuickInfo)) : undefined;
    } else if (source.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
      var _source$Target, _datapointTarget$Valu, _datapointTarget$Valu2, _datapointTarget$Valu3, _datapointTarget$Valu4;
      const datapointTarget = (_source$Target = source.Target) === null || _source$Target === void 0 ? void 0 : _source$Target.$target;
      return datapointTarget !== null && datapointTarget !== void 0 && (_datapointTarget$Valu = datapointTarget.Value) !== null && _datapointTarget$Valu !== void 0 && (_datapointTarget$Valu2 = _datapointTarget$Valu.$target) !== null && _datapointTarget$Valu2 !== void 0 && (_datapointTarget$Valu3 = _datapointTarget$Valu2.annotations) !== null && _datapointTarget$Valu3 !== void 0 && (_datapointTarget$Valu4 = _datapointTarget$Valu3.Common) !== null && _datapointTarget$Valu4 !== void 0 && _datapointTarget$Valu4.QuickInfo ? compileExpression(getExpressionFromAnnotation(datapointTarget.Value.$target.annotations.Common.QuickInfo)) : undefined;
    } else {
      return undefined;
    }
  };
  function getRowStatusVisibility(colName, isSemanticKeyInFieldGroup) {
    return formatResult([pathInModel(`semanticKeyHasDraftIndicator`, "internal"), pathInModel(`filteredMessages`, "internal"), colName, isSemanticKeyInFieldGroup], tableFormatters.getErrorStatusTextVisibilityFormatter);
  }
  /**
   * Creates a PropertyInfo for each identified property consumed by a LineItem.
   *
   * @param columnsToBeCreated Identified properties.
   * @param existingColumns The list of columns created for LineItems and Properties of entityType.
   * @param nonSortableColumns The array of column names which cannot be sorted.
   * @param converterContext The converter context.
   * @param entityType The entity type for the LineItem
   * @param textOnlyColumnsFromTextAnnotation The array of columns from a property using a text annotation with textOnly as text arrangement.
   * @returns The array of columns created.
   */
  _exports.getRowStatusVisibility = getRowStatusVisibility;
  const _createRelatedColumns = function (columnsToBeCreated, existingColumns, nonSortableColumns, converterContext, entityType, textOnlyColumnsFromTextAnnotation, tableCreationMode) {
    const relatedColumns = [];
    const relatedPropertyNameMap = {};
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    Object.keys(columnsToBeCreated).forEach(name => {
      const property = columnsToBeCreated[name],
        annotationPath = converterContext.getAbsoluteAnnotationPath(name),
        // Check whether the related column already exists.
        relatedColumn = existingColumns.find(column => column.name === name);
      if (relatedColumn === undefined) {
        // Case 1: Key contains DataField prefix to ensure all property columns have the same key format.
        // New created property column is set to hidden.
        const column = getColumnDefinitionFromProperty(property, annotationPath, name, true, false, nonSortableColumns, aggregationHelper, converterContext, textOnlyColumnsFromTextAnnotation, tableCreationMode);
        column.isPartOfLineItem = existingColumns.some(existingColumn => {
          var _existingColumn$prope;
          return ((_existingColumn$prope = existingColumn.propertyInfos) === null || _existingColumn$prope === void 0 ? void 0 : _existingColumn$prope.includes(name)) && existingColumn.isPartOfLineItem;
        });
        updatePropertyLabel(existingColumns, columnsToBeCreated, column);
        relatedColumns.push(column);
      } else if (relatedColumn.annotationPath !== annotationPath || relatedColumn.propertyInfos) {
        // Case 2: The existing column points to a LineItem (or)
        // Case 3: This is a self reference from an existing column
        const newName = `Property::${name}`;
        // Checking whether the related property column has already been created in a previous iteration.
        if (!existingColumns.some(column => column.name === newName)) {
          // Create a new property column with 'Property::' prefix,
          // Set it to hidden as it is only consumed by Complex property infos.
          const column = getColumnDefinitionFromProperty(property, annotationPath, name, false, false, nonSortableColumns, aggregationHelper, converterContext, textOnlyColumnsFromTextAnnotation, tableCreationMode);
          column.isPartOfLineItem = relatedColumn.isPartOfLineItem;
          updatePropertyLabel(existingColumns, columnsToBeCreated, column);
          relatedColumns.push(column);
          relatedPropertyNameMap[name] = newName;
        } else if (existingColumns.some(column => column.name === newName) && existingColumns.some(column => {
          var _column$propertyInfos;
          return (_column$propertyInfos = column.propertyInfos) === null || _column$propertyInfos === void 0 ? void 0 : _column$propertyInfos.includes(name);
        })) {
          relatedPropertyNameMap[name] = newName;
        }
      }
    });
    // The property 'name' has been prefixed with 'Property::' for uniqueness.
    // Update the same in other propertyInfos[] references which point to this property.
    existingColumns.forEach(column => {
      var _column$propertyInfos2, _column$additionalPro;
      column.propertyInfos = (_column$propertyInfos2 = column.propertyInfos) === null || _column$propertyInfos2 === void 0 ? void 0 : _column$propertyInfos2.map(propertyInfo => relatedPropertyNameMap[propertyInfo] ?? propertyInfo);
      column.additionalPropertyInfos = (_column$additionalPro = column.additionalPropertyInfos) === null || _column$additionalPro === void 0 ? void 0 : _column$additionalPro.map(propertyInfo => relatedPropertyNameMap[propertyInfo] ?? propertyInfo);
    });
    return relatedColumns;
  };
  /**
   * Getting the Column Name
   * If it points to a DataField with one property or DataPoint with one property, it will use the property name
   * here to be consistent with the existing flex changes.
   *
   * @param dataField Different DataField types defined in the annotations
   * @returns The name of annotation columns
   */
  const _getAnnotationColumnName = function (dataField) {
    var _dataField$Value, _dataField$Target, _dataField$Target$$ta, _dataField$Target$$ta2;
    // This is needed as we have flexibility changes already that we have to check against
    if (isDataFieldTypes(dataField) && (_dataField$Value = dataField.Value) !== null && _dataField$Value !== void 0 && _dataField$Value.path) {
      var _dataField$Value2;
      return (_dataField$Value2 = dataField.Value) === null || _dataField$Value2 === void 0 ? void 0 : _dataField$Value2.path;
    } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && (_dataField$Target = dataField.Target) !== null && _dataField$Target !== void 0 && (_dataField$Target$$ta = _dataField$Target.$target) !== null && _dataField$Target$$ta !== void 0 && (_dataField$Target$$ta2 = _dataField$Target$$ta.Value) !== null && _dataField$Target$$ta2 !== void 0 && _dataField$Target$$ta2.path) {
      var _dataField$Target2, _dataField$Target2$$t;
      // This is for removing duplicate properties. For example, 'Progress' Property is removed if it is already defined as a DataPoint
      return (_dataField$Target2 = dataField.Target) === null || _dataField$Target2 === void 0 ? void 0 : (_dataField$Target2$$t = _dataField$Target2.$target) === null || _dataField$Target2$$t === void 0 ? void 0 : _dataField$Target2$$t.Value.path;
    } else {
      return KeyHelper.generateKeyFromDataField(dataField);
    }
  };
  /**
   * Creates a PropertyInfo for the identified additional property for the ALP table use-case.
   *
   * For e.g. If UI.Hidden points to a property, include this technical property in the additionalProperties of ComplexPropertyInfo object.
   *
   * @param name The name of the property to be created.
   * @param columns The list of columns created for LineItems and Properties of entityType from the table visualization.
   * @returns The propertyInfo of the technical property to be added to the list of columns.
   */
  const createTechnicalProperty = function (name, columns, relatedAdditionalPropertyNameMap) {
    const key = `Property_Technical::${name}`;
    // Validate if the technical property hasn't yet been created on previous iterations.
    const columnExists = columns.find(column => column.key === key);
    // Retrieve the simple property used by the hidden annotation, it will be used as a base for the mandatory attributes of newly created technical property. For e.g. relativePath
    const additionalProperty = !columnExists && columns.find(column => column.name === name && !column.propertyInfos);
    if (additionalProperty) {
      const technicalColumn = {
        key: key,
        type: ColumnType.Annotation,
        label: additionalProperty.label,
        annotationPath: additionalProperty.annotationPath,
        availability: "Hidden",
        name: key,
        relativePath: additionalProperty.relativePath,
        sortable: false,
        isGroupable: false,
        isKey: false,
        exportSettings: null,
        caseSensitive: false,
        aggregatable: false,
        extension: {
          technicallyGroupable: true,
          technicallyAggregatable: true
        }
      };
      columns.push(technicalColumn);
      relatedAdditionalPropertyNameMap[name] = technicalColumn.name;
    }
  };
  /**
   * Determines if the data field labels have to be displayed in the table.
   *
   * @param fieldGroupName The `DataField` name being processed.
   * @param visualizationPath
   * @param converterContext
   * @returns `showDataFieldsLabel` value from the manifest
   */
  const _getShowDataFieldsLabel = function (fieldGroupName, visualizationPath, converterContext) {
    var _converterContext$get15;
    const oColumns = (_converterContext$get15 = converterContext.getManifestControlConfiguration(visualizationPath)) === null || _converterContext$get15 === void 0 ? void 0 : _converterContext$get15.columns;
    const aColumnKeys = oColumns && Object.keys(oColumns);
    return aColumnKeys && !!aColumnKeys.find(function (key) {
      return key === fieldGroupName && oColumns[key].showDataFieldsLabel;
    });
  };
  /**
   * Determines the relative path of the property with respect to the root entity.
   *
   * @param dataField The `DataField` being processed.
   * @returns The relative path
   */
  const _getRelativePath = function (dataField) {
    var _Value3, _dataField$Target3;
    let relativePath = "";
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        relativePath = dataField === null || dataField === void 0 ? void 0 : (_Value3 = dataField.Value) === null || _Value3 === void 0 ? void 0 : _Value3.path;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        relativePath = dataField === null || dataField === void 0 ? void 0 : (_dataField$Target3 = dataField.Target) === null || _dataField$Target3 === void 0 ? void 0 : _dataField$Target3.value;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
      case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
        relativePath = KeyHelper.generateKeyFromDataField(dataField);
        break;
    }
    return relativePath;
  };
  const _sliceAtSlash = function (path, isLastSlash, isLastPart) {
    const iSlashIndex = isLastSlash ? path.lastIndexOf("/") : path.indexOf("/");
    if (iSlashIndex === -1) {
      return path;
    }
    return isLastPart ? path.substring(iSlashIndex + 1, path.length) : path.substring(0, iSlashIndex);
  };
  /**
   * Determines if the column contains a multi-value field.
   *
   * @param dataField The DataField being processed
   * @param converterContext The converter context
   * @returns True if the DataField corresponds to a multi-value field.
   */
  const _isColumnMultiValued = function (dataField, converterContext) {
    if (isDataFieldTypes(dataField) && isPathAnnotationExpression(dataField.Value)) {
      const propertyObjectPath = enhanceDataModelPath(converterContext.getDataModelObjectPath(), dataField.Value.path);
      return isMultiValueField(propertyObjectPath);
    } else {
      return false;
    }
  };
  /**
   * Determine whether a column is sortable.
   *
   * @param dataField The data field being processed
   * @param propertyPath The property path
   * @param nonSortableColumns Collection of non-sortable column names as per annotation
   * @returns True if the column is sortable
   */
  const _isColumnSortable = function (dataField, propertyPath, nonSortableColumns) {
    return !nonSortableColumns.includes(propertyPath) && (
    // Column is not marked as non-sortable via annotation
    dataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction");
  };
  /**
   * Returns whether filtering on the table is case sensitive.
   *
   * @param converterContext The instance of the converter context
   * @returns Returns 'false' if FilterFunctions annotation supports 'tolower', else 'true'
   */
  const isFilteringCaseSensitive = function (converterContext) {
    const filterFunctions = _getFilterFunctions(converterContext);
    return Array.isArray(filterFunctions) ? !filterFunctions.includes("tolower") : true;
  };
  _exports.isFilteringCaseSensitive = isFilteringCaseSensitive;
  function _getFilterFunctions(ConverterContext) {
    const entitySet = ConverterContext.getEntitySet();
    if (TypeGuards.isEntitySet(entitySet)) {
      var _entitySet$annotation3, _ConverterContext$get;
      return ((_entitySet$annotation3 = entitySet.annotations.Capabilities) === null || _entitySet$annotation3 === void 0 ? void 0 : _entitySet$annotation3.FilterFunctions) ?? ((_ConverterContext$get = ConverterContext.getEntityContainer().annotations.Capabilities) === null || _ConverterContext$get === void 0 ? void 0 : _ConverterContext$get.FilterFunctions);
    }
    return undefined;
  }
  /**
   * Returns default format options for text fields in a table.
   *
   * @param formatOptions
   * @returns Collection of format options with default values
   */
  function _getDefaultFormatOptionsForTable(formatOptions) {
    return formatOptions === undefined ? undefined : {
      textLinesEdit: 4,
      ...formatOptions
    };
  }
  function _findSemanticKeyValues(semanticKeys, name) {
    const aSemanticKeyValues = [];
    let bSemanticKeyFound = false;
    for (let i = 0; i < semanticKeys.length; i++) {
      aSemanticKeyValues.push(semanticKeys[i].value);
      if (semanticKeys[i].value === name) {
        bSemanticKeyFound = true;
      }
    }
    return {
      values: aSemanticKeyValues,
      semanticKeyFound: bSemanticKeyFound
    };
  }
  function _findProperties(semanticKeyValues, fieldGroupProperties) {
    let semanticKeyHasPropertyInFieldGroup = false;
    let sPropertyPath;
    if (semanticKeyValues && semanticKeyValues.length >= 1 && fieldGroupProperties && fieldGroupProperties.length >= 1) {
      for (let i = 0; i < semanticKeyValues.length; i++) {
        if ([semanticKeyValues[i]].some(tmp => fieldGroupProperties.includes(tmp))) {
          semanticKeyHasPropertyInFieldGroup = true;
          sPropertyPath = semanticKeyValues[i];
          break;
        }
      }
    }
    return {
      semanticKeyHasPropertyInFieldGroup: semanticKeyHasPropertyInFieldGroup,
      fieldGroupPropertyPath: sPropertyPath
    };
  }
  /**
   * Find the first property in the fieldGroup that is part of the semantic keys.
   *
   * @param dataFieldGroup
   * @param semanticKeyValues
   * @returns An object containing a flag true if a property is found and a propertyPath.
   */
  function _findSemanticKeyValuesInFieldGroup(dataFieldGroup, semanticKeyValues) {
    var _dataFieldGroup$Targe4, _dataFieldGroup$Targe5;
    // this info is used in FieldHelper#isDraftIndicatorVisibleInFieldGroup to show a draft indicator at the end of a field group
    const aProperties = [];
    let _propertiesFound = {
      semanticKeyHasPropertyInFieldGroup: false,
      fieldGroupPropertyPath: undefined
    };
    if (dataFieldGroup && dataFieldGroup.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && ((_dataFieldGroup$Targe4 = dataFieldGroup.Target) === null || _dataFieldGroup$Targe4 === void 0 ? void 0 : (_dataFieldGroup$Targe5 = _dataFieldGroup$Targe4.$target) === null || _dataFieldGroup$Targe5 === void 0 ? void 0 : _dataFieldGroup$Targe5.$Type) === "com.sap.vocabularies.UI.v1.FieldGroupType") {
      var _dataFieldGroup$Targe6;
      (_dataFieldGroup$Targe6 = dataFieldGroup.Target.$target.Data) === null || _dataFieldGroup$Targe6 === void 0 ? void 0 : _dataFieldGroup$Targe6.forEach(innerDataField => {
        if ((innerDataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || innerDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") && innerDataField.Value) {
          aProperties.push(innerDataField.Value.path);
        }
        _propertiesFound = _findProperties(semanticKeyValues, aProperties);
      });
    }
    return {
      semanticKeyHasPropertyInFieldGroup: _propertiesFound.semanticKeyHasPropertyInFieldGroup,
      propertyPath: _propertiesFound.fieldGroupPropertyPath
    };
  }
  /**
   * Returns default format options with draftIndicator for a column.
   *
   * @param name
   * @param semanticKeys
   * @param isFieldGroupColumn
   * @param dataFieldGroup
   * @returns Collection of format options with default values
   */
  function getDefaultDraftIndicatorForColumn(name, semanticKeys, isFieldGroupColumn, dataFieldGroup) {
    if (!semanticKeys) {
      return {};
    }
    const semanticKey = _findSemanticKeyValues(semanticKeys, name);
    const semanticKeyInFieldGroup = _findSemanticKeyValuesInFieldGroup(dataFieldGroup, semanticKey.values);
    if (semanticKeyInFieldGroup.semanticKeyHasPropertyInFieldGroup) {
      // Semantic Key has a property in a FieldGroup
      return {
        //TODO we should rather store hasSemanticKeyInFieldGroup
        fieldGroupDraftIndicatorPropertyPath: semanticKeyInFieldGroup.propertyPath,
        fieldGroupName: name,
        showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, true))
      };
    } else if (semanticKey.semanticKeyFound) {
      return {
        hasDraftIndicator: true,
        showErrorObjectStatus: compileExpression(getRowStatusVisibility(name, false))
      };
    }
    return {};
  }
  function _getImpNumber(dataField) {
    var _dataField$annotation17, _dataField$annotation18;
    const importance = dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation17 = dataField.annotations) === null || _dataField$annotation17 === void 0 ? void 0 : (_dataField$annotation18 = _dataField$annotation17.UI) === null || _dataField$annotation18 === void 0 ? void 0 : _dataField$annotation18.Importance;
    if (importance && importance.includes("UI.ImportanceType/High")) {
      return 3;
    }
    if (importance && importance.includes("UI.ImportanceType/Medium")) {
      return 2;
    }
    if (importance && importance.includes("UI.ImportanceType/Low")) {
      return 1;
    }
    return 0;
  }
  function _getDataFieldImportance(dataField) {
    var _dataField$annotation19, _dataField$annotation20;
    const importance = dataField === null || dataField === void 0 ? void 0 : (_dataField$annotation19 = dataField.annotations) === null || _dataField$annotation19 === void 0 ? void 0 : (_dataField$annotation20 = _dataField$annotation19.UI) === null || _dataField$annotation20 === void 0 ? void 0 : _dataField$annotation20.Importance;
    return importance ? importance.split("/")[1] : Importance.None;
  }
  function _getMaxImportance(fields) {
    if (fields && fields.length > 0) {
      let maxImpNumber = -1;
      let impNumber = -1;
      let DataFieldWithMaxImportance;
      for (const field of fields) {
        impNumber = _getImpNumber(field);
        if (impNumber > maxImpNumber) {
          maxImpNumber = impNumber;
          DataFieldWithMaxImportance = field;
        }
      }
      return _getDataFieldImportance(DataFieldWithMaxImportance);
    }
    return Importance.None;
  }
  /**
   * Returns the importance value for a column.
   *
   * @param converterContext
   * @param dataField
   * @returns The importance value
   */
  function getImportance(converterContext, dataField) {
    var _converterContext$get16, _Value4, _Value4$$target;
    if (!dataField) {
      return undefined;
    }
    const semanticKeys = ((_converterContext$get16 = converterContext.getDataModelObjectPath().targetEntityType.annotations.Common) === null || _converterContext$get16 === void 0 ? void 0 : _converterContext$get16.SemanticKey) ?? [];
    const requiredProperties = getRequiredProperties(converterContext);
    const highKeys = [...semanticKeys, ...requiredProperties].map(propertyPath => {
      var _propertyPath$$target;
      return (_propertyPath$$target = propertyPath.$target) === null || _propertyPath$$target === void 0 ? void 0 : _propertyPath$$target.fullyQualifiedName;
    });
    //Evaluate default Importance is not set explicitly
    let fieldsWithImportance;
    if (isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
      const dataFieldTarget = dataField.Target.$target;
      if (isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.FieldGroupType")) {
        const fieldGroupData = dataFieldTarget.Data;
        //If a FieldGroup contains a semanticKey or required property, importance set to High
        if (fieldGroupData.some(function (fieldGroupDataField) {
          var _fieldGroupDataField$, _fieldGroupDataField$2;
          return isDataFieldTypes(fieldGroupDataField) && highKeys.includes((_fieldGroupDataField$ = fieldGroupDataField.Value) === null || _fieldGroupDataField$ === void 0 ? void 0 : (_fieldGroupDataField$2 = _fieldGroupDataField$.$target) === null || _fieldGroupDataField$2 === void 0 ? void 0 : _fieldGroupDataField$2.fullyQualifiedName);
        })) {
          return Importance.High;
        } else {
          var _dataField$annotation21, _dataField$annotation22;
          //If the DataFieldForAnnotation has an Importance we take it
          if (dataField !== null && dataField !== void 0 && (_dataField$annotation21 = dataField.annotations) !== null && _dataField$annotation21 !== void 0 && (_dataField$annotation22 = _dataField$annotation21.UI) !== null && _dataField$annotation22 !== void 0 && _dataField$annotation22.Importance) {
            return _getDataFieldImportance(dataField);
          }
          // else the highest importance (if any) is returned
          fieldsWithImportance = fieldGroupData.filter(function (item) {
            var _item$annotations, _item$annotations$UI;
            return item === null || item === void 0 ? void 0 : (_item$annotations = item.annotations) === null || _item$annotations === void 0 ? void 0 : (_item$annotations$UI = _item$annotations.UI) === null || _item$annotations$UI === void 0 ? void 0 : _item$annotations$UI.Importance;
          });
          return _getMaxImportance(fieldsWithImportance);
        }
      }
    }
    return highKeys.includes((_Value4 = dataField.Value) === null || _Value4 === void 0 ? void 0 : (_Value4$$target = _Value4.$target) === null || _Value4$$target === void 0 ? void 0 : _Value4$$target.fullyQualifiedName) ? Importance.High : _getDataFieldImportance(dataField);
  }
  /**
   * Returns line items from metadata annotations.
   *
   * @param lineItemAnnotation Collection of data fields with their annotations
   * @param visualizationPath The visualization path
   * @param converterContext The converter context
   * @returns The columns from the annotations
   */
  _exports.getImportance = getImportance;
  const getColumnsFromAnnotations = function (lineItemAnnotation, visualizationPath, converterContext) {
    var _tableManifestSetting2, _tableManifestSetting3, _tableManifestSetting4;
    const entityType = converterContext.getAnnotationEntityType(lineItemAnnotation),
      annotationColumns = [],
      columnsToBeCreated = {},
      nonSortableColumns = getNonSortablePropertiesRestrictions(converterContext.getEntitySet()),
      tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath),
      tableType = (tableManifestSettings === null || tableManifestSettings === void 0 ? void 0 : (_tableManifestSetting2 = tableManifestSettings.tableSettings) === null || _tableManifestSetting2 === void 0 ? void 0 : _tableManifestSetting2.type) || "ResponsiveTable",
      tableCreationMode = (tableManifestSettings === null || tableManifestSettings === void 0 ? void 0 : (_tableManifestSetting3 = tableManifestSettings.tableSettings) === null || _tableManifestSetting3 === void 0 ? void 0 : (_tableManifestSetting4 = _tableManifestSetting3.creationMode) === null || _tableManifestSetting4 === void 0 ? void 0 : _tableManifestSetting4.name) || CreationMode.Inline;
    const textOnlyColumnsFromTextAnnotation = [];
    const semanticKeys = converterContext.getAnnotationsByTerm("Common", "com.sap.vocabularies.Common.v1.SemanticKey", [converterContext.getEntityType()])[0];
    if (lineItemAnnotation) {
      const tableConverterContext = converterContext.getConverterContextFor(getTargetObjectPath(converterContext.getDataModelObjectPath()));
      lineItemAnnotation.forEach(lineItem => {
        var _lineItem$Value, _lineItem$Value$$targ, _lineItem$Target, _lineItem$Target$$tar, _propertyTypeConfig, _propertyTypeConfig2, _lineItem$annotations, _lineItem$annotations2, _lineItem$annotations3, _lineItem$annotations4, _exportSettings;
        // TODO: variable name should be datafield and not lineItem
        if (!_isValidColumn(lineItem)) {
          return;
        }
        let exportSettings = null;
        const semanticObjectAnnotationPath = isDataFieldTypes(lineItem) && (_lineItem$Value = lineItem.Value) !== null && _lineItem$Value !== void 0 && (_lineItem$Value$$targ = _lineItem$Value.$target) !== null && _lineItem$Value$$targ !== void 0 && _lineItem$Value$$targ.fullyQualifiedName ? getSemanticObjectPath(converterContext, lineItem) : undefined;
        const relativePath = _getRelativePath(lineItem);
        // Determine properties which are consumed by this LineItem.
        const relatedPropertiesInfo = collectRelatedPropertiesRecursively(lineItem, converterContext, tableType);
        const relatedPropertyNames = Object.keys(relatedPropertiesInfo.properties);
        const additionalPropertyNames = Object.keys(relatedPropertiesInfo.additionalProperties);
        const groupPath = relativePath ? _sliceAtSlash(relativePath, true, false) : undefined;
        const isGroup = groupPath != relativePath;
        const sLabel = getLabel(lineItem, isGroup);
        const name = _getAnnotationColumnName(lineItem);
        const isFieldGroupColumn = groupPath ? groupPath.includes(`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`) : false;
        const showDataFieldsLabel = isFieldGroupColumn ? _getShowDataFieldsLabel(name, visualizationPath, converterContext) : false;
        const dataType = getDataFieldDataType(lineItem);
        const formatOptions = _getDefaultFormatOptionsForTable(getDefaultDraftIndicatorForColumn(name, semanticKeys, isFieldGroupColumn, lineItem));

        // Determine if we need a situations indicator
        const navigationProperties = enhanceDataModelPath(converterContext.getDataModelObjectPath(), relativePath).targetEntityType.navigationProperties;
        const situationsNavProps = navigationProperties.filter(navigationProperty => {
          var _navigationProperty$t, _navigationProperty$t2;
          return !navigationProperty.isCollection && ((_navigationProperty$t = navigationProperty.targetType.annotations.Common) === null || _navigationProperty$t === void 0 ? void 0 : (_navigationProperty$t2 = _navigationProperty$t.SAPObjectNodeType) === null || _navigationProperty$t2 === void 0 ? void 0 : _navigationProperty$t2.Name) === "BusinessSituation";
        });
        const situationsNavProp = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;
        if (situationsNavProp && formatOptions) {
          formatOptions.hasSituationsIndicator = true;
        }
        let fieldGroupHiddenExpressions;
        if (lineItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && ((_lineItem$Target = lineItem.Target) === null || _lineItem$Target === void 0 ? void 0 : (_lineItem$Target$$tar = _lineItem$Target.$target) === null || _lineItem$Target$$tar === void 0 ? void 0 : _lineItem$Target$$tar.$Type) === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          fieldGroupHiddenExpressions = _getFieldGroupHiddenExpressions(lineItem);
        }
        if (_isExportableColumn(lineItem)) {
          //exclude the types listed above for the Export (generates error on Export as PDF)
          exportSettings = createColumnExportSettings(lineItem, relatedPropertiesInfo);
        }
        let propertyTypeConfig;
        if (dataType) {
          propertyTypeConfig = getTypeConfig(lineItem, dataType);
        }
        const typeConfig = {
          className: dataType,
          formatOptions: {
            ...formatOptions,
            ...((_propertyTypeConfig = propertyTypeConfig) === null || _propertyTypeConfig === void 0 ? void 0 : _propertyTypeConfig.formatOptions)
          },
          constraints: {
            ...((_propertyTypeConfig2 = propertyTypeConfig) === null || _propertyTypeConfig2 === void 0 ? void 0 : _propertyTypeConfig2.constraints)
          }
        };
        const visualSettings = {};
        if (!dataType || !typeConfig) {
          // for charts
          visualSettings.widthCalculation = null;
        }
        const isMultiValue = _isColumnMultiValued(lineItem, tableConverterContext);
        const sortable = !isMultiValue && _isColumnSortable(lineItem, relativePath, nonSortableColumns);
        const column = {
          key: KeyHelper.generateKeyFromDataField(lineItem),
          type: ColumnType.Annotation,
          label: sLabel,
          groupLabel: isGroup ? getLabel(lineItem) : undefined,
          group: isGroup ? groupPath : undefined,
          FieldGroupHiddenExpressions: fieldGroupHiddenExpressions,
          annotationPath: converterContext.getEntitySetBasedAnnotationPath(lineItem.fullyQualifiedName),
          semanticObjectPath: semanticObjectAnnotationPath,
          availability: isReferencePropertyStaticallyHidden(lineItem) ? "Hidden" : "Default",
          name: name,
          showDataFieldsLabel: showDataFieldsLabel,
          required: isRequiredColumn(converterContext, lineItem, tableCreationMode),
          relativePath: relativePath,
          sortable: sortable,
          propertyInfos: relatedPropertyNames.length ? relatedPropertyNames : undefined,
          additionalPropertyInfos: additionalPropertyNames.length > 0 ? additionalPropertyNames : undefined,
          exportSettings: exportSettings,
          width: ((_lineItem$annotations = lineItem.annotations) === null || _lineItem$annotations === void 0 ? void 0 : (_lineItem$annotations2 = _lineItem$annotations.HTML5) === null || _lineItem$annotations2 === void 0 ? void 0 : (_lineItem$annotations3 = _lineItem$annotations2.CssDefaults) === null || _lineItem$annotations3 === void 0 ? void 0 : (_lineItem$annotations4 = _lineItem$annotations3.width) === null || _lineItem$annotations4 === void 0 ? void 0 : _lineItem$annotations4.valueOf()) || undefined,
          importance: getImportance(converterContext, lineItem),
          isNavigable: true,
          formatOptions: formatOptions,
          caseSensitive: isFilteringCaseSensitive(converterContext),
          typeConfig: typeConfig,
          visualSettings: visualSettings,
          timezoneText: (_exportSettings = exportSettings) === null || _exportSettings === void 0 ? void 0 : _exportSettings.timezone,
          isPartOfLineItem: true,
          isMultiValue
        };
        const sTooltip = _getTooltip(lineItem) || sLabel;
        if (sTooltip) {
          column.tooltip = sTooltip;
        }
        if (relatedPropertiesInfo.textOnlyPropertiesFromTextAnnotation.length > 0) {
          textOnlyColumnsFromTextAnnotation.push(...relatedPropertiesInfo.textOnlyPropertiesFromTextAnnotation);
        }
        if (relatedPropertiesInfo.exportSettings.dataPointTargetValue) {
          column.exportDataPointTargetValue = relatedPropertiesInfo.exportSettings.dataPointTargetValue;
        }
        annotationColumns.push(column);
        // Collect information of related columns to be created.
        relatedPropertyNames.forEach(relatedPropertyName => {
          columnsToBeCreated[relatedPropertyName] = relatedPropertiesInfo.properties[relatedPropertyName];
          // In case of a multi-value, related properties cannot be sorted as we go through a 1-n relation
          if (isMultiValue) {
            nonSortableColumns.push(relatedPropertyName);
          }
        });
        // Create columns for additional properties identified for ALP use case.
        additionalPropertyNames.forEach(additionalPropertyName => {
          // Intentional overwrite as we require only one new PropertyInfo for a related Property.
          columnsToBeCreated[additionalPropertyName] = relatedPropertiesInfo.additionalProperties[additionalPropertyName];
        });
      });
    }
    // Get columns from the Properties of EntityType
    return getColumnsFromEntityType(columnsToBeCreated, entityType, annotationColumns, nonSortableColumns, converterContext, tableType, tableCreationMode, textOnlyColumnsFromTextAnnotation);
  };
  /**
   * Gets the property names from the manifest and checks against existing properties already added by annotations.
   * If a not yet stored property is found it adds it for sorting and filtering only to the annotationColumns.
   *
   * @param properties
   * @param annotationColumns
   * @param converterContext
   * @param entityType
   * @returns The columns from the annotations
   */
  const _getPropertyNames = function (properties, annotationColumns, converterContext, entityType) {
    let matchedProperties;
    if (properties) {
      matchedProperties = properties.map(function (propertyPath) {
        const annotationColumn = annotationColumns.find(function (annotationColumn) {
          return annotationColumn.relativePath === propertyPath && annotationColumn.propertyInfos === undefined;
        });
        if (annotationColumn) {
          return annotationColumn.name;
        } else {
          const relatedColumns = _createRelatedColumns({
            [propertyPath]: entityType.resolvePath(propertyPath)
          }, annotationColumns, [], converterContext, entityType, []);
          annotationColumns.push(relatedColumns[0]);
          return relatedColumns[0].name;
        }
      });
    }
    return matchedProperties;
  };

  /**
   * Determines if the field group has to be flagged as required.
   *
   * @param converterContext The converter context
   * @param fieldGroup The fieldGroup being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the fieldGroup is required.
   */
  const isRequiredFieldGroup = function (converterContext, fieldGroup, tableCreationMode) {
    const fieldGroupData = fieldGroup.Data;
    return fieldGroupData.some(function (item) {
      var _item$Value;
      // we exclude boolean type, the end-user may want to keep the underlying check box empty on purpose
      if (isDataField(item) && (item === null || item === void 0 ? void 0 : (_item$Value = item.Value) === null || _item$Value === void 0 ? void 0 : _item$Value.$target.type) !== "Edm.Boolean") {
        return isStaticallyMandatory(item) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(item.Value.$target.fullyQualifiedName, converterContext);
      }
    });
  };

  /**
   * Determines if the dataFieldForAnnotation has to be flagged as required.
   *
   * @param converterContext The converter context
   * @param dataFieldForAnnotation The property being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the property is required.
   */
  const isRequiredDataFieldForAnnotation = function (converterContext, dataFieldForAnnotation, tableCreationMode) {
    const dataFieldTarget = dataFieldForAnnotation.Target.$target;
    const DataFieldForAnnotationFieldControlNotMandatory = hasFieldControlNotMandatory(dataFieldForAnnotation);
    // Check if the DataFieldForAnnotation points to a FieldGroup
    if (hasFieldGroupTarget(dataFieldForAnnotation)) {
      if (isRequiredFieldGroup(converterContext, dataFieldTarget, tableCreationMode)) {
        return true;
      }
      const fieldGroupData = dataFieldTarget.Data;
      return fieldGroupData.some(innerDataField => {
        return isRequiredColumn(converterContext, innerDataField, tableCreationMode);
      });
    }
    /*If the underlying datapoint is a rating indicator, the end-user may want to keep the rating empty (value 0) on purpose.
    Besides, currently, only a fieldControl set on a dataFieldForAnnotation pointing to a dataPoint has an influence in the table.
    Accordingly, if a datapoint comes from a dataFieldForAnnotation with a fieldControl set as not mandatory, this dataPoint must not be flagged as "required"*/
    if (hasDataPointTarget(dataFieldForAnnotation) && dataFieldTarget.Visualization !== "UI.VisualizationType/Rating") {
      if (DataFieldForAnnotationFieldControlNotMandatory) {
        return false;
      }
      if (isStaticallyMandatory(dataFieldForAnnotation)) {
        return true;
      }
      return isRequiredDataPoint(converterContext, dataFieldTarget, tableCreationMode);
    }
    return false;
  };

  /**
   * Determines if the property has to be flagged as required.
   *
   * @param converterContext The converter context
   * @param property The property being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the property is required.
   */
  const isRequiredProperty = function (converterContext, property, tableCreationMode) {
    return property.type !== "Edm.Boolean" && !isRatingVisualizationFromDataFieldDefault(property) && (isStaticallyMandatory(property) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(property.fullyQualifiedName, converterContext));
  };

  /**
   * Determines if the dataPoint has to be flagged as required.
   *
   * @param converterContext The converter context
   * @param dataPoint The dataPoint being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns True if the dataPoint is required.
   */
  const isRequiredDataPoint = function (converterContext, dataPoint, tableCreationMode) {
    return isStaticallyMandatory(dataPoint) || tableCreationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(dataPoint.Value.$target.fullyQualifiedName, converterContext);
  };

  /**
   * Determines if the underlying column has to be flagged as required.
   *
   * @param converterContext The converter context
   * @param target The target being processed
   * @param tableCreationMode The creation mode of the underlying table
   * @returns The binding expression for the 'required' property of the table column.
   */
  const isRequiredColumn = function (converterContext, target, tableCreationMode) {
    var _target$Value, _target$Value$$target;
    const creationMode = tableCreationMode || CreationMode.Inline;
    if (converterContext.getTemplateType() === TemplateType.ListReport || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      return undefined;
    }
    if (isProperty(target)) {
      return isRequiredProperty(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
    }
    // Check if the dataField is of type DataFieldForAnnotation
    if (isDataFieldForAnnotation(target)) {
      return isRequiredDataFieldForAnnotation(converterContext, target, creationMode) ? compileExpression(UI.IsEditable) : undefined;
    }
    //If the underlying property is a boolean, the end-user may want to keep the check box empty on purpose
    if (isDataField(target) && ((_target$Value = target.Value) === null || _target$Value === void 0 ? void 0 : (_target$Value$$target = _target$Value.$target) === null || _target$Value$$target === void 0 ? void 0 : _target$Value$$target.type) !== "Edm.Boolean") {
      return isStaticallyMandatory(target) || creationMode === CreationMode.InlineCreationRows && isAnnotatedRequiredProperty(target.Value.$target.fullyQualifiedName, converterContext) ? compileExpression(UI.IsEditable) : undefined;
    }
    return undefined;
  };
  const _appendCustomTemplate = function (properties) {
    return properties.map(property => {
      return `{${properties.indexOf(property)}}`;
    }).join(`${"\n"}`);
  };
  /**
   * Returns table column definitions from manifest.
   *
   * These may be custom columns defined in the manifest, slot columns coming through
   * a building block, or annotation columns to overwrite annotation-based columns.
   *
   * @param columns
   * @param annotationColumns
   * @param converterContext
   * @param entityType
   * @param navigationSettings
   * @returns The columns from the manifest
   */
  const getColumnsFromManifest = function (columns, annotationColumns, converterContext, entityType, navigationSettings) {
    const internalColumns = {};
    function isAnnotationColumn(column, key) {
      return annotationColumns.some(annotationColumn => annotationColumn.key === key);
    }
    function isSlotColumn(manifestColumn) {
      return manifestColumn.type === ColumnType.Slot;
    }
    function isCustomColumn(manifestColumn) {
      return manifestColumn.type === undefined && !!manifestColumn.template;
    }
    function _updateLinkedPropertiesOnCustomColumns(propertyInfos, annotationTableColumns) {
      const nonSortableColumns = getNonSortablePropertiesRestrictions(converterContext.getEntitySet());
      propertyInfos.forEach(property => {
        annotationTableColumns.forEach(prop => {
          if (prop.name === property) {
            prop.sortable = !nonSortableColumns.includes(property.replace("Property::", ""));
            prop.isGroupable = prop.sortable;
          }
        });
      });
    }
    for (const key in columns) {
      var _manifestColumn$posit;
      const manifestColumn = columns[key];
      KeyHelper.validateKey(key);
      // BaseTableColumn
      const baseTableColumn = {
        key: key,
        widthIncludingColumnHeader: manifestColumn.widthIncludingColumnHeader,
        width: manifestColumn.width || undefined,
        position: {
          anchor: (_manifestColumn$posit = manifestColumn.position) === null || _manifestColumn$posit === void 0 ? void 0 : _manifestColumn$posit.anchor,
          placement: manifestColumn.position === undefined ? Placement.After : manifestColumn.position.placement
        },
        caseSensitive: isFilteringCaseSensitive(converterContext)
      };
      if (isAnnotationColumn(manifestColumn, key)) {
        const propertiesToOverwriteAnnotationColumn = {
          ...baseTableColumn,
          importance: manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.importance,
          horizontalAlign: manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.horizontalAlign,
          availability: manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.availability,
          type: ColumnType.Annotation,
          isNavigable: isAnnotationColumn(manifestColumn, key) ? undefined : isActionNavigable(manifestColumn, navigationSettings, true),
          settings: manifestColumn.settings,
          formatOptions: _getDefaultFormatOptionsForTable(manifestColumn.formatOptions)
        };
        internalColumns[key] = propertiesToOverwriteAnnotationColumn;
      } else {
        var _manifestColumn$heade;
        const propertyInfos = _getPropertyNames(manifestColumn.properties, annotationColumns, converterContext, entityType);
        const baseManifestColumn = {
          ...baseTableColumn,
          header: manifestColumn.header,
          importance: (manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.importance) || Importance.None,
          horizontalAlign: (manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.horizontalAlign) || HorizontalAlign.Begin,
          availability: (manifestColumn === null || manifestColumn === void 0 ? void 0 : manifestColumn.availability) || "Default",
          template: manifestColumn.template,
          propertyInfos: propertyInfos,
          exportSettings: propertyInfos ? {
            template: _appendCustomTemplate(propertyInfos),
            wrap: !!(propertyInfos.length > 1)
          } : null,
          id: `CustomColumn::${key}`,
          name: `CustomColumn::${key}`,
          //Needed for MDC:
          formatOptions: {
            textLinesEdit: 4
          },
          isGroupable: false,
          isNavigable: false,
          sortable: false,
          visualSettings: {
            widthCalculation: null
          },
          tooltip: manifestColumn.header,
          properties: manifestColumn.properties,
          required: manifestColumn.required && converterContext.getTemplateType() !== TemplateType.ListReport && converterContext.getTemplateType() !== TemplateType.AnalyticalListPage ? compileExpression(UI.IsEditable) : undefined
        };
        if ((_manifestColumn$heade = manifestColumn.header) !== null && _manifestColumn$heade !== void 0 && _manifestColumn$heade.startsWith("{metaModel>")) {
          var _manifestColumn$heade2, _manifestColumn$heade3;
          const metaModelPath = (_manifestColumn$heade2 = manifestColumn.header) === null || _manifestColumn$heade2 === void 0 ? void 0 : _manifestColumn$heade2.substring(11, ((_manifestColumn$heade3 = manifestColumn.header) === null || _manifestColumn$heade3 === void 0 ? void 0 : _manifestColumn$heade3.length) - 1);
          try {
            baseManifestColumn.header = converterContext.getEntityTypeAnnotation(metaModelPath).annotation.toString();
          } catch (e) {
            Log.info(`Unable to retrieve text from meta model using path ${metaModelPath}`);
          }
        }
        if (propertyInfos) {
          _updateLinkedPropertiesOnCustomColumns(propertyInfos, annotationColumns);
        }
        if (isSlotColumn(manifestColumn)) {
          const customTableColumn = {
            ...baseManifestColumn,
            type: ColumnType.Slot
          };
          internalColumns[key] = customTableColumn;
        } else if (isCustomColumn(manifestColumn)) {
          const customTableColumn = {
            ...baseManifestColumn,
            type: ColumnType.Default
          };
          internalColumns[key] = customTableColumn;
        } else {
          var _IssueCategoryType$An;
          const message = `The annotation column '${key}' referenced in the manifest is not found`;
          converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.Low, message, IssueCategoryType, IssueCategoryType === null || IssueCategoryType === void 0 ? void 0 : (_IssueCategoryType$An = IssueCategoryType.AnnotationColumns) === null || _IssueCategoryType$An === void 0 ? void 0 : _IssueCategoryType$An.InvalidKey);
        }
      }
    }
    return internalColumns;
  };

  /**
   * Adds computed columns such as the draft status and situations status.
   *
   * @param tableColumns The table columns collected so far
   * @param visualizationPath
   * @param converterContext
   * @returns The enriched set of table columns
   */
  function addComputedColumns(tableColumns, visualizationPath, converterContext) {
    var _tableManifestSetting5;
    const tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const tableType = (tableManifestSettings === null || tableManifestSettings === void 0 ? void 0 : (_tableManifestSetting5 = tableManifestSettings.tableSettings) === null || _tableManifestSetting5 === void 0 ? void 0 : _tableManifestSetting5.type) || "ResponsiveTable";
    if (tableType !== "GridTable" && tableType !== "TreeTable") {
      // Today we only do something here in case of grid or tree table
      return tableColumns;
    }

    // In case a grid table or tree table is used, we display the situations indicator in a separate column
    // so we have to disable it here to ensure, that the field building block
    // does not render it into the ID column
    const columnWithSituationsIndicator = tableColumns.find(column => {
      var _column$formatOptions, _column$formatOptions2;
      return ((_column$formatOptions = column.formatOptions) === null || _column$formatOptions === void 0 ? void 0 : _column$formatOptions.hasSituationsIndicator) !== undefined && ((_column$formatOptions2 = column.formatOptions) === null || _column$formatOptions2 === void 0 ? void 0 : _column$formatOptions2.hasSituationsIndicator) === true;
    });
    if (columnWithSituationsIndicator !== null && columnWithSituationsIndicator !== void 0 && columnWithSituationsIndicator.formatOptions) {
      // Switch off the situations indicator in the found column
      columnWithSituationsIndicator.formatOptions.hasSituationsIndicator = false;

      // Insert a separate situations indicator column
      const situationsIndicatorColumn = {
        key: "situationsIndicator",
        name: "situationsIndicator",
        propertyKey: columnWithSituationsIndicator.name,
        isSituationsIndicator: true,
        availability: "Default",
        label: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
        tooltip: "{sap.fe.i18n>C_SITUATIONS_STATUS_COLUMN_LABEL_TOOLTIP}",
        type: ColumnType.Computed,
        formatOptions: null,
        exportSettings: null,
        propertyInfos: null,
        caseSensitive: false
      };

      // Place the draft status column after the first visible column
      const indexOfFirstVisibleColumn = tableColumns.findIndex(column => column.availability !== "Hidden");
      tableColumns.splice(indexOfFirstVisibleColumn + 1, 0, situationsIndicatorColumn);
    }

    // In case a grid table or tree table is used, we display the draft indicator in a separate column
    // so we have to disable it here to ensure, that the field building block
    // does not render it into the ID column
    // The additional column is only added for tables on a LR and in case tehe entity is draft enabled!
    const columnWithDraftIndicator = tableColumns.find(column => {
      var _column$formatOptions3, _column$formatOptions4;
      return ((_column$formatOptions3 = column.formatOptions) === null || _column$formatOptions3 === void 0 ? void 0 : _column$formatOptions3.hasDraftIndicator) !== undefined && ((_column$formatOptions4 = column.formatOptions) === null || _column$formatOptions4 === void 0 ? void 0 : _column$formatOptions4.hasDraftIndicator) === true;
    });
    if (columnWithDraftIndicator !== null && columnWithDraftIndicator !== void 0 && columnWithDraftIndicator.formatOptions && converterContext.getTemplateType() === TemplateType.ListReport && (ModelHelper.isDraftNode(converterContext.getEntitySet()) || ModelHelper.isDraftRoot(converterContext.getEntitySet()))) {
      // Switch off the draft indicator in the found column
      columnWithDraftIndicator.formatOptions.hasDraftIndicator = false;

      // Insert a separate draft indicator column
      const draftIndicatorColumn = {
        key: "draftStatus",
        name: "draftStatus",
        propertyKey: columnWithDraftIndicator.name,
        isDraftIndicator: true,
        availability: "Default",
        label: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
        tooltip: "{sap.fe.i18n>C_DRAFT_STATUS_COLUMN_LABEL_TOOLTIP}",
        type: ColumnType.Computed,
        formatOptions: null,
        exportSettings: null,
        propertyInfos: null,
        caseSensitive: false
      };
      let columnIndexToInsertAfter = 0;
      if (columnWithSituationsIndicator) {
        // If there's a situations indicator column, place the draft status column before it
        columnIndexToInsertAfter = tableColumns.findIndex(column => column.isSituationsIndicator === true) - 1;
      } else {
        // Otherwise place the draft status column after the first visible column
        columnIndexToInsertAfter = tableColumns.findIndex(column => column.availability !== "Hidden");
      }
      tableColumns.splice(columnIndexToInsertAfter + 1, 0, draftIndicatorColumn);
    }
    return tableColumns;
  }
  _exports.addComputedColumns = addComputedColumns;
  function getP13nMode(visualizationPath, converterContext, tableManifestConfiguration) {
    var _tableManifestSetting6;
    const manifestWrapper = converterContext.getManifestWrapper();
    const tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const variantManagement = manifestWrapper.getVariantManagement();
    const aPersonalization = [];
    const isAnalyticalTable = tableManifestConfiguration.type === "AnalyticalTable";
    const isResponsiveTable = tableManifestConfiguration.type === "ResponsiveTable";
    if ((tableManifestSettings === null || tableManifestSettings === void 0 ? void 0 : (_tableManifestSetting6 = tableManifestSettings.tableSettings) === null || _tableManifestSetting6 === void 0 ? void 0 : _tableManifestSetting6.personalization) !== undefined) {
      // Personalization configured in manifest.
      const personalization = tableManifestSettings.tableSettings.personalization;
      if (personalization === true) {
        // Table personalization fully enabled.
        switch (tableManifestConfiguration.type) {
          case "AnalyticalTable":
            return "Sort,Column,Filter,Group,Aggregate";
          case "ResponsiveTable":
            return "Sort,Column,Filter,Group";
          default:
            return "Sort,Column,Filter";
        }
      } else if (typeof personalization === "object") {
        // Specific personalization options enabled in manifest. Use them as is.
        if (personalization.sort) {
          aPersonalization.push("Sort");
        }
        if (personalization.column) {
          aPersonalization.push("Column");
        }
        if (personalization.filter) {
          aPersonalization.push("Filter");
        }
        if (personalization.group && (isAnalyticalTable || isResponsiveTable)) {
          aPersonalization.push("Group");
        }
        if (personalization.aggregate && isAnalyticalTable) {
          aPersonalization.push("Aggregate");
        }
        return aPersonalization.length > 0 ? aPersonalization.join(",") : undefined;
      }
    } else {
      // No personalization configured in manifest.
      aPersonalization.push("Sort");
      aPersonalization.push("Column");
      if (converterContext.getTemplateType() === TemplateType.ListReport) {
        if (variantManagement === VariantManagementType.Control || _isFilterBarHidden(manifestWrapper, converterContext)) {
          // Feature parity with V2.
          // Enable table filtering by default only in case of Control level variant management.
          // Or when the LR filter bar is hidden via manifest setting
          aPersonalization.push("Filter");
        }
      } else {
        aPersonalization.push("Filter");
      }
      if (isAnalyticalTable) {
        aPersonalization.push("Group");
        aPersonalization.push("Aggregate");
      }
      if (isResponsiveTable) {
        aPersonalization.push("Group");
      }
      return aPersonalization.join(",");
    }
    return undefined;
  }
  /**
   * Returns a Boolean value suggesting if a filter bar is being used on the page.
   *
   * Chart has a dependency to filter bar (issue with loading data). Once resolved, the check for chart should be removed here.
   * Until then, hiding filter bar is now allowed if a chart is being used on LR.
   *
   * @param manifestWrapper Manifest settings getter for the page
   * @param converterContext The instance of the converter context
   * @returns Boolean suggesting if a filter bar is being used on the page.
   */
  _exports.getP13nMode = getP13nMode;
  function _isFilterBarHidden(manifestWrapper, converterContext) {
    return manifestWrapper.isFilterBarHidden() && !converterContext.getManifestWrapper().hasMultipleVisualizations() && converterContext.getTemplateType() !== TemplateType.AnalyticalListPage;
  }
  /**
   * Returns a JSON string containing the sort conditions for the presentation variant.
   *
   * @param converterContext The instance of the converter context
   * @param presentationVariantAnnotation Presentation variant annotation
   * @param columns Table columns processed by the converter
   * @returns Sort conditions for a presentation variant.
   */
  function getSortConditions(converterContext, presentationVariantAnnotation, columns) {
    // Currently navigation property is not supported as sorter
    const nonSortableProperties = getNonSortablePropertiesRestrictions(converterContext.getEntitySet());
    let sortConditions;
    if (presentationVariantAnnotation !== null && presentationVariantAnnotation !== void 0 && presentationVariantAnnotation.SortOrder) {
      const sorters = [];
      const conditions = {
        sorters: sorters
      };
      presentationVariantAnnotation.SortOrder.forEach(condition => {
        const conditionProperty = condition.Property;
        if ((conditionProperty === null || conditionProperty === void 0 ? void 0 : conditionProperty.$target) !== undefined && !nonSortableProperties.includes(conditionProperty.$target.name)) {
          const infoName = convertPropertyPathsToInfoNames([conditionProperty], columns)[0];
          if (infoName) {
            conditions.sorters.push({
              name: infoName,
              descending: !!condition.Descending
            });
          }
        }
      });
      sortConditions = conditions.sorters.length ? JSON.stringify(conditions) : undefined;
    }
    return sortConditions;
  }
  function getInitialExpansionLevel(presentationVariantAnnotation) {
    var _presentationVariantA;
    if (!presentationVariantAnnotation) {
      return undefined;
    }
    const level = (_presentationVariantA = presentationVariantAnnotation.InitialExpansionLevel) === null || _presentationVariantA === void 0 ? void 0 : _presentationVariantA.valueOf();
    return typeof level === "number" ? level : undefined;
  }
  /**
   * Converts an array of propertyPath to an array of propertyInfo names.
   *
   * @param paths the array to be converted
   * @param columns the array of propertyInfos
   * @returns an array of propertyInfo names
   */
  function convertPropertyPathsToInfoNames(paths, columns) {
    const infoNames = [];
    let propertyInfo, annotationColumn;
    paths.forEach(currentPath => {
      if (currentPath !== null && currentPath !== void 0 && currentPath.value) {
        propertyInfo = columns.find(column => {
          annotationColumn = column;
          return !annotationColumn.propertyInfos && annotationColumn.relativePath === (currentPath === null || currentPath === void 0 ? void 0 : currentPath.value);
        });
        if (propertyInfo) {
          infoNames.push(propertyInfo.name);
        }
      }
    });
    return infoNames;
  }
  /**
   * Returns a JSON string containing Presentation Variant group conditions.
   *
   * @param presentationVariantAnnotation Presentation variant annotation
   * @param columns Converter processed table columns
   * @param tableType The table type.
   * @returns Group conditions for a Presentation variant.
   */
  function getGroupConditions(presentationVariantAnnotation, columns, tableType) {
    let groupConditions;
    if (presentationVariantAnnotation !== null && presentationVariantAnnotation !== void 0 && presentationVariantAnnotation.GroupBy) {
      let aGroupBy = presentationVariantAnnotation.GroupBy;
      if (tableType === "ResponsiveTable") {
        aGroupBy = aGroupBy.slice(0, 1);
      }
      const aGroupLevels = convertPropertyPathsToInfoNames(aGroupBy, columns).map(infoName => {
        return {
          name: infoName
        };
      });
      groupConditions = aGroupLevels.length ? JSON.stringify({
        groupLevels: aGroupLevels
      }) : undefined;
    }
    return groupConditions;
  }
  /**
   * Updates the column's propertyInfos of a analytical table integrating all extensions and binding-relevant property info part.
   *
   * @param tableVisualization The visualization to be updated
   */
  function _updatePropertyInfosWithAggregatesDefinitions(tableVisualization) {
    const relatedAdditionalPropertyNameMap = {};
    tableVisualization.columns.forEach(column => {
      var _column$additionalPro2;
      column = column;
      const aggregatablePropertyName = Object.keys(tableVisualization.aggregates).find(aggregate => aggregate === column.name);
      if (aggregatablePropertyName) {
        const aggregatablePropertyDefinition = tableVisualization.aggregates[aggregatablePropertyName];
        column.aggregatable = true;
        column.extension = {
          customAggregate: aggregatablePropertyDefinition.defaultAggregate ?? {}
        };
      }
      if ((_column$additionalPro2 = column.additionalPropertyInfos) !== null && _column$additionalPro2 !== void 0 && _column$additionalPro2.length) {
        column.additionalPropertyInfos.forEach(additionalPropertyInfo => {
          // Create propertyInfo for each additional property.
          // The new property 'name' has been prefixed with 'Property_Technical::' for uniqueness and it has been named technical property as it requires dedicated MDC attributes (technicallyGroupable and technicallyAggregatable).
          createTechnicalProperty(additionalPropertyInfo, tableVisualization.columns, relatedAdditionalPropertyNameMap);
        });
      }
    });
    tableVisualization.columns.forEach(column => {
      column = column;
      if (column.additionalPropertyInfos) {
        var _column$propertyInfos3;
        column.additionalPropertyInfos = column.additionalPropertyInfos.map(propertyInfo => relatedAdditionalPropertyNameMap[propertyInfo] ?? propertyInfo);
        // Add additional properties to the complex property using the hidden annotation.
        column.propertyInfos = (_column$propertyInfos3 = column.propertyInfos) === null || _column$propertyInfos3 === void 0 ? void 0 : _column$propertyInfos3.concat(column.additionalPropertyInfos);
      }
    });
  }
  /**
   * Provides the required properties set on the annotations.
   *
   * @param converterContext  The instance of the converter context
   * @returns The paths of the restricted properties
   */
  function getRequiredProperties(converterContext) {
    return getContextPropertyRestriction(converterContext.getDataModelObjectPath(), capabilities => {
      var _InsertRestrictions;
      return capabilities === null || capabilities === void 0 ? void 0 : (_InsertRestrictions = capabilities.InsertRestrictions) === null || _InsertRestrictions === void 0 ? void 0 : _InsertRestrictions.RequiredProperties;
    }, false);
  }
  /**
   * Determines if the property is annotated as a required property.
   * @param name The name of the property
   * @param converterContext The instance of the converter context
   * @returns True if the property is required
   */
  function isAnnotatedRequiredProperty(name, converterContext) {
    return getRequiredProperties(converterContext).map(property => {
      var _property$$target;
      return (_property$$target = property.$target) === null || _property$$target === void 0 ? void 0 : _property$$target.fullyQualifiedName;
    }).includes(name);
  }
  /**
   * Returns a JSON string containing Presentation Variant aggregate conditions.
   *
   * @param presentationVariantAnnotation Presentation variant annotation
   * @param columns Converter processed table columns
   * @returns Group conditions for a Presentation variant.
   */
  function getAggregateConditions(presentationVariantAnnotation, columns) {
    let aggregateConditions;
    if (presentationVariantAnnotation !== null && presentationVariantAnnotation !== void 0 && presentationVariantAnnotation.Total) {
      const aTotals = presentationVariantAnnotation.Total;
      const aggregates = {};
      convertPropertyPathsToInfoNames(aTotals, columns).forEach(infoName => {
        aggregates[infoName] = {};
      });
      aggregateConditions = JSON.stringify(aggregates);
    }
    return aggregateConditions;
  }
  /**
   * Calculates the standard actions and adjacent properties that are needed in the further conversion process.
   *
   * @param lineItemAnnotation Collection of data fields used for representation in a table or list
   * @param visualizationPath The visualization path
   * @param converterContext The instance of the converter context
   * @param tableManifestConfiguration The table manifest configuration
   * @param navigationSettings The navigation target manifest configuration
   * @param viewConfiguration The manifest configuration of the currently templated view
   * @returns Standard actions and connected properties
   */
  function getStandardActionsConfiguration(lineItemAnnotation, visualizationPath, converterContext, tableManifestConfiguration, navigationSettings, viewConfiguration) {
    const creationBehaviour = _getCreationBehaviour(lineItemAnnotation, tableManifestConfiguration, converterContext, navigationSettings, visualizationPath);
    const standardActionsContext = generateStandardActionsContext(converterContext, creationBehaviour.mode, tableManifestConfiguration, viewConfiguration);
    const deleteButtonVisibilityExpression = getDeleteVisibility(converterContext, standardActionsContext);
    const massEditButtonVisibilityExpression = getMassEditVisibility(converterContext, standardActionsContext);
    const isInsertUpdateActionsTemplated = getInsertUpdateActionsTemplating(standardActionsContext, isDraftOrStickySupported(converterContext));
    const standardActions = {
      cut: getStandardActionCut(converterContext, standardActionsContext),
      create: getStandardActionCreate(converterContext, standardActionsContext),
      delete: getStandardActionDelete(converterContext, standardActionsContext),
      paste: getStandardActionPaste(converterContext, standardActionsContext, isInsertUpdateActionsTemplated),
      massEdit: getStandardActionMassEdit(converterContext, standardActionsContext),
      insights: getStandardActionInsights(converterContext, standardActionsContext, visualizationPath),
      creationRow: getCreationRow(converterContext, standardActionsContext)
    };
    return {
      creationBehaviour,
      deleteButtonVisibilityExpression,
      massEditButtonVisibilityExpression,
      isInsertUpdateActionsTemplated,
      standardActions
    };
  }
  _exports.getStandardActionsConfiguration = getStandardActionsConfiguration;
  function getTableAnnotationConfiguration(lineItemAnnotation, visualizationPath, converterContext, tableManifestConfiguration, columns, navigationSettings, standardActionsConfiguration, presentationVariantAnnotation, viewConfiguration) {
    var _converterContext$get17, _converterContext$get18, _converterContext$get19;
    // Need to get the target
    const {
      navigationPropertyPath
    } = splitPath(visualizationPath);
    const typeNamePlural = (_converterContext$get17 = converterContext.getDataModelObjectPath().targetEntityType.annotations) === null || _converterContext$get17 === void 0 ? void 0 : (_converterContext$get18 = _converterContext$get17.UI) === null || _converterContext$get18 === void 0 ? void 0 : (_converterContext$get19 = _converterContext$get18.HeaderInfo) === null || _converterContext$get19 === void 0 ? void 0 : _converterContext$get19.TypeNamePlural;
    const title = typeNamePlural && compileExpression(getExpressionFromAnnotation(typeNamePlural));
    const entitySet = converterContext.getDataModelObjectPath().targetEntitySet;
    const pageManifestSettings = converterContext.getManifestWrapper();
    const hasAbsolutePath = navigationPropertyPath.length === 0,
      p13nMode = getP13nMode(visualizationPath, converterContext, tableManifestConfiguration),
      id = navigationPropertyPath ? getTableID(visualizationPath) : getTableID(converterContext.getContextPath(), "LineItem");
    const targetCapabilities = getCapabilityRestriction(converterContext);
    const navigationTargetPath = getNavigationTargetPath(converterContext, navigationPropertyPath);
    const selectionMode = getSelectionMode(lineItemAnnotation, visualizationPath, converterContext, hasAbsolutePath, targetCapabilities, standardActionsConfiguration.deleteButtonVisibilityExpression, standardActionsConfiguration.massEditButtonVisibilityExpression);
    let threshold = navigationPropertyPath ? 10 : 30;
    if (presentationVariantAnnotation !== null && presentationVariantAnnotation !== void 0 && presentationVariantAnnotation.MaxItems) {
      threshold = presentationVariantAnnotation.MaxItems.valueOf();
    }
    const variantManagement = pageManifestSettings.getVariantManagement();
    const isSearchable = isPathSearchable(converterContext.getDataModelObjectPath());
    return {
      id: id,
      entityName: entitySet ? entitySet.name : "",
      collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
      navigationPath: navigationPropertyPath,
      row: _getRowConfigurationProperty(lineItemAnnotation, converterContext, navigationSettings, navigationTargetPath, tableManifestConfiguration.type),
      p13nMode: p13nMode,
      isInsertUpdateActionsTemplated: standardActionsConfiguration.isInsertUpdateActionsTemplated,
      updatablePropertyPath: getCurrentEntitySetUpdatablePath(converterContext),
      displayMode: isInDisplayMode(converterContext, viewConfiguration),
      create: standardActionsConfiguration.creationBehaviour,
      selectionMode: selectionMode,
      variantManagement: variantManagement === "Control" && !p13nMode ? VariantManagementType.None : variantManagement,
      threshold: threshold,
      sortConditions: getSortConditions(converterContext, presentationVariantAnnotation, columns),
      title: title,
      searchable: tableManifestConfiguration.type !== "AnalyticalTable" && !(isConstant(isSearchable) && isSearchable.value === false),
      initialExpansionLevel: getInitialExpansionLevel(presentationVariantAnnotation),
      requiredProperties: getRequiredProperties(converterContext).filter(property => {
        var _property$$target2;
        return (property === null || property === void 0 ? void 0 : (_property$$target2 = property.$target) === null || _property$$target2 === void 0 ? void 0 : _property$$target2.type) !== "Edm.Boolean";
      }).map(property => property.value)
    };
  }
  /**
   * Gets the data type of a column for the export.
   *
   * @param dataType The data type of a property, column
   * @param isATimezone Is the given property a timezone
   * @param isCurrency Is the given property a currency
   * @param exportSettings The already detected export settings from datafields
   * @returns The supported export type
   */
  _exports.getTableAnnotationConfiguration = getTableAnnotationConfiguration;
  function getExportDataType(dataType) {
    let isATimezone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let isCurrency = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let exportSettings = arguments.length > 3 ? arguments[3] : undefined;
    let exportDataType = "String";
    if (!dataType || exportSettings !== null && exportSettings !== void 0 && exportSettings.dataPointTargetValue) {
      return exportDataType;
    }
    if (exportSettings !== null && exportSettings !== void 0 && exportSettings.isCurrency || isCurrency) {
      return "Currency";
    }
    if (isATimezone) {
      return "Timezone";
    }
    if (exportSettings !== null && exportSettings !== void 0 && exportSettings.wrap) {
      return exportDataType;
    }
    switch (dataType) {
      case "Edm.Decimal":
      case "Edm.Int32":
      case "Edm.Int64":
      case "Edm.Double":
      case "Edm.Byte":
        exportDataType = "Number";
        break;
      case "Edm.DateOfTime":
      case "Edm.Date":
        exportDataType = "Date";
        break;
      case "Edm.DateTimeOffset":
        exportDataType = "DateTime";
        break;
      case "Edm.TimeOfDay":
        exportDataType = "Time";
        break;
      case "Edm.Boolean":
        exportDataType = "Boolean";
        break;
      default:
        exportDataType = "String";
    }
    return exportDataType;
  }
  /**
   * Splits the visualization path into navigation property path and annotation.
   *
   * @param visualizationPath
   * @returns The split path
   */
  function splitPath(visualizationPath) {
    const [targetNavigationPropertyPath, annotationPath] = visualizationPath.split("@");
    let navigationPropertyPath = targetNavigationPropertyPath;
    if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
      // Drop trailing slash
      navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
    }
    return {
      navigationPropertyPath,
      annotationPath
    };
  }
  _exports.splitPath = splitPath;
  function getSelectionVariantConfiguration(selectionVariantPath, converterContext) {
    const resolvedTarget = converterContext.getEntityTypeAnnotation(selectionVariantPath);
    const selection = resolvedTarget.annotation;
    if (selection) {
      var _selection$SelectOpti, _selection$Text;
      const propertyNames = [];
      (_selection$SelectOpti = selection.SelectOptions) === null || _selection$SelectOpti === void 0 ? void 0 : _selection$SelectOpti.forEach(selectOption => {
        const propertyName = selectOption.PropertyName;
        const propertyPath = (propertyName === null || propertyName === void 0 ? void 0 : propertyName.value) ?? "";
        if (!propertyNames.includes(propertyPath)) {
          propertyNames.push(propertyPath);
        }
      });
      return {
        text: selection === null || selection === void 0 ? void 0 : (_selection$Text = selection.Text) === null || _selection$Text === void 0 ? void 0 : _selection$Text.toString(),
        propertyNames: propertyNames
      };
    }
    return undefined;
  }
  _exports.getSelectionVariantConfiguration = getSelectionVariantConfiguration;
  function _getFullScreenBasedOnDevice(tableSettings, converterContext, isIphone) {
    // If enableFullScreen is not set, use as default true on phone and false otherwise
    let enableFullScreen = tableSettings.enableFullScreen ?? isIphone;
    // Make sure that enableFullScreen is not set on ListReport for desktop or tablet
    if (!isIphone && enableFullScreen && converterContext.getTemplateType() === TemplateType.ListReport) {
      enableFullScreen = false;
      converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.Low, IssueType.FULLSCREENMODE_NOT_ON_LISTREPORT);
    }
    return enableFullScreen;
  }
  function _getMultiSelectMode(tableSettings, tableType, converterContext) {
    let multiSelectMode;
    if (tableType !== "ResponsiveTable") {
      return undefined;
    }
    switch (converterContext.getTemplateType()) {
      case TemplateType.ListReport:
      case TemplateType.ObjectPage:
        multiSelectMode = tableSettings.selectAll === false ? "ClearAll" : "Default";
        if (converterContext.getTemplateType() === TemplateType.ObjectPage && converterContext.getManifestWrapper().useIconTabBar()) {
          multiSelectMode = !tableSettings.selectAll ? "ClearAll" : "Default";
        }
        break;
      case TemplateType.AnalyticalListPage:
        multiSelectMode = !tableSettings.selectAll ? "ClearAll" : "Default";
        break;
      default:
    }
    return multiSelectMode;
  }
  function _getTableType(tableSettings, aggregationHelper, converterContext) {
    let tableType = (tableSettings === null || tableSettings === void 0 ? void 0 : tableSettings.type) || "ResponsiveTable";
    /*  Now, we keep the configuration in the manifest, even if it leads to errors.
    	We only change if we're not on desktop from Analytical/Tree to Responsive.
     */
    if ((tableType === "AnalyticalTable" || tableType === "TreeTable") && !converterContext.getManifestWrapper().isDesktop()) {
      tableType = "ResponsiveTable";
    }
    return tableType;
  }
  function _getTableMode(tableType, tableSettings, isTemplateListReport) {
    if (tableType !== "ResponsiveTable") {
      if (isTemplateListReport) {
        return {
          rowCountMode: "Auto",
          rowCount: 3
        };
      } else {
        return {
          rowCountMode: tableSettings.rowCountMode ?? "Fixed",
          rowCount: tableSettings.rowCount ? tableSettings.rowCount : 5
        };
      }
    } else {
      return {};
    }
  }
  function _getCondensedTableLayout(_tableType, _tableSettings) {
    return _tableSettings.condensedTableLayout !== undefined && _tableType !== "ResponsiveTable" ? _tableSettings.condensedTableLayout : false;
  }
  function _getTableSelectionLimit(_tableSettings) {
    return _tableSettings.selectAll === true || _tableSettings.selectionLimit === 0 ? 0 : _tableSettings.selectionLimit || 200;
  }
  function _getTableInlineCreationRowCount(_tableSettings) {
    var _tableSettings$creati, _tableSettings$creati2;
    return (_tableSettings$creati = _tableSettings.creationMode) !== null && _tableSettings$creati !== void 0 && _tableSettings$creati.inlineCreationRowCount ? (_tableSettings$creati2 = _tableSettings.creationMode) === null || _tableSettings$creati2 === void 0 ? void 0 : _tableSettings$creati2.inlineCreationRowCount : 1;
  }
  function _getFilters(tableSettings, quickFilterPaths, quickSelectionVariant, path) {
    var _tableSettings$quickV;
    if (quickSelectionVariant) {
      quickFilterPaths.push({
        annotationPath: path.annotationPath
      });
    }
    return {
      quickFilters: {
        showCounts: tableSettings === null || tableSettings === void 0 ? void 0 : (_tableSettings$quickV = tableSettings.quickVariantSelection) === null || _tableSettings$quickV === void 0 ? void 0 : _tableSettings$quickV.showCounts,
        paths: quickFilterPaths
      }
    };
  }
  function _getEnableExport(tableSettings, converterContext, enablePaste) {
    return tableSettings.enableExport !== undefined ? tableSettings.enableExport : converterContext.getTemplateType() !== "ObjectPage" || enablePaste;
  }
  function _getFrozenColumnCount(tableSettings) {
    return tableSettings.frozenColumnCount;
  }

  /**
   * Get the widthIncludingColumnHeader value from the tableSettings if it exists.
   *
   * @param tableSettings TableSettings Object
   * @returns Returns the value of widthIncludingColumnHeader or false
   */
  function _getWidthIncludingColumnHeader(tableSettings) {
    return tableSettings.widthIncludingColumnHeader ?? false;
  }
  function _getFilterConfiguration(tableSettings, lineItemAnnotation, converterContext) {
    var _tableSettings$quickV2, _tableSettings$quickV3, _tableSettings$quickV4;
    if (!lineItemAnnotation) {
      return {};
    }
    const quickFilterPaths = [];
    const targetEntityType = converterContext.getAnnotationEntityType(lineItemAnnotation);
    let quickSelectionVariant;
    let filters;
    tableSettings === null || tableSettings === void 0 ? void 0 : (_tableSettings$quickV2 = tableSettings.quickVariantSelection) === null || _tableSettings$quickV2 === void 0 ? void 0 : (_tableSettings$quickV3 = _tableSettings$quickV2.paths) === null || _tableSettings$quickV3 === void 0 ? void 0 : _tableSettings$quickV3.forEach(path => {
      quickSelectionVariant = targetEntityType.resolvePath(path.annotationPath);
      filters = _getFilters(tableSettings, quickFilterPaths, quickSelectionVariant, path);
    });
    let hideTableTitle = false;
    hideTableTitle = !!((_tableSettings$quickV4 = tableSettings.quickVariantSelection) !== null && _tableSettings$quickV4 !== void 0 && _tableSettings$quickV4.hideTableTitle);
    return {
      filters: filters,
      headerVisible: !(quickSelectionVariant && hideTableTitle)
    };
  }
  function _getCollectedNavigationPropertyLabels(relativePath, converterContext) {
    const navigationProperties = enhanceDataModelPath(converterContext.getDataModelObjectPath(), relativePath).navigationProperties;
    if ((navigationProperties === null || navigationProperties === void 0 ? void 0 : navigationProperties.length) > 0) {
      const collectedNavigationPropertyLabels = [];
      navigationProperties.forEach(navProperty => {
        collectedNavigationPropertyLabels.push(getLabel(navProperty) || navProperty.name);
      });
      return collectedNavigationPropertyLabels;
    }
  }
  /**
   * Determines if the action will have an expression for enablement generated.
   *
   * @param dataField The dataField containing an action
   * @param sEntityType The current entity for templating
   * @returns Whether an expression for enablement is to be generated
   */
  function _useEnabledExpression(dataField, sEntityType) {
    var _dataField$ActionTarg3, _dataField$ActionTarg4, _dataField$ActionTarg5;
    // There are three cases when a table action has an OperationAvailable that leads to an enablement expression
    // and is not dependent upon the table entries.
    // 1. An action with an overload, that is executed against a parent entity.
    // 2. An unbound action
    // 3. A static action (that is, bound to a collection)
    let useEnabledExpression = false;
    if (((_dataField$ActionTarg3 = dataField.ActionTarget) === null || _dataField$ActionTarg3 === void 0 ? void 0 : (_dataField$ActionTarg4 = _dataField$ActionTarg3.annotations) === null || _dataField$ActionTarg4 === void 0 ? void 0 : (_dataField$ActionTarg5 = _dataField$ActionTarg4.Core) === null || _dataField$ActionTarg5 === void 0 ? void 0 : _dataField$ActionTarg5.OperationAvailable) !== undefined) {
      var _dataField$ActionTarg6, _dataField$ActionTarg7, _dataField$ActionTarg8, _dataField$ActionTarg9;
      if (!((_dataField$ActionTarg6 = dataField.ActionTarget) !== null && _dataField$ActionTarg6 !== void 0 && _dataField$ActionTarg6.isBound)) {
        // Unbound action. Is recognised, but getExpressionFromAnnotation checks for isBound = true, so not generated.
        useEnabledExpression = true;
      } else if ((_dataField$ActionTarg7 = dataField.ActionTarget) !== null && _dataField$ActionTarg7 !== void 0 && _dataField$ActionTarg7.isBound && ((_dataField$ActionTarg8 = dataField.ActionTarget) === null || _dataField$ActionTarg8 === void 0 ? void 0 : _dataField$ActionTarg8.sourceType) !== sEntityType) {
        // Overload action
        useEnabledExpression = true;
      } else if ((_dataField$ActionTarg9 = dataField.ActionTarget) !== null && _dataField$ActionTarg9 !== void 0 && _dataField$ActionTarg9.parameters[0].isCollection) {
        // Static action
        useEnabledExpression = true;
      }
    }
    return useEnabledExpression;
  }

  /**
   * Updates the table control configuration with Tree-Table specific information.
   *
   * @param tableConfiguration The table configuration
   * @param tableSettings Settings from the manifest
   */
  function updateTreeTableManifestConfiguration(tableConfiguration, tableSettings) {
    var _tableSettings$creati3, _tableSettings$creati4, _tableSettings$creati5, _tableSettings$creati6, _tableSettings$creati7;
    tableConfiguration.hierarchyQualifier = tableSettings.hierarchyQualifier;
    tableConfiguration.isNodeMovable = getCustomFunctionInfo(tableSettings.isNodeMovable, tableConfiguration);
    tableConfiguration.isMoveToPositionAllowed = getCustomFunctionInfo(tableSettings.isMoveToPositionAllowed, tableConfiguration);
    tableConfiguration.createEnablement = getCustomFunctionInfo((_tableSettings$creati3 = tableSettings.creationMode) === null || _tableSettings$creati3 === void 0 ? void 0 : _tableSettings$creati3.isCreateEnabled, tableConfiguration);
    if ((_tableSettings$creati4 = tableSettings.creationMode) !== null && _tableSettings$creati4 !== void 0 && (_tableSettings$creati5 = _tableSettings$creati4.nodeType) !== null && _tableSettings$creati5 !== void 0 && _tableSettings$creati5.propertyName && (_tableSettings$creati6 = tableSettings.creationMode) !== null && _tableSettings$creati6 !== void 0 && (_tableSettings$creati7 = _tableSettings$creati6.nodeType) !== null && _tableSettings$creati7 !== void 0 && _tableSettings$creati7.values) {
      const values = tableSettings.creationMode.nodeType.values;
      tableConfiguration.nodeType = {
        propertyName: tableSettings.creationMode.nodeType.propertyName,
        values: Object.keys(values).map(value => {
          return {
            value,
            text: values[value]
          };
        })
      };
    }
  }
  function getCustomFunctionInfo(value, tableConfiguration) {
    if (!value) {
      return undefined;
    }
    const lastDotIndex = value.lastIndexOf(".") || -1;
    const moduleName = value.substring(0, lastDotIndex).replace(/\./gi, "/");
    const methodName = value.substring(lastDotIndex + 1);

    // Add the custom module in the list of required modules if necessary
    if (!moduleName.startsWith("/extension/")) {
      if (!tableConfiguration.additionalRequiredModules) {
        tableConfiguration.additionalRequiredModules = [moduleName];
      } else if (!tableConfiguration.additionalRequiredModules.includes(moduleName)) {
        tableConfiguration.additionalRequiredModules.push(moduleName);
      }
    }
    return {
      moduleName,
      methodName
    };
  }
  function getTableManifestConfiguration(lineItemAnnotation, visualizationPath, converterContext) {
    var _tableSettings$creati8, _tableSettings$creati9, _tableSettings$creati10, _tableSettings$creati14, _tableSettings$creati15, _tableSettings$creati16, _tableSettings$quickV5, _manifestWrapper$getV;
    let checkCondensedLayout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const _manifestWrapper = converterContext.getManifestWrapper();
    const tableManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const tableSettings = (tableManifestSettings === null || tableManifestSettings === void 0 ? void 0 : tableManifestSettings.tableSettings) ?? {};
    const creationMode = ((_tableSettings$creati8 = tableSettings.creationMode) === null || _tableSettings$creati8 === void 0 ? void 0 : _tableSettings$creati8.name) || CreationMode.NewPage;
    const enableAutoColumnWidth = !_manifestWrapper.isPhone();
    const enablePaste = tableSettings.enablePaste !== undefined ? tableSettings.enablePaste : converterContext.getTemplateType() === "ObjectPage"; // Paste is disabled by default excepted for OP
    const templateType = converterContext.getTemplateType();
    const dataStateIndicatorFilter = templateType === TemplateType.ListReport ? "API.dataStateIndicatorFilter" : undefined;
    const isCondensedTableLayoutCompliant = checkCondensedLayout && _manifestWrapper.isCondensedLayoutCompliant();
    const oFilterConfiguration = _getFilterConfiguration(tableSettings, lineItemAnnotation, converterContext);
    const customValidationFunction = (_tableSettings$creati9 = tableSettings.creationMode) === null || _tableSettings$creati9 === void 0 ? void 0 : _tableSettings$creati9.customValidationFunction;
    const entityType = converterContext.getEntityType();
    const aggregationHelper = new AggregationHelper(entityType, converterContext);
    const tableType = _getTableType(tableSettings, aggregationHelper, converterContext);
    const tableRowMode = _getTableMode(tableType, tableSettings, templateType === TemplateType.ListReport);
    const condensedTableLayout = _getCondensedTableLayout(tableType, tableSettings);
    let inlineCreationRowsHiddenInEditMode = false;
    if ((_tableSettings$creati10 = tableSettings.creationMode) !== null && _tableSettings$creati10 !== void 0 && _tableSettings$creati10.inlineCreationRowsHiddenInEditMode) {
      var _tableSettings$creati11, _tableSettings$creati12, _tableSettings$creati13;
      inlineCreationRowsHiddenInEditMode = typeof ((_tableSettings$creati11 = tableSettings.creationMode) === null || _tableSettings$creati11 === void 0 ? void 0 : _tableSettings$creati11.inlineCreationRowsHiddenInEditMode) === "string" ? ((_tableSettings$creati12 = tableSettings.creationMode) === null || _tableSettings$creati12 === void 0 ? void 0 : _tableSettings$creati12.inlineCreationRowsHiddenInEditMode) === "true" : (_tableSettings$creati13 = tableSettings.creationMode) === null || _tableSettings$creati13 === void 0 ? void 0 : _tableSettings$creati13.inlineCreationRowsHiddenInEditMode;
    }
    const oConfiguration = {
      // If no createAtEnd is specified it will be false for Inline create and true otherwise
      createAtEnd: ((_tableSettings$creati14 = tableSettings.creationMode) === null || _tableSettings$creati14 === void 0 ? void 0 : _tableSettings$creati14.createAtEnd) !== undefined ? (_tableSettings$creati15 = tableSettings.creationMode) === null || _tableSettings$creati15 === void 0 ? void 0 : _tableSettings$creati15.createAtEnd : creationMode !== CreationMode.Inline,
      creationMode: creationMode,
      customValidationFunction: customValidationFunction,
      dataStateIndicatorFilter: dataStateIndicatorFilter,
      // if a custom validation function is provided, disableAddRowButtonForEmptyData should not be considered, i.e. set to false
      disableAddRowButtonForEmptyData: !customValidationFunction ? !!((_tableSettings$creati16 = tableSettings.creationMode) !== null && _tableSettings$creati16 !== void 0 && _tableSettings$creati16.disableAddRowButtonForEmptyData) : false,
      enableAutoColumnWidth: enableAutoColumnWidth,
      enableExport: _getEnableExport(tableSettings, converterContext, enablePaste),
      frozenColumnCount: _getFrozenColumnCount(tableSettings),
      widthIncludingColumnHeader: _getWidthIncludingColumnHeader(tableSettings),
      enableFullScreen: _getFullScreenBasedOnDevice(tableSettings, converterContext, _manifestWrapper.isPhone()),
      enableMassEdit: tableSettings === null || tableSettings === void 0 ? void 0 : tableSettings.enableMassEdit,
      enableAddCardToInsights: tableSettings === null || tableSettings === void 0 ? void 0 : tableSettings.enableAddCardToInsights,
      enablePaste: enablePaste,
      headerVisible: true,
      multiSelectMode: _getMultiSelectMode(tableSettings, tableType, converterContext),
      selectionLimit: _getTableSelectionLimit(tableSettings),
      inlineCreationRowCount: _getTableInlineCreationRowCount(tableSettings),
      inlineCreationRowsHiddenInEditMode: inlineCreationRowsHiddenInEditMode,
      showRowCount: !(tableSettings !== null && tableSettings !== void 0 && (_tableSettings$quickV5 = tableSettings.quickVariantSelection) !== null && _tableSettings$quickV5 !== void 0 && _tableSettings$quickV5.showCounts) && !((_manifestWrapper$getV = _manifestWrapper.getViewConfiguration()) !== null && _manifestWrapper$getV !== void 0 && _manifestWrapper$getV.showCounts),
      type: tableType,
      useCondensedTableLayout: condensedTableLayout && isCondensedTableLayoutCompliant,
      isCompactType: _manifestWrapper.isCompactType()
    };
    const tableConfiguration = {
      ...oConfiguration,
      ...tableRowMode,
      ...oFilterConfiguration
    };
    if (tableType === "TreeTable") {
      updateTreeTableManifestConfiguration(tableConfiguration, tableSettings);
    }
    if (tableSettings.selectionChange) {
      tableConfiguration.selectionChange = getCustomFunctionInfo(tableSettings.selectionChange, tableConfiguration);
    }
    return tableConfiguration;
  }
  _exports.getTableManifestConfiguration = getTableManifestConfiguration;
  function getTypeConfig(oProperty, dataType) {
    var _oTargetMapping, _propertyTypeConfig$t, _propertyTypeConfig$t2, _propertyTypeConfig$t3, _propertyTypeConfig$t4;
    let oTargetMapping;
    if (isProperty(oProperty)) {
      oTargetMapping = isTypeDefinition(oProperty.targetType) ? EDM_TYPE_MAPPING[oProperty.targetType.underlyingType] : EDM_TYPE_MAPPING[oProperty.type];
    }
    if (oTargetMapping === undefined && dataType !== undefined) {
      oTargetMapping = EDM_TYPE_MAPPING[dataType];
    }
    const propertyTypeConfig = {
      type: (_oTargetMapping = oTargetMapping) === null || _oTargetMapping === void 0 ? void 0 : _oTargetMapping.type,
      constraints: {},
      formatOptions: {}
    };
    if (isProperty(oProperty) && oTargetMapping !== undefined) {
      var _oTargetMapping$const, _oTargetMapping$const2, _oTargetMapping$const3, _oTargetMapping$const4, _oTargetMapping$const5, _oProperty$annotation8, _oProperty$annotation9, _oProperty$annotation10, _oProperty$annotation11, _oTargetMapping$const6, _oProperty$annotation12, _oProperty$annotation13, _oProperty$annotation14, _oProperty$annotation15, _oTargetMapping$const7, _oProperty$annotation16, _oProperty$annotation17;
      propertyTypeConfig.constraints = {
        scale: (_oTargetMapping$const = oTargetMapping.constraints) !== null && _oTargetMapping$const !== void 0 && _oTargetMapping$const.$Scale ? oProperty.scale : undefined,
        precision: (_oTargetMapping$const2 = oTargetMapping.constraints) !== null && _oTargetMapping$const2 !== void 0 && _oTargetMapping$const2.$Precision ? oProperty.precision : undefined,
        maxLength: (_oTargetMapping$const3 = oTargetMapping.constraints) !== null && _oTargetMapping$const3 !== void 0 && _oTargetMapping$const3.$MaxLength ? oProperty.maxLength : undefined,
        nullable: (_oTargetMapping$const4 = oTargetMapping.constraints) !== null && _oTargetMapping$const4 !== void 0 && _oTargetMapping$const4.$Nullable ? oProperty.nullable : undefined,
        minimum: (_oTargetMapping$const5 = oTargetMapping.constraints) !== null && _oTargetMapping$const5 !== void 0 && _oTargetMapping$const5["@Org.OData.Validation.V1.Minimum/$Decimal"] && !isNaN((_oProperty$annotation8 = oProperty.annotations) === null || _oProperty$annotation8 === void 0 ? void 0 : (_oProperty$annotation9 = _oProperty$annotation8.Validation) === null || _oProperty$annotation9 === void 0 ? void 0 : _oProperty$annotation9.Minimum) ? `${(_oProperty$annotation10 = oProperty.annotations) === null || _oProperty$annotation10 === void 0 ? void 0 : (_oProperty$annotation11 = _oProperty$annotation10.Validation) === null || _oProperty$annotation11 === void 0 ? void 0 : _oProperty$annotation11.Minimum}` : undefined,
        maximum: (_oTargetMapping$const6 = oTargetMapping.constraints) !== null && _oTargetMapping$const6 !== void 0 && _oTargetMapping$const6["@Org.OData.Validation.V1.Maximum/$Decimal"] && !isNaN((_oProperty$annotation12 = oProperty.annotations) === null || _oProperty$annotation12 === void 0 ? void 0 : (_oProperty$annotation13 = _oProperty$annotation12.Validation) === null || _oProperty$annotation13 === void 0 ? void 0 : _oProperty$annotation13.Maximum) ? `${(_oProperty$annotation14 = oProperty.annotations) === null || _oProperty$annotation14 === void 0 ? void 0 : (_oProperty$annotation15 = _oProperty$annotation14.Validation) === null || _oProperty$annotation15 === void 0 ? void 0 : _oProperty$annotation15.Maximum}` : undefined,
        isDigitSequence: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && (_oTargetMapping$const7 = oTargetMapping.constraints) !== null && _oTargetMapping$const7 !== void 0 && _oTargetMapping$const7[`@${"com.sap.vocabularies.Common.v1.IsDigitSequence"}`] && (_oProperty$annotation16 = oProperty.annotations) !== null && _oProperty$annotation16 !== void 0 && (_oProperty$annotation17 = _oProperty$annotation16.Common) !== null && _oProperty$annotation17 !== void 0 && _oProperty$annotation17.IsDigitSequence ? true : undefined
      };
    }
    propertyTypeConfig.formatOptions = {
      parseAsString: (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t = propertyTypeConfig.type) === null || _propertyTypeConfig$t === void 0 ? void 0 : _propertyTypeConfig$t.indexOf("sap.ui.model.odata.type.Int")) === 0 || (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t2 = propertyTypeConfig.type) === null || _propertyTypeConfig$t2 === void 0 ? void 0 : _propertyTypeConfig$t2.indexOf("sap.ui.model.odata.type.Double")) === 0 ? false : undefined,
      emptyString: (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t3 = propertyTypeConfig.type) === null || _propertyTypeConfig$t3 === void 0 ? void 0 : _propertyTypeConfig$t3.indexOf("sap.ui.model.odata.type.Int")) === 0 || (propertyTypeConfig === null || propertyTypeConfig === void 0 ? void 0 : (_propertyTypeConfig$t4 = propertyTypeConfig.type) === null || _propertyTypeConfig$t4 === void 0 ? void 0 : _propertyTypeConfig$t4.indexOf("sap.ui.model.odata.type.Double")) === 0 ? "" : undefined,
      parseKeepsEmptyString: propertyTypeConfig.type === "sap.ui.model.odata.type.String" && propertyTypeConfig.constraints.nullable === false ? true : undefined
    };
    return propertyTypeConfig;
  }
  _exports.getTypeConfig = getTypeConfig;
  return {
    getTableActions,
    getTableColumns,
    getColumnsFromEntityType,
    updateLinkedProperties,
    createTableVisualization,
    createDefaultTableVisualization,
    getCapabilityRestriction,
    getImportance,
    getSelectionMode,
    getRowStatusVisibility,
    getP13nMode,
    getStandardActionsConfiguration,
    getTableAnnotationConfiguration,
    isFilteringCaseSensitive,
    splitPath,
    getSelectionVariantConfiguration,
    getTableManifestConfiguration,
    getTypeConfig,
    updateTableVisualizationForType,
    getNavigationTargetPath
  };
}, false);
