/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/ina/AbstractContextMenuHandler", "sap/ui/model/FilterOperator"], function ($AbstractContextMenuHandler, FilterOperator) {
  "use strict";

  var _exports = {};
  var AbstractContextMenuHandler = $AbstractContextMenuHandler.AbstractContextMenuHandler;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Manages the creation and handling of the context menu item for filtering members ("Filter Member") of the MultiDimensionalGrid
   */
  let FilteringContextMenuHandler = /*#__PURE__*/function (_AbstractContextMenuH) {
    _inheritsLoose(FilteringContextMenuHandler, _AbstractContextMenuH);
    function FilteringContextMenuHandler(filterBar, dataProvider, dimensionalMapping) {
      var _this;
      _this = _AbstractContextMenuH.call(this, dataProvider, dimensionalMapping) || this;
      _this.filterBar = filterBar;
      return _this;
    }
    _exports = FilteringContextMenuHandler;
    var _proto = FilteringContextMenuHandler.prototype;
    _proto.isActionVisible = async function isActionVisible(context) {
      var _context$dimensionMap;
      return Promise.resolve(!!((_context$dimensionMap = context.dimensionMapping) !== null && _context$dimensionMap !== void 0 && _context$dimensionMap.filterProperty));
    };
    _proto.isActionEnabled = async function isActionEnabled() {
      return Promise.resolve(true);
    }

    /**
     * Sets a filter for a member on the filter bar if the action is pressed.
     *
     * @param context
     * @returns A promise
     */;
    _proto.triggerAction = async function triggerAction(context) {
      const {
        cell,
        dimensionMapping
      } = context;
      if (!cell || !(dimensionMapping !== null && dimensionMapping !== void 0 && dimensionMapping.filterProperty)) {
        return;
      }
      await this.filterBar.setFilterValues(dimensionMapping.filterProperty, FilterOperator.EQ, cell.Member);
    };
    return FilteringContextMenuHandler;
  }(AbstractContextMenuHandler);
  _exports = FilteringContextMenuHandler;
  return _exports;
}, false);
