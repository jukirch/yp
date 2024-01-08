sap.ui.define([], function() {
		"use strict";

	// A canonical path is split into an object containing two (string) properties: 'entitySet' and 'key'
	function fnSplitCanonicalPath(sPath){
		if (sPath.indexOf("/") === 0){
			sPath = sPath.substring(1); // remove leading "/" is present
		}
		var aPath = sPath.split("(");
		var sEntitySet = aPath.shift(); // entity set is the first component without leading "/"
		var sRest = aPath.join("("); // concatenate the rest again in case it has contained additional (s
		var sKey = sRest.substring(0, sRest.length - 1); // remove the closing )
		return {
			entitySet: sEntitySet,
			key: sKey,
			canonicalPath: "/" + sPath
		};
	}

	// For a given context path this returns some information about it.
	// Up to now result has same format as fnSplitCanonicalPath	
	function fnAnalyseContextPath(sPath, oModel){
		if (sPath.lastIndexOf("/") !== 0){ // might be a deep path
			var oMetaModel = oModel.getMetaModel();
			sPath = oMetaModel.oMetadata._calculateCanonicalPath(sPath);  // temporary use of private UI5 function
			if (!sPath){
				return {};
			}
		}
		return fnSplitCanonicalPath(sPath);		
	}
	
	// For a given instance of sap.ui.model.Context this returns some information about it.
	// Information is same as given by fnAnalyseContextPath
	function fnAnalyseContext(oContext){
		return fnAnalyseContextPath(oContext.getPath(), oContext.getModel());
	}

	// Splits an access path to a property and returns an object containing properties "navigationPath" and "property".
	// "property" contains the name of the property specified by the path, "navigationPath" is either the empty string (if the access path is not deep) or the absolut path to the instance containing the property
	// Note that the access path (given by sAaccessPath) should be relative (i.e. not start with a "/").
	function fnSplitAccessPath(sAccessPath){
		var iLastSlashAt = sAccessPath.lastIndexOf("/");
		return {
			navigationPath: iLastSlashAt < 0 ? "" : ("/" + sAccessPath.substring(0, iLastSlashAt)),
			property: sAccessPath.substring(iLastSlashAt + 1)
		};
	}
	
	// Promisifying the oModel.read() CRUD operation which returns the success response on resolve. 
	function fnGetData(oModel,sPath) {
		return new Promise(function(resolve, reject) {
			oModel.read(sPath, {
				success: resolve,
				error: reject
			});
		});
	}

	return {
		splitCanonicalPath: fnSplitCanonicalPath,
		analyseContextPath: fnAnalyseContextPath,
		analyseContext: fnAnalyseContext,
		splitAccessPath: fnSplitAccessPath,
		getData: fnGetData
	};
});