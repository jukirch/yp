sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast"
], function (Calculator, MessageToast) {
    return {

        calculate: function () {
            //Überprüfung von eingegebenen Werten.?
            var Ergebnis = Calculator.Ergebnis(41,0,"+")
            case  "/":
                if (nOperand2 != 0) {
                    return nOperand1 / nOperand2;
                } else {
                    return "Wer durch Null teilt kommt in die Hölle!";
                }
            MessageToast.show(Calculator.label + this.Ergebnis, { duration: 500 });
        }
    };
}
);