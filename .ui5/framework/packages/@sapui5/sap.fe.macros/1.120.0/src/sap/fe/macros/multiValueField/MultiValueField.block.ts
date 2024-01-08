import type { Property } from "@sap-ux/vocabularies-types";
import type { PathAnnotationExpression, PropertyPath } from "@sap-ux/vocabularies-types/Edm";
import type { DataField } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type AppComponent from "sap/fe/core/AppComponent";
import BuildingBlockBase from "sap/fe/core/buildingBlocks/BuildingBlockBase";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	getExpressionFromAnnotation,
	ifElse,
	isConstant,
	not,
	or
} from "sap/fe/core/helpers/BindingToolkit";
import type { PropertiesOf } from "sap/fe/core/helpers/ClassSupport";
import * as ID from "sap/fe/core/helpers/StableIdHelper";
import { isMultipleNavigationProperty, isProperty, isPropertyPathExpression } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import {
	enhanceDataModelPath,
	getContextRelativeTargetObjectPath,
	getRelativePaths,
	isPathDeletable,
	isPathInsertable
} from "sap/fe/core/templating/DataModelPathHelper";
import * as PropertyFormatters from "sap/fe/core/templating/PropertyFormatters";
import type { DisplayMode, MetaModelContext } from "sap/fe/core/templating/UIFormatters";
import { getDisplayMode } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { getValueBinding, getVisibleExpression } from "sap/fe/macros/field/FieldTemplating";
import * as ValueHelpTemplating from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";
import type FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/odata/v4/Context";

type MultiInputSettings = {
	description: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
	collectionBindingDisplay: CompiledBindingToolkitExpression;
	collectionBindingEdit: CompiledBindingToolkitExpression;
	key: BindingToolkitExpression<string> | CompiledBindingToolkitExpression;
};

export type MultiValueFieldFormatOptions = Partial<{
	showEmptyIndicator?: boolean;
	displayOnly?: boolean | string;
	displayMode?: string;
	measureDisplayMode?: string;
	isAnalytics?: boolean;
}>;

type MultiValueFieldPathStructure = {
	collectionPath: string;
	itemDataModelObjectPath: DataModelObjectPath;
};

/**
 * Building block for creating a MultiValueField based on the metadata provided by OData V4.
 * <br>
 * The MultiValueField can be used to display either a DataField or Property directly. It has to point to a collection property.
 * <br>
 * Usage example:
 * <pre>
 * &lt;macro:MultiValueField
 *   id="SomeUniqueIdentifier"
 *   contextPath="{entitySet&gt;}"
 *   metaPath="{dataField&gt;}"
 *  /&gt;
 * </pre>
 *
 * @alias sap.fe.macros.MultiValueField
 * @public
 * @since 1.118.0
 * @experimental
 */

@defineBuildingBlock({
	name: "MultiValueField",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros"
})
export default class MultiValueFieldBlock extends BuildingBlockBase {
	/**
	 * The 'id' property
	 */
	@blockAttribute({
		isPublic: true,
		type: "string"
	})
	public id?: string;

	/**
	 * Prefix added to the generated ID of the field - only if no id is provided
	 */
	@blockAttribute({
		type: "string"
	})
	idPrefix?: string;

	/**
	 * Prefix added to the generated ID of the value help used for the field
	 */
	@blockAttribute({
		type: "string"
	})
	private vhIdPrefix = "FieldValueHelp";

	/**
	 * Defines the relative Metadata path to the MultiValueField.
	 * The metaPath should point to a Property or DataField.
	 *
	 * @public
	 */
	@blockAttribute({
		isPublic: true,
		type: "sap.ui.model.Context",
		required: true,
		expectedTypes: ["Property"],
		expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.DataField"]
	})
	public metaPath!: Context;

	/**
	 * The readOnly flag
	 *
	 * @public
	 */
	@blockAttribute({ type: "boolean", isPublic: true, required: false })
	public readOnly?: boolean;

	/**
	 * The context path provided for the MultiValueField
	 *
	 * @public
	 */
	@blockAttribute({
		isPublic: true,
		required: true,
		type: "sap.ui.model.Context",
		expectedTypes: ["EntitySet", "NavigationProperty", "EntityType", "Singleton"]
	})
	public contextPath!: Context;

	/**
	 * Property added to associate the label with the MultiValueField
	 */
	@blockAttribute({
		type: "string"
	})
	private ariaLabelledBy?: string;

	/**
	 * The object with the formatting options
	 *
	 */
	@blockAttribute({
		type: "object",
		validate: function (formatOptionsInput: MultiValueFieldFormatOptions) {
			if (
				formatOptionsInput.displayMode &&
				!["Value", "Description", "ValueDescription", "DescriptionValue"].includes(formatOptionsInput.displayMode)
			) {
				throw new Error(`Allowed value ${formatOptionsInput.displayMode} for displayMode does not match`);
			}

			if (typeof formatOptionsInput.displayOnly === "string" && !["true", "false"].includes(formatOptionsInput.displayOnly)) {
				throw new Error(`Allowed value ${formatOptionsInput.displayOnly} for displayOnly does not match`);
			}

			if (formatOptionsInput.measureDisplayMode && !["Hidden", "ReadOnly"].includes(formatOptionsInput.measureDisplayMode)) {
				throw new Error(`Allowed value ${formatOptionsInput.measureDisplayMode} for measureDisplayMode does not match`);
			}
			return formatOptionsInput;
		}
	})
	formatOptions: MultiValueFieldFormatOptions = {};

	// Computed properties

	private item: MultiInputSettings;

	/**
	 * Pointed at dataField, can be DataFieldDefault from a property.
	 */
	private convertedDataField!: DataField;

	/**
	 * DataModelPath for the corresponding property displayed.
	 */
	private dataModelPath!: DataModelObjectPath;

	/**
	 * Property to be displayed
	 */
	private property!: Property;

	/**
	 * Edit Mode of the field.
	 * If the editMode is undefined then we compute it based on the metadata
	 * Otherwise we use the value provided here.
	 */
	private editMode!: FieldEditMode | CompiledBindingToolkitExpression;

	/**
	 * The display mode added to the collection field
	 */
	private displayMode!: DisplayMode;

	/**
	 * The CompiledBindingToolkitExpression that is calculated internally
	 */
	private collection!: CompiledBindingToolkitExpression;

	private visible: CompiledBindingToolkitExpression;

	private fieldGroupIds?: string;

	private enhancedMetaPath: Context;

	/**
	 * Function to get the correct settings for the multi input.
	 *
	 * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
	 * @param formatOptions The format options to calculate the result
	 * @returns MultiInputSettings
	 */
	private static _getMultiInputSettings(
		propertyDataModelObjectPath: DataModelObjectPath,
		formatOptions: MultiValueFieldFormatOptions
	): MultiInputSettings {
		const { collectionPath, itemDataModelObjectPath } = MultiValueFieldBlock._getPathStructure(propertyDataModelObjectPath);
		const collectionBindingDisplay = `{path:'${collectionPath}', templateShareable: false}`;
		const collectionBindingEdit = `{path:'${collectionPath}', templateShareable: false}`;

		const propertyPathOrProperty = propertyDataModelObjectPath.targetObject as PropertyPath | Property;
		const propertyDefinition = isPropertyPathExpression(propertyPathOrProperty)
			? propertyPathOrProperty.$target
			: propertyPathOrProperty;
		const commonText = propertyDefinition?.annotations.Common?.Text;
		const relativeLocation = getRelativePaths(propertyDataModelObjectPath);

		const textExpression = commonText
			? compileExpression(getExpressionFromAnnotation(commonText, relativeLocation))
			: getValueBinding(itemDataModelObjectPath, formatOptions, true);
		return {
			description: textExpression,
			collectionBindingDisplay: collectionBindingDisplay,
			collectionBindingEdit: collectionBindingEdit,
			key: getValueBinding(itemDataModelObjectPath, formatOptions, true)
		};
	}

	// Process the dataModelPath to find the collection and the relative DataModelPath for the item.
	private static _getPathStructure(dataModelObjectPath: DataModelObjectPath): MultiValueFieldPathStructure {
		let firstCollectionPath = "";
		const currentEntitySet = dataModelObjectPath.contextLocation?.targetEntitySet
			? dataModelObjectPath.contextLocation.targetEntitySet
			: dataModelObjectPath.startingEntitySet;
		const navigatedPaths: string[] = [];
		const contextNavsForItem = dataModelObjectPath.contextLocation?.navigationProperties || [];
		for (const navProp of dataModelObjectPath.navigationProperties) {
			if (
				dataModelObjectPath.contextLocation === undefined ||
				!dataModelObjectPath.contextLocation.navigationProperties.some(
					(contextNavProp) => contextNavProp.fullyQualifiedName === navProp.fullyQualifiedName
				)
			) {
				// in case of relative entitySetPath we don't consider navigationPath that are already in the context
				navigatedPaths.push(navProp.name);
				contextNavsForItem.push(navProp);
			}
			if (currentEntitySet.navigationPropertyBinding.hasOwnProperty(navProp.name)) {
				if (isMultipleNavigationProperty(navProp)) {
					break;
				}
			}
		}
		firstCollectionPath = `${navigatedPaths.join("/")}`;
		const itemDataModelObjectPath = Object.assign({}, dataModelObjectPath);
		if (itemDataModelObjectPath.contextLocation) {
			itemDataModelObjectPath.contextLocation.navigationProperties = contextNavsForItem; // this changes the creation of the valueHelp ID ...
		}

		return { collectionPath: firstCollectionPath, itemDataModelObjectPath: itemDataModelObjectPath };
	}

	/**
	 * Calculate the fieldGroupIds for the MultiValueField.
	 *
	 * @param appComponent
	 * @returns The value for the fieldGroupIds
	 */
	private computeFieldGroupIds(appComponent?: AppComponent): string | undefined {
		if (!appComponent) {
			//for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
			return "";
		}
		const sideEffectService = appComponent.getSideEffectsService();
		const fieldGroupIds = sideEffectService.computeFieldGroupIds(
			this.dataModelPath.targetEntityType.fullyQualifiedName,
			(this.dataModelPath.targetObject as Property).fullyQualifiedName
		);
		const result = fieldGroupIds.join(",");
		return result === "" ? undefined : result;
	}

	constructor(
		props: PropertiesOf<MultiValueFieldBlock>,
		controlConfiguration: TemplateProcessorSettings,
		settings: TemplateProcessorSettings
	) {
		super(props);

		const metaPathObject = MetaModelConverter.convertMetaModelContext(this.metaPath) as Property | DataField;
		// If the target is a property with a DataFieldDefault, use this as data field
		if (isProperty(metaPathObject) && metaPathObject.annotations.UI?.DataFieldDefault !== undefined) {
			this.enhancedMetaPath = settings.models.metaModel.createBindingContext(
				`@${UIAnnotationTerms.DataFieldDefault}`,
				this.metaPath
			) as Context;
		} else {
			this.enhancedMetaPath = this.metaPath;
		}
		const dataFieldDataModelPath = MetaModelConverter.getInvolvedDataModelObjects(this.enhancedMetaPath, this.contextPath);

		this.convertedDataField = dataFieldDataModelPath.targetObject as DataField;

		this.dataModelPath = enhanceDataModelPath(
			dataFieldDataModelPath,
			(this.convertedDataField.Value as PathAnnotationExpression<string>).path
		);

		this.property = this.dataModelPath.targetObject as Property;

		const insertable = isPathInsertable(this.dataModelPath);
		const deleteNavigationRestriction = isPathDeletable(this.dataModelPath, {
			ignoreTargetCollection: true,
			authorizeUnresolvable: true
		});
		const deletePath = isPathDeletable(this.dataModelPath);
		// deletable:
		//		if restrictions come from Navigation we apply it
		//		otherwise we apply restrictions defined on target collection only if it's a constant
		//      otherwise it's true!
		const deletable = ifElse(
			deleteNavigationRestriction._type === "Unresolvable",
			or(not(isConstant(deletePath)), deletePath),
			deletePath
		);

		this.visible = getVisibleExpression(this.dataModelPath, this.formatOptions);
		this.editMode =
			this.formatOptions.displayOnly === "true" || this.readOnly === true
				? "Display"
				: compileExpression(ifElse(and(insertable, deletable, UI.IsEditable), constant("Editable"), constant("Display")));
		this.displayMode = getDisplayMode(this.dataModelPath);

		const localDataModelPath = enhanceDataModelPath(
			MetaModelConverter.getInvolvedDataModelObjects(this.enhancedMetaPath, this.contextPath),
			(this.convertedDataField.Value as PathAnnotationExpression<string>).path
		);

		this.item = MultiValueFieldBlock._getMultiInputSettings(localDataModelPath, this.formatOptions); // this function rewrites dataModelPath, therefore, for now a clean object is passed
		this.collection = this.editMode === "Display" ? this.item.collectionBindingDisplay : this.item.collectionBindingEdit;
		this.fieldGroupIds = this.computeFieldGroupIds(settings.appComponent);
	}

	/**
	 * The function calculates the corresponding ValueHelp field in case it´s
	 * defined for the specific control.
	 *
	 * @returns An XML-based string with a possible ValueHelp control.
	 */
	getPossibleValueHelpTemplate(): string {
		const vhp = FieldHelper.valueHelpProperty(this.metaPath);
		const vhpCtx = this.metaPath.getModel().createBindingContext(vhp, this.metaPath);
		const hasValueHelpAnnotations = FieldHelper.hasValueHelpAnnotation(vhpCtx.getObject("@"));

		if (hasValueHelpAnnotations) {
			// depending on whether this one has a value help annotation included, add the dependent
			return xml`
			<mdc:dependents>
				<macros:ValueHelp
					idPrefix="${ID.generate([this.id, "FieldValueHelp"])}"
					property="${vhpCtx}"
					contextPath="${this.contextPath}"
					useMultiValueField="true"
				/>
			</mdc:dependents>`;
		}
		return "";
	}

	/**
	 * The building block template function.
	 *
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplate() {
		// BuildingBlock with set ID scenario
		if (this.id) {
			this.vhIdPrefix = ID.generate([this.id, this.vhIdPrefix]);
		} else {
			this.id = this.idPrefix ? ID.generate([this.idPrefix, "MultiValueField"]) : undefined;
		}

		//create a new binding context for the value help
		const valueHelpProperty = FieldHelper.valueHelpProperty(this.metaPath);
		const valueHelpPropertyContext = this.metaPath.getModel().createBindingContext(valueHelpProperty, this.metaPath);

		//calculate valueHelp
		const valueHelp = ValueHelpTemplating.generateID(
			undefined,
			this.vhIdPrefix,
			PropertyFormatters.getRelativePropertyPath(valueHelpPropertyContext as unknown as MetaModelContext, {
				context: this.contextPath
			}),
			getContextRelativeTargetObjectPath(this.dataModelPath) ?? ""
		);
		//compute the correct label
		const label = FieldHelper.computeLabelText(this.convertedDataField.Value as PathAnnotationExpression<string>, {
			context: this.metaPath
		}) as string;
		const change = `MVFieldRuntime.handleChange($controller, $event)`;
		const validateFieldGroup = `MVFieldRuntime.onValidateFieldGroup($controller, $event)`;

		return xml`
		<mdc:MultiValueField
				core:require="{MVFieldRuntime:'sap/fe/macros/multiValueField/MultiValueFieldRuntime'}"
				delegate="{name: 'sap/fe/macros/multiValueField/MultiValueFieldDelegate'}"
				id="${this.id}"
				items="${this.collection}"
				display="${this.displayMode}"
				width="100%"
				editMode="${this.editMode}"
				valueHelp="${valueHelp}"
				ariaLabelledBy = "${this.ariaLabelledBy}"
				showEmptyIndicator = "${this.formatOptions.showEmptyIndicator}"
				label = "${label}"
				change="${change}"
				fieldGroupIds="${this.fieldGroupIds}"
				validateFieldGroup="${validateFieldGroup}"
		>
			<mdc:items>
				<mdcField:MultiValueFieldItem xmlns:mdcField="sap.ui.mdc.field" key="${this.item.key}" description="${this.item.description}" />
			</mdc:items>
			${this.getPossibleValueHelpTemplate()}
		</mdc:MultiValueField>`;
	}
}
