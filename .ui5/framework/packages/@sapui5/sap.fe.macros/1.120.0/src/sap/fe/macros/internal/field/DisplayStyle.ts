import type { Action, PathAnnotationExpression, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type { DataFieldAbstractTypes, DataFieldWithNavigationPath, DataFieldWithUrl } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import uid from "sap/base/util/uid";
import { xml } from "sap/fe/core/buildingBlocks/BuildingBlockTemplateProcessor";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { CompiledBindingToolkitExpression } from "sap/fe/core/helpers/BindingToolkit";
import {
	compileExpression,
	equal,
	formatResult,
	getExpressionFromAnnotation,
	isPathInModelExpression,
	not,
	pathInModel
} from "sap/fe/core/helpers/BindingToolkit";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import {
	buildExpressionForCriticalityButtonType,
	buildExpressionForCriticalityColor,
	buildExpressionForCriticalityIcon
} from "sap/fe/core/templating/CriticalityFormatters";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { hasValidAnalyticalCurrencyOrUnit } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type InternalFieldBlock from "../InternalField.block";
import type { DisplayStyle as DisplayStyleType } from "../InternalField.block";

const DisplayStyle = {
	/**
	 * Generates the AmountWithCurrency template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getAmountWithCurrencyTemplate(internalField: InternalFieldBlock) {
		if (internalField.formatOptions.isAnalytics) {
			return xml`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${internalField.displayVisible}" condition="${internalField.hasValidAnalyticalCurrencyOrUnit}">
			<controls:contentTrue>
				<u:Currency
					xmlns:u="sap.ui.unified"
					stringValue="${internalField.valueAsStringBindingExpression}"
					currency="${internalField.unitBindingExpression}"
					useSymbol="false"
					maxPrecision="5"
				/>
			</controls:contentTrue>
			<controls:contentFalse>
				<u:Currency xmlns:u="sap.ui.unified" stringValue="" currency="*" useSymbol="false" />
			</controls:contentFalse>
		</controls:ConditionalWrapper>`;
		} else {
			return xml`<coreControls:FormElementWrapper xmlns:coreControls="sap.fe.core.controls"
			formDoNotAdjustWidth="true"
			width="${internalField.formatOptions.textAlignMode === "Table" ? "100%" : undefined}"
		>
			<u:Currency
				xmlns:u="sap.ui.unified"
				visible="${internalField.displayVisible}"
				stringValue="${internalField.valueAsStringBindingExpression}"
				currency="${internalField.unitBindingExpression}"
				useSymbol="false"
				maxPrecision="5"
			/>
		</coreControls:FormElementWrapper>`;
		}
	},

	/**
	 * Generates the Avatar template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getAvatarTemplate(internalField: InternalFieldBlock): string {
		let avatarId;
		if (internalField._flexId) {
			avatarId = internalField._flexId;
		} else if (internalField.idPrefix) {
			avatarId = generate([internalField.idPrefix, "Field-content"]);
		}

		const avatarVisible = FieldTemplating.getVisibleExpression(internalField.dataModelPath);
		const avatarSrc = FieldTemplating.getValueBinding(internalField.dataModelPath, {});

		return xml`
				<controls:FormElementWrapper
					xmlns:controls="sap.fe.core.controls"
					visible="${avatarVisible}"
				>
				<Avatar
					xmlns="sap.m"
					id="${avatarId}"
					src="${avatarSrc}"
					displaySize="S"
					class="sapUiSmallMarginEnd"
					displayShape="Square"
					imageFitType="Contain"
				/>
			</controls:FormElementWrapper>`;
	},

	/**
	 * Generates the button template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getButtonTemplate: (internalField: InternalFieldBlock): string => {
		const icon = internalField.formatOptions?.showIconUrl ?? false ? internalField.convertedDataField.IconUrl : undefined;
		const text = !(internalField.formatOptions?.showIconUrl ?? false) ? internalField.convertedDataField.Label : undefined;
		const tooltip = internalField.formatOptions?.showIconUrl ?? false ? internalField.convertedDataField.Label : undefined;

		let buttonPress;
		let buttonIsBound;
		let buttonOperationAvailable;
		let buttonOperationAvailableFormatted;
		let navigationAvailable;

		if (internalField.convertedDataField.$Type === UIAnnotationTypes.DataFieldForAction) {
			//Qualms: the getObject is a bad practice, but for now it´s fine as an intermediate step to avoid refactoring of the helper in addition
			const dataFieldObject = internalField.dataField.getObject();
			buttonPress = FieldHelper.getPressEventForDataFieldActionButton(internalField, dataFieldObject);

			buttonIsBound = internalField.convertedDataField.ActionTarget ? internalField.convertedDataField.ActionTarget.isBound : true;
			buttonOperationAvailable = internalField.convertedDataField.ActionTarget
				? internalField.convertedDataField.ActionTarget.annotations?.Core?.OperationAvailable
				: "false";
			buttonOperationAvailableFormatted = internalField.convertedDataField.ActionTarget ? undefined : "false";

			if (buttonOperationAvailable && buttonOperationAvailable !== "false") {
				const actionTarget = internalField.convertedDataField.ActionTarget as Action;
				const bindingParamName = actionTarget.parameters[0].name;
				//QUALMS, needs to be checked whether this makes sense at that place, might be good in a dedicated helper function
				buttonOperationAvailableFormatted = compileExpression(
					getExpressionFromAnnotation(
						buttonOperationAvailable as PropertyAnnotationValue<boolean>,
						[],
						undefined,
						(path: string) => {
							if (path.startsWith(bindingParamName)) {
								return path.replace(bindingParamName + "/", "");
							}
							return path;
						}
					)
				);
			}
		}

		if (internalField.convertedDataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) {
			buttonPress = CommonHelper.getPressHandlerForDataFieldForIBN(internalField.dataField.getObject(), undefined, undefined);
			navigationAvailable = true;
			if (
				internalField.convertedDataField?.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation &&
				internalField.convertedDataField.NavigationAvailable !== undefined &&
				String(internalField.formatOptions.ignoreNavigationAvailable) !== "true"
			) {
				navigationAvailable = compileExpression(getExpressionFromAnnotation(internalField.convertedDataField.NavigationAvailable));
			}
		}

		let button = "";
		if (internalField.convertedDataField.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) {
			button = xml`<Button
				xmlns="sap.m"
				visible="${internalField.visible}"
				text="${text}"
				icon="${icon}"
				enabled="${navigationAvailable}"
				tooltip="${tooltip}"
				press="${buttonPress}"
			/>`;
		} else if (
			FieldHelper.isDataFieldActionButtonVisible(this, internalField.convertedDataField, buttonIsBound, buttonOperationAvailable)
		) {
			const enabled = FieldHelper.isDataFieldActionButtonEnabled(
				internalField.convertedDataField,
				buttonIsBound as unknown as boolean,
				buttonOperationAvailable,
				buttonOperationAvailableFormatted as string
			);
			const type = buildExpressionForCriticalityButtonType(internalField.dataModelPath);

			button = xml`<Button
				xmlns="sap.m"
			    class="${internalField.class}"
				text="${text}"
				icon="${icon}"
				tooltip="${tooltip}"
				press="${buttonPress}"
				enabled="${enabled}"
				visible="${internalField.visible}"
				type="${type}"
				/>`;
		}
		return button;
	},

	/**
	 * Generates the Contact template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getContactTemplate(internalField: InternalFieldBlock) {
		const contextMetaPath = internalField.dataField.getModel().createBindingContext("Target/$AnnotationPath", internalField.dataField);
		const contactVisible = FieldTemplating.getVisibleExpression(internalField.dataModelPath);
		return xml`
		<macros:Contact
			idPrefix="${internalField.idPrefix}"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			metaPath="${contextMetaPath}"
			contextPath="${internalField.entitySet}"
			_flexId="${internalField._flexId}"
			visible="${contactVisible}"
			showEmptyIndicator="${internalField.formatOptions.showEmptyIndicator}"
		/>`;
	},

	/**
	 * Generates the innerpart of the data point to be used in getDataPointTemplate.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @param withConditionalWrapper Boolean value to determine whether the DataPoint
	 * 					  			shall be generated for the conditional wrapper case
	 * @returns An XML-based string with the definition of the field control
	 */
	getDataPointInnerPart(internalField: InternalFieldBlock, withConditionalWrapper: boolean) {
		const convertedDataField = MetaModelConverter.convertMetaModelContext(internalField.dataField) as DataFieldAbstractTypes;

		const metaPath =
			convertedDataField.$Type === UIAnnotationTypes.DataFieldForAnnotation
				? internalField.dataField.getModel().createBindingContext("Target/$AnnotationPath", internalField.dataField)
				: internalField.dataField;

		const formatOptions = xml`<internalMacro:formatOptions
				xmlns:internalMacro="sap.fe.macros.internal"
				measureDisplayMode="${internalField.formatOptions.measureDisplayMode}"
				showEmptyIndicator="${internalField.formatOptions.showEmptyIndicator}"
				isAnalytics="${internalField.formatOptions.isAnalytics}"
			/>`;

		return xml`<internalMacro:DataPoint
			xmlns:internalMacro="sap.fe.macros.internal"
			idPrefix="${internalField.idPrefix}"
			visible="${!withConditionalWrapper ? internalField.displayVisible : ""}"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			_flexId="${internalField._flexId}"
			metaPath="${metaPath}"
			contextPath="${internalField.entitySet}"
		>
			${formatOptions}
		</internalMacro:DataPoint>`;
	},

	/**
	 * Generates the DataPoint template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getDataPointTemplate(internalField: InternalFieldBlock): string {
		if ((internalField.formatOptions.isAnalytics ?? false) && (internalField.hasUnitOrCurrency ?? false)) {
			return xml`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${
				internalField.displayVisible
			}" condition="${internalField.hasValidAnalyticalCurrencyOrUnit}">
				<controls:contentTrue>
					 ${this.getDataPointInnerPart(internalField, true)}
				</controls:contentTrue>
					<controls:contentFalse>
						<Text xmlns="sap.m" text="*" />
				</controls:contentFalse>
			</controls:ConditionalWrapper>`;
		} else {
			return this.getDataPointInnerPart(internalField, false);
		}
	},

	/**
	 * Generates the ExpandableText template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getExpandableText(internalField: InternalFieldBlock) {
		return xml`
			<ExpandableText
				xmlns="sap.m"
				id="${internalField?.noWrapperId}"
				visible="${internalField?.displayVisible}"
				text="${internalField?.text}"
				overflowMode="${internalField?.formatOptions?.textExpandBehaviorDisplay}"
				maxCharacters="${internalField?.formatOptions?.textMaxCharactersDisplay}"
				emptyIndicatorMode="${internalField?.emptyIndicatorMode}"
		/>`;
	},

	/**
	 * Generates the File template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getFileTemplate(internalField: InternalFieldBlock): string {
		let innerFilePart;

		const fileRelativePropertyPath = getContextRelativeTargetObjectPath(internalField.dataModelPath);
		const fileNameAnnotation = internalField.property.annotations.Core?.ContentDisposition?.Filename;
		let fileFilenameExpression;
		if (isPathAnnotationExpression(fileNameAnnotation)) {
			const fileNameDataModelPath = enhanceDataModelPath(internalField.dataModelPath, fileNameAnnotation.path);
			// This causes an expression parsing error: compileExpression(pathInModel(getContextRelativeTargetObjectPath(fileNameDataModelPath)));
			fileFilenameExpression = "{ path: '" + getContextRelativeTargetObjectPath(fileNameDataModelPath) + "' }";
		}
		const fileStreamNotEmpty = compileExpression(not(equal(pathInModel(`${fileRelativePropertyPath}@odata.mediaContentType`), null)));

		// FileWrapper
		const fileUploadUrl = FieldTemplating.getValueBinding(internalField.dataModelPath, {});
		const fileFilenamePath = (internalField.property.annotations.Core?.ContentDisposition?.Filename as PathAnnotationExpression<string>)
			?.path;
		const fileMediaType =
			internalField.property.annotations.Core?.MediaType &&
			compileExpression(getExpressionFromAnnotation(internalField.property.annotations.Core?.MediaType));

		// template:if
		const fileIsImage =
			!!internalField.property.annotations.UI?.IsImageURL ||
			!!internalField.property.annotations.UI?.IsImage ||
			/image\//i.test(internalField.property.annotations.Core?.MediaType?.toString() ?? "");

		// Avatar
		const fileAvatarSrc = FieldTemplating.getValueBinding(internalField.dataModelPath, {});

		// Icon
		const fileIconSrc = FieldHelper.getPathForIconSource(fileRelativePropertyPath);

		// Link
		const fileLinkText = FieldHelper.getFilenameExpr(fileFilenameExpression, "{sap.fe.i18n>M_FIELD_FILEUPLOADER_NOFILENAME_TEXT}");
		const fileLinkHref = FieldHelper.getDownloadUrl(fileUploadUrl ?? "");

		// Text
		const fileTextVisible = compileExpression(equal(pathInModel(`${fileRelativePropertyPath}@odata.mediaContentType`), null));

		let fileAcceptableMediaTypes;
		// FileUploader
		if (internalField.property.annotations.Core?.AcceptableMediaTypes) {
			const acceptedTypes = Array.from(internalField.property.annotations.Core.AcceptableMediaTypes as unknown as string[]).map(
				(type) => `'${type}'`
			);
			fileAcceptableMediaTypes = `{=odata.collection([${acceptedTypes.join(",")}])}`; // This does not feel right, but follows the logic of AnnotationHelper#value
		}
		const fileMaximumSize = FieldHelper.calculateMBfromByte(internalField.property.maxLength);

		if (fileIsImage) {
			innerFilePart = xml`
			<controls:avatar xmlns:controls="sap.fe.macros.controls">
				<Avatar
					xmlns="sap.m"
					visible="${internalField.displayVisible}"
					src="${fileAvatarSrc}"
					displaySize="S"
					class="sapUiSmallMarginEnd"
					displayShape="Square">
					<customData>
						<ImageCustomData paramName="xcache" />
					</customData>
				</Avatar>
			</controls:avatar>`;
		} else {
			innerFilePart = xml`
			<controls:icon xmlns:controls="sap.fe.macros.controls">
				<core:Icon src="${fileIconSrc}" class="sapUiSmallMarginEnd" visible="${fileStreamNotEmpty}" />
			</controls:icon>
			<controls:link>
				<Link
					xmlns="sap.m"
					text="${fileLinkText}"
					target="_blank"
					href="${fileLinkHref}"
					visible="${fileStreamNotEmpty}"
					wrapping="true"
				/>
			</controls:link>
			<controls:text>
				<Text xmlns="sap.m" emptyIndicatorMode="On" text="" visible="${fileTextVisible}" />
			</controls:text>`;
		}

		if (internalField.editMode !== FieldEditMode.Display) {
			const beforeDialogOpen = internalField.collaborationEnabled ? "FIELDRUNTIME.handleOpenUploader" : undefined;
			const afterDialogOpen = internalField.collaborationEnabled ? "FIELDRUNTIME.handleCloseUploader" : undefined;

			innerFilePart += xml`
			<controls:fileUploader xmlns:controls="sap.fe.macros.controls">
				<u:FileUploader
					xmlns:u="sap.ui.unified"
					name="FEV4FileUpload"
					visible="${internalField.editableExpression}"
					buttonOnly="true"
					iconOnly="true"
					multiple="false"
					tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_UPLOAD_BUTTON_TOOLTIP}"
					icon="sap-icon://upload"
					style="Transparent"
					sendXHR="true"
					useMultipart="false"
					sameFilenameAllowed="true"
					mimeType="${fileAcceptableMediaTypes}"
					typeMissmatch="FIELDRUNTIME.handleTypeMissmatch"
					maximumFileSize="${fileMaximumSize}"
					fileSizeExceed="FIELDRUNTIME.handleFileSizeExceed"
					uploadOnChange="false"
					uploadComplete="FIELDRUNTIME.handleUploadComplete($event, ${
						fileFilenameExpression || "undefined"
					}, '${fileRelativePropertyPath}', $controller)"
					httpRequestMethod="Put"
					change="FIELDRUNTIME.uploadStream($controller, $event)"
					beforeDialogOpen="${beforeDialogOpen}"
					afterDialogClose="${afterDialogOpen}"
					uploadStart="FIELDRUNTIME.handleOpenUploader"
				/>
			</controls:fileUploader>
			<controls:deleteButton>
				<Button
					xmlns="sap.m"
					icon="sap-icon://sys-cancel"
					type="Transparent"
					press="FIELDRUNTIME.removeStream($event, ${fileFilenameExpression || "undefined"}, '${fileRelativePropertyPath}', $controller)"
					tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_DELETE_BUTTON_TOOLTIP}"
					visible="${internalField.editableExpression}"
					enabled="${fileStreamNotEmpty}"
				/>
			</controls:deleteButton>`;
		}

		return xml`
			<controls:FileWrapper
				xmlns:controls="sap.fe.macros.controls"
				core:require="{FIELDRUNTIME: 'sap/fe/macros/field/FieldRuntime'}"
				visible="${internalField.visible}"
				uploadUrl="${fileUploadUrl}"
				propertyPath="${fileRelativePropertyPath}"
				filename="${fileFilenamePath}"
				mediaType="${fileMediaType}"
				fieldGroupIds="${internalField.fieldGroupIds}"
				validateFieldGroup="FIELDRUNTIME.onValidateFieldGroup($controller, $event)"
				customData:sourcePath="${internalField.dataSourcePath}"
			>${innerFilePart}</controls:FileWrapper>`;
	},

	/**
	 * Generates the Link template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLinkTemplate(internalField: InternalFieldBlock): string {
		let linkUrl;
		let linkPress;
		let iconUrl;
		let linkActived;

		switch (internalField.convertedDataField.$Type as string) {
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
				linkPress = CommonHelper.getPressHandlerForDataFieldForIBN(internalField.dataField.getObject());
				return xml`<Link
					xmlns="sap.m"
					id="${internalField.noWrapperId}"
					core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
					visible="${internalField.displayVisible}"
					text="${DisplayStyle.computeTextWithWhiteSpace(internalField)}"
					press="${linkPress}"
					ariaLabelledBy="${internalField.ariaLabelledBy}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;
			case UIAnnotationTypes.DataFieldWithNavigationPath:
				linkPress = `FieldRuntime.onDataFieldWithNavigationPath(\${$source>/}, $controller, '${
					(internalField.convertedDataField as DataFieldWithNavigationPath).Target.value
				}')`;
				return xml`<Link
					xmlns="sap.m"
					id="${internalField.noWrapperId}"
					core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
					visible="${internalField.displayVisible}"
					text="${internalField.text}"
					press="${linkPress}"
					ariaLabelledBy="${internalField.ariaLabelledBy}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;
			case UIAnnotationTypes.DataFieldWithAction:
				linkPress = FieldHelper.getPressEventForDataFieldActionButton(internalField, internalField.dataField.getObject());
				return xml`<Link
					xmlns="sap.m"
					id="${internalField.noWrapperId}"
					visible="${internalField.displayVisible}"
					text="${internalField.text}"
					press="${linkPress}"
					ariaLabelledBy="${internalField.ariaLabelledBy}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;
			case UIAnnotationTypes.DataFieldWithUrl:
				internalField.text = DisplayStyle.computeTextWithWhiteSpace(internalField);
				iconUrl = internalField.convertedDataField.IconUrl
					? compileExpression(
							getExpressionFromAnnotation(
								internalField.convertedDataField.IconUrl as unknown as PropertyAnnotationValue<String>
							)
					  )
					: undefined;
				const linkBinding = getExpressionFromAnnotation(
					(internalField.convertedDataField as DataFieldWithUrl).Url as unknown as PropertyAnnotationValue<String>
				);
				linkUrl = compileExpression(linkBinding);
				linkActived = compileExpression(not(equal(linkBinding, "")));
		}

		if (
			internalField.property.annotations?.Communication?.IsEmailAddress ||
			internalField.property.annotations?.Communication?.IsPhoneNumber
		) {
			const linkIsEmailAddress = internalField.property.annotations.Communication?.IsEmailAddress !== undefined;
			const linkIsPhoneNumber = internalField.property.annotations.Communication?.IsPhoneNumber !== undefined;
			const propertyValueBinding = FieldTemplating.getValueBinding(internalField.dataModelPath, {});
			const mailBlockId = internalField.noWrapperId ? internalField.noWrapperId : `mailBlock${uid()}`;
			if (linkIsEmailAddress) {
				linkUrl = `mailto:${propertyValueBinding}`;
				return xml`<macros:Email
					xmlns:macros="sap.fe.macros"
					id="${mailBlockId}"
					visible="${internalField.displayVisible}"
					text="${internalField.text}"
					mail="${propertyValueBinding}"
					enabled="${linkActived}"
					ariaLabelledBy="${internalField.ariaLabelledBy}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				/>`;
			}
			if (linkIsPhoneNumber) {
				linkUrl = `tel:${propertyValueBinding}`;
				return xml`<Link
					xmlns="sap.m"
					id="${internalField.noWrapperId}"
					core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
					visible="${internalField.displayVisible}"
					text="${DisplayStyle.computeTextWithWhiteSpace(internalField)}"
					href="${linkUrl}"
					enabled="${linkActived}"
					ariaLabelledBy="${internalField.ariaLabelledBy}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>`;
			}
		}

		if (iconUrl) {
			return xml`<ObjectStatus
				xmlns="sap.m"
				core:require="{WSR: 'sap/base/strings/whitespaceReplacer', FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				id="${internalField.noWrapperId}"
				icon="${iconUrl}"
				visible="${internalField.displayVisible}"
				text="${internalField.text}"
				press="FieldRuntime.openExternalLink"
				active="${linkActived}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				ariaLabelledBy="${internalField.ariaLabelledBy}"
				customData:url="${linkUrl}"
			/>`;
		} else {
			return xml`<Link
				xmlns="sap.m"
				id="${internalField.noWrapperId}"
				core:require="{WSR: 'sap/base/strings/whitespaceReplacer'}"
				visible="${internalField.displayVisible}"
				text="${internalField.text}"
				href="${linkUrl}"
				enabled="${linkActived}"
				target="_top"
				wrapping="${internalField.wrap === undefined ? true : internalField.wrap}"
				ariaLabelledBy="${internalField.ariaLabelledBy}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
			/>`;
		}
	},

	/**
	 * Generates the LinkWithQuickView template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLinkWithQuickViewTemplate(internalField: InternalFieldBlock): string {
		const text = internalField.formatOptions.retrieveTextFromValueList
			? internalField.textFromValueList
			: DisplayStyle.computeTextWithWhiteSpace(internalField);

		return xml`<Link
			xmlns="sap.m"
			xmlns:core="sap.ui.core"
			id="${internalField.noWrapperId}"
			core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime', WSR: 'sap/base/strings/whitespaceReplacer'}"
			text="${text}"
			visible="${internalField.displayVisible}"
			wrapping="${internalField.wrap === undefined ? true : internalField.wrap}"
			press="FieldRuntime.pressLink"
			ariaLabelledBy="${internalField.ariaLabelledBy}"
			emptyIndicatorMode="${internalField.emptyIndicatorMode}"
			customData:loadValue="${internalField.valueAsStringBindingExpression}"
		>
			<dependents>
				<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${internalField.dataField}" semanticObject="${
					internalField.semanticObject
				}" contextPath="${internalField.entitySet}" />
			</dependents>
		</Link>`;
	},

	/**
	 * Generates the Text template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTextTemplate(internalField: InternalFieldBlock) {
		if (internalField.formatOptions.isAnalytics && internalField.hasUnitOrCurrency) {
			return xml`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls" visible="${internalField.displayVisible}" condition="${internalField.hasValidAnalyticalCurrencyOrUnit}">
			<controls:contentTrue>
					<Text xmlns="sap.m"
						id="${internalField.noWrapperId}"
						text="${internalField.text}"
						emptyIndicatorMode="${internalField.emptyIndicatorMode}"
						renderWhitespace="true"
						wrapping="${internalField.wrap}"
					/>
				</controls:contentTrue>
				<controls:contentFalse>
					<Text xmlns="sap.m" id="${internalField.noWrapperId}" text="*" />
				</controls:contentFalse>
			</controls:ConditionalWrapper>
		`;
		} else if (internalField.formatOptions.retrieveTextFromValueList) {
			return xml`<Text
				xmlns="sap.m"
				id="${internalField.noWrapperId}"
				visible="${internalField.displayVisible}"
				text="${internalField.textFromValueList}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				renderWhitespace="true"
			/>`;
		} else {
			return xml`<Text
				xmlns="sap.m"
				id="${internalField.noWrapperId}"
				visible="${internalField.displayVisible}"
				text="${internalField.text}"
				wrapping="${internalField.wrap}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				renderWhitespace="true"
		/>`;
		}
	},

	/**
	 * Generates the ObjectIdentifier template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getObjectIdentifier(internalField: InternalFieldBlock) {
		const dependents = internalField.hasQuickView
			? xml`<dependents>
	<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${internalField.dataField}" semanticObject="${internalField.semanticObject}" contextPath="${internalField.entitySet}" />
</dependents>`
			: "";
		let identifier = xml`<ObjectIdentifier
	xmlns="sap.m"
	core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
	id="${internalField.noWrapperId}"
	title="${internalField.identifierTitle}"
	text="${internalField.identifierText}"
	titleActive="${internalField.hasQuickView}"
	titlePress="FieldRuntime.pressLink"
	ariaLabelledBy="${internalField.ariaLabelledBy}"
	emptyIndicatorMode="${internalField.emptyIndicatorMode}"
	customData:loadValue="${internalField.valueAsStringBindingExpression}">
${dependents}</ObjectIdentifier>`;
		if (internalField.hasSituationsIndicator) {
			identifier = xml`<HBox xmlns="sap.m" alignItems="Center" justifyContent="SpaceBetween" width="100%">
							${identifier}
							<SituationsIndicator
								xmlns="sap.fe.macros.internal.situations"
								entitySet="${internalField.entitySet}"
								propertyPath="${internalField.situationsIndicatorPropertyPath}"
							/>
						</HBox>`;
		}
		if (internalField.showErrorIndicator && internalField.showErrorObjectStatus) {
			identifier = xml`<VBox xmlns="sap.m">
				${identifier}
					<ObjectStatus
						xmlns="sap.m"
						visible="${internalField.showErrorObjectStatus}"
						class="sapUiSmallMarginBottom"
						text="{sap.fe.i18n>Contains_Errors}"
						state="Error"
					/>
			</VBox>`;
		}

		return xml`${identifier}`;
	},

	/**
	 * Generates the ObjectStatus template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getObjectStatus(internalField: InternalFieldBlock) {
		let objectStatus;
		const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField, internalField.entitySet);
		const enhancedValueDataModelPath = enhanceDataModelPath(dataModelObjectPath, dataModelObjectPath.targetObject.Value.path);
		const condition = hasValidAnalyticalCurrencyOrUnit(enhancedValueDataModelPath);
		const convertedDataField = MetaModelConverter.getInvolvedDataModelObjects(internalField.dataField);
		const criticalityIcon = buildExpressionForCriticalityIcon(convertedDataField);
		const state = buildExpressionForCriticalityColor(convertedDataField);

		const linkUrl = (internalField.convertedDataField as DataFieldWithUrl).Url
			? compileExpression(
					getExpressionFromAnnotation(
						(internalField.convertedDataField as DataFieldWithUrl).Url as unknown as PropertyAnnotationValue<String>
					)
			  )
			: undefined;

		if (internalField.formatOptions.isAnalytics && internalField.hasUnitOrCurrency) {
			objectStatus = xml`<controls:ConditionalWrapper xmlns:controls="sap.fe.macros.controls"
			id="${internalField.noWrapperId}"
			condition="${condition}"
		>
			<controls:contentTrue>
				<ObjectStatus
					xmlns="sap.m"
					icon="${criticalityIcon}"
					state="${state}"
					visible="${internalField.displayVisible}"
					text="${internalField.text}"
					emptyIndicatorMode="${internalField.emptyIndicatorMode}"
					class="sapMTextRenderWhitespaceWrap"
				/>
			</controls:contentTrue>
			<controls:contentFalse>
				<ObjectStatus xmlns="sap.m" text="*" visible="${internalField.displayVisible}" />
			</controls:contentFalse>
		</controls:ConditionalWrapper>`;
		} else {
			let dependents = "";
			let active = false;
			let pressAction;
			if (internalField.hasQuickView) {
				dependents = xml`<dependents>
					<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${internalField.dataField}" semanticObject="${internalField.semanticObject}" contextPath="${internalField.entitySet}" />
				</dependents>`;
				active = true;
				pressAction = "FieldRuntime.pressLink";
			}
			if (linkUrl) {
				active = true;
				pressAction = "FieldRuntime.openExternalLink";
			}

			objectStatus = xml`<ObjectStatus
				xmlns="sap.m"
				id="${internalField.noWrapperId}"
				icon="${criticalityIcon}"
				state="${state}"
				text="${internalField.text}"
				visible="${internalField.displayVisible}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				active="${active}"
				press="${pressAction}"
				customData:url="${linkUrl}"
				customData:loadValue="${internalField.valueAsStringBindingExpression}"
				ariaLabelledBy="${internalField.ariaLabelledBy}"
			>
			${dependents}
		</ObjectStatus>`;
		}

		return objectStatus;
	},

	/**
	 * Generates the LabelSemantickey template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLabelSemanticKey(internalField: InternalFieldBlock) {
		if (internalField.hasQuickView) {
			return xml`<Link
				xmlns="sap.m"
				text="${internalField.text}"
				wrapping="true"
				core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
				press="FieldRuntime.pressLink"
				ariaLabelledBy="${internalField.ariaLabelledBy}"
				emptyIndicatorMode="${internalField.emptyIndicatorMode}"
				customData:loadValue="${internalField.valueAsStringBindingExpression}">
					<dependents>
						<macro:QuickView xmlns:macro="sap.fe.macros" dataField="${internalField.dataField}" semanticObject="${internalField.semanticObject}" contextPath="${internalField.entitySet}" />
					</dependents>
				</Link>`;
		}

		return xml`<Label
				xmlns="sap.m"
				id="${internalField.noWrapperId}"
				visible="${internalField.displayVisible}"
				text="${internalField.identifierTitle}"
				design="Bold"/>`;
	},
	/**
	 * Generates the semantic key with draft indicator template.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getSemanticKeyWithDraftIndicatorTemplate(internalField: InternalFieldBlock) {
		let semanticKeyTemplate =
			internalField.formatOptions.semanticKeyStyle === "ObjectIdentifier"
				? DisplayStyle.getObjectIdentifier(internalField)
				: DisplayStyle.getLabelSemanticKey(internalField);
		if (!internalField.formatOptions.fieldGroupDraftIndicatorPropertyPath) {
			// if the draftIndicator is not handled at the fieldGroup level
			//TODO could this be a boolean no draftIndicator
			semanticKeyTemplate = xml`<controls:FormElementWrapper
										xmlns:controls="sap.fe.core.controls"
										visible="${internalField.displayVisible}">
										<VBox
										xmlns="sap.m"
										class="${FieldHelper.getMarginClass(internalField.formatOptions.compactSemanticKey)}">
											${semanticKeyTemplate}
											<macro:DraftIndicator
												xmlns:macro="sap.fe.macros"
												draftIndicatorType="IconAndText"
												entitySet="${internalField.entitySet}"
												isDraftIndicatorVisible="${internalField.draftIndicatorVisible}"
												ariaLabelledBy="${internalField.ariaLabelledBy}"/>
										</VBox>
									</controls:FormElementWrapper>`;
		}
		return semanticKeyTemplate;
	},

	/**
	 * Computes the text property with the appropriate white space handling.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	computeTextWithWhiteSpace(internalField: InternalFieldBlock): CompiledBindingToolkitExpression {
		const text = FieldTemplating.getTextBinding(internalField.dataModelPath, internalField.formatOptions, true);
		return isPathInModelExpression(text) || typeof text === "string"
			? compileExpression(formatResult([text], "WSR"))
			: compileExpression(text);
	},

	/**
	 * Entry point for further templating processings.
	 *
	 * @param internalField Reference to the current internal field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplate: (internalField: InternalFieldBlock): string => {
		let innerFieldContent;
		switch (internalField.displayStyle as DisplayStyleType) {
			case "AmountWithCurrency":
				innerFieldContent = DisplayStyle.getAmountWithCurrencyTemplate(internalField);
				break;
			case "Avatar":
				innerFieldContent = DisplayStyle.getAvatarTemplate(internalField);
				break;
			case "Button":
				innerFieldContent = DisplayStyle.getButtonTemplate(internalField);
				break;
			case "Contact":
				innerFieldContent = DisplayStyle.getContactTemplate(internalField);
				break;
			case "DataPoint":
				innerFieldContent = DisplayStyle.getDataPointTemplate(internalField);
				break;
			case "ExpandableText":
				innerFieldContent = DisplayStyle.getExpandableText(internalField);
				break;
			case "File":
				innerFieldContent = DisplayStyle.getFileTemplate(internalField);
				break;
			case "Link":
				innerFieldContent = DisplayStyle.getLinkTemplate(internalField);
				break;
			case "LinkWithQuickView":
				innerFieldContent = DisplayStyle.getLinkWithQuickViewTemplate(internalField);
				break;
			case "ObjectIdentifier":
				innerFieldContent = DisplayStyle.getObjectIdentifier(internalField);
				break;
			case "ObjectStatus": {
				innerFieldContent = DisplayStyle.getObjectStatus(internalField);
				break;
			}
			case "LabelSemanticKey":
				innerFieldContent = DisplayStyle.getLabelSemanticKey(internalField);
				break;
			case "SemanticKeyWithDraftIndicator":
				innerFieldContent = DisplayStyle.getSemanticKeyWithDraftIndicatorTemplate(internalField);
				break;
			case "Text":
				innerFieldContent = DisplayStyle.getTextTemplate(internalField);
				break;
		}

		return innerFieldContent;
	}
};

export default DisplayStyle;
