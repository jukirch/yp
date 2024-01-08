sap.ui.define([
    "./library"
], function (
    library
) {
    "use strict";

    var LayoutType = library.LayoutType;

    return {
        apiVersion: 2,
        render: function (oRm, oControl) {
            oRm.openStart("div", oControl).class("sapUiBaseContainer");

            //Apply Layout based style classes
            if (oControl.getLayout() === LayoutType.SideBySide) {
                oRm.class("sapUiSideBySide");
            } else if (oControl.getLayout() === LayoutType.Horizontal) {
                oRm.class("sapUiHorizontal");
            } else {
                oRm.class("sapUiVertical");
            }

            oRm.openEnd();
            this.renderContent(oRm, oControl);
            oRm.close("div");
        },

        renderContent: function (oRm, oControl) {
            oRm.renderControl(oControl.getHeader());
            oRm.renderControl(oControl.getInnerControl());
        }
    };
});
