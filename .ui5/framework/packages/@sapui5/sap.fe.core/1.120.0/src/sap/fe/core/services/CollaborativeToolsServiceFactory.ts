import type Popover from "sap/m/Popover";
import ServiceContainer from "sap/suite/ui/commons/collaboration/ServiceContainer";
import type {
	ContactOption as TeamsContactOption,
	default as TeamsHelperService
} from "sap/suite/ui/commons/collaboration/TeamsHelperService";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type { ServiceContext } from "types/metamodel_types";
type CollaborativeToolsServiceSettings = {};
type TeamsConnection = {
	isInitialized: boolean;
	isContactsCollaborationSupported?: boolean;
	helperService?: TeamsHelperService;
	contactOptions?: TeamsContactOption[];
};
export class CollaborativeToolsService extends Service<CollaborativeToolsServiceSettings> {
	initPromise!: Promise<CollaborativeToolsService>;

	teamsIntegration!: TeamsConnection;

	oFactory!: CollaborativeToolsServiceFactory;

	init(): void {
		this.teamsIntegration = {
			isInitialized: false
		};

		this.initPromise = Promise.resolve(this);
	}

	getInterface(): CollaborativeToolsService {
		return this;
	}

	private async initializeMSTeams(): Promise<void> {
		const helperService = await ServiceContainer.getServiceAsync();
		this.teamsIntegration.isInitialized = true;
		this.teamsIntegration.helperService = helperService;
		this.teamsIntegration.isContactsCollaborationSupported =
			//await helperService.isTeamsModeActive() && // this checks for url params appState=lean&sap-collaboration-teams=true
			typeof helperService.isContactsCollaborationSupported === "function" && helperService.isContactsCollaborationSupported();
	}

	public async getMailPopoverFromMsTeamsIntegration(mail: string): Promise<Popover | undefined> {
		if (!this.teamsIntegration.isInitialized) {
			await this.initializeMSTeams();
		}
		try {
			return await this.teamsIntegration.helperService?.enableMinimalContactsCollaboration(mail);
		} catch {
			return undefined;
		}
	}

	async isContactsCollaborationSupported(): Promise<boolean> {
		if (!this.teamsIntegration.isInitialized) {
			await this.initializeMSTeams();
		}
		return this.teamsIntegration.isContactsCollaborationSupported === true;
	}

	public async getTeamContactOptions(): Promise<TeamsContactOption[] | undefined> {
		if (!this.teamsIntegration.isInitialized) {
			await this.initializeMSTeams();
		}
		if (!this.teamsIntegration.isContactsCollaborationSupported) {
			return undefined;
		}
		if (!this.teamsIntegration.contactOptions) {
			try {
				this.teamsIntegration.contactOptions = await this.teamsIntegration.helperService?.getTeamsContactCollabOptions();
			} catch {
				return undefined;
			}
		}
		return this.teamsIntegration.contactOptions;
	}
}

class CollaborativeToolsServiceFactory extends ServiceFactory<CollaborativeToolsServiceSettings> {
	async createInstance(serviceContext: ServiceContext<CollaborativeToolsServiceSettings>): Promise<CollaborativeToolsService> {
		const collaborativeToolsService = new CollaborativeToolsService(serviceContext);
		return collaborativeToolsService.initPromise;
	}
}

export default CollaborativeToolsServiceFactory;
