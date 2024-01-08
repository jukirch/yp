/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/FiscalFormat", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/CalendarType", "sap/ui/core/Core", "sap/ui/model/odata/type/String", "sap/ui/model/ValidateException"], function (FiscalFormat, ClassSupport, CalendarType, Core, ODataStringType, ValidateException) {
  "use strict";

  var _dec, _class, _class2;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Define the UI5 class for a type of fiscal date.
   *
   * The data type Fiscal Date supports the parsing and formatting of fiscal dates that follow the pattern 'yM'.
   *
   * @since 1.110.0
   * @experimental
   */
  let FiscalDate = (_dec = defineUI5Class("sap.fe.core.type.FiscalDate"), _dec(_class = (_class2 = /*#__PURE__*/function (_ODataStringType) {
    _inheritsLoose(FiscalDate, _ODataStringType);
    /**
     * @param formatOptions Format options
     * @param formatOptions.fiscalType String with a fiscal annotation type
     * @param formatOptions.parseKeepsEmptyString Whether empty string should be kept or not
     * @param constraints Constraints
     * @param constraints.maxLength Maximum length of the field
     */
    function FiscalDate(formatOptions, constraints) {
      var _this;
      if ((formatOptions.fiscalType === "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod" || formatOptions.fiscalType === "com.sap.vocabularies.Common.v1.IsFiscalYearQuarter" || formatOptions.fiscalType === "com.sap.vocabularies.Common.v1.IsFiscalYearWeek") && constraints !== null && constraints !== void 0 && constraints.maxLength) {
        // We increase maxLength for +1 for any fiscal type that have delimiter in locale format.
        // It's necessary for validation to work correctly.
        // Also for validation to function properly user also should specify constraints.isDigitSequence = true
        // isDigitSequence and maxLength combination ensures that missing characters will be populated with leading zeros
        // that will ensure user will receive correct validation results.
        constraints.maxLength = constraints.maxLength + 1;
      }
      _this = _ODataStringType.call(this, formatOptions, constraints) || this;
      _this.annotationType = formatOptions.fiscalType;
      const format = FiscalDate.dateFormats[_this.annotationType];
      if (format) {
        _this.formatter = FiscalFormat.getDateInstance({
          format,
          calendarType: CalendarType.Gregorian
        });
      }
      return _this;
    }

    /**
     * Return pattern for fiscal date type.
     *
     * @returns The fiscal date pattern
     */
    var _proto = FiscalDate.prototype;
    _proto.getPattern = function getPattern() {
      var _this$formatter;
      return (_this$formatter = this.formatter) === null || _this$formatter === void 0 ? void 0 : _this$formatter.getPattern();
    }

    /**
     * Formats the given value to the given fiscal type.
     *
     * @param value The value to be formatted
     * @returns The formatted output value; <code>undefined</code> is always formatted to <code>null</code>
     * @override
     */;
    _proto.formatValue = function formatValue(value, targetType) {
      return this.formatter ? this.formatter.format(_ODataStringType.prototype.formatValue.call(this, value, targetType)) : _ODataStringType.prototype.formatValue.call(this, value, targetType);
    }

    /**
     * Parses the given value, which is expected to be of the fiscal type, to a string.
     *
     * @param value The value to be parsed
     * @returns The parsed value
     * @override
     */;
    _proto.parseValue = function parseValue(value, sourceType) {
      return this.formatter ? this.formatter.parse(_ODataStringType.prototype.parseValue.call(this, value, sourceType)) : _ODataStringType.prototype.parseValue.call(this, value, sourceType);
    }

    /**
     * @inheritDoc
     */;
    _proto.validateValue = function validateValue(value) {
      try {
        _ODataStringType.prototype.validateValue.call(this, value);
      } catch (error) {
        if (!this.formatter) {
          throw error;
        }
        if (!this.formatter.validate(value)) {
          throw new ValidateException(this.getErrorMessage(this.annotationType));
        }
      }
      if (!this.formatter || value === "" || value === null) {
        return;
      }
      if (!this.formatter.validate(value)) {
        throw new ValidateException(this.getErrorMessage(this.annotationType));
      }
    }

    /**
     * Returns the matching locale-dependent error message for the type based on the fiscal annotation.
     *
     * @param annotationType The fiscal annotation type
     * @returns The locale-dependent error message
     */;
    _proto.getErrorMessage = function getErrorMessage(annotationType) {
      let sValue = "";
      this.fullYear = this.fullYear || new Date().getFullYear().toString();
      switch (annotationType) {
        case "com.sap.vocabularies.Common.v1.IsFiscalYear":
          sValue = this.fullYear;
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalPeriod":
          sValue = "001";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod":
          sValue = this.fullYear + "001";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalQuarter":
          sValue = "1";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalYearQuarter":
          sValue = this.fullYear + "1";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalWeek":
          sValue = "01";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalYearWeek":
          sValue = this.fullYear + "01";
          break;
        case "com.sap.vocabularies.Common.v1.IsDayOfFiscalYear":
          sValue = "1";
          break;
        case "com.sap.vocabularies.Common.v1.IsFiscalYearVariant":
          break;
        default:
          sValue = this.fullYear;
      }
      return Core.getLibraryResourceBundle("sap.fe.core").getText("FISCAL_VALIDATION_FAILS", [this.formatValue(sValue, "string")]);
    }

    /**
     * @inheritDoc
     */;
    _proto.getName = function getName() {
      return "sap.fe.core.type.FiscalDate";
    }

    /**
     * Returns the formatter that is assigned to this particular FiscalDate type.
     *
     * @returns The assigned instance of FiscalFormat
     */;
    _proto.getFormatter = function getFormatter() {
      return this.formatter;
    };
    return FiscalDate;
  }(ODataStringType), _class2.dateFormats = {
    ["com.sap.vocabularies.Common.v1.IsFiscalYear"]: "YYYY",
    ["com.sap.vocabularies.Common.v1.IsFiscalPeriod"]: "PPP",
    ["com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"]: "YYYYPPP",
    ["com.sap.vocabularies.Common.v1.IsFiscalQuarter"]: "Q",
    ["com.sap.vocabularies.Common.v1.IsFiscalYearQuarter"]: "YYYYQ",
    ["com.sap.vocabularies.Common.v1.IsFiscalWeek"]: "WW",
    ["com.sap.vocabularies.Common.v1.IsFiscalYearWeek"]: "YYYYWW",
    ["com.sap.vocabularies.Common.v1.IsDayOfFiscalYear"]: "d",
    ["com.sap.vocabularies.Common.v1.IsFiscalYearVariant"]: ""
  }, _class2)) || _class);
  return FiscalDate;
}, false);
