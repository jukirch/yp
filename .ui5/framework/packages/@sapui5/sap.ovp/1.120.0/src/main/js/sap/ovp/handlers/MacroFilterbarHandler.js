/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Gets macro filter bar configuration
         * @memberOf sap.ovp.handler.MacroFilterbarHandler
         * @param bVariantManagementSaved  :  Boolean flag to prevent custom filters being set if triggered by variant management save [TODO]
         * @param oMainController : Main controller instance
         * @returns {Promise}
         * @private
         */
        getFilterBarConfiguration: function (bVariantManagementSaved, oMainController) {
            var oMacroFilterBar = oMainController.getMacroFilterBar();
            return oMacroFilterBar.getSelectionVariant().then(function (oSelVariant) {
                return {
                    selectionVariant: oSelVariant.toJSONString()
                };
            });
        }
    };
});
