import { CommonAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type {
	AnnotationValueListType,
	AnnotationValueListTypeByQualifier,
	ValueHelpPayload
} from "sap/fe/macros/internal/valuehelp/ValueListHelper";
import type Control from "sap/ui/core/Control";
import type Field from "sap/ui/mdc/Field";
import type ValueHelp from "sap/ui/mdc/ValueHelp";
import type { ItemForValueConfiguration } from "sap/ui/mdc/ValueHelp";
import type ConditionModel from "sap/ui/mdc/condition/ConditionModel";
import type FieldBase from "sap/ui/mdc/field/FieldBase";
import FieldBaseDelegate from "sap/ui/mdc/field/FieldBaseDelegate";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";
import Filter from "sap/ui/model/Filter";
import type SimpleType from "sap/ui/model/SimpleType";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { ConditionPayloadMap, ConditionPayloadType } from "../valuehelp/ValueHelpDelegate";
export type FieldPayload = {
	retrieveTextFromValueList?: boolean;
	isFilterField?: boolean;
};

export type Value = string | Date | number | boolean | undefined | null;

export type TypeInitialization = {
	bTypeInitialized?: boolean;
	mCustomUnits?: string;
};

export type Config = {
	value: Value;
	parsedValue: Value;
	bindingContext: Context;
	checkKey: boolean;
	checkDescription: boolean;
	conditionModel?: ConditionModel;
	conditionModelName?: string;
	control?: object;
};

export default Object.assign({}, FieldBaseDelegate, {
	apiVersion: 2,

	/**
	 * If the <code>Field</code> control is used, the used data type might come from the binding.
	 * In V4-unit or currency case it might need to be formatted once.
	 * To initialize the internal type later on, the currencies must be returned.
	 *
	 * @param field The <code>Field</code> instance
	 * @param type Type from binding
	 * @param value Given value
	 * @returns Information needed to initialize internal type (needs to set bTypeInitialized to true if initialized)
	 */
	initializeTypeFromBinding: function (field: Field, type: SimpleType | undefined, value: Value | Value[]) {
		// V4 Unit and Currency types have a map with valid units and create an internal customizing for it.
		// The Field needs to keep this customizing logic when creating the internal type.
		// (As external RAW binding is used there is no formatting on parsing.)

		const result: TypeInitialization = {};
		if (
			type &&
			type.isA(["sap.ui.model.odata.type.Unit", "sap.ui.model.odata.type.Currency"]) &&
			Array.isArray(value) &&
			value.length > 2 &&
			value[2] !== undefined
		) {
			// format once to set internal customizing. Allow null as valid values for custom units
			type.formatValue(value, "string");
			result.bTypeInitialized = true;
			result.mCustomUnits = value[2] as string; // TODO: find a better way to provide custom units to internal type
		}

		return result;
	},

	/**
	 * This function initializes the unit type.
	 * If the <code>Field</code> control is used, the used data type might come from the binding.
	 * If the type is a V4 unit or currency, it might need to be formatted once.
	 *
	 * @param field The <code>Field</code> instance
	 * @param type Type from binding
	 * @param typeInitialization Information needed to initialize internal type
	 */
	initializeInternalUnitType: function (field: Field, type: SimpleType, typeInitialization?: TypeInitialization) {
		if (typeInitialization?.mCustomUnits !== undefined) {
			// if already initialized initialize new type too.
			type.formatValue([null, null, typeInitialization.mCustomUnits], "string");
		}
	},

	/**
	 * This function enhances the value with unit or currency information if needed by the data type.
	 *
	 * @param field The <code>Field</code> instance
	 * @param  values Values
	 * @param  typeInitialization Information needed to initialize internal type
	 * @returns Values
	 */
	enhanceValueForUnit: function (field: Field, values: Value[], typeInitialization?: TypeInitialization) {
		if (typeInitialization?.bTypeInitialized === true && values.length === 2) {
			values.push(typeInitialization.mCustomUnits);
			return values;
		}

		return undefined;
	},

	/**
	 * This function returns which <code>ValueHelpDelegate</code> is used
	 * if a default field help (for example, for defining conditions in </code>FilterField</code>)
	 * is created.
	 *
	 * @param _field The <code>Field</code> instance
	 * @returns Delegate object with name and payload
	 */
	getDefaultValueHelpDelegate: function (_field: Field) {
		return { name: "sap/ui/mdc/odata/v4/ValueHelpDelegate", payload: {} };
	},

	getTypeMap: function (_field: Field) {
		return TypeMap;
	},

	/**
	 * Determine all parameters in a value help that use a specific property.
	 *
	 * @param valueListInfo Value list info
	 * @param propertyName Name of the property
	 * @returns List of all found parameters
	 */
	_getValueListParameter: function (valueListInfo: AnnotationValueListType, propertyName: string) {
		//determine path to value list property
		return valueListInfo.Parameters.filter(function (entry) {
			if (entry.LocalDataProperty) {
				return entry.LocalDataProperty.$PropertyPath === propertyName;
			} else {
				return false;
			}
		});
	},
	/**
	 * Build filters for each relevant parameter.
	 *
	 * @param valueList Value list info
	 * @param propertyName Name of the property
	 * @param valueHelpProperty Name of the value help property
	 * @param keyValue Value of the property
	 * @param valuehelpPayload Payload of the value help
	 * @param valuehelpConditionPayload Additional condition information for this key
	 * @param bindingContext BindingContext of the field
	 * @returns List of filters
	 */
	_getFilter: function (
		valueList: AnnotationValueListType,
		propertyName: string,
		valueHelpProperty: string,
		keyValue: string,
		valuehelpPayload: ValueHelpPayload,
		valuehelpConditionPayload: ConditionPayloadType[] | undefined,
		bindingContext?: Context
	) {
		const filters = [];
		const parameters = valueList.Parameters.filter(function (parameter) {
			return (
				parameter.$Type === CommonAnnotationTypes.ValueListParameterIn ||
				parameter.$Type === CommonAnnotationTypes.ValueListParameterInOut ||
				(parameter.LocalDataProperty?.$PropertyPath === propertyName && parameter.ValueListProperty === valueHelpProperty)
			);
		});
		for (const parameter of parameters) {
			let filterValue;
			if (parameter.LocalDataProperty?.$PropertyPath === propertyName) {
				filterValue = keyValue;
			} else if (valuehelpPayload?.isActionParameterDialog === true) {
				const apdFieldPath = `APD_::${parameter.LocalDataProperty?.$PropertyPath}`;
				const apdField = sap.ui.getCore().byId(apdFieldPath) as Field;
				filterValue = apdField?.getValue();
			} else if (valuehelpConditionPayload !== undefined) {
				const sourcePath = parameter.LocalDataProperty?.$PropertyPath;
				const conditionPayload = valuehelpConditionPayload?.[0];
				filterValue = sourcePath && conditionPayload?.[sourcePath];
			} else if (bindingContext !== undefined) {
				// if the value help is not used try getting the filter value from the binding context
				const sourcePath = parameter.LocalDataProperty?.$PropertyPath;
				filterValue = bindingContext.getObject(sourcePath);
			}
			/* Add value to the filter for the text determination */
			if (filterValue !== null && filterValue !== undefined) {
				filters.push(new Filter({ path: parameter.ValueListProperty, operator: "EQ", value1: filterValue }));
			}
		}
		return filters;
	},

	/**
	 * Determines the key, description, and payload of a user input.
	 *
	 * @param field The <code>Field</code> instance
	 * @param valueHelp Value help instance
	 * @param config Configuration Object
	 * @returns Object containing description, key, and payload. If it is not available right now (must be requested), a <code>Promise</code> is returned
	 */
	getItemForValue: function (field: Field, valueHelp: ValueHelp, config: ItemForValueConfiguration) {
		//BCP: 2270162887 . The MDC field should not try to get the item when the field is emptied
		// JIRA: FIORITECHP1-25361 - Improve the type-ahead behavior for missinng text annotation or constraints violations of the existing text annotation
		if (config.value === "") {
			return;
		}

		if (config.checkDescription) {
			const valuehelpPayload = valueHelp.getPayload() as ValueHelpPayload;
			const descriptionPath = valuehelpPayload.valueHelpDescriptionPath;
			const maxLength = valuehelpPayload?.maxLength;
			const valueLength = config.value !== null && config.value !== undefined ? config.value.toString().length : 0;
			if (descriptionPath === "") {
				// In case the property value help collection has no text annotation (descriptionPath is empty) the description check shouldn´t occur.
				// In such a case the method getDescription will be called by MDC and within this method a SideEffect is requested to retrieve the text from the text property of the main entity
				config.checkDescription = false;
			} else if (maxLength !== undefined && valueLength > maxLength) {
				//value length is > text proeperty length constraint
				return;
			}
		}
		return FieldBaseDelegate.getItemForValue(field, valueHelp, config);
	},

	/**
	 * Determines the description for a given key.
	 *
	 * @param field The <code>Field</code> instance
	 * @param valueHelp Field help assigned to the <code>Field</code> or <code>FilterField</code> control
	 * @param key Key value of the description
	 * @param _conditionIn In parameters for the key (no longer supported)
	 * @param _conditionOut Out parameters for the key (no longer supported)
	 * @param bindingContext BindingContext <code>BindingContext</code> of the checked field. Inside a table, the <code>ValueHelp</code> element can be connected to a different row
	 * @param _ConditionModel ConditionModel</code>, if bound to one
	 * @param _conditionModelName Name of the <code>ConditionModel</code>, if bound to one
	 * @param conditionPayload Additional context information for this key
	 * @param control Instance of the calling control
	 * @param _type Type of the value
	 * @returns Description for the key or object containing a description, key and payload. If the description is not available right away (it must be requested), a <code>Promise</code> is returned
	 */
	getDescription: async function (
		field: Field | null,
		valueHelp: ValueHelp,
		key: string,
		_conditionIn: object,
		_conditionOut: object,
		bindingContext: Context | undefined,
		_ConditionModel: ConditionModel,
		_conditionModelName: string,
		conditionPayload: ConditionPayloadMap,
		control: Control,
		_type: unknown
	) {
		//JIRA: FIORITECHP1-22022 . The MDC field should not  tries to determine description with the initial GET of the data.
		// it should rely on the data we already received from the backend
		// But The getDescription function is also called in the FilterField case if a variant is loaded.
		// As the description text could be language dependent it is not stored in the variant, so it needs to be read on rendering.

		let payload = field?.getPayload() as FieldPayload;

		/* Retrieve text from value help, if value was set by out-parameter (BCP 2270160633) */
		if (!payload && (control as FieldBase)?.getDisplay().includes("Description")) {
			payload = {
				retrieveTextFromValueList: true
			};
		}

		if (payload?.retrieveTextFromValueList === true || payload?.isFilterField === true) {
			const dataModel = valueHelp.getModel() as ODataModel | undefined;
			const metaModel = dataModel
				? dataModel.getMetaModel()
				: CommonUtils.getAppComponent(valueHelp as unknown as Control)
						.getModel()
						.getMetaModel();
			const valuehelpPayload = valueHelp.getPayload() as ValueHelpPayload;
			const valuehelpConditionPayload = conditionPayload?.[valuehelpPayload.valueHelpQualifier];
			const propertyPath = valuehelpPayload.propertyPath;
			const propertyDescriptionPath = valuehelpPayload?.propertyDescriptionPath;
			let textProperty: string;

			try {
				/* Request value help metadata */
				const valueListInfo = (await metaModel.requestValueListInfo(
					propertyPath,
					true,
					bindingContext
				)) as AnnotationValueListTypeByQualifier;

				const propertyName = metaModel.getObject(`${propertyPath}@sapui.name`) as string;
				// take the first value list annotation - alternatively take the one without qualifier or the first one
				const valueList = valueListInfo[Object.keys(valueListInfo)[0]];
				const valueHelpParameters = this._getValueListParameter(valueList, propertyName);
				const valueHelpProperty = valueHelpParameters?.[0]?.ValueListProperty;
				if (!valueHelpProperty) {
					throw Error(`Inconsistent value help annotation for ${propertyName}`);
				}
				// get text annotation for this value list property
				const valueListModel = valueList.$model;
				const textAnnotation = valueListModel
					.getMetaModel()
					.getObject(`/${valueList.CollectionPath}/${valueHelpProperty}@com.sap.vocabularies.Common.v1.Text`);
				if (textAnnotation && textAnnotation.$Path) {
					textProperty = textAnnotation.$Path;
					/* Build the filter for the relevant parameters */
					const filters = this._getFilter(
						valueList,
						propertyName,
						valueHelpProperty,
						key,
						valuehelpPayload,
						valuehelpConditionPayload,
						bindingContext
					);
					const listBinding = valueListModel.bindList(`/${valueList.CollectionPath}`, undefined, undefined, filters, {
						$select: textProperty
					});
					/* Request description for given key from value list entity */
					const contexts = await listBinding.requestContexts(0, 2);
					return contexts.length ? contexts[0].getObject(textProperty) : undefined;
				} else if (bindingContext !== undefined && propertyDescriptionPath) {
					const lastIndex = propertyDescriptionPath.lastIndexOf("/");
					const sideEffectPath = lastIndex > 0 ? propertyDescriptionPath.substring(0, lastIndex) : propertyDescriptionPath;
					const sideEffectsService = CommonUtils.getAppComponent(valueHelp as unknown as Control).getSideEffectsService();
					await sideEffectsService.requestSideEffects([sideEffectPath], bindingContext);
					Log.warning(
						`RequestSideEffects is triggered because the text annotation for ${valueHelpProperty} is not defined at the CollectionPath of the value help`
					);
					return undefined;
				} else {
					Log.error(`Text Annotation for ${valueHelpProperty} is not defined`);
					return undefined;
				}
			} catch (error) {
				const status = error ? (error as XMLHttpRequest).status : undefined;
				const message = error instanceof Error ? error.message : String(error);
				const msg = status === 404 ? `Metadata not found (${status}) for value help of property ${propertyPath}` : message;
				Log.error(msg);
			}
		}
		return undefined;
	}
});
