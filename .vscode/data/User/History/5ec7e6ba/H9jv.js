sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("calculator.controller.Calculator", {
        onCalculatePress: function () {
            var inputOperand1 = parseFloat(this.byId("inputOperand1").getValue());
            var inputOperand2 = parseFloat(this.byId("inputOperand2").getValue());
            var operator = this.byId("operatorSelect").getSelectedItem().getKey();

            try {
                var result = Calculator.calculate(inputOperand1, inputOperand2, operator);
                MessageToast.show("Ergebnis: " + result, { duration: 1000 });
            } catch (error) {
                MessageBox.error(error.message);
            }
        }
    });
});
