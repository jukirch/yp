sap.ui.define(["sap/m/MessageBox", "sap/m/MessageToast"],
    function (MessageBox, MessageToast) {
        return {
            calculate: function (operand1, operand2, operator) {
                switch (operator) {
                    case "+":
                        return operand1 + operand2;
                    case "-":
                        return operand1 - operand2;
                    case "*":
                        return operand1 * operand2;
                    case "/":
                        if (operand2 !== 0) {
                                return operand1 / operand2;
                            } else {
                                MessageBox.error("Wer durch Null teilt kommt in die Hölle!");
                            };
                    case "sqrt":
                        return Math.sqrt(operand1);
                    case "pow":
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
