import type AppComponent from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import { hookable } from "sap/fe/core/controllerextensions/HookSupport";
import { defineUI5Class, methodOverride, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import type { CollaborationManagerService, WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type { EnvironmentCapabilitiesService } from "sap/fe/core/services/EnvironmentServiceFactory";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";

/**
 * An implementation for controller extension used internally in sap.fe for central functionalities to serve collaboration manager use cases.
 *
 * @since 1.120.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.cards.CollaborationManager")
export default class CollaborationManagerExtension extends ControllerExtension {
	private base!: PageController;

	private feView!: FEView;

	private appComponent!: AppComponent;

	constructor() {
		super();
		(this as unknown as { init: Function }).init();
	}

	@methodOverride()
	async onInit(): Promise<void> {
		this.feView = this.base.getView();
		this.appComponent = CommonUtils.getAppComponent(this.feView);

		const environmentCapabilities = (await this.appComponent.getService("environmentCapabilities")) as EnvironmentCapabilitiesService;

		// Only connect to the Collaboration Manager if it is explicitly enabled and the sap.insights library is loaded
		if (!this.appComponent["isCollaborationManagerServiceEnabled"]() || !environmentCapabilities.getCapabilities().InsightsSupported) {
			return;
		}

		await this.getService().connect(this.appComponent.getId(), async () => {
			const cardsPromises = this.collectAvailableCards([]);
			const cards = await Promise.all(cardsPromises);
			const cardObject = cards.reduce(
				(acc, cur) => {
					acc[cur.card["sap.app"].id] = cur;
					return acc;
				},
				{} as Record<string, WrappedCard>
			);

			const parentAppId = this.appComponent.getId();
			this.getService().addCardsToCollaborationManager(cardObject, parentAppId);
		});
	}

	/**
	 * Automatic unregistering on exit of the application.
	 *
	 */
	@methodOverride()
	onExit(): void {
		this.getService().unregisterProvider();
	}

	getService(): CollaborationManagerService {
		return this.appComponent.getCollaborationManagerService();
	}

	@publicExtension()
	@hookable("before")
	collectAvailableCards(cards: Promise<WrappedCard>[]): Promise<WrappedCard>[] {
		return cards;
	}
}
