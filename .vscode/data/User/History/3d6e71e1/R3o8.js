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
            },

            localCalcHarvey: function(sDatBirth, sDatDeath) {
                var oDatBirth = new Date(sDatBirth.substring(0, 4) + "/" + sDatBirth.substring(4, 6) + "/" + sDatBirth.substring( 6));
                var oDatDeath = new Date(sDatDeath.substring(0, 4) + "/" + sDatDeath.substring(4, 6) + "/" + sDatDeath.substring( 6 ));
                var oDelta = oDatDeath.getTime() - oDatBirth.getTime();
                var oDeltaDays = oDelta / (1000 * 3600 * 24);
                var o100YearsInDays = 36500;
                var fPercentage = ((oDeltaDays + 25 - 1) / (o100YearsInDays + 25 - 1) * 100);
                return fPercentage;
            },
            
            localColorHarvey: function(sDatBirth, sDatDeath) {
                var fPercentage = this.localCalcHarvey(sDatBirth, sDatDeath);
                var sColor = "";
                if (fPercentage < 60) {
                    sColor = "Error";
                } else if (fPercentage < 90) {
                    sColor = "Critical";
                } else {
                    sColor = "Good";
                }
                return sColor;
            }
    
        });
    });
