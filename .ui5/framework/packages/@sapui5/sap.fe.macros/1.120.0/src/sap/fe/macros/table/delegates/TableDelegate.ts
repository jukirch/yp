import type { DataFieldForAnnotation, FieldGroupType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import deepEqual from "sap/base/util/deepEqual";
import deepExtend from "sap/base/util/deepExtend";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import type AppComponent from "sap/fe/core/AppComponent";
import type { BaseTreeModifier } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type { ListReportManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type {
	AnnotationTableColumn,
	ColumnExportSettings,
	ComputedTableColumn,
	CustomBasedTableColumn,
	PropertyTypeConfig,
	TableColumn,
	TechnicalColumn
} from "sap/fe/core/converters/controls/Common/Table";
import type { CustomElement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import ValueFormatter from "sap/fe/core/formatters/ValueFormatter";
import DeleteHelper from "sap/fe/core/helpers/DeleteHelper";
import ExcelFormat from "sap/fe/core/helpers/ExcelFormatHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getLocalizedText, getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import SizeHelper from "sap/fe/core/helpers/SizeHelper";
import { isMultipleNavigationProperty } from "sap/fe/core/helpers/TypeGuards";
import { isTypeFilterable } from "sap/fe/core/type/EDM";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { PropertyInfo, tableDelegateModel } from "sap/fe/macros/DelegateUtil";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import FilterBarDelegate from "sap/fe/macros/filterBar/FilterBarDelegate";
import TableSizeHelper from "sap/fe/macros/table/TableSizeHelper";
import TableUtils from "sap/fe/macros/table/Utils";
import Core from "sap/ui/core/Core";
import type UI5Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import type View from "sap/ui/core/mvc/View";
import type { JsControlTreeModifier } from "sap/ui/core/util/reflection";
import type Control from "sap/ui/mdc/Control";
import type { default as MDCTable, default as Table } from "sap/ui/mdc/Table";
import TableDelegateBase from "sap/ui/mdc/odata/v4/TableDelegate";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type MetaModel from "sap/ui/model/MetaModel";
import JSONModel from "sap/ui/model/json/JSONModel";
import type v4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { BindingInfo } from "types/sap.ui.mdc/sap/ui/mdc/BindingInfo";
import type TableAPI from "../TableAPI";
import TableHelper from "../TableHelper";
import TableRuntime from "../TableRuntime";

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
export default Object.assign({}, TableDelegateBase, {
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
	_computeVisualSettingsForFieldGroup: function (oTable: Table, oProperty: any, aProperties: any[]) {
		if (oProperty.name.indexOf("DataFieldForAnnotation::FieldGroup::") === 0) {
			const oColumn = oTable.getColumns().find(function (oCol: any) {
				return oCol.getDataProperty() === oProperty.name;
			});
			const bShowDataFieldsLabel = oColumn ? oColumn.data("showDataFieldsLabel") === "true" : false;
			const oMetaModel = (oTable.getModel() as ODataModel).getMetaModel();
			const involvedDataModelObjects = getInvolvedDataModelObjects(oMetaModel.getContext(oProperty.metadataPath));
			const convertedMetaData = involvedDataModelObjects.convertedTypes;
			const oDataField = involvedDataModelObjects.targetObject as DataFieldForAnnotation;
			const oFieldGroup = oDataField.Target.$target as FieldGroupType;
			const aFieldWidth: any = [];
			oFieldGroup.Data.forEach(function (oData: any) {
				let oDataFieldWidth: any;
				switch (oData.$Type) {
					case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
						oDataFieldWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(
							oData,
							false,
							aProperties,
							convertedMetaData,
							bShowDataFieldsLabel
						);
						break;
					case "com.sap.vocabularies.UI.v1.DataField":
						oDataFieldWidth = TableSizeHelper.getWidthForDataField(
							oData,
							bShowDataFieldsLabel,
							aProperties,
							convertedMetaData,
							false
						);
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
			const nWidest = aFieldWidth.reduce(function (acc: any, value: any) {
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

	_computeVisualSettingsForPropertyWithValueHelp: function (table: Table, property: PropertyInfo) {
		const tableAPI = table.getParent() as TableAPI;
		if (!property.propertyInfos) {
			const metaModel = (table.getModel() as ODataModel).getMetaModel();
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

	_computeVisualSettingsForPropertyWithUnit: function (
		oTable: any,
		oProperty: any,
		oUnit?: string,
		oUnitText?: string,
		oTimezoneText?: string
	) {
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

	_computeLabel: function (property: PropertyInfo, labelMap: { [label: string]: PropertyInfo[] }) {
		if (property.label) {
			const propertiesWithSameLabel = labelMap[property.label];
			if (propertiesWithSameLabel?.length > 1 && property.path?.includes("/") && property.additionalLabels) {
				property.label = property.label + " (" + property.additionalLabels.join(" / ") + ")";
			}
			delete property.additionalLabels;
		}
	},
	//Update VisualSetting for columnWidth calculation and labels on navigation properties
	_updatePropertyInfo: function (table: Table, properties: PropertyInfo[]) {
		const labelMap: { [label: string]: PropertyInfo[] } = {};
		// Check available p13n modes
		const p13nMode = table.getP13nMode();
		properties.forEach((property: PropertyInfo) => {
			if (!property.propertyInfos && property.label) {
				// Only for non-complex properties
				if (
					(p13nMode?.includes("Sort") && property.sortable) ||
					(p13nMode?.includes("Filter") && property.filterable) ||
					(p13nMode?.includes("Group") && property.groupable)
				) {
					labelMap[property.label] =
						labelMap[property.label] !== undefined ? labelMap[property.label].concat([property]) : [property];
				}
			}
		});
		properties.forEach((property: any) => {
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

	getColumnsFor: function (table: Table): TableColumn[] {
		return (table.getParent() as TableAPI).getTableDefinition().columns;
	},

	_getAggregatedPropertyMap: function (oTable: any) {
		return oTable.getParent().getTableDefinition().aggregates;
	},

	/**
	 * Returns the export capabilities for the given sap.ui.mdc.Table instance.
	 *
	 * @param oTable Instance of the table
	 * @returns Promise representing the export capabilities of the table instance
	 */
	fetchExportCapabilities: function (oTable: any) {
		const oCapabilities: any = { XLSX: {} };
		let oModel!: any;
		return DelegateUtil.fetchModel(oTable)
			.then(function (model: any) {
				oModel = model;
				return oModel.getMetaModel().getObject("/$EntityContainer@Org.OData.Capabilities.V1.SupportedFormats");
			})
			.then(function (aSupportedFormats: string[] | undefined) {
				const aLowerFormats = (aSupportedFormats || []).map((element) => {
					return element.toLowerCase();
				});
				if (aLowerFormats.includes("application/pdf")) {
					return oModel.getMetaModel().getObject("/$EntityContainer@com.sap.vocabularies.PDF.v1.Features");
				}
				return undefined;
			})
			.then(function (oAnnotation: any) {
				if (oAnnotation) {
					oCapabilities["PDF"] = Object.assign({}, oAnnotation);
				}
				return;
			})
			.catch(function (err: any) {
				Log.error(`An error occurs while computing export capabilities: ${err}`);
			})
			.then(function () {
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
	_isFilterableNavigationProperty: function (columnInfo: AnnotationTableColumn, metaModel: MetaModel, table: Table): Boolean {
		// get the DataModelObjectPath for the table
		const tableDataModelObjectPath = getInvolvedDataModelObjects(metaModel.getContext(DelegateUtil.getCustomData(table, "metaPath"))),
			// get all navigation properties leading to the column
			columnNavigationProperties = getInvolvedDataModelObjects(metaModel.getContext(columnInfo.annotationPath)).navigationProperties,
			// we are only interested in navigation properties relative to the table, so all before and including the tables targetType can be filtered
			tableTargetEntityIndex = columnNavigationProperties.findIndex(
				(prop) => prop.targetType?.name === tableDataModelObjectPath.targetEntityType.name
			),
			relativeNavigationProperties = columnNavigationProperties.slice(tableTargetEntityIndex > 0 ? tableTargetEntityIndex : 0);
		return (
			!columnInfo.relativePath.includes("/") ||
			(columnInfo.isPartOfLineItem === true && !relativeNavigationProperties.some(isMultipleNavigationProperty))
		);
	},

	_fetchPropertyInfo: function (metaModel: MetaModel, columnInfo: AnnotationTableColumn, table: Table, appComponent: AppComponent) {
		const sAbsoluteNavigationPath = columnInfo.annotationPath,
			oDataField = metaModel.getObject(sAbsoluteNavigationPath),
			oNavigationContext = metaModel.createBindingContext(sAbsoluteNavigationPath) as Context,
			oTypeConfig =
				columnInfo.typeConfig?.className && isTypeFilterable(columnInfo.typeConfig.className)
					? TypeMap.getTypeConfig(
							columnInfo.typeConfig.className,
							columnInfo.typeConfig.formatOptions,
							columnInfo.typeConfig.constraints
					  )
					: {},
			bFilterable = CommonHelper.isPropertyFilterable(oNavigationContext, oDataField),
			isComplexType =
				columnInfo.typeConfig && columnInfo.typeConfig.className && columnInfo.typeConfig.className?.indexOf("Edm.") !== 0,
			bIsAnalyticalTable = DelegateUtil.getCustomData(table, "enableAnalytics") === "true",
			aAggregatedPropertyMapUnfilterable = bIsAnalyticalTable ? this._getAggregatedPropertyMap(table) : {},
			label = getLocalizedText(columnInfo.label ?? "", appComponent ?? table);
		const tooltip = getLocalizedText(columnInfo.tooltip ?? "", appComponent ?? table);

		const propertyInfo: PropertyInfo = {
			name: columnInfo.name,
			metadataPath: sAbsoluteNavigationPath,
			groupLabel: columnInfo.groupLabel,
			group: columnInfo.group,
			label: label,
			tooltip: tooltip,
			typeConfig: oTypeConfig as PropertyTypeConfig,
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
		if (columnInfo.propertyInfos?.length) {
			propertyInfo.propertyInfos = columnInfo.propertyInfos;
		} else {
			// Add properties which are supported only by simple PropertyInfos.
			propertyInfo.path = columnInfo.relativePath;
			// TODO with the new complex property info, a lot of "Description" fields are added as filter/sort fields
			propertyInfo.sortable = columnInfo.sortable;
			if (bIsAnalyticalTable) {
				this._updateAnalyticalPropertyInfoAttributes(propertyInfo, columnInfo);
			}
			propertyInfo.filterable =
				!!bFilterable &&
				// Disable filtering on properties using textArrangement as TextOnly, this is required to be aligned with sorting and grouping
				columnInfo.textArrangement?.mode !== "Description" &&
				this._isFilterableNavigationProperty(columnInfo, metaModel, table) &&
				// TODO ignoring all properties that are not also available for adaptation for now, but proper concept required
				(!bIsAnalyticalTable ||
					(!aAggregatedPropertyMapUnfilterable[propertyInfo.name] &&
						!(columnInfo as TechnicalColumn).extension?.technicallyGroupable));
			propertyInfo.key = columnInfo.isKey;
			propertyInfo.groupable = columnInfo.isGroupable;
			if (columnInfo.textArrangement) {
				const descriptionColumn = (this.getColumnsFor(table) as AnnotationTableColumn[]).find(function (oCol) {
					return oCol.name === columnInfo.textArrangement?.textProperty;
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
				propertyInfo.additionalLabels = columnInfo.additionalLabels.map((additionalLabel: string) => {
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
	_setPropertyInfoExportSettings: function (
		exportSettings: ColumnExportSettings | undefined | null,
		columnInfo: AnnotationTableColumn
	): ColumnExportSettings | undefined | null {
		const exportFormat = this._getExportFormat(columnInfo.typeConfig?.className);
		if (exportFormat && exportSettings) {
			exportSettings.format = exportFormat;
		}
		return exportSettings;
	},

	_updateAnalyticalPropertyInfoAttributes(propertyInfo: PropertyInfo, columnInfo: AnnotationTableColumn) {
		if (columnInfo.aggregatable) {
			propertyInfo.aggregatable = columnInfo.aggregatable;
		}
		if (columnInfo.extension) {
			propertyInfo.extension = columnInfo.extension;
		}
	},

	_fetchComputedPropertyInfo: function (columnInfo: ComputedTableColumn, table: Table, appComponent: AppComponent) {
		let label = "";
		label = getLocalizedText(columnInfo.label, appComponent || table); // Todo: To be removed once MDC provides translation support
		const propertyInfo: PropertyInfo = {
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

	_fetchCustomPropertyInfo: function (columnInfo: CustomBasedTableColumn, table: Table, appComponent: AppComponent) {
		let sLabel = "";
		if (columnInfo.header) {
			if (columnInfo.header.startsWith("{metaModel>")) {
				const metaModelPath = columnInfo.header.substring(11, columnInfo.header.length - 1);
				sLabel = (table.getModel() as ODataModel).getMetaModel().getObject(metaModelPath);
			} else {
				sLabel = getLocalizedText(columnInfo.header, appComponent || table); // Todo: To be removed once MDC provides translation support
			}
		}
		const propertyInfo: PropertyInfo = {
			name: columnInfo.name,
			groupLabel: undefined,
			group: undefined,
			label: sLabel.toString(),
			type: "Edm.String", // TBD
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
	_bColumnHasPropertyWithDraftIndicator: function (oColumnInfo: any) {
		return !!(
			(oColumnInfo.formatOptions && oColumnInfo.formatOptions.hasDraftIndicator) ||
			(oColumnInfo.formatOptions && oColumnInfo.formatOptions.fieldGroupDraftIndicatorPropertyPath)
		);
	},
	_updateDraftIndicatorModel: function (_oTable: any, _oColumnInfo: any) {
		const aVisibleColumns = _oTable.getColumns();
		const oInternalBindingContext = _oTable.getBindingContext("internal");
		const sInternalPath = oInternalBindingContext && oInternalBindingContext.getPath();
		if (aVisibleColumns && oInternalBindingContext) {
			for (const index in aVisibleColumns) {
				if (
					this._bColumnHasPropertyWithDraftIndicator(_oColumnInfo) &&
					_oColumnInfo.name === aVisibleColumns[index].getDataProperty()
				) {
					if (oInternalBindingContext.getProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR) === undefined) {
						oInternalBindingContext.setProperty(sInternalPath + SEMANTICKEY_HAS_DRAFTINDICATOR, _oColumnInfo.name);
						break;
					}
				}
			}
		}
	},
	_fetchPropertiesForEntity: function (oTable: any, sEntityTypePath: any, oMetaModel: any, oAppComponent: any) {
		// when fetching properties, this binding context is needed - so lets create it only once and use if for all properties/data-fields/line-items
		const sBindingPath = ModelHelper.getEntitySetPath(sEntityTypePath);
		let aFetchedProperties: any[] = [];
		const oFR = CommonUtils.getFilterRestrictionsByPath(sBindingPath, oMetaModel);
		const aNonFilterableProps = oFR.NonFilterableProperties;
		return Promise.resolve(this.getColumnsFor(oTable))
			.then((aColumns: TableColumn[]) => {
				// DraftAdministrativeData does not work via 'entitySet/$NavigationPropertyBinding/DraftAdministrativeData'
				if (aColumns) {
					let oPropertyInfo;
					aColumns.forEach((oColumnInfo) => {
						this._updateDraftIndicatorModel(oTable, oColumnInfo);
						switch (oColumnInfo.type) {
							case "Annotation":
								oPropertyInfo = this._fetchPropertyInfo(
									oMetaModel,
									oColumnInfo as AnnotationTableColumn,
									oTable,
									oAppComponent
								);
								if (oPropertyInfo && !aNonFilterableProps.includes(oPropertyInfo.name)) {
									oPropertyInfo.maxConditions = DelegateUtil.isMultiValue(oPropertyInfo) ? -1 : 1;
								}
								break;
							case "Computed":
								oPropertyInfo = this._fetchComputedPropertyInfo(oColumnInfo as ComputedTableColumn, oTable, oAppComponent);
								break;
							case "Slot":
							case "Default":
								oPropertyInfo = this._fetchCustomPropertyInfo(oColumnInfo as CustomBasedTableColumn, oTable, oAppComponent);
								break;
							default:
								throw new Error(`unhandled switch case ${oColumnInfo.type}`);
						}
						aFetchedProperties.push(oPropertyInfo);
					});
				}
				return;
			})
			.then(() => {
				aFetchedProperties = this._updatePropertyInfo(oTable, aFetchedProperties);
				return;
			})
			.catch(function (err: any) {
				Log.error(`An error occurs while updating fetched properties: ${err}`);
			})
			.then(function () {
				return aFetchedProperties;
			});
	},

	_getCachedOrFetchPropertiesForEntity: function (table: Table, entityTypePath: string, metaModel: any, appComponent?: AppComponent) {
		const fetchedProperties = DelegateUtil.getCachedProperties(table);

		if (fetchedProperties) {
			return Promise.resolve(fetchedProperties);
		}
		return this._fetchPropertiesForEntity(table, entityTypePath, metaModel, appComponent).then(function (subFetchedProperties: any[]) {
			DelegateUtil.setCachedProperties(table, subFetchedProperties);
			return subFetchedProperties;
		});
	},

	_setTableNoDataText: function (oTable: any, oBindingInfo: any) {
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
			if (oTableFilterInfo.search || (oTableFilterInfo.filters && oTableFilterInfo.filters.length)) {
				// check if table has any Filterbar filters or personalization filters
				sNoDataKey = _getNoDataTextWithFilters();
			} else {
				sNoDataKey = "T_TABLE_AND_CHART_NO_DATA_TEXT";
			}
		} else if (oTableFilterInfo.search || (oTableFilterInfo.filters && oTableFilterInfo.filters.length)) {
			//check if table has any personalization filters
			sNoDataKey = _getNoDataTextWithFilters();
		} else {
			sNoDataKey = "M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT";
		}

		oTable.setNoData(getResourceModel(oTable).getText(sNoDataKey, undefined, suffixResourceKey));
	},

	handleTableDataReceived: function (oTable: any, oInternalModelContext: any) {
		const oBinding = oTable && oTable.getRowBinding(),
			bDataReceivedAttached = oInternalModelContext && oInternalModelContext.getProperty("dataReceivedAttached");

		if (oInternalModelContext && !bDataReceivedAttached) {
			oBinding.attachDataReceived(function () {
				// Refresh the selected contexts to trigger re-calculation of enabled state of actions.
				oInternalModelContext.setProperty("selectedContexts", []);
				const aSelectedContexts = oTable.getSelectedContexts();
				oInternalModelContext.setProperty("selectedContexts", aSelectedContexts);
				oInternalModelContext.setProperty("numberOfSelectedContexts", aSelectedContexts.length);
				const oActionOperationAvailableMap = JSON.parse(
					CommonHelper.parseCustomData(DelegateUtil.getCustomData(oTable, "operationAvailableMap"))
				);
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

	rebind: function (oTable: any, oBindingInfo: any): Promise<any> {
		const oTableAPI = oTable.getParent() as TableAPI;
		const bIsSuspended = oTableAPI?.getProperty("bindingSuspended");
		oTableAPI?.setProperty("outDatedBinding", bIsSuspended);
		if (!bIsSuspended) {
			TableRuntime.clearSelection(oTable);
			TableDelegateBase.rebind.apply(this, [oTable, oBindingInfo]);
			TableUtils.onTableBound(oTable);
			this._setTableNoDataText(oTable, oBindingInfo);
			return TableUtils.whenBound(oTable)
				.then(this.handleTableDataReceived(oTable, oTable.getBindingContext("internal")))
				.catch(function (oError: any) {
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
	fetchProperties: function (table: Table) {
		return DelegateUtil.fetchModel(table)
			.then((model) => {
				return this._getCachedOrFetchPropertiesForEntity(
					table,
					DelegateUtil.getCustomData(table, "entityType"),
					model.getMetaModel()
				);
			})
			.then((properties) => {
				(table.getBindingContext("internal") as Context)?.setProperty("tablePropertiesAvailable", true);
				return properties;
			});
	},

	preInit: function (table: Table) {
		return TableDelegateBase.preInit.apply(this, [table]).then(() => {
			/**
			 * Set the binding context to null for every fast creation row to avoid inheriting
			 * the wrong context and requesting the table columns on the parent entity
			 * Set the correct binding context in ObjectPageController.enableFastCreationRow()
			 */
			const fastCreationRow = table.getCreationRow();
			if (fastCreationRow) {
				fastCreationRow.setBindingContext(null as unknown as Context);
			}
			const filterBar = Core.byId(table.getFilter()) as Control | undefined;
			filterBar?.getParent()?.attachEvent("search", () => {
				const internalBindingContext = table.getBindingContext("internal");
				internalBindingContext?.setProperty(SEARCH_HAS_BEEN_FIRED, true);
			});
			return null;
		});
	},
	updateBindingInfo: function (oTable: Table, oBindingInfo: BindingInfo) {
		const internalBindingContext = oTable.getBindingContext("internal") as InternalModelContext;
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
		if (oTable.getCreationRow()?.getBindingContext() === null && oBindingInfo.path && context) {
			TableHelper.enableFastCreationRow(
				oTable.getCreationRow(),
				oBindingInfo.path,
				context as v4Context,
				oTable.getModel() as ODataModel,
				oTable.getModel("ui")?.getProperty("/isEditable")
			);
		}
	},

	_manageSemanticTargets: function (oMDCTable: any) {
		const oRowBinding = oMDCTable.getRowBinding();
		if (oRowBinding) {
			oRowBinding.attachEventOnce("dataRequested", function () {
				setTimeout(function () {
					const _oView = CommonUtils.getTargetView(oMDCTable);
					if (_oView) {
						TableUtils.getSemanticTargetsFromTable(_oView.getController() as PageController, oMDCTable);
					}
				}, 0);
			});
		}
	},

	updateBinding: function (table: MDCTable, bindingInfo: BindingInfo, binding?: ODataListBinding) {
		const oTableAPI = table.getParent() as TableAPI;
		const bIsSuspended = oTableAPI?.getProperty("bindingSuspended");
		if (!bIsSuspended) {
			let needManualRefresh = false;
			const view = CommonUtils.getTargetView(table);
			const internalBindingContext = table.getBindingContext("internal");
			const manualUpdatePropertyKey = "pendingManualBindingUpdate";
			const pendingManualUpdate = internalBindingContext?.getProperty(manualUpdatePropertyKey) as boolean;

			if (binding) {
				/**
				 * Manual refresh if filters are not changed by binding.refresh() since updating the bindingInfo
				 * is not enough to trigger a batch request.
				 * Removing columns creates one batch request that was not executed before
				 */
				const viewData = view?.getViewData() as ListReportManifestSettings;
				const oldFilters = binding.getFilters("Application");
				const filterNotChanged =
					deepEqual(bindingInfo.filters, oldFilters[0]) &&
					bindingInfo.path === binding.getPath() && // The path can be changed in case of a parametrized entity
					binding.getQueryOptionsFromParameters().$search === bindingInfo?.parameters?.$search;
				const LRMultiViewEnabled = !!viewData.views;

				needManualRefresh =
					filterNotChanged &&
					(internalBindingContext?.getProperty(SEARCH_HAS_BEEN_FIRED) || // check if the search has been triggered
						internalBindingContext?.getProperty(COLUMN_HAS_BEEN_ADDED) || // check if a column has been added
						LRMultiViewEnabled) && // if the multi view is enabled the request should be refreshed as we don't known if the content of the table is outdated due to an action on another table
					!pendingManualUpdate &&
					viewData.converterType === "ListReport";
			}
			TableDelegateBase.updateBinding.apply(this, [table, bindingInfo, binding]);
			table.fireEvent("bindingUpdated");
			if (needManualRefresh && table.getFilter() && binding) {
				binding
					.requestRefresh(binding.getGroupId())
					.finally(() => {
						internalBindingContext?.setProperty(manualUpdatePropertyKey, false);
					})
					.catch(function (oError: any) {
						Log.error("Error while refreshing the table", oError);
					});
				internalBindingContext?.setProperty(manualUpdatePropertyKey, true);
			}
			internalBindingContext?.setProperty(SEARCH_HAS_BEEN_FIRED, false);
			internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, false);
			this._manageSemanticTargets(table);

			//for Treetable, it's necessary to clear the pastableContexts since the binding destroys previous contexts.
			if (oTableAPI.getTableDefinition().control.type === "TreeTable") {
				internalBindingContext?.setProperty("pastableContexts", []);
			}
		}
		oTableAPI?.setProperty("outDatedBinding", bIsSuspended);
	},

	_computeRowBindingInfoFromTemplate: function (oTable: any) {
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
	_internalUpdateBindingInfo: function (oTable: any, oBindingInfo: any) {
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
			oFilter = new Filter({ filters: oFilterInfo.filters, and: true });
		}
		if (oFilterInfo.bindingPath) {
			oBindingInfo.path = oFilterInfo.bindingPath;
		}

		const oDataStateIndicator = oTable.getDataStateIndicator();
		if (oDataStateIndicator && oDataStateIndicator.isFiltering()) {
			// Include filters on messageStrip
			if (oBindingInfo.filters.length > 0) {
				oFilter = new Filter({ filters: oBindingInfo.filters.concat(oFilterInfo.filters), and: true });
				this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
			}
		} else {
			this.updateBindingInfoWithSearchQuery(oBindingInfo, oFilterInfo, oFilter);
		}
	},

	updateBindingInfoWithSearchQuery: function (bindingInfo: any, filterInfo: any, filter?: Filter) {
		bindingInfo.filters = filter;
		if (filterInfo.search) {
			bindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(filterInfo.search);
		} else {
			bindingInfo.parameters.$search = undefined;
		}
	},
	_templateCustomColumnFragment: async function (
		oColumnInfo: TableColumn,
		oView: View,
		oModifier: BaseTreeModifier | JsControlTreeModifier,
		sTableId: string,
		oTableContext: Context
	) {
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

		return DelegateUtil.templateControlFragment(
			"sap.fe.macros.table.CustomColumn",
			oPreprocessorSettings,
			{ view: oView },
			oModifier
		).then(function (oItem: any) {
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
	_templateSlotColumnFragment: async function (
		columnInfo: CustomElement<CustomBasedTableColumn>,
		view: View,
		modifier: BaseTreeModifier | JsControlTreeModifier,
		tableId: string
	): Promise<null | Control | Control[] | Element> {
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
		const slotColumnsXML = (await DelegateUtil.templateControlFragment("sap.fe.macros.table.SlotColumn", oPreprocessorSettings, {
			isXML: true
		})) as Element;
		if (!slotColumnsXML) {
			return Promise.resolve(null);
		}
		const slotXML = slotColumnsXML.getElementsByTagName("slot")[0],
			mdcTableTemplateXML = slotColumnsXML.getElementsByTagName("mdcTable:template")[0];
		mdcTableTemplateXML.removeChild(slotXML);
		if (columnInfo.template) {
			const oTemplate = new DOMParser().parseFromString(columnInfo.template, "text/xml");
			mdcTableTemplateXML.appendChild(oTemplate.firstElementChild!);
		} else {
			Log.error(`Please provide content inside this Building Block Column: ${columnInfo.header}`);
			return Promise.resolve(null);
		}
		if (modifier?.targets !== "jsControlTree") {
			return slotColumnsXML;
		}
		return Fragment.load({
			type: "XML",
			definition: slotColumnsXML,
			controller: view.getController()
		}) as Promise<Control | Control[]>;
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
	_templateComputedColumnFragment: async function (
		columnInfo: TableColumn,
		view: View,
		modifier: BaseTreeModifier | JsControlTreeModifier,
		tableId: string,
		tableContext: Context
	) {
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

		return DelegateUtil.templateControlFragment(
			"sap.fe.macros.table.ComputedColumn",
			preprocessorSettings,
			{ view: view },
			modifier
		).then(function (item: Element | UI5Element | Element[] | UI5Element[]) {
			columnModel.destroy();
			return item;
		});
	},

	_getExportFormat: function (dataType: any) {
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

	_getVHRelevantFields: function (oMetaModel: any, sMetadataPath: any, sBindingPath?: any) {
		let aFields: any[] = [],
			oDataFieldData = oMetaModel.getObject(sMetadataPath);

		if (oDataFieldData.$kind && oDataFieldData.$kind === "Property") {
			oDataFieldData = oMetaModel.getObject(`${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
			sMetadataPath = `${sMetadataPath}@com.sap.vocabularies.UI.v1.DataFieldDefault`;
		}
		switch (oDataFieldData.$Type) {
			case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
				if (oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath`).includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
					oMetaModel.getObject(`${sMetadataPath}/Target/$AnnotationPath/Data`).forEach((oValue: any, iIndex: any) => {
						aFields = aFields.concat(
							this._getVHRelevantFields(oMetaModel, `${sMetadataPath}/Target/$AnnotationPath/Data/${iIndex}`)
						);
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
	_setDraftIndicatorOnVisibleColumn: function (oTable: any, aColumns: any, oColumnInfo: any) {
		const oInternalBindingContext = oTable.getBindingContext("internal");
		if (!oInternalBindingContext) {
			return;
		}
		const sInternalPath = oInternalBindingContext.getPath();
		const aColumnsWithDraftIndicator = aColumns.filter((oColumn: any) => {
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
	removeItem: function (oTable: any, oPropertyInfoName: any, mPropertyBag: any) {
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
	_getMetaModel: function (mPropertyBag: any) {
		return mPropertyBag.appComponent && mPropertyBag.appComponent.getModel().getMetaModel();
	},
	_setDraftIndicatorStatus: function (oModifier: any, oTable: any, aColumns: any, oColumnInfo?: any) {
		if (oModifier.targets === "jsControlTree") {
			this._setDraftIndicatorOnVisibleColumn(oTable, aColumns, oColumnInfo);
		}
	},
	_getGroupId: function (sRetrievedGroupId: any) {
		return sRetrievedGroupId || undefined;
	},
	_getDependent: function (oDependent: any, sPropertyInfoName: any, sDataProperty: any) {
		if (sPropertyInfoName === sDataProperty) {
			return oDependent;
		}
		return undefined;
	},
	_fnTemplateValueHelp: function (fnTemplateValueHelp: any, bValueHelpRequired: any, bValueHelpExists: any) {
		if (bValueHelpRequired && !bValueHelpExists) {
			return fnTemplateValueHelp("sap.fe.macros.table.ValueHelp");
		}
		return Promise.resolve();
	},
	_getDisplayMode: function (bDisplayMode: any) {
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
	_insertAggregation: function (oValueHelp: any, oModifier: any, oTable: any) {
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
	addItem: async function (oTable: any, sPropertyInfoName: string, mPropertyBag: any) {
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
		internalBindingContext?.setProperty(COLUMN_HAS_BEEN_ADDED, true);
		this._setDraftIndicatorStatus(oModifier, oTable, aColumns, oColumnInfo);
		const sPath: string = await DelegateUtil.getCustomData(oTable, "metaPath", oModifier);
		const oTableContext: Context = oMetaModel.createBindingContext(sPath);
		// If view is not provided try to get it by accessing to the parental hierarchy
		// If it doesn't work (table into an unattached OP section) get the view via the AppComponent
		const view =
			mPropertyBag.view ||
			CommonUtils.getTargetView(oTable) ||
			(mPropertyBag.appComponent ? CommonUtils.getCurrentPageView(mPropertyBag.appComponent) : undefined);
		// render custom column
		if (oColumnInfo.type === "Default") {
			return this._templateCustomColumnFragment(oColumnInfo, view, oModifier, sTableId, oTableContext);
		}

		if (oColumnInfo.type === "Slot") {
			return this._templateSlotColumnFragment(oColumnInfo as CustomElement<CustomBasedTableColumn>, view, oModifier, sTableId);
		}

		if (oColumnInfo.type === "Computed") {
			return this._templateComputedColumnFragment(oColumnInfo, view, oModifier, sTableId, oTableContext);
		}

		// fall-back
		if (!oMetaModel) {
			return Promise.resolve(null);
		}

		const sEntityTypePath: string = await DelegateUtil.getCustomData(oTable, "entityType", oModifier);
		const sRetrievedGroupId = await DelegateUtil.getCustomData(oTable, "requestGroupId", oModifier);
		const sGroupId: string = this._getGroupId(sRetrievedGroupId);

		const aFetchedProperties = await this._getCachedOrFetchPropertiesForEntity(
			oTable,
			sEntityTypePath,
			oMetaModel,
			mPropertyBag.appComponent
		);
		const oPropertyInfo = aFetchedProperties.find(function (oInfo: any) {
			return oInfo.name === sPropertyInfoName;
		});

		const oPropertyContext: Context = oMetaModel.createBindingContext(oPropertyInfo.metadataPath);
		const aVHProperties = this._getVHRelevantFields(oMetaModel, oPropertyInfo.metadataPath, sPath);
		const oParameters = {
			sBindingPath: sPath,
			sValueHelpType: "TableValueHelp",
			oControl: oTable,
			oMetaModel,
			oModifier,
			oPropertyInfo
		};

		const fnTemplateValueHelp = async (sFragmentName: any) => {
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
			} catch (oError: any) {
				//We always resolve the promise to ensure that the app does not crash
				Log.error(`ValueHelp not loaded : ${oError.message}`);
				return null;
			} finally {
				oThis.destroy();
			}
		};

		const fnTemplateFragment = (oInPropertyInfo: any, oView: any) => {
			const sFragmentName = "sap.fe.macros.table.Column";

			let bDisplayMode;
			let sTableTypeCustomData;
			let sOnChangeCustomData;
			let sCreationModeCustomData;

			return Promise.all([
				DelegateUtil.getCustomData(oTable, "displayModePropertyBinding", oModifier),
				DelegateUtil.getCustomData(oTable, "tableType", oModifier),
				DelegateUtil.getCustomData(oTable, "onChange", oModifier),
				DelegateUtil.getCustomData(oTable, "creationMode", oModifier)
			]).then((aCustomData: any[]) => {
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
						enableAutoColumnWidth: (oTable.getParent() as TableAPI).enableAutoColumnWidth,
						isOptimizedForSmallDevice: (oTable.getParent() as TableAPI).isOptimizedForSmallDevice,
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
						creationMode: { name: sCreationModeCustomData },
						widthIncludingColumnHeader: (oTable.getParent() as TableAPI).widthIncludingColumnHeader
					} as tableDelegateModel),
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

				return DelegateUtil.templateControlFragment(sFragmentName, oPreprocessorSettings, { view: oView }, oModifier).finally(
					function () {
						oThis.destroy();
					}
				);
			});
		};

		await Promise.all(
			aVHProperties.map(async (sPropertyName: any) => {
				const mParameters = Object.assign({}, oParameters, { sPropertyName: sPropertyName });

				const aResults = await Promise.all([
					DelegateUtil.isValueHelpRequired(mParameters),
					DelegateUtil.doesValueHelpExist(mParameters)
				]);

				const bValueHelpRequired = aResults[0],
					bValueHelpExists = aResults[1];
				return this._fnTemplateValueHelp(fnTemplateValueHelp, bValueHelpRequired, bValueHelpExists);
			})
		);
		return fnTemplateFragment(oPropertyInfo, view);
	},

	/**
	 * Provide the Table's filter delegate to provide basic filter functionality such as adding FilterFields.
	 *
	 * @returns Object for the Tables filter personalization.
	 */
	getFilterDelegate: function () {
		return Object.assign(
			{
				apiVersion: 2
			},
			FilterBarDelegate,
			{
				addItem: function (oParentControl: Control, sPropertyInfoName: string) {
					if (sPropertyInfoName.indexOf("Property::") === 0) {
						// Correct the name of complex property info references.
						sPropertyInfoName = sPropertyInfoName.replace("Property::", "");
					}
					return FilterBarDelegate.addItem(oParentControl, sPropertyInfoName);
				}
			}
		);
	},

	/**
	 * Returns the TypeMap attached to this delegate.
	 *
	 * @returns Any instance of TypeMap
	 */
	getTypeMap: function (/*oPayload: object*/) {
		return TypeMap;
	},

	formatGroupHeader(oTable: any, oContext: any, sProperty: any) {
		const mFormatInfos = DelegateUtil.getCachedProperties(oTable),
			oFormatInfo =
				mFormatInfos &&
				mFormatInfos.filter((obj: any) => {
					return obj.name === sProperty;
				})[0],
			/*For a Date or DateTime property, the value is returned in external format using a UI5 type for the
	        given property path that formats corresponding to the property's EDM type and constraints*/
			bExternalFormat = oFormatInfo?.typeConfig?.baseType === "DateTime" || oFormatInfo?.typeConfig?.baseType === "Date";
		let sValue;
		if (oFormatInfo && oFormatInfo.mode) {
			switch (oFormatInfo.mode) {
				case "Description":
					sValue = oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat);
					break;

				case "DescriptionValue":
					sValue = ValueFormatter.formatWithBrackets(
						oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat),
						oContext.getProperty(oFormatInfo.valueProperty, bExternalFormat)
					);
					break;

				case "ValueDescription":
					sValue = ValueFormatter.formatWithBrackets(
						oContext.getProperty(oFormatInfo.valueProperty, bExternalFormat),
						oContext.getProperty(oFormatInfo.descriptionProperty, bExternalFormat)
					);
					break;
				default:
					break;
			}
		} else {
			sValue = oContext.getProperty(oFormatInfo?.path, bExternalFormat);
		}
		return getResourceModel(oTable).getText("M_TABLE_GROUP_HEADER_TITLE", [oFormatInfo?.label, sValue]);
	}
});
