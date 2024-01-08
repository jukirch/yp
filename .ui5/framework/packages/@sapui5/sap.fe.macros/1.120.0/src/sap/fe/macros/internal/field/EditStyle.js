/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/MetaModelConverter","sap/fe/core/formatters/CollaborationFormatter","sap/fe/core/helpers/BindingToolkit","sap/fe/core/templating/PropertyFormatters","sap/fe/core/templating/UIFormatters","sap/fe/macros/field/FieldTemplating","sap/fe/macros/internal/valuehelp/ValueHelpTemplating","sap/ui/mdc/enums/FieldEditMode","../../field/FieldHelper"],function(e,t,a,i,l,n,o,r,d,s){"use strict";var p=o.getTextAlignment;var c=o.getMultipleLinesForDataField;var u=l.getRelativePropertyPath;var m=i.compileExpression;var g=e.xml;const $={getLayoutData(e){let t="";if(e.collaborationEnabled){t=g`<layoutData>
				<FlexItemData growFactor="9" />
			</layoutData>`}return t},getCollaborationAvatar(e){const t=m(e.collaborationExpression);const i=m(n.getCollaborationExpression(e.dataModelPath,a.getCollaborationActivityInitials));const l=m(n.getCollaborationExpression(e.dataModelPath,a.getCollaborationActivityColor));return g`<Avatar
					xmlns:core="sap.ui.core"
					xmlns:controls="sap.fe.core.controls"
					core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
					visible="${t}"
					initials="${i}"
					displaySize="Custom"
					customDisplaySize="1.5rem"
					customFontSize="0.8rem"
					backgroundColor="${l}"
					press="FieldRuntime.showCollaborationEditUser(\${$source>/}, \${$view>/})"
				>
				<dependents>
					<controls:EventDelegateHook stopTapPropagation="true"/>
				</dependents>
				</Avatar>`},getDateTimePickerGeneric(e,a){const i=t.getInvolvedDataModelObjects(e.dataField,e.entitySet);const l=p(i,e.formatOptions,e.editModeAsObject);return g`<${a}
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns="sap.m"
			xmlns:core="sap.ui.core"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			log:sourcePath="${e.dataSourcePath}"
			id="${e.editStyleId}"
			width="100%"
			editable="${e.editableExpression}"
			enabled="${e.enabledExpression}"
			required="${e.requiredExpression}"
			change="${a==="DateTimePicker"?e.onChange||"FieldRuntime.handleChange($controller, $event)":"FieldRuntime.handleChange($controller, $event)"}"
			textAlign="${l}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${e.ariaLabelledBy}"
			value="${e.valueBindingExpression}"
			fieldGroupIds="${e.fieldGroupIds}"
			showTimezone="${e.showTimezone}"
			liveChange="${e.liveChangeEnabled?"FieldRuntime.handleLiveChange":undefined}"
	>

	</${a}>
	`},getInputTemplate(e){const a=t.getInvolvedDataModelObjects(e.dataField,e.entitySet);const i=p(a,e.formatOptions,e.editModeAsObject);return g`
			<Input
				xmlns="sap.m"
				xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
				log:sourcePath="${e.dataSourcePath}"
		        core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${e.editStyleId}"
				value="${e.valueBindingExpression}"
				placeholder="${e.editStylePlaceholder}"
				width="100%"
				editable="${e.editableExpression}"
				enabled="${e.enabledExpression}"
				required="${e.requiredExpression}"
				change="FieldRuntime.handleChange($controller, $event)"
				liveChange="${e.liveChangeEnabled?"FieldRuntime.handleLiveChange":undefined}"
				fieldGroupIds="${e.fieldGroupIds}"
				textAlign="${i}"
				validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
				ariaLabelledBy="${e.ariaLabelledBy}"
				maxLength="${e.formatOptions.textMaxLength}"
			>
				${$.getLayoutData(e)}
			</Input>`},getInputWithValueHelpTemplate(e){var a,i,l;const o=t.getInvolvedDataModelObjects(e.dataField,e.entitySet);const d=s.computeFieldBaseDelegate("sap/fe/macros/field/FieldBaseDelegate",e.formatOptions.retrieveTextFromValueList);const m=n.getFieldDisplay(e.property,e.formatOptions.displayMode,e.editModeAsObject);const $=!!((a=e.property)!==null&&a!==void 0&&(i=a.annotations)!==null&&i!==void 0&&(l=i.UI)!==null&&l!==void 0&&l.MultiLineText);const x=c(e,e.property.type,$);const h=e.dataField.getModel().createBindingContext("Value",e.dataField);const f=e.dataField.getModel().createBindingContext(s.valueHelpProperty(h));const v=r.generateID(e._vhFlexId,e.vhIdPrefix,u(h,{context:h}),u(f,{context:f}));const F=p(o,e.formatOptions,e.editModeAsObject,true);const b=s.computeLabelText(e,{context:e.dataField});let y="";if(e.property.type==="Edm.String"&&$){y=g`<mdc:contentEdit xmlns:mdc="sap.ui.mdc">
				<TextArea
					xmlns="sap.m"
					value="${e.valueBindingExpression}"
					required="${e.requiredExpression}"
					rows="${e.formatOptions.textLinesEdit}"
					growing="${e.formatOptions.textMaxLines>0?true:undefined}"
					growingMaxLines="${e.formatOptions.textMaxLines}"
					width="100%"
					change="FieldRuntime.handleChange($controller, $event)"
					fieldGroupIds="${e.fieldGroupIds}"
				/>
			</mdc:contentEdit>`}let I="";if(e.collaborationEnabled===true){I=g`<mdc:layoutData xmlns:mdc="sap.ui.mdc">
				<FlexItemData xmlns="sap.m" growFactor="9" />
			</mdc:layoutData>`}return g`<mdc:Field
			xmlns:mdc="sap.ui.mdc"
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			delegate="${d}"
			id="${e.editStyleId}"
			log:sourcePath="${e.dataSourcePath}"
			value="${e.valueBindingExpression}"
			placeholder="${e.editStylePlaceholder}"
			valueState="${e.valueState}"
			editMode="${e.editMode}"
			width="100%"
			required="${e.requiredExpression}"
			additionalValue="${e.textBindingExpression}"
			display="${m}"
			multipleLines="${x===false?undefined:x}"
			valueHelp="${v}"
			fieldGroupIds="${e.fieldGroupIds}"
			change="FieldRuntime.handleChange($controller, $event)"
			liveChange="${e.liveChangeEnabled?"FieldRuntime.handleLiveChange":undefined}"
			textAlign="${F}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${e.ariaLabelledBy}"
			label="${b}"
		>
			${y}
			${I}
		</mdc:Field>`},getCheckBoxTemplate(e){return g`
		    <CheckBox
                xmlns="sap.m"
                xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
		        macrodata:sourcePath="${e.dataSourcePath}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${e.editStyleId}"
		        selected="${e.valueBindingExpression}"
		        editable="${e.editableExpression}"
		        enabled="${e.enabledExpression}"
		        select="FieldRuntime.handleChange($controller, $event)"
		        fieldGroupIds="${e.fieldGroupIds}"
		        validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
		        ariaLabelledBy="${e.ariaLabelledBy}"
	    />
        `},getTextAreaTemplate(e){const t=e.liveChangeEnabled||e.formatOptions.textMaxLength?"FieldRuntime.handleLiveChange":undefined;const a=e.formatOptions.textMaxLines?true:false;const i=(!!e.formatOptions.textMaxLength).toString();let l="";if(e.collaborationEnabled){l=g`<field:layoutData>
			<FlexItemData xmlns="sap.m" growFactor="9" />
		</field:layoutData>`}return g`<field:TextAreaEx
			xmlns:log="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
			xmlns:field="sap.fe.macros.field"
			xmlns:core="sap.ui.core"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
			log:sourcePath="${e.dataSourcePath}"
			id="${e.editStyleId}"
			value="${e.valueBindingExpression}"
			placeholder="${e.editStylePlaceholder}"
			required="${e.requiredExpression}"
			rows="${e.formatOptions.textLinesEdit}"
			growing="${a}"
			growingMaxLines="${e.formatOptions.textMaxLines}"
			width="100%"
			editable="${e.editableExpression}"
			enabled="${e.enabledExpression}"
			change="FieldRuntime.handleChange($controller, $event)"
			fieldGroupIds="${e.fieldGroupIds}"
			validateFieldGroup="FieldRuntime.onValidateFieldGroup($controller, $event)"
			ariaLabelledBy="${e.ariaLabelledBy}"
			liveChange="${t}"
			maxLength="${e.formatOptions.textMaxLength}"
			showExceededText="${i}"
		>
			${l}
		</field:TextAreaEx>
		`},getRatingIndicatorTemplate:e=>{const t=e.ratingIndicatorTooltip||"{sap.fe.i18n>T_COMMON_RATING_INDICATOR_TITLE_LABEL}";return g`<RatingIndicator
			xmlns="sap.m"
			id="${e.editStyleId}"
			maxValue="${e.ratingIndicatorTargetValue}"
			value="${e.valueBindingExpression}"
			tooltip="${t}"
			iconSize="1.375rem"
			class="sapUiTinyMarginTopBottom"
			editable="true"
		>
		${$.getLayoutData(e)}
		</RatingIndicator>
		`},getTemplateWithWrapper(e){let t;if(e.editMode!==d.Display&&!!e.editStyle){if(e.collaborationEnabled??false){t=g`<HBox xmlns="sap.m" width="100%" alignItems="End">
            ${$.getTemplate(e)}
			${$.getCollaborationAvatar(e)}
        </HBox>`}else{t=g`${$.getTemplate(e)}`}}return t||""},getTemplate:e=>{let t;switch(e.editStyle){case"CheckBox":t=$.getCheckBoxTemplate(e);break;case"DatePicker":case"DateTimePicker":case"TimePicker":{t=$.getDateTimePickerGeneric(e,e.editStyle);break}case"Input":{t=$.getInputTemplate(e);break}case"InputWithValueHelp":{t=$.getInputWithValueHelpTemplate(e);break}case"RatingIndicator":t=$.getRatingIndicatorTemplate(e);break;case"TextArea":t=$.getTextAreaTemplate(e);break;default:}return t}};return $},false);
//# sourceMappingURL=EditStyle.js.map