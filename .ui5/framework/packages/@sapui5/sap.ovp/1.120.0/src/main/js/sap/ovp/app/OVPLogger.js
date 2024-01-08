/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 * Fiori Element logger which prefix Fiori Elements for the log along with component
 */
/* eslint-disable no-alert */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/Log"
], function (BaseObject, Log) {

	"use strict";
	
	var sFioriComponent = "FioriElements: ";
	return BaseObject.extend("sap.ui.base.Log", {
		constructor: function (sComponent) {
			return Log.getLogger(sFioriComponent + sComponent);
		}
	});
});

