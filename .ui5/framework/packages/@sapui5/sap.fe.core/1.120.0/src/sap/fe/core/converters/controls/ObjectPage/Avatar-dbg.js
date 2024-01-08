/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/BindingToolkit"], function (BindingToolkit) {
  "use strict";

  var _exports = {};
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  var AvatarShape;
  (function (AvatarShape) {
    AvatarShape["Circle"] = "Circle";
    AvatarShape["Square"] = "Square";
  })(AvatarShape || (AvatarShape = {}));
  const isNaturalPerson = converterContext => {
    var _converterContext$get, _converterContext$get2;
    return ((_converterContext$get = converterContext.getEntityType().annotations.Common) === null || _converterContext$get === void 0 ? void 0 : (_converterContext$get2 = _converterContext$get.IsNaturalPerson) === null || _converterContext$get2 === void 0 ? void 0 : _converterContext$get2.valueOf()) === true;
  };
  const getFallBackIcon = converterContext => {
    var _converterContext$get3, _converterContext$get4;
    const headerInfo = (_converterContext$get3 = converterContext.getEntityType().annotations) === null || _converterContext$get3 === void 0 ? void 0 : (_converterContext$get4 = _converterContext$get3.UI) === null || _converterContext$get4 === void 0 ? void 0 : _converterContext$get4.HeaderInfo;
    if (!headerInfo || headerInfo && !headerInfo.ImageUrl && !headerInfo.TypeImageUrl) {
      return undefined;
    }
    if (headerInfo.ImageUrl && headerInfo.TypeImageUrl) {
      return compileExpression(getExpressionFromAnnotation(headerInfo.TypeImageUrl));
    }
    return compileExpression(isNaturalPerson(converterContext) ? "sap-icon://person-placeholder" : "sap-icon://product");
  };
  const getSource = converterContext => {
    var _converterContext$get5, _converterContext$get6;
    const headerInfo = (_converterContext$get5 = converterContext.getEntityType().annotations) === null || _converterContext$get5 === void 0 ? void 0 : (_converterContext$get6 = _converterContext$get5.UI) === null || _converterContext$get6 === void 0 ? void 0 : _converterContext$get6.HeaderInfo;
    if (!headerInfo || !(headerInfo.ImageUrl || headerInfo.TypeImageUrl)) {
      return undefined;
    }
    return compileExpression(getExpressionFromAnnotation(headerInfo.ImageUrl || headerInfo.TypeImageUrl));
  };
  const getAvatar = converterContext => {
    var _converterContext$get7, _converterContext$get8;
    const headerInfo = (_converterContext$get7 = converterContext.getEntityType().annotations) === null || _converterContext$get7 === void 0 ? void 0 : (_converterContext$get8 = _converterContext$get7.UI) === null || _converterContext$get8 === void 0 ? void 0 : _converterContext$get8.HeaderInfo;
    const oSource = headerInfo && (headerInfo.ImageUrl || headerInfo.TypeImageUrl || headerInfo.Initials);
    if (!oSource) {
      return undefined;
    }
    return {
      src: getSource(converterContext),
      initials: compileExpression(getExpressionFromAnnotation(headerInfo === null || headerInfo === void 0 ? void 0 : headerInfo.Initials, [], "")),
      fallbackIcon: getFallBackIcon(converterContext),
      displayShape: compileExpression(isNaturalPerson(converterContext) ? AvatarShape.Circle : AvatarShape.Square)
    };
  };
  _exports.getAvatar = getAvatar;
  return _exports;
}, false);
