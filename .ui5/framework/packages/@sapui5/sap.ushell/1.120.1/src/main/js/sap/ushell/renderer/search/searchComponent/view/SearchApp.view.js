// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/View",
    "sap/m/Label",
    "sap/esh/search/ui/SearchCompositeControl",
    "sap/esh/search/ui/SearchModel"
], function (View, Label, SearchCompositeControl, SearchModel) {
    "use strict";
    return View.extend("sap.ushell.renderer.search.searchComponent.view.SearchApp", {

        getControllerName: function () {
            return "sap.ushell.renderer.search.searchComponent.controller.SearchApp";
        },

        createContent: function () {
            var model = SearchModel.getModelSingleton({}, "flp");
            return new SearchCompositeControl({ model: model });
        }
    });
});
