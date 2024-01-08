/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([], function () {

    function hasActions (aActions) {
        return aActions && Array.isArray(aActions) && aActions.length;
    }

    function getCardPreviewManifest (oCard) {
        var oPreviewCard = JSON.parse(JSON.stringify(oCard));
        var sCardType = oPreviewCard["sap.card"].type;

        /* Remove Header Actions */
        if (hasActions(oPreviewCard["sap.card"].header.actions)) {
            oPreviewCard["sap.card"].header.actions = [];
            delete  oPreviewCard["sap.card"].header.actions;
        }

        /* Remove Content Actions */
        if (sCardType === "Analytical" && hasActions(oPreviewCard["sap.card"].content.actions)) {
            oPreviewCard["sap.card"].content.actions = [];
            delete  oPreviewCard["sap.card"].content.actions ;
        } else if (sCardType === "List" && hasActions(oPreviewCard["sap.card"].content.item.actions)) {
            oPreviewCard["sap.card"].content.item.actions = [];
            delete  oPreviewCard["sap.card"].content.item.actions ;
        } else if (sCardType === "Table" && hasActions(oPreviewCard["sap.card"].content.row.actions)) {
            oPreviewCard["sap.card"].content.row.actions = [];
            delete  oPreviewCard["sap.card"].content.row.actions ;
        }

        return oPreviewCard;
    }

    /**
     * This method helps to insert actions back to the card before saving,
     * as actions would  be same for the Original card and the new card to be saved ,
     * we insert the actions back before saving card, which was removed during Preview
     * @param {object} oCard, card which is to be saved to MyHome
     * @param {object} oOrgCard, card that was passed by application to create insight cards
    * @returns {object} oCard after adding actions to it
    */
    function insertActionsManifest (oCard, oOrgCard) {
        var oOrginalCard = JSON.parse(JSON.stringify(oOrgCard)),
        oCardToInsertAction = JSON.parse(JSON.stringify(oCard));
        var sCardType = oCardToInsertAction["sap.card"].type,
        sOrginalCardType = oOrginalCard["sap.card"].type; // original card and oCard can have different type as there is transformation logic

             /* Insert Header Actions */
        if (hasActions(oOrginalCard["sap.card"].header.actions)) {
            oCardToInsertAction["sap.card"].header["actions"] = oOrginalCard["sap.card"].header.actions;
        }

        /* Insert Content Actions */
        if (sCardType === "Analytical" && hasActions(oOrginalCard["sap.card"].content.actions)) {
            oCardToInsertAction["sap.card"].content.actions = oOrginalCard["sap.card"].content.actions; // for analytical card as both type will be same directly insert
        } else if (sCardType === sOrginalCardType) {
            if (sCardType === "List"  && hasActions(oOrginalCard["sap.card"].content.item.actions) ) {
                oCardToInsertAction["sap.card"].content.item.actions = oOrginalCard["sap.card"].content.item.actions;
            } else if (sCardType === "Table"  && hasActions(oOrginalCard["sap.card"].content.row.actions)) {
                oCardToInsertAction["sap.card"].content.row.actions = oOrginalCard["sap.card"].content.row.actions;
            }
        } else if (sOrginalCardType === "List" && hasActions(oOrginalCard["sap.card"].content.item.actions)) {  // if sOrginalCardType is 'List' then sCardType == "Table",
             oCardToInsertAction["sap.card"].content.row.actions = oOrginalCard["sap.card"].content.item.actions;
        } else {    // if sOrginalCardType is 'Table' then sCardType == "List",
            oCardToInsertAction["sap.card"].content.item.actions =  oOrginalCard["sap.card"].content.row.actions;
        }
        return oCardToInsertAction;
    }

    function hasVizData(oCard) {
        if (oCard.getAggregation("_content") && oCard.getAggregation("_content").getAggregation("_content") && oCard.getAggregation("_content").getAggregation("_content")._getVizDataset) {
            if (oCard.getAggregation("_content").getAggregation("_content")._errorType) {
                return false;
            }
            var vizDS = oCard.getAggregation("_content").getAggregation("_content")._getVizDataset();
            var chartData = vizDS
                && vizDS._FlatTableD
                && vizDS._FlatTableD._data
                && Array.isArray(vizDS._FlatTableD._data)
                && vizDS._FlatTableD._data.length;
            if (chartData) {
                return true;
            }
        }
        return false;
    }

    return {
        getCardPreviewManifest: getCardPreviewManifest,
        hasVizData: hasVizData,
        insertActionsManifest: insertActionsManifest
    };
});