sap.ui.define(["sap/ui/model/Context", "sap/suite/ui/generic/template/lib/MessageUtils", "sap/ui/model/Filter", "sap/ui/model/FilterOperator",  "sap/m/MessageBox", "sap/suite/ui/generic/template/genericUtilities/CacheHelper"],
	function(Context, MessageUtils, Filter, FilterOperator, MessageBox, CacheHelper) {
		"use strict";

		var oRejectedPromise = Promise.reject();
		oRejectedPromise.catch(Function.prototype);
		
		function createNonDraft(oParentContext, sBindingPath, oModel, vPredefinedValues, bMakeRequestsCanonical) {
			var oCreateContext = oModel.createEntry(sBindingPath, {
				properties: vPredefinedValues,
				context: oParentContext,
				batchGroupId: "Changes",
				changeSetId: "Changes",
				canonicalRequest: bMakeRequestsCanonical
			});
			return oCreateContext;
		}

		// create a new instance for the specified draft enabled entity set with the given binding path.
		// Returns a promise that resolves to the context.
		// If the creation fails the returned Promise is rejected.
		function create(oDraftController, sEntitySet, sBindingPath, oModel, oApplication, vPredefinedValues, oParameters, oCommonUtils) {
			sBindingPath = sBindingPath || "/" + sEntitySet;
			var bCreateRequestsCanonical = oApplication.mustRequireRequestsCanonical();
			oParameters.oFunctionImportDialogInfo = {
				getTitleText: function () {
					return oCommonUtils.getText("DIALOG_TITLE_NEW_ACTION_FOR_CREATE");
				},
				getActionButtonText: function () {
					return oCommonUtils.getText("DIALOG_ACTION_BUTTON_NEW_ACTION_FOR_CREATE");
				}
			};
			return oDraftController.createNewDraftEntity(sEntitySet, sBindingPath, vPredefinedValues, bCreateRequestsCanonical, oParameters).then(function(oResponse){
				return oResponse.context; // map response onto the contained context
			});
		}

		function fnReadDraftAdministrativeData(oModel, sBindingPath, oBusyHelper) {
			var oPromise = new Promise(function(resolve, reject) {
				oModel.read(sBindingPath, {
					urlParameters: {
						"$expand": "DraftAdministrativeData"
					},
					success: function(oResponse) {
						resolve(oResponse);
					},
					error: function(oResponse) {
						reject(oResponse);
					}
				});
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}
		/*
		 * functionality similar to routingHelper - START - refactoring
		 * */
		function fnReadDraftAdministrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract) {
			var oPromise = new Promise(function(resolve, reject) {
				var i, iLen, sProperty, sValue, aFilters = [];
				if (aKeys && oStartupParameters && oModel) {
					iLen = aKeys.length;
					for (i = 0; i < iLen; i++) {
						// get property from property path
						sProperty = aKeys[i].PropertyPath;
						// get value from parameter array (should have only 1)
						sValue = oStartupParameters[sProperty][0];
						aFilters.push(new Filter(sProperty, FilterOperator.EQ, sValue));
					}
					if (oTransactionController.getDraftController()
							.getDraftContext().isDraftEnabled(sEntitySet)) {
						var oDraftFilter = new Filter({
							filters: [new Filter("IsActiveEntity", "EQ", false),
							          new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
							          and: false
						});
						aFilters.push(oDraftFilter);
					}
					var oCompleteFilter = new Filter(aFilters, true);
					oModel.read("/" + sEntitySet, {
						urlParameters: {
							"$expand": "DraftAdministrativeData"
						},
						filters: [oCompleteFilter],
						success: function(oResult) {
							var oRowResult = fnReadObjectProcessResults(oResult, oModel, oStartupParameters);
							if (oRowResult) {
								resolve(oRowResult);
							} else {
								reject(oResult);
							}
						},
						error: function(oResponse) {
							reject(oResponse);
						}
					});
				}
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oTemplateContract.oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}

		function fnReadObjectProcessResults(oResult, oModel, oStartupParameters) {


			var oRow, i, iLength, oRowResult;
			if (oResult && oResult.results){
				iLength = oResult.results.length;
				if (iLength == 0) {
					oRowResult = null;
				} else if (iLength == 1) {
					oRowResult = oResult.results[0];
				} else if (iLength >= 1) {
					var aDrafts  = [];
					var aActive = [];
					for (i = 0; i < iLength; i++) {
						oRow = oResult.results[i];
						if (oRow && oRow.IsActiveEntity) {
							aActive.push(oRow);
						} else if (oRow && oRow.IsActiveEntity == false) {
							aDrafts.push(oRow);
						}
					}
					if (aActive.length == 0 && aDrafts.length >= 2){
						//DraftUUID match?
						var oDraftRow;
						for (var j = 0; j < aDrafts.length; j++) {
							oDraftRow = aDrafts[j];
							if (oDraftRow.DraftUUID == oStartupParameters.DraftUUID){
								//show corresponding object
								oRowResult = oDraftRow;
								break;
							}
						}
						if (!oRowResult){
							oRowResult = aDrafts[0];
						}
					} else if (aActive.length == 1 && aDrafts.length == 1){
						//no DraftUUID check
						oRowResult = aActive[0];
					} else if (aActive.length == 1 && aDrafts.length >= 2){
						oRowResult = aActive[0];
					}
				}
			}
			return oRowResult;
		}


		/*
		 * functionality similar to routingHelper - END
		 * */

		/*
		 * This method is called during startup and ensures that all changes performed on draft objects are
		 * automatically saved after a delay of 20 seconds interval.
		 * This is done by registering to the propertyChange-event of the OData model of the app.
		 * Note that this affects even changes that are done in breakouts or reuse components as long as they use the standard OData model.
		 * Components using different channels (e.g. another OData model) for storing the data need to use method
		 * sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController.saveDraft()
		*/
		function enableAutomaticDraftSaving(oTemplateContract){
			var oAppComponent = oTemplateContract.oAppComponent;
			var oModel = oAppComponent.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oNavigationController = oAppComponent.getNavigationController();
			var oApplicationController = oAppComponent.getApplicationController(); // instance of sap.ui.generic.app.ApplicationController
			var oDraftContext = oApplicationController.getTransactionController().getDraftController().getDraftContext();

			var fnErrorHandler = function(oError){
				/* TODO: change handleError API
				   we anyway want to modify the API for the handleError method. Until then we use the
				   mParameters to pass the needed resourceBundle and navigation Controller. */
				oTemplateContract.oApplicationProxy.getResourceBundleForEditPromise().then(function(oResourceBundle){
					MessageUtils.handleError(MessageUtils.operations.modifyEntity, null, null, oError, {
						resourceBundle: oResourceBundle,
						navigationController: oNavigationController,
						model: oModel
					});
					MessageUtils.handleTransientMessages(oTemplateContract);
				});
			};
			
			var fnPropertyChanged = function(oEvent){
				oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/draftIndicatorState", sap.m.DraftIndicatorState.Clear);

				var oContext = oEvent.getParameter("context");
				// Ignore all cases which are non-draft
				if (!oDraftContext.hasDraft(oContext)){
					return;
				}
				// for parameters of function imports special paths are introduced in the model, that are not known in the metamodel
				// as we don't need a merge call for changes to these properties, we can just ignore them
				if (!oMetaModel.getODataEntitySet(oContext.getPath().split("(")[0].substring(1))){
					return;
				}
				var sPath = oEvent.getParameter("path");
				// delegate the draft saving to the ApplicationController
				oApplicationController.propertyChanged(sPath, oContext, oTemplateContract.nDelayedDraftTimerInSeconds).catch(fnErrorHandler);
				//update the draft has modified information in ContextBookKeeping Map
				oTemplateContract.oApplicationProxy.markCurrentDraftAsModified();
			};

			oModel.attachPropertyChange(fnPropertyChanged); // ensure that the handler is called whenever a user input (affecting the OData model) is performed
		}

		function fnUnsavedChangesDialog(oTemplateContract, oDraftAdministrativeData, oCommonUtils, oViewProxy, bOpenInEditMode) {
			var oResourceObject = oTemplateContract || oCommonUtils;
			return new Promise(function(resolve, reject) {
				var sWarningText = oResourceObject.getText("DRAFT_LOCK_EXPIRED", [oDraftAdministrativeData.LastChangedByUserDescription ||
							oDraftAdministrativeData.LastChangedByUser
						]);
				var sEdit =  oResourceObject.getText("Edit");
				var sCancel =  oResourceObject.getText("CANCEL");
					MessageBox.warning(sWarningText, {
					title: oResourceObject.getText("ST_UNSAVED_CHANGES_TITLE"),
					actions: [sEdit, sCancel],
					emphasizedAction: sEdit,
					onClose: function (sAction) {
						if (sAction === sEdit) {
							resolve();
						} else if (sAction === sCancel) {
							if (bOpenInEditMode) {
								oViewProxy.navigateUp();
							}
						}
						reject();
					}
				});
			});
		}

		function edit(oTransactionController, sEntitySet, sBindingPath, oModel, oTemplateContract,
			fnBeforeDialogCallback, aKeys, oStartupParameters) {
			//refactoring needed
			var oRet = new Promise(function(resolve, reject) {
				var fnEditEntity = function(oContext, sRootExpand){
					var oEditEntityPromise = oTransactionController.editEntity(oContext, false, sRootExpand);
					resolve(oEditEntityPromise);
					// The active context is invalidated as the DraftAdministrativeData of the context(the active context) has changed after draft creation.
					// This is done to keep the DraftAdministrativeData of the record updated.					
					oEditEntityPromise.then(function(){
						oModel.invalidateEntry(oContext);
					});
				};
				if (sBindingPath === "" && aKeys && oStartupParameters ){
					var oTreeNode = oTemplateContract.mEntityTree[sEntitySet];
					var oComponentRegistryEntry = oTreeNode.componentId && oTemplateContract.componentRegistry[oTreeNode.componentId];
					var oInfoForContentIdPromise = oComponentRegistryEntry ? CacheHelper.getInfoForContentIdPromise(sEntitySet, oModel, oTemplateContract.oAppComponent.getId(), oComponentRegistryEntry.utils.getRootExpand) : Promise.resolve({ contentIdRequestPossible: false });
					Promise.all([oInfoForContentIdPromise, fnReadDraftAdministrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract)])
					.then(function(aParameters) {
						var oResponse = aParameters[1];
						var sRootExpand = aParameters[0].contentIdRequestPossible ? aParameters[0].parametersForContentIdRequest.sRootExpand : null;
						var sResponseBindingPath = "/" + oModel.createKey(sEntitySet, oResponse);
						oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
							var oBindingContext = new Context(oModel, sResponseBindingPath);
							if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
								// no or own draft
								fnEditEntity(oBindingContext, sRootExpand);
							} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
								reject({
									lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
								});
							} else { // unsaved changes
								fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
									fnBeforeDialogCallback).then(
									function() {
										fnEditEntity(oBindingContext);
									},
									function() {
										reject({
											lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
										});
									});
							}
						});
					},
						function(oResponse) {
							// DraftAdminData read failed
							reject({
								draftAdminReadResponse: oResponse
							});
						}
					);
				} else {
					var oDraftContext = oTransactionController.getDraftController().getDraftContext();
					oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
						if (oDraftContext.isDraftEnabled(sEntitySet)) {
							// todo: enable preserveChanges
							if (true || !oDraftContext.hasPreserveChanges(oBindingContext)) {
								fnReadDraftAdministrativeData(oModel, sBindingPath, oTemplateContract.oBusyHelper).then(function(oResponse) {
									if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
										// no or own draft
										fnEditEntity(oBindingContext);
									} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
										reject({
											lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
										});
									} else { // unsaved changes
										var editConfirmation = function(){
												fnEditEntity(oBindingContext);
											};
										var editRejection = function(){
											reject({
													lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
												});
										};
										var unSavedChangesDialogPromise = fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
											fnBeforeDialogCallback);
										unSavedChangesDialogPromise.then(editConfirmation, editRejection);
									}
								}, function(oResponse) {
									// DraftAdminData read failed
									reject({
										draftAdminReadResponse: oResponse
									});
								});
							}
						} else {
							resolve({
								context: oBindingContext
							});
						}
					});
				}
			});
			oTemplateContract.oBusyHelper.setBusy(oRet, true);
			return oRet;
		}
		
		/* 
		Allows direct edit on the entires on the list, unlike the method 'edit'above, this method first edit the entry with preserveChanges as true
		If the response indicates an unsaved change or locked record, a corresponding dialog is shown to proceed or cancel with the edit.
		*/
		function directEdit(oTransactionController, sEntitySet, sBindingPath, oModel, oApplication, oCommonUtils, oViewDependencyHelper, oViewProxy, bOpenInEditMode){
			var oDraftContext = oTransactionController.getDraftController().getDraftContext();
			var oPromise = new Promise(function(resolve,reject) {
				oModel.createBindingContext(sBindingPath, null, null, function(oBindingContext){
					if (oDraftContext.isDraftEnabled(sEntitySet)) {
						oTransactionController.editEntity(oBindingContext, true).then(function(oResponse) {
							oBindingContext.getModel().invalidateEntry(oBindingContext);
							oViewDependencyHelper.setRootPageToDirty();
							resolve({
								context: oResponse.context
							});		
						}, function(oResponse) {
							if (oResponse && oResponse.response && oResponse.response.statusCode === "409") {
								//remove transient message associated with rc 409 in order to prevent message pop-up
								oApplication.removeTransientMessages();
								fnReadDraftAdministrativeData(oModel, sBindingPath, oApplication.getBusyHelper()).then(
									function(oResponse) {
										if (oResponse.DraftAdministrativeData.InProcessByUser) {
											reject({
												lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
											});
										} else { //unsaved changes
											var editConfirmation = function(){
											var oUnsavedChangesEditPromise = oTransactionController.editEntity(oBindingContext, false).then(function(oResponse){
													oBindingContext.getModel().invalidateEntry(oBindingContext);
													oViewDependencyHelper.setRootPageToDirty();
													resolve({
														context: oResponse.context
													});	
												});
												oApplication.getBusyHelper().setBusy(oUnsavedChangesEditPromise, true);
											};
											var editRejection = Function.prototype;
											var unSavedChangesDialogPromise = fnUnsavedChangesDialog(undefined, oResponse.DraftAdministrativeData,oCommonUtils, oViewProxy, bOpenInEditMode);
											unSavedChangesDialogPromise.then(editConfirmation,editRejection);
										}
									},
									function(oResponse) {
										// DraftAdminData read failed
										reject({
											draftAdminReadResponse: oResponse
										});
									});
									oApplication.getBusyHelper().setBusy(oPromise, true);
							} else {
								reject(oResponse);
							}
						});
				} else {
					return resolve({
						context: oBindingContext
					});
				}
				});
			});
			return oPromise;
		}
		
		function deleteEntity(oDraftController, fnExecuteDelete, oApplicationProxy, oContext, bIsActiveEntity, sActionType){
			var bHasActiveEntity = oDraftController.hasActiveEntity(oContext);
			var oSiblingPromise = bHasActiveEntity && !bIsActiveEntity ? oApplicationProxy.getDraftSiblingPromise(oContext) : Promise.resolve();
			return oSiblingPromise.then(function(oActive){
				var oDeletePromise = fnExecuteDelete(bIsActiveEntity, bHasActiveEntity, oContext);
				if (!bIsActiveEntity) { // cancellation of a draft
					var fnTransformActiveContext = function(){
						return  { context: oActive };
					};
					var oCancellationPromise = oDeletePromise.then(fnTransformActiveContext);
					oApplicationProxy.cancellationStarted(oContext, oCancellationPromise, sActionType, oActive);					
				}
				return oDeletePromise;
			});			
		}

		function discardDraft(oDraftController, oTransactionController, oApplicationProxy, oContext){
			var fnExecuteDelete = function(bIsActiveEntity, bHasActiveEntity, oContext){
				return oTransactionController.deleteEntity(oContext, null, true);
			};
			return deleteEntity(oDraftController, fnExecuteDelete, oApplicationProxy, oContext, false, "discardAction");
		}
		
		function fnGetMessagesFromContextFilter(oContextFilter, oMessageManager, bExcludeETagMessages) {
			var oMessageModel = oMessageManager.getMessageModel();
			var oMessageBinding = oMessageModel.bindList("/", null, null, [oContextFilter]); // Note: It is necessary to create this binding each time, since UI5 does not update it (because there is no change handler)
			var aRet = oMessageBinding.getAllCurrentContexts().map(function(oContext) {
				return oContext.getObject();
			});
			if (bExcludeETagMessages){
				aRet = aRet.filter(function(oMessage){
					return !MessageUtils.isMessageETagMessage(oMessage);	
				});
			}
			return aRet;
		}

		// This function performs an activation of the given draft. It returns a Promise which is resolved or rejected depending on whether the
		// activation was finally successful or not.
		// In order to achieve this result the function may call dialogs in between (e.g. the confirmation dialog for warnings).
		// Therefore, the callers of this function must not use the returned Promise for setting the app busy.
		// The busy handling is executed by this function on its own.
		function activateDraftEntity(oCreateDialogContext, oCreateWithDialogFilter, oBusyHelper, oServices, oController, oComponentUtils) {
			if (oBusyHelper.isBusy()) {
				return oRejectedPromise;
			}
			var oRet = new Promise(function(resolve, reject) {
				var oView = oController.getView();
				var oContext = oCreateDialogContext ? oCreateDialogContext : oView.getBindingContext();
				var oContextFilter = oCreateWithDialogFilter ? oCreateWithDialogFilter : oServices.oTemplateCapabilities.oMessageButtonHelper && oServices.oTemplateCapabilities.oMessageButtonHelper.getContextFilter(true);
				var oMessageManager = sap.ui.getCore().getMessageManager();
				var oModel = oView.getModel();
				var oComponent = oController.getOwnerComponent();
				var sEntitySet = oComponent.getEntitySet();
				var oAppComponent = oComponent.getAppComponent();
				var sAppId = oAppComponent.getId();
				var oInfoForContentIdPromise = CacheHelper.getInfoForContentIdPromise(sEntitySet, oModel, sAppId, oComponentUtils.getRootExpand);
				var oActivationStartedPromise = oInfoForContentIdPromise.then(function(oInfoObject){
					var sRootExpand = oInfoObject.contentIdRequestPossible ? oInfoObject.parametersForContentIdRequest.sRootExpand : undefined;
					var aCurrentStateMessages; // This variable will be filled after a failure of the first call of function fnActivate (see below)
					// The function that performs the activation, handles potential errors, and ensures that finally either resolve or reject is called (based on whether the activation was successful or not).
					// Boolean parameter bForce will be false when this function is called the first time. This indicates that the backend should not perform the activation if warnings are present.
					// Instead it should return with a status code 412 and preference-applied="handling=strict" in order to indicate that the user needs to confirm.
					// In this case, if the user confirms the warning the function will be called again (recursively) this time bForce will be true to indicate that the backend should ignore warnings.
					var fnActivate = function(bForce){
						// First make sure that we are able to identify the (applicable) state messages that were present before the backend call was made.
						// In a potential second call of this function this information is already available in aCurrentStateMessages.
						var aStateMessagesBeforeSave = aCurrentStateMessages || fnGetMessagesFromContextFilter(oContextFilter, oMessageManager);
						var oActivationPromise = oServices.oDraftController.activateDraftEntity(oContext, bForce, sRootExpand);
						oServices.oApplication.activationStarted(oContext, oActivationPromise); // trigger event for listeners of the activation process
						oActivationPromise.then(function(oResponse){
							oMessageManager.removeMessages(aStateMessagesBeforeSave); // remove state messages that apply to the draft which does no longer exist (garbage)
							resolve(oResponse); // signal positive result
						});
						oActivationPromise.catch(function(oError){
							// When reaching this point we assume that there are messages (in the message model) which explain to the user why the activation has failed.
							// We now need to identify these messages. Moreover we need to find out which of the following possibilities to display the messages is correct:
							// 1. Show them in a confirmation popup such that the user can still decide whether he wants to ignore them or not.
							//    This can only happen when bForce is false (first call of fnActivate).
							//    Moreover, we assume that in this case no error message and at least one warning message should be displayed to the user.
							// 2. Show state messages in the message popover
							// 3. Show transient messages in the message popup
							// In case 2 and 3 it is expected that at least one of those messages is an error message.
							// Note that in case 2 and possibly also in case 1 we need to suppress the generic error message (like "An exception has occurred") which is coming as a transient message to
							// indicate that the activation request has failed.
							// Note that case 3 has 2 subcases 
							// 3a) Some severe technical error has happened which even prevented the Preparation call to be executed successfully
							// 3b) The Preparation call was successful and did not find any reason which prevents activation. However, the call of activation failed.
							//     Note that this failure may still be because of business reasons (excluding reasons named in case 1) or technical reasons.
							// In case 3a) (and only in this case) the list of state messages in the message model will not have been updated.
							// Therefore, in case at least one state message exists in the message model we first check whether this is an instance which was already there before the backend call.
							// If this is the case we have successfully identified case 3a) and we show all transient messages.
							// If no state message is available we still cannot exclude case 3a). However, we rely on the fact that in this case the following logic will treat it as case 3b) which
							// leads to the same result.
							// Next step (if bForce is false) is checking for case 1. This is considered applicable if these two conditions are true:
							// - there is at least one transient message which identifies this case (statusCode is "412" and header contains preference-applied: "handling=strict")
							// - no state error message is available
							// If this is the case the list of messages shown to the user for confirmation consists of the following messages:
							// - all state messages
							// - In case there is no state message: all transient messages of severity warning
							// The standard transient message dialog will be suppressed in this case. In particular the generic error message named above will not be shown.
							// If case 1 is not applicable case 2 is considered applicable if at least one state message of severity error is available.
							// Also in this case the standard transient message dialog will be suppressed.
							// If none of the cases above is applicable case 3 is considered to be applicable (either b) or a) with an empty list of state messages).
							// Therefore, all existing transient messages will be shown.
							aCurrentStateMessages = fnGetMessagesFromContextFilter(oContextFilter, oMessageManager);
							if (aCurrentStateMessages.length > 0){
								var oSampleMessage = aCurrentStateMessages[0];
								var bStateMessagesUnchanged = aStateMessagesBeforeSave.some(function(oTestMessage){
									return oTestMessage === oSampleMessage;
								});
								if (bStateMessagesUnchanged){
									reject();
									return;
								}
							}
							var aTransientMessages = oServices.oApplication.getTransientMessages();
							var aTransientWarnings = [];
							var aTransientErrors = [];
							var bIs412 = false;
							aTransientMessages.forEach(function(oMessage){
								bIs412 = !bForce && (bIs412 || (oMessage.technicalDetails && oMessage.technicalDetails.statusCode === "412"
								&& oMessage.technicalDetails.headers && oMessage.technicalDetails.headers["preference-applied"] === "handling=strict"));
								if (oMessage.type === "Warning"){
									aTransientWarnings.push(oMessage);
								} else if (oMessage.type === "Error"){
									aTransientErrors.push(oMessage);
								}
							});
							var bHasStateError = aCurrentStateMessages.some(function(oMessage){
								return oMessage.type === "Error";
							});
							var bIsWarning = bIs412 && !bHasStateError;
							if (bIsWarning){
								// Only show transient warnings in the confirmation popup if no state warning is available (note that backend sometimes sends warnings redundantly as transient and state message)
								var aMessagesForUserDecision = aCurrentStateMessages.length > 0 ? aCurrentStateMessages : aTransientWarnings;
								var oCustomMessageProvider = aCurrentStateMessages.length === 0 && { // if confirmation popup is to show transient messages these messages should be excluded from the
									isCustomMessage: function(oMessage){                             // normal handling of transient messages (until the confirmation popup is closed)
										return aTransientWarnings.indexOf(oMessage) >= 0;
									}
								};
								if (oCustomMessageProvider){
									oServices.oApplication.registerCustomMessageProvider(oCustomMessageProvider);
								}
								oServices.oApplication.removeTransientMessages();								
								var fnOnConfirmationPopupClose = function(bConfirmed){
									if (oCustomMessageProvider){ // if transient messages have been shown in the confirmation popup they can be removed from the message model when the confirmation popup is closed
										oServices.oApplication.deregisterCustomMessageProvider(oCustomMessageProvider);
										oServices.oApplication.removeTransientMessages();
									}
									if (bConfirmed){
										fnActivate(true);
									} else {
										reject();
									}
								};
								var oParameters = {
									messagesForUserDecison: aMessagesForUserDecision
								};
								var oCRUDActionHandler = oComponentUtils.getCRUDActionHandler();
								oCRUDActionHandler.handleCRUDScenario(4, fnOnConfirmationPopupClose.bind(null, true), fnOnConfirmationPopupClose.bind(null, false), "Activate", oParameters);
								return;
							}
							reject();
							if (bHasStateError){
								oServices.oApplication.removeTransientMessages();
								if (oServices.oTemplateCapabilities && oServices.oTemplateCapabilities.oMessageButtonHelper) {
									oServices.oTemplateCapabilities.oMessageButtonHelper.showMessagePopover();
									return;
								}
							}
							MessageUtils.handleError(MessageUtils.operations.activateDraftEntity, oController, oServices, oError, null);
						});
						oBusyHelper.setBusy(oActivationPromise);
					};
					oBusyHelper.setBusy(oActivationStartedPromise);
					var oGetSiblingPromise = oServices.oApplication.getDraftSiblingPromise(oContext).then(function(oSiblingContext){
						if (oSiblingContext){
							 oModel.invalidateEntry(oSiblingContext);
						}
					});
					oBusyHelper.setBusy(oGetSiblingPromise);
					oGetSiblingPromise.then(fnActivate.bind(null, false));
				});
			
				oBusyHelper.setBusy(oActivationStartedPromise);
			});
			return oRet;
		}

		return {
			createNonDraft: createNonDraft,
			create: create,
			edit: edit,
			directEdit:directEdit,
			enableAutomaticDraftSaving: enableAutomaticDraftSaving,
			discardDraft: discardDraft,
			deleteEntity: deleteEntity,
			activateDraftEntity: activateDraftEntity,
			fnGetMessagesFromContextFilter: fnGetMessagesFromContextFilter
		};
	}
);
