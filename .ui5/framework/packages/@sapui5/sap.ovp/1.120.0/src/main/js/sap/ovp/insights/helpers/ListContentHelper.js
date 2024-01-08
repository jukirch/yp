/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([ "sap/ovp/insights/helpers/ContentHelper"], function (ContentHelper) {
    "use strict";

    function _getItemTitle(oCardDefinition) {
        var oDataField = oCardDefinition.view.byId('DataField') || oCardDefinition.view.byId('DataField1');
        var oBindingTemplate = oCardDefinition.itemBindingInfo.template;
        if (oDataField) {
            return ContentHelper.getBindingPathOrValue(oDataField, "text", false, oCardDefinition.parameters);
        } else {
            return ContentHelper.getBindingPathOrValue(oBindingTemplate, "title", false, oCardDefinition.parameters);
        }
    }

    function _getItemInfo(oCardDefinition) {
        var oListItemTemplate = oCardDefinition.itemBindingInfo.template,
            sListType = oCardDefinition.cardComponentData.settings.listType,
            sNumberPathOrValue, sStatePathOrValue;

        if (sListType === "condensed") {
            if (oListItemTemplate.getMetadata().getName() === "sap.m.StandardListItem") {
                sNumberPathOrValue = ContentHelper.getBindingPathOrValue(oListItemTemplate, "info", false, oCardDefinition.parameters);
                sStatePathOrValue  = ContentHelper.getBindingPathOrValue(oListItemTemplate, "infoState", false, oCardDefinition.parameters);
            } else {
                var oDataPoint2Control = oCardDefinition.view.byId('DataPoint2');
                sNumberPathOrValue = ContentHelper.getBindingPathOrValue(oDataPoint2Control, "number", false, oCardDefinition.parameters);
                sStatePathOrValue  = ContentHelper.getBindingPathOrValue(oDataPoint2Control, "state", false, oCardDefinition.parameters);
            }
        } else {
            if (oListItemTemplate.getMetadata().getName() === "sap.m.CustomListItem") {
                var oDataPoint2Control = oCardDefinition.view.byId('DataPoint2');
                if (oDataPoint2Control) {
                    sNumberPathOrValue = ContentHelper.getBindingPathOrValue(oDataPoint2Control, "number", false, oCardDefinition.parameters);
                    sStatePathOrValue  = ContentHelper.getBindingPathOrValue(oDataPoint2Control, "state", false, oCardDefinition.parameters);
                }
                var oDataField2LinkControl = oCardDefinition.view.byId('DataField2Link');
                if (oDataField2LinkControl) {
                    sNumberPathOrValue = ContentHelper.getBindingPathOrValue(oDataField2LinkControl, "text", false, oCardDefinition.parameters);
                } 
            } else {
                sNumberPathOrValue = ContentHelper.getBindingPathOrValue(oListItemTemplate, "number", false, oCardDefinition.parameters);
                sStatePathOrValue  = ContentHelper.getBindingPathOrValue(oListItemTemplate, "numberState", false, oCardDefinition.parameters);
            }
        }
        return {
            value: sNumberPathOrValue,
            state: sStatePathOrValue ? ContentHelper.buildValueStateExpression(sStatePathOrValue, "state") : "None"
        };
    }

    function _checkAndPushValue(aArray, sValue) {
        // pushing by reference
        if (Array.isArray(aArray) && sValue) {
            aArray.push({value: sValue});
        } 
    }

    function _cleanEmptyAttributes(aItemAttributes) {
        for (var index = aItemAttributes.length - 1; index > -1; index--) {
            var oAttribute = aItemAttributes[index];
            if (!oAttribute.value) {
                aItemAttributes.pop();
            } else {
                return; // stop when any entry is found
            }
        }
    }

    function _getItemAttributes(oCardDefinition) {
        var oEnumValueState = {
            "Error" : "Error",
            "Information" : "Information",
            "None" : "None",
            "Success" : "Success",
            "Warning" : "Warning"
        };
        var aItemAttributes = [];

        if (oCardDefinition && oCardDefinition.itemBindingInfo) {
            var oListItemTemplate = oCardDefinition.itemBindingInfo.template;
            if (oListItemTemplate.getMetadata().getName() === "sap.m.CustomListItem") {
                var  sDataField2TextBindingOrValue = ContentHelper.getBindingPathOrValue(oCardDefinition.view.byId('DataField2'), "text", false, oCardDefinition.parameters);
                _checkAndPushValue(aItemAttributes, sDataField2TextBindingOrValue);

                var sDataPoint3TextBindingOrValue = ContentHelper.getBindingPathOrValue(oCardDefinition.view.byId('DataPoint3'), "number", false, oCardDefinition.parameters);
                _checkAndPushValue(aItemAttributes, sDataPoint3TextBindingOrValue);

            }
            // _checkAndPushValue cannot be used for attributes as their position is fixed and has to be pushed
            var aAttributes = oListItemTemplate.getAggregation("attributes");
            // Attribute 1
            if (aAttributes && aAttributes.length) {
                aItemAttributes.push({value: ContentHelper.getBindingPathOrValue(aAttributes[0], "text", false, oCardDefinition.parameters)}); 
            }
            // First status
            var oFirstStatus = oListItemTemplate.getAggregation("firstStatus");
            if (oFirstStatus) {
                var sFirstStatusState = ContentHelper.getBindingPathOrValue(oFirstStatus, "state", false, oCardDefinition.parameters) || 'None';
                aItemAttributes.push({
                    value: ContentHelper.getBindingPathOrValue(oFirstStatus, "text", false, oCardDefinition.parameters),
                    state: oEnumValueState[sFirstStatusState] || ContentHelper.buildValueStateExpression(sFirstStatusState, "state") || "None"
                });
            }
            // Attribute 2
            if (aAttributes && aAttributes.length > 1) {
                aItemAttributes.push({value: ContentHelper.getBindingPathOrValue(aAttributes[1], "text", false, oCardDefinition.parameters)});
            }
            // Second status
            var oSecondStatus = oListItemTemplate.getAggregation("secondStatus");
            if (oSecondStatus) {
                var sSecondStatusState = ContentHelper.getBindingPathOrValue(oSecondStatus, "state", false, oCardDefinition.parameters) || 'None';
                aItemAttributes.push({
                    value: ContentHelper.getBindingPathOrValue(oSecondStatus, "text", false, oCardDefinition.parameters),
                    state: oEnumValueState[sSecondStatusState] || ContentHelper.buildValueStateExpression(sSecondStatusState, "state") || "None"
                });
            }
        }
        _cleanEmptyAttributes(aItemAttributes);
        return aItemAttributes;
    }

    function _getItemDescription(oCardDefinition) {
        var oListItemControl = oCardDefinition.itemBindingInfo.template;
        if (oListItemControl && oListItemControl.getMetadata().getName() === "sap.m.StandardListItem") {
            return ContentHelper.getBindingPathOrValue(oListItemControl, "description", false, oCardDefinition.parameters);
        }
        if (oListItemControl && oListItemControl.getMetadata().getName() === "sap.m.CustomListItem") {
            var oContactLinkControl  = oCardDefinition.view.byId('contactLink');
            return ContentHelper.getBindingPathOrValue(oContactLinkControl, "text", false, oCardDefinition.parameters);
        }
    }

    function _getItemIcon(oCardDefinition) {
        var oListItemControl = oCardDefinition.itemBindingInfo.template;
        if (oListItemControl && oListItemControl.getMetadata().getName() === "sap.m.StandardListItem") {
            return {
                "src": ContentHelper.getBindingPathOrValue(oListItemControl, "icon", false, oCardDefinition.parameters) || "default", // add default if path not found
                "shape": "Square"
            };
        }
    }

    function _getItem(oCardDefinition) {
        var oItem = {
            title: _getItemTitle(oCardDefinition)
        };
        var oItemInfo = _getItemInfo(oCardDefinition);
        if (oItemInfo.value) {
            oItem.info = oItemInfo;
        }
        var sItemDesctiption = _getItemDescription(oCardDefinition);
        if (sItemDesctiption) {
            oItem.description = sItemDesctiption;
        }
        var aItemAttributes = _getItemAttributes(oCardDefinition);
        if (aItemAttributes.length) {
            oItem.attributesLayoutType = "TwoColumns";
            oItem.attributes = aItemAttributes;
        }
        if (oCardDefinition.cardComponentData.settings.imageSupported) {
            oItem.icon = _getItemIcon(oCardDefinition);
        }
        if (_isChartPresent(oCardDefinition)) {
            oItem.chart = _getChart(oCardDefinition);
        }
        return oItem;
    }

    function _getMinMaxFormatter(sPath, sType, oEntityModel) {
        return "{= extension.formatters.getMinMax('" + sPath + "', '" + sType + "', '" + oEntityModel + "', $" + ContentHelper.addBrackets(sPath) + ")}";
    }

    function _getChart(oCardDefinition) {
        var oChart = {
            type: "Bullet"
        };
        var oBarChartControl = oCardDefinition.view.byId('BarChartDataPoint');
        var oChartDisplayControl = oCardDefinition.view.byId('DataPoint1')
            || oCardDefinition.view.byId('BarChartStateValue')
            || oCardDefinition.view.byId('BarChartValue');
        var sChartValue = ContentHelper.getBindingPathOrValue(oBarChartControl.getData()[0], "value", true, oCardDefinition.parameters);
        var sDisplayValuePathOrValue = ContentHelper.getBindingPathOrValue(oChartDisplayControl, "number", false, oCardDefinition.parameters);
        var sValuePathOrValue =  ContentHelper.getBindingPathOrValue(oBarChartControl.getData()[0], "value", false, oCardDefinition.parameters);
        var sColorPathOrValue = ContentHelper.getBindingPathOrValue(oBarChartControl.getData()[0], "color", false, oCardDefinition.parameters);
        oChart.value = sValuePathOrValue ? "{= parseFloat($" + ContentHelper.addBrackets(sValuePathOrValue) + ")}" : null;
        oChart.displayValue = ContentHelper.isAnExpression(sDisplayValuePathOrValue) ? sDisplayValuePathOrValue : oChart.value;
        oChart.color = sColorPathOrValue ? ContentHelper.buildValueStateExpression(sColorPathOrValue, "color") : "None";
        var isThresholdPercentage = oCardDefinition.view.getModel('minMaxModel').getProperty('/isPercentage');
        var oEntityModel = oCardDefinition.view.getModel();
        oChart.minValue = isThresholdPercentage ? 0 : _getMinMaxFormatter(sChartValue, "min", oEntityModel);
        oChart.maxValue = isThresholdPercentage ? 100 : _getMinMaxFormatter(sChartValue, "max", oEntityModel);
        return oChart;
    }

    function _isChartPresent(oCardDefinition) {
        return oCardDefinition.view.byId('BarChartDataPoint');
    }

    function _getListContent(oCardDefinition, oSapCard) {
        if (!oCardDefinition) {
            return {};
        }
        var oContent = {};
        oCardDefinition.parameters = oSapCard.configuration.parameters;
        oContent.data = ContentHelper.getData(oSapCard.data.request.batch, oCardDefinition.view.getModel());
        oContent.item = _getItem(oCardDefinition);
        return oContent;
    }

    return {
        getListContent: _getListContent
    };
});
