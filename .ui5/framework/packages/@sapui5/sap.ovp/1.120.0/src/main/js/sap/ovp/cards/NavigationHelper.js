/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/AnnotationHelper",
    "sap/ui/model/odata/AnnotationHelper",
    "sap/ui/model/odata/v4/AnnotationHelper",
    "sap/ui/core/CustomData",
    "sap/ovp/cards/CommonUtils",
    "sap/fe/navigation/SelectionVariant",
    "sap/fe/navigation/PresentationVariant",
    "sap/ovp/cards/jUtils",
    "sap/base/util/merge",
    "sap/base/util/isPlainObject",
    "sap/base/util/isEmptyObject",
    "sap/ovp/app/OVPLogger",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "sap/ui/model/FilterOperator",
    "sap/fe/navigation/library",
    "sap/ui/thirdparty/jquery",
    "sap/ovp/app/resources",
    "sap/m/MessageBox",
    "sap/ovp/helpers/ODataDelegator",
    "sap/ovp/cards/Filterhelper"
], function (
    CardAnnotationHelper,
    OdataAnnotationHelper,
    OdataV4AnnotationHelper,
    CustomData,
    CommonUtils,
    SelectionVariant,
    PresentationVariant,
    jUtils,
    merge,
    isPlainObject,
    isEmptyObject,
    OVPLogger,
    MessageToast,
    CoreLibrary,
    FilterOperator,
    FENavLibrary,
    jQuery,
    OvpResources,
    MessageBox,
    ODataDelegator,
    Filterhelper
) {
    "use strict";

    var oLogger = new OVPLogger("OVP.cards.NavigationHelper");
    var TextDirection = CoreLibrary.TextDirection;

    /**
     * Return navigation entries from an entity
     * @param {sap.ui.model.odata.v2.Context|sap.ui.model.odata.v4.Context} oContext 
     * @param {sap.ui.model.odata.v2.ODataModel|sap.ui.model.odata.v4.ODataModel} oModel
     * @param {object} oEntityType
     * @param {sap.ui.model.json.JSONModel} oCardPropsModel
     * @param {string} sAnnotationPath
     * @param {string} sIdentificationAnnotationPath
     * @returns {Array}
     */
    function getEntityNavigationEntries(
        oContext,
        oModel,
        oEntityType,
        oCardPropsModel,
        sAnnotationPath,
        sIdentificationAnnotationPath
    ) {
        if (!oEntityType) {
            return [];
        }

        var aNavigationFields = [];
        var sCardType = oCardPropsModel.getProperty("/template");
        var bODataV4 = CommonUtils.isODataV4(oModel);
        /**
         * In the case where oContext and sAnnotationPath are undefined, then it is the case of header navigation
         * We check if the card is analytical in this case and check if the relevant semantic object
         * and action are present as part of the KPI annotation and assign it to the navigation fields.
         */
        if (!sAnnotationPath && !oContext) {
            /**
             * If the user has mentioned identification annotation as part of the card settings, then ignore the KPI annotation navigation
             */
            if (!sIdentificationAnnotationPath) {
                var sKpiAnnotationPath = oCardPropsModel.getProperty("/kpiAnnotationPath");
                if (sKpiAnnotationPath && (sCardType === "sap.ovp.cards.charts.analytical" || sCardType === "sap.ovp.cards.v4.charts.analytical")) {
                    var oRecord = bODataV4 ? oEntityType['@' + sKpiAnnotationPath] : oEntityType[sKpiAnnotationPath];
                    var oDetail = oRecord && oRecord.Detail;
                    if (oDetail) {
                        var sSemanticObject = bODataV4 ? oDetail.SemanticObject : oDetail.SemanticObject && oDetail.SemanticObject.String;
                        var sDetailRecordType = bODataV4 ? oDetail.$Type : oDetail.RecordType;
                        var sAction = bODataV4 ? oDetail.Action : oDetail.Action && oDetail.Action.String;
                        if (sDetailRecordType === "com.sap.vocabularies.UI.v1.KPIDetailType" && sSemanticObject && sAction) {
                            aNavigationFields.push({
                                type: sDetailRecordType,
                                semanticObject: sSemanticObject,
                                action: sAction,
                                label: ""
                            });
                        } else {
                            oLogger.error(
                                "Invalid Semantic object and action configured for annotation " +
                                oDetail.RecordType
                            );
                        }
                    } else {
                        throw new Error("KPI does not have a KPIDetailType annotation");
                    }
                }
            }
        }
        if (!sAnnotationPath) {
            var sIdentificationAnnotationPath = oCardPropsModel.getProperty("/identificationAnnotationPath");
            /**
             * In the case of stack card there can be 2 entries for the identification annotation path.
             * The second entry corresponds to the object stream, so we avoid this entry (it is processed separately).
             */
            var aAnnotationPath = sIdentificationAnnotationPath ? sIdentificationAnnotationPath.split(",") : [];
            if (aAnnotationPath && aAnnotationPath.length > 1) {
                sAnnotationPath = aAnnotationPath[0];
            } else {
                sAnnotationPath = sIdentificationAnnotationPath;
            }
        }
        // if we have an array object e.g. we have records
        if (bODataV4) {
            sAnnotationPath = "@" + sAnnotationPath;
        }
        var aRecords = oEntityType[sAnnotationPath];
        if (Array.isArray(aRecords)) {
            // sort the records by Importance - before we initialize the navigation-actions of the card
            aRecords = CardAnnotationHelper.sortCollectionByImportance(aRecords);
            for (var i = 0; i < aRecords.length; i++) {
                var sRecordType = bODataV4 ? aRecords[i].$Type : aRecords[i].RecordType;
                var sLabel = bODataV4 ?
                    aRecords[i].Label :
                    (aRecords[i].Label && aRecords[i].Label.String);

                if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                    var sSemanticObject = bODataV4 ? aRecords[i].SemanticObject : aRecords[i].SemanticObject.String;
                    var sAction = bODataV4 ? aRecords[i].Action : aRecords[i].Action.String;
                    aNavigationFields.push({
                        type: sRecordType,
                        semanticObject: sSemanticObject,
                        action: sAction,
                        label: sLabel || null
                    });
                }
                if (sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" && !aRecords[i].Url.UrlRef) {
                    var oMetaModel = oModel.getMetaModel();

                    var sPath, sBindingString;
                    if (bODataV4) {
                        sPath = oContext ?
                            oContext.getInterface(0).getPath() :
                            "/" + oCardPropsModel.getInterface().getData().entitySet;
                        var oEntityBindingContext = oMetaModel.createBindingContext(sPath);
                        sBindingString = OdataV4AnnotationHelper.format(
                            aRecords[i].Url,
                            { context: oEntityBindingContext }
                        );
                    } else {
                        sPath = oEntityType.$path;
                        var oEntityBindingContext = oMetaModel.createBindingContext(sPath);
                        sBindingString = OdataAnnotationHelper.format(oEntityBindingContext, aRecords[i].Url);
                    }

                    var oCustomData = new CustomData({
                        key: "url",
                        value: sBindingString
                    });
                    /**
                     * In case of analytical cards new analyticalModel is created for aggregated data.
                     * Hence the context data doesn't come from card model
                     * So we have to replace card model with the new analyticalModel which is present in oContext
                     */
                    if (oContext && sCardType === "sap.ovp.cards.charts.analytical") {
                        oModel = oContext.getModel();
                    }
                    oCustomData.setModel(oModel);
                    oCustomData.setBindingContext(oContext);
                    var oUrl = oCustomData.getValue();
                    var sValue = bODataV4 ? aRecords[i].Value : aRecords[i].Value.String;
                    aNavigationFields.push({
                        type: sRecordType,
                        url: oUrl,
                        value: sValue,
                        label: sLabel || null
                    });
                }
            }
        }
        return aNavigationFields;
    }

    /**
     * 
     * @param {sap.ui.model.json.JSONModel} oCardPropertiesModel 
     * @returns {boolean}
     */
    function checkHeaderNavigationDisabledForAnalyticalCard(oCardPropertiesModel) {
        if (!oCardPropertiesModel) {
            return false;
        }
        var template = oCardPropertiesModel.getProperty("/template");
        var navigation = oCardPropertiesModel.getProperty("/navigation");
        return (
            navigation === "noHeaderNav" &&
            [
                "sap.ovp.cards.charts.analytical",
                "sap.ovp.cards.charts.smart.chart",
                "sap.ovp.cards.v4.charts.analytical"
            ].indexOf(template) > -1
        );
    }

    /**
     * 
     * @param {sap.ui.model.odata.v2.ODataModel|sap.ui.model.odata.v4.ODataModel} oModel 
     * @param {Array} aRecords 
     * @returns {boolean}
     */
    function isNavigationInAnnotation(oModel, aRecords) {
        var bODataV4 = CommonUtils.isODataV4(oModel);
        if (aRecords && aRecords.length) {
            for (var i = 0; i < aRecords.length; i++) {
                var oItem = aRecords[i];
                var sRecordType = bODataV4 ? oItem.$Type : oItem.RecordType;
                if (
                    sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" ||
                    sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
                    sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl"
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 
     * @param {sap.ui.model.odata.v2.ODataModel|sap.ui.model.odata.v4.ODataModel} oModel 
     * @param {object} oEntityType 
     * @returns {boolean}
     */
    function checkNavigationForLinkedList(oModel, oEntityType) {
        var bODataV4 = CommonUtils.isODataV4(oModel);
        if (oEntityType) {
            var sAnnotationPath = bODataV4 ?
                "@com.sap.vocabularies.UI.v1.LineItem" :
                "com.sap.vocabularies.UI.v1.LineItem";
            var oLineItemRecords = oEntityType[sAnnotationPath];
            var sRecordType = bODataV4 ?
                oLineItemRecords && oLineItemRecords[0].$Type :
                oLineItemRecords && oLineItemRecords[0].RecordType;

            if (sRecordType) {
                return (
                    sRecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction" ||
                    sRecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl"
                );
            }
        }
        return false;
    }

    /**
     * 
     * @param {sap.ui.model.odata.v2.ODataModel|sap.ui.model.odata.v4.ODataModel} oModel 
     * @param {object} oEntityType 
     * @param {sap.ui.model.json.JSONModel} oCardPropsModel 
     * @returns {boolean}
     */
    function checkLineItemNavigation(oModel, oEntityType, oCardPropsModel) {
        var bODataV4 = CommonUtils.isODataV4(oModel);
        var sAnnotationPath = oCardPropsModel && oCardPropsModel.getProperty("/annotationPath");
        if (oEntityType && sAnnotationPath) {
            sAnnotationPath = bODataV4 ? "@" + sAnnotationPath : sAnnotationPath;
            var aRecords = oEntityType[sAnnotationPath];
            return this.isNavigationInAnnotation(oModel, aRecords);
        }
        return false;
    }

    /**
     * 
     * @param {sap.ui.model.odata.v2.ODataModel|sap.ui.model.odata.v4.ODataModel} oModel 
     * @param {object} oEntityType 
     * @param {sap.ui.model.json.JSONModel} oCardPropertiesModel 
     * @returns {boolean}
     */
    function checkNavigation(oModel, oEntityType, oCardPropertiesModel) {
        var bODataV4 = CommonUtils.isODataV4(oModel);
        var sTemplate = oCardPropertiesModel && oCardPropertiesModel.getProperty("/template");

        if (oEntityType && oCardPropertiesModel) {
            var sIdentificationAnnotationPath = oCardPropertiesModel.getProperty("/identificationAnnotationPath");
            var sAnnotationPath = sIdentificationAnnotationPath;
            /* 
             * In case of Stack Card, there can be two entries for the identification annotation path
             * When more than one IdentificationAnnotationPath exists, they need to be split and assigned accordingly to Stack and Quickview Cards 
             */
            var sContentFragment = oCardPropertiesModel.getProperty("/contentFragment");
            if (sContentFragment === "sap.ovp.cards.stack.Stack" || sContentFragment === "sap.ovp.cards.quickview.Quickview") {
                var aAnnotationPath = sIdentificationAnnotationPath ? sIdentificationAnnotationPath.split(",") : [];
                if (aAnnotationPath && aAnnotationPath.length > 1) {
                    if (sContentFragment === "sap.ovp.cards.stack.Stack") {
                        sAnnotationPath = aAnnotationPath[0];
                    } else {
                        sAnnotationPath = aAnnotationPath[1];
                    }
                }
            }

            var aRecords = bODataV4 ? oEntityType["@" + sAnnotationPath] : oEntityType[sAnnotationPath];
            if (this.isNavigationInAnnotation(oModel, aRecords)) {
                return true;
            }

            if (sTemplate === "sap.ovp.cards.charts.analytical" || sTemplate === "sap.ovp.cards.v4.charts.analytical") {
                // FIXME: verify and check navigation annotation from KPI annotation
                var sKpiAnnotationPath = oCardPropertiesModel.getProperty("/kpiAnnotationPath");
                if (oEntityType && sKpiAnnotationPath) {
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
        } else if (
            oCardPropertiesModel &&
            (sTemplate === "sap.ovp.cards.linklist" || sTemplate === "sap.ovp.cards.v4.linklist") &&
            oCardPropertiesModel.getProperty("/staticContent") &&
            oCardPropertiesModel.getProperty("/targetUri")
        ) {
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {object} oEntityType 
     * @param {sap.fe.navigation.SelectionVariant} oNavSelectionVariant 
     */
    function _removeSensitiveAttributesFromNavSelectionVariantForODataV2Model(oEntityType, oNavSelectionVariant) {
        for (var i = 0; i < oEntityType.property.length; i++) {
            var oProperty = oEntityType.property[i]["com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"];
            var sProperty = oProperty && oProperty.Bool;
            if (sProperty) {
                oNavSelectionVariant.removeSelectOption(oEntityType.property[i].name);
            }
        }
    }

    /**
     * 
     * @param {object} oEntityType 
     * @param {sap.fe.navigation.SelectionVariant} oNavSelectionVariant 
     */
    function _removeSensitiveAttributesFromNavSelectionVariantForODataV4Model(oEntityType, oNavSelectionVariant) {
        for (var key in oEntityType.property) {
            if (typeof oEntityType.property[key] === "object" && oEntityType.property[key].$kind === "Property") {
                var oProperty = oEntityType.property[key];
                var bPotentiallySensitive = oProperty.annotations && oProperty.annotations["@com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] || false;
                if (bPotentiallySensitive) {
                    oNavSelectionVariant.removeSelectOption(key);
                }
            }
        }
    }

    /**
     * 
     * @param {sap.fe.navigation.SelectionVariant} oSelectionVariant 
     * @returns {sap.fe.navigation.SelectionVariant}
     */
    function _removeEmptyStringsFromSelectionVariant(oSelectionVariant) {
        // remove parameters that have empty string
        var aParameters = oSelectionVariant.getParameterNames();
        for (var i = 0; i < aParameters.length; i++) {
            if (oSelectionVariant.getParameter(aParameters[i]) === "") {
                oSelectionVariant.removeParameter(aParameters[i]);
            }
        }

        // remove selection options that have empty string
        var aSelectOptionsPropertyNames = oSelectionVariant.getSelectOptionsPropertyNames();
        for (i = 0; i < aSelectOptionsPropertyNames.length; i++) {
            var aSelectOption = oSelectionVariant.getSelectOption(aSelectOptionsPropertyNames[i]);
            //remove every range in the current select option having empty string
            for (var j = 0; j < aSelectOption.length; j++) {
                if (aSelectOption[j].Low === "" && !aSelectOption[j].High) {
                    aSelectOption.splice(j, 1);
                    j--;
                }
            }
            oSelectionVariant.removeSelectOption(aSelectOptionsPropertyNames[i]);
            // add remaining selection options back to SV after removing empty string
            if (aSelectOption.length > 0) {
                oSelectionVariant.massAddSelectOption(aSelectOptionsPropertyNames[i], aSelectOption);
            }
        }

        return oSelectionVariant;
    }

    /**
     * 
     * @param {object} oActionData 
     * @param {object} mUrlParameters 
     */
    function callFunction(oActionData, mUrlParameters) {
        var sActionText = oActionData.sFunctionLabel || "";
        var mParameters = {
            batchGroupId: "Changes",
            changeSetId: "Changes",
            urlParameters: mUrlParameters,
            forceSubmit: true,
            context: oActionData.oContext,
            functionImport: oActionData.oFunctionImport
        };

        var oPromise = new Promise(function (resolve, reject) {
            var model = oActionData.oContext.getModel();
            var sFunctionImport;
            sFunctionImport = "/" + mParameters.functionImport.name;
            model.callFunction(sFunctionImport, {
                method: mParameters.functionImport.httpMethod,
                urlParameters: mParameters.urlParameters,
                batchGroupId: mParameters.batchGroupId,
                changeSetId: mParameters.changeSetId,
                headers: mParameters.headers,
                success: function (oData, oResponse) {
                    resolve(oResponse);
                },
                error: function (oResponse) {
                    oResponse.actionText = sActionText;
                    reject(oResponse);
                }
            });
        });
        //Todo: call translation on message toast
        oPromise.then(
            function (oResponse) {
                return MessageToast.show(OvpResources.getText("Toast_Action_Success"), {
                    duration: 1000
                });
            },
            function (oError) {
                var errorMessage = CommonUtils.showODataErrorMessages(oError);
                if (errorMessage === "" && oError.actionText) {
                    errorMessage =
                        OvpResources.getText("Toast_Action_Error") +
                        ' "' +
                        oError.actionText +
                        '"' +
                        ".";
                }
                return MessageBox.error(errorMessage, {
                    title: OvpResources.getText("OVP_GENERIC_ERROR_TITLE"),
                    onClose: null,
                    styleClass: "",
                    initialFocus: null,
                    textDirection: TextDirection.Inherit
                });
            }
        );
    }
    /**
     * This function get filter preference for a card from Main.controller.js
     *
     * @param {object} oCompData
     * @returns {undefined|object}
     * @private {object}
     */
    function getFilterPreference(oCompData) {
        var mFilterPreference;
        if (oCompData && oCompData.mainComponent) {
            mFilterPreference = oCompData.mainComponent._getFilterPreference(oCompData.cardId);
        }
        return mFilterPreference;
    }

    /**
     * This function removes invalid filters from Global filters w.r.t filter preference
     *
     * @param {Object} mFilterPreference - Filter Preference
     * @param {sap.fe.navigatio.SelectionVariant} oSelectionVariant - Selection Variant Object
     * @returns {Object}
     * @private
     */
    function removeFilterFromGlobalFilters(mFilterPreference, oSelectionVariant) {
        var aAllPropertyNames = [];
        if (mFilterPreference && mFilterPreference.filterAll === "card") {
            aAllPropertyNames = oSelectionVariant.getSelectOptionsPropertyNames();
        } else if (mFilterPreference && mFilterPreference.cardFilter) {
            aAllPropertyNames = mFilterPreference.cardFilter;
        }

        aAllPropertyNames.forEach(function (sPropertyName) {
            if (sPropertyName !== "$.basicSearch") {
                oSelectionVariant.removeSelectOption(sPropertyName);
            }
        });

        return oSelectionVariant;
    }

    /**
     * This function check's if card filter named sPropertyName is valid
     *
     * @param {Object} mFilterPreference - Filter Preference
     * @param {String} sPropertyName - Card filter name
     * @returns {Boolean}
     * @private
     */
    function _checkIfCardFiltersAreValid(mFilterPreference, sPropertyName) {
        var bFlag = true;
        if (mFilterPreference && mFilterPreference.filterAll === "global") {
            bFlag = false;
        } else if (mFilterPreference && mFilterPreference.globalFilter) {
            if (mFilterPreference.globalFilter.indexOf(sPropertyName) >= 0) {
                bFlag = false;
            }
        }

        return bFlag;
    }

    /**
     * 
     * @param {*} oGlobalFilter 
     * @param {object} oCardSelections 
     * @returns {sap.fe.navigation.SelectionVariant}
     */
    function _buildSelectionVariant(oGlobalFilter, oCardSelections) {
        var oUiState = oGlobalFilter && oGlobalFilter.getUiState({
            allFilters: false
        });
        var sSelectionVariant = oUiState ? JSON.stringify(oUiState.getSelectionVariant()) : "{}";
        var oSelectionVariant = new SelectionVariant(sSelectionVariant); 
        return _updateSelectionVariant(oCardSelections, oSelectionVariant);    
    }

    /**
     *  
     * @param {object} oCardSelections 
     * @param {sap.fe.navigation.SelectionVariant} oSelectionVariant
     * @returns {sap.fe.navigation.SelectionVariant}
     */
    function _updateSelectionVariant(oCardSelections, oSelectionVariant) {
        var oFilter, sValue1, sValue2, oParameter;
        var mFilterPreference = getFilterPreference();
        oSelectionVariant = removeFilterFromGlobalFilters(mFilterPreference, oSelectionVariant);
        var aCardFilters = oCardSelections.filters;
        var aCardParameters = oCardSelections.parameters;

        // Add card filters to selection variant
        for (var i = 0; i < aCardFilters.length; i++) {
            oFilter = aCardFilters[i];
            //value1 might be typeof number, hence we check not typeof undefined
            if (oFilter.path && oFilter.operator && typeof oFilter.value1 !== "undefined") {
                //value2 is optional, hence we check it separately
                sValue1 = oFilter.value1.toString();
                sValue2 = typeof oFilter.value2 !== "undefined" ? oFilter.value2.toString() : undefined;
                if (_checkIfCardFiltersAreValid(mFilterPreference, oFilter.path)) {
                    oSelectionVariant.addSelectOption(
                        oFilter.path,
                        oFilter.sign,
                        oFilter.operator,
                        sValue1,
                        sValue2
                    );
                }
            }
        }
        // Add card parameters to selection variant
        var sName, sNameWithPrefix, sNameWithoutPrefix;
        for (var j = 0; j < aCardParameters.length; j++) {
            oParameter = aCardParameters[j];
            //If parameter name or value is missing, then ignore
            if (!oParameter.path || !oParameter.value) {
                continue;
            }
            sName = oParameter.path.split("/").pop();
            sName = sName.split(".").pop();
            //P_ParameterName and ParameterName should be treated as same
            if (sName.indexOf("P_") === 0) {
                sNameWithPrefix = sName;
                sNameWithoutPrefix = sName.substr(2); // remove P_ prefix
            } else {
                sNameWithPrefix = "P_" + sName;
                sNameWithoutPrefix = sName;
            }

            //If parameter already part of selection variant, this means same parameter came from global
            //filter and we should not send card parameter again, because parameter will always contain
            //single value, multiple parameter values will confuse target application
            if (oSelectionVariant.getParameter(sNameWithPrefix)) {
                continue;
            }
            if (oSelectionVariant.getParameter(sNameWithoutPrefix)) {
                continue;
            }
            oSelectionVariant.addParameter(sName, oParameter.value);
        }
        return oSelectionVariant;
    }

    /**
     * This function connects to custom functions and evaluates custom navigation parameters
     * @param {object} oMainComponent
     * @param {sap.ui.model.json.JSONModel} oCardPropertiesModel
     * @param {object} oContextData
     * @param {object} oSelectionData
     * @param {object} oContextParameters
     * @returns {boolean}
     */
    function processCustomParameters(oMainComponent, oCardPropertiesModel, oContextData, oSelectionData, oContextParameters) {
        if (!oMainComponent || !oCardPropertiesModel) {
            return;
        }
        var sCustomParams;
        if (oContextData && oContextData.bStaticLinkListIndex) {
            var aStaticParameters = oCardPropertiesModel.getProperty("/staticContent");
            sCustomParams = aStaticParameters[oContextData.iStaticLinkListIndex]["customParams"];
            oContextData = null;
        } else {
            sCustomParams = oCardPropertiesModel.getProperty("/customParams");
        }
        //If custom params settings not provided in descriptor or if custom param function
        //not defined in extension, then return without processing
        if (
            !sCustomParams ||
            !oMainComponent.templateBaseExtension.provideCustomParameter ||
            !oMainComponent.onCustomParams
        ) {
            return;
        }
        //The custom extension function onCustomParams should return a custom function
        //based on the descriptor setting sCustomParams
        var fnGetParameters = oMainComponent.templateBaseExtension.provideCustomParameter(sCustomParams)
            ? oMainComponent.templateBaseExtension.provideCustomParameter(sCustomParams)
            : oMainComponent.onCustomParams(sCustomParams);

        if (!fnGetParameters || !jUtils.checkIfFunction(fnGetParameters)) {
            return;
        }
        //Create Copy of input objects so that they are not modified by extension
        var oContextDataCopy = merge({}, oContextData);
        var oSelectionDataCopy = merge({}, oSelectionData);
        var oCustomParams;

        try {
            oCustomParams = fnGetParameters(oContextDataCopy, oSelectionDataCopy);
        } catch (oError) {
            oLogger.error("Could not process custom navigation parameters for the card. Plese check the implementation for the custom parameters extension implementation", oError);
        }

        //Type of oCustomParams should be either object or array
        if (
            !oCustomParams ||
            (!Array.isArray(oCustomParams) && !isPlainObject(oCustomParams))
        ) {
            return;
        }
        //If oCustomParams is object with no properties, then stop processing
        var bIsObject = isPlainObject(oCustomParams);
        if (bIsObject && isEmptyObject(oCustomParams)) {
            return;
        }
        //From 1.54, ignoreEmptyString and selectionVariant are deprecated
        //From 1.54, Use bIgnoreEmptyString and aSelectionVariant
        var bIgnoreEmptyString = bIsObject && (!!oCustomParams.bIgnoreEmptyString || !!oCustomParams.ignoreEmptyString);
        var aCustomSelectionVariant = bIsObject
            ? oCustomParams.aSelectionVariant || oCustomParams.selectionVariant
            : oCustomParams;
        //aCustomSelectionVariant should always be an array of selection variants
        if (!Array.isArray(aCustomSelectionVariant)) {
            return;
        }
        //Process the custom selection variants
        var i, iLength, oCustomSelectionVariant, sPath, sValue1, sValue2;
        iLength = aCustomSelectionVariant.length;
        for (i = 0; i < iLength; i++) {
            oCustomSelectionVariant = aCustomSelectionVariant[i];
            if (!oCustomSelectionVariant) {
                continue;
            }
            sPath = oCustomSelectionVariant.path;
            sValue1 = oCustomSelectionVariant.value1;
            sValue2 = oCustomSelectionVariant.value2;
            //Property path is mandatory
            if (!sPath || typeof sPath !== "string" || sPath === "") {
                oLogger.error("Custom Variant property path '" + sPath + "' should be valid string");
                continue;
            }
            //Value1 is mandatory except when ignore is set explicitly.
            //0 is allowed, "" is allowed.
            if (
                !(
                    sValue1 ||
                    sValue1 === 0 ||
                    sValue1 === false ||
                    sValue1 === ""
                )
            ) {
                continue;
            }
            sValue1 = sValue1.toString();
            sValue2 = sValue2 && sValue2.toString();
            //Update oSelectionData and oContextData. Since they are object references, they will also get
            //updated in calling function
            if (oContextData) {
                delete oContextData[sPath];
            }
            if (oContextParameters) {
                delete oContextParameters[sPath];
            }
            if (sValue1 === "" && bIgnoreEmptyString) {
                oSelectionData.removeSelectOption(sPath);
            }
            oSelectionData.addSelectOption(
                sPath,
                oCustomSelectionVariant.sign,
                oCustomSelectionVariant.operator,
                sValue1,
                sValue2
            );

        }
        //Remove selections with empty strings in value field, object reference is passed so object is modified directly
        //Only oSelectionData is modified, oContextData will be taken care later by function mixAttributesAndSelectionVariant
        if (bIgnoreEmptyString) {
            _removeEmptyStringsFromSelectionVariant(oSelectionData);
        }
        return bIgnoreEmptyString;
    }
    /**
    * Returns contextParameters object when entity is from OData V2 service
    * @param {object} mContext 
    * @param {object} oEntityType 
    * @returns {object}
    */
    function getContextParametersForV2(mContext, oEntityType) {
        var mContextParameters = {};
        for (var i = 0; oEntityType.property && i < oEntityType.property.length; i++) {
            var key = oEntityType.property[i].name;
            var vAttributeValue = mContext[key];

            if (mContext.hasOwnProperty(key)) {
                if (Array.isArray(mContext[key]) && mContext[key].length === 1) {
                    mContextParameters[key] = mContext[key][0];
                } else if (jQuery.type(vAttributeValue) !== "object") {
                    mContextParameters[key] = vAttributeValue;
                }
            }
        }
        return mContextParameters;
    }
    /**
   * Returns contextParameters object when entity is from OData V4 service
   * @param {object} mContext 
   * @param {object} oEntityType 
   * @returns {object}
   */
    function getContextParametersForV4(mContext, oEntityType) {
        var mContextParameters = {};
        for (var prop in oEntityType.property) {
            var vAttributeValue = mContext[prop];

            if (mContext.hasOwnProperty(prop)) {
                if (Array.isArray(mContext[prop]) && mContext[prop].length === 1) {
                    mContextParameters[prop] = mContext[prop][0];
                } else if (jQuery.type(vAttributeValue) !== "object") {
                    mContextParameters[prop] = vAttributeValue;
                }
            }
        }
        return mContextParameters;
    }

    /**
     * Returns an object with selection and presentation variant if filter bar is SFB, promise with selection variant in case if filter bar is macro
     * 
     * @param {object} oMainComponent 
     * @param {sap.ui.model.odata.v2.ODataModel} oModel 
     * @param {object} oComponentData 
     * @param {sap.ui.model.json.JSONModel} oCardPropertiesModel 
     * @param {object} oEntityType 
     * @param {object} oEntity 
     * @param {object} oCustomParameters 
     * @param {object} oContext 
     * @returns {object}
     */
    function getEntityNavigationParameters(oMainComponent, oModel, oComponentData, oCardPropertiesModel, oEntityType, oEntity, oCustomParameters, oContext) {
        var oContextParameters = {};
        var oPresentationVariant, oStaticParameters;
        
        var oGlobalFilter = oComponentData ? oComponentData.globalFilter : undefined;
        var oStaticLinkList = oCardPropertiesModel && oCardPropertiesModel.getProperty("/staticContent");
        var bODataV4 = CommonUtils.isODataV4(oModel);
        var oMacroFilterBar = oMainComponent.oMacroFilterBar;

        if (!oStaticLinkList) {
            var oCardSelections = CardAnnotationHelper.getCardSelections(oCardPropertiesModel, bODataV4);
            var aCardFilters = oCardSelections.filters;
            var aCardParameters = oCardSelections.parameters;
            oStaticParameters = oCardPropertiesModel && oCardPropertiesModel.getProperty("/staticParameters");
            // When filters are passed as navigation params, '/' should be replaced with '.' Eg. to_abc/xyz should be to_abc.xyz
            aCardFilters &&
                aCardFilters.forEach(function (oCardFilter) {
                    oCardFilter.path = oCardFilter.path && oCardFilter.path.replace("/", ".");
                    // NE operator is not supported by selction variant. so we are changing it to exclude with EQ operator.
                    // Contains operator is not supported by selection variant. so we are changing it to CP operator
                    Filterhelper.transformExcludeOperationForNavigation(oCardFilter);

                    switch (oCardFilter.operator) {
                        case FilterOperator.Contains:
                            oCardFilter.operator = "CP";
                            var sValue = oCardFilter.value1;
                            oCardFilter.value1 = "*" + sValue + "*";
                            break;
                        case FilterOperator.EndsWith:
                            oCardFilter.operator = "CP";
                            var sValue = oCardFilter.value1;
                            oCardFilter.value1 = "*" + sValue;
                            break;
                        case FilterOperator.StartsWith:
                            oCardFilter.operator = "CP";
                            var sValue = oCardFilter.value1;
                            oCardFilter.value1 = sValue + "*";
                    }
                });
            oCardSelections.filters = aCardFilters;

            // On click of other section in donut card pass the dimensions which are shown as selection variant with exclude value
            if (oContext && oEntity && oEntity.hasOwnProperty("$isOthers")) {
                var oDimensions = oContext.getOtherNavigationDimensions();
                for (var key in oDimensions) {
                    var aDimensionValues = oDimensions[key];
                    for (var i = 0; i < aDimensionValues.length; i++) {
                        oCardSelections.filters.push({
                            path: key,
                            operator: "EQ",
                            value1: aDimensionValues[i],
                            sign: "E"
                        });
                    }
                }
            }

            aCardParameters && aCardParameters.forEach(function (oCardParameter) {
                oCardParameter.path = oCardParameter.path && oCardParameter.path.replace("/", ".");
            });
            oCardSelections.parameters = aCardParameters;
            var oCardSorters = CardAnnotationHelper.getCardSorters(oCardPropertiesModel, bODataV4);
            // Build result object of card parameters
            if (oEntity) {
                oContextParameters = bODataV4 ? getContextParametersForV4(oEntity, oEntityType) : getContextParametersForV2(oEntity, oEntityType);
            }
            // Add the KPI ID to the navigation parameters if it's present
            var sKpiAnnotationPath = oCardPropertiesModel && oCardPropertiesModel.getProperty("/kpiAnnotationPath");
            var sCardType = oCardPropertiesModel && oCardPropertiesModel.getProperty("/template");
            if (sKpiAnnotationPath && (sCardType === "sap.ovp.cards.charts.analytical" || sCardType === "sap.ovp.cards.v4.charts.analytical")) {
                var oRecord = !bODataV4 ? oEntityType[sKpiAnnotationPath] : oEntityType['@' + sKpiAnnotationPath];
                var oDetail = oRecord && oRecord.Detail;
                if (!bODataV4 && oDetail && oDetail.RecordType === "com.sap.vocabularies.UI.v1.KPIDetailType" ) {
                    oContextParameters["kpiID"] = oRecord.ID.String;
                } else if (oDetail && oDetail.$Type === "com.sap.vocabularies.UI.v1.KPIDetailType") {
                    oContextParameters["kpiID"] = oRecord.ID;
                }
            }
            // Build selection variant object from global filter, card filter and card parameters
            oPresentationVariant = oCardSorters && new PresentationVariant(oCardSorters);
            if (oMacroFilterBar) {
                return oMacroFilterBar.getSelectionVariant().then(function (oSelVariant) {
                    var oSelectionVariant = _updateSelectionVariant(oCardSelections, oSelVariant);
                    return _processCustomParameters(oCustomParameters, oMainComponent, oCardPropertiesModel, oSelectionVariant, oContextParameters, oEntityType, oModel, oPresentationVariant, oStaticParameters);
                }.bind());
            } else {
                var oSelectionVariant = this._buildSelectionVariant(oGlobalFilter, oCardSelections);
                return this._processCustomParameters(oCustomParameters, oMainComponent, oCardPropertiesModel, oSelectionVariant, oContextParameters, oEntityType, oModel, oPresentationVariant, oStaticParameters);
            }
        } else {
            var oSelectionVariant, oStaticParameters;
            if (oMacroFilterBar) {
                return oMacroFilterBar.getSelectionVariant().then(function (oSelVariant) {
                    oSelectionVariant = _removeFilters(oComponentData, oSelVariant);
                    oStaticParameters = _getStaticParameters(oStaticLinkList, oCustomParameters);
                    return _processCustomParameters(oCustomParameters, oMainComponent, oCardPropertiesModel, oSelVariant, oContextParameters, oEntityType, oModel, oPresentationVariant, oStaticParameters);
                });
            } else {
                var oUiState = oGlobalFilter && oGlobalFilter.getUiState({
                    allFilters: false
                });
                var sSelectionVariant = oUiState ? JSON.stringify(oUiState.getSelectionVariant()) : "{}";
                oSelectionVariant = new SelectionVariant(sSelectionVariant); 
                oSelectionVariant = _removeFilters(oComponentData, oSelectionVariant);
                oStaticParameters = _getStaticParameters(oStaticLinkList, oCustomParameters);
                return _processCustomParameters(oCustomParameters, oMainComponent, oCardPropertiesModel, oSelectionVariant, oContextParameters, oEntityType, oModel, oPresentationVariant, oStaticParameters); 
            } 
        }
    }
     /**
     * Returns selection variant object
     * 
     * @param {object} oComponentData 
     * @param {sap.fe.navigation.SelectionVariant} oSelectionVariant
     * @returns {object}
     */
    function _removeFilters(oComponentData, oSelectionVariant) {
        var oCompData = oComponentData || null;
        var mFilterPreference = getFilterPreference(oCompData);
        return removeFilterFromGlobalFilters(mFilterPreference, oSelectionVariant);
    }

     /**
     * Returns static parameters object
     * 
     * @param {object} oStaticLinkList 
     * @param {object} oCustomParameters 
     * @returns {object}
     */
    function _getStaticParameters(oStaticLinkList, oCustomParameters) {
        if (oStaticLinkList[oCustomParameters.iStaticLinkListIndex].params) {
            //Backward compatibility (params)
            return oStaticLinkList[oCustomParameters.iStaticLinkListIndex].params;
        } else if (oStaticLinkList[oCustomParameters.iStaticLinkListIndex].staticParameters) {
            //to sync with other cards (staticParameters)
            return oStaticLinkList[oCustomParameters.iStaticLinkListIndex].staticParameters;
        }
    }

    /**
     * Returns an object with selection and presentation variant
     * 
     * @param {object} oCustomParameters
     * @param {object} oMainComponent 
     * @param {sap.ui.model.json.JSONModel} oCardPropertiesModel
     * @param {sap.fe.navigation.SelectionVariant} oSelectionVariant
     * @param {object} oContextParameters
     * @param {object} oEntityType 
     * @param {sap.ui.model.odata.v2.ODataModel} oModel 
     * @param {object} oPresentationVariant
     * @param {object} oStaticParameters
     * @returns {object}
    */
    function _processCustomParameters(oCustomParameters, oMainComponent, oCardPropertiesModel, oSelectionVariant, oContextParameters, oEntityType, oModel, oPresentationVariant, oStaticParameters) {
        //Process Custom parameters
        var bIgnoreEmptyString;
        var oMacroFilterBar = oMainComponent.oMacroFilterBar;
        if (oCustomParameters && !oCustomParameters.bStaticLinkListIndex) {
            //Only in case of custom navigation in analytical cards
            bIgnoreEmptyString = processCustomParameters(oMainComponent, oCardPropertiesModel, oCustomParameters, oSelectionVariant, oContextParameters);
        } else if (oCustomParameters && oCustomParameters.bStaticLinkListIndex) {
            bIgnoreEmptyString = processCustomParameters(oMainComponent, oCardPropertiesModel, oCustomParameters, oSelectionVariant, oContextParameters);
        } else {
            bIgnoreEmptyString = processCustomParameters(oMainComponent, oCardPropertiesModel, oCustomParameters, oSelectionVariant, oContextParameters);
        }
        var iSuppressionBehavior = bIgnoreEmptyString ? FENavLibrary.SuppressionBehavior.ignoreEmptyString : undefined;

        //If there is a clash of static parameters with context or selection parameters, then static
        //parameters get lowest priority, If any value for oContextParameters[key] is already set, static parameter should not overwrite it
        if (oStaticParameters) {
            for (var key in oStaticParameters) {
                if (!oContextParameters.hasOwnProperty(key)) {
                    oContextParameters[key] = oStaticParameters[key];
                }
            }
        }
        for (var sParameter in oContextParameters) {
            var aPropertiesMetadata = ODataDelegator.getPropertyFromEntityType(sParameter, oEntityType, oModel);
            var oPropertyMetadata = aPropertiesMetadata.length > 0 ? aPropertiesMetadata[0] : {};
            var bIsNullable = oPropertyMetadata && oPropertyMetadata.nullable;
            if (oContextParameters[sParameter] === null && bIsNullable === "true") {
                oSelectionVariant.addSelectOption(sParameter, "I", "EQ", "", null);
                delete oContextParameters[sParameter];
            }
        }
        var oNavigationHandler = CommonUtils.getNavigationHandler();
        var oNavSelectionVariant = oNavigationHandler &&
                oNavigationHandler.mixAttributesAndSelectionVariant(
                    oContextParameters,
                    oSelectionVariant.toJSONString(),
                    iSuppressionBehavior
                );

        var oStaticLinkList = oCardPropertiesModel && oCardPropertiesModel.getProperty("/staticContent");
        // remove selection Variant property which are marked sensitive
        if (!oStaticLinkList) {
            if (oMacroFilterBar) {
                _removeSensitiveAttributesFromNavSelectionVariantForODataV4Model(oEntityType, oNavSelectionVariant);
            } else {
                this._removeSensitiveAttributesFromNavSelectionVariantForODataV2Model(oEntityType, oNavSelectionVariant);
            }
        }
        return {
            sNavSelectionVariant: oNavSelectionVariant ? oNavSelectionVariant.toJSONString() : null,
            sNavPresentationVariant: oPresentationVariant ? oPresentationVariant.toJSONString() : null
        };
    }
    
    return {
        _checkIfCardFiltersAreValid: _checkIfCardFiltersAreValid,
        processCustomParameters: processCustomParameters,
        _removeSensitiveAttributesFromNavSelectionVariantForODataV2Model: _removeSensitiveAttributesFromNavSelectionVariantForODataV2Model,
        _removeSensitiveAttributesFromNavSelectionVariantForODataV4Model: _removeSensitiveAttributesFromNavSelectionVariantForODataV4Model,
        _removeEmptyStringsFromSelectionVariant: _removeEmptyStringsFromSelectionVariant,
        _buildSelectionVariant: _buildSelectionVariant,
        getEntityNavigationEntries: getEntityNavigationEntries,
        checkHeaderNavigationDisabledForAnalyticalCard: checkHeaderNavigationDisabledForAnalyticalCard,
        isNavigationInAnnotation: isNavigationInAnnotation,
        checkNavigationForLinkedList: checkNavigationForLinkedList,
        checkLineItemNavigation: checkLineItemNavigation,
        checkNavigation: checkNavigation,
        callFunction: callFunction,
        getFilterPreference: getFilterPreference,
        removeFilterFromGlobalFilters: removeFilterFromGlobalFilters,
        getEntityNavigationParameters: getEntityNavigationParameters,
        getContextParametersForV2: getContextParametersForV2,
        getContextParametersForV4: getContextParametersForV4,
        _processCustomParameters: _processCustomParameters,
        _updateSelectionVariant: _updateSelectionVariant,
        _removeFilters: _removeFilters,
        _getStaticParameters: _getStaticParameters
    };
});