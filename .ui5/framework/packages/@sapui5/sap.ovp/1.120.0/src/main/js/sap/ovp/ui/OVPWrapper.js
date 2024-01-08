/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ui/core/Control"], function (Control) {
    "use strict";
    return Control.extend("sap.ovp.ui.OVPWrapper", {
        metadata: {
            library: "sap.ovp",
            designTime: true,
            aggregations: {
                DynamicPage: { type: "sap.ui.core.Control", multiple: false }
            },
            defaultAggregation: "DynamicPage"
        },
        init: function () {},
        renderer: function (oRM, oControl) {
            oRM.openStart("div", oControl);
            oRM.class("ovpWrapper");
            oRM.openEnd();
            oRM.renderControl(oControl.getAggregation("DynamicPage"));
            oRM.close("div");
        }
    });
});
