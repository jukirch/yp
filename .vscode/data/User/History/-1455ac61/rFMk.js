sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment"
],
    function (Controller, Fragment) {
        "use strict";

        return Controller.extend("s330601.controller.Main", {

            _oDialog: null,

            onInit: function () {
                var oModel = new sap.ui.model.json.JSONModel({ "output": "Text aus Main-Controller-Modell" });
                this.getView().setModel(oModel);

                // Fragment Controller Initialisieren..
                var oFragController = sap.ui.controller("s330601.controller.DemoFragment");
                oFragController.init();
                var oFragment = sap.ui.xmlfragment("s330601.view.DemoFragment", oFragController);
                this.getView().byId("page").insertContent(oFragment);
            },

            /* onPress: function () {
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
		    }, */
            
            onClose: function() {
                this._oDialog.close();
            }
        });
    });