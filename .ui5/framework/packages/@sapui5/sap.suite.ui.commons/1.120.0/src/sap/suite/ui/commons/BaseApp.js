sap.ui.define([
    "sap/ui/core/Element"
], function (
    Element
) {
    "use strict";

    var BaseApp = Element.extend("sap.suite.ui.commons.BaseApp", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", defaultValue: '' },
                bgColor: { type: "string", group: "Misc", defaultValue: '' }
            },
            events: {
                press: {}
            },
            aggregations: {
                menuButtons: {type: "sap.suite.ui.commons.MenuButton", multiple: true, singularName: "menuButton"}
            }
        }
    });

    return BaseApp;
});