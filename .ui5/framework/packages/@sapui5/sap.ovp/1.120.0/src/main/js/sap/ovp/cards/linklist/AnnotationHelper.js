/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/AnnotationHelper",
    "sap/ui/model/odata/AnnotationHelper",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/cards/Filterhelper"
], function (
    CardAnnotationHelper,
    OdataAnnotationHelper,
    MetadataAnalyser,
    Filterhelper
) {
    "use strict";

    /*
     * return the sorters that need to be applyed on an aggregation
     * @param ovpCardProperties - card properties model which might contains sort configurations
     * @returns {Array} of model sorters
     */
    function getSorters(ovpCardProperties) {
        var aSorters = [];
        var oSorter, bDescending;

        //get the configured sorter if exist and append them to the sorters array
        var sPropertyPath = ovpCardProperties.getProperty("/sortBy");
        if (sPropertyPath) {
            // If sorting is enabled by card configuration
            var sSortOrder = ovpCardProperties.getProperty("/sortOrder");
            if (sSortOrder && sSortOrder.toLowerCase() !== "descending") {
                bDescending = false;
            } else {
                bDescending = true;
            }
            oSorter = {
                path: sPropertyPath,
                descending: bDescending
            };
            aSorters.push(oSorter);
        }
        // returning Sorter
        return aSorters;
    }

    /*
     * This formatter method parses the items aggregation path in the Model.
     * @param iContext
     * @param itemsPath
     * @returns items aggregation path in the Model
     */
    function formatItems(iContext, oEntitySet, oHeaderAnnotation) {
        var oModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oModel.getProperty("/metaModel");
        var bODataV4 = CardAnnotationHelper.isODataV4Context(iContext);
        var oEntityType = bODataV4 ? oEntitySet : oMetaModel.getODataEntityType(oEntitySet.entityType);
        var sEntitySetPath = bODataV4 ? "/" + oModel.getProperty("/entitySet") : "/" + oEntitySet.name;
        var oSelectionVariant;
        var sSelectionAnnotationPath = oModel.getProperty("/selectionAnnotationPath");
        if (bODataV4 && sSelectionAnnotationPath) {
            var selectionAnnotationPath = "@" + sSelectionAnnotationPath;
            oSelectionVariant = oMetaModel.getData()["$Annotations"][oEntityType.$Type][selectionAnnotationPath];
        } else {
            oSelectionVariant = oEntityType[sSelectionAnnotationPath];
        }
        var iItemsLength;
        var layout = oModel.getProperty("/layoutDetail");
        if (layout === "resizable") {
            var oCardLayout = oModel.getProperty("/cardLayout");
            if (oCardLayout) {
                // Item Length dependent on Card listFlavor
                if (oModel.getProperty("/listFlavor") === "standard") {
                    var typeOfLinklist = "";
                    for (var item in oHeaderAnnotation) {
                        typeOfLinklist += item;
                    }

                    var iRowHeight = oModel.getProperty("/cardLayout/iRowHeigthPx");
                    if (iRowHeight === undefined) {
                        iRowHeight = 16;
                    }
                    var iItemHeight;
                    if (oModel.getProperty("/densityStyle") === "cozy") {
                        //Cozy mode
                        iItemHeight = 72;
                        if (
                            typeOfLinklist.indexOf("Description") === -1 &&
                            ((typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("ImageUrl") > 0) ||
                                (typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("TypeImageUrl") > 0))
                        ) {
                            //one line with image or icon
                            iItemHeight = 56;
                        } else if (typeOfLinklist.indexOf("Description") === -1 && typeOfLinklist.indexOf("Title") > 0) {
                            iItemHeight = 48;
                        }
                    } else {
                        //Compact Mode
                        iItemHeight = 60;
                        if (
                            typeOfLinklist.indexOf("Description") === -1 &&
                            ((typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("ImageUrl") > 0) ||
                                (typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("TypeImageUrl") > 0))
                        ) {
                            //one line with image or icon
                            iItemHeight = 48;
                        } else if (typeOfLinklist.indexOf("Description") === -1 && typeOfLinklist.indexOf("Title") > 0) {
                            iItemHeight = 40;
                        }
                    }
                    oModel.setProperty("/cardLayout/itemHeight", iItemHeight);
                    //If there is no default span is not given in the manifest and the card is loaded for the first time then
                    // we need to calculate rowSpan i.e no of items(Default is 6) * item height + header height + 2 * card top/bottom padding
                    //and set it in noOfItems property as rowSpan property is overridden in onAfterRendering()
                    // Else we have to calculate no of items we can show in the card
                    if (!oModel.getProperty("/defaultSpan") && oModel.getProperty("/cardLayout/autoSpan")) {
                        iItemsLength = oModel.getProperty("/cardLayout/noOfItems");
                        var rowSpan = Math.ceil(
                            (iItemsLength * iItemHeight +
                                oModel.getProperty("/cardLayout/headerHeight") +
                                2 * oModel.getProperty("/cardLayout/iCardBorderPx")) /
                            iRowHeight
                        );
                        oModel.setProperty("/cardLayout/noOfItems", rowSpan);
                    } else {
                        var dividend = Math.floor(
                            oCardLayout.rowSpan * iRowHeight -
                            oModel.getProperty("/cardLayout/headerHeight") -
                            2 * oModel.getProperty("/cardLayout/iCardBorderPx")
                        );
                        iItemsLength = Math.floor(dividend / iItemHeight) * oCardLayout.colSpan;
                    }
                }
            }
        } else {
            iItemsLength = 6;
        }
        var ovpCardProperties = iContext.getSetting("ovpCardProperties"),
            aParameters = ovpCardProperties.getProperty("/parameters");

        //check if entity set needs parameters
        // if selection-annotations path is supplied - we need to resolve it in order to resolve the full entity-set path
        if (oSelectionVariant || !!aParameters) {
            if ((oSelectionVariant && oSelectionVariant.Parameters) || !!aParameters) {
                // in case we have UI.SelectionVariant annotation defined on the entityType including Parameters - we need to resolve the entity-set path to include it
                sEntitySetPath = MetadataAnalyser.resolveParameterizedEntitySet(
                    iContext.getSetting("dataModel"),
                    oEntitySet,
                    oSelectionVariant,
                    aParameters
                );
            }
        }

        var result = "{path: '" + sEntitySetPath + "', length: " + iItemsLength;

        //apply sorters information
        var aSorters = getSorters(oModel);
        if (aSorters.length > 0) {
            result = result + ", sorter:" + JSON.stringify(aSorters);
        }
        //apply filters information
        var aFilters = Filterhelper.getFilters(oModel, oSelectionVariant, bODataV4);
        if (aFilters.length > 0) {
            aFilters = Filterhelper.createExcludeFilters(aFilters, oModel);
            result = result + ", filters:" + JSON.stringify(aFilters);
        }
        // add card id as custom parameter
        var bCheckFilterPreference = CardAnnotationHelper.checkFilterPreference(oModel);
        if (bODataV4) {
            if (bCheckFilterPreference) {
                result = result + ", parameters:{custom: {cardId: '" + oModel.getProperty("/cardId") + "'}}";
            }
        } else {
            if (bCheckFilterPreference) {
                result = result + ", parameters:{custom: {cardId: '" + oModel.getProperty("/cardId") + "', _requestFrom: 'ovp_internal'}}";
            } else {
                result = result + ", parameters:{custom: {_requestFrom: 'ovp_internal'}}";
            }
        }
        result = result + "}";

        // returning the parsed path for the Card's items-aggregation binding
        return result;
    }

    formatItems.requiresIContext = true;

    /*
     * This formatter method parses the items Url and extend it with the "baseUrl" if required
     * @param iContext
     * @param sUrl
     * @returns sUrl
     */
    function formatUrl(iContext, sUrl) {
        // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
        var sBaseUrl = iContext.getModel().getProperty("/baseUrl");
        return formUrl(sBaseUrl, sUrl);
    }

    formatUrl.requiresIContext = true;

    /* This formatter check whether is ImageUri is true or not
     *
     * @returns true or false
     */
    function isImageUrl(oInterface, oDataField) {
        var bIsImageUrl = true;
        var sOdataPath = OdataAnnotationHelper.format(oInterface, oDataField);
        if (sOdataPath.toLowerCase().indexOf("icon") > 0) {
            bIsImageUrl = false;
        }
        return bIsImageUrl;
    }

    isImageUrl.requiresIContext = true;

    /* This formatter check whether is ImageUri is true or not
     *
     * @returns true or false
     */
    function isImageUrlStaticData(oDataField) {
        var bIsImageUrl = true;
        if (!oDataField) {
            return null;
        } else if (oDataField.toLowerCase().indexOf("icon") > 0) {
            bIsImageUrl = false;
        }
        return bIsImageUrl;
    }

    /* This formatter check whether targetUri is a valid URL
     *
     * @returns true or false
     */
    function isValidURL(sURL) {
        var pattern = new RegExp("http(s)?://(www.)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?", "i");
        return pattern.test(sURL);
    }

    /* This formatter make string to path
     * @returns Icon Path
     */
    function getIconPath(iContext, oTypeImageUrl) {
        var bODataV4 = CardAnnotationHelper.isODataV4Context(iContext);
        var sIconPath;
        if (!bODataV4) {
            if (oTypeImageUrl.hasOwnProperty("Path")) {
                sIconPath = "{" + oTypeImageUrl.Path + "}";
            } else {
                sIconPath = oTypeImageUrl.String;
            }
        } else {
            if (oTypeImageUrl.hasOwnProperty("$Path")) {
                sIconPath = "{" + oTypeImageUrl.$Path + "}";
            } else {
                sIconPath = oTypeImageUrl;
            }
        }
        return sIconPath;
    }
    getIconPath.requiresIContext = true;

    /* This formatter make string to path
     * @returns Path like {<string>}
     */
    function formatString(iContext, sObject) {
        var bODataV4 = CardAnnotationHelper.isODataV4Context(iContext);
        return bODataV4 ? "{" + sObject + "}" : "{" + sObject.String + "}";
    }
    formatString.requiresIContext = true;

    /*
     * @param oAnnotation
     * @returns 0 for false - there are no actions for this context
     *          1 for true - there are actions for this context
     *          does not return actual boolean - so we won't need to parse the result in the xml
     */
    function linkedAction(oAnnotation) {
        if (oAnnotation) {
            return 1;
        }
        return 0;
    }

    function formUrl(sBaseUrl, sUrl) {
        if (!sUrl) {
            return undefined;
        } else if (sUrl.lastIndexOf(sBaseUrl, 0) === 0 || sUrl.indexOf("://") > 0) {
            return sUrl;
        } else if (sUrl.lastIndexOf("/", 0) === 0) {
            return sBaseUrl + sUrl;
        } else {
            return sBaseUrl + "/" + sUrl;
        }
    }

    function isVisible(sId, oShowMore, oValues) {
        var bFlag;
        if (typeof oValues === "object") {
            bFlag = oValues[sId];
        } else {
            bFlag = typeof oValues === "boolean" ? oValues : true;
        }
        return !oShowMore[sId] && bFlag;
    }

    function getApplicationName(aLinks, semanticObject, action) {
        var sName = "";
        if (aLinks) {
            if (semanticObject && action) {
                sName = "#" + semanticObject + "-" + action;
                for (var i = 0; i < aLinks.length; i++) {
                    if (aLinks[i].value === sName) {
                        return aLinks[i].name;
                    }
                }
                sName = "";
            } else {
                return aLinks[0].name;
            }
        }
        return sName;
    }

    function getImageUrl(oCardProperties, sImageUrl) {
        return formUrl(oCardProperties.baseUrl, sImageUrl);
    }

    function contentRowIndex(oRow) {
        return this.getModel("contentRow").aBindings[0].getContext().getPath().replace("/staticContent/", "");
    }

    function getAvatarInitials(iContext, oInitials) {
        var bODataV4 = CardAnnotationHelper.isODataV4Context(iContext);
        if (!bODataV4) {
            return (oInitials.Path && "{" + oInitials.Path + "}") || oInitials.String || "";
        } else {
            return (oInitials.$Path && "{" + oInitials.$Path + "}") || oInitials || "";
        }
    }
    getAvatarInitials.requiresIContext = true;

    return {
        formatItems: formatItems,
        formatUrl: formatUrl,
        isImageUrl: isImageUrl,
        isImageUrlStaticData: isImageUrlStaticData,
        isValidURL: isValidURL,
        getIconPath: getIconPath,
        formatString: formatString,
        linkedAction: linkedAction,
        formUrl: formUrl,
        isVisible: isVisible,
        getApplicationName: getApplicationName,
        getImageUrl: getImageUrl,
        contentRowIndex: contentRowIndex,
        getAvatarInitials: getAvatarInitials,
        getSorters: getSorters
    };
},/* bExport= */ true);
