/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ModelHelper", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/ui/core/Core"], function (Log, ModelHelper, ValueListHelper, Core) {
  "use strict";

  const MassEditHandlers = {
    /**
     * Called for property change in the transient context.
     *
     * @param newValue New value of the property.
     * @param dataProperty Final context returned after the paginator action
     * @param mdcFieldId Final context returned after the paginator action
     */
    contextPropertyChange: function (newValue, dataProperty, mdcFieldId) {
      // Called for
      // 1. Out Parameters.
      // 2. Transient context property change.

      const source = Core.byId(mdcFieldId);
      const transCtx = source && source.getBindingContext();
      const fieldInfoModel = source && source.getModel("fieldsInfo");
      const values = fieldInfoModel.getProperty(`/values/${dataProperty}`) || fieldInfoModel.getProperty(`/unitData/${dataProperty}`) || [];
      if (transCtx && (values.inputType === "InputWithValueHelp" || values.inputType === "InputWithUnit") && !values.valueListInfo) {
        MassEditHandlers._setValueListInfo(transCtx, source, fieldInfoModel, dataProperty);
      }
      const isDialogOpen = fieldInfoModel && fieldInfoModel.getProperty("/isOpen");
      if (!isDialogOpen || !source.getVisible()) {
        return;
      }
      MassEditHandlers._updateSelectKey(source, dataProperty, newValue);
    },
    /**
     * Called for change in the MDC field.
     * This is called on selection done through VHD.
     * This is not called on change of the dropdown as we are using a custom MassEditSelect control and not general Select.
     *
     * @param event Event object for change.
     * @param propertyName Property path.
     */
    handleMDCFieldChange: function (event, propertyName) {
      // Called for
      // 1. VHD property change.

      const source = event && event.getSource();
      const changePromise = event && event.getParameter("promise");
      const comboBox = source.getContent();
      if (!comboBox || !propertyName) {
        return;
      }
      changePromise.then(MassEditHandlers._updateSelectKeyForMDCFieldChange.bind(MassEditHandlers, source, propertyName)).catch(err => {
        Log.warning(`VHD selection couldn't be populated in the mass edit field.${err}`);
      });
    },
    /**
     * Called for selection change through the drop down.
     *
     * @param event Event object for change.
     */
    handleSelectionChange: function (event) {
      // Called for Manual selection from dropdown(comboBox or select)
      // 1. VHD select.
      // 2. Any value change in the control.

      const source = event && event.getSource();
      const key = source.getSelectedKey();
      const params = source && key && key.split("/");
      let propertyName;
      if (params[0] === "UseValueHelpValue") {
        const prevItem = event.getParameter("previousSelectedItem");
        const selectKey = prevItem.getKey();
        propertyName = params.slice(1).join("/");
        MassEditHandlers._onVHSelect(source, propertyName, selectKey);
        return;
      }
      const fieldInfoModel = source && source.getModel("fieldsInfo");
      propertyName = MassEditHandlers._getPropertyNameFromKey(key);
      MassEditHandlers._updateSuggestionForFieldsWithInParameters(fieldInfoModel, propertyName, key.startsWith("Default/") || key.startsWith("ClearFieldValue/"), true);
      MassEditHandlers._updateSuggestionForFieldsWithOutParameters(fieldInfoModel, propertyName, key.startsWith("Default/") || key.startsWith("ClearFieldValue/"), false);
      MassEditHandlers._updateResults(source, params, true);
    },
    /**
     * Update selections to results and the suggests in drop downs.
     *
     * @param source MDC field that was changed.
     * @param propertyName Property path.
     * @param value New value.
     */
    _updateSelectKeyForMDCFieldChange: function (source, propertyName, value) {
      const transCtx = source && source.getBindingContext();
      const fieldInfoModel = source && source.getModel("fieldsInfo");
      const values = fieldInfoModel.getProperty(`/values/${propertyName}`) || fieldInfoModel.getProperty(`/unitData/${propertyName}`) || [];
      if (transCtx && (values.inputType === "InputWithValueHelp" || values.inputType === "InputWithUnit") && !values.valueListInfo) {
        MassEditHandlers._setValueListInfo(transCtx, source, fieldInfoModel, propertyName);
      }
      MassEditHandlers._updateSuggestionForFieldsWithOutParameters(fieldInfoModel, propertyName, false, true);
      MassEditHandlers._updateSuggestionForFieldsWithInParameters(fieldInfoModel, propertyName, false, true);
      const formattedValue = source.getFormFormattedValue();
      MassEditHandlers._updateSelectKey(source, propertyName, value, formattedValue);
    },
    /**
     * Update suggests for all drop downs with InParameter as the propertyName.
     *
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param propertyName Property path.
     * @param resetValues Should the values be reset to original state.
     * @param keepExistingSelection Should the existing selection before update remain.
     */
    _updateSuggestionForFieldsWithInParameters: function (fieldInfoModel, propertyName, resetValues, keepExistingSelection) {
      const values = fieldInfoModel.getProperty("/values");
      const unitData = fieldInfoModel.getProperty("/unitData");
      const fieldPaths = Object.keys(values);
      const unitFieldPaths = Object.keys(unitData);
      fieldPaths.forEach(MassEditHandlers._updateInParameterSuggetions.bind(MassEditHandlers, fieldInfoModel, "/values/", propertyName, resetValues, keepExistingSelection));
      unitFieldPaths.forEach(MassEditHandlers._updateInParameterSuggetions.bind(MassEditHandlers, fieldInfoModel, "/unitData/", propertyName, resetValues, keepExistingSelection));
    },
    /**
     * Update suggests for a drop down with InParameter as the srcPropertyName.
     *
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param pathPrefix Path in the runtime model.
     * @param srcPropertyName The InParameter Property path.
     * @param resetValues Should the values be reset to original state.
     * @param keepExistingSelection Should the existing selection before update remain.
     * @param propertyName Property path that needs update of suggestions.
     */
    _updateInParameterSuggetions: function (fieldInfoModel, pathPrefix, srcPropertyName, resetValues, keepExistingSelection, propertyName) {
      const valueListInfo = fieldInfoModel.getProperty(`${pathPrefix + propertyName}/valueListInfo`);
      if (valueListInfo && srcPropertyName != propertyName) {
        const inParameters = valueListInfo.inParameters;
        if (inParameters && inParameters.length > 0 && inParameters.includes(srcPropertyName)) {
          MassEditHandlers._updateFieldPathSuggestions(fieldInfoModel, pathPrefix + propertyName, resetValues, keepExistingSelection);
        }
      }
    },
    /**
     * Update suggests for all OutParameter's drop downs of the propertyName.
     *
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param propertyName Property path.
     * @param resetValues Should the values be reset to original state.
     * @param keepExistingSelection Should the existing selection before update remain.
     */
    _updateSuggestionForFieldsWithOutParameters: function (fieldInfoModel, propertyName, resetValues, keepExistingSelection) {
      const valueListInfo = fieldInfoModel.getProperty(`/values/${propertyName}/valueListInfo`) || fieldInfoModel.getProperty(`/unitData/${propertyName}/valueListInfo`);
      if (valueListInfo && valueListInfo.outParameters) {
        const outParameters = valueListInfo.outParameters;
        if (outParameters.length && outParameters.length > 0) {
          MassEditHandlers._updateOutParameterSuggetions(outParameters, fieldInfoModel, resetValues, keepExistingSelection);
          const pathPrefix = fieldInfoModel.getProperty(`/values/${propertyName}`) && `/values/${propertyName}` || fieldInfoModel.getProperty(`/unitData/${propertyName}`) && `/unitData/${propertyName}`;
          if (pathPrefix) {
            MassEditHandlers._updateFieldPathSuggestions(fieldInfoModel, pathPrefix, false, true);
          }
        }
      }
    },
    /**
     * Update suggests for a drop down with InParameter as the srcPropertyName.
     *
     * @param outParameters String arrary of OutParameter property paths.
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param resetValues Should the values be reset to original state.
     * @param keepExistingSelection Should the existing selection before update remain.
     */
    _updateOutParameterSuggetions: function (outParameters, fieldInfoModel, resetValues, keepExistingSelection) {
      const values = fieldInfoModel.getProperty("/values");
      const unitData = fieldInfoModel.getProperty("/unitData");
      const fieldPaths = Object.keys(values);
      const unitFieldPaths = Object.keys(unitData);
      outParameters.forEach(outParameter => {
        if (fieldPaths.includes(outParameter)) {
          MassEditHandlers._updateFieldPathSuggestions(fieldInfoModel, `/values/${outParameter}`, resetValues, keepExistingSelection);
        } else if (unitFieldPaths.includes(outParameter)) {
          MassEditHandlers._updateFieldPathSuggestions(fieldInfoModel, `/unitData/${outParameter}`, resetValues, keepExistingSelection);
        }
      });
    },
    /**
     * Update suggests for a drop down of a field.
     *
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param fieldPathAbsolute Complete runtime property path.
     * @param resetValues Should the values be reset to original state.
     * @param keepExistingSelection Should the existing selection before update remain.
     */
    _updateFieldPathSuggestions: function (fieldInfoModel, fieldPathAbsolute, resetValues, keepExistingSelection) {
      const options = fieldInfoModel.getProperty(fieldPathAbsolute);
      const defaultOptions = options.defaultOptions;
      const selectedKey = fieldInfoModel.getProperty(`${fieldPathAbsolute}/selectedKey`);
      const existingSelection = keepExistingSelection && options.find(option => option.key === selectedKey);
      if (resetValues) {
        const selectOptions = options.selectOptions;
        options.length = 0;
        defaultOptions.forEach(defaultOption => options.push(defaultOption));
        selectOptions.forEach(selectOption => options.push(selectOption));
      } else {
        options.length = 0;
        defaultOptions.forEach(defaultOption => options.push(defaultOption));
      }
      fieldInfoModel.setProperty(fieldPathAbsolute, options);
      if (existingSelection && !options.includes(existingSelection)) {
        options.push(existingSelection);
        fieldInfoModel.setProperty(`${fieldPathAbsolute}/selectedKey`, selectedKey);
      }
    },
    /**
     * Update In and Out Parameters in the MED.
     *
     * @param transCtx The transient context of the MED.
     * @param source MDC field.
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param propertyName Property path.
     */
    _setValueListInfo: function (transCtx, source, fieldInfoModel, propertyName) {
      const propPath = fieldInfoModel.getProperty(`/values/${propertyName}`) && "/values/" || fieldInfoModel.getProperty(`/unitData/${propertyName}`) && "/unitData/";
      if (fieldInfoModel.getProperty(`${propPath}${propertyName}/valueListInfo`)) {
        return;
      }
      const valueListInfo = fieldInfoModel.getProperty(`${propPath}${propertyName}/valueListInfo`);
      if (!valueListInfo) {
        MassEditHandlers._requestValueList(transCtx, source, fieldInfoModel, propertyName);
      }
    },
    /**
     * Request and update In and Out Parameters in the MED.
     *
     * @param transCtx The transient context of the MED.
     * @param source MDC field.
     * @param fieldInfoModel Runtime model with parameters store information.
     * @param propertyName Property path.
     */
    _requestValueList: function (transCtx, source, fieldInfoModel, propertyName) {
      var _fieldValueHelp$getDe;
      const metaPath = ModelHelper.getMetaPathForContext(transCtx);
      const propertyPath = metaPath && `${metaPath}/${propertyName}`;
      const dependents = source === null || source === void 0 ? void 0 : source.getDependents();
      const valueHelp = source === null || source === void 0 ? void 0 : source.getValueHelp();
      const fieldValueHelp = dependents === null || dependents === void 0 ? void 0 : dependents.find(dependent => dependent.getId() === valueHelp);
      const payload = (_fieldValueHelp$getDe = fieldValueHelp.getDelegate()) === null || _fieldValueHelp$getDe === void 0 ? void 0 : _fieldValueHelp$getDe.payload;
      if (!(fieldValueHelp !== null && fieldValueHelp !== void 0 && fieldValueHelp.getBindingContext())) {
        fieldValueHelp === null || fieldValueHelp === void 0 ? void 0 : fieldValueHelp.setBindingContext(transCtx);
      }
      const metaModel = transCtx.getModel().getMetaModel();
      ValueListHelper.createVHUIModel(fieldValueHelp, propertyPath, metaModel);
      const valueListInfo = ValueListHelper.getValueListInfo(fieldValueHelp, propertyPath, payload, metaModel);
      valueListInfo.then(vLinfos => {
        const vLinfo = vLinfos[0];
        const propPath = fieldInfoModel.getProperty(`/values/${propertyName}`) && "/values/" || fieldInfoModel.getProperty(`/unitData/${propertyName}`) && "/unitData/";
        const info = {
          inParameters: vLinfo.vhParameters && ValueListHelper.getInParameters(vLinfo.vhParameters).map(inParam => inParam.helpPath),
          outParameters: vLinfo.vhParameters && ValueListHelper.getOutParameters(vLinfo.vhParameters).map(outParam => outParam.helpPath)
        };
        fieldInfoModel.setProperty(`${propPath}${propertyName}/valueListInfo`, info);
        if (info.outParameters.length > 0) {
          MassEditHandlers._updateFieldPathSuggestions(fieldInfoModel, `/values/${propertyName}`, false, true);
        }
      }).catch(() => {
        Log.warning(`Mass Edit: Couldn't load valueList info for ${propertyPath}`);
      });
    },
    /**
     * Get field help control from MDC field.
     *
     * @param transCtx The transient context of the MED.
     * @param source MDC field.
     * @returns Field Help control.
     */
    _getValueHelp: function (transCtx, source) {
      const dependents = source === null || source === void 0 ? void 0 : source.getDependents();
      const valueHelp = source === null || source === void 0 ? void 0 : source.getValueHelp();
      return dependents === null || dependents === void 0 ? void 0 : dependents.find(dependent => dependent.getId() === valueHelp);
    },
    /**
     * Colled on drop down selection of VHD option.
     *
     * @param source Custom Mass Edit Select control.
     * @param propertyName Property path.
     * @param selectKey Previous key before the VHD was selected.
     */
    _onVHSelect: function (source, propertyName, selectKey) {
      // Called for
      // 1. VHD selected.

      const fieldInfoModel = source && source.getModel("fieldsInfo");
      const propPath = fieldInfoModel.getProperty(`/values/${propertyName}`) && "/values/" || fieldInfoModel.getProperty(`/unitData/${propertyName}`) && "/unitData/";
      const transCtx = source.getBindingContext();
      const fieldValueHelp = MassEditHandlers._getValueHelp(transCtx, source.getParent());
      if (!(fieldValueHelp !== null && fieldValueHelp !== void 0 && fieldValueHelp.getBindingContext())) {
        fieldValueHelp === null || fieldValueHelp === void 0 ? void 0 : fieldValueHelp.setBindingContext(transCtx);
      }
      source.fireValueHelpRequest();
      fieldInfoModel.setProperty(`${propPath + propertyName}/selectedKey`, selectKey);
    },
    /**
     * Gets Property name from selection key.
     *
     * @param key Selection key.
     * @returns Property name.
     */
    _getPropertyNameFromKey: function (key) {
      let propertyName = "";
      if (key.startsWith("Default/") || key.startsWith("ClearFieldValue/") || key.startsWith("UseValueHelpValue/")) {
        propertyName = key.substring(key.indexOf("/") + 1);
      } else {
        propertyName = key.substring(0, key.lastIndexOf("/"));
      }
      return propertyName;
    },
    /**
     * Update selection to Custom Mass Edit Select from MDC field.
     *
     * @param source MDC field.
     * @param propertyName Property path.
     * @param value Value to update.
     * @param fullText Full text to use.
     */
    _updateSelectKey: function (source, propertyName, value, fullText) {
      // Called for
      // 1. VHD property change
      // 2. Out Parameters.
      // 3. Transient context property change.

      const comboBox = source.getContent();
      if (!comboBox || !propertyName) {
        return;
      }
      let key = comboBox.getSelectedKey();
      if ((key.startsWith("Default/") || key.startsWith("ClearFieldValue/")) && !value) {
        return;
      }
      const formattedText = MassEditHandlers._valueExists(fullText) ? fullText : value;
      const fieldInfoModel = source && source.getModel("fieldsInfo");
      const values = fieldInfoModel.getProperty(`/values/${propertyName}`) || fieldInfoModel.getProperty(`/unitData/${propertyName}`) || [];
      const propPath = fieldInfoModel.getProperty(`/values/${propertyName}`) && "/values/" || fieldInfoModel.getProperty(`/unitData/${propertyName}`) && "/unitData/";
      const relatedField = values.find(fieldData => {
        var _fieldData$textInfo;
        return (fieldData === null || fieldData === void 0 ? void 0 : (_fieldData$textInfo = fieldData.textInfo) === null || _fieldData$textInfo === void 0 ? void 0 : _fieldData$textInfo.value) === value || fieldData.text === value;
      });
      if (relatedField) {
        if (fullText && relatedField.textInfo && relatedField.textInfo.descriptionPath && (relatedField.text != formattedText || relatedField.textInfo.fullText != formattedText)) {
          // Update the full text only when provided.
          relatedField.text = formattedText;
          relatedField.textInfo.fullText = formattedText;
          relatedField.textInfo.description = source.getAdditionalValue();
        }
        if (relatedField.key === key) {
          fieldInfoModel.setProperty(`${propPath + propertyName}/selectedKey`, key);
          return;
        }
        key = relatedField.key;
      } else if (![undefined, null, ""].includes(value)) {
        key = `${propertyName}/${value}`;
        const selectionInfo = {
          text: formattedText,
          key,
          textInfo: {
            description: source.getAdditionalValue(),
            descriptionPath: values && values.textInfo && values.textInfo.descriptionPath,
            fullText: formattedText,
            textArrangement: source.getDisplay(),
            value: source.getValue(),
            valuePath: propertyName
          }
        };
        values.push(selectionInfo);
        values.selectOptions = values.selectOptions || [];
        values.selectOptions.push(selectionInfo);
        fieldInfoModel.setProperty(propPath + propertyName, values);
      } else {
        key = `Default/${propertyName}`;
      }
      fieldInfoModel.setProperty(`${propPath + propertyName}/selectedKey`, key);
      MassEditHandlers._updateResults(comboBox);
    },
    /**
     * Get Value from Drop down.
     *
     * @param source Drop down control.
     * @returns Value of selection.
     */
    _getValue: function (source) {
      var _getSelectedItem;
      return source.getMetadata().getName() === "sap.fe.core.controls.MassEditSelect" ? (_getSelectedItem = source.getSelectedItem()) === null || _getSelectedItem === void 0 ? void 0 : _getSelectedItem.getText() : source.getValue();
    },
    _getValueOnEmpty: function (oSource, fieldsInfoModel, value, sPropertyName) {
      if (!value) {
        const values = fieldsInfoModel.getProperty(`/values/${sPropertyName}`) || fieldsInfoModel.getProperty(`/unitData/${sPropertyName}`) || [];
        if (values.unitProperty) {
          value = 0;
          oSource.setValue(value);
        } else if (values.inputType === "CheckBox") {
          value = false;
        }
      }
      return value;
    },
    _valueExists: function (value) {
      return value != undefined && value != null;
    },
    /**
     * Updates selections to runtime model.
     *
     * @param oSource Drop down control.
     * @param aParams Parts of key in runtime model.
     * @param updateTransCtx Should transient context be updated with the value.
     */
    _updateResults: function (oSource) {
      let aParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      let updateTransCtx = arguments.length > 2 ? arguments[2] : undefined;
      // Called for
      // 1. VHD property change.
      // 2. Out parameter.
      // 3. transient context property change.
      const fieldsInfoModel = oSource && oSource.getModel("fieldsInfo");
      const oFieldsInfoData = fieldsInfoModel && fieldsInfoModel.getData();
      let value = MassEditHandlers._getValue(oSource);
      aParams = aParams.length > 0 ? aParams : oSource && oSource.getSelectedKey() && oSource.getSelectedKey().split("/");
      let oDataObject;
      const sPropertyName = oSource.data("fieldPath");
      const propertyFullyQualifiedName = oSource.data("propertyFullyQualifiedName");
      if (aParams[0] === "Default") {
        oDataObject = {
          keyValue: aParams[1],
          propertyFullyQualifiedName,
          value: aParams[0]
        };
      } else if (aParams[0] === "ClearFieldValue") {
        value = "";
        value = MassEditHandlers._getValueOnEmpty(oSource, fieldsInfoModel, value, sPropertyName);
        oDataObject = {
          keyValue: aParams[1],
          propertyFullyQualifiedName,
          value: value
        };
      } else if (!aParams) {
        value = MassEditHandlers._getValueOnEmpty(oSource, fieldsInfoModel, value, sPropertyName);
        oDataObject = {
          keyValue: sPropertyName,
          propertyFullyQualifiedName,
          value: value
        };
      } else {
        const propertyName = aParams.slice(0, -1).join("/");
        const propertyValues = fieldsInfoModel.getProperty(`/values/${propertyName}`) || fieldsInfoModel.getProperty(`/unitData/${propertyName}`) || [];
        const relatedField = (propertyValues || []).find(function (oFieldData) {
          var _oFieldData$textInfo;
          return (oFieldData === null || oFieldData === void 0 ? void 0 : (_oFieldData$textInfo = oFieldData.textInfo) === null || _oFieldData$textInfo === void 0 ? void 0 : _oFieldData$textInfo.value) === value || oFieldData.text === value;
        });
        oDataObject = {
          keyValue: propertyName,
          propertyFullyQualifiedName,
          value: relatedField.textInfo && MassEditHandlers._valueExists(relatedField.textInfo.value) ? relatedField.textInfo.value : relatedField.text
        };
      }
      let bExistingElementindex = -1;
      for (let i = 0; i < oFieldsInfoData.results.length; i++) {
        if (oFieldsInfoData.results[i].keyValue === oDataObject.keyValue) {
          bExistingElementindex = i;
        }
      }
      if (bExistingElementindex !== -1) {
        oFieldsInfoData.results[bExistingElementindex] = oDataObject;
      } else {
        oFieldsInfoData.results.push(oDataObject);
      }
      if (updateTransCtx && !oDataObject.keyValue.includes("/")) {
        const transCtx = oSource.getBindingContext();
        if (aParams[0] === "Default" || aParams[0] === "ClearFieldValue") {
          transCtx.setProperty(oDataObject.keyValue, null);
        } else if (oDataObject) {
          transCtx.setProperty(oDataObject.keyValue, oDataObject.value);
        }
      }
    }
  };
  return MassEditHandlers;
}, false);