sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("s330601.controller.Main", {
            onInit: function() {

            };
            onPress: function() {
                alert("hello World");
            }
        });
    });
