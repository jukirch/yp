/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/CommonUtils",
    "sap/ui/fl/changeHandler/condenser/Classification"
], function (CommonUtils, Classification) {
    "use strict";

    var oChangeHandler = {
        changeHandler: {
            applyChange: function (oChange, oPanel, mPropertyBag) {
                var personalizationDefaultMainController = CommonUtils.getApp();
                personalizationDefaultMainController.appendIncomingDeltaChange(oChange);
                return;
            },
            getCondenserInfo: function (oChange) {
                return {
                    affectedControl: oChange.getSelector(),
                    classification: Classification.LastOneWins,
                    uniqueKey: oChange.getSelector().id + "-" + oChange.getChangeType()
                };
            },
            completeChangeContent: function (oChange, oSpecificChangeInfo, mPropertyBag) {
                return;
            },
            revertChange: function (oChange, oControl, mPropertyBag) {
                return;
            }
        },
        layers: {
            CUSTOMER_BASE: true,
            CUSTOMER: true,
            USER: true
        }
    };

    return {
        viewSwitch: oChangeHandler,
        visibility: oChangeHandler,
        position: oChangeHandler,
        dragOrResize: oChangeHandler
    };
});
