import type { Action, EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import type { LineItem } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { ActionParameterInfo } from "sap/fe/core/ActionRuntime";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import type MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import operations from "sap/fe/core/controllerextensions/editFlow/operations";
import sticky from "sap/fe/core/controllerextensions/editFlow/sticky";
import messageHandling from "sap/fe/core/controllerextensions/messageHandler/messageHandling";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type { DeleteOption } from "sap/fe/core/helpers/DeleteHelper";
import deleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import FELibrary from "sap/fe/core/library";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type { $PopoverSettings } from "sap/m/Popover";
import Popover from "sap/m/Popover";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import Fragment from "sap/ui/core/Fragment";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";
import coreLibrary from "sap/ui/core/library";
import type Message from "sap/ui/core/message/Message";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import type Field from "sap/ui/mdc/Field";
import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type Binding from "sap/ui/model/Binding";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { isDataFieldForAction } from "../../converters/annotations/DataField";
import { getNonComputedVisibleFields, getRequiredPropertiesFromInsertRestrictions } from "../../helpers/MetaModelFunction";
import toES6Promise from "../../helpers/ToES6Promise";
import { isNavigationProperty } from "../../helpers/TypeGuards";

const CreationMode = FELibrary.CreationMode;
const ProgrammingModel = FELibrary.ProgrammingModel;

//Enums for delete text calculations for delete confirm dialog.
const DeleteOptionTypes = deleteHelper.DeleteOptionTypes;
const DeleteDialogContentControl = deleteHelper.DeleteDialogContentControl;

/* Make sure that the mParameters is not the oEvent */
function getParameters(mParameters: any) {
	if (mParameters && mParameters.getMetadata && mParameters.getMetadata().getName() === "sap.ui.base.Event") {
		mParameters = {};
	}
	return mParameters || {};
}

class TransactionHelper {
	busyLock(appComponent: AppComponent, busyPath?: string) {
		BusyLocker.lock(appComponent.getModel("ui"), busyPath);
	}

	busyUnlock(appComponent: AppComponent, busyPath?: string) {
		BusyLocker.unlock(appComponent.getModel("ui"), busyPath);
	}

	getProgrammingModel(source: ODataV4Context | Binding): typeof ProgrammingModel {
		let path: string;
		if (source.isA<ODataV4Context>("sap.ui.model.odata.v4.Context")) {
			path = source.getPath();
		} else {
			path = (source.isRelative() ? source.getResolvedPath() : source.getPath()) ?? "";
		}

		const metaModel = source.getModel().getMetaModel() as ODataMetaModel;
		if (ModelHelper.isDraftSupported(metaModel, path)) {
			return ProgrammingModel.Draft;
		} else if (ModelHelper.isStickySessionSupported(metaModel)) {
			return ProgrammingModel.Sticky;
		} else {
			return ProgrammingModel.NonDraft;
		}
	}

	/**
	 * Validates a document.
	 *
	 * @param oContext Context of the document to be validated
	 * @param [mParameters] Can contain the following attributes:
	 * @param [mParameters.data] A map of data that should be validated
	 * @param [mParameters.customValidationFunction] A string representing the path to the validation function
	 * @param oView Contains the object of the current view
	 * @returns Promise resolves with result of the custom validation function
	 * @final
	 */
	validateDocument(oContext: ODataV4Context, mParameters: any, oView: View): Promise<any> {
		const sCustomValidationFunction = mParameters && mParameters.customValidationFunction;
		if (sCustomValidationFunction) {
			const sModule = sCustomValidationFunction.substring(0, sCustomValidationFunction.lastIndexOf(".") || -1).replace(/\./gi, "/"),
				sFunctionName = sCustomValidationFunction.substring(
					sCustomValidationFunction.lastIndexOf(".") + 1,
					sCustomValidationFunction.length
				),
				mData = mParameters.data;
			delete mData["@$ui5.context.isTransient"];
			return FPMHelper.validationWrapper(sModule, sFunctionName, mData, oView, oContext);
		}
		return Promise.resolve([]);
	}

	/**
	 * Retrieves defatul values from the DefaultValue function.
	 *
	 * @param listBinding The list binding to be used for creation
	 * @returns A promise with an object containing the default values (or undefined if there's no default value function)
	 */
	private async getDataFromDefaultValueFunction(listBinding: ODataListBinding): Promise<object | undefined> {
		const model = listBinding.getModel();
		const metaModel = model.getMetaModel();
		const metaContext = metaModel.getMetaContext(listBinding.getResolvedPath() as string);
		const listBindingObjectPath = getInvolvedDataModelObjects(metaContext);

		const defaultFuncOnTargetObject = (listBindingObjectPath.targetObject as NavigationProperty | EntitySet).annotations.Common
			?.DefaultValuesFunction;
		const defaultFuncOnTargetEntitySet = (listBindingObjectPath.targetEntitySet as EntitySet | undefined)?.annotations.Common
			?.DefaultValuesFunction;
		const defaultFunctionName = defaultFuncOnTargetObject ?? defaultFuncOnTargetEntitySet;

		if (!defaultFunctionName) {
			// No default value function
			return undefined;
		}

		const functionOnNavProp = isNavigationProperty(listBindingObjectPath.targetObject) && defaultFuncOnTargetObject !== undefined;
		const defaultFunctionContext = functionOnNavProp ? listBinding.getContext() : listBinding.getHeaderContext();
		if (!defaultFunctionContext) {
			return undefined;
		}
		const defaultFunctionPath = `${metaModel.getMetaPath(defaultFunctionContext.getPath())}/${defaultFunctionName}`;

		const defaultFunctionObjectPath = getInvolvedDataModelObjects(metaModel.getMetaContext(defaultFunctionPath));
		const defaultFunctionResult = (defaultFunctionObjectPath.targetObject as Action)?.isBound
			? await operations.callBoundFunction(defaultFunctionName.toString(), defaultFunctionContext, model)
			: await operations.callFunctionImport(defaultFunctionName.toString(), model);

		return defaultFunctionResult.getObject();
	}

	/**
	 * Checks if a list binding corresponds to a hierarchy.
	 *
	 * @param listBinding
	 * @returns True if the list binding is hierarchical.
	 */
	isListBindingHierarchical(listBinding: ODataListBinding): boolean {
		return (listBinding.getAggregation() as { hierarchyQualifier?: string } | undefined)?.hierarchyQualifier ? true : false;
	}

	/**
	 * Creates a new context in a list binding. Handles both flat and hierarchical cases.
	 *
	 * @param listBinding
	 * @param initialData Initial data to create the context.
	 * @param options Creation options.
	 * @param options.createAtEnd Create the context at the end of the list (ignored in case of a hierarchy).
	 * @param options.createInactive Create the context as inactive (ignored in case of a hierarchy).
	 * @param options.parentContext Create the context as a	 child of this context (ony used in case of a hierarchy).
	 * @returns The created context.
	 */
	private async createContext(
		listBinding: ODataListBinding,
		initialData: object | undefined,
		options: { createAtEnd?: boolean; createInactive?: boolean; parentContext?: ODataV4Context }
	): Promise<ODataV4Context> {
		const dataForCreation = initialData ?? {};

		if (this.isListBindingHierarchical(listBinding)) {
			if (options.parentContext?.isExpanded() === false) {
				// If the parent context already has children and is collapsed, we expand it first
				await listBinding.expand(options.parentContext);
			}
			Object.assign(dataForCreation, { "@$ui5.node.parent": options.parentContext });
			return listBinding.create(dataForCreation, true);
		} else {
			return listBinding.create(dataForCreation, true, options.createAtEnd, options.createInactive);
		}
	}

	getCreationParameters(listBinding: ODataListBinding, createData: object | undefined, appComponent: AppComponent): string[] {
		const metaModel = listBinding.getModel().getMetaModel();
		const metaPath = metaModel.getMetaPath(listBinding.getHeaderContext()!.getPath());

		const nonComputedVisibleFields = getNonComputedVisibleFields(metaModel, metaPath, appComponent);
		// Do not consider fields for which we provide some initial data
		return nonComputedVisibleFields.filter((fieldName) => {
			return !(fieldName in (createData ?? {}));
		});
	}

	/**
	 * Creates a new document.
	 *
	 * @param oMainListBinding OData V4 ListBinding object
	 * @param [mInParameters] Optional, can contain the following attributes:
	 * @param [mInParameters.data] A map of data that should be sent within the POST
	 * @param [mInParameters.busyMode] Global (default), Local, None TODO: to be refactored
	 * @param [mInParameters.busyId] ID of the local busy indicator
	 * @param [mInParameters.keepTransientContextOnFailed] If set, the context stays in the list if the POST failed and POST will be repeated with the next change
	 * @param [mInParameters.inactive] If set, the context is set as inactive for empty rows
	 * @param [mInParameters.skipParameterDialog] Skips the action parameter dialog
	 * @param appComponent The app component
	 * @param messageHandler The message handler extension
	 * @param fromCopyPaste True if the creation has been triggered by a paste action
	 * @returns Promise resolves with new binding context
	 * @final
	 */
	async createDocument(
		oMainListBinding: ODataListBinding,
		mInParameters:
			| {
					data?: any;
					busyMode?: string;
					busyId?: string;
					keepTransientContextOnFailed?: boolean;
					parentControl: Control;
					inactive?: boolean;
					beforeCreateCallBack?: Function;
					skipParameterDialog?: boolean;
					creationMode?: string;
					createAtEnd?: boolean;
					parentContext?: ODataV4Context;
			  }
			| undefined,
		appComponent: AppComponent,
		messageHandler: MessageHandler,
		fromCopyPaste: boolean
	): Promise<ODataV4Context> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const oModel = oMainListBinding.getModel(),
			oMetaModel = oModel.getMetaModel(),
			sMetaPath = oMetaModel.getMetaPath(oMainListBinding.getHeaderContext()!.getPath()),
			sCreateHash = appComponent.getRouterProxy().getHash(),
			oComponentData = appComponent.getComponentData(),
			oStartupParameters = (oComponentData && oComponentData.startupParameters) || {},
			sNewAction = !oMainListBinding.isRelative()
				? this._getNewAction(oStartupParameters, sCreateHash, oMetaModel, sMetaPath)
				: undefined;
		const mBindingParameters: any = { $$patchWithoutSideEffects: true };
		const sMessagesPath = oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
		let sBusyPath = "/busy";

		let oNewDocumentContext: ODataV4Context | undefined;

		if (sMessagesPath) {
			mBindingParameters["$select"] = sMessagesPath;
		}
		const mParameters = getParameters(mInParameters);
		if (!oMainListBinding) {
			throw new Error("Binding required for new document creation");
		}
		const sProgrammingModel = this.getProgrammingModel(oMainListBinding);
		if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
			throw new Error("Create document only allowed for draft or sticky session supported services");
		}
		if (mParameters.busyMode === "Local") {
			sBusyPath = `/busyLocal/${mParameters.busyId}`;
		}
		mParameters.beforeCreateCallBack = fromCopyPaste ? null : mParameters.beforeCreateCallBack;
		if (!mInParameters?.inactive) {
			this.busyLock(appComponent, sBusyPath);
		}
		const oResourceBundleCore = Core.getLibraryResourceBundle("sap.fe.core");
		let oResult: any;

		try {
			if (sNewAction) {
				oResult = await this.callAction(
					sNewAction,
					{
						contexts: oMainListBinding.getHeaderContext(),
						showActionParameterDialog: true,
						label: this._getSpecificCreateActionDialogLabel(oMetaModel, sMetaPath, sNewAction, oResourceBundleCore),
						bindingParameters: mBindingParameters,
						parentControl: mParameters.parentControl,
						bIsCreateAction: true,
						skipParameterDialog: mParameters.skipParameterDialog
					},
					null,
					appComponent,
					messageHandler
				);
			} else {
				try {
					const initialData = mParameters.data;
					if (!fromCopyPaste) {
						const defaultValueFunctionData = await this.getDataFromDefaultValueFunction(oMainListBinding);
						mParameters.data = Object.assign({}, defaultValueFunctionData, mParameters.data);
					}
					if (mParameters.data) {
						delete mParameters.data["@odata.context"];
					}

					const bIsNewPageCreation =
						mParameters.creationMode !== CreationMode.CreationRow && mParameters.creationMode !== CreationMode.Inline;
					const aNonComputedVisibleKeyFields = bIsNewPageCreation
						? this.getCreationParameters(oMainListBinding, initialData, appComponent)
						: [];
					if (aNonComputedVisibleKeyFields.length > 0) {
						oResult = await this._launchDialogWithKeyFields(
							oMainListBinding,
							aNonComputedVisibleKeyFields,
							oModel,
							mParameters,
							appComponent,
							messageHandler
						);
						oNewDocumentContext = oResult.newContext;
					} else {
						if (mParameters.beforeCreateCallBack) {
							await toES6Promise(
								mParameters.beforeCreateCallBack({
									contextPath: oMainListBinding && oMainListBinding.getPath()
								})
							);
						}

						oNewDocumentContext = await this.createContext(oMainListBinding, mParameters.data, {
							createAtEnd: !!mParameters.createAtEnd,
							createInactive: !!mParameters.inactive,
							parentContext: mParameters.parentContext
						});

						if (!mParameters.inactive) {
							oResult = await this.onAfterCreateCompletion(oMainListBinding, oNewDocumentContext, mParameters);
						}
					}
				} catch (oError: any) {
					Log.error("Error while creating the new document", oError);
					throw oError;
				}
			}

			oNewDocumentContext = oNewDocumentContext || oResult;

			await messageHandler.showMessageDialog({ control: mParameters.parentControl });
			return oNewDocumentContext!;
		} catch (error: unknown) {
			// TODO: currently, the only errors handled here are raised as string - should be changed to Error objects
			await messageHandler.showMessageDialog({ control: mParameters.parentControl });
			if (
				(error === FELibrary.Constants.ActionExecutionFailed || error === FELibrary.Constants.CancelActionDialog) &&
				oNewDocumentContext?.isTransient()
			) {
				// This is a workaround suggested by model as Context.delete results in an error
				// TODO: remove the $direct once model resolves this issue
				// this line shows the expected console error Uncaught (in promise) Error: Request canceled: POST Travel; group: submitLater
				oNewDocumentContext.delete("$direct");
			}
			throw error;
		} finally {
			if (!mInParameters?.inactive) {
				this.busyUnlock(appComponent, sBusyPath);
			}
		}
	}

	_isDraftEnabled(vContexts: ODataV4Context[]) {
		const contextForDraftModel = vContexts[0];
		const sProgrammingModel = this.getProgrammingModel(contextForDraftModel);
		return sProgrammingModel === ProgrammingModel.Draft;
	}

	/**
	 * Delete one or multiple document(s).
	 *
	 * @param contexts Contexts Either one context or an array with contexts to be deleted
	 * @param mParameters Optional, can contain the following attributes:
	 * @param mParameters.title Title of the object to be deleted
	 * @param mParameters.description Description of the object to be deleted
	 * @param mParameters.numberOfSelectedContexts Number of objects selected
	 * @param mParameters.noDialog To disable the confirmation dialog
	 * @param appComponent The appComponent
	 * @param resourceModel The resource model to load text resources
	 * @param messageHandler The message handler extension
	 * @returns A Promise resolved once the documents are deleted
	 */
	deleteDocument(
		contexts: ODataV4Context | ODataV4Context[],
		mParameters: any,
		appComponent: AppComponent,
		resourceModel: ResourceModel,
		messageHandler: MessageHandler
	) {
		// delete document lock
		this.busyLock(appComponent);

		const contextsToDelete = Array.isArray(contexts) ? [...contexts] : [contexts];

		return new Promise<void>((resolve, reject) => {
			try {
				const draftEnabled = this._isDraftEnabled(mParameters.selectedContexts || contextsToDelete);
				const items: any[] = [];
				let options: DeleteOption[] = [];
				let unSavedContext: Context | undefined;

				// items(texts) and options(checkBoxes and single default option) for confirm dialog.
				if (mParameters) {
					if (!mParameters.numberOfSelectedContexts) {
						// non-Table
						if (draftEnabled) {
							// Check if 1 of the drafts is locked by another user
							const lockedContext = contextsToDelete.find((context) => {
								const contextData = context.getObject();
								return (
									contextData.IsActiveEntity === true &&
									contextData.HasDraftEntity === true &&
									contextData.DraftAdministrativeData &&
									contextData.DraftAdministrativeData.InProcessByUser &&
									!contextData.DraftAdministrativeData.DraftIsCreatedByMe
								);
							});
							if (lockedContext) {
								// Show message box with the name of the locking user and return
								const lockingUserName = lockedContext.getObject().DraftAdministrativeData.InProcessByUser;
								MessageBox.show(
									resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_SINGLE_OBJECT_LOCKED", [
										lockingUserName
									]),
									{
										title: resourceModel.getText("C_COMMON_DELETE"),
										onClose: reject
									}
								);
								return;
							} else {
								unSavedContext = contextsToDelete.find((context) => {
									const { IsActiveEntity, HasDraftEntity, DraftAdministrativeData } = context.getObject() || {};
									return IsActiveEntity === true && HasDraftEntity === true && !!DraftAdministrativeData?.InProcessByUser;
								});
							}
						}
						mParameters = getParameters(mParameters);
						let nonTableTxt = "";
						if (unSavedContext) {
							const unSavedContextUser = unSavedContext.getObject().DraftAdministrativeData.InProcessByUser;
							nonTableTxt = resourceModel.getText(
								"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_CHANGES",
								[unSavedContextUser],
								mParameters.entitySetName
							);
						} else if (mParameters.title) {
							if (mParameters.description) {
								nonTableTxt = resourceModel.getText(
									"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO",
									[mParameters.title, mParameters.description],
									mParameters.entitySetName
								);
							} else {
								nonTableTxt = resourceModel.getText(
									"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_ONLY",
									[mParameters.title],
									mParameters.entitySetName
								);
							}
						} else {
							nonTableTxt = resourceModel.getText(
								"C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR",
								undefined,
								mParameters.entitySetName
							);
						}
						options.push({
							type: DeleteOptionTypes.deletableContexts,
							contexts: contextsToDelete,
							text: nonTableTxt,
							selected: true,
							control: DeleteDialogContentControl.TEXT
						});
					} else {
						// Table
						let totalDeletable = contextsToDelete.length;

						if (draftEnabled) {
							totalDeletable +=
								mParameters.draftsWithNonDeletableActive.length +
								mParameters.draftsWithDeletableActive.length +
								mParameters.unSavedContexts.length;
							deleteHelper.updateDraftOptionsForDeletableTexts(
								mParameters,
								contextsToDelete,
								totalDeletable,
								resourceModel,
								items,
								options
							);
						} else {
							const nonDeletableText = deleteHelper.getNonDeletableText(mParameters, totalDeletable, resourceModel);
							if (nonDeletableText) {
								items.push(nonDeletableText);
							}
						}

						const optionsDeletableTexts = deleteHelper.getOptionsForDeletableTexts(
							mParameters,
							contextsToDelete,
							resourceModel
						);
						options = [...options, ...optionsDeletableTexts];
					}
				}

				const commonBinding = (mParameters.selectedContexts ?? contextsToDelete)[0].getBinding() as Binding;
				const inTreeTable =
					commonBinding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding") &&
					this.isListBindingHierarchical(commonBinding);

				// Content of Delete Dialog
				deleteHelper.updateContentForDeleteDialog(options, items);
				const fnConfirm = async () => {
					messageHandling.removeBoundTransitionMessages();
					this.busyLock(appComponent);

					try {
						await deleteHelper.deleteConfirmHandler(
							options,
							mParameters,
							messageHandler,
							resourceModel,
							appComponent,
							draftEnabled,
							inTreeTable
						);
						resolve();
					} catch (oError: any) {
						reject();
					} finally {
						this.busyUnlock(appComponent);
					}
				};

				const dialog = this.createDeleteDialog(items, mParameters, resourceModel, fnConfirm, reject);

				if (mParameters.noDialog) {
					fnConfirm();
				} else {
					dialog.addStyleClass("sapUiContentPadding");
					dialog.open();
				}
			} finally {
				// delete document unlock
				this.busyUnlock(appComponent);
			}
		});
	}

	/**
	 * Create the confirmation dialog fo the deletion.
	 *
	 * @param items An array of controls used for the dialog content
	 * @param parameters Contains the following attributes:
	 * @param parameters.parentControl Parent control of the delete button if any
	 * @param parameters.entitySetName Name of the current entitySet
	 * @param resourceModel The resource model to load text resources
	 * @param fnConfirm Function executed upon the validation of the deletion
	 * @param fnReject Function executed if the dialog is closed via Cancel or Escape button
	 * @returns The created delete confirmation dialog
	 */
	createDeleteDialog(
		items: Control[],
		parameters: Partial<{ parentControl: Control | undefined; entitySetName: string }>,
		resourceModel: ResourceModel,
		fnConfirm: Function,
		fnReject: Function
	): Dialog {
		let dialogConfirmed = false;
		const vBox = new VBox({ items: items });
		const resourceBundleCore = Core.getLibraryResourceBundle("sap.fe.core");
		let title: string | undefined;
		if (parameters.parentControl?.isA("sap.ui.mdc.Table")) {
			title = resourceModel.getText("M_COMMON_TABLE_DELETE", undefined, parameters.entitySetName);
		} else {
			title = resourceBundleCore.getText("C_COMMON_DELETE");
		}
		const dialog = new Dialog({
			title: title,
			state: "Warning",
			content: [vBox],
			ariaLabelledBy: items,
			beginButton: new Button({
				text: title,
				type: "Emphasized",
				press: function (): void {
					dialogConfirmed = true;
					dialog.close();
					fnConfirm();
				}
			}),
			endButton: new Button({
				text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"),
				press: function (): void {
					dialog.close();
				}
			}),
			afterClose: function (): void {
				dialog.destroy();
				// if dialog is closed unconfirmed (e.g. via "Cancel" or Escape button), ensure to reject promise
				if (!dialogConfirmed) {
					fnReject();
				}
			}
		});
		return dialog;
	}

	/**
	 * Edits a document.
	 *
	 * @param oContext Context of the active document
	 * @param oView Current view
	 * @param appComponent The appComponent
	 * @param messageHandler The message handler extension
	 * @param groupId The batch groupId for post call of edit action
	 * @returns Promise resolves with the new draft context in case of draft programming model
	 * @final
	 */
	async editDocument(
		oContext: ODataV4Context,
		oView: View,
		appComponent: AppComponent,
		messageHandler: MessageHandler,
		groupId: string
	): Promise<ODataV4Context | undefined> {
		const sProgrammingModel = this.getProgrammingModel(oContext);
		if (!oContext) {
			throw new Error("Binding context to active document is required");
		}
		if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
			throw new Error("Edit is only allowed for draft or sticky session supported services");
		}
		this.busyLock(appComponent);
		// before triggering the edit action we'll have to remove all bound transition messages
		messageHandler.removeTransitionMessages();

		try {
			const oNewContext =
				sProgrammingModel === ProgrammingModel.Draft
					? await draft.createDraftFromActiveDocument(
							oContext,
							appComponent,
							{
								bPreserveChanges: true,
								oView: oView
							},
							groupId
					  )
					: await sticky.editDocumentInStickySession(oContext, appComponent);

			await messageHandler.showMessageDialog();
			return oNewContext;
		} catch (err: any) {
			await messageHandler.showMessages({ concurrentEditFlag: true });
			throw err;
		} finally {
			this.busyUnlock(appComponent);
		}
	}

	/**
	 * Cancel 'edit' mode of a document.
	 *
	 * @param oContext Context of the document to be canceled or deleted
	 * @param [mInParameters] Optional, can contain the following attributes:
	 * @param mInParameters.cancelButton Cancel Button of the discard popover (mandatory for now)
	 * @param mInParameters.skipDiscardPopover Optional, supresses the discard popover incase of draft applications while navigating out of OP
	 * @param appComponent The appComponent
	 * @param resourceModel The model to load text resources
	 * @param messageHandler The message handler extension
	 * @param isNewObject True if we're trying to cancel a newly created object
	 * @param isObjectModified True if the object has been modified by the user
	 * @returns Promise resolves with ???
	 * @final
	 */
	async cancelDocument(
		oContext: ODataV4Context,
		mInParameters: { cancelButton: Button; skipDiscardPopover: boolean } | undefined,
		appComponent: AppComponent,
		resourceModel: ResourceModel,
		messageHandler: MessageHandler,
		isNewObject: boolean,
		isObjectModified: boolean
	): Promise<ODataV4Context | boolean> {
		//context must always be passed - mandatory parameter
		if (!oContext) {
			throw new Error("No context exists. Pass a meaningful context");
		}
		this.busyLock(appComponent);
		const mParameters = getParameters(mInParameters);
		const oModel = oContext.getModel();
		const sProgrammingModel = this.getProgrammingModel(oContext);

		if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
			throw new Error("Cancel document only allowed for draft or sticky session supported services");
		}
		try {
			let returnedValue: ODataV4Context | boolean = false;

			if (sProgrammingModel === ProgrammingModel.Draft && !isObjectModified) {
				const draftDataContext = oModel.bindContext(`${oContext.getPath()}/DraftAdministrativeData`).getBoundContext();
				const draftAdminData = await draftDataContext.requestObject();
				if (draftAdminData) {
					isObjectModified = draftAdminData.CreationDateTime !== draftAdminData.LastChangeDateTime;
				}
			}
			if (!mParameters.skipDiscardPopover) {
				await this._confirmDiscard(mParameters.cancelButton, isObjectModified, resourceModel);
			}
			if (oContext.isKeepAlive()) {
				// if the context is kept alive we set it again to detach the onBeforeDestroy callback and handle navigation here
				// the context needs to still be kept alive to be able to reset changes properly
				oContext.setKeepAlive(true, undefined);
			}
			if (mParameters.beforeCancelCallBack) {
				await mParameters.beforeCancelCallBack({ context: oContext });
			}
			if (sProgrammingModel === ProgrammingModel.Draft) {
				if (isNewObject) {
					if (oContext.hasPendingChanges()) {
						oContext.getBinding().resetChanges();
					}
					returnedValue = await draft.deleteDraft(oContext, appComponent);
				} else {
					const oSiblingContext = oModel.bindContext(`${oContext.getPath()}/SiblingEntity`).getBoundContext();
					try {
						const sCanonicalPath = await oSiblingContext.requestCanonicalPath();
						if (oContext.hasPendingChanges()) {
							oContext.getBinding().resetChanges();
						}
						returnedValue = oModel.bindContext(sCanonicalPath).getBoundContext();
					} finally {
						await draft.deleteDraft(oContext, appComponent);
					}
				}
			} else {
				const discardedContext = await sticky.discardDocument(oContext);
				if (discardedContext) {
					if (discardedContext.hasPendingChanges()) {
						discardedContext.getBinding().resetChanges();
					}
					if (!isNewObject) {
						discardedContext.refresh();
						returnedValue = discardedContext;
					}
				}
			}

			// remove existing bound transition messages
			messageHandler.removeTransitionMessages();
			// show unbound messages
			await messageHandler.showMessages();
			return returnedValue;
		} catch (err: any) {
			await messageHandler.showMessages();
			throw err;
		} finally {
			this.busyUnlock(appComponent);
		}
	}

	/**
	 * Saves the document.
	 *
	 * @param context Context of the document to be saved
	 * @param appComponent The appComponent
	 * @param resourceModel The model to load text resources
	 * @param executeSideEffectsOnError True if we should execute side effects in case of an error
	 * @param bindingsForSideEffects The listBindings to be used for executing side effects on error
	 * @param messageHandler The message handler extension
	 * @param isNewObject True if we're trying to cancel a newly created object
	 * @returns Promise resolves with ???
	 * @final
	 */
	async saveDocument(
		context: ODataV4Context,
		appComponent: AppComponent,
		resourceModel: ResourceModel,
		executeSideEffectsOnError: boolean,
		bindingsForSideEffects: ODataListBinding[],
		messageHandler: MessageHandler,
		isNewObject: boolean
	): Promise<ODataV4Context> {
		const sProgrammingModel = this.getProgrammingModel(context);
		if (sProgrammingModel !== ProgrammingModel.Sticky && sProgrammingModel !== ProgrammingModel.Draft) {
			throw new Error("Save is only allowed for draft or sticky session supported services");
		}

		try {
			this.busyLock(appComponent);
			const oActiveDocument =
				sProgrammingModel === ProgrammingModel.Draft
					? await draft.activateDocument(context, appComponent, {}, messageHandler)
					: await sticky.activateDocument(context, appComponent);

			const messagesReceived = messageHandling.getMessages().concat(messageHandling.getMessages(true, true)); // get unbound and bound messages present in the model
			if (!(messagesReceived.length === 1 && messagesReceived[0].type === coreLibrary.MessageType.Success)) {
				// show our object creation toast only if it is not coming from backend
				MessageToast.show(
					isNewObject
						? resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_CREATED")
						: resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_SAVED")
				);
			}

			return oActiveDocument;
		} catch (err: any) {
			if (executeSideEffectsOnError && bindingsForSideEffects?.length > 0) {
				/* The sideEffects are executed only for table items in transient state */
				bindingsForSideEffects.forEach((listBinding) => {
					if (!CommonUtils.hasTransientContext(listBinding)) {
						appComponent.getSideEffectsService().requestSideEffectsForNavigationProperty(listBinding.getPath(), context);
					}
				});
			}
			await messageHandler.showMessages();
			throw err;
		} finally {
			this.busyUnlock(appComponent);
		}
	}

	/**
	 * Calls a bound or unbound action.
	 *
	 * @param sActionName The name of the action to be called
	 * @param [mParameters] Contains the following attributes:
	 * @param [mParameters.parameterValues] A map of action parameter names and provided values
	 * @param [mParameters.skipParameterDialog] Skips the parameter dialog if values are provided for all of them
	 * @param [mParameters.contexts] Mandatory for a bound action: Either one context or an array with contexts for which the action is to be called
	 * @param [mParameters.model] Mandatory for an unbound action: An instance of an OData V4 model
	 * @param [mParameters.invocationGrouping] Mode how actions are to be called: 'ChangeSet' to put all action calls into one changeset, 'Isolated' to put them into separate changesets
	 * @param [mParameters.label] A human-readable label for the action
	 * @param [mParameters.bGetBoundContext] If specified, the action promise returns the bound context
	 * @param oView Contains the object of the current view
	 * @param appComponent The appComponent
	 * @param messageHandler The message handler extension
	 * @returns Promise resolves with an array of response objects (TODO: to be changed)
	 * @final
	 */
	async callAction(
		sActionName: string,
		mParameters: any,
		oView: View | null,
		appComponent: AppComponent,
		messageHandler?: MessageHandler,
		disableStrictHandling?: boolean
	): Promise<any> {
		mParameters = getParameters(mParameters);
		let contextToProcess, oModel: any;
		const mBindingParameters = mParameters.bindingParameters;
		if (!sActionName) {
			throw new Error("Provide name of action to be executed");
		}
		// action imports are not directly obtained from the metaModel by it is present inside the entityContainer
		// and the acions it refers to present outside the entitycontainer, hence to obtain kind of the action
		// split() on its name was required
		const sName = sActionName.split("/")[1];
		sActionName = sName || sActionName;
		contextToProcess = sName ? undefined : mParameters.contexts;
		//checking whether the context is an array with more than 0 length or not an array(create action)
		if (contextToProcess && ((Array.isArray(contextToProcess) && contextToProcess.length) || !Array.isArray(contextToProcess))) {
			contextToProcess = Array.isArray(contextToProcess) ? contextToProcess[0] : contextToProcess;
			oModel = contextToProcess.getModel();
		}
		if (mParameters.model) {
			oModel = mParameters.model;
		}
		if (!oModel) {
			throw new Error("Pass a context for a bound action or pass the model for an unbound action");
		}
		// get the binding parameters $select and $expand for the side effect on this action
		// also gather additional property paths to be requested such as text associations
		const mSideEffectsParameters = appComponent.getSideEffectsService().getODataActionSideEffects(sActionName, contextToProcess) || {};

		try {
			let oResult: any;
			if (contextToProcess && oModel) {
				oResult = await operations.callBoundAction(sActionName, mParameters.contexts, oModel, appComponent, {
					parameterValues: mParameters.parameterValues,
					invocationGrouping: mParameters.invocationGrouping,
					label: mParameters.label,
					skipParameterDialog: mParameters.skipParameterDialog,
					mBindingParameters: mBindingParameters,
					entitySetName: mParameters.entitySetName,
					additionalSideEffect: mSideEffectsParameters,
					onSubmitted: () => {
						messageHandler?.removeTransitionMessages();
						this.busyLock(appComponent);
					},
					onResponse: () => {
						this.busyUnlock(appComponent);
					},
					parentControl: mParameters.parentControl,
					controlId: mParameters.controlId,
					internalModelContext: mParameters.internalModelContext,
					operationAvailableMap: mParameters.operationAvailableMap,
					bIsCreateAction: mParameters.bIsCreateAction,
					bGetBoundContext: mParameters.bGetBoundContext,
					bObjectPage: mParameters.bObjectPage,
					messageHandler: messageHandler,
					defaultValuesExtensionFunction: mParameters.defaultValuesExtensionFunction,
					selectedItems: mParameters.contexts,
					disableStrictHandling,
					groupId: mParameters.groupId
				});
			} else {
				oResult = await operations.callActionImport(sActionName, oModel, appComponent, {
					parameterValues: mParameters.parameterValues,
					label: mParameters.label,
					skipParameterDialog: mParameters.skipParameterDialog,
					bindingParameters: mBindingParameters,
					entitySetName: mParameters.entitySetName,
					onSubmitted: () => {
						this.busyLock(appComponent);
					},
					onResponse: () => {
						this.busyUnlock(appComponent);
					},
					parentControl: mParameters.parentControl,
					internalModelContext: mParameters.internalModelContext,
					operationAvailableMap: mParameters.operationAvailableMap,
					messageHandler: messageHandler,
					bObjectPage: mParameters.bObjectPage
				});
			}

			if (messageHandler) {
				await this._handleActionResponse(messageHandler, mParameters, sActionName);
			}
			return oResult;
		} catch (err: any) {
			if (messageHandler) {
				await this._handleActionResponse(messageHandler, mParameters, sActionName);
			}
			throw err;
		}
	}

	/**
	 * Handles messages for action call.
	 *
	 * @param messageHandler The message handler extension
	 * @param mParameters Parameters to be considered for the action.
	 * @param sActionName The name of the action to be called
	 * @returns Promise after message dialog is opened if required.
	 * @final
	 */
	_handleActionResponse(messageHandler: MessageHandler, mParameters: any, sActionName: string): Promise<void> {
		const aTransientMessages = messageHandling.getMessages(true, true);
		const actionName = mParameters.label ? mParameters.label : sActionName;
		if (aTransientMessages.length > 0 && mParameters && mParameters.internalModelContext) {
			mParameters.internalModelContext.setProperty("sActionName", mParameters.label ? mParameters.label : sActionName);
		}
		let control;
		if (mParameters.controlId) {
			control = mParameters.parentControl.byId(mParameters.controlId);
		} else {
			control = mParameters.parentControl;
		}
		return messageHandler.showMessages({ sActionName: actionName, control: control });
	}

	/**
	 * Handles validation errors for the 'Discard' action.
	 *
	 * @final
	 */
	handleValidationError() {
		const oMessageManager = Core.getMessageManager(),
			errorToRemove = oMessageManager
				.getMessageModel()
				.getData()
				.filter(function (error: any) {
					// only needs to handle validation messages, technical and persistent errors needs not to be checked here.
					if (error.validation) {
						return error;
					}
				});
		oMessageManager.removeMessages(errorToRemove);
	}

	/**
	 * Creates a new Popover. Factory method to make unit tests easier.
	 *
	 * @param settings Initial parameters for the popover
	 * @returns A new Popover
	 */
	_createPopover(settings?: $PopoverSettings): Popover {
		return new Popover(settings);
	}

	/**
	 * Shows a popover to confirm discard if needed.
	 *
	 * @param cancelButton The control which will open the popover
	 * @param isModified True if the object has been modified and a confirmation popover must be shown
	 * @param resourceModel The model to load text resources
	 * @returns Promise resolves if user confirms discard, rejects if otherwise, rejects if no control passed to open popover
	 * @final
	 */
	_confirmDiscard(cancelButton: Button, isModified: boolean, resourceModel: ResourceModel): Promise<void> {
		// If the data isn't modified, do not show any confirmation popover
		if (!isModified) {
			this.handleValidationError();
			return Promise.resolve();
		}

		cancelButton.setEnabled(false);
		return new Promise<void>((resolve, reject) => {
			const confirmationPopover = this._createPopover({
				showHeader: false,
				placement: "Top"
			});
			confirmationPopover.addStyleClass("sapUiContentPadding");

			// Create the content of the popover
			const title = new Text({
				text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_MESSAGE")
			});
			const confirmButton = new Button({
				text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_BUTTON"),
				width: "100%",
				press: () => {
					this.handleValidationError();
					confirmationPopover.data("continueDiscard", true);
					confirmationPopover.close();
				}
			});
			confirmationPopover.addContent(new VBox({ items: [title, confirmButton] }));

			// Attach handler
			confirmationPopover.attachBeforeOpen(() => {
				confirmationPopover.setInitialFocus(confirmButton);
			});
			confirmationPopover.attachAfterClose(() => {
				cancelButton.setEnabled(true);
				if (confirmationPopover.data("continueDiscard")) {
					resolve();
				} else {
					reject();
				}
			});

			confirmationPopover.openBy(cancelButton, false);
		});
	}

	_launchDialogWithKeyFields(
		oListBinding: ODataListBinding,
		mFields: any,
		oModel: ODataModel,
		mParameters: any,
		appComponent: AppComponent,
		messageHandler: MessageHandler
	) {
		let oDialog: Dialog;
		const oParentControl = mParameters.parentControl;

		// Crate a fake (transient) listBinding and context, just for the binding context of the dialog
		const oTransientListBinding = oModel.bindList(oListBinding.getPath(), oListBinding.getContext(), [], [], {
			$$updateGroupId: "submitLater"
		});
		oTransientListBinding.refreshInternal = function (): void {
			/* */
		};
		const oTransientContext = oTransientListBinding.create(mParameters.data, true);

		return new Promise(async (resolve, reject) => {
			const sFragmentName = "sap/fe/core/controls/NonComputedVisibleKeyFieldsDialog";
			const oFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment"),
				resourceModel = getResourceModel(oParentControl),
				oMetaModel = oModel.getMetaModel(),
				aImmutableFields: any[] = [],
				sPath = (oListBinding.isRelative() ? oListBinding.getResolvedPath() : oListBinding.getPath()) as string,
				oEntitySetContext = oMetaModel.createBindingContext(sPath) as Context,
				sMetaPath = oMetaModel.getMetaPath(sPath);
			for (const i in mFields) {
				aImmutableFields.push(oMetaModel.createBindingContext(`${sMetaPath}/${mFields[i]}`));
			}
			const oImmutableCtxModel = new JSONModel(aImmutableFields);
			const oImmutableCtx = oImmutableCtxModel.createBindingContext("/");
			const aRequiredProperties = getRequiredPropertiesFromInsertRestrictions(sMetaPath, oMetaModel);
			const oRequiredPropertyPathsCtxModel = new JSONModel(aRequiredProperties);
			const oRequiredPropertyPathsCtx = oRequiredPropertyPathsCtxModel.createBindingContext("/");
			const oNewFragment = await XMLPreprocessor.process(
				oFragment,
				{ name: sFragmentName },
				{
					bindingContexts: {
						entitySet: oEntitySetContext,
						fields: oImmutableCtx,
						requiredProperties: oRequiredPropertyPathsCtx
					},
					models: {
						entitySet: oEntitySetContext.getModel(),
						fields: oImmutableCtx.getModel(),
						metaModel: oMetaModel,
						requiredProperties: oRequiredPropertyPathsCtxModel
					}
				}
			);
			let aFormElements: any[] = [];
			const mFieldValueMap: any = {};
			const messageManager = Core.getMessageManager();
			const _removeMessagesForActionParamter = (messageControlId: string) => {
				const allMessages = messageManager.getMessageModel().getData();
				// also remove messages assigned to inner controls, but avoid removing messages for different paramters (with name being substring of another parameter name)
				const relevantMessages = allMessages.filter((msg: Message) =>
					msg.getControlIds().some((controlId: string) => controlId.includes(messageControlId))
				);
				messageManager.removeMessages(relevantMessages);
			};
			let actionParameterInfos: ActionParameterInfo[];

			const oController = {
				/*
					fired on focus out from field or on selecting a value from the valuehelp.
					the create button (Continue) is always enabled.
					liveChange is not fired when value is added from valuehelp.
					value validation is done for create button.
				*/
				handleChange: async (event: Event<{ id: string; promise: Promise<string> }>): Promise<void> => {
					const fieldId = event.getParameter("id");
					const field = event.getSource();
					const actionParameterInfo = actionParameterInfos.find(
						(actionParameterInfo) => actionParameterInfo.field === field
					) as ActionParameterInfo;
					_removeMessagesForActionParamter(fieldId);
					actionParameterInfo.validationPromise = event.getParameter("promise");
					try {
						actionParameterInfo.value = await actionParameterInfo.validationPromise;
						actionParameterInfo.hasError = false;
					} catch (error) {
						delete actionParameterInfo.value;
						actionParameterInfo.hasError = true;
					}
				},
				/*
					fired on key press. the create button the create button (Continue) is always enabled.
					liveChange is not fired when value is added from valuehelp.
					value validation is done for create button.
				*/
				handleLiveChange: (event: Event<{ id: string }>): void => {
					const fieldId = event.getParameter("id");
					_removeMessagesForActionParamter(fieldId);
				}
			};

			const oDialogContent: any = await Fragment.load({
				definition: oNewFragment,
				controller: oController
			});
			let oResult: any;
			let isDialogConfirmed = false;
			oDialog = new Dialog(generate(["CreateDialog", sMetaPath]), {
				title: resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE"),
				content: [oDialogContent],
				beginButton: {
					text: resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON"),
					type: "Emphasized",

					press: async (_Event: unknown) => {
						/* Validation of mandatory and value state for action parameters */
						if (!(await ActionRuntime.validateProperties(messageManager, actionParameterInfos, resourceModel))) {
							return;
						}

						BusyLocker.lock(oDialog);
						mParameters.bIsCreateDialog = true;
						try {
							const aValues = await Promise.all(
								Object.keys(mFieldValueMap).map(async function (sKey: string) {
									const oValue = await mFieldValueMap[sKey];
									const oDialogValue: any = {};
									oDialogValue[sKey] = oValue;
									return oDialogValue;
								})
							);
							if (mParameters.beforeCreateCallBack) {
								await toES6Promise(
									mParameters.beforeCreateCallBack({
										contextPath: oListBinding && oListBinding.getPath(),
										createParameters: aValues
									})
								);
							}
							const transientData = oTransientContext.getObject();
							const createData: any = {};
							Object.keys(transientData).forEach(function (sPropertyPath: string) {
								const oProperty = oMetaModel.getObject(`${sMetaPath}/${sPropertyPath}`);
								// ensure navigation properties are not part of the payload, deep create not supported
								if (oProperty && oProperty.$kind === "NavigationProperty") {
									return;
								}
								createData[sPropertyPath] = transientData[sPropertyPath];
							});
							const oNewDocumentContext = await this.createContext(oListBinding, createData, {
								createAtEnd: !!mParameters.createAtEnd,
								createInactive: !!mParameters.inactive,
								parentContext: mParameters.parentContext
							});

							const oPromise = this.onAfterCreateCompletion(oListBinding, oNewDocumentContext, mParameters);
							let oResponse: any = await oPromise;
							if (!oResponse || (oResponse && oResponse.bKeepDialogOpen !== true)) {
								oResponse = oResponse ?? {};
								oDialog.setBindingContext(null as any);
								oResponse.newContext = oNewDocumentContext;
								isDialogConfirmed = true;
								oResult = { response: oResponse };
								oDialog.close();
							}
						} catch (oError: any) {
							// in case of creation failed, dialog should stay open - to achieve the same, nothing has to be done (like in case of success with bKeepDialogOpen)
							if (oError !== FELibrary.Constants.CreationFailed) {
								// other errors are not expected
								oResult = { error: oError };
								oDialog.close();
							}
						} finally {
							BusyLocker.unlock(oDialog);
							messageHandler.showMessages();
						}
					}
				},
				endButton: {
					text: resourceModel.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL"),
					press: function () {
						oResult = { error: FELibrary.Constants.CancelActionDialog };
						oDialog.close();
					}
				},
				beforeClose: function () {
					/* When the dialog is cancelled, messages need to be removed in case the same action should be executed again */
					for (const actionParameterInfo of actionParameterInfos) {
						const fieldId = actionParameterInfo.field.getId();
						_removeMessagesForActionParamter(fieldId);
					}
					// show footer as per UX guidelines when dialog is not open
					(oDialog.getBindingContext("internal") as InternalModelContext)?.setProperty("isCreateDialogOpen", false);
					oDialog.destroy();
					oTransientListBinding.destroy();
					//rejected/resolved the promis returned by _launchDialogWithKeyFields
					//as soon as the dialog is closed. Without waiting for the dialog's
					//animation to finish
					if (isDialogConfirmed) {
						resolve(oResult.response);
					} else {
						reject(oResult?.error ?? FELibrary.Constants.CancelActionDialog);
					}
				}
			} as any);
			aFormElements = oDialogContent?.getAggregation("form").getAggregation("formContainers")[0].getAggregation("formElements");

			if (oParentControl && oParentControl.addDependent) {
				// if there is a parent control specified add the dialog as dependent
				oParentControl.addDependent(oDialog);
			}

			oDialog.setBindingContext(oTransientContext);

			try {
				await CommonUtils.setUserDefaults(
					appComponent,
					aImmutableFields,
					oTransientContext,
					false,
					mParameters.createAction,
					mParameters.data
				);
				actionParameterInfos = aFormElements.map((parameterField) => {
					const field: Field | MultiValueField = parameterField.getFields()[0];
					const isMultiValue = field.isA("sap.ui.mdc.MultiValueField");
					return {
						parameter: parameterField,
						isMultiValue: isMultiValue,
						field: field,
						value: isMultiValue ? (field as MultiValueField).getItems() : (field as Field).getValue(),
						validationPromise: undefined,
						hasError: false
					};
				});
				// footer must not be visible when the dialog is open as per UX guidelines
				(oDialog.getBindingContext("internal") as InternalModelContext).setProperty("isCreateDialogOpen", true);
				oDialog.open();
			} catch (oError: any) {
				await messageHandler.showMessages();
				throw oError;
			}
		});
	}

	onAfterCreateCompletion(oListBinding: any, oNewDocumentContext: any, mParameters: any) {
		let fnResolve: Function;
		const oPromise = new Promise<boolean>((resolve) => {
			fnResolve = resolve;
		});

		const fnCreateCompleted = (oEvent: any) => {
			const oContext = oEvent.getParameter("context"),
				bSuccess = oEvent.getParameter("success");
			if (oContext === oNewDocumentContext) {
				oListBinding.detachCreateCompleted(fnCreateCompleted, this);
				fnResolve(bSuccess);
			}
		};
		const fnSafeContextCreated = () => {
			oNewDocumentContext
				.created()
				.then(undefined, function () {
					Log.trace("transient creation context deleted");
				})
				.catch(function (contextError: any) {
					Log.trace("transient creation context deletion error", contextError);
				});
		};

		oListBinding.attachCreateCompleted(fnCreateCompleted, this);

		return oPromise.then((bSuccess: boolean) => {
			if (!bSuccess) {
				if (!mParameters.keepTransientContextOnFailed) {
					// Cancel the pending POST and delete the context in the listBinding
					fnSafeContextCreated(); // To avoid a 'request cancelled' error in the console
					oListBinding.resetChanges();
					oListBinding.getModel().resetChanges(oListBinding.getUpdateGroupId());

					throw FELibrary.Constants.CreationFailed;
				}
				return { bKeepDialogOpen: true };
			} else {
				return oNewDocumentContext.created();
			}
		});
	}

	/**
	 * Retrieves the name of the NewAction to be executed.
	 *
	 * @param oStartupParameters Startup parameters of the application
	 * @param sCreateHash Hash to be checked for action type
	 * @param oMetaModel The MetaModel used to check for NewAction parameter
	 * @param sMetaPath The MetaPath
	 * @returns The name of the action
	 * @final
	 */
	_getNewAction(oStartupParameters: any, sCreateHash: string, oMetaModel: ODataMetaModel, sMetaPath: string) {
		let sNewAction;

		if (oStartupParameters && oStartupParameters.preferredMode && sCreateHash.toUpperCase().includes("I-ACTION=CREATEWITH")) {
			const sPreferredMode = oStartupParameters.preferredMode[0];
			sNewAction =
				sPreferredMode.toUpperCase().indexOf("CREATEWITH:") > -1
					? sPreferredMode.substr(sPreferredMode.lastIndexOf(":") + 1)
					: undefined;
		} else if (
			oStartupParameters &&
			oStartupParameters.preferredMode &&
			sCreateHash.toUpperCase().includes("I-ACTION=AUTOCREATEWITH")
		) {
			const sPreferredMode = oStartupParameters.preferredMode[0];
			sNewAction =
				sPreferredMode.toUpperCase().indexOf("AUTOCREATEWITH:") > -1
					? sPreferredMode.substr(sPreferredMode.lastIndexOf(":") + 1)
					: undefined;
		} else {
			sNewAction =
				oMetaModel && oMetaModel.getObject !== undefined
					? oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/NewAction`) ||
					  oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Common.v1.DraftRoot/NewAction`)
					: undefined;
		}
		return sNewAction;
	}

	/**
	 * Retrieves the label for the title of a specific create action dialog, e.g. Create Sales Order from Quotation.
	 *
	 * The following priority is applied:
	 * 1. label of line-item annotation.
	 * 2. label annotated in the action.
	 * 3. "Create" as a constant from i18n.
	 *
	 * @param oMetaModel The MetaModel used to check for the NewAction parameter
	 * @param sMetaPath The MetaPath
	 * @param sNewAction Contains the name of the action to be executed
	 * @param oResourceBundleCore ResourceBundle to access the default Create label
	 * @returns The label for the Create Action Dialog
	 * @final
	 */
	_getSpecificCreateActionDialogLabel(
		oMetaModel: ODataMetaModel | undefined,
		sMetaPath: string,
		sNewAction: string,
		oResourceBundleCore: ResourceBundle | undefined
	): string | undefined {
		const lineItems = oMetaModel?.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.LineItem`) as LineItem | undefined;

		const label = lineItems?.find((lineItem) => isDataFieldForAction(lineItem) && lineItem.Action.split("(", 1)[0] === sNewAction)
			?.Label;

		return (
			label ||
			oMetaModel?.getObject(`${sMetaPath}/${sNewAction}@com.sap.vocabularies.Common.v1.Label`) ||
			oResourceBundleCore?.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE")
		);
	}
}

const singleton = new TransactionHelper();
export default singleton;
