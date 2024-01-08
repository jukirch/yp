/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.ProgressIndicator.
sap.ui.define([
	"sap/m/ProgressIndicator",
	"./ProgressIndicatorRenderer"
], function(
	MobileProgressIndicator,
	ProgressIndicatorRenderer
) {
	"use strict";

	/**
	 * Constructor for a new ProgressIndicator.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Shows the progress of a process in a graphical way. To indicate the progress, the inside of the ProgressIndicator is filled with a color.
	 * Additionally, a user-defined string can be displayed on the ProgressIndicator.
	 * @extends sap.m.ProgressIndicator
	 *
	 * @author SAP SE
	 * @version 1.120.0
	 *
	 * @constructor
	 * @public
	 * @since 1.50.0
	 * @alias sap.ui.vk.ProgressIndicator
	 * @deprecated Since version 1.114.0. Use {@link sap.m.ProgressIndicator} instead.
	 */
	var ProgressIndicator = MobileProgressIndicator.extend("sap.ui.vk.ProgressIndicator");

	return ProgressIndicator;

});
