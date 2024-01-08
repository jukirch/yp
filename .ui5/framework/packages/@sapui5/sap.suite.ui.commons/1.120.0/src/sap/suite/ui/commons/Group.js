sap.ui.define([
    "sap/suite/ui/commons/BaseApp"
], function (
    BaseApp
) {
    "use strict";

    var Group = BaseApp.extend("sap.suite.ui.commons.Group", {
        metadata : {
            properties : {
                number: { type: "string", group: "Misc", defaultValue: '' }
            },
            events: {},
            aggregations: {
                apps: {type: "sap.suite.ui.commons.App", multiple: true, singularName: "app"}
            }
        }
    });

    return Group;
});