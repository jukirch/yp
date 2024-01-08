sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment"
],
    function (Controller, Fragment) {
        "use strict";

        return Controller.extend("s330601.controller.DemoFragment", {

            _oDialog: null,

            onInit: function () {
                var oModel = new sap.ui.model.json.JSONModel({ "output": "Text aus Fragment-Controller-Modell" });
                this.getView().setModel(oModel);
            },

            onPress: function () {
                var that = this;

				if (!this._oDialog) {
					Fragment.load({
						name: "s330601.view.DemoDialog",
						type: "XML",
						controller: this
					}).then(function(oDialog) {
						that._oDialog = oDialog;
						that._oDialog.open();
					});
				} else {
					this._oDialog.open();
				}
		    },
            
            onClose: function() {
                this._oDialog.close();
            }
        });
    });