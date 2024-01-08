sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/lib/MessageUtils",
	"sap/suite/ui/generic/template/genericUtilities/testableHelper",
	"sap/ui/core/Element",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/oDataModelHelper"
], function (BaseObject, MessagePopover, MessagePopoverItem, Filter, FilterOperator, JSONModel, MessageUtils, testableHelper, Element, extend, oDataModelHelper) {
	"use strict";

	Filter = testableHelper.observableConstructor(Filter, true);

	var oPersistentFilter = new Filter({
		path: "persistent",
		operator: FilterOperator.EQ,
		value1: false
	}); // exclude all messages that are persistent for frontend (i.e. transient for backend)
	var oSemanticalFilter = new Filter({
		path: "technical",
		operator: FilterOperator.EQ,
		value1: false
	}); // exclude all messages that are technical (they are added by the UI5 model in some scenarios but not important for our use-case)
	var oValidationFilter = new Filter({
		path: "validation",
		operator: FilterOperator.EQ,
		value1: true
	}); // include all validation messages (i.e. frontend-messages)

	var oImpossibleFilter = new Filter({
		filters: [oValidationFilter, new Filter({
			path: "validation",
			operator: FilterOperator.EQ,
			value1: false
		})],
		and: true
	});

	// oHost is an object representing the view that hosts the MessageButton
	// The following properties are expected in oHost:
	// - controller: The controller of the view the MessageButton is placed on
	// - getPrepareMessageDisplayPromise (optional): A function that returns a Promise that should be waited for,
	//   before the popover is opened. This Promise may resolve to a Sorter which sorts the messages in the popover.
	function getMethods(oTemplateUtils, oHost, bIsODataBased) {
		var oController = oHost.controller;
		var oComponent = oController.getOwnerComponent();
		var oUiModel = oComponent.getModel("ui");
		var oHelperModel = new JSONModel({
			isPopoverOpen: false,
			messageToGroupName: Object.create(null)
		});
		var oMessageButton = oController.byId("showMessages");
		var bIsDraftEnabled = oTemplateUtils.oComponentUtils.isDraftEnabled();
		
		var bActive = false; // Is this helper currently active
		var sCurrentBindingPath; // the binding path currently valid for the page this instance is responsible for
		var oContextFilter; // the filter to be set on the full target
		var oCurrentPersistentFilter;
		var oCurrentMessageSupportFunctions;
		
		var aItemChangeListeners = []; // filled by fnRegisterExternalListener. Gives the possibility to register for changes on the list of messages.

		// aControlIds is an array of control ids.
		// This function checks, whether there is at least on id that can be used to scroll to.
		function isPositionable(sMsgId, aControlIds, bIsPopoverOpen) {
			var bRet = !!(bIsPopoverOpen && aControlIds && oTemplateUtils.oCommonUtils.getPositionableControlId(aControlIds));
			// bRet is the value that should be returned by this function.
			// However, we also check whether for the given message there is still potential to perform an update on sorting (represented by messageToUpdateFunction[sMsgId]).
			// if yes, we trigger it now.
			var mMessageToUpdateFunction = bRet && oHelperModel.getProperty("/messageToUpdateFunction");
			var fnUpdateSorting = mMessageToUpdateFunction && mMessageToUpdateFunction[sMsgId];
			(fnUpdateSorting || Function.prototype)();
			return bRet;
		}
		
		function getSubtitle(sMsgId, aControlIds, sAdditionalText, bIsPopoverOpen){		
			var sRet = (bIsPopoverOpen && sMsgId && aControlIds && oCurrentMessageSupportFunctions) ? oCurrentMessageSupportFunctions.getSubtitle(sMsgId, sAdditionalText) : sAdditionalText;		
			return sRet;
		}
		
		// function that determines whether we are currently in the Non-draft create case
		var getIsNonDraftCreate = (bIsODataBased && !bIsDraftEnabled) ?  oUiModel.getProperty.bind(oUiModel, "/createMode") : function(){ return false; };
		
		var oCurrentFilter = oImpossibleFilter; // the filter currently valid. Initialize with the filter excluding everything
		var oMessagePopover, oItemBinding;
		oTemplateUtils.oCommonUtils.getDialogFragment("sap.suite.ui.generic.template.fragments.MessagePopover", {
			afterClose: function(){
				oHelperModel.setProperty("/isPopoverOpen", false);
				oItemBinding.sort([]); // do not invest ressources in sorting while the popover is closed
			},
			beforeOpen: function () {
				oMessagePopover.navigateBack();
				oHelperModel.setProperty("/isPopoverOpen", true);
			},
			isPositionable: isPositionable,
			getSubtitle: getSubtitle,
			titlePressed: function (oEvent) { // the user wants to navigate from the message to the corresponding control
				MessageUtils.navigateFromMessageTitleEvent(oTemplateUtils, oEvent, oComponent, bIsDraftEnabled, sCurrentBindingPath);
			}
		}).then(function (oMPopover) {
			oMessagePopover = oMPopover;
			oMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "msg");
			oMessagePopover.setModel(oHelperModel, "helper");
			oItemBinding = oMessagePopover.getBinding("items");
			oItemBinding.filter(oCurrentFilter);

			var oTemplatePrivate = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
			oTemplatePrivate.setProperty("/generic/messageButtonInfo", {
				count: 0,
				tooltip: oTemplateUtils.oCommonUtils.getText("MESSAGE_BUTTON_TOOLTIP_P", [0])
			});
			oItemBinding.attachChange(function (oEvent) {
				var iCount = oItemBinding.getLength();
				var iErrorCount = 0;
				var oMessageButtonInfo = { // shapes the message button (will be set to the /generic/messageButtonInfo property in the template private model)
					count: iCount
				};
				if (iCount > 0) {
					// If message popover is already open, make sure that its content is adapted to the change
					if (oHelperModel.getProperty("/isPopoverOpen")){
						var mParameters = oEvent.getParameters();
						if (mParameters.reason !== "sort"){
							getPrepareDisplayPromise(true);
						}
					}
					// Now update oMessageButtonInfo
					var aMessageContexts = oItemBinding.getAllCurrentContexts();
					var bWarning, bSuccess, bInfo;
					// Only error count is tracked because we show only error count on message button in footer. In other cases like warning, info, only semactic color is shown.
					aMessageContexts.forEach(function(oMessageContext){
						var oMessage = oMessageContext.getObject();
						switch (oMessage.type){
							case "Error":
								iErrorCount++;
								break;
							case "Warning":
								bWarning = true;
								break;
							case "Success":
								bSuccess = true;
								break;
							default:
								bInfo = true;	
						}
					});
					if (iErrorCount > 0) {
						oMessageButtonInfo.severity = "Negative";
						oMessageButtonInfo.icon = "sap-icon://message-error";
					} else if (bWarning) {
						oMessageButtonInfo.severity = "Critical";
						oMessageButtonInfo.icon = "sap-icon://message-warning";						
					} else if (bInfo) {
						oMessageButtonInfo.severity = "Neutral";
						oMessageButtonInfo.icon = "sap-icon://message-information";						
					} else if (bSuccess) {
						oMessageButtonInfo.severity = "Success";
						oMessageButtonInfo.icon = "sap-icon://message-success";							
					}
				}
				oMessageButtonInfo.label = "" + (iErrorCount || "");
				oMessageButtonInfo.tooltip = oTemplateUtils.oCommonUtils.getText(iCount === 1 ? "MESSAGE_BUTTON_TOOLTIP_S" : "MESSAGE_BUTTON_TOOLTIP_P", [iCount]);
				oTemplatePrivate.setProperty("/generic/messageButtonInfo", oMessageButtonInfo);
				// Make sure that the change is propagated to all registered listeners:
				aItemChangeListeners.forEach(function(fnListener){
					fnListener();
				});					
			});
		});
		// Add message model as an own model with name msg

		var oLocalValidationFilter = new Filter({
			filters: [oValidationFilter, new Filter({
				path: "controlIds",
				test: function (aControlIds) {
					return !!oTemplateUtils.oCommonUtils.getPositionableControlId(aControlIds);
				},
				caseSensitive: true
			})],
			and: true
		});

		var aFilterProvider = []; //Callback functions registered by reuse components (or break-outs) that want to add their message filters
		var iCurrentCallCount = 0; // a counter which is increased each time sCurrentBinding path is changed
		var fnNewFilter; // function fnResolved (see below) with first parameter bound to iCurrentCallCount. Registered at Promises provided by external filter providers.
		var aCurrentFilters; // a list of filters currently set. They are combined by OR. The resulting filter will afterwards be ANDed with oPersistentFilter and oSemanticalFilter.
		// The result of this is used to filter the messages.

		// Adds an external filter definition
		// Returns whether filters have been changed synchronously
		function addAnExternalFilterDefinition(vFilterDefinition) {
			if (Array.isArray(vFilterDefinition)) {
				var bRet = false;
				for (var i = 0; i < vFilterDefinition.length; i++) {
					bRet = addAnExternalFilterDefinition(vFilterDefinition[i]) || bRet;
				}
				return bRet;
			}
			if (vFilterDefinition instanceof Promise) {
				vFilterDefinition.then(fnNewFilter);
				return false;
			}
			// vFilterDefinition must in fact be a filter
			aCurrentFilters.push(vFilterDefinition);
			return true;
		}

		function setCurrentFilter(oFilter) {
			oCurrentFilter = oFilter;
			if (oItemBinding) {
				oItemBinding.filter(oCurrentFilter);
			}
		}

		// Adapts the binding for the messages according to the current state of aCurrentFilters
		function fnAdaptBinding() {
			if (bActive) {
				oContextFilter = new Filter({
					filters: aCurrentFilters,
					and: false
				});
				var aPersistentFilters = [oContextFilter, oPersistentFilter];
				if (oTemplateUtils.oServices.oApplication.needsToSuppressTechnicalStateMessages()) {
					aPersistentFilters.push(oSemanticalFilter);
				}
				oCurrentPersistentFilter = new Filter({
					filters: aPersistentFilters,
					and: true
				});
				setCurrentFilter(new Filter({
					filters: [oCurrentPersistentFilter, oLocalValidationFilter],
					and: false
				}));
			}
		}

		// This method is called when a Promise that has been provided by a filter provider is resolved.
		// iCallCount is the value of iCurrentCallCount that was valid when the Promise was provided by the filter provider.
		// Note that the function does nothing when the iCurrentCallCount meanwhile has a different value (i.e. sCurrentBindingPath has meanwhile changed)
		// vFilterDefinition is the FilterDefinition the filter resolves to.
		function fnResolved(iCallCount, vFilterDefinition) {
			if (iCallCount === iCurrentCallCount && addAnExternalFilterDefinition(vFilterDefinition)) {
				fnAdaptBinding(); // adapt the binding after the set of filters has been adapted
			}
		}

		// fnProvider is a filter provider which has been registered via registerMessageFilterProvider.
		// At each time registerMessageFilterProvider must be able to provide a FilterDefinition.
		// A FilterDefinition is either
		// - a filter or
		// - an array of FilterDefinitions or
		// - or a Promise that resolves to a FilterDefinition
		// This function calls fnProvider and ensures that the filter(s) provided by this call are added to aCurrentFilters.
		// In case the filters are provided asynchronously, it is also ensured that the changed filters will be applied afterwards.
		// Returns whether the filters have been changed (synchronously)
		function addFilterFromProviderToCurrentFilter(fnProvider) {
			var oFilterDefinition = fnProvider();
			return addAnExternalFilterDefinition(oFilterDefinition);
		}

		// Ensure that addFilterFromProviderToCurrentFilter is called for all registered filter providers
		function addExternalFiltersToCurrentFilter() {
			aFilterProvider.forEach(addFilterFromProviderToCurrentFilter);
		}

		// adapt the filters to a new binding path
		function adaptToContext(sBindingPath) {
			sCurrentBindingPath = sBindingPath;
			iCurrentCallCount++;
			fnNewFilter = fnResolved.bind(null, iCurrentCallCount);
			var bIsNonDraftCreate = getIsNonDraftCreate();

			// Show messages for current context including all "property children"
			aCurrentFilters = bIsODataBased ? [
				new Filter(bIsNonDraftCreate ? { // in non-draft create mode the binding path does not contain the full path
					path: "target",
					operator: FilterOperator.StartsWith,
					value1: sCurrentBindingPath
				} : {
					path: "aFullTargets", // there may be more than one full target identified for this message. If any of those fits we consider the message as fitting.
					test: function(aFullTargets){
						return aFullTargets.some(function(sFullTarget){
							return sFullTarget.startsWith(sCurrentBindingPath);
						});
					},
					caseSensitive: true
				})
			] : [];
			addExternalFiltersToCurrentFilter(); //Check/add external filters
			fnAdaptBinding();
		}

		// register a new filter provider. In case a binding path alrerady has been set, the new provider is called immediately
		function registerMessageFilterProvider(fnProvider) {
			aFilterProvider.push(fnProvider);
			if (sCurrentBindingPath !== undefined && addFilterFromProviderToCurrentFilter(fnProvider)) {
				fnAdaptBinding();
			}
		}

		var fnShowMessagePopoverImpl;

		function fnShowMessagePopover() { // will be called when Save has failed
			fnShowMessagePopoverImpl = fnShowMessagePopoverImpl || function () {
				if (oItemBinding.getLength() > 0) {
					oMessagePopover.openBy(oMessageButton);
				}
			};
			// Note that this asynchronity not only is used to sort the messages before they are displayed, but also ensures that the MessageButton is rendered.
			setTimeout(function(){
				var oPreparationPromise = getPrepareDisplayPromise();
				oPreparationPromise.then(fnShowMessagePopoverImpl);
			}, 0);
		}

		function setEnabled(bIsActive) {
			bActive = bIsActive;
			if (bIsActive) {
				if (aCurrentFilters) { // adaptToContext has already been called
					fnAdaptBinding();
				}
			} else {
				aCurrentFilters = null;
				setCurrentFilter(oImpossibleFilter);
			}
		}

		function getMessageFilters(bOnlyValidation) {
			return bOnlyValidation ? oLocalValidationFilter : oCurrentFilter;
		}

		function getContextFilter(bIncludePersistenceFilter) {
			return bIncludePersistenceFilter ? oCurrentPersistentFilter : oContextFilter;
		}

		/**
		 * - In non-draft create scenario, Target and FullTarget would be current binding path
		 * - While in non-draft edit scenario, Target would be canonical path created by current binding path context, But fullTarget would be current binding path
		 * @param {*} oModel 
		 * @returns {Object} return target and full target as an Object.
		 */
		function getTargetInfo(oModel) {

			var bIsNonDraftCreate = getIsNonDraftCreate(),
				oContextInfo = !bIsNonDraftCreate && oDataModelHelper.analyseContextPath(sCurrentBindingPath, oModel),
				sTarget = bIsNonDraftCreate ? sCurrentBindingPath : oContextInfo.canonicalPath,
				sFullTarget = sCurrentBindingPath;

			return {
				target: sTarget,
				fullTarget: sFullTarget
			};
		}

		function fnToggleMessagePopover() { // event handler for the (press event of the)  message button
			var oPreparationPromise = oHelperModel.getProperty("/isPopoverOpen") ? Promise.resolve() : getPrepareDisplayPromise();
			oPreparationPromise.then(function(){
				 oMessagePopover.toggle(oMessageButton);
			});
		}

		var mCurrentlyHandledMessages = Object.create(null);
		
		// internal function which is being called before the message popover opens (automatically or because of toggle).
		function getPrepareDisplayPromise(bNoBusy){
			var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
			var mNewMessages = Object.create(null);
			var bHasNewMessage = false;
			var aMessages = oItemBinding.getAllCurrentContexts().map(function(oContext){
				var oMessage = oContext.getObject();
				bHasNewMessage = bHasNewMessage || !mCurrentlyHandledMessages[oMessage.id];
				mNewMessages[oMessage.id] = oMessage;
				return oMessage;	
			});
			mCurrentlyHandledMessages = bHasNewMessage ? mNewMessages : mCurrentlyHandledMessages;	
			var oRet = ((bHasNewMessage && oHost.getPrepareMessageDisplayPromise)) ? oHost.getPrepareMessageDisplayPromise(aMessages, oItemBinding, oHelperModel, sCurrentBindingPath) : Promise.resolve(oCurrentMessageSupportFunctions);
			if (!bNoBusy){
				oTemplateUtils.oServices.oApplication.setNextFocus(Function.prototype);
				oBusyHelper.setBusy(oRet);
			}
			return oRet.then(function(oMessageSupportFunctions){
				oCurrentMessageSupportFunctions = oMessageSupportFunctions;
			});
		}

		function fnRegisterExternalListener(fnListener){
			aItemChangeListeners.push(fnListener);
		}

		return {
			adaptToContext: adaptToContext,
			toggleMessagePopover: fnToggleMessagePopover,
			showMessagePopover: fnShowMessagePopover,
			registerMessageFilterProvider: registerMessageFilterProvider,
			setEnabled: setEnabled,
			getMessageFilters: getMessageFilters,
			getContextFilter: getContextFilter,
			getTargetInfo: getTargetInfo,
			registerExternalListener: fnRegisterExternalListener
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.MessageButtonHelper", {
		constructor: function (oTemplateUtils, oHost, bIsODataBased) {
			extend(this, (testableHelper.testableStatic(getMethods, "MessageButtonHelper"))(oTemplateUtils, oHost, bIsODataBased));
		}
	});
});
