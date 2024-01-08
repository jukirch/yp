/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters"], function (PropertyHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  const getDisplayProperty = function (propertyObjectPath, propertyConverted) {
    return hasValueHelp(propertyConverted) ? getDisplayMode(propertyObjectPath) : "Value";
  };
  _exports.getDisplayProperty = getDisplayProperty;
  const getFilterFieldDisplayFormat = async function (propertyObjectPath, propertyConverted, propertyInterface) {
    var _propertyConverted$an, _propertyConverted$an2;
    const oTextAnnotation = propertyConverted === null || propertyConverted === void 0 ? void 0 : (_propertyConverted$an = propertyConverted.annotations) === null || _propertyConverted$an === void 0 ? void 0 : (_propertyConverted$an2 = _propertyConverted$an.Common) === null || _propertyConverted$an2 === void 0 ? void 0 : _propertyConverted$an2.Text;
    if (oTextAnnotation) {
      // The text annotation should be on the property defined
      return getDisplayProperty(propertyObjectPath, propertyConverted);
    }
    const bHasValueHelp = hasValueHelp(propertyConverted);
    if (bHasValueHelp) {
      var _propertyObjectPath$t, _propertyObjectPath$t2, _propertyObjectPath$t3;
      // Exceptional case for missing text annotation on the property (retrieve text from value list)
      // Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
      const entityTextArrangement = propertyObjectPath === null || propertyObjectPath === void 0 ? void 0 : (_propertyObjectPath$t = propertyObjectPath.targetEntityType) === null || _propertyObjectPath$t === void 0 ? void 0 : (_propertyObjectPath$t2 = _propertyObjectPath$t.annotations) === null || _propertyObjectPath$t2 === void 0 ? void 0 : (_propertyObjectPath$t3 = _propertyObjectPath$t2.UI) === null || _propertyObjectPath$t3 === void 0 ? void 0 : _propertyObjectPath$t3.TextArrangement;
      return entityTextArrangement ? getDisplayMode(propertyObjectPath) : _getDisplayModeFromValueHelp(propertyInterface, propertyObjectPath);
    }
    return "Value";
  };
  _exports.getFilterFieldDisplayFormat = getFilterFieldDisplayFormat;
  /**
   * Method to determine the display mode from the value help.
   *
   * @param Interface The current templating context
   * @param propertyObjectPath The global path to reach the entitySet
   * @returns A promise with the string 'DescriptionValue' or 'Value', depending on whether a text annotation exists for the property in the value help
   * Hint: A text arrangement is consciously ignored. If the text is retrieved from the value help, the text arrangement of the value help property isn´t considered. Instead, the default text arrangement #TextFirst
   * is used.
   */
  async function _getDisplayModeFromValueHelp(Interface, propertyObjectPath) {
    const context = Interface.context;
    const metaModel = Interface.context.getModel();
    return metaModel.requestValueListInfo(context.getPath(), true, context).then(function (valueListInfo) {
      var _firstValueListInfo$P;
      const firstKey = Object.keys(valueListInfo)[0];
      const firstValueListInfo = valueListInfo[firstKey];
      const valueListParameter = (_firstValueListInfo$P = firstValueListInfo.Parameters) === null || _firstValueListInfo$P === void 0 ? void 0 : _firstValueListInfo$P.find(element => {
        var _element$LocalDataPro, _propertyObjectPath$t4;
        return ((_element$LocalDataPro = element.LocalDataProperty) === null || _element$LocalDataPro === void 0 ? void 0 : _element$LocalDataPro.$PropertyPath) === (propertyObjectPath === null || propertyObjectPath === void 0 ? void 0 : (_propertyObjectPath$t4 = propertyObjectPath.targetObject) === null || _propertyObjectPath$t4 === void 0 ? void 0 : _propertyObjectPath$t4.name);
      });
      const valueListProperty = valueListParameter === null || valueListParameter === void 0 ? void 0 : valueListParameter.ValueListProperty;
      const textAnnotation = metaModel.getObject("/" + firstValueListInfo.CollectionPath + "/" + valueListProperty + "@com.sap.vocabularies.Common.v1.Text");
      return textAnnotation ? "DescriptionValue" : "Value";
    });
  }
  _exports._getDisplayModeFromValueHelp = _getDisplayModeFromValueHelp;
  return _exports;
}, false);
