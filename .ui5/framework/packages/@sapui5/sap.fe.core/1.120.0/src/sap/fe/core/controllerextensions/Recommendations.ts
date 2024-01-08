import Log from "sap/base/Log";
import type PageController from "sap/fe/core/PageController";
import { defineUI5Class, extensible, methodOverride, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import { recommendationHelper } from "sap/fe/core/helpers/RecommendationHelper";
import type { RecommendationInfo, StandardRecommendationResponse } from "sap/fe/core/helpers/StandardRecommendationHelper";
import { standardRecommendationHelper } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type Control from "sap/ui/core/Control";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Context from "sap/ui/model/Context";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import CommonUtils from "../CommonUtils";
import TransactionHelper from "./editFlow/TransactionHelper";

export type AcceptAllParams = {
	recommendationData?: RecommendationData[];
};

export type RecommendationData = {
	context?: ODataV4Context;
	propertyPath?: string;
	value?: string;
	text?: string;
};

@defineUI5Class("sap.fe.core.controllerextensions.Recommendations")
export default class Recommendations extends ControllerExtension {
	base!: PageController;

	recommendationContexts!: ODataV4Context[];

	recommendationEnabledPromise!: Promise<boolean>;

	rootContext!: Context | undefined;

	@methodOverride()
	onInit(): void {
		//this.recommendationEnabledPromise = this.base.recommendations.isEnabled();
	}

	@methodOverride("_routing")
	async onAfterBinding(context: Context): Promise<void> {
		// use internal model because we have to use this information across the application for different instances.
		const internalModel = this.base.getView().getModel("internal");
		const isRecommendationEnabled = internalModel.getProperty("/isRecommendationEnabled");
		// onAfter binding is called for all contexts
		// but we do not need to call the isEnabled hook all the time
		// so check if recommendation enabled is already available
		if (isRecommendationEnabled === undefined && context) {
			const rootContext = await this._getRootContext(context as ODataV4Context);
			if (rootContext) {
				this.recommendationEnabledPromise = this.base.recommendations.isEnabled(rootContext);
			}
		} else if (isRecommendationEnabled !== undefined) {
			this.recommendationEnabledPromise = Promise.resolve(isRecommendationEnabled);
		}
	}

	private async _getRootContext(context: ODataV4Context): Promise<Context | undefined> {
		const programmingModel = TransactionHelper.getProgrammingModel(context);
		return CommonUtils.createRootContext(programmingModel, this.base.getView(), this.base.getAppComponent());
	}
	/**
	 * Clear all recommendations currently available on the UI.
	 *
	 * @public
	 */
	@publicExtension()
	public clearRecommendations(): void {
		const bindingContext = this.getView().getBindingContext();
		if (bindingContext) {
			recommendationHelper.clearRecommendations(this.getView(), bindingContext);
		}
	}

	/**
	 * Check if recommendations are enabled or not.
	 *
	 * @param _rootContext The root entity context
	 * @returns True if recommendation is enabled. False if recommendation is disabled.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public async isEnabled(_rootContext: Context): Promise<boolean> {
		return Promise.resolve(false);
	}

	/**
	 * Fetch the recommendation for a specific context.
	 *
	 * @param context The context that shall be considered when fetching recommendations
	 * @param _rootContext The root entity context
	 * @returns The recommendation entries
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public async fetchRecommendations(_context: ODataV4Context[], _rootContext?: Context): Promise<StandardRecommendationResponse[]> {
		return Promise.resolve([]);
	}

	/**
	 * Fetch the recommendations and apply them on the UI.
	 *
	 * @param context The context that shall be considered when fetching recommendations
	 * @public
	 * @returns `true` if the recommendation were fetched and applied correctly
	 */
	@publicExtension()
	public async fetchAndApplyRecommendations(contexts: ODataV4Context[]): Promise<boolean> {
		if (contexts && contexts.length > 0) {
			const internalModel = this.base.getView().getModel("internal");
			const isRecommendationEnabled = await this.recommendationEnabledPromise;
			// store the result of recommendation enabled for later use
			internalModel.setProperty("/isRecommendationEnabled", isRecommendationEnabled);
			if (isRecommendationEnabled) {
				try {
					const rootContext = await this._getRootContext(contexts[0]);
					const recommendationData = await this.base.recommendations.fetchRecommendations(contexts, rootContext);
					if (recommendationData?.length) {
						this.storeRecommendationContexts(contexts);
					}
					// need to validate that the response is properly formatted
					return this.applyRecommendation(recommendationData, contexts);
				} catch (e) {
					Log.error("There was an error fetching the recommendations", e as Error);
				}
			}
		}
		return false;
	}

	/**
	 * Fetch the recommendations on field change and apply them on the UI.
	 *
	 * @param field The changed field.
	 * @param context The context that shall be considered when fetching recommendations.
	 * @public
	 * @returns `true` if the recommendation were fetched and applied correctly
	 */
	@publicExtension()
	public async fetchAndApplyRecommendationsOnFieldChange(field: Control, context: ODataV4Context[]): Promise<boolean> {
		const appComponent = this.base.getAppComponent();
		const isFieldRecommendationRelevant = appComponent.getSideEffectsService().checkIfFieldIsRecommendationRelevant(field);

		if (isFieldRecommendationRelevant) {
			return this.fetchAndApplyRecommendations(context);
		} else {
			return false;
		}
	}

	/**
	 * Returns the filtered recommendations from passed recommendations and then based on it we either show the filtered recommendations or not show the Accept all Dialog if there are no recommendations.
	 * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
	 * @returns Promise
	 */
	@publicExtension()
	@extensible("AfterAsync")
	public async onBeforeAcceptRecommendations(_params: AcceptAllParams): Promise<void> {
		//do nothing
		return Promise.resolve(); //had to do this because of eslint error of not having await when the function is async
	}

	/**
	 * This function is responsible for accepting the recommendations.
	 * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
	 * @returns Promise which resolved to a Boolean value based on whether recommendations are accepted or not
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public async acceptRecommendations(_params: AcceptAllParams): Promise<boolean> {
		//do nothing
		return Promise.resolve(true); //had to do this because of eslint error of not having await when the function is async
	}
	private applyRecommendation(recommendationResponses: StandardRecommendationResponse[], _context: ODataV4Context[]): boolean {
		standardRecommendationHelper.storeRecommendations(
			recommendationResponses,
			this.getView().getModel("internal") as JSONModel,
			_context
		);

		return true;
	}

	/**
	 * Stores the recommendation contexts.
	 *
	 * @param contexts
	 */
	private storeRecommendationContexts(contexts: ODataV4Context[]): void {
		let recommendationContexts = this.recommendationContexts || [];
		const contextPaths: string[] = [];
		contexts.forEach((context: ODataV4Context) => {
			contextPaths.push(context.getPath());
		});
		recommendationContexts = recommendationContexts?.filter((recommendationContext: ODataV4Context) => {
			if (recommendationContext && recommendationContext?.getModel() && !contextPaths.includes(recommendationContext.getPath())) {
				return true;
			}
			return false;
		});
		this.recommendationContexts = [...recommendationContexts, ...contexts];
	}

	/**
	 * Filters the contexts and only returns the contexts which are matching with the contexts .
	 *
	 * @param targets
	 * @returns Filtered Recommendation relevant Contexts
	 */
	private fetchFilteredRecommendationContexts(targets: string[]): ODataV4Context[] {
		const contextPaths: string[] = [];
		const filteredRecommendationContexts: ODataV4Context[] = [];
		for (const key of targets) {
			const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
			this.recommendationContexts.forEach((context: ODataV4Context) => {
				if (context.getPath() == contextPathFromKey && !contextPaths.includes(contextPathFromKey)) {
					contextPaths.push(contextPathFromKey);
					filteredRecommendationContexts.push(context);
				}
			});
		}
		return filteredRecommendationContexts;
	}

	/**
	 * Fetches RecommendationData based on filtered targets.
	 *
	 * @param filteredTargets
	 * @returns RecommendationData
	 */
	private fetchFilteredRecommendationData(filteredTargets: string[]): RecommendationInfo {
		const filterRecommendationsData: RecommendationInfo = {};
		const recommendationData = this.getView()?.getModel("internal")?.getProperty("/recommendationsData");
		Object.keys(recommendationData).forEach((key: string) => {
			if (filteredTargets.includes(key)) {
				filterRecommendationsData[key] = Object.assign(recommendationData[key], {});
			}
		});
		return filterRecommendationsData;
	}

	/**
	 * Fetches the filtered targets.
	 *
	 * @returns Array of Filtered targets
	 */
	private fetchTargets(): string[] {
		const recommendationData = this.getView()?.getModel("internal")?.getProperty("/recommendationsData");
		if (recommendationData.version === null) {
			return [];
		}
		return (
			Object.keys(recommendationData).filter((key: string) => {
				return key !== "version" && key.includes(this.getView()?.getBindingContext()?.getPath() as string);
			}) || []
		);
	}

	/**
	 * Overwrites AcceptAll Params based of recommendation data and contexts.
	 *
	 * @param filterRecommendationData
	 * @param filterRecommendationContexts
	 * @param params
	 */
	private adjustAcceptAllParams(
		filterRecommendationData: RecommendationInfo,
		filterRecommendationContexts: ODataV4Context[],
		params: AcceptAllParams
	): void {
		params.recommendationData = [];
		for (const key in filterRecommendationData) {
			const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
			const propertyPathFromKey = key.substring(key.lastIndexOf(")") + 2);
			const matchingContext = filterRecommendationContexts.filter(function (context) {
				if (context.getPath() === contextPathFromKey) {
					return true;
				}
			});
			if (standardRecommendationHelper.isRecommendationFieldNull(matchingContext[0], key, propertyPathFromKey)) {
				params.recommendationData.push({
					context: matchingContext[0],
					propertyPath: propertyPathFromKey,
					value: filterRecommendationData[key].value,
					text: filterRecommendationData[key].text
				});
			}
		}
	}

	/**
	 * Fetches RecommendationInfo that contains targets, filterRecommendationData, filterRecommendationContexts.
	 *
	 * @returns Promise which resolves with AcceptallParams
	 */
	public async fetchAcceptAllParams(): Promise<AcceptAllParams> {
		const targets: string[] = this.fetchTargets();
		const filterRecommendationData = this.fetchFilteredRecommendationData(targets);
		const filterRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
		const params = {};
		this.adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params);
		await (this.getView()?.getController() as PageController).recommendations.onBeforeAcceptRecommendations(params);
		return params;
	}

	/**
	 * Checks if recommendations exist or not.
	 *
	 * @returns Boolean value based on whether recommendations are present or not
	 */
	public checkIfRecommendationsExist(): boolean {
		const recommendationData = this.getView()?.getModel("internal")?.getProperty("/recommendationsData") || {};
		return Object.keys(recommendationData).length !== 0;
	}
}
