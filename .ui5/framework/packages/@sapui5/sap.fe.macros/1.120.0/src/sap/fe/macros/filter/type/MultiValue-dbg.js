/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/macros/filter/type/Value"], function (ClassSupport, Value) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let MultiValue = (
  /**
   * Handle format/parse of multi value filters.
   */
  _dec = defineUI5Class("sap.fe.macros.filter.type.MultiValue"), _dec(_class = /*#__PURE__*/function (_Value) {
    _inheritsLoose(MultiValue, _Value);
    function MultiValue() {
      return _Value.apply(this, arguments) || this;
    }
    _exports = MultiValue;
    var _proto = MultiValue.prototype;
    /**
     * Returns the unchanged values.
     *
     * @param values Input condition value
     * @returns First value of array or input
     * @protected
     */
    _proto.formatConditionValues = function formatConditionValues(values) {
      return values;
    }

    /**
     * Returns the string value parsed to the external value type.
     *
     * @param internalValue The internal string value to be formatted
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The formatted value
     * @protected
     */;
    _proto.formatValue = function formatValue(internalValue, externalValueType) {
      let result = internalValue;
      if (typeof result === "string") {
        result = result.split(",");
      }
      if (Array.isArray(result)) {
        result = result.map(value => _Value.prototype.formatValue.call(this, value, this.getElementTypeName(externalValueType))).filter(value => value !== undefined);
      }
      return result || [];
    }

    /**
     * Returns the value parsed to the internal string value.
     *
     * @param externalValue The value to be parsed
     * @param externalValueType The external value type, e.g. int, float[], string, etc.
     * @returns The parsed value
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.parseValue = function parseValue(externalValue, externalValueType) {
      if (!externalValue) {
        externalValue = [];
      }
      return externalValue.map(value => {
        if (value === undefined) {
          value = [];
        } else if (!Array.isArray(value)) {
          value = [value];
        }
        return this.operator.format({
          values: value
        });
      });
    };
    return MultiValue;
  }(Value)) || _class);
  _exports = MultiValue;
  return _exports;
}, false);
