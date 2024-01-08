sap.ui.define([
    "sap/ui/core/ComponentContainer"
], function (ComponentContainer) {
    "use strict";

    new ComponentContainer({
        name: "calculator", // Ihr Projektname
        settings: {
            id: "calculator"
        },
        async: true
    }).placeAt("content");

    sap.ui.getCore().attachInit(function () {
        // Erstellen Sie die View aus Ihrer XML-Datei
        var oView = sap.ui.xmlview({
            viewName: "calculator.view.Calculator",
            type: sap.ui.core.mvc.ViewType.XML
        });

        // Platzieren Sie die View im HTML-Container
        oView.placeAt("calculatorView");
    });
});