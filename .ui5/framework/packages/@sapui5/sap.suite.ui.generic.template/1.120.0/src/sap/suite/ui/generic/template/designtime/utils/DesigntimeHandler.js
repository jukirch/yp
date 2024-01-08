sap.ui.define(["sap/ui/base/Object", "sap/base/util/extend"
	], function(BaseObject, extend) {
		"use strict";

	/*
	 *   This is a helper class for sap.suite.ui.generic.template.lib.AppComponent. It is used to handle situatiojn when RTA is started resp. stopped.
	 *   AppComponent will propagate this information via methods start(), resp. stop().
	 *   Note that starting RTA can be done in two possible ways:
	 *   a) RTA is started (and stopped) within the running app
	 *   b) App is restarted when user switches to RTA and again when he leaves it
	 *   
	 */
	function getMethods(oTemplateContract) {
		
		var bWithRestart;
		
		function fnStart(bAppIsRestarted){
			if (oTemplateContract.bStateHandlingSuspended){
				return;
			}
			bWithRestart = bAppIsRestarted;
			if (!bWithRestart){
				oTemplateContract.oApplicationProxy.setStates(true);                        
			}
			oTemplateContract.bStateHandlingSuspended = true;
		}
		
		function fnStop(){
			oTemplateContract.bStateHandlingSuspended = false;
			if (!bWithRestart){
				oTemplateContract.oApplicationProxy.setStates(false);                        
			}			
		}

		return {
			start: fnStart,
			stop: fnStop
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.designtime.utils.DesigntimeHandler", {
		constructor: function(oTemplateContract) {
			extend(this, getMethods(oTemplateContract));
		}
	});
});
