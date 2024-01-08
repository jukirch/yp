/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/fe/navigation/PresentationVariant",
    "sap/ovp/cards/AnnotationHelper",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/insights/helpers/Filters",
    "sap/ovp/helpers/ODataAnnotationHelper",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/app/OVPLogger"
], function (
    PresentationVariant,
    CardAnnotationHelper,
    CommonUtils,
    Filterhelper,
    ODataAnnotationHelper,
    CardsNavigationHelper,
    OVPLogger
) {
    "use strict";
    var oLogger = new OVPLogger("OVP.app.NavigationHelper");

    function getNavigationIntentFromAuthString(sAuthString) {
        if (sAuthString.startsWith("#")) {
            sAuthString = sAuthString.slice(1);
        }

        var aAuth = sAuthString.split("-");
        var sSemanticObject = aAuth[0] || "";
        var sAction = aAuth[1] ? aAuth[1].split("?")[0] : "";
        var oQueryMap = {};

        var sQueryParameters = aAuth[1] ? aAuth[1].split("?")[1] : undefined;
        if (sQueryParameters) {
            var aQueryParameters = sQueryParameters.split("&");
            for (var i = 0; i < aQueryParameters.length; i++) {
                var sQuery = aQueryParameters[i];
                var sParam = sQuery.split("=")[0];
                var sValue = sQuery.split("=")[1];
                oQueryMap[sParam] = sValue;
            }
        }
        return {
            semanticObject: sSemanticObject,
            action: sAction,
            parameters: oQueryMap
        };
    }

    function bCheckNavigationForCard(oController) {
        if (!oController) {
            return false;
        }

        var oEntityType = oController.getEntityType();
        var oCardPropertiesModel = oController.getCardPropertiesModel();

        if (oEntityType && oCardPropertiesModel) {
            var sIdentificationAnnotationPath = oCardPropertiesModel.getProperty("/identificationAnnotationPath");
            var aRecords = ODataAnnotationHelper.getRecords(oEntityType, sIdentificationAnnotationPath, oController.getView().getModel());
            var oModel = oController.getModel();
            if (CardsNavigationHelper.isNavigationInAnnotation(oModel, aRecords)) {
                return true;
            }
        }

        var sCardType = oCardPropertiesModel && oCardPropertiesModel.getProperty("/template");
        var aLineItemSupportedCardTemplates = ["sap.ovp.cards.table", "sap.ovp.cards.list", "sap.ovp.cards.v4.table", "sap.ovp.cards.v4.list"];
        return (
            aLineItemSupportedCardTemplates.indexOf(sCardType) > -1 && 
            CardsNavigationHelper.checkLineItemNavigation(
                oController.getModel(), 
                oController.getEntityType(), 
                oCardPropertiesModel)
        );
    }

    function getUpdatedNavigationContext(oHeaderNavigationContext, oLineItemNavigationContext) {
        if (oLineItemNavigationContext.semanticObject &&
            oLineItemNavigationContext.action &&
            oHeaderNavigationContext.semanticObject &&
            oHeaderNavigationContext.action) {
            oHeaderNavigationContext["lineItemSemanticObject"] = oLineItemNavigationContext.semanticObject;
            oHeaderNavigationContext["lineItemAction"] = oLineItemNavigationContext.action;
        } else if (oLineItemNavigationContext.semanticObject &&
            oLineItemNavigationContext.action) {
            oLineItemNavigationContext["lineItemSemanticObject"] = oLineItemNavigationContext.semanticObject;
            oLineItemNavigationContext["lineItemAction"] = oLineItemNavigationContext.action;
            oLineItemNavigationContext.semanticObject = "";
            oLineItemNavigationContext.action = "";
            return oLineItemNavigationContext;
        }
        return oHeaderNavigationContext;
    }

    function getNavigationParameters(oController, oCardDefinition) {
        var oCardPropertiesModel = oController.getCardPropertiesModel();
        var aNavigationFields = CardsNavigationHelper.getEntityNavigationEntries(
            null,
            oController.getModel(),
            oController.getEntityType(),
            oCardPropertiesModel
        ) || [];
        var oNavigationField = aNavigationFields.length > 0 ? aNavigationFields[0] : {};

        if (oCardDefinition.cardComponentName === "List" || oCardDefinition.cardComponentName === "Table") {
            var oCardItemsBinding = oController.getCardItemsBinding(),
                oLineItemContexts = oCardItemsBinding && oCardItemsBinding.getAllCurrentContexts(),
                oCurrentContext = oLineItemContexts && oLineItemContexts[0],
                aLineItemNavigationFields =
                    CardsNavigationHelper.getEntityNavigationEntries(
                        oCurrentContext,
                        oController.getModel(),
                        oController.getEntityType(),
                        oCardPropertiesModel,
                        oCardPropertiesModel.getProperty("/annotationPath")
                    ),
                oLineItemNavigationField = aLineItemNavigationFields.length > 0 ? aLineItemNavigationFields[0] : {};

            var oNavigationContextLineItem = {};
            var oNavigationContext = {};
            var pNavigationContextLineItem, pNavigationContext;

            if (oNavigationField && oNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
                pNavigationContext = _getNavigationWithUrlParamters(oController, oNavigationField);
            } else if (oNavigationField && oNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                oNavigationContext = _getNavigationWithIntent(oController, oNavigationField);
            }
            if (oLineItemNavigationField && oLineItemNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
                pNavigationContextLineItem = _getNavigationWithUrlParamters(oController, oLineItemNavigationField);
            } else if (oLineItemNavigationField && oLineItemNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                oNavigationContextLineItem = _getNavigationWithIntent(oController, oLineItemNavigationField);
            }
            return Promise.all([pNavigationContext, pNavigationContextLineItem]).then(function (aResult) {
                var oHeaderNavigationContext = aResult && aResult[0] || oNavigationContext,
                    oLineItemNavigationContext = aResult && aResult[1] || oNavigationContextLineItem;
                return getUpdatedNavigationContext(oHeaderNavigationContext, oLineItemNavigationContext);
            });
        } else {
            if (oNavigationField && oNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
                return _getNavigationWithUrlParamters(oController, oNavigationField).then(function (oNavigationVal) {
                    return oNavigationVal;
                });
            }

            if (oNavigationField && oNavigationField.type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                var oNavigationIntent = _getNavigationWithIntent(oController, oNavigationField);
                return Promise.resolve(oNavigationIntent);
            }
        }

        // TODO: KPI detail type
    }

    function _getNavigationWithUrlParamters(oController, oNavigationField) {
        if (!sap.ushell.Container) {
            return;
        }

        return sap.ushell.Container.getServiceAsync("URLParsing").then(function (oURLParsingService) {
            return oURLParsingService.isIntentUrlAsync(oNavigationField.url).then(function (bValidIntent) {
                if (bValidIntent) {
                    var oNav = _getNavigationWithIntent(oController, oNavigationField);
                    if (oNav.semanticObject) {
                        return oNav;
                    } else {
                        var oParsedShellHash = oURLParsingService.parseShellHash(oNavigationField.url);
                        //Url can also contain an intent based navigation with route, route can be static or dynamic with paramters
                        //Url navigation without app specific route will trigger storing of appstate
                        // var bWithRoute = oParsedShellHash.appSpecificRoute ? true : false;
                        return _getNavigationWithIntent(oController, oParsedShellHash);
                    }
                }
                return {
                    type: "url",
                    url: oNavigationField.url
                };
            });
        }).catch(function (oError) {
            oLogger.error(oError);
        });
    }

    function getStaticParams(oController) {
        var oAllData = _getEntityNavigationParameters(oController);
        var oPresentationVariant = oAllData && oAllData["sNavPresentationVariant"];
        if (oPresentationVariant && !CommonUtils.isJSONData(oPresentationVariant)) {
            oAllData["sNavPresentationVariant"] = Filterhelper.removeExtraInfoVariant(oPresentationVariant);
        }
        return oAllData;
    }

    function _getSensitivePropertiesEntityType(oEntityType) {
        var aSensitiveProps = [];
        for (var i = 0; i < oEntityType.property.length; i++) {
            if (oEntityType.property[i]["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] &&
                oEntityType.property[i]["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"].Bool) {
                aSensitiveProps.push(oEntityType.property[i].name);
            }
        }
        return aSensitiveProps;
    }

    function _getEntityNavigationParameters(oController) {
        var oCardPropertiesModel = oController.getCardPropertiesModel(),
            oStaticLinkList = oCardPropertiesModel && oCardPropertiesModel.getProperty("/staticContent");
        var oStaticParameters, oPresentationVariant;
        var oModel = oController.getModel();
        var bODataV4 = CommonUtils.isODataV4(oModel);

        if (!oStaticLinkList) {
            var oCardSorters = CardAnnotationHelper.getCardSorters(
                oController.getCardPropertiesModel(),
                bODataV4
            );
            var oEntityType = oController.getEntityType();

            oPresentationVariant = oCardSorters && new PresentationVariant(oCardSorters);
            oStaticParameters = oCardPropertiesModel && oCardPropertiesModel.getProperty("/staticParameters");
        }

        var aSensitiveProps = _getSensitivePropertiesEntityType(oEntityType);

        return {
            sensitiveProperties: aSensitiveProps,
            staticPropertyMap: oStaticParameters,
            sNavPresentationVariant: oPresentationVariant ? oPresentationVariant.toJSONObject() : null
        };
    }

    function _getNavigationWithIntent(oController, oNavigationField) {
        return {
            type: "intent",
            semanticObject: oNavigationField.semanticObject,
            action: oNavigationField.action,
            staticParams: getStaticParams(oController)
        };
    }

    function checkIBNNavigationInAnnotation (aAnnotationRecords, oEntityModel) {
        if (aAnnotationRecords && aAnnotationRecords.length) {
            var bOdataV4Model = CommonUtils.isODataV4(oEntityModel);
            for (var i = 0; i < aAnnotationRecords.length; i++) {
                var oItem = aAnnotationRecords[i];
                if (bOdataV4Model && oItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                    return true;
                } else if (!bOdataV4Model && oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                    return true;
                }
            }
        }
        return false;
    }

    function checkIdentificationAnnotationNavigation(oCardPropsModel, oEntityType, oEntityModel) {
        if (oEntityType && oCardPropsModel) {
            var sIdentificationAnnotationPath = oCardPropsModel.getProperty("/identificationAnnotationPath");
            var aRecords = ODataAnnotationHelper.getRecords(oEntityType, sIdentificationAnnotationPath, oEntityModel);
            return checkIBNNavigationInAnnotation(aRecords, oEntityModel);
        }
        return false;
    }

    function checkKPIAnnotationNavigation(oCardPropsModel, oEntityType) {
        if (oEntityType && oCardPropsModel) {
            if (oCardPropsModel.getProperty("/template") === "sap.ovp.cards.charts.analytical") {

                var sKpiAnnotationPath = oCardPropsModel.getProperty("/kpiAnnotationPath");

                if (sKpiAnnotationPath) {
                    var oRecord = oEntityType[sKpiAnnotationPath];
                    if (oRecord && oRecord.Detail) {
                        var sSemanticObject = oRecord.Detail.SemanticObject && oRecord.Detail.SemanticObject.String;
                        var sAction = oRecord.Detail.Action && oRecord.Detail.Action.String;
                        if (sSemanticObject && sAction) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function checkLineItemNavigation(oCardPropsModel, oEntityType, oEntityModel) {
        if (oEntityType && oCardPropsModel) {
            var sAnnotationPath = oCardPropsModel.getProperty("/annotationPath");
            var aRecords = ODataAnnotationHelper.getRecords(oEntityType, sAnnotationPath, oEntityModel);
            return checkIBNNavigationInAnnotation(aRecords, oEntityModel);
        }
        return false;
    }


    return {
        getNavigationIntentFromAuthString: getNavigationIntentFromAuthString,
        bCheckNavigationForCard: bCheckNavigationForCard,
        getNavigationParameters: getNavigationParameters,
        checkLineItemNavigation: checkLineItemNavigation,
        checkIdentificationAnnotationNavigation: checkIdentificationAnnotationNavigation,
        checkKPIAnnotationNavigation: checkKPIAnnotationNavigation,
        getStaticParams:getStaticParams
    };
},/* bExport= */true);