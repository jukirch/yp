sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("s331102.controller.Main", {
            onInit: function () {

            },
            onValueChange: function(){
                var model = this.getOwnerComponent().getModel("northWind");
                model.submitChanged({
                    sucess: function() {
                        MessageToast.show("Das hat geklappt.");
                    }
                });

            }
        });
    });
