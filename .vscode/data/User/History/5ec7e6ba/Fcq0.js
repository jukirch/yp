sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "calculator/modules/Calculator"
], function (Controller, MessageToast, MessageBox, Calculator) {
    "use strict";
    return Controller.extend("calculator.controller.Calculator", {

        onCalculatePress: function () {

            var inputOperand1 = parseFloat(this.byId("inputOperand1").getValue());
            var inputOperand2 = parseFloat(this.byId("inputOperand2").getValue());
            var operator = this.byId("operatorSelect").getSelectedItem().getKey();
            if (inputOperand1 !== null && inputOperand2 !== null) {
                var result = Calculator.calculate(inputOperand1, inputOperand2, operator);
            } else {
                MessageBox.error("Bitte Eingaben überprüfen!");
            }
            try {
                
                if (isNaN(result)) {
                    
                } else {
                    
                }
                
            } catch (error) {
                sap.m.MessageBox.alert(error.message);
            }
        }
    });
});
