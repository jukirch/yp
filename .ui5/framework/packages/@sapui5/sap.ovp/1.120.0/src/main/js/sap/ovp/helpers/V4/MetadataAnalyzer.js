/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([], function() {
    "use strict";

    /**
     * Evaluates OData metamodel and returns entity set name for given entity type
     * @param {sap.ui.model.odata.v4.ODataMetaModel} oMetaModel OData metadata model
     * @param {string} sEntityType 
     * @returns {string} Entity set name
     */
    function getEntitySetName(oMetaModel, sEntityType) {
        var oEntityContainer = oMetaModel.getObject("/");
        for (var key in oEntityContainer) {
            if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
                return key;
            }
        }
    }

    /**
     * 
     * @param {sap.ui.model.odata.v4.ODataMetaModel} oMetaModel OData metadata model
     * @param {string} sEntityType 
     * @param {string} sProperty 
     * @returns {object|null} returns an object containing property metadata and annotation or null 
     */
     function getODataPropertyFromV4Metadata(oMetaModel, sEntityType, sProperty) {
        if (!sProperty) {
            return null;
        }
        var sEntitySet = getEntitySetName(oMetaModel, sEntityType);
        return oMetaModel.getObject("/" + sEntitySet + "/" + sProperty) || null;
    }

    /**
     * Extract properties of parameter EntitySet with other relevant informations.
     * @param: {object} Instance of model which we can be used to derive the metamodel.
     * @param: {object} The EntitySet object which has Parameter Entityset in association.
     * @param: {boolean} bInfoParams If the full info of parameters is needed or only the name of params is needed.
     *
     * @return: {object} Contains name of Parameter EntitySet, keys of Parameter EntitySet and Name of Navigation property.
     */
    function getParametersByEntitySet(oModel, oEntitySet, bInfoParams) {

        if (!oModel || !oModel.getMetaModel) {
            throw new Error("OData Model needs to be passed as an argument");
        }

        var oMetaModel = oModel.getMetaModel();
        var oResult = {
            entitySetName: null,
            parameters: [],
            navPropertyName: null
        };

        var oEntityType = oMetaModel.getData()[oEntitySet.$Type];
        var aNavigationProperties = [];
        for (var sPropKey in oEntityType) {
            if (oEntityType[sPropKey].$kind === 'NavigationProperty') {
                aNavigationProperties.push(oEntityType[sPropKey]);
            }
        }
        if (aNavigationProperties.length === 0) {
            return oResult;
        }
        // filter the parameter entityset for extracting it's key and it's entityset name
        aNavigationProperties.filter(function (oNavProperty) {
            var oNavigationEntityType = oMetaModel.getData()[oNavProperty.$Type];
            var oNavigationEntityTypeAnnotation = oMetaModel.getData().$Annotations[oNavProperty.$Type];
            if (oNavigationEntityTypeAnnotation && oNavigationEntityTypeAnnotation['@SAP__common.ResultContext'] && oNavigationEntityType.$Key.length > 0) {
                oResult.entitySetName = getEntitySetName(oMetaModel, oNavProperty.$Type);
                for (var i = 0; i < oNavigationEntityType.$Key.length; i++) {
                    if (bInfoParams) {
                        var navProp = [];
                        for (var sKey in oNavigationEntityType) {
                            if (oNavigationEntityType[sKey].$kind === 'Property') {
                                navProp.push(sKey);
                            }
                        }
                        for (var k = 0; k < navProp.length; k++) {
                            if (navProp[k] === oNavigationEntityType.$Key[i]) {
                                oResult.parameters.push({name: navProp[k]});
                                oResult.entitySetName = getEntitySetName(oMetaModel, oNavProperty.$Type);
                            }
                        }
                    } else {
                        oResult.parameters.push({name: oNavigationEntityType.$Key[i]});
                    }
                }
                var aSubNavigationProperties = [];
                for (var sNavPropKey in oNavigationEntityType) {
                    if (oNavigationEntityType[sNavPropKey].$kind === 'NavigationProperty') {
                        aSubNavigationProperties.push(oNavigationEntityType[sNavPropKey]);
                    }
                }
                // Parameter entityset must have association back to main entityset.
                var bBackAssociationPresent = aSubNavigationProperties.some(function (oSubNavigationProperty) {
                    oSubNavigationProperty.$Type === oEntitySet.$Type ? oResult.navPropertyName = oSubNavigationProperty.$Type : Function.prototype();
                    return oResult.navPropertyName;
                });

                return bBackAssociationPresent && oResult.navPropertyName && oResult.entitySetName;
            }
            return false;
        });
        return oResult;
    }

    /**
	 * This function extracts and returns the property information from the entity type
	 * @param {string} sPropertyPath property path or name
	 * @param {object} oEntityType entity type
	 * @returns {array} 
	 * @public
	 */
	function getPropertyFromEntityType(sPropertyPath, oEntityType) {
        return Array.of(oEntityType.property[sPropertyPath]);
    }

    return {
        getEntitySetName: getEntitySetName,
        getODataPropertyFromV4Metadata: getODataPropertyFromV4Metadata,
        getParametersByEntitySet: getParametersByEntitySet,
        getPropertyFromEntityType: getPropertyFromEntityType
    };
}, /** bExport */ true);