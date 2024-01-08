import Log from "sap/base/Log";
import type {
	InCompletenessInfoType,
	InternalPropertyAdditionalValue,
	KeyPropertiesDataType,
	RecommendationDataForNavPropertyType,
	RecommendationDataInnerObjectType
} from "sap/fe/core/helpers/RecommendationHelper";
import type { RecommendationInfo, StandardRecommendationAdditionalValues } from "sap/fe/core/helpers/StandardRecommendationHelper";
import { standardRecommendationHelper } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import Core from "sap/ui/core/Core";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterType from "sap/ui/model/FilterType";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type { ContextErrorType } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Sorter from "sap/ui/model/Sorter";

enum AdditionalValueGroupKey {
	recommendation = "recommendation",
	recentValue = "recentValue"
}
export type AdditionalValueType = {
	propertyPath: string;
	values: (string | number)[];
	groupKey: AdditionalValueGroupKey; // unique identifier for the group
};
type BindingInfoParameters = {
	$search: string;
};

export type AdditionValueDefinition =
	| InCompletenessInfoType
	| RecommendationDataForNavPropertyType[]
	| InternalPropertyAdditionalValue
	| {};
const additionalValueHelper = {
	/**
	 * This function is responsible to create context based on additional value filters and custom sorter and request contexts from it.
	 *
	 * @param additionalValues Array of additional values
	 * @param valueHelpListBinding List binding
	 * @param valueHelpBindingInfo The binding info object to be used to bind the list to the model
	 * @returns Additional value contexts
	 */
	requestForAdditionalValueContextData: async function (
		additionalValues: AdditionalValueType[],
		valueHelpListBinding: ODataListBinding,
		valueHelpBindingInfo: AggregationBindingInfo
	) {
		// reverse the array so that while creating transient context first additional value is grouped first
		const reverseAdditionalValues = [...additionalValues].reverse();
		if (valueHelpBindingInfo.parameters) {
			valueHelpListBinding.changeParameters(valueHelpBindingInfo.parameters);
		}

		// check if there is any input in the field
		// This information is used to determine
		// if to show the "others" section or not
		// and also to determine if typeAhead should open or not
		const searchTerm = (valueHelpBindingInfo.parameters as BindingInfoParameters).$search;
		const additionalValueFilters = this.getAdditionalValueFilters(reverseAdditionalValues, [
			...this.getValueHelpBindingFilters(valueHelpBindingInfo)
		]);
		(valueHelpBindingInfo.parameters as BindingInfoParameters).$search = searchTerm;
		// add custom sorter to take care of grouping the additional values
		const sorter: Sorter[] = [this.getSorter()];
		const additionalValuesListBinding = valueHelpListBinding
			.getModel()
			.bindList(valueHelpBindingInfo.path, undefined, sorter, additionalValueFilters, valueHelpBindingInfo.parameters);
		// get recommendation contexts from backend
		const additionalValueContexts: V4Context[] = await additionalValuesListBinding.requestContexts();
		return additionalValueContexts.map((context) => context.getObject() as Record<string, string>);
	},
	/**
	 * This function is responsible to fetch the valuehelp binding filters.
	 *
	 * @param valueHelpBindingInfo The binding info object to be used to bind the list to the model
	 * @returns Filters of valuehelp binding
	 */
	getValueHelpBindingFilters: function (valueHelpBindingInfo: AggregationBindingInfo) {
		// get all existing filters from the binding info
		// this + additional value filters will be used later on to fetch additional values from the backend
		if (valueHelpBindingInfo.filters) {
			if (Array.isArray(valueHelpBindingInfo.filters)) {
				return valueHelpBindingInfo.filters;
			} else {
				return [valueHelpBindingInfo.filters];
			}
		}
		return [];
	},
	/**
	 * This function resumes the suspended list binding and then resets changes on it.
	 *
	 * @param valueHelpListBinding List binding
	 */
	resumeValueListBindingAndResetChanges: async function (valueHelpListBinding: ODataListBinding) {
		if (valueHelpListBinding.isSuspended()) {
			valueHelpListBinding.resume();
		}
		// get rid of existing transient contexts.

		// destroying causes issues sometimes, contexts are not always available to destroy but appear afterwards magically
		try {
			await valueHelpListBinding.resetChanges();
		} catch (error: unknown) {
			//We do not do anything here as we know the model will always throw an error and this will fill up the console with errors.
		}
	},
	/**
	 * This function is used to sort and filter the Others group which contains other values which are not additional values.
	 *
	 * @param valueHelpListBinding List Binding
	 * @param valueHelpBindingInfo The binding info object to be used to bind the list to the model
	 * @param uniqueAdditionalValues Array of additional values which contain values which are unique to each group
	 */
	sortAndFilterOthers: function (
		valueHelpListBinding: ODataListBinding,
		valueHelpBindingInfo: AggregationBindingInfo,
		uniqueAdditionalValues: AdditionalValueType[]
	) {
		// filtering on valueListBinding is required to show the "Others" section
		// We should only filter on valueHelpBinding when there is search term entered
		// otherwise we do not want to show the "Others" section
		const otherGroupFilters = this.createFiltersForOthersGroup(uniqueAdditionalValues, [
			...this.getValueHelpBindingFilters(valueHelpBindingInfo)
		]);
		valueHelpListBinding.filter([otherGroupFilters], FilterType.Application);
		valueHelpListBinding.sort(this.getSorter());
	},
	/**
	 * This functions creates the filters for additional values.
	 *
	 * @param reverseAdditionalValues Array of additional values in reverse order
	 * @param filters Existing valuehelp binding filters
	 * @returns Additional value filters
	 */
	getAdditionalValueFilters: function (reverseAdditionalValues: AdditionalValueType[], filters: Filter[]) {
		reverseAdditionalValues.forEach((additionalValue) => {
			if (additionalValue.values.length > 0) {
				const values = additionalValue.values;
				const propertyPath = additionalValue.propertyPath;
				// add additional value filters to existing filters from the binding info
				values.forEach((value) => {
					// update the value help binding info to get additional values from the backend
					filters.push(
						new Filter({
							path: propertyPath,
							value1: value,
							operator: "EQ"
						})
					);
				});
			}
		});
		return filters;
	},
	/**
	 * This function returns a custom sorter which will be used to group additional values and also create Others group.
	 *
	 * @returns Custom Sorter containing different groups
	 */
	getSorter: function () {
		// This sorter will return a custom sorter
		return new Sorter("", false, this.getSorterFunction);
	},
	/**
	 * This function is a callback to the custom sorter.
	 *
	 * @param context Context of the Field
	 * @returns Group key that can be used for sorting
	 */
	getSorterFunction: function (context: V4Context): string {
		const resourceBundle = Core.getLibraryResourceBundle("sap.fe.macros");
		//get the client side annotation to figure out the groupkey
		const groupKey = context.getProperty("@$fe.additionalValueGroupKey") as string;
		if (groupKey === AdditionalValueGroupKey.recommendation) {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_RECOMMENDATIONS");
		} else if (groupKey === AdditionalValueGroupKey.recentValue) {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_RECENTVALUE");
		} else {
			return resourceBundle.getText("M_ADDITIONALVALUEHELPER_OTHERS");
		}
	},
	/**
	 * This function is used to create transient contexts for the additional values.
	 *
	 * @param additionalValueContextData Array of Contexts created for additional values
	 * @param reverseAdditionalValues Array of additional values in reverse order
	 * @param valueHelpListBinding List Binding
	 */
	createAdditionalValueTransientContexts: function (
		additionalValueContextData: Record<string, string>[],
		reverseAdditionalValues: AdditionalValueType[],
		valueHelpListBinding: ODataListBinding
	) {
		if (additionalValueContextData.length > 0) {
			// recommendations exist in the valuehelp
			// now add transient context to the list binding per additional value group
			reverseAdditionalValues.forEach((additionalValue) => {
				const values = additionalValue.values;
				const propertyPath = additionalValue.propertyPath;
				const groupKey = additionalValue.groupKey;
				//sorting and looping through the additionalValueContextData to create transient contexts
				this.sortAdditionalValueContextDataAndCreateContexts(
					additionalValueContextData,
					values,
					propertyPath,
					valueHelpListBinding,
					groupKey
				);
			});
		}
	},
	/**
	 * This function is used to sort the additional value context data and create contexts.
	 *
	 * @param additionalValueContextData Array of Contexts created for additional values
	 * @param values Array of values which are a part of additionalvalues
	 * @param propertyPath Path pointing to the property of the field
	 * @param valueHelpListBinding List Binding
	 * @param groupKey AdditionalValueGroupKey
	 */
	sortAdditionalValueContextDataAndCreateContexts: function (
		additionalValueContextData: Record<string, string>[],
		values: (string | number)[],
		propertyPath: string,
		valueHelpListBinding: ODataListBinding,
		groupKey: AdditionalValueGroupKey
	) {
		[...values].reverse().forEach((value: string | number) => {
			additionalValueContextData.forEach(async (contextData: Record<string, string>) => {
				if (value === contextData[propertyPath]) {
					contextData["@$fe.additionalValueGroupKey"] = groupKey;
					const context = valueHelpListBinding.create(contextData);
					try {
						await context.created();
					} catch (error) {
						//For transient contexts the canceled is set to true and for other cases it will be false. Atleast in recommendations
						//use case we do not face the scenario where canceled is set to false. For now we are just logging the error.
						if (!(error as ContextErrorType).canceled) {
							Log.error((error as ContextErrorType).name);
						}
					}
				}
			});
		});
	},
	/**
	 * This function will remove the duplicate values which are a part of different additional value groups.
	 *
	 * @param additionalValueContextData Array of Contexts created for additional values
	 * @param additionalValues Array of additional values
	 * @returns Array of additional values which contain unique values in each group
	 */
	removeDuplicateAdditionalValues: function (
		additionalValueContextData: Record<string, string>[],
		additionalValues: AdditionalValueType[]
	) {
		const uniqueAdditionalValues: AdditionalValueType[] = [];
		//create a deep copy to make sure we dont alter the original additionalvalues
		additionalValues.forEach((additionalValue) => {
			const values = [...additionalValue.values];
			const propertyPath = additionalValue.propertyPath;
			const groupKey = additionalValue.groupKey;
			uniqueAdditionalValues.push({ values, propertyPath, groupKey });
		});
		//loop through the additionalValueContextData and uniqueAdditionalValues to see if there are any duplicates and then remove them
		additionalValueContextData.forEach((contextData) => {
			let duplicateFlag = false;
			uniqueAdditionalValues.forEach((additionalValue) => {
				const values = additionalValue.values;
				const propertyPath = additionalValue.propertyPath;
				if (values.includes(contextData[propertyPath])) {
					if (duplicateFlag) {
						// if we find a duplicate then remove it from the array
						values.splice(values.indexOf(contextData[propertyPath]), 1);
					} else {
						duplicateFlag = true;
					}
				}
			});
		});
		return uniqueAdditionalValues;
	},
	/**
	 * This function is used to create filters to fetch values other than additional values.
	 *
	 * @param uniqueAdditionalValues Array of additional values which contain values which are unique to each group
	 * @param valuehelpFilters Filters which are already a part of ValueHelp Binding
	 * @returns Filters for Others group
	 */
	createFiltersForOthersGroup: function (uniqueAdditionalValues: AdditionalValueType[], valuehelpFilters: Filter[]) {
		const filters: Filter[] = [];
		//create filters not equal to the values of uniqueAdditionalValues
		uniqueAdditionalValues.forEach((additionalValue) => {
			const values = additionalValue.values;
			const propertyPath = additionalValue.propertyPath;
			values.forEach((value) => {
				filters.push(
					new Filter({
						path: propertyPath,
						value1: value,
						operator: "NE"
					})
				);
			});
		});
		//set and to true for the uniqueAdditionalValues filters
		const uniqueAdditionalValuesFilters = new Filter({
			filters: filters,
			and: true
		});
		//check if filters are already present on valuehelpbinding and push uniqueAdditionalValuesFilters into the valuehelpbinding filters
		if (valuehelpFilters.length > 0) {
			valuehelpFilters.push(uniqueAdditionalValuesFilters);
			return new Filter({
				filters: valuehelpFilters,
				and: true
			});
		} else {
			//if no pre existing filters are present then return uniqueAdditionalValuesFilters
			return uniqueAdditionalValuesFilters;
		}
	},
	/**
	 * This functions returns the relevant recommendations for the valuelist.
	 *
	 * @param data Object containing recommendation model data
	 * @param bindingContext Binding context of the Field
	 * @param propertyPath Property Path of the Field
	 * @returns Relevant recommendations for the valuelist
	 */
	getRelevantRecommendations: function (
		data: InCompletenessInfoType | {},
		bindingContext: V4Context,
		propertyPath: string,
		bindingPath?: string
	): Array<string | number> | null | undefined {
		const values: Array<string | number> = [];
		let relevantRecommendations: InternalPropertyAdditionalValue | undefined;
		if (Object.keys(data).length > 0) {
			//get the right property path by eliminating the starting / and also main entityset name
			propertyPath = this.getRecommendationPropertyPath(propertyPath);
			if ((data as RecommendationInfo).version === 2.0 && bindingPath) {
				propertyPath = bindingPath;
			}
			//get the recommendations based on property path and binding context passed
			relevantRecommendations = this.getAdditionalValueFromPropertyPath(propertyPath, bindingContext, data) as
				| InternalPropertyAdditionalValue
				| undefined;
			//if we get recommendations then push the values
			if (relevantRecommendations && Object.keys(relevantRecommendations).length > 0) {
				relevantRecommendations.additionalValues.forEach((valueData: RecommendationDataInnerObjectType) => {
					values.push(valueData.value);
				});
				return values;
			} else {
				//if recommendations are not found then return null
				return null;
			}
		}
	},

	_checkForKeysInRecommendations: function (keyProperties: KeyPropertiesDataType, contextData: Record<string, string>): boolean {
		for (const key in keyProperties) {
			if (keyProperties[key] !== contextData[key]) {
				return false;
			}
		}
		return true;
	},
	/**
	 * This function is responsible to fetch the exact object from an array of objects that contains relevant recommendationData based on keys.
	 *
	 * @param recommendationData Array containing additional values
	 * @param bindingContext Binding context of the Field
	 * @returns Relevant object from an array of object that contains the additional value
	 */
	getAdditionalValueFromKeys: function (
		recommendationData: AdditionValueDefinition,
		bindingContext?: V4Context | Context
	): AdditionValueDefinition {
		const contextData = bindingContext?.getObject() as Record<string, string> | undefined;
		let result: AdditionValueDefinition = {};
		//loop through the recommendationData and check if the keyProperties match with the binding context data
		if (bindingContext && contextData) {
			if (Array.isArray(recommendationData)) {
				(recommendationData as RecommendationDataForNavPropertyType[]).forEach((recData) => {
					const keyProperties = recData.keyProperties as KeyPropertiesDataType;
					const allKeysMatch = this._checkForKeysInRecommendations(keyProperties, contextData);
					//if every key value matches with the binding context data then assign it to result which will be returned
					if (allKeysMatch) {
						result = recData as AdditionValueDefinition;
					}
				});
			}
		}
		return result;
	},

	_getRecommendation: function (
		propertyPath: string,
		bindingContext: Context,
		recommendationData: AdditionValueDefinition
	): AdditionValueDefinition {
		//create a copy of the recommendationData to store its previous value as it will change because of the recursive approach
		let oldData = Object.assign(recommendationData, {});
		//check if property path exists on the recommendationData object and if so then return the object pointing to the property path
		if (Object.keys(recommendationData).includes(propertyPath)) {
			return (recommendationData as InCompletenessInfoType)[propertyPath] as AdditionValueDefinition;
		} else {
			//if property path is not present then check if it is 1:n mapping and we need to do a recursive approach to land on the exact object containing the relevant recommendations
			//continue the while loop till the property path is found in the previous recommendationData
			while (Object.keys(oldData).length > 0 && !Object.keys(oldData).includes(propertyPath)) {
				// as it might be 1:n mapping so first seperate the navprop name and actual prop name to make sure we find the navprop first and then from its pointing object we find the property path
				//eg: _Item/Material will be first divided into _Item and we search for it and then from its relevant object we search for Material
				const propertyPaths = propertyPath.split("/");
				if (propertyPaths.length > 1) {
					//getting the navprop path
					const navPropPath = propertyPaths[0];
					//removing the navprop path from propertypaths so that we only check for actual property path
					propertyPaths.splice(0, 1);
					propertyPath = propertyPaths.join("/");
					//using getAdditionalValueFromPropertyPath and passing navPropPath we get the exact array of objects pointing to the navProp
					recommendationData = this.getAdditionalValueFromPropertyPath(
						navPropPath,
						bindingContext,
						recommendationData
					) as RecommendationDataForNavPropertyType[];
					//no pass the array of objects of navProp to getAdditionalValueFromKeys and get the exact object that contains the recommendationData based on keys
					recommendationData = this.getAdditionalValueFromKeys(recommendationData, bindingContext);
					if (Object.keys(recommendationData).length > 0) {
						//set the recommendationData to oldData before assigning the new value to it
						oldData = Object.assign(recommendationData, {});
						//here we check for the actual property path from the object we found from getAdditionalValueFromKeys
						//eg: Material can be found in the object which is part of array of objects of _Item
						recommendationData = this.getAdditionalValueFromPropertyPath(
							propertyPath,
							bindingContext,
							recommendationData
						) as AdditionValueDefinition;
					} else {
						return {};
					}
				} else {
					return {};
				}
			}
			return recommendationData;
		}
	},

	/**
	 * This function is responsible for getting the additional value based on property path and binding context passed.
	 *
	 * @param propertyPath Property path of the field
	 * @param bindingContext Binding context of the field
	 * @param recommendationData Object containing additional value
	 * @returns Additional value based on property path and binding context passed
	 */
	getAdditionalValueFromPropertyPath: function (
		propertyPath: string,
		bindingContext: V4Context | Context,
		recommendationData?: AdditionValueDefinition | RecommendationInfo
	): AdditionValueDefinition | StandardRecommendationAdditionalValues | undefined {
		if ((recommendationData as RecommendationInfo).version === 2) {
			return standardRecommendationHelper.getStandardRecommendations(
				bindingContext,
				propertyPath,
				recommendationData as RecommendationInfo
			);
		}
		if (recommendationData) {
			return this._getRecommendation(propertyPath, bindingContext, recommendationData);
		}
	},
	/**
	 * This function returns the property path of the field by removing the leading '/' and main entity set name.
	 *
	 * @param propertyPath Property Path of the Field
	 * @returns Property path of the field by removing the leading '/' and main entity set name.
	 */
	getRecommendationPropertyPath: function (propertyPath: string) {
		//First we split the property path based on /
		const propertyPaths = propertyPath.split("/");
		//Now remove the first two elements of the array. As first element will always be '' and second element will be main entity set name
		propertyPaths.splice(0, 2);
		//Now join the remaining elements to create a new property path and return it
		return propertyPaths.join("/");
	}
};
export { AdditionalValueGroupKey, additionalValueHelper };
