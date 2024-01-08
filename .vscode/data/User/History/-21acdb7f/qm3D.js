sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast".
    "sap/m/MessageBox"
], function (Calculator, MessageBox, MessageToast) {
    return {

        calculate: function () {
            
            //Überprüfung von eingegebenen Werten.? -> ist in der Calculator bereits geschehen!
            
            var Ergebnis = Calculator.Ergebnis( 41 , 0 , "/" )
            
            case (Ergebnis = NaN) {
                MessageBox.error(Ergebnis, {duration: 1000 })
            } else {
                MessageToast.show(Calculator.label + Ergebnis, { duration: 1000 });
            } 
           
        
        }
    };
}
);