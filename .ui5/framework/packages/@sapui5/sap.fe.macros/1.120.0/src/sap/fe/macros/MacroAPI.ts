import merge from "sap/base/util/merge";
import uid from "sap/base/util/uid";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import { aggregation, defineUI5Class, implementInterface, property } from "sap/fe/core/helpers/ClassSupport";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type RenderManager from "sap/ui/core/RenderManager";
import UIArea from "sap/ui/core/UIArea";
import type { IFormContent } from "sap/ui/core/library";
import type ClientContextBinding from "sap/ui/model/ClientContextBinding";

const MacroAPIFQN = "sap.fe.macros.MacroAPI";

/**
 * Base API control for building blocks.
 *
 * @hideconstructor
 * @name sap.fe.macros.MacroAPI
 * @public
 */
@defineUI5Class("sap.fe.macros.MacroAPI")
class MacroAPI extends Control implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	static namespace = "sap.fe.macros";

	static macroName = "Macro";

	static fragment = "sap.fe.macros.Macro";

	static hasValidation = true;

	static instanceMap: WeakMap<object, object[]> = new WeakMap<object, object[]>();

	protected static isDependentBound = false;

	constructor(mSettings?: PropertiesOf<MacroAPI>, ...others: any[]) {
		super(mSettings as any, ...others);
		MacroAPI.registerInstance(this);
	}

	init() {
		super.init();
		if (!this.getModel("_pageModel")) {
			const oPageModel = Component.getOwnerComponentFor(this)?.getModel("_pageModel");
			if (oPageModel) {
				this.setModel(oPageModel, "_pageModel");
			}
		}
	}

	static registerInstance(_instance: any) {
		if (!this.instanceMap.get(_instance.constructor)) {
			this.instanceMap.set(_instance.constructor, []);
		}
		(this.instanceMap.get(_instance.constructor) as object[]).push(_instance);
	}

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 *
	 * @public
	 */
	@property({ type: "string" })
	contextPath!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 *
	 * @public
	 */
	@property({ type: "string" })
	metaPath!: string;

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	content!: Control;

	static render(oRm: RenderManager, oControl: MacroAPI) {
		oRm.renderControl(oControl.content);
	}

	rerender() {
		(UIArea as unknown as { rerenderControl(control: Control): void }).rerenderControl(this.content);
	}

	getDomRef() {
		const oContent = this.content;
		return oContent ? oContent.getDomRef() : super.getDomRef();
	}

	getController(): any {
		return (this.getModel("$view") as any).getObject().getController();
	}

	static getAPI(oEvent: UI5Event, apiFQN: string = MacroAPIFQN): MacroAPI | undefined {
		let oSource = oEvent.getSource() as ManagedObject | null;
		while (oSource && !oSource.isA<MacroAPI>(apiFQN) && oSource.getParent) {
			if (this.isDependentBound) {
				const oDependents = (oSource as Control).getDependents();
				const hasCorrectDependent = oDependents.find((oDependent: UI5Element) => oDependent.isA(apiFQN));
				if (hasCorrectDependent) {
					oSource = hasCorrectDependent as MacroAPI;
				} else {
					oSource = oSource.getParent() as MacroAPI;
				}
			} else {
				oSource = oSource.getParent();
			}
		}

		if (!oSource || !oSource.isA<MacroAPI>(apiFQN)) {
			const oSourceMap = this.instanceMap.get(this) as MacroAPI[];
			oSource = oSourceMap?.[oSourceMap.length - 1];
		}
		let targetControl;
		if (oSource && oSource.isA<MacroAPI>(apiFQN)) {
			targetControl = oSource;
		}
		return targetControl;
	}

	/**
	 * Retrieve a Converter Context.
	 *
	 * @param oDataModelPath
	 * @param contextPath
	 * @param mSettings
	 * @returns A Converter Context
	 */
	static getConverterContext = function (oDataModelPath: DataModelObjectPath, contextPath: string, mSettings: any) {
		const oAppComponent = mSettings.appComponent;
		const viewData = mSettings.models.viewData && mSettings.models.viewData.getData();
		return ConverterContext.createConverterContextForMacro(
			oDataModelPath.startingEntitySet.name,
			mSettings.models.metaModel,
			oAppComponent && oAppComponent.getDiagnostics(),
			merge,
			oDataModelPath.contextLocation,
			viewData
		);
	};

	/**
	 * Create a Binding Context.
	 *
	 * @param oData
	 * @param mSettings
	 * @returns The binding context
	 */
	static createBindingContext = function (oData: object, mSettings: any) {
		const sContextPath = `/uid--${uid()}`;
		mSettings.models.converterContext.setProperty(sContextPath, oData);
		return mSettings.models.converterContext.createBindingContext(sContextPath);
	};

	parentContextToBind: Record<string, string> = {};

	/**
	 * Keep track of a binding context that should be assigned to the parent of that control.
	 *
	 * @param modelName The model name that the context will relate to
	 * @param path The path of the binding context
	 */
	setParentBindingContext(modelName: string, path: string) {
		this.parentContextToBind[modelName] = path;
	}

	setParent(...args: any[]) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		super.setParent(...args);
		Object.keys(this.parentContextToBind).forEach((modelName) => {
			this.getParent()!.bindObject({
				path: this.parentContextToBind[modelName],
				model: modelName,
				events: {
					change: function (this: ClientContextBinding) {
						const oBoundContext = this.getBoundContext() as InternalModelContext;
						if (oBoundContext && !oBoundContext.getObject()) {
							oBoundContext.setProperty("", {});
						}
					}
				}
			});
		});
	}
}

export default MacroAPI;
