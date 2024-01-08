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
            var result;

            switch (operator) {
                case "+":
                    result = inputOperand1 + inputOperand2;
                    break;
                case "-":
                    result = inputOperand1 - inputOperand2;
                    break;
                case "*":
                    result = inputOperand1 * inputOperand2;
                    break;
                case "/":
                    if (inputOperand2 !== 0) {
                        result = inputOperand1 / inputOperand2;
                    } else {
                        MessageBox.error("Wer durch Null teilt kommt in die Hölle!");
                        return;
                    }
                    break;
                case "sqrt":
                    result = Math.sqrt(inputOperand1);
                    break;
                case "pow":
                    result = Math.pow(inputOperand1, inputOperand2);
                    break;
                default:
                    MessageBox.error("Ungültiger Operator");
                    return;
            }

            MessageToast.show("Ergebnis: " + result, { duration: 1000 });
        }
    });
});
