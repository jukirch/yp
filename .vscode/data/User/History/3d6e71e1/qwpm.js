sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "s33-04-01/modules/Helper"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function(Controller, Helper) {
        "use strict";
    
        return Controller.extend("S33-04-01_Sol.controller.Main", {
            
            globFormatAttr: Helper, 
    
            onInit: function() {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.loadData("data/artists.json");
                this.getView().setModel(oModel);
            },
    
            onSelectionChange: function(oEvent) {
                var oItem = oEvent.getParameter("listItem");
                var sPath = oItem.getBindingContext().getPath();
                var oTable = this.getView().byId("table1");
                oTable.bindElement(sPath);
            },
    
            _getProperty: function(oEvent, sProperty) {
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var sValue = this.getView().getModel().getProperty(sPath + "/" + sProperty);
                return sValue;
            },
    
            onPressWiki: function(oEvent) {
                var sProperty = this._getProperty(oEvent, "artWiki");
                sap.m.URLHelper.redirect(sProperty, true);
            },
    
            onPressMail: function(oEvent) {
                var sProperty = this._getProperty(oEvent, "artName");
                var sRecipient = "ama@ama-training.de";
                var sBetreff = "Bitte um Info: " + sProperty;
                var sBody = "Ich will Info!";
                var sCC = "alexander.maetzing@quicksted.com";
                sap.m.URLHelper.triggerEmail(sRecipient, sBetreff, sBody, sCC);
            }
    
        });
    });
