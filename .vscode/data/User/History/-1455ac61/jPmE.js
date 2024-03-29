sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("s330601.controller.Main", {

            _oDialog: null,

            onInit: function () {
                var oModel = new sap.ui.model.json.JSONModel({ "output": "Text aus Main-Controller-Modell" });
                this.getView().setModel(oModel);
            },

            onPress: function () {
                var that = this;

				if (!this._oDialog) {
					Fragment.load({
						name: "qstS33-07-02_Demo.view.DemoDialog",
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
