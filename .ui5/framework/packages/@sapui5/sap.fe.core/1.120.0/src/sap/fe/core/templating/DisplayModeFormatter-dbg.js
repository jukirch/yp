/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  const ODATA_TYPE_MAPPING = {
    "sap.ui.model.odata.type.Boolean": "Edm.Boolean",
    "sap.ui.model.odata.type.Byte": "Edm.Byte",
    "sap.ui.model.odata.type.Date": "Edm.Date",
    "sap.ui.model.odata.type.DateTimeOffset": "Edm.DateTimeOffset",
    "sap.ui.model.odata.type.Decimal": "Edm.Decimal",
    "sap.ui.model.odata.type.Double": "Edm.Double",
    "sap.ui.model.odata.type.Guid": "Edm.Guid",
    "sap.ui.model.odata.type.Int16": "Edm.Int16",
    "sap.ui.model.odata.type.Int32": "Edm.Int32",
    "sap.ui.model.odata.type.Int64": "Edm.Int64",
    "sap.ui.model.odata.type.SByte": "Edm.SByte",
    "sap.ui.model.odata.type.Single": "Edm.Single",
    "sap.ui.model.odata.type.Stream": "Edm.Stream",
    "sap.ui.model.odata.type.TimeOfDay": "Edm.TimeOfDay",
    "sap.ui.model.odata.type.String": "Edm.String"
  };
  _exports.ODATA_TYPE_MAPPING = ODATA_TYPE_MAPPING;
  const getDisplayMode = function (oPropertyPath, oDataModelObjectPath) {
    var _oProperty$annotation, _oProperty$annotation2, _oTextAnnotation$anno, _oTextAnnotation$anno2, _oTextAnnotation$anno3, _oEntityType$annotati, _oEntityType$annotati2, _oEntityType$annotati3, _oEntityType$annotati4, _oEntityType$annotati5, _oEntityType$annotati6;
    if (!oPropertyPath || typeof oPropertyPath === "string") {
      return "Value";
    }
    const oProperty = (isPathAnnotationExpression(oPropertyPath) || isPropertyPathExpression(oPropertyPath)) && oPropertyPath.$target || oPropertyPath;
    const oEntityType = oDataModelObjectPath && oDataModelObjectPath.targetEntityType;
    const oTextAnnotation = (_oProperty$annotation = oProperty.annotations) === null || _oProperty$annotation === void 0 ? void 0 : (_oProperty$annotation2 = _oProperty$annotation.Common) === null || _oProperty$annotation2 === void 0 ? void 0 : _oProperty$annotation2.Text;
    const oTextArrangementAnnotation = typeof oTextAnnotation !== "string" && (oTextAnnotation === null || oTextAnnotation === void 0 ? void 0 : (_oTextAnnotation$anno = oTextAnnotation.annotations) === null || _oTextAnnotation$anno === void 0 ? void 0 : (_oTextAnnotation$anno2 = _oTextAnnotation$anno.UI) === null || _oTextAnnotation$anno2 === void 0 ? void 0 : (_oTextAnnotation$anno3 = _oTextAnnotation$anno2.TextArrangement) === null || _oTextAnnotation$anno3 === void 0 ? void 0 : _oTextAnnotation$anno3.toString()) || (oEntityType === null || oEntityType === void 0 ? void 0 : (_oEntityType$annotati = oEntityType.annotations) === null || _oEntityType$annotati === void 0 ? void 0 : (_oEntityType$annotati2 = _oEntityType$annotati.UI) === null || _oEntityType$annotati2 === void 0 ? void 0 : (_oEntityType$annotati3 = _oEntityType$annotati2.TextArrangement) === null || _oEntityType$annotati3 === void 0 ? void 0 : _oEntityType$annotati3.toString());
    let sDisplayValue = oTextAnnotation ? "DescriptionValue" : "Value";
    if (oTextAnnotation && oTextArrangementAnnotation || oEntityType !== null && oEntityType !== void 0 && (_oEntityType$annotati4 = oEntityType.annotations) !== null && _oEntityType$annotati4 !== void 0 && (_oEntityType$annotati5 = _oEntityType$annotati4.UI) !== null && _oEntityType$annotati5 !== void 0 && (_oEntityType$annotati6 = _oEntityType$annotati5.TextArrangement) !== null && _oEntityType$annotati6 !== void 0 && _oEntityType$annotati6.toString()) {
      if (oTextArrangementAnnotation === "UI.TextArrangementType/TextOnly") {
        sDisplayValue = "Description";
      } else if (oTextArrangementAnnotation === "UI.TextArrangementType/TextLast") {
        sDisplayValue = "ValueDescription";
      } else if (oTextArrangementAnnotation === "UI.TextArrangementType/TextSeparate") {
        sDisplayValue = "Value";
      } else {
        //Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
        sDisplayValue = "DescriptionValue";
      }
    }
    return sDisplayValue;
  };
  _exports.getDisplayMode = getDisplayMode;
  return _exports;
}, false);
