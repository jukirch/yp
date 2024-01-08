/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
   "sap/ovp/cards/generic/base/Component",
   "sap/ovp/cards/v4/V4AnnotationHelper" /** Required to load V4AnnotationHelper otherwise the cards will throw an error will not be able to use functions from V4AnnotationHelper */
], function (
   BaseComponent,
   V4AnnotationHelper
) {
    "use strict";
    
    return BaseComponent.extend("sap.ovp.cards.v4.generic.Component", {
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
                    defaultValue: "sap.ovp.cards.v4.generic.Header"
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
