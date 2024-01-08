/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	'sap/ui/mdc/field/content/DefaultContent',
	'sap/ui/mdc/field/content/DateContent',
	'sap/ui/mdc/enums/OperatorName'
], function(DefaultContent, DateContent, OperatorName) {
	"use strict";

	/**
	 * Object-based definition of the time content type that is used in the {@link sap.ui.mdc.field.content.ContentFactory}.
	 * This defines which controls to load and create for a given {@link sap.ui.mdc.enums.ContentMode}.
	 * @namespace
	 * @author SAP SE
	 * @private
	 * @ui5-restricted sap.ui.mdc
	 * @experimental As of version 1.87
	 * @since 1.87
	 * @alias sap.ui.mdc.field.content.TimeContent
	 * @extends sap.ui.mdc.field.content.DateContent
	 */
	const TimeContent = Object.assign({}, DateContent, {
		getEditOperator: function() {
			return {
				[OperatorName.EQ]: { name: "sap/m/TimePicker", create: this._createDatePickerControl }  // as same API as DatePicker
			};
		},
		getEdit: function() {
			return DefaultContent.getEdit.apply(this, arguments);
		},
		createEditMultiLine: function() {
			throw new Error("sap.ui.mdc.field.content.TimeContent - createEditMultiLine not defined!");
		},
		createEdit: function(oContentFactory, aControlClasses, sId) {
			return DefaultContent.createEdit.apply(this, arguments);
		}
	});

	return TimeContent;
});