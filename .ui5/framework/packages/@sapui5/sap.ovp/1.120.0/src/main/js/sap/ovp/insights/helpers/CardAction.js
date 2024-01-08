/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/app/NavigationHelper",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/app/OVPLogger"
], function (NavigationHelper, CommonUtils, CardsNavigationhelper, OVPLogger) {
    "use strict";
    var oLogger = new OVPLogger("OVP.insights.helpers.CardAction");

    return {

        /**
         * 
         * formulates Integration card header and content actions from OVP cards and return it.
         * consider identificationannotationpath and noheadernav manifest properties for analytical card.
         * for List / Table cards consider both identificationannotationpath and lineitem annotationpath.
         * 
         * @param {object} oCardDefinition The card definition
         * @param {object} oSapCard The Integrtaion card definition
         * @returns {promise} A promise which returns card actions on resolution.
         */
        getCardActions : function(oCardDefinition, oSapCard) {
            var oActions = {
                header: {
                    enabled: false,
                    actions: []
                },
                content: {
                    enabled: false,
                    actions: []
                }
            };
            var bHasNavigation = false,
                bHasHeaderNavigation = false;
            var oView = oCardDefinition.view;
            var oController = oView.getController();
            if (oCardDefinition.cardComponentName === "Analytical") {
                bHasHeaderNavigation = !CardsNavigationhelper.checkHeaderNavigationDisabledForAnalyticalCard(oController.getCardPropertiesModel());
            }
            bHasNavigation = NavigationHelper.bCheckNavigationForCard(oController);
            if (!bHasNavigation) {
                return Promise.resolve(oActions);
            }
            var pNavigationParameters = NavigationHelper.getNavigationParameters(oController, oCardDefinition);
            return pNavigationParameters.then(function (oNavigationParameters) {

                if (oNavigationParameters === undefined) {
                    return oActions;
                }

                if (oCardDefinition.cardComponentName === "List" || oCardDefinition.cardComponentName === "Table") {
                    bHasHeaderNavigation = oNavigationParameters["semanticObject"] && oNavigationParameters["action"];
                }

                var oParams = {
                    ibnTarget: {},
                    ibnParams: {}
                };

                var oHeaderParameterValue = {
                    type: "Navigation"
                };

                var oContentParameterValue = {
                    type: "Navigation"
                };

                if (oNavigationParameters && oNavigationParameters.type === "url") {
                    oParams = {
                        type: "Navigation",
                        parameters: {
                            target: "_self"
                        }
                    };
                    CommonUtils.updatePropertyValueForObject(oParams.parameters, oNavigationParameters.url, "url");
                } else {
                    if (
                        oNavigationParameters.semanticObject ||
                        oNavigationParameters.action ||
                        oNavigationParameters.staticParams
                    ) {

                        oParams.ibnTarget = {
                            "semanticObject": oNavigationParameters.semanticObject,
                            "action": oNavigationParameters.action
                        };

                        if (!oSapCard.configuration.parameters.state && oCardDefinition.cardComponentName === "Analytical") {
                            oSapCard.configuration.parameters.state = {
                                value: ""
                            };
                        }

                        var aSensitiveProps = [];

                        if (oNavigationParameters.staticParams) {
                            if (oNavigationParameters.staticParams.sNavPresentationVariant) {
                                oParams.ibnParams.presentationVariant = oNavigationParameters.staticParams.sNavPresentationVariant;
                            }
                            if (oNavigationParameters.staticParams.sensitiveProperties) {
                                aSensitiveProps = oNavigationParameters.staticParams.sensitiveProperties;
                            }
                            var oStaticProps = oNavigationParameters.staticParams.staticPropertyMap;
                            var aKeys = oStaticProps && Object.keys(oStaticProps) || [];
                            for (var i = 0; i < aKeys.length; i++) {
                                if (aKeys[i] && oStaticProps[aKeys[i]] && !aSensitiveProps.includes(aKeys[i])) {
                                    oParams.ibnParams[aKeys[i]] = oStaticProps[aKeys[i]];
                                }
                            }
                        }
                        oParams.sensitiveProps = aSensitiveProps;
                    }
                }

                oActions.content.enabled = true;
                oActions.content.actions.push(oContentParameterValue);
                if (bHasHeaderNavigation) {
                    oActions.header.enabled = true;
                    oActions.header.actions.push(oHeaderParameterValue);
                }

                if (oCardDefinition.cardComponentName === "Analytical") {
                    CommonUtils.updatePropertyValueForObject(oHeaderParameterValue, "{= extension.formatters.getNavigationContext(${parameters>/state/value})}", "parameters");
                    CommonUtils.updatePropertyValueForObject(oContentParameterValue, "{= extension.formatters.getNavigationContext(${parameters>/state/value}, ${})}", "parameters");
                    oSapCard.configuration.parameters.state.value = JSON.stringify(oParams);
                } else {
                    if (oParams.ibnTarget["semanticObject"] && oParams.ibnTarget["action"]) {
                        CommonUtils.updatePropertyValueForObject(oHeaderParameterValue, "{= extension.formatters.getNavigationContext(${parameters>/headerState/value})}", "parameters");
                        oSapCard.configuration.parameters.headerState = {
                            value: ""
                        };
                        oSapCard.configuration.parameters.headerState.value = JSON.stringify(oParams);
                        oNavigationParameters["lineItemSemanticObject"] = oNavigationParameters["lineItemSemanticObject"] || oParams.ibnTarget["semanticObject"];
                        oNavigationParameters["lineItemAction"] = oNavigationParameters["lineItemAction"] || oParams.ibnTarget["action"];
                    }

                    if (oNavigationParameters["lineItemSemanticObject"] && oNavigationParameters["lineItemAction"]) {
                        oParams.ibnTarget["semanticObject"] = oNavigationParameters["lineItemSemanticObject"];
                        oParams.ibnTarget["action"] = oNavigationParameters["lineItemAction"];

                        CommonUtils.updatePropertyValueForObject(oContentParameterValue, "{= extension.formatters.getNavigationContext(${parameters>/lineItemState/value}, ${})}", "parameters");
                        oSapCard.configuration.parameters.lineItemState = {
                            value: ""
                        };
                        oSapCard.configuration.parameters.lineItemState.value = JSON.stringify(oParams);
                    }
                }
                return oActions;
            }).catch(function (oError) {
                oLogger.error(oError);
            });
        },
        /**
         * 
         * Checks if the customParams or doCustomNavigation is supported for the given card
         * 
         * @param {object} oCardDefinition The card definition
         * @returns {boolean} if the card support customParams or doCustomNavigation
         */
        checkCustomNavigationForCard: function (oCardDefinition) {
            var oSettings = oCardDefinition && oCardDefinition.cardComponentData.settings,
                bCustomParams = oSettings && !!oSettings.customParams,
                oCardController = oCardDefinition && oCardDefinition.view.getController(),
                oMainComponent = oCardController && oCardController.oCardComponentData && oCardController.oCardComponentData.mainComponent,
                bDoCustomNavigation = oMainComponent && !!oMainComponent.doCustomNavigation;
            return bCustomParams || bDoCustomNavigation;
        },
        /**
         * 
         * Gets the overview page application's default action and semanticObject
         * 
         * @param {object} oIntentResponse The intent response for the application
         * @returns {string} Updated overview page state
         */
        getOVPDefaultActions: function (oIntentResponse) {
            var oState = {
                ibnTarget: {
                    semanticObject: oIntentResponse.semanticObject,
                    action: oIntentResponse.action
                },
                ibnParams: {},
                sensitiveProps: []
            };
            return JSON.stringify(oState);
        }
    };
}, /* bExport= */ true);