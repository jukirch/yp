/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"], function (Log) {
  "use strict";

  const SemanticKeyHelper = {
    getSemanticKeys: function (oMetaModel, sEntitySetName) {
      return oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticKey`);
    },
    getSemanticObjectInformation: function (oMetaModel, sEntitySetName) {
      const oSemanticObject = oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticObject`);
      const aSemanticKeys = this.getSemanticKeys(oMetaModel, sEntitySetName);
      return {
        semanticObject: oSemanticObject,
        semanticKeys: aSemanticKeys
      };
    },
    getSemanticPath: function (oContext) {
      let bStrict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      const oMetaModel = oContext.getModel().getMetaModel(),
        sEntitySetName = oMetaModel.getMetaContext(oContext.getPath()).getObject("@sapui.name"),
        oSemanticObjectInformation = this.getSemanticObjectInformation(oMetaModel, sEntitySetName);
      let sTechnicalPath, sSemanticPath;
      if (oContext.isA("sap.ui.model.odata.v4.ODataListBinding") && oContext.isRelative()) {
        sTechnicalPath = oContext.getHeaderContext().getPath();
      } else {
        sTechnicalPath = oContext.getPath();
      }
      if (this._isPathForSemantic(sTechnicalPath) && oSemanticObjectInformation.semanticKeys) {
        const aSemanticKeys = oSemanticObjectInformation.semanticKeys,
          oEntityType = oMetaModel.getObject(`/${oMetaModel.getObject(`/${sEntitySetName}`).$Type}`);
        try {
          const sSemanticKeysPart = aSemanticKeys.map(function (oSemanticKey) {
            const sPropertyPath = oSemanticKey.$PropertyPath;
            let sKeyValue = oContext.getProperty(sPropertyPath);
            if (sKeyValue === undefined || sKeyValue === null) {
              throw new Error(`Couldn't resolve semantic key value for ${sPropertyPath}`);
            } else {
              if (oEntityType[sPropertyPath].$Type === "Edm.String") {
                sKeyValue = `'${encodeURIComponent(sKeyValue)}'`;
              }
              if (aSemanticKeys.length > 1) {
                // Several semantic keys --> path should be entitySet(key1=value1, key2=value2, ...)
                // Otherwise we keep entitySet(keyValue)
                sKeyValue = `${sPropertyPath}=${sKeyValue}`;
              }
              return sKeyValue;
            }
          }).join(",");
          sSemanticPath = `/${sEntitySetName}(${sSemanticKeysPart})`;
        } catch (e) {
          Log.info(e);
        }
      }
      return bStrict ? sSemanticPath : sSemanticPath || sTechnicalPath;
    },
    // ==============================
    // INTERNAL METHODS
    // ==============================

    _isPathForSemantic: function (sPath) {
      // Only path on root objects allow semantic keys, i.e. sPath = xxx(yyy)
      return /^[^()]+\([^()]+\)$/.test(sPath);
    }
  };
  return SemanticKeyHelper;
}, false);
