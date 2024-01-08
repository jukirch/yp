/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/ModelHelper", "sap/fe/macros/internal/valuehelp/AdditionalValueHelper", "sap/ui/core/Core", "sap/ui/core/library"], function (valueFormatters, ModelHelper, AdditionalValueHelper, Core, library) {
  "use strict";

  var ValueState = library.ValueState;
  var additionalValueHelper = AdditionalValueHelper.additionalValueHelper;
  /**
   * Growing formatter used for growing and growingThreshold.
   *
   * @param this Valuehelp Table
   * @param recommendationData Data fetched from recommendation model
   * @param propertyPath Property Path of the Field
   * @returns Boolean value for growing and growingThreshold properties
   */
  function getGrowing(recommendationData, propertyPath) {
    const values = additionalValueHelper.getRelevantRecommendations(recommendationData || {}, this.getBindingContext(), propertyPath) || [];
    if (values.length > 0) {
      //if there are relevant recommendations then return true
      return true;
    }
    return false;
  }
  getGrowing.__functionName = "sap.fe.macros.internal.valuehelp.AdditionalValueFormatter#getGrowing";

  /**
   * Get the relative property path of the field.
   *
   * Example:
   * binding context path  : '/Employee(1)'.
   * source path           : '/Employee/Name'.
   * relative property path: 'Name'.
   *
   * @param fieldBindingContext Field binding context
   * @param sourcepath Property Path of the Field
   * @returns Relative property path.
   */
  function _getRelativePropertyPath(fieldBindingContext, sourcepath) {
    const metaPath = ModelHelper.getMetaPathForContext(fieldBindingContext);
    return sourcepath.replace(`${metaPath}/`, "");
  }

  /**
   * Sets the value state for the field in the table for which the binding context is not updated with the context data.
   *
   * In a few scenarios where the field is inside the table, the value state formatter is called for value update with the context without context data(context.getObject() is undefined).
   * NOTE: This solution needs to be checked with model if there is a better approach than using the table listbinding's change event.
   *
   * @param this Field
   * @param fieldBindingContext Field's binding context
   * @param all_recommendations Data fetched from recommendation model
   * @param sourcepath Property Path of the Field
   * @param recommendationsText Value state text when the recommendations are shown
   */
  function _setValueStateForFieldWithNoDataContext(fieldBindingContext, all_recommendations, sourcepath, recommendationsText) {
    const fnSetValueState = event => {
      const listBinding = event.getSource();
      const listContexts = listBinding.getAllCurrentContexts();
      if (listContexts.includes(fieldBindingContext)) {
        if (fieldBindingContext.getObject()) {
          const {
            valueState,
            valueStateText
          } = _getValueStateForRecommendationField(all_recommendations, fieldBindingContext, sourcepath, recommendationsText);
          this.setValueStateText(valueStateText);
          this.setValueState(valueState);
        }
        listBinding.detachChange(fnSetValueState);
      }
    };
    fieldBindingContext.getBinding().attachChange(fnSetValueState);
  }

  /**
   * Get the value state when recommendations are applicable.
   *
   * @param all_recommendations Data fetched from the recommendation model
   * @param fieldBindingContext Field's binding context
   * @param sourcepath Property Path of the Field
   * @param recommendationsText Value state text in case the recommendations are shown
   * @returns Value state information including the value state and the value state text.
   */
  function _getValueStateForRecommendationField(all_recommendations, fieldBindingContext, sourcepath, recommendationsText) {
    var _relevantRecommendati, _relevantRecommendati2;
    const relativePropertyPath = _getRelativePropertyPath(fieldBindingContext, sourcepath);
    const values = additionalValueHelper.getRelevantRecommendations(all_recommendations, fieldBindingContext, sourcepath, relativePropertyPath);
    let relevantRecommendations;
    if (all_recommendations.version === 2) {
      relevantRecommendations = additionalValueHelper.getAdditionalValueFromPropertyPath(relativePropertyPath, fieldBindingContext, all_recommendations);
    }
    // If no values are available for the field with present context we reset value state.
    let valueState = ValueState.None,
      valueStateText = "";
    if (all_recommendations.version === 2 && ((_relevantRecommendati = relevantRecommendations) !== null && _relevantRecommendati !== void 0 && _relevantRecommendati.value || (_relevantRecommendati2 = relevantRecommendations) !== null && _relevantRecommendati2 !== void 0 && _relevantRecommendati2.text) || !all_recommendations.version && values !== null && values !== void 0 && values.length) {
      valueStateText = recommendationsText;
      valueState = ValueState.Information;
    }
    return {
      valueState,
      valueStateText
    };
  }

  /**
   * Format the value state of the field based on the present value state and the available recommendations.
   *
   * @param this Field
   * @param all_recommendations Data fetched from recommendation model
   * @param isEditable Page is in edit mode
   * @param sourcepath Property Path of the Field
   * @param fieldValue Present field value
   * @returns Field value state
   */
  function formatValueState(all_recommendations, isEditable, sourcepath, fieldValue, fieldTextValue) {
    // We reset value state when:
    // 1. No context is bound to the field.
    // 2. isEditable is false
    const fieldBindingContext = this.getBindingContext();
    if (!fieldBindingContext || !isEditable) {
      return ValueState.None;
    }
    fieldTextValue = fieldTextValue === "undefined" ? undefined : fieldTextValue;
    // We don't change the present value state when:
    // 1. Source path is not available.
    // 2. Field context is transient.
    const presentValueState = this.getValueState();
    const isTransient = fieldBindingContext.isTransient();
    if (!sourcepath || isTransient) {
      return presentValueState;
    }

    // We reset value state when recommendations are not available and value state represents recommendations.
    const recommendationsAvailable = !!all_recommendations && Object.keys(all_recommendations).length > 0;
    const recommendationsText = Core.getLibraryResourceBundle("sap.fe.core").getText("RECOMMENDATIONS_DATA_INFO");
    const presentValueStateText = this.getValueStateText();
    const presentVSIsRecommendations = presentValueState === ValueState.Information && presentValueStateText === recommendationsText;
    //If field value is present or recommendations are not available but presentState is Info then we change it to None
    if (presentVSIsRecommendations && (!recommendationsAvailable || fieldValue || fieldTextValue)) {
      return ValueState.None;
    }

    // Recommendations shall be applicable if they are available and the present value state:
    // 1. Is None
    // 2. Already represents recomendations.
    const recommendationsStateApplicable = recommendationsAvailable && (presentValueState == ValueState.None || presentVSIsRecommendations);
    if (!fieldValue && !fieldTextValue && recommendationsStateApplicable) {
      var _fieldBindingContext$, _fieldBindingContext$2;
      if (!fieldBindingContext.getObject() && (_fieldBindingContext$ = fieldBindingContext.getBinding()) !== null && _fieldBindingContext$ !== void 0 && (_fieldBindingContext$2 = _fieldBindingContext$.isA) !== null && _fieldBindingContext$2 !== void 0 && _fieldBindingContext$2.call(_fieldBindingContext$, "sap.ui.model.odata.v4.ODataListBinding")) {
        // No context data avalilable yet and parent binding is listbinding (Field in Table scenario)
        _setValueStateForFieldWithNoDataContext.call(this, fieldBindingContext, all_recommendations, sourcepath, recommendationsText);
      } else {
        const {
          valueState,
          valueStateText
        } = _getValueStateForRecommendationField(all_recommendations, fieldBindingContext, sourcepath, recommendationsText);
        this.setValueStateText(valueStateText);
        return valueState;
      }
    }
    return presentValueState;
  }
  formatValueState.__functionName = "sap.fe.macros.internal.valuehelp.AdditionalValueFormatter#formatValueState";
  function _getPlaceholderText(relevantRecommendations, displayMode) {
    let placeholder;
    const value = relevantRecommendations === null || relevantRecommendations === void 0 ? void 0 : relevantRecommendations.value;
    const text = relevantRecommendations === null || relevantRecommendations === void 0 ? void 0 : relevantRecommendations.text;
    switch (displayMode) {
      //set up the placeholder according to text arrangement
      case "Value":
        placeholder = valueFormatters.formatWithBrackets(value);
        break;
      case "Description":
        placeholder = valueFormatters.formatWithBrackets(text);
        break;
      case "DescriptionValue":
        placeholder = valueFormatters.formatWithBrackets(text, value);
        break;
      case "ValueDescription":
        placeholder = valueFormatters.formatWithBrackets(value, text);
        break;
      default:
        placeholder = valueFormatters.formatWithBrackets(text, value);
    }
    return placeholder;
  }
  function formatPlaceholder(all_recommendations, currentPageContext, currentBoundMessageType, editStylePlaceholder, displayMode) {
    let placeholderData = this.getPlaceholder();
    editStylePlaceholder = editStylePlaceholder === "undefined" ? undefined : editStylePlaceholder;
    if (currentBoundMessageType) {
      return editStylePlaceholder;
    }
    if (all_recommendations && Object.keys(all_recommendations).length && all_recommendations.version === 2) {
      var _this$getBinding;
      const bindingContext = this.getBindingContext() || currentPageContext;
      const bindingPath = (_this$getBinding = this.getBinding("value")) === null || _this$getBinding === void 0 ? void 0 : _this$getBinding.getPath();
      if (bindingContext && bindingPath) {
        //get the recommendations based on property path and binding context passed
        const relevantRecommendations = additionalValueHelper.getAdditionalValueFromPropertyPath(bindingPath, bindingContext, all_recommendations);
        //if we get recommendations then push the values
        placeholderData = _getPlaceholderText(relevantRecommendations, displayMode);
      }
    }
    if (editStylePlaceholder && !placeholderData) {
      placeholderData = editStylePlaceholder;
    }
    return placeholderData;
  }
  formatPlaceholder.__functionName = "sap.fe.macros.internal.valuehelp.AdditionalValueFormatter#formatPlaceholder";

  // See https://www.typescriptlang.org/docs/handbook/functions.html#this-parameters for more detail on this weird syntax
  /**
   * Collection of AdditionalValue formatters.
   *
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const additionalValueFormatter = function (sName) {
    if (additionalValueFormatter.hasOwnProperty(sName)) {
      for (var _len = arguments.length, oArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        oArgs[_key - 1] = arguments[_key];
      }
      return additionalValueFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  additionalValueFormatter.getGrowing = getGrowing;
  additionalValueFormatter.formatValueState = formatValueState;
  additionalValueFormatter.formatPlaceholder = formatPlaceholder;

  /**
   * @global
   */
  return additionalValueFormatter;
}, true);
