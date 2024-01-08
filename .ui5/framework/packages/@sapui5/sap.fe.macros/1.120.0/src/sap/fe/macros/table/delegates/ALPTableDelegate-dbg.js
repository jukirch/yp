/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/fe/core/CommonUtils", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/DelegateUtil", "sap/fe/macros/table/delegates/TableDelegate", "sap/fe/macros/table/Utils", "sap/ui/model/Filter"], function (deepClone, CommonUtils, ChartUtils, DelegateUtil, TableDelegate, TableUtils, Filter) {
  "use strict";

  /**
   * Helper class for sap.ui.mdc.Table.
   * <h3><b>Note:</b></h3>
   * The class is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
   *
   * @author SAP SE
   * @private
   * @experimental
   * @since 1.69.0
   * @alias sap.fe.macros.ALPTableDelegate
   */
  const ALPTableDelegate = Object.assign({}, TableDelegate, {
    apiVersion: 2,
    _internalUpdateBindingInfo: function (table, bindingInfo) {
      var _getChartControl, _ref;
      let filterInfo;
      let chartFilterInfo = {},
        tableFilterInfo = {};
      let chartFilters;

      // We need to deepClone the info we get from the custom data, otherwise some of its subobjects (e.g. parameters) will
      // be shared with oBindingInfo and modified later (Object.assign only does a shallow clone)
      Object.assign(bindingInfo, deepClone(DelegateUtil.getCustomData(table, "rowsBindingInfo")));
      if (table.getRowBinding()) {
        bindingInfo.suspended = false;
      }
      const view = CommonUtils.getTargetView(table);
      const mdcChart = (_getChartControl = (_ref = view.getController()).getChartControl) === null || _getChartControl === void 0 ? void 0 : _getChartControl.call(_ref);
      const chartAPI = mdcChart === null || mdcChart === void 0 ? void 0 : mdcChart.getParent();
      const chartSelectionsExist = chartAPI === null || chartAPI === void 0 ? void 0 : chartAPI.hasSelections();
      tableFilterInfo = TableUtils.getAllFilterInfo(table);
      const tableFilters = tableFilterInfo && tableFilterInfo.filters;
      filterInfo = tableFilterInfo;
      if (chartSelectionsExist) {
        chartFilterInfo = ChartUtils.getAllFilterInfo(mdcChart);
        chartFilters = chartFilterInfo && chartFilterInfo.filters ? CommonUtils.getChartPropertiesWithoutPrefixes(chartFilterInfo.filters) : null;
        filterInfo = chartFilterInfo;
      }
      const finalFilters = (tableFilters && chartFilters ? tableFilters.concat(chartFilters) : chartFilters || tableFilters) || [];
      const oFilter = finalFilters.length > 0 && new Filter({
        filters: finalFilters,
        and: true
      });
      if (filterInfo.bindingPath) {
        // In case of parameters
        bindingInfo.path = filterInfo.bindingPath;
      }

      // Prepare binding info with filter/search parameters
      ALPTableDelegate.updateBindingInfoWithSearchQuery(bindingInfo, filterInfo, oFilter);
    },
    rebind: function (table, bindingInfo) {
      const internalModelContext = table.getBindingContext("pageInternal");
      const templateContentView = internalModelContext === null || internalModelContext === void 0 ? void 0 : internalModelContext.getProperty(`${internalModelContext.getPath()}/alpContentView`);
      if (templateContentView !== "Chart") {
        TableDelegate.rebind(table, bindingInfo);
      }
    }
  });
  return ALPTableDelegate;
}, false);
