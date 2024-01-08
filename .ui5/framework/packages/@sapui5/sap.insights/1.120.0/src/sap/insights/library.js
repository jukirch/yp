/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/**
 * Initialization Code and shared classes of library sap.insights.
 */
sap.ui.define([
	"sap/ui/core/Lib",
	"sap/ui/core/library" // library dependency
], function (CoreLib) {
	"use strict";

	/**
	 * SAP UI library: sap.insights
	 *
	 * @namespace
	 * @alias sap.insights
	 * @public
	 */

	var oLibrary = CoreLib.init({
		name: "sap.insights",
		dependencies: [
			"sap.m",
			"sap.f",
			"sap.ui.core",
			"sap.ushell"
		],
		types: [],
		interfaces: [],
		controls: [
			"sap.insights.ManageCards"
		],
		elements: [],
		version: "1.120.0",
		extensions: {}
	});

	return oLibrary;
});