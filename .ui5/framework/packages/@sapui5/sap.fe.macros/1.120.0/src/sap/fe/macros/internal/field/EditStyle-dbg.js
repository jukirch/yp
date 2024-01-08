/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/helpers/BindingToolkit", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating", "sap/ui/mdc/enums/FieldEditMode", "../../field/FieldHelper"], function (BuildingBlockTemplateProcessor, MetaModelConverter, CollaborationFormatters, BindingToolkit, PropertyFormatters, UIFormatter, FieldTemplating, ValueHelpTemplating, FieldEditMode, FieldHelper) {
  "use strict";

  var getTextAlignment = FieldTemplating.getTextAlignment;
  var getMultipleLinesForDataField = FieldTemplating.getMultipleLinesForDataField;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var compileExpression = BindingToolkit.compileExpression;
  var xml = BuildingBlockTemplateProcessor.xml;
  const EditStyle = {
    /**
     * An internal helper to retrieve the reused layout data.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getLayoutData(internalField) {
      let layoutData = "";
      if (internalField.collaborationEnabled) {
        layoutData = xml`<layoutData>
				<FlexItemData growFactor="9" />
			</layoutData>`;
      }
      return layoutData;
    },
    /**
     * Generates the avatar control next a field locked.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the avatar
     */
    getCollaborationAvatar(internalField) {
      const collaborationHasActivityExpression = compileExpression(internalField.collaborationExpression);
      const collaborationInitialsExpression = compileExpression(UIFormatter.getCollaborationExpression(internalField.dataModelPath, CollaborationFormatters.getCollaborationActivityInitials));
      const collaborationColorExpression = compileExpression(UIFormatter.getCollaborationExpression(internalField.dataModelPath, CollaborationFormatters.getCollaborationActivityColor));
      return xml`<Avatar
					xmlns:core="sap.ui.core"
					xmlns:controls="sap.fe.core.controls"
					core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
					visible="${collaborationHasActivityExpression}"
					initials="${collaborationInitialsExpression}"
					displaySize="Custom"
					customDisplaySize="1.5rem"
					customFontSize="0.8rem"
					backgroundColor="${collaborationColorExpression}"
					press="FieldRuntime.showCollaborationEditUser(\${$source>/}, \${$view>/})"
				>
				<dependents>
					<controls:EventDelegateHook stopTapPropagation="true"/>
				</dependents>
				</Avatar>`;
    },
    /**
     * Generates a template for one of the pickers reference in the type.
     *
     * @param internalField Reference to the current internal field instance
     * @param type Reference to one of the edit style picker types
     * @returns An XML-based string with the definition of the field control
     */
    getDateTimePickerGeneric(internalField, type) {
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
      const textAlign = getTextAlignment(dataModelObjectPath, internalField.formatOptions, internalField.editModeAsObject);
      return xml`<${type}
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns="sap.m"
			xmlns:core="sap.ui.core"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			log:sourcePath="${internalField.dataSourcePath}"
			id="${internalField.editStyleId}"
			width="100%"
			editable="${internalField.editableExpression}"
			enabled="${internalField.enabledExpression}"
			required="${internalField.requiredExpression}"
			change="${type === "DateTimePicker" ? internalField.onChange || "FieldRuntime.handleChange($controller, $event)" : "FieldRuntime.handleChange($controller, $event)"}"
			textAlign="${textAlign}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			value="${internalField.valueBindingExpression}"
			fieldGroupIds="${internalField.fieldGroupIds}"
			showTimezone="${internalField.showTimezone}"
			liveChange="${internalField.liveChangeEnabled ? "FieldRuntime.handleLiveChange" : undefined}"
	>

	</${type}>
	`;
    },
    /**
     * Generates the Input template.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getInputTemplate(internalField) {
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
      const textAlign = getTextAlignment(dataModelObjectPath, internalField.formatOptions, internalField.editModeAsObject);
      return xml`
			<Input
				xmlns="sap.m"
				xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
				log:sourcePath="${internalField.dataSourcePath}"
		        core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${internalField.editStyleId}"
				value="${internalField.valueBindingExpression}"
				placeholder="${internalField.editStylePlaceholder}"
				width="100%"
				editable="${internalField.editableExpression}"
				enabled="${internalField.enabledExpression}"
				required="${internalField.requiredExpression}"
				change="FieldRuntime.handleChange($controller, $event)"
				liveChange="${internalField.liveChangeEnabled ? "FieldRuntime.handleLiveChange" : undefined}"
				fieldGroupIds="${internalField.fieldGroupIds}"
				textAlign="${textAlign}"
				validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
				ariaLabelledBy="${internalField.ariaLabelledBy}"
				maxLength="${internalField.formatOptions.textMaxLength}"
			>
				${EditStyle.getLayoutData(internalField)}
			</Input>`;
    },
    /**
     * Generates the InputWithValueHelp template.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getInputWithValueHelpTemplate(internalField) {
      var _internalField$proper, _internalField$proper2, _internalField$proper3;
      const dataFieldDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
      const delegate = FieldHelper.computeFieldBaseDelegate("sap/fe/macros/field/FieldBaseDelegate", internalField.formatOptions.retrieveTextFromValueList);
      const display = UIFormatter.getFieldDisplay(internalField.property, internalField.formatOptions.displayMode, internalField.editModeAsObject);
      const hasMultilineAnnotation = !!((_internalField$proper = internalField.property) !== null && _internalField$proper !== void 0 && (_internalField$proper2 = _internalField$proper.annotations) !== null && _internalField$proper2 !== void 0 && (_internalField$proper3 = _internalField$proper2.UI) !== null && _internalField$proper3 !== void 0 && _internalField$proper3.MultiLineText);
      const multipleLines = getMultipleLinesForDataField(internalField, internalField.property.type, hasMultilineAnnotation);
      const propertyContext = internalField.dataField.getModel().createBindingContext("Value", internalField.dataField);
      const valueHelpPropertyContext = internalField.dataField.getModel().createBindingContext(FieldHelper.valueHelpProperty(propertyContext));
      const valueHelp = ValueHelpTemplating.generateID(internalField._vhFlexId, internalField.vhIdPrefix, getRelativePropertyPath(propertyContext, {
        context: propertyContext
      }), getRelativePropertyPath(valueHelpPropertyContext, {
        context: valueHelpPropertyContext
      }));
      const textAlign = getTextAlignment(dataFieldDataModelObjectPath, internalField.formatOptions, internalField.editModeAsObject, true);
      const label = FieldHelper.computeLabelText(internalField, {
        context: internalField.dataField
      });
      let optionalContentEdit = "";
      if (internalField.property.type === "Edm.String" && hasMultilineAnnotation) {
        optionalContentEdit = xml`<mdc:contentEdit xmlns:mdc="sap.ui.mdc">
				<TextArea
					xmlns="sap.m"
					value="${internalField.valueBindingExpression}"
					required="${internalField.requiredExpression}"
					rows="${internalField.formatOptions.textLinesEdit}"
					growing="${internalField.formatOptions.textMaxLines > 0 ? true : undefined}"
					growingMaxLines="${internalField.formatOptions.textMaxLines}"
					width="100%"
					change="FieldRuntime.handleChange($controller, $event)"
					fieldGroupIds="${internalField.fieldGroupIds}"
				/>
			</mdc:contentEdit>`;
      }
      let optionalLayoutData = "";
      if (internalField.collaborationEnabled === true) {
        optionalLayoutData = xml`<mdc:layoutData xmlns:mdc="sap.ui.mdc">
				<FlexItemData xmlns="sap.m" growFactor="9" />
			</mdc:layoutData>`;
      }
      return xml`<mdc:Field
			xmlns:mdc="sap.ui.mdc"
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			delegate="${delegate}"
			id="${internalField.editStyleId}"
			log:sourcePath="${internalField.dataSourcePath}"
			value="${internalField.valueBindingExpression}"
			placeholder="${internalField.editStylePlaceholder}"
			valueState="${internalField.valueState}"
			editMode="${internalField.editMode}"
			width="100%"
			required="${internalField.requiredExpression}"
			additionalValue="${internalField.textBindingExpression}"
			display="${display}"
			multipleLines="${multipleLines === false ? undefined : multipleLines}"
			valueHelp="${valueHelp}"
			fieldGroupIds="${internalField.fieldGroupIds}"
			change="FieldRuntime.handleChange($controller, $event)"
			liveChange="${internalField.liveChangeEnabled ? "FieldRuntime.handleLiveChange" : undefined}"
			textAlign="${textAlign}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			label="${label}"
		>
			${optionalContentEdit}
			${optionalLayoutData}
		</mdc:Field>`;
    },
    /**
     * Generates the CheckBox template.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getCheckBoxTemplate(internalField) {
      return xml`
		    <CheckBox
                xmlns="sap.m"
                xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
		        macrodata:sourcePath="${internalField.dataSourcePath}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${internalField.editStyleId}"
		        selected="${internalField.valueBindingExpression}"
		        editable="${internalField.editableExpression}"
		        enabled="${internalField.enabledExpression}"
		        select="FieldRuntime.handleChange($controller, $event)"
		        fieldGroupIds="${internalField.fieldGroupIds}"
		        validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
		        ariaLabelledBy="${internalField.ariaLabelledBy}"
	    />
        `;
    },
    /**
     * Generates the TextArea template.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTextAreaTemplate(internalField) {
      const liveChange = internalField.liveChangeEnabled || internalField.formatOptions.textMaxLength ? "FieldRuntime.handleLiveChange" : undefined;
      const growing = internalField.formatOptions.textMaxLines ? true : false;
      const showExceededText = (!!internalField.formatOptions.textMaxLength).toString();

      //unfortunately this one is a "different" layoutData than the others, therefore the reuse function from above cannot be used for the textArea template
      let layoutData = "";
      if (internalField.collaborationEnabled) {
        layoutData = xml`<field:layoutData>
			<FlexItemData xmlns="sap.m" growFactor="9" />
		</field:layoutData>`;
      }
      return xml`<field:TextAreaEx
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns:field="sap.fe.macros.field"
			xmlns:core="sap.ui.core"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			log:sourcePath="${internalField.dataSourcePath}"
			id="${internalField.editStyleId}"
			value="${internalField.valueBindingExpression}"
			placeholder="${internalField.editStylePlaceholder}"
			required="${internalField.requiredExpression}"
			rows="${internalField.formatOptions.textLinesEdit}"
			growing="${growing}"
			growingMaxLines="${internalField.formatOptions.textMaxLines}"
			width="100%"
			editable="${internalField.editableExpression}"
			enabled="${internalField.enabledExpression}"
			change="FieldRuntime.handleChange($controller, $event)"
			fieldGroupIds="${internalField.fieldGroupIds}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			liveChange="${liveChange}"
			maxLength="${internalField.formatOptions.textMaxLength}"
			showExceededText="${showExceededText}"
		>
			${layoutData}
		</field:TextAreaEx>
		`;
    },
    /**
     * Generates the RatingIndicator template.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getRatingIndicatorTemplate: internalField => {
      const tooltip = internalField.ratingIndicatorTooltip || "{sap.fe.i18n>T_COMMON_RATING_INDICATOR_TITLE_LABEL}";
      return xml`<RatingIndicator
			xmlns="sap.m"
			id="${internalField.editStyleId}"
			maxValue="${internalField.ratingIndicatorTargetValue}"
			value="${internalField.valueBindingExpression}"
			tooltip="${tooltip}"
			iconSize="1.375rem"
			class="sapUiTinyMarginTopBottom"
			editable="true"
		>
		${EditStyle.getLayoutData(internalField)}
		</RatingIndicator>
		`;
    },
    /**
     * Helps to calculate the content edit functionality / templating.
     * Including a wrapper an hbox in case of collaboration mode finally
     * it calls internally EditStyle.getTemplate.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTemplateWithWrapper(internalField) {
      let contentEdit;
      if (internalField.editMode !== FieldEditMode.Display && !!internalField.editStyle) {
        if (internalField.collaborationEnabled ?? false) {
          contentEdit = xml`<HBox xmlns="sap.m" width="100%" alignItems="End">
            ${EditStyle.getTemplate(internalField)}
			${EditStyle.getCollaborationAvatar(internalField)}
        </HBox>`;
        } else {
          contentEdit = xml`${EditStyle.getTemplate(internalField)}`;
        }
      }
      return contentEdit || "";
    },
    /**
     * Entry point for further templating processings.
     *
     * @param internalField Reference to the current internal field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTemplate: internalField => {
      let innerFieldContent;
      switch (internalField.editStyle) {
        case "CheckBox":
          innerFieldContent = EditStyle.getCheckBoxTemplate(internalField);
          break;
        case "DatePicker":
        case "DateTimePicker":
        case "TimePicker":
          {
            innerFieldContent = EditStyle.getDateTimePickerGeneric(internalField, internalField.editStyle);
            break;
          }
        case "Input":
          {
            innerFieldContent = EditStyle.getInputTemplate(internalField);
            break;
          }
        case "InputWithValueHelp":
          {
            innerFieldContent = EditStyle.getInputWithValueHelpTemplate(internalField);
            break;
          }
        case "RatingIndicator":
          innerFieldContent = EditStyle.getRatingIndicatorTemplate(internalField);
          break;
        case "TextArea":
          innerFieldContent = EditStyle.getTextAreaTemplate(internalField);
          break;
        default:
      }
      return innerFieldContent;
    }
  };
  return EditStyle;
}, false);
