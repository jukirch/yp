/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";
    return Control.extend("sap.ovp.ui.Card", {
        metadata: {
            library: "sap.ovp",
            designTime: false,
            aggregations: {
                innerCard: { type: "sap.ui.core.Control", multiple: false }
            },
            defaultAggregation: "innerCard"
        },
        init: function () {},
        renderer: function (oRM, oControl) {
            oRM.openStart("div", oControl);
            oRM.class("sapOvpBaseCardWrapper");
            oRM.openEnd();
            oRM.renderControl(oControl.getAggregation("innerCard"));
            oRM.close("div");
        }
    });
});
