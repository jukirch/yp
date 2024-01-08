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
                oModel1.loadData("data/data.json");

                var oView = this.getView();
                oView.setModel(oModel1);
            
                // Zugriff auf die Felder mithilfe der IDs und Setzen der Werte
            var oInput1 = oView.byId("inp1");
            var oInput2 = oView.byId("inp2");
            var oInput3 = oView.byId("inp3");
            var oInput4 = oView.byId("inp4");
            var oInput5 = oView.byId("inp5");

            if (oInput1 && oInput2 && oInput3 && oInput4 && oInput5) {
                oInput1.setValue(oModel1.getProperty("/oscar/0/movYear"));
                oInput2.setValue(oModel1.getProperty("/oscar/0/movName"));
                oInput3.setValue(oModel1.getProperty("/oscar/0/movMaleLead"));
                oInput4.setValue(oModel1.getProperty("/oscar/0/movFemaleLead"));
                oInput5.setValue(oModel1.getProperty("/oscar/0/movDirector"));
            };
            }
        });
    });
