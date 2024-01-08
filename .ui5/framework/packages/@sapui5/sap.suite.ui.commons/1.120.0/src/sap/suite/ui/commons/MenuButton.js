sap.ui.define([
    "sap/ui/core/Element"
], function (
    Element
) {
    "use strict";

    const MenuButton = Element.extend("sap.suite.ui.commons.MenuButton", {
        metadata: {
            properties : {
                text: { type: "string", group: "Misc", defaultValue: '' },
                icon: { type: "string", group: "Misc", defaultValue: '' }
            },
            events: {
                press: { params: { button: { type: "sap.m.Button" } } }
            }
        }
    });

    return MenuButton;
});
