/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/app/resources",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/app/OVPUtils"
], function (
    OvpResources,
    CommonUtils,
    OVPUtils
) {
    "use strict";
    /**
      * @param {sap.ui.core.Element}
      * @returns {boolean} - returns true or false based on the value of oElement passed as a parameter
    */
    var aCustomCardId = [];
    function isControlNonAdaptable(oElement) {
        var validateClassToolBar = function (oControl) {
            var classList1Exists =
                oControl.hasStyleClass("sapUiSizeCompact") &&
                oControl.hasStyleClass("dropDrownCompact"),
                classList2Exists =
                    oControl.hasStyleClass("sapUiSizeCozy") &&
                    oControl.hasStyleClass("sapOvpDropDownPadding") &&
                    oControl.hasStyleClass("dropDrownCozy");
            return classList1Exists || classList2Exists;
        };
        var validateClassCountHeader = function (oControl) {
            var classList1Exists =
                oControl.hasStyleClass("sapOvpHeaderCounter");
            return classList1Exists;
        };
        var validateClassTargetDeviation = function (oControl) {
            var classList1Exists =
                oControl.hasStyleClass("cardHeaderText") &&
                oControl.hasStyleClass("sapOvpKPIHeaderTrendPercentStyle"),
                classList2Exists =
                    oControl.hasStyleClass("KpiDeviationText") &&
                    oControl.hasStyleClass("sapOvpKPIHeaderTrendPercentStyle");
            return classList1Exists || classList2Exists;
        };
        var validateCustomCardTitleOrSubtitle = function (oControl) {
            var bHasCustomCardId = false;
            for (var i = 0; i < aCustomCardId.length; i++) {
                if (oControl.sId && oControl.sId.indexOf(aCustomCardId[i]) > -1) {
                    bHasCustomCardId = true;
                }
            }
            return bHasCustomCardId;
        };
        var validateTableCardColumn = function (oControl) {
            var bTableCardHeaderColumnClassExists =
                oControl.hasStyleClass("sapUiDtOverlaySelectable") && oControl.hasStyleClass("sapUiDtOverlayEditable");
            return bTableCardHeaderColumnClassExists;
        };
        var sType = oElement.getMetadata().getName();
        
        if (oElement.oComponentData && oElement.oComponentData.mainComponent && oElement.oComponentData.mainComponent.oCards) {
            var oCard = oElement.oComponentData.mainComponent.oCards.filter(function (oCard) { 
                return oCard.id === oElement.oComponentData.cardId;
            })[0];
            var sTemplate = oCard.template;
            var oController = CommonUtils.getApp().byId(oElement.oContainer.sId).getComponentInstance().getRootControl().getController();
            var sHeaderExtensionFragment = oController.getCardPropertiesModel().getProperty("/headerExtensionFragment");
            if (sTemplate && !sTemplate.startsWith("sap.ovp.cards") && sHeaderExtensionFragment && !sHeaderExtensionFragment.startsWith("sap.ovp.cards")) {
                //add only once to avoid same card's ids getting added everytime adapt ui is clicked
                if (aCustomCardId.indexOf(oElement.oComponentData.cardId) === -1) {
                   aCustomCardId.push(oElement.oComponentData.cardId);
                }
            }
        }
    
        var aNonAdaptatbleControls = [
            { type: "sap.m.FlexBox", id: "kpiHBoxNumeric", hasValidator: false },
            { type: "sap.m.Button", id: "sapOvpCardAdditionalActions", hasValidator: false},
            { type: "sap.m.Text", id: "ovpTargetValue", hasValidator: true, fnValidator: validateClassTargetDeviation},
            { type: "sap.m.Text", id: "kpiNumberPercentage", hasValidator: true, fnValidator: validateClassTargetDeviation},
            { type: "sap.m.Text", id: "ovpCountHeader", hasValidator: true, fnValidator: validateClassCountHeader},
            { type: "sap.m.List", id: "ovpLinkList", hasValidator: false},
            { type: "sap.m.CustomListItem", id: "linkListItem", hasValidator: false}, 
            { type: "sap.m.CustomListItem", id: "ovpList", hasValidator: false}, 
            { type: "sap.m.Text", id: "ovpList", hasValidator: false}, 
            { type: "sap.ui.comp.navpopover.SmartLink", id: "ovpList", hasValidator: false},
            { type: "sap.m.Link", id: "ovpList", hasValidator: false}, 
            { type: "sap.ui.comp.navpopover.SmartLink", id: "ovpTable", hasValidator: false},
            { type: "sap.m.Column", id: "ovpTable", hasValidator: true, fnValidator: validateTableCardColumn },
            { type: "sap.m.VBox", id: "kpiHeader", hasValidator: false},
            { type: "sap.m.Toolbar", id: "toolbar", hasValidator: true, fnValidator: validateClassToolBar},
            { type: "sap.m.StandardListItem", id: "listItem", hasValidator: false},
            { type: "sap.m.Text", id: "Original--ovpHeaderTitle", hasValidator: true, fnValidator: validateCustomCardTitleOrSubtitle},
            { type: "sap.m.Text", id: "Original--SubTitle-Text", hasValidator: true, fnValidator: validateCustomCardTitleOrSubtitle}
        ];

        for (var iKey in aNonAdaptatbleControls) {
            if (sType === aNonAdaptatbleControls[iKey].type && oElement && oElement.getId() && oElement.getId().indexOf(aNonAdaptatbleControls[iKey].id) > -1) {
                if (aNonAdaptatbleControls[iKey].hasValidator) {
                    return aNonAdaptatbleControls[iKey].fnValidator(oElement);
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    return {
        default: {
            //Template for Overview Page Extensibility via UI Adaptation Editor tool
            controllerExtensionTemplate: "sap/ovp/ui/OVPControllerExtensionTemplate",
            actions: {},
            aggregations: {
                DynamicPage: {
                    propagateMetadata: function (oElement) {
                        var sType = oElement.getMetadata().getName();
                        var sLayer = CommonUtils._getLayer();
                        var bFioriToolsRTAMode = CommonUtils.getQueryParameterValue("fiori-tools-rta-mode");
                        var bControlNotAdaptable = isControlNonAdaptable(oElement);
                        if (bControlNotAdaptable) {
                            return {
                                actions: "not-adaptable"
                            };
                        } else if (
                            sType !== "sap.ovp.ui.EasyScanLayout" &&
                            sType !== "sap.ui.core.ComponentContainer" &&
                            !(((sLayer && sLayer === OVPUtils.Layers.customer_base) || bFioriToolsRTAMode) && sType === "sap.ui.comp.smartfilterbar.SmartFilterBar")
                        ) {
                            return {
                                actions: {
                                    remove: null,
                                    reveal: null
                                }
                            };
                        }
                    },
                    propagateRelevantContainer: false
                }
            }
        },
        strict: {
            actions: {
                /*settings: function () {
                    return {
                        isEnabled: false, //Disabled as of now
                        handler: function (oElement, fGetUnsavedChanges) {
                            AppSettingsUtils.getDialogBox(oElement).then(function (oDialogBox) {
                                oDialogBox.open();
                            });
                            return Promise.resolve([]);
                        }
                    };
                }*/
            },
            name: {
                singular: OvpResources && OvpResources.getText("Card"),
                plural: OvpResources && OvpResources.getText("Cards")
            }
        }
    };
}, false);
