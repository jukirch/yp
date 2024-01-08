// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.shell.NavigationBarMenu.Component", {
        metadata: {
            manifest: "json",
            library: "sap.ushell"
        },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
