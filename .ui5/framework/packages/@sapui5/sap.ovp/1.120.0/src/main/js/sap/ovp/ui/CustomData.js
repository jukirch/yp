/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/CustomData",
    "sap/ovp/app/OVPLogger",
    "sap/ui/core/Core",
    "sap/ui/core/library"
], function (
    CustomData,
    OVPLogger,
    Core,
    Corelibrary
) {
    "use strict";
    var ID = Corelibrary.ID;
    
    var oLogger = new OVPLogger("OVP.ui.CustomData");
    var CustomData = CustomData.extend("sap.ovp.ui.CustomData");
    // fnOrigcheckWriteToDom = CustomData.prototype._checkWriteToDom;

    CustomData.prototype._checkWriteToDom = function (oRelated) {
        var sKey = this.getKey().toLowerCase(),
            bIsAccessibilityOn = Core.getConfiguration().getAccessibility();
        if (!bIsAccessibilityOn) {
            return;
        }
        if (!this.getWriteToDom()) {
            return null;
        }
        var value = this.getValue();

        if (typeof value != "string") {
            oLogger.error(
                "CustomData with key " +
                sKey +
                " should be written to HTML of " +
                oRelated +
                " but the value is not a string."
            );
            return null;
        }

        if (!ID.isValid(sKey) || sKey.indexOf(":") != -1) {
            oLogger.error(
                "CustomData with key " +
                sKey +
                " should be written to HTML of " +
                oRelated +
                " but the key is not valid (must be a valid sap.ui.core.ID without any colon)."
            );
            return null;
        }

        if (sKey == window._FASTNAVIGATIONKEY) {
            value = /^\s*(x|true)\s*$/i.test(value) ? "true" : "false"; // normalize values
        } else if (sKey.indexOf("sap-ui") == 0) {
            oLogger.error(
                "CustomData with key " +
                sKey +
                " should be written to HTML of " +
                oRelated +
                " but the key is not valid (may not start with 'sap-ui')."
            );
            return null;
        }
        return { key: sKey, value: value };
    };

    return CustomData;
});
