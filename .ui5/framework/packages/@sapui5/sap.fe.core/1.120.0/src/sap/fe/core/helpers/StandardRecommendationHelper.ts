import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type Context from "sap/ui/model/Context";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type { DataModelObjectPath } from "../templating/DataModelPathHelper";
import { getDisplayMode } from "../templating/UIFormatters";
import type { RecommendationDataInnerObjectType } from "./RecommendationHelper";

export type StandardRecommendationResponse = {
	AIRecommendedFieldPath?: string;
	AIRecommendedFieldValue?: string;
	AIRecommendedFieldDescription?: string;
	_AIAltvRecmddFldVals?: AlternativeRecommendations[];
};

export type AlternativeRecommendations = {
	AIRecommendedFieldValue: string;
	AIRecommendedFieldScoreValue?: number;
};

export type StandardRecommendationDataInnerObject = RecommendationDataInnerObjectType & {
	text?: string;
};

export type StandardRecommendationAdditionalValues = {
	value?: string;
	text?: string;
	additionalValues?: StandardRecommendationDataInnerObject[];
};

type StandardBaseRecommendation = {
	version?: number;
};

export type BaseDynamicRecommendation = Record<string, StandardRecommendationAdditionalValues>;

export type RecommendationInfo = StandardBaseRecommendation & BaseDynamicRecommendation;

export const standardRecommendationHelper = {
	/**
	 * This function will process and set the recommendations according to data received from backend.
	 *
	 * @param recommendations The data received from backend
	 * @param internalModel The internal json model
	 * @param recommendationsContexts The contexts for which recommendations are being fetched
	 */
	storeRecommendations: (
		recommendations: StandardRecommendationResponse[],
		internalModel: JSONModel,
		recommendationsContexts: ODataV4Context[]
	): void => {
		const recommendationsData = (internalModel.getProperty("/recommendationsData") as RecommendationInfo) || {};
		standardRecommendationHelper.clearRecommendationsForContextOnly(recommendationsData, recommendationsContexts);
		standardRecommendationHelper.enhanceRecommendationModel(recommendations, recommendationsData);
		//Setting the version to 2.0 to segregate the processing
		recommendationsData["version"] = 2.0;
		internalModel.setProperty("/recommendationsData", recommendationsData);
		internalModel.refresh(true);
	},

	/**
	 * This function clears the old recommendations for the context.
	 *
	 * @param recommendationsData The recommendation data which is stored
	 * @param recommendationsContexts The contexts for which recommendations are being fetched
	 */
	clearRecommendationsForContextOnly: (recommendationsData: RecommendationInfo, recommendationsContexts?: ODataV4Context[]): void => {
		if (recommendationsContexts) {
			Object.keys(recommendationsData).forEach((target) => {
				//We need to only clear the recommendations of current context and not the children's context.The index will fetch the context of the recommendation property.
				const idx = target.lastIndexOf(")");
				if (recommendationsContexts.find((context) => context.getPath() === target.substring(0, idx + 1))) {
					delete recommendationsData[target];
				}
			});
		}
	},

	/**
	 * This function will enhance the recommendations according to data received from backend.
	 *
	 * @param recommendations The data received from backend
	 * @param recommendationsData The existing recommendation Model
	 */
	enhanceRecommendationModel: (
		recommendations: Array<StandardRecommendationResponse>,
		recommendationsData: Record<string, object>
	): void => {
		recommendations?.forEach((recommendation: StandardRecommendationResponse) => {
			const target = recommendation.AIRecommendedFieldPath;
			if (target) {
				// loop through all the recommendations sent from backend
				const additionalValues: StandardRecommendationDataInnerObject[] = [];
				let isPlaceholderValueFound = false;

				// set the other alternatives as recommendations
				recommendation._AIAltvRecmddFldVals?.forEach((alternativeRecommendation: AlternativeRecommendations) => {
					const standardRecommendationsData: StandardRecommendationDataInnerObject = {
						value: alternativeRecommendation.AIRecommendedFieldValue,
						probability: alternativeRecommendation.AIRecommendedFieldScoreValue
					};
					if (recommendation.AIRecommendedFieldValue === alternativeRecommendation.AIRecommendedFieldValue) {
						isPlaceholderValueFound = true;
					}

					additionalValues.push(standardRecommendationsData);
				});
				recommendationsData[target] = {
					value: isPlaceholderValueFound ? recommendation.AIRecommendedFieldValue : undefined,
					text: isPlaceholderValueFound ? recommendation.AIRecommendedFieldDescription : undefined,
					additionalValues: additionalValues
				};
			}
		});
	},

	/**
	 * This function returns recommendations from standard recommendations model.
	 *
	 * @param bindingContext Binding Context of the field
	 * @param propertyPath Property path of the field
	 * @param recommendationData Object containing recommendations
	 * @returns Recommendation data for the field
	 */
	getStandardRecommendations: function (
		bindingContext: Context,
		propertyPath: string,
		recommendationData: RecommendationInfo
	): StandardRecommendationAdditionalValues | undefined {
		if (bindingContext && propertyPath) {
			const fullPath = bindingContext.getPath() + "/" + propertyPath;
			return recommendationData[fullPath] || undefined;
		}
	},
	/**
	 * Fetches the display mode for a given target path.
	 *
	 * @param targetPath
	 * @param model
	 * @returns Display mode for target path
	 */
	getDisplayModeForTargetPath(targetPath: string, model: Model): string {
		const involvedDataModelObject = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(targetPath, model);
		const displayMode = involvedDataModelObject && getDisplayMode(involvedDataModelObject);
		return displayMode ? displayMode : "DescriptionValue";
	},

	/**
	 * Fetches the DataModel Object Path for a given target path.
	 *
	 * @param targetPath
	 * @param model
	 * @returns DataModel Object Path for target path
	 */
	getInvolvedDataModelObjectsForTargetPath(targetPath: string, model: Model): DataModelObjectPath | undefined {
		const metaPath = model?.getMetaModel()?.getMetaPath(targetPath);
		const metaContext = metaPath ? model?.getMetaModel()?.getContext(metaPath) : undefined;
		return metaContext && MetaModelConverter.getInvolvedDataModelObjects(metaContext);
	},

	/**
	 * Function which informs whether a recommendation field is null or not.
	 *
	 * @param context
	 * @param key
	 * @param propertyPath
	 * @returns boolean value based on whether a recommendation field is null or not
	 */

	isRecommendationFieldNull(context: ODataV4Context, key: string, propertyPath: string): boolean {
		const property = standardRecommendationHelper.getInvolvedDataModelObjectsForTargetPath(key, context?.getModel() as Model);
		if (!context?.getProperty(propertyPath)) {
			const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(key, context?.getModel() as Model);
			if (displayMode && displayMode !== "Value") {
				const text = property?.targetObject?.annotations?.Common?.Text?.path;
				return text ? !context?.getProperty(text) : true;
			}
			return true;
		}
		return false;
	}
};
