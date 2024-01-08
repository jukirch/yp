import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import ActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import NavigationReason from "sap/fe/core/controllerextensions/routing/NavigationReason";
import type RouterProxy from "sap/fe/core/controllerextensions/routing/RouterProxy";
import type { EnhanceWithUI5 } from "sap/fe/core/helpers/ClassSupport";
import { defineUI5Class, extensible, finalExtension, methodOverride, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import EditState from "sap/fe/core/helpers/EditState";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import SemanticKeyHelper from "sap/fe/core/helpers/SemanticKeyHelper";
import type { RoutingNavigationInfo, RoutingNavigationParameters, RoutingService } from "sap/fe/core/services/RoutingServiceFactory";
import type Event from "sap/ui/base/Event";
import Component from "sap/ui/core/Component";
import Core from "sap/ui/core/Core";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Router from "sap/ui/core/routing/Router";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { SideEffectsTargetType } from "../services/SideEffectsServiceFactory";

/**
 * {@link sap.ui.core.mvc.ControllerExtension Controller extension}
 *
 * @since 1.74.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.InternalRouting")
class InternalRouting extends ControllerExtension {
	private base!: PageController;

	private _oView!: FEView;

	private _oAppComponent!: AppComponent;

	private _oPageComponent!: EnhanceWithUI5<TemplateComponent> | null;

	private _oRouter!: Router;

	private _oRoutingService!: RoutingService;

	private _oRouterProxy!: RouterProxy;

	private _fnRouteMatchedBound!: Function;

	protected _oTargetInformation: any;

	@methodOverride()
	onExit() {
		if (this._oRoutingService) {
			this._oRoutingService.detachRouteMatched(this._fnRouteMatchedBound);
		}
	}

	@methodOverride()
	onInit() {
		this._oView = this.base.getView();
		this._oAppComponent = CommonUtils.getAppComponent(this._oView);
		this._oPageComponent = Component.getOwnerComponentFor(this._oView) as EnhanceWithUI5<TemplateComponent>;
		this._oRouter = this._oAppComponent.getRouter();
		this._oRouterProxy = (this._oAppComponent as any).getRouterProxy();

		if (!this._oAppComponent || !this._oPageComponent) {
			throw new Error("Failed to initialize controler extension 'sap.fe.core.controllerextesions.InternalRouting");
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (this._oAppComponent === this._oPageComponent) {
			// The view isn't hosted in a dedicated UIComponent, but directly in the app
			// --> just keep the view
			this._oPageComponent = null;
		}

		this._oAppComponent
			.getService("routingService")
			.then((oRoutingService: RoutingService) => {
				this._oRoutingService = oRoutingService;
				this._fnRouteMatchedBound = this._onRouteMatched.bind(this);
				this._oRoutingService.attachRouteMatched(this._fnRouteMatchedBound);
				this._oTargetInformation = oRoutingService.getTargetInformationFor(this._oPageComponent || this._oView);
			})
			.catch(function () {
				throw new Error("This controller extension cannot work without a 'routingService' on the main AppComponent");
			});
	}

	/**
	 * Triggered every time this controller is a navigation target.
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onRouteMatched() {
		/**/
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onRouteMatchedFinished() {
		/**/
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeBinding(oBindingContext: any, mParameters?: any) {
		const oRouting = (this.base.getView().getController() as any).routing;
		if (oRouting && oRouting.onBeforeBinding) {
			oRouting.onBeforeBinding(oBindingContext, mParameters);
		}
	}

	@publicExtension()
	@extensible(OverrideExecution.After)
	onAfterBinding(oBindingContext: any, mParameters?: any) {
		(this._oAppComponent as any).getRootViewController().onContextBoundToView(oBindingContext);
		const oRouting = (this.base.getView().getController() as any).routing;
		if (oRouting && oRouting.onAfterBinding) {
			oRouting.onAfterBinding(oBindingContext, mParameters);
		}
	}

	///////////////////////////////////////////////////////////
	// Methods triggering a navigation after a user action
	// (e.g. click on a table row, button, etc...)
	///////////////////////////////////////////////////////////

	/**
	 * Navigates to the specified navigation target.
	 *
	 * @param oContext Context instance
	 * @param sNavigationTargetName Name of the navigation target
	 * @param bPreserveHistory True to force the new URL to be added at the end of the browser history (no replace)
	 */
	@publicExtension()
	navigateToTarget(oContext: any, sNavigationTargetName: string, bPreserveHistory?: boolean) {
		const oNavigationConfiguration =
			this._oPageComponent &&
			this._oPageComponent.getNavigationConfiguration &&
			this._oPageComponent.getNavigationConfiguration(sNavigationTargetName);
		if (oNavigationConfiguration) {
			const oDetailRoute = oNavigationConfiguration.detail;
			const sRouteName = oDetailRoute.route;
			const mParameterMapping = oDetailRoute.parameters;
			this._oRoutingService.navigateTo(oContext, sRouteName, mParameterMapping, bPreserveHistory);
		} else {
			this._oRoutingService.navigateTo(oContext, null, null, bPreserveHistory);
		}
		this._oView.getViewData();
	}

	/**
	 * Navigates to the specified navigation target route.
	 *
	 * @param sTargetRouteName Name of the target route
	 * @param [oParameters] Parameters to be used with route to create the target hash
	 * @returns Promise that is resolved when the navigation is finalized
	 */
	@publicExtension()
	async navigateToRoute(sTargetRouteName: string, oParameters?: object): Promise<boolean> {
		return this._oRoutingService.navigateToRoute(sTargetRouteName, oParameters);
	}

	/**
	 * Navigates to a specific context.
	 *
	 * @param context The context to be navigated to
	 * @param parameters Optional navigation parameters
	 * @returns Promise resolved to 'true' when the navigation has been triggered, 'false' if the navigation did not happen
	 */
	async navigateToContext(context: Context | ODataListBinding, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		if (context.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
			if (parameters.createOnNavigateParameters?.mode === "Async") {
				// the context is either created async (Promise)
				// We need to activate the routeMatchSynchro on the RouterProxy to avoid that
				// the subsequent call to navigateToContext conflicts with the current one
				this._oRouterProxy.activateRouteMatchSynchronization();

				parameters.createOnNavigateParameters.createContextPromise
					.then(async (createdContext) => {
						// once the context is returned we navigate into it
						return this.navigateToContext(createdContext, {
							checkNoHashChange: parameters.checkNoHashChange,
							editable: parameters.editable,
							persistOPScroll: parameters.persistOPScroll,
							updateFCLLevel: parameters.updateFCLLevel,
							forceFocus: parameters.forceFocus
						});
					})
					.catch(function (oError: any) {
						Log.error("Error with the async context", oError);
					});
			} else if (parameters.createOnNavigateParameters?.mode !== "Deferred") {
				// Navigate to a list binding not yet supported
				throw "navigation to a list binding is not yet supported";
			}
		} else if (parameters.callExtension) {
			const internalModel = this._oView.getModel("internal");
			internalModel.setProperty("/paginatorCurrentContext", null);

			// Storing the selected context to use it in internal route navigation if neccessary.
			const overrideNav = this.base.getView().getController().routing.onBeforeNavigation({ bindingContext: context });
			if (overrideNav) {
				internalModel.setProperty("/paginatorCurrentContext", context);
				return Promise.resolve(true);
			}
		}

		parameters.FCLLevel = this._getFCLLevel();

		return this._oRoutingService.navigateToContext(context, parameters, this._oView.getViewData(), this._oTargetInformation);
	}

	/**
	 * Navigates backwards from a context.
	 *
	 * @param context Context to be navigated from
	 * @param [mParameters] Optional navigation parameters
	 * @returns Promise resolved when the navigation has been triggered
	 */
	async navigateBackFromContext(context: Context, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		parameters.updateFCLLevel = -1;

		return this.navigateToContext(context, parameters);
	}

	/**
	 * Navigates forwards to a context.
	 *
	 * @param context Context to be navigated to
	 * @param parameters Optional navigation parameters
	 * @returns Promise resolved when the navigation has been triggered
	 */
	async navigateForwardToContext(context: Context | ODataListBinding, parameters: RoutingNavigationParameters = {}): Promise<boolean> {
		if (this._oView.getBindingContext("internal")?.getProperty("messageFooterContainsErrors") === true) {
			return Promise.resolve(true);
		}

		parameters.updateFCLLevel = 1;

		return this.navigateToContext(context, parameters);
	}

	/**
	 * Navigates back in history if the current hash corresponds to a transient state.
	 */
	@publicExtension()
	@finalExtension()
	navigateBackFromTransientState() {
		const sHash = this._oRouterProxy.getHash();

		// if triggered while navigating to (...), we need to navigate back
		if (sHash.includes("(...)")) {
			this._oRouterProxy.navBack();
		}
	}

	@publicExtension()
	@finalExtension()
	navigateToMessagePage(sErrorMessage: any, mParameters: any) {
		mParameters = mParameters || {};
		if (this._oRouterProxy.getHash().includes("i-action=create") || this._oRouterProxy.getHash().includes("i-action=autoCreate")) {
			return this._oRouterProxy.navToHash(this._oRoutingService.getDefaultCreateHash());
		} else {
			mParameters.FCLLevel = this._getFCLLevel();

			return (this._oAppComponent as any).getRootViewController().displayErrorPage(sErrorMessage, mParameters);
		}
	}

	/**
	 * Checks if one of the current views on the screen is bound to a given context.
	 *
	 * @param oContext
	 * @returns `true` if the state is impacted by the context
	 */
	@publicExtension()
	@finalExtension()
	isCurrentStateImpactedBy(oContext: any) {
		return this._oRoutingService.isCurrentStateImpactedBy(oContext);
	}

	_isViewPartOfRoute(routeInformation: any): boolean {
		const aTargets = routeInformation?.targets;
		if (!aTargets || aTargets.indexOf(this._oTargetInformation.targetName) === -1) {
			// If the target for this view has a view level greater than the route level, it means this view comes "after" the route
			// in terms of navigation.
			// In such case, we remove its binding context, to avoid this view to have data if we navigate to it later on
			// This is done in a timeout to allow for focusout events to be processed before properly in collaborative draft
			if ((this._oTargetInformation.viewLevel ?? 0) >= (routeInformation?.routeLevel ?? 0)) {
				setTimeout(() => {
					if (routeInformation?.routeLevel === 0 && ActivitySync.isConnected(this.getView())) {
						// The route has level 0 --> we need to leave the collaboration session as no OP is displayed
						ActivitySync.disconnect(this.getView());
					}
					this._setBindingContext(null); // This also call setKeepAlive(false) on the current context
				}, 0);
			}
			return false;
		}

		return true;
	}

	_buildBindingPath(
		routeArguments: Record<string, string | object>,
		bindingPattern: string,
		navigationParameters: RoutingNavigationInfo
	): { path: string; deferred: boolean } {
		let path = bindingPattern.replace(":?query:", "");
		let deferred = false;

		for (const sKey in routeArguments) {
			const sValue = routeArguments[sKey];

			if (typeof sValue !== "string") {
				continue;
			}

			if (sValue === "..." && bindingPattern.includes(`{${sKey}}`)) {
				deferred = true;
				// Sometimes in preferredMode = create, the edit button is shown in background when the
				// action parameter dialog shows up, setting bTargetEditable passes editable as true
				// to onBeforeBinding in _bindTargetPage function
				navigationParameters.bTargetEditable = true;
			}
			path = path.replace(`{${sKey}}`, sValue);
		}
		if (routeArguments["?query"] && routeArguments["?query"].hasOwnProperty("i-action")) {
			navigationParameters.bActionCreate = true;
		}

		// the binding path is always absolute
		if (path && path[0] !== "/") {
			path = `/${path}`;
		}

		return { path, deferred };
	}

	///////////////////////////////////////////////////////////
	// Methods to bind the page when a route is matched
	///////////////////////////////////////////////////////////

	/**
	 * Called when a route is matched.
	 * Builds the binding context from the navigation parameters, and bind the page accordingly.
	 *
	 * @param oEvent
	 */
	_onRouteMatched(oEvent: Event<{ routeInformation: unknown; routePattern: string; navigationInfo: RoutingNavigationInfo }>): void {
		// Check if the target for this view is part of the event targets (i.e. is a target for the current route).
		// If not, we don't need to bind it --> return
		if (!this._isViewPartOfRoute(oEvent.getParameter("routeInformation"))) {
			return;
		}

		// Retrieve the binding context pattern
		let bindingPattern;
		if (this._oPageComponent && this._oPageComponent.getBindingContextPattern) {
			bindingPattern = this._oPageComponent.getBindingContextPattern();
		}
		bindingPattern = bindingPattern || this._oTargetInformation.contextPattern;

		if (bindingPattern === null || bindingPattern === undefined) {
			// Don't do this if we already got sTarget == '', which is a valid target pattern
			bindingPattern = oEvent.getParameter("routePattern");
		}

		// Replace the parameters by their values in the binding context pattern
		const mArguments = (oEvent.getParameters() as any).arguments;
		const oNavigationParameters = oEvent.getParameter("navigationInfo");
		const { path, deferred } = this._buildBindingPath(mArguments, bindingPattern, oNavigationParameters);

		this.onRouteMatched();

		const oModel = this._oView.getModel();
		const bindPromise = deferred
			? this._bindDeferred(path, oNavigationParameters)
			: this._bindPage(path, oModel, oNavigationParameters);

		bindPromise
			.finally(() => {
				this.onRouteMatchedFinished();
			})
			.catch((error) => {
				Log.error("Error during page binding " + error.toString());
			});

		(this._oAppComponent as any).getRootViewController().updateUIStateForView(this._oView, this._getFCLLevel());
	}

	/**
	 * Deferred binding (during object creation).
	 *
	 * @param targetPath The path to the deffered context
	 * @param navigationParameters Navigation parameters
	 * @returns A promise
	 */
	async _bindDeferred(targetPath: string, navigationParameters: RoutingNavigationInfo): Promise<void> {
		this.onBeforeBinding(null, { editable: navigationParameters.bTargetEditable });

		if (!navigationParameters.createOnNavigateParameters || navigationParameters.createOnNavigateParameters.mode === "Deferred") {
			// either the context shall be created in the target page (deferred Context) or it shall
			// be created async but the user refreshed the page / bookmarked this URL
			// TODO: currently the target component creates this document but we shall move this to
			// a central place
			if (this._oPageComponent && this._oPageComponent.createDeferredContext) {
				this._oPageComponent.createDeferredContext(
					targetPath,
					navigationParameters.createOnNavigateParameters?.listBinding,
					navigationParameters.createOnNavigateParameters?.parentContext,
					navigationParameters.createOnNavigateParameters?.data,
					!!navigationParameters.bActionCreate
				);
			}
		}

		const currentBindingContext = this._getBindingContext();
		if (currentBindingContext?.hasPendingChanges()) {
			// For now remove the pending changes to avoid the model raises errors and the object page is at least bound
			// Ideally the user should be asked for
			currentBindingContext.getBinding().resetChanges();
		}

		// remove the context to avoid showing old data
		this._setBindingContext(null);

		this.onAfterBinding(null);

		return Promise.resolve();
	}

	/**
	 * Sets the binding context of the page from a path.
	 *
	 * @param targetPath The path to the context
	 * @param model The OData model
	 * @param navigationParameters Navigation parameters
	 * @returns A Promise resolved once the binding has been set on the page
	 */
	_bindPage(targetPath: string, model: ODataModel, navigationParameters: RoutingNavigationInfo) {
		if (targetPath === "") {
			return Promise.resolve(this._bindPageToContext(null, model, navigationParameters));
		}

		return this.resolvePath(targetPath, model, navigationParameters)
			.then((technicalPath: string) => {
				this._bindPageToPath(technicalPath, model, navigationParameters);
			})
			.catch((error: any) => {
				// Error handling for erroneous metadata request
				const resourceBundle = Core.getLibraryResourceBundle("sap.fe.core");

				this.navigateToMessagePage(resourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
					title: resourceBundle.getText("C_COMMON_SAPFE_ERROR"),
					description: error.message
				});
			});
	}

	/**
	 * Creates the filter to retrieve a context corresponding to a semantic path.
	 *
	 * @param semanticPath The semantic or technical path
	 * @param semanticKeys The semantic or technical keys for the path
	 * @param metaModel The instance of the metamodel
	 * @returns The filter
	 */
	createFilterFromPath(semanticPath: string, semanticKeys: string[], metaModel: ODataMetaModel): Filter | null {
		const unquoteAndDecode = function (value: string): string {
			if (value.indexOf("'") === 0 && value.lastIndexOf("'") === value.length - 1) {
				// Remove the quotes from the value and decode special chars
				value = decodeURIComponent(value.substring(1, value.length - 1));
			}
			return value;
		};
		const keyValues = semanticPath.substring(semanticPath.indexOf("(") + 1, semanticPath.length - 1).split(",");

		let finalKeys = semanticKeys;
		let finalKeyValues = keyValues;
		// If we have technical keys, IsActiveEntity will be present. We need to remove it as we're already adding them at the end.
		if (semanticKeys.includes("IsActiveEntity")) {
			finalKeys = semanticKeys.filter((singleKey) => !singleKey.includes("IsActiveEntity"));
			finalKeyValues = keyValues.filter((element) => !element.startsWith("IsActiveEntity"));
		}

		if (finalKeys.length != finalKeyValues.length) {
			return null;
		}

		const filteringCaseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel);
		let filters: Filter[];
		if (finalKeys.length === 1) {
			// If this is a technical key, the equal is present because there's at least 2 parameters, a technical key and IsActiveEntity
			if (finalKeyValues[0].indexOf("=") > 0) {
				const keyPart = finalKeyValues[0].split("=");
				finalKeyValues[0] = keyPart[1];
			}
			// Take the first key value
			const keyValue = unquoteAndDecode(finalKeyValues[0]);
			filters = [
				new Filter({
					path: finalKeys[0],
					operator: FilterOperator.EQ,
					value1: keyValue,
					caseSensitive: filteringCaseSensitive
				})
			];
		} else {
			const mKeyValues: any = {};
			// Create a map of all key values
			finalKeyValues.forEach(function (sKeyAssignment: string) {
				const aParts = sKeyAssignment.split("="),
					keyValue = unquoteAndDecode(aParts[1]);

				mKeyValues[aParts[0]] = keyValue;
			});

			let failed = false;
			filters = finalKeys.map(function (semanticKey) {
				const key = semanticKey,
					value = mKeyValues[key];

				if (value !== undefined) {
					return new Filter({
						path: key,
						operator: FilterOperator.EQ,
						value1: value,
						caseSensitive: filteringCaseSensitive
					});
				} else {
					failed = true;
					return new Filter({
						path: "XX"
					}); // will be ignored anyway since we return after
				}
			});

			if (failed) {
				return null;
			}
		}

		// Add a draft filter to make sure we take the draft entity if there is one
		// Or the active entity otherwise
		const draftFilter = new Filter({
			filters: [new Filter("IsActiveEntity", "EQ", false), new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
			and: false
		});
		filters.push(draftFilter);

		return new Filter(filters, true);
	}

	/**
	 * Converts a path with semantic keys to a path with technical keys.
	 *
	 * @param pathWithParameters The path with semantic keys
	 * @param model The model for the path
	 * @param keys The semantic or technical keys for the path
	 * @returns A Promise containing the path with technical keys if pathWithParameters could be interpreted as a technical path, null otherwise
	 */
	async getTechnicalPathFromPath(pathWithParameters: string, model: ODataModel, keys: string[]): Promise<string | null> {
		const metaModel = model.getMetaModel();
		let entitySetPath = metaModel.getMetaContext(pathWithParameters).getPath();

		if (!keys || keys.length === 0) {
			// No semantic/technical keys
			return null;
		}

		// Create a set of filters corresponding to all keys
		const filter = this.createFilterFromPath(pathWithParameters, keys, metaModel);
		if (filter === null) {
			// Couldn't interpret the path as a semantic one
			return null;
		}

		// Load the corresponding object
		if (!entitySetPath?.startsWith("/")) {
			entitySetPath = `/${entitySetPath}`;
		}
		const listBinding = model.bindList(entitySetPath, undefined, undefined, filter, {
			$$groupId: "$auto.Heroes"
		});

		const contexts = await listBinding.requestContexts(0, 2);
		if (contexts.length) {
			return contexts[0].getPath();
		} else {
			// No data could be loaded
			return null;
		}
	}

	/**
	 * Refreshes a context.
	 *
	 * @param model The OData model
	 * @param pathToReplaceWith The path to the new context
	 * @param contextToRemove The initial context that is going to be replaced
	 */
	async refreshContext(model: ODataModel, pathToReplaceWith: string, contextToRemove: Context): Promise<void> {
		const rootViewController = this._oAppComponent.getRootViewController();
		if (rootViewController.isFclEnabled()) {
			const contextToReplaceWith = model.getKeepAliveContext(pathToReplaceWith);
			contextToRemove.replaceWith(contextToReplaceWith);
		} else {
			EditState.setEditStateDirty();
		}
	}

	/**
	 * Checks if a path is a root draft.
	 *
	 * @param path The path to test
	 * @param metaModel The associated metadata model
	 * @returns `true` if the path is a root path
	 */
	checkDraftAvailability(path: string, metaModel: ODataMetaModel): boolean {
		const matches = /^[/]?(\w+)\([^/]+\)$/.exec(path);
		if (!matches) {
			return false;
		}
		// Get the entitySet name
		const entitySetPath = `/${matches[1]}`;
		// Check the entity set supports draft
		const draftRoot = metaModel.getObject(`${entitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
		return draftRoot ? true : false;
	}

	/**
	 * Builds a path to navigate to from a path with SemanticKeys or technical keys.
	 *
	 * @param pathToResolve The path to be transformed
	 * @param model The OData model
	 * @param navigationParameter The parameter of the navigation
	 * @returns String promise for the new path. If pathToResolve couldn't be interpreted as a semantic path, it is returned as is.
	 */
	async resolvePath(pathToResolve: string, model: ODataModel, navigationParameter: RoutingNavigationInfo): Promise<string> {
		const metaModel = model.getMetaModel();
		const lastSemanticMapping = this._oRoutingService.getLastSemanticMapping();
		let currentHashNoParams = this._oRouter.getHashChanger().getHash().split("?")[0];

		if (currentHashNoParams?.lastIndexOf("/") === currentHashNoParams?.length - 1) {
			// Remove trailing '/'
			currentHashNoParams = currentHashNoParams.substring(0, currentHashNoParams.length - 1);
		}

		let rootEntityName = currentHashNoParams?.substring(0, currentHashNoParams.indexOf("("));
		if (rootEntityName.indexOf("/") === 0) {
			rootEntityName = rootEntityName.substring(1);
		}
		const isRootDraft = this.checkDraftAvailability(currentHashNoParams, metaModel),
			semanticKeys = isRootDraft
				? (SemanticKeyHelper.getSemanticKeys(metaModel, rootEntityName) as { $PropertyPath: string }[])
				: undefined,
			isCollaborationEnabled = ModelHelper.isCollaborationDraftSupported(metaModel);

		/**
		 * If the entity is draft enabled, we're in a collaboration application, and we're navigating to a draft from a list, we're treating it as a new path.
		 * We want to check if the draft exists first, then we navigate on it if it does exist, otherwise we navigate to the saved version.
		 */
		if (isRootDraft && isCollaborationEnabled && navigationParameter.reason === NavigationReason.RowPress) {
			const isActiveEntity = navigationParameter.useContext?.getProperty("IsActiveEntity") ?? true;
			if (!isActiveEntity) {
				return this.resolveCollaborationPath(pathToResolve, model, navigationParameter, semanticKeys, rootEntityName);
			}
		}
		/**
		 * This is the 'normal' process.
		 * If we don't have semantic keys, the path we have is technical and can be used as is.
		 * If the path to resolve is the same as the semantic path, then we know is has been resolved previously and we can return the technical path
		 * Otherwise, we need to evaluate the technical path, to set up the semantic mapping (if it's been resolved).
		 */
		if (semanticKeys === undefined) {
			return pathToResolve;
		}
		if (lastSemanticMapping?.semanticPath === pathToResolve) {
			// This semantic path has been resolved previously
			return lastSemanticMapping.technicalPath;
		}
		const formattedSemanticKeys = semanticKeys.map((singleKey) => singleKey.$PropertyPath);

		// We need resolve the semantic path to get the technical keys
		const technicalPath = await this.getTechnicalPathFromPath(currentHashNoParams, model, formattedSemanticKeys);

		if (technicalPath && technicalPath !== pathToResolve) {
			// The semantic path was resolved (otherwise keep the original value for target)
			this._oRoutingService.setLastSemanticMapping({
				technicalPath: technicalPath,
				semanticPath: pathToResolve
			});
			return technicalPath;
		}
		return pathToResolve;
	}

	/**
	 * Evaluate the path to navigate when we're in a collaboration application and navigating to a draft.
	 * If the draft has been discarded, we change the path to the sibling element associated, otherwise we keep the same path.
	 * We're not doing it outside of collaboration as it's adding a request during navigation!
	 *
	 * @param pathToResolve The path we're checking. If the draft exists, we return it as is, otherwise we return the sibling element associated
	 * @param model The oData model
	 * @param navigationParameter The parameter of the navigation
	 * @param semanticKeys The semantic keys if we have semantic navigation, otherwise false
	 * @param rootEntityName Name of the root entity
	 * @returns The path to navigate to
	 */
	async resolveCollaborationPath(
		pathToResolve: string,
		model: ODataModel,
		navigationParameter: RoutingNavigationInfo,
		semanticKeys: { $PropertyPath: string }[] | undefined,
		rootEntityName: string
	): Promise<string> {
		const lastSemanticMapping = this._oRoutingService.getLastSemanticMapping();
		const metaModel = model.getMetaModel();
		const currentHashNoParams = this._oRouter.getHashChanger().getHash().split("?")[0];
		let formattedKeys: string[];
		const comparativePath = lastSemanticMapping?.technicalPath ?? pathToResolve;
		if (semanticKeys) {
			formattedKeys = semanticKeys.map((singleKey) => singleKey.$PropertyPath);
		} else {
			formattedKeys = metaModel.getObject(`/${rootEntityName}/$Type/$Key`);
		}

		const technicalPath = await this.getTechnicalPathFromPath(currentHashNoParams, model, formattedKeys);
		if (technicalPath === null) {
			return pathToResolve;
		}
		// Comparing path that was returned from the server with the one we have. If they are different, it means the draft doesn't exist.
		if (technicalPath !== comparativePath && navigationParameter.useContext) {
			if (lastSemanticMapping) {
				this._oRoutingService.setLastSemanticMapping({
					technicalPath: technicalPath,
					semanticPath: pathToResolve
				});
			}
			navigationParameter.redirectedToNonDraft =
				metaModel.getObject(`/${rootEntityName}/@com.sap.vocabularies.UI.v1.HeaderInfo`)?.TypeName ?? rootEntityName;
			await this.refreshContext(model, technicalPath, navigationParameter.useContext);
		}
		return technicalPath;
	}

	/**
	 * Sets the binding context of the page from a path.
	 *
	 * @param sTargetPath The path to build the context. Needs to contain technical keys only.
	 * @param oModel The OData model
	 * @param oNavigationParameters Navigation parameters
	 */
	_bindPageToPath(sTargetPath: string, oModel: ODataModel, oNavigationParameters: RoutingNavigationInfo) {
		const oCurrentContext = this._getBindingContext(),
			sCurrentPath = oCurrentContext && oCurrentContext.getPath(),
			oUseContext = oNavigationParameters.useContext as Context | undefined | null;

		// We set the binding context only if it's different from the current one
		// or if we have a context already selected
		if (oUseContext && oUseContext.getPath() === sTargetPath) {
			if (oUseContext !== oCurrentContext) {
				let shouldRefreshContext = false;
				// We already have the context to be used, and it's not the current one
				const oRootViewController = this._oAppComponent.getRootViewController();

				// In case of FCL, if we're reusing a context from a table (through navigation), we refresh it to avoid outdated data
				// We don't wait for the refresh to be completed (requestRefresh), so that the corresponding query goes into the same
				// batch as the ones from controls in the page.
				if (oRootViewController.isFclEnabled() && oNavigationParameters.reason === NavigationReason.RowPress) {
					const metaModel = oUseContext.getModel().getMetaModel();
					if (!oUseContext.getBinding().hasPendingChanges()) {
						shouldRefreshContext = true;
					} else if (
						ActivitySync.isConnected(this.getView()) ||
						(ModelHelper.isDraftSupported(metaModel, oUseContext.getPath()) &&
							ModelHelper.isCollaborationDraftSupported(metaModel))
					) {
						// If there are pending changes but we're in collaboration draft, we force the refresh (discarding pending changes) as we need to have the latest version.
						// When navigating from LR to OP, the view is not connected yet --> check if we're in draft with collaboration from the metamodel
						oUseContext.getBinding().resetChanges();
						shouldRefreshContext = true;
					}
				}
				this._bindPageToContext(oUseContext, oModel, oNavigationParameters);
				if (shouldRefreshContext) {
					oUseContext.refresh();
				}
			} else if (oNavigationParameters.reason === NavigationReason.EditFlowAction) {
				// We have the same context but an editflow action happened (e.g. CancelDocument in sticky mode)
				// --> We need to call onBefore/AfterBinding to refresh the object page properly
				this.onBeforeBinding(oUseContext, {
					editable: oNavigationParameters.bTargetEditable,
					listBinding: oUseContext.getBinding(),
					bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
					reason: oNavigationParameters.reason,
					showPlaceholder: oNavigationParameters.bShowPlaceholder
				});
				this.onAfterBinding(oUseContext, { redirectedToNonDraft: oNavigationParameters?.redirectedToNonDraft });
			}
		} else if (sCurrentPath !== sTargetPath) {
			// We need to create a new context for its path
			this._bindPageToContext(this._createContext(sTargetPath, oModel), oModel, oNavigationParameters);
		} else if (
			oNavigationParameters.reason !== NavigationReason.AppStateChanged &&
			oNavigationParameters.reason !== NavigationReason.RestoreHistory &&
			EditState.isEditStateDirty()
		) {
			this._refreshBindingContext(oCurrentContext);
		}
	}

	/**
	 * Binds the page to a context.
	 *
	 * @param oContext Context to be bound
	 * @param oModel The OData model
	 * @param oNavigationParameters Navigation parameters
	 */
	_bindPageToContext(oContext: Context | null, oModel: ODataModel, oNavigationParameters: RoutingNavigationInfo) {
		if (!oContext) {
			this.onBeforeBinding(null);
			this.onAfterBinding(null);
			return;
		}

		const oParentListBinding = oContext.getBinding();
		const oRootViewController = this._oAppComponent.getRootViewController();
		if (oRootViewController.isFclEnabled()) {
			if (!oParentListBinding || !oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				// if the parentBinding is not a listBinding, we create a new context
				oContext = this._createContext(oContext.getPath(), oModel);
			}

			try {
				this._setKeepAlive(
					oContext,
					true,
					() => {
						if (oContext && oRootViewController.isContextUsedInPages(oContext)) {
							this.navigateBackFromContext(oContext);
						}
					},
					true // Load messages, otherwise they don't get refreshed later, e.g. for side effects
				);
			} catch (oError) {
				// setKeepAlive throws an exception if the parent listbinding doesn't have $$ownRequest=true
				// This case for custom fragments is supported, but an error is logged to make the lack of synchronization apparent
				Log.error(
					`View for ${oContext.getPath()} won't be synchronized. Parent listBinding must have binding parameter $$ownRequest=true`
				);
			}
		} else if (!oParentListBinding || oParentListBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			// We need to recreate the context otherwise we get errors
			oContext = this._createContext(oContext.getPath(), oModel);
		}

		// Set the binding context with the proper before/after callbacks
		this.onBeforeBinding(oContext, {
			editable: oNavigationParameters.bTargetEditable,
			listBinding: oParentListBinding,
			bPersistOPScroll: oNavigationParameters.bPersistOPScroll,
			reason: oNavigationParameters.reason,
			showPlaceholder: oNavigationParameters.bShowPlaceholder
		});

		this._setBindingContext(oContext);
		this.onAfterBinding(oContext, { redirectedToNonDraft: oNavigationParameters?.redirectedToNonDraft });
	}

	/**
	 * Creates a context from a path.
	 *
	 * @param sPath The path
	 * @param oModel The OData model
	 * @returns The created context
	 */
	_createContext(sPath: string, oModel: ODataModel) {
		const oPageComponent = this._oPageComponent,
			sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet(),
			sContextPath =
				(oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath()) || (sEntitySet && `/${sEntitySet}`),
			oMetaModel = oModel.getMetaModel(),
			mParameters: any = {
				$$groupId: "$auto.Heroes",
				$$updateGroupId: "$auto",
				$$patchWithoutSideEffects: true
			};
		// In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity)
		const oDraftRoot = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftRoot`);
		const oDraftNode = oMetaModel.getObject(`${sContextPath}@com.sap.vocabularies.Common.v1.DraftNode`);
		const oRootViewController = (this._oAppComponent as any).getRootViewController();
		if (oRootViewController.isFclEnabled()) {
			const oContext = this._getKeepAliveContext(oModel, sPath, false, mParameters);
			if (!oContext) {
				throw new Error(`Cannot create keepAlive context ${sPath}`);
			} else if (oDraftRoot || oDraftNode) {
				if (oContext.getProperty("IsActiveEntity") === undefined) {
					oContext.requestProperty(["HasActiveEntity", "HasDraftEntity", "IsActiveEntity"]);
					if (oDraftRoot) {
						oContext.requestObject("DraftAdministrativeData");
					}
				} else {
					// when switching between draft and edit we need to ensure those properties are requested again even if they are in the binding's cache
					// otherwise when you edit and go to the saved version you have no way of switching back to the edit version
					oContext.requestSideEffects(
						oDraftRoot
							? ["HasActiveEntity", "HasDraftEntity", "IsActiveEntity", "DraftAdministrativeData"]
							: ["HasActiveEntity", "HasDraftEntity", "IsActiveEntity"]
					);
				}
			}

			return oContext;
		} else {
			if (sEntitySet) {
				const sMessagesPath = oMetaModel.getObject(`${sContextPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
				if (sMessagesPath) {
					mParameters.$select = sMessagesPath;
				}
			}

			// In case of draft: $select the state flags (HasActiveEntity, HasDraftEntity, and IsActiveEntity)
			if (oDraftRoot || oDraftNode) {
				if (mParameters.$select === undefined) {
					mParameters.$select = "HasActiveEntity,HasDraftEntity,IsActiveEntity";
				} else {
					mParameters.$select += ",HasActiveEntity,HasDraftEntity,IsActiveEntity";
				}
			}
			if (this._oView.getBindingContext()) {
				const oPreviousBinding = (this._oView.getBindingContext() as any)?.getBinding();
				if (oPreviousBinding) {
					oModel.resetChanges(oPreviousBinding.getUpdateGroupId());
					oPreviousBinding.destroy();
				}
			}

			const oHiddenBinding = oModel.bindContext(sPath, undefined, mParameters);

			oHiddenBinding.attachEventOnce("dataRequested", () => {
				BusyLocker.lock(this._oView);
			});
			oHiddenBinding.attachEventOnce("dataReceived", this.onDataReceived.bind(this));
			return oHiddenBinding.getBoundContext();
		}
	}

	@publicExtension()
	async onDataReceived(oEvent: Event<{ error: { status: number } }>): Promise<void> {
		const sErrorDescription = oEvent && oEvent.getParameter("error");
		if (BusyLocker.isLocked(this._oView)) {
			BusyLocker.unlock(this._oView);
		}

		if (sErrorDescription) {
			// TODO: in case of 404 the text shall be different
			try {
				const oResourceBundle = await Core.getLibraryResourceBundle("sap.fe.core", true);
				const messageHandler = this.base.messageHandler;
				let mParams = {};
				if (sErrorDescription.status === 503) {
					mParams = {
						isInitialLoad503Error: true,
						shellBack: true
					};
				} else if (sErrorDescription.status === 400) {
					mParams = {
						title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
						description: oResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR_DESCRIPTION"),
						isDataReceivedError: true,
						shellBack: true
					};
				} else {
					mParams = {
						title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
						description: sErrorDescription,
						isDataReceivedError: true,
						shellBack: true
					};
				}
				await messageHandler.showMessages(mParams);
			} catch (oError: any) {
				Log.error("Error while getting the core resource bundle", oError);
			}
		}
	}

	/**
	 * Requests side effects on a binding context to "refresh" it.
	 * TODO: get rid of this once provided by the model
	 * a refresh on the binding context does not work in case a creation row with a transient context is
	 * used. also a requestSideEffects with an empty path would fail due to the transient context
	 * therefore we get all dependent bindings (via private model method) to determine all paths and then
	 * request them.
	 *
	 * @param oBindingContext Context to be refreshed
	 */
	_refreshBindingContext(oBindingContext: any) {
		const oPageComponent = this._oPageComponent;
		const oSideEffectsService = this._oAppComponent.getSideEffectsService();
		const sRootContextPath = oBindingContext.getPath();
		const sEntitySet = oPageComponent && oPageComponent.getEntitySet && oPageComponent.getEntitySet();
		const sContextPath =
			(oPageComponent && oPageComponent.getContextPath && oPageComponent.getContextPath()) || (sEntitySet && `/${sEntitySet}`);
		const oMetaModel = this._oView.getModel().getMetaModel();
		let sMessagesPath;
		const aNavigationPropertyPaths: any[] = [];
		const aPropertyPaths: any[] = [];
		const oSideEffects: SideEffectsTargetType = {
			targetProperties: [],
			targetEntities: []
		};

		function getBindingPaths(oBinding: any) {
			let aDependentBindings;
			const sRelativePath = ((oBinding.getContext() && oBinding.getContext().getPath()) || "").replace(sRootContextPath, ""); // If no context, this is an absolute binding so no relative path
			const sPath = (sRelativePath ? `${sRelativePath.slice(1)}/` : sRelativePath) + oBinding.getPath();

			if (oBinding.isA("sap.ui.model.odata.v4.ODataContextBinding")) {
				// if (sPath === "") {
				// now get the dependent bindings
				aDependentBindings = oBinding.getDependentBindings();
				if (aDependentBindings) {
					// ask the dependent bindings (and only those with the specified groupId
					//if (aDependentBindings.length > 0) {
					for (let i = 0; i < aDependentBindings.length; i++) {
						getBindingPaths(aDependentBindings[i]);
					}
				} else if (!aNavigationPropertyPaths.includes(sPath)) {
					aNavigationPropertyPaths.push(sPath);
				}
			} else if (oBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				if (!aNavigationPropertyPaths.includes(sPath)) {
					aNavigationPropertyPaths.push(sPath);
				}
			} else if (oBinding.isA("sap.ui.model.odata.v4.ODataPropertyBinding")) {
				if (!aPropertyPaths.includes(sPath)) {
					aPropertyPaths.push(sPath);
				}
			}
		}

		if (sContextPath) {
			sMessagesPath = oMetaModel.getObject(`${sContextPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
		}

		// binding of the context must have $$PatchWithoutSideEffects true, this bound context may be needed to be fetched from the dependent binding
		getBindingPaths(oBindingContext.getBinding());

		let i;
		for (i = 0; i < aNavigationPropertyPaths.length; i++) {
			oSideEffects.targetEntities.push({
				$NavigationPropertyPath: aNavigationPropertyPaths[i]
			});
		}
		oSideEffects.targetProperties = aPropertyPaths;
		if (sMessagesPath) {
			oSideEffects.targetProperties.push(sMessagesPath);
		}
		//all this logic to be replaced with a SideEffects request for an empty path (refresh everything), after testing transient contexts
		oSideEffects.targetProperties = oSideEffects.targetProperties.reduce((targets: string[], targetProperty) => {
			if (targetProperty) {
				const index = targetProperty.indexOf("/");
				targets.push(index > 0 ? targetProperty.slice(0, index) : targetProperty);
			}
			return targets;
		}, []);
		// OData model will take care of duplicates
		oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
	}

	/**
	 * Gets the binding context of the page or the component.
	 *
	 * @returns The binding context
	 */
	_getBindingContext(): Context | null | undefined {
		if (this._oPageComponent) {
			return this._oPageComponent.getBindingContext() as Context;
		} else {
			return this._oView.getBindingContext() as Context;
		}
	}

	/**
	 * Sets the binding context of the page or the component.
	 *
	 * @param oContext The binding context
	 */
	_setBindingContext(oContext: any) {
		let oPreviousContext, oTargetControl;
		if (this._oPageComponent) {
			oPreviousContext = this._oPageComponent.getBindingContext() as Context;
			oTargetControl = this._oPageComponent;
		} else {
			oPreviousContext = this._oView.getBindingContext() as Context;
			oTargetControl = this._oView;
		}

		oTargetControl.setBindingContext(oContext);

		if (oPreviousContext?.isKeepAlive() && oPreviousContext !== oContext) {
			this._setKeepAlive(oPreviousContext, false);
		}
	}

	/**
	 * Gets the flexible column layout (FCL) level corresponding to the view (-1 if the app is not FCL).
	 *
	 * @returns The level
	 */
	_getFCLLevel() {
		return this._oTargetInformation.FCLLevel;
	}

	_setKeepAlive(oContext: Context, bKeepAlive: boolean, fnBeforeDestroy?: Function, bRequestMessages?: boolean) {
		if (oContext.getPath().endsWith(")")) {
			// We keep the context alive only if they're part of a collection, i.e. if the path ends with a ')'
			const oMetaModel = oContext.getModel().getMetaModel();
			const sMetaPath = oMetaModel.getMetaPath(oContext.getPath());
			const sMessagesPath = oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
			oContext.setKeepAlive(bKeepAlive, fnBeforeDestroy, !!sMessagesPath && bRequestMessages);
		}
	}

	_getKeepAliveContext(oModel: ODataModel, path: string, bRequestMessages?: boolean, parameters?: any): Context | undefined {
		// Get the path for the context that is really kept alive (part of a collection)
		// i.e. remove all segments not ending with a ')'
		const keptAliveSegments = path.split("/");
		const additionnalSegments: string[] = [];
		while (keptAliveSegments.length && !keptAliveSegments[keptAliveSegments.length - 1].endsWith(")")) {
			additionnalSegments.push(keptAliveSegments.pop()!);
		}

		if (keptAliveSegments.length === 0) {
			return undefined;
		}

		const keptAlivePath = keptAliveSegments.join("/");
		const oKeepAliveContext = oModel.getKeepAliveContext(keptAlivePath, bRequestMessages, parameters);

		if (additionnalSegments.length === 0) {
			return oKeepAliveContext;
		} else {
			additionnalSegments.reverse();
			const additionnalPath = additionnalSegments.join("/");
			return oModel.bindContext(additionnalPath, oKeepAliveContext).getBoundContext();
		}
	}

	/**
	 * Switches between column and full-screen mode when FCL is used.
	 *
	 */

	@publicExtension()
	@finalExtension()
	switchFullScreen() {
		const oSource = this.base.getView();
		const oFCLHelperModel = oSource.getModel("fclhelper") as JSONModel,
			bIsFullScreen = oFCLHelperModel.getProperty("/actionButtonsInfo/isFullScreen"),
			sNextLayout = oFCLHelperModel.getProperty(
				bIsFullScreen ? "/actionButtonsInfo/exitFullScreen" : "/actionButtonsInfo/fullScreen"
			),
			oRootViewController = (this._oAppComponent as any).getRootViewController();

		const oContext = oRootViewController.getRightmostContext ? oRootViewController.getRightmostContext() : oSource.getBindingContext();

		this.base._routing.navigateToContext(oContext, { layout: sNextLayout }).catch(function () {
			Log.warning("cannot switch between column and fullscreen");
		});
	}

	/**
	 * Closes the column for the current view in a FCL.
	 *
	 */
	@publicExtension()
	@extensible(OverrideExecution.Before)
	closeColumn() {
		const oViewData = this._oView.getViewData() as any;
		const oContext = this._oView.getBindingContext() as Context;
		const oMetaModel = oContext.getModel().getMetaModel();
		const navigationParameters = {
			noPreservationCache: true,
			sLayout: (this._oView.getModel("fclhelper") as JSONModel).getProperty("/actionButtonsInfo/closeColumn")
		};

		if (oViewData?.viewLevel === 1 && ModelHelper.isDraftSupported(oMetaModel, oContext.getPath())) {
			draft.processDataLossOrDraftDiscardConfirmation(
				() => {
					this.navigateBackFromContext(oContext, navigationParameters);
				},
				Function.prototype,
				oContext,
				this._oView.getController(),
				false,
				draft.NavigationType.BackNavigation
			);
		} else {
			this.navigateBackFromContext(oContext, navigationParameters);
		}
	}
}

export default InternalRouting;
