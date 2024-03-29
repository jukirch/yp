/*
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(function () {
    "use strict";
    /**
     * Enumeration of the propagation reason in the condition propagation callback of the {@link sap.ui.mdc.ValueHelp ValueHelp}
     *
     * @enum {string}
     * @private
     * @ui5-restricted sap.fe
     * @since 1.100.0
     * @alias sap.ui.mdc.enum.PropagationReason
     * @deprecated since 1.115.0 - please see {@link sap.ui.mdc.enums.ValueHelpPropagationReason}
     */
    const PropagationReason = {
        /**
         * Triggered by connected control after processing valuehelp output
         *
         * @private
         * @ui5-restricted sap.fe
         */
         ControlChange: "ControlChange",
        /**
         * Triggered by <code>ValueHelp</code> itself on selection
         *
         * @private
         * @ui5-restricted sap.fe
         */
         Select: "Select",
        /**
         * Triggered by <code>ValueHelp</code> itself on <code>getItemForValue</code>
         *
         * @private
         * @ui5-restricted sap.fe
         */
         Info: "Info"
    };

    return PropagationReason;
}, /* bExport= */ true);