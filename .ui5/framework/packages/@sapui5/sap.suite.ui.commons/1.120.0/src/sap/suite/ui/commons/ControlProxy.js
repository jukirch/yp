sap.ui.define([
	"./library",
	"sap/ui/core/Control",
	"sap/ui/core/Core"
], function(library, Control, Core) {
	"use strict";

	/**
	 * Class for rendering associated control
	 * @private
	 */
	var ControlProxy = Control.extend("sap.suite.ui.commons.ControlProxy", {
		metadata: {
			library: "sap.suite.ui.commons",
			association: {
				/**
				 * Holds the items included in the variable.
				 */
				control: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			}
		},
		renderer: function (oRm, oProxy) {
			var sItem = oProxy.getAssociation("control"),
				oItem = Core.byId(sItem);

			oRm.renderControl(oItem);
		}
	});

	ControlProxy.prototype.setAssociation = function(sAssociation, oControl) {
		Control.prototype.setAssociation.apply(this, arguments);

		var sItem = this.getAssociation("control"),
			oItem = Core.byId(sItem);

		if (oItem && Array.isArray(this.aCustomStyleClasses)) {
			this.aCustomStyleClasses.forEach(function(sClass) {
				oItem.addStyleClass(sClass);
			});
		}
	};

	ControlProxy.prototype.addStyleClass = function(sClass) {
		Control.prototype.addStyleClass.apply(this, arguments);

		var sItem = this.getAssociation("control"),
			oItem = Core.byId(sItem);

		if (oItem) {
			oItem.addStyleClass(sClass);
		}
	};



	return ControlProxy;

});
