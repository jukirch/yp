/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/dt/Plugin"
], function(
	Plugin
) {
	"use strict";

	/**
	 * Constructor for a new ToolHooks Plugin.
	 *
	 * @extends sap.ui.dt.Plugin
	 * @author SAP SE
	 * @version 1.120.1
	 * @constructor
	 * @private
	 * @since 1.61
	 * @alias sap.ui.dt.plugin.ToolHooks
	 */
	var ToolHooks = Plugin.extend("sap.ui.dt.plugin.ToolHooks", /** @lends sap.ui.dt.plugin.ToolHooks.prototype */ {
		metadata: {
			library: "sap.ui.dt",
			properties: {},
			associations: {},
			events: {}
		}
	});

	/**
	 * Calls a hook function in designtime
	 *
	 * @param {sap.ui.dt.Overlay} oOverlay overlay object
	 * @override
	 */
	ToolHooks.prototype.registerElementOverlay = function(oOverlay) {
		oOverlay.getDesignTimeMetadata().getToolHooks().start(oOverlay.getElement());
	};

	/**
	 * Calls a hook function in designtime
	 * @param  {sap.ui.dt.Overlay} oOverlay overlay object
	 * @override
	 */
	ToolHooks.prototype.deregisterElementOverlay = function(oOverlay) {
		oOverlay.getDesignTimeMetadata().getToolHooks().stop(oOverlay.getElement());
	};

	return ToolHooks;
});