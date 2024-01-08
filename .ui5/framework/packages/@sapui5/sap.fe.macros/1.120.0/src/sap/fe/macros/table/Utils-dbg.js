/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/BindingToolkit", "sap/fe/macros/DelegateUtil", "sap/fe/macros/field/FieldRuntime", "sap/fe/macros/filter/FilterUtils", "sap/ui/core/Component", "sap/ui/core/format/NumberFormat", "sap/ui/model/Filter"], function (Log, CommonUtils, BindingToolkit, DelegateUtil, FieldRuntime, FilterUtils, Component, NumberFormat, Filter) {
  "use strict";

  var pathInModel = BindingToolkit.pathInModel;
  var compileExpression = BindingToolkit.compileExpression;
  function getHiddenFilters(oTable) {
    let aFilters = [];
    const hiddenFilters = oTable.data("hiddenFilters");
    if (hiddenFilters && Array.isArray(hiddenFilters.paths)) {
      hiddenFilters.paths.forEach(function (mPath) {
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
  function getExternalFilters(table) {
    let filters = getHiddenFilters(table);
    const quickFilter = table.getQuickFilter();
    if (quickFilter) {
      const quickFilterKey = quickFilter.getSelectedKey() || quickFilter.getItems()[0].getKey();
      filters = filters.concat(CommonUtils.getFiltersInfoForSV(table, quickFilterKey).filters);
    }
    return filters;
  }
  function getListBindingForCount(oTable, oPageBinding, oParams) {
    let countBinding;
    const oBindingInfo = oTable.data("rowsBindingInfo"),
      oDataModel = oTable.getModel();
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
    const oListBinding = oDataModel.bindList((oPageBinding ? `${oPageBinding.getPath()}/` : "") + sBindingPath, oTable.getBindingContext(), [], oTableContextFilter);
    return oListBinding.fetchFilter(oListBinding.getContext()).then(function (aStringFilters) {
      countBinding = oDataModel.bindProperty(`${oListBinding.getPath()}/$count`, oListBinding.getContext(), {
        $$groupId: sBatchId || "$auto",
        $filter: aStringFilters[0],
        $search: oFilterInfo.search
      });
      return countBinding.requestValue();
    }).then(function (iValue) {
      countBinding.destroy();
      oListBinding.destroy();
      return iValue;
    });
  }
  function getCountFormatted(iCount) {
    const oCountFormatter = NumberFormat.getIntegerInstance({
      groupingEnabled: true
    });
    return oCountFormatter.format(iCount);
  }
  function getFilterInfo(oTable, ignoreProperties) {
    const oTableDefinition = oTable.getParent().getTableDefinition();
    let aIgnoreProperties = ignoreProperties || [];
    function _getRelativePathArrayFromAggregates(oSubTable) {
      const mAggregates = oSubTable.getParent().getTableDefinition().aggregates;
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
  function getP13nFilters(oControl) {
    const aP13nMode = oControl.getP13nMode();
    if (aP13nMode && aP13nMode.includes("Filter")) {
      const aP13nProperties = (DelegateUtil.getCustomData(oControl, "sap_fe_ControlDelegate_propertyInfoMap") || []).filter(function (oControlProperty) {
          return oControlProperty && !(oControlProperty.filterable === false);
        }),
        oFilterInfo = FilterUtils.getFilterInfo(oControl, {
          propertiesMetadata: aP13nProperties
        });
      if (oFilterInfo && oFilterInfo.filters) {
        return oFilterInfo.filters;
      }
    }
    return [];
  }
  function getAllFilterInfo(oTable, ignoreProperties) {
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
  function whenBound(oTable) {
    return _getOrCreateBoundPromiseInfo(oTable).promise;
  }

  /**
   * If not yet happened, it resolves the table bound promise.
   *
   * @param oTable The table that was bound
   */
  function onTableBound(oTable) {
    const oBoundPromiseInfo = _getOrCreateBoundPromiseInfo(oTable);
    if (oBoundPromiseInfo.resolve) {
      oBoundPromiseInfo.resolve(oTable);
      oTable.data("boundPromiseResolve", null);
    }
  }
  function _getOrCreateBoundPromiseInfo(oTable) {
    if (!oTable.data("boundPromise")) {
      let fnResolve;
      oTable.data("boundPromise", new Promise(function (resolve) {
        fnResolve = resolve;
      }));
      if (oTable.isBound()) {
        fnResolve(oTable);
      } else {
        oTable.data("boundPromiseResolve", fnResolve);
      }
    }
    return {
      promise: oTable.data("boundPromise"),
      resolve: oTable.data("boundPromiseResolve")
    };
  }
  function fnGetSemanticTargetsFromTable(oController, oTable) {
    const oView = oController.getView();
    const oInternalModelContext = oView.getBindingContext("internal");
    if (oInternalModelContext) {
      const sEntitySet = DelegateUtil.getCustomData(oTable, "targetCollectionPath");
      if (sEntitySet) {
        const oComponent = oController.getOwnerComponent();
        const oAppComponent = Component.getOwnerComponentFor(oComponent);
        const oMetaModel = oAppComponent.getMetaModel();
        const oShellServiceHelper = oAppComponent.getShellServices();
        const sCurrentHash = FieldRuntime._fnFixHashQueryString(oShellServiceHelper.getHash());
        const oColumns = oTable.getParent().getTableDefinition().columns;
        const aSemanticObjectsForGetLinks = [];
        const aSemanticObjects = [];
        const aPathAlreadyProcessed = [];
        let sPath = "",
          sAnnotationPath,
          oProperty;
        let _oSemanticObject;
        const aSemanticObjectsPromises = [];
        let sQualifier, regexResult;
        for (let i = 0; i < oColumns.length; i++) {
          sAnnotationPath = oColumns[i].annotationPath;
          //this check is required in cases where custom columns are configured via manifest where there is no provision for an annotation path.
          if (sAnnotationPath) {
            oProperty = oMetaModel.getObject(sAnnotationPath);
            if (oProperty && oProperty.$kind === "Property") {
              sPath = oColumns[i].annotationPath;
            } else if (oProperty && oProperty.$Type === "com.sap.vocabularies.UI.v1.DataField") {
              sPath = `${sEntitySet}/${oMetaModel.getObject(`${sAnnotationPath}/Value/$Path`)}`;
            }
          }
          if (sPath !== "") {
            const _Keys = Object.keys(oMetaModel.getObject(sPath + "@"));
            for (let index = 0; index < _Keys.length; index++) {
              if (!aPathAlreadyProcessed.includes(sPath) && _Keys[index].indexOf(`@${"com.sap.vocabularies.Common.v1.SemanticObject"}`) === 0 && !_Keys[index].includes(`@${"com.sap.vocabularies.Common.v1.SemanticObjectMapping"}`) && !_Keys[index].includes(`@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`)) {
                regexResult = /#(.*)/.exec(_Keys[index]);
                sQualifier = regexResult ? regexResult[1] : "";
                aSemanticObjectsPromises.push(CommonUtils.getSemanticObjectPromise(oAppComponent, oView, oMetaModel, sPath, sQualifier));
                aPathAlreadyProcessed.push(sPath);
              }
            }
          }
          sPath = "";
        }
        if (aSemanticObjectsPromises.length === 0) {
          return Promise.resolve();
        } else {
          Promise.all(aSemanticObjectsPromises).then(function (aValues) {
            const aGetLinksPromises = [];
            let sSemObjExpression;
            const aSemanticObjectsResolved = aValues.filter(function (element) {
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
              if (_oSemanticObject && _oSemanticObject.semanticObject && !(_oSemanticObject.semanticObject.semanticObject.indexOf("{") === 0)) {
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
          }).catch(function (oError) {
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
  return tableUtils;
}, false);
