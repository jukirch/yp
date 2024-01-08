// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/strings/formatMessage"
], function (
    formatMessage
) {
    "use strict";

    /**
     * @class WorkpageColumn renderer.
     * @static
     *
     * @private
     */
    var WorkPageColumnRenderer = {
        apiVersion: 2,

        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the render output buffer
         * @param {sap.ushell.components.workPageBuilder.controls.WorkPageColumn} workPageColumn an object representation of the control that should be rendered
         */
        render: function (rm, workPageColumn) {
            // Return immediately if control is invisible
            if (!workPageColumn.getVisible()) {
                return;
            }
            var iIndex = workPageColumn.getIndex();
            var iMaxColumns = workPageColumn.getMaxColumns();
            var iColumnCount = workPageColumn.getCappedColumnCount();
            var aCells = workPageColumn.getCells();
            var bIsEmpty = aCells.length === 0;

            rm.openStart("div", workPageColumn);

            if (workPageColumn.getAriaLabelPlaceholder()) {
                rm.attr("aria-label", formatMessage(workPageColumn.getAriaLabelPlaceholder(), [iIndex + 1, iColumnCount]));
            }

            if (iIndex === 0) {
                rm.class("workPageColumnFirst");
            }
            if (iIndex === iColumnCount - 1) {
                rm.class("workPageColumnLast");
            }
            if (bIsEmpty) {
                rm.class("workPageColumnEmpty");
            }
            rm.class("workPageColumn");
            rm.attr("data-index", (iIndex + 1));
            rm.attr("data-count", iColumnCount);

            rm.openEnd(); // div - tag

            if (bIsEmpty) {
                // Render one empty cell if the column is empty
                rm.openStart("div");

                rm.class("workPageCell");
                rm.class("workPageCellEmpty");
                rm.openEnd(); // div - tag
            } else {
                for (var i = 0; i < aCells.length; i++) {
                    rm.renderControl(aCells[i]);
                }
            }

            if (workPageColumn.getEditMode()) {
                if (iColumnCount > 1 && bIsEmpty) {
                    rm.renderControl(workPageColumn.getDeleteButton());
                }

                if (iIndex !== 0) {
                    rm.renderControl(workPageColumn.getResizer());
                }
                if (iColumnCount < iMaxColumns) {
                    rm.renderControl(workPageColumn.getAddButton("left"));
                }
                if (iIndex === iColumnCount - 1 && iColumnCount < iMaxColumns) {
                    rm.renderControl(workPageColumn.getAddButton("right"));
                }

                rm.openStart("div");
                rm.class("workPageColumnToolbar");
                rm.openEnd();

                rm.renderControl(workPageColumn.getAddWidgetButton());
                rm.close("div");
            }

            if (bIsEmpty) {
                rm.close("div");
            }

            rm.close("div");
        }
    };

    return WorkPageColumnRenderer;
}, /* bExport= */ true);
