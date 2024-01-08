sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Calculator, MessageBox, MessageToast) {
    return {

        calculate: function () {
            
            //Überprüfung von eingegebenen Werten.? -> ist in der Calculator bereits geschehen!
            
            var Ergebnis = Calculator.Ergebnis( 41 , 0 , "+" )
            
            if(isNaN(Ergebnis)) {
                MessageBox.error(Ergebnis);
            } else {
                MessageToast.show(Calculator.label + Ergebnis, { duration: 1000 });
            } 
           
        
        }
    };
}
);