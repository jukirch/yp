sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast"
], function (Calculator, MessageToast) {
    return {

        calculate: function () {
            
            //Überprüfung von eingegebenen Werten.?
            var Ergebnis = Calculator.Ergebnis( 41 , 0 , "/" )
            MessageToast.show(Calculator.label + Ergebnis, { duration: 500 });
        
        }
    };
}
);