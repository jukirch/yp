/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/Component"
], function (
    BaseComponent
) {
    "use strict";
    
    return BaseComponent.extend("sap.ovp.cards.generic.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                contentFragment: {
                    type: "string"
                },
                controllerName: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.Card"
                },
                headerExtensionFragment: {
                    type: "string"
                },
                contentPosition: {
                    type: "string",
                    defaultValue: "Middle"
                },
                headerFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.Header"
                },
                footerFragment: {
                    type: "string"
                },
                identificationAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.Identification"
                },
                selectionAnnotationPath: {
                    type: "string"
                },
                filters: {
                    type: "object"
                },
                parameters: {
                    type: "object"
                },
                addODataSelect: {
                    type: "boolean",
                    defaultValue: false
                },
                enableAddToInsights: { 
                    type: "boolean",
                    defaultValue: false
                },
                showRefresh: {
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
