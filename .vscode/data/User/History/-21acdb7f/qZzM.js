sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast"
], function (Calculator, MessageToast) {
    return {

        calculate: function () {
            
            //Überprüfung von eingegebenen Werten.? -> ist in der Calculator bereits geschehen!
            
            var Ergebnis = Calculator.Ergebnis( 41 , 0 , "/" )
            if (condition) {
                
            } else {
                
            } (Ergebnis = "Wer durch Null teilt kommt in die Hölle!")
            MessageToast.show(Calculator.label + Ergebnis, { duration: 500 });
        
        }
    };
}
);