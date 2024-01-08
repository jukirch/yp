import Log from "sap/base/Log";
import deepEqual from "sap/base/util/deepEqual";
import type AppComponent from "sap/fe/core/AppComponent";
import type { NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import { defineUI5Class } from "sap/fe/core/helpers/ClassSupport";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import toES6Promise from "sap/fe/core/helpers/ToES6Promise";
import type { SelectionVariant } from "sap/fe/navigation/SelectionVariant";
import library from "sap/fe/navigation/library";
import BaseObject from "sap/ui/base/Object";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import BusyLocker from "./controllerextensions/BusyLocker";
import ModelHelper from "./helpers/ModelHelper";

const NavType = library.NavType;
type AppState = {
	skipMerge?: boolean;
	[key: string]: unknown;
};
export type AppData = {
	oDefaultedSelectionVariant: SelectionVariant;
	oSelectionVariant: SelectionVariant;
	bNavSelVarHasDefaultsOnly: boolean;
	appState: AppState;
	iAppState?: {
		appState: AppState;
	};
};
const SKIP_MERGE_KEY = "skipMerge";
export type IAppState = {
	appState: Record<string, unknown>;
};

export type AppDataInfo = {
	appStateData: { appState: object | undefined };
	appStateKey: string | null;
};

@defineUI5Class("sap.fe.core.AppStateHandler")
class AppStateHandler extends BaseObject {
	public sId: string;

	public oAppComponent: AppComponent;

	public bNoRouteChange: boolean;

	private _mCurrentAppState?: AppState = {};

	nbSimultaneousCreateRequest: number;

	constructor(oAppComponent: AppComponent) {
		super();
		this.oAppComponent = oAppComponent;
		this.sId = `${oAppComponent.getId()}/AppStateHandler`;
		this.nbSimultaneousCreateRequest = 0;
		this.bNoRouteChange = false;
		Log.info("APPSTATE : Appstate handler initialized");
	}

	getId() {
		return this.sId;
	}

	/**
	 * Creates or updates the appstate.
	 * Replaces the hash with the new appstate based on replaceHash
	 *
	 * @param createAppParameters Parameters for creating new appstate
	 * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
	 * @param createAppParameters.skipMerge Boolean which determines to skip the key user shine through
	 * @returns A promise resolving the stored data or appstate key based on returnKey property
	 */
	async createAppState(createAppParameters?: { replaceHash?: boolean; skipMerge?: boolean }): Promise<void | AppDataInfo> {
		if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
			return;
		}
		const { replaceHash = true, skipMerge = false } = createAppParameters || {};

		const navigationService = this.oAppComponent.getNavigationService(),
			routerProxy = this.oAppComponent.getRouterProxy(),
			hash = routerProxy.getHash(),
			controller = this.oAppComponent.getRootControl().getController(),
			isStickyMode = ModelHelper.isStickySessionSupported(this.oAppComponent.getMetaModel());

		if (!controller.viewState) {
			throw new Error(`viewState controller extension not available for controller: ${controller.getMetadata().getName()}`);
		}
		let innerAppState = await controller.viewState.retrieveViewState();
		if (skipMerge) {
			innerAppState = { ...innerAppState, ...{ skipMerge } };
		}
		const appStateData = { appState: innerAppState };
		let appStateKey: string | null = null;
		if (innerAppState && !deepEqual(this._mCurrentAppState, innerAppState)) {
			this._mCurrentAppState = innerAppState as Record<string, unknown>;
			try {
				this.nbSimultaneousCreateRequest++;
				appStateKey = await navigationService.storeInnerAppStateAsync(appStateData, true, true);
				Log.info("APPSTATE: Appstate stored");
				if (replaceHash === true) {
					const sNewHash = navigationService.replaceInnerAppStateKey(hash, appStateKey);
					this.nbSimultaneousCreateRequest--;
					if (this.nbSimultaneousCreateRequest === 0 && sNewHash !== hash) {
						routerProxy.navToHash(sNewHash, undefined, undefined, undefined, !isStickyMode);
						this.bNoRouteChange = true;
					}
					Log.info("APPSTATE: navToHash");
				}
			} catch (oError: unknown) {
				Log.error(oError as string);
			}
		} else {
			appStateKey = routerProxy.findAppStateInHash(hash) as string;
		}
		return {
			appStateData: appStateData,
			appStateKey: appStateKey
		};
	}

	_createNavigationParameters(oAppData: AppData, sNavType: string): NavigationParameter {
		return Object.assign({}, oAppData, {
			selectionVariantDefaults: oAppData.oDefaultedSelectionVariant,
			selectionVariant: oAppData.oSelectionVariant,
			requiresStandardVariant: !oAppData.bNavSelVarHasDefaultsOnly,
			navigationType: sNavType
		});
	}

	_checkIfLastSeenRecord(view?: View) {
		//getting the internal model context in order to fetch the technicalkeys of last seen record and close column flag set in the internalrouting for retaining settings in persistence mode
		const internalModelContext = view && (view.getBindingContext("internal") as InternalModelContext);
		if (internalModelContext && internalModelContext.getProperty("fclColumnClosed") === true) {
			const technicalKeysObject = internalModelContext.getProperty("technicalKeysOfLastSeenRecord");
			const bindingContext = view?.getBindingContext() as Context;
			const path = (bindingContext && bindingContext.getPath()) || "";
			const metaModel = bindingContext?.getModel().getMetaModel();
			const metaPath = metaModel?.getMetaPath(path);
			const technicalKeys = metaModel?.getObject(`${metaPath}/$Type/$Key`);
			for (const element of technicalKeys) {
				const keyValue = bindingContext.getObject()[element];
				if (keyValue !== technicalKeysObject[element]) {
					internalModelContext.setProperty("fclColumnClosed", false);
					return true;
				}
			}
			//the record opened is not the last seen one : no need to persist the changes, reset to default instead
		}
		return false;
	}

	_getAppStateData(oAppData: AppData, viewId?: string, navType?: string) {
		let key = "",
			i = 0;
		const appStateData = navType === NavType.hybrid ? oAppData.iAppState : oAppData;

		if (appStateData?.appState) {
			for (i; i < Object.keys(appStateData.appState).length; i++) {
				if (Object.keys(appStateData.appState)[i] === viewId) {
					key = Object.keys(appStateData.appState)[i];
					break;
				}
			}
		}
		if (appStateData?.appState) {
			return {
				[Object.keys(appStateData.appState)[i]]: appStateData.appState[key] || {}
			};
		}
	}

	/**
	 * Applies an appstate by fetching appdata and passing it to _applyAppstateToPage.
	 *
	 * @param viewId
	 * @param view
	 * @returns A promise for async handling
	 */
	async applyAppState(viewId?: string, view?: View) {
		if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
			return Promise.resolve();
		}

		const checkIfLastSeenRecord = this._checkIfLastSeenRecord(view);
		if (checkIfLastSeenRecord === true) {
			return Promise.resolve();
		}

		BusyLocker.lock(this);
		// Done for busy indicator
		BusyLocker.lock(this.oAppComponent.getRootControl());
		const oNavigationService = this.oAppComponent.getNavigationService();
		// TODO oNavigationService.parseNavigation() should return ES6 promise instead jQuery.promise
		return toES6Promise(oNavigationService.parseNavigation())
			.catch(function (aErrorData: unknown[]) {
				if (!aErrorData) {
					aErrorData = [];
				}
				Log.warning("APPSTATE: Parse Navigation failed", aErrorData[0] as string);
				return [
					{
						/* app data */
					},
					aErrorData[1],
					aErrorData[2]
				];
			})
			.then((aResults: unknown[]) => {
				Log.info("APPSTATE: Parse Navigation done");

				// aResults[1] => oStartupParameters (not evaluated)
				const oAppData = (aResults[0] || {}) as AppData,
					sNavType = (aResults[2] as string) || NavType.initial,
					oRootController = this.oAppComponent.getRootControl().getController();
				// apply the appstate depending upon the view (LR/OP)
				const appStateData = this._getAppStateData(oAppData, viewId, sNavType);
				// fetch the skipMerge flag from appState for save as tile
				const skipMerge: boolean | undefined = oAppData?.appState?.[SKIP_MERGE_KEY];
				this._mCurrentAppState = sNavType === NavType.iAppState || sNavType === NavType.hybrid ? appStateData : undefined;

				if (!oRootController.viewState) {
					throw new Error(`viewState extension required for controller ${oRootController.getMetadata().getName()}`);
				}
				if ((!oAppData || Object.keys(oAppData).length === 0) && sNavType == NavType.iAppState) {
					if (!oRootController.viewState._getInitialStateApplied()) {
						oRootController.viewState._setInitialStateApplied();
					}
					return {};
				}
				return oRootController.viewState.applyViewState(
					this._mCurrentAppState as Record<string, unknown>,
					this._createNavigationParameters(oAppData, sNavType),
					skipMerge
				);
			})
			.catch(function (oError: unknown) {
				Log.error("appState could not be applied", oError as string);
				throw oError;
			})
			.finally(() => {
				BusyLocker.unlock(this);
				BusyLocker.unlock(this.oAppComponent.getRootControl());
			});
	}

	/**
	 * To check is route is changed by change in the iAPPState.
	 *
	 * @returns `true` if the route has chnaged
	 */
	checkIfRouteChangedByIApp() {
		return this.bNoRouteChange;
	}

	/**
	 * Reset the route changed by iAPPState.
	 */
	resetRouteChangedByIApp() {
		if (this.bNoRouteChange) {
			this.bNoRouteChange = false;
		}
	}
}

/**
 * @global
 */
export default AppStateHandler;
