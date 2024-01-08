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
                oFragController.init(this);
                var oFragment = sap.ui.xmlfragment("s330601.view.DemoFragment", oFragController);
                this.getView().byId("page").insertContent(oFragment);

                var oFragController2 = sap.ui.controller("s330601.controller.DemoFragment");
                oFragController2.init(this);
                var oFragment2 = sap.ui.xmlfragment("s330601.view.DemoFragment", oFragController);
                this.getView().byId("page").insertContent(oFragment2);
            },
           
            onClose: function() {
                this._oDialog.close();
            }
        });
    });