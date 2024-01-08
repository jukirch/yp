sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast"
], function (Calculator, MessageToast) {
    return {

        calculate: function () {
            //Überprüfung von eingegebenen Werten.?
            MessageToast.show(Calculator.label + Calculator.Ergebnis(41, 1, "+"), { duration: 500 });
        }
    };
}
);