/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/m/table/Util"], function (Log, SizeHelper, DisplayModeFormatter, TableUtil) {
  "use strict";

  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  const TableSizeHelper = {
    /**
     * Method to calculate the width of the MDCColumn.
     *
     * @param dataField The Property or PropertyInfo Object for which the width will be calculated.
     * @param properties An array containing all property definitions (optional)
     * @param convertedMetaData
     * @param widthIncludingColumnHeader Indicates if the label should be a part of the width calculation
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns The width of the column.
     */
    getMDCColumnWidthFromDataField: function (dataField, properties, convertedMetaData) {
      let widthIncludingColumnHeader = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      const property = properties.find(prop => {
        var _convertedMetaData$re, _convertedMetaData$re2;
        return prop.metadataPath && ((_convertedMetaData$re = convertedMetaData.resolvePath(prop.metadataPath)) === null || _convertedMetaData$re === void 0 ? void 0 : (_convertedMetaData$re2 = _convertedMetaData$re.target) === null || _convertedMetaData$re2 === void 0 ? void 0 : _convertedMetaData$re2.fullyQualifiedName) === dataField.fullyQualifiedName;
      });
      return property ? this.getMDCColumnWidthFromProperty(property, properties, widthIncludingColumnHeader) : 0;
    },
    getMDCColumnWidthFromProperty: function (property, properties) {
      var _property$visualSetti, _property$propertyInf, _property$typeConfig;
      let widthIncludingColumnHeader = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const mWidthCalculation = Object.assign({
        gap: 0,
        truncateLabel: !widthIncludingColumnHeader,
        excludeProperties: []
      }, (_property$visualSetti = property.visualSettings) === null || _property$visualSetti === void 0 ? void 0 : _property$visualSetti.widthCalculation);
      let types;
      if ((_property$propertyInf = property.propertyInfos) !== null && _property$propertyInf !== void 0 && _property$propertyInf.length) {
        types = property.propertyInfos.map(propName => {
          var _prop$typeConfig;
          const prop = properties.find(_property => _property.name === propName);
          return prop === null || prop === void 0 ? void 0 : (_prop$typeConfig = prop.typeConfig) === null || _prop$typeConfig === void 0 ? void 0 : _prop$typeConfig.typeInstance;
        }).filter(item => item);
      } else if (property !== null && property !== void 0 && (_property$typeConfig = property.typeConfig) !== null && _property$typeConfig !== void 0 && _property$typeConfig.typeInstance) {
        types = [property === null || property === void 0 ? void 0 : property.typeConfig.typeInstance];
      }
      const sSize = types ? TableUtil.calcColumnWidth(types, property.label, mWidthCalculation) : null;
      if (!sSize) {
        Log.error(`Cannot compute the column width for property: ${property.name}`);
      }
      return sSize ? parseFloat(sSize.replace("Rem", "")) : 0;
    },
    /**
     * Method to calculate the  width of a DataFieldAnnotation object contained in a fieldGroup.
     *
     * @param dataField DataFieldAnnotation object.
     * @param widthIncludingColumnHeader Indicates if the column header should be a part of the width calculation.
     * @param properties Array containing all PropertyInfo objects.
     * @param convertedMetaData
     * @param showDataFieldsLabel Label is displayed inside the field
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns Object containing the width of the label and the width of the property.
     */
    getWidthForDataFieldForAnnotation: function (dataField, widthIncludingColumnHeader, properties, convertedMetaData) {
      var _dataField$Target;
      let showDataFieldsLabel = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      const oTargetedProperty = dataField === null || dataField === void 0 ? void 0 : (_dataField$Target = dataField.Target) === null || _dataField$Target === void 0 ? void 0 : _dataField$Target.$target;
      let nPropertyWidth = 0,
        fLabelWidth = 0;
      if (oTargetedProperty !== null && oTargetedProperty !== void 0 && oTargetedProperty.Visualization) {
        switch (oTargetedProperty.Visualization) {
          case "UI.VisualizationType/Rating":
            const nbStars = oTargetedProperty.TargetValue;
            nPropertyWidth = parseInt(nbStars, 10) * 1.375;
            break;
          case "UI.VisualizationType/Progress":
          default:
            nPropertyWidth = 5;
        }
        const sLabel = oTargetedProperty ? oTargetedProperty.label : dataField.Label || "";
        fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
      } else if (convertedMetaData && properties && (oTargetedProperty === null || oTargetedProperty === void 0 ? void 0 : oTargetedProperty.$Type) === "com.sap.vocabularies.Communication.v1.ContactType") {
        nPropertyWidth = this.getMDCColumnWidthFromDataField(oTargetedProperty.fn.$target, properties, convertedMetaData, widthIncludingColumnHeader);
      }
      return {
        labelWidth: fLabelWidth,
        propertyWidth: nPropertyWidth
      };
    },
    /**
     * Method to calculate the width of a DataField object.
     *
     * @param dataField DataFieldAnnotation object.
     * @param showDataFieldsLabel Label is displayed inside the field.
     * @param properties Array containing all PropertyInfo objects.
     * @param convertedMetaData Context Object of the parent property.
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns {object} Object containing the width of the label and the width of the property.
     */

    getWidthForDataField: function (dataField, showDataFieldsLabel, properties, convertedMetaData, widthIncludingColumnHeader) {
      var _dataField$Value, _oTargetedProperty$an, _oTargetedProperty$an2, _dataField$Value2;
      const oTargetedProperty = (_dataField$Value = dataField.Value) === null || _dataField$Value === void 0 ? void 0 : _dataField$Value.$target,
        oTextArrangementTarget = oTargetedProperty === null || oTargetedProperty === void 0 ? void 0 : (_oTargetedProperty$an = oTargetedProperty.annotations) === null || _oTargetedProperty$an === void 0 ? void 0 : (_oTargetedProperty$an2 = _oTargetedProperty$an.Common) === null || _oTargetedProperty$an2 === void 0 ? void 0 : _oTargetedProperty$an2.Text,
        displayMode = getDisplayMode((_dataField$Value2 = dataField.Value) === null || _dataField$Value2 === void 0 ? void 0 : _dataField$Value2.$target);
      let nPropertyWidth = 0,
        fLabelWidth = 0;
      if (oTargetedProperty) {
        switch (displayMode) {
          case "Description":
            nPropertyWidth = this.getMDCColumnWidthFromDataField(oTextArrangementTarget.$target, properties, convertedMetaData, widthIncludingColumnHeader) - 1;
            break;
          case "DescriptionValue":
          case "ValueDescription":
          case "Value":
          default:
            nPropertyWidth = this.getMDCColumnWidthFromDataField(oTargetedProperty, properties, convertedMetaData, widthIncludingColumnHeader) - 1;
        }
        const sLabel = dataField.Label ? dataField.Label : oTargetedProperty.label;
        fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
      } else {
        Log.error(`Cannot compute width for type object: ${dataField.$Type}`);
      }
      return {
        labelWidth: fLabelWidth,
        propertyWidth: nPropertyWidth
      };
    }
  };
  return TableSizeHelper;
}, false);
