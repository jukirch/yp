import type { PathAnnotationExpression, PrimitiveType, Property } from "@sap-ux/vocabularies-types";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression, PathInModelExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	EDM_TYPE_MAPPING,
	compileExpression,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	isPathInModelExpression,
	unresolvableExpression
} from "sap/fe/core/helpers/BindingToolkit";
import { isPathAnnotationExpression, isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { hasStaticPercentUnit } from "sap/fe/core/templating/PropertyHelper";
import {
	getBindingForTimezone,
	getBindingWithTimezone,
	getBindingWithUnitOrCurrency,
	getDisplayMode
} from "sap/fe/core/templating/UIFormatters";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";

const typesSupportingNumberOfFractionalDigits = ["Edm.Single", "Edm.Double", "Edm.Decimal"];

export type DataPointFormatOptions = Partial<{
	measureDisplayMode: string;
	displayMode: string;
}>;

const getDataPointTargetExpression = (oDataModelPath: any): BindingToolkitExpression<string> => {
	return oDataModelPath?.TargetValue ? getExpressionFromAnnotation(oDataModelPath.TargetValue) : unresolvableExpression;
};

const oResourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.fe.macros");

export const buildExpressionForProgressIndicatorDisplayValue = (
	oPropertyDataModelObjectPath: DataModelObjectPath
): CompiledBindingToolkitExpression => {
	const fieldValue = oPropertyDataModelObjectPath?.targetObject?.Value || "";
	const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
	let fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation) as any;
	const TargetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject) as any;

	if (fieldValueExpression && TargetExpression) {
		let targetObject = oPropertyDataModelObjectPath.targetObject.Value;
		if (!isProperty(targetObject)) {
			targetObject = oPropertyDataModelObjectPath.targetObject.Value.$target;
		}
		const unit = targetObject.annotations?.Measures?.Unit || targetObject.annotations?.Measures?.ISOCurrency;

		if (!unit) {
			return oResourceModel.getText("T_COMMON_PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [
				compileExpression(fieldValueExpression) as string,
				compileExpression(TargetExpression) as string
			]);
		}
		// If the unit isn't a path, we check for a % sign as it is a special case.
		if (hasStaticPercentUnit(fieldValue?.$target)) {
			return `${compileExpression(fieldValueExpression) as string} %`;
		}

		fieldValueExpression = formatWithTypeInformation(targetObject, fieldValueExpression);
		const unitBindingExpression = unit.$target
			? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation))
			: getExpressionFromAnnotation(unit, relativeLocation);

		return compileExpression(
			formatResult([fieldValueExpression, TargetExpression, unitBindingExpression], valueFormatters.formatProgressIndicatorText)
		);
	}
	return undefined;
};

export const buildUnitBindingExpression = (dataPoint: DataModelObjectPath): CompiledBindingToolkitExpression => {
	const relativeLocation = getRelativePaths(dataPoint);

	const targetObject = dataPoint?.targetObject?.Value?.$target;
	if (!isProperty(targetObject)) {
		return "";
	}
	const unit = targetObject.annotations?.Measures?.Unit || targetObject.annotations?.Measures?.ISOCurrency;
	return unit ? compileExpression(getExpressionFromAnnotation(unit, relativeLocation)) : "";
};

const buildRatingIndicatorSubtitleExpression = (oContext: any, mSampleSize: any): string | undefined => {
	if (mSampleSize) {
		return formatRatingIndicatorSubTitle(AnnotationHelper.value(mSampleSize, { context: oContext }) as any);
	}
};
// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
const formatRatingIndicatorSubTitle = (iSampleSizeValue: number): string | undefined => {
	if (iSampleSizeValue) {
		const sSubTitleLabel =
			iSampleSizeValue > 1
				? oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL_PLURAL")
				: oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE_LABEL");
		return oResourceModel.getText("T_ANNOTATION_HELPER_RATING_INDICATOR_SUBTITLE", [String(iSampleSizeValue), sSubTitleLabel]);
	}
};

/**
 * This function is used to get the header text of rating indicator.
 *
 * @param oContext Context of interface
 * @param oDataPoint Data point object
 * @returns Expression binding for rating indicator text
 */
export const getHeaderRatingIndicatorText = (oContext: any, oDataPoint: any): string | undefined => {
	let result: string | undefined;
	if (oDataPoint && oDataPoint.SampleSize) {
		result = buildRatingIndicatorSubtitleExpression(oContext, oDataPoint.SampleSize);
	} else if (oDataPoint && oDataPoint.Description) {
		const sModelValue = AnnotationHelper.value(oDataPoint.Description, { context: oContext });
		result = "${path:" + sModelValue + "}";
	}
	return result;
};
getHeaderRatingIndicatorText.requiresIContext = true;

const buildExpressionForDescription = (fieldValue: DataModelObjectPath): BindingToolkitExpression<any> | undefined => {
	const relativeLocation = getRelativePaths(fieldValue);
	if (fieldValue?.targetObject?.annotations?.Common?.Text) {
		const oTextExpression = getExpressionFromAnnotation(fieldValue?.targetObject.annotations?.Common?.Text, relativeLocation);
		if (isPathInModelExpression(oTextExpression)) {
			oTextExpression.parameters = { $$noPatch: true };
		}
		return oTextExpression;
	}
	return undefined;
};

const getFloatFormat = (
	outExpression: PathInModelExpression<any>,
	fieldValue: any,
	numberOfFractionalDigits: string
): BindingToolkitExpression<any> => {
	// numberOfFractionalDigits is only defined in getValueFormatted when NumberOfFractionalDigits is defined.
	// In that case, we need to instance the preserveDecimals parameter because of a change MDC side
	if (numberOfFractionalDigits) {
		if (!outExpression.formatOptions) {
			outExpression.formatOptions = {};
		}
		outExpression.formatOptions = Object.assign(outExpression.formatOptions, {
			preserveDecimals: false,
			maxFractionDigits: numberOfFractionalDigits
		});
	}
	return outExpression;
};

export const getValueFormatted = (
	oPropertyDataModelPath: DataModelObjectPath,
	fieldValue: any,
	sPropertyType: string,
	sNumberOfFractionalDigits: string
): BindingToolkitExpression<string> => {
	let outExpression: BindingToolkitExpression<any>;
	const relativeLocation = fieldValue?.path?.indexOf("/") === -1 ? getRelativePaths(oPropertyDataModelPath) : [];
	outExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
	const oPropertyDefinition = oPropertyDataModelPath.targetObject as Property;
	if (sPropertyType && isPathInModelExpression(outExpression)) {
		formatWithTypeInformation(oPropertyDefinition, outExpression);
		outExpression.type = EDM_TYPE_MAPPING[sPropertyType]?.type;
		if (typesSupportingNumberOfFractionalDigits.includes(sPropertyType)) {
			// for the listReport, the decimal/single/double fields are formatted by returning a string
			// for the facets of the OP, the decimal/single/double fields are formatted by returning a promise, so we manage all the cases
			outExpression = getFloatFormat(outExpression, fieldValue, sNumberOfFractionalDigits);
		}
	}

	return outExpression;
};

export const buildFieldBindingExpression = (
	oDataModelPath: DataModelObjectPath,
	dataPointFormatOptions: DataPointFormatOptions,
	bHideMeasure: boolean
): CompiledBindingToolkitExpression => {
	const oDataPoint = oDataModelPath.targetObject;
	const oDataPointValue = oDataPoint?.Value || "";
	const propertyType = oDataPointValue?.$target?.type;
	let numberOfFractionalDigits;

	if (typesSupportingNumberOfFractionalDigits.includes(propertyType) && oDataPoint.ValueFormat) {
		if (oDataPoint.ValueFormat.NumberOfFractionalDigits) {
			numberOfFractionalDigits = oDataPoint.ValueFormat.NumberOfFractionalDigits;
		}
	}
	const oPropertyDataModelObjectPath = enhanceDataModelPath(oDataModelPath, oDataPointValue.path);
	const oDescription = oPropertyDataModelObjectPath ? buildExpressionForDescription(oPropertyDataModelObjectPath) : undefined;
	const oFormattedValue = getValueFormatted(oPropertyDataModelObjectPath, oDataPointValue, propertyType, numberOfFractionalDigits);
	const sDisplayMode = oDescription ? dataPointFormatOptions.displayMode || getDisplayMode(oPropertyDataModelObjectPath) : "Value";
	let oBindingExpression: any;
	switch (sDisplayMode) {
		case "Description":
			oBindingExpression = oDescription;
			break;
		case "ValueDescription":
			oBindingExpression = formatResult([oFormattedValue, oDescription], valueFormatters.formatWithBrackets);
			break;
		case "DescriptionValue":
			oBindingExpression = formatResult([oDescription, oFormattedValue], valueFormatters.formatWithBrackets);
			break;
		default:
			if (oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.Timezone) {
				oBindingExpression = getBindingWithTimezone(oPropertyDataModelObjectPath, oFormattedValue);
			} else if (oPropertyDataModelObjectPath.targetObject?.annotations?.Common?.IsTimezone) {
				oBindingExpression = getBindingForTimezone(oPropertyDataModelObjectPath, oFormattedValue);
			} else {
				oBindingExpression = _computeBindingWithUnitOrCurrency(
					oPropertyDataModelObjectPath,
					oFormattedValue,
					bHideMeasure || dataPointFormatOptions?.measureDisplayMode === "Hidden"
				);
			}
	}
	return compileExpression(oBindingExpression);
};

export const _computeBindingWithUnitOrCurrency = (
	propertyDataModelObjectPath: DataModelObjectPath,
	formattedValue: BindingToolkitExpression<string>,
	hideMeasure: boolean
): BindingToolkitExpression<string> => {
	if (
		propertyDataModelObjectPath.targetObject?.annotations?.Measures?.Unit ||
		propertyDataModelObjectPath.targetObject?.annotations?.Measures?.ISOCurrency
	) {
		if (hideMeasure && hasStaticPercentUnit(propertyDataModelObjectPath.targetObject)) {
			return formattedValue;
		}
		return getBindingWithUnitOrCurrency(
			propertyDataModelObjectPath,
			formattedValue,
			undefined,
			hideMeasure ? { showMeasure: false } : undefined
		);
	}
	return formattedValue;
};

/**
 * Method to calculate the percentage value of Progress Indicator. Basic formula is Value/Target * 100.
 *
 * @param oPropertyDataModelObjectPath
 * @returns The expression binding used to calculate the percentage value, which is shown in the progress indicator based on the formula given above.
 */
export const buildExpressionForProgressIndicatorPercentValue = (oPropertyDataModelObjectPath: DataModelObjectPath): string | undefined => {
	const fieldValue = (oPropertyDataModelObjectPath?.targetObject.Value as PathAnnotationExpression<PrimitiveType>) || "";
	const relativeLocation = getRelativePaths(oPropertyDataModelObjectPath);
	const fieldValueExpression = getExpressionFromAnnotation(fieldValue, relativeLocation);
	const TargetExpression = getDataPointTargetExpression(oPropertyDataModelObjectPath.targetObject);

	const oPropertyDefinition = fieldValue.$target as Property;
	const unit = oPropertyDefinition.annotations?.Measures?.Unit || oPropertyDefinition.annotations?.Measures?.ISOCurrency;
	if (unit) {
		const unitBindingExpression =
			isPathAnnotationExpression(unit) && unit.$target
				? formatWithTypeInformation(unit.$target, getExpressionFromAnnotation(unit, relativeLocation))
				: getExpressionFromAnnotation(unit, relativeLocation);

		return compileExpression(
			formatResult([fieldValueExpression, TargetExpression, unitBindingExpression], valueFormatters.computePercentage)
		);
	}

	return compileExpression(formatResult([fieldValueExpression, TargetExpression, ""], valueFormatters.computePercentage));
};
