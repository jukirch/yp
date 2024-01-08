
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/Item",
    "sap/ui/core/Icon",
    "sap/m/Title",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/Page",
    "sap/m/FlexBox",
    "sap/m/ComboBox",
    "sap/m/ScrollContainer",
    "sap/m/Toolbar",
    "sap/m/HBox",
    "sap/m/Panel",
    "sap/m/Button",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/ObjectIdentifier",
    "sap/m/SearchField",
    "sap/ui/Device",
    "sap/ui/integration/widgets/Card",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
    "../utils/CardPreviewManager",
    "../utils/DeviceType",
    "../utils/AppConstants",
    "../utils/Transformations",
    "sap/ui/core/Lib"
], function (Control, Item, Icon, Title, Text, VBox, Page, FlexBox, ComboBox, ScrollContainer, Toolbar, HBox,
    Panel, Button, Table, Column, ColumnListItem, ObjectIdentifier, SearchField, Device, Card, Filter, FilterOperator, JSONModel, ResourceModel, CardPreviewManager,
    DeviceType, AppConstants, Transformations, CoreLib) {
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    /**
     * Constructor for HouseOfCards control.
     *
     * @class
     * This control helps the user to create an Analytical card from ALP application
     * @extends sap.ui.core.Control
     * @private
     *
     * @since 1.120
     *
     * @alias sap.insights.manageCardPreview.HouseOfCards
     */
    var HouseOfCards = Control.extend("sap.insights.manageCardPreview.HouseOfCards", {
        metadata: {
            properties: {
                /**
                 * Sets the manifest of the currently viewed card
                 */
                manifest: {
                    type: "string",
                    group: "Behavior",
                    defaultValue: ""
                }
            },
            aggregations: {
                /**
                 * Hidden aggregation of page control.
                 */
                _page: { type: "sap.m.Page", multiple: false, visibility: "hidden" }
            }
        },
        renderer: {
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.openEnd();
                oRm.renderControl(oControl.getAggregation("_page"));
                oRm.close("div");
            }
        }
    });
    /**
     * Initializes the control.
     * @returns {void}
     */
    HouseOfCards.prototype.init = function () {
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        this._innerHocModel = new JSONModel();
        if (this._bDesktop) {
            this._bShowPreview = true;
        } else {
            this._bShowPreview = false;
        }
        this._createHocFlex();
        Device.resize.attachHandler(this._adjustLayoutStyles.bind(this));
        this._oPreviewButton = new Button({
            text: this.i18Bundle.getText("INT_DIALOG_CardPreview"),
            press: this._callPreview.bind(this)
        });
        this._oHidePreviewButton = new Button({
            text: this.i18Bundle.getText("INT_DIALOG_HidePreview"),
            press: this._callClosePreview.bind(this)
        });
        var sDeviceType = DeviceType.getDialogBasedDevice();
        this._bDesktop = sDeviceType === AppConstants.DEVICE_TYPES.Desktop;
        this.oParentPage = new Page(this.getId() + "--insightHouseOfCardPage", {
            title: this.i18Bundle.getText("INT_PREVIEW_POPOVER_BUTTON_TITLE"),
            titleLevel: "H1",
            showHeader: true,
            showSubHeader: true,
            backgroundDesign: "List",
            enableScrolling: false,
            headerContent: [
                this._oPreviewButton,
                this._oHidePreviewButton
            ],
            content: [
                new VBox(this.getId() + "--hocbox1", {
                    height: "100%",
                    width: "100%",
                    direction: "Row",
                    justifyContent: "SpaceBetween",
                    items: [
                        this._oHocflexbox1,
                        this._oHocflexbox2
                    ]
                })
            ]
        });
        this._innerHocModel.setData({
            oSelected: {},
            aCards: [],
            aPreviewCards: [1, 2, 3],
            aAllowedChartTypes: [],
            sOriginalChartType: "",
            selectedPath: ""
        });
        this._oConfCard = null;
        this.oParentPage.setModel(this._innerHocModel, "hocModel");
        this.setAggregation("_page", this.oParentPage);
    };
    /**
     * Called before the control is rendered.
     * @returns {void}
     */
    HouseOfCards.prototype.onBeforeRendering = function () {
        this._oManifest = this.getManifest();
        if (this._oManifest) {
            this._oManifest = JSON.parse(this._oManifest);
        }
        this._oConfCard = this._oManifest;
        this._innerHocModel.setProperty("/oSelected", this._oManifest);
        this._oHocChartCombo.bindAggregation("items", {
            path: "hocModel>/aPreviewCards",
            template: new Item({
                key: "{hocModel>sap.card/content/chartType}",
                text: { parts: [{ path: 'hocModel>sap.card/content/chartType' }, { value: 'title' }], formatter: this._setChartDetail }
            })
        });
        this._oCardsTypeTable.bindAggregation("items", {
            path: "hocModel>/aPreviewCards",
            template: new ColumnListItem({
                type: "Active",
                selected: "{= ${hocModel>sap.card/content/chartType} ===   ${hocModel>/oSelected/sap.card/content/chartType} ? true : false}",
                cells: [
                    new HBox({
                        items: [
                            new Icon({
                                src: { parts: [{ path: 'hocModel>sap.card/content/chartType' }, { value: 'icon' }], formatter: this._setChartDetail }
                            })
                        ]
                    }).addStyleClass("sapUiNoPadding"),
                    new ObjectIdentifier({
                        title: { parts: [{ path: 'hocModel>sap.card/content/chartType' }, { value: 'title' }], formatter: this._setChartDetail },
                        tooltip: "{hocModel>sap.card/content/chartType}"
                    }).addStyleClass("sapUiNoPadding")
                ]
            })
        });
        this._oCardContainer.bindAggregation("items", {
            path: "hocModel>/aPreviewCards",
            template: new Card({
                width: "17rem",
                height: "29.5rem",
                manifest: "{= ${hocModel>}}",
                host: "HouseOfCardsHost",
                manifestReady: this._onCardRender.bind(this)
            }).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTopBottom")
        });
        this._adjustLayoutStyles();
    };
    /**
     * Creates static controls
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._createHocFlex = function () {
        this._oCardContainer = new VBox("CardContainer", {
            fitContainer: true,
            alignItems: "Start",
            justifyContent: "Start",
            renderType: "Bare",
            alignContent: "Start",
            wrap: "Wrap",
            width: "100%",
            direction: "Row"
        });
        this._oHoCScrollContainer = new ScrollContainer("idHoCScrollContainer", {
            vertical: true,
            horizontal: false,
            height: "100%",
            width: "100%",
            content: [this._oCardContainer]
        });
        this._oHocChartCombo = new ComboBox("hocChartCombo", {
            ariaLabelledBy: "previewChartInfoTitle previewChartInfoSubTitle hocChartCombo",
            maxWidth: "33%",
            selectionChange: this._onSelectionChange.bind(this)
        }).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTopBottom");
        this._oCardContainerFlex = new FlexBox(this.getId() + "--cardContainerFlex", {
            renderType: "Bare",
            height: "100%",
            direction: "Column",
            items: [
                new VBox("chartSelectVBox", {
                    direction: "Column",
                    items: [
                        new Title("previewChartInfoTitle", {
                            text: this.i18Bundle.getText("INT_CHART_TITLE"),
                            level: "H4"
                        }).addStyleClass("sapUiSmallMarginTop"),
                        new Text("previewChartInfoSubTitle", {
                            text: this.i18Bundle.getText("INT_CHART_SUBTITLE")
                        })
                    ]
                }).addStyleClass("sapUiSmallMarginBegin"),
                new FlexBox("hocflexbox3", {
                    height: "calc(100% - 4rem)",
                    width: "100%",
                    visible: this._bDesktop,
                    direction: "Column",
                    renderType: "Bare",
                    items: [this._oHocChartCombo, this._oHoCScrollContainer]
                })
            ]
        });
        this._oCardsTypeTable = new Table("insightsCardsTypeTable", {
            width: "90%",
            fixedLayout: true,
            mode: "SingleSelectMaster",
            itemPress: this._onChartTypePress.bind(this),
            columns: [
                new Column("chartIconColumn", {
                    hAlign: "Center",
                    width: "10%"
                }),
                new Column("chartTypeNameColumn", {
                    width: "90%"
                })
            ]
        }).addStyleClass("sapContrastPlus sapUiSmallMarginBeginEnd");
        this._oChartTypeSearch = new SearchField("chartTypeSearch", {
            ariaLabelledBy: "previewChartInfoTitle previewChartInfoSubTitle chartTypeSearch",
            placeholder: this.i18Bundle.getText("INT_CHART_SEARCH"),
            width: "90%",
            liveChange: this._onChartTypeSearch.bind(this)
        }).addStyleClass("sapUiSmallMarginBegin");
        this._oPreviewPanelCardContainer = new FlexBox("previewPanelCardContainer", {
            height: "100%",
            width: "100%",
            direction: "Column",
            renderType: "Bare",
            items: [
                this._oChartTypeSearch,
                new ScrollContainer("insightsCardsTypeScroll", {
                    vertical: true,
                    horizontal: false,
                    height: "94%",
                    width: "100%",
                    content: [
                        this._oCardsTypeTable
                    ]
                }).addStyleClass("sapUiTinyMarginTop")
            ]
        });
        this._oPreviewCardHoCSD = new Card("previewCardHoCSD", {
            manifest: "{hocModel>/oSelected}",
            width: "19rem",
            height: "33rem"
        }).addStyleClass("sapUiTinyMarginBeginEnd");
        this._oPreviewCardHoCVBox = new VBox("previewCardHoCVBox", {
            height: "100%",
            width: "100%",
            alignItems: "Center",
            backgroundDesign: "Solid",
            items: [this._oPreviewCardHoCSD]
        }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom");
        this._oPanelFlexHoC = new FlexBox("panelFlexHoC", {
            height: "100%",
            width: "100%",
            renderType: "Bare",
            justifyContent: "Center",
            items: [
                new ScrollContainer("hoCCardsScrollSD", {
                    vertical: true,
                    horizontal: false,
                    height: "100%",
                    content: [this._oPreviewCardHoCVBox]
                })
            ]
        });
        this._oPanelFlexCard = new FlexBox(this.getId() + "--panelFlexCard", {
            width: "100%",
            height: "calc(100% - 3rem)",
            direction: "Column",
            renderType: "Bare",
            items: [this._oPreviewPanelCardContainer, this._oPanelFlexHoC]
        });
        this._oPreviewCardHoC = new Card("previewCardHoC", {
            manifest: "{ path: 'hocModel>/oSelected', mode: 'TwoWay' }",
            manifestApplied: this._setPreviewCardAriaText.bind(this),
            host: "HouseOfCardsHost",
            width: "19rem",
            height: "33rem"
        });
        var oHocPreviewPanelContainer = new Panel("hocPreviewPanelContainer", {
            expanded: false,
            height: "100%",
            backgroundDesign: "Transparent",
            headerToolbar: [
                new Toolbar("hocPreviewToolBar", {
                    width: "100%",
                    height: "2.7rem",
                    style: "Clear",
                    design: "Auto",
                    content: [
                        new HBox("hocPreviewCardTextHBox", {
                            width: "100%",
                            justifyContent: "Start",
                            backgroundDesign: "Transparent",
                            items: [
                                new Title("hocInsightPreviewCardText", {
                                    text: this.i18Bundle.getText("INT_DIALOG_TITLE_CardPreview"),
                                    textAlign: "Left"
                                }).addStyleClass("sapUiTinyMarginTop")
                            ]
                        })
                    ]
                }).addStyleClass("sapThemeBaseBG")
            ],
            content: [
                new VBox("hocCardsPreviewVBox1", {
                    height: "calc(100% - 2.8rem)",
                    alignItems: "Center",
                    backgroundDesign: "Transparent",
                    justifyContent: "SpaceAround",
                    items: [this._oPreviewCardHoC]
                })
            ]
        });
        this._oHocflexbox1 = new FlexBox(this.getId() + "--hocflexbox1", {
            height: "100%",
            width: "100%",
            direction: "Column",
            justifyContent: "Center",
            items: [this._oCardContainerFlex, this._oPanelFlexCard]
        });
        this._oHocflexbox2 = new FlexBox("hocflexbox2", {
            direction: "Column",
            width: "38%",
            height: "100%",
            renderType: "Bare",
            fitContainer: true,
            items: [
                new ScrollContainer("hoCCardsScroll", {
                    vertical: true,
                    horizontal: false,
                    height: "100%",
                    content: [
                        oHocPreviewPanelContainer
                    ]
                })
            ]
        }).addStyleClass("sapMPageBgStandard");
    };
    /**
     * Called when chart type is searched in small screen devices
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onChartTypeSearch = function (oEvent) {
        var sQuery = '';
        if (oEvent) {
            sQuery = oEvent.getSource().getValue();
        }
        var filter = new Filter("sap.card/content/chartType", FilterOperator.Contains, sQuery);
        var aFilters = [];
        aFilters.push(filter);
        var oBinding = this._oCardsTypeTable.getBinding("items");
        if (oBinding) {
            oBinding.filter(aFilters, "Application");
        }
    };
    /**
     * Formatter method to set the chart details while binding
     * @param {string} sChartType
     * @param {string} sKey
     * @returns {string}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._setChartDetail = function (sChartType, sKey) {
        var oChartTypes = AppConstants.CHART_TYPE_DETAILS;
        if (sKey === 'icon' && sChartType) {
            return oChartTypes[sChartType] ? oChartTypes[sChartType].icon : oChartTypes["default"].icon;
        }
        if (sKey === "title" && sChartType) {
            return oChartTypes[sChartType] ? oChartTypes[sChartType].title : sChartType.replaceAll("_", " ");
        }
    };
    /**
     * Method to set aria text based on the chart type of preview card
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._setPreviewCardAriaText = function (oEvent) {
        var ariaText = oEvent.getSource()._ariaText.getText();
        var sTitle = this.i18Bundle.getText("INT_DIALOG_TITLE_CardPreview");
        oEvent.getSource()._ariaText.setText(sTitle + ariaText);
    };
    /**
     * This method is called when selection of chart type is changed in combobox
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onSelectionChange = function (oEvent) {
        var oEventParameters = oEvent.getParameters();
        var oSelectedItem = oEventParameters.selectedItem;
        var sSelectedPath = oSelectedItem && oSelectedItem.getBindingContext("hocModel").getPath();
        this._onClickFunction(null, sSelectedPath);
    };
    /**
     * Handler when card load fails
     * @param {object} oCard Card which failed to load
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onCardLoadFailure = function (oCard) {
        var oCardFailed = this._oCardContainer.removeItem(oCard.sId);
        if (oCardFailed) {
            oCardFailed.destroy();
        }
    };
    /**
     * Handler when card loads and state is changed
     * @param {object} oCard Card for which state is changed
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onCardStateChanged = function (oCard) {
        var oVizChart = oCard.getAggregation("_content") && oCard.getAggregation("_content").getAggregation("_content");
        if (oVizChart && oVizChart.attachRenderComplete) {
            oVizChart.attachRenderComplete(function (oEvent) {
                var sErrorType = oEvent.getSource()._errorType;
                if (sErrorType) {
                    var oErrorItem = this._oCardContainer.removeItem(oCard.sId);
                    if (oErrorItem) {
                        oErrorItem.destroy();
                    }
                }
            }.bind(this));
        }
        var sChartType = oCard.getManifest()["sap.card"].content.chartType;
        var sOriginalChartType = this._innerHocModel.getProperty("/sOriginalChartType");
        if (!CardPreviewManager.hasVizData(oCard) && sChartType !== sOriginalChartType) {
            var aPreviewCards = this._innerHocModel.getProperty("/aPreviewCards");
            var iIndex = aPreviewCards.findIndex(function (oCard) {
                return oCard["sap.card"].content.chartType === sChartType;
            });
            if (iIndex > -1) {
                var oRemovedItem = this._oCardContainer.removeItem(iIndex);
                if (oRemovedItem) {
                    oRemovedItem.destroy();
                }
                aPreviewCards.splice(iIndex, 1);
                this._innerHocModel.setProperty("/aPreviewCards", aPreviewCards);
            }
        }
    };
    /**
     * Handler when show preview button on toolbar is clicked
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._callPreview = function () {
        var oCardToRefresh = this._bDesktop ? this._oPreviewCardHoC : this._oPreviewCardHoCSD;
        this._bShowPreview = true;
        if (oCardToRefresh) {
            oCardToRefresh.refresh();
        }
        this._adjustLayoutStyles();
    };
    /**
     * Handler when hide preview button on toolbar is clicked
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._callClosePreview = function () {
        this._bShowPreview = false;
        this._adjustLayoutStyles();
    };
    /**
     * Sets focus on element based on device type
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._setFocusOnElement = function () {
        if (this._bDesktop) {
            this._oHocChartCombo.focus();
        } else {
            this._oChartTypeSearch.focus();
        }
    };
    /**
     * Handler when card rendering is completed
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onCardRender = function (oEvent) {
        var oCard = oEvent.getSource();
        oCard.attachManifestApplied(function (oEvent) {
            var oCard = oEvent.getSource();
            var oContainerItems = this._oCardContainer.getItems();
            oContainerItems.forEach(function (oCardItem) {
                if (oCardItem.getBindingContext("hocModel")) {
                    var sCardItemPath = oCardItem.getBindingContext("hocModel").getPath();
                    if (this._innerHocModel.getProperty("/selectedPath") === sCardItemPath && (oCardItem.sId === oCard.sId)) {
                        oCardItem.addStyleClass("sapThemeHighlight-asBorderColor");
                        oCardItem.focus();
                    }
                }
            }.bind(this));
            if (oCard.getCardHeader()) {
                var oHeader = oCard.getCardHeader();
                oHeader.addStyleClass('sapFCardHeaderToolbarFocused'); // to remove border from card header
            }
            oCard.attachEvent("_error", this._onCardLoadFailure.bind(this, oCard));
            oCard.attachEvent("stateChanged", this._onCardStateChanged.bind(this, oCard));
        }.bind(this));
        var oCardDom = oCard.getDomRef();
        oCardDom.removeEventListener("click", this._onClickFunction.bind(this, oCard));
        oCardDom.addEventListener("click", this._onClickFunction.bind(this, oCard), { capture: true });
    };
    /**
     * Handler for click on the card
     * @param {object} oCard the card which is clicked and hence selected for preview
     * @param {string} sSelectedPath binding path of selected card
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onClickFunction = function (oCard, sSelectedPath) {
        var oPrevSelectedCard;
        var oContainerItems = this._oCardContainer.getItems();
        var sPrevSelectedpath = this._innerHocModel.getProperty("/selectedPath");
        oContainerItems.forEach(function (oCardItem) {
            if (oCardItem.getBindingContext("hocModel")) {
                var sCardItemPath = oCardItem.getBindingContext("hocModel").getPath();
                if (sSelectedPath && !oCard && sCardItemPath === sSelectedPath) {
                    oCard = oCardItem;
                }
                if (sCardItemPath === sPrevSelectedpath && sPrevSelectedpath !== sSelectedPath) {
                    oPrevSelectedCard = oCardItem;
                }
            }
        });
        if (this._oCardContainer.getItems()[0].hasStyleClass("sapThemeHighlight-asBorderColor")) {
            this._oCardContainer.getItems()[0].removeStyleClass("sapThemeHighlight-asBorderColor");
        } else if (oPrevSelectedCard) {
            oPrevSelectedCard.removeStyleClass("sapThemeHighlight-asBorderColor");
        }
        if (oCard) {
            setTimeout(function () {
                oCard.addStyleClass("sapThemeHighlight-asBorderColor");
            }, 0);
            this._oHoCScrollContainer.scrollToElement(oCard);
            oCard.focus();
            var sPath = oCard.getBindingContext("hocModel").getPath();
            this._innerHocModel.setProperty("/selectedPath", sPath);
            var aPathSplit = sPath.split("/");
            var sIndex = aPathSplit[aPathSplit.length - 1];
            var oCardwAction = this._innerHocModel.getProperty("/aCards/" + sIndex);
            this._innerHocModel.setProperty("/oSelected", oCard.getManifest());
            if (this._oConfCard) {
                this._oConfCard = oCardwAction;
                this._oPreviewCardHoC.refresh();
            }
            this._oHocChartCombo.setSelectedKey(oCard.getManifest()["sap.card"].content.chartType);
        }
    };
    /**
     * Hanlder when chart type is pressed in small devices
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._onChartTypePress = function (oEvent) {
        var oEventParameters = oEvent.getParameter("listItem");
        if (oEventParameters.getBindingContext("hocModel")) {
            var sChartPath = oEventParameters.getBindingContext("hocModel").getPath();
            var oCard = this._innerHocModel.getProperty(sChartPath);
            var oPrevSelectedCard;
            var oContainerItems = this._oCardContainer.getItems();
            var sPrevSelectedpath = this._innerHocModel.getProperty("/selectedPath");
            oContainerItems.forEach(function (oCardItem) {
                if (oCardItem.getBindingContext("hocModel")) {
                    var sCardItemPath = oCardItem.getBindingContext("hocModel").getPath();
                    if (sCardItemPath === sPrevSelectedpath && sPrevSelectedpath !== sChartPath) {
                        oPrevSelectedCard = oCardItem;
                    }
                }
            });
            if (oPrevSelectedCard) {
                oPrevSelectedCard.removeStyleClass("sapThemeHighlight-asBorderColor");
            }
            this._innerHocModel.setProperty("/oSelected", oCard);
            this._innerHocModel.setProperty("/selectedPath", sChartPath);
            var aPathSplit = sChartPath.split("/");
            var sIndex = aPathSplit[aPathSplit.length - 1];
            var oCardwAction = this._innerHocModel.getProperty("/aCards/" + sIndex);
            if (this._oConfCard) {
                this._oConfCard = oCardwAction;
                this._oPreviewCardHoCSD.refresh();
            }
            this._oHocChartCombo.setSelectedKey(oCard["sap.card"].content.chartType);
        }
    };
    /**
     * Shows the HouseOfCards Dialog with the manifest passed to it
     * @returns {void}
     *
     * @public
     * @experimental since 1.120
     */
    HouseOfCards.prototype.showHouseOfCardsDialog = function () {
        var oCard = this.getManifest();
        if (oCard) {
            oCard = JSON.parse(oCard);
        }
        this._oManifest = oCard;
        if (this._bDesktop) {
            this._bShowPreview = true;
        } else {
            this._bShowPreview = false;
        }
        if (!Object.keys(this._innerHocModel.getProperty("/oSelected")).length) {
            this._innerHocModel.setProperty("/selectedPath", '');
            if (this._oChartTypeSearch) {
                this._oChartTypeSearch.setValue('');
                this._onChartTypeSearch();
            }
            this._createHouseOfCards();
        } else if (this._innerHocModel.getProperty("/selectedPath")) {
            this._setBorderStyleSelectedCard(this._innerHocModel.getProperty("/selectedPath"));
        }
    };
    /**
     * Sets border to the selected card type to show it as selected
     * @param {string} sSelectedPath binding path of the selected card
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._setBorderStyleSelectedCard = function (sSelectedPath) {
        var oContainerItems = this._oCardContainer.getItems();
        var oCard;
        oContainerItems.forEach(function (oCardItem) {
            if (oCardItem.getBindingContext("hocModel")) {
                var sCardItemPath = oCardItem.getBindingContext("hocModel").getPath();
                if (sSelectedPath && !oCard && sCardItemPath === sSelectedPath) {
                    oCard = oCardItem;
                }
            }
        });
        if (oCard) {
            setTimeout(function () {
                oCard.addStyleClass("sapThemeHighlight-asBorderColor");
            }, 0);
            oCard.focus();
        }
    };
    /**
     * Getter for the string searched on the searchfield for chart type
     * @returns {string} text searched on the searchfield for chart type
     *
     * @public
     * @experimental since 1.120
     */
    HouseOfCards.prototype.getChartTypeSearch = function () {
        return this._oChartTypeSearch;
    };
    /**
     * Method to create all different types for cards for House of cards based on th emanifest
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._createHouseOfCards = function () {
        var oCard = this._oManifest;
        var sOriginalChartType = oCard["sap.card"].content.chartType;
        this._innerHocModel.setProperty("/sOriginalChartType", sOriginalChartType);
        this._innerHocModel.setProperty("/aCards", []);
        this._innerHocModel.setProperty("/aPreviewCards", []);
        var oCardCloneManifest = JSON.parse(JSON.stringify(oCard));
        var oCardSection = oCardCloneManifest["sap.card"];
        var oDefaultAggregation = this._oCardContainer.getMetadata().getDefaultAggregation();
        var aCards = [], aPreviewCards = [];
        var oSelectedCard;
        this._oCardContainer.removeAllAggregation(oDefaultAggregation.name);
        if (oCardSection.type === "Analytical") {
            var aAllowedChartTypes = oCard["sap.insights"].allowedChartTypes;
            var aChartTypes = [];
            if (aAllowedChartTypes) {
                this._innerHocModel.setProperty("/aAllowedChartTypes", aAllowedChartTypes);
                aChartTypes = aAllowedChartTypes.map(function (oChartType) {
                    return oChartType.key;
                });
                // in V4 version aChartTypes details are sent differently hence check if it satisfies the v4 structure
                var aCharts = aChartTypes.filter(function (oChart) {
                    return !!oChart;
                });
                if (aCharts.length === 0) {
                    aChartTypes = aAllowedChartTypes.map(function (oChartType) {
                        return oChartType.chart;
                    });
                }
            }
            aCards = Transformations.transformAnalyticalManifest(oCardCloneManifest, aChartTypes);
        }
        aCards = aCards.filter(function (oCardToCheck) {
            return !!oCardToCheck;
        });
        if (aCards.length === 0) {
            //No transformed cards add original one
            aCards.push(oCardCloneManifest);
        } else {
            // Bring Original ChartType manifest to Top
            var iIndex = aCards.findIndex(function (oCard) {
                return oCard["sap.card"].content.chartType === sOriginalChartType;
            });
            aCards.splice(iIndex, 1);
            aCards.unshift(oCardCloneManifest);
        }
        aCards.forEach(function (oCardManifest) {
            var oPreviewCloneManifest = JSON.parse(JSON.stringify(oCardManifest));
            var aPreviewCard = CardPreviewManager.getCardPreviewManifest(oPreviewCloneManifest);
            aPreviewCards.push(aPreviewCard);
        });
        this._innerHocModel.setProperty("/aCards", aCards);
        this._innerHocModel.setProperty("/aPreviewCards", aPreviewCards); //without actions
        if (!this._innerHocModel.getProperty("/selectedPath")) {
            this._oHoCScrollContainer.scrollTo(0);
            this._oChartTypeSearch.setValue('');
            this._onChartTypeSearch();
        }
        if (!this._innerHocModel.getProperty("/oSelected") || Object.keys(this._innerHocModel.getProperty("/oSelected")).length === 0) {
            this._innerHocModel.setProperty("/oSelected", aPreviewCards[0]); //without actions
            if (this._oConfCard) {
                this._oConfCard = aCards[0]; //with actions
            }
            this._innerHocModel.setProperty("/selectedPath", "/aPreviewCards/0");
        } else {
            oSelectedCard = this._innerHocModel.getProperty("/oSelected");
            oSelectedCard["sap.card"].header.title = this._oConfCard["sap.card"].header.title;
            oSelectedCard["sap.card"].header.subTitle = this._oConfCard["sap.card"].header.subTitle;
            this._oPreviewCardHoC.refresh();
        }
        oSelectedCard = this._innerHocModel.getProperty("/oSelected");
        this._oHocChartCombo.setSelectedKey(oSelectedCard["sap.card"].content.chartType);
    };
    /**
     * Handler to set the layout based on the device type
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    HouseOfCards.prototype._adjustLayoutStyles = function () {
        var sDeviceType = DeviceType.getDialogBasedDevice();
        this._bDesktop = sDeviceType === AppConstants.DEVICE_TYPES.Desktop;
        if (this._bDesktop) {
            this._oPreviewButton.setVisible(false);
            this._oHidePreviewButton.setVisible(false);
            this._oCardContainerFlex.setVisible(true);
            this._oPanelFlexCard.setVisible(false);
            this._oPanelFlexHoC.setVisible(false);
            this._oPreviewPanelCardContainer.setVisible(false);
            this._oPreviewPanelCardContainer.setVisible(false);
            this._oHocflexbox1.setWidth(this._bShowPreview ? "62%" : "100%");
            this._oPreviewCardHoCVBox.setVisible(false);
            this._oCardsTypeTable.getColumns()[0].setWidth("10%");
            this._oCardsTypeTable.getColumns()[1].setWidth("90%");
            this._oHocflexbox2.setVisible(true);
            this._oCardContainerFlex.getItems()[1].setVisible(true);
            this._oHoCScrollContainer.setVisible(true);
        } else {
            this._oPreviewButton.setVisible(!this._bShowPreview);
            this._oHidePreviewButton.setVisible(this._bShowPreview);
            this._oCardContainerFlex.setVisible(!this._bShowPreview);
            this._oCardContainerFlex.setHeight((!this._bShowPreview) ? "4rem" : "100%");
            this._oPanelFlexCard.setVisible(true);
            this._oPanelFlexHoC.setVisible(true);
            this._oPreviewPanelCardContainer.setVisible(!this._bShowPreview);
            this._oPreviewCardHoCVBox.setVisible(this._bShowPreview);
            this._oHocflexbox1.setWidth("100%");
            this._oCardsTypeTable.getColumns()[0].setWidth("20%");
            this._oCardsTypeTable.getColumns()[1].setWidth("80%");
            this._oHocflexbox2.setVisible(false);
            this._oCardContainerFlex.getItems()[1].setVisible(false);
        }
        this._setFocusOnElement();
    };
    return HouseOfCards;
});
