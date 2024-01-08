// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(function () {
    "use strict";

    /**
     * @class WorkPageRow renderer.
     * @static
     *
     * @private
     */
    var WorkPageRowRenderer = {
        apiVersion: 2,
        /**
         * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
         *
         * @param {sap.ui.core.RenderManager} rm the RenderManager that can be used for writing to the render output buffer
         * @param {sap.ushell.components.workPageBuilder.controls.WorkPageRow} workPageRow an object representation of the control that should be rendered
         */
        render: function (rm, workPageRow) {
            // Return immediately if control is invisible
            if (!workPageRow.getVisible()) {
                return;
            }
            var iIndex = workPageRow.getIndex();
            var aColumns = workPageRow.getColumns();
            var iMaxColumns = workPageRow.getCappedColumnCount();

            rm.openStart("div", workPageRow);
            rm.attr("role", "group");

            var oRowTitle = workPageRow.getTitle();
            if (oRowTitle && oRowTitle.getText()) {
                rm.attr("aria-label", oRowTitle.getText());
            }

            rm.class("workPageRow");

            if (iIndex === 0) {
                rm.class("workPageRowFirst");
            }

            rm.openEnd(); // div - tag

            rm.openStart("div");
            rm.class("workPageRowLimiter");
            rm.openEnd(); // div - tag

            if (workPageRow.getEditMode()) {
                var aControlButtons = workPageRow.getControlButtons();

                if (aControlButtons.length > 0) {
                    rm.openStart("div");
                    rm.class("workPageRowControlButtons");
                    rm.openEnd(); // div - tag

                    for (var j = 0; j < aControlButtons.length; j++) {
                        rm.renderControl(aControlButtons[j]);
                    }

                    rm.close("div");
                }
            }

            if (workPageRow.getEditMode()) {
                rm.renderControl(workPageRow.getHeaderBar());
            } else {
                rm.renderControl(oRowTitle);
            }

            if (workPageRow.getMessageStrip()) {
                rm.renderControl(workPageRow.getMessageStrip());
            }

            rm.openStart("div");
            rm.class("workPageRowInner");
            rm.attr("data-wp-grid-layout", workPageRow.getGridLayoutString());
            rm.attr("data-wp-col-min-flex", workPageRow.getColumnMinFlex());
            rm.attr("data-wp-cols", iMaxColumns);
            rm.openEnd(); // div - tag

            for (var i = 0; i < iMaxColumns; i++) {
                rm.renderControl(aColumns[i]);
            }
            if (workPageRow.getEditMode()) {
                rm.renderControl(workPageRow.getAddButton("top"));
                rm.renderControl(workPageRow.getAddButton("bottom"));
            }
            rm.close("div");
            rm.close("div");
            rm.close("div");
        }
    };

    return WorkPageRowRenderer;
}, /* bExport= */ true);
