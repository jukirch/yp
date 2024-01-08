/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/Component",
    "sap/ovp/cards/jUtils"
], function (
    CardComponent,
    jUtils
) {
    "use strict";

    return CardComponent.extend("sap.ovp.cards.charts.generic.Component", {
        // use inline declaration instead of component.json to save 1 round trip
        metadata: {
            properties: {
                headerExtensionFragment: {
                    type: "string",
                    defaultValue: "sap.ovp.cards.generic.KPIHeader"
                },
                selectionAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.SelectionVariant"
                },
                chartAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.Chart"
                },
                presentationAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.PresentationVariant"
                },
                identificationAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.Identification"
                },
                dataPointAnnotationPath: {
                    type: "string",
                    defaultValue: "com.sap.vocabularies.UI.v1.DataPoint"
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
        },

        addTabindex: function () {
            jUtils.setAttributeToMultipleElements(".tabindex0", "tabindex", 0);
            jUtils.setAttributeToMultipleElements(".tabindex-1", "tabindex", -1);
        },

        onAfterRendering: function () {
            this.addTabindex();
        }
    });
});
