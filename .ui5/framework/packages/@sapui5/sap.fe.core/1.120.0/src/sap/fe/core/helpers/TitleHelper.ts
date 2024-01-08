import type { EntitySet, Property, PropertyAnnotationValue, PropertyPath } from "@sap-ux/vocabularies-types";
import type { DataFieldAbstractTypes, DataFieldTypes, HeaderInfoType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { Draft, UI } from "sap/fe/core/helpers/BindingHelper";
import type { BindingToolkitExpression, PathInModelExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	compileExpression,
	concat,
	constant,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	ifElse,
	isConstant,
	isEmpty,
	isUndefinedExpression,
	not,
	or,
	pathInModel,
	resolveBindingString,
	transformRecursively
} from "sap/fe/core/helpers/BindingToolkit";
import { isPathAnnotationExpression, isPropertyPathExpression } from "sap/fe/core/helpers/TypeGuards";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import { getLabelForConnectedFields } from "sap/fe/core/templating/DataFieldFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";

type BindingExpressionTuple = [BindingToolkitExpression<string>, BindingToolkitExpression<string>] | [BindingToolkitExpression<string>];

export const formatValueRecursively = function (
	bindingExpressionToEnhance: BindingToolkitExpression<string>,
	fullContextPath: DataModelObjectPath
): BindingToolkitExpression<string> {
	return transformRecursively(bindingExpressionToEnhance, "PathInModel", (expression) => {
		let outExpression = expression;
		if (expression.modelName === undefined) {
			// In case of default model we then need to resolve the text arrangement property
			const oPropertyDataModelPath = enhanceDataModelPath(fullContextPath, expression.path);
			outExpression = formatWithTypeInformation(oPropertyDataModelPath.targetObject, expression);
		}
		return outExpression;
	});
};

/**
 * Get property definition from data model object path.
 *
 * @param propertyDataModelObject The property data model object
 * @returns The property
 */
const getPropertyDefinition = (propertyDataModelObject: DataModelObjectPath) => {
	const propertyPathOrProperty = propertyDataModelObject.targetObject as PropertyPath | Property;
	return isPropertyPathExpression(propertyPathOrProperty) ? propertyPathOrProperty.$target : propertyPathOrProperty;
};

/**
 * Checks whether an associated active entity exists.
 *
 * @param fullContextPath The full path to the context
 * @returns The expression-binding string
 */
const isOrHasActiveEntity = (fullContextPath: DataModelObjectPath) => {
	const draftRoot = (fullContextPath.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftRoot;
	const draftNode = (fullContextPath.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftNode;
	if (!!draftRoot || !!draftNode) {
		return not(Draft.IsNewObject);
	}
	return false;
};

/**
 * Checks if title value expression is empty.
 *
 * @param titleValueExpression The title value expression
 * @returns The expression-binding string
 */
const isTitleEmptyBooleanExpression = (titleValueExpression: BindingToolkitExpression<string>) =>
	titleValueExpression._type === "Constant" ? constant(!titleValueExpression.value) : isEmpty(titleValueExpression);

/**
 * Retrieves the title expression binding.
 *
 * @param propertyDataModelPath The full path to the property context
 * @param propertyBindingExpression The binding expression of the property above
 * @param [fieldFormatOptions] The format options of the field
 * @param fieldFormatOptions.displayMode
 * @returns The expression-binding parameters
 */
const getTitleBindingWithTextArrangement = function (
	propertyDataModelPath: DataModelObjectPath,
	propertyBindingExpression: BindingToolkitExpression<string>,
	formatOptions?: Partial<{ displayMode?: DisplayMode; splitTitleOnTwoLines?: boolean }>
): BindingExpressionTuple {
	const targetDisplayModeOverride = formatOptions?.displayMode;
	const propertyDefinition = getPropertyDefinition(propertyDataModelPath);
	const targetDisplayMode = targetDisplayModeOverride || UIFormatters.getDisplayMode(propertyDataModelPath);
	const commonText = propertyDefinition?.annotations?.Common?.Text;
	const relativeLocation = getRelativePaths(propertyDataModelPath);

	if (propertyDefinition) {
		propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);
	}

	let params: BindingExpressionTuple = [propertyBindingExpression];
	if (targetDisplayMode !== "Value" && commonText) {
		switch (targetDisplayMode) {
			case "Description":
				params = [getExpressionFromAnnotation(commonText, relativeLocation)];
				break;
			case "DescriptionValue":
				const targetExpression =
					formatOptions?.splitTitleOnTwoLines === undefined
						? ifElse(!!commonText.annotations?.UI?.TextArrangement, propertyBindingExpression, constant(""))
						: ifElse(
								!!formatOptions?.splitTitleOnTwoLines,
								constant(""),
								getExpressionFromAnnotation(commonText, relativeLocation)
						  );
				params = [getExpressionFromAnnotation(commonText, relativeLocation), targetExpression];
				break;
			case "ValueDescription":
				params = [
					propertyBindingExpression,
					ifElse(!!formatOptions?.splitTitleOnTwoLines, constant(""), getExpressionFromAnnotation(commonText, relativeLocation))
				];
				break;
		}
	}
	return params;
};

/**
 * Recursively add the text arrangement to a title binding expression.
 *
 * @param bindingExpressionToEnhance The binding expression to be enhanced
 * @param path The data field data model object path
 * @returns An updated expression containing the text arrangement binding parameters
 */
const addTextArrangementToTitleBindingExpression = function (
	bindingExpressionToEnhance: BindingToolkitExpression<string>,
	path: DataModelObjectPath
): BindingToolkitExpression<string> {
	return transformRecursively(bindingExpressionToEnhance, "PathInModel", (expression: PathInModelExpression<unknown>) => {
		if (expression.modelName !== undefined) return expression;
		// In case of default model we then need to resolve the text arrangement property
		const propertyDataModelPath = enhanceDataModelPath(path, expression.path);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return getTitleBindingWithTextArrangement(propertyDataModelPath, expression) as unknown as BindingToolkitExpression<any>;
	});
};

/**
 * Gets binding expression for create mode title.
 *
 * @param viewData The associated view data
 * @param [typeName] The type name from the object page header info
 * @param typeName.TypeName
 * @returns The expression-binding string
 */
const getCreateModeTitle = function (viewData: ViewData, { TypeName: typeName }: HeaderInfoType): BindingToolkitExpression<string> {
	const titleNoHeaderInfo = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
	let createModeTitle: string | BindingToolkitExpression<string> = titleNoHeaderInfo;
	if (
		viewData.resourceModel.getText("T_NEW_OBJECT", undefined, viewData.entitySet) ===
		viewData.resourceModel.getText("T_NEW_OBJECT_DEFAULT", undefined, viewData.entitySet)
	) {
		//T_NEW_OBJECT has not been customized
		const titleWithHeaderInfo = viewData.resourceModel.getText(
			"T_ANNOTATION_HELPER_DEFAULT_OBJECT_PAGE_HEADER_TITLE",
			undefined,
			viewData.entitySet
		);
		createModeTitle = (typeName as string | PropertyAnnotationValue<string>)
			? concat(titleWithHeaderInfo, ": ", resolveBindingString(typeName.toString()))
			: titleNoHeaderInfo;
	}
	return formatResult([createModeTitle], valueFormatters.formatTitle);
};

/**
 * Checks whether an empty string should be used.
 *
 * @param path The meta path pointing to the property used for the title
 * @returns The expression-binding string
 */
const shouldForceEmptyString = (path: DataModelObjectPath) => {
	const propertyDefinition = getPropertyDefinition(path);
	if (propertyDefinition && propertyDefinition.annotations?.Core?.Computed) {
		return UI.IsInactive;
	} else {
		return constant(false);
	}
};

/**
 * Gets title value expression from object page header info.
 *
 * @param fullContextPath The full path to the context
 * @param headerInfoTitle The title value from the object page header info
 * @param getTextBindingExpression The function to get the text binding expression
 * @returns The expression-binding string
 */
const getTitleValueExpressionFromHeaderInfo = function (
	fullContextPath: DataModelObjectPath,
	headerInfoTitle: DataFieldAbstractTypes,
	getTextBindingExpression: Function
) {
	let titleValueExpression: BindingToolkitExpression<string> | undefined;
	if (headerInfoTitle.$Type === UIAnnotationTypes.DataField) {
		titleValueExpression = getExpressionFromAnnotation(headerInfoTitle.Value);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if ((headerInfoTitle as DataFieldTypes).Value?.$target?.annotations.Common?.Text?.annotations?.UI?.TextArrangement) {
			// In case an explicit text arrangement was set we make use of it in the description as well
			titleValueExpression = addTextArrangementToTitleBindingExpression(titleValueExpression, fullContextPath);
		}
		titleValueExpression = formatValueRecursively(titleValueExpression, fullContextPath);
	}
	if (
		headerInfoTitle.$Type === UIAnnotationTypes.DataFieldForAnnotation &&
		headerInfoTitle.Target.$target?.$Type === UIAnnotationTypes.ConnectedFieldsType
	) {
		const connectedFieldsPath = enhanceDataModelPath(fullContextPath, "$Type/@UI.HeaderInfo/Title/Target/$AnnotationPath");
		titleValueExpression = getLabelForConnectedFields(
			connectedFieldsPath,
			getTextBindingExpression,
			false
		) as BindingToolkitExpression<string>;
	}
	return titleValueExpression;
};

/**
 * Creates binding expression for Object Page, List Report, Quick View and other titles.
 *
 * @param path The data model object path
 * @param getTextBindingExpression The function to get the text binding expression
 * @param [fieldFormatOptions] The format options of the field
 * @param fieldFormatOptions.displayMode
 * @param [headerInfo] The object page header info
 * @param [viewData] The associated view data
 * @returns The compiled expression-binding string
 */
export const getTitleBindingExpression = function (
	path: DataModelObjectPath,
	getTextBindingExpression: Function,
	formatOptions?: Partial<{ displayMode?: DisplayMode; splitTitleOnTwoLines?: boolean }>,
	headerInfo?: HeaderInfoType,
	viewData?: ViewData,
	customFormatter?: string
) {
	const formatter = customFormatter || valueFormatters.formatTitle;
	let createModeTitle: BindingToolkitExpression<string> | string = pathInModel("T_NEW_OBJECT", "sap.fe.i18n");
	let titleValueExpression;
	let isHeaderInfoTitleEmpty = false;
	// If we have a headerInfo but no title, or empty title we need to display an empty string when we are on an active object
	// received header info for object page
	if (headerInfo?.Title?.$Type && viewData) {
		titleValueExpression = getTitleValueExpressionFromHeaderInfo(path, headerInfo.Title, getTextBindingExpression);
		createModeTitle = getCreateModeTitle(viewData, headerInfo);
		if (isConstant(titleValueExpression) && titleValueExpression.value === "") {
			isHeaderInfoTitleEmpty = true;
		}
	} else if (headerInfo && (headerInfo.Title === undefined || headerInfo.Title.toString() === "")) {
		isHeaderInfoTitleEmpty = true;
	}
	if (titleValueExpression && isConstant(titleValueExpression)) {
		return compileExpression(titleValueExpression);
	}

	// needed for quickview
	if (isPathAnnotationExpression(path.targetObject)) {
		path = enhanceDataModelPath(path, path.targetObject.path);
	}

	const propertyBindingExpression: BindingToolkitExpression<unknown> = pathInModel(getContextRelativeTargetObjectPath(path));
	let params: BindingExpressionTuple;
	if (titleValueExpression) {
		params = Array.isArray(titleValueExpression) ? (titleValueExpression as unknown as BindingExpressionTuple) : [titleValueExpression];
	} else {
		params = getTitleBindingWithTextArrangement(path, propertyBindingExpression, formatOptions);
	}
	const isTitleEmpty = isTitleEmptyBooleanExpression(params[0]);
	const forceEmptyString = shouldForceEmptyString(path);
	const formattedExpression = formatResult(params, formatter);
	titleValueExpression = ifElse(
		isTitleEmpty,
		ifElse(
			or(isHeaderInfoTitleEmpty && isOrHasActiveEntity(path), forceEmptyString),
			"",
			ifElse(
				isUndefinedExpression(constant(customFormatter)),
				ifElse(
					or(UI.IsCreateMode, not(isOrHasActiveEntity(path))),
					createModeTitle,
					pathInModel("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO", "sap.fe.i18n")
				),
				ifElse(
					not(isOrHasActiveEntity(path)),
					viewData?.resourceModel.getText("T_NEW_OBJECT"),
					viewData?.resourceModel.getText("T_ANNOTATION_HELPER_DEFAULT_HEADER_TITLE_NO_HEADER_INFO")
				)
			)
		),
		formattedExpression
	);

	return compileExpression(titleValueExpression);
};
