/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/rta/command/FlexCommand"
], function(
	FlexCommand
) {
	"use strict";

	/**
	 * Combine fields
	 *
	 * @class
	 * @extends sap.ui.rta.command.FlexCommand
	 * @author SAP SE
	 * @version 1.120.1
	 * @constructor
	 * @private
	 * @since 1.46
	 * @alias sap.ui.rta.command.Combine
	 */
	var Combine = FlexCommand.extend("sap.ui.rta.command.Combine", {
		metadata: {
			library: "sap.ui.rta",
			properties: {
				newElementId: {
					type: "string"
				},
				source: {
					type: "any"
				},
				combineElements: {
					type: "any[]"
				}
			},
			associations: {},
			events: {}
		}
	});

	/**
	 * @override
	 */
	Combine.prototype._getChangeSpecificData = function() {
		var aFieldIds = [];
		this.getCombineElements().forEach(function(oField) {
			aFieldIds.push(oField.getId());
		});
		var mSpecificInfo = {
			newElementId: this.getNewElementId(),
			changeType: this.getChangeType(),
			sourceControlId: this.getSource().getId(),
			combineElementIds: aFieldIds
		};
		return mSpecificInfo;
	};

	return Combine;
});
