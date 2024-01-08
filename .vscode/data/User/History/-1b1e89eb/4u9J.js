sap.ui.define(["sap/m/Button"],
    function(Button) {
        var oButton = new Button("button0", { text: "Drück mich!" });

        oButton.placeAt("content");
    }
);