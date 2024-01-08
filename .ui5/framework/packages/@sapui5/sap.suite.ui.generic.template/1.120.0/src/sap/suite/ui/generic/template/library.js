/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/**
 * @namespace reserved for Smart Templates
 * @name sap.suite.ui.generic.template
 * @public
 */

/**
 * Initialization Code and shared classes of library sap.suite.ui.generic.template.
 */
sap.ui.define([
	'sap/ui/core/Lib',
	// library dependencies
	"sap/f/library",
	"sap/fe/placeholder/library",
	"sap/insights/library",
	"sap/m/library",
	"sap/suite/ui/microchart/library",
	"sap/ui/comp/library",
	"sap/ui/core/library",
	"sap/ui/fl/library",
	"sap/ui/generic/app/library",
	"sap/ui/rta/library",
	"sap/ushell/library"
], function(Library) {
	"use strict";

	/**
	 * Library with generic Suite UI templates.
	 *
	 * @namespace
	 * @alias sap.suite.ui.generic.template
	 * @public
	 */

	// library dependencies
	// delegate further initialization of this library to the core framework
	var thisLib = Library.init({
		name: "sap.suite.ui.generic.template",
		dependencies: [
			"sap.f",
			"sap.fe.placeholder",
			"sap.insights",
			"sap.m",
			"sap.suite.ui.microchart",
			"sap.ui.comp",
			"sap.ui.core",
			"sap.ui.fl",
			"sap.ui.generic.app",
			"sap.ui.rta",
			"sap.ushell"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.120.0",
		extensions: {
			//Configuration used for rule loading of Support Assistant
			"sap.ui.support": {
				publicRules: true,
				internalRules: false,
				diagnosticPlugins: [
					"sap/suite/ui/generic/template/support/DiagnosticsTool/DiagnosticsTool"
				]
			}
		}
	});

	/**
	 * A static enumeration type which indicates the mode of targeted page while using navigateInternal extensionAPI
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	thisLib.displayMode = {
		
		/**
		 * Navigating with a mode which is not yet decided (fallback condition)
		 * @public
		 */
		undefined : "undefined",
		
		/**
		 * Navigating in read-only mode
		 * @public
		 */
		display : "display",

		/**
		 * Navigating in draft mode
		 * @public
		 */
		edit : "edit",

		/**
		 * Navigating in create mode
		 * @public
		 */
		create : "create"
	};

	return thisLib;

}, /* bExport= */false);
