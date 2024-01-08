/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/model/Filter"
], function (Filter) {
    "use strict";

    /**
     * This function goes over the provided list of filters and checks which filter appears as a field
     * in the EntityType provided. The fields that appears in both lists  (filters and EntityType fields)
     * will be returned in an array.
     * @param oEntityType
     * @param aFilters
     * @param oEntityModel
     * @param oFilterModel
     * @returns {array}
     * @private
     */
    function getEntityRelevantFilters(oEntityType, aFilters, oEntityModel, oFilterModel) {
        var oReturnFilterWrap = [];
        if (aFilters.length > 0 && oEntityType) {
            var entityType = oEntityType.entityType; // To get from global filter model
            var oReturnFilter = _checkRelevantFiltersRecursive(oEntityType.property, aFilters[0],
                oEntityType.name, entityType, oEntityModel, oFilterModel);

            //Wrap the return filter in an array
            if (oReturnFilter) {
                oReturnFilterWrap.push(oReturnFilter);
            }
        }
        return oReturnFilterWrap;
    }

    /**
    * This function recursively checks the nested filters and returns the relevant filters
    * that match any of the entity properties.
    * @param aEntityProperties
    * @param oFilterDetails
    * @param sEntityname
    * @param sTargetEntityname
    * @param oEntityModel
    * @param oTargetModel
    * @returns {object}
    * @private
    */
    function _checkRelevantFiltersRecursive(aEntityProperties, oFilterDetails, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {
        if (!oFilterDetails._bMultiFilter) {	//End point of recursion (base case)
            oFilterDetails.sPath = oFilterDetails.sPath.split('/').pop();
            //Get the mapping property. This would return the same property name in case a match is found
            //or else a property that is mapped in annotations. If nothing is found, then it returns null
            var sMappedProperty = _getPropertyMapping(aEntityProperties, oFilterDetails.sPath, sEntityname
                , sTargetEntityname, oEntityModel, oTargetModel);
            if (sMappedProperty) {
                oFilterDetails.sPath = sMappedProperty;
                return oFilterDetails;
            }
        } else {
            //For multifilter cases, there are deep structures
            var aDeepFilters = oFilterDetails.aFilters;
            var oSelectedFilter, aSelectedFilters = [];
            if (aDeepFilters) {
                for (var i = 0; i < aDeepFilters.length; i++) {
                    //Get the relevant filter object for each internal filter
                    oSelectedFilter = _checkRelevantFiltersRecursive(aEntityProperties, aDeepFilters[i], sEntityname
                        , sTargetEntityname, oEntityModel, oTargetModel);
                    if (oSelectedFilter) {
                        aSelectedFilters.push(oSelectedFilter);
                    }
                }
                if (aSelectedFilters.length > 0) {
                    return (new Filter(aSelectedFilters, oFilterDetails.bAnd));
                }
            }
        }
    }

    /**
    * This function takes a set of entity properties and tries to find a
    * match or a mapped property by comparing to a provided property name
    * @param aEntityProperties
    * @param sTargetProperty
    * @param sEntityname
    * @param sTargetEntityname
    * @param oEntityModel
    * @param oTargetModel
    * @returns {string}
    * @private
    */
    function _getPropertyMapping(aEntityProperties, sTargetProperty, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {
        var i, sMappedProperty;
        //Check if entity property found with same name
        for (i = 0; i < aEntityProperties.length; i++) {
            if (aEntityProperties[i].name === sTargetProperty) {
                sMappedProperty = aEntityProperties[i].name;
                return sMappedProperty;
            }
            //If direct match not found then check for fuzzy logic using "P_"
            if ((("P_" + aEntityProperties[i].name) === sTargetProperty) ||
                (aEntityProperties[i].name === ("P_" + sTargetProperty))) {
                sMappedProperty = aEntityProperties[i].name;
                return sMappedProperty;
            }
        }
        //sEntityname, sTargetEntityname and oModel are optional, if not passed annotation mapping will not be considered
        if (!sEntityname || !sTargetEntityname || !oEntityModel || !oTargetModel) {
            return;
        }
        //If direct property not found, then check for mapped property
        var oEntity = oEntityModel && oEntityModel.oMetadata && oEntityModel.oMetadata._getEntityTypeByName(sEntityname);
        var oTargetEntity = oTargetModel.oMetadata._getEntityTypeByName(sTargetEntityname);
        if (!oEntity || !oTargetEntity) {
            return;
        }

        var s_semantic_object = "com.sap.vocabularies.Common.v1.SemanticObject";
        var s_semantic_map = "com.sap.vocabularies.Common.v1.SemanticObjectMapping";

        var oEntityModelAnnotations = oEntityModel.oAnnotations.getAnnotationsData();
        if (!oEntityModelAnnotations || !oEntityModelAnnotations.propertyAnnotations) {
            return;
        }
        var oEntityPropAnnotations = oEntityModelAnnotations.propertyAnnotations[oEntity.namespace + "." + oEntity.name];

        var oTargetModelAnnotations = oTargetModel.oAnnotations.getAnnotationsData();
        if (!oTargetModelAnnotations || !oTargetModelAnnotations.propertyAnnotations) {
            return;
        }
        var oTargetPropAnnotations = oTargetModelAnnotations.propertyAnnotations[oTargetEntity.namespace + "." + oTargetEntity.name]; //Global filter entity annotations
        var oTargetPropAnnotation = oTargetPropAnnotations && oTargetPropAnnotations[sTargetProperty];

        //If annotations present for sTargetProperty, then only search entity annotations for a mapping
        if (!oTargetPropAnnotation || !oTargetPropAnnotation[s_semantic_object]) {
            return;
        }

        var sPropertyKey, oEntityPropAnnotation, aMappedAnnotation, iMapCount, sLocalProperty;

        //Loop through annotations for each property in entity
        for (sPropertyKey in oEntityPropAnnotations) {

            oEntityPropAnnotation = oEntityPropAnnotations[sPropertyKey];

            //If entity current property and filter property annotations contain same semantic object
            if (oEntityPropAnnotation[s_semantic_object] &&
                oEntityPropAnnotation[s_semantic_object].String === oTargetPropAnnotation[s_semantic_object].String) {

                aMappedAnnotation = oEntityPropAnnotation[s_semantic_map];

                //If mapping not present
                if (!aMappedAnnotation) {
                    continue; //go to next loop
                }

                iMapCount = aMappedAnnotation.length;
                sLocalProperty = "";

                //Check all mappings for a match
                while (iMapCount--) {
                    if (aMappedAnnotation[iMapCount].SemanticObjectProperty.String === sTargetProperty) {
                        sLocalProperty = aMappedAnnotation[iMapCount].LocalProperty.PropertyPath;
                        break; //Match found
                    }
                }

                //Local property found for entity
                //Verify if property is present in entity before returning
                if (sLocalProperty !== "") {
                    for (i = 0; i < aEntityProperties.length; i++) {
                        if (aEntityProperties[i].name === sLocalProperty) {
                            sMappedProperty = aEntityProperties[i].name;
                            return sMappedProperty;
                        }
                    }
                }
            }
        }
        
        return sMappedProperty;
    }

    function mergeFilters(aRelevantFilters, aSelectionVaraintFilter) {
        return aRelevantFilters;
    }

    return {
        getEntityRelevantFilters: getEntityRelevantFilters,
        mergeFilters: mergeFilters
    };
});
