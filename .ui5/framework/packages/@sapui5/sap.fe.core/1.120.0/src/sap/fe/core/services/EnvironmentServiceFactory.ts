import CollaborationHelper from "sap/suite/ui/commons/collaboration/CollaborationHelper";
import VersionInfo from "sap/ui/VersionInfo";
import Core from "sap/ui/core/Core";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
import type { EnvironmentCapabilities } from "../converters/MetaModelConverter";
import { DefaultEnvironmentCapabilities } from "../converters/MetaModelConverter";

export class EnvironmentCapabilitiesService extends Service<EnvironmentCapabilities> {
	resolveFn: any;

	rejectFn: any;

	initPromise!: Promise<any>;

	environmentCapabilities!: EnvironmentCapabilities;
	// !: means that we know it will be assigned before usage

	init() {
		this.initPromise = new Promise((resolve, reject) => {
			this.resolveFn = resolve;
			this.rejectFn = reject;
		});
		const oContext = this.getContext();
		this.environmentCapabilities = Object.assign({}, DefaultEnvironmentCapabilities);
		VersionInfo.load()
			.then(async (versionInfo): Promise<null> => {
				this.environmentCapabilities.Chart = !!versionInfo.libraries.find((lib): boolean => lib.name === "sap.viz");
				this.environmentCapabilities.MicroChart = !!versionInfo.libraries.find(
					(lib): boolean => lib.name === "sap.suite.ui.microchart"
				);
				this.environmentCapabilities.UShell = !!(sap && sap.ushell && sap.ushell.Container);
				this.environmentCapabilities.IntentBasedNavigation = !!(sap && sap.ushell && sap.ushell.Container);
				this.environmentCapabilities.InsightsSupported =
					!!versionInfo.libraries.find((lib): boolean => lib.name === "sap.insights") && (await getInsightsEnabled());
				this.environmentCapabilities = Object.assign(this.environmentCapabilities, oContext.settings);
				this.resolveFn(this);
				return null;
			})
			.catch(this.rejectFn);
	}

	static async resolveLibrary(libraryName: string): Promise<boolean> {
		return new Promise(function (resolve) {
			try {
				Core.loadLibrary(`${libraryName.replace(/\./g, "/")}`, { async: true })
					.then(function () {
						resolve(true);
					})
					.catch(function () {
						resolve(false);
					});
			} catch (e) {
				resolve(false);
			}
		});
	}

	public setCapabilities(oCapabilities: EnvironmentCapabilities) {
		this.environmentCapabilities = oCapabilities;
	}

	public setCapability(capability: keyof EnvironmentCapabilities, value: boolean) {
		this.environmentCapabilities[capability] = value;
	}

	public getCapabilities() {
		return this.environmentCapabilities;
	}

	getInterface(): any {
		return this;
	}
}

export class EnvironmentServiceFactory extends ServiceFactory<EnvironmentCapabilities> {
	createInstance(oServiceContext: ServiceContext<EnvironmentCapabilities>) {
		const environmentCapabilitiesService = new EnvironmentCapabilitiesService(oServiceContext);
		return environmentCapabilitiesService.initPromise;
	}
}

/**
 * Checks if insights are enabled on the home page.
 *
 * @returns True if insights are enabled on the home page.
 */
export async function getInsightsEnabled(): Promise<boolean> {
	// insights is enabled
	return new Promise<boolean>(async (resolve) => {
		try {
			// getServiceAsync from suite/insights checks to see if myHome is configured with insights and returns a cardHelperInstance if so.
			const isLibAvailable = await EnvironmentCapabilitiesService.resolveLibrary("sap.insights");
			if (isLibAvailable) {
				sap.ui.require(["sap/insights/CardHelper"], async (CardHelper: { getServiceAsync: Function }) => {
					try {
						await CardHelper.getServiceAsync("UIService");
						resolve(!(await getMSTeamsActive()));
					} catch {
						resolve(false);
					}
				});
			} else {
				resolve(false);
			}
		} catch {
			resolve(false);
		}
	});
}

/**
 * Checks if the application is opened on Microsoft Teams.
 *
 * @returns True if the application is opened on Microsoft Teams.
 */
export async function getMSTeamsActive(): Promise<boolean> {
	let isTeamsModeActive = false;
	try {
		isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
	} catch {
		return false;
	}
	return isTeamsModeActive;
}
