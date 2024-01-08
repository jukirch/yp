sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/extend",
	"sap/suite/ui/generic/template/lib/ContextMenuHandler"
], function(BaseObject, extend, ContextMenuHandler) {
	"use strict";

	function getMethods(oController, oTemplateUtils, oCallbacks) {
		// Begin: Instance variables
		var mGenericCtxMenuHandlers = Object.create(null);
		
		function fnExecuteAction(sSmartControlId, oFocusInfo, oToolbarControlData, oButton){
			if (oToolbarControlData.RecordType === "CRUDActionDelete"){
				var oSmartControl = oController.byId(sSmartControlId);
				oCallbacks.deleteEntries(oSmartControl, oFocusInfo.applicableContexts);
			} else if (oToolbarControlData.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation"){
				var oButtonCustomData = oButton.data();
				oTemplateUtils.oCommonEventHandlers.onDataFieldForIntentBasedNavigationSelectedContext(oButtonCustomData, oFocusInfo.applicableContexts);
			} else if (oToolbarControlData.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForAction"){
				var oSmartControl = oController.byId(sSmartControlId);
				var oButtonCustomData = oButton.data();
				oTemplateUtils.oCommonEventHandlers.onCallActionFromToolBarForContexts(oSmartControl, oSmartControl.getTable(), oButtonCustomData, oFocusInfo.applicableContexts, null, oSmartControl.getEntitySet(), true);
			}
		}
		
		function getGenericHandler(sSmartControlId){
			var oRet = mGenericCtxMenuHandlers[sSmartControlId];
			if (!oRet){
				var oSmartControl = oController.byId(sSmartControlId);
				var oConfiguration = {
					executeAction: fnExecuteAction.bind(null, sSmartControlId)
				};
				oRet = new ContextMenuHandler(oController, oTemplateUtils, oSmartControl, oConfiguration);
				mGenericCtxMenuHandlers[sSmartControlId] = oRet;
			}
			return oRet;
		}
		
		function fnBeforeOpenContextMenu(oEvent, sSmartControlId){
			var oGenericHandler = getGenericHandler(sSmartControlId);
			oGenericHandler.beforeOpenContextMenu(oEvent);
		}
		
		function onContextMenu(oEvent, sSmartControlId){
			var oGenericHandler = getGenericHandler(sSmartControlId);
			oGenericHandler.onContextMenu(oEvent);
		}

		// public instance methods
		return {
			beforeOpenContextMenu: fnBeforeOpenContextMenu,
			onContextMenu: onContextMenu
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.ObjectPage.controller.CtxMenuHandler", {
		constructor: function(oController, oTemplateUtils, oCallbacks) {
			extend(this, getMethods(oController, oTemplateUtils, oCallbacks));
		}
	});
});
