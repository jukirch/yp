sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast"
], function (Calculator, MessageToast) {
    return {

        calculate: function () {
            //Überprüfung von eingegebenen Werten.?
            var Ergebnis = Calculator.Ergebnis(41,0,"+")
            if (Calculator.) {
                
            } else {
                
            }
            MessageToast.show(Calculator.label + this.Ergebnis, { duration: 500 });
        }
    };
}
);