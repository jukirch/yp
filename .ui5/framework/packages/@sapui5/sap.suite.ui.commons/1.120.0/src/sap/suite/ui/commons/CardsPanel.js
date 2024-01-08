sap.ui.define([
    "sap/f/GridList",
    "sap/f/GridListItem",
    "sap/ui/layout/cssgrid/GridBasicLayout",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Button",
    "sap/m/IllustratedMessage",
    "sap/suite/ui/commons/BasePanel",
    "sap/insights/CardHelper",
    "sap/ui/integration/widgets/Card",
    "sap/suite/ui/commons/MenuButton"
], function (
    GridList,
    GridListItem,
    GridBasicLayout,
    VBox,
    HBox,
    Button,
    IllustratedMessage,
    BasePanel,
    CardHelper,
    Card,
    MenuButton
) {
    "use strict";

    var cardsPanel = BasePanel.extend("sap.suite.ui.commons.CardsPanel", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", defaultValue: '', visibility: "hidden" },
                key: { type: "string", group: "Misc", defaultValue: '', visibility: "hidden" },
                width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" },
                height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" }
            },
            defaultAggregation: "cards",
            aggregations: {
                cards: { type: "sap.ui.integration.widgets.Card", multiple: true, singularName: "card", visibility: "hidden" }
            }
        }
    });

    cardsPanel.prototype.init = async function() {
        this.setTitle(this.getResourceBundle().getText("insightsCardsTitle"));
        // Setup Header Content
        this.addAggregation("menuButtons", new MenuButton(`${this.getId()}-menuButton`, {
            icon: "sap-icon://slim-arrow-down",
            press: this._onPressMenuButton.bind(this)
        }));

        this.addAggregation("actionButtons", new Button({
            text: this.getResourceBundle().getText("showMore")
        }));
        this.addAggregation("actionButtons", new Button({
            text: this.getResourceBundle().getText("manageCards")
        }));

        // Fetch Cards from insights service
        try {
            const oCardHelperInstance = await CardHelper.getServiceAsync();
            if (oCardHelperInstance?._getUserVisibleCardModel) {
                const oUserVisibleCardModel = await oCardHelperInstance._getUserVisibleCardModel();
                const aCards = oUserVisibleCardModel.getProperty("/cards");
                if (aCards.length) {
                    this._showCards(aCards);
                } else {
                    this._showNoCardsMessage();
                }
            }
        } catch (e) {
            this._showNoCardsMessage();
        }
    };

    cardsPanel.prototype._showCards = function(aCards) {
        // Create GridList Wrapper for all cards
        const oGridList = new GridList({
            customLayout: new GridBasicLayout({
                gridTemplateColumns: "repeat(auto-fit, 19rem)",
                gridGap: "1rem"
            })
        }).addStyleClass("sapUiSmallMarginTop");

        aCards.forEach((oCard) => {
            const manifest = oCard.descriptorContent;
            // Create Card Instance
            const oUserCard = new Card({
                width: "19rem",
                height: "33rem",
                manifest
            }).addStyleClass("sapUiSmallMarginRight");

            const items = [oUserCard];

            // Add overlay in case of List and Table Card
            const sType = manifest["sap.card"].type;
            if (sType === "Table" || sType === "List") {
                const overlay = new HBox({
                    width: "19rem",
                    height: "2rem"
                }).addStyleClass("insightsCardOverflowTop");
                const overlayHBoxWrapper = new HBox({
                    height: "0"
                }).addStyleClass("sapMFlexBoxJustifyCenter");
                overlayHBoxWrapper.addItem(overlay);
                items.push(overlayHBoxWrapper);
            }

            // Create Wrapper VBox for Card
            const oPreviewVBox = new VBox({
                direction: "Column",
                justifyContent: "Center",
                items
            });

            // add VBox as item to GridList
            oGridList.addItem(new GridListItem({
                content: [oPreviewVBox]
            }));
        });

        this.addContent(oGridList);
    };

    cardsPanel.prototype._showNoCardsMessage = function() {
        const oIllustratedMessage = new IllustratedMessage({
            illustrationSize: "Spot",
            illustrationType: "sapIllus-AddDimensions",
            title: this.getResourceBundle().getText("noAppsTitle"),
            description: this.getResourceBundle().getText("noCardsMsg")
        });
        const oManageCardsBtn = new Button({
            text: this.getResourceBundle().getText("manageInsightBtn"),
            type: "Emphasized"
        });
        const oWrapperVBox = new VBox({
            backgroundDesign: "Solid"
        });
        oIllustratedMessage.insertAdditionalContent(oManageCardsBtn);
        oWrapperVBox.addItem(oIllustratedMessage);
        this.addContent(oWrapperVBox);
    };

    cardsPanel.prototype._onPressMenuButton = function() {

    };

    return cardsPanel;
});
