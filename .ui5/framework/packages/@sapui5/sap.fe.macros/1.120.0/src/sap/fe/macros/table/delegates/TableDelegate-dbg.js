/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/base/util/deepEqual", "sap/base/util/deepExtend", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/ExcelFormatHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/type/EDM", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/filterBar/FilterBarDelegate", "sap/fe/macros/table/TableSizeHelper", "sap/fe/macros/table/Utils", "sap/ui/core/Core", "sap/ui/core/Fragment", "sap/ui/mdc/odata/v4/TableDelegate", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/Filter", "sap/ui/model/json/JSONModel", "../TableHelper", "../TableRuntime"], function (Log, deepClone, deepEqual, deepExtend, ActionRuntime, CommonUtils, MetaModelConverter, ValueFormatter, DeleteHelper, ExcelFormat, ModelHelper, ResourceModelHelper, SizeHelper, TypeGuards, EDM, CommonHelper, DelegateUtil, FilterBarDelegate, TableSizeHelper, TableUtils, Core, Fragment, TableDelegateBase, TypeMap, Filter, JSONModel, TableHelper, TableRuntime) {
  "use strict";

  var isTypeFilterable = EDM.isTypeFilterable;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const SEMANTICKEY_HAS_DRAFTINDICATOR = "/semanticKeyHasDraftIndicator";
  const SEARCH_HAS_BEEN_FIRED = "searchFired";
  const COLUMN_HAS_BEEN_ADDED = "columnAdded";

  /**
   * Helper class for sap.ui.mdc.Table.
   * <h3><b>Note:</b></h3>
   * The class is experimental and the API and the behavior are not finalized. This class is not intended for productive usage.
   *
   * @author SAP SE
   * @private
   * @experimental
   * @since 1.69.0
   * @alias sap.fe.macros.TableDelegate
   */
  return Object.assign({}, TableDelegateBase, {
    apiVersion: 2,
    /**
     * This function calculates the width of a FieldGroup column.
     * The width of the FieldGroup is the width of the widest property contained in the FieldGroup (including the label if showDataFieldsLabel is true)
     * The result of this calculation is stored in the visualSettings.widthCalculation.minWidth property, which is used by the MDCtable.
     *
     * @param oTable Instance of the MDCtable
     * @param oProperty Current property
     * @param aProperties Array of properties
     * @private
     * @alias sap.fe.macros.TableDelegate
     */
    _computeVisualSettingsForFieldGroup: function (oTable, oProperty, aProperties) {
      if (oProperty.name.indexOf("DataFieldForAnnotation::FieldGroup::") === 0) {
        const oColumn = oTable.getColumns().find(function (oCol) {
          return oCol.getDataProperty() === oProperty.name;
        });
        const bShowDataFieldsLabel = oColumn ? oColumn.data("showDataFieldsLabel") === "true" : false;
        const oMetaModel = oTable.getModel().getMetaModel();
        const involvedDataModelObjects = getInvolvedDataModelObjects(oMetaModel.getContext(oProperty.metadataPath));
        const convertedMetaData = involvedDataModelObjects.convertedTypes;
        const oDataField = involvedDataModelObjects.targetObject;
        const oFieldGroup = oDataField.Target.$target;
        const aFieldWidth = [];
        oFieldGroup.Data.forEach(function (oData) {
          let oDataFieldWidth;
          switch (oData.$Type) {
            case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
              oDataFieldWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(oData, false, aProperties, convertedMetaData, bShowDataFieldsLabel);
              break;
            case "com.sap.vocabularies.UI.v1.DataField":
              oDataFieldWidth = TableSizeHelper.getWidthForDataField(oData, bShowDataFieldsLabel, aProperties, convertedMetaData, false);
              break;
            case "com.sap.vocabularies.UI.v1.DataFieldForAction":
              oDataFieldWidth = {
                labelWidth: 0,
                propertyWidth: SizeHelper.getButtonWidth(oData.Label)
              };
              break;
            default:
          }
          if (oDataFieldWidth) {
            aFieldWidth.push(oDataFieldWidth.labelWidth + oDataFieldWidth.propertyWidth);
          }
        });
        const nWidest = aFieldWidth.reduce(function (acc, value) {
          return Math.max(acc, value);
        }, 0);
        oProperty.visualSettings = deepExtend(oProperty.visualSettings, {
          widthCalculation: {
            verticalArrangement: true,
            minWidth: Math.ceil(nWidest)
          }
        });
      }
    },
    _computeVisualSettingsForPropertyWithValueHelp: function (table, property) {
      const tableAPI = table.getParent();
      if (!property.propertyInfos) {
        const metaModel = table.getModel().getMetaModel();
        if (property.metadataPath && metaModel) {
          const dataField = metaModel.getObject(`${property.metadataPath}@`);
          if (dataField && dataField["@com.sap.vocabularies.Common.v1.ValueList"]) {
            property.visualSettings = deepExtend(property.visualSettings || {}, {
              widthCalculation: {
                gap: tableAPI.getProperty("readOnly") ? 0 : 4
              }
            });
          }
        }
      }
    },
    _computeVisualSettingsForPropertyWithUnit: function (oTable, oProperty, oUnit, oUnitText, oTimezoneText) {
      const oTableAPI = oTable ? oTable.getParent() : null;
      // update gap for properties with string unit
      const sUnitText = oUnitText || oTimezoneText;
      if (sUnitText) {
        oProperty.visualSettings = deepExtend(oProperty.visualSettings, {
          widthCalculation: {
            gap: Math.ceil(SizeHelper.getButtonWidth(sUnitText))
          }
        });
      }
      if (oUnit) {
        oProperty.visualSettings = deepExtend(oProperty.visualSettings, {
          widthCalculation: {
            // For properties with unit, a gap needs to be added to properly render the column width on edit mode
            gap: oTableAPI && oTableAPI.getReadOnly() ? 0 : 6
          }
        });
      }
    },
    _computeLabel: function (property, labelMap) {
      if (property.label) {
        var _property$path;
        const propertiesWithSameLabel = labelMap[property.label];
        if ((propertiesWithSameLabel === null || propertiesWithSameLabel === void 0 ? void 0 : propertiesWithSameLabel.length) > 1 && (_property$path = property.path) !== null && _property$path !== void 0 && _property$path.includes("/") && property.additionalLabels) {
          property.label = property.label + " (" + property.additionalLabels.join(" / ") + ")";
        }
        delete property.additionalLabels;
      }
    },
    //Update VisualSetting for columnWidth calculation and labels on navigation properties
    _updatePropertyInfo: function (table, properties) {
      const labelMap = {};
      // Check available p13n modes
      const p13nMode = table.getP13nMode();
      properties.forEach(property => {
        if (!property.propertyInfos && property.label) {
          // Only for non-complex properties
          if (p13nMode !== null && p13nMode !== void 0 && p13nMode.includes("Sort") && property.sortable || p13nMode !== null && p13nMode !== void 0 && p13nMode.includes("Filter") && property.filterable || p13nMode !== null && p13nMode !== void 0 && p13nMode.includes("Group") && property.groupable) {
            labelMap[property.label] = labelMap[property.label] !== undefined ? labelMap[property.label].concat([property]) : [property];
          }
        }
      });
      properties.forEach(property => {
        this._computeVisualSettingsForFieldGroup(table, property, properties);
        this._computeVisualSettingsForPropertyWithValueHelp(table, property);
        // bcp: 2270003577
        // Some columns (eg: custom columns) have no typeConfig property.
        // initializing it prevents an exception throw
        property.typeConfig = deepExtend(property.typeConfig, {});
        this._computeLabel(property, labelMap);
      });
      // Add the $editState property
      properties.push({
        name: "$editState",
        path: "$editState",
        groupLabel: "",
        group: "",
        typeConfig: TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {}),
        visible: false,
        groupable: false,
        sortable: false,
        filterable: false
      });
      return properties;
    },
    getColumnsFor: function (table) {
      return table.getParent().getTableDefinition().columns;
    },
    _getAggregatedPropertyMap: function (oTable) {
      return oTable.getParent().getTableDefinition().aggregates;
    },
    /**
     * Returns the export capabilities for the given sap.ui.mdc.Table instance.
     *
     * @param oTable Instance of the table
     * @returns Promise representing the export capabilities of the table instance
     */
    fetchExportCapabilities: function (oTable) {
      const oCapabilities = {
        XLSX: {}
      };
      let oModel;
      return DelegateUtil.fetchModel(oTable).then(function (model) {
        oModel = model;
        return oModel.getMetaModel().getObject("/$EntityContainer@Org.OData.Capabilities.V1.SupportedFormats");
      }).then(function (aSupportedFormats) {
        const aLowerFormats = (aSupportedFormats || []).map(element => {
          return element.toLowerCase();
        });
        if (aLowerFormats.includes("application/pdf")) {
          return oModel.getMetaModel().getObject("/$EntityContainer@com.sap.vocabularies.PDF.v1.Features");
        }
        return undefined;
      }).then(function (oAnnotation) {
        if (oAnnotation) {
          oCapabilities["PDF"] = Object.assign({}, oAnnotation);
        }
        return;
      }).catch(function (err) {
        Log.error(`An error occurs while computing export capabilities: ${err}`);
      }).then(function () {
        return oCapabilities;
      });
    },
    /**
     * Filtering on 1:n navigation properties and navigation
     * properties not part of the LineItem annotation is forbidden.
     *
     * @param columnInfo
     * @param metaModel
     * @param table
     * @returns Boolean true if filtering is allowed, false otherwise
     */
    _isFilterableNavigationProperty: function (columnInfo, metaModel, table) {
      // get the DataModelObjectPath for the table
      const tableDataModelObjectPath = getInvolvedDataModelObjects(metaModel.getContext(DelegateUtil.getCustomData(table, "metaPath"))),
        // get all navigation properties leading to the column
        columnNavigationProperties = getInvolvedDataModelObjects(metaModel.getContext(columnInfo.annotationPath)).navigationProperties,
        // we are only interested in navigation properties relative to the table, so all before and including the tables targetType can be filtered
        tableTargetEntityIndex = columnNavigationProperties.findIndex(prop => {
          var _prop$targetType;
          return ((_prop$targetType = prop.targetType) === null || _prop$targetType === void 0 ? void 0 : _prop$targetType.name) === tableDataModelObjectPath.targetEntityType.name;
        }),
        relativeNavigationProperties = columnNavigationProperties.slice(tableTargetEntityIndex > 0 ? tableTargetEntityIndex : 0);
      return !columnInfo.relativePath.includes("/") || columnInfo.isPartOfLineItem === true && !relativeNavigationProperties.some(isMultipleNavigationProperty);
    },
    _fetchPropertyInfo: function (metaModel, columnInfo, table, appComponent) {
      var _columnInfo$typeConfi, _columnInfo$typeConfi2, _columnInfo$propertyI;
      const sAbsoluteNavigationPath = columnInfo.annotationPath,
        oDataField = metaModel.getObject(sAbsoluteNavigationPath),
        oNavigationContext = metaModel.createBindingContext(sAbsoluteNavigationPath),
        oTypeConfig = (_columnInfo$typeConfi = columnInfo.typeConfig) !== null && _columnInfo$typeConfi !== void 0 && _columnInfo$typeConfi.className && isTypeFilterable(columnInfo.typeConfig.className) ? TypeMap.getTypeConfig(columnInfo.typeConfig.className, columnInfo.typeConfig.formatOptions, columnInfo.typeConfig.constraints) : {},
        bFilterable = CommonHelper.isPropertyFilterable(oNavigationContext, oDataField),
        isComplexType = columnInfo.typeConfig && columnInfo.typeConfig.className && ((_columnInfo$typeConfi2 = columnInfo.typeConfig.className) === null || _columnInfo$typeConfi2 === void 0 ? void 0 : _columnInfo$typeConfi2.indexOf("Edm.")) !== 0,
        bIsAnalyticalTable = DelegateUtil.getCustomData(table, "enableAnalytics") === "true",
        aAggregatedPropertyMapUnfilterable = bIsAnalyticalTable ? this._getAggregatedPropertyMap(table) : {},
        label = getLocalizedText(columnInfo.label ?? "", appComponent ?? table);
      const tooltip = getLocalizedText(columnInfo.tooltip ?? "", appComponent ?? table);
      const propertyInfo = {
        name: columnInfo.name,
        metadataPath: sAbsoluteNavigationPath,
        groupLabel: columnInfo.groupLabel,
        group: columnInfo.group,
        label: label,
        tooltip: tooltip,
        typeConfig: oTypeConfig,
        visible: columnInfo.availability !== "Hidden" && !isComplexType,
        exportSettings: this._setPropertyInfoExportSettings(columnInfo.exportSettings, columnInfo),
        unit: columnInfo.unit
      };

      // Set visualSettings only if it exists
      if (columnInfo.visualSettings && Object.keys(columnInfo.visualSettings).length > 0) {
        propertyInfo.visualSettings = columnInfo.visualSettings;
      }
      if (columnInfo.exportDataPointTargetValue) {
        propertyInfo.exportDataPointTargetValue = columnInfo.exportDataPointTargetValue;
      }

      // MDC expects  'propertyInfos' only for complex properties.
      // An empty array throws validation error and undefined value is unhandled.
      if ((_columnInfo$propertyI = columnInfo.propertyInfos) !== null && _columnInfo$propertyI !== void 0 && _columnInfo$propertyI.length) {
        propertyInfo.propertyInfos = columnInfo.propertyInfos;
      } else {
        var _columnInfo$textArran, _extension;
        // Add properties which are supported only by simple PropertyInfos.
        propertyInfo.path = columnInfo.relativePath;
        // TODO with the new complex property info, a lot of "Description" fields are added as filter/sort fields
        propertyInfo.sortable = columnInfo.sortable;
        if (bIsAnalyticalTable) {
          this._updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo);
        }
        propertyInfo.filterable = !!bFilterable &&
        // Disable filtering on properties using textArrangement as TextOnly, this is required to be aligned with sorting and grouping
        ((_columnInfo$textArran = columnInfo.textArrangement) === null || _columnInfo$textArran === void 0 ? void 0 : _columnInfo$textArran.mode) !== "Description" && this._isFilterableNavigationProperty(columnInfo, metaModel, table) && (
        // TODO ignoring all properties that are not also available for adaptation for now, but proper concept required
        !bIsAnalyticalTable || !aAggregatedPropertyMapUnfilterable[propertyInfo.name] && !((_extension = columnInfo.extension) !== null && _extension !== void 0 && _extension.technicallyGroupable));
        propertyInfo.key = columnInfo.isKey;
        propertyInfo.groupable = columnInfo.isGroupable;
        if (columnInfo.textArrangement) {
          const descriptionColumn = this.getColumnsFor(table).find(function (oCol) {
            var _columnInfo$textArran2;
            return oCol.name === ((_columnInfo$textArran2 = columnInfo.textArrangement) === null || _columnInfo$textArran2 === void 0 ? void 0 : _columnInfo$textArran2.textProperty);
          });
          if (descriptionColumn) {
            propertyInfo.mode = columnInfo.textArrangement.mode;
            propertyInfo.valueProperty = columnInfo.relativePath;
            propertyInfo.descriptionProperty = descriptionColumn.relativePath;
          }
        }
        propertyInfo.text = columnInfo.textArrangement && columnInfo.textArrangement.textProperty;
        propertyInfo.caseSensitive = columnInfo.caseSensitive;
        if (columnInfo.additionalLabels) {
          propertyInfo.additionalLabels = columnInfo.additionalLabels.map(additionalLabel => {
            return getLocalizedText(additionalLabel, appComponent || table);
          });
        }
      }
      this._computeVisualSettingsForPropertyWithUnit(table, propertyInfo, columnInfo.unit, columnInfo.unitText, columnInfo.timezoneText);
      return propertyInfo;
    },
    /**
     * Extend the export settings based on the column info.
     *
     * @param exportSettings The export settings to be extended
     * @param columnInfo The columnInfo object
     * @returns The extended export settings
     */
    _setPropertyInfoExportSettings: function (exportSettings, columnInfo) {
      var _columnInfo$typeConfi3;
      const exportFormat = this._getExportFormat((_columnInfo$typeConfi3 = columnInfo.typeConfig) === null || _columnInfo$typeConfi3 === void 0 ? void 0 : _columnInfo$typeConfi3.className);
      if (exportFormat && exportSettings) {
        exportSettings.format = exportFormat;
      }
      return exportSettings;
    },
    _updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo) {
      if (columnInfo.aggregatable) {
        propertyInfo.aggregatable = columnInfo.aggregatable;
      }
      if (columnInfo.extension) {
        propertyInfo.extension = columnInfo.extension;
      }
    },
    _fetchComputedPropertyInfo: function (columnInfo, table, appComponent) {
      let label = "";
      label = getLocalizedText(columnInfo.label, appComponent || table); // Todo: To be removed once MDC provides translation support
      const propertyInfo = {
        name: columnInfo.name,
        label: label.toString(),
        type: "Edm.String",
        visible: columnInfo.availability !== "Hidden",
        filterable: false,
        sortable: false,
        groupable: false,
        exportSettings: null
      };
      return propertyInfo;
    },
    _fetchCustomPropertyInfo: function (columnInfo, table, appComponent) {
      let sLabel = "";
      if (columnInfo.header) {
        if (columnInfo.header.startsWith("{metaModel>")) {
          const metaModelPath = columnInfo.header.substring(11, columnInfo.header.length - 1);
          sLabel = table.getModel().getMetaModel().getObject(metaModelPath);
        } else {
          sLabel = getLocalizedText(columnInfo.header, appComponent || table); // Todo: To be removed once MDC provides translation support
        }
      }

      const propertyInfo = {
        name: columnInfo.name,
        groupLabel: undefined,
        group: undefined,
        label: sLabel.toString(),
        type: "Edm.String",
        // TBD
        visible: columnInfo.availability !== "Hidden",
        exportSettings: columnInfo.exportSettings,
        visualSettings: columnInfo.visualSettings
      };

      // MDC expects 'propertyInfos' only for complex properties.
      // An empty array throws validation error and undefined value is unhandled.
      if (columnInfo.propertyInfos && columnInfo.propertyInfos.length) {
        propertyInfo.propertyInfos = columnInfo.propertyInfos;
      } else {
        // Add properties which are supported only by simple PropertyInfos.
        propertyInfo.path = columnInfo.name;
        propertyInfo.sortable = false;
        propertyInfo.filterable = false;
      }
      return propertyInfo;
    },
    _bColumnHasPropertyWithDraftIndicator: function (oColumnInfo) {
      return !!(oColumnInfo.formatOptions && oColumnInfo.formatOptions.hasDraftIndicator || oColumnInfo.formatOptions && oColumnInfo.formatOptions.fieldGroupDraftIndicatorPropertyPath);
    },
    _updateDraftIndicatorModel: function (_oTable, _oColumnInfo) {
      const aVisibleColumns = _oTable.getColumns();
      const oInternalBindingContext = _oTable.getBindingContext("internal");
      const sInternalPath = oInternalBindingContext && oInternalBindingContext.getPath();
      if (aVisibleColumns && oInternalBindingContext) {
        for (const index in aVisibleColumns) {
          if (this._bColumnHasPropertyWithDraftIndicator(_oColumnInfo) && _oColumnInfo.name === aVisibleColumns[index].getDataProperty()) {
            if (oInternalBindingContext.getProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR) === undefined) {
              oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, _oColumnInfo.name);
              break;
            }
          }
        }
      }
    },
    _fetchPropertiesForEntity: function (oTable, sEntityTypePath, oMetaModel, oAppComponent) {
      // when fetching properties, this binding context is needed - so lets create it only once and use if for all properties/data-fields/line-items
      const sBindingPath = ModelHelper.getEntitySetPath(sEntityTypePath);
      let aFetchedProperties = [];
      const oFR = CommonUtils.getFilterRestrictionsByPath(sBindingPath, oMetaModel);
      const aNonFilterableProps = oFR.NonFilterableProperties;
      return Promise.resolve(this.getColumnsFor(oTable)).then(aColumns => {
        // DraftAdministrativeData does not work via 'entitySet/$NavigationPropertyBinding/DraftAdministrativeData'
        if (aColumns) {
          let oPropertyInfo;
          aColumns.forEach(oColumnInfo => {
            this._updateDraftIndicatorModel(oTable, oColumnInfo);
            switch (oColumnInfo.type) {
              case "Annotation":
                oPropertyInfo = this._fetchPropertyInfo(oMetaModel, oColumnInfo, oTable, oAppComponent);
                if (oPropertyInfo && !aNonFilterableProps.includes(oPropertyInfo.name)) {
                  oPropertyInfo.maxConditions = DelegateUtil.isMultiValue(oPropertyInfo) ? -1 : 1;
                }
                break;
              case "Computed":
                oPropertyInfo = this._fetchComputedPropertyInfo(oColumnInfo, oTable, oAppComponent);
                break;
              case "Slot":
              case "Default":
                oPropertyInfo = this._fetchCustomPropertyInfo(oColumnInfo, oTable, oAppComponent);
                break;
              default:
                throw new Error(`unhandled switch case ${oColumnInfo.type}`);
            }
            aFetchedProperties.push(oPropertyInfo);
          });
        }
        return;
      }).then(() => {
        aFetchedProperties = this._updatePropertyInfo(oTable, aFetchedProperties);
        return;
      }).catch(function (err) {
        Log.error(`An error occurs while updating fetched properties: ${err}`);
      }).then(function () {
        return aFetchedProperties;
      });
    },
    _getCachedOrFetchPropertiesForEntity: function (table, entityTypePath, metaModel, appComponent) {
      const fetchedProperties = DelegateUtil.getCachedProperties(table);
      if (fetchedProperties) {
        return Promise.resolve(fetchedProperties);
      }
      return this._fetchPropertiesForEntity(table, entityTypePath, metaModel, appComponent).then(function (subFetchedProperties) {
        DelegateUtil.setCachedProperties(table, subFetchedProperties);
        return subFetchedProperties;
      });
    },
    _setTableNoDataText: function (oTable, oBindingInfo) {
      let sNoDataKey = "";
      const oTableFilterInfo = TableUtils.getAllFilterInfo(oTable),
        suffixResourceKey = oBindingInfo.path.startsWith("/") ? oBindingInfo.path.substr(1) : oBindingInfo.path;
      const _getNoDataTextWithFilters = function () {
        if (oTable.data("hiddenFilters") || oTable.getQuickFilter()) {
          return "M_TABLE_AND_CHART_NO_DATA_TEXT_MULTI_VIEW";
        } else {
          return "T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER";
        }
      };
      const sFilterAssociation = oTable.getFilter();
      if (sFilterAssociation && !/BasicSearch$/.test(sFilterAssociation)) {
        // check if a FilterBar is associated to the Table (basic search on toolBar is excluded)
        if (oTableFilterInfo.search || oTableFilterInfo.filters && oTableFilterInfo.filters.length) {
          // check if table has any Filterbar filters or personalization filters
          sNoDataKey = _getNoDataTextWithFilters();
        } else {
          sNoDataKey = "T_TABLE_AND_CHART_NO_DATA_TEXT";
        }
      } else if (oTableFilterInfo.search || oTableFilterInfo.filters && oTableFilterInfo.filters.length) {
        //check if table has any personalization filters
        sNoDataKey = _getNoDataTextWithFilters();
      } else {
        sNoDataKey = "M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT";
      }
      oTable.setNoData(getResourceModel(oTable).getText(sNoDataKey, undefined, suffixResourceKey));
    },
    handleTableDataReceived: function (oTable, oInternalModelContext) {
      const oBinding = oTable && oTable.getRowBinding(),
        bDataReceivedAttached = oInternalModelContext && oInternalModelContext.getProperty("dataReceivedAttached");
      if (oInternalModelContext && !bDataReceivedAttached) {
        oBinding.attachDataReceived(function () {
          // Refresh the selected contexts to trigger re-calculation of enabled state of actions.
          oInternalModelContext.setProperty("selectedContexts", []);
          const aSelectedContexts = oTable.getSelectedContexts();
          oInternalModelContext.setProperty("selectedContexts", aSelectedContexts);
          oInternalModelContext.setProperty("numberOfSelectedContexts", aSelectedContexts.length);
          const oActionOperationAvailableMap = JSON.parse(CommonHelper.parseCustomData(DelegateUtil.getCustomData(oTable, "operationAvailableMap")));
          ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, "table");
          // Refresh enablement of delete button
          DeleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);
          const oTableAPI = oTable ? oTable.getParent() : null;
          if (oTableAPI) {
            oTableAPI.setUpEmptyRows(oTable);
          }
        });
        oInternalModelContext.setProperty("dataReceivedAttached", true);
      }
    },
    rebind: function (oTable, oBindingInfo) {
      const oTableAPI = oTable.getParent();
      const bIsSuspended = oTableAPI === null || oTableAPI === void 0 ? void 0 : oTableAPI.getProperty("bindingSuspended");
      oTableAPI === null || oTableAPI === void 0 ? void 0 : oTableAPI.setProperty("outDatedBinding", bIsSuspended);
      if (!bIsSuspended) {
        TableRuntime.clearSelection(oTable);
        TableDelegateBase.rebind.apply(this, [oTable, oBindingInfo]);
        TableUtils.onTableBound(oTable);
        this._setTableNoDataText(oTable, oBindingInfo);
        return TableUtils.whenBound(oTable).then(this.handleTableDataReceived(oTable, oTable.getBindingContext("internal"))).catch(function (oError) {
          Log.error("Error while waiting for the table to be bound", oError);
        });
      }
      return Promise.resolve();
    },
    /**
     * Fetches the relevant metadata for the table and returns property info array.
     *
     * @param table Instance of the MDCtable
     * @returns Array of property info
     */
    fetchProperties: function (table) {
      return DelegateUtil.fetchModel(table).then(model => {
        return this._getCachedOrFetchPropertiesForEntity(table, DelegateUtil.getCustomData(table, "entityType"), model.getMetaModel());
      }).then(properties => {
        var _table$getBindingCont;
        (_table$getBindingCont = table.getBindingContext("internal")) === null || _table$getBindingCont === void 0 ? void 0 : _table$getBindingCont.setProperty("tablePropertiesAvailable", true);
        return properties;
      });
    },
    preInit: function (table) {
      return TableDelegateBase.preInit.apply(this, [table]).then(() => {
        var _filterBar$getParent;
        /**
         * Set the binding context to null for every fast creation row to avoid inheriting
         * the wrong context and requesting the table columns on the parent entity
         * Set the correct binding context in ObjectPageController.enableFastCreationRow()
         */
        const fastCreationRow = table.getCreationRow();
        if (fastCreationRow) {
          fastCreationRow.setBindingContext(null);
        }
        const filterBar = Core.byId(table.getFilter());
        filterBar === null || filterBar === void 0 ? void 0 : (_filterBar$getParent = filterBar.getParent()) === null || _filterBar$getParent === void 0 ? void 0 : _filterBar$getParent.attachEvent("search", () => {
          const internalBindingContext = table.getBindingContext("internal");
          internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(SEARCH_HAS_BEEN_FIRED, true);
        });
        return null;
      });
    },
    updateBindingInfo: function (oTable, oBindingInfo) {
      var _oTable$getCreationRo;
      const internalBindingContext = oTable.getBindingContext("internal");
      internalBindingContext.setProperty("isInsightsEnabled", true);
      TableDelegateBase.updateBindingInfo.apply(this, [oTable, oBindingInfo]);
      this._internalUpdateBindingInfo(oTable, oBindingInfo);
      this._setTableNoDataText(oTable, oBindingInfo);
      /**
       * We have to set the binding context to null for every fast creation row to avoid it inheriting
       * the wrong context and requesting the table columns on the parent entity
       * The correct binding context is set in ObjectPageController.enableFastCreationRow()
       */
      const context = oTable.getBindingContext();
      if (((_oTable$getCreationRo = oTable.getCreationRow()) === null || _oTable$getCreationRo === void 0 ? void 0 : _oTable$getCreationRo.getBindingContext()) === null && oBindingInfo.path && context) {
        var _oTable$getModel;
        TableHelper.enableFastCreationRow(oTable.getCreationRow(), oBindingInfo.path, context, oTable.getModel(), (_oTable$getModel = oTable.getModel("ui")) === null || _oTable$getModel === void 0 ? void 0 : _oTable$getModel.getProperty("/isEditable"));
      }
    },
    _manageSemanticTargets: function (oMDCTable) {
      const oRowBinding = oMDCTable.getRowBinding();
      if (oRowBinding) {
        oRowBinding.attachEventOnce("dataRequested", function () {
          setTimeout(function () {
            const _oView = CommonUtils.getTargetView(oMDCTable);
            if (_oView) {
              TableUtils.getSemanticTargetsFromTable(_oView.getController(), oMDCTable);
            }
          }, 0);
        });
      }
    },
    updateBinding: function (table, bindingInfo, binding) {
      const oTableAPI = table.getParent();
      const bIsSuspended = oTableAPI === null || oTableAPI === void 0 ? void 0 : oTableAPI.getProperty("bindingSuspended");
      if (!bIsSuspended) {
        let needManualRefresh = false;
        const view = CommonUtils.getTargetView(table);
        const internalBindingContext = table.getBindingContext("internal");
        const manualUpdatePropertyKey = "pendingManualBindingUpdate";
        const pendingManualUpdate = internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.getProperty(manualUpdatePropertyKey);
        if (binding) {
          var _bindingInfo$paramete;
          /**
           * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
           * is not enough to trigger a batch request.
           * Removing columns creates one batch request that was not executed before
           */
          const viewData = view === null || view === void 0 ? void 0 : view.getViewData();
          const oldFilters = binding.getFilters("Application");
          const filterNotChanged = deepEqual(bindingInfo.filters, oldFilters[0]) && bindingInfo.path === binding.getPath() &&
          // The path can be changed in case of a parametrized entity
          binding.getQueryOptionsFromParameters().$search === (bindingInfo === null || bindingInfo === void 0 ? void 0 : (_bindingInfo$paramete = bindingInfo.parameters) === null || _bindingInfo$paramete === void 0 ? void 0 : _bindingInfo$paramete.$search);
          const LRMultiViewEnabled = !!viewData.views;
          needManualRefresh = filterNotChanged && ((internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.getProperty(SEARCH_HAS_BEEN_FIRED)) || ( // check if the search has been triggered
          internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.getProperty(COLUMN_HAS_BEEN_ADDED)) ||
          // check if a column has been added
          LRMultiViewEnabled) &&
          // if the multi view is enabled the request should be refreshed as we don't known if the content of the table is outdated due to an action on another table
          !pendingManualUpdate && viewData.converterType === "ListReport";
        }
        TableDelegateBase.updateBinding.apply(this, [table, bindingInfo, binding]);
        table.fireEvent("bindingUpdated");
        if (needManualRefresh && table.getFilter() && binding) {
          binding.requestRefresh(binding.getGroupId()).finally(() => {
            internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(manualUpdatePropertyKey, false);
          }).catch(function (oError) {
            Log.error("Error while refreshing the table", oError);
          });
          internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(manualUpdatePropertyKey, true);
        }
        internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(SEARCH_HAS_BEEN_FIRED, false);
        internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(COLUMN_HAS_BEEN_ADDED, false);
        this._manageSemanticTargets(table);

        //for Treetable, it's necessary to clear the pastableContexts since the binding destroys previous contexts.
        if (oTableAPI.getTableDefinition().control.type === "TreeTable") {
          internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty("pastableContexts", []);
        }
      }
      oTableAPI === null || oTableAPI === void 0 ? void 0 : oTableAPI.setProperty("outDatedBinding", bIsSuspended);
    },
    _computeRowBindingInfoFromTemplate: function (oTable) {
      // We need to deepClone the info we get from the custom data, otherwise some of its subobjects (e.g. parameters) will
      // be shared with oBindingInfo and modified later (Object.assign only does a shallow clone)
      const rowBindingInfo = deepClone(DelegateUtil.getCustomData(oTable, "rowsBindingInfo"));
      // if the rowBindingInfo has a $$getKeepAliveContext parameter we need to check it is the only Table with such a
      // parameter for the collectionMetaPath
      if (rowBindingInfo.parameters.$$getKeepAliveContext) {
        const collectionPath = DelegateUtil.getCustomData(oTable, "targetCollectionPath");
        const internalModel = oTable.getModel("internal");
        const keptAliveLists = internalModel.getObject("/keptAliveLists") || {};
        if (!keptAliveLists[collectionPath]) {
          keptAliveLists[collectionPath] = oTable.getId();
          internalModel.setProperty("/keptAliveLists", keptAliveLists);
        } else if (keptAliveLists[collectionPath] !== oTable.getId()) {
          delete rowBindingInfo.parameters.$$getKeepAliveContext;
        }
      }
      return rowBindingInfo;
    },
    _internalUpdateBindingInfo: function (oTable, oBindingInfo) {
      const oInternalModelContext = oTable.getBindingContext("internal");
      Object.assign(oBindingInfo, this._computeRowBindingInfoFromTemplate(oTable));
      /**
       * Binding info might be suspended at the beginning when the first bindRows is called:
       * To avoid duplicate requests but still have a binding to create new entries.				 *
       * After the initial binding step, follow up bindings should no longer be suspended.
       */
      if (oTable.getRowBinding()) {
        oBindingInfo.suspended = false;
      }
      // The previously added handler for the event 'dataReceived' is not anymore there
      // since the bindingInfo is recreated from scratch so we need to set the flag to false in order
      // to again add the handler on this event if needed
      if (oInternalModelContext) {
        oInternalModelContext.setProperty("dataReceivedAttached", false);
      }
      let oFilter;
      const oFilterInfo = TableUtils.getAllFilterInfo(oTable);
      // Prepare binding info with filter/search parameters
      if (oFilterInfo.filters.length > 0) {
        oFilter = new Filter({
          filters: oFilterInfo.filters,
          and: true
        });
      }
      if (oFilterInfo.bindingPath) {
        oBindingInfo.path = oFilterInfo.bindingPath;
      }
      const oDataStateIndicator = oTable.getDataStateIndicator();
      if (oDataStateIndicator && oDataStateIndicator.isFiltering()) {
        // Include filters on messageStrip
        if (oBindingInfo.filters.length > 0) {
          oFilter = new Filter({
            filters: oBindingInfo.filters.concat(oFilterInfo.filters),
            and: true
          });
          this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
        }
      } else {
        this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
      }
    },
    updateBindingInfoWithSearchQuery: function (bindingInfo, filterInfo, filter) {
      bindingInfo.filters = filter;
      if (filterInfo.search) {
        bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterInfo.search);
      } else {
        bindingInfo.parameters.$search = undefined;
      }
    },
    _templateCustomColumnFragment: async function (oColumnInfo, oView, oModifier, sTableId, oTableContext) {
      const tableCollectionModel = oTableContext.getModel && oTableContext.getModel();
      const oColumnModel = new JSONModel(oColumnInfo),
        oThis = new JSONModel({
          id: sTableId
        }),
        oPreprocessorSettings = {
          bindingContexts: {
            this: oThis.createBindingContext("/"),
            column: oColumnModel.createBindingContext("/"),
            collection: oTableContext
          },
          models: {
            metaModel: tableCollectionModel,
            this: oThis,
            column: oColumnModel,
            collection: tableCollectionModel
          }
        };
      return DelegateUtil.templateControlFragment("sap.fe.macros.table.CustomColumn", oPreprocessorSettings, {
        view: oView
      }, oModifier).then(function (oItem) {
        oColumnModel.destroy();
        return oItem;
      });
    },
    /**
     * Creates a template from the fragment of a slot column.
     *
     * @param columnInfo The custom table column
     * @param view The current view
     * @param modifier The control tree modifier
     * @param tableId The id of the underlying table
     * @returns The loaded fragment
     */
    _templateSlotColumnFragment: async function (columnInfo, view, modifier, tableId) {
      const oColumnModel = new JSONModel(columnInfo),
        oThis = new JSONModel({
          id: tableId
        }),
        oPreprocessorSettings = {
          bindingContexts: {
            this: oThis.createBindingContext("/"),
            column: oColumnModel.createBindingContext("/")
          },
          models: {
            this: oThis,
            column: oColumnModel
          }
        };
      const slotColumnsXML = await DelegateUtil.templateControlFragment("sap.fe.macros.table.SlotColumn", oPreprocessorSettings, {
        isXML: true
      });
      if (!slotColumnsXML) {
        return Promise.resolve(null);
      }
      const slotXML = slotColumnsXML.getElementsByTagName("slot")[0],
        mdcTableTemplateXML = slotColumnsXML.getElementsByTagName("mdcTable:template")[0];
      mdcTableTemplateXML.removeChild(slotXML);
      if (columnInfo.template) {
        const oTemplate = new DOMParser().parseFromString(columnInfo.template, "text/xml");
        mdcTableTemplateXML.appendChild(oTemplate.firstElementChild);
      } else {
        Log.error(`Please provide content inside this Building Block Column: ${columnInfo.header}`);
        return Promise.resolve(null);
      }
      if ((modifier === null || modifier === void 0 ? void 0 : modifier.targets) !== "jsControlTree") {
        return slotColumnsXML;
      }
      return Fragment.load({
        type: "XML",
        definition: slotColumnsXML,
        controller: view.getController()
      });
    },
    /**
     * Creates a template from the fragment of a computed column.
     *
     * @param columnInfo The computed table column
     * @param view The current view
     * @param modifier The control tree modifier
     * @param tableId The id of the underlying table
     * @param tableContext
     * @returns The loaded fragment
     */
    _templateComputedColumnFragment: async function (columnInfo, view, modifier, tableId, tableContext) {
      const tableCollectionModel = tableContext.getModel && tableContext.getModel();
      const columnModel = new JSONModel(columnInfo),
        myThis = new JSONModel({
          id: tableId
        }),
        preprocessorSettings = {
          bindingContexts: {
            this: myThis.createBindingContext("/"),
            column: columnModel.createBindingContext("/"),
            collection: tableContext
          },
          models: {
            metaModel: tableCollectionModel,
            this: myThis,
            column: columnModel,
            collection: tableCollectionModel
          }
        };
      return DelegateUtil.templateControlFragment("sap.fe.macros.table.ComputedColumn", preprocessorSettings, {
        view: view
      }, modifier).then(function (item) {
        columnModel.destroy();
        return item;
      });
    },
    _getExportFormat: function (dataType) {
      switch (dataType) {
        case "Edm.Date":
          return ExcelFormat.getExcelDatefromJSDate();
        case "Edm.DateTimeOffset":
          return ExcelFormat.getExcelDateTimefromJSDateTime();
        case "Edm.TimeOfDay":
          return ExcelFormat.getExcelTimefromJSTime();
        default:
          return undefined;
      }
    },
    _getVHRelevantFields: function (oMetaModel, sMetadataPath, sBindingPath) {
      let aFields = [],
        oDataFieldData = oMetaModel.getObject(sMetadataPath);
      if (oDataFieldData.$kind && oDataFieldData.$kind === "Property") {
        oDataFieldData = oMetaModel.getObject(`${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
        sMetadataPath = `${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`;
      }
      switch (oDataFieldData.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          if (oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath`).includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
            oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath/Data`).forEach((oValue, iIndex) => {
              aFields = aFields.concat(this._getVHRelevantFields(oMetaModel, `${sMetadataPath}/Target/$AnnotationPath/Data/${iIndex}`));
            });
          }
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          aFields.push(oMetaModel.getObject(`${sMetadataPath}/Value/$Path`));
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          break;
        default:
          // property
          // temporary workaround to make sure VH relevant field path do not contain the bindingpath
          if (sMetadataPath.indexOf(sBindingPath) === 0) {
            aFields.push(sMetadataPath.substring(sBindingPath.length + 1));
            break;
          }
          aFields.push(CommonHelper.getNavigationPath(sMetadataPath, true));
          break;
      }
      return aFields;
    },
    _setDraftIndicatorOnVisibleColumn: function (oTable, aColumns, oColumnInfo) {
      const oInternalBindingContext = oTable.getBindingContext("internal");
      if (!oInternalBindingContext) {
        return;
      }
      const sInternalPath = oInternalBindingContext.getPath();
      const aColumnsWithDraftIndicator = aColumns.filter(oColumn => {
        return this._bColumnHasPropertyWithDraftIndicator(oColumn);
      });
      const aVisibleColumns = oTable.getColumns();
      let sAddVisibleColumnName, sVisibleColumnName, bFoundColumnVisibleWithDraft, sColumnNameWithDraftIndicator;
      for (const i in aVisibleColumns) {
        sVisibleColumnName = aVisibleColumns[i].getDataProperty();
        for (const j in aColumnsWithDraftIndicator) {
          sColumnNameWithDraftIndicator = aColumnsWithDraftIndicator[j].name;
          if (sVisibleColumnName === sColumnNameWithDraftIndicator) {
            bFoundColumnVisibleWithDraft = true;
            break;
          }
          if (oColumnInfo && oColumnInfo.name === sColumnNameWithDraftIndicator) {
            sAddVisibleColumnName = oColumnInfo.name;
          }
        }
        if (bFoundColumnVisibleWithDraft) {
          oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sVisibleColumnName);
          break;
        }
      }
      if (!bFoundColumnVisibleWithDraft && sAddVisibleColumnName) {
        oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, sAddVisibleColumnName);
      }
    },
    removeItem: function (oTable, oPropertyInfoName, mPropertyBag) {
      let doRemoveItem = true;
      if (!oPropertyInfoName) {
        // 1. Application removed the property from their data model
        // 2. addItem failed before revertData created
        return Promise.resolve(doRemoveItem);
      }
      const oModifier = mPropertyBag.modifier;
      const sDataProperty = oModifier.getProperty(oPropertyInfoName, "dataProperty");
      if (sDataProperty && sDataProperty.indexOf && sDataProperty.indexOf("InlineXML") !== -1) {
        oModifier.insertAggregation(oTable, "dependents", oPropertyInfoName);
        doRemoveItem = false;
      }
      if (oTable.isA && oModifier.targets === "jsControlTree") {
        this._setDraftIndicatorStatus(oModifier, oTable, this.getColumnsFor(oTable));
      }
      return Promise.resolve(doRemoveItem);
    },
    _getMetaModel: function (mPropertyBag) {
      return mPropertyBag.appComponent && mPropertyBag.appComponent.getModel().getMetaModel();
    },
    _setDraftIndicatorStatus: function (oModifier, oTable, aColumns, oColumnInfo) {
      if (oModifier.targets === "jsControlTree") {
        this._setDraftIndicatorOnVisibleColumn(oTable, aColumns, oColumnInfo);
      }
    },
    _getGroupId: function (sRetrievedGroupId) {
      return sRetrievedGroupId || undefined;
    },
    _getDependent: function (oDependent, sPropertyInfoName, sDataProperty) {
      if (sPropertyInfoName === sDataProperty) {
        return oDependent;
      }
      return undefined;
    },
    _fnTemplateValueHelp: function (fnTemplateValueHelp, bValueHelpRequired, bValueHelpExists) {
      if (bValueHelpRequired && !bValueHelpExists) {
        return fnTemplateValueHelp("sap.fe.macros.table.ValueHelp");
      }
      return Promise.resolve();
    },
    _getDisplayMode: function (bDisplayMode) {
      let columnEditMode;
      if (bDisplayMode !== undefined) {
        bDisplayMode = typeof bDisplayMode === "boolean" ? bDisplayMode : bDisplayMode === "true";
        columnEditMode = bDisplayMode ? "Display" : "Editable";
        return {
          displaymode: bDisplayMode,
          columnEditMode: columnEditMode
        };
      }
      return {
        displaymode: undefined,
        columnEditMode: undefined
      };
    },
    _insertAggregation: function (oValueHelp, oModifier, oTable) {
      if (oValueHelp) {
        return oModifier.insertAggregation(oTable, "dependents", oValueHelp, 0);
      }
      return undefined;
    },
    /**
     * Invoked when a column is added using the table personalization dialog.
     *
     * @param oTable Instance of table control
     * @param sPropertyInfoName Name of the property for which the column is added
     * @param mPropertyBag Instance of property bag from the flexibility API
     * @returns Once resolved, a table column definition is returned
     */
    addItem: async function (oTable, sPropertyInfoName, mPropertyBag) {
      const oMetaModel = this._getMetaModel(mPropertyBag),
        oModifier = mPropertyBag.modifier,
        sTableId = oModifier.getId(oTable),
        aColumns = oTable.isA ? this.getColumnsFor(oTable) : null;
      if (!aColumns) {
        return Promise.resolve(null);
      }
      const oColumnInfo = aColumns.find(function (oColumn) {
        return oColumn.name === sPropertyInfoName;
      });
      if (!oColumnInfo) {
        Log.error(`${sPropertyInfoName} not found while adding column`);
        return Promise.resolve(null);
      }
      const internalBindingContext = oTable.getBindingContext("internal");
      internalBindingContext === null || internalBindingContext === void 0 ? void 0 : internalBindingContext.setProperty(COLUMN_HAS_BEEN_ADDED, true);
      this._setDraftIndicatorStatus(oModifier, oTable, aColumns, oColumnInfo);
      const sPath = await DelegateUtil.getCustomData(oTable, "metaPath", oModifier);
      const oTableContext = oMetaModel.createBindingContext(sPath);
      // If view is not provided try to get it by accessing to the parental hierarchy
      // If it doesn't work (table into an unattached OP section) get the view via the AppComponent
      const view = mPropertyBag.view || CommonUtils.getTargetView(oTable) || (mPropertyBag.appComponent ? CommonUtils.getCurrentPageView(mPropertyBag.appComponent) : undefined);
      // render custom column
      if (oColumnInfo.type === "Default") {
        return this._templateCustomColumnFragment(oColumnInfo, view, oModifier, sTableId, oTableContext);
      }
      if (oColumnInfo.type === "Slot") {
        return this._templateSlotColumnFragment(oColumnInfo, view, oModifier, sTableId);
      }
      if (oColumnInfo.type === "Computed") {
        return this._templateComputedColumnFragment(oColumnInfo, view, oModifier, sTableId, oTableContext);
      }

      // fall-back
      if (!oMetaModel) {
        return Promise.resolve(null);
      }
      const sEntityTypePath = await DelegateUtil.getCustomData(oTable, "entityType", oModifier);
      const sRetrievedGroupId = await DelegateUtil.getCustomData(oTable, "requestGroupId", oModifier);
      const sGroupId = this._getGroupId(sRetrievedGroupId);
      const aFetchedProperties = await this._getCachedOrFetchPropertiesForEntity(oTable, sEntityTypePath, oMetaModel, mPropertyBag.appComponent);
      const oPropertyInfo = aFetchedProperties.find(function (oInfo) {
        return oInfo.name === sPropertyInfoName;
      });
      const oPropertyContext = oMetaModel.createBindingContext(oPropertyInfo.metadataPath);
      const aVHProperties = this._getVHRelevantFields(oMetaModel, oPropertyInfo.metadataPath, sPath);
      const oParameters = {
        sBindingPath: sPath,
        sValueHelpType: "TableValueHelp",
        oControl: oTable,
        oMetaModel,
        oModifier,
        oPropertyInfo
      };
      const fnTemplateValueHelp = async sFragmentName => {
        const oThis = new JSONModel({
            id: sTableId,
            requestGroupId: sGroupId
          }),
          oPreprocessorSettings = {
            bindingContexts: {
              this: oThis.createBindingContext("/"),
              dataField: oPropertyContext,
              contextPath: oTableContext
            },
            models: {
              this: oThis,
              dataField: oMetaModel,
              metaModel: oMetaModel,
              contextPath: oMetaModel
            }
          };
        try {
          const oValueHelp = await DelegateUtil.templateControlFragment(sFragmentName, oPreprocessorSettings, {}, oModifier);
          return await this._insertAggregation(oValueHelp, oModifier, oTable);
        } catch (oError) {
          //We always resolve the promise to ensure that the app does not crash
          Log.error(`ValueHelp not loaded : ${oError.message}`);
          return null;
        } finally {
          oThis.destroy();
        }
      };
      const fnTemplateFragment = (oInPropertyInfo, oView) => {
        const sFragmentName = "sap.fe.macros.table.Column";
        let bDisplayMode;
        let sTableTypeCustomData;
        let sOnChangeCustomData;
        let sCreationModeCustomData;
        return Promise.all([DelegateUtil.getCustomData(oTable, "displayModePropertyBinding", oModifier), DelegateUtil.getCustomData(oTable, "tableType", oModifier), DelegateUtil.getCustomData(oTable, "onChange", oModifier), DelegateUtil.getCustomData(oTable, "creationMode", oModifier)]).then(aCustomData => {
          bDisplayMode = aCustomData[0];
          sTableTypeCustomData = aCustomData[1];
          sOnChangeCustomData = aCustomData[2];
          sCreationModeCustomData = aCustomData[3];
          // Read Only and Column Edit Mode can both have three state
          // Undefined means that the framework decides what to do
          // True / Display means always read only
          // False / Editable means editable but while still respecting the low level principle (immutable property will not be editable)
          const oDisplayModes = this._getDisplayMode(bDisplayMode);
          bDisplayMode = oDisplayModes.displaymode;
          const columnEditMode = oDisplayModes.columnEditMode;
          const oThis = new JSONModel({
              enableAutoColumnWidth: oTable.getParent().enableAutoColumnWidth,
              isOptimizedForSmallDevice: oTable.getParent().isOptimizedForSmallDevice,
              readOnly: bDisplayMode,
              columnEditMode: columnEditMode,
              tableType: sTableTypeCustomData,
              onChange: sOnChangeCustomData,
              id: sTableId,
              navigationPropertyPath: sPropertyInfoName,
              columnInfo: oColumnInfo,
              collection: {
                sPath: sPath,
                oModel: oMetaModel
              },
              creationMode: {
                name: sCreationModeCustomData
              },
              widthIncludingColumnHeader: oTable.getParent().widthIncludingColumnHeader
            }),
            oPreprocessorSettings = {
              bindingContexts: {
                entitySet: oTableContext,
                collection: oTableContext,
                dataField: oPropertyContext,
                this: oThis.createBindingContext("/"),
                column: oThis.createBindingContext("/columnInfo")
              },
              models: {
                this: oThis,
                entitySet: oMetaModel,
                collection: oMetaModel,
                dataField: oMetaModel,
                metaModel: oMetaModel,
                column: oThis
              },
              appComponent: mPropertyBag.appComponent
            };
          return DelegateUtil.templateControlFragment(sFragmentName, oPreprocessorSettings, {
            view: oView
          }, oModifier).finally(function () {
            oThis.destroy();
          });
        });
      };
      await Promise.all(aVHProperties.map(async sPropertyName => {
        const mParameters = Object.assign({}, oParameters, {
          sPropertyName: sPropertyName
        });
        const aResults = await Promise.all([DelegateUtil.isValueHelpRequired(mParameters), DelegateUtil.doesValueHelpExist(mParameters)]);
        const bValueHelpRequired = aResults[0],
          bValueHelpExists = aResults[1];
        return this._fnTemplateValueHelp(fnTemplateValueHelp, bValueHelpRequired, bValueHelpExists);
      }));
      return fnTemplateFragment(oPropertyInfo, view);
    },
    /**
     * Provide the Table's filter delegate to provide basic filter functionality such as adding FilterFields.
     *
     * @returns Object for the Tables filter personalization.
     */
    getFilterDelegate: function () {
      return Object.assign({
        apiVersion: 2
      }, FilterBarDelegate, {
        addItem: function (oParentControl, sPropertyInfoName) {
          if (sPropertyInfoName.indexOf("Property::") === 0) {
            // Correct the name of complex property info references.
            sPropertyInfoName = sPropertyInfoName.replace("Property::", "");
          }
          return FilterBarDelegate.addItem(oParentControl, sPropertyInfoName);
        }
      });
    },
    /**
     * Returns the TypeMap attached to this delegate.
     *
     * @returns Any instance of TypeMap
     */
    getTypeMap: function /*oPayload: object*/
    () {
      return TypeMap;
    },
    formatGroupHeader(oTable, oContext, sProperty) {
      var _oFormatInfo$typeConf, _oFormatInfo$typeConf2;
      const mFormatInfos = DelegateUtil.getCachedProperties(oTable),
        oFormatInfo = mFormatInfos && mFormatInfos.filter(obj => {
          return obj.name === sProperty;
        })[0],
        /*For a Date or DateTime property, the value is returned in external format using a UI5 type for the
              given property path that formats corresponding to the property's EDM type and constraints*/
        bExternalFormat = (oFormatInfo === null || oFormatInfo === void 0 ? void 0 : (_oFormatInfo$typeConf = oFormatInfo.typeConfig) === null || _oFormatInfo$typeConf === void 0 ? void 0 : _oFormatInfo$typeConf.baseType) === "DateTime" || (oFormatInfo === null || oFormatInfo === void 0 ? void 0 : (_oFormatInfo$typeConf2 = oFormatInfo.typeConfig) === null || _oFormatInfo$typeConf2 === void 0 ? void 0 : _oFormatInfo$typeConf2.baseType) === "Date";
      let sValue;
      if (oFormatInfo && oFormatInfo.mode) {
        switch (oFormatInfo.mode) {
          case "Description":
            sValue = oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat);
            break;
          case "DescriptionValue":
            sValue = ValueFormatter.formatWithBrackets(oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat), oContext.getProperty(oFormatInfo.valueProperty, bExternalFormat));
            break;
          case "ValueDescription":
            sValue = ValueFormatter.formatWithBrackets(oContext.getProperty(oFormatInfo.valueProperty, bExternalFormat), oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat));
            break;
          default:
            break;
        }
      } else {
        sValue = oContext.getProperty(oFormatInfo === null || oFormatInfo === void 0 ? void 0 : oFormatInfo.path, bExternalFormat);
      }
      return getResourceModel(oTable).getText("M_TABLE_GROUP_HEADER_TITLE", [oFormatInfo === null || oFormatInfo === void 0 ? void 0 : oFormatInfo.label, sValue]);
    }
  });
}, false);
