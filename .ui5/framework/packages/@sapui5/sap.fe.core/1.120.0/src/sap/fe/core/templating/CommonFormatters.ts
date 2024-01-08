import type { Property } from "@sap-ux/vocabularies-types";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	compileExpression,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	pathInModel
} from "sap/fe/core/helpers/BindingToolkit";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import type * as DisplayModeFormatter from "sap/fe/core/templating/DisplayModeFormatter";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import { isReferencePropertyStaticallyHidden } from "../converters/helpers/DataFieldHelper";
export type DisplayMode = DisplayModeFormatter.DisplayMode;

// Import-export methods related to the common annotations used by the converter to use them in the templating through the Common Formatters.

/**
 * Retrieves the expressionBinding created out of a binding expression.
 *
 * @param expression The expression which needs to be compiled
 * @returns The expression-binding string
 */
export const getExpressionBinding = function (expression: BindingToolkitExpression<any>): CompiledBindingToolkitExpression {
	return compileExpression(expression);
};
export const getBindingWithTextArrangement = function (
	propertyDataModelPath: DataModelObjectPath,
	propertyBindingExpression: BindingToolkitExpression<string>,
	fieldFormatOptions?: { displayMode?: DisplayMode },
	customFormatter?: string
): BindingToolkitExpression<string> {
	const targetDisplayModeOverride = fieldFormatOptions?.displayMode;
	let outExpression = propertyBindingExpression;
	const propertyDefinition =
		propertyDataModelPath.targetObject.type === "PropertyPath"
			? (propertyDataModelPath.targetObject.$target as Property)
			: (propertyDataModelPath.targetObject as Property);
	const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
	const commonText = propertyDefinition.annotations?.Common?.Text;
	const relativeLocation = getRelativePaths(propertyDataModelPath);
	const formatter = customFormatter || valueFormatters.formatWithBrackets;
	propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
	if (targetDisplayMode !== "Value" && commonText) {
		switch (targetDisplayMode) {
			case "Description":
				outExpression = getExpressionFromAnnotation(commonText, relativeLocation);
				break;
			case "DescriptionValue":
				outExpression = formatResult(
					[getExpressionFromAnnotation(commonText, relativeLocation), propertyBindingExpression],
					formatter
				);
				break;
			case "ValueDescription":
				outExpression = formatResult(
					[propertyBindingExpression, getExpressionFromAnnotation(commonText, relativeLocation)],
					formatter
				);
				break;
		}
	}
	return outExpression;
};
export const getBindingWithText = function (
	targetDataModelPath: DataModelObjectPath,
	customFormatter?: string
): CompiledBindingToolkitExpression {
	let propertyDataModelPath = targetDataModelPath;
	if (isPathAnnotationExpression(targetDataModelPath?.targetObject)) {
		propertyDataModelPath = enhanceDataModelPath(targetDataModelPath, targetDataModelPath.targetObject?.path);
	}
	const propertyDefinition = propertyDataModelPath.targetObject as Property;

	let propertyBindingExpression = pathInModel(
		getContextRelativeTargetObjectPath(propertyDataModelPath)
	) as BindingToolkitExpression<string>;

	propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression, true);
	const textArrangementBinding = getBindingWithTextArrangement(propertyDataModelPath, propertyBindingExpression, {}, customFormatter);
	return ((propertyDefinition.annotations.UI &&
		!isReferencePropertyStaticallyHidden(propertyDefinition.annotations.UI.DataFieldDefault) &&
		compileExpression(textArrangementBinding)) ||
		undefined) as CompiledBindingToolkitExpression;
};
