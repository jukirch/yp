/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controls/filterbar/FilterContainer", "sap/fe/core/controls/filterbar/VisualFilterContainer", "sap/fe/core/helpers/ClassSupport", "sap/ui/core/Core", "sap/ui/mdc/FilterBar", "sap/ui/mdc/filterbar/aligned/FilterItemLayout"], function (FilterContainer, VisualFilterContainer, ClassSupport, Core, MdcFilterBar, FilterItemLayout) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  let FilterBar = (_dec = defineUI5Class("sap.fe.core.controls.FilterBar"), _dec2 = property({
    type: "string",
    defaultValue: "compact"
  }), _dec3 = association({
    type: "sap.m.SegmentedButton",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MdcFilterBar) {
    _inheritsLoose(FilterBar, _MdcFilterBar);
    function FilterBar() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MdcFilterBar.call(this, ...args) || this;
      _initializerDefineProperty(_this, "initialLayout", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "toggleControl", _descriptor2, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = FilterBar.prototype;
    _proto.setToggleControl = function setToggleControl(vToggle) {
      if (typeof vToggle === "string") {
        this._oSegmentedButton = Core.byId(vToggle);
      } else {
        this._oSegmentedButton = vToggle;
      }
      if (this.toggleControl && this._oSegmentedButton) {
        this._oSegmentedButton.detachEvent("select", this._toggleLayout.bind(this));
      }
      if (this._oSegmentedButton) {
        this._oSegmentedButton.attachEvent("select", this._toggleLayout.bind(this));
      }
      this.setAssociation("toggleControl", vToggle, true);
    };
    _proto._toggleLayout = function _toggleLayout() {
      // Since primary layout is always compact
      // hence set the secondary layout as visual filter only for the first time only
      if (!this._oSecondaryFilterBarLayout) {
        this._oSecondaryFilterBarLayout = new VisualFilterContainer();
      }

      // do not show Adapt Filters Button for visual layout
      if (this._oSecondaryFilterBarLayout.isA("sap.fe.core.controls.filterbar.VisualFilterContainer")) {
        this.setShowAdaptFiltersButton(false);
      } else {
        this.setShowAdaptFiltersButton(true);
      }

      // get all filter fields and button of the current layout
      const oCurrentFilterBarLayout = this._oFilterBarLayout;
      const oFilterItems = this.getFilterItems();
      const aFilterFields = oCurrentFilterBarLayout.getAllFilterFields();
      const aSortedFilterFields = this.getSortedFilterFields(oFilterItems, aFilterFields);
      const aButtons = oCurrentFilterBarLayout.getAllButtons();
      const aVisualFilterFields = oCurrentFilterBarLayout.getAllVisualFilterFields && oCurrentFilterBarLayout.getAllVisualFilterFields();
      if (this._oSecondaryFilterBarLayout.isA("sap.fe.core.controls.filterbar.VisualFilterContainer")) {
        this._oSecondaryFilterBarLayout.setAllFilterFields(aSortedFilterFields, aVisualFilterFields);
      }
      // use secondary filter bar layout as new layout
      this._oFilterBarLayout = this._oSecondaryFilterBarLayout;

      // insert all filter fields from current layout to new layout
      aFilterFields.forEach((oFilterField, iIndex) => {
        oCurrentFilterBarLayout.removeFilterField(oFilterField);
        this._oFilterBarLayout.insertFilterField(oFilterField, iIndex);
      });
      // insert all buttons from the current layout to the new layout
      aButtons.forEach(oButton => {
        oCurrentFilterBarLayout.removeButton(oButton);
        this._oFilterBarLayout.addButton(oButton);
      });

      // set the current filter bar layout to the secondary one
      this._oSecondaryFilterBarLayout = oCurrentFilterBarLayout;

      // update the layout aggregation of the filter bar and rerender the same.
      this.setAggregation("layout", this._oFilterBarLayout, true);
      this._oFilterBarLayout.rerender();
    };
    _proto.getSortedFilterFields = function getSortedFilterFields(aFilterItems, aFilterFields) {
      const aFilterIds = [];
      aFilterItems.forEach(function (oFilterItem) {
        aFilterIds.push(oFilterItem.getId());
      });
      aFilterFields.sort(function (aFirstItem, aSecondItem) {
        let sFirstItemVFId, sSecondItemVFId;
        aFirstItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sFirstItemVFId = oInnerControl.getId();
          }
        });
        aSecondItem.getContent().forEach(function (oInnerControl) {
          if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
            sSecondItemVFId = oInnerControl.getId();
          }
        });
        return aFilterIds.indexOf(sFirstItemVFId) - aFilterIds.indexOf(sSecondItemVFId);
      });
      return aFilterFields;
    };
    _proto._createInnerLayout = function _createInnerLayout() {
      this._oFilterBarLayout = new FilterContainer();
      this._cLayoutItem = FilterItemLayout;
      this._oFilterBarLayout.getInner().addStyleClass("sapUiMdcFilterBarBaseAFLayout");
      this._addButtons();

      // TODO: Check with MDC if there is a better way to load visual filter on the basis of control property
      // _createInnerLayout is called on Init by the filter bar base.
      // This mean that we do not have access to the control properties yet
      // and hence we cannot decide on the basis of control properties whether initial layout should be compact or visual
      // As a result we have to do this workaround to always load the compact layout by default
      // And toogle the same in case the initialLayout was supposed to be visual filters.
      const oInnerLayout = this._oFilterBarLayout.getInner();
      const oFilterContainerInnerLayoutEventDelegate = {
        onBeforeRendering: () => {
          if (this.initialLayout === "visual") {
            this._toggleLayout();
          }
          oInnerLayout.removeEventDelegate(oFilterContainerInnerLayoutEventDelegate);
        }
      };
      oInnerLayout.addEventDelegate(oFilterContainerInnerLayoutEventDelegate);
      this.setAggregation("layout", this._oFilterBarLayout, true);
    };
    _proto.exit = function exit() {
      _MdcFilterBar.prototype.exit.call(this);
      // Sometimes upon external navigation this._SegmentedButton is already destroyed
      // so check if it exists and then only remove stuff
      if (this._oSegmentedButton) {
        this._oSegmentedButton.detachEvent("select", this._toggleLayout);
        delete this._oSegmentedButton;
      }
    };
    _proto.getSegmentedButton = function getSegmentedButton() {
      return this._oSegmentedButton;
    };
    return FilterBar;
  }(MdcFilterBar), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "initialLayout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "toggleControl", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return FilterBar;
}, false);
