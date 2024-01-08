// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller","sap/esh/search/ui/SearchModel", "../../util"
], function (
    Controller, SearchModel, util
) {
    "use strict";
    return Controller.extend("sap/ushell/renderer/search/searchComponent/SearchApp", {

      onInit: function () {

            SearchModel.getModelSingleton({}, "flp");
            sap.ushell.Container.getServiceAsync("ShellNavigation").then(function (service) {
                this.oShellNavigation = service;
                this.oShellNavigation.hashChanger.attachEvent("hashChanged", this.hashChanged);
            }.bind(this));
        },

        hashChanged: function () {
            var model = SearchModel.getModelSingleton({}, "flp");
            model.parseURL();
        },

        onExit: function () {
            this.oShellNavigation.hashChanger.detachEvent("hashChanged", this.hashChanged);
            this.oSF = sap.ui.getCore().byId("CEPSearchField");
            this.oPlaceHolderSF = sap.ui.getCore().byId("PlaceHolderSearchField");
            // Reset search fields value when exiting the result page
            if (this.oSF && this.oSF.getValue() !== "") {
                this.oSF.setValue("");
            }

            if (this.oPlaceHolderSF && this.oPlaceHolderSF.getValue() !== "") {
                this.oPlaceHolderSF.setValue("");
            }

            // destroy TablePersoDialog when exit search app to avoid to create same-id-TablePersoDialog triggered by oTablePersoController.active() in SearchCompositeControl.js
            var tablePersoController = this.oView.getContent()[0].oTablePersoController;
            if (tablePersoController && tablePersoController.getTablePersoDialog && tablePersoController.getTablePersoDialog()) {
                tablePersoController.getTablePersoDialog().destroy();
            }

            if (this.oView.getContent()[0].oSearchPage.oFacetDialog) {
                this.oView.getContent()[0].oSearchPage.oFacetDialog.destroy();
            }
        }
    });

});

