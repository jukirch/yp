/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 * This extension is for OVP Analytical cards delivered in 2208.
 */
sap.ui.define(
    [
        "sap/ui/integration/Extension",
        "sap/ui/core/format/NumberFormat",
        "sap/fe/navigation/SelectionVariant",
        "sap/base/Log",
        "sap/ui/core/format/DateFormat",
        "sap/ui/core/library",
        "sap/m/library",
        "sap/ui/integration/util/Utils",
        "sap/m/DynamicDateUtil",
        "sap/fe/navigation/NavError",
        "sap/insights/utils/UrlGenerateHelper",
        "sap/insights/utils/AppConstants",
        "sap/ui/core/date/UI5Date",
        "sap/ui/core/Lib"
    ],
    function (Extension, NumberFormat, SelectionVariant, Log, DateFormat, coreLibrary, mobileLibrary, IntegrationUtils, DynamicDateUtil, NavError, UrlGenerateHelper, AppConstants, UI5Date, CoreLib) {
        "use strict";

        var ValueState = coreLibrary.ValueState;
        var ValueColor = mobileLibrary.ValueColor;

        var criticalityConstants = {
            StateValues: {
                None: "None",
                Negative: "Error",
                Critical: "Warning",
                Positive: "Success"
            },
            ColorValues: {
                None: "Neutral",
                Negative: "Error",
                Critical: "Critical",
                Positive: "Good"
            }
        };
        var oLogger = Log.getLogger("sap.insights.CardExtension");

        var endsWith = function (sString, sSuffix) {
            return sString && sString.indexOf(sSuffix, sString.length - sSuffix.length) !== -1;
        };
        var criticality2state = function (criticality, oCriticalityConfigValues) {
            var sState;
            if (oCriticalityConfigValues) {
                sState = oCriticalityConfigValues.None;
                if (criticality && criticality.EnumMember) {
                    var val = criticality.EnumMember;
                    if (endsWith(val, 'Negative')) {
                        sState = oCriticalityConfigValues.Negative;
                    } else if (endsWith(val, 'Critical')) {
                        sState = oCriticalityConfigValues.Critical;
                    } else if (endsWith(val, 'Positive')) {
                        sState = oCriticalityConfigValues.Positive;
                    }
                }
            }
            return sState;
        };
        var calculateCriticalityState = function (value, sImproveDirection, deviationLow, deviationHigh, toleranceLow, toleranceHigh, oCriticalityConfigValues) {

            var oCriticality = {};
            oCriticality.EnumMember = "None";
            //Consider fallback values for optional threshold values in criticality calculation
            //after considering fallback values if all the values required for calculation are not present then the criticality will be neutral
            /* example - in case of maximizing
            * if deviationLow is mentioned and toleranceLow not mentioned, then toleranceLow = deviationLow
            * if toleranceLow is mentioned and deviationLow not mentioned, then deviationLow = Number.NEGATIVE_INFINITY
            * if both values are not mentioned then there will not be any calculation and criticality will be neutral
            * */
            var nMinValue = Number.NEGATIVE_INFINITY;
            var nMaxValue = Number.POSITIVE_INFINITY;

            if ((!toleranceLow && toleranceLow !== 0) && (deviationLow || deviationLow === 0)) {
                toleranceLow = deviationLow;
            }
            if ((!toleranceHigh && toleranceHigh !== 0) && (deviationHigh || deviationHigh === 0)) {
                toleranceHigh = deviationHigh;
            }
            if (!deviationLow && deviationLow !== 0) {
                deviationLow = nMinValue;
            }
            if (!deviationHigh && deviationHigh !== 0) {
                deviationHigh = nMaxValue;
            }

            // number could be a zero number so check if it is not undefined
            if (value !== undefined) {
                value = Number(value);

                if (endsWith(sImproveDirection, "Minimize") || endsWith(sImproveDirection, "Minimizing")) {
                    if ((toleranceHigh || toleranceHigh === 0) && (deviationHigh || deviationHigh === 0)) {
                        if (value <= parseFloat(toleranceHigh)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value > parseFloat(deviationHigh)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                } else if (endsWith(sImproveDirection, "Maximize") || endsWith(sImproveDirection, "Maximizing")) {
                    if ((toleranceLow || toleranceLow === 0) && (deviationLow || deviationLow === 0)) {
                        if (value >= parseFloat(toleranceLow)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value < parseFloat(deviationLow)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                } else if (endsWith(sImproveDirection, "Target")) {
                    if ((toleranceHigh || toleranceHigh === 0) && (deviationHigh || deviationHigh === 0) && (toleranceLow || toleranceLow === 0) && (deviationLow || deviationLow === 0)) {
                        if (value >= parseFloat(toleranceLow) && value <= parseFloat(toleranceHigh)) {
                            oCriticality.EnumMember = "Positive";
                        } else if (value < parseFloat(deviationLow) || value > parseFloat(deviationHigh)) {
                            oCriticality.EnumMember = "Negative";
                        } else {
                            oCriticality.EnumMember = "Critical";
                        }
                    }
                }
            }
            return criticality2state(oCriticality, oCriticalityConfigValues);
        };
        var calculateTrendDirection = function (aggregateValue, referenceValue, downDifference, upDifference) {
            if (!aggregateValue || !referenceValue) {
                return;
            }
            aggregateValue = Number(aggregateValue);
            if (!upDifference && (aggregateValue - referenceValue >= 0)) {
                return "Up";
            }
            if (!downDifference && (aggregateValue - referenceValue <= 0)) {
                return "Down";
            }
            if (referenceValue && upDifference && (aggregateValue - referenceValue >= upDifference)) {
                return "Up";
            }
            if (referenceValue && downDifference && (aggregateValue - referenceValue <= downDifference)) {
                return "Down";
            }
        };

        var kpiformatter = function (sPath, ovpProperties, bUnit) {
            var oStaticValue = ovpProperties || {},
                kpiValue = sPath;
            var numberFormat = NumberFormat.getFloatInstance({
                minFractionDigits: oStaticValue.NumberOfFractionalDigits,
                maxFractionDigits: oStaticValue.NumberOfFractionalDigits,
                style: "short",
                showScale: true,
                shortRefNumber: kpiValue
            });
            var sNum = numberFormat.format(Number(kpiValue)),
                sNumberScale = numberFormat.getScale() || "";

            if (!bUnit && sNum) {
                var sLastNumber = sNum[sNum.length - 1];
                return sLastNumber === sNumberScale ? sNum.slice(0, sNum.length - 1) : sNum;
            }

            if (bUnit && oStaticValue.percentageAvailable) {
                return sNumberScale + "%";
            }

            if (bUnit && !oStaticValue.percentageAvailable) {
                return sNumberScale;
            }
            return "";
        };

        var formatHeaderUrl = function () {
            var oParams = this.getCard().getCombinedParameters(); // configuration parameters.
            return oParams._headerDataUrl;
        };

        var formatContentUrl = function () {
            var oParams = this.getCard().getCombinedParameters(); // configuration parameters.
            return oParams._contentDataUrl;
        };
        var targetValueFormatter = function (iKpiValue, iTargetValue, oStaticValues) {
            var iValue, iFractionalDigits, iScaleFactor;
            if (isNaN(+iKpiValue)) {
                return "";
            }

            if (iKpiValue == 0) {
                iScaleFactor = iTargetValue;
            } else {
                iScaleFactor = iKpiValue;
            }
            if (oStaticValues.NumberOfFractionalDigits) {
                iFractionalDigits = +(oStaticValues.NumberOfFractionalDigits);
            }
            if (iTargetValue) {
                iValue = iTargetValue;
            } else if (oStaticValues.manifestTarget) {
                iValue = oStaticValues.manifestTarget;
            }

            if (!iFractionalDigits || iFractionalDigits < 0) {
                iFractionalDigits = 0;
            } else if (iFractionalDigits > 2) {
                iFractionalDigits = 2;
            }
            if (iValue) {
                var fnNumberFormat = NumberFormat.getFloatInstance({
                    minFractionDigits: iFractionalDigits,
                    maxFractionDigits: iFractionalDigits,
                    style: "short",
                    showScale: true,
                    shortRefNumber: iScaleFactor
                });
                return fnNumberFormat.format(+(iValue));
            }
        };
        var returnPercentageChange = function (iKpiValue, iTargetValue, oStaticValues) {
            var iFractionalDigits, iReferenceValue;
            if (isNaN(+iKpiValue)) {
                return "";
            }
            iKpiValue = +(iKpiValue);
            if (oStaticValues.NumberOfFractionalDigits) {
                iFractionalDigits = +(oStaticValues.NumberOfFractionalDigits);
            }
            if (iTargetValue) {
                iReferenceValue = +(iTargetValue);
            } else if (oStaticValues.manifestTarget) {
                iReferenceValue = +(oStaticValues.manifestTarget);
            }


            if (!iFractionalDigits || iFractionalDigits < 0) {
                iFractionalDigits = 0;
            } else if (iFractionalDigits > 2) {
                iFractionalDigits = 2;
            }

            if (iReferenceValue) {
                var iPercentNumber = ((iKpiValue - iReferenceValue) / iReferenceValue);
                var fnPercentFormatter = NumberFormat.getPercentInstance({
                    style: 'short',
                    minFractionDigits: iFractionalDigits,
                    maxFractionDigits: iFractionalDigits,
                    showScale: true
                });
                return fnPercentFormatter.format(iPercentNumber);
            }
        };


        var kpiValueCriticality = function (nCriticality) {
            var oCriticality = {};
            oCriticality.EnumMember = "None";
            if (Number(nCriticality) === 1) {
                oCriticality.EnumMember = "Negative";
            } else if (Number(nCriticality) === 2) {
                oCriticality.EnumMember = "Critical";
            } else if (Number(nCriticality) === 3) {
                oCriticality.EnumMember = "Positive";
            }
            return criticality2state(oCriticality, criticalityConstants.ColorValues);
        };
        var formatValueColor = function () {
            var oStaticValues = arguments[arguments.length - 1];
            var index = 1;
            return calculateCriticalityState(
                arguments[0],
                oStaticValues.sImprovementDirection,
                oStaticValues.bIsDeviationLowBinding ? arguments[index++] : oStaticValues.deviationLow,
                oStaticValues.bIsDeviationHighBinding ? arguments[index++] : oStaticValues.deviationHigh,
                oStaticValues.bIsToleranceLowBinding ? arguments[index++] : oStaticValues.toleranceLow,
                oStaticValues.bIsToleranceHighBinding ? arguments[index++] : oStaticValues.toleranceHigh,
                oStaticValues.oCriticalityConfigValues
            );
        };
        var formatTrendIcon = function () {
            var oStaticValues = arguments[arguments.length - 1];
            var index = 1;
            return calculateTrendDirection(
                arguments[0],
                oStaticValues.bIsRefValBinding ? arguments[index++] : oStaticValues.referenceValue,
                oStaticValues.bIsDownDiffBinding ? arguments[index++] : oStaticValues.downDifference,
                oStaticValues.bIsUpDiffBinding ? arguments[index++] : oStaticValues.upDifference
            );
        };

        var formatDateValue = function (sPropertyValue) {
            var result;
            var oStaticValues = arguments[arguments.length - 1],
                sPropertyType = oStaticValues && oStaticValues.propertyType;
            switch (sPropertyType) {
                case "yearmonth":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        month = sPropertyValue.substr(4),
                        //month attribute in Date constructor is 0-based
                        monthIndex = parseInt(month, 10) - 1;
                    result = UI5Date.getInstance(
                        Date.UTC(year, monthIndex)
                    );
                    break;
                case "yearquarter":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        quarter = sPropertyValue.substr(4),
                        monthFromQuarter = parseInt(quarter, 10) * 3 - 2,
                        //month attribute in Date constructor is 0-based
                        monthIndex = monthFromQuarter - 1;
                    result = UI5Date.getInstance(
                        Date.UTC(year, monthIndex)
                    );
                    break;
                case "yearweek":
                    var year = parseInt(sPropertyValue.substr(0, 4), 10),
                        week = sPropertyValue.substr(4),
                        startOfWeekDay = 1 + (parseInt(week, 10) - 1) * 7; // 1st of January + 7 days for each week
                    result = UI5Date.getInstance(
                        Date.UTC(year, 0, startOfWeekDay)
                    );
                    break;
                default:
                    break;
            }
            return result;
        };

        var formatDate = function (sDateValue, formatterProperties) {
            if (sDateValue) {
                var oDate = IntegrationUtils.parseJsonDateTime(sDateValue);
                return DateFormat.getInstance(formatterProperties).format(UI5Date.getInstance(oDate), formatterProperties.bUTC);
            }
        };
        var formatHeaderCount = function (sValue) {
            if (sValue) {
                var formatNumber = NumberFormat.getIntegerInstance({
                    minFractionDigits: 0,
                    maxFractionDigits: 1,
                    decimalSeparator: ".",
                    style: "short"
                });
                return formatNumber.format(Number(sValue));
            }
        };

        var formatCurrency = function () {
            var oFormatterProperties = arguments[0],
                bIncludeText = arguments[1],
                fValue = Number(arguments[2]),
                sCurrency = arguments[3];

            var oCurrencyFormatter = NumberFormat.getCurrencyInstance({
                style: "short",
                showMeasure: true,
                shortRefNumber: oFormatterProperties.scaleFactor,
                minFractionDigits: oFormatterProperties.numberOfFractionalDigits,
                maxFractionDigits: oFormatterProperties.numberOfFractionalDigits
            });
            var sFormattedValue = oCurrencyFormatter.format(fValue, sCurrency);
            if (!bIncludeText) {
                return sFormattedValue;
            } else {
                var sCurrencyCodeText = arguments[arguments.length - 1];
                return sFormattedValue + " (" + sCurrencyCodeText + ")";
            }
        };

        var formatNumber = function (formatterProperties, textFragments , sValue, sUOM, sSAPText) {
            var oFormatter;
            if (formatterProperties) {
                formatterProperties.maxFractionDigits = formatterProperties.numberOfFractionalDigits || 0;
                formatterProperties.minFractionDigits = formatterProperties.numberOfFractionalDigits || 0;
                formatterProperties.style = formatterProperties.style || "short"; // default in OVP
                formatterProperties.showScale = formatterProperties.showScale || true;
                formatterProperties.shortRefNumber = formatterProperties.scaleFactor;
                oFormatter = NumberFormat.getFloatInstance(formatterProperties);
            }
            var aParts = [];
            if (!isNaN(parseFloat(sValue)) && oFormatter) {
                aParts.push(oFormatter.format(sValue));
            } else {
                aParts.push(sValue);
            }
            if (!isNaN(parseFloat(sUOM)) && oFormatter) {
                aParts.push(oFormatter.format(sUOM));
            } else {
                aParts.push(sUOM);
            }
            if (!isNaN(parseFloat(sSAPText)) && oFormatter) {
                aParts.push(oFormatter.format(sSAPText));
            } else {
                aParts.push(sSAPText);
            }
            var sFinalValue = "";
            if (textFragments && textFragments.length) {
                textFragments.forEach(function(textFragment) {
                    if (typeof textFragment === 'number') {
                        sFinalValue = sFinalValue + aParts[textFragment];
                    } else {
                        sFinalValue = sFinalValue + textFragment;
                    }
                });
            }
            return sFinalValue;
        };

        var formatCriticality = function (sCriticality, sType) {
            if (sType === "state") {
                switch (String(sCriticality)) {
                    case "1":
                    case "Error":
                        return ValueState.Error;
                    case '2':
                    case "Warning":
                        return ValueState.Warning;
                    case '3':
                    case "Success":
                        return ValueState.Success;
                    default:
                        return ValueState.None;
                }
            }
            if (sType === "color") {
                switch (String(sCriticality)) {
                    case "1":
                    case "Error":
                        return ValueColor.Error;
                    case '2':
                    case "Critical":
                        return ValueColor.Critical;
                    case '3':
                    case "Good":
                        return ValueColor.Good;
                    default:
                        return ValueColor.Neutral;
                }
            }
        };

        var getMinMax = function (sPath, sType, sEntityModelType) {
        // path is kept under 4th argument to attach watch to trigger this function for every data change
            var aContextData;
            if (sEntityModelType && sEntityModelType.indexOf('sap.ui.model.odata.v4.ODataModel') > -1 ) {
                aContextData = this.getCard().getModel().getProperty('/content/value') // with batch call
                        || this.getCard().getModel().getProperty('/value') // without batch call
                        || [];
            } else {
                aContextData = this.getCard().getModel().getProperty('/content/d/results') // with batch call
                        || this.getCard().getModel().getProperty('/d/results') // without batch call
                        || [];
            }
            var aItems = aContextData.map(function(oData) {
                return oData[sPath];
            });

            if (aItems.indexOf("0") === -1) {
                aItems.push(0); // Reference value for minimum and maximum value should be '0' if the current context does not have any value '0' minimum value would be '0'
            }

            return Math[sType].apply(Math, aItems);
        };

        // Original and properly commented code is here: sap/fe/navigation/NavigationHandler
        var _mixAttributesToSelVariant = function (mSemanticAttributes, oSelVariant, iSuppressionBehavior) {
            var ignoreEmptyString = 1;
            var raiseErrorOnNull = 2;
            var raiseErrorOnUndefined = 4;
            for (var sPropertyName in mSemanticAttributes) {
                if (mSemanticAttributes.hasOwnProperty(sPropertyName)) {
                    var vSemanticAttributeValue = mSemanticAttributes[sPropertyName];
                    if (vSemanticAttributeValue instanceof Date) {
                        vSemanticAttributeValue = vSemanticAttributeValue.toJSON();
                    } else if (Array.isArray(vSemanticAttributeValue) || (vSemanticAttributeValue && typeof vSemanticAttributeValue === "object")) {
                        vSemanticAttributeValue = JSON.stringify(vSemanticAttributeValue);
                    } else if (typeof vSemanticAttributeValue === "number" || typeof vSemanticAttributeValue === "boolean") {
                        vSemanticAttributeValue = vSemanticAttributeValue.toString();
                    }

                    if (vSemanticAttributeValue === "") {
                        if (iSuppressionBehavior & ignoreEmptyString) {
                            oLogger.info("Semantic attribute " + sPropertyName + " is an empty string and due to the chosen Suppression Behiavour is being ignored.");
                            continue;
                        }
                    }

                    if (vSemanticAttributeValue === null) {
                        if (iSuppressionBehavior & raiseErrorOnNull) {
                            throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                        } else {
                            oLogger.warning("Semantic attribute " + sPropertyName + " is null and ignored for mix in to selection variant");
                            continue; // ignore!
                        }
                    }

                    if (vSemanticAttributeValue === undefined) {
                        if (iSuppressionBehavior & raiseErrorOnUndefined) {
                            throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                        } else {
                            oLogger.warning(
                                "Semantic attribute " + sPropertyName + " is undefined and ignored for mix in to selection variant"
                            );
                            continue;
                        }
                    }

                    if (typeof vSemanticAttributeValue === "string" || vSemanticAttributeValue instanceof String) {
                        oSelVariant.addSelectOption(sPropertyName, "I", "EQ", vSemanticAttributeValue);
                    } else {
                        throw new oLogger.error("NavigationHandler.INVALID_INPUT");
                    }
                }
            }
            return oSelVariant;
        };

        // Original and properly commented code is here: sap/fe/navigation/NavigationHandler
        var mixAttributesAndSelectionVariant = function (vSemanticAttributes, sSelectionVariant, iSuppressionBehavior) {
            var oSelectionVariant = new SelectionVariant(sSelectionVariant);
            var oNewSelVariant = new SelectionVariant();

            if (oSelectionVariant.getFilterContextUrl()) {
                oNewSelVariant.setFilterContextUrl(oSelectionVariant.getFilterContextUrl());
            }
            if (oSelectionVariant.getParameterContextUrl()) {
                oNewSelVariant.setParameterContextUrl(oSelectionVariant.getParameterContextUrl());
            }
            if (Array.isArray(vSemanticAttributes)) {
                vSemanticAttributes.forEach(function (mSemanticAttributes) {
                    _mixAttributesToSelVariant(mSemanticAttributes, oNewSelVariant, iSuppressionBehavior);
                });
            } else {
                _mixAttributesToSelVariant(vSemanticAttributes, oNewSelVariant, iSuppressionBehavior);
            }

            var aParameters = oSelectionVariant.getParameterNames();
            var i;
            for (i = 0; i < aParameters.length; i++) {
                if (!oNewSelVariant.getSelectOption(aParameters[i])) {
                    oNewSelVariant.addSelectOption(aParameters[i], "I", "EQ", oSelectionVariant.getParameter(aParameters[i]));
                }
            }

            var aSelOptionNames = oSelectionVariant.getSelectOptionsPropertyNames();
            for (i = 0; i < aSelOptionNames.length; i++) {
                var aSelectOption = oSelectionVariant.getSelectOption(aSelOptionNames[i]);
                if (!oNewSelVariant.getSelectOption(aSelOptionNames[i])) {
                    for (var j = 0; j < aSelectOption.length; j++) {
                        oNewSelVariant.addSelectOption(
                            aSelOptionNames[i],
                            aSelectOption[j].Sign,
                            aSelectOption[j].Option,
                            aSelectOption[j].Low,
                            aSelectOption[j].High
                        );
                    }
                }
            }
            return oNewSelVariant;
        };

        function enhanceVariant(oValue) {
            if (oValue) {
                if (oValue.hasOwnProperty("SelectionVariantID")) {
                    delete oValue.SelectionVariantID;
                } else if (oValue.hasOwnProperty("PresentationVariantID")) {
                    delete oValue.PresentationVariantID;
                }
                delete oValue.Text;
                delete oValue.ODataFilterExpression;
                delete oValue.Version;
                delete oValue.FilterContextUrl;
                delete oValue.ParameterContextUrl;
                return oValue;
            }
            return oValue;
        }

        var isJSONData = function (oVariant) {
            try {
                if (JSON.parse(oVariant)) {
                    return true;
                }
            } catch (err) {
                return false;
            }
        };

        var singleAndSimpleFilter = function (aRanges) {
            var bSingleRange = aRanges && aRanges.length === 1,
                oRange = aRanges && aRanges[0];
            return bSingleRange && oRange["Option"] === 'EQ' && !oRange["High"] && oRange["Low"] && oRange["Sign"] === "I";
        };

        /**
         * This is part of scope of W2208 cloud delivery of S4 HANA.
         * This function creates navigation context i.e. navigation parameters, appstate, semantic object and action from
         * card configuration parameters, navigation data (oNavdata received from parameter>state>value) and currentcontext [ in case if content area of card is clicked ].
         *
         * @param {Object} oNavData The navigation data received from parameter>state>value of card manifest
         * @param {Object} oContext The current context in case if content area is clicked
         * @returns {String} The navigation context in stringified format consisting ibnParams [ parameters + app state ] and ibnTarget [ semnatic object + action ] as properties.
         */
        function addPropertyValueToAppState(oNavData, oContext) {
            var oCard = this.getCard().getManifestEntry('sap.card'),
                oCardParams = oCard && oCard.configuration.parameters,
                cardSV = new SelectionVariant(),
                aFilters = oCardParams._relevantODataFilters.value || [];
            oNavData = oNavData && JSON.parse(oNavData);
            var oSensitiveProps = oNavData && oNavData.sensitiveProps,
                oHeaderIbnParams = oCard && oCard.header.actions[0].parameters.ibnParams,
                oContentIbnParams = oCard && oCard.content.actions[0].parameters.ibnParams;

            aFilters.forEach(function (sFilterName) {
                var bJSONData = isJSONData(oCardParams[sFilterName].value);
                if (bJSONData && !(oSensitiveProps && oSensitiveProps[sFilterName])) {
                    var tempFilterSV = JSON.parse(oCardParams[sFilterName].value);
                    var aRanges = tempFilterSV.SelectOptions.Ranges;
                    if (aRanges && aRanges.length) {
                        var bSingleAndSimpleRange = singleAndSimpleFilter(aRanges);
                        if (oHeaderIbnParams[sFilterName] && oContentIbnParams[sFilterName]) {
                            if (bSingleAndSimpleRange) {
                                oHeaderIbnParams[sFilterName] = aRanges[0].Low;
                                oContentIbnParams[sFilterName] = aRanges[0].Low;
                            } else if (!bSingleAndSimpleRange) {
                                delete oContentIbnParams[sFilterName];
                                delete oHeaderIbnParams[sFilterName];
                                cardSV.massAddSelectOption(sFilterName, aRanges);
                            }
                        } else {
                            cardSV.massAddSelectOption(sFilterName, aRanges);
                        }
                    }
                }
            });
            if (oContext) {
                var aContextKeys = Object.keys(oContext) || [];
                for (var i = 0; i < aContextKeys.length; i++) {
                    if ((oSensitiveProps && oSensitiveProps[aContextKeys[i]]) ||
                        aContextKeys[i] === '__metadata') {
                        delete oContext[aContextKeys[i]];
                    }
                }

                var oSelectionVariant = mixAttributesAndSelectionVariant(oContext, cardSV && cardSV.toJSONObject());
                oSelectionVariant = enhanceVariant(oSelectionVariant.toJSONObject());
                oNavData.selectionVariant = oSelectionVariant;
            }
            if (oNavData && oNavData.sensitiveProps) {
                delete oNavData.sensitiveProps;
            }
            return JSON.stringify(oNavData);
        }

        var formatStringTypeForSemanticDate = function(oValue) {
            var oDateTimeFormat = DateFormat.getDateInstance({
                pattern: "''yyyy-MM-dd'T'HH:mm:ss.SSS'Z'''",
                calendarType: "Gregorian"
            });
            if (oValue) {
                var sValue = oDateTimeFormat.format(oValue, true);
                return String(sValue).replace(/'/g, "");
            }
        };

        var formatDateTimeTypeForSemanticDate = function(oValue) {
            var oDateTimeFormatMs = DateFormat.getDateInstance({
                pattern: "''yyyy-MM-dd'T'HH:mm:ss.SSS''",
                calendarType: "Gregorian"
            });
            var oDate = oValue instanceof Date ? oValue : UI5Date.getInstance(oValue);
            var sDateValue = oDateTimeFormatMs.format(oDate);
            return String(sDateValue).replace(/'/g, "");
        };

        function addSelectionOptionForSemanticDate(oSemanticDateRangeDescription, sType, sParamName, oSemanticDateSetting, oCardSV, oNavData) {

            var aRangeValues = DynamicDateUtil.toDates(oSemanticDateRangeDescription) || [];

            var oValue1 = aRangeValues[0] && aRangeValues[0].oDate;
            var oValue2 = aRangeValues[1] && aRangeValues[1].oDate;
            var sLowValue = "", sHighValue = "";

            if (oSemanticDateSetting["sap:filter-restriction"] === "single-value") {
                if (sType === "datetime") {
                    sLowValue = formatDateTimeTypeForSemanticDate(oValue1);
                    if (sLowValue && oNavData && oNavData.ibnParams) {
                        oNavData.ibnParams[sParamName] = sLowValue;
                    }
                } else if (sType === "string") {
                    sLowValue = formatStringTypeForSemanticDate(oValue1);
                    if (sLowValue && oNavData && oNavData.ibnParams) {
                        oNavData.ibnParams[sParamName] = sLowValue;
                    }
                }
                oCardSV.massAddSelectOption(sParamName, [{"Sign":"I", "Option":"EQ", "Low":sLowValue, "High":null}]);
            } else if (oSemanticDateSetting["sap:filter-restriction"] === "interval") {
                if (sType === "datetime") {
                    sLowValue = formatDateTimeTypeForSemanticDate(oValue1);
                    sHighValue = formatDateTimeTypeForSemanticDate(oValue2);
                    if (sLowValue && sHighValue) {
                        oCardSV.massAddSelectOption(sParamName, [{ Sign: 'I', Option: "BT", Low: sLowValue, High: sHighValue }]);
                    }
                } else if (sType === "string") {
                    sLowValue = formatStringTypeForSemanticDate(oValue1);
                    sHighValue = formatStringTypeForSemanticDate(oValue2);
                    if (sLowValue && sHighValue) {
                        oCardSV.massAddSelectOption(sParamName, [{ Sign: 'I', Option: "BT", Low: sLowValue, High: sHighValue }]);
                    }
                }
            }
        }

        function _getURLParametersFromSelectionVariant(vSelectionVariant) {
            var mURLParameters = {};
            var oSelectionVariant;

            if (typeof vSelectionVariant === "string") {
                oSelectionVariant = new SelectionVariant(vSelectionVariant);
            } else if (typeof vSelectionVariant === "object") {
                oSelectionVariant = vSelectionVariant;
            } else {
                throw new NavError("NavigationHandler.INVALID_INPUT");
            }

            // add URLs parameters from SelectionVariant.SelectOptions (if single value)
            var aSelectProperties = oSelectionVariant.getSelectOptionsPropertyNames();
            for (var i = 0; i < aSelectProperties.length; i++) {
                var aSelectOptions = oSelectionVariant.getSelectOption(aSelectProperties[i]);
                if (aSelectOptions.length === 1 && aSelectOptions[0].Sign === "I" && aSelectOptions[0].Option === "EQ") {
                    mURLParameters[aSelectProperties[i]] = aSelectOptions[0].Low;
                }
            }

            // add parameters from SelectionVariant.Parameters
            var aParameterNames = oSelectionVariant.getParameterNames();
            for (var i = 0; i < aParameterNames.length; i++) {
                var sParameterValue = oSelectionVariant.getParameter(aParameterNames[i]);

                mURLParameters[aParameterNames[i]] = sParameterValue;
            }
            return mURLParameters;
        }

        /**
         * This is part of scope of W2302 cloud delivery of S4 HANA.
         * This function creates navigation context i.e. navigation parameters, appstate, semantic object and action from
         * card configuration parameters, navigation data (oNavdata received from parameter>state>value) and currentcontext [ in case if content area of card is clicked ].
         *
         * @param {string} sNavData The navigation data received from parameter>state>value of card manifest
         * @param {Object} oContext The current context in case if content area is clicked
         * @returns {Object} The navigation parameters object consisting ibnParams and ibnTarget as properties in case of IBN navigation.
         */
        function getNavigationContext(sNavData, oContext) {
            var oCard = this.getCard().getManifestEntry('sap.card'),
                oCardParams = oCard && oCard.configuration.parameters,
                oCardSV = new SelectionVariant(),
                aFilters = oCardParams._relevantODataFilters.value || [],
                oNavData = sNavData && JSON.parse(sNavData) || {},
                oParameters = oNavData && oNavData.parameters,
                oIbnParams = oParameters && oParameters.ibnParams,
                oSensitiveProps = oIbnParams && oIbnParams.sensitiveProps,
                aSensitiveProps = oNavData && oNavData.sensitiveProps,
                oSemanticDateRangeSetting = oCardParams._semanticDateRangeSetting,
                oSemanticDateSetting, aSemanticDateFields = [];
                if (oSemanticDateRangeSetting) {
                  oSemanticDateSetting = JSON.parse(oSemanticDateRangeSetting.value);
                  aSemanticDateFields = Object.keys(oSemanticDateSetting) || [];
                }

            var oXAppStateData = {};

            if (aSemanticDateFields.length) {
                aSemanticDateFields.forEach(function (sSemanticDateField) {
                    var oFilterValue = oCardParams[sSemanticDateField] || {};
                    var oSemanticDateRangeValue = isJSONData(oFilterValue.value) ? JSON.parse(oFilterValue.value) : oFilterValue.value;
                    var sType = oFilterValue.type;
                    var sLowValue = "";

                    var oSemanticDateRangeDescription = oFilterValue.description && JSON.parse(oFilterValue.description),
                        sSemanticDateRangeOperator = oSemanticDateRangeDescription && oSemanticDateRangeDescription.operator,
                        bSensitiveProperty = (oSensitiveProps && oSensitiveProps[sSemanticDateField]) || (aSensitiveProps && aSensitiveProps.includes(sSemanticDateField));

                    if (AppConstants.DATE_OPTIONS.DATE_LIST.includes(sSemanticDateRangeOperator) && !bSensitiveProperty) {
                        var oRangeValue = oSemanticDateRangeValue && oSemanticDateRangeValue.SelectOptions && oSemanticDateRangeValue.SelectOptions[0] && oSemanticDateRangeValue.SelectOptions[0].Ranges;
                        if (oRangeValue && oRangeValue.length) {
                            oCardSV.massAddSelectOption(sSemanticDateField, oRangeValue);
                        } else {
                            if (sType === "datetime") {
                                sLowValue = formatDateTimeTypeForSemanticDate(oSemanticDateRangeValue);
                            } else if (sType === "string") {
                                sLowValue = oSemanticDateRangeValue.toString();
                            }
                            oCardSV.massAddSelectOption(sSemanticDateField, [{ Sign: 'I', Option: "EQ", Low: sLowValue, High: null }]);
                        }
                    } else if (sSemanticDateRangeOperator && !bSensitiveProperty) {
                        addSelectionOptionForSemanticDate(oSemanticDateRangeDescription, sType, sSemanticDateField, oSemanticDateSetting[sSemanticDateField], oCardSV, oNavData);
                    }
                });
            }

            oCardParams._relevantODataParameters.value.forEach(function(sParamName) {
                // handling of semantic date fields are being done separately
                var bSensitiveProperty = (oSensitiveProps && oSensitiveProps[sParamName]) || (aSensitiveProps && aSensitiveProps.includes(sParamName));
                if (oCardParams[sParamName] &&
                    oCardParams[sParamName].value &&
                    !aSemanticDateFields.includes(sParamName) &&
                    !bSensitiveProperty) {
                    if (oIbnParams) {
                        oIbnParams[sParamName] = oCardParams[sParamName].value;
                    } else if (oNavData && oNavData.ibnParams) {
                        oNavData.ibnParams[sParamName] = oCardParams[sParamName].value;
                    }
                    oCardSV.massAddSelectOption(sParamName, [{"Sign":"I","Option":"EQ","Low":oCardParams[sParamName].value,"High":null}]);
                }
            });

            aFilters.forEach(function (sFilterName) {
                var bJSONData = isJSONData(oCardParams[sFilterName].value);
                if (bJSONData && aSemanticDateFields.indexOf(sFilterName) === -1 && ((oSensitiveProps && !oSensitiveProps[sFilterName]) || (aSensitiveProps && !aSensitiveProps.includes(sFilterName)))) {
                    var oCardMandatoryFilterParamSV = JSON.parse(oCardParams[sFilterName].value);

                    var aRanges = oCardMandatoryFilterParamSV.SelectOptions && oCardMandatoryFilterParamSV.SelectOptions.Ranges || (oCardMandatoryFilterParamSV.SelectOptions && oCardMandatoryFilterParamSV.SelectOptions[0] && oCardMandatoryFilterParamSV.SelectOptions[0].Ranges);
                    if (aRanges && aRanges.length) {
                        var bSingleAndSimpleRange = singleAndSimpleFilter(aRanges);
                        if (bSingleAndSimpleRange) {
                            if (oIbnParams) {
                                oIbnParams[sFilterName] = aRanges[0].Low;
                            } else if (oNavData && oNavData.ibnParams) {
                                oNavData.ibnParams[sFilterName] = aRanges[0].Low;
                            }
                        } else {
                            if (oIbnParams && oIbnParams[sFilterName] && !bSingleAndSimpleRange) {
                                delete oIbnParams[sFilterName];
                            }
                        }
                        oCardSV.massAddSelectOption(sFilterName, aRanges);
                    }
                }
            });

            var oCurrentContext = oContext || {};
            var aContextKeys = Object.keys(oCurrentContext) || [];
            for (var i = 0; i < aContextKeys.length; i++) {
                if (((oSensitiveProps && oSensitiveProps[aContextKeys[i]]) || (aSensitiveProps && aSensitiveProps.includes(aContextKeys[i]))) || aContextKeys[i] === '__metadata') {
                    delete oCurrentContext[aContextKeys[i]];
                }
            }
            var oSelectionVariant = mixAttributesAndSelectionVariant(oCurrentContext, oCardSV && oCardSV.toJSONObject());
            var mURLParameters = _getURLParametersFromSelectionVariant(oSelectionVariant);
            oSelectionVariant = enhanceVariant(oSelectionVariant.toJSONObject());

            if (oIbnParams && oIbnParams.presentationVariant) {
                oXAppStateData["presentationVariant"] = oIbnParams.presentationVariant;
            } else if (oNavData && oNavData.ibnParams && oNavData.ibnParams.presentationVariant) {
                oXAppStateData["presentationVariant"] = oNavData.ibnParams.presentationVariant;
            }

            if (oSelectionVariant.Parameters.length || oSelectionVariant.SelectOptions.length) {
                oXAppStateData["selectionVariant"] = oSelectionVariant;
            }

            if (oParameters && !oParameters.ibnParams) {
                oParameters.ibnParams = {};
            }

            if (oXAppStateData["selectionVariant"] || oXAppStateData["presentationVariant"]) {
                if (oParameters && oParameters.ibnParams) {
                    oParameters.ibnParams["sap-xapp-state-data"] = JSON.stringify(oXAppStateData);
                } else if (oNavData && oNavData.ibnParams) {
                    oNavData.ibnParams["sap-xapp-state-data"] = JSON.stringify(oXAppStateData);
                }
            }

            if (oIbnParams && oIbnParams.sensitiveProps) {
                delete oIbnParams.sensitiveProps;
            }

            if (oNavData && oNavData.sensitiveProps) {
                delete oNavData.sensitiveProps;
            }

            for (var key in mURLParameters) {
                if (oParameters && oParameters.ibnParams) {
                    oParameters.ibnParams[key] = mURLParameters[key];
                } else if (oNavData && oNavData.ibnParams) {
                    oNavData.ibnParams[key] = mURLParameters[key];
                }
            }

            if (oIbnParams) {
                delete oIbnParams.selectionVariant;
                delete oIbnParams.presentationVariant;
            }

            if (oNavData && oNavData.ibnParams && oNavData.ibnParams.presentationVariant) {
                delete oNavData.ibnParams.presentationVariant;
            }

            return oNavData.parameters ? oNavData.parameters : oNavData;
        }
        function formatHeaderDataUrlForSemanticDate() {
            var oCard = {"descriptorContent":{}};
            oCard.descriptorContent = this.getCard().getManifestEntry("/");
            var sUrl =  semanticHeaderContentUrl(oCard, "header");
            return sUrl;
        }

        function formatContentDataUrlForSemanticDate() {
            var oCard = {"descriptorContent":{}};
            oCard.descriptorContent = this.getCard().getManifestEntry("/");
            var sUrlPrefix = oCard.descriptorContent["sap.card"]["configuration"]["csrfTokens"]["token1"].data.request.url;
            var sUrl =  semanticHeaderContentUrl(oCard, "content");
            if (oCard.descriptorContent["sap.card"]["data"]["request"] && oCard.descriptorContent["sap.card"]["data"]["request"]["batch"]) {
              return sUrl;
            }
            return sUrlPrefix + "/" + sUrl;
        }

        function semanticHeaderContentUrl (oCard, sType) {
            var oUrl = UrlGenerateHelper.processPrivateParams(oCard, null, true);
            if (sType === "header" && oUrl.header) {
              return  oUrl.header;
            } else if (sType === "content" && oUrl.content) {
              return  oUrl.content;
            }
        }

        /**
         * Checks if in S/4
         *
         * @returns {boolean} true when not in S4
         */
        function isInS4() {
            var oUShellConfig = window["sap-ushell-config"],
                oUShell = oUShellConfig && oUShellConfig.ushell,
                homeApp = oUShell && oUShell.homeApp;
            return !!homeApp; //convert to boolean via !!
        }

        var oInsightsExtension = Extension.extend("sap.insights.CardExtension", {
            init: function () {
                Extension.prototype.init.apply(this, arguments);
                Extension.prototype.setFormatters.apply(this, [{
                    kpiformatter: kpiformatter,
                    formatHeaderUrl: formatHeaderUrl.bind(this),
                    formatContentUrl: formatContentUrl.bind(this),
                    returnPercentageChange: returnPercentageChange,
                    targetValueFormatter: targetValueFormatter,
                    kpiValueCriticality: kpiValueCriticality,
                    formatValueColor: formatValueColor,
                    formatTrendIcon: formatTrendIcon,
                    formatDateValue: formatDateValue,
                    addPropertyValueToAppState: addPropertyValueToAppState.bind(this),
                    getNavigationContext: getNavigationContext.bind(this),
                    formatDate: formatDate,
                    formatNumber: formatNumber,
                    formatCurrency: formatCurrency,
                    formatHeaderCount: formatHeaderCount,
                    formatCriticality: formatCriticality,
                    getMinMax: getMinMax.bind(this),
                    formatHeaderDataUrlForSemanticDate: formatHeaderDataUrlForSemanticDate.bind(this),
                    formatContentDataUrlForSemanticDate: formatContentDataUrlForSemanticDate.bind(this)
                }]);
            },
            loadDependencies: function() {
                var oCard = this.getCard(),
                    sType = oCard.getManifestEntry("/sap.card/type"),
                    aPromises = [];

                if (!isInS4()) {
                    aPromises.push(new Promise(function(resolve) {
                        sap.ui.require(["sap/insights/HandleNonS4Environment"], function(HandleNonS4Environment) {
                            HandleNonS4Environment.initialize(this);
                            resolve();
                        }.bind(this));
                    }.bind(this)));
                }
                if (sType === "Analytical") {
                    aPromises.push(CoreLib.load({name:"sap.viz"})
                        .then(function () {
                            return new Promise(function (resolve) {
                                sap.ui.require([
                                    "sap/insights/OVPChartFormatter"
                                ], function (
                                    OVPChartFormatter
                                ) {
                                    OVPChartFormatter.registerCustomFormatters();
                                    resolve();
                                });
                            });
                        })
                    );
                }
                return Promise.all(aPromises);
            }
        });

    /**
     * add to the current value of property {@link #addFormatters formatters}.
     *
     * The formatters that can be used in the manifest.
     * When called with a value of <code>null</code> or <code>undefined</code>, the default value of the property will be restored.
     *
     * @method
     * @param {string} [sNamespace] Namespace for new <code>formatters</code>
     * @param {Object<string, function>} [aFormatters] New value of property <code>formatters</code>
     * @returns {this} Reference to <code>this</code> in order to allow method chaining
     * @public
     * @name sap.insights.CardExtension#addFormatters
     */

        oInsightsExtension.prototype.addFormatters = function (sNamespace, oFormatter) {
            if (!sNamespace || sNamespace === "") {
                Log.error("Namespace missing.");
                return this;
            }

            var oExistingFormatters = this.getProperty("formatters");
            oExistingFormatters[sNamespace] = oFormatter;
            return this.setFormatters(oExistingFormatters);

        };

    /**
     * @method
     * @returns {this} Reference to <code>this</code> in order to allow method chaining
     * @private
     * @name sap.insights.CardExtension#setFormatters
     */
        oInsightsExtension.prototype.setFormatters = function(){
            Log.error("Use of setFormatters is prohibited, instead use addFormatters method.");
                return this;
        };

        return oInsightsExtension;
    });