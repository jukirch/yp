sap.ui.define(["sap/m/MessageBox", "sap/m/MessageToast"],
    function (MessageBox, MessageToast) {
        return {
            calculate: function (operand1, operand2, operator) {
                switch (operator) {
                    case "+":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 + operand2;
                        } else {
                            MessageBox.alert("Bitte die Eingaben überprüfen!")
                        }
                    case "-":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 - operand2;
                        } else {
                            return null;
                        }
                    case "*":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 * operand2;
                        } else {
                            return null; 
                        }
                    case "/":
                        if (operand2 !== 0) {
                            if (operand1 !== null && operand2 !== null) {
                                return operand1 / operand2;
                            } else {
                                return null;
                            }
                        } else {
                            MessageBox.error("Wer durch Null teilt kommt in die Hölle!");
                        }
                    case "sqrt":
                        if (operand1 !== null) {
                            return Math.sqrt(operand1);
                        } else {
                            return null;
                        }
                    case "pow":
                        if (operand1 !== null && operand2 !== null) {
                            return Math.pow(operand1, operand2);
                        } else {
                            return null;
                        }

                    default:
                        MessageBox.alert("Ungültiger Operator");
                        return null;
                }
            }
        };
    }
);
