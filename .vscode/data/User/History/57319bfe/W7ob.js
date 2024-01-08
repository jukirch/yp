sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/JSONModel"
],
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("s330503.controller.Main", {
            
		onInit: function() {
			var oModel = new JSONModel();
			oModel.loadData("data/artists2.json", {}, false);
			this.getView().setModel(oModel, "artMod");
			
			var oModel2 = new JSONModel();
			oModel2.setData({
				"movie": {},
				"artist": {}
			});
			this.getView().setModel(oModel2, "movSng");
		},

		onExpandFirstLevel: function() {
			var oTreeTable = this.byId("ttab1");
			oTreeTable.expandToLevel(1);
		},

		onCollapseAll: function() {
			var oTreeTable = this.byId("ttab1");
			oTreeTable.collapseAll();
		},

		onExpandSelection: function() {
			var oTreeTable = this.byId("ttab1");
			oTreeTable.expand(oTreeTable.getSelectedIndices());
		},

		onRowSelectionChange: function() {
			//Initialisierungen
			var oSplitApp = this.byId("splapp0");
			var oTable = this.getView().byId("ttab1");
			var oModel = this.getView().getModel("artMod");
			var oModelSng = this.getView().getModel("movSng");
			//Get the selected row
			var iSelRowId = oTable.getSelectedIndex();
			//Find the movie Object and set the "Single Movie" Object
			var sMovModPath = oTable.getContextByIndex(iSelRowId).getPath(); //"/artRoot/0/artMovies/1"
			var oMovie = oModel.getObject(sMovModPath);
			oModelSng.setProperty("/movie", oMovie);
			//Determine the artist path and set the "Single Movie" Object
			var iIdx = sMovModPath.indexOf("/artMovies");
			var sMovArtPath = "";
			if (iIdx === -1) {
				//No movie was chosen in the TableTrre, but the artist
				sMovArtPath = sMovModPath; //"/artRoot/0"
			} else {
				//A movia was selected in the TreeTable
				sMovArtPath = sMovModPath.substr(0, iIdx); //"/artRoot/0"
			}
			var oArtist = oModel.getObject(sMovArtPath);
			oModelSng.setProperty("/artist", oArtist);
			//Call the detail page
			oSplitApp.toDetail(this.createId("detail"));
		}

        });
    });
