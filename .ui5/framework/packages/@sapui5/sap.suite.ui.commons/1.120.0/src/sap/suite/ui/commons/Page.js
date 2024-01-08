sap.ui.define([
    "sap/ui/core/Element",
    "sap/m/GenericTile",
    "sap/base/Log",
    "sap/ushell/Container"
], function (
    Element,
    GenericTile,
    Log,
    Container
) {
    "use strict";

    var Page = Element.extend("sap.suite.ui.commons.Page", {
        metadata : {
            properties : {
                /**
				 * title for the  page
				 * @since 1.120
				 */
                title: { type: "string", group: "Misc", defaultValue: '' },

                 /**
				 * icon for the  page
				 * @since 1.120
				 */
                icon: { type: "string", group: "Misc", defaultValue: '' },
                 /**
				 * subtitle for the  page
				 * @since 1.120
				 */
                subTitle: { type: "string", group: "Misc", defaultValue: '' },
                 /**
				 * background color for the  page
				 * @since 1.120
				 */
                bgColor: { type: "string", group: "Misc", defaultValue: '' },
                /**
				 * id for the corresponding page
				 * @since 1.120
				 * @experimental Since 1.120
				 */
                pageId:  { type: "string", group: "Misc", defaultValue: '' },
                 /**
				 * space id for the corresponding page
				 * @since 1.120
				 * @experimental Since 1.120
				 */
                spaceId:  { type: "string", group: "Misc", defaultValue: '' },
                 /**
				 * space title for the corresponding page
				 * @since 1.120
				 * @experimental Since 1.120
				 */
                spaceTitle:  { type: "string", group: "Misc", defaultValue: '' },
                 /**
				 * url to be launched for the corresponding page
				 * @since 1.120
				 * @experimental Since 1.120
				 */
                url: { type: "string", group: "Misc", defaultValue: '' }
            },
            events: {
                press: {}
            }

        }

    });

    Page.prototype.onPageTilePress = function (oPage, oEvent) {
        if ( sap.ushell.Container && sap.ushell.Container.getServiceAsync) {
            var sPageId = oPage.getProperty("pageId"),
            sSpaceId = oPage.getProperty("spaceId");
         sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oService) {
             var sHref =
                 oService.hrefForExternal({
                     target: {
                         semanticObject: "Launchpad",
                         action: "openFLPPage"
                     },
                     params: {
                         pageId: sPageId,
                         spaceId: sSpaceId
                     }
                 }) || "";
             oService.toExternal({
                 target: {
                     shellHash: sHref
                 }
             });
         });
        }
     };

    return Page;
});
