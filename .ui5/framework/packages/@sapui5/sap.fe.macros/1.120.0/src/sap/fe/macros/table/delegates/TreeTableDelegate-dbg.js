/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/macros/table/delegates/TableDelegate"], function (CommonUtils, TableDelegate) {
  "use strict";

  /**
   * Helper class for sap.ui.mdc.Table.
   * <h3><b>Note:</b></h3>
   * This class is experimental and not intended for productive usage, since the API/behavior has not been finalized.
   *
   * @author SAP SE
   * @private
   * @experimental
   * @since 1.69.0
   * @alias sap.fe.macros.TableDelegate
   */
  const TreeTableDelegate = Object.assign({}, TableDelegate, {
    apiVersion: 2,
    _internalUpdateBindingInfo: function (table, bindingInfo) {
      var _bindingInfo$paramete;
      TableDelegate._internalUpdateBindingInfo.apply(this, [table, bindingInfo]);
      const payload = table.getPayload();
      bindingInfo.parameters.$$aggregation = {
        ...bindingInfo.parameters.$$aggregation,
        ...{
          hierarchyQualifier: payload === null || payload === void 0 ? void 0 : payload.hierarchyQualifier
        },
        // Setting the expandTo parameter to a high value forces the treeTable to expand all nodes when the search is applied
        ...{
          expandTo: (_bindingInfo$paramete = bindingInfo.parameters.$$aggregation) !== null && _bindingInfo$paramete !== void 0 && _bindingInfo$paramete.search ? 100 : payload === null || payload === void 0 ? void 0 : payload.initialExpansionLevel
        }
      };
    },
    updateBindingInfoWithSearchQuery: function (bindingInfo, filterInfo, filter) {
      bindingInfo.filters = filter;
      if (filterInfo.search) {
        bindingInfo.parameters.$$aggregation = {
          ...bindingInfo.parameters.$$aggregation,
          ...{
            search: CommonUtils.normalizeSearchTerm(filterInfo.search)
          }
        };
      } else {
        var _bindingInfo$paramete2, _bindingInfo$paramete3;
        (_bindingInfo$paramete2 = bindingInfo.parameters) === null || _bindingInfo$paramete2 === void 0 ? true : (_bindingInfo$paramete3 = _bindingInfo$paramete2.$$aggregation) === null || _bindingInfo$paramete3 === void 0 ? true : delete _bindingInfo$paramete3.search;
      }
    }
  });
  return TreeTableDelegate;
}, false);
