sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("unit15.controller.Main", {
            onInit: function () {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.loadData("/data/oscar.json");
                this.getView().setModel(oModel);
            },
    
            onFilter: function(oEvent) {
                var oInput = this.getView().byId("input0");
                var sYear = oInput.getValue();
                var oFilter = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,
                    sYear);
                var oTable = this.getView().byId("table0");
                oTable.getBinding("items").filter([oFilter]);
            },
    
            onReset: function(oEvent) {
                var oTable = this.getView().byId("table0");
                oTable.getBinding("items").filter(null);
                var oInput = this.getView().byId("input0");
                oInput.setValue(null);
            },

            onFilmSort: function(oEvent) {
                var oTable = this.getView().byId("table0");
                var oSort = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,);
                oTable.getBinding("items").filter([oFilter]);
            },

            onRSort: function(oEvent) {
                var oTable = this.getView().byId("table0");
                var oFilter = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,);
                oTable.getBinding("items").filter([oFilter]);
            },

            onMSort: function(oEvent) {
                var oTable = this.getView().byId("table0");
                var oFilter = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,);
                oTable.getBinding("items").filter([oFilter]);
            },

            onFSort: function(oEvent) {
                var oTable = this.getView().byId("table0");
                var oFilter = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,);
                oTable.getBinding("items").filter([oFilter]);
            },



        });
    });
