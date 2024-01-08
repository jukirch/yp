// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/ComponentContainer",
    "sap/ui/core/mvc/XMLView",
    "sap/ushell/Config"
], function (
    UIComponent,
    ComponentContainer,
    XMLView,
    Config
) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.shell.MenuBar.Component", {
        metadata: {
            manifest: "json",
            library: "sap.ushell",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.oMenuModelPromise = sap.ushell.Container.getServiceAsync("Menu")
                .then(function (oMenuService) {
                    return Promise.all([
                        oMenuService.isMenuEnabled(),
                        oMenuService.getMenuModel()
                    ]);
                })
                .then(function (aResults) {
                    var bMenuEnabled = aResults[0];
                    var oMenuModel = aResults[1];

                    this.setModel(oMenuModel, "menu");

                    if (bMenuEnabled) {
                        return this.oViewPromise.then(function () {
                            // wait for the root view to be created, otherwise the view won't render right away
                            // but only after an invalidation of the component container
                            var oComponentContainer = new ComponentContainer({
                                id: "menuBarComponentContainer",
                                component: this
                            });
                            sap.ushell.Container.getRenderer().setNavigationBar(oComponentContainer);
                        }.bind(this));
                    }
            }.bind(this));
        },

        createContent: function () {
            if (Config.last("/core/menu/personalization/enabled")) {
                this.oViewPromise = XMLView.create({
                    viewName: "sap.ushell.components.shell.MenuBar.view.MenuBarPersonalization"
                });
            } else {
                this.oViewPromise = XMLView.create({
                    viewName: "sap.ushell.components.shell.MenuBar.view.MenuBar"
                });
            }

            return this.oViewPromise;
        }
    });
});
