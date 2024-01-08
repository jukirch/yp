/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * Any function that needs to be exported(used outside this file) via namespace should be defined as
 * a function and then added to the return statement at the end of this file
 */
sap.ui.define([
    "sap/ovp/cards/CommonUtils",
    "sap/ui/model/odata/v4/AnnotationHelper",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/helpers/V4/MetadataAnalyzer",
    "sap/ovp/cards/AnnotationHelper",
    "sap/ovp/cards/Filterhelper"
], function (
    CommonUtils,
    OdataAnnotationHelper,
    MetadataAnalyser,
    V4MetadataAnalyzer,
    CardAnnotationHelper,
    Filterhelper
) {
    "use strict";

    var ANNOTATIONTYPE = {
        TEXT: "com.sap.vocabularies.Common.v1.Text",
        TEXT_ARRANGEMENT: "com.sap.vocabularies.UI.v1.TextArrangement",
        UOM: "Org.OData.Measures.V1.Unit",
        ISO_CURRENCY: "Org.OData.Measures.V1.ISOCurrency"
    };

    var TextArrangementType = {
        TEXT_LAST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast",
        TEXT_FIRST: "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst",
        TEXT_ONLY: "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly",
        TEXT_SEPARATE: "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate"
    };

    function formatDataField(iContext, aCollection, index) {
        var item = CardAnnotationHelper.getSortedDataFields(iContext, aCollection)[index];
        if (item) {
            return formatField(iContext, item);
        }
        return "";
    }

    function formatDataPoint(iContext, aCollection, index, dontIncludeUOM) {
        var item = CardAnnotationHelper.getSortedDataPoints(iContext, aCollection)[index];
        if (!item) {
            return "";
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatDataPoint(iContext, item, oEntityType, oMetaModel, dontIncludeUOM);
    }

    function _formatDataPoint(iContext, oItem, oEntityType, oMetaModel, dontIncludeUOM) {
        if (!oItem || !oItem.Value) {
            return "";
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var bIgnoreSapText = false;
        if (oModel) {
            var bExtractedIgnoreSapText = oModel.getProperty("/ignoreSapText");
            bIgnoreSapText = bExtractedIgnoreSapText == undefined ? bIgnoreSapText : bExtractedIgnoreSapText;
        }
        var oEntityTypeAnnotation = oMetaModel.getData()["$Annotations"][oEntityType.$Type + "/" + oItem.Value.$Path];

        //Support sap:aggregation-role=measure configuration
        var bMeasuresType = false;
        if (bIgnoreSapText == true) {
            //as part of supporting V4 annotation
            if (
                oEntityTypeAnnotation &&
                (oEntityTypeAnnotation["@com.sap.vocabularies.Analytics.v1.Measure"] ||
                    oEntityTypeAnnotation["sap:aggregation-role"] == "measure")
            ) {
                bMeasuresType = true;
            }
        }

        //Support sap:text attribute
        if (!bMeasuresType && oEntityTypeAnnotation) {
            var txtValue;
            if (oEntityTypeAnnotation[ANNOTATIONTYPE.TEXT]) {
                //as part of supporting V4 annotation
                txtValue = oEntityTypeAnnotation[ANNOTATIONTYPE.TEXT]
                    ? oEntityTypeAnnotation[ANNOTATIONTYPE.TEXT]
                    : oEntityTypeAnnotation[ANNOTATIONTYPE.TEXT].$Path;
            } else if (oEntityTypeAnnotation["sap:text"]) {
                txtValue = oEntityTypeAnnotation["sap:text"];
            }
            if (txtValue) {
                oItem = {
                    Value: {
                        $Path: txtValue
                    }
                };
            }
        }
        return formatField(iContext, oItem, dontIncludeUOM);
    }

    function formatField(iContext, item, bDontIncludeUOM, bIncludeOnlyUOM) {
        if (item.Value.Apply) {
            return OdataAnnotationHelper.format(iContext, item.Value);
        }

        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");

        return _formatField(iContext, item, oEntityType, oMetaModel, bDontIncludeUOM, bIncludeOnlyUOM);
    }
    formatField.requiresIContext = true;

    /**
     * This function checks if the given property (oProperty)
     * has a text annotation associated with it, if yes it returns the appropriate binding
     * based on the textArrangement annotation, the default is TEXT_LAST
     * @param oEntityType  OPTIONAL
     * @param oProperty    MANDATORY
     * @param sIdBinding   MANDATORY
     * @returns String
     */
    function getTextArrangementBinding(iContext, oEntityType, oProperty, sIdBinding) {
        var iContext = !iContext.getPath() ? iContext.getInterface(0) : iContext;
        if (!oProperty || typeof sIdBinding !== "string") {
            return sIdBinding;
        }
        // Get Text Arrangement annotation
        var oText = oProperty.annotations && oProperty.annotations["@" + ANNOTATIONTYPE.TEXT];
        var aNavigationPropertyBindings = [];

        if (oEntityType && oEntityType.$NavigationPropertyBinding) {
            aNavigationPropertyBindings = Object.keys(oEntityType.$NavigationPropertyBinding);
        }
        // No Text found to be used in Text Arrangement
        if (!oText || aNavigationPropertyBindings.indexOf(oText && oText.$Path && oText.$Path.split("/")[0]) === -1){
            return sIdBinding;
        }
        var oTextArrangement, sTextArrangementType;
        // Text Arrangement annotation can be at property level, text level or entity level
        // 1. check TextArrangement definition for property - Priority 1 (max)
        oTextArrangement = oProperty.annotations["@" + ANNOTATIONTYPE.TEXT + "@" + ANNOTATIONTYPE.TEXT_ARRANGEMENT];
        sTextArrangementType = oTextArrangement && oTextArrangement.$EnumMember;

        // 2. check TextArrangement definition under property/text - Priority 2
        if (!sTextArrangementType) {
            oTextArrangement = oText && oText["@" + ANNOTATIONTYPE.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.$EnumMember;
        }
        // 3. check TextArrangement definition for entity type - Priority 3 (min)
        if (!sTextArrangementType) {
            oTextArrangement = oEntityType && oEntityType[ANNOTATIONTYPE.TEXT_ARRANGEMENT];
            sTextArrangementType = oTextArrangement && oTextArrangement.$EnumMember;
        }
        var sDescriptionBinding = OdataAnnotationHelper.format(oText, { context: iContext });
        //No Text Binding found
        if (!sDescriptionBinding || sDescriptionBinding === " ") {
            return sIdBinding;
        }
        //No Text Arrangement found then append it to property
        if (!sTextArrangementType) {
            return sIdBinding + " (" + sDescriptionBinding + ")";
        }
        var sFinalBinding;
        switch (sTextArrangementType) {
            case TextArrangementType.TEXT_FIRST:
                sFinalBinding = sDescriptionBinding + " (" + sIdBinding + ")";
                break;
            case TextArrangementType.TEXT_LAST:
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            case TextArrangementType.TEXT_ONLY:
                sFinalBinding = sDescriptionBinding;
                break;
            case TextArrangementType.TEXT_SEPARATE:
                //Text Separate not supported, fallback to text last.
                sFinalBinding = sIdBinding + " (" + sDescriptionBinding + ")";
                break;
            default:
                sFinalBinding = sIdBinding;
                break;
        }
        return sFinalBinding;
    }

    function _formatField(
        iContext,
        oItem,
        oEntityType,
        oMetaModel,
        bDontIncludeUOM,
        bIncludeOnlyUOM,
        bUseSimplePath
    ) {
        if (oItem.Value.Apply) {
            return OdataAnnotationHelper.format(iContext, oItem.Value);
        }

        var sProperty = oItem.Value.$Path || oItem.Value.String;
        var oEntityTypeProperty = CardAnnotationHelper._getEntityTypeForODataV4Model(oMetaModel, oEntityType, sProperty),
            result = "",
            functionName,
            oStaticValues;

        var oCardProperties = iContext.getSetting("ovpCardProperties");
        var sContentFragment = oCardProperties && oCardProperties.getProperty("/contentFragment");

        if (!bIncludeOnlyUOM) {
            // Support association
            if (oItem.Value.$Path && oItem.Value.$Path.split("/").length > 1) {
                oEntityTypeProperty = CardAnnotationHelper._getNavigationSuffix(oMetaModel, oEntityType, oItem.Value.$Path, iContext);
            }
            if (!oEntityTypeProperty) {
                return "";
            }
            // Item has ValueFormat annotation
            if (oEntityTypeProperty.$Type === "Edm.DateTime" || oEntityTypeProperty.$Type === "Edm.DateTimeOffset") {
                // By default or if showDateInRelativeFormat is true relative Date Format is selected
                var dateFormat = {
                    relative: true,
                    relativeScale: "auto"
                },
                showDateInRelativeFormat = oCardProperties && oCardProperties.getProperty("/showDateInRelativeFormat"); // Getting Parameter value from card properties

                // Otherwise if showDateInRelativeFormat is false then medium Date format is used
                if (showDateInRelativeFormat !== undefined && !showDateInRelativeFormat) {
                    dateFormat = {
                        style: "medium"
                    };
                }

                oStaticValues = {
                    dateFormat: dateFormat,
                    bUTC: oEntityTypeProperty.$Type === "Edm.DateTime" ? true : false
                };
                functionName = "sap.ovp.cards.AnnotationHelper.formatDate";
                result = CardAnnotationHelper._generatePathForField(
                    [oItem.Value.$Path || sProperty.split("/")[sProperty.split("/").length - 1]],
                    functionName,
                    oStaticValues
                );
            } else if ((oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits >= 0) || oEntityTypeProperty["scale"]) {
                // By default no decimals would be shown
                // If user specifies in Annotations then he can set 1 or 2 decimal places.
                // If he provides a value beyond 2 then also it would be considered as 2.
                var iScale = (oItem.ValueFormat && oItem.ValueFormat.NumberOfFractionalDigits) || 0,
                    iScaleFactor = oItem.ValueFormat && oItem.ValueFormat.ScaleFactor && oItem.ValueFormat.ScaleFactor.$Decimal,
                    sUnitPath;

                if (oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY]) {
                    // as part of supporting V4 annotation
                    sUnitPath = oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY].$Path || oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY];
                } else if (oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.UOM]) {
                    sUnitPath = oEntityTypeProperty["@" + ANNOTATIONTYPE.UOM].$Path || oEntityTypeProperty["@" + ANNOTATIONTYPE.UOM];
                } else if (oEntityTypeProperty && oEntityTypeProperty["@sap:unit"]) {
                    sUnitPath = oEntityTypeProperty["@sap:unit"];
                }
                var oUnitProperty = V4MetadataAnalyzer.getODataPropertyFromV4Metadata(oMetaModel, oEntityType.$Type, sUnitPath),
                    aParts = [oItem.Value.$Path || sProperty.split("/")[sProperty.split("/").length - 1]];

                // Default value for currency and number scale if scale is more than 2
                if (iScale > 2) {
                    iScale = 2;
                }

                oStaticValues = {
                    numberOfFractionalDigits: iScale,
                    scaleFactor: iScaleFactor,
                    bODataV4: CardAnnotationHelper.isODataV4Context(iContext)
                };

                // check if currency is applicable and format the number based on currency or number
                if (oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY]) {
                    var oCurrency = oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY];
                    if (oCurrency.$Path) {
                        functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                        aParts.push(oCurrency.$Path);
                    } else if (oCurrency.String) {
                        oStaticValues.currencyString = oCurrency.String;
                        functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                    } // as part of supporting V4 annotation
                } else if (oUnitProperty && (oUnitProperty[ANNOTATIONTYPE.ISO_CURRENCY] || oUnitProperty["sap:semantics"] === "currency-code")) {
                    functionName = "sap.ovp.cards.AnnotationHelper.formatCurrency";
                    aParts.push(sUnitPath);
                } else {
                    // If there is no value format annotation, we will use the metadata scale property
                    functionName = "sap.ovp.cards.AnnotationHelper.formatNumberCalculation";
                }
                oStaticValues.functionName = functionName;
                result = CardAnnotationHelper._generatePathForField(aParts, functionName, oStaticValues);
            } else {
                if (bUseSimplePath) {
                    result = OdataAnnotationHelper.format(oItem.Value, { context: iContext });
                } else {
                    var sFormattedResult = OdataAnnotationHelper.format(
                        oItem.Value,
                        iContext.getModel() ? { context: iContext } : { context: iContext.getInterface(0) }
                    );
                    var aResult = sFormattedResult.split(",");
                    var aForamttedFields = [];
                    if (aResult.length > 1) {
                        for (var i = 0; i < aResult.length; i++) {
                            if (aResult[i].indexOf("path:") >= 0 || aResult[i].indexOf("type:") >= 0) {
                                aForamttedFields.push(aResult[i]);
                            }
                        }
                        if (aForamttedFields.length > 0) {
                            result = result + aForamttedFields.join(",");
                            if (result.substring(result.length - 1) !== "}") {
                                result = result + "}";
                            }
                        }
                    } else {
                        result = sFormattedResult;
                    }
                }
            }

            // Get text arrangement (if present) binding for the property
            if (sContentFragment) {
                result = getTextArrangementBinding(iContext, oEntityType, oEntityTypeProperty, result);
            }

            //Add unit using path or string
            if (oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.UOM]) {
                var oUnit = oEntityTypeProperty["@" + ANNOTATIONTYPE.UOM];
                if (oUnit.$Path) {
                    result += " " + CardAnnotationHelper._generatePathForField([oUnit.$Path]);
                    // support sap:text property for UOM
                    result += " " +  CardAnnotationHelper.getSapTextPathForUOM(oUnit.$Path, oMetaModel, oEntityType, iContext);
                } else if (oUnit.String) {
                    // If the unit string is percentage, then no space required
                    // Note that if % comes from path, then space will be there
                    if (oUnit.String !== "%") {
                        result += " ";
                    }
                    result += oUnit.String;
                }
            }
        }

        if (!bDontIncludeUOM) {
            // Add currency using path or string
            if (oEntityTypeProperty && oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY]) {
                var oCurrency = oEntityTypeProperty["@" + ANNOTATIONTYPE.ISO_CURRENCY];
                if (oCurrency) {
                    if (oCurrency.$Path) {
                        result += " " + CardAnnotationHelper._generatePathForField([oCurrency.$Path]);
                    } else {
                        result += " " + oCurrency;
                    }
                    result += " " +  CardAnnotationHelper.getSapTextPathForUOM(oCurrency.$Path, oMetaModel, oEntityType, iContext);
                }
            }
        }

        if (result[0] === " ") {
            result = result.substring(1);
        }
        
        result = result.replace("\\", "");
        result = result.replace("\\", "");
        result = result.replace("Unsupported: ", "");
        result = result.replace("$P", "p");
        return result;
    }

    /*
     * This formatter method parses the List-Card List's items aggregation path in the Model.
     * The returned path may contain also sorter definition (for the List) sorting is defined
     * appropriately via respected Annotations.
     *
     * @param iContext
     * @param itemsPath
     * @returns List-Card List's items aggregation path in the Model
     */
    function formatItems(iContext, oEntitySet) {
        var oModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oModel.getProperty("/metaModel");
        var modelData = oMetaModel.getData();
        var oEntityType = oEntitySet;
        var selectionAnnotationPath, oSelectionVariant, presentationAnnotationPath, oPresentationVariant;

        if (oModel.getProperty("/selectionAnnotationPath")) {
            selectionAnnotationPath = "@" + oModel.getProperty("/selectionAnnotationPath");
            oSelectionVariant = modelData["$Annotations"][oEntityType.$Type][selectionAnnotationPath];
        }

        if (oModel.getProperty("/presentationAnnotationPath")) {
            presentationAnnotationPath = oModel.getProperty("/presentationAnnotationPath");
            presentationAnnotationPath = "@" + presentationAnnotationPath;
            oPresentationVariant = modelData["$Annotations"][oEntityType.$Type][presentationAnnotationPath];
        }
        var sEntitySetPath = "/" + oModel.getProperty("/entitySet");
        var aAnnotationsPath = Array.prototype.slice.call(arguments, 2);
        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters");

        //check if entity set needs parameters
        // if selection-annotations path is supplied - we need to resolve it in order to resolve the full entity-set path
        if (oSelectionVariant || !!aParameters) {
            if (
                (oSelectionVariant && oSelectionVariant.Parameters && oSelectionVariant.Parameters.length > 0) ||
                !!aParameters
            ) {
                // in case we have UI.SelectionVariant annotation defined on the entityType including Parameters - we need to resolve the entity-set path to include it
                sEntitySetPath = MetadataAnalyser.resolveParameterizedEntitySet(
                    iContext.getSetting("dataModel"),
                    oEntitySet,
                    oSelectionVariant,
                    aParameters
                );
            }
        }

        if (oModel.getProperty("/cardLayout") && oModel.getProperty("/cardLayout/noOfItems")) {
            var result = "{path: '" + sEntitySetPath + "', length: " + +oModel.getProperty("/cardLayout/noOfItems");
        } else {
            var result = "{path: '" + sEntitySetPath + "', length: " + CardAnnotationHelper._getItemsLength(oModel);
        }
        
        //prepare the expand list if navigation properties are used
        var aExpand = getExpandList(oMetaModel, oEntityType.$Type, aAnnotationsPath, iContext);

        var bCheckFilterPreference = CardAnnotationHelper.checkFilterPreference(oModel);
        if (bCheckFilterPreference || aExpand.length > 0) {
            result = result + ", parameters: {";
        }

        //add expand parameters to the binding info string if needed
        if (aExpand.length > 0) {
            if (aExpand.length > 0) {
                result = result + "$expand: '" + aExpand.join(",") + "'";
            }
            if (bCheckFilterPreference) {
                result = result + ", ";
            }
        }

        // add card id as custom parameter
        if (bCheckFilterPreference) {
            result = result + "custom: {cardId: '" + oModel.getProperty("/cardId") + "'}";
        }

        if (bCheckFilterPreference || aExpand.length > 0) {
            result = result + ", $count: true}";
        } else {
            result = result + ", parameters: {$count:true}";
        }

        //apply sorters information
        var aSorters = CardAnnotationHelper.getSorters(oModel, oPresentationVariant, true);
        if (aSorters.length > 0) {
            result = result + ", sorter:" + JSON.stringify(aSorters);
        }

        //apply filters information
        var aFilters = Filterhelper.getFilters(oModel, oSelectionVariant, true);

        if (aFilters.length > 0) {
            aFilters = Filterhelper.createExcludeFilters(aFilters, oModel);
            result = result + ", filters:" + JSON.stringify(aFilters);
        }
        result = result + "}";

        // returning the parsed path for the Card's items-aggregation binding
        return result;
    }
    formatItems.requiresIContext = true;

    /**
     * returns an array of navigation properties prefixes to be used in an odata $expand parameter
     *
     * @param oMetaModel - metamodel to get the annotations to query
     * @param oEntityType - the relevant entityType
     * @param aAnnotationsPath - an array of annotation path to check
     * @returns {Array} of navigation properties prefixes to be used in an odata $expand parameter
     */
    function getExpandList(oMetaModel, oEntityType, aAnnotationsPath, iContext) {
        var aExpand = [];
        var aColl, sExpand;

        //loop over the annotation paths
        for (var i = 0; i < aAnnotationsPath.length; i++) {
            if (!aAnnotationsPath[i]) {
                continue;
            }
            // sAnnotationPath = oEntityType + "/$Annotations/@" + aAnnotationsPath[i];
            // oBindingContext = oMetaModel.createBindingContext(sAnnotationPath);
            aColl = oMetaModel.getData()["$Annotations"][oEntityType]["@" + aAnnotationsPath[i]];
            //if the annotationPath does not exists there is no BindingContext
            aColl = aColl ? aColl : [];
            for (var j = 0; j < aColl.length; j++) {
                if (aColl[j].Value && aColl[j].Value.$Path) {
                    sExpand = CardAnnotationHelper._getNavigationPrefix(oMetaModel, oEntityType, aColl[j].Value.$Path, iContext);
                    if (sExpand && aExpand.indexOf(sExpand) === -1) {
                        aExpand.push(sExpand);
                    }
                }
            }
        }
        return aExpand;
    }

    function formatDataFieldValueOnIndex(iContext, aCollection, index) {
        return formatDataField(iContext, aCollection, index);
    }
    formatDataFieldValueOnIndex.requiresIContext = true;

    function formatDataPointValueOnIndex(iContext, aCollection, index) {
        return formatDataPoint(iContext, aCollection, index);
    }
    formatDataPointValueOnIndex.requiresIContext = true;

    /**
     * This function checks the count of the data points for a particular line item and returns the data point or data field based on the index passed from the XML fragment
     * Data point takes the priority over the data field
     * @param iContext
     * @param aCollection
     * @param iDataPointIndex
     * @param iDataFieldIndex
     * @returns {*}
     */
    function formatDataPointOrField(iContext, aCollection, iDataPointIndex, iDataFieldIndex) {
        var iDataPointCount = CardAnnotationHelper.getDataPointsCount(iContext, aCollection);
        if (iDataPointCount > 0) {
            return formatDataPointValueOnIndex(iContext, aCollection, iDataPointIndex);
        } else {
            return formatDataFieldValueOnIndex(iContext, aCollection, iDataFieldIndex);
        }
    }
    formatDataPointOrField.requiresIContext = true;

    /**
     * Function takes care of the formatting of the controls that need to display the number and the corresponding units
     * this function is getting called from the xml view and the data from the ovpConstants model is passed to the function
     * this calls the same function with different index based on the values passed from the xmml views
     * this method inturn calls the format data point function with the recieved parameters
     * @param iContext
     * @param aCollection
     * @param index
     * @param dontIncludeUOM - this field will always be true for object numbers and the unit of measure will not be appended to the actual value
     * @returns {*}
     */
    function formatObjectNumber(iContext, aCollection, index, dontIncludeUOM) {
        return formatDataPoint(iContext, aCollection, index, dontIncludeUOM);
    }
    formatObjectNumber.requiresIContext = true;

    //Generic formatting functions

    function formatDataFieldValueGeneric(iContext, aCollection) {
        if (!aCollection) {
            return "";
        }
        return formatField(iContext, aCollection);
    }
    formatDataFieldValueGeneric.requiresIContext = true;

    function formatDataPointValue(iContext, aCollection, dontIncludeUOM) {
        if (!aCollection) {
            return "";
        }
        var oModel = iContext.getSetting("ovpCardProperties");
        var oEntityType = oModel.getProperty("/entityType");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oCopyOfCollection = Object.assign({}, aCollection);
        var oCopyOfContext = Object.assign({}, iContext);
        aCollection = CardAnnotationHelper._formatValueFromTarget(oCopyOfContext, oCopyOfCollection);

        return _formatDataPoint(iContext, aCollection, oEntityType, oMetaModel, dontIncludeUOM);
    }
    formatDataPointValue.requiresIContext = true;

    function resolveEntityTypePath(oAnnotationPathContext) {
        var sAnnotationPath = oAnnotationPathContext.getObject();
        var oModel = oAnnotationPathContext.getModel();
        var oMetaModel = oModel.getProperty("/metaModel");
        //v4
        var entitySetPath = "/" + oModel.getProperty("/entitySet");
        var oEntityType = oMetaModel.getObject(entitySetPath);
        sAnnotationPath = "/" + oEntityType.$Type + "/@" + sAnnotationPath;
        return oMetaModel.createBindingContext(sAnnotationPath);
    }

    /*
     Generic function to get com.sap.vocabularies.UI.v1.DataField record type from lineitem with index
     */

    /**************************** Formatters & Helpers for KPI-Header logic  ****************************/

    /* Returns binding path for singleton */
    function getAggregateNumber(iContext, oEntitySet, oDataPoint, oSelectionVariant) {
        var measure;
        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.$Path) {
            measure = oDataPoint.Value.$Path;
        } else if (
            oDataPoint &&
            oDataPoint.Description &&
            oDataPoint.Description.Value &&
            oDataPoint.Description.Value.$Path
        ) {
            measure = oDataPoint.Description.Value.$Path;
        }
        var ret = "";
        var bParams = oSelectionVariant && oSelectionVariant.Parameters;
        var filtersString = "";

        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters");

        bParams = bParams || !!aParameters;
        var dataModel = iContext.getSetting("dataModel");
        var oModel = iContext.getModel(0);
        var sEntitySetName = V4MetadataAnalyzer.getEntitySetName(oModel, oEntitySet.$Type);
        if (bParams) {
            var path = MetadataAnalyser.resolveParameterizedEntitySet(dataModel, oEntitySet, oSelectionVariant, aParameters);
            ret += "{path: '" + path + "'";
        } else {
            ret += "{path: '/" + sEntitySetName + "'";
        }

        ret += ", length: 1";
        var oOvpCardSettings = iContext.getSetting("ovpCardProperties");
        var oEntityType = oOvpCardSettings.getProperty("/entityType");
        var properties = oModel.getObject("/" + sEntitySetName + "/");

        var key, type;
        for (key in properties) {
            if (key.startsWith("$")) {
                continue;
            }
            type = oEntityType.$Type.concat("/", key);
            properties[key].annotations = oModel.getData(key).$Annotations[type];
        }

        var aFilters = Filterhelper.getFilters(oOvpCardSettings, oSelectionVariant, true);

        if (aFilters.length > 0) {
            aFilters = Filterhelper.createExcludeFilters(aFilters, oOvpCardSettings);
            filtersString += ", filters: " + JSON.stringify(aFilters);
        }

        var paramsArr = [];
        var annotations = dataModel.oMetaModel.getData().$Annotations;

        var aggregateParameter;
        var oMeasureAggregate = oOvpCardSettings.getProperty("/measureAggregate");
        if (oMeasureAggregate && oMeasureAggregate.hasOwnProperty(measure)) {
            aggregateParameter = oMeasureAggregate[measure];
        } else {
            aggregateParameter = getAggregateOfParameter(measure, annotations, oEntitySet.$Type);
        }
        paramsArr.push(
            "'" + measure + "Agg' : { 'name' : '" + measure + "', 'with' : '" + aggregateParameter + "'}"
        );
        if (oDataPoint && oDataPoint.Criticality && oDataPoint.Criticality.$Path) {
            aggregateParameter = getAggregateOfParameter(
                oDataPoint.Criticality.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.Criticality.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.Criticality.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }
        // if DeviationRangeLowValue and ToleranceRangeLowValue read from Path instead of string
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.DeviationRangeLowValue &&
            oDataPoint.CriticalityCalculation.DeviationRangeLowValue.$Path
        ) {
            aggregateParameter = getAggregateOfParameter(
                oDataPoint.CriticalityCalculation.DeviationRangeLowValue.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.CriticalityCalculation.DeviationRangeLowValue.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.CriticalityCalculation.DeviationRangeLowValue.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.ToleranceRangeLowValue &&
            oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.$Path
        ) {
            var aggregateParameter = getAggregateOfParameter(
                oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.CriticalityCalculation.ToleranceRangeLowValue.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }

        // if DeviationRangeHighValue and ToleranceRangeHighValue read from Path instead of string
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.DeviationRangeHighValue &&
            oDataPoint.CriticalityCalculation.DeviationRangeHighValue.$Path
        ) {
            var aggregateParameter = getAggregateOfParameter(
                oDataPoint.CriticalityCalculation.DeviationRangeHighValue.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.CriticalityCalculation.DeviationRangeHighValue.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.CriticalityCalculation.DeviationRangeHighValue.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }
        if (
            oDataPoint &&
            oDataPoint.CriticalityCalculation &&
            oDataPoint.CriticalityCalculation.ToleranceRangeHighValue &&
            oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.$Path
        ) {
            var aggregateParameter = getAggregateOfParameter(
                oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.CriticalityCalculation.ToleranceRangeHighValue.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }

        if (
            oDataPoint &&
            oDataPoint.TrendCalculation &&
            oDataPoint.TrendCalculation.ReferenceValue &&
            oDataPoint.TrendCalculation.ReferenceValue.$Path
        ) {
            var aggregateParameter = getAggregateOfParameter(
                oDataPoint.TrendCalculation.ReferenceValue.$Path,
                annotations,
                oEntitySet.$Type
            );
            paramsArr.push(
                "'" +
                oDataPoint.TrendCalculation.ReferenceValue.$Path +
                "Agg' : { 'name' : '" +
                oDataPoint.TrendCalculation.ReferenceValue.$Path +
                "', 'with' : '" +
                aggregateParameter +
                "'}"
            );
        }
        var bCheckFilterPreference = CardAnnotationHelper.checkFilterPreference(ovpCardProperties);
        var sCustomParameter = bCheckFilterPreference
            ? ", custom: {cardId: '" + ovpCardProperties.getProperty("/cardId") + "'}"
            : "";
            
        var sUnit = CommonUtils.getUnitColumnForODataV4(measure, oModel, sEntitySetName);
        var sUnitParameter =  sUnit ? ", group: {" + sUnit + ": {}}" : "";
        
        var parameters =
            "parameters:{'$$aggregation' : {'aggregate' : {" + paramsArr.join(",") + "}" + sUnitParameter + "}" + sCustomParameter + "}";
            
        return ret + ", " + parameters + filtersString + "}";  
    }
    getAggregateNumber.requiresIContext = true;

    function getAggregateOfParameter(parameter, annotations, entityType) {
        var parameterAnnotation = annotations[entityType + "/" + parameter];
        if (parameterAnnotation["@Org.OData.Aggregation.V1.default"]) {
            return parameterAnnotation["@Org.OData.Aggregation.V1.default"].$EnumMember.split("/")[1].toLowerCase();
        }
        return "sum";
    }

    function getEmail(iContext, data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].type.$EnumMember.indexOf("ContactInformationType/work") >= 0) {
                var sDescriptionBinding = OdataAnnotationHelper.format(data[i].address, { context: iContext });
                return sDescriptionBinding;
            }
        }
        return "";
    }
    getEmail.requiresIContext = true;

    function getPhone(iContext, data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].type.$EnumMember.indexOf("PhoneType/work") >= 0) {
                var sDescriptionBinding = OdataAnnotationHelper.format(data[i].uri, { context: iContext });
                return sDescriptionBinding;
            }
        }
        return "";
    }
    getPhone.requiresIContext = true;

    function getDevice(iContext, data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].type.$EnumMember.indexOf("PhoneType/cell") >= 0) {
                var sDescriptionBinding = OdataAnnotationHelper.format(data[i].uri, { context: iContext });
                return sDescriptionBinding;
            }
        }
        return "";
    }
    getDevice.requiresIContext = true;

    function getPhoneType(iContext, data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].type.$EnumMember.indexOf("PhoneType/fax") >= 0) {
                var sDescriptionBinding = OdataAnnotationHelper.format(data[i].uri, { context: iContext });
                return sDescriptionBinding;
            }
        }
        return "";
    }
    getPhoneType.requiresIContext = true;

    return {
        TextArrangementType: TextArrangementType,
        formatField: formatField,
        formatItems: formatItems,
        formatDataFieldValueOnIndex: formatDataFieldValueOnIndex,
        formatDataPointValueOnIndex: formatDataPointValueOnIndex,
        formatDataPointOrField: formatDataPointOrField,
        formatObjectNumber: formatObjectNumber,
        formatDataFieldValueGeneric: formatDataFieldValueGeneric,
        formatDataPointValue: formatDataPointValue,
        resolveEntityTypePath: resolveEntityTypePath,
        getAggregateNumber: getAggregateNumber,
        getEmail: getEmail,
        getPhone: getPhone,
        getDevice: getDevice,
        getPhoneType: getPhoneType,
        getTextArrangementBinding: getTextArrangementBinding
    };
}, /* bExport= */ true);
