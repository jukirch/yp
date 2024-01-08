/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/handlers/SmartFilterbarHandler",
    "sap/ovp/handlers/MacroFilterbarHandler"
], function (
    SmartFilterbarHandler,
    MacroFilterbarHandler
)  {
    "use strict";

    return {
        
        /**
         * Create an app state key using app state data and update url with iAppstate
         * @memberOf sap.ovp.handler.IAppStateHandler
         * @param oEvent : Event object if the function was triggered by dialog close
         * @param bVariantManagementSaved    :  Boolean flag to prevent custom filters being set if triggered by variant management save
         * @param oMainController : Main controller instance
         * @returns {Promise}
         * @private
         */
        getCurrentAppStatePromise: function (bVariantManagementSaved, oMainController) {
            // Initially this.oAppStatePromise is not set, it is set only when a new promise is created
            // on global filter search, however, as soon as the promise is resolved/rejected, this.oAppStatePromise is nullified
            // So, if this.oAppStatePromise exists means that the previous promise is still pending
            // In such case, reject the previous promise as we will create a new one for new global filter search

            var oNavigationHandler = oMainController.oNavigationHandler;
            if (this.oAppStatePromise) {
                //Parameter "skip" to denote that rejection as part of process and not because of actual error
                this.rejectPreviousPromise && this.rejectPreviousPromise("skip");
            }

            this.oAppStatePromise = new Promise(function (resolve, reject) {
                var oFilterbarHandler = oMainController.getMacroFilterBar() ? MacroFilterbarHandler : SmartFilterbarHandler;
                this.rejectPreviousPromise = reject;

                return oFilterbarHandler.getFilterBarConfiguration(bVariantManagementSaved, oMainController)
                    .then(function (oAppInnerData) {
                        return oNavigationHandler.storeInnerAppStateAsync(oAppInnerData, true).done(function (sAppStateKey) {
                                resolve(sAppStateKey);
                            }).fail(function(sError) {
                                reject(sError.getErrorCode());
                            });
                    });
            }.bind(this));
            return this.oAppStatePromise;
        }
    };
});
