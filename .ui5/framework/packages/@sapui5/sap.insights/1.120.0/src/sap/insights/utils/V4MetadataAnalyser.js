/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([], function () {
    "use strict";

    return {
        _search: function (object, sPath) {
			return sPath ? sPath.split("/").reduce(function (oObj, sKey) { return oObj && sKey ? oObj[sKey] : oObj; }, object) : undefined;
		},

		getAnnotations: function (oDataModel, oDescriptor, sFilterName, aProperties) {
			return this._fetchEntitySetName(oDataModel, oDescriptor, sFilterName)
				.then(function (sEntitySetName) {
					return Promise.all(aProperties.map(function (sAnnotation) {
						return this.getMetadataProperty(oDataModel, sEntitySetName, sFilterName, sAnnotation);
					}.bind(this)));
				}.bind(this));
		},

		_fetchEntitySetName: function (oDataModel, oDescriptor, sFilterName) {
			var sCardEntitySetName = this._search(oDescriptor, "/sap.card/configuration/parameters/_entitySet/value"),
				aRelavantParameters = this._search(oDescriptor, "/sap.card/configuration/parameters/_relevantODataParameters/value"),
				sFilterEntitySetName = this._search(oDescriptor, "/sap.insights/filterEntitySet"),
				sFinalEntitySetName = "";

			return this.getMetadataProperty(oDataModel, sCardEntitySetName)
				.then(function (oEntitySet) {
					if (oEntitySet) {
						if (Object.keys(oEntitySet).includes(sFilterName)) {
							sFinalEntitySetName = sCardEntitySetName;
						} else if (!aRelavantParameters.includes(sFilterName)) {
							sFinalEntitySetName = sFilterEntitySetName;
						} else {
							var sParameterEntityType = this._search(oEntitySet, "/Parameters/$Type"),
								aParts = sParameterEntityType.split('.'),
								//find name of parameterised entitytype
								sParameterEntityTypeName = aParts[aParts.length - 1];

							return this.getMetadataProperty(oDataModel, sParameterEntityTypeName)
								.then(function (oParameterEntitySet) {
									return Object.keys(oParameterEntitySet).includes(sFilterName) ? sParameterEntityTypeName : sFilterEntitySetName;
								});
						}
					}

					return sFinalEntitySetName;
				}.bind(this));
		},

		getMetadataProperty: function (oModel, sEntitySet, sPropertyName, sAnnotation) {
			if (!oModel || !oModel.getMetaModel) {
				return false;
			}

			return oModel.getMetaModel().requestObject("/" + sEntitySet + "/" + (sPropertyName || "") + (sAnnotation || ""));
		}
    };
});