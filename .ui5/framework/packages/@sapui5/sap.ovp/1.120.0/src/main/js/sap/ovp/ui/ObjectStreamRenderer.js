/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ovp/app/resources"], function (OvpResources) {
    "use strict";

    /**
     * Object Stream renderer.
     */

    var ObjectStreamRenderer = {
        apiVersion: 2 // enable semantic rendering
    };

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render-Output-Buffer
     * @param {sap.ui.core.Control} oControl the control to be rendered
     */
    ObjectStreamRenderer.render = function (oRm, oControl) {
        if (!oControl.getVisible()) {
            return;
        }

        oRm.openStart("div", oControl);
        oRm.accessibilityState(undefined, { role: "dialog" });
        oRm.accessibilityState(oControl, { label: oControl.getTitle() });
        oRm.class("sapOvpObjectStream");
        oRm.openEnd();

        /* header rendering start */
        oRm.openStart("div");
        oRm.openEnd();
        var oTitle = oControl.getTitle();
        if (oTitle) {
            oRm.renderControl(oTitle);
        }
        oRm.close("div");

        oRm.openStart("div");
        oRm.attr("tabindex", 0);
        oRm.class("sapOvpObjectStreamClose");
        oRm.accessibilityState(undefined, { role: "button" });
        oRm.accessibilityState(oControl, { label: "close" });
        oRm.openEnd();
        oRm.renderControl(oControl._closeButton);
        oRm.close("div");
        /* header rendering end */

        oRm.openStart("div", oControl.getId() + "-cont");
        oRm.class("sapOvpObjectStreamCont");
        oRm.openEnd();

        oRm.openStart("div", oControl.getId() + "-scroll");
        oRm.accessibilityState(undefined, { role: "list" });
        oRm.class("sapOvpObjectStreamScroll");
        oRm.openEnd();

        var aContent = oControl.getContent();
        var placeHolder = oControl.getPlaceHolder();

        aContent.forEach(function (control, i) {
            oRm.openStart("div");
            oRm.class("sapOvpObjectStreamItem");
            oRm.attr("tabindex", i == 0 ? 0 : -1);
            oRm.accessibilityState(undefined, { role: "listitem" });
            oRm.attr("aria-label", " ");
            oRm.attr("aria-setsize", placeHolder ? aContent.length + 1 : aContent.length);
            oRm.attr("aria-posinset", i + 1);
            oRm.openEnd();
            oRm.renderControl(control);
            oRm.close("div");
        });

        if (placeHolder) {
            oRm.openStart("div");
            oRm.class("sapOvpObjectStreamItem");
            oRm.attr("tabindex", !aContent.length ? 0 : -1);
            oRm.accessibilityState(undefined, { role: "listitem" });

            oRm.attr("aria-setsize", aContent.length + 1);
            oRm.attr("aria-posinset", aContent.length + 1);
            oRm.openEnd();
            oRm.renderControl(placeHolder);
            oRm.close("div");
        }

        oRm.close("div"); // scroll

        oRm.openStart("div", oControl.getId() + "-leftedge");
        oRm.class("sapOvpOSEdgeLeft");
        oRm.openEnd();
        oRm.icon("sap-icon://slim-arrow-left", [],{ "title": OvpResources.getText("PREVIOUS") });
        oRm.close("div");

        oRm.openStart("div", oControl.getId() + "-rightedge");
        oRm.class("sapOvpOSEdgeRight");
        oRm.openEnd();
        oRm.icon("sap-icon://slim-arrow-right", [], { "title": OvpResources.getText("NEXT") });
        oRm.close("div");

        oRm.close("div"); // cont
        oRm.close("div"); // root
    };

    ObjectStreamRenderer.renderFooterContent = function (oRm, oControl) {
        // overrides this function
    };

    return ObjectStreamRenderer;
}, /* bExport= */ true);
