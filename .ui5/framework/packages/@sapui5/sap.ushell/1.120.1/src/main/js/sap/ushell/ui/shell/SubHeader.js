// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/Control",
    "sap/ushell/library" // css style dependency
], function (
    Control,
    ushellLibrary
) {
    "use strict";

    var SubHeader = Control.extend("sap.ushell.ui.shell.SubHeader", {
        metadata: {
            library: "sap.ushell",
            aggregations: {
                content: { type: "sap.ui.core.Control", multiple: true, singularName: "content" }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (rm, oSubHeader) {
                rm.openStart("div", oSubHeader);
                rm.class("sapUshellSubHeader");
                rm.openEnd(); // div - tag
                rm.close("div");
            }
        }
    });

    SubHeader.prototype.init = function () {
        this.aContent = [];
    };

    SubHeader.prototype.onAfterRendering = function () {
        var aContent = this.getContent();
        if (aContent.length) {
            aContent[0].placeAt(this.getDomRef(), "only");
        }
    };

    SubHeader.prototype.addContent = function (oControl) {
        // Store all subheaders, however, render always the first one.
        this.aContent.push(oControl);

        this.invalidate();
    };

    SubHeader.prototype.removeContent = function (oControlToRemove) {
        var iIndex = this.aContent.findIndex(function (oControl) {
            return oControl === oControlToRemove;
        });
        if (iIndex > -1) {
            this.aContent.splice(iIndex, 1);
        }

        this.invalidate();
        return oControlToRemove;
    };


    SubHeader.prototype.getContent = function () {
        return this.aContent;
    };

    SubHeader.prototype.destroyContent = function () {
        for (var i = 0; this.aContent.length > i; i++) {
            this.aContent[i].destroy();
            delete this.aContent[i];
        }
        this.aContent = [];

        this.invalidate();
    };

    SubHeader.exit = function () {
        this.destroyContent();
        this.aContent = null;
    };

    return SubHeader;
});
