import type { EntitySet, Property } from "@sap-ux/vocabularies-types";
import type {
	DataField,
	DataFieldForAction,
	DataFieldForAnnotation,
	DataFieldForIntentBasedNavigation,
	DataFieldTypes,
	DataFieldWithNavigationPath,
	DataFieldWithUrl,
	DataPoint
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type AppComponent from "sap/fe/core/AppComponent";
import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAttribute, blockEvent, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import { CollaborationFieldGroupPrefix } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import * as CollaborationFormatters from "sap/fe/core/formatters/CollaborationFormatter";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression, PathInModelExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	fn,
	formatResult,
	formatWithTypeInformation,
	getExpressionFromAnnotation,
	ifElse,
	not,
	pathInModel,
	wrapBindingExpression
} from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf, StrictPropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import {
	getRequiredPropertiesFromInsertRestrictions,
	getRequiredPropertiesFromUpdateRestrictions
} from "sap/fe/core/helpers/MetaModelFunction";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getTitleBindingExpression } from "sap/fe/core/helpers/TitleHelper";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { getContextRelativeTargetObjectPath, getRelativePaths, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { isSemanticKey } from "sap/fe/core/templating/PropertyHelper";
import type { DisplayMode } from "sap/fe/core/templating/UIFormatters";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import SituationsIndicatorBlock from "sap/fe/macros/situations/SituationsIndicator.block";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import getFieldStructureTemplate from "./field/FieldStructure";
import additionalValueFormatter from "./valuehelp/AdditionalValueFormatter";

export type DisplayStyle =
	| "Text"
	| "Avatar"
	| "File"
	| "DataPoint"
	| "Contact"
	| "Button"
	| "Link"
	| "ObjectStatus"
	| "AmountWithCurrency"
	| "SemanticKeyWithDraftIndicator"
	| "ObjectIdentifier"
	| "LabelSemanticKey"
	| "LinkWithQuickView"
	| "ExpandableText";

type EditStyle =
	| "InputWithValueHelp"
	| "TextArea"
	| "File"
	| "DatePicker"
	| "TimePicker"
	| "DateTimePicker"
	| "CheckBox"
	| "InputWithUnit"
	| "Input"
	| "RatingIndicator";

type FieldFormatOptions = Partial<{
	displayMode: DisplayMode;
	fieldMode: string;
	hasDraftIndicator: boolean; // TODO is this used?
	isAnalytics: boolean;
	/** If true and if the field is part of an inactive row, then a check will be done to determine if the underlying property has a non-insertable restriction */
	forInlineCreationRows: boolean;
	/** If true then the navigationavailable property will not be used for the enablement of the IBN button */
	ignoreNavigationAvailable: boolean;
	isCurrencyAligned: boolean;
	measureDisplayMode: string;
	/** Enables the fallback feature for the usage of the text annotation from the value lists */
	retrieveTextFromValueList: boolean;
	semantickeys: string[];
	/** Preferred control to visualize semantic key properties */
	semanticKeyStyle: string;
	/** If set to 'true', SAP Fiori elements shows an empty indicator in display mode for the text and links */
	showEmptyIndicator: boolean;
	/** If true then sets the given icon instead of text in Action/IBN Button */
	showIconUrl: boolean;
	/** Describe how the alignment works between Table mode (Date and Numeric End alignment) and Form mode (numeric aligned End in edit and Begin in display) */
	textAlignMode: string;
	/** Maximum number of lines for multiline texts in edit mode */
	textLinesEdit: string | number;
	/** Maximum number of lines that multiline texts in edit mode can grow to */
	textMaxLines: string;
	compactSemanticKey: string;
	fieldGroupDraftIndicatorPropertyPath: string;
	fieldGroupName: string;
	textMaxLength: number;
	/** Maximum number of characters from the beginning of the text field that are shown initially. */
	textMaxCharactersDisplay: number;
	/** Defines how the full text will be displayed - InPlace or Popover */
	textExpandBehaviorDisplay: string;
	dateFormatOptions?: UIFormatters.dateFormatOptions; // showTime here is used for text formatting only
}>;

export type FieldProperties = StrictPropertiesOf<InternalFieldBlock>;

/**
 * Building block for creating a Field based on the metadata provided by OData V4.
 * <br>
 * Usually, a DataField annotation is expected
 *
 * Usage example:
 * <pre>
 * <internalMacro:Field
 *   idPrefix="SomePrefix"
 *   contextPath="{entitySet>}"
 *   metaPath="{dataField>}"
 * />
 * </pre>
 *
 * @hideconstructor
 * @private
 * @experimental
 * @since 1.94.0
 */
@defineBuildingBlock({
	name: "Field",
	namespace: "sap.fe.macros.internal",
	designtime: "sap/fe/macros/internal/Field.designtime"
})
export default class InternalFieldBlock extends BuildingBlockBase {
	@blockAttribute({
		type: "string"
	})
	public dataSourcePath?: string;

	@blockAttribute({
		type: "string"
	})
	public emptyIndicatorMode?: string;

	@blockAttribute({
		type: "string"
	})
	public _flexId?: string;

	@blockAttribute({
		type: "string"
	})
	public idPrefix?: string;

	@blockAttribute({
		type: "string"
	})
	public _apiId?: string;

	@blockAttribute({
		type: "string"
	})
	public noWrapperId?: string;

	@blockAttribute({
		type: "string"
	})
	public vhIdPrefix = "FieldValueHelp";

	/**
	 * Metadata path to the entity set
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
	})
	public entitySet!: Context;

	/**
	 * Flag indicating whether action will navigate after execution
	 */
	@blockAttribute({
		type: "boolean"
	})
	public navigateAfterAction = true;

	/**
	 * Metadata path to the dataField.
	 * This property is usually a metadataContext pointing to a DataField having
	 * $Type of DataField, DataFieldWithUrl, DataFieldForAnnotation, DataFieldForAction, DataFieldForIntentBasedNavigation, DataFieldWithNavigationPath, or DataPointType.
	 * But it can also be a Property with $kind="Property"
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		expectedTypes: ["Property"],
		expectedAnnotationTypes: [
			"com.sap.vocabularies.UI.v1.DataField",
			"com.sap.vocabularies.UI.v1.DataFieldWithUrl",
			"com.sap.vocabularies.UI.v1.DataFieldForAnnotation",
			"com.sap.vocabularies.UI.v1.DataFieldForAction",
			"com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation",
			"com.sap.vocabularies.UI.v1.DataFieldWithAction",
			"com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation",
			"com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath",
			"com.sap.vocabularies.UI.v1.DataPointType"
		]
	})
	public dataField!: Context;

	/**
	 * Edit Mode of the field.
	 *
	 * If the editMode is undefined then we compute it based on the metadata
	 * Otherwise we use the value provided here.
	 */
	@blockAttribute({
		type: "sap.ui.mdc.enums.EditMode"
	})
	public editMode?: FieldEditMode | CompiledBindingToolkitExpression;

	/**
	 * Wrap field
	 */
	@blockAttribute({
		type: "boolean"
	})
	public wrap?: boolean;

	/**
	 * CSS class for margin
	 */
	@blockAttribute({
		type: "string"
	})
	public class?: string;

	/**
	 * Property added to associate the label with the Field
	 */
	@blockAttribute({
		type: "string"
	})
	public ariaLabelledBy?: string;

	@blockAttribute({
		type: "sap.ui.core.TextAlign"
	})
	public textAlign?: string;

	/**
	 * Option to add a semantic object to a field
	 */
	@blockAttribute({
		type: "string",
		required: false
	})
	public semanticObject?: string;

	@blockAttribute({
		type: "string"
	})
	public requiredExpression?: string;

	@blockAttribute({
		type: "boolean"
	})
	public visible?: boolean | CompiledBindingToolkitExpression;

	@blockAttribute({ type: "boolean" })
	showErrorObjectStatus?: boolean | CompiledBindingToolkitExpression;

	@blockAttribute({
		type: "object",
		validate: function (formatOptionsInput: FieldFormatOptions) {
			if (formatOptionsInput.textAlignMode && !["Table", "Form"].includes(formatOptionsInput.textAlignMode)) {
				throw new Error(`Allowed value ${formatOptionsInput.textAlignMode} for textAlignMode does not match`);
			}

			if (
				formatOptionsInput.displayMode &&
				!["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput.displayMode)
			) {
				throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
			}

			if (formatOptionsInput.fieldMode && !["nowrapper", ""].includes(formatOptionsInput.fieldMode)) {
				throw new Error(`Allowed value ${formatOptionsInput.fieldMode} for fieldMode does not match`);
			}

			if (formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput.measureDisplayMode)) {
				throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
			}

			if (
				formatOptionsInput.textExpandBehaviorDisplay &&
				!["InPlace", "Popover"].includes(formatOptionsInput.textExpandBehaviorDisplay)
			) {
				throw new Error(
					`Allowed value ${formatOptionsInput.textExpandBehaviorDisplay} for textExpandBehaviorDisplay does not match`
				);
			}

			if (formatOptionsInput.semanticKeyStyle && !["ObjectIdentifier", "Label", ""].includes(formatOptionsInput.semanticKeyStyle)) {
				throw new Error(`Allowed value ${formatOptionsInput.semanticKeyStyle} for semanticKeyStyle does not match`);
			}

			if (typeof formatOptionsInput.isAnalytics === "string") {
				formatOptionsInput.isAnalytics = formatOptionsInput.isAnalytics === "true";
			}

			if (typeof formatOptionsInput.forInlineCreationRows === "string") {
				formatOptionsInput.forInlineCreationRows = formatOptionsInput.forInlineCreationRows === "true";
			}

			if (typeof formatOptionsInput.hasDraftIndicator === "string") {
				formatOptionsInput.hasDraftIndicator = formatOptionsInput.hasDraftIndicator === "true";
			}

			/*
			Historical default values are currently disabled
			if (!formatOptionsInput.semanticKeyStyle) {
				formatOptionsInput.semanticKeyStyle = "";
			}
			*/

			return formatOptionsInput;
		}
	})
	public formatOptions: FieldFormatOptions = {};

	/**
	 * Metadata path to the entity set.
	 * This is used in inner fragments, so we need to declare it as block attribute context.
	 */
	@blockAttribute({
		type: "sap.ui.model.Context"
	})
	entityType?: Context;

	/**
	 * This is used in inner fragments, so we need to declare it as block attribute.
	 */
	@blockAttribute({
		type: "boolean"
	})
	collaborationEnabled?: boolean;

	/**
	 * This is used in inner fragments, so we need to declare it as block attribute.
	 */
	@blockAttribute({
		type: "string"
	})
	_vhFlexId?: string;

	/**
	 * This is used to set valueState on the field
	 */
	@blockAttribute({
		type: "string"
	})
	valueState?: CompiledBindingToolkitExpression;

	/**
	 * Event handler for change event
	 */
	@blockEvent()
	onChange?: string;

	/**
	 * Event handler for live change event
	 */
	@blockEvent()
	onLiveChange?: string;

	// Computed properties

	dataModelPath!: DataModelObjectPath;

	convertedDataField!: DataFieldTypes | DataFieldForAction | DataFieldForIntentBasedNavigation;

	property!: Property;

	metaModel!: ODataMetaModel;

	propertyForFieldControl!: UIFormatters.PropertyOrPath<Property>;

	editableExpression: string | CompiledBindingToolkitExpression;

	enabledExpression: string | CompiledBindingToolkitExpression;

	collaborationExpression!: BindingToolkitExpression<boolean>;

	liveChangeEnabled?: boolean;

	descriptionBindingExpression?: string;

	displayVisible?: string | boolean;

	editModeAsObject?: any;

	editStyle?: EditStyle | null;

	hasQuickView = false;

	showTimezone?: boolean;

	text?: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;

	identifierTitle?: CompiledBindingToolkitExpression;

	identifierText?: CompiledBindingToolkitExpression;

	textBindingExpression?: CompiledBindingToolkitExpression;

	unitBindingExpression?: string;

	valueBindingExpression?: CompiledBindingToolkitExpression;

	valueAsStringBindingExpression?: CompiledBindingToolkitExpression;

	displayStyle?: DisplayStyle;

	hasSituationsIndicator?: boolean;

	fieldGroupIds?: string;

	/* Display style common properties start */
	hasUnitOrCurrency?: boolean = undefined;

	hasValidAnalyticalCurrencyOrUnit?: CompiledBindingToolkitExpression = undefined;

	textFromValueList?: CompiledBindingToolkitExpression = undefined;
	/* AmountWith currency fragment end */

	/* Edit style common properties start */
	editStyleId?: string = undefined;

	/* Property path used for LOCK/UNLOCK collaboration messages */
	mainPropertyRelativePath?: string;

	/**
	 * This is used in inner fragments, so we need to declare it as block attribute.
	 */
	@blockAttribute({
		type: "string"
	})
	editStylePlaceholder?: string;
	/* Edit style common properties end */

	/* Rating Indicator properties start */
	ratingIndicatorTooltip?: CompiledBindingToolkitExpression = undefined;

	ratingIndicatorTargetValue?: CompiledBindingToolkitExpression = undefined;
	/* Rating Indicator properties end */

	/* InputWithUnit start */
	unitEditable?: string;

	staticUnit?: string;

	valueInputWidth?: string;

	valueInputFieldWidth?: string;

	unitInputVisible?: CompiledBindingToolkitExpression;

	/* InputWithUnit end */

	/*ObjectIdentifier start */
	showErrorIndicator = false;

	situationsIndicatorPropertyPath = "";
	/* ObjectIdentifier end */

	/*SemanticKeyWithDraftIndicator start*/
	draftIndicatorVisible?: string;
	/*SemanticKeyWithDraftIndicator end*/

	hasPropertyInsertRestrictions = false;

	getOverrides(controlConfiguration: TemplateProcessorSettings, id: string): FieldProperties {
		/*
			Qualms: We need to use this TemplateProcessorSettings type to be able to iterate
			over the properties later on and cast it afterwards as a field property type
		*/
		const props = {} as TemplateProcessorSettings;

		if (controlConfiguration) {
			const controlConfig = controlConfiguration[id] as TemplateProcessorSettings;
			if (controlConfig) {
				Object.keys(controlConfig).forEach(function (configKey) {
					props[configKey] = controlConfig[configKey];
				});
			}
		}
		return props as unknown as FieldProperties;
	}

	getObjectIdentifierText(
		fieldFormatOptions: FieldFormatOptions,
		propertyDataModelObjectPath: DataModelObjectPath
	): CompiledBindingToolkitExpression {
		let propertyBindingExpression: BindingToolkitExpression<string> = pathInModel(
			getContextRelativeTargetObjectPath(propertyDataModelObjectPath)
		);
		const targetDisplayMode = fieldFormatOptions?.displayMode;
		const propertyDefinition =
			propertyDataModelObjectPath.targetObject.type === "PropertyPath"
				? (propertyDataModelObjectPath.targetObject.$target as Property)
				: (propertyDataModelObjectPath.targetObject as Property);

		const commonText = propertyDefinition.annotations?.Common?.Text;
		if (commonText === undefined) {
			return undefined;
		}
		propertyBindingExpression = formatWithTypeInformation(propertyDefinition, propertyBindingExpression);

		switch (targetDisplayMode) {
			case "ValueDescription":
				const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
				return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
			case "DescriptionValue":
				return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
			default:
				return undefined;
		}
	}

	setUpDataPointType(dataField: DataFieldTypes | DataFieldForIntentBasedNavigation | DataFieldForAction): void {
		// data point annotations need not have $Type defined, so add it if missing
		if ((dataField as unknown as DataPoint)?.term === "com.sap.vocabularies.UI.v1.DataPoint") {
			dataField.$Type = dataField.$Type || UIAnnotationTypes.DataPointType;
		}
	}

	setUpVisibleProperties(internalField: InternalFieldBlock): void {
		// we do this before enhancing the dataModelPath so that it still points at the DataField
		const propertyDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(
			internalField.dataField,
			internalField.entitySet
		);
		internalField.visible = FieldTemplating.getVisibleExpression(propertyDataModelObjectPath, internalField.formatOptions);
		internalField.displayVisible = internalField.formatOptions.fieldMode === "nowrapper" ? internalField.visible : undefined;
	}

	getContentId(macroId: string): string {
		return `${macroId}-content`;
	}

	setUpFormatOptions(
		internalField: InternalFieldBlock,
		dataModelPath: DataModelObjectPath,
		controlConfiguration: TemplateProcessorSettings,
		settings: TemplateProcessorSettings
	): void {
		const overrideProps = this.getOverrides(controlConfiguration, internalField.dataField.getPath());

		if (!internalField.formatOptions.displayMode) {
			internalField.formatOptions.displayMode = UIFormatters.getDisplayMode(dataModelPath);
		}
		if(internalField.formatOptions.displayMode ==="Description") {
			internalField.valueAsStringBindingExpression = FieldTemplating.getValueBinding(
				dataModelPath,
				internalField.formatOptions,
				true,
				true,
				undefined,
				true
			);
		}
		internalField.formatOptions.textLinesEdit =
			((overrideProps as unknown as FieldFormatOptions).textLinesEdit as string) ||
			(overrideProps.formatOptions && overrideProps.formatOptions.textLinesEdit) ||
			internalField.formatOptions.textLinesEdit ||
			4;
		internalField.formatOptions.textMaxLines =
			(overrideProps as unknown as FieldFormatOptions).textMaxLines ||
			(overrideProps.formatOptions && overrideProps.formatOptions.textMaxLines) ||
			internalField.formatOptions.textMaxLines;

		// Retrieve text from value list as fallback feature for missing text annotation on the property
		if (settings.models.viewData?.getProperty("/retrieveTextFromValueList")) {
			internalField.formatOptions.retrieveTextFromValueList = FieldTemplating.isRetrieveTextFromValueListEnabled(
				dataModelPath.targetObject,
				internalField.formatOptions
			);
			if (internalField.formatOptions.retrieveTextFromValueList) {
				// Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
				const hasEntityTextArrangement = !!dataModelPath?.targetEntityType?.annotations?.UI?.TextArrangement;
				internalField.formatOptions.displayMode = hasEntityTextArrangement
					? internalField.formatOptions.displayMode
					: "DescriptionValue";
			}
		}
		if (internalField.formatOptions.fieldMode === "nowrapper" && internalField.editMode === "Display") {
			if (internalField._flexId) {
				internalField.noWrapperId = internalField._flexId;
			} else {
				internalField.noWrapperId = internalField.idPrefix ? generate([internalField.idPrefix, "Field-content"]) : undefined;
			}
		}
	}

	setUpDisplayStyle(
		internalField: InternalFieldBlock,
		dataField: DataFieldTypes | DataFieldForIntentBasedNavigation | DataFieldForAction,
		dataModelPath: DataModelObjectPath
	): void {
		const property: Property = dataModelPath.targetObject as Property;
		if (!dataModelPath.targetObject) {
			internalField.displayStyle = "Text";
			return;
		}

		internalField.hasUnitOrCurrency =
			property.annotations?.Measures?.Unit !== undefined || property.annotations?.Measures?.ISOCurrency !== undefined;
		internalField.hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit(dataModelPath);
		internalField.textFromValueList = wrapBindingExpression(
			compileExpression(
				fn("FieldRuntime.retrieveTextFromValueList", [
					pathInModel(getContextRelativeTargetObjectPath(dataModelPath)),
					`/${property.fullyQualifiedName}`,
					internalField.formatOptions.displayMode
				])
			) as string,
			false
		);

		if (property.type === "Edm.Stream") {
			internalField.displayStyle = "File";
			return;
		}
		if (property.annotations?.UI?.IsImageURL) {
			internalField.displayStyle = "Avatar";
			return;
		}

		switch (dataField.$Type as string) {
			case UIAnnotationTypes.DataPointType:
				internalField.displayStyle = "DataPoint";
				return;
			case UIAnnotationTypes.DataFieldForAnnotation:
				if ((dataField as unknown as DataFieldForAnnotation).Target?.$target?.$Type === UIAnnotationTypes.DataPointType) {
					internalField.displayStyle = "DataPoint";
					return;
				} else if (
					(dataField as unknown as DataFieldForAnnotation).Target?.$target?.$Type ===
					"com.sap.vocabularies.Communication.v1.ContactType"
				) {
					internalField.displayStyle = "Contact";
					return;
				}
				break;
			case UIAnnotationTypes.DataFieldForAction:
			case UIAnnotationTypes.DataFieldForIntentBasedNavigation:
				internalField.displayStyle = "Button";
				return;
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
			case UIAnnotationTypes.DataFieldWithNavigationPath:
			case UIAnnotationTypes.DataFieldWithAction:
				internalField.displayStyle = "Link";
				return;
		}
		const hasQuickView = FieldTemplating.isUsedInNavigationWithQuickViewFacets(dataModelPath, property);
		const hasSemanticObjects =
			!!FieldTemplating.getPropertyWithSemanticObject(dataModelPath) ||
			(internalField.semanticObject !== undefined && internalField.semanticObject !== "");
		if (isSemanticKey(property, dataModelPath) && internalField.formatOptions.semanticKeyStyle) {
			internalField.hasQuickView = hasQuickView || hasSemanticObjects;
			internalField.hasSituationsIndicator =
				SituationsIndicatorBlock.getSituationsNavigationProperty(dataModelPath.targetEntityType) !== undefined;
			this.setUpObjectIdentifierTitleAndText(internalField, dataModelPath);
			if (
				(dataModelPath.contextLocation?.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftRoot &&
				(dataModelPath.targetEntitySet as EntitySet | undefined)?.annotations?.Common?.DraftRoot &&
				internalField.formatOptions.hasDraftIndicator !== false
			) {
				// In case of a grid table or tree table hasDraftIndicator will be false since the draft
				// indicator needs to be rendered into a separate column
				// Hence we then fall back to display styles ObjectIdentifier or LabelSemanticKey instead
				// of the combined ID and draft indicator style
				internalField.draftIndicatorVisible = FieldTemplating.getDraftIndicatorVisibleBinding(
					dataModelPath.targetObject.name
				) as string;
				internalField.displayStyle = "SemanticKeyWithDraftIndicator";
				return;
			}
			internalField.showErrorIndicator =
				dataModelPath.contextLocation?.targetObject._type === "NavigationProperty" &&
				!internalField.formatOptions.fieldGroupDraftIndicatorPropertyPath;
			internalField.situationsIndicatorPropertyPath = dataModelPath.targetObject.name;

			internalField.displayStyle =
				internalField.formatOptions.semanticKeyStyle === "ObjectIdentifier" ? "ObjectIdentifier" : "LabelSemanticKey";
			return;
		}
		if (dataField.Criticality) {
			internalField.hasQuickView = hasQuickView || hasSemanticObjects;
			internalField.displayStyle = "ObjectStatus";
			return;
		}
		if (
			property.annotations?.Measures?.ISOCurrency &&
			String(internalField.formatOptions.isCurrencyAligned) === "true" &&
			internalField.formatOptions.measureDisplayMode !== "Hidden"
		) {
			internalField.valueAsStringBindingExpression = FieldTemplating.getValueBinding(
				dataModelPath,
				internalField.formatOptions,
				true,
				true,
				undefined,
				true
			);
			internalField.unitBindingExpression = compileExpression(UIFormatters.getBindingForUnitOrCurrency(dataModelPath));
			internalField.displayStyle = "AmountWithCurrency";

			return;
		}
		if (property.annotations?.Communication?.IsEmailAddress || property.annotations?.Communication?.IsPhoneNumber) {
			internalField.displayStyle = "Link";
			return;
		}
		if (property.annotations?.UI?.MultiLineText) {
			internalField.displayStyle = "ExpandableText";
			return;
		}

		if (hasQuickView || hasSemanticObjects) {
			internalField.hasQuickView = true;
			internalField.displayStyle = "LinkWithQuickView";
			return;
		}

		if (dataField.$Type === UIAnnotationTypes.DataFieldWithUrl) {
			internalField.displayStyle = "Link";
			return;
		}

		internalField.displayStyle = "Text";
	}

	setUpEditStyle(appComponent?: AppComponent): void {
		if (this.idPrefix) {
			this.editStyleId = generate([this.idPrefix, "Field-edit"]);
		}
		FieldTemplating.setEditStyleProperties(this, this.convertedDataField, this.dataModelPath);
		this.computeFieldGroupIds(appComponent);
	}

	/**
	 * Calculate the fieldGroupIds for an Input or other edit control.
	 *
	 * @param dataModelObjectPath
	 * @param appComponent
	 */
	computeFieldGroupIds(appComponent?: AppComponent): void {
		const typesForCollaborationFocusManagement = [
			"InputWithValueHelp",
			"TextArea",
			"DatePicker",
			"TimePicker",
			"DateTimePicker",
			"InputWithUnit",
			"Input"
		];

		if (!appComponent) {
			//for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
			return;
		}
		const sideEffectService = appComponent.getSideEffectsService();
		const fieldGroupIds = sideEffectService.computeFieldGroupIds(
			this.dataModelPath.targetEntityType?.fullyQualifiedName ?? "",
			this.dataModelPath.targetObject?.fullyQualifiedName ?? ""
		);

		if (this.collaborationEnabled && typesForCollaborationFocusManagement.includes(this.editStyle || "")) {
			const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${this.dataSourcePath}`;
			fieldGroupIds.push(collaborationFieldGroup);
			this.mainPropertyRelativePath = isProperty(this.dataModelPath.targetObject)
				? getContextRelativeTargetObjectPath(this.dataModelPath)
				: undefined;
		}

		this.fieldGroupIds = fieldGroupIds.length ? fieldGroupIds.join(",") : undefined;
	}

	setUpObjectIdentifierTitleAndText(internalField: InternalFieldBlock, propertyDataModelObjectPath: DataModelObjectPath): void {
		const semanticStyle = internalField.formatOptions?.semanticKeyStyle;
		const displayMode = internalField.formatOptions.displayMode;
		internalField.identifierTitle = getTitleBindingExpression(
			propertyDataModelObjectPath,
			FieldTemplating.getTextBindingExpression,
			{ displayMode, splitTitleOnTwoLines: true },
			undefined,
			undefined
		);
		internalField.identifierText =
			semanticStyle === "ObjectIdentifier"
				? this.getObjectIdentifierText(internalField.formatOptions, propertyDataModelObjectPath)
				: undefined;
	}

	setUpValueState(internalField: InternalFieldBlock): void {
		let valueStateExp;
		const fieldContainerType = internalField.formatOptions.textAlignMode;
		const propertyPathInModel = pathInModel(
			getContextRelativeTargetObjectPath(internalField.dataModelPath)
		) as PathInModelExpression<Property>;
		const textPath = getExpressionFromAnnotation(internalField.dataModelPath?.targetObject?.annotations?.Common?.Text);
		if (fieldContainerType === "Table") {
			valueStateExp = formatResult(
				[
					pathInModel(`/recommendationsData`, "internal"),
					pathInModel(`/isEditable`, "ui"),
					internalField.dataSourcePath,
					propertyPathInModel,
					textPath as BindingToolkitExpression<string>
				],
				additionalValueFormatter.formatValueState,
				internalField.dataModelPath.targetEntityType
			);
		} else {
			valueStateExp = formatResult(
				[
					pathInModel(`/recommendationsData`, "internal"),
					pathInModel(`/isEditable`, "ui"),
					internalField.dataSourcePath,
					propertyPathInModel,
					textPath as BindingToolkitExpression<string>
				],
				additionalValueFormatter.formatValueState
			);
		}

		internalField.valueState = compileExpression(valueStateExp);
	}

	setInputWithValuehelpPlaceholder(internalField: InternalFieldBlock): void {
		let targetEntityType;
		const editStylePlaceholder = internalField.editStylePlaceholder;
		const fieldContainerType = internalField.formatOptions.textAlignMode;
		if (fieldContainerType === "Table") {
			targetEntityType = internalField.dataModelPath.targetEntityType;
		}
		const placeholderExp = formatResult(
			[
				pathInModel(`/recommendationsData`, "internal"),
				pathInModel(`/currentCtxt`, "internal"),
				pathInModel(`${internalField.dataModelPath.targetObject.name}@$ui5.fe.messageType`),
				editStylePlaceholder,
				internalField.formatOptions.displayMode
			],
			additionalValueFormatter.formatPlaceholder,
			targetEntityType
		);
		internalField.editStylePlaceholder = compileExpression(placeholderExp);
	}

	constructor(
		props: PropertiesOf<InternalFieldBlock>,
		controlConfiguration: TemplateProcessorSettings,
		settings: TemplateProcessorSettings
	) {
		super(props);
		this.computeCommonProperties(this, settings);
		this.setUpDataPointType(this.convertedDataField);
		this.setUpVisibleProperties(this);

		if (this._flexId) {
			this._apiId = this._flexId;
			this._flexId = this.getContentId(this._flexId);
			this._vhFlexId = `${this._flexId}_${this.vhIdPrefix}`;
		}
		this.dataSourcePath = getTargetObjectPath(this.dataModelPath);
		this.entityType = this.metaModel.createBindingContext(`/${this.dataModelPath.targetEntityType.fullyQualifiedName}`);
		if (this.formatOptions?.forInlineCreationRows === true) {
			this.hasPropertyInsertRestrictions = FieldTemplating.hasPropertyInsertRestrictions(this.dataModelPath);
		}
		this.computeEditMode(this);

		this.computeCollaborationProperties(this);
		this.computeEditableExpressions(this);

		this.setUpFormatOptions(this, this.dataModelPath, controlConfiguration, settings);
		this.setUpDisplayStyle(this, this.convertedDataField, this.dataModelPath);
		this.setUpEditStyle(settings.appComponent);
		this.setUpValueState(this);
		if (this.editStyle === "InputWithValueHelp") {
			this.setInputWithValuehelpPlaceholder(this);
		}

		// ---------------------------------------- compute bindings----------------------------------------------------
		const aDisplayStylesWithoutPropText = ["Avatar", "AmountWithCurrency"];
		if (this.displayStyle && !aDisplayStylesWithoutPropText.includes(this.displayStyle) && this.dataModelPath.targetObject) {
			this.text = this.text ?? FieldTemplating.getTextBinding(this.dataModelPath, this.formatOptions);
		} else {
			this.text = "";
		}

		this.emptyIndicatorMode = this.formatOptions.showEmptyIndicator ? "On" : undefined;

		// If the target is a property with a DataFieldDefault, use this as data field
		if (isProperty(this.convertedDataField) && this.convertedDataField.annotations?.UI?.DataFieldDefault !== undefined) {
			this.dataField = this.metaModel.createBindingContext(`@${UIAnnotationTerms.DataFieldDefault}`, this.dataField);
		}
	}

	/**
	 * This helper sets the common properties convertedDataField, dataModelPath
	 * and property that can be reused in the individual templates if required.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @param settings
	 */
	computeCommonProperties(internalField: InternalFieldBlock, settings: TemplateProcessorSettings): void {
		const convertedDataField = MetaModelConverter.convertMetaModelContext(internalField.dataField) as
			| DataField
			| DataFieldForAction
			| DataFieldForIntentBasedNavigation
			| DataFieldWithUrl
			| DataFieldWithNavigationPath;
		let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);

		dataModelPath = FieldTemplating.getDataModelObjectPathForValue(dataModelPath) || dataModelPath;

		const property: Property = dataModelPath.targetObject as Property;

		this.convertedDataField = convertedDataField;
		this.dataModelPath = dataModelPath;
		this.property = property;
		this.metaModel = settings.models.metaModel || settings.models.entitySet;

		this.propertyForFieldControl = this.dataModelPath?.targetObject?.Value
			? this.dataModelPath.targetObject.Value
			: this.dataModelPath?.targetObject;
	}

	computeEditMode(internalField: InternalFieldBlock): void {
		if (internalField.editMode !== undefined && internalField.editMode !== null) {
			// Even if it provided as a string it's a valid part of a binding expression that can be later combined into something else.
			internalField.editModeAsObject = internalField.editMode;
		} else {
			const measureReadOnly = internalField.formatOptions.measureDisplayMode
				? internalField.formatOptions.measureDisplayMode === "ReadOnly"
				: false;

			internalField.editModeAsObject = UIFormatters.getEditMode(
				internalField.propertyForFieldControl,
				internalField.dataModelPath,
				measureReadOnly,
				true,
				internalField.convertedDataField
			);
			internalField.editMode = compileExpression(
				ifElse(
					and(pathInModel("@$ui5.context.isInactive"), internalField.hasPropertyInsertRestrictions),
					"Display",
					internalField.editModeAsObject
				)
			);
		}
	}

	/**
	 * This helper computes the properties that are needed for the collaboration avatar.
	 *
	 * @param internalField Reference to the current internal field instance
	 */
	computeCollaborationProperties(internalField: InternalFieldBlock): void {
		const editableExpression = UIFormatters.getEditableExpressionAsObject(
			internalField.propertyForFieldControl,
			internalField.convertedDataField,
			internalField.dataModelPath
		);
		if (ModelHelper.isCollaborationDraftSupported(internalField.metaModel) && internalField.editMode !== FieldEditMode.Display) {
			internalField.collaborationEnabled = true;
			// Expressions needed for Collaboration Visualization
			internalField.collaborationExpression = UIFormatters.getCollaborationExpression(
				internalField.dataModelPath,
				CollaborationFormatters.hasCollaborationActivity
			);
			internalField.editableExpression = compileExpression(and(editableExpression, not(internalField.collaborationExpression)));

			internalField.editMode = compileExpression(
				ifElse(
					internalField.collaborationExpression,
					constant("ReadOnly"),
					ifElse(
						and(pathInModel("@$ui5.context.isInactive"), internalField.hasPropertyInsertRestrictions),
						"Display",
						internalField.editModeAsObject
					)
				)
			);
		} else {
			internalField.editableExpression = compileExpression(editableExpression);
		}
	}

	/**
	 * Helper to computes some of the expression for further processing.
	 *
	 * @param internalField Reference to the current internal field instance
	 */
	computeEditableExpressions(internalField: InternalFieldBlock): void {
		const requiredPropertiesFromInsertRestrictions = getRequiredPropertiesFromInsertRestrictions(
			internalField.entitySet?.getPath().replaceAll("/$NavigationPropertyBinding/", "/"),
			internalField.metaModel
		);
		const requiredPropertiesFromUpdateRestrictions = getRequiredPropertiesFromUpdateRestrictions(
			internalField.entitySet?.getPath().replaceAll("/$NavigationPropertyBinding/", "/"),
			internalField.metaModel
		);
		const oRequiredProperties = {
			requiredPropertiesFromInsertRestrictions: requiredPropertiesFromInsertRestrictions,
			requiredPropertiesFromUpdateRestrictions: requiredPropertiesFromUpdateRestrictions
		};

		internalField.liveChangeEnabled = !!internalField.onLiveChange;
		internalField.enabledExpression = UIFormatters.getEnabledExpression(
			internalField.propertyForFieldControl,
			internalField.convertedDataField,
			false,
			internalField.dataModelPath
		) as CompiledBindingToolkitExpression;
		internalField.requiredExpression = UIFormatters.getRequiredExpression(
			internalField.propertyForFieldControl,
			internalField.convertedDataField,
			false,
			false,
			oRequiredProperties,
			internalField.dataModelPath
		) as CompiledBindingToolkitExpression;
	}

	/**
	 * The building block template function.
	 *
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplate() {
		return getFieldStructureTemplate(this);
	}
}
