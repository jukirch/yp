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
                this.sObs = false;
            },
            
            onFilter: function(oEvent) {
                var oInput = this.getView().byId("input0");
                var sYear = oInput.getValue();
                var oFilter = new sap.ui.model.Filter("oscYear",
                    sap.ui.model.FilterOperator.GE,
                    sYear);
                var oTable = this.getView().byId("table0");
                oTable.getBinding("rows").filter([oFilter]);
            },
    
            onReset: function(oEvent) {
                var oTable = this.getView().byId("table0");
                var oInput = this.getView().byId("input0");
                var oSorter = new sap.ui.model.Sorter("oscYear", false);
                oTable.getBinding("rows").filter(null);
                oTable.getBinding("rows").sort([oSorter]);
                oInput.setValue(null);
            },

            /* Hier dann Sortierungsfunktionen! */

            onFilmSort: function(oEvent) {                
                this.sObs = !this.sObs;                
                var oSorter = new sap.ui.model.Sorter("oscBestFilm", this.sObs);
                var oTable = this.getView().byId("table0");
                oTable.getBinding("rows").sort([oSorter]);
                
            } ,

            onRSort: function(oEvent) {               
                this.sObs = !this.sObs;
                var oTable = this.getView().byId("table0");
                var oSorter = new sap.ui.model.Sorter("oscBestDir", this.sObs);
                oTable.getBinding("rows").sort([oSorter]);
            },

            onMSort: function(oEvent) {               
                this.sObs = !this.sObs;
                var oTable = this.getView().byId("table0");
                var oSorter = new sap.ui.model.Sorter("oscMaleLead", this.sObs);
                oTable.getBinding("rows").sort([oSorter]);
            },

            onFSort: function(oEvent) {               
                this.sObs = !this.sObs;
                var oTable = this.getView().byId("table0");
                var oSorter = new sap.ui.model.Sorter("oscFemaleLead", this.sObs);
                oTable.getBinding("rows").sort([oSorter]);
            },



        });
    });
