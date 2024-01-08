/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/model/base/ManagedObjectModel"
], function(
	Element,
	ManagedObjectModel
) {
	"use strict";

	function capitalize(sName) {
		return sName.charAt(0).toUpperCase() + sName.slice(1);
	}

	/**
	 * Constructor for a new sap.ui.fl.util.ManagedObjectModel
	 *
	 * @class
	 * ManagedObjectModel
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.120.1
	 *
	 * @constructor
	 * @private
	 * @since 1.64
	 * @alias sap.ui.fl.util.ManagedObjectModel
	 */
	var ManagedObjectModelFantomas = Element.extend("sap.ui.fl.util.ManagedObjectModel", {
		metadata: {
			library: "sap.ui.fl",
			properties: {
				/**
				 * Proxy object for oData parameter of ManagedObjectModel
				 * @see sap.ui.model.base.ManagedObjectModel
				 */
				data: {
					type: "object"
				},

				/**
				 * Model name. Used to set/remove the model on the target object.
				 */
				name: {
					type: "string",
					defaultValue: "$sap.ui.fl.ManagedObjectModel"
				}
			},
			associations: {
				object: {
					// Should be an element, because only elements have a `dependents` aggregation to store the object.
					type: "sap.ui.core.Element"
				}
			}
		},
		// eslint-disable-next-line object-shorthand
		constructor: function(...aArgs) {
			Element.apply(this, aArgs);

			this._oManagedObjectModel = new ManagedObjectModel(
				Element.getElementById(this.getObject()),
				this.getData()
			);

			["data", "name", "object"].forEach(function(sName) {
				this[`set${capitalize(sName)}`] = function() {
					throw new Error(`sap.ui.fl.util.ManagedObjectModel: Can't change the value of \`${sName}\` after the object is `
						+ `initialized. Please recreate the object with correct values in the constructor.`);
				};
			}, this);
		}
	});

	ManagedObjectModelFantomas.prototype.setParent = function(...aArgs) {
		const [oNewParent] = aArgs;
		const oOldParent = this.getParent();

		if (oOldParent) {
			oOldParent.setModel(null, this.getName());
		}

		if (oNewParent) {
			oNewParent.setModel(this._oManagedObjectModel, this.getName());
		}

		Element.prototype.setParent.apply(this, aArgs);
	};

	ManagedObjectModelFantomas.prototype.exit = function() {
		this._oManagedObjectModel.destroy();
	};

	return ManagedObjectModelFantomas;
});