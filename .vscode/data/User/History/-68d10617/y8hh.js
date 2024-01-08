sap.ui.define(["sap/ui/core/format/DateFormat"], function(DateFormat) {
	return {
		globalFormatter: function(sToBeFormatted) {
			var sResult;
			if (sToBeFormatted === null || sToBeFormatted === undefined) {
				sResult = "";
			} else {
				//Behandlung des Eingabeparameters: string -> US-Datumsformat
				var oLocaleUS = new sap.ui.core.Locale("en-US");
				var oFormatOptionsUS = {
					pattern: "MMMM d, yyyy"
				};
				var dfUS = DateFormat.getDateInstance(oFormatOptionsUS, oLocaleUS);
				var dateUS = dfUS.parse(sToBeFormatted);
				
				//Behandlung des Ausgabeparameters: US-Datum -> string in DE-Datum
				var oLocaleDE = new sap.ui.core.Locale("de-DE");
				var oFormatOptionsDE = {
					pattern: "dd.MM.yyyy"
				};
				var dfDE = DateFormat.getDateInstance(oFormatOptionsDE, oLocaleDE);
				sResult = dfDE.format(dateUS);
			}
			return sResult;
		}
	};
});