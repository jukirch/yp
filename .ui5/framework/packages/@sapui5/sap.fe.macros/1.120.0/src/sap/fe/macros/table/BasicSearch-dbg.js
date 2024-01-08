/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/core/templating/FilterHelper", "sap/m/SearchField", "sap/ui/core/Control", "sap/ui/mdc/odata/v4/TypeMap"], function (ClassSupport, FilterHelper, SearchField, Control, TypeMap) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var getEditStatusFilter = FilterHelper.getEditStatusFilter;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let BasicSearch = (_dec = defineUI5Class("sap.fe.macros.table.BasicSearch"), _dec2 = implementInterface("sap.ui.mdc.IFilter"), _dec3 = event( /*{ conditionsBased: {
                                                                                                                                                type: "boolean"
                                                                                                                                                }}*/), _dec4 = event( /*{
                                                                                                                                                                      conditions: {
                                                                                                                                                                      type: "object"
                                                                                                                                                                      }
                                                                                                                                                                      }*/), _dec5 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false
  }), _dec6 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    _inheritsLoose(BasicSearch, _Control);
    function BasicSearch() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Control.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_mdc_IFilter", _descriptor, _assertThisInitialized(_this));
      _this.__implements__sap_ui_mdc_IFilterSource = true;
      _initializerDefineProperty(_this, "filterChanged", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "search", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "filter", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "useDraftEditState", _descriptor5, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = BasicSearch.prototype;
    _proto.init = function init() {
      this.setAggregation("filter", new SearchField({
        placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
        search: () => {
          this.fireEvent("search");
        }
      }));
    };
    _proto.getConditions = function getConditions() {
      if (this.useDraftEditState) {
        return getEditStatusFilter();
      }
      return {};
    };
    _proto.getTypeMap = function getTypeMap() {
      return TypeMap;
    };
    _proto.getPropertyInfoSet = function getPropertyInfoSet() {
      if (this.useDraftEditState) {
        return [{
          name: "$editState",
          path: "$editState",
          groupLabel: "",
          group: "",
          typeConfig: TypeMap.getTypeConfig("sap.ui.model.odata.type.String", {}, {}),
          dataType: "sap.ui.model.odata.type.String",
          hiddenFilter: false
        }];
      }
      return [];
    };
    _proto.getSearch = function getSearch() {
      return this.filter.getValue();
    };
    _proto.validate = function validate() {
      return Promise.resolve();
    };
    BasicSearch.render = function render(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.openEnd();
      oRm.renderControl(oControl.filter);
      oRm.close("div");
    };
    return BasicSearch;
  }(Control), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_mdc_IFilter", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filter", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "useDraftEditState", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  })), _class2)) || _class);
  return BasicSearch;
}, false);
