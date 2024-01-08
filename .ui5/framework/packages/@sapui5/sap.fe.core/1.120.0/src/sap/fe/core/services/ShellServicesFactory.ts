import Log from "sap/base/Log";
import type Component from "sap/ui/core/Component";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type Container from "sap/ushell/Container";
import type CrossApplicationNavigation from "sap/ushell/services/CrossApplicationNavigation";
import type ShellNavigation from "sap/ushell/services/ShellNavigation";
import type URLParsing from "sap/ushell/services/URLParsing";
import type { ParsedHash } from "sap/ushell/services/URLParsing";
import type { ServiceContext } from "types/metamodel_types";

type GetLinkInput = {
	/**
	 * Optional, matches any semantic objects if undefined
	 */
	semanticObject?: string;
	/**
	 * Optional, matches any actions if undefined
	 */
	action?: string;
	/**
	 * Optional business parameters
	 */
	params?: object;
	/**
	 * Optional, defaults to false. If true, returns only the links that use at least one (non sap-) parameter
	 * from 'params'.
	 */
	withAtLeastOneUsedParam?: boolean;
	/**
	 * Optional parameter that decides on how the returned results will be sorted.
	 */
	sortResultsBy?: string;
	/**
	 * Optional, defaults to false. If true, only apps that match exactly the supplied technology (e.g. sap-ui-tech-hint=WDA)
	 * will be considered.
	 */
	treatTechHintAsFilter?: boolean;
	/**
	 * Mandatory, the UI5 component invoking the service, shall be a root component.
	 */
	ui5Component: Component;
	/**
	 * Optional, application state key to add to the generated links, SAP internal usage only.
	 */
	appStateKey?: string;
	/**
	 * Optional, whether intents should be returned in compact format. Defaults to false.
	 */
	compactIntents?: boolean;
	/**
	 * Optional, if specified, only returns links that match inbound with certain tags.
	 */
	tags?: string[];
};
export type StartupAppState = {
	getData(): {
		selectionVariant?: {
			SelectOptions?: {
				PropertyName: string;
				Ranges: {
					Option: string;
					Sign: string;
					Low: string;
				}[];
			}[];
		};
	};
};

/**
 * @interface IShellServices
 */
export interface IShellServices {
	initPromise: Promise<IShellServices>;
	instanceType: string;
	crossAppNavService?: CrossApplicationNavigation;
	getLinks(oArgs: object): Promise<any>;

	getLinksWithCache(oArgs: object): Promise<any[]>;

	toExternal(oNavArgumentsArr: Array<object>, oComponent: object): void;

	getStartupAppState(oArgs: object): Promise<undefined | StartupAppState>;

	backToPreviousApp(): void;

	hrefForExternal(oArgs?: object, oComponent?: object, bAsync?: boolean): string | Promise<string>;

	hrefForExternalAsync(oArgs?: object, oComponent?: object): Promise<any>;

	getAppState(oComponent: Component, sAppStateKey: string): Promise<any>;

	createEmptyAppState(oComponent: Component): object;

	createEmptyAppState(oComponent: Component): Promise<any>;

	isNavigationSupported(oNavArgumentsArr: Array<object>, oComponent?: object): Promise<any>;

	isInitialNavigation(): boolean;

	isInitialNavigationAsync(): Promise<any>;

	expandCompactHash(sHashFragment: string): any;

	getHash(): string;

	parseShellHash(sHash: string): ParsedHash;

	splitHash(sHash: string): object;

	constructShellHash(oNewShellHash: object): string;

	setDirtyFlag(bDirty: boolean): void;

	registerDirtyStateProvider(fnDirtyStateProvider: Function): void;

	deregisterDirtyStateProvider(fnDirtyStateProvider: Function): void;

	createRenderer(): object;

	getUser(): any;

	hasUShell(): boolean;

	registerNavigationFilter(fnNavFilter: Function): void;

	unregisterNavigationFilter(fnNavFilter: Function): void;

	setBackNavigation(fnCallBack?: Function): void;

	setHierarchy(aHierarchyLevels: Array<object>): void;

	setTitle(sTitle: string): void;

	getContentDensity(): string;

	getPrimaryIntent(sSemanticObject: string, mParameters?: object): Promise<any>;

	waitForPluginsLoad(): Promise<boolean>;

	getTitle(): string;
}

/**
 * Mock implementation of the ShellService for OpenFE
 *
 */
class ShellServiceMock extends Service<ShellServicesSettings> implements IShellServices {
	initPromise!: Promise<any>;

	instanceType!: string;

	init() {
		this.initPromise = Promise.resolve(this);
		this.instanceType = "mock";
	}

	getLinks(/*oArgs: object*/) {
		return Promise.resolve([]);
	}

	getLinksWithCache(/*oArgs: object*/) {
		return Promise.resolve([]);
	}

	toExternal(/*oNavArgumentsArr: Array<object>, oComponent: object*/) {
		/* Do Nothing */
	}

	getStartupAppState(/*oArgs: object*/) {
		return Promise.resolve(undefined);
	}

	backToPreviousApp() {
		/* Do Nothing */
	}

	hrefForExternal(/*oArgs?: object, oComponent?: object, bAsync?: boolean*/) {
		return "";
	}

	getHash() {
		return window.location.href;
	}

	hrefForExternalAsync(/*oArgs?: object, oComponent?: object*/) {
		return Promise.resolve({});
	}

	getAppState(/*oComponent: object, sAppStateKey: string*/) {
		return Promise.resolve({});
	}

	createEmptyAppState(/*oComponent: object*/) {
		return Promise.resolve({});
	}

	createEmptyAppStateAsync(/*oComponent: object*/) {
		return Promise.resolve({});
	}

	isNavigationSupported(/*oNavArgumentsArr: Array<object>, oComponent: object*/) {
		return Promise.resolve({});
	}

	isInitialNavigation() {
		return false;
	}

	isInitialNavigationAsync() {
		return Promise.resolve({});
	}

	expandCompactHash(/*sHashFragment: string*/) {
		return Promise.resolve({});
	}

	parseShellHash(/*sHash: string*/) {
		return {} as unknown as ParsedHash;
	}

	splitHash(/*sHash: string*/) {
		return Promise.resolve({});
	}

	constructShellHash(/*oNewShellHash: object*/) {
		return "";
	}

	setDirtyFlag(/*bDirty: boolean*/) {
		/* Do Nothing */
	}

	registerDirtyStateProvider(/*fnDirtyStateProvider: Function*/) {
		/* Do Nothing */
	}

	deregisterDirtyStateProvider(/*fnDirtyStateProvider: Function*/) {
		/* Do Nothing */
	}

	createRenderer() {
		return {};
	}

	getUser() {
		return {};
	}

	hasUShell() {
		return false;
	}

	registerNavigationFilter(/*fnNavFilter: Function*/): void {
		/* Do Nothing */
	}

	unregisterNavigationFilter(/*fnNavFilter: Function*/): void {
		/* Do Nothing */
	}

	setBackNavigation(/*fnCallBack?: Function*/): void {
		/* Do Nothing */
	}

	setHierarchy(/*aHierarchyLevels: Array<object>*/): void {
		/* Do Nothing */
	}

	setTitle(/*sTitle: string*/): void {
		/* Do Nothing */
	}

	getContentDensity(): string {
		// in case there is no shell we probably need to look at the classes being defined on the body
		if (document.body.classList.contains("sapUiSizeCozy")) {
			return "cozy";
		} else if (document.body.classList.contains("sapUiSizeCompact")) {
			return "compact";
		} else {
			return "";
		}
	}

	getPrimaryIntent(/*sSemanticObject: string, mParameters?: object*/): Promise<any> {
		return Promise.resolve();
	}

	waitForPluginsLoad() {
		return Promise.resolve(true);
	}

	getTitle(): string {
		return "";
	}
}

/**
 * @typedef ShellServicesSettings
 */
export type ShellServicesSettings = {
	shellContainer?: Container;
};

/**
 * Wrap a JQuery Promise within a native {Promise}.
 *
 * @template {object} T
 * @param jqueryPromise The original jquery promise
 * @returns A native promise wrapping the same object
 */
function wrapJQueryPromise<T>(jqueryPromise: jQuery.Promise): Promise<T> {
	return new Promise((resolve, reject) => {
		// eslint-disable-next-line promise/catch-or-return
		jqueryPromise.done(resolve as any).fail(reject);
	});
}
type ShellPluginManager = {
	getPluginLoadingPromise(category: string): jQuery.Promise;
};

/**
 * Base implementation of the ShellServices
 *
 */
class ShellServices extends Service<Required<ShellServicesSettings>> implements IShellServices {
	resolveFn: any;

	rejectFn: any;

	initPromise!: Promise<any>;

	// !: means that we know it will be assigned before usage
	crossAppNavService!: CrossApplicationNavigation;

	urlParsingService!: URLParsing;

	shellNavigation!: ShellNavigation;

	shellPluginManager!: ShellPluginManager;

	oShellContainer!: Container;

	shellUIService!: any;

	instanceType!: string;

	linksCache!: any;

	fnFindSemanticObjectsInCache: any;

	init() {
		const oContext = this.getContext();
		const oComponent = oContext.scopeObject as any;
		this.oShellContainer = oContext.settings.shellContainer;
		this.instanceType = "real";
		this.linksCache = {};
		this.fnFindSemanticObjectsInCache = function (oArgs: any): object {
			const _oArgs: any = oArgs;
			const aCachedSemanticObjects = [];
			const aNonCachedSemanticObjects = [];
			for (let i = 0; i < _oArgs.length; i++) {
				if (!!_oArgs[i][0] && !!_oArgs[i][0].semanticObject) {
					if (this.linksCache[_oArgs[i][0].semanticObject]) {
						aCachedSemanticObjects.push(this.linksCache[_oArgs[i][0].semanticObject].links);
						Object.defineProperty(oArgs[i][0], "links", {
							value: this.linksCache[_oArgs[i][0].semanticObject].links
						});
					} else {
						aNonCachedSemanticObjects.push(_oArgs[i]);
					}
				}
			}
			return { oldArgs: oArgs, newArgs: aNonCachedSemanticObjects, cachedLinks: aCachedSemanticObjects };
		};
		this.initPromise = new Promise((resolve, reject) => {
			this.resolveFn = resolve;
			this.rejectFn = reject;
		});
		const oCrossAppNavServicePromise = this.oShellContainer.getServiceAsync("CrossApplicationNavigation");
		const oUrlParsingServicePromise = this.oShellContainer.getServiceAsync("URLParsing");
		const oShellNavigationServicePromise = this.oShellContainer.getServiceAsync("ShellNavigation");
		const oShellPluginManagerPromise = this.oShellContainer.getServiceAsync("PluginManager");
		const oShellUIServicePromise = oComponent.getService("ShellUIService");
		Promise.all([
			oCrossAppNavServicePromise,
			oUrlParsingServicePromise,
			oShellNavigationServicePromise,
			oShellUIServicePromise,
			oShellPluginManagerPromise
		])
			.then(([oCrossAppNavService, oUrlParsingService, oShellNavigation, oShellUIService, oShellPluginManager]) => {
				this.crossAppNavService = oCrossAppNavService as CrossApplicationNavigation;
				this.urlParsingService = oUrlParsingService as URLParsing;
				this.shellNavigation = oShellNavigation as ShellNavigation;
				this.shellUIService = oShellUIService;
				this.shellPluginManager = oShellPluginManager as ShellPluginManager;
				this.resolveFn();
			})
			.catch(this.rejectFn);
	}

	/**
	 * Retrieves the target links configured for a given semantic object & action
	 * Will retrieve the CrossApplicationNavigation
	 * service reference call the getLinks method. In case service is not available or any exception
	 * method throws exception error in console.
	 *
	 * @param oArgs Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
	 * @returns Promise which will be resolved to target links array
	 */
	async getLinks(oArgs: GetLinkInput | GetLinkInput[]): Promise<unknown> {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line promise/catch-or-return
			this.crossAppNavService
				.getLinks(oArgs)
				.fail((oError: any) => {
					reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getLinks`));
				})
				.then(resolve);
		});
	}

	/**
	 * Retrieves the target links configured for a given semantic object & action in cache
	 * Will retrieve the CrossApplicationNavigation
	 * service reference call the getLinks method. In case service is not available or any exception
	 * method throws exception error in console.
	 *
	 * @param oArgs Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getLinks arguments
	 * @returns Promise which will be resolved to target links array
	 */
	getLinksWithCache(oArgs: object): Promise<any[]> {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line promise/catch-or-return
			if ((oArgs as Object[]).length === 0) {
				resolve([]);
			} else {
				const oCacheResults = this.fnFindSemanticObjectsInCache(oArgs);

				if (oCacheResults.newArgs.length === 0) {
					resolve(oCacheResults.cachedLinks);
				} else {
					// eslint-disable-next-line promise/catch-or-return
					this.crossAppNavService
						.getLinks(oCacheResults.newArgs)
						.fail((oError: any) => {
							reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getLinksWithCache`));
						})
						.then((aLinks: any) => {
							if (aLinks.length !== 0) {
								const oSemanticObjectsLinks: any = {};

								for (let i = 0; i < aLinks.length; i++) {
									if (aLinks[i].length > 0 && oCacheResults.newArgs[i][0].links === undefined) {
										oSemanticObjectsLinks[oCacheResults.newArgs[i][0].semanticObject] = {
											links: aLinks[i]
										};
										this.linksCache = Object.assign(this.linksCache, oSemanticObjectsLinks);
									}
								}
							}

							if (oCacheResults.cachedLinks.length === 0) {
								resolve(aLinks);
							} else {
								const aMergedLinks = [];
								let j = 0;

								for (let k = 0; k < oCacheResults.oldArgs.length; k++) {
									if (j < aLinks.length) {
										if (
											aLinks[j].length > 0 &&
											oCacheResults.oldArgs[k][0].semanticObject === oCacheResults.newArgs[j][0].semanticObject
										) {
											aMergedLinks.push(aLinks[j]);
											j++;
										} else {
											aMergedLinks.push(oCacheResults.oldArgs[k][0].links);
										}
									} else {
										aMergedLinks.push(oCacheResults.oldArgs[k][0].links);
									}
								}
								resolve(aMergedLinks);
							}
						});
				}
			}
		});
	}

	/**
	 * Will retrieve the ShellContainer.
	 *
	 * @returns Object with predefined shellContainer methods
	 */
	getShellContainer() {
		return this.oShellContainer;
	}

	/**
	 * Will call toExternal method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
	 *
	 * @param oNavArgumentsArr And
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>toExternal arguments
	 */
	toExternal(oNavArgumentsArr: Array<object>, oComponent: object): void {
		this.crossAppNavService.toExternal(oNavArgumentsArr, oComponent);
	}

	/**
	 * Retrieves the target startupAppState
	 * Will check the existance of the ShellContainer and retrieve the CrossApplicationNavigation
	 * service reference call the getStartupAppState method. In case service is not available or any exception
	 * method throws exception error in console.
	 *
	 * @param oArgs Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getStartupAppState arguments
	 * @returns Promise which will be resolved to Object
	 */
	getStartupAppState(oArgs: Component): Promise<undefined | StartupAppState> {
		return new Promise((resolve, reject) => {
			// JQuery Promise behaves differently
			// eslint-disable-next-line promise/catch-or-return
			(this.crossAppNavService as any)
				.getStartupAppState(oArgs)
				.fail((oError: any) => {
					reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getStartupAppState`));
				})
				.then((startupAppState: undefined | StartupAppState) => resolve(startupAppState));
		});
	}

	/**
	 * Will call backToPreviousApp method of CrossApplicationNavigation service.
	 *
	 * @returns Something that indicate we've navigated
	 */
	backToPreviousApp() {
		return this.crossAppNavService.backToPreviousApp();
	}

	/**
	 * Will call hrefForExternal method of CrossApplicationNavigation service.
	 *
	 * @param oArgs Check the definition of
	 * @param oComponent The appComponent
	 * @param bAsync Whether this call should be async or not
	 * sap.ushell.services.CrossApplicationNavigation=>hrefForExternal arguments
	 * @returns Promise which will be resolved to string
	 */
	hrefForExternal(oArgs: object, oComponent?: object, bAsync?: boolean) {
		return this.crossAppNavService.hrefForExternal(oArgs, oComponent as object, !!bAsync);
	}

	/**
	 * Will call hrefForExternal method of CrossApplicationNavigation service.
	 *
	 * @param oArgs Check the definition of
	 * @param oComponent The appComponent
	 * sap.ushell.services.CrossApplicationNavigation=>hrefForExternalAsync arguments
	 * @returns Promise which will be resolved to string
	 */
	hrefForExternalAsync(oArgs: object, oComponent?: object) {
		return this.crossAppNavService.hrefForExternalAsync(oArgs, oComponent as object);
	}

	/**
	 * Will call getAppState method of CrossApplicationNavigation service with oComponent and oAppStateKey.
	 *
	 * @param oComponent
	 * @param sAppStateKey Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>getAppState arguments
	 * @returns Promise which will be resolved to object
	 */
	getAppState(oComponent: Component, sAppStateKey: string) {
		return wrapJQueryPromise((this.crossAppNavService as any).getAppState(oComponent, sAppStateKey));
	}

	/**
	 * Will call createEmptyAppState method of CrossApplicationNavigation service with oComponent.
	 *
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppState arguments
	 * @returns Promise which will be resolved to object
	 */
	createEmptyAppState(oComponent: Component) {
		return (this.crossAppNavService as any).createEmptyAppState(oComponent);
	}

	/**
	 * Will call createEmptyAppStateAsync method of CrossApplicationNavigation service with oComponent.
	 *
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>createEmptyAppStateAsync arguments
	 * @returns Promise which will be resolved to object
	 */
	createEmptyAppStateAsync(oComponent: Component) {
		return (this.crossAppNavService as any).createEmptyAppStateAsync(oComponent);
	}

	/**
	 * Will call isNavigationSupported method of CrossApplicationNavigation service with Navigation Arguments and oComponent.
	 *
	 * @param oNavArgumentsArr
	 * @param oComponent Check the definition of
	 * sap.ushell.services.CrossApplicationNavigation=>isNavigationSupported arguments
	 * @returns Promise which will be resolved to object
	 */
	isNavigationSupported(oNavArgumentsArr: Array<object>, oComponent: object) {
		return wrapJQueryPromise(this.crossAppNavService.isNavigationSupported(oNavArgumentsArr, oComponent));
	}

	/**
	 * Will call isInitialNavigation method of CrossApplicationNavigation service.
	 *
	 * @returns Promise which will be resolved to boolean
	 */
	isInitialNavigation() {
		return this.crossAppNavService.isInitialNavigation();
	}

	/**
	 * Will call isInitialNavigationAsync method of CrossApplicationNavigation service.
	 *
	 * @returns Promise which will be resolved to boolean
	 */
	isInitialNavigationAsync() {
		return this.crossAppNavService.isInitialNavigationAsync();
	}

	/**
	 * Will call expandCompactHash method of CrossApplicationNavigation service.
	 *
	 * @param sHashFragment An (internal format) shell hash
	 * @returns A promise the success handler of the resolve promise get an expanded shell hash as first argument
	 */
	expandCompactHash(sHashFragment: string) {
		return this.crossAppNavService.expandCompactHash(sHashFragment);
	}

	getHash() {
		return `#${this.urlParsingService.getShellHash(window.location.href)}`;
	}

	/**
	 * Will call parseShellHash method of URLParsing service with given sHash.
	 *
	 * @param sHash Check the definition of
	 * sap.ushell.services.URLParsing=>parseShellHash arguments
	 * @returns The parsed url
	 */
	parseShellHash(sHash: string): ParsedHash {
		return this.urlParsingService.parseShellHash(sHash);
	}

	/**
	 * Will call splitHash method of URLParsing service with given sHash.
	 *
	 * @param sHash Check the definition of
	 * sap.ushell.services.URLParsing=>splitHash arguments
	 * @returns Promise which will be resolved to object
	 */
	splitHash(sHash: string) {
		return this.urlParsingService.splitHash(sHash);
	}

	/**
	 * Will call constructShellHash method of URLParsing service with given sHash.
	 *
	 * @param oNewShellHash Check the definition of
	 * sap.ushell.services.URLParsing=>constructShellHash arguments
	 * @returns Shell Hash string
	 */
	constructShellHash(oNewShellHash: object) {
		return this.urlParsingService.constructShellHash(oNewShellHash);
	}

	/**
	 * Will call setDirtyFlag method with given dirty state.
	 *
	 * @param bDirty Check the definition of sap.ushell.Container.setDirtyFlag arguments
	 */
	setDirtyFlag(bDirty: boolean) {
		this.oShellContainer.setDirtyFlag(bDirty);
	}

	/**
	 * Will call registerDirtyStateProvider method with given dirty state provider callback method.
	 *
	 * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.registerDirtyStateProvider arguments
	 */
	registerDirtyStateProvider(fnDirtyStateProvider: Function) {
		this.oShellContainer.registerDirtyStateProvider(fnDirtyStateProvider);
	}

	/**
	 * Will call deregisterDirtyStateProvider method with given dirty state provider callback method.
	 *
	 * @param fnDirtyStateProvider Check the definition of sap.ushell.Container.deregisterDirtyStateProvider arguments
	 */
	deregisterDirtyStateProvider(fnDirtyStateProvider: Function) {
		this.oShellContainer.deregisterDirtyStateProvider(fnDirtyStateProvider);
	}

	/**
	 * Will call createRenderer method of ushell container.
	 *
	 * @returns Returns renderer object
	 */
	createRenderer() {
		return this.oShellContainer.createRenderer();
	}

	/**
	 * Will call getUser method of ushell container.
	 *
	 * @returns Returns User object
	 */
	getUser() {
		return (this.oShellContainer as any).getUser();
	}

	/**
	 * Will check if ushell container is available or not.
	 *
	 * @returns Returns true
	 */
	hasUShell() {
		return true;
	}

	/**
	 * Will call registerNavigationFilter method of shellNavigation.
	 *
	 * @param fnNavFilter The filter function to register
	 */
	registerNavigationFilter(fnNavFilter: Function) {
		(this.shellNavigation as any).registerNavigationFilter(fnNavFilter);
	}

	/**
	 * Will call unregisterNavigationFilter method of shellNavigation.
	 *
	 * @param fnNavFilter The filter function to unregister
	 */
	unregisterNavigationFilter(fnNavFilter: Function) {
		(this.shellNavigation as any).unregisterNavigationFilter(fnNavFilter);
	}

	/**
	 * Will call setBackNavigation method of ShellUIService
	 * that displays the back button in the shell header.
	 *
	 * @param [fnCallBack] A callback function called when the button is clicked in the UI.
	 */
	setBackNavigation(fnCallBack?: Function): void {
		this.shellUIService.setBackNavigation(fnCallBack);
	}

	/**
	 * Will call setHierarchy method of ShellUIService
	 * that displays the given hierarchy in the shell header.
	 *
	 * @param [aHierarchyLevels] An array representing hierarchies of the currently displayed app.
	 */
	setHierarchy(aHierarchyLevels: Array<object>): void {
		this.shellUIService.setHierarchy(aHierarchyLevels);
	}

	/**
	 * Will call setTitle method of ShellUIService
	 * that displays the given title in the shell header.
	 *
	 * @param [sTitle] The new title. The default title is set if this argument is not given.
	 */
	setTitle(sTitle: string): void {
		this.shellUIService.setTitle(sTitle);
	}

	/**
	 * Will call getTitle method of ShellUIService
	 * that displays the given title in the shell header.
	 *
	 * @returns The title of the application.
	 */
	getTitle(): string {
		return this.shellUIService.getTitle();
	}

	/**
	 * Retrieves the currently defined content density.
	 *
	 * @returns The content density value
	 */
	getContentDensity(): string {
		return (this.oShellContainer as any).getUser().getContentDensity();
	}

	/**
	 * For a given semantic object, this method considers all actions associated with the semantic object and
	 * returns the one tagged as a "primaryAction". If no inbound tagged as "primaryAction" exists, then it returns
	 * the intent of the first inbound (after sorting has been applied) matching the action "displayFactSheet".
	 *
	 * @param sSemanticObject Semantic object.
	 * @param mParameters See #CrossApplicationNavigation#getLinks for description.
	 * @returns Promise which will be resolved with an object containing the intent if it exists.
	 */
	getPrimaryIntent(sSemanticObject: string, mParameters?: object): Promise<any> {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line promise/catch-or-return
			this.crossAppNavService
				.getPrimaryIntent(sSemanticObject, mParameters)
				.fail((oError: any) => {
					reject(new Error(`${oError} sap.fe.core.services.ShellServicesFactory.getPrimaryIntent`));
				})
				.then(resolve);
		});
	}

	/**
	 * Wait for the render extensions plugin to be loaded.
	 *
	 * @returns True if we are able to wait for it, otherwise we couldn't and cannot rely on it.
	 */
	waitForPluginsLoad(): Promise<boolean> {
		return new Promise((resolve) => {
			if (!this.shellPluginManager?.getPluginLoadingPromise) {
				resolve(false);
			} else {
				// eslint-disable-next-line promise/catch-or-return
				this.shellPluginManager
					.getPluginLoadingPromise("RendererExtensions")
					.fail((oError: unknown) => {
						Log.error(oError as string, "sap.fe.core.services.ShellServicesFactory.waitForPluginsLoad");
						resolve(false);
					})
					.then(() => resolve(true));
			}
		});
	}
}

/**
 * Service Factory for the ShellServices
 *
 */
class ShellServicesFactory extends ServiceFactory<ShellServicesSettings> {
	/**
	 * Creates either a standard or a mock Shell service depending on the configuration.
	 *
	 * @param oServiceContext The shellservice context
	 * @returns A promise for a shell service implementation
	 * @see ServiceFactory#createInstance
	 */
	createInstance(oServiceContext: ServiceContext<ShellServicesSettings>): Promise<IShellServices> {
		oServiceContext.settings.shellContainer = sap.ushell && (sap.ushell.Container as Container);
		const oShellService = oServiceContext.settings.shellContainer
			? new ShellServices(oServiceContext as ServiceContext<Required<ShellServicesSettings>>)
			: new ShellServiceMock(oServiceContext);
		return oShellService.initPromise.then(() => {
			// Enrich the appComponent with this method
			oServiceContext.scopeObject.getShellServices = () => oShellService;
			return oShellService;
		});
	}
}

export default ShellServicesFactory;
