/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/TableFormatterTypes", "sap/fe/macros/DelegateUtil", "sap/fe/macros/table/TableSizeHelper", "sap/ui/mdc/enums/FieldEditMode", "../CommonUtils", "../helpers/SizeHelper"], function (TableFormatterTypes, DelegateUtil, TableSizeHelper, FieldEditMode, CommonUtils, SizeHelper) {
  "use strict";

  var MessageType = TableFormatterTypes.MessageType;
  const getMessagetypeOrder = function (messageType) {
    switch (messageType) {
      case "Error":
        return 4;
      case "Warning":
        return 3;
      case "Information":
        return 2;
      case "None":
        return 1;
      default:
        return -1;
    }
  };

  /**
   * Gets the validity of creation row fields.
   *
   * @param fieldValidityObject Object holding the fields
   * @returns `true` if all the fields in the creation row are valid, `false` otherwise
   */
  const validateCreationRowFields = function (fieldValidityObject) {
    if (!fieldValidityObject) {
      return false;
    }
    const fieldKeys = Object.keys(fieldValidityObject);
    return fieldKeys.length > 0 && fieldKeys.every(function (key) {
      return fieldValidityObject[key]["validity"];
    });
  };
  validateCreationRowFields.__functionName = "sap.fe.core.formatters.TableFormatter#validateCreationRowFields";

  /**
   * @param this The object status control.
   * @param semanticKeyHasDraftIndicator The property name of the draft indicator.
   * @param aFilteredMessages Array of messages.
   * @param columnName
   * @param isSemanticKeyInFieldGroup Flag which says if semantic key is a part of field group.
   * @returns The value for the visibility property of the object status
   */
  const getErrorStatusTextVisibilityFormatter = function (semanticKeyHasDraftIndicator, aFilteredMessages, columnName, isSemanticKeyInFieldGroup) {
    let bStatusVisibility = false;
    if (aFilteredMessages && aFilteredMessages.length > 0 && (isSemanticKeyInFieldGroup || columnName === semanticKeyHasDraftIndicator)) {
      const sCurrentContextPath = this.getBindingContext() ? this.getBindingContext().getPath() : undefined;
      aFilteredMessages.forEach(oMessage => {
        if (oMessage.type === "Error" && oMessage.aTargets[0].indexOf(sCurrentContextPath) === 0) {
          bStatusVisibility = true;
          return bStatusVisibility;
        }
      });
    }
    return bStatusVisibility;
  };
  getErrorStatusTextVisibilityFormatter.__functionName = "sap.fe.core.formatters.TableFormatter#getErrorStatusTextVisibilityFormatter";

  /**
   * rowHighlighting
   *
   * @param {object} this The context
   * @param {string|number} CriticalityValue The criticality value
   * @param {number} messageLastUpdate Timestamp of the last message that was created. It's defined as an input value, but not used in the body of the function
   * It is used to refresh the formatting of the table each time a new message is updated
   * @returns {object} The value from the inner function
   */

  const rowHighlighting = function (criticalityValue, aFilteredMessages, hasActiveEntity, isActiveEntity, isDraftMode) {
    var _this$getBindingConte2;
    let iHighestCriticalityValue = -1;
    if (aFilteredMessages && aFilteredMessages.length > 0) {
      var _this$getBindingConte;
      const sCurrentContextPath = (_this$getBindingConte = this.getBindingContext()) === null || _this$getBindingConte === void 0 ? void 0 : _this$getBindingConte.getPath();
      aFilteredMessages.forEach(oMessage => {
        if (oMessage.aTargets[0].indexOf(sCurrentContextPath) === 0 && iHighestCriticalityValue < getMessagetypeOrder(oMessage.type)) {
          iHighestCriticalityValue = getMessagetypeOrder(oMessage.type);
          criticalityValue = oMessage.type;
        }
      });
    }
    if (typeof criticalityValue !== "string") {
      switch (criticalityValue) {
        case 1:
          criticalityValue = MessageType.Error;
          break;
        case 2:
          criticalityValue = MessageType.Warning;
          break;
        case 3:
          criticalityValue = MessageType.Success;
          break;
        case 5:
          criticalityValue = MessageType.Information;
          break;
        default:
          criticalityValue = MessageType.None;
      }
    }

    // If we have calculated a criticality <> None, return it
    if (criticalityValue !== MessageType.None) {
      return criticalityValue;
    }

    // If not, we set criticality to 'Information' for newly created rows in Draft mode, and keep 'None' otherwise
    const isInactive = ((_this$getBindingConte2 = this.getBindingContext()) === null || _this$getBindingConte2 === void 0 ? void 0 : _this$getBindingConte2.isInactive()) ?? false;
    const isNewObject = !hasActiveEntity && !isActiveEntity && !isInactive;
    return isDraftMode === "true" && isNewObject ? MessageType.Information : MessageType.None;
  };
  rowHighlighting.__functionName = "sap.fe.core.formatters.TableFormatter#rowHighlighting";
  const navigatedRow = function (sDeepestPath) {
    var _this$getBindingConte3;
    const sPath = (_this$getBindingConte3 = this.getBindingContext()) === null || _this$getBindingConte3 === void 0 ? void 0 : _this$getBindingConte3.getPath();
    if (sPath && sDeepestPath) {
      return sDeepestPath.indexOf(sPath) === 0;
    } else {
      return false;
    }
  };
  navigatedRow.__functionName = "sap.fe.core.formatters.TableFormatter#navigatedRow";

  /**
   * Method to calculate the width of an MDCColumn based on the property definition.
   *
   * @param this The MDCColumn object
   * @param editMode The EditMode of the table
   * @param isPropertiesCacheAvailable Indicates if the properties cache is available
   * @param propertyName The name of the property we want to calculate the width
   * @param useRemUnit Indicates if the rem unit must be concatenated with the column width result
   * @param widthIncludingColumnHeader Indicates if the column header should be a part of the width calculation.
   * @returns The width of the column
   */
  const getColumnWidth = function (editMode, isPropertiesCacheAvailable, propertyName) {
    var _property$exportSetti, _property$exportSetti2;
    let useRemUnit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    let widthIncludingColumnHeader = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    if (!isPropertiesCacheAvailable) {
      return null;
    }
    const table = this.getParent();
    const properties = DelegateUtil.getCachedProperties(table);
    if (!properties) return null;
    const property = properties.find(prop => prop.name === propertyName);
    if (!property) return null;
    let columnWidth = TableSizeHelper.getMDCColumnWidthFromProperty(property, properties, widthIncludingColumnHeader);
    const unitOrTimezone = ((_property$exportSetti = property.exportSettings) === null || _property$exportSetti === void 0 ? void 0 : _property$exportSetti.unit) || ((_property$exportSetti2 = property.exportSettings) === null || _property$exportSetti2 === void 0 ? void 0 : _property$exportSetti2.timezone);
    columnWidth += unitOrTimezone ? SizeHelper.getButtonWidth(unitOrTimezone) : 0;
    if (editMode === FieldEditMode.Editable) {
      var _property$typeConfig;
      switch ((_property$typeConfig = property.typeConfig) === null || _property$typeConfig === void 0 ? void 0 : _property$typeConfig.baseType) {
        case "Date":
        case "Time":
        case "DateTime":
          columnWidth += 2.8;
          break;
        default:
      }
    }
    if (useRemUnit) {
      return columnWidth + "rem";
    }
    return columnWidth;
  };
  getColumnWidth.__functionName = "sap.fe.core.formatters.TableFormatter#getColumnWidth";

  /**
   * Method to calculate the width of an MDCColumn for valueHelp the table.
   *
   * @param this The MDCColumn object
   * @param isPropertiesCacheAvailable Indicates if the properties cache is available
   * @param propertyName The name of the property we want to calculate the width
   * @param isTargetSmallDevice Indicates the current device has a small device
   * @returns The width of the column
   */
  const getColumnWidthForValueHelpTable = function (isPropertiesCacheAvailable, propertyName, isTargetSmallDevice) {
    let widthIncludingColumnHeader = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const isSmallDevice = CommonUtils.isSmallDevice();
    const withUnit = !isSmallDevice;
    return isSmallDevice && isTargetSmallDevice || !isSmallDevice && !isTargetSmallDevice ? tableFormatter.getColumnWidth.call(this, FieldEditMode.Display, isPropertiesCacheAvailable, propertyName, withUnit, widthIncludingColumnHeader) : null;
  };
  getColumnWidthForValueHelpTable.__functionName = "sap.fe.core.formatters.TableFormatter#getColumnWidthForValueHelpTable";
  function isRatingIndicator(oControl) {
    if (oControl.isA("sap.fe.macros.controls.FieldWrapper")) {
      const vContentDisplay = Array.isArray(oControl.getContentDisplay()) ? oControl.getContentDisplay()[0] : oControl.getContentDisplay();
      if (vContentDisplay && vContentDisplay.isA("sap.m.RatingIndicator")) {
        return true;
      }
    }
    return false;
  }
  function _updateStyleClassForRatingIndicator(oFieldWrapper, bLast) {
    const vContentDisplay = Array.isArray(oFieldWrapper.getContentDisplay()) ? oFieldWrapper.getContentDisplay()[0] : oFieldWrapper.getContentDisplay();
    const vContentEdit = Array.isArray(oFieldWrapper.getContentEdit()) ? oFieldWrapper.getContentEdit()[0] : oFieldWrapper.getContentEdit();
    if (bLast) {
      vContentDisplay.addStyleClass("sapUiNoMarginBottom");
      vContentDisplay.addStyleClass("sapUiNoMarginTop");
      vContentEdit.removeStyleClass("sapUiTinyMarginBottom");
    } else {
      vContentDisplay.addStyleClass("sapUiNoMarginBottom");
      vContentDisplay.removeStyleClass("sapUiNoMarginTop");
      vContentEdit.addStyleClass("sapUiTinyMarginBottom");
    }
  }
  function getVBoxVisibility() {
    const aItems = this.getItems();
    let bLastElementFound = false;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    for (let index = aItems.length - 1; index >= 0; index--) {
      if (!bLastElementFound) {
        if (args[index] !== true) {
          bLastElementFound = true;
          if (isRatingIndicator(aItems[index])) {
            _updateStyleClassForRatingIndicator(aItems[index], true);
          } else {
            aItems[index].removeStyleClass("sapUiTinyMarginBottom");
          }
        }
      } else if (isRatingIndicator(aItems[index])) {
        _updateStyleClassForRatingIndicator(aItems[index], false);
      } else {
        aItems[index].addStyleClass("sapUiTinyMarginBottom");
      }
    }
    return true;
  }
  getVBoxVisibility.__functionName = "sap.fe.core.formatters.TableFormatter#getVBoxVisibility";

  // See https://www.typescriptlang.org/docs/handbook/functions.html#this-parameters for more detail on this weird syntax
  /**
   * Collection of table formatters.
   *
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const tableFormatter = function (sName) {
    if (tableFormatter.hasOwnProperty(sName)) {
      for (var _len2 = arguments.length, oArgs = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        oArgs[_key2 - 1] = arguments[_key2];
      }
      return tableFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  tableFormatter.validateCreationRowFields = validateCreationRowFields;
  tableFormatter.rowHighlighting = rowHighlighting;
  tableFormatter.navigatedRow = navigatedRow;
  tableFormatter.getErrorStatusTextVisibilityFormatter = getErrorStatusTextVisibilityFormatter;
  tableFormatter.getVBoxVisibility = getVBoxVisibility;
  tableFormatter.isRatingIndicator = isRatingIndicator; // for unit tests
  tableFormatter.getColumnWidth = getColumnWidth;
  tableFormatter.getColumnWidthForValueHelpTable = getColumnWidthForValueHelpTable;

  /**
   * @global
   */
  return tableFormatter;
}, true);
