sap.ui.define(["sap/m/MessageBox", "sap/m/MessageToast"],
    function (MessageBox, MessageToast) {
        return {
            calculate: function (operand1, operand2, operator) {
                switch (operator) {
                    case "+":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 + operand2;
                        } else {
                            return null; 
                    case "-":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 - operand2;
                        } else {
                            return null; // Oder einen anderen Fehlerwert für fehlende Operanden
                        }
                    case "*":
                        if (operand1 !== null && operand2 !== null) {
                            return operand1 * operand2;
                        } else {
                            return null; // Oder einen anderen Fehlerwert für fehlende Operanden
                        }
                    case "/":
                        if (operand2 !== 0) {
                            if (operand1 !== null && operand2 !== null) {
                                return operand1 / operand2;
                            } else {
                                return null; // Oder einen anderen Fehlerwert für fehlende Operanden
                            }
                        } else {
                            throw new Error("Wer durch Null teilt kommt in die Hölle!");
                        }
                    case "sqrt":
                        if (operand1 !== null) {
                            return Math.sqrt(operand1);
                        } else {
                            return null; // Oder einen anderen Fehlerwert für fehlenden Operand
                        }
                    case "pow":
                        if (operand1 !== null && operand2 !== null) {
                            return Math.pow(operand1, operand2);
                        } else {
                            return null; // Oder einen anderen Fehlerwert für fehlende Operanden
                        }
                    default:
                        MessageBox.alert("Ungültiger Operator");
                        return null;
                }
            }
        };
    }
);
