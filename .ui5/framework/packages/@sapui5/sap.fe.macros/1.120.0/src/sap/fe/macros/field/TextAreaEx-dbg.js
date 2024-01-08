/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/TextArea", "sap/ui/core/library"], function (ClassSupport, ResourceModelHelper, _TextArea, library) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var ValueState = library.ValueState;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  let TextAreaEx = (
  /**
   * Extension of the TextArea control to add a check for the maximum length when setting the value.
   *
   * @extends sap.m.TextArea
   */
  _dec = defineUI5Class("sap.fe.macros.field.TextAreaEx"), _dec(_class = /*#__PURE__*/function (_TextArea2) {
    _inheritsLoose(TextAreaEx, _TextArea2);
    function TextAreaEx() {
      return _TextArea2.apply(this, arguments) || this;
    }
    _exports = TextAreaEx;
    var _proto = TextAreaEx.prototype;
    /**
     * Fires live change event.
     *
     * @param [parameters] Parameters to pass along with the event
     * @param parameters.value
     * @returns Reference to `this` in order to allow method chaining
     */
    _proto.fireLiveChange = function fireLiveChange(parameters) {
      _TextArea2.prototype.fireLiveChange.call(this, parameters);
      this._validateTextLength(parameters === null || parameters === void 0 ? void 0 : parameters.value);
      return this;
    }

    /**
     * Sets the value for the text area.
     *
     * @param value New value for the property `value`
     * @returns Reference to `this` in order to allow method chaining
     * @private
     */;
    _proto.setValue = function setValue(value) {
      _TextArea2.prototype.setValue.call(this, value ?? "");
      this._validateTextLength(value);
      return this;
    }

    /**
     * Sets an error message for the value state if the maximum length is specified and the new value exceeds this maximum length.
     *
     * @param [value] New value for property `value`
     * @private
     */;
    _proto._validateTextLength = function _validateTextLength(value) {
      const maxLength = this.getMaxLength();
      if (!maxLength || value === undefined || value === null) {
        this.setValueState(ValueState.None);
        return;
      }
      if (value.length > maxLength) {
        const valueStateText = getResourceModel(this).getText("M_FIELD_TEXTAREA_TEXT_TOO_LONG");
        this.setValueState(ValueState.Error);
        this.setValueStateText(valueStateText);
      } else {
        this.setValueState(ValueState.None);
      }
    };
    return TextAreaEx;
  }(_TextArea)) || _class);
  _exports = TextAreaEx;
  return _exports;
}, false);
