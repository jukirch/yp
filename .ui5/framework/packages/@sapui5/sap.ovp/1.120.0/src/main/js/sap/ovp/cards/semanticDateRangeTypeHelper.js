/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * Any function that needs to be exported(used outside this file) via namespace should be defined as
 * a function and then added to the return statement at the end of this file
 */
sap.ui.define([], function () {
	"use strict";

	/**
	 * Sets default operation for the semantic date field once the smartfilterbar is initialized
	 * @param {Object} oPageSettings - OVP page settings from manifest
	 * @param {Object} oFilterBar - SmartFilter bar of OVP
	 * @param {Object} oSemanticDates - SemanticDates in AppState
	 * @param {Object} oURLParameters URL parameters of the application
	 */
	function fnSetSemanticDateRangeDefaultValue(oPageSettings, oFilterBar, oSemanticDates, oURLParameters) {
		if (oPageSettings.filterSettings &&
			oPageSettings.filterSettings.dateSettings &&
			oPageSettings.filterSettings.dateSettings.fields) {
			var oDateFields = oPageSettings.filterSettings.dateSettings.fields;
			Object.entries(oDateFields).forEach(function (oDate) {
				var nSemanticDateIndex = -1;
				if (oSemanticDates && oSemanticDates.Dates) {
					nSemanticDateIndex = oSemanticDates.Dates.findIndex(function (oSemanticDate) {
						return oSemanticDate.PropertyName === oDate[0];
					});
				}
				if ((nSemanticDateIndex === -1 || Object.keys(oURLParameters).indexOf(oDate[0]) === -1) && oDate[1].defaultValue) {
					oFilterBar.getConditionTypeByKey(oDate[0]) && oFilterBar.getConditionTypeByKey(oDate[0]).setOperation(oDate[1].defaultValue.operation);
				}
			});
		}
	}

	//The returned attributes can be used outside this file using namespace sap.ovp.cards.SemanticDateRangeTypeHelper
	return {
		setSemanticDateRangeDefaultValue: fnSetSemanticDateRangeDefaultValue
	};
}, /* bExport= */true);
