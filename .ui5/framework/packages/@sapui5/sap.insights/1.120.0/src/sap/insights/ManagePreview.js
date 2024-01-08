
/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/NavContainer",
    "sap/insights/CardHelper",
    "sap/insights/manageCardPreview/Preview",
    "sap/insights/manageCardPreview/ColumnListPreview",
    "sap/insights/manageCardPreview/HouseOfCards",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/ui/model/resource/ResourceModel",
    "./utils/CardPreviewManager",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "./utils/DeviceType",
    "sap/base/Log",
    "sap/insights/utils/AppConstants",
    "sap/ui/core/Lib",
    "sap/ui/performance/trace/FESRHelper"
], function (
    Control,
    NavContainer,
    CardHelper,
    Preview,
    ColumnListPreview,
    HouseOfCards,
    Button,
    Dialog,
    ResourceModel,
    CardPreviewManager,
    MessageToast,
    MessageBox,
    DeviceType,
    Log,
    AppConstants,
    CoreLib,
    FESRHelper
) {
    "use strict";
    var I18_BUNDLE = CoreLib.getResourceBundleFor("sap.insights");
    var oLogger = Log.getLogger("sap.insights.ManagePreview");
    /**
     * Constructor for  ManagePreview control.
     *
     * @class
     * This control is wrapper for and opens a dialog for add cards to insight
     * @extends sap.ui.core.Control
     * @private
     *
     * @since 1.120
     *
     * @alias sap.insights.ManagePreview
     */
    var ManagePreview = Control.extend("sap.insights.ManagePreview", {
        metadata: {
            properties: {
                /**
                 * Sets the manifest of the currently viewed card in card details
                 */
                "manifest": {
                    type: "object",
                    group: "Behavior",
                    defaultValue: null
                },
                /**
                 * transformation indicates whether the card is Overview Page or Table/List (LROP)
                 */
                "transformation": {
                    type: "boolean",
                    group: "Behavior",
                    defaultValue: false
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
                 * confirmButtonText contains the text to be shown on th confirm button
                 * if not passed the default text 'Add' is shown
                 */
                "confirmButtonText": {
                    type: "string",
                    group: "Appearance",
                    defaultValue: ''
                }
            },
            aggregations: {
                /**
                 * Hidden aggregation of dialog control which opens when openPreviewDialog() is called for this control
                 */
                _manageDialog: {
                    type: "sap.m.Dialog",
                    multiple: false,
                    visibility: "hidden"
                }
            },
            events: {
                /**
                 * onConfirmButtonPress event triggerd when the confirm button is pressed
                 * if not passed the default add card to my home happens
                 */
                onConfirmButtonPress: {
                    parameters: {
                        /**
                         * Manifest to be passed as a string
                         */
                        manifest: { type: "string" }
                    }
                }
            }
        }
    });
    /**
     * Initializes the control.
     * @returns {void}
     */
    ManagePreview.prototype.init = function () {
        this.i18Bundle = new ResourceModel({ bundle: I18_BUNDLE }).getResourceBundle();
        this._createStaticControls();
        //Instantiate NavContainer creation
        this._oNavContainer = new NavContainer(this.getId() + "selectionNavCon");
        this._oManageDialog = new Dialog(this.getId() + "--insightsListDialog", {
            contentHeight: "42.8rem",
            contentWidth: "65.6rem",
            verticalScrolling: false,
            horizontalScrolling: false,
            resizable: false,
            draggable: true,
            showHeader: false,
            afterClose: this._afterCloseDialog.bind(this),
            content: [
                this._oNavContainer
            ],
            buttons: [
                this.oBackButton,
                this.oAddButton,
                this.oNextButton,
                this.oCancelButton
            ]
        }).addStyleClass("sapContrastPlus dialogScrollPadding");
    };
    /**
     * Handler when the dialog is closed
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._afterCloseDialog = function () {
        this.oManifest = {};
        this._oPreviewPage.setManifest({});
        this._oPreviewPage.setCardMessageInfo(null);
        this._oPreviewPage.bInitialPreviewLoad = true;
        this.setConfirmButtonText(null);
        if (this.getTransformation()) {
            if (this._oColumnListPreview) {
                this._oColumnListPreview.bShowPreview = false;
                this._oColumnListPreview.bDialogOpen = false;
                this._oColumnListPreview.oConfCard = {};
                this._oColumnListPreview.oOrgCard = {};
                if (this._oColumnListPreview.oColumnSearch) {
                    this._oColumnListPreview.oColumnSearch.setValue('');
                }
            }
            if (this._oHouseOfCards) {
                this._oHouseOfCards._innerHocModel.setData({
                    oSelected: {},
                    aCards: [],
                    aPreviewCards: [1, 2, 3],
                    aAllowedChartTypes: [],
                    sOriginalChartType: "",
                    selectedPath: ""
                });
            }
        }
    };
    /**
     * Setter for the ConfirmButtonText property
     * @param {string} sConfirmButtonText
     * @returns {void}
     *
     * @public
     * @experimental since 1.120
     */
    ManagePreview.prototype.setConfirmButtonText = function (sConfirmButtonText) {
        this.setProperty("confirmButtonText", sConfirmButtonText);
        this.oAddButton.setText(sConfirmButtonText);
    };
    /**
     * Creates static controls while initializing the control
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._createStaticControls = function () {
        this.oBackButton = new Button(this.getId() + "--backButton", {
            text: this.i18Bundle.getText("INT_DIALOG_BACK"),
            press: this._onNavBack.bind(this)
        });
        this.oAddButton = new Button(this.getId() + "--addButton", {
            text: this.getConfirmButtonText() ? this.getConfirmButtonText() : this.i18Bundle.getText("INT_DIALOG_Ok"),
            press: this._save.bind(this),
            type: "Emphasized",
            enabled: false
        });
        FESRHelper.setSemanticStepname(this.oAddButton, "press", AppConstants.FESR_STEP_NAME);
        this.oNextButton = new Button(this.getId() + "--nextButton", {
            text: this.i18Bundle.getText("INT_DIALOG_NEXT"),
            press: this._callNextPage.bind(this),
            type: "Emphasized",
            enabled: false
        });
        this.oCancelButton = new Button(this.getId() + "--cancelButton", {
            text: this.i18Bundle.getText("INT_DIALOG_CANCEL"),
            press: this._closeDialog.bind(this)
        });
    };
    /**
     * Enables/disables the footer buttons
     * @param {sap.ui.base.Event} oEvent
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._setEnableButton = function (oEvent) {
        if (this.getTransformation() && !this.bColumnPage) {
            this.oNextButton.setEnabled(oEvent.getParameter('enableButton'));
        } else {
            this.oAddButton.setEnabled(oEvent.getParameter('enableButton'));
        }
    };
    /**
     * Opens the dialog for manage preview/add card to insights
     * @returns {void}
     *
     * @public
     * @experimental since 1.120
     */
    ManagePreview.prototype.openPreviewDialog = function () {
        this.oManifest = this.getManifest();
        this.oBackButton.setVisible(false);
        var sAddButtonText = this.getConfirmButtonText() ? this.getConfirmButtonText() : this.i18Bundle.getText("INT_DIALOG_Ok");
        this.oAddButton.setText(sAddButtonText);
        this._showPreview(this.oManifest);
        if (this.getTransformation()) {
            this.oAddButton.setVisible(false);
            this.oNextButton.setVisible(true);
        } else {
            this.oAddButton.setVisible(true);
            this.oNextButton.setVisible(false);
        }
    };
    /**
     * Creates ColumnListPreview control if the card type is list/table
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._createColumnListDialog = function () {
        //creating column list dialog
        if (!this._oColumnListPreview) {
            this._oColumnListPreview = new ColumnListPreview({
                enableAddButton: this._setEnableButton.bind(this)
            });
        }
        this._oColumnListPreview.setManifest(this._oPreviewPage.getManifest());
        this._oNavContainer.addPage(this._oColumnListPreview);
        this._oNavContainer.to(this._oColumnListPreview);
        if (DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop) {
            this._oColumnListPreview.oPreviewCard.setPreviewMode(this._oColumnListPreview.iVisibleColumnCount > 0 ? 'Off' : 'Abstract');
            this._oColumnListPreview._refreshShowPreview();
        } else {
            this._oColumnListPreview.oPreviewColCardSD.setPreviewMode(this._oColumnListPreview.iVisibleColumnCount > 0 ? 'Off' : 'Abstract');
        }
    };
    /**
     * Creates HouseOfCards control if the card type is analytical
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._createHocDialog = function () {
        if (!this._oHouseOfCards) {
            this._oHouseOfCards = new HouseOfCards({});
        }
        this._oHouseOfCards.setManifest(this._oPreviewPage.getManifest());
    };
    /**
     * Handler for the confirm button
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._save = function (oEvent) {
        var oCard = JSON.parse(this._oPreviewPage.getManifest());
        if (this._oColumnListPreview) {
            oCard = this._oColumnListPreview.oConfCard;
        } else if (this._oHouseOfCards) {
            oCard = this._oHouseOfCards._oConfCard;
        }
        if (this.hasListeners("onConfirmButtonPress")) {
            this.fireOnConfirmButtonPress({ manifest: oCard });
            this._closeDialog();
        } else if (oCard["sap.card"].header.title) {
            var bIsCardVis = oCard["sap.insights"].visible;
            oCard["sap.insights"].visible = true;
            this._oManageDialog.setBusy(true);
            var oCardwAction = CardPreviewManager.insertActionsManifest(oCard, this.oManifest);
            CardHelper.getServiceAsync().then(function (oCardHelperServiceInstance) {
                oCardHelperServiceInstance._createCard(oCardwAction).then(function (oCreatedCard) {
                    this._oManageDialog.setBusy(false);
                    this._closeDialog();
                    if (bIsCardVis) {
                        MessageToast.show(this.i18Bundle.getText("Card_Created"));
                    } else {
                        MessageBox.information(this.i18Bundle.getText("INT_CARD_LIMIT_MESSAGEBOX"));
                    }
                }.bind(this)
                ).catch(function (oError) {
                    if (oError && (oError.message === '/UI2/INSIGHTS_MSG/007')) {
                        MessageBox.error(this.i18Bundle.getText("INT_CARD_MAXLIMIT"));
                    } else {
                        MessageToast.show(oError.message);
                    }
                    this._oManageDialog.setBusy(false);
                    this._closeDialog();
                }.bind(this));
            }.bind(this));
        } else {
            this._oNavContainer.to(this._oPreviewPage);
            this._oPreviewPage.oTitleTextInput.focus();
        }
    };
    /**
     * Handler when 'next' button is clicked for transformation enbaled cards
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._callNextPage = function () {
        try {
            var oPreviewManifest = JSON.parse(this._oPreviewPage.getManifest());
            if (oPreviewManifest && this._oPreviewPage.oTitleTextInput.getValue().trim()) {
                var oSapCard = oPreviewManifest["sap.card"];
                if (oSapCard.type === "Table" || oSapCard.type === "List") {
                    var bDesktopMode = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop;
                    this._createColumnListDialog();
                    var oSegButton = bDesktopMode ? this._oColumnListPreview.oColumnSegButton : this._oColumnListPreview.oSdColumnSegButton;
                    if (!oSegButton.getSelectedKey()) {
                        oSegButton.setSelectedKey("list");
                    }
                    this._oColumnListPreview.oColumnSearch.setValue('');
                    this._oColumnListPreview._onColumnSearch();
                    this.bColumnPage = true;
                    this.oNextButton.setVisible(false);
                    this.oAddButton.setVisible(true);
                    this.oBackButton.setVisible(true);
                    this._oColumnListPreview.oColumnSearch.focus();
                } else if (oSapCard.type === "Analytical") {
                    this._createHocDialog();
                    this._oHouseOfCards.showHouseOfCardsDialog();
                    this._oHouseOfCards.getChartTypeSearch().setValue('');
                    this._oHouseOfCards._onChartTypeSearch();
                    this._oNavContainer.addPage(this._oHouseOfCards);
                    this._oNavContainer.to(this._oHouseOfCards);
                    this.oNextButton.setVisible(false);
                    this.oAddButton.setVisible(true);
                    this.oBackButton.setVisible(true);
                    this.oAddButton.setEnabled(true);
                } else {
                    this._oColumnListPreview._callPreview(oPreviewManifest);
                }
            }
        } catch (oError) {
            oLogger.error(oError.message);
            MessageToast.show(oError.message);
            throw new Error(oError);
        }
    };
    /**
     * Loads the Preview page and pass manifest to it
     * @param {object} oManifest manifest of the card
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._callPreviewPage = function (oManifest) {
        if (this._oColumnListPreview) {
            this._oColumnListPreview.bShowPreview = false;
        }
        if (this._oNavContainer && this._oPreviewPage) {
            this._oPreviewPage.bShowCardPreview = false;
            this._oPreviewPage._adjustLayoutStyles();
            var oTitleInput = this._oPreviewPage.oTitleTextInput;
            if (oManifest) {
                if (oManifest["sap.card"].header.title && oManifest["sap.card"].header.title.trim()) {
                    this.oNextButton.setEnabled(true);
                    oTitleInput.setValueState("None");
                    oTitleInput.setValueStateText("");
                } else {
                    this.oNextButton.setEnabled(false);
                    oTitleInput.setValueState("Error");
                    oTitleInput.setValueStateText(this.i18Bundle.getText("INT_Preview_Title_ValueStateText"));
                }
            }
            this.bColumnPage = false;
            this._oNavContainer.to(this._oPreviewPage);
            var bDesktopMode = DeviceType.getDialogBasedDevice() === AppConstants.DEVICE_TYPES.Desktop;
            var previewCard = bDesktopMode ? this._oPreviewPage.oDefaultPreviewCardLS : this._oPreviewPage.oDefaultPreviewCardSD;
            if (previewCard && (oManifest["sap.card"].type === "Table" || oManifest["sap.card"].type === "List")) {
                if (this._oColumnListPreview && this._oColumnListPreview.iVisibleColumnCount > 0) {
                    previewCard.setPreviewMode('Off');
                } else {
                    previewCard.setPreviewMode('Abstract');
                }
            }
            this._oPreviewPage.setManifest(JSON.stringify(oManifest));
            this.oBackButton.setVisible(false);
            this.oAddButton.setVisible(false);
            this.oNextButton.setVisible(true);
        }
    };
    /**
     * Closes the ManagePreview Dialog
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._closeDialog = function () {
        this._oManageDialog.close();
    };
    /**
     * Handler for back button on the footer
     * @returns {void}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._onNavBack = function () {
        if (this._oColumnListPreview && this._oColumnListPreview.oConfCard) {
            var oSapCard = this._oColumnListPreview.oConfCard["sap.card"];
            if (oSapCard.type === "Table" || oSapCard.type === "List") {
                this._callPreviewPage(this._oColumnListPreview.oConfCard);
            }
        } else {
            this._callPreviewPage(this._oHouseOfCards._oConfCard);
        }
    };
    /**
     * Calls the CardHelper's service to show preview of card
     * @param {object} oCard manifest of the card
     * @returns {Promise}
     *
     * @private
     * @experimental since 1.120
     */
    ManagePreview.prototype._showPreview = function (oCard) {
        return CardHelper.getServiceAsync().then(function (oCardHelperServiceInstance) {
            return oCardHelperServiceInstance._getUserAllCards().then(function (aCards) {
                var aVisibleCards = aCards.filter(function (oCard) {
                    return oCard.visibility;
                });
                if (aVisibleCards.length < 10) {
                    oCard["sap.insights"].visible = true;
                }
                var oConfCard = oCard ? JSON.parse(JSON.stringify(oCard)) : "";
                /* Get Manifest For Preview  */
                oConfCard = CardPreviewManager.getCardPreviewManifest(oCard);
                if (!this._oPreviewPage) {
                    this._oPreviewPage = new Preview(this.getId() + "idPreviewPage", {
                        cardMessageInfo: this.getCardMessageInfo(),
                        transformation: this.getTransformation(),
                        titleCheck: this._setEnableButton.bind(this)
                    });
                } else {
                    this._oPreviewPage.setCardMessageInfo(this.getCardMessageInfo());
                    this._oPreviewPage.setTransformation(this.getTransformation());
                }
                this._oPreviewPage.setManifest(JSON.stringify(oConfCard));
                this._oNavContainer.addPage(this._oPreviewPage);
                this._oNavContainer.to(this._oPreviewPage);
                this.bColumnPage = false;
                var oTitle = this._oPreviewPage.oTitleTextInput;
                oTitle.setValueState("None");
                this._oManageDialog.open();
                this._oPreviewPage.setPreviewModeOfCard();
                if (this.hasListeners("onConfirmButtonPress")) {
                    this._oPreviewPage.oDefaultSubText.setText(this.i18Bundle.getText("INT_CARD_SUBTITLE"));
                } else {
                    this._oPreviewPage.oDefaultSubText.setText(this.i18Bundle.getText("INT_CARD_SUBTITLE") + "\n" + this.i18Bundle.getText("INT_CARD_LIMIT_SUBTITLE"));

                }
                return Promise.resolve();
            }.bind(this));
        }.bind(this))
            .catch(function (oError) {
                oLogger.error(oError.message);
                return Promise.reject(oError);
            });
    };
    return ManagePreview;
});
