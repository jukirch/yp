/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Abstract super class for context menu handlers registered to the DragonFly MultiDimensionalGrid.
   */
  let AbstractContextMenuHandler = /*#__PURE__*/function () {
    function AbstractContextMenuHandler(dataProvider, dimensionalMapping) {
      this.dataProvider = dataProvider;
      this.dimensionMapping = dimensionalMapping;
    }

    /**
     * Creates the context menu handler to be registered to DragonFly.
     *
     * @param actionDescription
     * @param actionDescription.Text
     * @param actionDescription.Icon
     * @returns The handler
     */
    _exports.AbstractContextMenuHandler = AbstractContextMenuHandler;
    var _proto = AbstractContextMenuHandler.prototype;
    _proto.create = function create(actionDescription) {
      return {
        isActionVisible: async (_key, context) => this.isActionVisible(this.findCell(context)),
        isActionEnabled: async (_key, context) => this.isActionEnabled(this.findCell(context)),
        getActionDescription: async (_key, _context) => Promise.resolve(actionDescription),
        triggerAction: async (_key, context) => this.triggerAction(this.findCell(context))
      };
    }

    /**
     * Determines whether the context menu item is visible
     * @param context
     */;
    /**
     * Finds and returns the cell data for a given context.
     *
     * @param context
     * @returns The cell and its dimension mapping
     */
    _proto.findCell = function findCell(context) {
      var _this$dataProvider, _this$dataProvider$Gr, _this$dataProvider$Gr2;
      if (context.Grid.SelectedCells.length !== 1) {
        return {
          cell: undefined,
          dimensionMapping: undefined
        };
      }
      const column = context.Grid.SelectedCells[0].columnIndex;
      const row = context.Grid.SelectedCells[0].rowIndex;
      const cell = (_this$dataProvider = this.dataProvider) === null || _this$dataProvider === void 0 ? void 0 : (_this$dataProvider$Gr = _this$dataProvider.Grid) === null || _this$dataProvider$Gr === void 0 ? void 0 : (_this$dataProvider$Gr2 = _this$dataProvider$Gr.Cells) === null || _this$dataProvider$Gr2 === void 0 ? void 0 : _this$dataProvider$Gr2.find(c => c.Row === row && c.Column === column);
      const dimensionMapping = cell !== null && cell !== void 0 && cell.Dimension ? this.dimensionMapping[cell.Dimension] : undefined;
      return {
        cell,
        dimensionMapping
      };
    };
    return AbstractContextMenuHandler;
  }();
  _exports.AbstractContextMenuHandler = AbstractContextMenuHandler;
  return _exports;
}, false);
