/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
// Provides the design time metadata for the sap.suite.ui.generic.template.AnalyticalListPage component

sap.ui.define(["sap/suite/ui/generic/template/designtime/utils/designtimeHelper", "sap/base/util/deepExtend"],
	function (designtimeHelper, deepExtend) {
		"use strict";

		// definiton of changes we want to allow. Structure/granularity to be clarified		
		var mAllow = {};
		// allow list for designtime adaptation / level-0.  
		var mAllowLevel0 = {
				"sap.f.DynamicPage": {
					properties: ["headerExpanded", "preserveHeaderStateOnScroll"]
				},
				"sap.ui.comp.smartvariants.SmartVariantManagement": {
					properties: ["showExecuteOnSelection", "showSetAsDefault", "showShare"]
				},
				"sap.ui.comp.smartchart.SmartChart": {
					properties: ["ignoredChartTypes", "selectionMode", "noData", "showChartTooltip", "showChartTypeSelectionButton", "showDownloadButton", "showLegendButton"]
				},
				"sap.ui.comp.smarttable.SmartTable": {
					properties: ["useExportToExcel", "showRowCount", "exportType", "fitContainer", "showTablePersonalisation"],
					actions: ["settings"]
				},
				"sap.ui.table.AnalyticalColumn": {
					properties: ["visible", "width", "autoResizable", "inResult", "resizable", "showSortMenuEntry", "sortOrder", "sorted", "summed"]
				},
				"sap.m.OverflowToolbar": {					// meant for table toolbar and footer bar
					properties: ["visible"]
				},
				"sap.m.Button": {								// all properties meant for any button on the adapt filters dialog, "visible" also for drill down button in chart toolbar
					actions: ["combine"],
					properties: ["visible", "width", "icon", "activeIcon", "type", "text", "busy", "enabled", "blocked", "tooltip"]
				},
				"sap.m.OverflowToolbarButton": {			// visible meant for share button, clear button of SFB (to be checked), clear button (to be checked), icon meant for chart personalization
					properties: ["visible", "icon", "activeIcon", "type", "tooltip"]
				},
				"sap.ui.comp.smartfilterbar.SmartFilterBar": {
					properties: ["liveMode", "showClearOnFB", "showFilterConfiguration", "showRestoreOnFB"]
				},
				"sap.m.Table": {
					properties: ["growingThreshold"]
				},
				"sap.m.Column": {
					properties: ["width", "hAlign"]
				},
				"sap.ui.table.Column": {
					properties: ["width", "hAlign"]
				}
			};
		
		// grey list for designtime adaptation / level-0 (no technical difference too allow list, separated just for documentation  
		var mGreyLevel0 = {
				"sap.suite.ui.generic.template.AnalyticalListPage.control.smartfilterbarext:SmartFilterBarExt": {
					properties: ["useDateRangeType"]
				},
				"sap.ui.table.AnalyticalTable": {
					properties: ["selectionMode", "minAutoRowCount", "visibleRowCountMode"]
				},
				"sap.ui.table.AnalyticalColumn": {
					properties: ["width", "minWidth"]
				},
				"sap.ui.comp.smartchart.SmartChart": {
					properties: ["header", "useTooltip"]
				}
		};
		
		// allow list for key user adaptation. 
		var mAllowKeyUser = {
			"sap.m.MenuButton": { // used for create and create with filters and possibly created by combining of buttons
				actions: ["split", "rename", "remove"]
			},	
			"sap.m.Button": {
				actions: ["remove", "reveal", "rename"]
			},
			"sap.m.Toolbar": {
				actions: ["moveControls"]
			},
			"sap.ui.comp.smartvariants.SmartVariantManagement": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smartfilterbar.SmartFilterBar": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smarttable.SmartTable": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			},
			"sap.ui.comp.smartchart.SmartChart": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			},
			"sap.m.IconTabFilter": {
				actions: ["rename"]
			}
		};
		
		// allow list for variant management: All changes done here are stored with a variant, and only applied when that variant is selected.
		// this mode is indicated by url parameter fiori-tools-rta-mode=true
		var mAllowVariantManagement = {
			"sap.ui.comp.smartvariants.SmartVariantManagement": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smartfilterbar.SmartFilterBar": {
				actions: ["compVariant"]		// allows to adapt filters (same as adapt filters for end user)
			},
			"sap.ui.comp.smarttable.SmartTable": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			},
			"sap.ui.comp.smartchart.SmartChart": {
				actions: ["compVariant"]		// allows table personalization (same as for end user)
			},
			"sap.ui.comp.navpopover.SmartLink" : {
				actions: ["settings"]
			}
		};
		// there's no reliable way to differentiate designtime adaptation and key user adaptation. However
		// - property changes are possible only in designtime adaptation
		// - for any other changes (using change handlers), we anyway need to be prepared for the change if it is allowed in one mode, so it shouldn't matter if it's also possible in the other mode
		if (designtimeHelper.getRtaModeValue("fiori-tools-rta-mode") === "true") {
			mAllow = mAllowVariantManagement;
		} else {
			mAllow = designtimeHelper.getMergedAllowList([mAllowLevel0, mGreyLevel0, mAllowKeyUser]);
		}

		return designtimeHelper.getViewDesignTime(mAllow);
		
});
		
