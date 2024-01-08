/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ClassSupport", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/condition/Operator", "sap/ui/mdc/enums/FieldDisplay", "sap/ui/model/SimpleType", "sap/ui/model/type/Boolean", "sap/ui/model/type/Date", "sap/ui/model/type/Float", "sap/ui/model/type/Integer", "sap/ui/model/type/String"], function (Log, ClassSupport, FilterOperatorUtil, Operator, FieldDisplay, SimpleType, BooleanType, DateType, FloatType, IntegerType, StringType) {
  "use strict";

  var _dec, _class, _class2;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let Value = (
  /**
   * Handle format/parse single filter value.
   */
  _dec = defineUI5Class("sap.fe.macros.filter.type.Value"), _dec(_class = (_class2 = /*#__PURE__*/function (_SimpleType) {
    _inheritsLoose(Value, _SimpleType);
    /**
     * Creates a new value type instance with the given parameters.
     *
     * @param formatOptions Format options for this value type
     * @param formatOptions.operator The name of a (possibly custom) operator to use
     * @param constraints Constraints for this value type
     * @protected
     */
    function Value(formatOptions, constraints) {
      var _this;
      _this = _SimpleType.call(this, formatOptions, constraints) || this;
      const operatorName = (formatOptions === null || formatOptions === void 0 ? void 0 : formatOptions.operator) || _this.getDefaultOperatorName();
      const operator = FilterOperatorUtil.getOperator(operatorName);
      _this.operator = operator;
      if (!operator && operatorName.includes(".")) {
        _this._registerCustomOperator(operatorName);
      }
      return _this;
    }

    /**
     * Registers a custom binding operator.
     *
     * @param operatorName The binding operator name
     * @private
     */
    _exports = Value;
    var _proto = Value.prototype;
    _proto._registerCustomOperator = function _registerCustomOperator(operatorName) {
      const handlerFileName = operatorName.substring(0, operatorName.lastIndexOf(".")).replace(/\./g, "/"),
        methodName = operatorName.substring(operatorName.lastIndexOf(".") + 1);
      sap.ui.require([handlerFileName], customOperatorHandler => {
        if (!customOperatorHandler) {
          return;
        }
        this.operator = new Operator({
          filterOperator: "",
          tokenFormat: "",
          name: operatorName,
          valueTypes: ["self"],
          tokenParse: "^(.*)$",
          format: value => {
            return this.formatConditionValues(value.values);
          },
          parse: function (text, type, displayFormat, defaultOperator) {
            if (typeof text === "object") {
              if (text.operator !== operatorName) {
                throw Error("not matching operator");
              }
              return text.values;
            }
            return Operator.prototype.parse.apply(this, [text, type, displayFormat, defaultOperator]);
          },
          getModelFilter: condition => {
            return customOperatorHandler[methodName].call(customOperatorHandler, this.formatConditionValues(condition.values));
          }
        });
        FilterOperatorUtil.addOperator(this.operator);
      });
    }

    /**
     * Returns whether the specified operator is a multi-value operator.
     *
     * @param operator The binding operator
     * @returns `true`, if multi-value operator (`false` otherwise)
     * @private
     */;
    _proto._isMultiValueOperator = function _isMultiValueOperator(operator) {
      return operator.valueTypes.filter(function (valueType) {
        return !!valueType && valueType !== Value.OPERATOR_VALUE_TYPE_STATIC;
      }).length > 1;
    }

    /**
     * Returns whether the specified operator is a custom operator.
     *
     * @returns `true`, if custom operator (`false` otherwise)
     * @private
     */;
    _proto.hasCustomOperator = function hasCustomOperator() {
      return this.operator.name.includes(".");
    }

    /**
     * Parses the internal string value to the external value of type 'externalValueType'.
     *
     * @param value The internal string value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @private
     */;
    _proto._stringToExternal = function _stringToExternal(value, externalValueType) {
      let externalValue;
      const externalType = this._getTypeInstance(externalValueType);
      if (externalValueType && Value._isArrayType(externalValueType)) {
        if (!Array.isArray(value)) {
          value = [value];
        }
        externalValue = value.map(valueElement => {
          return externalType ? externalType.parseValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
        });
      } else {
        externalValue = externalType ? externalType.parseValue(value, Value.INTERNAL_VALUE_TYPE) : value;
      }
      return externalValue;
    }

    /**
     * Returns whether target type is an array.
     *
     * @param targetType The target type name
     * @returns `true`, if array type (`false` otherwise)
     * @private
     */;
    Value._isArrayType = function _isArrayType(targetType) {
      if (!targetType) {
        return false;
      }
      return targetType === "array" || targetType.endsWith("[]");
    }

    /**
     * Returns the external value formatted as the internal string value.
     *
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @private
     */;
    _proto._externalToString = function _externalToString(externalValue, externalValueType) {
      let value;
      const externalType = this._getTypeInstance(externalValueType);
      if (externalValueType && Value._isArrayType(externalValueType)) {
        if (!Array.isArray(externalValue)) {
          externalValue = [externalValue];
        }
        value = externalValue.map(valueElement => {
          return externalType ? externalType.formatValue(valueElement, Value.INTERNAL_VALUE_TYPE) : valueElement;
        });
      } else {
        value = externalType ? externalType.formatValue(externalValue, Value.INTERNAL_VALUE_TYPE) : externalValue;
      }
      return value;
    }

    /**
     * Retrieves the default type instance for given type name.
     *
     * @param typeName The name of the type
     * @returns The type instance
     * @private
     */;
    _proto._getTypeInstance = function _getTypeInstance(typeName) {
      typeName = this.getElementTypeName(typeName) || typeName;
      switch (typeName) {
        case "string":
          return new StringType();
        case "number":
        case "int":
          return new IntegerType();
        case "float":
          return new FloatType();
        case "date":
          return new DateType();
        case "boolean":
          return new BooleanType();
        default:
          Log.error("Unexpected filter type");
          throw new Error("Unexpected filter type");
      }
    }

    /**
     * Returns the default operator name ("EQ").
     * Should be overridden on demand.
     *
     * @returns The default operator name
     * @protected
     */;
    _proto.getDefaultOperatorName = function getDefaultOperatorName() {
      return FilterOperatorUtil.getEQOperator().name;
    }

    /**
     * Returns first value of array or input.
     *
     * @param values Input condition value
     * @returns Unchanged input condition value
     * @protected
     */;
    _proto.formatConditionValues = function formatConditionValues(values) {
      return Array.isArray(values) && values.length ? values[0] : values;
    }

    /**
     * Returns the element type name.
     *
     * @param typeName The actual type name
     * @returns The type of its elements
     * @protected
     */;
    _proto.getElementTypeName = function getElementTypeName(typeName) {
      if (typeName !== null && typeName !== void 0 && typeName.endsWith("[]")) {
        return typeName.substring(0, typeName.length - 2);
      }
      return undefined;
    }

    /**
     * Returns the string value parsed to the external value type 'this.operator'.
     *
     * @param internalValue The internal string value to be formatted
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @protected
     */;
    _proto.formatValue = function formatValue(internalValue, externalValueType) {
      if (!internalValue) {
        return undefined;
      }
      const isMultiValueOperator = this._isMultiValueOperator(this.operator),
        internalType = this._getTypeInstance(Value.INTERNAL_VALUE_TYPE);

      //  from internal model string with operator
      const values = this.operator.parse(internalValue || "", internalType, FieldDisplay.Value, false);
      const value = !isMultiValueOperator && Array.isArray(values) ? values[0] : values;
      return this._stringToExternal(value, externalValueType); // The value bound to a custom filter
    }

    /**
     * Returns the value parsed to the internal string value.
     *
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @protected
     */;
    _proto.parseValue = function parseValue(externalValue, externalValueType) {
      if (!externalValue) {
        return undefined;
      }
      const isMultiValueOperator = this._isMultiValueOperator(this.operator),
        externalType = this._getTypeInstance(externalValueType);
      const value = this._externalToString(externalValue, externalValueType);

      // Format to internal model string with operator
      const values = isMultiValueOperator ? value : [value];
      if (this.hasCustomOperator()) {
        // Return a complex object while parsing the bound value in sap.ui.model.PropertyBinding.js#_externalToRaw()
        return {
          operator: this.operator.name,
          values: [this.operator.format({
            values: values
          }, externalType)],
          validated: undefined
        };
      }
      // Return a simple string value to be stored in the internal 'filterValues' model
      return this.operator.format({
        values: values
      }, externalType);
    }

    /**
     * Validates whether the given value in model representation is valid.
     *
     * @param externalValue The value to be validated
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.validateValue = function validateValue(externalValue) {
      /* Do Nothing */
    };
    return Value;
  }(SimpleType), _class2.INTERNAL_VALUE_TYPE = "string", _class2.OPERATOR_VALUE_TYPE_STATIC = "static", _class2)) || _class);
  _exports = Value;
  return _exports;
}, false);
