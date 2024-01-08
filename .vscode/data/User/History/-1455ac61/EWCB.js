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
                var oDialog = sap.ui.fragment("s330601.view.DemoDialog", "XML", this);
                _oDialog.open();
            },
            onClose: function() {
                _oDialog.close();
            }
        });
    });
