// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/*
 * The Tool Area control is used in the FLP extensibility.
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/ushell/library", // css style dependency
    "sap/ushell/resources"
], function (
    Control,
    ushellLibrary,
    resources
) {
    "use strict";

    var ToolArea = Control.extend("sap.ushell.ui.shell.ToolArea", {
        metadata: {
            library: "sap.ushell",
            aggregations: {
                toolAreaItems: { type: "sap.ushell.ui.shell.ToolAreaItem", multiple: true }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (rm, oToolArea) {
                rm.openStart("aside", oToolArea);
                rm.class("sapUshellToolArea");
                rm.attr("aria-label", resources.i18n.getText("ToolArea_AriaLabel"));

                if (!oToolArea.hasItemsWithText()) {
                    rm.class("sapUshellToolAreaTextHidden");
                }

                rm.openEnd(); // aside - tag

                rm.openStart("div");
                rm.attr("id", oToolArea.getId() + "-cntnt");
                rm.class("sapUshellToolAreaContainer");
                rm.openEnd(); // div - tag

                var aItems = oToolArea.getToolAreaItems(),
                    index,
                    oToolAreaItem;

                for (index = 0; index < aItems.length; index++) {
                    oToolAreaItem = aItems[index];
                    if (oToolAreaItem.getVisible()) {
                        rm.openStart("div");
                        rm.class("sapUshellToolAreaContent");
                        if (oToolAreaItem.getSelected()) {
                            rm.class("sapUshellToolAreaItemSelected");
                        }
                        rm.openEnd(); // div - tag

                        rm.renderControl(oToolAreaItem);

                        rm.close("div");

                        rm.openStart("div");
                        rm.class("sapUshellToolAreaContentSeparator");
                        rm.openEnd(); // div - tag
                        rm.close("div");
                    }
                }

                rm.close("div");
                rm.close("aside");
            }
        }
    });

    /**
     * @returns {boolean} true if the toolArea contains a visible item with a text property, otherwise returns false
     */
    ToolArea.prototype.hasItemsWithText = function () {
        var aItems = this.getToolAreaItems(),
            index,
            oToolAreaItem;

        for (index = 0; index < aItems.length; index++) {
            oToolAreaItem = aItems[index];
            if (oToolAreaItem.getVisible() && oToolAreaItem.getText()) {
                return true;
            }
        }
        return false;
    };

    return ToolArea;
});
