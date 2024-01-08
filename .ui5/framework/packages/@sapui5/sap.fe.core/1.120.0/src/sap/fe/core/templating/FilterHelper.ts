import type { Property } from "@sap-ux/vocabularies-types";
import type { SelectionRangeTypeTypes, SelectionVariantTypeTypes, SelectOptionType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { hasValueHelp } from "sap/fe/core/templating/PropertyHelper";
import type { DefaultTypeForEdmType } from "sap/fe/core/type/EDM";
import { isTypeFilterable } from "sap/fe/core/type/EDM";
import type { SelectOption } from "sap/fe/navigation/SelectionVariant";
import type UI5Date from "sap/ui/core/date/UI5Date";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import Condition from "sap/ui/mdc/condition/Condition";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

export type FilterConditions = {
	operator: string;
	values: Array<string>;
	isEmpty?: boolean | null;
	validated?: string;
	isParameter?: boolean;
};

type ConditionValue = string | number | boolean | Date | UI5Date | undefined | null;

const oExcludeMap: Record<string, any> = {
	Contains: "NotContains",
	StartsWith: "NotStartsWith",
	EndsWith: "NotEndsWith",
	Empty: "NotEmpty",
	NotEmpty: "Empty",
	LE: "NOTLE",
	GE: "NOTGE",
	LT: "NOTLT",
	GT: "NOTGT",
	BT: "NOTBT",
	NE: "EQ",
	EQ: "NE"
};

export function _getDateTimeOffsetCompliantValue(sValue: any): string | undefined {
	let oValue;
	if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})\+(\d{1,4})/)) {
		oValue = sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})\+(\d{1,4})/)[0];
	} else if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})/)) {
		oValue = `${sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})/)[0]}+0000`;
	} else if (sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)) {
		oValue = `${sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)[0]}T00:00:00+0000`;
	} else if (sValue.indexOf("Z") === sValue.length - 1) {
		oValue = `${sValue.split("Z")[0]}+0100`;
	} else {
		oValue = undefined;
	}
	return oValue;
}

export function _getDateCompliantValue(sValue: any): string | undefined {
	return sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
		? sValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)[0]
		: sValue.match(/^(\d{8})/) && sValue.match(/^(\d{8})/)[0];
}

/**
 * Method to get the compliant value type based on the data type.
 *
 * @param  sValue Raw value
 * @param  sType The property type
 * @param  option The operation to consider
 * @returns Value to be propagated to the condition.
 */

export function getTypeCompliantValue(value: ConditionValue, edmType: string, option: string): ConditionValue {
	if (!isTypeFilterable(edmType as keyof typeof DefaultTypeForEdmType) || !option) {
		return undefined;
	}

	if (value === undefined || value === null) {
		return value;
	}
	let retValue: ConditionValue = value;
	switch (edmType) {
		case "Edm.Boolean":
			if (typeof value === "boolean") {
				retValue = value;
			} else {
				retValue = value === "true" || (value === "false" ? false : undefined);
			}
			break;
		case "Edm.Double":
		case "Edm.Single":
			if (value === "" && option === "EQ") {
				// the operator will be calulcated as empty
				break;
			}
			const numFloat = Number(value);
			retValue = isNaN(numFloat) ? undefined : parseFloat(value.toString());
			break;
		case "Edm.Byte":
		case "Edm.Int16":
		case "Edm.Int32":
		case "Edm.SByte":
			if (retValue === "" && option === "EQ") {
				// the operator will be calulcated as empty
				break;
			}
			const numInt = Number(value);
			retValue = isNaN(numInt) ? undefined : parseInt(value.toString(), 10);
			break;
		case "Edm.Date":
			retValue = _getDateCompliantValue(value);
			break;
		case "Edm.DateTimeOffset":
			retValue = _getDateTimeOffsetCompliantValue(value);
			break;
		case "Edm.TimeOfDay":
			retValue = value.toString().match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/)
				? value.toString().match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/)?.[0]
				: undefined;
			break;
		default:
	}

	return retValue === null ? undefined : retValue;
}

/**
 * Method to create a condition.
 *
 * @param  sOption Operator to be used.
 * @param  oV1 Lower value
 * @param  oV2 Higher value
 * @param sSign
 * @returns Condition to be created
 */
export function resolveConditionValues(sOption: string | undefined, oV1: any, oV2: any, sSign: string | undefined) {
	let oValue = oV1,
		oValue2,
		sInternalOperation: any;
	if (oV1 === undefined || oV1 === null) {
		return undefined;
	}

	switch (sOption) {
		case "CP":
			sInternalOperation = "Contains";
			if (oValue) {
				const nIndexOf = oValue.indexOf("*");
				const nLastIndex = oValue.lastIndexOf("*");

				// only when there are '*' at all
				if (nIndexOf > -1) {
					if (nIndexOf === 0 && nLastIndex !== oValue.length - 1) {
						sInternalOperation = "EndsWith";
						oValue = oValue.substring(1, oValue.length);
					} else if (nIndexOf !== 0 && nLastIndex === oValue.length - 1) {
						sInternalOperation = "StartsWith";
						oValue = oValue.substring(0, oValue.length - 1);
					} else {
						oValue = oValue.substring(1, oValue.length - 1);
					}
				} else {
					Log.warning("Contains Option cannot be used without '*'.");
					return undefined;
				}
			}
			break;
		case "EQ":
			sInternalOperation = oV1 === "" ? "Empty" : sOption;
			break;
		case "NE":
			sInternalOperation = oV1 === "" ? "NotEmpty" : sOption;
			break;
		case "BT":
			if (oV2 === undefined || oV2 === null) {
				return;
			}
			oValue2 = oV2;
			sInternalOperation = sOption;
			break;
		case "LE":
		case "GE":
		case "GT":
		case "LT":
			sInternalOperation = sOption;
			break;
		default:
			Log.warning(`Selection Option is not supported : '${sOption}'`);
			return undefined;
	}
	if (sSign === "E") {
		sInternalOperation = oExcludeMap[sInternalOperation];
	}
	const condition: FilterConditions = {
		values: [],
		isEmpty: null,
		operator: sInternalOperation
	};
	if (sInternalOperation !== "Empty") {
		condition.values.push(oValue);
		if (oValue2) {
			condition.values.push(oValue2);
		}
	}
	return condition;
}

/* Method to get the Range property from the Selection Option */
export function getRangeProperty(sProperty: string): string {
	return sProperty.indexOf("/") > 0 ? sProperty.split("/")[1] : sProperty;
}

function _buildConditionsFromSelectionRanges(
	Ranges: SelectionRangeTypeTypes[],
	property: Property,
	propertyName: string,
	getCustomConditions?: Function
): ConditionObject[] {
	const conditions: ConditionObject[] = [];
	const hasValueHelpAnnotation = hasValueHelp(property);
	Ranges?.forEach((Range: SelectionRangeTypeTypes) => {
		const oCondition = getCustomConditions
			? getCustomConditions(Range, property, propertyName)
			: getConditions(Range, property.type, hasValueHelpAnnotation);
		if (oCondition) {
			conditions.push(oCondition);
		}
	});
	return conditions;
}

/**
 * Method to get the concerned property for the property path.
 *
 * @param  propertyPath Relative property path from annotations
 * @param  metaModel Metamodel
 * @param  entitySetPath Filter bar entitySet path
 * @returns Property if found.
 */
function _getProperty(propertyPath: string, metaModel: ODataMetaModel, entitySetPath: string): Property | undefined {
	const propertyContext = metaModel.getMetaContext(`${entitySetPath}/${propertyPath}`),
		dataModelObjectPath = getInvolvedDataModelObjects(propertyContext);

	return dataModelObjectPath.targetObject;
}

function _buildFiltersConditionsFromSelectOption(
	selectOption: SelectOptionType,
	metaModel: ODataMetaModel,
	entitySetPath: string,
	getCustomConditions?: Function
): Record<string, FilterConditions[]> {
	const propertyName: any = selectOption.PropertyName,
		filterConditions: Record<string, FilterConditions[]> = {},
		propertyPath: string = propertyName.value || propertyName.$PropertyPath,
		Ranges: SelectionRangeTypeTypes[] = selectOption.Ranges;
	const targetProperty = _getProperty(propertyPath, metaModel, entitySetPath);
	if (targetProperty) {
		const conditions: any[] = _buildConditionsFromSelectionRanges(Ranges, targetProperty, propertyPath, getCustomConditions);
		if (conditions.length) {
			filterConditions[propertyPath] = (filterConditions[propertyPath] || []).concat(conditions);
		}
	}
	return filterConditions;
}

export function getFiltersConditionsFromSelectionVariant(
	sEntitySetPath: string,
	oMetaModel: ODataMetaModel,
	selectionVariant: SelectionVariantTypeTypes,
	getCustomConditions?: Function
): Record<string, FilterConditions[]> {
	let oFilterConditions: Record<string, FilterConditions[]> = {};
	if (!selectionVariant) {
		return oFilterConditions;
	}
	const aSelectOptions = selectionVariant.SelectOptions,
		aParameters = selectionVariant.Parameters;
	aSelectOptions?.forEach((selectOption: SelectOptionType) => {
		const propertyName: any = selectOption.PropertyName,
			sPropertyName: string = propertyName.value || propertyName.$PropertyPath;
		if (Object.keys(oFilterConditions).includes(sPropertyName)) {
			oFilterConditions[sPropertyName] = oFilterConditions[sPropertyName].concat(
				_buildFiltersConditionsFromSelectOption(selectOption, oMetaModel, sEntitySetPath, getCustomConditions)[sPropertyName]
			);
		} else {
			oFilterConditions = {
				...oFilterConditions,
				..._buildFiltersConditionsFromSelectOption(selectOption, oMetaModel, sEntitySetPath, getCustomConditions)
			};
		}
	});
	aParameters?.forEach((parameter: any) => {
		const sPropertyPath = parameter.PropertyName.value || parameter.PropertyName.$PropertyPath;
		const oCondition: any = getCustomConditions
			? { operator: "EQ", value1: parameter.PropertyValue, value2: null, path: sPropertyPath, isParameter: true }
			: {
					operator: "EQ",
					values: [parameter.PropertyValue],
					isEmpty: null,
					validated: ConditionValidated.Validated,
					isParameter: true
			  };
		oFilterConditions[sPropertyPath] = [oCondition];
	});

	return oFilterConditions;
}

export function getConditions(selectOption: SelectOption, edmType: string, hasValueHelpAnnotation: boolean): ConditionObject | undefined {
	let condition;

	try {
		const sign: string = getRangeProperty(selectOption.Sign);
		const option: string = getRangeProperty(selectOption.Option);
		const value1 = getTypeCompliantValue(selectOption.Low, edmType, option);
		const value2 = selectOption.High ? getTypeCompliantValue(selectOption.High, edmType, option) : undefined;
		const conditionValues = resolveConditionValues(option, value1, value2, sign);
		if (conditionValues) {
			// 1. Conditions with EQ operator of properties with VH need to be set Validated, they are shown in VH Panel.
			// 2. Other conditions of properties without VH or non-EQ operators cannot be represented in VH panel, they will be in Define Conditions Panel. These are set NotValidated.
			const validated =
				hasValueHelpAnnotation && conditionValues.operator === "EQ"
					? ConditionValidated.Validated
					: ConditionValidated.NotValidated;
			condition = Condition.createCondition(conditionValues.operator, conditionValues.values, null, null, validated);
		}
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		Log.error(`FE : Core : FilterHelper : getConditions : ${message}`);
	}

	return condition;
}

const getDefaultValueFilters = function (oContext: any, properties: any): Record<string, FilterConditions[]> {
	const filterConditions: Record<string, FilterConditions[]> = {};
	const entitySetPath = oContext.getInterface(1).getPath(),
		oMetaModel = oContext.getInterface(1).getModel();
	if (properties) {
		for (const key in properties) {
			const defaultFilterValue = oMetaModel.getObject(`${entitySetPath}/${key}@com.sap.vocabularies.Common.v1.FilterDefaultValue`);
			if (defaultFilterValue !== undefined) {
				const PropertyName = key;
				filterConditions[PropertyName] = [
					Condition.createCondition("EQ", [defaultFilterValue], null, null, ConditionValidated.Validated) as FilterConditions
				];
			}
		}
	}
	return filterConditions;
};

const getDefaultSemanticDateFilters = function (
	oContext: any,
	properties: any,
	defaultSemanticDates: any
): Record<string, FilterConditions[]> {
	const filterConditions: Record<string, FilterConditions[]> = {};
	const oInterface = oContext.getInterface(1);
	const oMetaModel = oInterface.getModel();
	const sEntityTypePath = oInterface.getPath();
	for (const key in defaultSemanticDates) {
		if (defaultSemanticDates[key][0]) {
			const aPropertyPathParts = key.split("::");
			let sPath = "";
			const iPropertyPathLength = aPropertyPathParts.length;
			const sNavigationPath = aPropertyPathParts.slice(0, aPropertyPathParts.length - 1).join("/");
			const sProperty = aPropertyPathParts[iPropertyPathLength - 1];
			if (sNavigationPath) {
				//Create Proper Condition Path e.g. _Item*/Property or _Item/Property
				const vProperty = oMetaModel.getObject(sEntityTypePath + "/" + sNavigationPath);
				if (vProperty.$kind === "NavigationProperty" && vProperty.$isCollection) {
					sPath += `${sNavigationPath}*/`;
				} else if (vProperty.$kind === "NavigationProperty") {
					sPath += `${sNavigationPath}/`;
				}
			}
			sPath += sProperty;
			const operatorParamsArr = "values" in defaultSemanticDates[key][0] ? defaultSemanticDates[key][0].values : [];
			filterConditions[sPath] = [
				Condition.createCondition(defaultSemanticDates[key][0].operator, operatorParamsArr, null, null, null) as FilterConditions
			];
		}
	}
	return filterConditions;
};

export function getEditStatusFilter(): Record<string, FilterConditions[]> {
	const ofilterConditions: Record<string, FilterConditions[]> = {};
	ofilterConditions["$editState"] = [
		Condition.createCondition("DRAFT_EDIT_STATE", ["ALL"], null, null, ConditionValidated.Validated) as FilterConditions
	];
	return ofilterConditions;
}

export function getFilterConditions(oContext: any, filterConditions: any): Record<string, FilterConditions[]> {
	let editStateFilter;
	const entitySetPath = oContext.getInterface(1).getPath(),
		oMetaModel = oContext.getInterface(1).getModel(),
		entityTypeAnnotations = oMetaModel.getObject(`${entitySetPath}@`),
		entityTypeProperties = oMetaModel.getObject(`${entitySetPath}/`);
	if (
		entityTypeAnnotations &&
		(entityTypeAnnotations["@com.sap.vocabularies.Common.v1.DraftRoot"] ||
			entityTypeAnnotations["@com.sap.vocabularies.Common.v1.DraftNode"])
	) {
		editStateFilter = getEditStatusFilter();
	}
	const selectionVariant = filterConditions?.selectionVariant;
	const defaultSemanticDates = filterConditions?.defaultSemanticDates || {};
	const defaultFilters = getDefaultValueFilters(oContext, entityTypeProperties);
	const defaultSemanticDateFilters = getDefaultSemanticDateFilters(oContext, entityTypeProperties, defaultSemanticDates);
	if (selectionVariant) {
		filterConditions = getFiltersConditionsFromSelectionVariant(entitySetPath, oMetaModel, selectionVariant);
	} else if (defaultFilters) {
		filterConditions = defaultFilters;
	}
	if (defaultSemanticDateFilters) {
		// only for semantic date:
		// 1. value from manifest get merged with SV
		// 2. manifest value is given preference when there is same semantic date property in SV and manifest
		filterConditions = { ...filterConditions, ...defaultSemanticDateFilters };
	}
	if (editStateFilter) {
		filterConditions = { ...filterConditions, ...editStateFilter };
	}
	return (Object.keys(filterConditions).length > 0 ? JSON.stringify(filterConditions).replace(/([{}])/g, "\\$1") : undefined) as any;
}

/**
 * Checks whether the argument is a {@link SelectionVariantTypeTypes}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link SelectionVariantTypeTypes}.
 */
export function isSelectionVariant(serviceObject: unknown): serviceObject is SelectionVariantTypeTypes {
	return (serviceObject as SelectionVariantTypeTypes)?.$Type === UIAnnotationTypes.SelectionVariantType;
}

getFilterConditions.requiresIContext = true;