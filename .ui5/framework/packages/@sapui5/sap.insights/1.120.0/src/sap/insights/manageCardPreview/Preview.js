
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Input",
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
    "sap/ui/model/resource/ResourceModel",
    "../utils/DeviceType",
    "../utils/Transformations",
    "sap/ui/Device",
    "sap/m/MessageStrip",
    "../utils/AppConstants",
    "sap/ui/core/Lib",
    "sap/ui/layout/form/SimpleFormLayout"
], function(Control, SimpleForm, Input, Label, Title, Text, VBox, Page,
    FlexBox, ScrollContainer, Toolbar, HBox, Card, Panel, Button, ResourceModel, DeviceType, Transformations, Device, MessageStrip, AppConstants, CoreLib, SimpleFormLayout) {

    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    /**
	 * Constructor for  Preview control.
	 *
	 * @class
	 * This control helps the user to change the Title and Subtitle of the card and Preview it simultaneously
	 * @extends sap.ui.core.Control
	 * @private
   *
   * @since 1.120
   *
   * @alias sap.insights.manageCardPreview.Preview
	 */
    var Preview = Control.extend("sap.insights.manageCardPreview.Preview", {
        metadata: {
            properties: {
                /**
               * Sets the manifest of the currently viewed card in card details
               */
                "manifest": {
                    type: "string",
                    group: "Behavior",
                    defaultValue: ""
                },
                /**
                 * cardMessageInfo is an Object which contains message Strip info including type and text
                 */
                "cardMessageInfo": {
                    type: "object",
                    group: "Appearance",
                    defaultValue: null
                },
                /**
                 * transformation indicates whether the card is Overview Page or Table/List (LROP)
                 */
                "transformation": {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false
                }
            },
            aggregations: {
                /**
                 * Hidden aggregation of page control.
                 */
                "_page": { type: "sap.m.Page", multiple: false, visibility: "hidden" }
            },
            events: {
                /**
               * Is fired when one of the following happens:
               * 1. when user provide invalid title for title.
               */
                titleCheck: {
                    parameters: {
                        enableButton: {
                            type: "boolean"
                        }
                    }
                }
            }
        },
        renderer: {
            apiVersion: 2,
            render: function(oRm, oPreview) {
                oRm.openStart("div", oPreview);
                oRm.style("height", "100%");
                oRm.style("width", "100%");
                oRm.openEnd();
                oRm.renderControl(oPreview.getAggregation("_page"));
                oRm.close("div");
            }
        }
    });
    /**
		 * Initializes the control.
		 */
    Preview.prototype.init = function(){
        this.bInitialPreviewLoad = true;
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        Device.resize.attachHandler(this._adjustLayoutStyles.bind(this));
        this.oParentPage = new Page(this.getId() + "--insightCardPreviewPage",{
            title:this.i18Bundle.getText("INT_PREVIEW_POPOVER_BUTTON_TITLE"),
            titleLevel:"H1",
            showHeader:true,
            showSubHeader:true,
            backgroundDesign:"List",
            enableScrolling:false,
            headerContent:[],
            content: []
        }).addStyleClass("sapMPageBgStandard");
        this.setAggregation("_page", this.oParentPage);
        this.createStaticControls();
        this.oParentPage.addHeaderContent(this.oCardPreviewBtn);
        this.oParentPage.addHeaderContent(this.oHideCardPreviewBtn);
        this.oParentPage.addContent(this.oDefaultVBox);
    };
    /**
		 * Called before the control is rendered.
     */
    Preview.prototype.onBeforeRendering = function () {
        this.bShowCardPreview = false;
        this.oManifest = this.getManifest();
        if (this.oManifest) {
            this.oManifest = JSON.parse(this.oManifest);
        }
        this.oTitleTextInput.setValue(this.oManifest['sap.card'].header.title);
        this.oSubTitleTextInput.setValue(this.oManifest['sap.card'].header.subTitle);
        this._formatTitle(this.oTitleTextInput.getValue());
        this._adjustLayoutStyles();
        this.oInsightsPreviewOverflowLayerSD.setVisible(this.oManifest['sap.card'].type  === 'Analytical' ? false : true);
        this.oInsightsCardOverflowLayer.setVisible(this.oManifest['sap.card'].type  === 'Analytical' ? false : true);
    };
    /**
		 * Called for initialising static controls within the card details
     * All static controls will only be called during initialisation, dynamic values bound to these controls
     * will be updated before rendering of the control
     * @private
     * @experimental since 1.120
		 */
    Preview.prototype.createStaticControls = function () {
        // Card Preview Button
        this.oCardPreviewBtn = new Button(this.getId() + 'cardPreviewId',{
            text: this.i18Bundle.getText("INT_DIALOG_CardPreview"),
            press: this._callPreview.bind(this),
            enabled: true
        });
        // Hide Card Preview Button
        this.oHideCardPreviewBtn = new Button(this.getId() + "hideCardPreviewId",{
            text: this.i18Bundle.getText("INT_DIALOG_HidePreview"),
            press: this._callClosePreview.bind(this),
            enabled: true
        });
        //preview title
        this.oDefaultTitle = new Title(this.getId() + "--defaultTitle",{
            text: this.i18Bundle.getText("INT_CARD_TITLEINFO"),
            level: "H4"
        }).addStyleClass("sapUiSmallMarginTop");
        //preview subtitle
        this.oDefaultSubText = new Label(this.getId() + "--defaultSubText",{
            wrapping: true
        });
        //VBox for title and SubTitle
        this.oDefaultInfoVBox = new VBox(this.getId() + "--defaultInfoVBox",{
            direction: "Column",
            items: [
                this.oDefaultTitle, this.oDefaultSubText
            ]
        }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginEnd");
        //Card Title Label
        this.oLabelTitle = new Label(this.getId() + "--labelTitle",{
            text: this.i18Bundle.getText("INT_Preview_CARDTITLE"),
            required: true,
            labelFor: "titleTextInput"
        }).addStyleClass("sapUiTinyMarginTop");
        //Card Title Input field
        this.oTitleTextInput = new Input(this.getId() + "--titleTextInput",{
            ariaLabelledBy: "defaultTitle defaultSubText labelTitle",
            change: this._handleTitleChange.bind(this)
        });
        //card SubTitle label
        this.oLabelSubTitle = new Label(this.getId() + "--labelSubTitle",{
            text: this.i18Bundle.getText("INT_Preview_SubTitleTitleField_Label"),
            required: false,
            labelFor: "subTitleTextInput"
        }).addStyleClass("sapUiTinyMarginTop");
        //Card SubTitle Input field
        this.oSubTitleTextInput = new Input(this.getId() + "--subTitleTextInput",{
            change: this._handleSubTitleChange.bind(this)
        });
        //Simple Form which includes title label, Subtitle label, input field for title and subtitle
        this.oSimpleForm = new SimpleForm(this.getId() + "--defaultPreviewForm",{
            width:"100%",
            layout:SimpleFormLayout.ColumnLayout,
            editable: true,
            adjustLabelSpan: true,
            labelSpanXL: 12,
            labelSpanL: 12,
            labelSpanM: 12,
            labelSpanS: 12,
            content: [
                this.oLabelTitle, this.oTitleTextInput, this.oLabelSubTitle, this.oSubTitleTextInput
            ]
        });
        //VBox for SimpleForm
        this.oDefaultPreviewFormFlex = new VBox(this.getId() + "--defaultPreviewFormFlex",{
            height: "100%",
            width: "100%",
            items: [
                this.oSimpleForm
            ]
        });
        //Preview Card for Small Device
        this.oDefaultPreviewCardSD = new Card(this.getId() + "--defaultPreviewCardSD",{
            manifestApplied: this._setAriaTextOnManifest.bind(this),
            width: "19rem",
            height: "33rem"
        }).addStyleClass("sapUiTinyMarginBeginEnd");
        this.oInsightsPreviewOverflowInnerHBoxSD = new HBox(this.getId() + "--insightsPreviewOverflowInnerHBoxSD",{
        }).addStyleClass("insightsCardOverflowLayer insightsPreviewCardOverLay insightsPreviewOVPOverLayPositionSD");
        this.oInsightsPreviewOverflowLayerSD = new HBox(this.getId() + "--insightsPreviewOverflowLayerSD",{
            height: "0",
            items: [
                this.oInsightsPreviewOverflowInnerHBoxSD
            ]
        }).addStyleClass("sapMFlexBoxJustifyCenter");
        //VBox for Preview Card in small device
        this.oDefaultPreviewCardVBox = new VBox(this.getId() + "--defaultPreviewCardVBox",{
            width: "100%",
            height: "100%",
            alignItems: "Center",
            backgroundDesign: "Transparent",
            justifyContent: "SpaceAround",
            items: [
                this.oDefaultPreviewCardSD, this.oInsightsPreviewOverflowLayerSD
            ]
        }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom");
        this.oDefaultPreviewScrollSD = new ScrollContainer(this.getId() + "--defaultPreviewScrollSD",{
            vertical: true,
            horizontal: false,
            height: "100%",
            content: [
                this.oDefaultPreviewCardVBox
            ]
        });
        this.oDefaultPreviewFlexBox = new FlexBox(this.getId() + "--defaultPreviewFlexBox",{
            height: "100%",
            width: "100%",
            visible: false,
            justifyContent: "Center",
            items: [
                this.oDefaultPreviewScrollSD
            ]
        });
        //Message Strip
        this.oMessageStrip = new MessageStrip(this.getId() + "--messageStripId",{
            showIcon: true,
            showCloseButton: false
        }).addStyleClass("sapUiSmallMargin");
        //VBox for MessageStrip
        this.oCardMessageStrip = new VBox(this.getId() + "--cardMessageId",{
            items: [
                this.oMessageStrip
            ]
        });
        this.oDefaultFlexBox = new FlexBox(this.getId() + "--defaultFlexBox",{
            height: "100%",
            direction: "Column",
            items: [
                this.oDefaultInfoVBox,
                this.oCardMessageStrip,
                this.oDefaultPreviewFormFlex,
                this.oDefaultPreviewFlexBox
            ]
        });
        this.oDefaultPreviewCardText = new Title(this.getId() + "--defaultPreviewCardText",{
            text: this.i18Bundle.getText("INT_DIALOG_TITLE_CardPreview"),
            textAlign: "Left"
        }).addStyleClass("sapUiTinyMarginTop");
        this.oDefaultPreviewHBox = new HBox(this.getId() + "--defaultPreviewHBox",{
            width: "100%",
            justifyContent: "Start",
            backgroundDesign: "Transparent",
            items: [
                this.oDefaultPreviewCardText
            ]
        }).addStyleClass("sapUiTinyMarginBegin");
        this.oDefaultPreviewToolBar = new Toolbar(this.getId() + "--defaultPreviewToolBar",{
            width: "100%",
            height: "2.7rem",
            style: "Clear",
            design: "Auto",
            content: [
                this.oDefaultPreviewHBox
            ]
        }).addStyleClass("sapThemeBaseBG");
        this.oInsightsCardOverflowInnerHBox = new HBox(this.getId() + "--insightsCardOverflowInnerHBox",{
        }).addStyleClass("insightsCardOverflowLayer insightsPreviewCardOverLay insightsPreviewOVPOverLayPositionLS");
        this.oDefaultPreviewCardLS = new Card(this.getId() + "--defaultPreviewCardLS",{
            manifestApplied: this._setAriaTextOnManifest.bind(this),
            width: "19rem",
            height: "33rem"
        });
        this.oInsightsCardOverflowLayer = new HBox(this.getId() + "--insightsCardOverflowLayer",{
            height: "0",
            items: [
                this.oInsightsCardOverflowInnerHBox
            ]
        }).addStyleClass("sapMFlexBoxJustifyCenter");
        this.oDefaultPreviewVBox = new VBox(this.getId() + "--defaultPreviewVBox",{
            height: "100%",
            alignItems: "Center",
            backgroundDesign: "Transparent",
            justifyContent: "SpaceAround",
            items: [
                this.oDefaultPreviewCardLS,
                this.oInsightsCardOverflowLayer
            ]
        });
        this.oDefaultPreviewPanel = new Panel(this.getId() + "--defaultPreviewPanel",{
            expanded: false,
            height: "100%",
            backgroundDesign: "Transparent",
            content: [
                this.oDefaultPreviewVBox
            ]
        });
        this.oDefaultPreviewPanelFlex = new FlexBox(this.getId() + "--defaultPreviewPanelFlex",{
            height: "calc(100% - 2.8rem)",
            backgroundDesign: "Transparent",
            justifyContent: "Center",
            items: [
                this.oDefaultPreviewPanel
            ]
        });
        this.oDefaultPreviewScroll = new ScrollContainer(this.getId() + "--defaultPreviewScroll",{
            vertical: true,
            horizontal: false,
            height: "100%",
            content: [
                this.oDefaultPreviewToolBar,
                this.oDefaultPreviewPanelFlex
            ]
        });
        this.oPreviewFlexBox = new FlexBox(this.getId() + "--defaultPreviewFlex",{
            height: "100%",
            width: "38%",
            direction: "Column",
            renderType: "Bare",
            items: [
                this.oDefaultPreviewScroll
            ]
        }).addStyleClass("sapMPageBgStandard");
        this.oDefaultVBox = new VBox(this.getId() + "--defaultVBox",{
            height: "100%",
            width: "100%",
            direction: "Row",
            justifyContent: "SpaceBetween",
            items: [
                this.oDefaultFlexBox,
                this.oPreviewFlexBox
            ]
        });
    };
    /**
   * Called for initialising the PreviewMode for Card
   * @public
   * @experimental since 1.120
   */
    Preview.prototype.setPreviewModeOfCard = function () {
        var bDesktopMode = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop;
        var previewCard = bDesktopMode ? this.oDefaultPreviewCardLS : this.oDefaultPreviewCardSD;
        if (previewCard && this.getTransformation() && (this.oManifest['sap.card'].type === "Table" || this.oManifest['sap.card'].type === "List")) {
            previewCard.setPreviewMode('Abstract');
        } else {
            previewCard.setPreviewMode('Off');
        }
    };
    /**
   * Called for setting the text, type and visibility for Card
   * @private
   * @experimental since 1.120
   */
    Preview.prototype._setCardMessageInfo = function () {
        var oCardMessageInfo = this.getCardMessageInfo();
        if (oCardMessageInfo && oCardMessageInfo.text && oCardMessageInfo.text.trim() !== '' ) {
            if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
                this.oCardMessageStrip.setVisible(true);
            } else {
                this.oCardMessageStrip.setVisible(this.bShowCardPreview ? false : true);
            }
            if (this.oMessageStrip) {
                this.oMessageStrip.setText( oCardMessageInfo.text);
                this.oMessageStrip.setType( oCardMessageInfo.type);
            }
        } else {
            oCardMessageInfo = null;
            this.oCardMessageStrip.setVisible(false);
        }
    };
    /**
   * Called when we click on Card Preview button to show card Preview and set visiblity
   * @private
   * @experimental since 1.120
   */
    Preview.prototype._callPreview = function() {
        this.bShowCardPreview = true;
        this.oCardPreviewBtn.setVisible(false);
        this.oHideCardPreviewBtn.setVisible(true);
        this.oDefaultInfoVBox.setVisible(false);
        this.oDefaultPreviewFormFlex.setVisible(false);
        this.oDefaultPreviewFlexBox.setVisible(true);
        if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
            this.oDefaultPreviewCardLS.refresh();
        } else {
            this.oDefaultPreviewCardSD.refresh();
        }
        this._setCardMessageInfo();
    };
    /**
   * Called when we click on Hide Card Preview button to Hide card Preview and set visiblity
   * @private
   * @experimental since 1.120
   */
    Preview.prototype._callClosePreview = function() {
        this.bShowCardPreview = false;
        this.oCardPreviewBtn.setVisible(true);
        this.oHideCardPreviewBtn.setVisible(false);
        this.oDefaultInfoVBox.setVisible(true);
        this.oDefaultPreviewFormFlex.setVisible(true);
        this.oDefaultPreviewFlexBox.setVisible(false);
        this._setCardMessageInfo();
    };
    /**
     * Function to call when we change the title field and show in Card Preview
     * @param {Object} oEvent oEvent
     * and fire a event to enable or disable the Next/Add Button
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._handleTitleChange = function (oEvent) {
        var oTitleInput = oEvent.getSource();
        var sTitleText = oTitleInput.getValue().trim();
        var oCard;
        if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
            oCard = this.oDefaultPreviewCardLS;
        } else {
            oCard = this.oDefaultPreviewCardSD;
        }
        if (oCard.getCardHeader()) {
            this.oManifest['sap.card'].header.title = sTitleText;
            this.bInitialPreviewLoad = true;
        }
        if (sTitleText) {
            oTitleInput.setValueState("None");
            oTitleInput.setValueStateText("");
            this.fireTitleCheck({
                enableButton: true
            });
        } else {
            oTitleInput.setValueState("Error");
            oTitleInput.setValueStateText(this.i18Bundle.getText("INT_Preview_Title_ValueStateText"));
            this.fireTitleCheck({
                enableButton: false
            });
        }
        this.setManifest(JSON.stringify(this.oManifest));
        oCard.refresh();
    };
    /**
     * Function to call when we change the Subtitle field and show in Card Preview
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._handleSubTitleChange = function(oEvent) {
        var oSubTitleInput = oEvent.getSource();
        var sSubTitleText = oSubTitleInput.getValue();
        var oCard;
        if ( DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
          oCard = this.oDefaultPreviewCardLS;
        } else {
          oCard = this.oDefaultPreviewCardSD;
        }
        if (oCard.getCardHeader()) {
          this.oManifest['sap.card'].header.subTitle = sSubTitleText;
          this.bInitialPreviewLoad = true;
        }
        oCard.refresh();
        this.setManifest(JSON.stringify(this.oManifest));
    };
    /**
     * Function to call when we change or adjust the size of Device View and set the visibility of few static controls
     *
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._adjustLayoutStyles = function () {
        if (DeviceType.getDialogBasedDevice() !== AppConstants.DEVICE_TYPES.Desktop) {
            if (this.bShowCardPreview) {
                this.oDefaultInfoVBox.setVisible(false);
                this.oDefaultPreviewFormFlex.setVisible(false);
                this.oDefaultPreviewFlexBox.setVisible(true);
                this.oCardPreviewBtn.setVisible(false);
                this.oHideCardPreviewBtn.setVisible(true);
            } else {
                this.oDefaultPreviewFlexBox.setVisible(false);
                this.oDefaultInfoVBox.setVisible(true);
                this.oDefaultPreviewFormFlex.setVisible(true);
                this.oCardPreviewBtn.setVisible(true);
                this.oHideCardPreviewBtn.setVisible(false);
            }
            this.oPreviewFlexBox.setVisible(false);
            this.oDefaultPreviewCardSD.setManifest(this._setCardTypeForColumn(this.oManifest));
            this.oDefaultPreviewCardSD.refresh();
            this.oDefaultPreviewFormFlex.setWidth('100%');
            this.oDefaultFlexBox.setWidth('100%');
        } else {
            this.oPreviewFlexBox.setVisible(true);
            this.oDefaultInfoVBox.setVisible(true);
            this.oDefaultPreviewFormFlex.setVisible(true);
            this.oDefaultPreviewFlexBox.setVisible(false);
            this.oCardPreviewBtn.setVisible(false);
            this.oHideCardPreviewBtn.setVisible(false);
            this.oDefaultPreviewFormFlex.setWidth('50%');
            this.oDefaultFlexBox.setWidth('62%');
            this.oDefaultPreviewCardLS.setManifest(this._setCardTypeForColumn(this.oManifest));
            this.oDefaultPreviewCardLS.refresh();
        }
        this._setCardMessageInfo();
    };
    /**
     * This is to set the Card type for loading card
     * @param {object} oCard Card manifest which to be shown as loading
     * @returns {object}
     *
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._setCardTypeForColumn = function (oCard) {
        if (oCard["sap.card"].type === "Table" && this.bInitialPreviewLoad && this.getTransformation()) {
            var aCardTest = Transformations.createTableOptions(oCard);
            var aCardList = aCardTest
                .filter(function (oCard) {
                    return oCard["sap.card"].type === "List";
                });
            if (aCardList.length) {
                oCard = aCardList[0];
            }
            this.bInitialPreviewLoad = false;
        }
        return oCard;
    };
    /**
     * Function to set the AriaText for Card Manifest
     * @param {Object} oEvent oEvent
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._setAriaTextOnManifest = function(oEvent) {
        var ariaText = oEvent.getSource()._ariaText.getText();
        var sTitle = this.i18Bundle.getText('INT_DIALOG_TITLE_CardPreview');
        oEvent.getSource()._ariaText.setText(sTitle + ariaText);
    };
    /**
     * Called to format the title ,  state the state of input Field and fire Title check event.
     * @param {String} sTitle, title from input field.
     * @private
     * @experimental since 1.120
     */
    Preview.prototype._formatTitle = function(sTitle) {
        var oControl = this.oTitleTextInput;
        if (sTitle && sTitle.trim()) {
            oControl.setValueState("None");
            oControl.setValueStateText("");
            this.fireTitleCheck({
                enableButton: true
            });
        } else {
            oControl.setValueState("Error");
            oControl.setValueStateText(this.i18Bundle.getText("INT_Preview_Title_ValueStateText"));
            this.fireTitleCheck({
                enableButton: false
            });
        }
    };
    return Preview;
});
