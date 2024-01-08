/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ovp/cards/ActionUtils",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ui/core/ResizeHandler",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageBox",
    "sap/fe/navigation/NavError",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/ui/thirdparty/jquery",
    "sap/ovp/app/resources",
    "sap/ovp/app/OVPUtils",
    "sap/ui/events/KeyCodes",
    "sap/base/util/merge",
    "sap/ovp/app/OVPLogger",
    "sap/ovp/cards/jUtils",
    "sap/base/util/isEmptyObject",
    "sap/ui/util/openWindow",
    "sap/ovp/placeholder/placeholderHelper",
    "sap/ui/core/Component",
    "sap/ui/core/Fragment",
    "sap/ovp/app/NavigationHelper",
    "sap/ovp/cards/NavigationHelper",
    "sap/ovp/helpers/V4/MetadataAnalyzer",
    "sap/ovp/insights/helpers/AnalyticalCard",
    "sap/ovp/filter/FilterUtils",
    "sap/ui/core/Core",
    "sap/ovp/handlers/IAppStateHandler",
    "sap/ovp/insights/CardProvider"
], function (
    Controller,
    ActionUtils,
    CommonUtils,
    OVPCardAsAPIUtils,
    ResizeHandler,
    NumberFormat,
    MessageBox,
    NavError,
    JSONModel,
    Dialog,
    Button,
    jQuery,
    OvpResources,
    OVPUtils,
    KeyCodes,
    merge,
    OVPLogger,
    jUtils,
    isEmptyObject,
    openWindow,
    placeholderHelper,
    CoreComponent,
    Fragment,
    NavigationHelper,
    CardsNavigationhelper,
    V4MetadataAnalyzer,
    AnalyticalCardHelper,
    FilterUtils,
    Core,
    IAppStateHandler,
    CardProvider
) {
    "use strict";
    
    var oLogger = new OVPLogger("ovp.generic.Card");

    return Controller.extend("sap.ovp.cards.generic.Card", {
        initKeyboardNavigation: function () {
            var KeyboardNavigation = function (cardLayout) {
                this.init(cardLayout);
            };

            KeyboardNavigation.prototype.layoutItemFocusHandler = function () {
                var jqFocused = jQuery(document.activeElement);
                // Check that focus element exits, id this item exits it will be easyScanLayoutItemWrapper (because the jQuery definitions
                // After we have the element we want to add to his aria-labelledby attribute all the IDs of his sub elements that have aria-label and role headind
                if (jqFocused) {
                    // Select all sub elements with aria-label
                    var labelledElement = jqFocused.find("[aria-label]");
                    var i,
                        strIdList = "";
                    // code to add the aria label for the ObjectNumber having state.
                    // We need to add both the value state as well as the text to be added to the aria-label
                    if (jqFocused.find(".valueStateText").length == 1) {
                        var sText = jqFocused
                            .find(".valueStateText")
                            .find(".sapMObjectNumberText")
                            .text();
                        var sValueState = jqFocused
                            .find(".valueStateText")
                            .find(".sapUiInvisibleText")
                            .text();
                        jqFocused
                            .find(".valueStateText")
                            .attr("aria-label", sText + " " + sValueState);
                        jqFocused.find(".valueStateText").attr("aria-labelledby", "");
                    }

                    jqFocused.find("[role='listitem']").attr("aria-label", "");

                    // adding the text card header before if the focus is on the header section
                    if (
                        jqFocused.hasClass("sapOvpCardHeader") &&
                        !jqFocused.hasClass("sapOvpStackCardContent")
                    ) {
                        var sCardHeaderTypeDivId = "";
                        var cardHeaderDiv = jqFocused.find(".cardHeaderType");
                        if (cardHeaderDiv.length === 0) {
                            var sCardHeaderType = OvpResources.getText("CardHeaderType");
                            sCardHeaderTypeDivId = "cardHeaderType_" + new Date().getTime();
                            var sDummyDivForCardHeader =
                                '<div id="' +
                                sCardHeaderTypeDivId +
                                '" class="cardHeaderType" aria-label="' +
                                sCardHeaderType +
                                '" hidden></div>';
                            jqFocused.append(sDummyDivForCardHeader);
                        } else {
                            sCardHeaderTypeDivId = cardHeaderDiv[0].id;
                        }
                        strIdList += sCardHeaderTypeDivId + " ";
                    }
                    //  Add every element id with aria label and e heading inside the LayoutItemWrapper to string list
                    for (i = 0; i < labelledElement.length; i++) {
                        if (labelledElement[i].getAttribute("role") === "heading") {
                            strIdList += labelledElement[i].id + " ";
                        }
                    }
                    if (jqFocused.hasClass("sapOvpCardHeader")) {
                        var cardHeaders = jqFocused.find(".cardHeaderText");
                        if (cardHeaders.length !== 0) {
                            for (var i = 0; i < cardHeaders.length; i++) {
                                if (strIdList.indexOf(cardHeaders[i].id) === -1) {
                                    strIdList += cardHeaders[i].id + " ";
                                }
                            }
                        }
                    }
                    // add the id string list to the focus element (warpper) aria-labelledby attribute
                    if (strIdList.length) {
                        jqFocused.attr("aria-labelledby", strIdList);
                    }
                    //if the focussed element is li and belongs to a dynamic link list which has the action for popover
                    // creating a hidden element with "has details" text and adding it to the LI
                    if (
                        jqFocused.prop("nodeName") === "LI" &&
                        jqFocused.find(".linkListHasPopover").length !== 0
                    ) {
                        if (jqFocused.find("#hasDetails").length === 0) {
                            jqFocused.append(
                                "<div id='hasDetails' hidden>" +
                                OvpResources.getText("HAS_DETAILS") +
                                "</div>"
                            );
                            jqFocused.attr("aria-describedby", "hasDetails");
                        }
                    }
                    //if the focussed element is link and belongs to a table then column header has to be read along with the link text
                    var table = jqFocused.attr("id");
                    if (
                        table &&
                        table.indexOf("ovpTable") != -1 &&
                        jqFocused.find("[role='Link']") &&
                        !jqFocused.hasClass("sapUiCompSmartLink")
                    ) {
                        var itemColumn = jqFocused.closest("td").attr("data-sap-ui-column"),
                            headerColumns = jqFocused
                                .closest("tbody")
                                .siblings()
                                .children()
                                .filter("tr")
                                .children();
                        for (var i = 0; i < headerColumns.length; i++) {
                            if (
                                headerColumns[i].getAttribute("data-sap-ui") == itemColumn &&
                                headerColumns[i].hasChildNodes("span")
                            ) {
                                var headerTextId =
                                    headerColumns[i].firstElementChild.getAttribute("id");
                                jqFocused.attr("aria-labelledby", headerTextId);
                            }
                        }
                    }
                }
            };

            KeyboardNavigation.prototype.init = function (cardLayout) {
                this.cardLayout = cardLayout;
                this.keyCodes = KeyCodes;
                this.jqElement = jQuery(cardLayout.getView().$());
                this.jqElement = this.jqElement.parent().parent().parent();
                this.jqElement.on(
                    "focus.keyboardNavigation",
                    this.layoutItemFocusHandler.bind(this)
                );
            };
            this.keyboardNavigation = new KeyboardNavigation(this);
        },

        onInit: function () {
            this.oCardComponent = this.getOwnerComponent();
            this.oCardComponentData = this.oCardComponent && this.oCardComponent.getComponentData();
            this.oMainComponent = this.oCardComponentData && this.oCardComponentData.mainComponent;
            this.sCardId = this.oCardComponentData.cardId;
            /**
             *If the state is 'Loading' or 'Error', we do not render the header. Hence, this is no oHeader.
             */
            var sState = this.getView().mPreprocessors.xml[0].ovpCardProperties.oData.state;
            if (sState !== "Error") {
                var oHeader = this.getView().byId("ovpCardHeader");
                if (!!oHeader) {
                    oHeader.attachBrowserEvent("click", this.onHeaderClick.bind(this));
                    oHeader.addEventDelegate({
                        onkeydown: function (oEvent) {
                            if (!oEvent.shiftKey && oEvent.keyCode == 13) {
                                oEvent.preventDefault();
                                this.onHeaderClick(oEvent);
                            } else if (!oEvent.shiftKey && oEvent.keyCode == 32) {
                                oEvent.preventDefault();
                            }
                        }.bind(this)
                    });
                    oHeader.addEventDelegate({
                        onkeyup: function (oEvent) {
                            if (!oEvent.shiftKey && oEvent.keyCode == 32) {
                                oEvent.preventDefault();
                                this.onHeaderClick(oEvent);
                            }
                        }.bind(this)
                    });
                }
            }
            var oNumericControl = this.getView().byId("kpiNumberValue");
            if (oNumericControl) {
                oNumericControl.addEventDelegate({
                    onAfterRendering: function () {
                        var $numericControl = oNumericControl.$();
                        var $number = $numericControl.find(".sapMNCValueScr");
                        var $scale = $numericControl.find(".sapMNCScale");
                        $number.attr("aria-label", $number.text());
                        $scale.attr("aria-label", $scale.text());
                        /*
                     For restricting target and deviation in KPI Header to move towards the right
                     */
                        var $header = this.getView().byId("ovpCardHeader").getDomRef();
                        var oCompData = this.getOwnerComponent().getComponentData();
                        if (!!oCompData && !!oCompData.appComponent) {
                            var oAppComponent = oCompData.appComponent;
                            if (!!oAppComponent.getModel("ui")) {
                                var oUiModel = oAppComponent.getModel("ui");
                                if (
                                    !!oUiModel.getProperty("/containerLayout") &&
                                    oUiModel.getProperty("/containerLayout") === "resizable"
                                ) {
                                    var oDashboardLayoutUtil =
                                        oCompData.appComponent.getDashboardLayoutUtil();
                                    if (!!oDashboardLayoutUtil) {
                                        oDashboardLayoutUtil.setKpiNumericContentWidth($header);
                                    }
                                }
                            }
                        }
                    }.bind(this)
                });
            }

            var oCard;
            var oCardComponentData = this.oCardComponentData;
            var bODataV4 = CommonUtils.isODataV4(oCardComponentData.model);
            
            if (bODataV4) {
                if (this.oMainComponent && this.oMainComponent.oCards) {
                    oCard = this.oMainComponent.oCards.filter(function(oElement) { 
                        return oElement.id === oCardComponentData.cardId;
                    })[0];
                }
                var sCardTemplate = oCard && oCard.template;
                var bStandardV4Template = sCardTemplate && sCardTemplate.startsWith("sap.ovp.cards.v4");
                var bStandardTemplate = sCardTemplate && sCardTemplate.startsWith("sap.ovp.cards");

                if (bStandardV4Template || !bStandardTemplate) {
                    var that = this;
                    this.eventhandler = function (channelid, event, aFilters) {
                        if (sCardTemplate.startsWith("sap.ovp.cards.v4.charts") || (!bStandardTemplate && oCard.settings.chartAnnotationPath)) {
                           FilterUtils.applyFiltersToV4AnalyticalCard(aFilters, that);
                        } else {
                           FilterUtils.applyFiltersToV4Card(aFilters, that);
                        }
                    };
                    this.GloabalEventBus = Core.getEventBus();
                    if (this.oMainComponent && (this.oMainComponent.isMacroFilterBar || this.oMainComponent.oGlobalFilter)) {
                        this.GloabalEventBus.subscribe("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", that.eventhandler);
                    }
                }
            }
        },
        updateControlPressed: function(oEvent) {
            OVPUtils.bCRTLPressed = oEvent.ctrlKey || oEvent.metaKey;
        },

        exit: function () {
            //de-register event handler
            if (this.resizeHandlerId) {
                ResizeHandler.deregister(this.resizeHandlerId);
            }
        },
        onExit: function () {
            if (this.GloabalEventBus) {
                var that = this;
                this.GloabalEventBus.unsubscribe("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", that.eventhandler);
            }
        },

        onAfterRendering: function () {
            //setting arialabelledby in case if already not set for fixing the BCP Behavior - 2180203275
            var oCardHeader = this.getView().byId("ovpCardHeader");
            var oCardHeaderDomRef = oCardHeader && oCardHeader.getDomRef();
            var oHeaderTitle = this.getView().byId("ovpHeaderTitle");
            var oQuickViewCardHeaderEnabled = this.getView().byId("ovpQuickviewCardHeader");

            if (oCardHeaderDomRef && !oCardHeaderDomRef.getAttribute("ariaLabelledBy")) {
                if (oHeaderTitle && oHeaderTitle.getText()) {
                    var sHeaderDomID = oHeaderTitle.getDomRef().getAttribute("id");
                    oCardHeaderDomRef.setAttribute("arialabelledby", sHeaderDomID);
                } else if (oQuickViewCardHeaderEnabled && oQuickViewCardHeaderEnabled.getText()) {
                    var sQuickViewCardHeaderID = oQuickViewCardHeaderEnabled
                        .getDomRef()
                        .getAttribute("id");
                    oCardHeaderDomRef.setAttribute("arialabelledby", sQuickViewCardHeaderID);
                }
            }
            //End of Fix for BCP - 2180203275 setting arialabelledby for ovpcardheader in case not set already

            var oCardPropertiesModel = this.getCardPropertiesModel();
            //Flag added to enable click on header/line item
            this.enableClick = true;
            var sContentFragment = oCardPropertiesModel.getProperty("/contentFragment"),
                oCompData = this.getOwnerComponent().getComponentData(),
                oItemsBinding = this.getCardItemsBinding();
            if (!oItemsBinding && placeholderHelper.hidePlaceholderNeeded()) {
                placeholderHelper.hidePlaceholder();
            }
            this._handleCountHeader();
            this._handleKPIHeader();
            var sSelectedKey = oCardPropertiesModel.getProperty("/selectedKey");
            if (sSelectedKey && oCardPropertiesModel.getProperty("/state") !== "Loading") {
                var oDropDown = this.getView().byId("ovp_card_dropdown");
                if (oDropDown) {
                    oDropDown.setSelectedKey(sSelectedKey);
                    var oUIModel = this.getView().getModel("ui");
                    if (oUIModel && oUIModel.getProperty("/bSelectionChanged")) {
                        var sDropdownElement = document.getElementById(oDropDown.sId);
                        sDropdownElement && sDropdownElement.focus();
                        oUIModel.setProperty("/bSelectionChanged", false);
                    }
                }
            }
            
            //if this card is owned by a Resizable card layout, check if autoSpan is required and register event handler
            try {
                var oCompData = this.getOwnerComponent().getComponentData();
                var oAppComponent = oCompData && oCompData.appComponent;
                if (oAppComponent) {
                    if (oAppComponent.getModel("ui")) {
                        var oUiModel = oAppComponent.getModel("ui");
                        // Check Added for Resizable card layout
                        if (oUiModel.getProperty("/containerLayout") === "resizable") {
                            var oDashboardLayoutUtil = oAppComponent.getDashboardLayoutUtil();
                            if (oDashboardLayoutUtil) {
                                this.oDashboardLayoutUtil = oDashboardLayoutUtil;
                                this.cardId = oCompData.cardId;
                                if (oDashboardLayoutUtil.isCardAutoSpan(oCompData.cardId)) {
                                    this.resizeHandlerId = ResizeHandler.register(this.getView(), function (oEvent) {
                                        oLogger.info("DashboardLayout autoSize:" + oEvent.target.id + " -> " + oEvent.size.height);
                                        oDashboardLayoutUtil.setAutoCardSpanHeight(oEvent);
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                oLogger.error("DashboardLayout autoSpan check failed.");
            }

            //Resizable card layout: autoSpan cards - size card wrapper to card height
            if (
                this.oDashboardLayoutUtil &&
                this.oDashboardLayoutUtil.isCardAutoSpan(this.cardId)
            ) {
                var $wrapper = jQuery("#" + this.oDashboardLayoutUtil.getCardDomId(this.cardId));
                if (this.oView.$().outerHeight() > $wrapper.innerHeight()) {
                    this.oDashboardLayoutUtil.setAutoCardSpanHeight(
                        null,
                        this.cardId,
                        this.oView.$().height()
                    );
                }
            }

            var bIsNavigable = false;
            var oModel = this.getModel();
            var oEntityType = this.getEntityType();
            if (oCompData && oCompData.mainComponent) {
                var oMainComponent = oCompData.mainComponent;
                //Flag bGlobalFilterLoaded is set only when the oGlobalFilterLodedPromise is resolved
                if (oMainComponent.bGlobalFilterLoaded) {
                    bIsNavigable = 
                        !CardsNavigationhelper.checkHeaderNavigationDisabledForAnalyticalCard(oCardPropertiesModel) && 
                        CardsNavigationhelper.checkNavigation(oModel, oEntityType, oCardPropertiesModel);
                }
            } else if (OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                bIsNavigable = this.checkAPINavigation();
            }

            // checking if header is non navigable then removing the view all link from the stack card
            var sState = oCardPropertiesModel.getProperty("/state");
            if (sState !== "Loading" && sState !== "Error") {
                var cardType = oCardPropertiesModel.getProperty("/template");
                if (cardType === "sap.ovp.cards.stack") {
                    if (!bIsNavigable) {
                        var viewAllLink = this.getView().byId("ViewAll");
                        if (viewAllLink) {
                            viewAllLink = viewAllLink.getDomRef();
                            viewAllLink && viewAllLink.parentNode.removeChild(viewAllLink);
                        }
                    }
                }
            }
            // [FIORITECHP1-17948] - Remove top border only from stack card
            if (sContentFragment === "sap.ovp.cards.stack.Stack") {
                var oCardRef = this.getView().getDomRef();
                var cardContentContainer = oCardRef && oCardRef.querySelector(".sapOvpCardContentContainer");
                if (cardContentContainer) {
                    cardContentContainer.style.borderTop = "none";
                }
            }

            //var sContentFragment = this.getCardPropertiesModel().getProperty("/contentFragment");
            if (bIsNavigable) {
                /**
                 * If it's a Quickview card, it should not have "cursor: pointer" set.
                 * Only the header and footer action items of Quickview card are navigable.
                 */
                if (sContentFragment ? sContentFragment !== "sap.ovp.cards.quickview.Quickview" : true) {
                    if (sContentFragment === "sap.ovp.cards.stack.Stack") {
                        var oCardRef = this.getView().getDomRef();
                        var stackContainer = oCardRef.querySelectorAll(".sapOvpCardContentRightHeader");
                        if (stackContainer.length !== 0) {
                            jUtils.addClassToAllElements(stackContainer, "sapOvpCardNavigable");
                        }
                    } else {
                        this.getView().addStyleClass("sapOvpCardNavigable");
                    }
                }
                if (
                    sContentFragment &&
                    sContentFragment === "sap.ovp.cards.quickview.Quickview"
                ) {
                    var oHeader = this.byId("ovpCardHeader");
                    if (oHeader) {
                        oHeader.addStyleClass("sapOvpCardNavigable");
                    }
                }
            } else {
                if (sContentFragment) {
                    this.getView().addStyleClass("ovpNonNavigableItem");
                    // removing the role=button if the navigation for the header is not available
                    var oHeader = this.byId("ovpCardHeader");
                    if (oHeader) {
                        oHeader.$().removeAttr("role");
                        oHeader.addStyleClass("ovpNonNavigableItem");
                    }


                    var bIsLineItemNavigable = CardsNavigationhelper.checkLineItemNavigation(oModel, oEntityType, oCardPropertiesModel);
                    if (!bIsLineItemNavigable) {
                        // setting the list item to inactive if the navigation is not available for the card.
                        switch (sContentFragment) {
                            case "sap.ovp.cards.list.List":
                            case "sap.ovp.cards.v4.list.List":
                                var listItem = this.getView().byId("listItem");
                                if (listItem) {
                                    listItem.setType("Inactive");
                                }
                                break;
                            case "sap.ovp.cards.table.Table":
                            case "sap.ovp.cards.v4.table.Table":
                                var listItem = this.getView().byId("tableItem");
                                if (listItem) {
                                    listItem.setType("Inactive");
                                }
                                break;
                            case "sap.ovp.cards.linklist.LinkList":
                            case "sap.ovp.cards.v4.linklist.LinkList":
                                if (!CardsNavigationhelper.checkNavigationForLinkedList(oModel, oEntityType)) {
                                    var listItem = this.getView().byId("ovpCLI");
                                    if (listItem) {
                                        listItem.setType("Inactive");
                                    }
                                }
                                break;
                        }
                    }
                }
            }

            var dropDown = this.getView().byId("ovp_card_dropdown");
            var invisibleText = this.getView().byId("ovp_card_dropdown_label");
            if (dropDown) {
                dropDown.addAriaLabelledBy(invisibleText.getId());
            }

            if (OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                this.initKeyboardNavigation();
            }

            if (this.getView() && this.getView().byId("sapOvpCardAdditionalActions")) {
                this.getView().byId("sapOvpCardAdditionalActions").setEnabled(true);
            }

            
            var oComponentData = this.getOwnerComponent().getComponentData(),
                bInsightRTEnabled = oComponentData && 
                    oComponentData.appComponent && 
                    oComponentData.appComponent.ovpConfig && 
                    oComponentData.appComponent.ovpConfig.bInsightRTEnabled;

            if (bInsightRTEnabled) {
                this.addInsightCardToCardProvider(oComponentData);
            }
        },

        /**
        * Adds Insights Cards to the card provider
        * 
        * @param {object} oComponentData The component data
        * 
        */
         addInsightCardToCardProvider: function(oComponentData) {
            if (
                oComponentData &&
                oComponentData.appComponent &&
                oComponentData.appComponent.getModel("ui")
            ) {
                var oUIModel = oComponentData.appComponent.getModel("ui"),
                    iVisibleCardCount = oUIModel.getProperty("/visibleCardCount"),
                    iRenderedCardCount = oUIModel.getProperty("/renderedCardCount"),
                    ovpCardProperties = this.getView().getModel("ovpCardProperties"),
                    sAppId = oComponentData.appComponent.getManifest() && 
                            oComponentData.appComponent.getManifest()["sap.app"].id,
                    oRawManifest = oComponentData.appComponent.getManifestObject().getRawJson(),
                    sFiorAppID = (oRawManifest && 
                            oRawManifest["sap.fiori"] && 
                            oRawManifest["sap.fiori"].registrationIds && 
                            oRawManifest["sap.fiori"].registrationIds[0]) || sAppId;

                CardProvider.addInsightCard(ovpCardProperties, sFiorAppID);

                if (iRenderedCardCount === iVisibleCardCount - 1) {
                    var oMainComponent = oComponentData && oComponentData.mainComponent;
                    oMainComponent.initializeCardProvider();
                }
                oUIModel.setProperty("/renderedCardCount", ++iRenderedCardCount);
            }
        },

        checkAPINavigation: function () {
            var oComponentData = this.getOwnerComponent().getComponentData(),
                bCheckIfValidArg = oComponentData.fnCheckNavigation && typeof oComponentData.fnCheckNavigation === "function",
                fnCheckNavigation = bCheckIfValidArg ? oComponentData.fnCheckNavigation : null;

            if (fnCheckNavigation) {
                if (fnCheckNavigation()) {
                    return true;
                }
            } else {
                var oCardPropertiesModel = this.getCardPropertiesModel();
                return (
                    !CardsNavigationhelper.checkHeaderNavigationDisabledForAnalyticalCard(oCardPropertiesModel) && 
                    CardsNavigationhelper.checkNavigation(this.getModel(), this.getEntityType(), oCardPropertiesModel)
                );
            }

            return false;
        },

        onHeaderClick: function (oEvent) {
            var sTargetId = oEvent && oEvent.target && oEvent.target.id;
            if (sTargetId && sTargetId.indexOf("sapOvpCardAdditionalActions") > -1) {
                return;
            }

            //removing check for bCTRLPressed as any pressed with control key or command key will be either ctrlKey or metaKey for windows and mac respectively
            var sNavMode =
                oEvent.ctrlKey || oEvent.metaKey
                    ? OVPUtils.constants.explace
                    : OVPUtils.constants.inplace;
            /*
         On Header click of OVP Cards used as an API in other Applications
         */
            if (OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                if (this.checkAPINavigation()) {
                    //The function is only called when there is a valid semantic object and action is available
                    CommonUtils.onHeaderClicked();
                }
            } else {
                //Only for static linklist cards, the navigation destination is the URL specified as the targetUri property's value in the manifest.
                var oCardPropertiesModel = this.getCardPropertiesModel();
                var template = oCardPropertiesModel.getProperty("/template");
                var sTargetUrl = oCardPropertiesModel.getProperty("/targetUri");

                if (
                    (template == "sap.ovp.cards.linklist" || template == "sap.ovp.cards.v4.linklist") &&
                    oCardPropertiesModel.getProperty("/staticContent") !== undefined &&
                    sTargetUrl
                ) {
                    window.location.href = sTargetUrl;
                } else if (
                    oCardPropertiesModel.getProperty("/staticContent") !== undefined &&
                    sTargetUrl === ""
                ) {
                    return;
                } else if (CardsNavigationhelper.checkHeaderNavigationDisabledForAnalyticalCard(oCardPropertiesModel)) {
                    return;
                } else {
                    //call the navigation with the binded context to support single object cards such as quickview card
                    this.doNavigation(this.getView().getBindingContext(), null, sNavMode);
                }
            }
        },

        resizeCard: function (cardSpan) {
            oLogger.info(cardSpan);
            //card was manually resized --> de-register handler
            if (this.resizeHandlerId) {
                ResizeHandler.deregister(this.resizeHandlerId);
                this.resizeHandlerId = null;
            }
        },
       
        //Function to display header counter
        _handleCountHeader: function () {
            var countFooter = this.getView().byId("ovpCountHeader");
            if (countFooter) {
                //Gets the card items binding object
                var oItemsBinding = this.getCardItemsBinding();
                if (oItemsBinding) {
                    /*
                     * There have been instances when the data is received before attaching the event "attachDataReceived"
                     * is made.As a result, no counter comes in the header on intital load.Therefore, an explicit
                     * call is made to set the header counter.
                    */

                    if (oItemsBinding.isLengthFinal() && oItemsBinding.getLength() > 0) {
                        this.setHeaderCounter(oItemsBinding, countFooter);
                    }
                    oItemsBinding.attachDataReceived(
                        function (oEvent) {
                            if (placeholderHelper.hidePlaceholderNeeded()) {
                                placeholderHelper.hidePlaceholder();
                            }
                            this.setHeaderCounter(oItemsBinding, countFooter, oEvent);
                        }.bind(this)
                    );
                    oItemsBinding.attachChange(
                        function (oEvent) {
                            this.setHeaderCounter(oItemsBinding, countFooter, oEvent);
                        }.bind(this)
                    );
                }
            } else {
                var oItemsBinding = this.getCardItemsBinding();
                if (oItemsBinding) {
                    oItemsBinding.attachDataReceived(function () {
                        if (placeholderHelper.hidePlaceholderNeeded()) {
                            placeholderHelper.hidePlaceholder();
                        }
                    });
                }
            }
        },

        setHeaderCounter: function (oItemsBinding, countHeader, oEvent) {
            var iTotal;
            if (oItemsBinding.isLengthFinal()) {
                iTotal = oItemsBinding.getLength();
            } else {
                if (
                    oEvent &&
                    oEvent.getParameters().data &&
                    oEvent.getParameters().data.results
                ) {
                    iTotal = oEvent.getParameters().data.results.length;
                }
            }
            var iCurrent = oItemsBinding.getCurrentContexts().length;
            var oCard,
                countHeaderText = "";
            var numberFormat = NumberFormat.getIntegerInstance({
                minFractionDigits: 0,
                maxFractionDigits: 1,
                decimalSeparator: ".",
                style: "short"
            });
            iCurrent = parseFloat(iCurrent, 10);
            var oCompData = this.getOwnerComponent().getComponentData();
            //Check Added for Fixed card layout
            if (oCompData && oCompData.appComponent) {
                var oAppComponent = oCompData.appComponent;
                if (oAppComponent.getModel("ui")) {
                    var oUiModel = oAppComponent.getModel("ui");
                    //Check Added for Resizable card layout
                    if (oUiModel.getProperty("/containerLayout") !== "resizable") {
                        if (iTotal !== 0) {
                            iTotal = numberFormat.format(Number(iTotal));
                        }
                        if (iCurrent !== 0) {
                            iCurrent = numberFormat.format(Number(iCurrent));
                        }
                    } else {
                        oCard = oAppComponent
                            .getDashboardLayoutUtil()
                            .dashboardLayoutModel.getCardById(oCompData.cardId);
                    }
                }
            }
            /*Set counter in header if
             * (i)   All the items are not displayed
             * (ii) Card is resized to its header
             */
            if (iCurrent === 0 || iTotal === 0) {
                countHeaderText = "";
            } else if (oCard && oCard.dashboardLayout.showOnlyHeader) {
                //Display only total indication in case the card is resized to its header
                countHeaderText = OvpResources.getText("Count_Header_Total", [iTotal]);
            } else if (iTotal != iCurrent) {
                //Display both current and total indication in the other scenarios
                countHeaderText = OvpResources.getText("Count_Header", [iCurrent, iTotal]);
            }
            countHeader.setText(countHeaderText);
            countHeader.addEventDelegate({
                onAfterRendering: function () {
                    var $countHeader = countHeader.$();
                    $countHeader.attr("aria-label", countHeaderText);
                }
            });
        },

        /*
         *  Get KPI Binding to display in Card Header
         */
        getKPIBinding: function () {
            var oNumericBox = this.byId("kpiHBoxNumeric"),
                oKPIBinding =
                    oNumericBox &&
                    oNumericBox.getBindingInfo("items") &&
                    oNumericBox.getBindingInfo("items").binding;
            return oKPIBinding;
        },

        /**
         * default empty implementation for the count footer
         */
        getCardItemsBinding: function () { },

        onActionPress: function (oEvent) {
            var sourceObject = oEvent.getSource(),
                oCustomData = this._getActionObject(sourceObject),
                context = sourceObject.getBindingContext();
            if (oCustomData.type.indexOf("DataFieldForAction") !== -1) {
                this.doAction(context, oCustomData);
            } else {
                this.doNavigation(context, oCustomData);
            }
        },
        _getActionObject: function (sourceObject) {
            var aCustomData = sourceObject.getCustomData();
            var oCustomData = {};
            for (var i = 0; i < aCustomData.length; i++) {
                oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
            }
            return oCustomData;
        },

        doNavigation: function (oContext, oNavigationField, sNavMode) {
            if (!sNavMode) {
                sNavMode = OVPUtils.constants.inplace;
            }
            //handle multiple clicks of line item/header
            if (!this.enableClick) {
                return;
            }
            this.enableClick = false;
            setTimeout(
                function () {
                    this.enableClick = true;
                }.bind(this),
                1000
            );

            //Main Component is required for further processing
            if (!this.oMainComponent) {
                return;
            }

            if (!oNavigationField) {
                oNavigationField = 
                    CardsNavigationhelper.getEntityNavigationEntries(
                        oContext, 
                        this.getModel(),
                        this.getEntityType(),
                        this.getCardPropertiesModel()
                    )[0];
            }

            //Create copy of objects so that they are not altered from extension function
            var oContextCopy = merge({}, oContext);
            var oNavigationFieldCopy = merge({}, oNavigationField);

            //Get custom navigation entry from extension controller
            //Custom navigation entry should be object with properties {type, semanticObject, action, url, label}
            //url property to be used for type DataFieldWithUrl else semanticObject & action can be used
            var oCustomNavigationEntry =
                this.oMainComponent.doCustomNavigation &&
                this.oMainComponent.doCustomNavigation(
                    this.sCardId,
                    oContextCopy,
                    oNavigationFieldCopy
                );

            //Get custom navigation entry from adaptation controller
            //Custom navigation entry should be object with properties {type, semanticObject, action, url, label}
            //url property to be used for type DataFieldWithUrl else semanticObject & action can be used
            var oExtensonNavigationEntry =
                this.oMainComponent.templateBaseExtension &&
                this.oMainComponent.templateBaseExtension.provideExtensionNavigation &&
                this.oMainComponent.templateBaseExtension.provideExtensionNavigation(
                    this.sCardId,
                    oContextCopy,
                    oNavigationFieldCopy
                );

            var oFinalNavigationEntry;
            if (oCustomNavigationEntry) {
                oFinalNavigationEntry = oCustomNavigationEntry;
            }
            if (oExtensonNavigationEntry) {
                oFinalNavigationEntry = oExtensonNavigationEntry;
            }

            //If custom navigation is defined in extension, then override standard navigation with custom
            if (oFinalNavigationEntry) {
                var sType = oFinalNavigationEntry.type;
                if (sType && typeof sType === "string" && sType.length > 0) {
                    //Refine any inconsistent value coming from custom method
                    sType = sType.split(".").pop().split("/").pop().toLowerCase();
                    switch (sType) {
                        case "datafieldwithurl":
                            oFinalNavigationEntry.type = "com.sap.vocabularies.UI.v1.DataFieldWithUrl";
                            break;
                        case "datafieldforintentbasednavigation":
                            oFinalNavigationEntry.type = "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
                            break;
                    }
                    oNavigationField = oFinalNavigationEntry;
                }
            }

            function fnProcessNavigation(sNavMode) {
                if (!sNavMode) {
                    sNavMode = OVPUtils.constants.inplace;
                }
                if (oNavigationField) {
                    switch (oNavigationField.type) {
                        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
                            this.doNavigationWithUrl(oContext, oNavigationField, sNavMode);
                            break;
                        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
                            this.doIntentBasedNavigation(oContext, oNavigationField, false, sNavMode);
                            break;
                        case "com.sap.vocabularies.UI.v1.KPIDetailType":
                            this.doIntentBasedNavigation(oContext, oNavigationField, false, sNavMode);
                            break;
                    }
                }
            }

            //The inner appState required for back navigation is already created in main controller
            //during filter change/search, the same old appstate will be used during navigation
            if (!IAppStateHandler.oAppStatePromise) {
                fnProcessNavigation.call(this, sNavMode);
            } else {
                IAppStateHandler.oAppStatePromise.then(
                    fnProcessNavigation.bind(this, sNavMode)
                );
            }
        },

        doNavigationWithUrl: function (oContext, oNavigationField, sNavMode) {
            if (!sNavMode) {
                sNavMode = OVPUtils.constants.inplace;
            }

            //Container comes from FLP. For apps without FLP, the container will be missing
            if (!(sap.ushell && sap.ushell.Container)) {
                //For apps with no ushell
                if (oNavigationField && oNavigationField.url) {
                    openWindow(oNavigationField.url, "newWindow");
                }
                return;
            } 
            
            sap.ushell.Container.getServiceAsync("URLParsing").then(function (oURLParsingService) {
                //Checking if navigation is external or IntentBasedNav with paramters
                //If Not a internal navigation, navigate in a new window
                if (!oURLParsingService.isIntentUrl(oNavigationField.url)) {
                    openWindow(oNavigationField.url, "newWindow");
                } else {
                    var oParsedShellHash = oURLParsingService.parseShellHash(oNavigationField.url);
                    //Url can also contain an intent based navigation with route, route can be static or dynamic with paramters
                    //Url navigation without app specific route will trigger storing of appstate
                    var bWithRoute = oParsedShellHash.appSpecificRoute ? true : false;
                    this.doIntentBasedNavigation(oContext, oParsedShellHash, bWithRoute, sNavMode);
                }
            }.bind(this));
        },

        fnHandleError: function (oError) {
            if (oError instanceof NavError) {
                if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
                    MessageBox.show(OvpResources.getText("OVP_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
                        title: OvpResources.getText("OVP_GENERIC_ERROR_TITLE")
                    });
                } else {
                    MessageBox.show(oError.getErrorCode(), {
                        title: OvpResources.getText("OVP_GENERIC_ERROR_TITLE")
                    });
                }
            }
        },

        doCrossApplicationNavigation: function (oIntent, oNavArguments) {
            var sIntent = "#" + oIntent.semanticObject + "-" + oIntent.action;
            var aCardsIntent = [];
            if (oIntent.params) {
                var oComponentData =
                    this.oCardComponent && this.oCardComponent.getComponentData();
                var oAppComponent = oComponentData && oComponentData.appComponent;
                if (oAppComponent) {
                    var sParams = oAppComponent._formParamString(oIntent.params);
                    sIntent = sIntent + sParams;
                    aCardsIntent.push({ 
                        "target": { 
                            "shellHash": sIntent
                        } 
                    });
                }
            }
            var that = this;
            //Container comes from FLP. For apps without FLP, the container will be missing
            if (!sap.ushell.Container) {
                return;
            }
            sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCrossAppNavigationService) {
                oCrossAppNavigationService.isNavigationSupported(aCardsIntent).then(function (aResponses) {
                    var oResponse = aResponses[0];
                    if (oResponse && oResponse.supported) {
                        // enable link
                        if (!!oNavArguments.params) {
                            if (typeof oNavArguments.params == "string") {
                                try {
                                    oNavArguments.params = JSON.parse(oNavArguments.params);
                                } catch (err) {
                                    oLogger.error("Could not parse the Navigation parameters");
                                    return;
                                }
                            }
                        }
                        /*
                            Adding Global filters to Navigation Parameters
                        */
                        var oComponentData = that.getOwnerComponent().getComponentData();
                        var oGlobalFilter = oComponentData
                            ? oComponentData.globalFilter
                            : undefined;
                        var oUiState =
                            oGlobalFilter &&
                            oGlobalFilter.getUiState({
                                allFilters: false
                            });
                        var sSelectionVariant = oUiState
                            ? JSON.stringify(oUiState.getSelectionVariant())
                            : "{}";
                        oGlobalFilter = JSON.parse(sSelectionVariant);
                        var mFilterPreference = CardsNavigationhelper.getFilterPreference(oComponentData);
                        oGlobalFilter = CardsNavigationhelper.removeFilterFromGlobalFilters(
                            mFilterPreference,
                            oGlobalFilter
                        );

                        if (!oNavArguments.params) {
                            oNavArguments.params = {};
                        }
                        if (!!oGlobalFilter && !!oGlobalFilter.SelectOptions) {
                            for (var i = 0; i < oGlobalFilter.SelectOptions.length; i++) {
                                var oGlobalFilterValues = oGlobalFilter.SelectOptions[i].Ranges;
                                if (!!oGlobalFilterValues) {
                                    var values = [];
                                    for (var j = 0; j < oGlobalFilterValues.length; j++) {
                                        if (
                                            oGlobalFilterValues[j].Sign === "I" &&
                                            oGlobalFilterValues[j].Option === "EQ"
                                        ) {
                                            values.push(oGlobalFilterValues[j].Low);
                                        }
                                    }
                                    oNavArguments.params[
                                        oGlobalFilter.SelectOptions[i].PropertyName
                                    ] = values;
                                }
                            }
                        }
                        return oCrossAppNavigationService.toExternal(oNavArguments);
                    } else {
                        var oError = new NavError(
                            "NavigationHandler.isIntentSupported.notSupported"
                        );
                        that.fnHandleError(oError);
                    }
                })
                    .then(function () {
                        oLogger.error("Could not get authorization from isIntentSupported");
                    });
            });
        },

        doIntentBasedNavigation: function (oContext, oIntent, oUrlWithIntent, sNavMode) {
            if (!sNavMode) {
                sNavMode = OVPUtils.constants.inplace;
            }
            var oComponentData = this.oCardComponent && this.oCardComponent.getComponentData();
            if (oComponentData && oComponentData.appComponent && oComponentData.appComponent.ovpConfig && oComponentData.appComponent.ovpConfig.isTeamsModeActive) {
                sNavMode = OVPUtils.constants.explace;
            }
            //Navigation handler constructor uses ushell container to retrieve app
            //services, without container the instance creation will fall with error
            if (sap.ushell && !sap.ushell.Container) {
                return;
            }
            var oParameters, 
                oAllData,
                oEntity = oContext ? oContext.getObject() : null;

            //For Analytical card Custom Navigation only
            var oCardPropertiesModel = this.getCardPropertiesModel(),
                sCustomParams = oCardPropertiesModel.getProperty("/customParams");
            if (oContext && typeof oContext.getAllData === "function" && sCustomParams) {
                //This is for custom navigation of analytical card to pass data apart from bound dimensions
                oAllData = oContext.getAllData();
            } else if (oCardPropertiesModel.getProperty("/staticContent")) {
                oAllData = {
                    iStaticLinkListIndex: oIntent.iStaticLinkListIndex,
                    bStaticLinkListIndex: true
                };
            }
            if (oEntity && oEntity.__metadata) {
                delete oEntity.__metadata;
            }

            var oNavigationHandler = CommonUtils.getNavigationHandler();
            if (oNavigationHandler) {
                if (oIntent) {
                    var oComponentData = this.getOwnerComponent().getComponentData();
                    var oEntityType = this.getEntityType();
                    var oMainComponent = this.oMainComponent;
                    var oModel = this.getModel();
                    var oMacroFilterBar = oComponentData.mainComponent && oComponentData.mainComponent.oMacroFilterBar;
                    var that = this;
                    if (oMacroFilterBar) {
                        CardsNavigationhelper.getEntityNavigationParameters(
                            oMainComponent,
                            oModel,
                            oComponentData, 
                            oCardPropertiesModel, 
                            oEntityType, 
                            oEntity, 
                            oAllData, 
                            oContext
                        ).then(function (oParameters) { 
                            that.handleNavigation(oParameters, oIntent, oUrlWithIntent, sNavMode, oNavigationHandler);
                        });
                    } else {
                        oParameters = CardsNavigationhelper.getEntityNavigationParameters(
                            oMainComponent,
                            oModel,
                            oComponentData, 
                            oCardPropertiesModel, 
                            oEntityType, 
                            oEntity, 
                            oAllData, 
                            oContext
                        ); //oAllData is only for the case of custom navigation in analytical card
                        this.handleNavigation(oParameters, oIntent, oUrlWithIntent, sNavMode, oNavigationHandler);
                    }
                }
            }
        },

        handleNavigation: function(oParameters, oIntent, oUrlWithIntent, sNavMode, oNavigationHandler) {
            var fnHandleError = this.fnHandleError;
            var oNavArguments = {
                target: {
                    semanticObject: oIntent.semanticObject,
                    action: oIntent.action
                },
                appSpecificRoute: oIntent.appSpecificRoute,
                params: oParameters.sNavSelectionVariant
            };
            var oAppExternalData = {};
            //Create inner data only if presentation variant is present
            if (oParameters.sNavPresentationVariant) {
                oAppExternalData.presentationVariant = oParameters.sNavPresentationVariant;
            }
            if (oUrlWithIntent) {
                if (oIntent && oIntent.semanticObject && oIntent.action) {
                    var oParams = this.getCardPropertiesModel().getProperty("/staticParameters");
                    oNavArguments.params = !!oParams ? oParams : {};
                    this.doCrossApplicationNavigation(oIntent, oNavArguments);
                }
            } else {
                oNavigationHandler.navigate(
                    oNavArguments.target.semanticObject,
                    oNavArguments.target.action,
                    oNavArguments.params,
                    null,
                    fnHandleError,
                    oAppExternalData,
                    sNavMode
                );
            }
        },

        doAction: function (oContext, action) {
            this.actionData = ActionUtils.getActionInfo(oContext, action, this.getEntityType());
            if (this.actionData.allParameters.length > 0) {
                this._loadParametersForm();
            } else {
                CardsNavigationhelper.callFunction(this.actionData);
            }
        },

        getModel: function () {
            if (this.getView()) {
                return this.getView().getModel();
            }
        },

        getMetaModel: function () {
            if (this.getModel()) {
                return this.getModel().getMetaModel();
            }
        },

        getCardPropertiesModel: function () {
            if (!this.oCardPropertiesModel || isEmptyObject(this.oCardPropertiesModel)) {
                this.oCardPropertiesModel = this.getView().getModel("ovpCardProperties");
            }
            return this.oCardPropertiesModel;
        },
        getCardContentContainer: function () {
            if (!this.cardContentContainer) {
                this.cardContentContainer = this.getView().byId("ovpCardContentContainer");
            }
            return this.cardContentContainer;
        },

        _loadParametersForm: function () {
            var oParameterModel = new JSONModel();
            oParameterModel.setData(this.actionData.parameterData);
            var that = this;

            // first create dialog
            var oParameterDialog = new Dialog("ovpCardActionDialog", {
                title: this.actionData.sFunctionLabel,
                afterClose: function () {
                    oParameterDialog.destroy();
                }
            }).addStyleClass("sapUiNoContentPadding");

            // action button (e.g. BeginButton)
            var actionButton = new Button({
                text: this.actionData.sFunctionLabel,
                press: function (oEvent) {
                    var mParameters = ActionUtils.getParameters(
                        oEvent.getSource().getModel(),
                        that.actionData.oFunctionImport
                    );
                    oParameterDialog.close();
                    CardsNavigationhelper.callFunction(that.actionData, mParameters);
                }
            });

            // cancel button (e.g. EndButton)
            var cancelButton = new Button({
                text: "Cancel",
                press: function () {
                    oParameterDialog.close();
                }
            });
            // assign the buttons to the dialog
            oParameterDialog.setBeginButton(actionButton);
            oParameterDialog.setEndButton(cancelButton);

            // preparing a callback function which will be invoked on the Form's Fields-change
            var onFieldChangeCB = function (oEvent) {
                var missingMandatory = ActionUtils.mandatoryParamsMissing(
                    oEvent.getSource().getModel(),
                    that.actionData.oFunctionImport
                );
                actionButton.setEnabled(!missingMandatory);
            };

            // get the form assign it the Dialog and open it
            var oForm = ActionUtils.buildParametersForm(this.actionData, onFieldChangeCB);

            oParameterDialog.addContent(oForm);
            oParameterDialog.setModel(oParameterModel);
            oParameterDialog.open();
        },

        /**
         * In case of error card implementation can call this method to display
         * card error state.
         * Current instance of the card will be destroied and instead loading card
         * will be presenetd with the 'Cannot load card' meassage
         */
        setErrorState: function () {
            //get the current card component
            var oCurrentCard = this.getOwnerComponent();
            //If oCurrentCard is undefined, it means the original card has been created and the loading card
            //has been destroyed.
            //Thus, there is no need of creating an error card on top of the loading card.
            if (!oCurrentCard || !oCurrentCard.oContainer) {
                return;
            }
            //get the component container
            var oComponentContainer = oCurrentCard.oContainer;
            //prepare card configuration, i.e. category, title, description and entitySet
            //which are required for the loading card. in addition set the card state to error
            //so no loading indicator will be presented
            var oCardPropertiesModel = this.getCardPropertiesModel();
            var oComponentConfig = {
                name: "sap.ovp.cards.loading",
                componentData: {
                    model: this.getView().getModel(),
                    settings: {
                        category: oCardPropertiesModel.getProperty("/category"),
                        title: oCardPropertiesModel.getProperty("/title"),
                        description: oCardPropertiesModel.getProperty("/description"),
                        entitySet: oCardPropertiesModel.getProperty("/entitySet"),
                        state: OVPUtils.loadingState.ERROR,
                        template: oCardPropertiesModel.getProperty("/template")
                    }
                }
            };
            //create the loading card
            CoreComponent.create(oComponentConfig).then(function (oLoadingCard) {
                //set the loading card in the container
                oComponentContainer.setComponent(oLoadingCard);
                //destroy the current card
                setTimeout(function () {
                    oCurrentCard.destroy();
                }, 0);
            });
        },

        changeSelection: function (selectedKey, bAdaptUIMode, oCardProperties) {
            //Selected key will be provided for bAdaptUIMode= true case.
            //get the index of the combo box
            if (!bAdaptUIMode) {
                var oDropdown = this.getView().byId("ovp_card_dropdown");
                selectedKey = parseInt(oDropdown.getSelectedKey(), 10);
                if (this.getView()) {
                    this.getView().getModel("ui").setProperty("/bSelectionChanged", true);
                }
            }

            var oTabValue = {};
            if (!bAdaptUIMode) {
                //update the card properties
                oTabValue = this.getCardPropertiesModel().getProperty("/tabs")[selectedKey - 1];
            } else {
                oTabValue = oCardProperties.tabs[selectedKey - 1];
            }
            var oUpdatedCardProperties = {
                cardId: this.getOwnerComponent().getComponentData().cardId,
                selectedKey: selectedKey
            };
            for (var prop in oTabValue) {
                oUpdatedCardProperties[prop] = oTabValue[prop];
            }

            if (OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                OVPCardAsAPIUtils.recreateCard(
                    oUpdatedCardProperties,
                    this.getOwnerComponent().getComponentData()
                );
            } else {
                this.getOwnerComponent()
                    .getComponentData()
                    .mainComponent.recreateCard(oUpdatedCardProperties);
                this.getOwnerComponent()
                    .getComponentData()
                    .mainComponent.setOrderedCardsSelectedKey(
                        this.getOwnerComponent().getComponentData().cardId,
                        selectedKey
                    );
            }
        },

        /**
         * Calculate the offset height of any card component(e.g- header, footer, container, toolbar or each item)
         *
         * @method getItemHeight
         * @param {Object} oGenCardCtrl - Card controller
         * @param {String} sCardComponentId - Component id which height is to be calculated
         * @return {Object} iHeight- Height of the component
         */
        getItemHeight: function (oGenCardCtrl, sCardComponentId, bFlag) {
            if (!!oGenCardCtrl) {
                var aAggregation = oGenCardCtrl.getView().byId(sCardComponentId);
                var iHeight = 0;
                //Null check as some cards does not contain toolbar or footer.
                if (!!aAggregation) {
                    if (bFlag) {
                        //if the height is going to be calculated for any item like <li> in List or <tr> in Table card
                        if (
                            aAggregation.getItems()[0] &&
                            aAggregation.getItems()[0].getDomRef()
                        ) {
                            iHeight = jUtils.getOuterHeight(
                                aAggregation.getItems()[0].getDomRef()
                            );
                        }
                    } else {
                        if (aAggregation.getDomRef()) {
                            iHeight = jUtils.getOuterHeight(aAggregation.getDomRef());
                        }
                    }
                }
                return iHeight;
            }
        },

        getEntitySet: function () {
            if (!this.entitySet) {
                var sEntitySet = this.getCardPropertiesModel().getProperty("/entitySet");

                if (CommonUtils.isODataV4(this.getView().getModel())) {
                    this.entitySet = this.getMetaModel() && this.getMetaModel().getObject("/" + sEntitySet);
                } else {
                    this.entitySet = this.getMetaModel().getODataEntitySet && this.getMetaModel().getODataEntitySet(sEntitySet);
                }
            }
            return this.entitySet;
        },

        getEntityType: function () {
            if (!this.entityType) {
                if (CommonUtils.isODataV4(this.getView().getModel())) {
                    var oMetaModel = this.getMetaModel();
                    var oEntitySet = this.getEntitySet();
                    if (oMetaModel && oEntitySet) {
                        var oEntitySetAnnotations = oMetaModel.getData().$Annotations[oEntitySet.$Type];
                        var oEntitySetProperties = {
                            property: oMetaModel.getObject("/" + oEntitySet.$Type + "/")
                        };
                        this.entityType = OVPUtils.merge(true, {}, oEntitySetAnnotations, oEntitySetProperties);
                    }
                } else {
                    if (this.getMetaModel() && this.getEntitySet()) {
                        this.entityType = this.getMetaModel().getODataEntityType(
                            this.getEntitySet().entityType
                        );
                    }
                }
            }
            return this.entityType;
        },
        _handleKPIHeader: function() {
            if (CommonUtils.isODataV4(this.getView().getModel())) {
                this._handleKPIHeaderForODataV4();
            } else {
                this._handleKPIHeaderForODataV2();
            }
        },
        _handleKPIHeaderForODataV2: function () {
            var kpiHeader, subTitle;
            if (this.getView() && this.getView().getDomRef()) {
                kpiHeader = this.getView()
                    .getDomRef()
                    .getElementsByClassName("numericContentHbox");
                subTitle = this.getView().getDomRef().getElementsByClassName("noDataSubtitle");
            } else {
                return;
            }
            if (kpiHeader || subTitle) {
                var oKPIBinding = this.getKPIBinding();
                if (oKPIBinding) {
                    oKPIBinding.attachDataReceived(
                        function (oEvent) {
                            var UoM =
                                oEvent.getParameter("data") &&
                                oEvent.getParameter("data").results &&
                                oEvent.getParameter("data").results[0];
                            var iTotal = oKPIBinding.getLength();
                            if (kpiHeader[0]) {
                                kpiHeader[0].style.visibility = null;
                                if (iTotal === 0) {
                                    this._setSubTitleWithUnitOfMeasureForODataV2(UoM, false);
                                    kpiHeader[0].style.visibility = "hidden";
                                } else {
                                    this._setSubTitleWithUnitOfMeasureForODataV2(UoM, true);
                                    kpiHeader[0].style.visibility = "visible";
                                }
                            }
                            if (subTitle.length !== 0) {
                                subTitle[0].style.display = "none";
                                if (iTotal === 0) {
                                    subTitle[0].style.display = "flex";
                                }
                            }
                        }.bind(this)
                    );
                }
            }
        },
        _handleKPIHeaderForODataV4: function () {
            var kpiHeader, subTitle;
            if (this.getView() && this.getView().getDomRef()) {
                kpiHeader = this.getView().getDomRef().getElementsByClassName("numericContentHbox");
                subTitle = this.getView().getDomRef().getElementsByClassName("noDataSubtitle");
            } else {
                return;
            }
            if (kpiHeader || subTitle) {
                var oKPIBinding = this.getKPIBinding();
                if (oKPIBinding) {
                    oKPIBinding.attachDataReceived(
                        function (oEvent) {
                            var oDataSet = oEvent.getSource().getCurrentContexts()
                                .map(function (context) {
                                    return context && context.getObject();
                                })[0];
                            var iTotal = oKPIBinding.getLength();
                            if (kpiHeader[0]) {
                                kpiHeader[0].style.visibility = null;
                                if (iTotal === 0) {
                                    kpiHeader[0].style.visibility = "hidden";
                                } else {
                                    this._setSubTitleWithUnitOfMeasureForODataV4(oDataSet);
                                    kpiHeader[0].style.visibility = "visible";
                                }
                            }
                            if (subTitle.length !== 0) {
                                subTitle[0].style.display = "none";
                                if (iTotal === 0) {
                                    subTitle[0].style.display = "flex";
                                }
                            }
                        }.bind(this)
                    );
                }
            }
        },
        /*
         *  SubTitle with unit of measure
         */
        _setSubTitleWithUnitOfMeasureForODataV2: function (UoM, bHasData) {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            if (!!oCardPropertiesModel) {
                var oData = oCardPropertiesModel.getData();
                var oSubtitleTextView = this.getView().byId("SubTitle-Text");
                var sUoMPath = "";
                if (!!oSubtitleTextView) {
                    oSubtitleTextView.setText(oData.subTitle);
                    if (!!oData && !!oData.entityType && !!oData.dataPointAnnotationPath && bHasData) {
                        var oEntityType = oCardPropertiesModel.getData().entityType;
                        var oDataPointAnnotationPathSplit =
                            oData.dataPointAnnotationPath.split("/");
                        var oDataPoint =
                            oDataPointAnnotationPathSplit.length === 1
                                ? oEntityType[oData.dataPointAnnotationPath]
                                : oEntityType[oDataPointAnnotationPathSplit[0]][
                                oDataPointAnnotationPathSplit[1]
                                ];
                        var measure;
                        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.Path) {
                            measure = oDataPoint.Value.Path;
                        } else if (
                            oDataPoint &&
                            oDataPoint.Description &&
                            oDataPoint.Description.Value &&
                            oDataPoint.Description.Value.Path
                        ) {
                            measure = oDataPoint.Description.Value.Path;
                        }
                        if (!!measure) {
                            var sPath = CommonUtils.getUnitColumn(measure, oEntityType);
                            var unitOfMeasure;
                            if (!!sPath && !!UoM) {
                                sUoMPath = sPath;
                                unitOfMeasure = UoM[sPath];
                            } else {
                                unitOfMeasure = CommonUtils.getUnitColumn(
                                    measure,
                                    oEntityType,
                                    true
                                );
                                sUoMPath = unitOfMeasure;
                            }
                            if (oCardPropertiesModel.getProperty("/bInsightEnabled")) {
                                AnalyticalCardHelper.setUoMForSubTitle(
                                    oCardPropertiesModel.getData().cardId,
                                    sUoMPath
                                );
                            }
                            var subTitleInText = OvpResources.getText("SubTitle_IN");
                            if (!!oData.subTitle && !!subTitleInText && !!unitOfMeasure) {
                                oSubtitleTextView.setText(
                                    oData.subTitle + " " + subTitleInText + " " + unitOfMeasure
                                );
                                var aCustomData =
                                    oSubtitleTextView.getAggregation("customData");
                                if (aCustomData) {
                                    var index;
                                    for (index in aCustomData) {
                                        var oCustomData = aCustomData[index];
                                        if (oCustomData.getKey() === "aria-label") {
                                            oCustomData.setValue(
                                                oData.subTitle +
                                                " " +
                                                subTitleInText +
                                                " " +
                                                unitOfMeasure
                                            );
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        /*
         *  SubTitle with unit of measure
         */
        _setSubTitleWithUnitOfMeasureForODataV4: function (oDataSet) {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            if (!!oCardPropertiesModel) {
                var oData = oCardPropertiesModel.getData();
                var oSubtitleTextView = this.getView().byId("SubTitle-Text");
                var sUoMPath = "";
                if (!!oSubtitleTextView) {
                    oSubtitleTextView.setText(oData.subTitle);
                    if (!!oData && !!oData.entityType && !!oData.dataPointAnnotationPath) {
                        var oEntityType = this.getEntityType();
                        var oDataPointAnnotationPathSplit = oData.dataPointAnnotationPath.split("/");
                        var oDataPoint =
                            oDataPointAnnotationPathSplit.length === 1
                                ? oEntityType['@' + oData.dataPointAnnotationPath]
                                : oEntityType['@' + oDataPointAnnotationPathSplit[0]]['@' + oDataPointAnnotationPathSplit[1]];
                        var sMeasure;
                        if (oDataPoint && oDataPoint.Value && oDataPoint.Value.$Path) {
                            sMeasure = oDataPoint.Value.$Path;
                        } else if (
                            oDataPoint &&
                            oDataPoint.Description &&
                            oDataPoint.Description.Value &&
                            oDataPoint.Description.Value.$Path
                        ) {
                            sMeasure = oDataPoint.Description.Value.$Path;
                        }
                        var oMetaModel = this.getMetaModel();
                        var oEntitySet = this.getEntitySet();
                        var sEntitySetName = V4MetadataAnalyzer.getEntitySetName(oMetaModel, oEntitySet.$Type);
                        if (!!sMeasure) {
                            var sPath = CommonUtils.getUnitColumnForODataV4(sMeasure, oMetaModel, sEntitySetName);
                            var sUnitOfMeasure;
                            if (!!sPath && !!oDataSet) {
                                sUoMPath = sPath;
                                sUnitOfMeasure = oDataSet[sPath];
                            } else {
                                sUnitOfMeasure = CommonUtils.getUnitColumnForODataV4(sMeasure, oMetaModel, sEntitySetName, true);
                                sUoMPath = sUnitOfMeasure;
                            }
                            if (oCardPropertiesModel.getProperty("/bInsightEnabled")) {
                                AnalyticalCardHelper.setUoMForSubTitle(
                                    oCardPropertiesModel.getData().cardId,
                                    sUoMPath
                                );
                            }
                            var sSubTitleInText = OvpResources.getText("SubTitle_IN");
                            if (!!oData.subTitle && !!sSubTitleInText && !!sUnitOfMeasure) {
                                oSubtitleTextView.setText(
                                    oData.subTitle + " " + sSubTitleInText + " " + sUnitOfMeasure
                                );
                                var aCustomData = oSubtitleTextView.getAggregation("customData");
                                if (aCustomData) {
                                    var index;
                                    for (index in aCustomData) {
                                        var oCustomData = aCustomData[index];
                                        if (oCustomData.getKey() === "aria-label") {
                                            oCustomData.setValue(
                                                oData.subTitle + " " + sSubTitleInText + " " + sUnitOfMeasure
                                            );
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },


        /**
         * Method to return the height of the header component
         *
         * @method getHeaderHeight
         * @return {Integer} iHeaderHeight - Height of the header component
         */
        getHeaderHeight: function () {
            var iHeight = this.getItemHeight(this, "ovpCardHeader"),
                oCompData = this.getOwnerComponent()
                    ? this.getOwnerComponent().getComponentData()
                    : null;
            if (oCompData && oCompData.appComponent) {
                var oDashboardLayoutUtil = oCompData.appComponent.getDashboardLayoutUtil(),
                    oCard = oDashboardLayoutUtil
                        .getDashboardLayoutModel()
                        .getCardById(oCompData.cardId);
                if (iHeight !== 0) {
                    oCard.dashboardLayout.headerHeight = iHeight;
                }
            }
            return iHeight;
        },

        /**
         * Opens up a popover to show additional actions on card header
         * @param {sap.ui.base.Event} oEvent
         * @returns
         */
        onShowAdditionalCardActions: function (oEvent) {
            var oSource = oEvent.getSource();
            oEvent.cancelBubble();

            if (!this.additionalCardActionsMenu) {
                this.additionalCardActionsMenu = Fragment.load({
                    id: this.getView().getId(),
                    name: "sap.ovp.cards.generic.HeaderActions",
                    controller: this
                }).then(function (oMenu) {
                    this.getView().addDependent(oMenu);
                    return oMenu;
                }.bind(this));
            }
            var that = this;
            this.additionalCardActionsMenu.then(function (oMenu) {
                // Handle enablement of Add Card To Insights button
                var oView = that.getView(),
                    oAddCardToInsightButton = oView.byId("ovpAddToInsightButton"),
                    IsButtonEnabled = oAddCardToInsightButton && oAddCardToInsightButton.getEnabled();
                if (!IsButtonEnabled && that.bdataLoadedToEnableAddToInsight) {
                    oAddCardToInsightButton.setEnabled(true);
                }
                oMenu.openBy(oSource);
            });
        },

        /**
         * Checks if the card has at least one IBN action
         * @returns {boolean} true if at least one IBN action exists, false otherwise
         */
        checkIBNNavigationExistsForCard: function() {
            var oCardPropsModel = this.getCardPropertiesModel(),
                oEntityType = this.getEntityType(),
                sContentFragment = oCardPropsModel.getProperty("/contentFragment"),
                oEntityModel = this.getView().getModel();

            if (oCardPropsModel && oEntityType && sContentFragment) {
                var aTargetCardFragments = ["sap.ovp.cards.list.List",  "sap.ovp.cards.v4.list.List", "sap.ovp.cards.table.Table", "sap.ovp.cards.v4.table.Table"];
                if (aTargetCardFragments.includes(sContentFragment)) {
                    var IsHeaderNavigable = NavigationHelper.checkIdentificationAnnotationNavigation(oCardPropsModel, oEntityType, oEntityModel),
                        IsLineItemNavigable = NavigationHelper.checkLineItemNavigation(oCardPropsModel, oEntityType, oEntityModel);
    
                    return IsHeaderNavigable || IsLineItemNavigable;
                } 

                if (sContentFragment === "sap.ovp.cards.charts.analytical.analyticalChart" || sContentFragment === "sap.ovp.cards.v4.charts.analytical.analyticalChart") {
                    var bHeaderNavExistsForChart = CardsNavigationhelper.checkHeaderNavigationDisabledForAnalyticalCard(oCardPropsModel),
                        bIdentificationAnnotationExists = NavigationHelper.checkIdentificationAnnotationNavigation(oCardPropsModel, oEntityType, oEntityModel),
                        bKPINavigationExists = NavigationHelper.checkKPIAnnotationNavigation(oCardPropsModel, oEntityType),
                        bIsHeaderNavigable = bHeaderNavExistsForChart && bIdentificationAnnotationExists;
    
                    return bIsHeaderNavigable || bIdentificationAnnotationExists || bKPINavigationExists;
                }
            }
            return false;
        },

        /**
         * Save generated card manifest based on insight RT/DT mode
         * @param {object} oCardManifestConfiguration Generated card manifest
         */
        saveGeneratedCardManifest: function (oCardManifestConfiguration) {
            var sCardId = this.oCardComponentData.cardId,
                iSelectedKey = this.oCardComponentData.settings.selectedKey,
                oCardView = this.getView(),
                oOvpCardProperties = oCardView.getModel("ovpCardProperties"),
                bInsightDTEnabled = oOvpCardProperties && oOvpCardProperties.getProperty('/bInsightDTEnabled');
                
            if (bInsightDTEnabled) {
                var sKey = iSelectedKey ? sCardId + "/tab_" + iSelectedKey : sCardId;
                jQuery.ajax({
                    type: "POST",
                    url: "/editor/card/" + sKey + "/manifest",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(oCardManifestConfiguration),
                    success: function (oResponse) {
                        oLogger.info("Success:", oResponse);
                    },
                    error: function (oError) {
                        oLogger.error("Error:", oError);
                    }
                });
            }
        },

        refreshCardContent: function() {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            if (oCardPropertiesModel) {
                var template = oCardPropertiesModel.getProperty("/template");
                if (template && !template.startsWith("sap.ovp.cards")) {
                    if (typeof this.onRefresh === "function") {
                        //Extension for refresh of custom card.
                        this.onRefresh();
                    }
                    return;
                }
            }
            if (this.getKPIBinding()) {
                this.getKPIBinding().refresh();
            }
            if (this.getCardItemsBinding()) {
                this.getCardItemsBinding().refresh();
            }
        },

        /**
         * Method to open manage cards dialog
         * @method onCardManage
         */
        onCardManage: function () {
            this.oMainComponent.oManageCardsUtils.onManageCardsMenuButtonPress();
        }
    });
});
