/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/isEmptyObject", "sap/fe/core/helpers/SemanticDateOperators", "sap/fe/navigation/SelectionVariant", "sap/ui/mdc/condition/FilterOperatorUtil", "sap/ui/mdc/condition/RangeOperator", "sap/ui/mdc/odata/v4/TypeMap"], function (Log, isEmptyObject, SemanticDateOperators, SelectionVariant, FilterOperatorUtil, RangeOperator, TypeMap) {
  "use strict";

  const stateFilterToSelectionVariant = {
    /**
     * Get selection variant based on the filter conditions.
     *
     * @param filterConditions Configure the filter bar control
     * @param propertyHelper PropertyHelper of the filter bar
     * @param params Parameters of parametrized services
     * @returns The filter conditions are converted to the selection variant and returned
     */
    getSelectionVariantFromConditions: function (filterConditions, propertyHelper, params) {
      const selectionVariant = new SelectionVariant();
      if (!isEmptyObject(filterConditions)) {
        for (const filterKey in filterConditions) {
          const filterFieldCondition = filterConditions[filterKey];
          if (filterFieldCondition !== null && filterFieldCondition !== void 0 && filterFieldCondition.length) {
            const selectOptions = stateFilterToSelectionVariant.getSelectionOptionsFromCondition(filterFieldCondition, filterKey, propertyHelper);
            if (selectOptions.length) {
              // get parameters from filter bar
              if (params !== null && params !== void 0 && params.includes(filterKey)) {
                // trying to generate properties like $Parameter.CompanyCode if CompanyCode is a parameter
                selectionVariant.massAddSelectOption(`$Parameter.${filterKey}`, selectOptions);
              }
              selectionVariant.massAddSelectOption(filterKey, selectOptions);
            }
          }
        }
      }
      return selectionVariant;
    },
    /**
     * Compare two SelectOption objects and check if they are equal.
     *
     * @param options1 The first SelectOption object
     * @param options2 The second SelectOption object
     * @returns True if the objects are equal, false otherwise
     */
    compareSelectOptions: function (options1, options2) {
      return options1.Option === options2.Option && options1.Sign === options2.Sign && options1.Low === options2.Low && options1.High === options2.High;
    },
    /**
     * Merge two selection variants.
     *
     * @param selectionVariant1 The first selectionVariant1 object
     * @param selectionVariant2 The second selectionVariant object
     * @returns The merged selectionVariant
     */
    mergeSelectionVariants: function (selectionVariant1, selectionVariant2) {
      // Create a new SelectionVariant for the merged result, initially a clone of SelectionVariant1
      const mergedSV = new SelectionVariant(selectionVariant1.toJSONString());

      // Get the property names from SelectionVariant2
      const propertyNames = selectionVariant2.getSelectOptionsPropertyNames();

      // Keep track of added properties
      const addedProperties = [];

      // Loop through each property in SelectionVariant2
      for (const propName of propertyNames) {
        const controlOptions = selectionVariant2.getSelectOption(propName) || [];
        const mergedOptions = mergedSV.getSelectOption(propName) || [];

        // Check if the property already exists in SelectionVariant1
        if (!addedProperties.includes(propName)) {
          // If not, add the entire property from SelectionVariant2
          mergedSV.massAddSelectOption(propName, controlOptions);
          addedProperties.push(propName);
        } else {
          // If it exists in SelectionVariant1, only add the options that are not already present
          for (const controlOption of controlOptions) {
            if (!mergedOptions.some(mergedOption => stateFilterToSelectionVariant.compareSelectOptions(mergedOption, controlOption))) {
              mergedOptions.push(controlOption);
            }
          }
          mergedSV.massAddSelectOption(propName, mergedOptions);
        }
      }
      return mergedSV;
    },
    /**
     * Method to add the filter conditions to selection variant.
     *
     * @param stateFilters Retrieved filter condition for a filter field from StateUtils
     * @param filterKey Name of the filter key
     * @param propertyHelper PropertyHelper of the filter bar
     * @returns The selection option array for a particular filter key
     */
    getSelectionOptionsFromCondition: function (stateFilters, filterKey, propertyHelper) {
      const selectOptions = [];
      for (const condition of stateFilters) {
        const selectOption = stateFilterToSelectionVariant.getSelectionOption(condition, filterKey, propertyHelper);
        if (selectOption) {
          selectOptions.push(selectOption);
        }
      }
      return selectOptions;
    },
    /**
     * Calculate the filter option for each value.
     *
     * @param condition
     * @param filterKey Name of the filter key
     * @param propertyHelper PropertyHelper of the filter bar
     * @returns The promise of the Select option
     */
    getSelectionOption: function (condition, filterKey, propertyHelper) {
      var _filterOption;
      let semanticDates;
      let filterOption;
      const operator = condition.operator && condition.operator !== "" ? FilterOperatorUtil.getOperator(condition.operator) : undefined;
      if (operator instanceof RangeOperator) {
        semanticDates = stateFilterToSelectionVariant.createSemanticDatesFromConditions(condition);
        filterOption = stateFilterToSelectionVariant.getOptionForPropertyWithRangeOperator(operator, condition, filterKey, propertyHelper);
      } else {
        const semanticDateOpsExt = SemanticDateOperators.getSupportedOperations();
        if (semanticDateOpsExt.includes(condition.operator)) {
          semanticDates = stateFilterToSelectionVariant.createSemanticDatesFromConditions(condition);
        }
        filterOption = stateFilterToSelectionVariant.getSelectionFormatForNonRangeOperator(condition, filterKey);
      }
      if ((_filterOption = filterOption) !== null && _filterOption !== void 0 && _filterOption.Option) {
        filterOption.SemanticDates = semanticDates ? semanticDates : undefined;
      }
      return filterOption;
    },
    /**
     * Calculate the filter conditions for the Select option.
     *
     * @param condition Condition object
     * @param filterKey Name of the filter key
     * @param operator The `sap.ui.mdc.condition.Operator` object
     * @returns The Select Option object or undefined
     */
    getSelectionFormatForNonRangeOperator: function (condition, filterKey) {
      const [lowValue, highValue] = condition.values;
      return stateFilterToSelectionVariant.getSelectOption(condition.operator, lowValue !== undefined && lowValue !== null ? lowValue.toString() : "", highValue !== undefined && highValue !== null ? highValue.toString() : null, filterKey);
    },
    /**
     * Get the type-specific information for the filter field.
     *
     * @param filterKey Name of the filter key
     * @param propertyHelper PropertyHelper and filter delegate controller of filter bar
     * @returns The object with typeConfig value
     */
    getTypeInfoForFilterProperty: function (filterKey, propertyHelper) {
      // for few filter fields keys will not be present hence skip those properties
      const propertyInfo = propertyHelper.getProperty(filterKey);
      let typeConfig;
      if (propertyInfo) {
        typeConfig = propertyInfo.typeConfig;
      }
      return typeConfig;
    },
    /**
     * Calculate the options for date range values.
     *
     * @param operator Object for the given operator name
     * @param condition The Value object that is present in the values of the filter condition
     * @param filterKey Name of the filter key
     * @param propertyHelper PropertyHelper of filter bar
     * @returns The selectionOption for filter field
     */
    getOptionForPropertyWithRangeOperator: function (operator, condition, filterKey, propertyHelper) {
      const filterOption = {
        Sign: "I",
        Option: "",
        Low: "",
        High: ""
      };
      const typeConfig = stateFilterToSelectionVariant.getTypeInfoForFilterProperty(filterKey, propertyHelper);

      // handling of Date RangeOperators
      const modelFilter = operator.getModelFilter(condition, filterKey, typeConfig ? typeConfig.typeInstance : undefined, false, typeConfig ? typeConfig.baseType : undefined);
      const filters = modelFilter.getFilters();
      if (filters === undefined) {
        filterOption.Sign = operator.exclude ? "E" : "I";
        // FIXME Those are private methods from MDC
        filterOption.Low = TypeMap.externalizeValue(modelFilter.getValue1(), typeConfig ? typeConfig.typeInstance : "string");
        filterOption.High = TypeMap.externalizeValue(modelFilter.getValue2(), typeConfig ? typeConfig.typeInstance : "string");
        filterOption.Option = modelFilter.getOperator() ?? "";
      }
      return filterOption.Option != "" ? filterOption : undefined;
    },
    /**
     * Get sign and option of selection option.
     *
     * @param operator The option of selection variant
     * @param lowValue The single value or the lower boundary of the interval; the <code>null</code> value is not allowed
     * @param highValue The High value of the range; if this value is not necessary, <code>null</code> is used</li>
     * @param filterKey The name of the filter field
     * @returns The selection state
     */
    getSelectOption: function (operator, lowValue, highValue, filterKey) {
      const selectOptionState = {
        Option: "",
        Sign: "I",
        Low: lowValue,
        High: highValue
      };
      switch (operator) {
        case "Contains":
          selectOptionState.Option = "CP";
          selectOptionState.Low = `*${selectOptionState.Low}*`;
          break;
        case "StartsWith":
          selectOptionState.Option = "CP";
          selectOptionState.Low += "*";
          break;
        case "EndsWith":
          selectOptionState.Option = "CP";
          selectOptionState.Low = `*${selectOptionState.Low}`;
          break;
        case "BT":
        case "LE":
        case "LT":
        case "GT":
        case "EQ":
          selectOptionState.Option = operator;
          break;
        case "DATE":
          selectOptionState.Option = "EQ";
          break;
        case "DATERANGE":
          selectOptionState.Option = "BT";
          break;
        case "FROM":
          selectOptionState.Option = "GE";
          break;
        case "TO":
          selectOptionState.Option = "LE";
          break;
        case "EEQ":
          selectOptionState.Option = "EQ";
          break;
        case "Empty":
          selectOptionState.Option = "EQ";
          selectOptionState.Low = "";
          break;
        case "NE":
          selectOptionState.Sign = "E";
          selectOptionState.Option = "EQ";
          break;
        case "NotContains":
          selectOptionState.Option = "CP";
          selectOptionState.Sign = "E";
          selectOptionState.Low = `*${selectOptionState.Low}*`;
          break;
        case "NOTBT":
          selectOptionState.Option = "BT";
          selectOptionState.Sign = "E";
          break;
        case "NotStartsWith":
          selectOptionState.Option = "CP";
          selectOptionState.Low += "*";
          selectOptionState.Sign = "E";
          break;
        case "NotEndsWith":
          selectOptionState.Option = "CP";
          selectOptionState.Low = `*${selectOptionState.Low}`;
          selectOptionState.Sign = "E";
          break;
        case "NotEmpty":
          selectOptionState.Option = "EQ";
          selectOptionState.Low = "";
          selectOptionState.Sign = "E";
          break;
        case "NOTLE":
          selectOptionState.Option = "LE";
          selectOptionState.Sign = "E";
          break;
        case "NOTGE":
          selectOptionState.Option = "GE";
          selectOptionState.Sign = "E";
          break;
        case "NOTLT":
          selectOptionState.Option = "LT";
          selectOptionState.Sign = "E";
          break;
        case "NOTGT":
          selectOptionState.Option = "GT";
          selectOptionState.Sign = "E";
          break;
        default:
          Log.warning(`${operator} is not supported. ${filterKey} could not be added to the Selection variant`);
      }
      return selectOptionState.Option !== "" ? selectOptionState : undefined;
    },
    /**
     * Create the semantic dates from filter conditions.
     *
     * @param condition Filter field condition
     * @returns The Semantic date conditions
     */
    createSemanticDatesFromConditions: function (condition) {
      if (!isEmptyObject(condition)) {
        return {
          high: condition.values[0] ? condition.values[0] : null,
          low: condition.values[1] ? condition.values[1] : null,
          operator: condition.operator
        };
      }
    }
  };
  return stateFilterToSelectionVariant;
}, false);
