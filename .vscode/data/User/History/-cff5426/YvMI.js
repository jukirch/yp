sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("s321401.controller.Main_1401", {

            onInit: function () {
                var oModel1 = new sap.ui.model.json.JSONModel();
                oModel1.setData({"enabled01": true, "movYear" :"1943", "movName":"Casablanca", "movDirector":"Michael Curtiz", "movMaleLead":"Humphrey Bogart", "movFemaleLead":"Ingrid Bergmann", "movOscarWone": true
                }
                ); 
                var oModel2 = new sap.ui.model.json.JSONModel();
                oModel2.loadData("data/data.json");

                var oModel3 = new sap.ui-model.xml.XMLModel();
                oModel3.loadData("data/data.xml");

                var oView = this.getView();
                oView.setModel(oModel2);
            }
        });
    });
