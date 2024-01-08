/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/m/FlexBox", "sap/m/HeaderContainer", "sap/ui/core/library", "sap/ui/Device", "sap/ui/mdc/filterbar/IFilterContainer"], function (ClassSupport, FlexBox, HeaderContainer, coreLibrabry, Device, IFilterContainer) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }
  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }
  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.'); }
  /**
   * Constructor for a new Visual Filter Container.
   * Used for visual filters.
   *
   */
  let VisualFilterContainer = (_dec = defineUI5Class("sap.fe.core.controls.filterbar.VisualFilterContainer"), _dec2 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    visibility: "hidden"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_IFilterContainer) {
    _inheritsLoose(VisualFilterContainer, _IFilterContainer);
    function VisualFilterContainer() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _IFilterContainer.call(this, ...args) || this;
      _initializerDefineProperty(_this, "_layout", _descriptor, _assertThisInitialized(_this));
      return _this;
    }
    var _proto = VisualFilterContainer.prototype;
    _proto.init = function init() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      _IFilterContainer.prototype.init.call(this, ...args);
      //var oRB = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
      const Orientation = coreLibrabry.Orientation;
      const sOrientation = Device.system.phone ? Orientation.Vertical : undefined;
      const sDirection = Device.system.phone ? "ColumnReverse" : "Column";
      this.oHeaderContainer = new HeaderContainer({
        orientation: sOrientation
      });
      this.oButtonFlexBox = new FlexBox({
        alignItems: "End",
        justifyContent: "End"
      });
      this.oLayout = new FlexBox({
        direction: sDirection,
        // Direction is Column Reverse for Phone
        items: [this.oHeaderContainer, this.oButtonFlexBox]
      });
      this.aAllFilterFields = [];
      this.aVisualFilterFields = {};
    };
    _proto.exit = function exit() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      // destroy layout
      _IFilterContainer.prototype.exit.call(this, ...args);
      // destroy all filter fields which are not in the layout
      const aAllFilterFields = this.getAllFilterFields();
      aAllFilterFields.forEach(function (oFilterField) {
        oFilterField.destroy();
      });
      this.oHeaderContainer = null;
      this.oButtonFlexBox = null;
      this.aAllFilterFields = [];
    };
    _proto.insertFilterField = function insertFilterField(oControl, iIndex) {
      const oFilterItemLayoutEventDelegate = {
        onBeforeRendering: function () {
          // visual filter does not need to render a label
          // hence override the getContent of the FilterItemLayout
          // and store the original getContent for later usage in the compact filters
          if (!oControl._fnGetContentCopy) {
            oControl._fnGetContentCopy = oControl.getContent;
          }
          // override getContent of FilterItemLayout
          // to add only filterField and not label
          oControl.getContent = function () {
            const aContent = [];
            aContent.push(oControl._oFilterField);
            return aContent;
          };
          oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
        }
      };
      oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

      // Setting VF control for the Filterfield.
      const oVisualFilters = this.aVisualFilterFields;
      oControl.getContent().some(oInnerControl => {
        const sFFId = oInnerControl.getId();
        if (oVisualFilters[sFFId] && oInnerControl.isA("sap.ui.mdc.FilterField")) {
          oInnerControl.setContent(oVisualFilters[sFFId]);
          this.oHeaderContainer.insertContent(oControl, iIndex);
        }
      });
    };
    _proto.removeFilterField = function removeFilterField(oControl) {
      this.oHeaderContainer.removeContent(oControl);
    };
    _proto.removeAllFilterFields = function removeAllFilterFields() {
      this.aAllFilterFields = [];
      this.aVisualFilterFields = {};
      this.oHeaderContainer.removeAllContent();
    };
    _proto.getFilterFields = function getFilterFields() {
      return this.oHeaderContainer.getContent();
    };
    _proto.addButton = function addButton(oControl) {
      this.oButtonFlexBox.insertItem(oControl);
    };
    _proto.getAllButtons = function getAllButtons() {
      return this.oButtonFlexBox.getItems().reverse();
    };
    _proto.removeButton = function removeButton(oControl) {
      this.oButtonFlexBox.removeItem(oControl);
    };
    _proto.getAllFilterFields = function getAllFilterFields() {
      return this.aAllFilterFields.slice();
    };
    _proto.setAllFilterFields = function setAllFilterFields(aFilterFields, aVisualFilterFields) {
      this.aAllFilterFields = aFilterFields;
      this.aVisualFilterFields = aVisualFilterFields;
    };
    return VisualFilterContainer;
  }(IFilterContainer), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "_layout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  return VisualFilterContainer;
}, false);
