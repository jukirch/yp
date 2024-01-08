import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import CollaborationActivitySync from "sap/fe/core/controllerextensions/collaboration/ActivitySync";
import type { UserActivity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import { Activity, getActivityKeyFromPath } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import draft from "sap/fe/core/controllerextensions/editFlow/draft";
import type { EnhanceWithUI5 } from "sap/fe/core/helpers/ClassSupport";
import KeepAliveHelper from "sap/fe/core/helpers/KeepAliveHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import ResourceModelHelper, { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type PageController from "sap/fe/core/PageController";
import CommonHelper from "sap/fe/macros/CommonHelper";
import FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type FileWrapper from "sap/fe/macros/controls/FileWrapper";
import type { FieldAPIType } from "sap/fe/macros/field/FieldAPI";
import FieldAPI from "sap/fe/macros/field/FieldAPI";
import type Avatar from "sap/m/Avatar";
import type Button from "sap/m/Button";
import type { $IllustratedMessageSettings } from "sap/m/IllustratedMessage";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import Label from "sap/m/Label";
import mobilelibrary from "sap/m/library";
import type Link from "sap/m/Link";
import MessageBox from "sap/m/MessageBox";
import type { $ResponsivePopoverSettings } from "sap/m/ResponsivePopover";
import ResponsivePopover from "sap/m/ResponsivePopover";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Core from "sap/ui/core/Core";
import type CustomData from "sap/ui/core/CustomData";
import type Element from "sap/ui/core/Element";
import IconPool from "sap/ui/core/IconPool";
import type Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";
import Device from "sap/ui/Device";
import type Field from "sap/ui/mdc/Field";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import type { default as MdcLink } from "sap/ui/mdc/Link";
import type CompositeBinding from "sap/ui/model/CompositeBinding";
import Filter from "sap/ui/model/Filter";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type FileUploader from "sap/ui/unified/FileUploader";
import type { FileUploader$UploadCompleteEvent } from "sap/ui/unified/FileUploader";
import FileUploaderParameter from "sap/ui/unified/FileUploaderParameter";
import openWindow from "sap/ui/util/openWindow";

/**
 * Gets the binding used for collaboration notifications.
 *
 * @param field
 * @returns The binding
 */
function getCollaborationBinding(field: Control): ODataListBinding | ODataContextBinding {
	let binding = (field.getBindingContext() as Context).getBinding();

	if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
		const oView = CommonUtils.getTargetView(field);
		binding = (oView.getBindingContext() as Context).getBinding();
	}

	return binding;
}
/**
 * Static class used by "sap.ui.mdc.Field" during runtime
 *
 * @private
 * @experimental This module is only for internal/experimental use!
 */
const FieldRuntime = {
	uploadPromises: undefined as any,
	creatingInactiveRow: false,

	/**
	 * Triggers an internal navigation on the link pertaining to DataFieldWithNavigationPath.
	 *
	 * @param oSource Source of the press event
	 * @param oController Instance of the controller
	 * @param sNavPath The navigation path
	 */
	onDataFieldWithNavigationPath: function (oSource: Control, oController: PageController, sNavPath: string) {
		if (oController._routing) {
			let oBindingContext = oSource.getBindingContext() as Context;
			const oView = CommonUtils.getTargetView(oSource),
				oMetaModel = oBindingContext.getModel().getMetaModel(),
				fnNavigate = function (oContext?: any) {
					if (oContext) {
						oBindingContext = oContext;
					}
					oController._routing.navigateToTarget(oBindingContext, sNavPath, true);
				};
			// Show draft loss confirmation dialog in case of Object page
			if ((oView.getViewData() as any).converterType === "ObjectPage" && !ModelHelper.isStickySessionSupported(oMetaModel)) {
				draft.processDataLossOrDraftDiscardConfirmation(
					fnNavigate,
					Function.prototype,
					oBindingContext,
					oView.getController(),
					true,
					draft.NavigationType.ForwardNavigation
				);
			} else {
				fnNavigate();
			}
		} else {
			Log.error(
				"FieldRuntime: No routing listener controller extension found. Internal navigation aborted.",
				"sap.fe.macros.field.FieldRuntime",
				"onDataFieldWithNavigationPath"
			);
		}
	},

	isDraftIndicatorVisible: function (
		sPropertyPath: any,
		sSemanticKeyHasDraftIndicator: any,
		HasDraftEntity: any,
		IsActiveEntity: any,
		hideDraftInfo: any
	) {
		if (IsActiveEntity !== undefined && HasDraftEntity !== undefined && (!IsActiveEntity || HasDraftEntity) && !hideDraftInfo) {
			return sPropertyPath === sSemanticKeyHasDraftIndicator;
		} else {
			return false;
		}
	},

	/**
	 * Handler for the validateFieldGroup event.
	 *
	 * @function
	 * @name onValidateFieldGroup
	 * @param oController The controller of the page containing the field
	 * @param oEvent The event object passed by the validateFieldGroup event
	 */
	onValidateFieldGroup: function (oController: object, oEvent: object) {
		const oFEController = FieldRuntime._getExtensionController(oController);
		oFEController._sideEffects.handleFieldGroupChange(oEvent);
	},

	_fetchRecommendations: function (field: Control, controller: Controller): void {
		const view = CommonUtils.getTargetView(field);
		const fieldBindingContext = field.getBindingContext();
		let recommendationsContext;

		// determine recommendation context to use
		const fieldBinding = (fieldBindingContext as Context)?.getBinding();

		if (fieldBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			// inside a table, use the row
			recommendationsContext = fieldBindingContext;
		} else {
			// inside a form now
			// can have 1-1 navigation property/direct property - use view context
			recommendationsContext = view.getBindingContext();
		}
		const feController = FieldRuntime._getExtensionController(controller);
		feController.recommendations.fetchAndApplyRecommendationsOnFieldChange(field, [recommendationsContext]);
	},
	/**
	 * Handler for the change event.
	 * Store field group IDs of this field for requesting side effects when required.
	 * We store them here to ensure there is a change in the value of the field.
	 *
	 * @function
	 * @name handleChange
	 * @param oController The controller of the page containing the field
	 * @param oEvent The event object passed by the change event
	 */
	handleChange: function (oController: PageController, oEvent: Field$ChangeEvent & Event<{ isValid: boolean }>): void {
		const oSourceField = oEvent.getSource() as Control,
			bIsTransient = oSourceField && (oSourceField.getBindingContext() as any).isTransient(),
			pValueResolved = oEvent.getParameter("promise") || Promise.resolve(),
			oSource = oEvent.getSource(),
			bValid = oEvent.getParameter("valid"),
			fieldValidity = this.getFieldStateOnChange(oEvent).state["validity"],
			field = oEvent.getSource() as Control;

		// Use the FE Controller instead of the extensionAPI to access internal FE controllers
		const oFEController = FieldRuntime._getExtensionController(oController);

		// TODO: currently we have undefined and true... and our creation row implementation relies on this.
		// I would move this logic to this place as it's hard to understand for field consumer
		pValueResolved
			.then(function () {
				// The event is gone. For now we'll just recreate it again
				(oEvent as any).oSource = oSource;
				(oEvent as any).mParameters = {
					valid: bValid
				};
				(FieldAPI as any).handleChange(oEvent, oController);
				// SIDE EFFECTS
				oFEController._sideEffects.handleFieldChange(oEvent, fieldValidity, pValueResolved);
				// Recommendations
				FieldRuntime._fetchRecommendations(field, oController);
				return;
			})
			.catch(function (/*oError: any*/) {
				// The event is gone. For now we'll just recreate it again
				(oEvent as any).oSource = oSource;
				(oEvent as any).mParameters = {
					valid: false
				};

				oFEController._sideEffects.prepareSideEffectsForField(oEvent, fieldValidity, pValueResolved);
				Log.debug("Prerequisites on Field for the SideEffects and Recommendations have been rejected");
				// as the UI might need to react on. We could provide a parameter to inform if validation
				// was successful?
				(FieldAPI as any).handleChange(oEvent, oController);
			});

		oFEController.editFlow.syncTask(pValueResolved);

		// if the context is transient, it means the request would fail anyway as the record does not exist in reality
		// TODO: should the request be made in future if the context is transient?
		if (bIsTransient) {
			return;
		}

		// Collaboration Draft Activity Sync
		const bCollaborationEnabled = CollaborationActivitySync.isConnected(field);

		if (bCollaborationEnabled && fieldValidity) {
			const binding = getCollaborationBinding(field);

			const data = [
				...((field.getBindingInfo("value") || field.getBindingInfo("selected"))?.parts || []),
				...(field.getBindingInfo("additionalValue")?.parts || [])
			]
				.filter((part) => {
					return part?.path !== undefined && part.path.indexOf("@@") < 0; // Remove binding parts with @@ that make no sense for collaboration messages
				})
				.map(function (part: { path: string }) {
					return `${field.getBindingContext()?.getPath()}/${part.path}`;
				});

			// From this point, we will always send a collaboration message (UNLOCK or CHANGE), so we retain
			// a potential UNLOCK that would be sent in handleFocusOut, to make sure it's sent after the CHANGE message
			CollaborationActivitySync.retainAsyncMessages(field, data);

			const updateCollaboration = () => {
				if (binding.hasPendingChanges()) {
					// The value has been changed by the user --> wait until it's sent to the server before sending a notification to other users
					binding.attachEventOnce("patchCompleted", function () {
						CollaborationActivitySync.send(field, { action: Activity.Change, content: data });
						CollaborationActivitySync.releaseAsyncMessages(field, data);
					});
				} else {
					CollaborationActivitySync.releaseAsyncMessages(field, data);
				}
			};
			if (oSourceField.isA("sap.ui.mdc.Field")) {
				pValueResolved
					.then(() => {
						updateCollaboration();
						return;
					})
					.catch(() => {
						updateCollaboration();
					});
			} else {
				updateCollaboration();
			}
		}
	},

	/**
	 * Handler for the live change event.
	 *
	 * @function
	 * @name handleLiveChange
	 * @param event The event object passed by the change event
	 */
	handleLiveChange: function (event: Event): void {
		(FieldAPI as FieldAPIType).handleLiveChange(event);
	},

	/**
	 * Method to send collaboration messages from a FileUploader.
	 *
	 * @param fileUploader
	 * @param action
	 */
	_sendCollaborationMessageForFileUploader(fileUploader: FileUploader, action: Activity): void {
		if (CollaborationActivitySync.isConnected(fileUploader)) {
			const bindingPath = fileUploader.getParent()?.getProperty("propertyPath");
			const fullPath = `${fileUploader.getBindingContext()?.getPath()}/${bindingPath}`;
			CollaborationActivitySync.send(fileUploader, { action, content: fullPath });
		}
	},

	/**
	 * Handler when a FileUpload dialog is opened.
	 *
	 * @param event
	 */
	handleOpenUploader: function (event: Event): void {
		const fileUploader = event.getSource() as FileUploader;
		FieldRuntime._sendCollaborationMessageForFileUploader(fileUploader, Activity.Lock);
	},

	/**
	 * Handler when a FileUpload dialog is closed.
	 *
	 * @param event
	 */
	handleCloseUploader: function (event: Event): void {
		const fileUploader = event.getSource() as FileUploader;
		FieldRuntime._sendCollaborationMessageForFileUploader(fileUploader, Activity.Unlock);
	},

	/**
	 * Gets the field value and validity on a change event.
	 *
	 * @function
	 * @name fieldValidityOnChange
	 * @param oEvent The event object passed by the change event
	 * @returns Field value and validity
	 */
	getFieldStateOnChange: function (oEvent: Field$ChangeEvent & Event<{ isValid: boolean }>): {
		field: Field;
		state: {
			fieldValue?: unknown;
			validity?: boolean;
		};
	} {
		let oSourceField = oEvent.getSource() as any,
			mFieldState: {
				fieldValue?: unknown;
				validity?: boolean;
			} = {};
		const _isBindingStateMessages = function (oBinding: any) {
			return oBinding && oBinding.getDataState() ? oBinding.getDataState().getInvalidValue() === undefined : true;
		};
		if (oSourceField.isA("sap.fe.macros.field.FieldAPI")) {
			oSourceField = (oSourceField as EnhanceWithUI5<FieldAPI>).getContent();
		}

		if (oSourceField.isA(FieldWrapper.getMetadata().getName()) && oSourceField.getEditMode() === "Editable") {
			oSourceField = oSourceField.getContentEdit()[0];
		}

		if (oSourceField.isA("sap.ui.mdc.Field")) {
			let bIsValid = oEvent.getParameter("valid") || oEvent.getParameter("isValid");
			if (bIsValid === undefined) {
				if (oSourceField.getMaxConditions() === 1) {
					const oValueBindingInfo = oSourceField.getBindingInfo("value");
					bIsValid = _isBindingStateMessages(oValueBindingInfo && oValueBindingInfo.binding);
				}
				if (oSourceField.getValue() === "" && !oSourceField.getProperty("required")) {
					bIsValid = true;
				}
			}
			mFieldState = {
				fieldValue: oSourceField.getValue(),
				validity: !!bIsValid
			};
		} else {
			// oSourceField extends from a FileUploader || Input || is a CheckBox
			const oBinding =
				oSourceField.getBinding("uploadUrl") || oSourceField.getBinding("value") || oSourceField.getBinding("selected");
			mFieldState = {
				fieldValue: oBinding && oBinding.getValue(),
				validity: _isBindingStateMessages(oBinding)
			};
		}
		return {
			field: oSourceField,
			state: mFieldState
		};
	},
	_fnFixHashQueryString: function (sCurrentHash: any) {
		if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
			// sCurrentHash can contain query string, cut it off!
			sCurrentHash = sCurrentHash.split("?")[0];
		}
		return sCurrentHash;
	},
	_fnGetLinkInformation: function (_oSource: any, _oLink: any, _sPropertyPath: any, _sValue: any, fnSetActive: any) {
		const oModel = _oLink && _oLink.getModel();
		const oMetaModel = oModel && oModel.getMetaModel();
		const sSemanticObjectName = _sValue || (_oSource && _oSource.getValue());
		const oView = _oLink && CommonUtils.getTargetView(_oLink);
		const oInternalModelContext = oView && oView.getBindingContext("internal");
		const oAppComponent = oView && CommonUtils.getAppComponent(oView);
		const oShellServiceHelper = oAppComponent && oAppComponent.getShellServices();
		const pGetLinksPromise = oShellServiceHelper && oShellServiceHelper.getLinksWithCache([[{ semanticObject: sSemanticObjectName }]]);
		const aSemanticObjectUnavailableActions =
			oMetaModel && oMetaModel.getObject(`${_sPropertyPath}@com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions`);
		return {
			SemanticObjectName: sSemanticObjectName,
			SemanticObjectFullPath: _sPropertyPath, //sSemanticObjectFullPath,
			MetaModel: oMetaModel,
			InternalModelContext: oInternalModelContext,
			ShellServiceHelper: oShellServiceHelper,
			GetLinksPromise: pGetLinksPromise,
			SemanticObjectUnavailableActions: aSemanticObjectUnavailableActions,
			fnSetActive: fnSetActive
		};
	},
	_fnQuickViewHasNewCondition: function (oSemanticObjectPayload: any, _oLinkInfo: any) {
		if (oSemanticObjectPayload && oSemanticObjectPayload.path && oSemanticObjectPayload.path === _oLinkInfo.SemanticObjectFullPath) {
			// Got the resolved Semantic Object!
			const bResultingNewConditionForConditionalWrapper =
				oSemanticObjectPayload[!_oLinkInfo.SemanticObjectUnavailableActions ? "HasTargetsNotFiltered" : "HasTargets"];
			_oLinkInfo.fnSetActive(!!bResultingNewConditionForConditionalWrapper);
			return true;
		} else {
			return false;
		}
	},
	_fnQuickViewSetNewConditionForConditionalWrapper: function (_oLinkInfo: any, _oFinalSemanticObjects: any) {
		if (_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName]) {
			let sTmpPath, oSemanticObjectPayload;
			const aSemanticObjectPaths = Object.keys(_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName]);
			for (const iPathsCount in aSemanticObjectPaths) {
				sTmpPath = aSemanticObjectPaths[iPathsCount];
				oSemanticObjectPayload =
					_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName] &&
					_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName][sTmpPath];
				if (FieldRuntime._fnQuickViewHasNewCondition(oSemanticObjectPayload, _oLinkInfo)) {
					break;
				}
			}
		}
	},
	_fnUpdateSemanticObjectsTargetModel: function (oEvent: any, sValue: any, oControl: any, _sPropertyPath: any) {
		const oSource = oEvent && oEvent.getSource();
		let fnSetActive;
		if (oControl.isA("sap.m.ObjectStatus")) {
			fnSetActive = (bActive: boolean) => oControl.setActive(bActive);
		}
		if (oControl.isA("sap.m.ObjectIdentifier")) {
			fnSetActive = (bActive: boolean) => oControl.setTitleActive(bActive);
		}
		const oConditionalWrapper = oControl && oControl.getParent();
		if (oConditionalWrapper && oConditionalWrapper.isA("sap.fe.macros.controls.ConditionalWrapper")) {
			fnSetActive = (bActive: boolean) => oConditionalWrapper.setCondition(bActive);
		}
		if (fnSetActive !== undefined) {
			const oLinkInfo = FieldRuntime._fnGetLinkInformation(oSource, oControl, _sPropertyPath, sValue, fnSetActive);
			oLinkInfo.fnSetActive = fnSetActive;
			const sCurrentHash = FieldRuntime._fnFixHashQueryString(CommonUtils.getAppComponent(oControl).getShellServices().getHash());
			CommonUtils.updateSemanticTargets(
				[oLinkInfo.GetLinksPromise],
				[{ semanticObject: oLinkInfo.SemanticObjectName, path: oLinkInfo.SemanticObjectFullPath }],
				oLinkInfo.InternalModelContext,
				sCurrentHash
			)
				.then(function (oFinalSemanticObjects: any) {
					if (oFinalSemanticObjects) {
						FieldRuntime._fnQuickViewSetNewConditionForConditionalWrapper(oLinkInfo, oFinalSemanticObjects);
					}
					return;
				})
				.catch(function (oError: any) {
					Log.error("Cannot update Semantic Targets model", oError);
				});
		}
	},
	_checkControlHasModelAndBindingContext(_control: Control) {
		if (!_control.getModel() || !_control.getBindingContext()) {
			return false;
		} else {
			return true;
		}
	},
	_checkCustomDataValueBeforeUpdatingSemanticObjectModel(_control: Control, propertyPath: string, aCustomData: CustomData[]): void {
		let sSemanticObjectPathValue: any;
		let oValueBinding;
		const _fnCustomDataValueIsString = function (semanticObjectPathValue: any) {
			return !(semanticObjectPathValue !== null && typeof semanticObjectPathValue === "object");
		};
		// remove technical custom datas set by UI5
		aCustomData = aCustomData.filter((customData) => customData.getKey() !== "sap-ui-custom-settings");
		for (const index in aCustomData) {
			sSemanticObjectPathValue = aCustomData[index].getValue();
			if (!sSemanticObjectPathValue && _fnCustomDataValueIsString(sSemanticObjectPathValue)) {
				oValueBinding = aCustomData[index].getBinding("value");
				if (oValueBinding) {
					oValueBinding.attachEventOnce("change", function (_oChangeEvent: any) {
						FieldRuntime._fnUpdateSemanticObjectsTargetModel(_oChangeEvent, null, _control, propertyPath);
					});
				}
			} else if (_fnCustomDataValueIsString(sSemanticObjectPathValue)) {
				FieldRuntime._fnUpdateSemanticObjectsTargetModel(null, sSemanticObjectPathValue, _control, propertyPath);
			}
		}
	},
	LinkModelContextChange: function (oEvent: any, sProperty: any, sPathToProperty: any): void {
		const control = oEvent.getSource();
		if (FieldRuntime._checkControlHasModelAndBindingContext(control)) {
			const sPropertyPath = `${sPathToProperty}/${sProperty}`;
			const mdcLink = control.getDependents().length ? control.getDependents()[0] : undefined;
			const aCustomData = mdcLink?.getCustomData();
			if (aCustomData && aCustomData.length > 0) {
				FieldRuntime._checkCustomDataValueBeforeUpdatingSemanticObjectModel(control, sPropertyPath, aCustomData);
			}
		}
	},
	openExternalLink: function (event: Event) {
		const source = event.getSource() as any;
		if (source.data("url") && source.getProperty("text") !== "") {
			// This opens the link in the same tab as the link. It was done to be more consistent with other type of links.
			openWindow(source.data("url"), "_self");
		}
	},
	createPopoverWithNoTargets: function (mdcLink: MdcLink) {
		const mdcLinkId = mdcLink.getId();
		const illustratedMessageSettings: $IllustratedMessageSettings = {
			title: getResourceModel(mdcLink as unknown as Control).getText("M_ILLUSTRATEDMESSAGE_TITLE"),
			description: getResourceModel(mdcLink as unknown as Control).getText("M_ILLUSTRATEDMESSAGE_DESCRIPTION"),
			enableFormattedText: true,
			illustrationSize: "Dot", // IllustratedMessageSize.Dot not available in "@types/openui5": "1.107.0"
			illustrationType: IllustratedMessageType.Tent
		};
		const illustratedMessage = new IllustratedMessage(`${mdcLinkId}-illustratedmessage`, illustratedMessageSettings);
		const popoverSettings: $ResponsivePopoverSettings = {
			horizontalScrolling: false,
			showHeader: Device.system.phone,
			placement: mobilelibrary.PlacementType.Auto,
			content: [illustratedMessage],
			afterClose: function (event) {
				if (event.getSource()) {
					event.getSource().destroy();
				}
			}
		};
		return new ResponsivePopover(`${mdcLinkId}-popover`, popoverSettings);
	},
	openLink: async function (mdcLink: MdcLink, sapmLink: Link) {
		try {
			const hRef = await mdcLink.getTriggerHref();
			if (!hRef) {
				try {
					const linkItems = await mdcLink.retrieveLinkItems();
					if (linkItems?.length === 0 && (mdcLink as any).getPayload().hasQuickViewFacets === "false") {
						const popover: ResponsivePopover = FieldRuntime.createPopoverWithNoTargets(mdcLink);
						mdcLink.addDependent(popover);
						popover.openBy(sapmLink as unknown as Control);
					} else {
						await mdcLink.open(sapmLink as unknown as Control);
					}
				} catch (error) {
					Log.error(`Cannot retrieve the QuickView Popover dialog: ${error}`);
				}
			} else {
				const view = CommonUtils.getTargetView(sapmLink);
				const appComponent = CommonUtils.getAppComponent(view);
				const shellService = appComponent.getShellServices();
				const shellHash = shellService.parseShellHash(hRef);
				const navArgs = {
					target: {
						semanticObject: shellHash.semanticObject,
						action: shellHash.action
					},
					params: shellHash.params
				};

				KeepAliveHelper.storeControlRefreshStrategyForHash(view, shellHash);

				if (CommonUtils.isStickyEditMode(sapmLink as unknown as Control) !== true) {
					//URL params and xappState has been generated earlier hence using toExternal
					shellService.toExternal(navArgs as any, appComponent);
				} else {
					try {
						const newHref = await shellService.hrefForExternalAsync(navArgs, appComponent);
						openWindow(newHref);
					} catch (error) {
						Log.error(`Error while retireving hrefForExternal : ${error}`);
					}
				}
			}
		} catch (error) {
			Log.error(`Error triggering link Href: ${error}`);
		}
	},
	pressLink: async function (oEvent: any): Promise<void> {
		const oSource = oEvent.getSource();
		const sapmLink = oSource.isA("sap.m.ObjectIdentifier")
			? oSource.findElements(false, (elem: Element) => {
					return elem.isA("sap.m.Link");
			  })[0]
			: oSource;

		if (oSource.getDependents() && oSource.getDependents().length > 0 && sapmLink.getProperty("text") !== "") {
			const oFieldInfo = oSource.getDependents()[0];
			if (oFieldInfo && oFieldInfo.isA("sap.ui.mdc.Link")) {
				await FieldRuntime.openLink(oFieldInfo, sapmLink);
			}
		}
		return sapmLink;
	},
	uploadStream: function (controller: Controller, event: Event) {
		const fileUploader = event.getSource() as FileUploader,
			FEController = FieldRuntime._getExtensionController(controller),
			fileWrapper = fileUploader.getParent() as unknown as FileWrapper,
			uploadUrl = fileWrapper.getUploadUrl();

		if (uploadUrl !== "") {
			fileWrapper.setUIBusy(true);

			// use uploadUrl from FileWrapper which returns a canonical URL
			fileUploader.setUploadUrl(uploadUrl);

			fileUploader.removeAllHeaderParameters();
			const token = (fileUploader.getModel() as any)?.getHttpHeaders()["X-CSRF-Token"];
			if (token) {
				const headerParameterCSRFToken = new FileUploaderParameter();
				headerParameterCSRFToken.setName("x-csrf-token");
				headerParameterCSRFToken.setValue(token);
				fileUploader.addHeaderParameter(headerParameterCSRFToken);
			}
			const eTag = (fileUploader.getBindingContext() as Context | undefined | null)?.getProperty("@odata.etag");
			if (eTag) {
				const headerParameterETag = new FileUploaderParameter();
				headerParameterETag.setName("If-Match");
				// Ignore ETag in collaboration draft
				headerParameterETag.setValue(CollaborationActivitySync.isConnected(fileUploader) ? "*" : eTag);
				fileUploader.addHeaderParameter(headerParameterETag);
			}
			const headerParameterAccept = new FileUploaderParameter();
			headerParameterAccept.setName("Accept");
			headerParameterAccept.setValue("application/json");
			fileUploader.addHeaderParameter(headerParameterAccept);

			// synchronize upload with other requests
			const uploadPromise = new Promise((resolve: any, reject: any) => {
				this.uploadPromises = this.uploadPromises || {};
				this.uploadPromises[fileUploader.getId()] = {
					resolve: resolve,
					reject: reject
				};
				fileUploader.upload();
			});
			FEController.editFlow.syncTask(uploadPromise);
		} else {
			MessageBox.error(getResourceModel(controller).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT"));
		}
	},

	handleUploadComplete: function (
		event: FileUploader$UploadCompleteEvent,
		propertyFileName: { path: string } | undefined,
		propertyPath: string,
		controller: Controller
	) {
		const status = Number(event.getParameter("status")),
			fileUploader = event.getSource() as FileUploader,
			fileWrapper = fileUploader.getParent() as unknown as FileWrapper;

		fileWrapper.setUIBusy(false);

		const context = fileUploader.getBindingContext() as Context | undefined | null;
		if (status === 0 || status >= 400) {
			this._displayMessageForFailedUpload(event);
			this.uploadPromises[fileUploader.getId()].reject();
		} else {
			const newETag = (event.getParameter("headers") as Record<string, unknown>)?.etag;

			if (newETag) {
				// set new etag for filename update, but without sending patch request
				context?.setProperty("@odata.etag", newETag, null as any);
			}

			// set filename for link text
			if (propertyFileName?.path) {
				context?.setProperty(propertyFileName.path, fileUploader.getValue());
			}

			// delete the avatar cache that not gets updated otherwise
			fileWrapper.avatar?.refreshAvatarCacheBusting();

			this._callSideEffectsForStream(event, fileWrapper, controller);

			this.uploadPromises[fileUploader.getId()].resolve();
		}

		delete this.uploadPromises[fileUploader.getId()];

		// Collaboration Draft Activity Sync
		const isCollaborationEnabled = CollaborationActivitySync.isConnected(fileUploader);
		if (!isCollaborationEnabled || !context) {
			return;
		}

		const notificationData = [`${context.getPath()}/${propertyPath}`];
		if (propertyFileName?.path) {
			notificationData.push(`${context.getPath()}/${propertyFileName.path}`);
		}

		let binding = context.getBinding();
		if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			const oView = CommonUtils.getTargetView(fileUploader);
			binding = (oView.getBindingContext() as Context).getBinding();
		}
		if (binding.hasPendingChanges()) {
			binding.attachEventOnce("patchCompleted", () => {
				CollaborationActivitySync.send(fileWrapper, { action: Activity.Change, content: notificationData });
				CollaborationActivitySync.send(fileWrapper, { action: Activity.Unlock, content: notificationData });
			});
		} else {
			CollaborationActivitySync.send(fileWrapper, { action: Activity.Change, content: notificationData });
			CollaborationActivitySync.send(fileWrapper, { action: Activity.Unlock, content: notificationData });
		}
	},

	_displayMessageForFailedUpload: function (oEvent: FileUploader$UploadCompleteEvent): void {
		// handling of backend errors
		const sError = oEvent.getParameter("responseRaw") || oEvent.getParameter("response");
		let sMessageText, oError;
		try {
			oError = sError && JSON.parse(sError);
			sMessageText = oError.error && oError.error.message;
		} catch (e) {
			sMessageText = sError || getResourceModel(oEvent.getSource() as Control).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT");
		}
		MessageBox.error(sMessageText);
	},

	removeStream: function (event: Event, propertyFileName: { path: string } | undefined, propertyPath: string, controller: Controller) {
		const deleteButton = event.getSource() as Button;
		const fileWrapper = deleteButton.getParent() as unknown as FileWrapper;
		const context = fileWrapper.getBindingContext() as Context;

		// streams are removed by assigning the null value
		context.setProperty(propertyPath, null);
		// When setting the property to null, the uploadUrl (@@MODEL.format) is set to "" by the model
		//	with that another upload is not possible before refreshing the page
		// (refreshing the page would recreate the URL)
		//	This is the workaround:
		//	We set the property to undefined only on the frontend which will recreate the uploadUrl
		context.setProperty(propertyPath, undefined, null as any);

		this._callSideEffectsForStream(event, fileWrapper, controller);

		// Collaboration Draft Activity Sync
		const bCollaborationEnabled = CollaborationActivitySync.isConnected(deleteButton);
		if (bCollaborationEnabled) {
			let binding = context.getBinding();
			if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
				const oView = CommonUtils.getTargetView(deleteButton);
				binding = (oView.getBindingContext() as Context).getBinding();
			}

			const data = [`${context.getPath()}/${propertyPath}`];
			if (propertyFileName?.path) {
				data.push(`${context.getPath()}/${propertyFileName.path}`);
			}
			CollaborationActivitySync.send(deleteButton, { action: Activity.Lock, content: data });

			binding.attachEventOnce("patchCompleted", function () {
				CollaborationActivitySync.send(deleteButton, { action: Activity.Change, content: data });
				CollaborationActivitySync.send(deleteButton, { action: Activity.Unlock, content: data });
			});
		}
	},

	_callSideEffectsForStream: function (oEvent: any, oControl: any, oController: any) {
		const oFEController = FieldRuntime._getExtensionController(oController);
		if (oControl && oControl.getBindingContext().isTransient()) {
			return;
		}
		if (oControl) {
			oEvent.oSource = oControl;
		}
		oFEController._sideEffects.handleFieldChange(oEvent, this.getFieldStateOnChange(oEvent).state["validity"]);
	},

	getIconForMimeType: function (sMimeType: any) {
		return IconPool.getIconForMimeType(sMimeType);
	},

	/**
	 * Method to retrieve text from value list for DataField.
	 *
	 * @function
	 * @name retrieveTextFromValueList
	 * @param sPropertyValue The property value of the datafield
	 * @param sPropertyFullPath The property full path's
	 * @param sDisplayFormat The display format for the datafield
	 * @returns The formatted value in corresponding display format.
	 */
	retrieveTextFromValueList: function (sPropertyValue: string, sPropertyFullPath: string, sDisplayFormat: string) {
		let sTextProperty: string;
		let oMetaModel;
		let sPropertyName: string;
		if (sPropertyValue) {
			oMetaModel = CommonHelper.getMetaModel();
			sPropertyName = oMetaModel.getObject(`${sPropertyFullPath}@sapui.name`);
			return oMetaModel
				.requestValueListInfo(sPropertyFullPath, true)
				.then(function (mValueListInfo: any) {
					// take the "" one if exists, otherwise take the first one in the object TODO: to be discussed
					const oValueListInfo = mValueListInfo[mValueListInfo[""] ? "" : Object.keys(mValueListInfo)[0]];
					const oValueListModel = oValueListInfo.$model;
					const oMetaModelValueList = oValueListModel.getMetaModel();
					const oParamWithKey = oValueListInfo.Parameters.find(function (oParameter: any) {
						return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
					});
					if (oParamWithKey && !oParamWithKey.ValueListProperty) {
						throw new Error(`Inconsistent value help annotation for ${sPropertyName}`);
					}
					const oTextAnnotation = oMetaModelValueList.getObject(
						`/${oValueListInfo.CollectionPath}/${oParamWithKey.ValueListProperty}@com.sap.vocabularies.Common.v1.Text`
					);

					if (oTextAnnotation && oTextAnnotation.$Path) {
						sTextProperty = oTextAnnotation.$Path;
						const oFilter = new Filter({
							path: oParamWithKey.ValueListProperty,
							operator: "EQ",
							value1: sPropertyValue
						});
						const oListBinding = oValueListModel.bindList(`/${oValueListInfo.CollectionPath}`, undefined, undefined, oFilter, {
							$select: sTextProperty
						});
						return oListBinding.requestContexts(0, 2);
					} else {
						sDisplayFormat = "Value";
						return sPropertyValue;
					}
				})
				.then(function (aContexts: any) {
					const sDescription = sTextProperty ? aContexts[0]?.getObject()[sTextProperty] : "";
					switch (sDisplayFormat) {
						case "Description":
							return sDescription;
						case "DescriptionValue":
							return Core.getLibraryResourceBundle("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [
								sDescription,
								sPropertyValue
							]);
						case "ValueDescription":
							return Core.getLibraryResourceBundle("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [
								sPropertyValue,
								sDescription
							]);
						default:
							return sPropertyValue;
					}
				})
				.catch(function (oError: any) {
					const sMsg =
						oError.status && oError.status === 404
							? `Metadata not found (${oError.status}) for value help of property ${sPropertyFullPath}`
							: oError.message;
					Log.error(sMsg);
				});
		}
		return sPropertyValue;
	},

	handleTypeMissmatch: function (oEvent: any) {
		const resourceModel = getResourceModel(oEvent.getSource());
		MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE"), {
			details:
				`<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_SELECTED")}</strong></p>${
					oEvent.getParameters().mimeType
				}<br><br>` +
				`<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_ALLOWED")}</strong></p>${oEvent
					.getSource()
					.getMimeType()
					.toString()
					.replaceAll(",", ", ")}`,
			contentWidth: "150px"
		} as any);
	},

	handleFileSizeExceed: function (oEvent: any /*iFileSize: any*/) {
		MessageBox.error(
			getResourceModel(oEvent.getSource()).getText(
				"M_FIELD_FILEUPLOADER_FILE_TOO_BIG",
				oEvent.getSource().getMaximumFileSize().toFixed(3)
			),
			{
				contentWidth: "150px"
			} as any
		);
	},

	_getExtensionController: function (oController: any) {
		return oController.isA("sap.fe.core.ExtensionAPI") ? oController._controller : oController;
	},

	/**
	 * Event handler to create and show who is editing the field popover.
	 *
	 * @param source The avatar which is next to the field locked
	 * @param view Current view
	 */
	showCollaborationEditUser: function (source: Avatar, view: View) {
		const resourceModel = ResourceModelHelper.getResourceModel(view);
		let popover = Core.byId(`manageCollaborationDraft--editUser`) as ResponsivePopover;

		if (!popover) {
			popover = new ResponsivePopover("manageCollaborationDraft--editUser", {
				showHeader: false,
				placement: "Bottom"
			});
			popover.addStyleClass("sapUiContentPadding");
			view.addDependent(popover);
		}

		const bindingPath = (source.getBinding("initials") as CompositeBinding)
			?.getBindings()
			.find((binding) => binding?.getPath()?.startsWith("/collaboration/activities"))
			.getPath();
		const activities = source.getBindingContext("internal")?.getObject(bindingPath);

		let editingActivity: UserActivity | undefined;
		if (activities && activities.length > 0) {
			editingActivity = activities.find((activity: UserActivity) => {
				return activity.key === getActivityKeyFromPath(source.getBindingContext()!.getPath());
			});
		}
		popover.destroyContent();
		popover.addContent(
			new Label({
				text: resourceModel.getText("C_COLLABORATIONAVATAR_USER_EDIT_FIELD", [`${editingActivity?.name}`])
			})
		);
		popover.openBy(source);
	}
};

/**
 * @global
 */
export default FieldRuntime;
