/*global QUnit*/

sap.ui.define([
	"s321401/controller/Main_1401.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Main_1401 Controller");

	QUnit.test("I should test the Main_1401 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
