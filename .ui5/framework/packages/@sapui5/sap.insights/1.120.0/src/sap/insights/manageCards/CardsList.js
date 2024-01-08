
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/core/Control",
    "sap/ui/core/Icon",
    "sap/ui/core/dnd/DragDropInfo",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/integration/widgets/Card",
    "sap/m/MessageStrip",
    "sap/m/FlexBox",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Title",
    "sap/m/SearchField",
    "sap/m/ScrollContainer",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/Link",
    "sap/m/MessageBox",
    "sap/m/FormattedText",
    "sap/m/MessageToast",
    "sap/m/Popover",
    "sap/m/Page",
    "../CardHelper",
    "../utils/CardRanking",
    "../base/InMemoryCachingHost",
    "sap/f/IllustratedMessage",
    "sap/ui/model/BindingMode",
    "sap/ui/core/Lib"
], function(
    Log,
    Control,
    Icon,
    DragDropInfo,
    Filter,
    FilterOperator,
    ResourceModel,
    Card,
    MessageStrip,
    FlexBox,
    HBox,
    VBox,
    Text,
    Button,
    Title,
    SearchField,
    ScrollContainer,
    Table,
    Column,
    ColumnListItem,
    CheckBox,
    Link,
    MessageBox,
    FormattedText,
    MessageToast,
    Popover,
    Page,
    CardHelper,
    CardRanking,
    InMemoryCachingHost,
    IllustratedMessage,
    BindingMode,
    CoreLib
) {
    "use strict";
    /**
	 * Constructor for CardsList.
	 *
	 * @class
	 * This control shows list of all user cards
	 * @extends sap.ui.core.Control
	 * @private
     * @since 1.119
     * @alias sap.insights.manageCards.CardsList
	 */
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    var oLogger = Log.getLogger("sap.insights.manageCards.CardsList");
    var CardsList = Control.extend("sap.insights.manageCards.CardsList", {
        metadata: {
            properties: {
                enableResetAllCards : {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false
                },
                _count: {
                    type: "number",
                    group: "Appearance",
                    defaultValue: 0
                },
                _visibleCount: {
                    type: "number",
                    group: "Appearance",
                    defaultValue: 0
                },
                /* _dtCards property is to calculate number of DT Cards as Refresh text and button will be displayed
                    only if enableResetAllCards is true or DT Cards are present */
                _dtCards: {
                    type: "array",
                    group: "Appearance",
                    defaultValue: []
                }
            },
            aggregations: {
                _page: {
                    type: "sap.m.Page",
                    multiple: false,
                    visibility: "hidden"
                }
            },
            events: {
                listPress: {
                    allowPreventDefault: true,
                    parameters: {
                        manifest: "string" //selectedcardpath
                    }
                }
            }
        },
        renderer:{
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.openEnd();
                oRm.renderControl(oControl.getAggregation("_page"));
                oRm.close("div");
                return;
            }
        }
    });
    CardsList.prototype.init = function() {
        this._oWrapperFlexBox = new FlexBox(this.getId() + "--flexContainerCardsContent",{
            alignItems:"Start",
            justifyContent:"Start",
            height:"100%",
            width:"100%",
            direction:"Column",
            busy: "{/isLoading}"
        }).addStyleClass("flexContainerCards");
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        var oPage = new Page(this.getId() + "--insightCardPage", {
            showHeader:false,
            backgroundDesign:"List",
            enableScrolling:false,
            content: this._oWrapperFlexBox
        });
        this.setAggregation("_page", oPage);
        this.host = new InMemoryCachingHost("CardListHost");
	};

    CardsList.prototype._handleModelChange = function() {

        if (this.getModel()) {
            var aCards = this.getModel().getProperty("/cards");
            if (aCards.length > 0) {
                this._setHeaderStaticControls();
                this._setProperties();
                this._createTableContent();
                if (this.oScrollContainerNoCards) {
                    this.oScrollContainerNoCards.setVisible(false);
                }
            } else {
                this._createNoCardContent();
            }
        }
    };

    CardsList.prototype._setHeaderStaticControls = function () {
        if (!this.oMessageStrip ) {
            this.oMessageStrip = new MessageStrip(this.getId() + "--insightMaxCardMsg", {
                text:this.i18Bundle.getText("insightMaxCardText"),
                type:"Warning",
                showIcon:true
            });
            this.oTextMessage = new Text(this.getId() + "--insightCardText", {
                text:this.i18Bundle.getText("insightCardTabText"),
                textAlign:"Begin",
                width:"100%"
            }).addStyleClass("sapUiSmallMarginTop");

            this.oMessageVBox = new VBox(this.getId() + "--insightCardMessageVBox", {
                alignItems: "Start",
                width: "calc(100% - 2rem)",
                items: [this.oMessageStrip, this.oTextMessage]
            }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin");

            // Create Search Field
            this.oSearchVBox = new VBox(this.getId() + "--insightCardTitleVBox", {
                width: "calc(100% - 2rem)"
            }).addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin");
            this.oCardCountTitle = new Title(this.getId() + "--availableInsightsCardsTitle", {
                titleStyle:"H5"
            });
            this.oSearchVBox.addItem(  this.oCardCountTitle );
            this._oSearchField = new SearchField(this.getId() + "--editInsightsSearch", {
                ariaLabelledBy: "availableInsightsCardsTitle",
                liveChange: this._onCardSearch.bind(this),
                width: "100%"
            });

            this.oSearchVBox.addItem(this._oSearchField);
            this._oWrapperFlexBox.addItem(this.oMessageVBox);
            this._oWrapperFlexBox.addItem(this.oSearchVBox);
        } else { //indicates the controls were already created
            this.oMessageVBox.setVisible(true);
            this.oSearchVBox.setVisible(true);
        }
    };

    CardsList.prototype._createResetBox = function () {
        if (!this.oRefreshHBox) {
            // Create Refresh HBox
            this.oRefreshHBox = new HBox(this.getId() + "--insightCardMessageHBox", {
                alignItems: "Center"
            }).addStyleClass("sapUiTinyMarginTop");

            this.oRefreshHBox.addItem(new Text(this.getId() + "--insightsRefreshText", {
                text: this.i18Bundle.getText("refreshText")
            }));

            this.oRefreshHBox.addItem(new Button(this.getId() + "--insightsRefreshIcon", {
                tooltip: this.i18Bundle.getText("refresh"),
                icon: "sap-icon://refresh",
                type: "Transparent",
                press: this._refreshCardList.bind(this)
            }));

            this.oMessageVBox.addItem(this.oRefreshHBox);
        } else {
            this.oRefreshHBox.setVisible(true);
        }
    };


    CardsList.prototype._setProperties = function() {
        var aCards = this.getModel().getProperty("/cards");
        this.setProperty("_count", aCards.length);
        // Filter DT Cards
        var aDTCards = aCards.filter(function(oCard){
            return oCard.descriptorContent["sap.insights"].isDtCardCopy;
        });
        this.setProperty("_dtCards", aDTCards);

        // Get Visible Cards Count
        var aVisibleCards = aCards.filter(function (oCard) {
            return oCard.visibility;
        });
        this.setProperty("_visibleCount", aVisibleCards.length);
        this.bEnableResetAll = this.getEnableResetAllCards();
        if (this.getProperty("_visibleCount") > 9) {
            this.oMessageStrip.setVisible(true);
            this.oTextMessage.setVisible(false);
        } else {
            this.oTextMessage.setVisible(true);
            this.oMessageStrip.setVisible(false);
        }
        this.oCardCountTitle.setText(this.i18Bundle.getText("availableCards") + " (" + this.getProperty("_visibleCount") + "/" + this.getProperty("_count") + ")");
        if (this.bEnableResetAll  || this.getProperty("_dtCards").length > 0) {
            this._createResetBox();
        } else if (this.oRefreshHBox) {
            this.oRefreshHBox.setVisible(false);
        }
        if (this._oTable) {
            this._oTable.updateAggregation("items");
        }
    };


    CardsList.prototype._createNoCardContent = function () {
        if (!this.oScrollContainerNoCards) {
            this.oNoCardMessage = new IllustratedMessage(this.getId() + "--editInsightNoInsightsCardsMsg", {
                illustrationSize: "Auto",
                illustrationType: "sapIllus-SimpleEmptyList",
                title: this.i18Bundle.getText("editInsightsEmptyCardTitle"),
                description: this.i18Bundle.getText("editInsightsEmptyCardSubTitle")
            }).addStyleClass("sapFIllustratedMessageAlign sapFFrequentIllustratedMessageAlign sapUiMargin-24Top");
            // when there are no cards
            this.oScrollContainerNoCards = new ScrollContainer(this.getId() + "--idNoCardCardsScrollContainer", {
                vertical: true,
                horizontal: false,
                height: "100%",
                width: "100%",
                content: [this.oNoCardMessage]
            });
            this._oWrapperFlexBox.addItem(this.oScrollContainerNoCards);
        } else {
            this.oScrollContainerNoCards.setVisible(true);
        }

        if (this.oSearchVBox) {
            this.oSearchVBox.setVisible(false);

        }
        if (this.oMessageVBox) {
            this.oMessageVBox.setVisible(false);
        }
        if (this.oTableFlexBox) {
            this.oTableFlexBox.setVisible(false);
        }
    };

    CardsList.prototype._handleTableItemsChange = function(oEvent) {
        //when searchfilter change no need to invoke handlemodelcahnge
       if (oEvent && oEvent.getParameters() && oEvent.getParameters().reason !== 'filter') {
            this._handleModelChange();
       }
    };

    CardsList.prototype._createTableContent = function() {
        if (!this.oTableFlexBox) {
            this.oTableFlexBox = new FlexBox(this.getId() + "--editInsightsCardsFlex", {
                alignItems: "Start",
                justifyContent: "Start",
                height: "100%",
                width: "calc(100% - 2rem)",
                direction: "Row"
            }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTop flexContainerCards");

            this.oTableVBox = new VBox(this.getId() + "--insightsCardsVBox", {
                height: "100%",
                width: "100%",
                justifyContent: "Start",
                direction: "Column"
            });

            this.oScrollContainer = new ScrollContainer(this.getId() + "--idCardsScrollContainer", {
                vertical: true,
                horizontal: false,
                height: "100%",
                width: "100%",
                content: this._createTable()
            });

            this.oTableVBox.addItem(this.oScrollContainer);
            this.oTableFlexBox.addItem(this.oTableVBox);
            this._oWrapperFlexBox.addItem(this.oTableFlexBox);
            this._oTable.getBinding("items").attachChange(this._handleTableItemsChange.bind(this));
        } else {
            this.oTableFlexBox.setVisible(true);
        }
    };

    CardsList.prototype._onCardSearch = function (oEvent, sText) {
        var sQuery = oEvent ? oEvent.getSource().getValue() : sText;
        var filter = new Filter("descriptorContent/sap.card/header/title", FilterOperator.Contains, sQuery);
        var aFilters = [];
        aFilters.push(filter);
        var oBinding = this._oTable.getBinding("items");
        oBinding.filter(aFilters, "Application");
    };

    CardsList.prototype._createTable = function() {
        if (!this._oTable) {
            this._oTable = new Table(this.getId() + "--insightsCardsListTable", {
                columns: [
                    new Column(this.getId() + "--idTableCheckBoxColumn", {
                    hAlign: "Center",
                    width: "14%"
                    }),
                    new Column(this.getId() + "--idSectionTitleColumn", {
                        width: "86%"
                    })
                ]
            }).addStyleClass("sapContrastPlus");
            //Create Binding
            this._oTable.bindAggregation("items", {
                path: "/cards",
                length: 100,
                factory: this._generateTableColumnsTemplate.bind(this)
            });
            this._oTable.addDragDropConfig(new DragDropInfo({
                sourceAggregation: "items",
                targetAggregation: "items",
                drop: this._handleDrop.bind(this)
            }));
        }
        return this._oTable;
    };

    CardsList.prototype._generateTableColumnsTemplate = function() {

        var oColumnListItem = new ColumnListItem( {
            press: this._handleCardListItemPress.bind(this),
            type: "Navigation"
        }).addStyleClass("insightsListItem insightsListMargin");

        var oCheckBoxCell = new HBox({
            items: [
                new Icon( {
                    src: "sap-icon://BusinessSuiteInAppSymbols/icon-grip"
                }).addStyleClass("insightsDndIcon"),
                new CheckBox( {
                    selected: "{visibility}",
                    select: this._handleCardVisibilityToggle.bind(this)
                    ,
                    blocked: {
                        path: "visibility" ,
                        mode: "TwoWay",
                        type : 'sap.ui.model.type.Boolean' ,
                        formatter: function (
                            sValue
                            ) {
                                if (sValue == false  && this.getProperty("_visibleCount") >= 10) {
                                    return true;
                                }
                                return false;
                            }.bind(this)
                    }
                }).addStyleClass("layoutCheckbox")
            ]
        });

        var oCardDetails = new VBox( {
            items: [
                new Link( {
                    text: "{descriptorContent/sap.card/header/title}",
                    wrapping: true,
                    press: this._showCardPreviewPopover.bind(this)
                }),
                new HBox({
                    visible: "{= ${descriptorContent/sap.card/header/subTitle} ? true : false }",
                    items: [
                        new Text({
                            text: "{descriptorContent/sap.card/header/subTitle}"
                        })
                    ]
                })
            ]
        });

        oColumnListItem.addCell(oCheckBoxCell);
        oColumnListItem.addCell(oCardDetails);

        return oColumnListItem;
    };

    CardsList.prototype._refreshCardList = function() {
        var sContent;

        /* In case of delete all cards parameter true */
        if ( this.bEnableResetAll ) {
            sContent = this.i18Bundle.getText("deleteAllCardsMsg");
        } else {
            var aDTCards = this.getProperty("_dtCards");
            var sContentText = '<p>' + this.i18Bundle.getText("refreshAllCards") + '</p>';
            sContentText += '<ul>';
            aDTCards.forEach(function(oDTCard){
                sContentText +=  '<li class="sapUiTinyMarginBottom">' + oDTCard.descriptorContent["sap.card"].header.title + '</li>';
            });
            sContentText += '</ul>';
            sContent = new FormattedText({ htmlText: sContentText });
        }

        MessageBox.show(sContent, {
            icon: MessageBox.Icon.WARNING,
            title: this.i18Bundle.getText("refresh"),
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                    CardHelper.getServiceAsync().then(function (oService) {
                        return oService._refreshUserCards( this.bEnableResetAll )
                        .then(function(){
                            return this._handleModelChange();
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this)
        });
    };


    CardsList.prototype._handleCardListItemPress = function(oEvent, oDynCard) {
        if (oEvent) {
            this.currentCardPreviewPath = oEvent.getSource().getBindingContextPath();
        } else if (oDynCard) {
            this.currentCardPreviewPath = oDynCard.getBindingContextPath();
        }
        var oManifestDetails = this.getModel().getProperty(this.currentCardPreviewPath);
        this.fireListPress({manifest: JSON.stringify(oManifestDetails)});
    };

    CardsList.prototype._handleCardVisibilityToggle = function(oEvent) {
        this._oWrapperFlexBox.setBusy(true);
        var oEventParameters = oEvent.getSource();
        var sPath = oEventParameters.getBindingContext().getPath();
        var oCard = this.getModel().getProperty(sPath);
        var bToggleValue = oEventParameters.getSelected();
        oCard.visibility = bToggleValue;
        oCard.descriptorContent["sap.insights"].visible = bToggleValue;
        CardHelper.getServiceAsync().then(function (oService) {
            oService._updateCard(oCard.descriptorContent, true)
            .then(function(){
                this._oWrapperFlexBox.setBusy(false);
                this._handleModelChange();
                if (this._oTable) {
                    this._oTable.updateAggregation("items");// to refresh the table aggregation bindings.
                }
                return;
            }.bind(this))
            .catch(function (oError) {
                this._oWrapperFlexBox.setBusy(false);
                MessageToast.show(oError.message);
                oLogger.error(oError.message);
            });
        }.bind(this));
    };

    CardsList.prototype._showCardPreviewPopover = function(oEvent) {
        var oModel = this.getModel();
        var selectedCardPath = oEvent.getSource().getParent().getBindingContext().getPath();
        var oCard = oModel.getProperty(selectedCardPath);
        var oLink = oEvent.getSource();
        var vBox = new VBox({
            alignItems: "Center",
            justifyContent: "Center"
        }).addStyleClass("sapUiSmallMargin");

        var card = new Card({
            manifest: oCard.descriptorContent,
            width: "17rem",
            height: "23.5rem",
            host: this.host
        });
        vBox.addItem(card);

        var oPopover = new Popover({
            title: this.i18Bundle.getText("preview"),
            placement: "VerticalPreferredBottom",
            initialFocus: "idCardPreviewPopover",
            showHeader: true
        }).addStyleClass("sapContrastPlus previewPopoverBackground");
        oPopover.addContent(vBox);
        oPopover.openBy(oLink);
    };

    CardsList.prototype._handleDrop = function (oEvent) {
        var oDragItem = oEvent.getParameter("draggedControl"),
            iDragItemIndex = oDragItem.getParent().indexOfItem(oDragItem),
            oDropItem = oEvent.getParameter("droppedControl"),
            iDropItemIndex = oDragItem.getParent().indexOfItem(oDropItem);
        if (iDragItemIndex !== iDropItemIndex) {
            var aUpdatedCards = this._setCardsRanking(iDragItemIndex, iDropItemIndex);
            aUpdatedCards = aUpdatedCards.map(function(oOrgCard){
                var oCard = JSON.parse(JSON.stringify(oOrgCard));
                var sCardId = oCard.descriptorContent["sap.app"].id;
                oCard.descriptorContent["sap.insights"].ranking = oCard.rank;
                oCard.descriptorContent = JSON.stringify(oCard.descriptorContent);
                return {
                    id: sCardId,
                    descriptorContent: oCard.descriptorContent
                };
            });
            try {
                this._oWrapperFlexBox.setBusy(true);
                CardHelper.getServiceAsync().then(function (oService) {
                    oService._updateMultipleCards(aUpdatedCards, "PUT")
                    .then(function() {
                        var aCards = this.getModel().getProperty("/cards");
                        aCards = aCards.sort(function(a, b) {
                            if (a.rank < b.rank) {
                                return -1;
                            }
                            return 1;
                        });
                        this.getModel().setProperty("/cards", aCards);
                        this._oWrapperFlexBox.setBusy(false);
                    }.bind(this));
                }.bind(this));
            } catch (oError) {
                this._oWrapperFlexBox.setBusy(false);
                oLogger.error(oError.message);
            }
        }
    };

    CardsList.prototype._setCardsRanking = function (iDragIndex, iDropIndex) {
        /* Read Cards from UI for scenario of cards filtered by search field */
        var aCards = this._oTable.getItems().map(function(oItem){
            return oItem.getBindingContext().getObject();
        });

        if (iDragIndex < iDropIndex) {
            return CardRanking.reorder(aCards, iDragIndex, iDropIndex + 1);
        }

        return CardRanking.reorder(aCards, iDragIndex, iDropIndex);
    };

    return CardsList;
});
