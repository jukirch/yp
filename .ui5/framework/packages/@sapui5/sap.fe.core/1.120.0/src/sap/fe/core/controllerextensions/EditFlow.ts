import type { EntitySet } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type ResourceModel from "sap/fe/core/ResourceModel";
import BaseControllerExtension from "sap/fe/core/controllerextensions/BaseControllerExtension";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import { StandardActions, TriggerType, triggerConfiguredSurvey } from "sap/fe/core/controllerextensions/Feedback";
import { hookable } from "sap/fe/core/controllerextensions/HookSupport";
import type InternalRouting from "sap/fe/core/controllerextensions/InternalRouting";
import ActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import { Activity, shareObject } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import TransactionHelper from "sap/fe/core/controllerextensions/editFlow/TransactionHelper";
import type { RootContextInfo, SiblingInformation } from "sap/fe/core/controllerextensions/editFlow/draft";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import sticky from "sap/fe/core/controllerextensions/editFlow/sticky";
import { convertTypes, getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { defineUI5Class, extensible, finalExtension, publicExtension } from "sap/fe/core/helpers/ClassSupport";
import EditState from "sap/fe/core/helpers/EditState";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import SemanticKeyHelper from "sap/fe/core/helpers/SemanticKeyHelper";
import FELibrary from "sap/fe/core/library";
import type { RoutingNavigationParameters, SemanticMapping } from "sap/fe/core/services/RoutingServiceFactory";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import Text from "sap/m/Text";
import type Event from "sap/ui/base/Event";
import type BaseObject from "sap/ui/base/Object";
import type Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import coreLibrary from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Table from "sap/ui/mdc/Table";
import type CreationRow from "sap/ui/mdc/table/CreationRow";
import type Binding from "sap/ui/model/Binding";
import Filter from "sap/ui/model/Filter";
import type Model from "sap/ui/model/Model";
import Sorter from "sap/ui/model/Sorter";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { default as Context, default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ActionRuntime from "../ActionRuntime";
import ConfirmRecommendationDialogBlock from "../controls/Recommendations/ConfirmRecommendationDialog.block";
import type { BaseManifestSettings } from "../converters/ManifestSettings";
import NavigationReason from "./routing/NavigationReason";

const CreationMode = FELibrary.CreationMode,
	ProgrammingModel = FELibrary.ProgrammingModel,
	Constants = FELibrary.Constants,
	DraftStatus = FELibrary.DraftStatus,
	EditMode = FELibrary.EditMode,
	StartupMode = FELibrary.StartupMode,
	MessageType = coreLibrary.MessageType;

type SaveDocumentParameters = {
	bExecuteSideEffectsOnError?: boolean;
	mergePatchDraft?: boolean;
	bindings?: ODataListBinding[];
};

/**
 * A controller extension offering hooks into the edit flow of the application
 *
 * @hideconstructor
 * @public
 * @since 1.90.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.EditFlow")
class EditFlow extends BaseControllerExtension {
	protected base!: PageController;

	private dirtyStateProviderFunction?: Function;

	private sessionTimeoutFunction?: Function;

	private stickyDiscardAfterNavigationFunction?: Function;

	private syncTasks: Promise<any> = Promise.resolve();

	private actionPromise?: Promise<any>;

	private confirmRecommendationsDialog?: ConfirmRecommendationDialogBlock;

	//////////////////////////////////////
	// Public methods
	//////////////////////////////////////

	getInterface(): BaseObject {
		return super.getInterface();
	}

	getAppComponent(): AppComponent {
		return this.base.getAppComponent();
	}

	/**
	 * Creates a draft document for the existing active document.
	 *
	 * @param oContext Context of the active document
	 * @returns Promise resolves once the editable document is available with the editable context
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async editDocument(oContext: Context): Promise<ODataV4Context | void> {
		const transactionHelper = this.getTransactionHelper();
		const oRootViewController = this._getRootViewController() as any;
		const model = oContext.getModel();
		const oViewData = this.getView().getViewData() as BaseManifestSettings;
		const sProgrammingModel = this.getProgrammingModel(oContext);
		let oRootContext: Context = oContext;
		const oView = this.base.getView();
		const groupId = "editGroup";
		try {
			if ((oViewData?.viewLevel as number) > 1) {
				if (sProgrammingModel === ProgrammingModel.Draft || sProgrammingModel === ProgrammingModel.Sticky) {
					oRootContext = (await CommonUtils.createRootContext(sProgrammingModel, oView, this.getAppComponent())) as Context;
				}
			}
			await this.base.editFlow.onBeforeEdit({ context: oRootContext });

			const rightmostContext = this._isFclEnabled() ? oRootViewController.getRightmostContext() : oContext;
			const oNewDocumentContextPromise = transactionHelper.editDocument(
				oRootContext,
				this.getView(),
				this.getAppComponent(),
				this.getMessageHandler(),
				groupId
			);
			const rootContextInfo = {
				rootSiblingPathPromise: oNewDocumentContextPromise
			};
			this._setStickySessionInternalProperties(sProgrammingModel, model);

			let siblingInfoPromise;
			// rightmostContext === rootContext => we're in OP. If not, we're in multi-column layout of FCL
			const computeSiblingInfo = rightmostContext !== oRootContext || (oViewData?.viewLevel as number) > 1;
			if (computeSiblingInfo) {
				siblingInfoPromise = this._computeSiblingInformation(
					oRootContext,
					rightmostContext,
					sProgrammingModel,
					true,
					rootContextInfo,
					groupId
				);
			}
			oContext.getModel().submitBatch(groupId);

			let siblingInfo = await siblingInfoPromise;
			const oNewDocumentContext = (await oNewDocumentContextPromise) as Context;
			let contextToNavigate: Context | undefined = oNewDocumentContext;
			if (computeSiblingInfo) {
				if (siblingInfo === undefined) {
					siblingInfo = await this._computeSiblingInformation(
						oRootContext,
						rightmostContext,
						sProgrammingModel,
						true,
						rootContextInfo,
						"$auto"
					);
				}
				contextToNavigate = this._getNavigationTargetForEdit(oContext, oNewDocumentContext, siblingInfo);
			} else {
				this._updatePathsInHistory([]);
			}

			if (oNewDocumentContext) {
				this.setEditMode(EditMode.Editable, false);
				this.setDocumentModified(false);
				this.getMessageHandler().showMessageDialog();

				if (oNewDocumentContext !== oRootContext) {
					await this.base.editFlow.onAfterEdit({ context: contextToNavigate });
					await this._handleNewContext(contextToNavigate as Context, {
						editable: true,
						recreateContext: false,
						forceFocus: true
					});
					if (sProgrammingModel === ProgrammingModel.Sticky) {
						// The stickyOn handler must be set after the navigation has been done,
						// as the URL may change in the case of FCL
						let stickyContext: Context;
						if (this._isFclEnabled()) {
							// We need to use the kept-alive context used to bind the page
							stickyContext = oNewDocumentContext?.getModel().getKeepAliveContext(oNewDocumentContext.getPath());
						} else {
							stickyContext = oNewDocumentContext;
						}
						this.handleStickyOn(stickyContext);
					} else if (ModelHelper.isCollaborationDraftSupported(model.getMetaModel())) {
						// according to UX in case of enabled collaboration draft we share the object immediately
						await shareObject(oNewDocumentContext);
					}
					return contextToNavigate;
				}
			}
		} catch (oError) {
			Log.error("Error while editing the document", oError as any);
		}
	}

	/**
	 * Deletes several documents.
	 *
	 * @param contextsToDelete The contexts of the documents to be deleted
	 * @param parameters The parameters
	 * @returns Promise resolved once the documents are deleted
	 */
	async deleteMultipleDocuments(contextsToDelete: Context[], parameters: any) {
		if (parameters) {
			parameters.beforeDeleteCallBack = this.base.editFlow.onBeforeDelete;
			parameters.requestSideEffects = parameters.requestSideEffects !== false;
		} else {
			parameters = {
				beforeDeleteCallBack: this.base.editFlow.onBeforeDelete,
				requestSideEffects: true
			};
		}
		const lockObject = this.getGlobalUIModel();
		const parentControl = this.getView().byId(parameters.controlId) || Core.byId(parameters.controlId);
		if (!parentControl) {
			throw new Error("parameter controlId missing or incorrect");
		} else {
			parameters.parentControl = parentControl;
		}
		const listBinding = (parentControl.getBinding("items") || (parentControl as Table).getRowBinding()) as ODataListBinding;
		parameters.bFindActiveContexts = true;
		BusyLocker.lock(lockObject);

		try {
			if (this.getProgrammingModel(parameters?.selectedContexts?.[0] ?? contextsToDelete[0]) === ProgrammingModel.Sticky) {
				this.setDocumentModified(true);
			}
			await this.deleteDocumentTransaction(contextsToDelete, parameters);

			let result;

			// Multiple object deletion is triggered from a list
			// First clear the selection in the table as it's not valid any more
			if (parentControl.isA("sap.ui.mdc.Table")) {
				(parentControl as any).clearSelection();
			}

			// Then refresh the list-binding (LR), or require side-effects (OP)
			const viewBindingContext = this.getView().getBindingContext();
			if ((listBinding as any).isRoot()) {
				// keep promise chain pending until refresh of listbinding is completed
				result = new Promise<void>((resolve) => {
					listBinding.attachEventOnce("dataReceived", function () {
						resolve();
					});
				});
				listBinding.refresh();
			} else if (viewBindingContext) {
				// if there are transient contexts, we must avoid requesting side effects
				// this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
				// if list binding is refreshed, transient contexts might be lost
				if (parameters.requestSideEffects && !CommonUtils.hasTransientContext(listBinding)) {
					this.getAppComponent()
						.getSideEffectsService()
						.requestSideEffectsForNavigationProperty(listBinding.getPath(), viewBindingContext as Context);
				}
			}

			// deleting at least one object should also set the UI to dirty
			if (!this.getAppComponent()._isFclEnabled()) {
				EditState.setEditStateDirty();
			}

			// Notify consumers of which contexts were deleted
			await this.base.editFlow.onAfterDelete({ contexts: contextsToDelete });

			this._sendActivity(Activity.Delete, contextsToDelete);

			return result;
		} catch (error: any) {
			Log.error("Error while deleting the document(s)", error);
		} finally {
			BusyLocker.unlock(lockObject);
		}
	}

	/**
	 * Updates the draft status and displays the error messages if there are errors during an update.
	 *
	 * @param updatedContext Context of the updated field
	 * @param updatePromise Promise to determine when the update operation is completed. The promise should be resolved when the update operation is completed, so the draft status can be updated.
	 * @returns Promise resolves once draft status has been updated
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	updateDocument(updatedContext: object, updatePromise: Promise<any>): Promise<void> {
		const originalBindingContext = this.getView().getBindingContext();
		const isDraft = this.getProgrammingModel(updatedContext as Binding | Context) === ProgrammingModel.Draft;

		this.getMessageHandler().removeTransitionMessages();
		return this.syncTask(async () => {
			if (originalBindingContext) {
				this.setDocumentModified(true);
				if (!this._isFclEnabled()) {
					EditState.setEditStateDirty();
				}

				if (isDraft) {
					this.setDraftStatus(DraftStatus.Saving);
				}
			}

			try {
				await updatePromise;
				const currentBindingContext = this.getView().getBindingContext() as ODataV4Context | null | undefined;
				if (!isDraft || !currentBindingContext || currentBindingContext !== originalBindingContext) {
					// If a navigation happened while oPromise was being resolved, the binding context of the page changed
					return;
				}

				// We're still on the same context
				const metaModel = currentBindingContext.getModel().getMetaModel();
				const entitySetName = metaModel.getMetaContext(currentBindingContext.getPath()).getObject("@sapui.name");
				const semanticKeys = SemanticKeyHelper.getSemanticKeys(metaModel, entitySetName);
				if (semanticKeys?.length) {
					const currentSemanticMapping = this._getSemanticMapping();
					const currentSemanticPath = currentSemanticMapping?.semanticPath,
						sChangedPath = SemanticKeyHelper.getSemanticPath(currentBindingContext, true);
					// currentSemanticPath could be null if we have navigated via deep link then there are no semanticMappings to calculate it from
					if (currentSemanticPath && currentSemanticPath !== sChangedPath) {
						await this._handleNewContext(currentBindingContext, { editable: true, recreateContext: false });
					}
				}

				this.setDraftStatus(DraftStatus.Saved);
			} catch (error: any) {
				Log.error("Error while updating the document", error);
				if (isDraft && originalBindingContext) {
					this.setDraftStatus(DraftStatus.Clear);
				}
			} finally {
				await this.getMessageHandler().showMessages();
			}
		});
	}

	private getParentContextFromSelection(selectedContexts: ODataV4Context[] | undefined): ODataV4Context | undefined {
		if (selectedContexts && selectedContexts.length > 1) {
			// One parent at most !!
			throw new Error(`Cannot create a new document in a TreeTable with ${selectedContexts.length} parents`);
		}

		return selectedContexts?.length === 1 ? selectedContexts[0] : undefined;
	}

	// Internal only params ---
	// * @param {string} mParameters.creationMode The creation mode using one of the following:
	// *                    Sync - the creation is triggered and once the document is created, the navigation is done
	// *                    Async - the creation and the navigation to the instance are done in parallel
	// *                    Deferred - the creation is done on the target page
	// *                    CreationRow - The creation is done inline async so the user is not blocked
	// mParameters.creationRow Instance of the creation row - (TODO: get rid but use list bindings only)

	/**
	 * Creates a new document.
	 *
	 * @param vListBinding  ODataListBinding object or the binding path for a temporary list binding
	 * @param mInParameters Contains the following attributes:
	 * @param mInParameters.creationMode The creation mode using one of the following:<br/>
	 *                    NewPage - the created document is shown in a new page, depending on whether metadata 'Sync', 'Async' or 'Deferred' is used<br/>
	 *                    Inline - The creation is done inline (in a table)<br/>
	 *                    External - The creation is done in a different application specified via the parameter 'outbound'
	 * @param mInParameters.tableId ID of the table
	 * @param mInParameters.outbound The navigation target where the document is created in case of creationMode 'External'
	 * @param mInParameters.createAtEnd Specifies if the new entry should be created at the top or bottom of a table in case of creationMode 'Inline'
	 * @param mInParameters.data The initial data for the created document
	 * @param mInParameters.beforeCreateCallBack PRIVATE
	 * @param mInParameters.bFromDeferred PRIVATE
	 * @param mInParameters.busyMode PRIVATE
	 * @param mInParameters.createAction PRIVATE
	 * @param mInParameters.creationRow PRIVATE
	 * @param mInParameters.skipParameterDialog PRIVATE
	 * @param mInParameters.skipSideEffects PRIVATE
	 * @param mInParameters.selectedContexts The contexts that are selected in the table initiating the creation. Used in case of a TreeTable to determine the parent context of the created document
	 * @returns Promise resolves once the object has been created
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async createDocument(
		vListBinding: ODataListBinding | string,
		mInParameters: {
			beforeCreateCallBack?: Function;
			bFromDeferred?: boolean;
			busyMode?: string;
			createAction?: boolean;
			createAtEnd?: boolean;
			creationMode: string;
			creationRow?: CreationRow;
			data?: object;
			tableId?: string;
			outbound?: string;
			skipParameterDialog?: boolean;
			skipSideEffects?: boolean;
			selectedContexts?: ODataV4Context[];
		}
	): Promise<void> {
		let oDataListBinding!: ODataListBinding;
		const parameters = mInParameters;
		let parentContext: ODataV4Context | undefined;

		if (parameters.creationMode !== CreationMode.External) {
			if (typeof vListBinding === "string") {
				const oDataModel = this.getView().getModel();
				if (!oDataModel) {
					return;
				}
				oDataListBinding = oDataModel.bindList(vListBinding) as ODataListBinding;
				parameters.creationMode = CreationMode.Sync;
				delete parameters.createAtEnd;
			} else if (vListBinding.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")) {
				oDataListBinding = vListBinding;
			} else {
				throw new Error("Binding object or path expected");
			}

			if (this.getTransactionHelper().isListBindingHierarchical(oDataListBinding)) {
				parentContext = this.getParentContextFromSelection(parameters.selectedContexts);
			}
		}

		const resolvedCreationMode = this.resolveCreationMode(parameters.creationMode, oDataListBinding, parameters.data);

		this.getAppComponent().getRouterProxy().removeIAppStateKey();

		if (
			this.getAppComponent().getManifest()["sap.fe"]?.app?.singleDraftForCreate &&
			oDataListBinding === oDataListBinding.getRootBinding()
		) {
			oDataListBinding.filter(
				new Filter({
					filters: [
						new Filter({
							path: "IsActiveEntity",
							operator: "EQ",
							value1: false
						}),
						new Filter({
							path: "HasActiveEntity",
							operator: "EQ",
							value1: false
						})
					],
					and: true
				})
			);
			oDataListBinding.sort(new Sorter("DraftAdministrativeData/LastChangeDateTime", true));
			return oDataListBinding.requestContexts(0, 1).then(async (result) => {
				if (result.length > 0) {
					return this._handleNewContext(result[0], { editable: true, recreateContext: false });
				}
				return this._handleCreationMode(resolvedCreationMode, vListBinding, parameters, oDataListBinding, parentContext);
			});
		}
		return this._handleCreationMode(resolvedCreationMode, vListBinding, parameters, oDataListBinding, parentContext);
	}

	async _handleCreationMode(
		resolvedCreationMode: string,
		vListBinding: string | ODataListBinding,
		parameters: {
			beforeCreateCallBack?: Function;
			bFromDeferred?: boolean;
			busyMode?: string;
			createAction?: boolean;
			createAtEnd?: boolean;
			creationMode: string;
			creationRow?: CreationRow;
			data?: object;
			tableId?: string;
			outbound?: string;
			skipParameterDialog?: boolean;
			skipSideEffects?: boolean;
			selectedContexts?: ODataV4Context[];
		},
		oDataListBinding: ODataListBinding,
		parentContext: Context | undefined
	): Promise<void> {
		switch (resolvedCreationMode) {
			case CreationMode.External:
				return this.createExternalDocument(vListBinding, parameters.outbound);
			case CreationMode.Deferred:
				return this.createDeferredDocument(oDataListBinding, parentContext, parameters.data);
			case CreationMode.CreationRow:
				return parameters.creationRow
					? this.createCreateRowDocument({
							creationRow: parameters.creationRow,
							skipSideEffects: parameters.skipSideEffects,
							createAtEnd: parameters.createAtEnd
					  })
					: undefined;
			case CreationMode.Inline:
				return this.createInlineDocument(
					{
						tableId: parameters.tableId,
						createAtEnd: parameters.createAtEnd,
						skipSideEffects: parameters.skipSideEffects,
						parentContext,
						data: parameters.data
					},
					oDataListBinding
				);
			case CreationMode.Sync:
			case CreationMode.Async:
				return this.createSyncAsyncDocument(
					{
						creationMode: resolvedCreationMode,
						data: parameters.data,
						bFromDeferred: parameters.bFromDeferred,
						skipSideEffects: parameters.skipSideEffects,
						createAction: parameters.createAction,
						parentContext
					},
					oDataListBinding
				);
			default:
				throw new Error(`Unhandled creationMode ${resolvedCreationMode}`);
		}
	}

	/**
	 *Executes the mandatory configuration after the document has been created.
	 *
	 * @param prerequisite Promise of the document creation and the following navigation
	 * @param listBinding ODataListBinding where the document is created
	 * @returns Promise resolves once the configuration is done
	 */
	async postDocumentCreation(prerequisite: Promise<[Context, unknown]>, listBinding: ODataListBinding): Promise<void> {
		const programmingModel: string = this.getProgrammingModel(listBinding);
		const model = listBinding.getModel();
		const params = await prerequisite;
		const newDocumentContext = params[0];
		this._setStickySessionInternalProperties(programmingModel, model);
		await this.base.editFlow.onAfterCreate({ context: newDocumentContext });
		this.setEditMode(EditMode.Editable); // The createMode flag will be set in computeEditMode
		if (!listBinding.isRelative() && programmingModel === ProgrammingModel.Sticky) {
			// Workaround to tell the OP that we've created a new object from the LR
			const metaContext = model.getMetaModel().getMetaContext(listBinding.getPath());
			const entitySet = getInvolvedDataModelObjects(metaContext).startingEntitySet as EntitySet;
			const newAction = entitySet?.annotations.Session?.StickySessionSupported?.NewAction;
			this.getInternalModel().setProperty("/lastInvokedAction", newAction);
		}
		if (newDocumentContext) {
			this.setDocumentModifiedOnCreate(listBinding);
			if (!this._isFclEnabled()) {
				EditState.setEditStateDirty();
			}
			this._sendActivity(Activity.Create, newDocumentContext);
			if (
				ModelHelper.isCollaborationDraftSupported(model.getMetaModel()) &&
				this.isDraftRoot(newDocumentContext) &&
				!ActivitySync.isConnected(this.getView())
			) {
				// according to UX in case of enabled collaboration draft we share the object immediately
				await shareObject(newDocumentContext);
			}
		}
	}

	/**
	 * Creates a new document via the creationRow.
	 *
	 * @param parameters Contains the following attributes:
	 * @param parameters.createAtEnd The new document is created at the end.
	 * @param parameters.creationRow The creation row
	 * @param parameters.skipSideEffects The sideEffects are requested
	 * @returns Promise resolves once the document has been created
	 */
	async createCreateRowDocument(parameters: {
		createAtEnd?: boolean;
		creationRow: CreationRow;
		skipSideEffects?: boolean;
	}): Promise<void> {
		const appComponent = this.getAppComponent();
		const creationRow = parameters.creationRow;
		const table = parameters.creationRow.getParent() as Table | undefined;
		let navigation = Promise.resolve();
		if (!table) {
			return;
		}

		const metaModel = table.getModel()?.getMetaModel() as ODataMetaModel;
		const listBinding = table.getRowBinding();
		if (this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
			throw new Error(`Unhandled creationMode "CreationRow" with a TreeTable`);
		}
		const creationRowContext = creationRow.getBindingContext() as Context;
		const documentValidation = this.getCreationRowValidationFunction(table);
		// disableAddRowButtonForEmptyData is set to false in manifest converter (Table.ts) if customValidationFunction exists
		if (creationRow.data("disableAddRowButtonForEmptyData") === "true") {
			table.getBindingContext("internal")?.setProperty("creationRowFieldValidity", {});
		}

		const validationMessages = await this.syncTask(documentValidation);
		if (validationMessages.length > 0) {
			this.createCustomValidationMessages(validationMessages, table);
			Log.error("Custom Validation failed");
			// if custom validation fails, we leave the method immediately
			return;
		}
		const entityType = getInvolvedDataModelObjects(metaModel.getMetaContext(creationRowContext.getPath())).targetEntityType;
		const creationRowPayload = creationRowContext.getObject();

		await this._checkForValidationErrors();

		//moved after _checkForValidationErrors to avoid "'creation' use before initialization" console errors
		//after validation errors occurred
		listBinding.attachEventOnce("change", async () => {
			await creation;
			table.scrollToIndex(parameters.createAtEnd ? table.getRowBinding().getLength() : 0);
		});

		// take care on message handling, draft indicator (in case of draft)
		// Attach the create sent and create completed event to the object page binding so that we can react
		this.handleCreateEvents(listBinding);

		const creation = this.getTransactionHelper().createDocument(
			listBinding,
			{
				data: Object.assign(
					{},
					...Object.keys(creationRowPayload)
						.filter(
							(propertyPath: string) =>
								entityType.navigationProperties.findIndex((property) => property.name === propertyPath) === -1
						) // ensure navigation properties are not part of the payload, deep create not supported
						.map((path) => ({ [path]: creationRowPayload[path] }))
				),
				keepTransientContextOnFailed: false, // currently not fully supported
				busyMode: "Local", // busy handling shall be done locally only
				busyId: (table?.getParent() as TableAPI | undefined)?.getTableDefinition()?.annotation.id,
				parentControl: this.getView(),
				beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
				skipParameterDialog: appComponent.getStartupMode() === StartupMode.AutoCreate, // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
				createAtEnd: parameters.createAtEnd,
				creationMode: CreationMode.CreationRow
			},
			appComponent,
			this.getMessageHandler(),
			false
		);
		// SideEffects on Create
		// if Save is pressed directly after filling the CreationRow, no SideEffects request
		if (!parameters.skipSideEffects) {
			this.handleSideEffects(listBinding, creation);
		}

		try {
			const creationRowListBinding = creationRowContext.getBinding() as ODataListBinding;
			const newTransientContext = creationRowListBinding.create();
			creationRow.setBindingContext(newTransientContext);

			// this is needed to avoid console errors TO be checked with model colleagues
			newTransientContext.created()?.catch(() => {
				Log.trace("transient fast creation context deleted");
			});
			navigation = creationRowContext.delete("$direct");
		} catch (error: unknown) {
			// Reset busy indicator after a validation error
			if (BusyLocker.isLocked(this.getView().getModel("ui"))) {
				BusyLocker.unlock(this.getView().getModel("ui"));
			}
			Log.error("CreationRow navigation error: ", error as string);
		}
		return this.postDocumentCreation(Promise.all([creation, navigation]), listBinding);
	}

	/**
	 * Creates a new inline document.
	 *
	 * @param parameters Contains the following attributes:
	 * @param parameters.createAtEnd The new document is created at the end
	 * @param parameters.skipSideEffects The sideEffects are requested
	 * @param parameters.tableId The id of the table
	 * @param listBinding ODataListBinding where the document is created
	 * @returns Promise resolves once the document has been created
	 */
	async createInlineDocument(
		parameters: {
			createAtEnd?: boolean;
			skipSideEffects?: boolean;
			tableId?: string;
			parentContext?: ODataV4Context;
			data?: object;
		},
		listBinding: ODataListBinding
	): Promise<void> {
		let table: Table | undefined;
		if (parameters.tableId) {
			table = this.getView().byId(parameters.tableId) as Table;
		}
		if (table?.isA<Table>("sap.ui.mdc.Table")) {
			table.getRowBinding().attachEventOnce("change", async () => {
				await creation;
				table?.focusRow(parameters.createAtEnd ? table.getRowBinding().getLength() : 0, true);
			});
		}

		// take care on message handling, draft indicator (in case of draft)
		// Attach the create sent and create completed event to the object page binding so that we can react
		this.handleCreateEvents(listBinding);
		const creation = this.getTransactionHelper().createDocument(
			listBinding,
			{
				//Check if All parameters are needed
				keepTransientContextOnFailed: false, // currently not fully supported
				busyMode: "Local", // busy handling shall be done locally only
				busyId: (table?.getParent() as TableAPI | undefined)?.getTableDefinition()?.annotation.id,
				parentControl: this.getView(),
				beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
				skipParameterDialog: this.getAppComponent().getStartupMode() === StartupMode.AutoCreate, // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
				createAtEnd: parameters.createAtEnd,
				creationMode: CreationMode.Inline,
				parentContext: parameters.parentContext,
				data: parameters.data
			},
			this.getAppComponent(),
			this.getMessageHandler(),
			false
		);

		if (!parameters.skipSideEffects) {
			this.handleSideEffects(listBinding, creation);
		}
		return this.postDocumentCreation(Promise.all([creation, this.syncTask(creation)]), listBinding);
	}

	/**
	 * Creates a deffered document.
	 *
	 * @param listBinding ODataListBinding where the document has to be created
	 * @param parentContext Optional parent context when creating a node in TreeTable
	 * @returns Promise resolves once the navigation is done
	 */
	async createDeferredDocument(listBinding: ODataListBinding, parentContext?: ODataV4Context, data?: object): Promise<void> {
		const lockObject = this.getGlobalUIModel();
		BusyLocker.lock(lockObject);
		await this.getInternalRouting().navigateForwardToContext(listBinding, {
			createOnNavigateParameters: { mode: "Deferred", parentContext, listBinding, data },
			editable: true,
			forceFocus: true
		});
		BusyLocker.unlock(lockObject);
	}

	/**
	 * Creates a sync or async document.
	 *
	 * @param parameters Contains the following attributes:
	 * @param parameters.creationMode The sync or async creation mode
	 * @param parameters.bFromDeferred This document is created after a deffered creation
	 * @param parameters.createAction  The create has been triggered by a create action
	 * @param parameters.data  Data to save on the new document
	 * @param parameters.skipSideEffects The sideEffects are requested
	 * @param listBinding ODataListBinding where the document is created
	 * @returns Promise resolves once the document has been created
	 */
	async createSyncAsyncDocument(
		parameters: {
			creationMode: string;
			bFromDeferred?: boolean;
			createAction?: boolean;
			data?: object;
			skipSideEffects?: boolean;
			parentContext?: ODataV4Context;
		},
		listBinding: ODataListBinding
	): Promise<void> {
		let navigation: Promise<unknown> | undefined;
		const lockObject = this.getGlobalUIModel();
		const routingListener = this.getInternalRouting();
		BusyLocker.lock(lockObject);

		const creation = this.getTransactionHelper().createDocument(
			listBinding,
			{
				...parameters,
				...{
					parentControl: this.getView(),
					beforeCreateCallBack: this.base.editFlow.onBeforeCreate,
					skipParameterDialog: this.getAppComponent().getStartupMode() === StartupMode.AutoCreate // In case the application was called with preferredMode=autoCreateWith, we want to skip the action parameter dialog
				}
			},
			this.getAppComponent(),
			this.getMessageHandler(),
			false
		);
		// Don't do this if the invocation comes from a deferred creation or if Save is pressed directly after filling the CreationRow
		if (parameters.bFromDeferred !== true && !parameters.skipSideEffects) {
			this.handleSideEffects(listBinding, creation);
		}

		if (parameters.creationMode === CreationMode.Async) {
			navigation = routingListener.navigateForwardToContext(listBinding, {
				createOnNavigateParameters: { mode: "Async", createContextPromise: creation },
				editable: true,
				forceFocus: true
			});
		} else {
			navigation = creation.then((newDocumentContext) => {
				if (!newDocumentContext) {
					const coreResourceBundle = Core.getLibraryResourceBundle("sap.fe.core");
					return routingListener.navigateToMessagePage(coreResourceBundle.getText("C_COMMON_SAPFE_DATA_RECEIVED_ERROR"), {
						title: coreResourceBundle.getText("C_COMMON_SAPFE_ERROR"),
						description: coreResourceBundle.getText("C_EDITFLOW_SAPFE_CREATION_FAILED_DESCRIPTION")
					});
				} else {
					// In case the Sync creation was triggered for a deferred creation, we don't navigate forward
					// as we're already on the corresponding ObjectPage
					const navParameters: RoutingNavigationParameters = {
						editable: true,
						forceFocus: true,
						reason: NavigationReason.EditFlowAction,
						transient:
							this.getProgrammingModel(listBinding) == ProgrammingModel.Sticky || parameters.createAction ? true : undefined
					};

					return parameters.bFromDeferred
						? routingListener.navigateToContext(newDocumentContext, navParameters)
						: routingListener.navigateForwardToContext(newDocumentContext, navParameters);
				}
			});
		}
		try {
			await this.postDocumentCreation(Promise.all([creation, navigation]), listBinding);
		} catch (error: unknown) {
			// TODO: currently, the only errors handled here are raised as string - should be changed to Error objects
			// creation has been cancelled by user or failed in backend => in case we have navigated to transient context before, navigate back
			// the switch-statement above seems to indicate that this happens in creationModes deferred and async. But in fact, in these cases after the navigation from routeMatched in OP component
			// createDeferredDocument is triggered, which calls this method (createDocument) again - this time with creationMode sync. Therefore, also in that mode we need to trigger back navigation.
			// The other cases might still be needed in case the navigation fails.
			if ([Constants.CancelActionDialog, Constants.ActionExecutionFailed, Constants.CreationFailed].includes(error)) {
				this.getInternalRouting().navigateBackFromTransientState();
			}
			throw error;
		} finally {
			BusyLocker.unlock(lockObject);
		}
	}

	/**
	 * Creates an external document.
	 *
	 * @param listBinding ODataListBinding where the document has to be created
	 * @param outbound The outbound action
	 * @returns Promise resolves once the navigation has been triggered
	 */
	async createExternalDocument(listBinding: ODataListBinding | string, outbound?: string): Promise<void> {
		// TODO: Call appropriate function (currently using the same as for outbound chevron nav, and without any context - 3rd param)
		if (outbound) {
			if (typeof listBinding !== "string" && this.getTransactionHelper().isListBindingHierarchical(listBinding)) {
				throw new Error(`Unhandled creationMode "External" with a TreeTable`);
			}

			await this.syncTask();
			const controller = this.getView().getController() as PageController;
			const createPath = ModelHelper.getAbsoluteMetaPathForListBinding(this.base.getView(), listBinding);
			controller._intentBasedNavigation.onChevronPressNavigateOutBound(controller, outbound, undefined, createPath);
		}
	}

	/**
	 * Manages the SideEffects to execute after the document creation.
	 *
	 * @param listBinding ODataListBinding where the document has to be created
	 * @param creationPromise The promise resolved once the document is created
	 * @returns Promise resolves once the SideEffects has been triggered
	 */
	handleSideEffects = async (listBinding: ODataListBinding, creationPromise: Promise<Context>): Promise<void> => {
		try {
			const newContext = await creationPromise;
			// transient contexts are reliably removed once oNewContext.created() is resolved
			await newContext.created();
			// if there are transient contexts, we must avoid requesting side effects
			// this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
			// if list binding is refreshed, transient contexts might be lost
			if (!CommonUtils.hasTransientContext(listBinding)) {
				this.getAppComponent()
					.getSideEffectsService()
					.requestSideEffectsForNavigationProperty(listBinding.getPath(), this.getView().getBindingContext() as Context);
			}
		} catch (error: unknown) {
			Log.error("Error while creating the document", error as string);
		}
	};

	/**
	 * Generates the custom validation messages for the creationRow.
	 *
	 * @param validationMessages The error messages form the custom validation function
	 * @param table The table targeted by the messages
	 */
	createCustomValidationMessages = (validationMessages: { messageTarget?: string; messageText: string }[], table: Table): void => {
		const customValidationFunction = table.getCreationRow().data("customValidationFunction");
		const customValidity = table.getBindingContext("internal")?.getProperty("creationRowCustomValidity");
		const messageManager = Core.getMessageManager();
		const customMessages: {
			code: string;
			text: string;
			persistent: Boolean;
			type: string;
		}[] = [];
		let fieldControl;
		let finalTarget: string;

		// Remove existing CustomValidation message
		const oldMessages = messageManager
			.getMessageModel()
			.getData()
			.filter((message: Message) => message.getCode() === customValidationFunction);
		messageManager.removeMessages(oldMessages);

		validationMessages.forEach((validationMessage) => {
			// Handle Bound CustomValidation message
			if (validationMessage.messageTarget) {
				fieldControl = Core.byId(customValidity[validationMessage.messageTarget].fieldId) as Control;
				finalTarget = `${fieldControl.getBindingContext()?.getPath()}/${fieldControl.getBindingPath("value")}`;
				// Add validation message if still not exists
				if (
					!messageManager
						.getMessageModel()
						.getData()
						.filter((message: Message) => message.getTargets().some((target) => target === finalTarget)).length
				) {
					messageManager.addMessages(
						new Message({
							message: validationMessage.messageText,
							processor: this.getView().getModel(),
							type: MessageType.Error,
							code: customValidationFunction,
							technical: false,
							persistent: false,
							target: finalTarget
						})
					);
				}
				// Add controlId in order to get the focus handling of the error popover
				const existingValidationMessages = messageManager
					.getMessageModel()
					.getData()
					.filter((message: Message) => message.getTargets().some((target) => target === finalTarget));
				existingValidationMessages[0].addControlId(customValidity[validationMessage.messageTarget].fieldId);

				// Handle Unbound CustomValidation message
			} else {
				customMessages.push({
					code: customValidationFunction,
					text: validationMessage.messageText,
					persistent: true,
					type: MessageType.Error
				});
			}
		});

		if (customMessages.length) {
			this.getMessageHandler().showMessageDialog({
				customMessages: customMessages
			});
		}
	};

	/**
	 * Resolves the creation mode
	 * Provides the expected creation mode:
	 *  - preserves the passed creation mode when this one is not a NewPage
	 *  - calculates the new one if the creation mode is a NewPage.
	 *
	 * @param initialCreationMode The initial creation mode
	 * @param listBinding The list binding
	 * @param createData The initial data for object creation
	 * @returns The new creation mode
	 */
	resolveCreationMode = (initialCreationMode: string, listBinding: ODataListBinding, createData: object | undefined): string => {
		if (initialCreationMode !== CreationMode.NewPage) {
			// use the passed creation mode
			return initialCreationMode;
		} else {
			const metaModel = listBinding.getModel().getMetaModel();
			const programmingModel: string = this.getProgrammingModel(listBinding);
			// NewAction is not yet supported for NavigationProperty collection
			if (!listBinding.isRelative()) {
				const dataModelListBindingPath = getInvolvedDataModelObjects(metaModel.getMetaContext(listBinding.getPath()));
				const entitySet = dataModelListBindingPath.targetEntitySet as EntitySet | undefined,
					// if NewAction with parameters is present, then creation is 'Deferred'
					// in the absence of NewAction or NewAction with parameters, creation is async
					newAction = (
						programmingModel === ProgrammingModel.Draft
							? entitySet?.annotations.Common?.DraftRoot
							: entitySet?.annotations.Session?.StickySessionSupported
					)?.NewAction?.toString();

				if (newAction && dataModelListBindingPath.targetEntityType.actions[newAction].parameters.length > 1) {
					// binding parameter (eg: _it) is not considered
					return CreationMode.Deferred;
				}
			}
			const creationParameters = this.getTransactionHelper().getCreationParameters(listBinding, createData, this.getAppComponent());
			if (creationParameters.length) {
				return CreationMode.Deferred;
			}
			return CreationMode.Async;
		}
	};

	/**
	 * Validates a document.
	 *
	 * @returns Promise resolves with result of the custom validation function
	 */

	validateDocument(context: Context, parameters: any): Promise<any> {
		return this.getTransactionHelper().validateDocument(context, parameters, this.getView());
	}

	/**
	 * This function returns an asynchronous function that provides the result of
	 * a creation row's custom validation as a promise. If no creation row is involved
	 * the resulting function returns a resolved promise.
	 *
	 * @param table The table with the creationRow
	 * @returns A function that returns a promise
	 */
	getCreationRowValidationFunction(table: Table | undefined): () => Promise<unknown> {
		const creationRow = table?.getCreationRow();
		if (creationRow && table) {
			return async () => {
				const creationRowObjects = (creationRow.getBindingContext() as Context).getObject();
				delete creationRowObjects["@$ui5.context.isTransient"];
				return this.validateDocument(table.getBindingContext() as Context, {
					data: creationRowObjects,
					customValidationFunction: table.getCreationRow().data("customValidationFunction")
				});
			};
		}
		return async () => Promise.resolve();
	}

	/**
	 * Creates several documents.
	 *
	 * @param listBinding The listBinding used to create the documents
	 * @param dataForCreate The initial data for the new documents
	 * @param createAtEnd True if the new contexts need to be created at the end of the list binding
	 * @param isFromCopyPaste True if the creation has been triggered by a paste action
	 * @param beforeCreateCallBack Callback to be called before the creation
	 * @param createAsInactive True if the contexts need to be created as inactive
	 * @param requestSideEffects True by default, false if SideEffects should not be requested
	 * @returns A Promise with the newly created contexts.
	 */
	async createMultipleDocuments(
		listBinding: ODataListBinding,
		dataForCreate: any[],
		createAtEnd: boolean,
		isFromCopyPaste: boolean,
		beforeCreateCallBack?: Function,
		createAsInactive = false,
		requestSideEffects?: boolean
	) {
		const transactionHelper = this.getTransactionHelper();
		const lockObject = this.getGlobalUIModel();
		const targetListBinding = listBinding;
		requestSideEffects = requestSideEffects !== false;
		if (!createAsInactive) {
			BusyLocker.lock(lockObject);
		}
		try {
			await this.syncTask();
			if (beforeCreateCallBack) {
				await beforeCreateCallBack({ contextPath: targetListBinding.getPath() });
			}

			const metaModel = targetListBinding.getModel().getMetaModel();
			let metaPath: string;

			if (targetListBinding.getContext()) {
				metaPath = metaModel.getMetaPath(`${targetListBinding.getContext().getPath()}/${targetListBinding.getPath()}`);
			} else {
				metaPath = metaModel.getMetaPath(targetListBinding.getPath());
			}

			this.handleCreateEvents(targetListBinding);

			// Iterate on all items and store the corresponding creation promise
			const creationPromises = dataForCreate.map((propertyValues) => {
				const createParameters: any = { data: {} };

				createParameters.keepTransientContextOnFailed = false; // currently not fully supported
				createParameters.creationMode = CreationMode.CreationRow;
				createParameters.createAtEnd = createAtEnd;
				createParameters.inactive = createAsInactive;

				// Remove navigation properties as we don't support deep create
				for (const propertyPath in propertyValues) {
					const property = metaModel.getObject(`${metaPath}/${propertyPath}`);
					if (
						property &&
						property.$kind !== "NavigationProperty" &&
						!propertyPath.includes("/") &&
						propertyValues[propertyPath]
					) {
						createParameters.data[propertyPath] = propertyValues[propertyPath];
					}
				}

				return transactionHelper.createDocument(
					targetListBinding,
					createParameters,
					this.getAppComponent(),
					this.getMessageHandler(),
					isFromCopyPaste
				);
			});

			const createdContexts = await Promise.all(creationPromises);
			if (!createAsInactive) {
				this.setDocumentModifiedOnCreate(targetListBinding);
			}
			// transient contexts are reliably removed once oNewContext.created() is resolved
			const activeContexts = createdContexts.filter((newContext) => !newContext.isInactive());
			await Promise.all(activeContexts.map((newContext) => newContext.created()));

			const viewBindingContext = this.getView().getBindingContext();

			// if there are transient contexts, we must avoid requesting side effects
			// this is avoid a potential list refresh, there could be a side effect that refreshes the list binding
			// if list binding is refreshed, transient contexts might be lost
			if (requestSideEffects && !CommonUtils.hasTransientContext(targetListBinding)) {
				this.getAppComponent()
					.getSideEffectsService()
					.requestSideEffectsForNavigationProperty(targetListBinding.getPath(), viewBindingContext as Context);
			}

			if (ActivitySync.isConnected(this.getView()) && activeContexts.length > 0) {
				this._sendActivity(Activity.Create, activeContexts);
			}

			return createdContexts;
		} catch (err: any) {
			Log.error("Error while creating multiple documents.");
			throw err;
		} finally {
			if (!createAsInactive) {
				BusyLocker.unlock(lockObject);
			}
		}
	}

	/**
	 * This function can be used to intercept the 'Save' action. You can execute custom coding in this function.
	 * The framework waits for the returned promise to be resolved before continuing the 'Save' action.
	 * If you reject the promise, the 'Save' action is stopped and the user stays in edit mode.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeSave
	 * @param _mParameters.context Page context that is going to be saved.
	 * @returns A promise to be returned by the overridden method. If resolved, the 'Save' action is triggered. If rejected, the 'Save' action is not triggered and the user stays in edit mode.
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeSave(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to intercept the 'Create' action. You can execute custom coding in this function.
	 * The framework waits for the returned promise to be resolved before continuing the 'Create' action.
	 * If you reject the promise, the 'Create' action is stopped.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeCreate
	 * @param _mParameters.contextPath Path pointing to the context on which Create action is triggered
	 * @param _mParameters.createParameters Array of values that are filled in the Action Parameter Dialog
	 * @returns A promise to be returned by the overridden method. If resolved, the 'Create' action is triggered. If rejected, the 'Create' action is not triggered.
	 * @public
	 * @since 1.98.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeCreate(_mParameters?: { contextPath?: string; createParameters?: any[] }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to intercept the 'Edit' action. You can execute custom coding in this function.
	 * The framework waits for the returned promise to be resolved before continuing the 'Edit' action.
	 * If you reject the promise, the 'Edit' action is stopped and the user stays in display mode.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeEdit
	 * @param _mParameters.context Page context that is going to be edited.
	 * @returns A promise to be returned by the overridden method. If resolved, the 'Edit' action is triggered. If rejected, the 'Edit' action is not triggered and the user stays in display mode.
	 * @public
	 * @since 1.98.0
	 */
	@publicExtension()
	@extensible("AfterAsync")
	onBeforeEdit(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to intercept the 'Discard' action. You can execute custom coding in this function.
	 * The framework waits for the returned promise to be resolved before continuing the 'Discard' action.
	 * If you reject the promise, the 'Discard' action is stopped and the user stays in edit mode.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeDiscard
	 * @param _mParameters.context Page context that is going to be discarded.
	 * @returns A promise to be returned by the overridden method. If resolved, the 'Discard' action is triggered. If rejected, the 'Discard' action is not triggered and the user stays in edit mode.
	 * @public
	 * @since 1.98.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeDiscard(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to intercept the 'Delete' action. You can execute custom coding in this function.
	 * The framework waits for the returned promise to be resolved before continuing the 'Delete' action.
	 * If you reject the promise, the 'Delete' action is stopped.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeDelete
	 * @param _mParameters.contexts An array of contexts that are going to be deleted
	 * @returns A promise to be returned by the overridden method. If resolved, the 'Delete' action is triggered. If rejected, the 'Delete' action is not triggered.
	 * @public
	 * @since 1.98.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	onBeforeDelete(_mParameters?: { contexts?: Context[] }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to execute code after the 'Save' action.
	 * You can execute custom coding in this function.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeSave
	 * @param _mParameters.context The context we obtained after saving
	 * @returns A promise to be returned by the overridden method.
	 * @public
	 * @since 1.116.0
	 */
	@publicExtension()
	@hookable("after")
	@extensible(OverrideExecution.After)
	async onAfterSave(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to execute code after the 'Create' action.
	 * You can execute custom coding in this function.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeCreate
	 * @param _mParameters.context The newly created context
	 * @returns A promise to be returned by the overridden method.
	 * @public
	 * @since 1.116.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	async onAfterCreate(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to execute code after the 'Edit' action.
	 * You can execute custom coding in this function.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeEdit
	 * @param _mParameters.context Page context that is going to be edited.
	 * @returns A promise to be returned by the overridden method.
	 * @public
	 * @since 1.116.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	async onAfterEdit(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to execute code after the 'Discard' action.
	 * You can execute custom coding in this function.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeDiscard
	 * @param _mParameters.context The context obtained after discarding the object, or undefined if we discarded a new object
	 * @returns A promise to be returned by the overridden method.
	 * @public
	 * @since 1.116.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	async onAfterDiscard(_mParameters?: { context?: Context }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	/**
	 * This function can be used to execute code after the 'Delete' action.
	 * You can execute custom coding in this function.
	 *
	 * This function is meant to be individually overridden by consuming controllers, but not to be called directly.
	 * The override execution is: {@link sap.ui.core.mvc.OverrideExecution.After}.
	 *
	 * @param _mParameters Object containing the parameters passed to onBeforeDelete
	 * @param _mParameters.contexts An array of contexts that are going to be deleted
	 * @returns A promise to be returned by the overridden method.
	 * @public
	 * @since 1.116.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	async onAfterDelete(_mParameters?: { contexts?: Context[] }): Promise<void> {
		// to be overridden
		return Promise.resolve();
	}

	// Internal only params ---
	// @param {boolean} mParameters.bExecuteSideEffectsOnError Indicates whether SideEffects need to be ignored when user clicks on Save during an Inline creation
	// @param {object} mParameters.bindings List bindings of the tables in the view.
	// Both of the above parameters are for the same purpose. User can enter some information in the creation row(s) but does not 'Add row', instead clicks Save.
	// There can be more than one in the view.

	/**
	 * Saves a new document after checking it.
	 *
	 * @param oContext  Context of the editable document
	 * @param mParameters PRIVATE
	 * @returns Promise resolves once save is complete
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async saveDocument(oContext: Context, mParameters: SaveDocumentParameters): Promise<void> {
		mParameters = mParameters || {};
		const bExecuteSideEffectsOnError = mParameters.bExecuteSideEffectsOnError || undefined;
		const transactionHelper = this.getTransactionHelper();
		const aBindings = mParameters.bindings as ODataListBinding[];

		try {
			await this.syncTask();
			// in case of saving / activating the bound transition messages shall be removed before the PATCH/POST
			// is sent to the backend
			this.getMessageHandler().removeTransitionMessages();
			if (mParameters.mergePatchDraft !== true) {
				await this._submitOpenChanges(oContext);
				//we need to request for recommendations and then bring the dialog here
			}
			await this._checkForValidationErrors();
			if (this.base.recommendations.checkIfRecommendationsExist()) {
				const isAcceptOrIgnore = await this.showConfirmRecommendationsDialog(true);
				if (isAcceptOrIgnore === false) {
					return await Promise.reject("Cancel");
				}
			}
			await this.base.editFlow.onBeforeSave({ context: oContext });

			const sProgrammingModel = this.getProgrammingModel(oContext);
			const oRootViewController = this._getRootViewController() as any;
			let siblingInfo: SiblingInformation | undefined;
			if (
				(sProgrammingModel === ProgrammingModel.Sticky || oContext.getProperty("HasActiveEntity")) &&
				oRootViewController.isFclEnabled()
			) {
				// No need to try to get rightmost context in case of a new object
				siblingInfo = await this._computeSiblingInformation(
					oContext,
					oRootViewController.getRightmostContext(),
					sProgrammingModel,
					true
				);
			}

			// The $auto queue can only have pending changes at this point when SAVE was clicked immediately after changing a field.
			// In this case the $auto queue is locked therefore the following submit batch should not create a separate batch request.
			// It is done in order to make sure that patch, draftprepare, draftactivate each have their own changeset
			if (oContext.getModel().hasPendingChanges("$auto") && mParameters.mergePatchDraft) {
				oContext.getModel().submitBatch("$auto");
			}
			const activeDocumentContext = await transactionHelper.saveDocument(
				oContext,
				this.getAppComponent(),
				this._getResourceModel(),
				bExecuteSideEffectsOnError as boolean,
				aBindings,
				this.getMessageHandler(),
				this.getCreationMode()
			);
			this._removeStickySessionInternalProperties(sProgrammingModel);

			await this.base.editFlow.onAfterSave({ context: activeDocumentContext });

			this._sendActivity(Activity.Activate, activeDocumentContext);
			ActivitySync.disconnect(this.getView());

			this._triggerConfiguredSurvey(StandardActions.save, TriggerType.standardAction);

			this.setDocumentModified(false);
			this.setEditMode(EditMode.Display, false);
			this.getMessageHandler().showMessageDialog();

			if (activeDocumentContext !== oContext) {
				let contextToNavigate = activeDocumentContext;
				siblingInfo = siblingInfo ?? this._createSiblingInfo(oContext, activeDocumentContext);
				this._updatePathsInHistory(siblingInfo.pathMapping);
				if (oRootViewController.isFclEnabled()) {
					if (siblingInfo.targetContext.getPath() !== activeDocumentContext.getPath()) {
						contextToNavigate = siblingInfo.targetContext;
					}
				}

				await this._handleNewContext(contextToNavigate, { editable: false, recreateContext: false, forceFocus: true });
			}
		} catch (oError: any) {
			if (!(oError && oError.canceled)) {
				Log.error("Error while saving the document", oError);
			}
			throw oError;
		}
	}

	/**
	 * Switches the UI between draft and active document.
	 *
	 * @param oContext The context to switch from
	 * @returns Promise resolved once the switch is done
	 */
	async toggleDraftActive(oContext: Context): Promise<void> {
		const oContextData = oContext.getObject();
		let editable: boolean;
		const bIsDraft = oContext && this.getProgrammingModel(oContext) === ProgrammingModel.Draft;

		//toggle between draft and active document is only available for edit drafts and active documents with draft)
		if (
			!bIsDraft ||
			!(
				(!oContextData.IsActiveEntity && oContextData.HasActiveEntity) ||
				(oContextData.IsActiveEntity && oContextData.HasDraftEntity)
			)
		) {
			return;
		}

		if (!oContextData.IsActiveEntity && oContextData.HasActiveEntity) {
			//start Point: edit draft
			editable = false;
		} else {
			// start point active document
			editable = true;
		}

		try {
			const oRootViewController = this._getRootViewController() as any;
			const oRightmostContext = oRootViewController.isFclEnabled() ? oRootViewController.getRightmostContext() : oContext;
			let siblingInfo = await this._computeSiblingInformation(oContext, oRightmostContext, ProgrammingModel.Draft, false);
			if (!siblingInfo && oContext !== oRightmostContext) {
				// Try to compute sibling info for the root context if it fails for the rightmost context
				// --> In case of FCL, if we try to switch between draft and active but a child entity has no sibling, the switch will close the child column
				siblingInfo = await this._computeSiblingInformation(oContext, oContext, ProgrammingModel.Draft, false);
			}
			if (siblingInfo) {
				this.setEditMode(editable ? EditMode.Editable : EditMode.Display, false); //switch to edit mode only if a draft is available

				if (oRootViewController.isFclEnabled()) {
					const lastSemanticMapping = this._getSemanticMapping();
					if (lastSemanticMapping?.technicalPath === oContext.getPath()) {
						const targetPath = siblingInfo.pathMapping[siblingInfo.pathMapping.length - 1].newPath;
						siblingInfo.pathMapping.push({ oldPath: lastSemanticMapping.semanticPath, newPath: targetPath });
					}
				}
				this._updatePathsInHistory(siblingInfo.pathMapping);

				await this._handleNewContext(siblingInfo.targetContext, { editable, recreateContext: true, forceFocus: true });
			} else {
				throw new Error("Error in EditFlow.toggleDraftActive - Cannot find sibling");
			}
		} catch (oError) {
			throw new Error(`Error in EditFlow.toggleDraftActive:${oError}`);
		}
	}

	// Internal only params ---
	// @param {sap.m.Button} mParameters.cancelButton - Currently this is passed as cancelButton internally (replaced by mParameters.control in the JSDoc below). Currently it is also mandatory.
	// Plan - This should not be mandatory. If not provided, we should have a default that can act as reference control for the discard popover OR we can show a dialog instead of a popover.

	/**
	 * Discard the editable document.
	 *
	 * @param oContext  Context of the editable document
	 * @param mParameters Can contain the following attributes:
	 * @param mParameters.control This is the control used to open the discard popover
	 * @param mParameters.skipDiscardPopover Optional, supresses the discard popover and allows custom handling
	 * @returns Promise resolves once editable document has been discarded
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async cancelDocument(oContext: Context, mParameters: { control?: object; skipDiscardPopover?: boolean }): Promise<any> {
		const transactionHelper = this.getTransactionHelper();
		const mInParameters: any = mParameters;
		let siblingInfo: SiblingInformation | undefined;
		let isNewDocument = false;
		mInParameters.cancelButton = mParameters.control || mInParameters.cancelButton;
		mInParameters.beforeCancelCallBack = this.base.editFlow.onBeforeDiscard;

		try {
			await this.syncTask();
			const sProgrammingModel = this.getProgrammingModel(oContext);
			if ((sProgrammingModel === ProgrammingModel.Sticky || oContext.getProperty("HasActiveEntity")) && this._isFclEnabled()) {
				const oRootViewController = this._getRootViewController() as any;

				// No need to try to get rightmost context in case of a new object
				siblingInfo = await this._computeSiblingInformation(
					oContext,
					oRootViewController.getRightmostContext(),
					sProgrammingModel,
					true
				);
			}

			const cancelResult = await transactionHelper.cancelDocument(
				oContext,
				mInParameters,
				this.getAppComponent(),
				this._getResourceModel(),
				this.getMessageHandler(),
				this.getCreationMode(),
				this.isDocumentModified()
			);
			this._getRootViewController()
				.getInstancedViews()
				.forEach((view) => {
					const context = view.getBindingContext() as ODataV4Context;
					if (context && context.isKeepAlive()) {
						context.setKeepAlive(false);
					}
				});
			this._removeStickySessionInternalProperties(sProgrammingModel);

			this.setEditMode(EditMode.Display, false);
			this.setDocumentModified(false);
			this.setDraftStatus(DraftStatus.Clear);

			await this.base.editFlow.onAfterDiscard({
				context: typeof cancelResult === "boolean" || cancelResult === null ? undefined : cancelResult
			});
			// we force the edit state even for FCL because the draft discard might not be implemented
			// and we may just delete the draft
			EditState.setEditStateDirty();
			if (!cancelResult) {
				this._sendActivity(Activity.Discard, undefined);
				ActivitySync.disconnect(this.getView());
				//in case of a new document, no activeContext is returned --> navigate back.
				if (!mInParameters.skipBackNavigation) {
					await this.getInternalRouting().navigateBackFromContext(oContext);
					isNewDocument = true;
				}
			} else {
				const oActiveDocumentContext = cancelResult as Context;
				this._sendActivity(Activity.Discard, oActiveDocumentContext);
				ActivitySync.disconnect(this.getView());
				let contextToNavigate = oActiveDocumentContext;
				siblingInfo = siblingInfo ?? this._createSiblingInfo(oContext, oActiveDocumentContext);
				this._updatePathsInHistory(siblingInfo.pathMapping);
				if (this._isFclEnabled()) {
					if (siblingInfo.targetContext.getPath() !== oActiveDocumentContext.getPath()) {
						contextToNavigate = siblingInfo.targetContext;
					}
				}

				if (sProgrammingModel === ProgrammingModel.Draft) {
					// We need to load the semantic keys of the active context, as we need them
					// for the navigation
					await this._fetchSemanticKeyValues(oActiveDocumentContext);
					// We force the recreation of the context, so that it's created and bound in the same microtask,
					// so that all properties are loaded together by autoExpandSelect, so that when switching back to Edit mode
					// $$inheritExpandSelect takes all loaded properties into account (BCP 2070462265)
					if (!mInParameters.skipBindingToView) {
						await this._handleNewContext(contextToNavigate, { editable: false, recreateContext: true, forceFocus: true });
					} else {
						return oActiveDocumentContext;
					}
				} else {
					//active context is returned in case of cancel of existing document
					await this._handleNewContext(contextToNavigate, { editable: false, recreateContext: false, forceFocus: true });
				}
			}
			if (sProgrammingModel === ProgrammingModel.Draft) {
				//show Draft discarded message toast only for draft enabled apps
				this.showDocumentDiscardMessage(isNewDocument);
			}
		} catch (oError) {
			Log.error("Error while discarding the document", oError as any);
		}
	}

	/**
	 * Brings up a message toast when a draft is discarded.
	 *
	 * @param isNewDocument This is a Boolean flag that determines whether the document is new or already exists.
	 */
	showDocumentDiscardMessage(isNewDocument?: boolean) {
		const resourceModel = this._getResourceModel();
		const message = resourceModel.getText("C_TRANSACTION_HELPER_DISCARD_DRAFT_TOAST");
		if (isNewDocument == true) {
			const appComponent = this.getAppComponent();
			appComponent.getRoutingService().attachAfterRouteMatched(this.showMessageWhenNoContext, this);
		} else {
			MessageToast.show(message);
		}
	}

	/**
	 * We use this function in showDocumentDiscardMessage when no context is passed.
	 */
	showMessageWhenNoContext() {
		const resourceModel = this._getResourceModel();
		const message = resourceModel.getText("C_TRANSACTION_HELPER_DISCARD_DRAFT_TOAST");
		const appComponent = this.getAppComponent();
		MessageToast.show(message);
		appComponent.getRoutingService().detachAfterRouteMatched(this.showMessageWhenNoContext, this);
	}

	/**
	 * Checks if a context corresponds to a draft root.
	 *
	 * @param context The context to check
	 * @returns True if the context points to a draft root
	 */
	private isDraftRoot(context: Context): boolean {
		const metaModel = context.getModel().getMetaModel();
		const metaContext = metaModel.getMetaContext(context.getPath());
		return ModelHelper.isDraftRoot(getInvolvedDataModelObjects(metaContext).targetEntitySet);
	}

	// Internal only params ---
	// @param {string} mParameters.entitySetName Name of the EntitySet to which the object belongs

	/**
	 * Deletes the document.
	 *
	 * @param oContext  Context of the document
	 * @param mInParameters Can contain the following attributes:
	 * @param mInParameters.title Title of the object being deleted
	 * @param mInParameters.description Description of the object being deleted
	 * @returns Promise resolves once document has been deleted
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async deleteDocument(oContext: Context, mInParameters: { title: string; description: string }): Promise<void> {
		const oAppComponent = this.getAppComponent();
		let mParameters: any = mInParameters;
		if (!mParameters) {
			mParameters = {
				bFindActiveContexts: false
			};
		} else {
			mParameters.bFindActiveContexts = false;
		}
		mParameters.beforeDeleteCallBack = this.base.editFlow.onBeforeDelete;
		try {
			if (
				this._isFclEnabled() &&
				this.isDraftRoot(oContext) &&
				oContext.getIndex() === undefined &&
				oContext.getProperty("IsActiveEntity") === true &&
				oContext.getProperty("HasDraftEntity") === true
			) {
				// Deleting an active entity which has a draft that could potentially be displayed in the ListReport (FCL case)
				// --> need to remove the draft from the LR and replace it with the active version, so that the ListBinding is properly refreshed
				// The condition 'oContext.getIndex() === undefined' makes sure the active version isn't already displayed in the LR
				mParameters.beforeDeleteCallBack = async (parameters?: { contexts?: Context[] }) => {
					await this.base.editFlow.onBeforeDelete(parameters);

					try {
						const model = oContext.getModel();
						const siblingContext = model.bindContext(`${oContext.getPath()}/SiblingEntity`).getBoundContext();
						const draftPath = await siblingContext.requestCanonicalPath();
						const draftContextToRemove = model.getKeepAliveContext(draftPath);
						draftContextToRemove.replaceWith(oContext);
					} catch (error) {
						Log.error("Error while replacing the draft instance in the LR ODLB", error as any);
					}
				};
			}

			if (this.getProgrammingModel(oContext) === ProgrammingModel.Sticky) {
				this.setDocumentModified(true);
			}
			await this.deleteDocumentTransaction(oContext, mParameters);

			// Single objet deletion is triggered from an OP header button (not from a list)
			// --> Mark UI dirty and navigate back to dismiss the OP
			if (!this._isFclEnabled()) {
				EditState.setEditStateDirty();
			}

			this._sendActivity(Activity.Delete, oContext);

			// After delete is successfull, we need to detach the setBackNavigation Methods
			if (oAppComponent) {
				oAppComponent.getShellServices().setBackNavigation();
			}

			// Notify consumers of which contexts were deleted
			await this.base.editFlow.onAfterDelete({ contexts: [oContext] });

			if (oAppComponent?.getStartupMode() === StartupMode.Deeplink && !this._isFclEnabled()) {
				// In case the app has been launched with semantic keys, deleting the object we've landed on shall navigate back
				// to the app we came from (except for FCL, where we navigate to LR as usual)
				oAppComponent.getRouterProxy().exitFromApp();
			} else {
				this.getInternalRouting().navigateBackFromContext(oContext);
			}
		} catch (error) {
			Log.error("Error while deleting the document", error as any);
		}
	}

	/**
	 * Submit the current set of changes and navigate back.
	 *
	 * @param oContext  Context of the document
	 * @returns Promise resolves once the changes have been saved
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	async applyDocument(oContext: Context): Promise<void> {
		const oLockObject = this.getGlobalUIModel();

		try {
			await this.syncTask();
			if (oContext.getModel().hasPendingChanges("$auto")) {
				BusyLocker.lock(oLockObject);
				await this._submitOpenChanges(oContext);
				//we need to request for recommendations and then bring the dialog here
			}
			if (this.base.recommendations.checkIfRecommendationsExist()) {
				const isAcceptOrIgnore = await this.showConfirmRecommendationsDialog(false);
				if (isAcceptOrIgnore === false) {
					return;
				}
			}
			await this._checkForValidationErrors();
			await this.getMessageHandler().showMessageDialog();
			await this.getInternalRouting().navigateBackFromContext(oContext);
		} finally {
			if (BusyLocker.isLocked(oLockObject)) {
				BusyLocker.unlock(oLockObject);
			}
		}
	}

	// Internal only params ---
	// @param {boolean} [mParameters.bStaticAction] Boolean value for static action, undefined for other actions
	// @param {boolean} [mParameters.isNavigable] Boolean value indicating whether navigation is required after the action has been executed
	// Currently the parameter isNavigable is used internally and should be changed to requiresNavigation as it is a more apt name for this param

	/**
	 * Invokes an action (bound or unbound) and tracks the changes so that other pages can be refreshed and show the updated data upon navigation.
	 *
	 * @param sActionName The name of the action to be called
	 * @param mInParameters Contains the following attributes:
	 * @param mInParameters.parameterValues A map of action parameter names and provided values
	 * @param mInParameters.parameterValues.name Name of the parameter
	 * @param mInParameters.parameterValues.value Value of the parameter
	 * @param mInParameters.skipParameterDialog Skips the action parameter dialog if values are provided for all of them in parameterValues
	 * @param mInParameters.contexts For a bound action, a context or an array with contexts for which the action is to be called must be provided
	 * @param mInParameters.model For an unbound action, an instance of an OData V4 model must be provided
	 * @param mInParameters.requiresNavigation Boolean value indicating whether navigation is required after the action has been executed. Navigation takes place to the context returned by the action
	 * @param mInParameters.label A human-readable label for the action. This is needed in case the action has a parameter and a parameter dialog is shown to the user. The label will be used for the title of the dialog and for the confirmation button
	 * @param mInParameters.invocationGrouping Mode how actions are to be called: 'ChangeSet' to put all action calls into one changeset, 'Isolated' to put them into separate changesets
	 * @param mExtraParams PRIVATE
	 * @returns A promise which resolves once the action has been executed, providing the response
	 * @public
	 * @since 1.90.0
	 * @final
	 */
	@publicExtension()
	@finalExtension()
	async invokeAction(
		sActionName: string,
		mInParameters?: {
			parameterValues?: { name: string; value: any };
			skipParameterDialog?: boolean;
			contexts?: Context | Context[];
			model?: ODataModel;
			requiresNavigation?: boolean;
			label?: string;
			invocationGrouping?: string;
		},
		mExtraParams?: any
	): Promise<void> {
		let oControl: any;
		const transactionHelper = this.getTransactionHelper();
		let aParts;
		let sOverloadEntityType;
		let oCurrentActionCallBacks: any;
		const oView = this.base.getView();

		let mParameters: any = mInParameters || {};
		// Due to a mistake the invokeAction in the extensionAPI had a different API than this one.
		// The one from the extensionAPI doesn't exist anymore as we expose the full edit flow now but
		// due to compatibility reasons we still need to support the old signature
		if (
			(mParameters.isA && mParameters.isA("sap.ui.model.odata.v4.Context")) ||
			Array.isArray(mParameters) ||
			mExtraParams !== undefined
		) {
			const contexts = mParameters;
			mParameters = mExtraParams || {};
			if (contexts) {
				mParameters.contexts = contexts;
			} else {
				mParameters.model = this.getView().getModel();
			}
		}

		mParameters.isNavigable = mParameters.requiresNavigation || mParameters.isNavigable;

		// Determine if the referenced action is bound or unbound
		const convertedMetadata = convertTypes(this.getView().getModel()?.getMetaModel() as ODataMetaModel);
		// The EntityContainer may NOT be missing, so it should not be able to be undefined, but since in our converted Metadata
		// it can be undefined, I need this workaround here of adding "" since indexOf does not accept something that's
		// undefined.
		if (sActionName.includes("" + convertedMetadata.entityContainer.name)) {
			// Unbound actions are always referenced via the action import and we found the EntityContainer in the sActionName so
			// an unbound action is referenced!
			mParameters.isBound = false;
		} else {
			// No entity container in the sActionName, so either a bound or static action is referenced which is also bound!
			mParameters.isBound = true;
		}

		if (!mParameters.parentControl) {
			mParameters.parentControl = this.getView();
		}

		if (!mParameters.entitySetName && mParameters.contexts && mParameters.model) {
			mParameters.entitySetName = mParameters.model
				.getMetaModel()
				.getMetaContext(mParameters.contexts.getPath())
				.getObject("@sapui.name");
		}

		if (mParameters.controlId) {
			oControl = this.getView().byId(mParameters.controlId);
			if (oControl) {
				// TODO: currently this selected contexts update is done within the operation, should be moved out
				mParameters.internalModelContext = oControl.getBindingContext("internal");
			}
		} else {
			mParameters.internalModelContext = oView.getBindingContext("internal");
		}

		if (sActionName && sActionName.includes("(")) {
			// get entity type of action overload and remove it from the action path
			// Example sActionName = "<ActionName>(Collection(<OverloadEntityType>))"
			// sActionName = aParts[0] --> <ActionName>
			// sOverloadEntityType = aParts[2] --> <OverloadEntityType>
			aParts = sActionName.split("(");
			sActionName = aParts[0];
			sOverloadEntityType = (aParts[aParts.length - 1] as any).replaceAll(")", "");
		}

		if (mParameters.bStaticAction) {
			if (oControl.isTableBound()) {
				mParameters.contexts = (
					this.getView().getModel()?.bindList(oControl.getRowBinding().getHeaderContext().getPath()) as ODataListBinding
				).getHeaderContext();
			} else {
				const sBindingPath = oControl.data("rowsBindingInfo").path,
					oListBinding = new (ODataListBinding as any)(this.getView().getModel(), sBindingPath);
				mParameters.contexts = oListBinding.getHeaderContext();
			}

			if (sOverloadEntityType && oControl.getBindingContext()) {
				mParameters.contexts = this._getActionOverloadContextFromMetadataPath(
					oControl.getBindingContext(),
					oControl.getRowBinding(),
					sOverloadEntityType
				);
			}

			if (mParameters.enableAutoScroll) {
				oCurrentActionCallBacks = this.createActionPromise(sActionName, oControl.sId);
			}
		}
		mParameters.bGetBoundContext = this._getBoundContext(oView, mParameters);
		// Need to know that the action is called from ObjectPage for changeSet Isolated workaround
		mParameters.bObjectPage = (oView.getViewData() as any).converterType === "ObjectPage";

		try {
			await this.syncTask();
			const oResponse = await transactionHelper.callAction(
				sActionName,
				mParameters,
				this.getView(),
				this.getAppComponent(),
				this.getMessageHandler()
			);
			let listRefreshed: boolean | undefined;
			if (mParameters.contexts && mParameters.isBound === true) {
				listRefreshed = await this._refreshListIfRequired(
					this.getActionResponseDataAndKeys(sActionName, oResponse),
					mParameters.contexts[0]
				);
			}
			if (ActivitySync.isConnected(this.getView())) {
				let actionRequestedProperties: string[] = [];
				if (oResponse) {
					actionRequestedProperties = Array.isArray(oResponse)
						? Object.keys(oResponse[0].value.getObject())
						: Object.keys(oResponse.getObject());
				}
				this._sendActivity(Activity.Action, mParameters.contexts, sActionName, listRefreshed, actionRequestedProperties);
			}
			this._triggerConfiguredSurvey(sActionName, TriggerType.action);

			if (oCurrentActionCallBacks) {
				oCurrentActionCallBacks.fResolver(oResponse);
			}
			/*
					We set the (upper) pages to dirty after an execution of an action
					TODO: get rid of this workaround
					This workaround is only needed as long as the model does not support the synchronization.
					Once this is supported we don't need to set the pages to dirty anymore as the context itself
					is already refreshed (it's just not reflected in the object page)
					we explicitly don't call this method from the list report but only call it from the object page
					as if it is called in the list report it's not needed - as we anyway will remove this logic
					we can live with this
					we need a context to set the upper pages to dirty - if there are more than one we use the
					first one as they are anyway siblings
					*/
			if (mParameters.contexts) {
				if (!this._isFclEnabled()) {
					EditState.setEditStateDirty();
				}
				this.getInternalModel().setProperty("/lastInvokedAction", sActionName);
			}
			if (mParameters.isNavigable) {
				let vContext = oResponse;
				if (Array.isArray(vContext) && vContext.length === 1) {
					vContext = vContext[0].value;
				}
				if (vContext && !Array.isArray(vContext)) {
					const oMetaModel = oView.getModel().getMetaModel();
					const sContextMetaPath = oMetaModel.getMetaPath(vContext.getPath());
					const _fnValidContexts = (contexts: any, applicableContexts: any) => {
						return contexts.filter((element: any) => {
							if (applicableContexts) {
								return applicableContexts.indexOf(element) > -1;
							}
							return true;
						});
					};
					const oActionContext = Array.isArray(mParameters.contexts)
						? _fnValidContexts(mParameters.contexts, mParameters.applicableContexts)[0]
						: mParameters.contexts;
					const sActionContextMetaPath = oActionContext && oMetaModel.getMetaPath(oActionContext.getPath());
					if (sContextMetaPath != undefined && sContextMetaPath === sActionContextMetaPath) {
						if (oActionContext.getPath() !== vContext.getPath()) {
							this.getInternalRouting().navigateForwardToContext(vContext, {
								checkNoHashChange: true
							});
						} else {
							Log.info("Navigation to the same context is not allowed");
						}
					}
				}
			}
			this.base.editFlow.onAfterActionExecution(sActionName);
			return oResponse;
		} catch (err: any) {
			if (oCurrentActionCallBacks) {
				oCurrentActionCallBacks.fRejector();
			}
			// FIXME: in most situations there is no handler for the rejected promises returnedq
			if (err === Constants.CancelActionDialog) {
				// This leads to console error. Actually the error is already handled (currently directly in press handler of end button in dialog), so it should not be forwarded
				// up to here. However, when dialog handling and backend execution are separated, information whether dialog was cancelled, or backend execution has failed needs
				// to be transported to the place responsible for connecting these two things.
				// TODO: remove special handling one dialog handling and backend execution are separated
				throw new Error("Dialog cancelled");
			} else if (!(err && (err.canceled || (err.rejectedItems && err.rejectedItems[0].canceled)))) {
				// TODO: analyze, whether this is of the same category as above
				throw new Error(`Error in EditFlow.invokeAction:${err}`);
			}
			// TODO: Any unexpected errors probably should not be ignored!
		}
	}

	/**
	 * Hook which can be overridden after the action execution.
	 *
	 * @param _actionName Name of the action
	 * @since 1.114.0
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	async onAfterActionExecution(_actionName: string) {
		//to be overridden
	}

	/**
	 * Secured execution of the given function. Ensures that the function is only executed when certain conditions are fulfilled.
	 *
	 * @param fnFunction The function to be executed. Should return a promise that is settled after completion of the execution. If nothing is returned, immediate completion is assumed.
	 * @param mParameters Definitions of the preconditions to be checked before execution
	 * @param mParameters.busy Defines the busy indicator
	 * @param mParameters.busy.set Triggers a busy indicator when the function is executed.
	 * @param mParameters.busy.check Executes function only if application isn't busy.
	 * @param mParameters.updatesDocument This operation updates the current document without using the bound model and context. As a result, the draft status is updated if a draft document exists, and the user has to confirm the cancellation of the editing process.
	 * @returns A promise that is rejected if the execution is prohibited and resolved by the promise returned by the fnFunction.
	 * @public
	 * @since 1.90.0
	 */
	@publicExtension()
	@finalExtension()
	securedExecution(
		fnFunction: Function,
		mParameters?: {
			busy?: {
				set?: boolean;
				check?: boolean;
			};
			updatesDocument?: boolean;
		}
	): Promise<void> {
		const bBusySet = mParameters?.busy?.set ?? true,
			bBusyCheck = mParameters?.busy?.check ?? true,
			bUpdatesDocument = mParameters?.updatesDocument ?? false,
			oLockObject = this.getGlobalUIModel(),
			oContext = this.getView().getBindingContext(),
			bIsDraft = oContext && this.getProgrammingModel(oContext as Context) === ProgrammingModel.Draft;

		if (bBusyCheck && BusyLocker.isLocked(oLockObject)) {
			return Promise.reject("Application already busy therefore execution rejected");
		}

		// we have to set busy and draft indicator immediately also the function might be executed later in queue
		if (bBusySet) {
			BusyLocker.lock(oLockObject);
		}
		if (bUpdatesDocument && bIsDraft) {
			this.setDraftStatus(DraftStatus.Saving);
		}

		this.getMessageHandler().removeTransitionMessages();

		return this.syncTask(fnFunction as () => any)
			.then(() => {
				if (bUpdatesDocument) {
					this.setDocumentModified(true);
					if (!this._isFclEnabled()) {
						EditState.setEditStateDirty();
					}
					if (bIsDraft) {
						this.setDraftStatus(DraftStatus.Saved);
					}
				}
			})
			.catch((oError: any) => {
				if (bUpdatesDocument && bIsDraft) {
					this.setDraftStatus(DraftStatus.Clear);
				}
				return Promise.reject(oError);
			})
			.finally(() => {
				if (bBusySet) {
					BusyLocker.unlock(oLockObject);
				}
				this.getMessageHandler().showMessageDialog();
			});
	}

	/**
	 * Handles the patchSent event: register document modification.
	 *
	 * @param oEvent The event sent by the binding
	 */
	handlePatchSent(oEvent: Event) {
		// In collaborative draft, disable ETag check for PATCH requests
		const isInCollaborativeDraft = ActivitySync.isConnected(this.getView());
		if (isInCollaborativeDraft) {
			((oEvent.getSource() as Binding).getModel() as any).setIgnoreETag(true);
		}
		if (!(this.getView()?.getBindingContext("internal") as InternalModelContext)?.getProperty("skipPatchHandlers")) {
			const sourceBinding = oEvent.getSource() as ODataListBinding;
			// Create a promise that will be resolved or rejected when the path is completed
			const oPatchPromise = new Promise<void>((resolve, reject) => {
				oEvent.getSource().attachEventOnce("patchCompleted", (patchCompletedEvent: any) => {
					// Re-enable ETag checks
					if (isInCollaborativeDraft) {
						((oEvent.getSource() as Binding).getModel() as any).setIgnoreETag(false);
					}

					if (oEvent.getSource().isA("sap.ui.model.odata.v4.ODataListBinding")) {
						ActionRuntime.setActionEnablementAfterPatch(
							this.getView(),
							sourceBinding,
							this.getView()?.getBindingContext("internal") as InternalModelContext
						);
					}
					const bSuccess = patchCompletedEvent.getParameter("success");
					if (bSuccess) {
						resolve();
					} else {
						reject();
					}
				});
			});
			this.updateDocument(sourceBinding, oPatchPromise);
		}
	}

	/**
	 * Performs a task in sync with other tasks created via this function.
	 * Returns the promise chain of the task.
	 *
	 * @param [newTask] Optional, a promise or function to be executed synchronously
	 * @returns Promise resolves once the task is completed
	 */
	syncTask(newTask?: (() => any) | Promise<any>) {
		if (newTask) {
			if (typeof newTask === "function") {
				this.syncTasks = this.syncTasks.then(newTask).catch(function () {
					return Promise.resolve();
				});
			} else {
				this.syncTasks = this.syncTasks
					.then(() => newTask)
					.catch(function () {
						return Promise.resolve();
					});
			}
		}

		return this.syncTasks;
	}

	/**
	 * Decides if a document is to be shown in display or edit mode.
	 *
	 * @param oContext The context to be displayed or edited
	 * @returns {Promise} Promise resolves once the edit mode is computed
	 */

	async computeEditMode(context: Context): Promise<void> {
		const programmingModel = this.getProgrammingModel(context);

		if (programmingModel === ProgrammingModel.Draft) {
			try {
				this.setDraftStatus(DraftStatus.Clear);
				const globalModel = this.getGlobalUIModel();
				globalModel.setProperty("/isEditablePending", true, undefined, true);
				const isActiveEntity = await context.requestObject("IsActiveEntity");
				if (isActiveEntity === false) {
					// in case the document is draft set it in edit mode
					this.setEditMode(EditMode.Editable);
					const hasActiveEntity = await context.requestObject("HasActiveEntity");
					this.setEditMode(undefined, !hasActiveEntity);
				} else {
					// active document, stay on display mode
					this.setEditMode(EditMode.Display, false);
				}
				globalModel.setProperty("/isEditablePending", false, undefined, true);
			} catch (error: any) {
				Log.error("Error while determining the editMode for draft", error);
				throw error;
			}
		} else if (programmingModel === ProgrammingModel.Sticky) {
			const lastInvokedActionName = this.getInternalModel().getProperty("/lastInvokedAction");
			if (lastInvokedActionName && this.isNewActionForSticky(lastInvokedActionName, context)) {
				this.setEditMode(EditMode.Editable, true);
				if (!this.getAppComponent()._isFclEnabled()) {
					EditState.setEditStateDirty();
				}
				this.handleStickyOn(context);
				this._setStickySessionInternalProperties(this.getProgrammingModel(context), context.getModel());
				this.getInternalModel().setProperty("/lastInvokedAction", undefined);
			}
		}
	}

	//////////////////////////////////////
	// Private methods
	//////////////////////////////////////

	/**
	 * Internal method to delete a context or an array of contexts.
	 *
	 * @param contexts The context(s) to be deleted
	 * @param parameters Parameters for deletion
	 */
	private async deleteDocumentTransaction(contexts: Context | Context[], parameters: any): Promise<void> {
		const resourceModel = this._getResourceModel();
		const transactionHelper = this.getTransactionHelper();

		// TODO: this setting and removing of contexts shouldn't be in the transaction helper at all
		// for the time being I kept it and provide the internal model context to not break something
		parameters.internalModelContext = parameters.controlId
			? sap.ui.getCore().byId(parameters.controlId)?.getBindingContext("internal")
			: null;

		await this.syncTask();
		await transactionHelper.deleteDocument(contexts, parameters, this.getAppComponent(), resourceModel, this.getMessageHandler());
	}

	_getResourceModel(): ResourceModel {
		return getResourceModel(this.getView());
	}

	private getTransactionHelper() {
		return TransactionHelper;
	}

	private getMessageHandler() {
		if (this.base.messageHandler) {
			return this.base.messageHandler;
		} else {
			throw new Error("Edit Flow works only with a given message handler");
		}
	}

	private getInternalModel(): JSONModel {
		return this.getView().getModel("internal") as JSONModel;
	}

	private getGlobalUIModel(): JSONModel {
		return this.getView().getModel("ui") as JSONModel;
	}

	/**
	 * Sets that the current page contains a newly created object.
	 *
	 * @param bCreationMode True if the object is new
	 */
	private setCreationMode(bCreationMode: boolean) {
		const uiModelContext = this.getView().getBindingContext("ui") as Context;
		this.getGlobalUIModel().setProperty("createMode", bCreationMode, uiModelContext, true);
	}

	/**
	 * Indicates whether the current page contains a newly created object or not.
	 *
	 * @returns True if the object is new
	 */
	private getCreationMode(): boolean {
		const uiModelContext = this.getView().getBindingContext("ui") as Context;
		return !!this.getGlobalUIModel().getProperty("createMode", uiModelContext);
	}

	/**
	 * Indicates whether the object being edited (or one of its sub-objects) has been modified or not.
	 *
	 * @returns True if the object has been modified
	 */
	private isDocumentModified(): boolean {
		return !!this.getGlobalUIModel().getProperty("/isDocumentModified");
	}

	/**
	 * Sets that the object being edited (or one of its sub-objects) has been modified.
	 *
	 * @param modified True if the object has been modified
	 */
	private setDocumentModified(modified: boolean) {
		this.getGlobalUIModel().setProperty("/isDocumentModified", modified);
	}

	/**
	 * Sets that the object being edited has been modified by creating a sub-object.
	 *
	 * @param listBinding The list binding on which the object has been created
	 */
	private setDocumentModifiedOnCreate(listBinding: ODataListBinding) {
		// Set the modified flag only on relative listBindings, i.e. when creating a sub-object
		// If the listBinding is not relative, then it's a creation from the ListReport, and by default a newly created root object isn't considered as modified
		if (listBinding.isRelative()) {
			this.setDocumentModified(true);
		}
	}

	/**
	 * Handles the create event: shows messages and in case of a draft, updates the draft indicator.
	 *
	 * @param binding OData list binding object
	 */
	private handleCreateEvents(binding: ODataListBinding) {
		this.setDraftStatus(DraftStatus.Clear);

		const programmingModel = this.getProgrammingModel(binding);

		binding.attachEvent("createSent", () => {
			if (programmingModel === ProgrammingModel.Draft) {
				this.setDraftStatus(DraftStatus.Saving);
			}
		});
		binding.attachEvent("createCompleted", (oEvent: any) => {
			const success = oEvent.getParameter("success");
			if (programmingModel === ProgrammingModel.Draft) {
				this.setDraftStatus(success ? DraftStatus.Saved : DraftStatus.Clear);
			}
			this.getMessageHandler().showMessageDialog();
		});
	}

	/**
	 * Updates the draft status message (displayed at the bottom of the page).
	 *
	 * @param draftStatus The draft status message
	 */
	setDraftStatus(draftStatus: string) {
		(this.getView().getModel("ui") as JSONModel).setProperty("/draftStatus", draftStatus, undefined, true);
	}

	/**
	 * Gets the programming model from a binding or a context.
	 *
	 * @param source The binding or context
	 * @returns The programming model
	 */
	private getProgrammingModel(source: Context | Binding): typeof ProgrammingModel {
		return this.getTransactionHelper().getProgrammingModel(source);
	}

	/**
	 * Sets the edit mode.
	 *
	 * @param editMode The edit mode
	 * @param isCreation True if the object has been newly created
	 */
	private setEditMode(editMode?: string, isCreation?: boolean) {
		// at this point of time it's not meant to release the edit flow for freestyle usage therefore we can
		// rely on the global UI model to exist
		const globalModel = this.getGlobalUIModel();

		if (editMode) {
			globalModel.setProperty("/isEditable", editMode === "Editable", undefined, true);
		}

		if (isCreation !== undefined) {
			// Since setCreationMode is public in EditFlow and can be overriden, make sure to call it via the controller
			// to ensure any overrides are taken into account
			this.setCreationMode(isCreation);
		}
	}

	/**
	 * Checks if an action corresponds to a create action for a sticky session.
	 *
	 * @param actionName The name of the action
	 * @param context Context for the sticky session
	 * @returns True if the action is a create action
	 */
	private isNewActionForSticky(actionName: string, context: Context) {
		try {
			const metaModel = context.getModel().getMetaModel();
			const metaContext = metaModel.getMetaContext(context.getPath());
			const entitySet = getInvolvedDataModelObjects(metaContext).startingEntitySet as EntitySet;
			const stickySession = entitySet.annotations.Session?.StickySessionSupported;
			if (stickySession?.NewAction === actionName) {
				return true;
			}
			if (stickySession?.AdditionalNewActions && stickySession?.AdditionalNewActions.includes(actionName)) {
				return true;
			}
			return false;
		} catch (error) {
			Log.info(error as any);
			return false;
		}
	}

	// TODO Move all sticky-related below to a sticky session manager class

	/**
	 * Enables the sticky edit session.
	 *
	 * @param context The context being edited
	 * @returns True in case of success, false otherwise
	 */
	private handleStickyOn(context: Context): boolean {
		const appComponent = this.getAppComponent();

		try {
			if (appComponent === undefined) {
				throw new Error("undefined AppComponent for function handleStickyOn");
			}

			if (!appComponent.getRouterProxy().hasNavigationGuard()) {
				const hashTracker = appComponent.getRouterProxy().getHash();
				const internalModel = this.getInternalModel();

				// Set a guard in the RouterProxy
				// A timeout is necessary, as with deferred creation the hashChanger is not updated yet with
				// the new hash, and the guard cannot be found in the managed history of the router proxy
				setTimeout(function () {
					appComponent.getRouterProxy().setNavigationGuard(context.getPath().substring(1));
				}, 0);

				// Setting back navigation on shell service, to get the dicard message box in case of sticky
				appComponent.getShellServices().setBackNavigation(this.onBackNavigationInSession.bind(this, context));

				this.dirtyStateProviderFunction = this.getDirtyStateProvider(appComponent, internalModel, hashTracker);
				appComponent.getShellServices().registerDirtyStateProvider(this.dirtyStateProviderFunction);

				// handle session timeout
				const i18nModel = this.base.getView().getModel("sap.fe.i18n");
				this.sessionTimeoutFunction = this.getSessionTimeoutFunction(context, i18nModel);
				(this.getView().getModel() as any).attachSessionTimeout(this.sessionTimeoutFunction);

				this.stickyDiscardAfterNavigationFunction = this.getRouteMatchedFunction(context, appComponent);
				appComponent.getRoutingService().attachRouteMatched(this.stickyDiscardAfterNavigationFunction);
			}
		} catch (error) {
			Log.info(error as any);
			return false;
		}

		return true;
	}

	/**
	 * Disables the sticky edit session.
	 *
	 * @returns True in case of success, false otherwise
	 */
	private handleStickyOff(): boolean {
		const appComponent = this.getAppComponent();
		try {
			if (appComponent === undefined) {
				throw new Error("undefined AppComponent for function handleStickyOff");
			}

			if (appComponent.getRouterProxy) {
				// If we have exited from the app, CommonUtils.getAppComponent doesn't return a
				// sap.fe.core.AppComponent, hence the 'if' above
				appComponent.getRouterProxy().discardNavigationGuard();
			}

			if (this.dirtyStateProviderFunction) {
				appComponent.getShellServices().deregisterDirtyStateProvider(this.dirtyStateProviderFunction);
				this.dirtyStateProviderFunction = undefined;
			}

			const model = this.getView().getModel() as ODataModel;
			if (model && this.sessionTimeoutFunction) {
				model.detachSessionTimeout(this.sessionTimeoutFunction);
			}

			if (this.stickyDiscardAfterNavigationFunction) {
				appComponent.getRoutingService().detachRouteMatched(this.stickyDiscardAfterNavigationFunction);
			}

			this.stickyDiscardAfterNavigationFunction = undefined;

			this.setEditMode(EditMode.Display, false);

			if (appComponent.getShellServices) {
				// If we have exited from the app, CommonUtils.getAppComponent doesn't return a
				// sap.fe.core.AppComponent, hence the 'if' above
				appComponent.getShellServices().setBackNavigation();
			}
		} catch (error) {
			Log.info(error as any);
			return false;
		}

		return true;
	}

	_setStickySessionInternalProperties(programmingModel: string, model: ODataModel) {
		if (programmingModel === ProgrammingModel.Sticky) {
			const internalModel = this.getInternalModel();
			internalModel.setProperty("/sessionOn", true);
			internalModel.setProperty("/stickySessionToken", (model.getHttpHeaders(true) as any)["SAP-ContextId"]);
		}
	}

	/**
	 * Returns a callback function to be used as a DirtyStateProvider in the Shell.
	 *
	 * @param appComponent The app component
	 * @param internalModel The model "internal"
	 * @param hashTracker Hash tracker
	 * @returns The callback function
	 */
	private getDirtyStateProvider(appComponent: AppComponent, internalModel: JSONModel, hashTracker: string) {
		return (navigationContext: any) => {
			try {
				if (navigationContext === undefined) {
					throw new Error("Invalid input parameters for DirtyStateProvider function");
				}

				const targetHash = navigationContext.innerAppRoute;
				const routerProxy = appComponent.getRouterProxy();
				let lclHashTracker = "";
				let isDirty: boolean;
				const isSessionOn = internalModel.getProperty("/sessionOn");

				if (!isSessionOn) {
					// If the sticky session was terminated before hand.
					// Example in case of navigating away from application using IBN.
					return undefined;
				}

				if (!routerProxy.isNavigationFinalized()) {
					// If navigation is currently happening in RouterProxy, it's a transient state
					// (not dirty)
					isDirty = false;
					lclHashTracker = targetHash;
				} else if (hashTracker === targetHash) {
					// the hash didn't change so either the user attempts to refresh or to leave the app
					isDirty = true;
				} else if (routerProxy.checkHashWithGuard(targetHash) || routerProxy.isGuardCrossAllowedByUser()) {
					// the user attempts to navigate within the root object
					// or crossing the guard has already been allowed by the RouterProxy
					lclHashTracker = targetHash;
					isDirty = false;
				} else {
					// the user attempts to navigate within the app, for example back to the list report
					isDirty = true;
				}

				if (isDirty) {
					// the FLP doesn't call the dirty state provider anymore once it's dirty, as they can't
					// change this due to compatibility reasons we set it back to not-dirty
					setTimeout(function () {
						appComponent.getShellServices().setDirtyFlag(false);
					}, 0);
				} else {
					hashTracker = lclHashTracker;
				}

				return isDirty;
			} catch (error) {
				Log.info(error as any);
				return undefined;
			}
		};
	}

	/**
	 * Returns a callback function to be used when a sticky session times out.
	 *
	 * @param stickyContext The context for the sticky session
	 * @param i18nModel
	 * @returns The callback function
	 */
	private getSessionTimeoutFunction(stickyContext: Context, i18nModel: Model) {
		return () => {
			try {
				if (stickyContext === undefined) {
					throw new Error("Context missing for SessionTimeout function");
				}
				// remove transient messages since we will showing our own message
				this.getMessageHandler().removeTransitionMessages();

				const warningDialog = new Dialog({
					title: "{sap.fe.i18n>C_EDITFLOW_OBJECT_PAGE_SESSION_EXPIRED_DIALOG_TITLE}",
					state: "Warning",
					content: new Text({ text: "{sap.fe.i18n>C_EDITFLOW_OBJECT_PAGE_SESSION_EXPIRED_DIALOG_MESSAGE}" }),
					beginButton: new Button({
						text: "{sap.fe.i18n>C_COMMON_DIALOG_OK}",
						type: "Emphasized",
						press: () => {
							// remove sticky handling after navigation since session has already been terminated
							this.handleStickyOff();
							this.getInternalRouting().navigateBackFromContext(stickyContext);
						}
					}),
					afterClose: function () {
						warningDialog.destroy();
					}
				});
				warningDialog.addStyleClass("sapUiContentPadding");
				warningDialog.setModel(i18nModel, "sap.fe.i18n");
				this.getView().addDependent(warningDialog);
				warningDialog.open();
			} catch (error) {
				Log.info(error as any);
				return undefined;
			}
			return true;
		};
	}

	/**
	 * Returns a callback function for the onRouteMatched event in case of sticky edition.
	 *
	 * @param context The context being edited (root of the sticky session)
	 * @param appComponent The app component
	 * @returns The callback function
	 */
	private getRouteMatchedFunction(context: Context, appComponent: AppComponent) {
		return () => {
			const currentHash = appComponent.getRouterProxy().getHash();
			// either current hash is empty so the user left the app or he navigated away from the object
			if (!currentHash || !appComponent.getRouterProxy().checkHashWithGuard(currentHash)) {
				this.discardStickySession(context);
				context.getModel().clearSessionContext();
			}
		};
	}

	/**
	 * Ends a sticky session by discarding changes.
	 *
	 * @param context The context being edited (root of the sticky session)
	 */
	private async discardStickySession(context: Context) {
		const discardedContext = await sticky.discardDocument(context);
		if (discardedContext?.hasPendingChanges()) {
			discardedContext.getBinding().resetChanges();
		}
		if (!this.getCreationMode()) {
			discardedContext?.refresh();
		}

		this.handleStickyOff();
	}

	/**
	 * Gets the internal routing extension.
	 *
	 * @returns The internal routing extension
	 */
	private getInternalRouting(): InternalRouting {
		if (this.base._routing) {
			return this.base._routing;
		} else {
			throw new Error("Edit Flow works only with a given routing listener");
		}
	}

	_getRootViewController() {
		return this.getAppComponent().getRootViewController();
	}

	_getSemanticMapping(): SemanticMapping | undefined {
		return this.getAppComponent().getRoutingService().getLastSemanticMapping();
	}

	/**
	 * Creates a new promise to wait for an action to be executed.
	 *
	 * @param actionName The name of the action
	 * @param controlId The ID of the control
	 * @returns The resolver function which can be used to externally resolve the promise
	 */
	private createActionPromise(actionName: string, controlId: string) {
		let resolveFunction, rejectFunction;
		this.actionPromise = new Promise((resolve, reject) => {
			resolveFunction = resolve;
			rejectFunction = reject;
		}).then((oResponse: any) => {
			return Object.assign({ controlId }, this.getActionResponseDataAndKeys(actionName, oResponse));
		});
		return { fResolver: resolveFunction, fRejector: rejectFunction };
	}

	/**
	 *
	 * @param actionName The name of the action that is executed
	 * @param response The bound action's response data or response context
	 * @returns Object with data and names of the key fields of the response
	 */
	private getActionResponseDataAndKeys(actionName: string, response: any) {
		if (Array.isArray(response)) {
			if (response.length === 1) {
				response = response[0].value;
			} else {
				return null;
			}
		}
		if (!response) {
			return null;
		}
		const currentView = this.base.getView();
		const metaModelData = (currentView.getModel().getMetaModel() as any).getData();
		const actionReturnType =
			metaModelData && metaModelData[actionName] && metaModelData[actionName][0] && metaModelData[actionName][0].$ReturnType
				? metaModelData[actionName][0].$ReturnType.$Type
				: null;
		const keys = actionReturnType && metaModelData[actionReturnType] ? metaModelData[actionReturnType].$Key : null;

		return {
			oData: response.getObject(),
			keys
		};
	}

	getCurrentActionPromise() {
		return this.actionPromise;
	}

	deleteCurrentActionPromise() {
		this.actionPromise = undefined;
	}

	async showConfirmRecommendationsDialog(isSave: boolean): Promise<boolean> {
		if (!this.confirmRecommendationsDialog) {
			this.confirmRecommendationsDialog = new ConfirmRecommendationDialogBlock({
				view: this.getView()
			});
		}
		return this.confirmRecommendationsDialog?.open(isSave);
	}

	_scrollAndFocusOnInactiveRow(table: Table) {
		const rowBinding = table.getRowBinding();
		const activeRowIndex: number = rowBinding.getCount() || 0;
		if (table.data("tableType") !== "ResponsiveTable") {
			if (activeRowIndex > 0) {
				table.scrollToIndex(activeRowIndex - 1);
			}
			table.focusRow(activeRowIndex, true);
		} else {
			/* In a responsive table, the empty rows appear at the beginning of the table. But when we create more, they appear below the new line.
			 * So we check the first inactive row first, then we set the focus on it when we press the button.
			 * This doesn't impact the GridTable because they appear at the end, and we already focus the before-the-last row (because 2 empty rows exist)
			 */
			const allRowContexts = rowBinding.getContexts();
			if (!allRowContexts?.length) {
				table.focusRow(activeRowIndex, true);
				return;
			}
			let focusRow = activeRowIndex,
				index = 0;
			for (const singleContext of allRowContexts) {
				if (singleContext.isInactive() && index < focusRow) {
					focusRow = index;
				}
				index++;
			}
			if (focusRow > 0) {
				table.scrollToIndex(focusRow);
			}
			table.focusRow(focusRow, true);
		}
	}

	async createEmptyRowsAndFocus(table: Table) {
		const tableAPI = table.getParent() as TableAPI;
		if (
			tableAPI?.tableDefinition?.control?.inlineCreationRowsHiddenInEditMode &&
			!table.getBindingContext("ui")?.getProperty("createMode")
		) {
			// With the parameter, we don't have empty rows in Edit mode, so we need to create them before setting the focus on them
			await tableAPI.setUpEmptyRows(table, true);
		}
		this._scrollAndFocusOnInactiveRow(table);
	}

	_sendActivity(
		action: Activity,
		relatedContexts: Context | Context[] | undefined,
		triggeredActionName?: string,
		refreshListBinding?: boolean,
		actionRequestedProperties?: string[]
	) {
		const content = Array.isArray(relatedContexts) ? relatedContexts.map((context) => context.getPath()) : relatedContexts?.getPath();
		ActivitySync.send(this.getView(), { action, content, triggeredActionName, refreshListBinding, actionRequestedProperties });
	}

	_triggerConfiguredSurvey(sActionName: string, triggerType: TriggerType) {
		triggerConfiguredSurvey(this.getView(), sActionName, triggerType);
	}

	async _submitOpenChanges(oContext: any): Promise<any> {
		const oModel = oContext.getModel(),
			oLockObject = this.getGlobalUIModel();

		try {
			// Submit any leftover changes that are not yet submitted
			// Currently we are using only 1 updateGroupId, hence submitting the batch directly here
			await oModel.submitBatch("$auto");

			// Wait for all currently running changes
			// For the time being we agreed with the v4 model team to use an internal method. We'll replace it once
			// a public or restricted method was provided
			await oModel.oRequestor.waitForRunningChangeRequests("$auto");

			// Check if all changes were submitted successfully
			if (oModel.hasPendingChanges("$auto")) {
				throw new Error("submit of open changes failed");
			}
		} finally {
			if (BusyLocker.isLocked(oLockObject)) {
				BusyLocker.unlock(oLockObject);
			}
		}
	}

	_removeStickySessionInternalProperties(programmingModel: string) {
		if (programmingModel === ProgrammingModel.Sticky) {
			const internalModel = this.getInternalModel();
			internalModel.setProperty("/sessionOn", false);
			internalModel.setProperty("/stickySessionToken", undefined);
			this.handleStickyOff();
		}
	}

	/**
	 * Method to display a 'discard' popover when exiting a sticky session.
	 *
	 * @param context
	 */
	private onBackNavigationInSession(context: Context): void {
		const view = this.base.getView();
		const routerProxy = this.getAppComponent().getRouterProxy();

		if (routerProxy.checkIfBackIsOutOfGuard()) {
			sticky.processDataLossConfirmation(
				async () => {
					await this.discardStickySession(context);
					this._removeStickySessionInternalProperties(ProgrammingModel.Sticky);
					history.back();
				},
				view,
				ProgrammingModel.Sticky
			);

			return;
		}
		history.back();
	}

	async _handleNewContext(
		oContext: Context,
		navigationParameters: { editable: boolean; recreateContext: boolean; forceFocus?: boolean }
	) {
		if (!this._isFclEnabled()) {
			EditState.setEditStateDirty();
		}

		await this.getInternalRouting().navigateToContext(oContext, {
			checkNoHashChange: true,
			editable: navigationParameters.editable,
			persistOPScroll: true,
			recreateContext: navigationParameters.recreateContext,
			reason: NavigationReason.EditFlowAction,
			showPlaceholder: false,
			forceFocus: navigationParameters.forceFocus ?? false,
			keepCurrentLayout: true
		});
	}

	_getBoundContext(view: any, params: any) {
		const viewLevel = view.getViewData().viewLevel;
		const bRefreshAfterAction = viewLevel > 1 || (viewLevel === 1 && params.controlId);
		return !params.isNavigable || !!bRefreshAfterAction;
	}

	/**
	 * Checks if there are validation (parse) errors for controls bound to a given context
	 *
	 * @returns {Promise} Promise resolves if there are no validation errors, and rejects if there are validation errors
	 */

	async _checkForValidationErrors(): Promise<string | undefined | void> {
		return this.syncTask().then(() => {
			const sViewId = this.getView().getId();
			const aMessages = Core.getMessageManager().getMessageModel().getData();
			let oControl;
			let oMessage;

			if (!aMessages.length) {
				Log.info("No validation errors found");
				return;
			}

			for (let i = 0; i < aMessages.length; i++) {
				oMessage = aMessages[i];
				if (oMessage.validation) {
					oControl = Core.byId(oMessage.getControlId());
					while (oControl) {
						if (oControl.getId() === sViewId) {
							throw "validation errors exist";
						}
						oControl = oControl.getParent();
					}
				}
			}
		});
	}

	/**
	 * @param oResponse The response of the bound action and the names of the key fields
	 * @param oContext The bound context on which the action was executed
	 * @returns Always resolves to param oResponse
	 */
	_refreshListIfRequired(oResponse: any, oContext: Context): Promise<boolean | undefined> {
		if (!oContext || !oResponse || !oResponse.oData || !oResponse.keys) {
			return Promise.resolve(undefined);
		}
		const oBinding = oContext.getBinding();
		// refresh only lists
		if (oBinding && oBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			const oContextData = oResponse.oData;
			const aKeys = oResponse.keys;
			const oCurrentData = oContext.getObject();
			let bReturnedContextIsSame = true;
			// ensure context is in the response
			if (Object.keys(oContextData).length) {
				// check if context in response is different than the bound context
				bReturnedContextIsSame = aKeys.every(function (sKey: any) {
					return oCurrentData[sKey] === oContextData[sKey];
				});
				if (!bReturnedContextIsSame) {
					return new Promise<boolean>((resolve) => {
						if ((oBinding as any).isRoot()) {
							oBinding.attachEventOnce("dataReceived", function () {
								resolve(!bReturnedContextIsSame);
							});
							oBinding.refresh();
						} else {
							const oAppComponent = this.getAppComponent();
							oAppComponent
								.getSideEffectsService()
								.requestSideEffects([{ $NavigationPropertyPath: oBinding.getPath() }], oBinding.getContext() as Context)
								.then(
									function () {
										resolve(!bReturnedContextIsSame);
									},
									function () {
										Log.error("Error while refreshing the table");
										resolve(!bReturnedContextIsSame);
									}
								)
								.catch(function (e: any) {
									Log.error("Error while refreshing the table", e);
								});
						}
					});
				}
			}
		}
		// resolve with oResponse to not disturb the promise chain afterwards
		return Promise.resolve(undefined);
	}

	_fetchSemanticKeyValues(oContext: Context): Promise<any> {
		const oMetaModel = oContext.getModel().getMetaModel() as any,
			sEntitySetName = oMetaModel.getMetaContext(oContext.getPath()).getObject("@sapui.name"),
			aSemanticKeys = SemanticKeyHelper.getSemanticKeys(oMetaModel, sEntitySetName);

		if (aSemanticKeys && aSemanticKeys.length) {
			const aRequestPromises = aSemanticKeys.map(function (oKey: any) {
				return oContext.requestObject(oKey.$PropertyPath);
			});

			return Promise.all(aRequestPromises);
		} else {
			return Promise.resolve();
		}
	}

	/**
	 * Provides the latest context in the metadata hierarchy from rootBinding to given context pointing to given entityType
	 * if any such context exists. Otherwise, it returns the original context.
	 * Note: It is only needed as work-around for incorrect modelling. Correct modelling would imply a DataFieldForAction in a LineItem
	 * to point to an overload defined either on the corresponding EntityType or a collection of the same.
	 *
	 * @param rootContext The context to start searching from
	 * @param listBinding The listBinding of the table
	 * @param overloadEntityType The ActionOverload entity type to search for
	 * @returns Returns the context of the ActionOverload entity
	 */
	_getActionOverloadContextFromMetadataPath(rootContext: Context, listBinding: ODataListBinding, overloadEntityType: string): Context {
		const model: ODataModel = rootContext.getModel();
		const metaModel: ODataMetaModel = model.getMetaModel();
		let contextSegments: string[] = listBinding.getPath().split("/");
		let currentContext: Context = rootContext;

		// We expect that the last segment of the listBinding is the ListBinding of the table. Remove this from contextSegments
		// because it is incorrect to execute bindContext on a list. We do not anyway need to search this context for the overload.
		contextSegments.pop();
		if (contextSegments.length === 0) {
			contextSegments = [""]; // Don't leave contextSegments undefined
		}

		if (contextSegments[0] !== "") {
			contextSegments.unshift(""); // to also get the root context, i.e. the bindingContext of the table
		}
		// load all the parent contexts into an array
		const parentContexts: Context[] = contextSegments
			.map((pathSegment: string) => {
				if (pathSegment !== "") {
					currentContext = model.bindContext(pathSegment, currentContext).getBoundContext();
				} else {
					// Creating a new context using bindContext(...).getBoundContext() does not work if the etag is needed. According to model colleagues,
					// we should always use an existing context if possible.
					// Currently, the only example we know about is using the rootContext - and in this case, we can obviously reuse that existing context.
					// If other examples should come up, the best possible work around would be to request some data to get an existing context. To keep the
					// request as small and fast as possible, we should request only the first key property. As this would introduce asynchronism, and anyway
					// the whole logic is only part of work-around for incorrect modelling, we wait until we have an example needing it before implementing this.
					currentContext = rootContext;
				}
				return currentContext;
			})
			.reverse();
		// search for context backwards
		const overloadContext: Context | undefined = parentContexts.find(
			(parentContext: Context) =>
				(metaModel.getMetaContext(parentContext.getPath()).getObject("$Type") as unknown as string) === overloadEntityType
		);
		return overloadContext || listBinding.getHeaderContext()!;
	}

	_createSiblingInfo(currentContext: Context, newContext: Context): SiblingInformation {
		return {
			targetContext: newContext,
			pathMapping: [
				{
					oldPath: currentContext.getPath(),
					newPath: newContext.getPath()
				}
			]
		};
	}

	_updatePathsInHistory(mappings: { oldPath: string; newPath: string }[]) {
		const oAppComponent = this.getAppComponent();
		oAppComponent.getRouterProxy().setPathMapping(mappings);

		// Also update the semantic mapping in the routing service
		const lastSemanticMapping = this._getSemanticMapping();
		if (mappings.length && lastSemanticMapping?.technicalPath === mappings[mappings.length - 1].oldPath) {
			lastSemanticMapping.technicalPath = mappings[mappings.length - 1].newPath;
		}
	}

	_getNavigationTargetForEdit(context: Context, newDocumentContext: Context, siblingInfo: SiblingInformation | undefined) {
		let contextToNavigate: Context | undefined;
		siblingInfo = siblingInfo ?? this._createSiblingInfo(context, newDocumentContext);
		this._updatePathsInHistory(siblingInfo.pathMapping);
		if (siblingInfo.targetContext.getPath() != newDocumentContext.getPath()) {
			contextToNavigate = siblingInfo.targetContext;
		}
		return contextToNavigate;
	}

	/**
	 * This method creates a sibling context for a subobject page, and calculates a sibling path
	 * for all intermediate paths between the object page and the subobject page.
	 *
	 * @param rootCurrentContext The context for the root of the draft
	 * @param rightmostCurrentContext The context of the subobject
	 * @param sProgrammingModel The programming model
	 * @param doNotComputeIfRoot If true, we don't compute siblingInfo if the root and the rightmost contexts are the same
	 * @param rootContextInfo The root context information of root of the draft
	 * @returns Returns the siblingInformation object
	 */
	async _computeSiblingInformation(
		rootCurrentContext: Context,
		rightmostCurrentContext: Context | null | undefined,
		sProgrammingModel: string,
		doNotComputeIfRoot: boolean,
		rootContextInfo?: RootContextInfo,
		groupId?: string
	): Promise<SiblingInformation | undefined> {
		rightmostCurrentContext = rightmostCurrentContext ?? rootCurrentContext;
		if (!rightmostCurrentContext.getPath().startsWith(rootCurrentContext.getPath())) {
			// Wrong usage !!
			Log.error("Cannot compute rightmost sibling context");
			throw new Error("Cannot compute rightmost sibling context");
		}
		if (doNotComputeIfRoot && rightmostCurrentContext.getPath() === rootCurrentContext.getPath()) {
			return Promise.resolve(undefined);
		}

		const model = rootCurrentContext.getModel();
		if (sProgrammingModel === ProgrammingModel.Draft) {
			return draft.computeSiblingInformation(rootCurrentContext, rightmostCurrentContext, rootContextInfo, groupId);
		} else {
			// If not in draft mode, we just recreate a context from the path of the rightmost context
			// No path mapping is needed
			return {
				targetContext: model.bindContext(rightmostCurrentContext.getPath()).getBoundContext(),
				pathMapping: []
			};
		}
	}

	_isFclEnabled(): boolean {
		return this.getAppComponent()._isFclEnabled();
	}
}

export default EditFlow;
