sap.ui.define(["sap/base/security/encodeXML", "sap/ui/core/format/NumberFormat", "sap/suite/ui/generic/template/genericUtilities/FeLogger", "sap/suite/ui/generic/template/genericUtilities/testableHelper", "sap/suite/ui/generic/template/genericUtilities/utils"
	], function (encodeXML, NumberFormat, FeLogger, testableHelper, utils) {
	"use strict";

	var oLogger = new FeLogger("js.RuntimeFormatters").getLogger();

	/* Very specific case of formatters: Only put formatters here, that
	 * - are intended to run at runtime
	 * - need to know the control they are bound to (provided as this) or
	 * - may be used in more then one floorplan
	 * 
	 * In general, formatters should be located
	 * - in (general or better use case specific) AnnotationHelper, if they are intended to be used at templating time (i.e. they depend only on information available at that time,
	 * 		like device, metaModel (incl. annotations), manifest (or more general, anything part of the parameter model) 
	 * - in controllerImplementation (formatters in return structure of getMethods), if they are intended to run at runtime (i.e. they depend on information only available and possibly
	 * 		changeable at runtime, like OData model, ui model, _templPriv model) and are only used within a single floorplan.
	*/
	
	
	function getSmartTableControl(oElement){
		while (!oElement.getEntitySet){
			oElement = oElement.getParent();
		}
		return oElement;
	}

	function getLineItemQualifier(oControl) {
		var aControlCustomData = oControl.getCustomData();
		var oCustomData = aControlCustomData.find(function(oCandidate){
			return oCandidate.getKey() === "lineItemQualifier";
		});
		return oCustomData && oCustomData.getValue();
	}

	function getCriticality(oRow, oRowContext){
		var oModel = oRowContext.getModel();
		var oMetaModel = oModel.getMetaModel();
		var oControl = getSmartTableControl(oRow.getParent());
		var oEntitySet = oMetaModel.getODataEntitySet(oControl.getEntitySet());
		var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			//getting the lineItem annotations for the current table
		var oLineItemAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem"];
			//getting the Criticality object.
		var oCriticalityAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem@com.sap.vocabularies.UI.v1.Criticality"];
			//checking if the given table's lineItem has a qualifier defined.
		var sLineItemQualifier = getLineItemQualifier(oControl);
		if (sLineItemQualifier) {
			oCriticalityAnnotation = oEntityType["com.sap.vocabularies.UI.v1.LineItem#" + sLineItemQualifier + "@com.sap.vocabularies.UI.v1.Criticality"];
		}
		if (oLineItemAnnotation && oCriticalityAnnotation){
			// Highlights the rows of tables with green/red/yellow if lineItem criticality is defined
			//check for setting dynamic highlight using Path
			if (oCriticalityAnnotation.Path){
				var sCriticalityPath = oCriticalityAnnotation.Path;
				var sRowCriticalityValue = oRowContext.getObject(sCriticalityPath);
				if (sRowCriticalityValue){
					switch (sRowCriticalityValue.toString()){
						case "0":
							return "None";
						case "1":
							return "Error";
						case "2":
							return "Warning";
						case "3":
							return "Success";
						default:
							break;
					}
				}
			} else if (oCriticalityAnnotation.EnumMember){
				//check for setting static highlight using EnumMember
				var sCriticalityEnum = oCriticalityAnnotation.EnumMember;
				if (sCriticalityEnum) {
					switch (sCriticalityEnum) {
						case "com.sap.vocabularies.UI.v1.CriticalityType/Neutral":
							return "None";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Negative":
							return "Error";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Critical":
							return "Warning";
						case "com.sap.vocabularies.UI.v1.CriticalityType/Positive":
							return "Success";
						default:
							break;
					}
				}
			}
		}
		return "None";
	}

	// Expose selected private static functions to unit tests
	/* eslint-disable */
	var getLineItemQualifier = testableHelper.testableStatic(getLineItemQualifier, "RuntimeFormatters_getLineItemQualifier");
	var getSmartTableControl = testableHelper.testableStatic(getSmartTableControl, "RuntimeFormatters_getSmartTableControl");
	/* eslint-enable */	
	
	var oRuntimeFormatters = {

		setInfoHighlight: function (isActiveEntity, hasActiveEntity, bEditable) {
			var oRowContext = this.getBindingContext();
			if (!oRowContext){
				return "None";
			}
			
			var sMessage = "None";
			var MessageType = sap.ui.core.MessageType; // for better access to the enum
			if (bEditable){
				if (oRowContext.isTransient() && !oRowContext.isInactive()) {
					return "Information";
				}
				
				var aMessage = oRowContext.getMessages();
				for (var i = 0; i < aMessage.length; i++){
					var oMessage = aMessage[i];
					var sType = oMessage.getType();
					if (sType === MessageType.Error){
						return "Error";
					}
					if (sType === MessageType.Warning){
						sMessage = "Warning";
					} else if (sType === MessageType.Information && sMessage !== MessageType.Warning){
						sMessage = "Information";
					}
				}
			}
			// Highlights the rows of tables with blue if it is a newly created draft item
			if (isActiveEntity === false && hasActiveEntity === false) {
				return sMessage === "None" ? "Information" : sMessage;
			}
			// merge message state (not error) and criticality
			var sCriticality = getCriticality(this, oRowContext);
			return (sCriticality === "Error" || sCriticality === "Warning" || sMessage === "None") ? sCriticality : sMessage;
		},		

		/**
		* Return the value for the navigated property of the row. Works for both FCL and non-FCL apps.
		* @param {string} sBindingPath of the row that is used to navigate to OP or Sub-OP
		* @return {boolean} true/false to set/unset the property
		*/
		setRowNavigated: function(sBindingPath) {
            // In case of UI tables, get the parent 'row' aggregation before fetching the binding context
			var oContext = this.getBindingContext() || this.getParent().getBindingContext();
			var sPath = oContext && oContext.getPath();
			return !!sPath && (sPath === sBindingPath);
		},

		formatImageUrl: function (sImageUrl, sAppComponentName, bSuppressIcons) {
			return utils.adjustImageUrlPath(sImageUrl, sAppComponentName, bSuppressIcons);
		},

		// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
		formatRatingIndicatorSubTitle: function (iSampleSizeValue) {
			if (iSampleSizeValue) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, this.data("Subtitle")]);
				} else {
					var sSubTitleLabel = iSampleSizeValue > 1 ? oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL");
					return oResBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, sSubTitleLabel]);
				}
			}
		},

		// returns the text for the Rating Indicator footer (e.g. '2 out of 5')
		// note: the second placeholder (e.g. "5") for the text "RATING_INDICATOR_FOOTER" can come one from the following:
		// i. if the Property TargetValue for the term UI.DataPoint is a Path then the value is resolved by the method buildRatingIndicatorFooterExpression and passed to this method as 'targetValue'
		// ii. if the Property TargetValue is not a Path (i.e. 'Decimal') then we get the value from the control's Custom Data
		// iii. if neither i. or ii. apply then we use the default max value for the sap.m.RatingIndicator control
		formatRatingIndicatorFooterText: function (value, targetValue) {
			if (value) {
				var oResBundle = this.getModel("i18n").getResourceBundle();
				if (targetValue) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, targetValue]);
				} else if (this.getCustomData().length > 0) {
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, this.data("Footer")]);
				} else {
					var iRatingIndicatorDefaultMaxValue = sap.m.RatingIndicator.getMetadata().getPropertyDefaults().maxValue;
					return oResBundle.getText("RATING_INDICATOR_FOOTER", [value, iRatingIndicatorDefaultMaxValue]);
				}
			}
		},
		
		// returns the text for the Rating Indicator aggregated count (e.g. (243))
		formatRatingIndicatorAggregateCount: function (value) {
			var oResBundle = this.getModel("i18n").getResourceBundle();
			var sText;
			if (value) {
				sText = oResBundle.getText("RATING_INDICATOR_AGGREGATE_COUNT", [value]);
			} else if (this.getCustomData().length > 0) {
				sText = oResBundle.getText("RATING_INDICATOR_AGGREGATE_COUNT", [this.data("AggregateCount")]);
			} else {
				sText = "";
			}

			return sText;
		},
		
		/**
		 * @parameter {string} sValue A string containing the value
		 * @parameter {string} sTarget A string containing the target value
		 * @parameter {string} sUoM A string containing the unit of measure
		 * @returns {string} A string containing the text that will be used in the display value of the Progress Indicator
		 */
		formatDisplayValueForProgressIndicator: function (sValue, sTarget, sUoM) {
			var sDisplayValue = "";
			if (sValue !== null && sValue !== undefined) {
				sValue = sValue.toString();
			}
			if (sTarget !== null && sTarget !== undefined) {
				sTarget = sTarget.toString();
			}
			if (sValue) {
				var oControl = this;
				var oResourceBundle = oControl.getModel("i18n").getResourceBundle();
				var aCustomData = oControl.getCustomData();
				var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
				sValue = NumberFormat.getInstance(oLocale).format(sValue);
				sTarget = sTarget || aCustomData.filter(function (oObject) {
					if (oObject.getKey() === "Target") {
						return oObject;
					}
				});
				sTarget = typeof (sTarget) === "object" ? (sTarget[0] && sTarget[0].getValue()) : sTarget;

				sUoM = sUoM || aCustomData.filter(function (oObject) {
					if (oObject.getKey() === "UoM") {
						return oObject;
					}
				});
				sUoM = typeof (sUoM) === "object" ? (sUoM[0] && sUoM[0].getValue()) : sUoM;
				if (sUoM) {
					if (sUoM === '%') { // uom.String && uom.String === '%'
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_PERCENT", [sValue]);
					} else {// (uom.String and not '%') or uom.Path
						if (sTarget) {
							sTarget = sap.ui.core.format.NumberFormat.getInstance(oLocale).format(sTarget);
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT", [sValue, sTarget, sUoM]);
						} else {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT_NO_TARGET_VALUE", [sValue, sUoM]);
						}
					}
				} else {
					if (sTarget) {
						sTarget = sap.ui.core.format.NumberFormat.getInstance(oLocale).format(sTarget);
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [sValue, sTarget]);
					} else {
						sDisplayValue = sValue;
					}
				}
			} else { // Cannot do anything
				oLogger.warning("Value property is mandatory, the default (empty string) will be returned");
			}

			return sDisplayValue;
		},		

		encodeHTML: function (HTMLString) {
			return encodeXML(HTMLString);
		}
	};

	return oRuntimeFormatters;
}, /* bExport= */ true);
