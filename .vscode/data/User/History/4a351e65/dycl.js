sap.ui.define([
    "sap/m/Button",
    "calculator/modules/MessageManager"
],
    function(Button, Calculator) {
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
