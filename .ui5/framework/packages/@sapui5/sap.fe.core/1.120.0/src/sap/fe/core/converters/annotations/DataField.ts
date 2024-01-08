import type { AnnotationTerm, PathAnnotationExpression, PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import type { Contact } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import { CommunicationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldForActionAbstractTypes,
	DataFieldForAnnotation,
	DataFieldForAnnotationTypes,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	DataPoint,
	DataPointType,
	FieldGroup
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { ColumnExportSettings, TableType } from "sap/fe/core/converters/controls/Common/Table";
import { isAnnotationOfType, isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import { getDisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import {
	getAssociatedCurrencyProperty,
	getAssociatedTimezoneProperty,
	getAssociatedUnitProperty
} from "sap/fe/core/templating/PropertyHelper";
import type { DataModelObjectPath } from "../../templating/DataModelPathHelper";
import type ConverterContext from "../ConverterContext";
import { isReferencePropertyStaticallyHidden } from "../helpers/DataFieldHelper";

export type ComplexPropertyInfo = {
	properties: Record<string, Property>;
	additionalProperties: Record<string, Property>;
	exportSettings: ColumnExportSettings;
	textOnlyPropertiesFromTextAnnotation: string[];
};

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForActionAbstract".
 * DataFieldForActionAbstract has an inline action defined.
 *
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForActionAbstractType
 */
export function isDataFieldForActionAbstract(dataField: DataFieldAbstractTypes): dataField is DataFieldForActionAbstractTypes {
	return (dataField as DataFieldForActionAbstractTypes).hasOwnProperty("Action");
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "isDataFieldForAnnotation".
 * isDataFieldForAnnotation has an inline $Type property that can be used.
 *
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForAnnotation
 */
export function isDataFieldForAnnotation(dataField: DataFieldAbstractTypes | undefined): dataField is DataFieldForAnnotation {
	return dataField?.$Type === UIAnnotationTypes.DataFieldForAnnotation;
}

export function isDataFieldForAction(dataField: DataFieldAbstractTypes | undefined): dataField is DataFieldForAction {
	return dataField?.$Type === UIAnnotationTypes.DataFieldForAction;
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldForIntentBasedNavigation".
 * DataFieldForIntentBasedNavigation has an inline $Type property that can be used.
 *
 * @param dataField DataField to be evaluated
 * @returns Validates that dataField is a DataFieldForIntentBasedNavigation
 */
export function isDataFieldForIntentBasedNavigation(dataField: DataFieldAbstractTypes): dataField is DataFieldForIntentBasedNavigation {
	return dataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation;
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
 * DataField has a value defined.
 *
 * @param dataField DataField to be evaluated
 * @returns Validate that dataField is a DataFieldTypes
 */
export function isDataFieldTypes(dataField: DataFieldAbstractTypes | unknown): dataField is DataFieldTypes {
	return (dataField as DataFieldTypes).hasOwnProperty("Value");
}

/**
 * Identifies if the given dataFieldAbstract that is passed is a "DataField".
 * DataField has a value defined.
 *
 * @param dataField DataField to be evaluated
 * @returns Validate that dataField is a DataField
 */
export function isDataField(dataField: DataField | unknown): dataField is DataField {
	return (dataField as DataField).hasOwnProperty("Value");
}

/**
 * Determines if the dataFieldForAnnotation is a field group.
 *
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if the dataFieldForAnnotation is a field group.
 */
export function hasFieldGroupTarget(dataFieldForAnnotation: DataFieldForAnnotation): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	return isAnnotationOfType<FieldGroup>(dataFieldTarget, UIAnnotationTypes.FieldGroupType);
}

/**
 * Determines if the dataFieldForAnnotation is a data point.
 *
 * @param dataFieldForAnnotation The dataFieldForAnnotation being processed
 * @returns True if the dataFieldForAnnotation is a data point.
 */
export function hasDataPointTarget(dataFieldForAnnotation: DataFieldForAnnotation): boolean {
	const dataFieldTarget = dataFieldForAnnotation.Target.$target;
	return isAnnotationOfType<DataPoint>(dataFieldTarget, UIAnnotationTypes.DataPointType);
}

/**
 * Determine if the data model object path targeting a dataField for action opens up a dialog.
 *
 * @param dataModelObjectPath DataModelObjectPath
 * @returns `Dialog` | `None` if a dialog is needed
 */
export function isDataModelObjectPathForActionWithDialog(dataModelObjectPath: DataModelObjectPath) {
	const target = dataModelObjectPath.targetObject;
	return isActionWithDialog(isDataFieldForAction(target) ? target : undefined);
}

/**
 * Determine if the dataField for action opens up a dialog.
 *
 * @param dataField DataField for action
 * @returns `Dialog` | `None` if a dialog is needed
 */
export function isActionWithDialog(dataField?: DataFieldForAction): "Dialog" | "None" {
	const action = dataField?.ActionTarget;
	if (action) {
		const bCritical = action.annotations?.Common?.IsActionCritical;
		if (action.parameters.length > 1 || bCritical) {
			return "Dialog";
		} else {
			return "None";
		}
	} else {
		return "None";
	}
}

/**
 * Retrieves the TargetValue from a DataPoint.
 *
 * @param source The target property or DataPoint
 * @returns The TargetValue as a decimal or a property path
 */

export function getTargetValueOnDataPoint(source: Property | DataPointType): PathAnnotationExpression<unknown> | string {
	let targetValue: unknown;
	if (isProperty(source)) {
		targetValue =
			((source.annotations?.UI?.DataFieldDefault as DataFieldForAnnotationTypes)?.Target?.$target as DataPointType)?.TargetValue ??
			((source.annotations?.UI?.DataFieldDefault as DataFieldForAnnotationTypes)?.Target?.$target as DataPointType)?.MaximumValue;
	} else {
		targetValue = source.TargetValue ?? source.MaximumValue;
	}
	if (typeof targetValue === "number") {
		return targetValue.toString();
	}
	return isPathAnnotationExpression(targetValue) ? targetValue : "100";
}

/**
 * Check if a property uses a DataPoint within a DataFieldDefault.
 *
 * @param property The property to be checked
 * @returns `true` if the referenced property has a DataPoint within the DataFieldDefault, false else
 */

export const isDataPointFromDataFieldDefault = function (property: Property): boolean {
	return (
		(property.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType
	);
};

/**
 * Check if a property uses a default visualization Rating through a DataFieldDefault.
 *
 * @param property The property to be checked
 * @returns `true` if the visualization through a DataFieldDefault is a Rating
 */

export const isRatingVisualizationFromDataFieldDefault = function (property: Property): boolean {
	return (
		isDataPointFromDataFieldDefault(property) &&
		((property.annotations?.UI?.DataFieldDefault as DataFieldForAnnotation)?.Target?.$target as AnnotationTerm<DataPoint>)
			?.Visualization === "UI.VisualizationType/Rating"
	);
};

export function getSemanticObjectPath(converterContext: ConverterContext, object: DataFieldAbstractTypes | Property): string | undefined {
	if (typeof object === "object") {
		if (isDataFieldTypes(object) && object.Value?.$target) {
			const property = object.Value?.$target;
			if (property?.annotations?.Common?.SemanticObject !== undefined) {
				return converterContext.getEntitySetBasedAnnotationPath(property?.fullyQualifiedName);
			}
		} else if (isProperty(object)) {
			if (object?.annotations?.Common?.SemanticObject !== undefined) {
				return converterContext.getEntitySetBasedAnnotationPath(object?.fullyQualifiedName);
			}
		}
	}
	return undefined;
}

/**
 * Returns the navigation path prefix for a property path.
 *
 * @param path The property path For e.g. /EntityType/Navigation/Property
 * @returns The navigation path prefix For e.g. /EntityType/Navigation/
 */
function _getNavigationPathPrefix(path: string | undefined): string {
	if (path) {
		return path.includes("/") ? path.substring(0, path.lastIndexOf("/") + 1) : "";
	}
	return "";
}

/**
 * Collect additional properties for the ALP table use-case.
 *
 * For e.g. If UI.Hidden points to a property, include this property in the additionalProperties of ComplexPropertyInfo object.
 *
 * @param target Property or DataField being processed
 * @param navigationPathPrefix Navigation path prefix, applicable in case of navigation properties.
 * @param tableType Table type.
 * @param relatedProperties The related properties identified so far.
 * @returns The related properties identified.
 */
function _collectAdditionalPropertiesForAnalyticalTable(
	target: PrimitiveType,
	navigationPathPrefix: string,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo
): ComplexPropertyInfo {
	if (tableType === "AnalyticalTable") {
		const hiddenAnnotation = target.annotations?.UI?.Hidden;
		if (hiddenAnnotation?.path && isProperty(hiddenAnnotation.$target)) {
			const hiddenAnnotationPropertyPath = navigationPathPrefix + hiddenAnnotation.path;
			// This property should be added to additionalProperties map for the ALP table use-case.
			relatedProperties.additionalProperties[hiddenAnnotationPropertyPath] = hiddenAnnotation.$target;
		}

		const criticality = target.Criticality;
		if (criticality?.path && isProperty(criticality?.$target)) {
			const criticalityPropertyPath = navigationPathPrefix + criticality.path;
			relatedProperties.additionalProperties[criticalityPropertyPath] = criticality?.$target;
		}
	}
	return relatedProperties;
}

/**
 * Collect related properties from a property's annotations.
 *
 * @param path The property path
 * @param property The property to be considered
 * @param converterContext The converter context
 * @param ignoreSelf Whether to exclude the same property from the related properties.
 * @param tableType The table type.
 * @param relatedProperties The related properties identified so far.
 * @param addUnitInTemplate True if the unit/currency property needs to be added in the export template
 * @param isAnnotatedAsHidden True if the DataField or the property are statically hidden
 * @returns The related properties identified.
 */
export function collectRelatedProperties(
	path: string,
	property: PrimitiveType,
	converterContext: ConverterContext,
	ignoreSelf: boolean,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo = {
		properties: {},
		additionalProperties: {},
		exportSettings: {},
		textOnlyPropertiesFromTextAnnotation: []
	},
	addUnitInTemplate = false,
	isAnnotatedAsHidden = false
): ComplexPropertyInfo {
	/**
	 * Helper to push unique related properties.
	 *
	 * @param key The property path
	 * @param value The properties object containing value property, description property...
	 * @returns Index at which the property is available
	 */
	function _pushUnique(key: string, value: Property): number {
		if (!relatedProperties.properties.hasOwnProperty(key)) {
			relatedProperties.properties[key] = value;
		}
		return Object.keys(relatedProperties.properties).indexOf(key);
	}

	/**
	 * Helper to append the export settings template with a formatted text.
	 *
	 * @param value Formatted text
	 */
	function _appendTemplate(value: string) {
		relatedProperties.exportSettings.template = relatedProperties.exportSettings?.template
			? `${relatedProperties.exportSettings?.template}${value}`
			: `${value}`;
	}
	if (path && property) {
		let valueIndex: number;
		let targetValue: string | PathAnnotationExpression<unknown>;
		let currencyOrUoMIndex: number;
		let timezoneOrUoMIndex: number;
		let dataPointIndex: number;
		if (isAnnotatedAsHidden) {
			// Collect underlying property
			valueIndex = _pushUnique(path, property);
			_appendTemplate(`{${valueIndex}}`);
			return relatedProperties;
		}
		const navigationPathPrefix = _getNavigationPathPrefix(path);

		// Check for Text annotation.
		const textAnnotation = property.annotations?.Common?.Text;

		if (relatedProperties.exportSettings?.template) {
			// FieldGroup use-case. Need to add each Field in new line.
			_appendTemplate("\n");
			relatedProperties.exportSettings.wrap = true;
		}

		if (textAnnotation?.path && textAnnotation?.$target) {
			// Check for Text Arrangement.
			const dataModelObjectPath = converterContext.getDataModelObjectPath();
			const textAnnotationPropertyPath = navigationPathPrefix + textAnnotation.path;
			const displayMode = getDisplayMode(property, dataModelObjectPath);
			let descriptionIndex: number;
			switch (displayMode) {
				case "Value":
					valueIndex = _pushUnique(path, property);
					_appendTemplate(`{${valueIndex}}`);
					break;

				case "Description":
					descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
					_appendTemplate(`{${descriptionIndex}}`);
					relatedProperties.textOnlyPropertiesFromTextAnnotation.push(textAnnotationPropertyPath);
					break;

				case "ValueDescription":
					valueIndex = _pushUnique(path, property);
					descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
					_appendTemplate(`{${valueIndex}} ({${descriptionIndex}})`);
					break;

				case "DescriptionValue":
					valueIndex = _pushUnique(path, property);
					descriptionIndex = _pushUnique(textAnnotationPropertyPath, textAnnotation.$target);
					_appendTemplate(`{${descriptionIndex}} ({${valueIndex}})`);
					break;
				// no default
			}
		} else {
			// Check for field containing Currency Or Unit Properties or Timezone
			const currencyProperty = getAssociatedCurrencyProperty(property);
			const unitProperty = getAssociatedUnitProperty(property);
			const currencyOrUoMProperty = currencyProperty || unitProperty;
			const currencyOrUnitAnnotation = property?.annotations?.Measures?.ISOCurrency || property?.annotations?.Measures?.Unit;
			const timezoneProperty = getAssociatedTimezoneProperty(property);
			const timezoneAnnotation = property?.annotations?.Common?.Timezone;

			if (currencyOrUoMProperty) {
				valueIndex = _pushUnique(path, property);
				currencyOrUoMIndex = _pushUnique(navigationPathPrefix + currencyOrUnitAnnotation.path, currencyOrUnitAnnotation.$target);
				if (addUnitInTemplate) {
					_appendTemplate(`{${valueIndex}}  {${currencyOrUoMIndex}}`);
				} else {
					relatedProperties.exportSettings.unitProperty = navigationPathPrefix + currencyOrUnitAnnotation.path;
				}
				if (currencyProperty) {
					relatedProperties.exportSettings.isCurrency = true;
				}
			} else if (timezoneProperty && timezoneAnnotation?.$target) {
				valueIndex = _pushUnique(path, property);
				timezoneOrUoMIndex = _pushUnique(navigationPathPrefix + timezoneAnnotation.path, timezoneAnnotation.$target);
				if (addUnitInTemplate) {
					_appendTemplate(`{${valueIndex}}  {${timezoneOrUoMIndex}}`);
				} else {
					relatedProperties.exportSettings.timezoneProperty = navigationPathPrefix + timezoneAnnotation.path;
				}
			} else if (
				(property.Target?.$target?.$Type === UIAnnotationTypes.DataPointType && !property.Target?.$target?.ValueFormat) ||
				property.annotations?.UI?.DataFieldDefault?.Target?.$target?.$Type === UIAnnotationTypes.DataPointType
			) {
				const dataPointProperty = property.Target?.$target?.Value.$target as Property;
				const datapointTarget = property.Target?.$target;
				// DataPoint use-case using DataFieldDefault.
				const dataPointDefaultProperty = property.annotations?.UI?.DataFieldDefault;
				valueIndex = _pushUnique(
					navigationPathPrefix ? navigationPathPrefix + path : path,
					dataPointDefaultProperty ? property : dataPointProperty
				);
				targetValue = getTargetValueOnDataPoint(dataPointDefaultProperty ? property : datapointTarget);
				if (isPathAnnotationExpression(targetValue)) {
					if (targetValue.$target) {
						//in case it's a dynamic targetValue
						dataPointIndex = _pushUnique(
							navigationPathPrefix ? navigationPathPrefix + targetValue.$target.name : targetValue.$target.name,
							targetValue.$target
						);
						_appendTemplate(`{${valueIndex}}/{${dataPointIndex}}`);
					}
				} else {
					relatedProperties.exportSettings.dataPointTargetValue = targetValue;
					_appendTemplate(`{${valueIndex}}/${targetValue}`);
				}
			} else if (property.$Type === CommunicationAnnotationTypes.ContactType) {
				const contactProperty = property.fn?.$target;
				const contactPropertyPath = property.fn?.path;
				valueIndex = _pushUnique(
					navigationPathPrefix ? navigationPathPrefix + contactPropertyPath : contactPropertyPath,
					contactProperty
				);
				_appendTemplate(`{${valueIndex}}`);
			} else if (!ignoreSelf) {
				// Collect underlying property
				valueIndex = _pushUnique(path, property);
				_appendTemplate(`{${valueIndex}}`);
				if (currencyOrUnitAnnotation) {
					relatedProperties.exportSettings.unit = `${currencyOrUnitAnnotation}`; // Hard-coded currency/unit
					if (property?.annotations?.Measures?.ISOCurrency) {
						relatedProperties.exportSettings.isCurrency = true;
					}
				} else if (timezoneAnnotation) {
					relatedProperties.exportSettings.timezone = `${timezoneAnnotation}`; // Hard-coded timezone
				}
			}
		}

		relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(property, navigationPathPrefix, tableType, relatedProperties);
		if (Object.keys(relatedProperties.additionalProperties).length > 0 && Object.keys(relatedProperties.properties).length === 0) {
			// Collect underlying property if not collected already.
			// This is to ensure that additionalProperties are made available only to complex property infos.
			valueIndex = _pushUnique(path, property);
			_appendTemplate(`{${valueIndex}}`);
		}
	}
	return relatedProperties;
}

/**
 * Collect properties consumed by a DataField.
 * This is for populating the ComplexPropertyInfos of the table delegate.
 *
 * @param dataField The DataField for which the properties need to be identified.
 * @param converterContext The converter context.
 * @param tableType The table type.
 * @param relatedProperties The properties identified so far.
 * @param isEmbedded True if the DataField is embedded in another annotation (e.g. FieldGroup).
 * @returns The properties related to the DataField.
 */
export function collectRelatedPropertiesRecursively(
	dataField: DataFieldAbstractTypes,
	converterContext: ConverterContext,
	tableType: TableType,
	relatedProperties: ComplexPropertyInfo = {
		properties: {},
		additionalProperties: {},
		textOnlyPropertiesFromTextAnnotation: [],
		exportSettings: {}
	},
	isEmbedded = false
): ComplexPropertyInfo {
	let isStaticallyHidden = false;
	switch (dataField?.$Type) {
		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			if (dataField.Value) {
				const property = dataField.Value;
				isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
				relatedProperties = collectRelatedProperties(
					property.path,
					property.$target,
					converterContext,
					false,
					tableType,
					relatedProperties,
					isEmbedded,
					isStaticallyHidden
				);
				const navigationPathPrefix = _getNavigationPathPrefix(property.path);
				relatedProperties = _collectAdditionalPropertiesForAnalyticalTable(
					dataField,
					navigationPathPrefix,
					tableType,
					relatedProperties
				);
			}
			break;

		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			break;

		case UIAnnotationTypes.DataFieldForAnnotation:
			switch (dataField.Target?.$target?.$Type) {
				case UIAnnotationTypes.FieldGroupType:
					dataField.Target.$target.Data?.forEach((innerDataField: DataFieldAbstractTypes) => {
						relatedProperties = collectRelatedPropertiesRecursively(
							innerDataField,
							converterContext,
							tableType,
							relatedProperties,
							true
						);
					});
					break;

				case UIAnnotationTypes.DataPointType:
					isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
					relatedProperties = collectRelatedProperties(
						dataField.Target.$target.Value.path,
						dataField,
						converterContext,
						false,
						tableType,
						relatedProperties,
						isEmbedded,
						isStaticallyHidden
					);
					break;

				case CommunicationAnnotationTypes.ContactType:
					const dataFieldContact = dataField.Target.$target as Contact;
					isStaticallyHidden = isReferencePropertyStaticallyHidden(dataField);
					relatedProperties = collectRelatedProperties(
						dataField.Target.value,
						dataFieldContact,
						converterContext,
						isStaticallyHidden,
						tableType,
						relatedProperties,
						isEmbedded,
						isStaticallyHidden
					);
					break;
				default:
					break;
			}
			break;

		default:
			break;
	}

	return relatedProperties;
}

export const getDataFieldDataType = function (oDataField: DataFieldAbstractTypes | Property): string | undefined {
	if (isProperty(oDataField)) {
		return oDataField.type;
	}
	let sDataType: string | undefined;
	switch (oDataField.$Type) {
		case UIAnnotationTypes.DataFieldForActionGroup:
		case UIAnnotationTypes.DataFieldWithActionGroup:
		case UIAnnotationTypes.DataFieldForAction:
		case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
			sDataType = undefined;
			break;

		case UIAnnotationTypes.DataField:
		case UIAnnotationTypes.DataFieldWithNavigationPath:
		case UIAnnotationTypes.DataFieldWithUrl:
		case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
		case UIAnnotationTypes.DataFieldWithAction:
			sDataType = (oDataField as DataField)?.Value?.$target?.type;
			break;

		case UIAnnotationTypes.DataFieldForAnnotation:
		default:
			if (oDataField.Target?.$target?.$Type) {
				const dataFieldTarget = oDataField.Target.$target;
				if (dataFieldTarget.$Type === CommunicationAnnotationTypes.ContactType && isPathAnnotationExpression(dataFieldTarget.fn)) {
					sDataType = dataFieldTarget.fn.$target?.type;
				} else if (dataFieldTarget.$Type === UIAnnotationTypes.DataPointType) {
					sDataType = dataFieldTarget.Value?.$Path?.$Type || dataFieldTarget.Value?.$target?.type;
				} else {
					// e.g. FieldGroup or Chart
					// FieldGroup Properties have no type, so we define it as a boolean type to prevent exceptions during the calculation of the width
					sDataType =
						oDataField.Target.$target.$Type === "com.sap.vocabularies.UI.v1.ChartDefinitionType" ? undefined : "Edm.Boolean";
				}
			} else {
				sDataType = undefined;
			}
			break;
	}

	return sDataType;
};
