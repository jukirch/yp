/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/list/Component",
    "sap/ovp/cards/v4/V4AnnotationHelper" /** Required to load V4AnnotationHelper otherwise the cards will throw an error will not be able to use functions from V4AnnotationHelper */
], function (
    BaseListComponent,
    V4AnnotationHelper
    ) {
    "use strict";

    return BaseListComponent.extend("sap.ovp.cards.v4.list.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                contentFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.v4.list.List"
                },
                controllerName: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.v4.list.List"
                },
                annotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.LineItem"
                },
                countHeaderFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.v4.generic.CountHeader"
                },
                headerExtensionFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.v4.generic.KPIHeader"
                },
                enableAddToInsights : {
                    type: "boolean",
                    defaultValue: false
                },
                headerFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.v4.generic.Header"
                }
            },
            version: "1.120.0",
            library: "sap.ovp",
            includes: [],
            dependencies: {
                libs: ["sap.suite.ui.microchart"],
                components: []
            },
            config: {}
        }
    });
});
