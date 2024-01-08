/*!
 * Copyright (c) 2009-2023 SAP SE, All Rights Reserved
 */

sap.ui.define([
    "sap/ushell/resources"
], function (
    ushellResources
) {
    "use strict";

    /**
     * * AppContainer renderer.
     * * @namespace
     * */
    var AppContainerRenderer = {
        apiVersion: 2
    };

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     */
    AppContainerRenderer.render = function (oRenderManager, oControl) {
        if (!oControl.getVisible()) {
            return;
        }

        oRenderManager.openStart("main", oControl);
        oRenderManager.attr("role", "main");
        oRenderManager.attr("aria-label", ushellResources.i18n.getText("ShellContent.AriaLabel"));
        oRenderManager.openEnd();

        oControl.getPages().forEach(function (oPage) {
            oRenderManager.renderControl(oPage);
        });

        oRenderManager.close("main");
    };

    return AppContainerRenderer;
}, /* bExport= */ true);
