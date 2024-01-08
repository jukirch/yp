/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"s330601/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
