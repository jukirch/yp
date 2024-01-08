/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * Initialization Code and shared classes of library sap.ovp (1.120.0)
 */
sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/library", // library dependency
	"sap/ui/layout/library", // library dependency
	"sap/m/library", // library dependency
	"sap/f/library", // library dependency
	"sap/ui/comp/library", // library dependency
	"sap/ui/rta/library",
	"sap/suite/ui/microchart/library",
	"sap/viz/library",
	"sap/fe/placeholder/library",
	"sap/fe/macros/library",
	"sap/insights/library",
	"sap/suite/ui/commons/library"
], function (
	Core
) {
	"use strict";
	
	/**
	 * SAP library: sap.ovp
	 *
	 * @namespace
	 * @alias sap.ovp
	 * @public
	 */
	var ovpLib = Core.initLibrary({
		name: "sap.ovp",
		dependencies: [
			"sap.ui.core",
			"sap.ui.layout",
			"sap.m",
			"sap.f",
			"sap.ui.comp",
			"sap.ui.rta",
			"sap.suite.ui.microchart",
			"sap.viz",
			"sap.fe.placeholder",
			"sap.fe.macros",
			"sap.insights",
			"sap.suite.ui.commons"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.120.0",
		extensions: {
			flChangeHandlers: {
				"sap.ovp.ui.EasyScanLayout": "sap/ovp/flexibility/EasyScanLayout",
				"sap.ovp.ui.DashboardLayout": "sap/ovp/flexibility/DashboardLayout"
			},
			"sap.ui.support": {
				diagnosticPlugins: ["sap/ovp/support/DiagnosticsTool/DiagnosticsTool"]
			}
		}
	});

	return ovpLib;
});
