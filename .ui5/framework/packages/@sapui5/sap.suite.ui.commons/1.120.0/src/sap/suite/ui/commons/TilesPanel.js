sap.ui.define([
    "sap/m/VBox",
    "sap/m/Button",
    "sap/m/IllustratedMessage",
    "sap/suite/ui/commons/BasePanel",
    "sap/suite/ui/commons/MenuButton"
], function (
    VBox,
    Button,
    IllustratedMessage,
    BasePanel,
    MenuButton
) {
    "use strict";

    var TilesPanel = BasePanel.extend("sap.suite.ui.commons.TilesPanel", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", defaultValue: '', visibility: "hidden" },
                key: { type: "string", group: "Misc", defaultValue: '', visibility: "hidden" },
                width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" },
                height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" }
            },
            defaultAggregation: "tiles",
            aggregations: {
                tiles: { type: "sap.m.Tile", multiple: true, singularName: "tile", visibility: "hidden" }
            }
        }
    });

    TilesPanel.prototype.init = function() {
        this.setTitle(this.getResourceBundle().getText("insightsTilesTitle"));
        // Setup Header Content
        this.addAggregation("menuButtons", new MenuButton(`${this.getId()}-menuButton`, {
            icon: "sap-icon://slim-arrow-down",
            press: this._onPressMenuButton.bind(this)
        }));

        this.addAggregation("actionButtons", new Button({
            text: this.getResourceBundle().getText("showMore")
        }));
        this.addAggregation("actionButtons", new Button({
            icon: "sap-icon://action",
            text: this.getResourceBundle().getText("appFinderLink")
        }));
        this._showNoTilesMessage();
    };

    TilesPanel.prototype._showNoTilesMessage = function() {
        const oIllustratedMessage = new IllustratedMessage({
            illustrationSize: "Spot",
            illustrationType: "sapIllus-AddDimensions",
            title: this.getResourceBundle().getText("noAppsTitle"),
            description: this.getResourceBundle().getText("noTilesMsg")
        });
        const oAddTilesBtn = new Button({
            text: this.getResourceBundle().getText("appFinderLink"),
            type: "Emphasized"
        });
        const oWrapperVBox = new VBox({
            backgroundDesign: "Solid"
        });
        oIllustratedMessage.insertAdditionalContent(oAddTilesBtn);
        oWrapperVBox.addItem(oIllustratedMessage);
        this.addContent(oWrapperVBox);
    };

    TilesPanel.prototype._onPressMenuButton = function() {

    };

    return TilesPanel;
});
