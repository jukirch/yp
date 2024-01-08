sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/genericUtilities/controlHelper"
], function(BaseObject, extend, controlHelper) {
	"use strict";

	/* This class provides generic functionality for handling of the context menu for one smart control (oSourceControl).
	 * Note that this is currently restricted to the case that oSourceControl is a table.
	 * oConfiguration is an object which contains logic which is specific to the floorplan using this functionality.
     */
	function getMethods(oController, oTemplateUtils, oSourceControl, oConfiguration) {

		var oView = oController.getView();
		var oTemplatePrivateModel = oView.getModel("_templPriv");

		// reserve a place in the template private model which can be used to determine the content of the context menu in a declarative way.
		// The corresponding entries are evaluated in .fragments.SmartControlContextMenu fragment.
		var sModelPathPrefix = "/generic/controlProperties/" + oView.getLocalId(oSourceControl.getId());
		if (!oTemplatePrivateModel.getProperty(sModelPathPrefix)){
			oTemplatePrivateModel.setProperty(sModelPathPrefix, {});
		}
		var sModelPath = sModelPathPrefix + "/contextMenu";
		var sItemsPath = sModelPath + "/items";
		oTemplatePrivateModel.setProperty(sModelPath, {
			items: []
		});

		var oPresentationControlHandler = oTemplateUtils.oServices.oPresentationControlHandlerFactory.getPresentationControlHandler(oSourceControl);
		var bNavigationSupported = oTemplateUtils.oComponentUtils.canNavigateToSubEntitySet(oSourceControl.getEntitySet());
		var mHandlers; // maps keys of context menu entries to handler functions for the corresponding entry
		var iCreatedMenuItemsCounter = 0; // increased whenever a new MenuItem is being created In fnAddMenuItem). Used to generate a key for mHandlers.

		// add meta data of a menu item to the list of items (aItems).
		// sText and sIcon represent the text and the icon of the menu entry.
		// bStartsSection is a boolean telling whether the entry starts a new section with the menu (will be ignored for the first entry of aItems).
		// oHandlerPromise is optional. If faulty the corresponding menu item will never be resolved.
		function fnAddMenuItem(sPathToItems, aItems, sText, sIcon, bStartsSection, oHandlerPromise){
			iCreatedMenuItemsCounter++;
			var sKey = "ContextMenuKey" + iCreatedMenuItemsCounter;
			if (oHandlerPromise){
				var iPosition = aItems.length;
				oHandlerPromise.then(function(fnHandler){ 
					if (fnHandler){
						mHandlers[sKey] = fnHandler;
						oTemplatePrivateModel.setProperty(sPathToItems + "/" + iPosition + "/enabled", true);
					}
				});
			}
			bStartsSection = bStartsSection && aItems.length > 0;
			aItems.push({
				text: sText,
				icon: sIcon,
				key: sKey,
				enabled: false,
				startsSection: bStartsSection
			});
		}

		var fnAddMainMenuItem = fnAddMenuItem.bind(null, sItemsPath);

		function getHandlePromiseForAction(oFocusInfo, oToolbarControlData, oButton){
			var getHandler = function(bEnabled){
				return bEnabled && oConfiguration.executeAction.bind(null, oFocusInfo, oToolbarControlData, oButton);
			};
			var oEnablementInfo = oTemplateUtils.oCommonUtils.getToolbarActionEnablementInfo(oToolbarControlData, oFocusInfo.applicableContexts, oSourceControl);
			if (oEnablementInfo.enabledPromise){
				return oEnablementInfo.enabledPromise.then(getHandler);
			}
			return Promise.resolve(getHandler(oEnablementInfo.enabled));
		}

		function fnAddToolbarButtonToContextMenu(sPathToItems, oFocusInfo, aToolbarControlsData, aItems, oButton, bStartsNewSection){
			var sButtonId = oView.getLocalId(oButton.getId());
			var oToolbarControlData = aToolbarControlsData.find(function(oControlData){
				return oControlData.ID === sButtonId;
			});
			var oHandlePromise = oToolbarControlData ? getHandlePromiseForAction(oFocusInfo, oToolbarControlData, oButton) : null;
			if (oHandlePromise){
				fnAddMenuItem(sPathToItems, aItems, oButton.getText(), oButton.getIcon(), bStartsNewSection, oHandlePromise);
				return true;
			}
			return false;
		}

		function fnAddToolbarButtonsToContextMenu(oFocusInfo, aItems){
			var aToolbarControlsData = oTemplateUtils.oCommonUtils.getToolbarCustomData(oSourceControl);
			var oToolbar = oSourceControl.getToolbar();
			var aToolbarContent = oToolbar.getContent();
			var bFirst = true;
			aToolbarContent.forEach(function(oToolbarEntry){
				if (!(oToolbarEntry.getVisible && oToolbarEntry.getVisible())) {
					return;
				}			
				if (controlHelper.isButton(oToolbarEntry)){
					bFirst = !fnAddToolbarButtonToContextMenu(sItemsPath, oFocusInfo, aToolbarControlsData, aItems, oToolbarEntry, bFirst) && bFirst;
				}
			});
		}
/*
		function fnAddInlineActionsToContextMenu(oFocusInfo, aItems){
			if (oFocusInfo.applicableContexts.length !== 1){
				return;
			}
			var oSelectedContext = oFocusInfo.applicableContexts[0];
			var oTableRow = oPresentationControlHandler.getRowForContext(oSelectedContext);
			if (oTableRow){
				//var bIsFirst = true;
				controlHelper.searchInTree(oTableRow, function(oRowEntry){
					return false;
					if (controlHelper.isButton(oRowEntry)){
						oHandlerPromise = Promise.resolve(oRowEntry.getEnabled() && function(){
						
						});
						fnAddMainMenuItem(aItems, oRowEntry.getText(), oRowEntry.getIcon(), bIsFirst, oHandlerPromise);
						bIsFirst = false;
						return false;
					}
				});			
			}

		} */

		// iExpadMode: 0 = no expad, 1 = in new tab, 2 = in new window
		function fnNavigateToContext(oTargetContext, iExpadMode){

		}


		function getNavigationOptions(oFocusInfo){
			var oRet = {};
			if (!bNavigationSupported || oFocusInfo.applicableContexts.length !== 1){
				return oRet;
			}
			var oSelectedContext = oFocusInfo.applicableContexts[0];
			oRet.openForEdit = oConfiguration.getOpenForEdit && oConfiguration.getOpenForEdit(oSelectedContext);
			if (oRet.openForEdit){ // currently we assume that the options open for edit and open are exclusive
				return oRet;
			}
			oRet.open = fnNavigateToContext.bind(null, oSelectedContext, 0);
			var oDraftInfo = oTemplateUtils.oServices.oApplication.getDraftInfoForContext(oSelectedContext);
			oRet.openExpad = !oDraftInfo.bIsDraft && fnNavigateToContext.bind(null, oSelectedContext);
			return oRet;
		}

		function getContextMenuItems(oEvent){
			var oFocusInfo = oPresentationControlHandler.getFocusInfoForContextMenuEvent(oEvent);
			mHandlers = Object.create(null);
			var aRet = [];
			fnAddToolbarButtonsToContextMenu(oFocusInfo, aRet);
			// fnAddInlineActionsToContextMenu(oFocusInfo, aRet);
			var oNavigationOptions = getNavigationOptions(oFocusInfo);
			if (oNavigationOptions.openExpad1){ // temp
				fnAddMainMenuItem(aRet, oTemplateUtils.oCommonUtils.getText("ST_OPEN_NEW_TAB"), null, true, Promise.resolve(oNavigationOptions.openExpad.bind(null, 1)));
				fnAddMainMenuItem(aRet, oTemplateUtils.oCommonUtils.getText("ST_OPEN_NEW_WINDOW"), null, false, Promise.resolve(oNavigationOptions.openExpad.bind(null, 2)));
			}			
			return aRet;
		}

		function fnBeforeOpenContextMenu(oEvent){
			var aContextMenuItems = getContextMenuItems(oEvent);
			oTemplatePrivateModel.setProperty(sModelPath + "/items", aContextMenuItems);
			if (aContextMenuItems.length === 0) {
				oEvent.preventDefault();
			}			
		}

		function onContextMenu(oEvent){
			var sKey = oEvent.getSource().getKey();
			var fnHandler = mHandlers[sKey];
			fnHandler();
		}

		// public instance methods
		return {
			beforeOpenContextMenu: fnBeforeOpenContextMenu,
			onContextMenu: onContextMenu
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.ContextMenuHandler", {
		constructor: function(oController, oTemplateUtils, oSourceControl, oConfiguration) {
			extend(this, getMethods(oController, oTemplateUtils, oSourceControl, oConfiguration));
		}
	});
});
