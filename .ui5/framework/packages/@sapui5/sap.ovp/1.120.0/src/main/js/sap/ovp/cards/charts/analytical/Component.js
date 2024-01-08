/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/analytical/Component",
    "sap/ovp/cards/charts/VizAnnotationManager" /** Required to load VizAnnotationManager for card creation using OVPCardAsAPIUtils API */
], function (
    BaseAnalyticalComponent,
    VizAnnotationManager
) {
    "use strict";

    return BaseAnalyticalComponent.extend("sap.ovp.cards.charts.analytical.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                headerExtensionFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.KPIHeader"
                },
                contentFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.charts.analytical.analyticalChart"
                },
                controllerName: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.charts.analytical.analyticalChart"
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
                libs: ["sap.viz"],
                components: []
            },
            config: {}
        }
    });
});
