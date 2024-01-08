import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import { compileExpression, pathInModel } from "sap/fe/core/helpers/BindingToolkit";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type PageController from "sap/fe/core/PageController";
import DelegateUtil from "sap/fe/macros/DelegateUtil";
import FieldRuntime from "sap/fe/macros/field/FieldRuntime";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type SegmentedButton from "sap/m/SegmentedButton";
import type Select from "sap/m/Select";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import type MDCChart from "sap/ui/mdc/Chart";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

export type InternalBindingInfo = {
	parameters?: Record<string, string>;
	filters: Filter[];
	search: (string | null) | undefined;
	bindingPath: string | undefined;
};

function getHiddenFilters(oTable: Control) {
	let aFilters: any[] = [];
	const hiddenFilters = oTable.data("hiddenFilters");
	if (hiddenFilters && Array.isArray(hiddenFilters.paths)) {
		hiddenFilters.paths.forEach(function (mPath: any) {
			const oSvFilter = CommonUtils.getFiltersInfoForSV(oTable, mPath.annotationPath);
			aFilters = aFilters.concat(oSvFilter.filters);
		});
	}
	return aFilters;
}

/**
 * Retrieves the external filters configured on the table.
 *
 * @param table The table
 * @returns  The filters
 */
function getExternalFilters(table: Table) {
	let filters: Filter[] = getHiddenFilters(table);
	const quickFilter = table.getQuickFilter() as SegmentedButton | Select | undefined;
	if (quickFilter) {
		const quickFilterKey = quickFilter.getSelectedKey() || quickFilter.getItems()[0].getKey();
		filters = filters.concat(CommonUtils.getFiltersInfoForSV(table, quickFilterKey).filters);
	}
	return filters;
}
function getListBindingForCount(oTable: Table, oPageBinding: any, oParams: any) {
	let countBinding!: any;
	const oBindingInfo = oTable.data("rowsBindingInfo"),
		oDataModel = oTable.getModel() as ODataModel;
	const sBatchId = oParams.batchGroupId || "",
		oFilterInfo = getFilterInfo(oTable);
	let aFilters = Array.isArray(oParams.additionalFilters) ? oParams.additionalFilters : [];
	const sBindingPath = oFilterInfo.bindingPath ? oFilterInfo.bindingPath : oBindingInfo.path;

	aFilters = aFilters.concat(oFilterInfo.filters).concat(getP13nFilters(oTable));
	const oTableContextFilter = new Filter({
		filters: aFilters,
		and: true
	});

	// Need to pass by a temporary ListBinding in order to get $filter query option (as string) thanks to fetchFilter of OdataListBinding
	const oListBinding = oDataModel.bindList(
		(oPageBinding ? `${oPageBinding.getPath()}/` : "") + sBindingPath,
		oTable.getBindingContext() as Context,
		[],
		oTableContextFilter
	);

	return (oListBinding as any)
		.fetchFilter(oListBinding.getContext())
		.then(function (aStringFilters: string[]) {
			countBinding = oDataModel.bindProperty(`${oListBinding.getPath()}/$count`, oListBinding.getContext(), {
				$$groupId: sBatchId || "$auto",
				$filter: aStringFilters[0],
				$search: oFilterInfo.search as string | undefined
			});
			return countBinding.requestValue();
		})
		.then(function (iValue: any) {
			countBinding.destroy();
			oListBinding.destroy();
			return iValue;
		});
}
function getCountFormatted(iCount: any) {
	const oCountFormatter = NumberFormat.getIntegerInstance({ groupingEnabled: true });
	return oCountFormatter.format(iCount);
}
function getFilterInfo(oTable: Table, ignoreProperties?: string[]): InternalBindingInfo {
	const oTableDefinition = (oTable.getParent() as TableAPI).getTableDefinition();
	let aIgnoreProperties: string[] = ignoreProperties || [];

	function _getRelativePathArrayFromAggregates(oSubTable: Table) {
		const mAggregates = (oSubTable.getParent() as TableAPI).getTableDefinition().aggregates as any;
		return Object.keys(mAggregates).map(function (sAggregateName) {
			return mAggregates[sAggregateName].relativePath;
		});
	}

	if (oTableDefinition.enableAnalytics) {
		aIgnoreProperties = aIgnoreProperties.concat(_getRelativePathArrayFromAggregates(oTable));

		if (!oTableDefinition.enableBasicSearch) {
			// Search isn't allow as a $apply transformation for this table
			aIgnoreProperties = aIgnoreProperties.concat(["search"]);
		}
	}
	return FilterUtils.getFilterInfo(oTable.getFilter(), {
		ignoredProperties: aIgnoreProperties,
		targetControl: oTable
	});
}

/**
 * Retrieves all filters configured in the personalization dialog of the table or chart.
 *
 * @param oControl Table or Chart instance
 * @returns Filters configured in the personalization dialog of the table or chart
 * @private
 * @ui5-restricted
 */
function getP13nFilters(oControl: Table | MDCChart) {
	const aP13nMode = oControl.getP13nMode();
	if (aP13nMode && aP13nMode.includes("Filter")) {
		const aP13nProperties = (DelegateUtil.getCustomData(oControl, "sap_fe_ControlDelegate_propertyInfoMap") || []).filter(
				function (oControlProperty: { filterable: boolean }) {
					return oControlProperty && !(oControlProperty.filterable === false);
				}
			),
			oFilterInfo = FilterUtils.getFilterInfo(oControl, { propertiesMetadata: aP13nProperties });
		if (oFilterInfo && oFilterInfo.filters) {
			return oFilterInfo.filters;
		}
	}
	return [];
}

function getAllFilterInfo(oTable: Table, ignoreProperties?: string[]): InternalBindingInfo {
	const oIFilterInfo = tableUtils.getFilterInfo(oTable, ignoreProperties);
	return {
		filters: oIFilterInfo.filters.concat(getExternalFilters(oTable), tableUtils.getP13nFilters(oTable)),
		search: oIFilterInfo.search,
		bindingPath: oIFilterInfo.bindingPath
	};
}

/**
 * Returns a promise that is resolved with the table itself when the table was bound.
 *
 * @param oTable The table to check for binding
 * @returns A Promise that will be resolved when table is bound
 */
function whenBound(oTable: Table) {
	return _getOrCreateBoundPromiseInfo(oTable).promise;
}

/**
 * If not yet happened, it resolves the table bound promise.
 *
 * @param oTable The table that was bound
 */
function onTableBound(oTable: Table) {
	const oBoundPromiseInfo = _getOrCreateBoundPromiseInfo(oTable);
	if (oBoundPromiseInfo.resolve) {
		oBoundPromiseInfo.resolve(oTable);
		oTable.data("boundPromiseResolve", null);
	}
}

function _getOrCreateBoundPromiseInfo(oTable: Table) {
	if (!oTable.data("boundPromise")) {
		let fnResolve: any;
		oTable.data(
			"boundPromise",
			new Promise(function (resolve) {
				fnResolve = resolve;
			})
		);
		if ((oTable as any).isBound()) {
			fnResolve(oTable);
		} else {
			oTable.data("boundPromiseResolve", fnResolve);
		}
	}
	return { promise: oTable.data("boundPromise"), resolve: oTable.data("boundPromiseResolve") };
}

function fnGetSemanticTargetsFromTable(oController: PageController, oTable: Table) {
	const oView = oController.getView();
	const oInternalModelContext = oView.getBindingContext("internal") as InternalModelContext;
	if (oInternalModelContext) {
		const sEntitySet = DelegateUtil.getCustomData(oTable, "targetCollectionPath");
		if (sEntitySet) {
			const oComponent = oController.getOwnerComponent();
			const oAppComponent = Component.getOwnerComponentFor(oComponent) as AppComponent;
			const oMetaModel = oAppComponent.getMetaModel();
			const oShellServiceHelper = oAppComponent.getShellServices();
			const sCurrentHash = FieldRuntime._fnFixHashQueryString(oShellServiceHelper.getHash());
			const oColumns = (oTable.getParent() as TableAPI).getTableDefinition().columns;
			const aSemanticObjectsForGetLinks = [];
			const aSemanticObjects: any[] = [];
			const aPathAlreadyProcessed: string[] = [];
			let sPath = "",
				sAnnotationPath,
				oProperty;
			let _oSemanticObject;
			const aSemanticObjectsPromises: Promise<any>[] = [];
			let sQualifier: string, regexResult;

			for (let i = 0; i < oColumns.length; i++) {
				sAnnotationPath = (oColumns[i] as any).annotationPath;
				//this check is required in cases where custom columns are configured via manifest where there is no provision for an annotation path.
				if (sAnnotationPath) {
					oProperty = oMetaModel.getObject(sAnnotationPath);
					if (oProperty && oProperty.$kind === "Property") {
						sPath = (oColumns[i] as any).annotationPath;
					} else if (oProperty && oProperty.$Type === "com.sap.vocabularies.UI.v1.DataField") {
						sPath = `${sEntitySet}/${oMetaModel.getObject(`${sAnnotationPath}/Value/$Path`)}`;
					}
				}
				if (sPath !== "") {
					const _Keys = Object.keys(oMetaModel.getObject(sPath + "@"));
					for (let index = 0; index < _Keys.length; index++) {
						if (
							!aPathAlreadyProcessed.includes(sPath) &&
							_Keys[index].indexOf(`@${CommonAnnotationTerms.SemanticObject}`) === 0 &&
							!_Keys[index].includes(`@${CommonAnnotationTerms.SemanticObjectMapping}`) &&
							!_Keys[index].includes(`@${CommonAnnotationTerms.SemanticObjectUnavailableActions}`)
						) {
							regexResult = /#(.*)/.exec(_Keys[index]);
							sQualifier = regexResult ? regexResult[1] : "";
							aSemanticObjectsPromises.push(
								CommonUtils.getSemanticObjectPromise(oAppComponent, oView, oMetaModel, sPath, sQualifier)
							);
							aPathAlreadyProcessed.push(sPath);
						}
					}
				}
				sPath = "";
			}

			if (aSemanticObjectsPromises.length === 0) {
				return Promise.resolve();
			} else {
				Promise.all(aSemanticObjectsPromises)
					.then(function (aValues: any[]) {
						const aGetLinksPromises = [];
						let sSemObjExpression;
						const aSemanticObjectsResolved = aValues.filter(function (element: any) {
							if (element.semanticObject && typeof element.semanticObject.semanticObject === "object") {
								sSemObjExpression = compileExpression(pathInModel(element.semanticObject.semanticObject.$Path));
								element.semanticObject.semanticObject = sSemObjExpression;
								element.semanticObjectForGetLinks[0].semanticObject = sSemObjExpression;
								return true;
							} else if (element) {
								return element.semanticObject !== undefined;
							} else {
								return false;
							}
						});
						for (let j = 0; j < aSemanticObjectsResolved.length; j++) {
							_oSemanticObject = aSemanticObjectsResolved[j];
							if (
								_oSemanticObject &&
								_oSemanticObject.semanticObject &&
								!(_oSemanticObject.semanticObject.semanticObject.indexOf("{") === 0)
							) {
								aSemanticObjectsForGetLinks.push(_oSemanticObject.semanticObjectForGetLinks);
								aSemanticObjects.push({
									semanticObject: _oSemanticObject.semanticObject && _oSemanticObject.semanticObject.semanticObject,
									unavailableActions: _oSemanticObject.unavailableActions,
									path: aSemanticObjectsResolved[j].semanticObjectPath
								});
								aGetLinksPromises.push(oShellServiceHelper.getLinksWithCache([_oSemanticObject.semanticObjectForGetLinks])); //aSemanticObjectsForGetLinks));
							}
						}
						return CommonUtils.updateSemanticTargets(aGetLinksPromises, aSemanticObjects, oInternalModelContext, sCurrentHash);
					})
					.catch(function (oError: any) {
						Log.error("fnGetSemanticTargetsFromTable: Cannot get Semantic Objects", oError);
					});
			}
		}
	}
}

const tableUtils = {
	getCountFormatted: getCountFormatted,
	getHiddenFilters: getHiddenFilters,
	getListBindingForCount: getListBindingForCount,
	getFilterInfo: getFilterInfo,
	getP13nFilters: getP13nFilters,
	getAllFilterInfo: getAllFilterInfo,
	whenBound: whenBound,
	onTableBound: onTableBound,
	getSemanticTargetsFromTable: fnGetSemanticTargetsFromTable
};

export default tableUtils;
