/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/m/inputUtils/highlightDOMElements", "sap/ui/mdc/ValueHelpDelegate", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/mdc/p13n/StateUtil", "sap/ui/model/FilterType", "../internal/valuehelp/AdditionalValueHelper"], function (Log, CommonUtils, ActivitySync, CollaborationCommon, MetaModelConverter, TypeGuards, ValueListHelper, highlightDOMElements, ValueHelpDelegate, Condition, ConditionValidated, TypeMap, StateUtil, FilterType, AdditionalValueHelper) {
  "use strict";

  var additionalValueHelper = AdditionalValueHelper.additionalValueHelper;
  var AdditionalValueGroupKey = AdditionalValueHelper.AdditionalValueGroupKey;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var convertTypes = MetaModelConverter.convertTypes;
  var Activity = CollaborationCommon.Activity;
  const FeCoreControlsFilterBar = "sap.fe.core.controls.FilterBar";
  return Object.assign({}, ValueHelpDelegate, {
    apiVersion: 2,
    /**
     * Checks if a <code>ListBinding</code> supports $Search.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content Content element
     * @param _listBinding
     * @returns True if $search is supported
     */
    isSearchSupported: function (valueHelp, content, _listBinding) {
      return content.getFilterFields() === "$search";
    },
    /**
     * Adjustable filtering for list-based contents.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content ValueHelp content requesting conditions configuration
     * @param bindingInfo The binding info object to be used to bind the list to the model
     */
    updateBindingInfo: function (valueHelp, content, bindingInfo) {
      ValueHelpDelegate.updateBindingInfo(valueHelp, content, bindingInfo);
      if (content.getFilterFields() === "$search") {
        const search = content.getFilterValue();
        const normalizedSearch = CommonUtils.normalizeSearchTerm(search); // adjustSearch

        if (bindingInfo.parameters) {
          bindingInfo.parameters.$search = normalizedSearch || undefined;
        }
      }
    },
    /**
     * Checks if field is recommendation relevant and calls either _updateBinding or _updateBindingForRecommendations.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param listBinding List binding
     * @param bindingInfo The binding info object to be used to bind the list to the model
     * @param content Filterable List Content
     */
    updateBinding: async function (valueHelp, listBinding, bindingInfo, content) {
      //We fetch the valuelist property from the payload to make sure we pass the right property while making a call on valuelist entity set
      const payload = valueHelp.getPayload();
      const valueListProperty = this._getValueListPropertyFromPayloadQualifier(payload);
      const isFilterFieldOrMultiValuedField = content.getControl().isA("sap.ui.mdc.FilterField") || content.getControl().isA("sap.ui.mdc.MultiValueField");
      const field = content.getControl();
      const fieldValue = !isFilterFieldOrMultiValuedField && field.getValue();
      // For define conditions valuehelp recommendations are not supported because "internal" model is not available.
      // We need to show recommendations only when the field has empty value or when user is typing a value. Other times we should not show recommendations.
      //Check if the field has any pending user input and if it is then we show recommendations if any.
      if ((!fieldValue || field !== null && field !== void 0 && field.hasPendingUserInput()) && content.isTypeahead() && !payload.isDefineConditionValueHelp) {
        var _values2;
        const bindingContext = content.getBindingContext();
        const additionalValues = [];
        //get the recommendation data from the internal model
        const inputValues = content.getModel("internal").getProperty("/recommendationsData") || {};
        let values = [];
        //Fetch the relevant recommendations based on the inputvalues and bindingcontext
        if (!isFilterFieldOrMultiValuedField) {
          var _content$getControl$g;
          values = additionalValueHelper.getRelevantRecommendations(inputValues, bindingContext, payload.propertyPath, (_content$getControl$g = content.getControl().getBinding("value")) === null || _content$getControl$g === void 0 ? void 0 : _content$getControl$g.getPath()) || [];
        }
        //if there are relevant recommendations then create additionalvalue structure and call _updateBindingForRecommendations
        if (((_values2 = values) === null || _values2 === void 0 ? void 0 : _values2.length) > 0) {
          additionalValues.push({
            propertyPath: valueListProperty,
            values,
            groupKey: AdditionalValueGroupKey.recommendation
          });
          this._updateBindingForRecommendations(payload, listBinding, bindingInfo, additionalValues);
        } else {
          //call _updateBinding if there are no relevant recommendations
          this._updateBinding(listBinding, bindingInfo);
        }
      } else {
        //call _updateBinding if there are no relevant recommendations
        this._updateBinding(listBinding, bindingInfo);
      }
    },
    /**
     * Executes a filter in a <code>ListBinding</code>.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param listBinding List binding
     * @param requestedItems Number of requested items
     * @returns Promise that is resolved if search is executed
     */
    executeFilter: async function (valueHelp, listBinding, requestedItems) {
      listBinding.getContexts(0, requestedItems);
      await this.checkListBindingPending(valueHelp, listBinding, requestedItems);
      return listBinding;
    },
    /**
     * Checks if the <code>ListBinding</code> is waiting for an update.
     * As long as the context has not been set for <code>ListBinding</code>,
     * <code>ValueHelp</code> needs to wait.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param listBinding ListBinding to check
     * @param requestedItems Number of requested items
     * @returns Promise that is resolved once ListBinding has been updated
     */
    checkListBindingPending: async function (valueHelp, listBinding, requestedItems) {
      const payload = valueHelp.getPayload();
      let isPending = false;
      if (payload.updateBindingDonePromise) {
        const updateBindingDone = await payload.updateBindingDonePromise;
        isPending = !updateBindingDone;
      } else if (listBinding && !listBinding.isSuspended()) {
        const contexts = await listBinding.requestContexts(0, requestedItems);
        isPending = contexts.length === 0;
      }
      return isPending;
    },
    getTypeMap: function (_valueHelp) {
      return TypeMap;
    },
    /**
     * Requests the content of the value help.
     *
     * This function is called when the value help is opened or a key or description is requested.
     *
     * So, depending on the value help content used, all content controls and data need to be assigned.
     * Once they are assigned and the data is set, the returned <code>Promise</code> needs to be resolved.
     * Only then does the value help continue opening or reading data.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param container Container instance
     * @param contentId Id of the content shown after this call to retrieveContent
     * @returns Promise that is resolved if all content is available
     */
    retrieveContent: function (valueHelp, container, contentId) {
      const payload = valueHelp.getPayload();
      return ValueListHelper.showValueList(payload, container, contentId);
    },
    _getConditionPayloadList: function (condition) {
      const conditionPayloadMap = condition.payload || {},
        valueHelpQualifiers = Object.keys(conditionPayloadMap),
        conditionPayloadList = valueHelpQualifiers.length ? conditionPayloadMap[valueHelpQualifiers[0]] : [];
      return conditionPayloadList;
    },
    /**
     * Returns ValueListProperty from Payload based on data from payload keys and parameters.
     *
     * @param payload Payload for delegate
     * @returns ValueListProperty
     */
    _getValueListPropertyFromPayloadQualifier: function (payload) {
      const params = payload.qualifiers[payload.valueHelpQualifier].vhParameters || [];
      const keys = payload.qualifiers[payload.valueHelpQualifier].vhKeys || [];
      const propertyKeyPath = payload.valueHelpKeyPath;
      let filteredKeys = [...keys];
      const helpPaths = [];
      if (params.length > 0) {
        //create helpPaths array which will only consist of params helppath
        params.forEach(function (param) {
          helpPaths.push(param.helpPath);
        });
        //filter the keys based on helpPaths. If key is not present in helpPath then it is valuelistproperty
        filteredKeys = keys.filter(key => {
          return !helpPaths.includes(key);
        });
      }

      // from filteredKeys return the key that matches the property name
      return propertyKeyPath && filteredKeys.includes(propertyKeyPath) ? propertyKeyPath : "";
    },
    _onConditionPropagationToFilterBar: async function (conditions, outParameters, filterBar, payload, listReportFilterBar) {
      try {
        var _filterBar$getModel;
        const state = await StateUtil.retrieveExternalState(listReportFilterBar);
        const initialStateItems = state.items; // Visible FilterItems in the LR-FilterBar
        const filterBarProperties = filterBar.getPropertyHelper().getProperties();
        const metaModel = (_filterBar$getModel = filterBar.getModel()) === null || _filterBar$getModel === void 0 ? void 0 : _filterBar$getModel.getMetaModel();
        const contextPath = `/${payload.propertyPath.split("/")[1]}`;
        for (const condition of conditions) {
          const conditionPayloadList = this._getConditionPayloadList(condition);
          for (const outParameter of outParameters) {
            const filterTarget = outParameter.source.split("conditions/").pop() || "";
            const lastIndex = payload.propertyPath.lastIndexOf("/");
            const filterTargetPath = lastIndex > 0 ? `${payload.propertyPath.substring(0, lastIndex)}/${filterTarget}` : filterTarget;
            const annotationPath = metaModel === null || metaModel === void 0 ? void 0 : metaModel.getReducedPath(filterTargetPath, contextPath);
            const filterBarProperty = filterBarProperties.find(item => item.annotationPath === annotationPath);
            // Propagate OUT parameter only if the filter field is visible in the LR filterbar
            // LR FilterBar or LR AdaptFilter
            if (filterBarProperty && initialStateItems !== null && initialStateItems !== void 0 && initialStateItems.find(item => item.name === filterBarProperty.name)) {
              for (const conditionPayload of conditionPayloadList) {
                const newCondition = Condition.createCondition("EQ", [conditionPayload[outParameter.helpPath]], null, null, ConditionValidated.Validated);
                state.filter[filterBarProperty.conditionPath] ||= [];
                state.filter[filterBarProperty.conditionPath].push(newCondition);
              }
            }
          }
        }
        // Apply to the parent of the FilterField
        StateUtil.applyExternalState(filterBar, state);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`ValueHelpDelegate: ${message}`);
      }
    },
    _onConditionPropagationToBindingContext: function (conditions, outParameters, context, valueHelp) {
      const metaModel = context.getModel().getMetaModel();
      for (const condition of conditions) {
        const conditionPayloadList = this._getConditionPayloadList(condition),
          outValues = conditionPayloadList.length === 1 ? conditionPayloadList[0] : undefined;
        if (conditionPayloadList.length > 1) {
          Log.warning("ValueHelpDelegate: ParameterOut in multi-value-field not supported");
        }
        if (outValues) {
          this._onConditionPropagationUpdateProperty(metaModel, outValues, outParameters, context, valueHelp);
        }
      }
    },
    _onConditionPropagationUpdateProperty: function (metaModel, outValues, outParameters, context, valueHelp) {
      const convertedMetadata = convertTypes(metaModel);
      const rootPath = metaModel.getMetaContext(context.getPath()).getPath();
      const contextCanRequestSideEffects = context.isTransient() !== true && !context.isInactive();
      const outParameterSources = [];
      for (const outParameter of outParameters) {
        /* Updated property via out-parameter if value changed */
        if (context.getProperty(outParameter.source) !== outValues[outParameter.helpPath]) {
          this._updatePropertyViaOutParameter(convertedMetadata, rootPath, outValues, outParameter, context, contextCanRequestSideEffects);
        }
        outParameterSources.push(outParameter.source);
      }
      if (ActivitySync.isConnected(valueHelp)) {
        // we determine the binding that sends the request
        let binding;
        if (context.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding")) {
          binding = context.getBinding();
        } else {
          const view = CommonUtils.getTargetView(valueHelp);
          binding = view.getBindingContext().getBinding();
        }
        /* The out values have been changed --> wait until the request is sent to the server before sending a notification to the other collaborators
           We attach the event on the right binding */
        binding.attachEventOnce("patchCompleted", () => {
          ActivitySync.send(valueHelp, {
            action: Activity.Change,
            content: outParameterSources.map(source => context.getPath() + "/" + source)
          });
        });
      }
    },
    _updatePropertyViaOutParameter: function (convertedMetadata, rootPath, outValues, outParameter, context, contextCanRequestSideEffects) {
      var _targetProperty$annot, _targetProperty$annot2, _targetProperty$annot3, _targetProperty$annot4, _targetProperty$annot5, _targetProperty$annot6;
      /* Updated property via out-parameter if value changed */
      const propertyPath = `${rootPath}/${outParameter.source}`;
      const targetProperty = convertedMetadata.resolvePath(propertyPath).target;
      const fieldControl = targetProperty === null || targetProperty === void 0 ? void 0 : (_targetProperty$annot = targetProperty.annotations) === null || _targetProperty$annot === void 0 ? void 0 : (_targetProperty$annot2 = _targetProperty$annot.Common) === null || _targetProperty$annot2 === void 0 ? void 0 : _targetProperty$annot2.FieldControl;
      const dynamicReadOnly = isPathAnnotationExpression(fieldControl) ? context.getProperty(fieldControl.path) === 1 : false;
      if (dynamicReadOnly && contextCanRequestSideEffects) {
        /* Non-Transient and active context */
        const lastIndex = outParameter.source.lastIndexOf("/");
        const sideEffectPath = lastIndex > 0 ? outParameter.source.substring(0, lastIndex) : outParameter.source;
        /* We send [<propertyName>] in case of a property path without any navigation involved */
        /* In case of a path involving navigations, we send [<navigationPath>] ending with a navigation property and not with a property */
        context.requestSideEffects([sideEffectPath]);
      } else {
        /* The fast creation row (transient context) can´t have instant specific (dynamic) read-only fields, therefore we don´t need to handle/consider this case specifically */
        /* Additional infos: */
        /* The fast creation row is only used by SD */
        /* The group ID (third argument of setProperty described api documentation of the Context) is used for the PATCH request, if not specified, the update group ID for the context's binding is used, 'null' to prevent the PATCH request */
        /* The Transient context cannot request SideEffects and  cannot patch via group 'null' */
        context.setProperty(outParameter.source, outValues[outParameter.helpPath]);
      }
      /* If the key gets updated via out-parameter, then the description needs also retrieved with requestSideEffects */
      const textPath = isPathAnnotationExpression(targetProperty === null || targetProperty === void 0 ? void 0 : (_targetProperty$annot3 = targetProperty.annotations) === null || _targetProperty$annot3 === void 0 ? void 0 : (_targetProperty$annot4 = _targetProperty$annot3.Common) === null || _targetProperty$annot4 === void 0 ? void 0 : _targetProperty$annot4.Text) ? targetProperty === null || targetProperty === void 0 ? void 0 : (_targetProperty$annot5 = targetProperty.annotations) === null || _targetProperty$annot5 === void 0 ? void 0 : (_targetProperty$annot6 = _targetProperty$annot5.Common) === null || _targetProperty$annot6 === void 0 ? void 0 : _targetProperty$annot6.Text.path : undefined;
      if (textPath !== undefined && contextCanRequestSideEffects) {
        const lastIndex = textPath.lastIndexOf("/");
        const sideEffectPath = lastIndex > 0 ? textPath.substring(0, lastIndex) : textPath;
        /* The sideEffectPath can be [<propertyName>] or [<navigationPath>] */
        context.requestSideEffects([sideEffectPath]);
      }
    },
    getFilterConditions: function (valueHelp, content, _config) {
      if (this.getInitialFilterConditions) {
        return this.getInitialFilterConditions(valueHelp, content, _config && _config.control || content && content.getControl());
      }
      return {};
    },
    /**
     * Callback invoked every time a {@link sap.ui.mdc.ValueHelp ValueHelp} fires a select event or the value of the corresponding field changes
     * This callback may be used to update external fields.
     *
     * @param valueHelp ValueHelp control instance receiving the <code>controlChange</code>
     * @param reason Reason why the method was invoked
     * @param _config Current configuration provided by the calling control
     * @since 1.101.0
     */
    onConditionPropagation: async function (valueHelp, reason, _config) {
      const payload = valueHelp.getPayload();
      if (reason !== "ControlChange" || payload.isDefineConditionValueHelp) {
        // handle only ControlChange reason
        // also don't handle for define condition value help as propagating conditions on the value help
        // to define conditions does not make sense but would only confuse users by allowing recursive use
        // of the condition value help
        return;
      }
      const qualifier = payload.qualifiers[payload.valueHelpQualifier];
      const outParameters = (qualifier === null || qualifier === void 0 ? void 0 : qualifier.vhParameters) !== undefined ? ValueListHelper.getOutParameters(qualifier.vhParameters) : [],
        field = valueHelp.getControl(),
        fieldParent = field.getParent();
      let conditions = field.getConditions();
      conditions = conditions.filter(function (condition) {
        const conditionPayloadMap = condition.payload || {};
        return conditionPayloadMap[payload.valueHelpQualifier];
      });
      const listReportFilterBar = valueHelp.getParent(); // Control e.g. FormContainer
      if (listReportFilterBar.isA(FeCoreControlsFilterBar)) {
        // Propagate the value only if the FilterField is part of the LR-FilterBar also inside in Adapt Filters dialog
        await this._onConditionPropagationToFilterBar(conditions, outParameters, fieldParent, payload, listReportFilterBar);
        // LR Settings Dialog or OP Settings Dialog shall not propagate value to the dialog filterfields or context
      } else {
        // Object Page
        /* To avoid timing issue we use the BindingContext of the control instead of the ValueHelp (BCP 2380057227) */
        const context = field.getBindingContext();
        if (context) {
          this._onConditionPropagationToBindingContext(conditions, outParameters, context, valueHelp);
        }
      }
    },
    _createInitialFilterCondition: function (value, initialValueFilterEmpty) {
      let condition;
      if (value === undefined || value === null) {
        Log.error("ValueHelpDelegate: value of the property could not be requested");
      } else if (value === "") {
        if (initialValueFilterEmpty) {
          condition = Condition.createCondition("Empty", [], null, null, ConditionValidated.Validated);
        }
      } else {
        condition = Condition.createCondition("EQ", [value], null, null, ConditionValidated.Validated);
      }
      return condition;
    },
    _getInitialFilterConditionsFromBinding: async function (inConditions, control, inParameters, payload) {
      const bindingContext = control.getBindingContext();
      if (!bindingContext) {
        Log.error("ValueHelpDelegate: No BindingContext");
        return inConditions;
      }
      let navPath = "";
      /* We need to request the in-parameter values relative to the binding context.
      In some cases (e.g. multi value field), the binding context does not point to the
      VH annotation target, thus we identify the needed navigation relation by
      reducing the payload.propertyPath by the path derived from binding context.
      This cannot happen in case of action parameter dialog, which can be identified by the path "$Parameter".
      */
      if (bindingContext.getBinding().getPath() !== "$Parameter") {
        var _control$getModel;
        const metaModel = (_control$getModel = control.getModel()) === null || _control$getModel === void 0 ? void 0 : _control$getModel.getMetaModel();
        const rootPath = metaModel.getMetaPath(bindingContext.getPath());
        navPath = payload.propertyPath.replace(rootPath + "/", "");
        const lastIndex = navPath.lastIndexOf("/");
        navPath = lastIndex > 0 ? `${navPath.substring(0, lastIndex)}/` : "";
      }
      const propertiesToRequest = inParameters.map(inParameter => navPath + inParameter.source);

      // According to odata v4 api documentation for requestProperty: Property values that are not cached yet are requested from the back end
      const values = await bindingContext.requestProperty(propertiesToRequest);
      for (let i = 0; i < inParameters.length; i++) {
        const inParameter = inParameters[i];
        const condition = this._createInitialFilterCondition(values[i], inParameter.initialValueFilterEmpty);
        if (condition) {
          inConditions[inParameter.helpPath] = [condition];
        }
      }
      return inConditions;
    },
    _getInitialFilterConditionsFromFilterBar: async function (inConditions, control, inParameters) {
      const filterBar = control.getParent();
      const state = await StateUtil.retrieveExternalState(filterBar);
      for (const inParameter of inParameters) {
        const conditions = this._getConditionsFromInParameter(inParameter, state);
        if (conditions) {
          inConditions[inParameter.helpPath] = conditions;
        }
      }
      return inConditions;
    },
    /**
     * Returns the filter conditions.
     * Regarding a navigation path in the InOut parameters and disregarding prefixes in the navigation path like e.g. '$filters>/conditions/' or 'owner'.
     *
     * @param inParameter InParmeter of the filter field value help
     * @param state The external filter state
     * @returns The filter conditions
     * @since 1.114.0
     */
    _getConditionsFromInParameter: function (inParameter, state) {
      const sourceField = inParameter.source;
      const key = Object.keys(state.filter).find(key => ("/" + sourceField).endsWith("/" + key)); //additional '/' to handle heading characters in the source name if there is no path
      return key && state.filter[key];
    },
    _partitionInParameters: function (inParameters) {
      const inParameterMap = {
        constant: [],
        binding: [],
        filter: []
      };
      for (const inParameter of inParameters) {
        if (inParameter.constantValue !== undefined) {
          inParameterMap.constant.push(inParameter);
        } else if (inParameter.source.indexOf("$filter") === 0) {
          inParameterMap.filter.push(inParameter);
        } else {
          inParameterMap.binding.push(inParameter);
        }
      }
      return inParameterMap;
    },
    _tableAfterRenderDelegate: {
      onAfterRendering: function (event) {
        const table = event.srcControl,
          // m.Table
          tableCellsDomRefs = table.$().find("tbody .sapMText"),
          mdcMTable = table.getParent();
        highlightDOMElements(tableCellsDomRefs, mdcMTable.getFilterValue(), true);
      }
    },
    /**
     * Provides an initial condition configuration everytime a value help content is shown.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content ValueHelp content requesting conditions configuration
     * @param control Instance of the calling control
     * @returns Returns a map of conditions suitable for a sap.ui.mdc.FilterBar control
     * @since 1.101.0
     */
    getInitialFilterConditions: async function (valueHelp, content, control) {
      // highlight text in ValueHelp popover
      if (content !== null && content !== void 0 && content.isA("sap.ui.mdc.valuehelp.content.MTable")) {
        const popoverTable = content.getTable();
        popoverTable === null || popoverTable === void 0 ? void 0 : popoverTable.removeEventDelegate(this._tableAfterRenderDelegate);
        popoverTable === null || popoverTable === void 0 ? void 0 : popoverTable.addEventDelegate(this._tableAfterRenderDelegate, this);
      }
      const payload = valueHelp.getPayload();
      const inConditions = {};

      // For define conditions valuehelp initial filter conditions are not supported, because the control of the define conditions
      // is cloned and not the original one to which field valuehelp was attached. And as a result we cannot get in parameter value. For simplicity
      // we just skip the rest of the code related to filter conditions.
      if (payload.isDefineConditionValueHelp) {
        return inConditions;
      }
      if (!control) {
        Log.error("ValueHelpDelegate: Control undefined");
        return inConditions;
      }
      const qualifier = payload.qualifiers[payload.valueHelpQualifier];
      const inParameters = (qualifier === null || qualifier === void 0 ? void 0 : qualifier.vhParameters) !== undefined ? ValueListHelper.getInParameters(qualifier.vhParameters) : [];
      const inParameterMap = this._partitionInParameters(inParameters);
      const isObjectPage = control.getBindingContext();
      for (const inParameter of inParameterMap.constant) {
        const condition = this._createInitialFilterCondition(inParameter.constantValue, isObjectPage ? inParameter.initialValueFilterEmpty : false // no filter with "empty" on ListReport
        );

        if (condition) {
          inConditions[inParameter.helpPath] = [condition];
        }
      }
      if (inParameterMap.binding.length) {
        await this._getInitialFilterConditionsFromBinding(inConditions, control, inParameterMap.binding, payload);
      }
      if (inParameterMap.filter.length) {
        await this._getInitialFilterConditionsFromFilterBar(inConditions, control, inParameterMap.filter);
      }
      return inConditions;
    },
    /**
     * Provides the possibility to convey custom data in conditions.
     * This enables an application to enhance conditions with data relevant for combined key or outparameter scenarios.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content ValueHelp content instance
     * @param _values Description pair for the condition which is to be created
     * @param context Optional additional context
     * @returns Optionally returns a serializable object to be stored in the condition payload field
     * @since 1.101.0
     */
    createConditionPayload: function (valueHelp, content, _values, context) {
      const payload = valueHelp.getPayload();
      const qualifier = payload.qualifiers[payload.valueHelpQualifier],
        entry = {},
        conditionPayload = {};
      const control = content.getControl();
      const isMultiValueField = control === null || control === void 0 ? void 0 : control.isA("sap.ui.mdc.MultiValueField");
      if (!qualifier.vhKeys || qualifier.vhKeys.length === 1 || isMultiValueField) {
        return undefined;
      }
      qualifier.vhKeys.forEach(function (vhKey) {
        const value = context.getObject(vhKey);
        if (value != null) {
          entry[vhKey] = (value === null || value === void 0 ? void 0 : value.length) === 0 ? "" : value;
        }
      });
      if (Object.keys(entry).length) {
        /* vh qualifier as key for relevant condition */
        conditionPayload[payload.valueHelpQualifier] = [entry];
      }
      return conditionPayload;
    },
    /**
     * Provides the possibility to customize selections in 'Select from list' scenarios.
     * By default, only condition keys are considered. This may be extended with payload dependent filters.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content ValueHelp content instance
     * @param item Entry of a given list
     * @param conditions Current conditions
     * @returns True, if item is selected
     * @since 1.101.0
     */
    isFilterableListItemSelected: function (valueHelp, content, item, conditions) {
      var _content$getConfig;
      //In value help dialogs of single value fields the row for the key shouldn´t be selected/highlight anymore BCP: 2270175246
      const payload = valueHelp.getPayload();
      if (payload.isValueListWithFixedValues !== true && ((_content$getConfig = content.getConfig()) === null || _content$getConfig === void 0 ? void 0 : _content$getConfig.maxConditions) === 1) {
        return false;
      }
      const context = item.getBindingContext();

      /* Do not consider "NotValidated" conditions */
      conditions = conditions.filter(condition => condition.validated === ConditionValidated.Validated);
      const selectedCondition = conditions.find(function (condition) {
        var _conditionPayloadMap$;
        const conditionPayloadMap = condition.payload,
          valueHelpQualifier = payload.valueHelpQualifier || "";
        if (!conditionPayloadMap && Object.keys(payload.qualifiers)[0] === valueHelpQualifier) {
          const keyPath = content.getKeyPath();
          return (context === null || context === void 0 ? void 0 : context.getObject(keyPath)) === (condition === null || condition === void 0 ? void 0 : condition.values[0]);
        }
        const conditionSelectedRow = (conditionPayloadMap === null || conditionPayloadMap === void 0 ? void 0 : (_conditionPayloadMap$ = conditionPayloadMap[valueHelpQualifier]) === null || _conditionPayloadMap$ === void 0 ? void 0 : _conditionPayloadMap$[0]) || {},
          selectedKeys = Object.keys(conditionSelectedRow);
        if (selectedKeys.length) {
          return selectedKeys.every(function (key) {
            return conditionSelectedRow[key] === (context === null || context === void 0 ? void 0 : context.getObject(key));
          });
        }
        return false;
      });
      return selectedCondition ? true : false;
    },
    /**
     * Creates contexts for additional values and resumes the list binding.
     *
     * @param payload Payload for delegate
     * @param listBinding List binding
     * @param bindingInfo The binding info object to be used to bind the list to the model
     * @param additionalValues Array of AdditionalValues
     */
    _updateBindingForRecommendations: async function (payload, listBinding, bindingInfo, additionalValues) {
      let updateBindingDonePromiseResolve;
      //create a promise to make sure checkListBindingPending is only completed once this promise is resolved
      payload.updateBindingDonePromise = new Promise(function (resolve) {
        updateBindingDonePromiseResolve = resolve;
      });
      try {
        //sort and filter valuehelpbinding to make sure we render others group
        additionalValueHelper.sortAndFilterOthers(listBinding, bindingInfo, additionalValues);
        //resume the list binding and then reset the changes
        additionalValueHelper.resumeValueListBindingAndResetChanges(listBinding);
        //fetch the contexts of additionalvalues
        const additionalValueContextData = await additionalValueHelper.requestForAdditionalValueContextData(additionalValues, listBinding, bindingInfo);
        //remove duplicate values from different groups of additionalvalues
        const uniqueAdditionalValues = additionalValueHelper.removeDuplicateAdditionalValues(additionalValueContextData, [...additionalValues]);
        // add transient context to list binding after backend query is done
        additionalValueHelper.createAdditionalValueTransientContexts(additionalValueContextData, uniqueAdditionalValues.reverse(), listBinding);
      } catch (error) {
        //Do nothing as we know that reset changes would throw an error in console and this will pile up a lot of console errors
      }
      if (updateBindingDonePromiseResolve) {
        //resolve the promise as everything is completed
        updateBindingDonePromiseResolve(true);
      }
    },
    /**
     * Executes a filter in a <code>ListBinding</code> and resumes it, if suspended.
     *
     * @param listBinding List binding
     * @param bindingInfo The binding info object to be used to bind the list to the model
     */
    _updateBinding: async function (listBinding, bindingInfo) {
      const rootBinding = listBinding.getRootBinding() || listBinding;
      if (!rootBinding.isSuspended()) {
        rootBinding.suspend();
      }
      if (bindingInfo.parameters) {
        listBinding.changeParameters(bindingInfo.parameters);
      }
      listBinding.filter(bindingInfo.filters, FilterType.Application);
      listBinding.sort(bindingInfo.sorter);
      if (rootBinding.isSuspended()) {
        rootBinding.resume();
        rootBinding.resetChanges();
      }
    },
    /**
     * Returns an boolean value if additionalvalues exists which will contain different groups like recommendations.
     *
     * @param content Filterable List Content
     * @param payload Payload for delegate
     * @returns Boolean value
     */
    checkIfAdditionalValuesExists: function (content, payload) {
      var _content$getControl$g2;
      // For define conditions valuehelp recommendations are not supported because "internal" model is not available.
      if (payload.isDefineConditionValueHelp) {
        return false;
      }
      const bindingContext = content.getBindingContext();
      //get the recommendation data from the internal model
      const inputValues = content.getModel("internal").getProperty("/recommendationsData") || {};
      //Fetch the relevant recommendations based on the inputvalues and bindingcontext
      const values = additionalValueHelper.getRelevantRecommendations(inputValues, bindingContext, payload.propertyPath, (_content$getControl$g2 = content.getControl().getBinding("value")) === null || _content$getControl$g2 === void 0 ? void 0 : _content$getControl$g2.getPath()) || [];
      if ((values === null || values === void 0 ? void 0 : values.length) > 0) {
        //if there are relevant recommendations then return true
        return true;
      }
      return false;
    },
    /**
     * Returns a boolean value which will tell whether typeahead should be opened or not.
     *
     * @param valueHelp The <code>ValueHelp</code> instance
     * @param content Filterable List Content
     * @returns Boolean value whether to show typeahead or not
     */
    showTypeahead: function (valueHelp, content) {
      if (!content.getControl().isA("sap.ui.mdc.FilterField") && !content.getControl().isA("sap.ui.mdc.MultiValueField")) {
        var _content$getControl, _content$getControl2;
        const filterValue = content === null || content === void 0 ? void 0 : content.getFilterValue();
        const vhValue = content === null || content === void 0 ? void 0 : (_content$getControl = content.getControl()) === null || _content$getControl === void 0 ? void 0 : _content$getControl.getValue();
        const fieldTextValue = content === null || content === void 0 ? void 0 : (_content$getControl2 = content.getControl()) === null || _content$getControl2 === void 0 ? void 0 : _content$getControl2.getAdditionalValue();
        if (vhValue || fieldTextValue) {
          // valuehelp had some value, but user cleared the value
          // in such case we get input value as '' and we will return false
          //Note: In SDs usecase we wanted to open the typeAhead if there are recommendations and value is blank, they should pass us a flag so that we can handle this accordingly
          return content.getControl().hasPendingUserInput() && (filterValue !== "" || this.checkIfAdditionalValuesExists(content, valueHelp.getPayload()));
        } else {
          //if valuehelp value is not there and there is filter value then user is typing and we return true else we would only open
          //if it is recommendation relevant field
          if (filterValue) {
            return true;
          }
          return this.checkIfAdditionalValuesExists(content, valueHelp.getPayload());
        }
      }
      return true;
    },
    getFirstMatch: function (oValueHelp, oContent, oConfig) {
      // FIXME workaround until BCP 2370124674 is fixed
      if (oContent.isA("sap.ui.mdc.valuehelp.content.MTable")) {
        const oListBinding = oContent.getListBinding();
        return oListBinding.getAllCurrentContexts()[0];
      }
      return ValueHelpDelegate.getFirstMatch(oValueHelp, oContent, oConfig);
    }
  });
}, false);
