/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(["sap/ovp/cards/generic/base/table/Component"], function (BaseTableComponent) {
    "use strict";
    return BaseTableComponent.extend("sap.ovp.cards.table.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                contentFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.table.Table"
                },
                controllerName: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.table.Table"
                },
                annotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.LineItem"
                },
                countHeaderFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.CountHeader"
                },
                headerExtensionFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.KPIHeader"
                },
                enableAddToInsights : {
                    type: "boolean",
                    defaultValue: true
                }
            },
            version: "1.120.0",
            library: "sap.ovp",
            includes: [],
            dependencies: {
                libs: [],
                components: []
            },
            config: {}
        }
    });
});
