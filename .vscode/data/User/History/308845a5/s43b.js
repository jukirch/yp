sap.ui.define(["sap/m/MessageBox"],
    function (MessageBox) {
        return {
        label: String("Ergebnis: "),
            Ergebnis: function(nOperand1, nOperand2, nOperator) {
                switch (nOperator) {

                    case "+":
                        return nOperand1 + nOperand2;
                    case "-":
                        return nOperand1 - nOperand2;
                    case "*":
                        return nOperand1 * nOperand2;
                    case "/":
                        if (nOperand2 != 0) {
                            return nOperand1 / nOperand2;
                        } else {
                            sap.m.MessageBox.error("Wer durch Null teilt kommt in die Hölle!");
                            return null;
                        }
                    default:
                        sap.m.MessageBox.alert("Kein Operator");
                        return null;
                }
            }
    };
    }
);
