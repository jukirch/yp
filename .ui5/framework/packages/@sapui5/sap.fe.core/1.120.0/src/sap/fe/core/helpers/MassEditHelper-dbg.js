/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateModel", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/library", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/table/TableHelper", "sap/m/Button", "sap/m/Dialog", "sap/m/MessageToast", "sap/ui/core/Core", "sap/ui/core/Fragment", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/enums/FieldEditMode", "sap/ui/model/json/JSONModel", "../controllerextensions/messageHandler/messageHandling", "../controls/Any", "../converters/MetaModelConverter", "../templating/FieldControlHelper", "../templating/UIFormatters"], function (Log, CommonUtils, TemplateModel, DataField, BindingToolkit, TypeGuards, FELibrary, DataModelPathHelper, PropertyHelper, FieldTemplating, TableHelper, Button, Dialog, MessageToast, Core, Fragment, XMLTemplateProcessor, XMLPreprocessor, FieldEditMode, JSONModel, messageHandling, Any, MetaModelConverter, FieldControlHelper, UIFormatters) {
  "use strict";

  var isMultiValueField = UIFormatters.isMultiValueField;
  var getRequiredExpression = UIFormatters.getRequiredExpression;
  var getEditMode = UIFormatters.getEditMode;
  var isReadOnlyExpression = FieldControlHelper.isReadOnlyExpression;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var setEditStyleProperties = FieldTemplating.setEditStyleProperties;
  var getTextBinding = FieldTemplating.getTextBinding;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var hasUnit = PropertyHelper.hasUnit;
  var hasCurrency = PropertyHelper.hasCurrency;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var isDataFieldForIntentBasedNavigation = DataField.isDataFieldForIntentBasedNavigation;
  var isDataFieldForAnnotation = DataField.isDataFieldForAnnotation;
  var isDataFieldForAction = DataField.isDataFieldForAction;
  const MassEditHelper = {
    /**
     * Initializes the value at final or deepest level path with a blank array.
     * Return an empty array pointing to the final or deepest level path.
     *
     * @param sPath Property path
     * @param aValues Array instance where the default data needs to be added
     * @returns The final path
     */
    initLastLevelOfPropertyPath: function (sPath, aValues) {
      let aFinalPath;
      let index = 0;
      const aPaths = sPath.split("/");
      let sFullPath = "";
      aPaths.forEach(function (sPropertyPath) {
        if (!aValues[sPropertyPath] && index === 0) {
          aValues[sPropertyPath] = {};
          aFinalPath = aValues[sPropertyPath];
          sFullPath = sFullPath + sPropertyPath;
          index++;
        } else if (!aFinalPath[sPropertyPath]) {
          sFullPath = `${sFullPath}/${sPropertyPath}`;
          if (sFullPath !== sPath) {
            aFinalPath[sPropertyPath] = {};
            aFinalPath = aFinalPath[sPropertyPath];
          } else {
            aFinalPath[sPropertyPath] = [];
          }
        }
      });
      return aFinalPath;
    },
    /**
     * Method to get unique values for given array values.
     *
     * @param sValue Property value
     * @param index Index of the property value
     * @param self Instance of the array
     * @returns The unique value
     */
    getUniqueValues: function (sValue, index, self) {
      return sValue != undefined && sValue != null ? self.indexOf(sValue) === index : undefined;
    },
    /**
     * Gets the property value for a multi-level path (for example: _Materials/Material_Details gets the value of Material_Details under _Materials Object).
     * Returns the propertyValue, which can be of any type (string, number, etc..).
     *
     * @param sDataPropertyPath Property path
     * @param oValues Object of property values
     * @returns The property value
     */
    getValueForMultiLevelPath: function (sDataPropertyPath, oValues) {
      let result;
      if (sDataPropertyPath && sDataPropertyPath.indexOf("/") > 0) {
        const aPropertyPaths = sDataPropertyPath.split("/");
        aPropertyPaths.forEach(function (sPath) {
          result = oValues && oValues[sPath] ? oValues[sPath] : result && result[sPath];
        });
      }
      return result;
    },
    /**
     * Gets the key path for the key of a combo box that must be selected initially when the dialog opens:
     * => If propertyValue for all selected contexts is different, then < Keep Existing Values > is preselected.
     * => If propertyValue for all selected contexts is the same, then the propertyValue is preselected.
     * => If propertyValue for all selected contexts is empty, then < Leave Blank > is preselected.
     *
     *
     * @param aContexts Contexts for mass edit
     * @param sDataPropertyPath Data property path
     * @returns The key path
     */
    getDefaultSelectionPathComboBox: function (aContexts, sDataPropertyPath) {
      let result;
      if (sDataPropertyPath && aContexts.length > 0) {
        const oSelectedContext = aContexts,
          aPropertyValues = [];
        oSelectedContext.forEach(function (oContext) {
          const oDataObject = oContext.getObject();
          const sMultiLevelPathCondition = sDataPropertyPath.includes("/") && oDataObject.hasOwnProperty(sDataPropertyPath.split("/")[0]);
          if (oContext && (oDataObject.hasOwnProperty(sDataPropertyPath) || sMultiLevelPathCondition)) {
            aPropertyValues.push(oContext.getObject(sDataPropertyPath));
          }
        });
        const aUniquePropertyValues = aPropertyValues.filter(MassEditHelper.getUniqueValues);
        if (aUniquePropertyValues.length > 1) {
          result = `Default/${sDataPropertyPath}`;
        } else if (aUniquePropertyValues.length === 0) {
          result = `Empty/${sDataPropertyPath}`;
        } else if (aUniquePropertyValues.length === 1) {
          result = `${sDataPropertyPath}/${aUniquePropertyValues[0]}`;
        }
      }
      return result;
    },
    /**
     * Checks hidden annotation value [both static and path based] for table's selected context.
     *
     * @param hiddenValue Hidden annotation value / path for field
     * @param aContexts Contexts for mass edit
     * @returns The hidden annotation value
     */
    getHiddenValueForContexts: function (hiddenValue, aContexts) {
      if (hiddenValue && hiddenValue.$Path) {
        return !aContexts.some(function (oSelectedContext) {
          return oSelectedContext.getObject(hiddenValue.$Path) === false;
        });
      }
      return hiddenValue;
    },
    getInputType: function (propertyInfo, dataFieldConverted, oDataModelPath) {
      const editStyleProperties = {};
      let inputType;
      if (propertyInfo) {
        setEditStyleProperties(editStyleProperties, dataFieldConverted, oDataModelPath, true);
        inputType = (editStyleProperties === null || editStyleProperties === void 0 ? void 0 : editStyleProperties.editStyle) || "";
      }
      const isValidForMassEdit = inputType && !["DatePicker", "TimePicker", "DateTimePicker", "RatingIndicator"].includes(inputType) && !isMultiValueField(oDataModelPath) && !hasValueHelpWithFixedValues(propertyInfo);
      return (isValidForMassEdit || "") && inputType;
    },
    getIsFieldGrp: function (dataFieldConverted) {
      return dataFieldConverted && dataFieldConverted.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && dataFieldConverted.Target && dataFieldConverted.Target.value && dataFieldConverted.Target.value.indexOf("FieldGroup") > -1;
    },
    /**
     * Get text path for the mass edit field.
     *
     * @param property Property path
     * @param textBinding Text Binding Info
     * @param displayMode Display mode
     * @returns Text Property Path if it exists
     */
    getTextPath: function (property, textBinding, displayMode) {
      let descriptionPath;
      if (textBinding && (textBinding.path || textBinding.parameters && textBinding.parameters.length) && property) {
        if (textBinding.path && displayMode === "Description") {
          descriptionPath = textBinding.path;
        } else if (textBinding.parameters) {
          textBinding.parameters.forEach(function (props) {
            if (props.path && props.path !== property) {
              descriptionPath = props.path;
            }
          });
        }
      }
      return descriptionPath;
    },
    /**
     * Initializes a JSON Model for properties of dialog fields [label, visiblity, dataproperty, etc.].
     *
     * @param oTable Instance of Table
     * @param aContexts Contexts for mass edit
     * @param aDataArray Array containing data related to the dialog used by both the static and the runtime model
     * @returns The model
     */
    prepareDataForDialog: function (oTable, aContexts, aDataArray) {
      const oMetaModel = oTable && oTable.getModel().getMetaModel(),
        sCurrentEntitySetName = oTable.data("metaPath"),
        aTableFields = MassEditHelper.getTableFields(oTable),
        oEntityTypeContext = oMetaModel.getContext(`${sCurrentEntitySetName}/@`),
        oEntitySetContext = oMetaModel.getContext(sCurrentEntitySetName),
        oDataModelObjectPath = getInvolvedDataModelObjects(oEntityTypeContext);
      const oDataFieldModel = new JSONModel();
      let oResult;
      let sLabelText;
      let bValueHelpEnabled;
      let sUnitPropertyPath;
      let bValueHelpEnabledForUnit;
      let oTextBinding;
      aTableFields.forEach(function (oColumnInfo) {
        if (!oColumnInfo.annotationPath) {
          return;
        }
        const sDataPropertyPath = oColumnInfo.dataProperty;
        if (sDataPropertyPath) {
          var _oDataFieldConverted$, _oDataFieldConverted$2, _oPropertyInfo, _oPropertyInfo$annota, _oPropertyInfo$annota2, _unitPropertyInfo$ann, _unitPropertyInfo$ann2;
          let oPropertyInfo = sDataPropertyPath && oMetaModel.getObject(`${sCurrentEntitySetName}/${sDataPropertyPath}@`);
          sLabelText = oColumnInfo.label || oPropertyInfo && oPropertyInfo["@com.sap.vocabularies.Common.v1.Label"] || sDataPropertyPath;
          if (oDataModelObjectPath) {
            oDataModelObjectPath.targetObject = oDataModelObjectPath.targetEntityType.entityProperties.filter(function (oProperty) {
              return oProperty.name === sDataPropertyPath;
            });
          }
          oDataModelObjectPath.targetObject = oDataModelObjectPath.targetObject[0] || {};
          oTextBinding = getTextBinding(oDataModelObjectPath, {}, true) || {};
          const oFieldContext = oMetaModel.getContext(oColumnInfo.annotationPath),
            oDataFieldConverted = convertMetaModelContext(oFieldContext),
            oPropertyContext = oMetaModel.getContext(`${sCurrentEntitySetName}/${sDataPropertyPath}@`),
            oInterface = oPropertyContext && oPropertyContext.getInterface();
          let oDataModelPath = getInvolvedDataModelObjects(oFieldContext, oEntitySetContext);
          if (isDataFieldTypes(oDataFieldConverted) && (oDataFieldConverted === null || oDataFieldConverted === void 0 ? void 0 : (_oDataFieldConverted$ = oDataFieldConverted.Value) === null || _oDataFieldConverted$ === void 0 ? void 0 : (_oDataFieldConverted$2 = _oDataFieldConverted$.path) === null || _oDataFieldConverted$2 === void 0 ? void 0 : _oDataFieldConverted$2.length) > 0) {
            oDataModelPath = enhanceDataModelPath(oDataModelPath, sDataPropertyPath);
          }
          const bHiddenField = MassEditHelper.getHiddenValueForContexts(oFieldContext && oFieldContext.getObject()["@com.sap.vocabularies.UI.v1.Hidden"], aContexts) || false;
          const isImage = oPropertyInfo && oPropertyInfo["@com.sap.vocabularies.UI.v1.IsImageURL"];
          oInterface.context = {
            getModel: function () {
              return oInterface.getModel();
            },
            getPath: function () {
              return `${sCurrentEntitySetName}/${sDataPropertyPath}`;
            }
          };
          if (isProperty(oDataFieldConverted)) {
            oPropertyInfo = oDataFieldConverted;
          } else if (isDataFieldTypes(oDataFieldConverted)) {
            var _oDataFieldConverted$3;
            oPropertyInfo = oDataFieldConverted === null || oDataFieldConverted === void 0 ? void 0 : (_oDataFieldConverted$3 = oDataFieldConverted.Value) === null || _oDataFieldConverted$3 === void 0 ? void 0 : _oDataFieldConverted$3.$target;
          } else if (isDataFieldForAnnotation(oDataFieldConverted)) {
            var _oDataFieldConverted$4;
            oPropertyInfo = oDataFieldConverted === null || oDataFieldConverted === void 0 ? void 0 : (_oDataFieldConverted$4 = oDataFieldConverted.Target) === null || _oDataFieldConverted$4 === void 0 ? void 0 : _oDataFieldConverted$4.$target;
          } else {
            oPropertyInfo = undefined;
          }
          // Datafield is not included in the FieldControl calculation, needs to be implemented

          const chartProperty = oPropertyInfo && oPropertyInfo.term && oPropertyInfo.term === "com.sap.vocabularies.UI.v1.Chart";
          const isAction = (isDataFieldForAction(oDataFieldConverted) || isDataFieldForIntentBasedNavigation(oDataFieldConverted)) && !!oDataFieldConverted.Action;
          const isFieldGrp = MassEditHelper.getIsFieldGrp(oDataFieldConverted);
          if (isImage || bHiddenField || chartProperty || isAction || isFieldGrp) {
            return;
          }

          // ValueHelp properties
          sUnitPropertyPath = (hasCurrency(oPropertyInfo) || hasUnit(oPropertyInfo)) && getAssociatedUnitPropertyPath(oPropertyInfo) || "";
          const unitPropertyInfo = sUnitPropertyPath && getAssociatedUnitProperty(oPropertyInfo);
          bValueHelpEnabled = hasValueHelp(oPropertyInfo);
          bValueHelpEnabledForUnit = unitPropertyInfo && hasValueHelp(unitPropertyInfo);
          const hasContextDependentVH = (bValueHelpEnabled || bValueHelpEnabledForUnit) && (((_oPropertyInfo = oPropertyInfo) === null || _oPropertyInfo === void 0 ? void 0 : (_oPropertyInfo$annota = _oPropertyInfo.annotations) === null || _oPropertyInfo$annota === void 0 ? void 0 : (_oPropertyInfo$annota2 = _oPropertyInfo$annota.Common) === null || _oPropertyInfo$annota2 === void 0 ? void 0 : _oPropertyInfo$annota2.ValueListRelevantQualifiers) || unitPropertyInfo && (unitPropertyInfo === null || unitPropertyInfo === void 0 ? void 0 : (_unitPropertyInfo$ann = unitPropertyInfo.annotations) === null || _unitPropertyInfo$ann === void 0 ? void 0 : (_unitPropertyInfo$ann2 = _unitPropertyInfo$ann.Common) === null || _unitPropertyInfo$ann2 === void 0 ? void 0 : _unitPropertyInfo$ann2.ValueListRelevantQualifiers));
          if (hasContextDependentVH) {
            // context dependent VH is not supported for Mass Edit.
            return;
          }

          // EditMode and InputType
          const propertyForFieldControl = oPropertyInfo && oPropertyInfo.Value ? oPropertyInfo.Value : oPropertyInfo;
          const expBinding = getEditMode(propertyForFieldControl, oDataModelPath, false, false, oDataFieldConverted, constant(true));
          const editModeValues = Object.keys(FieldEditMode);
          const editModeIsStatic = !!expBinding && editModeValues.includes(expBinding);
          const editable = !!expBinding && (editModeIsStatic && expBinding === FieldEditMode.Editable || !editModeIsStatic);
          const navPropertyWithValueHelp = sDataPropertyPath.includes("/") && bValueHelpEnabled;
          if (!editable || navPropertyWithValueHelp) {
            return;
          }
          const inputType = MassEditHelper.getInputType(oPropertyInfo, oDataFieldConverted, oDataModelPath);
          if (inputType) {
            const relativePath = getRelativePaths(oDataModelPath);
            const isReadOnly = isReadOnlyExpression(oPropertyInfo, relativePath);
            const displayMode = CommonUtils.computeDisplayMode(oPropertyContext.getObject());
            const isValueHelpEnabled = bValueHelpEnabled ? bValueHelpEnabled : false;
            const isValueHelpEnabledForUnit = bValueHelpEnabledForUnit && !sUnitPropertyPath.includes("/") ? bValueHelpEnabledForUnit : false;
            const unitProperty = sUnitPropertyPath && !sDataPropertyPath.includes("/") ? sUnitPropertyPath : false;
            oResult = {
              label: sLabelText,
              dataProperty: sDataPropertyPath,
              isValueHelpEnabled: bValueHelpEnabled ? bValueHelpEnabled : false,
              unitProperty,
              isFieldRequired: getRequiredExpression(oPropertyInfo, oDataFieldConverted, true, false, {}, oDataModelPath),
              defaultSelectionPath: sDataPropertyPath ? MassEditHelper.getDefaultSelectionPathComboBox(aContexts, sDataPropertyPath) : false,
              defaultSelectionUnitPath: sUnitPropertyPath ? MassEditHelper.getDefaultSelectionPathComboBox(aContexts, sUnitPropertyPath) : false,
              entitySet: sCurrentEntitySetName,
              display: displayMode,
              descriptionPath: MassEditHelper.getTextPath(sDataPropertyPath, oTextBinding, displayMode),
              nullable: oPropertyInfo.nullable !== undefined ? oPropertyInfo.nullable : true,
              isPropertyReadOnly: isReadOnly !== undefined ? isReadOnly : false,
              inputType: inputType,
              editMode: editable ? expBinding : undefined,
              propertyInfo: {
                hasVH: isValueHelpEnabled,
                runtimePath: "fieldsInfo>/values/",
                relativePath: sDataPropertyPath,
                propertyFullyQualifiedName: oPropertyInfo.fullyQualifiedName,
                propertyPathForValueHelp: `${sCurrentEntitySetName}/${sDataPropertyPath}`
              },
              unitInfo: unitProperty && {
                hasVH: isValueHelpEnabledForUnit,
                runtimePath: "fieldsInfo>/unitData/",
                relativePath: unitProperty,
                propertyPathForValueHelp: `${sCurrentEntitySetName}/${unitProperty}`
              }
            };
            aDataArray.push(oResult);
          }
        }
      });
      oDataFieldModel.setData(aDataArray);
      return oDataFieldModel;
    },
    getTableFields: function (oTable) {
      const aColumns = oTable && oTable.getColumns() || [];
      const columnsData = oTable && oTable.getParent().getTableDefinition().columns;
      return aColumns.map(function (oColumn) {
        const sDataProperty = oColumn && oColumn.getDataProperty(),
          aRealtedColumnInfo = columnsData && columnsData.filter(function (oColumnInfo) {
            return oColumnInfo.name === sDataProperty && oColumnInfo.type === "Annotation";
          });
        return {
          dataProperty: sDataProperty,
          label: oColumn.getHeader(),
          annotationPath: aRealtedColumnInfo && aRealtedColumnInfo[0] && aRealtedColumnInfo[0].annotationPath
        };
      });
    },
    getDefaultTextsForDialog: function (oResourceBundle, iSelectedContexts, oTable) {
      // The confirm button text is "Save" for table in Display mode and "Apply" for table in edit mode. This can be later exposed if needed.
      const bDisplayMode = oTable.data("displayModePropertyBinding") === "true";
      return {
        keepExistingPrefix: "< Keep",
        leaveBlankValue: "< Leave Blank >",
        clearFieldValue: "< Clear Values >",
        massEditTitle: oResourceBundle.getText("C_MASS_EDIT_DIALOG_TITLE", iSelectedContexts.toString()),
        applyButtonText: bDisplayMode ? oResourceBundle.getText("C_MASS_EDIT_SAVE_BUTTON_TEXT") : oResourceBundle.getText("C_MASS_EDIT_APPLY_BUTTON_TEXT"),
        useValueHelpValue: "< Use Value Help >",
        cancelButtonText: oResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
        noFields: oResourceBundle.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS"),
        okButtonText: oResourceBundle.getText("C_COMMON_DIALOG_OK")
      };
    },
    /**
     * Adds a suffix to the 'keep existing' property of the comboBox.
     *
     * @param sInputType InputType of the field
     * @returns The modified string
     */
    // getSuffixForKeepExisiting: function (sInputType: string) {
    // 	let sResult = "Values";

    // 	switch (sInputType) {
    // 		//TODO - Add for other control types as well (Radio Button, Email, Input, MDC Fields, Image etc.)
    // 		case "DatePicker":
    // 			sResult = "Dates";
    // 			break;
    // 		case "CheckBox":
    // 			sResult = "Settings";
    // 			break;
    // 		default:
    // 			sResult = "Values";
    // 	}
    // 	return sResult;
    // },

    /**
     * Adds default values to the model [Keep Existing Values, Leave Blank].
     *
     * @param aValues Array instance where the default data needs to be added
     * @param oDefaultValues Default values from Application Manifest
     * @param oPropertyInfo Property information
     * @param bUOMField
     */
    setDefaultValuesToDialog: function (aValues, oDefaultValues, oPropertyInfo, bUOMField) {
      const sPropertyPath = bUOMField ? oPropertyInfo.unitProperty : oPropertyInfo.dataProperty,
        sInputType = oPropertyInfo.inputType,
        bPropertyRequired = oPropertyInfo.isFieldRequired;
      // const sSuffixForKeepExisting = MassEditHelper.getSuffixForKeepExisiting(sInputType);
      const sSuffixForKeepExisting = "Values";
      aValues.defaultOptions = aValues.defaultOptions || [];
      const selectOptionsExist = aValues.selectOptions && aValues.selectOptions.length > 0;
      const keepEntry = {
        text: `${oDefaultValues.keepExistingPrefix} ${sSuffixForKeepExisting} >`,
        key: `Default/${sPropertyPath}`
      };
      if (sInputType === "CheckBox") {
        const falseEntry = {
          text: "No",
          key: `${sPropertyPath}/false`,
          textInfo: {
            value: false
          }
        };
        const truthyEntry = {
          text: "Yes",
          key: `${sPropertyPath}/true`,
          textInfo: {
            value: true
          }
        };
        aValues.unshift(falseEntry);
        aValues.defaultOptions.unshift(falseEntry);
        aValues.unshift(truthyEntry);
        aValues.defaultOptions.unshift(truthyEntry);
        aValues.unshift(keepEntry);
        aValues.defaultOptions.unshift(keepEntry);
      } else {
        var _oPropertyInfo$proper, _oPropertyInfo$unitIn;
        if (oPropertyInfo !== null && oPropertyInfo !== void 0 && (_oPropertyInfo$proper = oPropertyInfo.propertyInfo) !== null && _oPropertyInfo$proper !== void 0 && _oPropertyInfo$proper.hasVH || oPropertyInfo !== null && oPropertyInfo !== void 0 && (_oPropertyInfo$unitIn = oPropertyInfo.unitInfo) !== null && _oPropertyInfo$unitIn !== void 0 && _oPropertyInfo$unitIn.hasVH && bUOMField) {
          const vhdEntry = {
            text: oDefaultValues.useValueHelpValue,
            key: `UseValueHelpValue/${sPropertyPath}`
          };
          aValues.unshift(vhdEntry);
          aValues.defaultOptions.unshift(vhdEntry);
        }
        if (selectOptionsExist) {
          if (bPropertyRequired !== "true" && !bUOMField) {
            const clearEntry = {
              text: oDefaultValues.clearFieldValue,
              key: `ClearFieldValue/${sPropertyPath}`
            };
            aValues.unshift(clearEntry);
            aValues.defaultOptions.unshift(clearEntry);
          }
          aValues.unshift(keepEntry);
          aValues.defaultOptions.unshift(keepEntry);
        } else {
          const emptyEntry = {
            text: oDefaultValues.leaveBlankValue,
            key: `Default/${sPropertyPath}`
          };
          aValues.unshift(emptyEntry);
          aValues.defaultOptions.unshift(emptyEntry);
        }
      }
    },
    /**
     * Get text arrangement info for a context property.
     *
     * @param property Property Path
     * @param descriptionPath Path to text association of the property
     * @param displayMode Display mode of the property and text association
     * @param selectedContext Context to find the full text
     * @returns The text arrangement
     */
    getTextArrangementInfo: function (property, descriptionPath, displayMode, selectedContext) {
      let value = selectedContext.getObject(property),
        descriptionValue,
        fullText;
      if (descriptionPath && property) {
        switch (displayMode) {
          case "Description":
            descriptionValue = selectedContext.getObject(descriptionPath) || "";
            fullText = descriptionValue;
            break;
          case "Value":
            value = selectedContext.getObject(property) || "";
            fullText = value;
            break;
          case "ValueDescription":
            value = selectedContext.getObject(property) || "";
            descriptionValue = selectedContext.getObject(descriptionPath) || "";
            fullText = descriptionValue ? `${value} (${descriptionValue})` : value;
            break;
          case "DescriptionValue":
            value = selectedContext.getObject(property) || "";
            descriptionValue = selectedContext.getObject(descriptionPath) || "";
            fullText = descriptionValue ? `${descriptionValue} (${value})` : value;
            break;
          default:
            Log.info(`Display Property not applicable: ${property}`);
            break;
        }
      }
      return {
        textArrangement: displayMode,
        valuePath: property,
        descriptionPath: descriptionPath,
        value: value,
        description: descriptionValue,
        fullText: fullText
      };
    },
    /**
     * Return the visibility valuue for the ManagedObject Any.
     *
     * @param any The ManagedObject Any to be used to calculate the visible value of the binding.
     * @returns Returns true if the mass edit field is editable.
     */
    isEditable: function (any) {
      const binding = any.getBinding("any");
      const value = binding.getExternalValue();
      return value === FieldEditMode.Editable;
    },
    /**
     * Calculate and update the visibility of mass edit field on change of the ManagedObject Any binding.
     *
     * @param oDialogDataModel Model to be used runtime.
     * @param dataProperty Field name.
     */
    onContextEditableChange: function (oDialogDataModel, dataProperty) {
      const objectsForVisibility = oDialogDataModel.getProperty(`/values/${dataProperty}/objectsForVisibility`) || [];
      const editable = objectsForVisibility.some(MassEditHelper.isEditable);
      if (editable) {
        oDialogDataModel.setProperty(`/values/${dataProperty}/visible`, editable);
      }
    },
    /**
     * Update Managed Object Any for visibility of the mass edit fields.
     *
     * @param mOToUse The ManagedObject Any to be used to calculate the visible value of the binding.
     * @param oDialogDataModel Model to be used runtime.
     * @param dataProperty Field name.
     * @param values Values of the field.
     */
    updateOnContextChange: function (mOToUse, oDialogDataModel, dataProperty, values) {
      const binding = mOToUse.getBinding("any");
      values.objectsForVisibility = values.objectsForVisibility || [];
      values.objectsForVisibility.push(mOToUse);
      binding === null || binding === void 0 ? void 0 : binding.attachChange(MassEditHelper.onContextEditableChange.bind(null, oDialogDataModel, dataProperty));
    },
    /**
     * Get bound object to calculate the visibility of contexts.
     *
     * @param expBinding Binding String object.
     * @param context Context the binding value.
     * @returns The ManagedObject Any to be used to calculate the visible value of the binding.
     */
    getBoundObject: function (expBinding, context) {
      const mOToUse = new Any({
        any: expBinding
      });
      const model = context.getModel();
      mOToUse.setModel(model);
      mOToUse.setBindingContext(context);
      return mOToUse;
    },
    /**
     * Get the visibility of the field.
     *
     * @param expBinding Binding String object.
     * @param oDialogDataModel Model to be used runtime.
     * @param dataProperty Field name.
     * @param values Values of the field.
     * @param context Context the binding value.
     * @returns Returns true if the mass edit field is editable.
     */
    getFieldVisiblity: function (expBinding, oDialogDataModel, dataProperty, values, context) {
      const mOToUse = MassEditHelper.getBoundObject(expBinding, context);
      const isContextEditable = MassEditHelper.isEditable(mOToUse);
      if (!isContextEditable) {
        MassEditHelper.updateOnContextChange(mOToUse, oDialogDataModel, dataProperty, values);
      }
      return isContextEditable;
    },
    /**
     * Initializes a runtime model:
     * => The model consists of values shown in the comboBox of the dialog (Leave Blank, Keep Existing Values, or any property value for the selected context, etc.)
     * => The model will capture runtime changes in the results property (the value entered in the comboBox).
     *
     * @param aContexts Contexts for mass edit
     * @param aDataArray Array containing data related to the dialog used by both the static and the runtime model
     * @param oDefaultValues Default values from i18n
     * @param dialogContext Transient context for mass edit dialog.
     * @returns The runtime model
     */
    setRuntimeModelOnDialog: function (aContexts, aDataArray, oDefaultValues, dialogContext) {
      const aValues = [];
      const aUnitData = [];
      const aResults = [];
      const textPaths = [];
      const aReadOnlyFieldInfo = [];
      const oData = {
        values: aValues,
        unitData: aUnitData,
        results: aResults,
        readablePropertyData: aReadOnlyFieldInfo,
        selectedKey: undefined,
        textPaths: textPaths,
        noFields: oDefaultValues.noFields
      };
      const oDialogDataModel = new JSONModel(oData);
      aDataArray.forEach(function (oInData) {
        let oTextInfo;
        let sPropertyKey;
        let sUnitPropertyName;
        const oDistinctValueMap = {};
        const oDistinctUnitMap = {};
        if (oInData.dataProperty && oInData.dataProperty.indexOf("/") > -1) {
          const aFinalPath = MassEditHelper.initLastLevelOfPropertyPath(oInData.dataProperty, aValues /*, dialogContext */);
          const aPropertyPaths = oInData.dataProperty.split("/");
          for (const context of aContexts) {
            const sMultiLevelPathValue = context.getObject(oInData.dataProperty);
            sPropertyKey = `${oInData.dataProperty}/${sMultiLevelPathValue}`;
            if (!oDistinctValueMap[sPropertyKey] && aFinalPath[aPropertyPaths[aPropertyPaths.length - 1]]) {
              oTextInfo = MassEditHelper.getTextArrangementInfo(oInData.dataProperty, oInData.descriptionPath, oInData.display, context);
              aFinalPath[aPropertyPaths[aPropertyPaths.length - 1]].push({
                text: oTextInfo && oTextInfo.fullText || sMultiLevelPathValue,
                key: sPropertyKey,
                textInfo: oTextInfo
              });
              oDistinctValueMap[sPropertyKey] = sMultiLevelPathValue;
            }
          }
          // if (Object.keys(oDistinctValueMap).length === 1) {
          // 	dialogContext.setProperty(oData.dataProperty, sPropertyKey && oDistinctValueMap[sPropertyKey]);
          // }

          aFinalPath[aPropertyPaths[aPropertyPaths.length - 1]].textInfo = {
            descriptionPath: oInData.descriptionPath,
            valuePath: oInData.dataProperty,
            displayMode: oInData.display
          };
        } else {
          aValues[oInData.dataProperty] = aValues[oInData.dataProperty] || [];
          aValues[oInData.dataProperty]["selectOptions"] = aValues[oInData.dataProperty]["selectOptions"] || [];
          if (oInData.unitProperty) {
            aUnitData[oInData.unitProperty] = aUnitData[oInData.unitProperty] || [];
            aUnitData[oInData.unitProperty]["selectOptions"] = aUnitData[oInData.unitProperty]["selectOptions"] || [];
          }
          for (const context of aContexts) {
            const oDataObject = context.getObject();
            sPropertyKey = `${oInData.dataProperty}/${oDataObject[oInData.dataProperty]}`;
            if (oInData.dataProperty && oDataObject[oInData.dataProperty] && !oDistinctValueMap[sPropertyKey]) {
              if (oInData.inputType != "CheckBox") {
                oTextInfo = MassEditHelper.getTextArrangementInfo(oInData.dataProperty, oInData.descriptionPath, oInData.display, context);
                const entry = {
                  text: oTextInfo && oTextInfo.fullText || oDataObject[oInData.dataProperty],
                  key: sPropertyKey,
                  textInfo: oTextInfo
                };
                aValues[oInData.dataProperty].push(entry);
                aValues[oInData.dataProperty]["selectOptions"].push(entry);
              }
              oDistinctValueMap[sPropertyKey] = oDataObject[oInData.dataProperty];
            }
            if (oInData.unitProperty && oDataObject[oInData.unitProperty]) {
              sUnitPropertyName = `${oInData.unitProperty}/${oDataObject[oInData.unitProperty]}`;
              if (!oDistinctUnitMap[sUnitPropertyName]) {
                if (oInData.inputType != "CheckBox") {
                  oTextInfo = MassEditHelper.getTextArrangementInfo(oInData.unitProperty, oInData.descriptionPath, oInData.display, context);
                  const unitEntry = {
                    text: oTextInfo && oTextInfo.fullText || oDataObject[oInData.unitProperty],
                    key: sUnitPropertyName,
                    textInfo: oTextInfo
                  };
                  aUnitData[oInData.unitProperty].push(unitEntry);
                  aUnitData[oInData.unitProperty]["selectOptions"].push(unitEntry);
                }
                oDistinctUnitMap[sUnitPropertyName] = oDataObject[oInData.unitProperty];
              }
            }
          }
          aValues[oInData.dataProperty].textInfo = {
            descriptionPath: oInData.descriptionPath,
            valuePath: oInData.dataProperty,
            displayMode: oInData.display
          };
          if (Object.keys(oDistinctValueMap).length === 1) {
            dialogContext.setProperty(oInData.dataProperty, sPropertyKey && oDistinctValueMap[sPropertyKey]);
          }
          if (Object.keys(oDistinctUnitMap).length === 1) {
            dialogContext.setProperty(oInData.unitProperty, sUnitPropertyName && oDistinctUnitMap[sUnitPropertyName]);
          }
        }
        textPaths[oInData.dataProperty] = oInData.descriptionPath ? [oInData.descriptionPath] : [];
      });
      aDataArray.forEach(function (oInData) {
        let values = {};
        if (oInData.dataProperty.indexOf("/") > -1) {
          const sMultiLevelPropPathValue = MassEditHelper.getValueForMultiLevelPath(oInData.dataProperty, aValues);
          if (!sMultiLevelPropPathValue) {
            sMultiLevelPropPathValue.push({
              text: oDefaultValues.leaveBlankValue,
              key: `Empty/${oInData.dataProperty}`
            });
          } else {
            MassEditHelper.setDefaultValuesToDialog(sMultiLevelPropPathValue, oDefaultValues, oInData);
          }
          values = sMultiLevelPropPathValue;
        } else if (aValues[oInData.dataProperty]) {
          aValues[oInData.dataProperty] = aValues[oInData.dataProperty] || [];
          MassEditHelper.setDefaultValuesToDialog(aValues[oInData.dataProperty], oDefaultValues, oInData);
          values = aValues[oInData.dataProperty];
        }
        if (aUnitData[oInData.unitProperty] && aUnitData[oInData.unitProperty].length) {
          MassEditHelper.setDefaultValuesToDialog(aUnitData[oInData.unitProperty], oDefaultValues, oInData, true);
          aUnitData[oInData.unitProperty].textInfo = {};
          aUnitData[oInData.unitProperty].selectedKey = MassEditHelper.getDefaultSelectionPathComboBox(aContexts, oInData.unitProperty);
          aUnitData[oInData.unitProperty].inputType = oInData.inputType;
        } else if (oInData.dataProperty && aValues[oInData.dataProperty] && !aValues[oInData.dataProperty].length || oInData.unitProperty && aUnitData[oInData.unitProperty] && !aUnitData[oInData.unitProperty].length) {
          const bClearFieldOrBlankValueExists = aValues[oInData.dataProperty] && aValues[oInData.dataProperty].some(function (obj) {
            return obj.text === "< Clear Values >" || obj.text === "< Leave Blank >";
          });
          if (oInData.dataProperty && !bClearFieldOrBlankValueExists) {
            aValues[oInData.dataProperty].push({
              text: oDefaultValues.leaveBlankValue,
              key: `Empty/${oInData.dataProperty}`
            });
          }
          const bClearFieldOrBlankUnitValueExists = aUnitData[oInData.unitProperty] && aUnitData[oInData.unitProperty].some(function (obj) {
            return obj.text === "< Clear Values >" || obj.text === "< Leave Blank >";
          });
          if (oInData.unitProperty) {
            if (!bClearFieldOrBlankUnitValueExists) {
              aUnitData[oInData.unitProperty].push({
                text: oDefaultValues.leaveBlankValue,
                key: `Empty/${oInData.unitProperty}`
              });
            }
            aUnitData[oInData.unitProperty].textInfo = {};
            aUnitData[oInData.unitProperty].selectedKey = MassEditHelper.getDefaultSelectionPathComboBox(aContexts, oInData.unitProperty);
            aUnitData[oInData.unitProperty].inputType = oInData.inputType;
          }
        }
        if (oInData.isPropertyReadOnly && typeof oInData.isPropertyReadOnly === "boolean") {
          aReadOnlyFieldInfo.push({
            property: oInData.dataProperty,
            value: oInData.isPropertyReadOnly,
            type: "Default"
          });
        } else if (oInData.isPropertyReadOnly && oInData.isPropertyReadOnly.operands && oInData.isPropertyReadOnly.operands[0] && oInData.isPropertyReadOnly.operands[0].operand1 && oInData.isPropertyReadOnly.operands[0].operand2) {
          // This needs to be refactored in accordance with the ReadOnlyExpression change
          aReadOnlyFieldInfo.push({
            property: oInData.dataProperty,
            propertyPath: oInData.isPropertyReadOnly.operands[0].operand1.path,
            propertyValue: oInData.isPropertyReadOnly.operands[0].operand2.value,
            type: "Path"
          });
        }

        // Setting visbility of the mass edit field.
        if (oInData.editMode) {
          values.visible = oInData.editMode === FieldEditMode.Editable || aContexts.some(MassEditHelper.getFieldVisiblity.bind(MassEditHelper, oInData.editMode, oDialogDataModel, oInData.dataProperty, values));
        } else {
          values.visible = true;
        }
        values.selectedKey = MassEditHelper.getDefaultSelectionPathComboBox(aContexts, oInData.dataProperty);
        values.inputType = oInData.inputType;
        values.unitProperty = oInData.unitProperty;
      });
      return oDialogDataModel;
    },
    /**
     * Gets transient context for dialog.
     *
     * @param table Instance of Table.
     * @param dialog Mass Edit Dialog.
     * @returns Promise returning instance of dialog.
     */
    getDialogContext: function (table, dialog) {
      let transCtx = dialog === null || dialog === void 0 ? void 0 : dialog.getBindingContext();
      if (!transCtx) {
        const model = table.getModel();
        const listBinding = table.getRowBinding();
        const transientListBinding = model.bindList(listBinding.getPath(), listBinding.getContext(), [], [], {
          $$updateGroupId: "submitLater"
        });
        transientListBinding.refreshInternal = function () {
          /* */
        };
        transCtx = transientListBinding.create({}, true);
      }
      return transCtx;
    },
    onDialogOpen: function (event) {
      const source = event.getSource();
      const fieldsInfoModel = source.getModel("fieldsInfo");
      fieldsInfoModel.setProperty("/isOpen", true);
    },
    closeDialog: function (oDialog) {
      oDialog.close();
      oDialog.destroy();
    },
    messageHandlingForMassEdit: async function (oTable, aContexts, oController, oInDialog, aResults, errorContexts) {
      var _oController$getView, _oController$getView$, _oController$getView4, _oController$getView5;
      const DraftStatus = FELibrary.DraftStatus;
      const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
      (_oController$getView = oController.getView()) === null || _oController$getView === void 0 ? void 0 : (_oController$getView$ = _oController$getView.getBindingContext("internal")) === null || _oController$getView$ === void 0 ? void 0 : _oController$getView$.setProperty("getBoundMessagesForMassEdit", true);
      oController.messageHandler.showMessages({
        onBeforeShowMessage: function (messages, showMessageParameters) {
          //messages.concatenate(messageHandling.getMessages(true, true));
          showMessageParameters.fnGetMessageSubtitle = messageHandling.setMessageSubtitle.bind({}, oTable, aContexts);
          const unboundErrors = [];
          messages.forEach(function (message) {
            if (!message.getTarget()) {
              unboundErrors.push(message);
            }
          });
          if (aResults.length > 0 && errorContexts.length === 0) {
            oController.editFlow.setDraftStatus(DraftStatus.Saved);
            const successToast = oResourceBundle.getText("C_MASS_EDIT_SUCCESS_TOAST");
            MessageToast.show(successToast);
          } else if (errorContexts.length < oTable.getSelectedContexts().length) {
            oController.editFlow.setDraftStatus(DraftStatus.Saved);
          } else if (errorContexts.length === oTable.getSelectedContexts().length) {
            oController.editFlow.setDraftStatus(DraftStatus.Clear);
          }
          if (oController.getModel("ui").getProperty("/isEditable") && unboundErrors.length === 0) {
            showMessageParameters.showMessageBox = false;
            showMessageParameters.showMessageDialog = false;
          }
          return showMessageParameters;
        }
      });
      if (oInDialog.isOpen()) {
        var _oController$getView2, _oController$getView3;
        MassEditHelper.closeDialog(oInDialog);
        (_oController$getView2 = oController.getView()) === null || _oController$getView2 === void 0 ? void 0 : (_oController$getView3 = _oController$getView2.getBindingContext("internal")) === null || _oController$getView3 === void 0 ? void 0 : _oController$getView3.setProperty("skipPatchHandlers", false);
      }
      (_oController$getView4 = oController.getView()) === null || _oController$getView4 === void 0 ? void 0 : (_oController$getView5 = _oController$getView4.getBindingContext("internal")) === null || _oController$getView5 === void 0 ? void 0 : _oController$getView5.setProperty("getBoundMessagesForMassEdit", false);
    },
    /**
     * This function generates side effects map from side effects ids(which is a combination of entity type and qualifier).
     *
     * @param oEntitySetContext
     * @param appComponent
     * @param oController
     * @param aResults
     * @returns Side effect map with data.
     */
    getSideEffectDataForKey: function (entitySetContext, appComponent, controller, results) {
      const ownerEntityType = entitySetContext.getProperty("$Type");
      const baseSideEffectsMapArray = {};
      results.forEach(result => {
        const fieldGroupIds = appComponent.getSideEffectsService().computeFieldGroupIds(ownerEntityType, result.propertyFullyQualifiedName ?? "") ?? [];
        baseSideEffectsMapArray[result.keyValue] = controller._sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds);
      });
      return baseSideEffectsMapArray;
    },
    /**
     * Give the entity type for a given spath for e.g.RequestedQuantity.
     *
     * @param sPath
     * @param sEntityType
     * @param oMetaModel
     * @returns Object having entity, spath and navigation path.
     */
    fnGetPathForSourceProperty: function (sPath, sEntityType, oMetaModel) {
      // if the property path has a navigation, get the target entity type of the navigation
      const sNavigationPath = sPath.indexOf("/") > 0 ? "/" + sEntityType + "/" + sPath.substr(0, sPath.lastIndexOf("/") + 1) + "@sapui.name" : false,
        pOwnerEntity = !sNavigationPath ? Promise.resolve(sEntityType) : oMetaModel.requestObject(sNavigationPath);
      sPath = sNavigationPath ? sPath.substr(sPath.lastIndexOf("/") + 1) : sPath;
      return {
        sPath,
        pOwnerEntity,
        sNavigationPath
      };
    },
    fnGetEntityTypeOfOwner: function (oMetaModel, baseNavPath, oEntitySetContext, targetEntity, aTargets) {
      const ownerEntityType = oEntitySetContext.getProperty("$Type");
      const {
        $Type: pOwner,
        $Partner: ownerNavPath
      } = oMetaModel.getObject(`${oEntitySetContext}/${baseNavPath}`); // nav path
      if (ownerNavPath) {
        const entityObjOfOwnerPartner = oMetaModel.getObject(`/${pOwner}/${ownerNavPath}`);
        if (entityObjOfOwnerPartner) {
          const entityTypeOfOwnerPartner = entityObjOfOwnerPartner["$Type"];
          // if the entity types defer, then base nav path is not from owner
          if (entityTypeOfOwnerPartner !== ownerEntityType) {
            // if target Prop is not from owner, we add it as immediate
            aTargets.push(targetEntity);
          }
        }
      } else {
        // if there is no $Partner attribute, it may not be from owner
        aTargets.push(targetEntity);
      }
      return aTargets;
    },
    /**
     * Give targets that are immediate or deferred based on the entity type of that target.
     *
     *
     * @param sideEffectsData
     * @param oEntitySetContext
     * @param sEntityType
     * @param oMetaModel
     * @returns Targets to request side effects.
     */
    fnGetTargetsForMassEdit: function (sideEffectsData, oEntitySetContext, sEntityType, oMetaModel) {
      const {
        targetProperties: aTargetProperties,
        targetEntities: aTargetEntities
      } = sideEffectsData;
      const aPromises = [];
      let aTargets = [];
      const ownerEntityType = oEntitySetContext.getProperty("$Type");
      if (sEntityType === ownerEntityType) {
        // if SalesOrdr Item
        aTargetEntities === null || aTargetEntities === void 0 ? void 0 : aTargetEntities.forEach(targetEntity => {
          targetEntity = targetEntity["$NavigationPropertyPath"];
          let baseNavPath;
          if (targetEntity.includes("/")) {
            baseNavPath = targetEntity.split("/")[0];
          } else {
            baseNavPath = targetEntity;
          }
          aTargets = MassEditHelper.fnGetEntityTypeOfOwner(oMetaModel, baseNavPath, oEntitySetContext, targetEntity, aTargets);
        });
      }
      if (aTargetProperties.length) {
        aTargetProperties.forEach(targetProp => {
          const {
            pOwnerEntity
          } = MassEditHelper.fnGetPathForSourceProperty(targetProp, sEntityType, oMetaModel);
          aPromises.push(pOwnerEntity.then(resultEntity => {
            // if entity is SalesOrderItem, Target Property is from Items table
            if (resultEntity === ownerEntityType) {
              aTargets.push(targetProp); // get immediate targets
            } else if (targetProp.includes("/")) {
              const baseNavPath = targetProp.split("/")[0];
              aTargets = MassEditHelper.fnGetEntityTypeOfOwner(oMetaModel, baseNavPath, oEntitySetContext, targetProp, aTargets);
            }
            return Promise.resolve(aTargets);
          }));
        });
      } else {
        aPromises.push(Promise.resolve(aTargets));
      }
      return Promise.all(aPromises);
    },
    /**
     * This function checks if in the given side Effects Obj, if _Item is set as Target Entity for any side Effects on
     * other entity set.
     *
     * @param sideEffectsMap
     * @param oEntitySetContext
     * @returns Length of sideEffectsArray where current Entity is set as Target Entity
     */
    checkIfEntityExistsAsTargetEntity: (sideEffectsMap, oEntitySetContext) => {
      const ownerEntityType = oEntitySetContext.getProperty("$Type");
      const sideEffectsOnOtherEntity = Object.values(sideEffectsMap).filter(obj => {
        return !obj.name.includes(ownerEntityType);
      });
      const entitySetName = oEntitySetContext.getPath().split("/").pop();
      const sideEffectsWithCurrentEntityAsTarget = sideEffectsOnOtherEntity.filter(obj => {
        const targetEntitiesArray = obj.sideEffects.targetEntities;
        return targetEntitiesArray !== null && targetEntitiesArray !== void 0 && targetEntitiesArray.filter(innerObj => innerObj["$NavigationPropertyPath"] === entitySetName).length ? obj : false;
      });
      return sideEffectsWithCurrentEntityAsTarget.length;
    },
    /**
     * Upon updating the field, array of immediate and deferred side effects for that field are created.
     * If there are any failed side effects for that context, they will also be used to generate the map.
     * If the field has text associated with it, then add it to request side effects.
     *
     * @param mParams
     * @param mParams.controller Controller
     * @param mParams.fieldPromise Promise to update field
     * @param mParams.sideEffectMap SideEffectsMap for the field
     * @param mParams.textPaths TextPaths of the field if any
     * @param mParams.groupId Group Id to used to group requests
     * @param mParams.key KeyValue of the field
     * @param mParams.entitySetContext EntitySetcontext
     * @param mParams.metaModel MetaModel data
     * @param mParams.selectedContext Selected row context
     * @param mParams.deferredTargetsForAQualifiedName Deferred targets data
     * @returns Promise for all immediately requested side effects.
     */
    handleMassEditFieldUpdateAndRequestSideEffects: async function (params) {
      const {
        controller,
        fieldPromise,
        sideEffectsMap,
        textPaths,
        groupId,
        key,
        entitySetContext,
        metaModel,
        selectedContext,
        deferredTargetsForAQualifiedName
      } = params;
      const view = controller.getView();
      const immediateSideEffectsPromises = [fieldPromise];
      const ownerEntityType = entitySetContext.getProperty("$Type");
      const sideEffectsService = CommonUtils.getAppComponent(view).getSideEffectsService();
      const isSideEffectsWithCurrentEntityAsTarget = MassEditHelper.checkIfEntityExistsAsTargetEntity(sideEffectsMap, entitySetContext);
      if (sideEffectsMap) {
        // Execute the configured SideEffects for the related field
        for (const sideEffectsName in sideEffectsMap) {
          const sideEffectsProperties = sideEffectsMap[sideEffectsName];
          const sideEffectsEntityType = sideEffectsName.split("#")[0];
          const sideEffectsContext = controller._sideEffects.getContextForSideEffects(selectedContext, sideEffectsEntityType);
          deferredTargetsForAQualifiedName[key] = {};
          if (sideEffectsContext) {
            const fnGetImmediateTargetsAndActions = async oDataSideEffect => {
              const targetsArrayForAllProperties = await MassEditHelper.fnGetTargetsForMassEdit(oDataSideEffect, entitySetContext, sideEffectsEntityType, metaModel);
              let immediateTargets = targetsArrayForAllProperties[0];
              const actionName = oDataSideEffect.triggerAction;
              // The former implementation didn't work for the navigationProperty set into the targetEntities
              const deferredTargets = (oDataSideEffect.targetProperties ?? []).filter(target => !immediateTargets.includes(target));

              // if entity is other than items table then action is deferred or the static action is on collection
              const triggerActionName = actionName && sideEffectsEntityType === ownerEntityType && !TableHelper._isStaticAction(metaModel.getObject(`/${actionName}`), actionName) ? actionName : undefined;
              deferredTargetsForAQualifiedName[key][oDataSideEffect.fullyQualifiedName] = {
                aTargets: deferredTargets,
                oContext: sideEffectsContext,
                oDataSideEffect,
                TriggerAction: actionName && !triggerActionName ? actionName : undefined
              };
              if (isSideEffectsWithCurrentEntityAsTarget) {
                immediateTargets = [];
              }
              return {
                aTargets: immediateTargets,
                TriggerAction: triggerActionName
              };
            };
            immediateSideEffectsPromises.push(controller._sideEffects.requestSideEffects(sideEffectsProperties.sideEffects, sideEffectsContext, groupId, fnGetImmediateTargetsAndActions));
            controller._sideEffects.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, sideEffectsContext);
          }
        }

        //Execute the previous failed SideEffects requests
        const allFailedSideEffects = controller._sideEffects.getRegisteredFailedRequests();
        for (const context of [selectedContext, view.getBindingContext()]) {
          if (context) {
            const contextPath = context.getPath();
            const failedSideEffects = allFailedSideEffects[contextPath] ?? [];
            controller._sideEffects.unregisterFailedSideEffectsForAContext(contextPath);
            for (const failedSideEffect of failedSideEffects) {
              immediateSideEffectsPromises.push(controller._sideEffects.requestSideEffects(failedSideEffect, context));
            }
          }
        }
      }
      if (textPaths !== null && textPaths !== void 0 && textPaths[key] && textPaths[key].length) {
        immediateSideEffectsPromises.push(sideEffectsService.requestSideEffects(textPaths[key], selectedContext, groupId));
      }
      return Promise.allSettled(immediateSideEffectsPromises);
    },
    /**
     * Create the mass edit dialog.
     *
     * @param oTable Instance of Table
     * @param aContexts Contexts for mass edit
     * @param oController Controller for the view
     * @returns Promise returning instance of dialog.
     */
    createDialog: async function (oTable, aContexts, oController) {
      const aDataArray = [],
        oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core"),
        oDefaultValues = MassEditHelper.getDefaultTextsForDialog(oResourceBundle, aContexts.length, oTable),
        oDataFieldModel = MassEditHelper.prepareDataForDialog(oTable, aContexts, aDataArray),
        dialogContext = MassEditHelper.getDialogContext(oTable),
        oDialogDataModel = MassEditHelper.setRuntimeModelOnDialog(aContexts, aDataArray, oDefaultValues, dialogContext),
        model = oTable.getModel(),
        metaModel = model.getMetaModel(),
        metaPath = metaModel.getMetaPath(dialogContext.getPath()),
        fragment = await MassEditHelper.createFragment(metaModel, oDataFieldModel, metaPath);
      const oDialogContent = await Fragment.load({
        definition: fragment
      });
      const oDialog = new Dialog({
        resizable: true,
        title: oDefaultValues.massEditTitle,
        content: [oDialogContent],
        afterOpen: MassEditHelper.onDialogOpen,
        beginButton: new Button({
          text: MassEditHelper.helpers.getExpBindingForApplyButtonTxt(oDefaultValues, oDataFieldModel.getObject("/")),
          type: "Emphasized",
          press: async function (oEvent) {
            var _oController$getView6, _oController$getView7;
            messageHandling.removeBoundTransitionMessages();
            messageHandling.removeUnboundTransitionMessages();
            (_oController$getView6 = oController.getView()) === null || _oController$getView6 === void 0 ? void 0 : (_oController$getView7 = _oController$getView6.getBindingContext("internal")) === null || _oController$getView7 === void 0 ? void 0 : _oController$getView7.setProperty("skipPatchHandlers", true);
            const appComponent = CommonUtils.getAppComponent(oController.getView());
            const oInDialog = oEvent.getSource().getParent();
            const oModel = oInDialog.getModel("fieldsInfo");
            const aResults = oModel.getProperty("/results");
            const oMetaModel = oTable && oTable.getModel().getMetaModel(),
              sCurrentEntitySetName = oTable.data("metaPath"),
              oEntitySetContext = oMetaModel.getContext(sCurrentEntitySetName);
            const errorContexts = [];
            const textPaths = oModel.getProperty("/textPaths");
            const aPropertyReadableInfo = oModel.getProperty("/readablePropertyData");
            let groupId;
            const massEditPromises = [];
            const failedFieldsData = {};
            const selectedRowsLength = aContexts.length;
            const deferredTargetsForAQualifiedName = {};
            const baseSideEffectsMapArray = MassEditHelper.getSideEffectDataForKey(oEntitySetContext, appComponent, oController, aResults);
            //const changePromise: any[] = [];
            //let bReadOnlyField = false;
            //const errorContexts: object[] = [];

            aContexts.forEach(function (selectedContext, idx) {
              aResults.forEach(result => {
                if (!failedFieldsData.hasOwnProperty(result.keyValue)) {
                  failedFieldsData[result.keyValue] = 0;
                }
                if (aPropertyReadableInfo) {
                  aPropertyReadableInfo.some(function (oPropertyInfo) {
                    if (result.keyValue === oPropertyInfo.property) {
                      if (oPropertyInfo.type === "Default") {
                        return oPropertyInfo.value === true;
                      } else if (oPropertyInfo.type === "Path" && oPropertyInfo.propertyValue && oPropertyInfo.propertyPath) {
                        return selectedContext.getObject(oPropertyInfo.propertyPath) === oPropertyInfo.propertyValue;
                      }
                    }
                  });
                }
                groupId = `$auto.${idx}`;
                const fieldPromise = selectedContext.setProperty(result.keyValue, result.value, groupId).catch(async error => {
                  errorContexts.push(selectedContext.getObject());
                  Log.error("Mass Edit: Something went wrong in updating entries.", error);
                  failedFieldsData[result.keyValue] = failedFieldsData[result.keyValue] + 1;
                  return Promise.reject({
                    isFieldUpdateFailed: true
                  });
                });
                const dataToUpdateFieldAndSideEffects = {
                  controller: oController,
                  fieldPromise,
                  sideEffectsMap: baseSideEffectsMapArray[result.keyValue],
                  textPaths,
                  groupId,
                  key: result.keyValue,
                  entitySetContext: oEntitySetContext,
                  metaModel: oMetaModel,
                  selectedContext,
                  deferredTargetsForAQualifiedName
                };
                massEditPromises.push(MassEditHelper.handleMassEditFieldUpdateAndRequestSideEffects(dataToUpdateFieldAndSideEffects));
              });
            });
            await Promise.allSettled(massEditPromises).then(async function () {
              groupId = `$auto.massEditDeferred`;
              const deferredRequests = [];
              const sideEffectsDataForAllKeys = Object.values(deferredTargetsForAQualifiedName);
              const keysWithSideEffects = Object.keys(deferredTargetsForAQualifiedName);
              sideEffectsDataForAllKeys.forEach((aSideEffect, index) => {
                const currentKey = keysWithSideEffects[index];
                if (failedFieldsData[currentKey] !== selectedRowsLength) {
                  const deferredSideEffectsData = Object.values(aSideEffect);
                  deferredSideEffectsData.forEach(req => {
                    const {
                      aTargets,
                      oContext,
                      TriggerAction,
                      mSideEffect
                    } = req;
                    const fnGetDeferredTargets = function () {
                      return aTargets;
                    };
                    const fnGetDeferredTargetsAndActions = function () {
                      return {
                        aTargets: fnGetDeferredTargets(),
                        TriggerAction: TriggerAction
                      };
                    };
                    deferredRequests.push(
                    // if some deferred is rejected, it will be add to failed queue
                    oController._sideEffects.requestSideEffects(mSideEffect, oContext, groupId, fnGetDeferredTargetsAndActions));
                  });
                }
              });
            }).then(function () {
              MassEditHelper.messageHandlingForMassEdit(oTable, aContexts, oController, oInDialog, aResults, errorContexts);
            }).catch(e => {
              MassEditHelper.closeDialog(oDialog);
              return Promise.reject(e);
            });
          }
        }),
        endButton: new Button({
          text: oDefaultValues.cancelButtonText,
          visible: MassEditHelper.helpers.hasEditableFieldsBinding(oDataFieldModel.getObject("/"), true),
          press: function (oEvent) {
            const oInDialog = oEvent.getSource().getParent();
            MassEditHelper.closeDialog(oInDialog);
          }
        })
      });
      oDialog.setModel(oDialogDataModel, "fieldsInfo");
      oDialog.setModel(model);
      oDialog.setBindingContext(dialogContext);
      return oDialog;
    },
    /**
     * Create the mass edit fragment.
     *
     * @param metaModel Metamodel data
     * @param dataFieldModel JSON model
     * @param fragmentName Name of the fragment
     * @param dialogContext Controller for the view
     * @returns Promise returning instance of fragment.
     */

    createFragment: async function (metaModel, dataFieldModel, metaPath) {
      const fragmentName = "sap/fe/core/controls/massEdit/MassEditDialog",
        itemsModel = new TemplateModel(dataFieldModel.getData(), metaModel),
        fragment = XMLTemplateProcessor.loadTemplate(fragmentName, "fragment");
      return Promise.resolve(XMLPreprocessor.process(fragment, {
        name: fragmentName
      }, {
        bindingContexts: {
          dataFieldModel: itemsModel.createBindingContext("/"),
          metaModel: metaModel.createBindingContext("/"),
          contextPath: metaModel.createBindingContext(metaPath)
        },
        models: {
          dataFieldModel: itemsModel,
          metaModel: metaModel,
          contextPath: metaModel
        }
      }));
    },
    helpers: {
      getBindingExpForHasEditableFields: (fields, editable) => {
        const totalExp = fields.reduce((expression, field) => or(expression, pathInModel("/values/" + field.dataProperty + "/visible", "fieldsInfo")), constant(false));
        return editable ? totalExp : not(totalExp);
      },
      getExpBindingForApplyButtonTxt: (defaultValues, fields) => {
        const editableExp = MassEditHelper.helpers.getBindingExpForHasEditableFields(fields, true);
        const totalExp = ifElse(editableExp, constant(defaultValues.applyButtonText), constant(defaultValues.okButtonText));
        return compileExpression(totalExp);
      },
      hasEditableFieldsBinding: (fields, editable) => {
        const ret = compileExpression(MassEditHelper.helpers.getBindingExpForHasEditableFields(fields, editable));
        if (ret === "true") {
          return true;
        } else if (ret === "false") {
          return false;
        } else {
          return ret;
        }
      }
    }
  };
  return MassEditHelper;
}, false);
