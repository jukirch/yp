/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/formatters/TableFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/library", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/helpers/ActionHelper", "sap/fe/macros/table/TableSizeHelper", "sap/ui/mdc/enums/FieldEditMode"], function (Log, MetaModelConverter, DataVisualization, TableFormatter, BindingToolkit, SizeHelper, StableIdHelper, TypeGuards, FELibrary, DataModelPathHelper, PropertyHelper, UIFormatters, CommonHelper, FieldTemplating, ActionHelper, TableSizeHelper, FieldEditMode) {
  "use strict";

  var formatValueRecursively = FieldTemplating.formatValueRecursively;
  var getEditMode = UIFormatters.getEditMode;
  var isImageURL = PropertyHelper.isImageURL;
  var hasText = PropertyHelper.hasText;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var fn = BindingToolkit.fn;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var getUiControl = DataVisualization.getUiControl;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const CreationMode = FELibrary.CreationMode;

  /**
   * Helper class used by the control library for OData-specific handling (OData V4)
   *
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const TableHelper = {
    /**
     * Check if a given action is static.
     *
     * @param actionObject The instance or the path of the action
     * @param actionName The name of the action
     * @returns Returns 'true' if action is static, else 'false'
     * @private
     * @ui5-restricted
     */
    _isStaticAction: function (actionObject, actionName) {
      let action;
      if (actionObject) {
        if (Array.isArray(actionObject)) {
          const entityType = this._getActionOverloadEntityType(actionName.toString());
          if (entityType) {
            action = actionObject.find(function (_action) {
              return _action.$IsBound && _action.$Parameter[0].$Type === entityType;
            });
          } else {
            // if this is just one - OK we take it. If it's more it's actually a wrong usage by the app
            // as we used the first one all the time we keep it as it is
            action = actionObject[0];
          }
        } else {
          action = actionObject;
        }
      }
      return !!action && typeof action !== "string" && action.$IsBound && !!action.$Parameter[0].$isCollection;
    },
    /**
     * Get the entity type of an action overload.
     *
     * @param sActionName The name of the action.
     * @returns The entity type used in the action overload.
     * @private
     */
    _getActionOverloadEntityType: function (sActionName) {
      if (sActionName && sActionName.indexOf("(") > -1) {
        const aParts = sActionName.split("(");
        return aParts[aParts.length - 1].replaceAll(")", "");
      }
      return undefined;
    },
    /**
     * Checks whether the action is overloaded on a different entity type.
     *
     * @param sActionName The name of the action.
     * @param sAnnotationTargetEntityType The entity type of the annotation target.
     * @returns Returns 'true' if the action is overloaded with a different entity type, else 'false'.
     * @private
     */
    _isActionOverloadOnDifferentType: function (sActionName, sAnnotationTargetEntityType) {
      const sEntityType = this._getActionOverloadEntityType(sActionName);
      return !!sEntityType && sAnnotationTargetEntityType !== sEntityType;
    },
    /**
     * Returns an array of the fields listed by the property RequestAtLeast in the PresentationVariant .
     *
     * @param oPresentationVariant The annotation related to com.sap.vocabularies.UI.v1.PresentationVariant.
     * @returns The fields.
     * @private
     * @ui5-restricted
     */
    getFieldsRequestedByPresentationVariant: function (oPresentationVariant) {
      var _oPresentationVariant;
      return ((_oPresentationVariant = oPresentationVariant.RequestAtLeast) === null || _oPresentationVariant === void 0 ? void 0 : _oPresentationVariant.map(oRequested => oRequested.value)) || [];
    },
    getNavigationAvailableFieldsFromLineItem: function (aLineItemContext) {
      const aSelectedFieldsArray = [];
      (aLineItemContext.getObject() || []).forEach(function (oRecord) {
        var _oRecord$NavigationAv;
        if (oRecord.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && !oRecord.Inline && !oRecord.Determining && (_oRecord$NavigationAv = oRecord.NavigationAvailable) !== null && _oRecord$NavigationAv !== void 0 && _oRecord$NavigationAv.$Path) {
          aSelectedFieldsArray.push(oRecord.NavigationAvailable.$Path);
        }
      });
      return aSelectedFieldsArray;
    },
    getNavigationAvailableMap: function (lineItemCollection) {
      const oIBNNavigationAvailableMap = {};
      lineItemCollection === null || lineItemCollection === void 0 ? void 0 : lineItemCollection.forEach(record => {
        if ("SemanticObject" in record) {
          const sKey = `${record.SemanticObject}-${record.Action}`;
          if (record.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && !record.Inline && record.RequiresContext) {
            if (record.NavigationAvailable !== undefined) {
              oIBNNavigationAvailableMap[sKey] = isPathAnnotationExpression(record.NavigationAvailable) ? record.NavigationAvailable.path : record.NavigationAvailable;
            }
          }
        }
      });
      return JSON.stringify(oIBNNavigationAvailableMap);
    },
    /**
     * Returns the context of the UI.LineItem.
     *
     * @param presentationContext The presentation context (either a presentation variant or a UI.LineItem)
     * @returns The context of the UI.LineItem
     */
    getUiLineItem: function (presentationContext) {
      return getUiControl(presentationContext, `@${"com.sap.vocabularies.UI.v1.LineItem"}`);
    },
    getUiLineItemObject: function (lineItemOrPresentationContext, convertedMetaData) {
      var _visualizations$find;
      const lineItemOrPresentationObject = convertedMetaData.resolvePath(lineItemOrPresentationContext.getPath()).target;
      if (!lineItemOrPresentationObject) return undefined;
      const visualizations = convertedMetaData.resolvePath(lineItemOrPresentationContext.getPath()).target.Visualizations;
      const lineItemObject = visualizations ? visualizations === null || visualizations === void 0 ? void 0 : (_visualizations$find = visualizations.find(item => item.value.indexOf("@" + "com.sap.vocabularies.UI.v1.LineItem") === 0)) === null || _visualizations$find === void 0 ? void 0 : _visualizations$find.$target : lineItemOrPresentationObject;
      return (lineItemObject === null || lineItemObject === void 0 ? void 0 : lineItemObject.term) === "com.sap.vocabularies.UI.v1.LineItem" ? lineItemObject : undefined;
    },
    /**
     * Creates and returns the binding expression to load a given list of properties.
     *
     * @param properties List of properties used on a custom column
     * @returns The binding expression to load the given list of properties
     */
    createBindingToLoadProperties: function (properties) {
      const propertyBindings = properties.map(prop => pathInModel(prop));
      return compileExpression(formatResult(propertyBindings, "sap.fe.core.formatters.StandardFormatter#loadProperties"));
    },
    /**
     * Creates and returns a select query with the selected fields from the parameters that were passed.
     *
     * @param table The instance of the inner model of the table building block
     * @returns The 'select' query that has the selected fields from the parameters that were passed
     */
    create$Select: function (table) {
      const selectedFields = [];
      const lineItemContext = TableHelper.getUiLineItem(table.metaPath);
      function pushField(field) {
        if (field && !selectedFields.includes(field) && field.indexOf("/") !== 0) {
          // Do not add singleton property (with absolute path) to $select
          selectedFields.push(field);
        }
      }
      function pushFieldList(fields) {
        if (fields !== null && fields !== void 0 && fields.length) {
          fields.forEach(pushField);
        }
      }
      if (lineItemContext.getPath().includes(`@${"com.sap.vocabularies.UI.v1.LineItem"}`)) {
        var _targetCollection$ann, _table$contextObjectP, _table$contextObjectP2, _table$contextObjectP3, _table$contextObjectP4, _table$contextObjectP5, _table$contextObjectP6, _table$contextObjectP7, _table$contextObjectP8, _table$contextObjectP9, _table$contextObjectP10;
        // Don't process EntityType without LineItem
        const presentationAnnotation = getInvolvedDataModelObjects(table.metaPath).targetObject;
        const operationAvailableProperties = (table.tableDefinition.operationAvailableProperties || "").split(",");
        const applicableProperties = TableHelper._filterNonApplicableProperties(operationAvailableProperties, table.collection);
        const targetCollection = table.collectionEntity.entityType || table.collectionEntity.targetType;
        const aSemanticKeys = (((_targetCollection$ann = targetCollection.annotations.Common) === null || _targetCollection$ann === void 0 ? void 0 : _targetCollection$ann.SemanticKey) || []).map(oSemanticKey => oSemanticKey.value);
        if ((presentationAnnotation === null || presentationAnnotation === void 0 ? void 0 : presentationAnnotation.$Type) === "com.sap.vocabularies.UI.v1.PresentationVariantType") {
          pushFieldList(TableHelper.getFieldsRequestedByPresentationVariant(presentationAnnotation));
        }
        pushFieldList(TableHelper.getNavigationAvailableFieldsFromLineItem(lineItemContext));
        pushFieldList(applicableProperties);
        pushFieldList(aSemanticKeys);
        pushField((_table$contextObjectP = table.contextObjectPath.targetEntitySet) === null || _table$contextObjectP === void 0 ? void 0 : (_table$contextObjectP2 = _table$contextObjectP.annotations) === null || _table$contextObjectP2 === void 0 ? void 0 : (_table$contextObjectP3 = _table$contextObjectP2.Capabilities) === null || _table$contextObjectP3 === void 0 ? void 0 : (_table$contextObjectP4 = _table$contextObjectP3.DeleteRestrictions) === null || _table$contextObjectP4 === void 0 ? void 0 : (_table$contextObjectP5 = _table$contextObjectP4.Deletable) === null || _table$contextObjectP5 === void 0 ? void 0 : _table$contextObjectP5.path);
        pushField((_table$contextObjectP6 = table.contextObjectPath.targetEntitySet) === null || _table$contextObjectP6 === void 0 ? void 0 : (_table$contextObjectP7 = _table$contextObjectP6.annotations) === null || _table$contextObjectP7 === void 0 ? void 0 : (_table$contextObjectP8 = _table$contextObjectP7.Capabilities) === null || _table$contextObjectP8 === void 0 ? void 0 : (_table$contextObjectP9 = _table$contextObjectP8.UpdateRestrictions) === null || _table$contextObjectP9 === void 0 ? void 0 : (_table$contextObjectP10 = _table$contextObjectP9.Updatable) === null || _table$contextObjectP10 === void 0 ? void 0 : _table$contextObjectP10.path);
      }
      return selectedFields.join(",");
    },
    /**
     * Method to get column's width if defined from manifest or from customization via annotations.
     *
     * @function
     * @name getColumnWidth
     * @param oThis The instance of the inner model of the Table building block
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField DataField definition object
     * @param dataFieldActionText DataField's text from button
     * @param dataModelObjectPath The object path of the data model
     * @param useRemUnit Indicates if the rem unit must be concatenated with the column width result
     * @param microChartTitle The object containing title and description of the MicroChart
     * @returns - Column width if defined, otherwise width is set to auto
     */
    getColumnWidth: function (oThis, column, dataField, dataFieldActionText, dataModelObjectPath, useRemUnit, microChartTitle) {
      if (column.width) {
        return column.width;
      }
      if (oThis.enableAutoColumnWidth === true) {
        let width;
        width = this.getColumnWidthForImage(dataModelObjectPath) || this.getColumnWidthForDataField(oThis, column, dataField, dataFieldActionText, dataModelObjectPath, microChartTitle) || undefined;
        if (width) {
          return useRemUnit ? `${width}rem` : width;
        }
        width = compileExpression(formatResult([pathInModel("/editMode", "ui"), pathInModel("tablePropertiesAvailable", "internal"), column.name, useRemUnit, this._shouldIncludeHeaderInColumnwidhCalculation(oThis, column)], TableFormatter.getColumnWidth));
        return width;
      }
      return undefined;
    },
    /**
     * Method to get the width of the column containing an image.
     *
     * @function
     * @name getColumnWidthForImage
     * @param dataModelObjectPath The data model object path
     * @returns - Column width if defined, otherwise null (the width is treated as a rem value)
     */
    getColumnWidthForImage: function (dataModelObjectPath) {
      var _dataModelObjectPath$, _dataModelObjectPath$2, _dataModelObjectPath$3, _dataModelObjectPath$4, _dataModelObjectPath$5, _dataModelObjectPath$6, _dataModelObjectPath$7, _dataModelObjectPath$8, _dataModelObjectPath$9, _dataModelObjectPath$10, _annotations$Core2, _annotations$Core2$Me;
      let width = null;
      const annotations = (_dataModelObjectPath$ = dataModelObjectPath.targetObject) === null || _dataModelObjectPath$ === void 0 ? void 0 : (_dataModelObjectPath$2 = _dataModelObjectPath$.Value) === null || _dataModelObjectPath$2 === void 0 ? void 0 : (_dataModelObjectPath$3 = _dataModelObjectPath$2.$target) === null || _dataModelObjectPath$3 === void 0 ? void 0 : _dataModelObjectPath$3.annotations;
      const dataType = (_dataModelObjectPath$4 = dataModelObjectPath.targetObject) === null || _dataModelObjectPath$4 === void 0 ? void 0 : (_dataModelObjectPath$5 = _dataModelObjectPath$4.Value) === null || _dataModelObjectPath$5 === void 0 ? void 0 : (_dataModelObjectPath$6 = _dataModelObjectPath$5.$target) === null || _dataModelObjectPath$6 === void 0 ? void 0 : _dataModelObjectPath$6.type;
      if ((_dataModelObjectPath$7 = dataModelObjectPath.targetObject) !== null && _dataModelObjectPath$7 !== void 0 && _dataModelObjectPath$7.Value && getEditMode((_dataModelObjectPath$8 = dataModelObjectPath.targetObject.Value) === null || _dataModelObjectPath$8 === void 0 ? void 0 : _dataModelObjectPath$8.$target, dataModelObjectPath, false, false, dataModelObjectPath.targetObject) === FieldEditMode.Display) {
        var _annotations$Core, _annotations$Core$Med;
        const hasTextAnnotation = hasText(dataModelObjectPath.targetObject.Value.$target);
        if (dataType === "Edm.Stream" && !hasTextAnnotation && annotations !== null && annotations !== void 0 && (_annotations$Core = annotations.Core) !== null && _annotations$Core !== void 0 && (_annotations$Core$Med = _annotations$Core.MediaType) !== null && _annotations$Core$Med !== void 0 && _annotations$Core$Med.includes("image/")) {
          width = 6.2;
        }
      } else if (annotations && (isImageURL((_dataModelObjectPath$9 = dataModelObjectPath.targetObject) === null || _dataModelObjectPath$9 === void 0 ? void 0 : (_dataModelObjectPath$10 = _dataModelObjectPath$9.Value) === null || _dataModelObjectPath$10 === void 0 ? void 0 : _dataModelObjectPath$10.$target) || annotations !== null && annotations !== void 0 && (_annotations$Core2 = annotations.Core) !== null && _annotations$Core2 !== void 0 && (_annotations$Core2$Me = _annotations$Core2.MediaType) !== null && _annotations$Core2$Me !== void 0 && _annotations$Core2$Me.includes("image/"))) {
        width = 6.2;
      }
      return width;
    },
    /**
     * Check if the column header should be included in the column width.
     *
     * @param table The table configuration object
     * @param column The column configuration
     * @returns Returns true if the column width should include the header
     */
    _shouldIncludeHeaderInColumnwidhCalculation(table, column) {
      return column.widthIncludingColumnHeader !== undefined ? column.widthIncludingColumnHeader : table.widthIncludingColumnHeader;
    },
    /**
     * Method to get the width of the column containing the DataField.
     *
     * @function
     * @name getColumnWidthForDataField
     * @param oThis The instance of the inner model of the Table building block
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField Data Field
     * @param dataFieldActionText DataField's text from button
     * @param dataModelObjectPath The data model object path
     * @param microChartTitle The object containing the title and description of the MicroChart
     * @returns - Column width if defined, otherwise null ( the width is treated as a rem value)
     */
    getColumnWidthForDataField: function (oThis, column, dataField, dataFieldActionText, dataModelObjectPath, microChartTitle) {
      var _dataModelObjectPath$11, _dataModelObjectPath$12;
      const annotations = (_dataModelObjectPath$11 = dataModelObjectPath.targetObject) === null || _dataModelObjectPath$11 === void 0 ? void 0 : _dataModelObjectPath$11.annotations;
      const dataType = (_dataModelObjectPath$12 = dataModelObjectPath.targetObject) === null || _dataModelObjectPath$12 === void 0 ? void 0 : _dataModelObjectPath$12.$Type;
      let width = null;
      if (dataType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || dataType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || dataType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataField.Target.$AnnotationPath.indexOf(`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`) === -1) {
        var _dataField$Label;
        let nTmpTextWidth;
        nTmpTextWidth = SizeHelper.getButtonWidth(dataFieldActionText) || SizeHelper.getButtonWidth(dataField === null || dataField === void 0 ? void 0 : (_dataField$Label = dataField.Label) === null || _dataField$Label === void 0 ? void 0 : _dataField$Label.toString()) || SizeHelper.getButtonWidth(annotations === null || annotations === void 0 ? void 0 : annotations.Label);

        // get width for rating or progress bar datafield
        const nTmpVisualizationWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(dataModelObjectPath.targetObject, this._shouldIncludeHeaderInColumnwidhCalculation(oThis, column)).propertyWidth;
        if (nTmpVisualizationWidth > nTmpTextWidth) {
          width = nTmpVisualizationWidth;
        } else if (dataFieldActionText || annotations && (annotations.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || annotations.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction")) {
          // Add additional 1.8 rem to avoid showing ellipsis in some cases.
          nTmpTextWidth += 1.8;
          width = nTmpTextWidth;
        }
        width = width ?? this.getColumnWidthForChart(oThis, column, dataField, nTmpTextWidth, microChartTitle);
      }
      return width;
    },
    /**
     * Method to get the width of the column containing the Chart.
     *
     * @function
     * @name getColumnWidthForChart
     * @param oThis The instance of the inner model of the Table building block
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField Data Field
     * @param columnLabelWidth The width of the column label or button label
     * @param microChartTitle The object containing the title and the description of the MicroChart
     * @returns - Column width if defined, otherwise null (the width is treated as a rem value)
     */
    getColumnWidthForChart(oThis, column, dataField, columnLabelWidth, microChartTitle) {
      var _dataField$Target, _dataField$Target$$An;
      let chartSize,
        width = null;
      if (((_dataField$Target = dataField.Target) === null || _dataField$Target === void 0 ? void 0 : (_dataField$Target$$An = _dataField$Target.$AnnotationPath) === null || _dataField$Target$$An === void 0 ? void 0 : _dataField$Target$$An.indexOf(`@${"com.sap.vocabularies.UI.v1.Chart"}`)) !== -1) {
        switch (this.getChartSize(oThis, column)) {
          case "XS":
            chartSize = 4.4;
            break;
          case "S":
            chartSize = 4.6;
            break;
          case "M":
            chartSize = 5.5;
            break;
          case "L":
            chartSize = 6.9;
            break;
          default:
            chartSize = 5.3;
        }
        columnLabelWidth += 1.8;
        if (!this.getShowOnlyChart(oThis, column) && (microChartTitle !== null && microChartTitle !== void 0 && microChartTitle.title.length || microChartTitle !== null && microChartTitle !== void 0 && microChartTitle.description.length)) {
          const tmpText = microChartTitle.title.length > microChartTitle.description.length ? microChartTitle.title : microChartTitle.description;
          const titleSize = SizeHelper.getButtonWidth(tmpText) + 7;
          const tmpWidth = titleSize > columnLabelWidth ? titleSize : columnLabelWidth;
          width = tmpWidth;
        } else if (columnLabelWidth > chartSize) {
          width = columnLabelWidth;
        } else {
          width = chartSize;
        }
      }
      return width;
    },
    /**
     * Method to add a margin class at the control.
     *
     * @function
     * @name getMarginClass
     * @param oCollection Title of the DataPoint
     * @param oDataField Value of the DataPoint
     * @param sVisualization
     * @param sFieldGroupHiddenExpressions Hidden expression contained in FieldGroup
     * @returns Adjusting the margin
     */
    getMarginClass: function (oCollection, oDataField, sVisualization, sFieldGroupHiddenExpressions) {
      let sBindingExpression,
        sClass = "";
      if (JSON.stringify(oCollection[oCollection.length - 1]) == JSON.stringify(oDataField)) {
        //If rating indicator is last element in fieldgroup, then the 0.5rem margin added by sapMRI class of interactive rating indicator on top and bottom must be nullified.
        if (sVisualization == "com.sap.vocabularies.UI.v1.VisualizationType/Rating") {
          sClass = "sapUiNoMarginBottom sapUiNoMarginTop";
        }
      } else if (sVisualization === "com.sap.vocabularies.UI.v1.VisualizationType/Rating") {
        //If rating indicator is NOT the last element in fieldgroup, then to maintain the 0.5rem spacing between cogetMarginClassntrols (as per UX spec),
        //only the top margin added by sapMRI class of interactive rating indicator must be nullified.

        sClass = "sapUiNoMarginTop";
      } else {
        sClass = "sapUiTinyMarginBottom";
      }
      if (sFieldGroupHiddenExpressions && sFieldGroupHiddenExpressions !== "true" && sFieldGroupHiddenExpressions !== "false") {
        const sHiddenExpressionResult = sFieldGroupHiddenExpressions.substring(sFieldGroupHiddenExpressions.indexOf("{=") + 2, sFieldGroupHiddenExpressions.lastIndexOf("}"));
        sBindingExpression = "{= " + sHiddenExpressionResult + " ? '" + sClass + "' : " + "''" + " }";
        return sBindingExpression;
      } else {
        return sClass;
      }
    },
    /**
     * Method to get VBox visibility.
     *
     * @param collection Collection of data fields in VBox
     * @param fieldGroupHiddenExpressions Hidden expression contained in FieldGroup
     * @param fieldGroup Data field containing the VBox
     * @returns Visibility expression
     */
    getVBoxVisibility: function (collection, fieldGroupHiddenExpressions, fieldGroup) {
      let allStatic = true;
      const hiddenPaths = [];
      if (fieldGroup[`@${"com.sap.vocabularies.UI.v1.Hidden"}`]) {
        return fieldGroupHiddenExpressions;
      }
      for (const dataField of collection) {
        const hiddenAnnotationValue = dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`];
        if (hiddenAnnotationValue === undefined || hiddenAnnotationValue === false) {
          hiddenPaths.push(false);
          continue;
        }
        if (hiddenAnnotationValue === true) {
          hiddenPaths.push(true);
          continue;
        }
        if (hiddenAnnotationValue.$Path) {
          hiddenPaths.push(pathInModel(hiddenAnnotationValue.$Path));
          allStatic = false;
          continue;
        }
        if (typeof hiddenAnnotationValue === "object") {
          // Dynamic expression found in a field
          return fieldGroupHiddenExpressions;
        }
      }
      const hasAnyPathExpressions = constant(hiddenPaths.length > 0 && allStatic !== true);
      const hasAllHiddenStaticExpressions = constant(hiddenPaths.length > 0 && !hiddenPaths.includes(false) && allStatic);
      return compileExpression(ifElse(hasAnyPathExpressions, formatResult(hiddenPaths, TableFormatter.getVBoxVisibility), ifElse(hasAllHiddenStaticExpressions, constant(false), constant(true))));
    },
    /**
     * Method to provide hidden filters to the table.
     *
     * @function
     * @name formatHiddenFilters
     * @param oHiddenFilter The hiddenFilters via context named filters (and key hiddenFilters) passed to Macro Table
     * @returns The string representation of the hidden filters
     */
    formatHiddenFilters: function (oHiddenFilter) {
      if (oHiddenFilter) {
        try {
          return JSON.stringify(oHiddenFilter);
        } catch (ex) {
          return undefined;
        }
      }
      return undefined;
    },
    /**
     * Method to get the stable ID of a table element (column or FieldGroup label).
     *
     * @function
     * @name getElementStableId
     * @param tableId Current object ID
     * @param elementId Element Id or suffix
     * @param dataModelObjectPath DataModelObjectPath of the dataField
     * @returns The stable ID for a given column
     */
    getElementStableId: function (tableId, elementId, dataModelObjectPath) {
      var _Value;
      if (!tableId) {
        return undefined;
      }
      const dataField = dataModelObjectPath.targetObject;
      let dataFieldPart;
      switch (dataField.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          dataFieldPart = dataField.Target.value;
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
          dataFieldPart = dataField;
          break;
        default:
          dataFieldPart = ((_Value = dataField.Value) === null || _Value === void 0 ? void 0 : _Value.path) ?? "";
          break;
      }
      return generate([tableId, elementId, dataFieldPart]);
    },
    /**
     * Method to get the stable ID of the column.
     *
     * @function
     * @name getColumnStableId
     * @param id Current object ID
     * @param dataModelObjectPath DataModelObjectPath of the dataField
     * @returns The stable ID for a given column
     */
    getColumnStableId: function (id, dataModelObjectPath) {
      return TableHelper.getElementStableId(id, "C", dataModelObjectPath);
    },
    getFieldGroupLabelStableId: function (id, dataModelObjectPath) {
      return TableHelper.getElementStableId(id, "FGLabel", dataModelObjectPath);
    },
    /**
     * Method filters out properties which do not belong to the collection.
     *
     * @param properties The array of properties to be checked.
     * @param collectionContext The collection context to be used.
     * @returns The array of applicable properties.
     * @private
     */
    _filterNonApplicableProperties: function (properties, collectionContext) {
      return properties && properties.filter(function (sPropertyPath) {
        return collectionContext.getObject(`./${sPropertyPath}`);
      });
    },
    /**
     * Method to generate the binding information for a table row.
     *
     * @param table The instance of the inner model of the table building block
     * @returns - Returns the binding information of a table row
     */
    getRowsBindingInfo: function (table) {
      const dataModelPath = getInvolvedDataModelObjects(table.collection, table.contextPath);
      const path = getContextRelativeTargetObjectPath(dataModelPath) || getTargetObjectPath(dataModelPath);
      const oRowBinding = {
        ui5object: true,
        suspended: false,
        path: CommonHelper.addSingleQuotes(path),
        parameters: {
          $count: true
        },
        events: {}
      };
      if (table.tableDefinition.enable$select) {
        // Don't add $select parameter in case of an analytical query, this isn't supported by the model
        const sSelect = TableHelper.create$Select(table);
        if (sSelect) {
          oRowBinding.parameters.$select = `'${sSelect}'`;
        }
      }
      if (table.tableDefinition.enable$$getKeepAliveContext) {
        // we later ensure in the delegate only one list binding for a given targetCollectionPath has the flag $$getKeepAliveContext
        oRowBinding.parameters.$$getKeepAliveContext = true;
      }
      oRowBinding.parameters.$$groupId = CommonHelper.addSingleQuotes("$auto.Workers");
      oRowBinding.parameters.$$updateGroupId = CommonHelper.addSingleQuotes("$auto");
      oRowBinding.parameters.$$ownRequest = true;
      oRowBinding.parameters.$$patchWithoutSideEffects = true;
      oRowBinding.events.patchSent = CommonHelper.addSingleQuotes(".editFlow.handlePatchSent");
      oRowBinding.events.patchCompleted = CommonHelper.addSingleQuotes("API.onInternalPatchCompleted");
      oRowBinding.events.dataReceived = CommonHelper.addSingleQuotes("API.onInternalDataReceived");
      oRowBinding.events.dataRequested = CommonHelper.addSingleQuotes("API.onInternalDataRequested");
      oRowBinding.events.change = CommonHelper.addSingleQuotes("API.onContextChange");
      oRowBinding.events.createActivate = CommonHelper.addSingleQuotes("API.handleCreateActivate");
      return CommonHelper.objectToString(oRowBinding);
    },
    /**
     * Method to check the validity of the fields in the creation row.
     *
     * @function
     * @name validateCreationRowFields
     * @param oFieldValidityObject Current Object holding the fields
     * @returns `true` if all the fields in the creation row are valid, `false` otherwise
     */
    validateCreationRowFields: function (oFieldValidityObject) {
      if (!oFieldValidityObject) {
        return false;
      }
      return Object.keys(oFieldValidityObject).length > 0 && Object.keys(oFieldValidityObject).every(function (key) {
        return oFieldValidityObject[key]["validity"];
      });
    },
    /**
     * Method to get the expression for the 'press' event for the DataFieldForActionButton.
     *
     * @function
     * @name pressEventDataFieldForActionButton
     * @param tableProperties The properties of the table control
     * @param tableProperties.contextObjectPath The datamodel object path for the table
     * @param tableProperties.id The id of the table control
     * @param dataField Value of the DataPoint
     * @param entitySetName Name of the EntitySet
     * @param operationAvailableMap OperationAvailableMap as stringified JSON object
     * @param actionObject
     * @param isNavigable Action either triggers navigation or not
     * @param enableAutoScroll Action either triggers scrolling to the newly created items in the related table or not
     * @param defaultValuesExtensionFunction Function name to prefill dialog parameters
     * @returns The binding expression
     */
    pressEventDataFieldForActionButton: function (tableProperties, dataField, entitySetName, operationAvailableMap, actionObject) {
      let isNavigable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      let enableAutoScroll = arguments.length > 6 ? arguments[6] : undefined;
      let defaultValuesExtensionFunction = arguments.length > 7 ? arguments[7] : undefined;
      if (!dataField) return undefined;
      const sActionName = dataField.Action,
        targetEntityTypeName = tableProperties.contextObjectPath.targetEntityType.fullyQualifiedName,
        staticAction = typeof actionObject !== "string" && (this._isStaticAction(actionObject, sActionName) || this._isActionOverloadOnDifferentType(sActionName.toString(), targetEntityTypeName)),
        params = {
          contexts: !staticAction ? pathInModel("selectedContexts", "internal") : null,
          bStaticAction: staticAction ? staticAction : undefined,
          entitySetName: entitySetName,
          applicableContexts: !staticAction ? pathInModel(`dynamicActions/${dataField.Action}/aApplicable/`, "internal") : null,
          notApplicableContexts: !staticAction ? pathInModel(`dynamicActions/${dataField.Action}/aNotApplicable/`, "internal") : null,
          isNavigable: isNavigable,
          enableAutoScroll: enableAutoScroll,
          defaultValuesExtensionFunction: defaultValuesExtensionFunction
        };
      params.invocationGrouping = (dataField === null || dataField === void 0 ? void 0 : dataField.InvocationGrouping) === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
      params.controlId = tableProperties.id;
      params.operationAvailableMap = operationAvailableMap;
      params.label = dataField.Label;
      return compileExpression(fn("API.onActionPress", [ref("$event"), ref("$controller"), dataField.Action, params]));
      //return ActionHelper.getPressEventDataFieldForActionButton(table.id!, dataField, params, operationAvailableMap);
    },

    /**
     * Method to determine the binding expression for 'enabled' property of DataFieldForAction actions.
     *
     * @function
     * @name isDataFieldForActionEnabled
     * @param tableDefinition The table definition from the table converter
     * @param actionName The name of the action
     * @param isBound IsBound for Action
     * @param actionObject
     * @param enableOnSelect Define the enabling of the action (single or multiselect)
     * @param annotationTargetEntityType The entity type of the annotation target
     * @returns A binding expression to define the 'enabled' property of the action
     */
    isDataFieldForActionEnabled: function (tableDefinition, actionName, isBound, actionObject, enableOnSelect, annotationTargetEntityType) {
      if (!annotationTargetEntityType) return false;
      const isStaticAction = this._isStaticAction(actionObject, actionName);

      // Check for action overload on a different Entity type.
      // If yes, table row selection is not required to enable this action.
      if (this._isActionOverloadOnDifferentType(actionName.toString(), annotationTargetEntityType.fullyQualifiedName)) {
        // Action overload defined on different entity type
        const oOperationAvailableMap = tableDefinition && JSON.parse(tableDefinition.operationAvailableMap);
        if (oOperationAvailableMap !== null && oOperationAvailableMap !== void 0 && oOperationAvailableMap.hasOwnProperty(actionName)) {
          // Core.OperationAvailable annotation defined for the action.
          // Need to refer to internal model for enabled property of the dynamic action.
          // return compileBinding(bindingExpression("dynamicActions/" + sActionName + "/bEnabled", "internal"), true);
          return `{= \${internal>dynamicActions/${actionName}/bEnabled} }`;
        }
        // Consider the action just like any other static DataFieldForAction.
        return true;
      }
      if (!isBound || isStaticAction) {
        return true;
      }
      let dataFieldForActionEnabledExpression = "";
      const numberOfSelectedContexts = ActionHelper.getNumberOfContextsExpression(enableOnSelect ?? "multiselect");
      const action = `\${internal>dynamicActions/${actionName}/bEnabled}`;
      dataFieldForActionEnabledExpression = `${numberOfSelectedContexts} && ${action}`;
      return `{= ${dataFieldForActionEnabledExpression}}`;
    },
    /**
     * Method to determine the binding expression for 'enabled' property of DataFieldForIBN actions.
     *
     * @function
     * @name isDataFieldForIBNEnabled
     * @param tableProperties The properties of the table control
     * @param tableProperties.collection  The collection context to be used
     * @param tableProperties.tableDefinition The table definition from the table converter
     * @param dataField The value of the data field
     * @param requiresContext RequiresContext for IBN
     * @param isNavigationAvailable Define if the navigation is available
     * @returns A binding expression to define the 'enabled' property of the action
     */
    isDataFieldForIBNEnabled: function (tableProperties, dataField, requiresContext, isNavigationAvailable) {
      var _tableProperties$tabl;
      let isNavigationAvailablePath = null;
      if (isPathAnnotationExpression(isNavigationAvailable)) {
        isNavigationAvailablePath = isNavigationAvailable.path;
      }
      const isAnalyticalTable = tableProperties === null || tableProperties === void 0 ? void 0 : (_tableProperties$tabl = tableProperties.tableDefinition) === null || _tableProperties$tabl === void 0 ? void 0 : _tableProperties$tabl.enableAnalytics;
      if (!requiresContext) {
        const entitySet = tableProperties.collection.getPath();
        const metaModel = tableProperties.collection.getModel();
        if (isNavigationAvailable === false && !isAnalyticalTable) {
          Log.warning("NavigationAvailable as false is incorrect usage");
          return false;
        } else if (isNavigationAvailablePath && !isAnalyticalTable && isPathAnnotationExpression(dataField === null || dataField === void 0 ? void 0 : dataField.NavigationAvailable) && metaModel.getObject(entitySet + "/$Partner") === dataField.NavigationAvailable.path.split("/")[0]) {
          return `{= \${${isNavigationAvailablePath.substring(isNavigationAvailablePath.indexOf("/") + 1, isNavigationAvailablePath.length)}}}`;
        }
        return true;
      }
      let dataFieldForIBNEnabledExpression = "",
        numberOfSelectedContexts,
        action;
      if (isNavigationAvailable === true || isAnalyticalTable) {
        dataFieldForIBNEnabledExpression = "%{internal>numberOfSelectedContexts} >= 1";
      } else if (isNavigationAvailable === false) {
        Log.warning("NavigationAvailable as false is incorrect usage");
        return false;
      } else {
        numberOfSelectedContexts = "%{internal>numberOfSelectedContexts} >= 1";
        action = `\${internal>ibn/${dataField.SemanticObject}-${dataField.Action}/bEnabled}`;
        dataFieldForIBNEnabledExpression = numberOfSelectedContexts + " && " + action;
      }
      return `{= ${dataFieldForIBNEnabledExpression}}`;
    },
    /**
     * Method to get press event expression for CreateButton.
     *
     * @function
     * @name pressEventForCreateButton
     * @param oThis Current Object
     * @param bCmdExecutionFlag Flag to indicate that the function is called from CMD Execution
     * @returns The binding expression for the press event of the create button
     */
    pressEventForCreateButton: function (oThis, bCmdExecutionFlag) {
      const sCreationMode = oThis.creationMode.name;
      let oParams;
      const sMdcTable = bCmdExecutionFlag ? "${$source>}.getParent()" : "${$source>}.getParent().getParent().getParent()";
      let sRowBinding = sMdcTable + ".getRowBinding() || " + sMdcTable + ".data('rowsBindingInfo').path";
      switch (sCreationMode) {
        case CreationMode.External:
          // navigate to external target for creating new entries
          // TODO: Add required parameters
          oParams = {
            creationMode: CommonHelper.addSingleQuotes(CreationMode.External),
            outbound: CommonHelper.addSingleQuotes(oThis.createOutbound)
          };
          break;
        case CreationMode.CreationRow:
          oParams = {
            creationMode: CommonHelper.addSingleQuotes(CreationMode.CreationRow),
            creationRow: "${$source>}",
            createAtEnd: oThis.creationMode.createAtEnd !== undefined ? oThis.creationMode.createAtEnd : false
          };
          sRowBinding = "${$source>}.getParent().getRowBinding()";
          break;
        case CreationMode.NewPage:
        case CreationMode.Inline:
          oParams = {
            creationMode: CommonHelper.addSingleQuotes(sCreationMode),
            createAtEnd: oThis.creationMode.createAtEnd !== undefined ? oThis.creationMode.createAtEnd : false,
            tableId: CommonHelper.addSingleQuotes(oThis.id),
            selectedContexts: "${internal>selectedContexts}"
          };
          if (oThis.createNewAction) {
            oParams.newAction = CommonHelper.addSingleQuotes(oThis.createNewAction);
          }
          break;
        case CreationMode.InlineCreationRows:
          return CommonHelper.generateFunction(".editFlow.createEmptyRowsAndFocus", sMdcTable);
        default:
          // unsupported
          return undefined;
      }
      return CommonHelper.generateFunction(".editFlow.createDocument", sRowBinding, CommonHelper.objectToString(oParams));
    },
    getIBNData: function (outboundDetail) {
      if (outboundDetail) {
        const oIBNData = {
          semanticObject: CommonHelper.addSingleQuotes(outboundDetail.semanticObject),
          action: CommonHelper.addSingleQuotes(outboundDetail.action)
        };
        return CommonHelper.objectToString(oIBNData);
      }
    },
    _getExpressionForDeleteButton: function (value, fullContextPath) {
      if (typeof value === "string") {
        return CommonHelper.addSingleQuotes(value, true);
      } else {
        const expression = getExpressionFromAnnotation(value);
        if (isConstant(expression) || isPathInModelExpression(expression)) {
          const valueExpression = formatValueRecursively(expression, fullContextPath);
          return compileExpression(valueExpression);
        }
      }
    },
    /**
     * Method to get press event expression for 'Delete' button.
     *
     * @function
     * @name pressEventForDeleteButton
     * @param oThis Current Object
     * @param sEntitySetName EntitySet name
     * @param oHeaderInfo Header Info
     * @param fullcontextPath Context Path
     * @returns The binding expression for the press event of the 'Delete' button
     */
    pressEventForDeleteButton: function (oThis, sEntitySetName, oHeaderInfo, fullcontextPath) {
      const sDeletableContexts = "${internal>deletableContexts}";
      let sTitleExpression, sDescriptionExpression;
      if (oHeaderInfo !== null && oHeaderInfo !== void 0 && oHeaderInfo.Title) {
        sTitleExpression = this._getExpressionForDeleteButton(oHeaderInfo.Title.Value, fullcontextPath);
      }
      if (oHeaderInfo !== null && oHeaderInfo !== void 0 && oHeaderInfo.Description) {
        sDescriptionExpression = this._getExpressionForDeleteButton(oHeaderInfo.Description.Value, fullcontextPath);
      }
      const oParams = {
        id: CommonHelper.addSingleQuotes(oThis.id),
        entitySetName: CommonHelper.addSingleQuotes(sEntitySetName),
        numberOfSelectedContexts: "${internal>selectedContexts}.length",
        unSavedContexts: "${internal>unSavedContexts}",
        lockedContexts: "${internal>lockedContexts}",
        draftsWithDeletableActive: "${internal>draftsWithDeletableActive}",
        draftsWithNonDeletableActive: "${internal>draftsWithNonDeletableActive}",
        controlId: "${internal>controlId}",
        title: sTitleExpression,
        description: sDescriptionExpression,
        selectedContexts: "${internal>selectedContexts}"
      };
      return CommonHelper.generateFunction(".editFlow.deleteMultipleDocuments", sDeletableContexts, CommonHelper.objectToString(oParams));
    },
    /**
     * Method to set the visibility of the label for the column header.
     *
     * @function
     * @name setHeaderLabelVisibility
     * @param datafield DataField
     * @param dataFieldCollection List of items inside a fieldgroup (if any)
     * @returns `true` if the header label needs to be visible else false.
     */
    setHeaderLabelVisibility: function (datafield, dataFieldCollection) {
      // If Inline button/navigation action, return false, else true;
      if (!dataFieldCollection) {
        if (datafield.$Type.indexOf("DataFieldForAction") > -1 && datafield.Inline) {
          return false;
        }
        if (datafield.$Type.indexOf("DataFieldForIntentBasedNavigation") > -1 && datafield.Inline) {
          return false;
        }
        return true;
      }

      // In Fieldgroup, If NOT all datafield/datafieldForAnnotation exists with hidden, return true;
      return dataFieldCollection.some(function (oDC) {
        if ((oDC.$Type === "com.sap.vocabularies.UI.v1.DataField" || oDC.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && oDC[`@${"com.sap.vocabularies.UI.v1.Hidden"}`] !== true) {
          return true;
        }
      });
    },
    /**
     * Method to get the text from the DataFieldForAnnotation into the column.
     *
     * @function
     * @name getTextOnActionField
     * @param oDataField DataPoint's Value
     * @param oContext Context object of the LineItem
     * @returns String from label referring to action text
     */
    getTextOnActionField: function (oDataField, oContext) {
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
        return oDataField.Label;
      }
      // for FieldGroup containing DataFieldForAnnotation
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && oContext.context.getObject("Target/$AnnotationPath").indexOf("@" + "com.sap.vocabularies.UI.v1.FieldGroup") > -1) {
        const sPathDataFields = "Target/$AnnotationPath/Data/";
        const aMultipleLabels = [];
        for (const i in oContext.context.getObject(sPathDataFields)) {
          if (oContext.context.getObject(`${sPathDataFields + i}/$Type`) === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oContext.context.getObject(`${sPathDataFields + i}/$Type`) === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
            aMultipleLabels.push(oContext.context.getObject(`${sPathDataFields + i}/Label`));
          }
        }
        // In case there are multiple actions inside a Field Group select the largest Action Label
        if (aMultipleLabels.length > 1) {
          return aMultipleLabels.reduce(function (a, b) {
            return a.length > b.length ? a : b;
          });
        } else {
          return aMultipleLabels.length === 0 ? undefined : aMultipleLabels.toString();
        }
      }
      return undefined;
    },
    _getResponsiveTableColumnSettings: function (oThis, oColumn) {
      if (oThis.tableType === "ResponsiveTable") {
        return oColumn.settings;
      }
      return null;
    },
    getChartSize: function (oThis, oColumn) {
      const settings = this._getResponsiveTableColumnSettings(oThis, oColumn);
      if (settings && settings.microChartSize) {
        return settings.microChartSize;
      }
      return "XS";
    },
    getShowOnlyChart: function (oThis, oColumn) {
      const settings = this._getResponsiveTableColumnSettings(oThis, oColumn);
      if (settings && settings.showMicroChartLabel) {
        return !settings.showMicroChartLabel;
      }
      return true;
    },
    getDelegate: function (table, isALP, entityName) {
      let oDelegate;
      if (isALP === "true") {
        // We don't support TreeTable in ALP
        if (table.control.type === "TreeTable") {
          throw new Error("TreeTable not supported in Analytical ListPage");
        }
        oDelegate = {
          name: "sap/fe/macros/table/delegates/ALPTableDelegate",
          payload: {
            collectionName: entityName
          }
        };
      } else if (table.control.type === "TreeTable") {
        oDelegate = {
          name: "sap/fe/macros/table/delegates/TreeTableDelegate",
          payload: {
            hierarchyQualifier: table.control.hierarchyQualifier,
            initialExpansionLevel: table.annotation.initialExpansionLevel
          }
        };
      } else {
        oDelegate = {
          name: "sap/fe/macros/table/delegates/TableDelegate"
        };
      }
      return JSON.stringify(oDelegate);
    },
    setIBNEnablement: function (oInternalModelContext, oNavigationAvailableMap, aSelectedContexts) {
      for (const sKey in oNavigationAvailableMap) {
        oInternalModelContext.setProperty(`ibn/${sKey}`, {
          bEnabled: false,
          aApplicable: [],
          aNotApplicable: []
        });
        const aApplicable = [],
          aNotApplicable = [];
        const sProperty = oNavigationAvailableMap[sKey];
        for (let i = 0; i < aSelectedContexts.length; i++) {
          const oSelectedContext = aSelectedContexts[i];
          if (oSelectedContext.getObject(sProperty)) {
            oInternalModelContext.getModel().setProperty(`${oInternalModelContext.getPath()}/ibn/${sKey}/bEnabled`, true);
            aApplicable.push(oSelectedContext);
          } else {
            aNotApplicable.push(oSelectedContext);
          }
        }
        oInternalModelContext.getModel().setProperty(`${oInternalModelContext.getPath()}/ibn/${sKey}/aApplicable`, aApplicable);
        oInternalModelContext.getModel().setProperty(`${oInternalModelContext.getPath()}/ibn/${sKey}/aNotApplicable`, aNotApplicable);
      }
    },
    /**
     * @param oFastCreationRow
     * @param sPath
     * @param oContext
     * @param oModel
     * @param oFinalUIState
     */
    enableFastCreationRow: async function (oFastCreationRow, sPath, oContext, oModel, oFinalUIState) {
      let oFastCreationListBinding, oFastCreationContext;
      if (oFastCreationRow) {
        try {
          await oFinalUIState;
          // If a draft is discarded while a message strip filter is active on the table there is a table rebind caused by the DataStateIndicator
          // To prevent a new creation row binding being created at that moment we check if the context is already deleted
          if (oFastCreationRow.getModel("ui").getProperty("/isEditable") && !oContext.isDeleted()) {
            oFastCreationListBinding = oModel.bindList(sPath, oContext, [], [], {
              $$updateGroupId: "doNotSubmit",
              $$groupId: "doNotSubmit"
            });
            // Workaround suggested by OData model v4 colleagues
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            oFastCreationListBinding.refreshInternal = function () {
              /* do nothing */
            };
            oFastCreationContext = oFastCreationListBinding.create();
            oFastCreationRow.setBindingContext(oFastCreationContext);

            // this is needed to avoid console error
            try {
              await oFastCreationContext.created();
            } catch (e) {
              Log.trace("transient fast creation context deleted");
            }
          }
        } catch (oError) {
          Log.error("Error while computing the final UI state", oError);
        }
      }
    }
  };
  TableHelper.getNavigationAvailableMap.requiresIContext = true;
  TableHelper.getTextOnActionField.requiresIContext = true;
  return TableHelper;
}, false);
