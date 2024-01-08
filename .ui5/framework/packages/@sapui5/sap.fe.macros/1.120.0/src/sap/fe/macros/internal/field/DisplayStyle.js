/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/uid","sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/BindingToolkit","sap/fe/core/helpers/StableIdHelper","sap/fe/core/helpers/TypeGuards","sap/fe/core/templating/CriticalityFormatters","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/UIFormatters","sap/fe/macros/CommonHelper","sap/fe/macros/field/FieldHelper","sap/fe/macros/field/FieldTemplating","sap/ui/mdc/enums/FieldEditMode"],function(e,t,a,i,n,o,r,l,s,d,c,p,m){"use strict";var u=s.hasValidAnalyticalCurrencyOrUnit;var $=l.getContextRelativeTargetObjectPath;var v=l.enhanceDataModelPath;var y=r.buildExpressionForCriticalityIcon;var b=r.buildExpressionForCriticalityColor;var f=r.buildExpressionForCriticalityButtonType;var x=o.isPathAnnotationExpression;var I=n.generate;var F=i.pathInModel;var g=i.not;var h=i.isPathInModelExpression;var T=i.getExpressionFromAnnotation;var M=i.formatResult;var D=i.equal;var E=i.compileExpression;var L=t.xml;const B={getAmountWithCurrencyTemplate(e){if(e.formatOptions.isAnalytics){return L`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${e.displayVisible}" condition="${e.hasValidAnalyticalCurrencyOrUnit}">
			<controls:contentTrue>
				<u:Currency
					xmlns:u="sap.ui.unified"
					stringValue="${e.valueAsStringBindingExpression}"
					currency="${e.unitBindingExpression}"
					useSymbol="false"
					maxPrecision="5"
				/>
			</controls:contentTrue>
			<controls:contentFalse>
				<u:Currency xmlns:u="sap.ui.unified" stringValue="" currency="*" useSymbol="false" />
			</controls:contentFalse>
		</controls:ConditionalWrapper>`}else{return L`<coreControls:FormElementWrapper xmlns:coreControls="sap.fe.core.controls"
			formDoNotAdjustWidth="true"
			width="${e.formatOptions.textAlignMode==="Table"?"100%":undefined}"
		>
			<u:Currency
				xmlns:u="sap.ui.unified"
				visible="${e.displayVisible}"
				stringValue="${e.valueAsStringBindingExpression}"
				currency="${e.unitBindingExpression}"
				useSymbol="false"
				maxPrecision="5"
			/>
		</coreControls:FormElementWrapper>`}},getAvatarTemplate(e){let t;if(e._flexId){t=e._flexId}else if(e.idPrefix){t=I([e.idPrefix,"Field-content"])}const a=p.getVisibleExpression(e.dataModelPath);const i=p.getValueBinding(e.dataModelPath,{});return L`
				<controls:FormElementWrapper
					xmlns:controls="sap.fe.core.controls"
					visible="${a}"
				>
				<Avatar
					xmlns="sap.m"
					id="${t}"
					src="${i}"
					displaySize="S"
					class="sapUiSmallMarginEnd"
					displayShape="Square"
					imageFitType="Contain"
				/>
			</controls:FormElementWrapper>`},getButtonTemplate:e=>{var t,a,i;const n=((t=e.formatOptions)===null||t===void 0?void 0:t.showIconUrl)??false?e.convertedDataField.IconUrl:undefined;const o=!(((a=e.formatOptions)===null||a===void 0?void 0:a.showIconUrl)??false)?e.convertedDataField.Label:undefined;const r=((i=e.formatOptions)===null||i===void 0?void 0:i.showIconUrl)??false?e.convertedDataField.Label:undefined;let l;let s;let p;let m;let u;if(e.convertedDataField.$Type==="com.sap.vocabularies.UI.v1.DataFieldForAction"){var $,v;const t=e.dataField.getObject();l=c.getPressEventForDataFieldActionButton(e,t);s=e.convertedDataField.ActionTarget?e.convertedDataField.ActionTarget.isBound:true;p=e.convertedDataField.ActionTarget?($=e.convertedDataField.ActionTarget.annotations)===null||$===void 0?void 0:(v=$.Core)===null||v===void 0?void 0:v.OperationAvailable:"false";m=e.convertedDataField.ActionTarget?undefined:"false";if(p&&p!=="false"){const t=e.convertedDataField.ActionTarget;const a=t.parameters[0].name;m=E(T(p,[],undefined,e=>{if(e.startsWith(a)){return e.replace(a+"/","")}return e}))}}if(e.convertedDataField.$Type==="com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"){var y;l=d.getPressHandlerForDataFieldForIBN(e.dataField.getObject(),undefined,undefined);u=true;if(((y=e.convertedDataField)===null||y===void 0?void 0:y.$Type)==="com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"&&e.convertedDataField.NavigationAvailable!==undefined&&String(e.formatOptions.ignoreNavigationAvailable)!=="true"){u=E(T(e.convertedDataField.NavigationAvailable))}}let b="";if(e.convertedDataField.$Type==="com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"){b=L`<Button
				xmlns="sap.m"
				visible="${e.visible}"
				text="${o}"
				icon="${n}"
				enabled="${u}"
				tooltip="${r}"
				press="${l}"
			/>`}else if(c.isDataFieldActionButtonVisible(void 0,e.convertedDataField,s,p)){const t=c.isDataFieldActionButtonEnabled(e.convertedDataField,s,p,m);const a=f(e.dataModelPath);b=L`<Button
				xmlns="sap.m"
			    class="${e.class}"
				text="${o}"
				icon="${n}"
				tooltip="${r}"
				press="${l}"
				enabled="${t}"
				visible="${e.visible}"
				type="${a}"
				/>`}return b},getContactTemplate(e){const t=e.dataField.getModel().createBindingContext("Target/$AnnotationPath",e.dataField);const a=p.getVisibleExpression(e.dataModelPath);return L`
		<macros:Contact
			idPrefix="${e.idPrefix}"
			ariaLabelledBy="${e.ariaLabelledBy}"
			metaPath="${t}"
			contextPath="${e.entitySet}"
			_flexId="${e._flexId}"
			visible="${a}"
			showEmptyIndicator="${e.formatOptions.showEmptyIndicator}"
		/>`},getDataPointInnerPart(e,t){const i=a.convertMetaModelContext(e.dataField);const n=i.$Type==="com.sap.vocabularies.UI.v1.DataFieldForAnnotation"?e.dataField.getModel().createBindingContext("Target/$AnnotationPath",e.dataField):e.dataField;const o=L`<internalMacro:formatOptions
				xmlns:internalMacro="sap.fe.macros.internal"
				measureDisplayMode="${e.formatOptions.measureDisplayMode}"
				showEmptyIndicator="${e.formatOptions.showEmptyIndicator}"
				isAnalytics="${e.formatOptions.isAnalytics}"
			/>`;return L`<internalMacro:DataPoint
			xmlns:internalMacro="sap.fe.macros.internal"
			idPrefix="${e.idPrefix}"
			visible="${!t?e.displayVisible:""}"
			ariaLabelledBy="${e.ariaLabelledBy}"
			_flexId="${e._flexId}"
			metaPath="${n}"
			contextPath="${e.entitySet}"
		>
			${o}
		</internalMacro:DataPoint>`},getDataPointTemplate(e){if((e.formatOptions.isAnalytics??false)&&(e.hasUnitOrCurrency??false)){return L`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${e.displayVisible}" condition="${e.hasValidAnalyticalCurrencyOrUnit}">
				<controls:contentTrue>
					 ${this.getDataPointInnerPart(e,true)}
				</controls:contentTrue>
					<controls:contentFalse>
						<Text xmlns="sap.m" text="*" />
				</controls:contentFalse>
			</controls:ConditionalWrapper>`}else{return this.getDataPointInnerPart(e,false)}},getExpandableText(e){var t,a;return L`
			<ExpandableText
				xmlns="sap.m"
				id="${e===null||e===void 0?void 0:e.noWrapperId}"
				visible="${e===null||e===void 0?void 0:e.displayVisible}"
				text="${e===null||e===void 0?void 0:e.text}"
				overflowMode="${e===null||e===void 0?void 0:(t=e.formatOptions)===null||t===void 0?void 0:t.textExpandBehaviorDisplay}"
				maxCharacters="${e===null||e===void 0?void 0:(a=e.formatOptions)===null||a===void 0?void 0:a.textMaxCharactersDisplay}"
				emptyIndicatorMode="${e===null||e===void 0?void 0:e.emptyIndicatorMode}"
		/>`},getFileTemplate(e){var t,a,i,n,o,r,l,s,d,u,y,b;let f;const I=$(e.dataModelPath);const h=(t=e.property.annotations.Core)===null||t===void 0?void 0:(a=t.ContentDisposition)===null||a===void 0?void 0:a.Filename;let M;if(x(h)){const t=v(e.dataModelPath,h.path);M="{ path: '"+$(t)+"' }"}const B=E(g(D(F(`${I}@odata.mediaContentType`),null)));const O=p.getValueBinding(e.dataModelPath,{});const W=(i=e.property.annotations.Core)===null||i===void 0?void 0:(n=i.ContentDisposition)===null||n===void 0?void 0:(o=n.Filename)===null||o===void 0?void 0:o.path;const S=((r=e.property.annotations.Core)===null||r===void 0?void 0:r.MediaType)&&E(T((l=e.property.annotations.Core)===null||l===void 0?void 0:l.MediaType));const P=!!((s=e.property.annotations.UI)!==null&&s!==void 0&&s.IsImageURL)||!!((d=e.property.annotations.UI)!==null&&d!==void 0&&d.IsImage)||/image\//i.test(((u=e.property.annotations.Core)===null||u===void 0?void 0:(y=u.MediaType)===null||y===void 0?void 0:y.toString())??"");const C=p.getValueBinding(e.dataModelPath,{});const V=c.getPathForIconSource(I);const A=c.getFilenameExpr(M,"{sap.fe.i18n>M_FIELD_FILEUPLOADER_NOFILENAME_TEXT}");const U=c.getDownloadUrl(O??"");const R=E(D(F(`${I}@odata.mediaContentType`),null));let k;if((b=e.property.annotations.Core)!==null&&b!==void 0&&b.AcceptableMediaTypes){const t=Array.from(e.property.annotations.Core.AcceptableMediaTypes).map(e=>`'${e}'`);k=`{=odata.collection([${t.join(",")}])}`}const w=c.calculateMBfromByte(e.property.maxLength);if(P){f=L`
			<controls:avatar xmlns:controls="sap.fe.macros.controls">
				<Avatar
					xmlns="sap.m"
					visible="${e.displayVisible}"
					src="${C}"
					displaySize="S"
					class="sapUiSmallMarginEnd"
					displayShape="Square">
					<customData>
						<ImageCustomData paramName="xcache" />
					</customData>
				</Avatar>
			</controls:avatar>`}else{f=L`
			<controls:icon xmlns:controls="sap.fe.macros.controls">
				<core:Icon src="${V}" class="sapUiSmallMarginEnd" visible="${B}" />
			</controls:icon>
			<controls:link>
				<Link
					xmlns="sap.m"
					text="${A}"
					target="_blank"
					href="${U}"
					visible="${B}"
					wrapping="true"
				/>
			</controls:link>
			<controls:text>
				<Text xmlns="sap.m" emptyIndicatorMode="On" text="" visible="${R}" />
			</controls:text>`}if(e.editMode!==m.Display){const t=e.collaborationEnabled?"FIELDRUNTIME.handleOpenUploader":undefined;const a=e.collaborationEnabled?"FIELDRUNTIME.handleCloseUploader":undefined;f+=L`
			<controls:fileUploader xmlns:controls="sap.fe.macros.controls">
				<u:FileUploader
					xmlns:u="sap.ui.unified"
					name="FEV4FileUpload"
					visible="${e.editableExpression}"
					buttonOnly="true"
					iconOnly="true"
					multiple="false"
					tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_UPLOAD_BUTTON_TOOLTIP}"
					icon="sap-icon://upload"
					style="Transparent"
					sendXHR="true"
					useMultipart="false"
					sameFilenameAllowed="true"
					mimeType="${k}"
					typeMissmatch="FIELDRUNTIME.handleTypeMissmatch"
					maximumFileSize="${w}"
					fileSizeExceed="FIELDRUNTIME.handleFileSizeExceed"
					uploadOnChange="false"
					uploadComplete="FIELDRUNTIME.handleUploadComplete($event, ${M||"undefined"}, '${I}', $controller)"
					httpRequestMethod="Put"
					change="FIELDRUNTIME.uploadStream($controller, $event)"
					beforeDialogOpen="${t}"
					afterDialogClose="${a}"
					uploadStart="FIELDRUNTIME.handleOpenUploader"
				/>
			</controls:fileUploader>
			<controls:deleteButton>
				<Button
					xmlns="sap.m"
					icon="sap-icon://sys-cancel"
					type="Transparent"
					press="FIELDRUNTIME.removeStream($event, ${M||"undefined"}, '${I}', $controller)"
					tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_DELETE_BUTTON_TOOLTIP}"
					visible="${e.editableExpression}"
					enabled="${B}"
				/>
			</controls:deleteButton>`}return L`
			<controls:FileWrapper
				xmlns:controls="sap.fe.macros.controls"
				core:require="{FIELDRUNTIME: 'sap/fe/macros/field/FieldRuntime'}"
				visible="${e.visible}"
				uploadUrl="${O}"
				propertyPath="${I}"
				filename="${W}"
				mediaType="${S}"
				fieldGroupIds="${e.fieldGroupIds}"
				validateFieldGroup="FIELDRUNTIME.onValidateFieldGroup($controller, $event)"
				customData:sourcePath="${e.dataSourcePath}"
			>${f}</controls:FileWrapper>`},getLinkTemplate(t){var a,i,n,o;let r;let l;let s;let m;switch(t.convertedDataField.$Type){case"com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":l=d.getPressHandlerForDataFieldForIBN(t.dataField.getObject());return L`<Link
					xmlns="sap.m"
					id="${t.noWrapperId}"
					core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
					visible="${t.displayVisible}"
					text="${B.computeTextWithWhiteSpace(t)}"
					press="${l}"
					ariaLabelledBy="${t.ariaLabelledBy}"
					emptyIndicatorMode="${t.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;case"com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":l=`FieldRuntime.onDataFieldWithNavigationPath(\${$source>/}, $controller, '${t.convertedDataField.Target.value}')`;return L`<Link
					xmlns="sap.m"
					id="${t.noWrapperId}"
					core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
					visible="${t.displayVisible}"
					text="${t.text}"
					press="${l}"
					ariaLabelledBy="${t.ariaLabelledBy}"
					emptyIndicatorMode="${t.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;case"com.sap.vocabularies.UI.v1.DataFieldWithAction":l=c.getPressEventForDataFieldActionButton(t,t.dataField.getObject());return L`<Link
					xmlns="sap.m"
					id="${t.noWrapperId}"
					visible="${t.displayVisible}"
					text="${t.text}"
					press="${l}"
					ariaLabelledBy="${t.ariaLabelledBy}"
					emptyIndicatorMode="${t.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;case"com.sap.vocabularies.UI.v1.DataFieldWithUrl":t.text=B.computeTextWithWhiteSpace(t);s=t.convertedDataField.IconUrl?E(T(t.convertedDataField.IconUrl)):undefined;const e=T(t.convertedDataField.Url);r=E(e);m=E(g(D(e,"")))}if((a=t.property.annotations)!==null&&a!==void 0&&(i=a.Communication)!==null&&i!==void 0&&i.IsEmailAddress||(n=t.property.annotations)!==null&&n!==void 0&&(o=n.Communication)!==null&&o!==void 0&&o.IsPhoneNumber){var u,$;const a=((u=t.property.annotations.Communication)===null||u===void 0?void 0:u.IsEmailAddress)!==undefined;const i=(($=t.property.annotations.Communication)===null||$===void 0?void 0:$.IsPhoneNumber)!==undefined;const n=p.getValueBinding(t.dataModelPath,{});const o=t.noWrapperId?t.noWrapperId:`mailBlock${e()}`;if(a){r=`mailto:${n}`;return L`<macros:Email
					xmlns:macros="sap.fe.macros"
					id="${o}"
					visible="${t.displayVisible}"
					text="${t.text}"
					mail="${n}"
					enabled="${m}"
					ariaLabelledBy="${t.ariaLabelledBy}"
					emptyIndicatorMode="${t.emptyIndicatorMode}"
				/>`}if(i){r=`tel:${n}`;return L`<Link
					xmlns="sap.m"
					id="${t.noWrapperId}"
					core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
					visible="${t.displayVisible}"
					text="${B.computeTextWithWhiteSpace(t)}"
					href="${r}"
					enabled="${m}"
					ariaLabelledBy="${t.ariaLabelledBy}"
					emptyIndicatorMode="${t.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`}}if(s){return L`<ObjectStatus
				xmlns="sap.m"
				core:require="{WSR: 'sap/base/strings/whitespaceReplacer', FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${t.noWrapperId}"
				icon="${s}"
				visible="${t.displayVisible}"
				text="${t.text}"
				press="FieldRuntime.openExternalLink"
				active="${m}"
				emptyIndicatorMode="${t.emptyIndicatorMode}"
				ariaLabelledBy="${t.ariaLabelledBy}"
				customData:url="${r}"
			/>`}else{return L`<Link
				xmlns="sap.m"
				id="${t.noWrapperId}"
				core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
				visible="${t.displayVisible}"
				text="${t.text}"
				href="${r}"
				enabled="${m}"
				target="_top"
				wrapping="${t.wrap===undefined?true:t.wrap}"
				ariaLabelledBy="${t.ariaLabelledBy}"
				emptyIndicatorMode="${t.emptyIndicatorMode}"
			/>`}},getLinkWithQuickViewTemplate(e){const t=e.formatOptions.retrieveTextFromValueList?e.textFromValueList:B.computeTextWithWhiteSpace(e);return L`<Link
			xmlns="sap.m"
			xmlns:core="sap.ui.core"
			id="${e.noWrapperId}"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime', WSR: 'sap/base/strings/whitespaceReplacer'}"
			text="${t}"
			visible="${e.displayVisible}"
			wrapping="${e.wrap===undefined?true:e.wrap}"
			press="FieldRuntime.pressLink"
			ariaLabelledBy="${e.ariaLabelledBy}"
			emptyIndicatorMode="${e.emptyIndicatorMode}"
			customData:loadValue="${e.valueAsStringBindingExpression}"
		>
			<dependents>
				<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${e.dataField}" semanticObject="${e.semanticObject}" contextPath="${e.entitySet}" />
			</dependents>
		</Link>`},getTextTemplate(e){if(e.formatOptions.isAnalytics&&e.hasUnitOrCurrency){return L`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${e.displayVisible}" condition="${e.hasValidAnalyticalCurrencyOrUnit}">
			<controls:contentTrue>
					<Text xmlns="sap.m"
						id="${e.noWrapperId}"
						text="${e.text}"
						emptyIndicatorMode="${e.emptyIndicatorMode}"
						renderWhitespace="true"
						wrapping="${e.wrap}"
					/>
				</controls:contentTrue>
				<controls:contentFalse>
					<Text xmlns="sap.m" id="${e.noWrapperId}" text="*" />
				</controls:contentFalse>
			</controls:ConditionalWrapper>
		`}else if(e.formatOptions.retrieveTextFromValueList){return L`<Text
				xmlns="sap.m"
				id="${e.noWrapperId}"
				visible="${e.displayVisible}"
				text="${e.textFromValueList}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				emptyIndicatorMode="${e.emptyIndicatorMode}"
				renderWhitespace="true"
			/>`}else{return L`<Text
				xmlns="sap.m"
				id="${e.noWrapperId}"
				visible="${e.displayVisible}"
				text="${e.text}"
				wrapping="${e.wrap}"
				emptyIndicatorMode="${e.emptyIndicatorMode}"
				renderWhitespace="true"
		/>`}},getObjectIdentifier(e){const t=e.hasQuickView?L`<dependents>
	<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${e.dataField}" semanticObject="${e.semanticObject}" contextPath="${e.entitySet}" />
</dependents>`:"";let a=L`<ObjectIdentifier
	xmlns="sap.m"
	core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
	id="${e.noWrapperId}"
	title="${e.identifierTitle}"
	text="${e.identifierText}"
	titleActive="${e.hasQuickView}"
	titlePress="FieldRuntime.pressLink"
	ariaLabelledBy="${e.ariaLabelledBy}"
	emptyIndicatorMode="${e.emptyIndicatorMode}"
	customData:loadValue="${e.valueAsStringBindingExpression}">
${t}</ObjectIdentifier>`;if(e.hasSituationsIndicator){a=L`<HBox xmlns="sap.m" alignItems="Center" justifyContent="SpaceBetween" width="100%">
							${a}
							<SituationsIndicator
								xmlns="sap.fe.macros.internal.situations"
								entitySet="${e.entitySet}"
								propertyPath="${e.situationsIndicatorPropertyPath}"
							/>
						</HBox>`}if(e.showErrorIndicator&&e.showErrorObjectStatus){a=L`<VBox xmlns="sap.m">
				${a}
					<ObjectStatus
						xmlns="sap.m"
						visible="${e.showErrorObjectStatus}"
						class="sapUiSmallMarginBottom"
						text="{sap.fe.i18n>Contains_Errors}"
						state="Error"
					/>
			</VBox>`}return L`${a}`},getObjectStatus(e){let t;const i=a.getInvolvedDataModelObjects(e.dataField,e.entitySet);const n=v(i,i.targetObject.Value.path);const o=u(n);const r=a.getInvolvedDataModelObjects(e.dataField);const l=y(r);const s=b(r);const d=e.convertedDataField.Url?E(T(e.convertedDataField.Url)):undefined;if(e.formatOptions.isAnalytics&&e.hasUnitOrCurrency){t=L`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls"
			id="${e.noWrapperId}"
			condition="${o}"
		>
			<controls:contentTrue>
				<ObjectStatus
					xmlns="sap.m"
					icon="${l}"
					state="${s}"
					visible="${e.displayVisible}"
					text="${e.text}"
					emptyIndicatorMode="${e.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>
			</controls:contentTrue>
			<controls:contentFalse>
				<ObjectStatus xmlns="sap.m" text="*" visible="${e.displayVisible}" />
			</controls:contentFalse>
		</controls:ConditionalWrapper>`}else{let a="";let i=false;let n;if(e.hasQuickView){a=L`<dependents>
					<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${e.dataField}" semanticObject="${e.semanticObject}" contextPath="${e.entitySet}" />
				</dependents>`;i=true;n="FieldRuntime.pressLink"}if(d){i=true;n="FieldRuntime.openExternalLink"}t=L`<ObjectStatus
				xmlns="sap.m"
				id="${e.noWrapperId}"
				icon="${l}"
				state="${s}"
				text="${e.text}"
				visible="${e.displayVisible}"
				emptyIndicatorMode="${e.emptyIndicatorMode}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				active="${i}"
				press="${n}"
				customData:url="${d}"
				customData:loadValue="${e.valueAsStringBindingExpression}"
				ariaLabelledBy="${e.ariaLabelledBy}"
			>
			${a}
		</ObjectStatus>`}return t},getLabelSemanticKey(e){if(e.hasQuickView){return L`<Link
				xmlns="sap.m"
				text="${e.text}"
				wrapping="true"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				press="FieldRuntime.pressLink"
				ariaLabelledBy="${e.ariaLabelledBy}"
				emptyIndicatorMode="${e.emptyIndicatorMode}"
				customData:loadValue="${e.valueAsStringBindingExpression}">
					<dependents>
						<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${e.dataField}" semanticObject="${e.semanticObject}" contextPath="${e.entitySet}" />
					</dependents>
				</Link>`}return L`<Label
				xmlns="sap.m"
				id="${e.noWrapperId}"
				visible="${e.displayVisible}"
				text="${e.identifierTitle}"
				design="Bold"/>`},getSemanticKeyWithDraftIndicatorTemplate(e){let t=e.formatOptions.semanticKeyStyle==="ObjectIdentifier"?B.getObjectIdentifier(e):B.getLabelSemanticKey(e);if(!e.formatOptions.fieldGroupDraftIndicatorPropertyPath){t=L`<controls:FormElementWrapper
										xmlns:controls="sap.fe.core.controls"
										visible="${e.displayVisible}">
										<VBox
										xmlns="sap.m"
										class="${c.getMarginClass(e.formatOptions.compactSemanticKey)}">
											${t}
											<macro:DraftIndicator
												xmlns:macro="sap.fe.macros"
												draftIndicatorType="IconAndText"
												entitySet="${e.entitySet}"
												isDraftIndicatorVisible="${e.draftIndicatorVisible}"
												ariaLabelledBy="${e.ariaLabelledBy}"/>
										</VBox>
									</controls:FormElementWrapper>`}return t},computeTextWithWhiteSpace(e){const t=p.getTextBinding(e.dataModelPath,e.formatOptions,true);return h(t)||typeof t==="string"?E(M([t],"WSR")):E(t)},getTemplate:e=>{let t;switch(e.displayStyle){case"AmountWithCurrency":t=B.getAmountWithCurrencyTemplate(e);break;case"Avatar":t=B.getAvatarTemplate(e);break;case"Button":t=B.getButtonTemplate(e);break;case"Contact":t=B.getContactTemplate(e);break;case"DataPoint":t=B.getDataPointTemplate(e);break;case"ExpandableText":t=B.getExpandableText(e);break;case"File":t=B.getFileTemplate(e);break;case"Link":t=B.getLinkTemplate(e);break;case"LinkWithQuickView":t=B.getLinkWithQuickViewTemplate(e);break;case"ObjectIdentifier":t=B.getObjectIdentifier(e);break;case"ObjectStatus":{t=B.getObjectStatus(e);break}case"LabelSemanticKey":t=B.getLabelSemanticKey(e);break;case"SemanticKeyWithDraftIndicator":t=B.getSemanticKeyWithDraftIndicatorTemplate(e);break;case"Text":t=B.getTextTemplate(e);break}return t}};return B},false);
//# sourceMappingURL=DisplayStyle.js.map