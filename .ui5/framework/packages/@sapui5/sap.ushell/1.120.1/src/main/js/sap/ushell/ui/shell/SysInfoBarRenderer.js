//Copyright (c) 2009-2023 SAP SE, All Rights Reserved

// Provides default renderer for control sap.ushell.ui.shell.SysInfoBar
sap.ui.define([
    "sap/ushell/resources"
], function (
    resources
) {
    "use strict";

    /**
     * SysInfoBar renderer.
     * @namespace
     */
    var SysInfoBarRenderer = {
        apiVersion: 2
    };

    /**
     * Renders the HTML for the SysInfoBar, using the provided {@link sap.ui.core.RenderManager}.
     * @param {sap.ui.core.RenderManager} rm The RenderManager that can be used for writing to the Render-Output-Buffer.
     * @param {sap.ushell.ui.shell.SysInfoBar} sysInfoBar The SysInfoBar that should be rendered.
     */
    SysInfoBarRenderer.render = function (rm, sysInfoBar) {
        rm.openStart("div", sysInfoBar);
        rm.accessibilityState(sysInfoBar, {
            "role": "complementary",
            "label": resources.i18n.getText("SysInfoBarAriaLabel", [sysInfoBar._oText.getText(), sysInfoBar._oSubText.getText()])
        });
        rm.class("sapUshellSysInfoBar");
        if (!sysInfoBar._isMappedColor(sysInfoBar.getColor())) {
            rm.style("border", "1px solid " + sysInfoBar.getColor());
            rm.style("background-color", sysInfoBar.getColor());
        }
        rm.openEnd(); // div - tag
        rm.renderControl(sysInfoBar.getAggregation("_bar"));
        rm.close("div");
    };

    return SysInfoBarRenderer;
}, /* bExport= */true);
