sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "s330401/modules/Helper",
	"sap/ui/core/BusyIndicator"
],
    function(Controller, Helper, BusyIndicator) {
        "use strict";
    
        return Controller.extend("s330401.controller.Main", {
            
            globFormatAttr: Helper, 
    
            onInit: function() {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.loadData("/data/artists.json");
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
                var iBusyIndicatorDuration = Math.floor(Math.random() * 2000) + 1000;
			    console.log("iBusyIndicatorDuration = " + iBusyIndicatorDuration);

                BusyIndicator.show(0);
			    setTimeout(function(){
				BusyIndicator.hide();
				sap.m.URLHelper.redirect(sProperty, true);
			    }, iBusyIndicatorDuration);
            },
    
            onPressMail: function(oEvent) {
                var sProperty = this._getProperty(oEvent, "artName");
                var sRecipient = "alexander.maetzing@quicksted.com";
                var sBetreff = "Bitte um Info: " + sProperty;
                var sBody = "Ich will Info!";
                var sCC = "julian.kirch@web.de"
                sap.m.URLHelper.triggerEmail(sRecipient, sBetreff, sBody, sCC);
            }
    
        });
    });
