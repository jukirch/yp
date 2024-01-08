import type { ConvertedMetadata, Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import ActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import type { InOutParameter, ValueHelpPayload } from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import ValueListHelper from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import highlightDOMElements from "sap/m/inputUtils/highlightDOMElements";
import type { AggregationBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type Field from "sap/ui/mdc/Field";
import type { FieldType } from "sap/ui/mdc/Field";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import ValueHelpDelegate from "sap/ui/mdc/ValueHelpDelegate";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import Condition from "sap/ui/mdc/condition/Condition";
import ConditionValidated from "sap/ui/mdc/enums/ConditionValidated";
import type FieldBase from "sap/ui/mdc/field/FieldBase";
import type FilterBarBase from "sap/ui/mdc/filterbar/FilterBarBase";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import StateUtil from "sap/ui/mdc/p13n/StateUtil";
import type Container from "sap/ui/mdc/valuehelp/base/Container";
import type Content from "sap/ui/mdc/valuehelp/base/Content";
import type FilterableListContent from "sap/ui/mdc/valuehelp/base/FilterableListContent";
import type MTable from "sap/ui/mdc/valuehelp/content/MTable";
import type Context from "sap/ui/model/Context";
import FilterType from "sap/ui/model/FilterType";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { AdditionalValueType } from "../internal/valuehelp/AdditionalValueHelper";
import { AdditionalValueGroupKey, additionalValueHelper } from "../internal/valuehelp/AdditionalValueHelper";

const FeCoreControlsFilterBar = "sap.fe.core.controls.FilterBar";

type ConditionObjectMap = Record<string, ConditionObject[]>;

export type ExternalStateType = {
	items: { name: string }[];
	filter: ConditionObjectMap;
};

export type ConditionPayloadType = Record<string, string | boolean>;

export type ConditionPayloadMap = Record<string, ConditionPayloadType[]>;

export default Object.assign({}, ValueHelpDelegate, {
	apiVersion: 2,

	/**
	 * Checks if a <code>ListBinding</code> supports $Search.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content Content element
	 * @param _listBinding
	 * @returns True if $search is supported
	 */
	isSearchSupported: function (valueHelp: ValueHelp, content: FilterableListContent, _listBinding: ODataListBinding) {
		return content.getFilterFields() === "$search";
	},

	/**
	 * Adjustable filtering for list-based contents.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content requesting conditions configuration
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 */
	updateBindingInfo: function (valueHelp: ValueHelp, content: FilterableListContent, bindingInfo: AggregationBindingInfo) {
		ValueHelpDelegate.updateBindingInfo(valueHelp, content, bindingInfo);

		if (content.getFilterFields() === "$search") {
			const search = content.getFilterValue();
			const normalizedSearch = CommonUtils.normalizeSearchTerm(search); // adjustSearch

			if (bindingInfo.parameters) {
				(bindingInfo.parameters as Record<string, unknown>).$search = normalizedSearch || undefined;
			}
		}
	},

	/**
	 * Checks if field is recommendation relevant and calls either _updateBinding or _updateBindingForRecommendations.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param content Filterable List Content
	 */
	updateBinding: async function (
		valueHelp: ValueHelp,
		listBinding: ODataListBinding,
		bindingInfo: AggregationBindingInfo,
		content: MTable
	) {
		//We fetch the valuelist property from the payload to make sure we pass the right property while making a call on valuelist entity set
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const valueListProperty = this._getValueListPropertyFromPayloadQualifier(payload);
		const isFilterFieldOrMultiValuedField =
			content.getControl().isA("sap.ui.mdc.FilterField") || content.getControl().isA("sap.ui.mdc.MultiValueField");
		const field = content.getControl() as FieldType;
		const fieldValue = !isFilterFieldOrMultiValuedField && field.getValue();
		// For define conditions valuehelp recommendations are not supported because "internal" model is not available.
		// We need to show recommendations only when the field has empty value or when user is typing a value. Other times we should not show recommendations.
		//Check if the field has any pending user input and if it is then we show recommendations if any.
		if ((!fieldValue || field?.hasPendingUserInput()) && content.isTypeahead() && !payload.isDefineConditionValueHelp) {
			const bindingContext = content.getBindingContext();
			const additionalValues: AdditionalValueType[] = [];
			//get the recommendation data from the internal model
			const inputValues = (content.getModel("internal") as JSONModel).getProperty("/recommendationsData") || {};
			let values: (string | number)[] = [];
			//Fetch the relevant recommendations based on the inputvalues and bindingcontext
			if (!isFilterFieldOrMultiValuedField) {
				values =
					additionalValueHelper.getRelevantRecommendations(
						inputValues,
						bindingContext as ODataV4Context,
						payload.propertyPath,
						content.getControl().getBinding("value")?.getPath()
					) || [];
			}
			//if there are relevant recommendations then create additionalvalue structure and call _updateBindingForRecommendations
			if (values?.length > 0) {
				additionalValues.push({ propertyPath: valueListProperty, values, groupKey: AdditionalValueGroupKey.recommendation });
				this._updateBindingForRecommendations(payload, listBinding, bindingInfo, additionalValues);
			} else {
				//call _updateBinding if there are no relevant recommendations
				this._updateBinding(listBinding, bindingInfo);
			}
		} else {
			//call _updateBinding if there are no relevant recommendations
			this._updateBinding(listBinding, bindingInfo);
		}
	},
	/**
	 * Executes a filter in a <code>ListBinding</code>.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding List binding
	 * @param requestedItems Number of requested items
	 * @returns Promise that is resolved if search is executed
	 */
	executeFilter: async function (valueHelp: ValueHelp, listBinding: ODataListBinding, requestedItems: number) {
		listBinding.getContexts(0, requestedItems);

		await this.checkListBindingPending(valueHelp, listBinding, requestedItems);
		return listBinding;
	},

	/**
	 * Checks if the <code>ListBinding</code> is waiting for an update.
	 * As long as the context has not been set for <code>ListBinding</code>,
	 * <code>ValueHelp</code> needs to wait.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param listBinding ListBinding to check
	 * @param requestedItems Number of requested items
	 * @returns Promise that is resolved once ListBinding has been updated
	 */
	checkListBindingPending: async function (valueHelp: ValueHelp, listBinding: ODataListBinding | undefined, requestedItems: number) {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		let isPending = false;
		if (payload.updateBindingDonePromise) {
			const updateBindingDone = await payload.updateBindingDonePromise;
			isPending = !updateBindingDone;
		} else if (listBinding && !listBinding.isSuspended()) {
			const contexts = await listBinding.requestContexts(0, requestedItems);
			isPending = contexts.length === 0;
		}
		return isPending;
	},

	getTypeMap: function (_valueHelp: ValueHelp) {
		return TypeMap;
	},

	/**
	 * Requests the content of the value help.
	 *
	 * This function is called when the value help is opened or a key or description is requested.
	 *
	 * So, depending on the value help content used, all content controls and data need to be assigned.
	 * Once they are assigned and the data is set, the returned <code>Promise</code> needs to be resolved.
	 * Only then does the value help continue opening or reading data.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param container Container instance
	 * @param contentId Id of the content shown after this call to retrieveContent
	 * @returns Promise that is resolved if all content is available
	 */
	retrieveContent: function (valueHelp: ValueHelp, container: Container, contentId: string) {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		return ValueListHelper.showValueList(payload, container, contentId);
	},

	_getConditionPayloadList: function (condition: ConditionObject) {
		const conditionPayloadMap = (condition.payload || {}) as ConditionPayloadMap,
			valueHelpQualifiers = Object.keys(conditionPayloadMap),
			conditionPayloadList = valueHelpQualifiers.length ? conditionPayloadMap[valueHelpQualifiers[0]] : [];

		return conditionPayloadList;
	},
	/**
	 * Returns ValueListProperty from Payload based on data from payload keys and parameters.
	 *
	 * @param payload Payload for delegate
	 * @returns ValueListProperty
	 */
	_getValueListPropertyFromPayloadQualifier: function (payload: ValueHelpPayload) {
		const params = payload.qualifiers[payload.valueHelpQualifier].vhParameters || [];
		const keys = payload.qualifiers[payload.valueHelpQualifier].vhKeys || [];
		const propertyKeyPath = payload.valueHelpKeyPath;
		let filteredKeys: string[] = [...keys];
		const helpPaths: string[] = [];
		if (params.length > 0) {
			//create helpPaths array which will only consist of params helppath
			params.forEach(function (param: InOutParameter) {
				helpPaths.push(param.helpPath);
			});
			//filter the keys based on helpPaths. If key is not present in helpPath then it is valuelistproperty
			filteredKeys = keys.filter((key: string) => {
				return !helpPaths.includes(key);
			});
		}

		// from filteredKeys return the key that matches the property name
		return propertyKeyPath && filteredKeys.includes(propertyKeyPath) ? propertyKeyPath : "";
	},

	_onConditionPropagationToFilterBar: async function (
		conditions: ConditionObject[],
		outParameters: InOutParameter[],
		filterBar: FilterBar,
		payload: ValueHelpPayload,
		listReportFilterBar: FilterBar
	) {
		try {
			const state: ExternalStateType = await StateUtil.retrieveExternalState(listReportFilterBar);
			const initialStateItems = state.items; // Visible FilterItems in the LR-FilterBar
			const filterBarProperties = filterBar.getPropertyHelper().getProperties();
			const metaModel = filterBar.getModel()?.getMetaModel() as ODataMetaModel;
			const contextPath = `/${payload.propertyPath.split("/")[1]}`;

			for (const condition of conditions) {
				const conditionPayloadList = this._getConditionPayloadList(condition);
				for (const outParameter of outParameters) {
					const filterTarget = outParameter.source.split("conditions/").pop() || "";
					const lastIndex = payload.propertyPath.lastIndexOf("/");
					const filterTargetPath =
						lastIndex > 0 ? `${payload.propertyPath.substring(0, lastIndex)}/${filterTarget}` : filterTarget;
					const annotationPath = metaModel?.getReducedPath(filterTargetPath, contextPath);
					const filterBarProperty = filterBarProperties.find((item) => item.annotationPath === annotationPath);
					// Propagate OUT parameter only if the filter field is visible in the LR filterbar
					// LR FilterBar or LR AdaptFilter
					if (filterBarProperty && initialStateItems?.find((item) => item.name === filterBarProperty.name)) {
						for (const conditionPayload of conditionPayloadList) {
							const newCondition = Condition.createCondition(
								"EQ",
								[conditionPayload[outParameter.helpPath]],
								null,
								null,
								ConditionValidated.Validated
							);
							state.filter[filterBarProperty.conditionPath] ||= [];
							state.filter[filterBarProperty.conditionPath].push(newCondition);
						}
					}
				}
			}
			// Apply to the parent of the FilterField
			StateUtil.applyExternalState(filterBar, state);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			Log.error(`ValueHelpDelegate: ${message}`);
		}
	},

	_onConditionPropagationToBindingContext: function (
		conditions: ConditionObject[],
		outParameters: InOutParameter[],
		context: ODataV4Context,
		valueHelp: ValueHelp
	) {
		const metaModel = context.getModel().getMetaModel();

		for (const condition of conditions) {
			const conditionPayloadList = this._getConditionPayloadList(condition),
				outValues = conditionPayloadList.length === 1 ? conditionPayloadList[0] : undefined;

			if (conditionPayloadList.length > 1) {
				Log.warning("ValueHelpDelegate: ParameterOut in multi-value-field not supported");
			}
			if (outValues) {
				this._onConditionPropagationUpdateProperty(metaModel, outValues, outParameters, context, valueHelp);
			}
		}
	},

	_onConditionPropagationUpdateProperty: function (
		metaModel: ODataMetaModel,
		outValues: ConditionPayloadType,
		outParameters: InOutParameter[],
		context: ODataV4Context,
		valueHelp: ValueHelp
	) {
		const convertedMetadata = convertTypes(metaModel);
		const rootPath = metaModel.getMetaContext(context.getPath()).getPath();
		const contextCanRequestSideEffects = context.isTransient() !== true && !context.isInactive();
		const outParameterSources: string[] = [];
		for (const outParameter of outParameters) {
			/* Updated property via out-parameter if value changed */
			if (context.getProperty(outParameter.source) !== outValues[outParameter.helpPath]) {
				this._updatePropertyViaOutParameter(
					convertedMetadata,
					rootPath,
					outValues,
					outParameter,
					context,
					contextCanRequestSideEffects
				);
			}
			outParameterSources.push(outParameter.source);
		}
		if (ActivitySync.isConnected(valueHelp)) {
			// we determine the binding that sends the request
			let binding;
			if (context.getBinding().isA("sap.ui.model.odata.v4.ODataListBinding")) {
				binding = context.getBinding();
			} else {
				const view = CommonUtils.getTargetView(valueHelp);
				binding = (view.getBindingContext() as ODataV4Context).getBinding();
			}
			/* The out values have been changed --> wait until the request is sent to the server before sending a notification to the other collaborators
			   We attach the event on the right binding */
			binding.attachEventOnce("patchCompleted", () => {
				ActivitySync.send(valueHelp as unknown as Control, {
					action: Activity.Change,
					content: outParameterSources.map((source) => context.getPath() + "/" + source)
				});
			});
		}
	},

	_updatePropertyViaOutParameter: function (
		convertedMetadata: ConvertedMetadata,
		rootPath: string,
		outValues: ConditionPayloadType,
		outParameter: InOutParameter,
		context: ODataV4Context,
		contextCanRequestSideEffects: boolean
	) {
		/* Updated property via out-parameter if value changed */
		const propertyPath = `${rootPath}/${outParameter.source}`;
		const targetProperty = convertedMetadata.resolvePath<Property>(propertyPath).target;
		const fieldControl = targetProperty?.annotations?.Common?.FieldControl;
		const dynamicReadOnly = isPathAnnotationExpression(fieldControl) ? context.getProperty(fieldControl.path) === 1 : false;
		if (dynamicReadOnly && contextCanRequestSideEffects) {
			/* Non-Transient and active context */
			const lastIndex = outParameter.source.lastIndexOf("/");
			const sideEffectPath = lastIndex > 0 ? outParameter.source.substring(0, lastIndex) : outParameter.source;
			/* We send [<propertyName>] in case of a property path without any navigation involved */
			/* In case of a path involving navigations, we send [<navigationPath>] ending with a navigation property and not with a property */
			context.requestSideEffects([sideEffectPath]);
		} else {
			/* The fast creation row (transient context) can´t have instant specific (dynamic) read-only fields, therefore we don´t need to handle/consider this case specifically */
			/* Additional infos: */
			/* The fast creation row is only used by SD */
			/* The group ID (third argument of setProperty described api documentation of the Context) is used for the PATCH request, if not specified, the update group ID for the context's binding is used, 'null' to prevent the PATCH request */
			/* The Transient context cannot request SideEffects and  cannot patch via group 'null' */
			context.setProperty(outParameter.source, outValues[outParameter.helpPath]);
		}
		/* If the key gets updated via out-parameter, then the description needs also retrieved with requestSideEffects */
		const textPath = isPathAnnotationExpression(targetProperty?.annotations?.Common?.Text)
			? targetProperty?.annotations?.Common?.Text.path
			: undefined;
		if (textPath !== undefined && contextCanRequestSideEffects) {
			const lastIndex = textPath.lastIndexOf("/");
			const sideEffectPath = lastIndex > 0 ? textPath.substring(0, lastIndex) : textPath;
			/* The sideEffectPath can be [<propertyName>] or [<navigationPath>] */
			context.requestSideEffects([sideEffectPath]);
		}
	},

	getFilterConditions: function (valueHelp: ValueHelp, content: Content, _config: any) {
		if (this.getInitialFilterConditions) {
			return this.getInitialFilterConditions(valueHelp, content, (_config && _config.control) || (content && content.getControl()));
		}
		return {};
	},

	/**
	 * Callback invoked every time a {@link sap.ui.mdc.ValueHelp ValueHelp} fires a select event or the value of the corresponding field changes
	 * This callback may be used to update external fields.
	 *
	 * @param valueHelp ValueHelp control instance receiving the <code>controlChange</code>
	 * @param reason Reason why the method was invoked
	 * @param _config Current configuration provided by the calling control
	 * @since 1.101.0
	 */
	onConditionPropagation: async function (valueHelp: ValueHelp, reason: string, _config: unknown) {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		if (reason !== "ControlChange" || payload.isDefineConditionValueHelp) {
			// handle only ControlChange reason
			// also don't handle for define condition value help as propagating conditions on the value help
			// to define conditions does not make sense but would only confuse users by allowing recursive use
			// of the condition value help
			return;
		}
		const qualifier = payload.qualifiers[payload.valueHelpQualifier];
		const outParameters = qualifier?.vhParameters !== undefined ? ValueListHelper.getOutParameters(qualifier.vhParameters) : [],
			field = valueHelp.getControl() as FieldBase,
			fieldParent = field.getParent() as FilterBarBase | Control;

		let conditions = field.getConditions() as ConditionObject[];
		conditions = conditions.filter(function (condition) {
			const conditionPayloadMap = (condition.payload || {}) as ConditionPayloadMap;
			return conditionPayloadMap[payload.valueHelpQualifier];
		});

		const listReportFilterBar = valueHelp.getParent() as FilterBarBase | Control; // Control e.g. FormContainer
		if (listReportFilterBar.isA(FeCoreControlsFilterBar)) {
			// Propagate the value only if the FilterField is part of the LR-FilterBar also inside in Adapt Filters dialog
			await this._onConditionPropagationToFilterBar(
				conditions,
				outParameters,
				fieldParent as FilterBar,
				payload,
				listReportFilterBar as FilterBar
			);
			// LR Settings Dialog or OP Settings Dialog shall not propagate value to the dialog filterfields or context
		} else {
			// Object Page
			/* To avoid timing issue we use the BindingContext of the control instead of the ValueHelp (BCP 2380057227) */
			const context = field.getBindingContext() as ODataV4Context | undefined;
			if (context) {
				this._onConditionPropagationToBindingContext(conditions, outParameters, context, valueHelp);
			}
		}
	},

	_createInitialFilterCondition: function (value: unknown, initialValueFilterEmpty: boolean) {
		let condition: ConditionObject | undefined;

		if (value === undefined || value === null) {
			Log.error("ValueHelpDelegate: value of the property could not be requested");
		} else if (value === "") {
			if (initialValueFilterEmpty) {
				condition = Condition.createCondition("Empty", [], null, null, ConditionValidated.Validated);
			}
		} else {
			condition = Condition.createCondition("EQ", [value], null, null, ConditionValidated.Validated);
		}
		return condition;
	},

	_getInitialFilterConditionsFromBinding: async function (
		inConditions: ConditionObjectMap,
		control: Control,
		inParameters: InOutParameter[],
		payload: ValueHelpPayload
	) {
		const bindingContext = control.getBindingContext() as ODataV4Context | undefined;
		if (!bindingContext) {
			Log.error("ValueHelpDelegate: No BindingContext");
			return inConditions;
		}
		let navPath = "";
		/* We need to request the in-parameter values relative to the binding context.
In some cases (e.g. multi value field), the binding context does not point to the
VH annotation target, thus we identify the needed navigation relation by
reducing the payload.propertyPath by the path derived from binding context.
This cannot happen in case of action parameter dialog, which can be identified by the path "$Parameter".
*/
		if (bindingContext.getBinding().getPath() !== "$Parameter") {
			const metaModel = control.getModel()?.getMetaModel() as ODataMetaModel;
			const rootPath = metaModel.getMetaPath(bindingContext.getPath());
			navPath = payload.propertyPath.replace(rootPath + "/", "");
			const lastIndex = navPath.lastIndexOf("/");
			navPath = lastIndex > 0 ? `${navPath.substring(0, lastIndex)}/` : "";
		}
		const propertiesToRequest = inParameters.map((inParameter) => navPath + inParameter.source);

		// According to odata v4 api documentation for requestProperty: Property values that are not cached yet are requested from the back end
		const values = await bindingContext.requestProperty(propertiesToRequest);

		for (let i = 0; i < inParameters.length; i++) {
			const inParameter = inParameters[i];
			const condition = this._createInitialFilterCondition(values[i], inParameter.initialValueFilterEmpty);

			if (condition) {
				inConditions[inParameter.helpPath] = [condition];
			}
		}
		return inConditions;
	},

	_getInitialFilterConditionsFromFilterBar: async function (
		inConditions: ConditionObjectMap,
		control: Control,
		inParameters: InOutParameter[]
	) {
		const filterBar = control.getParent() as FilterBarBase;
		const state: ExternalStateType = await StateUtil.retrieveExternalState(filterBar);

		for (const inParameter of inParameters) {
			const conditions = this._getConditionsFromInParameter(inParameter, state);
			if (conditions) {
				inConditions[inParameter.helpPath] = conditions;
			}
		}
		return inConditions;
	},

	/**
	 * Returns the filter conditions.
	 * Regarding a navigation path in the InOut parameters and disregarding prefixes in the navigation path like e.g. '$filters>/conditions/' or 'owner'.
	 *
	 * @param inParameter InParmeter of the filter field value help
	 * @param state The external filter state
	 * @returns The filter conditions
	 * @since 1.114.0
	 */
	_getConditionsFromInParameter: function (inParameter: InOutParameter, state: ExternalStateType) {
		const sourceField = inParameter.source;
		const key = Object.keys(state.filter).find((key) => ("/" + sourceField).endsWith("/" + key)); //additional '/' to handle heading characters in the source name if there is no path
		return key && state.filter[key];
	},

	_partitionInParameters: function (inParameters: InOutParameter[]) {
		const inParameterMap: Record<string, InOutParameter[]> = {
			constant: [],
			binding: [],
			filter: []
		};

		for (const inParameter of inParameters) {
			if (inParameter.constantValue !== undefined) {
				inParameterMap.constant.push(inParameter);
			} else if (inParameter.source.indexOf("$filter") === 0) {
				inParameterMap.filter.push(inParameter);
			} else {
				inParameterMap.binding.push(inParameter);
			}
		}
		return inParameterMap;
	},

	_tableAfterRenderDelegate: {
		onAfterRendering: function (event: jQuery.Event & { srcControl: Control }) {
			const table = event.srcControl, // m.Table
				tableCellsDomRefs = table.$().find("tbody .sapMText"),
				mdcMTable = table.getParent() as MTable;

			highlightDOMElements(tableCellsDomRefs, mdcMTable.getFilterValue(), true);
		}
	},

	/**
	 * Provides an initial condition configuration everytime a value help content is shown.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content requesting conditions configuration
	 * @param control Instance of the calling control
	 * @returns Returns a map of conditions suitable for a sap.ui.mdc.FilterBar control
	 * @since 1.101.0
	 */
	getInitialFilterConditions: async function (valueHelp: ValueHelp, content: Content, control: Control | undefined) {
		// highlight text in ValueHelp popover
		if (content?.isA("sap.ui.mdc.valuehelp.content.MTable")) {
			const popoverTable = (content as MTable).getTable();
			popoverTable?.removeEventDelegate(this._tableAfterRenderDelegate);
			popoverTable?.addEventDelegate(this._tableAfterRenderDelegate, this);
		}

		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const inConditions: ConditionObjectMap = {};

		// For define conditions valuehelp initial filter conditions are not supported, because the control of the define conditions
		// is cloned and not the original one to which field valuehelp was attached. And as a result we cannot get in parameter value. For simplicity
		// we just skip the rest of the code related to filter conditions.
		if (payload.isDefineConditionValueHelp) {
			return inConditions;
		}

		if (!control) {
			Log.error("ValueHelpDelegate: Control undefined");
			return inConditions;
		}

		const qualifier = payload.qualifiers[payload.valueHelpQualifier];
		const inParameters = qualifier?.vhParameters !== undefined ? ValueListHelper.getInParameters(qualifier.vhParameters) : [];
		const inParameterMap = this._partitionInParameters(inParameters);
		const isObjectPage = control.getBindingContext();

		for (const inParameter of inParameterMap.constant) {
			const condition = this._createInitialFilterCondition(
				inParameter.constantValue,
				isObjectPage ? inParameter.initialValueFilterEmpty : false // no filter with "empty" on ListReport
			);
			if (condition) {
				inConditions[inParameter.helpPath] = [condition];
			}
		}

		if (inParameterMap.binding.length) {
			await this._getInitialFilterConditionsFromBinding(inConditions, control, inParameterMap.binding, payload);
		}

		if (inParameterMap.filter.length) {
			await this._getInitialFilterConditionsFromFilterBar(inConditions, control, inParameterMap.filter);
		}
		return inConditions;
	},

	/**
	 * Provides the possibility to convey custom data in conditions.
	 * This enables an application to enhance conditions with data relevant for combined key or outparameter scenarios.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content instance
	 * @param _values Description pair for the condition which is to be created
	 * @param context Optional additional context
	 * @returns Optionally returns a serializable object to be stored in the condition payload field
	 * @since 1.101.0
	 */
	createConditionPayload: function (
		valueHelp: ValueHelp,
		content: Content,
		_values: unknown[],
		context: ODataV4Context
	): ConditionPayloadMap | undefined {
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		const qualifier = payload.qualifiers[payload.valueHelpQualifier],
			entry: ConditionPayloadType = {},
			conditionPayload: ConditionPayloadMap = {};
		const control = content.getControl();
		const isMultiValueField = control?.isA("sap.ui.mdc.MultiValueField");
		if (!qualifier.vhKeys || qualifier.vhKeys.length === 1 || isMultiValueField) {
			return undefined;
		}
		qualifier.vhKeys.forEach(function (vhKey) {
			const value = context.getObject(vhKey);
			if (value != null) {
				entry[vhKey] = value?.length === 0 ? "" : value;
			}
		});
		if (Object.keys(entry).length) {
			/* vh qualifier as key for relevant condition */
			conditionPayload[payload.valueHelpQualifier] = [entry];
		}
		return conditionPayload;
	},

	/**
	 * Provides the possibility to customize selections in 'Select from list' scenarios.
	 * By default, only condition keys are considered. This may be extended with payload dependent filters.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content ValueHelp content instance
	 * @param item Entry of a given list
	 * @param conditions Current conditions
	 * @returns True, if item is selected
	 * @since 1.101.0
	 */
	isFilterableListItemSelected: function (
		valueHelp: ValueHelp,
		content: FilterableListContent,
		item: Control,
		conditions: ConditionObject[]
	) {
		//In value help dialogs of single value fields the row for the key shouldn´t be selected/highlight anymore BCP: 2270175246
		const payload = valueHelp.getPayload() as ValueHelpPayload;
		if (payload.isValueListWithFixedValues !== true && (content.getConfig() as { maxConditions?: number })?.maxConditions === 1) {
			return false;
		}

		const context = item.getBindingContext();

		/* Do not consider "NotValidated" conditions */
		conditions = conditions.filter((condition) => condition.validated === ConditionValidated.Validated);

		const selectedCondition = conditions.find(function (condition) {
			const conditionPayloadMap = condition.payload as ConditionPayloadMap | undefined,
				valueHelpQualifier = payload.valueHelpQualifier || "";
			if (!conditionPayloadMap && Object.keys(payload.qualifiers)[0] === valueHelpQualifier) {
				const keyPath = content.getKeyPath();
				return context?.getObject(keyPath) === condition?.values[0];
			}
			const conditionSelectedRow = conditionPayloadMap?.[valueHelpQualifier]?.[0] || {},
				selectedKeys = Object.keys(conditionSelectedRow);
			if (selectedKeys.length) {
				return selectedKeys.every(function (key) {
					return (conditionSelectedRow[key] as unknown) === context?.getObject(key);
				});
			}
			return false;
		});

		return selectedCondition ? true : false;
	},
	/**
	 * Creates contexts for additional values and resumes the list binding.
	 *
	 * @param payload Payload for delegate
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 * @param additionalValues Array of AdditionalValues
	 */
	_updateBindingForRecommendations: async function (
		payload: ValueHelpPayload,
		listBinding: ODataListBinding,
		bindingInfo: AggregationBindingInfo,
		additionalValues: AdditionalValueType[]
	) {
		let updateBindingDonePromiseResolve: Function | undefined;
		//create a promise to make sure checkListBindingPending is only completed once this promise is resolved
		payload.updateBindingDonePromise = new Promise(function (resolve) {
			updateBindingDonePromiseResolve = resolve;
		});
		try {
			//sort and filter valuehelpbinding to make sure we render others group
			additionalValueHelper.sortAndFilterOthers(listBinding, bindingInfo, additionalValues);
			//resume the list binding and then reset the changes
			additionalValueHelper.resumeValueListBindingAndResetChanges(listBinding);
			//fetch the contexts of additionalvalues
			const additionalValueContextData = await additionalValueHelper.requestForAdditionalValueContextData(
				additionalValues,
				listBinding,
				bindingInfo
			);
			//remove duplicate values from different groups of additionalvalues
			const uniqueAdditionalValues = additionalValueHelper.removeDuplicateAdditionalValues(additionalValueContextData, [
				...additionalValues
			]);
			// add transient context to list binding after backend query is done
			additionalValueHelper.createAdditionalValueTransientContexts(
				additionalValueContextData,
				uniqueAdditionalValues.reverse(),
				listBinding
			);
		} catch (error: unknown) {
			//Do nothing as we know that reset changes would throw an error in console and this will pile up a lot of console errors
		}
		if (updateBindingDonePromiseResolve) {
			//resolve the promise as everything is completed
			updateBindingDonePromiseResolve(true);
		}
	},
	/**
	 * Executes a filter in a <code>ListBinding</code> and resumes it, if suspended.
	 *
	 * @param listBinding List binding
	 * @param bindingInfo The binding info object to be used to bind the list to the model
	 */
	_updateBinding: async function (listBinding: ODataListBinding, bindingInfo: AggregationBindingInfo) {
		const rootBinding = listBinding.getRootBinding() || listBinding;
		if (!rootBinding.isSuspended()) {
			rootBinding.suspend();
		}
		if (bindingInfo.parameters) {
			listBinding.changeParameters(bindingInfo.parameters);
		}
		listBinding.filter(bindingInfo.filters, FilterType.Application);
		listBinding.sort(bindingInfo.sorter);

		if (rootBinding.isSuspended()) {
			rootBinding.resume();
			rootBinding.resetChanges();
		}
	},
	/**
	 * Returns an boolean value if additionalvalues exists which will contain different groups like recommendations.
	 *
	 * @param content Filterable List Content
	 * @param payload Payload for delegate
	 * @returns Boolean value
	 */
	checkIfAdditionalValuesExists: function (content: MTable, payload: ValueHelpPayload) {
		// For define conditions valuehelp recommendations are not supported because "internal" model is not available.
		if (payload.isDefineConditionValueHelp) {
			return false;
		}

		const bindingContext = content.getBindingContext();
		//get the recommendation data from the internal model
		const inputValues = (content.getModel("internal") as JSONModel).getProperty("/recommendationsData") || {};
		//Fetch the relevant recommendations based on the inputvalues and bindingcontext
		const values =
			additionalValueHelper.getRelevantRecommendations(
				inputValues,
				bindingContext as ODataV4Context,
				payload.propertyPath,
				content.getControl().getBinding("value")?.getPath()
			) || [];
		if (values?.length > 0) {
			//if there are relevant recommendations then return true
			return true;
		}
		return false;
	},
	/**
	 * Returns a boolean value which will tell whether typeahead should be opened or not.
	 *
	 * @param valueHelp The <code>ValueHelp</code> instance
	 * @param content Filterable List Content
	 * @returns Boolean value whether to show typeahead or not
	 */
	showTypeahead: function (valueHelp: ValueHelp, content: MTable) {
		if (!content.getControl().isA("sap.ui.mdc.FilterField") && !content.getControl().isA("sap.ui.mdc.MultiValueField")) {
			const filterValue = content?.getFilterValue();
			const vhValue = (content?.getControl() as Field)?.getValue();
			const fieldTextValue = (content?.getControl() as Field)?.getAdditionalValue();
			if (vhValue || fieldTextValue) {
				// valuehelp had some value, but user cleared the value
				// in such case we get input value as '' and we will return false
				//Note: In SDs usecase we wanted to open the typeAhead if there are recommendations and value is blank, they should pass us a flag so that we can handle this accordingly
				return (
					(content.getControl() as FieldType).hasPendingUserInput() &&
					(filterValue !== "" || this.checkIfAdditionalValuesExists(content, valueHelp.getPayload() as ValueHelpPayload))
				);
			} else {
				//if valuehelp value is not there and there is filter value then user is typing and we return true else we would only open
				//if it is recommendation relevant field
				if (filterValue) {
					return true;
				}
				return this.checkIfAdditionalValuesExists(content, valueHelp.getPayload() as ValueHelpPayload);
			}
		}
		return true;
	},
	getFirstMatch: function (oValueHelp: ValueHelp, oContent: Control, oConfig: unknown): Context | void {
		// FIXME workaround until BCP 2370124674 is fixed
		if (oContent.isA<MTable>("sap.ui.mdc.valuehelp.content.MTable")) {
			const oListBinding = oContent.getListBinding();
			return oListBinding.getAllCurrentContexts()[0];
		}
		return ValueHelpDelegate.getFirstMatch(oValueHelp, oContent, oConfig);
	}
});
