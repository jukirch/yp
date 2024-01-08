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
        // Erstellen Sie die View
        sap.ui.core.mvc.View.create({
            id: "mainView",
            viewName: "calculator.view.Calculator",
            type: sap.ui.core.mvc.ViewType.XML
        }).then(function (oView) {
            oView.placeAt("calculatorView");
        });
    })
});