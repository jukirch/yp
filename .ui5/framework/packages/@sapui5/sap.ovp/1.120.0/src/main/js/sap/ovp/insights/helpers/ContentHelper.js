/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ovp/insights/helpers/Batch"], function (BatchHelper) {
    "use strict";

    var FORMATTERS = {
        formatDate: "sap.ovp.cards.AnnotationHelper.formatDate",
        formatColor: "sap.ovp.cards.AnnotationHelper.formatColor",
        formatCurrency: "sap.ovp.cards.AnnotationHelper.formatCurrency",
        formatNumberCalculation: "sap.ovp.cards.AnnotationHelper.formatNumberCalculation"
    };

    function _addBrackets(sText) {
        if (sText === null || sText === undefined) {
            return;
        }
        if (sText.indexOf("{") !== -1) {
            return sText;
        }
        return "{" + sText + "}";
    }

    function _getData(oBatch, oEntityModel) {
        if (!oBatch) {
            return {
                path: BatchHelper.getBatchRequestPath("/d/results", oEntityModel)
            };
        }
        return {
            path: BatchHelper.getBatchRequestPath("/content/d/results", oEntityModel)
        };
    }

    function _isAPath(sValue) {
        if (sValue && typeof sValue === "string" && sValue.length > 0) {
            return sValue.startsWith('{') && sValue.endsWith('}');
        }
        return false;
    }

    function _isAnExpression(sValue) {
        if (sValue && typeof sValue === "string" && sValue.length > 0) {
            return sValue.startsWith('{=') && sValue.endsWith('}');
        }
        return false;
    }

    function _buildValueStateExpression(sPathOrValue, sStateType) {
        var sExpression;
        if (_isAnExpression(sPathOrValue)) {
            return sPathOrValue;
        }
        if (_isAPath(sPathOrValue)) {
            sExpression = "$" + sPathOrValue;
        } else {
            sExpression = "'" + sPathOrValue + "'";
        }
        return "{= extension.formatters.formatCriticality(" + sExpression + ", '" + sStateType + "')}";
    }

    function _getBindingPathOrValue(oControl, sPropertyName, bWithoutBracket, oParameter) {
        if (!oControl || !sPropertyName) {
            return null;
        }
        try {
            var oBindingInfo = oControl.getBindingInfo(sPropertyName);
            var sBindingPath;
            if (oBindingInfo) { //binding is present
                if (oBindingInfo.formatter && oBindingInfo.formatter.name === "formatCurrency") {
                    var oUnitBindingInfo = oControl.getBindingInfo('unit');
                    sBindingPath = _getBindingExpression(oBindingInfo, oParameter, oUnitBindingInfo);
                    return bWithoutBracket ? sBindingPath : _addBrackets(sBindingPath);
                }

                if (oBindingInfo.parts && oBindingInfo.parts.length) {
                    sBindingPath = oBindingInfo.parts.length === 1 ? _getBindingExpression(oBindingInfo) : _getBindingExpression(oBindingInfo, oParameter);
                    return bWithoutBracket ? sBindingPath : _addBrackets(sBindingPath);
                }
                // return simple path
                sBindingPath = oControl.getBindingPath(sPropertyName);
                return bWithoutBracket ? sBindingPath : _addBrackets(sBindingPath);
            } else {
                return oControl.getProperty(sPropertyName); // return value of property when binding is missing.
            }
        } catch (err) {
            return;
        }
    }

    function _convertPathsToExpression(aExpressionPaths) {
        var aExpression = [];
        if (Array.isArray(aExpressionPaths)) {
            aExpressionPaths.forEach(function(sPath) {
                aExpression.push("${" + sPath + "}");
        });
      }
      return aExpression.join();
    }

    function _getBindingExpression(oBindingInfo, oParameter, oUnitBindingInfo) {
        var aPaths = [], sPath, oFormattingOptions, functionName, bi18nModel = false, bI18nForFormatter = false;
        var aTextFragment, sTextFragment;
        if (oBindingInfo && oBindingInfo.parts) {
            oBindingInfo.parts.forEach(function(oPart) {
                if (oPart.path) {
                    if (oPart.model === "@i18n" && oParameter) {
                        oParameter[oPart.path] = {value: "{{" + oPart.path + "}}" };
                        aPaths.push("parameters>/" + oPart.path + "/value");
                        bI18nForFormatter = true;
                    } else {
                        aPaths.push(oPart.path);
                    }
                }
                if (oPart.model === "ovpCardProperties" && oPart.value) {
                    functionName = oPart.value.functionName;
                    if (oPart.value.dateFormat) {
                        oFormattingOptions = oPart.value.dateFormat;
                        oFormattingOptions.bUTC = oPart.value.bUTC || false;
                    } else {
                        oFormattingOptions = oPart.value;
                    }
                } else if (oPart.model === "@i18n") {
                    bi18nModel = true;
                }
            });

            if (aPaths.length === 1) { // single path
                sPath = aPaths[0];
            }
            if (oBindingInfo.type && oBindingInfo.type.oFormat) {
                oBindingInfo.formatter = {
                    name: "formatter",
                    textFragments : [0]
                }; // empty formatter
                oFormattingOptions = oBindingInfo.type.oFormat.oFormatOptions;
            }

            if (oBindingInfo.formatter && oBindingInfo.formatter.textFragments !== true) {
                var sFormatterOptions = null;
                if (oFormattingOptions) {
                    var oFormattingOptionsCopy = Object.assign({}, oFormattingOptions);
                    delete oFormattingOptionsCopy.functionName; // delete functionName after picked as its not needed for formatting
                    sFormatterOptions = JSON.stringify(oFormattingOptionsCopy).replaceAll('"', "'");
                }
                switch (functionName) {
                    case FORMATTERS.formatDate:
                        if (!sPath) {
                            return "{= extension.formatters.formatDate(" + _convertPathsToExpression(aPaths) + ", " + sFormatterOptions + ")}";
                        }
                        return "{= extension.formatters.formatDate(${" + sPath + "}, " + sFormatterOptions + ")}";
                    case FORMATTERS.formatColor:
                        if (!sPath) {
                            return (
                                "{= extension.formatters.formatValueColor(" + _convertPathsToExpression(aPaths) + "," +
                                JSON.stringify(oFormattingOptions) +
                                ")}"
                              );
                        }
                        return "{= extension.formatters.formatValueColor(${" + sPath + "}," + JSON.stringify(oFormattingOptions) + ")}";
                    case FORMATTERS.formatCurrency:
                        oUnitBindingInfo && oUnitBindingInfo.parts.forEach(function(oPart) {
                            aPaths.push(oPart.path);
                        });
                        var bIncludeCurrencyCodeText = aPaths.length === 4;
                        return "{= extension.formatters.formatCurrency(" + sFormatterOptions + "," + bIncludeCurrencyCodeText + "," + _convertPathsToExpression(aPaths) + ")}";
                    case FORMATTERS.formatNumberCalculation:
                        var aTextFragment = oBindingInfo.formatter.textFragments || [0];
                        sTextFragment = JSON.stringify(aTextFragment).replaceAll('"', "'");
                        return "{= extension.formatters.formatNumber(" + sFormatterOptions + "," + sTextFragment + "," + _convertPathsToExpression(aPaths) + ")}";
                    default:
                        var sTextFragment = null;
                        if (oBindingInfo.formatter.textFragments) {
                            // build text expression
                            sTextFragment = JSON.stringify(oBindingInfo.formatter.textFragments).replaceAll('"', "'");
                            return "{= extension.formatters.formatNumber(" + sFormatterOptions + "," + sTextFragment + "," + _convertPathsToExpression(aPaths) + ")}";
                        }
                }
            }
            if (bi18nModel && !bI18nForFormatter) {
                return "{{" + sPath + "}}";
            }
            return sPath;
        }
    }

    function _getHeaderStatus(oBatch, oEntityModel) {
        var sCountPath = '';
        if (oBatch) {
            sCountPath = BatchHelper.getBatchResultCount("/content/d/__count", oEntityModel);
        } else {
            sCountPath = BatchHelper.getBatchResultCount("/d/__count", oEntityModel);
        }
        return {
            text: "{= ${" + sCountPath + "} === '0' ? '' : extension.formatters.formatHeaderCount( ${" + sCountPath + "}) }"
        };
    }

    return {
        getHeaderStatus: _getHeaderStatus,
        addBrackets: _addBrackets,
        buildValueStateExpression: _buildValueStateExpression,
        getBindingPathOrValue: _getBindingPathOrValue,
        getData: _getData,
        isAnExpression: _isAnExpression
    };
});
