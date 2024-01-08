sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "calculator/modules/Calculator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, Calculator) {
        "use strict";

        

            return Controller.extend("calculator.controller.Calculator", {
                onCalculatePress: function () {
                    var inputOperand1 = this.getView(Calculator).byId("").getValue();
                    var inputOperand2 = this.getView().byId("inputOperand2").getValue();
                    var operator = this.getView().byId("operatorSelect").getSelectedItem().getKey();
        
                    // Führen Sie Ihre Berechnung durch
                    var Ergebnis = Calculator.Ergebnis(parseFloat(inputOperand1), parseFloat(inputOperand2), operator);
        
                    // Zeigen Sie das Ergebnis an oder handhaben Sie Fehler
                    if (!isNaN(Ergebnis)) {
                        sap.m.MessageToast.show(Calculator.label + Ergebnis, { duration: 1000 });
                    } else {
                        sap.m.MessageBox.error("Fehler bei der Berechnung");
                    }
                }

        });
    });