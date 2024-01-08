/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/ui/mdc/filterbar/aligned/FilterContainer"], function (ClassSupport, MdcFilterContainer) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  /**
   * Constructor for a new FE filter container.
   *
   */
  let FilterContainer = (_dec = defineUI5Class("sap.fe.core.controls.filterbar.FilterContainer"), _dec(_class = /*#__PURE__*/function (_MdcFilterContainer) {
    _inheritsLoose(FilterContainer, _MdcFilterContainer);
    function FilterContainer() {
      return _MdcFilterContainer.apply(this, arguments) || this;
    }
    var _proto = FilterContainer.prototype;
    _proto.init = function init() {
      this.aAllFilterFields = [];
      this.aAllVisualFilters = {};
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _MdcFilterContainer.prototype.init.call(this, ...args);
    };
    _proto.exit = function exit() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      // destroy layout
      _MdcFilterContainer.prototype.exit.call(this, ...args);
      // destroy all filter fields which are not in the layout
      this.aAllFilterFields.forEach(function (oFilterField) {
        oFilterField.destroy();
      });
      Object.keys(this.aAllVisualFilters).forEach(sKey => {
        this.aAllVisualFilters[sKey].destroy();
      });
    };
    _proto.insertFilterField = function insertFilterField(oControl, iIndex) {
      const oFilterItemLayoutEventDelegate = {
        onBeforeRendering: function () {
          // For compact filters the item layout needs to render both label and filter field.
          // hence use the original getContent of the FilterItemLayout
          if (oControl._fnGetContentCopy) {
            oControl.getContent = oControl._fnGetContentCopy;
          }
          oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
        }
      };
      oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

      // In this layout there is no need to render visual filter
      // hence find the filter field from the layout and remove it's content aggregation
      oControl.getContent().forEach(oInnerControl => {
        const oContent = oInnerControl.getContent && oInnerControl.getContent();
        if (oInnerControl.isA("sap.ui.mdc.FilterField") && oContent && oContent.isA("sap.fe.core.controls.filterbar.VisualFilter")) {
          // store the visual filter for later use.
          const oVFId = oInnerControl.getId();
          this.aAllVisualFilters[oVFId] = oContent;
          // remove the content aggregation to render internal content of the field
          oInnerControl.setContent(null);
        }
      });

      // store filter fields to refer to when switching between layout
      this.aAllFilterFields.push(oControl);
      _MdcFilterContainer.prototype.insertFilterField.call(this, oControl, iIndex);
    };
    _proto.removeFilterField = function removeFilterField(oControl) {
      const oFilterFieldIndex = this.aAllFilterFields.findIndex(function (oFilterField) {
        return oFilterField.getId() === oControl.getId();
      });

      // Setting VF content for Fillterfield before removing
      oControl.getContent().forEach(oInnerControl => {
        if (oInnerControl.isA("sap.ui.mdc.FilterField") && !oInnerControl.getContent()) {
          const oVFId = oInnerControl.getId();
          if (this.aAllVisualFilters[oVFId]) {
            oInnerControl.setContent(this.aAllVisualFilters[oVFId]);
          }
        }
      });
      this.aAllFilterFields.splice(oFilterFieldIndex, 1);
      _MdcFilterContainer.prototype.removeFilterField.call(this, oControl);
    };
    _proto.removeAllFilterFields = function removeAllFilterFields() {
      this.aAllFilterFields = [];
      this.aAllVisualFilters = {};
      this.oLayout.removeAllContent();
    };
    _proto.getAllButtons = function getAllButtons() {
      var _buttonLayout$, _buttonLayout$$getCon, _buttonLayout$$getCon2;
      const buttonLayout = this.oLayout.getEndContent();
      return buttonLayout === null || buttonLayout === void 0 ? void 0 : (_buttonLayout$ = buttonLayout[0]) === null || _buttonLayout$ === void 0 ? void 0 : (_buttonLayout$$getCon = _buttonLayout$.getContent()) === null || _buttonLayout$$getCon === void 0 ? void 0 : (_buttonLayout$$getCon2 = _buttonLayout$$getCon[1]) === null || _buttonLayout$$getCon2 === void 0 ? void 0 : _buttonLayout$$getCon2.getContent();
    };
    _proto.removeButton = function removeButton(oControl) {
      this.oLayout.removeEndContent(oControl);
    };
    _proto.getAllFilterFields = function getAllFilterFields() {
      return this.aAllFilterFields.slice();
    };
    _proto.getAllVisualFilterFields = function getAllVisualFilterFields() {
      return this.aAllVisualFilters;
    };
    _proto.setAllFilterFields = function setAllFilterFields(aFilterFields) {
      this.aAllFilterFields = aFilterFields;
    };
    return FilterContainer;
  }(MdcFilterContainer)) || _class);
  return FilterContainer;
}, false);
