sap.ui.define([
    "sap/m/Button",
    "calculator/modules/Calculator"
],
    function(Button) {
        var oButton = new Button("button0", { text: "Drück mich!" });

        oButton.attachPress( 
            function() 
        {
            alert(Calculator.label + Calculator.Ergebnis(41,1,"+"));
        }
        );

        oButton.placeAt("testdiv");
        
    }
);