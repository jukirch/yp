// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([], function () {
    "use strict";

    /**
     * @name WorkPage renderer.
     * @namespace
     */
    var PageRenderer = {
        apiVersion: 2
    };

    PageRenderer.render = function (rm, oWorkPage) {
        rm.openStart("div", oWorkPage);

        if (oWorkPage.getTitle() && oWorkPage.getTitle().getText()) {
            rm.attr("aria-label", oWorkPage.getTitle().getText());
        }

        rm.class("workPage");
        rm.class("sapContrastPlus");
        rm.attr("data-wp-breakpoint", oWorkPage.getBreakpoint());

        if (oWorkPage.getEditMode()) {
            rm.class("workPageEditMode");
        }
        if (oWorkPage.getShowTitle() && oWorkPage.getTitle() !== null && oWorkPage.getTitle().getText() !== "") {
            rm.class("workPageHasTitle");
        }

        rm.openEnd(); // div - tag

        if (oWorkPage.getShowTitle()) {
            rm.openStart("div");
            rm.class("workPageTitle");
            rm.openEnd(); // div - tag
            rm.renderControl(oWorkPage.getTitle());
            rm.close("div");
        }

        // render rows
        var aRows = oWorkPage.getRows();

        if (aRows.length <= 0 && oWorkPage.getLoaded()) {
            rm.renderControl(oWorkPage.getIllustratedMessage());
        } else {
            rm.openStart("div", oWorkPage.getId() + "-rows");
            rm.openEnd(); // div - tag

            for (var i = 0; i < aRows.length; i++) {
                rm.renderControl(aRows[i]);
            }
            rm.close("div");
        }
        rm.close("div");
    };

    return PageRenderer;
});
