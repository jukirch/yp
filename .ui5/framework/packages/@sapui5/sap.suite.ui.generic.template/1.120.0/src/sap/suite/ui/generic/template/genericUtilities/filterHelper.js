sap.ui.define([
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"sap/base/security/encodeURL",
	"sap/m/DynamicDateUtil",
	"sap/ui/core/CalendarType"
], function (FilterOperator, DateFormat, encodeURL, DynamicDateUtil, CalendarType) {
    "use strict";

	function getInfoForFilters(aFilters, getFilterInfoForPropertyFilters, bAnd){
		var mPropertyFilters = Object.create(null);
		var aInfosForFilters = [];
		aFilters.some(function(oFilter){
			if (!oFilter.sPath){
				var oInfo = oFilter.aFilters && getInfoForFilters(oFilter.aFilters, getFilterInfoForPropertyFilters, oFilter.bAnd);
				if (oInfo){
					aInfosForFilters.push(oInfo);
				} else if (!bAnd){
					aInfosForFilters = [];
					mPropertyFilters = Object.create(null);
					return true;
				}
				return false;
			}
			var aFiltersForProperty = mPropertyFilters[oFilter.sPath];
			if (aFiltersForProperty){
				aFiltersForProperty.push(oFilter);
			} else {
				mPropertyFilters[oFilter.sPath] = [oFilter];
			}
		});
		var sLogicalOperator = bAnd ? "and" : "or";
		for (var sProperty in mPropertyFilters){
			var aFiltersForProperty = mPropertyFilters[sProperty];
			aInfosForFilters.push(getFilterInfoForPropertyFilters(sProperty, aFiltersForProperty, aFiltersForProperty.length > 1 ? sLogicalOperator : ""));
		}
		if (aInfosForFilters.length === 0 ){
			return null;
		}		
		if (aInfosForFilters.length === 1){
			return aInfosForFilters[0];
		}
		var sRet = aInfosForFilters.map(function(oInfo){
			var bNeedsBracket = oInfo.logicalOperator && oInfo.logicalOperator !== sLogicalOperator;
			return bNeedsBracket ? ("(" + oInfo.stringRep + ")") : oInfo.stringRep;
		}).join("%20" + sLogicalOperator + "%20");
		return {
			stringRep: sRet,
			logicalOperator: sLogicalOperator
		};
	}

	// This function creates a string representation of an array of filters (instances of sap.ui.model.Filter).
	// The filters within the array are assumed to be combined by the logical operator AND.
	// The function relies on callback getFilterInfoForPropertyFilters(sProperty, aFiltersForProperty, sLogicalOperator).
	// This function should build the filter sting for atomic filters.
	// The interface of this function should be as follows:
	// sProperty defines the common property all atomic filters to be handled refer to
	// aFiltersForProperty is an array of atomic filters all referring to that property
	// sLogicalOperator is the logical operator ('and' or 'or') these filters should be combined with. 
	// If aFiltersForProperty contains only one filter this parameter will be the empty string.
	// The expected return value is an object containing two properties:
	// - stringRep: The string representation of the given filters
	// - logicalOperator: The topmost logical operator ('and' or 'or') that was used to create stringRep. 
	// In case no logical operator is used on top most level it should be faulty
	function getFilterString(aFilters, getFilterInfoForPropertyFilters) {
		var oFilterInfo = getInfoForFilters(aFilters, getFilterInfoForPropertyFilters, true);
		return oFilterInfo ? oFilterInfo.stringRep : "";
	}

	//Format and return SemanticDate as per FLP readable format
	function getSematicDateFormat(oDateInfo, sEdmType) {
		var sOperator = oDateInfo.conditionTypeInfo.data.operation;
		var sValue1 = oDateInfo.conditionTypeInfo.data.value1;
		var sValue2 = oDateInfo.conditionTypeInfo.data.value2;
		if (["TODAY", "TOMORROW", "YESTERDAY"].includes(sOperator) && sEdmType !== "Edm.DateTimeOffset") {
			return {
				oValue1: "{" + sEdmType + "%%DynamicDate." + sOperator + "%%}",
				oValue2: null,
				operator: FilterOperator.EQ
			};
		} else {
			var commonOperatorSuffix = [sOperator, sValue1, sValue2].filter(function(val) {
				return val !== undefined && val !== null;
			}).join(".");
			return {
				oValue1: "{" + sEdmType + "%%DynamicDate." + commonOperatorSuffix + ".start%%}",
				oValue2: "{" + sEdmType + "%%DynamicDate." + commonOperatorSuffix + ".end%%}",
				operator: FilterOperator.BT
			};
		}
	}

	/**
	 * Formats a JavaScript value according to the given
	 * <a href="http://www.odata.org/documentation/odata-version-2-0/overview#AbstractTypeSystem">
	 * EDM type</a>.
	 *
	 * @param {any} vValue The value to format
	 * @param {string} sType The EDM type (e.g. Edm.Decimal)
	 * @param {boolean} bCaseSensitive Whether strings gets compared case sensitive or not
	 * @return {string} The formatted value
	 * @public
	 */
	function formatValue(vValue, sType, bCaseSensitive) {
		var oDate, sValue;

		if (bCaseSensitive === undefined) {
			bCaseSensitive = true;
		}

		// null values should return the null literal
		if (vValue === null || vValue === undefined) {
			return "null";
		}

		// Format according to the given type
		switch (sType) {
			case "Edm.String":
				// quote
				vValue = bCaseSensitive ? vValue : vValue.toUpperCase();
				sValue = "'" + String(vValue).replace(/'/g, "''") + "'";
				break;
			case "Edm.Time":
				if (typeof vValue === "object") {
					// no need to use UI5Date.getInstance as only the UTC timestamp is used
					sValue = DateFormat.getTimeInstance({
						pattern: "'time''PT'HH'H'mm'M'ss'S'''",
						calendarType: CalendarType.Gregorian
					}).format(new Date(vValue.ms), true);
				} else {
					sValue = "time'" + vValue + "'";
				}
				break;
			case "Edm.DateTime":
				// no need to use UI5Date.getInstance as only the UTC timestamp is used
				oDate = vValue instanceof Date ? vValue : new Date(vValue);
				if (oDate.getMilliseconds() > 0) {
					sValue = DateFormat.getDateInstance({
						pattern: "'datetime'''yyyy-MM-dd'T'HH:mm:ss.SSS''",
						calendarType: CalendarType.Gregorian
					}).format(oDate, true);
				} else {
					sValue = DateFormat.getDateInstance({
						pattern: "'datetime'''yyyy-MM-dd'T'HH:mm:ss''",
						calendarType: CalendarType.Gregorian
					}).format(oDate, true);
				}
				break;
			case "Edm.DateTimeOffset":
				// no need to use UI5Date.getInstance as only the UTC timestamp is used
				oDate = vValue instanceof Date ? vValue : new Date(vValue);
				sValue = DateFormat.getDateInstance({
					pattern: "'datetimeoffset'''yyyy-MM-dd'T'HH:mm:ss'Z'''",
					calendarType: CalendarType.Gregorian
				}).format(oDate, true);
				break;
			case "Edm.Guid":
				sValue = "guid'" + vValue + "'";
				break;
			case "Edm.Decimal":
				sValue = vValue + "m";
				break;
			case "Edm.Int64":
				sValue = vValue + "l";
				break;
			case "Edm.Double":
				sValue = vValue + "d";
				break;
			case "Edm.Float":
			case "Edm.Single":
				sValue = vValue + "f";
				break;
			case "Edm.Binary":
				sValue = "binary'" + vValue + "'";
				break;
			default:
				sValue = String(vValue);
				break;
		}
		return sValue;
	}
	
	// Callback function used to concatinate basic or complex filter for each filter values
	function getFilterInfoForPropertyFilters(oModel, oEntityType, oFilterData, bIsStatic, sProperty, aFiltersForProperty, sLogicalOperator) {
		var oValue1, oValue2, sOperator, oProperty = oModel.oMetadata._getPropertyMetadata(oEntityType, sProperty);
		var sRet = aFiltersForProperty.map(function (oFilter) {
			var bCaseSensitive = true;
			if (oFilter.bCaseSensitive === undefined) {
				bCaseSensitive = true;
			}
			// for navigation properties
			var sNavProperty;
			if (sProperty.split("/").length > 1) {
				sNavProperty = sProperty.split("/").join(".");
			}
			if (oProperty && (oProperty.type === "Edm.DateTime" || oProperty.type === "Edm.DateTimeOffset") && oFilterData[sNavProperty || sProperty].conditionTypeInfo && oFilterData[sNavProperty || sProperty].conditionTypeInfo.data.operation !== "DATE") {
				if (!DynamicDateUtil.getAllOptionKeys().includes(oFilterData[sNavProperty || sProperty].conditionTypeInfo.data.operation)) {
					bIsStatic = true;
				}
				var oValue = getSematicDateFormat(oFilterData[sNavProperty || sProperty], oProperty.type);
				oValue1 = oValue.oValue1;
				oValue2 = oValue.oValue2;
				sOperator = oValue.operator;
			} else {
				oValue1 = (oFilter.oValue1 != null) ? formatValue(oFilter.oValue1, oProperty.type, bCaseSensitive) : null;
				oValue2 = (oFilter.oValue2 != null) ? formatValue(oFilter.oValue2, oProperty.type, bCaseSensitive) : null;
				sOperator = oFilter.sOperator;
				if (oValue1) {
					oValue1 = encodeURL(String(oValue1));
				}
				if (oValue2) {
					oValue2 = encodeURL(String(oValue2));
				}
			}
			switch (sOperator) {
				case "EQ":
				case "NE":
				case "GT":
				case "GE":
				case "LT":
				case "LE":
					return sProperty + "%20" + sOperator.toLowerCase() + "%20" + oValue1;
				case "BT":
					return "(" + sProperty + "%20ge%20" + oValue1 + "%20and%20" + sProperty + "%20le%20" + oValue2 + ")";
				case "NB":
					return "not%20(" + sProperty + "%20ge%20" + oValue1 + "%20and%20" + sProperty + "%20le%20" + oValue2 + ")";
				case "Contains":
					return "substringof(" + oValue1 + "," + sProperty + ")";
				case "NotContains":
					return "not%20substringof(" + oValue1 + "," + sProperty + ")";
				case "StartsWith":
					return "startswith(" + sProperty + "," + oValue1 + ")";
				case "NotStartsWith":
					return "not%20startswith(" + sProperty + "," + oValue1 + ")";
				case "EndsWith":
					return "endswith(" + sProperty + "," + oValue1 + ")";
				case "NotEndsWith":
					return "not%20endswith(" + sProperty + "," + oValue1 + ")";
			}
		}).join("%20" + sLogicalOperator + "%20");
		return {
			stringRep: sRet,
			logicalOperator: sLogicalOperator
		};
	}

	/**
     * Function returns filter params for service url
     * @param {object} oEntityType
	 * @param {Array} aApplicationFilters - Smartfilterbar filters operators
	 * @param {Object} oFilterData - smartfilterbar filter object with values
     * @returns {string} return filter param of service url
     */
	function getFilterParams(oModel, oEntityType, aApplicationFilters, oFilterData) {
		var bIsStatic = false;
		var sFilterParams = "$filter=" + getFilterString(aApplicationFilters, getFilterInfoForPropertyFilters.bind(null, oModel, oEntityType, oFilterData, bIsStatic));
		return {
			sFilterParams: sFilterParams,
			bIsStatic: bIsStatic
		};
	}

    return {
        getFilterString: getFilterString,
		getFilterParams: getFilterParams
    };
});