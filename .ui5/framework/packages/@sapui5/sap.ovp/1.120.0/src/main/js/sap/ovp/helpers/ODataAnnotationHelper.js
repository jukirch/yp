/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/CommonUtils"
], function (
    CommonUtils
) {
    "use strict";

    /**
     * This function returns the annotation records for an entity type
     * @param {object} oEntityType Entity type
     * @param {string} sAnnotationPath The annotation path
     * @param {boolean} oEntityModel entity model
     * @returns {array}
     * @public
     */
    function getRecords(oEntityType, sAnnotationPath, oEntityModel) {
        if (CommonUtils.isODataV4(oEntityModel)) {
            sAnnotationPath = "@" + sAnnotationPath;
        }
        return oEntityType[sAnnotationPath];
    }

    return {
        getRecords: getRecords
    };
});
