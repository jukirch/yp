/**
 * collection of helper functions from "sap/fe/macros/internal/valuehelp/TableDelegate"
 * set into helper file for easy test accsess
 */

import type { Property } from "@sap-ux/vocabularies-types";
import type { FilterRestrictionsInfoType, SortRestrictionsInfoType } from "sap/fe/core/helpers/MetaModelFunction";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { ValueHelpTableColumn } from "sap/fe/macros/internal/valuehelp/TableDelegate";

/**
 * Identifies if the given property is filterable based on the sort restriction information.
 *
 * @param filterRestrictionsInfo The filter restriction information from the restriction annotation.
 * @param property The target property.
 * @returns `true` if the given property is filterable.
 * @private
 */
export function isFilterableProperty(
	filterRestrictionsInfo: FilterRestrictionsInfoType,
	property: ValueHelpTableColumn | Property
): boolean | undefined {
	const propertyPath = getPath(property);
	return propertyPath && filterRestrictionsInfo?.propertyInfo.hasOwnProperty(propertyPath)
		? filterRestrictionsInfo.propertyInfo[propertyPath].filterable
		: (property as ValueHelpTableColumn).filterable ?? true;
}

/**
 * Identifies if the given property is sortable based on the sort restriction information.
 *
 * @param sortRestrictionsInfo The sort restriction information from the restriction annotation.
 * @param property The target property.
 * @returns `true` if the given property is sortable.
 * @private
 */
export function isSortableProperty(
	sortRestrictionsInfo: SortRestrictionsInfoType,
	property: ValueHelpTableColumn | Property
): boolean | undefined {
	const propertyPath = getPath(property);
	return propertyPath && sortRestrictionsInfo.propertyInfo[propertyPath]
		? sortRestrictionsInfo.propertyInfo[propertyPath].sortable
		: (property as ValueHelpTableColumn).sortable ?? true;
}

/**
 * Provides the property path of a given property or custom data from the ValueHelp.
 *
 * @param property The target property or custom data from the ValueHelp.
 * @returns The property path.
 */
export function getPath(property: ValueHelpTableColumn | Property): string | undefined {
	return isProperty(property) ? property.name : property.path;
}
