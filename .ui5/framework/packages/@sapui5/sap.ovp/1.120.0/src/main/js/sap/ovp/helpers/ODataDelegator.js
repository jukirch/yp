/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/MetadataAnalyser",
    "sap/ovp/helpers/V4/MetadataAnalyzer"
], function (
    CommonUtils,
    MetadataAnalyser,
    V4MetadataAnalyser
) {
    "use strict";

    /**
     * This function calls the appropriate handler to get entity set parameters based on the version of OData
     * @param {object} oEntityModel entity model object
     * @param {object} oEntitySet The entity set
     * @returns {array} 
     * @public
     */
    function getParametersByEntitySet(oEntityModel, oEntitySet) {
        if (!CommonUtils.isODataV4(oEntityModel)) {
            return MetadataAnalyser.getParametersByEntitySet(oEntityModel, oEntitySet.name, true);
        } else {
            return V4MetadataAnalyser.getParametersByEntitySet(oEntityModel, oEntitySet, true);
        }
    }

    /**
     * This function calls the appropriate handler to get the property information from the entity type
     * @param {string} sPropertyPath property path or name
     * @param {object} oEntityType entity type
     * @param {object} oModel model object
     * @returns {array} 
     * @public
     */
    function getPropertyFromEntityType (sPropertyPath, oEntityType, oModel) {
        if (!CommonUtils.isODataV4(oModel)) {
            return MetadataAnalyser.getPropertyFromEntityType(sPropertyPath, oEntityType);
        } else {
            return V4MetadataAnalyser.getPropertyFromEntityType(sPropertyPath, oEntityType);
        }
    }
    
    return {
        getParametersByEntitySet: getParametersByEntitySet,
        getPropertyFromEntityType: getPropertyFromEntityType
    };
});
