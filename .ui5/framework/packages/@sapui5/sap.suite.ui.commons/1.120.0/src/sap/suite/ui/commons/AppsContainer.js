sap.ui.define([
    "sap/suite/ui/commons/BaseContainer",
    "./library"
], function (
    BaseContainer,
    library
) {
    "use strict";

    var LayoutType = library.LayoutType;

    var AppsContainer = BaseContainer.extend("sap.suite.ui.commons.AppsContainer", {
        metadata:{
            properties : {
                layout: { type: "sap.suite.ui.commons.LayoutType", group: "Misc", visibility: "hidden" }
            }
        },
        renderer: {
            apiVersion: 2
        }
    });

    AppsContainer.prototype.init = function () {
        this.setLayout(LayoutType.SideBySide);
        this.setTitle(this.getResourceBundle().getText("appsTitle"));
        BaseContainer.prototype.init.apply(this, arguments);
    };

    return AppsContainer;
});
