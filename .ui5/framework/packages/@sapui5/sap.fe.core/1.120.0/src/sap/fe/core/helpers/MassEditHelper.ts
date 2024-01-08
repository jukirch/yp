import type { PrimitiveType } from "@sap-ux/vocabularies-types";
import type { DataField, DataFieldForAction, DataFieldForAnnotation } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import TemplateModel from "sap/fe/core/TemplateModel";
import type {
	FieldSideEffectDictionary,
	MassEditFieldSideEffectDictionary,
	MassEditFieldSideEffectPropertyType
} from "sap/fe/core/controllerextensions/SideEffects";
import {
	isDataFieldForAction,
	isDataFieldForAnnotation,
	isDataFieldForIntentBasedNavigation,
	isDataFieldTypes
} from "sap/fe/core/converters/annotations/DataField";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import { compileExpression, constant, ifElse, not, or, pathInModel } from "sap/fe/core/helpers/BindingToolkit";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import FELibrary from "sap/fe/core/library";
import type { ODataSideEffectsType, SideEffectsEntityType } from "sap/fe/core/services/SideEffectsServiceFactory";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import {
	getAssociatedUnitProperty,
	getAssociatedUnitPropertyPath,
	hasCurrency,
	hasUnit,
	hasValueHelp,
	hasValueHelpWithFixedValues
} from "sap/fe/core/templating/PropertyHelper";
import { getTextBinding, setEditStyleProperties } from "sap/fe/macros/field/FieldTemplating";
import type { FieldProperties } from "sap/fe/macros/internal/InternalField.block";
import TableHelper from "sap/fe/macros/table/TableHelper";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import Core from "sap/ui/core/Core";
import Fragment from "sap/ui/core/Fragment";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import type Table from "sap/ui/mdc/Table";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type AppComponent from "../AppComponent";
import messageHandling from "../controllerextensions/messageHandler/messageHandling";
import type { AnyType } from "../controls/Any";
import Any from "../controls/Any";
import { convertMetaModelContext, getInvolvedDataModelObjects } from "../converters/MetaModelConverter";
import { isReadOnlyExpression } from "../templating/FieldControlHelper";
import { getEditMode, getRequiredExpression, isMultiValueField } from "../templating/UIFormatters";
import type { InternalModelContext } from "./ModelHelper";

/* This class contains helpers to be used for mass edit functionality */
type TextArrangementInfo = {
	textArrangement: string;
	valuePath: string;
	descriptionPath?: string;
	value: string;
	description: string;
	fullText: string;
};

type ResultType = {
	keyValue: string;
	propertyFullyQualifiedName: string;
	value: PrimitiveType;
};

type DialogData = {
	label: string;
	dataProperty: string;
	isValueHelpEnabled: boolean;
	unitProperty?: string;
	isFieldRequired: CompiledBindingToolkitExpression | BindingToolkitExpression<boolean>;
	defaultSelectionPath: string | boolean | undefined;
	defaultSelectionUnitPath: string | boolean | undefined;
	entitySet: string;
	display: string;
	descriptionPath: string | undefined;
	nullable: boolean;
	isPropertyReadOnly: boolean | BindingToolkitExpression<boolean>;
	inputType: string;
	editMode: string | BindingToolkitExpression<boolean>;
	propertyInfo: {
		hasVH: boolean;
		runtimePath: string;
		relativePath: string;
		propertyFullyQualifiedName: string;
		propertyPathForValueHelp: string;
	};
	unitInfo?: {
		hasVH: boolean;
		runtimePath: string;
		relativePath: string;
		propertyPathForValueHelp: string;
	};
};

type BindingInfo = {
	path?: string;
	model?: string | object;
	parameters?: Array<BindingInfo>;
};

export type DataToUpdateFieldAndSideEffectsType = {
	controller: PageController;
	fieldPromise: Promise<unknown>;
	sideEffectsMap: MassEditFieldSideEffectDictionary;
	textPaths: any;
	groupId: string;
	key: string;
	entitySetContext: ODataV4Context;
	metaModel: ODataMetaModel;
	selectedContext: ODataV4Context;
	deferredTargetsForAQualifiedName: Record<
		string,
		Record<
			string,
			{
				aTargets: string[];
				oContext: ODataV4Context;
				oDataSideEffect: ODataSideEffectsType;
				TriggerAction: string | undefined;
			}
		>
	>;
};

const MassEditHelper = {
	/**
	 * Initializes the value at final or deepest level path with a blank array.
	 * Return an empty array pointing to the final or deepest level path.
	 *
	 * @param sPath Property path
	 * @param aValues Array instance where the default data needs to be added
	 * @returns The final path
	 */
	initLastLevelOfPropertyPath: function (sPath: string, aValues: any /*, transCtx: Context */) {
		let aFinalPath: any;
		let index = 0;
		const aPaths = sPath.split("/");
		let sFullPath = "";
		aPaths.forEach(function (sPropertyPath: string) {
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
	getUniqueValues: function (sValue: string, index: number, self: any[]) {
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
	getValueForMultiLevelPath: function (sDataPropertyPath: string, oValues: any) {
		let result: any;
		if (sDataPropertyPath && sDataPropertyPath.indexOf("/") > 0) {
			const aPropertyPaths = sDataPropertyPath.split("/");
			aPropertyPaths.forEach(function (sPath: string) {
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
	getDefaultSelectionPathComboBox: function (aContexts: any[], sDataPropertyPath: string) {
		let result: string | undefined;
		if (sDataPropertyPath && aContexts.length > 0) {
			const oSelectedContext = aContexts,
				aPropertyValues: any[] = [];
			oSelectedContext.forEach(function (oContext: any) {
				const oDataObject = oContext.getObject();
				const sMultiLevelPathCondition =
					sDataPropertyPath.includes("/") && oDataObject.hasOwnProperty(sDataPropertyPath.split("/")[0]);
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
	getHiddenValueForContexts: function (hiddenValue: any, aContexts: any[]) {
		if (hiddenValue && hiddenValue.$Path) {
			return !aContexts.some(function (oSelectedContext: any) {
				return oSelectedContext.getObject(hiddenValue.$Path) === false;
			});
		}
		return hiddenValue;
	},

	getInputType: function (propertyInfo: any, dataFieldConverted: any, oDataModelPath: DataModelObjectPath): string {
		const editStyleProperties = {} as FieldProperties;
		let inputType!: string;
		if (propertyInfo) {
			setEditStyleProperties(editStyleProperties, dataFieldConverted, oDataModelPath, true);
			inputType = editStyleProperties?.editStyle || "";
		}
		const isValidForMassEdit =
			inputType &&
			!["DatePicker", "TimePicker", "DateTimePicker", "RatingIndicator"].includes(inputType) &&
			!isMultiValueField(oDataModelPath) &&
			!hasValueHelpWithFixedValues(propertyInfo);

		return (isValidForMassEdit || "") && inputType;
	},

	getIsFieldGrp: function (dataFieldConverted: any): boolean {
		return (
			dataFieldConverted &&
			dataFieldConverted.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" &&
			dataFieldConverted.Target &&
			dataFieldConverted.Target.value &&
			dataFieldConverted.Target.value.indexOf("FieldGroup") > -1
		);
	},

	/**
	 * Get text path for the mass edit field.
	 *
	 * @param property Property path
	 * @param textBinding Text Binding Info
	 * @param displayMode Display mode
	 * @returns Text Property Path if it exists
	 */
	getTextPath: function (property: string, textBinding: any, displayMode: string): string | undefined {
		let descriptionPath;
		if (textBinding && (textBinding.path || (textBinding.parameters && textBinding.parameters.length)) && property) {
			if (textBinding.path && displayMode === "Description") {
				descriptionPath = textBinding.path;
			} else if (textBinding.parameters) {
				textBinding.parameters.forEach(function (props: BindingInfo) {
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
	prepareDataForDialog: function (oTable: Table, aContexts: any[], aDataArray: any[]) {
		const oMetaModel = oTable && (oTable.getModel() as ODataModel).getMetaModel(),
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

		aTableFields.forEach(function (oColumnInfo: any) {
			if (!oColumnInfo.annotationPath) {
				return;
			}
			const sDataPropertyPath = oColumnInfo.dataProperty;
			if (sDataPropertyPath) {
				let oPropertyInfo = sDataPropertyPath && oMetaModel.getObject(`${sCurrentEntitySetName}/${sDataPropertyPath}@`);
				sLabelText =
					oColumnInfo.label || (oPropertyInfo && oPropertyInfo["@com.sap.vocabularies.Common.v1.Label"]) || sDataPropertyPath;

				if (oDataModelObjectPath) {
					oDataModelObjectPath.targetObject = oDataModelObjectPath.targetEntityType.entityProperties.filter(function (
						oProperty: any
					) {
						return oProperty.name === sDataPropertyPath;
					});
				}
				oDataModelObjectPath.targetObject = oDataModelObjectPath.targetObject[0] || {};
				oTextBinding = getTextBinding(oDataModelObjectPath, {}, true) || {};
				const oFieldContext = oMetaModel.getContext(oColumnInfo.annotationPath),
					oDataFieldConverted = convertMetaModelContext(oFieldContext) as DataField | DataFieldForAnnotation | DataFieldForAction,
					oPropertyContext = oMetaModel.getContext(`${sCurrentEntitySetName}/${sDataPropertyPath}@`),
					oInterface = oPropertyContext && (oPropertyContext.getInterface() as any);

				let oDataModelPath = getInvolvedDataModelObjects(oFieldContext, oEntitySetContext);
				if (isDataFieldTypes(oDataFieldConverted) && oDataFieldConverted?.Value?.path?.length > 0) {
					oDataModelPath = enhanceDataModelPath(oDataModelPath, sDataPropertyPath);
				}
				const bHiddenField =
					MassEditHelper.getHiddenValueForContexts(
						oFieldContext && oFieldContext.getObject()["@com.sap.vocabularies.UI.v1.Hidden"],
						aContexts
					) || false;
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
					oPropertyInfo = oDataFieldConverted?.Value?.$target;
				} else if (isDataFieldForAnnotation(oDataFieldConverted)) {
					oPropertyInfo = oDataFieldConverted?.Target?.$target;
				} else {
					oPropertyInfo = undefined;
				}
				// Datafield is not included in the FieldControl calculation, needs to be implemented

				const chartProperty = oPropertyInfo && oPropertyInfo.term && oPropertyInfo.term === "com.sap.vocabularies.UI.v1.Chart";
				const isAction =
					(isDataFieldForAction(oDataFieldConverted) || isDataFieldForIntentBasedNavigation(oDataFieldConverted)) &&
					!!oDataFieldConverted.Action;
				const isFieldGrp = MassEditHelper.getIsFieldGrp(oDataFieldConverted);
				if (isImage || bHiddenField || chartProperty || isAction || isFieldGrp) {
					return;
				}

				// ValueHelp properties
				sUnitPropertyPath =
					((hasCurrency(oPropertyInfo) || hasUnit(oPropertyInfo)) && getAssociatedUnitPropertyPath(oPropertyInfo)) || "";
				const unitPropertyInfo = sUnitPropertyPath && getAssociatedUnitProperty(oPropertyInfo);
				bValueHelpEnabled = hasValueHelp(oPropertyInfo);
				bValueHelpEnabledForUnit = unitPropertyInfo && hasValueHelp(unitPropertyInfo);

				const hasContextDependentVH =
					(bValueHelpEnabled || bValueHelpEnabledForUnit) &&
					(oPropertyInfo?.annotations?.Common?.ValueListRelevantQualifiers ||
						(unitPropertyInfo && unitPropertyInfo?.annotations?.Common?.ValueListRelevantQualifiers));
				if (hasContextDependentVH) {
					// context dependent VH is not supported for Mass Edit.
					return;
				}

				// EditMode and InputType
				const propertyForFieldControl = oPropertyInfo && oPropertyInfo.Value ? oPropertyInfo.Value : oPropertyInfo;
				const expBinding = getEditMode(propertyForFieldControl, oDataModelPath, false, false, oDataFieldConverted, constant(true));
				const editModeValues = Object.keys(FieldEditMode);
				const editModeIsStatic = !!expBinding && editModeValues.includes(expBinding as FieldEditMode);
				const editable = !!expBinding && ((editModeIsStatic && expBinding === FieldEditMode.Editable) || !editModeIsStatic);
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
					const isValueHelpEnabledForUnit =
						bValueHelpEnabledForUnit && !sUnitPropertyPath.includes("/") ? bValueHelpEnabledForUnit : false;
					const unitProperty = sUnitPropertyPath && !sDataPropertyPath.includes("/") ? sUnitPropertyPath : false;

					oResult = {
						label: sLabelText,
						dataProperty: sDataPropertyPath,
						isValueHelpEnabled: bValueHelpEnabled ? bValueHelpEnabled : false,
						unitProperty,
						isFieldRequired: getRequiredExpression(oPropertyInfo, oDataFieldConverted, true, false, {}, oDataModelPath),
						defaultSelectionPath: sDataPropertyPath
							? MassEditHelper.getDefaultSelectionPathComboBox(aContexts, sDataPropertyPath)
							: false,
						defaultSelectionUnitPath: sUnitPropertyPath
							? MassEditHelper.getDefaultSelectionPathComboBox(aContexts, sUnitPropertyPath)
							: false,
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

	getTableFields: function (oTable: any) {
		const aColumns = (oTable && oTable.getColumns()) || [];
		const columnsData = oTable && oTable.getParent().getTableDefinition().columns;
		return aColumns.map(function (oColumn: any) {
			const sDataProperty = oColumn && oColumn.getDataProperty(),
				aRealtedColumnInfo =
					columnsData &&
					columnsData.filter(function (oColumnInfo: any) {
						return oColumnInfo.name === sDataProperty && oColumnInfo.type === "Annotation";
					});
			return {
				dataProperty: sDataProperty,
				label: oColumn.getHeader(),
				annotationPath: aRealtedColumnInfo && aRealtedColumnInfo[0] && aRealtedColumnInfo[0].annotationPath
			};
		});
	},

	getDefaultTextsForDialog: function (oResourceBundle: any, iSelectedContexts: any, oTable: any) {
		// The confirm button text is "Save" for table in Display mode and "Apply" for table in edit mode. This can be later exposed if needed.
		const bDisplayMode = oTable.data("displayModePropertyBinding") === "true";

		return {
			keepExistingPrefix: "< Keep",
			leaveBlankValue: "< Leave Blank >",
			clearFieldValue: "< Clear Values >",
			massEditTitle: oResourceBundle.getText("C_MASS_EDIT_DIALOG_TITLE", iSelectedContexts.toString()),
			applyButtonText: bDisplayMode
				? oResourceBundle.getText("C_MASS_EDIT_SAVE_BUTTON_TEXT")
				: oResourceBundle.getText("C_MASS_EDIT_APPLY_BUTTON_TEXT"),
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
	setDefaultValuesToDialog: function (aValues: any, oDefaultValues: any, oPropertyInfo: any, bUOMField?: boolean) {
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
			const falseEntry = { text: "No", key: `${sPropertyPath}/false`, textInfo: { value: false } };
			const truthyEntry = { text: "Yes", key: `${sPropertyPath}/true`, textInfo: { value: true } };
			aValues.unshift(falseEntry);
			aValues.defaultOptions.unshift(falseEntry);
			aValues.unshift(truthyEntry);
			aValues.defaultOptions.unshift(truthyEntry);
			aValues.unshift(keepEntry);
			aValues.defaultOptions.unshift(keepEntry);
		} else {
			if (oPropertyInfo?.propertyInfo?.hasVH || (oPropertyInfo?.unitInfo?.hasVH && bUOMField)) {
				const vhdEntry = { text: oDefaultValues.useValueHelpValue, key: `UseValueHelpValue/${sPropertyPath}` };
				aValues.unshift(vhdEntry);
				aValues.defaultOptions.unshift(vhdEntry);
			}
			if (selectOptionsExist) {
				if (bPropertyRequired !== "true" && !bUOMField) {
					const clearEntry = { text: oDefaultValues.clearFieldValue, key: `ClearFieldValue/${sPropertyPath}` };
					aValues.unshift(clearEntry);
					aValues.defaultOptions.unshift(clearEntry);
				}
				aValues.unshift(keepEntry);
				aValues.defaultOptions.unshift(keepEntry);
			} else {
				const emptyEntry = { text: oDefaultValues.leaveBlankValue, key: `Default/${sPropertyPath}` };
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
	getTextArrangementInfo: function (
		property: string,
		descriptionPath: string,
		displayMode: string,
		selectedContext: ODataV4Context
	): TextArrangementInfo {
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
	isEditable: function (any: AnyType): boolean {
		const binding = any.getBinding("any");
		const value = (binding as any).getExternalValue();
		return value === FieldEditMode.Editable;
	},

	/**
	 * Calculate and update the visibility of mass edit field on change of the ManagedObject Any binding.
	 *
	 * @param oDialogDataModel Model to be used runtime.
	 * @param dataProperty Field name.
	 */
	onContextEditableChange: function (oDialogDataModel: JSONModel, dataProperty: string): void {
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
	updateOnContextChange: function (mOToUse: AnyType, oDialogDataModel: JSONModel, dataProperty: string, values: any) {
		const binding = mOToUse.getBinding("any");

		values.objectsForVisibility = values.objectsForVisibility || [];
		values.objectsForVisibility.push(mOToUse);

		binding?.attachChange(MassEditHelper.onContextEditableChange.bind(null, oDialogDataModel, dataProperty));
	},

	/**
	 * Get bound object to calculate the visibility of contexts.
	 *
	 * @param expBinding Binding String object.
	 * @param context Context the binding value.
	 * @returns The ManagedObject Any to be used to calculate the visible value of the binding.
	 */
	getBoundObject: function (expBinding: CompiledBindingToolkitExpression, context: ODataV4Context): AnyType {
		const mOToUse = new Any({ any: expBinding });
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
	getFieldVisiblity: function (
		expBinding: CompiledBindingToolkitExpression,
		oDialogDataModel: JSONModel,
		dataProperty: string,
		values: any,
		context: ODataV4Context
	): boolean {
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
	setRuntimeModelOnDialog: function (aContexts: any[], aDataArray: any[], oDefaultValues: any, dialogContext: ODataV4Context) {
		const aValues: any[] = [];
		const aUnitData: any[] = [];
		const aResults: any[] = [];
		const textPaths: any[] = [];
		const aReadOnlyFieldInfo: any[] = [];

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
		aDataArray.forEach(function (oInData: any) {
			let oTextInfo;
			let sPropertyKey;
			let sUnitPropertyName;
			const oDistinctValueMap: any = {};
			const oDistinctUnitMap: any = {};
			if (oInData.dataProperty && oInData.dataProperty.indexOf("/") > -1) {
				const aFinalPath = MassEditHelper.initLastLevelOfPropertyPath(oInData.dataProperty, aValues /*, dialogContext */);
				const aPropertyPaths = oInData.dataProperty.split("/");

				for (const context of aContexts) {
					const sMultiLevelPathValue = context.getObject(oInData.dataProperty);
					sPropertyKey = `${oInData.dataProperty}/${sMultiLevelPathValue}`;
					if (!oDistinctValueMap[sPropertyKey] && aFinalPath[aPropertyPaths[aPropertyPaths.length - 1]]) {
						oTextInfo = MassEditHelper.getTextArrangementInfo(
							oInData.dataProperty,
							oInData.descriptionPath,
							oInData.display,
							context
						);
						aFinalPath[aPropertyPaths[aPropertyPaths.length - 1]].push({
							text: (oTextInfo && oTextInfo.fullText) || sMultiLevelPathValue,
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
							oTextInfo = MassEditHelper.getTextArrangementInfo(
								oInData.dataProperty,
								oInData.descriptionPath,
								oInData.display,
								context
							);
							const entry = {
								text: (oTextInfo && oTextInfo.fullText) || oDataObject[oInData.dataProperty],
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
								oTextInfo = MassEditHelper.getTextArrangementInfo(
									oInData.unitProperty,
									oInData.descriptionPath,
									oInData.display,
									context
								);
								const unitEntry = {
									text: (oTextInfo && oTextInfo.fullText) || oDataObject[oInData.unitProperty],
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
		aDataArray.forEach(function (oInData: any) {
			let values: any = {};
			if (oInData.dataProperty.indexOf("/") > -1) {
				const sMultiLevelPropPathValue = MassEditHelper.getValueForMultiLevelPath(oInData.dataProperty, aValues);
				if (!sMultiLevelPropPathValue) {
					sMultiLevelPropPathValue.push({ text: oDefaultValues.leaveBlankValue, key: `Empty/${oInData.dataProperty}` });
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
				aUnitData[oInData.unitProperty].selectedKey = MassEditHelper.getDefaultSelectionPathComboBox(
					aContexts,
					oInData.unitProperty
				);
				aUnitData[oInData.unitProperty].inputType = oInData.inputType;
			} else if (
				(oInData.dataProperty && aValues[oInData.dataProperty] && !aValues[oInData.dataProperty].length) ||
				(oInData.unitProperty && aUnitData[oInData.unitProperty] && !aUnitData[oInData.unitProperty].length)
			) {
				const bClearFieldOrBlankValueExists =
					aValues[oInData.dataProperty] &&
					aValues[oInData.dataProperty].some(function (obj: any) {
						return obj.text === "< Clear Values >" || obj.text === "< Leave Blank >";
					});
				if (oInData.dataProperty && !bClearFieldOrBlankValueExists) {
					aValues[oInData.dataProperty].push({ text: oDefaultValues.leaveBlankValue, key: `Empty/${oInData.dataProperty}` });
				}
				const bClearFieldOrBlankUnitValueExists =
					aUnitData[oInData.unitProperty] &&
					aUnitData[oInData.unitProperty].some(function (obj: any) {
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
					aUnitData[oInData.unitProperty].selectedKey = MassEditHelper.getDefaultSelectionPathComboBox(
						aContexts,
						oInData.unitProperty
					);
					aUnitData[oInData.unitProperty].inputType = oInData.inputType;
				}
			}
			if (oInData.isPropertyReadOnly && typeof oInData.isPropertyReadOnly === "boolean") {
				aReadOnlyFieldInfo.push({ property: oInData.dataProperty, value: oInData.isPropertyReadOnly, type: "Default" });
			} else if (
				oInData.isPropertyReadOnly &&
				oInData.isPropertyReadOnly.operands &&
				oInData.isPropertyReadOnly.operands[0] &&
				oInData.isPropertyReadOnly.operands[0].operand1 &&
				oInData.isPropertyReadOnly.operands[0].operand2
			) {
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
				values.visible =
					oInData.editMode === FieldEditMode.Editable ||
					aContexts.some(
						MassEditHelper.getFieldVisiblity.bind(
							MassEditHelper,
							oInData.editMode,
							oDialogDataModel,
							oInData.dataProperty,
							values
						)
					);
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
	getDialogContext: function (table: Table, dialog?: Dialog): ODataV4Context {
		let transCtx = dialog?.getBindingContext() as ODataV4Context | undefined;

		if (!transCtx) {
			const model = table.getModel() as ODataModel;
			const listBinding = table.getRowBinding();
			const transientListBinding = model.bindList(listBinding.getPath(), listBinding.getContext(), [], [], {
				$$updateGroupId: "submitLater"
			});
			(transientListBinding as any).refreshInternal = function () {
				/* */
			};
			transCtx = transientListBinding.create({}, true);
		}

		return transCtx;
	},

	onDialogOpen: function (event: any): void {
		const source = event.getSource();
		const fieldsInfoModel = source.getModel("fieldsInfo");
		fieldsInfoModel.setProperty("/isOpen", true);
	},

	closeDialog: function (oDialog: any) {
		oDialog.close();
		oDialog.destroy();
	},

	messageHandlingForMassEdit: async function (
		oTable: Table,
		aContexts: any,
		oController: PageController,
		oInDialog: any,
		aResults: any,
		errorContexts: any
	) {
		const DraftStatus = FELibrary.DraftStatus;
		const oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
		(oController.getView()?.getBindingContext("internal") as InternalModelContext)?.setProperty("getBoundMessagesForMassEdit", true);
		oController.messageHandler.showMessages({
			onBeforeShowMessage: function (messages: any, showMessageParameters: any) {
				//messages.concatenate(messageHandling.getMessages(true, true));
				showMessageParameters.fnGetMessageSubtitle = messageHandling.setMessageSubtitle.bind({}, oTable, aContexts);
				const unboundErrors: any[] = [];
				messages.forEach(function (message: any) {
					if (!message.getTarget()) {
						unboundErrors.push(message);
					}
				});

				if (aResults.length > 0 && errorContexts.length === 0) {
					oController.editFlow.setDraftStatus(DraftStatus.Saved);
					const successToast = oResourceBundle.getText("C_MASS_EDIT_SUCCESS_TOAST");
					MessageToast.show(successToast);
				} else if (errorContexts.length < (oTable as any).getSelectedContexts().length) {
					oController.editFlow.setDraftStatus(DraftStatus.Saved);
				} else if (errorContexts.length === (oTable as any).getSelectedContexts().length) {
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
			MassEditHelper.closeDialog(oInDialog);
			(oController.getView()?.getBindingContext("internal") as InternalModelContext)?.setProperty("skipPatchHandlers", false);
		}
		(oController.getView()?.getBindingContext("internal") as InternalModelContext)?.setProperty("getBoundMessagesForMassEdit", false);
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
	getSideEffectDataForKey: function (
		entitySetContext: ODataV4Context,
		appComponent: AppComponent,
		controller: PageController,
		results: ResultType[]
	): Record<string, MassEditFieldSideEffectDictionary> {
		const ownerEntityType = entitySetContext.getProperty("$Type");
		const baseSideEffectsMapArray: Record<string, MassEditFieldSideEffectDictionary> = {};

		results.forEach((result) => {
			const fieldGroupIds =
				appComponent.getSideEffectsService().computeFieldGroupIds(ownerEntityType, result.propertyFullyQualifiedName ?? "") ?? [];
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
	fnGetPathForSourceProperty: function (sPath: any, sEntityType: any, oMetaModel: any) {
		// if the property path has a navigation, get the target entity type of the navigation
		const sNavigationPath =
				sPath.indexOf("/") > 0 ? "/" + sEntityType + "/" + sPath.substr(0, sPath.lastIndexOf("/") + 1) + "@sapui.name" : false,
			pOwnerEntity = !sNavigationPath ? Promise.resolve(sEntityType) : oMetaModel.requestObject(sNavigationPath);
		sPath = sNavigationPath ? sPath.substr(sPath.lastIndexOf("/") + 1) : sPath;
		return { sPath, pOwnerEntity, sNavigationPath };
	},

	fnGetEntityTypeOfOwner: function (oMetaModel: any, baseNavPath: string, oEntitySetContext: any, targetEntity: string, aTargets: any) {
		const ownerEntityType = oEntitySetContext.getProperty("$Type");
		const { $Type: pOwner, $Partner: ownerNavPath } = oMetaModel.getObject(`${oEntitySetContext}/${baseNavPath}`); // nav path
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
	fnGetTargetsForMassEdit: function (sideEffectsData: ODataSideEffectsType, oEntitySetContext: any, sEntityType: any, oMetaModel: any) {
		const { targetProperties: aTargetProperties, targetEntities: aTargetEntities } = sideEffectsData;
		const aPromises: any = [];
		let aTargets: any = [];
		const ownerEntityType = oEntitySetContext.getProperty("$Type");

		if (sEntityType === ownerEntityType) {
			// if SalesOrdr Item
			aTargetEntities?.forEach((targetEntity: any) => {
				targetEntity = targetEntity["$NavigationPropertyPath"];
				let baseNavPath: string;
				if (targetEntity.includes("/")) {
					baseNavPath = targetEntity.split("/")[0];
				} else {
					baseNavPath = targetEntity;
				}
				aTargets = MassEditHelper.fnGetEntityTypeOfOwner(oMetaModel, baseNavPath, oEntitySetContext, targetEntity, aTargets);
			});
		}

		if (aTargetProperties.length) {
			aTargetProperties.forEach((targetProp: any) => {
				const { pOwnerEntity } = MassEditHelper.fnGetPathForSourceProperty(targetProp, sEntityType, oMetaModel);
				aPromises.push(
					pOwnerEntity.then((resultEntity: any) => {
						// if entity is SalesOrderItem, Target Property is from Items table
						if (resultEntity === ownerEntityType) {
							aTargets.push(targetProp); // get immediate targets
						} else if (targetProp.includes("/")) {
							const baseNavPath = targetProp.split("/")[0];
							aTargets = MassEditHelper.fnGetEntityTypeOfOwner(
								oMetaModel,
								baseNavPath,
								oEntitySetContext,
								targetProp,
								aTargets
							);
						}
						return Promise.resolve(aTargets);
					})
				);
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
	checkIfEntityExistsAsTargetEntity: (
		sideEffectsMap: MassEditFieldSideEffectDictionary | FieldSideEffectDictionary,
		oEntitySetContext: Context
	) => {
		const ownerEntityType = oEntitySetContext.getProperty("$Type");
		const sideEffectsOnOtherEntity: MassEditFieldSideEffectPropertyType[] = Object.values(sideEffectsMap).filter(
			(obj: MassEditFieldSideEffectPropertyType) => {
				return !obj.name.includes(ownerEntityType);
			}
		);

		const entitySetName = oEntitySetContext.getPath().split("/").pop();
		const sideEffectsWithCurrentEntityAsTarget = sideEffectsOnOtherEntity.filter((obj: MassEditFieldSideEffectPropertyType) => {
			const targetEntitiesArray: SideEffectsEntityType[] | undefined = obj.sideEffects.targetEntities;
			return targetEntitiesArray?.filter((innerObj: SideEffectsEntityType) => innerObj["$NavigationPropertyPath"] === entitySetName)
				.length
				? obj
				: false;
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
	handleMassEditFieldUpdateAndRequestSideEffects: async function (
		params: DataToUpdateFieldAndSideEffectsType
	): Promise<PromiseSettledResult<unknown>[]> {
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
					const fnGetImmediateTargetsAndActions = async (
						oDataSideEffect: ODataSideEffectsType
					): Promise<{
						aTargets: string[];
						TriggerAction: string | undefined;
					}> => {
						const targetsArrayForAllProperties = (await MassEditHelper.fnGetTargetsForMassEdit(
							oDataSideEffect,
							entitySetContext,
							sideEffectsEntityType,
							metaModel
						)) as string[][];
						let immediateTargets = targetsArrayForAllProperties[0];

						const actionName: string | undefined = oDataSideEffect.triggerAction;
						// The former implementation didn't work for the navigationProperty set into the targetEntities
						const deferredTargets = (oDataSideEffect.targetProperties ?? []).filter(
							(target) => !immediateTargets.includes(target)
						);

						// if entity is other than items table then action is deferred or the static action is on collection
						const triggerActionName =
							actionName &&
							sideEffectsEntityType === ownerEntityType &&
							!TableHelper._isStaticAction(metaModel.getObject(`/${actionName}`), actionName)
								? actionName
								: undefined;

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

					immediateSideEffectsPromises.push(
						controller._sideEffects.requestSideEffects(
							sideEffectsProperties.sideEffects,
							sideEffectsContext,
							groupId,
							fnGetImmediateTargetsAndActions
						)
					);
					controller._sideEffects.unregisterFailedSideEffects(
						sideEffectsProperties.sideEffects.fullyQualifiedName,
						sideEffectsContext
					);
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
						immediateSideEffectsPromises.push(
							controller._sideEffects.requestSideEffects(failedSideEffect, context as ODataV4Context)
						);
					}
				}
			}
		}
		if (textPaths?.[key] && textPaths[key].length) {
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
	createDialog: async function (oTable: Table, aContexts: ODataV4Context[], oController: PageController): Promise<Dialog> {
		const aDataArray: DialogData[] = [],
			oResourceBundle = Core.getLibraryResourceBundle("sap.fe.core"),
			oDefaultValues = MassEditHelper.getDefaultTextsForDialog(oResourceBundle, aContexts.length, oTable),
			oDataFieldModel = MassEditHelper.prepareDataForDialog(oTable, aContexts, aDataArray),
			dialogContext = MassEditHelper.getDialogContext(oTable),
			oDialogDataModel = MassEditHelper.setRuntimeModelOnDialog(aContexts, aDataArray, oDefaultValues, dialogContext),
			model = oTable.getModel() as ODataModel,
			metaModel = model.getMetaModel(),
			metaPath = metaModel.getMetaPath(dialogContext.getPath()),
			fragment = await MassEditHelper.createFragment(metaModel, oDataFieldModel, metaPath);
		const oDialogContent = await Fragment.load({ definition: fragment });
		const oDialog = new Dialog({
			resizable: true,
			title: oDefaultValues.massEditTitle,
			content: [oDialogContent as any],
			afterOpen: MassEditHelper.onDialogOpen,
			beginButton: new Button({
				text: MassEditHelper.helpers.getExpBindingForApplyButtonTxt(oDefaultValues, oDataFieldModel.getObject("/")),
				type: "Emphasized",
				press: async function (oEvent: any) {
					messageHandling.removeBoundTransitionMessages();
					messageHandling.removeUnboundTransitionMessages();
					(oController.getView()?.getBindingContext("internal") as InternalModelContext)?.setProperty("skipPatchHandlers", true);
					const appComponent = CommonUtils.getAppComponent(oController.getView());
					const oInDialog = oEvent.getSource().getParent();
					const oModel = oInDialog.getModel("fieldsInfo");
					const aResults = oModel.getProperty("/results") as ResultType[];

					const oMetaModel = oTable && (oTable.getModel() as ODataModel).getMetaModel(),
						sCurrentEntitySetName = oTable.data("metaPath"),
						oEntitySetContext = oMetaModel.getContext(sCurrentEntitySetName) as ODataV4Context;
					const errorContexts: any[] = [];
					const textPaths = oModel.getProperty("/textPaths");
					const aPropertyReadableInfo = oModel.getProperty("/readablePropertyData");
					let groupId: string;
					const massEditPromises: any = [];
					const failedFieldsData: any = {};
					const selectedRowsLength = aContexts.length;
					const deferredTargetsForAQualifiedName: any = {};
					const baseSideEffectsMapArray = MassEditHelper.getSideEffectDataForKey(
						oEntitySetContext,
						appComponent,
						oController,
						aResults
					);
					//const changePromise: any[] = [];
					//let bReadOnlyField = false;
					//const errorContexts: object[] = [];

					aContexts.forEach(function (selectedContext: ODataV4Context, idx: number) {
						aResults.forEach((result) => {
							if (!failedFieldsData.hasOwnProperty(result.keyValue)) {
								failedFieldsData[result.keyValue] = 0;
							}

							if (aPropertyReadableInfo) {
								aPropertyReadableInfo.some(function (oPropertyInfo: any) {
									if (result.keyValue === oPropertyInfo.property) {
										if (oPropertyInfo.type === "Default") {
											return oPropertyInfo.value === true;
										} else if (
											oPropertyInfo.type === "Path" &&
											oPropertyInfo.propertyValue &&
											oPropertyInfo.propertyPath
										) {
											return selectedContext.getObject(oPropertyInfo.propertyPath) === oPropertyInfo.propertyValue;
										}
									}
								});
							}
							groupId = `$auto.${idx}`;
							const fieldPromise = selectedContext
								.setProperty(result.keyValue, result.value, groupId)
								.catch(async (error: unknown) => {
									errorContexts.push(selectedContext.getObject());
									Log.error("Mass Edit: Something went wrong in updating entries.", error as string);
									failedFieldsData[result.keyValue] = failedFieldsData[result.keyValue] + 1;
									return Promise.reject({ isFieldUpdateFailed: true });
								});

							const dataToUpdateFieldAndSideEffects: DataToUpdateFieldAndSideEffectsType = {
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
							massEditPromises.push(
								MassEditHelper.handleMassEditFieldUpdateAndRequestSideEffects(dataToUpdateFieldAndSideEffects)
							);
						});
					});

					await Promise.allSettled(massEditPromises)
						.then(async function () {
							groupId = `$auto.massEditDeferred`;
							const deferredRequests = [];
							const sideEffectsDataForAllKeys: any = Object.values(deferredTargetsForAQualifiedName);
							const keysWithSideEffects: any[] = Object.keys(deferredTargetsForAQualifiedName);

							sideEffectsDataForAllKeys.forEach((aSideEffect: any, index: any) => {
								const currentKey = keysWithSideEffects[index];
								if (failedFieldsData[currentKey] !== selectedRowsLength) {
									const deferredSideEffectsData = Object.values(aSideEffect);
									deferredSideEffectsData.forEach((req: any) => {
										const { aTargets, oContext, TriggerAction, mSideEffect } = req;
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
											oController._sideEffects.requestSideEffects(
												mSideEffect,
												oContext,
												groupId,
												fnGetDeferredTargetsAndActions
											)
										);
									});
								}
							});
						})
						.then(function () {
							MassEditHelper.messageHandlingForMassEdit(oTable, aContexts, oController, oInDialog, aResults, errorContexts);
						})
						.catch((e: any) => {
							MassEditHelper.closeDialog(oDialog);
							return Promise.reject(e);
						});
				}
			}),
			endButton: new Button({
				text: oDefaultValues.cancelButtonText,
				visible: MassEditHelper.helpers.hasEditableFieldsBinding(oDataFieldModel.getObject("/"), true),
				press: function (oEvent: any) {
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

	createFragment: async function (metaModel: ODataMetaModel, dataFieldModel: JSONModel, metaPath: string): Promise<Element> {
		const fragmentName = "sap/fe/core/controls/massEdit/MassEditDialog",
			itemsModel = new TemplateModel(dataFieldModel.getData(), metaModel),
			fragment = XMLTemplateProcessor.loadTemplate(fragmentName, "fragment");
		return Promise.resolve(
			XMLPreprocessor.process(
				fragment,
				{ name: fragmentName },
				{
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
				}
			)
		);
	},

	helpers: {
		getBindingExpForHasEditableFields: (fields: any, editable: boolean) => {
			const totalExp = fields.reduce(
				(expression: any, field: any) =>
					or(
						expression,
						pathInModel("/values/" + field.dataProperty + "/visible", "fieldsInfo") as BindingToolkitExpression<boolean>
					),
				constant(false)
			);
			return editable ? totalExp : not(totalExp);
		},

		getExpBindingForApplyButtonTxt: (defaultValues: any, fields: boolean) => {
			const editableExp = MassEditHelper.helpers.getBindingExpForHasEditableFields(fields, true);
			const totalExp = ifElse(editableExp, constant(defaultValues.applyButtonText), constant(defaultValues.okButtonText));
			return compileExpression(totalExp);
		},

		hasEditableFieldsBinding: (fields: any, editable: boolean) => {
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

export default MassEditHelper;
