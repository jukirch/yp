/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * @fileoverview
 * This file is intended to do all the operations like, property extraction, parsing on Metadata(OData V2) of the application.
 */

sap.ui.define([
	"sap/ovp/app/OVPLogger",
	"sap/base/security/encodeURL",
	"sap/ui/model/analytics/odata4analytics",
	"sap/fe/navigation/SelectionVariant",
	"sap/base/util/each"
], function (
	OVPLogger,
	encodeURL,
	odata4analytics,
	SelectionVariant,
	each
) {
	"use strict";

	var oLogger = new OVPLogger("OVP.cards.MetadataAnalyser");

	/**
	 * Retrieve the all the properties of the EntitySet. .
	 * @param: {object} Instance of model which we can be used to derive the metamodel.
	 * @param: {string} Name of the EntitySet.
	 *
	 * @return: {array} Array of properties in the EntitySet
	 */
	function getPropertyOfEntitySet(oModel, sEntitySet) {
		if (!oModel || !oModel.getMetaModel) {
			throw new Error("OData Model needs to be passed as an argument");

		}

		var oMetaModel = oModel.getMetaModel();
		var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
		return oEntityType.property ? Array.from(oEntityType.property) : [];
	}

	/**
	 * Extract properties of parameter EntitySet with other relevant informations.
	 * @param: {object} Instance of model which we can be used to derive the metamodel.
	 * @param: {string} Name of the EntitySet which has Parameter Entityset in association.
	 * @param: {boolean} bInfoParams If the full info of parameters is needed or only the name of params is needed.
	 *
	 * @return: {object} Contains name of Parameter EntitySet, keys of Parameter EntitySet and Name of Navigation property.
	 */
	function getParametersByEntitySet(oModel, sEntitySet, bInfoParams) {
		if (!oModel || !oModel.getMetaModel) {
			throw new Error("OData Model needs to be passed as an argument");

		}

		var oMetaModel = oModel.getMetaModel();
		var oResult = {
			entitySetName: null,
			parameters: [],
			navPropertyName: null
		};

		var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
		var aNavigationProperties = oEntityType.navigationProperty;

		if (!aNavigationProperties) {
			return oResult;
		}
		// filter the parameter entityset for extracting it's key and it's entityset name
		aNavigationProperties.filter(function (oNavProperty) {
			var oNavigationEntitySet = oMetaModel.getODataAssociationEnd(oEntityType, oNavProperty.name);
			var oNavigationEntityType = oMetaModel.getODataEntityType(oNavigationEntitySet.type);
			if (oNavigationEntityType["sap:semantics"] === "parameters" && oNavigationEntityType.key) {
				oResult.entitySetName = oMetaModel.getODataAssociationSetEnd(oEntityType, oNavProperty.name).entitySet;
				for (var i = 0; i < oNavigationEntityType.key.propertyRef.length; i++) {
					if (bInfoParams) {
						var navProp = oNavigationEntityType.property;
						for (var k = 0; k < navProp.length; k++) {
							if (navProp[k].name === oNavigationEntityType.key.propertyRef[i].name) {
								oResult.parameters.push(navProp[k]);
								oResult.entitySetName = oMetaModel.getODataAssociationSetEnd(
									oEntityType,
									oNavProperty.name
								).entitySet;
							}
						}
					} else {
						oResult.parameters.push(oNavigationEntityType.key.propertyRef[i].name);
					}
				}
				var aSubNavigationProperties = oNavigationEntityType.navigationProperty;
				// Parameter entityset must have association back to main entityset.
				var bBackAssociationPresent = aSubNavigationProperties.some(function (oSubNavigationProperty) {
					var sSubNavigationEntityType = oMetaModel.getODataAssociationEnd(oNavigationEntityType, oSubNavigationProperty.name).type;
					sSubNavigationEntityType === oEntitySet.entityType ? oResult.navPropertyName = oSubNavigationProperty.name : Function.prototype();
					return oResult.navPropertyName;
				});

				return bBackAssociationPresent && oResult.navPropertyName && oResult.entitySetName;
			}
			return false;
		});
		return oResult;
	}

	/**
	 * check for parameterised analytical entity set 
	 * @param: {object} Instance of model which we can be used to derive the metamodel.
	 * @param: {string} Name of the EntitySet which has Parameter Entityset in association.
	 *
	 * @return: whether the entity set is parameterised or not.
	 */
	function checkAnalyticalParameterisedEntitySet(oModel, sEntitySet) {
		if (!oModel || !oModel.getMetaModel) {
			throw new Error("OData Model needs to be passed as an argument");
		}
		var oMetaModel = oModel.getMetaModel();
		var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		if (oEntitySet && oEntitySet.entityType) {
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			if (oEntityType['sap:semantics'] && oEntityType['sap:semantics'] === 'aggregate') {
				return true;
			}
		}
		return false;
	}

	/**
	 * This function extracts and returns the property information from the entity type
	 * @param {string} sPropertyPath property path or name
	 * @param {object} oEntityType entity type
	 * @returns {array} 
	 * @public
	 */
	function getPropertyFromEntityType(sPropertyPath, oEntityType) {
        if (oEntityType && oEntityType.property) {
            return oEntityType.property.filter(function (oProperty) {
                return oProperty.name === sPropertyPath;
            });
        }
        return [];
	}

	function getPropertyFromParametersMetadata(aParametersMetadata, sPropertyPath) {
        return aParametersMetadata.filter(function (oProperty) {
            if (oProperty.name === sPropertyPath) {
                return oProperty;
            }
        });
    }

	//for transactional parameterised set
    function resolveTransactionalParameterizedEntitySet(
        oParameterInfo,
        oDataModel,
        oEntitySet,
        oSelectionVariant
    ) {
        var sPath = "";
        var aApplicableParams = [];
        if (oSelectionVariant && oSelectionVariant.Parameters) {
            oParameterInfo.parameters.forEach(function (oParam) {
                oSelectionVariant.Parameters.forEach(function (oSVParams) {
                    var sParameterName = oSVParams.PropertyName.PropertyPath.split("/");
                    sParameterName = sParameterName[sParameterName.length - 1];
                    if (sParameterName === oParam) {
                        var sValue = oSVParams.PropertyValue.String;
                        sValue = encodeURL(oDataModel.formatValue(sValue, oParameterInfo["parameterType"][oParam]));
                        aApplicableParams.push(sParameterName + "=" + sValue);
                    }
                });
            });

            var aSVParameters = oSelectionVariant.Parameters.map(function (oParameter) {
                return oParameter && oParameter.PropertyName && oParameter.PropertyName.PropertyPath;
            });
            var oParametersInfo = getParametersByEntitySet(oDataModel, oEntitySet.name);
            if (oParametersInfo.entitySetName) {
                var aParametersMetadata = getPropertyOfEntitySet(
                    oDataModel,
                    oParametersInfo.entitySetName
                );
                var aMissingSV = oParametersInfo.parameters.filter(function (sParam) {
                    return !aSVParameters.includes(sParam);
                });

                for (var i = 0; i < aMissingSV.length; i++) {
                    var param = aMissingSV[i].split("/");
                    var sPropertyPath = param[param.length - 1];
                    var aPropertyMetadata = getPropertyFromParametersMetadata(aParametersMetadata, sPropertyPath);
                    var bOptionalAnalyticParameter = false;
                    if (aPropertyMetadata.length > 0) {
                        var oProperty = aPropertyMetadata[0];
                        bOptionalAnalyticParameter = oProperty.type === "Edm.String" && oProperty["sap:parameter"] === "optional";
                    }
                    /*
                     * If the parameter is optional and there is no selection variant than set empty property value.
                     **/
                    if (bOptionalAnalyticParameter) {
                        aApplicableParams.push(sPropertyPath + "=" + "");
                    }
                }
            }
        } else {
            sPath = "/" + oEntitySet.name;
            oLogger.error("SelectionParameters", "There are no parameters to resolve");
            return sPath;
        }
        try {
            sPath =
                "/" +
                oParameterInfo.entitySetName +
                "(" +
                aApplicableParams.join(",") +
                ")/" +
                oParameterInfo.navPropertyName;
        } catch (exception) {
            sPath = "/" + oEntitySet.name;
            oLogger.error(
                "getEntitySetPathWithParameters",
                "binding path with parameters failed - " + exception || exception.message
            );
        }
        return sPath;
    }

	/**
     * For analytical paremterised-set, Get the resolved path or properties from parameterized entity set
     * 
     * @param {object} oDataModel
     * @param {object} oEntitySet
     * @param {object} oSelectionVariant
     * @param {Array} aParameters
     * @param {object} oGlobalFilter
     * @param {boolean} bPropertyNeeded If the output needs to be the parameterized entity set properties or the resolved entity path 
     * @returns {string | Array} The resolved entity path including the parametrized properties and their values or an array containing the parametrized property metadtata
     */
    function resolveAnalyticalParameterizedEntitySet(
        oDataModel,
        oEntitySet,
        oSelectionVariant,
        aParameters,
        oGlobalFilter,
        bPropertyNeeded
    ) {
        var aProperties = [];
        var path = "";
        var o4a = new odata4analytics.Model(odata4analytics.Model.ReferenceByModel(oDataModel));
        var queryResult = o4a.findQueryResultByName(oEntitySet.name);
        var queryResultRequest = new odata4analytics.QueryResultRequest(queryResult);
        var parameterization = queryResult.getParameterization();
        if (!parameterization) {
            path = "/" + oEntitySet.name;
            return bPropertyNeeded ? aProperties : path;
        }

        if (oGlobalFilter) {
            var aFilterParams = oGlobalFilter.getAnalyticalParameters();
        }

        if (parameterization) {
            var param;
            queryResultRequest.setParameterizationRequest(
                new odata4analytics.ParameterizationRequest(parameterization)
            );
            if (oSelectionVariant && oSelectionVariant.Parameters) {
                each(oSelectionVariant.Parameters, function () {
                    if (this.RecordType === "com.sap.vocabularies.UI.v1.IntervalParameter") {
                        param = this.PropertyNameFrom.PropertyPath.split("/");
                        queryResultRequest
                            .getParameterizationRequest()
                            .setParameterValue(
                                param[param.length - 1],
                                this.PropertyValueFrom.String,
                                this.PropertyValueTo.String
                            );
                    } else {
                        param = this.PropertyName.PropertyPath.split("/");
                        queryResultRequest
                            .getParameterizationRequest()
                            .setParameterValue(param[param.length - 1], this.PropertyValue.String);
                    }
                });

                var aSVParameters = oSelectionVariant.Parameters.map(function (oParameter) {
                    return oParameter && oParameter.PropertyName && oParameter.PropertyName.PropertyPath;
                });
                var oParametersInfo = getParametersByEntitySet(oDataModel, oEntitySet.name);
                if (oParametersInfo.entitySetName) {
                    var aParametersMetadata = getPropertyOfEntitySet(
                        oDataModel,
                        oParametersInfo.entitySetName
                    );
                    var aMissingSV = oParametersInfo.parameters.filter(function (sParam) {
                        return !aSVParameters.includes(sParam);
                    });

                    for (var i = 0; i < aMissingSV.length; i++) {
                        param = aMissingSV[i].split("/");
                        var sPropertyPath = param[param.length - 1];
                        var aPropertyMetadata = getPropertyFromParametersMetadata(
                            aParametersMetadata,
                            sPropertyPath
                        );
                        var bOptionalAnalyticParameter = false;
                        if (aPropertyMetadata.length > 0) {
                            var oProperty = aPropertyMetadata[0];
                            bOptionalAnalyticParameter =
                                oProperty.type === "Edm.String" && oProperty["sap:parameter"] === "optional";
                            aProperties.push(oProperty);
                        }
                        /*
                         * If the parameter is optional and there is no selection variant than set empty property value.
                         **/
                        if (bOptionalAnalyticParameter) {
                            queryResultRequest.getParameterizationRequest().setParameterValue(sPropertyPath, "");
                        }
                    }
                }
            } else if (aParameters && aParameters.length > 0) {
                each(aParameters, function () {
                    queryResultRequest.getParameterizationRequest().setParameterValue(this.path, this.value);
                });
            } else if (aFilterParams && aFilterParams.length > 0) {
                /*
                 * If there is no selectionvariant defined with parameters but the global filter has a default parameter, resolve the entitySet path here
                 * */
                var oUiState =
                    oGlobalFilter &&
                    oGlobalFilter.getUiState({
                        allFilters: false
                    });
                var sSelectionVariant = oUiState ? JSON.stringify(oUiState.getSelectionVariant()) : "{}";
                var oSelectionVariant = new SelectionVariant(sSelectionVariant);
                /*
                 * From parameterization object, retrieve the parameters set.
                 * For each parameter in the parameter set, check if it is present in the filterparams.
                 * */
                for (var sKey in parameterization.getAllParameters()) {
                    for (var i = 0; i < aFilterParams.length; i++) {
                        if (aFilterParams[i] && aFilterParams[i].name == sKey) {
                            var sParameterName = aFilterParams[i].name;
                            //To get the current value of the parameter
                            var sValue = oSelectionVariant.getParameter(sParameterName);
                            if (!sValue) {
                                var oSelectOption = oSelectionVariant.getSelectOption(sParameterName);
                                sValue = oSelectOption && oSelectOption[0] && oSelectOption[0].Low;
                            }
                            queryResultRequest.getParameterizationRequest().setParameterValue(sKey, sValue);
                        }
                    }
                }
            } else {
                path = "/" + oEntitySet.name;
                oLogger.error("SelectionParameters", "There are no parameters to resolve");
                return bPropertyNeeded ? aProperties : path;
            }
        }

        try {
            path = queryResultRequest.getURIToQueryResultEntitySet();
        } catch (exception) {
            queryResult = queryResultRequest.getQueryResult();
            path = "/" + queryResult.getEntitySet().getQName();
            oLogger.error(
                "getEntitySetPathWithParameters",
                "binding path with parameters failed - " + exception || exception.message
            );
        }
        return bPropertyNeeded ? aProperties : path;
    }

	function resolveParameterizedEntitySet(oDataModel, oEntitySet, oSelectionVariant, aParameters, oGlobalFilter) {
        var path = "";
        //check whether the entity set is a parameterized analytical set or transactional Parameterized entity set
        if (checkAnalyticalParameterisedEntitySet(oDataModel, oEntitySet.name)) {
            path = resolveAnalyticalParameterizedEntitySet(
                oDataModel,
                oEntitySet,
                oSelectionVariant,
                aParameters,
                oGlobalFilter
            );
        } else {
            //for transactional parameterised entity seys
            var oParameterInfo = getParametersByEntitySet(oDataModel, oEntitySet.name);
            var oEntityTypeProperties = getPropertyOfEntitySet(oDataModel, oEntitySet.name); //pre-existing method defined to get metadat properties
            var oParamType = {};
            if (oParameterInfo) {
                //oParameterInfo would now have a property defined as parameterType which will store the the parameter name and it's type
                oParameterInfo["parameters"].forEach(function (param) {
                    oEntityTypeProperties.forEach(function (paramProp) {
                        if (paramProp["name"] == param) {
                            oParamType[param] = paramProp["type"];
                        }
                    });
                });
                oParameterInfo["parameterType"] = oParamType;
                //The entitySet is parameterised but transactional
                path = resolveTransactionalParameterizedEntitySet(
                    oParameterInfo,
                    oDataModel,
                    oEntitySet,
                    oSelectionVariant
                );
            } else {
                path = "/" + oEntitySet.name;
            }
        }
        return path;
    }

	return {
		getPropertyOfEntitySet: getPropertyOfEntitySet,
		getParametersByEntitySet: getParametersByEntitySet,
		checkAnalyticalParameterisedEntitySet: checkAnalyticalParameterisedEntitySet,
		getPropertyFromEntityType: getPropertyFromEntityType,
		resolveTransactionalParameterizedEntitySet: resolveTransactionalParameterizedEntitySet,
		resolveAnalyticalParameterizedEntitySet: resolveAnalyticalParameterizedEntitySet,
		resolveParameterizedEntitySet: resolveParameterizedEntitySet
	};
});
