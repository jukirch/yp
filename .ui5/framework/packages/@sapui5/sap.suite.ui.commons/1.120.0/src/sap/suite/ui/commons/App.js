sap.ui.define([
    "sap/suite/ui/commons/BaseApp"
], function (
    BaseApp
) {
    "use strict";

    var App = BaseApp.extend("sap.suite.ui.commons.App", {
        metadata : {
            properties : {
                icon: { type: "string", group: "Misc", defaultValue: '' },
                url: { type: "string", group: "Misc", defaultValue: '' }
            }
        },
        events:{}
    });

    App.prototype.launchApp = async (oEvent, sTargetURL,sTitle) => {
        const oSpaceContentService = await sap.ushell.Container.getServiceAsync("SpaceContent");
        oSpaceContentService.launchTileTarget(sTargetURL, sTitle);
    };

    return App;
});