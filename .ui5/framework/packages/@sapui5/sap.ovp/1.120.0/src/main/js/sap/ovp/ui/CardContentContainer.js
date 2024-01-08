/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/m/FlexBox"], function (FlexBox) {
    "use strict";

    var CardContentContainer = FlexBox.extend("sap.ovp.ui.CardContentContainer", {
        metadata: {
            library: "sap.ovp"
        },
        renderer: {
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.class("sapOvpCardContentContainer")
                   .class("sapMTBStandard");
                oRm.openEnd();

                var items = oControl.getItems();
                for (var i = 0; i < items.length; i++) {
                    oRm.renderControl(items[i]);
                }
                oRm.close("div");
            }
        }
    });
    return CardContentContainer;
});
