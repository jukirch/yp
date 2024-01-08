sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper",
"sap/suite/ui/generic/template/genericUtilities/metadataAnalyser",
"sap/base/util/deepExtend"
], function(AnnotationHelper, metadataAnalyser, deepExtend) {
	"use strict";
	var SideEffectSourcePropertyType = {
		SINGLE_SOURCE_ONLY : "OnlySingleSource",
		SINLGE_AND_MULTIPLE_SOURCE: "SingleAndMultipleSource",
		MULTIPLE_SOURCE_ONLY: "OnlyMultipleSource",
		NO_SIDE_EFFECT: "NoSideEffect"
	};

	/***
	 * To trigger side effect on value change , only the fieldGroup Ids of single source property is required
	 * @param {*} oSmartField
	 * @param {*} oComputedMetaData
	 * @returns : array of fieldGroupID assigned for a property (oComputedMetaData.path)
	 */
	function fnGetFieldGroupIdOnlyForSingleSource(oSmartField, oComputedMetaData) {
		var oSideEffect;
		var oClonedMetaData = deepExtend({}, oComputedMetaData);
		for (var sEntityAttributeKey in oComputedMetaData.entityType) {
			if (sEntityAttributeKey.startsWith("com.sap.vocabularies.Common.v1.SideEffects")) {
				oSideEffect = oComputedMetaData.entityType[sEntityAttributeKey];
				// since only the side effect which has the given smartfield as the single source property should get triggered with this event, the other side effect(s)
				// where the given smartfield is used in combination with other property needs to be eliminated, in order to get only the relevant fieldGroupIds.
				if (oSideEffect.SourceProperties && oSideEffect.SourceProperties.length > 1 && metadataAnalyser.hasPropertyInSideEffect(oSideEffect, oComputedMetaData.path)) {
					delete oClonedMetaData.entityType[sEntityAttributeKey];
				}
			}
		}
		return oSmartField._calculateFieldGroupIDs(oClonedMetaData);
	}
	function fnComputeFieldGroupAndTriggerSideEffect(oSmartField, sSideEffectSourcePropertyType) {

		var aFieldGroupIds;
		var fnTriggerValidateFieldGroupEvent = function() {
			if (aFieldGroupIds) {
				oSmartField.triggerValidateFieldGroup(aFieldGroupIds);
			}
		};
		var fnCallTriggerValidateFieldGroup = function(sSideEffectSourcePropertyType, oComputedMetaData) {	

			switch (sSideEffectSourcePropertyType) {
				case SideEffectSourcePropertyType.SINGLE_SOURCE_ONLY:
					var aInnerControls = oSmartField.getInnerControls();
					aFieldGroupIds = aInnerControls && aInnerControls[0] && aInnerControls[0].getFieldGroupIds && aInnerControls[0].getFieldGroupIds();
					fnTriggerValidateFieldGroupEvent(aFieldGroupIds);
					break;
				case SideEffectSourcePropertyType.SINLGE_AND_MULTIPLE_SOURCE:
					// Even if the property is mentioned in multiple side effect sources , execute only the single source side effects
					if (oComputedMetaData) { // In case of the smart field not rendered by generic template, oComputedMetaData is already fetched to calculate SideEffectSourcePropertyType at runtime
						aFieldGroupIds = fnGetFieldGroupIdOnlyForSingleSource(oSmartField, oComputedMetaData);
						fnTriggerValidateFieldGroupEvent(aFieldGroupIds);
					} else {
						oSmartField._getComputedMetadata().then(function(oComputedMetaData) {
							aFieldGroupIds = fnGetFieldGroupIdOnlyForSingleSource(oSmartField, oComputedMetaData);
							fnTriggerValidateFieldGroupEvent(aFieldGroupIds);
						});
					}
					break;
				case SideEffectSourcePropertyType.MULTIPLE_SOURCE_ONLY:
					// If a property is added to a side effect source group then it is not possible to judge the next user interation.
					// So do not programatically trigger side effect.
					break;
				default:
					break;
			}
		};

		if (!sSideEffectSourcePropertyType) {
			oSmartField._getComputedMetadata().then(function(oComputedMetaData) {
				var sSideEffectSourcePropertyType,
				sEntityTypeFullPath = oComputedMetaData.entityType.namespace + "." + oComputedMetaData.entityType.name;
				//bIsDraft = oTemplateUtils.oComponentUtils.isDraftEnabled(),
				sSideEffectSourcePropertyType = AnnotationHelper.getSideEffectSourcePropertyType(oComputedMetaData.path, true, oSmartField.getModel().getMetaModel(), sEntityTypeFullPath);
				if (sSideEffectSourcePropertyType === SideEffectSourcePropertyType.NO_SIDE_EFFECT) { // if the field does not contain side effect then exit
					return;
				}
				fnCallTriggerValidateFieldGroup(sSideEffectSourcePropertyType, oComputedMetaData);
			});
		} else {
			fnCallTriggerValidateFieldGroup(sSideEffectSourcePropertyType);
		}
	}

	/**
	 * Triggers side effect from generic template layer for a field. This method gets triggerd from two sources
	 * 	1. changeModelValue (SmartField)
	 * 	2. fieldChange (SmartTable) - in this case get the source smart field from 'changeEvent'
	 * @param {*} oEvent
	 * @param {*} oComponentUtils
	 * @param {*} bIsSideEffectTypeComputed
	 * @returns
	 */

	function fnHandleSideEffectForField(oEvent, oComponentUtils, bIsSideEffectTypeComputed) {
		
		if (!oComponentUtils.isDraftEnabled()) {
			return;
		}
		var oSmartField = oEvent.getParameter("changeEvent") && oEvent.getParameter("changeEvent").getSource ? oEvent.getParameter("changeEvent").getSource() : oEvent.getSource();

		if (bIsSideEffectTypeComputed) { // For FE rendered smart fields the side effect type is computed at the templating time
			var sSideEffectSourcePropertyTypeCustomData = oSmartField.getCustomData().find(function (oCustomData) {
				return oCustomData.getKey() === "SideEffectSourcePropertyType";
			});
			sSideEffectSourcePropertyTypeCustomData = sSideEffectSourcePropertyTypeCustomData && sSideEffectSourcePropertyTypeCustomData.getValue();
			fnComputeFieldGroupAndTriggerSideEffect(oSmartField, sSideEffectSourcePropertyTypeCustomData);
		} else {
			fnComputeFieldGroupAndTriggerSideEffect(oSmartField);
		}
	}

	/**
	 * Calculate and assign fieldGroup Id(s) for a smart Field
	 * @param {*} oSmartField
	 * @param {*} oMetaModel
	 * @param {*} sEntitySet
	 */
	function fnAssignFieldGroupIds(oSmartField, oMetaModel, sEntitySet) {
		oSmartField._getComputedMetadata().then(function (oComputedMetaData) {
			if (oComputedMetaData && oComputedMetaData.navigationPath && !!oSmartField.getBindingContext()) {
				var oClonedMetaData = deepExtend({}, oComputedMetaData);
				/* EntitySet and EntityType of the cloned metamodel of smartfield needs to be changed to the parent entity so that when
					_calculateFieldGroupIDs looks through the passed metamodel, it should be able to find the corresponding side effect annotation */
				oClonedMetaData.entitySet = oMetaModel.getODataEntitySet(sEntitySet);
				oClonedMetaData.entityType = oMetaModel.getODataEntityType(oClonedMetaData.entitySet.entityType);

				var aIDs = oSmartField._calculateFieldGroupIDs(oClonedMetaData);
				if (aIDs) {
					oSmartField._setInternalFieldGroupIds(aIDs);
				}
			}
		});
	}

	return {
		handleSideEffectForField : fnHandleSideEffectForField,
		assignFieldGroupIds: fnAssignFieldGroupIds
	};
});