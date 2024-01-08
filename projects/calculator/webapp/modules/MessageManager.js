sap.ui.define([
    "calculator/modules/Calculator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Calculator) {
    return {

        calculate: function () {
            
            //Überprüfung von eingegebenen Werten.? -> ist in der Calculator bereits geschehen!
                        
            if (Ergebnis !== null) {
                sap.m.MessageToast.show(Calculator.label + Ergebnis, { duration: 1000 });
            }
           
        
        }
    };
}
);