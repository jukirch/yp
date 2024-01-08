/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/fe/navigation/SelectionVariant",
    "sap/base/util/isEmptyObject"
], function (
    SelectionVariant,
    isEmptyObject
) {
    "use strict";


    var dataPropertyNameCustom = "sap.ovp.app.customData",
    dataPropertyNameExtension = "sap.ovp.app.extensionData";

    return {

        /**
         * Gets smart filter bar configuration
         * @memberOf sap.ovp.handler.SmartFilterbarHandler
         * @param bVariantManagementSaved  :  Boolean flag to prevent custom filters being set if triggered by variant management save
         * @param oMainController : Main controller instance
         * @returns {Promise}
         * @private
         */
        getFilterBarConfiguration: function (bVariantManagementSaved, oMainController) {
            var oGlobalFilter = oMainController.getGlobalFilter();
            // If there is no global filter, no appstate will be present
            if (!oGlobalFilter) {
                return;
            }
            // To store the custom data in iAppstate
            var oCustomSelectionVariantData = {};
            var oCustomData = oMainController._getCustomAppState();
            var oCombinedCustomData = {
                _CUSTOM: oCustomData[dataPropertyNameCustom],
                _EXTENSION: oCustomData[dataPropertyNameExtension]
            };
            if (!bVariantManagementSaved) {
                //Get data from custom filters
                if (oCombinedCustomData._CUSTOM) {
                    oMainController._CustomFilterField(oCombinedCustomData._CUSTOM, oCustomSelectionVariantData);
                }
                //Get data from extension filters
                if (oCombinedCustomData._EXTENSION) {
                    var oNameSpace = Object.keys(oCombinedCustomData._EXTENSION);
                    if (oNameSpace) {
                        oMainController._CustomFilterField(oCombinedCustomData._EXTENSION[oNameSpace], oCustomSelectionVariantData);
                    }
                }
                //Setting custom and extension filter field values in the smartFilterBar as selection variant using "_Custom" parameter
                if (!isEmptyObject(oCustomSelectionVariantData)) {
                    var oOldCustomData = oGlobalFilter.getFilterData(); //refer BCP-1980313330
                    oOldCustomData._CUSTOM = oCustomSelectionVariantData;
                    oGlobalFilter.setFilterData(oOldCustomData, true);
                }
            }
            var oUiState = oGlobalFilter.getUiState({
                allFilters: false
            });
            var oSelectionVariant = oUiState && oUiState.getSelectionVariant();
            //Do not store dirty variants, reset them
            if (oGlobalFilter.getSmartVariant().currentVariantGetModified()) {
                oSelectionVariant.SelectionVariantID = "";
            }
            var sSelectionVariant = oSelectionVariant && JSON.stringify(oSelectionVariant);
            //Get data from standard filters
            var oNavigableSelectionVariant = new SelectionVariant(sSelectionVariant);

            return Promise.resolve(
                {
                    selectionVariant: oNavigableSelectionVariant.toJSONString(),
                    semanticDates: oUiState.getSemanticDates(),
                    customData: oCombinedCustomData
                }
            );
        },

        /**
         * Gets the entity type associated with smart filter bar
         * @memberOf sap.ovp.handler.SmartFilterbarHandler
         * @param oGlobalFilter The Global Filter
         * @returns {String} Returns the entity Type associated with smart filter bar
         * @private
         */
        getEntityType: function(oGlobalFilter) {
            if (oGlobalFilter) {
                var oUIModel = oGlobalFilter.getModel("ui");
                return oUIModel && oUIModel.getProperty("/globalFilterEntityType");
            }
        }
    };
});
