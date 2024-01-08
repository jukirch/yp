/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"./Adaptation"
],
function(
	Adaptation
) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.rta.toolbar.Standalone control
	 *
	 * @class
	 * Contains implementation of Standalone toolbar
	 * @extends sap.ui.rta.toolbar.Adaptation
	 *
	 * @author SAP SE
	 * @version 1.120.1
	 *
	 * @constructor
	 * @private
	 * @since 1.48
	 * @alias sap.ui.rta.toolbar.Standalone
	 */
	var Standalone = Adaptation.extend("sap.ui.rta.toolbar.Standalone", {
		metadata: {
			library: "sap.ui.rta"
		},
		renderer: "sap.ui.rta.toolbar.AdaptationRenderer",
		type: "standalone"
	});

	return Standalone;
});
