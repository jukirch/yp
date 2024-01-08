// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview Utility functions for RTA.
 */
sap.ui.define([
    "sap/ushell/Container"
], function (
    Container
) {
    "use strict";

    /**
     * @alias sap.ushell.api.RTA
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted sap.ui.fl, sap.ui.rta
     */
    const RtaUtils = {};

    /**
     * @returns {sap.ui.core.Control} The shellHeader
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted sap.ui.fl, sap.ui.rta
     */
    RtaUtils.getShellHeader = function () {
        const oRenderer = Container.getRendererInternal();
        return oRenderer.getRootControl().getShellHeader();
    };

    /**
     * @param {boolean} visible Whether the shell header should be visible in all states.
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted sap.ui.fl, sap.ui.rta
     */
    RtaUtils.setShellHeaderVisibility = function (visible) {
        const oRenderer = Container.getRendererInternal();
        oRenderer.setHeaderVisibility(visible, false);
    };

    return RtaUtils;

});
