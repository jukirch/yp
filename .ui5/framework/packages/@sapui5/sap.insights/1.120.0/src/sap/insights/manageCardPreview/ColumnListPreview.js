
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Title",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/Page",
    "sap/m/FlexBox",
    "sap/m/ScrollContainer",
    "sap/m/Toolbar",
    "sap/m/HBox",
    "sap/ui/integration/widgets/Card",
    "sap/m/Panel",
    "sap/m/Button",
    "../utils/CardPreviewManager",
    "sap/ui/model/resource/ResourceModel",
    "../utils/DeviceType",
    "sap/ui/Device",
    "sap/m/Table",
    "sap/m/SearchField",
    "sap/m/Column",
    "sap/ui/core/dnd/DragInfo",
    "sap/ui/core/dnd/DropInfo",
    "sap/ui/core/Icon",
    "sap/m/ColumnListItem",
    "sap/m/CheckBox",
    "sap/m/ObjectIdentifier",
    "sap/m/SegmentedButton",
    "sap/m/SegmentedButtonItem",
    "../utils/Transformations",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/json/JSONModel',
    "../base/InMemoryCachingHost",
    "../utils/AppConstants",
    "sap/ui/core/Element",
    "sap/ui/core/Lib"
], function (Control, Label, Title, Text, VBox, Page,
            FlexBox, ScrollContainer, Toolbar, HBox, Card, Panel, Button,
            CardPreviewManager, ResourceModel, DeviceType, Device, Table, SearchField,
            Column, DragInfo, DropInfo, Icon, ColumnListItem, CheckBox, ObjectIdentifier, SegmentedButton,
            SegmentedButtonItem, Transformations, Filter, FilterOperator, JSONModel, InMemoryCachingHost, AppConstants, Element, CoreLib) {
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    /**
	 * Constructor for  ColumnListPreview control.
	 *
	 * @class
	 * This control helps the user to select different column types for the card and Preview it simultaneously
	 * @extends sap.ui.core.Control
	 * @private
   *
   * @since 1.120
   *
   * @alias sap.insights.manageCardPreview.ColumnListPreview
	 */
    var ColumnList = Control.extend("sap.insights.manageCardPreview.ColumnListPreview", {
        metadata: {
            properties: {
                /**
               * Sets the manifest of the currently viewed card in ColumnList Control
               */
                "manifest": {
                    type: "string",
                    group: "Behavior",
                    defaultValue: ""
                }
            },
                /**
                 * Hidden aggregation of page control.
                 */
            aggregations: {
                "_page": { type: "sap.m.Page", multiple: false, visibility: "hidden" }
            },
            /**
               * Is fired when one of the following happens:
               * 1.when Nav back button pressed
               * 2. when user select any column List.
               */
            events: {
                enableAddButton: {
                    parameters: {
                        enableButton: {
                            type: "boolean"
                        }
                    }
                }
            }
        },
        renderer: {
            render: function(oRm, oColumnList) {
                oRm.openStart("div", oColumnList);
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.openEnd();
                oRm.renderControl(oColumnList.getAggregation("_page"));
                oRm.close("div");
            }
        }
    });
     /**
     * Initializes the control.
     */
    ColumnList.prototype.init = function(){
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        this._innerModel = new JSONModel();
        this.setModel(this._innerModel);
        Device.resize.attachHandler(this._adjustLayoutStyles.bind(this));
        this.oCardColumnPage = new Page(this.getId() + "--insightCardColumnPage",{
            title:this.i18Bundle.getText("INT_PREVIEW_POPOVER_BUTTON_TITLE"),
            titleLevel:"H1",
            showHeader:true,
            showSubHeader:true,
            backgroundDesign:"List",
            enableScrolling:false,
            headerContent:[],
            content: []
        });
        this.setAggregation("_page", this.oCardColumnPage);
        this.host = new InMemoryCachingHost(this.getId() + "--transactionalCardHost", {
            action: function (oEvent) {
                var oCard = oEvent.getParameter("card") || {};
                this.oConfCard = oCard.getManifest();
            }.bind(this)
        });
        this.createStaticControls();
        this.oCardColumnPage.addHeaderContent(this.oCardPreviewBtn);
        this.oCardColumnPage.addHeaderContent(this.oHideCardPreviewBtn);
        this.oCardColumnPage.addContent(this.oFlexContainerColumnContent);
    };
    /**
		 * Called before the control is rendered.
     */
    ColumnList.prototype.onBeforeRendering = function () {
        this.oManifest = this.getManifest();
        if (this.oManifest) {
            this.oManifest = JSON.parse(this.oManifest);
        }
        this._initConfigureCard(this.oManifest);
        this._adjustLayoutStyles();
        this.oInsightsColCardLayer.setVisible(this.oManifest['sap.card'].type  === 'Analytical' ? false : true);
        this.oInsightsColCardLayerSD.setVisible(this.oManifest['sap.card'].type  === 'Analytical' ? false : true);
    };
    /**
		 * Called for initialising static controls within the ColumnList control
     * All static controls will only be called during initialisation, dynamic values bound to these controls
     * will be updated before rendering of the control
     * @private
     * @experimental since 1.120
        */
    ColumnList.prototype.createStaticControls = function () {
        // Card Preview Button
        this.oCardPreviewBtn = new Button(this.getId() + '--cardPreviewId',{
            text: this.i18Bundle.getText("INT_DIALOG_CardPreview"),
            press: this._callPreview.bind(this),
            enabled: true
        });
         // Hide Card Preview Button
        this.oHideCardPreviewBtn = new Button(this.getId() + "--hideCardPreviewId",{
            text: this.i18Bundle.getText("INT_DIALOG_HidePreview"),
            press: this._callClosePreview.bind(this),
            enabled: true
        });
        this.oDefaultTitle = new Title(this.getId() + "--defaultTitle",{
            text: this.i18Bundle.getText("INT_COLUMN_TITLE"),
            level: "H4"
        });
        this.oDefaultSubText = new Text(this.getId() + "--defaultSubText",{
            text: this.i18Bundle.getText("INT_COLUMN_SUBTITLE")
        });
        // VBox for Title and SubTitle
        this.oInsightsColumnEditVBox = new VBox(this.getId() + "--insightsColumnEditVBox",{
            direction: "Column",
            items: [
                this.oDefaultTitle, this.oDefaultSubText
            ]
        }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTop sapUiTinyMarginBottom");
        //Search Field to search for Columns
        this.oColumnSearch = new SearchField(this.getId() + "--columnSearch",{
            placeholder: this.i18Bundle.getText('INT_COL_SEARCH'),
            liveChange: this._onColumnSearch.bind(this)
        }).addStyleClass("sapUiTinyMarginBottom");
        //VBox for Search Field to search for Columns
        this.oColumnSearchVBox = new VBox(this.getId() + "--columnSearchVBox",{
            renderType: "Bare",
            items: [this.oColumnSearch]
        });
        this.oEditColumnsTableCheckBox = new Column(this.getId() + "--editColumnsTableCheckBox",{
            hAlign: "Center"
        });
        this.oEditColumnsName = new Column(this.getId() + "--editColumnsName",{
        });
        this.oColumnDrag = new DragInfo(this.getId() + "--idColumnDrag",{
            groupName:"editColumns",
            sourceAggregation:"items"
        });
        this.oColumnDrop = new DropInfo(this.getId() + "--idColumnDrop",{
            groupName:"editColumns",
            targetAggregation:"items",
            dropPosition:"On",
            drop: this._onColumnDrop.bind(this)
        });
        //Initializing Table to show dnd icon, checkbox, and column name
        this.oInsightsCardsEditColumnsListTable = new Table(this.getId() + "--insightsCardsEditColumnsListTable",{
            fixedLayout:"true",
            columns: [
                this.oEditColumnsTableCheckBox,
                this.oEditColumnsName
            ],
            dragDropConfig: [
                this.oColumnDrag,
                this.oColumnDrop
            ]
        }).addStyleClass("sapContrastPlus");
        this.oEditColumnsScrollContainer = new ScrollContainer(this.getId() + "--idEditColumnsScrollContainer",{
            vertical:true,
            horizontal:false,
            height:"90%",
            width:"100%",
            content: [
                this.oInsightsCardsEditColumnsListTable
            ]
        });
        this.oInsightsColumnEditFlexBox = new FlexBox(this.getId() + "--insightsColumnEditFlexBox",{
            height:"92%",
            width:"95%",
            direction:"Column",
            renderType:"Bare",
            items: [
                this.oColumnSearchVBox,
                this.oEditColumnsScrollContainer
            ]
        }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginEnd");
        this.oLabelColLayout = new Label(this.getId() + "--labelColLayout",{
            text: this.i18Bundle.getText("INT_COL_LAYOUT")
        });
        this.oListViewSD = new SegmentedButtonItem(this.getId() + "--idListViewSD",{
            icon:"sap-icon://list",
            key:"List"
        });
        this.oTableViewSD = new SegmentedButtonItem(this.getId() + "--idTableViewSD",{
            icon:"sap-icon://table-view",
            key:"Table"
        });
        this.oSdColumnSegButton = new SegmentedButton(this.getId() + "--sdColumnSegButton",{
            width:"3.75rem",
            selectionChange: this._onSegmentedSelectionChange.bind(this),
            tooltip: this.i18Bundle.getText("INT_LAYOUT_TOOLTIP"),
            items: [
                this.oListViewSD,
                this.oTableViewSD
            ]
        });
        //VBox for Small device including column Segment buttons
        this.oPreviewVBoxSD = new VBox(this.getId() + "--previewVBoxSD",{
            direction:"Column",
            height: "4rem",
            backgroundDesign:"Solid",
            items: [
                this.oLabelColLayout,
                this.oSdColumnSegButton
            ]
        }).addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginTop");
        this.oPreviewColCardSD = new Card(this.getId() + "--previewColCardSD",{
            manifestApplied: this._setPreviewCardAriaText.bind(this, this.i18Bundle.getText('INT_DIALOG_TITLE_CardPreview')),
            width: "19rem",
            height: "32rem",
            host: this.host
        }).addStyleClass("sapUiTinyMarginBeginEnd sapUiTinyMarginTopBottom");
        this.oInsightsColOverflowInnerHBoxSD = new HBox(this.getId() + "--insightsColOverflowInnerHBoxSD",{
        }).addStyleClass("insightsCardOverflowLayer insightsPreviewCardOverLay insightsColOverLayPositionSD");
        this.oInsightsColCardLayerSD = new HBox(this.getId() + "--insightsColCardLayerSD",{
            height: "0",
            items: [
                this.oInsightsColOverflowInnerHBoxSD
            ]
        }).addStyleClass("sapMFlexBoxJustifyCenter");
        //Scroll container for Preview card in small device
        this.oColCardsScrollSD = new ScrollContainer(this.getId() + "--colCardsScrollSD",{
            vertical:true,
            horizontal:false,
            height:"100%",
            content: [
                this.oPreviewColCardSD,
                this.oInsightsColCardLayerSD
            ]
        });
        //VBox which includes Scroll Container in Small device
        this.oPreviewColCardVBox = new VBox(this.getId() + "--previewColCardVBox",{
            width:"100%",
            height:"calc(100% - 4rem)",
            alignItems:"Center",
            backgroundDesign:"Solid",
            justifyContent:"SpaceAround",
            items: [
                this.oColCardsScrollSD
            ]
        });
        this.oPreviewColCardFlex = new FlexBox(this.getId() + "--previewColCardFlex",{
            direction:"Column",
            height:"100%",
            width:"100%",
            items: [
                this.oPreviewVBoxSD,
                this.oPreviewColCardVBox
            ]
        });
        this.oEditColumnInsightsCardsFlex = new FlexBox(this.getId() + "--editColumnInsightsCardsFlex",{
            height: "100%",
            //width need to be added dynamically
            width: '62%',
            direction: "Column",
            items: [
                this.oInsightsColumnEditVBox,
                this.oInsightsColumnEditFlexBox,
                this.oPreviewColCardFlex
            ]
        });
        this.oInsightPreviewText = new Title(this.getId() + "--insightPreviewText",{
            text: this.i18Bundle.getText("INT_DIALOG_TITLE_CardPreview"),
            textAlign:"Left"
        }).addStyleClass("sapUiTinyMarginTop sapUiSmallMarginEnd");
        this.oListViewLD = new SegmentedButtonItem(this.getId() + "--idListViewLD",{
            icon:"sap-icon://list",
            key:"List"
        });
        this.oTableViewLD = new SegmentedButtonItem(this.getId() + "--idTableViewLD",{
            icon:"sap-icon://table-view",
            key:"Table"
        });
        //Segmented button for Table/List
        this.oColumnSegButton = new SegmentedButton(this.getId() + "--columnSegButton",{
            width:"3.75rem",
            selectionChange: this._onSegmentedSelectionChange.bind(this),
            tooltip: this.i18Bundle.getText("INT_LAYOUT_TOOLTIP"),
            items: [
                this.oListViewLD,
                this.oTableViewLD
            ]
        });
        this.oPreviewTextHBox = new HBox(this.getId() + "--idPreviewTextHBox",{
            width:"100%",
            justifyContent:"Start",
            backgroundDesign:"Transparent",
            renderType:"Bare",
            items: [
                this.oInsightPreviewText,
                this.oColumnSegButton
            ]
        });
        this.oPreviewPanelToolBar = new Toolbar(this.getId() + "--previewPanelToolBar",{
            style:"Clear",
            design:"Auto",
            content: [
                this.oPreviewTextHBox
            ]
        }).addStyleClass("sapThemeBaseBG");
        this.oPreviewCard = new Card(this.getId() + "--previewCard",{
            manifestApplied: this._setPreviewCardAriaText.bind(this, this.i18Bundle.getText('INT_DIALOG_TITLE_CardPreview')),
            width: "19rem",
            height: "35rem",
            host: this.host
        }).addStyleClass("sapMFlexBoxJustifyCenter");
        this.oInsightsColOverflowInnerHBox = new HBox(this.getId() + "--insightsColOverflowInnerHBox",{
        }).addStyleClass("insightsCardOverflowLayer insightsPreviewCardOverLay insightsColOverLayPositionLS");
        this.oInsightsColCardLayer = new HBox(this.getId() + "--insightsColCardLayer",{
            height: "0",
            items: [
                this.oInsightsColOverflowInnerHBox
            ]
        }).addStyleClass("insightsCardOverflowLayer insightsPreviewCardOverLay");
        this.oCardsPreviewVBox = new VBox(this.getId() + "--idCardsPreviewVBox",{
            height:"100%",
            alignItems:"Center",
            backgroundDesign:"Transparent",
            justifyContent:"SpaceAround",
            items: [
                this.oPreviewCard,
                this.oInsightsColCardLayer
            ]
        });
        this.oPreviewPanelContainer = new Panel(this.getId() + "--previewPanelContainer",{
            expanded:false,
            height:"100%",
            backgroundDesign:"Transparent",
            headerToolbar: [
                this.oPreviewPanelToolBar
            ],
            content: [
                this.oCardsPreviewVBox
            ]
        });
        this.oColCardsScroll = new ScrollContainer(this.getId() + "--colCardsScroll",{
            vertical:true,
            horizontal:false,
            height:"100%",
            content: [
                this.oPreviewPanelContainer
            ]
        });
        this.oColumnPreviewCardFlexbox = new FlexBox(this.getId() + "--columnPreviewCardFlexbox",{
            direction:"Column",
            width:"38%",
            height:"100%",
            renderType:"Bare",
            items: [
                this.oColCardsScroll
            ]
        }).addStyleClass("sapMPageBgStandard");
        this.oFlexContainerColumnContent = new VBox(this.getId() + "--flexContainerColumnContent",{
            height: "100%",
            width: "100%",
            direction: "Row",
            justifyContent: "SpaceBetween",
            items: [
                this.oEditColumnInsightsCardsFlex,
                this.oColumnPreviewCardFlexbox
            ]
        });
    };
    /**
     * Function to set the AriaText for Card Manifest
     * @param {String} sId Id
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._setPreviewCardAriaText = function(sId, oEvent) {
        var ariaText = oEvent.getSource()._ariaText.getText();
        var sTitle = this.i18Bundle.getText(sId);
        oEvent.getSource()._ariaText.setText(sTitle + ariaText);
    };
    /**
   * Called when we click on Card Preview button to show card Preview and set visiblity
   * @private
   * @experimental since 1.120
   */
    ColumnList.prototype._callPreview = function() {
        var oCardName , bDesktopMode;
        bDesktopMode = DeviceType.getDialogBasedDevice() !== AppConstants.DEVICE_TYPES.Desktop;
        if (bDesktopMode) {
            this.bShowPreview = true;
            this.oCardPreviewBtn.setVisible(false);
            this.oHideCardPreviewBtn.setVisible(true);
            this.oPreviewColCardVBox.setVisible(true);
            this.oPreviewColCardFlex.setVisible(true);
            this.oInsightsColumnEditFlexBox.setVisible(false);
            this.oColumnPreviewCardFlexbox.setVisible(false);
            this.oInsightsColumnEditVBox.setVisible(false);
            oCardName = bDesktopMode ? this.oPreviewColCardSD : this.oPreviewCard;
        }
        if (oCardName) {
            oCardName.refresh();
        }
    };
    /**
   * Called when we click on Hide Card Preview button to Hide card Preview and set visiblity
   * @private
   * @experimental since 1.120
   */
    ColumnList.prototype._callClosePreview = function() {
        this.bShowPreview = false;
        this.oHideCardPreviewBtn.setVisible(false);
        this.oCardPreviewBtn.setVisible(true);
        this.oPreviewColCardFlex.setVisible(false);
        this.oInsightsColumnEditFlexBox.setVisible(true);
        this.oColumnPreviewCardFlexbox.setVisible(false);
        this.oInsightsColumnEditVBox.setVisible(true);
    };
    /**
     * Function to call when we search in Search field
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._onColumnSearch = function(oEvent) {
        var sQuery = '';
        if (oEvent) {
          sQuery = oEvent.getSource().getValue();
        }
        var filter = new Filter("title", FilterOperator.Contains, sQuery);
        var aFilters = [];
        aFilters.push(filter);
        var oList = this.oInsightsCardsEditColumnsListTable;
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
    };
    /**
     * Function to refresh the Preview card for latest changes
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._refreshShowPreview = function() {
        this.bShowPreview = true;
        var bDesktopMode = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop;
        var oPreviewColCard = bDesktopMode ? this.oPreviewCard : this.oPreviewColCardSD;
        if (oPreviewColCard) {
            oPreviewColCard.refresh();
        }
    };
    /**
     * function is called when we perform Drag and Drop on Column list
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._onColumnDrop = function (oEvent) {
        var sInsertPosition = oEvent.getParameter("dropPosition"),
        oDragItem = oEvent.getParameter("draggedControl"),
        aDragItemPath = oDragItem.getBindingContextPath().split("/"),
            // to get the index of element - with getBindingContextPath will get a string like "/cardColumn/12"
        iDragItemIndex = Number(aDragItemPath[2]),
        oDropItem = oEvent.getParameter("droppedControl"),
        aDropItemPath = oDropItem.getBindingContextPath().split("/"),
        iDropItemIndex = Number(aDropItemPath[2]),
        oColumns = this.cardColumn;
        if (sInsertPosition === "Before" && iDragItemIndex === iDropItemIndex - 1) {
            iDropItemIndex--;
        } else if (sInsertPosition === "After" && iDragItemIndex === iDropItemIndex + 1) {
            iDropItemIndex++;
        }
        if (iDragItemIndex !== iDropItemIndex) {
            if (sInsertPosition === "Before" && iDragItemIndex < iDropItemIndex) {
                iDropItemIndex--;
            } else if (sInsertPosition === "After" && iDragItemIndex > iDropItemIndex) {
                iDropItemIndex++;
            }
            // take the moved item from dragIndex and add to dropindex
            var oItemMoved = oColumns.splice(iDragItemIndex, 1)[0];
            oColumns.splice(iDropItemIndex, 0, oItemMoved);
            this.cardColumn = oColumns;
            this._innerModel.setProperty("/cardColumn", this.cardColumn);
            //do auto refresh of card preview in desktop when columns selection change
            if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
                this._refreshShowPreview();
            }
        }
    };
    /**
     * function is called when we check or check the checkboxes of Column List
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._handleColumnVisibilityToggle =  function(oEvent) {
        var oEventParameters = oEvent.getSource();
        this.sColumnPath = oEventParameters
          .getBindingContext()
          .getPath();
        var oColumn = this._innerModel.getProperty(this.sColumnPath);
        var bToggleValue = oEventParameters.getSelected();
        oColumn["visible"] = bToggleValue;
        var oColumnCount = this.iVisibleColumnCount;
        this.iVisibleColumnCount = bToggleValue ? oColumnCount + 1 : oColumnCount - 1;
        if (this.oConfCard["sap.card"].content.row){
            this.oConfCard["sap.card"].content.row.columns = this.cardColumn;
        } else {
            this.oConfCard["sap.card"].content.item.attributes = this.cardColumn;
        }
        this._innerModel.setProperty("/visibleColumnCount", this.iVisibleColumnCount);
        if (this.iVisibleColumnCount > 0) {
            this.fireEnableAddButton({
                enableButton: true
            });
        } else {
            this.fireEnableAddButton({
                enableButton: false
            });
        }
        //do auto refresh of card preview in desktop when columns selection change
        if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
          this.oPreviewCard.setPreviewMode(this.iVisibleColumnCount > 0 ? 'Off' : 'Abstract');
          this._refreshShowPreview();
        } else {
            this.oPreviewColCardSD.setPreviewMode(this.iVisibleColumnCount > 0 ? 'Off' : 'Abstract');
        }
    };
    /**
     * function is called when we change the segmented button from Table to list or Vise versa
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._onSegmentedSelectionChange = function () {
        var oSegmentedButton = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop ? this.oColumnSegButton : this.oSdColumnSegButton,
            sSelectedKey = oSegmentedButton.getSelectedKey();
        if (sSelectedKey === "Table") {
            var aListCardTest = Transformations.createListOptions(this.oConfCard);
            var aCardTable = aListCardTest
                .filter(function (oCard) {
                    if (oCard) {
                        return oCard["sap.card"].type === "Table";
                    }
                });
            if (aCardTable.length) {
                this.oConfCard = aCardTable[0];
                var oColumns = aCardTable[0]["sap.card"].content.row.columns;
                this.cardColumn = oColumns;
            }
        } else if (sSelectedKey === "List") {
            var aTabCardTest = Transformations.createTableOptions(this.oConfCard);
            var aCardList = aTabCardTest
                .filter(function (oCard) {
                    if (oCard) {
                        return oCard["sap.card"].type === "List";
                    }
                });
            if (aCardList.length) {
                this.oConfCard = aCardList[0];
                var aAttributes = aCardList[0]["sap.card"].content.item.attributes;
                this.cardColumn = aAttributes;
            }
        }
        this._innerModel.setProperty("/cardColumn", this.cardColumn);
        var bDesktopMode = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop;
        var oPreviewColCard = bDesktopMode ? this.oPreviewCard : this.oPreviewColCardSD;
        if (oPreviewColCard) {
            oPreviewColCard.setManifest(this.oConfCard);
        }
    };
    /**
     * function is called to set the Card Columns and Visible Column count value
     * @param {Object} oCard  card Manifest
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._setCardColumnValue = function(oCard) {
        var oSapCard = oCard["sap.card"];
        if (oSapCard.type === "Table") {
            var oColumns;
            oColumns = oSapCard.content.row.columns;
            this.cardColumn = oColumns;
            var aVisibleColumns = oColumns
                .map(function (oCol) {
                    oCol["visible"] = oCol["visible"] ? oCol["visible"] : false;
                    return oCol;
                })
                .filter(function (oColumn) {
                    return oColumn.visible;
                });
            this.iVisibleColumnCount = aVisibleColumns.length;
            this._innerModel.setProperty("/visibleColumnCount", this.iVisibleColumnCount);
            var aCardTest = Transformations.createTableOptions(this.oConfCard);
            var aCardList = aCardTest
                .filter(function (oCard) {
                    return oCard["sap.card"].type === "List";
                });
            if (aCardList.length) {
                this.oConfCard = aCardList[0];
                var aAttributes = aCardList[0]["sap.card"].content.item.attributes;
                this.cardColumn = aAttributes;
            }
            this._innerModel.setProperty("/cardColumn", this.cardColumn);
            this.oInsightsCardsEditColumnsListTable.bindAggregation("items", {
                path: "/cardColumn",
                factory: this._generateTableColumnsTemplate.bind(this)
            });
        }
    };
    /**
     * function is called to generate the Tbale Template and add cells to it.
     * @returns {Object} oColumnListItem which includes list items and checkbox
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._generateTableColumnsTemplate = function() {
        var oColumnListItem = new ColumnListItem({
        });
        var oCheckBoxCell = new HBox({
            items: [
                new Icon({
                    src: "sap-icon://BusinessSuiteInAppSymbols/icon-grip"
                }).addStyleClass("insightsDndIcon"),
                new CheckBox({
                    selected: "{= ${visible} ? true : false}",
                    enabled: "{= !(!${visible} && (${/visibleColumnCount} > 2)) ? true : false}",
                    select: this._handleColumnVisibilityToggle.bind(this)
                })]
        }).addStyleClass("sapUiNoPadding");
        var oColObjectIdentifier =  new ObjectIdentifier({
            title:"{title}",
            tooltip:"{title}"
        }).addStyleClass("sapUiNoPadding");
        oColumnListItem.addCell(oCheckBoxCell);
        oColumnListItem.addCell(oColObjectIdentifier);
        return oColumnListItem;
    };
    /**
     * Function to call when we change or adjust the size of Device View and set the visibility of few static controls
     *
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._adjustLayoutStyles = function () {
        if (DeviceType.getDialogBasedDevice() !== AppConstants.DEVICE_TYPES.Desktop){
            this.bDesktop = false;
            if (this.bShowPreview === true) {
                this.oCardPreviewBtn.setVisible(false);
                this.oHideCardPreviewBtn.setVisible(true);
                this.oPreviewColCardFlex.setVisible(true);
                this.oInsightsColumnEditFlexBox.setVisible(false);
                this.oInsightsColumnEditVBox.setVisible(false);
            } else {
                this.oCardPreviewBtn.setVisible(true);
                this.oHideCardPreviewBtn.setVisible(false);
                this.oPreviewColCardFlex.setVisible(false);
                this.oInsightsColumnEditFlexBox.setVisible(true);
                this.oInsightsColumnEditVBox.setVisible(true);
                this.oEditColumnInsightsCardsFlex.setWidth('100%');
            }
            this.oColumnPreviewCardFlexbox.setVisible(false);
            this.oPreviewColCardSD.setManifest(this.oConfCard);
            this.oColumnSearch.setWidth("90%");
            this.oEditColumnsTableCheckBox.setWidth("20%");
            this.oEditColumnsName.setWidth("80%");
            this.oSdColumnSegButton.setSelectedKey(this.oConfCard["sap.card"].type);
            this.oPreviewColCardSD.refresh();
        } else {
            this.bDesktop = true;
            this.oColumnSearch.setWidth("100%");
            this.oEditColumnsTableCheckBox.setWidth("10%");
            this.oEditColumnsName.setWidth("90%");
            this.oPreviewCard.setManifest(this.oConfCard);
            this.oColumnSegButton.setSelectedKey(this.oConfCard["sap.card"].type);
            this.oCardPreviewBtn.setVisible(false);
            this.oHideCardPreviewBtn.setVisible(false);
            this.oPreviewColCardFlex.setVisible(false);
            this.oInsightsColumnEditVBox.setVisible(true);
            this.oInsightsColumnEditFlexBox.setVisible(true);
            this.oColumnPreviewCardFlexbox.setVisible(true);
            this.oPreviewCard.refresh();
        }
        var bPreviewColCardVisibility = !this.bDesktop && this.bShowPreview;
        this.oPreviewColCardVBox.setVisible(bPreviewColCardVisibility ? true : false);
        this.oPreviewColCardFlex.setVisible(bPreviewColCardVisibility ? true : false);
    };
    /**
     * Function is called to set the initial card configurations.
     * @param {Object} oCard card manifest
     * @private
     * @experimental since 1.120
     */
    ColumnList.prototype._initConfigureCard = function(oCard) {
        var oOrgCard = oCard,
            oConfCard;
        var oSelectionView = Element.getElementById("myhomeSettingsView--INSIGHTS_CARDS");
        this.oOrgCard = oOrgCard;
        oConfCard = JSON.parse(JSON.stringify(oOrgCard)); // Deep copy original card
        //create card without actions
        oConfCard = CardPreviewManager.getCardPreviewManifest(oConfCard);
        this.oConfCard = oConfCard;
        this.iVisibleColumnCount = 0;
        if (oConfCard) {
            var oSapCard = oConfCard["sap.card"];
            if (oSapCard.type === "Table") {
                var oSegButton = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop ? this.oColumnSegButton : this.oSdColumnSegButton;
                oSegButton.setSelectedKey(this.oManifest["sap.card"].type);
                this._setCardColumnValue(oConfCard, oSelectionView);
            }
        }
    };
    return ColumnList;
});
