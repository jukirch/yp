import Log from "sap/base/Log";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type EditFlow from "sap/fe/core/controllerextensions/EditFlow";
import type IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import type InternalRouting from "sap/fe/core/controllerextensions/InternalRouting";
import type Routing from "sap/fe/core/controllerextensions/Routing";
import type MacroAPI from "sap/fe/macros/MacroAPI";
import type FormAPI from "sap/fe/macros/form/FormAPI";
import BaseObject from "sap/ui/base/Object";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type Context from "sap/ui/model/Context";
import type Model from "sap/ui/model/Model";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { EnhanceWithUI5 } from "./helpers/ClassSupport";
import { defineUI5Class, property } from "./helpers/ClassSupport";

/**
 * Common Extension API for all pages of SAP Fiori elements for OData V4.
 *
 * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
 *
 * @public
 * @hideconstructor
 * @since 1.79.0
 */
@defineUI5Class("sap.fe.core.ExtensionAPI")
class ExtensionAPI extends BaseObject {
	/**
	 * A controller extension offering hooks into the edit flow of the application.
	 *
	 * @public
	 */
	@property({ type: "sap.fe.core.controllerextensions.EditFlow" })
	editFlow: EditFlow;

	/**
	 * A controller extension offering hooks into the routing flow of the application.
	 *
	 * @public
	 */
	@property({ type: "sap.fe.core.controllerextensions.Routing" })
	routing: Routing;

	/**
	 * ExtensionAPI for intent-based navigation
	 *
	 * @public
	 */
	@property({ type: "sap.fe.core.controllerextensions.IntentBasedNavigation" })
	intentBasedNavigation: IntentBasedNavigation;

	protected _controller: PageController;

	protected _view: FEView;

	private _routing: InternalRouting;

	private _prefix?: string;

	private extension: Record<string, unknown>;

	constructor(oController: PageController, sId?: string) {
		super();
		this._controller = oController;
		this._view = oController.getView();
		this.extension = this._controller.extension;
		this.editFlow = this._controller.editFlow;
		this.routing = this._controller.routing;
		this._routing = this._controller._routing;
		this.intentBasedNavigation = this._controller.intentBasedNavigation;
		this._prefix = sId;
	}

	/**
	 * Retrieves the editFlow controller extension for this page.
	 *
	 * @public
	 * @returns The editFlow controller extension
	 */
	getEditFlow(): EditFlow {
		return this.editFlow;
	}

	/**
	 * Retrieves the routing controller extension for this page.
	 *
	 * @public
	 * @returns The routing controller extension
	 */
	getRouting(): Routing {
		return this.routing;
	}

	/**
	 * Retrieves the intentBasedNavigation controller extension for this page.
	 *
	 * @public
	 * @returns The intentBasedNavigation controller extension
	 */
	getIntentBasedNavigation(): IntentBasedNavigation {
		return this.intentBasedNavigation;
	}

	/**
	 * Access a control by its ID. If you attempt to access an internal control instead of the stable API, the method will raise an error.
	 *
	 * @param id ID of the control without view and section prefix.
	 * @returns The requested control, if found in the view / section.
	 * @public
	 */
	byId(id: string): UI5Element | undefined {
		let control = this._view.byId(id);

		if (!control && this._prefix) {
			// give it a try with the prefix
			control = this._view.byId(`${this._prefix}--${id}`);
		}

		if (!control) {
			return undefined;
		}

		if (!control.isA<MacroAPI>("sap.fe.macros.MacroAPI")) {
			// check if app tried to access an internal control wrapped by a macro API
			let parent = control.getParent();

			while (parent) {
				if (parent.isA<FormAPI>("sap.fe.macros.form.FormAPI")) {
					// we reached the formAPI but no fieldAPI - the app tries to access any custom control which is fine
					break;
				}

				if (parent.isA<MacroAPI>("sap.fe.macros.MacroAPI")) {
					throw new Error(
						`You attempted to access an internal control. This is risky and might change later. Instead access its stable API by using ID ${parent.getId()}`
					);
				}

				parent = parent.getParent();
			}
		}

		return control;
	}

	/**
	 * Get access to models managed by SAP Fiori elements.<br>
	 * The following models can be accessed:
	 * <ul>
	 * <li>undefined: the undefined model returns the SAPUI5 OData V4 model bound to this page</li>
	 * <li>i18n / further data models defined in the manifest</li>
	 * <li>ui: returns a SAPUI5 JSON model containing UI information.
	 * Only the following properties are public and supported:
	 * 	<ul>
	 *     <li>isEditable: set to true if the application is in edit mode</li>
	 *  </ul>
	 * </li>
	 * </ul>.
	 * editMode is deprecated and should not be used anymore. Use isEditable instead.
	 *
	 * @param sModelName Name of the model
	 * @returns The required model
	 * @public
	 */
	getModel(sModelName?: string): Model | undefined {
		let oAppComponent;

		if (sModelName && sModelName !== "ui") {
			oAppComponent = CommonUtils.getAppComponent(this._view);
			if (!oAppComponent.getManifestEntry("sap.ui5").models[sModelName]) {
				// don't allow access to our internal models
				return undefined;
			}
		}

		return this._view.getModel(sModelName);
	}

	/**
	 * Add any control as a dependent control to this SAP Fiori elements page.
	 *
	 * @param oControl Control to be added as a dependent control
	 * @public
	 */
	addDependent(oControl: Control) {
		this._view.addDependent(oControl);
	}

	/**
	 * Remove a dependent control from this SAP Fiori elements page.
	 *
	 * @param oControl Control to be added as a dependent control
	 * @public
	 */
	removeDependent(oControl: Control) {
		this._view.removeDependent(oControl);
	}

	/**
	 * Navigate to another target.
	 *
	 * @param sTarget Name of the target route
	 * @param [oContext] Context instance
	 * @public
	 */
	navigateToTarget(sTarget: string, oContext: Context): void {
		this._controller._routing.navigateToTarget(oContext, sTarget);
	}

	/**
	 * Load a fragment and go through the template preprocessor with the current page context.
	 *
	 * @param mSettings The settings object
	 * @param mSettings.id The ID of the fragment itself
	 * @param mSettings.name The name of the fragment to be loaded
	 * @param mSettings.controller The controller to be attached to the fragment
	 * @param mSettings.contextPath The contextPath to be used for the templating process
	 * @param mSettings.initialBindingContext The initial binding context
	 * @returns The fragment definition
	 * @public
	 */
	async loadFragment(mSettings: {
		id: string;
		name: string;
		controller?: object;
		contextPath?: string;
		initialBindingContext?: Context;
	}): Promise<UI5Element | UI5Element[]> {
		const oTemplateComponent = Component.getOwnerComponentFor(this._view) as EnhanceWithUI5<TemplateComponent>;
		const oPageModel = this._view.getModel("_pageModel");
		const i18nModel = this._view.getModel("sap.fe.i18n");
		const oMetaModel = this.getModel()?.getMetaModel();
		const mViewData = oTemplateComponent.getViewData();
		const targetContextPath = oTemplateComponent.getEntitySet()
			? `/${oTemplateComponent.getEntitySet()!}`
			: oTemplateComponent.getContextPath()!;
		const oViewDataModel = new JSONModel(mViewData),
			oPreprocessorSettings = {
				bindingContexts: {
					contextPath: oMetaModel?.createBindingContext(mSettings.contextPath || targetContextPath),
					converterContext: oPageModel.createBindingContext("/", undefined, { noResolve: true }),
					viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
				},
				models: {
					contextPath: oMetaModel,
					converterContext: oPageModel,
					metaModel: oMetaModel,
					viewData: oViewDataModel,
					"sap.fe.i18n": i18nModel
				},
				appComponent: CommonUtils.getAppComponent(this._view)
			};

		// We scope the fragment with our ExtensionAPI. If a controller object is passed we merge it with the extensionAPI
		let controllerInstance: ExtensionAPI;
		if (mSettings.controller && !(mSettings.controller as ExtensionAPI)?.isA?.("sap.fe.core.ExtensionAPI")) {
			const subClass = (
				this.getMetadata().getClass() as unknown as {
					extend: (id: string, content: object) => { new (pageController: PageController): ExtensionAPI };
				}
			).extend(mSettings.id + "-controller", {});
			for (const controllerElementKey in mSettings.controller) {
				const controllerElement = mSettings.controller[controllerElementKey as keyof typeof mSettings.controller];
				if ((controllerElement as Function)?.bind) {
					subClass.prototype[controllerElementKey] = (controllerElement as Function).bind(mSettings.controller);
				} else {
					Object.defineProperty(subClass.prototype, controllerElementKey, {
						get() {
							return mSettings.controller?.[controllerElementKey as keyof typeof mSettings.controller];
						},
						set(v: unknown) {
							if (mSettings.controller) {
								(mSettings.controller[controllerElementKey as keyof typeof mSettings.controller] as unknown) = v;
							}
						}
					});
				}
			}
			controllerInstance = new subClass(this._controller);
		} else {
			controllerInstance = (mSettings.controller as ExtensionAPI) ?? this;
		}

		const oTemplatePromise = CommonUtils.templateControlFragment(mSettings.name, oPreprocessorSettings, {
			controller: controllerInstance,
			isXML: false,
			id: mSettings.id
		}) as Promise<Control>;
		oTemplatePromise
			.then((oFragment: Control) => {
				if (mSettings.initialBindingContext !== undefined) {
					oFragment.setBindingContext(mSettings.initialBindingContext);
				}
				this.addDependent(oFragment);
				return oFragment;
			})
			.catch(function (oError: unknown) {
				Log.error(oError as string);
			});
		return oTemplatePromise;
	}

	/**
	 * Triggers an update of the app state.
	 * Should be called if the state of a control, or any other state-relevant information, was changed.
	 *
	 * @returns A promise that resolves with the new app state object.
	 * @public
	 */
	async updateAppState(): Promise<void | { appState: object | undefined }> {
		const appStateInfo = await this._controller.getAppComponent().getAppStateHandler().createAppState();
		return appStateInfo?.appStateData;
	}
}

export default ExtensionAPI;
