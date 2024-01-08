import type { Action as EdmAction, PrimitiveType } from "@sap-ux/vocabularies-types";
import merge from "sap/base/util/merge";
import type { FEView } from "sap/fe/core/BaseController";
import type { _RequestedProperty } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import Any from "sap/fe/core/controls/Any";
import type { PathInModelExpression } from "sap/fe/core/helpers/BindingToolkit";
import { compileConstant, compileExpression, constant, equal, isConstant, transformRecursively } from "sap/fe/core/helpers/BindingToolkit";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { isEntitySet } from "sap/fe/core/helpers/TypeGuards";
import { getIsActionCriticalExpression } from "sap/fe/core/templating/ActionHelper";
import type Label from "sap/m/Label";
import type Event from "sap/ui/base/Event";
import Message from "sap/ui/core/message/Message";
import type MessageManager from "sap/ui/core/message/MessageManager";
import type View from "sap/ui/core/mvc/View";
import type Field from "sap/ui/mdc/Field";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type Table from "sap/ui/mdc/Table";
import type MultiValueFieldItem from "sap/ui/mdc/field/MultiValueFieldItem";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import AnyElement from "./controls/AnyElement";
import ConverterContext from "./converters/ConverterContext";
import type { BaseManifestSettings } from "./converters/ManifestSettings";
import { convertTypes } from "./converters/MetaModelConverter";
import { getEditButtonEnabled, getHiddenExpression } from "./converters/objectPage/HeaderAndFooterAction";

type ActionParameter = {
	$Name: string;
	$isCollection: boolean;
	// currently runtime information is written into the metamodel:
	// - in the press handler of the action button on the parameter dialog, the value of each parameter is added
	// - in setActionParameterDefaultValue, this information is used and transferred to the context (in ODataModel) created for the action execution
	// this is quite odd, and it would make much more sense to take the value from actionParameterInfos
	// - however, setActionParameterDefaultValue (or rather the surrounding _executeAction) is also called from other places
	// => for the time being, adding value here to avoid ts errors, subject to refactoring
	// in case of Field, the value is string, in case of MultiValueField, it's MultiValueFieldItem[]
	value: string | MultiValueFieldItem[];
};

export type ActionParameterInfo = {
	parameter: ActionParameter;
	field: Field | MultiValueField;
	isMultiValue: boolean;
	value?: string | MultiValueFieldItem[];
	validationPromise?: Promise<string | MultiValueFieldItem[]>;
	hasError: boolean;
};

const ActionRuntime = {
	/**
	 * Adds error messages for an action parameter field to the message manager.
	 *
	 * @param messageManager The active MessageManager instance
	 * @param messageParameters Information identifying an action parameter and messages referring to this parameter
	 */
	_addMessageForActionParameter: function (
		messageManager: MessageManager,
		messageParameters: { actionParameterInfo: ActionParameterInfo; message: string }[]
	) {
		messageManager.addMessages(
			messageParameters.map((messageParameter) => {
				const binding = messageParameter.actionParameterInfo.field.getBinding(
					messageParameter.actionParameterInfo.isMultiValue ? "items" : "value"
				);
				return new Message({
					message: messageParameter.message,
					type: "Error",
					processor: binding?.getModel(),
					persistent: true,
					target: binding?.getResolvedPath()
				});
			})
		);
	},

	/**
	 * Checks if all required action parameters contain data and checks for all action parameters if the
	 * contained data is valid.
	 *
	 *
	 * @param messageManager The active MessageManager instance
	 * @param actionParameterInfos Information identifying an action parameter
	 * @param resourceModel The model to load text resources
	 * @returns The validation result can be true or false
	 */
	validateProperties: async function (
		messageManager: MessageManager,
		actionParameterInfos: ActionParameterInfo[],
		resourceModel: ResourceModel
	): Promise<boolean> {
		await Promise.allSettled(actionParameterInfos.map((actionParameterInfo) => actionParameterInfo.validationPromise));

		const requiredParameterInfos = actionParameterInfos.filter((parameterInfo) => parameterInfo.field.getRequired());
		const allMessages = messageManager.getMessageModel().getData();
		const emptyRequiredFields = requiredParameterInfos.filter((requiredParameterInfo) => {
			const fieldId = requiredParameterInfo.field.getId();
			const relevantMessages = allMessages.filter((msg: Message) =>
				msg.getControlIds().some((controlId: string) => controlId.includes(fieldId))
			);
			if (relevantMessages.length > 0) {
				return false;
			} else if (requiredParameterInfo.isMultiValue) {
				return requiredParameterInfo.value === undefined || !requiredParameterInfo.value.length;
			} else {
				const fieldValue = (requiredParameterInfo.field as Field).getValue();
				return fieldValue === undefined || fieldValue === null || fieldValue === "";
			}
		});
		/* Message for missing mandatory value of the action parameter */
		if (emptyRequiredFields.length) {
			this._addMessageForActionParameter(
				messageManager,
				emptyRequiredFields.map((actionParameterInfo) => ({
					actionParameterInfo: actionParameterInfo,
					message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [
						(actionParameterInfo.field.getParent()?.getAggregation("label") as Label).getText()
					])
				}))
			);
		}
		/* Check value state of all parameters */
		const firstInvalidParameter = actionParameterInfos.find(
			(parameterInfo) =>
				parameterInfo.hasError || parameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(parameterInfo)
		);
		if (firstInvalidParameter) {
			firstInvalidParameter.field.focus();
			return false;
		} else {
			return true;
		}
	},

	/**
	 * Sets the action enablement.
	 *
	 * @param oInternalModelContext Object containing the context model
	 * @param oActionOperationAvailableMap Map containing the operation availability of actions
	 * @param aSelectedContexts Array containing selected contexts of the chart
	 * @param sControl Control name
	 * @returns The action enablement promises
	 */
	setActionEnablement: async function (
		oInternalModelContext: InternalModelContext,
		oActionOperationAvailableMap: Record<string, string>,
		aSelectedContexts: Context[],
		sControl: string
	) {
		const aPromises = [];
		for (const sAction in oActionOperationAvailableMap) {
			let aRequestPromises: Promise<_RequestedProperty>[] = [];
			oInternalModelContext.setProperty(sAction, false);
			const sProperty = oActionOperationAvailableMap[sAction];
			for (const element of aSelectedContexts) {
				const oSelectedContext = element;
				if (oSelectedContext) {
					const oContextData = oSelectedContext.getObject() as Record<string, unknown>;
					if (sControl === "chart") {
						if ((sProperty === null && !!oContextData[`#${sAction}`]) || oSelectedContext.getObject(sProperty)) {
							//look for action advertisement if present and its value is not null
							oInternalModelContext.setProperty(sAction, true);
							break;
						}
					} else if (sControl === "table") {
						aRequestPromises = this._setActionEnablementForTable(
							oSelectedContext,
							oInternalModelContext,
							sAction,
							sProperty,
							aRequestPromises
						);
					}
				}
			}
			if (sControl === "table") {
				if (!aSelectedContexts.length) {
					oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
						bEnabled: false,
						aApplicable: [],
						aNotApplicable: []
					});
					aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, []));
				} else if (aSelectedContexts.length && typeof sProperty === "string") {
					// When all property values have been retrieved, set
					// The applicable and not-applicable selected contexts for each action and
					// The enabled property of the dynamic action in internal model context.
					aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises));
				}
			}
		}
		return Promise.all(aPromises);
	},
	setActionEnablementAfterPatch: function (oView: View, oListBinding: ODataListBinding, oInternalModelContext: InternalModelContext) {
		const oInternalModelContextData = oInternalModelContext?.getObject() as Record<string, unknown>;
		const oControls = (oInternalModelContextData?.controls || {}) as Record<string, { controlId?: string }>;
		for (const sKey in oControls) {
			if (oControls[sKey] && oControls[sKey].controlId) {
				const oTable = oView.byId(sKey);
				if (oTable && oTable.isA<Table>("sap.ui.mdc.Table")) {
					const oRowBinding = oTable.getRowBinding();
					if (oRowBinding == oListBinding) {
						ActionRuntime.setActionEnablement(
							oTable.getBindingContext("internal") as InternalModelContext,
							JSON.parse(oTable.data("operationAvailableMap").customData),
							oTable.getSelectedContexts() as Context[],
							"table"
						);
					}
				}
			}
		}
	},

	updateEditButtonVisibilityAndEnablement(oView: FEView) {
		const iViewLevel = (oView.getViewData() as BaseManifestSettings)?.viewLevel,
			isEditable = oView.getModel("ui")?.getProperty("/isEditable");
		if ((iViewLevel as number) > 1 && isEditable !== true) {
			const oContext = oView.getBindingContext() as Context;
			const oAppComponent = CommonUtils.getAppComponent(oView);
			const sMetaPath = ModelHelper.getMetaPathForContext(oContext);
			const sEntitySet = ModelHelper.getRootEntitySetPath(sMetaPath);
			const metaContext = oContext
				?.getModel()
				.getMetaModel()
				?.getContext(oContext?.getPath());
			const converterContext = ConverterContext?.createConverterContextForMacro(
				sEntitySet,
				metaContext,
				oAppComponent.getDiagnostics(),
				merge,
				undefined
			);
			const entitySet = converterContext.getEntitySet();
			const entityType = converterContext.getEntityType();
			let updateHidden;
			//Find the Update Hidden of the root entity set and bind the property to AnyElement, any changes in the path of the root UpdateHidden will be updated via the property, internal model context is updated based on the property
			const bUpdateHidden = isEntitySet(entitySet) && entitySet.annotations.UI?.UpdateHidden?.valueOf();
			if (bUpdateHidden !== true) {
				updateHidden = ModelHelper.isUpdateHidden(entitySet, entityType);
			}
			//Find the operation available property of the root edit configuration and fetch the property using AnyElement
			const sEditEnableBinding = getEditButtonEnabled(converterContext);
			const draftRootPath = ModelHelper.getDraftRootPath(oContext);
			const sStickyRootPath = ModelHelper.getStickyRootPath(oContext);
			const sPath = draftRootPath || sStickyRootPath;
			const oInternalModelContext = oView.getBindingContext("internal") as InternalModelContext;
			if (sPath) {
				const oRootContext = oView.getModel().bindContext(sPath).getBoundContext();
				if (updateHidden !== undefined) {
					const sHiddenExpression = compileExpression(equal(getHiddenExpression(converterContext, updateHidden), false));
					this.updateEditModelContext(sHiddenExpression, oView, oRootContext, "rootEditVisible", oInternalModelContext);
				}
				if (sEditEnableBinding) {
					this.updateEditModelContext(sEditEnableBinding, oView, oRootContext, "rootEditEnabled", oInternalModelContext);
				}
			}
		}
	},

	updateEditModelContext: function (
		sBindingExpression: string | undefined,
		oView: View,
		oRootContext: Context,
		sProperty: string,
		oInternalModelContext: InternalModelContext
	) {
		if (sBindingExpression) {
			const oHiddenElement = new AnyElement({ anyText: sBindingExpression });
			oHiddenElement.setBindingContext(null);
			oView.addDependent(oHiddenElement);
			oHiddenElement.getBinding("anyText");
			const oContext = oHiddenElement
				.getModel()
				?.bindContext(oRootContext.getPath(), oRootContext, { $$groupId: "$auto.Heroes" })
				?.getBoundContext();
			oHiddenElement.setBindingContext(oContext);
			oHiddenElement?.getBinding("anyText")?.attachChange((oEvent: Event) => {
				const oNewValue = (oEvent.getSource() as PropertyBinding).getExternalValue();
				oInternalModelContext.setProperty(sProperty, oNewValue);
			});
		}
	},

	_setActionEnablementForTable: function (
		oSelectedContext: Context | undefined,
		oInternalModelContext: InternalModelContext,
		sAction: string,
		sProperty: string,
		aRequestPromises: Promise<_RequestedProperty>[]
	) {
		// Reset all properties before computation
		oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
			bEnabled: false,
			aApplicable: [],
			aNotApplicable: []
		});
		// Note that non dynamic actions are not processed here. They are enabled because
		// one or more are selected and the second part of the condition in the templating
		// is then undefined and thus the button takes the default enabling, which is true!
		const aApplicable = [],
			aNotApplicable = [],
			sDynamicActionEnabledPath = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}/bEnabled`;
		if (typeof sProperty === "object" && sProperty !== null && sProperty !== undefined) {
			if (oSelectedContext) {
				const oContextData = oSelectedContext.getObject() as Record<string, PrimitiveType>;
				const oTransformedBinding = transformRecursively(
					sProperty,
					"PathInModel",
					// eslint-disable-next-line no-loop-func
					function (oBindingExpression: PathInModelExpression<PrimitiveType>) {
						return oContextData ? constant(oContextData[oBindingExpression.path]) : constant(false);
					},
					true
				);
				const sResult = compileExpression(oTransformedBinding);
				if (sResult === "true") {
					oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
					aApplicable.push(oSelectedContext);
				} else {
					aNotApplicable.push(oSelectedContext);
				}
			}
			CommonUtils.setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable);
		} else {
			const oContextData = oSelectedContext?.getObject() as Record<string, PrimitiveType>;
			if (sProperty === null && !!oContextData[`#${sAction}`]) {
				//look for action advertisement if present and its value is not null
				oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
			} else if (oSelectedContext !== undefined) {
				// Collect promises to retrieve singleton or normal property value asynchronously
				aRequestPromises.push(CommonUtils.requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath));
			}
		}
		return aRequestPromises;
	},

	/**
	 * Check if action is critical.
	 *
	 * @param metaModel MetaModel
	 * @param path Path to the action
	 * @param contexts Contexts in case of bound actions.
	 * @returns Boolean indicating action is critical
	 */
	getIsActionCritical: function (metaModel: ODataMetaModel, path: string, contexts: Context[] = []): Boolean {
		// default is true.
		let isActionCriticalValue = true;
		const convertedTypes = convertTypes(metaModel);
		const actionTargetResolution = convertedTypes.resolvePath<EdmAction>(path);
		const actionTarget = actionTargetResolution.target;
		if (!actionTarget) {
			return isActionCriticalValue;
		}

		const isActionCriticalBindingExp = getIsActionCriticalExpression(actionTarget, convertedTypes);

		if (isConstant(isActionCriticalBindingExp)) {
			// Constant expression resolves to "true" or "false". But, we need boolean.
			isActionCriticalValue = compileConstant(isActionCriticalBindingExp, false, undefined, true);
		} else if (contexts.length > 0) {
			// We evaluate the value of the expression via a UI5 managed object instance.
			const anyObject = new Any({ anyBoolean: compileExpression(isActionCriticalBindingExp) });
			anyObject.setModel(contexts[0].getModel());
			anyObject.setBindingContext(contexts[0]);
			isActionCriticalValue = anyObject.getBinding("anyBoolean").getExternalValue();
			anyObject.destroy();
		}

		return isActionCriticalValue;
	}
};
export default ActionRuntime;
