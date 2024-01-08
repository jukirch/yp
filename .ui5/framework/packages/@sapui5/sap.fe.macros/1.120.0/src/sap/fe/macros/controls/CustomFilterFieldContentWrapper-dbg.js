/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/ClassSupport", "sap/fe/core/helpers/SemanticDateOperators", "sap/ui/base/ManagedObjectObserver", "sap/ui/core/Control", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/field/ConditionsType", "sap/ui/model/json/JSONModel"], function (ClassSupport, SemanticDateOperators, ManagedObjectObserver, Control, Condition, ConditionValidated, ConditionsType, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _class3;
  var _exports = {};
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
  let CustomFilterFieldContentWrapper = (
  /**
   * @class
   * Creates an <code>sap.fe.macros.controls.CustomFilterFieldContentWrapper</code> object.
   * This is used in the {@link sap.ui.mdc.FilterField FilterField} as a filter content.
   * @extends sap.ui.core.Control
   * @private
   * @alias sap.fe.core.macros.CustomFilterFieldContentWrapper
   */
  _dec = defineUI5Class("sap.fe.macros.controls.CustomFilterFieldContentWrapper"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "sap.ui.core.CSSSize",
    defaultValue: null
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "object[]",
    defaultValue: []
  }), _dec6 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec7 = event(), _dec(_class = (_class2 = (_class3 = /*#__PURE__*/function (_Control) {
    _inheritsLoose(CustomFilterFieldContentWrapper, _Control);
    function CustomFilterFieldContentWrapper() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Control.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "width", _descriptor2, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "formDoNotAdjustWidth", _descriptor3, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "conditions", _descriptor4, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "content", _descriptor5, _assertThisInitialized(_this));
      _initializerDefineProperty(_this, "conditionsChange", _descriptor6, _assertThisInitialized(_this));
      return _this;
    }
    _exports = CustomFilterFieldContentWrapper;
    CustomFilterFieldContentWrapper.render = function render(renderManager, control) {
      renderManager.openStart("div", control);
      renderManager.style("min-height", "1rem");
      renderManager.style("width", control.width);
      renderManager.openEnd();
      renderManager.renderControl(control.getContent()); // render the child Control
      renderManager.close("div"); // end of the complete Control
    }

    /**
     * Maps an array of filter values to an array of conditions.
     *
     * @param filterValues Array of filter value bindings or a filter value string
     * @param [operator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
     * @private
     * @returns Array of filter conditions
     */;
    CustomFilterFieldContentWrapper._filterValuesToConditions = function _filterValuesToConditions(filterValues, operator) {
      let formatOptions = {
          operators: []
        },
        conditions = [];
      if (operator) {
        formatOptions = {
          operators: [operator]
        };
      }
      if (filterValues === "") {
        filterValues = [];
      } else if (typeof filterValues === "object" && filterValues.hasOwnProperty("operator") && filterValues.hasOwnProperty("values")) {
        formatOptions = {
          operators: [filterValues.operator]
        };
        filterValues = filterValues.values;
      } else if (filterValues !== undefined && typeof filterValues !== "object" && typeof filterValues !== "string") {
        throw new Error(`FilterUtils.js#_filterValuesToConditions: Unexpected type of input parameter vValues: ${typeof filterValues}`);
      }
      const conditionsType = new ConditionsType(formatOptions);
      const conditionValues = Array.isArray(filterValues) ? filterValues : [filterValues];

      // Shortcut for operator without values and semantic date operations
      if (typeof operator === "string" && SemanticDateOperators.getSemanticDateOperations().includes(operator)) {
        conditions = [Condition.createCondition(operator, conditionValues, null, null, ConditionValidated.NotValidated)];
      } else {
        conditions = conditionValues.map(conditionValue => {
          const stringValue = conditionValue === null || conditionValue === void 0 ? void 0 : conditionValue.toString(),
            parsedConditions = conditionsType.parseValue(stringValue, "any");
          return parsedConditions === null || parsedConditions === void 0 ? void 0 : parsedConditions[0];
        }).filter(conditionValue => conditionValue !== undefined);
      }
      return conditions;
    }

    /**
     * Maps an array of conditions to a comma separated list of filter values.
     *
     * @param conditions Array of filter conditions
     * @param formatOptions Format options that specifies a condition type
     * @private
     * @returns Concatenated string of filter values
     */;
    CustomFilterFieldContentWrapper._conditionsToFilterModelString = function _conditionsToFilterModelString(conditions, formatOptions) {
      const conditionsType = new ConditionsType(formatOptions);
      return conditions.map(condition => {
        return conditionsType.formatValue([condition], "any") || "";
      }).filter(stringValue => {
        return stringValue !== "";
      }).join(",");
    }

    /**
     * Listens to filter model changes and updates wrapper property "conditions".
     *
     * @param changeEvent Event triggered by a filter model change
     * @private
     */;
    var _proto = CustomFilterFieldContentWrapper.prototype;
    _proto._handleFilterModelChange = function _handleFilterModelChange(changeEvent) {
      var _this$getObjectBindin;
      const propertyPath = (_this$getObjectBindin = this.getObjectBinding("filterValues")) === null || _this$getObjectBindin === void 0 ? void 0 : _this$getObjectBindin.getPath(),
        values = changeEvent.getSource().getProperty(propertyPath);
      this.updateConditionsByFilterValues(values);
    }

    /**
     * Listens to "conditions" changes and updates the filter model.
     *
     * @param conditions Event triggered by a "conditions" change
     * @private
     */;
    _proto._handleConditionsChange = function _handleConditionsChange(conditions) {
      this.updateFilterModelByConditions(conditions);
    }

    /**
     * Initialize CustomFilterFieldContentWrapper control and register observer.
     */;
    _proto.init = function init() {
      _Control.prototype.init.call(this);
      this._conditionsObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
      this._conditionsObserver.observe(this, {
        properties: ["conditions"]
      });
      this._filterModel = new JSONModel();
      this._filterModel.attachPropertyChange(this._handleFilterModelChange, this);
      this.setModel(this._filterModel, CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS);
    }

    /**
     * Overrides {@link sap.ui.core.Control#clone Control.clone} to clone additional
     * internal states.
     *
     * @param [sIdSuffix] A suffix to be appended to the cloned control id
     * @param [aLocalIds] An array of local IDs within the cloned hierarchy (internally used)
     * @returns Reference to the newly created clone
     * @protected
     */;
    _proto.clone = function clone(sIdSuffix, aLocalIds) {
      const clone = _Control.prototype.clone.call(this, sIdSuffix, aLocalIds);
      // During cloning, the old model will be copied and overwrites any new model (same alias) that
      // you introduce during init(); hence you need to overwrite it again by the new one that you've
      // created during init() (i.e. clone._filterModel); that standard behaviour of super.clone()
      // can't even be suppressed in an own constructor; for a detailed investigation of the cloning,
      // please overwrite the setModel() method and check the list of callers and steps induced by them.
      clone.setModel(clone._filterModel, CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS);
      return clone;
    }

    /**
     * Listens to property changes.
     *
     * @param changes Property changes
     * @private
     */;
    _proto._observeChanges = function _observeChanges(changes) {
      if (changes.name === "conditions") {
        this._handleConditionsChange(changes.current);
      }
    }

    /**
     * Gets the content of this wrapper control.
     *
     * @returns The wrapper content
     * @private
     */;
    _proto.getContent = function getContent() {
      return this.getAggregation("content");
    }

    /**
     * Gets the value for control property 'conditions'.
     *
     * @returns Array of filter conditions
     * @private
     */;
    _proto.getConditions = function getConditions() {
      return this.getProperty("conditions");
    }

    /**
     * Sets the value for control property 'conditions'.
     *
     * @param [conditions] Array of filter conditions
     * @returns Reference to this wrapper
     * @private
     */;
    _proto.setConditions = function setConditions(conditions) {
      this.setProperty("conditions", conditions || []);
      return this;
    }

    /**
     * Gets the filter model alias 'filterValues'.
     *
     * @returns The filter model
     * @private
     */;
    _proto.getFilterModelAlias = function getFilterModelAlias() {
      return CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS;
    }

    /**
     * Updates the property "conditions" with filter values
     * sent by ExtensionAPI#setFilterValues().
     *
     * @param values The filter values
     * @param [operator] The operator name
     * @private
     */;
    _proto.updateConditionsByFilterValues = function updateConditionsByFilterValues(values, operator) {
      const conditions = CustomFilterFieldContentWrapper._filterValuesToConditions(values, operator);
      this.setConditions(conditions);
    }

    /**
     * Updates filter model with conditions
     * sent by the {@link sap.ui.mdc.FilterField FilterField}.
     *
     * @param conditions Array of filter conditions
     * @private
     */;
    _proto.updateFilterModelByConditions = function updateFilterModelByConditions(conditions) {
      var _conditions$;
      const operator = ((_conditions$ = conditions[0]) === null || _conditions$ === void 0 ? void 0 : _conditions$.operator) || "";
      const formatOptions = operator !== "" ? {
        operators: [operator]
      } : {
        operators: []
      };
      if (this.getBindingContext(CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS)) {
        var _this$getBindingConte;
        const stringValue = CustomFilterFieldContentWrapper._conditionsToFilterModelString(conditions, formatOptions);
        this._filterModel.setProperty((_this$getBindingConte = this.getBindingContext(CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS)) === null || _this$getBindingConte === void 0 ? void 0 : _this$getBindingConte.getPath(), stringValue);
      }
    };
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      var _content$getAccessibi;
      const content = this.getContent();
      return (content === null || content === void 0 ? void 0 : (_content$getAccessibi = content.getAccessibilityInfo) === null || _content$getAccessibi === void 0 ? void 0 : _content$getAccessibi.call(content)) || {};
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     *
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      const content = this.getContent();
      return content === null || content === void 0 ? void 0 : content.getIdForLabel();
    };
    return CustomFilterFieldContentWrapper;
  }(Control), _class3.FILTER_MODEL_ALIAS = "filterValues", _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "formDoNotAdjustWidth", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "conditions", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "conditionsChange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  })), _class2)) || _class);
  _exports = CustomFilterFieldContentWrapper;
  return _exports;
}, false);
